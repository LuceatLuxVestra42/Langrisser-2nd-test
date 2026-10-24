import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateSoldierTrainingTechLevelCosts } from './validate-soldier-training-tech-level-costs.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relativePath => JSON.parse(fs.readFileSync(path.resolve(root, relativePath), 'utf8'));
const fixture = {
  evidence: read('evidence/source/configdata/soldier-training-tech-223-level-costs.v1.json'),
  canonical: read('canonical/soldier-training-tech-level-costs.v1.json'),
  soldiers: read('canonical/soldiers.v1.json'),
  spRelations: read('canonical/sp-soldier-normal-relations.v1.json'),
  descriptions: read('canonical/soldier-training-tech-descriptions.v1.json'),
};
const clone = value => structuredClone(value);
let checks = 0;
function rejects(label, mutate) {
  const value = clone(fixture);
  mutate(value);
  assert.throws(() => validateSoldierTrainingTechLevelCosts(value), undefined, label);
  checks++;
}
function accepts(label, mutate) {
  const value = clone(fixture);
  mutate(value);
  assert.equal(validateSoldierTrainingTechLevelCosts(value).recordCount, 10, label);
  checks++;
}
assert.equal(validateSoldierTrainingTechLevelCosts(fixture).recordCount, 10);
checks++;
rejects('wrong TrainingTech ID', x => { x.evidence.selection.trainingTechId = 224; });
rejects('wrong explicit LevelInfo link', x => { x.evidence.selection.trainingTechRecord.TechLevelupInfoList[0] = 2231; });
rejects('missing source row', x => { x.evidence.rawLevelInfoCostRecords.pop(); });
rejects('duplicate source row', x => { x.evidence.rawLevelInfoCostRecords[1].ID = 2230; });
rejects('extra canonical row', x => { x.canonical.records.push(clone(x.canonical.records[0])); });
rejects('gold value mutation', x => { x.canonical.records[0].levelupGoldCost += 1; });
rejects('gold JSON type mutation', x => { x.canonical.records[0].levelupGoldCost = String(x.canonical.records[0].levelupGoldCost); });
rejects('materials quantity mutation', x => { x.canonical.records[0].levelupMaterialsCost[0].Count += 1; });
rejects('material array reorder', x => { x.canonical.records[0].levelupMaterialsCost.reverse(); });
rejects('source evidence field removed', x => { delete x.evidence.rawLevelInfoCostRecords[0].LevelupGoldCost; });
rejects('missing field disguised as zero', x => { x.evidence.rawLevelInfoCostRecords[0].LevelupGoldCost = 0; });
rejects('null state mistaken for missing', x => { x.evidence.rawLevelInfoCostRecords[0].sourceFieldStates.LevelupGoldCost.jsonType = 'null'; });
rejects('empty array substituted for source materials', x => { x.evidence.rawLevelInfoCostRecords[0].LevelupMaterialsCost = []; });
rejects('material item field absent', x => { delete x.evidence.rawLevelInfoCostRecords[0].LevelupMaterialsCost[0].Count; });
rejects('material item field substituted', x => { x.canonical.records[0].levelupMaterialsCost[0].GoodsType = 7; });
rejects('incorrect provenance', x => { x.canonical.records[0].provenance.sourceCostRecord = 'wrong'; });
rejects('game-level semantics leaked into canonical', x => { x.canonical.records[0].level = 1; });
rejects('identity endpoint removed', x => { x.soldiers.records = x.soldiers.records.filter(r => !(r.variant === 'NORMAL' && r.id === 115)); });
rejects('SP relation endpoint changed', x => { x.spRelations.records = x.spRelations.records.filter(r => r.spSoldierId !== 5115); });
rejects('identity endpoint duplicated', x => { x.soldiers.records.push(clone(x.soldiers.records.find(r => r.id === 115))); });
rejects('identity endpoint variant changed', x => { x.soldiers.records.find(r => r.id === 115).variant = 'SP'; });
rejects('conflicting SP correspondence added', x => { x.spRelations.records.push({ spSoldierId: 5115, normalSoldierId: 118 }); });
// Description validation remains in its own validator/test; costs consume no description fields.
accepts('independent description owner not required', x => { delete x.descriptions; });
// These extra records are memory-only consumer probes, not game entity admissions.
accepts('unrelated description added', x => { x.descriptions.records.push({ ...clone(x.descriptions.records[0]), trainingTechId: 224, levelInfoId: 2240 }); });
accepts('unrelated Soldier identity added', x => { x.soldiers.records.push({ entity: 'Soldier', id: 999999, variant: 'NORMAL' }); });
accepts('unrelated SP correspondence added', x => { x.spRelations.records.push({ spSoldierId: 999999, normalSoldierId: 999998 }); });
process.stdout.write('Soldier TrainingTech 223 raw cost negative tests: PASS (' + checks + ' checks)\\n');

