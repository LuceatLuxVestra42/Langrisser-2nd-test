import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const root = process.cwd();
const poolRoot = 'evidence/source/legacy/hero-soldier';
const fail = (message) => { throw new Error(`Hero-Soldier evidence validation failed: ${message}`); };
const check = (condition, message) => { if (!condition) fail(message); };
const readBytes = (path) => readFile(resolve(root, path));
const readJson = async (path) => JSON.parse(await readBytes(path));
const gitBlobSha1 = (bytes) => createHash('sha1')
  .update(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`), bytes]))
  .digest('hex');
const pairKey = (heroId, soldierId) => `${heroId}:${soldierId}`;

export async function validateHeroSoldierEvidence() {
  const manifestPath = `${poolRoot}/hero-soldier-evidence-pool.source-manifest.v1.json`;
  const manifest = await readJson(manifestPath);
  const relationPath = `${poolRoot}/hero-soldier-relations.v1.json`;
  const validationPath = `${poolRoot}/hero-soldier-relation-validation.v1.json`;
  const relationBytes = await readBytes(relationPath);
  const relation = JSON.parse(relationBytes);
  const validation = await readJson(validationPath);
  const contractFiles = new Map();

  check(manifest.schemaVersion === 1, 'unsupported evidence-pool manifest schema');
  check(manifest.evidenceClass === 'B', 'evidence class must remain inherited B');
  check(manifest.predecessor?.repository === 'LuceatLuxVestra42/langrisser-future-guide', 'predecessor repository mismatch');
  check(manifest.predecessor?.commit === '57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff', 'predecessor commit mismatch');
  check(manifest.predecessor?.ref === 'refs/heads/main', 'predecessor ref mismatch');
  check(manifest.preservedFiles.some((item) => item.sourcePath === 'data/generated/hero-soldier-relations.v1.json'
    && item.preservedPath === relationPath
    && item.sourceGitBlobSha1 === gitBlobSha1(relationBytes)), 'preserved relation-set bytes differ from pinned Legacy blob');

  for (const item of manifest.preservedFiles) {
    const bytes = await readBytes(item.preservedPath);
    check(gitBlobSha1(bytes) === item.sourceGitBlobSha1, `preserved file hash mismatch: ${item.preservedPath}`);
    if (item.sourcePath.startsWith('data/contracts/')) contractFiles.set(item.sourcePath, item);
  }

  const relationBlobSha = gitBlobSha1(relationBytes);
  check(validation.status === 'PASS', 'predecessor validation result is not PASS');
  check(validation.relationSet?.path === 'data/generated/hero-soldier-relations.v1.json', 'validation relation-set path mismatch');
  check(validation.relationSet?.gitBlobSha === relationBlobSha, 'validation does not bind to the preserved relation-set bytes');
  check(validation.errors?.length === 0 && validation.reviews?.length === 0, 'predecessor validation contains errors or unresolved reviews');
  for (const [checkName, value] of Object.entries(validation.checks ?? {})) {
    check(value === 0, `predecessor validation check ${checkName} is nonzero`);
  }
  for (const [name, contract] of Object.entries(relation.contracts ?? {})) {
    const preserved = contractFiles.get(contract.path);
    check(preserved && preserved.sourceGitBlobSha1 === contract.gitBlobSha,
      `embedded contract ${name} is not preserved at its pinned blob`);
  }
  for (const indexName of ['byHero', 'bySoldier']) {
    const index = validation.indexes?.[indexName];
    const preserved = manifest.preservedFiles.find((item) => item.sourcePath === index?.path);
    check(preserved && preserved.sourceGitBlobSha1 === index.gitBlobSha,
      `validated ${indexName} index bytes are not preserved at their pinned blob`);
    check(index.relationSetGitBlobSha === relationBlobSha, `${indexName} index binds to a different relation set`);
  }
  const golden = validation.goldenComparison;
  const goldenPreserved = manifest.preservedFiles.find((item) => item.sourcePath === golden?.legacyRelationPath);
  check(golden?.status === 'MATCH' && goldenPreserved?.sourceGitBlobSha1 === golden.legacyRelationGitBlobSha,
    'validated golden relation baseline is not preserved at its pinned blob');

  const sourceContractRef = relation.contracts?.sourceKinds;
  const sourceContractRecord = sourceContractRef && contractFiles.get(sourceContractRef.path);
  check(sourceContractRecord && sourceContractRecord.sourceGitBlobSha1 === sourceContractRef.gitBlobSha,
    'relation source contract not preserved at its pinned blob');
  const sourceContract = await readJson(sourceContractRecord.preservedPath);
  const allowedKinds = sourceContract.edgeSourceKinds;
  check(allowedKinds && Object.keys(allowedKinds).length > 0, 'source contract has no allowed relation source kinds');

  const byPair = new Map();
  const productionCounts = Object.fromEntries(Object.keys(allowedKinds).map((kind) => [kind, 0]));
  const distinctHeroes = new Set();
  const distinctSoldiers = new Set();
  let provenanceCount = 0;
  for (const edge of relation.edges ?? []) {
    check(Number.isInteger(edge.heroId) && Number.isInteger(edge.soldierId), 'malformed Hero-Soldier pair');
    const key = pairKey(edge.heroId, edge.soldierId);
    check(!byPair.has(key), `duplicate relation pair ${key}`);
    check(Array.isArray(edge.provenance) && edge.provenance.length > 0, `relation ${key} has no provenance`);
    distinctHeroes.add(edge.heroId);
    distinctSoldiers.add(edge.soldierId);
    byPair.set(key, edge);
    const seenProvenance = new Set();
    for (const provenance of edge.provenance) {
      const kind = provenance.sourceKind;
      const sourceSpec = allowedKinds[kind];
      check(sourceSpec, `relation ${key} has unsupported sourceKind ${kind}`);
      check(provenance.sourceClass === sourceSpec.class, `relation ${key} sourceClass differs for ${kind}`);
      check(provenance.origin?.recordKeyField === 'ID' && Number.isInteger(provenance.origin.recordId)
        && typeof provenance.origin.table === 'string' && typeof provenance.origin.field === 'string',
      `relation ${key} has incomplete origin for ${kind}`);
      const provenanceKey = JSON.stringify(provenance);
      check(!seenProvenance.has(provenanceKey), `relation ${key} repeats an identical provenance entry`);
      seenProvenance.add(provenanceKey);
      if (sourceSpec.class === 'DIRECT') {
        check(provenance.origin.table === sourceSpec.table && provenance.origin.field === sourceSpec.field,
          `relation ${key} direct origin differs from source contract for ${kind}`);
        const ownerId = sourceSpec.nativeDirection.startsWith('heroId') ? edge.heroId : edge.soldierId;
        check(provenance.origin.recordId === ownerId, `relation ${key} direct origin owner ID mismatch for ${kind}`);
      } else {
        check(kind === 'SP_SOLDIER_INHERIT', `unsupported derived sourceKind ${kind}`);
        check(provenance.parentEdge?.heroId === edge.heroId
          && Number.isInteger(provenance.parentEdge.soldierId)
          && allowedKinds[provenance.parentEdge.parentSourceKind]?.class === 'DIRECT',
        `relation ${key} has incomplete inherited parentEdge`);
        const supportSpec = sourceContract.supportRelationKinds?.[sourceSpec.requiresSupportRelation];
        check(provenance.supportRelation?.kind === sourceSpec.requiresSupportRelation
          && provenance.supportRelation.table === supportSpec?.table
          && provenance.supportRelation.spSoldierId === edge.soldierId
          && provenance.supportRelation.normalSoldierId === provenance.parentEdge.soldierId
          && provenance.supportRelation.recordId === edge.soldierId,
        `relation ${key} has incomplete inherited supportRelation`);
      }
      productionCounts[kind] += 1;
      provenanceCount += 1;
    }
  }

  for (const edge of relation.edges) {
    for (const provenance of edge.provenance) {
      if (provenance.sourceClass !== 'DERIVED') continue;
      const parent = byPair.get(pairKey(provenance.parentEdge.heroId, provenance.parentEdge.soldierId));
      check(parent?.provenance.some((candidate) => candidate.sourceClass === 'DIRECT'
        && candidate.sourceKind === provenance.parentEdge.parentSourceKind
        && isDeepStrictEqual(candidate.origin, provenance.origin)),
      `derived relation ${pairKey(edge.heroId, edge.soldierId)} has no matching direct parent provenance`);
    }
  }

  check(relation.summary?.edgeCount === relation.edges.length, 'relation summary edgeCount mismatch');
  check(relation.summary?.provenanceCount === provenanceCount, 'relation summary provenanceCount mismatch');
  check(relation.summary?.heroCount === distinctHeroes.size, 'relation summary heroCount mismatch');
  check(relation.summary?.soldierCount === distinctSoldiers.size, 'relation summary soldierCount mismatch');
  check(isDeepStrictEqual(relation.summary?.sourceProductionCounts, productionCounts), 'relation sourceProductionCounts mismatch');
  check(isDeepStrictEqual(manifest.pinnedRelationInputs, Object.entries(relation.inputs).map(([name, item]) => ({
    name,
    sourcePath: item.path,
    sourceGitBlobSha1: item.gitBlobSha,
  }))), 'pinned source input locators differ from the relation artifact');

  return {
    edgeCount: relation.edges.length,
    provenanceCount,
    heroCount: distinctHeroes.size,
    soldierCount: distinctSoldiers.size,
    sourceProductionCounts: productionCounts,
  };
}

const evidencePoolPath = `${poolRoot}/hero-soldier-relations.v1.json`;
const evidenceManifestPath = `${poolRoot}/hero-soldier-evidence-pool.source-manifest.v1.json`;
const canonicalPath = 'canonical/hero-soldier-relations.v1.json';
const heroIdentityOwner = 'canonical/hero-identities.v1.json';
const soldierIdentityOwner = 'canonical/soldiers.v1.json';
const canonicalScope = 'B-quality Legacy Hero-Soldier claims projected over current canonical Hero and Soldier identity owners; presentation eligibility does not constrain admission and this is not a completeness claim.';
const admittedRelationCount = 379;
const admittedProvenanceCount = 380;

export async function validateHeroSoldierRelations() {
  const evidenceStats = await validateHeroSoldierEvidence();
  const [pool, canonical, heroes, soldiers] = await Promise.all([
    readJson(evidencePoolPath),
    readJson(canonicalPath),
    readJson(heroIdentityOwner),
    readJson(soldierIdentityOwner),
  ]);

  check(isDeepStrictEqual(Object.keys(canonical).sort(),
    ['schemaVersion', 'scope', 'heroEndpointOwner', 'soldierEndpointOwner', 'evidencePool', 'records'].sort()),
  'canonical relation document has unexpected or missing fields');
  check(canonical.schemaVersion === 1, 'unsupported canonical relation schema');
  check(canonical.scope === canonicalScope, 'canonical relation scope drift');
  check(canonical.heroEndpointOwner === heroIdentityOwner, 'canonical Hero endpoint owner drift');
  check(canonical.soldierEndpointOwner === soldierIdentityOwner, 'canonical Soldier endpoint owner drift');
  check(canonical.evidencePool === evidenceManifestPath, 'canonical evidence-pool locator drift');
  check(Array.isArray(canonical.records), 'canonical relation records must be an array');

  const heroIds = new Set();
  for (const record of heroes.records ?? []) {
    check(Number.isInteger(record.heroId), 'current canonical Hero identity owner has malformed ID');
    check(!heroIds.has(record.heroId), `current canonical Hero identity owner has duplicate ID ${record.heroId}`);
    heroIds.add(record.heroId);
  }
  const soldierIds = new Set();
  for (const record of soldiers.records ?? []) {
    check(Number.isInteger(record.id), 'current canonical Soldier identity owner has malformed ID');
    check(!soldierIds.has(record.id), `current canonical Soldier identity owner has duplicate ID ${record.id}`);
    soldierIds.add(record.id);
  }

  const evidenceByPair = new Map((pool.edges ?? []).map((edge) => [pairKey(edge.heroId, edge.soldierId), edge]));
  const canonicalPairs = new Set();
  let provenanceCount = 0;
  let previousHeroId = -Infinity;
  let previousSoldierId = -Infinity;

  for (const record of canonical.records) {
    check(isDeepStrictEqual(Object.keys(record).sort(),
      ['heroId', 'soldierId', 'evidenceClass', 'evidencePoolLocator', 'provenance'].sort()),
    'canonical Hero-Soldier record has unexpected or missing fields');
    check(Number.isInteger(record.heroId) && Number.isInteger(record.soldierId), 'malformed canonical Hero-Soldier pair');

    const key = pairKey(record.heroId, record.soldierId);
    check(!canonicalPairs.has(key), `duplicate canonical Hero-Soldier pair ${key}`);
    canonicalPairs.add(key);

    check(record.heroId > previousHeroId || (record.heroId === previousHeroId && record.soldierId > previousSoldierId),
      `canonical Hero-Soldier ordering drift at ${key}`);
    previousHeroId = record.heroId;
    previousSoldierId = record.soldierId;

    check(heroIds.has(record.heroId), `canonical Hero-Soldier pair ${key} references missing Hero endpoint`);
    check(soldierIds.has(record.soldierId), `canonical Hero-Soldier pair ${key} references missing Soldier endpoint`);
    check(record.evidenceClass === 'B', `canonical Hero-Soldier pair ${key} evidence class drift`);

    const expectedLocator = `${evidencePoolPath}#heroId=${record.heroId}&soldierId=${record.soldierId}`;
    check(record.evidencePoolLocator === expectedLocator, `canonical Hero-Soldier pair ${key} evidence locator drift`);

    const evidenceEdge = evidenceByPair.get(key);
    check(evidenceEdge, `canonical Hero-Soldier pair ${key} has no supporting admitted evidence edge`);
    check(Array.isArray(record.provenance) && record.provenance.length > 0,
      `canonical Hero-Soldier pair ${key} has no provenance`);
    check(isDeepStrictEqual(record.provenance, evidenceEdge.provenance),
      `canonical Hero-Soldier pair ${key} provenance differs from supporting evidence`);
    provenanceCount += record.provenance.length;
  }

  check(canonical.records.length === admittedRelationCount,
    `canonical Hero-Soldier relation count is ${canonical.records.length}; expected admitted count ${admittedRelationCount}`);
  check(provenanceCount === admittedProvenanceCount,
    `canonical Hero-Soldier provenance count is ${provenanceCount}; expected admitted count ${admittedProvenanceCount}`);

  return {
    ...evidenceStats,
    admittedRelationCount: canonical.records.length,
    admittedProvenanceCount: provenanceCount,
    referencedHeroCount: new Set(canonical.records.map((record) => record.heroId)).size,
    referencedSoldierCount: new Set(canonical.records.map((record) => record.soldierId)).size,
  };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  check(process.argv.slice(2).length === 0, 'Usage: node tools/validate-hero-soldier-relations.mjs');
  const result = await validateHeroSoldierRelations();
  process.stdout.write(`Hero-Soldier read-only validation: PASS (${result.admittedRelationCount} relations; ${result.admittedProvenanceCount} provenance entries; evidence and endpoints verified)\n`);
}
