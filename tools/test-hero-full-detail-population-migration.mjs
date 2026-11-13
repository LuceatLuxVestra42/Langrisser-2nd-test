import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  validateHeroFullDetailPopulationMigration,
  validateHeroFullDetailPopulationMigrationFromRoot,
} from './hero-full-detail-population-migration-contract.mjs';

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const [decision, canonical, generated, heroIndexDecision, hero15IntegratedDecision, hero15TalentDecision] = await Promise.all([
  readJson('docs/decisions/hero-full-detail-population-migration.v1.json'),
  readJson('canonical/heroes.v1.json'),
  readJson('generated/hero-slice.v1.json'),
  readJson('docs/decisions/hero-index-publication.v1.json'),
  readJson('docs/decisions/hero-15-integrated-publication.v1.json'),
  readJson('docs/decisions/hero-15-talent-publication.v1.json'),
]);
const input = () => structuredClone({ decision, canonical, generated, heroIndexDecision, hero15IntegratedDecision, hero15TalentDecision });
const rejects = (mutate, message) => {
  const fixture = input();
  mutate(fixture);
  assert.throws(() => validateHeroFullDetailPopulationMigration(fixture), message);
};

assert.equal(await validateHeroFullDetailPopulationMigrationFromRoot(), true);
assert.equal(validateHeroFullDetailPopulationMigration(input()), true);

rejects((x) => { x.canonical.records.splice(0, 1); }, /exact 29 IDs/);
rejects((x) => { x.canonical.records[0].id = 2; }, /exact 29 IDs/);
rejects((x) => { x.canonical.records[0].nameEng = 'Tampered'; }, /Canonical baseline record snapshot changed/);
rejects((x) => { x.generated.heroes[0].nameEng = 'Tampered'; }, /Generated baseline record snapshot changed/);
rejects((x) => { x.generated.heroes.push(structuredClone(x.generated.heroes[0])); }, /duplicate IDs/);
rejects((x) => { x.heroIndexDecision.approvedScope.detailHeroIds.pop(); }, /exact 29 IDs/);
rejects((x) => { x.decision.currentPopulation.heroIds.pop(); }, /exact existing 29 IDs/);
rejects((x) => { x.decision.proposedMigration.targetHeroIds.push(16); }, /exactly the existing 29 plus Hero 15/);
rejects((x) => { x.decision.proposedMigration.heroId = 16; }, /exactly the existing 29 plus Hero 15/);
rejects((x) => { x.decision.proposedMigration.applicationStatus = 'EFFECTIVE'; }, /must remain v1 PROPOSED|must not claim migration/);
rejects((x) => { x.decision.proposedMigration.fullDetailPublicationStatus = 'APPROVED'; }, /must not claim migration/);
rejects((x) => { x.decision.proposedMigration.publicEligibilityStatus = 'APPROVED'; }, /must not claim migration/);
rejects((x) => { x.decision.proposedMigration.frontendReachability.currentFullDetail = true; }, /route reachability/);
rejects((x) => { x.decision.proposedMigration.frontendReachability.minimalDetailFragment = 'hero-full-detail-15'; }, /only confirmed reachability/);
rejects((x) => { x.decision.populationBoundaries.canonical.currentHeroIds.push(15); }, /canonical boundary/);
rejects((x) => { x.decision.preservedDecisions.heroIndexPopulation = 268; }, /preservation references or counts drift/);
rejects((x) => { x.hero15IntegratedDecision.approvedScope.preservedPopulations.fullHeroDetail = 30; }, /existing Hero 15 approval scope/);
rejects((x) => { x.hero15TalentDecision.approvedScope.surface = 'HERO_FULL_DETAIL'; }, /existing Hero 15 approval scope/);
rejects((x) => { x.decision.portraitSchemaGate.hero15PortraitPublicationApproved = true; }, /Portrait\/schema prerequisite gate/);
rejects((x) => { x.decision.approval.status = 'USER_APPROVED_SCOPE'; }, /approval must not be promoted/);
rejects((x) => { x.decision.approval.authorityStatus = 'APPROVED'; }, /approval must not be promoted/);
rejects((x) => { x.decision.approval.evidenceStatus = 'VERIFIED'; }, /approval must not be promoted/);
rejects((x) => { x.decision.approval.source.originalMessageIdOrUrl = 'https://example.invalid/fabricated'; }, /approval must not be promoted/);
rejects((x) => { x.decision.approval.source.recordedAtDate = '2026-11-13'; }, /approval\.source fields differ/);
rejects((x) => { x.decision.approval.evidenceStatus = 'APPROVAL_EVIDENCE_NOT_VERIFIED'; x.decision.status = 'APPROVED'; }, /must remain v1 PROPOSED/);
rejects((x) => { x.decision.effect.effective = true; }, /Decision must remain non-effective/);

process.stdout.write('Hero Full Detail population migration contract tests: PASS (positive parity and 25 negative boundary cases)\n');
