import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const source = process.cwd();
const temp = await mkdtemp(join(tmpdir(), 'langrisser-job-localization-'));
const repo = join(temp, 'repo');
const localizationValidator = 'tools/validate-job-localization.mjs';
await cp(source, repo, { recursive: true, filter: (path) => !path.split('/').includes('.git') });

function run(script) {
  return spawnSync(process.execPath, [script], { cwd: repo, encoding: 'utf8' });
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


async function editJson(path, change) {
  const fullPath = join(repo, path);
  const original = await readFile(fullPath, 'utf8');
  const value = JSON.parse(original);
  change(value);
  await writeFile(fullPath, `${JSON.stringify(value, null, 2)}\n`);
  return async () => writeFile(fullPath, original);
}

async function editLocalizationSourceAndSubset(nameKo) {
  const sourcePath = 'evidence/localization/source/job-names-ko.v1.txt';
  const manifestPath = 'evidence/localization/source/job-names-ko.source-manifest.v1.json';
  const subsetPath = 'evidence/localization/job-names-ko.hero-5-6-8.v1.json';
  const [sourceOriginal, manifestOriginal, subsetOriginal] = await Promise.all([
    readFile(join(repo, sourcePath), 'utf8'),
    readFile(join(repo, manifestPath), 'utf8'),
    readFile(join(repo, subsetPath), 'utf8'),
  ]);
  const pieces = sourceOriginal.split(/(\r?\n)/);
  const rowIndex = Array.from({ length: Math.ceil(pieces.length / 2) }, (_, i) => i * 2)
    .find((i) => pieces[i].startsWith('301\t'));
  if (rowIndex === undefined) throw new Error('status-only source fixture could not find Job 301');
  const fields = pieces[rowIndex].split('\t');
  if (fields.length !== 3) throw new Error('status-only source fixture expected exactly three fields');
  fields[2] = nameKo;
  pieces[rowIndex] = fields.join('\t');
  const sourceNext = pieces.join('');
  const manifest = JSON.parse(manifestOriginal);
  manifest.sourceSha256 = createHash('sha256').update(Buffer.from(sourceNext, 'utf8')).digest('hex');
  const subset = JSON.parse(subsetOriginal);
  subset.records.find((row) => row.jobId === 301).nameKo = nameKo;
  await Promise.all([
    writeFile(join(repo, sourcePath), sourceNext),
    writeFile(join(repo, manifestPath), `${JSON.stringify(manifest, null, 2)}\n`),
    writeFile(join(repo, subsetPath), `${JSON.stringify(subset, null, 2)}\n`),
  ]);
  return async () => Promise.all([
    writeFile(join(repo, sourcePath), sourceOriginal),
    writeFile(join(repo, manifestPath), manifestOriginal),
    writeFile(join(repo, subsetPath), subsetOriginal),
  ]);
}

try {
  let restore = await editJson('canonical/job-localizations-ko.v1.json', (canonical) => {
    canonical.records.find((row) => row.jobId === 301).nameKo = '나이트 변경';
  });
  expectFailure(run(localizationValidator), 'changed canonical Job localization', /canonical KR label differs from usable source value for Job 301/);
  expectFailure(run('tools/validate.mjs'), 'stale generated localization projection', /generated consumer is stale or non-deterministic relative to canonical input/);
  expectFailure(run('tools/build.mjs'), 'build with stale generated localization projection', /generated consumer is stale or non-deterministic relative to canonical input/);
  await restore();

  restore = await editJson('evidence/localization/job-names-ko.hero-5-6-8.v1.json', (subset) => {
    subset.records.find((row) => row.jobId === 301).nameKo = '잘못된값';
  });
  expectFailure(run(localizationValidator), 'wrong KR value for Job 301', /localization KR value differs from source for Job 301/);
  await restore();

  restore = await editJson('evidence/localization/job-names-ko.hero-5-6-8.v1.json', (subset) => {
    const one = subset.records.find((row) => row.jobId === 301);
    const two = subset.records.find((row) => row.jobId === 303);
    [one.nameKo, two.nameKo] = [two.nameKo, one.nameKo];
  });
  expectFailure(run(localizationValidator), 'wrong ID to KR localization mapping', /localization KR value differs from source for Job (301|303)/);
  await restore();

  restore = await editLocalizationSourceAndSubset('한섭 미실장');
  expectFailure(run(localizationValidator), 'status string admitted as Job name', /localization Job 301 has blank or status-only KR value/);
  await restore();

  restore = await editJson('canonical/job-localizations-ko.v1.json', (canonical) => {
    canonical.records.find((row) => row.jobId === 128).nameKo = '잘못된 SP 이름';
  });
  expectFailure(run(localizationValidator), 'wrong SP KR value', /canonical SP KR label differs from evidence value for Job 128/);
  await restore();

  restore = await editJson('canonical/job-localizations-ko.v1.json', (canonical) => {
    const one = canonical.records.find((row) => row.jobId === 128);
    const two = canonical.records.find((row) => row.jobId === 262);
    [one.nameKo, two.nameKo] = [two.nameKo, one.nameKo];
  });
  expectFailure(run(localizationValidator), 'swapped SP ID/name mapping', /canonical SP KR label differs from evidence value for Job (128|262)/);
  await restore();

  restore = await editJson('canonical/job-localizations-ko.v1.json', (canonical) => {
    canonical.records.push({ jobId: 1220, nameKo: '한섭 미실장', evidenceClass: 'A', provenance: 'evidence/localization/sp-job-namespace.v1.json#jobId=1220' });
  });
  expectFailure(run(localizationValidator), 'status-only SP admission', /canonical Job localization must contain exactly 40 records/);
  await restore();

  restore = await editJson('canonical/job-localizations-ko.v1.json', (canonical) => {
    canonical.records.find((row) => row.jobId === 128).provenance = 'evidence/localization/sp-job-namespace.v1.json#jobId=262';
  });
  expectFailure(run(localizationValidator), 'SP provenance mismatch', /canonical SP localization provenance drift for Job 128/);
  await restore();

  restore = await editJson('evidence/localization/sp-job-namespace.v1.json', (evidence) => {
    evidence.records.find((row) => row.jobId === 128).cnConsistency = false;
  });
  expectFailure(run(localizationValidator), 'namespace evidence mismatch', /evidence rows, locators, classifications, or comparison results differ from source records/);
  await restore();

  restore = await editJson('canonical/job-localizations-ko.v1.json', (canonical) => {
    canonical.records.push({ ...canonical.records[0] });
  });
  expectFailure(run(localizationValidator), 'duplicate canonical Job ID', /canonical Job localization must contain exactly 40 records/);
  await restore();

  const clean = run(localizationValidator);
  expectSuccess(clean, 'clean Job localization validation', /Job localization: PASS/);
  process.stdout.write('Job localization validator cases: PASS (legacy localization negatives, SP wrong value/mapping/provenance, status-only admission, namespace evidence mismatch, duplicate ID rejected)\n');
} finally {
  await rm(temp, { recursive: true, force: true });
}
