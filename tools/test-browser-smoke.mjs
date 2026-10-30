import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

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

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    const pathname = decodeURIComponent(url.pathname);
    const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const filePath = resolve(siteRoot, relativePath);
    if (filePath !== siteRoot && !filePath.startsWith(`${siteRoot}${sep}`)) {
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
    await page.locator('#hero-1 .hero-skin-fullarts').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => [...document.querySelectorAll('#hero-1 .hero-skin-fullarts img')].length === 4
      && [...document.querySelectorAll('#hero-1 .hero-skin-fullarts img')].every((image) => image.complete && image.naturalWidth > 0), undefined, { timeout: 60_000 });

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
        otherHeroSkinSections: [...document.querySelectorAll('#heroes .hero-card:not(#hero-1)')]
          .filter((card) => card.querySelector('.hero-skin-fullarts')).length,
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
    }));
    assert.equal(layout.viewportWidth, viewport.width);
    assert.ok(layout.navigationVisible, `${viewport.name}: section navigation must be visible`);
    assert.equal(layout.links.length, 6, `${viewport.name}: expected six shortcut links`);
    assert.ok(layout.links.every((link) => link.visible), `${viewport.name}: every shortcut must be visible`);
    assert.ok(Object.entries(layout.rendered).filter(([name]) => name !== 'otherHeroSkinSections')
      .every(([, count]) => count > 0), `${viewport.name}: expected site content must render`);
    assert.equal(layout.rendered.heroOneSkinImages, 4, `${viewport.name}: Hero 1 must display four Skin Fullarts`);
    assert.equal(layout.rendered.otherHeroSkinSections, 0, `${viewport.name}: other Heroes must not receive Skin Fullarts`);
    assert.equal(layout.skinPresentation.heading, '스킨 일러스트');
    assert.deepEqual(layout.skinPresentation.sources, [102, 103, 104, 105].map((id) => `/assets/skins/skin-${id}.webp`));
    assert.deepEqual(layout.skinPresentation.labels, [1, 2, 3, 4].map((index) => `영웅 스킨 일러스트 ${index} / 4`));
    assert.ok(layout.skinPresentation.naturalWidths.every((width) => width > 0), `${viewport.name}: each Skin WebP must decode`);
    assert.ok(layout.skinPresentation.objectFits.every((value) => value === 'contain'), `${viewport.name}: fullart aspect ratio must be preserved`);
    assert.doesNotMatch(layout.skinPresentation.visibleText, /执事美酒|灵魂指挥|铸剑的英雄|妙想假日|102|103|104|105|601/);
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
  if (server.listening) {
    await new Promise((resolveClose, rejectClose) => server.close((error) => error ? rejectClose(error) : resolveClose()));
  }
  console.log(`BROWSER_CLOSED=${!browser || browser.isConnected() === false}`);
  console.log(`SERVER_CLOSED=${!server.listening}`);
}
