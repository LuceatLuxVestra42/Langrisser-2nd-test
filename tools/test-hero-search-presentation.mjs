import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { extractFunction } from './test-app-function-source.mjs';

const reorderedFunctionFixture = `function trailing() {}
function target(value) {
  const closeBrace = '}';
  if (value) { return { value, closeBrace }; }
  return null;
}
function preceding() {}`;
assert.equal(extractFunction(reorderedFunctionFixture, 'target'), `function target(value) {
  const closeBrace = '}';
  if (value) { return { value, closeBrace }; }
  return null;
}`);

const fakeDeclarationFixture = `// function target(value) { return 7; }
const documentation = "function target(value) { return 9; }";
function target(value) { return 42; }`;
const extractedTarget = extractFunction(fakeDeclarationFixture, 'target');
assert.equal(new Function(`${extractedTarget}; return target(0);`)(), 42,
  'comments and strings before the declaration must not be extracted as code');

import { runInNewContext } from 'node:vm';

const [frontend, html, heroData, relationData, exclusiveData] = await Promise.all([
  readFile('app.js', 'utf8'),
  readFile('index.html', 'utf8'),
  readFile('generated/hero-slice.v1.json', 'utf8').then(JSON.parse),
  readFile('generated/hero-soldier-relations.v1.json', 'utf8').then(JSON.parse),
  readFile('generated/exclusive-equipment.v1.json', 'utf8').then(JSON.parse),
]);

assert.equal(heroData.schemaVersion, 1);
assert.ok(heroData.heroes.length > 0);
assert.ok(heroData.heroes.every(({ id, nameKo }) => Number.isSafeInteger(id) && typeof nameKo === 'string' && nameKo.trim()));
assert.equal(new Set(heroData.heroes.map(({ id }) => id)).size, heroData.heroes.length);
assert.equal(relationData.schemaVersion, 1);
assert.equal(exclusiveData.schemaVersion, 1);
assert.match(html, /<div class="hero-search" role="search" aria-label="영웅 검색">/);
assert.match(html, /<label for="hero-search">한국어 영웅명 또는 Hero ID<\/label>/);
assert.match(html, /id="hero-search" type="search"/);
assert.match(html, /id="hero-search-clear" type="button"/);
assert.match(html, /id="hero-search-count" class="hero-search-count" aria-live="polite"/);
assert.match(html, /id="hero-search-empty"[^>]*role="status"[^>]*aria-live="polite"[^>]*hidden/);


const makeElement = (id = '') => ({
  id, children: [], listeners: {}, attributes: {}, className: '', textContent: '', value: '', hidden: false,
  append(...children) { this.children.push(...children); },
  addEventListener(type, listener) { this.listeners[type] = listener; },
  setAttribute(key, value) { this.attributes[key] = value; },
  focus() { this.focused = true; },
  scrollIntoView() { this.scrolled = true; },
});

