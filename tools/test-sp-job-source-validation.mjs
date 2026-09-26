import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const source = process.cwd();
const temp = await mkdtemp(join(tmpdir(), 'sp-job-source-validation-'));
const repo = join(temp, 'repo');
await cp(source, repo, { recursive: true, filter: (path) => !path.split('/').includes('.git') });
const sourcePath = 'evidence/localization/source/sp-job-names-ko.v1.txt';
const manifestPath = 'evidence/localization/source/sp-job-names-ko.source-manifest.v1.json';
const validator = 'tools/validate-sp-job-source.mjs';
const full = (path) => join(repo, path);
function run() { return spawnSync(process.execPath, [validator], { cwd: repo, encoding: 'utf8' }); }
function expectFailure(label) {
  const result = run();
  if (result.status === 0) throw new Error(`${label}: expected validator failure`);
  return `${result.stdout}${result.stderr}`;
}
async function editSource(edit, updateHash = false) {
  const path = full(sourcePath);
  const original = await readFile(path);
  const manifestFile = full(manifestPath);
  const originalManifest = await readFile(manifestFile, 'utf8');
  const changed = edit(original.toString('utf8'));
  await writeFile(path, changed);
  if (updateHash) {
    const manifest = JSON.parse(originalManifest);
    manifest.sourceSha256 = createHash('sha256').update(await readFile(path)).digest('hex');
    await writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
  }
  return async () => {
    await writeFile(path, original);
    await writeFile(manifestFile, originalManifest);
  };
}
async function editManifest(edit) {
  const path = full(manifestPath);
  const original = await readFile(path, 'utf8');
  const value = JSON.parse(original);
  edit(value);
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
  return async () => writeFile(path, original);
}

const restores = [];
try {
  let restore = await editSource((text) => text.replace('128\t源初的君王\t태초의 군주', '128\t源初的君王\t변조된 이름'));
  restores.push(restore);
  if (!expectFailure('source byte mutation').includes('source SHA-256 mismatch')) throw new Error('source byte mutation did not fail on SHA-256');
  await restore(); restores.pop();

  restore = await editSource((text) => text.replace('262\t孤刃逆旅\t고독한 검객', '128\t源初的君王\t태초의 군주'), true);
  restores.push(restore);
  if (!expectFailure('duplicate source ID').includes('duplicate source ID 128')) throw new Error('duplicate ID was not diagnosed');
  await restore(); restores.pop();

  restore = await editSource((text) => text.replace('128\t源初的君王\t태초의 군주', '128\t源初的君王'), true);
  restores.push(restore);
  if (!expectFailure('malformed row').includes('exactly 3 columns')) throw new Error('malformed row was not diagnosed');
  await restore(); restores.pop();

  restore = await editManifest((manifest) => { manifest.canonical = true; });
  restores.push(restore);
  if (!expectFailure('canonical authority escalation').includes('canonical authority boundary')) throw new Error('canonical escalation was not diagnosed');
  await restore(); restores.pop();

  restore = await editManifest((manifest) => { manifest.idNamespaceStatus = 'confirmed'; });
  restores.push(restore);
  if (!expectFailure('namespace authority escalation').includes('namespace must remain unresolved')) throw new Error('namespace escalation was not diagnosed');
  await restore(); restores.pop();

  restore = await editSource((text) => text.replace('1220\t魔导圣兽\t한섭 미실장', '1220\t魔导圣兽\t마도 성수'), true);
  restores.push(restore);
  if (!expectFailure('status-only drift').includes('status-only rows differ')) throw new Error('status-only drift was not diagnosed');
  await restore(); restores.pop();

  const clean = run();
  if (clean.status !== 0) throw new Error(`clean preservation validation failed: ${clean.stdout}${clean.stderr}`);
  process.stdout.write('SP source preservation validator cases: PASS (source hash, duplicate ID, malformed row, authority boundaries, status-only drift)\n');
} finally {
  for (const restore of restores.reverse()) await restore().catch(() => {});
  await rm(temp, { recursive: true, force: true });
}
