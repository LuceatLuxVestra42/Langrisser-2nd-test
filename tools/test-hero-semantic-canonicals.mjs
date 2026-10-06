import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const source = process.cwd();
const temp = await mkdtemp(join(tmpdir(), 'langrisser-hero-canonicals-'));
const repo = join(temp, 'repo');
await cp(source, repo, { recursive: true, filter: (path) => !path.split('/').includes('.git') });

function run() {
  return spawnSync(process.execPath, ['tools/validate-hero-semantic-canonicals.mjs'], { cwd: repo, encoding: 'utf8' });
}
function assertExecution(result, label) {
  if (result.error !== undefined && result.error !== null) {
    throw new Error(`${label}: validator process spawn failed: ${result.error.message}`);
  }
  if (result.signal !== null) {
    throw new Error(`${label}: validator process terminated by signal ${result.signal}`);
  }
  if (!Number.isInteger(result.status)) {
    throw new Error(`${label}: validator process did not return an integer exit status`);
  }
}

function expectFailure(result, label, expectedDiagnostic) {
  assertExecution(result, label);
  if (result.status === 0) throw new Error(`${label}: expected validator rejection`);
  const diagnostic = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
  if (!expectedDiagnostic.test(diagnostic)) {
    throw new Error(`${label}: expected diagnostic ${expectedDiagnostic}; received:\n${diagnostic}`);
  }
}

function expectSuccess(result, label, expectedDiagnostic) {
  assertExecution(result, label);
  if (result.status !== 0) throw new Error(`${label}: expected validator success; received:\n${result.stdout ?? ''}\n${result.stderr ?? ''}`);
  const diagnostic = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
  if (!expectedDiagnostic.test(diagnostic)) {
    throw new Error(`${label}: expected success diagnostic ${expectedDiagnostic}; received:\n${diagnostic}`);
  }
}

function testExpectFailureIntegrity() {
  const targetDiagnostic = /TARGET_REJECTION_FIXTURE/;
  expectFailure({
    error: undefined, signal: null, status: 1, stdout: '',
    stderr: 'TARGET_REJECTION_FIXTURE',
  }, 'helper target-rejection fixture', targetDiagnostic);
  assert.throws(() => expectFailure({
    error: Object.assign(new Error('missing executable'), { code: 'ENOENT' }),
    signal: null, status: null, stdout: '', stderr: '',
  }, 'helper spawn-error fixture', targetDiagnostic), /spawn failed/);
  assert.throws(() => expectFailure({
    error: undefined, signal: 'SIGTERM', status: null, stdout: '', stderr: '',
  }, 'helper signal fixture', targetDiagnostic), /terminated by signal/);
  assert.throws(() => expectFailure({
    error: undefined, signal: null, status: null, stdout: '', stderr: '',
  }, 'helper missing-status fixture', targetDiagnostic), /integer exit status/);
  assert.throws(() => expectFailure({
    error: undefined, signal: null, status: 0, stdout: '',
    stderr: 'TARGET_REJECTION_FIXTURE',
  }, 'helper zero-status fixture', targetDiagnostic), /expected validator rejection/);
  assert.throws(() => expectFailure({
    error: undefined, signal: null, status: 1, stdout: '',
    stderr: 'unrelated validation failed',
  }, 'helper unrelated-diagnostic fixture', targetDiagnostic), /expected diagnostic/);
}

testExpectFailureIntegrity();


async function mutateAndExpectFailure(path, change, label, expectedDiagnostic) {
  const fullPath = join(repo, path);
  const original = await readFile(fullPath, 'utf8');
  try {
    const value = JSON.parse(original);
    change(value);
    await writeFile(fullPath, `${JSON.stringify(value, null, 2)}\n`);
    expectFailure(run(), label, expectedDiagnostic);
  } finally {
    await writeFile(fullPath, original);
  }
}

