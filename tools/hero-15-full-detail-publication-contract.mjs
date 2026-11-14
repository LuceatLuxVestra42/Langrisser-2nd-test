import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const HERO_15_FULL_DETAIL_PUBLICATION_PATH = 'docs/decisions/hero-15-full-detail-publication.v1.json';
export const HERO_15_FULL_DETAIL_POPULATION_MIGRATION_PATH = 'docs/decisions/hero-full-detail-population-migration.v1.json';
export const HERO_15_FULL_DETAIL_BASE_HEAD = 'b399d7bc8e60620d30e6ce0b1ceecd3854e81457';
export const HERO_15_FULL_DETAIL_GROUP_IDS = [
  'profile', 'portraitSkin', 'talent', 'exclusiveEquipment', 'fetterBond', 'soldierCommand',
  'centralDiscipline', 'castingLaw', 'soldier', 'jobTree', 'jobLevelStats', 'skill', 'awakening', 'sp',
];
const CANDIDATE_FIELDS = {
  profile: ['heroId','nameKo','rarity.rankId','rarity.label','factions[].factionId','factions[].nameCn','factions[].nameKo','origins[].productionId','origins[].nameCn','origins[].nameKo'],
  portraitSkin: [],
  talent: ['talent.nameKo','talent.stars[].star','talent.stars[].skillId','talent.stars[].descriptionKo','talent.stars[].nameCn','talent.stars[].descriptionCn'],
  exclusiveEquipment: ['equipment.relation.heroId','equipment.equipmentId','equipment.nameKo','equipment.effectDescriptionKo'],
  fetterBond: ['fetters[].fetterId','heartFetter.fetterId'],
  soldierCommand: [], centralDiscipline: [],
  castingLaw: ['castingLaw.templates[].templateId','castingLaw.templates[].levels[].levelUpInfoId'],
  soldier: ['soldiers[].soldierId','soldiers[].nameKo','soldiers[].variant'],
  jobTree: ['jobs[].connectionId','jobs[].jobId','jobs[].advancementEdges[]'],
  jobLevelStats: ['jobLevels[].jobLevelId','jobLevels[].rawStats'],
  skill: ['skills[].skillId','skills[].nameCn','skills[].descriptionCn'],
  awakening: ['awakening.stages[].levelId','awakening.stages[].skillId','awakening.stages[].materials'], sp: [],
};
const WITHHELD_FIELDS = {
  profile: ['cv'], portraitSkin: ['portrait.assetPath','skins[].skinId','skins[].nameKo','skins[].assetPath','skins[].acquisitionDescription'], talent: [],
  exclusiveEquipment: ['equipment.assetPath'], fetterBond: ['fetters[].conditions','fetters[].materials','fetters[].rewards','heartFetter.conditions','heartFetter.materials','heartFetter.rewards'],
  soldierCommand: ['soldierCommand.baseModifiers','soldierCommand.centralBondContribution','soldierCommand.finalModifiers'], centralDiscipline: ['centralDiscipline.skillId','centralDiscipline.effects'],
  castingLaw: ['castingLaw.templates[].levels[].materials','castingLaw.templates[].levels[].rawProperties','castingLaw.templates[].effects'],
  soldier: ['soldiers[].card','soldiers[].details','soldiers[].availability'], jobTree: ['jobs[].nameKo for jobId=811','jobs[].nameKo for jobId=707'],
  jobLevelStats: ['jobLevels[].finalDisplayStats'], skill: ['skills[].nameKo','skills[].descriptionKo','skills[].acquisition','skills[].equipability','skills[].cooldown','skills[].range'],
  awakening: [], sp: ['sp.jobId','sp.jobNameKo','sp.talent','sp.missions','sp.rewards','sp.dungeon'],
};
const GROUP_GATE_STATUS = {
  profile: ['PARTIAL','PARTIAL','NOT_REQUIRED'], portraitSkin: ['PARTIAL','NOT_ADMITTED','INTERNAL_ONLY_NOT_PUBLICATION_APPROVED'],
  talent: ['ADMITTED','ADMITTED_OFFICIAL_KR_UNVERIFIED','NOT_REQUIRED'], exclusiveEquipment: ['ADMITTED','ADMITTED_EXISTING_SURFACE_ONLY','NOT_REQUIRED'],
  fetterBond: ['PARTIAL','NOT_ADMITTED','NOT_REQUIRED'], soldierCommand: ['NOT_ADMITTED','NOT_ADMITTED','NOT_REQUIRED'],
  centralDiscipline: ['NOT_ADMITTED','NOT_ADMITTED','NOT_REQUIRED'], castingLaw: ['PARTIAL','NOT_ADMITTED','NOT_REQUIRED'],
  soldier: ['ADMITTED','ADMITTED_14_DISPLAY_LABELS','NOT_REQUIRED'], jobTree: ['PARTIAL','PARTIAL_4_OF_6','NOT_REQUIRED'],
  jobLevelStats: ['ADMITTED','PARTIAL','NOT_REQUIRED'], skill: ['PARTIAL','NOT_ADMITTED','NOT_REQUIRED'],
  awakening: ['PARTIAL','NOT_ADMITTED','NOT_REQUIRED'], sp: ['NOT_VERIFIED','NOT_VERIFIED','NOT_REQUIRED'],
};

