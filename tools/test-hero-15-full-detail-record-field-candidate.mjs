import assert from 'node:assert/strict';
import {
  loadHero15FullDetailRecordFieldCandidateInputs,
  validateHero15FullDetailRecordFieldCandidate,
} from './hero-15-full-detail-record-field-candidate-contract.mjs';

const baseline = await loadHero15FullDetailRecordFieldCandidateInputs();
assert.equal(validateHero15FullDetailRecordFieldCandidate(baseline), true);

const cases = [
  ['candidate baseline changed', (x) => { x.candidate.baseline.head = '0'.repeat(40); }],
  ['Hero ID changed', (x) => { x.candidate.record.id = 16; }],
  ['English source value changed', (x) => { x.candidate.record.nameEng = 'Liana'; }],
  ['English source locator fabricated', (x) => { x.nameEngEvidence.source.fieldLocator = 'Name'; }],
  ['Pinned source hash changed', (x) => { x.nameEngEvidence.source.sha256 = '0'.repeat(64); }],
  ['Portrait identity changed', (x) => { x.portraitEvidence.source.heroInfo.fields.CharImage_ID = 16; }],
  ['Portrait Canonical reference Owner Admission removed', (x) => { x.portraitReferenceAdmission.status = 'MANUAL_REVIEW'; }],
  ['Portrait path fallback introduced', (x) => { x.candidate.record.portrait = 'assets/portraits/hero-1.png'; }],
  ['Internal Portrait marked public', (x) => { x.portraitEvidence.publicationApproved = true; }],
  ['Portrait candidate approval promoted', (x) => { x.candidate.effect.portraitPublicationApproved = true; }],
  ['Job endpoint changed', (x) => { x.candidate.record.jobConnections[0].jobId = 999; }],
  ['Job source field changed', (x) => { x.candidate.record.jobConnections[1].sourceField = 'JobConnection_ID'; }],
  ['Job source order changed', (x) => { x.candidate.record.jobConnections.reverse(); }],
  ['Job relation added', (x) => { x.candidate.record.jobConnections.push({ connectionId: 156, jobId: 900, sourceField: 'UseableJobConnections_ID' }); }],
  ['Job Canonical endpoint changed', (x) => { x.jobRelations.records.find((row) => row.heroId === 15).jobId = 999; }],
  ['Provenance removed', (x) => { delete x.candidate.record.provenance.nameEng; }],
  ['Candidate status overclaims Canonical readiness', (x) => { x.candidate.status = 'CANONICAL_RECORD_ADMITTED'; }],
  ['Candidate consumed by Public Build', (x) => { x.candidate.effect.publicBuildConsumption = true; }],
  ['Full Detail Canonical population extended', (x) => { x.fullDetailCanonical.records.push({ id: 15 }); }],
  ['Generated Full Detail population extended', (x) => { x.fullDetailGenerated.heroes.push({ id: 15 }); }],
  ['Index count changed', (x) => { x.heroIndexDecision.approvedScope.heroIds.pop(); }],
  ['Equipment Navigation count changed', (x) => { x.equipmentRelations.records.pop(); }],
  ['Migration made effective', (x) => { x.migrationDecision.proposedMigration.applicationStatus = 'EFFECTIVE'; }],
  ['Full Detail Publication approved', (x) => { x.publicationDecision.publication.fullDetailStatus = 'APPROVED'; }],
];

for (const [label, mutate] of cases) {
  const fixture = structuredClone(baseline);
  mutate(fixture);
  assert.throws(() => validateHero15FullDetailRecordFieldCandidate(fixture), undefined, label);
}

console.log(`Hero 15 Full Detail record field candidate tests: PASS (${cases.length} negative boundary cases)`);
