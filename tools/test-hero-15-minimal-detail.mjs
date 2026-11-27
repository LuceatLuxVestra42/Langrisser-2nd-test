import { HERO_15_SOLDIER_TEXT_PUBLIC, readHero15SoldierTextInputs, renderHero15SoldierText, validateHero15SoldierText } from './hero-15-soldier-text-publication-contract.mjs';
import { selectSkinFullarts } from '../skin-fullart-presentation.mjs';
import { runInNewContext } from 'node:vm';
import { extractFunction } from './test-app-function-source.mjs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { readHero15JobPublicationInputs, readHero15SoldierPublicationInputs, readHero15ProfileInputs, renderHeadGoldSubtotal, renderBond1KeyTotals, renderBond2KeyTotals, HERO_15_INTEGRATED_PUBLICATION_PATH, HERO_15_MINIMAL_DETAIL_PATH, renderHero15MinimalDetail, validateHero15MinimalDetail } from './hero-15-integrated-publication-contract.mjs';

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
assert.deepEqual(Object.keys(generated.heroes[0]).sort(), ['awakeningMaterials', 'bond2DescriptionKo', 'bond3DescriptionKo', 'bond4DescriptionKo', 'bond5DescriptionKo', 'centralDisciplineEffectKo', 'centralDisciplineGoldTotal', 'exclusiveEquipment', 'fetterGold', 'heroId', 'jobPaths', 'nameKo', 'ordinarySkills', 'profile', 'soldierCommandLinesKo', 'soldiers']);
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
const lianaHeader = html.match(/<section\b[^>]*\sid="hero-minimal-detail-15"[^>]*>\s*<header\b[^>]*>([\s\S]*?)<\/header>/)?.[1];
assert.ok(lianaHeader, 'Expected the static header of Liana’s detail');
assert.match(lianaHeader, /^\s*<a href="#hero-index">영웅 목록<\/a>/);
assert.equal([...lianaHeader.matchAll(/<a\b[^>]*\shref="#hero-index"[^>]*>/g)].length, 1);
assert.equal([...html.matchAll(/\sid="hero-index"/g)].length, 1);
const equipmentNavigation = await read('generated/exclusive-equipment-hero-navigation.v1.json');
assert.deepEqual(equipmentNavigation.records.find(({ equipmentId }) => equipmentId === 535).navigationTarget,
  { surface: 'HERO_MINIMAL_DETAIL', fragment: 'hero-minimal-detail-15' });

const element = (tag) => ({
  tag, open: false, children: [],
  append(...children) { this.children.push(...children); },
  replaceChildren(...children) { this.children = children; },
  addEventListener() {},
});
const target = { scrollIntoView() { this.scrolled = true; } };
const render = runInNewContext([
  extractFunction(frontend, 'renderHeroMinimalDetailView'),
  extractFunction(frontend, 'renderHero15MinimalDetailView'),
  extractFunction(frontend, 'renderMinimalDetailList'),
  extractFunction(frontend, 'makeAnchor'),
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
  'Lv.1~10 합계 골드 10,800,000',
]);
const headGoldLine = '투구 · Lv.1~10 소계 골드 3,600,000';
assert.equal(renderHeadGoldSubtotal(inputs.profileInputs), headGoldLine);
assert.deepEqual(castingSection.children.slice(2).map(node => node.textContent), [headGoldLine]);
function rejectHeadGold(mutate, error) {
  const changed = structuredClone(inputs.profileInputs);
  mutate(changed);
  assert.throws(() => renderHeadGoldSubtotal(changed), error);
}
for (const [key, value] of [['heroId', 16], ['slotType', 'BODY'], ['templateId', 41], ['levels', [2, 10]]]) {
  rejectHeadGold(({ headGoldDecision }) => { headGoldDecision[key] = value; }, /Head gold publication scope/);
}
rejectHeadGold(inputs => { delete inputs.headGoldDecision; }, /Head gold publication scope/);
rejectHeadGold(({ headGoldDecision }) => { headGoldDecision.slotEvidence.slot = '/records/13/slots/2'; }, /Head gold slot evidence/);
rejectHeadGold(({ headGoldDecision }) => { headGoldDecision.subtotalGold++; }, /Head gold subtotal display/);
rejectHeadGold(({ castingLawHero }) => {
  castingLawHero.records.find(row => row.templateId === 40).heroId = 16;
}, /Head gold Hero–Template/);
rejectHeadGold(({ castingLawLevels }) => {
  castingLawLevels.records.find(row => row.levelUpInfoId === 196).levelUpSourceArrayIndex++;
}, /Head gold Template–LevelUp/);
rejectHeadGold(({ castingLawRaw }) => {
  castingLawRaw.records.find(row => row.levelUpInfoId === 196).rawFields.LevelUpGoldCost++;
}, /Head gold source mismatch for LevelUp 196/);
rejectHeadGold(({ castingLawRaw }) => {
  const first = castingLawRaw.records.find(row => row.levelUpInfoId === 196).rawFields;
  const second = castingLawRaw.records.find(row => row.levelUpInfoId === 197).rawFields;
  [first.LevelUpGoldCost, second.LevelUpGoldCost] = [second.LevelUpGoldCost, first.LevelUpGoldCost];
}, /Head gold source mismatch for LevelUp 196/);
assert.doesNotMatch(generatedText, /90089|辉耀祝祈|effectRow/);
fails((x) => { x.profileInputs.centralDisciplineDecision.skillId = 10816; }, /Central Discipline publication scope/);
fails((x) => { x.profileInputs.skillIdentities.records.find(({ skillId }) => skillId === 90089).descriptionCn += 'x'; }, /Central Discipline publication scope/);
const expectedCastingLawGroups = [
  [14, [66, 67, 68, 69, 70, 10066, 10067, 10068, 10069, 10070], 1800000],
  [12, [56, 57, 58, 59, 60, 10056, 10057, 10058, 10059, 10060], 1800000],
  [37, [181, 182, 183, 184, 185, 10181, 10182, 10183, 10184, 10185], 1800000],
  [40, [196, 197, 198, 199, 200, 10196, 10197, 10198, 10199, 10200], 3600000],
  [41, [201, 202, 203, 204, 205, 10201, 10202, 10203, 10204, 10205], 1800000],
];
const { castingLawHero, castingLawLevels, castingLawRaw } = inputs.profileInputs;
assert.deepEqual(castingLawHero.records.map(row => [row.heroId, row.templateId]), expectedCastingLawGroups.map(([id]) => [15, id]));
assert.deepEqual(castingLawLevels.records.map(row => [row.templateId, row.sourceArrayIndex, row.levelUpInfoId]),
  expectedCastingLawGroups.flatMap(([id, levels]) => levels.map((levelId, index) => [id, index, levelId])));
const costsByLevelUp = new Map(castingLawRaw.records.map(({ levelUpInfoId, rawFields }) => [levelUpInfoId, rawFields.LevelUpGoldCost]));
assert.equal(costsByLevelUp.size, 50);
assert.deepEqual(expectedCastingLawGroups.map(([, ids]) =>
  ids.reduce((subtotal, id) => subtotal + costsByLevelUp.get(id), 0)), expectedCastingLawGroups.map(([, , subtotal]) => subtotal));
assert.equal(generated.heroes[0].centralDisciplineGoldTotal, 10800000);
assert.doesNotMatch(generatedText, /LevelUpGoldCost|castingLawTemplate|levelUpInfoId|LevelupMaterialsCost|subtotalGold/);
fails((x) => { x.profileInputs.centralDisciplineGoldDecision.approval.originalMessageId = 'other'; }, /Gold publication scope/);
fails((x) => { x.profileInputs.centralDisciplineGoldDecision.unit = 'material'; }, /Gold publication scope/);
fails((x) => { x.profileInputs.centralDisciplineGoldDecision.source.field = 'LevelupMaterialsCost'; }, /Gold publication scope/);
fails((x) => { x.profileInputs.centralDisciplineGoldDecision.levels = [1, 11]; }, /Gold publication scope/);
fails((x) => { x.profileInputs.centralDisciplineGoldDecision.templates[3].subtotalGold = 1800000; }, /Gold source projection or subtotal/);
fails((x) => { x.profileInputs.centralDisciplineGoldDecision.totalGold = 10000000; }, /Gold approved total/);
fails((x) => { x.profileInputs.castingLawHero.records[0].heroId = 16; }, /Gold Hero–Template/);
fails((x) => { x.profileInputs.castingLawHero.records[0].templateId = 12; }, /Gold Hero–Template/);
fails((x) => { x.profileInputs.castingLawLevels.records[0].templateId = 12; }, /Gold Template–LevelUp/);
fails((x) => { x.profileInputs.castingLawLevels.records[0].levelUpInfoId = 67; }, /Gold LevelUp order or uniqueness/);
fails((x) => { x.profileInputs.castingLawLevels.records.pop(); }, /Gold Canonical population/);
fails((x) => { x.profileInputs.castingLawLevels.records.push({ ...x.profileInputs.castingLawLevels.records[9], sourceArrayIndex: 10 }); }, /Gold Canonical population/);
fails((x) => { x.profileInputs.castingLawLevels.records[9].sourceArrayIndex = 10; }, /Gold Template–LevelUp/);
fails((x) => { x.profileInputs.castingLawLevels.records[0].levelUpEndpointNamespace = 'ConfigDataItemInfo.ID'; }, /Gold Template–LevelUp/);
fails((x) => { x.profileInputs.castingLawLevels.records[0].levelUpSourceArrayIndex = 66; }, /Gold source projection or subtotal/);
fails((x) => { x.profileInputs.castingLawRaw.records[0].rawFields.ID = 67; }, /Gold endpoint or value/);
fails((x) => { x.profileInputs.castingLawRaw.records[0].rawFields.LevelupMaterialsCost = 25000; }, /Gold raw fields/);
fails((x) => { delete x.profileInputs.castingLawRaw.records[0].rawFields.LevelUpGoldCost; }, /Gold raw fields/);
fails((x) => {
  const [a, b] = x.profileInputs.castingLawRaw.records;
  [a.rawFields.LevelUpGoldCost, b.rawFields.LevelUpGoldCost] = [b.rawFields.LevelUpGoldCost, a.rawFields.LevelUpGoldCost];
}, /Gold source projection or subtotal/);
for (const value of ['25000', null, 0, -1, 1.5]) {
  fails((x) => { x.profileInputs.castingLawRaw.records[0].rawFields.LevelUpGoldCost = value; }, /Gold endpoint or value/);
}
for (const value of [undefined, '10800000', null, 0, { gold: 10800000, materials: [] }]) {
  const invalid = structuredClone(generated);
  invalid.heroes[0].centralDisciplineGoldTotal = value;
  assert.throws(() => render(invalid, talent, element()), /Central Discipline Gold consumer/);
  assert.throws(() => validateHero15MinimalDetail({ generatedText: JSON.stringify(invalid, null, 2) + '\n', inputs }), /stale or non-deterministic/);
}
assert.throws(() => validateHero15MinimalDetail({ generatedText: generatedText.replace('"centralDisciplineGoldTotal": 10800000', '"centralDisciplineGoldTotal": 10800001'), inputs }), /stale or non-deterministic/);
const awakeningSections = container.children[0].children.filter(node => node.children?.[0]?.textContent === '각성 재료');
assert.equal(awakeningSections.length, 1);
const [awakeningSection] = awakeningSections;
assert.equal(awakeningSection.tag, 'details');
assert.equal(awakeningSection.open, false);
assert.deepEqual(awakeningSection.children.map(node => node.tag), ['summary', 'ul', 'p']);
assert.equal(castingSection.tag, 'section');
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
const bond2Sections = container.children[0].children.filter(({ children }) => children?.[0]?.textContent === '유대 2');
assert.equal(bond2Sections.length, 1);
assert.deepEqual(bond2Sections[0].children[1].children.map(({ textContent }) => textContent), [
  '리아나를 출전시켜 시공의 균열 3-6 클리어',
]);
assert.doesNotMatch(generatedText, /5049|使用莉亚娜完成时空裂缝/);
fails((x) => { x.profileInputs.bond2Decision.heroId = 16; }, /Bond 2 description publication scope/);
fails((x) => { x.profileInputs.bond2Decision.fetterId = 68; }, /Bond 2 description publication scope/);
fails((x) => { x.profileInputs.bond2Decision.missionId = 5050; }, /Bond 2 description publication scope/);
fails((x) => { x.profileInputs.fetterDetails.records.find(({ endpointId }) => endpointId === 67)
  .fields.CompletionConditions.find(({ ConditionType }) => ConditionType === 2).Parm1 = 5050; }, /Bond 2 description publication scope/);
