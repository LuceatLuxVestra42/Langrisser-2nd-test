import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { renderHeroSoldierRelations } from './generate.mjs';

const invariantHeroCounts = new Map([[5, 19], [6, 15], [8, 20], [53, 18]]);
const invariantHeroIds = [...invariantHeroCounts.keys()];
const invariantRowCount = 72;
const check = (condition, message) => { if (!condition) throw new Error('Hero-Soldier presentation validation failed: ' + message); };
const exactKeys = (value, expected, label) => check(
  isDeepStrictEqual(Object.keys(value).sort(), [...expected].sort()),
  label + ' has unexpected or missing fields',
);
const pairKey = ({ heroId, soldierId }) => heroId + ':' + soldierId;

export function validateHeroSoldierPresentation(heroPresentation, relationOwner, soldierIdentities, generatedText) {
  check(heroPresentation?.schemaVersion === 1 && Array.isArray(heroPresentation.records), 'unsupported Hero presentation population owner');
  check(relationOwner?.schemaVersion === 1 && Array.isArray(relationOwner.records), 'unsupported canonical Hero-Soldier relation owner');
  check(soldierIdentities?.schemaVersion === 1 && Array.isArray(soldierIdentities.records), 'unsupported canonical Soldier identity owner');

  const heroIds = heroPresentation.records.map(({ id }) => id);
  check(heroIds.every(Number.isInteger) && new Set(heroIds).size === heroIds.length, 'Hero presentation owner has malformed or duplicate IDs');
  const heroIdSet = new Set(heroIds);
  const soldierIds = soldierIdentities.records.filter((record) => record.entity === 'Soldier').map(({ id }) => id);
  check(soldierIds.every(Number.isInteger) && new Set(soldierIds).size === soldierIds.length, 'Soldier identity owner has malformed or duplicate Soldier IDs');
  const soldierIdSet = new Set(soldierIds);

  const candidatePairs = relationOwner.records
    .filter((relation) => heroIdSet.has(relation.heroId))
    .map(({ heroId, soldierId }) => ({ heroId, soldierId }))
    .sort((a, b) => a.heroId - b.heroId || a.soldierId - b.soldierId);
  const sourcePairKeys = candidatePairs.map(pairKey);
  check(new Set(sourcePairKeys).size === sourcePairKeys.length, 'canonical candidate subset contains duplicate Hero-Soldier pairs');

  const candidateHeroIds = [...new Set(candidatePairs.map(({ heroId }) => heroId))].sort((a, b) => a - b);
  check(JSON.stringify(candidateHeroIds) === JSON.stringify(invariantHeroIds),
    'SCOPE_CONTRADICTION: current candidate Hero scope differs from [5,6,8,53]');
  const countsByHero = new Map(candidateHeroIds.map((heroId) => [heroId, candidatePairs.filter((pair) => pair.heroId === heroId).length]));
  check(candidatePairs.length === invariantRowCount
    && invariantHeroIds.every((heroId) => countsByHero.get(heroId) === invariantHeroCounts.get(heroId)),
  'SCOPE_CONTRADICTION: owner-derived subset differs from expected 72 / 19·15·20·18');

  const canonicalPairKeys = new Set(sourcePairKeys);
  for (const relation of candidatePairs) {
    check(heroIdSet.has(relation.heroId), 'candidate Hero endpoint is absent from current Hero presentation population');
    check(soldierIdSet.has(relation.soldierId), 'candidate Soldier endpoint ' + relation.soldierId + ' is absent from canonical Soldier identity');
  }

  const expectedArtifact = { schemaVersion: 1, relations: candidatePairs };
  const expectedText = JSON.stringify(expectedArtifact, null, 2) + '\n';
  const firstRender = renderHeroSoldierRelations(heroPresentation, relationOwner, soldierIdentities);
  const secondRender = renderHeroSoldierRelations(heroPresentation, relationOwner, soldierIdentities);
  check(firstRender === secondRender, 'producer is non-deterministic for identical current owner inputs');
  check(firstRender === expectedText, 'producer output differs from independently derived current owner subset');

  let generated;
  try {
    generated = JSON.parse(generatedText);
  } catch {
    throw new Error('Hero-Soldier presentation validation failed: generated artifact is not valid JSON');
  }
  exactKeys(generated, ['schemaVersion', 'relations'], 'generated artifact');
  check(generated.schemaVersion === 1 && Array.isArray(generated.relations), 'unsupported generated artifact schema');
  for (const relation of generated.relations) {
    exactKeys(relation, ['heroId', 'soldierId'], 'generated relation');
    check(Number.isInteger(relation.heroId) && Number.isInteger(relation.soldierId), 'generated relation has malformed endpoint');
    check(heroIdSet.has(relation.heroId), 'generated Hero endpoint is outside current Hero presentation population');
    check(soldierIdSet.has(relation.soldierId), 'generated Soldier endpoint is absent from canonical Soldier identity');
    check(canonicalPairKeys.has(pairKey(relation)), 'generated pair is absent from canonical Hero-Soldier relation owner');
  }
  const generatedPairKeys = generated.relations.map(pairKey);
  check(new Set(generatedPairKeys).size === generatedPairKeys.length, 'generated artifact contains duplicate Hero-Soldier pairs');
  check(isDeepStrictEqual(generated.relations, candidatePairs), 'generated relation pairs differ from the owner-derived candidate subset');
  check(generatedText === expectedText, 'tracked generated artifact is stale or has non-deterministic serialization');

  return {
    rows: candidatePairs.length,
    distinctSoldiers: new Set(candidatePairs.map(({ soldierId }) => soldierId)).size,
    countsByHero: Object.fromEntries(countsByHero),
  };
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  const readJson = async (path) => JSON.parse(await readFile(resolve(path), 'utf8'));
  const [heroPresentation, relationOwner, soldierIdentities, generatedText] = await Promise.all([
    readJson('canonical/heroes.v1.json'),
    readJson('canonical/hero-soldier-relations.v1.json'),
    readJson('canonical/soldiers.v1.json'),
    readFile(resolve('generated/hero-soldier-relations.v1.json'), 'utf8'),
  ]);
  const result = validateHeroSoldierPresentation(heroPresentation, relationOwner, soldierIdentities, generatedText);
  process.stdout.write(
    `Hero-Soldier presentation: PASS (${result.rows} owner-derived rows; ${result.distinctSoldiers} distinct Soldier IDs; exact subset, endpoints, determinism and freshness)\n`,
  );
}
