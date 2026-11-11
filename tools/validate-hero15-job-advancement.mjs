import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const fail = (message) => { throw new Error(`Hero 15 Job advancement validation failed: ${message}`); };
const check = (value, message) => { if (!value) fail(message); };
const expectedConnections = [
  { id: 150, jobId: 802, index: 98, pre: null, rank: 2, unlock: '精通前置职业后可以转职', jobIndex: 490 },
  { id: 151, jobId: 803, index: 99, pre: [150], rank: 3, unlock: '精通前置职业后可以转职', jobIndex: 491 },
  { id: 152, jobId: 806, index: 100, pre: [150], rank: 3, unlock: '精通前置职业后可以转职', jobIndex: 494 },
  { id: 153, jobId: 703, index: 101, pre: [150], rank: 3, unlock: '精通前置职业后可以转职', jobIndex: 377 },
  { id: 154, jobId: 811, index: 102, pre: [152], rank: 4, unlock: '精通前置职业后可以转职', jobIndex: 499 },
  { id: 155, jobId: 707, index: 103, pre: [153], rank: 4, unlock: '精通前置职业后可以转职', jobIndex: 381 },
];
const expectedEdges = [
  [15,150,802,151,803,'data/configdata/ConfigDataJobConnectionInfo.json#ID=151/PreJobConnectionList'],
  [15,150,802,152,806,'data/configdata/ConfigDataJobConnectionInfo.json#ID=152/PreJobConnectionList'],
  [15,150,802,153,703,'data/configdata/ConfigDataJobConnectionInfo.json#ID=153/PreJobConnectionList'],
  [15,152,806,154,811,'data/configdata/ConfigDataJobConnectionInfo.json#ID=154/PreJobConnectionList'],
  [15,153,703,155,707,'data/configdata/ConfigDataJobConnectionInfo.json#ID=155/PreJobConnectionList'],
];
const sourcePin = {
  repository: 'LuceatLuxVestra42/langrisser-future-guide',
  commit: '6475e63ee23d18adf733756c26a14fa9e3ed662c',
  tree: '08e1e6c2773730e60b258940e31494f68d65f86a',
  connectionBlob: 'cdad8d6fda6edd30c92fbcda53e0f63af1903139',
  connectionSha256: '990009e6d751920173a7ec5aea47a8c89954aa7dacb7ef13c9ab40bbc6b6bb3a',
  jobBlob: '4cbcac591ff5bc8d7cf2dcbf971cf2465f0cb133',
  jobSha256: '2e522fc464549cfe7ed1f5974e166b3952fa7398e07d0610ec2a90b950e094cf',
};

