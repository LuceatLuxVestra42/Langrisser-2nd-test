import { validateHero15CanonicalPopulation } from './hero-full-detail-population-migration-contract.mjs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const HERO_15_FULL_DETAIL_MIGRATION_READINESS_PATH = 'docs/decisions/hero-15-full-detail-migration-readiness.v1.json';
export const HERO_15_FULL_DETAIL_MIGRATION_READINESS_BASE = '6f25eafcaba324383a11e2bcc8da4f2dc6c8b6e1';
export const HERO_15_FULL_DETAIL_CURRENT_IDS = Object.freeze([1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 25, 26, 27, 28, 29, 32, 33, 37, 40, 52, 53, 55, 56, 60, 67, 89]);
export const HERO_15_JOB_CONNECTIONS = Object.freeze([
  { connectionId: 150, jobId: 802, sourceField: 'JobConnection_ID' },
  { connectionId: 151, jobId: 803, sourceField: 'UseableJobConnections_ID' },
  { connectionId: 152, jobId: 806, sourceField: 'UseableJobConnections_ID' },
  { connectionId: 153, jobId: 703, sourceField: 'UseableJobConnections_ID' },
  { connectionId: 154, jobId: 811, sourceField: 'UseableJobConnections_ID' },
  { connectionId: 155, jobId: 707, sourceField: 'UseableJobConnections_ID' },
]);
const EXPECTED_FIELD_ASSESSMENTS = {
  id: { status: 'IDENTITY_ADMITTED', ownerArtifact: 'canonical/hero-identities.v1.json', ownerLocator: 'heroId=15', evidenceArtifact: 'evidence/source/configdata/ConfigDataHeroInfo.records-playable-identity.v1.json', evidenceLocator: '#ID=15', sourceVersion: 'LuceatLuxVestra42/langrisser-future-guide@6475e63ee23d18adf733756c26a14fa9e3ed662c; ConfigData snapshot 2026-09-02', transformation: 'Copy the exact ConfigDataHeroInfo ID into the Hero Identity owner.', scope: 'Playable Hero identity only; not Full Detail population or publication eligibility.', limitation: 'Does not establish any other required Full Detail field.' },
  nameEng: { status: 'CANDIDATE_FIELD_ADMITTED', ownerArtifact: 'canonical/heroes.v1.json', ownerLocator: 'id=15/nameEng', evidenceArtifact: 'evidence/source/configdata/ConfigDataHeroInfo.record-hero-15-name-eng.v1.json', evidenceLocator: '#claim/Name_Eng; source records[14]/ID=15/Name_Eng', sourceVersion: 'LuceatLuxVestra42/langrisser-future-guide@6475e63ee23d18adf733756c26a14fa9e3ed662c; ConfigData snapshot 2026-09-02; source SHA-256 2385599493d2598aa3f7d6b2c76ecdfd8615d91f19b6241933986282fcb17f7b', transformation: 'Exact source-field copy: Name_Eng=Riana, recorded only in the non-public record candidate.', scope: 'Source-native English name for HeroID 15 in the candidate record.', limitation: 'This field assessment grants neither Korean localization nor Publication Approval.' },
  portrait: { status: 'CANONICAL_REFERENCE_ADMITTED_INTERNAL_ONLY', ownerArtifact: 'canonical/heroes.v1.json', ownerLocator: 'id=15/portrait', evidenceArtifact: 'docs/decisions/hero-15-portrait-canonical-reference-admission.v1.json', evidenceLocator: '#claim', sourceVersion: 'LuceatLuxVestra42/langrisser-future-guide@6475e63ee23d18adf733756c26a14fa9e3ed662c; ConfigData snapshot 2026-09-02T01:45:21Z', transformation: 'Record the exact internal asset path admitted for the non-public Full Detail record field from the explicit HeroInfo.CharImage_ID to CharImageInfo.ID relation and verified asset bytes.', scope: 'Hero 15 Full Detail record Portrait reference only; internal asset path.', limitation: 'The source Asset Evidence remains canonical=false and publicationApproved=false; no Asset Publication or Public Build eligibility is granted.' },
  jobConnections: { status: 'CANDIDATE_PROJECTION_ADMITTED_INTERNAL_ONLY', ownerArtifact: 'canonical/hero-job-relations.v1.json', ownerLocator: 'heroId=15; jobId={802,803,806,703,811,707}', evidenceArtifact: 'evidence/source/jobs/hero-job-connection-hero-15-inherited.v1.json', evidenceLocator: '#selectedRelations[0..5]', sourceVersion: 'LuceatLuxVestra42/langrisser-future-guide@6475e63ee23d18adf733756c26a14fa9e3ed662c; ConfigData snapshot 2026-09-02', transformation: 'Project the six explicit connectionId/jobId/sourceField tuples in inherited source order and require exact parity with the already admitted Hero-to-Job Canonical relations.', scope: 'Six Hero 15 Job membership rows in the candidate only.', limitation: 'Candidate projection only; no additional relation, display name, advancement, unlock, or runtime rule is admitted. The Migration Decision governs application to Canonical.' },
  provenance: { status: 'COMPLETE_FOR_CANDIDATE_FIELDS', ownerArtifact: 'canonical/heroes.v1.json', ownerLocator: 'id=15/provenance', evidenceArtifact: 'docs/decisions/hero-15-full-detail-record-field-candidate.v1.json', evidenceLocator: '#record/provenance', sourceVersion: 'Claim-specific source versions are recorded on each candidate field assessment.', transformation: 'Compose field-level provenance references without merging their source scopes.', scope: 'All fields present in the complete non-public candidate record.', limitation: 'The Migration Decision governs application of this provenance to Canonical.' },
};

