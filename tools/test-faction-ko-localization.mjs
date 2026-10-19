import assert from 'node:assert/strict';
import { loadFactionKoLocalizationInputs, validateFactionKoLocalization } from './validate-faction-ko-localization.mjs';

const input = await loadFactionKoLocalizationInputs();
const result = validateFactionKoLocalization(input);
assert.deepEqual(result.localizedIds, [1, 2, 4, 5, 6, 7, 8, 9]);
assert.deepEqual(result.untranslatedIds, [11]);
assert.deepEqual(result.manualReviewIds, [3]);
assert.equal(result.relationCount, 17);

const clone = () => structuredClone(input);
for (const [label, mutate] of [
  ['duplicate localization', (x) => x.localization.records.push(x.localization.records[0])],
  ['Faction 3 admission', (x) => x.localization.records.push({ factionId: 3, nameKo: '빛의 기원', evidenceClass: 'A', provenance: 'test' })],
  ['Faction 11 localization', (x) => x.localization.records.push({ factionId: 11, nameKo: '추측값', evidenceClass: 'A', provenance: 'test' })],
  ['changed supplied value', (x) => { x.localization.records[0].nameKo = '다른 이름'; }],
  ['missing exact target', (x) => { x.localization.records = x.localization.records.filter((r) => r.factionId !== 8); }],
  ['manual-review loss', (x) => { x.evidence.manualReview = []; }],
  ['relation scope drift', (x) => { x.relations.records.pop(); }],
]) {
  const candidate = clone();
  mutate(candidate);
  assert.throws(() => validateFactionKoLocalization(candidate), undefined, label);
}
process.stdout.write('Faction Korean localization regression: PASS (exact target/value, exclusion, untranslated state, provenance, and relation-boundary negatives)\n');