export const HERO_15_FULL_DETAIL_TARGET_SCHEMA = [
  { id: 'profile', fields: ['heroId', 'nameKo', 'rarity.rankId', 'rarity.label', 'factions[].factionId', 'factions[].nameCn', 'factions[].nameKo', 'origins[].productionId', 'origins[].nameCn', 'origins[].nameKo', 'cv'] },
  { id: 'portraitSkin', fields: ['portrait.assetPath', 'skins[].skinId', 'skins[].nameKo', 'skins[].assetPath', 'skins[].acquisitionDescription'] },
  { id: 'talent', fields: ['talent.nameKo', 'talent.stars[].star', 'talent.stars[].skillId', 'talent.stars[].descriptionKo', 'talent.stars[].nameCn', 'talent.stars[].descriptionCn'] },
  { id: 'exclusiveEquipment', fields: ['equipment.relation.heroId', 'equipment.equipmentId', 'equipment.nameKo', 'equipment.effectDescriptionKo', 'equipment.assetPath'] },
  { id: 'fetterBond', fields: ['fetters[].fetterId', 'fetters[].conditions', 'fetters[].materials', 'fetters[].rewards', 'heartFetter.fetterId', 'heartFetter.conditions', 'heartFetter.materials', 'heartFetter.rewards'] },
  { id: 'soldierCommand', fields: ['soldierCommand.baseModifiers', 'soldierCommand.centralBondContribution', 'soldierCommand.finalModifiers'] },
  { id: 'centralDiscipline', fields: ['centralDiscipline.skillId', 'centralDiscipline.effects'] },
  { id: 'castingLaw', fields: ['castingLaw.templates[].templateId', 'castingLaw.templates[].levels[].levelUpInfoId', 'castingLaw.templates[].levels[].materials', 'castingLaw.templates[].levels[].rawProperties', 'castingLaw.templates[].effects'] },
  { id: 'soldier', fields: ['soldiers[].soldierId', 'soldiers[].nameKo', 'soldiers[].variant', 'soldiers[].card', 'soldiers[].details', 'soldiers[].availability'] },
  { id: 'jobTree', fields: ['jobs[].connectionId', 'jobs[].jobId', 'jobs[].nameKo', 'jobs[].advancementEdges[]'] },
  { id: 'jobLevelStats', fields: ['jobLevels[].jobLevelId', 'jobLevels[].rawStats', 'jobLevels[].finalDisplayStats'] },
  { id: 'skill', fields: ['skills[].skillId', 'skills[].nameKo', 'skills[].descriptionKo', 'skills[].nameCn', 'skills[].descriptionCn', 'skills[].acquisition', 'skills[].equipability', 'skills[].cooldown', 'skills[].range'] },
  { id: 'awakening', fields: ['awakening.stages[].levelId', 'awakening.stages[].skillId', 'awakening.stages[].materials'] },
  { id: 'sp', fields: ['sp.jobId', 'sp.jobNameKo', 'sp.talent', 'sp.missions', 'sp.rewards', 'sp.dungeon'] },
];

const fail = (message) => { throw new Error(`Hero 15 Full Detail Publication contract: ${message}`); };
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const exactKeys = (value, keys, label) => {
  if (!value || typeof value !== 'object' || Array.isArray(value) || !equal(Object.keys(value).sort(), [...keys].sort())) fail(`${label} fields differ from the contract`);
};
const findOne = (rows, predicate, label) => {
  const found = rows.filter(predicate);
  if (found.length !== 1) fail(`${label} expected exactly one matching record; received ${found.length}`);
  return found[0];
};
const ids = (rows, field, predicate = () => true) => rows.filter(predicate).map((row) => row[field]);
const claimIds = (group, artifact) => {
  const found = group.canonicalClaims.filter((claim) => claim.artifact === artifact);
  if (found.length !== 1) fail(`${group.id} must contain one source trace for ${artifact}`);
  return found[0].claimIds;
};
const ensureGroup = (group, expectedId) => {
  exactKeys(group, ['id', 'admissionStatus', 'canonicalClaims', 'consumerArtifacts', 'validators', 'localization', 'asset', 'publicationCandidateFields', 'publicationApprovedFields', 'withheldFields', 'limitations'], `fieldGroups.${expectedId}`);
  if (group.id !== expectedId || !['ADMITTED', 'PARTIAL', 'NOT_ADMITTED', 'NOT_VERIFIED'].includes(group.admissionStatus)
    || !Array.isArray(group.canonicalClaims) || !Array.isArray(group.consumerArtifacts) || !Array.isArray(group.validators)
    || !Array.isArray(group.publicationCandidateFields) || !Array.isArray(group.publicationApprovedFields)
    || group.publicationApprovedFields.length !== 0 || !Array.isArray(group.withheldFields) || !Array.isArray(group.limitations)) fail(`${expectedId} must keep admission and Full Detail approval separate`);
  exactKeys(group.localization, ['status', 'ownerArtifacts', 'limitation'], `fieldGroups.${expectedId}.localization`);
  exactKeys(group.asset, ['status', 'ownerArtifacts', 'limitation'], `fieldGroups.${expectedId}.asset`);
  for (const claim of group.canonicalClaims) {
    exactKeys(claim, ['artifact', 'locator', 'claimIds', 'evidenceArtifact', 'sourceVersion', 'transformation', 'scope', 'limitation'], `${expectedId}.canonicalClaim`);
    if (typeof claim.artifact !== 'string' || typeof claim.locator !== 'string' || !Array.isArray(claim.claimIds)
      || typeof claim.evidenceArtifact !== 'string' || typeof claim.sourceVersion !== 'string'
      || typeof claim.transformation !== 'string' || typeof claim.scope !== 'string' || typeof claim.limitation !== 'string') fail(`${expectedId} has incomplete source traceability`);
  }
};

