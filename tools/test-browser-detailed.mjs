import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const argv = new Set(process.argv.slice(2));
const runnerValidation = argv.has('--runner-validation');
if ([...argv].some((arg) => arg !== '--runner-validation')) throw new Error(`Unsupported argument: ${[...argv].find((arg) => arg !== '--runner-validation')}`);

const requiredEnvironment = ['QA_INFRASTRUCTURE_ROOT', 'QA_INFRASTRUCTURE_SHA', 'SITE_SOURCE_ROOT', 'SITE_SOURCE_SHA', 'PLAYWRIGHT_PACKAGE_ROOT'];
for (const key of requiredEnvironment) assert.ok(process.env[key], `${key} is required`);
const shaPattern = /^[0-9a-f]{40}$/;
for (const key of ['QA_INFRASTRUCTURE_SHA', 'SITE_SOURCE_SHA']) assert.match(process.env[key], shaPattern, `${key} must be a full Git SHA`);
const qaRoot = resolve(process.env.QA_INFRASTRUCTURE_ROOT);
const siteRoot = resolve(process.env.SITE_SOURCE_ROOT);
const require = createRequire(resolve(process.env.PLAYWRIGHT_PACKAGE_ROOT, 'package.json'));
const { chromium } = require('playwright');
const scriptPath = resolve(fileURLToPath(import.meta.url));
const scriptSha256 = createHash('sha256').update(await readFile(scriptPath)).digest('hex');
const resultPath = resolve(process.env.BROWSER_QA_RESULT_PATH || `${process.env.RUNNER_TEMP || process.cwd()}/ux03a-detailed-browser-qa.json`);
const summaryPath = process.env.GITHUB_STEP_SUMMARY;
const startedAt = new Date().toISOString();

function head(root) { return execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); }
const actualQaSha = head(qaRoot);
const actualSiteSha = head(siteRoot);
const actualScriptPath = resolve(qaRoot, 'tools/test-browser-detailed.mjs');
assert.equal(scriptPath, actualScriptPath, 'executed script must come from the QA Infrastructure checkout');
assert.equal(actualQaSha, process.env.QA_INFRASTRUCTURE_SHA, 'QA Infrastructure checkout SHA mismatch');
assert.equal(actualSiteSha, process.env.SITE_SOURCE_SHA, 'Site checkout SHA mismatch');
if (!runnerValidation && process.env.EXPECTED_PR_HEAD_SHA) {
  assert.equal(process.env.CURRENT_PR_HEAD_SHA, process.env.EXPECTED_PR_HEAD_SHA, 'current PR Head differs from the approved Expected Head');
  assert.equal(actualSiteSha, process.env.EXPECTED_PR_HEAD_SHA, 'actual Site checkout differs from the approved Expected Head');
}
if (process.env.EXPECTED_INFRA_PR_HEAD_SHA) {
  assert.equal(process.env.EXPECTED_INFRA_PR_HEAD_SHA, actualQaSha, 'QA_SOURCE_PROVENANCE_BLOCKER: Infrastructure PR Head differs from QA checkout');
}
const infraScriptSha = createHash('sha256').update(await readFile(actualScriptPath)).digest('hex');
assert.equal(infraScriptSha, scriptSha256, 'executed script bytes differ from the Infrastructure checkout script');
function consumerBlobSha(path) {
  return execFileSync('git', ['-C', siteRoot, 'rev-parse', `${actualSiteSha}:${path}`], { encoding: 'utf8' }).trim();
}

const mime = new Map([['.css','text/css; charset=utf-8'],['.html','text/html; charset=utf-8'],['.js','text/javascript; charset=utf-8'],['.json','application/json'],['.svg','image/svg+xml'],['.png','image/png'],['.webp','image/webp']]);
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://127.0.0.1').pathname);
    const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const file = resolve(siteRoot, relative);
    if (file !== siteRoot && !file.startsWith(`${siteRoot}${sep}`)) { response.writeHead(403).end('Forbidden'); return; }
    const body = await readFile(file);
    response.writeHead(200, { 'content-type': mime.get(extname(file)) ?? 'application/octet-stream', 'content-length': body.length, 'cache-control': 'no-store' });
    response.end(body);
  } catch (error) {
    response.writeHead(error?.code === 'ENOENT' ? 404 : 500).end(error?.code === 'ENOENT' ? 'Not Found' : 'Internal Server Error');
  }
});

const results = [];
const pageErrors = [];
const consoleErrors = [];
const failedRequests = [];
const resourceResponses = new Map();
let browser;
let page;
let origin;
let fatalError;
let browserClosed = false;

function buildResult(id, mode, status, expected, observed = {}, error = null, category = null) {
  return {
    testId: id, qaMode: mode, siteSourceSha: actualSiteSha, qaInfrastructureSha: actualQaSha,
    qaScriptPath: scriptPath, qaScriptSha256: scriptSha256, browserVersion: browser?.version() ?? null,
    viewport: page ? page.viewportSize() : null, expected, observed, computedCss: observed.computedCss ?? null,
    boundingBox: observed.boundingBox ?? null, scrollPosition: observed.scrollPosition ?? null,
    urlHash: observed.urlHash ?? null, focusedElement: observed.focusedElement ?? null,
    resultStatus: status, errorCategory: category, error, timestamp: new Date().toISOString(),
  };
}

