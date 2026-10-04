import { execFileSync } from 'node:child_process';
import { readFileSync, appendFileSync } from 'node:fs';

export const OUTPUTS = ['run_hero','run_job','run_soldier','run_general_ssr','run_exclusive','run_hero_job_relation','run_hero_soldier_relation','run_sp_normal_relation','run_hero_exclusive_relation','run_build','run_full_suite','routing_review'];
const G = Object.freeze({HERO:'run_hero',JOB:'run_job',SOLDIER:'run_soldier',GENERAL_SSR:'run_general_ssr',EXCLUSIVE_EQUIPMENT:'run_exclusive',HERO_JOB_RELATION:'run_hero_job_relation',HERO_SOLDIER_RELATION:'run_hero_soldier_relation',SP_NORMAL_SOLDIER_RELATION:'run_sp_normal_relation',HERO_EXCLUSIVE_RELATION:'run_hero_exclusive_relation',BUILD_PRESENTATION:'run_build'});
const OWNER_OUTPUTS = Object.freeze(Object.values(G));
// Single path-to-owner/dependency source of truth. Prefix entries end in "/".
const entries = [
['canonical/heroes.v1.json','HERO HERO_JOB_RELATION HERO_SOLDIER_RELATION HERO_EXCLUSIVE_RELATION BUILD_PRESENTATION'],
['canonical/hero-identities.v1.json','HERO'],
['canonical/hero-localizations-ko.v1.json','HERO'],
['evidence/localization/hero-names-ko.v1.json','HERO'],
['evidence/localization/source/hero-names-ko.v1.txt','HERO'],
['evidence/localization/source/hero-names-ko.source-manifest.v1.json','HERO'],
['tools/validate-hero-ko-localization.mjs','HERO'],
['tools/test-hero-ko-localization.mjs','HERO'],
['evidence/source/configdata/ConfigDataHeroInfo.records-5-6-8.json','HERO HERO_JOB_RELATION HERO_SOLDIER_RELATION HERO_EXCLUSIVE_RELATION'],
['evidence/source/configdata/ConfigDataHeroInfo.records-hero-ko-localization.v1.json','HERO'],
['evidence/source/configdata/ConfigDataHeroInfo.records-playable-identity.v1.json','HERO'],
['evidence/source/configdata/ConfigDataHeroInfo.records-playable-identity.source-manifest.v1.json','HERO'],
['evidence/source/configdata/ConfigDataCharImageInfo.records-5-6-8.json','HERO'],
['evidence/source/portraits/hero-portrait-slice.v1.json','HERO'],
['evidence/source/portraits/hero-portrait-prior-validation.v1.json','HERO'],
['assets/portraits/','HERO BUILD_PRESENTATION','prefix'],
['canonical/job-localizations-ko.v1.json','JOB HERO_JOB_RELATION BUILD_PRESENTATION'],
['evidence/localization/job-names-ko.hero-5-6-8.v1.json','JOB HERO_JOB_RELATION BUILD_PRESENTATION'],
['evidence/localization/source/job-names-ko.v1.txt','JOB HERO_JOB_RELATION BUILD_PRESENTATION'],
['evidence/localization/source/job-names-ko.source-manifest.v1.json','JOB HERO_JOB_RELATION BUILD_PRESENTATION'],
['evidence/localization/sp-job-namespace.v1.json','JOB'],
['evidence/localization/source/sp-job-names-ko.v1.txt','JOB'],
['evidence/localization/source/sp-job-names-ko.source-manifest.v1.json','JOB'],
['evidence/source/configdata/ConfigDataJobInfo.records-hero-5-6-8.json','JOB HERO_JOB_RELATION BUILD_PRESENTATION'],
['evidence/source/configdata/ConfigDataJobInfo.records-sp-job-localization.v1.json','JOB'],
['evidence/source/configdata/ConfigDataJobInfo.records-sp-job-localization.source-manifest.v1.json','JOB'],
['evidence/source/configdata/ConfigDataJobConnectionInfo.records-hero-5-6-8.json','HERO_JOB_RELATION'],
['evidence/source/jobs/hero-job-connection-slice.v1.json','HERO_JOB_RELATION'],
['evidence/source/jobs/hero-sp-job-relation.v1.json','HERO_JOB_RELATION JOB'],
['generated/job-glossary.v1.json','JOB BUILD_PRESENTATION'],
['canonical/soldiers.v1.json','SOLDIER HERO_SOLDIER_RELATION SP_NORMAL_SOLDIER_RELATION'],
['canonical/normal-soldier-base-stats.v1.json','SOLDIER'],
['canonical/normal-soldier-localizations-ko.v1.json','SOLDIER'],
['canonical/sp-soldier-base-stats.v1.json','SOLDIER BUILD_PRESENTATION'],
['canonical/sp-soldier-localizations-ko.v1.json','SOLDIER BUILD_PRESENTATION'],
['canonical/sp-soldier-normal-relations.v1.json','SOLDIER SP_NORMAL_SOLDIER_RELATION BUILD_PRESENTATION'],
['evidence/source/configdata/ConfigDataSoldierInfo.records-identity-115.v1.json','SOLDIER'],
['evidence/source/configdata/soldier-identity-115.source-manifest.v1.json','SOLDIER'],
['evidence/source/configdata/ConfigDataSoldierInfo.records-normal-soldier-base-stats.v1.json','SOLDIER'],
['evidence/source/configdata/ConfigDataSoldierInfo.records-normal-soldier-base-stats.source-manifest.v1.json','SOLDIER'],
['evidence/source/configdata/ConfigDataSoldierInfo.records-sp-soldier-base-stats.v1.json','SOLDIER BUILD_PRESENTATION'],
['evidence/source/configdata/ConfigDataSoldierInfo.records-sp-soldier-endpoints.v1.json','SOLDIER HERO_SOLDIER_RELATION SP_NORMAL_SOLDIER_RELATION BUILD_PRESENTATION'],
['evidence/source/configdata/ConfigDataSPSoldierInfo.record-5115.v1.json','SOLDIER BUILD_PRESENTATION'],
['evidence/source/configdata/ConfigDataSPSoldierInfo.records-all-sp-soldiers.v1.json','SOLDIER BUILD_PRESENTATION'],
['evidence/source/configdata/sp-soldier-base-stats.source-manifest.v1.json','SOLDIER BUILD_PRESENTATION'],
['evidence/source/configdata/sp-soldier-population.source-manifest.v1.json','SOLDIER BUILD_PRESENTATION'],
['evidence/localization/sp-soldier-names-ko.v1.json','SOLDIER BUILD_PRESENTATION'],
['evidence/localization/source/sp-soldier-names-ko.v1.txt','SOLDIER BUILD_PRESENTATION'],
['evidence/localization/source/sp-soldier-names-ko.source-manifest.v1.json','SOLDIER BUILD_PRESENTATION'],
['evidence/localization/normal-soldier-names-ko.v1.json','SOLDIER'],
['evidence/localization/source/normal-soldier-names-ko.v1.txt','SOLDIER'],
['evidence/localization/source/normal-soldier-names-ko.source-manifest.v1.json','SOLDIER'],
['evidence/source/configdata/ConfigDataSPHeroInfo.records-hero-soldier-reward.v1.json','HERO_SOLDIER_RELATION'],
['evidence/source/configdata/ConfigDataSPHeroInfo.records-hero-soldier-reward.source-manifest.v1.json','HERO_SOLDIER_RELATION'],
['evidence/source/configdata/hero-soldier-direct-source-evidence.v1.json','HERO_SOLDIER_RELATION'],
['evidence/source/configdata/hero-soldier-source-semantics.v1.json','HERO_SOLDIER_RELATION'],
['evidence/source/configdata/ConfigDataSPHeroInfo.records-sp-relation.v1.json','HERO_SOLDIER_RELATION'],
['evidence/source/configdata/ConfigDataSPHeroInfo.records-sp-relation.source-manifest.v1.json','HERO_SOLDIER_RELATION'],
['evidence/source/configdata/ConfigDataHeroInfo.records-sp-relation.v1.json','HERO_SOLDIER_RELATION'],
['evidence/source/configdata/ConfigDataHeroInfo.records-sp-relation.source-manifest.v1.json','HERO_SOLDIER_RELATION'],
['evidence/source/configdata/ConfigDataJobConnectionInfo.records-sp-relation.v1.json','HERO_SOLDIER_RELATION'],
['evidence/source/configdata/ConfigDataJobConnectionInfo.records-sp-relation.source-manifest.v1.json','HERO_SOLDIER_RELATION'],
['canonical/general-ssr-equipment.v1.json','GENERAL_SSR'],
['canonical/general-ssr-equipment-localizations-ko.v1.json','GENERAL_SSR'],
['evidence/source/equipment/general-ssr-equipment-population-contract.v1.json','GENERAL_SSR'],
['evidence/source/equipment/general-ssr-equipment-population.v1.json','GENERAL_SSR'],
['evidence/localization/general-ssr-equipment-ko.v1.json','GENERAL_SSR'],
['canonical/exclusive-equipment.v1.json','EXCLUSIVE_EQUIPMENT HERO_EXCLUSIVE_RELATION BUILD_PRESENTATION'],
['canonical/exclusive-equipment-localizations-ko.v1.json','EXCLUSIVE_EQUIPMENT HERO_EXCLUSIVE_RELATION BUILD_PRESENTATION'],
['canonical/hero-exclusive-equipment-relations.v1.json','HERO_EXCLUSIVE_RELATION BUILD_PRESENTATION'],
['evidence/exclusive-equipment-identity.v1.json','EXCLUSIVE_EQUIPMENT'],
['evidence/localization/exclusive-equipment-ko.v1.json','EXCLUSIVE_EQUIPMENT HERO_EXCLUSIVE_RELATION BUILD_PRESENTATION'],
['evidence/source/configdata/hero-exclusive-equipment-skill-hero.v1.json','HERO_EXCLUSIVE_RELATION EXCLUSIVE_EQUIPMENT BUILD_PRESENTATION'],
['generated/hero-slice.v1.json','HERO BUILD_PRESENTATION'],
['generated/sp-soldiers.v1.json','SOLDIER BUILD_PRESENTATION'],
['app.js','BUILD_PRESENTATION'],['index.html','BUILD_PRESENTATION'],['styles.css','BUILD_PRESENTATION'],
];
export const PATH_RULES = Object.freeze(entries.map(([path, value, kind='exact']) => Object.freeze({path, kind, groups:Object.freeze(value.split(' '))})));

