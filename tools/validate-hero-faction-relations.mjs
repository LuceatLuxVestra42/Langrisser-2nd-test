import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const evidencePath = 'evidence/source/hero-faction.v1.json';
const hero15EvidencePath = 'evidence/source/hero-faction-hero15.v1.json';
const relationPath = 'canonical/hero-faction-relations.v1.json';
const heroIdentityPath = 'canonical/hero-identities.v1.json';
const factionIdentityPath = 'canonical/faction-identities.v1.json';
const expectedByHero = new Map([
  [1, [1, 2]], [3, [2]], [4, [1, 2, 11]], [5, [1, 2, 6]], [6, [4, 7]], [7, [4, 5, 11]],
  [8, [5, 6]], [10, [1, 2]], [11, [2, 6, 8]], [12, [1, 2, 4]], [13, [2, 4]], [14, [2, 6, 8]],
  [25, [4, 5, 7]], [26, [3, 6, 7]], [27, [1, 3, 8]], [28, [5, 8, 11]],
  [32, [4, 7]], [52, [6, 8, 9]], [53, [7, 9]], [55, [1, 9]], [60, [1, 8, 9]], [67, [5, 8]],
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
  [26, [3, 6, 7]],
  [27, [1, 3, 8]],
  [28, [5, 8, 11]],
  [29, [1, 3, 6]],
  [32, [4, 7]],
  [33, [3, 6]],
  [37, [3, 8, 11]],
  [40, [3]],
  [52, [6, 8, 9]],
  [53, [7, 9]],
  [55, [1, 9]],
  [56, [1, 9]],
  [60, [1, 8, 9]],
  [67, [5, 8]],
  [89, [2, 6, 11]],
]);
const EXPECTED_FACTION_3_MEMBERSHIP = [29, 26, 27, 30, 31, 33, 34, 36, 22, 40, 41, 42, 37, 38, 72, 88, 83, 92, 94, 77, 75, 113, 112, 99161, 99174, 99175, 99178, 99179, 99180, 99189, 99192, 99198, 99205, 99219, 99237, 99238, 99239, 99240, 99248, 99249, 99250, 99261, 99263, 99265, 99271, 99274, 99275];
const pairKey = (heroId, factionId) => `${heroId}:${factionId}`;
const fail = (message) => { throw new Error(`Hero–Faction relation validation failed: ${message}`); };
const check = (condition, message) => { if (!condition) fail(message); };
const exactKeys = (value, fields, label) => {
  check(value !== null && typeof value === 'object' && !Array.isArray(value), `${label} must be an object`);
  check(isDeepStrictEqual(Object.keys(value).sort(), [...fields].sort()), `${label} fields drift`);
};

