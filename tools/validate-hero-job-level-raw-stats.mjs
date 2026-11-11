import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PIN = {
  repository: 'LuceatLuxVestra42/langrisser-future-guide',
  commit: '6475e63ee23d18adf733756c26a14fa9e3ed662c',
  sourcePath: 'data/configdata/ConfigDataJobLevelInfo.json',
  sourceGitBlobSha1: 'e9c978f78a96372db6e7b142512b69a8d0ab3182',
  sourceSha256: '0f02531a2b4244683b6a56f7d7b8ce607bf454f324a45312f20569983d2ed948',
  sourceBytes: 4177994,
  sourceTopLevelRecordCount: 7459,
};
const EVIDENCE_PATH = 'evidence/source/configdata/ConfigDataJobLevelInfo.records-hero-6-8-raw-stats.v1.json';
const MANIFEST_PATH = 'evidence/source/configdata/ConfigDataJobLevelInfo.records-hero-6-8-raw-stats.source-manifest.v1.json';
const CANONICAL_PATH = 'canonical/hero-job-level-raw-stats.v1.json';
const CONNECTION_PATH = 'evidence/source/configdata/ConfigDataJobConnectionInfo.records-hero-5-6-8.json';
const JOB_PATH = 'evidence/source/configdata/ConfigDataJobInfo.records-hero-5-6-8.json';
const HERO_15_CONNECTION_PATH = 'evidence/source/configdata/ConfigDataJobConnectionInfo.records-hero-15-job-level-raw-stats.v1.json';
const HERO_15_JOB_PATH = 'evidence/source/configdata/ConfigDataJobInfo.records-hero-15-job-level-raw-stats.v1.json';
const HERO_15_EVIDENCE_PATH = 'evidence/source/configdata/ConfigDataJobLevelInfo.records-hero-15-raw-stats.v1.json';
const HERO_15_MANIFEST_PATH = 'evidence/source/configdata/ConfigDataJobLevelInfo.records-hero-15-raw-stats.source-manifest.v1.json';
const STAT_FIELDS = ['HP_INI', 'HP_UP', 'AT_INI', 'AT_UP', 'Magic_INI', 'Magic_UP', 'DF_INI', 'DF_UP', 'MagicDF_INI', 'MagicDF_UP', 'DEX_INI'];
const EVIDENCE_FIELDS = ['ID', 'JobLevelUpHeroLevel', 'rank_code', ...STAT_FIELDS];
const STAT_KEY_SET = [...STAT_FIELDS];
const CONNECTIONS = [
  { heroId: 6, connectionId: 60, jobId: 301 }, { heroId: 6, connectionId: 61, jobId: 303 },
  { heroId: 6, connectionId: 62, jobId: 302 }, { heroId: 6, connectionId: 63, jobId: 202 },
  { heroId: 6, connectionId: 64, jobId: 307 }, { heroId: 6, connectionId: 65, jobId: 306 },
  { heroId: 8, connectionId: 80, jobId: 701 }, { heroId: 8, connectionId: 81, jobId: 805 },
  { heroId: 8, connectionId: 82, jobId: 702 }, { heroId: 8, connectionId: 83, jobId: 703 },
  { heroId: 8, connectionId: 84, jobId: 810 }, { heroId: 8, connectionId: 85, jobId: 706 },
];
const SCOPE = 'Raw ConfigDataJobLevel stat fields for every JobLevel_ID explicitly referenced by the 12 normal JobConnections of Hero 6 and 8. Values remain Job/JobLevel source facts; no Hero-level, Star, Hero-rank modifier, formula, mastery, bond effect, derived stat, or final combat stat is asserted. The selected 50 records contain DEX_INI but no DEX_UP field; no Dexterity growth value is inferred.';
const fail = message => { throw new Error(`Hero JobLevel raw stats validation failed: ${message}`); };
const check = (condition, message) => { if (!condition) fail(message); };
const exactKeys = (value, keys, label) => check(value && typeof value === 'object' && !Array.isArray(value)
  && JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...keys].sort()), `${label} schema mismatch`);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const HERO_15_CONNECTIONS = [
  { heroId: 15, connectionId: 150, jobId: 802, jobRank: 2, jobLevelIds: [1501, 1502, 1503] },
  { heroId: 15, connectionId: 151, jobId: 803, jobRank: 3, jobLevelIds: [1511, 1512, 1513, 1514] },
  { heroId: 15, connectionId: 152, jobId: 806, jobRank: 3, jobLevelIds: [1521, 1522, 1523, 1524] },
  { heroId: 15, connectionId: 153, jobId: 703, jobRank: 3, jobLevelIds: [1531, 1532, 1533, 1534] },
  { heroId: 15, connectionId: 154, jobId: 811, jobRank: 4, jobLevelIds: [1541, 1542, 1543, 1544, 1545] },
  { heroId: 15, connectionId: 155, jobId: 707, jobRank: 4, jobLevelIds: [1551, 1552, 1553, 1554, 1555] },
];
const HERO_15_JOBLEVEL_IDS = HERO_15_CONNECTIONS.flatMap(row => row.jobLevelIds);
const HERO_15_SCOPE = 'Raw ConfigDataJobLevel stat fields for every JobLevels_ID explicitly referenced by the 18 normal JobConnections of Heroes 6, 8, and 15. Values remain Job/JobLevel source facts; no Hero-level, Star, Hero-rank modifier, formula, mastery, bond effect, derived stat, or final combat stat is asserted. Selected records contain DEX_INI but no DEX_UP field; no Dexterity growth value is inferred.';
const HERO_15_SOURCE_PINS = {
  connection: { path: 'data/configdata/ConfigDataJobConnectionInfo.json', blob: 'cdad8d6fda6edd30c92fbcda53e0f63af1903139', sha256: '990009e6d751920173a7ec5aea47a8c89954aa7dacb7ef13c9ab40bbc6b6bb3a', bytes: 11498868, count: 30066 },
  job: { path: 'data/configdata/ConfigDataJobInfo.json', blob: '4cbcac591ff5bc8d7cf2dcbf971cf2465f0cb133', sha256: '2e522fc464549cfe7ed1f5974e166b3952fa7398e07d0610ec2a90b950e094cf', bytes: 2424034, count: 3295 },
  level: { path: PIN.sourcePath, blob: PIN.sourceGitBlobSha1, sha256: PIN.sourceSha256, bytes: PIN.sourceBytes, count: PIN.sourceTopLevelRecordCount },
};
const HERO_15_EVIDENCE_HASHES = {
  connection: '484bf632baf8a4ec797362c2a9801a9dd24bb022cfd0792be3e187c5f7b85f4b',
  job: 'deaf7b19755497a344c6e01121c92b8f3b7fa95e7d1f9611920ced7b8b197da9',
  level: 'aeedc5712fbc6f1bced9477c0877846a59c740f070e4239d635e6e7f752ef823',
  manifest: '5ad3d8746dbae249763ac146c09a385e438e073ebff917d26ab2a2e8a286dbea',
};