try {
  const baseline = run();
  expectSuccess(baseline, 'Hero semantic canonical baseline', /267 playable identities; 66 relations; 42 selected-slice parity pairs/);
  if (!baseline.stdout.includes('267 playable identities; 66 relations; 42 selected-slice parity pairs')) throw new Error('baseline must retain 267 identities and exactly the current 66/42 Hero→Job relation pairs');
  const relationPath = 'canonical/hero-job-relations.v1.json';
  const identityPath = 'canonical/hero-identities.v1.json';
  const identityEvidencePath = 'evidence/source/configdata/ConfigDataHeroInfo.records-playable-identity.v1.json';
  const expansionHeroPath = 'evidence/source/configdata/ConfigDataHeroInfo.records-hero-expansion.v1.json';
  const expansionConnectionPath = 'evidence/source/configdata/ConfigDataJobConnectionInfo.records-hero-expansion.v1.json';
  const expansionEvidencePath = 'evidence/source/jobs/hero-job-connection-expansion.v1.json';

  await mutateAndExpectFailure(identityEvidencePath, (doc) => { doc.records = doc.records.filter((row) => row.ID !== 1); }, 'playable identity source missing', /playable Hero identity manifest\/source pin drift/);
  await mutateAndExpectFailure(identityPath, (doc) => { doc.records.push({ heroId: 999999, provenance: identityEvidencePath + '#ID=999999' }); }, 'unexpected extra Hero ID', /Hero 999999 identity evidence locator\/value mismatch/);
  await mutateAndExpectFailure(identityPath, (doc) => { doc.records[1].heroId = doc.records[0].heroId; }, 'duplicate heroId', /malformed or duplicate Hero ID \d+/);
  await mutateAndExpectFailure(identityPath, (doc) => { doc.records[0].heroId = 'not-an-id'; }, 'malformed Hero ID', /malformed or duplicate Hero ID not-an-id/);
  await mutateAndExpectFailure(identityPath, (doc) => { doc.records[0].provenance = identityEvidencePath + '#ID=999'; }, 'provenance locator mismatch', /Hero 1 identity evidence locator\/value mismatch/);
  await mutateAndExpectFailure(identityPath, (doc) => { doc.records[0].displayName = 'unexpected'; }, 'unsupported canonical field', /Hero identity 1 has unexpected or missing fields/);
  await mutateAndExpectFailure(identityPath, (doc) => { delete doc.records[0].provenance; }, 'missing Hero identity provenance', /Hero identity 1 has unexpected or missing fields/);
  await mutateAndExpectFailure(identityPath, (doc) => { doc.records = doc.records.filter((row) => row.heroId !== 1); }, 'missing playable Hero identity', /Hero identity count differs from the playable source identity scope/);

  await mutateAndExpectFailure(relationPath, (doc) => { doc.records[0].heroId = 999999; }, 'relation Hero absent from identity owner', /relation Hero 999999 has no canonical identity/);
  await mutateAndExpectFailure(relationPath, (doc) => { doc.records[0].jobId = 999999; }, 'unsupported Job ID', /relation Job 999999 has no preserved JobInfo evidence/);
  await mutateAndExpectFailure(relationPath, (doc) => { doc.records[1] = { ...doc.records[0] }; }, 'duplicate Hero/Job pair', /duplicate Hero→Job relation pair/);
  await mutateAndExpectFailure(relationPath, (doc) => { doc.records[0].jobId = 368; }, 'relation pair mutation', /relation pair\/evidence locator mismatch for 1:368/);
  await mutateAndExpectFailure(relationPath, (doc) => { doc.records.push({ heroId: 15, jobId: 368, provenance: 'evidence/not-authorized.json#record=1' }); }, 'identity expansion must not expand Hero→Job relations', /relation pair\/evidence locator mismatch for 15:368/);
  await mutateAndExpectFailure(relationPath, (doc) => { doc.records[0].provenance = 'evidence/wrong.json#record=1'; }, 'relation provenance mismatch', /relation pair\/evidence locator mismatch for 1:262/);
  await mutateAndExpectFailure(relationPath, (doc) => { doc.records = doc.records.filter((row) => !(row.heroId === 5 && row.jobId === 817)); }, 'missing selected relation', /Hero→Job relation count differs from the current evidence-backed scope/);
  await mutateAndExpectFailure(relationPath, (doc) => { doc.records = doc.records.filter((row) => !(row.heroId === 6 && row.jobId === 377)); }, 'missing SP relation', /Hero→Job relation count differs from the current evidence-backed scope/);

  await mutateAndExpectFailure(expansionHeroPath, (doc) => { doc.find((row) => row.ID === 28).JobConnection_ID = 999999; }, 'expansion HeroInfo explicit connection corruption', /expansion connection ID set differs from HeroInfo refs/);
  await mutateAndExpectFailure(expansionConnectionPath, (doc) => { doc.find((row) => row.ID === 280).Job_ID = 999999; }, 'expansion JobConnectionInfo target corruption', /expansion JobInfo ID set differs from JobConnectionInfo targets/);
  await mutateAndExpectFailure(expansionEvidencePath, (doc) => { doc.records.find((row) => row.heroId === 28 && row.connectionId === 280).jobInfoLocator = 'evidence/source/configdata/ConfigDataJobInfo.records-hero-expansion.v1.json#ID=999999'; }, 'expansion provenance locator corruption', /expansion source locator mismatch for 28:280/);
  await mutateAndExpectFailure(relationPath, (doc) => { doc.records = doc.records.filter((row) => !(row.heroId === 28 && row.jobId === 1101)); }, 'missing additive expansion relation', /Hero→Job relation count differs from the current evidence-backed scope/);
  await mutateAndExpectFailure(relationPath, (doc) => { doc.records.find((row) => row.heroId === 53 && row.jobId === 426).provenance = 'evidence/wrong.json#heroId=53'; }, 'Hero 53 SP provenance protection', /relation pair\/evidence locator mismatch for 53:426/);

  const selectedPath = 'canonical/heroes.v1.json';
  await mutateAndExpectFailure(selectedPath, (doc) => { doc.records[0].jobConnections[0].jobId = 999999; }, 'selected-slice parity mutation', /selected slice relation 5:999999 is absent from the general relation owner/);
  await mutateAndExpectFailure(selectedPath, (doc) => { doc.records.find((row) => row.id === 28).jobConnections[0].jobId = 999999; }, 'expanded selected-slice parity mutation', /selected slice relation 28:999999 is absent from the general relation owner/);

  const relationDoc = JSON.parse(await readFile(join(repo, relationPath), 'utf8'));
  for (const jobId of [1220, 20243, 20707]) {
    if (!relationDoc.records.some((row) => row.jobId === jobId)) throw new Error(`status-only Job ${jobId} missing from relation owner`);
  }
  const localizationPath = join(repo, 'canonical/job-localizations-ko.v1.json');
  const originalLocalization = await readFile(localizationPath, 'utf8');
  try {
    await writeFile(localizationPath, '{}\n');
    const independent = run();
    expectSuccess(independent, 'Hero→Job localization independence', /Hero semantic canonicals: PASS/);
  } finally {
    await writeFile(localizationPath, originalLocalization);
  }

  process.stdout.write('Hero semantic canonical tests: PASS (playable identity source/canonical negatives, current 66 Hero→Job pairs, 42-pair presentation-slice parity, status-only Jobs, localization independence)\n');
} finally {
  await rm(temp, { recursive: true, force: true });
}
