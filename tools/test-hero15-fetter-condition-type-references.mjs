import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateHero15FetterConditionTypeReferencesData } from './validate-hero15-fetter-condition-type-references.mjs';
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const [evidence,canonical,fetterDetails,heartDetails,references,heartConditions]=await Promise.all([read('evidence/source/bonds/hero15-fetter-condition-type-references.v1.json'),read('canonical/hero-fetter-condition-type-references.v1.json'),read('canonical/hero-fetter-raw-details.v1.json'),read('canonical/hero-heart-fetter-raw-details.v1.json'),read('canonical/hero-fetter-references.v1.json'),read('canonical/hero-heart-fetter-raw-conditions.v1.json')]);
const fresh=()=>({evidence:structuredClone(evidence),canonical:structuredClone(canonical),fetterDetails:structuredClone(fetterDetails),heartDetails:structuredClone(heartDetails),references:structuredClone(references),heartConditions:structuredClone(heartConditions)});
const expected={typeReferences:11,regularFetter:9,heartFetter:2,runtimePredicate:'NOT_ADMITTED',parameterSemantics:'NOT_ADMITTED',publication:false};
assert.deepEqual(validateHero15FetterConditionTypeReferencesData(fresh()),expected);
const cases=[
 [d=>d.evidence.source.blobSha1='0'.repeat(40),'metadata blob'],[d=>d.evidence.source.sha256='0'.repeat(64),'metadata hash'],[d=>d.evidence.enumDefinitions[0].members['1']='invented','enum member'],[d=>d.evidence.messageFieldDefinitions[0].fields.ConditionType=2,'message field locator'],
 [d=>d.evidence.claims[0].typeCode=2,'condition type code'],[d=>d.evidence.claims[0].enumMember='HeroHeartFetterUnlockConditionType_HeroLevel','enum namespace mismatch'],[d=>d.evidence.claims[0].trackEndpointId=67,'Fetter endpoint'],[d=>d.evidence.claims[0].sourceArrayIndex++,'array locator'],[d=>d.evidence.claims.pop(),'missing source claim'],
 [d=>d.canonical.records[0].evidenceProvenance='wrong','provenance'],[d=>d.canonical.records[0].predicate='Hero level >= x','predicate invention'],[d=>d.canonical.records[0].andOr='AND','condition grouping invention'],[d=>d.canonical.records[0].unlockCondition=true,'unlock rule escalation'],[d=>d.heartDetails.records[0].fields.UnlockConditions.reverse(),'raw Heart source regression'],[d=>d.fetterDetails.records[0].fields.CompletionConditions[0].ConditionType=2,'raw Fetter type regression'],[d=>d.references.records.pop(),'existing Fetter references'],[d=>d.heartConditions.records.pop(),'existing Heart raw conditions']
];
for(const [mutate,label] of cases){const d=fresh();mutate(d);assert.throws(()=>validateHero15FetterConditionTypeReferencesData(d),undefined,`must reject ${label}`);}
console.log(`Hero 15 Fetter condition type negative controls: PASS (${cases.length})`);