const leakedBond2 = structuredClone(generated);
leakedBond2.heroes[0].bond2DescriptionKo = { text: '리아나를 출전시켜 시공의 균열 3-6 클리어', missionId: 5049 };
assert.throws(() => render(leakedBond2, talent, element()), /Bond 2 description consumer/);
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
for (const [title, expected] of [['유대 4', '헤인과 함께 운명의문 5 클리어'], ['유대 5', '엘윈과 함께 운명의문 7 클리어']]) {
  const section = container.children[0].children.find(({ children }) => children?.[0]?.textContent === title);
  assert.deepEqual(section.children[1].children.map(({ textContent }) => textContent), [expected]);
}
assert.doesNotMatch(generatedText, /5051|5052|companionHeroId|stageNameNum|dungeonOwnerHeroId|Param3/);
fails((x) => { x.profileInputs.bond45Decision.rows[0].stageNameNum = '7'; }, /Bond 4\/5 description publication scope/);
fails((x) => { x.profileInputs.bond45Decision.rows[0].companionHeroId = 12; }, /Bond 4\/5 description publication scope/);
fails((x) => { x.profileInputs.bond45Decision.rows[1].missionId = 5051; }, /Bond 4\/5 description publication scope/);
fails((x) => { x.profileInputs.bond45Decision.rows.pop(); }, /Bond 4\/5 description publication scope/);
fails((x) => { x.profileInputs.bond45Decision.rows[0].descriptionKo = '헤인과 함께 운명의문 7 클리어'; }, /Bond 4\/5 description source mismatch/);
const leakedBond45 = structuredClone(generated);
leakedBond45.heroes[0].bond4DescriptionKo = { text: '헤인과 함께 운명의문 5 클리어', stageId: 155 };
assert.throws(() => render(leakedBond45, talent, element()), /Bond 4\/5 description consumer/);
const skillSection = container.children[0].children.find(({ children }) => children?.[0]?.textContent === '일반 스킬');
const skillLabels = skillSection.children[1].children.map(({ textContent }) => textContent);
const expectedCosts = [1, 2, 2, 1, 1, 2, 2, 1, 2];
const expectedCooldownLabels = [undefined, '쿨 2턴', '쿨 2턴', '쿨 1턴', '쿨 1턴', '쿨 2턴', '쿨 3턴', undefined, '쿨 4턴'];
const expectedDistanceLabels = ['사거리 2칸', '사거리 2칸', '사거리 3칸', '사거리 2칸', '사거리 2칸', '사거리 3칸', '사거리 3칸', undefined, '사거리 3칸'];
const expectedAreaLabels = ['범위 단일', '범위 단일', '범위 단일', '범위 단일', '범위 단일', '범위 3칸', '범위 6칸', undefined, '범위 단일'];
const expectedTypeLabels = ['치료', '지원', '지원', '마법 피해', '마법 피해', '지원', '치료', '패시브', '소환'];
const existingSkills = inputs.profileInputs.skillDecision.skills.map(({ skillId, nameKo, descriptionKo }) =>
  descriptionKo === undefined ? { skillId, nameKo } : { skillId, nameKo, descriptionKo });
