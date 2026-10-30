import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const SOURCE_COMMIT = '6475e63ee23d18adf733756c26a14fa9e3ed662c';
const LEGACY_COMMIT = '57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff';
const IDS = [602, 603, 604, 605, 606];
const CLAIMS = new Map([[602, { sourceOrder: 2, zeroBasedPosition: 1 }], [603, { sourceOrder: 3, zeroBasedPosition: 2 }],
  [604, { sourceOrder: 4, zeroBasedPosition: 3 }], [605, { sourceOrder: 5, zeroBasedPosition: 4 }],
  [606, { sourceOrder: 6, zeroBasedPosition: 5 }]]);
const IDENTITY_SCOPE = 'M06-B independent historical-snapshot admissions: source-native Skin Identity claims for SkinIDs 602-606 only; no localization, release state, or completeness is implied.';
const RELATION_SCOPE = 'M06-B independent historical-snapshot ownership claims for SkinIDs 602-606 -> HeroID 6 only.';
const ORDER_SCOPE = 'M06-B one-based Source Order claims for SkinIDs 602-606 in ConfigDataHeroInfo.ID=6 Skins_ID[] at the pinned historical snapshot only; not release or UI order.';
const expect = (condition, message) => assert.ok(condition, `M06 Semantic Admission: ${message}`);
const exact = (actual, expected, message) => assert.deepEqual(actual, expected, `M06 Semantic Admission: ${message}`);

export function assertM06PerHeroOrderUniqueness(rows) {
  const seen = new Set();
  for (const row of rows) {
    expect(Number.isSafeInteger(row.heroId) && Number.isSafeInteger(row.sourceOrder), 'invalid HeroID or Source Order');
    const key = `${row.heroId}:${row.sourceOrder}`;
    expect(!seen.has(key), `duplicate Source Order within Hero ${row.heroId}`);
    seen.add(key);
  }
  return true;
}

