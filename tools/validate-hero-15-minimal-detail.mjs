import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { HERO_15_INTEGRATED_PUBLICATION_PATH, HERO_15_MINIMAL_DETAIL_PATH, renderHero15MinimalDetail, validateHero15IntegratedPublication, validateHero15MinimalDetail } from './hero-15-integrated-publication-contract.mjs';

const readJson = async (path) => JSON.parse(await readFile(resolve(path), 'utf8'));
const [decision, heroIdentities, heroLocalizations, relations, equipmentIdentities, equipmentLocalizations, generatedText, heroIndex, heroSlice] = await Promise.all([
  readJson(HERO_15_INTEGRATED_PUBLICATION_PATH),
  readJson('canonical/hero-identities.v1.json'),
  readJson('canonical/hero-localizations-ko.v1.json'),
  readJson('canonical/hero-exclusive-equipment-relations.v1.json'),
  readJson('canonical/exclusive-equipment.v1.json'),
  readJson('canonical/exclusive-equipment-localizations-ko.v1.json'),
  readFile(resolve(HERO_15_MINIMAL_DETAIL_PATH), 'utf8'),
  readJson('generated/hero-index.v1.json'),
  readJson('generated/hero-slice.v1.json'),
]);
const sourceHashes = Object.fromEntries(await Promise.all([
  ['heroIdentity', 'canonical/hero-identities.v1.json'],
  ['heroLocalization', 'canonical/hero-localizations-ko.v1.json'],
  ['equipmentRelation', 'canonical/hero-exclusive-equipment-relations.v1.json'],
  ['equipmentIdentity', 'canonical/exclusive-equipment.v1.json'],
  ['equipmentLocalization', 'canonical/exclusive-equipment-localizations-ko.v1.json'],
].map(async ([key, path]) => [key, createHash('sha256').update(await readFile(resolve(path))).digest('hex')])));
validateHero15IntegratedPublication(decision);
const inputs = { decision, heroIdentities, heroLocalizations, relations, equipmentIdentities, equipmentLocalizations, sourceHashes };
const generated = validateHero15MinimalDetail({ generatedText, inputs });
if (heroIndex.heroes.length !== 267 || heroSlice.heroes.length !== 29 || generated.heroes.length !== 1) {
  throw new Error('Hero Index, Full Detail, or Minimal Detail population changed outside the approved scope');
}
process.stdout.write('Hero 15 Minimal Detail: PASS (approved scope, exact Canonical claims, 1 minimal endpoint; 267 Index and 29 Full Detail preserved)\n');
