import { cp, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { renderGenerated, renderSpSoldiers, renderJobGlossary, renderGeneralSsrEquipment } from './generate.mjs';

const readJson = async (path) => JSON.parse(await readFile(resolve(path), 'utf8'));
const exactKeys = (value, expected, label) => {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) {
    throw new Error(`${label} fields were ${actual.join(',')}; expected ${wanted.join(',')}`);
  }
};

const canonical = await readJson('canonical/heroes.v1.json');
const heroLocalization = await readJson('canonical/hero-localizations-ko.v1.json');
const jobLocalization = await readJson('canonical/job-localizations-ko.v1.json');
const exclusiveRelations = await readJson('canonical/hero-exclusive-equipment-relations.v1.json');
const exclusiveLocalizations = await readJson('canonical/exclusive-equipment-localizations-ko.v1.json');
const generatedPath = resolve('generated/hero-slice.v1.json');
const generatedText = await readFile(generatedPath, 'utf8');
const expectedGenerated = renderGenerated(canonical, heroLocalization, jobLocalization, exclusiveRelations, exclusiveLocalizations);
if (generatedText !== expectedGenerated) {
  throw new Error('generated consumer is stale or non-deterministic relative to canonical input');
}
const glossaryPath = resolve('generated/job-glossary.v1.json');
const glossaryText = await readFile(glossaryPath, 'utf8');
if (glossaryText !== renderJobGlossary(jobLocalization)) throw new Error('generated Job glossary is stale or non-deterministic');
const glossary = JSON.parse(glossaryText);
exactKeys(glossary, ['schemaVersion', 'jobs'], 'generated Job glossary');
if (glossary.schemaVersion !== 1 || !Array.isArray(glossary.jobs) || glossary.jobs.length !== jobLocalization.records.length) {
  throw new Error('built document has unsupported Job glossary presentation schema');
}

const equipmentIdentity = await readJson('canonical/general-ssr-equipment.v1.json');
const equipmentLocalization = await readJson('canonical/general-ssr-equipment-localizations-ko.v1.json');
const equipmentGeneratedPath = resolve('generated/general-ssr-equipment.v1.json');
const equipmentGeneratedText = await readFile(equipmentGeneratedPath, 'utf8');
if (equipmentGeneratedText !== renderGeneralSsrEquipment(equipmentIdentity, equipmentLocalization)) throw new Error('generated General SSR Equipment is stale or non-deterministic');
const equipmentGenerated = JSON.parse(equipmentGeneratedText);
exactKeys(equipmentGenerated, ['schemaVersion', 'equipment'], 'generated General SSR Equipment');
if (equipmentGenerated.schemaVersion !== 1 || !Array.isArray(equipmentGenerated.equipment) || equipmentGenerated.equipment.length !== 206) throw new Error('unsupported General SSR Equipment presentation schema');
for (const item of equipmentGenerated.equipment) {
  exactKeys(item, ['equipmentId', 'nameKo', 'effectDescriptionKo'], 'General SSR Equipment ' + item.equipmentId);
  if (!Number.isInteger(item.equipmentId) || typeof item.nameKo !== 'string' || !item.nameKo.trim() || typeof item.effectDescriptionKo !== 'string' || !item.effectDescriptionKo.trim()) throw new Error('malformed General SSR Equipment presentation');
}

const [soldierIdentities, soldierLocalizations, normalSoldierLocalizations, soldierBaseStats, soldierRelations, normalSoldierBaseStats] = await Promise.all([
  readJson('canonical/soldiers.v1.json'),
  readJson('canonical/sp-soldier-localizations-ko.v1.json'),
  readJson('canonical/normal-soldier-localizations-ko.v1.json'),
  readJson('canonical/sp-soldier-base-stats.v1.json'),
  readJson('canonical/sp-soldier-normal-relations.v1.json'),
  readJson('canonical/normal-soldier-base-stats.v1.json'),
]);
const spGeneratedPath = resolve('generated/sp-soldiers.v1.json');
const spGeneratedText = await readFile(spGeneratedPath, 'utf8');
const expectedSpGenerated = renderSpSoldiers(soldierIdentities, soldierLocalizations, normalSoldierLocalizations, soldierBaseStats, soldierRelations, normalSoldierBaseStats);
if (spGeneratedText !== expectedSpGenerated) throw new Error('generated SP Soldier data is stale or non-deterministic');
const spGenerated = JSON.parse(spGeneratedText);
if (spGenerated.schemaVersion !== 1 || !Array.isArray(spGenerated.soldiers) || spGenerated.soldiers.length !== 56) throw new Error('built document has unsupported SP Soldier presentation schema');
for (const soldier of spGenerated.soldiers) {
  exactKeys(soldier, ['spSoldierId', 'nameKo', 'normalSoldierId', 'normalSoldierNameKo', 'baseStats', 'normalSoldierBaseStats'], `SP Soldier ${soldier.spSoldierId}`);
  if (!Number.isInteger(soldier.normalSoldierId) || typeof soldier.normalSoldierNameKo !== 'string' || !soldier.normalSoldierNameKo) {
    throw new Error(`malformed NORMAL Soldier presentation for SP Soldier ${soldier.spSoldierId}`);
  }
  exactKeys(soldier.normalSoldierBaseStats, ['hp', 'attack', 'defense', 'magicDefense'], `NORMAL Soldier ${soldier.normalSoldierId} base stats`);
  if (!Object.values(soldier.normalSoldierBaseStats).every(Number.isFinite)) throw new Error(`malformed NORMAL Soldier base stats for SP Soldier ${soldier.spSoldierId}`);
}

