import { runInNewContext } from 'node:vm';
import { extractFunction } from './test-app-function-source.mjs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { readHero15JobPublicationInputs, readHero15SoldierPublicationInputs, readHero15ProfileInputs, HERO_15_INTEGRATED_PUBLICATION_PATH, HERO_15_MINIMAL_DETAIL_PATH, renderHero15MinimalDetail, validateHero15MinimalDetail } from './hero-15-integrated-publication-contract.mjs';

const read = async (path) => JSON.parse(await readFile(path, 'utf8'));
const [decision, heroIdentities, heroLocalizations, relations, equipmentIdentities, equipmentLocalizations, generatedText, heroIndex, heroSlice] = await Promise.all([
  read(HERO_15_INTEGRATED_PUBLICATION_PATH), read('canonical/hero-identities.v1.json'),
  read('canonical/hero-localizations-ko.v1.json'), read('canonical/hero-exclusive-equipment-relations.v1.json'),
  read('canonical/exclusive-equipment.v1.json'), read('canonical/exclusive-equipment-localizations-ko.v1.json'),
  readFile(HERO_15_MINIMAL_DETAIL_PATH, 'utf8'), read('generated/hero-index.v1.json'), read('generated/hero-slice.v1.json'),
]);
const sourceHashes = Object.fromEntries(await Promise.all([
  ['heroIdentity', 'canonical/hero-identities.v1.json'],
  ['heroLocalization', 'canonical/hero-localizations-ko.v1.json'],
  ['equipmentRelation', 'canonical/hero-exclusive-equipment-relations.v1.json'],
  ['equipmentIdentity', 'canonical/exclusive-equipment.v1.json'],
  ['equipmentLocalization', 'canonical/exclusive-equipment-localizations-ko.v1.json'],
].map(async ([key, path]) => [key, createHash('sha256').update(await readFile(path)).digest('hex')])));
const inputs = { jobInputs: await readHero15JobPublicationInputs(read), soldierInputs: await readHero15SoldierPublicationInputs(read), profileInputs: await readHero15ProfileInputs(read), decision, heroIdentities, heroLocalizations, relations, equipmentIdentities, equipmentLocalizations, sourceHashes };
const generated = validateHero15MinimalDetail({ generatedText, inputs });
assert.deepEqual(generated.heroes.map(({ heroId }) => heroId), [15]);
assert.deepEqual(Object.keys(generated.heroes[0]).sort(), ['awakeningMaterials', 'bond3DescriptionKo', 'centralDisciplineEffectKo', 'exclusiveEquipment', 'heroId', 'jobPaths', 'nameKo', 'ordinarySkills', 'profile', 'soldiers']);
assert.deepEqual(Object.keys(generated.heroes[0].exclusiveEquipment).sort(), ['effectDescriptionKo', 'equipmentId', 'nameKo']);
assert.equal(generated.heroes[0].exclusiveEquipment.equipmentId, 535);
assert.equal(generated.heroes[0].nameKo, '리아나');
assert.equal(heroIndex.heroes.length, 267);
assert.equal(heroSlice.heroes.length, 29);

