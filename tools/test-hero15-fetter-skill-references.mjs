import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateHero15FetterSkillReferencesData } from './validate-hero15-fetter-skill-references.mjs';
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const [evidence,canonical,fetterDetails,heartDetails]=await Promise.all([read('evidence/source/bonds/hero15-fetter-skill-references.v1.json'),read('canonical/hero-fetter-skill-references.v1.json'),read('canonical/hero-fetter-raw-details.v1.json'),read('canonical/hero-heart-fetter-raw-details.v1.json')]);
const fresh=()=>({evidence:structuredClone(evidence),canonical:structuredClone(canonical),fetterDetails:structuredClone(fetterDetails),heartDetails:structuredClone(heartDetails)});
const expected={locatorRelations:54,skillInfoEndpoints:54,regularFetters:45,heartFetter:9,skillIdentityAdmission:false,acquisitionSemantics:false,publication:false};
assert.deepEqual(validateHero15FetterSkillReferencesData(fresh()),expected);
const cases=[
 [d=>d.evidence.source.skillInfo.blobSha1='0'.repeat(40),'SkillInfo blob'],[d=>d.evidence.source.skillInfo.sha256='0'.repeat(64),'SkillInfo hash'],[d=>d.evidence.source.configDataTree='0'.repeat(40),'ConfigData tree'],[d=>d.evidence.legacyLocatorContract.blobSha1='0'.repeat(40),'legacy contract pin'],[d=>d.evidence.legacyFrozenProjection.blobSha1='0'.repeat(40),'frozen projection pin'],
 [d=>d.evidence.claims[0].skillId++,'source Skill ID'],[d=>d.evidence.claims[0].targetLevel++,'target level'],[d=>d.evidence.claims[0].sourceArrayIndex++,'targetLevel-1 locator'],[d=>d.evidence.claims[0].sourceField='HeroHeartFetterSkills','field namespace'],[d=>d.evidence.claims[0].trackEndpointId=67,'Fetter endpoint'],[d=>d.evidence.claims[0].trackKind='HEART_FETTER','regular/Heart namespace'],[d=>d.evidence.claims.pop(),'missing relation'],[d=>d.evidence.claims.reverse(),'relation order'],
 [d=>d.evidence.skillEndpoints[0].recordIndex++,'SkillInfo record index'],[d=>d.evidence.skillEndpoints[0].recordLocator='ConfigDataSkillInfo#ID=9','SkillInfo locator'],[d=>d.evidence.skillEndpoints.pop(),'missing SkillInfo endpoint'],[d=>d.evidence.skillEndpoints[1].skillId=d.evidence.skillEndpoints[0].skillId,'duplicate SkillInfo endpoint'],
 [d=>d.canonical.records[0].skillId++,'canonical Skill ID'],[d=>d.canonical.records[0].evidenceProvenance='bad','canonical provenance'],[d=>d.canonical.records[0].sourceArrayIndex=0,'canonical locator'],[d=>d.canonical.records[0].acquired=true,'acquisition semantics'],[d=>d.canonical.records[0].equippable=true,'equip semantics'],
 [d=>d.fetterDetails.records[0].fields.GotSkills_ID.reverse(),'raw regular skill array regression'],[d=>d.heartDetails.records[0].fields.HeroHeartFetterSkills.reverse(),'raw Heart skill array regression'],[d=>d.canonical.records.push({...d.canonical.records[0]}),'duplicate canonical relation'],
];
for(const [mutate,label] of cases){const d=fresh();mutate(d);assert.throws(()=>validateHero15FetterSkillReferencesData(d),undefined,`must reject ${label}`);}
console.log(`Hero 15 Fetter Skill Reference negative controls: PASS (${cases.length})`);