function record(id, mode, status, expected, observed = {}, error = null, category = null) {
  const result = buildResult(id, mode, status, expected, observed, error, category);
  results.push(result);
  return result;
}

function classifyFailure(error) {
  const timeout = /Timeout|timeout/i.test(error?.name ?? '') || /Timeout/i.test(error?.message ?? '');
  return {
    status: error?.contractGap ? 'TEST_CONTRACT_GAP' : timeout ? 'REVIEW' : 'FAIL',
    category: error?.contractGap ? 'TEST_CONTRACT_GAP' : timeout ? 'TIMEOUT' : error?.runnerFailure ? 'RUNNER_RUNTIME_FAILURE' : 'ASSERTION_FAILURE',
  };
}

function failureResult(id, mode, expected, error) {
  const { status, category } = classifyFailure(error);
  return buildResult(id, mode, status, expected, error?.observed ?? {}, error?.stack ?? String(error), category);
}

function attachObservedGeometry(error, geometry) {
  error.observed = geometry;
  return error;
}

function processExitCode(requiredResults, error) {
  return error || requiredResults.some(({ resultStatus }) => resultStatus !== 'PASS') ? 1 : 0;
}

function assessAnchorTargetGeometry(geometry, tolerance = 1) {
  const targetRect = geometry.targetRect;
  const effectiveContentRect = geometry.effectiveContentRect ?? targetRect;
  const navigationRect = geometry.navigationRect;
  const scrollY = geometry.scroll?.y;
  const maxScrollY = geometry.scroll?.maxY;
  const scrollMarginTop = geometry.computedCss?.target?.scrollMarginTopPx;
  const atDocumentTop = Number.isFinite(scrollY) && scrollY <= tolerance;
  const atDocumentEnd = Number.isFinite(scrollY) && Number.isFinite(maxScrollY)
    && maxScrollY - scrollY <= tolerance;
  const targetVisible = Boolean(geometry.targetExists && targetRect && targetRect.height > 0
    && effectiveContentRect && effectiveContentRect.height > 0
    && effectiveContentRect.bottom > 0 && effectiveContentRect.top < geometry.viewport?.height);
  const navigationVisible = Boolean(navigationRect && geometry.computedCss?.navigation?.display !== 'none'
    && geometry.computedCss?.navigation?.visibility !== 'hidden'
    && Number(geometry.computedCss?.navigation?.opacity ?? 1) > 0
    && navigationRect.height > 0);
  const targetStartsBelowNavigation = Boolean(effectiveContentRect && navigationRect
    && effectiveContentRect.top >= navigationRect.bottom - 1);
  const offsetMatches = Number.isFinite(scrollMarginTop) && targetRect
    && Math.abs(targetRect.top - scrollMarginTop) <= tolerance;
  const offsetValid = atDocumentTop || atDocumentEnd || Boolean(offsetMatches);
  const hashMatches = geometry.urlHash === `#${geometry.anchorId}`;
  const passed = Boolean(geometry.targetExists && geometry.effectiveContentExists && hashMatches
    && targetVisible && navigationVisible && targetStartsBelowNavigation && offsetValid);
  let message = 'anchor target must exist, match its hash, and remain accessible below sticky navigation';
  if (!geometry.targetExists) message = `anchor target #${geometry.anchorId} must exist`;
  else if (!geometry.effectiveContentExists) message = `anchor target #${geometry.anchorId} must contain measurable content`;
  else if (!hashMatches) message = `anchor #${geometry.anchorId} hash must resolve to its target`;
  else if (!targetVisible) message = `anchor target #${geometry.anchorId} must remain in the viewport`;
  else if (!navigationVisible) message = 'sticky navigation must be visibly rendered for target clearance checks';
  else if (!targetStartsBelowNavigation) message = `anchor target #${geometry.anchorId} content must start below sticky navigation`;
  else if (!offsetValid) message = `anchor target #${geometry.anchorId} must honor its scroll margin within ${tolerance}px`;
  return {
    passed, message, atDocumentTop, atDocumentEnd, hashMatches,
    targetVisible, navigationVisible, targetStartsBelowNavigation,
    offsetMatches: Boolean(offsetMatches), offsetValid,
  };
}

function assertAnchorTargetGeometry(geometry) {
  const assessment = assessAnchorTargetGeometry(geometry);
  assert.ok(assessment.passed, assessment.message);
  return assessment;
}

