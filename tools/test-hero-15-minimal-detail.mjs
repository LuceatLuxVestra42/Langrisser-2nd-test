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
assert.deepEqual(Object.keys(generated.heroes[0]).sort(), ['awakeningMaterials', 'bond2DescriptionKo', 'bond3DescriptionKo', 'bond4DescriptionKo', 'bond5DescriptionKo', 'centralDisciplineEffectKo', 'exclusiveEquipment', 'fetterGold', 'heroId', 'jobPaths', 'nameKo', 'ordinarySkills', 'profile', 'soldierCommandLinesKo', 'soldiers']);
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
const existingSkills = inputs.profileInputs.skillDecision.skills.map(({ skillId, nameKo, descriptionKo }) =>
  descriptionKo === undefined ? { skillId, nameKo } : { skillId, nameKo, descriptionKo });
assert.deepEqual(generated.heroes[0].ordinarySkills, existingSkills.map((row, index) => ({ ...row, cost: expectedCosts[index] })));
const expectedSkillLabels = existingSkills.map(({ nameKo, descriptionKo }, index) => [
  nameKo, `${expectedCosts[index]}코스트`, descriptionKo,
].filter(Boolean).join(' · '));
assert.deepEqual(skillLabels, expectedSkillLabels);
assert.equal(skillLabels[4], '빙결 · 1코스트');
assert.equal(skillLabels[5], '광역 실드 · 2코스트');
assert.equal(skillLabels[7], '명상 · 1코스트');
assert.doesNotMatch(generatedText, /SkillCost|shardCost|legacyCostLabel|sourceDescSha256|catalogLine|withheldDescriptionReason/);
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
  existingSkills[0], ...generated.heroes[0].ordinarySkills.slice(1),
]);
const partialContainer = element();
render(partialCostData, talent, partialContainer);
const partialSkillSection = partialContainer.children[0].children.find(({ children }) => children?.[0]?.textContent === '일반 스킬');
assert.deepEqual(partialSkillSection.children[1].children.map(({ textContent }) => textContent), [
  `${existingSkills[0].nameKo} · ${existingSkills[0].descriptionKo}`, ...expectedSkillLabels.slice(1),
]);
assert.throws(() => validateHero15MinimalDetail({ generatedText, inputs: partialCostInputs }), /stale or non-deterministic/);
assert.throws(() => validateHero15MinimalDetail({ generatedText: partialCostText, inputs }), /stale or non-deterministic/);
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
const soldierLabels = soldierLinks.map(({ textContent }) => textContent);
assert.equal(soldierLabels.length, 14);
assert.ok(soldierLabels.includes('NORMAL · 하이랜더'));
assert.ok(soldierLabels.includes('SP · 하이랜더'));
assert.equal(soldierLinks.find(({ textContent }) => textContent === 'NORMAL · 하이랜더').href, '#normal-soldier-210');
assert.equal(soldierLinks.find(({ textContent }) => textContent === 'SP · 하이랜더').href, '#sp-soldier-5210');
assert.equal(new Set(soldierLinks.map(({ href }) => href)).size, 14);
fails((x) => { x.soldierInputs.approval.navigation.status = 'NOT_APPROVED'; }, /Soldier navigation publication scope/);
fails((x) => { x.soldierInputs.spPresentation.soldiers.find(({ spSoldierId }) => spSoldierId === 5210).spSoldierId = 210; }, /Soldier navigation target/);
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
const goldGroups = goldSection.children.slice(1);
assert.equal(goldGroups.length, 6);
assert.ok(goldGroups.every(({ children }) => children[1].children.length === 9));
assert.equal(goldGroups[0].children[1].children[0].textContent, 'Lv.2 · 1,500 골드');
assert.equal(goldGroups[5].children[1].children[8].textContent, 'Lv.10 · 200,000 골드');
fails((x) => { x.profileInputs.goldDecision.status = 'NOT_APPROVED'; }, /Fetter Gold publication/);
fails((x) => { x.profileInputs.goldOwner.goldLocators[0].heroId = 16; }, /Fetter Gold level locator/);
fails((x) => { x.profileInputs.goldOwner.goldLocators[0].sourceArrayIndex = 1; }, /Fetter Gold level locator/);
fails((x) => { x.profileInputs.goldDecision.groups[0].gold[0] = 1501; }, /Fetter Gold values/);
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
fails((x) => { x.soldierInputs.approval.soldiers.pop(); }, /approved subset/);
assert.equal(navigation.showTarget(15), true);
assert.equal(target.scrolled, true);
assert.equal(navigation.showTarget(16), false);
const leaked = structuredClone(generated);
leaked.heroes[0].profile.origins = [];
assert.throws(() => render(leaked, talent, element()), /profile consumer/);
process.stdout.write('Hero 15 Minimal Detail regression: PASS (publication, ID, relation, localization, equipment, fields, duplication, stale output, and preserved populations)\n');
