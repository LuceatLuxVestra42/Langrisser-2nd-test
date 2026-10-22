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
  const presentationSubset = await readJson('evidence/localization/job-names-ko.hero-1-3-10-25.v1.json');
  const hero13Subset = await readJson('evidence/localization/job-names-ko.hero-13.v1.json');
  const batch3Subset = await readJson('evidence/localization/job-names-ko.hero-27-67.v1.json');
  const hero14Subset = await readJson('evidence/localization/job-names-ko.hero-14.v1.json');
  const hero11Subset = await readJson('evidence/localization/job-names-ko.hero-11.v1.json');
  const hero7Subset = await readJson('evidence/localization/job-names-ko.hero-7.v1.json');
  const hero26Subset = await readJson('evidence/localization/job-names-ko.hero-26.v1.json');
  const hero26SourcePacket = await readJson('evidence/source/jobs/hero-job-connection-presentation-hero-26.v1.json');
  const hero60Subset = await readJson('evidence/localization/job-names-ko.hero-60.v1.json');
  const hero60SourcePacket = await readJson('evidence/source/jobs/hero-job-connection-presentation-hero-60.v1.json');
  const hero4Subset = await readJson('evidence/localization/job-names-ko.hero-4.v1.json');
  const hero4SourcePacket = await readJson('evidence/source/jobs/hero-job-connection-presentation-hero-4.v1.json');
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
  const presentationJobIds = [101, 199, 201, 203, 206, 209, 299, 401, 602, 604, 605, 804, 809];
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

  exactKeys(presentationSubset, ['schemaVersion','sourceManifest','sourceScope','canonical','generated','productionRuntimeDependency','records'], 'Hero presentation localization evidence');
  check(presentationSubset.schemaVersion === 1 && presentationSubset.sourceManifest === 'evidence/localization/source/job-names-ko.source-manifest.v1.json' && presentationSubset.records.length === presentationJobIds.length && JSON.stringify(presentationSubset.records.map((row)=>row.jobId)) === JSON.stringify(presentationJobIds), 'Hero presentation localization evidence scope drift');
  check(presentationSubset.canonical === false && presentationSubset.generated === false && presentationSubset.productionRuntimeDependency === false, 'Hero presentation localization evidence authority boundary drift');
  const presentationJobInfo = await readJson('evidence/source/configdata/ConfigDataJobInfo.records-presentation-1-3-10-25.v1.json');
  const presentationJobById = new Map(presentationJobInfo.map((row)=>[row.ID,row]));
  for (const row of presentationSubset.records) {
    exactKeys(row, ['jobId','nameCn','nameKo','sourceLocator','evidenceClass'], `presentation localization Job ${row.jobId}`);
    const sourceRow=localizationRows.get(row.jobId);
    check(presentationJobIds.includes(row.jobId) && sourceRow && row.nameCn===sourceRow.nameCn && row.nameKo===sourceRow.nameKo && row.sourceLocator===`job-names-ko.v1.txt#전직ID=${row.jobId}` && row.evidenceClass==='A', `presentation localization source mapping mismatch for Job ${row.jobId}`);
    check(presentationJobById.get(row.jobId)?.Name===row.nameCn, `presentation localization CN/JobInfo mismatch for Job ${row.jobId}`);
  }
  check(hero13Subset.schemaVersion === 1 && hero13Subset.sourceManifest === 'evidence/localization/source/job-names-ko.source-manifest.v1.json'
    && hero13Subset.records.length === 1 && hero13Subset.canonical === false && hero13Subset.generated === false
    && hero13Subset.productionRuntimeDependency === false, 'Hero 13 localization evidence scope/authority drift');
  const hero13Label = hero13Subset.records[0];
  exactKeys(hero13Label, ['jobId','nameCn','nameKo','sourceLocator','evidenceClass'], 'Hero 13 Job 704 localization evidence');
  check(hero13Label.jobId === 704 && hero13Label.nameCn === localizationRows.get(704)?.nameCn && hero13Label.nameKo === localizationRows.get(704)?.nameKo
    && hero13Label.nameKo === '위저드' && hero13Label.nameCn === '巫师'
    && hero13Label.sourceLocator === 'job-names-ko.v1.txt#전직ID=704' && hero13Label.evidenceClass === 'A'
    && hero13Subset.sourceScope.includes('official Korean-server provenance unverified')
    && hero13Subset.claims?.rowValues?.startsWith('A:') && hero13Subset.claims?.jobInfoIdentityLinkage?.startsWith('B:')
    && hero13Subset.claims?.officialKrName === 'unverified', 'Hero 13 Job 704 localization source value/class/limitations drift');
  const hero13JobInfo = await readJson('evidence/source/configdata/ConfigDataJobInfo.records-presentation-hero-13.v1.json');
  check(hero13JobInfo.length === 1 && hero13JobInfo[0].ID === 704 && hero13JobInfo[0].Name === hero13Label.nameCn, 'Hero 13 Job 704 explicit JobInfo record mismatch');
  check(batch3Subset.schemaVersion === 1 && batch3Subset.sourceManifest === 'evidence/localization/source/job-names-ko.source-manifest.v1.json'
    && batch3Subset.records.length === 2 && batch3Subset.canonical === false && batch3Subset.generated === false
    && batch3Subset.productionRuntimeDependency === false && batch3Subset.claims?.officialKrName === 'unverified', 'Hero 27/67 localization evidence scope/authority drift');
  const batch3JobInfo = await readJson('evidence/source/configdata/ConfigDataJobInfo.records-presentation-heroes-27-67.v1.json');
  const batch3JobById = new Map(batch3JobInfo.map((row) => [row.ID, row]));
  for (const row of batch3Subset.records) {
    exactKeys(row, ['jobId','nameCn','nameKo','sourceLocator','evidenceClass'], `Hero 27/67 Job ${row.jobId} localization evidence`);
    check([1103,1105].includes(row.jobId) && row.nameCn === localizationRows.get(row.jobId)?.nameCn
      && row.nameKo === localizationRows.get(row.jobId)?.nameKo && row.sourceLocator === `job-names-ko.v1.txt#전직ID=${row.jobId}`
      && row.evidenceClass === 'A' && batch3JobById.get(row.jobId)?.Name === row.nameCn,
    `Hero 27/67 Job ${row.jobId} keyed source value or explicit JobInfo ID mismatch`);
  }
  check(hero14Subset.schemaVersion === 1 && hero14Subset.sourceManifest === 'evidence/localization/source/job-names-ko.source-manifest.v1.json'
    && hero14Subset.records.length === 1 && hero14Subset.canonical === false && hero14Subset.generated === false
    && hero14Subset.productionRuntimeDependency === false && hero14Subset.sourceScope.includes('source version unknown')
    && hero14Subset.sourceScope.includes('official Korean-server provenance unverified')
    && hero14Subset.claims?.rowValues?.startsWith('A:') && hero14Subset.claims?.jobInfoIdentityLinkage?.startsWith('B:')
    && hero14Subset.claims?.officialKrName === 'unverified', 'Hero 14 localization evidence scope/class/limitation drift');
  const hero14Label = hero14Subset.records[0];
  exactKeys(hero14Label, ['jobId','nameCn','nameKo','sourceLocator','evidenceClass'], 'Hero 14 Job 404 localization evidence');
  const hero14JobInfo = await readJson('evidence/source/configdata/ConfigDataJobInfo.records-presentation-hero-14.v1.json');
  check(hero14JobInfo.some((row) => row.ID === 404 && row.Name === '圣天马将军')
    && hero14Label.jobId === 404 && hero14Label.nameCn === '圣天马将军' && hero14Label.nameKo === '페가수스 로드'
    && localizationRows.get(404)?.nameCn === hero14Label.nameCn && localizationRows.get(404)?.nameKo === hero14Label.nameKo
    && hero14Label.sourceLocator === 'job-names-ko.v1.txt#전직ID=404' && hero14Label.evidenceClass === 'A',
  'Hero 14 Job 404 keyed source row or pinned JobInfo value mismatch');

  check(hero11Subset.schemaVersion === 1 && hero11Subset.sourceManifest === 'evidence/localization/source/job-names-ko.source-manifest.v1.json'
    && hero11Subset.records.length === 2 && hero11Subset.canonical === false && hero11Subset.generated === false
    && hero11Subset.productionRuntimeDependency === false && hero11Subset.sourceScope.includes('source version unknown')
    && hero11Subset.sourceScope.includes('official Korean-server provenance unverified')
    && hero11Subset.claims?.rowValues?.startsWith('A:') && hero11Subset.claims?.jobInfoIdentityLinkage?.startsWith('B:')
    && hero11Subset.claims?.officialKrName === 'unverified', 'Hero 11 localization evidence scope/class/limitation drift');
  const hero11JobInfo = await readJson('evidence/source/configdata/ConfigDataJobInfo.records-presentation-hero-11.v1.json');
  for (const [jobId, nameCn, nameKo] of [[601, '射手', '아처'], [406, '圣天马统帅', '페가수스 마스터']]) {
    const label = hero11Subset.records.find((row) => row.jobId === jobId);
    exactKeys(label, ['jobId','nameCn','nameKo','sourceLocator','evidenceClass'], `Hero 11 Job ${jobId} localization evidence`);
    check(label.nameCn === nameCn && label.nameKo === nameKo && label.nameCn === localizationRows.get(jobId)?.nameCn
      && label.nameKo === localizationRows.get(jobId)?.nameKo && label.sourceLocator === `job-names-ko.v1.txt#전직ID=${jobId}`
      && label.evidenceClass === 'A' && hero11JobInfo.some((row) => row.ID === jobId && row.Name === nameCn),
    `Hero 11 Job ${jobId} keyed source row or pinned JobInfo value mismatch`);
  }

  check(hero7Subset.schemaVersion === 1 && hero7Subset.sourceManifest === 'evidence/localization/source/job-names-ko.source-manifest.v1.json'
    && hero7Subset.records.length === 2 && hero7Subset.canonical === false && hero7Subset.generated === false
    && hero7Subset.productionRuntimeDependency === false && hero7Subset.sourceScope.includes('source version unknown')
    && hero7Subset.sourceScope.includes('official Korean-server provenance unverified')
    && hero7Subset.claims?.rowValues?.startsWith('A:') && hero7Subset.claims?.jobInfoIdentityLinkage?.startsWith('B:')
    && hero7Subset.claims?.officialKrName === 'unverified', 'Hero 7 localization evidence scope/class/limitation drift');
  const hero7JobInfo = await readJson('evidence/source/configdata/ConfigDataJobInfo.records-presentation-hero-7.v1.json');
  for (const [jobId, nameCn, nameKo] of [[205, '皇帝', '엠퍼러'], [208, '勇者', '용사']]) {
    const label = hero7Subset.records.find((row) => row.jobId === jobId);
    exactKeys(label, ['jobId','nameCn','nameKo','sourceLocator','evidenceClass'], `Hero 7 Job ${jobId} localization evidence`);
    check(label.nameCn === nameCn && label.nameKo === nameKo && label.nameCn === localizationRows.get(jobId)?.nameCn
      && label.nameKo === localizationRows.get(jobId)?.nameKo && label.sourceLocator === `job-names-ko.v1.txt#전직ID=${jobId}`
      && label.evidenceClass === 'A' && hero7JobInfo.some((row) => row.ID === jobId && row.Name === nameCn),
    `Hero 7 Job ${jobId} keyed source row or pinned JobInfo value mismatch`);
  }

  check(hero26Subset.schemaVersion === 1 && hero26Subset.sourceManifest === 'evidence/localization/source/job-names-ko.source-manifest.v1.json'
    && hero26Subset.records.length === 1 && hero26Subset.canonical === false && hero26Subset.generated === false
    && hero26Subset.productionRuntimeDependency === false && hero26Subset.sourceScope.includes('source version unknown')
    && hero26Subset.sourceScope.includes('official Korean-server provenance unverified')
    && hero26Subset.claims?.rowValues?.startsWith('A:') && hero26Subset.claims?.jobInfoIdentityLinkage?.startsWith('B:')
    && hero26Subset.claims?.officialKrName === 'unverified', 'Hero 26 Job 351 localization evidence scope/class/limitations drift');
  check(hero60Subset.schemaVersion === 1 && hero60Subset.sourceManifest === 'evidence/localization/source/job-names-ko.source-manifest.v1.json'
    && hero60Subset.records.length === 2 && hero60Subset.canonical === false && hero60Subset.generated === false
    && hero60Subset.productionRuntimeDependency === false && hero60Subset.sourceScope.includes('source version unknown')
    && hero60Subset.sourceScope.includes('official Korean-server provenance unverified')
    && hero60Subset.claims?.rowValues?.startsWith('A:') && hero60Subset.claims?.jobInfoIdentityLinkage?.startsWith('B:')
    && hero60Subset.claims?.officialKrName === 'unverified', 'Hero 60 localization evidence scope/class/limitation drift');
  const hero60JobInfo = await readJson('evidence/source/configdata/ConfigDataJobInfo.records-presentation-hero-60.v1.json');
  for (const [jobId, nameCn, nameKo] of [[213, '剑斗士', '글래디에이터'], [214, '剑斗统帅', '배틀 마스터']]) {
    const label = hero60Subset.records.find((row) => row.jobId === jobId);
    exactKeys(label, ['jobId','nameCn','nameKo','sourceLocator','evidenceClass'], `Hero 60 Job ${jobId} localization evidence`);
    check(label.nameCn === nameCn && label.nameKo === nameKo && label.nameCn === localizationRows.get(jobId)?.nameCn
      && label.nameKo === localizationRows.get(jobId)?.nameKo && label.sourceLocator === `job-names-ko.v1.txt#전직ID=${jobId}`
      && label.evidenceClass === 'A' && hero60JobInfo.some((row) => row.ID === jobId && row.Name === nameCn),
    `Hero 60 Job ${jobId} keyed source row or pinned JobInfo value mismatch`);
  }

  check(hero4Subset.schemaVersion === 1 && hero4Subset.sourceManifest === 'evidence/localization/source/job-names-ko.source-manifest.v1.json'
    && JSON.stringify(hero4Subset.records.map((row) => row.jobId)) === '[899,802,808]'
    && hero4Subset.canonical === false && hero4Subset.generated === false && hero4Subset.productionRuntimeDependency === false
    && hero4Subset.claims?.officialKrName === 'unverified', 'Hero 4 localization evidence scope/class/limitation drift');
  const hero4JobInfo = hero4SourcePacket.inspectedSourceRows.jobInfo;
  for (const [jobId, nameCn, nameKo] of [[899, '见习修女', '견습 시스터'], [802, '修女', '시스터'], [808, '神使', '오라클']]) {
    const label = hero4Subset.records.find((row) => row.jobId === jobId);
    exactKeys(label, ['jobId','nameCn','nameKo','sourceLocator','evidenceClass'], `Hero 4 Job ${jobId} localization evidence`);
    check(label.nameCn === nameCn && label.nameKo === nameKo && label.nameCn === localizationRows.get(jobId)?.nameCn
      && label.nameKo === localizationRows.get(jobId)?.nameKo && label.sourceLocator === `job-names-ko.v1.txt#전직ID=${jobId}`
      && label.evidenceClass === 'A' && hero4JobInfo.some((row) => row.ID === jobId && row.Name === nameCn),
    `Hero 4 Job ${jobId} keyed source row or pinned JobInfo value mismatch`);
  }

  const hero26Label = hero26Subset.records[0];
  exactKeys(hero26Label, ['jobId','nameCn','nameKo','sourceLocator','evidenceClass'], 'Hero 26 Job 351 localization evidence');
  check(hero26Label.jobId === 351 && hero26Label.nameCn === localizationRows.get(351)?.nameCn
    && hero26Label.nameKo === localizationRows.get(351)?.nameKo && hero26Label.nameCn === '独角兽骑士'
    && hero26Label.nameKo === '유니콘 나이트' && hero26Label.sourceLocator === 'job-names-ko.v1.txt#전직ID=351'
    && hero26Label.evidenceClass === 'A' && hero26SourcePacket.inspectedSourceRows.jobInfo.some((row) => row.ID === 351 && row.Name === hero26Label.nameCn),
  'Hero 26 Job 351 source row or pinned JobInfo value mismatch');

  const spValidation = await validateSpJobNamespaceEvidence();
  const spEvidenceById = new Map(spValidation.records.map((row) => [row.jobId, row]));
  const spExpected = new Map(
    spValidation.records
      .filter((row) => row.sourceKrFieldKind === 'localization_text_candidate')
      .map((row) => [row.jobId, row.nameKo]),
  );
  const spStatusIds = spValidation.statusOnlyIds;
  check(jobLocalization.schemaVersion === 1 && jobLocalization.records.length === targetJobIds.length + expansionJobIds.length + presentationJobIds.length + 14 + spExpected.size, 'canonical Job localization must contain expected complete record population');
  const admittedLocalization = new Map();
  for (const row of jobLocalization.records) {
    exactKeys(row, ['jobId', 'nameKo', 'evidenceClass', 'provenance'], `canonical Job localization ${row.jobId}`);
    check(!admittedLocalization.has(row.jobId), `duplicate canonical Job localization ID ${row.jobId}`);
    if ([601,406].includes(row.jobId)) {
      const evidence = hero11Subset.records.find((item) => item.jobId === row.jobId);
      check(evidence && row.nameKo === evidence.nameKo && row.evidenceClass === 'A'
        && row.provenance === `evidence/localization/job-names-ko.hero-11.v1.json#jobId=${row.jobId}`, `Hero 11 localization provenance drift for Job ${row.jobId}`);
    } else if ([205,208].includes(row.jobId)) {
      const evidence = hero7Subset.records.find((item) => item.jobId === row.jobId);
      check(row.nameKo === evidence?.nameKo && row.evidenceClass === 'A'
        && row.provenance === `evidence/localization/job-names-ko.hero-7.v1.json#jobId=${row.jobId}`, `Hero 7 localization provenance drift for Job ${row.jobId}`);
    } else if ([899,802,808].includes(row.jobId)) {
      const evidence = hero4Subset.records.find((item) => item.jobId === row.jobId);
      check(row.nameKo === evidence?.nameKo && row.evidenceClass === 'A'
        && row.provenance === `evidence/localization/job-names-ko.hero-4.v1.json#jobId=${row.jobId}`, `Hero 4 localization provenance drift for Job ${row.jobId}`);
    } else if ([213,214].includes(row.jobId)) {
      const evidence = hero60Subset.records.find((item) => item.jobId === row.jobId);
      check(row.nameKo === evidence?.nameKo && row.evidenceClass === 'A'
        && row.provenance === `evidence/localization/job-names-ko.hero-60.v1.json#jobId=${row.jobId}`, `Hero 60 localization provenance drift for Job ${row.jobId}`);
    } else if (row.jobId === 351) {
      check(row.nameKo === hero26Label.nameKo && row.evidenceClass === 'A'
        && row.provenance === 'evidence/localization/job-names-ko.hero-26.v1.json#jobId=351', 'Hero 26 Job 351 canonical localization provenance drift');
    } else if (row.jobId === 704) {
      check(row.nameKo === hero13Label.nameKo && row.evidenceClass === 'A' && row.provenance === 'evidence/localization/job-names-ko.hero-13.v1.json#jobId=704', 'Hero 13 Job 704 canonical localization provenance drift');
    } else if ([1103,1105].includes(row.jobId)) {
      const evidence = batch3Subset.records.find((item) => item.jobId === row.jobId);
      check(evidence && row.nameKo === evidence.nameKo && row.evidenceClass === 'A'
        && row.provenance === `evidence/localization/job-names-ko.hero-27-67.v1.json#jobId=${row.jobId}`, `Hero 27/67 localization provenance drift for Job ${row.jobId}`);
    } else if (row.jobId === 404) {
      check(row.nameKo === hero14Label.nameKo && row.evidenceClass === 'A'
        && row.provenance === 'evidence/localization/job-names-ko.hero-14.v1.json#jobId=404', 'Hero 14 Job 404 canonical localization provenance drift');
    } else if (targetJobIds.includes(row.jobId) || expansionJobIds.includes(row.jobId) || presentationJobIds.includes(row.jobId)) {
      const sourceRow = localizationRows.get(row.jobId);
      check(sourceRow && row.nameKo === sourceRow.nameKo && row.nameKo.trim() !== '' && !statusOnly.test(row.nameKo.trim()), `canonical KR label differs from usable source value for Job ${row.jobId}`);
      const expectedEvidencePath = targetJobIds.includes(row.jobId) ? 'evidence/localization/job-names-ko.hero-5-6-8.v1.json' : expansionJobIds.includes(row.jobId) ? 'evidence/localization/job-names-ko.hero-28-32-52-53.v1.json' : 'evidence/localization/job-names-ko.hero-1-3-10-25.v1.json';
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
    projectTextCount: targetJobIds.length + expansionJobIds.length + presentationJobIds.length + 11,
    spCount: spExpected.size,
  };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const result = await validateJobLocalization();
  process.stdout.write(`Job localization: PASS (${result.canonicalCount} canonical labels; ${result.projectTextCount} project-source; ${result.spCount} SP text labels)\n`);
}
