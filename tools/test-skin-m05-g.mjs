import assert from 'node:assert/strict';
import { loadM05GInputs, validateM05GData } from './validate-skin-m05-g.mjs';
import { generateSkinM05G } from './generate-skin-m05-g.mjs';
import { readFile } from 'node:fs/promises';

const input = await loadM05GInputs();
const baselineResult = validateM05GData(input);
assert.equal(baselineResult.status, 'PASS');
assert.equal(baselineResult.frozen, 4);
assert.ok(baselineResult.composed >= 5, 'composed Consumer must retain the Frozen + M05-C baseline');
assert.ok(baselineResult.assets >= 5, 'Asset Registry must retain the M04 + M05-D baseline');
assert.ok(baselineResult.published >= 5, 'publication must retain the M04 + M05-E baseline');
for (const row of input.assetRegistry.records.filter((row) => [102, 103, 104, 105, 601].includes(row.skinId))) {
  assert.equal(row.admissionStatus, 'APPROVED', `M04/M05 baseline Asset ${row.skinId} must remain approved`);
}
for (const row of input.publication.approvals.filter((row) => [102, 103, 104, 105, 601].includes(row.skinId))) {
  assert.equal(row.status, 'APPROVED', `M04/M05 baseline Publication ${row.skinId} must remain approved`);
}
for (const skinId of [102, 103, 104, 105, 601]) {
  assert.ok(input.publicConsumer.skins.some((row) => row.skinId === skinId), `baseline public Consumer ${skinId} must remain`);
  assert.ok(input.publicAssets.assets.some((row) => row.skinId === skinId), `baseline public URL ${skinId} must remain`);
}
assert.equal(input.publicAssets.assets.find((row) => row.skinId === 601).imageUrl, './assets/skin-admissions/m05-d/skin-601.webp');
const generatedBefore = await Promise.all([
  readFile('generated/skin-consumer-composed-m05-g.v1.json', 'utf8'),
  readFile('generated/skin-consumer-public-m05-g.v1.json', 'utf8'),
  readFile('generated/skin-assets-public-m05-g.v1.json', 'utf8'),
]);
await generateSkinM05G();
const generatedAfter = await Promise.all([
  readFile('generated/skin-consumer-composed-m05-g.v1.json', 'utf8'),
  readFile('generated/skin-consumer-public-m05-g.v1.json', 'utf8'),
  readFile('generated/skin-assets-public-m05-g.v1.json', 'utf8'),
]);
assert.deepEqual(generatedAfter, generatedBefore, 'same inputs must produce byte-identical projections');
const rejects = (mutate, pattern) => {
  const value = structuredClone(input); mutate(value); assert.throws(() => validateM05GData(value), pattern);
};
rejects((v) => v.composed.skins.push(v.composed.skins[0]), /does not match Owner inputs/);
rejects((v) => { v.composed.skins[0].heroId = 999; }, /does not match Owner inputs/);
rejects((v) => { v.admissions.admissions[0].order.records[0].sourceOrder = 2; }, /strictly equal|duplicate Source Order|does not match Owner inputs/);
rejects((v) => { v.assetRegistry.records.push(v.assetRegistry.records[0]); }, /duplicate Asset Registry/);
rejects((v) => { v.publication.approvals.pop(); }, /Public Consumer is not Semantic/);
rejects((v) => { v.publication.approvals[0].approvedUrl = v.publication.approvals[1].approvedUrl; }, /URL/);
rejects((v) => { v.publication.approvals.find((row) => row.skinId === 601).approvedUrl = './../assets/skins/skin-601.webp'; }, /supported Asset paths|URL/);
rejects((v) => { v.publication.approvals.find((row) => row.skinId === 601).approvedUrl = './assets/skins/skin-601.webp'; }, /differs from admitted Asset path/);
rejects((v) => { v.publication.approvals.find((row) => row.skinId === 601).approvedUrl = 'https://example.invalid/skin-601.webp'; }, /supported Asset paths|URL/);
rejects((v) => { v.assetRegistry.records[0].admissionStatus = 'PROPOSED'; }, /APPROVED/);
rejects((v) => { v.actualAssetDigests[102] = '0'.repeat(64); }, /Asset hash mismatch/);
rejects((v) => { v.frozenIdentity.records.push(v.frozenIdentity.records[0]); }, /Frozen scope drift/);
rejects((v) => { v.m03Consumer.skins[0].sourceOrder = 99; }, /M03 frozen public consumer changed/);
rejects((v) => { v.publicConsumer.skins[0].skinId = 601; }, /Public Consumer is not Semantic/);
rejects((v) => { v.admissions.admissions[0].status = 'REVIEW'; }, /does not match Owner inputs/);
process.stdout.write('M05-G failure controls: PASS (14 isolated mutations; frozen/public boundaries, manifest paths and approval intersection)\n');
