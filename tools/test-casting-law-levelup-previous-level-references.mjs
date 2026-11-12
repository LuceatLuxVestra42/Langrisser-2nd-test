import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { findUniqueLevelUpEndpoint, validateCastingLawLevelUpPreviousLevelReferencesData } from './validate-casting-law-levelup-previous-level-references.mjs';

const read=async path=>JSON.parse(await readFile(path,'utf8'));
const original={
 evidence:await read('evidence/source/jobs/casting-law-levelup-previous-level-references.v1.json'),
 canonical:await read('canonical/casting-law-levelup-previous-level-references.v1.json'),
 references:await read('canonical/casting-law-template-level-references.v1.json'),
 rawDetails:await read('canonical/casting-law-levelup-raw-details.v1.json'),
 materials:await read('canonical/casting-law-levelup-material-references.v1.json'),
};
const fresh=()=>structuredClone(original);
const cases=[
 ['selected observation missing',d=>{d.evidence.observations.pop();}],
 ['wrong selected identity',d=>{d.evidence.observations[1].levelUpInfoId=99999;}],
 ['Previous-Level raw value mutation',d=>{d.evidence.observations[1].rawValue=99999;}],
 ['field presence falsified',d=>{d.evidence.observations[1].fieldState='ABSENT';}],
 ['ABSENT value fabricated',d=>{d.evidence.observations[0].rawValue=65;}],
 ['source value type changed',d=>{d.evidence.observations[1].sourceType='string';}],
 ['source commit pin',d=>{d.evidence.sourceSnapshot.commit='0'.repeat(40);}],
 ['source SHA-256 pin',d=>{d.evidence.source.sha256='0'.repeat(64);}],
 ['selected source index',d=>{d.evidence.observations[1].sourceArrayIndex+=1;}],
 ['field locator',d=>{d.evidence.observations[1].fieldLocator='wrong';}],
 ['endpoint ID mismatch',d=>{d.evidence.endpointEvidence[0].endpointId+=1;}],
 ['endpoint namespace',d=>{d.evidence.endpointEvidence[0].endpointNamespace='Other.ID';}],
 ['endpoint index',d=>{d.evidence.endpointEvidence[0].endpointSourceArrayIndex+=1;}],
 ['endpoint locator',d=>{d.evidence.endpointEvidence[0].endpointRecordLocator='wrong';}],
 ['missing endpoint',d=>{d.evidence.endpointEvidence[0].endpointMatchCount=0;}],
 ['index-only endpoint bypass',d=>{d.evidence.endpointEvidence[0].directSourceRecordVerified=false;}],
 ['duplicate endpoint is ambiguous',d=>{d.evidence.endpointEvidence[0].endpointMatchCount=2;}],
 ['relation missing',d=>{d.canonical.records.pop();d.evidence.endpointEvidence.pop();}],
 ['duplicate relation',d=>{d.canonical.records.push(structuredClone(d.canonical.records[0]));}],
 ['source order changed',d=>{d.canonical.records.reverse();}],
 ['canonical and evidence joint corruption',d=>{d.evidence.endpointEvidence[0].previousLevelUpInfoId=65;d.canonical.records[0].previousLevelUpInfoId=65;}],
 ['runtime prerequisite added',d=>{d.canonical.records[0].runtimePrerequisite=true;}],
 ['gold consumption meaning added',d=>{d.canonical.records[0].goldCost=1;}],
 ['Property semantics added',d=>{d.canonical.records[0].propertyEffects=[];}],
 ['publication added',d=>{d.canonical.records[0].published=true;}],
 ['full Source auto-admitted',d=>{d.canonical.records.push({levelUpInfoId:999,sourceField:'PreCastingLawLevelID'});}],
 ['template reference damaged',d=>{d.references.records.pop();}],
 ['LevelUp raw detail damaged',d=>{d.rawDetails.records.pop();}],
 ['material rows damaged',d=>{d.materials.records.pop();}],
 ['ItemInfo endpoint set damaged',d=>{d.materials.itemEndpoints.pop();}],
];
validateCastingLawLevelUpPreviousLevelReferencesData(original);
for(const [label,mutate] of cases){const data=fresh();mutate(data);assert.throws(()=>validateCastingLawLevelUpPreviousLevelReferencesData(data),undefined,`must reject ${label}`);}

// Endpoint lookup covers the complete supplied source table; membership in the
// selected 50 is intentionally irrelevant to identity resolution.
const selectedIds=new Set([10,11]);
const fullSource=[{ID:10},{ID:700}];
assert.equal(selectedIds.has(700),false);
const outside=findUniqueLevelUpEndpoint(fullSource,700);
assert.equal(outside.status,'UNIQUE');
assert.equal(outside.matches[0].index,1);
assert.equal(findUniqueLevelUpEndpoint(fullSource,999).status,'MISSING');
assert.equal(findUniqueLevelUpEndpoint([...fullSource,{ID:700}],700).status,'AMBIGUOUS');
assert.equal(findUniqueLevelUpEndpoint(fullSource,'700').status,'INVALID_ID');
console.log(`Casting Law LevelUp Previous-Level negative controls: PASS (${cases.length} mutations; full-population endpoint lookup cases=4)`);
