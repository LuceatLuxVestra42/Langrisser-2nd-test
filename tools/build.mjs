import { cp, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { renderGenerated, renderSpSoldiers, renderNormalSoldiers, renderJobGlossary, renderGeneralSsrEquipment, renderExclusiveEquipment } from './generate.mjs';
import { validateAppCacheKey, validateStylesCacheKey } from './validate-app-cache-key.mjs';

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
const heroRarities = await readJson('canonical/hero-rarities.v1.json');
const factionIdentities = await readJson('canonical/faction-identities.v1.json');
const heroFactionRelations = await readJson('canonical/hero-faction-relations.v1.json');
const factionLocalizations = await readJson('canonical/faction-localizations-ko.v1.json');
const productionLocalizations = await readJson('canonical/production-localizations-ko.v1.json');
const productionIdentities = await readJson('canonical/production-identities.v1.json');
const heroProductionRelations = await readJson('canonical/hero-production-relations.v1.json');
const talentRelations = await readJson('canonical/hero-talent-star-skills.v1.json');
const talentLocalizations = await readJson('canonical/hero-talent-localizations-ko.v1.json');
const generatedPath = resolve('generated/hero-slice.v1.json');
const generatedText = await readFile(generatedPath, 'utf8');
const expectedGenerated = renderGenerated(canonical, heroLocalization, jobLocalization, exclusiveRelations, exclusiveLocalizations, heroRarities, factionIdentities, heroFactionRelations, productionIdentities, heroProductionRelations, talentRelations, talentLocalizations, factionLocalizations, productionLocalizations);
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
if (exclusiveEquipmentGenerated.schemaVersion !== 1 || !Array.isArray(exclusiveEquipmentGenerated.equipment)) throw new Error('unsupported Exclusive Equipment presentation schema');
const exclusiveEquipmentIds = exclusiveEquipmentGenerated.equipment.map((item) => item.equipmentId);
if (exclusiveEquipmentIds.some((id) => !Number.isSafeInteger(id)) || new Set(exclusiveEquipmentIds).size !== exclusiveEquipmentIds.length) throw new Error('Exclusive Equipment generated IDs are malformed or duplicated');
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
const soldierBfMovePoints = await readJson('canonical/soldier-bf-move-points.v1.json');
const spGeneratedPath = resolve('generated/sp-soldiers.v1.json');
const spGeneratedText = await readFile(spGeneratedPath, 'utf8');
const expectedSpGenerated = renderSpSoldiers(soldierIdentities, soldierLocalizations, normalSoldierLocalizations, soldierBaseStats, soldierRelations, normalSoldierBaseStats, soldierBfMovePoints);
if (spGeneratedText !== expectedSpGenerated) throw new Error('generated SP Soldier data is stale or non-deterministic');
const spGenerated = JSON.parse(spGeneratedText);
if (spGenerated.schemaVersion !== 1 || !Array.isArray(spGenerated.soldiers)) throw new Error('built document has unsupported SP Soldier presentation schema');
for (const soldier of spGenerated.soldiers) {
  exactKeys(soldier, ['spSoldierId', 'nameKo', 'bfMovePoint', 'normalSoldierId', 'normalSoldierNameKo', 'baseStats', 'normalSoldierBaseStats'], `SP Soldier ${soldier.spSoldierId}`);
  if (!Number.isFinite(soldier.bfMovePoint) || !Number.isInteger(soldier.normalSoldierId) || typeof soldier.normalSoldierNameKo !== 'string' || !soldier.normalSoldierNameKo) {
    throw new Error(`malformed NORMAL Soldier presentation for SP Soldier ${soldier.spSoldierId}`);
  }
  exactKeys(soldier.normalSoldierBaseStats, ['hp', 'attack', 'defense', 'magicDefense'], `NORMAL Soldier ${soldier.normalSoldierId} base stats`);
  if (!Object.values(soldier.normalSoldierBaseStats).every(Number.isFinite)) throw new Error(`malformed NORMAL Soldier base stats for SP Soldier ${soldier.spSoldierId}`);
}

const normalSoldierGeneratedPath = resolve('generated/normal-soldiers.v1.json');
const normalSoldierGeneratedText = await readFile(normalSoldierGeneratedPath, 'utf8');
if (normalSoldierGeneratedText !== renderNormalSoldiers(soldierIdentities, normalSoldierLocalizations, normalSoldierBaseStats, soldierBfMovePoints)) {
  throw new Error('generated NORMAL Soldier data is stale or non-deterministic');
}
const normalSoldierGenerated = JSON.parse(normalSoldierGeneratedText);
if (normalSoldierGenerated.schemaVersion !== 1 || !Array.isArray(normalSoldierGenerated.soldiers)) {
  throw new Error('built document has unsupported NORMAL Soldier presentation schema');
}
for (const soldier of normalSoldierGenerated.soldiers) {
  exactKeys(soldier, ['normalSoldierId', 'nameKo', 'bfMovePoint', 'baseStats'], `NORMAL Soldier ${soldier.normalSoldierId}`);
  if (!Number.isInteger(soldier.normalSoldierId) || typeof soldier.nameKo !== 'string' || !soldier.nameKo.trim() || !Number.isFinite(soldier.bfMovePoint)) {
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
for (const relation of heroSoldierRelations.relations) {
  exactKeys(relation, ['heroId', 'soldierId'], 'generated Hero–Soldier relation pair');
  if (!Number.isSafeInteger(relation.heroId) || !Number.isSafeInteger(relation.soldierId)
    || !heroIds.has(relation.heroId)) {
    throw new Error('Hero–Soldier relation has an invalid or unresolved Hero endpoint');
  }
  const pair = `${relation.heroId}:${relation.soldierId}`;
  if (frontendPairs.has(pair)) throw new Error(`duplicate frontend relation mapping ${pair}`);
  frontendPairs.add(pair);
  const soldier = soldierPresentationById.get(relation.soldierId);
  if (!soldier || typeof soldier.nameKo !== 'string' || !soldier.nameKo.trim()) {
    throw new Error(`unresolved Soldier presentation ID ${relation.soldierId}`);
  }
}

const generated = JSON.parse(generatedText);
exactKeys(generated, ['schemaVersion', 'heroes'], 'generated consumer');
if (generated.schemaVersion !== 1 || !Array.isArray(generated.heroes)) throw new Error('unsupported generated consumer schema');
for (const hero of generated.heroes) {
  const heroKeys = ['id', 'nameEng', 'nameKo', 'rarity', 'portrait', 'jobConnections', 'exclusiveEquipment', 'factions', 'origins'];
  if (talentRelations.records.some((row) => row.heroId === hero.id)) heroKeys.push('talent');
  exactKeys(hero, heroKeys, `generated Hero ${hero.id}`);
  if (!Number.isInteger(hero.id) || typeof hero.nameEng !== 'string' || !hero.nameEng || typeof hero.nameKo !== 'string' || !hero.nameKo || !Array.isArray(hero.jobConnections)) {
    throw new Error(`malformed generated Hero ${String(hero.id)}`);
  }
  exactKeys(hero.rarity, ['rankId', 'label'], `generated Hero ${hero.id} rarity`);
  if (!Number.isSafeInteger(hero.rarity.rankId) || typeof hero.rarity.label !== 'string' || !hero.rarity.label.trim()) throw new Error(`malformed generated rarity for Hero ${hero.id}`);
  if (!Array.isArray(hero.factions) || hero.factions.length === 0) throw new Error(`malformed generated Faction list for Hero ${hero.id}`);
  const factionIds = new Set();
  for (const faction of hero.factions) {
    const localized = faction.localizationStatus === 'PROJECT_REVIEWED';
    exactKeys(faction, localized ? ['factionId', 'nameCn', 'nameKo', 'localizationStatus'] : ['factionId', 'nameCn', 'localizationStatus'], `generated Hero ${hero.id} Faction`);
    if (!Number.isSafeInteger(faction.factionId) || typeof faction.nameCn !== 'string' || !faction.nameCn.trim()
      || (localized ? typeof faction.nameKo !== 'string' || !faction.nameKo.trim() : faction.localizationStatus !== 'UNTRANSLATED')
      || factionIds.has(faction.factionId)) throw new Error(`malformed or duplicate generated Faction for Hero ${hero.id}`);
    factionIds.add(faction.factionId);
  }
  if (!Array.isArray(hero.origins) || hero.origins.length === 0) throw new Error(`malformed generated Production list for Hero ${hero.id}`);
  const productionIds = new Set();
  for (const origin of hero.origins) {
    exactKeys(origin, ['productionId', 'nameCn', 'nameKo', 'localizationStatus'], `generated Hero ${hero.id} Production`);
    if (!Number.isSafeInteger(origin.productionId) || typeof origin.nameCn !== 'string' || !origin.nameCn.trim()
      || typeof origin.nameKo !== 'string' || !origin.nameKo.trim() || origin.localizationStatus !== 'PROJECT_REVIEWED'
      || productionIds.has(origin.productionId)) throw new Error(`malformed or duplicate generated Production for Hero ${hero.id}`);
    productionIds.add(origin.productionId);
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
  if (hero.talent !== undefined) {
    exactKeys(hero.talent, ['nameKo', 'starDescriptions'], `generated Hero ${hero.id} Talent`);
    if (typeof hero.talent.nameKo !== 'string' || !hero.talent.nameKo.trim() || !Array.isArray(hero.talent.starDescriptions)
      || JSON.stringify(hero.talent.starDescriptions.map((row) => row.star)) !== '[3,4,5,6]') throw new Error(`malformed generated Talent for Hero ${hero.id}`);
    for (const row of hero.talent.starDescriptions) {
      exactKeys(row, ['star', 'skillId', 'descriptionKoRaw'], `generated Hero ${hero.id} Talent star`);
      if (!Number.isSafeInteger(row.star) || !Number.isSafeInteger(row.skillId) || typeof row.descriptionKoRaw !== 'string' || !row.descriptionKoRaw.trim()) throw new Error(`malformed generated Talent star for Hero ${hero.id}`);
    }
  }
}
const portraitPaths = [...new Set(generated.heroes.map((hero) => hero.portrait))];

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

  const [html, app, styles] = await Promise.all([
    readFile(join(output, 'index.html'), 'utf8'),
    readFile(join(output, 'app.js'), 'utf8'),
    readFile(join(output, 'styles.css'), 'utf8'),
  ]);
  validateAppCacheKey(html, app, 'built site');
  validateStylesCacheKey(html, styles, 'built site');
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
  if (!app.includes("fetch('./generated/job-glossary.v1.json')")) throw new Error('built app does not resolve the generated Job glossary entry');
  if (!app.includes("fetch('./generated/general-ssr-equipment.v1.json')")) throw new Error('built app does not resolve the generated General SSR Equipment entry');
  if (!app.includes("fetch('./generated/exclusive-equipment.v1.json')")) throw new Error('built app does not resolve the generated Exclusive Equipment entry');
  const packagedEquipmentText = await readFile(join(output, 'generated', 'general-ssr-equipment.v1.json'), 'utf8');
  if (packagedEquipmentText !== equipmentGeneratedText) throw new Error('packaged General SSR Equipment differs from validated generated artifact');
  const packagedEquipment = JSON.parse(packagedEquipmentText);
  const packagedExclusiveEquipmentText = await readFile(join(output, 'generated', 'exclusive-equipment.v1.json'), 'utf8');
  if (packagedExclusiveEquipmentText !== exclusiveEquipmentGeneratedText) throw new Error('packaged Exclusive Equipment differs from validated generated artifact');
  const packagedExclusiveEquipment = JSON.parse(packagedExclusiveEquipmentText);
  const packagedGlossary = JSON.parse(await readFile(join(output, 'generated', 'job-glossary.v1.json'), 'utf8'));

  process.stdout.write(`Static build: PASS (${output}; fresh Hero, ${spGenerated.soldiers.length} SP Soldier, ${normalSoldierGenerated.soldiers.length} NORMAL Soldier, ${packagedGlossary.jobs.length} Job glossary, and ${packagedEquipment.equipment.length} General SSR Equipment plus ${packagedExclusiveEquipment.equipment.length} Exclusive Equipment, and ${packagedRelations.relations.length} Hero–Soldier relation records packaged, ${portraitPaths.length} portrait assets resolved)\n`);
} finally {
  await rm(output, { recursive: true, force: true });
}
