import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export function renderGenerated(canonical, jobLocalization) {
  const nameByJobId = new Map(jobLocalization.records.map(({ jobId, nameKo }) => [jobId, nameKo]));
  const heroes = [...canonical.records]
    .sort((a, b) => a.id - b.id)
    .map(({ id, nameEng, portrait, jobConnections }) => ({
      id,
      nameEng,
      portrait,
      jobConnections: jobConnections.map((relation) => {
        const jobNameKo = nameByJobId.get(relation.jobId);
        if (typeof jobNameKo !== 'string' || !jobNameKo) throw new Error(`Missing admitted Korean Job localization for JobInfo.ID ${relation.jobId}`);
        return { ...relation, jobNameKo };
      }),
    }));
  return `${JSON.stringify({ schemaVersion: 1, heroes }, null, 2)}\n`;
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

export function renderSpSoldiers(identities, localizations, baseStats, relations) {
  const spRecords = identities.records.filter((record) => record.variant === 'SP');
  const identityIds = idSet(spRecords, (record) => record.id, 'identity');
  const localizationIds = idSet(localizations.records, (record) => record.soldierId, 'localization');
  const statsIds = idSet(baseStats.records, (record) => record.id, 'base stats');
  const relationIds = idSet(relations.records, (record) => record.spSoldierId, 'relation');
  assertSameIds(identityIds, localizationIds, 'localization');
  assertSameIds(identityIds, statsIds, 'base stats');
  assertSameIds(identityIds, relationIds, 'relation');

  const nameById = new Map(localizations.records.map(({ soldierId, nameKo }) => [soldierId, nameKo]));
  const statsById = new Map(baseStats.records.map(({ id, baseStats: stats }) => [id, stats]));
  const normalIdBySpId = new Map(relations.records.map(({ spSoldierId, normalSoldierId }) => [spSoldierId, normalSoldierId]));
  const soldiers = [...spRecords]
    .sort((a, b) => a.id - b.id)
    .map(({ id }) => {
      const stats = statsById.get(id);
      const nameKo = nameById.get(id);
      const normalSoldierId = normalIdBySpId.get(id);
      if (typeof nameKo !== 'string' || !nameKo) throw new Error(`Missing Korean localization for SP Soldier ${id}`);
      if (!stats || !['hp', 'attack', 'defense', 'magicDefense'].every((key) => Number.isFinite(stats[key]))) {
        throw new Error(`Missing base stats for SP Soldier ${id}`);
      }
      if (!Number.isInteger(normalSoldierId)) throw new Error(`Missing NORMAL Soldier relation for SP Soldier ${id}`);
      return { spSoldierId: id, nameKo, normalSoldierId, baseStats: {
        hp: stats.hp,
        attack: stats.attack,
        defense: stats.defense,
        magicDefense: stats.magicDefense,
      } };
    });
  return `${JSON.stringify({ schemaVersion: 1, soldiers }, null, 2)}\n`;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  const inputPath = resolve('canonical/heroes.v1.json');
  const localizationPath = resolve('canonical/job-localizations-ko.v1.json');
  const outputPath = resolve('generated/hero-slice.v1.json');
  const canonical = JSON.parse(await readFile(inputPath, 'utf8'));
  const jobLocalization = JSON.parse(await readFile(localizationPath, 'utf8'));
  await writeFile(outputPath, renderGenerated(canonical, jobLocalization), 'utf8');
  const spOutputPath = resolve('generated/sp-soldiers.v1.json');
  const [soldiers, spLocalizations, spBaseStats, spRelations] = await Promise.all([
    readFile(resolve('canonical/soldiers.v1.json'), 'utf8'),
    readFile(resolve('canonical/sp-soldier-localizations-ko.v1.json'), 'utf8'),
    readFile(resolve('canonical/sp-soldier-base-stats.v1.json'), 'utf8'),
    readFile(resolve('canonical/sp-soldier-normal-relations.v1.json'), 'utf8'),
  ]);
  await writeFile(spOutputPath, renderSpSoldiers(JSON.parse(soldiers), JSON.parse(spLocalizations), JSON.parse(spBaseStats), JSON.parse(spRelations)), 'utf8');
  process.stdout.write(`Generated ${outputPath}\n`);
}