const fail = (message) => { throw new Error(`Hero 15 Full Detail migration readiness: ${message}`); };
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const exactKeys = (value, keys, label) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || !equal(Object.keys(value).sort(), [...keys].sort())) fail(`${label} fields differ from contract`);
};
const readJson = async (root, path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));

export async function loadHero15FullDetailMigrationReadinessInputs(root = process.cwd()) {
  const paths = {
    readiness: HERO_15_FULL_DETAIL_MIGRATION_READINESS_PATH,
    fullDetailCanonical: 'canonical/heroes.v1.json',
    fullDetailGenerated: 'generated/hero-slice.v1.json',
    identities: 'canonical/hero-identities.v1.json',
    identityEvidence: 'evidence/source/configdata/ConfigDataHeroInfo.records-playable-identity.v1.json',
    jobRelations: 'canonical/hero-job-relations.v1.json',
    jobRelationEvidence: 'evidence/source/jobs/hero-job-connection-hero-15-inherited.v1.json',
    jobTree: 'generated/hero-15-job-tree-internal.v1.json',
    portraitEvidence: 'evidence/source/portraits/hero-portrait-hero15.v1.json',
    portraitReferenceAdmission: 'docs/decisions/hero-15-portrait-canonical-reference-admission.v1.json',
    recordFieldCandidate: 'docs/decisions/hero-15-full-detail-record-field-candidate.v1.json',
    migrationDecision: 'docs/decisions/hero-full-detail-population-migration.v1.json',
    heroIndexDecision: 'docs/decisions/hero-index-publication.v1.json',
    equipmentRelations: 'canonical/hero-exclusive-equipment-relations.v1.json',
  };
  return Object.fromEntries(await Promise.all(Object.entries(paths).map(async ([key, path]) => [key, await readJson(root, path)])));
}