assert.deepEqual(generated.heroes[0].ordinarySkills, existingSkills.map((row, index) => {
  const result = { ...row, cost: expectedCosts[index] };
  const cooldownLabelKo = expectedCooldownLabels[index];
  if (cooldownLabelKo !== undefined) result.cooldownLabelKo = cooldownLabelKo;
  const distanceLabelKo = expectedDistanceLabels[index];
  if (distanceLabelKo !== undefined) result.distanceLabelKo = distanceLabelKo;
  const areaLabelKo = expectedAreaLabels[index];
  if (areaLabelKo !== undefined) result.areaLabelKo = areaLabelKo;
  result.typeLabelKo = expectedTypeLabels[index];
  return result;
}));
const expectedSkillLabels = existingSkills.map(({ nameKo, descriptionKo }, index) => [
  nameKo, expectedTypeLabels[index], `${expectedCosts[index]}코스트`, expectedCooldownLabels[index], expectedDistanceLabels[index], expectedAreaLabels[index], descriptionKo,
].filter(Boolean).join(' · '));
assert.deepEqual(skillLabels, expectedSkillLabels);
assert.equal(skillLabels[4], '빙결 · 마법 피해 · 1코스트 · 쿨 1턴 · 사거리 2칸 · 범위 단일');
assert.equal(skillLabels[5], '광역 실드 · 지원 · 2코스트 · 쿨 2턴 · 사거리 3칸 · 범위 3칸');
assert.match(skillLabels[6], /^홀리 힐 · 치료 · 2코스트 · 쿨 3턴 · 사거리 3칸 · 범위 6칸 · /);
assert.equal(skillLabels[7], '명상 · 패시브 · 1코스트');
assert.doesNotMatch(generatedText, /SkillCost|shardCost|legacyCostLabel|sourceDescSha256|catalogLine|withheldDescriptionReason|CDText|cdText|shardCooldown|legacyCooldown|BF_Cooldown|回合|DistanceText|distanceText|shardDistance|legacyDistance|RangeText|rangeText|BF_Distance|BF_Range|areaOrTarget|shardArea|legacyArea|TypeText|typeText|SkillType|displayType|shardType|legacyType/);
fails((x) => { x.profileInputs.ordinarySkillCostDecision.rows[0].shardCost = 2; }, /SkillCost source or display/);
fails((x) => { x.profileInputs.ordinarySkillCostDecision.rows[0].legacyCostLabel = '2코스트'; }, /SkillCost source or display/);
fails((x) => { x.profileInputs.ordinarySkillCostDecision.rows[0].skillId = 10816; }, /SkillCost decision coverage/);
fails((x) => { x.profileInputs.ordinarySkillCosts.records.shift(); }, /SkillCost source or display/);
fails((x) => { x.profileInputs.ordinarySkillCostDecision.approval.originalMessageId = 'another-approval'; }, /SkillCost publication scope/);
const partialCostInputs = structuredClone(inputs);
partialCostInputs.profileInputs.ordinarySkillCostDecision.rows[0] = {
  skillId: 10801, status: 'MANUAL_REVIEW', reason: 'Legacy cost label missing',
};
const partialCostText = renderHero15MinimalDetail(partialCostInputs);
const partialCostData = validateHero15MinimalDetail({ generatedText: partialCostText, inputs: partialCostInputs });
assert.deepEqual(partialCostData.heroes[0].ordinarySkills, [
  { ...existingSkills[0], distanceLabelKo: '사거리 2칸', areaLabelKo: '범위 단일', typeLabelKo: '치료' }, ...generated.heroes[0].ordinarySkills.slice(1),
]);
const partialContainer = element();
render(partialCostData, talent, partialContainer);
const partialSkillSection = partialContainer.children[0].children.find(({ children }) => children?.[0]?.textContent === '일반 스킬');
assert.deepEqual(partialSkillSection.children[1].children.map(({ textContent }) => textContent), [
  `${existingSkills[0].nameKo} · 치료 · 사거리 2칸 · 범위 단일 · ${existingSkills[0].descriptionKo}`, ...expectedSkillLabels.slice(1),
]);
assert.throws(() => validateHero15MinimalDetail({ generatedText, inputs: partialCostInputs }), /stale or non-deterministic/);
assert.throws(() => validateHero15MinimalDetail({ generatedText: partialCostText, inputs }), /stale or non-deterministic/);
const partialVisibleCostInputs = structuredClone(inputs);
partialVisibleCostInputs.profileInputs.ordinarySkillCostDecision.rows[1] = {
  skillId: 10816, status: 'MANUAL_REVIEW', reason: 'Legacy cost label missing',
};
assert.deepEqual(JSON.parse(renderHero15MinimalDetail(partialVisibleCostInputs)).heroes[0].ordinarySkills[1], {
  ...existingSkills[1], cooldownLabelKo: '쿨 2턴', distanceLabelKo: '사거리 2칸', areaLabelKo: '범위 단일', typeLabelKo: '지원',
});
fails((x) => { x.profileInputs.ordinarySkillCooldownDecision.approval.originalMessageId = 'another-approval'; }, /CDText publication scope/);
fails((x) => { x.profileInputs.ordinarySkillCooldownDecision.rows[1].shardCooldownPointer = '/normal/skills/jobLevelAcquisitions/1/skill/cooldown'; }, /CDText shard mismatch/);
fails((x) => { x.profileInputs.ordinarySkillCooldownDecision.rows[1].shardCooldown = '1回合'; }, /CDText shard mismatch/);
fails((x) => { x.profileInputs.ordinarySkillCooldownDecision.rows[1].skillId = 10805; }, /CDText decision coverage/);
fails((x) => { x.profileInputs.ordinarySkillCooldownDecision.rows[1].legacyCooldownLabelKo = '쿨 1턴'; }, /CDText source or display/);
fails((x) => { delete x.profileInputs.ordinarySkillCooldownDecision.rows[1].legacyCooldownLabelKo; }, /CDText source or display/);
fails((x) => { x.profileInputs.ordinarySkillCooldownDecision.rows[0].legacyCooldownLabelKo = '쿨 1턴'; }, /CDText hidden row mismatch/);
const partialCooldownInputs = structuredClone(inputs);
partialCooldownInputs.profileInputs.ordinarySkillCooldownDecision.rows[1] = {
  skillId: 10816, status: 'MANUAL_REVIEW', reason: 'Legacy cooldown label differs',
};
const partialCooldownText = renderHero15MinimalDetail(partialCooldownInputs);
const partialCooldownData = validateHero15MinimalDetail({ generatedText: partialCooldownText, inputs: partialCooldownInputs });
const expectedPartialCooldownRows = structuredClone(generated.heroes[0].ordinarySkills);
delete expectedPartialCooldownRows[1].cooldownLabelKo;
assert.deepEqual(partialCooldownData.heroes[0].ordinarySkills, expectedPartialCooldownRows);
const partialCooldownContainer = element();
render(partialCooldownData, talent, partialCooldownContainer);
const partialCooldownSection = partialCooldownContainer.children[0].children.find(({ children }) => children?.[0]?.textContent === '일반 스킬');
const partialCooldownLabels = [...expectedSkillLabels];
partialCooldownLabels[1] = `${existingSkills[1].nameKo} · 지원 · 2코스트 · 사거리 2칸 · 범위 단일 · ${existingSkills[1].descriptionKo}`;
assert.deepEqual(partialCooldownSection.children[1].children.map(({ textContent }) => textContent), partialCooldownLabels);
assert.throws(() => validateHero15MinimalDetail({ generatedText, inputs: partialCooldownInputs }), /stale or non-deterministic/);
assert.throws(() => validateHero15MinimalDetail({ generatedText: partialCooldownText, inputs }), /stale or non-deterministic/);
const hiddenCooldownLeak = structuredClone(generated);
hiddenCooldownLeak.heroes[0].ordinarySkills[7].cooldownLabelKo = '쿨 1턴';
assert.throws(() => render(hiddenCooldownLeak, talent, element()), /ordinary Skill consumer/);
const malformedCooldown = structuredClone(generated);
malformedCooldown.heroes[0].ordinarySkills[1].cooldownLabelKo = '쿨 0턴';
assert.throws(() => render(malformedCooldown, talent, element()), /ordinary Skill consumer/);
fails((x) => { x.profileInputs.ordinarySkillDistanceDecision.approval.originalMessageId = 'another-approval'; }, /DistanceText publication scope/);
fails((x) => { x.profileInputs.ordinarySkillDistanceDecision.rows[5].shardDistancePointer = '/normal/skills/jobLevelAcquisitions/4/skill/areaOrTarget'; }, /DistanceText shard mismatch/);
fails((x) => { x.profileInputs.ordinarySkillDistanceDecision.rows[6].shardDistanceText = '6格'; }, /DistanceText shard mismatch/);
fails((x) => { x.profileInputs.ordinarySkillDistanceDecision.rows[1].skillId = 10805; }, /DistanceText decision coverage/);
fails((x) => { x.profileInputs.ordinarySkillDistanceDecision.rows[1].legacyDistanceLabelKo = '사거리 3칸'; }, /DistanceText source or display/);
fails((x) => { delete x.profileInputs.ordinarySkillDistanceDecision.rows[1].legacyDistanceLabelKo; }, /DistanceText source or display/);
fails((x) => { x.profileInputs.ordinarySkillDistanceDecision.rows[7].legacyDistanceLabelKo = '사거리 2칸'; }, /DistanceText hidden row mismatch/);
const partialDistanceInputs = structuredClone(inputs);
partialDistanceInputs.profileInputs.ordinarySkillDistanceDecision.rows[1] = {
  skillId: 10816, status: 'MANUAL_REVIEW', reason: 'Legacy distance label differs',
};
const partialDistanceText = renderHero15MinimalDetail(partialDistanceInputs);
const partialDistanceData = validateHero15MinimalDetail({ generatedText: partialDistanceText, inputs: partialDistanceInputs });
const expectedPartialDistanceRows = structuredClone(generated.heroes[0].ordinarySkills);
delete expectedPartialDistanceRows[1].distanceLabelKo;
assert.deepEqual(partialDistanceData.heroes[0].ordinarySkills, expectedPartialDistanceRows);
const partialDistanceContainer = element();
render(partialDistanceData, talent, partialDistanceContainer);
const partialDistanceSection = partialDistanceContainer.children[0].children.find(({ children }) => children?.[0]?.textContent === '일반 스킬');
const partialDistanceLabels = [...expectedSkillLabels];
partialDistanceLabels[1] = `${existingSkills[1].nameKo} · 지원 · 2코스트 · 쿨 2턴 · 범위 단일 · ${existingSkills[1].descriptionKo}`;
assert.deepEqual(partialDistanceSection.children[1].children.map(({ textContent }) => textContent), partialDistanceLabels);
assert.throws(() => validateHero15MinimalDetail({ generatedText, inputs: partialDistanceInputs }), /stale or non-deterministic/);
assert.throws(() => validateHero15MinimalDetail({ generatedText: partialDistanceText, inputs }), /stale or non-deterministic/);
const hiddenDistanceLeak = structuredClone(generated);
hiddenDistanceLeak.heroes[0].ordinarySkills[7].distanceLabelKo = '사거리 2칸';
assert.throws(() => render(hiddenDistanceLeak, talent, element()), /ordinary Skill consumer/);
const malformedDistance = structuredClone(generated);
malformedDistance.heroes[0].ordinarySkills[6].distanceLabelKo = '범위 6칸';
assert.throws(() => render(malformedDistance, talent, element()), /ordinary Skill consumer/);
fails((x) => { x.profileInputs.ordinarySkillAreaDecision.approval.originalMessageId = 'another-approval'; }, /RangeText publication scope/);
fails((x) => { x.profileInputs.ordinarySkillAreaDecision.rows[5].shardAreaPointer = '/normal/skills/jobLevelAcquisitions/4/skill/range'; }, /RangeText shard mismatch/);
fails((x) => { x.profileInputs.ordinarySkillAreaDecision.rows[6].shardAreaText = '3格'; }, /RangeText shard mismatch/);
fails((x) => { x.profileInputs.ordinarySkillAreaDecision.rows[1].skillId = 10805; }, /RangeText decision coverage/);
fails((x) => { x.profileInputs.ordinarySkillAreaDecision.rows[1].legacyAreaLabelKo = '범위 1칸'; }, /RangeText source or display/);
fails((x) => { delete x.profileInputs.ordinarySkillAreaDecision.rows[1].legacyAreaLabelKo; }, /RangeText source or display/);
fails((x) => { x.profileInputs.ordinarySkillAreaDecision.rows[7].legacyAreaLabelKo = '범위 단일'; }, /RangeText hidden row mismatch/);
const partialAreaInputs = structuredClone(inputs);
partialAreaInputs.profileInputs.ordinarySkillAreaDecision.rows[1] = {
  skillId: 10816, status: 'MANUAL_REVIEW', reason: 'Legacy area label missing',
};
const partialAreaText = renderHero15MinimalDetail(partialAreaInputs);
const partialAreaData = validateHero15MinimalDetail({ generatedText: partialAreaText, inputs: partialAreaInputs });
assert.equal(partialAreaInputs.profileInputs.ordinarySkillAreas.records.length, 9);
const expectedPartialAreaRows = structuredClone(generated.heroes[0].ordinarySkills);
delete expectedPartialAreaRows[1].areaLabelKo;
assert.deepEqual(partialAreaData.heroes[0].ordinarySkills, expectedPartialAreaRows);
const partialAreaContainer = element();
render(partialAreaData, talent, partialAreaContainer);
const partialAreaSection = partialAreaContainer.children[0].children.find(({ children }) => children?.[0]?.textContent === '일반 스킬');
const partialAreaLabels = [...expectedSkillLabels];
partialAreaLabels[1] = `${existingSkills[1].nameKo} · 지원 · 2코스트 · 쿨 2턴 · 사거리 2칸 · ${existingSkills[1].descriptionKo}`;
assert.deepEqual(partialAreaSection.children[1].children.map(({ textContent }) => textContent), partialAreaLabels);
assert.throws(() => validateHero15MinimalDetail({ generatedText, inputs: partialAreaInputs }), /stale or non-deterministic/);
assert.throws(() => validateHero15MinimalDetail({ generatedText: partialAreaText, inputs }), /stale or non-deterministic/);
const unverifiedAreaInputs = structuredClone(partialAreaInputs);
delete unverifiedAreaInputs.profileInputs.ordinarySkillAreaEvidence.records[1].rawRecord.RangeText;
assert.throws(() => renderHero15MinimalDetail(unverifiedAreaInputs), /HERO15_AREA_RECORD/);
assert.throws(() => validateHero15MinimalDetail({ generatedText: partialAreaText, inputs: unverifiedAreaInputs }), /HERO15_AREA_RECORD/);
fails((x) => { x.profileInputs.ordinarySkillAreas.records.pop(); }, /HERO15_AREA_SCOPE/);
const hiddenAreaLeak = structuredClone(generated);
hiddenAreaLeak.heroes[0].ordinarySkills[7].areaLabelKo = '범위 단일';
assert.throws(() => render(hiddenAreaLeak, talent, element()), /ordinary Skill consumer/);
const malformedArea = structuredClone(generated);
malformedArea.heroes[0].ordinarySkills[0].areaLabelKo = '범위 1칸';
assert.throws(() => render(malformedArea, talent, element()), /ordinary Skill consumer/);
fails((x) => { x.profileInputs.ordinarySkillTypeDecision.approval.originalMessageId = 'another-approval'; }, /TypeText publication scope/);
fails((x) => { x.profileInputs.ordinarySkillTypeDecision.legacyComparison.mappingBlobSha1 = 'unknown'; }, /TypeText Korean mapping pin/);
fails((x) => { x.profileInputs.ordinarySkillTypeDecision.rows[1].shardTypePointer = '/normal/skills/jobLevelAcquisitions/1/skill/displayType'; }, /TypeText shard mismatch/);
fails((x) => { x.profileInputs.ordinarySkillTypeDecision.rows[2].shardTypePointer = '/normal/skills/jobLevelAcquisitions/1/skill/SkillType'; }, /TypeText shard mismatch/);
fails((x) => { x.profileInputs.ordinarySkillTypeDecision.rows[0].shardTypeText = '支援'; }, /TypeText shard mismatch/);
fails((x) => { x.profileInputs.ordinarySkillTypeDecision.rows[1].skillId = 10805; }, /TypeText decision coverage/);
fails((x) => { x.profileInputs.ordinarySkillTypeDecision.rows[1].legacyTypeLabelKo = '액티브'; }, /TypeText source or display/);
fails((x) => { delete x.profileInputs.ordinarySkillTypeDecision.rows[1].legacyTypeLabelKo; }, /TypeText source or display/);
fails((x) => { x.profileInputs.ordinarySkillTypeDecision.rows[2].legacyTypeLabelKo = '치료'; }, /TypeText source or display/);
fails((x) => {
  const rows = x.profileInputs.ordinarySkillTypeDecision.rows;
  [rows[0].legacyTypeLabelKo, rows[2].legacyTypeLabelKo] = [rows[2].legacyTypeLabelKo, rows[0].legacyTypeLabelKo];
}, /TypeText source or display/);
const partialTypeInputs = structuredClone(inputs);
partialTypeInputs.profileInputs.ordinarySkillTypeDecision.rows[1] = {
  skillId: 10816, status: 'MANUAL_REVIEW', reason: 'Legacy type badge missing',
};
const partialTypeText = renderHero15MinimalDetail(partialTypeInputs);
const partialTypeData = validateHero15MinimalDetail({ generatedText: partialTypeText, inputs: partialTypeInputs });
assert.equal(partialTypeInputs.profileInputs.ordinarySkillTypes.records.length, 9);
const expectedPartialTypeRows = structuredClone(generated.heroes[0].ordinarySkills);
delete expectedPartialTypeRows[1].typeLabelKo;
assert.deepEqual(partialTypeData.heroes[0].ordinarySkills, expectedPartialTypeRows);
const partialTypeContainer = element();
render(partialTypeData, talent, partialTypeContainer);
const partialTypeSection = partialTypeContainer.children[0].children.find(({ children }) => children?.[0]?.textContent === '일반 스킬');
const partialTypeLabels = [...expectedSkillLabels];
partialTypeLabels[1] = partialTypeLabels[1].replace(' · 지원 · ', ' · ');
assert.deepEqual(partialTypeSection.children[1].children.map(({ textContent }) => textContent), partialTypeLabels);
assert.throws(() => validateHero15MinimalDetail({ generatedText, inputs: partialTypeInputs }), /stale or non-deterministic/);
assert.throws(() => validateHero15MinimalDetail({ generatedText: partialTypeText, inputs }), /stale or non-deterministic/);
const unverifiedTypeInputs = structuredClone(partialTypeInputs);
delete unverifiedTypeInputs.profileInputs.ordinarySkillTypeEvidence.records[1].rawRecord.TypeText;
assert.throws(() => renderHero15MinimalDetail(unverifiedTypeInputs), /HERO15_TYPE_RECORD/);
assert.throws(() => validateHero15MinimalDetail({ generatedText: partialTypeText, inputs: unverifiedTypeInputs }), /HERO15_TYPE_RECORD/);
fails((x) => { x.profileInputs.ordinarySkillTypes.records.pop(); }, /HERO15_TYPE_SCOPE/);
const malformedType = structuredClone(generated);
malformedType.heroes[0].ordinarySkills[0].typeLabelKo = '治疗';
assert.throws(() => render(malformedType, talent, element()), /ordinary Skill consumer/);
fails((x) => { x.profileInputs.skillDecision.skills[0].skillId = 12350; }, /Skill publication scope/);
fails((x) => { x.profileInputs.skillDecision.skills[4].descriptionKo = '미검증 설명'; }, /Skill source or Korean display/);
fails((x) => { x.profileInputs.skillIdentities.records.find(({ skillId }) => skillId === 10801).descriptionCn += 'x'; }, /Skill source or Korean display/);
const invalidSkill = structuredClone(generated);
invalidSkill.heroes[0].ordinarySkills[0].range = 2;
assert.throws(() => render(invalidSkill, talent, element()), /ordinary Skill consumer/);
for (const cost of [null, 0, '1', 1.5]) {
  const malformedCost = structuredClone(generated);
  malformedCost.heroes[0].ordinarySkills[0].cost = cost;
  assert.throws(() => render(malformedCost, talent, element()), /ordinary Skill consumer/);
}
const soldierSection = container.children[0].children.find(({ children }) => children?.[0]?.textContent === '용병');
const soldierLinks = soldierSection.children[1].children.map(({ children }) => children[0]);
const expectedSoldierNames = ['하이랜더', '템플러', '하이엘프', '마법사', '신관', '퇴마사', '영종의 투승'];
const expectedSoldierLinks = [
  ['NORMAL', [210, 326, 602, 621, 802, 811, 815]],
  ['SP', [5210, 5326, 5602, 5621, 5802, 5811, 5815]],
].flatMap(([namespace, ids]) => ids.map((id, index) => [namespace, id, expectedSoldierNames[index]]));
assert.deepEqual(soldierLinks.map(({ textContent, href }) => [textContent, href]),
  expectedSoldierLinks.map(([namespace, id, name]) => [`${namespace} · ${name}`, `#${namespace.toLowerCase()}-soldier-${id}`]));
