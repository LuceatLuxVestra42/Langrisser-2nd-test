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
const publicSkinAssets = JSON.parse(await readFile(resolve(siteRoot, 'generated/skin-assets-public-m05-g.v1.json'), 'utf8'));
const publishedSkinRows = validatePublishedSkinRows(publicSkinConsumer, publicSkinAssets);
const publishedSkinById = new Map(publishedSkinRows.map((row) => [row.skinId, row]));
const protectedSkinClaims = [
  ...[102, 103, 104, 105].map((skinId, index) => ({ skinId, heroId: 1, sourceOrder: index + 1 })),
  ...[601, 602, 603, 604, 605, 606].map((skinId, index) => ({ skinId, heroId: 6, sourceOrder: index + 1 })),
];
const assetEvidenceFiles = [
  'evidence/assets/skin-fullart-m04.v1.json',
  'evidence/assets/skin-fullart-m05-d.v1.json',
  'evidence/assets/skin-fullart-m06.v1.json',
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
console.log('PROTECTED_SKIN_CLAIMS=10_PASS');

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
    assert.ok(!skinById.has(row.skinId), `duplicate SkinID ${row.skinId}`);
    const orderKey = `${row.heroId}:${row.sourceOrder}`;
    assert.ok(!orders.has(orderKey), `Source Order collision for Hero ${row.heroId}: ${row.sourceOrder}`);
    orders.add(orderKey);
    skinById.set(row.skinId, row);
  }
  const assetById = new Map();
  const urls = new Set();
  for (const asset of assets.assets) {
    assert.deepEqual(Object.keys(asset).sort(), ['imageUrl', 'skinId']);
    assert.ok(Number.isSafeInteger(asset.skinId) && skinById.has(asset.skinId), `Asset mapping has no Consumer row: ${asset.skinId}`);
    assert.ok(!assetById.has(asset.skinId), `duplicate Asset mapping for Skin ${asset.skinId}`);
    const path = skinAssetPathFromPublicUrl(asset.imageUrl);
    assert.ok(path && isAllowedSkinAssetPath(path), `unapproved Asset URL for Skin ${asset.skinId}`);
    assert.ok(!urls.has(asset.imageUrl), `duplicate public Asset URL ${asset.imageUrl}`);
    urls.add(asset.imageUrl);
    assetById.set(asset.skinId, asset.imageUrl);
  }
  assert.deepEqual([...assetById.keys()].sort((a, b) => a - b), [...skinById.keys()].sort((a, b) => a - b),
    'Consumer and Asset mapping populations must match exactly');
  return [...skinById.values()].map((row) => ({ ...row, imageUrl: assetById.get(row.skinId) }))
    .sort((a, b) => a.heroId - b.heroId || a.sourceOrder - b.sourceOrder);
}

function rowsForHero(rows, heroId) {
  return rows.filter((row) => row.heroId === heroId).sort((a, b) => a.sourceOrder - b.sourceOrder);
}

function runContractFixtures() {
  assert.throws(() => validatePublishedSkinRows({ ...publicSkinConsumer,
    skins: [...publicSkinConsumer.skins, publicSkinConsumer.skins[0]] }, publicSkinAssets), /duplicate SkinID/);
  assert.throws(() => validatePublishedSkinRows({ ...publicSkinConsumer,
    skins: publicSkinConsumer.skins.map((row, index) => index === 1 ? { ...row, sourceOrder: 1 } : row) }, publicSkinAssets), /Source Order collision/);
  assert.throws(() => validatePublishedSkinRows(publicSkinConsumer,
    { ...publicSkinAssets, assets: publicSkinAssets.assets.slice(1) }), /populations must match/);
  assert.throws(() => validatePublishedSkinRows(publicSkinConsumer,
    { ...publicSkinAssets, assets: publicSkinAssets.assets.map((row, index) => index === 0 ? { ...row, skinId: 999999 } : row) }), /Asset mapping has no Consumer row/);
  for (const id of ['F05_DUPLICATE_SKIN_ID', 'F06_SOURCE_ORDER_COLLISION', 'F07_APPROVED_URL_MISSING', 'F08_CONSUMER_ASSET_MISMATCH']) {
    console.log(`${id}=PASS`);
  }
}

