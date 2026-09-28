import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const expectedHeroIds = [1, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 25, 26, 27, 29, 33, 37, 40, 53, 55, 56, 60, 67, 89];
const check = (condition, message) => { if (!condition) throw new Error(`Hero↔SP Job relation evidence validation failed: ${message}`); };
const exactKeys = (value, expected, label) => check(isDeepStrictEqual(Object.keys(value).sort(), [...expected].sort()), `${label} has unexpected or missing fields`);
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

export async function validateHeroSpJobRelationEvidence(root = process.cwd()) {
  const readBytes = (path) => readFile(resolve(root, path));
  const readJson = async (path) => JSON.parse(await readBytes(path));
  const evidencePath = 'evidence/source/jobs/hero-sp-job-relation.v1.json';
  const spPath = 'evidence/source/configdata/ConfigDataSPHeroInfo.records-sp-relation.v1.json';
  const heroPath = 'evidence/source/configdata/ConfigDataHeroInfo.records-sp-relation.v1.json';
  const connectionPath = 'evidence/source/configdata/ConfigDataJobConnectionInfo.records-sp-relation.v1.json';
  const jobPath = 'evidence/source/configdata/ConfigDataJobInfo.records-sp-job-localization.v1.json';
  const manifestSpecs = [
    { key: 'spHeroInfo', path: 'evidence/source/configdata/ConfigDataSPHeroInfo.records-sp-relation.source-manifest.v1.json', dataPath: spPath, name: 'ConfigDataSPHeroInfo.records-sp-relation.v1.json', sourcePath: 'data/configdata/ConfigDataSPHeroInfo.json', blob: 'c3dc00ad0e1454481715ade378f56104febed9a3', sourceSha: '9ab506e525662e4107fbec4d0433827fc5c7c6a6bd4aff69ea9d883b9575b174', sourceBytes: 37157, sourceCount: 25, selectedFields: ['ID', 'JobConnection_ID'], selectedIds: expectedHeroIds, subsetSha: '3ee9575b37e6837e539542914e37b1e02085a718313bf94b7566d4fbc0e8caa6' },
    { key: 'heroInfo', path: 'evidence/source/configdata/ConfigDataHeroInfo.records-sp-relation.source-manifest.v1.json', dataPath: heroPath, name: 'ConfigDataHeroInfo.records-sp-relation.v1.json', sourcePath: 'data/configdata/ConfigDataHeroInfo.json', blob: '728daab3370f0c7779449663ea02e638677944d4', sourceSha: '2385599493d2598aa3f7d6b2c76ecdfd8615d91f19b6241933986282fcb17f7b', sourceBytes: 16894185, sourceCount: 28789, selectedFields: ['ID'], selectedIds: expectedHeroIds, subsetSha: '1e8e16700707c97848be3ab205d2f1b34b4a7f0f45ef74b213dbe0ea4e3f052f' },
    { key: 'jobConnectionInfo', path: 'evidence/source/configdata/ConfigDataJobConnectionInfo.records-sp-relation.source-manifest.v1.json', dataPath: connectionPath, name: 'ConfigDataJobConnectionInfo.records-sp-relation.v1.json', sourcePath: 'data/configdata/ConfigDataJobConnectionInfo.json', blob: 'cdad8d6fda6edd30c92fbcda53e0f63af1903139', sourceSha: '990009e6d751920173a7ec5aea47a8c89954aa7dacb7ef13c9ab40bbc6b6bb3a', sourceBytes: 11498868, sourceCount: 30066, selectedFields: ['ID', 'Job_ID'], selectedIds: null, subsetSha: '7a06c0d8efeb5d0ff199e7bb30b40e4d2074fb0f65bac1c95616fc09d8434452' }
  ];
  const contract = {
    repository: 'LuceatLuxVestra42/langrisser-future-guide', commit: '57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff',
    path: 'data/contracts/configdata-source-pack-contract.v1.json', gitBlobSha1: '0a7c58140f7c5f44a7aedbedbc950ef0f1bb4a0d',
    sha256: '5ae5443a7533760c9048d04355ad9445bb1f89812c10abced1c23d019d38df4d',
    sourceCommit: '6475e63ee23d18adf733756c26a14fa9e3ed662c', sourceTreeGitSha1: 'b18983f60cb054c2e6e094d64cdb98979211d7fc',
    semanticContentAuthority: 'PINNED_UNITYDATATOOL_PARSED_CONFIGDATA_SNAPSHOT',
    release: { tag: 'source-configdata-v1-6475e63e', archiveName: 'configdata-source-v1-6475e63e.tar', archiveSha256: '65855321776cba9523669a2d486c2edbd2908006cf854572b7a87b0b63405c84' }
  };
  const manifestPaths = { ...Object.fromEntries(manifestSpecs.map((x) => [x.key, x.path])), jobInfo: 'evidence/source/configdata/ConfigDataJobInfo.records-sp-job-localization.source-manifest.v1.json' };
  const manifests = {};
  for (const spec of manifestSpecs) {
    const manifest = await readJson(spec.path);
    const bytes = await readBytes(spec.dataPath);
    const rows = JSON.parse(bytes.toString('utf8'));
    exactKeys(manifest, ['schemaVersion', 'sourceName', 'repoPreservedPath', 'sourceRole', 'canonical', 'generated', 'productionRuntimeDependency', 'source', 'selection', 'sourceRecordCount', 'recordCount', 'recordsSha256', 'sourceScope', 'knownLimitations'], `${spec.key} source manifest`);
    check(manifest.schemaVersion === 1 && manifest.sourceName === spec.name && manifest.repoPreservedPath === spec.dataPath, `${spec.key} source manifest path/version mismatch`);
    check(manifest.sourceRole === 'selected_configdata_source_evidence' && manifest.canonical === false && manifest.generated === false && manifest.productionRuntimeDependency === false, `${spec.key} source authority boundary changed`);
    check(manifest.source.repository === contract.repository && manifest.source.commit === contract.sourceCommit && manifest.source.path === spec.sourcePath, `${spec.key} source repository/commit/path mismatch`);
    check(manifest.source.commitDate === '2026-09-02T01:45:21Z' && manifest.source.gitBlobSha1 === spec.blob && manifest.source.sha256 === spec.sourceSha && manifest.source.bytes === spec.sourceBytes && manifest.source.sourceVersionStatus === 'unknown', `${spec.key} pinned source provenance mismatch`);
    check(isDeepStrictEqual(manifest.source.sourceContract, contract), `${spec.key} source contract differs from the pinned snapshot contract`);
    check(manifest.selection.parser === 'UTF-8 JSON parser; source is a JSON array' && isDeepStrictEqual(manifest.selection.selectedFields, spec.selectedFields), `${spec.key} selection parser/fields mismatch`);
    check(manifest.sourceRecordCount === spec.sourceCount && manifest.recordCount === rows.length && manifest.recordsSha256 === spec.subsetSha && sha256(bytes) === spec.subsetSha, `${spec.key} selected source record hash/count mismatch`);
    const selectedRowIds = rows.map((row) => row.ID).sort((a, b) => a - b);
    check(manifest.selection.selectedIds.length === rows.length && new Set(manifest.selection.selectedIds).size === rows.length && isDeepStrictEqual(manifest.selection.selectedIds, selectedRowIds), `${spec.key} selected ID list is incomplete or duplicated`);
    if (spec.selectedIds) check(isDeepStrictEqual(manifest.selection.selectedIds, spec.selectedIds), `${spec.key} expected Hero ID scope changed`);
    manifests[spec.key] = manifest;
  }

  const [spRows, heroRows, connectionRows, jobRows, evidence] = await Promise.all([
    readJson(spPath), readJson(heroPath), readJson(connectionPath), readJson(jobPath), readJson(evidencePath)
  ]);
  check(spRows.length === 25 && isDeepStrictEqual(spRows.map((r) => r.ID).sort((a, b) => a - b), expectedHeroIds), 'SPHeroInfo must preserve the exact 25-record source population');
  check(isDeepStrictEqual(spRows.map((r) => r.ID), manifests.spHeroInfo.selection.selectedIds) || isDeepStrictEqual([...spRows.map((r) => r.ID)].sort((a,b)=>a-b), manifests.spHeroInfo.selection.selectedIds), 'SPHeroInfo manifest target IDs differ from source subset');
  for (const row of spRows) exactKeys(row, ['ID', 'JobConnection_ID'], `SPHeroInfo ${row.ID}`);
  for (const row of heroRows) exactKeys(row, ['ID'], `HeroInfo ${row.ID}`);
  for (const row of connectionRows) exactKeys(row, ['ID', 'Job_ID'], `JobConnectionInfo ${row.ID}`);
  const uniqueMap = (rows, label) => {
    const map = new Map();
    for (const row of rows) {
      check(Number.isInteger(row.ID) && !map.has(row.ID), `${label} has malformed or duplicate ID ${row.ID}`);
      map.set(row.ID, row);
    }
    return map;
  };
  const spById = uniqueMap(spRows, 'SPHeroInfo');
  const heroById = uniqueMap(heroRows, 'HeroInfo');
  const connectionById = uniqueMap(connectionRows, 'JobConnectionInfo');
  const jobById = uniqueMap(jobRows, 'JobInfo');
  check(heroById.size === 25 && isDeepStrictEqual([...heroById.keys()].sort((a,b)=>a-b), expectedHeroIds), 'HeroInfo ID evidence does not cover the complete SPHeroInfo ID set');
  check(connectionById.size === 25 && isDeepStrictEqual([...connectionById.keys()].sort((a,b)=>a-b), [...spRows.map((r) => r.JobConnection_ID)].sort((a,b)=>a-b)), 'JobConnectionInfo selected ID set differs from SPHeroInfo references');
  for (const row of spRows) {
    check(Number.isInteger(row.JobConnection_ID), `SPHeroInfo ${row.ID} has no numeric JobConnection_ID`);
    check(heroById.has(row.ID), `SPHeroInfo.ID ${row.ID} has no direct HeroInfo.ID match`);
    check(connectionById.has(row.JobConnection_ID), `SPHeroInfo ${row.ID} JobConnection_ID ${row.JobConnection_ID} is unresolved`);
    check(jobById.has(connectionById.get(row.JobConnection_ID).Job_ID), `JobConnectionInfo ${row.JobConnection_ID} Job_ID ${connectionById.get(row.JobConnection_ID).Job_ID} is unresolved`);
  }
  check(new Set(spRows.map((r) => r.JobConnection_ID)).size === 25, 'SPHeroInfo JobConnection_ID values are not unique');
  check(new Set(connectionRows.map((r) => r.Job_ID)).size === 25, 'SP Job_ID values are not unique');

  exactKeys(evidence, ['schemaVersion', 'canonical', 'generated', 'productionRuntimeDependency', 'evidenceScope', 'sourceManifests', 'schemaEvidence', 'sourceValueClass', 'claims', 'population', 'ownerAssessment', 'records', 'limitations'], 'SP relation evidence');
  check(evidence.schemaVersion === 1 && evidence.canonical === false && evidence.generated === false && evidence.productionRuntimeDependency === false, 'relation evidence authority boundary changed');
  check(isDeepStrictEqual(evidence.sourceManifests, manifestPaths), 'relation evidence source manifest locators changed');
  check(evidence.schemaEvidence.repository === 'LuceatLuxVestra42/langrisser-future-guide' && evidence.schemaEvidence.commit === 'e749b69f95e5515fd6c744b2ea3ac1b099652d3e' && evidence.schemaEvidence.path === 'data/metadata/dump.cs' && evidence.schemaEvidence.gitBlobSha1 === '201bc8004792d13c52a26afc79f73e5ed8d1c2ac', 'SP relation schema evidence locator changed');
  check(evidence.sourceValueClass === 'A' && evidence.claims.spHeroIdToHeroInfoId.class === 'B' && evidence.claims.spHeroConnectionToConnectionInfo.class === 'B' && evidence.claims.connectionJobIdToJobInfoId.class === 'B' && evidence.claims.selectedRecordsExist.class === 'A', 'relation evidence classes changed');
  check(evidence.population.spHeroInfoRecords === 25 && evidence.population.uniqueHeroIds === 25 && evidence.population.uniqueJobConnectionIds === 25 && evidence.population.uniqueSpJobIds === 25, 'relation population counts changed');
  check(evidence.ownerAssessment.existingRelationOwner === 'canonical/heroes.v1.json#/records/*/jobConnections' && isDeepStrictEqual(evidence.ownerAssessment.currentCanonicalHeroPopulation, [5, 6, 8]) && evidence.ownerAssessment.admission === 'deferred', 'existing relation owner assessment changed');
  const heroCanonical = await readJson('canonical/heroes.v1.json');
  check(isDeepStrictEqual(heroCanonical.records.map((row) => row.id), [5, 6, 8]), 'current canonical Hero slice population differs from the owner assessment');
  exactKeys(evidence.claims, ['spHeroIdToHeroInfoId', 'spHeroConnectionToConnectionInfo', 'connectionJobIdToJobInfoId', 'selectedRecordsExist'], 'relation evidence claims');
  for (const claim of Object.values(evidence.claims)) exactKeys(claim, ['class', 'claim', 'basis'], 'relation evidence claim');
  check(evidence.records.every((row) => !Object.hasOwn(row, 'nameKo') && !Object.hasOwn(row, 'releaseStatus')), 'relation records must not depend on localization or release fields');
  check(Array.isArray(evidence.records) && evidence.records.length === 25, 'relation evidence must contain exactly 25 records');
  const evidenceHeroIds = new Set();
  const evidenceConnectionIds = new Set();
  const evidenceJobIds = new Set();
  for (const row of evidence.records) {
    exactKeys(row, ['heroId', 'spJobConnectionId', 'spJobId', 'spHeroInfoLocator', 'heroInfoLocator', 'jobConnectionInfoLocator', 'jobInfoLocator', 'evidenceClass'], `SP relation record ${row.heroId}`);
    check(!evidenceHeroIds.has(row.heroId) && !evidenceConnectionIds.has(row.spJobConnectionId) && !evidenceJobIds.has(row.spJobId), `duplicate relation endpoint in record ${row.heroId}`);
    const sp = spById.get(row.heroId);
    const hero = heroById.get(row.heroId);
    const connection = connectionById.get(row.spJobConnectionId);
    const job = jobById.get(row.spJobId);
    check(sp && hero && sp.ID === hero.ID, `Hero ID equality mismatch for ${row.heroId}`);
    check(sp.JobConnection_ID === row.spJobConnectionId && connection?.ID === row.spJobConnectionId, `JobConnection ID relation mismatch for Hero ${row.heroId}`);
    check(connection.Job_ID === row.spJobId && job?.ID === row.spJobId, `JobInfo ID relation mismatch for Hero ${row.heroId}`);
    check(row.spHeroInfoLocator === `${spPath}#ID=${row.heroId}` && row.heroInfoLocator === `${heroPath}#ID=${row.heroId}` && row.jobConnectionInfoLocator === `${connectionPath}#ID=${row.spJobConnectionId}` && row.jobInfoLocator === `${jobPath}#ID=${row.spJobId}`, `source locator mismatch for relation ${row.heroId}`);
    check(row.evidenceClass === 'B', `relation ${row.heroId} must remain evidence class B`);
    evidenceHeroIds.add(row.heroId); evidenceConnectionIds.add(row.spJobConnectionId); evidenceJobIds.add(row.spJobId);
  }
  check(isDeepStrictEqual([...evidenceHeroIds].sort((a,b)=>a-b), expectedHeroIds), 'relation evidence does not cover the full SPHeroInfo population');
  return { spHeroInfo: spRows.length, heroIds: heroById.size, jobConnections: connectionById.size, spJobs: jobById.size, relations: evidence.records.length };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const result = await validateHeroSpJobRelationEvidence();
  process.stdout.write(`Hero↔SP Job relation evidence: PASS (${result.relations} relations; unique Hero, JobConnection, and Job IDs; direct locators; class B)\n`);
}
