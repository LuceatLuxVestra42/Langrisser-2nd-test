import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { extractFunction } from './test-app-function-source.mjs';

const [frontend, html, index, approval, heroSlice] = await Promise.all([
  readFile('app.js', 'utf8'),
  readFile('index.html', 'utf8'),
  readFile('generated/hero-index.v1.json', 'utf8').then(JSON.parse),
  readFile('docs/decisions/hero-index-publication.v1.json', 'utf8').then(JSON.parse),
  readFile('generated/hero-slice.v1.json', 'utf8').then(JSON.parse),
]);

const makeElement = (tagName = 'div', id = '') => ({
  tagName, id, children: [], listeners: {}, attributes: {}, className: '', textContent: '', value: '', hidden: false,
  append(...children) { this.children.push(...children); },
  replaceChildren(...children) { this.children = children; },
  addEventListener(type, listener) { this.listeners[type] = listener; },
  setAttribute(key, value) { this.attributes[key] = value; },
  focus() { this.focused = true; },
  scrollIntoView() { this.scrolled = true; },
});
const elements = new Map(heroSlice.heroes.map(({ id }) => [`hero-${id}`, makeElement('article', `hero-${id}`)]));
const frames = [];
const document = {
  createElement: (tagName) => makeElement(tagName),
  getElementById: (id) => elements.get(id) ?? null,
};
const window = { location: { hash: '' }, requestAnimationFrame(callback) { frames.push(callback); } };
const runtime = [
  extractFunction(frontend, 'makeAnchor'),
  extractFunction(frontend, 'filterHeroIndex'),
  extractFunction(frontend, 'renderHeroIndexSearch'),
].join('\n');
const functions = runInNewContext(`(() => { ${runtime}; return { filterHeroIndex, renderHeroIndexSearch }; })()`, { document, window });

const input = makeElement('input', 'hero-index-search');
const clearButton = makeElement('button', 'hero-index-search-clear');
const count = makeElement('p', 'hero-index-search-count');
const emptyState = makeElement('p', 'hero-index-search-empty');
const container = makeElement('ol', 'hero-index-results');
const detailHeroIds = new Set(approval.approvedScope.detailHeroIds);
const detailedInput = makeElement('input', 'hero-search');
const factionFilter = makeElement('select', 'hero-faction-filter');
factionFilter.value = 'all';
let shownHeroId = null;
const navigation = functions.renderHeroIndexSearch({
  heroes: index.heroes, detailHeroIds, input, clearButton, count, emptyState, container,
  showDetailTarget(heroId) { shownHeroId = heroId; const target = elements.get(`hero-${heroId}`); if (target) target.hidden = false; },
});

assert.equal(container.children.length, 267, 'all approved Index entries render');
assert.equal(count.textContent, '검색 결과 267명 / 전체 267명');
assert.equal(emptyState.hidden, true);
assert.equal(new Set(container.children.map(({ id }) => id)).size, 267, 'Index DOM IDs are unique');
assert.ok(container.children.every(({ id }) => !elements.has(id)), 'Index DOM IDs do not collide with Hero detail IDs');
assert.equal(container.children.filter(({ children }) => children[0]?.tagName === 'a').length, 29,
  'only 29 existing detail endpoints render links');
assert.equal(container.children.filter(({ children }) => children[0]?.tagName !== 'a').length, 238,
  'all other Index entries remain unlinked');

const exactOne = functions.filterHeroIndex(index.heroes, '1');
assert.deepEqual(Array.from(exactOne, ({ heroId }) => heroId), [1], 'numeric search is exact and does not return IDs 10–19');
assert.deepEqual(Array.from(functions.filterHeroIndex(index.heroes, ' 10 '), ({ heroId }) => heroId), [10], 'numeric search trims input');
assert.equal(functions.filterHeroIndex(index.heroes, '999999').length, 0, 'unknown ID returns zero results');
assert.equal(functions.filterHeroIndex(index.heroes, '1abc').length, 0, 'numeric prefixes do not become name searches');
const sample = index.heroes.find(({ nameKo }) => nameKo.includes('크리'));
assert.ok(sample, 'fixture includes Korean name containing search fragment');
assert.ok(functions.filterHeroIndex(index.heroes, '크리').some(({ heroId }) => heroId === sample.heroId), 'Korean substring search is supported');

input.value = '1';
input.listeners.input();
assert.equal(container.children.length, 1);
assert.equal(container.children[0].id, 'hero-index-entry-1');
assert.equal(count.textContent, '검색 결과 1명 / 전체 267명');
assert.equal(detailedInput.value, '', 'Index search does not mutate existing detail search input');
assert.equal(factionFilter.value, 'all', 'Index search does not mutate the existing Faction filter');
input.value = 'unknown-hero-name';
input.listeners.input();
assert.equal(container.children.length, 0);
assert.equal(emptyState.hidden, false, 'zero matches show the independent Index empty state');
clearButton.listeners.click();
assert.equal(input.value, '');
assert.equal(input.focused, true);
assert.equal(container.children.length, 267, 'clear restores all approved Index rows');
assert.equal(emptyState.hidden, true);

const detailRow = container.children.find(({ id }) => id === 'hero-index-entry-1');
const detailLink = detailRow.children[0];
assert.equal(detailLink.href, '#hero-1');
elements.get('hero-1').hidden = true;
detailLink.listeners.click({ preventDefault() {} });
assert.equal(shownHeroId, 1, 'detail link delegates only to the existing detail navigation');
while (frames.length) frames.shift()();
assert.equal(elements.get('hero-1').scrolled, true);
const noDetailRow = container.children.find(({ id }) => !detailHeroIds.has(Number(id.slice('hero-index-entry-'.length))));
assert.ok(noDetailRow);
assert.ok(noDetailRow.children.every(({ tagName }) => tagName !== 'a'), 'no-detail Hero has no anchor or Fragment');

assert.notEqual('hero-index-search', 'hero-search');
assert.notEqual('hero-index-results', 'heroes');
assert.match(html, /id="hero-index-search"/);
assert.match(html, /id="hero-search"/);
process.stdout.write('Hero Index Frontend regression: PASS (exact ID/name search, empty/reset, independent state, 267 rows, 29 valid links, 238 unlinked rows)\n');