export function validateM06SemanticData(input) {
  const { identities, relations, orders, identityEvidence, relationEvidence, orderEvidence,
    admissionRegistry, heroIdentities, frozenIdentity, frozenRelations, frozenOrders,
    m05Identity, m05Relation, m05Order, m05Internal, composed, publicConsumer, publicAssets,
    assetRegistry, publication } = input;

  exact(identities, { schemaVersion: 1, scope: IDENTITY_SCOPE, records: IDS.map((skinId) => ({
    skinId, provenance: `evidence/source/skin-identity-m06.v1.json#records/skinId=${skinId}`,
  })) }, 'M06 Identity Canonical or scope differs');
  exact(relations, { schemaVersion: 1, scope: RELATION_SCOPE, records: IDS.map((skinId) => ({
    skinId, heroId: 6, provenance: `evidence/source/skin-hero-relation-m06.v1.json#records/skinId=${skinId}`,
  })) }, 'M06 Ownership Canonical or scope differs');
  exact(orders, { schemaVersion: 1, scope: ORDER_SCOPE, records: IDS.map((skinId) => ({
    skinId, sourceOrder: CLAIMS.get(skinId).sourceOrder,
    provenance: `evidence/source/skin-source-order-m06.v1.json#records/skinId=${skinId}`,
  })) }, 'M06 Source Order Canonical or scope differs');

  expect(identityEvidence.claimType === 'skin-identity' && identityEvidence.evidenceClass === 'A', 'Identity needs direct Evidence A');
  expect(identityEvidence.source.repository === 'LuceatLuxVestra42/langrisser-future-guide'
    && identityEvidence.source.repositoryMainCommit === LEGACY_COMMIT
    && identityEvidence.source.snapshotCommit === SOURCE_COMMIT
    && identityEvidence.source.path === 'data/configdata/ConfigDataHeroSkinInfo.json'
    && identityEvidence.source.gitBlobSha1 === 'f6bd2611114ae8ae8aec24d8f304b94f2c314dc9'
    && identityEvidence.source.sizeBytes === 563343
    && identityEvidence.source.sha256 === '6fe685622a57a6546f4cce73ff788057605fca215eba6327eff66c3b5d4847c7', 'Identity Source pin is invalid');
  exact(identityEvidence.records.map((row) => ({ skinId: row.skinId, id: row.sourceRecord?.ID })),
    IDS.map((skinId) => ({ skinId, id: skinId })), 'Identity records do not match direct source ID fields');

  expect(relationEvidence.claimType === 'skin-to-hero-ownership' && relationEvidence.evidenceClass === 'A', 'Ownership needs direct Evidence A');
  expect(relationEvidence.source.repositoryMainCommit === LEGACY_COMMIT && relationEvidence.source.snapshotCommit === SOURCE_COMMIT,
    'Ownership Source snapshot is not pinned');
  exact(relationEvidence.records.map((row) => ({
    skinId: row.skinId, heroId: row.heroId, sourceField: row.membership?.sourceField,
    heroRecordLocator: row.membership?.heroRecordLocator, position: row.membership?.zeroBasedPosition,
    membership: row.membership?.membershipConfirmed, crossCheckField: row.ownershipCrossCheck?.sourceField,
    skinRecordLocator: row.ownershipCrossCheck?.skinRecordLocator, specifiedHero: row.ownershipCrossCheck?.value,
    direct: row.ownershipCrossCheck?.directSourceRecordVerified,
  })), IDS.map((skinId) => ({ skinId, heroId: 6, sourceField: 'ConfigDataHeroInfo.Skins_ID[]',
    heroRecordLocator: 'ID=6', position: CLAIMS.get(skinId).zeroBasedPosition, membership: true,
    crossCheckField: 'ConfigDataHeroSkinInfo.SpecifiedHero', skinRecordLocator: `ID=${skinId}`,
    specifiedHero: 6, direct: true })), 'Ownership evidence does not match the exact membership and SpecifiedHero fields');

  expect(orderEvidence.claimType === 'skin-source-order' && orderEvidence.evidenceClass === 'B', 'Source Order needs its own inherited/validated Evidence B');
  expect(orderEvidence.source.repositoryMainCommit === LEGACY_COMMIT && orderEvidence.source.snapshotCommit === SOURCE_COMMIT
    && orderEvidence.source.sourceField === 'ConfigDataHeroInfo.Skins_ID[]'
    && orderEvidence.source.heroRecordLocator === 'ID=6'
    && orderEvidence.source.zeroBasedToOneBasedRule === 'sourceOrder = zeroBasedPosition + 1', 'Source Order source contract is invalid');
  exact(orderEvidence.records.map((row) => ({ skinId: row.skinId, heroId: row.heroId,
    zeroBasedPosition: row.zeroBasedPosition, sourceOrder: row.sourceOrder })),
  IDS.map((skinId) => ({ skinId, heroId: 6, ...CLAIMS.get(skinId) })), 'Source Order evidence differs from the pinned source array positions');
  expect(orderEvidence.legacyValidationChain.some((row) => row.path.endsWith('hero-page-stage5-5-2-source-trace.v1.json#fields/skins/ordering')
    && row.result.startsWith('SOURCE_ORDER_CONFIRMED')), 'Source Order interpretation lacks its owning source-trace result');
  expect(orderEvidence.legacyValidationChain.some((row) => row.path === 'data/validation/skin-stage2-3-final.v1.json'
    && row.result.startsWith('PASS')), 'Source Order lacks accepted bidirectional parity validation');

  const admissionRows = admissionRegistry.admissions.filter((row) => IDS.includes(row.skinId));
  exact(admissionRows.map(({ admissionId, status, skinId, identityCanonical, relationCanonical, orderCanonical, evidence, validator }) => ({
    admissionId, status, skinId, identityCanonical, relationCanonical, orderCanonical, evidence, validator,
  })), IDS.map((skinId) => ({ admissionId: `M06-SKIN-${skinId}`, status: 'APPROVED', skinId,
    identityCanonical: 'canonical/skin-identities-m06.v1.json', relationCanonical: 'canonical/skin-hero-relations-m06.v1.json',
    orderCanonical: 'canonical/skin-source-orders-m06.v1.json', evidence: [
      'evidence/source/skin-identity-m06.v1.json', 'evidence/source/skin-hero-relation-m06.v1.json',
      'evidence/source/skin-source-order-m06.v1.json'], validator: 'tools/validate-skin-admission-m06.mjs' })), 'Admission Registry entries are missing, duplicated, or have incorrect Owner references');
  expect(new Set(admissionRegistry.admissions.map((row) => row.admissionId)).size === admissionRegistry.admissions.length,
    'Admission registry has duplicate admission keys');

  const heroes = new Set(heroIdentities.records.map((row) => row.heroId));
  expect(heroes.has(6), 'Target HeroID 6 FK is missing');
  exact(frozenIdentity.records.map((row) => row.skinId), [102, 103, 104, 105], 'M01 Frozen population changed');
  exact(frozenRelations.records.map(({ skinId, heroId }) => [skinId, heroId]), [[102, 1], [103, 1], [104, 1], [105, 1]], 'M02 Frozen ownership changed');
  exact(frozenOrders.records.map(({ skinId, sourceOrder }) => [skinId, sourceOrder]), [[102, 1], [103, 2], [104, 3], [105, 4]], 'M02 Frozen Source Order changed');
  exact(m05Identity.records.map((row) => row.skinId), [601], 'M05-C identity scope changed');
  exact(m05Relation.records.map(({ skinId, heroId }) => [skinId, heroId]), [[601, 6]], 'M05-C ownership changed');
  exact(m05Order.records.map(({ skinId, sourceOrder }) => [skinId, sourceOrder]), [[601, 1]], 'M05-C Source Order changed');
  exact(m05Internal.skins, [{ skinId: 102, heroId: 1, sourceOrder: 1 }, { skinId: 103, heroId: 1, sourceOrder: 2 },
    { skinId: 104, heroId: 1, sourceOrder: 3 }, { skinId: 105, heroId: 1, sourceOrder: 4 },
    { skinId: 601, heroId: 6, sourceOrder: 1 }], 'M05-C internal five-record Consumer changed');

  const expectedInternal = [
    { skinId: 102, heroId: 1, sourceOrder: 1 }, { skinId: 103, heroId: 1, sourceOrder: 2 },
    { skinId: 104, heroId: 1, sourceOrder: 3 }, { skinId: 105, heroId: 1, sourceOrder: 4 },
    { skinId: 601, heroId: 6, sourceOrder: 1 },
    ...IDS.map((skinId) => ({ skinId, heroId: 6, sourceOrder: CLAIMS.get(skinId).sourceOrder })),
  ];
  assertM06PerHeroOrderUniqueness(expectedInternal);
  exact(composed.skins, expectedInternal, 'M05-G composed internal Consumer is not Frozen + approved Semantic admissions');
  expect(composed.skins.every((row) => heroes.has(row.heroId)), 'Composed Consumer contains an unresolved Hero FK');

  const baselinePublic = [102, 103, 104, 105, 601];
  const publicIds = publicConsumer.skins.map((row) => row.skinId);
  exact(publicIds.slice(0, baselinePublic.length), baselinePublic, 'M04/M05-E public Consumer baseline changed');
  const approvedAssetIds = new Set(assetRegistry.records.filter((row) => row.admissionStatus === 'APPROVED').map((row) => row.skinId));
  const approvedPublicationIds = new Set(publication.approvals.filter((row) => row.status === 'APPROVED').map((row) => row.skinId));
  for (const skinId of publicIds) expect(approvedAssetIds.has(skinId) && approvedPublicationIds.has(skinId),
    `Semantic-only Skin ${skinId} leaked into public projection`);
  exact(publicAssets.assets.map((row) => row.skinId), publicIds, 'Public URL map and Consumer differ');
  return { status: 'PASS', newSemantic: IDS.length, composed: composed.skins.length,
    existingPublic: baselinePublic.length, newlyPublishedFromM06: publicIds.filter((id) => IDS.includes(id)).length };
}

