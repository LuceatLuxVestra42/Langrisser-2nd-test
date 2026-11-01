import assert from 'node:assert/strict';
import { validateSkin3701 } from './validate-skin-admission-3701.mjs';

const readFixture = async () => {
  const fs = await import('node:fs/promises');
  const root = new URL('../', import.meta.url);
  const read = async (p) => JSON.parse(await fs.readFile(new URL(p, root), 'utf8'));
  return {
    identity: await read('canonical/skin-identities-3701.v1.json'),
    relation: await read('canonical/skin-hero-relations-3701.v1.json'),
    order: await read('canonical/skin-source-orders-3701.v1.json'),
    identityEvidence: await read('evidence/source/skin-identity-3701.v1.json'),
    relationEvidence: await read('evidence/source/skin-hero-relation-3701.v1.json'),
    orderEvidence: await read('evidence/source/skin-source-order-3701.v1.json'),
    registry: await read('canonical/skin-admission-registry-m05-g.v1.json'),
  };
};
const baseline = await readFixture();
assert.equal(validateSkin3701(baseline).status, 'PASS');
const reject = (mutate, pattern) => {
  const data = structuredClone(baseline); mutate(data);
  assert.throws(() => validateSkin3701(data), pattern);
};
reject(x => { x.identity.records[0].skinId = 3702; }, /deepStrictEqual/);
reject(x => { x.relation.records[0].heroId = 36; }, /deepStrictEqual/);
reject(x => { x.order.records[0].sourceOrder = 2; }, /deepStrictEqual/);
reject(x => { x.identityEvidence.source.snapshotCommit = '0'.repeat(40); }, /strictEqual/);
reject(x => { x.identity.records[0].provenance = 'wrong'; }, /deepStrictEqual/);
reject(x => { x.identityEvidence.records = []; }, /Cannot read|strictEqual/);
reject(x => { x.registry.admissions.push(x.registry.admissions.find(row => row.skinId === 3701)); }, /strictEqual|AssertionError/);
const unregistered = structuredClone(baseline);
unregistered.registry.admissions = unregistered.registry.admissions.filter(row => row.skinId !== 3701);
assert.throws(() => validateSkin3701(unregistered), /3701 Admission Registry entry missing/);
process.stdout.write('Skin 3701 Admission negative tests: PASS (8 cases)\\n');
