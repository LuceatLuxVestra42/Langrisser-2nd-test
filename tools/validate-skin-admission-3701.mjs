import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ID = 3701;
const HERO = 37;
const ORDER = 1;
const SOURCE_COMMIT = '6475e63ee23d18adf733756c26a14fa9e3ed662c';
const LEGACY_COMMIT = '57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff';
const EVIDENCE = {
  identity: 'evidence/source/skin-identity-3701.v1.json',
  relation: 'evidence/source/skin-hero-relation-3701.v1.json',
  order: 'evidence/source/skin-source-order-3701.v1.json',
};

export function validateSkin3701(data) {
  const { identity, relation, order, identityEvidence, relationEvidence, orderEvidence, registry } = data;
  assert.equal(identity.schemaVersion, 1);
  assert.deepEqual(identity.records, [{ skinId: ID, provenance: `${EVIDENCE.identity}#records/skinId=${ID}` }]);
  assert.equal(relation.schemaVersion, 1);
  assert.deepEqual(relation.records, [{ skinId: ID, heroId: HERO, provenance: `${EVIDENCE.relation}#records/skinId=${ID}` }]);
  assert.equal(order.schemaVersion, 1);
  assert.deepEqual(order.records, [{ skinId: ID, sourceOrder: ORDER, provenance: `${EVIDENCE.order}#records/skinId=${ID}` }]);

  const checkSource = (evidence, path, fields) => {
    assert.equal(evidence.schemaVersion, 1);
    assert.equal(evidence.source.repository, 'LuceatLuxVestra42/langrisser-future-guide');
    assert.equal(evidence.source.repositoryMainCommit, LEGACY_COMMIT);
    assert.equal(evidence.source.snapshotCommit, SOURCE_COMMIT);
    for (const [key, value] of Object.entries(fields)) assert.equal(evidence.source[key], value, `source.${key}`);
    assert.ok(path);
  };

  assert.equal(identityEvidence.claimType, 'skin-identity');
  assert.equal(identityEvidence.evidenceClass, 'A');
  checkSource(identityEvidence, EVIDENCE.identity, {
    path: 'data/configdata/ConfigDataHeroSkinInfo.json',
    field: 'ID',
    recordLocator: 'ID=3701',
  });
  assert.equal(identityEvidence.source.matchingRecordCount, 1);
  assert.deepEqual(identityEvidence.records, [{ skinId: ID, sourceRecord: { ID } }]);

  assert.equal(relationEvidence.claimType, 'skin-to-hero-ownership');
  assert.equal(relationEvidence.evidenceClass, 'A');
  assert.equal(relationEvidence.source.heroInfo.path, 'data/configdata/ConfigDataHeroInfo.json');
  assert.equal(relationEvidence.source.heroInfo.recordLocator, 'ID=37');
  assert.equal(relationEvidence.source.heroInfo.field, 'Skins_ID[]');
  assert.equal(relationEvidence.source.heroSkinInfo.path, 'data/configdata/ConfigDataHeroSkinInfo.json');
  assert.equal(relationEvidence.source.heroSkinInfo.recordLocator, 'ID=3701');
  assert.equal(relationEvidence.source.heroSkinInfo.field, 'SpecifiedHero');
  assert.deepEqual(relationEvidence.records, [{
    skinId: ID,
    heroId: HERO,
    membership: { sourceField: 'ConfigDataHeroInfo.Skins_ID[]', heroRecordLocator: 'ID=37', membershipConfirmed: true },
    ownershipCrossCheck: { sourceField: 'ConfigDataHeroSkinInfo.SpecifiedHero', skinRecordLocator: 'ID=3701', value: HERO, directSourceRecordVerified: true },
  }]);

  assert.equal(orderEvidence.claimType, 'skin-source-order');
  assert.equal(orderEvidence.evidenceClass, 'B');
  assert.equal(orderEvidence.source.path, 'data/configdata/ConfigDataHeroInfo.json');
  assert.equal(orderEvidence.source.sourceField, 'ConfigDataHeroInfo.Skins_ID[]');
  assert.equal(orderEvidence.source.heroRecordLocator, 'ID=37');
  assert.equal(orderEvidence.source.zeroBasedToOneBasedRule, 'sourceOrder = zeroBasedPosition + 1');
  assert.deepEqual(orderEvidence.records, [{
    skinId: ID, heroId: HERO, zeroBasedPosition: 0, sourceOrder: ORDER,
    legacyCanonical: 'data/generated/skin-stage1-canonical.v1.json#skinId=3701',
  }]);
  assert.ok(orderEvidence.legacyValidationChain.some((row) => row.path === 'data/validation/hero-page-stage5-5-5-final.v1.json' && row.result.startsWith('PASS;')));
  assert.ok(orderEvidence.legacyValidationChain.some((row) => row.path === 'data/validation/skin-stage1-2-parity.v1.json' && row.result.startsWith('PASS;')));

  assert.equal(registry.schemaVersion, 1);
  const entries = registry.admissions.filter((row) => row.skinId === ID);
  assert.equal(entries.length, 1, 'SkinID 3701 must have exactly one Admission Registry entry');
  const entry = entries[0];
  assert.equal(entry.status, 'APPROVED');
  assert.equal(entry.validator, 'tools/validate-skin-admission-3701.mjs');
  assert.deepEqual(entry.identityCanonical, 'canonical/skin-identities-3701.v1.json');
  assert.deepEqual(entry.relationCanonical, 'canonical/skin-hero-relations-3701.v1.json');
  assert.deepEqual(entry.orderCanonical, 'canonical/skin-source-orders-3701.v1.json');
  assert.deepEqual(entry.evidence, [EVIDENCE.identity, EVIDENCE.relation, EVIDENCE.order]);
  return { status: 'PASS', skinId: ID, heroId: HERO, sourceOrder: ORDER, independentOwnerValidator: true };
}

export async function validateSkin3701FromRepository(root = process.cwd()) {
  const read = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
  return validateSkin3701({
    identity: await read('canonical/skin-identities-3701.v1.json'),
    relation: await read('canonical/skin-hero-relations-3701.v1.json'),
    order: await read('canonical/skin-source-orders-3701.v1.json'),
    identityEvidence: await read(EVIDENCE.identity),
    relationEvidence: await read(EVIDENCE.relation),
    orderEvidence: await read(EVIDENCE.order),
    registry: await read('canonical/skin-admission-registry-m05-g.v1.json'),
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.stdout.write(`Skin 3701 Semantic Admission: PASS ${JSON.stringify(await validateSkin3701FromRepository())}\\n`);
}