function validateFailureSerializationFixture() {
  const fixtureGeometry = {
    anchorId: 'general-ssr-equipment',
    headingSelector: '#general-equipment-title',
    targetSelector: '#general-ssr-equipment',
    viewport: { width: 1440, height: 1000, devicePixelRatio: 1 },
    navigationRect: { left: 0, right: 1440, top: 0, bottom: 54, width: 1440, height: 54 },
    headingRect: { left: 120, right: 700, top: 88, bottom: 120, width: 580, height: 32 },
    targetRect: { left: 120, right: 1320, top: 20, bottom: 1200, width: 1200, height: 1180 },
    effectiveContentRect: { left: 120, right: 1320, top: 20, bottom: 80, width: 1200, height: 60 },
    targetExists: true, effectiveContentExists: true, targetType: 'grid',
    scroll: { x: 0, y: 640, maxY: 9000 },
    scrollPosition: { x: 0, y: 640 },
    urlHash: '#general-ssr-equipment',
    computedCss: {
      target: { scrollMarginTop: '56px', scrollMarginTopPx: 56 },
      navigation: { display: 'block', visibility: 'visible', opacity: '1', position: 'sticky', top: '0px' },
      navigationPosition: 'sticky', navigationTop: '0px',
    },
    measuredAt: 'fixture',
    scrollStable: true,
  };
  let assertionError;
  try {
    assertAnchorTargetGeometry(fixtureGeometry);
  } catch (error) {
    assertionError = attachObservedGeometry(error, fixtureGeometry);
  }

  assert.ok(assertionError, 'fixture must produce the expected assertion failure');
  const serialized = JSON.stringify(failureResult('UX03A-HEADING-VISIBILITY', 'detailed', 'fixture assertion fails', assertionError));
  const restored = JSON.parse(serialized);
  assert.equal(restored.resultStatus, 'FAIL', 'expected assertion failure must remain FAIL');
  assert.equal(restored.errorCategory, 'ASSERTION_FAILURE', 'fixture must preserve assertion category');
  assert.ok(restored.error.includes('anchor target #general-ssr-equipment content must start below sticky navigation'), 'fixture must preserve the assertion message');
  assert.deepEqual(restored.observed, fixtureGeometry, 'serialized failure must preserve anchor geometry');
  assert.equal(restored.observed.anchorId, 'general-ssr-equipment', 'failure must identify its anchor');
  assert.equal(restored.observed.urlHash, '#general-ssr-equipment', 'failure must preserve URL hash');
  assert.equal(processExitCode([restored], null), 1, 'detailed assertion failure must propagate to a non-zero exit');
  const normalFixture = {
    ...fixtureGeometry,
    targetRect: { ...fixtureGeometry.targetRect, top: 56 },
    effectiveContentRect: { ...fixtureGeometry.effectiveContentRect, top: 56 },
    scroll: { x: 0, y: 640, maxY: 9000 },
    computedCss: { ...fixtureGeometry.computedCss, target: { scrollMarginTop: '56px', scrollMarginTopPx: 56 } },
  };
  assert.equal(assertAnchorTargetGeometry(normalFixture).passed, true, 'normal target alignment must pass');
  const alternateLayout = {
    ...normalFixture,
    navigationRect: { ...normalFixture.navigationRect, bottom: 60, height: 60 },
    effectiveContentRect: { ...normalFixture.effectiveContentRect, top: 72 },
    targetRect: { ...normalFixture.targetRect, top: 72 },
    computedCss: { ...normalFixture.computedCss, target: { scrollMarginTop: '4.5rem', scrollMarginTopPx: 72 } },
  };
  assert.equal(assertAnchorTargetGeometry(alternateLayout).passed, true, 'different navigation and root sizing must pass when the computed offset is honored');
  const endLimited = {
    ...alternateLayout,
    scroll: { x: 0, y: 500, maxY: 500 },
    effectiveContentRect: { ...alternateLayout.effectiveContentRect, top: 90 },
    targetRect: { ...alternateLayout.targetRect, top: 90 },
  };
  assert.equal(assertAnchorTargetGeometry(endLimited).passed, true, 'a confirmed document-end limit may constrain offset while content remains accessible');
  const aboveViewport = { ...normalFixture, effectiveContentRect: { ...normalFixture.effectiveContentRect, top: -20, bottom: 40 }, targetRect: { ...normalFixture.targetRect, top: -20, bottom: 40 } };
  assert.equal(assessAnchorTargetGeometry(aboveViewport).passed, false, 'above-viewport content must fail');
  const offsetViolation = { ...normalFixture, effectiveContentRect: { ...normalFixture.effectiveContentRect, top: 90 }, targetRect: { ...normalFixture.targetRect, top: 90 } };
  assert.equal(assessAnchorTargetGeometry(offsetViolation).passed, false, 'an unbounded offset violation must fail');
  const missingTarget = { ...normalFixture, targetExists: false, effectiveContentExists: false };
  assert.equal(assessAnchorTargetGeometry(missingTarget).passed, false, 'a missing target must fail');
  const hashMismatch = { ...normalFixture, urlHash: '#heroes' };
  assert.equal(assessAnchorTargetGeometry(hashMismatch).passed, false, 'a mismatched hash must fail');
  return {
    fixtureOutcome: 'EXPECTED_ASSERTION_FAILURE',
    resultStatus: restored.resultStatus,
    errorCategory: restored.errorCategory,
    anchorId: restored.observed.anchorId,
    geometrySerialized: true,
    detailedExitCode: processExitCode([restored], null),
    targetAssertionFixtures: {
      normalAlignment: true, alternateLayout: true, endLimitedAccessible: true,
      navigationOcclusion: true, aboveViewport: true, offsetViolation: true,
      missingTarget: true, hashMismatch: true,
    },
  };
}

