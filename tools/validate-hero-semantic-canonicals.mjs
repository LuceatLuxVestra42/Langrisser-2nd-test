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
  const expansionHeroPath = 'evidence/source/configdata/ConfigDataHeroInfo.records-hero-expansion.v1.json';
  const expansionConnectionPath = 'evidence/source/configdata/ConfigDataJobConnectionInfo.records-hero-expansion.v1.json';
  const expansionJobPath = 'evidence/source/configdata/ConfigDataJobInfo.records-hero-expansion.v1.json';
  const expansionEvidencePath = 'evidence/source/jobs/hero-job-connection-expansion.v1.json';
  const presentationEvidencePath = 'evidence/source/jobs/hero-job-connection-presentation-1-3-10-25.v1.json';
  const batch2EvidencePath = 'evidence/source/jobs/hero-job-connection-presentation-batch-2.v1.json';
  const hero13EvidencePath = 'evidence/source/jobs/hero-job-connection-presentation-hero-13.v1.json';
  const batch3EvidencePath = 'evidence/source/jobs/hero-job-connection-presentation-heroes-27-67.v1.json';
  const batch4EvidencePath = 'evidence/source/jobs/hero-job-connection-presentation-hero-14.v1.json';
  const hero11EvidencePath = 'evidence/source/jobs/hero-job-connection-presentation-hero-11.v1.json';
  const hero7EvidencePath = 'evidence/source/jobs/hero-job-connection-presentation-hero-7.v1.json';
  const hero26EvidencePath = 'evidence/source/jobs/hero-job-connection-presentation-hero-26.v1.json';
  const hero60EvidencePath = 'evidence/source/jobs/hero-job-connection-presentation-hero-60.v1.json';
  const hero4EvidencePath = 'evidence/source/jobs/hero-job-connection-presentation-hero-4.v1.json';
  const [identities, identityEvidence, identityManifest, relations, selected, classicEvidence, expansionEvidence, expansionHeroes, expansionConnections, expansionJobs, spEvidence, classicJobs, spJobs] = await Promise.all([
    readJson(identityPath),
    readJson(identityEvidencePath),
    readJson(identityManifestPath),
    readJson(relationPath),
    readJson('canonical/heroes.v1.json'),
    readJson('evidence/source/jobs/hero-job-connection-slice.v1.json'),
    readJson(expansionEvidencePath),
    readJson(expansionHeroPath),
    readJson(expansionConnectionPath),
    readJson(expansionJobPath),
    readJson('evidence/source/jobs/hero-sp-job-relation.v1.json'),
    readJson('evidence/source/configdata/ConfigDataJobInfo.records-hero-5-6-8.json'),
    readJson('evidence/source/configdata/ConfigDataJobInfo.records-sp-job-localization.v1.json'),
  ]);
  const presentationEvidence = await readJson(presentationEvidencePath);
  const batch2Evidence = await readJson(batch2EvidencePath);
  const hero13Evidence = await readJson(hero13EvidencePath);
  const batch3Evidence = await readJson(batch3EvidencePath);
  const batch4Evidence = await readJson(batch4EvidencePath);
  const hero11Evidence = await readJson(hero11EvidencePath);
  const hero7Evidence = await readJson(hero7EvidencePath);
  const hero26Evidence = await readJson(hero26EvidencePath);
  const hero60Evidence = await readJson(hero60EvidencePath);
  const hero4Evidence = await readJson(hero4EvidencePath);
  check(hero11Evidence.source?.repository === 'LuceatLuxVestra42/langrisser-future-guide'
    && hero11Evidence.source?.commit === '6475e63ee23d18adf733756c26a14fa9e3ed662c'
    && hero11Evidence.sourceFiles?.['ConfigDataHeroInfo.json']?.gitBlob === '728daab3370f0c7779449663ea02e638677944d4'
    && hero11Evidence.sourceFiles?.['ConfigDataJobConnectionInfo.json']?.gitBlob === 'cdad8d6fda6edd30c92fbcda53e0f63af1903139'
    && hero11Evidence.sourceFiles?.['ConfigDataJobInfo.json']?.gitBlob === '4cbcac591ff5bc8d7cf2dcbf971cf2465f0cb133'
    && JSON.stringify(hero11Evidence.selection?.heroIds) === '[11]'
    && JSON.stringify(hero11Evidence.selection?.connectionIds) === '[110,111,112,113,114,115]'
    && JSON.stringify(hero11Evidence.selection?.jobIds) === '[601,102,602,404,604,406]'
    && hero11Evidence.claimClasses?.heroFieldToConnectionId === 'B'
    && hero11Evidence.claimClasses?.connectionJobIdToJobInfoId === 'B'
    && hero11Evidence.claimClasses?.selectedRecordsExist === 'A'
    && hero11Evidence.claimClasses?.jobInfoNameValue === 'A'
    && hero11Evidence.directInspection?.rawRecordDirectlyInspected === true
    && hero11Evidence.directInspection?.inspectionCommit === hero11Evidence.source.commit
    && hero11Evidence.canonical === false && hero11Evidence.generated === false
    && hero11Evidence.productionRuntimeDependency === false, 'Hero 11 evidence pin/scope/class boundary drift');
  const hero11Source = hero11Evidence.inspectedSourceRows.heroInfo.find((row) => row.ID === 11);
  const hero11Connections = new Map(hero11Evidence.inspectedSourceRows.jobConnectionInfo.map((row) => [row.ID, row]));
  const hero11Jobs = new Map(hero11Evidence.inspectedSourceRows.jobInfo.map((row) => [row.ID, row]));
  check(hero11Source?.Name === '娜姆' && hero11Source?.Name_Eng === 'Nurm' && hero11Source?.Useable === true
    && hero11Source?.JobConnection_ID === 110 && JSON.stringify(hero11Source?.UseableJobConnections_ID) === '[111,112,113,114,115]',
  'Hero 11 exact HeroInfo source record drift');
  for (const row of hero11Evidence.records) {
    const sourceFieldIds = row.sourceField === 'JobConnection_ID' ? [hero11Source.JobConnection_ID] : hero11Source.UseableJobConnections_ID;
    const connection = hero11Connections.get(row.connectionId);
    check(row.heroId === 11 && sourceFieldIds.includes(row.connectionId) && connection?.Job_ID === row.jobId
      && hero11Jobs.has(row.jobId)
      && row.sourceHeroInfoLocator === `data/configdata/ConfigDataHeroInfo.json#[ID=11].${row.sourceField}`
      && row.jobConnectionInfoLocator === `data/configdata/ConfigDataJobConnectionInfo.json#[ID=${row.connectionId}]`
      && row.jobInfoLocator === `data/configdata/ConfigDataJobInfo.json#[ID=${row.jobId}]`, `Hero 11 explicit source join mismatch ${row.connectionId}`);
  }
  check(hero11Evidence.records.length === 6 && hero11Connections.size === 6 && hero11Jobs.size === 6, 'Hero 11 source packet cardinality drift');
  check(hero7Evidence.source?.repository === 'LuceatLuxVestra42/langrisser-future-guide'
    && hero7Evidence.source?.commit === '6475e63ee23d18adf733756c26a14fa9e3ed662c'
    && hero7Evidence.sourceFiles?.['ConfigDataHeroInfo.json']?.gitBlob === '728daab3370f0c7779449663ea02e638677944d4'
    && hero7Evidence.sourceFiles?.['ConfigDataJobConnectionInfo.json']?.gitBlob === 'cdad8d6fda6edd30c92fbcda53e0f63af1903139'
    && hero7Evidence.sourceFiles?.['ConfigDataJobInfo.json']?.gitBlob === '4cbcac591ff5bc8d7cf2dcbf971cf2465f0cb133'
    && JSON.stringify(hero7Evidence.selection?.heroIds) === '[7]'
    && JSON.stringify(hero7Evidence.selection?.connectionIds) === '[70,71,72,73,74,75]'
    && JSON.stringify(hero7Evidence.selection?.jobIds) === '[201,202,203,102,205,208]'
    && hero7Evidence.claimClasses?.heroFieldToConnectionId === 'B'
    && hero7Evidence.claimClasses?.connectionJobIdToJobInfoId === 'B'
    && hero7Evidence.claimClasses?.selectedRecordsExist === 'A'
    && hero7Evidence.claimClasses?.jobInfoNameValue === 'A'
    && hero7Evidence.directInspection?.rawRecordDirectlyInspected === true
    && hero7Evidence.directInspection?.inspectionCommit === hero7Evidence.source.commit
    && hero7Evidence.canonical === false && hero7Evidence.generated === false
    && hero7Evidence.productionRuntimeDependency === false, 'Hero 7 evidence pin/scope/class boundary drift');
  const hero7Source = hero7Evidence.inspectedSourceRows.heroInfo.find((row) => row.ID === 7);
  const hero7Connections = new Map(hero7Evidence.inspectedSourceRows.jobConnectionInfo.map((row) => [row.ID, row]));
  const hero7Jobs = new Map(hero7Evidence.inspectedSourceRows.jobInfo.map((row) => [row.ID, row]));
  check(hero7Source?.Name === '巴恩哈特' && hero7Source?.Name_Eng === 'Bernhardt' && hero7Source?.Useable === true
    && hero7Source?.JobConnection_ID === 70 && JSON.stringify(hero7Source?.UseableJobConnections_ID) === '[71,72,73,74,75]',
  'Hero 7 exact HeroInfo source record drift');
  for (const row of hero7Evidence.records) {
    const sourceFieldIds = row.sourceField === 'JobConnection_ID' ? [hero7Source.JobConnection_ID] : hero7Source.UseableJobConnections_ID;
    const connection = hero7Connections.get(row.connectionId);
    check(row.heroId === 7 && sourceFieldIds.includes(row.connectionId) && connection?.Job_ID === row.jobId
      && hero7Jobs.has(row.jobId)
      && row.sourceHeroInfoLocator === `data/configdata/ConfigDataHeroInfo.json#[ID=7].${row.sourceField}`
      && row.jobConnectionInfoLocator === `data/configdata/ConfigDataJobConnectionInfo.json#[ID=${row.connectionId}]`
      && row.jobInfoLocator === `data/configdata/ConfigDataJobInfo.json#[ID=${row.jobId}]`, `Hero 7 explicit source join mismatch ${row.connectionId}`);
  }
  check(hero7Evidence.records.length === 6 && hero7Connections.size === 6 && hero7Jobs.size === 6, 'Hero 7 source packet cardinality drift');
  check(hero26Evidence.source?.repository === 'LuceatLuxVestra42/langrisser-future-guide'
    && hero26Evidence.source?.commit === '6475e63ee23d18adf733756c26a14fa9e3ed662c'
    && hero26Evidence.sourceFiles?.['ConfigDataHeroInfo.json']?.gitBlob === '728daab3370f0c7779449663ea02e638677944d4'
    && hero26Evidence.sourceFiles?.['ConfigDataJobConnectionInfo.json']?.gitBlob === 'cdad8d6fda6edd30c92fbcda53e0f63af1903139'
    && hero26Evidence.sourceFiles?.['ConfigDataJobInfo.json']?.gitBlob === '4cbcac591ff5bc8d7cf2dcbf971cf2465f0cb133'
    && JSON.stringify(hero26Evidence.selection?.heroIds) === '[26]'
    && JSON.stringify(hero26Evidence.selection?.connectionIds) === '[260,261,262,263,264,265]'
    && JSON.stringify(hero26Evidence.selection?.jobIds) === '[402,603,404,351,605,406]'
    && hero26Evidence.claimClasses?.heroFieldToConnectionId === 'B'
    && hero26Evidence.claimClasses?.connectionJobIdToJobInfoId === 'B'
    && hero26Evidence.claimClasses?.selectedRecordsExist === 'A'
    && hero26Evidence.claimClasses?.jobInfoNameValue === 'A'
    && hero26Evidence.directInspection?.rawRecordDirectlyInspected === true
    && hero26Evidence.directInspection?.inspectionCommit === hero26Evidence.source.commit
    && hero26Evidence.canonical === false && hero26Evidence.generated === false
    && hero26Evidence.productionRuntimeDependency === false, 'Hero 26 evidence pin/scope/class boundary drift');
  const hero26Source = hero26Evidence.inspectedSourceRows.heroInfo.find((row) => row.ID === 26);
  const hero26Connections = new Map(hero26Evidence.inspectedSourceRows.jobConnectionInfo.map((row) => [row.ID, row]));
  const hero26Jobs = new Map(hero26Evidence.inspectedSourceRows.jobInfo.map((row) => [row.ID, row]));
  check(hero26Source?.Name === '露娜' && hero26Source?.Name_Eng === 'Luna' && hero26Source?.Useable === true
    && hero26Source?.JobConnection_ID === 260 && isDeepStrictEqual(hero26Source?.UseableJobConnections_ID, [261,262,263,264,265]),
  'Hero 26 exact HeroInfo source refs drift');
  const hero26Refs = new Set();
  for (const [field, ids] of [['JobConnection_ID',[hero26Source.JobConnection_ID]],['UseableJobConnections_ID',hero26Source.UseableJobConnections_ID]]) {
    for (const connectionId of ids) {
      const connection = hero26Connections.get(connectionId);
      const job = connection && hero26Jobs.get(connection.Job_ID);
      const evidence = hero26Evidence.records.find((row) => row.heroId === 26 && row.connectionId === connectionId);
      check(connection && job && evidence?.sourceField === field && evidence.jobId === connection.Job_ID
        && evidence.sourceHeroInfoLocator === `data/configdata/ConfigDataHeroInfo.json#[ID=26].${field}`
        && evidence.jobConnectionInfoLocator === `data/configdata/ConfigDataJobConnectionInfo.json#[ID=${connectionId}]`
        && evidence.jobInfoLocator === `data/configdata/ConfigDataJobInfo.json#[ID=${connection.Job_ID}]`, `Hero 26 explicit Job join evidence mismatch at ${connectionId}`);
      hero26Refs.add(`${connectionId}:${connection.Job_ID}`);
    }
  }
  check(hero26Refs.size === 6 && hero26Refs.size === hero26Evidence.records.length, 'Hero 26 evidence must contain exactly six explicit connection joins');
  check(hero60Evidence.source?.repository === 'LuceatLuxVestra42/langrisser-future-guide'
    && hero60Evidence.source?.commit === '6475e63ee23d18adf733756c26a14fa9e3ed662c'
    && hero60Evidence.sourceFiles?.['ConfigDataHeroInfo.json']?.gitBlob === '728daab3370f0c7779449663ea02e638677944d4'
    && hero60Evidence.sourceFiles?.['ConfigDataJobConnectionInfo.json']?.gitBlob === 'cdad8d6fda6edd30c92fbcda53e0f63af1903139'
    && hero60Evidence.sourceFiles?.['ConfigDataJobInfo.json']?.gitBlob === '4cbcac591ff5bc8d7cf2dcbf971cf2465f0cb133'
    && JSON.stringify(hero60Evidence.selection?.heroIds) === '[60]'
    && JSON.stringify(hero60Evidence.selection?.connectionIds) === '[600,601,602,603,604,605]'
    && JSON.stringify(hero60Evidence.selection?.jobIds) === '[601,213,602,1103,214,604]'
    && hero60Evidence.claimClasses?.heroFieldToConnectionId === 'B'
    && hero60Evidence.claimClasses?.connectionJobIdToJobInfoId === 'B'
    && hero60Evidence.claimClasses?.selectedRecordsExist === 'A'
    && hero60Evidence.claimClasses?.jobInfoNameValue === 'A'
    && hero60Evidence.directInspection?.rawRecordDirectlyInspected === true
    && hero60Evidence.directInspection?.inspectionCommit === hero60Evidence.source.commit
    && hero60Evidence.canonical === false && hero60Evidence.generated === false
    && hero60Evidence.productionRuntimeDependency === false, 'Hero 60 evidence pin/scope/class boundary drift');
  const hero60Source = hero60Evidence.inspectedSourceRows.heroInfo.find((row) => row.ID === 60);
  const hero60Connections = new Map(hero60Evidence.inspectedSourceRows.jobConnectionInfo.map((row) => [row.ID, row]));
  const hero60Jobs = new Map(hero60Evidence.inspectedSourceRows.jobInfo.map((row) => [row.ID, row]));
  check(hero60Source?.Name === '西格玛' && hero60Source?.Name_Eng === 'Sigma' && hero60Source?.Useable === true
    && hero60Source?.JobConnection_ID === 600 && isDeepStrictEqual(hero60Source?.UseableJobConnections_ID, [601,602,603,604,605]),
  'Hero 60 exact HeroInfo source refs drift');
  const hero60Refs = new Set();
  for (const [field, ids] of [['JobConnection_ID',[hero60Source.JobConnection_ID]],['UseableJobConnections_ID',hero60Source.UseableJobConnections_ID]]) {
    for (const connectionId of ids) {
      const connection = hero60Connections.get(connectionId);
      const job = connection && hero60Jobs.get(connection.Job_ID);
      const evidence = hero60Evidence.records.find((row) => row.heroId === 60 && row.connectionId === connectionId);
      check(connection && job && evidence?.sourceField === field && evidence.jobId === connection.Job_ID
        && evidence.sourceHeroInfoLocator === `data/configdata/ConfigDataHeroInfo.json#[ID=60].${field}`
        && evidence.jobConnectionInfoLocator === `data/configdata/ConfigDataJobConnectionInfo.json#[ID=${connectionId}]`
        && evidence.jobInfoLocator === `data/configdata/ConfigDataJobInfo.json#[ID=${connection.Job_ID}]`, `Hero 60 explicit Job join evidence mismatch at ${connectionId}`);
      hero60Refs.add(`${connectionId}:${connection.Job_ID}`);
    }
  }
  check(hero60Refs.size === 6 && hero60Refs.size === hero60Evidence.records.length
    && hero60Jobs.get(213)?.Name === '剑斗士' && hero60Jobs.get(214)?.Name === '剑斗统帅', 'Hero 60 evidence must contain six exact joins and pinned Job names');
  check(hero4Evidence.source?.repository === 'LuceatLuxVestra42/langrisser-future-guide'
    && hero4Evidence.source?.commit === '6475e63ee23d18adf733756c26a14fa9e3ed662c'
    && hero4Evidence.sourceFiles?.['ConfigDataHeroInfo.json']?.gitBlob === '728daab3370f0c7779449663ea02e638677944d4'
    && hero4Evidence.sourceFiles?.['ConfigDataJobConnectionInfo.json']?.gitBlob === 'cdad8d6fda6edd30c92fbcda53e0f63af1903139'
    && hero4Evidence.sourceFiles?.['ConfigDataJobInfo.json']?.gitBlob === '4cbcac591ff5bc8d7cf2dcbf971cf2465f0cb133'
    && JSON.stringify(hero4Evidence.selection?.heroIds) === '[4]'
    && JSON.stringify(hero4Evidence.selection?.connectionIds) === '[40,41,42,43,44,45,46]'
    && JSON.stringify(hero4Evidence.selection?.jobIds) === '[899,802,803,805,806,810,808]'
    && hero4Evidence.claimClasses?.heroFieldToConnectionId === 'B'
    && hero4Evidence.claimClasses?.connectionJobIdToJobInfoId === 'B'
    && hero4Evidence.claimClasses?.selectedRecordsExist === 'A'
    && hero4Evidence.claimClasses?.jobInfoNameValue === 'A'
    && hero4Evidence.directInspection?.rawRecordDirectlyInspected === true
    && hero4Evidence.directInspection?.inspectionCommit === hero4Evidence.source.commit
    && hero4Evidence.canonical === false && hero4Evidence.generated === false
    && hero4Evidence.productionRuntimeDependency === false, 'Hero 4 source evidence pin/scope/class boundary drift');
  const hero4Source = hero4Evidence.inspectedSourceRows.heroInfo.find((row) => row.ID === 4);
  const hero4Connections = new Map(hero4Evidence.inspectedSourceRows.jobConnectionInfo.map((row) => [row.ID, row]));
  const hero4Jobs = new Map(hero4Evidence.inspectedSourceRows.jobInfo.map((row) => [row.ID, row]));
  check(hero4Source?.Name === '艾梅达' && hero4Source?.Name_Eng === 'Aimeeda' && hero4Source?.Useable === true
    && hero4Source?.JobConnection_ID === 40 && isDeepStrictEqual(hero4Source?.UseableJobConnections_ID, [41,42,43,44,45,46]),
  'Hero 4 exact HeroInfo source refs drift');
  const hero4Refs = new Set();
  for (const [field, ids] of [['JobConnection_ID',[hero4Source.JobConnection_ID]],['UseableJobConnections_ID',hero4Source.UseableJobConnections_ID]]) {
    for (const connectionId of ids) {
      const connection = hero4Connections.get(connectionId);
      const job = connection && hero4Jobs.get(connection.Job_ID);
      const evidence = hero4Evidence.records.find((row) => row.heroId === 4 && row.connectionId === connectionId);
      check(connection && job && evidence?.sourceField === field && evidence.jobId === connection.Job_ID
        && evidence.sourceHeroInfoLocator === `data/configdata/ConfigDataHeroInfo.json#[ID=4].${field}`
        && evidence.jobConnectionInfoLocator === `data/configdata/ConfigDataJobConnectionInfo.json#[ID=${connectionId}]`
        && evidence.jobInfoLocator === `data/configdata/ConfigDataJobInfo.json#[ID=${connection.Job_ID}]`, `Hero 4 explicit Job join evidence mismatch at ${connectionId}`);
      hero4Refs.add(`${connectionId}:${connection.Job_ID}`);
    }
  }
  check(hero4Refs.size === 7 && hero4Refs.size === hero4Evidence.records.length
    && isDeepStrictEqual(hero4Evidence.inspectedSourceRows.jobInfo.map((row) => row.ID), [899,802,803,805,806,810,808]),
  'Hero 4 evidence must contain exactly seven explicit joins and pinned Job IDs');
  check(batch3Evidence.source?.repository === 'LuceatLuxVestra42/langrisser-future-guide'
    && batch3Evidence.source?.commit === '6475e63ee23d18adf733756c26a14fa9e3ed662c'
    && JSON.stringify(batch3Evidence.selection?.heroIds) === '[27,67]'
    && batch3Evidence.claimClasses?.heroFieldToConnectionId === 'B'
    && batch3Evidence.claimClasses?.connectionJobIdToJobInfoId === 'B'
    && batch3Evidence.claimClasses?.selectedRecordsExist === 'A'
    && batch3Evidence.claimClasses?.jobInfoNameValue === 'A'
    && batch3Evidence.directInspection?.rawRecordDirectlyInspected === true
    && batch3Evidence.directInspection?.inspectionCommit === batch3Evidence.source.commit
    && batch3Evidence.canonical === false && batch3Evidence.generated === false
    && batch3Evidence.productionRuntimeDependency === false, 'batch 3 evidence pin/scope/class boundary drift');
  const batch3Heroes = new Map(batch3Evidence.inspectedSourceRows.heroInfo.map((row) => [row.ID, row]));
  const batch3Connections = new Map(batch3Evidence.inspectedSourceRows.jobConnectionInfo.map((row) => [row.ID, row]));
  const batch3Jobs = new Map(batch3Evidence.inspectedSourceRows.jobInfo.map((row) => [row.ID, row]));
  const batch3Refs = new Set();
  for (const heroId of [27,67]) {
    const hero = batch3Heroes.get(heroId);
    check(hero && Array.isArray(hero.UseableJobConnections_ID) && Number.isSafeInteger(hero.JobConnection_ID), 'batch 3 HeroInfo refs missing for ' + heroId);
    for (const [field, ids] of [['JobConnection_ID',[hero.JobConnection_ID]],['UseableJobConnections_ID',hero.UseableJobConnections_ID]]) for (const connectionId of ids) {
      const connection = batch3Connections.get(connectionId); const job = connection && batch3Jobs.get(connection.Job_ID);
      const ev = batch3Evidence.records.find((row) => row.heroId === heroId && row.connectionId === connectionId);
      check(connection && job && ev?.sourceField === field && ev.jobId === connection.Job_ID
        && ev.sourceHeroInfoLocator === `data/configdata/ConfigDataHeroInfo.json#[ID=${heroId}].${field}`
        && ev.jobConnectionInfoLocator === `data/configdata/ConfigDataJobConnectionInfo.json#[ID=${connectionId}]`
        && ev.jobInfoLocator === `data/configdata/ConfigDataJobInfo.json#[ID=${connection.Job_ID}]`, `batch 3 explicit join evidence mismatch ${heroId}:${connectionId}`);
      batch3Refs.add(`${heroId}:${connectionId}`);
    }
  }
  check(batch3Refs.size === 12 && batch3Refs.size === batch3Evidence.records.length, 'batch 3 evidence must contain twelve exact explicit connection joins');
  check(batch4Evidence.source?.repository === 'LuceatLuxVestra42/langrisser-future-guide'
    && batch4Evidence.source?.commit === '6475e63ee23d18adf733756c26a14fa9e3ed662c'
    && batch4Evidence.sourceFiles?.['ConfigDataHeroInfo.json']?.gitBlob === '728daab3370f0c7779449663ea02e638677944d4'
    && batch4Evidence.sourceFiles?.['ConfigDataJobConnectionInfo.json']?.gitBlob === 'cdad8d6fda6edd30c92fbcda53e0f63af1903139'
    && batch4Evidence.sourceFiles?.['ConfigDataJobInfo.json']?.gitBlob === '4cbcac591ff5bc8d7cf2dcbf971cf2465f0cb133'
    && JSON.stringify(batch4Evidence.selection?.heroIds) === '[14]'
    && JSON.stringify(batch4Evidence.selection?.connectionIds) === '[140,141,142,143,144,145]'
    && JSON.stringify(batch4Evidence.selection?.jobIds) === '[401,404,403,1103,405,1105]'
    && batch4Evidence.claimClasses?.heroFieldToConnectionId === 'B'
    && batch4Evidence.claimClasses?.connectionJobIdToJobInfoId === 'B'
    && batch4Evidence.claimClasses?.selectedRecordsExist === 'A'
    && batch4Evidence.claimClasses?.jobInfoNameValue === 'A'
    && batch4Evidence.directInspection?.rawRecordDirectlyInspected === true
    && batch4Evidence.directInspection?.inspectionCommit === batch4Evidence.source.commit
    && batch4Evidence.canonical === false && batch4Evidence.generated === false
    && batch4Evidence.productionRuntimeDependency === false, 'Hero 14 source packet pin/scope/class drift');
  const batch4Hero = batch4Evidence.inspectedSourceRows.heroInfo.find((row) => row.ID === 14);
  const batch4Connections = new Map(batch4Evidence.inspectedSourceRows.jobConnectionInfo.map((row) => [row.ID, row]));
  const batch4Jobs = new Map(batch4Evidence.inspectedSourceRows.jobInfo.map((row) => [row.ID, row]));
  check(batch4Hero?.Name === '雪莉' && batch4Hero?.Name_Eng === 'Sherry' && batch4Hero?.Useable === true
    && batch4Hero?.JobConnection_ID === 140 && isDeepStrictEqual(batch4Hero?.UseableJobConnections_ID, [141,142,143,144,145]),
  'Hero 14 exact HeroInfo source refs drift');
  const batch4Refs = new Set();
  for (const [field, ids] of [['JobConnection_ID',[batch4Hero.JobConnection_ID]],['UseableJobConnections_ID',batch4Hero.UseableJobConnections_ID]]) {
    for (const connectionId of ids) {
      const connection = batch4Connections.get(connectionId); const job = connection && batch4Jobs.get(connection.Job_ID);
      const ev = batch4Evidence.records.find((row) => row.heroId === 14 && row.connectionId === connectionId);
      check(connection && job && ev?.sourceField === field && ev.jobId === connection.Job_ID
        && ev.sourceHeroInfoLocator === 'data/configdata/ConfigDataHeroInfo.json#[ID=14].' + field
        && ev.jobConnectionInfoLocator === `data/configdata/ConfigDataJobConnectionInfo.json#[ID=${connectionId}]`
        && ev.jobInfoLocator === `data/configdata/ConfigDataJobInfo.json#[ID=${connection.Job_ID}]`, `Hero 14 explicit Job join evidence mismatch at ${connectionId}`);
      batch4Refs.add(`${connectionId}:${connection.Job_ID}`);
    }
  }
  check(batch4Refs.size === 6 && batch4Refs.size === batch4Evidence.records.length, 'Hero 14 evidence must contain exactly six explicit connection joins');
  check(batch2Evidence.source?.repository === 'LuceatLuxVestra42/langrisser-future-guide'
    && batch2Evidence.source?.commit === '6475e63ee23d18adf733756c26a14fa9e3ed662c'
    && JSON.stringify(batch2Evidence.selection?.heroIds) === '[12,55]'
    && batch2Evidence.claimClasses?.heroFieldToConnectionId === 'B'
    && batch2Evidence.claimClasses?.connectionJobIdToJobInfoId === 'B'
    && batch2Evidence.claimClasses?.selectedRecordsExist === 'A'
    && batch2Evidence.canonical === false && batch2Evidence.generated === false
    && batch2Evidence.productionRuntimeDependency === false, 'batch 2 evidence source/scope/class boundary drift');
  const batch2Heroes = new Map(batch2Evidence.inspectedSourceRows.heroInfo.map((row) => [row.ID, row]));
  const batch2Connections = new Map(batch2Evidence.inspectedSourceRows.jobConnectionInfo.map((row) => [row.ID, row]));
  const batch2Jobs = new Map(batch2Evidence.inspectedSourceRows.jobInfo.map((row) => [row.ID, row]));
  const batch2Refs = new Set();
  for (const heroId of [12,55]) {
    const hero = batch2Heroes.get(heroId);
    check(hero && Array.isArray(hero.UseableJobConnections_ID) && Number.isSafeInteger(hero.JobConnection_ID), 'batch 2 HeroInfo refs missing for ' + heroId);
    for (const [field, ids] of [['JobConnection_ID',[hero.JobConnection_ID]],['UseableJobConnections_ID',hero.UseableJobConnections_ID]]) {
      for (const connectionId of ids) {
        const connection = batch2Connections.get(connectionId);
        const job = connection && batch2Jobs.get(connection.Job_ID);
        const evidence = batch2Evidence.records.find((row) => row.heroId === heroId && row.connectionId === connectionId);
        check(connection && job && evidence?.sourceField === field && evidence.jobId === connection.Job_ID
          && evidence.sourceHeroInfoLocator === `data/configdata/ConfigDataHeroInfo.json#[ID=${heroId}].${field}`
          && evidence.jobConnectionInfoLocator === `data/configdata/ConfigDataJobConnectionInfo.json#[ID=${connectionId}]`
          && evidence.jobInfoLocator === `data/configdata/ConfigDataJobInfo.json#[ID=${connection.Job_ID}]`, `batch 2 explicit join evidence mismatch for ${heroId}:${connectionId}`);
        batch2Refs.add(`${heroId}:${connectionId}`);
      }
    }
  }
  check(batch2Refs.size === batch2Evidence.records.length, 'batch 2 relation packet contains missing or extra rows');
  check(hero13Evidence.source?.repository === 'LuceatLuxVestra42/langrisser-future-guide'
    && hero13Evidence.source?.commit === '6475e63ee23d18adf733756c26a14fa9e3ed662c'
    && hero13Evidence.sourceFiles?.['ConfigDataHeroInfo.json']?.gitBlob === '728daab3370f0c7779449663ea02e638677944d4'
    && hero13Evidence.sourceFiles?.['ConfigDataJobConnectionInfo.json']?.gitBlob === 'cdad8d6fda6edd30c92fbcda53e0f63af1903139'
    && hero13Evidence.sourceFiles?.['ConfigDataJobInfo.json']?.gitBlob === '4cbcac591ff5bc8d7cf2dcbf971cf2465f0cb133'
    && JSON.stringify(hero13Evidence.selection?.heroIds) === '[13]'
    && JSON.stringify(hero13Evidence.selection?.connectionIds) === '[130,131,132,133,134,135]'
    && JSON.stringify(hero13Evidence.selection?.jobIds) === '[701,805,702,803,704,810]'
    && hero13Evidence.claimClasses?.heroFieldToConnectionId === 'B'
    && hero13Evidence.claimClasses?.connectionJobIdToJobInfoId === 'B'
    && hero13Evidence.claimClasses?.selectedRecordsExist === 'A'
    && hero13Evidence.claimClasses?.jobInfoNameValue === 'A'
    && hero13Evidence.directInspection?.rawRecordDirectlyInspected === true
    && hero13Evidence.directInspection?.inspectionCommit === hero13Evidence.source.commit
    && hero13Evidence.canonical === false && hero13Evidence.generated === false
    && hero13Evidence.productionRuntimeDependency === false, 'Hero 13 source packet pin/scope/class drift');
  const hero13Source = hero13Evidence.inspectedSourceRows.heroInfo.find((row) => row.ID === 13);
  const hero13Connections = new Map(hero13Evidence.inspectedSourceRows.jobConnectionInfo.map((row) => [row.ID, row]));
  const hero13Jobs = new Map(hero13Evidence.inspectedSourceRows.jobInfo.map((row) => [row.ID, row]));
  check(hero13Source?.JobConnection_ID === 130 && JSON.stringify(hero13Source.UseableJobConnections_ID) === '[131,132,133,134,135]', 'Hero 13 explicit HeroInfo source references drift');
  for (const row of hero13Evidence.records) {
    const connection = hero13Connections.get(row.connectionId);
    check(row.heroId === 13 && connection?.Job_ID === row.jobId && hero13Jobs.has(row.jobId)
      && row.sourceHeroInfoLocator === `data/configdata/ConfigDataHeroInfo.json#[ID=13].${row.sourceField}`
      && row.jobConnectionInfoLocator === `data/configdata/ConfigDataJobConnectionInfo.json#[ID=${row.connectionId}]`
      && row.jobInfoLocator === `data/configdata/ConfigDataJobInfo.json#[ID=${row.jobId}]`, `Hero 13 exact source join locator drift at ${row.connectionId}`);
  }
  check(hero13Evidence.records.length === 6, 'Hero 13 source packet must contain six explicit connections');
  const presentationJobs = await readJson('evidence/source/configdata/ConfigDataJobInfo.records-presentation-1-3-10-25.v1.json');

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

  exactKeys(expansionEvidence, ['version', 'purpose', 'sourceScope', 'source', 'sourceFiles', 'selection', 'preservedSubsets', 'claims', 'records', 'limitations', 'canonical', 'generated', 'productionRuntimeDependency'], 'Hero→Job expansion evidence');
  check(expansionEvidence.version === 1 && expansionEvidence.sourceScope === 'CN ConfigData snapshot 2026-09-02' && expansionEvidence.canonical === false && expansionEvidence.generated === false && expansionEvidence.productionRuntimeDependency === false, 'Hero→Job expansion evidence metadata drift');
  check(expansionEvidence.source?.repository === 'LuceatLuxVestra42/langrisser-future-guide' && expansionEvidence.source?.commit === '6475e63ee23d18adf733756c26a14fa9e3ed662c', 'Hero→Job expansion source pin drift');
  check(expansionEvidence.sourceFiles?.['ConfigDataHeroInfo.json']?.gitBlob === '728daab3370f0c7779449663ea02e638677944d4'
    && expansionEvidence.sourceFiles?.['ConfigDataJobConnectionInfo.json']?.gitBlob === 'cdad8d6fda6edd30c92fbcda53e0f63af1903139'
    && expansionEvidence.sourceFiles?.['ConfigDataJobInfo.json']?.gitBlob === '4cbcac591ff5bc8d7cf2dcbf971cf2465f0cb133', 'Hero→Job expansion source blob pin drift');
  check(JSON.stringify(expansionEvidence.selection?.heroIds) === '[28,32,52,53]', 'Hero→Job expansion target Hero scope drift');
  check(expansionEvidence.claims?.heroFieldToConnectionId?.class === 'B' && expansionEvidence.claims?.connectionJobIdToJobInfoId?.class === 'B' && expansionEvidence.claims?.selectedRecordsExist?.class === 'A', 'Hero→Job expansion evidence classes drift');

  const targetExpansionHeroIds = [28, 32, 52, 53];
  const expansionHeroById = new Map();
  for (const row of expansionHeroes) {
    check(row && typeof row === 'object' && !Array.isArray(row) && Number.isSafeInteger(row.ID), 'malformed expansion HeroInfo row');
    check(!expansionHeroById.has(row.ID), 'duplicate expansion HeroInfo ID ' + row.ID);
    expansionHeroById.set(row.ID, row);
  }
  check(JSON.stringify([...expansionHeroById.keys()].sort((a, b) => a - b)) === JSON.stringify(targetExpansionHeroIds), 'expansion HeroInfo ID set differs from target scope');
  const expectedExpansionRows = [];
  for (const heroId of targetExpansionHeroIds) {
    const row = expansionHeroById.get(heroId);
    check(Number.isSafeInteger(row.JobConnection_ID) && Array.isArray(row.UseableJobConnections_ID) && row.UseableJobConnections_ID.every(Number.isSafeInteger), 'malformed explicit connection refs for expansion Hero ' + heroId);
    expectedExpansionRows.push({ heroId, sourceField: 'JobConnection_ID', connectionId: row.JobConnection_ID });
    for (const connectionId of row.UseableJobConnections_ID) expectedExpansionRows.push({ heroId, sourceField: 'UseableJobConnections_ID', connectionId });
  }
  const expectedConnectionIds = new Set(expectedExpansionRows.map((row) => row.connectionId));
  const expansionConnectionById = new Map();
  for (const row of expansionConnections) {
    check(row && typeof row === 'object' && !Array.isArray(row) && Number.isSafeInteger(row.ID) && Number.isSafeInteger(row.Job_ID), 'malformed expansion JobConnectionInfo row');
    check(!expansionConnectionById.has(row.ID), 'duplicate expansion JobConnectionInfo ID ' + row.ID);
    expansionConnectionById.set(row.ID, row);
  }
  const sortedSet = (values) => [...new Set(values)].sort((a, b) => a - b);
  check(JSON.stringify(sortedSet(expansionConnectionById.keys())) === JSON.stringify(sortedSet(expectedConnectionIds)), 'expansion connection ID set differs from HeroInfo refs');
  const expectedJobIds = new Set([...expansionConnectionById.values()].map((row) => row.Job_ID));
  const expansionJobById = new Map();
  for (const row of expansionJobs) {
    check(row && typeof row === 'object' && !Array.isArray(row) && Number.isSafeInteger(row.ID), 'malformed expansion JobInfo row');
    check(!expansionJobById.has(row.ID), 'duplicate expansion JobInfo ID ' + row.ID);
    expansionJobById.set(row.ID, row);
  }
  check(JSON.stringify(sortedSet(expansionJobById.keys())) === JSON.stringify(sortedSet(expectedJobIds)), 'expansion JobInfo ID set differs from JobConnectionInfo targets');

  const expansionEvidenceByRef = new Map();
  for (const row of expansionEvidence.records) {
    exactKeys(row, ['heroId', 'sourceHeroInfoLocator', 'sourceField', 'connectionId', 'jobConnectionInfoLocator', 'jobId', 'jobInfoLocator'], `Hero→Job expansion evidence ${row.heroId}:${row.connectionId}`);
    const key = `${row.heroId}:${row.connectionId}`;
    check(!expansionEvidenceByRef.has(key), 'duplicate expansion evidence connection ' + key);
    const hero = expansionHeroById.get(row.heroId);
    check(hero, 'expansion evidence Hero absent from preserved HeroInfo: ' + row.heroId);
    const expectedField = hero.JobConnection_ID === row.connectionId ? 'JobConnection_ID' : hero.UseableJobConnections_ID.includes(row.connectionId) ? 'UseableJobConnections_ID' : null;
    check(expectedField === row.sourceField, 'expansion source field mismatch for ' + key);
    const connection = expansionConnectionById.get(row.connectionId);
    check(connection && connection.Job_ID === row.jobId, 'expansion JobConnectionInfo target mismatch for ' + key);
    check(expansionJobById.has(row.jobId), 'expansion JobInfo endpoint missing for ' + key);
    check(row.sourceHeroInfoLocator === expansionHeroPath + '#ID=' + row.heroId
      && row.jobConnectionInfoLocator === expansionConnectionPath + '#ID=' + row.connectionId
      && row.jobInfoLocator === expansionJobPath + '#ID=' + row.jobId, 'expansion source locator mismatch for ' + key);
    expansionEvidenceByRef.set(key, row);
  }
  check(expansionEvidence.records.length === expectedExpansionRows.length && expansionEvidenceByRef.size === expectedExpansionRows.length, 'Hero→Job expansion evidence row count differs from explicit HeroInfo refs');
  for (const row of expectedExpansionRows) {
    const key = `${row.heroId}:${row.connectionId}`;
    const evidenceRow = expansionEvidenceByRef.get(key);
    check(evidenceRow && evidenceRow.sourceField === row.sourceField && evidenceRow.jobId === expansionConnectionById.get(row.connectionId).Job_ID, 'explicit expansion relation missing for ' + key);
  }

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
  for (const row of expansionEvidence.records) {
    addExpectedRelation(row.heroId, row.jobId,
      `evidence/source/jobs/hero-job-connection-expansion.v1.json#heroId=${row.heroId}&connectionId=${row.connectionId}`, 'Hero 28/32/52/53 connection evidence');
  }
  for (const row of presentationEvidence.records) {
    addExpectedRelation(row.heroId, row.jobId, `${presentationEvidencePath}#heroId=${row.heroId}&connectionId=${row.connectionId}`, 'Hero 1/3/10/25 direct selected relation evidence');
  }
  for (const row of batch2Evidence.records) {
    addExpectedRelation(row.heroId, row.jobId, `${batch2EvidencePath}#heroId=${row.heroId}&connectionId=${row.connectionId}`, 'Hero 12/55 direct selected relation evidence');
  }
  for (const row of hero13Evidence.records) {
    addExpectedRelation(row.heroId, row.jobId, `${hero13EvidencePath}#heroId=${row.heroId}&connectionId=${row.connectionId}`, 'Hero 13 direct selected relation evidence');
  }
  for (const row of batch3Evidence.records) addExpectedRelation(row.heroId, row.jobId,
    `${batch3EvidencePath}#heroId=${row.heroId}&connectionId=${row.connectionId}`, 'Hero 27/67 directly inspected relation evidence');
  for (const row of batch4Evidence.records) addExpectedRelation(row.heroId, row.jobId,
    `${batch4EvidencePath}#heroId=${row.heroId}&connectionId=${row.connectionId}`, 'Hero 14 directly inspected relation evidence');
  for (const row of hero11Evidence.records) addExpectedRelation(row.heroId, row.jobId,
    `${hero11EvidencePath}#heroId=${row.heroId}&connectionId=${row.connectionId}`, 'Hero 11 directly inspected relation evidence');
  for (const row of hero7Evidence.records) addExpectedRelation(row.heroId, row.jobId,
    `${hero7EvidencePath}#heroId=${row.heroId}&connectionId=${row.connectionId}`, 'Hero 7 directly inspected relation evidence');
  for (const row of hero26Evidence.records) addExpectedRelation(row.heroId, row.jobId,
    `${hero26EvidencePath}#heroId=${row.heroId}&connectionId=${row.connectionId}`, 'Hero 26 directly inspected relation evidence');
  for (const row of hero60Evidence.records) addExpectedRelation(row.heroId, row.jobId,
    `${hero60EvidencePath}#heroId=${row.heroId}&connectionId=${row.connectionId}`, 'Hero 60 directly inspected relation evidence');
  for (const row of hero4Evidence.records) addExpectedRelation(row.heroId, row.jobId,
    `${hero4EvidencePath}#heroId=${row.heroId}&connectionId=${row.connectionId}`, 'Hero 4 directly inspected relation evidence');
  for (const row of spEvidence.records) {
    addExpectedRelation(row.heroId, row.spJobId,
      `evidence/source/jobs/hero-sp-job-relation.v1.json#heroId=${row.heroId}`, 'SP relation evidence');
  }
  check(classicEvidence.records.length === 18 && spEvidence.records.length === 25, 'existing selected/SP relation evidence scope drift');
  check(expectedRelations.size === classicEvidence.records.length + expansionEvidence.records.length + presentationEvidence.records.length + batch2Evidence.records.length + hero13Evidence.records.length + batch3Evidence.records.length + batch4Evidence.records.length + hero11Evidence.records.length + hero7Evidence.records.length + hero26Evidence.records.length + hero60Evidence.records.length + hero4Evidence.records.length + spEvidence.records.length, 'current evidence-backed relation scope has duplicate or missing pairs');

  const assertUniqueJobSubset = (rows, label) => {
    const ids = rows.map((row) => row.ID);
    check(new Set(ids).size === ids.length, label + ' contains duplicate JobInfo IDs');
  };
  assertUniqueJobSubset(classicJobs, 'selected JobInfo evidence');
  assertUniqueJobSubset(expansionJobs, 'expansion JobInfo evidence');
  assertUniqueJobSubset(spJobs, 'SP JobInfo evidence');
  const jobIds = new Set([...classicJobs, ...expansionJobs, ...spJobs, ...presentationJobs, ...batch2Evidence.inspectedSourceRows.jobInfo, ...hero13Evidence.inspectedSourceRows.jobInfo, ...batch3Evidence.inspectedSourceRows.jobInfo, ...batch4Evidence.inspectedSourceRows.jobInfo, ...hero11Evidence.inspectedSourceRows.jobInfo, ...hero7Evidence.inspectedSourceRows.jobInfo, ...hero26Evidence.inspectedSourceRows.jobInfo, ...hero60Evidence.inspectedSourceRows.jobInfo, ...hero4Evidence.inspectedSourceRows.jobInfo].map((row) => row.ID));
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
  check(relationByPair.get('53:426')?.provenance === 'evidence/source/jobs/hero-sp-job-relation.v1.json#heroId=53', 'Hero 53 SP-backed relation provenance drift');
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
  // Preserve the existing 5/6/8 presentation records; the new Hero 53 SP relation is explicitly admitted with this expansion.
  const expansionPresentationIds = new Set([28, 32, 52, 53]);
  const selectedOwnerPairs = [
    ...classicEvidence.records.filter((row) => selectedIds.has(row.heroId)).map((row) => `${row.heroId}:${row.jobId}`),
    ...expansionEvidence.records.filter((row) => expansionPresentationIds.has(row.heroId)).map((row) => `${row.heroId}:${row.jobId}`),
    ...presentationEvidence.records.map((row) => `${row.heroId}:${row.jobId}`),
    ...batch2Evidence.records.map((row) => `${row.heroId}:${row.jobId}`),
    ...hero13Evidence.records.map((row) => `${row.heroId}:${row.jobId}`),
    ...batch3Evidence.records.map((row) => `${row.heroId}:${row.jobId}`),
    ...batch4Evidence.records.map((row) => `${row.heroId}:${row.jobId}`),
    ...hero11Evidence.records.map((row) => `${row.heroId}:${row.jobId}`),
    ...hero7Evidence.records.map((row) => `${row.heroId}:${row.jobId}`),
    ...hero26Evidence.records.map((row) => `${row.heroId}:${row.jobId}`),
    ...hero60Evidence.records.map((row) => `${row.heroId}:${row.jobId}`),
    ...hero4Evidence.records.map((row) => `${row.heroId}:${row.jobId}`),
    ...spEvidence.records.filter((row) => row.heroId === 53).map((row) => `${row.heroId}:${row.spJobId}`),
  ];
  check(selectedPairs.size === 140 && selectedOwnerPairs.length === 140, 'selected presentation relation parity must cover 140 exact admitted relation records');
  for (const row of classicEvidence.records) if (selectedIds.has(row.heroId)) check(selectedPairs.has(`${row.heroId}:${row.jobId}`), `selected relation ${row.heroId}:${row.jobId} is missing from the slice`);
  for (const row of expansionEvidence.records) if (expansionPresentationIds.has(row.heroId)) check(selectedPairs.has(`${row.heroId}:${row.jobId}`), `selected expansion relation ${row.heroId}:${row.jobId} is missing from the slice`);
  for (const row of presentationEvidence.records) check(selectedPairs.has(`${row.heroId}:${row.jobId}`), `selected admission relation ${row.heroId}:${row.jobId} is missing from the slice`);
  for (const row of batch2Evidence.records) check(selectedPairs.has(`${row.heroId}:${row.jobId}`), `selected batch 2 relation ${row.heroId}:${row.jobId} is missing from the slice`);
  for (const row of hero13Evidence.records) check(selectedPairs.has(`${row.heroId}:${row.jobId}`), `selected Hero 13 relation ${row.heroId}:${row.jobId} is missing from the slice`);
  for (const row of batch3Evidence.records) check(selectedPairs.has(`${row.heroId}:${row.jobId}`), `selected batch 3 relation ${row.heroId}:${row.jobId} is missing from the slice`);
  for (const row of batch4Evidence.records) check(selectedPairs.has(`${row.heroId}:${row.jobId}`), `selected batch 4 relation ${row.heroId}:${row.jobId} is missing from the slice`);
  for (const row of hero11Evidence.records) check(selectedPairs.has(`${row.heroId}:${row.jobId}`), `selected Hero 11 relation ${row.heroId}:${row.jobId} is missing from the slice`);
  for (const row of hero7Evidence.records) check(selectedPairs.has(`${row.heroId}:${row.jobId}`), `selected Hero 7 relation ${row.heroId}:${row.jobId} is missing from the slice`);
  for (const row of hero26Evidence.records) check(selectedPairs.has(`${row.heroId}:${row.jobId}`), `selected Hero 26 relation ${row.heroId}:${row.jobId} is missing from the slice`);
  for (const row of hero60Evidence.records) check(selectedPairs.has(`${row.heroId}:${row.jobId}`), `selected Hero 60 relation ${row.heroId}:${row.jobId} is missing from the slice`);
  for (const row of hero4Evidence.records) check(selectedPairs.has(`${row.heroId}:${row.jobId}`), `selected Hero 4 relation ${row.heroId}:${row.jobId} is missing from the slice`);
  for (const row of spEvidence.records) if (row.heroId === 53) check(selectedPairs.has(`${row.heroId}:${row.spJobId}`), `selected SP relation ${row.heroId}:${row.spJobId} is missing from the slice`);

  return { identities: identityById.size, relations: relationByPair.size, selectedHeroes: selectedIds.size, selectedRelations: selectedPairs.size };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const result = await validateHeroSemanticCanonicals();
  process.stdout.write(`Hero semantic canonicals: PASS (${result.identities} playable identities; ${result.relations} relations; ${result.selectedRelations} selected-slice parity pairs; localization/release independent)\n`);
}