export function validateHero15FullDetailMigrationReadiness(input) {
  const { readiness: r, fullDetailCanonical, fullDetailGenerated, identities, identityEvidence,
    jobRelations, jobRelationEvidence, jobTree, portraitEvidence, portraitReferenceAdmission, migrationDecision,
    heroIndexDecision, equipmentRelations, recordFieldCandidate } = input ?? {};
  const applied = validateHero15CanonicalPopulation(fullDetailCanonical, migrationDecision, recordFieldCandidate?.record);
  const status = applied ? 'CANONICAL_RECORD_ADMITTED' : 'RECORD_DATA_NOT_READY';
  const authority = applied ? 'USER_CONFIRMED' : 'MANUAL_REVIEW';
  const evidence = applied ? 'VERIFIED_DIRECT_USER_MESSAGE' : 'NOT_VERIFIED';
  exactKeys(r, ['schemaVersion', 'artifactType', 'status', 'statusMeaning', 'baseline', 'target', 'fieldAssessments', 'gates', 'readinessBreakdown', 'migrationExecutionReady', 'publicationReady', 'populationInvariant', 'approval', 'limitations'], 'artifact');
  if (r.schemaVersion !== 1 || r.artifactType !== 'HERO_15_FULL_DETAIL_MIGRATION_READINESS' || r.status !== status
    || r.statusMeaning !== (applied
      ? 'The verified non-public Hero 15 candidate has been admitted into active Full Detail Canonical. Public Full Detail remains at 29.'
      : 'The non-public Hero 15 candidate is complete, but no Hero 15 record has been admitted into the active Full Detail Canonical population.')) fail('must remain a v1 readiness record with an explicit population-level status meaning');
  exactKeys(r.baseline, ['repository', 'baseRef', 'baseHead', 'mainHead', 'predecessorPullRequest'], 'baseline');
  if (r.baseline.repository !== 'LuceatLuxVestra42/Langrisser-2nd-test' || r.baseline.baseRef !== 'feat/hero15-population-portrait-gate-separation'
    || r.baseline.baseHead !== HERO_15_FULL_DETAIL_MIGRATION_READINESS_BASE || r.baseline.mainHead !== '6c46d8602ea5f4729e6fcabe6a07eaa222c52c3d' || r.baseline.predecessorPullRequest !== 261) fail('baseline or predecessor drift');
  exactKeys(r.target, ['heroId', 'desiredPopulationCount', 'effectivePopulationCount', 'recordSchemaOwner', 'requiredFields'], 'target');
  if (r.target.heroId !== 15 || r.target.desiredPopulationCount !== 30 || r.target.effectivePopulationCount !== (applied ? 30 : 29) || r.target.recordSchemaOwner !== 'canonical/heroes.v1.json'
    || !equal(r.target.requiredFields, ['id', 'nameEng', 'portrait', 'jobConnections', 'provenance'])) fail('target or required Full Detail schema drift');

  const generatedIds = fullDetailGenerated?.heroes?.map((row) => row.id);
  if (!equal(generatedIds, HERO_15_FULL_DETAIL_CURRENT_IDS)) fail('current Canonical/Generated 29-record population drift');
  const identity = identities?.records?.filter((row) => row.heroId === 15);
  const identitySource = identityEvidence?.records?.filter((row) => row.ID === 15);
  if (identity?.length !== 1 || identity[0].provenance !== 'evidence/source/configdata/ConfigDataHeroInfo.records-playable-identity.v1.json#ID=15'
    || identitySource?.length !== 1 || identitySource[0].Useable !== true || Object.hasOwn(identity[0], 'nameEng') || Object.hasOwn(identitySource[0], 'Name_Eng')) fail('Hero Identity evidence/field scope drift');
  if (recordFieldCandidate?.status !== 'CANDIDATE_RECORD_COMPLETE' || recordFieldCandidate?.target?.heroId !== 15
    || recordFieldCandidate?.target?.populationApplied !== false || recordFieldCandidate?.record?.id !== 15
    || recordFieldCandidate?.record?.nameEng !== 'Riana'
    || recordFieldCandidate?.record?.portrait !== 'assets/portraits/hero-15.png'
    || !equal(recordFieldCandidate?.record?.jobConnections, HERO_15_JOB_CONNECTIONS)
    || recordFieldCandidate?.effect?.canonicalPopulationMutation !== false
    || recordFieldCandidate?.effect?.fullDetailPublicationApproved !== false
    || recordFieldCandidate?.effect?.portraitPublicationApproved !== false
    || recordFieldCandidate?.effect?.publicBuildConsumption !== false) fail('complete field candidate is missing or has an effective/public effect');

  const byId = new Map((jobRelations?.records ?? []).filter((row) => row.heroId === 15).map((row) => [row.jobId, row]));
  const expectedJobs = HERO_15_JOB_CONNECTIONS.map((row) => row.jobId);
  if (byId.size !== HERO_15_JOB_CONNECTIONS.length || !equal([...byId.keys()], expectedJobs)
    || !equal(jobRelationEvidence?.selectedRelations?.map((row) => ({ connectionId: row.connectionId, jobId: row.jobId, sourceField: row.sourceField })), HERO_15_JOB_CONNECTIONS)
    || !equal(jobTree?.jobs?.map((row) => ({ connectionId: row.connectionId, jobId: row.jobId })), HERO_15_JOB_CONNECTIONS.map(({ connectionId, jobId }) => ({ connectionId, jobId })))) fail('Hero 15 direct Job relation evidence or internal projection drift');
  for (const row of HERO_15_JOB_CONNECTIONS) {
    const relation = byId.get(row.jobId);
    if (relation?.provenance !== `evidence/source/jobs/hero-job-connection-hero-15-inherited.v1.json#heroId=15&connectionId=${row.connectionId}`) fail(`Job relation provenance drift for ${row.jobId}`);
  }
  if (jobRelationEvidence?.claims?.heroFieldToConnection !== 'B' || jobRelationEvidence?.claims?.connectionToJob !== 'B'
    || jobRelationEvidence?.productionRuntimeDependency !== false) fail('inherited relation evidence scope drift');

  if (portraitEvidence?.canonical !== false || portraitEvidence?.generated !== false || portraitEvidence?.publicationApproved !== false
    || portraitEvidence?.admissionScope !== 'INTERNAL_HERO_PORTRAIT_ASSET_ONLY' || portraitEvidence?.asset?.path !== 'assets/portraits/hero-15.png') fail('Portrait must remain internal evidence without Canonical or publication approval');
  if (portraitReferenceAdmission?.status !== 'ADMITTED_INTERNAL_ONLY'
    || portraitReferenceAdmission?.claim?.heroId !== 15 || portraitReferenceAdmission?.claim?.field !== 'portrait'
    || portraitReferenceAdmission?.claim?.value !== 'assets/portraits/hero-15.png'
    || portraitReferenceAdmission?.claim?.canonicalRecordApplied !== false
    || portraitReferenceAdmission?.effect?.portraitPublicationApproved !== false
    || portraitReferenceAdmission?.effect?.publicBuildEligible !== false) fail('Portrait Canonical reference admission or public boundary drift');
  if (!equal(r.fieldAssessments, EXPECTED_FIELD_ASSESSMENTS)) fail('field evidence, provenance, or readiness classification drift');
  exactKeys(r.gates, ['identity', 'requiredFields', 'relations', 'portraitReferenceAdmission', 'provenance', 'canonicalSchema', 'populationContract', 'migrationApprovalAuthority', 'migrationApprovalEvidence', 'fullDetailFieldPublication', 'publicEligibility', 'frontend', 'hostedQa'], 'gates');
  if (r.gates?.identity !== 'PASS' || r.gates?.requiredFields !== 'PASS' || r.gates?.relations !== 'PASS'
    || r.gates?.portraitReferenceAdmission !== 'PASS' || r.gates?.provenance !== 'PASS'
    || r.gates?.canonicalSchema !== 'PASS' || r.gates?.populationContract !== 'PASS'
    || r.gates?.migrationApprovalAuthority !== authority || r.gates?.migrationApprovalEvidence !== evidence
    || r.gates?.fullDetailFieldPublication !== 'NOT_APPROVED' || r.gates?.publicEligibility !== 'NOT_APPROVED'
    || r.gates?.frontend !== 'NOT_READY' || r.gates?.hostedQa !== 'NOT_VERIFIED'
    || r.migrationExecutionReady !== applied || r.publicationReady !== false) fail('gate status is inconsistent or overclaims readiness');

  exactKeys(r.readinessBreakdown, ['fieldSourceAdmission', 'candidateRecordCompleteness', 'canonicalRecordOwnerAdmission', 'migrationApprovalAuthority', 'migrationApprovalEvidence', 'populationMutation', 'fullDetailPublication', 'portraitPublication', 'publicEligibility', 'publicBuild', 'frontend', 'hostedQa'], 'readinessBreakdown');
  if (!equal(r.readinessBreakdown, {
    fieldSourceAdmission: 'PASS',
    candidateRecordCompleteness: 'PASS',
    canonicalRecordOwnerAdmission: applied ? 'PASS' : 'NOT_READY',
    migrationApprovalAuthority: authority,
    migrationApprovalEvidence: evidence,
    populationMutation: migrationDecision.proposedMigration.applicationStatus,
    fullDetailPublication: 'NOT_APPROVED',
    portraitPublication: 'NOT_APPROVED',
    publicEligibility: 'NOT_APPROVED',
    publicBuild: 'NOT_READY',
    frontend: 'NOT_READY',
    hostedQa: 'NOT_VERIFIED',
  })) fail('readiness stage separation is inconsistent or overclaims a downstream gate');

  const indexIds = heroIndexDecision?.approvedScope?.heroIds;
  if (!Array.isArray(indexIds) || indexIds.length !== 267 || equipmentRelations?.records?.length !== 167) fail('Hero Index or Equipment Navigation preserved population mismatch');
  exactKeys(r.populationInvariant, ['publicGeneratedHeroIds', 'hero15PresentInCanonicalFullDetail', 'hero15PresentInGeneratedFullDetail', 'heroIndexCount', 'equipmentNavigationCount'], 'populationInvariant');
  if (!equal(r.populationInvariant.publicGeneratedHeroIds, HERO_15_FULL_DETAIL_CURRENT_IDS)
    || r.populationInvariant.hero15PresentInCanonicalFullDetail !== applied || r.populationInvariant.hero15PresentInGeneratedFullDetail !== false
    || r.populationInvariant.heroIndexCount !== 267 || r.populationInvariant.equipmentNavigationCount !== 167) fail('population invariant declaration drift');
  if (r.approval?.populationMigrationDecision !== 'docs/decisions/hero-full-detail-population-migration.v1.json'
    || r.approval?.status !== migrationDecision.status || r.approval?.authorityStatus !== authority
    || r.approval?.evidenceStatus !== migrationDecision.approval.evidenceStatus || r.approval?.effectEffective !== applied) fail('approval provenance was promoted or changed');
  if (!equal(r.limitations, [
    'The Migration Decision governs Canonical admission of the complete non-public candidate.',
    'The 29 baseline records and public Generated output are preserved.',
    'The candidate Portrait reference is internal-only; Asset Publication Approval remains independent from Population Migration.',
    'Hero 15 Full Detail Field Publication, Public Eligibility, Frontend reachability, and Hosted QA are not approved or verified by this artifact.',
  ])) fail('explicit readiness limitations drift');
  return true;
}

export async function validateHero15FullDetailMigrationReadinessFromRoot(root = process.cwd(), overrides = {}) {
  const input = { ...await loadHero15FullDetailMigrationReadinessInputs(root), ...overrides };
  return validateHero15FullDetailMigrationReadiness(input);
}
