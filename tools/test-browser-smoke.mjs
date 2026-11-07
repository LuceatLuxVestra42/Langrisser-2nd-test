Warning: truncated output (original token count: 15713)
Total output lines: 760

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { copyFile, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { isAllowedSkinAssetPath, skinAssetPathFromPublicUrl } from '../skin-asset-publication-contract.mjs';
import { HERO_MINIMAL_DETAIL_FORTY_BATCH } from './hero-minimal-detail-forty-batch-contract.mjs';

const require = createRequire(resolve(process.env.PLAYWRIGHT_PACKAGE_ROOT, 'package.json'));
const { chromium } = require('playwright');

const requiredEnvironment = [
  'QA_INFRASTRUCTURE_ROOT',
  'QA_INFRASTRUCTURE_SHA',
  'PR_BASE_SHA',
  'PR_HEAD_SHA',
  'BROWSER_TEST_SOURCE_SHA',
  'SITE_SOURCE_ROOT',
  'SITE_SOURCE_SHA',
  'BUILD_VALIDATION_SHA',
  'WORKFLOW_EVENT_SHA',
];
for (const key of requiredEnvironment) assert.ok(process.env[key], `${key} is required`);

const qaRoot = resolve(process.env.QA_INFRASTRUCTURE_ROOT);
const siteRoot = resolve(process.env.SITE_SOURCE_ROOT);
const publicSkinConsumer = JSON.parse(await readFile(resolve(siteRoot, 'generated/skin-consumer-public-m05-g.v1.json'), 'utf8'));
const exclusiveHeroNavigationConsumer = JSON.parse(await readFile(resolve(siteRoot, 'generated/exclusive-equipment-hero-navigation.v1.json'), 'utf8'));
const hero15MinimalDetailConsumer = JSON.parse(await readFile(resolve(siteRoot, 'generated/hero-minimal-detail.v1.json'), 'utf8'));
const hero16MinimalDetailConsumer = JSON.parse(await readFile(resolve(siteRoot, 'generated/hero-minimal-detail-16.v1.json'), 'utf8'));
const heroMinimalDetailBatchConsumer = JSON.parse(await readFile(resolve(siteRoot, 'generated/hero-minimal-detail-batch-17-18-20-21-30.v1.json'), 'utf8'));
const heroMinimalDetailTenBatchConsumer = JSON.parse(await readFile(resolve(siteRoot, 'generated/hero-minimal-detail-batch-31-34-35-36-38-39-49-51-54-57.v1.json'), 'utf8'));
const heroMinimalDetailTwentyBatchConsumer = JSON.parse(await readFile(resolve(siteRoot, 'generated/hero-minimal-detail-batch-58-59-61-62-63-64-65-66-87-88-91-92-93-94-95-96-97-98-99-100.v1.json'), 'utf8'));
const heroMinimalDetailThirtyBatchConsumer = JSON.parse(await readFile(resolve(siteRoot, 'generated/hero-minimal-detail-thirty-batch.v1.json'), 'utf8'));
const heroMinimalDetailThirtyOneBatchConsumer = JSON.parse(await readFile(resolve(siteRoot, 'generated/hero-minimal-detail-thirty-one-batch.v1.json'), 'utf8'));
const heroMinimalDetailFortyBatchConsumer = JSON.parse(await readFile(resolve(siteRoot, 'generated/hero-minimal-detail-forty-batch.v1.json'), 'utf8'));
const approvedFortyBatch = HERO_MINIMAL_DETAIL_FORTY_BATCH.map(({ heroId, equipmentId, nameKo, equipmentNameKo }) => ({ heroId, equipmentId, nameKo, equipmentNameKo }));
const approvedBatch = [{ heroId: 17, equipmentId: 405, nameKo: '에그베르트', equipmentNameKo: '플레임 코트' }, { heroId: 18, equipmentId: 276, nameKo: '이멜다', equipmentNameKo: '매혹의 립스틱' }, { heroId: 20, equipmentId: 281, nameKo: '소니아', equipmentNameKo: '검은 서광' }, { heroId: 21, equipmentId: 441, nameKo: '발가스', equipmentNameKo: '염룡의 휘광' }, { heroId: 30, equipmentId: 286, nameKo: '리파니', equipmentNameKo: '요정의 날개' }];
const approvedTenBatch = [{heroId:31,equipmentId:434,nameKo:'소피아',equipmentNameKo:'성광의 베일'},{heroId:34,equipmentId:297,nameKo:'키리카제',equipmentNameKo:'삿갓'},{heroId:35,equipmentId:425,nameKo:'안젤리카',equipmentNameKo:'만능 공구 모자'},{heroId:36,equipmentId:414,nameKo:'실버울프',equipmentNameKo:'의적의 가면'},{heroId:38,equipmentId:455,nameKo:'제리올&레이라',equipmentNameKo:'나의 수호자'},{heroId:39,equipmentId:411,nameKo:'페라키아',equipmentNameKo:'악몽의 속삭임'},{heroId:49,equipmentId:429,nameKo:'파나',equipmentNameKo:'스칼렛 윈드'},{heroId:51,equipmentId:293,nameKo:'셀파닐',equipmentNameKo:'카콘시스의 왕관'},{heroId:54,equipmentId:490,nameKo:'리스틸',equipmentNameKo:'마혈의 투구'},{heroId:57,equipmentId:472,nameKo:'윌러',equipmentNameKo:'은하 제독'}];
const approvedTwentyBatch = [{heroId:58,equipmentId:423,nameKo:'세레나',equipmentNameKo:'여명의 수호자'},{heroId:59,equipmentId:424,nameKo:'기자로프',equipmentNameKo:'파멸과 창조의 지팡이'},{heroId:61,equipmentId:413,nameKo:'람다',equipmentNameKo:'세계수의 꽃'},{heroId:62,equipmentId:427,nameKo:'알프레드',equipmentNameKo:'오션즈 하트'},{heroId:63,equipmentId:452,nameKo:'레인폴스',equipmentNameKo:'크림조의 심장'},{heroId:64,equipmentId:439,nameKo:'브렌다',equipmentNameKo:'아득한 달의 기억'},{heroId:65,equipmentId:437,nameKo:'비라쥬',equipmentNameKo:'크림조 아머'},{heroId:66,equipmentId:464,nameKo:'클라렛',equipmentNameKo:'칼자스의 군신'},{heroId:87,equipmentId:435,nameKo:'베티',equipmentNameKo:'파멸의 샛별'},{heroId:88,equipmentId:417,nameKo:'엘라스타',equipmentNameKo:'바람을 싣는 날개'},{heroId:91,equipmentId:453,nameKo:'에밀리아',equipmentNameKo:'영광의 전승'},{heroId:92,equipmentId:426,nameKo:'환생 제시카',equipmentNameKo:'신탁을 받은 자'},{heroId:93,equipmentId:479,nameKo:'미지의 기사',equipmentNameKo:'수호의 맹세'},{heroId:94,equipmentId:440,nameKo:'아카야',equipmentNameKo:'성령의 손길'},{heroId:95,equipmentId:438,nameKo:'올리버',equipmentNameKo:'위대한 왕의 증표'},{heroId:96,equipmentId:460,nameKo:'멜파니',equipmentNameKo:'활기찬 소환사'},{heroId:97,equipmentId:448,nameKo:'일루시아',equipmentNameKo:'그 여름의 기억'},{heroId:98,equipmentId:476,nameKo:'빈센트',equipmentNameKo:'타락한 날개'},{heroId:99,equipmentId:540,nameKo:'클로테르',equipmentNameKo:'영원한 불꽃의 맹세'},{heroId:100,equipmentId:549,nameKo:'로젠실',equipmentNameKo:'순백의 면사포'}];
const approvedThirtyBatch = [{heroId:101,equipmentId:463,nameKo:'헬레나',equipmentNameKo:'황금 수정의 갑옷'},{heroId:102,equipmentId:477,nameKo:'세계수의 현자',equipmentNameKo:'낡은 두건'},{heroId:103,equipmentId:451,nameKo:'실린카',equipmentNameKo:'역날개의 가면'},{heroId:104,equipmentId:508,nameKo:'알파',equipmentNameKo:'개조된 신체 αEX'},{heroId:105,equipmentId:497,nameKo:'뮤',equipmentNameKo:'만개의 월계관'},{heroId:106,equipmentId:487,nameKo:'입실론',equipmentNameKo:'소멸 · 개'},{heroId:108,equipmentId:499,nameKo:'사신 크루거',equipmentNameKo:'사기꾼의 가면'},{heroId:109,equipmentId:489,nameKo:'화이트 시시',equipmentNameKo:'비즈니스 마인드'},{heroId:110,equipmentId:475,nameKo:'아레스',equipmentNameKo:'자경단의 투구'},{heroId:111,equipmentId:449,nameKo:'마이야',equipmentNameKo:'치명적인 빗자루'},{heroId:112,equipmentId:501,nameKo:'토와',equipmentNameKo:'스피릿 비전 고글'},{heroId:113,equipmentId:507,nameKo:'탄생의 빛',equipmentNameKo:'전생의 글귀'},{heroId:114,equipmentId:485,nameKo:'마리엘',equipmentNameKo:'저스티스 플레일'},{heroId:115,equipmentId:478,nameKo:'로자리아',equipmentNameKo:'세인트 소드'},{heroId:116,equipmentId:461,nameKo:'노에미',equipmentNameKo:'기발한 모자'},{heroId:118,equipmentId:496,nameKo:'오토크라트 4세',equipmentNameKo:'금단의 황실 갑옷'},{heroId:119,equipmentId:526,nameKo:'루크레치아',equipmentNameKo:'면죄의 모자'},{heroId:120,equipmentId:473,nameKo:'플로렌티아',equipmentNameKo:'제국의 보배'},{heroId:121,equipmentId:454,nameKo:'츠바메',equipmentNameKo:'숨겨진 별의 투구'},{heroId:122,equipmentId:502,nameKo:'힐다',equipmentNameKo:'선홍색 무장'},{heroId:123,equipmentId:486,nameKo:'베르너',equipmentNameKo:'기동 폭발검'},{heroId:124,equipmentId:519,nameKo:'크리스티아네',equipmentNameKo:'깃털 장식 모자'},{heroId:125,equipmentId:467,nameKo:'리코리스',equipmentNameKo:'어린 왕'},{heroId:126,equipmentId:484,nameKo:'팟시르',equipmentNameKo:'심취의 베일'},{heroId:127,equipmentId:450,nameKo:'레나타',equipmentNameKo:'드래곤 크레스트'},{heroId:129,equipmentId:520,nameKo:'구스타프',equipmentNameKo:'머나먼 메아리'},{heroId:130,equipmentId:512,nameKo:'미셸',equipmentNameKo:'마도 과학 무장'},{heroId:99161,equipmentId:495,nameKo:'크림조의 왕',equipmentNameKo:'월식 갑옷'},{heroId:99162,equipmentId:498,nameKo:'수제트',equipmentNameKo:'빛의 심판자'},{heroId:99163,equipmentId:500,nameKo:'초월자',equipmentNameKo:'무한한 고리'}];
const approvedThirtyOneBatch = [{heroId:99164,equipmentId:534,nameKo:'베르너 폰 에길',equipmentNameKo:'은빛 바람의 망토'},{heroId:99165,equipmentId:510,nameKo:'마리안델',equipmentNameKo:'세계수의 꽃웃음'},{heroId:99166,equipmentId:539,nameKo:'웨탐',equipmentNameKo:'악마 우두머리'},{heroId:99167,equipmentId:511,nameKo:'리사',equipmentNameKo:'유령 대장'},{heroId:99168,equipmentId:537,nameKo:'엘마',equipmentNameKo:'경건한 축하'},{heroId:99169,equipmentId:509,nameKo:'켈티스',equipmentNameKo:'초혼의 모자'},{heroId:99170,equipmentId:513,nameKo:'로비나 대제',equipmentNameKo:'호령의 칼날'},{heroId:99171,equipmentId:514,nameKo:'방주의 성녀',equipmentNameKo:'여명의 왕관'},{heroId:99172,equipmentId:524,nameKo:'크림조의 집정관',equipmentNameKo:'우주전함의 결의'},{heroId:99173,equipmentId:538,nameKo:'아이언 챈슬러',equipmentNameKo:'검붉은 의지'},{heroId:99174,equipmentId:533,nameKo:'아즈사',equipmentNameKo:'낭월청진'},{heroId:99175,equipmentId:536,nameKo:'오보로',equipmentNameKo:'영혼이 깃든 법상'},{heroId:99176,equipmentId:521,nameKo:'캐롤리안',equipmentNameKo:'역행의 투구'},{heroId:99177,equipmentId:523,nameKo:'카구야',equipmentNameKo:'꿈의 달빛'},{heroId:99178,equipmentId:532,nameKo:'아사멜',equipmentNameKo:'타오르는 북극성'},{heroId:99179,equipmentId:547,nameKo:'로스탐',equipmentNameKo:'뜨거운 모래바람'},{heroId:99180,equipmentId:525,nameKo:'방랑투사',equipmentNameKo:'방랑의 상처'},{heroId:99181,equipmentId:551,nameKo:'줄리안',equipmentNameKo:'처형자의 침묵'},{heroId:99182,equipmentId:531,nameKo:'리키',equipmentNameKo:'진정한 영웅'},{heroId:99183,equipmentId:550,nameKo:'마크렌',equipmentNameKo:'메카파츠'},{heroId:99184,equipmentId:559,nameKo:'빛의 수호사도',equipmentNameKo:'잿불의 수호'},{heroId:99185,equipmentId:560,nameKo:'아단켈모',equipmentNameKo:'아득한 수수께끼'},{heroId:99186,equipmentId:568,nameKo:'빛과 그림자 검의 영혼',equipmentNameKo:'엇갈린 숙명'},{heroId:99187,equipmentId:548,nameKo:'껍질 소녀',equipmentNameKo:'소스 코어'},{heroId:99188,equipmentId:546,nameKo:'리오벡',equipmentNameKo:'세월의 연못'},{heroId:99189,equipmentId:545,nameKo:'시엔',equipmentNameKo:'도사리는 어둠'},{heroId:99190,equipmentId:569,nameKo:'폴리알',equipmentNameKo:'선령의 속삭임'},{heroId:99191,equipmentId:552,nameKo:'루그너',equipmentNameKo:'신자의 면류관'},{heroId:99192,equipmentId:570,nameKo:'그렌실',equipmentNameKo:'겨울 서리의 오만'},{heroId:99193,equipmentId:557,nameKo:'요아&코니',equipmentNameKo:'Y자 비주얼 디바이스'},{heroId:99197,equipmentId:603,nameKo:'각성자',equipmentNameKo:'최후의 시선'}];
assert.equal(exclusiveHeroNavigationConsumer.records.length, 167, 'published Equipment Hero Navigation must contain exactly 167 approved relations');
assert.equal(exclusiveHeroNavigationConsumer.records.filter(({ navigationTarget }) => navigationTarget.surface === 'HERO_DETAIL').length, 29);
assert.equal(exclusiveHeroNavigationConsumer.records.filter(({ navigationTarget }) => navigationTarget.surface === 'HERO_INDEX').length, 0);
assert.equal(exclusiveHeroNavigationConsumer.records.filter(({ navigationTarget }) => navigationTarget.surface === 'HERO_MINIMAL_DETAIL').length, 138);
assert.deepEqual(heroMinimalDetailBatchConsumer.heroes.map(({ heroId }) => heroId), [17, 18, 20, 21, 30]);
assert.deepEqual(heroMinimalDetailTenBatchConsumer.heroes.map(({ heroId }) => heroId), [31,34,35,36,38,39,49,51,54,57]);
assert.deepEqual(heroMinimalDetailTwentyBatchConsumer.heroes.map(({ heroId }) => heroId), [58,59,61,62,63,64,65,66,87,88,91,92,93,94,95,96,97,98,99,100]);
assert.deepEqual(heroMinimalDetailThirtyBatchConsumer.heroes.map(({ heroId }) => heroId), [101,102,103,104,105,106,108,109,110,111,112,113,114,115,116,118,119,120,121,122,123,124,125,126,127,129,130,99161,99162,99163]);
assert.deepEqual(heroMinimalDetailThirtyOneBatchConsumer.heroes.map(({ heroId }) => heroId), [99164,99165,99166,99167,99168,99169,99170,99171,99172,99173,99174,99175,99176,99177,99178,99179,99180,99181,99182,99183,99184,99185,99186,99187,99188,99189,99190,99191,99192,99193,99197]);
assert.equal(heroMinimalDetailFortyBatchConsumer.heroes.length, 40);
assert.deepEqual(heroMinimalDetailFortyBatchConsumer.heroes.map(({ heroId, exclusiveEquipment }) => [heroId, exclusiveEquipment.equipmentId]), approvedFortyBatch.map(({ heroId, equipmentId }) => [heroId, equipmentId]));
assert.deepEqual([...approvedBatch, ...approvedTenBatch, ...approvedTwentyBatch, ...approvedThirtyBatch, ...approvedThirtyOneBatch, ...approvedFortyBatch].map(({ equipmentId, heroId }) => {
  const row = exclusiveHeroNavigationConsumer.records.find((candidate) => candidate.equipmentId === equipmentId);
  return [row?.heroId, row?.navigationTarget.surface, row?.navigationTarget.fragment];
}), [...approvedBatch, ...approvedTenBatch, ...approvedTwentyBatch, ...approvedThirtyBatch, ...approvedThirtyOneBatch, ...approvedFortyBatch].map(({ heroId }) => [heroId, 'HERO_MINIMAL_DETAIL', `hero-minimal-detail-${heroId}`]), 'only the 138 approved Equipment targets may use their exact Minimal Detail endpoints');
assert.deepEqual(hero15MinimalDetailConsumer.heroes.map(({ heroId }) => heroId), [15]);
assert.deepEqual(hero16MinimalDetailConsumer.heroes.map(({ heroId }) => heroId), [16]);
assert.deepEqual(exclusiveHeroNavigationConsumer.records.find(({ equipmentId }) => equipmentId === 535)?.navigationTarget,
  { surface: 'HERO_MINIMAL_DETAIL', fragment: 'hero-minimal-detail-15' });
assert.deepEqual(exclusiveHeroNavigationConsumer.records.find(({ equipmentId }) => equipmentId === 418)?.navigationTarget,
  { surface: 'HERO_MINIMAL_DETAIL', fragment: 'hero-minimal-detail-16' });
assert.ok(exclusiveHeroNavigationConsumer.records.filter(({ equipmentId }) => ![276,281,286,293,297,405,411,413,414,417,418,423,424,425,426,427,429,434,435,437,438,439,440,441,448,452,453,455,460,464,472,476,479,490,535,540,549,449,450,451,454,461,463,467,473,475,477,478,484,485,486,487,489,495,496,497,498,499,500,501,502,507,508,512,519,520,526,...approvedThirtyOneBatch.map(({ equipmentId }) => equipmentId), ...approvedFortyBatch.map(({ equipmentId }) => equipmentId)].includes(equipmentId))
  .every(({ navigationTarget }) => navigationTarget.surface !== 'HERO_MINIMAL_DETAIL'), 'all other Equipment targets must be preserved');
const publicSkinAssets = JSON.parse(await readFile(resolve(siteRoot, 'generated/skin-assets-public-m05-g.v1.json'), 'utf8'));
const publishedSkinRows = validatePublishedSkinRows(publicSkinConsumer, publicSkinAssets);
const publishedSkinById = new Map(publishedSkinRows.map((row) => [row.skinId, row]));
const protectedSkinClaims = [
  ...[102, 103, 104, 105].map((skinId, index) => ({ skinId, heroId: 1, sourceOrder: index + 1 })),
  ...[601, 602, 603, 604, 605, 606].map((skinId, index) => ({ skinId, heroId: 6, sourceOrder: index + 1 })),
  { skinId: 3701, heroId: 37, sourceOrder: 1 },
];
const assetEvidenceFiles = [
  'evidence/assets/skin-fullart-m04.v1.json',
  'evidence/assets/skin-fullart-m05-d.v1.json',
  'evidence/assets/skin-fullart-m06.v1.json',
  'evidence/assets/skin-fullart-m07.v1.json',
];
const assetEvidenceRecords = new Map();
for (const evidencePath of assetEvidenceFiles) {
  const evidence = JSON.parse(await readFile(resolve(siteRoot, evidencePath), 'utf8'));
  for (const record of evidence.records) assetEvidenceRecords.set(record.skinId, record);
}
for (const claim of protectedSkinClaims) {
  const actual = publishedSkinById.get(claim.skinId);
  const evidence = assetEvidenceRecords.get(claim.skinId);
  assert.ok(actual, `protected Skin ${claim.skinId} missing from public Consumer`);
  assert.deepEqual({ skinId: actual.skinId, heroId: actual.heroId, sourceOrder: actual.sourceOrder }, claim,
    `protected Semantic claim changed for Skin ${claim.skinId}`);
  assert.ok(evidence, `protected Asset evidence missing for Skin ${claim.skinId}`);
  assert.equal(actual.imageUrl, `./${evidence.output.path}`, `protected image URL changed for Skin ${claim.skinId}`);
  const digest = createHash('sha256').update(await readFile(resolve(siteRoot, evidence.output.path))).digest('hex');
  assert.equal(digest, evidence.output.sha256, `protected Asset SHA-256 mismatch for Skin ${claim.skinId}`);
}
console.log('PROTECTED_SKIN_CLAIMS=11_PASS');

function validatePublishedSkinRows(consumer, assets) {
  assert.deepEqual(Object.keys(consumer).sort(), ['schemaVersion', 'skins']);
  assert.equal(consumer.schemaVersion, 1);
  assert.ok(Array.isArray(consumer.skins));
  assert.deepEqual(Object.keys(assets).sort(), ['assets', 'schemaVersion']);
  assert.equal(assets.schemaVersion, 1);
  assert.ok(Array.isArray(assets.assets));
  const skinById = new Map();
  const orders = new Set();
  for (const row of consumer.skins) {
    assert.deepEqual(Object.keys(row).sort(), ['heroId', 'skinId', 'sourceOrder']);
    assert.ok(Number.isSafeInteger(row.skinId) && row.skinId > 0);
    assert.ok(Number.isSafeInteger(row.heroId) && row.heroId > 0);
    assert.ok(Number.isSafeInteger(row.sourceOrder) && row.sourceOrder > 0);
    assert.ok(!skin…6713 tokens truncated…id] of anchors) {
      const link = page.locator(`nav.section-shortcuts a[href="#${id}"]`);
      assert.equal(await link.count(), 1, `${viewport.name}: shortcut #${id} must be unique`);
      await link.click();
      assert.equal(new URL(page.url()).hash, `#${id}`, `${viewport.name}: clicking #${id} must update the URL hash`);
      assert.equal(await page.locator(`#${id}`).count(), 1, `${viewport.name}: target #${id} must exist`);
    }

    const indexRelation = exclusiveHeroNavigationConsumer.records.find(({ navigationTarget }) => navigationTarget.surface === 'HERO_INDEX');
    await page.locator('#hero-index-search').fill('999999');
    const indexOwnerLink = page.locator(`#equipment-${indexRelation.equipmentId} .equipment-navigation-link`);
    await indexOwnerLink.click();
    assert.equal(new URL(page.url()).hash, `#${indexRelation.navigationTarget.fragment}`, `${viewport.name}: Index owner link must target the exact approved Hero ID`);
    assert.equal(await page.locator(`#${indexRelation.navigationTarget.fragment}`).isVisible(), true, `${viewport.name}: filtered Index target must render before scrolling`);
    assert.equal(await page.locator('#hero-index-search').inputValue(), '', `${viewport.name}: owner navigation must clear the independent Hero Index filter`);

    const detailRelation = exclusiveHeroNavigationConsumer.records.find(({ navigationTarget }) => navigationTarget.surface === 'HERO_DETAIL');
    await page.locator('#hero-search').fill('999999');
    const detailOwnerLink = page.locator(`#equipment-${detailRelation.equipmentId} .equipment-navigation-link`);
    await detailOwnerLink.click();
    assert.equal(new URL(page.url()).hash, `#${detailRelation.navigationTarget.fragment}`, `${viewport.name}: Detail owner link must preserve the existing endpoint`);
    assert.equal(await page.locator(`#${detailRelation.navigationTarget.fragment}`).isVisible(), true, `${viewport.name}: hidden Detail target must be revealed`);
    assert.equal(await page.locator('#hero-search').inputValue(), '', `${viewport.name}: Detail navigation must clear the existing Hero search`);

    await page.locator('#hero-index-search').fill('999999');
    const equipment535Link = page.locator('#equipment-535 .equipment-navigation-link');
    await equipment535Link.click();
    assert.equal(new URL(page.url()).hash, '#hero-minimal-detail-15', `${viewport.name}: Equipment 535 must use the approved Minimal Detail target`);
    assert.equal(await page.locator('#hero-minimal-detail-15').isVisible(), true, `${viewport.name}: Minimal Detail target must exist and be visible`);
    assert.equal(await page.locator('#hero-index-search').inputValue(), '999999', `${viewport.name}: P-C navigation must not mutate Hero Index search state`);
    await page.locator('#hero-index-search').fill('15');
    const hero15IndexLink = page.locator('#hero-index-entry-15 .hero-index-minimal-detail-link');
    await hero15IndexLink.click();
    assert.equal(new URL(page.url()).hash, '#hero-minimal-detail-15', `${viewport.name}: Hero Index ID 15 must navigate to Minimal Detail`);
    assert.equal(await page.locator('#hero-index-search').inputValue(), '15', `${viewport.name}: minimal navigation must preserve the Index query`);
    await page.locator('#hero-index-search').fill('999999');
    const equipment418Link = page.locator('#equipment-418 .equipment-navigation-link');
    await equipment418Link.click();
    assert.equal(new URL(page.url()).hash, '#hero-minimal-detail-16', `${viewport.name}: Equipment 418 must use the approved Hero 16 Minimal Detail target`);
    assert.equal(await page.locator('#hero-minimal-detail-16').isVisible(), true, `${viewport.name}: Hero 16 Minimal Detail target must exist and be visible`);
    assert.equal(await page.locator('#hero-index-search').inputValue(), '999999', `${viewport.name}: Equipment 418 navigation must preserve Hero Index search state`);
    await page.locator('#hero-index-search').fill('16');
    const hero16IndexLink = page.locator('#hero-index-entry-16 .hero-index-minimal-detail-link');
    await hero16IndexLink.click();
    assert.equal(new URL(page.url()).hash, '#hero-minimal-detail-16', `${viewport.name}: Hero Index ID 16 must navigate to Minimal Detail`);
    assert.equal(await page.locator('#hero-index-search').inputValue(), '16', `${viewport.name}: Hero 16 minimal navigation must preserve the Index query`);
    for (const { heroId, equipmentId } of approvedBatch) {
      await page.locator('#hero-index-search').fill('999999');
      await page.locator(`#equipment-${equipmentId} .equipment-navigation-link`).click();
      assert.equal(new URL(page.url()).hash, `#hero-minimal-detail-${heroId}`, `${viewport.name}: Equipment ${equipmentId} must use the approved minimal target`);
      assert.equal(await page.locator(`#hero-minimal-detail-${heroId}`).isVisible(), true, `${viewport.name}: Hero ${heroId} target must exist and be visible`);
      await page.locator('#hero-index-search').fill(String(heroId));
      await page.locator(`#hero-index-entry-${heroId} .hero-index-minimal-detail-link`).click();
      assert.equal(new URL(page.url()).hash, `#hero-minimal-detail-${heroId}`, `${viewport.name}: Hero Index ID ${heroId} must navigate to its minimal detail`);
      assert.equal(await page.locator('#hero-index-search').inputValue(), String(heroId), `${viewport.name}: Hero ${heroId} minimal navigation must preserve the Index query`);
    }

    for (const { heroId, equipmentId, nameKo, equipmentNameKo } of approvedTenBatch) {
      const cardText = await page.locator(`#hero-minimal-detail-${heroId}-content`).innerText();
      assert.ok(cardText.includes(nameKo) && cardText.includes(equipmentNameKo), `${viewport.name}: Hero ${heroId} Minimal Detail renders`);
      await page.locator('#hero-index-search').fill('999999');
      await page.locator(`#equipment-${equipmentId} .equipment-navigation-link`).click();
      assert.equal(new URL(page.url()).hash, `#hero-minimal-detail-${heroId}`, `${viewport.name}: Equipment ${equipmentId} routes to Hero ${heroId}`);
      assert.equal(await page.locator(`#hero-minimal-detail-${heroId}`).isVisible(), true);
      await page.locator('#hero-index-search').fill(String(heroId));
      await page.locator(`#hero-index-entry-${heroId} .hero-index-minimal-detail-link`).click();
      assert.equal(new URL(page.url()).hash, `#hero-minimal-detail-${heroId}`, `${viewport.name}: Index ${heroId} routes to Minimal Detail`);
    }

    for (const { heroId, equipmentId, nameKo, equipmentNameKo } of approvedTwentyBatch) {
      const cardText = await page.locator(`#hero-minimal-detail-${heroId}-content`).innerText();
      assert.ok(cardText.includes(nameKo) && cardText.includes(equipmentNameKo), `${viewport.name}: Hero ${heroId} Minimal Detail renders`);
      await page.locator('#hero-index-search').fill('999999');
      await page.locator(`#equipment-${equipmentId} .equipment-navigation-link`).click();
      assert.equal(new URL(page.url()).hash, `#hero-minimal-detail-${heroId}`, `${viewport.name}: Equipment ${equipmentId} routes to Hero ${heroId}`);
      assert.equal(await page.locator(`#hero-minimal-detail-${heroId}`).isVisible(), true);
      await page.locator('#hero-index-search').fill(String(heroId));
      await page.locator(`#hero-index-entry-${heroId} .hero-index-minimal-detail-link`).click();
      assert.equal(new URL(page.url()).hash, `#hero-minimal-detail-${heroId}`, `${viewport.name}: Index ${heroId} routes to Minimal Detail`);
    }

    for (const { heroId, equipmentId, nameKo, equipmentNameKo } of approvedThirtyBatch) {
      const cardText = await page.locator(`#hero-minimal-detail-${heroId}-content`).innerText();
      assert.ok(cardText.includes(nameKo) && cardText.includes(equipmentNameKo), `${viewport.name}: Hero ${heroId} Minimal Detail renders`);
      await page.locator('#hero-index-search').fill('999999');
      await page.locator(`#equipment-${equipmentId} .equipment-navigation-link`).click();
      assert.equal(new URL(page.url()).hash, `#hero-minimal-detail-${heroId}`, `${viewport.name}: Equipment ${equipmentId} routes to Hero ${heroId}`);
      assert.equal(await page.locator(`#hero-minimal-detail-${heroId}`).isVisible(), true);
      await page.locator('#hero-index-search').fill(String(heroId));
      await page.locator(`#hero-index-entry-${heroId} .hero-index-minimal-detail-link`).click();
      assert.equal(new URL(page.url()).hash, `#hero-minimal-detail-${heroId}`, `${viewport.name}: Index ${heroId} routes to Minimal Detail`);
    }

    for (const { heroId, equipmentId, nameKo, equipmentNameKo } of [...approvedThirtyOneBatch, ...approvedFortyBatch]) {
      const cardText = await page.locator(`#hero-minimal-detail-${heroId}-content`).innerText();
      assert.ok(cardText.includes(nameKo) && cardText.includes(equipmentNameKo), `${viewport.name}: Hero ${heroId} Minimal Detail renders`);
      await page.locator('#hero-index-search').fill('999999');
      await page.locator(`#equipment-${equipmentId} .equipment-navigation-link`).click();
      assert.equal(new URL(page.url()).hash, `#hero-minimal-detail-${heroId}`, `${viewport.name}: Equipment ${equipmentId} routes to Hero ${heroId}`);
      assert.equal(await page.locator(`#hero-minimal-detail-${heroId}`).isVisible(), true);
      await page.locator('#hero-index-search').fill(String(heroId));
      await page.locator(`#hero-index-entry-${heroId} .hero-index-minimal-detail-link`).click();
      assert.equal(new URL(page.url()).hash, `#hero-minimal-detail-${heroId}`, `${viewport.name}: Index ${heroId} routes to Minimal Detail`);
    }

    console.log(`VIEWPORT_${viewport.name.toUpperCase()}=${JSON.stringify(layout)}`);
  }

  // Keep all test-only rows and duplicated image bytes inside a disposable Build output.
  const fixtureSourceSha = actualTestSourceSha;
  const fixtureSiteRoot = await (async () => {
    fixtureTempRoot = await mkdtemp(join(tmpdir(), 'skin-browser-smoke-fixtures-'));
    const output = join(fixtureTempRoot, 'site');
    execFileSync(process.execPath, [resolve(siteRoot, 'tools/build.mjs'), '--output-dir', output], {
      cwd: siteRoot,
      stdio: 'inherit',
    });
    return output;
  })();
  const fixtureConsumerPath = resolve(fixtureSiteRoot, 'generated/skin-consumer-public-m05-g.v1.json');
  const fixtureAssetsPath = resolve(fixtureSiteRoot, 'generated/skin-assets-public-m05-g.v1.json');
  const originalFixtureConsumer = JSON.parse(await readFile(fixtureConsumerPath, 'utf8'));
  const originalFixtureAssets = JSON.parse(await readFile(fixtureAssetsPath, 'utf8'));
  const fixtureHeroSlice = JSON.parse(await readFile(resolve(fixtureSiteRoot, 'generated/hero-slice.v1.json'), 'utf8'));
  const heroWithoutPublishedSkins = fixtureHeroSlice.heroes.find((hero) => !publishedSkinRows.some((row) => row.heroId === hero.id));
  assert.ok(heroWithoutPublishedSkins, 'F03 requires a public Hero with no published Skin');
  const fixtureScenarios = [
    // These IDs are isolated fixture labels; they are never written into source or tracked data.
    { id: 'F01', heroId: 1, skinId: 990001 },
    { id: 'F02', heroId: 6, skinId: 990002 },
    { id: 'F03', heroId: heroWithoutPublishedSkins.id, skinId: 990003 },
  ];
  const fixtureSourceWebp = resolve(fixtureSiteRoot, 'assets/skins/skin-102.webp');
  for (const scenario of fixtureScenarios) {
    const sourceOrder = Math.max(0, ...originalFixtureConsumer.skins
      .filter((row) => row.heroId === scenario.heroId).map((row) => row.sourceOrder)) + 1;
    const fixtureRow = { skinId: scenario.skinId, heroId: scenario.heroId, sourceOrder };
    const relativeAsset = `assets/skin-admissions/fixture-test/skin-${scenario.skinId}.webp`;
    const fixtureAsset = resolve(fixtureSiteRoot, relativeAsset);
    await mkdir(dirname(fixtureAsset), { recursive: true });
    await copyFile(fixtureSourceWebp, fixtureAsset);
    const consumer = { ...originalFixtureConsumer, skins: [...originalFixtureConsumer.skins, fixtureRow] };
    const assets = { ...originalFixtureAssets,
      assets: [...originalFixtureAssets.assets, { skinId: scenario.skinId, imageUrl: `./${relativeAsset}` }] };
    await writeFile(fixtureConsumerPath, `${JSON.stringify(consumer, null, 2)}\n`);
    await writeFile(fixtureAssetsPath, `${JSON.stringify(assets, null, 2)}\n`);
    const expectedRows = validatePublishedSkinRows(consumer, assets);
    servedRoot = fixtureSiteRoot;
    for (const viewport of viewports) {
      const logPrefix = `SCENARIO=${scenario.id} FIXTURE_SKIN=${scenario.skinId} SOURCE_SHA=${fixtureSourceSha} VIEWPORT=${viewport.name}`;
      try {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(`${origin}/`, { waitUntil: 'networkidle', timeout: 60_000 });
        await page.waitForSelector(`#hero-${scenario.heroId} .hero-skin-fullarts`, { timeout: 60_000 });
        await assertRenderedSkinRows(page, expectedRows, `${scenario.id}-${viewport.name}`);
        assert.ok(await page.locator(`#hero-${scenario.heroId} .hero-skin-fullarts img`).count() > 0);
        assert.ok((await page.evaluate(() => document.documentElement.scrollWidth)) <= viewport.width,
          `${scenario.id}-${viewport.name}: horizontal overflow`);
        console.log(`${logPrefix} RESULT=PASS`);
      } catch (error) {
        console.error(`${logPrefix} RESULT=FAIL REASON=${error.message}`);
        throw error;
      }
    }
  }

  await writeFile(fixtureConsumerPath, `${JSON.stringify(originalFixtureConsumer, null, 2)}\n`);
  await writeFile(fixtureAssetsPath, `${JSON.stringify(originalFixtureAssets, null, 2)}\n`);
  servedRoot = fixtureSiteRoot;
  const f04Viewport = viewports[0];
  await page.setViewportSize({ width: f04Viewport.width, height: f04Viewport.height });
  await page.goto(`${origin}/`, { waitUntil: 'networkidle', timeout: 60_000 });
  await page.waitForSelector(`#hero-${heroWithoutPublishedSkins.id}.hero-card`, { timeout: 60_000 });
  const f04FixtureSkinId = 990004;
  // F04 deliberately violates Presentation input at the DOM boundary only.
  await page.evaluate(({ heroId, imageUrl }) => {
    const hero = document.querySelector(`#hero-${heroId}`);
    const section = document.createElement('section');
    section.className = 'hero-skin-fullarts';
    const image = document.createElement('img');
    image.src = imageUrl;
    image.alt = '영웅 스킨 일러스트 1 / 1';
    section.append(image);
    hero.append(section);
  }, { heroId: heroWithoutPublishedSkins.id, imageUrl: '/assets/skins/skin-102.webp' });
  await page.locator(`#hero-${heroWithoutPublishedSkins.id} .hero-skin-fullarts`).scrollIntoViewIfNeeded();
  let f04Detected = false;
  try {
    await assertRenderedSkinRows(page, publishedSkinRows, 'F04-unapproved-dom-skin');
  } catch (error) {
    if (!/rendered records differ from approved Consumer and Asset mapping/.test(error.message)) throw error;
    f04Detected = true;
  }
  if (!f04Detected) {
    console.error(`SCENARIO=F04 FIXTURE_SKIN=${f04FixtureSkinId} SOURCE_SHA=${fixtureSourceSha} VIEWPORT=${f04Viewport.name} RESULT=FAIL REASON=UNAPPROVED_DOM_NOT_DETECTED`);
    throw new Error('Browser comparator accepted an unapproved Skin exposed in the DOM');
  }
  console.log(`SCENARIO=F04 FIXTURE_SKIN=${f04FixtureSkinId} SOURCE_SHA=${fixtureSourceSha} VIEWPORT=${f04Viewport.name} RESULT=PASS NEGATIVE=UNAPPROVED_DOM_DETECTED`);

  for (const path of expectedGenerated) {
    assert.ok(loadedSameOriginPaths.has(path), `Browser did not load required generated resource ${path}`);
  }
  const trainingTechPayload = await page.evaluate(async () => {
    const response = await fetch('./generated/soldier-training-tech-descriptions.v1.json');
    return { status: response.status, data: await response.json() };
  });
  assert.equal(trainingTechPayload.status, 200, 'Direct Generated JSON must be reachable under Decision B');
  assert.equal(trainingTechPayload.data.contract.status, 'EFFECTIVE');
  assert.equal(trainingTechPayload.data.contract.approved, true);
  assert.equal(trainingTechPayload.data.contract.effective, true);
  assert.equal(trainingTechPayload.data.records.length, 20, 'Direct JSON must contain exactly the approved 20 claims');
  assert.equal(trainingTechPayload.data.records.filter((row) => row.variant === 'NORMAL' && row.soldierId === 115 && row.sourceField === 'Description').length, 10);
  assert.equal(trainingTechPayload.data.records.filter((row) => row.variant === 'SP' && row.soldierId === 5115 && row.sourceField === 'SpSoidlierDescription').length, 10);
  assert.ok([...loadedSameOriginPaths].some((path) => path === '/styles.css'), 'Browser did not load styles.css');
  assert.ok([...loadedSameOriginPaths].some((path) => path === '/app.js'), 'Browser did not load app.js');
  assert.deepEqual(resourceFailures, [], `same-origin resource failures: ${resourceFailures.join('; ')}`);
  assert.deepEqual(pageErrors, [], `uncaught Browser page errors: ${pageErrors.join('; ')}`);
  assert.deepEqual(consoleErrors, [], `Browser console errors: ${consoleErrors.join('; ')}`);
  console.log(`BROWSER_RESOURCE_PATHS=${JSON.stringify([...loadedSameOriginPaths].sort())}`);
  console.log(`BROWSER_CONSOLE_ERRORS=${JSON.stringify(consoleErrors)}`);
  console.log('DESKTOP_1440_SMOKE=PASS');
  console.log('MOBILE_390_SMOKE=PASS');
} finally {
  console.log(`BROWSER_PAGE_ERRORS=${JSON.stringify(pageErrors)}`);
  console.log(`BROWSER_RESOURCE_FAILURES=${JSON.stringify(resourceFailures)}`);
  console.log(`BROWSER_CONSOLE_ERRORS=${JSON.stringify(consoleErrors)}`);
  if (browser) await browser.close();
  if (fixtureTempRoot) await rm(fixtureTempRoot, { recursive: true, force: true });
  if (server.listening) {
    await new Promise((resolveClose, rejectClose) => server.close((error) => error ? rejectClose(error) : resolveClose()));
  }
  console.log(`BROWSER_CLOSED=${!browser || browser.isConnected() === false}`);
  console.log(`SERVER_CLOSED=${!server.listening}`);
}
