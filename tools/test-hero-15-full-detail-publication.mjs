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
  ['expand Equipment fields', (x) => { x.decision.fieldGroups.find((g) => g.id === 'exclusiveEquipment').publicationCandidateFields.push('equipment.assetPath'); }],
  ['approve Portrait', (x) => { x.portraitEvidence.publicationApproved = true; }],
  ['add unadmitted Skin relation', (x) => { x.decision.fieldGroups.find((g) => g.id === 'portraitSkin').canonicalClaims[0].claimIds.push(999); }],
  ['admit Job 811 Korean localization', (x) => { x.canonical.jobLocalizations.records.push({ jobId: 811, nameKo: '프로핏' }); }],
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
