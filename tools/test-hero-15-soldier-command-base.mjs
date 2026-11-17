import assert from 'node:assert/strict';
import { loadInputs, validateHero15SoldierCommandBase } from './validate-hero-15-soldier-command-base.mjs';

const baseline = await loadInputs();
validateHero15SoldierCommandBase(baseline);

const cases = [
  ['wrong HeroInfo ID', ({ evidence }) => { evidence.rawRecord.ID = 16; }],
  ['missing Canonical Hero endpoint', ({ identities }) => {
    identities.records = identities.records.filter(({ heroId }) => heroId !== 15);
  }],
  ['wrong source index', ({ evidence }) => { evidence.source.recordIndex = 15; }],
  ['source integer coerced to string', ({ evidence }) => { evidence.rawRecord.HPCmd_INI = '1500'; }],
  ['absent attack materialized as raw zero', ({ evidence }) => { evidence.rawRecord.ATCmd_INI = 0; }],
  ['incorrect protobuf field number', ({ evidence }) => { evidence.fieldContract.fieldNumbers.HPCmd_INI = 23; }],
  ['scale moved to a different predecessor', ({ evidence }) => { evidence.transformationEvidence.commit = '0'.repeat(40); }],
  ['source and Canonical agree on a wrong raw value', ({ evidence, canonical }) => {
    evidence.rawRecord.HPCmd_INI = 1600;
    canonical.records[0].raw.hp = 1600;
    canonical.records[0].base.hp = 16;
  }],
  ['raw value used as a base percentage', ({ canonical }) => { canonical.records[0].base.hp = 1500; }],
  ['missing defense turned into a zero modifier', ({ canonical }) => { canonical.records[0].base.df = 0; }],
  ['SP applicability inferred', ({ canonical }) => { canonical.records[0].appliesToSp = true; }],
  ['final formula added', ({ canonical }) => { canonical.records[0].finalModifiers = { hp: 15 }; }],
  ['additional Hero record', ({ canonical }) => { canonical.records.push({ ...canonical.records[0], heroId: 16 }); }],
];

for (const [name, mutate] of cases) {
  const inputs = structuredClone(baseline);
  mutate(inputs);
  assert.throws(() => validateHero15SoldierCommandBase(inputs), name);
}
console.log(`Hero 15 Soldier Command base regression: PASS (${cases.length} mutations rejected)`);
