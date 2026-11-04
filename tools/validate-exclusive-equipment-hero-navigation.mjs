import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { EXCLUSIVE_EQUIPMENT_HERO_NAVIGATION_PATH, EXCLUSIVE_EQUIPMENT_HERO_PUBLICATION_PATH, validateExclusiveEquipmentHeroNavigation } from './exclusive-equipment-hero-navigation-contract.mjs';
import { HERO_15_INTEGRATED_PUBLICATION_PATH, validateHero15IntegratedPublication } from './hero-15-integrated-publication-contract.mjs';
import { HERO_16_INTEGRATED_PUBLICATION_PATH, validateHero16IntegratedPublication } from './hero-16-integrated-publication-contract.mjs';

const readJson = async (path) => JSON.parse(await readFile(resolve(path), 'utf8'));
const [relations, equipmentIdentities, heroIdentities, heroLocalizations, heroSlice, heroIndexPublication, publicationDecision, integratedPublicationDecision, hero16IntegratedPublicationDecision, generatedText, heroLocalizationBytes, heroIdentityBytes] = await Promise.all([
  readJson('canonical/hero-exclusive-equipment-relations.v1.json'),
  readJson('canonical/exclusive-equipment.v1.json'),
  readJson('canonical/hero-identities.v1.json'),
  readJson('canonical/hero-localizations-ko.v1.json'),
  readJson('generated/hero-slice.v1.json'),
  readJson('docs/decisions/hero-index-publication.v1.json'),
  readJson(EXCLUSIVE_EQUIPMENT_HERO_PUBLICATION_PATH),
  readJson(HERO_15_INTEGRATED_PUBLICATION_PATH),
  readJson(HERO_16_INTEGRATED_PUBLICATION_PATH),
  readFile(resolve(EXCLUSIVE_EQUIPMENT_HERO_NAVIGATION_PATH), 'utf8'),
  readFile(resolve('canonical/hero-localizations-ko.v1.json')),
  readFile(resolve('canonical/hero-identities.v1.json')),
]);
validateHero15IntegratedPublication(integratedPublicationDecision);
validateHero16IntegratedPublication(hero16IntegratedPublicationDecision);
const generated = validateExclusiveEquipmentHeroNavigation({ generatedText, inputs: {
  relations, equipmentIdentities, heroIdentities, heroLocalizations, heroSlice, heroIndexPublication, publicationDecision, integratedPublicationDecision, hero16IntegratedPublicationDecision,
  heroLocalizationSha256: createHash('sha256').update(heroLocalizationBytes).digest('hex'),
  heroIdentitySha256: createHash('sha256').update(heroIdentityBytes).digest('hex'),
} });
process.stdout.write(`Exclusive Equipment Hero Navigation: PASS (${generated.records.length} relations; 29 Full Detail, 136 Hero Index, 2 approved Minimal Detail; approved source hashes and deterministic output)\n`);
