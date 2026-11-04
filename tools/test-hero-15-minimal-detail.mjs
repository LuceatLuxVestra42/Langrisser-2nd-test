import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { HERO_15_INTEGRATED_PUBLICATION_PATH, HERO_15_MINIMAL_DETAIL_PATH, renderHero15MinimalDetail, validateHero15MinimalDetail } from './hero-15-integrated-publication-contract.mjs';

const read = async (path) => JSON.parse(await readFile(path, 'utf8'));
const [decision, heroIdentities, heroLocalizations, relations, equipmentIdentities, equipmentLocalizations, generatedText, heroIndex, heroSlice] = await Promise.all([
  read(HERO_15_INTEGRATED_PUBLICATION_PATH), read('canonical/hero-identities.v1.json'),
  read('canonical/hero-localizations-ko.v1.json'), read('canonical/hero-exclusive-equipment-relations.v1.json'),
  read('canonical/exclusive-equipment.v1.json'), read('canonical/exclusive-equipment-localizations-ko.v1.json'),
  readFile(HERO_15_MINIMAL_DETAIL_PATH, 'utf8'), read('generated/hero-index.v1.json'), read('generated/hero-slice.v1.json'),
]);
const sourceHashes = Object.fromEntries(await Promise.all([
  ['heroIdentity', 'canonical/hero-identities.v1.json'],
  ['heroLocalization', 'canonical/hero-localizations-ko.v1.json'],
  ['equipmentRelation', 'canonical/hero-exclusive-equipment-relations.v1.json'],
  ['equipmentIdentity', 'canonical/exclusive-equipment.v1.json'],
  ['equipmentLocalization', 'canonical/exclusive-equipment-localizations-ko.v1.json'],
].map(async ([key, path]) => [key, createHash('sha256').update(await readFile(path)).digest('hex')])));
const inputs = { decision, heroIdentities, heroLocalizations, relations, equipmentIdentities, equipmentLocalizations, sourceHashes };
const generated = validateHero15MinimalDetail({ generatedText, inputs });
assert.deepEqual(generated.heroes.map(({ heroId }) => heroId), [15]);
assert.deepEqual(Object.keys(generated.heroes[0]).sort(), ['exclusiveEquipment', 'heroId', 'nameKo']);
assert.deepEqual(Object.keys(generated.heroes[0].exclusiveEquipment).sort(), ['effectDescriptionKo', 'equipmentId', 'nameKo']);
assert.equal(generated.heroes[0].exclusiveEquipment.equipmentId, 535);
assert.equal(generated.heroes[0].nameKo, '리아나');
assert.equal(heroIndex.heroes.length, 267);
assert.equal(heroSlice.heroes.length, 29);

const fails = (mutate, pattern) => {
  const changed = structuredClone(inputs);
  mutate(changed);
  assert.throws(() => renderHero15MinimalDetail(changed), pattern);
};
fails((x) => { x.decision.status = 'NOT_APPROVED'; }, /approval or scope/);
fails((x) => { x.decision.approvedScope.minimalDetail.fields.push('rarity'); }, /approval or scope/);
fails((x) => { x.heroIdentities.records = x.heroIdentities.records.filter(({ heroId }) => heroId !== 15); }, /exact approved claims/);
fails((x) => { x.heroLocalizations.records.find(({ heroId }) => heroId === 15).nameKo = '잘못된 이름'; }, /exact approved claims/);
fails((x) => { x.relations.records = x.relations.records.filter(({ heroId }) => heroId !== 15); }, /exact approved claims/);
fails((x) => { x.relations.records.push({ heroId: 15, equipmentId: 536 }); }, /exact approved claims/);
fails((x) => { x.equipmentIdentities.records = x.equipmentIdentities.records.filter(({ equipmentId }) => equipmentId !== 535); }, /exact approved claims/);
fails((x) => { x.equipmentLocalizations.records.find(({ equipmentId }) => equipmentId === 535).effectDescriptionKo = ''; }, /exact approved claims/);
fails((x) => { x.sourceHashes.equipmentRelation = '0'.repeat(64); }, /source hash changed/);
assert.throws(() => validateHero15MinimalDetail({ generatedText: generatedText.replace('리아나', '다른 이름'), inputs }), /stale or non-deterministic/);
const extraField = structuredClone(generated);
extraField.heroes[0].rarity = { rankId: 3 };
assert.throws(() => validateHero15MinimalDetail({ generatedText: `${JSON.stringify(extraField, null, 2)}\n`, inputs }), /stale or non-deterministic/);
const duplicated = structuredClone(generated);
duplicated.heroes.push(structuredClone(duplicated.heroes[0]));
assert.throws(() => validateHero15MinimalDetail({ generatedText: `${JSON.stringify(duplicated, null, 2)}\n`, inputs }), /stale or non-deterministic/);
process.stdout.write('Hero 15 Minimal Detail regression: PASS (publication, ID, relation, localization, equipment, fields, duplication, stale output, and preserved populations)\n');
