import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { validateCastingLawTemplateLevelReferencesData } from './validate-casting-law-template-level-references.mjs';
const parse = async p => JSON.parse(await readFile(resolve(p),'utf8'));
const base = {
 evidence: await parse('evidence/source/jobs/casting-law-template-level-references.v1.json'),
 canonical: await parse('canonical/casting-law-template-level-references.v1.json'),
 templateEvidence: await parse('evidence/source/jobs/casting-law-template-raw-details.v1.json'),
 templateCanonical: await parse('canonical/casting-law-template-raw-details.v1.json'),
};
const clone = x => structuredClone(x);
const tests = [
 ['wrong template identity',x=>{x.canonical.records[0].templateId=15;}],
 ['wrong level endpoint',x=>{x.canonical.records[0].levelUpInfoId=999;}],
 ['wrong endpoint namespace',x=>{x.canonical.records[0].levelUpEndpointNamespace='ConfigDataSkillInfo.ID';}],
 ['source field mutation',x=>{x.canonical.records[0].sourceField='ConfigDataCastingLawLevelUpInfo.LevelupMaterialsCost';}],
 ['template array order mutation',x=>{x.evidence.templateRecords[0].rawLevelUpInfoIds.reverse();}],
 ['relation array order mutation',x=>{x.canonical.records.reverse();}],
 ['source array index mutation',x=>{x.canonical.records[1].sourceArrayIndex=0;}],
 ['wrong level source index',x=>{x.canonical.records[0].levelUpSourceArrayIndex+=1;}],
 ['wrong level locator',x=>{x.canonical.records[0].levelUpRecordLocator='ConfigDataCastingLawLevelUpInfo#ID=67';}],
 ['duplicate relation',x=>{x.canonical.records[1]=clone(x.canonical.records[0]);}],
 ['missing relation',x=>{x.canonical.records.pop();}],
 ['wrong source commit',x=>{x.evidence.sourceSnapshot.commit='0'.repeat(40);}],
 ['wrong source tree',x=>{x.evidence.sourceSnapshot.tree='0'.repeat(40);}],
 ['wrong blob pin',x=>{x.evidence.levelUpSource.blobSha1='0'.repeat(40);}],
 ['missing shared template endpoint',x=>{x.templateCanonical.records.pop();}],
 ['hero relation mixed into identity',x=>{x.canonical.records[0].heroId=15;}],
 ['runtime meaning added',x=>{x.canonical.records[0].unlockCondition=true;}],
 ['material detail mixed into relation',x=>{x.canonical.records[0].materials=[];}],
];
for(const [name,mutate] of tests){const sample=clone(base);mutate(sample);let rejected=false;try{validateCastingLawTemplateLevelReferencesData(sample);}catch{rejected=true;}if(!rejected)throw new Error(`negative control failed: ${name}`);}
validateCastingLawTemplateLevelReferencesData(base);
process.stdout.write(`Casting Law Template-LevelUp negative controls: PASS (${tests.length})\n`);
