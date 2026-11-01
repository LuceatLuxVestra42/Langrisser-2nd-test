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

const reject = (name, mutate) => {
  const data = structuredClone(baseline);
  mutate(data);
  assert.throws(() => validateSkin3701(data), undefined, name);
};

reject('rejects wrong SkinID', x => { x.identity.records[0].skinId = 3702; });
reject('rejects wrong HeroID in canonical relation', x => { x.relation.records[0].heroId = 36; });
reject('rejects wrong HeroID in relation evidence', x => { x.relationEvidence.records[0].heroId = 36; });
reject('rejects wrong Source Order in canonical', x => { x.order.records[0].sourceOrder = 2; });
reject('rejects wrong Source Order position evidence', x => { x.orderEvidence.records[0].zeroBasedPosition = 1; });
reject('rejects wrong pinned Snapshot', x => { x.identityEvidence.source.snapshotCommit = '0'.repeat(40); });
reject('rejects wrong evidence Source pointer', x => { x.identity.records[0].provenance = 'evidence/source/wrong.json#records/skinId=3701'; });
reject('rejects missing Evidence record', x => { x.identityEvidence.records = []; });
reject('rejects duplicate Admission Registry registration', x => {
  x.registry.admissions.push(structuredClone(x.registry.admissions.find(row => row.skinId === 3701)));
});
reject('rejects missing Admission Registry registration', x => {
  x.registry.admissions = x.registry.admissions.filter(row => row.skinId !== 3701);
});
reject('rejects wrong direct Skin source field', x => { x.identityEvidence.records[0].sourceRecord.ID = 3702; });
reject('rejects failed Hero membership cross-check', x => { x.relationEvidence.records[0].membership.membershipConfirmed = false; });

process.stdout.write('Skin 3701 Admission negative tests: PASS (12 cases)\\n');
