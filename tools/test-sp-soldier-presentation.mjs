import { readFile } from 'node:fs/promises';
import { renderSpSoldiers } from './generate.mjs';
import { validateSpSoldierPresentation } from './validate-sp-soldier-presentation.mjs';

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const [identities, localizations, normalLocalizations, baseStats, relations, normalBaseStats] = await Promise.all([
  readJson('canonical/soldiers.v1.json'),
  readJson('canonical/sp-soldier-localizations-ko.v1.json'),
  readJson('canonical/normal-soldier-localizations-ko.v1.json'),
  readJson('canonical/sp-soldier-base-stats.v1.json'),
  readJson('canonical/sp-soldier-normal-relations.v1.json'),
  readJson('canonical/normal-soldier-base-stats.v1.json'),
]);
const render = (names = localizations, normalNames = normalLocalizations, stats = baseStats, links = relations, soldiers = identities, normalStats = normalBaseStats) =>
  renderSpSoldiers(soldiers, names, normalNames, stats, links, normalStats);
const generated = render();
const mustFail = (label, action) => {
  let failed = false;
  try { action(); } catch { failed = true; }
  if (!failed) throw new Error(`regression did not fail: ${label}`);
};
const validate = (text) => validateSpSoldierPresentation(identities, localizations, normalLocalizations, baseStats, relations, normalBaseStats, text);

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
mustFail('identity set mismatch', () => render(localizations, normalLocalizations, baseStats, relations, { ...identities, records: identities.records.filter((r) => r.id !== 5115) }));

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
process.stdout.write('SP Soldier presentation regressions: PASS (SP/NORMAL stats joins, name/relation, stat swaps, schema, order and freshness)\n');
