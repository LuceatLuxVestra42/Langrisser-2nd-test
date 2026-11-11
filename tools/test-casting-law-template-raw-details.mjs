import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateCastingLawTemplateRawDetailsData } from './validate-casting-law-template-raw-details.mjs';

const read = async (path) => JSON.parse(await readFile(path, 'utf8'));
const original = {
  evidence: await read('evidence/source/jobs/casting-law-template-raw-details.v1.json'),
  canonical: await read('canonical/casting-law-template-raw-details.v1.json'),
  referenceEvidence: await read('evidence/source/jobs/hero15-casting-law-template-references.v1.json'),
  referenceCanonical: await read('canonical/hero-casting-law-template-references.v1.json'),
};
const fresh = () => structuredClone(original);
const cases = [
  ['Template ID', d => { d.canonical.records[0].templateId = 14; }],
  ['Source namespace', d => { d.evidence.source.path = 'data/configdata/ConfigDataJobInfo.json'; }],
  ['Source Record Index', d => { d.evidence.templateRecords[0].sourceArrayIndex += 1; }],
  ['Record locator', d => { d.evidence.templateRecords[0].recordLocator = 'ConfigDataCastingLawTemplateInfo#ID=14'; }],
  ['Commit pin', d => { d.evidence.source.commit = '0'.repeat(40); }],
  ['Blob pin', d => { d.evidence.source.gitBlobSha1 = '0'.repeat(40); }],
  ['SHA-256 pin', d => { d.evidence.source.sha256 = '0'.repeat(64); }],
  ['Chinese Name', d => { d.evidence.templateRecords[0].rawRecord.Name += '改'; }],
  ['Icon', d => { d.evidence.templateRecords[1].rawRecord.Icon = 'other.png'; }],
  ['Level array order', d => { d.canonical.records[1].rawRecord.CastingLawLevelUpInfoList.reverse(); }],
  ['Level array omission', d => { d.canonical.records[2].rawRecord.CastingLawLevelUpInfoList.pop(); }],
  ['Field type', d => { d.canonical.records[3].rawRecord.EquipmentType = '2'; }],
  ['Absent vs Null', d => { d.canonical.records[0].fieldStates.EquipmentType = 'NULL'; }],
  ['Absent vs Empty', d => { d.canonical.records[1].rawRecord.EquipmentType = []; }],
  ['Absent vs Zero', d => { d.canonical.records[1].rawRecord.EquipmentType = 0; }],
  ['Present EquipmentType missing', d => { delete d.canonical.records[4].rawRecord.EquipmentType; }],
  ['EquipmentType value', d => { d.canonical.records[2].rawRecord.EquipmentType = 2; }],
  ['Evidence raw value', d => { d.evidence.templateRecords[2].rawRecord.CastingLawLevelUpInfoList[0] = 999; }],
  ['Field presence state', d => { d.evidence.templateRecords[0].fieldStates.EquipmentType = 'PRESENT'; }],
  ['Index/ID relation', d => { d.evidence.templateRecords[4].rawRecord.ID = 40; }],
  ['Hero ID contaminates Template identity', d => { d.canonical.records[0].heroId = 15; }],
  ['Level relation mixed into raw detail', d => { d.canonical.records[0].levelReferences = [66]; }],
  ['Runtime rule', d => { d.canonical.records[0].masteryUnlocked = true; }],
  ['Duplicate shared identity', d => { d.canonical.records.push(structuredClone(d.canonical.records[0])); }],
  ['Per-Hero duplicate identity', d => { d.canonical.records[0].heroId = 15; d.canonical.records.push({ ...structuredClone(d.canonical.records[0]), templateId: 12 }); }],
  ['Existing Hero-Template Reference', d => { d.referenceCanonical.records.pop(); }],
  ['Endpoint presence promoted to detail admission', d => { d.evidence.selectionEvidence.existingEndpointPresenceEvidenceReused = false; }],
  ['Canonical provenance', d => { d.canonical.records[0].provenance = 'wrong'; }],
];
validateCastingLawTemplateRawDetailsData(original);
for (const [label, mutate] of cases) {
  const data = fresh();
  mutate(data);
  assert.throws(() => validateCastingLawTemplateRawDetailsData(data), undefined, `must reject ${label}`);
}
console.log(`Casting Law Template raw-detail negative controls: PASS (${cases.length})`);
