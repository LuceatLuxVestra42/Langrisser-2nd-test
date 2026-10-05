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
  if (!expectFailure('JobInfo ID mutation').includes('subset IDs must exactly match')) throw new Error('ID mutation was not rejected by target-set validation');
  await restore(); restores.pop();

  restore = await editSubset((rows) => { rows.find((row) => row.ID === 128).Name = '源初的君王改'; });
  restores.push(restore);
  if (!expectFailure('JobInfo CN mutation').includes('CN consistency mismatch for 128')) throw new Error('CN mutation was not rejected');
  await restore(); restores.pop();

  restore = await editEvidence((value) => { value.records.find((row) => row.jobId === 128).spSourceLocator = 'wrong-source#전직ID=128'; });
  restores.push(restore);
  if (!expectFailure('SP source locator mutation').includes('evidence rows')) throw new Error('source locator mismatch was not rejected');
  await restore(); restores.pop();

  restore = await editSubset((rows) => { rows.splice(rows.findIndex((row) => row.ID === 128), 1); });
  restores.push(restore);
  if (!expectFailure('missing target record').includes('exactly 25')) throw new Error('missing target record was not rejected');
  await restore(); restores.pop();

  restore = await editSubset((rows) => { rows.find((row) => row.ID === 262).ID = 128; });
  restores.push(restore);
  if (!expectFailure('duplicate JobInfo.ID').includes('duplicate JobInfo.ID 128')) throw new Error('duplicate ID was not rejected');
  await restore(); restores.pop();

  restore = await editEvidence((value) => { value.claims.officialKrName = 'confirmed'; });
  restores.push(restore);
  if (!expectFailure('unsupported official KR claim').includes('unverified localization/release boundary')) throw new Error('unsupported official KR claim was not rejected');
  await restore(); restores.pop();

  restore = await editEvidence((value) => { value.releaseStatus = 'released'; });
  restores.push(restore);
  if (!expectFailure('extra release claim field').includes('unexpected or missing fields')) throw new Error('extra release claim was not rejected');
  await restore(); restores.pop();

  restore = await editCanonical((value) => { value.records = value.records.filter((row) => row.id !== 128); });
  restores.push(restore);
  if (!expectFailure('canonical ID removal').includes('25 after exact parity')) throw new Error('canonical ID removal was not rejected');
  await restore(); restores.pop();

  restore = await editCanonical((value) => { value.records.push({ ...value.records[0], id: 129 }); });
  restores.push(restore);
  if (!expectFailure('canonical extra ID').includes('canonical IDs, relation derivation')) throw new Error('canonical extra ID was not rejected');
  await restore(); restores.pop();

  restore = await editCanonical((value) => { value.records.find((row) => row.id === 262).id = 128; });
  restores.push(restore);
  if (!expectFailure('canonical duplicate ID').includes('canonical IDs, relation derivation')) throw new Error('canonical duplicate ID was not rejected');
  await restore(); restores.pop();

  restore = await editCanonical((value) => { value.records.find((row) => row.id === 128).relationSourceLocators.jobConnectionInfo = 'wrong#ID=405'; });
  restores.push(restore);
  if (!expectFailure('canonical relation graph mismatch').includes('canonical IDs, relation derivation')) throw new Error('relation graph mismatch was not rejected');
  await restore(); restores.pop();

  restore = await editCanonical((value) => { delete value.scope.claimBoundary; });
  restores.push(restore);
  if (!expectFailure('canonical scope removal').includes('scope has unexpected or missing fields')) throw new Error('canonical scope removal was not rejected');
  await restore(); restores.pop();

  restore = await editCanonical((value) => { value.scope.claimBoundary = 'Complete global SP Job population.'; });
  restores.push(restore);
  if (!expectFailure('global completeness claim').includes('global/current completeness boundary')) throw new Error('global completeness claim was not rejected');
  await restore(); restores.pop();

  restore = await editCanonical((value) => { value.records[0].nameKo = '한섭 미실장'; });
  restores.push(restore);
  if (!expectFailure('localization field contamination').includes('canonical IDs, relation derivation')) throw new Error('localization field was not rejected');
  await restore(); restores.pop();

  restore = await editCanonical((value) => { value.records[0].releaseStatus = 'unreleased'; });
  restores.push(restore);
  if (!expectFailure('release field contamination').includes('canonical IDs, relation derivation')) throw new Error('release field was not rejected');
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
