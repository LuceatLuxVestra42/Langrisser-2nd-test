import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { extractFunction } from './test-app-function-source.mjs';
import { runInNewContext } from 'node:vm';

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const [frontend, html, normalData, spData, heroData, heroSoldierData] = await Promise.all([
  readFile('app.js', 'utf8'),
  readFile('index.html', 'utf8'),
  readJson('generated/normal-soldiers.v1.json'),
  readJson('generated/sp-soldiers.v1.json'),
  readJson('generated/hero-slice.v1.json'),
  readJson('generated/hero-soldier-relations.v1.json'),
]);


const makeElement = (tagName = 'div') => ({
  tagName, children: [], listeners: {}, id: '', className: '', href: '', textContent: '', value: '',
  append(...children) { this.children.push(...children); },
  replaceChildren(...children) { this.children = [...children]; },
  addEventListener(type, listener) { this.listeners[type] = listener; },
  setAttribute() {},
  focus() { this.focused = true; },
  scrollIntoView() { this.scrolled = true; },
});

const roots = [makeElement('heroes'), makeElement('sp-soldiers'), makeElement('normal-soldiers')];
const [heroContainer, spSoldierContainer, normalSoldierContainer] = roots;
const findById = (id, node) => {
  if (node.id === id) return node;
  for (const child of node.children) {
    const found = findById(id, child);
    if (found) return found;
  }
  return null;
};
const findByClass = (className, node) => {
  if (node.className === className) return node;
  for (const child of node.children) {
    const found = findByClass(className, child);
    if (found) return found;
  }
  return null;
};
const document = {
  baseURI: 'https://example.invalid/',
  createElement: (tagName) => makeElement(tagName),
  getElementById: (id) => roots.map((root) => findById(id, root)).find(Boolean) ?? null,
  querySelector: () => null,
};
const pendingFrames = [];
const sandbox = {
  document,
  window: { location: { hash: '' }, requestAnimationFrame(callback) { pendingFrames.push(callback); } },
  URL,
  container: heroContainer,
  spSoldierContainer,
  normalSoldierContainer,
  exclusiveEquipmentHeroById: new Map(),
  exclusiveEquipmentNavigation: { showAll() {} },
  heroBySoldierId: new Map(),
  spSoldiersByNormalId: new Map(),
};

const runtime = [
  extractFunction(frontend, 'makeHeroRarityLabel'),
  extractFunction(frontend, 'makeFactionPresentation'),
  extractFunction(frontend, 'makeAnchor'),
  extractFunction(frontend, 'addHero'),
  extractFunction(frontend, 'filterSoldiers'),
  extractFunction(frontend, 'renderSoldierSearch'),
  extractFunction(frontend, 'addSpSoldier'),
  extractFunction(frontend, 'makeSoldierHeroLinks'),
  extractFunction(frontend, 'addNormalSoldier'),
].join('\n');
const functions = runInNewContext(`(() => {
  let normalSoldierNavigation = null;
  let spSoldierNavigation = null;
  ${runtime}
  function startNormalSearch(input, clearButton, count) {
    normalSoldierNavigation = renderSoldierSearch({
      soldiers: normalData.soldiers, idField: 'normalSoldierId', input, clearButton, count,
      container: normalSoldierContainer, renderCard: addNormalSoldier, label: '일반 용병',
    });
    return normalSoldierNavigation;
  }
  function startSpSearch(input, clearButton, count) {
    spSoldierNavigation = renderSoldierSearch({
      soldiers: spData.soldiers, idField: 'spSoldierId', input, clearButton, count,
      container: spSoldierContainer, renderCard: addSpSoldier, label: 'SP 용병',
    });
    return spSoldierNavigation;
  }
  return { addHero, addNormalSoldier, addSpSoldier, startNormalSearch, startSpSearch,
    setSoldierRelations(map) { spSoldiersByNormalId = map; },
    setHeroRelations(map) { heroBySoldierId = map; } };
})()`, {
  ...sandbox,
  normalData,
  spData,
});

assert.match(html, /id="normal-soldier-search"/);
assert.match(html, /id="sp-soldier-search"/);
assert.match(html, /id="normal-soldier-clear"/);
assert.match(html, /id="sp-soldier-clear"/);
assert.match(html, /id="normal-soldier-count"[^>]*aria-live="polite"/);
assert.match(html, /id="sp-soldier-count"[^>]*aria-live="polite"/);

const normalInput = makeElement('input');
const normalClear = makeElement('button');
const normalCount = makeElement('p');
const spInput = makeElement('input');
const spClear = makeElement('button');
const spCount = makeElement('p');
const normalSnapshot = JSON.stringify(normalData.soldiers);
const spSnapshot = JSON.stringify(spData.soldiers);
functions.startNormalSearch(normalInput, normalClear, normalCount);
functions.startSpSearch(spInput, spClear, spCount);