for (const [namespace, id, nameKo] of expectedSoldierLinks) {
  const { soldiers } = namespace === 'NORMAL' ? inputs.soldierInputs.normalPresentation : inputs.soldierInputs.spPresentation;
  const idKey = namespace === 'NORMAL' ? 'normalSoldierId' : 'spSoldierId';
  assert.deepEqual(soldiers.filter(row => row[idKey] === id).map(row => row.nameKo), [nameKo]);
}
const unpublishedSoldierLink = structuredClone(generated);
unpublishedSoldierLink.heroes[0].soldiers[0].fragment = 'normal-soldier-999999';
assert.throws(() => validateHero15MinimalDetail({
  generatedText: JSON.stringify(unpublishedSoldierLink, null, 2) + '\n', inputs,
}), /stale or non-deterministic/);
fails((x) => { x.soldierInputs.approval.navigation.status = 'NOT_APPROVED'; }, /Soldier navigation publication scope/);
fails((x) => { x.soldierInputs.spPresentation.soldiers.find(({ spSoldierId }) => spSoldierId === 5210).spSoldierId = 210; }, /Soldier navigation target/);
for (const mutate of [
  rows => rows.pop(),
  rows => { rows[1] = structuredClone(rows[0]); },
  rows => { [rows[0], rows[1]] = [rows[1], rows[0]]; },
  rows => { rows[0].namespace = 'SP'; },
  ...[806, 817, 819].map(id => rows => { rows[0].soldierId = id; }),
  rows => rows.push({ ...rows[0], soldierId: 819 }),
]) {
  fails(x => { mutate(x.soldierInputs.approval.soldiers); }, /Soldier public keys or order/);
}
fails(x => { x.soldierInputs.approval.soldiers[0].nameKo += '변조'; }, /Soldier names differ from the approved subset/);
assert.equal(inputs.soldierInputs.normalNames.records.length, 56);
for (const nameKo of ['무녀', '바람과 꽃을 찬송하는 자', '산별 구조대']) {
  assert.ok(inputs.soldierInputs.normalNames.records.every(row => row.nameKo !== nameKo));
  fails(x => { x.soldierInputs.approval.soldiers[0].nameKo = nameKo; }, /Soldier names differ from the approved subset/);
}
fails(x => { x.soldierInputs.normalNames.records = x.soldierInputs.normalNames.records.filter(row => row.soldierId !== 210); }, /Soldier name is unresolved/);
fails(x => { x.soldierInputs.normalPresentation.soldiers.find(row => row.normalSoldierId === 210).nameKo += '변조'; }, /Soldier navigation target mismatch/);
const wrongSoldierNamespace = structuredClone(generated);
wrongSoldierNamespace.heroes[0].soldiers[0].fragment = 'sp-soldier-5210';
assert.throws(() => render(wrongSoldierNamespace, talent, element()), /Soldier consumer/);
const commandSection = container.children[0].children.find(({ children }) => children?.[0]?.textContent === '병사 지휘 보정');
assert.deepEqual(commandSection.children[1].children.map(({ textContent }) => textContent), [
  '기본 지휘 · 생명 +15% · 마방 +15%',
  '최대 레벨 일반 유대 · 생명 +25% · 공격 +10% · 방어 +10% · 마방 +25%',
]);
fails((x) => { x.profileInputs.commandDecision.status = 'NOT_APPROVED'; }, /Soldier Command publication scope/);
fails((x) => { x.profileInputs.commandBase.records[0].heroId = 16; }, /Soldier Command owner values/);
fails((x) => { x.profileInputs.commandBase.records[0].base.at = 0; }, /Soldier Command owner values/);
fails((x) => { x.profileInputs.commandBond.records[0].contribution.hp = 40; }, /Soldier Command owner values/);
const leakedCommand = structuredClone(generated);
leakedCommand.heroes[0].soldierCommandLinesKo.push('최종 · 생명 +40%');
assert.throws(() => render(leakedCommand, talent, element()), /Soldier Command consumer/);
const goldSection = container.children[0].children.find(({ children }) => children?.[0]?.textContent === '유대 강화 골드');
assert.equal(goldSection.tag, 'details');
assert.equal(goldSection.children[0].tag, 'summary');
const goldGroups = goldSection.children.slice(1);
assert.equal(goldGroups.length, 6);
assert.ok(goldGroups.every(({ children }) => children[1].children.length === 9));
assert.equal(goldGroups[0].children[1].children[0].textContent, 'Lv.2 · 1,500 골드');
assert.equal(goldGroups[5].children[1].children[8].textContent, 'Lv.10 · 200,000 골드');
fails((x) => { x.profileInputs.goldDecision.status = 'NOT_APPROVED'; }, /Fetter Gold publication/);
fails((x) => { x.profileInputs.goldOwner.goldLocators[0].heroId = 16; }, /Fetter Gold level locator/);
fails((x) => { x.profileInputs.goldOwner.goldLocators[0].sourceArrayIndex = 1; }, /Fetter Gold level locator/);
fails((x) => { x.profileInputs.goldDecision.groups[0].gold[0] = 1501; }, /Fetter Gold values/);
const keyLine = '순박한 마음의 열쇠 ×45 · 순수한 마음의 열쇠 ×15';
assert.equal(renderBond1KeyTotals(inputs.profileInputs), keyLine);
for (const [mutate, error] of [
  [p => { delete p.bond1KeyDecision; }, /publication scope/],
  [p => { p.bond1KeyDecision.materials.reverse(); }, /publication scope/],
  [p => { p.bond1KeyDecision.approval.userText = 'other'; }, /publication scope/],
  [p => { delete p.bond1KeyDecision.approval.messageId; }, /approval message ID mismatch/],
  [p => { p.bond1KeyDecision.approval.messageId = 'other'; }, /approval message ID mismatch/],
  [p => { p.bond1KeyDecision.source.nameEvidence.sheet.blob = 'other'; }, /source version mismatch/],
  [p => { p.bond1KeyDecision.source.nameEvidence.items[0].legacyPng.blob = 'other'; }, /PNG source mismatch for ID 3200/],
  [p => { p.bond1KeyDecision.source.nameEvidence.items[1].sheetImage.title = '순박한 마음의 열쇠'; }, /sheet image source mismatch for ID 3201/],
  [p => { p.fetterReferences.records.find(r => r.fetterId === 66).fetterId = 67; }, /source endpoint/],
  [p => { p.goldOwner.materials.find(r => r.endpointId === 66).sourceArrayIndex++; }, /material locator/],
  [p => { p.goldOwner.itemEndpoints.find(r => r.itemId === 3201).endpointNamespace = 'other'; }, /ItemInfo endpoint/],
  [p => {
    const rows = p.fetterDetails.records.find(r => r.endpointId === 66).fields.LevelUpMaterials;
    [rows[0].Count, rows[1].Count] = [rows[1].Count, rows[0].Count];
  }, /levels or quantities/],
]) {
  const profile = structuredClone(inputs.profileInputs);
  mutate(profile);
  assert.throws(() => renderBond1KeyTotals(profile), error);
}
const bond2KeyLine = '순박한 마음의 열쇠 ×26 · 순수한 마음의 열쇠 ×69 · 빛나는 마음의 열쇠 ×16';
assert.equal(renderBond2KeyTotals(inputs.profileInputs), bond2KeyLine);
for (const [mutate, error] of [
  [p => { p.bond2KeyDecision.approval.messageId = 'bbb21ccc-89dc-453b-ba7a-d672d198235c'; }, /Bond 2 key approval message ID mismatch/],
  [p => { p.bond2KeyDecision.approval.scope = p.bond1KeyDecision.approval.scope; }, /Bond 2 key approval scope mismatch/],
  [p => { p.fetterReferences.records.find(r => r.fetterId === 67).endpointNamespace = 'other'; }, /Bond 2 key source endpoint mismatch/],
  [p => { p.goldOwner.materials.find(r => r.endpointId === 67).itemId = 3202; }, /Bond 2 key material locator mismatch/],
  [p => { p.goldOwner.itemEndpoints.find(r => r.itemId === 3202).sourceRecordLocator = 'ConfigDataItemInfo#ID=3201'; }, /Bond 2 key ItemInfo endpoint mismatch/],
  [p => {
    const rows = p.fetterDetails.records.find(r => r.endpointId === 67).fields.LevelUpMaterials;
    [rows[0].Count, rows[2].Count] = [rows[2].Count, rows[0].Count];
    const recorded = p.bond2KeyDecision.sourceRows;
    [recorded[0].count, recorded[2].count] = [recorded[2].count, recorded[0].count];
  }, /Bond 2 key source rows or quantities mismatch/],
  [p => {
    const [, second, third] = p.bond2KeyDecision.materials;
    [second.nameKo, third.nameKo] = [third.nameKo, second.nameKo];
  }, /Bond 2 key publication scope mismatch/],
  [p => {
    const [, second, third] = p.bond2KeyDecision.source.nameEvidence.items;
    [second.sheetImage, third.sheetImage] = [third.sheetImage, second.sheetImage];
  }, /Bond 2 key sheet image source mismatch for ID 3201/],
]) {
  const profile = structuredClone(inputs.profileInputs);
  mutate(profile);
  assert.throws(() => renderBond2KeyTotals(profile), error);
}
const bond1Line = 'Lv.2~10 합계 골드 118,600';
for (const mutate of [
  p => { delete p.bond1GoldDecision; },
  p => { p.bond1GoldDecision.fetterId = 67; },
  p => { p.bond1GoldDecision.sourceField = 'LevelUpMaterials'; },
  p => { p.bond1GoldDecision.approvalMessageId = 'other'; },
  p => { p.bond1GoldDecision.totalGold++; },
]) fails(x => mutate(x.profileInputs), /유대 1 Gold total approval/);
fails(x => { x.profileInputs.fetterReferences.records[0].fetterId = 15; }, /유대 1 Gold total endpoint/);
fails(x => { x.profileInputs.goldOwner.goldLocators.splice(0, 1); }, /Fetter Gold publication scope/);
fails(x => { x.profileInputs.goldOwner.goldLocators[0].targetLevel = 3; }, /Fetter Gold level locator/);
fails(x => { x.profileInputs.goldOwner.goldLocators.splice(0, 2, ...x.profileInputs.goldOwner.goldLocators.slice(0, 2).reverse()); }, /유대 1 Gold total locator/);
fails(x => {
  for (const values of [x.profileInputs.fetterDetails.records[0].fields.LevelUpGold, x.profileInputs.goldDecision.groups[0].gold]) {
    values[0]++; values[1]--;
  }
}, /유대 1 Gold total source vector/);
for (const mutate of [
  p => { delete p.bond2GoldDecision; },
  p => { p.bond2GoldDecision.fetterId = 66; },
  p => { p.bond2GoldDecision.approval.quote = 'other'; },
  p => { p.bond2GoldDecision.sourceRecordLocator = '/65'; },
  p => { p.bond2GoldDecision.sourceField = 'LevelUpMaterials'; },
  p => { p.bond2GoldDecision.sourceArrayIndices.reverse(); },
  p => { p.bond2GoldDecision.targetLevels.reverse(); },
  p => { p.bond2GoldDecision.totalGold++; },
]) fails(x => mutate(x.profileInputs), /유대 2 Gold total approval/);
fails(x => {
  const ref = x.profileInputs.fetterReferences.records.find(r => r.fetterId === 67);
  x.profileInputs.fetterReferences.records.push({ ...ref });
}, /유대 2 Gold total endpoint|Bond 2/);
fails(x => {
  const locators = x.profileInputs.goldOwner.goldLocators;
  const first = locators.findIndex(r => r.endpointId === 67);
  [locators[first], locators[first + 1]] = [locators[first + 1], locators[first]];
}, /유대 2 Gold total locator/);
fails(x => {
  const { fetterDetails, goldDecision } = x.profileInputs;
  for (const values of [fetterDetails.records.find(r => r.endpointId === 67).fields.LevelUpGold,
    goldDecision.groups.find(r => r.endpointId === 67).gold]) {
    [values[0], values[1]] = [values[1], values[0]];
  }
}, /유대 2 Gold total source vector/);
for (const [decisionKey, endpointId, endpointError] of [
  ['bond3GoldDecision', 68, /유대 3 Gold total endpoint|Bond 3 description/],
  ['bond4GoldDecision', 69, /유대 4 Gold total endpoint|Bond 4[/]5 description/],
  ['bond5GoldDecision', 70, /유대 5 Gold total endpoint|Bond 4[/]5 description/],
]) {
  for (const mutate of [
    p => { delete p[decisionKey]; },
    p => { p[decisionKey].approvalMessageId = 'other'; },
    p => { p[decisionKey].surface = 'hero-minimal-detail-16'; },
    p => { p[decisionKey].fetterId = 67; },
    p => { p[decisionKey].sourceRecordLocator = '/66'; },
    p => { p[decisionKey].sourceField = 'LevelUpMaterials'; },
    p => { p[decisionKey].totalGold++; },
  ]) fails(x => mutate(x.profileInputs), /유대 [345] Gold total approval/);
  for (const mutate of [
    (records, i) => { records.splice(i, 1); },
    (records, i) => { records.push({ ...records[i] }); },
    (records, i) => { records[i].fetterId = 99; },
  ]) fails(x => {
    const refs = x.profileInputs.fetterReferences.records;
    mutate(refs, refs.findIndex(row => row.fetterId === endpointId));
  }, endpointError);
  for (const mutate of [
    (rows, i) => { rows.splice(i, 1); },
    (rows, i) => { rows[i].targetLevel = rows[i + 1].targetLevel; },
    (rows, i) => { rows[i].sourceArrayIndex = rows[i + 1].sourceArrayIndex; },
    (rows, i) => { rows[i].sourceField = 'LevelUpMaterials'; },
    (rows, i) => { rows[i].sourceRecordLocator = 'ConfigDataHeroFetterInfo#ID=67'; },
    (rows, i) => { [rows[i], rows[i + 1]] = [rows[i + 1], rows[i]]; },
  ]) fails(x => {
    const rows = x.profileInputs.goldOwner.goldLocators;
    mutate(rows, rows.findIndex(row => row.endpointId === endpointId));
  }, /Fetter Gold publication scope|Fetter Gold level locator|유대 [345] Gold total locator/);
  for (const mutate of [
    values => { values[0]++; },
    values => { [values[0], values[1]] = [values[1], values[0]]; },
  ]) fails(x => {
    const { fetterDetails, goldDecision } = x.profileInputs;
    mutate(fetterDetails.records.find(row => row.endpointId === endpointId).fields.LevelUpGold);
    mutate(goldDecision.groups.find(row => row.endpointId === endpointId).gold);
  }, /유대 [345] Gold total source vector/);
}
for (const mutate of [
  p => { delete p.heartGoldDecision; },
  p => { p.heartGoldDecision.approvalMessageId = 'other'; },
  p => { p.heartGoldDecision.endpointKind = 'FETTER'; },
  p => { p.heartGoldDecision.heartFetterId = 70; },
  p => { p.heartGoldDecision.sourceRecordLocator = '/69'; },
  p => { p.heartGoldDecision.totalGold++; },
]) fails(x => mutate(x.profileInputs), /Heart Fetter Gold total approval scope mismatch/);

