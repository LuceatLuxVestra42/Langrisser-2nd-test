import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';

const fail = (message) => { throw new Error(`Hero 15 portrait admission validation failed: ${message}`); };
const check = (condition, message) => { if (!condition) fail(message); };
const EXPECTED = {
  heroId: 15, charImageId: 15,
  commit: '6475e63ee23d18adf733756c26a14fa9e3ed662c',
  tree: '08e1e6c2773730e60b258940e31494f68d65f86a',
  heroBlob: '728daab3370f0c7779449663ea02e638677944d4',
  charBlob: '397afb3e76c0fe4f3e424c04ba68459ff48d74c5',
  heroPainting: 'UI/HeroPainting/SSR_ABS/Prefab/Riana.prefab',
  assetPath: 'assets/portraits/hero-15.png',
  sourcePngPath: 'public/images/heroes/cards/15.png',
  pngGitBlob: '1dbd9386854aa7058de28c164341c6c20059e145',
  pngSha256: '2caad36dfbc17e3c570b36fcd74e5674822d2a0fb20e6df6ff72a1640b903073',
  prefabPathId: '-2963065347005416898', spritePathId: '-8978779352212744004', texturePathId: '5164473921919823217',
  bundleSha256: '818942EA601B584D007D97A0E2A388554AFBAF6A83A36302E241601015D87492',
  bundleMd5: '168B2D54E39D62B98CD1E92BDE9F787B',
};
const presentationIds = [1,3,4,5,6,7,8,9,10,11,12,13,14,25,26,27,28,29,32,33,37,40,52,53,55,56,60,67,89];
const sha256 = (b) => createHash('sha256').update(b).digest('hex');
const gitBlobSha1 = (b) => createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex');

