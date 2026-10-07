import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { OUTPUTS, PATH_RULES, resolveCiRouting, validateRuleTable } from './resolve-ci-routing.mjs';
const route = (p) => resolveCiRouting({eventName:'pull_request',changedPaths:[p]});
const hero=route('canonical/heroes.v1.json');
const heroLocalization=route('canonical/hero-localizations-ko.v1.json');
assert.equal(heroLocalization.run_hero,true);
assert.equal(heroLocalization.run_build,false);
assert.equal(heroLocalization.run_full_suite,false);
const heroKoDirectSource=route('evidence/source/configdata/ConfigDataHeroInfo.records-hero-ko-localization.v1.json');
assert.equal(heroKoDirectSource.run_hero,true);
assert.equal(heroKoDirectSource.run_build,false);
assert.equal(heroKoDirectSource.run_full_suite,false);
assert.equal(heroKoDirectSource.run_job,false);
assert.equal(heroKoDirectSource.run_soldier,false);
for (const p of ['evidence/localization/hero-names-ko.v1.json','evidence/localization/source/hero-names-ko.v1.txt','evidence/localization/source/hero-names-ko.source-manifest.v1.json','tools/validate-hero-ko-localization.mjs','tools/test-hero-ko-localization.mjs']) assert.equal(route(p).run_hero,true,p);
const heroExpansionJobLocalization=route('evidence/localization/job-names-ko.hero-28-32-52-53.v1.json');
for(const k of ['run_job','run_hero_job_relation','run_build']) assert.equal(heroExpansionJobLocalization[k],true,k);
for(const k of ['run_hero','run_hero_job_relation','run_hero_soldier_relation','run_hero_exclusive_relation','run_build']) assert.equal(hero[k],true,k);
for(const k of ['run_general_ssr','run_soldier','run_full_suite']) assert.equal(hero[k],false,k);
const general=route('canonical/general-ssr-equipment.v1.json');
assert.equal(general.run_general_ssr,true);
for(const k of ['run_hero','run_job','run_soldier','run_exclusive','run_hero_job_relation','run_hero_soldier_relation','run_sp_normal_relation','run_hero_exclusive_relation','run_build','run_full_suite']) assert.equal(general[k],false,k);
assert.equal(route('evidence/localization/general-ssr-equipment-ko.v1.json').run_general_ssr,true);
for (const p of ['generated/exclusive-equipment.v1.json','tools/generate.mjs','tools/build.mjs','tools/validate-exclusive-equipment-presentation.mjs','tools/test-exclusive-equipment-presentation.mjs']) {
  const r = route(p);
  assert.equal(r.run_exclusive, true, p);
  assert.equal(r.run_build, true, p);
  assert.equal(r.run_full_suite, false, p);
}

for (const path of ['tools/generate.mjs','tools/validate-hero-soldier-presentation.mjs','tools/test-hero-soldier-presentation.mjs','generated/hero-soldier-relations.v1.json']) {
  const r = route(path);
  assert.equal(r.run_hero_soldier_relation, true, path);
  assert.equal(r.run_full_suite, false, path);
}
const soldierRelation=route('canonical/sp-soldier-normal-relations.v1.json');
assert.equal(soldierRelation.run_soldier,true);
assert.equal(soldierRelation.run_sp_normal_relation,true);
const soldierEndpoint=route('canonical/soldiers.v1.json');
assert.equal(soldierEndpoint.run_hero_soldier_relation,true);
assert.equal(soldierEndpoint.run_sp_normal_relation,true);
const exclusive=route('canonical/exclusive-equipment.v1.json');
for(const k of ['run_exclusive','run_hero_exclusive_relation','run_build']) assert.equal(exclusive[k],true,k);
for(const p of ['docs/unknown.md','.github/workflows/ci.yml','tools/unmapped.mjs']) {
  const r=route(p); assert.equal(r.run_full_suite,true); assert.equal(r.routing_review,true);
}
const push=resolveCiRouting({eventName:'push',refName:'main',changedPaths:['canonical/general-ssr-equipment.v1.json']});
assert.equal(push.run_full_suite,true); assert.equal(push.routing_review,false);
for(const r of [
  resolveCiRouting({eventName:'pull_request',changedPaths:[]}),
  resolveCiRouting({eventName:'pull_request',changedPaths:['canonical/heroes.v1.json'],error:true}),
  resolveCiRouting({eventName:'workflow_dispatch',changedPaths:[]}),
]) { assert.equal(r.run_full_suite,true); assert.equal(r.routing_review,true); }
assert.equal(validateRuleTable(),true);
assert.equal(new Set(OUTPUTS).size,OUTPUTS.length);
const workflow=await readFile(new URL('../.github/workflows/ci.yml',import.meta.url),'utf8');
assert.match(workflow,/fetch-depth: 0/);
assert.doesNotMatch(workflow,/changed-files|changed_files|paths-filter|canonical\/|evidence\//);
for(const output of OUTPUTS) assert.match(workflow,new RegExp('steps\\.ci-routing\\.outputs\\.'+output+'\\b'),output);
console.log('CI routing regression PASS ('+PATH_RULES.length+' explicit rules, '+OUTPUTS.length+' consumed outputs)');
