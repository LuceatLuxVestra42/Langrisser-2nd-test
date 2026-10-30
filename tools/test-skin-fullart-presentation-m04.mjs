import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { selectSkinFullarts, sortPresentationFixture } from '../skin-fullart-presentation.mjs';

const consumer = JSON.parse(await readFile('generated/skin-consumer-public-m05-g.v1.json', 'utf8'));
const assets = JSON.parse(await readFile('generated/skin-assets-public-m05-g.v1.json', 'utf8'));
const clone = () => structuredClone(consumer);
const cloneAssets = () => structuredClone(assets);
const rejects = (mutateConsumer, mutateAssets, pattern) => {
  const c = clone(), a = cloneAssets(); mutateConsumer?.(c); mutateAssets?.(a);
  assert.throws(() => selectSkinFullarts(c, 1, a), pattern);
};
// Hero 6 publication is validated by the M05-E owner; this test retains the M04 Hero 1 contract.
rejects((v) => v.skins.push(v.skins[0]), null, /duplicate/);
const wrongHero = clone(); wrongHero.skins[0].heroId = 6;
assert.equal(selectSkinFullarts(wrongHero, 1, assets).length, 3, 'wrong-Hero row is never shown on Hero 1');
const reversed = { schemaVersion: 1, skins: [...consumer.skins].reverse() };
assert.deepEqual(selectSkinFullarts(reversed, 1, assets).map((row) => row.skinId), [102, 103, 104, 105], 'presentation preserves Source Order, independent of input order');
rejects(null, (v) => { v.assets[0].skinId = 601; }, /Malformed|duplicate/);
rejects(null, (v) => { v.assets[0].imageUrl = './assets/portraits/hero-1.png'; }, /Malformed|duplicate/);
rejects(null, (v) => { v.assets[1].imageUrl = v.assets[0].imageUrl; }, /Malformed|duplicate/);
const noPublishedAsset = { schemaVersion: 1, assets: assets.assets.slice(0, 3) };
assert.equal(selectSkinFullarts(consumer, 1, noPublishedAsset).length, 3, 'a Semantic row without a public Asset is safely omitted');
const shuffled = { schemaVersion: 1, skins: [...consumer.skins].reverse() };
assert.deepEqual(selectSkinFullarts(shuffled, 1, assets).map((row) => row.skinId), [102, 103, 104, 105]);
const orderFixture = [{ skinId: 80, sourceOrder: 2 }, { skinId: 12, sourceOrder: 3 }, { skinId: 50, sourceOrder: 1 }];
assert.deepEqual(sortPresentationFixture(orderFixture).map((r) => r.skinId), [50, 80, 12]);
assert.notDeepEqual(sortPresentationFixture(orderFixture).map((r) => r.skinId), [12, 50, 80]);
const withUnmappedAsset = { schemaVersion: 1, skins: [...consumer.skins, { skinId: 9999, heroId: 6, sourceOrder: 2 }] };
const heroSixWithUnmapped = selectSkinFullarts(withUnmappedAsset, 6, assets);
assert.equal(heroSixWithUnmapped.length, consumer.skins.filter((row) => row.heroId === 6).length,
  'a Semantic row without a Publication Asset mapping stays hidden');
assert.ok(!heroSixWithUnmapped.some((row) => row.skinId === 9999), 'unmapped SkinID must not be exposed');
process.stdout.write('M04 presentation regression: PASS (10 cases; frozen Hero 1 rows, per-Hero order, publication filtering, no fallback)\n');
