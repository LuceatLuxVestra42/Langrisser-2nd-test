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
  nameEng: { status: 'CANDIDATE_FIELD_ADMITTED', ownerArtifact: 'canonical/heroes.v1.json', ownerLocator: 'id=15/nameEng', evidenceArtifact: 'evidence/source/configdata/ConfigDataHeroInfo.record-hero-15-name-eng.v1.json', evidenceLocator: '#claim/Name_Eng; source records[14]/ID=15/Name_Eng', sourceVersion: 'LuceatLuxVestra42/langrisser-future-guide@6475e63ee23d18adf733756c26a14fa9e3ed662c; ConfigData snapshot 2026-09-02; source SHA-256 2385599493d2598aa3f7d6b2c76ecdfd8615d91f19b6241933986282fcb17f7b', transformation: 'Exact source-field copy: Name_Eng=Riana, recorded only in the non-public record candidate.', scope: 'Source-native English name for HeroID 15 in the candidate record.', limitation: 'Not yet applied to canonical/heroes.v1.json; not a Korean localization or Publication Approval.' },
  portrait: { status: 'CANDIDATE_FIELD_ADMITTED_INTERNAL_ONLY', ownerArtifact: 'canonical/heroes.v1.json', ownerLocator: 'id=15/portrait', evidenceArtifact: 'evidence/source/portraits/hero-portrait-hero15.v1.json', evidenceLocator: '#source/heroInfo&charImageInfo; #asset/path', sourceVersion: 'LuceatLuxVestra42/langrisser-future-guide@6475e63ee23d18adf733756c26a14fa9e3ed662c; ConfigData snapshot 2026-09-02', transformation: 'Record the exact internally admitted asset path associated with the explicit HeroInfo.CharImage_ID to CharImageInfo.ID reference in the non-public candidate only.', scope: 'Candidate record Portrait reference; internal asset only.', limitation: 'Evidence remains canonical=false, generated=false, and publicationApproved=false. The candidate is not consumed by public projection or build.' },
  jobConnections: { status: 'CANDIDATE_PROJECTION_ADMITTED_INTERNAL_ONLY', ownerArtifact: 'canonical/hero-job-relations.v1.json', ownerLocator: 'heroId=15; jobId={802,803,806,703,811,707}', evidenceArtifact: 'evidence/source/jobs/hero-job-connection-hero-15-inherited.v1.json', evidenceLocator: '#selectedRelations[0..5]', sourceVersion: 'LuceatLuxVestra42/langrisser-future-guide@6475e63ee23d18adf733756c26a14fa9e3ed662c; ConfigData snapshot 2026-09-02', transformation: 'Project the six explicit connectionId/jobId/sourceField tuples in inherited source order and require exact parity with the already admitted Hero-to-Job Canonical relations.', scope: 'Six Hero 15 Job membership rows in the candidate only.', limitation: 'Candidate projection only; no additional relation, display name, advancement, unlock, or runtime rule is admitted. The projected values are not applied to canonical/heroes.v1.json.' },
  provenance: { status: 'COMPLETE_FOR_CANDIDATE_FIELDS', ownerArtifact: 'canonical/heroes.v1.json', ownerLocator: 'id=15/provenance', evidenceArtifact: 'docs/decisions/hero-15-full-detail-record-field-candidate.v1.json', evidenceLocator: '#record/provenance', sourceVersion: 'Claim-specific source versions are recorded on each candidate field assessment.', transformation: 'Compose field-level provenance references without merging their source scopes.', scope: 'All fields present in the complete non-public candidate record.', limitation: 'Candidate provenance is complete; the Canonical record and population remain unchanged.' },
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
    recordFieldCandidate: 'docs/decisions/hero-15-full-detail-record-field-candidate.v1.json',
    migrationDecision: 'docs/decisions/hero-full-detail-population-migration.v1.json',
    heroIndexDecision: 'docs/decisions/hero-index-publication.v1.json',
    equipmentRelations: 'canonical/hero-exclusive-equipment-relations.v1.json',
  };
  return Object.fromEntries(await Promise.all(Object.entries(paths).map(async ([key, path]) => [key, await readJson(root, path)])));
}