// Keep ID 15 and the approved amounts in three independent ordinary-Fetter substitutions.
const ordinaryNamespace = 'ConfigDataHeroFetterInfo.ID';
const heartRef = row => row.referenceKind === 'HERO_HEART_FETTER_ID_REFERENCE' && row.heroId === 15;
fails(({ profileInputs }) => {
  const ref = profileInputs.fetterReferences.records.find(heartRef);
  ref.referenceKind = 'HERO_FETTER_ID_REFERENCE';
  ref.fetterId = ref.heartFetterId;
  delete ref.heartFetterId;
  ref.sourceField = 'ConfigDataHeroInformationInfo.HeroFetters_ID';
  ref.endpointNamespace = ordinaryNamespace;
}, /Heart Fetter Gold total selection relation mismatch/);
fails(({ profileInputs }) => {
  Object.assign(profileInputs.heartFetterDetails.records.find(row => row.heroId === 15 && row.endpointId === 15), {
    detailKind: 'FETTER_RAW_DETAIL', endpointNamespace: ordinaryNamespace, sourceRecordLocator: 'ConfigDataHeroFetterInfo#ID=15',
  });
}, /Heart Fetter Gold total detail mismatch/);
fails(({ profileInputs }) => {
  const rows = profileInputs.goldOwner.goldLocators.filter(row => row.heroId === 15 && row.endpointKind === 'HEART_FETTER' && row.endpointId === 15);
  assert.equal(rows.length, 9);
  for (const row of rows) Object.assign(row, { endpointKind: 'FETTER', endpointNamespace: ordinaryNamespace });
}, /Heart Fetter Gold total level locator mismatch/);

