import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { HERO_MINIMAL_DETAIL_THIRTY_ONE_BATCH, HERO_MINIMAL_DETAIL_THIRTY_ONE_BATCH_PATH, HERO_MINIMAL_DETAIL_THIRTY_ONE_BATCH_PUBLICATION_PATH, renderHeroMinimalDetailThirtyOneBatch, validateHeroMinimalDetailThirtyOneBatch, validateHeroMinimalDetailThirtyOneBatchPublication } from './hero-minimal-detail-thirty-one-batch-contract.mjs';

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const [decision, heroIdentities, heroLocalizations, relations, equipmentIdentities, equipmentLocalizations, generatedText] = await Promise.all([
  readJson(HERO_MINIMAL_DETAIL_THIRTY_ONE_BATCH_PUBLICATION_PATH), readJson('canonical/hero-identities.v1.json'), readJson('canonical/hero-localizations-ko.v1.json'),
  readJson('canonical/hero-exclusive-equipment-relations.v1.json'), readJson('canonical/exclusive-equipment.v1.json'), readJson('canonical/exclusive-equipment-localizations-ko.v1.json'), readFile(HERO_MINIMAL_DETAIL_THIRTY_ONE_BATCH_PATH, 'utf8'),
]);
const paths = { heroIdentity: 'canonical/hero-identities.v1.json', heroLocalization: 'canonical/hero-localizations-ko.v1.json', equipmentRelation: 'canonical/hero-exclusive-equipment-relations.v1.json', equipmentIdentity: 'canonical/exclusive-equipment.v1.json', equipmentLocalization: 'canonical/exclusive-equipment-localizations-ko.v1.json' };
const sourceHashes = Object.fromEntries(await Promise.all(Object.entries(paths).map(async ([key, path]) => [key, createHash('sha256').update(await readFile(path)).digest('hex')])));
const inputs = { decision, heroIdentities, heroLocalizations, relations, equipmentIdentities, equipmentLocalizations, sourceHashes };
const output = validateHeroMinimalDetailThirtyOneBatch({ generatedText, inputs });
assert.deepEqual(output.heroes.map(({ heroId }) => heroId), HERO_MINIMAL_DETAIL_THIRTY_ONE_BATCH.map(({ heroId }) => heroId));
assert.deepEqual(output.heroes.map(({ exclusiveEquipment }) => exclusiveEquipment.equipmentId), HERO_MINIMAL_DETAIL_THIRTY_ONE_BATCH.map(({ equipmentId }) => equipmentId));
assert.equal(new Set(output.heroes.map(({ heroId }) => heroId)).size, 31);
assert.equal(new Set(output.heroes.map(({ exclusiveEquipment }) => exclusiveEquipment.equipmentId)).size, 31);
assert.throws(() => validateHeroMinimalDetailThirtyOneBatchPublication({ ...structuredClone(decision), status: 'NOT_APPROVED' }), /approval or exact scope/);
assert.throws(() => validateHeroMinimalDetailThirtyOneBatchPublication({ ...structuredClone(decision), approval: { ...decision.approval, source: { ...decision.approval.source, quote: 'AI quoted text' } } }), /approval or exact scope/);
assert.throws(() => validateHeroMinimalDetailThirtyOneBatchPublication({ ...structuredClone(decision), approvedScope: { ...decision.approvedScope, heroes: decision.approvedScope.heroes.map((hero, index) => index === 0 ? { ...hero, equipmentId: 510 } : hero) } }), /approval or exact scope/);
assert.throws(() => validateHeroMinimalDetailThirtyOneBatchPublication({ ...structuredClone(decision), approvedScope: { ...decision.approvedScope, heroes: decision.approvedScope.heroes.slice(0, 30) } }), /approval or exact scope/);
assert.throws(() => validateHeroMinimalDetailThirtyOneBatchPublication({ ...structuredClone(decision), approvedScope: { ...decision.approvedScope, fields: [...decision.approvedScope.fields, 'rarity'] } }), /approval or exact scope/);
assert.throws(() => renderHeroMinimalDetailThirtyOneBatch({ ...inputs, sourceHashes: { ...sourceHashes, equipmentRelation: '0'.repeat(64) } }), /source hash changed/);
assert.throws(() => renderHeroMinimalDetailThirtyOneBatch({ ...inputs, sourceHashes: { ...sourceHashes, equipmentLocalization: '0'.repeat(64) } }), /source hash changed/);
assert.throws(() => renderHeroMinimalDetailThirtyOneBatch({ ...inputs, heroLocalizations: { ...heroLocalizations, records: heroLocalizations.records.map((row) => row.heroId === HERO_MINIMAL_DETAIL_THIRTY_ONE_BATCH[0].heroId ? { ...row, nameKo: '잘못된 이름' } : row) } }), /Korean name differs/);
assert.throws(() => renderHeroMinimalDetailThirtyOneBatch({ ...inputs, relations: { ...relations, records: relations.records.map((row) => row.equipmentId === HERO_MINIMAL_DETAIL_THIRTY_ONE_BATCH[0].equipmentId ? { ...row, heroId: 59 } : row) } }), /approved relation must resolve exactly once/);
assert.throws(() => renderHeroMinimalDetailThirtyOneBatch({ ...inputs, relations: { ...relations, records: relations.records.map((row) => row.equipmentId === HERO_MINIMAL_DETAIL_THIRTY_ONE_BATCH[0].equipmentId ? { ...row, provenance: [{ ...row.provenance[0], field: 'OtherField' }] } : row) } }), /provenance is not the exact approved source field/);
assert.throws(() => renderHeroMinimalDetailThirtyOneBatch({ ...inputs, equipmentIdentities: { ...equipmentIdentities, records: equipmentIdentities.records.filter(({ equipmentId }) => equipmentId !== HERO_MINIMAL_DETAIL_THIRTY_ONE_BATCH[0].equipmentId) } }), /Equipment 534 Identity must resolve exactly once/);
assert.throws(() => renderHeroMinimalDetailThirtyOneBatch({ ...inputs, equipmentLocalizations: { ...equipmentLocalizations, records: equipmentLocalizations.records.map((row) => row.equipmentId === HERO_MINIMAL_DETAIL_THIRTY_ONE_BATCH[1].equipmentId ? { ...row, nameKo: 'wrong' } : row) } }), /localization differs/);
const withForbiddenField = JSON.parse(generatedText); withForbiddenField.heroes[0].rarity = 3;
assert.throws(() => validateHeroMinimalDetailThirtyOneBatch({ generatedText: `${JSON.stringify(withForbiddenField, null, 2)}\n`, inputs }), /stale or non-deterministic/);
assert.throws(() => validateHeroMinimalDetailThirtyOneBatch({ generatedText: `${generatedText}\n`, inputs }), /stale or non-deterministic/);
const duplicateHero = structuredClone(heroIdentities); duplicateHero.records.push(structuredClone(duplicateHero.records.find(({ heroId }) => heroId === HERO_MINIMAL_DETAIL_THIRTY_ONE_BATCH[0].heroId)));
assert.throws(() => renderHeroMinimalDetailThirtyOneBatch({ ...inputs, heroIdentities: duplicateHero }), /Hero 99164 Identity must resolve exactly once/);
const duplicateEquipment = structuredClone(equipmentIdentities); duplicateEquipment.records.push(structuredClone(duplicateEquipment.records.find(({ equipmentId }) => equipmentId === HERO_MINIMAL_DETAIL_THIRTY_ONE_BATCH[0].equipmentId)));
assert.throws(() => renderHeroMinimalDetailThirtyOneBatch({ ...inputs, equipmentIdentities: duplicateEquipment }), /Equipment 534 Identity must resolve exactly once/);
process.stdout.write('Hero Minimal Detail thirty-one batch boundaries: PASS (approval, exact 31 scope, fields, hashes, identity/localization/relation/equipment, duplicates, stale output)\n');
