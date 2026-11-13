import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
export const OUTPUT='generated/hero-15-job-level-internal.v1.json';
export const INPUTS={stats:'canonical/hero-job-level-raw-stats.v1.json',tree:'generated/hero-15-job-tree-internal.v1.json'};
export const SCOPE='Internal Hero 15 JobLevel raw-field projection grouped by admitted Job Tree Connection; raw source values only, no calculated combat stats, unlock rules, or publication.';
export const LIMITATIONS=['jobLevelUpHeroLevel and rankCode are preserved source fields; their presence does not establish unlock, promotion, or progression rules.','RawStats values are preserved verbatim; no growth, rank, mastery, or final-stat formula is inferred.','Job membership and Connection-to-Job mapping are reused from the existing internal Job Tree; no new Job identity or relation is admitted.','Job Korean names 811 and 707 remain NOT_ADMITTED and are outside this consumer.'];
export async function load(root=process.cwd()){const [stats,tree]=await Promise.all([INPUTS.stats,INPUTS.tree].map(async p=>JSON.parse(await readFile(resolve(root,p),'utf8'))));return{stats,tree};}
export function render({stats,tree}){
 const jobs=tree.jobs.map(job=>({...job,jobLevels:stats.records.filter(r=>r.heroId===15&&r.jobConnectionId===job.connectionId&&r.jobId===job.jobId)}));
 return JSON.stringify({schemaVersion:1,scope:SCOPE,heroId:15,sourceCanonical:INPUTS.stats,jobTreeConsumer:INPUTS.tree,limitations:LIMITATIONS,jobs},null,2)+'\n';
}
export async function generate(root=process.cwd()){await writeFile(resolve(root,OUTPUT),render(await load(root)));}
if(process.argv[1]&&resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname)) await generate();
