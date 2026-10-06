import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export function renderGenerated(canonical, heroLocalization, jobLocalization, exclusiveRelations, exclusiveLocalizations) {
  if (heroLocalization?.schemaVersion !== 1 || !Array.isArray(heroLocalization.records)) throw new Error('Unsupported Hero Korean localization owner');
  const nameByHeroId = new Map();
  for (const localization of heroLocalization.records) {
    if (!Number.isInteger(localization.heroId)) throw new Error('Hero Korean localization contains malformed heroId');
    if (nameByHeroId.has(localization.heroId)) throw new Error(`Duplicate Hero Korean localization for Hero ${localization.heroId}`);
    if (typeof localization.nameKo !== 'string' || !localization.nameKo) throw new Error(`Missing Korean Hero display name for Hero ${localization.heroId}`);
    nameByHeroId.set(localization.heroId, localization.nameKo);
  }
  const nameByJobId = new Map(jobLocalization.records.map(({ jobId, nameKo }) => [jobId, nameKo]));
  const relationByHeroId = new Map();
  const equipmentIds = new Set();
  for (const relation of exclusiveRelations.records) {
    if (!Number.isInteger(relation.heroId) || !Number.isInteger(relation.equipmentId)) throw new Error('Exclusive Equipment relation contains malformed endpoint');
    if (relationByHeroId.has(relation.heroId)) throw new Error(`Duplicate Exclusive Equipment relation for Hero ${relation.heroId}`);
    if (equipmentIds.has(relation.equipmentId)) throw new Error(`Duplicate Exclusive Equipment mapping for equipment ${relation.equipmentId}`);
    relationByHeroId.set(relation.heroId, relation.equipmentId);
    equipmentIds.add(relation.equipmentId);
  }
  const localizationByEquipmentId = new Map();
  for (const localization of exclusiveLocalizations.records) {
    if (!Number.isInteger(localization.equipmentId)) throw new Error('Exclusive Equipment localization contains malformed equipmentId');
    if (localizationByEquipmentId.has(localization.equipmentId)) throw new Error(`Duplicate Exclusive Equipment localization for ${localization.equipmentId}`);
    if (typeof localization.nameKo !== 'string' || !localization.nameKo || typeof localization.effectDescriptionKo !== 'string' || !localization.effectDescriptionKo) {
      throw new Error(`Missing Korean Exclusive Equipment presentation for ${localization.equipmentId}`);
    }
    localizationByEquipmentId.set(localization.equipmentId, localization);
  }
  const heroes = [...canonical.records]
    .sort((a, b) => a.id - b.id)
    .map(({ id, nameEng, portrait, jobConnections }) => {
      const nameKo = nameByHeroId.get(id);
      if (typeof nameKo !== 'string' || !nameKo) throw new Error(`Missing admitted Korean Hero localization for visible Hero ${id}`);
      const equipmentId = relationByHeroId.get(id);
      if (!Number.isInteger(equipmentId)) throw new Error(`Missing Exclusive Equipment relation for visible Hero ${id}`);
      const localization = localizationByEquipmentId.get(equipmentId);
      if (!localization) throw new Error(`Missing Korean Exclusive Equipment localization for ${equipmentId}`);
      return ({
      id,
      nameEng,
      nameKo,
      portrait,
      exclusiveEquipment: { equipmentId, equipmentNameKo: localization.nameKo, effectDescriptionKo: localization.effectDescriptionKo },
      jobConnections: jobConnections.map((relation) => {
        const jobNameKo = nameByJobId.get(relation.jobId);
        if (typeof jobNameKo !== 'string' || !jobNameKo) throw new Error(`Missing admitted Korean Job localization for JobInfo.ID ${relation.jobId}`);
        return { ...relation, jobNameKo };
      }),
    });
    });
  return `${JSON.stringify({ schemaVersion: 1, heroes }, null, 2)}\n`;
}

