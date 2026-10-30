import assert from 'node:assert/strict';
import { loadM05GInputs, validateM05GData } from './validate-skin-m05-g.mjs';
import { isAllowedSkinAssetPath, skinAssetPathFromPublicUrl } from '../skin-asset-publication-contract.mjs';
import { validateM05E } from './validate-skin-publication-m05-e.mjs';

assert.deepEqual(await validateM05E(), { status: 'PASS', frozenHeroOne: 4, semantic: 5, assets: 5, publication: 5, public: 5, heroSix: 1 });
assert.equal(isAllowedSkinAssetPath('assets/skins/skin-105.webp'), true);
assert.equal(isAllowedSkinAssetPath('assets/skin-admissions/m05-d/skin-601.webp'), true);
for (const invalid of [
  '../assets/skins/skin-601.webp', '/assets/skins/skin-601.webp', 'https://example.invalid/skin-601.webp',
  'assets/skin-admissions/m05-d/../m05-d/skin-601.webp', 'assets/skin-admissions/m05-d/skin-601.png',
  'assets/evidence/skin-601.webp', 'assets/skin-admissions/m05-d/nested/skin-601.webp',
]) assert.equal(isAllowedSkinAssetPath(invalid), false, `unsafe or unsupported path must reject: ${invalid}`);
assert.equal(skinAssetPathFromPublicUrl('./assets/skin-admissions/m05-d/skin-601.webp'), 'assets/skin-admissions/m05-d/skin-601.webp');
assert.equal(skinAssetPathFromPublicUrl('https://example.invalid/skin-601.webp'), null);

const baseline = await loadM05GInputs();
const rejects = (label, mutate, pattern) => {
  const input = structuredClone(baseline);
  mutate(input);
  assert.throws(() => validateM05GData(input), pattern, label);
};
const publication601 = (input) => input.publication.approvals.find((row) => row.skinId === 601);
rejects('Semantic Admission missing', (v) => { v.admissions.admissions = []; }, /Asset has no admitted Semantic|does not match Owner inputs/);
rejects('Asset Admission missing', (v) => { v.assetRegistry.records = v.assetRegistry.records.filter((row) => row.skinId !== 601); }, /Publication approval has no Asset/);
rejects('duplicate Publication Approval', (v) => { v.publication.approvals.push(structuredClone(publication601(v))); }, /duplicate Publication approval/);
rejects('manifest and public URL differ', (v) => { publication601(v).approvedUrl = './assets/skins/skin-601.webp'; }, /differs from admitted Asset path/);
rejects('path traversal', (v) => { publication601(v).approvedUrl = './../assets/skin-admissions/m05-d/skin-601.webp'; }, /supported Asset paths/);
rejects('absolute path', (v) => { publication601(v).approvedUrl = '/assets/skin-admissions/m05-d/skin-601.webp'; }, /supported Asset paths/);
rejects('external URL', (v) => { publication601(v).approvedUrl = 'https://example.invalid/skin-601.webp'; }, /supported Asset paths/);
rejects('wrong extension', (v) => { publication601(v).approvedUrl = './assets/skin-admissions/m05-d/skin-601.png'; }, /supported Asset paths/);
rejects('unsupported directory', (v) => { publication601(v).approvedUrl = './assets/private/skin-601.webp'; }, /supported Asset paths/);
rejects('unregistered nested path', (v) => { publication601(v).approvedUrl = './assets/skin-admissions/m05-d/private/skin-601.webp'; }, /supported Asset paths/);
rejects('asset digest mismatch', (v) => { v.actualAssetDigests[601] = '0'.repeat(64); }, /Asset hash mismatch/);
rejects('wrong public URL map', (v) => { v.publicAssets.assets.find((row) => row.skinId === 601).imageUrl = './assets/skins/skin-601.webp'; }, /Public Asset map is not/);
rejects('public Consumer leakage without valid intersection', (v) => { v.publicConsumer.skins = v.publicConsumer.skins.filter((row) => row.skinId !== 601); }, /Public Consumer is not/);
rejects('M04 URL mutation', (v) => { v.publication.approvals.find((row) => row.skinId === 102).approvedUrl = './assets/skins/skin-103.webp'; }, /URL|differs from admitted Asset path/);
rejects('missing semantic approval reference', (v) => { delete publication601(v).semanticAdmission; }, /both Semantic and Asset Admission/);
rejects('missing asset approval reference', (v) => { delete publication601(v).assetAdmission; }, /both Semantic and Asset Admission/);

process.stdout.write('M05-E failure controls: PASS (17 isolated publication, exact path, intersection, digest, and provenance mutations)\n');
