import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateHero15HeartFetterRawConditionsData } from './validate-hero15-heart-fetter-raw-conditions.mjs';
const root=process.cwd();
const [evidence,canonical,references]=await Promise.all([
  readFile(`${root}/evidence/source/bonds/hero15-heart-fetter-raw-conditions.v1.json`,'utf8').then(JSON.parse),
  readFile(`${root}/canonical/hero-heart-fetter-raw-conditions.v1.json`,'utf8').then(JSON.parse),
  readFile(`${root}/canonical/hero-fetter-references.v1.json`,'utf8').then(JSON.parse),
]);
const fresh=()=>({evidence:structuredClone(evidence),canonical:structuredClone(canonical),references:structuredClone(references)});
const valid=()=>validateHero15HeartFetterRawConditionsData(fresh());
const rejects=(mutate,label)=>{const d=fresh(); mutate(d); assert.throws(()=>validateHero15HeartFetterRawConditionsData(d),undefined,label);};
assert.deepEqual(valid(),{records:4,rawConditions:5,conditionType7Meaning:'MANUAL_REVIEW',publication:false});
const cases=[
 [d=>d.canonical.records[0].heroId=8,'Hero ID mutation'],
 [d=>d.canonical.records[0].heartFetterId=16,'Heart Fetter endpoint mutation'],
 [d=>d.canonical.records[0].heartFetterLevel=5,'level mutation'],
 [d=>d.canonical.records[0].skillId=70422,'skill ID mutation'],
 [d=>d.canonical.records[3].passiveBuffIds.pop(),'passive buff array shape mutation'],
 [d=>d.canonical.records[0].conditions[0].conditionType=6,'ConditionType mutation'],
 [d=>d.canonical.records[0].conditions[0].conditionParams[0]=707,'ConditionParam mutation'],
 [d=>d.canonical.records.push(structuredClone(d.canonical.records[0])),'duplicate/extra canonical row'],
 [d=>d.canonical.records.pop(),'missing canonical row'],
 [d=>d.evidence.source.commit='0'.repeat(40),'source commit mutation'],
 [d=>d.evidence.source.tree='0'.repeat(40),'source tree mutation'],
 [d=>d.evidence.source.buffInfo.blobSha1='0'.repeat(40),'source blob mutation'],
 [d=>d.evidence.source.buffInfo.sha256='0'.repeat(64),'source hash mutation'],
 [d=>d.evidence.source.buffInfo.records[0].recordIndex++,'Buff record locator mutation'],
 [d=>d.evidence.source.skillInfo.records[0].recordIndex++,'Skill record locator mutation'],
 [d=>d.evidence.source.heartFetter.fields.UnlockSkills_ID[0].SkillId=70422,'HeartFetter raw reference mutation'],
 [d=>d.evidence.claims[0].sourceProvenance.passiveBuffSourceIndices[0]=32858,'field provenance mutation'],
 [d=>d.evidence.claims[0].conditions[0].conditionParams.push(707),'condition array mutation'],
 [d=>d.canonical.records[0].provenance='elsewhere.json','canonical provenance mutation'],
 [d=>d.canonical.records[0].sourceField='UnlockCondition','source field mutation'],
 [d=>d.canonical.records[0].applicableJobIds=[811],'unapproved job interpretation'],
 [d=>d.canonical.records[0].jobRestricted=true,'unapproved job restriction'],
 [d=>d.canonical.records[0].unlockCondition='on class change','unapproved unlock interpretation'],
 [d=>d.canonical.records[0].battleEffect='damage reduction','unapproved battle effect'],
 [d=>d.evidence.scope.conditionType7Meaning='JOB_RESTRICTION','unresolved runtime meaning promotion'],
 [d=>d.references.records.pop(),'existing Fetter reference regression'],
 [d=>d.references.records[5].heartFetterId=14,'existing Heart Fetter ref mutation'],
];
for(const [mutate,label] of cases) rejects(mutate,`rejects ${label}`);
console.log(`Hero 15 Heart Fetter raw-condition negative controls: PASS (${cases.length})`);
