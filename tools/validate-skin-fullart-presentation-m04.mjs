import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { selectSkinFullarts, skinFullartPathById } from '../skin-fullart-presentation.mjs';

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const consumer = await readJson('generated/skin-consumer.v1.json');
const manifest = await readJson('evidence/assets/skin-fullart-m04.v1.json');
const app = await readFile('app.js', 'utf8');
const helper = await readFile('skin-fullart-presentation.mjs', 'utf8');
const styles = await readFile('styles.css', 'utf8');

assert.deepEqual(Object.keys(skinFullartPathById).sort(), ['102', '103', '104', '105']);
assert.deepEqual(manifest.records.map((record) => record.skinId), [102, 103, 104, 105]);
const rows = selectSkinFullarts(consumer, 1);
assert.deepEqual(rows.map(({ skinId, heroId, sourceOrder }) => ({ skinId, heroId, sourceOrder })), consumer.skins);
assert.deepEqual(rows.map((row) => row.imageUrl), [102, 103, 104, 105].map((id) => `./assets/skins/skin-${id}.webp`));
assert.equal(selectSkinFullarts(consumer, 2).length, 0, 'no other Hero receives a Skin Fullart');
for (const row of manifest.records) {
  const bytes = await readFile(row.output.path);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), row.output.sha256, `Asset digest mismatch for ${row.skinId}`);
  assert.equal(skinFullartPathById[row.skinId], `./${row.output.path}`);
}
assert.match(app, /fetch\('\.\/generated\/skin-consumer\.v1\.json'\)/);
assert.match(app, /selectSkinFullarts\(skinConsumer, hero\.id\)/);
assert.match(app, /makeSkinFullartPresentation\(skinsByHero\.get\(hero\.id\)/);
assert.match(styles, /\.hero-skin-fullart \{[^}]*object-fit:\s*contain/s);
assert.doesNotMatch(`${app}\n${helper}`, /执事美酒|灵魂指挥|铸剑的英雄|妙想假日/);
process.stdout.write('M04 Skin Fullart presentation: PASS (consumer parity, exact URL/hash map, Hero filter, visual contract, names absent)\n');
