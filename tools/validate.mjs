import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { renderGenerated } from './generate.mjs';

const root = process.cwd();
const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const exactKeys = (value, expected, label) => {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) {
    throw new Error(`${label} fields were ${actual.join(',')}; expected ${wanted.join(',')}`);
  }
};
const check = (condition, message) => { if (!condition) throw new Error(message); };

const canonical = await readJson('canonical/heroes.v1.json');
exactKeys(canonical, ['schemaVersion', 'sourceScope', 'records'], 'canonical');
check(canonical.schemaVersion === 1, 'unsupported canonical schemaVersion');
check(canonical.sourceScope === 'CN ConfigData snapshot 2026-09-02', 'canonical source scope drift');
const expected = new Map([[5, 'Chris'], [6, 'Leon'], [8, 'Lana']]);
check(canonical.records.length === expected.size, 'canonical must contain exactly three Heroes');
const ids = canonical.records.map((record) => record.id);
check(new Set(ids).size === ids.length, 'duplicate canonical Hero ID');
check(JSON.stringify([...ids].sort((a, b) => a - b)) === '[5,6,8]', 'canonical Hero IDs must be exactly 5, 6, and 8');

const heroInfoRows = await readJson('evidence/source/configdata/ConfigDataHeroInfo.records-5-6-8.json');
const heroInfoById = new Map(heroInfoRows.map((record) => [record.ID, record]));
const charRows = await readJson('evidence/source/configdata/ConfigDataCharImageInfo.records-5-6-8.json');
const charById = new Map(charRows.map((record) => [record.ID, record]));
const portraits = await readJson('evidence/source/portraits/hero-portrait-slice.v1.json');
const portraitByHero = new Map(portraits.records.map((record) => [record.heroId, record]));
check(portraits.canonical === false && portraits.generated === false, 'portrait evidence must remain source evidence');
check(portraits.productionRuntimeDependency === false, 'evidence metadata must not become a runtime dependency');
check(portraits.scope.krDisplayName === 'C_DEFERRED' && portraits.scope.rankToRarity === 'C_DEFERRED', 'deferred claim status drift');
check(portraits.admissionBasis.contradictions.length === 0, 'unresolved contradiction exists in the admitted slice scope');
check(portraits.sourceRecords.charImageInfo.sourceGitBlobSha1 === '397afb3e76c0fe4f3e424c04ba68459ff48d74c5', 'CharImageInfo source locator drift');
check(portraits.sourceRecords.charImageInfo.sourceSha256 === '3a412fa72f8e4626bc5a723b8bede6a5b0f9032711bc3922f4234ea322b8582a', 'CharImageInfo source hash drift');
check(portraits.extraction.procedure.scriptGitBlobSha1 === 'a13be98a59dadcfc95e2287c138ff56e76b86518', 'extraction procedure locator drift');

for (const record of canonical.records) {
  exactKeys(record, ['id', 'nameEng', 'portrait', 'provenance'], `Hero ${record.id}`);
  exactKeys(record.provenance, ['identity', 'nameEng', 'portrait'], `Hero ${record.id} provenance`);
  check(expected.get(record.id) === record.nameEng, `Hero ${record.id} Name_Eng differs from admitted expected value`);
  const sourceHero = heroInfoById.get(record.id);
  check(sourceHero, `missing HeroInfo source record ${record.id}`);
  check(sourceHero.Name_Eng === record.nameEng, `Hero ${record.id} Name_Eng differs from raw source`);
  check(record.provenance.identity.includes(`#ID=${record.id}`), `Hero ${record.id} identity provenance locator missing`);
  check(record.provenance.nameEng.includes(`#ID=${record.id}/Name_Eng`), `Hero ${record.id} Name_Eng provenance locator missing`);

  const portrait = portraitByHero.get(record.id);
  check(portrait, `missing portrait evidence record ${record.id}`);
  check(portrait.charImageIdClass === 'A', `Hero ${record.id} P1 raw CharImage_ID must remain A`);
  check(portrait.relationClass === 'B' && portrait.heroPaintingRoleClass === 'B' && portrait.sourceAssetClass === 'B' && portrait.reproducibilityClass === 'B', `Hero ${record.id} P2–P5 must remain B`);
  check(sourceHero.CharImage_ID === portrait.charImageId, `Hero ${record.id} raw CharImage_ID does not match its source evidence value`);
  const charImage = charById.get(sourceHero.CharImage_ID);
  check(charImage, `CharImageInfo foreign-key lookup unresolved for Hero ${record.id}`);
  check(charImage.HeroPainting === portrait.heroPainting, `Hero ${record.id} HeroPainting differs from preserved source row`);
  check(record.provenance.portrait.endsWith(`#heroId=${record.id}`), `Hero ${record.id} portrait provenance locator missing`);
  check(record.portrait === portrait.extractedSourcePng.path, `Hero ${record.id} canonical portrait path differs from evidence`);
  check(/^assets\/portraits\/hero-(5|6|8)\.png$/.test(record.portrait), `Hero ${record.id} portrait path outside slice asset scope`);
  check(/^[-]?\d+$/.test(portrait.prefabPathId) && /^[-]?\d+$/.test(portrait.spritePathId) && /^[-]?\d+$/.test(portrait.texturePathId), `Hero ${record.id} Unity path IDs must be exact decimal strings`);
  const assetPath = resolve(root, record.portrait);
  check(assetPath.startsWith(`${root}${sep}`), `Hero ${record.id} portrait path escapes repository`);
  const bytes = await readFile(assetPath);
  const digest = createHash('sha256').update(bytes).digest('hex');
  check(bytes.length === portrait.extractedSourcePng.bytes, `Hero ${record.id} portrait byte length mismatch`);
  check(digest === portrait.extractedSourcePng.sha256, `Hero ${record.id} portrait SHA-256 mismatch`);
  check(portrait.extractedSourcePng.width > 0 && portrait.extractedSourcePng.height > 0, `Hero ${record.id} portrait dimensions invalid`);
}

const expectedGenerated = renderGenerated(canonical);
const generated = await readFile(resolve(root, 'generated/hero-slice.v1.json'), 'utf8');
check(generated === expectedGenerated, 'generated consumer is stale or non-deterministic relative to canonical input');
const generatedJson = JSON.parse(generated);
exactKeys(generatedJson, ['schemaVersion', 'heroes'], 'generated consumer');
check(generatedJson.heroes.every((hero) => JSON.stringify(Object.keys(hero).sort()) === JSON.stringify(['id', 'nameEng', 'portrait'])), 'generated consumer contains non-presentation fields');

process.stdout.write('Hero slice validator: PASS (identity, Name_Eng, P1–P5 provenance, asset hashes, generated freshness; deferred semantics excluded)\n');