runContractFixtures();

async function assertRenderedSkinRows(page, rows, label) {
  for (const heroId of new Set(rows.map((row) => row.heroId))) {
    await page.locator(`#hero-${heroId} .hero-skin-fullarts`).scrollIntoViewIfNeeded();
  }
  await page.waitForFunction(() => [...document.querySelectorAll('.hero-skin-fullarts img')]
    .every((image) => image.complete && image.naturalWidth > 0), undefined, { timeout: 60_000 });
  const actual = await page.evaluate(() => [...document.querySelectorAll('#heroes .hero-card')].flatMap((card) => {
    const heroId = Number(card.id.match(/^hero-(\d+)$/)?.[1]);
    return [...card.querySelectorAll('.hero-skin-fullarts img')].map((image) => ({
      heroId,
      imageUrl: new URL(image.src).pathname,
      alt: image.alt,
      objectFit: getComputedStyle(image).objectFit,
      decoded: image.complete && image.naturalWidth > 0,
    }));
  }).sort((a, b) => a.heroId - b.heroId));
  const expected = rows.map((row) => {
    const group = rowsForHero(rows, row.heroId);
    return {
      heroId: row.heroId,
      imageUrl: new URL(row.imageUrl, 'https://fixture.invalid').pathname,
      alt: `영웅 스킨 일러스트 ${group.findIndex((item) => item.skinId === row.skinId) + 1} / ${group.length}`,
    };
  });
  assert.deepEqual(actual.map(({ heroId, imageUrl }) => ({ heroId, imageUrl })),
    expected.map(({ heroId, imageUrl }) => ({ heroId, imageUrl })),
    `${label}: rendered records differ from approved Consumer and Asset mapping`);
  assert.ok(actual.every((row, index) => row.alt === expected[index].alt), `${label}: accessible label/order mismatch`);
  assert.ok(actual.every((row) => row.decoded && row.objectFit === 'contain'), `${label}: image decode/aspect ratio failed`);
}
const shaPattern = /^[0-9a-f]{40}$/;
for (const key of ['QA_INFRASTRUCTURE_SHA', 'PR_BASE_SHA', 'PR_HEAD_SHA', 'BROWSER_TEST_SOURCE_SHA', 'SITE_SOURCE_SHA', 'BUILD_VALIDATION_SHA']) {
  assert.match(process.env[key], shaPattern, `${key} must be a full Git SHA`);
}
assert.equal(process.env.BROWSER_TEST_SOURCE_SHA, process.env.QA_INFRASTRUCTURE_SHA,
  'Browser test source must match the verified QA infrastructure checkout');
assert.equal(process.env.BUILD_VALIDATION_SHA, process.env.SITE_SOURCE_SHA,
  'Build validation must match the served site source');

function gitHead(root) {
  return execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
}

const actualQaSha = gitHead(qaRoot);
const actualSiteSha = gitHead(siteRoot);
const scriptRoot = resolve(fileURLToPath(import.meta.url), '..', '..');
const actualTestSourceSha = gitHead(scriptRoot);
assert.equal(actualQaSha, process.env.QA_INFRASTRUCTURE_SHA, 'QA infrastructure checkout SHA mismatch');
assert.equal(actualSiteSha, process.env.SITE_SOURCE_SHA, 'site source checkout SHA mismatch');
assert.equal(actualTestSourceSha, process.env.BROWSER_TEST_SOURCE_SHA, 'Browser test source checkout SHA mismatch');
assert.equal(await stat(resolve(siteRoot, 'index.html')).then((result) => result.isFile()), true);
assert.equal(await stat(resolve(siteRoot, 'generated')).then((result) => result.isDirectory()), true);

