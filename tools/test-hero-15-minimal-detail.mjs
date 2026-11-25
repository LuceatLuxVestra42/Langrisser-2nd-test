import { runInNewContext } from 'node:vm';
import { extractFunction } from './test-app-function-source.mjs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { readHero15SoldierPublicationInputs, readHero15ProfileInputs, HERO_15_INTEGRATED_PUBLICATION_PATH, HERO_15_MINIMAL_DETAIL_PATH, renderHero15MinimalDetail, validateHero15MinimalDetail } from './hero-15-integrated-publication-contract.mjs';

const read = async (path) => JSON.parse(await readFile(path, 'utf8'));
const [decision, heroIdentities, heroLocalizations, relations, equipmentIdentities, equipmentLocalizations, generatedText, heroIndex, heroSlice] = await Promise.all([
  read(HERO_15_INTEGRATED_PUBLICATION_PATH), read('canonical/hero-identities.v1.json'),
  read('canonical/hero-localizations-ko.v1.json'), read('canonical/hero-exclusive-equipment-relations.v1.json'),
  read('canonical/exclusive-equipment.v1.json'), read('canonical/exclusive-equipment-localizations-ko.v1.json'),
  readFile(HERO_15_MINIMAL_DETAIL_PATH, 'utf8'), read('generated/hero-index.v1.json'), read('generated/hero-slice.v1.json'),
]);
const sourceHashes = Object.fromEntries(await Promise.all([
  ['heroIdentity', 'canonical/hero-identities.v1.json'],
  ['heroLocalization', 'canonical/hero-localizations-ko.v1.json'],
  ['equipmentRelation', 'canonical/hero-exclusive-equipment-relations.v1.json'],
  ['equipmentIdentity', 'canonical/exclusive-equipment.v1.json'],
  ['equipmentLocalization', 'canonical/exclusive-equipment-localizations-ko.v1.json'],
].map(async ([key, path]) => [key, createHash('sha256').update(await readFile(path)).digest('hex')])));
const inputs = { soldierInputs: await readHero15SoldierPublicationInputs(read), profileInputs: await readHero15ProfileInputs(read), decision, heroIdentities, heroLocalizations, relations, equipmentIdentities, equipmentLocalizations, sourceHashes };
const generated = validateHero15MinimalDetail({ generatedText, inputs });
assert.deepEqual(generated.heroes.map(({ heroId }) => heroId), [15]);
assert.deepEqual(Object.keys(generated.heroes[0]).sort(), ['exclusiveEquipment', 'heroId', 'nameKo', 'profile', 'soldiers']);
assert.deepEqual(Object.keys(generated.heroes[0].exclusiveEquipment).sort(), ['effectDescriptionKo', 'equipmentId', 'nameKo']);
assert.equal(generated.heroes[0].exclusiveEquipment.equipmentId, 535);
assert.equal(generated.heroes[0].nameKo, '리아나');
assert.equal(heroIndex.heroes.length, 267);
assert.equal(heroSlice.heroes.length, 29);

