import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { renderGenerated } from './generate.mjs';

const root = process.cwd();
const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const exactKeys = (value, expected, label) => {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) {
    throw new Error(`${label} fields were ${actual.join(',')}; expected ${wanted.join(',')}`);
  }
};
const check = (condition, message) => { if (!condition) throw new Error(message); };

const localizationSourcePath = 'evidence/localization/source/job-names-ko.v1.txt';
const localizationManifest = await readJson('evidence/localization/source/job-names-ko.source-manifest.v1.json');
const localizationSubset = await readJson('evidence/localization/job-names-ko.hero-5-6-8.v1.json');
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
check(localizationSubset.schemaVersion === 1 && localizationSubset.records.length === targetJobIds.length, 'localization subset must contain exactly 18 records');
check(localizationSubset.canonical === false && localizationSubset.generated === false && localizationSubset.productionRuntimeDependency === false, 'localization evidence subset authority boundary drift');
check(localizationSubset.sourceManifest === 'evidence/localization/source/job-names-ko.source-manifest.v1.json', 'localization subset source manifest locator drift');
check(JSON.stringify(localizationSubset.records.map((row) => row.jobId)) === JSON.stringify(targetJobIds), 'localization subset Job ID scope or order drift');
const jobInfoRowsForLocalization = await readJson('evidence/source/configdata/ConfigDataJobInfo.records-hero-5-6-8.json');
const jobInfoByIdForLocalization = new Map(jobInfoRowsForLocalization.map((row) => [row.ID, row]));
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
check(jobLocalization.schemaVersion === 1 && jobLocalization.records.length === targetJobIds.length, 'canonical Job localization must contain exactly 18 records');
const admittedLocalization = new Map();
for (const row of jobLocalization.records) {
  exactKeys(row, ['jobId', 'nameKo', 'evidenceClass', 'provenance'], `canonical Job localization ${row.jobId}`);
  check(targetJobIds.includes(row.jobId) && !admittedLocalization.has(row.jobId), `unexpected or duplicate canonical Job localization ID ${row.jobId}`);
  const sourceRow = localizationRows.get(row.jobId);
  check(sourceRow && row.nameKo === sourceRow.nameKo && row.nameKo.trim() !== '' && !statusOnly.test(row.nameKo.trim()), `canonical KR label differs from usable source value for Job ${row.jobId}`);
  check(row.evidenceClass === 'A' && row.provenance === `evidence/localization/job-names-ko.hero-5-6-8.v1.json#jobId=${row.jobId}`, `canonical localization provenance drift for Job ${row.jobId}`);
  admittedLocalization.set(row.jobId, row.nameKo);
}

const canonical = await readJson('canonical/heroes.v1.json');
exactKeys(canonical, ['schemaVersion', 'sourceScope', 'records'], 'canonical');
check(canonical.schemaVersion === 1, 'unsupported canonical schemaVersion');
check(canonical.sourceScope === 'CN ConfigData snapshot 2026-09-02', 'canonical source scope drift');
const expected = new Map([[5, 'Chris'], [6, 'Leon'], [8, 'Lana']]);
check(canonical.records.length === expected.size, 'canonical must contain exactly three Heroes');
const ids = canonical.records.map((record) => record.id);
check(new Set(ids).size === ids.length, 'duplicate canonical Hero ID');
check(JSON.stringify([...ids].sort((a, b) => a - b)) === '[5,6,8]', 'canonical Hero IDs must be exactly 5, 6, and 8');

