// Hosted-only QA. --self-test never opens a browser or contacts the network.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir, rename, mkdtemp, rm, access } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const REPOSITORY = 'LuceatLuxVestra42/Langrisser-2nd-test';
const HOSTED = 'https://luceatluxvestra42.github.io/Langrisser-2nd-test/';
const SOURCE_COMMIT = '6475e63ee23d18adf733756c26a14fa9e3ed662c';
const JSON_PATH = 'generated/soldier-training-tech-descriptions.v1.json';
// This reviewed Build copies the four compared files without transformation.
// A Build contract change needs a new review before this runner can certify it.
const REVIEWED_BUILD_BLOB = '24ebcb243a5d6810d5825d471b6b56698b7f7894';
const PAGES_WORKFLOW_ID = 367575105;
const PAGES_WORKFLOW_PATH = 'dynamic/pages/pages-build-deployment';
const SCRIPT = fileURLToPath(import.meta.url);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const gitBlob = bytes => createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
const gitHead = root => execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const errorText = e => String(e?.message || e).slice(0, 4000);

function validateSha(value) {
  assert.match(value || '', /^[0-9a-f]{40}$/, 'Expected full lowercase SHA');
  return value;
}
function hostedUrl(value) {
  const u = new URL(value);
  assert.equal(u.protocol, 'https:', 'HTTPS required');
  assert.equal(u.origin, new URL(HOSTED).origin, 'Hosted origin not allowed');
  assert.ok(!u.username && !u.password, 'Credentials in URL not allowed');
  assert.ok(u.pathname.startsWith(new URL(HOSTED).pathname), 'Hosted base path not allowed');
  assert.ok(!/%2f|%5c|%2e/i.test(u.pathname), 'Encoded path traversal not allowed');
  return u;
}
function validateHtml(text, contentType) {
  assert.match(contentType || '', /text\/html/i, 'HTML Content-Type required');
  assert.ok(!/Site Unavailable|Access Denied|Checking your browser|Verify you are human/i.test(text), 'Error or access-block HTML');
  for (const marker of ['id="heroes"', 'id="sp-soldiers"', 'id="normal-soldiers"', './app.js', './styles.css']) {
    assert.ok(text.includes(marker), `Normal site HTML missing ${marker}`);
  }
}
function successfulResponse(status) {
  assert.equal(status, 200, `Required resource HTTP ${status}`);
}
function sourceError(code, message, details = {}) {
  return Object.assign(new Error(message), { code, details });
}
function sourceEqual(observed, expected, field) {
  if (observed !== expected) throw sourceError('HOSTED_SOURCE_MISMATCH', `${field} mismatch`, { field, expected, observed });
}
function evidence(condition, message, details = {}) {
  if (!condition) throw sourceError('HOSTED_SOURCE_EVIDENCE_GAP', message, details);
}
function validateDeployment(deployment, status, expectedSha, expectedId) {
  evidence(deployment && status, 'Deployment or latest status evidence missing');
  sourceEqual(String(deployment.id), String(expectedId), 'Deployment ID');
  sourceEqual(deployment.environment, 'github-pages', 'Deployment environment');
  sourceEqual(deployment.sha, expectedSha, 'Deployment SHA');
  sourceEqual(status.state, 'success', 'Deployment status');
  sourceEqual(status.environment_url, HOSTED, 'Deployment URL');
}
function selectPagesRun(runs, expectedSha) {
  const run = runs.find(r => r.workflow_id === PAGES_WORKFLOW_ID && r.path === PAGES_WORKFLOW_PATH
    && r.head_sha === expectedSha && r.head_branch === 'main' && r.status === 'completed' && r.conclusion === 'success');
  evidence(run, 'Verified Pages workflow run evidence missing', { workflowId: PAGES_WORKFLOW_ID, path: PAGES_WORKFLOW_PATH, expectedSha });
  return run;
}
function selectArtifact(artifacts, run) {
  const artifact = artifacts.find(a => a.name === 'github-pages');
  evidence(artifact && !artifact.expired, 'Pages artifact missing or expired', { runId: run.id, artifactId: artifact?.id, expired: artifact?.expired });
  evidence(artifact.workflow_run?.id === run.id && artifact.workflow_run?.head_sha === run.head_sha,
    'Artifact-to-Pages Source linkage unconfirmed', { runId: run.id, artifactId: artifact.id, observed: artifact.workflow_run });
  return artifact;
}
function validateUpload(outcome) { assert.equal(outcome, 'success', 'Artifact upload failed'); }
function finishStatus(result) {
  return result.tests.length > 0 && result.tests.every(t => t.status === 'PASS')
    && result.cleanup.browserClosed && result.cleanup.contextsClosed ? 'PASS' : 'FAIL';
}
async function persist(path, value, writer = writeFile) {
  await mkdir(dirname(path), { recursive: true });
  const temp = `${path}.tmp`;
  await writer(temp, `${JSON.stringify(value, null, 2)}\n`);
  await rename(temp, path);
}
async function evaluateTest(entry, action) {
  try { entry.observed = await action(); entry.status = 'PASS'; }
  catch (e) { entry.status = 'FAIL'; entry.error = errorText(e); entry.errorCategory = e.code || null; entry.errorEvidence = e.details || null; throw e; }
  finally { entry.completedAt = new Date().toISOString(); }
}
async function githubJson(path, token, fetcher = fetch) {
  assert.ok(path.startsWith(`/repos/${REPOSITORY}/`), 'API path outside repository');
  let response;
  try { response = await fetcher(`https://api.github.com${path}`, {
    redirect: 'error', signal: AbortSignal.timeout(20000),
    headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28' },
  }); } catch (e) { throw sourceError('HOSTED_SOURCE_EVIDENCE_GAP', 'GitHub read API transport failure', { path, error: errorText(e) }); }
  evidence(response.status === 200, 'GitHub read API unavailable', { path, httpStatus: response.status });
  try { return await response.json(); }
  catch (e) { throw sourceError('HOSTED_SOURCE_EVIDENCE_GAP', 'GitHub API response not JSON', { path, error: errorText(e) }); }
}