const fails = (mutate, pattern) => {
  const changed = structuredClone(inputs);
  mutate(changed);
  assert.throws(() => renderHero15MinimalDetail(changed), pattern);
};
fails((x) => { x.decision.status = 'NOT_APPROVED'; }, /approval or scope/);
fails((x) => { x.decision.approvedScope.minimalDetail.fields.push('rarity'); }, /approval or scope/);
fails((x) => { x.heroIdentities.records = x.heroIdentities.records.filter(({ heroId }) => heroId !== 15); }, /exact approved claims/);
fails((x) => { x.heroLocalizations.records.find(({ heroId }) => heroId === 15).nameKo = '잘못된 이름'; }, /exact approved claims/);
fails((x) => { x.relations.records = x.relations.records.filter(({ heroId }) => heroId !== 15); }, /exact approved claims/);
fails((x) => { x.relations.records.push({ heroId: 15, equipmentId: 536 }); }, /exact approved claims/);
fails((x) => { x.equipmentIdentities.records = x.equipmentIdentities.records.filter(({ equipmentId }) => equipmentId !== 535); }, /exact approved claims/);
fails((x) => { x.equipmentLocalizations.records.find(({ equipmentId }) => equipmentId === 535).effectDescriptionKo = ''; }, /exact approved claims/);
fails((x) => { x.sourceHashes.equipmentRelation = '0'.repeat(64); }, /source hash changed/);
assert.throws(() => validateHero15MinimalDetail({ generatedText: generatedText.replace('리아나', '다른 이름'), inputs }), /stale or non-deterministic/);
fails((x) => { delete x.profileInputs.approval; }, /profile decision/);
fails((x) => { x.profileInputs.approval.surface = 'hero-index'; }, /approval or scope/);
fails((x) => { x.profileInputs.rarities.records.find(({ heroId }) => heroId === 15).rankId = 3; }, /exact approved Canonical/);
fails((x) => { x.profileInputs.relations.records.push({ heroId: 15, factionId: 5 }); }, /exact approved Canonical/);
fails((x) => { x.profileInputs.names.records.find(({ factionId }) => factionId === 1).nameKo = '다른 이름'; }, /exact approved Canonical/);
assert.equal(heroSlice.heroes.some(({ id }) => id === 15), false);
assert.deepEqual(heroIndex.heroes.find(({ heroId }) => heroId === 15), { heroId: 15, nameKo: '리아나' });
const extraField = structuredClone(generated);
extraField.heroes[0].rarity = { rankId: 3 };
assert.throws(() => validateHero15MinimalDetail({ generatedText: `${JSON.stringify(extraField, null, 2)}\n`, inputs }), /stale or non-deterministic/);
const duplicated = structuredClone(generated);
duplicated.heroes.push(structuredClone(duplicated.heroes[0]));
assert.throws(() => validateHero15MinimalDetail({ generatedText: `${JSON.stringify(duplicated, null, 2)}\n`, inputs }), /stale or non-deterministic/);
const frontend = await readFile('app.js', 'utf8');
const talent = await read('generated/hero-15-talent-public.v1.json');
const html = await readFile('index.html', 'utf8');
assert.match(html, /id="hero-minimal-detail-15-content"/);
const equipmentNavigation = await read('generated/exclusive-equipment-hero-navigation.v1.json');
assert.deepEqual(equipmentNavigation.records.find(({ equipmentId }) => equipmentId === 535).navigationTarget,
  { surface: 'HERO_MINIMAL_DETAIL', fragment: 'hero-minimal-detail-15' });

