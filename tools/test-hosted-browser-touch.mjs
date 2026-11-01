import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';

const HOSTED = 'https://luceatluxvestra42.github.io/Langrisser-2nd-test/';
const REPOSITORY = 'LuceatLuxVestra42/Langrisser-2nd-test';
const FULL_SHA = /^[0-9a-f]{40}$/;
const args = process.argv.slice(2);

function validateTouchEvents(events, selector) {
  assert.ok(Array.isArray(events), 'Touch event evidence must be an array');
  const start = events.find(event => event.type === 'touchstart');
  const end = events.find(event => event.type === 'touchend');
  assert.ok(start, 'touchstart was not observed');
  assert.ok(end, 'touchend was not observed');
  assert.ok(start.sequence < end.sequence, 'touchstart must precede touchend');
  for (const event of [start, end]) {
    assert.ok(Array.isArray(event.path), 'Touch event propagation path is missing');
    assert.ok(event.path.includes(selector), `Touch event did not propagate through ${selector}`);
  }
  return { start, end };
}

function validateHostedEvidence(result, env) {
  assert.equal(result?.schemaVersion, 1);
  assert.equal(result?.overallStatus, 'PASS', 'Existing Hosted QA must pass before touch verification');
  assert.equal(result?.repository, REPOSITORY);
  assert.equal(result?.workflowRunId, env.GITHUB_RUN_ID);
  assert.equal(result?.qaInfrastructureSha, env.QA_INFRASTRUCTURE_SHA);
  assert.match(env.QA_INFRASTRUCTURE_SHA || '', FULL_SHA);
  assert.equal(result?.expectedSiteSourceSha, env.EXPECTED_SITE_SHA);
  assert.match(env.EXPECTED_SITE_SHA || '', FULL_SHA);
  assert.equal(result?.currentDeploymentSourceSha, env.EXPECTED_SITE_SHA);
  assert.equal(result?.sourceStatus, 'HOSTED_SOURCE_CONFIRMED');
  assert.equal(String(result?.deployment?.id), env.EXPECTED_DEPLOYMENT_ID);
  assert.equal(result?.deployment?.sha, env.EXPECTED_SITE_SHA);
  assert.equal(result?.deployment?.environmentUrl, HOSTED);
  assert.equal(result?.cleanup?.browserClosed, true);
  assert.equal(result?.cleanup?.contextsClosed, true);
}

function selfTest() {
  const selector = '#hero-search';
  const valid = [
    { type: 'touchstart', sequence: 1, path: [selector, 'input#hero-search'] },
    { type: 'touchend', sequence: 2, path: [selector, 'input#hero-search'] },
  ];
  validateTouchEvents(valid, selector);
  assert.throws(() => validateTouchEvents([valid[0]], selector), /touchend was not observed/);
  assert.throws(() => validateTouchEvents([
    { ...valid[1], sequence: 1 }, { ...valid[0], sequence: 2 },
  ], selector), /touchstart must precede touchend/);
  assert.throws(() => validateTouchEvents(valid.map(event => ({ ...event, path: ['#wrong'] })), selector), /did not propagate/);
  const env = {
    GITHUB_RUN_ID: '123', QA_INFRASTRUCTURE_SHA: 'a'.repeat(40), EXPECTED_SITE_SHA: 'b'.repeat(40),
    EXPECTED_DEPLOYMENT_ID: '456',
  };
  const fixture = {
    schemaVersion: 1, overallStatus: 'PASS', repository: REPOSITORY, workflowRunId: '123',
    qaInfrastructureSha: 'a'.repeat(40), expectedSiteSourceSha: 'b'.repeat(40),
    currentDeploymentSourceSha: 'b'.repeat(40), sourceStatus: 'HOSTED_SOURCE_CONFIRMED',
    deployment: { id: 456, sha: 'b'.repeat(40), environmentUrl: HOSTED },
    cleanup: { browserClosed: true, contextsClosed: true },
  };
  validateHostedEvidence(fixture, env);
  for (const change of [
    { ...fixture, overallStatus: 'FAIL' },
    { ...fixture, qaInfrastructureSha: 'c'.repeat(40) },
    { ...fixture, currentDeploymentSourceSha: 'c'.repeat(40) },
    { ...fixture, deployment: { ...fixture.deployment, id: 457 } },
    { ...fixture, cleanup: { browserClosed: false, contextsClosed: true } },
  ]) assert.throws(() => validateHostedEvidence(change, env));
  console.log('HOSTED_TOUCH_SELF_TEST_PASS: touch-event order/path and source/deployment guards');
}

