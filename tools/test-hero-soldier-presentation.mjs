import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { validateHeroSoldierPresentation } from './validate-hero-soldier-presentation.mjs';

const readJson = async (path) => JSON.parse(await readFile(resolve(path), 'utf8'));
const [heroPresentation, relationOwner, soldierIdentities, generatedText] = await Promise.all([
  readJson('canonical/heroes.v1.json'),
  readJson('canonical/hero-soldier-relations.v1.json'),
  readJson('canonical/soldiers.v1.json'),
  readFile(resolve('generated/hero-soldier-relations.v1.json'), 'utf8'),
]);
const result = validateHeroSoldierPresentation(heroPresentation, relationOwner, soldierIdentities, generatedText);
assert.equal(result.rows, 72);
assert.equal(result.distinctSoldiers, 56);

const source = JSON.parse(generatedText);
const encode = (relations) => JSON.stringify({ schemaVersion: 1, relations }, null, 2) + '\n';
assert.throws(() => validateHeroSoldierPresentation(
  heroPresentation, relationOwner, soldierIdentities, encode(source.relations.slice(1)),
), 'missing candidate relation must fail');
assert.throws(() => validateHeroSoldierPresentation(
  heroPresentation, relationOwner, soldierIdentities, encode([...source.relations, source.relations[0]]),
), 'duplicate generated pair must fail');

const presentedHeroIds = new Set(heroPresentation.records.map(({ id }) => id));
const outOfScope = relationOwner.records.find(({ heroId }) => !presentedHeroIds.has(heroId));
assert.ok(outOfScope, 'current relation owner should contain a relation outside the current Hero presentation slice');
assert.throws(() => validateHeroSoldierPresentation(
  heroPresentation, relationOwner, soldierIdentities,
  encode([...source.relations, { heroId: outOfScope.heroId, soldierId: outOfScope.soldierId }]),
), 'out-of-slice relation must fail');

assert.throws(() => validateHeroSoldierPresentation(
  heroPresentation, relationOwner, soldierIdentities,
  encode(source.relations.map((relation, index) => index === 0 ? { ...relation, soldierId: -1 } : relation)),
), 'invalid Soldier endpoint must fail');

console.log('Hero-Soldier generated presentation regressions PASS (missing, duplicate, out-of-slice and invalid-endpoint cases)');