async function selfTest() {
  let count = 0;
  const checks = [];
  const pass = (id, layer = 'PURE_HELPER_TEST') => { count++; checks.push({ id, layer, status: 'PASS' }); };
  const reject = (id, fn) => { assert.throws(fn, undefined, id); pass(id); };
  reject('URL_EXTERNAL', () => hostedUrl('https://example.com/'));
  reject('URL_BASE_PATH', () => hostedUrl('https://luceatluxvestra42.github.io/other/'));
  reject('URL_HTTP', () => hostedUrl(HOSTED.replace('https:', 'http:')));
  reject('URL_CREDENTIALS', () => hostedUrl(HOSTED.replace('https://', 'https://user@')));
  reject('REDIRECT_OTHER_ORIGIN', () => hostedUrl(new URL('https://example.com/', HOSTED).href));
  reject('SHA_INVALID', () => validateSha('abc'));
  const sha = 'a'.repeat(40);
  const d = { id: 123, sha, environment: 'github-pages' };
  const s = { state: 'success', environment_url: HOSTED };
  validateDeployment(d, s, sha, '123'); pass('DEPLOYMENT_VALID');
  reject('DEPLOYMENT_SHA', () => validateDeployment({ ...d, sha: 'b'.repeat(40) }, s, sha, '123'));
  reject('DEPLOYMENT_PENDING', () => validateDeployment(d, { ...s, state: 'pending' }, sha, '123'));
  reject('DEPLOYMENT_REPLACED', () => validateDeployment({ ...d, id: 124 }, s, sha, '123'));
  reject('HTTP_200_ERROR_HTML', () => validateHtml('<h1>Site Unavailable</h1>', 'text/html'));
  reject('REQUIRED_RESOURCE_FAIL', () => successfulResponse(404));
  reject('ARTIFACT_UPLOAD_FAIL', () => validateUpload('failure'));
  const result = { tests: [{ status: 'PASS' }], cleanup: { browserClosed: true, contextsClosed: true } };
  assert.equal(finishStatus(result), 'PASS'); pass('RESULT_SUCCESS');
  assert.equal(finishStatus({ ...result, cleanup: { browserClosed: false, contextsClosed: true } }), 'FAIL'); pass('CLEANUP_AGGREGATE_FAIL');
  const dir = await mkdtemp(join(tmpdir(), 'hosted-qa-fixture-'));
  try {
    const path = join(dir, 'result.json');
    for (const reason of ['BROWSER_LAUNCH_FAIL', 'PROBE_FAIL']) {
      const entry = { id: reason, status: 'NOT_VERIFIED' };
      let nextStageCalled = false;
      await assert.rejects(async () => {
        await evaluateTest(entry, async () => { throw new Error(reason); });
        nextStageCalled = true;
      });
      assert.equal(nextStageCalled, false);
      assert.equal(entry.status, 'FAIL'); assert.equal(entry.error, reason);
      const failure = { ...result, tests: [entry] };
      assert.equal(finishStatus(failure), 'FAIL');
      await persist(path, failure);
      assert.equal(JSON.parse(await readFile(path, 'utf8')).tests[0].id, reason); pass(reason);
    }
    await assert.rejects(persist(path, result, async () => { throw new Error('disk full fixture'); })); pass('RESULT_WRITE_FAIL');
    // Exercise the real top-level failure writer, without reaching any API or browser.
    assert.throws(() => execFileSync(process.execPath, [SCRIPT], {
      env: { ...process.env, GITHUB_REPOSITORY: 'fixture/wrong-repository', QA_RESULT_DIR: dir }, stdio: 'pipe',
    }));
    const aborted = JSON.parse(await readFile(path, 'utf8'));
    assert.equal(aborted.overallStatus, 'FAIL');
    assert.equal(aborted.tests.find(t => t.id === 'M01').status, 'NOT_VERIFIED');
    assert.equal(aborted.browserVersion, null); pass('TOP_LEVEL_ABORT_AND_SKIPPED_ASSERTIONS', 'SCRIPT_INTEGRATION_TEST');
    const runtime = join(dir, 'hosted-runtime-1-1'); await mkdir(runtime);
    assert.throws(() => execFileSync(process.execPath, [SCRIPT, '--finalize'], {
      env: { ...process.env, QA_RESULT_DIR: dir, RUNNER_TEMP: dir, GITHUB_RUN_ID: '1', GITHUB_RUN_ATTEMPT: '1', BROWSER_QA_RUNTIME_ROOT: runtime }, stdio: 'pipe',
    }));
    assert.equal(JSON.parse(await readFile(path, 'utf8')).cleanup.runtimeRemoved, false); pass('CLEANUP_FINALIZE_FAIL', 'SCRIPT_INTEGRATION_TEST');
    assert.throws(() => execFileSync(process.execPath, [SCRIPT, '--verify-upload'], {
      env: { ...process.env, ARTIFACT_OUTCOME: 'failure' }, stdio: 'pipe',
    })); pass('UPLOAD_VERIFY_PROCESS_FAIL', 'SCRIPT_INTEGRATION_TEST');
  } finally { await rm(dir, { recursive: true, force: true }); }
  // Static Actions contracts are validated without dispatching the workflow.
  const workflow = await readFile(resolve(dirname(SCRIPT), '../.github/workflows/hosted-browser-qa.yml'), 'utf8');
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /pull_request_target:|pull_request:|\bpush:/);
  assert.doesNotMatch(workflow, /secrets\./);
  assert.doesNotMatch(workflow, /(?:contents|actions|deployments|pages): write/);
  for (const required of ['if: always()', 'if-no-files-found: error', 'cancel-in-progress: false', 'github.workflow_sha', 'persist-credentials: false', 'ARTIFACT_OUTCOME', '--finalize', '--self-test']) assert.ok(workflow.includes(required), required);
  pass('WORKFLOW_CONTRACT', 'WORKFLOW_STATIC_VALIDATION');
  const run = { id: 40778088217, workflow_id: PAGES_WORKFLOW_ID, path: PAGES_WORKFLOW_PATH, head_sha: sha, head_branch: 'main', status: 'completed', conclusion: 'success' };
  assert.equal(selectPagesRun([run], sha).id, run.id); pass('ACTUAL_PAGES_RUN_SHAPE');
  const expectSourceError = (id, code, action) => { assert.throws(action, e => e.code === code); pass(id); };
  expectSourceError('PAGES_RUN_MISSING', 'HOSTED_SOURCE_EVIDENCE_GAP', () => selectPagesRun([], sha));
  expectSourceError('ARTIFACT_EXPIRED', 'HOSTED_SOURCE_EVIDENCE_GAP', () => selectArtifact([{ name: 'github-pages', expired: true }], run));
  expectSourceError('ARTIFACT_LINK_MISSING', 'HOSTED_SOURCE_EVIDENCE_GAP', () => selectArtifact([{ name: 'github-pages', expired: false }], run));
  expectSourceError('BYTE_MISMATCH_CATEGORY', 'HOSTED_SOURCE_MISMATCH', () => sourceEqual('observed', 'expected', 'Hosted bytes'));
  expectSourceError('DEPLOYMENT_MISMATCH_CATEGORY', 'HOSTED_SOURCE_MISMATCH', () => validateDeployment({ ...d, sha: 'b'.repeat(40) }, s, sha, '123'));
  await assert.rejects(githubJson(`/repos/${REPOSITORY}/actions/runs/1`, 'fixture-token', async () => ({ status: 403 })), e => e.code === 'HOSTED_SOURCE_EVIDENCE_GAP' && e.details.httpStatus === 403); pass('API_403_CATEGORY');
  await assert.rejects(githubJson(`/repos/${REPOSITORY}/actions/runs/1`, 'fixture-token', async () => { throw new Error('fixture network'); }), e => e.code === 'HOSTED_SOURCE_EVIDENCE_GAP' && e.details.error === 'fixture network'); pass('API_TRANSPORT_CATEGORY');
  const classified = { id: 'SOURCE_FIXTURE', status: 'NOT_VERIFIED' };
  await assert.rejects(evaluateTest(classified, async () => { throw sourceError('HOSTED_SOURCE_EVIDENCE_GAP', 'fixture', { artifactId: 123, expired: true }); }));
  assert.equal(classified.errorCategory, 'HOSTED_SOURCE_EVIDENCE_GAP'); assert.equal(classified.errorEvidence.expired, true); pass('CLASSIFIED_FAILURE_EVIDENCE');
  console.log(JSON.stringify({ checks }));
  console.log(`HOSTED_RUNNER_SELF_TEST_PASS: ${count} checks; no Hosted access, browser launch or GitHub mutation`);
}

