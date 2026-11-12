import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateCastingLawLevelUpPropertyRawDetailsData } from './validate-casting-law-levelup-property-raw-details.mjs';

const read = async path => JSON.parse(await readFile(path, 'utf8'));
const original = {
  evidence: await read('evidence/source/jobs/casting-law-levelup-property-raw-details.v1.json'),
  canonical: await read('canonical/casting-law-levelup-property-raw-details.v1.json'),
  references: await read('canonical/casting-law-template-level-references.v1.json'),
  templates: await read('canonical/casting-law-template-raw-details.v1.json'),
  rawDetails: await read('canonical/casting-law-levelup-raw-details.v1.json'),
  rawEvidence: await read('evidence/source/jobs/casting-law-levelup-raw-details.v1.json'),
  previous: await read('canonical/casting-law-levelup-previous-level-references.v1.json'),
  materials: await read('canonical/casting-law-levelup-material-references.v1.json'),
};
const fresh = () => structuredClone(original);
const observation = (data, recordIndex, field) => data.evidence.sourceFieldInventory.records[recordIndex].propertyObservations.find(x => x.field === field);
const canonicalProperty = (data, recordIndex, field) => data.canonical.records[recordIndex].properties.find(x => x.field === field);
const cases = [
  ['selected record missing', d => { d.evidence.sourceFieldInventory.records.pop(); }],
  ['unselected identity substituted', d => { d.evidence.sourceFieldInventory.records[0].levelUpInfoId = 99999; }],
  ['duplicate selected identity', d => { d.evidence.sourceFieldInventory.records[1].levelUpInfoId = d.evidence.sourceFieldInventory.records[0].levelUpInfoId; }],
  ['source index altered', d => { d.evidence.sourceFieldInventory.records[0].sourceArrayIndex += 1; }],
  ['record locator altered', d => { d.evidence.sourceFieldInventory.records[0].recordLocator = 'wrong'; }],
  ['source commit pin altered', d => { d.evidence.sourceSnapshot.commit = '0'.repeat(40); }],
  ['Source blob pin altered', d => { d.evidence.source.blobSha1 = '0'.repeat(40); }],
  ['Source SHA-256 altered', d => { d.evidence.source.sha256 = '0'.repeat(64); }],
  ['Property field name altered', d => { observation(d,0,'Property1_ID').field = 'Property2_ID'; }],
  ['Property ID and Value exchanged', d => { observation(d,0,'Property1_ID').rawValue = observation(d,0,'Property1_Value').rawValue; }],
  ['present raw value altered', d => { observation(d,0,'Property1_Value').rawValue += 1; }],
  ['raw value type altered', d => { observation(d,0,'Property1_Value').rawValue = String(observation(d,0,'Property1_Value').rawValue); }],
  ['present key falsely marked absent', d => { const x=observation(d,0,'Property1_ID');x.keyPresent=false;x.state='ABSENT';x.sourceType='absent';delete x.rawValue; }],
  ['ABSENT Value fabricated', d => { observation(d,10,'Property2_Value').rawValue=0; }],
  ['ABSENT converted to ZERO', d => { const x=observation(d,10,'Property2_Value');x.keyPresent=true;x.state='ZERO';x.sourceType='number';x.rawValue=0; }],
  ['ZERO recorded as ordinary PRESENT', d => { const x=observation(d,0,'Property1_ID');x.state='ZERO'; }],
  ['ABSENT converted to NULL', d => { const x=observation(d,10,'Property2_Value');x.keyPresent=true;x.state='NULL';x.sourceType='null';x.rawValue=null; }],
  ['field locator altered', d => { observation(d,0,'Property1_ID').fieldLocator='wrong'; }],
  ['field order changed', d => { d.evidence.sourceFieldInventory.records[0].propertyObservations.reverse(); }],
  ['Source Selection order changed', d => { d.canonical.sourceOrder.reverse(); }],
  ['canonical omits ID-only raw observation', d => { delete canonicalProperty(d,10,'Property2_Value').keyPresent; }],
  ['canonical invents missing paired Value', d => { const x=canonicalProperty(d,10,'Property2_Value');x.keyPresent=true;x.state='ZERO';x.sourceType='number';x.rawValue=0; }],
  ['canonical original value mutation', d => { canonicalProperty(d,0,'Property1_Value').rawValue += 1; }],
  ['Evidence and Canonical simultaneous corruption', d => { observation(d,0,'Property1_Value').rawValue=999;canonicalProperty(d,0,'Property1_Value').rawValue=999; }],
  ['key-present count confused with state count', d => { d.evidence.sourceFieldInventory.fieldSummary[3].stateCounts.PRESENT += 1; }],
  ['key-absent summary altered', d => { d.evidence.sourceFieldInventory.fieldSummary[5].keyAbsentCount -= 1; }],
  ['state count forced to match older summary', d => { d.evidence.sourceFieldInventory.fieldSummary[6].stateCounts.PRESENT = 50;d.evidence.sourceFieldInventory.fieldSummary[6].stateCounts.ABSENT = 0; }],
  ['ID-only pair omitted from pair summary', d => { d.evidence.sourceFieldInventory.pairSummary[3].idOnly=0; }],
  ['Property meaning admitted', d => { d.canonical.records[0].properties[0].meaning='Attack'; }],
  ['external Property JOIN added', d => { d.canonical.records[0].properties[0].propertyIdentityId=1; }],
  ['unit or scale admitted', d => { d.canonical.records[0].properties[1].unit='percent'; }],
  ['runtime formula added', d => { d.canonical.records[0].properties[1].formula='value*100'; }],
  ['publication field added', d => { d.canonical.records[0].properties[0].published=true; }],
  ['Template Raw Detail regression', d => { d.templates.records.pop(); }],
  ['Template-LevelUp reference regression', d => { d.references.records.pop(); }],
  ['LevelUp Raw Detail regression', d => { d.rawDetails.records.pop(); }],
  ['Previous-Level reference regression', d => { d.previous.records.pop(); }],
  ['material row regression', d => { d.materials.records.pop(); }],
  ['ItemInfo endpoint regression', d => { d.materials.itemEndpoints.pop(); }],
  ['prior inventory state mismatch', d => { d.rawEvidence.records[0].fieldInventory.find(x=>x.field==='Property1_ID').state='ZERO'; }],
];

validateCastingLawLevelUpPropertyRawDetailsData(original);
for (const [label, mutate] of cases) {
  const data=fresh(); mutate(data);
  assert.throws(() => validateCastingLawLevelUpPropertyRawDetailsData(data), undefined, `must reject ${label}`);
}
console.log(`Casting Law LevelUp Property raw-detail negative controls: PASS (${cases.length} mutation cases; key-presence/state/value/type and regression boundaries)`);
