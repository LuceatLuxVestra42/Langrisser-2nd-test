import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateHero15PortraitAdmission } from './validate-hero-15-portrait-admission.mjs';

const evidence = JSON.parse(await readFile('evidence/source/portraits/hero-portrait-hero15.v1.json', 'utf8'));
const assetBytes = await readFile(evidence.asset.path);
await validateHero15PortraitAdmission(process.cwd(), { evidence, assetBytes });
let count = 0;
async function rejects(mutator, label) {
  let copy = structuredClone(evidence);
  let bytes = Buffer.from(assetBytes);
  ({ evidence: copy, assetBytes: bytes } = mutator(copy, bytes) ?? { evidence: copy, assetBytes: bytes });
  await assert.rejects(validateHero15PortraitAdmission(process.cwd(), { evidence: copy, assetBytes: bytes }), undefined, label);
  count++;
}
const cases = [
  ['Hero ID changed', e => { e.source.heroInfo.fields.ID = 16; }],
  ['CharImage ID inferred/mislinked', e => { e.source.heroInfo.fields.CharImage_ID = 16; }],
  ['HeroPainting changed', e => { e.source.charImageInfo.fields.HeroPainting = 'UI/HeroPainting/other.prefab'; }],
  ['source commit changed', e => { e.source.commit = '0'.repeat(40); }],
  ['source tree changed', e => { e.source.tree = '0'.repeat(40); }],
  ['HeroInfo blob changed', e => { e.source.heroInfo.gitBlobSha1 = '0'.repeat(40); }],
  ['CharImageInfo blob changed', e => { e.source.charImageInfo.gitBlobSha1 = '0'.repeat(40); }],
  ['HeroInfo locator polluted', e => { e.source.heroInfo.recordIndex = 15; }],
  ['CharImage record locator polluted', e => { e.source.charImageInfo.locator += '/wrong'; }],
  ['Prefab object ID changed', e => { e.predecessorExtraction.record.prefabPathId = '15'; }],
  ['Sprite object ID changed', e => { e.predecessorExtraction.record.spritePathId = '15'; }],
  ['Texture object ID changed', e => { e.predecessorExtraction.record.texturePathIds[0] = '15'; }],
  ['Bundle provenance changed', e => { e.predecessorExtraction.record.bundleSha256 = '0'.repeat(64); }],
  ['Package provenance changed', e => { e.predecessorExtraction.record.packageName = 'other.zip'; }],
  ['PNG evidence hash changed', e => { e.asset.sha256 = '0'.repeat(64); }],
  ['PNG source Git blob changed', e => { e.asset.sourceGitBlobSha1 = '0'.repeat(40); }],
  ['PNG signature metadata changed', e => { e.asset.pngSignatureHex = '0000000000000000'; }],
  ['PNG dimensions changed', e => { e.asset.width = 1; }],
  ['other hero asset substituted', e => { e.asset.sourcePath = 'public/images/heroes/cards/6.png'; }],
  ['skin preview substituted', e => { e.asset.sourcePath = 'public/images/heroes/portrait-samples/15.webp'; }],
  ['evidence removed', e => { e.source = {}; }],
  ['path traversal', e => { e.asset.path = '../../public/images/heroes/cards/15.png'; }],
  ['publication status raised', e => { e.publicationApproved = true; }],
  ['Unity provenance limitation removed', e => { e.predecessorExtraction.limitations = []; }],
];
for (const [label, mutate] of cases) await rejects((e, b) => { mutate(e, b); return { evidence: e, assetBytes: b }; }, label);
await rejects((e, b) => { const changed = Buffer.from(b); changed[30] ^= 0xff; return { evidence: e, assetBytes: changed }; }, 'PNG bytes corrupted');
await rejects((e, b) => ({ evidence: e, assetBytes: Buffer.concat([b, Buffer.from([0])]) }), 'PNG trailing byte mutation');
const canonical = JSON.parse(await readFile('canonical/heroes.v1.json', 'utf8'));
const expanded = structuredClone(canonical); expanded.records.push({ id: 15, portrait: 'assets/portraits/hero-15.png' });
await assert.rejects(validateHero15PortraitAdmission(process.cwd(), { evidence, assetBytes, canonical: expanded }), /29 population/); count++;
const generated = JSON.parse(await readFile('generated/hero-slice.v1.json', 'utf8'));
const expandedGenerated = structuredClone(generated); expandedGenerated.heroes.push({ id: 15 });
await assert.rejects(validateHero15PortraitAdmission(process.cwd(), { evidence, assetBytes, generated: expandedGenerated }), /29 population/); count++;
process.stdout.write(`Hero 15 portrait admission negative tests: PASS (${count} rejection cases)\n`);
