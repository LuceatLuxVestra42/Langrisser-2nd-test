import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { selectSkinFullarts, skinFullartPathById, sortPresentationFixture } from '../skin-fullart-presentation.mjs';

const consumer = JSON.parse(await readFile('generated/skin-consumer.v1.json', 'utf8'));
const clone = () => structuredClone(consumer);
const rejects = (mutate, pattern) => {
  const value = clone();
  mutate(value);
  assert.throws(() => selectSkinFullarts(value, 1), pattern);
};

assert.equal(selectSkinFullarts(consumer, 2).length, 0, 'other Hero receives no skins');
rejects((value) => value.skins.shift(), /population mismatch/);
rejects((value) => value.skins.push({ skinId: 106, heroId: 1, sourceOrder: 5 }), /population mismatch/);
rejects((value) => value.skins[1].skinId = 102, /duplicate/);
rejects((value) => value.skins[0].heroId = 2, /differs/);
rejects((value) => value.skins[1].sourceOrder = 1, /differs/);
rejects((value) => value.skins[0].skinId = 1002, /differs/);
rejects((value) => value.skins[0].heroId = 999, /differs/);
rejects((value) => value.skins[0].imageUrl = './assets/skins/skin-103.webp', /Malformed or duplicate/);
rejects((value) => value.skins.reverse(), /differs/);
assert.throws(() => selectSkinFullarts({ ...consumer, generatedBy: 'generator' }, 1), /schema/);
assert.throws(() => selectSkinFullarts({ schemaVersion: 2, skins: consumer.skins }, 1), /schema/);
const duplicateUrls = { ...skinFullartPathById, 103: skinFullartPathById[102] };
assert.throws(() => selectSkinFullarts(consumer, 1, duplicateUrls), /malformed or duplicated/);
const wrongPath = { ...skinFullartPathById, 102: './assets/portraits/hero-1.png' };
assert.throws(() => selectSkinFullarts(consumer, 1, wrongPath), /malformed or duplicated/);
const swappedPath = { ...skinFullartPathById, 102: skinFullartPathById[103], 103: skinFullartPathById[102] };
assert.throws(() => selectSkinFullarts(consumer, 1, swappedPath), /malformed or duplicated/);
const fixture = [{ skinId: 80, sourceOrder: 2 }, { skinId: 12, sourceOrder: 3 }, { skinId: 50, sourceOrder: 1 }];
assert.deepEqual(sortPresentationFixture(fixture).map((row) => row.skinId), [50, 80, 12]);
assert.notDeepEqual(sortPresentationFixture(fixture).map((row) => row.skinId), fixture.map((row) => row.skinId).sort((a, b) => a - b),
  'fixture proves numeric Skin ID sorting differs from admitted Source Order');
assert.throws(() => selectSkinFullarts(null, 1), /schema/);
assert.throws(() => selectSkinFullarts(consumer, '1'), /valid Hero endpoint/);

process.stdout.write('M04 Skin Fullart presentation negatives: PASS (18 failure controls; Hero isolation and non-numeric-order fixture)\n');
