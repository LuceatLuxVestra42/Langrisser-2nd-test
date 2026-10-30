import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { skinAssetPathFromPublicUrl } from '../skin-asset-publication-contract.mjs';

const same = (a, b, label) => assert.deepEqual(a, b, label);
const read = async (root, path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));

export function validateM05GData(input) {
  const { frozenIdentity, frozenRelations, frozenOrders, heroIdentities, admissions, assetRegistry, assetManifest,
    publication, composed, publicConsumer, publicAssets, m03Consumer, actualAssetDigests } = input;
  const frozenRows = [
    { skinId: 102, heroId: 1, sourceOrder: 1 }, { skinId: 103, heroId: 1, sourceOrder: 2 },
    { skinId: 104, heroId: 1, sourceOrder: 3 }, { skinId: 105, heroId: 1, sourceOrder: 4 },
  ];
  same(frozenIdentity.records.map((r) => r.skinId), [102, 103, 104, 105], 'M01 Frozen scope drift');
  same(frozenRelations.records.map(({ skinId, heroId }) => ({ skinId, heroId })), frozenRows.map(({ skinId, heroId }) => ({ skinId, heroId })), 'M02 Frozen ownership drift');
  same(frozenOrders.records.map(({ skinId, sourceOrder }) => ({ skinId, sourceOrder })), frozenRows.map(({ skinId, sourceOrder }) => ({ skinId, sourceOrder })), 'M02 Frozen order drift');
  same(m03Consumer.skins, frozenRows, 'M03 frozen public consumer changed');
  assert.equal(admissions.schemaVersion, 1);
  assert.ok(Array.isArray(admissions.admissions));
  const heroIds = new Set(heroIdentities.records.map((row) => row.heroId));
  const rows = [...frozenRows];
  const seenAdmission = new Set();
  for (const admission of admissions.admissions) {
    assert.ok(['APPROVED', 'NOT_APPROVED', 'REVIEW'].includes(admission.status), 'invalid Admission approval status');
    assert.ok(Number.isSafeInteger(admission.skinId));
    assert.ok(!seenAdmission.has(admission.admissionId), 'duplicate Admission registry key');
    seenAdmission.add(admission.admissionId);
    if (admission.status !== 'APPROVED') continue;
    assert.ok(!rows.some((row) => row.skinId === admission.skinId), 'Admission overlaps Frozen SkinID');
    const id = admission.identity.records.find((r) => r.skinId === admission.skinId);
    const relation = admission.relation.records.find((r) => r.skinId === admission.skinId);
    const order = admission.order.records.find((r) => r.skinId === admission.skinId);
    assert.ok(id?.provenance && relation?.provenance && order?.provenance, 'registered claim missing provenance');
    assert.ok(Array.isArray(admission.evidenceRecords) && admission.evidenceRecords.length >= 3, 'registered claim evidence is missing');
    const evidenceByType = new Map(admission.evidenceRecords.map((evidence) => [evidence.claimType, evidence]));
    for (const [claimType, canonicalRecord] of [['skin-identity', id], ['skin-to-hero-ownership', relation], ['skin-source-order', order]]) {
      const evidence = evidenceByType.get(claimType);
      assert.ok(evidence && ['A', 'B'].includes(evidence.evidenceClass), `Claim ${claimType} lacks A/B provenance`);
      assert.ok(evidence.records.some((record) => record.skinId === admission.skinId), `Claim ${claimType} evidence lacks matching SkinID`);
      const evidencePath = canonicalRecord.provenance.split('#')[0];
      assert.ok(admission.evidence.includes(evidencePath) && evidencePath === evidence.path,
        `Claim ${claimType} provenance pointer is outside its Admission registry`);
      assert.ok(canonicalRecord.provenance.endsWith(`#records/skinId=${admission.skinId}`), `Claim ${claimType} pointer locator mismatch`);
      const evidenceRecord = evidence.records.find((record) => record.skinId === admission.skinId);
      if (claimType === 'skin-identity') assert.equal(evidenceRecord.sourceRecord.ID, admission.skinId);
      if (claimType === 'skin-to-hero-ownership') assert.equal(evidenceRecord.heroId, relation.heroId);
      if (claimType === 'skin-source-order') assert.equal(evidenceRecord.sourceOrder, order.sourceOrder);
    }
    rows.push({ skinId: admission.skinId, heroId: relation.heroId, sourceOrder: order.sourceOrder });
  }
  assert.equal(new Set(rows.map((row) => row.skinId)).size, rows.length, 'duplicate composed SkinID');
  const positions = new Set();
  for (const row of rows) {
    assert.ok(heroIds.has(row.heroId), `unresolved Hero FK ${row.heroId}`);
    assert.ok(Number.isSafeInteger(row.sourceOrder) && row.sourceOrder > 0);
    const position = `${row.heroId}:${row.sourceOrder}`;
    assert.ok(!positions.has(position), 'duplicate Source Order within Hero');
    positions.add(position);
  }
  rows.sort((a, b) => a.heroId - b.heroId || a.sourceOrder - b.sourceOrder);
  same(composed, { schemaVersion: 1, skins: rows }, 'composed Generated does not match Owner inputs');

  assert.equal(assetRegistry.schemaVersion, 1);
  const assetIds = new Set();
  const manifestById = new Map();
  for (const record of assetRegistry.records) {
    assert.ok(['APPROVED', 'NOT_APPROVED', 'REVIEW'].includes(record.admissionStatus));
    if (record.admissionStatus !== 'APPROVED') continue;
    assert.ok(rows.some((row) => row.skinId === record.skinId), 'Asset has no admitted Semantic');
    assert.ok(!assetIds.has(record.skinId), 'duplicate Asset Registry record');
    assetIds.add(record.skinId);
    assert.equal(record.assetRecordSkinId, record.skinId);
    assert.ok(record.assetEvidence && record.assetValidator, 'Asset Admission provenance or validator missing');
    const asset = assetManifest[record.assetEvidence]?.records.find((row) => row.skinId === record.assetRecordSkinId);
    assert.ok(asset && asset.skinId === record.skinId);
    manifestById.set(record.skinId, asset);
    assert.equal(asset.output.format, 'image/webp');
    assert.equal(asset.output.alpha.present, true);
    assert.equal(asset.output.alpha.transparentPixelsExist, true);
    assert.match(asset.output.sha256, /^[a-f0-9]{64}$/);
    assert.equal(actualAssetDigests[record.skinId], asset.output.sha256, `Asset hash mismatch ${record.skinId}`);
  }
  assert.ok(publication.approvals.every((row) => ['APPROVED', 'NOT_APPROVED', 'REVIEW'].includes(row.status)));
  const approved = publication.approvals.filter((row) => row.status === 'APPROVED');
  const approvalIds = new Set();
  const urls = new Set();
  for (const approval of approved) {
    assert.ok(rows.some((row) => row.skinId === approval.skinId), 'Publication approval has no Semantic');
    assert.ok(assetIds.has(approval.skinId), 'Publication approval has no Asset');
    assert.ok(!approvalIds.has(approval.skinId), 'duplicate Publication approval');
    assert.ok(!urls.has(approval.approvedUrl), 'duplicate public URL');
    assert.ok(skinAssetPathFromPublicUrl(approval.approvedUrl), 'Publication URL is outside supported Asset paths');
    assert.equal(skinAssetPathFromPublicUrl(approval.approvedUrl), manifestById.get(approval.skinId)?.output?.path,
      'approved URL differs from admitted Asset path');
    assert.ok(approval.approvalRecord);
    assert.equal(Boolean(approval.semanticAdmission), Boolean(approval.assetAdmission),
      'Publication owner references must include both Semantic and Asset Admission when supplied');
    if (approval.semanticAdmission) {
      assert.equal(typeof approval.semanticAdmission, 'string');
      assert.equal(typeof approval.assetAdmission, 'string');
    }
    approvalIds.add(approval.skinId); urls.add(approval.approvedUrl);
  }
  const intersection = rows.filter((row) => assetIds.has(row.skinId) && approvalIds.has(row.skinId));
  same(publicConsumer, { schemaVersion: 1, skins: intersection }, 'Public Consumer is not Semantic ∩ Asset ∩ Publication');
  same(publicAssets, { schemaVersion: 1, assets: intersection.map((row) => ({
    skinId: row.skinId, imageUrl: approved.find((approval) => approval.skinId === row.skinId).approvedUrl,
  })) }, 'Public Asset map is not approval intersection');
  return { status: 'PASS', frozen: frozenRows.length, composed: rows.length, assets: assetIds.size, published: intersection.length };
}