console.log(`INFRA_BASE_SHA=${process.env.PR_BASE_SHA}`);
console.log(`INFRA_HEAD_SHA=${process.env.PR_HEAD_SHA}`);
console.log(`QA_INFRASTRUCTURE_SHA=${actualQaSha}`);
console.log(`GITHUB_WORKFLOW_EVENT_SHA=${process.env.WORKFLOW_EVENT_SHA}`);
console.log(`GITHUB_CHECKOUT_SHA=${actualSiteSha}`);
console.log(`BROWSER_TEST_SOURCE_SHA=${actualTestSourceSha}`);
console.log(`SITE_SOURCE_SHA=${actualSiteSha}`);
console.log(`BUILD_VALIDATION_SHA=${process.env.BUILD_VALIDATION_SHA}`);
console.log(`SERVER_ROOT_PATH=${siteRoot}`);
console.log('SERVER_ROOT_KIND=SOURCE_STATIC_ROOT_SERVED');

const mimeTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.webp', 'image/webp'],
]);

let servedRoot = siteRoot;
let fixtureTempRoot;
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    const pathname = decodeURIComponent(url.pathname);
    const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const filePath = resolve(servedRoot, relativePath);
    if (filePath !== servedRoot && !filePath.startsWith(`${servedRoot}${sep}`)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    const body = await readFile(filePath);
    response.writeHead(200, {
      'content-type': mimeTypes.get(extname(filePath)) ?? 'application/octet-stream',
      'content-length': body.length,
      'cache-control': 'no-store',
    });
    response.end(body);
  } catch (error) {
    const status = error?.code === 'ENOENT' ? 404 : 500;
    response.writeHead(status, { 'content-type': 'text/plain; charset=utf-8' });
    response.end(status === 404 ? 'Not Found' : 'Internal Server Error');
  }
});

let browser;
let origin;
const pageErrors = [];
const consoleErrors = [];
const resourceFailures = [];
const loadedSameOriginPaths = new Set();

