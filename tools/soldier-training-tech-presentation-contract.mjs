export const TRAINING_TECH_DECISION_RECORD_PATH = 'docs/decisions/pr137-training-tech-223-presentation.v1.json';
export const TRAINING_TECH_CONTRACT_ID = 'soldier-training-tech-description-presentation.v1';
export const TRAINING_TECH_CONTRACT_VERSION = 1;
export const TRAINING_TECH_DECISION_IDS = [
  'PR137-TT223-DECISION-A-v1',
  'PR137-TT223-DECISION-B-v1',
];
export const TRAINING_TECH_PUBLIC_SURFACES = [
  'soldier_card_ui',
  'build_generated_json',
  'hosted_direct_json',
  'public_github_source',
];
export const TRAINING_TECH_EXPECTED_SCOPE = {
  repository: 'LuceatLuxVestra42/Langrisser-2nd-test',
  sourceRepository: 'LuceatLuxVestra42/langrisser-future-guide',
  sourceCommit: '6475e63ee23d18adf733756c26a14fa9e3ed662c',
  trainingTechId: 223,
  levelInfoIds: [2230, 2231, 2232, 2233, 2234, 2235, 2236, 2237, 2238, 2239],
  variants: [
    { variant: 'NORMAL', soldierId: 115, sourceField: 'Description', count: 10 },
    { variant: 'SP', soldierId: 5115, sourceField: 'SpSoidlierDescription', count: 10 },
  ],
  totalRecords: 20,
};

const fail = (message) => { throw new Error(`TrainingTech presentation contract: ${message}`); };

