import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const [frontend, heroData, relationData, normalData, spData] = await Promise.all([
  readFile('app.js', 'utf8'),
  readJson('generated/hero-slice.v1.json'),
  readJson('generated/hero-soldier-relations.v1.json'),
  readJson('generated/normal-soldiers.v1.json'),
  readJson('generated/sp-soldiers.v1.json'),
]);
assert.equal(heroData.heroes.length, 7);
assert.equal(normalData.soldiers.length, 56);
assert.equal(spData.soldiers.length, 56);

const normalIds = new Set(normalData.soldiers.map(({ normalSoldierId }) => normalSoldierId));
const spIds = new Set(spData.soldiers.map(({ spSoldierId }) => spSoldierId));
assert.equal([...normalIds].some((id) => spIds.has(id)), false, 'NORMAL and SP endpoint namespaces must remain disjoint');
const heroesBySoldier = new Map();
for (const { heroId, soldierId } of relationData.relations) {
  assert.ok(normalIds.has(soldierId) !== spIds.has(soldierId), `relation endpoint ${soldierId} must resolve to exactly one namespace`);
  const rows = heroesBySoldier.get(soldierId) ?? [];
  rows.push(heroId);
  heroesBySoldier.set(soldierId, rows);
}
const relationPair = (soldierId, heroId, namespace) => `${namespace}:${soldierId}:${heroId}`;
const expected = new Set(relationData.relations.map(({ soldierId, heroId }) => relationPair(
  soldierId, heroId, normalIds.has(soldierId) ? 'NORMAL' : 'SP',
)));

const makeElement = () => ({
  children: [], listeners: {}, textContent: '', className: '', id: '', href: '', attributes: {},
  append(...children) { this.children.push(...children); },
  addEventListener(type, listener) { this.listeners[type] = listener; },
  setAttribute(key, value) { this.attributes[key] = value; },
  scrollIntoView() { this.scrolled = true; },
});
const selectors = new Map();
const elementsById = new Map();
const sandbox = {
  heroBySoldierId: heroesBySoldier,
  document: {
    createElement: makeElement,
    getElementById: (id) => elementsById.get(id) ?? null,
    querySelector: (selector) => selectors.get(selector) ?? null,
  },
  window: { location: { hash: '' }, requestAnimationFrame(callback) { callback(); } },
  makeAnchor: null,
};
const extract = (name, startMarker, endMarker) => {
  const start = frontend.indexOf(startMarker);
  const end = frontend.indexOf(endMarker, start);
  assert.ok(start >= 0 && end > start, `${name} runtime boundaries must exist`);
  return frontend.slice(start, end + 2);
};
const runtime = [
  extract('anchor', 'function makeAnchor(', '\n}\n\nfunction addHero('),
  extract('NORMAL renderer', 'function addNormalSoldier(', '\n}\n\nfunction revealInitialHeroFragment('),
  extract('SP renderer', 'function addSpSoldier(', '\n}\n\ntry {\n  const response = await fetch(\'./generated/sp-soldiers.v1.json\')'),
  extract('fragment handler', 'function revealInitialHeroFragment(', '\n}\n\nfunction makeSoldierHeroLinks('),
  extract('Hero-link renderer', 'function makeSoldierHeroLinks(', '\n}\n\ntry {\n  const response = await fetch(\'./generated/normal-soldiers.v1.json\')'),
].join('\n');
const functions = runInNewContext(`(() => { ${runtime}; return { makeAnchor, addNormalSoldier, addSpSoldier, revealInitialHeroFragment, makeSoldierHeroLinks }; })()`, sandbox);

for (const { id } of heroData.heroes) {
  const target = makeElement(); target.id = `hero-${id}`; elementsById.set(target.id, target);
}

const renderedCards = [];
const normalContainer = { append(card) { renderedCards.push({ namespace: 'NORMAL', card }); elementsById.set(card.id, card); } };
const spContainer = { append(card) { renderedCards.push({ namespace: 'SP', card }); elementsById.set(card.id, card); } };
sandbox.normalSoldierContainer = normalContainer;
sandbox.spSoldierContainer = spContainer;
// The extracted card functions close over their vm context globals.
for (const soldier of normalData.soldiers) functions.addNormalSoldier(soldier);
for (const soldier of spData.soldiers) functions.addSpSoldier(soldier);

const actual = new Set();
const allDomIds = [...heroData.heroes.map(({ id }) => `hero-${id}`), ...renderedCards.map(({ card }) => card.id)];
assert.equal(new Set(allDomIds).size, allDomIds.length, 'Soldier and Hero DOM IDs must be unique');
for (const { namespace, card } of renderedCards) {
  const id = namespace === 'NORMAL' ? Number(card.id.slice('normal-soldier-'.length)) : Number(card.id.slice('sp-soldier-'.length));
  const rows = card.children.filter((child) => child.className === 'soldier-hero-links');
  const links = rows.flatMap((row) => row.children.at(-1).children.map((item) => item.children[0]));
  const expectedHeroIds = heroesBySoldier.get(id) ?? [];
  assert.equal(links.length, expectedHeroIds.length, `${namespace} ${id} connected Hero count`);
  assert.deepEqual(links.map((link) => link.href), expectedHeroIds.map((heroId) => `#hero-${heroId}`));
  for (const link of links) {
    const heroId = Number(link.href.slice('#hero-'.length));
    actual.add(relationPair(id, heroId, namespace));
    let prevented = false;
    link.listeners.click({ preventDefault() { prevented = true; } });
    assert.equal(prevented, false, 'rendered Hero endpoint should be available for navigation');
  }
}
assert.deepEqual([...actual].sort(), [...expected].sort(), 'exact namespace/soldierId/heroId pair set must match Generated relation pairs');
assert.equal(renderedCards.length, 112, 'NORMAL and SP card populations remain unchanged');

const sampleCard = renderedCards.find(({ card }) => card.children.some((child) => child.className === 'soldier-hero-links'))?.card;
assert.ok(sampleCard, 'at least one in-slice Soldier card should expose connected Hero navigation');
const sampleLink = sampleCard.children.find((child) => child.className === 'soldier-hero-links').children.at(-1).children[0].children[0];
sampleLink.listeners.click({ preventDefault() {} });
assert.equal(elementsById.get(sampleLink.href.slice(1)).scrolled, true, 'click should scroll the exact Hero endpoint into view');

sandbox.window.location.hash = '#hero-53';
functions.revealInitialHeroFragment();
assert.equal(elementsById.get('hero-53').scrolled, true, 'direct Hero fragment should resolve after Hero rendering');

process.stdout.write(`Soldier → Hero Presentation regression PASS (${expected.size} exact ${relationData.relations.length}-pair links; namespace parity, unique DOM IDs, click navigation, and direct Hero fragment)\n`);
