import assert from 'node:assert/strict';
import { loadProductionKoLocalizationInputs, validateProductionKoLocalization } from './validate-production-ko-localization.mjs';

const input = await loadProductionKoLocalizationInputs();
const result = validateProductionKoLocalization(input);
assert.deepEqual(result.localizedIds, [3, 4, 5, 6, 7, 8]);
assert.equal(result.identityCount, 6);
assert.equal(result.relationCount, 29);
assert.equal(result.presentationRelationCount, 22);

const withoutHiddenRelation = structuredClone(input);
withoutHiddenRelation.relations.records = withoutHiddenRelation.relations.records.filter((row) => row.heroId !== 9);
assert.doesNotThrow(() => validateProductionKoLocalization(withoutHiddenRelation), 'hidden Hero relations belong to the Canonical relation owner, not the presentation localization check');

for (const [label, mutate] of [
  ['duplicate localization', (x) => x.localization.records.push(structuredClone(x.localization.records[0]))],
  ['missing Production localization', (x) => { x.localization.records.pop(); }],
  ['unknown Production localization', (x) => x.localization.records.push({ productionId: 9, nameKo: '다른 작품', evidenceClass: 'A', provenance: 'test' })],
  ['changed project reference label', (x) => { x.localization.records[0].nameKo = '다른 이름'; }],
  ['ID 8 Evidence has wrong Korean label', (x) => { x.evidence.records.find((row) => row.productionId === 8).nameKo = '랭그릿사V'; }],
  ['ID 8 Canonical has wrong Korean label', (x) => { x.localization.records.find((row) => row.productionId === 8).nameKo = '랭그릿사V'; }],
  ['ID 8 Evidence and Canonical share wrong Korean label', (x) => { x.evidence.records.find((row) => row.productionId === 8).nameKo = '랭그릿사V'; x.localization.records.find((row) => row.productionId === 8).nameKo = '랭그릿사V'; }],
  ['wrong ID 8 source locator', (x) => { x.evidence.records.find((row) => row.productionId === 8).locator = 'evidence/localization/source/production-names-ko.reference.v1.txt#L49'; }],
  ['missing ID 8 source row', (x) => { x.referenceBytes = Buffer.from(x.referenceBytes.toString('utf8').replace('8 - 梦幻模拟战V - 랑그릿사V\\n', '')); }],
  ['duplicate ID 8 source row', (x) => { x.referenceBytes = Buffer.from(x.referenceBytes.toString('utf8').replace('[진영]', '8 - 梦幻模拟战V - 랑그릿사V\\n[진영]')); }],
  ['malformed source row', (x) => { x.referenceBytes = Buffer.from(x.referenceBytes.toString('utf8').replace('1 - 空之轨迹', 'invalid - 空之轨迹')); }],
  ['ID 8 source checksum mismatch', (x) => { x.referenceBytes = Buffer.from(x.referenceBytes.toString('utf8').replace('영웅전설 하늘의 궤적', '다른 번역')); }],
  ['existing ID 3–7 name changed', (x) => { x.evidence.records.find((row) => row.productionId === 4).nameKo = '다른 이름'; }],
  ['official status drift', (x) => { x.evidence.officialKrProvenanceStatus = 'verified'; }],
  ['Chinese identity mismatch', (x) => { x.evidence.records[0].nameCn = '错误名称'; }],
  ['duplicate evidence', (x) => x.evidence.records.push(structuredClone(x.evidence.records[0]))],
  ['missing presentation relation', (x) => { x.relations.records = x.relations.records.filter((row) => row.heroId !== 5); }],
]) {
  const candidate = structuredClone(input);
  mutate(candidate);
  assert.throws(() => validateProductionKoLocalization(candidate), undefined, label);
}
process.stdout.write('Production Korean localization regression: PASS (exact IDs/labels, provenance, and presentation relation boundary)\n');
