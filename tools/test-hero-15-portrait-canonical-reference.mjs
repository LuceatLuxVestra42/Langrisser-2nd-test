import assert from 'node:assert/strict';
import {
  loadHero15PortraitCanonicalReferenceInputs,
  validateHero15PortraitCanonicalReference,
} from './hero-15-portrait-canonical-reference-contract.mjs';

const baseline = await loadHero15PortraitCanonicalReferenceInputs();
assert.equal(validateHero15PortraitCanonicalReference(baseline), true);
const cases = [
  ['Hero ID changed', (x) => { x.admission.claim.heroId = 16; }],
  ['wrong Canonical owner', (x) => { x.admission.claim.canonicalOwner = 'canonical/hero-identities.v1.json'; }],
  ['field value changed', (x) => { x.admission.claim.value = 'assets/portraits/hero-1.png'; }],
  ['HeroInfo explicit reference changed', (x) => { x.admission.support.sourceRelation.charImageId = 16; }],
  ['source endpoint changed', (x) => { x.admission.support.sourceRelation.charImageInfoLocator = 'records[12]/ID=15'; }],
  ['Hero ID and source endpoint equality used without relation field', (x) => { x.portraitEvidence.source.heroInfo.fields.ID = 14; }],
  ['CharImage endpoint changed', (x) => { x.portraitEvidence.source.charImageInfo.fields.ID = 16; }],
  ['Portrait source locator changed', (x) => { x.admission.support.sourceRelation.portraitReferenceFieldLocator = 'records[14]/ID'; }],
  ['artwork source changed', (x) => { x.admission.support.sourceRelation.heroPainting = 'other.prefab'; }],
  ['source evidence identity changed', (x) => { x.portraitEvidence.source.commit = '0'.repeat(40); }],
  ['asset evidence scope promoted', (x) => { x.portraitEvidence.canonical = true; }],
  ['internal asset bytes changed', (x) => { x.assetBytes = Buffer.from('incorrect'); }],
  ['asset path disconnected from evidence', (x) => { x.admission.support.assetReference.internalPath = 'assets/portraits/hero-15-alt.png'; }],
  ['inherited role limitation removed', (x) => { x.admission.support.roleSupport.limitation = 'No limitations'; }],
  ['candidate path changed', (x) => { x.candidate.record.portrait = 'assets/portraits/hero-1.png'; }],
  ['candidate provenance detached from admission', (x) => { x.candidate.record.provenance.portrait = 'evidence/source/portraits/hero-portrait-hero15.v1.json'; }],
  ['candidate admission not synchronized', (x) => { x.candidate.fieldAssessments.portrait.status = 'ADMITTED_CANDIDATE_FIELD_INTERNAL_ONLY'; }],
  ['portrait publication approved', (x) => { x.admission.effect.portraitPublicationApproved = true; }],
  ['Full Detail Publication approved', (x) => { x.admission.effect.fullDetailPublicationApproved = true; }],
  ['public build enabled', (x) => { x.admission.effect.publicBuildEligible = true; }],
  ['Full Detail population extended', (x) => { x.canonical.records.push({ id: 15 }); }],
  ['Generated population extended', (x) => { x.generated.heroes.push({ id: 15 }); }],
  ['migration made effective', (x) => { x.migrationDecision.proposedMigration.applicationStatus = 'NOT_EFFECTIVE'; }],
  ['publication decision approved', (x) => { x.publicationDecision.publication.fullDetailStatus = 'APPROVED'; }],
];
for (const [label, mutate] of cases) {
  const fixture = structuredClone(baseline);
  mutate(fixture);
  assert.throws(() => validateHero15PortraitCanonicalReference(fixture), undefined, label);
}
console.log(`Hero 15 Portrait Canonical Reference tests: PASS (${cases.length} negative boundary cases)`);