for (const mutate of [
  (rows, i) => { rows.splice(i, 1); },
  (rows, i) => { rows.push({ ...rows[i] }); },
]) {
  fails(({ profileInputs }) => {
    const refs = profileInputs.fetterReferences.records;
    mutate(refs, refs.findIndex(heartRef));
  }, /Heart Fetter Gold total selection relation mismatch/);
  fails(({ profileInputs }) => {
    const records = profileInputs.heartFetterDetails.records;
    mutate(records, records.findIndex(row => row.heroId === 15 && row.endpointId === 15));
  }, /Heart Fetter Gold total detail mismatch/);
}
for (const mutate of [
  (rows, i) => { rows.splice(i, 1); },
  (rows, i) => { rows[i].sourceArrayIndex = rows[i + 1].sourceArrayIndex; },
  (rows, i) => { rows[i].targetLevel = rows[i + 1].targetLevel; },
  (rows, i) => { rows[i].endpointNamespace = ordinaryNamespace; },
  (rows, i) => { [rows[i], rows[i + 1]] = [rows[i + 1], rows[i]]; },
]) fails(({ profileInputs }) => {
  const rows = profileInputs.goldOwner.goldLocators;
  mutate(rows, rows.findIndex(row => row.heroId === 15 && row.endpointKind === 'HEART_FETTER'));
}, /Fetter Gold publication scope|Heart Fetter Gold total level locator mismatch/);
for (const mutate of [
  values => { values[0]++; },
  values => { [values[0], values[8]] = [values[8], values[0]]; },
]) fails(({ profileInputs }) => {
  mutate(profileInputs.heartFetterDetails.records.find(row => row.heroId === 15 && row.endpointId === 15).fields.LevelUpGold);
  mutate(profileInputs.goldDecision.groups.find(row => row.endpointKind === 'HEART_FETTER').gold);
}, /Heart Fetter Gold total source vector or total mismatch/);
const bond2Line = 'Lv.2~10 합계 골드 383,500';
const bond3Line = 'Lv.2~10 합계 골드 736,000';
const bond4Line = 'Lv.2~10 합계 골드 1,186,000';
const bond5Line = 'Lv.2~10 합계 골드 1,523,000';
const heartLine = 'Lv.2~10 합계 골드 650,000';
for (const [mode, expectedTotals] of [
  ['approved', [bond1Line, bond2Line, bond3Line, bond4Line, bond5Line, heartLine]],
  ['bond1-change', [null, bond2Line, bond3Line, bond4Line, bond5Line, heartLine]],
  ['bond1-swap', [null, bond2Line, bond3Line, bond4Line, bond5Line, heartLine]],
  ['bond2-change', [bond1Line, null, bond3Line, bond4Line, bond5Line, heartLine]],
  ['bond2-swap', [bond1Line, null, bond3Line, bond4Line, bond5Line, heartLine]],
  ['bond3-change', [bond1Line, bond2Line, null, bond4Line, bond5Line, heartLine]],
  ['bond3-swap', [bond1Line, bond2Line, null, bond4Line, bond5Line, heartLine]],
  ['bond3-copy', [bond1Line, bond2Line, null, bond4Line, bond5Line, heartLine]],
  ['bond4-copy', [bond1Line, bond2Line, bond3Line, null, bond5Line, heartLine]],
  ['bond4-change', [bond1Line, bond2Line, bond3Line, null, bond5Line, heartLine]],
  ['bond4-swap', [bond1Line, bond2Line, bond3Line, null, bond5Line, heartLine]],
  ['bond5-copy', [bond1Line, bond2Line, bond3Line, bond4Line, null, heartLine]],
  ['bond5-change', [bond1Line, bond2Line, bond3Line, bond4Line, null, heartLine]],
  ['bond5-swap', [bond1Line, bond2Line, bond3Line, bond4Line, null, heartLine]],
  ['heart-copy', [bond1Line, bond2Line, bond3Line, bond4Line, bond5Line, null]],
  ['heart-change', [bond1Line, bond2Line, bond3Line, bond4Line, bond5Line, null]],
  ['heart-swap', [bond1Line, bond2Line, bond3Line, bond4Line, bond5Line, null]],
  ['heart-to-bond5', [bond1Line, bond2Line, bond3Line, bond4Line, null, heartLine]],
]) {
  const sample = structuredClone(generated);
  const first = sample.heroes[0].fetterGold[0].rows;
  const second = sample.heroes[0].fetterGold[1].rows;
  if (mode === 'bond1-change') first[0].gold++;
  if (mode === 'bond1-swap') [first[0].gold, first[1].gold] = [first[1].gold, first[0].gold];
  if (mode === 'bond2-change') second[8].gold++;
  if (mode === 'bond2-swap') [second[0].gold, second[8].gold] = [second[8].gold, second[0].gold];
  const third = sample.heroes[0].fetterGold[2].rows;
  if (mode === 'bond3-change') third[8].gold++;
  if (mode === 'bond3-swap') [third[0].gold, third[8].gold] = [third[8].gold, third[0].gold];
  const fourth = sample.heroes[0].fetterGold[3].rows;
  if (mode === 'bond4-change') fourth[0].gold++;
  if (mode === 'bond4-swap') [fourth[0].gold, fourth[8].gold] = [fourth[8].gold, fourth[0].gold];
  const fifth = sample.heroes[0].fetterGold[4].rows;
  if (mode === 'bond5-change') fifth[0].gold++;
  if (mode === 'bond5-swap') [fifth[0].gold, fifth[8].gold] = [fifth[8].gold, fifth[0].gold];
  const heart = sample.heroes[0].fetterGold[5].rows;
  if (mode === 'heart-change') heart[0].gold++;
  if (mode === 'heart-swap') [heart[0].gold, heart[8].gold] = [heart[8].gold, heart[0].gold];
  if (mode === 'heart-to-bond5') fifth.forEach((row, i) => { row.gold = heart[i].gold; });
  if (mode === 'heart-copy') {
    sample.heroes[0].fetterGold[5].rows.forEach((row, i) => { row.gold = fifth[i].gold; });
  }
  if (mode === 'bond5-copy') {
    sample.heroes[0].fetterGold[4].rows.forEach((row, i) => { row.gold = fourth[i].gold; });
  }
  if (mode === 'bond4-copy') {
    sample.heroes[0].fetterGold[3].rows.forEach((row, i) => { row.gold = third[i].gold; });
  }
  if (mode === 'bond3-copy') {
    sample.heroes[0].fetterGold[2].rows.forEach((row, i) => { row.gold = second[i].gold; });
  }
  const output = element();
  render(sample, talent, output);
  const groups = output.children[0].children.find(n => n.children?.[0]?.textContent === '유대 강화 골드').children.slice(1);
  assert.deepEqual(groups.map(g => g.children[0].textContent), ['유대 1', '유대 2', '유대 3', '유대 4', '유대 5', '마음의 유대']);
  for (const [i, section] of groups.entries()) {
    assert.deepEqual(section.children[1].children.map(row => row.textContent), sample.heroes[0].fetterGold[i].rows.map(
      ({ level, gold }) => `Lv.${level} · ${gold.toLocaleString('ko-KR')} 골드`));
    const expected = expectedTotals[i] ? [expectedTotals[i]] : [];
    if (i === 0) expected.push(keyLine);
    if (i === 1) expected.push(bond2KeyLine);
    assert.deepEqual(section.children.slice(2).map(row => row.textContent), expected);
  }
}
const leakedGold = structuredClone(generated);
leakedGold.heroes[0].fetterGold[0].rows[0].itemId = 3200;
assert.throws(() => render(leakedGold, talent, element()), /Fetter Gold consumer/);
const jobSection = container.children[0].children.find(({ children }) => children?.[0]?.textContent === '전직');
assert.deepEqual(jobSection.children[1].children.map(({ textContent }) => textContent), [
  'T2 시스터 → T3 주교', 'T2 시스터 → T3 프리스트', 'T2 시스터 → T3 서모너',
  'T3 프리스트 → T4 프로핏 · 기본 사거리 2 · 보행 · 이동력 3',
  'T3 서모너 → T4 허미트 · 기본 사거리 2 · 보행 · 이동력 3',
]);
fails((x) => { x.jobInputs.rankDecision.status = 'NOT_APPROVED'; }, /Job rank publication scope/);
fails((x) => { x.jobInputs.rankDecision.rows[0].connectionId = 151; }, /Job rank display mismatch/);
fails((x) => { x.jobInputs.rankDecision.rows[0].rank = 3; }, /Job rank display mismatch/);
fails((x) => { x.jobInputs.jobLevelStats.records.find(({ heroId }) => heroId === 15).jobRank = 4; }, /Job rank display mismatch/);
const wrongRank = structuredClone(generated);
wrongRank.heroes[0].jobPaths[0].fromRank = 3;
assert.throws(() => render(wrongRank, talent, element()), /Job consumer/);
const expectedHeartFetterLabels = [
  ['Lv.4 · 부대 생명이 50% 미만일 시, 받는 피해 -10%', 'Lv.7 · 공격하여 전투 진입 시, 주는 피해 +10%'],
  ['Lv.4 · 원거리 공격을 받을 시, 받는 마법 피해 -10%', 'Lv.7 · 물리 공격을 받아 전투 진입 시, 주는 피해 +10%'],
];
const jobRows = jobSection.children[1].children;
assert.ok(jobRows.slice(0, 3).every(({ children }) => children.length === 0));
for (const [index, labels] of expectedHeartFetterLabels.entries()) {
  const [effectsSection] = jobRows[index + 3].children;
  assert.equal(effectsSection.children[0].textContent, '마음의 유대');
  assert.deepEqual(effectsSection.children[1].children.map(({ textContent }) => textContent), labels);
}
assert.doesNotMatch(generatedText, /7042[1-4]|conditionParams|conditionType|职业为/);
fails((x) => { x.jobInputs.effectsDecision.status = 'NOT_APPROVED'; }, /Heart Fetter display scope/);
fails((x) => { x.jobInputs.effectsDecision.heroId = 16; }, /Heart Fetter display scope/);
fails((x) => { x.jobInputs.effectsDecision.rows[0].connectionId = 155; }, /Heart Fetter display row/);
fails((x) => { x.jobInputs.effectsDecision.rows[0].jobId = 707; }, /Heart Fetter display row/);
fails((x) => { x.jobInputs.effectsDecision.rows[0].level = 10; }, /Heart Fetter display row/);
fails((x) => { x.jobInputs.effectsDecision.rows[0].skillId = 70422; }, /Heart Fetter display row/);
fails((x) => { x.jobInputs.effectsDecision.rows[0].descriptionKo = '부대 생명이 50% 미만일 시, 받는 피해 +10%'; }, /Heart Fetter display row/);
fails((x) => { x.jobInputs.effectsDecision.rows[2].descriptionKo = '원거리 공격을 받을 시, 받는 물리 피해 -10%'; }, /Heart Fetter display row/);
fails((x) => { x.jobInputs.heartFetterLevels.records.find(({ skillId }) => skillId === 70421).heartFetterLevel = 7; }, /Heart Fetter display row/);
const invalidEffect = structuredClone(generated);
invalidEffect.heroes[0].jobPaths[3].heartFetterEffects[0].level = 10;
assert.throws(() => render(invalidEffect, talent, element()), /Job consumer/);
const leakedEffect = structuredClone(generated);
leakedEffect.heroes[0].jobPaths[4].heartFetterEffects[0].skillId = 70422;
assert.throws(() => render(leakedEffect, talent, element()), /Job consumer/);
fails((x) => { x.jobInputs.approval.paths.pop(); }, /approved direct edges/);
assert.doesNotMatch(generatedText, /BF_AttackDistance|BF_MovePoint|MoveType|connectionId|jobId|4cbcac591ff5bc8d7cf2dcbf971cf2465f0cb133/);
fails((x) => { x.jobInputs.movement.records[0].jobId = 806; }, /final Job movement row/);
fails((x) => { x.jobInputs.movement.records[1].heroId = 16; }, /final Job movement row/);
fails((x) => { x.jobInputs.movement.records[1].connectionId = 154; }, /final Job movement row/);
fails((x) => { x.jobInputs.movement.records[1].BF_AttackDistance = 1; }, /final Job movement row/);
fails((x) => { x.jobInputs.movement.records[0].BF_MovePoint = 5; }, /final Job movement row/);
fails((x) => { delete x.jobInputs.movement.records[0].MoveType; }, /final Job movement row/);
fails((x) => {
  x.jobInputs.movement.records[0].MoveType = 3;
  x.jobInputs.movementDecision.source.records[0].fields.MoveType = 3;
}, /final Job movement row/);
const invalidJob = structuredClone(generated);
invalidJob.heroes[0].jobPaths.find(({ toNameKo }) => toNameKo === '프리스트').baseAttributesKo = '기본 사거리 2 · 보행 · 이동력 3';
assert.throws(() => render(invalidJob, talent, element()), /Job consumer/);
const leakedJob = structuredClone(generated);
leakedJob.heroes[0].jobPaths.find(({ toNameKo }) => toNameKo === '허미트').jobId = 707;
assert.throws(() => render(leakedJob, talent, element()), /Job consumer/);
fails((x) => { x.soldierInputs.approval.soldiers.pop(); }, /Soldier public keys or order/);
assert.equal(navigation.showTarget(15), true);
assert.equal(target.scrolled, true);
assert.equal(navigation.showTarget(16), false);
const leaked = structuredClone(generated);
leaked.heroes[0].profile.origins = [];
assert.throws(() => render(leaked, talent, element()), /profile consumer/);