export function validateHeroJobLevelRawStats({ heroIdentities, heroJobRelations, connections, jobs, manifest, evidence, canonical, evidenceSha256 }) {
  exactKeys(heroIdentities, ['schemaVersion', 'scope', 'records'], 'Hero identities');
  exactKeys(heroJobRelations, ['schemaVersion', 'scope', 'records'], 'Hero-Job Canonical');
  exactKeys(manifest, ['schemaVersion', 'purpose', 'source', 'artifact', 'claimScope', 'limitations'], 'Source manifest');
  exactKeys(manifest.source, ['repository', 'commit', 'sourcePath', 'sourceGitBlobSha1', 'sourceSha256', 'sourceBytes', 'sourceTopLevelRecordCount', 'sourceVersionStatus'], 'Manifest source');
  exactKeys(manifest.artifact, ['evidencePath', 'evidenceSha256', 'selectedHeroIds', 'selectedJobConnectionIds', 'selectedJobLevelIds', 'selectedRecordCount', 'selectedFields', 'extractionRule'], 'Manifest artifact');
  exactKeys(evidence, ['schemaVersion', 'scope', 'source', 'extraction', 'records'], 'Evidence');
  exactKeys(evidence.source, ['repository', 'commit', 'path'], 'Evidence source');
  exactKeys(evidence.extraction, ['selectedHeroIds', 'selectedJobConnectionIds', 'selectedJobLevelIds', 'selectedFields', 'observedAbsentSourceFields', 'rule'], 'Evidence extraction');
  exactKeys(canonical, ['schemaVersion', 'scope', 'records'], 'Canonical');
  check(heroIdentities.schemaVersion === 1 && Array.isArray(heroIdentities.records), 'Hero Identity Canonical malformed');
  check(heroJobRelations.schemaVersion === 1 && Array.isArray(heroJobRelations.records), 'Hero-Job Canonical malformed');
  check(manifest.schemaVersion === 1 && evidence.schemaVersion === 1 && canonical.schemaVersion === 1, 'schemaVersion mismatch');
  for (const key of Object.keys(PIN)) check(manifest.source[key] === PIN[key], `Source pin ${key} mismatch`);
  check(manifest.source.sourceVersionStatus === 'unknown', 'source version status must remain unknown');
  check(manifest.artifact.evidencePath === EVIDENCE_PATH && manifest.artifact.evidenceSha256 === evidenceSha256, 'Evidence path or digest mismatch');
  check(evidence.scope === SCOPE && manifest.claimScope === SCOPE && canonical.scope === SCOPE, 'claim scope mismatch');
  check(evidence.source.repository === PIN.repository && evidence.source.commit === PIN.commit && evidence.source.path === PIN.sourcePath, 'Evidence Source locator mismatch');
  check(evidenceSha256 === manifest.artifact.evidenceSha256, 'preserved Evidence digest mismatch');

  const expectedHeroIds = [6, 8];
  const expectedConnectionIds = CONNECTIONS.map(row => row.connectionId);
  check(same(manifest.artifact.selectedHeroIds, expectedHeroIds) && same(evidence.extraction.selectedHeroIds, expectedHeroIds), 'selected Hero ID scope mismatch');
  check(same(manifest.artifact.selectedJobConnectionIds, expectedConnectionIds) && same(evidence.extraction.selectedJobConnectionIds, expectedConnectionIds), 'selected JobConnection scope mismatch');
  check(same(manifest.artifact.selectedFields, EVIDENCE_FIELDS) && same(evidence.extraction.selectedFields, EVIDENCE_FIELDS), 'selected Source field set mismatch');
  check(same(evidence.extraction.observedAbsentSourceFields, ['DEX_UP']), 'DEX_UP absence observation mismatch');
  check(manifest.artifact.extractionRule === evidence.extraction.rule, 'extraction rule mismatch');
  check(same(evidence.extraction.selectedJobLevelIds, manifest.artifact.selectedJobLevelIds), 'selected JobLevel ID list mismatch');
  check(evidence.extraction.selectedJobLevelIds.length === new Set(evidence.extraction.selectedJobLevelIds).size, 'duplicate selected JobLevel ID');
  check(Array.isArray(evidence.records) && evidence.records.length === 50 && manifest.artifact.selectedRecordCount === 50, 'expected exactly 50 selected JobLevel records');

  const identityIds = new Set(heroIdentities.records.map(row => row.heroId));
  for (const heroId of expectedHeroIds) check(identityIds.has(heroId), `missing Hero Identity endpoint ${heroId}`);

  const connectionById = new Map();
  for (const row of connections) {
    check(Number.isInteger(row.ID) && !connectionById.has(row.ID), `duplicate/malformed JobConnection ${row?.ID}`);
    connectionById.set(row.ID, row);
  }
  const jobById = new Map();
  for (const row of jobs) {
    check(Number.isInteger(row.ID) && !jobById.has(row.ID), `duplicate/malformed JobInfo ${row?.ID}`);
    jobById.set(row.ID, row);
  }
  const canonicalRelationSet = new Set(heroJobRelations.records.map(row => `${row.heroId}:${row.jobId}`));
  const expectedLevelIds = [];
  const expectedPairs = new Set();
  for (const expected of CONNECTIONS) {
    const connection = connectionById.get(expected.connectionId);
    check(connection && connection.Job_ID === expected.jobId && Array.isArray(connection.JobLevels_ID), `JobConnection endpoint mismatch for ${expected.connectionId}`);
    const job = jobById.get(expected.jobId);
    check(job && Number.isInteger(job.Rank), `JobInfo Rank endpoint missing for ${expected.jobId}`);
    check(canonicalRelationSet.has(`${expected.heroId}:${expected.jobId}`), `Hero-Job Canonical endpoint missing for ${expected.heroId}/${expected.jobId}`);
    expectedPairs.add(`${expected.heroId}:${expected.jobId}`);
    expectedLevelIds.push(...connection.JobLevels_ID);
  }
  const actualNormalPairs = heroJobRelations.records.filter(row => [6, 8].includes(row.heroId)
    && CONNECTIONS.some(expected => expected.heroId === row.heroId && expected.jobId === row.jobId)).map(row => `${row.heroId}:${row.jobId}`);
  check(actualNormalPairs.length === expectedPairs.size && actualNormalPairs.every(pair => expectedPairs.has(pair)), 'Hero 6/8 normal Job relation set changed');
  check(expectedLevelIds.length === 50 && expectedLevelIds.length === new Set(expectedLevelIds).size, 'JobConnection level endpoint set malformed');
  check(same([...expectedLevelIds].sort((a, b) => a - b), [...manifest.artifact.selectedJobLevelIds].sort((a, b) => a - b)), 'selected JobLevel IDs differ from JobConnection endpoints');

  const evidenceById = new Map();
  for (const row of evidence.records) {
    exactKeys(row, EVIDENCE_FIELDS, `Source Evidence record ${row?.ID}`);
    check(Number.isSafeInteger(row.ID) && !evidenceById.has(row.ID), `malformed/duplicate Source Evidence ID ${row?.ID}`);
    for (const field of EVIDENCE_FIELDS.slice(1)) check(Number.isFinite(row[field]), `Source field ${field} is not numeric for ${row.ID}`);
    check(!Object.hasOwn(row, 'DEX_UP'), `unsupported DEX_UP value present for ${row.ID}`);
    evidenceById.set(row.ID, row);
  }
  check(same([...evidenceById.keys()].sort((a, b) => a - b), [...expectedLevelIds].sort((a, b) => a - b)), 'Source Evidence ID set differs from JobConnection endpoints');
  check(same(evidence.extraction.selectedJobLevelIds, [...evidenceById.keys()]), 'Evidence record order differs from the declared selected IDs');

  check(Array.isArray(canonical.records) && canonical.records.length === 50, 'Canonical record count mismatch');
  const canonicalByLevel = new Map();
  for (const row of canonical.records) {
    exactKeys(row, ['heroId', 'jobConnectionId', 'jobId', 'jobRank', 'jobLevelId', 'jobLevelUpHeroLevel', 'rankCode', 'rawStats', 'provenance'], `Canonical row ${row?.jobLevelId}`);
    exactKeys(row.provenance, ['jobLevel', 'jobConnection', 'job'], `Canonical provenance ${row?.jobLevelId}`);
    exactKeys(row.rawStats, STAT_KEY_SET, `Canonical raw stats ${row?.jobLevelId}`);
    check(Number.isInteger(row.jobLevelId) && !canonicalByLevel.has(row.jobLevelId), `malformed/duplicate Canonical JobLevel ID ${row?.jobLevelId}`);
    canonicalByLevel.set(row.jobLevelId, row);
  }
  check(same([...canonicalByLevel.keys()], expectedLevelIds), 'Canonical JobLevel IDs/order differ from selected JobConnection endpoints');

  const expectedRows = [];
  for (const expected of CONNECTIONS) {
    const connection = connectionById.get(expected.connectionId);
    const job = jobById.get(expected.jobId);
    for (const jobLevelId of connection.JobLevels_ID) {
      const source = evidenceById.get(jobLevelId);
      const rawStats = Object.fromEntries(STAT_FIELDS.map(field => [field, source[field]]));
      const expectedRow = {
        heroId: expected.heroId,
        jobConnectionId: expected.connectionId,
        jobId: expected.jobId,
        jobRank: job.Rank,
        jobLevelId,
        jobLevelUpHeroLevel: source.JobLevelUpHeroLevel,
        rankCode: source.rank_code,
        rawStats,
        provenance: {
          jobLevel: `${EVIDENCE_PATH}#ID=${jobLevelId}`,
          jobConnection: `${CONNECTION_PATH}#ID=${expected.connectionId}`,
          job: `${JOB_PATH}#ID=${expected.jobId}`,
        },
      };
      expectedRows.push(expectedRow);
      check(same(canonicalByLevel.get(jobLevelId), expectedRow), `Canonical row differs from exact Source/Endpoint facts for JobLevel ${jobLevelId}`);
    }
  }
  check(same(canonical.records.map(row => row.jobLevelId), expectedRows.map(row => row.jobLevelId)), 'Canonical ordering mismatch');
  return { heroIds: expectedHeroIds, connectionCount: CONNECTIONS.length, jobLevelCount: expectedRows.length, heroCounts: { 6: 25, 8: 25 }, statFields: STAT_FIELDS, derivedStatsAdmitted: false };
}

