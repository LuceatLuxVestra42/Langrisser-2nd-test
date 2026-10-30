import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { selectSkinFullarts } from '../skin-fullart-presentation.mjs';

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const frozen = await readJson('generated/skin-consumer.v1.json');
const consumer = await readJson('generated/skin-consumer-public-m05-g.v1.json');
const publicAssets = await readJson('generated/skin-assets-public-m05-g.v1.json');
const manifest = await readJson('evidence/assets/skin-fullart-m04.v1.json');
const app = await readFile('app.js', 'utf8');
const presentation = await readFile('skin-fullart-presentation.mjs', 'utf8');
const styles = await readFile('styles.css', 'utf8');
const frozenRows = [
  { skinId: 102, heroId: 1, sourceOrder: 1 }, { skinId: 103, heroId: 1, sourceOrder: 2 },
  { skinId: 104, heroId: 1, sourceOrder: 3 }, { skinId: 105, heroId: 1, sourceOrder: 4 },
];
assert.deepEqual(frozen.skins, frozenRows, 'M03 Frozen Consumer must remain unchanged');
assert.deepEqual(consumer.skins, frozenRows, 'M04 public Skin population remains approved four');
assert.deepEqual(manifest.records.map((row) => row.skinId), [102, 103, 104, 105], 'M04 Asset admission remains frozen');
const rows = selectSkinFullarts(consumer, 1, publicAssets);
assert.deepEqual(rows.map(({ skinId, heroId, sourceOrder }) => ({ skinId, heroId, sourceOrder })), frozenRows);
assert.equal(selectSkinFullarts(consumer, 6, publicAssets).length, 0);
for (const record of manifest.records) {
  const bytes = await readFile(record.output.path);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), record.output.sha256);
  assert.ok(publicAssets.assets.some((asset) => asset.skinId === record.skinId && asset.imageUrl === `./${record.output.path}`));
}
assert.match(app, /fetch\('\.\/generated\/skin-consumer-public-m05-g\.v1\.json'\)/);
assert.match(app, /fetch\('\.\/generated\/skin-assets-public-m05-g\.v1\.json'\)/);
assert.match(app, /selectSkinFullarts\(skinConsumer, hero\.id, skinPublicAssets\)/);
assert.match(presentation, /sort\(\(left, right\) => left\.sourceOrder - right\.sourceOrder\)/);
assert.match(styles, /\.hero-skin-fullart \{[^}]*object-fit:\s*contain/s);
assert.doesNotMatch(`${app}\n${presentation}`, /执事美酒|灵魂指挥|铸剑的英雄|妙想假日|601/);
process.stdout.write('M04 presentation regression: PASS (four Frozen visible rows, generic public contract, asset digest and UI boundaries)\n');
