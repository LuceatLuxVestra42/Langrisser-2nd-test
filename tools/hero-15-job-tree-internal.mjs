import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const OUTPUT = 'generated/hero-15-job-tree-internal.v1.json';
const JOBS = [802,803,806,703,811,707];
const CONNECTIONS = [150,151,152,153,154,155];
const LIMITATIONS = [
  'Source snapshot is version-scoped and does not encode numeric hero-level thresholds or mastery cost.',
  'No reachability beyond the five direct edges is separately admitted.',
  'No UI path, Job Tree presentation, mastery values, skill acquisition relation, or final combat calculation is admitted.',
  'This internal projection does not approve publication or runtime unlock semantics.',
];
const read = async (root,p) => JSON.parse(await readFile(resolve(root,p),'utf8'));
export async function loadInputs(root=process.cwd()) {
  const [jobs,edges,evidence,localizations]=await Promise.all([
    read(root,'canonical/hero-job-relations.v1.json'),read(root,'canonical/hero-job-advancement-relations.v1.json'),
    read(root,'evidence/source/jobs/hero-job-tree-hero15.v1.json'),read(root,'canonical/job-localizations-ko.v1.json'),
  ]); return {jobs,edges,evidence,localizations};
}
export function render({jobs,edges,evidence,localizations}) {
  const memberships=jobs.records.filter(x=>x.heroId===15), links=edges.records.filter(x=>x.heroId===15);
  const connections=evidence.claims.connectionMembership.connections;
  if(JSON.stringify(memberships.map(x=>x.jobId).sort((a,b)=>a-b))!==JSON.stringify([...JOBS].sort((a,b)=>a-b))) throw Error('Hero 15 Job population drift');
  if(JSON.stringify(connections.map(x=>x.connectionId).sort((a,b)=>a-b))!==JSON.stringify([...CONNECTIONS].sort((a,b)=>a-b))) throw Error('Hero 15 Connection scope drift');
  const map=new Map(connections.map(x=>[x.connectionId,x.jobId]));
  const advEvidence=evidence.claims.directEdges.records;
  if(JSON.stringify(links)!==JSON.stringify(advEvidence)) throw Error('Advancement Canonical differs from its admitted evidence');
  if(links.length!==5) throw Error('Expected five direct advancement edges');
  const loc=new Map(localizations.records.map(x=>[x.jobId,x]));
  const records=connections.map(c=>{
    const membership=memberships.find(x=>x.jobId===c.jobId);
    if(!membership) throw Error(`Connection ${c.connectionId} has no Hero–Job membership endpoint`);
    const localization=loc.get(c.jobId);
    return {connectionId:c.connectionId,jobId:c.jobId,heroJobProvenance:membership.provenance,
      connectionEvidence:{source:'evidence/source/jobs/hero-job-tree-hero15.v1.json#claims/connectionMembership',status:evidence.claims.connectionMembership.status},
      localization:localization?{status:'ADMITTED',nameKo:localization.nameKo,provenance:localization.provenance}:{status:'NOT_ADMITTED',nameKo:null,provenance:null}};
  });
  const directEdges=links.map(edge=>{
    if(map.get(edge.predecessorConnectionId)!==edge.predecessorJobId||map.get(edge.successorConnectionId)!==edge.successorJobId) throw Error('Job/Connection endpoint mismatch');
    return {...edge,evidenceClass:evidence.claims.directEdges.evidenceClass,evidenceProvenance:'evidence/source/jobs/hero-job-tree-hero15.v1.json#claims/directEdges'};
  });
  return JSON.stringify({schemaVersion:1,scope:'Internal Hero 15 Job membership and admitted direct advancement projection only; no inferred edges, runtime unlock rules, mastery cost, skills, stats, or publication.',heroId:15,jobOwner:'canonical/hero-job-relations.v1.json',advancementOwner:'canonical/hero-job-advancement-relations.v1.json',limitations:LIMITATIONS,jobs:records,directEdges},null,2)+'\n';
}
export function validate(inputs,text){const expected=render(inputs);assert.equal(text,expected,'Generated Job Tree differs from canonical/evidence projection');const obj=JSON.parse(text);assert.equal(obj.jobs.length,6);assert.equal(obj.directEdges.length,5);assert.deepEqual(obj.directEdges.map(e=>[e.predecessorJobId,e.successorJobId,e.predecessorConnectionId,e.successorConnectionId]),[[802,803,150,151],[802,806,150,152],[802,703,150,153],[806,811,152,154],[703,707,153,155]]);assert.deepEqual(obj.jobs.filter(j=>j.localization.status==='ADMITTED').map(j=>j.jobId).sort((a,b)=>a-b),[703,802,803,806]);assert.deepEqual(obj.jobs.filter(j=>j.localization.status==='NOT_ADMITTED').map(j=>j.jobId).sort((a,b)=>a-b),[707,811]);assert.equal(text,JSON.stringify(obj,null,2)+'\n');}
export async function generate(root=process.cwd()){const text=render(await loadInputs(root));await writeFile(resolve(root,OUTPUT),text);return text;}
export async function validateFile(root=process.cwd()){validate(await loadInputs(root),await readFile(resolve(root,OUTPUT),'utf8'));}
if(process.argv[1]&&resolve(process.argv[1])===resolve('tools/hero-15-job-tree-internal.mjs')) { if(process.argv[2]==='generate') await generate(); else {await validateFile();console.log('Hero 15 Job Tree internal: PASS');} }
