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

export async function loadAndValidateHeroJobLevelRawStats(root = process.cwd()) {
  const bytes = async file => readFile(resolve(root, file));
  const json = async file => JSON.parse((await bytes(file)).toString('utf8'));
  const [heroIdentities, heroJobRelations, manifest, evidence, canonical, connections, jobs, evidenceBytes] = await Promise.all([
    json('canonical/hero-identities.v1.json'), json('canonical/hero-job-relations.v1.json'), json(MANIFEST_PATH),
    json(EVIDENCE_PATH), json(CANONICAL_PATH), json(CONNECTION_PATH), json(JOB_PATH), bytes(EVIDENCE_PATH),
  ]);
  return validateHeroJobLevelRawStats({ heroIdentities, heroJobRelations, manifest, evidence, canonical, connections, jobs, evidenceSha256: sha256(evidenceBytes) });
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const result = await loadAndValidateHeroJobLevelRawStats();
  process.stdout.write(`Hero JobLevel raw stats: PASS (${result.connectionCount} normal JobConnections, ${result.jobLevelCount} JobLevel records; no derived stats)\n`);
}
