import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { validateSpJobSource } from './validate-sp-job-source.mjs';

const spPath = 'evidence/localization/source/sp-job-names-ko.v1.txt';
const spManifestPath = 'evidence/localization/source/sp-job-names-ko.source-manifest.v1.json';
const jobInfoPath = 'evidence/source/configdata/ConfigDataJobInfo.records-sp-job-localization.v1.json';
const jobInfoManifestPath = 'evidence/source/configdata/ConfigDataJobInfo.records-sp-job-localization.source-manifest.v1.json';
const evidencePath = 'evidence/localization/sp-job-namespace.v1.json';
const canonicalPath = 'canonical/sp-job-identities.v1.json';
const spHeroPath = 'evidence/source/configdata/ConfigDataSPHeroInfo.records-sp-relation.v1.json';
const spHeroManifestPath = 'evidence/source/configdata/ConfigDataSPHeroInfo.records-sp-relation.source-manifest.v1.json';
const connectionPath = 'evidence/source/configdata/ConfigDataJobConnectionInfo.records-sp-relation.v1.json';
const connectionManifestPath = 'evidence/source/configdata/ConfigDataJobConnectionInfo.records-sp-relation.source-manifest.v1.json';
const relationEvidencePath = 'evidence/source/jobs/hero-sp-job-relation.v1.json';
const expectedIds = [128, 262, 368, 373, 377, 390, 414, 426, 437, 622, 633, 744, 769, 841, 858, 864, 878, 1097, 1119, 1214, 1220, 20229, 20243, 20707, 20811];
const expectedStatusOnly = [1220, 20243, 20707];
const check = (condition, message) => { if (!condition) throw new Error(`SP Job namespace evidence validation failed: ${message}`); };
const exactKeys = (value, keys, label) => check(isDeepStrictEqual(Object.keys(value).sort(), [...keys].sort()), `${label} has unexpected or missing fields`);
const readText = async (path) => readFile(resolve(process.cwd(), path), 'utf8');
const readBytes = async (path) => readFile(resolve(process.cwd(), path));
const parseJson = async (path) => JSON.parse(await readText(path));
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

