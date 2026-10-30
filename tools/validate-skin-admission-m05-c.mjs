import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const fail = (message) => { throw new Error('M05-C Skin admission validation failed: ' + message); };
const check = (condition, message) => { if (!condition) fail(message); };
const same = (actual, expected, message) => { if (JSON.stringify(actual) !== JSON.stringify(expected)) fail(message); };
const exactKeys = (value, keys, label) => {
  check(value && typeof value === 'object' && !Array.isArray(value), label + ' must be an object');
  same(Object.keys(value).sort(), [...keys].sort(), label + ' fields do not match the contract');
};

export function assertPerHeroOrderUniqueness(rows) {
  const seen = new Set();
  for (const row of rows) {
    check(Number.isSafeInteger(row.heroId) && Number.isSafeInteger(row.sourceOrder), 'Source Order row has invalid HeroID or order');
    const key = row.heroId + ':' + row.sourceOrder;
    check(!seen.has(key), 'duplicate Source Order within Hero ' + row.heroId);
    seen.add(key);
  }
  return true;
}

const frozenIds = [102, 103, 104, 105];
const frozenRows = [
  { skinId: 102, heroId: 1, sourceOrder: 1 },
  { skinId: 103, heroId: 1, sourceOrder: 2 },
  { skinId: 104, heroId: 1, sourceOrder: 3 },
  { skinId: 105, heroId: 1, sourceOrder: 4 },
];
const identityScope = 'M01: source-native Skin Identity 102, 103, 104, 105 only; historical China ConfigData snapshot, not global Skin completeness or current release status.';
const relationScope = 'M02 Skin→Hero ownership for the four Skin identities admitted by M01; no other Skin or Hero population is implied.';
const orderScope = 'One-based Source Order for the four M01 Skin identities in ConfigDataHeroInfo.ID=1 at the pinned historical source snapshot only.';

