import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { extractFunction } from './test-app-function-source.mjs';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { HERO_16_INTEGRATED_PUBLICATION_PATH, HERO_16_MINIMAL_DETAIL_PATH, renderHero16MinimalDetail, validateHero16MinimalDetail } from './hero-16-integrated-publication-contract.mjs';

const read = async (path) => JSON.parse(await readFile(path, 'utf8'));
const [decision, heroIdentities, heroLocalizations, relations, equipmentIdentities, equipmentLocalizations, generatedText, heroIndex, heroSlice, hero15] = await Promise.all([
  read(HERO_16_INTEGRATED_PUBLICATION_PATH), read('canonical/hero-identities.v1.json'), read('canonical/hero-localizations-ko.v1.json'),
  read('canonical/hero-exclusive-equipment-relations.v1.json'), read('canonical/exclusive-equipment.v1.json'), read('canonical/exclusive-equipment-localizations-ko.v1.json'),
  readFile(HERO_16_MINIMAL_DETAIL_PATH, 'utf8'), read('generated/hero-index.v1.json'), read('generated/hero-slice.v1.json'), read('generated/hero-minimal-detail.v1.json'),
]);
const sourceHashes = Object.fromEntries(await Promise.all([
  ['heroIdentity', 'canonical/hero-identities.v1.json'], ['heroLocalization', 'canonical/hero-localizations-ko.v1.json'],
  ['equipmentRelation', 'canonical/hero-exclusive-equipment-relations.v1.json'], ['equipmentIdentity', 'canonical/exclusive-equipment.v1.json'],
  ['equipmentLocalization', 'canonical/exclusive-equipment-localizations-ko.v1.json'],
].map(async ([key, path]) => [key, createHash('sha256').update(await readFile(path)).digest('hex')])));
const inputs = { decision, heroIdentities, heroLocalizations, relations, equipmentIdentities, equipmentLocalizations, sourceHashes };
const generated = validateHero16MinimalDetail({ generatedText, inputs });
assert.deepEqual(generated.heroes.map(({ heroId }) => heroId), [16]);
assert.deepEqual(Object.keys(generated.heroes[0]).sort(), ['exclusiveEquipment', 'heroId', 'nameKo']);
assert.deepEqual(Object.keys(generated.heroes[0].exclusiveEquipment).sort(), ['effectDescriptionKo', 'equipmentId', 'nameKo']);
assert.equal(generated.heroes[0].nameKo, '란스');
assert.equal(generated.heroes[0].exclusiveEquipment.equipmentId, 418);
assert.equal(generated.heroes[0].exclusiveEquipment.nameKo, '칼자스의 왕관');
assert.equal(heroIndex.heroes.length, 267);
assert.equal(heroSlice.heroes.length, 29);
assert.deepEqual(hero15.heroes.map(({ heroId }) => heroId), [15]);

