import { cp, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { renderGenerated, renderSpSoldiers, renderNormalSoldiers, renderJobGlossary, renderGeneralSsrEquipment, renderExclusiveEquipment } from './generate.mjs';

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
if (equipmentGeneratedText !== renderGeneralSsrEquipment(equipmentIdentity, equipmentLocalization)) throw new Error('undefined is stale or non-deterministic');
const equipmentGenerated = JSON.parse(equipmentGeneratedText);
exactKeys(equipmentGenerated, ['schemaVersion', 'equipment'], 'generated General SSR Equipment');
if (equipmentGenerated.schemaVersion !== 1 || !Array.isArray(equipmentGenerated.equipment)) throw new Error('unsupported General SSR Equipment presentation schema');
if (equipmentGenerated.equipment.length !== equipmentIdentity.records.length) throw new Error('General SSR Equipment generated/canonical count mismatch');
const generatedEquipmentIds = equipmentGenerated.equipment.map((item) => item.equipmentId);
if (generatedEquipmentIds.some((id) => !Number.isInteger(id)) || new Set(generatedEquipmentIds).size !== generatedEquipmentIds.length) throw new Error('General SSR Equipment generated IDs are malformed or duplicated');
for (const item of equipmentGenerated.equipment) {
  exactKeys(item, ['equipmentId', 'nameKo', 'effectDescriptionKo'], 'General SSR Equipment ' + item.equipmentId);
  if (!Number.isInteger(item.equipmentId) || typeof item.nameKo !== 'string' || !item.nameKo.trim() || typeof item.effectDescriptionKo !== 'string' || !item.effectDescriptionKo.trim()) throw new Error('malformed General SSR Equipment presentation');
}

const exclusiveEquipmentIdentity = await readJson('canonical/exclusive-equipment.v1.json');
const exclusiveEquipmentLocalization = await readJson('canonical/exclusive-equipment-localizations-ko.v1.json');
const exclusiveEquipmentGeneratedPath = resolve('generated/exclusive-equipment.v1.json');
const exclusiveEquipmentGeneratedText = await readFile(exclusiveEquipmentGeneratedPath, 'utf8');
if (exclusiveEquipmentGeneratedText !== renderExclusiveEquipment(exclusiveEquipmentIdentity, exclusiveEquipmentLocalization)) throw new Error('generated Exclusive Equipment is stale or non-deterministic');
const exclusiveEquipmentGenerated = JSON.parse(exclusiveEquipmentGeneratedText);
exactKeys(exclusiveEquipmentGenerated, ['schemaVersion', 'equipment'], 'generated Exclusive Equipment');
if (exclusiveEquipmentGenerated.schemaVersion !== 1 || !Array.isArray(exclusiveEquipmentGenerated.equipment) || exclusiveEquipmentGenerated.equipment.length !== 167) throw new Error('unsupported Exclusive Equipment presentation schema or count');
const exclusiveEquipmentIds = exclusiveEquipmentGenerated.equipment.map((item) => item.equipmentId);
if (exclusiveEquipmentIds.some((id) => !Number.isSafeInteger(id)) || new Set(exclusiveEquipmentIds).size !== 167) throw new Error('Exclusive Equipment generated IDs are malformed or duplicated');
for (const item of exclusiveEquipmentGenerated.equipment) {
  exactKeys(item, ['equipmentId', 'nameKo', 'effectDescriptionKo'], 'Exclusive Equipment ' + item.equipmentId);
  if (typeof item.nameKo !== 'string' || !item.nameKo.trim() || typeof item.effectDescriptionKo !== 'string' || !item.effectDescriptionKo.trim()) throw new Error('malformed Exclusive Equipment presentation');
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

const normalSoldierGeneratedPath = resolve('generated/normal-soldiers.v1.json');
const normalSoldierGeneratedText = await readFile(normalSoldierGeneratedPath, 'utf8');
if (normalSoldierGeneratedText !== renderNormalSoldiers(soldierIdentities, normalSoldierLocalizations, normalSoldierBaseStats)) {
  throw new Error('generated NORMAL Soldier data is stale or non-deterministic');
}
const normalSoldierGenerated = JSON.parse(normalSoldierGeneratedText);
if (normalSoldierGenerated.schemaVersion !== 1 || !Array.isArray(normalSoldierGenerated.soldiers) || normalSoldierGenerated.soldiers.length !== 56) {
  throw new Error('built document has unsupported NORMAL Soldier presentation schema');
}
for (const soldier of normalSoldierGenerated.soldiers) {
  exactKeys(soldier, ['normalSoldierId', 'nameKo', 'baseStats'], `NORMAL Soldier ${soldier.normalSoldierId}`);
  if (!Number.isInteger(soldier.normalSoldierId) || typeof soldier.nameKo !== 'string' || !soldier.nameKo.trim()) {
    throw new Error(`malformed NORMAL Soldier presentation ${String(soldier.normalSoldierId)}`);
  }
  exactKeys(soldier.baseStats, ['hp', 'attack', 'defense', 'magicDefense'], `NORMAL Soldier ${soldier.normalSoldierId} base stats`);
  if (!Object.values(soldier.baseStats).every(Number.isFinite)) throw new Error(`malformed NORMAL Soldier base stats for ${soldier.normalSoldierId}`);
}

const heroSoldierRelationPath = resolve('generated/hero-soldier-relations.v1.json');
const heroSoldierRelationText = await readFile(heroSoldierRelationPath, 'utf8');
const heroSoldierRelations = JSON.parse(heroSoldierRelationText);
exactKeys(heroSoldierRelations, ['schemaVersion', 'relations'], 'generated Hero–Soldier relations');
if (heroSoldierRelations.schemaVersion !== 1 || !Array.isArray(heroSoldierRelations.relations)) {
  throw new Error('unsupported generated Hero–Soldier relation presentation schema');
}

const heroIds = new Set(JSON.parse(generatedText).heroes.map((hero) => hero.id));
const candidateHeroIds = [5, 6, 8, 53];
const expectedRowsByHero = new Map([[5, 19], [6, 15], [8, 20], [53, 18]]);
const soldierPresentationById = new Map();
for (const soldier of normalSoldierGenerated.soldiers) {
  if (soldierPresentationById.has(soldier.normalSoldierId)) throw new Error(`duplicate Soldier presentation ID ${soldier.normalSoldierId}`);
  soldierPresentationById.set(soldier.normalSoldierId, soldier);
}
for (const soldier of spGenerated.soldiers) {
  if (soldierPresentationById.has(soldier.spSoldierId)) throw new Error(`duplicate Soldier presentation ID ${soldier.spSoldierId}`);
  soldierPresentationById.set(soldier.spSoldierId, soldier);
}
const frontendPairs = new Set();
const frontendRowsByHero = new Map(candidateHeroIds.map((heroId) => [heroId, 0]));
const frontendSoldierIds = new Set();
for (const relation of heroSoldierRelations.relations) {
  exactKeys(relation, ['heroId', 'soldierId'], 'generated Hero–Soldier relation pair');
  if (!Number.isSafeInteger(relation.heroId) || !Number.isSafeInteger(relation.soldierId)
    || !candidateHeroIds.includes(relation.heroId) || !heroIds.has(relation.heroId)) {
    throw new Error('Hero–Soldier relation has an invalid or out-of-scope Hero endpoint');
  }
  const pair = `${relation.heroId}:${relation.soldierId}`;
  if (frontendPairs.has(pair)) throw new Error(`duplicate frontend relation mapping ${pair}`);
  frontendPairs.add(pair);
  const soldier = soldierPresentationById.get(relation.soldierId);
  if (!soldier || typeof soldier.nameKo !== 'string' || !soldier.nameKo.trim()) {
    throw new Error(`unresolved Soldier presentation ID ${relation.soldierId}`);
  }
  frontendSoldierIds.add(relation.soldierId);
  frontendRowsByHero.set(relation.heroId, frontendRowsByHero.get(relation.heroId) + 1);
}
if (frontendPairs.size !== 72 || frontendSoldierIds.size !== 56) throw new Error('Hero–Soldier frontend mapping migration invariant mismatch');
for (const [heroId, expectedCount] of expectedRowsByHero) {
  if (frontendRowsByHero.get(heroId) !== expectedCount) throw new Error(`Hero ${heroId} frontend relation mapping count mismatch`);
}
if ([28, 32, 52].some((heroId) => frontendRowsByHero.has(heroId))) {
  throw new Error('out-of-scope Hero has an inferred frontend relation mapping');
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
const portraitExpansion = await readJson('evidence/source/portraits/hero-portrait-expansion.v1.json');
if (JSON.stringify(generated.heroes.map((hero) => hero.id)) !== '[5,6,8,28,32,52,53]') throw new Error('presentation canonical population must be exactly [5,6,8,28,32,52,53]');
if (JSON.stringify(portraitExpansion.records.map((record) => record.heroId)) !== '[28,32,52,53]') throw new Error('portrait evidence population drift');
const portraitPaths = [...new Set([...generated.heroes.map((hero) => hero.portrait), ...portraitExpansion.records.map((record) => record.extractedSourcePng.path)])];
if (portraitPaths.length !== 7) throw new Error('static package must contain exactly seven evidence-backed portrait assets');

const output = await mkdtemp(join(tmpdir(), 'langrisser-hero-slice-build-'));
try {
  await mkdir(join(output, 'generated'), { recursive: true });
  for (const file of ['index.html', 'app.js', 'styles.css']) await cp(resolve(file), join(output, file));
  await cp(generatedPath, join(output, 'generated', 'hero-slice.v1.json'));
  await cp(spGeneratedPath, join(output, 'generated', 'sp-soldiers.v1.json'));
  await cp(normalSoldierGeneratedPath, join(output, 'generated', 'normal-soldiers.v1.json'));
  await cp(heroSoldierRelationPath, join(output, 'generated', 'hero-soldier-relations.v1.json'));
  await cp(glossaryPath, join(output, 'generated', 'job-glossary.v1.json'));
  await cp(equipmentGeneratedPath, join(output, 'generated', 'general-ssr-equipment.v1.json'));
  await cp(exclusiveEquipmentGeneratedPath, join(output, 'generated', 'exclusive-equipment.v1.json'));

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
  if (!app.includes("fetch('./generated/normal-soldiers.v1.json')")) throw new Error('built app does not resolve the generated NORMAL Soldier data entry');
  if (!app.includes("fetch('./generated/hero-soldier-relations.v1.json')")) throw new Error('built app does not resolve the generated Hero–Soldier relation entry');
  const packagedRelationsText = await readFile(join(output, 'generated', 'hero-soldier-relations.v1.json'), 'utf8');
  if (packagedRelationsText !== heroSoldierRelationText) throw new Error('packaged Hero–Soldier relations differ from tracked generated artifact');
  const packagedRelations = JSON.parse(packagedRelationsText);
  if (packagedRelations.relations.length !== frontendPairs.size) throw new Error('packaged Hero–Soldier relation count differs from validated frontend mappings');
  if (!app.includes("fetch('./generated/job-glossary.v1.json')")) throw new Error('built app does not resolve the generated Job glossary entry');
  if (!app.includes("fetch('./generated/general-ssr-equipment.v1.json')")) throw new Error('built app does not resolve the generated General SSR Equipment entry');
  if (!app.includes("fetch('./generated/exclusive-equipment.v1.json')")) throw new Error('built app does not resolve the generated Exclusive Equipment entry');
  const packagedEquipmentText = await readFile(join(output, 'generated', 'general-ssr-equipment.v1.json'), 'utf8');
  if (packagedEquipmentText !== equipmentGeneratedText) throw new Error('packaged General SSR Equipment differs from validated generated artifact');
  const packagedEquipment = JSON.parse(packagedEquipmentText);
  const packagedExclusiveEquipmentText = await readFile(join(output, 'generated', 'exclusive-equipment.v1.json'), 'utf8');
  if (packagedExclusiveEquipmentText !== exclusiveEquipmentGeneratedText) throw new Error('packaged Exclusive Equipment differs from validated generated artifact');
  const packagedExclusiveEquipment = JSON.parse(packagedExclusiveEquipmentText);
  if (packagedExclusiveEquipment.equipment.length !== 167 || new Set(packagedExclusiveEquipment.equipment.map((item) => item.equipmentId)).size !== 167) throw new Error('packaged Exclusive Equipment count or IDs differ from generated artifact');
  if (packagedEquipment.equipment.length !== equipmentGenerated.equipment.length) throw new Error('packaged General SSR Equipment count differs from generated artifact');
  const packagedGlossary = JSON.parse(await readFile(join(output, 'generated', 'job-glossary.v1.json'), 'utf8'));

  process.stdout.write(`Static build: PASS (${output}; fresh Hero, ${spGenerated.soldiers.length} SP Soldier, ${normalSoldierGenerated.soldiers.length} NORMAL Soldier, ${packagedGlossary.jobs.length} Job glossary, and ${packagedEquipment.equipment.length} General SSR Equipment plus ${packagedExclusiveEquipment.equipment.length} Exclusive Equipment, and ${packagedRelations.relations.length} Hero–Soldier relation records packaged, ${portraitPaths.length} portrait assets resolved)\n`);
} finally {
  await rm(output, { recursive: true, force: true });
}
