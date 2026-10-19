import assert from 'node:assert/strict';
import { loadProductionKoLocalizationInputs, validateProductionKoLocalization } from './validate-production-ko-localization.mjs';

const input = await loadProductionKoLocalizationInputs();
const result = validateProductionKoLocalization(input);
assert.deepEqual(result.localizedIds, [3, 4, 5, 6, 7]);
assert.equal(result.identityCount, 5);
assert.equal(result.relationCount, 7);

for (const [label, mutate] of [
  ['duplicate localization', (x) => x.localization.records.push(structuredClone(x.localization.records[0]))],
  ['missing Production localization', (x) => { x.localization.records.pop(); }],
  ['unknown Production localization', (x) => x.localization.records.push({ productionId: 8, nameKo: '다른 작품', evidenceClass: 'A', provenance: 'test' })],
  ['changed reviewed label', (x) => { x.localization.records[0].nameKo = '다른 이름'; }],
  ['official status drift', (x) => { x.evidence.officialKrProvenanceStatus = 'verified'; }],
  ['Chinese identity mismatch', (x) => { x.evidence.records[0].nameCn = '错误名称'; }],
  ['duplicate evidence', (x) => x.evidence.records.push(structuredClone(x.evidence.records[0]))],
  ['relation scope drift', (x) => { x.relations.records.pop(); }],
]) {
  const candidate = structuredClone(input);
  mutate(candidate);
  assert.throws(() => validateProductionKoLocalization(candidate), undefined, label);
}
process.stdout.write('Production Korean localization regression: PASS (exact IDs/labels, provenance, and relation-scope negatives)\\n');
