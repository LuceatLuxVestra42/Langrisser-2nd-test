import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const evidencePath = 'evidence/source/hero-faction.v1.json';
const relationPath = 'canonical/hero-faction-relations.v1.json';
const heroIdentityPath = 'canonical/hero-identities.v1.json';
const factionIdentityPath = 'canonical/faction-identities.v1.json';
const expectedByHero = new Map([
  [5, [1, 2, 6]], [6, [4, 7]], [8, [5, 6]], [28, [5, 8, 11]],
  [32, [4, 7]], [52, [6, 8, 9]], [53, [7, 9]],
]);
const expectedEvidenceByHero = new Map([
  [1, [1, 2]],
  [3, [2]],
  [4, [1, 2, 11]],
  [5, [1, 2, 6]],
  [6, [4, 7]],
  [7, [4, 5, 11]],
  [8, [5, 6]],
  [9, [5, 11]],
  [10, [1, 2]],
  [11, [2, 6, 8]],
  [12, [1, 2, 4]],
  [13, [2, 4]],
  [14, [2, 6, 8]],
  [25, [4, 5, 7]],
  [26, [6, 7]],
  [27, [1, 8]],
  [28, [5, 8, 11]],
  [29, [1, 6]],
  [32, [4, 7]],
  [33, [6]],
  [37, [8, 11]],
  [52, [6, 8, 9]],
  [53, [7, 9]],
  [55, [1, 9]],
  [56, [1, 9]],
  [60, [1, 8, 9]],
  [67, [5, 8]],
  [89, [2, 6, 11]],
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
    && canonical.scope === 'Explicit CN ConfigData Hero-to-Faction memberships for the 28 Heroes covered by the cited source evidence; not a completeness claim beyond that evidence scope and not an admission to the seven-Hero presentation slice.'
    && canonical.sourceEvidence === evidencePath
    && canonical.membershipField === 'RelatedHeros_ID', 'canonical scope or provenance pointer drift');
  exactKeys(heroes, ['schemaVersion', 'scope', 'records'], 'Hero identity owner');
  check(heroes.schemaVersion === 1 && Array.isArray(heroes.records), 'unsupported Hero identity owner');
  const heroIds = new Set(heroes.records.map((record) => record.heroId));
  for (const heroId of expectedByHero.keys()) check(heroIds.has(heroId), `Hero endpoint ${heroId} missing from identity owner`);
  const factionIds = new Set(factions.records.map((record) => record.factionId));
  check(isDeepStrictEqual(evidence.scope?.heroIds, [...expectedEvidenceByHero.keys()]), 'source evidence Hero scope drift');
  check(isDeepStrictEqual(evidence.scope?.factionIds, [...factionIds].sort((a, b) => a - b)), 'source evidence Faction scope drift');
  check(isDeepStrictEqual(evidence.records.map(({ ID }) => ID), [...factionIds].sort((a, b) => a - b)), 'source evidence Faction records drift');
  check(evidence.source?.commit === '6475e63ee23d18adf733756c26a14fa9e3ed662c'
    && evidence.source?.sourcePath === 'data/configdata/ConfigDataHeroTagInfo.json'
    && evidence.source?.sourceFileSha256 === '545e662920cde9f379ac03e15632e970d8a530bf2821e4dbeddc21d0f4ce4a91', 'Faction source identity drift');
  for (const heroId of expectedEvidenceByHero.keys()) check(heroIds.has(heroId), `source evidence Hero endpoint ${heroId} missing from identity owner`);

  const sourceByFaction = new Map(evidence.records.map((record) => [record.ID, record]));
  check(sourceByFaction.size === evidence.records.length, 'duplicate source Faction ID');
  const sourcePairs = new Set();
  for (const [factionId, row] of sourceByFaction) {
    check(Array.isArray(row.RelatedHeros_ID), `missing source membership list for faction ${factionId}`);
    for (const heroId of row.RelatedHeros_ID) {
      if (expectedEvidenceByHero.has(heroId)) sourcePairs.add(pairKey(heroId, factionId));
    }
  }
  const expectedEvidencePairs = new Set([...expectedEvidenceByHero].flatMap(([heroId, factionIdsForHero]) => factionIdsForHero.map((factionId) => pairKey(heroId, factionId))));
  check(isDeepStrictEqual(sourcePairs, expectedEvidencePairs), 'source RelatedHeros_ID target projection differs from the exact evidence-scoped relation set');
  const expectedPairs = new Set([...expectedByHero].flatMap(([heroId, factionIdsForHero]) => factionIdsForHero.map((factionId) => pairKey(heroId, factionId))));

  check(Array.isArray(canonical.records) && canonical.records.length === expectedEvidencePairs.size, 'relation count must be exactly 65 for the current evidence-backed Canonical scope');
  const canonicalPairs = new Set();
  for (const record of canonical.records) {
    exactKeys(record, ['heroId', 'factionId', 'provenance'], `relation ${record.heroId}:${record.factionId}`);
    check(expectedEvidenceByHero.has(record.heroId), `Hero endpoint ${record.heroId} is out of scope`);
    check(heroIds.has(record.heroId), `unknown Hero endpoint ${record.heroId}`);
    check(factionIds.has(record.factionId), `unknown Faction endpoint ${record.factionId}`);
    const key = pairKey(record.heroId, record.factionId);
    check(expectedEvidencePairs.has(key) && !canonicalPairs.has(key), `unexpected or duplicate relation ${key}`);
    const source = sourceByFaction.get(record.factionId);
    check(source.RelatedHeros_ID.includes(record.heroId), `relation ${key} is not present in source RelatedHeros_ID`);
    check(record.provenance === `${evidencePath}#ID=${record.factionId}/RelatedHeros_ID&contains=${record.heroId}`, `relation source locator drift for ${key}`);
    canonicalPairs.add(key);
  }
  check(isDeepStrictEqual(canonicalPairs, expectedEvidencePairs), 'canonical relation edge set differs from exact 65-edge evidence-backed set');
  for (const [heroId, factionIdsForHero] of expectedByHero) {
    for (const factionId of factionIdsForHero) check(canonicalPairs.has(pairKey(heroId, factionId)), `visible Hero ${heroId} presentation relation ${factionId} is missing`);
  }
  process.stdout.write('Hero–Faction relation owner: PASS (28 Canonical Heroes, 65 admitted edges; relation evidence unchanged)\n');
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) await validateHeroFactionRelations();
