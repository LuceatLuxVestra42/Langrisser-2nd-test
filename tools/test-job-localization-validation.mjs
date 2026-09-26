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

  process.stdout.write('Job localization validator cases: PASS (stale projection, wrong KR value, wrong ID mapping, status-only value rejected)\n');
} finally {
  await rm(temp, { recursive: true, force: true });
}