export async function validateHero15PortraitAdmission(root = process.cwd(), overrides = {}) {
  const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
  const ev = overrides.evidence ?? await readJson('evidence/source/portraits/hero-portrait-hero15.v1.json');
  const canonical = overrides.canonical ?? await readJson('canonical/heroes.v1.json');
  const generated = overrides.generated ?? await readJson('generated/hero-slice.v1.json');
  const integratedDecision = overrides.integratedDecision ?? await readJson('docs/decisions/hero-15-integrated-publication.v1.json');
  const talentDecision = overrides.talentDecision ?? await readJson('docs/decisions/hero-15-talent-publication.v1.json');
  check(ev.schemaVersion === 1 && ev.canonical === false && ev.generated === false && ev.productionRuntimeDependency === false, 'evidence metadata');
  check(ev.admissionScope === 'INTERNAL_HERO_PORTRAIT_ASSET_ONLY' && ev.publicationApproved === false, 'asset/publication boundary');
  check(ev.source.repository === 'LuceatLuxVestra42/langrisser-future-guide' && ev.source.commit === EXPECTED.commit && ev.source.tree === EXPECTED.tree, 'source commit/tree');
  const hero = ev.source.heroInfo, char = ev.source.charImageInfo;
  check(hero.path === 'data/configdata/ConfigDataHeroInfo.json' && hero.gitBlobSha1 === EXPECTED.heroBlob && hero.recordIndex === 14 && hero.locator === 'data/configdata/ConfigDataHeroInfo.json#records[14]/ID=15', 'HeroInfo pin/locator');
  check(hero.fields.ID === 15 && hero.fields.Useable === true && hero.fields.CharImage_ID === 15 && hero.fieldLocators.CharImage_ID === '#records[14]/CharImage_ID', 'HeroInfo explicit CharImage FK');
  check(char.path === 'data/configdata/ConfigDataCharImageInfo.json' && char.gitBlobSha1 === EXPECTED.charBlob && char.recordIndex === 13 && char.locator === 'data/configdata/ConfigDataCharImageInfo.json#records[13]/ID=15', 'CharImageInfo pin/locator');
  check(char.fields.ID === 15 && char.fields.HeroPainting === EXPECTED.heroPainting && char.fieldLocators.HeroPainting === '#records[13]/HeroPainting', 'CharImageInfo HeroPainting');
  const extraction = ev.predecessorExtraction;
  check(extraction.evidenceClass === 'B' && extraction.commit === EXPECTED.commit, 'predecessor evidence class/pin');
  check(extraction.manifest.path === 'data/generated/hero-artwork-h-a5-index.v1/manifest.json' && extraction.manifest.status === 'H_A5_BULK_EXTRACTION_INDEX_COMPLETE', 'H-A5 manifest provenance');
  check(extraction.finalValidation.path === 'data/validation/hero-artwork-h-a5-final.v1.json' && extraction.finalValidation.status === 'PASS_H_A5_BULK_EXTRACTION_INDEX_FINAL', 'H-A5 validation provenance');
  const row = extraction.record;
  check(row.path === 'data/generated/hero-artwork-h-a5-index.v1/ui_heropainting_ssr_abs-b.json' && row.locator === 'heroes[heroId=15]' && row.heroId === 15, 'H-A5 row locator');
  check(row.sourceArtworkPath === char.fields.HeroPainting && row.selectionStatus === 'UNIQUE_REFERENCED_SPRITE', 'selected base HeroPainting relation');
  check(row.prefabPathId === EXPECTED.prefabPathId && row.spritePathId === EXPECTED.spritePathId && row.texturePathIds.length === 1 && row.texturePathIds[0] === EXPECTED.texturePathId, 'Unity object path IDs');
  check(row.bundleSha256 === EXPECTED.bundleSha256 && row.bundleMd5 === EXPECTED.bundleMd5 && row.bundleName === 'ui_heropainting_ssr_abs.b' && row.packageName === 'InstallPage_1.1.113_61.zip', 'bundle/package provenance');
  check(extraction.limitations.length >= 3 && extraction.limitations.some((s) => s.includes('not re-extracted')), 'inherited extraction limitation');
  const a = ev.asset;
  check(a.path === EXPECTED.assetPath && a.sourcePath === EXPECTED.sourcePngPath && a.sourceCommit === EXPECTED.commit, 'asset locator/source');
  check(a.reextractionPerformed === false && a.transformation === 'Byte-for-byte copy from the pinned Legacy PNG path; no decode, recompression, resize, crop, or edit.', 'asset transformation');
  check(a.bytes === 183461 && a.sha256 === EXPECTED.pngSha256 && a.sourceGitBlobSha1 === EXPECTED.pngGitBlob && a.width === 362 && a.height === 682 && a.pngSignatureHex === '89504e470d0a1a0a', 'recorded PNG identity');
  const full = resolve(root, a.path);
  check(full.startsWith(resolve(root) + sep), 'asset path traversal');
  const bytes = overrides.assetBytes ?? await readFile(full);
  check(bytes.length === a.bytes && sha256(bytes) === a.sha256 && sha256(bytes) === EXPECTED.pngSha256, 'PNG byte length/SHA-256');
  check(gitBlobSha1(bytes) === a.sourceGitBlobSha1 && gitBlobSha1(bytes) === EXPECTED.pngGitBlob, 'PNG Git blob SHA-1');
  check(bytes.length >= 24 && bytes.subarray(0, 8).toString('hex') === '89504e470d0a1a0a', 'PNG signature');
  check(bytes.readUInt32BE(16) === a.width && bytes.readUInt32BE(20) === a.height, 'PNG dimensions');
  check(JSON.stringify(canonical.records.map((r) => r.id)) === JSON.stringify(presentationIds), 'Hero presentation canonical 29 population changed');
  check(JSON.stringify(generated.heroes.map((r) => r.id)) === JSON.stringify(presentationIds), 'generated Hero presentation 29 population changed');
  check(!canonical.records.some((r) => r.id === 15 && r.portrait === a.path), 'Hero 15 portrait added to presentation canonical');
  check(integratedDecision.status === 'APPROVED' && !JSON.stringify(integratedDecision).includes(a.path), 'existing integrated publication decision changed');
  check(talentDecision.status === 'APPROVED' && !JSON.stringify(talentDecision).includes(a.path), 'talent publication decision changed');
  check(ev.claimAssessment.find((x) => x.claim === 'Portrait publication')?.status === 'NOT_APPROVED', 'portrait publication boundary claim');
  return { assetPath: a.path, bytes: bytes.length, sha256: sha256(bytes), gitBlobSha1: gitBlobSha1(bytes), dimensions: `${a.width}x${a.height}`, sourceRelation: 'PASS', inheritedUnityExtraction: 'PASS_WITH_B_LIMITATION', presentationPopulation: 29, publication: 'NOT_APPROVED' };
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await validateHero15PortraitAdmission();
  process.stdout.write(`Hero 15 portrait admission: PASS (${result.bytes} bytes; ${result.dimensions}; Source SHA-256/Git blob match; public exclusion scope preserved)\n`);
}
