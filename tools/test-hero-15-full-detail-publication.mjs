import assert from 'node:assert/strict';
import {
  loadHero15FullDetailPublicationInputs,
  validateHero15FullDetailPublication,
} from './hero-15-full-detail-publication-contract.mjs';

const baseline = await loadHero15FullDetailPublicationInputs();
assert.equal(validateHero15FullDetailPublication(structuredClone(baseline)), true);

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

console.log(`Hero 15 Full Detail Publication contract negative tests: PASS (${cases.length} mutations rejected)`);
