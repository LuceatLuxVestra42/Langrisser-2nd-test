import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { HERO_MINIMAL_DETAIL_TEN_BATCH, HERO_MINIMAL_DETAIL_TEN_BATCH_PATH, HERO_MINIMAL_DETAIL_TEN_BATCH_PUBLICATION_PATH, renderHeroMinimalDetailBatch, validateHeroMinimalDetailBatch, validateHeroMinimalDetailBatchPublication } from './hero-minimal-detail-ten-batch-contract.mjs';

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const [decision, heroIdentities, heroLocalizations, relations, equipmentIdentities, equipmentLocalizations, generatedText] = await Promise.all([
  readJson(HERO_MINIMAL_DETAIL_TEN_BATCH_PUBLICATION_PATH), readJson('canonical/hero-identities.v1.json'), readJson('canonical/hero-localizations-ko.v1.json'),
  readJson('canonical/hero-exclusive-equipment-relations.v1.json'), readJson('canonical/exclusive-equipment.v1.json'), readJson('canonical/exclusive-equipment-localizations-ko.v1.json'), readFile(HERO_MINIMAL_DETAIL_TEN_BATCH_PATH, 'utf8'),
]);
const paths = { heroIdentity: 'canonical/hero-identities.v1.json', heroLocalization: 'canonical/hero-localizations-ko.v1.json', equipmentRelation: 'canonical/hero-exclusive-equipment-relations.v1.json', equipmentIdentity: 'canonical/exclusive-equipment.v1.json', equipmentLocalization: 'canonical/exclusive-equipment-localizations-ko.v1.json' };
const sourceHashes = Object.fromEntries(await Promise.all(Object.entries(paths).map(async ([key, path]) => [key, createHash('sha256').update(await readFile(path)).digest('hex')])));
const inputs = { decision, heroIdentities, heroLocalizations, relations, equipmentIdentities, equipmentLocalizations, sourceHashes };
const output = validateHeroMinimalDetailBatch({ generatedText, inputs });
assert.deepEqual(output.heroes.map(({ heroId }) => heroId), [31, 34, 35, 36, 38, 39, 49, 51, 54, 57]);
assert.deepEqual(output.heroes.map(({ exclusiveEquipment }) => exclusiveEquipment.equipmentId), [434, 297, 425, 414, 455, 411, 429, 293, 490, 472]);
assert.throws(() => validateHeroMinimalDetailBatchPublication({ ...structuredClone(decision), status: 'NOT_APPROVED' }), /approval or exact scope/);
assert.throws(() => renderHeroMinimalDetailBatch({ ...inputs, decision: { ...structuredClone(decision), approvedScope: { ...decision.approvedScope, heroes: decision.approvedScope.heroes.slice(0, 4) } } }), /approval or exact scope/);
assert.throws(() => renderHeroMinimalDetailBatch({ ...inputs, sourceHashes: { ...sourceHashes, equipmentRelation: '0'.repeat(64) } }), /source hash changed/);
assert.throws(() => renderHeroMinimalDetailBatch({ ...inputs, heroLocalizations: { ...heroLocalizations, records: heroLocalizations.records.map((row) => row.heroId === 31 ? { ...row, nameKo: '잘못된 이름' } : row) } }), /Korean name differs/);
assert.throws(() => renderHeroMinimalDetailBatch({ ...inputs, relations: { ...relations, records: relations.records.map((row) => row.equipmentId === 434 ? { ...row, heroId: 34 } : row) } }), /approved relation must resolve exactly once/);
assert.throws(() => renderHeroMinimalDetailBatch({ ...inputs, equipmentIdentities: { ...equipmentIdentities, records: equipmentIdentities.records.filter(({ equipmentId }) => equipmentId !== 297) } }), /Equipment 297 Identity must resolve exactly once/);
assert.throws(() => renderHeroMinimalDetailBatch({ ...inputs, equipmentLocalizations: { ...equipmentLocalizations, records: equipmentLocalizations.records.map((row) => row.equipmentId === 425 ? { ...row, nameKo: 'wrong' } : row) } }), /localization differs/);
const extraField = JSON.parse(generatedText);
extraField.heroes[0].rarity = 3;
assert.throws(() => validateHeroMinimalDetailBatch({ generatedText: `${JSON.stringify(extraField, null, 2)}\n`, inputs }), /stale or non-deterministic/);
assert.throws(() => validateHeroMinimalDetailBatch({ generatedText: `${generatedText}\n`, inputs }), /stale or non-deterministic/);
const duplicateHero = structuredClone(heroIdentities); duplicateHero.records.push(duplicateHero.records.find(({heroId})=>heroId===31));
assert.throws(() => renderHeroMinimalDetailBatch({ ...inputs, heroIdentities: duplicateHero }), /Hero 31 Identity must resolve exactly once/);
const duplicateEquipment = structuredClone(equipmentIdentities); duplicateEquipment.records.push(duplicateEquipment.records.find(({equipmentId})=>equipmentId===434));
assert.throws(() => renderHeroMinimalDetailBatch({ ...inputs, equipmentIdentities: duplicateEquipment }), /Equipment 434 Identity must resolve exactly once/);
for (const { heroId } of HERO_MINIMAL_DETAIL_TEN_BATCH) assert.ok(output.heroes.some(({ heroId: id }) => id === heroId));
console.log('Hero Minimal Detail ten batch boundaries: PASS (approval, exact ten scope, source hashes, identity/localization/relation/equipment, forbidden fields, stale output)');