export function validateM05C(input) {
  const { frozenIdentity, frozenRelations, frozenOrders, heroIdentities, publicConsumer, newIdentity, newRelation, newOrder, identityEvidence, relationEvidence, orderEvidence, internalConsumer, assetManifest, presentationSource, buildSource } = input;

  check(frozenIdentity.schemaVersion === 1 && frozenIdentity.scope === identityScope, 'M01 Frozen Identity scope or schema changed');
  same(frozenIdentity.records, frozenIds.map((skinId) => ({ skinId, provenance: 'evidence/source/skin-identity-m01.v1.json#records/skinId=' + skinId })), 'M01 Frozen Identity population changed');
  check(frozenRelations.schemaVersion === 1 && frozenRelations.scope === relationScope, 'M02 Frozen Relation scope or schema changed');
  same(frozenRelations.records, frozenRows.map((row) => ({ skinId: row.skinId, heroId: row.heroId, provenance: 'evidence/source/skin-hero-relations-m02.v1.json#records/skinId=' + row.skinId })), 'M02 Frozen Relation population changed');
  check(frozenOrders.schemaVersion === 1 && frozenOrders.scope === orderScope, 'M02 Frozen Source Order scope or schema changed');
  same(frozenOrders.records, frozenRows.map((row) => ({ skinId: row.skinId, sourceOrder: row.sourceOrder, provenance: 'evidence/source/skin-source-orders-m02.v1.json#records/skinId=' + row.skinId })), 'M02 Frozen Source Order population changed');

  const idPointer = 'evidence/source/skin-identity-m05-c.v1.json#records/skinId=601';
  const relationPointer = 'evidence/source/skin-hero-relation-m05-c.v1.json#records/skinId=601';
  const orderPointer = 'evidence/source/skin-source-order-m05-c.v1.json#records/skinId=601';
  exactKeys(newIdentity, ['schemaVersion', 'scope', 'records'], 'M05 Identity Canonical');
  check(newIdentity.schemaVersion === 1 && newIdentity.scope === 'M05-C independent Target admission: source-native Skin Identity claim for SkinID 601 only; historical China ConfigData snapshot.', 'M05 Identity Canonical scope invalid');
  same(newIdentity.records, [{ skinId: 601, provenance: idPointer }], 'M05 Identity must contain exactly SkinID 601 with its evidence pointer');
  exactKeys(newRelation, ['schemaVersion', 'scope', 'records'], 'M05 Relation Canonical');
  check(newRelation.schemaVersion === 1 && newRelation.scope === 'M05-C independent Target admission: SkinID 601 -> HeroID 6 ownership only; no additional Skin or Hero population is implied.', 'M05 Relation Canonical scope invalid');
  same(newRelation.records, [{ skinId: 601, heroId: 6, provenance: relationPointer }], 'M05 Relation must contain exactly 601 -> 6 with its evidence pointer');
  exactKeys(newOrder, ['schemaVersion', 'scope', 'records'], 'M05 Source Order Canonical');
  check(newOrder.schemaVersion === 1 && newOrder.scope === 'M05-C one-based Source Order for SkinID 601 in ConfigDataHeroInfo.ID=6 Skins_ID[] at the pinned historical snapshot only.', 'M05 Source Order Canonical scope invalid');
  same(newOrder.records, [{ skinId: 601, sourceOrder: 1, provenance: orderPointer }], 'M05 Source Order must contain exactly SkinID 601 -> order 1 with its evidence pointer');

  check(identityEvidence.schemaVersion === 1 && identityEvidence.claimType === 'skin-identity' && identityEvidence.evidenceClass === 'A', 'SkinID 601 Identity requires direct Evidence A');
  check(identityEvidence.source && identityEvidence.source.repository === 'LuceatLuxVestra42/langrisser-future-guide' && identityEvidence.source.snapshotCommit === '6475e63ee23d18adf733756c26a14fa9e3ed662c', 'Identity Source snapshot is not pinned');
  check(identityEvidence.source.path === 'data/configdata/ConfigDataHeroSkinInfo.json' && identityEvidence.source.gitBlobSha1 === 'f6bd2611114ae8ae8aec24d8f304b94f2c314dc9' && identityEvidence.source.sha256 === '6fe685622a57a6546f4cce73ff788057605fca215eba6327eff66c3b5d4847c7', 'Identity Source file anchor is invalid');
  check(identityEvidence.source.recordLocator === 'ID=601' && identityEvidence.source.field === 'ID' && identityEvidence.source.matchingRecordCount === 1 && identityEvidence.records.length === 1 && identityEvidence.records[0].sourceRecord.ID === 601, 'Identity Source-native ID record is invalid');

  check(relationEvidence.schemaVersion === 1 && relationEvidence.claimType === 'skin-to-hero-ownership' && relationEvidence.evidenceClass === 'B', 'Ownership must have its own Evidence B');
  check(relationEvidence.records.length === 1 && relationEvidence.records[0].skinId === 601 && relationEvidence.records[0].heroId === 6, 'Ownership Evidence does not support 601 -> 6');
  check(relationEvidence.records[0].membership.sourceField === 'ConfigDataHeroInfo.Skins_ID[]' && relationEvidence.records[0].membership.membershipConfirmed === true, 'Source membership is not evidenced');
  check(relationEvidence.records[0].ownershipCrossCheck.sourceField === 'ConfigDataHeroSkinInfo.SpecifiedHero' && relationEvidence.records[0].ownershipCrossCheck.skinRecordLocator === 'ID=601' && relationEvidence.records[0].ownershipCrossCheck.value === 6 && relationEvidence.records[0].ownershipCrossCheck.directSourceRecordVerified === true, 'SpecifiedHero cross-check is not evidenced');
  check(relationEvidence.legacyValidationChain.some((row) => row.path === 'data/validation/skin-stage2-1-final.v1.json' && row.result.startsWith('PASS')), 'Ownership Stage 2-1 validation anchor missing');
  check(relationEvidence.legacyValidationChain.some((row) => row.path === 'data/validation/skin-stage2-2-final.v1.json' && row.result.startsWith('PASS')), 'Ownership reverse Relation validation anchor missing');

  check(orderEvidence.schemaVersion === 1 && orderEvidence.claimType === 'skin-source-order' && orderEvidence.evidenceClass === 'B', 'Source Order must have its own Evidence B');
  check(orderEvidence.records.length === 1 && orderEvidence.records[0].skinId === 601 && orderEvidence.records[0].heroId === 6 && orderEvidence.records[0].zeroBasedPosition === 0 && orderEvidence.records[0].sourceOrder === 1, 'Source Order Evidence does not support the array position');
  check(orderEvidence.source.sourceField === 'ConfigDataHeroInfo.Skins_ID[]' && orderEvidence.source.heroRecordLocator === 'ID=6' && orderEvidence.source.zeroBasedToOneBasedRule === 'sourceOrder = zeroBasedPosition + 1', 'Source Order source field or index conversion is invalid');
  check(orderEvidence.legacyValidationChain.some((row) => row.path === 'data/validation/hero-page-stage5-5-2-source-trace.v1.json#fields/skins/ordering' && row.result.startsWith('SOURCE_ORDER_CONFIRMED')), 'Source-native ordering contract anchor missing');
  check(orderEvidence.legacyValidationChain.some((row) => row.path === 'data/validation/skin-stage2-3-final.v1.json' && row.result.startsWith('PASS')), 'Source Order parity validation anchor missing');

  const heroIds = new Set(heroIdentities.records.map((row) => row.heroId));
  check(heroIds.has(6), 'HeroID 6 FK is absent from Target Hero Identity Canonical');
  same(publicConsumer.skins, frozenRows, 'M04 public Skin Consumer must remain the frozen four records');
  same(assetManifest.records.map((row) => row.skinId), frozenIds, 'M04 Asset Population changed');
  check(!presentationSource.includes('601'), 'M04 Presentation mapping contains unapproved SkinID 601');
  check(!buildSource.includes('generated/skin-consumer-internal-m05.v1.json'), 'Internal Consumer was added to Build or publication source');

  const expectedComposite = frozenRows.concat([{ skinId: 601, heroId: 6, sourceOrder: 1 }]);
  check(new Set(expectedComposite.map((row) => row.skinId)).size === expectedComposite.length, 'Composite SkinID population has duplicates');
  check(expectedComposite.every((row) => frozenIds.includes(row.skinId) || row.skinId === 601), 'Composite contains an unauthorized SkinID');
  assertPerHeroOrderUniqueness(expectedComposite);
  exactKeys(internalConsumer, ['schemaVersion', 'skins'], 'Internal Skin Consumer');
  check(internalConsumer.schemaVersion === 1, 'Internal Skin Consumer schema version mismatch');
  same(internalConsumer.skins, expectedComposite, 'Internal Skin Consumer differs from Frozen + M05 Canonical composition');
  check(expectedComposite.every((row) => heroIds.has(row.heroId)), 'Composite Consumer contains an unresolved Hero FK');
  return { status: 'PASS', frozenPopulation: 4, internalPopulation: 5, publicPopulation: 4, newSkinId: 601 };
}

