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
/* function target(value) { return 8; } */
const documentation = "function target(value) { return 9; }";
const templateDocumentation = \`function target(value) { return 11; }\`;
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
assert.ok(heroData.heroes.every(({ rarity }) => Number.isSafeInteger(rarity?.rankId) && typeof rarity.label === 'string' && rarity.label.trim()));
assert.ok(heroData.heroes.every(({ factions }) => Array.isArray(factions) && factions.length > 0));
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
  extractFunction(frontend, 'makeHeroRarityLabel'),
  extractFunction(frontend, 'makeFactionPresentation'),
  extractFunction(frontend, 'makeOriginPresentation'),
  extractFunction(frontend, 'makeSpJobPresentation'),
  extractFunction(frontend, 'makeJobConnectionLabel'),
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
    filterHeroes, makeHeroRarityLabel, makeFactionPresentation, makeOriginPresentation, makeSpJobPresentation, makeJobConnectionLabel, makeAnchor, makeSoldierHeroLinks, addExclusiveEquipment,
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

for (const hero of heroData.heroes) {
  const label = functions.makeHeroRarityLabel(hero.rarity);
  assert.equal(label.className, 'hero-rarity');
  assert.equal(label.textContent, hero.rarity.label);
  assert.equal(label.attributes['aria-label'], `희귀도 ${hero.rarity.label}`);
}
assert.match(frontend, /metadata\.append\(id, makeHeroRarityLabel\(hero\.rarity\)\)/);
assert.match(html, /진영 한국어명과 출전작 프로젝트 검수 한국어명·중국어 원문/);
assert.match(html, /공식 한국 서버 표기는 확인되지 않았습니다/);
assert.match(frontend, /article\.append\(makeFactionPresentation\(hero\.factions\)\)/);
assert.match(frontend, /article\.append\(makeOriginPresentation\(hero\.origins\)\)/);
assert.match(frontend, /heading\.textContent = '진영 · 한국어명'/);
assert.match(frontend, /heading\.textContent = '출전작 · 프로젝트 검수 한국어명'/);
const expectedFactionIds = new Map([[1,[1,2]],[3,[2]],[4,[1,2,11]],[5,[1,2,6]],[6,[4,7]],[7,[4,5,11]],[8,[5,6]],[10,[1,2]],[11,[2,6,8]],[12,[1,2,4]],[13,[2,4]],[14,[2,6,8]],[25,[4,5,7]],[26,[3,6,7]],[27,[1,3,8]],[28,[5,8,11]],[32,[4,7]],[52,[6,8,9]],[53,[7,9]],[55,[1,9]],[60,[1,8,9]],[67,[5,8]]]);
const expectedFactionNames = new Map([[1, '시대의 주역'], [2, '빛의 군단'], [3, '빛의 기원'], [4, '제국의 빛'], [5, '어둠의 윤회'], [6, '공주 연맹'], [7, '전략의 대가'], [8, '메테오 스트라이크'], [9, '전설의 저편'], [11, '초월 영역']]);
assert.deepEqual(heroData.heroes.map(({ id }) => id), [...expectedFactionIds.keys()]);
for (const hero of heroData.heroes) {
  assert.deepEqual(hero.factions.map(({ factionId }) => factionId), expectedFactionIds.get(hero.id), `Faction IDs for Hero ${hero.id}`);
  for (const faction of hero.factions) {
    assert.ok(faction.nameCn);
    assert.equal(faction.nameKo, expectedFactionNames.get(faction.factionId));
    assert.equal(faction.localizationStatus, 'PROJECT_REVIEWED');
  }
  const section = functions.makeFactionPresentation(hero.factions);
  assert.equal(section.className, 'hero-factions');
  assert.equal(section.children[0].textContent, '진영 · 한국어명');
  assert.deepEqual(section.children[1].children.map(({ textContent }) => textContent), hero.factions.map((faction) => `${faction.nameKo} (${faction.nameCn})`));
}
const expectedSpJobsByHeroId = new Map([
  [6, [{
    jobId: 377,
    nameKo: '어둠의 청룡',
    classification: 'SP Job',
    localizationClassification: 'PROJECT_REVIEWED_LOCALIZATION',
    officialKrProvenanceStatus: 'UNVERIFIED',
  }]],
  [1, [{ jobId: 262, nameKo: '고독한 검객', classification: 'SP Job', localizationClassification: 'PROJECT_REVIEWED_LOCALIZATION', officialKrProvenanceStatus: 'UNVERIFIED' }]],
  [3, [{ jobId: 633, nameKo: '바람의 기사', classification: 'SP Job', localizationClassification: 'PROJECT_REVIEWED_LOCALIZATION', officialKrProvenanceStatus: 'UNVERIFIED' }]],
  [10, [{ jobId: 878, nameKo: '선택받은 왕', classification: 'SP Job', localizationClassification: 'PROJECT_REVIEWED_LOCALIZATION', officialKrProvenanceStatus: 'UNVERIFIED' }]],
  [25, [{ jobId: 414, nameKo: '천공의 마룡', classification: 'SP Job', localizationClassification: 'PROJECT_REVIEWED_LOCALIZATION', officialKrProvenanceStatus: 'UNVERIFIED' }]],
  [8, [{
    jobId: 864,
    nameKo: '단죄의 성녀',
    classification: 'SP Job',
    localizationClassification: 'PROJECT_REVIEWED_LOCALIZATION',
    officialKrProvenanceStatus: 'UNVERIFIED',
  }]],
]);
for (const hero of heroData.heroes) {
  assert.deepEqual(hero.spJobConnections, expectedSpJobsByHeroId.get(hero.id) ?? [], `SP Job presentation scope for Hero ${hero.id}`);
  assert.ok(!hero.jobConnections.some(({ jobId }) => [262, 377, 414, 633, 864, 878].includes(jobId)), `SP Job duplicated in ordinary connections for Hero ${hero.id}`);
}
assert.deepEqual(heroData.heroes.find(({ id }) => id === 6).jobConnections.map(({ jobId }) => jobId), [301, 303, 302, 202, 307, 306]);
assert.deepEqual(heroData.heroes.find(({ id }) => id === 8).jobConnections.map(({ jobId }) => jobId), [701, 805, 702, 703, 810, 706]);
for (const [heroId, expectedText] of [
  [6, 'SP Job · 어둠의 청룡 (전직 ID 377) · 프로젝트 검수 표시명 · 공식 KR 출처 미확인'],
  [8, 'SP Job · 단죄의 성녀 (전직 ID 864) · 프로젝트 검수 표시명 · 공식 KR 출처 미확인'],
]) {
  const spSection = functions.makeSpJobPresentation(heroData.heroes.find(({ id }) => id === heroId).spJobConnections);
  assert.equal(spSection.className, 'sp-job-presentation');
  assert.equal(spSection.children[0].children[0].textContent, expectedText);
}
assert.equal(functions.makeSpJobPresentation([]), null);
const hero53 = heroData.heroes.find(({ id }) => id === 53);
assert.deepEqual(hero53.jobConnections.map(({ jobId }) => jobId), [301, 202, 302, 403, 207, 304, 426]);
const classifiedConnections = hero53.jobConnections.filter(({ classification }) => classification === 'SP Job');
assert.deepEqual(classifiedConnections, [{
  connectionId: 536,
  jobId: 426,
  sourceField: 'JobConnection_ID',
  jobNameKo: '빛나는 지략가',
  classification: 'SP Job',
  localizationClassification: 'PROJECT_REVIEWED_LOCALIZATION',
  officialKrProvenanceStatus: 'UNVERIFIED',
}]);
assert.equal(hero53.spJobConnections.some(({ jobId }) => jobId === 426), false, 'Hero 53 SP Job is displayed only once in its existing ordinary connection');
assert.equal(functions.makeJobConnectionLabel(classifiedConnections[0]),
  'SP Job · 빛나는 지략가 (전직 ID 426) · 프로젝트 검수 표시명 · 공식 KR 출처 미확인');
assert.equal(functions.makeJobConnectionLabel(hero53.jobConnections[0]), '연결 530 → 나이트 (전직 ID 301)');
assert.deepEqual(heroData.heroes.filter(({ id }) => id !== 53).flatMap(({ jobConnections }) =>
  jobConnections.filter(({ classification }) => classification !== undefined)), [], 'SP classification stays within Hero 53:426');
assert.match(frontend, /item\.textContent = makeJobConnectionLabel\(relation\)/);
assert.match(frontend, /makeSpJobPresentation\(hero\.spJobConnections\)/);
assert.match(frontend, /article\.append\(spJobPresentation\)/);

const expectedOrigins = new Map([
  [1, [{ productionId: 3, nameCn: '梦幻模拟战手游I', nameKo: '랑그릿사 모바일 Ch.1', localizationStatus: 'PROJECT_REVIEWED' }]],
  [3, [{ productionId: 3, nameCn: '梦幻模拟战手游I', nameKo: '랑그릿사 모바일 Ch.1', localizationStatus: 'PROJECT_REVIEWED' }]],
  [4, [{ productionId: 3, nameCn: '梦幻模拟战手游I', nameKo: '랑그릿사 모바일 Ch.1', localizationStatus: 'PROJECT_REVIEWED' }]],
  [10, [{ productionId: 4, nameCn: '梦幻模拟战I', nameKo: '랑그릿사I', localizationStatus: 'PROJECT_REVIEWED' }]],
  [11, [{ productionId: 4, nameCn: '梦幻模拟战I', nameKo: '랑그릿사I', localizationStatus: 'PROJECT_REVIEWED' }]],
  [12, [{ productionId: 5, nameCn: '梦幻模拟战II', nameKo: '랑그릿사II', localizationStatus: 'PROJECT_REVIEWED' }]],
  [13, [{ productionId: 5, nameCn: '梦幻模拟战II', nameKo: '랑그릿사II', localizationStatus: 'PROJECT_REVIEWED' }]],
  [14, [{ productionId: 5, nameCn: '梦幻模拟战II', nameKo: '랑그릿사II', localizationStatus: 'PROJECT_REVIEWED' }]],
  [25, [{ productionId: 6, nameCn: '梦幻模拟战III', nameKo: '랑그릿사III', localizationStatus: 'PROJECT_REVIEWED' }]],
  [26, [{ productionId: 6, nameCn: '梦幻模拟战III', nameKo: '랑그릿사III', localizationStatus: 'PROJECT_REVIEWED' }]],
  [27, [{ productionId: 6, nameCn: '梦幻模拟战III', nameKo: '랑그릿사III', localizationStatus: 'PROJECT_REVIEWED' }]],
  [5, [{ productionId: 4, nameCn: '梦幻模拟战I', nameKo: '랑그릿사I', localizationStatus: 'PROJECT_REVIEWED' }]],
  [6, [{ productionId: 5, nameCn: '梦幻模拟战II', nameKo: '랑그릿사II', localizationStatus: 'PROJECT_REVIEWED' }]],
  [7, [{ productionId: 5, nameCn: '梦幻模拟战II', nameKo: '랑그릿사II', localizationStatus: 'PROJECT_REVIEWED' }]],
  [8, [{ productionId: 5, nameCn: '梦幻模拟战II', nameKo: '랑그릿사II', localizationStatus: 'PROJECT_REVIEWED' }]],
  [28, [{ productionId: 3, nameCn: '梦幻模拟战手游I', nameKo: '랑그릿사 모바일 Ch.1', localizationStatus: 'PROJECT_REVIEWED' }]],
  [32, [{ productionId: 6, nameCn: '梦幻模拟战III', nameKo: '랑그릿사III', localizationStatus: 'PROJECT_REVIEWED' }]],
  [52, [{ productionId: 7, nameCn: '梦幻模拟战IV', nameKo: '랑그릿사IV', localizationStatus: 'PROJECT_REVIEWED' }]],
  [53, [{ productionId: 7, nameCn: '梦幻模拟战IV', nameKo: '랑그릿사IV', localizationStatus: 'PROJECT_REVIEWED' }]],
  [55, [{ productionId: 7, nameCn: '梦幻模拟战IV', nameKo: '랑그릿사IV', localizationStatus: 'PROJECT_REVIEWED' }]],
  [60, [{ productionId: 8, nameCn: '梦幻模拟战V', nameKo: '랑그릿사V', localizationStatus: 'PROJECT_REVIEWED' }]],
  [67, [{ productionId: 8, nameCn: '梦幻模拟战V', nameKo: '랑그릿사V', localizationStatus: 'PROJECT_REVIEWED' }]],
]);
for (const hero of heroData.heroes) {
  assert.deepEqual(hero.origins, expectedOrigins.get(hero.id), `Production IDs and Chinese names for Hero ${hero.id}`);
  const section = functions.makeOriginPresentation(hero.origins);
  assert.equal(section.className, 'hero-origins');
  assert.equal(section.children[0].textContent, '출전작 · 프로젝트 검수 한국어명');
  assert.deepEqual(section.children[1].children.map(({ textContent }) => textContent), hero.origins.map(({ nameKo, nameCn }) => nameKo + ' (' + nameCn + ')'));
}

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