export function validateRuleTable() {
  const seen = new Set();
  for (const r of PATH_RULES) {
    if (!['exact','prefix'].includes(r.kind) || !r.path || r.path.startsWith('/') || r.path.includes('..')) throw new Error('invalid path rule: '+r.path);
    if (r.kind==='prefix' && !r.path.endsWith('/')) throw new Error('prefix must end with slash: '+r.path);
    const key=r.kind+':'+r.path;
    if (seen.has(key)) throw new Error('duplicate rule: '+key);
    seen.add(key);
    if (!r.groups.length || new Set(r.groups).size!==r.groups.length) throw new Error('empty/duplicate owner: '+r.path);
    for (const g of r.groups) if (!Object.hasOwn(G,g)) throw new Error('unknown owner: '+g);
  }
  for (let i=0;i<PATH_RULES.length;i++) for (let j=i+1;j<PATH_RULES.length;j++) {
    const a=PATH_RULES[i],b=PATH_RULES[j];
    if (a.kind===b.kind && a.path===b.path) throw new Error('ambiguous rules: '+a.path);
    if (a.kind==='prefix' && b.kind==='prefix' && (a.path.startsWith(b.path)||b.path.startsWith(a.path))) throw new Error('overlapping prefixes');
    if (a.kind==='exact' && b.kind==='prefix' && a.path.startsWith(b.path)) throw new Error('ambiguous exact/prefix rules');
    if (b.kind==='exact' && a.kind==='prefix' && b.path.startsWith(a.path)) throw new Error('ambiguous exact/prefix rules');
  }
  for (const r of PATH_RULES) {
    const fixture=r.kind==='exact'?r.path:r.path+'__routing_fixture__';
    const matches=PATH_RULES.filter((candidate)=>candidate.kind==='exact'?fixture===candidate.path:fixture.startsWith(candidate.path));
    if (matches.length!==1 || matches[0]!==r) throw new Error('unreachable or ambiguous rule: '+r.path);
  }
  if (new Set(OWNER_OUTPUTS).size!==10) throw new Error('expected 10 owner outputs');
  return true;
}
const fallback = (review) => Object.fromEntries([...OWNER_OUTPUTS.map(k=>[k,false]),['run_full_suite',true],['routing_review',review]]);
export function resolveCiRouting({eventName,refName,changedPaths,error=false}) {
  if (error) return fallback(true);
  if (eventName==='push' && refName==='main') return fallback(false);
  if (eventName!=='pull_request' || !Array.isArray(changedPaths) || changedPaths.length===0) return fallback(true);
  const result=Object.fromEntries([...OWNER_OUTPUTS.map(k=>[k,false]),['run_full_suite',false],['routing_review',false]]);
  let unknown=false;
  for (const file of new Set(changedPaths)) {
    if (typeof file!=='string' || file.startsWith('/') || file.includes('..')) { unknown=true; continue; }
    const matches=PATH_RULES.filter(r=>r.kind==='exact'?file===r.path:file.startsWith(r.path));
    if (matches.length!==1) { unknown=true; continue; }
    for (const group of matches[0].groups) result[G[group]]=true;
  }
  return unknown?fallback(true):result;
}
function changedPaths(eventName) {
  if (!process.env.GITHUB_EVENT_PATH) throw new Error('event payload unavailable');
  const event=JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH,'utf8'));
  if (eventName!=='pull_request') return [];
  const base=event.pull_request?.base?.sha,head=event.pull_request?.head?.sha;
  if (!base||!head) throw new Error('PR base/head SHA unavailable');
  const diff=execFileSync('git',['diff','--no-renames','--name-only','-z',base+'...'+head],{encoding:'utf8',maxBuffer:10*1024*1024});
  return diff.split('\0').filter(Boolean);
}
function write(outputs) {
  const text=OUTPUTS.map(k=>k+'='+(outputs[k]?'true':'false')).join('\n')+'\n';
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT,text); else process.stdout.write(text);
}
async function main() {
  let outputs;
  try { const event=process.env.GITHUB_EVENT_NAME; outputs=resolveCiRouting({eventName:event,refName:process.env.GITHUB_REF_NAME,changedPaths:changedPaths(event)}); }
  catch { outputs=fallback(true); }
  write(outputs);
}
if (process.argv[1] && import.meta.url===new URL('file://'+process.argv[1]).href) await main();
