import { readFile } from 'node:fs/promises';
import { renderSpSoldiers } from './generate.mjs';
import { validateSpSoldierPresentation } from './validate-sp-soldier-presentation.mjs';

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const [identities, localizations, normalLocalizations, baseStats, relations, normalBaseStats, movePoints, soldierSkillRelations, skills] = await Promise.all([
  readJson('canonical/soldiers.v1.json'),
  readJson('canonical/sp-soldier-localizations-ko.v1.json'),
  readJson('canonical/normal-soldier-localizations-ko.v1.json'),
  readJson('canonical/sp-soldier-base-stats.v1.json'),
  readJson('canonical/sp-soldier-normal-relations.v1.json'),
  readJson('canonical/normal-soldier-base-stats.v1.json'),
  readJson('canonical/soldier-bf-move-points.v1.json'),
  readJson('canonical/soldier-skill-relations.v1.json'),
  readJson('canonical/skills.v1.json'),
]);
const render = (names = localizations, normalNames = normalLocalizations, stats = baseStats, links = relations, soldiers = identities, normalStats = normalBaseStats, points = movePoints) =>
  renderSpSoldiers(soldiers, names, normalNames, stats, links, normalStats, points, soldierSkillRelations, skills);
const generated = render();
const mustFail = (label, action) => {
  let failed = false;
  try { action(); } catch { failed = true; }
  if (!failed) throw new Error(`regression did not fail: ${label}`);
};
const validate = (text, points = movePoints) => validateSpSoldierPresentation(identities, localizations, normalLocalizations, baseStats, relations, normalBaseStats, text, points, soldierSkillRelations, skills);

validate(generated);
mustFail('missing SP localization', () => render({ ...localizations, records: localizations.records.slice(1) }));
mustFail('duplicate SP localization', () => render({ ...localizations, records: [...localizations.records, localizations.records[0]] }));
mustFail('missing NORMAL localization', () => render(localizations, { ...normalLocalizations, records: normalLocalizations.records.slice(1) }));
mustFail('duplicate NORMAL localization mapping', () => render(localizations, { ...normalLocalizations, records: [...normalLocalizations.records, normalLocalizations.records[0]] }));
mustFail('missing base stats', () => render(localizations, normalLocalizations, { ...baseStats, records: baseStats.records.slice(1) }));
mustFail('duplicate base stats', () => render(localizations, normalLocalizations, { ...baseStats, records: [...baseStats.records, baseStats.records[0]] }));
mustFail('missing NORMAL base stats', () => render(localizations, normalLocalizations, baseStats, relations, identities, { ...normalBaseStats, records: normalBaseStats.records.slice(1) }));
mustFail('duplicate NORMAL base stats', () => render(localizations, normalLocalizations, baseStats, relations, identities, { ...normalBaseStats, records: [...normalBaseStats.records, normalBaseStats.records[0]] }));
mustFail('missing relation', () => render(localizations, normalLocalizations, baseStats, { ...relations, records: relations.records.slice(1) }));
mustFail('duplicate relation', () => render(localizations, normalLocalizations, baseStats, { ...relations, records: [...relations.records, relations.records[0]] }));
mustFail('missing BF_MovePoint', () => render(localizations, normalLocalizations, baseStats, relations, identities, normalBaseStats, { ...movePoints, records: movePoints.records.slice(1) }));
mustFail('duplicate BF_MovePoint', () => render(localizations, normalLocalizations, baseStats, relations, identities, normalBaseStats, { ...movePoints, records: [...movePoints.records, movePoints.records[0]] }));
mustFail('identity set mismatch', () => render(localizations, normalLocalizations, baseStats, relations, { ...identities, records: identities.records.filter((r) => r.id !== 5115) }));
mustFail('missing Skill relation edge', () => renderSpSoldiers(identities, localizations, normalLocalizations, baseStats, relations, normalBaseStats, movePoints, { ...soldierSkillRelations, records: soldierSkillRelations.records.slice(1) }, skills));
mustFail('duplicate Skill relation edge', () => renderSpSoldiers(identities, localizations, normalLocalizations, baseStats, relations, normalBaseStats, movePoints, { ...soldierSkillRelations, records: [...soldierSkillRelations.records, soldierSkillRelations.records[0]] }, skills));
mustFail('wrong Skill target endpoint', () => renderSpSoldiers(identities, localizations, normalLocalizations, baseStats, relations, normalBaseStats, movePoints, { ...soldierSkillRelations, records: soldierSkillRelations.records.map((edge, index) => index === 10 ? { ...edge, targetSkillId: 999999 } : edge) }, skills));
mustFail('NORMAL/SP Skill relation contamination', () => renderSpSoldiers(identities, localizations, normalLocalizations, baseStats, relations, normalBaseStats, movePoints, { ...soldierSkillRelations, records: soldierSkillRelations.records.map((edge) => edge.sourceSoldierId === 115 ? { ...edge, sourceSoldierId: 5115 } : edge) }, skills));
mustFail('out-of-scope Soldier relation expansion', () => renderSpSoldiers(identities, localizations, normalLocalizations, baseStats, relations, normalBaseStats, movePoints, { ...soldierSkillRelations, records: [...soldierSkillRelations.records, { ...soldierSkillRelations.records[0], sourceSoldierId: 118 }] }, skills));
mustFail('duplicate exact Skill identity endpoint', () => renderSpSoldiers(identities, localizations, normalLocalizations, baseStats, relations, normalBaseStats, movePoints, soldierSkillRelations, { ...skills, records: [...skills.records, skills.records[0]] }));
mustFail('missing exact Skill identity endpoint', () => renderSpSoldiers(identities, localizations, normalLocalizations, baseStats, relations, normalBaseStats, movePoints, soldierSkillRelations, { ...skills, records: skills.records.filter((skill) => skill.skillId !== soldierSkillRelations.records.find((edge) => edge.sourceSoldierId === 5115).targetSkillId) }));