const heroInfoRows = await readJson('evidence/source/configdata/ConfigDataHeroInfo.records-5-6-8.json');
const heroInfoById = new Map(heroInfoRows.map((record) => [record.ID, record]));
const charRows = await readJson('evidence/source/configdata/ConfigDataCharImageInfo.records-5-6-8.json');
const charById = new Map(charRows.map((record) => [record.ID, record]));
const portraits = await readJson('evidence/source/portraits/hero-portrait-slice.v1.json');
const portraitByHero = new Map(portraits.records.map((record) => [record.heroId, record]));
const priorPortraitEvidence = await readJson('evidence/source/portraits/hero-portrait-prior-validation.v1.json');
const jobEvidence = await readJson('evidence/source/jobs/hero-job-connection-slice.v1.json');
const connectionRows = await readJson('evidence/source/configdata/ConfigDataJobConnectionInfo.records-hero-5-6-8.json');
const jobRows = await readJson('evidence/source/configdata/ConfigDataJobInfo.records-hero-5-6-8.json');
const connectionById = new Map(connectionRows.map((record) => [record.ID, record]));
const jobById = new Map(jobRows.map((record) => [record.ID, record]));
check(portraits.canonical === false && portraits.generated === false, 'portrait evidence must remain source evidence');
check(portraits.productionRuntimeDependency === false, 'evidence metadata must not become a runtime dependency');
check(portraits.scope.krDisplayName === 'C_DEFERRED' && portraits.scope.rankToRarity === 'C_DEFERRED', 'deferred claim status drift');
check(portraits.admissionBasis.contradictions.length === 0, 'unresolved contradiction exists in the admitted slice scope');
check(priorPortraitEvidence.canonical === false && priorPortraitEvidence.generated === false && priorPortraitEvidence.productionRuntimeDependency === false, 'surviving portrait support must remain non-runtime evidence');
check(priorPortraitEvidence.predecessor.repository === portraits.admissionBasis.priorValidation.repository, 'surviving portrait evidence repository locator drift');
check(priorPortraitEvidence.predecessor.commit === portraits.admissionBasis.priorValidation.commit, 'surviving portrait evidence commit locator drift');
check(priorPortraitEvidence.predecessor.validation.sourceTrace.gitBlobSha1 === portraits.admissionBasis.priorValidation.sourceTrace.gitBlobSha1, 'surviving source-trace locator drift');
check(priorPortraitEvidence.predecessor.validation.artworkValidation.gitBlobSha1 === portraits.admissionBasis.priorValidation.artworkValidation.gitBlobSha1, 'surviving artwork-validation locator drift');
check(priorPortraitEvidence.predecessor.sourceRecords.heroInfo.gitBlobSha1 === portraits.sourceRecords.heroInfo.sourceGitBlobSha1, 'surviving HeroInfo source locator drift');
check(priorPortraitEvidence.predecessor.sourceRecords.charImageInfo.gitBlobSha1 === portraits.sourceRecords.charImageInfo.sourceGitBlobSha1, 'surviving CharImageInfo source locator drift');
check(portraits.sourceRecords.charImageInfo.sourceGitBlobSha1 === '397afb3e76c0fe4f3e424c04ba68459ff48d74c5', 'CharImageInfo source locator drift');
check(portraits.sourceRecords.charImageInfo.sourceSha256 === '3a412fa72f8e4626bc5a723b8bede6a5b0f9032711bc3922f4234ea322b8582a', 'CharImageInfo source hash drift');
check(portraits.extraction.procedure.scriptGitBlobSha1 === 'a13be98a59dadcfc95e2287c138ff56e76b86518', 'extraction procedure locator drift');
check(priorPortraitEvidence.extraction.script.gitBlobSha1 === portraits.extraction.procedure.scriptGitBlobSha1, 'surviving extraction procedure locator drift');
check(priorPortraitEvidence.extraction.clientBuild.installVersion === portraits.extraction.clientBuild.installVersion, 'surviving client-build locator drift');
check(priorPortraitEvidence.extraction.clientBuild.packageBytes === portraits.extraction.clientBuild.packageBytes, 'surviving client-package size locator drift');
check(priorPortraitEvidence.records.length === 3, 'surviving portrait evidence must cover the selected slice only');
check(jobEvidence.canonical === false && jobEvidence.generated === false && jobEvidence.productionRuntimeDependency === false, 'Job relation evidence must remain source-only');
check(jobEvidence.sourceScope === canonical.sourceScope, 'Job relation evidence scope differs from canonical snapshot');
check(jobEvidence.claims.heroFieldToConnectionId.class === 'B' && jobEvidence.claims.connectionJobIdToJobInfoId.class === 'B' && jobEvidence.claims.selectedRecordsExist.class === 'A', 'Job relation evidence classes drift');
check(jobEvidence.limitations.some((item) => item.includes('not confirmed to match this exact snapshot')), 'Job relation version limitation must remain explicit');
check(connectionRows.length === 18 && jobRows.length === 18, 'preserved Job relation source subsets must contain exactly the 18 selected rows');
check(jobEvidence.records.length === 18, 'Job relation evidence manifest must cover exactly the selected relation rows');
const admittedPairs = new Set();
const expectedByHero = new Map([[5, 6], [6, 6], [8, 6]]);
const expectedPairs = new Map([
  [5, [817, 806, 807, 803, 812, 813]],
  [6, [301, 303, 302, 202, 307, 306]],
  [8, [701, 805, 702, 703, 810, 706]],
]);

