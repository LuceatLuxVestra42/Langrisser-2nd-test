import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';

const fail = (message) => { throw new Error('Hero portrait selection validation failed: ' + message); };
const check = (condition, message) => { if (!condition) fail(message); };
const targets = [1, 10, 25];
const presentationIds = [5, 6, 8, 28, 32, 52, 53];
const generatedSha256 = '336a064ddc5e81af92d8820fd1dbe46e83c8dbf119b9f3071ff4a1a0f56907e4';
const reportPath = 'data/validation/hero-page-stage5-5-2-artwork.v1.json';
const reportBlob = '6e52ebf142d40d4a82709753e6c5a086dcfb299a';
const expected = new Map([
  [1, {
    charImageId: 1,
    heroPainting: 'UI/HeroPainting/SSR_ABS/Prefab/Matthew.prefab',
    shardPath: 'data/generated/hero-artwork-h-a5-index.v1/begin_ui_heropainting_ssr_abs-b.json',
    shardRecordLocator: 'data/generated/hero-artwork-h-a5-index.v1/begin_ui_heropainting_ssr_abs-b.json#heroes[heroId=1]',
    shardBlob: '3a6ca0062dc5aa53c9db44761e2559bc1819dd81',
    packageName: 'InstallPage_1.1.113_26.zip', packageIndex: 25, packageBytes: 113636260,
    bundleName: 'begin_ui_heropainting_ssr_abs.b', bundleBytes: 3710837,
    bundleMd5: '16CF10B79FF22F3CE1BF78B45D05DFA8',
    bundleSha256: '7C1551C8A4626CAA0BAB5E83A6A5BC4B3EF804E831D570C724D94193C4569F8A',
    bundleCrc32: 'A06A3B3B', prefabPathId: '1867250883360921302',
    spritePathId: '-592003083375786832', texturePathId: '5964614618677259072',
    pngBytes: 233141, pngSha256: '072bde658943017dfc68e35ff97c4666cf74848bbe53112d5d9c772fd38c4c4c',
    pngBlob: '6be2c74265182254f82e02b8d9f9892d0682b69c', width: 381, height: 812,
    rgbaSha256: '1d8b9cc76fae447f5e09b1c7d2549968f2c97d03806e7c5eb24ddebbc12745fc'
  }],
  [10, {
    charImageId: 10,
    heroPainting: 'UI/HeroPainting/SSR_ABS/Prefab/Ledyn.prefab',
    shardPath: 'data/generated/hero-artwork-h-a5-index.v1/ui_heropainting_ssr_abs-b.json',
    shardRecordLocator: 'data/generated/hero-artwork-h-a5-index.v1/ui_heropainting_ssr_abs-b.json#heroes[heroId=10]',
    shardBlob: 'b6cb8f827367fc367af8c544aa6877a85bcfee32',
    packageName: 'InstallPage_1.1.113_61.zip', packageIndex: 60, packageBytes: 109027105,
    bundleName: 'ui_heropainting_ssr_abs.b', bundleBytes: 25793935,
    bundleMd5: '168B2D54E39D62B98CD1E92BDE9F787B',
    bundleSha256: '818942EA601B584D007D97A0E2A388554AFBAF6A83A36302E241601015D87492',
    bundleCrc32: '4682CEA2', prefabPathId: '1928234516739052579',
    spritePathId: '-4548386853997343781', texturePathId: '-5312052482424697931',
    pngBytes: 305265, pngSha256: 'd838076bde84825e594f22db9b87ed8b869f26b2dfddf7395c506982ee87d73d',
    pngBlob: 'b3d4096cef027a4932d805e95fd09cf0d66f9296', width: 607, height: 833,
    rgbaSha256: '0f01c4a82fe7cc07e6c8574a2da2ff10648594a19e67dab7addb59b2e7e6e8ec'
  }],
  [25, {
    charImageId: 25,
    heroPainting: 'UI/HeroPainting/SSR_ABS/Prefab/Alutemurat.prefab',
    shardPath: 'data/generated/hero-artwork-h-a5-index.v1/ui_heropainting_ssr_abs-b.json',
    shardRecordLocator: 'data/generated/hero-artwork-h-a5-index.v1/ui_heropainting_ssr_abs-b.json#heroes[heroId=25]',
    shardBlob: 'b6cb8f827367fc367af8c544aa6877a85bcfee32',
    packageName: 'InstallPage_1.1.113_61.zip', packageIndex: 60, packageBytes: 109027105,
    bundleName: 'ui_heropainting_ssr_abs.b', bundleBytes: 25793935,
    bundleMd5: '168B2D54E39D62B98CD1E92BDE9F787B',
    bundleSha256: '818942EA601B584D007D97A0E2A388554AFBAF6A83A36302E241601015D87492',
    bundleCrc32: '4682CEA2', prefabPathId: '8438785205446297998',
    spritePathId: '4814861067632038286', texturePathId: '1698989869838523429',
    pngBytes: 405481, pngSha256: '3f5862d8bb428bc3da433cbba7e147da9f10ffc76b67821abcb4602c1117adde',
    pngBlob: '2f50308ed297db01f9824bd0174a0b856fa69c6a', width: 548, height: 911,
    rgbaSha256: '3e466d8c0e00eab10a008f0dc21e7cfc35730e53df57714709a666487bef02c4'
  }]
]);

