import assert from 'node:assert/strict';
import {
  parseHeroLocalizationSource,
  readHeroKoLocalizationInputs,
  validateHeroKoLocalization,
} from './validate-hero-ko-localization.mjs';

const args = await readHeroKoLocalizationInputs();
const expectedIds = [...args.sourceManifest.targetIds];
const expectedIdSet = [...expectedIds].sort((a, b) => a - b);
const result = validateHeroKoLocalization(args);
assert.equal(result.localizedCount, expectedIds.length);
assert.deepEqual([...result.heroIds].sort((a, b) => a - b), expectedIdSet);
assert.equal(result.officialKrProvenanceStatus, 'unverified');

assert.throws(() => parseHeroLocalizationSource('甲 - 갑\n甲 - 을'), /duplicate Chinese localization key/);
assert.throws(() => parseHeroLocalizationSource('not a delimited record'), /malformed localization source row/);
const rejected = (label, edit, pattern) => {
  const input = structuredClone(args);
  edit(input);
  assert.throws(() => validateHeroKoLocalization(input), pattern, label);
};
const targetIds = [...args.sourceManifest.targetIds];
const firstId = targetIds[0];
const lastId = targetIds.at(-1);
const extraId = Math.max(...targetIds) + 1;
const rowFor = (rows, id) => rows.find(row => row.heroId === id);

rejected('duplicate target ID', x => { x.sourceManifest.targetIds[1] = firstId; }, /duplicate target Hero ID/);
rejected('missing declared target', x => { x.sourceManifest.targetIds.pop(); }, /selected source locator count mismatch|target declaration\/selected rows mismatch/);
rejected('extra declared target', x => { x.sourceManifest.targetIds.push(extraId); }, /selected source locator count mismatch|target declaration\/selected rows mismatch|direct ConfigData target ID set mismatch/);
rejected('identity endpoint missing', x => {
  x.sourceManifest.targetIds[0] = 999999;
  x.sourceManifest.selectedRows[0].heroId = 999999;
}, /target Hero ID is absent from the existing identity owner/);
rejected('missing direct source record', x => { x.heroInfoRecords.pop(); }, /direct ConfigData target ID set mismatch/);
rejected('extra direct source record', x => { x.heroInfoRecords.push({ ...x.heroInfoRecords[0], ID: extraId }); }, /direct ConfigData target ID set mismatch/);
rejected('duplicate direct source ID', x => { x.heroInfoRecords[x.heroInfoRecords.length - 1].ID = x.heroInfoRecords[0].ID; }, /duplicate direct ConfigData Hero ID/);
rejected('Chinese key mismatch', x => { x.heroInfoRecords[0].Name = '不存在的中文名'; }, /ConfigData Chinese Name mismatch|localization source has no exact Chinese key/);
rejected('Korean value mismatch', x => { rowFor(x.canonical.records, firstId).nameKo += 'X'; }, /canonical localization\/provenance mismatch/);
rejected('evidence missing', x => { x.evidence.records.pop(); }, /Hero localization evidence target ID set mismatch/);
rejected('evidence extra', x => { x.evidence.records.push({ ...x.evidence.records[0], heroId: extraId }); }, /Hero localization evidence target ID set mismatch/);
rejected('canonical missing', x => { x.canonical.records.pop(); }, /Hero localization canonical target ID set mismatch/);
rejected('canonical extra', x => { x.canonical.records.push({ ...x.canonical.records[0], heroId: extraId }); }, /Hero localization canonical target ID set mismatch/);
rejected('selected locator malformed', x => { rowFor(x.sourceManifest.selectedRows, firstId).sourceLine = 0; }, /malformed selected source locator/);
rejected('official provenance overstated', x => { x.canonical.officialKrProvenanceStatus = 'official'; }, /official Korean-server provenance was overstated/);
rejected('reference bytes changed', x => { x.sourceText += '\n甲 - 갑'; }, /source hash or byte count mismatch/);
rejected('identity count changed', x => { x.heroIdentities.records.pop(); }, /Hero identity population count changed/);
rejected('identity duplicate', x => { x.heroIdentities.records[0].heroId = x.heroIdentities.records[1].heroId; }, /duplicate Hero identity ID/);

process.stdout.write('Hero Korean localization data-driven negatives: PASS (target declaration, source, identity, evidence, canonical, provenance)\n');
