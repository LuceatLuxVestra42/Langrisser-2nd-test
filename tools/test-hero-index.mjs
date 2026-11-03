import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderHeroIndex } from './generate.mjs';
import { validateHeroIndexData } from './validate-hero-index.mjs';

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const [identity, localization, approval, currentGenerated, heroSlice] = await Promise.all([
  readJson('canonical/hero-identities.v1.json'),
  readJson('canonical/hero-localizations-ko.v1.json'),
  readJson('docs/decisions/hero-index-publication.v1.json'),
  readJson('generated/hero-index.v1.json'),
  readJson('generated/hero-slice.v1.json'),
]);
const currentGeneratedText = await readFile('generated/hero-index.v1.json', 'utf8');
const validationInput = { identity, localization, approval, heroSlice, generatedText: currentGeneratedText };

const output = renderHeroIndex(identity, localization, approval);
assert.equal(output, `${JSON.stringify(currentGenerated, null, 2)}\n`, 'Hero Index generation is deterministic and current');
assert.equal(currentGenerated.schemaVersion, 1);
assert.equal(currentGenerated.heroes.length, 267);
assert.deepEqual(currentGenerated.heroes.map(({ heroId }) => heroId), approval.approvedScope.heroIds);
assert.ok(currentGenerated.heroes.every((row) => JSON.stringify(Object.keys(row).sort()) === '["heroId","nameKo"]'));
assert.deepEqual(approval.approvedScope.detailHeroIds, heroSlice.heroes.map(({ id }) => id).sort((a, b) => a - b));

const rejected = (label, change, pattern = /Hero Index/) => {
  const input = {
    identity: structuredClone(identity),
    localization: structuredClone(localization),
    approval: structuredClone(approval),
  };
  change(input);
  assert.throws(() => renderHeroIndex(input.identity, input.localization, input.approval), pattern, label);
};

rejected('missing approved ID', (x) => { x.approval.approvedScope.heroIds.pop(); });
rejected('unapproved extra ID', (x) => { x.approval.approvedScope.heroIds.push(999999); });
rejected('duplicate approved ID', (x) => { x.approval.approvedScope.heroIds[1] = x.approval.approvedScope.heroIds[0]; });
rejected('out-of-order approved IDs', (x) => { [x.approval.approvedScope.heroIds[0], x.approval.approvedScope.heroIds[1]] = [x.approval.approvedScope.heroIds[1], x.approval.approvedScope.heroIds[0]]; });
rejected('missing Canonical Identity', (x) => { x.identity.records.pop(); });
rejected('extra Canonical Identity', (x) => { x.identity.records.push({ heroId: 999999 }); });
rejected('missing Localization', (x) => { x.localization.records.pop(); });
rejected('extra Localization', (x) => { x.localization.records.push({ heroId: 999999, nameKo: '초과' }); });
rejected('duplicate Localization', (x) => { x.localization.records.push(structuredClone(x.localization.records[0])); });
rejected('blank Korean display label', (x) => { x.localization.records[0].nameKo = '  '; });
rejected('changed approved Korean display label', (x) => { x.localization.records[0].nameKo += ' 변경'; }, /snapshot hash mismatch/);
rejected('claimed official KR provenance', (x) => { x.localization.officialKrProvenanceStatus = 'verified'; });
rejected('expanded public field set', (x) => { x.approval.approvedScope.fields.push('portrait'); });
rejected('expanded publication surface', (x) => { x.approval.approvedScope.surfaces.push('HERO_DETAIL'); });
rejected('changed authorization source locator status', (x) => { x.approval.approval.source.messageIdStatus = 'VERIFIED'; });
rejected('unexpected approval field', (x) => { x.approval.approvedScope.unapprovedField = true; });

assert.equal(heroSlice.heroes.length, 29, 'existing detailed Hero population remains 29');
assert.deepEqual(approval.approvedScope.detailHeroIds, heroSlice.heroes.map(({ id }) => id).sort((a, b) => a - b),
  'only exact existing Hero Slice IDs are authorized as detail endpoints');
assert.deepEqual(validateHeroIndexData(validationInput), { indexCount: 267, detailCount: 29 });
const badDetailApproval = structuredClone(approval);
badDetailApproval.approvedScope.detailHeroIds.push(999999);
assert.throws(() => validateHeroIndexData({ ...validationInput, approval: badDetailApproval }), /detail endpoint IDs|detail-link allowlist/,
  'unapproved detail target is rejected');
const missingDetailSlice = structuredClone(heroSlice);
missingDetailSlice.heroes.pop();
assert.throws(() => validateHeroIndexData({ ...validationInput, heroSlice: missingDetailSlice }), /detail-link allowlist/,
  'missing detail endpoint is rejected');
const extraFieldConsumer = structuredClone(currentGenerated);
extraFieldConsumer.heroes[0].portrait = 'assets/portraits/hero-1.png';
assert.throws(() => validateHeroIndexData({ ...validationInput, generatedText: `${JSON.stringify(extraFieldConsumer, null, 2)}\n` }), /stale or non-deterministic/,
  'unapproved public field is rejected');
const badNameConsumer = structuredClone(currentGenerated);
badNameConsumer.heroes[0].nameKo = '잘못된 이름';
assert.throws(() => validateHeroIndexData({ ...validationInput, generatedText: `${JSON.stringify(badNameConsumer, null, 2)}\n` }), /stale or non-deterministic/,
  'Generated name mismatch is rejected');
process.stdout.write('Hero Index generation regression: PASS (267 exact ID/name rows; 19 negative controls; existing 29 detail IDs preserved)\n');
