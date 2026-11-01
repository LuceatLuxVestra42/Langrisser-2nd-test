import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ID = 3701;
const HERO = 37;
const ORDER = 1;
const SOURCE_COMMIT = '6475e63ee23d18adf733756c26a14fa9e3ed662c';
const LEGACY_COMMIT = '57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff';

export function validateSkin3701(data) {
  const { identity, relation, order, identityEvidence, relationEvidence, orderEvidence, registry } = data;
  assert.deepEqual(identity.records, [{ skinId: ID, provenance: 'evidence/source/skin-identity-3701.v1.json#records/skinId=3701' }]);
  assert.deepEqual(relation.records, [{ skinId: ID, heroId: HERO, provenance: 'evidence/source/skin-hero-relation-3701.v1.json#records/skinId=3701' }]);
  assert.deepEqual(order.records, [{ skinId: ID, sourceOrder: ORDER, provenance: 'evidence/source/skin-source-order-3701.v1.json#records/skinId=3701' }]);
  assert.equal(identityEvidence.claimType, 'skin-identity');
  assert.equal(identityEvidence.source.repositoryMainCommit, LEGACY_COMMIT);
  assert.equal(identityEvidence.source.snapshotCommit, SOURCE_COMMIT);
  assert.equal(identityEvidence.source.path, 'data/configdata/ConfigDataHeroSkinInfo.json');
  assert.equal(identityEvidence.source.field, 'ID');
  assert.equal(identityEvidence.records[0].sourceRecord.ID, ID);
  assert.equal(relationEvidence.claimType, 'skin-to-hero-ownership');
  assert.equal(relationEvidence.source.snapshotCommit, SOURCE_COMMIT);
  assert.equal(relationEvidence.records[0].skinId, ID);
  assert.equal(relationEvidence.records[0].heroId, HERO);
  assert.equal(relationEvidence.records[0].ownershipCrossCheck.value, HERO);
  assert.equal(orderEvidence.claimType, 'skin-source-order');
  assert.equal(orderEvidence.source.snapshotCommit, SOURCE_COMMIT);
  assert.equal(orderEvidence.records[0].skinId, ID);
  assert.equal(orderEvidence.records[0].heroId, HERO);
  assert.equal(orderEvidence.records[0].zeroBasedPosition + 1, ORDER);
  assert.equal(orderEvidence.records[0].sourceOrder, ORDER);
  const entry = registry.admissions.find((row) => row.skinId === ID);
  assert.ok(entry, '3701 Admission Registry entry missing');
  assert.equal(entry.status, 'APPROVED');
  assert.equal(entry.validator, 'tools/validate-skin-admission-3701.mjs');
  assert.deepEqual(entry.evidence, [
    'evidence/source/skin-identity-3701.v1.json',
    'evidence/source/skin-hero-relation-3701.v1.json',
    'evidence/source/skin-source-order-3701.v1.json',
  ]);
  return { status: 'PASS', skinId: ID, heroId: HERO, sourceOrder: ORDER, independentOwnerValidator: true };
}

export async function validateSkin3701FromRepository(root = process.cwd()) {
  const read = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
  return validateSkin3701({
    identity: await read('canonical/skin-identities-3701.v1.json'),
    relation: await read('canonical/skin-hero-relations-3701.v1.json'),
    order: await read('canonical/skin-source-orders-3701.v1.json'),
    identityEvidence: await read('evidence/source/skin-identity-3701.v1.json'),
    relationEvidence: await read('evidence/source/skin-hero-relation-3701.v1.json'),
    orderEvidence: await read('evidence/source/skin-source-order-3701.v1.json'),
    registry: await read('canonical/skin-admission-registry-m05-g.v1.json'),
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.stdout.write(`Skin 3701 Semantic Admission: PASS ${JSON.stringify(await validateSkin3701FromRepository())}\\n`);
}