try {
  await new Promise((resolveListen, rejectListen) => {
    server.once('error', rejectListen);
    server.listen(0, '127.0.0.1', resolveListen);
  });
  const address = server.address();
  assert.ok(address && typeof address === 'object', 'server did not expose a TCP listener');
  origin = `http://127.0.0.1:${address.port}`;
  console.log(`SERVER_LISTEN_URL=${origin}`);

  const htmlResponse = await fetch(`${origin}/`);
  assert.equal(htmlResponse.status, 200, 'local server must serve index.html');
  const html = await htmlResponse.text();
  assert.match(html, /<html\b/i, 'local server root must return the site HTML');
  console.log(`SERVER_HTML_HTTP_STATUS=${htmlResponse.status}`);

  browser = await chromium.launch({ headless: true });
  console.log(`BROWSER_NAME=Chromium`);
  console.log(`BROWSER_VERSION=${browser.version()}`);
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('response', (response) => {
    if (new URL(response.url()).origin !== origin) return;
    const pathname = new URL(response.url()).pathname;
    loadedSameOriginPaths.add(pathname);
    if (!response.ok()) resourceFailures.push(`${response.status()} ${pathname}`);
  });
  page.on('requestfailed', (request) => {
    if (new URL(request.url()).origin === origin) {
      resourceFailures.push(`REQUEST_FAILED ${new URL(request.url()).pathname}: ${request.failure()?.errorText ?? 'unknown'}`);
    }
  });

  const expectedGenerated = [
    '/generated/hero-slice.v1.json',
    '/generated/hero-soldier-relations.v1.json',
    '/generated/skin-consumer-public-m05-g.v1.json',
    '/generated/skin-assets-public-m05-g.v1.json',
    '/skin-asset-publication-contract.mjs',
    '/generated/normal-soldiers.v1.json',
    '/generated/sp-soldiers.v1.json',
    '/generated/job-glossary.v1.json',
    '/generated/general-ssr-equipment.v1.json',
    '/generated/exclusive-equipment.v1.json',
    '/generated/soldier-training-tech-descriptions.v1.json',
  ];
  const anchors = [
    ['영웅', 'heroes'],
    ['일반 SSR 장비', 'general-ssr-equipment'],
    ['전용 장비', 'exclusive-equipment'],
    ['SP 용병', 'sp-soldiers'],
    ['일반 용병', 'normal-soldiers'],
    ['전직명 사전', 'job-glossary'],
  ];
  const renderedSelectors = [
    '#heroes .hero-card',
    '#hero-1 .hero-skin-fullarts img',
    '#hero-6 .hero-skin-fullarts img',
    '#general-ssr-equipment .general-equipment-card',
    '#exclusive-equipment .general-equipment-card',
    '#sp-soldiers .sp-soldier-card',
    '#normal-soldiers .sp-soldier-card',
    '#job-glossary tr',
    '#normal-soldier-115 .soldier-training-tech-descriptions',
    '#sp-soldier-5115 .soldier-training-tech-descriptions',
  ];

  for (const [label, id] of anchors) {
    const occurrence = html.match(new RegExp(`\\bid="${id}"`, 'g')) ?? [];
    assert.equal(occurrence.length, 1, `HTML must contain exactly one #${id}`);
    const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert.match(html, new RegExp(`<a\\s+href="#${id}">\\s*${escapedLabel}\\s*</a>`, 'u'),
      `HTML must contain the expected ${label} anchor`);
  }

  const viewports = [
    { name: 'desktop-1440', width: 1440, height: 1000 },
    { name: 'mobile-390', width: 390, height: 844 },
  ];
  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(`${origin}/`, { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForFunction((selectors) => selectors.every((selector) => document.querySelector(selector)), renderedSelectors, { timeout: 60_000 });
    await assertRenderedSkinRows(page, publishedSkinRows, `BASELINE-${viewport.name}`);

    const layout = await page.evaluate(() => ({
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      navigationVisible: Boolean(document.querySelector('nav.section-shortcuts')?.getClientRects().length),
      links: [...document.querySelectorAll('nav.section-shortcuts a')].map((link) => ({
        label: link.textContent.trim(),
        href: link.getAttribute('href'),
        visible: Boolean(link.getClientRects().length),
      })),
      rendered: {
        heroes: document.querySelectorAll('#heroes .hero-card').length,
        heroOneSkinImages: document.querySelectorAll('#hero-1 .hero-skin-fullarts img').length,
        heroSixSkinImages: document.querySelectorAll('#hero-6 .hero-skin-fullarts img').length,
        skinSections: document.querySelectorAll('#heroes .hero-card .hero-skin-fullarts').length,
        generalEquipment: document.querySelectorAll('#general-ssr-equipment .general-equipment-card').length,
        exclusiveEquipment: document.querySelectorAll('#exclusive-equipment .general-equipment-card').length,
        spSoldiers: document.querySelectorAll('#sp-soldiers .sp-soldier-card').length,
        normalSoldiers: document.querySelectorAll('#normal-soldiers .sp-soldier-card').length,
        jobRows: document.querySelectorAll('#job-glossary tr').length,
      },
      trainingTech: (() => {
        const normal = document.querySelector('#normal-soldier-115 .soldier-training-tech-descriptions');
        const sp = document.querySelector('#sp-soldier-5115 .soldier-training-tech-descriptions');
        return {
          normalVisible: Boolean(normal?.getClientRects().length),
          spVisible: Boolean(sp?.getClientRects().length),
          normalCollapsed: normal?.open === false,
          spCollapsed: sp?.open === false,
          normalSourceIds: normal ? [...normal.querySelectorAll('.soldier-training-tech-label')].map((label) => label.textContent) : [],
          spSourceIds: sp ? [...sp.querySelectorAll('.soldier-training-tech-label')].map((label) => label.textContent) : [],
          normalProvenance: normal ? [...normal.querySelectorAll('.soldier-training-tech-list .soldier-training-tech-source')].map((node) => node.textContent) : [],
          spProvenance: sp ? [...sp.querySelectorAll('.soldier-training-tech-list .soldier-training-tech-source')].map((node) => node.textContent) : [],
          normalDisclosure: normal?.querySelector('summary')?.textContent ?? '',
          normalNotice: normal?.querySelector('.soldier-training-tech-notice')?.textContent ?? '',
          spNotice: sp?.querySelectorAll('.soldier-training-tech-notice')?.[1]?.textContent ?? '',
        };
      })(),
      skinPresentation: (() => {
        const section = document.querySelector('#hero-1 .hero-skin-fullarts');
        const images = [...(section?.querySelectorAll('img') ?? [])];
        return {
          heading: section?.querySelector('h3')?.textContent ?? '',
          labels: images.map((image) => image.alt),
          sources: images.map((image) => new URL(image.src).pathname),
          naturalWidths: images.map((image) => image.naturalWidth),
          objectFits: images.map((image) => getComputedStyle(image).objectFit),
          visibleText: section?.innerText ?? '',
        };
      })(),
      heroSixSkinPresentation: (() => {
        const section = document.querySelector('#hero-6 .hero-skin-fullarts');
        const images = [...(section?.querySelectorAll('img') ?? [])];
        return {
          heading: section?.querySelector('h3')?.textContent ?? '',
          labels: images.map((image) => image.alt),
          sources: images.map((image) => new URL(image.src).pathname),
          naturalWidths: images.map((image) => image.naturalWidth),
          objectFits: images.map((image) => getComputedStyle(image).objectFit),
          visibleText: section?.innerText ?? '',
        };
      })(),
    }));
    assert.equal(layout.viewportWidth, viewport.width);
    assert.ok(layout.navigationVisible, `${viewport.name}: section navigation must be visible`);
    assert.equal(layout.links.length, 6, `${viewport.name}: expected six shortcut links`);
    assert.ok(layout.links.every((link) => link.visible), `${viewport.name}: every shortcut must be visible`);
    assert.ok(Object.entries(layout.rendered).filter(([name]) => name !== 'otherHeroSkinSections')
      .every(([, count]) => count > 0), `${viewport.name}: expected site content must render`);
    assert.equal(layout.rendered.heroOneSkinImages, rowsForHero(publishedSkinRows, 1).length, `${viewport.name}: Hero 1 must display all approved Skin Fullarts`);
    assert.equal(layout.rendered.heroSixSkinImages, rowsForHero(publishedSkinRows, 6).length, `${viewport.name}: Hero 6 must display all approved Skin Fullarts`);
    assert.equal(layout.rendered.skinSections, new Set(publishedSkinRows.map((row) => row.heroId)).size,
      `${viewport.name}: each approved Hero must have one Skin section`);
    assert.equal(layout.skinPresentation.heading, '스킨 일러스트');
    const heroOneExpected = rowsForHero(publishedSkinRows, 1);
    assert.deepEqual(layout.skinPresentation.sources, heroOneExpected.map((row) => new URL(row.imageUrl, 'https://example.invalid').pathname));
    assert.deepEqual(layout.skinPresentation.labels, heroOneExpected.map((_, index) => `영웅 스킨 일러스트 ${index + 1} / ${heroOneExpected.length}`));
    assert.equal(layout.heroSixSkinPresentation.heading, '스킨 일러스트');
    const heroSixExpected = rowsForHero(publishedSkinRows, 6);
    assert.deepEqual(layout.heroSixSkinPresentation.sources, heroSixExpected.map((row) => new URL(row.imageUrl, 'https://example.invalid').pathname),
      `${viewport.name}: Hero 6 images must follow approved Source Order and URL mapping`);
    assert.deepEqual(layout.heroSixSkinPresentation.labels, heroSixExpected.map((_, index) => `영웅 스킨 일러스트 ${index + 1} / ${heroSixExpected.length}`));
    assert.ok(layout.heroSixSkinPresentation.naturalWidths.every((width) => width > 0), `${viewport.name}: every Hero 6 Skin WebP must decode`);
    assert.ok(layout.heroSixSkinPresentation.objectFits.every((value) => value === 'contain'), `${viewport.name}: Hero 6 fullart aspect ratios must be preserved`);
    assert.ok(layout.skinPresentation.naturalWidths.every((width) => width > 0), `${viewport.name}: each Skin WebP must decode`);
    assert.ok(layout.skinPresentation.objectFits.every((value) => value === 'contain'), `${viewport.name}: fullart aspect ratio must be preserved`);
    const visibleSkinSections = await page.locator('.hero-skin-fullarts').allTextContents();
    for (const text of visibleSkinSections) assert.doesNotMatch(text, /执事美酒|灵魂指挥|铸剑的英雄|妙想假日|SkinID/);
    for (const text of visibleSkinSections) {
      for (const row of publishedSkinRows) assert.doesNotMatch(text, new RegExp(`\\b${row.skinId}\\b`));
    }
    assert.equal(layout.trainingTech.normalVisible, true, `${viewport.name}: NORMAL 115 presentation must render`);
    assert.equal(layout.trainingTech.spVisible, true, `${viewport.name}: SP 5115 presentation must render`);
    assert.equal(layout.trainingTech.normalCollapsed, true, `${viewport.name}: NORMAL disclosure must start collapsed`);
    assert.equal(layout.trainingTech.spCollapsed, true, `${viewport.name}: SP disclosure must start collapsed`);
    assert.equal(layout.trainingTech.normalSourceIds.length, 10, `${viewport.name}: NORMAL must show ten exact claims`);
    assert.equal(layout.trainingTech.spSourceIds.length, 10, `${viewport.name}: SP must show ten exact claims`);
    assert.equal(layout.trainingTech.normalProvenance.length, 10, `${viewport.name}: NORMAL source provenance must be displayed for all ten claims`);
    assert.equal(layout.trainingTech.spProvenance.length, 10, `${viewport.name}: SP source provenance must be displayed for all ten claims`);
    assert.ok(layout.trainingTech.normalProvenance.every((text) => text.includes('Relation: evidence/source/configdata/')));
    assert.ok(layout.trainingTech.spProvenance.every((text) => text.includes('LevelInfo link: evidence/source/configdata/')));
    assert.ok(layout.trainingTech.normalSourceIds.every((label) => label.includes('Source Field Description')));
    assert.ok(layout.trainingTech.spSourceIds.every((label) => label.includes('Source Field SpSoidlierDescription')));
    assert.match(layout.trainingTech.normalDisclosure, /한국어 공식 번역 아님/u);
    assert.match(layout.trainingTech.normalNotice, /LevelInfo ID는 원본 레코드 식별자/u);
    assert.match(layout.trainingTech.spNotice, /슬롯·시점·게임 내 적용 의미는 확인되지 않았습니다/u);
    assert.ok(layout.documentWidth <= viewport.width, `${viewport.name}: horizontal overflow detected (${layout.documentWidth}px)`);

    for (const [, id] of anchors) {
      const link = page.locator(`nav.section-shortcuts a[href="#${id}"]`);
      assert.equal(await link.count(), 1, `${viewport.name}: shortcut #${id} must be unique`);
      await link.click();
      assert.equal(new URL(page.url()).hash, `#${id}`, `${viewport.name}: clicking #${id} must update the URL hash`);
      assert.equal(await page.locator(`#${id}`).count(), 1, `${viewport.name}: target #${id} must exist`);
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