export function renderJobGlossary(jobLocalization) {
  const jobs = [...jobLocalization.records]
    .sort((a, b) => a.jobId - b.jobId)
    .map(({ jobId, nameKo }) => ({ jobId, nameKo }));
  return `${JSON.stringify({ schemaVersion: 1, jobs }, null, 2)}\n`;
}

export function renderGeneralSsrEquipment(identities, localizations) {
  if (identities?.schemaVersion !== 1 || !Array.isArray(identities.records)) throw new Error('Unsupported General SSR Equipment identity owner');
  if (localizations?.schemaVersion !== 1 || !Array.isArray(localizations.records)) throw new Error('Unsupported General SSR Equipment localization owner');
  const identityIds = new Set();
  for (const record of identities.records) {
    if (!Number.isInteger(record.id)) throw new Error('General SSR Equipment identity contains malformed ID');
    if (identityIds.has(record.id)) throw new Error('Duplicate General SSR Equipment identity ' + record.id);
    if (record.population !== 'GENERAL_SSR') throw new Error('Unexpected population for Equipment ' + record.id);
    identityIds.add(record.id);
  }
  const localizationById = new Map();
  for (const record of localizations.records) {
    if (!Number.isInteger(record.equipmentId)) throw new Error('General SSR Equipment localization contains malformed equipmentId');
    if (localizationById.has(record.equipmentId)) throw new Error('Duplicate General SSR Equipment localization ' + record.equipmentId);
    if (typeof record.nameKo !== 'string' || !record.nameKo.trim() || typeof record.effectDescriptionKo !== 'string' || !record.effectDescriptionKo.trim()) throw new Error('Missing Korean presentation for ' + record.equipmentId);
    localizationById.set(record.equipmentId, record);
  }
  if (localizationById.size !== identityIds.size || [...identityIds].some((id) => !localizationById.has(id))) throw new Error('General SSR Equipment localization ID set does not exactly match identity');
  const equipment = [...identityIds].sort((a, b) => a - b).map((equipmentId) => {
    const localization = localizationById.get(equipmentId);
    return { equipmentId, nameKo: localization.nameKo, effectDescriptionKo: localization.effectDescriptionKo };
  });
  return JSON.stringify({ schemaVersion: 1, equipment }, null, 2) + '\n';
}

const idSet = (records, getId, label) => {
  const ids = records.map(getId);
  if (ids.some((id) => !Number.isInteger(id))) throw new Error(`${label} contains a non-integer SP Soldier ID`);
  if (new Set(ids).size !== ids.length) throw new Error(`${label} contains duplicate SP Soldier IDs`);
  return new Set(ids);
};

const assertSameIds = (expected, actual, label) => {
  if (expected.size !== actual.size || [...expected].some((id) => !actual.has(id))) {
    throw new Error(`${label} SP Soldier ID set does not exactly match identity`);
  }
};