export function validateHero15JobLevelRawStats({ heroIdentities, heroJobRelations, canonical, sourceManifest, connectionEvidence, jobEvidence, levelEvidence, evidenceHashes }) {
  check(heroIdentities?.schemaVersion === 1 && Array.isArray(heroIdentities.records), 'Hero Identity Canonical malformed');
  check(heroJobRelations?.schemaVersion === 1 && Array.isArray(heroJobRelations.records), 'Hero-Job Canonical malformed');
  check(canonical?.schemaVersion === 1 && canonical.scope === HERO_15_SCOPE && Array.isArray(canonical.records), 'combined Canonical scope/schema mismatch');
  check(heroIdentities.records.some(row => row.heroId === 15), 'Hero Identity endpoint 15 missing');
  check(sourceManifest?.schemaVersion === 1 && sourceManifest.purpose === 'Claim-scoped fixed-source pins and extraction provenance for Hero 15 JobLevel raw stat admission.', 'Hero 15 Source manifest schema/purpose mismatch');
  check(sourceManifest.source && sourceManifest.artifacts && Array.isArray(sourceManifest.limitations), 'Hero 15 Source manifest malformed');
  const expectedSourceNames = ['connection', 'job', 'level'];
  check(same(Object.keys(sourceManifest.source).sort(), expectedSourceNames), 'Hero 15 Source manifest source set mismatch');
  for (const key of expectedSourceNames) {
    const source = sourceManifest.source[key];
    const pin = HERO_15_SOURCE_PINS[key];
    exactKeys(source, ['repository', 'commit', 'tree', 'path', 'gitBlobSha1', 'sourceSha256', 'sourceBytes', 'sourceTopLevelRecordCount', 'sourceVersionStatus'], `Hero 15 ${key} Source pin`);
    check(source.repository === PIN.repository && source.commit === PIN.commit && source.tree === '08e1e6c2773730e60b258940e31494f68d65f86a'
      && source.path === pin.path && source.gitBlobSha1 === pin.blob && source.sourceSha256 === pin.sha256
      && source.sourceBytes === pin.bytes && source.sourceTopLevelRecordCount === pin.count && source.sourceVersionStatus === 'unknown', `Hero 15 ${key} Source pin mismatch`);
  }
  const evidenceByName = { connection: connectionEvidence, job: jobEvidence, level: levelEvidence };
  const expectedPaths = { connection: HERO_15_CONNECTION_PATH, job: HERO_15_JOB_PATH, level: HERO_15_EVIDENCE_PATH };
  check(evidenceHashes.manifest === HERO_15_EVIDENCE_HASHES.manifest, 'Hero 15 manifest digest mismatch');
  for (const key of expectedSourceNames) {
    check(evidenceHashes[key] === HERO_15_EVIDENCE_HASHES[key], `Hero 15 ${key} Evidence digest mismatch`);
    const artifact = sourceManifest.artifacts[expectedPaths[key]];
    check(artifact && artifact.sha256 === evidenceHashes[key], `Hero 15 ${key} Evidence manifest digest mismatch`);
    check(artifact.recordCount === evidenceByName[key].records?.length, `Hero 15 ${key} Evidence record count mismatch`);
    const ids = key === 'connection' ? HERO_15_CONNECTIONS.map(row => row.connectionId)
      : key === 'job' ? HERO_15_CONNECTIONS.map(row => row.jobId).sort((a, b) => a - b) : HERO_15_JOBLEVEL_IDS;
    const fields = key === 'connection' ? ['ID', 'Job_ID', 'JobLevels_ID'] : key === 'job' ? ['ID', 'Rank'] : EVIDENCE_FIELDS;
    check(same(artifact.selectedRecordIds, ids) && same(artifact.selectedFields, fields), `Hero 15 ${key} manifest selection mismatch`);
    const ev = evidenceByName[key];
    check(ev.schemaVersion === 1 && ev.source?.repository === PIN.repository && ev.source.commit === PIN.commit
      && ev.source.tree === '08e1e6c2773730e60b258940e31494f68d65f86a' && ev.source.path === HERO_15_SOURCE_PINS[key].path
      && ev.source.gitBlobSha1 === HERO_15_SOURCE_PINS[key].blob, `Hero 15 ${key} Evidence Source locator mismatch`);
  }
  check(same(Object.keys(sourceManifest.artifacts).sort(), Object.values(expectedPaths).sort()), 'Hero 15 artifact path set mismatch');

  exactKeys(connectionEvidence, ['schemaVersion', 'scope', 'source', 'extraction', 'records'], 'Hero 15 JobConnection Evidence');
  check(connectionEvidence.scope === 'Source-native JobConnection ID, Job_ID, and explicit JobLevels_ID fields for Hero 15 connections 150–155; no Talent or presentation fields admitted.', 'Hero 15 JobConnection scope mismatch');
  check(same(connectionEvidence.extraction.selectedRecordIds, HERO_15_CONNECTIONS.map(row => row.connectionId))
    && same(connectionEvidence.extraction.selectedFields, ['ID', 'Job_ID', 'JobLevels_ID']), 'Hero 15 JobConnection locator/field set mismatch');
  const expectedConnections = HERO_15_CONNECTIONS.map(({ connectionId, jobId, jobLevelIds }) => ({ ID: connectionId, Job_ID: jobId, JobLevels_ID: jobLevelIds }));
  check(same(connectionEvidence.records, expectedConnections), 'Hero 15 JobConnection source records differ from fixed locators/endpoints');

  exactKeys(jobEvidence, ['schemaVersion', 'scope', 'source', 'extraction', 'records'], 'Hero 15 JobInfo Evidence');
  const sourceOrderJobIds = HERO_15_CONNECTIONS.map(row => row.jobId).sort((a, b) => a - b);
  check(same(jobEvidence.extraction.selectedRecordIds, sourceOrderJobIds)
    && same(jobEvidence.extraction.selectedFields, ['ID', 'Rank']), 'Hero 15 JobInfo locator/field set mismatch');
  const expectedJobs = [...HERO_15_CONNECTIONS].sort((a, b) => a.jobId - b.jobId).map(({ jobId, jobRank }) => ({ ID: jobId, Rank: jobRank }));
  check(same(jobEvidence.records, expectedJobs), 'Hero 15 JobInfo ID/Rank records mismatch');

  exactKeys(levelEvidence, ['schemaVersion', 'scope', 'source', 'extraction', 'records'], 'Hero 15 JobLevel Evidence');
  check(levelEvidence.scope === 'Raw JobLevel source fields explicitly referenced by Hero 15 JobConnections 150–155. No derived/final stats, DEX_UP, mastery, or growth formula is asserted.', 'Hero 15 JobLevel Evidence scope mismatch');
  check(same(levelEvidence.extraction.selectedHeroIds, [15])
    && same(levelEvidence.extraction.selectedJobConnectionIds, HERO_15_CONNECTIONS.map(row => row.connectionId))
    && same(levelEvidence.extraction.selectedJobLevelIds, HERO_15_JOBLEVEL_IDS)
    && same(levelEvidence.extraction.selectedFields, EVIDENCE_FIELDS)
    && same(levelEvidence.extraction.observedAbsentSourceFields, ['DEX_UP']), 'Hero 15 JobLevel Evidence locator/field set mismatch');
  check(levelEvidence.records.length === 25, 'Hero 15 must have exactly 25 endpoint-selected JobLevel source records');
  const levelById = new Map();
  for (const row of levelEvidence.records) {
    exactKeys(row, EVIDENCE_FIELDS, `Hero 15 JobLevel Evidence ${row?.ID}`);
    check(Number.isSafeInteger(row.ID) && !levelById.has(row.ID), `malformed/duplicate Hero 15 JobLevel Evidence ${row?.ID}`);
    for (const field of EVIDENCE_FIELDS.slice(1)) check(Number.isSafeInteger(row[field]), `Hero 15 raw source field ${field} malformed for ${row.ID}`);
    levelById.set(row.ID, row);
  }
  check(same([...levelById.keys()], HERO_15_JOBLEVEL_IDS), 'Hero 15 JobLevel Evidence order/IDs differ from explicit endpoints');

  const relationRows = heroJobRelations.records.filter(row => row.heroId === 15);
  const expectedRelationPairs = HERO_15_CONNECTIONS.map(row => `${row.heroId}:${row.jobId}`);
  check(relationRows.length === HERO_15_CONNECTIONS.length && same(relationRows.map(row => `${row.heroId}:${row.jobId}`).sort(), [...expectedRelationPairs].sort()), 'Hero 15 approved Hero-Job Relation endpoints mismatch');
  const expectedRows = [];
  for (const connection of HERO_15_CONNECTIONS) {
    const connectionRow = expectedConnections.find(row => row.ID === connection.connectionId);
    const job = expectedJobs.find(row => row.ID === connection.jobId);
    for (const jobLevelId of connection.jobLevelIds) {
      const source = levelById.get(jobLevelId);
      expectedRows.push({
        heroId: 15, jobConnectionId: connection.connectionId, jobId: connection.jobId, jobRank: job.Rank,
        jobLevelId, jobLevelUpHeroLevel: source.JobLevelUpHeroLevel, rankCode: source.rank_code,
        rawStats: Object.fromEntries(STAT_FIELDS.map(field => [field, source[field]])),
        provenance: {
          jobLevel: `${HERO_15_EVIDENCE_PATH}#ID=${jobLevelId}`,
          jobConnection: `${HERO_15_CONNECTION_PATH}#ID=${connection.connectionId}`,
          job: `${HERO_15_JOB_PATH}#ID=${job.ID}`,
        },
      });
    }
  }
  const rows15 = canonical.records.filter(row => row.heroId === 15);
  check(rows15.length === 25 && same(rows15, expectedRows), 'Hero 15 Canonical rows differ from pinned Evidence/endpoint facts');
  check(canonical.records.length === 75, 'combined Canonical must preserve 50 existing rows and add exactly 25 Hero 15 rows');
  check(new Set(canonical.records.map(row => row.jobLevelId)).size === canonical.records.length, 'combined Canonical has duplicate JobLevel IDs');
  check(!canonical.records.some(row => row.rawStats && Object.hasOwn(row.rawStats, 'DEX_UP')), 'unsupported DEX_UP field present');
  return { heroId: 15, connectionCount: 6, jobLevelCount: 25, jobLevelIds: HERO_15_JOBLEVEL_IDS, derivedStatsAdmitted: false, presentationExpanded: false };
}

