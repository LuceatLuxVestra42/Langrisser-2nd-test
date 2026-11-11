import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateHero15JobAdvancement } from './validate-hero15-job-advancement.mjs';

const read = (path) => readFile(path, 'utf8').then(JSON.parse);
const base = {
  evidence: await read('evidence/source/jobs/hero-job-tree-hero15.v1.json'),
  canonical: await read('canonical/hero-job-advancement-relations.v1.json'),
  heroJobRelations: await read('canonical/hero-job-relations.v1.json'),
  jobLevelCanonical: await read('canonical/hero-job-level-raw-stats.v1.json'),
  integratedDecision: await read('docs/decisions/hero-15-integrated-publication.v1.json'),
  talentDecision: await read('docs/decisions/hero-15-talent-publication.v1.json'),
};
validateHero15JobAdvancement(base);
let count = 0;
function reject(label, mutate) {
  const fixture = structuredClone(base);
  mutate(fixture);
  assert.throws(() => validateHero15JobAdvancement(fixture), undefined, `${label} must be rejected`);
  count++;
}
reject('Hero ID mutation', x => { x.canonical.records[0].heroId = 8; });
reject('Connection ID mutation', x => { x.canonical.records[0].successorConnectionId = 155; });
reject('Job endpoint mismatch', x => { x.canonical.records[0].successorJobId = 707; });
reject('missing raw PreJob field', x => { x.evidence.records.jobConnections[1].fields.PreJobConnectionListPresent = false; });
reject('raw predecessor value mutation', x => { x.evidence.records.jobConnections[1].fields.PreJobConnectionList[0] = 152; });
reject('source commit mutation', x => { x.evidence.source.commit = '0'.repeat(40); });
reject('Source blob mutation', x => { x.evidence.source.jobConnectionInfo.gitBlobSha1 = '0'.repeat(40); });
reject('Source SHA-256 mutation', x => { x.evidence.source.jobInfo.sha256 = '0'.repeat(64); });
reject('record locator mutation', x => { x.evidence.records.jobConnections[2].recordIndex = 99; });
reject('field locator mutation', x => { x.evidence.records.jobConnections[4].fieldLocators.PreJobConnectionList = '#ID=154'; });
reject('missing endpoint record', x => { x.evidence.records.jobConnections.pop(); });
reject('namespace claim weakened', x => { x.evidence.claims.rawPreJobConnectionList.referenceNamespace = 'some numeric ID'; });
reject('direction reversed', x => { const r=x.canonical.records[0]; [r.predecessorConnectionId,r.successorConnectionId]=[r.successorConnectionId,r.predecessorConnectionId]; });
reject('Job ID endpoint reassignment', x => { x.canonical.records[3].predecessorJobId = 703; });
reject('duplicate direct edge', x => { x.canonical.records.push(structuredClone(x.canonical.records[0])); });
reject('foreign Hero edge', x => { x.canonical.records[0].heroId = 4; });
reject('rank-derived extra edge', x => { x.canonical.records.push({ heroId:15, predecessorConnectionId:151, predecessorJobId:803, successorConnectionId:154, successorJobId:811, sourceLocator:'rank-inference' }); });
reject('UISort/connection order added edge', x => { x.canonical.records.push({ heroId:15, predecessorConnectionId:150, predecessorJobId:802, successorConnectionId:154, successorJobId:811, sourceLocator:'array-order' }); });
reject('raw reference promoted to unlock condition', x => { x.canonical.unlockConditions = [{ connectionId:154, level:40 }]; });
reject('unlock condition promoted into Canonical', x => { x.canonical.unlockText = 'master 40'; });
reject('unsupported reachability added', x => { x.canonical.records.push({ heroId:15, predecessorConnectionId:150, predecessorJobId:802, successorConnectionId:155, successorJobId:707, sourceLocator:'transitive' }); });
reject('Hero-Job membership regression', x => { x.heroJobRelations.records.pop(); });
reject('JobLevel raw stats regression', x => { x.jobLevelCanonical.records.pop(); });
reject('unlock text transformed', x => { x.evidence.records.jobs[0].fields.UnlockText = 'Level 40'; });
reject('official corroboration overclaimed', x => { x.evidence.claims.officialCorroboration.scope = 'proves all five individual edges'; });
reject('tree publication inserted', x => { x.integratedDecision.approvedScope.surfaces.push('JOB_TREE'); });
reject('integrated Publication decision changed', x => { x.integratedDecision.approvedScope.heroId = 16; });
reject('talent publication mutated', x => { x.talentDecision.publicationApproval = 'JOB_TREE'; });
process.stdout.write(`Hero 15 Job advancement negative tests: PASS (${count} rejection controls)\n`);
