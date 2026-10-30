import assert from 'node:assert/strict';
import { loadM06SemanticInputs, validateM06SemanticData, assertM06PerHeroOrderUniqueness } from './validate-skin-admission-m06.mjs';

const baseline = await loadM06SemanticInputs();
assert.deepEqual(validateM06SemanticData(baseline), {
  status: 'PASS', newSemantic: 5, composed: 10, existingPublic: 5, newlyPublishedFromM06: 0,
});
assertM06PerHeroOrderUniqueness([{ heroId: 6, sourceOrder: 1 }, { heroId: 7, sourceOrder: 1 }]);

const rejects = (label, mutate, pattern) => {
  const input = structuredClone(baseline);
  mutate(input);
  assert.throws(() => validateM06SemanticData(input), pattern, label);
};

rejects('wrong identity SkinID', (v) => { v.identityEvidence.records[0].sourceRecord.ID = 603; }, /Identity records/);
rejects('wrong Hero ownership', (v) => { v.relationEvidence.records[0].heroId = 7; }, /Ownership evidence/);
rejects('wrong Source Order', (v) => { v.orderEvidence.records[0].sourceOrder = 99; }, /Source Order evidence/);
rejects('missing identity provenance', (v) => { v.identities.records[0].provenance = ''; }, /Identity Canonical/);
rejects('wrong evidence snapshot', (v) => { v.identityEvidence.source.snapshotCommit = '0'.repeat(40); }, /Identity Source pin/);
rejects('missing explicit membership', (v) => { v.relationEvidence.records[0].membership.membershipConfirmed = false; }, /Ownership evidence/);
rejects('wrong SpecifiedHero cross-check', (v) => { v.relationEvidence.records[0].ownershipCrossCheck.value = 999; }, /Ownership evidence/);
rejects('duplicate admission key', (v) => { v.admissionRegistry.admissions[1].admissionId = v.admissionRegistry.admissions[0].admissionId; }, /Admission Registry entries/);
rejects('duplicate Source Order in same Hero', (v) => { v.composed.skins[6].sourceOrder = 1; }, /composed internal Consumer/);
rejects('M01 Frozen population mutation', (v) => { v.frozenIdentity.records.pop(); }, /M01 Frozen population/);
rejects('M05-C population mutation', (v) => { v.m05Relation.records[0].heroId = 7; }, /M05-C ownership/);
rejects('unapproved Semantic-only public row', (v) => {
  v.publicConsumer.skins.push({ skinId: 602, heroId: 6, sourceOrder: 2 });
  v.publicAssets.assets.push({ skinId: 602, imageUrl: './assets/skin-admissions/m06/skin-602.webp' });
}, /Semantic-only Skin 602 leaked/);

process.stdout.write('M06 Semantic failure controls: PASS (12 isolated identity, ownership, order, provenance, scope, and publication mutations)\n');
