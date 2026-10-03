import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export function renderGenerated(canonical, jobLocalization, exclusiveRelations, exclusiveLocalizations) {
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
      const equipmentId = relationByHeroId.get(id);
      if (!Number.isInteger(equipmentId)) throw new Error(`Missing Exclusive Equipment relation for visible Hero ${id}`);
      const localization = localizationByEquipmentId.get(equipmentId);
      if (!localization) throw new Error(`Missing Korean Exclusive Equipment localization for ${equipmentId}`);
      return ({
      id,
      nameEng,
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

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  const inputPath = resolve('canonical/heroes.v1.json');
  const localizationPath = resolve('canonical/job-localizations-ko.v1.json');
  const exclusiveRelationPath = resolve('canonical/hero-exclusive-equipment-relations.v1.json');
  const exclusiveLocalizationPath = resolve('canonical/exclusive-equipment-localizations-ko.v1.json');
  const outputPath = resolve('generated/hero-slice.v1.json');
  const canonical = JSON.parse(await readFile(inputPath, 'utf8'));
  const jobLocalization = JSON.parse(await readFile(localizationPath, 'utf8'));
  const [exclusiveRelations, exclusiveLocalizations] = await Promise.all([
    readFile(exclusiveRelationPath, 'utf8'), readFile(exclusiveLocalizationPath, 'utf8'),
  ]).then(([relations, localizations]) => [JSON.parse(relations), JSON.parse(localizations)]);
  await writeFile(outputPath, renderGenerated(canonical, jobLocalization, exclusiveRelations, exclusiveLocalizations), 'utf8');
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
  process.stdout.write(`Generated ${outputPath} and ${glossaryPath}\n`);
}
