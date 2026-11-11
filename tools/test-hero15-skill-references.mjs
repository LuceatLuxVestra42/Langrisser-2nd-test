import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const source=process.cwd(),temp=await mkdtemp(join(tmpdir(),'hero15-skill-references-')),repo=join(temp,'repo');
const paths=[
 'evidence/source/jobs/hero15-job-skill-references.v1.json',
 'evidence/source/configdata/ConfigDataSkillInfo.records-hero-15-general-skills.v1.json',
 'evidence/source/configdata/ConfigDataJobConnectionInfo.records-hero-15-job-level-raw-stats.v1.json',
 'canonical/hero-skill-references.v1.json','canonical/skills.v1.json','canonical/hero-job-relations.v1.json',
 'canonical/hero-job-level-raw-stats.v1.json','canonical/hero-job-advancement-relations.v1.json','canonical/hero-talent-star-skills.v1.json',
 'tools/validate-hero15-skill-references.mjs'
];
await Promise.all(paths.map(async p=>{const target=join(repo,p);await mkdir(dirname(target),{recursive:true});await cp(join(source,p),target)}));
const run=()=>spawnSync(process.execPath,['tools/validate-hero15-skill-references.mjs'],{cwd:repo,encoding:'utf8'});
const pass=(r,label)=>{if(r.error||r.signal||r.status!==0)throw new Error(`${label} failed: ${r.error?.message||r.signal||r.stderr}`)};
const reject=(r,label,pattern)=>{if(r.error||r.signal||r.status===0)throw new Error(`${label} accepted: ${r.error?.message||r.stdout}`);assert.match(`${r.stdout}\n${r.stderr}`,pattern,label)};
async function mutate(path,fn,label,pattern){const f=join(repo,path),original=await readFile(f,'utf8');try{const value=JSON.parse(original);fn(value);await writeFile(f,`${JSON.stringify(value,null,2)}\n`);reject(run(),label,pattern)}finally{await writeFile(f,original)}}
try{
 pass(run(),'valid 9-reference fixture');
 const c='canonical/hero-skill-references.v1.json',e='evidence/source/jobs/hero15-job-skill-references.v1.json',s='canonical/skills.v1.json',talent='canonical/hero-talent-star-skills.v1.json',jobs='canonical/hero-job-relations.v1.json',stats='canonical/hero-job-level-raw-stats.v1.json';
 await mutate(c,v=>{v.records[0].heroId=8},'wrong Hero ID',/\[CANONICAL\]/);
 await mutate(c,v=>{v.records[1].jobConnectionId=155},'wrong JobConnection ID',/\[CANONICAL\]/);
 await mutate(c,v=>{v.records[1].jobId=703},'wrong Job ID',/\[CANONICAL\]/);
 await mutate(c,v=>{v.records[1].jobLevelId=1551},'wrong JobLevel ID',/\[CANONICAL\]/);
 await mutate(c,v=>{v.records[1].skillId=10805},'wrong Skill endpoint',/\[CANONICAL\]/);
 await mutate(c,v=>{v.records[0].sourceField='ConfigDataJobLevelInfo.GotSkill_ID'},'wrong Source Field',/\[CANONICAL\]/);
 await mutate(c,v=>{v.records[0].endpointNamespace='ConfigDataJobConnectionInfo.ID'},'wrong ID namespace',/\[CANONICAL\]/);
 await mutate(c,v=>{v.records[0].referenceKind='JOB_LEVEL_SKILL_ACQUISITION'},'direct reference promoted to acquisition',/\[CANONICAL\]/);
 await mutate(c,v=>{v.records[1].direction='Skill-to-Hero'},'reversed relation direction field',/\[CANONICAL\]/);
 await mutate(c,v=>{v.records.push(v.records[1])},'duplicate reference',/\[CANONICAL\]/);
 await mutate(c,v=>{v.records.pop()},'missing reference',/\[CANONICAL\]/);
 await mutate(c,v=>{v.records[1].provenance.reference='bad'},'relation provenance moved',/\[CANONICAL\]/);
 await mutate(e,v=>{v.heroInfoSource.selectedFields.Skills_ID=[99999]},'Hero source reference changed',/\[HERO_SOURCE\]/);
 await mutate(e,v=>{v.heroInfoSource.gitBlobSha1='0'.repeat(40)},'Hero Source Blob changed',/\[HERO_SOURCE\]/);
 await mutate(e,v=>{v.references[0].fieldLocator+='x'},'Hero field locator changed',/\[HERO_REFERENCE\]/);
 await mutate(e,v=>{v.references[1].jobId=707},'JobLevel Job endpoint changed',/\[JOBLEVEL_REFERENCE\]/);
 await mutate(e,v=>{v.references[1].skillId=99999},'JobLevel Skill reference changed',/\[JOBLEVEL_REFERENCE\]/);
 await mutate(e,v=>{v.references[1].fieldLocator='ConfigDataHeroInfo.Skills_ID'},'Source Field conflated',/\[JOBLEVEL_REFERENCE\]/);
 await mutate(e,v=>{v.jobLevelSource.gitBlobSha1='0'.repeat(40)},'JobLevel source pin changed',/\[JOBLEVEL_SOURCE\]/);
 await mutate(e,v=>{v.protobufFieldContract.jobLevelGotSkillIdFieldNumber=19},'protobuf field number changed',/\[FIELD_CONTRACT\]/);
 await mutate(e,v=>{v.endpointNamespace='ConfigDataJobLevelInfo.ID'},'endpoint namespace confused',/\[SKILL_NAMESPACE\]/);
 await mutate(s,v=>{v.records.find(x=>x.skillId===10816).skillId=19999},'SkillInfo endpoint removed',/\[SKILL_ENDPOINT\]/);
 await mutate(jobs,v=>{v.records.find(x=>x.heroId===15&&x.jobId===803).jobId=804},'Hero Job membership regression',/\[HERO_JOB_PARITY\]/);
 await mutate(stats,v=>{v.records.find(x=>x.heroId===15&&x.jobLevelId===1512).jobConnectionId=152},'JobLevel context regression',/\[JOBLEVEL_CONTEXT\]/);
 await mutate(talent,v=>{v.records.pop()},'Talent relation regression',/\[TALENT_BASELINE\]/);
 console.log('Hero 15 Skill reference tests: PASS (valid fixture and 24 negative controls)');
}finally{await rm(temp,{recursive:true,force:true})}
