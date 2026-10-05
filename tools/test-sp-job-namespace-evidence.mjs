import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const source = process.cwd();
const temp = await mkdtemp(join(tmpdir(), 'sp-job-namespace-evidence-'));
const repo = join(temp, 'repo');
await cp(source, repo, { recursive: true, filter: (path) => !path.split('/').includes('.git') });
const subsetPath = 'evidence/source/configdata/ConfigDataJobInfo.records-sp-job-localization.v1.json';
const manifestPath = 'evidence/source/configdata/ConfigDataJobInfo.records-sp-job-localization.source-manifest.v1.json';
const evidencePath = 'evidence/localization/sp-job-namespace.v1.json';
const canonicalPath = 'canonical/sp-job-identities.v1.json';
const validator = 'tools/validate-sp-job-namespace-evidence.mjs';
const full = (path) => join(repo, path);
const run = () => spawnSync(process.execPath, [validator], { cwd: repo, encoding: 'utf8' });
function expectFailure(label) {
  const result = run();
  if (result.status === 0) throw new Error(`${label}: expected validator failure`);
  return `${result.stdout}${result.stderr}`;
}
async function editSubset(edit) {
  const path = full(subsetPath);
  const manifestFile = full(manifestPath);
  const original = await readFile(path, 'utf8');
  const originalManifest = await readFile(manifestFile, 'utf8');
  const value = JSON.parse(original);
  edit(value);
  const changed = `${JSON.stringify(value, null, 2)}\n`;
  await writeFile(path, changed);
  const manifest = JSON.parse(originalManifest);
  manifest.recordsSha256 = createHash('sha256').update(changed).digest('hex');
  await writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
  return async () => { await writeFile(path, original); await writeFile(manifestFile, originalManifest); };
}
async function editEvidence(edit) {
  const path = full(evidencePath);
  const original = await readFile(path, 'utf8');
  const value = JSON.parse(original);
  edit(value);
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
  return async () => writeFile(path, original);
}
async function editCanonical(edit) {
  const path = full(canonicalPath);
  const original = await readFile(path, 'utf8');
  const value = JSON.parse(original);
  edit(value);
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
  return async () => writeFile(path, original);
}

const restores = [];
try {
  let restore = await editSubset((rows) => { rows.find((row) => row.ID === 128).ID = 129; });
  restores.push(restore);
  expectFailure('JobInfo ID mutation');
  await restore(); restores.pop();

  restore = await editSubset((rows) => { rows.find((row) => row.ID === 128).Name = '源初的君王改'; });
  restores.push(restore);
  expectFailure('JobInfo CN mutation');
  await restore(); restores.pop();

  restore = await editEvidence((value) => { value.records.find((row) => row.jobId === 128).spSourceLocator = 'wrong-source#전직ID=128'; });
  restores.push(restore);
  expectFailure('SP source locator mutation');
  await restore(); restores.pop();

  restore = await editSubset((rows) => { rows.splice(rows.findIndex((row) => row.ID === 128), 1); });
  restores.push(restore);
  expectFailure('missing target record');
  await restore(); restores.pop();

  restore = await editSubset((rows) => { rows.find((row) => row.ID === 262).ID = 128; });
  restores.push(restore);
  expectFailure('duplicate JobInfo.ID');
  await restore(); restores.pop();

  restore = await editEvidence((value) => { value.claims.officialKrName = 'confirmed'; });
  restores.push(restore);
  expectFailure('unsupported official KR claim');
  await restore(); restores.pop();

  restore = await editEvidence((value) => { value.releaseStatus = 'released'; });
  restores.push(restore);
  expectFailure('extra release claim field');
  await restore(); restores.pop();

  restore = await editCanonical((value) => { value.records = value.records.filter((row) => row.id !== 128); });
  restores.push(restore);
  expectFailure('canonical ID removal');
  await restore(); restores.pop();

  restore = await editCanonical((value) => { value.records.push({ ...value.records[0], id: 129 }); });
  restores.push(restore);
  expectFailure('canonical extra ID');
  await restore(); restores.pop();

  restore = await editCanonical((value) => { value.records.find((row) => row.id === 262).id = 128; });
  restores.push(restore);
  expectFailure('canonical duplicate ID');
  await restore(); restores.pop();

  restore = await editCanonical((value) => { value.records.find((row) => row.id === 128).relationSourceLocators.jobConnectionInfo = 'wrong#ID=405'; });
  restores.push(restore);
  expectFailure('canonical relation graph mismatch');
  await restore(); restores.pop();

  restore = await editCanonical((value) => { delete value.scope.claimBoundary; });
  restores.push(restore);
  expectFailure('canonical scope removal');
  await restore(); restores.pop();

  restore = await editCanonical((value) => { value.scope.claimBoundary = 'Complete global SP Job population.'; });
  restores.push(restore);
  expectFailure('global completeness claim');
  await restore(); restores.pop();

  restore = await editCanonical((value) => { value.records[0].nameKo = '한섭 미실장'; });
  restores.push(restore);
  expectFailure('localization field contamination');
  await restore(); restores.pop();

  restore = await editCanonical((value) => { value.records[0].releaseStatus = 'unreleased'; });
  restores.push(restore);
  expectFailure('release field contamination');
  await restore(); restores.pop();

  const clean = run();
  if (clean.status !== 0) throw new Error(`clean namespace evidence validation failed: ${clean.stdout}${clean.stderr}`);
  const second = run();
  if (second.status !== 0 || second.stdout !== clean.stdout) throw new Error('namespace evidence validation is not repeatable');
  process.stdout.write('SP Job namespace evidence cases: PASS (ID, CN, locators, missing/duplicate rows, unsupported claims, repeatability)\n');
} finally {
  for (const restore of restores.reverse()) await restore().catch(() => {});
  await rm(temp, { recursive: true, force: true });
}