export function validateHero15FullDetailMigrationReadiness(input) {
  const { readiness: r, fullDetailCanonical, fullDetailGenerated, identities, identityEvidence,
    jobRelations, jobRelationEvidence, jobTree, portraitEvidence, migrationDecision,
    heroIndexDecision, equipmentRelations, recordFieldCandidate } = input ?? {};
  exactKeys(r, ['schemaVersion', 'artifactType', 'status', 'baseline', 'target', 'fieldAssessments', 'gates', 'migrationExecutionReady', 'publicationReady', 'populationInvariant', 'approval', 'limitations'], 'artifact');
  if (r.schemaVersion !== 1 || r.artifactType !== 'HERO_15_FULL_DETAIL_MIGRATION_READINESS' || r.status !== 'RECORD_DATA_NOT_READY') fail('must remain a v1 readiness record, not an admission or approval');
  exactKeys(r.baseline, ['repository', 'baseRef', 'baseHead', 'mainHead', 'predecessorPullRequest'], 'baseline');
  if (r.baseline.repository !== 'LuceatLuxVestra42/Langrisser-2nd-test' || r.baseline.baseRef !== 'feat/hero15-population-portrait-gate-separation'
    || r.baseline.baseHead !== HERO_15_FULL_DETAIL_MIGRATION_READINESS_BASE || r.baseline.mainHead !== '6c46d8602ea5f4729e6fcabe6a07eaa222c52c3d' || r.baseline.predecessorPullRequest !== 261) fail('baseline or predecessor drift');
  exactKeys(r.target, ['heroId', 'desiredPopulationCount', 'effectivePopulationCount', 'recordSchemaOwner', 'requiredFields'], 'target');
  if (r.target.heroId !== 15 || r.target.desiredPopulationCount !== 30 || r.target.effectivePopulationCount !== 29 || r.target.recordSchemaOwner !== 'canonical/heroes.v1.json'
    || !equal(r.target.requiredFields, ['id', 'nameEng', 'portrait', 'jobConnections', 'provenance'])) fail('target or required Full Detail schema drift');

  const canonicalIds = fullDetailCanonical?.records?.map((row) => row.id);
  const generatedIds = fullDetailGenerated?.heroes?.map((row) => row.id);
  if (!equal(canonicalIds, HERO_15_FULL_DETAIL_CURRENT_IDS) || !equal(generatedIds, HERO_15_FULL_DETAIL_CURRENT_IDS)) fail('current Canonical/Generated 29-record population drift');
  const identity = identities?.records?.filter((row) => row.heroId === 15);
  const identitySource = identityEvidence?.records?.filter((row) => row.ID === 15);
  if (identity?.length !== 1 || identity[0].provenance !== 'evidence/source/configdata/ConfigDataHeroInfo.records-playable-identity.v1.json#ID=15'
    || identitySource?.length !== 1 || identitySource[0].Useable !== true || Object.hasOwn(identity[0], 'nameEng') || Object.hasOwn(identitySource[0], 'Name_Eng')) fail('Hero Identity evidence/field scope drift');
  if (fullDetailCanonical.records.some((row) => row.id === 15) || fullDetailGenerated.heroes.some((row) => row.id === 15)) fail('Hero 15 must remain outside current Full Detail');
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
  if (migrationDecision?.status !== 'PROPOSED' || migrationDecision?.approval?.authorityStatus !== 'MANUAL_REVIEW'
    || migrationDecision?.approval?.evidenceStatus !== 'APPROVAL_EVIDENCE_NOT_VERIFIED' || migrationDecision?.effect?.effective !== false
    || migrationDecision?.proposedMigration?.applicationStatus !== 'NOT_EFFECTIVE') fail('migration authority/effect state was promoted');

  exactKeys(r.fieldAssessments, ['id', 'nameEng', 'portrait', 'jobConnections', 'provenance'], 'fieldAssessments');
  const fieldKeys = ['status', 'ownerArtifact', 'ownerLocator', 'evidenceArtifact', 'evidenceLocator', 'sourceVersion', 'transformation', 'scope', 'limitation'];
  for (const [field, assessment] of Object.entries(r.fieldAssessments)) exactKeys(assessment, fieldKeys, `fieldAssessments.${field}`);
  if (!equal(r.fieldAssessments, EXPECTED_FIELD_ASSESSMENTS)) fail('field evidence, provenance, or readiness classification drift');
  if (r.gates?.identity !== 'PASS' || r.gates?.requiredFields !== 'BLOCKED' || r.gates?.relations !== 'PARTIAL'
    || r.gates?.portraitReferenceAdmission !== 'MANUAL_REVIEW' || r.gates?.provenance !== 'PARTIAL'
    || r.gates?.canonicalSchema !== 'PASS' || r.gates?.populationContract !== 'PASS'
    || r.gates?.migrationApprovalAuthority !== 'MANUAL_REVIEW' || r.gates?.migrationApprovalEvidence !== 'NOT_VERIFIED'
    || r.gates?.fullDetailFieldPublication !== 'NOT_APPROVED' || r.gates?.publicEligibility !== 'NOT_APPROVED'
    || r.gates?.frontend !== 'NOT_READY' || r.gates?.hostedQa !== 'NOT_VERIFIED'
    || r.migrationExecutionReady !== false || r.publicationReady !== false) fail('gate status is inconsistent or overclaims readiness');

  const indexIds = heroIndexDecision?.approvedScope?.heroIds;
  if (!Array.isArray(indexIds) || indexIds.length !== 267 || equipmentRelations?.records?.length !== 167) fail('Hero Index or Equipment Navigation preserved population mismatch');
  exactKeys(r.populationInvariant, ['currentCanonicalAndGeneratedHeroIds', 'hero15PresentInCanonicalFullDetail', 'hero15PresentInGeneratedFullDetail', 'heroIndexCount', 'equipmentNavigationCount'], 'populationInvariant');
  if (!equal(r.populationInvariant.currentCanonicalAndGeneratedHeroIds, HERO_15_FULL_DETAIL_CURRENT_IDS)
    || r.populationInvariant.hero15PresentInCanonicalFullDetail !== false || r.populationInvariant.hero15PresentInGeneratedFullDetail !== false
    || r.populationInvariant.heroIndexCount !== 267 || r.populationInvariant.equipmentNavigationCount !== 167) fail('population invariant declaration drift');
  if (r.approval?.populationMigrationDecision !== 'docs/decisions/hero-full-detail-population-migration.v1.json'
    || r.approval?.status !== 'PROPOSED' || r.approval?.authorityStatus !== 'MANUAL_REVIEW'
    || r.approval?.evidenceStatus !== 'APPROVAL_EVIDENCE_NOT_VERIFIED' || r.approval?.effectEffective !== false) fail('approval provenance was promoted or changed');
  if (!equal(r.limitations, [
    'The non-public Hero 15 candidate records complete field-level claims; it does not add a Canonical record, approve publication, or change population.',
    'The existing 29 Full Detail records and their generated counterparts remain unchanged.',
    'The candidate Portrait reference is internal-only; Asset Publication Approval remains independent from Population Migration.',
    'Hero 15 Full Detail Field Publication, Public Eligibility, Frontend reachability, and Hosted QA are not approved or verified by this artifact.',
  ])) fail('explicit readiness limitations drift');
  return true;
}

export async function validateHero15FullDetailMigrationReadinessFromRoot(root = process.cwd(), overrides = {}) {
  const input = { ...await loadHero15FullDetailMigrationReadinessInputs(root), ...overrides };
  return validateHero15FullDetailMigrationReadiness(input);
}