const generated = JSON.parse(generatedText);
exactKeys(generated, ['schemaVersion', 'heroes'], 'generated consumer');
if (generated.schemaVersion !== 1 || !Array.isArray(generated.heroes)) throw new Error('unsupported generated consumer schema');
for (const hero of generated.heroes) {
  exactKeys(hero, ['id', 'nameEng', 'nameKo', 'portrait', 'jobConnections', 'exclusiveEquipment'], `generated Hero ${hero.id}`);
  if (!Number.isInteger(hero.id) || typeof hero.nameEng !== 'string' || !hero.nameEng || typeof hero.nameKo !== 'string' || !hero.nameKo || !Array.isArray(hero.jobConnections)) {
    throw new Error(`malformed generated Hero ${String(hero.id)}`);
  }
  for (const relation of hero.jobConnections) {
    exactKeys(relation, ['connectionId', 'jobId', 'sourceField', 'jobNameKo'], `generated Hero ${hero.id} Job relation`);
    if (!Number.isInteger(relation.connectionId) || !Number.isInteger(relation.jobId) || typeof relation.sourceField !== 'string'
      || typeof relation.jobNameKo !== 'string' || !relation.jobNameKo) {
      throw new Error(`malformed generated Job relation for Hero ${hero.id}`);
    }
  }
  exactKeys(hero.exclusiveEquipment, ['equipmentId', 'equipmentNameKo', 'effectDescriptionKo'], `generated Hero ${hero.id} Exclusive Equipment`);
  if (!Number.isInteger(hero.exclusiveEquipment.equipmentId) || typeof hero.exclusiveEquipment.equipmentNameKo !== 'string'
    || !hero.exclusiveEquipment.equipmentNameKo || typeof hero.exclusiveEquipment.effectDescriptionKo !== 'string' || !hero.exclusiveEquipment.effectDescriptionKo) {
    throw new Error(`malformed Exclusive Equipment presentation for Hero ${hero.id}`);
  }
}
const portraitPaths = [...new Set(generated.heroes.map((hero) => hero.portrait))];

const output = await mkdtemp(join(tmpdir(), 'langrisser-hero-slice-build-'));
try {
  await mkdir(join(output, 'generated'), { recursive: true });
  for (const file of ['index.html', 'app.js', 'styles.css']) await cp(resolve(file), join(output, file));
  await cp(generatedPath, join(output, 'generated', 'hero-slice.v1.json'));
  await cp(spGeneratedPath, join(output, 'generated', 'sp-soldiers.v1.json'));
  await cp(glossaryPath, join(output, 'generated', 'job-glossary.v1.json'));
  await cp(equipmentGeneratedPath, join(output, 'generated', 'general-ssr-equipment.v1.json'));

  for (const portraitPath of portraitPaths) {
    if (typeof portraitPath !== 'string' || !/^assets\/portraits\/[^/]+\.png$/.test(portraitPath)) {
      throw new Error(`unsupported generated portrait path: ${String(portraitPath)}`);
    }
    const destination = join(output, ...portraitPath.split('/'));
    await mkdir(dirname(destination), { recursive: true });
    await cp(resolve(portraitPath), destination);
  }

  const [html, app] = await Promise.all([
    readFile(join(output, 'index.html'), 'utf8'),
    readFile(join(output, 'app.js'), 'utf8'),
  ]);
  if (!html.includes('./app.js') || !html.includes('./styles.css')) {
    throw new Error('built document is missing app or style entry');
  }
  if (!app.includes("fetch('./generated/hero-slice.v1.json')")) {
    throw new Error('built app does not resolve the generated Hero data entry');
  }
  if (!app.includes("fetch('./generated/sp-soldiers.v1.json')")) throw new Error('built app does not resolve the generated SP Soldier data entry');
  if (!app.includes("fetch('./generated/job-glossary.v1.json')")) throw new Error('built app does not resolve the generated Job glossary entry');
  if (!app.includes("fetch('./generated/general-ssr-equipment.v1.json')")) throw new Error('built app does not resolve the generated General SSR Equipment entry');
  const packagedEquipment = JSON.parse(await readFile(join(output, 'generated', 'general-ssr-equipment.v1.json'), 'utf8'));
  if (packagedEquipment.equipment.length !== 206) throw new Error('packaged General SSR Equipment count mismatch');
  const packagedGlossary = JSON.parse(await readFile(join(output, 'generated', 'job-glossary.v1.json'), 'utf8'));

  process.stdout.write(`Static build: PASS (${output}; fresh Hero, ${spGenerated.soldiers.length} SP Soldier, ${packagedGlossary.jobs.length} Job glossary, and ${packagedEquipment.equipment.length} General SSR Equipment records packaged, ${portraitPaths.length} portrait assets resolved)\n`);
} finally {
  await rm(output, { recursive: true, force: true });
}
