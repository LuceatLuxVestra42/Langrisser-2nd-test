import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { extractFunction } from './test-app-function-source.mjs';

const [source, generated, localization] = await Promise.all([
  readFile('app.js', 'utf8'),
  readFile('generated/hero-slice.v1.json', 'utf8').then(JSON.parse),
  readFile('canonical/hero-talent-localizations-ko.v1.json', 'utf8').then(JSON.parse),
]);
const expected = new Map([[6, ['전설의 기사', [3067, 3072, 3077, 3082]]], [8, ['마력 강화', [3196, 3197, 3198, 3199]]]]);
for (const hero of generated.heroes) {
  if (!expected.has(hero.id)) {
    assert.equal(hero.talent, undefined, `Hero ${hero.id} must not gain Talent fields`);
    continue;
  }
  const [nameKo, skillIds] = expected.get(hero.id);
  assert.equal(hero.talent.nameKo, nameKo);
  assert.deepEqual(hero.talent.starDescriptions.map(({ star }) => star), [3, 4, 5, 6]);
  assert.deepEqual(hero.talent.starDescriptions.map(({ skillId }) => skillId), skillIds);
  assert.deepEqual(hero.talent.starDescriptions.map(({ descriptionKoRaw }) => descriptionKoRaw),
    localization.descriptionRecords.filter(({ heroId }) => heroId === hero.id).map(({ descriptionKoRaw }) => descriptionKoRaw));
}
assert.equal(generated.heroes.filter(({ talent }) => talent).length, 2);
assert.match(source, /if \(hero\.talent\) article\.append\(makeTalentPresentation\(hero\.id, hero\.talent\)\)/);
assert.match(source, /Talent · 프로젝트 검수 한국어 \(공식 표기 미확인\)/);

const makeElement = (tagName = '#text') => ({
  tagName, children: [], className: '', textContent: '', attributes: {},
  append(...children) { this.children.push(...children); },
  setAttribute(key, value) { this.attributes[key] = value; },
});
const document = {
  createElement: (tag) => makeElement(tag),
  createTextNode: (text) => Object.assign(makeElement(), { textContent: text }),
};
const runtime = [extractFunction(source, 'makeTalentDescription'), extractFunction(source, 'makeTalentPresentation')].join('\n');
const functions = runInNewContext(`(() => { ${runtime}; return { makeTalentDescription, makeTalentPresentation }; })()`, { document, JSON, Number, Error });
for (const hero of generated.heroes.filter(({ talent }) => talent)) {
  const section = functions.makeTalentPresentation(hero.id, hero.talent);
  assert.equal(section.className, 'hero-talent');
  assert.equal(section.children[0].textContent, 'Talent · 프로젝트 검수 한국어 (공식 표기 미확인)');
  assert.equal(section.children[1].textContent, hero.talent.nameKo);
  assert.deepEqual(section.children[2].children.map(({ children }) => children[0].textContent), ['3성', '4성', '5성', '6성']);
  const raw = hero.talent.starDescriptions[0].descriptionKoRaw;
  const paragraph = functions.makeTalentDescription(raw, 3);
  assert.equal(paragraph.className, 'talent-description');
  assert.ok(paragraph.children.some((child) => child.className === 'talent-emphasis'));
  assert.ok(!source.includes('innerHTML'));
}
const unsafe = functions.makeTalentDescription('<img src=x onerror=alert(1)>', 3);
assert.equal(unsafe.textContent, '<img src=x onerror=alert(1)>');
assert.equal(unsafe.children.length, 0, 'unsupported markup is rendered as text, never HTML');
assert.throws(() => functions.makeTalentDescription(' ', 3), /missing/);
assert.throws(() => functions.makeTalentPresentation(6, { nameKo: 'x', starDescriptions: [] }), /malformed/);
console.log('Hero Talent presentation checks passed');
