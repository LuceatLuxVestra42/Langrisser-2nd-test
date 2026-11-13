import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadInputs, validateFetterInternalProjection } from './hero-15-fetter-internal.mjs';

const inputs = await loadInputs();
const generated = await readFile('generated/hero-15-fetter-internal.v1.json', 'utf8');
validateFetterInternalProjection(inputs, generated);
let rejected = 0;
const reject = (label, input = inputs, text = generated) => {
  assert.throws(() => validateFetterInternalProjection(input, text), undefined, label);
  rejected += 1;
};
const edit = (fn) => {
  const value = JSON.parse(generated);
  fn(value);
  return `${JSON.stringify(value, null, 2)}\n`;
};
const mutateInput = (key, fn) => {
  const copy = structuredClone(inputs);
  fn(copy[key]);
  return copy;
};

reject('Fetter endpoint changed', inputs, edit((x) => { x.fetters[0].reference.fetterId = 71; }));
reject('Fetter omitted', inputs, edit((x) => { x.fetters.pop(); }));
reject('Fetter duplicated', inputs, edit((x) => { x.fetters.push(structuredClone(x.fetters[0])); }));
reject('Hero scope contamination', mutateInput('references', (x) => { x.records[0].heroId = 8; }));
reject('Raw Detail endpoint mismatch', inputs, edit((x) => { x.fetters[0].rawDetail.endpointId = 67; }));
reject('Raw Detail field mutation', inputs, edit((x) => { x.fetters[0].rawDetail.fields.MaxLevel = 99; }));
reject('Raw Detail provenance mutation', inputs, edit((x) => { x.fetters[0].rawDetail.provenance = 'tampered'; }));
reject('Skill reference endpoint mutation', inputs, edit((x) => { x.fetters[0].skillReferences[0].reference.skillId = 70072; }));
reject('Skill reference locator mutation', inputs, edit((x) => { x.fetters[0].skillReferences[0].reference.sourceArrayIndex = 0; }));
reject('Skill Identity text mutation', inputs, edit((x) => { x.fetters[0].skillReferences[0].skillIdentity.nameCn = 'changed'; }));
reject('Skill Identity provenance mutation', inputs, edit((x) => { x.fetters[0].skillReferences[0].skillIdentity.provenance.name = 'tampered'; }));
reject('Skill Identity endpoint missing', mutateInput('skills', (x) => { x.records = x.records.filter((row) => row.skillId !== 70001); }));
reject('Material relation endpoint mutation', inputs, edit((x) => { x.fetters[0].materials.relations[0].itemId = 3201; }));
reject('Material Identity endpoint missing', mutateInput('materials', (x) => { x.itemEndpoints = x.itemEndpoints.filter((row) => row.itemId !== 3200); }));
reject('Gold locator mutation', inputs, edit((x) => { x.fetters[0].goldLocators[0].sourceArrayIndex = 8; }));
reject('Reward type enum mutation', inputs, edit((x) => { x.fetters[0].rewardTypeReferences[0].enumMember = 'invented'; }));
reject('Condition type enum mutation', inputs, edit((x) => { x.fetters[0].conditionTypeReferences[0].typeCode = 2; }));
reject('Heart Fetter mixed into regular list', inputs, edit((x) => { x.fetters.push(structuredClone(x.fetters[0])); x.fetters[0].reference = x.heartFetter.reference; }));
reject('Heart raw detail mutation', inputs, edit((x) => { x.heartFetter.rawDetail.fields.ShownSkillCount = 9; }));
reject('Heart ConditionType 7 mutation', inputs, edit((x) => { x.heartFetter.rawSkillConditions.records[0].conditions[0].conditionType = 1; }));
reject('Heart MANUAL_REVIEW status changed', inputs, edit((x) => { x.heartFetter.rawSkillConditions.meaningStatus = 'APPROVED'; }));
reject('Unapproved runtime meaning', inputs, edit((x) => { x.fetters[0].completionStatus = 'COMPLETE'; }));
reject('Unapproved localization', inputs, edit((x) => { x.heartFetter.nameKo = '임의 번역'; }));
reject('Wrong domain endpoint kind', inputs, edit((x) => { x.fetters[0].materials.relations[0].endpointKind = 'HEART_FETTER'; }));
reject('Serialization/parity damage', inputs, `${generated.trim()} `);
reject('Canonical reference population drift', mutateInput('references', (x) => { x.records.pop(); }));
reject('Canonical condition provenance drift', mutateInput('conditions', (x) => { x.records[0].evidenceProvenance = 'tampered'; }));
console.log(`Hero 15 Fetter internal negative controls: PASS (${rejected})`);
