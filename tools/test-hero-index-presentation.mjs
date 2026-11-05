import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
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
const batchHeroIds = [17, 18, 20, 21, 30];
const tenBatchHeroIds = [31, 34, 35, 36, 38, 39, 49, 51, 54, 57];
const twentyBatchHeroIds = [58, 59, 61, 62, 63, 64, 65, 66, 87, 88, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100];
const minimalDetailHeroIds = new Set([15, 16, ...batchHeroIds, ...tenBatchHeroIds, ...twentyBatchHeroIds]);
const detailedInput = makeElement('input', 'hero-search');
const factionFilter = makeElement('select', 'hero-faction-filter');
factionFilter.value = 'all';
let shownHeroId = null;
let shownMinimalHeroId = null;
const navigation = functions.renderHeroIndexSearch({
  heroes: index.heroes, detailHeroIds, minimalDetailHeroIds, input, clearButton, count, emptyState, container,
  showDetailTarget(heroId) { shownHeroId = heroId; const target = elements.get(`hero-${heroId}`); if (target) target.hidden = false; },
  showMinimalDetailTarget(heroId) { shownMinimalHeroId = heroId; },
});

assert.equal(container.children.length, 267, 'all approved Index entries render');
assert.equal(count.textContent, '검색 결과 267명 / 전체 267명');
assert.equal(emptyState.hidden, true);
assert.equal(new Set(container.children.map(({ id }) => id)).size, 267, 'Index DOM IDs are unique');
assert.ok(container.children.every(({ id }) => !elements.has(id)), 'Index DOM IDs do not collide with Hero detail IDs');
assert.equal(container.children.filter(({ children }) => children[0]?.className === 'hero-index-detail-link').length, 29,
  'only 29 existing detail endpoints render links');
assert.equal(container.children.filter(({ children }) => children[0]?.className === 'hero-index-minimal-detail-link').length, 37,
  'only the thirty-seven approved Heroes receive Minimal Detail links');