export async function validateHeroPortraitSelection(root = process.cwd()) {
  const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
  const evidence = await readJson('evidence/source/portraits/hero-portrait-selection.v1.json');
  const slice = await readJson('evidence/source/portraits/hero-portrait-slice.v1.json');
  const expansion = await readJson('evidence/source/portraits/hero-portrait-expansion.v1.json');
  const canonical = await readJson('canonical/heroes.v1.json');
  const generatedPath = resolve(root, 'generated/hero-slice.v1.json');
  const generatedBytes = await readFile(generatedPath);
  const generated = JSON.parse(generatedBytes.toString('utf8'));

  check(evidence.schemaVersion === 1 && evidence.canonical === false && evidence.generated === false
    && evidence.productionRuntimeDependency === false, 'evidence metadata drift');
  check(JSON.stringify(evidence.scope.heroIds) === JSON.stringify(targets)
    && JSON.stringify(evidence.scope.charImageIds) === JSON.stringify(targets), 'selection packet scope drift');
  check(evidence.source.repository === 'LuceatLuxVestra42/langrisser-future-guide'
    && evidence.source.commit === '6475e63ee23d18adf733756c26a14fa9e3ed662c'
    && evidence.source.heroInfo.path === 'data/configdata/ConfigDataHeroInfo.json'
    && evidence.source.heroInfo.gitBlobSha1 === '728daab3370f0c7779449663ea02e638677944d4'
    && evidence.source.charImageInfo.path === 'data/configdata/ConfigDataCharImageInfo.json'
    && evidence.source.charImageInfo.gitBlobSha1 === '397afb3e76c0fe4f3e424c04ba68459ff48d74c5', 'ConfigData source pin drift');
  check(evidence.source.heroInfo.rawRecordDirectlyInspected === false
    && evidence.source.charImageInfo.rawRecordDirectlyInspected === false, 'raw ConfigData direct-inspection limitation must remain explicit');
  check(evidence.source.frozenJoinValidation.path === reportPath
    && evidence.source.frozenJoinValidation.gitBlobSha1 === reportBlob
    && evidence.source.frozenJoinValidation.status === 'PASS'
    && evidence.source.frozenJoinValidation.sourceJoin === 'ConfigDataHeroInfo.CharImage_ID -> ConfigDataCharImageInfo.ID'
    && evidence.source.frozenJoinValidation.claimClass === 'B', 'frozen source-join validation anchor drift');
  check(evidence.predecessor.hA5Index.sourceIndexCommit === '68ab3c9c1e49fdc2f0bf2b0da324ac53da12b2fb'
    && evidence.predecessor.hA5Index.manifestSha256 === 'AC08E7A03B033A10269E330F4E60D3B6A72D68AC6C68EFED37F48372E4E462F6'
    && evidence.predecessor.hA6Materialization.status === 'PASS_H_A6_HERO_ARTWORK_MATERIALIZATION'
    && evidence.predecessor.hA6Materialization.exactPngHashMatchCount === 267
    && evidence.predecessor.hA6Materialization.exactDimensionMatchCount === 267, 'predecessor extraction/materialization anchor drift');
  check(evidence.predecessor.hA6Materialization.webManifestPath === 'data/generated/hero-artwork-h-a6-web-assets.v1.json'
    && evidence.predecessor.hA6Materialization.webManifestGitBlobSha1 === 'f8ab2f4e053d0c0012c7453c009b72363f5df0c6'
    && evidence.predecessor.hA6Materialization.webManifestSha256 === 'D9B949AA3BA97CF8E89CB27517CE2E47FAE1CE20E5790EFA6E1A5C0F65BFD40B',
  'H-A6 web asset manifest pin drift');
  check(Array.isArray(evidence.records) && JSON.stringify(evidence.records.map((r) => r.heroId)) === JSON.stringify(targets)
    && new Set(evidence.records.map((r) => r.heroId)).size === targets.length, 'selection evidence population must be exactly [1,10,25]');
  check(JSON.stringify(slice.scope.heroes) === JSON.stringify([5, 6, 8]) && slice.records.length === 3
    && JSON.stringify(expansion.scope.heroIds) === JSON.stringify([28, 32, 52, 53]) && expansion.records.length === 4,
  'existing slice or expansion population changed');
  check(JSON.stringify(canonical.records.map((r) => r.id)) === JSON.stringify(presentationIds)
    && JSON.stringify(generated.heroes.map((r) => r.id)) === JSON.stringify(presentationIds), 'Hero Presentation population changed');
  check(createHash('sha256').update(generatedBytes).digest('hex') === generatedSha256, 'Generated Hero slice byte parity mismatch');

  for (const row of evidence.records) {
    const want = expected.get(row.heroId);
    check(want && row.charImageId === want.charImageId, `frozen HeroInfo.CharImage_ID claim mismatch for ${row.heroId}`);
    check(row.heroPainting === want.heroPainting, `frozen CharImageInfo.HeroPainting claim mismatch for ${row.heroId}`);
    check(row.heroInfoLocator === `${reportPath}#representativeHeroes[heroId=${row.heroId}].charImageId`
      && row.charImageInfoLocator === `${reportPath}#representativeHeroes[heroId=${row.heroId}].values.HeroPainting`, `frozen report locator mismatch for ${row.heroId}`);
    check(row.relationClass === 'B' && row.charImageIdClass === 'B' && row.heroPaintingRoleClass === 'B'
      && row.sourceAssetClass === 'B' && row.reproducibilityClass === 'B', `inherited evidence class drift for ${row.heroId}`);

    const extraction = row.predecessorExtraction;
    check(extraction.recordPath === want.shardPath && extraction.recordGitBlobSha1 === want.shardBlob
      && extraction.recordLocator === want.shardRecordLocator
      && extraction.recordHeroId === row.heroId && extraction.sourceArtworkPath === want.heroPainting
      && extraction.selectionStatus === 'UNIQUE_REFERENCED_SPRITE', `H-A5 source selection mismatch for ${row.heroId}`);
    check(extraction.packageName === want.packageName && extraction.packageIndex === want.packageIndex
      && extraction.packageBytes === want.packageBytes && extraction.bundleName === want.bundleName
      && extraction.bundleBytes === want.bundleBytes && extraction.bundleMd5 === want.bundleMd5
      && extraction.bundleSha256 === want.bundleSha256 && extraction.bundleCrc32 === want.bundleCrc32,
    `H-A5 package/bundle provenance mismatch for ${row.heroId}`);
    check(extraction.prefabPathId === want.prefabPathId && extraction.spritePathId === want.spritePathId
      && extraction.texturePathId === want.texturePathId, `H-A5 Unity PPtr locator mismatch for ${row.heroId}`);

    const sourcePng = row.predecessorPng;
    const asset = row.extractedSourcePng;
    check(sourcePng.path === `public/images/heroes/cards/${row.heroId}.png`
      && sourcePng.recordLocator === `data/generated/hero-artwork-h-a6-web-assets.v1.json#records[heroId=${row.heroId}]`
      && sourcePng.gitBlobSha1 === want.pngBlob && sourcePng.bytes === want.pngBytes
      && sourcePng.sha256 === want.pngSha256 && sourcePng.width === want.width && sourcePng.height === want.height,
    `H-A6 source PNG manifest mismatch for ${row.heroId}`);
    check(sourcePng.bytes === asset.bytes && sourcePng.sha256 === asset.sha256
      && sourcePng.width === asset.width && sourcePng.height === asset.height
      && asset.path === `assets/portraits/hero-${row.heroId}.png` && asset.bytesClass === 'A', `asset metadata mismatch for ${row.heroId}`);
    const full = resolve(root, asset.path);
    check(full.startsWith(resolve(root) + sep), `asset path escapes repository for ${row.heroId}`);
    const bytes = await readFile(full);
    check(bytes.length === asset.bytes, `PNG byte length mismatch for ${row.heroId}`);
    check(createHash('sha256').update(bytes).digest('hex') === asset.sha256, `PNG SHA-256 mismatch for ${row.heroId}`);
    const gitSha = createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex');
    check(gitSha === sourcePng.gitBlobSha1, `PNG Git blob parity mismatch for ${row.heroId}`);
    check(bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])), `invalid PNG signature for ${row.heroId}`);
    check(bytes.readUInt32BE(16) === asset.width && bytes.readUInt32BE(20) === asset.height,
      `PNG dimensions mismatch for ${row.heroId}`);
    check(createHash('sha256').update(bytes).digest('hex') === want.pngSha256
      && want.rgbaSha256.length === 64, `verified PNG content pin mismatch for ${row.heroId}`);
  }
  process.stdout.write('Hero portrait selection: PASS (3 inherited source joins; 3 exact H-A5 Sprite selections; 3 PNG byte/hash/dimension matches; 7-Hero Generated parity)\n');
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  await validateHeroPortraitSelection();
}
