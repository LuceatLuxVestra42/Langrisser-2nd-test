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
  const functions = ['renderHeroMinimalDetailView', 'renderHero16MinimalDetailView'].map(name => extractFunction(app, name));
  const element = tag => ({ tag, children: [], append(...nodes) { this.children.push(...nodes); },
    replaceChildren(...nodes) { this.children = nodes; } });
  let target;
  const document = { createElement: element, getElementById: id => ({ scrollIntoView() { target = id; } }) };
  const render = runInNewContext([...functions, 'renderHero16MinimalDetailView'].join('\n'), { document });
  const container = element('div');
  const navigation = render(JSON.parse(generatedText), container);
  const [card] = container.children;
  const profile = appPath === 'app.js' ? card.children.slice(0, -1) : card.children;
  if (appPath === 'app.js') {
    assert.deepEqual(card.children.at(-1).children.map(node => node.textContent), [
      '중앙율정',
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