export function renderSpSoldiers(identities, localizations, normalLocalizations, baseStats, relations, normalBaseStats) {
  const spRecords = identities.records.filter((record) => record.variant === 'SP');
  const normalRecords = identities.records.filter((record) => record.variant === 'NORMAL');
  const identityIds = idSet(spRecords, (record) => record.id, 'identity');
  const localizationIds = idSet(localizations.records, (record) => record.soldierId, 'localization');
  const normalIdentityIds = idSet(normalRecords, (record) => record.id, 'NORMAL identity');
  const normalLocalizationIds = idSet(normalLocalizations.records, (record) => record.soldierId, 'NORMAL localization');
  const statsIds = idSet(baseStats.records, (record) => record.id, 'base stats');
  const normalStatsIds = idSet(normalBaseStats.records, (record) => record.id, 'NORMAL base stats');
  const relationIds = idSet(relations.records, (record) => record.spSoldierId, 'relation');
  assertSameIds(identityIds, localizationIds, 'localization');
  assertSameIds(identityIds, statsIds, 'base stats');
  assertSameIds(identityIds, relationIds, 'relation');

  const relationTargetIds = relations.records.map(({ normalSoldierId }) => normalSoldierId);
  if (relationTargetIds.some((id) => !Number.isInteger(id)) || new Set(relationTargetIds).size !== relationTargetIds.length) {
    throw new Error('relation contains invalid or duplicate NORMAL Soldier IDs');
  }
  const relationTargets = new Set(relationTargetIds);
  assertSameIds(relationTargets, normalLocalizationIds, 'NORMAL localization');
  assertSameIds(relationTargets, normalStatsIds, 'NORMAL base stats');
  if ([...relationTargets].some((id) => !normalIdentityIds.has(id))) {
    throw new Error('relation NORMAL Soldier ID is missing from identity');
  }

  const nameById = new Map(localizations.records.map(({ soldierId, nameKo }) => [soldierId, nameKo]));
  const normalNameById = new Map(normalLocalizations.records.map(({ soldierId, nameKo }) => [soldierId, nameKo]));
  const statsById = new Map(baseStats.records.map(({ id, baseStats: stats }) => [id, stats]));
  const normalStatsById = new Map(normalBaseStats.records.map(({ id, baseStats: stats }) => [id, stats]));
  const normalIdBySpId = new Map(relations.records.map(({ spSoldierId, normalSoldierId }) => [spSoldierId, normalSoldierId]));
  const soldiers = [...spRecords]
    .sort((a, b) => a.id - b.id)
    .map(({ id }) => {
      const stats = statsById.get(id);
      const nameKo = nameById.get(id);
      const normalSoldierId = normalIdBySpId.get(id);
      const normalSoldierNameKo = normalNameById.get(normalSoldierId);
      const normalSoldierBaseStats = normalStatsById.get(normalSoldierId);
      if (typeof nameKo !== 'string' || !nameKo) throw new Error(`Missing Korean localization for SP Soldier ${id}`);
      if (!stats || !['hp', 'attack', 'defense', 'magicDefense'].every((key) => Number.isFinite(stats[key]))) {
        throw new Error(`Missing base stats for SP Soldier ${id}`);
      }
      if (!Number.isInteger(normalSoldierId)) throw new Error(`Missing NORMAL Soldier relation for SP Soldier ${id}`);
      if (typeof normalSoldierNameKo !== 'string' || !normalSoldierNameKo) {
        throw new Error(`Missing Korean localization for NORMAL Soldier ${normalSoldierId} linked to SP Soldier ${id}`);
      }
      if (!normalSoldierBaseStats || !['hp', 'attack', 'defense', 'magicDefense'].every((key) => Number.isFinite(normalSoldierBaseStats[key]))) {
        throw new Error(`Missing base stats for NORMAL Soldier ${normalSoldierId} linked to SP Soldier ${id}`);
      }
      return {
        spSoldierId: id,
        nameKo,
        normalSoldierId,
        normalSoldierNameKo,
        baseStats: { hp: stats.hp, attack: stats.attack, defense: stats.defense, magicDefense: stats.magicDefense },
        normalSoldierBaseStats: {
          hp: normalSoldierBaseStats.hp,
          attack: normalSoldierBaseStats.attack,
          defense: normalSoldierBaseStats.defense,
          magicDefense: normalSoldierBaseStats.magicDefense,
        },
      };
    });
  return `${JSON.stringify({ schemaVersion: 1, soldiers }, null, 2)}\n`;
}