export function validateHero15FullDetailPublication({ decision, canonical, generated, migrationDecision, integratedDecision, talentDecision, heroIndexDecision, portraitEvidence }) {
  exactKeys(decision, ['schemaVersion', 'decisionType', 'status', 'baseline', 'targetSurface', 'population', 'targetFieldSchema', 'fieldGroups', 'publication', 'approval', 'preservedDecisions', 'exclusions', 'effect'], 'decision');
  if (decision.schemaVersion !== 1 || decision.decisionType !== 'HERO_15_FULL_DETAIL_PUBLICATION' || decision.status !== 'PROPOSED') fail('decision must remain v1 PROPOSED');
  exactKeys(decision.baseline, ['repository', 'baseRef', 'baseHead', 'predecessorPullRequest'], 'baseline');
  if (decision.baseline.repository !== 'LuceatLuxVestra42/Langrisser-2nd-test' || decision.baseline.baseRef !== 'feat/hero-full-detail-population-migration'
    || decision.baseline.baseHead !== HERO_15_FULL_DETAIL_BASE_HEAD || decision.baseline.predecessorPullRequest !== 258) fail('baseline/dependency identity drift');
  exactKeys(decision.targetSurface, ['surface', 'heroId', 'fragment', 'surfaceType'], 'targetSurface');
  if (decision.targetSurface.surface !== 'HERO_FULL_DETAIL' || decision.targetSurface.heroId !== 15 || decision.targetSurface.fragment !== 'hero-full-detail-15'
    || decision.targetSurface.surfaceType !== 'COMMON_FULL_DETAIL_POPULATION_EXTENSION') fail('Hero 15 Full Detail surface identity drift');
  exactKeys(decision.population, ['currentEffectiveCount', 'currentHeroIds', 'proposedHeroId', 'proposedTargetCount', 'migrationStatus', 'canonicalPopulationCount', 'generatedPopulationCount', 'publicationEligiblePopulationCount', 'publicBuildPopulationCount', 'frontendFullDetailPopulationCount'], 'population');
  const expectedCurrentIds = [1,3,4,5,6,7,8,9,10,11,12,13,14,25,26,27,28,29,32,33,37,40,52,53,55,56,60,67,89];
  const canonicalIds = canonical?.heroes?.records?.map((row) => row.id);
  const generatedIds = generated?.heroes?.map((row) => row.id);
  if (!equal(decision.population.currentHeroIds, expectedCurrentIds) || !equal(canonicalIds, expectedCurrentIds) || !equal(generatedIds, expectedCurrentIds)
    || decision.population.currentEffectiveCount !== 29 || decision.population.proposedHeroId !== 15 || decision.population.proposedTargetCount !== 30
    || decision.population.migrationStatus !== 'NOT_EFFECTIVE' || decision.population.canonicalPopulationCount !== 29
    || decision.population.generatedPopulationCount !== 29 || decision.population.publicationEligiblePopulationCount !== 29
    || decision.population.publicBuildPopulationCount !== 29 || decision.population.frontendFullDetailPopulationCount !== 29) fail('current 29 populations or proposed-only Hero 15 boundary drift');
  if (canonicalIds.includes(15) || generatedIds.includes(15)) fail('Hero 15 must not be represented as current Full Detail');
  if (migrationDecision?.status !== 'PROPOSED' || migrationDecision?.proposedMigration?.heroId !== 15
    || migrationDecision?.proposedMigration?.applicationStatus !== 'NOT_EFFECTIVE'
    || migrationDecision?.approval?.evidenceStatus !== 'APPROVAL_EVIDENCE_NOT_VERIFIED'
    || migrationDecision?.approval?.authorityStatus !== 'MANUAL_REVIEW') fail('predecessor Migration Decision is effective or its unresolved approval boundary drifted');

  if (!equal(decision.targetFieldSchema, HERO_15_FULL_DETAIL_TARGET_SCHEMA)) fail('the complete target Field Schema differs from the contract');
  const groupIds = decision.fieldGroups?.map((group) => group.id);
  if (!equal(groupIds, HERO_15_FULL_DETAIL_GROUP_IDS)) fail('Field Group set/order differs from the complete target schema');
  for (const group of decision.fieldGroups) ensureGroup(group, group.id);
  for (const group of decision.fieldGroups) {
    const expected = GROUP_GATE_STATUS[group.id];
    if (!expected || !equal([group.admissionStatus, group.localization.status, group.asset.status], expected)) fail(`${group.id} Admission/Localization/Asset gate status changed`);
  }
  const schemaFields = new Map(HERO_15_FULL_DETAIL_TARGET_SCHEMA.map((group) => [group.id, new Set(group.fields)]));
  for (const group of decision.fieldGroups) {
    if (!equal(group.publicationCandidateFields, CANDIDATE_FIELDS[group.id]) || !equal(group.withheldFields, WITHHELD_FIELDS[group.id])) fail(`${group.id} candidate/withheld field scope changed`);
    if (group.publicationCandidateFields.some((field) => !schemaFields.get(group.id).has(field))
      || group.withheldFields.some((field) => !schemaFields.get(group.id).has(field) && !field.startsWith('SkillID ')
        && !['jobs[].nameKo for jobId=811', 'jobs[].nameKo for jobId=707'].includes(field))) fail(`${group.id} candidate/withheld field is outside Target Field Schema`);
  }

  const profile = decision.fieldGroups.find((group) => group.id === 'profile');
  const factionIds = [1,2,6];
  const heroIdentity = findOne(canonical.heroIdentities.records, (row) => row.heroId === 15, 'Hero 15 identity');
  const heroName = findOne(canonical.heroLocalizations.records, (row) => row.heroId === 15, 'Hero 15 localization');
  const rarity = findOne(canonical.heroRarities.records, (row) => row.heroId === 15, 'Hero 15 rarity');
  const factionRelations = canonical.heroFactionRelations.records.filter((row) => row.heroId === 15);
  const productionRelation = findOne(canonical.heroProductionRelations.records, (row) => row.heroId === 15, 'Hero 15 Production relation');
  if (heroIdentity.heroId !== 15 || heroName.nameKo !== '리아나' || rarity.rankId !== 4 || rarity.label !== 'SSR'
    || !equal(factionRelations.map((row) => row.factionId), factionIds) || productionRelation.productionId !== 5) fail('Profile canonical ID/relation parity failed');
  if (!equal(claimIds(profile, 'canonical/hero-identities.v1.json'), [15])
    || !equal(claimIds(profile, 'canonical/hero-localizations-ko.v1.json'), [15])
    || !equal(claimIds(profile, 'canonical/hero-rarities.v1.json'), [4])
    || !equal(claimIds(profile, 'canonical/hero-faction-relations.v1.json'), factionIds)
    || !equal(claimIds(profile, 'canonical/hero-production-relations.v1.json'), [5])
    || !equal(claimIds(profile, 'canonical/faction-identities.v1.json'), factionIds)
    || !equal(claimIds(profile, 'canonical/faction-localizations-ko.v1.json'), factionIds)
    || !equal(claimIds(profile, 'canonical/production-identities.v1.json'), [5])
    || !equal(claimIds(profile, 'canonical/production-localizations-ko.v1.json'), [5])
    || !equal(claimIds(profile, 'canonical/hero-profile-cv-names.v1.json'), [15])) fail('Profile Claim references are incomplete or out of scope');
  const cvClaim = profile.canonicalClaims.find((claim) => claim.artifact === 'canonical/hero-profile-cv-names.v1.json');
  if (cvClaim.locator !== 'heroId=15/charImageId=15/CVName'
    || cvClaim.evidenceArtifact !== 'evidence/source/configdata/ConfigDataCharImageInfo.record-hero-15-cv-name.v1.json#claim'
    || !cvClaim.sourceVersion.includes('397afb3e76c0fe4f3e424c04ba68459ff48d74c5')
    || !cvClaim.limitation.includes('Does not establish Korean-server localization')
    || !profile.withheldFields.includes('cv') || profile.publicationCandidateFields.includes('cv')) fail('CV internal claim must remain withheld from Full Detail publication');
  const heroIdentityClaim = profile.canonicalClaims.find((claim) => claim.artifact === 'canonical/hero-identities.v1.json');
  if (heroIdentityClaim.locator !== 'heroId=15' || !heroIdentityClaim.sourceVersion.includes('6475e63ee23d18adf733756c26a14fa9e3ed662c')
    || !heroIdentityClaim.evidenceArtifact.includes('ConfigDataHeroInfo.records-playable-identity.v1.json#ID=15')) fail('Hero Identity source locator/provenance changed');

  const talentRelations = canonical.talentRelations.records.filter((row) => row.heroId === 15);
  if (!equal(talentRelations.map(({ star, skillId }) => ({ star, skillId })), [{star:3,skillId:3212},{star:4,skillId:3214},{star:5,skillId:3216},{star:6,skillId:3218}])) fail('Talent star/Skill ID parity failed');
  const talentRows = decision.fieldGroups.find((group) => group.id === 'talent');
  for (const artifact of ['canonical/hero-talent-star-skills.v1.json','canonical/skills.v1.json','canonical/hero-talent-localizations-ko.v1.json']) {
    if (!equal(claimIds(talentRows, artifact), [3212,3214,3216,3218])) fail('Talent Canonical references incomplete');
  }

  const equipmentRelation = findOne(canonical.equipmentRelations.records, (row) => row.heroId === 15, 'Hero 15 Equipment relation');
  const equipmentLocalization = findOne(canonical.equipmentLocalizations.records, (row) => row.equipmentId === 535, 'Equipment 535 localization');
  if (equipmentRelation.equipmentId !== 535 || equipmentLocalization.nameKo !== '완벽한 찬사') fail('Equipment 535 relation/localization parity failed');
  const equipmentGroup = decision.fieldGroups.find((group) => group.id === 'exclusiveEquipment');
  for (const artifact of ['canonical/hero-exclusive-equipment-relations.v1.json','canonical/exclusive-equipment.v1.json','canonical/exclusive-equipment-localizations-ko.v1.json']) {
    if (!equal(claimIds(equipmentGroup, artifact), [535])) fail('Equipment 535 Claim locator/ID drift');
  }

  const fetter = canonical.fetterReferences.records.filter((row) => row.heroId === 15);
  if (!equal(fetter.map((row) => row.fetterId ?? `heart:${row.heartFetterId}`), [66,67,68,69,70,'heart:15'])) fail('Fetter and Heart Fetter reference parity failed');
  const fetterGroup = decision.fieldGroups.find((group) => group.id === 'fetterBond');
  if (!equal(claimIds(fetterGroup, 'canonical/hero-fetter-references.v1.json'), [66,67,68,69,70,15])
    || !equal(claimIds(fetterGroup, 'canonical/hero-fetter-raw-details.v1.json'), [66,67,68,69,70])
    || !equal(claimIds(fetterGroup, 'canonical/hero-heart-fetter-raw-details.v1.json'), [15])) fail('Fetter Claim locator/ID drift');
  const castingRefs = canonical.castingReferences.records.filter((row) => row.heroId === 15);
  if (!equal(castingRefs.map((row) => row.templateId), [14,12,37,40,41])) fail('Casting Law Template source order/ID parity failed');
  const castingGroup = decision.fieldGroups.find((group) => group.id === 'castingLaw');
  if (!equal(claimIds(castingGroup, 'canonical/hero-casting-law-template-references.v1.json'), [14,12,37,40,41])) fail('Casting Law Template provenance IDs drift');
  const castingLevelIds = canonical.castingTemplateLevelReferences.records.filter((row) => [14,12,37,40,41].includes(row.templateId)).map((row) => row.levelUpInfoId);
  for (const artifact of ['canonical/casting-law-template-level-references.v1.json','canonical/casting-law-levelup-raw-details.v1.json','canonical/casting-law-levelup-material-references.v1.json']) {
    if (!equal(claimIds(castingGroup, artifact), castingLevelIds)) fail('Casting Law Level Claim IDs/order drift');
  }

  const soldierRelations = canonical.soldierRelations.records.filter((row) => row.heroId === 15);
  const expectedSoldierIds = [210,326,602,621,802,811,815,5210,5326,5602,5621,5802,5811,5815];
  if (!equal(soldierRelations.map((row) => row.soldierId), expectedSoldierIds)
    || !equal(generated.hero15Soldier.records.map((row) => row.soldierId), expectedSoldierIds)) fail('Soldier relation/consumer parity failed');
  if (!equal(claimIds(decision.fieldGroups.find((group) => group.id === 'soldier'), 'canonical/hero-soldier-relations.v1.json'), expectedSoldierIds)
    || !equal(claimIds(decision.fieldGroups.find((group) => group.id === 'soldier'), 'canonical/soldiers.v1.json'), expectedSoldierIds)) fail('Soldier source trace ID set drift');
  const soldierIdentityIds = canonical.soldiers.records.filter((row) => expectedSoldierIds.includes(row.id)).map((row) => row.id);
  const soldierLocalizationIds = [...canonical.normalSoldierLocalizations.records, ...canonical.spSoldierLocalizations.records].filter((row) => expectedSoldierIds.includes(row.soldierId)).map((row) => row.soldierId);
  if (!equal(soldierIdentityIds, expectedSoldierIds) || !equal(soldierLocalizationIds, expectedSoldierIds)) fail('Soldier identity or Korean localization endpoint coverage changed');

  const jobs = canonical.jobRelations.records.filter((row) => row.heroId === 15);
  const jobTree = generated.hero15JobTree;
  const expectedConnections = [150,151,152,153,154,155];
  const expectedJobs = [802,803,806,703,811,707];
  if (!equal(jobs.map((row) => row.jobId), expectedJobs) || !equal(jobTree.jobs.map((row) => row.connectionId), expectedConnections)
    || !equal(jobTree.jobs.map((row) => row.jobId), expectedJobs)
    || !equal(canonical.jobAdvancementRelations.records.map((row) => [row.predecessorConnectionId,row.successorConnectionId]), [[150,151],[150,152],[150,153],[152,154],[153,155]])) fail('Job membership/Advancement relation parity failed');
  const jobGroup = decision.fieldGroups.find((group) => group.id === 'jobTree');
  if (!equal(claimIds(jobGroup, 'canonical/hero-job-relations.v1.json'), expectedJobs)
    || !equal(claimIds(jobGroup, 'canonical/hero-job-advancement-relations.v1.json'), expectedConnections)) fail('Job source trace ID set drift');
  const jobNames = canonical.jobLocalizations.records.filter((row) => expectedJobs.includes(row.jobId)).map((row) => row.jobId);
  if (!equal(jobNames, [806,803,703,802])) fail('Job Localization admitted/missing ID set changed (811/707 must remain NOT_ADMITTED)');

  const jobLevels = canonical.jobLevelRawStats.records.filter((row) => row.heroId === 15);
  if (jobLevels.length !== 25 || !equal(jobLevels.map((row) => row.jobLevelId), generated.hero15JobLevel.jobs.flatMap((job) => job.jobLevels.map((level) => level.jobLevelId)))) fail('JobLevel Raw Stats ID/value projection parity failed');
  if (!equal(claimIds(decision.fieldGroups.find((group) => group.id === 'jobLevelStats'), 'canonical/hero-job-level-raw-stats.v1.json'), jobLevels.map((row) => row.jobLevelId))) fail('JobLevel source trace IDs/order drift');
  if (jobLevels.some((row) => Object.keys(row.rawStats).length !== 11 || 'DEX_UP' in row.rawStats)) fail('JobLevel raw field presence/absence boundary changed');

  const skillReferences = canonical.skillReferences.records.filter((row) => row.heroId === 15);
  if (skillReferences.length !== 9 || !equal(skillReferences.map((row) => row.skillId), [10801,10816,10805,10707,10705,10804,10807,6009,11786])
    || !equal(generated.hero15SkillDetail.references.map((row) => row.skillId), skillReferences.map((row) => row.skillId))) fail('Skill reference/consumer parity failed');
  const skillGroup = decision.fieldGroups.find((group) => group.id === 'skill');
  if (!equal(claimIds(skillGroup, 'canonical/hero-skill-references.v1.json'), skillReferences.map((row) => row.skillId))
    || !equal(claimIds(skillGroup, 'canonical/skills.v1.json'), skillReferences.map((row) => row.skillId))) fail('Skill source trace IDs/order drift');
  if (skillReferences.some((row) => !canonical.skills.records.some((skill) => skill.skillId === row.skillId))) fail('Skill identity endpoints do not resolve by explicit SkillID');
  const awakening = findOne(canonical.awakeningReferences.records, (row) => row.heroId === 15, 'Hero 15 Awakening');
  if (awakening.awakenInfoId !== 15 || awakening.stage1LevelReference.levelId !== 1015 || awakening.stage2LevelReference.levelId !== 2015 || awakening.stage2SkillReference.skillId !== 12350) fail('Awakening reference parity failed');
  if (!equal(claimIds(decision.fieldGroups.find((group) => group.id === 'awakening'), 'canonical/hero-awakening-references.v1.json'), [15,1015,2015,12350,3253,3249,3247,3260,3256,3254])) fail('Awakening source trace IDs/order drift');

  const existingFullDetailIds = heroIndexDecision?.approvedScope?.detailHeroIds;
  if (!equal(existingFullDetailIds, expectedCurrentIds) || heroIndexDecision?.approvedScope?.heroIds?.length !== 267) fail('Hero Index 267 and Full Detail 29 endpoint scope changed');
  if (integratedDecision?.status !== 'APPROVED' || integratedDecision?.approvedScope?.preservedPopulations?.fullHeroDetail !== 29
    || integratedDecision?.approvedScope?.preservedPopulations?.heroIndex !== 267
    || integratedDecision?.approvedScope?.preservedPopulations?.exclusiveEquipmentNavigation !== 167
    || integratedDecision?.approvedScope?.heroIndexNavigation?.fragment !== 'hero-minimal-detail-15'
    || integratedDecision?.approvedScope?.exclusiveEquipmentNavigation?.target?.fragment !== 'hero-minimal-detail-15') fail('Existing integrated Publication or Navigation boundary changed');
  if (talentDecision?.status !== 'APPROVED' || talentDecision?.approvedScope?.surface !== 'hero-minimal-detail-15'
    || !talentDecision?.approvedScope?.excluded?.includes('Hero Full Detail')) fail('Existing Talent approval widened beyond Minimal Detail');
  if (portraitEvidence?.canonical !== false || portraitEvidence?.generated !== false || portraitEvidence?.publicationApproved !== false
    || portraitEvidence?.admissionScope !== 'INTERNAL_HERO_PORTRAIT_ASSET_ONLY') fail('Hero 15 Portrait moved beyond its internal-only Asset admission');
  const portraitClaims = decision.fieldGroups.find((group) => group.id === 'portraitSkin').canonicalClaims;
  if (portraitClaims.length !== 1 || portraitClaims[0].artifact !== 'evidence/source/portraits/hero-portrait-hero15.v1.json'
    || !equal(portraitClaims[0].claimIds, [15])
    || portraitClaims[0].locator !== 'HeroInfo.CharImage_ID=15→CharImageInfo.ID=15') fail('Portrait evidence trace widened beyond verified Hero 15 endpoint');

  exactKeys(decision.publication, ['fullDetailStatus', 'publicEligibilityStatus', 'populationAdditionStatus', 'approvedFields', 'candidatePolicy'], 'publication');
  if (decision.publication.fullDetailStatus !== 'NOT_APPROVED' || decision.publication.publicEligibilityStatus !== 'NOT_APPROVED'
    || decision.publication.populationAdditionStatus !== 'NOT_EFFECTIVE' || !equal(decision.publication.approvedFields, [])
    || decision.fieldGroups.some((group) => group.publicationApprovedFields.length !== 0)) fail('No Full Detail Field may be approved in this proposal');
  exactKeys(decision.approval, ['status', 'authorityStatus', 'evidenceStatus', 'source', 'scope'], 'approval');
  exactKeys(decision.approval.source, ['kind', 'originalMessageIdOrUrl'], 'approval.source');
  if (decision.approval.status !== 'NOT_CONFIRMED' || decision.approval.authorityStatus !== 'MANUAL_REVIEW'
    || decision.approval.evidenceStatus !== 'APPROVAL_EVIDENCE_NOT_VERIFIED'
    || decision.approval.source.kind !== 'USER_SUPPLIED_EXECUTION_INSTRUCTION_SUMMARY'
    || decision.approval.source.originalMessageIdOrUrl !== 'NOT_AVAILABLE') fail('Approval evidence/authority must remain unverified');
  exactKeys(decision.effect, ['effective','condition','reviewWhen'], 'effect');
  if (decision.effect.effective !== false || !decision.effect.condition.includes('No Hero 15 Full Detail fields') || !decision.effect.reviewWhen.includes('Approval Owner/evidence')) fail('proposed Full Detail Decision must not be effective');
  return true;
}

