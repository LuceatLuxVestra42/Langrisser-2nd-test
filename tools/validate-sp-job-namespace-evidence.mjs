import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

const spPath = 'evidence/localization/source/sp-job-names-ko.v1.txt';
const spManifestPath = 'evidence/localization/source/sp-job-names-ko.source-manifest.v1.json';
const jobInfoPath = 'evidence/source/configdata/ConfigDataJobInfo.records-sp-job-localization.v1.json';
const jobInfoManifestPath = 'evidence/source/configdata/ConfigDataJobInfo.records-sp-job-localization.source-manifest.v1.json';
const evidencePath = 'evidence/localization/sp-job-namespace.v1.json';
const expectedIds = [128, 262, 368, 373, 377, 390, 414, 426, 437, 622, 633, 744, 769, 841, 858, 864, 878, 1097, 1119, 1214, 1220, 20229, 20243, 20707, 20811];
const expectedStatusOnly = [1220, 20243, 20707];
const check = (condition, message) => { if (!condition) throw new Error(`SP Job namespace evidence validation failed: ${message}`); };
const exactKeys = (value, keys, label) => check(isDeepStrictEqual(Object.keys(value).sort(), [...keys].sort()), `${label} has unexpected or missing fields`);
const readText = async (path) => readFile(resolve(process.cwd(), path), 'utf8');
const readBytes = async (path) => readFile(resolve(process.cwd(), path));
const parseJson = async (path) => JSON.parse(await readText(path));
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

const [spBytes, spManifest, jobBytes, jobManifest, evidence, jobInfoText] = await Promise.all([
  readBytes(spPath), parseJson(spManifestPath), readBytes(jobInfoPath), parseJson(jobInfoManifestPath), parseJson(evidencePath), readText(jobInfoPath)
]);
const spText = new TextDecoder('utf-8', { fatal: true }).decode(spBytes);
const spLines = spText.split(/\r?\n/);
if (spLines.at(-1) === '') spLines.pop();
check(JSON.stringify(spLines.shift()?.split('\t')) === JSON.stringify(['전직ID', '중국명', '한국명']), 'SP source header mismatch');
const spRows = spLines.map((line, index) => {
  const fields = line.split('\t');
  check(fields.length === 3, `SP source row ${index + 2} malformed`);
  check(/^\d+$/.test(fields[0]), `SP source row ${index + 2} has invalid ID`);
  return { jobId: Number(fields[0]), nameCn: fields[1], nameKo: fields[2] };
});
check(JSON.stringify(spRows.map((row) => row.jobId)) === JSON.stringify(expectedIds), 'SP source IDs differ from the 25-record evidence scope');
check(spManifest.sourceSha256 === sha256(spBytes), 'SP source hash differs from its manifest');
check(spManifest.canonical === false && spManifest.generated === false && spManifest.productionRuntimeDependency === false, 'SP source authority boundary changed');

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
check(jobManifest.source.path === 'data/configdata/ConfigDataJobInfo.json', 'upstream ConfigData file locator mismatch');
check(jobManifest.source.gitBlobSha1 === '4cbcac591ff5bc8d7cf2dcbf971cf2465f0cb133', 'upstream ConfigData Git blob locator mismatch');
check(jobManifest.source.sha256 === '2e522fc464549cfe7ed1f5974e166b3952fa7398e07d0610ec2a90b950e094cf', 'upstream ConfigData source hash mismatch');
check(jobManifest.source.sourceVersionStatus === 'unknown', 'unknown source version must remain explicit');
check(jobManifest.source.sourceContract.semanticContentAuthority === 'PINNED_UNITYDATATOOL_PARSED_CONFIGDATA_SNAPSHOT', 'source contract authority locator changed');
check(jobManifest.source.sourceContract.sourceCommit === jobManifest.source.commit, 'source contract and source commit disagree');

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
check(evidence.spSourceManifest === spManifestPath && evidence.jobInfoSourceManifest === jobInfoManifestPath, 'namespace evidence source manifest locator mismatch');
exactKeys(evidence.claims, ['sourceRowValues', 'jobInfoNamespaceLinkage', 'officialKrName', 'releaseStatus'], 'namespace evidence claims');
check(evidence.claims.sourceRowValues.startsWith('A:'), 'SP source row claim must remain class A');
check(evidence.claims.jobInfoNamespaceLinkage.startsWith('B:'), 'JobInfo namespace claim must remain class B');
check(evidence.claims.officialKrName === 'unverified' && evidence.claims.releaseStatus === 'unresolved', 'unverified localization/release boundary changed');
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

process.stdout.write('SP Job namespace evidence: PASS (25/25 direct IDs; 25/25 CN consistency; 22 text candidates; 3 status markers)\n');