const element = () => ({
  children: [],
  append(...children) { this.children.push(...children); },
  replaceChildren(...children) { this.children = children; },
});
const target = { scrollIntoView() { this.scrolled = true; } };
const render = runInNewContext([
  extractFunction(frontend, 'renderHeroMinimalDetailView'),
  extractFunction(frontend, 'renderHero15MinimalDetailView'),
  extractFunction(frontend, 'renderMinimalDetailList'),
  'renderHero15MinimalDetailView',
].join('\n'), {
  document: { createElement: element, getElementById: (id) => id === 'hero-minimal-detail-15' ? target : null },
  makeTalentPresentation: () => ({ textContent: '성결한 수녀' }),
});
const container = element();
const navigation = render(generated, talent, container);
const paragraphs = container.children[0].children.map(({ textContent }) => textContent);
assert.ok(paragraphs.includes('중국어명 · 莉亚娜 / 영문명 · Liana'));
assert.equal(generatedText.includes('Riana'), false);
assert.equal(generatedText.includes('officialEnglishDisplay'), false);
fails((x) => { x.profileInputs.sourceNamesApproval.officialEnglishDisplay.value = 'Riana'; }, /display provenance/);
fails((x) => { x.profileInputs.sourceNamesApproval.nameEn = 'Liana'; }, /approved source fields/);
assert.ok(paragraphs.includes('성우 · 코시미즈 아미'));
assert.doesNotMatch(generatedText, /小清水亚美|charImageId|displayAuthority/);
fails((x) => { x.profileInputs.cvDecision.nameKo = '다른 성우'; }, /CV publication scope/);
fails((x) => { x.profileInputs.cvDecision.heroId = 16; }, /CV publication scope/);
fails((x) => { x.profileInputs.cvCanonical.records[0].charImageId = 16; }, /source CVName Canonical claim/);
const invalidCv = structuredClone(generated);
invalidCv.heroes[0].profile.cvNameKo = '다른 성우';
assert.throws(() => render(invalidCv, talent, element()), /profile consumer/);
assert.ok(paragraphs.includes('등급 · SSR'));
assert.ok(paragraphs.includes('진영 · 시대의 주역 · 빛의 군단 · 공주 연맹'));
assert.ok(paragraphs.includes('완벽한 찬사 (Equipment ID 535)'));
assert.ok(paragraphs.includes('성결한 수녀'));
const castingSection = container.children[0].children.find(({ children }) => children?.[0]?.textContent === '중앙율정');
assert.deepEqual(castingSection.children[1].children.map(({ textContent }) => textContent), [
  '어게인 스킬의 사거리 +1', '어게인 스킬 받은 대상에게 증원 및 면역 부여, 지속 2행동',
]);
assert.doesNotMatch(generatedText, /90089|辉耀祝祈|effectRow/);
fails((x) => { x.profileInputs.centralDisciplineDecision.skillId = 10816; }, /Central Discipline publication scope/);
fails((x) => { x.profileInputs.skillIdentities.records.find(({ skillId }) => skillId === 90089).descriptionCn += 'x'; }, /Central Discipline publication scope/);
const awakeningSection = container.children[0].children.find(({ children }) => children?.[0]?.textContent === '각성 재료');
assert.deepEqual(awakeningSection.children[1].children.map(({ textContent }) => textContent), [
  '1단계 · 생령의 수정 × 8', '1단계 · 심연의 수정 × 8', '1단계 · 빛나는 별의 조각 × 5',
  '2단계 · 계절풍의 마음 × 12', '2단계 · 대륙의 마음 × 12', '2단계 · 영원한 달의 빛 × 5',
]);
assert.equal(awakeningSection.children[2].textContent, '현재 검증된 각성 재료 6개를 표시합니다.');
assert.doesNotMatch(generatedText, /1015|2015|3247|3249|3253|3254|3256|3260|sheetBlob|driveFile/);
fails((x) => { delete x.profileInputs.awakeningDecision.noticeKo; }, /Awakening material publication scope/);
fails((x) => { x.profileInputs.awakeningDecision.stages[0].materials[0].itemId = 3253; }, /Awakening material publication scope/);
fails((x) => { x.profileInputs.awakeningDecision.stages[0].materials[0].nameKo = '다른 이름'; }, /Awakening material publication scope/);
fails((x) => { x.profileInputs.awakeningInputs.references.records[0].stage1LevelReference.levelId = 2015; }, /Awakening material stage/);
fails((x) => { x.profileInputs.awakeningInputs.references.records[0].stage1SourceGoods[1].count = 9; }, /Awakening material row/);
fails((x) => { x.profileInputs.awakeningDecision.stages[0].materials.pop(); }, /Awakening material publication scope/);
fails((x) => { x.profileInputs.awakeningDecision.stages[1].materials[2].itemId = 3253; }, /Awakening material publication scope/);
fails((x) => { x.profileInputs.awakeningInputs.references.records[0].stage2SourceGoods[0].count = 6; }, /Awakening material row/);
const leakedAwakening = structuredClone(generated);
leakedAwakening.heroes[0].awakeningMaterials.stages[0].materials[0].itemId = 3247;
assert.throws(() => render(leakedAwakening, talent, element()), /Awakening material consumer/);
const bond3Section = container.children[0].children.find(({ children }) => children?.[0]?.textContent === '유대 3');
assert.deepEqual(bond3Section.children[1].children.map(({ textContent }) => textContent), ['프로핏으로 전직']);
assert.doesNotMatch(generatedText, /5050|莉亚娜转职成为先知|fetterId|Parm1|Param2/);
fails((x) => { x.profileInputs.bond3Decision.missionId = 5051; }, /Bond 3 description publication scope/);
fails((x) => { x.profileInputs.bond3Decision.heroId = 16; }, /Bond 3 description publication scope/);
fails((x) => { x.profileInputs.bond3Decision.fetterId = 69; }, /Bond 3 description publication scope/);
fails((x) => { x.profileInputs.fetterDetails.records.find(({ endpointId }) => endpointId === 68)
  .fields.CompletionConditions.find(({ ConditionType }) => ConditionType === 2).Parm1 = 5051; }, /Bond 3 description publication scope/);
