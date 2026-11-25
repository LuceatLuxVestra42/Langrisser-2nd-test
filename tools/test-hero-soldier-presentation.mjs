import { projectApprovedFullDetailRecords } from './full-detail-public-population-contract.mjs';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadPublicSoldierPopulation } from './validate-sp-soldier-relation.mjs';
import { renderHeroSoldierRelations } from './generate.mjs';
import { validateHeroSoldierPresentation } from './validate-hero-soldier-presentation.mjs';

const readJson = async (path) => JSON.parse(await readFile(resolve(path), 'utf8'));
const [canonical, relationOwner, { identities: soldierIdentities }, generatedText, publication] = await Promise.all([
  readJson('canonical/heroes.v1.json'),
  readJson('canonical/hero-soldier-relations.v1.json'),
  loadPublicSoldierPopulation(),
  readFile(resolve('generated/hero-soldier-relations.v1.json'), 'utf8'),
  readJson('docs/decisions/hero-index-publication.v1.json'),
]);
const heroPresentation = { ...canonical, records: projectApprovedFullDetailRecords(canonical, publication) };
const result = validateHeroSoldierPresentation(heroPresentation, relationOwner, soldierIdentities, generatedText);
assert.equal(result.rows, 379);
assert.equal(result.distinctSoldiers, 112);

const source = JSON.parse(generatedText);
const encode = (relations) => JSON.stringify({ schemaVersion: 1, relations }, null, 2) + '\n';
assert.throws(() => validateHeroSoldierPresentation(
  heroPresentation, relationOwner, soldierIdentities, encode(source.relations.slice(1)),
), 'missing candidate relation must fail');
assert.throws(() => validateHeroSoldierPresentation(
  heroPresentation, relationOwner, soldierIdentities, encode([...source.relations, source.relations[0]]),
), 'duplicate generated pair must fail');

assert.throws(() => validateHeroSoldierPresentation(
  heroPresentation, relationOwner, soldierIdentities,
  encode([...source.relations, { heroId: 999999, soldierId: source.relations[0].soldierId }]),
), 'unknown-Hero generated relation must fail');

const outOfScope = relationOwner.records.find(({ heroId }) => heroId === 15);
assert.ok(outOfScope);
assert.throws(() => validateHeroSoldierPresentation(
  heroPresentation, relationOwner, soldierIdentities,
  encode([...source.relations, { heroId: outOfScope.heroId, soldierId: outOfScope.soldierId }]),
), 'out-of-slice relation must fail');

assert.throws(() => validateHeroSoldierPresentation(
  heroPresentation, relationOwner, soldierIdentities,
  encode(source.relations.map((relation, index) => index === 0 ? { ...relation, soldierId: -1 } : relation)),
), 'invalid Soldier endpoint must fail');

const nonTarget = { ...relationOwner, records: relationOwner.records.map((row, index) =>
  index === 0 ? { ...row, soldierId: 999999 } : row) };
assert.throws(() => renderHeroSoldierRelations(heroPresentation, nonTarget, soldierIdentities), /references missing Soldier 999999/);
assert.throws(() => validateHeroSoldierPresentation(heroPresentation, nonTarget, soldierIdentities, generatedText),
  /candidate Soldier endpoint 999999/);

console.log('Hero-Soldier generated presentation regressions PASS (missing, duplicate, unknown-Hero and invalid-endpoint cases)');