const fails = (mutate, pattern) => { const changed = structuredClone(inputs); mutate(changed); assert.throws(() => renderHero16MinimalDetail(changed), pattern); };
fails((x) => { x.decision.status = 'NOT_APPROVED'; }, /approval or scope/);
fails((x) => { x.decision.approvedScope.minimalDetail.fields.push('rarity'); }, /approval or scope/);
fails((x) => { x.decision.approvedScope.minimalDetail.heroId = 15; }, /approval or scope/);
fails((x) => { x.decision.approvedScope.heroIndexNavigation.fragment = 'hero-16'; }, /approval or scope/);
fails((x) => { x.decision.approvedScope.exclusiveEquipmentNavigation.target.fragment = 'hero-index-entry-16'; }, /approval or scope/);
fails((x) => { x.decision.approvedScope.preservedPopulations.exclusiveEquipmentNavigation = 166; }, /approval or scope/);
fails((x) => { x.heroIdentities.records = x.heroIdentities.records.filter(({ heroId }) => heroId !== 16); }, /Identity must resolve exactly once/);
fails((x) => { x.heroLocalizations.records.find(({ heroId }) => heroId === 16).nameKo = '잘못된 이름'; }, /differs from the approved localization/);
fails((x) => { x.relations.records = x.relations.records.filter(({ heroId }) => heroId !== 16); }, /approved relation must resolve exactly once/);
fails((x) => { x.relations.records.push({ heroId: 16, equipmentId: 535 }); }, /relation endpoints are not unique/);
fails((x) => { x.equipmentIdentities.records = x.equipmentIdentities.records.filter(({ equipmentId }) => equipmentId !== 418); }, /Equipment Identity must resolve exactly once/);
fails((x) => { x.equipmentLocalizations.records.find(({ equipmentId }) => equipmentId === 418).effectDescriptionKo = ''; }, /differs from the approved display claim/);
fails((x) => { x.sourceHashes.equipmentRelation = '0'.repeat(64); }, /source hash changed/);
assert.throws(() => validateHero16MinimalDetail({ generatedText: generatedText.replace('란스', '다른 이름'), inputs }), /stale or non-deterministic/);
const extraField = structuredClone(generated); extraField.heroes[0].rarity = { rankId: 3 };
assert.throws(() => validateHero16MinimalDetail({ generatedText: `${JSON.stringify(extraField, null, 2)}\n`, inputs }), /stale or non-deterministic/);
const duplicated = structuredClone(generated); duplicated.heroes.push(structuredClone(duplicated.heroes[0]));
assert.throws(() => validateHero16MinimalDetail({ generatedText: `${JSON.stringify(duplicated, null, 2)}\n`, inputs }), /stale or non-deterministic/);
assert.equal(Buffer.byteLength(generatedText), 294);
assert.equal(createHash('sha256').update(generatedText).digest('hex'), 'ef76cb5a482d1fc717a49a16b115f25358c843cdb5ded784b9d7558ad1ed83d2');
for (const [appPath, lines] of [
  ['tools/fixtures/hero-15-soldier-text-base-app.js', []],
  ['app.js', ['등급 · SR', '진영 · 빛의 군단 · 제국의 빛 · 전략의 대가', '중국어명 · 兰斯 / 영문명 · Lance', '성우 · 모가미 츠구오']],
]) {
  const app = await readFile(appPath, 'utf8');
  const functions = [...(appPath === 'app.js' ? ['makeAnchor','renderMinimalDetailList','renderSoldierCommandTable'] : []), 'renderHeroMinimalDetailView', 'renderHero16MinimalDetailView'].map(name => extractFunction(app, name));
  const element = tag => ({ tag, children: [], addEventListener() {}, append(...nodes) { this.children.push(...nodes); },
    replaceChildren(...nodes) { this.children = nodes; } });
  let target;
  const document = { createElement: element, getElementById: id => ({ scrollIntoView() { target = id; } }) };
  const render = runInNewContext([...functions, 'renderHero16MinimalDetailView'].join('\n'), { document });
  const container = element('div');
  const navigation = render(JSON.parse(generatedText), container);
  const [card] = container.children;
  const existing = appPath === 'app.js' ? card.children.slice(0, -2) : card.children;
  if (appPath === 'app.js') assert.deepEqual(card.children.slice(-2).map(node => [node.tag, node.textContent]),
    [['p','전직 · 호크 나이트 → 드래곤 나이트'], ['p','전직 · 호크 나이트 → 소드맨']]);
  const profile = appPath === 'app.js' ? existing.slice(0, -11) : existing;
  if (appPath === 'app.js') {
    const soldierSection = existing.at(-1);
    assert.equal(soldierSection.children[0].textContent, '일반 3티어 용병 (일부)');
    assert.deepEqual(soldierSection.children[1].children.map(item => item.children[0].href),
      [115,324,423,419,402].map(id => '#normal-soldier-' + id));
    assert.deepEqual(existing.slice(-9,-7).map(node => node.textContent),
      ['전직 · 드래곤 나이트 → 드래곤 마스터 · 기본 사거리 1 · 비행 · 이동력 5','전직 · 하이랜더 → 로열 나이트 · 기본 사거리 1 · 기마 · 이동력 5']);
    assert.deepEqual(existing.slice(-5,-1).map(node => [node.tag, node.textContent]),
      [['p', '유대 2 · 레벨 30 달성'], ['p', '유대 3 · 란스를 출전시켜 시공의 균열 3-1[정예] 클리어'],
       ['p', '유대 4 · 나암과 함께 운명의문 4 클리어'], ['p', '유대 5 · 쉐리와 함께 운명의문 5 클리어']]);
    const heart = existing.at(-6);
    assert.equal(heart.children[0].textContent, '마음의 유대');
    assert.deepEqual(heart.children.slice(1).map(group => group.children.map(node => node.textContent)), [['드래곤 마스터', 'Lv.4 · 부대 생명이 100%일 시, 받는 피해 -10%', 'Lv.7 · 부대 생명이 100%일 시, 주는 피해 +10%'], ['로열 나이트', 'Lv.4 · 공격을 받아 전투 진입 시, 받는 마법 피해 -10%', 'Lv.7 · 부대 생명이 70% 미만일 시, 주는 피해 +10%']]);
    const command = existing.at(-7);
    assert.equal(command.children[0].textContent, '병사 지휘 보정');
    assert.deepEqual(command.children[1].children[1].children.map(row => row.children.map(cell => cell.textContent)),
      [['생명','+10%','+25%'],['공격','+5%','+10%'],['방어','+10%','+25%'],['마방','','+10%']]);
    const bonds = existing.at(-10);
    assert.equal(bonds.tag, 'details');
    const expectedAmounts = [
      [1500, 2300, 3500, 5300, 8000, 12000, 18000, 27000, 41000],
      [5000, 7500, 11000, 17000, 26000, 39000, 59000, 89000, 130000],
      [9000, 14000, 21000, 32000, 48000, 72000, 110000, 170000, 260000],
      [15000, 23000, 35000, 53000, 80000, 120000, 180000, 270000, 410000],
      [20000, 30000, 45000, 68000, 100000, 150000, 230000, 350000, 530000],
    ];
    const lists = bonds.children.filter(node => node.tag === 'details');
    assert.equal(lists.length, expectedAmounts.length);
    for (const [index, amounts] of expectedAmounts.entries()) {
      const levels = lists[index];
      assert.equal(bonds.children.filter(node => node.tag !== 'div')[2 * (index + 1)], levels);
      assert.deepEqual(levels.children.map(node => node.tag), ['summary', 'ul']);
      assert.equal(levels.children[0].textContent, '유대 ' + (index + 1) + ' 레벨별 골드');
      assert.deepEqual(levels.children[1].children.map(node => node.textContent),
        amounts.map((gold, offset) => 'Lv.' + (offset + 2) + ' · ' + gold.toLocaleString('ko-KR') + ' 골드'));
    }
    assert.deepEqual(bonds.children.filter(node => node.tag === 'p' || node.tag === 'summary').map(node => node.textContent), [
      '유대 강화 골드',
      '유대 1 · Lv.2~10 합계 골드 118,600',
      '유대 2 · Lv.2~10 합계 골드 383,500',
      '유대 3 · Lv.2~10 합계 골드 736,000',
      '유대 4 · Lv.2~10 합계 골드 1,186,000',
      '유대 5 · Lv.2~10 합계 골드 1,523,000',
      '마음의 유대 · Lv.2~10 합계 골드 650,000',
    ]);
    assert.deepEqual(existing.at(-11).children.map(node => node.textContent), [
      '중앙율정',
      '상성 우세인 부대와 전투 시 모든 스탯 +15%',
      '혼합부대로 구성 시 이동력 +2, 전투 후 피해량의 20%만큼 회복',
      'Lv.1~10 합계 골드 10,800,000',
      '무기 1 · Lv.1~10 소계 골드 1,800,000',
      '무기 2 · Lv.1~10 소계 골드 1,800,000',
      '갑옷 · Lv.1~10 소계 골드 3,600,000',
      '투구 · Lv.1~10 소계 골드 1,800,000',
      '장신구 · Lv.1~10 소계 골드 1,800,000',
    ]);
  }
  assert.deepEqual(profile.map(row => row.textContent), [
    '란스', 'Hero ID 16', '프로젝트 검수 표시명 · 공식 한국 서버 Provenance 미확인', ...lines,
    '칼자스의 왕관 (Equipment ID 418)', '생명 +5%\n혼합부대일 시, 주는 피해 +20%',
    ...(appPath === 'app.js' ? ['전직 · 호크 나이트 → 하이랜더'] : []),
  ]);
  assert.equal(navigation.showTarget(15), false);
  assert.equal(navigation.showTarget(16), true);
  assert.equal(target, 'hero-minimal-detail-16');
}
process.stdout.write('Hero 16 Minimal Detail regression: PASS (publication, IDs, relation, localization, fields, duplicate endpoints, stale output, and Hero 15/population preservation)\n');
