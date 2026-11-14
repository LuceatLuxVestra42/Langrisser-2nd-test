import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdtemp, mkdir, rm, writeFile, symlink, copyFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildSite, publicSitePaths, validatePublicSiteDirectory } from './build.mjs';
import { TRAINING_TECH_DECISION_RECORD_PATH } from './soldier-training-tech-presentation-contract.mjs';
import { EXCLUSIVE_EQUIPMENT_HERO_NAVIGATION_PATH, EXCLUSIVE_EQUIPMENT_HERO_PUBLICATION_PATH } from './exclusive-equipment-hero-navigation-contract.mjs';
import { HERO_15_INTEGRATED_PUBLICATION_PATH, HERO_15_MINIMAL_DETAIL_PATH } from './hero-15-integrated-publication-contract.mjs';
import { HERO_15_TALENT_PUBLIC_PATH } from './hero-15-talent-publication-contract.mjs';
import { HERO_16_INTEGRATED_PUBLICATION_PATH, HERO_16_MINIMAL_DETAIL_PATH } from './hero-16-integrated-publication-contract.mjs';
import { HERO_MINIMAL_DETAIL_BATCH_PATH, HERO_MINIMAL_DETAIL_BATCH_PUBLICATION_PATH } from './hero-minimal-detail-batch-contract.mjs';
import { HERO_MINIMAL_DETAIL_TEN_BATCH_PATH, HERO_MINIMAL_DETAIL_TEN_BATCH_PUBLICATION_PATH } from './hero-minimal-detail-ten-batch-contract.mjs';
import { HERO_MINIMAL_DETAIL_TWENTY_BATCH_PATH, HERO_MINIMAL_DETAIL_TWENTY_BATCH_PUBLICATION_PATH } from './hero-minimal-detail-twenty-batch-contract.mjs';
import { HERO_MINIMAL_DETAIL_THIRTY_BATCH_PATH, HERO_MINIMAL_DETAIL_THIRTY_BATCH_PUBLICATION_PATH } from './hero-minimal-detail-thirty-batch-contract.mjs';
import { HERO_MINIMAL_DETAIL_THIRTY_ONE_BATCH_PATH, HERO_MINIMAL_DETAIL_THIRTY_ONE_BATCH_PUBLICATION_PATH } from './hero-minimal-detail-thirty-one-batch-contract.mjs';
import { HERO_MINIMAL_DETAIL_FORTY_BATCH, HERO_MINIMAL_DETAIL_FORTY_BATCH_PATH, HERO_MINIMAL_DETAIL_FORTY_BATCH_PUBLICATION_PATH } from './hero-minimal-detail-forty-batch-contract.mjs';

