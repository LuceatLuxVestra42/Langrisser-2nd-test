import assert from 'node:assert/strict';
import { loadFactionKoLocalizationInputs, validateFactionKoLocalization } from './validate-faction-ko-localization.mjs';

const input = await loadFactionKoLocalizationInputs();
const result = validateFactionKoLocalization(input);
assert.deepEqual(result.localizedIds, [1, 2, 4, 5, 6, 7, 8, 9, 11]);
assert.deepEqual(result.untranslatedIds, []);
assert.deepEqual(result.outOfScopeIds, [3]);
assert.equal(result.relationCount, 42);

const clone = () => structuredClone(input);
for (const [label, mutate] of [
  ['duplicate localization', (x) => x.localization.records.push(x.localization.records[0])],
  ['Faction 3 admission', (x) => x.localization.records.push({ factionId: 3, nameKo: '빛의 기원', evidenceClass: 'A', provenance: 'test' })],
  ['missing Faction 11 localization', (x) => { x.localization.records = x.localization.records.filter((r) => r.factionId !== 11); }],
  ['changed supplied value', (x) => { x.localization.records[0].nameKo = '다른 이름'; }],
  ['missing exact target', (x) => { x.localization.records = x.localization.records.filter((r) => r.factionId !== 8); }],
  ['Faction 3 scope drift', (x) => { x.evidence.outOfScope = []; }],
  ['Faction 11 Chinese identity mismatch', (x) => { x.evidence.records.find((r) => r.factionId === 11).nameCn = '错误名称'; }],
  ['presentation relation scope drift', (x) => { x.relations.records = x.relations.records.filter((row) => !(row.heroId === 5 && row.factionId === 1)); }],
]) {
  const candidate = clone();
  mutate(candidate);
  assert.throws(() => validateFactionKoLocalization(candidate), undefined, label);
}
process.stdout.write('Faction Korean localization regression: PASS (exact target/value, exclusion, provenance, and relation-boundary negatives)\n');