const idsIn = (container, prefix) => container.children.filter((card) => card.id.startsWith(prefix)).map((card) => card.id);
const independentExpected = (records, idField, query) => {
  const term = query.trim();
  if (!term) return records;
  if (/^\d+$/.test(term)) return records.filter((record) => `${record[idField]}` === term);
  if (/^(?:\d|[+-]\d)/.test(term)) return [];
  const needle = term.toLocaleLowerCase('ko-KR');
  return records.filter((record) => record.nameKo.toLocaleLowerCase('ko-KR').includes(needle));
};
const input = (control, value) => { control.value = value; control.listeners.input({ target: control }); };
const verifySearch = ({ records, idField, prefix, control, clear, count, container, label }) => {
  const verify = (query) => {
    input(control, query);
    const expected = independentExpected(records, idField, query).map((record) => `${prefix}-${record[idField]}`).sort();
    assert.deepEqual(idsIn(container, `${prefix}-`).sort(), expected, `${label} result ID set for ${JSON.stringify(query)}`);
    const actualCount = idsIn(container, `${prefix}-`).length;
    assert.equal(count.textContent, `검색 결과 ${actualCount}건 / 전체 ${records.length}건`);
    assert.equal(actualCount, expected.length);
    assert.equal(container.children.some((child) => child.className === 'status'), expected.length === 0);
  };
  verify('');
  const record = records[0];
  verify(`  ${record[idField]}  `);
  verify(`0${record[idField]}`);
  verify(`${record[idField]}abc`);
  verify(`+${record[idField]}`);
  verify(`${record[idField]}.0`);
  verify(`${String(record[idField])[0]}.${String(record[idField]).slice(1)}e2`);
  const namePrefix = Array.from(record.nameKo).slice(0, 1).join('');
  verify(namePrefix);
  verify('__no_matching_soldier__');
  clear.listeners.click();
  assert.equal(control.value, '');
  assert.equal(idsIn(container, `${prefix}-`).length, records.length);
  assert.equal(count.textContent, `검색 결과 ${records.length}건 / 전체 ${records.length}건`);
};

assert.equal(normalData.soldiers.length, 56);
assert.equal(spData.soldiers.length, 56);
assert.equal(new Set(normalData.soldiers.map((record) => record.normalSoldierId)).size, normalData.soldiers.length);
assert.equal(new Set(spData.soldiers.map((record) => record.spSoldierId)).size, spData.soldiers.length);
assert.equal(normalData.soldiers.some((normal) => spData.soldiers.some((sp) => sp.spSoldierId === normal.normalSoldierId)), false,
  'NORMAL and SP ID namespaces remain disjoint');
verifySearch({ records: normalData.soldiers, idField: 'normalSoldierId', prefix: 'normal-soldier', control: normalInput,
  clear: normalClear, count: normalCount, container: normalSoldierContainer, label: 'NORMAL' });
verifySearch({ records: spData.soldiers, idField: 'spSoldierId', prefix: 'sp-soldier', control: spInput,
  clear: spClear, count: spCount, container: spSoldierContainer, label: 'SP' });

input(normalInput, String(normalData.soldiers[0].normalSoldierId));
const normalState = { query: normalInput.value, count: normalCount.textContent, ids: idsIn(normalSoldierContainer, 'normal-soldier-') };
input(spInput, String(spData.soldiers[0].spSoldierId));
assert.deepEqual({ query: normalInput.value, count: normalCount.textContent, ids: idsIn(normalSoldierContainer, 'normal-soldier-') }, normalState,
  'SP search must not modify NORMAL search state');
input(normalInput, '__no_matching_soldier__');
const spState = { query: spInput.value, count: spCount.textContent, ids: idsIn(spSoldierContainer, 'sp-soldier-') };
input(spInput, '__no_matching_soldier__');
assert.deepEqual({ query: spInput.value, count: spCount.textContent, ids: idsIn(spSoldierContainer, 'sp-soldier-') },
  { query: '__no_matching_soldier__', count: '검색 결과 0건 / 전체 56건', ids: [] });
assert.equal(normalInput.value, '__no_matching_soldier__');
assert.equal(spState.count, '검색 결과 1건 / 전체 56건');

const spByNormal = new Map();
for (const soldier of spData.soldiers) {
  const links = spByNormal.get(soldier.normalSoldierId) ?? [];
  links.push({ spSoldierId: soldier.spSoldierId, nameKo: soldier.nameKo });
  spByNormal.set(soldier.normalSoldierId, links);
}
functions.setSoldierRelations(spByNormal);
const heroRelation = heroSoldierData.relations.find((relation) => normalData.soldiers.some((soldier) => soldier.normalSoldierId === relation.soldierId)
  || spData.soldiers.some((soldier) => soldier.spSoldierId === relation.soldierId));
