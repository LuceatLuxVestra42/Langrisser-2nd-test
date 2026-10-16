import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

const evidencePath = 'evidence/source/hero-faction.v1.json';
const relationPath = 'canonical/hero-faction-relations.v1.json';
const heroIdentityPath = 'canonical/hero-identities.v1.json';
const factionIdentityPath = 'canonical/faction-identities.v1.json';
const expectedByHero = new Map([
  [5, [1, 2, 6]], [6, [4, 7]], [8, [5, 6]], [28, [5, 8, 11]],
  [32, [4, 7]], [52, [6, 8, 9]], [53, [7, 9]],
]);
const pairKey = (heroId, factionId) => `${heroId}:${factionId}`;
const fail = (message) => { throw new Error(`Hero–Faction relation validation failed: ${message}`); };
const check = (condition, message) => { if (!condition) fail(message); };
const exactKeys = (value, fields, label) => {
  check(value !== null && typeof value === 'object' && !Array.isArray(value), `${label} must be an object`);
  check(isDeepStrictEqual(Object.keys(value).sort(), [...fields].sort()), `${label} fields drift`);
};

export async function validateHeroFactionRelations(root = process.cwd()) {
  const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
  const [evidence, canonical, heroes, factions] = await Promise.all([
    readJson(evidencePath), readJson(relationPath), readJson(heroIdentityPath), readJson(factionIdentityPath),
  ]);
  check(evidence.schemaVersion === 1 && evidence.evidenceClass === 'A'
    && evidence.semantics?.membershipField === 'RelatedHeros_ID'
    && evidence.semantics?.excludedField?.name === 'SuperHero_ID', 'membership source must be RelatedHeros_ID; SuperHero_ID is excluded');
  exactKeys(canonical, ['schemaVersion', 'scope', 'sourceEvidence', 'membershipField', 'records'], 'relation canonical');
  check(canonical.schemaVersion === 1
    && canonical.scope === 'Explicit CN ConfigData Hero-to-Faction membership for the seven-Hero presentation slice only; not a completeness claim beyond this slice.'
    && canonical.sourceEvidence === evidencePath
    && canonical.membershipField === 'RelatedHeros_ID', 'canonical scope or provenance pointer drift');
  exactKeys(heroes, ['schemaVersion', 'scope', 'records'], 'Hero identity owner');
  check(heroes.schemaVersion === 1 && Array.isArray(heroes.records), 'unsupported Hero identity owner');
  const heroIds = new Set(heroes.records.map((record) => record.heroId));
  for (const heroId of expectedByHero.keys()) check(heroIds.has(heroId), `Hero endpoint ${heroId} missing from identity owner`);
  const factionIds = new Set(factions.records.map((record) => record.factionId));

  const sourceByFaction = new Map(evidence.records.map((record) => [record.ID, record]));
  const sourcePairs = new Set();
  for (const [factionId, row] of sourceByFaction) {
    check(Array.isArray(row.RelatedHeros_ID), `missing source membership list for faction ${factionId}`);
    for (const heroId of row.RelatedHeros_ID) {
      if (expectedByHero.has(heroId)) sourcePairs.add(pairKey(heroId, factionId));
    }
  }
  const expectedPairs = new Set([...expectedByHero].flatMap(([heroId, factionIdsForHero]) => factionIdsForHero.map((factionId) => pairKey(heroId, factionId))));
  check(isDeepStrictEqual(sourcePairs, expectedPairs), 'source RelatedHeros_ID target projection differs from the exact 17-edge scope');

  check(Array.isArray(canonical.records) && canonical.records.length === expectedPairs.size, 'relation count must be exactly 17');
  const expectedOrderedPairs = [...expectedByHero].flatMap(([heroId, factionIdsForHero]) => factionIdsForHero.map((factionId) => pairKey(heroId, factionId)));
  check(isDeepStrictEqual(canonical.records.map(({ heroId, factionId }) => pairKey(heroId, factionId)), expectedOrderedPairs), 'canonical relation order drift');
  const canonicalPairs = new Set();
  for (const record of canonical.records) {
    exactKeys(record, ['heroId', 'factionId', 'provenance'], `relation ${record.heroId}:${record.factionId}`);
    check(expectedByHero.has(record.heroId), `Hero endpoint ${record.heroId} is out of scope`);
    check(heroIds.has(record.heroId), `unknown Hero endpoint ${record.heroId}`);
    check(factionIds.has(record.factionId), `unknown Faction endpoint ${record.factionId}`);
    const key = pairKey(record.heroId, record.factionId);
    check(expectedPairs.has(key) && !canonicalPairs.has(key), `unexpected or duplicate relation ${key}`);
    const source = sourceByFaction.get(record.factionId);
    check(source.RelatedHeros_ID.includes(record.heroId), `relation ${key} is not present in source RelatedHeros_ID`);
    check(record.provenance === `${evidencePath}#ID=${record.factionId}/RelatedHeros_ID&contains=${record.heroId}`, `relation source locator drift for ${key}`);
    canonicalPairs.add(key);
  }
  check(isDeepStrictEqual(canonicalPairs, expectedPairs), 'canonical relation edge set differs from exact 17-edge set');
  process.stdout.write('Hero–Faction relation owner: PASS (7 Heroes, 17 exact source-backed edges)\n');
}

await validateHeroFactionRelations();
