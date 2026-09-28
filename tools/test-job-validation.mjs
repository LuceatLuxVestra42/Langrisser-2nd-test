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
async function editJson(path, change) {
  const fullPath = join(repo, path);
  const original = await readFile(fullPath, 'utf8');
  const value = JSON.parse(original);
  change(value);
  await writeFile(fullPath, `${JSON.stringify(value, null, 2)}\n`);
  return async () => writeFile(fullPath, original);
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

  let restore = await editJson('evidence/source/configdata/ConfigDataSPHeroInfo.records-sp-relation.v1.json', (rows) => {
    rows.find((row) => row.ID === 12).ID = 999999;
  });
  expectFailure(run('tools/validate-hero-sp-job-relation-evidence.mjs'), 'SPHeroInfo ID without HeroInfo identity');
  await restore();

  restore = await editJson('evidence/source/configdata/ConfigDataSPHeroInfo.records-sp-relation.v1.json', (rows) => {
    rows.find((row) => row.ID === 12).JobConnection_ID = 999999;
  });
  expectFailure(run('tools/validate-hero-sp-job-relation-evidence.mjs'), 'unresolved SPHeroInfo JobConnection_ID');
  await restore();

  restore = await editJson('evidence/source/configdata/ConfigDataJobConnectionInfo.records-sp-relation.v1.json', (rows) => {
    rows.find((row) => row.ID === 126).Job_ID = 999999;
  });
  expectFailure(run('tools/validate-hero-sp-job-relation-evidence.mjs'), 'unresolved JobConnectionInfo Job_ID');
  await restore();

  restore = await editJson('evidence/source/configdata/ConfigDataSPHeroInfo.records-sp-relation.v1.json', (rows) => {
    rows[1].ID = rows[0].ID;
  });
  expectFailure(run('tools/validate-hero-sp-job-relation-evidence.mjs'), 'duplicate SPHeroInfo ID');
  await restore();

  restore = await editJson('evidence/source/jobs/hero-sp-job-relation.v1.json', (evidence) => {
    [evidence.records[0].spJobId, evidence.records[1].spJobId] = [evidence.records[1].spJobId, evidence.records[0].spJobId];
  });
  expectFailure(run('tools/validate-hero-sp-job-relation-evidence.mjs'), 'swapped SP Hero relation');
  await restore();

  restore = await editJson('evidence/source/jobs/hero-sp-job-relation.v1.json', (evidence) => {
    evidence.records.find((row) => row.heroId === 12).jobConnectionInfoLocator = 'evidence/source/configdata/ConfigDataJobConnectionInfo.records-sp-relation.v1.json#ID=336';
  });
  expectFailure(run('tools/validate-hero-sp-job-relation-evidence.mjs'), 'relation source locator mismatch');
  await restore();

  restore = await editJson('canonical/job-localizations-ko.v1.json', (canonical) => {
    canonical.records.find((row) => row.jobId === 368).nameKo = '테스트 변경';
  });
  const independentRelationResult = run('tools/validate-hero-sp-job-relation-evidence.mjs');
  if (independentRelationResult.status !== 0) throw new Error('relation validation must not depend on Korean localization values');
  await restore();

  process.stdout.write('Job relation validator cases: PASS (existing Hero relation regressions; SP identity/connection/Job ID, duplicates, swapped relation, locator; localization independence)\n');
} finally {
  await rm(temp, { recursive: true, force: true });
}
