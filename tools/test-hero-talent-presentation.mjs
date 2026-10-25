import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { extractFunction } from './test-app-function-source.mjs';
import { resolveTalentSkillText } from './generate.mjs';

const [source, generated, localization, skills, talentRelations] = await Promise.all([
  readFile('app.js', 'utf8'),
  readFile('generated/hero-slice.v1.json', 'utf8').then(JSON.parse),
  readFile('canonical/hero-talent-localizations-ko.v1.json', 'utf8').then(JSON.parse),
  readFile('canonical/skills.v1.json', 'utf8').then(JSON.parse),
  readFile('canonical/hero-talent-star-skills.v1.json', 'utf8').then(JSON.parse),
]);
const skillById = new Map(skills.records.map((row) => [row.skillId, row]));
const projectedTalentSkills = resolveTalentSkillText(talentRelations, skills);
assert.equal(projectedTalentSkills.size, 8);
for (const relation of talentRelations.records) {
  const skill = skillById.get(relation.skillId);
  assert.deepEqual(projectedTalentSkills.get(`${relation.heroId}:${relation.star}`), {
    skillId: skill.skillId, nameCn: skill.nameCn, descriptionCn: skill.descriptionCn,
  });
}
const rejectTalentSkillProjection = (label, relationMutation, skillMutation) => {
  const relations = structuredClone(talentRelations);
  const skillOwner = structuredClone(skills);
  relationMutation?.(relations);
  skillMutation?.(skillOwner);
  assert.throws(() => resolveTalentSkillText(relations, skillOwner), undefined, label);
};
rejectTalentSkillProjection('missing Talent Skill relation rejected', (owner) => owner.records.pop());
rejectTalentSkillProjection('duplicate Talent Skill relation rejected', (owner) => owner.records.push(structuredClone(owner.records[0])));
rejectTalentSkillProjection('wrong Skill target rejected', (owner) => { owner.records[0].skillId = 999999; });
rejectTalentSkillProjection('out-of-scope Hero Talent endpoint rejected', (owner) => { owner.records[0].heroId = 9; });
rejectTalentSkillProjection('missing Skill endpoint rejected', null, (owner) => { owner.records = owner.records.filter((row) => row.skillId !== 3067); });
rejectTalentSkillProjection('duplicate Skill endpoint rejected', null, (owner) => { owner.records.push(structuredClone(owner.records.find((row) => row.skillId === 3067))); });
rejectTalentSkillProjection('missing source Name rejected', null, (owner) => { owner.records.find((row) => row.skillId === 3067).nameCn = ''; });
rejectTalentSkillProjection('missing source Desc rejected', null, (owner) => { owner.records.find((row) => row.skillId === 3067).descriptionCn = ''; });
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
  for (const row of hero.talent.starDescriptions) {
    const skill = skillById.get(row.skillId);
    assert.ok(skill, `Hero ${hero.id} Talent relation must resolve by exact Skill ID ${row.skillId}`);
    assert.equal(row.nameCn, skill.nameCn);
    assert.equal(row.descriptionCn, skill.descriptionCn);
  }
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
const runtime = [extractFunction(source, 'appendSkillDescription'), extractFunction(source, 'makeTalentDescription'), extractFunction(source, 'makeTalentPresentation')].join('\n');
const functions = runInNewContext(`(() => { ${runtime}; return { appendSkillDescription, makeTalentDescription, makeTalentPresentation }; })()`, { document, JSON, Number, Error });
for (const hero of generated.heroes.filter(({ talent }) => talent)) {
  const section = functions.makeTalentPresentation(hero.id, hero.talent);
  assert.equal(section.className, 'hero-talent');
  assert.equal(section.children[0].textContent, 'Talent · 프로젝트 검수 한국어 (공식 표기 미확인)');
  assert.equal(section.children[1].textContent, hero.talent.nameKo);
  assert.deepEqual(section.children[2].children.map(({ children }) => children[0].textContent), ['3성', '4성', '5성', '6성']);
  const sourceDetails = section.children[3];
  assert.equal(sourceDetails.className, 'talent-source-original');
  assert.equal(sourceDetails.children[0].textContent, '연결된 Talent Skill 중국어 원문 · ID 기준');
  assert.deepEqual(sourceDetails.children[1].children.map(({ children }) => children[0].textContent),
    hero.talent.starDescriptions.map((row) => `${row.star}성 · Skill ID ${row.skillId} · ${row.nameCn}`));
  const raw = hero.talent.starDescriptions[0].descriptionKoRaw;
  const paragraph = functions.makeTalentDescription(raw, 3);
  assert.equal(paragraph.className, 'talent-description');
  assert.ok(paragraph.children.some((child) => child.className === 'talent-emphasis'));
  const sourceDescription = makeElement('p');
  functions.appendSkillDescription(sourceDescription, hero.talent.starDescriptions[0].descriptionCn);
  assert.ok(sourceDescription.children.some((child) => child.className === 'skill-description-emphasis'));
  assert.ok(!source.includes('innerHTML'));
}
const unsafe = functions.makeTalentDescription('<img src=x onerror=alert(1)>', 3);
assert.equal(unsafe.textContent, '<img src=x onerror=alert(1)>');
assert.equal(unsafe.children.length, 0, 'unsupported markup is rendered as text, never HTML');
const unsafeSource = makeElement('p');
functions.appendSkillDescription(unsafeSource, '<img src=x onerror=alert(1)>');
assert.equal(unsafeSource.textContent, '<img src=x onerror=alert(1)>');
assert.equal(unsafeSource.children.length, 0, 'unsupported Chinese source markup is preserved as plain text');
assert.throws(() => functions.makeTalentDescription(' ', 3), /missing/);
assert.throws(() => functions.makeTalentPresentation(6, { nameKo: 'x', starDescriptions: [] }), /malformed/);
assert.throws(() => functions.makeTalentPresentation(6, { nameKo: 'x', starDescriptions: [{ star: 3, skillId: 3067 }] }), /presentation is malformed/);
console.log('Hero Talent presentation checks passed (exact Skill ID projection, 8 negative controls, original markup safety)');