const elements = new Map(heroData.heroes.map(({ id }) => [`hero-${id}`, makeElement(`hero-${id}`)]));
const heroNames = new Map(heroData.heroes.map(({ id, nameKo }) => [id, nameKo]));
const input = makeElement('hero-search');
const clearButton = makeElement('hero-search-clear');
const count = makeElement('hero-search-count');
const emptyState = makeElement('hero-search-empty');
const container = makeElement('exclusive-equipment');
const frames = [];
const document = {
  createElement: () => makeElement(),
  getElementById: (id) => elements.get(id) ?? null,
  querySelector: (selector) => {
    const match = selector.match(/^#hero-(\d+) h2$/);
    return match ? { textContent: heroNames.get(Number(match[1])) } : null;
  },
};
const sandbox = {
  URL,
  document,
  window: { location: { hash: '' }, requestAnimationFrame(callback) { frames.push(callback); } },
  heroBySoldierId: new Map(),
};
const runtime = [
  extractFunction(frontend, 'makeAnchor'),
  extractFunction(frontend, 'filterHeroes'),
  extractFunction(frontend, 'renderHeroSearch'),
  extractFunction(frontend, 'addExclusiveEquipment'),
  extractFunction(frontend, 'makeSoldierHeroLinks'),
].join('\n');
const functions = runInNewContext(`(() => {
  let heroNavigation = null;
  let exclusiveEquipmentHeroById = new Map();
  const exclusiveEquipmentContainer = container;
  ${runtime}
  return {
    filterHeroes, makeAnchor, makeSoldierHeroLinks, addExclusiveEquipment,
    startSearch(heroes) { heroNavigation = renderHeroSearch({ heroes, input, clearButton, count, emptyState }); return heroNavigation; },
    setExclusiveEquipmentHeroById(value) { exclusiveEquipmentHeroById = value; },
  };
})()`, { ...sandbox, input, clearButton, count, emptyState, container });

const navigation = functions.startSearch(heroData.heroes);
const independentMatches = (heroes, query) => {
  const value = query.trim();
  if (value === '') return heroes;
  if (/^[0-9]+$/.test(value)) return heroes.filter((hero) => `${hero.id}` === value);
  if (/^[0-9]/.test(value) || /^[+-][0-9]/.test(value)) return [];
  return heroes.filter((hero) => hero.nameKo.toLocaleLowerCase('ko-KR').includes(value.toLocaleLowerCase('ko-KR')));
};
const verify = (query) => {
  input.value = query;
  input.listeners.input({ target: input });
  const expected = independentMatches(heroData.heroes, query).map(({ id }) => id).sort((a, b) => a - b);
  const actual = heroData.heroes.filter(({ id }) => !elements.get(`hero-${id}`).hidden).map(({ id }) => id).sort((a, b) => a - b);
  assert.deepEqual(actual, expected, `visible Hero ID set for ${JSON.stringify(query)}`);
  assert.equal(count.textContent, `검색 결과 ${expected.length}명 / 전체 ${heroData.heroes.length}명`);
  assert.equal(emptyState.hidden, expected.length > 0);
  return expected;
};

verify('');

const exclusiveHero = heroData.heroes[0];
const exclusiveEquipment = exclusiveData.equipment.find(({ equipmentId }) => equipmentId === exclusiveHero.exclusiveEquipment.equipmentId);
assert.ok(exclusiveEquipment, 'approved Hero equipment endpoint exists in current equipment Consumer');
functions.setExclusiveEquipmentHeroById(new Map([[exclusiveEquipment.equipmentId, exclusiveHero]]));
functions.addExclusiveEquipment(exclusiveEquipment);
const equipmentCard = container.children.at(-1);
const equipmentHeroLink = equipmentCard.children[1];
assert.equal(equipmentHeroLink.href, `#hero-${exclusiveHero.id}`);
verify('__not_a_hero__');
let equipmentNavigationPrevented = false;
equipmentHeroLink.listeners.click({ preventDefault() { equipmentNavigationPrevented = true; } });
assert.equal(equipmentNavigationPrevented, false);
assert.equal(elements.get(`hero-${exclusiveHero.id}`).hidden, false);
assert.equal(input.value, '');
while (frames.length) frames.shift()();
assert.equal(elements.get(`hero-${exclusiveHero.id}`).scrolled, true, 'Equipment navigation scrolls to the revealed Hero');
verify('');
for (const hero of heroData.heroes) {
  assert.deepEqual(verify(String(hero.id)), [hero.id], `exact ID lookup for Hero ${hero.id}`);
  assert.deepEqual(verify(`  ${hero.id}  `), [hero.id], `trimmed ID lookup for Hero ${hero.id}`);
  assert.deepEqual(verify(hero.nameKo), [hero.id], `name lookup for Hero ${hero.id}`);
  const fragment = Array.from(hero.nameKo)[0];
  assert.ok(verify(fragment).includes(hero.id), `name fragment should match Hero ${hero.id}`);
}

const existingIds = new Set(heroData.heroes.map(({ id }) => String(id)));
let missingId = 1;
while (existingIds.has(String(missingId))) missingId += 1;
for (const invalid of [String(missingId), `0${heroData.heroes[0].id}`, `+${heroData.heroes[0].id}`,
  `${heroData.heroes[0].id}.0`, `${heroData.heroes[0].id}e0`, `${heroData.heroes[0].id}abc`]) {
  assert.equal(verify(invalid).length, 0, `invalid or missing ID input ${JSON.stringify(invalid)}`);
}
assert.equal(verify('__영웅이_아닌_검색어__').length, 0);
verify('   ');
clearButton.listeners.click();
assert.equal(input.value, '');
assert.equal(input.focused, true);
verify('');

const isolatedMulti = [
  { id: 900001, nameKo: '검은 기사단장' },
  { id: 900002, nameKo: '검은 기사단원' },
];
assert.deepEqual(functions.filterHeroes(isolatedMulti, '기사단').map(({ id }) => id), [900001, 900002]);

const targetHero = heroData.heroes.at(-1);
assert.equal(navigation.showTarget(targetHero.id), true);
assert.equal(input.value, '');
verify('');
input.value = 'does-not-match';
input.listeners.input({ target: input });
assert.equal(navigation.showTarget(Number.MAX_SAFE_INTEGER), false, 'unapproved Hero targets must not reset the filter');
assert.equal(input.value, 'does-not-match');

const pair = relationData.relations.find(({ heroId }) => heroId === targetHero.id);
assert.ok(pair, 'selected approved Hero has a validated Soldier relation');
sandbox.heroBySoldierId.set(pair.soldierId, [targetHero.id]);
const heroLinks = functions.makeSoldierHeroLinks(pair.soldierId);
const heroAnchor = heroLinks.children[1].children[0].children[0];
assert.equal(heroAnchor.href, `#hero-${targetHero.id}`);
let prevented = false;
heroAnchor.listeners.click({ preventDefault() { prevented = true; } });
assert.equal(prevented, false, 'an existing hidden Hero endpoint should retain normal anchor behavior');
assert.equal(elements.get(`hero-${targetHero.id}`).hidden, false);
assert.equal(input.value, '');
while (frames.length) frames.shift()();
assert.equal(elements.get(`hero-${targetHero.id}`).scrolled, true, 'Soldier navigation scrolls to the revealed Hero');
verify('');

assert.equal(new Set(relationData.relations.map(({ heroId, soldierId }) => `${heroId}:${soldierId}`)).size,
  relationData.relations.length, 'existing Hero-Soldier relation IDs remain unique');
process.stdout.write(`Hero search presentation PASS (${heroData.heroes.length} approved Heroes; ID/name/partial/no-result/reset/hidden-target cases; ${relationData.relations.length} relation rows unchanged)\n`);
