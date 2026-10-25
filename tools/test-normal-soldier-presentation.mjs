import { readFile } from 'node:fs/promises';
import { renderNormalSoldiers } from './generate.mjs';
import { validateNormalSoldierPresentation } from './validate-normal-soldier-presentation.mjs';

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const [identities, localizations, baseStats, movePoints, soldierSkillRelations, skills] = await Promise.all([
  readJson('canonical/soldiers.v1.json'),
  readJson('canonical/normal-soldier-localizations-ko.v1.json'),
  readJson('canonical/normal-soldier-base-stats.v1.json'),
  readJson('canonical/soldier-bf-move-points.v1.json'),
  readJson('canonical/soldier-skill-relations.v1.json'),
  readJson('canonical/skills.v1.json'),
]);
const render = (ids = identities, names = localizations, stats = baseStats, points = movePoints, edges = soldierSkillRelations, skillOwner = skills) =>
  renderNormalSoldiers(ids, names, stats, points, edges, skillOwner);
const generated = render();
const validate = (text) => validateNormalSoldierPresentation(identities, localizations, baseStats, text, movePoints, soldierSkillRelations, skills);
const mustFail = (label, action) => {
  let failed = false;
  try { action(); } catch { failed = true; }
  if (!failed) throw new Error(`regression did not fail: ${label}`);
};

validate(generated);
mustFail('missing localization', () => render(identities, { ...localizations, records: localizations.records.slice(1) }));
mustFail('duplicate localization', () => render(identities, { ...localizations, records: [...localizations.records, localizations.records[0]] }));
mustFail('missing base stats', () => render(identities, localizations, { ...baseStats, records: baseStats.records.slice(1) }));
mustFail('duplicate base stats', () => render(identities, localizations, { ...baseStats, records: [...baseStats.records, baseStats.records[0]] }));
mustFail('missing BF_MovePoint', () => render(identities, localizations, baseStats, { ...movePoints, records: movePoints.records.slice(1) }));
mustFail('duplicate BF_MovePoint', () => render(identities, localizations, baseStats, { ...movePoints, records: [...movePoints.records, movePoints.records[0]] }));
const duplicatedIdentity = { ...identities, records: [...identities.records, identities.records.find((row) => row.entity === 'Soldier' && row.variant === 'NORMAL')] };
mustFail('duplicate NORMAL identity', () => render(duplicatedIdentity));
mustFail('missing Skill relation edge', () => render(identities, localizations, baseStats, movePoints, { ...soldierSkillRelations, records: soldierSkillRelations.records.slice(1) }));
mustFail('duplicate Skill relation edge', () => render(identities, localizations, baseStats, movePoints, { ...soldierSkillRelations, records: [...soldierSkillRelations.records, soldierSkillRelations.records[0]] }));
mustFail('wrong Skill target endpoint', () => render(identities, localizations, baseStats, movePoints, { ...soldierSkillRelations, records: soldierSkillRelations.records.map((edge, index) => index === 0 ? { ...edge, targetSkillId: 999999 } : edge) }));
mustFail('NORMAL/SP Skill relation contamination', () => render(identities, localizations, baseStats, movePoints, { ...soldierSkillRelations, records: soldierSkillRelations.records.map((edge) => edge.sourceSoldierId === 115 ? { ...edge, sourceSoldierId: 5115 } : edge) }));
mustFail('out-of-scope Soldier relation expansion', () => render(identities, localizations, baseStats, movePoints, { ...soldierSkillRelations, records: [...soldierSkillRelations.records, { ...soldierSkillRelations.records[0], sourceSoldierId: 118 }] }));
mustFail('duplicate exact Skill identity endpoint', () => render(identities, localizations, baseStats, movePoints, soldierSkillRelations, { ...skills, records: [...skills.records, skills.records[0]] }));

const missingName = JSON.parse(generated);
missingName.soldiers[0].nameKo = '';
mustFail('empty generated name', () => validate(`${JSON.stringify(missingName, null, 2)}\n`));
const missingMovePoint = JSON.parse(generated);
delete missingMovePoint.soldiers[0].bfMovePoint;
mustFail('missing generated BF_MovePoint', () => validate(`${JSON.stringify(missingMovePoint, null, 2)}\n`));
const wrongMovePoint = JSON.parse(generated);
wrongMovePoint.soldiers[0].bfMovePoint += 1;
mustFail('wrong generated BF_MovePoint', () => validate(`${JSON.stringify(wrongMovePoint, null, 2)}\n`));
const missingStat = JSON.parse(generated);
delete missingStat.soldiers[0].baseStats.magicDefense;
mustFail('missing generated stat', () => validate(`${JSON.stringify(missingStat, null, 2)}\n`));
const duplicate = JSON.parse(generated);
duplicate.soldiers[1].normalSoldierId = duplicate.soldiers[0].normalSoldierId;
mustFail('duplicate generated ID', () => validate(`${JSON.stringify(duplicate, null, 2)}\n`));
mustFail('stale generated consumer', () => validate(generated.replace('근위창병', '잘못된 이름')));
process.stdout.write('NORMAL Soldier presentation regressions: PASS (owner parity, exact IDs, required fields and freshness)\n');
