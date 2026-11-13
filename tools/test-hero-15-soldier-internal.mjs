import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadHero15SoldierInputs, OUTPUT, renderHero15SoldierInternal } from './hero-15-soldier-internal-consumer.mjs';
import { validateHero15SoldierProjection } from './validate-hero-15-soldier-internal.mjs';
const base = await loadHero15SoldierInputs();
const text = await readFile(OUTPUT, 'utf8');
validateHero15SoldierProjection(base, text);
const cases = [
  (i,o)=>{i.relations.records=i.relations.records.filter(r=>!(r.heroId===15&&r.soldierId===210));},
  (i,o)=>{i.relations.records.push(structuredClone(i.relations.records.find(r=>r.heroId===15)));},
  (i,o)=>{i.soldiers.records=i.soldiers.records.filter(r=>r.id!==210);},
  (i,o)=>{i.soldiers.records.find(r=>r.id===210).variant='SP';},
  (i,o)=>{i.relations.records.find(r=>r.heroId===15&&r.soldierId===210).provenance[0].sourceClass='DERIVED';},
  (i,o)=>{i.relations.records.push({...structuredClone(i.relations.records.find(r=>r.heroId===1)),heroId:15,soldierId:99999});},
  (i,o)=>{o.records[0].evidencePoolLocator='tampered';},
  (i,o)=>{o.records[0].provenance=[];},
  (i,o)=>{o.records[0].soldierIdentity.id=999;},
  (i,o)=>{o.records.pop();},
  (i,o)=>{o.records[0].runtimeAvailable=true;},
  (i,o)=>{o.records[0].evidenceClass='C';},
];
for (const [n,mutate] of cases.entries()) {
 const input=structuredClone(base), out=JSON.parse(text); mutate(input,out);
 assert.throws(()=>validateHero15SoldierProjection(input,`${JSON.stringify(out,null,2)}\n`),undefined,`negative ${n+1}`);
}
assert.equal(renderHero15SoldierInternal(base),text,'generation must be deterministic');
console.log(`Hero 15 Soldier internal negative controls: PASS (${cases.length})`);
