import assert from 'node:assert/strict';
import {
  loadHero15FullDetailPublicationInputs,
  validateHero15FullDetailPublication,
} from './hero-15-full-detail-publication-contract.mjs';

const baseline = await loadHero15FullDetailPublicationInputs();
assert.equal(validateHero15FullDetailPublication(structuredClone(baseline)), true);

const expectedPairs = [210, 326, 602, 621, 802, 806, 811, 815, 817, 819, 5210, 5326, 5602, 5621, 5802, 5811, 5815]
  .map(id => [15, id]);
const pair = ({ heroId, soldierId }) => [heroId, soldierId];
assert.deepEqual(baseline.canonical.soldierRelations.records.filter(row => row.heroId === 15).map(pair), expectedPairs);
assert.deepEqual(baseline.generated.hero15Soldier.records.map(pair), expectedPairs);
const soldierGroup = input => input.decision.fieldGroups.find(group => group.id === 'soldier');
const proposal = input => soldierGroup(input).canonicalClaims.find(claim => claim.artifact === 'canonical/hero-soldier-relations.v1.json');
assert.deepEqual(proposal(baseline).claimIds, [210, 326, 602, 621, 802, 811, 815, 5210, 5326, 5602, 5621, 5802, 5811, 5815]);
const existingNormal115 = baseline.canonical.soldiers.records.find(row => row.id === 115);
assert.equal(existingNormal115?.variant, 'NORMAL');
const reject = (mutate, diagnostic) => {
  const input = structuredClone(baseline);
  mutate(input);
  assert.throws(() => validateHero15FullDetailPublication(input), diagnostic);
};
for (const [mutate, diagnostic] of [
  [rows => rows.splice(rows.findIndex(row => row.heroId === 15 && row.soldierId === 806), 1), /17-pair scope/],
  [rows => rows.splice(rows.findIndex(row => row.heroId === 15 && row.soldierId === 806), 0,
    structuredClone(rows.find(row => row.heroId === 15 && row.soldierId === 806))), /17-pair scope/],
  [rows => {
    const index = rows.findIndex(row => row.heroId === 15 && row.soldierId === 806);
    [rows[index], rows[index + 1]] = [rows[index + 1], rows[index]];
  }, /17-pair scope/],
  [rows => {
    const replaced = rows.find(row => row.heroId === 15 && row.soldierId === 806);
    replaced.soldierId = 115;
    if (replaced.soldierIdentity) replaced.soldierIdentity = structuredClone(existingNormal115);
    rows.sort((a, b) => a.heroId - b.heroId || a.soldierId - b.soldierId);
  }, /17-pair scope/],
]) {
  reject(x => {
    mutate(x.canonical.soldierRelations.records);
    mutate(x.generated.hero15Soldier.records);
  }, diagnostic);
}
reject(x => { x.generated.hero15Soldier.records[0].heroId = 14; }, /Soldier relation\/consumer parity failed/);
reject(x => { proposal(x).claimIds[0] = 806; }, /Soldier source trace ID set drift/);
reject(x => { x.canonical.normalSoldierLocalizations.records = x.canonical.normalSoldierLocalizations.records
  .filter(row => row.soldierId !== 210); }, /Soldier identity or Korean localization endpoint coverage changed/);