export function renderNormalSoldiers(identities, localizations, baseStats) {
  const normalRecords = identities.records.filter((record) => record.entity === 'Soldier' && record.variant === 'NORMAL');
  const identityIds = idSet(normalRecords, (record) => record.id, 'NORMAL identity');
  const localizationIds = idSet(localizations.records, (record) => record.soldierId, 'NORMAL localization');
  const statsIds = idSet(baseStats.records, (record) => record.id, 'NORMAL base stats');
  assertSameIds(identityIds, localizationIds, 'NORMAL localization');
  assertSameIds(identityIds, statsIds, 'NORMAL base stats');
  if (identityIds.size !== 56) throw new Error('NORMAL Soldier candidate scope must contain exactly 56 admitted identities');
  const nameById = new Map(localizations.records.map(({ soldierId, nameKo }) => [soldierId, nameKo]));
  const statsById = new Map(baseStats.records.map(({ id, baseStats: values }) => [id, values]));
  const soldiers = [...normalRecords].sort((a, b) => a.id - b.id).map(({ id }) => {
    const nameKo = nameById.get(id);
    const values = statsById.get(id);
    if (typeof nameKo !== 'string' || !nameKo.trim()) throw new Error(`Missing Korean localization for NORMAL Soldier ${id}`);
    if (!values || !['hp', 'attack', 'defense', 'magicDefense'].every((key) => Number.isFinite(values[key]))) {
      throw new Error(`Missing base stats for NORMAL Soldier ${id}`);
    }
    return { normalSoldierId: id, nameKo, baseStats: { hp: values.hp, attack: values.attack, defense: values.defense, magicDefense: values.magicDefense } };
  });
  return `${JSON.stringify({ schemaVersion: 1, soldiers }, null, 2)}\n`;
}


