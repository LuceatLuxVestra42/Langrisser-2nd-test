import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { extractFunction } from './test-app-function-source.mjs';
import { resolveTalentSkillText } from './generate.mjs';

const [source, generated, localization, skills, talentRelations, hero15Public] = await Promise.all([
  readFile('app.js', 'utf8'),
  readFile('generated/hero-slice.v1.json', 'utf8').then(JSON.parse),
  readFile('canonical/hero-talent-localizations-ko.v1.json', 'utf8').then(JSON.parse),
  readFile('canonical/skills.v1.json', 'utf8').then(JSON.parse),
  readFile('canonical/hero-talent-star-skills.v1.json', 'utf8').then(JSON.parse),
  readFile('generated/hero-15-talent-public.v1.json', 'utf8').then(JSON.parse),
]);
talentRelations.records = talentRelations.records.filter((row) => [6, 8].includes(row.heroId));
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
assert.equal(localization.nameRecords.find(({ heroId }) => heroId === 15)?.talentNameKo, '성결한 수녀', 'Hero 15 Localization is admitted independently');
assert.deepEqual(localization.descriptionRecords.filter(({ heroId }) => heroId === 15).map(({ star, skillId }) => [star, skillId]),
  [[3, 3212], [4, 3214], [5, 3216], [6, 3218]], 'Hero 15 Localization is keyed to the existing Skill IDs');
assert.equal(generated.heroes.find(({ id }) => id === 15)?.talent, undefined, 'Hero 15 Talent remains outside the presentation allowlist');
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
assert.deepEqual([hero15Public.heroId,hero15Public.surface,hero15Public.officialKrProvenanceStatus],[15,'hero-minimal-detail-15','unverified']);
assert.deepEqual(hero15Public.talent.starDescriptions.map(({star,skillId})=>[star,skillId]),[[3,3212],[4,3214],[5,3216],[6,3218]]);
assert.match(source,/fetch\('\.\/generated\/hero-15-talent-public\.v1\.json'\)/);
assert.match(source,/Hero 15 Talent consumer is malformed or outside its approved publication scope/);
assert.equal(generated.heroes.find(({id})=>id===15)?.talent,undefined,'Hero 15 remains outside the Full Detail Talent consumer');
assert.match(source, /if \(hero\.talent\) article\.append\(makeTalentPresentation\(hero\.id, hero\.talent\)\)/);
assert.match(source, /Talent · 프로젝트 검수 한국어 \(공식 표기 미확인\)/);

const makeElement = (tagName = '#text') => ({
  tagName, children: [], className: '', textContent: '', attributes: {},
  append(...children) { this.children.push(...children); },
  replaceChildren(...children) { this.children = children; },
  addEventListener(event, listener) { this.listeners[event] = listener; },
  listeners: {},
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
const { talent } = hero15Public;
for (const star of [3, 4, 5]) {
  const copy = structuredClone(hero15Public);
  copy.talent.starDescriptions.find(row => row.star === star).descriptionKoRaw = '   ';
  assert.throws(() => functions.makeTalentPresentation(15, copy.talent),
    /Generated Hero Talent description is missing/, `Reject blank ${star}-star Korean text on initial render`);
}
const liana = functions.makeTalentPresentation(15, talent);
const [heading, name, lower, higher, list, originals] = liana.children;
assert.equal(heading.textContent, 'Talent · 프로젝트 검수 한국어 (공식 표기 미확인)');
assert.equal(name.textContent, '성결한 수녀');
assert.deepEqual([lower.tagName, higher.tagName, originals.tagName], ['button', 'button', 'details']);
assert.equal(originals.children[0].textContent, '연결된 Talent Skill 중국어 원문 · ID 기준');
const originalRows = originals.children[1].children;
assert.deepEqual(originalRows.map(row => row.children[0].textContent),
  talent.starDescriptions.map(row => `${row.star}성 · Skill ID ${row.skillId} · ${row.nameCn}`));
originals.open = true;
const skillIds = new Map([[3, 3212], [4, 3214], [5, 3216], [6, 3218]]);
function checkSelectedStar(star) {
  const row = talent.starDescriptions.find(row => row.skillId === skillIds.get(star));
  assert.equal(list.children.length, 1);
  const [label, description] = list.children[0].children;
  assert.equal(label.textContent, `${star}성`);
  // Compare the same public row using the pre-existing Korean formatting rules.
  const expected = functions.makeTalentDescription(row.descriptionKoRaw, star);
  assert.equal(description.className, expected.className);
  assert.equal(description.textContent, expected.textContent);
  assert.deepEqual(description.children.map(node => [node.className, node.textContent]),
    expected.children.map(node => [node.className, node.textContent]));
  assert.equal(lower.disabled, star === 3);
  assert.equal(higher.disabled, star === 6);
  assert.equal(lower.textContent, star === 3 ? '낮은 성급 고유기 보기' : `낮은 성급 고유기 보기 · ${star - 1}성`);
  assert.equal(higher.textContent, star === 6 ? '높은 성급 고유기 보기' : `높은 성급 고유기 보기 · ${star + 1}성`);
  assert.equal(liana.children.at(-1), originals);
  assert.equal(originals.open, true);
  assert.equal(originals.children[1].children, originalRows);
}
checkSelectedStar(6);
for (const [button, star] of [[higher, 6], [lower, 5], [lower, 4], [lower, 3], [lower, 3],
  [higher, 4], [higher, 5], [higher, 6], [higher, 6]]) {
  button.listeners.click();
  checkSelectedStar(star);
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
console.log('Hero Talent presentation checks passed (Full Detail remains Heroes 6/8; Hero 15 Talent isolated to approved Minimal Detail; 6→3→6 navigation and endpoints; three unselected Korean descriptions checked on initial render; original markup safety)');