export async function loadM05CInputs(root = process.cwd()) {
  const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
  return {
    frozenIdentity: await readJson('canonical/skin-identities.v1.json'),
    frozenRelations: await readJson('canonical/skin-hero-relations-m02.v1.json'),
    frozenOrders: await readJson('canonical/skin-source-orders-m02.v1.json'),
    heroIdentities: await readJson('canonical/hero-identities.v1.json'),
    publicConsumer: await readJson('generated/skin-consumer.v1.json'),
    newIdentity: await readJson('canonical/skin-identities-m05-c.v1.json'),
    newRelation: await readJson('canonical/skin-hero-relations-m05-c.v1.json'),
    newOrder: await readJson('canonical/skin-source-orders-m05-c.v1.json'),
    identityEvidence: await readJson('evidence/source/skin-identity-m05-c.v1.json'),
    relationEvidence: await readJson('evidence/source/skin-hero-relation-m05-c.v1.json'),
    orderEvidence: await readJson('evidence/source/skin-source-order-m05-c.v1.json'),
    internalConsumer: await readJson('generated/skin-consumer-internal-m05.v1.json'),
    assetManifest: await readJson('evidence/assets/skin-fullart-m04.v1.json'),
    presentationSource: await readFile(resolve(root, 'skin-fullart-presentation.mjs'), 'utf8'),
    buildSource: await readFile(resolve(root, 'tools/build.mjs'), 'utf8'),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const root = resolve(process.argv[2] || process.cwd());
  const result = validateM05C(await loadM05CInputs(root));
  process.stdout.write('M05-C independent Skin admission and internal Consumer: PASS ' + JSON.stringify(result) + '\n');
}
