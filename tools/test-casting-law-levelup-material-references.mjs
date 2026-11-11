import { readFile } from 'node:fs/promises';import { resolve } from 'node:path';
import { validateCastingLawLevelUpMaterialReferencesData } from './validate-casting-law-levelup-material-references.mjs';
const parse=async p=>JSON.parse(await readFile(resolve(p),'utf8'));
const base={evidence:await parse('evidence/source/jobs/casting-law-levelup-material-references.v1.json'),canonical:await parse('canonical/casting-law-levelup-material-references.v1.json'),templateLevelReferences:await parse('canonical/casting-law-template-level-references.v1.json')};
const clone=x=>structuredClone(x);
const tests=[
 ['wrong LevelUp endpoint',x=>{x.canonical.records[0].levelUpInfoId=999;}],
 ['wrong source material field',x=>{x.evidence.levelRecords[0].field='LevelUpGoldCost';}],
 ['field value mutation',x=>{x.evidence.levelRecords[0].rawValue[0].Count+=1;}],
 ['array order mutation',x=>{x.evidence.levelRecords[1].rawValue.reverse();}],
 ['array row removal',x=>{x.canonical.records.pop();}],
 ['array duplicate removal',x=>{x.evidence.materialRecords.splice(1,1);}],
 ['GoodsType namespace mutation',x=>{x.canonical.records[0].rawMaterial.GoodsType=5;}],
 ['Item ID mismatch',x=>{x.canonical.records[0].rawMaterial.Id=999;}],
 ['Count type mutation',x=>{x.evidence.materialRecords[0].rawMaterial.Count='20';}],
 ['wrong ItemInfo endpoint',x=>{x.evidence.itemEndpoints[0].fields.ID=777;}],
 ['missing ItemInfo endpoint',x=>{x.evidence.itemEndpoints.pop();}],
 ['source commit mutation',x=>{x.evidence.sourceSnapshot.commit='0'.repeat(40);}],
 ['LevelUp blob mutation',x=>{x.evidence.levelUpSource.blobSha1='0'.repeat(40);}],
 ['ItemInfo blob mutation',x=>{x.evidence.itemSource.blobSha1='0'.repeat(40);}],
 ['Hero relation mixed in',x=>{x.canonical.records[0].heroId=15;}],
 ['payment semantics added',x=>{x.canonical.records[0].paid=true;}],
 ['consumption rule added',x=>{x.canonical.records[0].consumed=true;}],
 ['runtime unlock added',x=>{x.canonical.records[0].unlockCondition=true;}],
 ['wrong legacy relation rule',x=>{x.evidence.legacyContract.relationRule='guess';}],
];
for(const [name,mutate] of tests){const sample=clone(base);mutate(sample);let rejected=false;try{validateCastingLawLevelUpMaterialReferencesData(sample);}catch{rejected=true;}if(!rejected)throw new Error(`negative control failed: ${name}`);}
validateCastingLawLevelUpMaterialReferencesData(base);process.stdout.write(`Casting Law LevelUp material-reference negative controls: PASS (${tests.length})\n`);
