import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const source = process.cwd();
const temp = await mkdtemp(join(tmpdir(), 'langrisser-job-localization-'));
const repo = join(temp, 'repo');
await cp(source, repo, { recursive: true, filter: (path) => !path.split('/').includes('.git') });

function run(script) {
  return spawnSync(process.execPath, [script], { cwd: repo, encoding: 'utf8' });
}
function expectFailure(result, label) {
  if (result.status === 0) throw new Error(`${label}: expected validator failure`);
}
async function editJson(path, change) {
  const fullPath = join(repo, path);
  const original = await readFile(fullPath, 'utf8');
  const value = JSON.parse(original);
  change(value);
  await writeFile(fullPath, `${JSON.stringify(value, null, 2)}\n`);
  return async () => writeFile(fullPath, original);
}

try {
  let restore = await editJson('canonical/job-localizations-ko.v1.json', (canonical) => {
    canonical.records.find((row) => row.jobId === 301).nameKo = '나이트 변경';
  });
  expectFailure(run('tools/validate.mjs'), 'stale generated localization projection');
  expectFailure(run('tools/build.mjs'), 'build with stale generated localization projection');
  await restore();

  restore = await editJson('evidence/localization/job-names-ko.hero-5-6-8.v1.json', (subset) => {
    subset.records.find((row) => row.jobId === 301).nameKo = '잘못된값';
  });
  expectFailure(run('tools/validate.mjs'), 'wrong KR value for Job 301');
  await restore();

  restore = await editJson('evidence/localization/job-names-ko.hero-5-6-8.v1.json', (subset) => {
    const one = subset.records.find((row) => row.jobId === 301);
    const two = subset.records.find((row) => row.jobId === 303);
    [one.nameKo, two.nameKo] = [two.nameKo, one.nameKo];
  });
  expectFailure(run('tools/validate.mjs'), 'wrong ID to KR localization mapping');
  await restore();

  restore = await editJson('evidence/localization/job-names-ko.hero-5-6-8.v1.json', (subset) => {
    subset.records.find((row) => row.jobId === 301).nameKo = '한섭 미실장';
  });
  expectFailure(run('tools/validate.mjs'), 'status string admitted as Job name');
  await restore();

  restore = await editJson('canonical/job-localizations-ko.v1.json', (canonical) => {
    canonical.records.find((row) => row.jobId === 128).nameKo = '잘못된 SP 이름';
  });
  expectFailure(run('tools/validate.mjs'), 'wrong SP KR value');
  await restore();

  restore = await editJson('canonical/job-localizations-ko.v1.json', (canonical) => {
    const one = canonical.records.find((row) => row.jobId === 128);
    const two = canonical.records.find((row) => row.jobId === 262);
    [one.nameKo, two.nameKo] = [two.nameKo, one.nameKo];
  });
  expectFailure(run('tools/validate.mjs'), 'swapped SP ID/name mapping');
  await restore();

  restore = await editJson('canonical/job-localizations-ko.v1.json', (canonical) => {
    canonical.records.push({ jobId: 1220, nameKo: '한섭 미실장', evidenceClass: 'A', provenance: 'evidence/localization/sp-job-namespace.v1.json#jobId=1220' });
  });
  expectFailure(run('tools/validate.mjs'), 'status-only SP admission');
  await restore();

  restore = await editJson('canonical/job-localizations-ko.v1.json', (canonical) => {
    canonical.records.find((row) => row.jobId === 128).provenance = 'evidence/localization/sp-job-namespace.v1.json#jobId=262';
  });
  expectFailure(run('tools/validate.mjs'), 'SP provenance mismatch');
  await restore();

  restore = await editJson('evidence/localization/sp-job-namespace.v1.json', (evidence) => {
    evidence.records.find((row) => row.jobId === 128).cnConsistency = false;
  });
  expectFailure(run('tools/validate.mjs'), 'namespace evidence mismatch');
  await restore();

  restore = await editJson('canonical/job-localizations-ko.v1.json', (canonical) => {
    canonical.records.push({ ...canonical.records[0] });
  });
  expectFailure(run('tools/validate.mjs'), 'duplicate canonical Job ID');
  await restore();

  process.stdout.write('Job localization validator cases: PASS (legacy localization negatives, SP wrong value/mapping/provenance, status-only admission, namespace evidence mismatch, duplicate ID rejected)\n');
} finally {
  await rm(temp, { recursive: true, force: true });
}