export function renderExclusiveEquipment(identities, localizations) {
  if (identities?.schemaVersion !== 1 || !Array.isArray(identities.records)) throw new Error('Unsupported Exclusive Equipment identity owner');
  if (localizations?.schemaVersion !== 1 || !Array.isArray(localizations.records)) throw new Error('Unsupported Exclusive Equipment localization owner');
  const identityIds = new Set();
  for (const record of identities.records) {
    if (!Number.isSafeInteger(record.equipmentId) || record.equipmentId <= 0) throw new Error('Exclusive Equipment identity contains malformed equipmentId');
    if (identityIds.has(record.equipmentId)) throw new Error('Duplicate Exclusive Equipment identity ' + record.equipmentId);
    identityIds.add(record.equipmentId);
  }
  if (identityIds.size !== 167) throw new Error('Exclusive Equipment presentation scope must contain exactly 167 admitted IDs');
  const localizationById = new Map();
  for (const record of localizations.records) {
    if (!Number.isSafeInteger(record.equipmentId) || record.equipmentId <= 0) throw new Error('Exclusive Equipment localization contains malformed equipmentId');
    if (localizationById.has(record.equipmentId)) throw new Error('Duplicate Exclusive Equipment localization ' + record.equipmentId);
    if (typeof record.nameKo !== 'string' || !record.nameKo.trim() || typeof record.effectDescriptionKo !== 'string' || !record.effectDescriptionKo.trim()) throw new Error('Missing Korean presentation for Exclusive Equipment ' + record.equipmentId);
    localizationById.set(record.equipmentId, record);
  }
  if (localizationById.size !== identityIds.size || [...identityIds].some((id) => !localizationById.has(id))
    || [...localizationById.keys()].some((id) => !identityIds.has(id))) throw new Error('Exclusive Equipment localization ID set does not exactly match identity');
  const equipment = [...identityIds].sort((a, b) => a - b).map((equipmentId) => {
    const localization = localizationById.get(equipmentId);
    return { equipmentId, nameKo: localization.nameKo, effectDescriptionKo: localization.effectDescriptionKo };
  });
  return JSON.stringify({ schemaVersion: 1, equipment }, null, 2) + '\n';
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  const inputPath = resolve('canonical/heroes.v1.json');
  const heroLocalizationPath = resolve('canonical/hero-localizations-ko.v1.json');
  const localizationPath = resolve('canonical/job-localizations-ko.v1.json');
  const exclusiveRelationPath = resolve('canonical/hero-exclusive-equipment-relations.v1.json');
  const exclusiveLocalizationPath = resolve('canonical/exclusive-equipment-localizations-ko.v1.json');
  const outputPath = resolve('generated/hero-slice.v1.json');
  const canonical = JSON.parse(await readFile(inputPath, 'utf8'));
  const heroLocalization = JSON.parse(await readFile(heroLocalizationPath, 'utf8'));
  const jobLocalization = JSON.parse(await readFile(localizationPath, 'utf8'));
  const [exclusiveRelations, exclusiveLocalizations] = await Promise.all([
    readFile(exclusiveRelationPath, 'utf8'), readFile(exclusiveLocalizationPath, 'utf8'),
  ]).then(([relations, localizations]) => [JSON.parse(relations), JSON.parse(localizations)]);
  await writeFile(outputPath, renderGenerated(canonical, heroLocalization, jobLocalization, exclusiveRelations, exclusiveLocalizations), 'utf8');
  const glossaryPath = resolve('generated/job-glossary.v1.json');
  await writeFile(glossaryPath, renderJobGlossary(jobLocalization), 'utf8');
  const spOutputPath = resolve('generated/sp-soldiers.v1.json');
  const [soldiers, spLocalizations, normalLocalizations, spBaseStats, spRelations, normalBaseStats] = await Promise.all([
    readFile(resolve('canonical/soldiers.v1.json'), 'utf8'),
    readFile(resolve('canonical/sp-soldier-localizations-ko.v1.json'), 'utf8'),
    readFile(resolve('canonical/normal-soldier-localizations-ko.v1.json'), 'utf8'),
    readFile(resolve('canonical/sp-soldier-base-stats.v1.json'), 'utf8'),
    readFile(resolve('canonical/sp-soldier-normal-relations.v1.json'), 'utf8'),
    readFile(resolve('canonical/normal-soldier-base-stats.v1.json'), 'utf8'),
  ]);
  await writeFile(spOutputPath, renderSpSoldiers(JSON.parse(soldiers), JSON.parse(spLocalizations), JSON.parse(normalLocalizations), JSON.parse(spBaseStats), JSON.parse(spRelations), JSON.parse(normalBaseStats)), 'utf8');
  const [normalSoldierIdentities, normalSoldierLocalizations, normalSoldierBaseStats] = await Promise.all([
    readFile(resolve('canonical/soldiers.v1.json'), 'utf8'),
    readFile(resolve('canonical/normal-soldier-localizations-ko.v1.json'), 'utf8'),
    readFile(resolve('canonical/normal-soldier-base-stats.v1.json'), 'utf8'),
  ]);
  const normalSoldierOutputPath = resolve('generated/normal-soldiers.v1.json');
  await writeFile(normalSoldierOutputPath, renderNormalSoldiers(JSON.parse(normalSoldierIdentities), JSON.parse(normalSoldierLocalizations), JSON.parse(normalSoldierBaseStats)), 'utf8');
  const equipmentIdentity = JSON.parse(await readFile(resolve('canonical/general-ssr-equipment.v1.json'), 'utf8'));
  const equipmentLocalization = JSON.parse(await readFile(resolve('canonical/general-ssr-equipment-localizations-ko.v1.json'), 'utf8'));
  const equipmentOutputPath = resolve('generated/general-ssr-equipment.v1.json');
  await writeFile(equipmentOutputPath, renderGeneralSsrEquipment(equipmentIdentity, equipmentLocalization), 'utf8');
  const exclusiveEquipmentIdentity = JSON.parse(await readFile(resolve('canonical/exclusive-equipment.v1.json'), 'utf8'));
  const exclusiveEquipmentLocalization = JSON.parse(await readFile(resolve('canonical/exclusive-equipment-localizations-ko.v1.json'), 'utf8'));
  const exclusiveEquipmentOutputPath = resolve('generated/exclusive-equipment.v1.json');
  await writeFile(exclusiveEquipmentOutputPath, renderExclusiveEquipment(exclusiveEquipmentIdentity, exclusiveEquipmentLocalization), 'utf8');
  process.stdout.write('Generated ' + outputPath + ', ' + glossaryPath + ', ' + spOutputPath + ', ' + equipmentOutputPath + ', and ' + exclusiveEquipmentOutputPath + '\n');
}