const fails = (mutate, pattern) => {
  const changed = structuredClone(inputs);
  mutate(changed);
  assert.throws(() => renderHero15MinimalDetail(changed), pattern);
};
fails((x) => { x.decision.status = 'NOT_APPROVED'; }, /approval or scope/);
fails((x) => { x.decision.approvedScope.minimalDetail.fields.push('rarity'); }, /approval or scope/);
fails((x) => { x.heroIdentities.records = x.heroIdentities.records.filter(({ heroId }) => heroId !== 15); }, /exact approved claims/);
fails((x) => { x.heroLocalizations.records.find(({ heroId }) => heroId === 15).nameKo = '잘못된 이름'; }, /exact approved claims/);
fails((x) => { x.relations.records = x.relations.records.filter(({ heroId }) => heroId !== 15); }, /exact approved claims/);
fails((x) => { x.relations.records.push({ heroId: 15, equipmentId: 536 }); }, /exact approved claims/);
fails((x) => { x.equipmentIdentities.records = x.equipmentIdentities.records.filter(({ equipmentId }) => equipmentId !== 535); }, /exact approved claims/);
fails((x) => { x.equipmentLocalizations.records.find(({ equipmentId }) => equipmentId === 535).effectDescriptionKo = ''; }, /exact approved claims/);
fails((x) => { x.sourceHashes.equipmentRelation = '0'.repeat(64); }, /source hash changed/);
assert.throws(() => validateHero15MinimalDetail({ generatedText: generatedText.replace('리아나', '다른 이름'), inputs }), /stale or non-deterministic/);
fails((x) => { delete x.profileInputs.approval; }, /profile decision/);
fails((x) => { x.profileInputs.approval.surface = 'hero-index'; }, /approval or scope/);
fails((x) => { x.profileInputs.rarities.records.find(({ heroId }) => heroId === 15).rankId = 3; }, /exact approved Canonical/);
fails((x) => { x.profileInputs.relations.records.push({ heroId: 15, factionId: 5 }); }, /exact approved Canonical/);
fails((x) => { x.profileInputs.names.records.find(({ factionId }) => factionId === 1).nameKo = '다른 이름'; }, /exact approved Canonical/);
assert.equal(heroSlice.heroes.some(({ id }) => id === 15), false);
assert.deepEqual(heroIndex.heroes.find(({ heroId }) => heroId === 15), { heroId: 15, nameKo: '리아나' });
const extraField = structuredClone(generated);
extraField.heroes[0].rarity = { rankId: 3 };
assert.throws(() => validateHero15MinimalDetail({ generatedText: `${JSON.stringify(extraField, null, 2)}\n`, inputs }), /stale or non-deterministic/);
const duplicated = structuredClone(generated);
duplicated.heroes.push(structuredClone(duplicated.heroes[0]));
assert.throws(() => validateHero15MinimalDetail({ generatedText: `${JSON.stringify(duplicated, null, 2)}\n`, inputs }), /stale or non-deterministic/);
const frontend = await readFile('app.js', 'utf8');
const talent = await read('generated/hero-15-talent-public.v1.json');
const html = await readFile('index.html', 'utf8');
assert.match(html, /id="hero-minimal-detail-15-content"/);
const equipmentNavigation = await read('generated/exclusive-equipment-hero-navigation.v1.json');
assert.deepEqual(equipmentNavigation.records.find(({ equipmentId }) => equipmentId === 535).navigationTarget,
  { surface: 'HERO_MINIMAL_DETAIL', fragment: 'hero-minimal-detail-15' });

const element = () => ({
  children: [],
  append(...children) { this.children.push(...children); },
  replaceChildren(...children) { this.children = children; },
});
const target = { scrollIntoView() { this.scrolled = true; } };
const render = runInNewContext([
  extractFunction(frontend, 'renderHeroMinimalDetailView'),
  extractFunction(frontend, 'renderHero15MinimalDetailView'),
  'renderHero15MinimalDetailView',
].join('\n'), {
  document: { createElement: element, getElementById: (id) => id === 'hero-minimal-detail-15' ? target : null },
  makeTalentPresentation: () => ({ textContent: '성결한 수녀' }),
});
const container = element();
const navigation = render(generated, talent, container);
const paragraphs = container.children[0].children.map(({ textContent }) => textContent);
assert.ok(paragraphs.includes('등급 · SSR'));
assert.ok(paragraphs.includes('진영 · 시대의 주역 · 빛의 군단 · 공주 연맹'));
assert.ok(paragraphs.includes('완벽한 찬사 (Equipment ID 535)'));
assert.ok(paragraphs.includes('성결한 수녀'));
const soldierSection = container.children[0].children.find(({ children }) => children?.[0]?.textContent === '용병');
const soldierLabels = soldierSection.children[1].children.map(({ textContent }) => textContent);
assert.equal(soldierLabels.length, 14);
assert.ok(soldierLabels.includes('NORMAL · 하이랜더'));
assert.ok(soldierLabels.includes('SP · 하이랜더'));
fails((x) => { x.soldierInputs.approval.soldiers.pop(); }, /approved subset/);
assert.equal(navigation.showTarget(15), true);
assert.equal(target.scrolled, true);
assert.equal(navigation.showTarget(16), false);
const leaked = structuredClone(generated);
leaked.heroes[0].profile.origins = [];
assert.throws(() => render(leaked, talent, element()), /profile consumer/);
process.stdout.write('Hero 15 Minimal Detail regression: PASS (publication, ID, relation, localization, equipment, fields, duplication, stale output, and preserved populations)\n');
