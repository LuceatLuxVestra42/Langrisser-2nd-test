import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadM05GInputs, validateM05GData } from './validate-skin-m05-g.mjs';
import { skinAssetPathFromPublicUrl } from '../skin-asset-publication-contract.mjs';

const SKIN_ID = 3701;
const CLAIM = { skinId: 3701, heroId: 37, sourceOrder: 1 };
const ASSET_PATH = 'assets/skin-admissions/m07/skin-3701.webp';
const ASSET_URL = `./${ASSET_PATH}`;
const SEMANTIC = 'canonical/skin-admission-registry-m05-g.v1.json#admissions/M07-SKIN-3701';
const ASSET = 'canonical/skin-asset-registry-m05-g.v1.json#records/skinId=3701';
const EVIDENCE = 'evidence/assets/skin-fullart-m07.v1.json';
const BASELINE = [
  ...[102, 103, 104, 105].map((skinId, index) => ({ skinId, heroId: 1, sourceOrder: index + 1 })),
  { skinId: 601, heroId: 6, sourceOrder: 1 },
  ...[602, 603, 604, 605, 606].map((skinId, index) => ({ skinId, heroId: 6, sourceOrder: index + 2 })),
];

export function validateM07PublicationData(input) {
  const composed = validateM05GData(input);
  assert.equal(composed.status, 'PASS');
  assert.deepEqual(input.composed.skins.find(row => row.skinId === SKIN_ID), CLAIM,
    'Skin 3701 Semantic claim must remain unchanged');
  const assetRows = input.assetRegistry.records.filter(row => row.skinId === SKIN_ID && row.admissionStatus === 'APPROVED');
  assert.equal(assetRows.length, 1, 'Skin 3701 must have exactly one approved Asset Admission');
  const assetRow = assetRows[0];
  assert.equal(assetRow.assetRecordSkinId, SKIN_ID);
  assert.equal(assetRow.assetEvidence, EVIDENCE);
  const assetRecord = input.assetManifest[EVIDENCE].records.find(row => row.skinId === SKIN_ID);
  assert.ok(assetRecord, 'Skin 3701 Asset Evidence is missing');
  assert.equal(assetRecord.output.path, ASSET_PATH);
  assert.equal(assetRecord.output.format, 'image/webp');
  assert.equal(input.actualAssetDigests[SKIN_ID], assetRecord.output.sha256, 'Skin 3701 Asset hash mismatch');

  const approvals = input.publication.approvals.filter(row => row.skinId === SKIN_ID && row.status === 'APPROVED');
  assert.equal(approvals.length, 1, 'Skin 3701 needs exactly one explicit Publication Approval');
  const approval = approvals[0];
  assert.equal(approval.approvedUrl, ASSET_URL);
  assert.equal(skinAssetPathFromPublicUrl(approval.approvedUrl), ASSET_PATH);
  assert.equal(approval.semanticAdmission, SEMANTIC);
  assert.equal(approval.assetAdmission, ASSET);
  assert.equal(approval.approvalRecord, 'docs/migrations/m07-skin-3701-publication.md');

  assert.deepEqual(input.publicConsumer.skins.filter(row => row.skinId === SKIN_ID), [CLAIM],
    'Skin 3701 must appear once with its admitted Hero and Source Order');
  assert.deepEqual(input.publicAssets.assets.filter(row => row.skinId === SKIN_ID),
    [{ skinId: SKIN_ID, imageUrl: ASSET_URL }], 'Skin 3701 public URL must match its Asset');
  assert.equal(input.publicConsumer.skins.length, BASELINE.length + 1, 'Publication adds exactly one public Skin');
  assert.deepEqual(input.publicConsumer.skins.filter(row => row.skinId !== SKIN_ID), BASELINE,
    'Existing approved Semantic claims and Source Order must remain unchanged');
  assert.equal(input.publicAssets.assets.length, BASELINE.length + 1);
  assert.deepEqual(input.publicAssets.assets.filter(row => row.skinId !== SKIN_ID), BASELINE.map(row => {
    const path = row.skinId >= 602 ? `assets/skin-admissions/m06/skin-${row.skinId}.webp`
      : row.skinId === 601 ? 'assets/skin-admissions/m05-d/skin-601.webp' : `assets/skins/skin-${row.skinId}.webp`;
    return { skinId: row.skinId, imageUrl: `./${path}` };
  }), 'Existing approved URLs must remain unchanged');
  assert.equal(composed.published, BASELINE.length + 1);

  const decision = readFileSync(resolve(input.root ?? process.cwd(), 'docs/migrations/m07-skin-3701-publication.md'), 'utf8');
  assert.match(decision, /Publication decision: APPROVED by repository owner LuceatLuxVestra42/);
  assert.match(decision, /explicit user request dated 2026-11-01/);
  return { status: 'PASS', publicSkins: BASELINE.length + 1, added: CLAIM, assetUrl: ASSET_URL };
}

export async function validateM07Publication(root = process.cwd()) {
  const input = await loadM05GInputs(root);
  input.root = root;
  return validateM07PublicationData(input);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.stdout.write(`M07 Publication: PASS ${JSON.stringify(await validateM07Publication())}\n`);
}