async function run() {
  const env = process.env;
  assert.equal(env.GITHUB_REPOSITORY, REPOSITORY);
  assert.equal(env.GITHUB_REF, 'refs/heads/main');
  assert.equal(env.HOSTED_URL, HOSTED);
  assert.match(env.EXPECTED_SITE_SHA || '', FULL_SHA);
  assert.match(env.QA_INFRASTRUCTURE_SHA || '', FULL_SHA);
  assert.match(env.EXPECTED_DEPLOYMENT_ID || '', /^\d+$/);
  assert.ok(env.QA_RESULT_DIR && env.PLAYWRIGHT_PACKAGE_ROOT);
  const resultPath = join(resolve(env.QA_RESULT_DIR), 'result.json');
  const hostedResult = JSON.parse(await readFile(resultPath, 'utf8'));
  validateHostedEvidence(hostedResult, env);

  const require = createRequire(resolve(env.PLAYWRIGHT_PACKAGE_ROOT, 'package.json'));
  const { chromium } = require('playwright');
  const evidence = {
    schemaVersion: 1, repository: REPOSITORY, workflowRunId: env.GITHUB_RUN_ID,
    qaInfrastructureSha: env.QA_INFRASTRUCTURE_SHA, siteSourceSha: env.EXPECTED_SITE_SHA,
    deploymentApiId: String(env.EXPECTED_DEPLOYMENT_ID), hostedUrl: HOSTED,
    playwrightVersion: require('playwright/package.json').version, chromiumVersion: null,
    context: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    tests: [
      { id: 'T1', status: 'NOT_VERIFIED' },
      { id: 'T2', status: 'NOT_VERIFIED' },
      { id: 'T3', status: 'NOT_VERIFIED' },
    ],
    cleanup: { pageClosed: false, contextClosed: false, browserClosed: false },
    startedAt: new Date().toISOString(), overallStatus: 'NOT_VERIFIED',
  };
  assert.equal(evidence.playwrightVersion, '1.62.1', 'Unexpected Playwright version');
  const outputPath = join(resolve(env.QA_RESULT_DIR), 'mobile-touch.json');
  await writeFile(outputPath, JSON.stringify(evidence, null, 2) + '\n', { flag: 'wx' });

  let browser;
  let context;
  let page;
  const persist = async () => writeFile(outputPath, JSON.stringify(evidence, null, 2) + '\n');
  async function runTest(id, action) {
    const entry = evidence.tests.find(test => test.id === id);
    entry.startedAt = new Date().toISOString();
    try {
      entry.observed = await action();
      entry.status = 'PASS';
    } catch (error) {
      entry.status = 'FAIL';
      entry.error = String(error?.stack || error).slice(0, 3000);
    } finally {
      entry.completedAt = new Date().toISOString();
      await persist();
    }
  }
  async function resetEvents() { await page.evaluate(() => { window.__mobileTouchQa.events = []; }); }
  async function touch(locator, selector) {
    await locator.scrollIntoViewIfNeeded();
    await resetEvents();
    await locator.tap();
    const events = await page.evaluate(() => window.__mobileTouchQa.events);
    const observed = validateTouchEvents(events, selector);
    return { api: 'locator.tap()', selector, events: [observed.start, observed.end] };
  }
  async function freshPage() {
    await page.goto(HOSTED, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#hero-37 h2', { state: 'attached' });
    await page.waitForSelector('#normal-soldier-216', { state: 'attached' });
  }

  try {
    browser = await chromium.launch({ headless: true });
    evidence.chromiumVersion = browser.version();
    context = await browser.newContext({
      viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block',
    });
    await context.addInitScript(() => {
      window.__mobileTouchQa = { sequence: 0, events: [] };
      for (const type of ['touchstart', 'touchend']) {
        document.addEventListener(type, event => {
          const path = event.composedPath().filter(node => node instanceof Element);
          const describe = node => {
            const tag = node.tagName.toLowerCase();
            const id = node.id ? `#${node.id}` : '';
            const classes = typeof node.className === 'string' && node.className.trim()
              ? '.' + node.className.trim().split(/\s+/).join('.') : '';
            const href = node instanceof HTMLAnchorElement ? `[href="${node.getAttribute('href')}"]` : '';
            return `${tag}${id}${classes}${href}`;
          };
          window.__mobileTouchQa.events.push({
            type, sequence: ++window.__mobileTouchQa.sequence,
            target: event.target instanceof Element ? describe(event.target) : null,
            path: path.slice(0, 10).map(describe), at: performance.now(),
          });
        }, { capture: true, passive: true });
      }
    });
    page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(30000);
    await freshPage();

    await runTest('T1', async () => {
      const expectedHeroCount = await page.locator('#heroes .hero-card').count();
      assert.ok(expectedHeroCount > 0, 'Generated Hero consumer is empty');
      const heroName = (await page.locator('#hero-37 h2').innerText()).trim();
      assert.ok(heroName, 'Approved Hero 37 display name is missing');
      const search = page.locator('#hero-search');
      const searchTouch = await touch(search, '#hero-search');
      await search.fill(heroName);
      await page.locator('#hero-37').waitFor({ state: 'visible' });
      const filteredCount = await page.locator('#heroes .hero-card:visible').count();
      assert.ok(filteredCount > 0, 'Search did not show the target Hero');
      const clear = page.locator('#hero-search-clear');
      const clearTouch = await touch(clear, '#hero-search-clear');
      await page.waitForFunction(() => document.querySelector('#hero-search').value === '');
      const restoredCount = await page.locator('#heroes .hero-card:visible').count();
      assert.equal(restoredCount, expectedHeroCount, 'Clear did not restore the current Generated Hero population');
      return { heroName, searchTouch, filteredCount, clearTouch, expectedHeroCount, restoredCount, searchValue: await search.inputValue() };
    });

    await runTest('T2', async () => {
      await freshPage();
      const link = page.locator('#hero-37 a.soldier-navigation-link[href="#normal-soldier-216"]');
      assert.equal(await link.count(), 1, 'Generated Hero 37 to Soldier 216 link is missing or duplicated');
      const touchEvidence = await touch(link, 'a.soldier-navigation-link[href="#normal-soldier-216"]');
      await page.waitForFunction(() => location.hash === '#normal-soldier-216');
      const card = page.locator('#normal-soldier-216');
      await card.waitFor({ state: 'visible' });
      return { touch: touchEvidence, url: page.url(), hash: new URL(page.url()).hash, targetDisplayed: await card.isVisible() };
    });

    await runTest('T3', async () => {
      await freshPage();
      const hero = page.locator('#hero-37');
      const initialHeroName = (await hero.locator('h2').innerText()).trim();
      await page.locator('#hero-search').fill('1');
      await page.waitForFunction(() => document.querySelector('#hero-37').hidden);
      assert.equal(await page.locator('#hero-1').isVisible(), true, 'Search filter did not establish the filtered state');
      const link = page.locator('#normal-soldier-216 a[href="#hero-37"]');
      assert.equal(await link.count(), 1, 'Generated Soldier 216 to Hero 37 link is missing or duplicated');
      const touchEvidence = await touch(link, 'a[href="#hero-37"]');
      await page.waitForFunction(() => location.hash === '#hero-37');
      await hero.waitFor({ state: 'visible' });
      const image = page.locator('#hero-37 .hero-skin-fullarts img').first();
      await image.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => {
        const target = document.querySelector('#hero-37 .hero-skin-fullarts img');
        return target && target.complete && target.naturalWidth > 0 && target.naturalHeight > 0;
      }, undefined, { timeout: 30000 });
      const imageState = await image.evaluate(element => ({
        src: element.currentSrc, complete: element.complete, naturalWidth: element.naturalWidth,
        naturalHeight: element.naturalHeight, objectFit: getComputedStyle(element).objectFit,
      }));
      assert.equal(imageState.objectFit, 'contain');
      return { touch: touchEvidence, url: page.url(), hash: new URL(page.url()).hash, heroDisplayed: await hero.isVisible(), initialHeroName, image: imageState };
    });
  } catch (error) {
    evidence.runnerError = String(error?.stack || error).slice(0, 4000);
  } finally {
    try { if (page && !page.isClosed()) await page.close(); evidence.cleanup.pageClosed = !page || page.isClosed(); }
    catch (error) { evidence.cleanup.pageError = String(error).slice(0, 1000); }
    try { if (context) await context.close(); evidence.cleanup.contextClosed = !context.pages().length; }
    catch (error) { evidence.cleanup.contextError = String(error).slice(0, 1000); }
    try { if (browser) await browser.close(); evidence.cleanup.browserClosed = !browser.isConnected(); }
    catch (error) { evidence.cleanup.browserError = String(error).slice(0, 1000); }
    evidence.completedAt = new Date().toISOString();
    const testsPass = evidence.tests.every(test => test.status === 'PASS');
    const cleanupPass = evidence.cleanup.pageClosed && evidence.cleanup.contextClosed && evidence.cleanup.browserClosed;
    evidence.overallStatus = testsPass && cleanupPass && !evidence.runnerError ? 'PASS' : 'FAIL';
    await persist();
  }
  console.log(`HOSTED_TOUCH_${evidence.overallStatus}: ${outputPath}`);
  if (evidence.overallStatus !== 'PASS') process.exitCode = 1;
}

if (args.length === 1 && args[0] === '--self-test') selfTest();
else if (args.length === 0) await run();
else throw new Error('Only --self-test or no argument is supported');
