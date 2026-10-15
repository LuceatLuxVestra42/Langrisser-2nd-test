import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
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
    getElementById: (id) => elementsById.get(id) ?? null,
    querySelector: () => null,
  },
  window: {
    location: { hash: '' },
    requestAnimationFrame(callback) { pendingFrames.push(callback); },
  },
  heroBySoldierId: new Map(),
  spSoldierContainer: { append(card) { elementsById.set(card.id, card); } },
};
const extract = (name, startMarker, endMarker) => {
  const start = frontend.indexOf(startMarker);
  const end = frontend.indexOf(endMarker, start);
  assert.ok(start >= 0 && end > start, `${name} runtime boundaries must exist`);
  return frontend.slice(start, end + 2);
};
const runtime = [
  extract('anchor helper', 'function makeAnchor(', '\n}\n\nfunction addHero('),
  extract('soldier Hero links', 'function makeSoldierHeroLinks(', '\n}\n\ntry {\n  const response = await fetch(\'./generated/normal-soldiers.v1.json\')'),
  extract('SP Soldier renderer', 'function addSpSoldier(', '\n}\n\ntry {\n  const response = await fetch(\'./generated/sp-soldiers.v1.json\')'),
].join('\n');
const functions = runInNewContext(`(() => { ${runtime}; return { addSpSoldier }; })()`, sandbox);

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

process.stdout.write(`SP → NORMAL Soldier navigation PASS (${expectedPairs.length} exact ID pairs; endpoint checks, unique namespaces, visible-label parity, immediate and deferred navigation)\n`);
