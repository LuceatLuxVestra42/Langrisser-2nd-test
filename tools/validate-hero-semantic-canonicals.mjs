import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const check = (condition, message) => { if (!condition) throw new Error(`Hero semantic canonical validation failed: ${message}`); };
const exactKeys = (value, expected, label) => check(isDeepStrictEqual(Object.keys(value).sort(), [...expected].sort()), `${label} has unexpected or missing fields`);

export async function validateHeroSemanticCanonicals(root = process.cwd()) {
  const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
  const identityPath = 'canonical/hero-identities.v1.json';
  const relationPath = 'canonical/hero-job-relations.v1.json';
  const identityEvidencePath = 'evidence/source/configdata/ConfigDataHeroInfo.records-playable-identity.v1.json';
  const identityManifestPath = 'evidence/source/configdata/ConfigDataHeroInfo.records-playable-identity.source-manifest.v1.json';
  const [identities, identityEvidence, identityManifest, relations, selected, classicEvidence, spEvidence, classicJobs, spJobs, expansionEvidence, expansionHeroes, expansionConnections, expansionJobs] = await Promise.all([
    readJson(identityPath),
    readJson(identityEvidencePath),
    readJson(identityManifestPath),
    readJson(relationPath),
    readJson('canonical/heroes.v1.json'),
    readJson('evidence/source/jobs/hero-job-connection-slice.v1.json'),
    readJson('evidence/source/jobs/hero-sp-job-relation.v1.json'),
    readJson('evidence/source/configdata/ConfigDataJobInfo.records-hero-5-6-8.json'),
    readJson('evidence/source/configdata/ConfigDataJobInfo.records-sp-job-localization.v1.json'),
    readJson('evidence/source/jobs/hero-job-connection-expansion.v1.json'),
    readJson('evidence/source/configdata/ConfigDataHeroInfo.records-28-32-52-53.json'),
    readJson('evidence/source/configdata/ConfigDataJobConnectionInfo.records-hero-28-32-52-53.json'),
    readJson('evidence/source/configdata/ConfigDataJobInfo.records-hero-28-32-52-53.json'),
  ]);

  exactKeys(identities, ['schemaVersion', 'scope', 'records'], 'Hero identity canonical');
  check(identities.schemaVersion === 1 && identities.scope === 'Playable Hero identities from ConfigDataHeroInfo records where Useable == true.', 'Hero identity schema or scope drift');
  exactKeys(identityEvidence, ['schemaVersion', 'records'], 'Playable Hero identity evidence');
  check(identityEvidence.schemaVersion === 1 && Array.isArray(identityEvidence.records), 'playable Hero identity evidence schema drift');
  exactKeys(identityManifest, ['schemaVersion', 'sourceRepository', 'sourceCommit', 'sourcePath', 'sourceBlobSha1', 'sourceSha256', 'sourceByteLength', 'sourcePopulationRowCount', 'projectionPath', 'projectionRowCount', 'locatorFormat', 'predicate', 'identityField', 'canonicalTargetPath', 'canonicalTargetField', 'comparison', 'expectedPlayableHeroCount', 'sourcePackContract', 'identityAuthority'], 'Playable Hero identity source manifest');
  check(identityManifest.schemaVersion === 1 && identityManifest.sourceRepository === 'LuceatLuxVestra42/langrisser-future-guide' && identityManifest.sourceCommit === '6475e63ee23d18adf733756c26a14fa9e3ed662c' && identityManifest.sourcePath === 'data/configdata/ConfigDataHeroInfo.json' && identityManifest.sourceBlobSha1 === '728daab3370f0c7779449663ea02e638677944d4' && identityManifest.sourceSha256 === '2385599493d2598aa3f7d6b2c76ecdfd8615d91f19b6241933986282fcb17f7b' && identityManifest.sourceByteLength === 16894185 && identityManifest.sourcePopulationRowCount === 28789 && identityManifest.projectionPath === identityEvidencePath && identityManifest.projectionRowCount === 28789 && identityManifest.projectionRowCount === identityEvidence.records.length && identityManifest.sourcePopulationRowCount === identityEvidence.records.length && identityManifest.locatorFormat === identityEvidencePath + '#ID={ID}' && identityManifest.predicate === 'Useable == true' && identityManifest.identityField === 'ID' && identityManifest.canonicalTargetPath === identityPath && identityManifest.canonicalTargetField === 'heroId' && identityManifest.comparison === 'Exact numeric ID equality' && identityManifest.expectedPlayableHeroCount === 267
    && identityManifest.sourcePackContract?.repository === 'LuceatLuxVestra42/langrisser-future-guide'
    && identityManifest.sourcePackContract?.commit === '57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff'
    && identityManifest.sourcePackContract?.path === 'data/contracts/configdata-source-pack-contract.v1.json'
    && identityManifest.sourcePackContract?.blobSha1 === '0a7c58140f7c5f44a7aedbedbc950ef0f1bb4a0d'
    && identityManifest.sourcePackContract?.sourceCommit === identityManifest.sourceCommit
    && identityManifest.sourcePackContract?.archiveSha256 === '65855321776cba9523669a2d486c2edbd2908006cf854572b7a87b0b63405c84'
    && identityManifest.identityAuthority?.contractPath === 'data/contracts/hero-identity-contract.v1.json'
    && identityManifest.identityAuthority?.contractBlobSha1 === '7bd0450ba517953ae5c623244e9cb5e2aeb44c4a'
    && identityManifest.identityAuthority?.masterPath === 'data/hero-name-master.v1.json'
    && identityManifest.identityAuthority?.masterBlobSha1 === '12eaf4f84a3e91477c80fbccd78c949b79c3829f'
    && identityManifest.identityAuthority?.masterRecordCount === 267
    && identityManifest.identityAuthority?.stage3ValidationPath === 'data/validation/hero-stage3-automation-result.json'
    && identityManifest.identityAuthority?.stage3ValidationBlobSha1 === '93553c229705a9014cb6497fdb64f4312e4b6170'
    && identityManifest.identityAuthority?.stage3Status === 'PASS', 'playable Hero identity manifest/source pin drift');
  const sourceRowsById = new Map();
  for (const row of identityEvidence.records) {
    check(row && typeof row === 'object' && !Array.isArray(row), 'malformed playable identity source row');
    check(Object.keys(row).every((key) => key === 'ID' || key === 'Useable') && Object.hasOwn(row, 'ID'), 'playable identity source row has unsupported/missing fields');
    check(Number.isSafeInteger(row.ID) && row.ID > 0, 'malformed source Hero ID ' + row.ID);
    check(!Object.hasOwn(row, 'Useable') || typeof row.Useable === 'boolean', 'malformed Useable value for source Hero ID ' + row.ID);
    check(!sourceRowsById.has(row.ID), 'duplicate source Hero ID ' + row.ID);
    sourceRowsById.set(row.ID, row);
  }
  const expectedIdentityLocators = new Map();
  for (const [heroId, row] of sourceRowsById) if (row.Useable === true) expectedIdentityLocators.set(heroId, identityEvidencePath + '#ID=' + heroId);
  check(expectedIdentityLocators.size === identityManifest.expectedPlayableHeroCount, 'playable Hero source count differs from the validated manifest population');
  exactKeys(relations, ['schemaVersion', 'scope', 'records'], 'Hero→Job relation canonical');
  check(relations.schemaVersion === 1 && relations.scope === 'Current evidence-backed Hero-to-Job relation union; not a claim of complete game relation population.', 'Hero→Job schema or scope drift');

  const identityById = new Map();
  for (const row of identities.records) {
    exactKeys(row, ['heroId', 'provenance'], `Hero identity ${row.heroId}`);
    check(Number.isSafeInteger(row.heroId) && row.heroId > 0 && !identityById.has(row.heroId), `malformed or duplicate Hero ID ${row.heroId}`);
    check(typeof row.provenance === 'string' && row.provenance.length > 0, `Hero ${row.heroId} has no identity evidence locator`);
    check(expectedIdentityLocators.get(row.heroId) === row.provenance, `Hero ${row.heroId} identity evidence locator/value mismatch`);
    identityById.set(row.heroId, row);
  }
  check(identityById.size === expectedIdentityLocators.size, 'Hero identity count differs from the playable source identity scope');
  for (const [heroId, locator] of expectedIdentityLocators) {
    check(identityById.get(heroId)?.provenance === locator, `Hero ${heroId} identity evidence is missing`);
  }

  const expectedRelations = new Map();
  const addExpectedRelation = (heroId, jobId, provenance, source) => {
    const key = `${heroId}:${jobId}`;
    check(!expectedRelations.has(key), `duplicate evidence relation pair ${key} (${source})`);
    expectedRelations.set(key, { heroId, jobId, provenance });
  };
  for (const row of classicEvidence.records) {
    addExpectedRelation(row.heroId, row.jobId,
      `evidence/source/jobs/hero-job-connection-slice.v1.json#heroId=${row.heroId}&connectionId=${row.connectionId}`, 'selected Hero evidence');
  }
  for (const row of spEvidence.records) {
    addExpectedRelation(row.heroId, row.spJobId,
      `evidence/source/jobs/hero-sp-job-relation.v1.json#heroId=${row.heroId}`, 'SP relation evidence');
  }
  const jobEvidenceRows = [...classicJobs, ...spJobs, ...expansionJobs];
  const jobEvidenceById = new Map();
  for (const row of jobEvidenceRows) {
    check(Number.isSafeInteger(row.ID) && row.ID > 0, 'malformed JobInfo evidence ID');
    const prior = jobEvidenceById.get(row.ID);
    check(prior === undefined || isDeepStrictEqual(prior, row), `conflicting preserved JobInfo evidence for ID ${row.ID}`);
    jobEvidenceById.set(row.ID, row);
  }
  const jobIds = new Set(jobEvidenceById.keys());

  const expansionHeroIds = [28, 32, 52, 53];
  const heroInfoPath = 'evidence/source/configdata/ConfigDataHeroInfo.records-28-32-52-53.json';
  const connectionInfoPath = 'evidence/source/configdata/ConfigDataJobConnectionInfo.records-hero-28-32-52-53.json';
  const expansionJobInfoPath = 'evidence/source/configdata/ConfigDataJobInfo.records-hero-28-32-52-53.json';
  const expansionPath = 'evidence/source/jobs/hero-job-connection-expansion.v1.json';
  check(expansionEvidence.version === 1
    && expansionEvidence.source.repository === 'LuceatLuxVestra42/langrisser-future-guide'
    && expansionEvidence.source.commit === '6475e63ee23d18adf733756c26a14fa9e3ed662c'
    && expansionEvidence.sourceFiles['ConfigDataHeroInfo.json'].gitBlobSha1 === '728daab3370f0c7779449663ea02e638677944d4'
    && expansionEvidence.sourceFiles['ConfigDataJobConnectionInfo.json'].gitBlobSha1 === 'cdad8d6fda6edd30c92fbcda53e0f63af1903139'
    && expansionEvidence.sourceFiles['ConfigDataJobInfo.json'].gitBlobSha1 === '4cbcac591ff5bc8d7cf2dcbf971cf2465f0cb133',
    'Hero relation expansion source snapshot/blob pin drift');
  const expansionHeroById = new Map();
  for (const row of expansionHeroes) {
    check(row && Number.isSafeInteger(row.ID) && expansionHeroIds.includes(row.ID) && !expansionHeroById.has(row.ID), 'malformed or duplicate expansion HeroInfo row');
    check(Number.isSafeInteger(row.JobConnection_ID) && Array.isArray(row.UseableJobConnections_ID) && row.UseableJobConnections_ID.every(Number.isSafeInteger), `malformed explicit Hero connection refs for ${row.ID}`);
    expansionHeroById.set(row.ID, row);
  }
  check(expansionHeroIds.every((id) => expansionHeroById.has(id)) && expansionHeroById.size === expansionHeroIds.length, 'HeroInfo expansion source rows incomplete');
  const expectedRefs = [];
  for (const heroId of expansionHeroIds) {
    const row = expansionHeroById.get(heroId);
    expectedRefs.push({ heroId, sourceField: 'JobConnection_ID', connectionId: row.JobConnection_ID });
    for (const connectionId of row.UseableJobConnections_ID) expectedRefs.push({ heroId, sourceField: 'UseableJobConnections_ID', connectionId });
  }
  const expectedConnectionIds = new Set(expectedRefs.map((row) => row.connectionId));
  const connectionById = new Map();
  for (const row of expansionConnections) {
    check(row && Number.isSafeInteger(row.ID) && expectedConnectionIds.has(row.ID) && !connectionById.has(row.ID), `connection ID ${row?.ID} does not resolve uniquely`);
    check(Number.isSafeInteger(row.Job_ID) && row.Job_ID > 0, `malformed Job_ID for connection ${row.ID}`);
    connectionById.set(row.ID, row);
  }
  check(connectionById.size === expectedConnectionIds.size, 'one or more explicit connection IDs do not resolve uniquely');
  const expansionJobIds = new Set([...connectionById.values()].map((row) => row.Job_ID));
  const expansionJobById = new Map();
  for (const row of expansionJobs) {
    check(row && Number.isSafeInteger(row.ID) && expansionJobIds.has(row.ID) && !expansionJobById.has(row.ID), `JobInfo ID ${row?.ID} does not resolve uniquely in expansion subset`);
    expansionJobById.set(row.ID, row);
  }
  check(expansionJobIds.size === expansionJobs.length && [...expansionJobIds].every((id) => jobIds.has(id)), 'one or more explicit Job_ID endpoints do not resolve uniquely');
  const evidenceRefByKey = new Map();
  for (const row of expansionEvidence.records) {
    const key = `${row.heroId}:${row.sourceField}:${row.connectionId}`;
    check(!evidenceRefByKey.has(key), `duplicate Hero connection evidence ref ${key}`);
    evidenceRefByKey.set(key, row);
  }
  check(evidenceRefByKey.size === expectedRefs.length, 'Hero connection evidence does not preserve every explicit source ref');
  for (const ref of expectedRefs) {
    const key = `${ref.heroId}:${ref.sourceField}:${ref.connectionId}`;
    const evidence = evidenceRefByKey.get(key);
    const connection = connectionById.get(ref.connectionId);
    check(evidence && evidence.jobId === connection.Job_ID
      && evidence.sourceHeroInfoLocator === `${heroInfoPath}#ID=${ref.heroId}`
      && evidence.jobConnectionInfoLocator === `${connectionInfoPath}#ID=${ref.connectionId}`
      && evidence.jobInfoLocator.endsWith(`#ID=${connection.Job_ID}`),
      `Hero connection provenance locator/value mismatch for ${key}`);
    const pairKey = `${ref.heroId}:${connection.Job_ID}`;
    check(!expectedRelations.has(pairKey), `expansion relation unexpectedly overlaps an admitted pair ${pairKey}`);
    addExpectedRelation(ref.heroId, connection.Job_ID,
      `${expansionPath}#heroId=${ref.heroId}&connectionId=${ref.connectionId}`, 'Hero connection expansion evidence');
  }
  check(classicEvidence.records.length === 18 && spEvidence.records.length === 25
    && expectedRelations.size === classicEvidence.records.length + spEvidence.records.length + expansionEvidence.records.length,
    'current evidence-backed relation scope must match selected, SP, and explicit expansion evidence');

  const relationByPair = new Map();
  for (const row of relations.records) {
    exactKeys(row, ['heroId', 'jobId', 'provenance'], `Hero→Job relation ${row.heroId}:${row.jobId}`);
    check(Number.isInteger(row.heroId) && Number.isInteger(row.jobId), `malformed relation endpoint ${row.heroId}:${row.jobId}`);
    const key = `${row.heroId}:${row.jobId}`;
    check(!relationByPair.has(key), `duplicate Hero→Job relation pair ${key}`);
    check(identityById.has(row.heroId), `relation Hero ${row.heroId} has no canonical identity`);
    check(jobIds.has(row.jobId), `relation Job ${row.jobId} has no preserved JobInfo evidence`);
    const expected = expectedRelations.get(key);
    check(expected && expected.provenance === row.provenance, `relation pair/evidence locator mismatch for ${key}`);
    relationByPair.set(key, row);
  }
  check(relationByPair.size === expectedRelations.size, 'Hero→Job relation count differs from the current evidence-backed scope');
  for (const [key, expected] of expectedRelations) {
    check(relationByPair.has(key), `evidence relation ${key} is missing from the general owner`);
  }

  const selectedIds = new Set(selected.records.map((row) => row.id));
  for (const heroId of selectedIds) check(identityById.has(heroId), `selected Hero ${heroId} is absent from the general identity owner`);
  const selectedPairs = new Set();
  for (const hero of selected.records) {
    for (const relation of hero.jobConnections) {
      const key = `${hero.id}:${relation.jobId}`;
      check(!selectedPairs.has(key), `duplicate selected slice relation ${key}`);
      check(relationByPair.has(key), `selected slice relation ${key} is absent from the general relation owner`);
      selectedPairs.add(key);
    }
  }
  const selectedOwnerPairs = [...expectedRelations.keys()].filter((key) => selectedIds.has(Number(key.split(':')[0])) && classicEvidence.records.some((row) => `${row.heroId}:${row.jobId}` === key));
  check(selectedPairs.size === 18 && selectedOwnerPairs.length === 18, 'selected 5/6/8 relation parity must cover exactly the existing 18 relations');
  for (const row of classicEvidence.records) check(selectedPairs.has(`${row.heroId}:${row.jobId}`), `selected relation ${row.heroId}:${row.jobId} is missing from the slice`);

  return { identities: identityById.size, relations: relationByPair.size, selectedHeroes: selectedIds.size, selectedRelations: selectedPairs.size };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const result = await validateHeroSemanticCanonicals();
  process.stdout.write(`Hero semantic canonicals: PASS (${result.identities} playable identities; ${result.relations} relations; ${result.selectedRelations} selected-slice parity pairs; localization/release independent)\n`);
}