const missingMovePoint = JSON.parse(generated);
delete missingMovePoint.soldiers[0].bfMovePoint;
mustFail('missing generated BF_MovePoint', () => validate(`${JSON.stringify(missingMovePoint, null, 2)}\n`));
const wrongMovePoint = JSON.parse(generated);
wrongMovePoint.soldiers[0].bfMovePoint += 1;
mustFail('wrong generated BF_MovePoint', () => validate(`${JSON.stringify(wrongMovePoint, null, 2)}\n`));
const missingName = JSON.parse(generated);
delete missingName.soldiers[0].normalSoldierNameKo;
mustFail('generated NORMAL name missing', () => validate(`${JSON.stringify(missingName, null, 2)}\n`));
const wrongName = JSON.parse(generated);
wrongName.soldiers[0].normalSoldierNameKo = '잘못된 이름';
mustFail('wrong NORMAL name', () => validate(`${JSON.stringify(wrongName, null, 2)}\n`));
const idNameMismatch = JSON.parse(generated);
idNameMismatch.soldiers[0].normalSoldierId = relations.records.find((r) => r.spSoldierId === idNameMismatch.soldiers[0].spSoldierId).normalSoldierId + 1;
mustFail('NORMAL ID/name mismatch', () => validate(`${JSON.stringify(idNameMismatch, null, 2)}\n`));
const swappedName = JSON.parse(generated);
[swappedName.soldiers[0].normalSoldierNameKo, swappedName.soldiers[1].normalSoldierNameKo] =
  [swappedName.soldiers[1].normalSoldierNameKo, swappedName.soldiers[0].normalSoldierNameKo];
