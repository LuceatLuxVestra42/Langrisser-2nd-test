import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { EXCLUSIVE_EQUIPMENT_HERO_NAVIGATION_PATH, EXCLUSIVE_EQUIPMENT_HERO_PUBLICATION_PATH, validateExclusiveEquipmentHeroNavigation } from './exclusive-equipment-hero-navigation-contract.mjs';

const readJson = async (path) => JSON.parse(await readFile(resolve(path), 'utf8'));
const [relations, equipmentIdentities, heroIdentities, heroLocalizations, heroSlice, heroIndexPublication, publicationDecision, generatedText, heroLocalizationBytes, heroIdentityBytes] = await Promise.all([
  readJson('canonical/hero-exclusive-equipment-relations.v1.json'),
  readJson('canonical/exclusive-equipment.v1.json'),
  readJson('canonical/hero-identities.v1.json'),
  readJson('canonical/hero-localizations-ko.v1.json'),
  readJson('generated/hero-slice.v1.json'),
  readJson('docs/decisions/hero-index-publication.v1.json'),
  readJson(EXCLUSIVE_EQUIPMENT_HERO_PUBLICATION_PATH),
  readFile(resolve(EXCLUSIVE_EQUIPMENT_HERO_NAVIGATION_PATH), 'utf8'),
  readFile(resolve('canonical/hero-localizations-ko.v1.json')),
  readFile(resolve('canonical/hero-identities.v1.json')),
]);
const generated = validateExclusiveEquipmentHeroNavigation({ generatedText, inputs: {
  relations, equipmentIdentities, heroIdentities, heroLocalizations, heroSlice, heroIndexPublication, publicationDecision,
  heroLocalizationSha256: createHash('sha256').update(heroLocalizationBytes).digest('hex'),
  heroIdentitySha256: createHash('sha256').update(heroIdentityBytes).digest('hex'),
} });
process.stdout.write(`Exclusive Equipment Hero Navigation: PASS (${generated.records.length} relations; 29 detail, 138 Hero Index; approved source hashes and deterministic output)\n`);
