import assert from 'node:assert/strict';
import {
  loadHero15FullDetailMigrationReadinessInputs,
  validateHero15FullDetailMigrationReadiness,
} from './hero-15-full-detail-migration-readiness-contract.mjs';

const baseline = await loadHero15FullDetailMigrationReadinessInputs();
assert.equal(validateHero15FullDetailMigrationReadiness(baseline), true);

const cases = [
  ['target Hero ID changed', (x) => { x.readiness.target.heroId = 16; }],
  ['required schema field removed', (x) => { x.readiness.target.requiredFields.pop(); }],
  ['approved English name invented', (x) => { x.readiness.fieldAssessments.nameEng.status = 'ADMITTED'; }],
  ['English name evidence fabricated', (x) => { x.readiness.fieldAssessments.nameEng.evidenceArtifact = 'invented'; }],
  ['Portrait promoted to Canonical', (x) => { x.portraitEvidence.canonical = true; }],
  ['Portrait promoted to public', (x) => { x.portraitEvidence.publicationApproved = true; }],
  ['Portrait readiness promoted', (x) => { x.readiness.fieldAssessments.portrait.status = 'ADMITTED'; }],
  ['Portrait Owner Admission removed', (x) => { x.portraitReferenceAdmission.status = 'MANUAL_REVIEW'; }],
  ['Portrait publication made a migration prerequisite', (x) => { x.readiness.gates.portraitReferenceAdmission = 'PASS'; x.readiness.gates.requiredFields = 'PASS'; }],
  ['Job membership removed', (x) => { x.jobRelations.records = x.jobRelations.records.filter((row) => row.heroId !== 15); }],
  ['Job endpoint changed', (x) => { x.jobRelations.records.find((row) => row.heroId === 15).jobId = 999; }],
  ['Job connection evidence order changed', (x) => { x.jobTree.jobs.reverse(); }],
  ['Advancement substituted for membership', (x) => { x.readiness.fieldAssessments.jobConnections.ownerArtifact = 'canonical/hero-job-advancement-relations.v1.json'; }],
  ['provenance promoted to complete', (x) => { x.readiness.fieldAssessments.provenance.status = 'ADMITTED'; }],
  ['migration authority promoted', (x) => { x.migrationDecision.approval.authorityStatus = 'APPROVED'; }],
  ['migration execution enabled', (x) => { x.readiness.migrationExecutionReady = true; }],
  ['Full Detail field publication approved', (x) => { x.readiness.gates.fullDetailFieldPublication = 'APPROVED'; }],
  ['Population 29 to 30 applied', (x) => { x.fullDetailCanonical.records.push({ id: 15 }); }],
  ['Index population changed', (x) => { x.readiness.populationInvariant.heroIndexCount = 268; }],
  ['Equipment navigation population changed', (x) => { x.equipmentRelations.records.pop(); }],
  ['Portrait assumption used as fallback', (x) => { x.readiness.fieldAssessments.portrait.transformation = 'fallback'; }],
];

for (const [label, mutate] of cases) {
  const fixture = structuredClone(baseline);
  mutate(fixture);
  assert.throws(() => validateHero15FullDetailMigrationReadiness(fixture), undefined, label);
}

console.log(`Hero 15 Full Detail migration readiness tests: PASS (${cases.length} negative boundary cases)`);