export async function loadM06SemanticInputs(root = process.cwd()) {
  const read = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
  return {
    identities: await read('canonical/skin-identities-m06.v1.json'),
    relations: await read('canonical/skin-hero-relations-m06.v1.json'),
    orders: await read('canonical/skin-source-orders-m06.v1.json'),
    identityEvidence: await read('evidence/source/skin-identity-m06.v1.json'),
    relationEvidence: await read('evidence/source/skin-hero-relation-m06.v1.json'),
    orderEvidence: await read('evidence/source/skin-source-order-m06.v1.json'),
    admissionRegistry: await read('canonical/skin-admission-registry-m05-g.v1.json'),
    heroIdentities: await read('canonical/hero-identities.v1.json'),
    frozenIdentity: await read('canonical/skin-identities.v1.json'),
    frozenRelations: await read('canonical/skin-hero-relations-m02.v1.json'),
    frozenOrders: await read('canonical/skin-source-orders-m02.v1.json'),
    m05Identity: await read('canonical/skin-identities-m05-c.v1.json'),
    m05Relation: await read('canonical/skin-hero-relations-m05-c.v1.json'),
    m05Order: await read('canonical/skin-source-orders-m05-c.v1.json'),
    m05Internal: await read('generated/skin-consumer-internal-m05.v1.json'),
    composed: await read('generated/skin-consumer-composed-m05-g.v1.json'),
    publicConsumer: await read('generated/skin-consumer-public-m05-g.v1.json'),
    publicAssets: await read('generated/skin-assets-public-m05-g.v1.json'),
    assetRegistry: await read('canonical/skin-asset-registry-m05-g.v1.json'),
    publication: await read('canonical/skin-publication-approvals-m05-g.v1.json'),
  };
}

export async function validateM06Semantic(root = process.cwd()) {
  return validateM06SemanticData(await loadM06SemanticInputs(root));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.stdout.write(`M06 Semantic Admission (602-606): PASS ${JSON.stringify(await validateM06Semantic())}\n`);
}