assert.ok(heroRelation, 'an approved Hero–Soldier endpoint is available for filtered-navigation coverage');
const hero = heroData.heroes.find((record) => record.id === heroRelation.heroId);
assert.ok(hero);
const soldierEndpoint = normalData.soldiers.find((record) => record.normalSoldierId === heroRelation.soldierId)
  ? { ...normalData.soldiers.find((record) => record.normalSoldierId === heroRelation.soldierId), namespace: 'NORMAL',
    domId: `normal-soldier-${heroRelation.soldierId}` }
  : { ...spData.soldiers.find((record) => record.spSoldierId === heroRelation.soldierId), namespace: 'SP',
    domId: `sp-soldier-${heroRelation.soldierId}` };

const clickAndDrain = (link) => {
  assert.ok(link?.listeners.click, 'a real rendered Anchor click listener exists');
  link.listeners.click({ preventDefault() {} });
  let guard = 0;
  while (pendingFrames.length && guard++ < 500) pendingFrames.shift()();
  assert.ok(guard < 500, 'navigation animation frames finish');
};

input(normalInput, '__target_hidden__');
input(spInput, Array.from(spData.soldiers[0].nameKo).slice(0, 1).join(''));
const spSource = findById(`sp-soldier-${spData.soldiers[0].spSoldierId}`, spSoldierContainer);
const normalLink = findByClass('normal-soldier-navigation-link', spSource);
const preservedSpQuery = spInput.value;
clickAndDrain(normalLink);
const normalTargetId = `normal-soldier-${spData.soldiers[0].normalSoldierId}`;
assert.ok(document.getElementById(normalTargetId)?.scrolled, 'SP→NORMAL restores a filtered NORMAL target and scrolls to it');
assert.equal(normalInput.value, '', 'only the target namespace search is reset');
assert.equal(spInput.value, preservedSpQuery, 'the unrelated SP search remains unchanged');
assert.equal(idsIn(normalSoldierContainer, 'normal-soldier-').length, normalData.soldiers.length);

const linkedPair = spData.soldiers[0];
input(spInput, '__target_hidden__');
input(normalInput, String(linkedPair.normalSoldierId));
const normalSource = findById(`normal-soldier-${linkedPair.normalSoldierId}`, normalSoldierContainer);
const spLink = findByClass('sp-soldier-navigation-link', normalSource);
clickAndDrain(spLink);
assert.ok(document.getElementById(`sp-soldier-${linkedPair.spSoldierId}`)?.scrolled,
  'NORMAL→SP restores a filtered SP target and scrolls to it');
assert.equal(spInput.value, '');
assert.equal(normalInput.value, String(linkedPair.normalSoldierId));

const heroRelationNamespace = soldierEndpoint.namespace === 'NORMAL' ? normalInput : spInput;
input(heroRelationNamespace, '__hero_target_hidden__');
const soldiersById = new Map([
  ...normalData.soldiers.map((record) => [record.normalSoldierId, { namespace: 'NORMAL', nameKo: record.nameKo, domId: `normal-soldier-${record.normalSoldierId}` }]),
  ...spData.soldiers.map((record) => [record.spSoldierId, { namespace: 'SP', nameKo: record.nameKo, domId: `sp-soldier-${record.spSoldierId}` }]),
]);
functions.setHeroRelations(new Map([[heroRelation.soldierId, [hero.id]]]));
functions.addHero(hero, new Map([[hero.id, [heroRelation.soldierId]]]), soldiersById);
const heroCard = findById(`hero-${hero.id}`, heroContainer);
clickAndDrain(findByClass('soldier-navigation-link', heroCard));
assert.ok(document.getElementById(soldierEndpoint.domId)?.scrolled, 'Hero→Soldier restores a filtered target and scrolls to it');
assert.equal(heroRelationNamespace.value, '', 'Hero navigation resets only the target Soldier namespace');

const soldierCard = soldierEndpoint.namespace === 'NORMAL'
  ? findById(soldierEndpoint.domId, normalSoldierContainer)
  : findById(soldierEndpoint.domId, spSoldierContainer);
clickAndDrain(findByClass('soldier-hero-links', soldierCard)?.children[1]?.children[0]?.children[0]);
assert.ok(document.getElementById(`hero-${hero.id}`)?.scrolled, 'Soldier→Hero remains available from filtered Soldier presentation');

assert.equal(JSON.stringify(normalData.soldiers), normalSnapshot, 'NORMAL Generated records remain unchanged');
assert.equal(JSON.stringify(spData.soldiers), spSnapshot, 'SP Generated records remain unchanged');
process.stdout.write('Soldier search Presentation Regression: PASS (independent ID sets, exact ID and name filtering, boundary input, reset, isolated state, filtered navigation targets, Consumer immutability)\n');
