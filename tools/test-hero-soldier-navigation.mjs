import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { extractFunction } from './test-app-function-source.mjs';
import { runInNewContext } from 'node:vm';

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const [frontend, heroData, relationData, normalData, spData] = await Promise.all([
  readFile('app.js', 'utf8'),
  readJson('generated/hero-slice.v1.json'),
  readJson('generated/hero-soldier-relations.v1.json'),
  readJson('generated/normal-soldiers.v1.json'),
  readJson('generated/sp-soldiers.v1.json'),
]);

const normalById = new Map(normalData.soldiers.map((soldier) => [soldier.normalSoldierId, {
  namespace: 'NORMAL', nameKo: soldier.nameKo, domId: `normal-soldier-${soldier.normalSoldierId}`,
}]));
const spById = new Map(spData.soldiers.map((soldier) => [soldier.spSoldierId, {
  namespace: 'SP', nameKo: soldier.nameKo, domId: `sp-soldier-${soldier.spSoldierId}`,
}]));
assert.equal([...normalById.keys()].some((id) => spById.has(id)), false, 'NORMAL and SP endpoint IDs must be disjoint');

const generatedApprovedPairs = relationData.relations.map(({ heroId, soldierId }) => {
  const normal = normalById.get(soldierId);
  const sp = spById.get(soldierId);
  assert.equal(Number(Boolean(normal)) + Number(Boolean(sp)), 1, `Soldier endpoint ${soldierId} must resolve in exactly one namespace`);
  return { heroId, soldierId, namespace: normal ? 'NORMAL' : 'SP', domId: (normal ?? sp).domId };
});
assert.equal(new Set(generatedApprovedPairs.map(({ heroId, soldierId }) => `${heroId}:${soldierId}`)).size,
  generatedApprovedPairs.length, 'Generated relation pairs must be unique');

const makeElement = () => ({
  children: [], listeners: {}, attributes: {}, textContent: '', className: '', id: '', href: '',
  append(...children) { this.children.push(...children); },
  addEventListener(type, listener) { this.listeners[type] = listener; },
  setAttribute(key, value) { this.attributes[key] = value; },
  scrollIntoView() { this.scrolled = true; },
});
const elementsById = new Map();
const cards = [];
const animationFrames = [];
const sandbox = {
  URL,
  document: {
    baseURI: 'https://example.test/',
    createElement: makeElement,
    createTextNode: (text) => Object.assign(makeElement(), { textContent: text }),
    getElementById: (id) => elementsById.get(id) ?? null,
  },
  window: { location: { hash: '' }, requestAnimationFrame(callback) { animationFrames.push(callback); } },
  container: { append(card) { cards.push(card); elementsById.set(card.id, card); } },
  exclusiveEquipmentHeroById: new Map(),
  exclusiveEquipmentNavigation: null,
  normalSoldierNavigation: null,
  spSoldierNavigation: null,
};
const runtime = [
  extractFunction(frontend, 'makeSkinFullartPresentation'),
  extractFunction(frontend, 'makeHeroRarityLabel'),
  extractFunction(frontend, 'makeFactionPresentation'),
  extractFunction(frontend, 'makeOriginPresentation'),
  extractFunction(frontend, 'appendSkillDescription'),
  extractFunction(frontend, 'makeTalentDescription'),
  extractFunction(frontend, 'makeTalentPresentation'),
  extractFunction(frontend, 'makeSpJobPresentation'),
  extractFunction(frontend, 'makeJobConnectionLabel'),
  extractFunction(frontend, 'makeJobLevelSourceStatsPresentation'),
  extractFunction(frontend, 'makeAnchor'),
  extractFunction(frontend, 'addHero'),
].join('\n');
const functions = runInNewContext(`(() => { ${runtime}; return { makeAnchor, addHero }; })()`, sandbox);

const soldiersById = new Map([...normalById, ...spById]);
const relationsByHero = new Map();
for (const { heroId, soldierId } of generatedApprovedPairs) {
  const ids = relationsByHero.get(heroId) ?? [];
  ids.push(soldierId);
  relationsByHero.set(heroId, ids);
}
for (const hero of heroData.heroes) functions.addHero(hero, relationsByHero, soldiersById, new Map());

const actualPairs = [];
const flushAnimationFrames = () => {
  while (animationFrames.length) animationFrames.shift()();
};
let pairIndex = 0;
for (const card of cards) {
  const section = card.children.find((child) => child.className === 'hero-soldiers');
  const list = section?.children.find((child) => child.className === 'hero-soldier-list');
  for (const item of list?.children ?? []) {
    assert.equal(item.children.length, 1, 'each existing Soldier display entry should remain a single label/link');
    const link = item.children[0];
    const targetId = link.href.slice(1);
    const matched = generatedApprovedPairs.find((pair) => pair.heroId === Number(card.id.slice('hero-'.length)) && pair.domId === targetId);
    assert.ok(matched, `Hero ${card.id} link ${link.href} must target its explicit Generated Soldier endpoint`);
    assert.equal(link.textContent, soldiersById.get(matched.soldierId).nameKo, 'existing Korean Soldier label must be preserved');
    assert.equal(link.className, 'soldier-navigation-link');
    actualPairs.push(`${matched.namespace}:${matched.soldierId}:${matched.heroId}`);
    let target = null;
    if (pairIndex !== 0) {
      target = makeElement();
      target.id = targetId;
      elementsById.set(targetId, target);
    }
    let prevented = false;
    link.listeners.click({ preventDefault() { prevented = true; } });
    if (pairIndex === 0) {
      assert.equal(prevented, true, 'missing async Soldier endpoint should defer native navigation');
      target = makeElement();
      target.id = targetId;
      elementsById.set(targetId, target);
      flushAnimationFrames();
      assert.equal(target.scrolled, true, 'deferred navigation should scroll after Soldier rendering completes');
    } else {
      assert.equal(prevented, false, 'existing Soldier endpoint should permit native anchor navigation');
      flushAnimationFrames();
      assert.equal(target.scrolled, true, 'click should scroll the exact Soldier DOM endpoint');
    }
    pairIndex += 1;
  }
}

const expectedPairs = generatedApprovedPairs.map(({ namespace, soldierId, heroId }) => `${namespace}:${soldierId}:${heroId}`).sort();
assert.deepEqual(actualPairs.sort(), expectedPairs, 'Hero displayed Soldier pairs must equal Generated approved pairs');
assert.equal(cards.length, heroData.heroes.length, 'Hero presentation population must remain unchanged');
assert.equal(actualPairs.length, 379, 'all currently displayed Generated relation pairs must retain a link');
process.stdout.write(`Hero → Soldier navigation PASS (${actualPairs.length} exact namespace/soldierId/heroId pairs; labels, endpoints, and click target verified)\n`);