const oldApp = await readFile('tools/fixtures/hero-15-soldier-text-base-app.js');
const baseDetail = await readFile(HERO_15_MINIMAL_DETAIL_PATH);
assert.equal(createHash('sha256').update(oldApp).digest('hex'), '0571fea422f3e7c9d82380a0a8a44947677e957aef9d9c50a6ff12276cbeafe6');
assert.equal(createHash('sha256').update(baseDetail).digest('hex'), 'ff6404711698bdd04e426097e09f9a735ed2c16e34693174d0e3974433859021');

const textInputs = await readHero15SoldierTextInputs();
const textBytes = await readFile(HERO_15_SOLDIER_TEXT_PUBLIC);
const textData = JSON.parse(textBytes);
const expectedTextRows = [
  { soldierId: 806, namespace: 'NORMAL', nameKo: '무녀' },
  { soldierId: 817, namespace: 'NORMAL', nameKo: '바람과 꽃을 찬송하는 자' },
  { soldierId: 819, namespace: 'NORMAL', nameKo: '산별 구조대' },
];
assert.deepEqual(textData, { schemaVersion: 1, heroId: 15, soldiers: expectedTextRows });
validateHero15SoldierText({ bytes: textBytes, app: frontend, inputs: textInputs });
for (const { nameKo } of expectedTextRows) assert.ok(!frontend.includes(nameKo));

