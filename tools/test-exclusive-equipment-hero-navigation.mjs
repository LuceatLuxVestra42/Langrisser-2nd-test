import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { renderExclusiveEquipmentHeroNavigation, validateExclusiveEquipmentHeroNavigation } from './exclusive-equipment-hero-navigation-contract.mjs';

const read = async (path) => JSON.parse(await readFile(path, 'utf8'));
const [relations, equipmentIdentities, heroIdentities, heroLocalizations, heroSlice, heroIndexPublication, publicationDecision, generatedText, heroLocalizationBytes, heroIdentityBytes] = await Promise.all([
  read('canonical/hero-exclusive-equipment-relations.v1.json'), read('canonical/exclusive-equipment.v1.json'),
  read('canonical/hero-identities.v1.json'), read('canonical/hero-localizations-ko.v1.json'), read('generated/hero-slice.v1.json'),
  read('docs/decisions/hero-index-publication.v1.json'), read('docs/decisions/exclusive-equipment-hero-navigation-publication.v1.json'),
  readFile('generated/exclusive-equipment-hero-navigation.v1.json', 'utf8'),
  readFile('canonical/hero-localizations-ko.v1.json'), readFile('canonical/hero-identities.v1.json'),
]);
const inputs = {
  relations, equipmentIdentities, heroIdentities, heroLocalizations, heroSlice, heroIndexPublication, publicationDecision,
  heroLocalizationSha256: createHash('sha256').update(heroLocalizationBytes).digest('hex'),
  heroIdentitySha256: createHash('sha256').update(heroIdentityBytes).digest('hex'),
};
const output = validateExclusiveEquipmentHeroNavigation({ generatedText, inputs });
assert.equal(output.records.length, 167);
assert.equal(output.records.filter(({ navigationTarget }) => navigationTarget.surface === 'HERO_DETAIL').length, 29);
assert.equal(output.records.filter(({ navigationTarget }) => navigationTarget.surface === 'HERO_INDEX').length, 138);
assert.equal(output.records[0].navigationTarget.fragment.startsWith('hero-'), true);
assert.equal(output.records.find(({ navigationTarget }) => navigationTarget.surface === 'HERO_INDEX').navigationTarget.fragment.startsWith('hero-index-entry-'), true);
assert.equal(new Set(output.records.map(({ equipmentId }) => equipmentId)).size, 167);

const fails = (mutate, pattern) => {
  const altered = structuredClone(inputs);
  mutate(altered);
  assert.throws(() => renderExclusiveEquipmentHeroNavigation(altered), pattern);
};
fails((x) => { x.publicationDecision.status = 'NOT_APPROVED'; }, /unsupported/);
fails((x) => { x.publicationDecision.approval.source.attachmentSha256 = '0'.repeat(64); }, /approval evidence/);
fails((x) => { x.relations.records.push(structuredClone(x.relations.records[0])); }, /relation source differs|167 current Canonical pairs/);
fails((x) => { x.relations.records[0].equipmentId = 999999; }, /source differs|unresolved|exactly match/);
fails((x) => { x.equipmentIdentities.records = x.equipmentIdentities.records.filter(({ equipmentId }) => equipmentId !== x.relations.records[0].equipmentId); }, /exactly match/);
fails((x) => { x.heroIdentities.records = x.heroIdentities.records.filter(({ heroId }) => heroId !== x.relations.records[0].heroId); }, /Unresolved or unpublished/);
fails((x) => { x.heroLocalizationSha256 = '0'.repeat(64); }, /name or identity source differs/);
fails((x) => { x.publicationDecision.approvedScope.relations.pop(); }, /exactly match/);
fails((x) => { x.publicationDecision.approvedScope.detailHeroIds.pop(); }, /target populations/);
fails((x) => { x.publicationDecision.approvedScope.indexHeroIds[0] = -1; }, /target populations/);
fails((x) => { x.heroSlice.heroes = x.heroSlice.heroes.slice(1); }, /existing slice/);
assert.throws(() => validateExclusiveEquipmentHeroNavigation({ generatedText: `${generatedText}\n`, inputs }), /stale or non-deterministic/);
const wrongTarget = JSON.parse(generatedText);
wrongTarget.records[0].navigationTarget.fragment = 'hero-index-entry-999999';
assert.throws(() => validateExclusiveEquipmentHeroNavigation({ generatedText: `${JSON.stringify(wrongTarget, null, 2)}\n`, inputs }), /stale or non-deterministic/);

process.stdout.write('Exclusive Equipment Hero Navigation regression: PASS (167 exact pairs; 29 detail, 138 Index; approval, endpoint, localization, target, and stale-output negatives)\n');
