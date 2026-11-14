import { validateHero15CanonicalPopulation } from './hero-full-detail-population-migration-contract.mjs';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const HERO_15_FULL_DETAIL_RECORD_FIELD_CANDIDATE_PATH = 'docs/decisions/hero-15-full-detail-record-field-candidate.v1.json';
const SOURCE_COMMIT = '6475e63ee23d18adf733756c26a14fa9e3ed662c';
const CURRENT_FULL_DETAIL_IDS = [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 25, 26, 27, 28, 29, 32, 33, 37, 40, 52, 53, 55, 56, 60, 67, 89];
const EXPECTED_CONNECTIONS = [
  { connectionId: 150, jobId: 802, sourceField: 'JobConnection_ID' },
  { connectionId: 151, jobId: 803, sourceField: 'UseableJobConnections_ID' },
  { connectionId: 152, jobId: 806, sourceField: 'UseableJobConnections_ID' },
  { connectionId: 153, jobId: 703, sourceField: 'UseableJobConnections_ID' },
  { connectionId: 154, jobId: 811, sourceField: 'UseableJobConnections_ID' },
  { connectionId: 155, jobId: 707, sourceField: 'UseableJobConnections_ID' },
];
const EXPECTED_RECORD = {
  id: 15,
  nameEng: 'Riana',
  portrait: 'assets/portraits/hero-15.png',
  jobConnections: EXPECTED_CONNECTIONS,
  provenance: {
    id: 'evidence/source/configdata/ConfigDataHeroInfo.records-playable-identity.v1.json#ID=15',
    nameEng: 'evidence/source/configdata/ConfigDataHeroInfo.record-hero-15-name-eng.v1.json#claim',
    portrait: 'docs/decisions/hero-15-portrait-canonical-reference-admission.v1.json#claim',
    jobConnections: 'evidence/source/jobs/hero-job-connection-hero-15-inherited.v1.json#selectedRelations',
  },
};

const fail = (message) => { throw new Error(`Hero 15 Full Detail record field candidate: ${message}`); };
const equal = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const exactKeys = (value, keys, label) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || !equal(Object.keys(value).sort(), [...keys].sort())) fail(`${label} keys differ from the contract`);
};
const readJson = async (root, path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));

export async function loadHero15FullDetailRecordFieldCandidateInputs(root = process.cwd()) {
  const paths = {
    candidate: HERO_15_FULL_DETAIL_RECORD_FIELD_CANDIDATE_PATH,
    portraitReferenceAdmission: 'docs/decisions/hero-15-portrait-canonical-reference-admission.v1.json',
    nameEngEvidence: 'evidence/source/configdata/ConfigDataHeroInfo.record-hero-15-name-eng.v1.json',
    identities: 'canonical/hero-identities.v1.json',
    identityEvidence: 'evidence/source/configdata/ConfigDataHeroInfo.records-playable-identity.v1.json',
    portraitEvidence: 'evidence/source/portraits/hero-portrait-hero15.v1.json',
    jobRelations: 'canonical/hero-job-relations.v1.json',
    jobRelationEvidence: 'evidence/source/jobs/hero-job-connection-hero-15-inherited.v1.json',
    jobTreeEvidence: 'evidence/source/jobs/hero-job-tree-hero15.v1.json',
    jobTree: 'generated/hero-15-job-tree-internal.v1.json',
    fullDetailCanonical: 'canonical/heroes.v1.json',
    fullDetailGenerated: 'generated/hero-slice.v1.json',
    heroIndexDecision: 'docs/decisions/hero-index-publication.v1.json',
    equipmentRelations: 'canonical/hero-exclusive-equipment-relations.v1.json',
    migrationDecision: 'docs/decisions/hero-full-detail-population-migration.v1.json',
    publicationDecision: 'docs/decisions/hero-15-full-detail-publication.v1.json',
  };
  return Object.fromEntries(await Promise.all(Object.entries(paths).map(async ([key, path]) => [key, await readJson(root, path)])));
}