async function test(id, expected, body) {
  try { record(id, runnerValidation ? 'runner-validation' : 'detailed', 'PASS', expected, await body()); }
  catch (error) {
    results.push(failureResult(id, runnerValidation ? 'runner-validation' : 'detailed', expected, error));
  }
}

async function settle() {
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function stableScroll() {
  await page.waitForFunction(() => {
    const y = window.scrollY;
    return new Promise((resolve) => requestAnimationFrame(() => resolve(Math.abs(window.scrollY - y) < 1)));
  }, null, { timeout: 5000 });
}

const anchorIds = ['heroes','general-ssr-equipment','exclusive-equipment','sp-soldiers','normal-soldiers','job-glossary'];
const navSelector = 'nav.section-shortcuts';

try {
  await new Promise((resolveListen, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolveListen); });
  origin = `http://127.0.0.1:${server.address().port}`;
  const htmlResponse = await fetch(`${origin}/`);
  assert.equal(htmlResponse.status, 200, 'static site root must serve index.html');
  browser = await chromium.launch({ headless: true });
  page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('requestfailed', (request) => { if (new URL(request.url()).origin === origin) failedRequests.push(`${new URL(request.url()).pathname}: ${request.failure()?.errorText ?? 'failed'}`); });
  page.on('response', (response) => { if (new URL(response.url()).origin === origin) resourceResponses.set(new URL(response.url()).pathname, response.status()); });
  await page.goto(`${origin}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('#heroes .hero-card', { timeout: 60000 });
  await settle();

  if (runnerValidation) {
    const harness = [
      ['HARNESS-SCRIPT-PARSE', async () => ({ scriptSha256 })],
      ['HARNESS-CHROMIUM-LAUNCH', async () => ({ browserVersion: browser.version() })],
      ['HARNESS-SITE-CONNECTION', async () => ({ origin, title: await page.title(), status: htmlResponse.status })],
      ['HARNESS-DOM-QUERY', async () => { const heroCount=await page.locator('#heroes .hero-card').count(); assert.ok(heroCount>0,'DOM query must find rendered hero records'); return { heroCount }; }],
      ['HARNESS-COMPUTED-CSS', async () => { const computedCss=await page.locator(navSelector).evaluate((el) => ({ display: getComputedStyle(el).display, position: getComputedStyle(el).position })); assert.ok(computedCss.display!=='none'); return { computedCss }; }],
      ['HARNESS-BOUNDING-BOX', async () => { const boundingBox=await page.locator(navSelector).boundingBox(); assert.ok(boundingBox && boundingBox.width>0 && boundingBox.height>0); return { boundingBox }; }],
      ['HARNESS-SCROLL', async () => { await page.evaluate(() => scrollTo(0, 120)); await stableScroll(); const scrollPosition=await page.evaluate(() => scrollY); assert.ok(scrollPosition>0); return { scrollPosition }; }],
      ['HARNESS-KEYBOARD', async () => { await page.evaluate(()=>{document.activeElement?.blur();document.body.focus();}); await page.keyboard.press('Tab'); const focusedElement=await page.evaluate(() => `${document.activeElement?.tagName.toLowerCase()}#${document.activeElement?.id}`); assert.ok(focusedElement.startsWith('a#')); return { focusedElement }; }],
      ['HARNESS-HISTORY', async () => { await page.evaluate(() => { history.pushState({qa:1}, '', '#heroes'); history.pushState({qa:2}, '', '#general-ssr-equipment'); }); await page.goBack(); await page.waitForFunction(()=>location.hash==='#heroes'); const back = await page.evaluate(() => location.hash); await page.goForward(); await page.waitForFunction(()=>location.hash==='#general-ssr-equipment'); const forward=await page.evaluate(() => location.hash); assert.equal(back,'#heroes'); assert.equal(forward,'#general-ssr-equipment'); return { back, forward }; }],
      ['HARNESS-JSON-RESULT', async () => ({ resultPath, sha256: scriptSha256 })],
      ['HARNESS-FAILURE-GEOMETRY-SERIALIZATION', async () => validateFailureSerializationFixture()],
    ];
    for (const [id, fn] of harness) await test(id, 'browser automation capability succeeds', fn);
  } else {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await test('UX03A-DESKTOP-STICKY', 'Desktop navigation remains sticky while scrolling', async () => {
      const nav = page.locator(navSelector); await assert.equal(await nav.count(), 1);
      const before = await nav.boundingBox();
      const css = await nav.evaluate((el) => ({ position: getComputedStyle(el).position, top: getComputedStyle(el).top }));
      assert.equal(css.position, 'sticky'); assert.equal(css.top, '0px');
      await page.evaluate(() => scrollTo(0, 500)); await stableScroll();
      const after = await nav.boundingBox();
      assert.ok(after && Math.abs(after.y) <= 1, `sticky nav top should stay at viewport top (${after?.y})`);
      assert.ok(before && after && after.y <= before.y, 'navigation should not move down while scrolling');
      return { computedCss: css, boundingBox: { before, after }, scrollPosition: await page.evaluate(() => scrollY), clickable: await nav.locator('a').first().isEnabled() };
    });

    await test('UX03A-ANCHOR-SCROLL', 'Every section link changes hash and reaches its target', async () => {
      const evidence = [];
      for (const id of anchorIds) {
        const link = page.locator(`${navSelector} a[href="#${id}"]`); assert.equal(await link.count(), 1, `link #${id}`);
        const prior = await page.evaluate(() => scrollY);
        await link.click(); await page.waitForFunction((target) => location.hash === `#${target}`, id); await stableScroll();
        const target = page.locator(`#${id}`); const box = await target.boundingBox(); assert.ok(box, `target #${id} is measurable`);
        const finalY = await page.evaluate(() => scrollY); assert.ok(Math.abs(finalY-prior)>0 || id==='heroes', `scroll should move for #${id}`);
        assert.ok(box.y >= -1 && box.y < 250, `target #${id} should be positioned in initial viewport band, got ${box.y}`);
        evidence.push({ id, hash: await page.evaluate(() => location.hash), box, scrollY: finalY });
      }
      return { anchors: evidence, urlHash: await page.evaluate(() => location.hash), scrollPosition: await page.evaluate(() => scrollY) };
    });

    await test('UX03A-HEADING-VISIBILITY', 'Anchor target content is accessible below sticky navigation and honors its scroll offset', async () => {
      const checks=[];
      for (const id of anchorIds) {
        await page.locator(`${navSelector} a[href="#${id}"]`).click(); await stableScroll();
        const geometry = await page.evaluate(({ anchorId, navigationSelector }) => {
          const target = document.getElementById(anchorId);
          const navigation = document.querySelector(navigationSelector);
          const targetType = target?.tagName.toLowerCase() === 'tbody' ? 'tbody' : 'grid';
          const effectiveContent = targetType === 'tbody' ? target?.querySelector('tr') : target;
          let heading = null;
          let headingSelector = null;
          if (target?.id === 'heroes') {
            headingSelector = `#${anchorId} .hero-card h2`;
            heading = target.querySelector('.hero-card h2');
          } else {
            const section = target?.closest('.general-equipment-section,.sp-soldier-section,.normal-soldier-section,.job-glossary-section');
            heading = section?.querySelector('.section-heading h2') ?? document.querySelector('main .page-heading h1');
            headingSelector = section?.querySelector('.section-heading h2') ? '.section-heading h2' : 'main .page-heading h1';
          }
          const rect = (element) => {
            if (!element) return null;
            const box = element.getBoundingClientRect();
            return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: box.width, height: box.height };
          };
          const css = (element) => {
            if (!element) return null;
            const style = getComputedStyle(element);
            return {
              display: style.display, visibility: style.visibility, opacity: style.opacity,
              position: style.position, top: style.top, zIndex: style.zIndex,
              backgroundColor: style.backgroundColor, overflow: style.overflow,
              scrollMarginTop: style.scrollMarginTop,
            };
          };
          const ancestorStyles = (element) => {
            const ancestors = [];
            for (let parent = element?.parentElement; parent; parent = parent.parentElement) {
              const style = getComputedStyle(parent);
              const clips = [style.overflow, style.overflowX, style.overflowY].some((value) => value !== 'visible');
              const createsStackingContext = style.position !== 'static' && style.zIndex !== 'auto';
              if (clips || createsStackingContext || style.transform !== 'none' || Number(style.opacity) < 1) {
                ancestors.push({
                  selector: `${parent.tagName.toLowerCase()}${parent.id ? `#${parent.id}` : ''}${parent.classList.length ? `.${[...parent.classList].join('.')}` : ''}`,
                  overflow: style.overflow, overflowX: style.overflowX, overflowY: style.overflowY,
                  position: style.position, zIndex: style.zIndex, opacity: style.opacity, transform: style.transform,
                });
              }
            }
            return ancestors;
          };
          const navigationRect = rect(navigation);
          const headingRect = rect(heading);
          const targetRect = rect(target);
          const effectiveContentRect = rect(effectiveContent);
          const scrollingElement = document.scrollingElement;
          const targetStyle = target ? getComputedStyle(target) : null;
          const navigationStyle = navigation ? getComputedStyle(navigation) : null;
          const pixelValue = (value) => {
            const match = /^(-?(?:\d+|\d*\.\d+))px$/.exec(value ?? '');
            return match ? Number(match[1]) : null;
          };
          const scroll = { x: scrollX, y: scrollY };
          return {
            anchorId, headingSelector, targetSelector: `#${anchorId}`, headingText: heading?.textContent?.trim() ?? null,
            targetType, targetExists: Boolean(target), effectiveContentExists: Boolean(effectiveContent),
            effectiveContentSelector: targetType === 'tbody' ? `#${anchorId} tr:first-child` : `#${anchorId}`,
            headingExists: Boolean(heading), viewport: { width: innerWidth, height: innerHeight, devicePixelRatio },
            navigationRect, headingRect, targetRect, effectiveContentRect,
            boundingBox: { navigation: navigationRect, heading: headingRect, target: targetRect, effectiveContent: effectiveContentRect },
            scroll: { ...scroll, maxY: Math.max(0, (scrollingElement?.scrollHeight ?? 0) - innerHeight), scrollHeight: scrollingElement?.scrollHeight ?? null },
            scrollPosition: scroll, urlHash: location.hash,
            derived: {
              headingAboveViewport: headingRect ? headingRect.bottom <= 0 : null,
              headingIntersectsNavigationRects: headingRect && navigationRect
                ? headingRect.left < navigationRect.right && headingRect.right > navigationRect.left
                  && headingRect.top < navigationRect.bottom && headingRect.bottom > navigationRect.top
                : null,
              targetIntersectsNavigationRects: effectiveContentRect && navigationRect
                ? effectiveContentRect.left < navigationRect.right && effectiveContentRect.right > navigationRect.left
                  && effectiveContentRect.top < navigationRect.bottom && effectiveContentRect.bottom > navigationRect.top
                : null,
              effectiveContentAboveViewport: effectiveContentRect ? effectiveContentRect.bottom <= 0 : null,
            },
            computedCss: {
              navigation: css(navigation), heading: css(heading),
              scrollMarginTop: targetStyle?.scrollMarginTop ?? null,
              target: targetStyle ? { ...css(target), scrollMarginTopPx: pixelValue(targetStyle.scrollMarginTop) } : null,
              navigationPosition: navigationStyle?.position ?? null,
              navigationTop: navigationStyle?.top ?? null,
              navigationAncestors: ancestorStyles(navigation), headingAncestors: ancestorStyles(heading), targetAncestors: ancestorStyles(target),
            },
            measuredAt: new Date().toISOString(), scrollStable: true,
          };
        }, { anchorId: id, navigationSelector: navSelector });
        try {
          const assessment = assertAnchorTargetGeometry(geometry);
          checks.push({
            id, text: geometry.headingText, box: geometry.headingRect,
            navBottom: geometry.navigationRect?.bottom, viewport: geometry.viewport?.height,
            targetType: geometry.targetType, geometry, assessment,
          });
        } catch (error) {
          throw attachObservedGeometry(error, geometry);
        }
      }
      return { headings: checks };
    });

    await page.setViewportSize({ width: 390, height: 844 }); await page.goto(`${origin}/`, { waitUntil: 'domcontentloaded' }); await page.waitForSelector('#heroes .hero-card'); await settle();
    await test('UX03A-MOBILE-FALLBACK', 'Mobile navigation is in normal flow and does not overflow', async () => {
      const nav=page.locator(navSelector); const style=await nav.evaluate((el)=>getComputedStyle(el).position); assert.equal(style,'static');
      const before=await nav.boundingBox(); await page.evaluate(()=>scrollTo(0,300)); await stableScroll(); const after=await nav.boundingBox();
      assert.ok(before && after && after.y < before.y-100, 'navigation should scroll with document');
      const widths=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth})); assert.ok(widths.document<=widths.viewport, 'mobile page must not overflow horizontally');
      await page.locator(`${navSelector} a[href="#heroes"]`).click(); await page.waitForFunction(()=>location.hash==='#heroes');
      return { computedCss:{position:style}, boundingBox:{before,after}, scrollPosition:await page.evaluate(()=>scrollY), widths, urlHash:await page.evaluate(()=>location.hash) };
    });

    await test('UX03A-KEYBOARD-FOCUS', 'Navigation is reachable with keyboard and focus is visible', async () => {
      await page.setViewportSize({width:1440,height:1000}); await page.goto(`${origin}/`,{waitUntil:'domcontentloaded'}); await page.waitForSelector('#heroes .hero-card'); await settle();
      await page.keyboard.press('Tab'); const link=page.locator(`${navSelector} a[href="#heroes"]`);
      const focus=await link.evaluate(el=>({active:document.activeElement===el,outline:getComputedStyle(el).outlineStyle,outlineWidth:getComputedStyle(el).outlineWidth,boxShadow:getComputedStyle(el).boxShadow,rect:(()=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom}})(),navBottom:document.querySelector('nav.section-shortcuts').getBoundingClientRect().bottom}));
      assert.ok(focus.active); assert.ok(focus.outline!=='none'||focus.boxShadow!=='none','focus indicator must be visible');
      await link.press('Enter'); await page.waitForFunction(()=>location.hash==='#heroes');
      return {focusedElement:await page.evaluate(()=>`${document.activeElement.tagName.toLowerCase()}[href="${document.activeElement.getAttribute('href')}"]`),focus,urlHash:await page.evaluate(()=>location.hash)};
    });

    await test('UX03A-HISTORY-RELOAD', 'Anchor navigation supports back, forward and reload restoration', async () => {
      for (const id of ['heroes','general-ssr-equipment']) { await page.locator(`${navSelector} a[href="#${id}"]`).click(); await page.waitForFunction((target)=>location.hash===`#${target}`,id); await stableScroll(); }
      await page.goBack(); await page.waitForFunction(()=>location.hash==='#heroes'); await stableScroll();
      const back={hash:await page.evaluate(()=>location.hash),target:await page.locator('#heroes').boundingBox()};
      await page.goForward(); await page.waitForFunction(()=>location.hash==='#general-ssr-equipment'); await stableScroll();
      await page.reload({waitUntil:'domcontentloaded'}); await page.waitForSelector('#heroes .hero-card'); await settle(); await page.waitForFunction(()=>location.hash==='#general-ssr-equipment');
      const reload={hash:await page.evaluate(()=>location.hash),target:await page.locator('#general-ssr-equipment').boundingBox()}; assert.ok(back.target && reload.target);
      return {back,forwardHash:'#general-ssr-equipment',reload,urlHash:reload.hash,scrollPosition:await page.evaluate(()=>scrollY)};
    });

    await test('UX03A-SEARCH-REGRESSION', 'Generated Hero Consumer record can be found through the rendered search UI', async () => {
      const data=await page.evaluate(async()=>await(await fetch('./generated/hero-slice.v1.json')).json());
      const fixture=data.heroes.find(hero=>hero.id===1 && hero.nameKo==='매튜');
      if(!fixture) throw Object.assign(new Error('TEST_CONTRACT_GAP: expected fixture absent from Generated Hero Consumer'),{contractGap:true});
      const input=page.locator('#hero-search'); await input.fill(fixture.nameKo);
      await page.waitForFunction(()=>document.querySelector('#hero-search-count')?.textContent.includes('검색 결과 1명'));
      const card=page.locator(`#hero-${fixture.id}`); assert.equal(await card.count(),1); assert.equal(await card.isVisible(),true);
      assert.match(await card.locator('h2').innerText(),new RegExp(fixture.nameKo));
      return {fixture:{id:fixture.id,nameKo:fixture.nameKo},consumer:'generated/hero-slice.v1.json',consumerBlobSha:consumerBlobSha('generated/hero-slice.v1.json'),visibleCardCount:await page.locator('#heroes .hero-card:visible').count(),searchCount:await page.locator('#hero-search-count').innerText()};
    });

    await test('UX03A-RELATION-REGRESSION', 'Generated Hero relation leads through the rendered Consumer link to its Hero', async () => {
      const [relations,heroes]=await page.evaluate(async()=>Promise.all(['hero-soldier-relations.v1.json','hero-slice.v1.json'].map(async file=>await(await fetch(`./generated/${file}`)).json())));
      const hero=heroes.heroes.find(item=>item.id===1); const relation=relations.relations.find(item=>item.heroId===hero?.id);
      if(!hero||!relation) throw Object.assign(new Error('TEST_CONTRACT_GAP: no validated Generated Hero relation fixture'),{contractGap:true});
      const normalCard=page.locator(`#normal-soldier-${relation.soldierId}`);
      const spCard=page.locator(`#sp-soldier-${relation.soldierId}`);
      let card=await normalCard.count()?normalCard:spCard;
      if(!(await card.count())) throw Object.assign(new Error('TEST_CONTRACT_GAP: relation target is not a rendered soldier card'),{contractGap:true});
      const link=card.locator(`.soldier-hero-links a[href="#hero-${hero.id}"]`); if(await link.count()!==1) throw Object.assign(new Error('TEST_CONTRACT_GAP: Generated relation has no matching rendered UI link'),{contractGap:true});
      await page.locator('#hero-search').fill('__no_match__'); await link.click(); await page.waitForFunction(()=>location.hash==='#hero-1'); await stableScroll();
      assert.equal(await page.locator('#hero-1').isVisible(),true); assert.equal(await page.locator('#hero-search').inputValue(),'');
      return {consumer:'generated/hero-soldier-relations.v1.json',consumerBlobSha:consumerBlobSha('generated/hero-soldier-relations.v1.json'),fixture:{heroId:hero.id,soldierId:relation.soldierId},renderedLink:await link.getAttribute('href'),targetVisible:await page.locator('#hero-1').isVisible(),searchReset:await page.locator('#hero-search').inputValue()===''};
    });
  }

  const fatalBrowserErrors = [...pageErrors, ...consoleErrors.filter((message) => /uncaught|syntaxerror|failed to load module|generated .* request failed/i.test(message))];
  const failedResources = [...failedRequests, ...[...resourceResponses].filter(([,status])=>status>=400).map(([path,status])=>`${status} ${path}`)];
  record('BROWSER-RUNTIME-HEALTH',runnerValidation?'runner-validation':'detailed',fatalBrowserErrors.length||failedResources.length?'FAIL':'PASS','No fatal page errors or failed same-origin resources',{pageErrors,consoleErrors,failedResources,loadedResources:[...resourceResponses.keys()]},null,fatalBrowserErrors.length||failedResources.length?'RESOURCE_OR_PAGE_ERROR':null);
} catch (error) {
  fatalError = error;
  record('RUNNER-EXECUTION',runnerValidation?'runner-validation':'detailed','RUNNER_RUNTIME_FAILURE','Harness completes without runtime error',{},error?.stack??String(error),'RUNNER_RUNTIME_FAILURE');
} finally {
  if (browser) { await browser.close().then(() => { browserClosed = true; }).catch(() => {}); }
  await new Promise((resolveClose) => server.close(() => resolveClose())).catch(() => {});
  const expectedIds = runnerValidation
    ? ['HARNESS-SCRIPT-PARSE','HARNESS-CHROMIUM-LAUNCH','HARNESS-SITE-CONNECTION','HARNESS-DOM-QUERY','HARNESS-COMPUTED-CSS','HARNESS-BOUNDING-BOX','HARNESS-SCROLL','HARNESS-KEYBOARD','HARNESS-HISTORY','HARNESS-JSON-RESULT','HARNESS-FAILURE-GEOMETRY-SERIALIZATION']
    : ['UX03A-DESKTOP-STICKY','UX03A-ANCHOR-SCROLL','UX03A-HEADING-VISIBILITY','UX03A-MOBILE-FALLBACK','UX03A-KEYBOARD-FOCUS','UX03A-HISTORY-RELOAD','UX03A-SEARCH-REGRESSION','UX03A-RELATION-REGRESSION'];
  for (const id of expectedIds) {
    if (!results.some((result) => result.testId === id)) record(id,runnerValidation?'runner-validation':'detailed','NOT_EXECUTED','Test is executed when the Browser harness is available',{},fatalError?.message??'Earlier required setup failed','NOT_EXECUTED');
  }
  const required = runnerValidation ? results.filter(({testId})=>testId.startsWith('HARNESS-')||testId==='BROWSER-RUNTIME-HEALTH') : results.filter(({testId})=>testId.startsWith('UX03A-')||testId==='BROWSER-RUNTIME-HEALTH');
  const failed = required.some(({resultStatus})=>resultStatus!=='PASS');
  const hasAssertionFailure=required.some(({resultStatus})=>resultStatus==='FAIL');
  const hasReview=required.some(({resultStatus})=>resultStatus!=='PASS');
  const overall = runnerValidation ? (fatalError||failed?'RUNNER_VALIDATION_FAIL':'RUNNER_VALIDATION_PASS') : (fatalError||hasAssertionFailure?'UX03A_DETAILED_BROWSER_QA_FAIL':hasReview?'UX03A_DETAILED_BROWSER_QA_REVIEW':'UX03A_DETAILED_BROWSER_QA_PASS');
  const exitCode = processExitCode(required, fatalError);
  const output={schemaVersion:1,overallStatus:overall,qaMode:runnerValidation?'runner-validation':'detailed',command:['node',scriptPath,...(runnerValidation?['--runner-validation']:[])],startedAt,completedAt:new Date().toISOString(),repository:process.env.GITHUB_REPOSITORY??null,prNumber:process.env.PR_NUMBER??null,expectedPrHeadSha:process.env.EXPECTED_PR_HEAD_SHA??null,currentPrHeadSha:process.env.CURRENT_PR_HEAD_SHA??null,workflowEvent:process.env.GITHUB_EVENT_NAME??null,workflowRef:process.env.GITHUB_WORKFLOW_REF??null,workflowDefinitionSha:process.env.GITHUB_WORKFLOW_SHA??null,qaInfrastructureSha:actualQaSha,siteSourceSha:actualSiteSha,qaScriptPath:scriptPath,qaScriptSha256:scriptSha256,browserVersion:browser?.version?.()??null,origin,cleanup:{browserClosed,serverClosed:!server.listening},tests:results};
  await mkdir(resolve(resultPath,'..'),{recursive:true});
  await writeFile(resultPath,`${JSON.stringify(output,null,2)}\n`);
  const persisted=JSON.parse(await readFile(resultPath,'utf8'));
  assert.equal(persisted.overallStatus,overall,'persisted JSON must contain the final QA conclusion');
  const lines=[`## ${overall}`,``, `- Mode: ${output.qaMode}`,`- Command: \`${output.command.join(' ')}\``,`- Site SHA: \`${actualSiteSha}\``,`- QA Infrastructure SHA: \`${actualQaSha}\``,`- Script SHA-256: \`${scriptSha256}\``,`- Browser: ${output.browserVersion??'unavailable'}`,`- Cleanup: browser=${browserClosed}, server=${!server.listening}`,`- Result JSON: \`${resultPath}\``,``,'| Test ID | Result | Error |','|---|---|---|',...results.map(r=>`| ${r.testId} | ${r.resultStatus} | ${(r.errorCategory??'').replaceAll('|','/')} |`)];
  if(summaryPath) await writeFile(summaryPath,`${lines.join('\n')}\n`,{flag:'a'});
  console.log(JSON.stringify(output,null,2));
  console.log(`QA_RESULT_JSON=${resultPath}`);
  console.log(`QA_OVERALL_STATUS=${overall}`);
  if(exitCode !== 0) process.exitCode=exitCode;
}

