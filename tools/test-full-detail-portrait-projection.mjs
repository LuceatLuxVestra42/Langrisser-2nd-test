import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  projectFullDetailPortraitField,
  validateFullDetailPortraitProjection,
} from './full-detail-portrait-projection-contract.mjs';

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const [canonical, generated] = await Promise.all([
  readJson('canonical/heroes.v1.json'),
  readJson('generated/hero-slice.v1.json'),
]);
assert.equal(validateFullDetailPortraitProjection({ canonical, generated }), true);

const futureFixture = structuredClone({ canonical, generated });
futureFixture.canonical.records.push({ id: 15, portrait: 'assets/portraits/hero-15.png' });
futureFixture.generated.heroes.push({ id: 15 });
assert.equal(validateFullDetailPortraitProjection({ ...futureFixture, allowPopulationExtension: true }), true,
  'a future Population Owner may add an exact Hero identity while the unapproved portrait stays omitted');

const internalHero15 = { id: 15, portrait: 'assets/portraits/hero-15.png' };
assert.deepEqual(projectFullDetailPortraitField(internalHero15), {}, 'an internal Hero 15 portrait must be omitted from the public projection');
assert.deepEqual(projectFullDetailPortraitField({ id: 991, portrait: 'assets/portraits/hero-1.png' }), {}, 'another Hero portrait must never be used as fallback');
assert.deepEqual(projectFullDetailPortraitField({ id: 15, portrait: '' }), {}, 'an unapproved empty field must remain absent');

const cases = [
  ['internal portrait promoted for Hero 15', (x) => { x.canonical.records.push(internalHero15); x.generated.heroes.push({ id: 15, portrait: internalHero15.portrait }); }],
  ['Hero 15 added before existing records', (x) => { x.canonical.records.unshift(internalHero15); x.generated.heroes.unshift({ id: 15 }); }],
  ['existing portrait omitted', (x) => { delete x.generated.heroes[0].portrait; }],
  ['existing portrait remapped', (x) => { x.generated.heroes[0].portrait = 'assets/portraits/hero-2.png'; }],
  ['existing portrait replaced with blank', (x) => { x.generated.heroes[0].portrait = ''; }],
  ['population record removed', (x) => { x.generated.heroes.pop(); }],
  ['duplicate Hero appended', (x) => { x.generated.heroes.push(structuredClone(x.generated.heroes[0])); }],
  ['canonical and generated population expanded', (x) => { x.canonical.records.push({ id: 991, portrait: 'assets/portraits/hero-991.png' }); x.generated.heroes.push({ id: 991 }); }],
];

for (const [label, mutate] of cases) {
  const fixture = structuredClone({ canonical, generated });
  mutate(fixture);
  assert.throws(() => validateFullDetailPortraitProjection(fixture), undefined, label);
}

for (const invalid of [null, {}]) {
  assert.throws(() => projectFullDetailPortraitField(invalid), undefined, 'malformed projection inputs must fail closed');
}
assert.throws(() => projectFullDetailPortraitField({ id: 1, portrait: 'assets/portraits/hero-1.jpg' }), undefined,
  'malformed portrait path for a preserved public Hero must fail closed');
assert.deepEqual(projectFullDetailPortraitField({ id: 15, portrait: 'assets/portraits/hero-1.jpg' }), {},
  'even a malformed or foreign path for an unapproved Hero remains omitted, never a fallback');

console.log('Full Detail portrait projection tests: PASS (future optional portrait fixture and 8 negative mutations rejected)');