export async function validateHeroFactionRelations(root = process.cwd()) {
  const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
  const [evidence, hero15Evidence, canonical, heroes, factions] = await Promise.all([
    readJson(evidencePath), readJson(hero15EvidencePath), readJson(relationPath), readJson(heroIdentityPath), readJson(factionIdentityPath),
  ]);
  check(evidence.schemaVersion === 1 && evidence.evidenceClass === 'A'
    && evidence.semantics?.membershipField === 'RelatedHeros_ID'
    && evidence.semantics?.excludedField?.name === 'SuperHero_ID', 'membership source must be RelatedHeros_ID; SuperHero_ID is excluded');
  exactKeys(canonical, ['schemaVersion', 'scope', 'sourceEvidence', 'additionalSourceEvidence', 'membershipField', 'records'], 'relation canonical');
  check(canonical.schemaVersion === 1
    && canonical.scope === 'Explicit CN ConfigData Hero-to-Faction memberships for the 29 existing presentation-slice Heroes plus independently admitted Hero 15 claims; exactly 30 Hero endpoints / 74 evidence-backed edges, without implying Full Detail or Publication eligibility.'
    && canonical.sourceEvidence === evidencePath
    && canonical.additionalSourceEvidence === hero15EvidencePath
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
  check(isDeepStrictEqual(sourceByFaction.get(3)?.RelatedHeros_ID, EXPECTED_FACTION_3_MEMBERSHIP), 'Faction 3 source membership differs from the pinned source record');
  const sourcePairs = new Set();
  for (const [factionId, row] of sourceByFaction) {
    exactKeys(row, ['ID', 'Name', 'RelatedHeros_ID'], `source Faction ${factionId}`);
    check(Array.isArray(row.RelatedHeros_ID), `missing source membership list for faction ${factionId}`);
    for (const heroId of row.RelatedHeros_ID) {
      if (expectedEvidenceByHero.has(heroId)) sourcePairs.add(pairKey(heroId, factionId));
    }
  }
  const expectedEvidencePairs = new Set([...expectedEvidenceByHero].flatMap(([heroId, factionIdsForHero]) => factionIdsForHero.map((factionId) => pairKey(heroId, factionId))));
  check(isDeepStrictEqual(sourcePairs, expectedEvidencePairs), 'source RelatedHeros_ID target projection differs from the exact evidence-scoped relation set');
  exactKeys(hero15Evidence, ['schemaVersion', 'claimType', 'evidenceClass', 'scope', 'source', 'semantics', 'records', 'limitations', 'canonical', 'generated', 'productionRuntimeDependency'], 'Hero 15 Faction evidence');
  check(hero15Evidence.schemaVersion === 1 && hero15Evidence.claimType === 'hero-faction-membership'
    && hero15Evidence.evidenceClass === 'A' && isDeepStrictEqual(hero15Evidence.scope, { heroIds: [15], factionIds: [1, 2, 6] })
    && hero15Evidence.source?.repository === 'LuceatLuxVestra42/langrisser-future-guide'
    && hero15Evidence.source?.commit === '6475e63ee23d18adf733756c26a14fa9e3ed662c'
    && hero15Evidence.source?.tree === 'b18983f60cb054c2e6e094d64cdb98979211d7fc'
    && hero15Evidence.source?.path === 'data/configdata/ConfigDataHeroTagInfo.json'
    && hero15Evidence.source?.sourceFileSha256 === '545e662920cde9f379ac03e15632e970d8a530bf2821e4dbeddc21d0f4ce4a91'
    && hero15Evidence.source?.sourceEvidencePath === evidencePath
    && hero15Evidence.semantics?.heroMembershipField === 'RelatedHeros_ID'
    && hero15Evidence.semantics?.factionIdentityField === 'ID'
    && hero15Evidence.semantics?.excludedField === 'SuperHero_ID'
    && hero15Evidence.canonical === false && hero15Evidence.generated === false
    && hero15Evidence.productionRuntimeDependency === false, 'Hero 15 Faction evidence source pin, semantics, or boundary drift');
  const hero15SourcePairs = new Set();
  for (const claim of hero15Evidence.records) {
    exactKeys(claim, ['heroId', 'factionId', 'sourceLocator'], 'Hero 15 Faction claim');
    const source = sourceByFaction.get(claim.factionId);
    check(claim.heroId === 15 && [1, 2, 6].includes(claim.factionId)
      && source?.RelatedHeros_ID.includes(15)
      && claim.sourceLocator === `${evidencePath}#ID=${claim.factionId}/RelatedHeros_ID&contains=15`,
    `Hero 15 Faction source locator or membership mismatch for ${claim.factionId}`);
    const key = pairKey(claim.heroId, claim.factionId);
    check(!hero15SourcePairs.has(key), `duplicate Hero 15 Faction claim ${key}`);
    hero15SourcePairs.add(key);
  }
  check(isDeepStrictEqual([...hero15SourcePairs].sort(), [1, 2, 6].map((id) => pairKey(15, id)).sort()), 'Hero 15 Faction evidence must contain exactly three memberships');
  const admittedPairs = new Set([...expectedEvidencePairs, ...hero15SourcePairs]);
  const expectedPairs = new Set([...expectedByHero].flatMap(([heroId, factionIdsForHero]) => factionIdsForHero.map((factionId) => pairKey(heroId, factionId))));

  check(Array.isArray(canonical.records) && canonical.records.length === admittedPairs.size, `relation count must be exactly ${admittedPairs.size} for the current evidence-backed Canonical scope`);
  const canonicalPairs = new Set();
  for (const record of canonical.records) {
    exactKeys(record, ['heroId', 'factionId', 'provenance'], `relation ${record.heroId}:${record.factionId}`);
    check(expectedEvidenceByHero.has(record.heroId) || record.heroId === 15, `Hero endpoint ${record.heroId} is out of scope`);
    check(heroIds.has(record.heroId), `unknown Hero endpoint ${record.heroId}`);
    check(factionIds.has(record.factionId), `unknown Faction endpoint ${record.factionId}`);
    const key = pairKey(record.heroId, record.factionId);
    check(admittedPairs.has(key) && !canonicalPairs.has(key), `unexpected or duplicate relation ${key}`);
    const source = sourceByFaction.get(record.factionId);
    check(source.RelatedHeros_ID.includes(record.heroId), `relation ${key} is not present in source RelatedHeros_ID`);
    const expectedLocator = record.heroId === 15
      ? `${hero15EvidencePath}#heroId=15&factionId=${record.factionId}`
      : `${evidencePath}#ID=${record.factionId}/RelatedHeros_ID&contains=${record.heroId}`;
    check(record.provenance === expectedLocator, `relation source locator drift for ${key}`);
    canonicalPairs.add(key);
  }
  check(isDeepStrictEqual(canonicalPairs, admittedPairs), 'canonical relation edge set differs from the exact evidence-backed relation set');
  for (const [heroId, factionIdsForHero] of expectedByHero) {
    for (const factionId of factionIdsForHero) check(canonicalPairs.has(pairKey(heroId, factionId)), `visible Hero ${heroId} presentation relation ${factionId} is missing`);
  }
  process.stdout.write('Hero–Faction relation owner: PASS (30 Canonical Heroes, 74 admitted edges; 29 presentation Heroes)\n');
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) await validateHeroFactionRelations();
