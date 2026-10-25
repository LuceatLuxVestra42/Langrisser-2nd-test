import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { renderSpSoldiers } from './generate.mjs';

const exactKeys = (value, expected, label) => {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) throw new Error(`${label} fields were ${actual.join(',')}; expected ${wanted.join(',')}`);
};

export function validateSpSoldierPresentation(identities, localizations, normalLocalizations, baseStats, relations, normalBaseStats, generatedText, movePoints, soldierSkillRelations, skills) {
  const expectedText = renderSpSoldiers(identities, localizations, normalLocalizations, baseStats, relations, normalBaseStats, movePoints, soldierSkillRelations, skills);
  if (generatedText !== expectedText) throw new Error('generated SP Soldier presentation is stale or non-deterministic');
  const generated = JSON.parse(generatedText);
  exactKeys(generated, ['schemaVersion', 'soldiers'], 'generated SP Soldier data');
  if (generated.schemaVersion !== 1 || !Array.isArray(generated.soldiers)) throw new Error('unsupported SP Soldier presentation schema');
  const expectedIds = identities.records.filter((record) => record.variant === 'SP').map((record) => record.id).sort((a, b) => a - b);
  const skillById = new Map(skills.records.map((skill) => [skill.skillId, skill]));
  const skillEdges = soldierSkillRelations.records.filter((edge) => edge.sourceSoldierId === 5115);
  if (skillEdges.length !== 10 || soldierSkillRelations.records.length !== 20) throw new Error('Soldier-to-Skill relation scope/count is invalid');
  if (generated.soldiers.length !== expectedIds.length) throw new Error('generated SP Soldier count differs from current admitted identity set');
  const actualIds = generated.soldiers.map((record) => record.spSoldierId);
  if (new Set(actualIds).size !== actualIds.length) throw new Error('generated SP Soldier IDs are not unique');
  if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) throw new Error('generated SP Soldier IDs differ from canonical set or ordering');
  for (const record of generated.soldiers) {
    exactKeys(record, record.spSoldierId === 5115
      ? ['spSoldierId', 'nameKo', 'bfMovePoint', 'normalSoldierId', 'normalSoldierNameKo', 'baseStats', 'normalSoldierBaseStats', 'skillReferences']
      : ['spSoldierId', 'nameKo', 'bfMovePoint', 'normalSoldierId', 'normalSoldierNameKo', 'baseStats', 'normalSoldierBaseStats'], `SP Soldier ${record.spSoldierId}`);
    if (!Number.isInteger(record.spSoldierId) || typeof record.nameKo !== 'string' || !record.nameKo
      || !Number.isFinite(record.bfMovePoint) || !Number.isInteger(record.normalSoldierId) || typeof record.normalSoldierNameKo !== 'string' || !record.normalSoldierNameKo) {
      throw new Error(`malformed generated SP Soldier ${String(record.spSoldierId)}`);
    }
    const expectedNormalName = normalLocalizations.records.find((localization) => localization.soldierId === record.normalSoldierId)?.nameKo;
    if (record.normalSoldierNameKo !== expectedNormalName) {
      throw new Error(`NORMAL Soldier name does not match exact ID ${record.normalSoldierId}`);
    }
    exactKeys(record.baseStats, ['hp', 'attack', 'defense', 'magicDefense'], `SP Soldier ${record.spSoldierId} base stats`);
    if (!Object.values(record.baseStats).every(Number.isFinite)) throw new Error(`malformed base stats for SP Soldier ${record.spSoldierId}`);
    exactKeys(record.normalSoldierBaseStats, ['hp', 'attack', 'defense', 'magicDefense'], `NORMAL Soldier ${record.normalSoldierId} base stats`);
    if (!Object.values(record.normalSoldierBaseStats).every(Number.isFinite)) throw new Error(`malformed base stats for NORMAL Soldier ${record.normalSoldierId}`);
    if (record.spSoldierId === 5115) {
      const expected = skillEdges.map((edge) => {
        const skill = skillById.get(edge.targetSkillId);
        if (!skill) throw new Error(`Missing exact Skill endpoint ${edge.targetSkillId}`);
        return { skillId: edge.targetSkillId, nameCn: skill.nameCn, descriptionCn: skill.descriptionCn };
      });
      if (JSON.stringify(record.skillReferences) !== JSON.stringify(expected)) throw new Error('SP Soldier 5115 Skill reference parity differs from Canonical exact Skill IDs and source text');
    }
  }
  return generated;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  const readJson = async (path) => JSON.parse(await readFile(resolve(path), 'utf8'));
  const [identities, localizations, normalLocalizations, baseStats, relations, normalBaseStats, generatedText, movePoints, soldierSkillRelations, skills] = await Promise.all([
    readJson('canonical/soldiers.v1.json'),
    readJson('canonical/sp-soldier-localizations-ko.v1.json'),
    readJson('canonical/normal-soldier-localizations-ko.v1.json'),
    readJson('canonical/sp-soldier-base-stats.v1.json'),
    readJson('canonical/sp-soldier-normal-relations.v1.json'),
    readJson('canonical/normal-soldier-base-stats.v1.json'),
    readFile(resolve('generated/sp-soldiers.v1.json'), 'utf8'),
    readJson('canonical/soldier-bf-move-points.v1.json'),
    readJson('canonical/soldier-skill-relations.v1.json'),
    readJson('canonical/skills.v1.json'),
  ]);
  const generated = validateSpSoldierPresentation(identities, localizations, normalLocalizations, baseStats, relations, normalBaseStats, generatedText, movePoints, soldierSkillRelations, skills);
  process.stdout.write(`SP Soldier presentation: PASS (${generated.soldiers.length} records; SP/NORMAL stats, canonical parity, exact schema, order and freshness)\n`);
}