for (const record of canonical.records) {
  exactKeys(record, ['id', 'nameEng', 'portrait', 'jobConnections', 'provenance'], `Hero ${record.id}`);
  exactKeys(record.provenance, ['identity', 'nameEng', 'portrait', 'jobConnections'], `Hero ${record.id} provenance`);
  check(expected.get(record.id) === record.nameEng, `Hero ${record.id} Name_Eng differs from admitted expected value`);
  const sourceHero = heroInfoById.get(record.id);
  check(sourceHero, `missing HeroInfo source record ${record.id}`);
  check(sourceHero.Name_Eng === record.nameEng, `Hero ${record.id} Name_Eng differs from raw source`);
  check(record.provenance.identity.includes(`#ID=${record.id}`), `Hero ${record.id} identity provenance locator missing`);
  check(record.provenance.nameEng.includes(`#ID=${record.id}/Name_Eng`), `Hero ${record.id} Name_Eng provenance locator missing`);
  check(record.provenance.jobConnections === `evidence/source/jobs/hero-job-connection-slice.v1.json#heroId=${record.id}`, `Hero ${record.id} Job relation evidence locator missing`);

  const portrait = portraitByHero.get(record.id);
  check(portrait, `missing portrait evidence record ${record.id}`);
  check(portrait.charImageIdClass === 'A', `Hero ${record.id} P1 raw CharImage_ID must remain A`);
  check(portrait.relationClass === 'B' && portrait.heroPaintingRoleClass === 'B' && portrait.sourceAssetClass === 'B' && portrait.reproducibilityClass === 'B', `Hero ${record.id} P2–P5 must remain B`);
  const survivingPortrait = priorPortraitEvidence.records.find((item) => item.heroId === record.id);
  check(survivingPortrait, `missing surviving portrait support record ${record.id}`);
  check(survivingPortrait.charImageId === portrait.charImageId && survivingPortrait.heroPainting === portrait.heroPainting, `Hero ${record.id} surviving source-record locator mismatch`);
  check(survivingPortrait.bundle.name === portrait.bundleName, `Hero ${record.id} surviving bundle locator mismatch`);
  check(survivingPortrait.objectGraph.prefabPathId === portrait.prefabPathId && survivingPortrait.objectGraph.spritePathId === portrait.spritePathId && survivingPortrait.objectGraph.texturePathId === portrait.texturePathId, `Hero ${record.id} surviving object-path locator mismatch`);
  check(survivingPortrait.extractedPng.sha256 === portrait.extractedSourcePng.sha256 && survivingPortrait.extractedPng.bytes === portrait.extractedSourcePng.bytes, `Hero ${record.id} surviving extracted-image integrity locator mismatch`);
  const bundleEvidence = priorPortraitEvidence.extraction.bundles[portrait.bundleName];
  check(bundleEvidence && bundleEvidence.sha256 === survivingPortrait.bundle.sha256 && bundleEvidence.bundleBytes === survivingPortrait.bundle.bytes, `Hero ${record.id} surviving bundle integrity locator mismatch`);
  check(sourceHero.CharImage_ID === portrait.charImageId, `Hero ${record.id} raw CharImage_ID does not match its source evidence value`);
  const charImage = charById.get(sourceHero.CharImage_ID);
  check(charImage, `CharImageInfo foreign-key lookup unresolved for Hero ${record.id}`);
  check(charImage.HeroPainting === portrait.heroPainting, `Hero ${record.id} HeroPainting differs from preserved source row`);
  check(record.provenance.portrait.endsWith(`#heroId=${record.id}`), `Hero ${record.id} portrait provenance locator missing`);
  check(record.portrait === portrait.extractedSourcePng.path, `Hero ${record.id} canonical portrait path differs from evidence`);
  const sourceFields = new Map([[sourceHero.JobConnection_ID, 'JobConnection_ID'], ...sourceHero.UseableJobConnections_ID.map((connectionId) => [connectionId, 'UseableJobConnections_ID'])]);
  check(record.jobConnections.length === expectedByHero.get(record.id), `Hero ${record.id} must have exactly the selected six Job connection records`);
  check(JSON.stringify(record.jobConnections.map((item) => item.jobId)) === JSON.stringify(expectedPairs.get(record.id)), `Hero ${record.id} Job relation pairs changed from the admitted slice`);
  const sourceIds = [sourceHero.JobConnection_ID, ...sourceHero.UseableJobConnections_ID];
  check(JSON.stringify(record.jobConnections.map((item) => item.connectionId)) === JSON.stringify(sourceIds), `Hero ${record.id} Job connection IDs must follow the explicit raw HeroInfo fields in stored source order`);
  for (const relation of record.jobConnections) {
    exactKeys(relation, ['connectionId', 'jobId', 'sourceField'], `Hero ${record.id} Job relation`);
    check(relation.sourceField === sourceFields.get(relation.connectionId), `Hero ${record.id} relation sourceField differs from raw HeroInfo`);
    const key = `${record.id}:${relation.connectionId}`;
    check(!admittedPairs.has(key), `duplicate Hero connection pair ${key}`);
    admittedPairs.add(key);
    const sourceRelation = connectionById.get(relation.connectionId);
    check(sourceRelation, `missing preserved JobConnectionInfo.ID ${relation.connectionId}`);
    check(sourceRelation.Job_ID === relation.jobId, `Hero ${record.id} connection ${relation.connectionId} Job_ID differs from canonical target`);
    check(jobById.has(relation.jobId), `missing preserved JobInfo.ID ${relation.jobId}`);
    const manifestRow = jobEvidence.records.find((item) => item.heroId === record.id && item.connectionId === relation.connectionId);
    check(manifestRow && manifestRow.jobId === relation.jobId && manifestRow.sourceField === relation.sourceField, `Hero ${record.id} relation evidence locator mismatch for connection ${relation.connectionId}`);
  }
  check(/^assets\/portraits\/hero-(5|6|8)\.png$/.test(record.portrait), `Hero ${record.id} portrait path outside slice asset scope`);
  check(/^[-]?\d+$/.test(portrait.prefabPathId) && /^[-]?\d+$/.test(portrait.spritePathId) && /^[-]?\d+$/.test(portrait.texturePathId), `Hero ${record.id} Unity path IDs must be exact decimal strings`);
  const assetPath = resolve(root, record.portrait);
  check(assetPath.startsWith(`${root}${sep}`), `Hero ${record.id} portrait path escapes repository`);
  const bytes = await readFile(assetPath);
  const digest = createHash('sha256').update(bytes).digest('hex');
  check(bytes.length === portrait.extractedSourcePng.bytes, `Hero ${record.id} portrait byte length mismatch`);
  check(digest === portrait.extractedSourcePng.sha256, `Hero ${record.id} portrait SHA-256 mismatch`);
  check(portrait.extractedSourcePng.width > 0 && portrait.extractedSourcePng.height > 0, `Hero ${record.id} portrait dimensions invalid`);
  check(JSON.stringify(survivingPortrait.extractedPng.dimensions) === JSON.stringify([portrait.extractedSourcePng.width, portrait.extractedSourcePng.height]), `Hero ${record.id} surviving image dimensions locator mismatch`);
}

const expectedGenerated = renderGenerated(canonical, jobLocalization);
const generated = await readFile(resolve(root, 'generated/hero-slice.v1.json'), 'utf8');
check(generated === expectedGenerated, 'generated consumer is stale or non-deterministic relative to canonical input');
const generatedJson = JSON.parse(generated);
exactKeys(generatedJson, ['schemaVersion', 'heroes'], 'generated consumer');
check(generatedJson.heroes.every((hero) => JSON.stringify(Object.keys(hero).sort()) === JSON.stringify(['id', 'jobConnections', 'nameEng', 'portrait'])), 'generated consumer contains non-presentation fields');
for (const hero of generatedJson.heroes) {
  const sourceHero = canonical.records.find((record) => record.id === hero.id);
  check(JSON.stringify(hero.jobConnections) === JSON.stringify(sourceHero.jobConnections.map((relation) => ({ ...relation, jobNameKo: admittedLocalization.get(relation.jobId) }))), `generated Job connections differ from canonical for Hero ${hero.id}`);
}

process.stdout.write('Hero slice validator: PASS (localization source integrity, 18-ID exact lookup, JobInfo ID consistency, relation pairs, source locators, asset integrity, generated freshness; deferred semantics excluded)\n');
