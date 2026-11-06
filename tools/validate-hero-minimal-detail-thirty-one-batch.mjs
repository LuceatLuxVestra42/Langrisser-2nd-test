import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { HERO_MINIMAL_DETAIL_THIRTY_ONE_BATCH_PATH, HERO_MINIMAL_DETAIL_THIRTY_ONE_BATCH_PUBLICATION_PATH, renderHeroMinimalDetailThirtyOneBatch, validateHeroMinimalDetailThirtyOneBatch, validateHeroMinimalDetailThirtyOneBatchPublication } from './hero-minimal-detail-thirty-one-batch-contract.mjs';

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const [decision, heroIdentities, heroLocalizations, relations, equipmentIdentities, equipmentLocalizations] = await Promise.all([
  readJson(HERO_MINIMAL_DETAIL_THIRTY_ONE_BATCH_PUBLICATION_PATH), readJson('canonical/hero-identities.v1.json'), readJson('canonical/hero-localizations-ko.v1.json'),
  readJson('canonical/hero-exclusive-equipment-relations.v1.json'), readJson('canonical/exclusive-equipment.v1.json'), readJson('canonical/exclusive-equipment-localizations-ko.v1.json'),
]);
const paths = { heroIdentity: 'canonical/hero-identities.v1.json', heroLocalization: 'canonical/hero-localizations-ko.v1.json', equipmentRelation: 'canonical/hero-exclusive-equipment-relations.v1.json', equipmentIdentity: 'canonical/exclusive-equipment.v1.json', equipmentLocalization: 'canonical/exclusive-equipment-localizations-ko.v1.json' };
const sourceHashes = Object.fromEntries(await Promise.all(Object.entries(paths).map(async ([key, path]) => [key, createHash('sha256').update(await readFile(path)).digest('hex')])));
const inputs = { decision, heroIdentities, heroLocalizations, relations, equipmentIdentities, equipmentLocalizations, sourceHashes };
validateHeroMinimalDetailThirtyOneBatchPublication(decision);
const generatedText = await readFile(HERO_MINIMAL_DETAIL_THIRTY_ONE_BATCH_PATH, 'utf8');
const generated = validateHeroMinimalDetailThirtyOneBatch({ generatedText, inputs });
if (renderHeroMinimalDetailThirtyOneBatch(inputs) !== generatedText) throw new Error('Thirty-One-Hero consumer regeneration parity failed');
process.stdout.write(`Hero Minimal Detail thirty-one batch: PASS (${generated.heroes.length} exact approved Heroes; Canonical hashes, exact Relation provenance, and deterministic output)\n`);
