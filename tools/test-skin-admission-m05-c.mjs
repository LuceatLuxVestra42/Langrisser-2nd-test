import assert from 'node:assert/strict';
import { loadM05CInputs, validateM05C, assertPerHeroOrderUniqueness } from './validate-skin-admission-m05-c.mjs';

const base = await loadM05CInputs();
assert.deepEqual(validateM05C(base), { status: 'PASS', frozenPopulation: 4, internalPopulation: 5, publicPopulation: 4, newSkinId: 601 });

const clone = (value) => JSON.parse(JSON.stringify(value));
const rejects = (mutate, pattern, label) => {
  const input = clone(base);
  mutate(input);
  assert.throws(() => validateM05C(input), pattern, label);
};

rejects((x) => { x.frozenIdentity.records[0].skinId = 601; }, /M01 Frozen Identity population changed/, 'reject Frozen M01 population mutation');
rejects((x) => { x.frozenRelations.scope = 'expanded'; }, /M02 Frozen Relation scope or schema changed/, 'reject Frozen M02 scope mutation');
rejects((x) => { x.newIdentity.records[0].provenance = ''; }, /M05 Identity must contain exactly/, 'reject missing Identity provenance');
rejects((x) => { x.newRelation.records[0].heroId = 1; }, /M05 Relation must contain exactly/, 'reject incorrect ownership');
rejects((x) => { x.newOrder.records[0].sourceOrder = 2; }, /M05 Source Order must contain exactly/, 'reject incorrect Source Order');
rejects((x) => { x.relationEvidence.records[0].membership.membershipConfirmed = false; }, /Source membership is not evidenced/, 'reject unsupported Membership');
rejects((x) => { x.orderEvidence.records[0].zeroBasedPosition = 1; }, /Source Order Evidence does not support/, 'reject wrong array position');
rejects((x) => { x.heroIdentities.records = x.heroIdentities.records.filter((row) => row.heroId !== 6); }, /HeroID 6 FK is absent/, 'reject missing Hero FK');
rejects((x) => { x.internalConsumer.skins.push({ skinId: 602, heroId: 6, sourceOrder: 2 }); }, /Internal Skin Consumer differs/, 'reject added Skin');
rejects((x) => { x.internalConsumer.skins[4].heroId = 1; }, /Internal Skin Consumer differs/, 'reject internal Consumer ownership drift');
rejects((x) => { x.publicConsumer.skins.push({ skinId: 601, heroId: 6, sourceOrder: 1 }); }, /M04 public Skin Consumer must remain/, 'reject unauthorized public Consumer expansion');
rejects((x) => { x.assetManifest.records.push({ skinId: 601 }); }, /M04 Asset Population changed/, 'reject unauthorized Asset Population expansion');
rejects((x) => { x.presentationSource += '\n601'; }, /M04 Presentation mapping contains/, 'reject M04 UI exposure');
rejects((x) => { x.buildSource += '\ngenerated/skin-consumer-internal-m05.v1.json'; }, /Internal Consumer was added/, 'reject internal Consumer publication');

assert.equal(assertPerHeroOrderUniqueness([
  { skinId: 102, heroId: 1, sourceOrder: 1 },
  { skinId: 601, heroId: 6, sourceOrder: 1 },
]), true, 'equal order across different Heroes is valid');
assert.throws(() => assertPerHeroOrderUniqueness([
  { skinId: 102, heroId: 1, sourceOrder: 1 },
  { skinId: 103, heroId: 1, sourceOrder: 1 },
]), /duplicate Source Order within Hero 1/, 'duplicate order within one Hero is invalid');

process.stdout.write('M05-C Skin admission negative tests: PASS (14 rejection cases; per-Hero order scope verified)\n');