assert.equal(container.children.filter(({ children }) => children[0]?.tagName !== 'a').length, 201,
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
const noDetailRow = container.children.find(({ id }) => {
  const heroId = Number(id.slice('hero-index-entry-'.length));
  return !detailHeroIds.has(heroId) && !minimalDetailHeroIds.has(heroId);
});
assert.ok(noDetailRow);
assert.ok(noDetailRow.children.every(({ tagName }) => tagName !== 'a'), 'no-detail Hero has no anchor or Fragment');
const indexOnlyHeroId = Number(noDetailRow.id.slice('hero-index-entry-'.length));
input.value = 'no-match'; input.listeners.input();
assert.equal(container.children.length, 0, 'fixture must begin from an empty Index result');
assert.equal(navigation.showTarget(indexOnlyHeroId), true, 'cross-surface navigation must resolve an approved Index-only Hero');
assert.equal(input.value, '', 'cross-surface navigation clears the independent Index filter');
assert.ok(container.children.some(({ id }) => id === `hero-index-entry-${indexOnlyHeroId}`), 'exact Index target is rendered after a filtered result');
assert.equal(navigation.showTarget(999999), false, 'unknown Hero Index target is rejected');
const minimalRow = container.children.find(({ id }) => id === 'hero-index-entry-15');
assert.equal(minimalRow.children[0].href, '#hero-minimal-detail-15');
minimalRow.children[0].listeners.click({ preventDefault() {} });
assert.equal(shownMinimalHeroId, 15, 'Hero 15 Index link delegates to only the approved Minimal Detail endpoint');
const hero16MinimalRow = container.children.find(({ id }) => id === 'hero-index-entry-16');
assert.equal(hero16MinimalRow.children[0].href, '#hero-minimal-detail-16');
hero16MinimalRow.children[0].listeners.click({ preventDefault() {} });
assert.equal(shownMinimalHeroId, 16, 'Hero 16 Index link delegates to its separately approved Minimal Detail endpoint');
for (const heroId of [...batchHeroIds, ...tenBatchHeroIds]) {
  const row = container.children.find(({ id }) => id === `hero-index-entry-${heroId}`);
  assert.equal(row.children[0].href, `#hero-minimal-detail-${heroId}`);
  row.children[0].listeners.click({ preventDefault() {} });
  assert.equal(shownMinimalHeroId, heroId, `Hero ${heroId} Index link delegates to its approved batch Minimal Detail endpoint`);
}
for (const heroId of twentyBatchHeroIds) {
  const row = container.children.find(({ id }) => id === `hero-index-entry-${heroId}`);
  assert.equal(row.children[0].href, `#hero-minimal-detail-${heroId}`);
  row.children[0].listeners.click({ preventDefault() {} });
  assert.equal(shownMinimalHeroId, heroId, `Hero ${heroId} Index link delegates to its approved Minimal Detail endpoint`);
}


assert.notEqual('hero-index-search', 'hero-search');
assert.notEqual('hero-index-results', 'heroes');
assert.match(html, /id="hero-index-search"/);
assert.match(html, /id="hero-search"/);
assert.match(html, /id="hero-minimal-detail-15"/);
assert.match(html, /id="hero-minimal-detail-16"/);
for (const heroId of [...batchHeroIds, ...tenBatchHeroIds, ...twentyBatchHeroIds]) assert.match(html, new RegExp(`id="hero-minimal-detail-${heroId}"`));
process.stdout.write('Hero Index Frontend regression: PASS (exact ID/name search, empty/reset, independent state, 267 rows, 29 Full Detail links, 37 minimal links, 201 unlinked rows)\n');

const moduleSource = (await readFile('app.js', 'utf8')).replace(/^import .*;\n/m, '');
const appElements = new Map();
const moduleErrors = [];
const appDocument = {
  baseURI: `file://${process.cwd()}/index.html`,
  querySelector(selector) {
    if (!appElements.has(selector)) appElements.set(selector, makeElement('div', selector.slice(1)));
    return appElements.get(selector);
  },
  createElement: (tagName) => makeElement(tagName),
  createTextNode(text) { return { tagName: '#text', textContent: text }; },
  getElementById(id) {
    if (id === 'hero-minimal-detail-15' && !appElements.has('#hero-minimal-detail-15')) {
      appElements.set('#hero-minimal-detail-15', makeElement('section', id));
    }
    if (id === 'hero-minimal-detail-16' && !appElements.has('#hero-minimal-detail-16')) {
      appElements.set('#hero-minimal-detail-16', makeElement('section', id));
    }
    if ([17, 18, 20, 21, 30, 31, 34, 35, 36, 38, 39, 49, 51, 54, 57, ...twentyBatchHeroIds].includes(Number(id.match(/^hero-minimal-detail-(\d+)$/)?.[1])) && !appElements.has(`#${id}`)) appElements.set(`#${id}`, makeElement('section', id));
    const visit = (node) => {
      if (node.id === id) return node;
      for (const child of node.children ?? []) {
        const match = visit(child);
        if (match) return match;
      }
      return null;
    };
    for (const root of appElements.values()) {
      const match = visit(root);
      if (match) return match;
    }
    return null;
  },
};
const appFetch = async (url) => {
  const path = resolve(url.replace(/^\.\//, ''));
  const data = JSON.parse(await readFile(path, 'utf8'));
  return { ok: true, status: 200, async json() { return data; } };
};
const initializedApp = await runInNewContext(`(async () => {
  "use strict";
  ${moduleSource}
  return { heroNavigation, heroIndexDetailIds, hero15MinimalDetailNavigation, hero15MinimalDetailIds, hero16MinimalDetailNavigation, hero16MinimalDetailIds, heroMinimalDetailBatchNavigation, heroMinimalDetailBatchIds, heroMinimalDetailTenBatchNavigation, heroMinimalDetailTenBatchIds, heroMinimalDetailTwentyBatchNavigation, heroMinimalDetailTwentyBatchIds, heroBySoldierId, exclusiveEquipmentHeroById };
})()`, {
  document: appDocument,
  window,
  fetch: appFetch,
  console: { error(error) { moduleErrors.push(error); }, warn() {}, log() {} },
  selectSkinFullarts() { return []; },
  Map, Set, URL, URLSearchParams, AbortController, Request, Response, Headers,
}, { timeout: 10000 });
assert.equal(initializedApp.heroIndexDetailIds.size, 29, 'actual app initialization must retain the existing 29 Hero detail IDs');
assert.equal(appElements.get('#hero-index-results').children.length, 267,
  'actual app initialization must render all 267 Hero Index rows');
assert.equal(appElements.get('#hero-index-results').children.filter(({ children }) => children[0]?.className === 'hero-index-detail-link').length, 29,
  'actual app initialization must retain exactly 29 Full Detail links');
assert.equal(appElements.get('#hero-index-results').children.filter(({ children }) => children[0]?.className === 'hero-index-minimal-detail-link').length, 37,
  'actual app initialization must render exactly thirty-seven approved Minimal Detail links');
assert.equal(appElements.get('#hero-index-results').children.filter(({ children }) => children[0]?.tagName !== 'a').length, 201,
  'actual app initialization must retain unlinked rows');
assert.equal(initializedApp.hero15MinimalDetailIds.size, 1);
assert.equal(initializedApp.hero15MinimalDetailNavigation.showTarget(15), true);
assert.equal(initializedApp.hero15MinimalDetailNavigation.showTarget(16), false);
assert.equal(appElements.get('#hero-minimal-detail-15-content').children[0].children[0].textContent, '리아나');
assert.equal(initializedApp.hero16MinimalDetailIds.size, 1);
assert.equal(initializedApp.hero16MinimalDetailNavigation.showTarget(16), true);
assert.equal(initializedApp.hero16MinimalDetailNavigation.showTarget(15), false);
assert.equal(appElements.get('#hero-minimal-detail-16-content').children[0].children[0].textContent, '란스');
assert.deepEqual(Array.from(initializedApp.heroMinimalDetailBatchIds), [17, 18, 20, 21, 30]);
for (const [heroId, expectedName] of [[17, '에그베르트'], [18, '이멜다'], [20, '소니아'], [21, '발가스'], [30, '리파니']]) {
  assert.equal(initializedApp.heroMinimalDetailBatchNavigation.get(heroId).showTarget(heroId), true);
  assert.equal(initializedApp.heroMinimalDetailBatchNavigation.get(heroId).showTarget(999), false);
  assert.equal(appElements.get(`#hero-minimal-detail-${heroId}-content`).children[0].children[0].textContent, expectedName);
}

assert.deepEqual(Array.from(initializedApp.heroMinimalDetailTenBatchIds), [31,34,35,36,38,39,49,51,54,57]);
for (const [heroId, expectedName] of [[31,'소피아'],[34,'키리카제'],[35,'안젤리카'],[36,'실버울프'],[38,'제리올&레이라'],[39,'페라키아'],[49,'파나'],[51,'셀파닐'],[54,'리스틸'],[57,'윌러']]) {
  assert.equal(initializedApp.heroMinimalDetailTenBatchNavigation.get(heroId).showTarget(heroId), true);
  assert.equal(appElements.get(`#hero-minimal-detail-${heroId}-content`).children[0].children[0].textContent, expectedName);
}
assert.deepEqual(Array.from(initializedApp.heroMinimalDetailTwentyBatchIds), twentyBatchHeroIds);
for (const [heroId, expectedName] of [[58,'세레나'],[59,'기자로프'],[61,'람다'],[62,'알프레드'],[63,'레인폴스'],[64,'브렌다'],[65,'비라쥬'],[66,'클라렛'],[87,'베티'],[88,'엘라스타'],[91,'에밀리아'],[92,'환생 제시카'],[93,'미지의 기사'],[94,'아카야'],[95,'올리버'],[96,'멜파니'],[97,'일루시아'],[98,'빈센트'],[99,'클로테르'],[100,'로젠실']]) {
  assert.equal(initializedApp.heroMinimalDetailTwentyBatchNavigation.get(heroId).showTarget(heroId), true);
  assert.equal(initializedApp.heroMinimalDetailTwentyBatchNavigation.get(heroId).showTarget(999), false);
  assert.equal(appElements.get(`#hero-minimal-detail-${heroId}-content`).children[0].children[0].textContent, expectedName);
}
assert.equal(initializedApp.exclusiveEquipmentHeroById.size, 167, 'actual app initialization must retain every approved Equipment owner relation');
assert.deepEqual(JSON.parse(JSON.stringify(initializedApp.exclusiveEquipmentHeroById.get(418).navigationTarget)),
  { surface: 'HERO_MINIMAL_DETAIL', fragment: 'hero-minimal-detail-16' }, 'Equipment 418 must resolve only to Hero 16 minimal detail');
assert.deepEqual(JSON.parse(JSON.stringify(initializedApp.exclusiveEquipmentHeroById.get(535).navigationTarget)),
  { surface: 'HERO_MINIMAL_DETAIL', fragment: 'hero-minimal-detail-15' }, 'Hero 15 Equipment target must remain unchanged');
assert.deepEqual(moduleErrors.map((error) => error.message), [], 'actual app initialization must not log runtime errors');
const appIndexInput = appElements.get('#hero-index-search');
appIndexInput.value = '999999';
appIndexInput.listeners.input();
assert.equal(appElements.get('#hero-index-results').children.length, 0, 'actual app index search must render empty results');
appElements.get('#hero-index-search-clear').listeners.click();
assert.equal(appElements.get('#hero-index-results').children.length, 267, 'actual app index reset must restore all rows');
process.stdout.write('Hero Index app-module initialization regression: PASS (strict mode, 267 rows, 29 Full Detail links, 37 Minimal Detail links, 201 unlinked rows, search and reset)\n');
