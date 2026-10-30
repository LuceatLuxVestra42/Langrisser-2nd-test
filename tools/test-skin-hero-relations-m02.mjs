import assert from 'node:assert/strict';
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';

const canonicalPath = 'canonical/skin-hero-relations-m02.v1.json';
const evidencePath = 'evidence/source/skin-hero-relations-m02.v1.json';
const skinIdentityPath = 'canonical/skin-identities.v1.json';
const heroIdentityPath = 'canonical/hero-identities.v1.json';
const projectionPath = 'evidence/source/configdata/skin-relation-order-records-m02.v1.json';
const validatorPath = 'tools/validate-skin-hero-relations-m02.mjs';
const paths = [canonicalPath, evidencePath, skinIdentityPath, heroIdentityPath, projectionPath];
const original = new Map(await Promise.all(paths.map(async path => [path, await readFile(path, 'utf8')])));
const temp = await mkdtemp(join(tmpdir(), 'm02-skin-hero-relation-'));
const put = async (path, data) => { await mkdir(dirname(join(temp, path)), { recursive: true }); await writeFile(join(temp, path), data); };
const putJson = (path, value) => put(path, `${JSON.stringify(value, null, 2)}\n`);
const reset = async () => { for (const [path, content] of original) await put(path, content); };
const run = () => spawnSync(process.execPath, [validatorPath], { cwd: temp, encoding: 'utf8' });
const diag = result => `${result.stdout}\n${result.stderr}`;
const cases = [
  ['missing relation', canonicalPath, x => x.records.pop(), /missing or additional IDs/],
  ['extra relation', canonicalPath, x => x.records.push({ skinId: 301, heroId: 1, provenance: 'wrong' }), /missing or additional IDs/],
  ['duplicate relation endpoint', canonicalPath, x => { x.records[1].skinId = 102; }, /duplicate IDs/],
  ['wrong Skin ID', canonicalPath, x => { x.records[0].skinId = 999; }, /missing or additional IDs/],
  ['wrong Hero FK', canonicalPath, x => { x.records[0].heroId = 3; }, /invalid Hero FK/],
  ['noninteger Hero FK', canonicalPath, x => { x.records[0].heroId = '1'; }, /invalid Hero FK/],
  ['Source Order leaked into relation canonical', canonicalPath, x => { x.records[0].sourceOrder = 1; }, /fields drift/],
  ['missing M01 Skin identity endpoint', skinIdentityPath, x => x.records.pop(), /M01 Skin Identity regression/],
  ['missing Hero endpoint identity', heroIdentityPath, x => { x.records = x.records.filter(row => row.heroId !== 1); }, /Hero endpoint identity missing/],
  ['C claim', evidencePath, x => { x.records[0].evidenceClass = 'C'; }, /A provenance required/],
  ['D claim', evidencePath, x => { x.records[0].evidenceClass = 'D'; }, /A provenance required/],
  ['wrong membership locator', evidencePath, x => { x.records[0].membershipLocator = 'name-based join'; }, /source locator mismatch/],
  ['wrong owner locator', evidencePath, x => { x.records[0].ownershipLocator = 'SpecifiedHero guessed'; }, /source locator mismatch/],
  ['wrong Source commit', evidencePath, x => { x.source.commit = 'main'; }, /pinned source\/projection anchor/],
  ['wrong full-source hash', evidencePath, x => { x.source.files[0].blobSha1 = '0'.repeat(40); }, /full source file anchors/],
  ['projection digest drift', projectionPath, x => { x.heroSkinInfoRecords[0].SpecifiedHero = 3; }, /source projection digest mismatch/],
  ['wrong Membership content', projectionPath, x => { x.heroInfoRecords[0].Skins_ID = [102, 103, 105, 104]; }, /source projection digest mismatch/],
  ['duplicate Membership source ID', projectionPath, x => { x.heroInfoRecords[0].Skins_ID = [102, 103, 104, 104]; }, /source projection digest mismatch/],
  ['simultaneous canonical and evidence owner tamper', 'BOTH', (canonical, evidence) => { canonical.records[0].heroId = 3; evidence.records[0].heroId = 3; }, /invalid Hero FK|canonical\/evidence\/source mismatch|source Membership missing\/duplicate/],
];
try {
  await mkdir(join(temp, 'tools'), { recursive: true });
  await cp(validatorPath, join(temp, validatorPath));
  await reset();
  assert.equal(run().status, 0, 'valid independent relation slice must pass');
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
  assert.equal(run().status, 0, 'canonical storage order must not define Relation semantics');
  process.stdout.write(`M02 Skin→Hero relation tests: PASS (${cases.length} failure controls, coordinated tamper and storage-order independence)\n`);
} finally { await rm(temp, { recursive: true, force: true }); }