export function validateTrainingTechDecisionRecord(record) {
  if (record?.schemaVersion !== 1 || record.decisionRecordId !== 'PR137-TT223-PRESENTATION-DECISIONS-v1'
    || record.repository !== TRAINING_TECH_EXPECTED_SCOPE.repository
    || record.recordLocation !== TRAINING_TECH_DECISION_RECORD_PATH) fail('decision record identity mismatch');
  if (record.contract?.id !== TRAINING_TECH_CONTRACT_ID || record.contract.version !== TRAINING_TECH_CONTRACT_VERSION
    || !['APPROVED', 'NOT_APPROVED'].includes(record.contract.approvalStatus)
    || !['EFFECTIVE', 'APPROVED_ONLY', 'PROPOSED', 'REVOKED'].includes(record.contract.effectivenessStatus)) fail('contract approval/effectiveness state mismatch');
  if (record.decisionMaker?.role !== 'Project Principal Decision-Maker'
    || typeof record.decisionMaker.authorityBasis !== 'string' || !record.decisionMaker.authorityBasis.trim()
    || !/^\d{4}-\d{2}-\d{2}$/.test(record.decisionMaker.recordedDate)
    || typeof record.decisionMaker.identity !== 'string' || typeof record.decisionMaker.decisionDate !== 'string') fail('decision-maker authority record is malformed');
  if (JSON.stringify(record.source) !== JSON.stringify({
    repository: TRAINING_TECH_EXPECTED_SCOPE.sourceRepository,
    commit: TRAINING_TECH_EXPECTED_SCOPE.sourceCommit,
  }) || JSON.stringify(record.claimScope) !== JSON.stringify({
    trainingTechId: TRAINING_TECH_EXPECTED_SCOPE.trainingTechId,
    levelInfoIds: TRAINING_TECH_EXPECTED_SCOPE.levelInfoIds,
    variants: TRAINING_TECH_EXPECTED_SCOPE.variants,
    totalRecords: TRAINING_TECH_EXPECTED_SCOPE.totalRecords,
  })) fail('source pin or exact claim scope mismatch');
  if (record.decisionA?.id !== TRAINING_TECH_DECISION_IDS[0]
    || !['APPROVED', 'NOT_APPROVED'].includes(record.decisionA.status)
    || record.decisionA.resolution !== 'A2_WITH_MINIMAL_A1_RECONCILIATION'
    || record.decisionA.canonicalExclusionBefore !== 'Frontend display'
    || record.decisionA.evidenceExclusionBefore !== 'Generated or frontend presentation'
    || typeof record.decisionA.canonicalReconciliation !== 'string' || !record.decisionA.canonicalReconciliation.trim()
    || typeof record.decisionA.evidenceReconciliation !== 'string' || !record.decisionA.evidenceReconciliation.trim()
    || typeof record.decisionA.semanticInvariant !== 'string' || !record.decisionA.semanticInvariant.trim()) fail('Decision A record mismatch');
  if (record.decisionB?.id !== TRAINING_TECH_DECISION_IDS[1]
    || !['APPROVED', 'NOT_APPROVED'].includes(record.decisionB.status)
    || JSON.stringify(record.decisionB.publicSurfaces) !== JSON.stringify(TRAINING_TECH_PUBLIC_SURFACES)
    || !Array.isArray(record.decisionB.requiredDisclosures) || record.decisionB.requiredDisclosures.length !== 3
    || typeof record.decisionB.rendering !== 'string' || !record.decisionB.rendering.trim()
    || typeof record.decisionB.scopeExpansion !== 'string' || !record.decisionB.scopeExpansion.trim()) fail('Decision B record mismatch');
  if (!record.revocation || !['NOT_REVOKED', 'REVOKED'].includes(record.revocation.status)
    || !Array.isArray(record.revocation.reviewConditions) || record.revocation.reviewConditions.length < 2) fail('revocation policy missing');
  if (!Array.isArray(record.owningValidators) || !record.owningValidators.includes('tools/validate-soldier-training-tech-presentation.mjs')
    || !record.owningValidators.includes('tools/build.mjs')) fail('owning validator references missing');
  const decisionsApproved = record.decisionA.status === 'APPROVED' && record.decisionB.status === 'APPROVED'
    && record.contract.approvalStatus === 'APPROVED';
  const effective = decisionsApproved && record.contract.effectivenessStatus === 'EFFECTIVE'
    && record.revocation.status === 'NOT_REVOKED';
  if (!decisionsApproved && record.contract.effectivenessStatus !== 'PROPOSED') fail('unapproved decisions must remain in PROPOSED state');
  if (decisionsApproved && record.contract.effectivenessStatus === 'PROPOSED') fail('approved decisions cannot be marked PROPOSED');
  if (decisionsApproved && record.revocation.status === 'NOT_REVOKED'
    && !['EFFECTIVE', 'APPROVED_ONLY'].includes(record.contract.effectivenessStatus)) fail('approved contract state mismatch');
  if (record.contract.effectivenessStatus === 'EFFECTIVE' && !effective) fail('effective contract lacks both approvals or is revoked');
  if (record.contract.effectivenessStatus === 'REVOKED' && record.revocation.status !== 'REVOKED') fail('revoked contract lacks revocation record');
  return { decisionsApproved, effective, revoked: record.revocation.status === 'REVOKED' };
}

export function makeTrainingTechContractEnvelope(record) {
  const state = validateTrainingTechDecisionRecord(record);
  const status = state.revoked ? 'REVOKED' : state.effective ? 'EFFECTIVE'
    : state.decisionsApproved ? 'APPROVED' : 'PROPOSED';
  return {
    id: TRAINING_TECH_CONTRACT_ID,
    version: TRAINING_TECH_CONTRACT_VERSION,
    status,
    approved: state.decisionsApproved,
    effective: state.effective,
    decisionRecord: TRAINING_TECH_DECISION_RECORD_PATH,
    decisionIds: TRAINING_TECH_DECISION_IDS,
    publicSurfaces: TRAINING_TECH_PUBLIC_SURFACES,
  };
}

export function shouldPublishTrainingTechDirectJson(record) {
  const state = validateTrainingTechDecisionRecord(record);
  return state.effective && record.decisionB.publicSurfaces.includes('build_generated_json')
    && record.decisionB.publicSurfaces.includes('hosted_direct_json');
}
