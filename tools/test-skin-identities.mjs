import assert from 'node:assert/strict';
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';

const canonicalPath = 'canonical/skin-identities.v1.json';
const evidencePath = 'evidence/source/skin-identity-m01.v1.json';
const subsetPath = 'evidence/source/configdata/ConfigDataHeroSkinInfo.records-identity-m01.v1.json';
const validatorPath = 'tools/validate-skin-identities.mjs';
const originals = new Map(await Promise.all([canonicalPath, evidencePath, subsetPath].map(async path =>
  [path, await readFile(path, 'utf8')])));
const temp = await mkdtemp(join(tmpdir(), 'skin-identity-m01-'));
const write = async (path, value) => {
  await mkdir(dirname(join(temp, path)), { recursive: true });
  await writeFile(join(temp, path), value);
};
const json = async (path, value) => write(path, `${JSON.stringify(value, null, 2)}\n`);
const run = () => spawnSync(process.execPath, [validatorPath], { cwd: temp, encoding: 'utf8' });
const diagnostic = r => `${r.stdout}\n${r.stderr}`;
const cases = [
  ['missing identity', canonicalPath, x => x.records.pop(), /unapproved or missing ID/],
  ['extra identity', canonicalPath, x => x.records.push({ skinId: 301 }), /unapproved or missing ID/],
  ['duplicate identity', canonicalPath, x => { x.records[1].skinId = 102; }, /duplicate ID/],
  ['string identity', canonicalPath, x => { x.records[0].skinId = '102'; }, /integer ID/],
  ['wrong identity', canonicalPath, x => { x.records[0].skinId = 999; }, /unapproved or missing ID/],
  ['Hero relation leak', canonicalPath, x => { x.records[0].heroId = 1; }, /fields drift/],
  ['order leak', canonicalPath, x => { x.records[0].sourceOrder = 1; }, /fields drift/],
  ['localization leak', canonicalPath, x => { x.records[0].nameCn = '执事美酒'; }, /fields drift/],
  ['canonical fallback', canonicalPath, x => { x.fallback = 'legacy'; }, /fields drift/],
  ['wrong claim pointer', canonicalPath, x => { x.records[0].provenance = `${evidencePath}#records/skinId=103`; }, /claim provenance pointer/],
  ['wrong schema', canonicalPath, x => { x.schemaVersion = 2; }, /canonical schema/],
  ['unsupported claim C', evidencePath, x => { x.records[0].evidenceClass = 'C'; }, /A provenance required/],
  ['contradicted claim D', evidencePath, x => { x.records[0].evidenceClass = 'D'; }, /A provenance required/],
  ['missing evidence', evidencePath, x => x.records.pop(), /unapproved or missing ID/],
  ['duplicate evidence', evidencePath, x => { x.records[1].skinId = 102; }, /duplicate ID/],
  ['wrong source field', evidencePath, x => { x.records[0].sourceLocator = 'Name'; }, /source-native locator/],
  ['wrong snapshot', evidencePath, x => { x.source.commit = 'main'; }, /source snapshot anchor/],
  ['wrong raw blob', evidencePath, x => { x.source.blobSha1 = '0'.repeat(40); }, /source snapshot anchor/],
  ['missing interpretation', evidencePath, x => { delete x.semanticBasis; }, /source-native identity meaning/],
  ['generated-only support', evidencePath, x => { x.source.path = 'data/generated/skin-stage1-canonical.v1.json'; }, /source snapshot anchor/],
  ['historical anchor drift', evidencePath, x => { x.legacyComparison.artifacts[0].blobSha1 = '0'.repeat(40); }, /historical blob anchor/],
  ['lost transformation', evidencePath, x => { delete x.legacyComparison.transformationProvenance; }, /historical transformation provenance/],
  ['unresolved contradiction', evidencePath, x => { x.records[0].contradiction = 'AUTHORITATIVE_CONTRADICTION'; }, /unresolved contradiction/],
  ['reference name corruption', evidencePath, x => { x.records[0].sourceName = 'wrong'; }, /reference name differs/],
  ['source ID corruption', subsetPath, x => { x[0].ID = 999; }, /unapproved or missing ID/],
  ['source name corruption', subsetPath, x => { x[0].Name = 'wrong'; }, /source subset bytes drift/],
];
try {
  await mkdir(join(temp, 'tools'), { recursive: true });
  await cp(validatorPath, join(temp, validatorPath));
  const reset = async () => { for (const [path, content] of originals) await write(path, content); };
  await reset();
  assert.equal(run().status, 0, 'standalone owner must validate without Legacy, raw whole snapshot or other domains');
  for (const [label, path, mutate, error] of cases) {
    await reset();
    const value = JSON.parse(originals.get(path));
    mutate(value);
    await json(path, value);
    const result = run();
    assert.notEqual(result.status, 0, `${label} must fail`);
    assert.match(diagnostic(result), error, label);
  }
  await reset();
  const canonical = JSON.parse(originals.get(canonicalPath));
  const evidence = JSON.parse(originals.get(evidencePath));
  canonical.records[0].skinId = evidence.records[0].skinId = 999;
  await json(canonicalPath, canonical);
  await json(evidencePath, evidence);
  assert.match(diagnostic(run()), /unapproved or missing ID/, 'coordinated canonical/evidence injection must fail');
  await reset();
  canonical.records = JSON.parse(originals.get(canonicalPath)).records.reverse();
  await json(canonicalPath, canonical);
  assert.equal(run().status, 0, 'canonical array order must not acquire sourceOrder meaning');
  process.stdout.write(`Skin identity tests: PASS (standalone owner, ${cases.length + 1} failure controls, order independence)\n`);
} finally {
  await rm(temp, { recursive: true, force: true });
}