export function validateHero15FullDetailRecordFieldCandidate(input) {
  const {
    candidate: c, portraitReferenceAdmission, nameEngEvidence, identities, identityEvidence, portraitEvidence,
    jobRelations, jobRelationEvidence, jobTreeEvidence, jobTree, fullDetailCanonical,
    fullDetailGenerated, heroIndexDecision, equipmentRelations, migrationDecision,
    publicationDecision,
  } = input ?? {};
  exactKeys(c, ['schemaVersion', 'artifactType', 'status', 'baseline', 'target', 'record', 'fieldAssessments', 'effect', 'limitations'], 'candidate');
  if (c.schemaVersion !== 1 || c.artifactType !== 'HERO_15_FULL_DETAIL_RECORD_FIELD_CANDIDATE'
    || c.status !== 'CANDIDATE_RECORD_COMPLETE') fail('candidate status or artifact type is invalid');
  exactKeys(c.baseline, ['repository', 'ref', 'head'], 'baseline');
  if (c.baseline.repository !== 'LuceatLuxVestra42/Langrisser-2nd-test' || c.baseline.ref !== 'main'
    || c.baseline.head !== '8ccbcdf62e225ddfbc482382bbbe6c68683f92f6') fail('candidate baseline is not the verified Main');
  exactKeys(c.target, ['heroId', 'canonicalOwner', 'currentCanonicalPopulation', 'populationApplied'], 'target');
  if (c.target.heroId !== 15 || c.target.canonicalOwner !== 'canonical/heroes.v1.json'
    || c.target.currentCanonicalPopulation !== 29 || c.target.populationApplied !== false) fail('target or Population effect is invalid');
  exactKeys(c.record, ['id', 'nameEng', 'portrait', 'jobConnections', 'provenance'], 'record');
  if (!equal(c.record, EXPECTED_RECORD)) fail('record fields or source order differ from the admitted candidate projection');

  const identity = identities?.records?.filter((row) => row.heroId === 15) ?? [];
  const identitySource = identityEvidence?.records?.filter((row) => row.ID === 15) ?? [];
  if (identity.length !== 1 || identity[0].provenance !== EXPECTED_RECORD.provenance.id
    || identitySource.length !== 1 || identitySource[0].Useable !== true) fail('HeroID is not supported by the admitted Identity owner');

  const source = nameEngEvidence?.source;
  if (nameEngEvidence?.schemaVersion !== 1 || nameEngEvidence.claim?.heroId !== 15
    || nameEngEvidence.claim?.field !== 'Name_Eng' || nameEngEvidence.claim?.value !== 'Riana'
    || source?.repository !== 'LuceatLuxVestra42/langrisser-future-guide' || source?.commit !== SOURCE_COMMIT
    || source?.snapshotDate !== '2026-09-02' || source?.path !== 'data/configdata/ConfigDataHeroInfo.json'
    || source?.gitBlobSha1 !== '728daab3370f0c7779449663ea02e638677944d4'
    || source?.sha256 !== '2385599493d2598aa3f7d6b2c76ecdfd8615d91f19b6241933986282fcb17f7b'
    || source?.byteLength !== 16894185 || source?.recordCount !== 28789 || source?.recordIndex !== 14
    || source?.recordLocator !== 'data/configdata/ConfigDataHeroInfo.json#records[14]/ID=15'
    || source?.fieldLocator !== 'data/configdata/ConfigDataHeroInfo.json#records[14]/Name_Eng'
    || !equal(nameEngEvidence.verification, {
      sourceBytesRetrievedAtPinnedCommit: true,
      gitBlobSha1Verified: true,
      sha256Verified: true,
      recordIndexAndIdVerified: true,
      transformation: 'Copy the exact Name_Eng string from the pinned source record; no transliteration or localization transformation.',
      scope: 'The source-native English-name field for HeroID 15 only.',
      limitation: 'Does not establish a Korean localization, public display approval, or any Full Detail population or publication status.',
    })) fail('Name_Eng evidence does not match the fixed source record and verified file state');

  if (portraitEvidence?.canonical !== false || portraitEvidence?.generated !== false
    || portraitEvidence?.productionRuntimeDependency !== false || portraitEvidence?.publicationApproved !== false
    || portraitEvidence?.admissionScope !== 'INTERNAL_HERO_PORTRAIT_ASSET_ONLY'
    || portraitEvidence?.source?.commit !== SOURCE_COMMIT
    || portraitEvidence?.source?.heroInfo?.fields?.ID !== 15
    || portraitEvidence?.source?.heroInfo?.fields?.CharImage_ID !== 15
    || portraitEvidence?.source?.charImageInfo?.fields?.ID !== 15
    || portraitEvidence?.asset?.path !== EXPECTED_RECORD.portrait
    || portraitEvidence?.asset?.sourceGitBlobSha1 !== '1dbd9386854aa7058de28c164341c6c20059e145'
    || portraitEvidence?.asset?.sha256 !== '2caad36dfbc17e3c570b36fcd74e5674822d2a0fb20e6df6ff72a1640b903073') fail('Portrait candidate reference is not the explicit internal asset relation');
  if (portraitReferenceAdmission?.status !== 'ADMITTED_INTERNAL_ONLY'
    || portraitReferenceAdmission?.claim?.heroId !== 15 || portraitReferenceAdmission?.claim?.field !== 'portrait'
    || portraitReferenceAdmission?.claim?.value !== EXPECTED_RECORD.portrait
    || portraitReferenceAdmission?.claim?.canonicalRecordApplied !== false
    || portraitReferenceAdmission?.effect?.portraitPublicationApproved !== false
    || portraitReferenceAdmission?.effect?.publicBuildEligible !== false) fail('Portrait reference lacks the separate internal-only Owner Admission');

  const selected = jobRelationEvidence?.selectedRelations?.map(({ connectionId, jobId, sourceField }) => ({ connectionId, jobId, sourceField }));
  const canonicalHeroJobs = jobRelations?.records?.filter((row) => row.heroId === 15) ?? [];
  const expectedPairs = EXPECTED_CONNECTIONS.map(({ connectionId, jobId, sourceField }) => ({ connectionId, jobId, sourceField }));
  if (jobRelationEvidence?.source?.snapshotCommit !== SOURCE_COMMIT
    || jobRelationEvidence?.claims?.heroFieldToConnection !== 'B'
    || jobRelationEvidence?.claims?.connectionToJob !== 'B'
    || !equal(selected, expectedPairs) || !equal(c.record.jobConnections, expectedPairs)
    || canonicalHeroJobs.length !== EXPECTED_CONNECTIONS.length
    || !equal(canonicalHeroJobs.map((row) => row.jobId), EXPECTED_CONNECTIONS.map((row) => row.jobId))) fail('Job membership projection does not exactly match admitted source and Canonical relations');
  for (const row of EXPECTED_CONNECTIONS) {
    const canonicalRelation = canonicalHeroJobs.find((item) => item.jobId === row.jobId);
    if (canonicalRelation?.provenance !== `evidence/source/jobs/hero-job-connection-hero-15-inherited.v1.json#heroId=15&connectionId=${row.connectionId}`) fail(`Job relation provenance mismatch for JobID ${row.jobId}`);
  }
  if (jobTreeEvidence?.source?.commit !== SOURCE_COMMIT
    || !equal(jobTreeEvidence?.claims?.connectionMembership?.connections?.map(({ connectionId, jobId }) => ({ connectionId, jobId })), EXPECTED_CONNECTIONS.map(({ connectionId, jobId }) => ({ connectionId, jobId })))
    || !equal(jobTree?.jobs?.map(({ connectionId, jobId }) => ({ connectionId, jobId })), EXPECTED_CONNECTIONS.map(({ connectionId, jobId }) => ({ connectionId, jobId })))) fail('Hero 15 Job Tree relation projection drift');

  const applied = validateHero15CanonicalPopulation(fullDetailCanonical, migrationDecision, c.record);
  if (!equal(fullDetailGenerated?.heroes?.map((row) => row.id), CURRENT_FULL_DETAIL_IDS)) fail('public Full Detail population changed');
  if (heroIndexDecision?.approvedScope?.heroIds?.length !== 267 || equipmentRelations?.records?.length !== 167) fail('Hero Index or Equipment Navigation population changed');
  if (migrationDecision.proposedMigration.fullDetailPublicationStatus !== 'NOT_APPROVED'
    || migrationDecision.proposedMigration.publicEligibilityStatus !== 'NOT_APPROVED') fail('Migration widened publication scope');
  if (publicationDecision?.status !== 'PROPOSED'
    || publicationDecision?.publication?.fullDetailStatus !== 'NOT_APPROVED'
    || publicationDecision?.publication?.publicEligibilityStatus !== 'NOT_APPROVED'
    || publicationDecision?.population?.migrationStatus !== (applied ? 'EFFECTIVE' : 'NOT_EFFECTIVE')) fail('Full Detail publication state was promoted');

  exactKeys(c.fieldAssessments, ['id', 'nameEng', 'portrait', 'jobConnections', 'provenance'], 'fieldAssessments');
  for (const assessment of Object.values(c.fieldAssessments)) {
    exactKeys(assessment, ['status', 'evidenceArtifact', 'locator', 'sourceVersion', 'transformation', 'scope', 'limitation'], 'fieldAssessment');
    if (!assessment.evidenceArtifact || !assessment.locator || !assessment.sourceVersion || !assessment.transformation || !assessment.scope || !assessment.limitation) fail('candidate field provenance is incomplete');
  }
  if (c.fieldAssessments.id.status !== 'ADMITTED_CANDIDATE_FIELD'
    || c.fieldAssessments.nameEng.status !== 'ADMITTED_CANDIDATE_FIELD'
    || c.fieldAssessments.portrait.status !== 'CANONICAL_REFERENCE_ADMITTED_INTERNAL_ONLY'
    || c.fieldAssessments.jobConnections.status !== 'ADMITTED_CANDIDATE_PROJECTION_INTERNAL_ONLY'
    || c.fieldAssessments.provenance.status !== 'COMPLETE_FOR_CANDIDATE_FIELDS') fail('candidate field status overstates or omits an admission boundary');
  exactKeys(c.effect, ['canonicalPopulationMutation', 'generatedPopulationMutation', 'fullDetailPublicationApproved', 'publicEligibilityApproved', 'portraitPublicationApproved', 'publicBuildConsumption'], 'effect');
  if (!equal(c.effect, { canonicalPopulationMutation: false, generatedPopulationMutation: false, fullDetailPublicationApproved: false, publicEligibilityApproved: false, portraitPublicationApproved: false, publicBuildConsumption: false })) fail('candidate has an unauthorized Canonical or public effect');
  if (!equal(c.limitations, [
    'This is a complete non-public record candidate, not a Canonical Full Detail record or population addition.',
    'The Candidate itself preserves the 29 baseline Canonical and Generated records.',
    'Portrait reference admission is separate from Asset Publication Approval; the Portrait remains internal-only.',
    'The separate Migration Decision governs active Canonical admission and approval evidence.',
    'Full Detail Publication, Public Eligibility, Frontend reachability, and Hosted QA are not approved or verified by this artifact.',
  ])) fail('candidate limitations changed');
  return true;
}

export async function validateHero15FullDetailRecordFieldCandidateFromRoot(root = process.cwd(), overrides = {}) {
  return validateHero15FullDetailRecordFieldCandidate({ ...await loadHero15FullDetailRecordFieldCandidateInputs(root), ...overrides });
}
