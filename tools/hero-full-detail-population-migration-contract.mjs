import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const HERO_FULL_DETAIL_POPULATION_MIGRATION_PATH = 'docs/decisions/hero-full-detail-population-migration.v1.json';
export const HERO_FULL_DETAIL_BASELINE_HEAD = '6c46d8602ea5f4729e6fcabe6a07eaa222c52c3d';
export const HERO_FULL_DETAIL_CURRENT_IDS = [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 25, 26, 27, 28, 29, 32, 33, 37, 40, 52, 53, 55, 56, 60, 67, 89];

const fail = (message) => { throw new Error(`Hero Full Detail population migration: ${message}`); };
const equal = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const idsOf = (rows, key, label) => {
  if (!Array.isArray(rows)) fail(`${label} records must be an array`);
  const ids = rows.map((row) => row?.[key]);
  if (ids.some((id) => !Number.isSafeInteger(id))) fail(`${label} contains a missing or invalid ID`);
  if (new Set(ids).size !== ids.length) fail(`${label} contains duplicate IDs`);
  return ids;
};
const sha256 = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const exactKeys = (value, keys, label) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || !equal(Object.keys(value).sort(), [...keys].sort())) fail(`${label} fields differ from the contract`);
};

export function validateHeroFullDetailPopulationMigration({ decision, canonical, generated, heroIndexDecision, hero15IntegratedDecision, hero15TalentDecision }) {
  exactKeys(decision, ['schemaVersion', 'decisionType', 'status', 'baseline', 'currentPopulation', 'proposedMigration', 'populationBoundaries', 'preservedDecisions', 'portraitSchemaGate', 'approval', 'effect'], 'decision');
  if (decision.schemaVersion !== 1 || decision.decisionType !== 'HERO_FULL_DETAIL_POPULATION_MIGRATION' || decision.status !== 'PROPOSED') fail('decision must remain v1 PROPOSED');

  const baseline = decision.baseline;
  exactKeys(baseline, ['repository', 'baseRef', 'baseHead'], 'baseline');
  if (baseline.repository !== 'LuceatLuxVestra42/Langrisser-2nd-test' || baseline.baseRef !== 'main' || baseline.baseHead !== HERO_FULL_DETAIL_BASELINE_HEAD) fail('baseline identity drift');

  const current = decision.currentPopulation;
  exactKeys(current, ['count', 'heroIds', 'recordSnapshotHashMethod', 'canonicalRecordsSha256', 'generatedRecordsSha256'], 'currentPopulation');
  const canonicalIds = idsOf(canonical?.records, 'id', 'Canonical Full Detail');
  const generatedIds = idsOf(generated?.heroes, 'id', 'Generated Full Detail');
  const indexIds = heroIndexDecision?.approvedScope?.detailHeroIds;
  if (!equal(canonicalIds, HERO_FULL_DETAIL_CURRENT_IDS) || !equal(generatedIds, HERO_FULL_DETAIL_CURRENT_IDS) || !equal(indexIds, HERO_FULL_DETAIL_CURRENT_IDS)) fail('current Canonical, Generated, and approved Full Detail sets must preserve the exact 29 IDs and order');
  if (current.count !== 29 || !equal(current.heroIds, HERO_FULL_DETAIL_CURRENT_IDS)
    || current.recordSnapshotHashMethod !== 'SHA-256 of UTF-8 JSON.stringify(record array), preserving parsed record and property order') fail('Decision current population must be the exact existing 29 IDs with a declared snapshot method');
  if (sha256(canonical.records) !== current.canonicalRecordsSha256) fail('Canonical baseline record snapshot changed');
  if (sha256(generated.heroes) !== current.generatedRecordsSha256) fail('Generated baseline record snapshot changed');

  exactKeys(decision.proposedMigration, ['heroId', 'targetHeroIds', 'targetCount', 'applicationStatus', 'fullDetailPublicationStatus', 'publicEligibilityStatus', 'frontendReachability'], 'proposedMigration');
  const targetIds = [...HERO_FULL_DETAIL_CURRENT_IDS, 15];
  if (decision.proposedMigration.heroId !== 15 || !equal(decision.proposedMigration.targetHeroIds, targetIds) || decision.proposedMigration.targetCount !== 30) fail('proposed target must be exactly the existing 29 plus Hero 15');
  if (decision.proposedMigration.applicationStatus !== 'NOT_EFFECTIVE' || decision.proposedMigration.fullDetailPublicationStatus !== 'NOT_APPROVED' || decision.proposedMigration.publicEligibilityStatus !== 'NOT_APPROVED' || decision.proposedMigration.frontendReachability?.currentFullDetail !== false || decision.proposedMigration.frontendReachability?.currentMinimalDetail !== true) fail('proposal must not claim migration/publication or change current route reachability');
  exactKeys(decision.proposedMigration.frontendReachability, ['currentFullDetail', 'currentMinimalDetail', 'minimalDetailFragment'], 'frontendReachability');
  if (decision.proposedMigration.frontendReachability.minimalDetailFragment !== 'hero-minimal-detail-15') fail('existing Hero 15 Minimal Detail route must remain the only confirmed reachability');

  exactKeys(decision.populationBoundaries, ['canonical', 'generated', 'publicationEligible', 'publicBuild', 'frontendFullDetail'], 'populationBoundaries');
  for (const [name, boundary] of Object.entries(decision.populationBoundaries)) {
    exactKeys(boundary, ['currentHeroIds', 'count', 'hero15State'], `populationBoundaries.${name}`);
    if (!equal(boundary.currentHeroIds, HERO_FULL_DETAIL_CURRENT_IDS) || boundary.count !== 29 || boundary.hero15State !== 'EXCLUDED') fail(`${name} boundary must preserve the current 29 and exclude Hero 15`);
  }

  exactKeys(decision.preservedDecisions, ['hero15IntegratedDecision', 'hero15TalentDecision', 'heroIndexPopulation', 'exclusiveEquipmentNavigationPopulation', 'existingFullDetailPopulation'], 'preservedDecisions');
  if (decision.preservedDecisions.hero15IntegratedDecision !== 'docs/decisions/hero-15-integrated-publication.v1.json'
    || decision.preservedDecisions.hero15TalentDecision !== 'docs/decisions/hero-15-talent-publication.v1.json'
    || decision.preservedDecisions.heroIndexPopulation !== 267
    || decision.preservedDecisions.exclusiveEquipmentNavigationPopulation !== 167
    || decision.preservedDecisions.existingFullDetailPopulation !== 29) fail('preservation references or counts drift');
  if (hero15IntegratedDecision?.status !== 'APPROVED' || hero15IntegratedDecision?.approvedScope?.preservedPopulations?.fullHeroDetail !== 29
    || hero15IntegratedDecision?.approvedScope?.heroIndexNavigation?.fragment !== 'hero-minimal-detail-15'
    || hero15TalentDecision?.status !== 'APPROVED' || hero15TalentDecision?.approvedScope?.surface !== 'hero-minimal-detail-15'
    || !hero15TalentDecision?.approvedScope?.excluded?.includes('Hero Full Detail')) fail('existing Hero 15 approval scope was changed or widened');

  exactKeys(decision.portraitSchemaGate, ['status', 'canonicalHeroSchemaFields', 'publicProjectionContract', 'hero15PortraitPublicationApproved', 'requiredBeforeMigration'], 'portraitSchemaGate');
  exactKeys(decision.portraitSchemaGate.publicProjectionContract, ['artifact', 'generatedField', 'absenceRepresentation', 'preservedExistingPublicPortraitHeroCount', 'unapprovedNewHeroPortraitDefault', 'canonicalSchemaChanged', 'populationMigrationRequiresPortraitPublicationApproval', 'publicPortraitExposureRequiresPublicationApproval', 'canonicalPortraitReferenceRequiresOwnerAdmission'], 'portraitSchemaGate.publicProjectionContract');
  if (decision.portraitSchemaGate.status !== 'PUBLIC_PROJECTION_OPTIONAL_PORTRAIT_CONTRACT_IMPLEMENTED'
    || !equal(decision.portraitSchemaGate.canonicalHeroSchemaFields, ['id', 'nameEng', 'portrait', 'jobConnections', 'provenance'])
    || decision.portraitSchemaGate.publicProjectionContract.artifact !== 'tools/full-detail-portrait-projection-contract.mjs'
    || decision.portraitSchemaGate.publicProjectionContract.generatedField !== 'portrait'
    || decision.portraitSchemaGate.publicProjectionContract.absenceRepresentation !== 'OMIT_FIELD'
    || decision.portraitSchemaGate.publicProjectionContract.preservedExistingPublicPortraitHeroCount !== 29
    || decision.portraitSchemaGate.publicProjectionContract.unapprovedNewHeroPortraitDefault !== 'WITHHELD_UNTIL_FIELD_SPECIFIC_ASSET_PUBLICATION_APPROVAL'
    || decision.portraitSchemaGate.publicProjectionContract.canonicalSchemaChanged !== false
    || decision.portraitSchemaGate.publicProjectionContract.populationMigrationRequiresPortraitPublicationApproval !== false
    || decision.portraitSchemaGate.publicProjectionContract.publicPortraitExposureRequiresPublicationApproval !== true
    || decision.portraitSchemaGate.publicProjectionContract.canonicalPortraitReferenceRequiresOwnerAdmission !== true
    || decision.portraitSchemaGate.hero15PortraitPublicationApproved !== false
    || !equal(decision.portraitSchemaGate.requiredBeforeMigration, ['Hero 15 Canonical Full Detail record must satisfy required fields through Owner-admitted claims, including any required portrait reference; this is separate from Portrait public publication approval'])) fail('Portrait/schema prerequisite gate was weakened');

  exactKeys(decision.approval, ['status', 'authorityStatus', 'evidenceStatus', 'source', 'scope'], 'approval');
  exactKeys(decision.approval.source, ['kind', 'originalMessageIdOrUrl'], 'approval.source');
  if (decision.approval.status !== 'NOT_CONFIRMED' || decision.approval.authorityStatus !== 'MANUAL_REVIEW' || decision.approval.evidenceStatus !== 'APPROVAL_EVIDENCE_NOT_VERIFIED'
    || decision.approval.source?.kind !== 'USER_SUPPLIED_EXECUTION_INSTRUCTION_SUMMARY'
    || decision.approval.source?.originalMessageIdOrUrl !== 'NOT_AVAILABLE'
    || decision.approval.scope !== 'PROPOSED_COMMON_POPULATION_EXPANSION_TO_ADD_HERO_15_ONLY') fail('approval must not be promoted without independently verified source and authority');
  if (decision.effect?.effective !== false || decision.effect?.condition !== 'Canonical or Generated population changes require verified Population Migration authority/evidence and Owner-admitted required Canonical fields. Public Build and Frontend inclusion require separate Full Detail publication and Public Eligibility decisions. Portrait field, asset inclusion, and visibility require separate field-specific Portrait publication approval; otherwise the public projection omits portrait.') fail('Decision must remain non-effective and preserve independent population/publication gates');
  exactKeys(decision.effect, ['effective', 'condition', 'reviewWhen'], 'effect');
  return true;
}

export async function validateHeroFullDetailPopulationMigrationFromRoot(root = process.cwd()) {
  const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
  const [decision, canonical, generated, heroIndexDecision, hero15IntegratedDecision, hero15TalentDecision] = await Promise.all([
    readJson(HERO_FULL_DETAIL_POPULATION_MIGRATION_PATH),
    readJson('canonical/heroes.v1.json'),
    readJson('generated/hero-slice.v1.json'),
    readJson('docs/decisions/hero-index-publication.v1.json'),
    readJson('docs/decisions/hero-15-integrated-publication.v1.json'),
    readJson('docs/decisions/hero-15-talent-publication.v1.json'),
  ]);
  return validateHeroFullDetailPopulationMigration({ decision, canonical, generated, heroIndexDecision, hero15IntegratedDecision, hero15TalentDecision });
}
