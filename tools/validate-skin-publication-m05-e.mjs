import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadM05GInputs, validateM05GData } from './validate-skin-m05-g.mjs';
import { selectSkinFullarts } from '../skin-fullart-presentation.mjs';
import { skinAssetPathFromPublicUrl } from '../skin-asset-publication-contract.mjs';

const OLD_URLS = new Map([
  [102, './assets/skins/skin-102.webp'], [103, './assets/skins/skin-103.webp'],
  [104, './assets/skins/skin-104.webp'], [105, './assets/skins/skin-105.webp'],
]);
const SKIN_601_PATH = 'assets/skin-admissions/m05-d/skin-601.webp';
const SKIN_601_SHA = 'a3a311f273b5ca02faff592204a69c454dcb75ae591c9cb9d7cc1b5950d22298';

export async function validateM05E(root = process.cwd()) {
  const input = await loadM05GInputs(root);
  const result = validateM05GData(input);
  assert.equal(result.status, 'PASS');
  assert.equal(result.frozen, 4, 'M01/M02 frozen population must remain four');
  assert.ok(result.composed >= 5, 'M05-E Semantic baseline must remain composed');
  assert.ok(result.assets >= 5, 'M05-E Asset baseline must remain admitted');
  assert.ok(result.published >= 5, 'M05-E Publication baseline must remain public');

  const approval = input.publication.approvals.find((row) => row.skinId === 601 && row.status === 'APPROVED');
  assert.ok(approval, 'Skin 601 needs an explicit Publication Approval');
  assert.equal(approval.approvedUrl, `./${SKIN_601_PATH}`);
  assert.equal(skinAssetPathFromPublicUrl(approval.approvedUrl), SKIN_601_PATH);
  assert.equal(approval.semanticAdmission, 'canonical/skin-admission-registry-m05-g.v1.json#admissions/M05-C-SKIN-601');
  assert.equal(approval.assetAdmission, 'canonical/skin-asset-registry-m05-g.v1.json#records/skinId=601');
  assert.equal(approval.approvalRecord, 'docs/migrations/m05-e-skin601-publication.md');

  for (const [skinId, url] of OLD_URLS) {
    assert.equal(input.publication.approvals.find((row) => row.skinId === skinId)?.approvedUrl, url,
      `M04 Skin ${skinId} public URL changed`);
  }
  assert.deepEqual(input.publicConsumer.skins.filter((row) => row.heroId === 1), [
    { skinId: 102, heroId: 1, sourceOrder: 1 }, { skinId: 103, heroId: 1, sourceOrder: 2 },
    { skinId: 104, heroId: 1, sourceOrder: 3 }, { skinId: 105, heroId: 1, sourceOrder: 4 },
  ]);
  const heroSix = selectSkinFullarts(input.publicConsumer, 6, input.publicAssets);
  const heroSixBaseline = heroSix.find((row) => row.skinId === 601);
  assert.deepEqual({ ...heroSixBaseline, accessibleLabel: undefined }, {
    skinId: 601, heroId: 6, sourceOrder: 1, imageUrl: `./${SKIN_601_PATH}`, accessibleLabel: undefined,
  });
  assert.match(heroSixBaseline.accessibleLabel, /^영웅 스킨 일러스트 1 \/ [1-9][0-9]*$/);
  assert.deepEqual(input.publicAssets.assets.map((row) => row.skinId).slice(0, 5), [102, 103, 104, 105, 601]);
  assert.equal(input.actualAssetDigests[601], SKIN_601_SHA);
  const skin601Manifest = input.assetManifest['evidence/assets/skin-fullart-m05-d.v1.json'].records.find((row) => row.skinId === 601);
  assert.equal(skin601Manifest.output.path, SKIN_601_PATH);
  assert.equal(skin601Manifest.output.sha256, SKIN_601_SHA);

  for (const sourcePath of ['app.js', 'skin-fullart-presentation.mjs', 'tools/build.mjs']) {
    const source = await readFile(resolve(root, sourcePath), 'utf8');
    assert.doesNotMatch(source, /\b601\b/, `${sourcePath} must not hardcode SkinID 601`);
  }
  return { status: 'PASS', frozenHeroOne: 4, semanticBaseline: 5, assetBaseline: 5, publicationBaseline: 5, publicBaseline: 5, heroSixBaseline: 1 };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.stdout.write(`M05-E Publication and Hero Fullart: PASS ${JSON.stringify(await validateM05E())}\n`);
}
