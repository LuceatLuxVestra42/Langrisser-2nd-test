import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdtemp, mkdir, rm, writeFile, symlink, copyFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildSite, publicSitePaths, validatePublicSiteDirectory } from './build.mjs';
import { TRAINING_TECH_DECISION_RECORD_PATH } from './soldier-training-tech-presentation-contract.mjs';

const heroes = JSON.parse(await readFile('canonical/heroes.v1.json', 'utf8'));
const decision = JSON.parse(await readFile(TRAINING_TECH_DECISION_RECORD_PATH, 'utf8'));
const temp = await mkdtemp(join(tmpdir(), 'public-build-test-'));
const output = join(temp, 'site');
const trainingPath = 'generated/soldier-training-tech-descriptions.v1.json';
const skinConsumerPath = 'generated/skin-consumer.v1.json';
const publicConsumerPath = 'generated/skin-consumer-public-m05-g.v1.json';
const publicAssetsPath = 'generated/skin-assets-public-m05-g.v1.json';
const publicAssets = JSON.parse(await readFile(publicAssetsPath, 'utf8'));
const skinAssetPaths = publicAssets.assets.map((row) => row.imageUrl.slice(2));
const expectedSkinRows = JSON.parse(await readFile(skinConsumerPath, 'utf8')).skins;
const expectedPublicRows = JSON.parse(await readFile(publicConsumerPath, 'utf8')).skins;
try {
  const built = await buildSite({ outputDir: output });
  assert.deepEqual(built.files.map(file => file.path), publicSitePaths(heroes, decision, skinAssetPaths));
  assert.ok(built.files.some(file => file.path === skinConsumerPath), 'approved Skin Generated consumer must enter the public artifact');
  assert.ok(publicSitePaths(heroes, decision, skinAssetPaths).includes(skinConsumerPath), 'Frozen M03 consumer compatibility artifact must remain published');
  assert.ok(publicSitePaths(heroes, decision, skinAssetPaths).includes(publicConsumerPath), 'approved generic Skin consumer must be published');
  const skinConsumer = JSON.parse(await readFile(skinConsumerPath, 'utf8'));
  assert.deepEqual(skinConsumer, { schemaVersion: 1, skins: expectedSkinRows }, 'public Skin payload must preserve the exact approved M03 population and fields');
  assert.deepEqual(JSON.parse(await readFile(join(output, publicConsumerPath), 'utf8')).skins, expectedPublicRows);
  assert.deepEqual(JSON.parse(await readFile(join(output, publicAssetsPath), 'utf8')), publicAssets);
  for (const path of skinAssetPaths) {
    assert.ok(built.files.some((file) => file.path === path), `approved Skin Fullart must be published: ${path}`);
    assert.deepEqual(await readFile(join(output, path)), await readFile(path), `published Skin Fullart bytes must match source: ${path}`);
  }
  assert.ok(built.files.includes(undefined) === false);
  assert.ok(built.files.some((file) => file.path === 'skin-fullart-presentation.mjs'));
  assert.ok(built.files.some((file) => file.path === 'skin-asset-publication-contract.mjs'));
  assert.ok(built.files.every(file => !/^(canonical|evidence|tools|docs)\//.test(file.path)));
  assert.ok(!built.files.some((file) => file.path === 'evidence/assets/skin-fullart-m04.v1.json'), 'internal Asset Manifest must remain private');
  assert.ok(!built.files.some((file) => file.path === 'evidence/assets/skin-fullart-m05-d.v1.json'), 'M05-D internal Asset Evidence must remain private');
  assert.ok(built.files.some((file) => file.path === 'assets/skin-admissions/m05-d/skin-601.webp'), 'Publication-approved Skin 601 must be included from its exact manifest path');
  await assert.rejects(buildSite({ outputDir: output }), /EEXIST/);
  const validate = (record = decision) => validatePublicSiteDirectory(output, heroes, record);
  await rm(join(output, skinConsumerPath));
  await assert.rejects(validate(), /allowlist mismatch/);
  await copyFile(skinConsumerPath, join(output, skinConsumerPath));
  await writeFile(join(output, skinConsumerPath), '{}');
  await assert.rejects(validate(), /bytes differ.*generated\/skin-consumer\.v1\.json/);
  await copyFile(skinConsumerPath, join(output, skinConsumerPath));
  await validate();
  const server = createServer(async (request, response) => {
    const path = new URL(request.url ?? '/', 'http://127.0.0.1').pathname.replace(/^\/+/, '');
    if (!built.files.some(file => file.path === path)) {
      response.writeHead(404).end('Not Found');
      return;
    }
    try {
      const bytes = await readFile(join(output, path));
      response.writeHead(200, { 'content-type': path.endsWith('.webp') ? 'image/webp' : 'application/json; charset=utf-8' }).end(bytes);
    } catch {
      response.writeHead(404).end('Not Found');
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  try {
    const address = server.address();
    const origin = `http://127.0.0.1:${address.port}`;
    const response = await fetch(`${origin}/${publicConsumerPath}`, { cache: 'no-store' });
    assert.equal(response.status, 200, 'public Skin JSON URL must return HTTP 200');
    assert.deepEqual(await response.json(), { schemaVersion: 1, skins: expectedPublicRows }, 'fetched Skin JSON must retain approved semantic rows');
    for (const path of skinAssetPaths) assert.equal((await fetch(`${origin}/${path}`)).status, 200, `published Skin Fullart URL must resolve: ${path}`);
    assert.equal((await fetch(`${origin}/assets/skin-admissions/other/skin-601.webp`)).status, 404, 'unregistered admission directories must not be published');
    assert.equal((await fetch(`${origin}/generated/skin-consumer-missing.v1.json`)).status, 404, 'unknown Generated path must return HTTP 404');
    assert.equal((await fetch(`${origin}/canonical/skin-identities.v1.json`)).status, 404, 'Canonical owner files must remain outside the publication surface');
    assert.equal((await fetch(`${origin}/evidence/source/skin-identity-m01.v1.json`)).status, 404, 'Evidence files must remain outside the publication surface');
    assert.equal((await fetch(`${origin}/evidence/assets/skin-fullart-m05-d.v1.json`)).status, 404, 'M05-D Asset Evidence must remain private');
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
  await writeFile(join(output, 'unexpected.json'), '{}');
  await assert.rejects(validate(), /allowlist mismatch/);
  await rm(join(output, 'unexpected.json'));
  await mkdir(join(output, 'evidence'));
  await assert.rejects(validate(), /Unexpected public directory/);
  await rm(join(output, 'evidence'), { recursive: true });
  await symlink(join(process.cwd(), 'app.js'), join(output, 'linked.js'));
  await assert.rejects(validate(), /Non-regular public entry/);
  await rm(join(output, 'linked.js'));
  await writeFile(join(output, 'app.js'), '// wrong bytes');
  await assert.rejects(validate(), /bytes differ.*app.js/);
  await copyFile('app.js', join(output, 'app.js'));
  await rm(join(output, 'styles.css'));
  await assert.rejects(validate(), /allowlist mismatch/);
  await copyFile('styles.css', join(output, 'styles.css'));

  for (const state of ['REVOKED', 'APPROVED_ONLY', 'PROPOSED']) {
    const disabled = structuredClone(decision);
    disabled.contract.effectivenessStatus = state;
    if (state === 'REVOKED') {
      disabled.revocation.status = 'REVOKED';
      disabled.revocation.revokedAt = '2026-10-29';
      disabled.revocation.reason = 'test-only revocation';
    }
    if (state === 'PROPOSED') {
      disabled.contract.approvalStatus = 'NOT_APPROVED';
      disabled.decisionA.status = 'NOT_APPROVED';
      disabled.decisionB.status = 'NOT_APPROVED';
    }
    assert.ok(!publicSitePaths(heroes, disabled, skinAssetPaths).includes(trainingPath));
    await assert.rejects(validate(disabled), /allowlist mismatch/);
    await rm(join(output, trainingPath));
    await validate(disabled);
    await copyFile(trainingPath, join(output, trainingPath));
  }
  const invalid = structuredClone(decision);
  invalid.contract.version = 999;
  assert.throws(() => publicSitePaths(heroes, invalid), /contract approval\/effectiveness state mismatch/);
  await validate();
  await buildSite({ verifyDir: output });
  console.log('Public Build checks: PASS (generic approved Skin projections, registry WebP URLs, byte parity, private Evidence and allowlist negatives)');
} finally {
  await rm(temp, { recursive: true, force: true });
}
