import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';

const fail = (message) => { throw new Error('Hero portrait expansion validation failed: ' + message); };
const check = (condition, message) => { if (!condition) fail(message); };
const targets = [28, 32, 52, 53];
const legacyPortraitIds = [5, 6, 8];
const presentationIds = [5, 6, 8, 28, 32, 52, 53];

export async function validateHeroPortraitExpansion(root = process.cwd()) {
  const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
  const evidence = await readJson('evidence/source/portraits/hero-portrait-expansion.v1.json');
  const charDoc = await readJson('evidence/source/configdata/ConfigDataCharImageInfo.records-hero-expansion.v1.json');
  const charRows = charDoc.records;
  const heroRows = await readJson('evidence/source/configdata/ConfigDataHeroInfo.records-hero-expansion.v1.json');
  const canonical = await readJson('canonical/heroes.v1.json');
  const slice = await readJson('evidence/source/portraits/hero-portrait-slice.v1.json');
  const prior = await readJson('evidence/source/portraits/hero-portrait-prior-validation.v1.json');
  const generated = await readJson('generated/hero-slice.v1.json');
  check(evidence.schemaVersion === 1 && evidence.canonical === false && evidence.generated === false && evidence.productionRuntimeDependency === false, 'evidence metadata drift');
  check(evidence.source.repository === 'LuceatLuxVestra42/langrisser-future-guide' && evidence.source.commit === '6475e63ee23d18adf733756c26a14fa9e3ed662c' && evidence.source.heroInfo.gitBlobSha1 === '728daab3370f0c7779449663ea02e638677944d4' && evidence.source.charImageInfo.gitBlobSha1 === '397afb3e76c0fe4f3e424c04ba68459ff48d74c5', 'ConfigData source pin drift');
  check(JSON.stringify(evidence.scope.heroIds) === JSON.stringify(targets), 'portrait target scope drift');
  check(Array.isArray(evidence.records) && JSON.stringify(evidence.records.map((r) => r.heroId)) === JSON.stringify(targets), 'portrait evidence population must contain exactly [28,32,52,53] in stable order');
  check(Array.isArray(charRows) && JSON.stringify(charRows.map((r) => r.ID)) === JSON.stringify(targets) && new Set(charRows.map((r) => r.ID)).size === 4, 'preserved CharImageInfo ID population drift');
  check(Array.isArray(heroRows) && targets.every((id) => heroRows.filter((r) => r.ID === id).length === 1), 'HeroInfo target ID resolution is not unique');
  check(JSON.stringify(canonical.records.map((r) => r.id)) === JSON.stringify(presentationIds), 'presentation canonical population must be exactly [5,6,8,28,32,52,53]');
  check(JSON.stringify(generated.heroes.map((r) => r.id)) === JSON.stringify(presentationIds), 'generated presentation population must be exactly [5,6,8,28,32,52,53]');
  check(JSON.stringify(slice.scope.heroes) === JSON.stringify(legacyPortraitIds) && slice.records.length === 3 && prior.records.length === 3, 'existing Hero 5/6/8 evidence scope changed');
  const sourceHeroes = new Map(heroRows.map((row) => [row.ID, row]));
  const sourceChars = new Map(charRows.map((row) => [row.ID, row]));
  for (const row of evidence.records) {
    const h = sourceHeroes.get(row.heroId);
    const c = sourceChars.get(row.charImageId);
    check(h && h.CharImage_ID === row.charImageId, 'HeroInfo explicit CharImage_ID mismatch for ' + row.heroId);
    check(c && c.HeroPainting === row.heroPainting, 'CharImageInfo exact ID / HeroPainting mismatch for ' + row.heroId);
    check(row.relationClass === 'B' && row.charImageIdClass === 'A' && row.heroPaintingRoleClass === 'B' && row.sourceAssetClass === 'B' && row.reproducibilityClass === 'B', 'portrait claim class drift for ' + row.heroId);
    check(row.heroInfoLocator === 'evidence/source/configdata/ConfigDataHeroInfo.records-hero-expansion.v1.json#ID=' + row.heroId + '/CharImage_ID' && row.charImageInfoLocator === 'evidence/source/configdata/ConfigDataCharImageInfo.records-hero-expansion.v1.json#ID=' + row.charImageId, 'source locator mismatch for ' + row.heroId);
    const extraction = row.predecessorExtraction;
    const sourcePng = row.predecessorPng;
    const asset = row.extractedSourcePng;
    check(extraction.heroId === row.heroId && extraction.sourceArtworkPath === row.heroPainting && extraction.selectionStatus === 'UNIQUE_REFERENCED_SPRITE', 'extraction record/selection mismatch for ' + row.heroId);
    check(/^-?\d+$/.test(extraction.prefabPathId) && /^-?\d+$/.test(extraction.spritePathId) && /^-?\d+$/.test(extraction.texturePathId), 'Unity object path IDs invalid for ' + row.heroId);
    check(extraction.recordGitBlobSha1 && extraction.bundleSha256 && extraction.bundleMd5 && extraction.bundleCrc32 && extraction.bundleBytes > 0 && extraction.packageBytes > 0, 'bundle/package provenance incomplete for ' + row.heroId);
    check(sourcePng.path === 'public/images/heroes/cards/' + row.heroId + '.png' && sourcePng.gitBlobSha1 && asset.path === 'assets/portraits/hero-' + row.heroId + '.png', 'PNG locator mismatch for ' + row.heroId);
    check(sourcePng.bytes === asset.bytes && sourcePng.sha256 === asset.sha256 && sourcePng.width === asset.width && sourcePng.height === asset.height, 'recorded PNG metadata mismatch for ' + row.heroId);
    const full = resolve(root, asset.path);
    check(full.startsWith(resolve(root) + sep), 'asset path escapes repository for ' + row.heroId);
    const bytes = await readFile(full);
    check(bytes.length === asset.bytes, 'PNG byte length mismatch for ' + row.heroId);
    check(createHash('sha256').update(bytes).digest('hex') === asset.sha256, 'PNG SHA-256 mismatch for ' + row.heroId);
    const gitSha = createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex');
    check(gitSha === sourcePng.gitBlobSha1, 'PNG Git blob parity mismatch for ' + row.heroId);
    check(bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])), 'invalid PNG signature for ' + row.heroId);
    check(bytes.readUInt32BE(16) === asset.width && bytes.readUInt32BE(20) === asset.height && asset.width > 0 && asset.height > 0, 'PNG dimensions mismatch for ' + row.heroId);
  }
  const union = [...new Set([...legacyPortraitIds, ...evidence.records.map((r) => r.heroId)])].sort((a, b) => a - b);
  check(JSON.stringify(union) === JSON.stringify([5,6,8,28,32,52,53]), 'portrait evidence population union must be exactly [5,6,8,28,32,52,53]');
  process.stdout.write('Hero portrait expansion: PASS (7 portrait evidence IDs; 7 presentation canonical IDs; exact source and PNG blob parity)\n');
}
await validateHeroPortraitExpansion();