async function runHosted() {
  const env = process.env;
  const resultDir = resolve(env.QA_RESULT_DIR || join(tmpdir(), `hosted-qa-${process.pid}`));
  const resultPath = join(resultDir, 'result.json');
  const result = {
    schemaVersion: 1, overallStatus: 'NOT_VERIFIED', startedAt: new Date().toISOString(),
    repository: REPOSITORY, hostedUrl: HOSTED, workflowRunId: env.GITHUB_RUN_ID || null,
    runAttempt: env.GITHUB_RUN_ATTEMPT || null, jobName: env.GITHUB_JOB || null, jobId: null,
    workflowRef: env.GITHUB_WORKFLOW_REF || null, qaInfrastructureSha: env.QA_INFRASTRUCTURE_SHA || null,
    expectedSiteSourceSha: env.EXPECTED_SITE_SHA || null, currentDeploymentSourceSha: null, sourceStatus: 'NOT_VERIFIED',
    playwrightVersion: null, browserVersion: null, viewports: [], tests: [], probe: [],
    sourceParity: [], deployment: null, artifactUpload: 'NOT_VERIFIED: workflow upload step is separate evidence',
    cleanup: { browserClosed: false, contextsClosed: false, runtimeRemoved: false },
  };
  const test = async (id, expectation, action, viewport = null) => {
    const entry = { id, viewport, expectation, url: HOSTED, startedAt: new Date().toISOString(), status: 'NOT_VERIFIED' };
    result.tests.push(entry);
    await evaluateTest(entry, async () => {
      try { return await action(); }
      catch (e) {
        if (['DEPLOYMENT_SOURCE', 'DEPLOYMENT_STILL_CURRENT'].includes(id)
          && !['HOSTED_SOURCE_MISMATCH', 'HOSTED_SOURCE_EVIDENCE_GAP'].includes(e.code)) {
          throw sourceError('HOSTED_SOURCE_EVIDENCE_GAP', 'Deployment evidence could not be evaluated', { cause: errorText(e) });
        }
        throw e;
      }
    });
  };
  let browser;
  const contexts = [];
  const observations = [];
  const token = env.GH_TOKEN;
  // Never send GitHub credentials to the Hosted browser or any redirected URL.
  async function api(path) {
    return githubJson(path, token);
  }
  async function deploymentSnapshot() {
    const main = await api(`/repos/${REPOSITORY}/git/ref/heads/main`);
    sourceEqual(main.object.sha, env.EXPECTED_SITE_SHA, 'Current Main SHA');
    const deployments = await api(`/repos/${REPOSITORY}/deployments?environment=github-pages&per_page=100`);
    evidence(deployments.length, 'No github-pages deployment evidence');
    const deployment = deployments[0];
    result.deploymentObserved = { id: deployment.id, sha: deployment.sha, environment: deployment.environment };
    result.currentDeploymentSourceSha = deployment.sha;
    assert.match(String(deployment.id), /^\d+$/);
    const statuses = await api(`/repos/${REPOSITORY}/deployments/${deployment.id}/statuses?per_page=100`);
    validateDeployment(deployment, statuses[0], env.EXPECTED_SITE_SHA, env.EXPECTED_DEPLOYMENT_ID);
    return { id: deployment.id, sha: deployment.sha, statusId: statuses[0].id, environmentUrl: statuses[0].environment_url };
  }
  async function getHosted(url) {
    let current = hostedUrl(url).href;
    const redirects = [];
    for (let n = 0; n < 5; n++) {
      let response;
      try { response = await fetch(current, { redirect: 'manual', signal: AbortSignal.timeout(15000), headers: { 'Cache-Control': 'no-cache' } }); }
      catch (e) {
        const details = { url, finalUrl: current, redirects, error: errorText(e), at: new Date().toISOString() };
        result.probe.push(details);
        throw sourceError('HOSTED_PROBE_FAILURE', 'Hosted request failed before HTTP response', details);
      }
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const next = hostedUrl(new URL(response.headers.get('location'), current).href).href;
        redirects.push({ from: current, to: next, status: response.status }); current = next; continue;
      }
      const probe = { url, finalUrl: current, redirects, status: response.status, contentType: response.headers.get('content-type'), at: new Date().toISOString() };
      result.probe.push(probe);
      successfulResponse(response.status);
      const bytes = Buffer.from(await response.arrayBuffer()); // fetch decodes Content-Encoding.
      assert.ok(bytes.length > 0 && bytes.length < 20 * 1024 * 1024, 'Invalid Hosted response size');
      probe.decodedSha256 = sha256(bytes);
      return { bytes, contentType: response.headers.get('content-type'), url: current };
    }
    throw new Error('Too many Hosted redirects');
  }
  try {
    await test('INPUT_AND_INFRASTRUCTURE', 'Approved repository, Main workflow, exact Infrastructure and Site checkouts', async () => {
      assert.equal(env.GITHUB_REPOSITORY, REPOSITORY);
      assert.equal(env.GITHUB_EVENT_NAME, 'workflow_dispatch');
      assert.equal(env.GITHUB_REF, 'refs/heads/main');
      assert.equal(env.HOSTED_URL, HOSTED);
      validateSha(env.EXPECTED_SITE_SHA); validateSha(env.QA_INFRASTRUCTURE_SHA);
      assert.match(env.EXPECTED_DEPLOYMENT_ID || '', /^\d+$/);
      assert.ok(token, 'Read-only automatic token required');
      assert.equal(gitHead(env.QA_INFRASTRUCTURE_ROOT), env.QA_INFRASTRUCTURE_SHA);
      assert.equal(gitHead(env.SITE_SOURCE_ROOT), env.EXPECTED_SITE_SHA);
      assert.equal(resolve(SCRIPT), resolve(env.QA_INFRASTRUCTURE_ROOT, 'tools/test-hosted-browser-qa.mjs'));
      const jobs = await api(`/repos/${REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}/jobs?per_page=100`);
      const job = jobs.jobs.find(j => j.name === 'hosted-qa' && j.run_attempt === Number(env.GITHUB_RUN_ATTEMPT));
      assert.ok(job, 'Numeric workflow Job ID could not be resolved'); result.jobId = job.id;
      return { scriptSha256: sha256(await readFile(SCRIPT)), actualInfrastructureSha: gitHead(env.QA_INFRASTRUCTURE_ROOT), actualSiteSha: gitHead(env.SITE_SOURCE_ROOT) };
    });
    await test('DEPLOYMENT_SOURCE', 'Successful current Pages deployment and successful Pages Build/Deploy Run match approved SHA', async () => {
      result.deployment = await deploymentSnapshot();
      result.currentDeploymentSourceSha = result.deployment.sha;
      const runs = await api(`/repos/${REPOSITORY}/actions/workflows/${PAGES_WORKFLOW_ID}/runs?head_sha=${env.EXPECTED_SITE_SHA}&per_page=100`);
      const pages = selectPagesRun(runs.workflow_runs, env.EXPECTED_SITE_SHA);
      const jobs = await api(`/repos/${REPOSITORY}/actions/runs/${pages.id}/jobs?per_page=100`);
      for (const name of ['build', 'deploy']) evidence(jobs.jobs.some(j => j.name === name && j.conclusion === 'success'), `Successful Pages ${name} Job evidence missing`, { runId: pages.id });
      const artifacts = await api(`/repos/${REPOSITORY}/actions/runs/${pages.id}/artifacts?per_page=100`);
      const artifact = selectArtifact(artifacts.artifacts, pages);
      result.pagesRun = { id: pages.id, headSha: pages.head_sha, artifactId: artifact.id, jobs: jobs.jobs.map(j => ({ id: j.id, name: j.name, conclusion: j.conclusion })) };
      return { ...result.deployment, pagesRun: result.pagesRun };
    });
    let html;
    let payload;
    await test('HOSTED_PROBE_AND_BYTE_PARITY', 'Normal Hosted HTML and all four core files equal reviewed byte-copy Build source', async () => {
      evidence(gitBlob(await readFile(resolve(env.SITE_SOURCE_ROOT, 'tools/build.mjs'))) === REVIEWED_BUILD_BLOB, 'Build transformation contract changed; review required');
      const home = await getHosted(HOSTED); html = home.bytes.toString('utf8'); validateHtml(html, home.contentType);
      const js = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)].map(m => m[1]);
      const css = [...html.matchAll(/<link\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi)].map(m => m[1]).filter(p => new URL(p, HOSTED).pathname.endsWith('.css'));
      assert.equal(js.length, 1); assert.equal(css.length, 1);
      const entries = [{ path: 'index.html', response: home }];
      for (const path of [...js, ...css, `./${JSON_PATH}`]) {
        const url = hostedUrl(new URL(path, HOSTED).href);
        const relative = url.pathname.slice(new URL(HOSTED).pathname.length);
        assert.ok(['app.js', 'styles.css', JSON_PATH].includes(relative), 'Unexpected Hosted entry');
        entries.push({ path: relative, response: await getHosted(url.href) });
      }
      assert.deepEqual(entries.map(x => x.path).sort(), ['index.html', 'app.js', 'styles.css', JSON_PATH].sort());
      for (const entry of entries) {
        const expected = await readFile(resolve(env.SITE_SOURCE_ROOT, entry.path));
        const expectedType = entry.path.endsWith('.js') ? /(?:java|ecma)script/i : entry.path.endsWith('.css') ? /text\/css/i : entry.path.endsWith('.json') ? /application\/json/i : /text\/html/i;
        assert.match(entry.response.contentType || '', expectedType, `Incorrect resource Content-Type: ${entry.path}`);
        sourceEqual(sha256(entry.response.bytes), sha256(expected), `Hosted decoded bytes ${entry.path}`);
        result.sourceParity.push({ path: entry.path, decodedBodySha256: sha256(expected) });
        if (entry.path === JSON_PATH) payload = JSON.parse(entry.response.bytes.toString('utf8'));
      }
      return { files: result.sourceParity, probe: result.probe };
    });
    result.sourceStatus = 'HOSTED_SOURCE_CONFIRMED';
    await test('HOSTED_JSON', 'v1 effective approved exact scoped Generated consumer, already source-matched', async () => {
      assert.equal(payload.contract.version, 1); assert.equal(payload.contract.status, 'EFFECTIVE');
      assert.equal(payload.contract.approved, true); assert.equal(payload.contract.effective, true);
      assert.equal(payload.source.commit, SOURCE_COMMIT);
      assert.equal(payload.records.length, 20);
      // Identity/description/provenance were admitted earlier; byte parity above preserves them.
      return { contractVersion: 1, recordCount: payload.records.length, semanticAdmission: 'REUSED_PASS; no new semantic interpretation', sourceCommit: payload.source.commit };
    });
    const require = createRequire(resolve(env.PLAYWRIGHT_PACKAGE_ROOT, 'package.json'));
    const { chromium } = require('playwright'); result.playwrightVersion = require('playwright/package.json').version;
    assert.equal(result.playwrightVersion, '1.62.1');
    await test('CHROMIUM_LAUNCH', 'Pinned Playwright launches Chromium', async () => { browser = await chromium.launch({ headless: true }); result.browserVersion = browser.version(); return result.browserVersion; });
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1000 }]) {
      const mobile = viewport.width === 390;
      const prefix = mobile ? 'M' : 'D'; result.viewports.push(viewport);
      const context = await browser.newContext({ viewport, isMobile: mobile, hasTouch: mobile, serviceWorkers: 'block' }); contexts.push(context);
      const observed = { viewport, startedAt: new Date().toISOString(), consoleErrors: [], pageErrors: [], rejections: [], requests: [], responses: [], failed: [], blocked: [] }; observations.push(observed);
      await context.exposeBinding('__hostedQaRejection', (_source, message) => observed.rejections.push(String(message)));
      await context.addInitScript(() => { window.addEventListener('unhandledrejection', event => { window.__hostedQaRejection(String(event.reason?.stack || event.reason)); }); });
      await context.route('**/*', async route => {
        const url = route.request().url();
        try { hostedUrl(url); await route.continue(); }
        catch { observed.blocked.push(url); await route.abort('blockedbyclient'); }
      });
      const page = await context.newPage(); page.setDefaultTimeout(15000); page.setDefaultNavigationTimeout(30000);
      page.on('console', m => { if (m.type() === 'error') observed.consoleErrors.push(m.text()); });
      page.on('pageerror', e => observed.pageErrors.push(errorText(e)));
      page.on('request', r => observed.requests.push({ url: r.url(), type: r.resourceType(), at: new Date().toISOString() }));
      page.on('response', r => observed.responses.push({ url: r.url(), status: r.status(), type: r.request().resourceType() }));
      page.on('requestfailed', r => observed.failed.push({ url: r.url(), error: r.failure()?.errorText }));
      const check = async (id, expectation, action) => {
        try { await test(id, expectation, action, viewport); }
        catch (e) { await page.screenshot({ path: join(resultDir, `${id.replace(/[^A-Za-z0-9-]/g, '_')}.png`), fullPage: false }).catch(() => {}); throw e; }
      };
      await check(`${prefix}01`, 'Actual viewport and usable Hosted initial load', async () => {
        const response = await page.goto(HOSTED, { waitUntil: 'networkidle' }); successfulResponse(response.status());
        await page.locator('#normal-soldier-115 .soldier-training-tech-descriptions').waitFor();
        await page.locator('#sp-soldier-5115 .soldier-training-tech-descriptions').waitFor();
        const dimensions = await page.evaluate(() => ({ width: innerWidth, height: innerHeight })); assert.deepEqual(dimensions, viewport); return dimensions;
      });
      const card = id => page.locator(`#${id === 115 ? 'normal' : 'sp'}-soldier-${id}`);
      const tech = id => card(id).locator('.soldier-training-tech-descriptions');
      for (const [id, search, field, number] of [[115, 'normal', 'Description', '02'], [5115, 'sp', 'SpSoidlierDescription', '03']]) {
        await check(`${prefix}${number}`, `Search selects correct ${search} Soldier ${id}`, async () => {
          await page.locator(`#${search}-soldier-search`).fill(String(id));
          await card(id).waitFor({ state: 'visible' });
          assert.match(await card(id).innerText(), new RegExp(`${id}`));
          await tech(id).locator('summary').click();
          assert.equal(await tech(id).getAttribute('open'), '');
          return { soldierId: id, sourceField: field, open: true };
        });
      }
      await check(`${prefix}04`, 'Variant-specific TrainingTech descriptions are actually displayed', async () => {
        for (const id of [115, 5115]) { assert.equal(await tech(id).isVisible(), true); assert.equal(await tech(id).locator('.soldier-training-tech-description').count(), 10); assert.match(await tech(id).innerText(), /TrainingTech ID 223/); }
        return { NORMAL: 10, SP: 10 };
      });
      await check(`${prefix}05`, 'Source IDs and fields remain correctly separated', async () => {
        for (const [id, field] of [[115, 'Description'], [5115, 'SpSoidlierDescription']]) {
          const labels = await tech(id).locator('.soldier-training-tech-label').allTextContents();
          assert.equal(labels.length, 10);
          labels.forEach((label, n) => { assert.ok(label.includes(`LevelInfo Source ID ${2230 + n}`)); assert.ok(label.endsWith(`Source Field ${field}`)); });
        }
        return { sourceIds: '2230–2239', normalField: 'Description', spField: 'SpSoidlierDescription' };
      });
      await check(`${prefix}06`, 'Displayed Provenance tracks exact source commit and locators', async () => {
        for (const id of [115, 5115]) { assert.ok((await tech(id).innerText()).includes(SOURCE_COMMIT)); const sources = await tech(id).locator('.soldier-training-tech-list .soldier-training-tech-source').allTextContents(); assert.equal(sources.length, 10); sources.forEach(s => { assert.ok(s.includes('ConfigDataTrainingTechLevelInfo.json#ID=')); assert.ok(s.includes('Evidence:')); assert.ok(s.includes('Relation:')); }); }
        return { sourceCommit: SOURCE_COMMIT };
      });
      await check(`${prefix}07`, 'Required translation, Source ID and SP meaning disclosures are visible', async () => {
        for (const id of [115, 5115]) { const text = await tech(id).innerText(); assert.match(text, /CN ConfigData 원문 설명.*한국어 공식 번역 아님/); assert.match(text, /LevelInfo ID는 원본 레코드 식별자/); }
        assert.match(await tech(5115).innerText(), /슬롯·시점·게임 내 적용 의미는 확인되지 않았습니다/); return { notices: true };
      });
      await check(`${prefix}08`, 'Document has no unintended horizontal overflow with descriptions expanded', async () => {
        const width = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth })); assert.ok(width.document <= width.viewport, JSON.stringify(width)); return width;
      });
      await check(`${prefix}09`, 'Long Chinese descriptions and Provenance fit cards without clipping or overlap', async () => {
        const layout = await page.evaluate(() => [...document.querySelectorAll('#normal-soldier-115 .soldier-training-tech-descriptions, #sp-soldier-5115 .soldier-training-tech-descriptions')].map(d => {
          const outer = d.getBoundingClientRect(); const nodes = [...d.querySelectorAll('.soldier-training-tech-description, .soldier-training-tech-source')];
          return { open: d.open, width: d.clientWidth, scrollWidth: d.scrollWidth, nodes: nodes.map(e => { const r = e.getBoundingClientRect(); return { textLength: e.textContent.length, left: r.left, right: r.right, top: r.top, bottom: r.bottom, parentBottom: outer.bottom, scrollWidth: e.scrollWidth, width: e.clientWidth, clipped: ['hidden', 'clip'].includes(getComputedStyle(e).overflowY) && e.scrollHeight > e.clientHeight }; }) };
        }));
        for (const d of layout) { assert.ok(d.open); assert.ok(d.scrollWidth <= d.width + 1); let bottom = -Infinity; for (const n of d.nodes) { assert.ok(n.textLength > 0 && !n.clipped); assert.ok(n.scrollWidth <= n.width + 1); assert.ok(n.top >= bottom - 1); assert.ok(n.bottom <= n.parentBottom + 1); bottom = n.bottom; } }
        return layout;
      });
      await check(`${prefix}10`, 'Real disclosure click closes and reopens both variants', async () => {
        for (const id of [115, 5115]) { await tech(id).locator('summary').click(); assert.equal(await tech(id).getAttribute('open'), null); await tech(id).locator('summary').click(); assert.equal(await tech(id).getAttribute('open'), ''); } return { closedAndReopened: true };
      });
      await check(`${prefix}11`, 'Search hides unrelated cards then restores the correct target', async () => {
        await page.locator('#normal-soldier-search').fill('no-matching-hosted-qa-soldier'); assert.equal(await card(115).isVisible(), false);
        await page.locator('#normal-soldier-search').fill('115'); assert.equal(await card(115).isVisible(), true); return { hiddenThenRestored: true };
      });
      await check(`${prefix}12`, 'Actual NORMAL to SP and SP to NORMAL links reach correct cards', async () => {
        await card(115).locator('a[href="#sp-soldier-5115"]').click(); await page.waitForFunction(() => location.hash === '#sp-soldier-5115');
        await card(5115).locator('a[href="#normal-soldier-115"]').click(); await page.waitForFunction(() => location.hash === '#normal-soldier-115'); return { hash: new URL(page.url()).hash };
      });
      await check(`${prefix}13`, 'Browser Back restores preceding anchor and search retains target visibility', async () => {
        await page.goBack(); await page.waitForFunction(() => location.hash === '#sp-soldier-5115');
        assert.equal(await card(5115).isVisible(), true); assert.equal(await page.locator('#normal-soldier-search').getAttribute('type'), 'search');
        const search = await page.locator('#normal-soldier-search').evaluate(e => e.value);
        assert.equal(search, '115', 'Back must not discard unchanged search input');
        await page.goForward(); await page.waitForFunction(() => location.hash === '#normal-soldier-115');
        assert.equal(await card(115).isVisible(), true);
        return { backHash: '#sp-soldier-5115', forwardHash: new URL(page.url()).hash, search };
      });
      await check(`${prefix}14`, 'Real section navigation, Desktop sticky/Mobile fallback, and independent Soldier Skill disclosure', async () => {
        await page.locator('nav a[href="#normal-soldiers"]').click(); await page.waitForFunction(() => location.hash === '#normal-soldiers');
        const nav = await page.locator('nav').evaluate(e => ({ position: getComputedStyle(e).position, top: e.getBoundingClientRect().top }));
        assert.equal(nav.position, mobile ? 'static' : 'sticky'); if (!mobile) assert.ok(Math.abs(nav.top) <= 1);
        const skill = card(115).locator('.soldier-skill-references');
        await skill.locator('summary').click(); assert.equal(await skill.getAttribute('open'), '');
        if (await tech(115).getAttribute('open') === null) await tech(115).locator('summary').click();
        const boxes = await card(115).locator('details').evaluateAll(ds => ds.map(d => { const r = d.getBoundingClientRect(); return { top: r.top, bottom: r.bottom }; }));
        for (let i = 1; i < boxes.length; i++) assert.ok(boxes[i].top >= boxes[i - 1].bottom - 1, 'Skill/TrainingTech overlap');
        await skill.locator('summary').click(); assert.equal(await skill.getAttribute('open'), null); return { nav, boxes };
      });
      observed.interactionsCompletedAt = new Date().toISOString();
    }
    await test('DEPLOYMENT_STILL_CURRENT', 'Main and successful Deployment are unchanged after Browser interactions', async () => { const after = await deploymentSnapshot(); assert.deepEqual(after, result.deployment); return after; });
    for (let i = 0; i < observations.length; i++) {
      const o = observations[i]; const suffix = `-${o.viewport.width}`;
      const check = (id, expectation, action) => test(id + suffix, expectation, action, o.viewport);
      await check('R01', 'Both actual Hosted navigations loaded', async () => { assert.ok(o.responses.some(r => r.type === 'document' && r.status === 200)); return o.responses.filter(r => r.type === 'document'); });
      for (const [id, key] of [['R02', 'consoleErrors'], ['R03', 'pageErrors'], ['R04', 'rejections'], ['R07', 'failed']]) await check(id, `No observed ${key} during recorded interval`, async () => { assert.deepEqual(o[key], []); return o[key]; });
      await check('R05', 'Actual Browser requests include successful core JS, CSS and JSON', async () => { for (const path of ['app.js', 'styles.css', JSON_PATH]) assert.ok(o.responses.some(r => new URL(r.url).pathname === new URL(path, HOSTED).pathname && r.status === 200), `Missing browser response ${path}`); return o.responses; });
      await check('R06', 'No failed same-origin resource HTTP responses or blocked redirects', async () => { assert.deepEqual(o.responses.filter(r => r.status >= 400), []); assert.deepEqual(o.blocked, []); return { failedHttp: [], blocked: [] }; });
      await check('R08', 'Real application Generated JSON fetch succeeded', async () => { const matches = o.responses.filter(r => new URL(r.url).pathname.endsWith(`/${JSON_PATH}`) && ['fetch', 'xhr'].includes(r.type)); assert.ok(matches.length); assert.ok(matches.every(r => r.status === 200)); return matches; });
      await check('R09', 'Source-matched Generated contract version is 1', async () => { assert.equal(payload.contract.version, 1); return 1; });
      await check('R10', 'Source-matched Generated consumer retains exact admitted 20 records', async () => { assert.equal(payload.records.length, 20); return { count: 20, sourceByteParity: 'PASS' }; });
      await check('R11', 'Actual search, card and link interactions completed without observed Runtime errors', async () => { assert.ok(result.tests.filter(t => t.viewport?.width === o.viewport.width).every(t => t.status === 'PASS')); assert.deepEqual([...o.consoleErrors, ...o.pageErrors, ...o.rejections, ...o.failed], []); return { interactionInterval: [o.startedAt, o.interactionsCompletedAt] }; });
    }
  } catch (e) {
    result.failure = errorText(e); result.failureDetails = { category: e.code || 'QA_FAILURE', evidence: e.details || null };
    if (e.code === 'HOSTED_SOURCE_MISMATCH' || e.code === 'HOSTED_SOURCE_EVIDENCE_GAP') result.sourceStatus = e.code;
    process.exitCode = 1;
  }
  finally {
    result.runtimeObservations = observations;
    const closed = await Promise.allSettled(contexts.map(c => c.close()));
    for (const o of observations) o.completedAt = new Date().toISOString();
    if (observations.length) {
      const errors = observations.flatMap(o => [...o.consoleErrors, ...o.pageErrors, ...o.rejections, ...o.failed, ...o.blocked, ...o.responses.filter(r => r.status >= 400)]);
      result.tests.push({ id: 'RUNTIME_UNTIL_CONTEXT_CLOSE', status: errors.length ? 'FAIL' : 'PASS', observed: { errors }, completedAt: new Date().toISOString() });
    }
    result.cleanup.contextsClosed = closed.every(r => r.status === 'fulfilled');
    try { if (browser) await browser.close(); result.cleanup.browserClosed = !browser || !browser.isConnected(); }
    catch (e) { result.cleanup.error = errorText(e); }
    result.tests.push({ id: 'R12', status: result.cleanup.contextsClosed && result.cleanup.browserClosed ? 'PASS' : 'FAIL', observed: { browserClosed: result.cleanup.browserClosed, contextsClosed: result.cleanup.contextsClosed }, completedAt: new Date().toISOString() });
    const required = ['INPUT_AND_INFRASTRUCTURE', 'DEPLOYMENT_SOURCE', 'HOSTED_PROBE_AND_BYTE_PARITY', 'HOSTED_JSON', 'CHROMIUM_LAUNCH', 'DEPLOYMENT_STILL_CURRENT', 'R12'];
    for (const prefix of ['M', 'D']) for (let n = 1; n <= 14; n++) required.push(`${prefix}${String(n).padStart(2, '0')}`);
    for (const width of [390, 1440]) for (let n = 1; n <= 11; n++) required.push(`R${String(n).padStart(2, '0')}-${width}`);
    for (const id of required) if (!result.tests.some(t => t.id === id)) result.tests.push({ id, status: 'NOT_VERIFIED', reason: 'Preceding required gate did not complete' });
    result.completedAt = new Date().toISOString(); result.overallStatus = finishStatus(result);
    if (result.failure) result.overallStatus = 'FAIL';
    if (result.overallStatus !== 'PASS') process.exitCode = 1;
    await persist(resultPath, result);
    console.log(`HOSTED_QA_${result.overallStatus}: ${resultPath}`);
  }
}

async function finalize() {
  const path = resolve(process.env.QA_RESULT_DIR, 'result.json');
  const result = JSON.parse(await readFile(path, 'utf8'));
  const runtime = resolve(process.env.BROWSER_QA_RUNTIME_ROOT);
  assert.equal(runtime, resolve(process.env.RUNNER_TEMP, `hosted-runtime-${process.env.GITHUB_RUN_ID}-${process.env.GITHUB_RUN_ATTEMPT}`));
  let removed = false; try { await access(runtime); } catch (e) { if (e.code === 'ENOENT') removed = true; else throw e; }
  result.cleanup = { ...result.cleanup, runtimeRemoved: removed };
  if (!removed) result.overallStatus = 'FAIL';
  await persist(path, result);
  assert.ok(removed, 'Temporary runtime Cleanup failed');
}

const args = process.argv.slice(2);
if (args.length === 1 && args[0] === '--self-test') await selfTest();
else if (args.length === 1 && args[0] === '--finalize') await finalize();
else if (args.length === 1 && args[0] === '--verify-upload') validateUpload(process.env.ARTIFACT_OUTCOME);
else if (args.length === 0) await runHosted();
else throw new Error('Only --self-test, --finalize, or no argument is supported');