export function validateHero15JobAdvancement({ evidence, canonical, heroJobRelations, jobLevelCanonical, integratedDecision, talentDecision } = {}) {
  check(evidence?.schemaVersion === 1 && evidence.canonical === false && evidence.generated === false && evidence.productionRuntimeDependency === false, 'evidence metadata');
  const src = evidence.source;
  check(src.repository === sourcePin.repository && src.commit === sourcePin.commit && src.tree === sourcePin.tree, 'Legacy Source commit/tree');
  check(src.jobConnectionInfo.gitBlobSha1 === sourcePin.connectionBlob && src.jobConnectionInfo.sha256 === sourcePin.connectionSha256 && src.jobConnectionInfo.path === 'data/configdata/ConfigDataJobConnectionInfo.json' && src.jobConnectionInfo.bytes === 11498868, 'JobConnectionInfo source pin');
  check(src.jobInfo.gitBlobSha1 === sourcePin.jobBlob && src.jobInfo.sha256 === sourcePin.jobSha256 && src.jobInfo.path === 'data/configdata/ConfigDataJobInfo.json' && src.jobInfo.bytes === 2424034, 'JobInfo source pin');
  check(src.heroInfo.gitBlobSha1 === '728daab3370f0c7779449663ea02e638677944d4' && src.heroInfo.hero15RecordIndex === 14 && src.heroInfo.fields.ID === 15 && src.heroInfo.fields.JobConnection_ID === 150 && JSON.stringify(src.heroInfo.fields.UseableJobConnections_ID) === JSON.stringify([151,152,153,154,155]), 'HeroInfo membership Source locator');
  const connections = evidence.records.jobConnections;
  const jobs = evidence.records.jobs;
  check(Array.isArray(connections) && connections.length === 6 && Array.isArray(jobs) && jobs.length === 6, 'exact six source records');
  const membership = [150,151,152,153,154,155];
  const connectionMap = new Map();
  for (let i = 0; i < expectedConnections.length; i++) {
    const expected = expectedConnections[i], record = connections[i], job = jobs[i];
    check(record.connectionId === expected.id && record.recordIndex === expected.index && record.fields.ID === expected.id && record.fields.Job_ID === expected.jobId, `Connection endpoint/locator ${expected.id}`);
    check(record.locator === `data/configdata/ConfigDataJobConnectionInfo.json#records[${expected.index}]/ID=${expected.id}`, `Connection record locator ${expected.id}`);
    check(record.fields.PreJobConnectionListPresent === (expected.pre !== null), `PreJobConnectionList presence ${expected.id}`);
    check(JSON.stringify(record.fields.PreJobConnectionList) === JSON.stringify(expected.pre), `PreJobConnectionList value ${expected.id}`);
    check(record.fields.PreJobConnectionListType === (expected.pre === null ? null : 'JSON array'), `PreJobConnectionList type ${expected.id}`);
    check(record.fieldLocators.PreJobConnectionList === (expected.pre === null ? null : `#records[${expected.index}]/PreJobConnectionList`), `PreJobConnectionList field locator ${expected.id}`);
    check(job.jobId === expected.jobId && job.recordIndex === expected.jobIndex && job.fields.ID === expected.jobId && job.fields.Rank === expected.rank && job.fields.UnlockText === expected.unlock, `JobInfo endpoint/field ${expected.jobId}`);
    check(job.locator === `data/configdata/ConfigDataJobInfo.json#records[${expected.jobIndex}]/ID=${expected.jobId}` && job.fieldLocators.UnlockText === `#records[${expected.jobIndex}]/UnlockText`, `JobInfo locator ${expected.jobId}`);
    connectionMap.set(expected.id, record);
  }
  check(evidence.claims.rawPreJobConnectionList.evidenceClass === 'A' && evidence.claims.rawPreJobConnectionList.status === 'SOURCE_VERIFIED', 'raw reference claim class');
  check(evidence.claims.rawPreJobConnectionList.referenceNamespace === 'ConfigDataJobConnectionInfo.ID' && evidence.claims.rawPreJobConnectionList.endpointResolution.includes('exactly one'), 'Connection ID namespace and endpoint resolution');
  check(evidence.claims.unlockText.status === 'RAW_TEXT_VERIFIED_NOT_STRUCTURED' && evidence.claims.unlockText.exactText === '精通前置职业后可以转职', 'unlock text remains raw and unstructured');
  check(evidence.claims.directEdges.evidenceClass === 'A' && evidence.claims.directEdges.status === 'ADMITTED', 'direct edge admission basis');
  check(evidence.claims.directEdges.direction === 'PreJobConnectionList value on a successor connection identifies the prerequisite/predecessor JobConnection; canonical edge is predecessorConnection -> successorConnection.', 'edge direction contract');
  check(evidence.claims.directEdges.limitations.some((x) => x.includes('No reachability')), 'reachability limitation');
  check(evidence.claims.officialCorroboration?.url === 'https://us-news.zlongame.com/heroSSR/858.jhtml' && evidence.claims.officialCorroboration.scope.includes('does not provide machine-verifiable edge topology') && evidence.claims.officialCorroboration.notUsedAs === 'It is not used to assign ConfigData IDs or independently prove each edge.', 'official corroboration scope/limitation');
  const projected = evidence.derivedEdgeProjection;
  check(JSON.stringify(projected) === JSON.stringify(evidence.claims.directEdges.records), 'evidence edge projection parity');
  const edgeTuples = projected.map((e) => [e.heroId,e.predecessorConnectionId,e.predecessorJobId,e.successorConnectionId,e.successorJobId,e.sourceLocator]);
  check(JSON.stringify(edgeTuples) === JSON.stringify(expectedEdges), 'expected five direct edges only');
  for (const edge of projected) {
    check(edge.heroId === 15 && membership.includes(edge.predecessorConnectionId) && membership.includes(edge.successorConnectionId), 'Hero 15 membership endpoint');
    check(connectionMap.get(edge.predecessorConnectionId)?.fields.Job_ID === edge.predecessorJobId && connectionMap.get(edge.successorConnectionId)?.fields.Job_ID === edge.successorJobId, 'Connection-to-Job endpoint parity');
    check(connectionMap.get(edge.successorConnectionId)?.fields.PreJobConnectionList?.includes(edge.predecessorConnectionId), 'source edge reference exists');
  }
  check(canonical?.schemaVersion === 1 && canonical.scope === 'Direct prerequisite JobConnection edges for Hero 15 only, derived from exact ConfigDataJobConnectionInfo.PreJobConnectionList references; no reachability or UI publication.', 'Canonical schema/scope');
  check(JSON.stringify(Object.keys(canonical).sort()) === JSON.stringify(['records','schemaVersion','scope']), 'Canonical must not add unlock, mastery, or presentation fields');
  check(JSON.stringify(canonical.records) === JSON.stringify(projected), 'Canonical exact Source Projection parity');
  const relationRows = heroJobRelations.records.filter((r) => r.heroId === 15);
  check(heroJobRelations.records.length === 211 && JSON.stringify(relationRows.map(r => [r.heroId,r.jobId]).sort((a,b)=>a[1]-b[1])) === JSON.stringify([[15,703],[15,707],[15,802],[15,803],[15,806],[15,811]]), 'existing Hero-Job 211 / Hero 15 six relation parity');
  const statRows = jobLevelCanonical.records.filter((r) => r.heroId === 15);
  check(jobLevelCanonical.records.length === 75 && statRows.length === 25 && JSON.stringify([...new Set(statRows.map(r=>r.jobConnectionId))].sort((a,b)=>a-b)) === JSON.stringify(membership), 'existing Hero 15 JobLevel 25 / six connections parity');
  check(JSON.stringify(Object.keys(integratedDecision).sort()) === JSON.stringify(['approval','approvedScope','decisionType','effect','schemaVersion','status']) && integratedDecision?.status === 'APPROVED' && integratedDecision.approvedScope.heroId === 15 && JSON.stringify(integratedDecision.approvedScope.surfaces) === JSON.stringify(['HERO_MINIMAL_DETAIL','HERO_INDEX_LIST','EXCLUSIVE_EQUIPMENT_LIST']) && integratedDecision.approvedScope.excluded.includes('Job') && integratedDecision.approvedScope.excluded.includes('New Semantic Admission'), 'existing integrated publication decision scope remains unchanged');
  check(JSON.stringify(Object.keys(talentDecision).sort()) === JSON.stringify(['approval','approvedScope','decisionType','effect','schemaVersion','status']) && talentDecision?.status === 'APPROVED' && talentDecision.approvedScope.heroId === 15 && talentDecision.approvedScope.surface === 'hero-minimal-detail-15' && talentDecision.approvedScope.excluded.includes('new Semantic relation') && !JSON.stringify(talentDecision).toLowerCase().includes('job tree'), 'existing Talent Publication decision excludes Job Tree');
  return { edges: projected.length, rawConnectionRecords: connections.length, unlockTextRecords: jobs.length, heroJobRelations: heroJobRelations.records.length, hero15JobLevels: statRows.length, unlockRule: 'raw text only; no structured threshold admitted', publication: 'NOT_APPROVED' };
}

export async function validateHero15JobAdvancementFromRoot(root = process.cwd()) {
  const read = (path) => readFile(resolve(root, path), 'utf8').then(JSON.parse);
  const [evidence, canonical, heroJobRelations, jobLevelCanonical, integratedDecision, talentDecision] = await Promise.all([
    read('evidence/source/jobs/hero-job-tree-hero15.v1.json'),
    read('canonical/hero-job-advancement-relations.v1.json'),
    read('canonical/hero-job-relations.v1.json'),
    read('canonical/hero-job-level-raw-stats.v1.json'),
    read('docs/decisions/hero-15-integrated-publication.v1.json'),
    read('docs/decisions/hero-15-talent-publication.v1.json'),
  ]);
  return validateHero15JobAdvancement({ evidence, canonical, heroJobRelations, jobLevelCanonical, integratedDecision, talentDecision });
}
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  const result = await validateHero15JobAdvancementFromRoot();
  process.stdout.write(`Hero 15 Job advancement: PASS (${result.edges} direct edges; ${result.rawConnectionRecords} exact Connections; unlock text raw only; no publication)\n`);
}
