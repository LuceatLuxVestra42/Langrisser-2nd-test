import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { validateHero15IntegratedPublication, HERO_15_INTEGRATED_PUBLICATION_PATH } from './hero-15-integrated-publication-contract.mjs';
import { HERO_15_TALENT_PUBLICATION_PATH, HERO_15_TALENT_PUBLIC_PATH, renderHero15TalentPublic, validateHero15TalentDecision, validateHero15TalentPublic } from './hero-15-talent-publication-contract.mjs';
const readJson = async p => JSON.parse(await readFile(resolve(p),'utf8'));
const decision=validateHero15TalentDecision(await readJson(HERO_15_TALENT_PUBLICATION_PATH));
const integrated=validateHero15IntegratedPublication(await readJson(HERO_15_INTEGRATED_PUBLICATION_PATH));
if(integrated.approvedScope.excluded.includes('Talent')!==true) throw new Error('Existing integrated publication must continue excluding Talent');
const [talentRelations,skills,localizations,generatedText]=await Promise.all([
  readJson('canonical/hero-talent-star-skills.v1.json'), readJson('canonical/skills.v1.json'),
  readJson('canonical/hero-talent-localizations-ko.v1.json'), readFile(resolve(HERO_15_TALENT_PUBLIC_PATH),'utf8'),
]);
const inputs={decision,talentRelations,skills,localizations};
validateHero15TalentPublic({generatedText,inputs});
const slice=await readJson('generated/hero-slice.v1.json');
if(slice.heroes.some(h=>h.id===15&&h.talent)) throw new Error('Hero 15 Talent leaked into Full Detail consumer');
const payload=JSON.parse(renderHero15TalentPublic(inputs));
if(payload.talent.starDescriptions.map(r=>r.skillId).join(',')!=='3212,3214,3216,3218') throw new Error('Hero 15 Talent Skill endpoint mismatch');
console.log('Hero 15 Talent Publication Owner: PASS (decision, exact scope, Canonical parity, isolated generated consumer, Full Detail boundary)');
