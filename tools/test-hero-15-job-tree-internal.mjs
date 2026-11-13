import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { OUTPUT,loadInputs,validate } from './hero-15-job-tree-internal.mjs';
const inputs=await loadInputs(),text=await readFile(OUTPUT,'utf8');validate(inputs,text);
const mutations=[
 x=>x.jobs.records=x.jobs.records.filter(r=>!(r.heroId===15&&r.jobId===802)),
 x=>x.jobs.records.push(structuredClone(x.jobs.records.find(r=>r.heroId===15))),
 x=>x.edges.records[0].successorJobId=707,
 x=>x.edges.records.reverse(),
 x=>x.edges.records.push({...structuredClone(x.edges.records[0]),successorConnectionId:999}),
 x=>x.evidence.claims.connectionMembership.connections[0].jobId=803,
 x=>x.evidence.claims.directEdges.records[0].sourceLocator='tampered',
 x=>x.localizations.records.push({jobId:811,nameKo:'guess',provenance:'invented'}),
];
for(const [i,mutate] of mutations.entries()){const copy=structuredClone(inputs);mutate(copy);assert.throws(()=>validate(copy,text),undefined,`negative ${i+1}`);}
const bad=JSON.parse(text);bad.directEdges[0].runtimeUnlock=true;assert.throws(()=>validate(inputs,JSON.stringify(bad,null,2)+'\n'));
console.log('Hero 15 Job Tree negative controls: PASS (9)');