const cases = [
  ['wrong Hero ID', (x) => { x.decision.targetSurface.heroId = 16; }],
  ['remove target schema group', (x) => { x.decision.targetFieldSchema.pop(); }],
  ['remove field group', (x) => { x.decision.fieldGroups.pop(); }],
  ['approve internal consumer fields', (x) => { x.decision.fieldGroups.find((g) => g.id === 'jobTree').publicationApprovedFields.push('jobs[].jobId'); }],
  ['promote Minimal Detail Talent', (x) => { x.decision.publication.approvedFields.push('talent.nameKo'); }],
  ['publish the newly admitted Central Discipline reference', (x) => { x.decision.fieldGroups.find((g) => g.id === 'centralDiscipline').publicationApprovedFields.push('centralDiscipline.skillId'); }],
  ['substitute a different Central Discipline claim', (x) => { x.decision.fieldGroups.find((g) => g.id === 'centralDiscipline').canonicalClaims[0].claimIds = [90085]; }],
  ['expand Equipment fields', (x) => { x.decision.fieldGroups.find((g) => g.id === 'exclusiveEquipment').publicationCandidateFields.push('equipment.assetPath'); }],
  ['approve Portrait', (x) => { x.portraitEvidence.publicationApproved = true; }],
  ['add unadmitted Skin relation', (x) => { x.decision.fieldGroups.find((g) => g.id === 'portraitSkin').canonicalClaims[0].claimIds.push(999); }],
  ['restore stale Job Tree localization status', (x) => { x.decision.fieldGroups.find((g) => g.id === 'jobTree').localization.status = 'PARTIAL_4_OF_6'; }],
  ['restore stale JobLevel localization status', (x) => { x.decision.fieldGroups.find((g) => g.id === 'jobLevelStats').localization.status = 'PARTIAL'; }],
  ['drop the JobLevel localization owner', (x) => { x.decision.fieldGroups.find((g) => g.id === 'jobLevelStats').localization.ownerArtifacts.pop(); }],
  ['remove an admitted Job localization', (x) => { x.canonical.jobLocalizations.records = x.canonical.jobLocalizations.records.filter((row) => row.jobId !== 802); }],
  ['change Job 811 project-reviewed localization', (x) => { x.canonical.jobLocalizations.records.find((row) => row.jobId === 811).nameKo = '임의 명칭'; }],
  ['change Job 707 project-reviewed localization', (x) => { x.canonical.jobLocalizations.records.find((row) => row.jobId === 707).nameKo = '임의 명칭'; }],
  ['publish calculated final Stats', (x) => { x.decision.fieldGroups.find((g) => g.id === 'jobLevelStats').publicationCandidateFields.push('jobLevels[].finalDisplayStats'); }],
  ['publish Soldier Command calculation', (x) => { x.decision.fieldGroups.find((g) => g.id === 'soldierCommand').publicationCandidateFields.push('soldierCommand.finalModifiers'); }],
  ['publish admitted Soldier Command base modifiers', (x) => { x.decision.fieldGroups.find((g) => g.id === 'soldierCommand').publicationApprovedFields.push('soldierCommand.baseModifiers'); }],
  ['publish admitted Hero3 contribution', (x) => { x.decision.fieldGroups.find((g) => g.id === 'soldierCommand').publicationApprovedFields.push('soldierCommand.centralBondContribution'); }],
  ['drop the Hero3 source trace', (x) => { x.decision.fieldGroups.find((g) => g.id === 'soldierCommand').canonicalClaims.pop(); }],
  ['lose the Soldier Command source trace', (x) => { x.decision.fieldGroups.find((g) => g.id === 'soldierCommand').canonicalClaims[0].evidenceArtifact = 'other.json'; }],
  ['infer Skill acquisition', (x) => { x.decision.fieldGroups.find((g) => g.id === 'skill').publicationCandidateFields.push('skills[].acquisition'); }],
  ['apply Population expansion', (x) => { x.decision.population.currentEffectiveCount = 30; }],
  ['approve Public Eligibility', (x) => { x.decision.publication.publicEligibilityStatus = 'APPROVED'; }],
  ['change existing Navigation target', (x) => { x.integratedDecision.approvedScope.heroIndexNavigation.fragment = 'hero-full-detail-15'; }],
  ['confirm approval without source', (x) => { x.decision.approval.status = 'CONFIRMED'; }],
  ['invent Canonical ID/locator', (x) => { x.decision.fieldGroups.find((g) => g.id === 'profile').canonicalClaims[0].locator = 'canonical/heroes.v1.json#ID=999'; }],
  ['make migration effective', (x) => { x.migrationDecision.proposedMigration.applicationStatus = 'NOT_EFFECTIVE'; }],
];

for (const [label, mutate] of cases) {
  const fixture = structuredClone(baseline);
  mutate(fixture);
  assert.throws(() => validateHero15FullDetailPublication(fixture), undefined, `${label} must be rejected`);
}

console.log(`Hero 15 Full Detail Publication contract negative tests: PASS (${cases.length} proposal mutations and 7 Soldier boundary cases rejected)`);
