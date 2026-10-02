import { readFile } from 'node:fs/promises';
import { renderSpSoldiers } from './generate.mjs';
import { validateSpSoldierPresentation } from './validate-sp-soldier-presentation.mjs';

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const [identities, localizations, baseStats, relations] = await Promise.all([
  readJson('canonical/soldiers.v1.json'),
  readJson('canonical/sp-soldier-localizations-ko.v1.json'),
  readJson('canonical/sp-soldier-base-stats.v1.json'),
  readJson('canonical/sp-soldier-normal-relations.v1.json'),
]);
const render = (names = localizations, stats = baseStats, links = relations, soldiers = identities) =>
  renderSpSoldiers(soldiers, names, stats, links);
const generated = render();
const mustFail = (label, action) => {
  let failed = false;
  try { action(); } catch { failed = true; }
  if (!failed) throw new Error(`regression did not fail: ${label}`);
};

validateSpSoldierPresentation(identities, localizations, baseStats, relations, generated);
mustFail('missing localization', () => render({ ...localizations, records: localizations.records.slice(1) }));
mustFail('duplicate localization', () => render({ ...localizations, records: [...localizations.records, localizations.records[0]] }));
mustFail('missing base stats', () => render(localizations, { ...baseStats, records: baseStats.records.slice(1) }));
mustFail('duplicate base stats', () => render(localizations, { ...baseStats, records: [...baseStats.records, baseStats.records[0]] }));
mustFail('missing relation', () => render(localizations, baseStats, { ...relations, records: relations.records.slice(1) }));
mustFail('duplicate relation', () => render(localizations, baseStats, { ...relations, records: [...relations.records, relations.records[0]] }));
mustFail('identity set mismatch', () => render(localizations, baseStats, relations, { ...identities, records: identities.records.filter((r) => r.id !== 5115) }));
const changedNormalId = JSON.parse(generated);
changedNormalId.soldiers[0].normalSoldierId += 1;
mustFail('wrong generated NORMAL Soldier ID', () => validateSpSoldierPresentation(identities, localizations, baseStats, relations, `${JSON.stringify(changedNormalId, null, 2)}\n`));
const extraField = JSON.parse(generated);
extraField.soldiers[0].provenance = 'must not leak';
mustFail('provenance field leak', () => validateSpSoldierPresentation(identities, localizations, baseStats, relations, `${JSON.stringify(extraField, null, 2)}\n`));
const reversed = JSON.parse(generated);
reversed.soldiers.reverse();
mustFail('wrong order', () => validateSpSoldierPresentation(identities, localizations, baseStats, relations, `${JSON.stringify(reversed, null, 2)}\n`));
mustFail('stale value', () => validateSpSoldierPresentation(identities, localizations, baseStats, relations, generated.replace('근위창병', '잘못된 이름')));
process.stdout.write('SP Soldier presentation regressions: PASS (missing/duplicate joins, mismatch, wrong relation, leak, order and stale data)\n');
