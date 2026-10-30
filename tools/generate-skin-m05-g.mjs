import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isAllowedSkinAssetPath, skinAssetPathFromPublicUrl } from '../skin-asset-publication-contract.mjs';

const pretty = (value) => `${JSON.stringify(value, null, 2)}\n`;
const frozenIds = [102, 103, 104, 105];

export async function generateSkinM05G(root = process.cwd()) {
  const read = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
  const ids = await read('canonical/skin-identities.v1.json');
  const relations = await read('canonical/skin-hero-relations-m02.v1.json');
  const orders = await read('canonical/skin-source-orders-m02.v1.json');
  const heroes = await read('canonical/hero-identities.v1.json');
  const registry = await read('canonical/skin-admission-registry-m05-g.v1.json');
  const assetRegistry = await read('canonical/skin-asset-registry-m05-g.v1.json');
  const publication = await read('canonical/skin-publication-approvals-m05-g.v1.json');
  const relationBySkin = new Map(relations.records.map((row) => [row.skinId, row]));
  const orderBySkin = new Map(orders.records.map((row) => [row.skinId, row]));
  const heroIds = new Set(heroes.records.map((row) => row.heroId));
  const composed = frozenIds.map((skinId) => ({
    skinId,
    heroId: relationBySkin.get(skinId)?.heroId,
    sourceOrder: orderBySkin.get(skinId)?.sourceOrder,
  }));
  if (registry.schemaVersion !== 1 || !Array.isArray(registry.admissions)) throw new Error('M05-G admission registry schema invalid');
  const seenAdmissionIds = new Set();
  for (const admission of registry.admissions) {
    if (!['APPROVED', 'NOT_APPROVED', 'REVIEW'].includes(admission.status)
      || !Number.isSafeInteger(admission.skinId) || typeof admission.admissionId !== 'string'
      || seenAdmissionIds.has(admission.admissionId)) throw new Error('M05-G admission registry schema or key is invalid');
    if (admission.status !== 'APPROVED') continue;
    if (composed.some((row) => row.skinId === admission.skinId)) {
      throw new Error('M05-G approved Admission conflicts with Frozen Population');
    }
    seenAdmissionIds.add(admission.admissionId);
    const [identity, relation, order] = await Promise.all([
      read(admission.identityCanonical), read(admission.relationCanonical), read(admission.orderCanonical),
    ]);
    const id = identity.records.find((row) => row.skinId === admission.skinId);
    const rel = relation.records.find((row) => row.skinId === admission.skinId);
    const ord = order.records.find((row) => row.skinId === admission.skinId);
    if (!id || !rel || !ord || typeof id.provenance !== 'string'
      || rel.heroId === undefined || ord.sourceOrder === undefined) throw new Error('M05-G registered Admission claims are incomplete');
    if (!Array.isArray(admission.evidence) || admission.evidence.length < 3) throw new Error('M05-G Admission is missing claim evidence references');
    const claimEvidence = await Promise.all(admission.evidence.map((path) => read(path)));
    const evidenceByType = new Map(claimEvidence.map((evidence) => [evidence.claimType, evidence]));
    for (const [claimType, record, value] of [
      ['skin-identity', id, admission.skinId], ['skin-to-hero-ownership', rel, rel.heroId], ['skin-source-order', ord, ord.sourceOrder],
    ]) {
      const evidence = evidenceByType.get(claimType);
      const evidenceRecord = evidence?.records?.find((row) => row.skinId === admission.skinId);
      if (!evidence || !['A', 'B'].includes(evidence.evidenceClass) || !record.provenance
        || !record.provenance.startsWith(admission.evidence[claimEvidence.indexOf(evidence)] + '#records/skinId=')
        || !record.provenance.endsWith(`#records/skinId=${admission.skinId}`) || !evidenceRecord) {
        throw new Error(`M05-G Admission ${claimType} provenance is invalid`);
      }
      const evidencedValue = claimType === 'skin-identity' ? evidenceRecord.sourceRecord?.ID
        : claimType === 'skin-to-hero-ownership' ? evidenceRecord.heroId : evidenceRecord.sourceOrder;
      if (evidencedValue !== value) throw new Error(`M05-G Admission ${claimType} claim conflicts with its evidence`);
    }
    composed.push({ skinId: admission.skinId, heroId: rel.heroId, sourceOrder: ord.sourceOrder });
  }
  if (composed.some((row) => !Number.isSafeInteger(row.heroId) || !heroIds.has(row.heroId)
    || !Number.isSafeInteger(row.sourceOrder) || row.sourceOrder < 1)) throw new Error('M05-G composed consumer has invalid FK or order');
  const unique = new Set(composed.map((row) => row.skinId));
  if (unique.size !== composed.length) throw new Error('M05-G composition has duplicate SkinID');
  const orderKeys = new Set();
  for (const row of composed) {
    const key = `${row.heroId}:${row.sourceOrder}`;
    if (orderKeys.has(key)) throw new Error('M05-G duplicate Source Order within Hero');
    orderKeys.add(key);
  }
  composed.sort((a, b) => a.heroId - b.heroId || a.sourceOrder - b.sourceOrder);

  const semanticIds = new Set(composed.map((row) => row.skinId));
  const assetRecords = [];
  const assetPaths = new Map();
  for (const record of assetRegistry.records) {
    if (!['APPROVED', 'NOT_APPROVED', 'REVIEW'].includes(record.admissionStatus)) throw new Error('M05-G Asset Registry status invalid');
    if (record.admissionStatus !== 'APPROVED') continue;
    if (record.assetRecordSkinId !== record.skinId || !semanticIds.has(record.skinId)
      || typeof record.assetEvidence !== 'string' || typeof record.assetValidator !== 'string') throw new Error('M05-G approved Asset lacks admitted Semantic or provenance');
    const assetManifest = await read(record.assetEvidence);
    const manifestRecord = assetManifest.records.find((row) => row.skinId === record.assetRecordSkinId);
    if (!manifestRecord) throw new Error(`M05-G approved Asset missing from source Manifest: ${record.skinId}`);
    if (!isAllowedSkinAssetPath(manifestRecord.output?.path)) throw new Error(`M05-G approved Asset has unsupported Manifest path: ${record.skinId}`);
    assetPaths.set(record.skinId, manifestRecord.output.path);
    assetRecords.push({ skinId: record.skinId, record: manifestRecord });
  }
  if (new Set(assetRecords.map(({ skinId }) => skinId)).size !== assetRecords.length) throw new Error('M05-G duplicate Asset registry record');
  const assetIds = new Set(assetRecords.map(({ skinId }) => skinId));
  const publicRows = composed.filter((row) => assetIds.has(row.skinId)
    && publication.approvals.some((approval) => approval.skinId === row.skinId && approval.status === 'APPROVED'));
  const urls = new Map();
  for (const approval of publication.approvals) {
    if (approval.status !== 'APPROVED') continue;
    if (!assetIds.has(approval.skinId) || !semanticIds.has(approval.skinId)
      || skinAssetPathFromPublicUrl(approval.approvedUrl) !== assetPaths.get(approval.skinId)
      || urls.has(approval.approvedUrl)) throw new Error('M05-G invalid or duplicate Publication approval');
    urls.set(approval.approvedUrl, approval.skinId);
  }
  const publicConsumer = { schemaVersion: 1, skins: publicRows };
  const publicAssets = { schemaVersion: 1, assets: publicRows.map((row) => ({
    skinId: row.skinId,
    imageUrl: publication.approvals.find((approval) => approval.skinId === row.skinId).approvedUrl,
  })) };
  const outputs = new Map([
    ['generated/skin-consumer-composed-m05-g.v1.json', { schemaVersion: 1, skins: composed }],
    ['generated/skin-consumer-public-m05-g.v1.json', publicConsumer],
    ['generated/skin-assets-public-m05-g.v1.json', publicAssets],
  ]);
  for (const [path, value] of outputs) await writeFile(resolve(root, path), pretty(value));
  return Object.fromEntries(outputs);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await generateSkinM05G();
  process.stdout.write('M05-G generated composition and approved public projections deterministically.\n');
}
