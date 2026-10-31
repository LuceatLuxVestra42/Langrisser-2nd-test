// Hosted-only QA. --self-test never opens a browser or contacts the network.
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
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
const PAGES_WORKFLOW_ID = 'pages.yml'; // API accepts the reviewed workflow filename.
const PAGES_WORKFLOW_PATH = '.github/workflows/pages.yml';
const CI_WORKFLOW_PATH = '.github/workflows/ci.yml';
const SKIN_CONSUMER_PATH = 'generated/skin-consumer-public-m05-g.v1.json';
const SKIN_ASSETS_PATH = 'generated/skin-assets-public-m05-g.v1.json';
const PRIOR_M05_I = { sha: '9d549ff33811a51df5d0a1b21cb399a6ae36502e', pagesRunId: 41041535559, artifactId: 12969613868 };
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
const HOSTED_MEDIA_TYPES = Object.freeze({
  html: 'text/html',
  js: 'text/javascript',
  mjs: 'text/javascript',
  css: 'text/css',
  json: 'application/json',
  webp: 'image/webp',
  png: 'image/png',
});
const TEXT_MEDIA_TYPES = new Set(['text/html', 'text/javascript', 'text/css', 'application/json']);
function validateHostedContentType(path, contentType) {
  const extension = typeof path === 'string' ? path.match(/\.([^.\/]+)$/)?.[1]?.toLowerCase() : undefined;
  assert.ok(extension && Object.hasOwn(HOSTED_MEDIA_TYPES, extension), `Unsupported Hosted resource extension: ${path}`);
  const expected = HOSTED_MEDIA_TYPES[extension];
  const token = "[!#$%&'*+.^_`|~0-9A-Za-z-]+";
  const parsed = typeof contentType === 'string'
    ? contentType.match(new RegExp(`^\\s*(${token})\\/(${token})(?:\\s*;\\s*(${token})\\s*=\\s*(?:\"([^\"\\r\\n]*)\"|(${token})))?\\s*$`))
    : null;
  assert.ok(parsed, `Malformed Hosted Content-Type: ${path}`);
  const actual = `${parsed[1]}/${parsed[2]}`.toLowerCase();
  assert.equal(actual, expected, `Incorrect Hosted Content-Type: ${path}`);
  if (parsed[3] !== undefined) {
    assert.ok(TEXT_MEDIA_TYPES.has(expected), `Content-Type parameters are not allowed for ${expected}`);
    assert.equal(parsed[3].toLowerCase(), 'charset', `Unsupported Hosted Content-Type parameter: ${path}`);
    assert.equal((parsed[4] ?? parsed[5]).toLowerCase(), 'utf-8', `Unsupported Hosted Content-Type charset: ${path}`);
  }
  return expected;
}
function validateHtml(text, contentType) {
  validateHostedContentType('index.html', contentType);
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
  const run = runs.find(r => Number.isSafeInteger(r.workflow_id) && r.workflow_id > 0 && r.path === PAGES_WORKFLOW_PATH
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
function selectSuccessfulCiRun(runs, expectedSha) {
  const run = runs.find(r => r.path === CI_WORKFLOW_PATH && r.head_sha === expectedSha && r.head_branch === 'main'
    && r.status === 'completed' && r.conclusion === 'success');
  evidence(run, 'Required CI run for exact Main SHA is missing or unsuccessful', { path: CI_WORKFLOW_PATH, expectedSha });
  return run;
}
function validatePublicSkinPopulation(consumer, assets, filePaths) {
  assert.deepEqual(consumer, { schemaVersion: 1, skins: [
    ...[102, 103, 104, 105].map((skinId, i) => ({ skinId, heroId: 1, sourceOrder: i + 1 })),
    ...[601, 602, 603, 604, 605, 606].map((skinId, i) => ({ skinId, heroId: 6, sourceOrder: i + 1 })),
  ] }, 'Public Skin Consumer population/order differs from current approved M04–M06 scope');
  assert.deepEqual(assets, { schemaVersion: 1, assets: consumer.skins.map(row => {
    const expectedPath = row.skinId >= 602 && row.skinId <= 606
      ? `./assets/skin-admissions/m06/skin-${row.skinId}.webp`
      : row.skinId === 601 ? './assets/skin-admissions/m05-d/skin-601.webp' : `./assets/skins/skin-${row.skinId}.webp`;
    return { skinId: row.skinId, imageUrl: expectedPath };
  }) }, 'Public Skin Asset URL map does not match the approved consumer');
  const listed = new Set(filePaths);
  for (const asset of assets.assets) assert.ok(listed.has(asset.imageUrl.slice(2)), `Build manifest omits approved Skin ${asset.skinId}`);
  return { hero1: 4, hero6: 6, assets: assets.assets.length };
}
function safeArtifactPath(path) {
  return typeof path === 'string' && path.length > 0 && !path.startsWith('/') && !path.includes('\\')
    && path.split('/').every(segment => segment && segment !== '.' && segment !== '..')
    && /^[A-Za-z0-9._/-]+$/.test(path);
}
function validateArtifactManifest(manifest, expectedSha) {
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.sourceSha, expectedSha, 'Build manifest Source SHA mismatch');
  assert.ok(Array.isArray(manifest.files) && manifest.files.length > 0, 'Build manifest has no public files');
  const paths = manifest.files.map(file => file.path);
  assert.equal(new Set(paths).size, paths.length, 'Build manifest contains duplicate paths');
  for (const file of manifest.files) {
    assert.ok(safeArtifactPath(file.path), `Unsafe Build path ${file.path}`);
    assert.ok(Number.isSafeInteger(file.bytes) && file.bytes > 0);
    assert.match(file.sha256 || '', /^[a-f0-9]{64}$/);
    assert.ok(!/^(canonical|evidence|tools|\.github)\//.test(file.path), `Private Build path exposed: ${file.path}`);
    assert.ok(!/\.(?:prefab|skel|atlas|bundle)$/i.test(file.path), `Unity source exposed: ${file.path}`);
  }
  return paths;
}
function validateCacheTransitionEvidence(value) {
  assert.equal(value.status, 'NOT_VERIFIED');
  assert.equal(value.previous.sha, PRIOR_M05_I.sha);
  assert.equal(value.previous.pagesRunId, PRIOR_M05_I.pagesRunId);
  assert.equal(value.previous.artifactId, PRIOR_M05_I.artifactId);
  assert.equal(value.previousCacheProfileAvailable, false);
  return value.status;
}
function validateUpload(outcome) { assert.equal(outcome, 'success', 'Artifact upload failed'); }
function finishStatus(result) {
  return result.tests.length > 0 && result.tests.every(t => t.status === 'PASS')
    && result.cleanup.browserClosed && result.cleanup.contextsClosed
    && result.cleanup.cacheContextClosed && result.cleanup.cacheProfileRemoved ? 'PASS' : 'FAIL';
}
function validateInteractionRuntime(tests, observation) {
  const { width, height } = observation.viewport;
  assert.ok((width === 390 && height === 844) || (width === 1440 && height === 1000), 'Unsupported interaction viewport');
  const prefix = width === 390 ? 'M' : 'D';
  const expected = [
    ...Array.from({ length: 16 }, (_, n) => `${prefix}${String(n + 1).padStart(2, '0')}`),
    ...Array.from({ length: 10 }, (_, n) => `R${String(n + 1).padStart(2, '0')}-${width}`),
  ];
  // Only completed prerequisite IDs belong here: R11 itself and later gates do not.
  const preceding = tests.filter(t => t.viewport?.width === width && t.viewport?.height === height
    && ((/^[MD]\d{2}$/.test(t.id) && t.id !== `${prefix}00`) || /^R(?:0[1-9]|10)-/.test(t.id)));
  assert.deepEqual(preceding.map(t => t.id).sort(), expected.sort(), 'Required preceding interaction/runtime test set mismatch');
  assert.ok(preceding.every(t => t.status === 'PASS'), 'Required preceding interaction/runtime test did not PASS');
  assert.deepEqual([...observation.consoleErrors, ...observation.pageErrors, ...observation.rejections, ...observation.failed], []);
  assert.deepEqual(observation.responses.filter(r => r.status >= 400), []);
  assert.deepEqual(observation.blocked, []);
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

function runSiteCommand(siteRoot, args) {
  return execFileSync(process.execPath, args, {
    cwd: siteRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 16 * 1024 * 1024,
    env: { ...process.env, GITHUB_SHA: gitHead(siteRoot) },
  });
}

async function verifySiteBuild(siteRoot, expectedSha, parentDir) {
  sourceEqual(gitHead(siteRoot), expectedSha, 'Build Source checkout SHA');
  const commands = [
    ['tools/validate.mjs'],
    ['tools/validate-skin-m05-g.mjs'],
    ['tools/validate-skin-publication-m05-e.mjs'],
    ['tools/validate-skin-publication-m06-e.mjs'],
    ['tools/test-build.mjs'],
  ];
  const validatorRuns = [];
  for (const args of commands) {
    const output = runSiteCommand(siteRoot, args);
    validatorRuns.push({ command: `node ${args.join(' ')}`, outputTail: output.trim().slice(-1200) });
  }
  const outputDir = join(parentDir, 'public-site');
  const manifestPath = join(parentDir, 'public-manifest.json');
  const buildOutput = runSiteCommand(siteRoot, ['tools/build.mjs', '--output-dir', outputDir, '--manifest', manifestPath]);
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const filePaths = validateArtifactManifest(manifest, expectedSha);
  const [consumer, assets] = await Promise.all([
    readFile(resolve(siteRoot, SKIN_CONSUMER_PATH), 'utf8').then(JSON.parse),
    readFile(resolve(siteRoot, SKIN_ASSETS_PATH), 'utf8').then(JSON.parse),
  ]);
  const population = validatePublicSkinPopulation(consumer, assets, filePaths);
  for (const item of manifest.files) {
    const bytes = await readFile(resolve(outputDir, item.path));
    assert.equal(bytes.length, item.bytes, `Built file size differs from manifest: ${item.path}`);
    assert.equal(sha256(bytes), item.sha256, `Built file hash differs from manifest: ${item.path}`);
  }
  return { outputDir, manifestPath, manifest, population, validatorRuns,
    buildOutputTail: buildOutput.trim().slice(-1200) };
}

async function downloadPagesArtifact(artifactId, token, destination) {
  const apiUrl = `https://api.github.com/repos/${REPOSITORY}/actions/artifacts/${artifactId}/zip`;
  let response;
  try {
    response = await fetch(apiUrl, { redirect: 'manual', signal: AbortSignal.timeout(30000), headers: {
      Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28',
    } });
  } catch (e) { throw sourceError('HOSTED_SOURCE_EVIDENCE_GAP', 'Pages artifact download API failed', { artifactId, error: errorText(e) }); }
  let bytes;
  if (response.status === 200) bytes = Buffer.from(await response.arrayBuffer());
  else {
    evidence(response.status === 302, 'Pages artifact download did not return a supported redirect', { artifactId, status: response.status });
    const signedUrl = new URL(response.headers.get('location') || '');
    evidence(signedUrl.protocol === 'https:' && !signedUrl.username && !signedUrl.password
      && (signedUrl.hostname.endsWith('.blob.core.windows.net') || signedUrl.hostname.endsWith('.amazonaws.com')),
    'Pages artifact redirect host is outside the approved artifact storage hosts', { host: signedUrl.hostname });
    try {
      const storageResponse = await fetch(signedUrl.href, { redirect: 'error', signal: AbortSignal.timeout(60000) });
      evidence(storageResponse.status === 200, 'Pages artifact storage response failed', { status: storageResponse.status });
      bytes = Buffer.from(await storageResponse.arrayBuffer());
    } catch (e) { throw sourceError('HOSTED_SOURCE_EVIDENCE_GAP', 'Signed Pages artifact download failed', { artifactId, error: errorText(e) }); }
  }
  evidence(bytes.length > 0 && bytes.length < 200 * 1024 * 1024, 'Pages artifact archive size is invalid', { bytes: bytes.length });
  await writeFile(destination, bytes, { flag: 'wx' });
  return { bytes: bytes.length, sha256: sha256(bytes) };
}

function normalizePagesTarEntries(entries, manifest) {
  const files = [];
  const directories = [];
  for (const raw of entries) {
    if (raw === '.' || raw === './') continue;
    const withoutLeadingDot = raw.replace(/^\.\//, '');
    if (withoutLeadingDot.endsWith('/')) {
      const directory = withoutLeadingDot.replace(/\/+$/, '');
      assert.ok(directory.split('/').every(segment => segment && segment !== '.' && segment !== '..') && !directory.startsWith('/'),
        `Pages artifact contains unsafe directory: ${raw}`);
      directories.push(directory);
      continue;
    }
    const path = withoutLeadingDot;
    assert.ok(safeArtifactPath(path), `Pages artifact contains an unsafe path: ${raw}`);
    files.push({ path, archivePath: raw });
  }
  const paths = files.map(file => file.path);
  assert.equal(new Set(paths).size, paths.length, 'Pages artifact contains duplicate paths');
  const expectedPaths = manifest.files.map(file => file.path).sort();
  assert.deepEqual([...paths].sort(), expectedPaths, 'Pages artifact file list differs from validated Build manifest');
  return { files, directories };
}
function comparePagesTarWithBuild(artifactTarPath, manifest) {
  const entries = execFileSync('tar', ['-tf', artifactTarPath], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
    .split(/\r?\n/).filter(Boolean);
  const { files } = normalizePagesTarEntries(entries, manifest);
  for (const file of manifest.files) {
    const archiveEntry = files.find(entry => entry.path === file.path);
    assert.ok(archiveEntry, `Pages artifact file missing: ${file.path}`);
    const bytes = execFileSync('tar', ['-xOf', artifactTarPath, archiveEntry.archivePath], { encoding: 'buffer', maxBuffer: 32 * 1024 * 1024 });
    assert.equal(bytes.length, file.bytes, `Pages artifact size differs from Build manifest: ${file.path}`);
    assert.equal(sha256(bytes), file.sha256, `Pages artifact bytes differ from Build manifest: ${file.path}`);
  }
  return { files: files.length, exactPathParity: true, exactByteParity: true };
}

function cacheGuardRules(filePaths) {
  const base = 'https://luceatluxvestra42.github.io/Langrisser-2nd-test/';
  const allowed = [...new Set(['', 'index.html', ...filePaths])].sort();
  const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const resourceTypes = ['main_frame','sub_frame','stylesheet','script','image','font','object','xmlhttprequest','ping','csp_report','media','websocket','webtransport','webbundle','other'];
  return [
    { id: 1, priority: 1, action: { type: 'block' }, condition: { regexFilter: '^https?://', resourceTypes } },
    ...allowed.map((path, index) => ({ id: index + 2, priority: 10, action: { type: 'allow' },
      condition: { regexFilter: `^${escape(base + path)}(?:\\?.*)?$`, resourceTypes } })),
  ];
}
function cacheGuardAllows(url, rules) {
  const matching = rules.filter(rule => new RegExp(rule.condition.regexFilter).test(url))
    .sort((left, right) => right.priority - left.priority);
  return matching[0]?.action.type === 'allow';
}
async function writeCacheGuardExtension(extensionDir, filePaths) {
  await mkdir(extensionDir, { recursive: false });
  const manifest = {
    manifest_version: 3,
    name: 'Ephemeral Hosted QA Network Allowlist',
    version: '1.0.0',
    permissions: ['declarativeNetRequest'],
    host_permissions: ['http://*/*', 'https://*/*'],
    declarative_net_request: { rule_resources: [{ id: 'qa-allowlist', enabled: true, path: 'rules.json' }] },
    background: { service_worker: 'service-worker.js' },
  };
  const worker = `chrome.runtime.onMessage.addListener((message, _sender, reply) => {\n  if (message === 'qa-guard-rulesets') chrome.declarativeNetRequest.getEnabledRulesets().then(reply);\n  return true;\n});\n`;
  const rules = cacheGuardRules(filePaths);
  await Promise.all([
    writeFile(join(extensionDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' }),
    writeFile(join(extensionDir, 'rules.json'), `${JSON.stringify(rules, null, 2)}\n`, { flag: 'wx' }),
    writeFile(join(extensionDir, 'service-worker.js'), worker, { flag: 'wx' }),
  ]);
  return { manifest, rules, ruleSetId: 'qa-allowlist' };
}

async function selfTest() {
  let count = 0;
  const checks = [];
  const pass = (id, layer = 'PURE_HELPER_TEST') => { count++; checks.push({ id, layer, status: 'PASS' }); };
  const reject = (id, fn) => { assert.throws(fn, undefined, id); pass(id); };
  for (const [path, type] of [
    ['index.html', 'text/html; charset=utf-8'], ['app.js', 'text/javascript; charset=UTF-8'],
    ['app.mjs', 'text/javascript; charset=utf-8'], ['styles.css', 'text/css'],
    ['data.json', 'application/json; charset="utf-8"'], ['skin.webp', 'image/webp'], ['portrait.png', 'image/png'],
    ['APP.MJS', ' TEXT/JAVASCRIPT ; CHARSET = "UTF-8" '],
  ]) assert.ok(validateHostedContentType(path, type));
  pass('HOSTED_CONTENT_TYPE_ALLOWED_MATRIX');
  reject('HOSTED_MJS_CONTENT_TYPE', () => validateHostedContentType('app.mjs', 'text/html'));
  reject('HOSTED_JS_UNSUPPORTED_ALIAS', () => validateHostedContentType('app.js', 'application/javascript'));
  reject('HOSTED_CONTENT_TYPE_UNSUPPORTED_EXTENSION', () => validateHostedContentType('data.svg', 'image/svg+xml'));
  reject('HOSTED_CONTENT_TYPE_UNSUPPORTED_PARAMETER', () => validateHostedContentType('app.mjs', 'text/javascript; version=1'));
  reject('HOSTED_CONTENT_TYPE_BAD_CHARSET', () => validateHostedContentType('app.mjs', 'text/javascript; charset=latin1'));
  reject('HOSTED_CONTENT_TYPE_DUPLICATE_PARAMETER', () => validateHostedContentType('app.mjs', 'text/javascript; charset=utf-8; charset=utf-8'));
  reject('HOSTED_CONTENT_TYPE_MALFORMED_PARAMETER', () => validateHostedContentType('app.mjs', 'text/javascript; charset='));
  reject('HOSTED_CONTENT_TYPE_IMAGE_PARAMETER', () => validateHostedContentType('skin.webp', 'image/webp; charset=utf-8'));
  reject('HOSTED_CONTENT_TYPE_SUBSTRING_MATCH', () => validateHostedContentType('app.mjs', 'application/x-text/javascript'));
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
  const result = { tests: [{ status: 'PASS' }], cleanup: { browserClosed: true, contextsClosed: true, cacheContextClosed: true, cacheProfileRemoved: true } };
  assert.equal(finishStatus(result), 'PASS'); pass('RESULT_SUCCESS');
  assert.equal(finishStatus({ ...result, cleanup: { browserClosed: false, contextsClosed: true, cacheContextClosed: true, cacheProfileRemoved: true } }), 'FAIL'); pass('CLEANUP_AGGREGATE_FAIL');
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1000 }]) {
    const prefix = viewport.width === 390 ? 'M' : 'D';
    const observation = { viewport, consoleErrors: [], pageErrors: [], rejections: [], failed: [], responses: [], blocked: [] };
    const prerequisites = [
      ...Array.from({ length: 16 }, (_, n) => ({ id: `${prefix}${String(n + 1).padStart(2, '0')}`, viewport, status: 'PASS' })),
      ...Array.from({ length: 10 }, (_, n) => ({ id: `R${String(n + 1).padStart(2, '0')}-${viewport.width}`, viewport, status: 'PASS' })),
    ];
    const current = { id: `R11-${viewport.width}`, viewport, status: 'NOT_VERIFIED' };
    const tests = [...prerequisites, current];
    validateInteractionRuntime(tests, observation); pass(`R11_${prefix}_SELF_EXCLUDED`);
    validateInteractionRuntime([...tests, { id: `R12-${viewport.width}`, viewport, status: 'NOT_VERIFIED' }], observation); pass(`R11_${prefix}_FUTURE_EXCLUDED`);
    reject(`R11_${prefix}_UI_MISSING`, () => validateInteractionRuntime(tests.slice(1), observation));
    reject(`R11_${prefix}_RUNTIME_MISSING`, () => validateInteractionRuntime(tests.filter(t => t.id !== `R10-${viewport.width}`), observation));
    reject(`R11_${prefix}_DUPLICATE`, () => validateInteractionRuntime([...tests, prerequisites[0]], observation));
    reject(`R11_${prefix}_UNEXPECTED_UI`, () => validateInteractionRuntime([...tests, { id: `${prefix}17`, viewport, status: 'PASS' }], observation));
    for (const id of [`${prefix}01`, `R10-${viewport.width}`]) for (const status of ['FAIL', 'NOT_VERIFIED']) {
      const changed = tests.map(t => t.id === id ? { ...t, status } : t);
      reject(`R11_${prefix}_${id}_${status}`, () => validateInteractionRuntime(changed, observation));
      assert.equal(finishStatus({ ...result, tests: changed }), 'FAIL'); pass(`R11_${prefix}_AGGREGATE_${id}_${status}`);
    }
    for (const key of ['consoleErrors', 'pageErrors', 'rejections', 'failed', 'blocked']) {
      reject(`R11_${prefix}_${key}`, () => validateInteractionRuntime(tests, { ...observation, [key]: ['fixture error'] }));
    }
    reject(`R11_${prefix}_HTTP_FAILURE`, () => validateInteractionRuntime(tests, { ...observation, responses: [{ status: 500 }] }));
    await evaluateTest(current, async () => { validateInteractionRuntime(tests, observation); });
    assert.equal(current.status, 'PASS'); assert.equal(finishStatus({ ...result, tests }), 'PASS'); pass(`R11_${prefix}_EVALUATE_AND_AGGREGATE_PASS`);
  }
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
  const run = { id: 40778088217, workflow_id: 123456789, path: PAGES_WORKFLOW_PATH, head_sha: sha, head_branch: 'main', status: 'completed', conclusion: 'success' };
  assert.equal(selectPagesRun([run], sha).id, run.id); pass('ACTUAL_PAGES_RUN_SHAPE');
  const expectSourceError = (id, code, action) => { assert.throws(action, e => e.code === code); pass(id); };
  expectSourceError('PAGES_RUN_MISSING', 'HOSTED_SOURCE_EVIDENCE_GAP', () => selectPagesRun([], sha));
  expectSourceError('PAGES_WRONG_WORKFLOW', 'HOSTED_SOURCE_EVIDENCE_GAP', () => selectPagesRun([{ ...run, path: 'dynamic/pages/pages-build-deployment' }], sha));
  const ciRun = { ...run, path: CI_WORKFLOW_PATH };
  assert.equal(selectSuccessfulCiRun([ciRun], sha).id, ciRun.id); pass('EXACT_MAIN_CI_RUN');
  expectSourceError('MAIN_CI_MISSING', 'HOSTED_SOURCE_EVIDENCE_GAP', () => selectSuccessfulCiRun([], sha));
  expectSourceError('ARTIFACT_EXPIRED', 'HOSTED_SOURCE_EVIDENCE_GAP', () => selectArtifact([{ name: 'github-pages', expired: true }], run));
  expectSourceError('ARTIFACT_LINK_MISSING', 'HOSTED_SOURCE_EVIDENCE_GAP', () => selectArtifact([{ name: 'github-pages', expired: false }], run));
  reject('BUILD_MANIFEST_TRAVERSAL', () => validateArtifactManifest({ schemaVersion: 1, sourceSha: sha, files: [{ path: '../evidence/secret.json', bytes: 1, sha256: 'a'.repeat(64) }] }, sha));
  reject('BUILD_MANIFEST_SOURCE_MISMATCH', () => validateArtifactManifest({ schemaVersion: 1, sourceSha: 'b'.repeat(40), files: [{ path: 'index.html', bytes: 1, sha256: 'a'.repeat(64) }] }, sha));
  assert.deepEqual(normalizePagesTarEntries(['./', './assets/', './index.html', './assets/skin.webp'], { files: [{ path: 'index.html' }, { path: 'assets/skin.webp' }] }).files,
    [{ path: 'index.html', archivePath: './index.html' }, { path: 'assets/skin.webp', archivePath: './assets/skin.webp' }]); pass('PAGES_TAR_ROOT_NORMALIZATION');
  reject('PAGES_TAR_TRAVERSAL', () => normalizePagesTarEntries(['./../evidence/private.json'], { files: [] }));
  const skinConsumer = { schemaVersion: 1, skins: [
    ...[102, 103, 104, 105].map((skinId, i) => ({ skinId, heroId: 1, sourceOrder: i + 1 })),
    ...[601, 602, 603, 604, 605, 606].map((skinId, i) => ({ skinId, heroId: 6, sourceOrder: i + 1 })),
  ] };
  const skinAssets = { schemaVersion: 1, assets: skinConsumer.skins.map(row => ({ skinId: row.skinId,
    imageUrl: row.skinId >= 602 ? `./assets/skin-admissions/m06/skin-${row.skinId}.webp`
      : row.skinId === 601 ? './assets/skin-admissions/m05-d/skin-601.webp' : `./assets/skins/skin-${row.skinId}.webp` })) };
  const skinPaths = skinAssets.assets.map(row => row.imageUrl.slice(2));
  assert.deepEqual(validatePublicSkinPopulation(skinConsumer, skinAssets, skinPaths), { hero1: 4, hero6: 6, assets: 10 }); pass('APPROVED_M04_M06_POPULATION');
  reject('SKIN_POPULATION_MISSING', () => validatePublicSkinPopulation({ ...skinConsumer, skins: skinConsumer.skins.slice(1) }, skinAssets, skinPaths));
  reject('SKIN_ASSET_WRONG_URL', () => validatePublicSkinPopulation(skinConsumer, { ...skinAssets, assets: skinAssets.assets.map((row, i) => i === 0 ? { ...row, imageUrl: './assets/skins/skin-105.webp' } : row) }, skinPaths));
  const rules = cacheGuardRules(['app.js', 'styles.css', SKIN_CONSUMER_PATH, SKIN_ASSETS_PATH, ...skinPaths]);
  assert.equal(rules[0].action.type, 'block');
  assert.ok(rules.some(rule => rule.action.type === 'allow' && rule.condition.regexFilter.includes(String.raw`skin-606\.webp`)));
  assert.ok(rules.every((rule, index) => rule.id === index + 1)); pass('CACHE_GUARD_ALLOWLIST_RULES');
  assert.equal(cacheGuardAllows(`${HOSTED}assets/skin-admissions/m06/skin-606.webp`, rules), true); pass('CACHE_GUARD_APPROVED_URL');
  assert.equal(cacheGuardAllows(`${HOSTED}canonical/skin-identities.v1.json`, rules), false); pass('CACHE_GUARD_PRIVATE_PATH');
  assert.equal(cacheGuardAllows('https://example.com/', rules), false); pass('CACHE_GUARD_EXTERNAL_ORIGIN');
  reject('CACHE_TRANSITION_REQUIRES_REAL_PROFILE', () => validateCacheTransitionEvidence({ status: 'PASS', previous: PRIOR_M05_I, previousCacheProfileAvailable: false }));
  assert.equal(validateCacheTransitionEvidence({ status: 'NOT_VERIFIED', previous: PRIOR_M05_I, previousCacheProfileAvailable: false }), 'NOT_VERIFIED'); pass('CACHE_TRANSITION_FAIL_CLOSED');
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
    playwrightVersion: null, browserVersion: null, viewports: [], contexts: [], tests: [], probe: [],
    sourceParity: [], deployment: null, pagesArtifactParity: null, buildAuthority: null,
    cacheTransition: { status: 'NOT_VERIFIED', previous: PRIOR_M05_I, previousCacheProfileAvailable: false,
      reason: 'No preserved browser cache profile from the previous deployment is available; this workflow does not synthesize historical cache state.' },
    artifactUpload: 'NOT_VERIFIED: workflow upload step is separate evidence',
    cacheObservation: { status: 'NOT_VERIFIED', securityPolicy: 'PENDING_VALIDATION', events: [] },
    cleanup: { browserClosed: false, contextsClosed: false, cacheContextClosed: false, cacheProfileRemoved: false, runtimeRemoved: false },
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
  let cacheContext;
  let cacheProfileDir;
  let buildRuntimePath;
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
  async function mainCiSnapshot() {
    const runs = await api(`/repos/${REPOSITORY}/actions/workflows/ci.yml/runs?head_sha=${env.EXPECTED_SITE_SHA}&per_page=100`);
    const ci = selectSuccessfulCiRun(runs.workflow_runs, env.EXPECTED_SITE_SHA);
    const jobs = await api(`/repos/${REPOSITORY}/actions/runs/${ci.id}/jobs?per_page=100`);
    const validate = jobs.jobs.find(j => j.name === 'validate' && j.status === 'completed');
    evidence(validate && validate.conclusion === 'success', 'Required validate job did not pass on the exact Site SHA', { runId: ci.id, job: validate });
    return { id: ci.id, headSha: ci.head_sha, path: ci.path, validateJobId: validate.id, validateConclusion: validate.conclusion };
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
    await test('MAIN_REQUIRED_CI', 'Current Required validate job passed on the exact Site Source SHA', async () => {
      result.mainRequiredCi = await mainCiSnapshot();
      return result.mainRequiredCi;
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
      result.pagesRun = { id: pages.id, headSha: pages.head_sha, artifactId: artifact.id, artifactDigest: artifact.digest || null,
        jobs: jobs.jobs.map(j => ({ id: j.id, name: j.name, conclusion: j.conclusion })) };
      result.pagesArtifact = { id: artifact.id, name: artifact.name, digest: artifact.digest || null, sizeInBytes: artifact.size_in_bytes };
      return { ...result.deployment, pagesRun: result.pagesRun };
    });
    let html;
    let payload;
    let publicConsumer;
    let publicAssets;
    let buildEvidence;
    await test('BUILD_AUTHORITY', 'Exact Site SHA passes current owner validators and reproducible public Build allowlist', async () => {
      const parentDir = await mkdtemp(join(env.BROWSER_QA_RUNTIME_ROOT, 'site-build-'));
      buildRuntimePath = parentDir;
      buildEvidence = await verifySiteBuild(env.SITE_SOURCE_ROOT, env.EXPECTED_SITE_SHA, parentDir);
      publicConsumer = JSON.parse(await readFile(resolve(env.SITE_SOURCE_ROOT, SKIN_CONSUMER_PATH), 'utf8'));
      publicAssets = JSON.parse(await readFile(resolve(env.SITE_SOURCE_ROOT, SKIN_ASSETS_PATH), 'utf8'));
      result.buildAuthority = { sourceSha: buildEvidence.manifest.sourceSha, publicFileCount: buildEvidence.manifest.files.length,
        publicPaths: buildEvidence.manifest.files.map(file => file.path), publicManifest: buildEvidence.manifest.files,
        population: buildEvidence.population, validators: buildEvidence.validatorRuns };
      return { sourceSha: buildEvidence.manifest.sourceSha, fileCount: buildEvidence.manifest.files.length,
        population: buildEvidence.population, validators: buildEvidence.validatorRuns.map(row => row.command) };
    });
    await test('HOSTED_PROBE_AND_BYTE_PARITY', 'Hosted resources equal exact Build Output and downloaded Pages Artifact bytes', async () => {
      assert.ok(buildEvidence && result.pagesArtifact, 'Build or Pages Artifact evidence is missing');
      const zipPath = join(buildRuntimePath, 'pages-artifact.zip');
      const tarPath = join(buildRuntimePath, 'artifact.tar');
      const archive = await downloadPagesArtifact(result.pagesArtifact.id, token, zipPath);
      const archiveEntries = execFileSync('unzip', ['-Z1', zipPath], { encoding: 'utf8', maxBuffer: 1024 * 1024 }).split(/\r?\n/).filter(Boolean);
      assert.deepEqual(archiveEntries, ['artifact.tar'], 'Pages Actions Artifact must contain only the expected artifact.tar');
      const tar = execFileSync('unzip', ['-p', zipPath, 'artifact.tar'], { encoding: 'buffer', maxBuffer: 200 * 1024 * 1024 });
      await writeFile(tarPath, tar, { flag: 'wx' });
      result.pagesArtifactParity = { archive, ...comparePagesTarWithBuild(tarPath, buildEvidence.manifest) };
      const consumer = JSON.parse(await readFile(resolve(env.SITE_SOURCE_ROOT, SKIN_CONSUMER_PATH), 'utf8'));
      const assets = JSON.parse(await readFile(resolve(env.SITE_SOURCE_ROOT, SKIN_ASSETS_PATH), 'utf8'));
      validatePublicSkinPopulation(consumer, assets, buildEvidence.manifest.files.map(file => file.path));
      const checks = [];
      const files = buildEvidence.manifest.files.map(file => ({ path: file.path, expected: file }));
      assert.ok(files.some(file => file.path === 'index.html'));
      for (let start = 0; start < files.length; start += 6) {
        const batch = await Promise.all(files.slice(start, start + 6).map(async file => {
          const url = file.path === 'index.html' ? HOSTED : new URL(`./${file.path}`, HOSTED).href;
          const response = await getHosted(hostedUrl(url).href);
          const expected = file.expected;
          sourceEqual(sha256(response.bytes), expected.sha256, `Hosted versus Build bytes ${file.path}`);
          assert.equal(response.bytes.length, expected.bytes, `Hosted versus Build size ${file.path}`);
          validateHostedContentType(file.path, response.contentType);
          result.sourceParity.push({ path: file.path, bytes: expected.bytes, decodedBodySha256: expected.sha256 });
          if (file.path === 'index.html') { html = response.bytes.toString('utf8'); validateHtml(html, response.contentType); }
          if (file.path === JSON_PATH) payload = JSON.parse(response.bytes.toString('utf8'));
          checks.push(file.path);
        }));
      }
      assert.deepEqual(checks.sort(), buildEvidence.manifest.files.map(file => file.path).sort());
      return { exactPublicFileCount: checks.length, pagesArtifact: result.pagesArtifactParity, population: buildEvidence.population,
        sourceParity: result.sourceParity };
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
      const contextId = `fresh-${prefix.toLowerCase()}-${randomUUID()}`;
      const initialCookies = await context.cookies();
      result.contexts.push({ id: contextId, kind: 'FRESH_ISOLATED', viewport, hasTouch: mobile, serviceWorkers: 'block' });
      await context.exposeBinding('__hostedQaRejection', (_source, message) => observed.rejections.push(String(message)));
      await context.addInitScript((hostOrigin) => {
        window.addEventListener('unhandledrejection', event => { window.__hostedQaRejection(String(event.reason?.stack || event.reason)); });
        if (location.origin === hostOrigin) window.__hostedQaFreshStorage = { local: localStorage.length, session: sessionStorage.length };
      }, new URL(HOSTED).origin);
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
        await page.waitForFunction(() => {
          const one = [...document.querySelectorAll('#hero-1 .hero-skin-fullarts img')];
          const six = [...document.querySelectorAll('#hero-6 .hero-skin-fullarts img')];
          return one.length === 4 && six.length === 6 && [...one, ...six].every(image => image.complete && image.naturalWidth > 0);
        }, undefined, { timeout: 60000 });
        const dimensions = await page.evaluate(() => ({ width: innerWidth, height: innerHeight })); assert.deepEqual(dimensions, viewport); return dimensions;
      });
      await check(`${prefix}00`, 'New isolated Browser Context had no prior Cookies or Origin Storage on first Hosted document', async () => {
        assert.deepEqual(initialCookies, []);
        const storage = await page.evaluate(() => window.__hostedQaFreshStorage);
        assert.deepEqual(storage, { local: 0, session: 0 });
        return { contextId, initialCookies: initialCookies.length, initialLocalStorage: storage.local, initialSessionStorage: storage.session };
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
      await check(`${prefix}15`, 'Hero 1 and Hero 6 render every approved Fullart in Generated Source Order', async () => {
        await page.locator('#hero-1 .hero-skin-fullarts').scrollIntoViewIfNeeded();
        await page.locator('#hero-6 .hero-skin-fullarts').scrollIntoViewIfNeeded();
        const galleries = await page.evaluate(() => {
          const cards = [...document.querySelectorAll('#heroes .hero-card')];
          return {
            populatedHeroIds: cards.filter(card => card.querySelector('.hero-skin-fullarts')).map(card => Number(card.id.slice('hero-'.length))).sort((a,b) => a-b),
            heroes: [1, 6].map(heroId => {
              const section = document.querySelector(`#hero-${heroId} .hero-skin-fullarts`);
              const list = section?.querySelector('.hero-skin-fullart-list');
              return { heroId, heading: section?.querySelector('h3')?.textContent ?? '', listLabel: list?.getAttribute('aria-label') ?? '',
                images: [...(list?.querySelectorAll('img') ?? [])].map(image => ({ url: new URL(image.currentSrc || image.src).pathname,
                  alt: image.alt, complete: image.complete, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight,
                  objectFit: getComputedStyle(image).objectFit, error: Boolean(image.closest('li')?.querySelector('.hero-skin-fullart-error')) })) };
            }), viewportWidth: innerWidth, documentWidth: document.documentElement.scrollWidth,
          };
        });
        assert.deepEqual(galleries.populatedHeroIds, [1, 6]);
        for (const gallery of galleries.heroes) {
          const expectedRows = publicConsumer.skins.filter(row => row.heroId === gallery.heroId).sort((a,b) => a.sourceOrder - b.sourceOrder);
          const expectedUrls = expectedRows.map(row => new URL(publicAssets.assets.find(asset => asset.skinId === row.skinId).imageUrl, HOSTED).pathname);
          assert.deepEqual(gallery.images.map(image => image.url), expectedUrls, `Hero ${gallery.heroId} URL order differs from Generated Source Order`);
          assert.equal(gallery.images.length, expectedRows.length);
          assert.equal(gallery.listLabel, '스킨 일러스트');
          gallery.images.forEach((image, index) => {
            assert.equal(image.alt, `영웅 스킨 일러스트 ${index + 1} / ${expectedRows.length}`);
            assert.ok(image.complete && image.naturalWidth > 0 && image.naturalHeight > 0, 'Fullart image did not decode');
            assert.equal(image.objectFit, 'contain');
            assert.equal(image.error, false);
          });
        }
        assert.ok(galleries.documentWidth <= galleries.viewportWidth, JSON.stringify(galleries));
        return galleries;
      });
      await check(`${prefix}16`, 'Fullart presentation exposes generic accessible descriptions without Skin names or SkinID text', async () => {
        const galleries = await page.evaluate(() => [1, 6].map(heroId => {
          const section = document.querySelector(`#hero-${heroId} .hero-skin-fullarts`);
          const list = section?.querySelector('.hero-skin-fullart-list');
          return { heroId, text: section?.innerText ?? '', labels: [...(list?.querySelectorAll('img') ?? [])].map(image => image.alt),
            listRole: list?.getAttribute('role') || list?.tagName.toLowerCase(), listLabel: list?.getAttribute('aria-label') ?? '',
            namesVisible: Boolean(section?.querySelector('.hero-skin-fullart-error')) };
        }));
        const skinNumbers = /\b(?:102|103|104|105|601|602|603|604|605|606)\b/;
        for (const gallery of galleries) {
          assert.ok(!skinNumbers.test(gallery.text), 'User-visible Fullart text contains a SkinID');
          assert.equal(gallery.listRole, 'ul'); assert.equal(gallery.listLabel, '스킨 일러스트');
          assert.equal(gallery.namesVisible, false);
          assert.deepEqual(gallery.labels, gallery.labels.map((_, index) => `영웅 스킨 일러스트 ${index + 1} / ${gallery.labels.length}`));
        }
        return galleries.map(({ heroId, labels, listRole, listLabel }) => ({ heroId, labels, listRole, listLabel }));
      });
      observed.interactionsCompletedAt = new Date().toISOString();
    }
    await test('CACHE_GUARD', 'Cache observation uses a fresh Chromium profile with pre-request Origin and Path allowlisting', async () => {
      const extensionDir = join(env.BROWSER_QA_RUNTIME_ROOT, 'cache-guard-extension');
      const filePaths = buildEvidence.manifest.files.map(file => file.path);
      const guard = await writeCacheGuardExtension(extensionDir, filePaths);
      cacheProfileDir = join(env.BROWSER_QA_RUNTIME_ROOT, `cache-profile-${randomUUID()}`);
      try { await access(cacheProfileDir); throw new Error('Cache profile path unexpectedly exists before browser launch'); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
      cacheContext = await chromium.launchPersistentContext(cacheProfileDir, {
        headless: false, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
        serviceWorkers: 'block', args: [`--disable-extensions-except=${extensionDir}`, `--load-extension=${extensionDir}`],
      });
      contexts.push(cacheContext);
      const worker = cacheContext.serviceWorkers().find(item => item.url().startsWith('chrome-extension://'))
        || await cacheContext.waitForEvent('serviceworker', { timeout: 15000 });
      const enabledRulesets = await worker.evaluate(() => new Promise(resolveRules => chrome.runtime.sendMessage('qa-guard-rulesets', resolveRules)));
      assert.ok(enabledRulesets.includes(guard.ruleSetId), 'Chrome DNR allowlist ruleset was not enabled');
      const guardPage = await cacheContext.newPage();
      const blockedRequests = [];
      guardPage.on('requestfailed', request => blockedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
      await assert.rejects(guardPage.goto(new URL('evidence/private.json', HOSTED).href, { waitUntil: 'commit', timeout: 15000 }), /ERR_BLOCKED_BY_CLIENT/);
      await assert.rejects(guardPage.goto('https://example.com/', { waitUntil: 'commit', timeout: 15000 }), /ERR_BLOCKED_BY_CLIENT/);
      assert.equal(blockedRequests.length, 2);
      assert.ok(blockedRequests.every(row => row.error?.includes('ERR_BLOCKED_BY_CLIENT')));
      await guardPage.close();
      result.cacheObservation = { ...result.cacheObservation, profileId: cacheProfileDir.split('/').at(-1), rulesetId: guard.ruleSetId,
        allowedPublicPathCount: filePaths.length + 1, deniedProbes: blockedRequests, playwrightRoutingEnabled: false,
        serviceWorkers: 'blocked; HTTP cache observed separately', securityPolicy: 'DNR allowlist blocks unapproved HTTP(S) requests before network; exact artifact paths only' };
      return { rulesetId: guard.ruleSetId, allowedPublicPathCount: filePaths.length + 1, deniedProbeCount: blockedRequests.length,
        playwrightRoutingEnabled: false, serviceWorkers: 'blocked' };
    });
    let cachePage;
    let cacheCdp;
    const cacheEvidence = { requestUrls: new Map(), cachedRequestIds: new Set(), responses: [], extraStatuses: [], consoleErrors: [], pageErrors: [], failed: [], startedAt: null };
    await test('CACHE_FRESH', 'Fresh isolated Cache Observation profile loads the exact current Hosted version', async () => {
      assert.ok(cacheContext && cacheProfileDir);
      assert.deepEqual(await cacheContext.cookies(), []);
      cachePage = await cacheContext.newPage();
      cachePage.setDefaultNavigationTimeout(30000);
      cachePage.on('console', message => { if (message.type() === 'error') cacheEvidence.consoleErrors.push(message.text()); });
      cachePage.on('pageerror', error => cacheEvidence.pageErrors.push(errorText(error)));
      cachePage.on('requestfailed', request => cacheEvidence.failed.push({ url: request.url(), error: request.failure()?.errorText }));
      cacheCdp = await cacheContext.newCDPSession(cachePage);
      await cacheCdp.send('Network.enable');
      await cacheCdp.send('Network.setCacheDisabled', { cacheDisabled: false });
      cacheCdp.on('Network.requestWillBeSent', event => cacheEvidence.requestUrls.set(event.requestId, event.request.url));
      cacheCdp.on('Network.requestServedFromCache', event => cacheEvidence.cachedRequestIds.add(event.requestId));
      cacheCdp.on('Network.responseReceived', event => cacheEvidence.responses.push({ requestId: event.requestId, url: event.response.url,
        status: event.response.status, fromDiskCache: event.response.fromDiskCache, fromServiceWorker: event.response.fromServiceWorker,
        cacheControl: event.response.headers['cache-control'] || event.response.headers['Cache-Control'] || null,
        etag: event.response.headers.etag || event.response.headers.ETag || null }));
      cacheCdp.on('Network.responseReceivedExtraInfo', event => cacheEvidence.extraStatuses.push({ requestId: event.requestId, status: event.statusCode }));
      cacheEvidence.startedAt = new Date().toISOString();
      const response = await cachePage.goto(HOSTED, { waitUntil: 'networkidle' }); successfulResponse(response.status());
      await cachePage.waitForFunction(() => [...document.querySelectorAll('#hero-1 .hero-skin-fullarts img, #hero-6 .hero-skin-fullarts img')]
        .length === 10 && [...document.querySelectorAll('#hero-1 .hero-skin-fullarts img, #hero-6 .hero-skin-fullarts img')]
        .every(image => image.complete && image.naturalWidth > 0), undefined, { timeout: 60000 });
      const snapshot = await deploymentSnapshot();
      assert.equal(snapshot.sha, env.EXPECTED_SITE_SHA);
      result.contexts.push({ id: 'cache-' + randomUUID(), kind: 'FRESH_THEN_REVISIT_CACHE_OBSERVATION', viewport: { width: 390, height: 844 },
        isMobile: true, hasTouch: true, serviceWorkers: 'blocked', routing: false, newProfile: true });
      result.cacheObservation.currentDeployment = snapshot;
      result.cacheObservation.firstVisit = { status: response.status(), at: cacheEvidence.startedAt, fullartCount: 10,
        responseHeaders: cacheEvidence.responses.filter(row => /app\.js|styles\.css|skin-/.test(row.url)).map(({ url, status, cacheControl, etag }) => ({ url, status, cacheControl, etag })) };
      assert.deepEqual(cacheEvidence.consoleErrors, []); assert.deepEqual(cacheEvidence.pageErrors, []); assert.deepEqual(cacheEvidence.failed, []);
      return { siteSha: snapshot.sha, deploymentId: snapshot.id, fullartCount: 10, firstVisitResponses: cacheEvidence.responses.length };
    });
    await test('CACHE_REVISIT', 'Same isolated Context revisits Hosted URL and directly observes HTTP cache or revalidation', async () => {
      assert.ok(cacheContext && cachePage && cacheCdp);
      await cachePage.goto('about:blank', { waitUntil: 'load' });
      const response = await cachePage.goto(HOSTED, { waitUntil: 'networkidle' }); successfulResponse(response.status());
      await cachePage.waitForFunction(() => [...document.querySelectorAll('#hero-1 .hero-skin-fullarts img, #hero-6 .hero-skin-fullarts img')]
        .length === 10 && [...document.querySelectorAll('#hero-1 .hero-skin-fullarts img, #hero-6 .hero-skin-fullarts img')]
        .every(image => image.complete && image.naturalWidth > 0), undefined, { timeout: 60000 });
      await new Promise(resolveWait => setTimeout(resolveWait, 1000));
      const cached = cacheEvidence.responses.filter(row => cacheEvidence.cachedRequestIds.has(row.requestId) || row.fromDiskCache || row.fromServiceWorker);
      const notModifiedIds = new Set(cacheEvidence.extraStatuses.filter(row => row.status === 304).map(row => row.requestId));
      const cacheEvents = cacheEvidence.responses.filter(row => cacheEvidence.cachedRequestIds.has(row.requestId) || row.fromDiskCache || notModifiedIds.has(row.requestId));
      const isCachedPath = path => cacheEvents.some(row => new URL(row.url).pathname.endsWith(`/${path}`));
      for (const path of ['app.js', 'styles.css']) assert.ok(isCachedPath(path), `No direct Cache hit or revalidation evidence for ${path}`);
      assert.ok(publicAssets.assets.some(asset => isCachedPath(new URL(asset.imageUrl, HOSTED).pathname.split('/').at(-1))),
        'No direct HTTP cache evidence for any Fullart WebP');
      const requiredPaths = ['app.js', 'styles.css', ...publicAssets.assets.map(row => new URL(row.imageUrl, HOSTED).pathname.split('/').at(-1))];
      const observedUrls = [...cacheEvidence.requestUrls.values()];
      for (const file of requiredPaths) assert.ok(observedUrls.some(url => new URL(url).pathname.endsWith(`/${file}`)), `No browser request observed for ${file}`);
      assert.ok(cacheEvents.length > 0, 'Chromium reported no cache hit or 304 revalidation');
      assert.ok(!cacheEvidence.responses.some(row => row.fromServiceWorker), 'Unexpected Service Worker response in HTTP cache observation');
      assert.deepEqual(cacheEvidence.consoleErrors, []); assert.deepEqual(cacheEvidence.pageErrors, []); assert.deepEqual(cacheEvidence.failed, []);
      const pathBlocked = cacheEvidence.responses.some(row => { try { hostedUrl(row.url); return false; } catch { return true; } });
      assert.equal(pathBlocked, false, 'Unapproved Origin or Path reached a response');
      result.cacheObservation.revisit = { status: response.status(), at: new Date().toISOString(), sameContext: true, sameUrl: true,
        cacheDisabled: false, playwrightRoutingEnabled: false, serviceWorkers: 'blocked', cacheEvents: cacheEvents.map(row => ({ url: row.url,
          status: row.status, fromDiskCache: row.fromDiskCache, fromServiceWorker: row.fromServiceWorker, cacheControl: row.cacheControl, etag: row.etag })),
        extraStatuses: cacheEvidence.extraStatuses.filter(row => row.status === 304), noErrors: true };
      result.cacheObservation.status = 'REVISIT_PASS';
      return result.cacheObservation.revisit;
    });
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
      await check('R11', 'Actual search, card and link interactions completed without observed Runtime errors', async () => { validateInteractionRuntime(result.tests, o); return { interactionInterval: [o.startedAt, o.interactionsCompletedAt] }; });
    }
  } catch (e) {
    result.failure = errorText(e); result.failureDetails = { category: e.code || 'QA_FAILURE', evidence: e.details || null };
    if (e.code === 'HOSTED_SOURCE_MISMATCH' || e.code === 'HOSTED_SOURCE_EVIDENCE_GAP') result.sourceStatus = e.code;
    process.exitCode = 1;
  }
  finally {
    result.runtimeObservations = observations;
    const cacheContextIndex = contexts.indexOf(cacheContext);
    const closed = await Promise.allSettled(contexts.map(c => c.close()));
    for (const o of observations) o.completedAt = new Date().toISOString();
    if (observations.length) {
      const errors = observations.flatMap(o => [...o.consoleErrors, ...o.pageErrors, ...o.rejections, ...o.failed, ...o.blocked, ...o.responses.filter(r => r.status >= 400)]);
      result.tests.push({ id: 'RUNTIME_UNTIL_CONTEXT_CLOSE', status: errors.length ? 'FAIL' : 'PASS', observed: { errors }, completedAt: new Date().toISOString() });
    }
    result.cleanup.contextsClosed = closed.every(r => r.status === 'fulfilled');
    result.cleanup.cacheContextClosed = !cacheContext || closed[cacheContextIndex]?.status === 'fulfilled';
    try { if (cacheProfileDir) await rm(cacheProfileDir, { recursive: true, force: true }); result.cleanup.cacheProfileRemoved = !cacheProfileDir; if (cacheProfileDir) { await access(cacheProfileDir); result.cleanup.cacheProfileRemoved = false; } }
    catch (e) { if (e.code === 'ENOENT') result.cleanup.cacheProfileRemoved = true; else { result.cleanup.cacheProfileRemoved = false; result.cleanup.cacheProfileError = errorText(e); } }
    try { if (buildRuntimePath) await rm(buildRuntimePath, { recursive: true, force: true }); }
    catch (e) { result.cleanup.buildRuntimeRemoved = false; result.cleanup.buildRuntimeError = errorText(e); }
    try { if (browser) await browser.close(); result.cleanup.browserClosed = !browser || !browser.isConnected(); }
    catch (e) { result.cleanup.error = errorText(e); }
    result.tests.push({ id: 'R12', status: result.cleanup.contextsClosed && result.cleanup.browserClosed ? 'PASS' : 'FAIL', observed: { browserClosed: result.cleanup.browserClosed, contextsClosed: result.cleanup.contextsClosed }, completedAt: new Date().toISOString() });
    const required = ['INPUT_AND_INFRASTRUCTURE', 'MAIN_REQUIRED_CI', 'DEPLOYMENT_SOURCE', 'BUILD_AUTHORITY', 'HOSTED_PROBE_AND_BYTE_PARITY', 'HOSTED_JSON',
      'CHROMIUM_LAUNCH', 'CACHE_GUARD', 'CACHE_FRESH', 'CACHE_REVISIT', 'DEPLOYMENT_STILL_CURRENT', 'R12'];
    for (const prefix of ['M', 'D']) {
      required.push(`${prefix}00`);
      for (let n = 1; n <= 16; n++) required.push(`${prefix}${String(n).padStart(2, '0')}`);
    }
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