export async function loadHero15FullDetailPublicationInputs(root = process.cwd()) {
  const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
  const paths = {
    decision: HERO_15_FULL_DETAIL_PUBLICATION_PATH,
    migrationDecision: HERO_15_FULL_DETAIL_POPULATION_MIGRATION_PATH,
    integratedDecision: 'docs/decisions/hero-15-integrated-publication.v1.json',
    talentDecision: 'docs/decisions/hero-15-talent-publication.v1.json',
    heroIndexDecision: 'docs/decisions/hero-index-publication.v1.json',
    portraitEvidence: 'evidence/source/portraits/hero-portrait-hero15.v1.json',
    'canonical.heroIdentities': 'canonical/hero-identities.v1.json',
    'canonical.heroProfileCv': 'canonical/hero-profile-cv-names.v1.json',
    'canonical.heroes': 'canonical/heroes.v1.json',
    'canonical.heroLocalizations': 'canonical/hero-localizations-ko.v1.json',
    'canonical.heroRarities': 'canonical/hero-rarities.v1.json',
    'canonical.heroFactionRelations': 'canonical/hero-faction-relations.v1.json',
    'canonical.factionIdentities': 'canonical/faction-identities.v1.json',
    'canonical.factionLocalizations': 'canonical/faction-localizations-ko.v1.json',
    'canonical.heroProductionRelations': 'canonical/hero-production-relations.v1.json',
    'canonical.productionIdentities': 'canonical/production-identities.v1.json',
    'canonical.productionLocalizations': 'canonical/production-localizations-ko.v1.json',
    'canonical.talentRelations': 'canonical/hero-talent-star-skills.v1.json',
    'canonical.heroTalentLocalizations': 'canonical/hero-talent-localizations-ko.v1.json',
    'canonical.skills': 'canonical/skills.v1.json',
    'canonical.equipmentRelations': 'canonical/hero-exclusive-equipment-relations.v1.json',
    'canonical.exclusiveEquipment': 'canonical/exclusive-equipment.v1.json',
    'canonical.equipmentLocalizations': 'canonical/exclusive-equipment-localizations-ko.v1.json',
    'canonical.fetterReferences': 'canonical/hero-fetter-references.v1.json',
    'canonical.fetterRawDetails': 'canonical/hero-fetter-raw-details.v1.json',
    'canonical.heartFetterRawDetails': 'canonical/hero-heart-fetter-raw-details.v1.json',
    'canonical.fetterMaterialRelations': 'canonical/hero-fetter-material-relations.v1.json',
    'canonical.castingReferences': 'canonical/hero-casting-law-template-references.v1.json',
    'canonical.castingTemplateLevelReferences': 'canonical/casting-law-template-level-references.v1.json',
    'canonical.castingLevelRawDetails': 'canonical/casting-law-levelup-raw-details.v1.json',
    'canonical.castingMaterialReferences': 'canonical/casting-law-levelup-material-references.v1.json',
    'canonical.soldierRelations': 'canonical/hero-soldier-relations.v1.json',
    'canonical.soldiers': 'canonical/soldiers.v1.json',
    'canonical.normalSoldierLocalizations': 'canonical/normal-soldier-localizations-ko.v1.json',
    'canonical.spSoldierLocalizations': 'canonical/sp-soldier-localizations-ko.v1.json',
    'canonical.jobRelations': 'canonical/hero-job-relations.v1.json',
    'canonical.jobAdvancementRelations': 'canonical/hero-job-advancement-relations.v1.json',
    'canonical.jobLevelRawStats': 'canonical/hero-job-level-raw-stats.v1.json',
    'canonical.jobLocalizations': 'canonical/job-localizations-ko.v1.json',
    'canonical.skillReferences': 'canonical/hero-skill-references.v1.json',
    'canonical.awakeningReferences': 'canonical/hero-awakening-references.v1.json',
    'canonical.factionIdentities': 'canonical/faction-identities.v1.json',
    'canonical.factionLocalizations': 'canonical/faction-localizations-ko.v1.json',
    'canonical.productionIdentities': 'canonical/production-identities.v1.json',
    'canonical.productionLocalizations': 'canonical/production-localizations-ko.v1.json',
    'canonical.exclusiveEquipment': 'canonical/exclusive-equipment.v1.json',
    'canonical.heroTalentLocalizations': 'canonical/hero-talent-localizations-ko.v1.json',
    'canonical.skills': 'canonical/skills.v1.json',
    'canonical.soldiers': 'canonical/soldiers.v1.json',
    'canonical.normalSoldierLocalizations': 'canonical/normal-soldier-localizations-ko.v1.json',
    'canonical.spSoldierLocalizations': 'canonical/sp-soldier-localizations-ko.v1.json',
    'generated.heroSlice': 'generated/hero-slice.v1.json',
    'generated.heroIndex': 'generated/hero-index.v1.json',
    'generated.heroMinimalDetail': 'generated/hero-minimal-detail.v1.json',
    'generated.hero15TalentPublic': 'generated/hero-15-talent-public.v1.json',
    'generated.hero15Soldier': 'generated/hero-15-soldier-internal.v1.json',
    'generated.hero15JobTree': 'generated/hero-15-job-tree-internal.v1.json',
    'generated.hero15JobLevel': 'generated/hero-15-job-level-internal.v1.json',
    'generated.hero15SkillDetail': 'generated/hero-15-skill-detail-internal.v1.json',
    'generated.hero15Awakening': 'generated/hero-15-awakening-internal.v1.json',
    'generated.hero15Fetter': 'generated/hero-15-fetter-internal.v1.json',
    'generated.hero15CastingLaw': 'generated/hero-15-casting-law-internal.v1.json',
  };
  const entries = await Promise.all(Object.entries(paths).map(async ([key, path]) => [key, await readJson(path)]));
  const data = Object.fromEntries(entries);
  const { decision, migrationDecision, integratedDecision, talentDecision, heroIndexDecision, portraitEvidence } = data;
  return {
    decision, migrationDecision, integratedDecision, talentDecision, heroIndexDecision, portraitEvidence,
    canonical: {
      heroes: data['canonical.heroes'], heroIdentities: data['canonical.heroIdentities'], heroProfileCv: data['canonical.heroProfileCv'], heroLocalizations: data['canonical.heroLocalizations'], heroRarities: data['canonical.heroRarities'],
      heroFactionRelations: data['canonical.heroFactionRelations'], heroProductionRelations: data['canonical.heroProductionRelations'],
      talentRelations: data['canonical.talentRelations'], equipmentRelations: data['canonical.equipmentRelations'], equipmentLocalizations: data['canonical.equipmentLocalizations'],
      factionIdentities: data['canonical.factionIdentities'], factionLocalizations: data['canonical.factionLocalizations'], productionIdentities: data['canonical.productionIdentities'], productionLocalizations: data['canonical.productionLocalizations'],
      talentLocalizations: data['canonical.heroTalentLocalizations'], skills: data['canonical.skills'], exclusiveEquipment: data['canonical.exclusiveEquipment'],
      fetterReferences: data['canonical.fetterReferences'], fetterRawDetails: data['canonical.fetterRawDetails'], heartFetterRawDetails: data['canonical.heartFetterRawDetails'], fetterMaterialRelations: data['canonical.fetterMaterialRelations'],
      castingReferences: data['canonical.castingReferences'], castingTemplateLevelReferences: data['canonical.castingTemplateLevelReferences'], castingLevelRawDetails: data['canonical.castingLevelRawDetails'], castingMaterialReferences: data['canonical.castingMaterialReferences'], soldierRelations: data['canonical.soldierRelations'],
      soldiers: data['canonical.soldiers'], normalSoldierLocalizations: data['canonical.normalSoldierLocalizations'], spSoldierLocalizations: data['canonical.spSoldierLocalizations'],
      jobRelations: data['canonical.jobRelations'], jobAdvancementRelations: data['canonical.jobAdvancementRelations'], jobLevelRawStats: data['canonical.jobLevelRawStats'],
      jobLocalizations: data['canonical.jobLocalizations'], skillReferences: data['canonical.skillReferences'], awakeningReferences: data['canonical.awakeningReferences'],
    },
    generated: {
      heroes: data['generated.heroSlice'].heroes, heroIndex: data['generated.heroIndex'], heroMinimalDetail: data['generated.heroMinimalDetail'], hero15TalentPublic: data['generated.hero15TalentPublic'],
      hero15Soldier: data['generated.hero15Soldier'], hero15JobTree: data['generated.hero15JobTree'], hero15JobLevel: data['generated.hero15JobLevel'],
      hero15SkillDetail: data['generated.hero15SkillDetail'], hero15Awakening: data['generated.hero15Awakening'], hero15Fetter: data['generated.hero15Fetter'], hero15CastingLaw: data['generated.hero15CastingLaw'],
    },
  };
}

export async function validateHero15FullDetailPublicationFromRoot(root = process.cwd()) {
  return validateHero15FullDetailPublication(await loadHero15FullDetailPublicationInputs(root));
}