const heroes = JSON.parse(await readFile('canonical/heroes.v1.json', 'utf8'));
const decision = JSON.parse(await readFile(TRAINING_TECH_DECISION_RECORD_PATH, 'utf8'));
const exclusiveHeroDecision = JSON.parse(await readFile(EXCLUSIVE_EQUIPMENT_HERO_PUBLICATION_PATH, 'utf8'));
const hero15IntegratedDecision = JSON.parse(await readFile(HERO_15_INTEGRATED_PUBLICATION_PATH, 'utf8'));
const hero16IntegratedDecision = JSON.parse(await readFile(HERO_16_INTEGRATED_PUBLICATION_PATH, 'utf8'));
const heroMinimalDetailBatchDecision = JSON.parse(await readFile(HERO_MINIMAL_DETAIL_BATCH_PUBLICATION_PATH, 'utf8'));
const heroMinimalDetailBatchConsumer = JSON.parse(await readFile(HERO_MINIMAL_DETAIL_BATCH_PATH, 'utf8'));
const heroMinimalDetailTenBatchDecision = JSON.parse(await readFile(HERO_MINIMAL_DETAIL_TEN_BATCH_PUBLICATION_PATH, 'utf8'));
const heroMinimalDetailTenBatchConsumer = JSON.parse(await readFile(HERO_MINIMAL_DETAIL_TEN_BATCH_PATH, 'utf8'));
const heroMinimalDetailTwentyBatchDecision = JSON.parse(await readFile(HERO_MINIMAL_DETAIL_TWENTY_BATCH_PUBLICATION_PATH, 'utf8'));
const heroMinimalDetailTwentyBatchConsumer = JSON.parse(await readFile(HERO_MINIMAL_DETAIL_TWENTY_BATCH_PATH, 'utf8'));
const heroMinimalDetailThirtyBatchDecision = JSON.parse(await readFile(HERO_MINIMAL_DETAIL_THIRTY_BATCH_PUBLICATION_PATH, 'utf8'));
const heroMinimalDetailThirtyBatchConsumer = JSON.parse(await readFile(HERO_MINIMAL_DETAIL_THIRTY_BATCH_PATH, 'utf8'));
const heroMinimalDetailThirtyOneBatchDecision = JSON.parse(await readFile(HERO_MINIMAL_DETAIL_THIRTY_ONE_BATCH_PUBLICATION_PATH, 'utf8'));
const heroMinimalDetailThirtyOneBatchConsumer = JSON.parse(await readFile(HERO_MINIMAL_DETAIL_THIRTY_ONE_BATCH_PATH, 'utf8'));
const heroMinimalDetailFortyBatchDecision = JSON.parse(await readFile(HERO_MINIMAL_DETAIL_FORTY_BATCH_PUBLICATION_PATH, 'utf8'));
const heroMinimalDetailFortyBatchConsumer = JSON.parse(await readFile(HERO_MINIMAL_DETAIL_FORTY_BATCH_PATH, 'utf8'));
const temp = await mkdtemp(join(tmpdir(), 'public-build-test-'));
const output = join(temp, 'site');
const trainingPath = 'generated/soldier-training-tech-descriptions.v1.json';
const skinConsumerPath = 'generated/skin-consumer.v1.json';
const publicConsumerPath = 'generated/skin-consumer-public-m05-g.v1.json';
const publicAssetsPath = 'generated/skin-assets-public-m05-g.v1.json';
const heroIndexPath = 'generated/hero-index.v1.json';
const heroIndex = JSON.parse(await readFile(heroIndexPath, 'utf8'));
const fullDetailPublicationDecision = JSON.parse(await readFile('docs/decisions/hero-index-publication.v1.json', 'utf8'));
const fullDetailGeneratedPath = 'generated/hero-slice.v1.json';
const fullDetailGenerated = JSON.parse(await readFile(fullDetailGeneratedPath, 'utf8'));
const publicAssets = JSON.parse(await readFile(publicAssetsPath, 'utf8'));
const skinAssetPaths = publicAssets.assets.map((row) => row.imageUrl.slice(2));
const expectedSkinRows = JSON.parse(await readFile(skinConsumerPath, 'utf8')).skins;
const expectedPublicRows = JSON.parse(await readFile(publicConsumerPath, 'utf8')).skins;
try {
  const built = await buildSite({ outputDir: output });
  const publicEquipment = JSON.parse(await readFile(join(output, 'generated/general-ssr-equipment.v1.json'), 'utf8'));
  const excludedEquipmentIds = [265, 266, 267, 268, 288, 289, 290, 291];
  assert.equal(publicEquipment.equipment.length, 198, 'public General SSR Equipment must contain the approved 198 IDs');
  assert.equal(publicEquipment.equipment.some(({ equipmentId }) => excludedEquipmentIds.includes(equipmentId)), false, 'excluded General SSR Equipment IDs must not enter Build output');
  assert.deepEqual(built.files.map(file => file.path), publicSitePaths(heroes, fullDetailPublicationDecision, decision, skinAssetPaths, exclusiveHeroDecision, hero15IntegratedDecision, hero16IntegratedDecision, heroMinimalDetailBatchDecision, heroMinimalDetailTenBatchDecision, heroMinimalDetailTwentyBatchDecision, heroMinimalDetailThirtyBatchDecision, heroMinimalDetailThirtyOneBatchDecision, heroMinimalDetailFortyBatchDecision));
  assert.equal(built.files.some((file) => file.path === 'generated/hero-15-casting-law-internal.v1.json'), false, 'Casting Law internal consumer must remain outside the public Build');
  assert.equal(built.files.some((file) => file.path === 'assets/portraits/hero-15.png'), false, 'internally admitted Hero 15 portrait must remain outside the public Build');
  assert.ok(built.files.some((file) => file.path === heroIndexPath), 'approved Hero Index must enter the public artifact');
  const packagedFullDetail = JSON.parse(await readFile(join(output, fullDetailGeneratedPath), 'utf8'));
  assert.deepEqual(packagedFullDetail, fullDetailGenerated, 'Public Build must package only the validated Full Detail projection');
  assert.deepEqual(packagedFullDetail.heroes.map(({ id }) => id), fullDetailPublicationDecision.approvedScope.detailHeroIds,
    'Public Build Full Detail population must follow the approved endpoint ID set');
  assert.equal(packagedFullDetail.heroes.some(({ id }) => id === 15), false, 'unapproved Hero 15 Full Detail must not enter the Public Build');
  assert.equal(JSON.stringify(packagedFullDetail).includes('assets/portraits/hero-15.png'), false,
    'internal Hero 15 Portrait path must not enter the Public Build Full Detail payload');
  assert.ok(built.files.some((file) => file.path === EXCLUSIVE_EQUIPMENT_HERO_NAVIGATION_PATH), 'approved Exclusive Equipment Hero Navigation must enter the public artifact');
  assert.ok(built.files.some((file) => file.path === HERO_15_MINIMAL_DETAIL_PATH), 'approved Hero 15 Minimal Detail must enter the public artifact');
  assert.ok(built.files.some((file) => file.path === HERO_15_TALENT_PUBLIC_PATH), 'separately approved Hero 15 Talent consumer must enter the public artifact');
  assert.deepEqual(JSON.parse(await readFile(join(output, HERO_15_TALENT_PUBLIC_PATH), 'utf8')).talent.starDescriptions.map(({star,skillId})=>[star,skillId]), [[3,3212],[4,3214],[5,3216],[6,3218]]);
  assert.ok(built.files.some((file) => file.path === HERO_16_MINIMAL_DETAIL_PATH), 'approved Hero 16 Minimal Detail must enter the public artifact');
  assert.ok(built.files.some((file) => file.path === HERO_MINIMAL_DETAIL_BATCH_PATH), 'approved five-Hero Minimal Detail batch must enter the public artifact');
  assert.ok(built.files.some((file) => file.path === HERO_MINIMAL_DETAIL_TEN_BATCH_PATH), 'approved ten-Hero Minimal Detail batch must enter the public artifact');
  assert.ok(built.files.some((file) => file.path === HERO_MINIMAL_DETAIL_TWENTY_BATCH_PATH), 'approved twenty-Hero Minimal Detail batch must enter the public artifact');
  assert.ok(built.files.some((file) => file.path === HERO_MINIMAL_DETAIL_THIRTY_BATCH_PATH), 'approved thirty-Hero Minimal Detail batch must enter the public artifact');
  assert.ok(built.files.some((file) => file.path === HERO_MINIMAL_DETAIL_THIRTY_ONE_BATCH_PATH), 'approved thirty-one-Hero Minimal Detail batch must enter the public artifact');
  assert.deepEqual(heroMinimalDetailThirtyOneBatchConsumer.heroes.map(({ heroId }) => heroId), [99164,99165,99166,99167,99168,99169,99170,99171,99172,99173,99174,99175,99176,99177,99178,99179,99180,99181,99182,99183,99184,99185,99186,99187,99188,99189,99190,99191,99192,99193,99197]);
  assert.equal(heroMinimalDetailFortyBatchConsumer.heroes.length, 40);
  assert.deepEqual(heroMinimalDetailThirtyBatchConsumer.heroes.map(({ heroId }) => heroId), [101,102,103,104,105,106,108,109,110,111,112,113,114,115,116,118,119,120,121,122,123,124,125,126,127,129,130,99161,99162,99163]);
  assert.deepEqual(heroMinimalDetailTenBatchConsumer.heroes.map(({ heroId }) => heroId), [31,34,35,36,38,39,49,51,54,57]);
  assert.deepEqual(heroMinimalDetailTwentyBatchConsumer.heroes.map(({ heroId }) => heroId), [58,59,61,62,63,64,65,66,87,88,91,92,93,94,95,96,97,98,99,100]);
  assert.ok(publicSitePaths(heroes, fullDetailPublicationDecision, decision, skinAssetPaths, exclusiveHeroDecision, hero15IntegratedDecision, hero16IntegratedDecision, heroMinimalDetailBatchDecision, heroMinimalDetailTenBatchDecision, heroMinimalDetailTwentyBatchDecision, heroMinimalDetailThirtyBatchDecision).includes(heroIndexPath), 'Hero Index must be explicitly allowlisted');
  assert.deepEqual(JSON.parse(await readFile(join(output, heroIndexPath), 'utf8')), heroIndex, 'packaged Hero Index must match the validated consumer');
  assert.equal(heroIndex.heroes.length, 267);
  assert.ok(heroIndex.heroes.every((row) => JSON.stringify(Object.keys(row).sort()) === '["heroId","nameKo"]'));
  assert.ok(built.files.some(file => file.path === skinConsumerPath), 'approved Skin Generated consumer must enter the public artifact');
  assert.ok(publicSitePaths(heroes, fullDetailPublicationDecision, decision, skinAssetPaths).includes(skinConsumerPath), 'Frozen M03 consumer compatibility artifact must remain published');
  assert.ok(publicSitePaths(heroes, fullDetailPublicationDecision, decision, skinAssetPaths).includes(publicConsumerPath), 'approved generic Skin consumer must be published');
  assert.ok(built.files.some((file) => file.path === HERO_MINIMAL_DETAIL_FORTY_BATCH_PATH), 'approved forty-Hero consumer must be included in the public artifact');
  assert.deepEqual(JSON.parse(await readFile(join(output, HERO_MINIMAL_DETAIL_FORTY_BATCH_PATH), 'utf8')).heroes.map(({ heroId }) => heroId), HERO_MINIMAL_DETAIL_FORTY_BATCH.map(({ heroId }) => heroId), 'published forty-Hero consumer must preserve the exact approved population');
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
  assert.ok(!built.files.some((file) => file.path === 'evidence/assets/skin-fullart-m06.v1.json'), 'M06 internal Asset Evidence must remain private');
  assert.ok(built.files.some((file) => file.path === 'assets/skin-admissions/m05-d/skin-601.webp'), 'Publication-approved Skin 601 must be included from its exact manifest path');
  for (const id of [602, 603, 604, 605, 606]) {
    const path = `assets/skin-admissions/m06/skin-${id}.webp`;
    assert.ok(built.files.some((file) => file.path === path), `Publication-approved M06 Skin ${id} must be included from its exact manifest path`);
    assert.deepEqual(await readFile(join(output, path)), await readFile(path), `published M06 Skin ${id} bytes must match admitted Asset`);
  }
  await assert.rejects(buildSite({ outputDir: output }), /EEXIST/);
  const validate = (record = decision, canonical = heroes) => validatePublicSiteDirectory(output, canonical, fullDetailPublicationDecision, record, process.cwd(), exclusiveHeroDecision, hero15IntegratedDecision, hero16IntegratedDecision, heroMinimalDetailBatchDecision, heroMinimalDetailTenBatchDecision, heroMinimalDetailTwentyBatchDecision, heroMinimalDetailThirtyBatchDecision, heroMinimalDetailThirtyOneBatchDecision, heroMinimalDetailFortyBatchDecision);
  await rm(join(output, skinConsumerPath));
  await assert.rejects(validate(), /allowlist mismatch/);
  await copyFile(skinConsumerPath, join(output, skinConsumerPath));
  await rm(join(output, heroIndexPath));
  await assert.rejects(validate(), /allowlist mismatch/);
  await copyFile(heroIndexPath, join(output, heroIndexPath));
  await rm(join(output, HERO_15_MINIMAL_DETAIL_PATH));
  await assert.rejects(validate(), /allowlist mismatch/);
  await copyFile(HERO_15_MINIMAL_DETAIL_PATH, join(output, HERO_15_MINIMAL_DETAIL_PATH));
  await rm(join(output, HERO_15_TALENT_PUBLIC_PATH));
  await assert.rejects(validate(), /allowlist mismatch/);
  await copyFile(HERO_15_TALENT_PUBLIC_PATH, join(output, HERO_15_TALENT_PUBLIC_PATH));
  await writeFile(join(output, HERO_15_TALENT_PUBLIC_PATH), '{}');
  await assert.rejects(validate(), /bytes differ.*hero-15-talent-public/);
  await copyFile(HERO_15_TALENT_PUBLIC_PATH, join(output, HERO_15_TALENT_PUBLIC_PATH));
  await rm(join(output, HERO_16_MINIMAL_DETAIL_PATH));
  await assert.rejects(validate(), /allowlist mismatch/);
  await copyFile(HERO_16_MINIMAL_DETAIL_PATH, join(output, HERO_16_MINIMAL_DETAIL_PATH));
  await rm(join(output, HERO_MINIMAL_DETAIL_BATCH_PATH));
  await assert.rejects(validate(), /allowlist mismatch/);
  await copyFile(HERO_MINIMAL_DETAIL_BATCH_PATH, join(output, HERO_MINIMAL_DETAIL_BATCH_PATH));
  await writeFile(join(output, HERO_MINIMAL_DETAIL_BATCH_PATH), '{}');
  await assert.rejects(validate(), /bytes differ.*hero-minimal-detail-batch/);
  await copyFile(HERO_MINIMAL_DETAIL_BATCH_PATH, join(output, HERO_MINIMAL_DETAIL_BATCH_PATH));
  await writeFile(join(output, HERO_16_MINIMAL_DETAIL_PATH), '{}');
  await assert.rejects(validate(), /bytes differ.*hero-minimal-detail-16\.v1\.json/);
  await copyFile(HERO_16_MINIMAL_DETAIL_PATH, join(output, HERO_16_MINIMAL_DETAIL_PATH));
  await writeFile(join(output, HERO_15_MINIMAL_DETAIL_PATH), '{}');
  await assert.rejects(validate(), /bytes differ.*hero-minimal-detail\.v1\.json/);
  await copyFile(HERO_15_MINIMAL_DETAIL_PATH, join(output, HERO_15_MINIMAL_DETAIL_PATH));
  await writeFile(join(output, heroIndexPath), '{}');
  await assert.rejects(validate(), /bytes differ.*hero-index\.v1\.json/);
  await copyFile(heroIndexPath, join(output, heroIndexPath));
  await writeFile(join(output, skinConsumerPath), '{}');
  await assert.rejects(validate(), /bytes differ.*generated\/skin-consumer\.v1\.json/);
  await copyFile(skinConsumerPath, join(output, skinConsumerPath));
  await validate();
  const expandedCanonical = structuredClone(heroes);
  expandedCanonical.records = expandedCanonical.records.filter(({ id }) => id !== 15);
  expandedCanonical.records.push({ id: 15, portrait: 'assets/portraits/hero-15.png' });
  assert.deepEqual(await validate(decision, expandedCanonical), built.files,
    'an internal Hero 15 must leave the approved public file list and hashes unchanged');
  await mkdir(join(output, 'assets/portraits'), { recursive: true });
  await copyFile('assets/portraits/hero-15.png', join(output, 'assets/portraits/hero-15.png'));
  await assert.rejects(validate(decision, expandedCanonical), /allowlist mismatch/,
    'public Build validator must reject an unapproved Hero 15 portrait even when present in Canonical');
  await rm(join(output, 'assets/portraits/hero-15.png'));
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
    const heroIndexResponse = await fetch(`${origin}/${heroIndexPath}`, { cache: 'no-store' });
    assert.equal(heroIndexResponse.status, 200, 'approved Hero Index JSON URL must return HTTP 200');
    assert.deepEqual(await heroIndexResponse.json(), heroIndex, 'fetched Hero Index must contain only the exact approved ID/name consumer');
  const minimalDetailResponse = await fetch(`${origin}/${HERO_15_MINIMAL_DETAIL_PATH}`, { cache: 'no-store' });
  assert.equal(minimalDetailResponse.status, 200, 'approved Hero 15 Minimal Detail JSON URL must return HTTP 200');
  assert.equal((await minimalDetailResponse.json()).heroes[0].heroId, 15, 'public minimal detail must contain only Hero 15');
  const hero16MinimalDetailResponse = await fetch(`${origin}/${HERO_16_MINIMAL_DETAIL_PATH}`, { cache: 'no-store' });
  assert.equal(hero16MinimalDetailResponse.status, 200, 'approved Hero 16 Minimal Detail JSON URL must return HTTP 200');
  assert.equal((await hero16MinimalDetailResponse.json()).heroes[0].heroId, 16, 'public Hero 16 minimal detail must contain only Hero 16');
  const batchMinimalDetailResponse = await fetch(`${origin}/${HERO_MINIMAL_DETAIL_BATCH_PATH}`, { cache: 'no-store' });
  assert.equal(batchMinimalDetailResponse.status, 200, 'approved batch Minimal Detail JSON URL must return HTTP 200');
  assert.deepEqual((await batchMinimalDetailResponse.json()).heroes.map(({ heroId }) => heroId), [17, 18, 20, 21, 30], 'public batch must contain exactly the five approved Heroes');
  const ownerNavigationResponse = await fetch(`${origin}/${EXCLUSIVE_EQUIPMENT_HERO_NAVIGATION_PATH}`, { cache: 'no-store' });
  assert.equal(ownerNavigationResponse.status, 200, 'approved Equipment Hero Navigation JSON URL must return HTTP 200');
  assert.deepEqual(await ownerNavigationResponse.json(), JSON.parse(await readFile(EXCLUSIVE_EQUIPMENT_HERO_NAVIGATION_PATH, 'utf8')),
    'fetched Equipment Hero Navigation must match the exact approved consumer');
    for (const path of skinAssetPaths) assert.equal((await fetch(`${origin}/${path}`)).status, 200, `published Skin Fullart URL must resolve: ${path}`);
    assert.equal((await fetch(`${origin}/assets/skin-admissions/other/skin-601.webp`)).status, 404, 'unregistered admission directories must not be published');
    assert.equal((await fetch(`${origin}/generated/skin-consumer-missing.v1.json`)).status, 404, 'unknown Generated path must return HTTP 404');
    assert.equal((await fetch(`${origin}/canonical/skin-identities.v1.json`)).status, 404, 'Canonical owner files must remain outside the publication surface');
    assert.equal((await fetch(`${origin}/canonical/hero-localizations-ko.v1.json`)).status, 404, 'Hero Canonical localization must remain outside the publication surface');
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
    assert.ok(!publicSitePaths(heroes, fullDetailPublicationDecision, disabled, skinAssetPaths, exclusiveHeroDecision).includes(trainingPath));
    await assert.rejects(validate(disabled), /allowlist mismatch/);
    await rm(join(output, trainingPath));
    await validate(disabled);
    await copyFile(trainingPath, join(output, trainingPath));
  }
  const invalid = structuredClone(decision);
  invalid.contract.version = 999;
  assert.throws(() => publicSitePaths(heroes, fullDetailPublicationDecision, invalid), /contract approval\/effectiveness state mismatch/);
  await validate();
  await buildSite({ verifyDir: output });
  console.log('Public Build checks: PASS (generic approved Skin projections, registry WebP URLs, byte parity, private Evidence and allowlist negatives)');
} finally {
  await rm(temp, { recursive: true, force: true });
}
