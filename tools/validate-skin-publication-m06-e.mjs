import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadM05GInputs, validateM05GData } from './validate-skin-m05-g.mjs';
import { skinAssetPathFromPublicUrl } from '../skin-asset-publication-contract.mjs';

const IDS = [602, 603, 604, 605, 606];
const URLS = new Map(IDS.map((id) => [id, `./assets/skin-admissions/m06/skin-${id}.webp`]));
const OLD_URLS = new Map([
  [102, './assets/skins/skin-102.webp'], [103, './assets/skins/skin-103.webp'],
  [104, './assets/skins/skin-104.webp'], [105, './assets/skins/skin-105.webp'],
  [601, './assets/skin-admissions/m05-d/skin-601.webp'],
]);

export function validateM06EData(input) {
  const result = validateM05GData(input);
  assert.equal(result.status, 'PASS');
  const semantic = input.composed.skins.filter((row) => IDS.includes(row.skinId));
  assert.deepEqual(semantic, IDS.map((skinId, index) => ({ skinId, heroId: 6, sourceOrder: index + 2 })),
    'M06 Semantic claims and source order must remain unchanged');

  const m06Assets = input.assetRegistry.records.filter((row) => IDS.includes(row.skinId) && row.admissionStatus === 'APPROVED');
  assert.equal(m06Assets.length, IDS.length, 'all M06 Asset Admissions must remain approved');
  for (const id of IDS) {
    const row = m06Assets.find((record) => record.skinId === id);
    assert.ok(row, `missing Asset Admission ${id}`);
    assert.equal(row.assetRecordSkinId, id);
    assert.equal(row.assetEvidence, 'evidence/assets/skin-fullart-m06.v1.json');
    const evidence = input.assetManifest[row.assetEvidence].records.find((record) => record.skinId === id);
    assert.equal(evidence.output.path, `assets/skin-admissions/m06/skin-${id}.webp`);
    assert.equal(evidence.output.format, 'image/webp');
    assert.equal(input.actualAssetDigests[id], evidence.output.sha256, `Skin ${id} Asset bytes mismatch`);
  }

  const m06Approvals = input.publication.approvals.filter((row) => IDS.includes(row.skinId) && row.status === 'APPROVED');
  assert.equal(m06Approvals.length, IDS.length, 'each M06 Skin needs an explicit Publication Approval');
  for (const id of IDS) {
    const approval = m06Approvals.find((row) => row.skinId === id);
    assert.ok(approval, `missing Publication Approval ${id}`);
    assert.equal(approval.approvedUrl, URLS.get(id));
    assert.equal(skinAssetPathFromPublicUrl(approval.approvedUrl), `assets/skin-admissions/m06/skin-${id}.webp`);
    assert.equal(approval.semanticAdmission, `canonical/skin-admission-registry-m05-g.v1.json#admissions/M06-SKIN-${id}`);
    assert.equal(approval.assetAdmission, `canonical/skin-asset-registry-m05-g.v1.json#records/skinId=${id}`);
    assert.equal(approval.approvalRecord, 'docs/migrations/m06-hero6-skin-fullart-expansion.md');
  }

  for (const [id, url] of OLD_URLS) {
    assert.equal(input.publication.approvals.find((row) => row.skinId === id)?.approvedUrl, url,
      `existing public URL for ${id} changed`);
  }
  assert.deepEqual(input.publicConsumer.skins.filter((row) => row.heroId === 1), [
    { skinId: 102, heroId: 1, sourceOrder: 1 }, { skinId: 103, heroId: 1, sourceOrder: 2 },
    { skinId: 104, heroId: 1, sourceOrder: 3 }, { skinId: 105, heroId: 1, sourceOrder: 4 },
  ], 'M04 Hero 1 population/order changed');
  assert.deepEqual(input.publicConsumer.skins.filter((row) => row.heroId === 6), [
    { skinId: 601, heroId: 6, sourceOrder: 1 },
    ...IDS.map((skinId, index) => ({ skinId, heroId: 6, sourceOrder: index + 2 })),
  ], 'Hero 6 public Consumer must preserve Source Order 1–6');
  assert.deepEqual(input.publicAssets.assets.map((row) => row.skinId), [102, 103, 104, 105, 601, ...IDS]);
  assert.equal(result.frozen, 4);
  assert.equal(result.composed, 10);
  assert.equal(result.assets, 10);
  assert.equal(result.published, 10);
  return { status: 'PASS', frozen: result.frozen, composed: result.composed, assets: result.assets, published: result.published, heroSix: 6 };
}

export async function validateM06E(root = process.cwd()) {
  return validateM06EData(await loadM05GInputs(root));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.stdout.write(`M06-E publication: PASS ${JSON.stringify(await validateM06E())}\n`);
}
