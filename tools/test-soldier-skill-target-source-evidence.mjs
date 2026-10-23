import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  EVIDENCE_PATH,
  validateSoldierSkillTargetSourceEvidence,
} from './validate-soldier-skill-target-source-evidence.mjs';

const evidence = JSON.parse(await readFile(resolve(EVIDENCE_PATH), 'utf8'));
const clone = value => structuredClone(value);
let negativeCount = 0;
function rejects(label, mutate) {
  const value = clone(evidence);
  mutate(value);
  assert.throws(() => validateSoldierSkillTargetSourceEvidence(value), undefined, label);
  negativeCount += 1;
}
function raw(id) { return evidence.records.find(row => row.rawRecord.ID === id).rawRecord; }

assert.equal(validateSoldierSkillTargetSourceEvidence(evidence).recordCount, 30);
rejects('source commit drift', value => { value.source.commit = '0'.repeat(40); });
rejects('source path drift', value => { value.source.path = 'other.json'; });
rejects('Git blob drift', value => { value.source.gitBlobSha1 = '0'.repeat(40); });
rejects('source SHA-256 drift', value => { value.source.sha256 = '0'.repeat(64); });
rejects('source byte-size drift', value => { value.source.sizeBytes += 1; });
rejects('source record-count drift', value => { value.source.recordCount += 1; });
rejects('archive verification overstated', value => { value.source.archiveBytesVerifiedHere = true; });
rejects('record omitted', value => { value.records.pop(); });
rejects('record added', value => { value.records.push(structuredClone(value.records[0])); });
rejects('duplicate ID', value => { value.records[1].rawRecord.ID = value.records[0].rawRecord.ID; });
rejects('out-of-scope ID', value => { value.records[0].rawRecord.ID = 999999; });
rejects('ID JSON type changed', value => { value.records[0].rawRecord.ID = '60666'; });
rejects('ID value changed', value => { value.records[0].rawRecord.ID += 1; });
rejects('source record locator changed', value => { value.records[0].sourceRecordLocator += '/Name'; });
rejects('reference grouping changed', value => { value.records[0].selectionContexts = ['soldier-5115-sp']; });
rejects('Name omitted', value => { delete value.records[0].rawRecord.Name; });
rejects('Desc omitted', value => { delete value.records[0].rawRecord.Desc; });
rejects('PassiveBuffs_ID type changed', value => { value.records[0].rawRecord.PassiveBuffs_ID = '[]'; });
rejects('SkillAIType type changed', value => { value.records[0].rawRecord.SkillAIType = String(value.records[0].rawRecord.SkillAIType); });
rejects('SkillType type changed', value => { value.records[0].rawRecord.SkillType = null; });
rejects('BattlePower type changed', value => { value.records[0].rawRecord.BattlePower = '0'; });
rejects('SP Icon type changed', value => { value.records[10].rawRecord.Icon = null; });
rejects('raw text value changed', value => { value.records[0].rawRecord.Desc += ' altered'; });
rejects('raw array order changed', value => { value.records[10].rawRecord.PassiveBuffs_ID.reverse(); });
rejects('raw array item changed', value => { value.records[0].rawRecord.PassiveBuffs_ID.push(123456); });
rejects('unapproved semantic field added', value => { value.records[0].rawRecord.effectFormula = 'inferred'; });
rejects('scope widened', value => { value.scope.recordIds.push(999999); });
rejects('extraction selection weakened', value => { value.extraction.selectedBy = 'array index'; });
rejects('Archive limitation removed', value => { value.extraction.limitation = 'all verified'; });
rejects('wrapper semantic field added', value => { value.records[0].skillEffect = 'inferred'; });
assert.equal(raw(60666).ID, 60666);
console.log(`Skill target Source Evidence tests: PASS (${negativeCount} negative cases plus valid 30-record fixture)`);