const leakedBond = structuredClone(generated);
leakedBond.heroes[0].bond3DescriptionKo = { text: '프로핏으로 전직', missionId: 5050 };
assert.throws(() => render(leakedBond, talent, element()), /Bond 3 description consumer/);
const skillSection = container.children[0].children.find(({ children }) => children?.[0]?.textContent === '일반 스킬');
const skillLabels = skillSection.children[1].children.map(({ textContent }) => textContent);
assert.equal(skillLabels.length, 9);
assert.ok(skillLabels[0].startsWith('힐 · '));
assert.equal(skillLabels[4], '빙결');
assert.equal(skillLabels[5], '광역 실드');
assert.equal(skillLabels[7], '명상');
assert.doesNotMatch(generatedText, /sourceDescSha256|catalogLine|withheldDescriptionReason/);
fails((x) => { x.profileInputs.skillDecision.skills[0].skillId = 12350; }, /Skill publication scope/);
fails((x) => { x.profileInputs.skillDecision.skills[4].descriptionKo = '미검증 설명'; }, /Skill source or Korean display/);
fails((x) => { x.profileInputs.skillIdentities.records.find(({ skillId }) => skillId === 10801).descriptionCn += 'x'; }, /Skill source or Korean display/);
const invalidSkill = structuredClone(generated);
invalidSkill.heroes[0].ordinarySkills[0].range = 2;
assert.throws(() => render(invalidSkill, talent, element()), /ordinary Skill consumer/);
const soldierSection = container.children[0].children.find(({ children }) => children?.[0]?.textContent === '용병');
const soldierLabels = soldierSection.children[1].children.map(({ textContent }) => textContent);
assert.equal(soldierLabels.length, 14);
assert.ok(soldierLabels.includes('NORMAL · 하이랜더'));
assert.ok(soldierLabels.includes('SP · 하이랜더'));
const jobSection = container.children[0].children.find(({ children }) => children?.[0]?.textContent === '전직');
assert.deepEqual(jobSection.children[1].children.map(({ textContent }) => textContent), [
  '시스터 → 주교', '시스터 → 프리스트', '시스터 → 서모너', '프리스트 → 프로핏', '서모너 → 허미트',
]);
fails((x) => { x.jobInputs.approval.paths.pop(); }, /approved direct edges/);
fails((x) => { x.soldierInputs.approval.soldiers.pop(); }, /approved subset/);
assert.equal(navigation.showTarget(15), true);
assert.equal(target.scrolled, true);
assert.equal(navigation.showTarget(16), false);
const leaked = structuredClone(generated);
leaked.heroes[0].profile.origins = [];
assert.throws(() => render(leaked, talent, element()), /profile consumer/);
process.stdout.write('Hero 15 Minimal Detail regression: PASS (publication, ID, relation, localization, equipment, fields, duplication, stale output, and preserved populations)\n');
