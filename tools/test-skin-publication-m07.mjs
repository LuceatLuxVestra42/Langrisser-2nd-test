import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { generateSkinM05G } from './generate-skin-m05-g.mjs';
import { loadM05GInputs } from './validate-skin-m05-g.mjs';
import { validateM07PublicationData, validateM07Publication } from './validate-skin-publication-m07.mjs';

const input = await loadM05GInputs();
input.root = process.cwd();
assert.equal((await validateM07Publication()).status, 'PASS');
const rejects = (mutate, pattern, label) => {
  const value = structuredClone(input);
  mutate(value);
  assert.throws(() => validateM07PublicationData(value), pattern, label);
};
rejects(v => { v.composed.skins.find(row => row.skinId === 3701).heroId = 6; }, /M05-G|composed|Skin 3701 Semantic claim/, 'wrong Hero FK');
rejects(v => { v.composed.skins.find(row => row.skinId === 3701).sourceOrder = 2; }, /M05-G|composed|Skin 3701 Semantic claim/, 'wrong Source Order');
rejects(v => { v.actualAssetDigests[3701] = '0'.repeat(64); }, /Asset hash mismatch/, 'wrong Asset digest');
rejects(v => { v.assetRegistry.records = v.assetRegistry.records.filter(row => row.skinId !== 3701); }, /Asset/, 'missing Asset Admission');
rejects(v => { v.publication.approvals = v.publication.approvals.filter(row => row.skinId !== 3701); }, /exactly one explicit Publication Approval/, 'missing approval');
rejects(v => { v.publication.approvals.push(structuredClone(v.publication.approvals.find(row => row.skinId === 3701))); }, /exactly one explicit Publication Approval/, 'duplicate approval');
rejects(v => { v.publication.approvals.find(row => row.skinId === 3701).approvedUrl = './../assets/skin-admissions/m07/skin-3701.webp'; }, /approved URL must match the admitted Asset path/, 'traversal URL');
rejects(v => { v.publication.approvals.find(row => row.skinId === 3701).semanticAdmission = 'wrong'; }, /M07-SKIN-3701/, 'wrong Semantic pointer');
rejects(v => { v.publication.approvals.find(row => row.skinId === 3701).assetAdmission = 'wrong'; }, /skinId=3701/, 'wrong Asset pointer');
rejects(v => { v.publication.approvals.find(row => row.skinId === 3701).approvalRecord = 'unapproved.md'; }, /approvalRecord|M07 Publication/, 'wrong decision record');
rejects(v => { v.publicConsumer.skins = v.publicConsumer.skins.filter(row => row.skinId !== 3701); }, /Public Consumer is not Semantic|Skin 3701 must appear/, 'missing public claim');
rejects(v => { v.publicConsumer.skins.find(row => row.skinId === 3701).heroId = 6; }, /Public Consumer is not Semantic|Skin 3701 must appear/, 'wrong public Hero mapping');
rejects(v => { v.publicAssets.assets = v.publicAssets.assets.filter(row => row.skinId !== 3701); }, /Public Asset map is not|Skin 3701 public URL/, 'missing public URL');
rejects(v => { v.publicConsumer.skins.push({ skinId: 999999, heroId: 37, sourceOrder: 2 }); }, /Public Consumer is not Semantic|adds exactly one/, 'unapproved Skin leakage');

const paths = ['generated/skin-consumer-composed-m05-g.v1.json','generated/skin-consumer-public-m05-g.v1.json','generated/skin-assets-public-m05-g.v1.json'];
const before = await Promise.all(paths.map(path => readFile(path, 'utf8')));
await generateSkinM05G();
const after = await Promise.all(paths.map(path => readFile(path, 'utf8')));
assert.deepEqual(after, before, 'M05-G outputs must be deterministic for the approved inputs');
process.stdout.write('M07 Publication negatives: PASS (14 isolated approval, FK, order, path, Evidence, Asset and leakage mutations; deterministic generation)\n');