export async function loadAndValidateHeroJobLevelRawStats(root = process.cwd()) {
  const bytes = async file => readFile(resolve(root, file));
  const json = async file => JSON.parse((await bytes(file)).toString('utf8'));
  const [heroIdentities, heroJobRelations, manifest, evidence, canonical, connections, jobs, evidenceBytes,
    hero15Manifest, hero15ConnectionEvidence, hero15JobEvidence, hero15LevelEvidence,
    hero15ManifestBytes, hero15ConnectionBytes, hero15JobBytes, hero15LevelBytes] = await Promise.all([
    json('canonical/hero-identities.v1.json'), json('canonical/hero-job-relations.v1.json'), json(MANIFEST_PATH),
    json(EVIDENCE_PATH), json(CANONICAL_PATH), json(CONNECTION_PATH), json(JOB_PATH), bytes(EVIDENCE_PATH),
    json(HERO_15_MANIFEST_PATH), json(HERO_15_CONNECTION_PATH), json(HERO_15_JOB_PATH), json(HERO_15_EVIDENCE_PATH),
    bytes(HERO_15_MANIFEST_PATH), bytes(HERO_15_CONNECTION_PATH), bytes(HERO_15_JOB_PATH), bytes(HERO_15_EVIDENCE_PATH),
  ]);
  const legacyCanonical = { ...canonical, scope: SCOPE, records: canonical.records.filter(row => [6, 8].includes(row.heroId)) };
  const legacyResult = validateHeroJobLevelRawStats({ heroIdentities, heroJobRelations, manifest, evidence, canonical: legacyCanonical, connections, jobs, evidenceSha256: sha256(evidenceBytes) });
  const hero15Result = validateHero15JobLevelRawStats({ heroIdentities, heroJobRelations, canonical, sourceManifest: hero15Manifest,
    connectionEvidence: hero15ConnectionEvidence, jobEvidence: hero15JobEvidence, levelEvidence: hero15LevelEvidence,
    evidenceHashes: { manifest: sha256(hero15ManifestBytes), connection: sha256(hero15ConnectionBytes), job: sha256(hero15JobBytes), level: sha256(hero15LevelBytes) } });
  return { ...legacyResult, heroIds: [6, 8, 15], totalJobLevelCount: canonical.records.length, heroCounts: { 6: 25, 8: 25, 15: 25 }, hero15: hero15Result };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const result = await loadAndValidateHeroJobLevelRawStats();
  process.stdout.write(`Hero JobLevel raw stats: PASS (${result.connectionCount + result.hero15.connectionCount} normal JobConnections, ${result.totalJobLevelCount} JobLevel records; public projection remains Heroes 6/8 only; no derived stats)\n`);
}
