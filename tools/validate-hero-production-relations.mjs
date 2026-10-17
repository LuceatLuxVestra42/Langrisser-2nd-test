import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

const evidencePath = 'evidence/source/configdata/ConfigDataHeroInfo.hero-production.v1.json';
const canonicalPath = 'canonical/hero-production-relations.v1.json';
const heroIdentityPath = 'canonical/hero-identities.v1.json';
const productionIdentityPath = 'canonical/production-identities.v1.json';
const expected = new Map([[5, 4], [6, 5], [8, 5], [28, 3], [32, 6], [52, 7], [53, 7]]);
const fail = (message) => { throw new Error(`Hero–Production relation validation failed: ${message}`); };
const check = (condition, message) => { if (!condition) fail(message); };
const exactKeys = (value, fields, label) => check(value && typeof value === 'object' && !Array.isArray(value)
  && isDeepStrictEqual(Object.keys(value).sort(), [...fields].sort()), `${label} fields drift`);

export async function validateHeroProductionRelations(root = process.cwd()) {
  const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
  const [evidence, canonical, heroes, productions] = await Promise.all([
    readJson(evidencePath), readJson(canonicalPath), readJson(heroIdentityPath), readJson(productionIdentityPath),
  ]);
  check(evidence.schemaVersion === 1 && evidence.claimType === 'hero-production-relation'
    && evidence.evidenceClass === 'B' && evidence.projection === true, 'relation evidence must remain an explicit inherited B projection');
  check(evidence.source?.sourceCommit === '6475e63ee23d18adf733756c26a14fa9e3ed662c'
    && evidence.source?.sourceTree === 'b18983f60cb054c2e6e094d64cdb98979211d7fc'
    && evidence.source?.sourcePath === 'data/configdata/ConfigDataHeroInfo.json'
    && evidence.source?.gitBlobSha1 === '728daab3370f0c7779449663ea02e638677944d4', 'pinned relation source identity drift');
  check(evidence.source?.sourcePack?.releaseTag === 'source-configdata-v1-6475e63e'
    && evidence.source?.sourcePack?.releaseId === 380931071
    && evidence.source?.sourcePack?.archiveSha256 === '65855321776cba9523669a2d486c2edbd2908006cf854572b7a87b0b63405c84'
    && evidence.source?.sourcePack?.inventorySha256 === 'ea7c6381e0901a55fe11014d14bb82862d9474c418e89d11869e03ba876dcade'
    && evidence.source?.sourcePack?.checksumsSha256 === 'be81655d43cacbb31fd55d4c64f0cdb46a47953b8247eea1b600025719a56be2',
  'pinned source-pack identity drift');
  check(evidence.source?.fileSha256 === null && evidence.source?.fileSha256Status === 'NOT_DIRECTLY_RETRIEVED',
    'unavailable per-file SHA-256 must not be invented');
  check(evidence.semantics?.heroIdField === 'ID' && evidence.semantics?.relationField === 'HeroBelongProduction'
    && evidence.semantics?.valueType === 'integer[]' && evidence.semantics?.nameClaimIsSeparate === true,
  'relation source field or semantic boundary drift');
  check(evidence.legacyValidation?.originArtifact?.status === 'PASS'
    && evidence.legacyValidation?.originArtifact?.blobSha1 === 'ea119a55f2aaf42713c9ec196bcb5fc0e322b902'
    && evidence.legacyValidation?.sourceTrace?.originFieldStatus === 'SOURCE_DICTIONARY_CONFIRMED'
    && evidence.legacyValidation?.sourcePackHydration?.blobSha1 === '61c759bf4aaeb162dc49c9e905f33cf73cebb9b1'
    && evidence.legacyValidation?.sourcePackHydration?.status === 'PASS'
    && evidence.legacyValidation?.sourcePackHydration?.perFileSha256AndSizeVerified === true,
  'inherited relation validation chain incomplete');
  exactKeys(canonical, ['schemaVersion', 'scope', 'sourceEvidence', 'relationField', 'records'], 'Hero–Production canonical');
  check(canonical.schemaVersion === 1 && canonical.sourceEvidence === evidencePath
    && canonical.relationField === 'HeroBelongProduction'
    && canonical.scope === 'Explicit Hero-to-Production origin relations for the current seven-Hero presentation slice; not a completeness claim beyond this slice.',
  'relation canonical scope or evidence pointer drift');
  exactKeys(heroes, ['schemaVersion', 'scope', 'records'], 'Hero identity owner');
  check(heroes.schemaVersion === 1 && Array.isArray(heroes.records), 'unsupported Hero identity owner');
  const heroIds = new Set(heroes.records.map((row) => row.heroId));
  const productionIds = new Set(productions.records.map((row) => row.productionId));
  for (const heroId of expected.keys()) check(heroIds.has(heroId), `Hero endpoint ${heroId} missing from identity owner`);
  for (const productionId of new Set(expected.values())) check(productionIds.has(productionId), `Production endpoint ${productionId} missing from identity owner`);
  check(Array.isArray(evidence.claims) && evidence.claims.length === expected.size, 'relation evidence must contain exactly seven scoped claims');
  const evidenceByHero = new Map();
  for (const claim of evidence.claims) {
    exactKeys(claim, ['heroId', 'recordId', 'field', 'projectedArray', 'directRawRecordRead', 'legacyLocator'], `Relation evidence ${claim.heroId}`);
    check(Number.isSafeInteger(claim.heroId) && claim.recordId === claim.heroId && claim.field === 'HeroBelongProduction', 'malformed relation locator');
    check(Array.isArray(claim.projectedArray) && claim.projectedArray.length === 1
      && Number.isSafeInteger(claim.projectedArray[0]) && claim.directRawRecordRead === false,
    `relation claim ${claim.heroId} must preserve its explicitly inherited singleton-array value`);
    check(claim.legacyLocator === `data/validation/hero-page-stage5-5-2-origin.v1.json#heroes[heroId=${claim.heroId}]/productionId`,
      `Legacy relation locator drift for Hero ${claim.heroId}`);
    check(!evidenceByHero.has(claim.heroId), `duplicate relation evidence for Hero ${claim.heroId}`);
    evidenceByHero.set(claim.heroId, claim.projectedArray[0]);
  }
  check(isDeepStrictEqual([...evidenceByHero.keys()].sort((a, b) => a - b), [...expected.keys()].sort((a, b) => a - b)), 'relation evidence Hero ID set mismatch');
  check(Array.isArray(canonical.records) && canonical.records.length === expected.size, 'relation canonical must contain exactly seven scoped edges');
  const seen = new Set();
  const perHero = new Map();
  for (const row of canonical.records) {
    exactKeys(row, ['heroId', 'productionId', 'provenance'], `Hero–Production relation ${row.heroId}`);
    check(Number.isSafeInteger(row.heroId) && Number.isSafeInteger(row.productionId), 'relation endpoints must be integer IDs');
    check(heroIds.has(row.heroId) && productionIds.has(row.productionId), `unresolved endpoint ${row.heroId}:${row.productionId}`);
    const key = `${row.heroId}:${row.productionId}`;
    check(!seen.has(key), `duplicate relation ${key}`);
    check(expected.get(row.heroId) === row.productionId && evidenceByHero.get(row.heroId) === row.productionId,
      `canonical relation differs from Legacy relation projection for ${key}`);
    check(row.provenance === `${evidencePath}#claims/heroId=${row.heroId}`,
      `relation provenance must point to HeroBelongProduction evidence for Hero ${row.heroId}`);
    seen.add(key);
    perHero.set(row.heroId, (perHero.get(row.heroId) ?? 0) + 1);
  }
  check(isDeepStrictEqual([...seen].sort(), [...expected].map(([heroId, productionId]) => `${heroId}:${productionId}`).sort()), 'exact seven-edge relation set mismatch');
  for (const heroId of expected.keys()) check(perHero.get(heroId) === 1, `Hero ${heroId} must have one Production relation in this admitted scope`);
  process.stdout.write('Hero–Production relation validator: PASS (seven scoped edges, endpoints, inherited source projection, independent relation provenance)\n');
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  await validateHeroProductionRelations();
}
