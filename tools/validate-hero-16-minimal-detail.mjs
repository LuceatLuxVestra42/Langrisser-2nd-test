import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { HERO_16_INTEGRATED_PUBLICATION_PATH, HERO_16_MINIMAL_DETAIL_PATH, validateHero16IntegratedPublication, validateHero16MinimalDetail } from './hero-16-integrated-publication-contract.mjs';

const readJson = async (path) => JSON.parse(await readFile(resolve(path), 'utf8'));
const [decision, heroIdentities, heroLocalizations, relations, equipmentIdentities, equipmentLocalizations, generatedText, heroIndex, heroSlice, hero15] = await Promise.all([
  readJson(HERO_16_INTEGRATED_PUBLICATION_PATH), readJson('canonical/hero-identities.v1.json'), readJson('canonical/hero-localizations-ko.v1.json'),
  readJson('canonical/hero-exclusive-equipment-relations.v1.json'), readJson('canonical/exclusive-equipment.v1.json'),
  readJson('canonical/exclusive-equipment-localizations-ko.v1.json'), readFile(resolve(HERO_16_MINIMAL_DETAIL_PATH), 'utf8'),
  readJson('generated/hero-index.v1.json'), readJson('generated/hero-slice.v1.json'), readJson('generated/hero-minimal-detail.v1.json'),
]);
const sourceHashes = Object.fromEntries(await Promise.all([
  ['heroIdentity', 'canonical/hero-identities.v1.json'], ['heroLocalization', 'canonical/hero-localizations-ko.v1.json'],
  ['equipmentRelation', 'canonical/hero-exclusive-equipment-relations.v1.json'], ['equipmentIdentity', 'canonical/exclusive-equipment.v1.json'],
  ['equipmentLocalization', 'canonical/exclusive-equipment-localizations-ko.v1.json'],
].map(async ([key, path]) => [key, createHash('sha256').update(await readFile(resolve(path))).digest('hex')])));
validateHero16IntegratedPublication(decision);
const generated = validateHero16MinimalDetail({ generatedText, inputs: { decision, heroIdentities, heroLocalizations, relations, equipmentIdentities, equipmentLocalizations, sourceHashes } });
if (heroIndex.heroes.length !== 267 || heroSlice.heroes.length !== 29 || hero15.heroes.length !== 1 || hero15.heroes[0].heroId !== 15 || generated.heroes.length !== 1 || generated.heroes[0].heroId !== 16) {
  throw new Error('Hero Index, Full Detail, or Hero 15/Hero 16 Minimal Detail populations differ from the approved scope');
}
process.stdout.write('Hero 16 Minimal Detail: PASS (approved scope, exact Canonical claims, separate Hero 16 consumer; 267 Index, 29 Full Detail, Hero 15 preserved)\n');
