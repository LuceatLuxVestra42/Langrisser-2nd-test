import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { renderNormalSoldiers } from './generate.mjs';

const exactKeys = (value, expected, label) => {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) throw new Error(`${label} fields were ${actual.join(',')}; expected ${wanted.join(',')}`);
};

export function validateNormalSoldierPresentation(identities, localizations, baseStats, generatedText, movePoints, soldierSkillRelations, skills) {
  const expectedText = renderNormalSoldiers(identities, localizations, baseStats, movePoints, soldierSkillRelations, skills);
  if (generatedText !== expectedText) throw new Error('generated NORMAL Soldier presentation is stale or non-deterministic');
  const generated = JSON.parse(generatedText);
  exactKeys(generated, ['schemaVersion', 'soldiers'], 'generated NORMAL Soldier data');
  if (generated.schemaVersion !== 1 || !Array.isArray(generated.soldiers) || generated.soldiers.length !== 56) {
    throw new Error('unsupported NORMAL Soldier presentation population/schema');
  }
  const expectedIds = identities.records.filter((record) => record.entity === 'Soldier' && record.variant === 'NORMAL').map((record) => record.id).sort((a, b) => a - b);
  const skillById = new Map(skills.records.map((skill) => [skill.skillId, skill]));
  const skillEdges = soldierSkillRelations.records.filter((edge) => edge.sourceSoldierId === 115);
  if (skillEdges.length !== 10 || soldierSkillRelations.records.length !== 20) throw new Error('Soldier-to-Skill relation scope/count is invalid');
  const actualIds = generated.soldiers.map((record) => record.normalSoldierId);
  if (new Set(actualIds).size !== actualIds.length) throw new Error('NORMAL Soldier IDs are not unique');
  if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) throw new Error('generated NORMAL Soldier IDs differ from current canonical identity set or ordering');
  for (const record of generated.soldiers) {
    exactKeys(record, record.normalSoldierId === 115
      ? ['normalSoldierId', 'nameKo', 'bfMovePoint', 'baseStats', 'skillReferences']
      : ['normalSoldierId', 'nameKo', 'bfMovePoint', 'baseStats'], `NORMAL Soldier ${record.normalSoldierId}`);
    if (!Number.isInteger(record.normalSoldierId) || typeof record.nameKo !== 'string' || !record.nameKo.trim() || !Number.isFinite(record.bfMovePoint)) {
      throw new Error(`malformed generated NORMAL Soldier ${String(record.normalSoldierId)}`);
    }
    exactKeys(record.baseStats, ['hp', 'attack', 'defense', 'magicDefense'], `NORMAL Soldier ${record.normalSoldierId} base stats`);
    if (!Object.values(record.baseStats).every(Number.isFinite)) throw new Error(`malformed base stats for NORMAL Soldier ${record.normalSoldierId}`);
    if (record.normalSoldierId === 115) {
      const expected = skillEdges.map((edge) => {
        const skill = skillById.get(edge.targetSkillId);
        if (!skill) throw new Error(`Missing exact Skill endpoint ${edge.targetSkillId}`);
        return { skillId: edge.targetSkillId, nameCn: skill.nameCn, descriptionCn: skill.descriptionCn };
      });
      if (JSON.stringify(record.skillReferences) !== JSON.stringify(expected)) throw new Error('NORMAL Soldier 115 Skill reference parity differs from Canonical exact Skill IDs and source text');
    }
  }
  return generated;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  const readJson = async (path) => JSON.parse(await readFile(resolve(path), 'utf8'));
  const [identities, localizations, baseStats, generatedText, movePoints, soldierSkillRelations, skills] = await Promise.all([
    readJson('canonical/soldiers.v1.json'),
    readJson('canonical/normal-soldier-localizations-ko.v1.json'),
    readJson('canonical/normal-soldier-base-stats.v1.json'),
    readFile(resolve('generated/normal-soldiers.v1.json'), 'utf8'),
    readJson('canonical/soldier-bf-move-points.v1.json'),
    readJson('canonical/soldier-skill-relations.v1.json'),
    readJson('canonical/skills.v1.json'),
  ]);
  const generated = validateNormalSoldierPresentation(identities, localizations, baseStats, generatedText, movePoints, soldierSkillRelations, skills);
  process.stdout.write(`NORMAL Soldier presentation: PASS (${generated.soldiers.length} records; exact IDs, fields and freshness)\n`);
}
