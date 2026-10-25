import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { extractFunction } from './test-app-function-source.mjs';
import { runInNewContext } from 'node:vm';

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const [frontend, relationOwner, spData, normalData] = await Promise.all([
  readFile('app.js', 'utf8'),
  readJson('canonical/sp-soldier-normal-relations.v1.json'),
  readJson('generated/sp-soldiers.v1.json'),
  readJson('generated/normal-soldiers.v1.json'),
]);

assert.equal(relationOwner.schemaVersion, 1);
assert.equal(spData.schemaVersion, 1);
assert.equal(normalData.schemaVersion, 1);
assert.ok(Array.isArray(relationOwner.records));
assert.ok(Array.isArray(spData.soldiers));
assert.ok(Array.isArray(normalData.soldiers));

const pairKey = (spId, normalId) => `${spId}:${normalId}`;
const expectedPairs = relationOwner.records.map(({ spSoldierId, normalSoldierId }) => {
  assert.ok(Number.isInteger(spSoldierId) && Number.isInteger(normalSoldierId));
  return pairKey(spSoldierId, normalSoldierId);
});
assert.equal(new Set(expectedPairs).size, expectedPairs.length, 'Canonical relation pairs must be unique');

const normalById = new Map(normalData.soldiers.map((soldier) => [soldier.normalSoldierId, soldier]));
const spById = new Map(spData.soldiers.map((soldier) => [soldier.spSoldierId, soldier]));
assert.equal(normalById.size, normalData.soldiers.length, 'NORMAL Soldier IDs must be unique');
assert.equal(spById.size, spData.soldiers.length, 'SP Soldier IDs must be unique');
assert.equal([...normalById.keys()].some((id) => spById.has(id)), false, 'NORMAL and SP ID namespaces must remain disjoint');

const generatedPairs = spData.soldiers.map((soldier) => pairKey(soldier.spSoldierId, soldier.normalSoldierId));
assert.equal(new Set(generatedPairs).size, generatedPairs.length, 'Generated SP Soldier relation pairs must be unique');
assert.deepEqual([...generatedPairs].sort(), [...expectedPairs].sort(), 'Generated SP Soldier relation pairs must match the Canonical owner');
for (const soldier of spData.soldiers) {
  const normal = normalById.get(soldier.normalSoldierId);
  assert.ok(normal, `NORMAL endpoint ${soldier.normalSoldierId} must exist`);
  assert.equal(soldier.normalSoldierNameKo, normal.nameKo, `NORMAL display label must match ID ${soldier.normalSoldierId}`);
}

const makeElement = () => ({
  children: [], listeners: {}, textContent: '', className: '', id: '', href: '',
  append(...children) { this.children.push(...children); },
  addEventListener(type, listener) { this.listeners[type] = listener; },
  setAttribute() {},
  scrollIntoView() { this.scrolled = true; },
});
const elementsById = new Map();
const pendingFrames = [];
const sandbox = {
  document: {
    createElement: makeElement,
    createTextNode: (text) => Object.assign(makeElement(), { textContent: text, nodeType: 3 }),
    getElementById: (id) => elementsById.get(id) ?? null,
    querySelector: () => null,
  },
  window: {
    location: { hash: '' },
    requestAnimationFrame(callback) { pendingFrames.push(callback); },
  },
  heroBySoldierId: new Map(),
  spSoldiersByNormalId: new Map(),
  normalSoldierNavigation: null,
  spSoldierNavigation: null,
  spSoldierContainer: { append(card) { elementsById.set(card.id, card); } },
  normalSoldierContainer: { append(card) { elementsById.set(card.id, card); } },
};
const runtime = [
  extractFunction(frontend, 'indexSpSoldiersByNormalId'),
  extractFunction(frontend, 'makeAnchor'),
  extractFunction(frontend, 'appendSkillDescription'),
  extractFunction(frontend, 'makeSoldierSkillReferences'),
  extractFunction(frontend, 'makeSoldierHeroLinks'),
  extractFunction(frontend, 'addSpSoldier'),
  extractFunction(frontend, 'addNormalSoldier'),
].join('\n');
const functions = runInNewContext(`(() => { ${runtime}; return { addSpSoldier, addNormalSoldier, indexSpSoldiersByNormalId }; })()`, sandbox);

