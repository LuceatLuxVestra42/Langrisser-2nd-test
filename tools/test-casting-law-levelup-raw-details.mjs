import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateCastingLawLevelUpRawDetailsData } from './validate-casting-law-levelup-raw-details.mjs';

const read = async (path) => JSON.parse(await readFile(path, 'utf8'));
const original = {
  evidence: await read('evidence/source/jobs/casting-law-levelup-raw-details.v1.json'),
  canonical: await read('canonical/casting-law-levelup-raw-details.v1.json'),
  references: await read('canonical/casting-law-template-level-references.v1.json'),
  materials: await read('canonical/casting-law-levelup-material-references.v1.json'),
};
const fresh = () => structuredClone(original);
const cases = [
  ['LevelUp ID missing', d => { d.evidence.records.pop(); d.canonical.records.pop(); d.canonical.sourceOrder.pop(); }],
  ['unexpected ID', d => { d.evidence.records[0].levelUpInfoId = 99999; }],
  ['duplicate ID', d => { d.evidence.records[1].levelUpInfoId = d.evidence.records[0].levelUpInfoId; }],
  ['Name mutation', d => { d.evidence.records[0].rawFields.Name += '改'; }],
  ['GoldCost mutation', d => { d.evidence.records[0].rawFields.LevelUpGoldCost += 1; }],
  ['GoldCost type', d => { d.evidence.records[0].rawFields.LevelUpGoldCost = String(d.evidence.records[0].rawFields.LevelUpGoldCost); }],
  ['source commit pin', d => { d.evidence.sourceSnapshot.commit = '0'.repeat(40); }],
  ['source blob pin', d => { d.evidence.source.blobSha1 = '0'.repeat(40); }],
  ['source SHA-256 pin', d => { d.evidence.source.sha256 = '0'.repeat(64); }],
  ['record index', d => { d.evidence.records[0].sourceArrayIndex += 1; }],
  ['record locator', d => { d.evidence.records[0].recordLocator = 'wrong'; }],
  ['source ordering', d => { d.evidence.records.reverse(); }],
  ['canonical ordering', d => { d.canonical.records.reverse(); }],
  ['canonical and evidence joint corruption', d => { d.evidence.records[0].rawFields.Name = 'same wrong value'; d.canonical.records[0].rawFields.Name = 'same wrong value'; }],
  ['Property field auto-admission', d => { d.canonical.records[0].Property1_ID = 1; }],
  ['previous-Level relation promotion', d => { d.canonical.records[0].preCastingLawLevelId = 65; }],
  ['runtime gold consumption claim', d => { d.canonical.records[0].goldConsumed = true; }],
  ['publication flag', d => { d.canonical.records[0].published = true; }],
  ['Template-LevelUp relation damaged', d => { d.references.records.pop(); }],
  ['material rows damaged', d => { d.materials.records.pop(); }],
  ['ItemInfo endpoint population damaged', d => { d.materials.itemEndpoints.pop(); }],
  ['non-admitted inventory marked admitted', d => { d.evidence.records[0].fieldInventory.find(f => f.field === 'Property1_ID').admitted = true; }],
  ['field state falsified', d => { d.evidence.records[0].fieldInventory.find(f => f.field === 'PreCastingLawLevelID').state = 'PRESENT'; }],
];
validateCastingLawLevelUpRawDetailsData(original);
for (const [label, mutate] of cases) {
  const data = fresh();
  mutate(data);
  assert.throws(() => validateCastingLawLevelUpRawDetailsData(data), undefined, `must reject ${label}`);
}
console.log(`Casting Law LevelUp raw-detail negative controls: PASS (${cases.length})`);
