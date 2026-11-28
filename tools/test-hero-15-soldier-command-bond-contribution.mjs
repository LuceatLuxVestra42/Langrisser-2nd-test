import assert from 'node:assert/strict';
import { loadInputs, validateHero15SoldierCommandBondContribution } from './validate-hero-15-soldier-command-bond-contribution.mjs';

const baseline = await loadInputs();
validateHero15SoldierCommandBondContribution(baseline);

const cases = [
  ['Lance Fetter 73 given Liana Skill', ({lanceEvidence}) => { lanceEvidence.fetters[2].GotSkills_ID[9] = 70039; }],
  ['source snapshot drift', ({ evidence }) => { evidence.source.commit = '0'.repeat(40); }],
  ['wrong Hero Information in Canonical', ({ references }) => { references.records[0].heroInformationId = 16; }],
  ['Heart Fetter added to regular track set', ({ references }) => {
    references.records.push({ ...references.records[0], fetterId: 15 });
  }],
  ['lower level selected', ({ fetterDetails }) => { fetterDetails.records[0].fields.MaxLevel = 9; }],
  ['wrong maximum-level skill', ({ evidence }) => {
    evidence.records.ConfigDataHeroFetterInfo[0].rawRecord.GotSkills_ID[9] = 70008;
  }],
  ['missing Buff link', ({ evidence }) => { evidence.records.ConfigDataSkillInfo[1].rawRecord.PassiveBuffs_ID.pop(); }],
  ['command property changed to a Hero stat', ({ evidence }) => { evidence.records.ConfigDataBuffInfo[0].rawRecord.Property1_ID = 87; }],
  ['source and Canonical raw values altered together', ({ evidence, canonical }) => {
    evidence.records.ConfigDataBuffInfo[0].rawRecord.Property1_Value = 1100;
    canonical.records[0].raw.hp = 2600;
    canonical.records[0].contribution.hp = 26;
  }],
  ['percent scale changed', ({ canonical }) => { canonical.records[0].contribution.hp = 2500; }],
  ['missing contribution component', ({ canonical }) => { delete canonical.records[0].contribution.df; }],
  ['final value promoted', ({ canonical }) => { canonical.records[0].finalModifiers = { hp: 40 }; }],
  ['SP applicability inferred', ({ canonical }) => { canonical.records[0].appliesToSp = true; }],
];
for (const [name, mutate] of cases) {
  const inputs = structuredClone(baseline);
  mutate(inputs);
  assert.throws(() => validateHero15SoldierCommandBondContribution(inputs), name);
}
console.log(`Hero 15 Soldier Command bond contribution regression: PASS (${cases.length} mutations rejected)`);
