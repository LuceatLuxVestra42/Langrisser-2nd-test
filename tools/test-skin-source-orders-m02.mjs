import assert from 'node:assert/strict';
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';

const canonicalPath = 'canonical/skin-source-orders-m02.v1.json';
const evidencePath = 'evidence/source/skin-source-orders-m02.v1.json';
const skinIdentityPath = 'canonical/skin-identities.v1.json';
const projectionPath = 'evidence/source/configdata/skin-relation-order-records-m02.v1.json';
const validatorPath = 'tools/validate-skin-source-orders-m02.mjs';
const paths = [canonicalPath, evidencePath, skinIdentityPath, projectionPath];
const original = new Map(await Promise.all(paths.map(async path => [path, await readFile(path, 'utf8')])));
const temp = await mkdtemp(join(tmpdir(), 'm02-skin-source-order-'));
const put = async (path, data) => { await mkdir(dirname(join(temp, path)), { recursive: true }); await writeFile(join(temp, path), data); };
const putJson = (path, value) => put(path, `${JSON.stringify(value, null, 2)}\n`);
const reset = async () => { for (const [path, content] of original) await put(path, content); };
const run = () => spawnSync(process.execPath, [validatorPath], { cwd: temp, encoding: 'utf8' });
const diag = result => `${result.stdout}\n${result.stderr}`;
const cases = [
  ['missing order claim', canonicalPath, x => x.records.pop(), /missing or additional Skin IDs/],
  ['extra order claim', canonicalPath, x => x.records.push({ skinId: 301, sourceOrder: 5, provenance: 'wrong' }), /missing or additional Skin IDs/],
  ['duplicate Skin ID', canonicalPath, x => { x.records[1].skinId = 102; }, /duplicate values/],
  ['wrong Source Order', canonicalPath, x => { x.records[0].sourceOrder = 4; }, /canonical\/evidence source position mismatch/],
  ['duplicate Source Order', evidencePath, x => { x.records[1].sourceOrder = x.records[0].sourceOrder; }, /one-based Source Order mismatch|duplicate source position\/order/],
  ['wrong array offset', evidencePath, x => { x.records[0].arrayIndexZeroBased = 1; }, /array position mismatch/],
  ['wrong source locator', evidencePath, x => { x.records[0].sourceLocator = 'sorted SkinID position'; }, /source locator mismatch/],
  ['wrong snapshot', evidencePath, x => { x.source.commit = 'main'; }, /pinned source\/projection anchor/],
  ['wrong source blob', evidencePath, x => { x.source.files[0].blobSha1 = '0'.repeat(40); }, /full source file anchors/],
  ['unsupported C order', evidencePath, x => { x.records[0].evidenceClass = 'C'; }, /unsupported order claim/],
  ['contradicted D order', evidencePath, x => { x.records[0].evidenceClass = 'D'; }, /unsupported order claim/],
  ['unscoped completeness assertion', evidencePath, x => { x.completeHeroSkinList = true; }, /fields drift/],
  ['UI order policy leakage', canonicalPath, x => { x.sortPolicy = 'sourceOrder'; }, /fields drift/],
  ['Hero relation leaked into Order canonical', canonicalPath, x => { x.records[0].heroId = 1; }, /fields drift/],
  ['source array mutation', projectionPath, x => { x.heroInfoRecords[0].Skins_ID.reverse(); }, /source projection digest mismatch/],
  ['simultaneous order and evidence tamper', 'BOTH', (canonical, evidence) => { canonical.records[0].sourceOrder = 4; evidence.records[0].sourceOrder = 4; }, /canonical\/evidence source position mismatch|array position mismatch|one-based Source Order mismatch/],
];
try {
  await mkdir(join(temp, 'tools'), { recursive: true });
  await cp(validatorPath, join(temp, validatorPath));
  await reset();
  assert.equal(run().status, 0, 'valid source array position claims must pass');
  for (const [label, path, mutate, expected] of cases) {
    await reset();
    if (path === 'BOTH') {
      const canonical = JSON.parse(original.get(canonicalPath));
      const evidence = JSON.parse(original.get(evidencePath));
      mutate(canonical, evidence);
      await putJson(canonicalPath, canonical);
      await putJson(evidencePath, evidence);
    } else {
      const value = JSON.parse(original.get(path));
      mutate(value);
      await putJson(path, value);
    }
    const result = run();
    assert.notEqual(result.status, 0, `${label} must fail`);
    assert.match(diag(result), expected, label);
  }
  await reset();
  const reordered = JSON.parse(original.get(canonicalPath));
  reordered.records.reverse();
  await putJson(canonicalPath, reordered);
  assert.equal(run().status, 0, 'Canonical storage array position must not replace the recorded Source position');
  process.stdout.write(`M02 Skin Source Order tests: PASS (${cases.length} failure controls, coordinated tamper and storage-order independence)\n`);
} finally { await rm(temp, { recursive: true, force: true }); }