const cards = [];
for (const normal of normalData.soldiers) {
  const card = makeElement();
  card.id = `normal-soldier-${normal.normalSoldierId}`;
  elementsById.set(card.id, card);
}
for (const soldier of spData.soldiers) {
  const card = makeElement();
  cards.push(card);
  functions.addSpSoldier(soldier);
}

const reverseIndex = functions.indexSpSoldiersByNormalId(spData.soldiers);
sandbox.spSoldiersByNormalId = reverseIndex;
const expectedReversePairs = new Set(expectedPairs.map((pair) => {
  const [spId, normalId] = pair.split(':').map(Number);
  return `${normalId}:${spId}`;
}));
const actualReversePairs = new Set();
const reversePairOccurrences = new Map();
for (const normal of normalData.soldiers) {
  functions.addNormalSoldier(normal);
  const card = elementsById.get(`normal-soldier-${normal.normalSoldierId}`);
  assert.ok(card, `NORMAL card ${normal.normalSoldierId} must render`);
  const section = card.children.find((child) => child.className === 'normal-soldier-sp-links');
  const expectedSpIds = spData.soldiers
    .filter((soldier) => soldier.normalSoldierId === normal.normalSoldierId)
    .map((soldier) => soldier.spSoldierId);
  assert.equal(Boolean(section), expectedSpIds.length > 0, 'Only linked NORMAL cards render an SP section');
  const links = section?.children[1]?.children ?? [];
  assert.equal(links.length, expectedSpIds.length, 'Every linked SP endpoint is rendered');
  for (const item of links) {
    const link = item.children[0];
    const match = link.href.match(/^#sp-soldier-(\d+)$/);
    assert.ok(match, 'Reverse link must target an explicit SP Soldier endpoint');
    const spId = Number(match[1]);
    const key = `${normal.normalSoldierId}:${spId}`;
    actualReversePairs.add(key);
    reversePairOccurrences.set(key, (reversePairOccurrences.get(key) ?? 0) + 1);
    assert.equal(link.className, 'sp-soldier-navigation-link');
    assert.equal(link.textContent, `${spData.soldiers.find((soldier) => soldier.spSoldierId === spId).nameKo} (SP 용병 ID ${spId})`);
    assert.ok(elementsById.has(`sp-soldier-${spId}`), `SP target ${spId} must render`);
    link.listeners.click({ preventDefault() {} });
    while (pendingFrames.length) pendingFrames.shift()();
    assert.equal(elementsById.get(`sp-soldier-${spId}`).scrolled, true, 'Reverse link scrolls to exact SP target');
  }
}
assert.deepEqual([...actualReversePairs].sort(), [...expectedReversePairs].sort(), 'Reverse link pair set must match independently derived pairs');
assert.ok([...reversePairOccurrences.values()].every((count) => count === 1), 'Reverse link pairs must not duplicate');

const multiValue = functions.indexSpSoldiersByNormalId([
  { spSoldierId: 9001, normalSoldierId: 101, nameKo: 'fixture-a' },
  { spSoldierId: 9002, normalSoldierId: 101, nameKo: 'fixture-b' },
  { spSoldierId: 9002, normalSoldierId: 101, nameKo: 'fixture-b' },
]);
assert.deepEqual(JSON.parse(JSON.stringify(multiValue.get(101))), [
  { spSoldierId: 9001, nameKo: 'fixture-a' }, { spSoldierId: 9002, nameKo: 'fixture-b' },
], 'Multivalue reverse index preserves distinct SP endpoints and removes duplicate pair only');
sandbox.spSoldiersByNormalId = multiValue;
for (const spId of [9001, 9002]) elementsById.set(`sp-soldier-${spId}`, makeElement());
functions.addNormalSoldier({ normalSoldierId: 101, nameKo: 'fixture-normal', baseStats: { hp: 1, attack: 2, defense: 3, magicDefense: 4 } });
const fixtureNormal = elementsById.get('normal-soldier-101');
const fixtureLinks = fixtureNormal.children.find((child) => child.className === 'normal-soldier-sp-links').children[1].children;
assert.deepEqual(fixtureLinks.map((item) => item.children[0].href), ['#sp-soldier-9001', '#sp-soldier-9002'],
  'NORMAL card rendering preserves all distinct SP links in a multivalue relation');
sandbox.spSoldiersByNormalId = reverseIndex;
functions.addNormalSoldier({ normalSoldierId: 99999, nameKo: 'fixture-unlinked', baseStats: { hp: 1, attack: 2, defense: 3, magicDefense: 4 } });
assert.equal(elementsById.get('normal-soldier-99999').children.some((child) => child.className === 'normal-soldier-sp-links'), false,
  'NORMAL card without a validated SP pair renders no inferred link section');

for (const soldier of spData.soldiers) {
  const rendered = elementsById.get(`sp-soldier-${soldier.spSoldierId}`);
  assert.ok(rendered, `SP card ${soldier.spSoldierId} must render`);
  const normalDisplay = rendered.children.find((child) => child.className === 'normal-soldier-id');
  assert.ok(normalDisplay, `SP card ${soldier.spSoldierId} must preserve connected NORMAL display`);
  assert.equal(normalDisplay.children.length, 1, 'Connected NORMAL display remains one label/link');
  const link = normalDisplay.children[0];
  assert.equal(link.className, 'normal-soldier-navigation-link');
  assert.equal(link.textContent, `일반 용병 ID ${soldier.normalSoldierId} · ${soldier.normalSoldierNameKo}`);
  assert.equal(link.href, `#normal-soldier-${soldier.normalSoldierId}`);

  let prevented = false;
  link.listeners.click({ preventDefault() { prevented = true; } });
  assert.equal(prevented, false, 'Rendered NORMAL endpoint should use native anchor navigation');
  while (pendingFrames.length) pendingFrames.shift()();
  assert.equal(elementsById.get(`normal-soldier-${soldier.normalSoldierId}`).scrolled, true,
    'Click must scroll the exact NORMAL Soldier endpoint');
}

assert.equal(cards.length, spData.soldiers.length, 'SP Soldier population must remain unchanged');
assert.equal(spData.soldiers.length, expectedPairs.length, 'Each current relation pair should be represented once');

// Exercise the existing deferred-target path with a representative relation.
const deferredSoldier = spData.soldiers[0];
const deferredTargetId = `normal-soldier-${deferredSoldier.normalSoldierId}`;
const deferredTarget = elementsById.get(deferredTargetId);
elementsById.delete(deferredTargetId);
const deferredCard = makeElement();
functions.addSpSoldier(deferredSoldier);
const deferredLink = deferredCard.children.find((child) => child.className === 'normal-soldier-id')?.children[0]
  ?? [...elementsById.values()].find((element) => element.id === `sp-soldier-${deferredSoldier.spSoldierId}`)
    ?.children.find((child) => child.className === 'normal-soldier-id')?.children[0];
assert.ok(deferredLink, 'Deferred SP link should render');
let deferredPrevented = false;
deferredLink.listeners.click({ preventDefault() { deferredPrevented = true; } });
assert.equal(deferredPrevented, true, 'Missing NORMAL endpoint should defer native navigation');
elementsById.set(deferredTargetId, deferredTarget);
while (pendingFrames.length) pendingFrames.shift()();
assert.equal(sandbox.window.location.hash, deferredTargetId, 'Deferred navigation should set the exact target fragment');
assert.equal(deferredTarget.scrolled, true, 'Deferred navigation should scroll after the NORMAL endpoint renders');

process.stdout.write(`SP ↔ NORMAL Soldier navigation PASS (${expectedPairs.length} exact ID pairs; reverse multivalue indexing, endpoint parity, immediate and deferred navigation)\n`);
