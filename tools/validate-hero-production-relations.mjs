import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

const evidencePath = 'evidence/source/configdata/ConfigDataHeroInfo.hero-production.v1.json';
const inheritedPath = 'evidence/source/configdata/ConfigDataHeroInfo.hero-production-inherited.v1.json';
const canonicalPath = 'canonical/hero-production-relations.v1.json';
const heroIdentityPath = 'canonical/hero-identities.v1.json';
const productionIdentityPath = 'canonical/production-identities.v1.json';
const directExpected = new Map([[5, 4], [6, 5], [8, 5], [28, 3], [32, 6], [52, 7], [53, 7]]);
const inheritedExpected = new Map([[1, 3], [3, 3], [4, 3], [7, 5], [9, 4], [10, 4], [11, 4], [12, 5], [13, 5], [14, 5], [25, 6], [26, 6], [27, 6], [29, 6], [33, 6], [37, 6], [40, 6], [55, 7], [56, 7], [60, 8], [67, 8], [89, 3]]);
const admittedInherited = new Set([...inheritedExpected].filter(([, productionId]) => productionId >= 3 && productionId <= 7).map(([heroId]) => heroId));
const expected = new Map([...directExpected, ...[...inheritedExpected].filter(([heroId]) => admittedInherited.has(heroId))]);
const reportPath = 'data/validation/hero-page-stage5-5-2-origin.v1.json';
const fail = (message) => { throw new Error(`Hero–Production relation validation failed: ${message}`); };
const check = (condition, message) => { if (!condition) fail(message); };
const exactKeys = (value, fields, label) => check(value && typeof value === 'object' && !Array.isArray(value)
  && isDeepStrictEqual(Object.keys(value).sort(), [...fields].sort()), `${label} fields drift`);