export async function loadM05GInputs(root = process.cwd()) {
  const paths = {
    frozenIdentity: 'canonical/skin-identities.v1.json', frozenRelations: 'canonical/skin-hero-relations-m02.v1.json',
    frozenOrders: 'canonical/skin-source-orders-m02.v1.json', heroIdentities: 'canonical/hero-identities.v1.json',
    assetRegistry: 'canonical/skin-asset-registry-m05-g.v1.json',
    admissions: 'canonical/skin-admission-registry-m05-g.v1.json', publication: 'canonical/skin-publication-approvals-m05-g.v1.json',
    composed: 'generated/skin-consumer-composed-m05-g.v1.json', publicConsumer: 'generated/skin-consumer-public-m05-g.v1.json',
    publicAssets: 'generated/skin-assets-public-m05-g.v1.json', m03Consumer: 'generated/skin-consumer.v1.json',
  };
  const input = {};
  for (const [key, path] of Object.entries(paths)) input[key] = await read(root, path);
  input.assetManifest = {};
  input.actualAssetDigests = {};
  for (const record of input.assetRegistry.records.filter((row) => row.admissionStatus === 'APPROVED')) {
    input.assetManifest[record.assetEvidence] ??= await read(root, record.assetEvidence);
    const asset = input.assetManifest[record.assetEvidence].records.find((row) => row.skinId === record.assetRecordSkinId);
    input.actualAssetDigests[record.skinId] = createHash('sha256').update(await readFile(resolve(root, asset.output.path))).digest('hex');
  }
  const admittedRecords = [];
  for (const admission of input.admissions.admissions.filter((row) => row.status === 'APPROVED')) {
    for (const path of [admission.identityCanonical, admission.relationCanonical, admission.orderCanonical]) {
      admittedRecords.push(await read(root, path));
    }
  }
  let admittedIndex = 0;
  input.admissions = { ...input.admissions, admissions: await Promise.all(input.admissions.admissions.map(async (entry) => {
    if (entry.status !== 'APPROVED') return entry;
    const index = admittedIndex++;
    const evidenceRecords = await Promise.all(entry.evidence.map(async (path) => ({ path, ...await read(root, path) })));
    return { ...entry, identity: admittedRecords[index * 3], relation: admittedRecords[index * 3 + 1], order: admittedRecords[index * 3 + 2], evidenceRecords };
  })) };
  return input;
}

export async function validateM05G(root = process.cwd()) {
  const input = await loadM05GInputs(root);
  return validateM05GData(input);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.stdout.write(`M05-G semantic composition, Asset Registry and publication: PASS ${JSON.stringify(await validateM05G())}\n`);
}