mustFail('unrelated NORMAL name swap', () => validate(`${JSON.stringify(swappedName, null, 2)}\n`));
const changedNormalId = JSON.parse(generated);
changedNormalId.soldiers[0].normalSoldierId += 1;
mustFail('wrong generated NORMAL Soldier ID', () => validate(`${JSON.stringify(changedNormalId, null, 2)}\n`));
const extraField = JSON.parse(generated);
extraField.soldiers[0].provenance = 'must not leak';
mustFail('provenance field leak', () => validate(`${JSON.stringify(extraField, null, 2)}\n`));
const reversed = JSON.parse(generated);
reversed.soldiers.reverse();
mustFail('wrong order', () => validate(`${JSON.stringify(reversed, null, 2)}\n`));
mustFail('stale SP/NORMAL name value', () => validate(generated.replace('근위창병', '잘못된 이름')));

for (const [field, label] of [['hp', 'hp'], ['attack', 'attack'], ['defense', 'defense'], ['magicDefense', 'magicDefense']]) {
  const wrong = JSON.parse(generated);
  wrong.soldiers[0].normalSoldierBaseStats[field] += 1;
  mustFail(`wrong NORMAL ${label}`, () => validate(`${JSON.stringify(wrong, null, 2)}\n`));
}
const copiedSpStats = JSON.parse(generated);
copiedSpStats.soldiers[0].normalSoldierBaseStats = structuredClone(copiedSpStats.soldiers[0].baseStats);
mustFail('SP stats copied into NORMAL stats', () => validate(`${JSON.stringify(copiedSpStats, null, 2)}\n`));
const swappedStats = JSON.parse(generated);
[swappedStats.soldiers[0].normalSoldierBaseStats, swappedStats.soldiers[1].normalSoldierBaseStats] =
  [swappedStats.soldiers[1].normalSoldierBaseStats, swappedStats.soldiers[0].normalSoldierBaseStats];
mustFail('unrelated NORMAL Soldier stats swap', () => validate(`${JSON.stringify(swappedStats, null, 2)}\n`));
const idStatsMismatch = JSON.parse(generated);
const otherNormalStats = normalBaseStats.records.find(r => r.id !== idStatsMismatch.soldiers[0].normalSoldierId);
idStatsMismatch.soldiers[0].normalSoldierId = otherNormalStats.id;
idStatsMismatch.soldiers[0].normalSoldierBaseStats = structuredClone(otherNormalStats.baseStats);
mustFail('NORMAL ID/stats mismatch', () => validate(`${JSON.stringify(idStatsMismatch, null, 2)}\n`));
const staleStats = generated.replace('"normalSoldierBaseStats": {\n        "hp": 43', '"normalSoldierBaseStats": {\n        "hp": 44');
mustFail('stale NORMAL stats generated artifact', () => validate(staleStats));
const wrongSkillName = JSON.parse(generated);
wrongSkillName.soldiers.find((soldier) => soldier.spSoldierId === 5115).skillReferences[0].nameCn += 'tampered';
mustFail('generated Skill name mutation', () => validate(JSON.stringify(wrongSkillName, null, 2) + '\n'));
const wrongSkillDescription = JSON.parse(generated);
wrongSkillDescription.soldiers.find((soldier) => soldier.spSoldierId === 5115).skillReferences[0].descriptionCn += 'tampered';
mustFail('generated Skill description mutation', () => validate(JSON.stringify(wrongSkillDescription, null, 2) + '\n'));
const unauthorizedMechanics = JSON.parse(generated);
unauthorizedMechanics.soldiers.find((soldier) => soldier.spSoldierId === 5115).skillReferences[0].mechanics = { inferred: true };
mustFail('unapproved mechanics field', () => validate(JSON.stringify(unauthorizedMechanics, null, 2) + '\n'));
const nonTargetExpansion = JSON.parse(generated);
nonTargetExpansion.soldiers.find((soldier) => soldier.spSoldierId !== 5115).skillReferences = [];
mustFail('non-target Skill payload expansion', () => validate(JSON.stringify(nonTargetExpansion, null, 2) + '\n'));
process.stdout.write('SP Soldier presentation regressions: PASS (SP/NORMAL stats joins, Skill exact parity, negative scope and freshness)\n');
