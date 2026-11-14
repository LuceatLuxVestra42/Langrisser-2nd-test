import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  FULL_DETAIL_PORTRAIT_PROJECTION_CONTRACT,
  projectFullDetailPortraitField,
  validateFullDetailPortraitProjection,
} from './full-detail-portrait-projection-contract.mjs';
import { HERO_INDEX_PUBLICATION_PATH } from './full-detail-public-population-contract.mjs';

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const [canonical, generated, publicationDecision] = await Promise.all([
  readJson('canonical/heroes.v1.json'),
  readJson('generated/hero-slice.v1.json'),
  readJson(HERO_INDEX_PUBLICATION_PATH),
]);
assert.equal(validateFullDetailPortraitProjection({ canonical, generated, publicationDecision }), true);
assert.equal(FULL_DETAIL_PORTRAIT_PROJECTION_CONTRACT.populationMigrationRequiresPortraitPublicationApproval, false,
  'Portrait public approval must not be coupled to Population Migration approval');
assert.equal(FULL_DETAIL_PORTRAIT_PROJECTION_CONTRACT.publicPortraitExposureRequiresPublicationApproval, true,
  'public Portrait exposure remains gated by its own approval');
assert.equal(FULL_DETAIL_PORTRAIT_PROJECTION_CONTRACT.canonicalPortraitReferenceRequiresOwnerAdmission, true,
  'decoupling publication must not bypass Canonical field admission');

const futureFixture = structuredClone({ canonical, generated, publicationDecision });
futureFixture.canonical.records.push({ id: 15, portrait: 'assets/portraits/hero-15.png' });
assert.equal(futureFixture.canonical.records.length, 30);
assert.equal(futureFixture.generated.heroes.length, 29);
assert.throws(() => validateFullDetailPortraitProjection(futureFixture), /population must remain exactly 29/);
assert.equal(validateFullDetailPortraitProjection({ ...futureFixture, allowPopulationExtension: true }), true,
  'an internal Hero 15 record must leave the 29 approved IDs, order and portraits unchanged');

const internalHero15 = { id: 15, portrait: 'assets/portraits/hero-15.png' };
assert.deepEqual(projectFullDetailPortraitField(internalHero15), {}, 'an internal Hero 15 portrait must be omitted from the public projection');
assert.deepEqual(projectFullDetailPortraitField({ id: 991, portrait: 'assets/portraits/hero-1.png' }), {}, 'another Hero portrait must never be used as fallback');
assert.deepEqual(projectFullDetailPortraitField({ id: 15, portrait: '' }), {}, 'an unapproved empty field must remain absent');

const cases = [
  ['internal portrait promoted for Hero 15', (x) => { x.canonical.records.push(internalHero15); x.generated.heroes.push({ id: 15, portrait: internalHero15.portrait }); }],
  ['Hero 15 added before existing records', (x) => { x.canonical.records.unshift(internalHero15); x.generated.heroes.unshift({ id: 15 }); }],
  ['unapproved portrait substituted into an approved Hero', (x) => { x.generated.heroes[0].portrait = internalHero15.portrait; }],
  ['approved Hero order changed', (x) => { x.generated.heroes.reverse(); }],
  ['approved Canonical Hero removed', (x) => { x.canonical.records.pop(); }],
  ['Canonical Hero duplicated', (x) => { x.canonical.records.push(x.canonical.records[0]); }],
  ['existing portrait omitted', (x) => { delete x.generated.heroes[0].portrait; }],
  ['existing portrait remapped', (x) => { x.generated.heroes[0].portrait = 'assets/portraits/hero-2.png'; }],
  ['existing portrait replaced with blank', (x) => { x.generated.heroes[0].portrait = ''; }],
  ['population record removed', (x) => { x.generated.heroes.pop(); }],
  ['duplicate Hero appended', (x) => { x.generated.heroes.push(structuredClone(x.generated.heroes[0])); }],
  ['canonical and generated population expanded', (x) => { x.canonical.records.push({ id: 991, portrait: 'assets/portraits/hero-991.png' }); x.generated.heroes.push({ id: 991 }); }],
];

for (const [label, mutate] of cases) {
  const fixture = structuredClone({ canonical, generated, publicationDecision });
  mutate(fixture);
  assert.throws(() => validateFullDetailPortraitProjection({ ...fixture, allowPopulationExtension: true }), undefined, label);
}

for (const invalid of [null, {}]) {
  assert.throws(() => projectFullDetailPortraitField(invalid), undefined, 'malformed projection inputs must fail closed');
}
assert.throws(() => projectFullDetailPortraitField({ id: 1, portrait: 'assets/portraits/hero-1.jpg' }), undefined,
  'malformed portrait path for a preserved public Hero must fail closed');
assert.deepEqual(projectFullDetailPortraitField({ id: 15, portrait: 'assets/portraits/hero-1.jpg' }), {},
  'even a malformed or foreign path for an unapproved Hero remains omitted, never a fallback');

console.log(`Full Detail portrait projection tests: PASS (29/29, 30/29, ${cases.length} negative mutations)`);
