import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateAwakeningLevelRawDetailsData } from './validate-awakening-level-raw-details.mjs';

const read = async (path) => JSON.parse(await readFile(path, 'utf8'));
const original = {
  evidence: await read('evidence/source/awakening/awakening-level-raw-details.v1.json'),
  canonical: await read('canonical/awakening-level-raw-details.v1.json'),
  referenceEvidence: await read('evidence/source/awakening/hero15-awakening-references.v1.json'),
  referenceCanonical: await read('canonical/hero-awakening-references.v1.json'),
};
const fresh = () => structuredClone(original);
const cases = [
  ['source commit pin', d => { d.evidence.source.commit = '0'.repeat(40); }],
  ['source blob pin', d => { d.evidence.source.gitBlobSha1 = '0'.repeat(40); }],
  ['source SHA-256 pin', d => { d.evidence.source.sha256 = '0'.repeat(64); }],
  ['source length', d => { d.evidence.source.byteLength += 1; }],
  ['source record count', d => { d.evidence.source.recordCount -= 1; }],
  ['source index', d => { d.evidence.records[0].sourceArrayIndex += 1; }],
  ['source locator', d => { d.evidence.records[1].recordLocator = 'ConfigDataAwakenLevelInfo#ID=1015'; }],
  ['missing level 1015', d => { d.canonical.records.shift(); }],
  ['duplicate level ID', d => { d.canonical.records[1].levelId = 1015; }],
  ['replacement level ID', d => { d.canonical.records[1].levelId = 2016; }],
  ['stage reference mismatch', d => { d.referenceCanonical.records[0].stage2LevelReference.levelId = 2016; }],
  ['Battle_ID value', d => { d.canonical.records[0].rawFields.Battle_ID += 1; }],
  ['MonsterLevel value', d => { d.canonical.records[1].rawFields.MonsterLevel += 1; }],
  ['MonsterLevel type', d => { d.canonical.records[1].rawFields.MonsterLevel = '70'; }],
  ['Name source text', d => { d.evidence.records[0].rawRecord.Name += '改'; }],
  ['Desc source text', d => { d.canonical.records[1].rawFields.Desc += '改'; }],
  ['Image source text', d => { d.canonical.records[0].rawFields.Image = 'other.png'; }],
  ['missing admitted field', d => { delete d.canonical.records[0].rawFields.Image; }],
  ['extra source field', d => { d.evidence.records[0].rawRecord.Other = 1; }],
  ['false source inventory omission', d => { d.evidence.inspectedFields.pop(); }],
  ['non-admitted field promoted into canonical', d => { d.canonical.records[0].rawFields.Other = 1; }],
  ['source field state changed', d => { d.evidence.records[1].fieldStates.Name = 'NULL'; }],
  ['field absence confused with omission', d => { d.evidence.records[0].fieldStates.Image = 'ABSENT'; }],
  ['runtime meaning added', d => { d.canonical.records[0].runtimeRules = { unlocked: true }; }],
  ['publication added', d => { d.canonical.records[0].publication = true; }],
  ['Evidence and Canonical jointly corrupted', d => { d.evidence.records[0].rawRecord.Battle_ID = 1; d.canonical.records[0].rawFields.Battle_ID = 1; }],
];
validateAwakeningLevelRawDetailsData(original);
for (const [label, mutate] of cases) {
  const data = fresh();
  mutate(data);
  assert.throws(() => validateAwakeningLevelRawDetailsData(data), undefined, `must reject ${label}`);
}
process.stdout.write(`Awakening Level raw-detail negative controls: PASS (${cases.length})\n`);