export async function validateHeroProductionRelations(root = process.cwd()) {
  const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
  const [evidence, inherited, canonical, heroes, productions] = await Promise.all([
    readJson(evidencePath), readJson(inheritedPath), readJson(canonicalPath), readJson(heroIdentityPath), readJson(productionIdentityPath),
  ]);
  check(evidence.schemaVersion === 1 && evidence.claimType === 'hero-production-relation'
    && evidence.evidenceClass === 'B' && evidence.projection === true, 'existing source projection contract drift');
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
  'existing relation validation chain incomplete');

  exactKeys(inherited, ['schemaVersion', 'claimType', 'evidenceClass', 'projection', 'scope', 'source', 'semantics', 'legacyValidation', 'records', 'limitations'], 'inherited relation evidence');
  check(inherited.schemaVersion === 1 && inherited.claimType === 'hero-production-relation'
    && inherited.evidenceClass === 'B' && inherited.projection === true, 'inherited evidence class/scope drift');
  check(inherited.source?.repository === 'LuceatLuxVestra42/langrisser-future-guide'
    && inherited.source?.sourceCommit === '6475e63ee23d18adf733756c26a14fa9e3ed662c'
    && inherited.source?.sourceTree === 'b18983f60cb054c2e6e094d64cdb98979211d7fc'
    && inherited.source?.sourcePath === 'data/configdata/ConfigDataHeroInfo.json'
    && inherited.source?.gitBlobSha1 === '728daab3370f0c7779449663ea02e638677944d4'
    && inherited.source?.fileSha256 === null
    && inherited.source?.fileSha256Status === 'NOT_DIRECTLY_RETRIEVED', 'inherited source identity or limitation drift');
  check(inherited.source?.sourcePack?.releaseTag === 'source-configdata-v1-6475e63e'
    && inherited.source?.sourcePack?.releaseId === 380931071
    && inherited.source?.sourcePack?.archiveSha256 === '65855321776cba9523669a2d486c2edbd2908006cf854572b7a87b0b63405c84'
    && inherited.source?.sourcePack?.inventorySha256 === 'ea7c6381e0901a55fe11014d14bb82862d9474c418e89d11869e03ba876dcade'
    && inherited.source?.sourcePack?.checksumsSha256 === 'be81655d43cacbb31fd55d4c64f0cdb46a47953b8247eea1b600025719a56be2',
  'inherited source-pack identity drift');
  check(inherited.semantics?.heroIdField === 'ID' && inherited.semantics?.relationField === 'HeroBelongProduction'
    && inherited.semantics?.valueType === 'integer[]' && inherited.semantics?.nameClaimIsSeparate === true,
  'inherited relation source field semantics drift');
  check(inherited.legacyValidation?.repositoryHead === '57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff'
    && inherited.legacyValidation?.originArtifact?.path === reportPath
    && inherited.legacyValidation?.originArtifact?.blobSha1 === 'ea119a55f2aaf42713c9ec196bcb5fc0e322b902'
    && inherited.legacyValidation?.originArtifact?.status === 'PASS'
    && inherited.legacyValidation?.sourceTrace?.path === 'data/validation/hero-page-stage5-5-2-source-trace.v1.json'
    && inherited.legacyValidation?.sourceTrace?.blobSha1 === '84dc6c6b895120ec992d3fbf7ff70cdd62272de9'
    && inherited.legacyValidation?.sourceTrace?.status === 'PASS_WITH_DATA_GAPS'
    && inherited.legacyValidation?.sourceTrace?.originFieldStatus === 'SOURCE_DICTIONARY_CONFIRMED'
    && inherited.legacyValidation?.sourceTrace?.originField === 'ConfigDataHeroInfo.HeroBelongProduction'
    && inherited.legacyValidation?.sourcePackHydration?.path === 'data/validation/configdata-source-pack-b2-hydration.v1.json'
    && inherited.legacyValidation?.sourcePackHydration?.blobSha1 === '61c759bf4aaeb162dc49c9e905f33cf73cebb9b1'
    && inherited.legacyValidation?.sourcePackHydration?.status === 'PASS'
    && inherited.legacyValidation?.sourcePackHydration?.perFileSha256AndSizeVerified === true
    && inherited.legacyValidation?.sourcePackHydration?.trackedSourceByteParityVerified === true
    && inherited.legacyValidation?.rawHeroInfoReparsedInThisChange === false,
  'inherited validation chain or claim limitations drift');
  check(inherited.legacyValidation?.claimScope?.includes('267 Heroes')
    && inherited.legacyValidation?.claimScope?.includes('skin-acquisition rows')
    && inherited.legacyValidation?.claimScope?.includes('SOURCE_DICTIONARY_CONFIRMED'),
  'Legacy PASS_WITH_DATA_GAPS scope must remain explicit');
  check(isDeepStrictEqual([...inherited.scope.heroIds].sort((a,b)=>a-b), [...inheritedExpected.keys()].sort((a,b)=>a-b))
    && isDeepStrictEqual([...inherited.scope.admittedHeroIds].sort((a,b)=>a-b), [...admittedInherited].sort((a,b)=>a-b))
    && isDeepStrictEqual([...inherited.scope.reviewOnlyHeroIds].sort((a,b)=>a-b), [60,67])
    && isDeepStrictEqual([...inherited.scope.productionIds].sort((a,b)=>a-b), [3,4,5,6,7,8]),
  'inherited relation scope ID coverage drift');
  check(isDeepStrictEqual(inherited.limitations, [
    'This projection inherits ID-specific Production pointers from the pinned Legacy validation report; it is not a direct copy or reparse of ConfigDataHeroInfo records.',
    'The raw HeroInfo file was not re-downloaded or parsed in this change. The source commit, path, Git blob SHA-1, source-pack pins, and Legacy validation chain identify the claimed source scope.',
    "The Legacy report's PASS and source-pack hydration PASS support only the claims and checks they explicitly cover; they do not independently establish Production identity or Korean localization.",
    'Hero 60 and 67 point to Production ID 8 in the inherited report. Their pointers are retained as review-only evidence because Production identity 8 is not admitted here; no Canonical relation is created for them.',
    'This artifact supports Hero-to-Production relation claims only and does not support Production name or localization claims.'
  ]), 'inherited relation limitations drift');

  exactKeys(canonical, ['schemaVersion', 'scope', 'sourceEvidence', 'inheritedSourceEvidence', 'relationField', 'records'], 'Hero–Production canonical');
  check(canonical.schemaVersion === 1 && canonical.sourceEvidence === evidencePath
    && canonical.inheritedSourceEvidence === inheritedPath
    && canonical.relationField === 'HeroBelongProduction'
    && canonical.scope === 'Explicit Hero-to-Production origin relations supported by the admitted evidence scope (27 Hero endpoints / 27 relations); independent of the seven-Hero presentation population and not a completeness claim beyond this evidence.',
  'relation canonical scope or evidence pointer drift');
  exactKeys(heroes, ['schemaVersion', 'scope', 'records'], 'Hero identity owner');
  check(heroes.schemaVersion === 1 && Array.isArray(heroes.records), 'unsupported Hero identity owner');
  const heroIds = new Set(heroes.records.map((row) => row.heroId));
  const productionIds = new Set(productions.records.map((row) => row.productionId));
  for (const heroId of expected.keys()) check(heroIds.has(heroId), `Hero endpoint ${heroId} missing from identity owner`);
  for (const productionId of new Set(expected.values())) check(productionIds.has(productionId), `Production endpoint ${productionId} missing from identity owner`);

  check(Array.isArray(evidence.claims) && evidence.claims.length === directExpected.size, 'existing source projection must retain exactly seven scoped claims');
  const directByHero = new Map();
  for (const claim of evidence.claims) {
    exactKeys(claim, ['heroId', 'recordId', 'field', 'projectedArray', 'directRawRecordRead', 'legacyLocator'], `Existing relation evidence ${claim.heroId}`);
    check(Number.isSafeInteger(claim.heroId) && claim.recordId === claim.heroId && claim.field === 'HeroBelongProduction', 'malformed existing relation locator');
    check(Array.isArray(claim.projectedArray) && claim.projectedArray.length === 1
      && Number.isSafeInteger(claim.projectedArray[0]) && claim.directRawRecordRead === false,
    `existing relation claim ${claim.heroId} must preserve its inherited singleton-array value`);
    check(claim.legacyLocator === `${reportPath}#heroes[heroId=${claim.heroId}]/productionId`,
      `Legacy relation locator drift for Hero ${claim.heroId}`);
    check(!directByHero.has(claim.heroId), `duplicate existing relation evidence for Hero ${claim.heroId}`);
    directByHero.set(claim.heroId, claim.projectedArray[0]);
  }
  check(isDeepStrictEqual([...directByHero.keys()].sort((a,b)=>a-b), [...directExpected.keys()].sort((a,b)=>a-b)), 'existing relation evidence Hero ID set mismatch');
  for (const [heroId, productionId] of directExpected) check(directByHero.get(heroId) === productionId, `existing relation value drift for Hero ${heroId}`);

  check(Array.isArray(inherited.records) && inherited.records.length === inheritedExpected.size, 'inherited evidence must contain exactly 22 pointers');
  const inheritedByHero = new Map();
  for (const claim of inherited.records) {
    exactKeys(claim, ['heroId', 'recordId', 'field', 'projectedArray', 'directRawRecordRead', 'legacyLocator', 'evidenceClass', 'canonicalAdmission'], `Inherited relation evidence ${claim.heroId}`);
    check(Number.isSafeInteger(claim.heroId) && claim.recordId === claim.heroId && claim.field === 'HeroBelongProduction', 'malformed inherited relation locator');
    check(Array.isArray(claim.projectedArray) && claim.projectedArray.length === 1
      && Number.isSafeInteger(claim.projectedArray[0]) && claim.directRawRecordRead === false && claim.evidenceClass === 'B',
    `inherited relation claim ${claim.heroId} must preserve an inherited singleton-array value`);
    check(claim.legacyLocator === `${reportPath}#heroes[heroId=${claim.heroId}]/productionId`,
      `Legacy relation locator drift for Hero ${claim.heroId}`);
    check(claim.canonicalAdmission === (claim.projectedArray[0] >= 3 && claim.projectedArray[0] <= 7
      ? 'ADMITTED' : 'REVIEW_PRODUCTION_IDENTITY_NOT_ADMITTED'), `incorrect Canonical status for Hero ${claim.heroId}`);
    check(heroIds.has(claim.heroId), `inherited Hero endpoint ${claim.heroId} missing from Identity`);
    check(!inheritedByHero.has(claim.heroId), `duplicate inherited relation evidence for Hero ${claim.heroId}`);
    inheritedByHero.set(claim.heroId, claim.projectedArray[0]);
  }
  check(isDeepStrictEqual([...inheritedByHero.keys()].sort((a,b)=>a-b), [...inheritedExpected.keys()].sort((a,b)=>a-b)), 'inherited relation evidence Hero ID set mismatch');
  for (const [heroId, productionId] of inheritedExpected) check(inheritedByHero.get(heroId) === productionId, `inherited Production pointer drift for Hero ${heroId}`);

  check(Array.isArray(canonical.records) && canonical.records.length === expected.size, 'relation canonical must contain exactly 27 admitted edges');
  const seen = new Set();
  const perHero = new Map();
  for (const row of canonical.records) {
    exactKeys(row, ['heroId', 'productionId', 'provenance'], `Hero–Production relation ${row.heroId}`);
    check(Number.isSafeInteger(row.heroId) && Number.isSafeInteger(row.productionId), 'relation endpoints must be integer IDs');
    check(heroIds.has(row.heroId) && productionIds.has(row.productionId), `unresolved endpoint ${row.heroId}:${row.productionId}`);
    const key = `${row.heroId}:${row.productionId}`;
    check(!seen.has(key), `duplicate relation ${key}`);
    check(expected.get(row.heroId) === row.productionId
      && (directByHero.get(row.heroId) ?? inheritedByHero.get(row.heroId)) === row.productionId,
    `canonical relation differs from its ID-specific evidence for ${key}`);
    const expectedProvenance = directExpected.has(row.heroId)
      ? `${evidencePath}#claims/heroId=${row.heroId}`
      : `${inheritedPath}#records/heroId=${row.heroId}`;
    check(row.provenance === expectedProvenance, `relation provenance must point to the correct HeroBelongProduction evidence for Hero ${row.heroId}`);
    seen.add(key);
    perHero.set(row.heroId, (perHero.get(row.heroId) ?? 0) + 1);
  }
  check(isDeepStrictEqual([...seen].sort(), [...expected].map(([heroId, productionId]) => `${heroId}:${productionId}`).sort()), 'exact 27-edge relation set mismatch');
  for (const heroId of expected.keys()) check(perHero.get(heroId) === 1, `Hero ${heroId} must have one Production relation in this admitted scope`);
  check(!canonical.records.some((row) => row.heroId === 60 || row.heroId === 67 || row.productionId === 8),
    'Production ID 8 review-only pointers must not be admitted to Canonical relations');
  process.stdout.write('Hero–Production relation validator: PASS (27 admitted edges, 22 inherited pointers including two review-only endpoints, identity validation and provenance)\\n');
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  await validateHeroProductionRelations();
}
