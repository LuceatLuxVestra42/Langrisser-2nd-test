import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const source = process.cwd();
const temp = await mkdtemp(join(tmpdir(), 'langrisser-job-validation-'));
const repo = join(temp, 'repo');
await cp(source, repo, { recursive: true, filter: (path) => !path.split('/').includes('.git') });

function run(script) {
  return spawnSync(process.execPath, [script], { cwd: repo, encoding: 'utf8' });
}
function expectFailure(result, label) {
  if (result.status === 0) throw new Error(`${label}: expected validator failure`);
}
const canonicalPath = join(repo, 'canonical/heroes.v1.json');
const generatedPath = join(repo, 'generated/hero-slice.v1.json');
const originalCanonical = await readFile(canonicalPath, 'utf8');
const originalGenerated = await readFile(generatedPath, 'utf8');

try {
  await writeFile(generatedPath, `${originalGenerated}\n`);
  const staleBefore = await readFile(generatedPath, 'utf8');
  expectFailure(run('tools/validate.mjs'), 'stale generated consumer');
  expectFailure(run('tools/build.mjs'), 'build with stale generated consumer');
  if (await readFile(generatedPath, 'utf8') !== staleBefore) throw new Error('build mutated stale generated output');
  await writeFile(generatedPath, originalGenerated);

  const invalidConnection = JSON.parse(originalCanonical);
  invalidConnection.records[0].jobConnections[0].connectionId = 999999;
  await writeFile(canonicalPath, `${JSON.stringify(invalidConnection, null, 2)}\n`);
  expectFailure(run('tools/validate.mjs'), 'unknown connection ID');

  const invalidTarget = JSON.parse(originalCanonical);
  invalidTarget.records[0].jobConnections[0].jobId = 303;
  await writeFile(canonicalPath, `${JSON.stringify(invalidTarget, null, 2)}\n`);
  expectFailure(run('tools/validate.mjs'), 'wrong but existing JobInfo target ID');

  process.stdout.write('Job relation validator cases: PASS (stale generated, unknown connection ID, wrong existing JobInfo target rejected; build is read-only)\n');
} finally {
  await rm(temp, { recursive: true, force: true });
}