const failText = (mutate, pattern) => {
  const changed = structuredClone(textInputs);
  mutate(changed);
  assert.throws(() => renderHero15SoldierText(changed), pattern);
};
for (const mutate of [
  x => { delete x.status; },
  x => { x.heroId = 16; },
  x => { x.soldiers.pop(); },
  x => { x.soldiers[1] = x.soldiers[0]; },
  x => { x.soldiers.reverse(); },
  x => { x.soldiers[0].fragment = '#normal-soldier-806'; },
  x => { x.soldiers[0].namespace = 'SP'; },
  x => { x.soldiers[0].nameKo = '변경'; },
  x => { x.soldiers[0].soldierId = 818; },
]) failText(x => mutate(x.decision), /independently approved/);
for (const mutate of [
  x => { delete x.tierDecision; },
  x => { x.tierDecision.approvalMessageId = x.decision.approvalMessageId; },
  x => { x.tierDecision.heroId = 16; },
  x => { x.tierDecision.soldiers[0] = { soldierId: 210, namespace: 'NORMAL', nameKo: '하이랜더', rank: 3 }; },
  x => { x.tierDecision.soldiers[0].namespace = 'SP'; },
  x => { x.tierDecision.soldiers[0].rank = 2; },
  x => { x.tierDecision.soldiers[0].nameKo = '변경'; },
  x => { x.tierDecision.soldiers[1] = x.tierDecision.soldiers[0]; },
  x => { x.tierDecision.soldiers.pop(); },
  x => { x.tierDecision.soldiers.reverse(); },
]) failText(mutate, /tier decision/);
failText(x => { x.rankRows[0].rank = 2; }, /Rank evidence/);
failText(x => { x.rankRows[0].soldierId = 210; }, /Rank evidence/);
for (const id of [806, 817, 819]) {
  failText(x => { x.names = x.names.filter(row => row.soldierId !== id); }, /Owner or public endpoint mismatch/);
  failText(x => { x.names.push(x.names.find(row => row.soldierId === id)); }, /Owner or public endpoint mismatch/);
  failText(x => { x.names.find(row => row.soldierId === id).nameKo = '변경'; }, /Owner or public endpoint mismatch/);
  failText(x => { x.publicIdentities.push({ id, variant: 'NORMAL' }); }, /Owner or public endpoint mismatch/);
  failText(x => { x.relationInputs.soldiers.records = x.relationInputs.soldiers.records.filter(row => row.id !== id); }, /identity endpoint/);
  failText(x => { x.relationInputs.soldiers.records.push(x.relationInputs.soldiers.records.find(row => row.id === id)); }, /identity endpoint/);
  failText(x => { x.relationInputs.soldiers.records.find(row => row.id === id).variant = 'SP'; }, /identity endpoint/);
  failText(x => { x.relationInputs.relations.records.find(row => row.heroId === 15 && row.soldierId === id).heroId = 16; }, /relation keys or order/);
  failText(x => { x.relationInputs.relations.records.push(x.relationInputs.relations.records.find(row => row.heroId === 15 && row.soldierId === id)); }, /relation keys or order/);
}
const substituted = structuredClone(textInputs);
substituted.decision.soldiers[0] = { soldierId: 210, namespace: 'NORMAL', nameKo: '하이랜더' };
assert.ok(substituted.names.some(row => row.soldierId === 210 && row.nameKo === '하이랜더'));
assert.ok(substituted.relationInputs.relations.records.some(row => row.heroId === 15 && row.soldierId === 210));
assert.throws(() => validateHero15SoldierText({
  bytes: Buffer.from(JSON.stringify({ ...textData, soldiers: substituted.decision.soldiers }, null, 2) + '\n'),
  app: frontend, inputs: substituted,
}), /independently approved/);
assert.throws(() => validateHero15SoldierText({ bytes: Buffer.concat([textBytes, Buffer.from(' ')]), app: frontend, inputs: textInputs }), /stale/);
const differentDigestApp = frontend.replace(/integrity: 'sha256-[^']+'/, "integrity: 'sha256-" + Buffer.alloc(32).toString('base64') + "'");
assert.throws(() => validateHero15SoldierText({ bytes: textBytes, app: differentDigestApp, inputs: textInputs }), /app integrity/);

// Run both complete startup paths. The DOM double only provides the methods the app uses.
// Responses used for the integrity regression go through native Fetch and its real byte check.
const appImport = "import { selectSkinFullarts } from './skin-fullart-presentation.mjs';";
const dataUrl = bytes => 'data:application/json;base64,' + Buffer.from(bytes).toString('base64');
const realTextResponse = options => fetch(dataUrl(textBytes), options);
const originalLinks = expectedSoldierLinks.map(([ns, id, name]) => [`${ns} · ${name}`, `#${ns.toLowerCase()}-soldier-${id}`]);

async function startApp(source, optionalResponse) {
  const roots = new Map();
  const errors = [];
  const requestedText = [];
  const node = tag => ({
    ...element(), tag, isConnected: true, textContent: '', value: '', options: [],
    listeners: new Map(),
    addEventListener(event, handler) { this.listeners.set(event, handler); },
    setAttribute(name, value) { this[name] = value; },
  });
  function root(selector) {
    if (!roots.has(selector)) roots.set(selector, node('root'));
    return roots.get(selector);
  }
  function* descendants(elements) {
    for (const item of elements) {
      yield item;
      yield* descendants(item.children);
    }
  }
  const document = {
    baseURI: 'http://localhost/',
    querySelector: root,
    createElement: node,
    createTextNode: textContent => ({ ...node('#text'), textContent }),
    getElementById: id => [...descendants(roots.values())].find(item => item.id === id),
  };
  assert.ok(source.startsWith(appImport));
  const observeOptional = source === frontend ? `
    const loadOptional = loadHero15SoldierText;
    loadHero15SoldierText = list => (optional = loadOptional(list));
  ` : '';
  const startup = runInNewContext(`(async () => {
    let optional;
    ${observeOptional}
    ${source.slice(appImport.length)}
    return { optional, loadAgain: ${source === frontend ? 'loadOptional' : 'null'} };
  })()`, {
    document, window: { location: { hash: '' }, requestAnimationFrame() {} },
    console: { error: error => errors.push(error) },
    URL, selectSkinFullarts,
    fetch: (path, options) => {
      if (path === './' + HERO_15_SOLDIER_TEXT_PUBLIC) {
        requestedText.push(options);
        return optionalResponse(options);
      }
      return readFile(path).then(bytes => new Response(bytes));
    },
  });
  const timeout = setTimeout(() => {
    throw new Error('App startup waited on the optional Hero 15 Soldier response');
  }, 5000);
  let status;
  try {
    status = await startup;
  } finally {
    clearTimeout(timeout);
  }
  assert.deepEqual(errors, []);
  const [card] = root('#hero-minimal-detail-15-content').children;
  assert.equal(card?.className, 'hero-minimal-detail-card');
  const totals = [...descendants(roots.values())].filter(node => node.textContent === bond1Line);
  assert.equal(totals.length, source === frontend ? 1 : 0);
  if (totals.length) assert.ok([...descendants([card])].includes(totals[0]));
  const list = card.children.find(section => section.children[0]?.textContent === '용병').children[1];
  const indexLink = document.getElementById('hero-index-entry-15').children[0];
  assert.equal(indexLink.href, '#hero-minimal-detail-15');
  assert.equal(root('#hero-minimal-detail-16-content').children[0]?.className, 'hero-minimal-detail-card');
  assert.ok(root('#heroes').children.length > 0);
  assert.equal(root('#hero-index-results').children.length, 267);
  for (const [ns, prefix, count] of [['NORMAL', 'normal', 56], ['SP', 'sp', 56]]) {
    const cards = root(`#${prefix}-soldiers`).children;
    assert.equal(cards.filter(card => card.tag === 'article').length, count);
    assert.ok(root(`#${prefix}-soldier-search`).listeners.has('input'));
    for (const [, id, name] of expectedSoldierLinks.filter(row => row[0] === ns)) {
      const matches = cards.filter(card => card.id === `${prefix}-soldier-${id}`);
      assert.equal(matches.length, 1);
      assert.equal(matches[0].children[0].children[0].textContent, name);
    }
    assert.ok(expectedTextRows.every(({ soldierId }) => !cards.some(card => card.id === `${prefix}-soldier-${soldierId}`)));
  }
  return { ...status, requestedText, list };
}

function checkRows(list, expected = []) {
  assert.deepEqual(list.children.slice(0, 14).map(item => [item.children[0].textContent, item.children[0].href]), originalLinks);
  assert.deepEqual(list.children.slice(14).map(item => [item.tag, item.textContent, item.children.length, item.id]),
    expected.map(row => ['li', `T3 ${row.nameKo}`, 0, undefined]));
}

for (const [source, response, expected] of [
  [oldApp.toString(), () => Promise.resolve(new Response(null, { status: 404 })), []],
  [oldApp.toString(), realTextResponse, []],
  [frontend, () => Promise.resolve(new Response(null, { status: 404 })), []],
  [frontend, realTextResponse, expectedTextRows],
]) {
  const app = await startApp(source, response);
  await app.optional;
  assert.equal(app.requestedText.length, source === frontend ? 1 : 0);
  checkRows(app.list, expected);
}

const tampered = textBytes.toString().replace('무녀', '변경');
let nativeIntegrityError;
const integrityFailure = await startApp(frontend, async options => {
  assert.match(options.integrity, /^sha256-/);
  try {
    return await fetch(dataUrl(tampered), options);
  } catch (error) {
    nativeIntegrityError = error;
    throw error;
  }
});
await integrityFailure.optional;
assert.match(nativeIntegrityError?.cause?.message ?? '', /integrity mismatch/);
checkRows(integrityFailure.list);

for (const response of [
  () => Promise.reject(new Error('request rejected')),
  () => Promise.resolve(new Response('{invalid')),
  ...[
    { ...textData, schemaVersion: 2 }, { ...textData, heroId: 16 },
    { ...textData, soldiers: {} }, { ...textData, soldiers: expectedTextRows.slice(1) },
    { ...textData, soldiers: [...expectedTextRows].reverse() },
    ...[
      { soldierId: 210 }, { nameKo: '' }, { namespace: 'SP' }, { fragment: '#normal-soldier-806' },
    ].map(change => ({ ...textData, soldiers: [{ ...expectedTextRows[0], ...change }, ...expectedTextRows.slice(1)] })),
  ].map(value => () => Promise.resolve(Response.json(value))),
]) {
  const app = await startApp(frontend, response);
  await app.optional;
  checkRows(app.list);
}

const request = Promise.withResolvers();
const requestPending = await startApp(frontend, () => request.promise);
checkRows(requestPending.list);
request.resolve(await realTextResponse(requestPending.requestedText[0]));
await requestPending.optional;
checkRows(requestPending.list, expectedTextRows);

const body = Promise.withResolvers();
const bodyPending = await startApp(frontend, () => Promise.resolve({ ok: true, json: () => body.promise }));
checkRows(bodyPending.list);
body.resolve(await (await realTextResponse(bodyPending.requestedText[0])).json());
await bodyPending.optional;
checkRows(bodyPending.list, expectedTextRows);
await bodyPending.loadAgain(bodyPending.list);
checkRows(bodyPending.list, expectedTextRows);

const late = Promise.withResolvers();
const detached = await startApp(frontend, () => late.promise);
detached.list.isConnected = false;
late.resolve(await realTextResponse(detached.requestedText[0]));
await detached.optional;
checkRows(detached.list);

process.stdout.write('Hero 15 Minimal Detail regression: PASS (Owner, existing publication, optional integrity and startup compatibility)\n');