export async function validateSpJobNamespaceEvidence() {
const spSource = await validateSpJobSource();
const spRows = spSource.records;
check(JSON.stringify(spRows.map((row) => row.jobId)) === JSON.stringify(expectedIds), 'SP source IDs differ from the 25-record evidence scope');

const [jobBytes, jobManifest, evidence, jobInfoText, canonical, spHeroBytes, connectionBytes, spHeroManifest, connectionManifest, relationEvidence] = await Promise.all([
  readBytes(jobInfoPath), parseJson(jobInfoManifestPath), parseJson(evidencePath), readText(jobInfoPath),
  parseJson(canonicalPath), readBytes(spHeroPath), readBytes(connectionPath),
  parseJson(spHeroManifestPath), parseJson(connectionManifestPath), parseJson(relationEvidencePath)
]);

const subset = JSON.parse(jobInfoText);
check(Array.isArray(subset) && subset.length === 25, 'JobInfo subset must contain exactly 25 records');
check(jobManifest.repoPreservedPath === jobInfoPath, 'JobInfo subset locator mismatch');
check(jobManifest.sourceName === 'ConfigDataJobInfo.records-sp-job-localization.v1.json', 'JobInfo subset source name mismatch');
check(jobManifest.sourceRole === 'selected_configdata_source_evidence', 'JobInfo subset source role mismatch');
check(jobManifest.canonical === false && jobManifest.generated === false && jobManifest.productionRuntimeDependency === false, 'JobInfo subset authority boundary changed');
check(jobManifest.recordCount === 25 && jobManifest.recordsSha256 === sha256(jobBytes), 'JobInfo subset count/hash mismatch');
check(JSON.stringify(jobManifest.selection.selectedIds) === JSON.stringify(expectedIds), 'JobInfo selected ID manifest mismatch');
check(JSON.stringify(jobManifest.selection.selectedFields) === JSON.stringify(['ID', 'Name']), 'JobInfo selected fields mismatch');
check(jobManifest.source.repository === 'LuceatLuxVestra42/langrisser-future-guide', 'upstream ConfigData repository locator mismatch');
check(jobManifest.source.commit === '6475e63ee23d18adf733756c26a14fa9e3ed662c', 'upstream ConfigData commit mismatch');
check(jobManifest.source.commitDate === '2026-09-02', 'upstream ConfigData source commit date mismatch');
check(jobManifest.source.bytes === 2424034, 'upstream ConfigData source byte length mismatch');
check(jobManifest.source.path === 'data/configdata/ConfigDataJobInfo.json', 'upstream ConfigData file locator mismatch');
check(jobManifest.source.gitBlobSha1 === '4cbcac591ff5bc8d7cf2dcbf971cf2465f0cb133', 'upstream ConfigData Git blob locator mismatch');
check(jobManifest.source.sha256 === '2e522fc464549cfe7ed1f5974e166b3952fa7398e07d0610ec2a90b950e094cf', 'upstream ConfigData source hash mismatch');
check(jobManifest.source.sourceVersionStatus === 'unknown', 'unknown source version must remain explicit');
const sourceContract = jobManifest.source.sourceContract;
check(sourceContract.repository === 'LuceatLuxVestra42/langrisser-future-guide', 'source contract repository locator mismatch');
check(sourceContract.commit === '57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff', 'source contract commit locator mismatch');
check(sourceContract.path === 'data/contracts/configdata-source-pack-contract.v1.json', 'source contract path mismatch');
check(sourceContract.gitBlobSha1 === '0a7c58140f7c5f44a7aedbedbc950ef0f1bb4a0d', 'source contract Git blob locator mismatch');
check(sourceContract.sha256 === '5ae5443a7533760c9048d04355ad9445bb1f89812c10abced1c23d019d38df4d', 'source contract hash mismatch');
check(sourceContract.sourceCommit === jobManifest.source.commit, 'source contract and source commit disagree');
check(sourceContract.sourceTreeGitSha1 === 'b18983f60cb054c2e6e094d64cdb98979211d7fc', 'source contract source tree locator mismatch');
check(sourceContract.semanticContentAuthority === 'PINNED_UNITYDATATOOL_PARSED_CONFIGDATA_SNAPSHOT', 'source contract authority locator changed');
check(sourceContract.release.tag === 'source-configdata-v1-6475e63e', 'source pack release locator mismatch');
check(sourceContract.release.archiveName === 'configdata-source-v1-6475e63e.tar', 'source pack archive locator mismatch');
check(sourceContract.release.archiveSha256 === '65855321776cba9523669a2d486c2edbd2908006cf854572b7a87b0b63405c84', 'source pack archive hash mismatch');
check(jobManifest.selection.parser === 'UTF-8 JSON parser; source is a JSON array', 'source parser provenance mismatch');
check(jobManifest.selection.method === 'Select records by exact numeric ID membership in the target set; retain only the source ID and Name fields. No name join, order matching, arithmetic, approximate matching, or value normalization.', 'source selection method provenance mismatch');

const jobById = new Map();
for (const [index, row] of subset.entries()) {
  exactKeys(row, ['ID', 'Name'], `JobInfo subset row ${index + 1}`);
  check(Number.isInteger(row.ID), `JobInfo subset row ${index + 1} has non-integer ID`);
  check(typeof row.Name === 'string' && row.Name.trim() !== '', `JobInfo subset row ${index + 1} has blank Name`);
  check(!jobById.has(row.ID), `duplicate JobInfo.ID ${row.ID}`);
  jobById.set(row.ID, row);
}
check(JSON.stringify([...jobById.keys()]) === JSON.stringify(expectedIds), 'JobInfo subset IDs must exactly match the target IDs');

exactKeys(evidence, ['schemaVersion', 'canonical', 'generated', 'productionRuntimeDependency', 'evidenceScope', 'spSourceManifest', 'jobInfoSourceManifest', 'claims', 'limitations', 'records'], 'namespace evidence');
check(evidence.schemaVersion === 1 && evidence.canonical === false && evidence.generated === false && evidence.productionRuntimeDependency === false, 'namespace evidence authority boundary changed');
check(evidence.evidenceScope === 'SP source 전직ID와 ConfigDataJobInfo.ID의 직접 일치 및 같은 record의 Name과 SP source 중국명 일치. 25개 대상 record에 한정.', 'namespace evidence scope changed');
check(evidence.spSourceManifest === spManifestPath && evidence.jobInfoSourceManifest === jobInfoManifestPath, 'namespace evidence source manifest locator mismatch');
exactKeys(evidence.claims, ['sourceRowValues', 'jobInfoNamespaceLinkage', 'officialKrName', 'releaseStatus'], 'namespace evidence claims');
check(evidence.claims.sourceRowValues === 'A: preserved SP source row directly contains 전직ID, 중국명, 한국명.', 'SP source row claim must remain class A');
check(evidence.claims.jobInfoNamespaceLinkage === 'B: the SP source ID directly equals ConfigDataJobInfo.ID; matching Name/CN is consistency evidence.', 'JobInfo namespace claim must remain class B');
check(evidence.claims.officialKrName === 'unverified' && evidence.claims.releaseStatus === 'unresolved', 'unverified localization/release boundary changed');
check(isDeepStrictEqual(evidence.limitations, [
  'The SP source itself does not define the ConfigDataJobInfo ID namespace; this interpretation is recorded here as semantic evidence.',
  '한국어 명칭의 official KR provenance는 확인되지 않았다.',
  'status_marker rows are preserved for namespace traceability and are not localization names or release claims.',
  'This evidence does not establish Hero-to-SP relations, SP tree/order, or unlock conditions.'
]), 'namespace evidence limitations changed or were expanded');
check(Array.isArray(evidence.records) && evidence.records.length === 25, 'namespace evidence must contain exactly 25 rows');

const expectedRecords = [];
for (const row of spRows) {
  const jobInfo = jobById.get(row.jobId);
  check(jobInfo, `missing direct ConfigDataJobInfo.ID match for ${row.jobId}`);
  check(jobInfo.ID === row.jobId, `ConfigDataJobInfo.ID mismatch for ${row.jobId}`);
  check(jobInfo.Name === row.nameCn, `CN consistency mismatch for ${row.jobId}: SP=${row.nameCn}; JobInfo=${jobInfo.Name}`);
  expectedRecords.push({
    jobId: row.jobId,
    nameCn: row.nameCn,
    nameKo: row.nameKo,
    spSourceLocator: `${spPath}#전직ID=${row.jobId}`,
    jobInfoSourceLocator: `${jobInfoPath}#ID=${row.jobId}`,
    idMatch: true,
    cnConsistency: true,
    sourceKrFieldKind: row.nameKo === '한섭 미실장' ? 'status_marker' : 'localization_text_candidate',
    rowEvidenceClass: 'A',
    namespaceEvidenceClass: 'B'
  });
}
check(JSON.stringify(expectedRecords.filter((row) => row.sourceKrFieldKind === 'status_marker').map((row) => row.jobId)) === JSON.stringify(expectedStatusOnly), 'status-only source rows differ from the expected three IDs');
check(isDeepStrictEqual(evidence.records, expectedRecords), 'evidence rows, locators, classifications, or comparison results differ from source records');
check(evidence.records.every((row) => Object.keys(row).length === 10), 'evidence row contains an unadmitted claim field');


// SP Job identity admission responsibility: independently derive the snapshot scope
// from pinned source relation records, then require parity with SP source and canonical.
check(spHeroManifest.repoPreservedPath === spHeroPath && connectionManifest.repoPreservedPath === connectionPath, 'SP relation manifest locator mismatch');
for (const manifest of [spHeroManifest, connectionManifest]) {
  check(manifest.source.repository === 'LuceatLuxVestra42/langrisser-future-guide', 'SP relation source repository mismatch');
  check(manifest.source.commit === '6475e63ee23d18adf733756c26a14fa9e3ed662c', 'SP relation source commit mismatch');
  check(manifest.source.sourceContract?.semanticContentAuthority === 'PINNED_UNITYDATATOOL_PARSED_CONFIGDATA_SNAPSHOT', 'SP relation source authority mismatch');
  check(manifest.canonical === false && manifest.generated === false && manifest.productionRuntimeDependency === false, 'SP relation subset authority boundary changed');
}
const spHeroRecords = JSON.parse(spHeroBytes.toString('utf8'));
const connectionRecords = JSON.parse(connectionBytes.toString('utf8'));
check(sha256(spHeroBytes) === spHeroManifest.recordsSha256 && spHeroRecords.length === spHeroManifest.recordCount, 'SPHeroInfo subset count/hash mismatch');
check(sha256(connectionBytes) === connectionManifest.recordsSha256 && connectionRecords.length === connectionManifest.recordCount, 'JobConnectionInfo subset count/hash mismatch');
check(spHeroManifest.selection.method === 'Select every row in the complete SPHeroInfo population; project source fields ID and JobConnection_ID without semantic edits. No name join, filename matching, order matching, arithmetic, approximate matching, or value normalization.', 'SPHeroInfo population selection rule changed');
check(spHeroManifest.sourceRecordCount === spHeroRecords.length && connectionManifest.sourceRecordCount === 30066, 'pinned relation source population boundary changed');
check(JSON.stringify(spHeroManifest.selection.selectedIds) === JSON.stringify(spHeroRecords.map((row) => row.ID)), 'SPHeroInfo selected IDs do not match preserved source records');
const connectionById = new Map();
for (const [index, row] of connectionRecords.entries()) {
  exactKeys(row, ['ID', 'Job_ID'], `JobConnectionInfo row ${index + 1}`);
  check(Number.isInteger(row.ID) && Number.isInteger(row.Job_ID), `JobConnectionInfo row ${index + 1} has invalid explicit IDs`);
  check(!connectionById.has(row.ID), `duplicate JobConnectionInfo.ID ${row.ID}`);
  connectionById.set(row.ID, row.Job_ID);
}
const graphRows = [];
const seenSpHeroIds = new Set();
for (const [index, row] of spHeroRecords.entries()) {
  exactKeys(row, ['ID', 'JobConnection_ID'], `SPHeroInfo row ${index + 1}`);
  check(Number.isInteger(row.ID) && Number.isInteger(row.JobConnection_ID), `SPHeroInfo row ${index + 1} has invalid explicit IDs`);
  check(!seenSpHeroIds.has(row.ID), `duplicate SPHeroInfo.ID ${row.ID}`);
  seenSpHeroIds.add(row.ID);
  check(connectionById.has(row.JobConnection_ID), `missing explicit JobConnectionInfo.ID ${row.JobConnection_ID}`);
  graphRows.push({ heroId: row.ID, connectionId: row.JobConnection_ID, jobId: connectionById.get(row.JobConnection_ID) });
}
check(connectionRecords.length === graphRows.length, 'JobConnectionInfo subset has missing or extra records relative to complete SPHeroInfo relation scope');
check(JSON.stringify(connectionManifest.selection.selectedIds) === JSON.stringify(graphRows.map((row) => row.connectionId)), 'JobConnectionInfo selected IDs do not match explicit SPHeroInfo.JobConnection_ID values');
const relationDerivedIds = graphRows.map((row) => row.jobId).sort((a, b) => a - b);
check(new Set(relationDerivedIds).size === relationDerivedIds.length, 'relation-derived SP Job IDs are not distinct');
const spSourceIds = spRows.map((row) => row.jobId).sort((a, b) => a - b);
check(JSON.stringify(relationDerivedIds) === JSON.stringify(spSourceIds), 'relation-derived IDs differ from preserved SP source explicit 전직ID set');
check(JSON.stringify([...jobById.keys()].sort((a, b) => a - b)) === JSON.stringify(relationDerivedIds), 'pinned ConfigDataJobInfo records do not match relation-derived IDs');
check(relationEvidence.records.length === graphRows.length, 'preserved Hero↔SP relation evidence population differs from pinned source graph');
const relationByHero = new Map(relationEvidence.records.map((row) => [row.heroId, row]));
for (const row of graphRows) {
  const relation = relationByHero.get(row.heroId);
  check(relation && relation.spJobConnectionId === row.connectionId && relation.spJobId === row.jobId, `preserved relation evidence differs from source graph for SPHeroInfo.ID ${row.heroId}`);
}

exactKeys(canonical, ['schemaVersion', 'canonical', 'generated', 'productionRuntimeDependency', 'scope', 'evidence', 'limitations', 'records'], 'SP Job identity canonical');
check(canonical.schemaVersion === 1 && canonical.canonical === true && canonical.generated === false && canonical.productionRuntimeDependency === false, 'SP Job identity canonical authority flags changed');
exactKeys(canonical.scope, ['type', 'sourceRepository', 'sourceCommit', 'sourceCommitDate', 'selectionRule', 'claimBoundary'], 'SP Job identity canonical scope');
check(canonical.scope.type === 'pinned_configdata_snapshot' && canonical.scope.sourceRepository === 'LuceatLuxVestra42/langrisser-future-guide', 'SP Job identity snapshot scope changed');
check(canonical.scope.sourceCommit === '6475e63ee23d18adf733756c26a14fa9e3ed662c' && canonical.scope.sourceCommitDate === '2026-09-02T01:45:21Z', 'SP Job identity pinned snapshot changed');
check(canonical.scope.selectionRule === 'Use every record in the complete ConfigDataSPHeroInfo table in the pinned snapshot; follow explicit JobConnection_ID to ConfigDataJobConnectionInfo.ID, then explicit Job_ID to ConfigDataJobInfo.ID; admit distinct reached JobInfo IDs only when the resulting set exactly equals the preserved SP source 전직ID set.', 'SP Job identity selection rule changed');
check(canonical.scope.claimBoundary === 'Snapshot-scoped SP Job identity and namespace only; does not claim an all-game or current-server complete SP Job population.', 'SP Job identity global/current completeness boundary changed');
exactKeys(canonical.evidence, ['relationDerivedSourceManifests', 'spJobRecordSourceManifest', 'spSourceManifest', 'priorNamespaceEvidence', 'relationEvidence', 'schemaEvidence', 'limitation'], 'SP Job identity evidence references');
check(isDeepStrictEqual(canonical.evidence.relationDerivedSourceManifests, [spHeroManifestPath, connectionManifestPath]), 'SP Job identity relation manifest references changed');
check(canonical.evidence.spJobRecordSourceManifest === jobInfoManifestPath && canonical.evidence.spSourceManifest === spManifestPath && canonical.evidence.priorNamespaceEvidence === evidencePath && canonical.evidence.relationEvidence === relationEvidencePath, 'SP Job identity evidence references changed');
check(canonical.evidence.schemaEvidence === 'evidence/source/jobs/hero-sp-job-relation.v1.json#/schemaEvidence', 'SP Job identity schema evidence reference changed');
check(Array.isArray(canonical.records) && canonical.records.length === 25, 'SP Job identity canonical population must be 25 after exact parity');
const relationByJobId = new Map(graphRows.map((row) => [row.jobId, row]));
const expectedCanonicalRecords = relationDerivedIds.map((id) => {
  const relation = relationByJobId.get(id);
  return {
    id,
    spSourceLocator: `${spPath}#전직ID=${id}`,
    jobInfoLocator: `${jobInfoPath}#ID=${id}`,
    relationSourceLocators: {
      spHeroInfo: `${spHeroPath}#ID=${relation.heroId}`,
      jobConnectionInfo: `${connectionPath}#ID=${relation.connectionId}`
    },
    evidenceClasses: { sourceRecordIdentity: 'A', namespaceInterpretation: 'B' }
  };
});
check(isDeepStrictEqual(canonical.records, expectedCanonicalRecords), 'SP Job identity canonical IDs, relation derivation, or per-ID provenance mismatch');
check(canonical.records.every((row) => Object.keys(row).length === 5), 'SP Job identity record contains localization, release, Hero relation, or extra claim fields');
check(isDeepStrictEqual(canonical.limitations, [
  'The snapshot does not establish a permanent all-game SP Job population.',
  'The snapshot does not establish a current-server complete SP Job population or release status.',
  'No Korean localization, Hero relation ownership, job tree/order, unlock condition, or UI eligibility is admitted here.',
  'Three source Korean-field status markers are not names; official Korean localization provenance is unverified.'
]), 'SP Job identity canonical limitations changed');

return { records: expectedRecords, sourceRecords: spRows, evidence, statusOnlyIds: expectedStatusOnly };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  await validateSpJobNamespaceEvidence();
  process.stdout.write('SP Job namespace evidence: PASS (25/25 direct IDs; 25/25 CN consistency; 22 text candidates; 3 status markers)\n');
}
