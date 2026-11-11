import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { HERO_15_TALENT_PUBLICATION_PATH, HERO_15_TALENT_PUBLIC_PATH, renderHero15TalentPublic, validateHero15TalentDecision } from './hero-15-talent-publication-contract.mjs';
const readJson = async path => JSON.parse(await readFile(resolve(path), 'utf8'));
const decision = validateHero15TalentDecision(await readJson(HERO_15_TALENT_PUBLICATION_PATH));
const [talentRelations, skills, localizations] = await Promise.all([
  readJson('canonical/hero-talent-star-skills.v1.json'),
  readJson('canonical/skills.v1.json'),
  readJson('canonical/hero-talent-localizations-ko.v1.json'),
]);
await writeFile(resolve(HERO_15_TALENT_PUBLIC_PATH), renderHero15TalentPublic({ decision, talentRelations, skills, localizations }), 'utf8');
console.log(`Generated ${resolve(HERO_15_TALENT_PUBLIC_PATH)}`);
