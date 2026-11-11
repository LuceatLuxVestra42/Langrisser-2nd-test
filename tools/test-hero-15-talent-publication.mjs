import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateHero15TalentDecision, renderHero15TalentPublic, validateHero15TalentPublic } from './hero-15-talent-publication-contract.mjs';
import { validateHero15IntegratedPublication } from './hero-15-integrated-publication-contract.mjs';
const clone=x=>JSON.parse(JSON.stringify(x));
const decision=JSON.parse(await readFile('docs/decisions/hero-15-talent-publication.v1.json','utf8'));
const talentRelations=JSON.parse(await readFile('canonical/hero-talent-star-skills.v1.json','utf8'));
const skills=JSON.parse(await readFile('canonical/skills.v1.json','utf8'));
const localizations=JSON.parse(await readFile('canonical/hero-talent-localizations-ko.v1.json','utf8'));
const inputs={decision,talentRelations,skills,localizations};
const good=renderHero15TalentPublic(inputs);
validateHero15TalentPublic({generatedText:good,inputs});
for(const mutate of [
 d=>d.status='PENDING', d=>d.approvedScope.heroId=8, d=>d.approvedScope.surface='hero-index-list',
 d=>d.approvedScope.stars[0].skillId=999, d=>d.approvedScope.fields.push('publicationApproval'),
 d=>d.approval.source.quote='altered approval', d=>d.approvedScope.officialKrProvenanceStatus='verified',
 d=>d.approvedScope.excluded=[], d=>d.effect.effective=false,
]){const d=clone(decision); mutate(d); assert.throws(()=>validateHero15TalentDecision(d));}
for(const mutate of [
 x=>x.records.find(r=>r.heroId===15&&r.star===3).skillId=99,
 x=>x.records.find(r=>r.heroId===15&&r.star===3).star=4,
 x=>x.records.find(r=>r.heroId===15&&r.star===3).provenance='wrong',
 x=>x.records.push({...x.records.find(r=>r.heroId===15&&r.star===3)}),
]){const x=clone(talentRelations);mutate(x);assert.throws(()=>renderHero15TalentPublic({...inputs,talentRelations:x}));}
for(const mutate of [
 x=>x.nameRecords.find(r=>r.heroId===15).talentNameKo='변조',
 x=>x.descriptionRecords.find(r=>r.heroId===15&&r.star===3).descriptionKoRaw='변조',
 x=>x.descriptionRecords.find(r=>r.heroId===15&&r.star===3).skillId=999,
 x=>x.descriptionRecords.find(r=>r.heroId===15&&r.star===3).provenance='wrong',
 x=>x.officialKrProvenanceStatus='verified',
]){const x=clone(localizations);mutate(x);assert.throws(()=>renderHero15TalentPublic({...inputs,localizations:x}));}
for(const mutate of [
 x=>x.records.find(r=>r.skillId===3212).nameCn='mutated',
 x=>x.records.find(r=>r.skillId===3212).descriptionCn='mutated',
 x=>x.records.find(r=>r.skillId===3212).provenance.description='wrong',
]){const x=clone(skills);mutate(x);assert.throws(()=>renderHero15TalentPublic({...inputs,skills:x}));}
assert.throws(()=>validateHero15TalentPublic({generatedText:good.replace('圣洁的修女','mutated'),inputs}));
assert.throws(()=>validateHero15TalentPublic({generatedText:good+' ',inputs}));
const integrated=JSON.parse(await readFile('docs/decisions/hero-15-integrated-publication.v1.json','utf8'));
validateHero15IntegratedPublication(integrated);
const alteredIntegrated=clone(integrated); alteredIntegrated.approvedScope.excluded=alteredIntegrated.approvedScope.excluded.filter(x=>x!=='Talent');
assert.throws(()=>validateHero15IntegratedPublication(alteredIntegrated));
const fullDetail=JSON.parse(await readFile('generated/hero-slice.v1.json','utf8'));
assert.equal(fullDetail.heroes.find(h=>h.id===15)?.talent,undefined,'Talent must not be added to Full Detail');
assert.equal(JSON.parse(await readFile('generated/hero-index.v1.json','utf8')).heroes.some(h=>Object.hasOwn(h,'talent')),false,'Hero Index must remain Talent-free');
console.log('Hero 15 Talent Publication Negative Tests: PASS (approval/scope, endpoints, localization, source parity, stale output)');
