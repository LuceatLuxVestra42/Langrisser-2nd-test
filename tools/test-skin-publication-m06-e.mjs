import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { generateSkinM05G } from './generate-skin-m05-g.mjs';
import { loadM05GInputs } from './validate-skin-m05-g.mjs';
import { validateM06EData } from './validate-skin-publication-m06-e.mjs';

const input = await loadM05GInputs();
assert.equal(validateM06EData(input).status, 'PASS');
const rejects = (mutate, pattern, label) => {
  const value = structuredClone(input);
  mutate(value);
  assert.throws(() => validateM06EData(value), pattern, label);
};
rejects((v) => { v.publication.approvals.find((r) => r.skinId === 602).approvedUrl = './../assets/skin-admissions/m06/skin-602.webp'; }, /supported Asset paths|URL/,
  'path traversal must be rejected');
rejects((v) => { v.publication.approvals.find((r) => r.skinId === 603).approvedUrl = '/assets/skin-admissions/m06/skin-603.webp'; }, /supported Asset paths|URL/,
  'absolute URL path must be rejected');
rejects((v) => { v.publication.approvals.find((r) => r.skinId === 604).approvedUrl = 'https://example.invalid/skin-604.webp'; }, /supported Asset paths|URL/,
  'external URL must be rejected');
rejects((v) => { v.publication.approvals.find((r) => r.skinId === 605).approvedUrl = './assets/skin-admissions/m06/skin-605.png'; }, /supported Asset paths|URL/,
  'wrong extension must be rejected');
rejects((v) => { v.publication.approvals.find((r) => r.skinId === 606).approvedUrl = './assets/skin-admissions/other/skin-606.webp'; }, /differs from admitted Asset path/,
  'unapproved directory/path must be rejected');
rejects((v) => { v.publication.approvals.find((r) => r.skinId === 602).approvedUrl = './assets/skin-admissions/m06/skin-603.webp'; }, /differs from admitted Asset path/,
  'cross-Skin image mapping must be rejected');
rejects((v) => { v.publication.approvals.find((r) => r.skinId === 603).semanticAdmission = 'canonical/skin-admission-registry-m05-g.v1.json#admissions/M06-SKIN-602'; }, /M06-SKIN-603/,
  'wrong Semantic Admission pointer must be rejected');
rejects((v) => { v.publication.approvals.find((r) => r.skinId === 604).assetAdmission = 'canonical/skin-asset-registry-m05-g.v1.json#records/skinId=603'; }, /skinId=604/,
  'wrong Asset Admission pointer must be rejected');
rejects((v) => { v.publication.approvals.find((r) => r.skinId === 605).approvalRecord = 'unapproved-record.md'; }, /m06-hero6-skin-fullart-expansion/,
  'missing owner record must be rejected');
rejects((v) => { v.publication.approvals = v.publication.approvals.filter((r) => r.skinId !== 603); }, /Public Consumer is not Semantic/,
  'missing approval/public projection must be rejected');
rejects((v) => { v.publication.approvals.push(structuredClone(v.publication.approvals.find((r) => r.skinId === 602))); }, /duplicate Publication approval/,
  'duplicate approval must be rejected');
rejects((v) => { v.actualAssetDigests[604] = '0'.repeat(64); }, /Asset hash mismatch 604/,
  'binary digest mismatch must be rejected');
rejects((v) => { v.publicConsumer.skins.find((r) => r.skinId === 605).sourceOrder = 2; }, /Public Consumer is not Semantic/,
  'wrong order must be rejected');
rejects((v) => { v.publicConsumer.skins.push({ skinId: 9999, heroId: 6, sourceOrder: 7 }); }, /Public Consumer is not Semantic/,
  'unapproved extra Skin must be rejected');
rejects((v) => { v.assetRegistry.records.find((r) => r.skinId === 602).admissionStatus = 'NOT_APPROVED'; }, /Asset/,
  'non-approved Asset must not publish');

const before = await Promise.all([
  readFile('generated/skin-consumer-composed-m05-g.v1.json', 'utf8'),
  readFile('generated/skin-consumer-public-m05-g.v1.json', 'utf8'),
  readFile('generated/skin-assets-public-m05-g.v1.json', 'utf8'),
]);
await generateSkinM05G();
const after = await Promise.all([
  readFile('generated/skin-consumer-composed-m05-g.v1.json', 'utf8'),
  readFile('generated/skin-consumer-public-m05-g.v1.json', 'utf8'),
  readFile('generated/skin-assets-public-m05-g.v1.json', 'utf8'),
]);
assert.deepEqual(after, before, 'M05-G projections must be deterministic for the approved input set');
process.stdout.write('M06-E publication negative controls: PASS (14 isolated mutations; approval intersection, exact URL paths, claim pointers, source order, bytes, and determinism)\n');
