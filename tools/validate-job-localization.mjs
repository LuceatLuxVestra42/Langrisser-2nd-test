import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { validateSpJobNamespaceEvidence } from './validate-sp-job-namespace-evidence.mjs';

const exactKeys = (value, expected, label) => {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) {
    throw new Error(`${label} fields were ${actual.join(',')}; expected ${wanted.join(',')}`);
  }
};
const check = (condition, message) => { if (!condition) throw new Error(message); };

export async function validateJobLocalization(root = process.cwd()) {
  const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
  const localizationSourcePath = 'evidence/localization/source/job-names-ko.v1.txt';
  const localizationManifest = await readJson('evidence/localization/source/job-names-ko.source-manifest.v1.json');
  const localizationSubset = await readJson('evidence/localization/job-names-ko.hero-5-6-8.v1.json');
  const expansionSubset = await readJson('evidence/localization/job-names-ko.hero-28-32-52-53.v1.json');
  const jobLocalization = await readJson('canonical/job-localizations-ko.v1.json');
  const localizationBytes = await readFile(resolve(root, localizationSourcePath));
  const localizationText = localizationBytes.toString('utf8').replace(/^\uFEFF/, '');
  const localizationLines = localizationText.split(/\r?\n/);
  if (localizationLines.at(-1) === '') localizationLines.pop();
  const localizationHeader = ['전직ID', '중국명', '한국명'];
  check(JSON.stringify(localizationLines[0]?.split('\t')) === JSON.stringify(localizationHeader), 'localization source header drift');
  check(localizationManifest.repoPreservedPath === localizationSourcePath, 'localization preserved source path drift');
  check(localizationManifest.sourceSha256 === createHash('sha256').update(localizationBytes).digest('hex'), 'preserved localization source hash differs from manifest');
  check(localizationManifest.recordCount === localizationLines.length - 1, 'localization source record count differs from manifest');
  check(localizationManifest.idField === '전직ID' && localizationManifest.cnNameField === '중국명' && localizationManifest.krNameField === '한국명', 'localization source field metadata drift');
  check(localizationManifest.sourceRole === 'job_localization_reference' && localizationManifest.canonical === false && localizationManifest.generated === false && localizationManifest.productionRuntimeDependency === false, 'localization source authority boundary drift');
  check(localizationManifest.sourceVersionStatus === 'unknown' && localizationManifest.sourceProvenanceStatus === 'incomplete' && localizationManifest.officialKrProvenanceStatus === 'unverified', 'localization source limitation metadata drift');
  for (const limitation of ['한국명 필드에 일부 상태 문자열', '공식 한섭 provenance', 'release 상태 authority가 아니다', '중국명·한국명으로 JOIN하지 않는다']) {
    check(localizationManifest.knownLimitations.some((item) => item.includes(limitation)), `localization limitation missing: ${limitation}`);
  }
  const localizationRows = new Map();
  for (const [index, line] of localizationLines.slice(1).entries()) {
    const fields = line.split('\t');
    check(fields.length === 3, `localization source row ${index + 2} does not have exactly three fields`);
    check(/^\d+$/.test(fields[0]), `localization source row ${index + 2} has malformed ID`);
    const jobId = Number(fields[0]);
    check(!localizationRows.has(jobId), `duplicate localization source ID ${jobId}`);
    localizationRows.set(jobId, { nameCn: fields[1], nameKo: fields[2] });
  }
  const targetJobIds = [817, 806, 807, 803, 812, 813, 301, 303, 302, 202, 307, 306, 701, 805, 702, 703, 810, 706];
  const expansionJobIds = [102, 104, 207, 304, 402, 403, 405, 502, 503, 603, 1006, 1007, 1101, 1102, 1104];
  check(localizationSubset.schemaVersion === 1 && localizationSubset.records.length === targetJobIds.length, 'localization subset must contain exactly 18 records');
  check(localizationSubset.canonical === false && localizationSubset.generated === false && localizationSubset.productionRuntimeDependency === false, 'localization evidence subset authority boundary drift');
  check(localizationSubset.sourceManifest === 'evidence/localization/source/job-names-ko.source-manifest.v1.json', 'localization subset source manifest locator drift');
  check(JSON.stringify(localizationSubset.records.map((row) => row.jobId)) === JSON.stringify(targetJobIds), 'localization subset Job ID scope or order drift');
  const jobInfoRowsForLocalization = await readJson('evidence/source/configdata/ConfigDataJobInfo.records-hero-5-6-8.json');
  const jobInfoByIdForLocalization = new Map(jobInfoRowsForLocalization.map((row) => [row.ID, row]));
  const expansionJobInfoRowsForLocalization = await readJson('evidence/source/configdata/ConfigDataJobInfo.records-hero-expansion.v1.json');
  const expansionJobInfoByIdForLocalization = new Map(expansionJobInfoRowsForLocalization.map((row) => [row.ID, row]));
  const statusOnly = /^(?:한섭\s*미실장|TODO|placeholder|임시|unknown|미확인)$/i;
  for (const row of localizationSubset.records) {
    exactKeys(row, ['jobId', 'nameCn', 'nameKo', 'sourceLocator', 'evidenceClass'], `localization subset Job ${row.jobId}`);
    const sourceRow = localizationRows.get(row.jobId);
    check(sourceRow, `localization source missing target ID ${row.jobId}`);
    check(row.nameCn === sourceRow.nameCn, `localization CN value differs from source for Job ${row.jobId}`);
    check(row.nameKo === sourceRow.nameKo, `localization KR value differs from source for Job ${row.jobId}`);
    check(row.nameKo.trim() !== '' && !statusOnly.test(row.nameKo.trim()), `localization Job ${row.jobId} has blank or status-only KR value`);
    check(row.sourceLocator === `job-names-ko.v1.txt#전직ID=${row.jobId}`, `localization source locator drift for Job ${row.jobId}`);
    check(row.evidenceClass === 'A', `localization Job ${row.jobId} direct source value must remain class A`);
    const jobInfo = jobInfoByIdForLocalization.get(row.jobId);
    check(jobInfo?.ID === row.jobId, `explicit JobInfo.ID match missing for localization Job ${row.jobId}`);
    check(jobInfo.Name === row.nameCn, `localization CN consistency check failed for Job ${row.jobId}`);
  }

  exactKeys(expansionSubset, ['schemaVersion', 'sourceManifest', 'sourceScope', 'canonical', 'generated', 'productionRuntimeDependency', 'records'], 'Hero expansion localization evidence');
  check(expansionSubset.schemaVersion === 1 && expansionSubset.sourceScope === 'KR display text from preserved project source; official KR provenance unverified' && expansionSubset.records.length === expansionJobIds.length, 'Hero expansion localization subset must contain exactly 15 records');
  check(expansionSubset.canonical === false && expansionSubset.generated === false && expansionSubset.productionRuntimeDependency === false, 'Hero expansion localization evidence authority boundary drift');
  check(expansionSubset.sourceManifest === 'evidence/localization/source/job-names-ko.source-manifest.v1.json', 'Hero expansion localization source manifest locator drift');
  check(JSON.stringify(expansionSubset.records.map((row) => row.jobId)) === JSON.stringify(expansionJobIds), 'Hero expansion localization ID scope or order drift');
  for (const row of expansionSubset.records) {
    exactKeys(row, ['jobId', 'nameCn', 'nameKo', 'sourceLocator', 'evidenceClass'], `Hero expansion localization Job ${row.jobId}`);
    const sourceRow = localizationRows.get(row.jobId);
    check(sourceRow, `localization source missing expansion target ID ${row.jobId}`);
    check(row.nameCn === sourceRow.nameCn, `expansion localization CN value differs from source for Job ${row.jobId}`);
    check(row.nameKo === sourceRow.nameKo, `expansion localization KR value differs from source for Job ${row.jobId}`);
    check(row.nameKo.trim() !== '' && !statusOnly.test(row.nameKo.trim()), `expansion localization Job ${row.jobId} has blank or status-only KR value`);
    check(row.sourceLocator === `job-names-ko.v1.txt#전직ID=${row.jobId}`, `expansion localization source locator drift for Job ${row.jobId}`);
    check(row.evidenceClass === 'A', `expansion localization Job ${row.jobId} direct source value must remain class A`);
    const jobInfo = expansionJobInfoByIdForLocalization.get(row.jobId);
    check(jobInfo?.ID === row.jobId, `explicit expansion JobInfo.ID match missing for localization Job ${row.jobId}`);
    check(jobInfo.Name === row.nameCn, `expansion localization CN consistency check failed for Job ${row.jobId}`);
  }

  const spValidation = await validateSpJobNamespaceEvidence();
  const spEvidenceById = new Map(spValidation.records.map((row) => [row.jobId, row]));
  const spExpected = new Map(
    spValidation.records
      .filter((row) => row.sourceKrFieldKind === 'localization_text_candidate')
      .map((row) => [row.jobId, row.nameKo]),
  );
  const spStatusIds = spValidation.statusOnlyIds;
  check(jobLocalization.schemaVersion === 1 && jobLocalization.records.length === targetJobIds.length + expansionJobIds.length + spExpected.size, 'canonical Job localization must contain exactly 55 records');
  const admittedLocalization = new Map();
  for (const row of jobLocalization.records) {
    exactKeys(row, ['jobId', 'nameKo', 'evidenceClass', 'provenance'], `canonical Job localization ${row.jobId}`);
    check(!admittedLocalization.has(row.jobId), `duplicate canonical Job localization ID ${row.jobId}`);
    if (targetJobIds.includes(row.jobId) || expansionJobIds.includes(row.jobId)) {
      const sourceRow = localizationRows.get(row.jobId);
      check(sourceRow && row.nameKo === sourceRow.nameKo && row.nameKo.trim() !== '' && !statusOnly.test(row.nameKo.trim()), `canonical KR label differs from usable source value for Job ${row.jobId}`);
      const expectedEvidencePath = targetJobIds.includes(row.jobId) ? 'evidence/localization/job-names-ko.hero-5-6-8.v1.json' : 'evidence/localization/job-names-ko.hero-28-32-52-53.v1.json';
      check(row.evidenceClass === 'A' && row.provenance === `${expectedEvidencePath}#jobId=${row.jobId}`, `canonical localization provenance drift for Job ${row.jobId}`);
    } else if (spExpected.has(row.jobId)) {
      const evidence = spEvidenceById.get(row.jobId);
      check(row.nameKo === evidence?.nameKo, `canonical SP KR label differs from evidence value for Job ${row.jobId}`);
      check(row.evidenceClass === 'A' && row.provenance === `evidence/localization/sp-job-namespace.v1.json#jobId=${row.jobId}`, `canonical SP localization provenance drift for Job ${row.jobId}`);
    } else {
      throw new Error(`unexpected canonical Job localization ID ${row.jobId}`);
    }
    check(!spStatusIds.includes(row.jobId), `status-only SP Job ${row.jobId} must not be admitted`);
    admittedLocalization.set(row.jobId, row.nameKo);
  }
  check(JSON.stringify([...admittedLocalization.keys()].filter((id) => spExpected.has(id)).sort((a,b)=>a-b)) === JSON.stringify([...spExpected.keys()].sort((a,b)=>a-b)), 'canonical SP localization ID scope drift');

  return {
    canonicalCount: jobLocalization.records.length,
    projectTextCount: targetJobIds.length + expansionJobIds.length,
    spCount: spExpected.size,
  };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const result = await validateJobLocalization();
  process.stdout.write(`Job localization: PASS (${result.canonicalCount} canonical labels; ${result.projectTextCount} project-source; ${result.spCount} SP text labels)\n`);
}
