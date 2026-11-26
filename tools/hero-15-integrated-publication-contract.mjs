import { loadAwakeningInputs, renderAwakeningInternal } from './hero-15-awakening-internal-consumer.mjs';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { CANONICAL as HERO_CV_CANONICAL, renderHero15ProfileCvInternal } from './hero-15-profile-cv-internal.mjs';
import { loadInputs as loadJobTree, render as renderJobTree } from './hero-15-job-tree-internal.mjs';
import { renderHero15SoldierInternal } from './hero-15-soldier-internal-consumer.mjs';
import {
  hero15AreaCanonicalPath, hero15AreaEvidencePath, validateHero15OrdinarySkillAreas,
  hero15TypeCanonicalPath, hero15TypeEvidencePath, validateHero15OrdinarySkillTypes,
} from './validate-skill-identities.mjs';

const decisionKeys = ['schemaVersion', 'decisionType', 'status', 'approval', 'approvedScope', 'effect'];
const approvalKeys = ['approverRole', 'source', 'recordedAtDate'];
const sourceKeys = ['kind', 'quote', 'originalMessageIdOrUrl', 'contextVerified'];
const scopeKeys = ['repository', 'baselineRef', 'baselineHead', 'heroId', 'nameKo', 'nameLabelStatus', 'officialKrProvenanceStatus', 'canonicalSources', 'surfaces', 'minimalDetail', 'heroIndexNavigation', 'exclusiveEquipmentNavigation', 'preservedPopulations', 'excluded'];

export const HERO_15_INTEGRATED_PUBLICATION_PATH = 'docs/decisions/hero-15-integrated-publication.v1.json';
export const HERO_15_MINIMAL_DETAIL_PATH = 'generated/hero-minimal-detail.v1.json';
export const HERO_15_MINIMAL_DETAIL_FRAGMENT = 'hero-minimal-detail-15';

const exactKeys = (value, keys, label) => {
  if (!value || JSON.stringify(Object.keys(value).sort()) !== JSON.stringify([...keys].sort())) {
    throw new Error(`${label} has unexpected or missing fields`);
  }
};

export function validateHero15IntegratedPublication(decision) {
  exactKeys(decision, decisionKeys, 'Hero 15 integrated Publication decision');
  exactKeys(decision.approval, approvalKeys, 'Hero 15 Publication approval');
  exactKeys(decision.approval?.source, sourceKeys, 'Hero 15 Publication approval source');
  exactKeys(decision.approvedScope, scopeKeys, 'Hero 15 Publication scope');
  exactKeys(decision.approvedScope?.minimalDetail, ['surface', 'heroId', 'fragment', 'fields'], 'P-A scope');
  exactKeys(decision.approvedScope?.canonicalSources, ['heroIdentity', 'heroLocalization', 'equipmentRelation', 'equipmentIdentity', 'equipmentLocalization'], 'Canonical sources');
  for (const [key, label] of [['heroIdentity', 'Hero Identity source'], ['heroLocalization', 'Hero Localization source'], ['equipmentRelation', 'Equipment relation source'], ['equipmentIdentity', 'Equipment Identity source'], ['equipmentLocalization', 'Equipment Localization source']]) {
    exactKeys(decision.approvedScope.canonicalSources[key], ['path', 'sha256', 'locator'], label);
  }
  exactKeys(decision.approvedScope?.heroIndexNavigation, ['surface', 'heroId', 'targetSurface', 'fragment', 'detailHeroIdsPreserved', 'heroIndexPopulation'], 'P-B scope');
  exactKeys(decision.approvedScope?.exclusiveEquipmentNavigation, ['surface', 'equipmentId', 'heroId', 'previousTarget', 'target', 'otherEquipmentTargetsPreserved'], 'P-C scope');
  exactKeys(decision.approvedScope?.preservedPopulations, ['heroIndex', 'fullHeroDetail', 'exclusiveEquipmentNavigation'], 'preserved populations');
  exactKeys(decision.effect, ['effective', 'condition', 'reviewWhen'], 'decision effect');

  const source = decision.approval.source;
  const scope = decision.approvedScope;
  if (decision.schemaVersion !== 1 || decision.decisionType !== 'HERO_15_INTEGRATED_PUBLICATION' || decision.status !== 'APPROVED'
    || decision.approval.approverRole !== 'USER'
    || source.kind !== 'CURRENT_USER_MESSAGE'
    || source.quote !== '나는 Langrisser-2nd-test 프로젝트의 Hero 15(리아나) 통합 Publication 변경 P-A·P-B·P-C 전체를 승인한다.'
    || source.originalMessageIdOrUrl !== 'NOT_AVAILABLE'
    || source.contextVerified !== true
    || decision.approval.recordedAtDate !== '2026-11-04'
    || scope.repository !== 'LuceatLuxVestra42/Langrisser-2nd-test'
    || scope.baselineRef !== 'main'
    || scope.baselineHead !== 'baa012cb9ada8f09f81e154f0feb0613499b6b14'
    || scope.heroId !== 15 || scope.nameKo !== '리아나'
    || scope.nameLabelStatus !== 'PROJECT_REVIEWED'
    || scope.officialKrProvenanceStatus !== 'unverified'
    || JSON.stringify(scope.canonicalSources) !== JSON.stringify({
      heroIdentity: { path: 'canonical/hero-identities.v1.json', sha256: '6cb710d09df61cbc31d2021fd41b9e1e1b5899377991d14af7a4a5d89e7fe11c', locator: 'evidence/source/configdata/ConfigDataHeroInfo.records-playable-identity.v1.json#ID=15' },
      heroLocalization: { path: 'canonical/hero-localizations-ko.v1.json', sha256: '7f0ca08eb578dd2d1fcf9aa44eb825c49f7e415faeedd2fffa4b604d2c4ab299', locator: 'evidence/localization/hero-names-ko.v1.json#heroId=15' },
      equipmentRelation: { path: 'canonical/hero-exclusive-equipment-relations.v1.json', sha256: 'a0aa17178c04456482018d3b166baa176224a8562b713fb5f583f2b5a113ba01', locator: 'ConfigDataEquipmentInfo#recordId=535&field=SkillHero&value=15' },
      equipmentIdentity: { path: 'canonical/exclusive-equipment.v1.json', sha256: 'bd59b9cce913ffd3f310d9f96b1295e939959b2e207e55324dc60b2a50f38b9f', locator: 'canonical/exclusive-equipment.v1.json#equipmentId=535' },
      equipmentLocalization: { path: 'canonical/exclusive-equipment-localizations-ko.v1.json', sha256: 'edd54afd11a4701dc039710670dcd321b7f459648887f55d48423ff26f1a125c', locator: 'evidence/localization/exclusive-equipment-ko.v1.json#EquipmentID=535' },
    })
    || JSON.stringify(scope.surfaces) !== JSON.stringify(['HERO_MINIMAL_DETAIL', 'HERO_INDEX_LIST', 'EXCLUSIVE_EQUIPMENT_LIST'])
    || scope.minimalDetail.surface !== 'HERO_MINIMAL_DETAIL' || scope.minimalDetail.heroId !== 15
    || scope.minimalDetail.fragment !== HERO_15_MINIMAL_DETAIL_FRAGMENT
    || JSON.stringify(scope.minimalDetail.fields) !== JSON.stringify(['heroId', 'nameKo', 'exclusiveEquipment.equipmentId', 'exclusiveEquipment.nameKo', 'exclusiveEquipment.effectDescriptionKo'])
    || scope.heroIndexNavigation.surface !== 'HERO_INDEX_LIST' || scope.heroIndexNavigation.heroId !== 15
    || scope.heroIndexNavigation.targetSurface !== 'HERO_MINIMAL_DETAIL'
    || scope.heroIndexNavigation.fragment !== HERO_15_MINIMAL_DETAIL_FRAGMENT
    || scope.heroIndexNavigation.detailHeroIdsPreserved !== 29 || scope.heroIndexNavigation.heroIndexPopulation !== 267
    || scope.exclusiveEquipmentNavigation.surface !== 'EXCLUSIVE_EQUIPMENT_LIST'
    || scope.exclusiveEquipmentNavigation.equipmentId !== 535 || scope.exclusiveEquipmentNavigation.heroId !== 15
    || JSON.stringify(scope.exclusiveEquipmentNavigation.previousTarget) !== JSON.stringify({ surface: 'HERO_INDEX', fragment: 'hero-index-entry-15' })
    || JSON.stringify(scope.exclusiveEquipmentNavigation.target) !== JSON.stringify({ surface: 'HERO_MINIMAL_DETAIL', fragment: HERO_15_MINIMAL_DETAIL_FRAGMENT })
    || scope.exclusiveEquipmentNavigation.otherEquipmentTargetsPreserved !== 166
    || scope.preservedPopulations.heroIndex !== 267 || scope.preservedPopulations.fullHeroDetail !== 29
    || scope.preservedPopulations.exclusiveEquipmentNavigation !== 167
    || JSON.stringify(scope.excluded) !== JSON.stringify(['New Semantic Admission', 'Canonical or Evidence mutation', 'Legacy Repository mutation', 'Hero IDs other than 15', 'Equipment IDs other than 535', 'Rarity', 'Faction', 'Production', 'Job', 'Soldier', 'Talent', 'Skill', 'Portrait or Asset', 'Release status', 'New game statistics'])
    || decision.effect.effective !== true
    || decision.effect.condition !== 'Only Hero 15 with the exact approved fields and the exact P-B/P-C Navigation targets may be published; all other existing populations and targets remain unchanged.'
    || decision.effect.reviewWhen !== 'Re-review if the approved IDs, fields, source claims, surfaces, Navigation targets, or preserved populations change.') {
    throw new Error('Hero 15 integrated Publication approval or scope is invalid');
  }
  return decision;
}

const ordinarySkillCostOwnerPath = 'canonical/hero-15-ordinary-skill-costs.v1.json';
const ordinarySkillCooldownOwnerPath = 'canonical/hero-15-ordinary-skill-cooldowns.v1.json';
const ordinarySkillDistanceOwnerPath = 'canonical/hero-15-ordinary-skill-distances.v1.json';

const centralDisciplineGoldPaths = {
  hero: 'canonical/hero-casting-law-template-references.v1.json',
  levels: 'canonical/casting-law-template-level-references.v1.json',
  raw: 'canonical/casting-law-levelup-raw-details.v1.json',
};

export async function readHero15ProfileInputs(readJson) {
  const [approval, rarities, relations, names, sourceNamesApproval, nameMaster, englishNameEvidence, cvDecision, cvCanonical, skillDecision, skillReferences, skillIdentities, centralDisciplineDecision, awakeningDecision, awakeningInputs, bond3Decision, fetterReferences, fetterDetails, bond45Decision, bond2Decision, commandDecision, commandBase, commandBond, goldDecision, goldOwner, heartFetterDetails, ordinarySkillCostDecision, ordinarySkillCosts, ordinarySkillCooldownDecision, ordinarySkillCooldowns, ordinarySkillDistanceDecision, ordinarySkillDistances, ordinarySkillAreaDecision, ordinarySkillAreaEvidence, ordinarySkillAreas, ordinarySkillTypeDecision, ordinarySkillTypeEvidence, ordinarySkillTypes, centralDisciplineGoldDecision, castingLawHero, castingLawLevels, castingLawRaw] = await Promise.all([
    readJson('docs/decisions/hero-15-minimal-profile-publication.v1.json'),
    readJson('canonical/hero-rarities.v1.json'),
    readJson('canonical/hero-faction-relations.v1.json'),
    readJson('canonical/faction-localizations-ko.v1.json'),
    readJson('docs/decisions/hero-15-minimal-source-names-publication.v1.json'),
    readJson('evidence/source/configdata/hero-name-master.records-hero-ko-localization-expansion.v1.json'),
    readJson('evidence/source/configdata/ConfigDataHeroInfo.record-hero-15-name-eng.v1.json'),
    readJson('docs/decisions/hero-15-minimal-cv-publication.v1.json'),
    readJson(HERO_CV_CANONICAL),
    readJson('docs/decisions/hero-15-minimal-ordinary-skills-publication.v1.json'),
    readJson('canonical/hero-skill-references.v1.json'),
    readJson('canonical/skills.v1.json'),
    readJson('docs/decisions/hero-15-minimal-central-discipline-publication.v1.json'),
    readJson('docs/decisions/hero-15-minimal-awakening-materials-publication.v1.json'),
    loadAwakeningInputs(),
    readJson('docs/decisions/hero-15-minimal-bond3-description-publication.v1.json'),
    readJson('canonical/hero-fetter-references.v1.json'),
    readJson('canonical/hero-fetter-raw-details.v1.json'),
    readJson('docs/decisions/hero-15-minimal-bond45-description-publication.v1.json'),
    readJson('docs/decisions/hero-15-minimal-bond2-description-publication.v1.json'),
    readJson('docs/decisions/hero-15-minimal-soldier-command-publication.v1.json'),
    readJson('canonical/hero-soldier-command-base.v1.json'),
    readJson('canonical/hero-soldier-command-bond-contributions.v1.json'),
    readJson('docs/decisions/hero-15-minimal-fetter-gold-publication.v1.json'),
    readJson('canonical/hero-fetter-material-relations.v1.json'),
    readJson('canonical/hero-heart-fetter-raw-details.v1.json'),
    readJson('docs/decisions/hero-15-minimal-ordinary-skill-cost-publication.v1.json'),
    readJson(ordinarySkillCostOwnerPath),
    readJson('docs/decisions/hero-15-minimal-ordinary-skill-cooldown-publication.v1.json'),
    readJson(ordinarySkillCooldownOwnerPath),
    readJson('docs/decisions/hero-15-minimal-ordinary-skill-distance-publication.v1.json'),
    readJson(ordinarySkillDistanceOwnerPath),
    readJson('docs/decisions/hero-15-minimal-ordinary-skill-area-publication.v1.json'),
    readJson(hero15AreaEvidencePath),
    readJson(hero15AreaCanonicalPath),
    readJson('docs/decisions/hero-15-minimal-ordinary-skill-type-publication.v1.json'),
    readJson(hero15TypeEvidencePath),
    readJson(hero15TypeCanonicalPath),
    readJson('docs/decisions/hero-15-minimal-central-discipline-gold-publication.v1.json'),
    readJson(centralDisciplineGoldPaths.hero),
    readJson(centralDisciplineGoldPaths.levels),
    readJson(centralDisciplineGoldPaths.raw),
  ]);
  return { approval, rarities, relations, names, sourceNamesApproval, nameMaster, englishNameEvidence, cvDecision, cvCanonical, skillDecision, skillReferences, skillIdentities, centralDisciplineDecision, awakeningDecision, awakeningInputs, bond3Decision, fetterReferences, fetterDetails, bond45Decision, bond2Decision, commandDecision, commandBase, commandBond, goldDecision, goldOwner, heartFetterDetails, ordinarySkillCostDecision, ordinarySkillCosts, ordinarySkillCooldownDecision, ordinarySkillCooldowns, ordinarySkillDistanceDecision, ordinarySkillDistances, ordinarySkillAreaDecision, ordinarySkillAreaEvidence, ordinarySkillAreas, ordinarySkillTypeDecision, ordinarySkillTypeEvidence, ordinarySkillTypes,
    centralDisciplineGoldDecision, castingLawHero, castingLawLevels, castingLawRaw };
}

function renderHero15Profile(inputs = {}) {
  const { approval, rarities, relations, names } = inputs;
  exactKeys(approval, ['status', 'heroId', 'surface', 'approval', 'profile', 'display'], 'Hero 15 profile decision');
  exactKeys(approval.approval, ['source', 'date', 'quote'], 'Hero 15 profile approval');
  if (approval.status !== 'APPROVED' || approval.heroId !== 15 || approval.surface !== HERO_15_MINIMAL_DETAIL_FRAGMENT
    || approval.display !== 'PROJECT_REVIEWED_KOREAN_TEXT_ONLY' || approval.approval.source !== 'CURRENT_USER_MESSAGE'
    || approval.approval.date !== '2026-11-25'
    || approval.approval.quote !== '리아나의 기존 상세에 SSR과 시대의 주역·빛의 군단·공주 연맹만 추가 공개하는 것을 승인해. 출전작은 제외하고 구현·검증·PR 생성까지 진행해. 병합은 하지 마.') {
    throw new Error('Hero 15 profile approval or scope mismatch');
  }
  const expected = {
    rarity: { rankId: 4, label: 'SSR' },
    factions: [
      { factionId: 1, nameKo: '시대의 주역' },
      { factionId: 2, nameKo: '빛의 군단' },
      { factionId: 6, nameKo: '공주 연맹' },
    ],
  };
  const rank = rarities.records.filter(({ heroId }) => heroId === 15);
  const factionIds = relations.records.filter(({ heroId }) => heroId === 15)
    .map(({ factionId }) => factionId).sort((a, b) => a - b);
  const factions = factionIds.map((factionId) => {
    const labels = names.records.filter((row) => row.factionId === factionId);
    if (labels.length !== 1) throw new Error('Hero 15 profile faction label must resolve exactly once');
    return { factionId, nameKo: labels[0].nameKo };
  });
  const profile = { rarity: { rankId: rank[0]?.rankId, label: rank[0]?.label }, factions };
  if (rank.length !== 1 || JSON.stringify(profile) !== JSON.stringify(expected)
    || JSON.stringify(approval.profile) !== JSON.stringify(expected)) {
    throw new Error('Hero 15 profile must match exact approved Canonical rank, factions and names');
  }
  return { ...profile, sourceNames: renderHero15SourceNames(inputs), cvNameKo: renderHero15CvName(inputs) };
}

function renderHero15CvName({ cvDecision, cvCanonical }) {
  const { heroId, charImageId, cvNameRaw } = JSON.parse(renderHero15ProfileCvInternal(cvCanonical));
  if (cvDecision?.status !== 'APPROVED' || cvDecision.surface !== HERO_15_MINIMAL_DETAIL_FRAGMENT
    || cvDecision.heroId !== heroId || cvDecision.charImageId !== charImageId || cvDecision.cvNameRaw !== cvNameRaw
    || cvDecision.displayAuthority !== 'PROJECT_DISPLAY_ONLY' || cvDecision.nameKo !== '코시미즈 아미') {
    throw new Error('Hero 15 CV publication scope or Korean display name mismatch');
  }
  return cvDecision.nameKo;
}

function renderHero15SourceNames({ sourceNamesApproval, nameMaster, englishNameEvidence }) {
  const chineseRows = nameMaster.records.filter(({ heroId }) => heroId === 15);
  const english = englishNameEvidence.claim;
  if (sourceNamesApproval.status !== 'APPROVED' || sourceNamesApproval.heroId !== 15
    || sourceNamesApproval.surface !== HERO_15_MINIMAL_DETAIL_FRAGMENT
    || sourceNamesApproval.source.gitBlobSha1 !== nameMaster.source.sourceBlobSha1
    || sourceNamesApproval.source.commit !== nameMaster.source.sourceCommit
    || chineseRows.length !== 1 || chineseRows[0].nameCn !== sourceNamesApproval.nameCn
    || english.heroId !== 15 || english.field !== 'Name_Eng' || english.value !== sourceNamesApproval.nameEn) {
    throw new Error('Hero 15 source names do not match approved source fields');
  }
  const display = sourceNamesApproval.officialEnglishDisplay;
  if (display?.value !== 'Liana' || JSON.stringify(display.sources?.map(({ url }) => url)) !== JSON.stringify([
    'https://us-news.zlongame.com/heroSSR/858.jhtml',
    'https://sea-news.zlongame.com/jx/ggb/20220704/5274.html',
  ])) throw new Error('Hero 15 official English display provenance is invalid');
  return { nameCn: chineseRows[0].nameCn, nameEn: display.value };
}

export async function readHero15SoldierPublicationInputs(readJson) {
  const [approval, relations, soldiers, normalNames, spNames, normalPresentation, spPresentation] = await Promise.all([
    readJson('docs/decisions/hero-15-minimal-soldier-publication.v1.json'),
    readJson('canonical/hero-soldier-relations.v1.json'),
    readJson('canonical/soldiers.v1.json'),
    readJson('canonical/normal-soldier-localizations-ko.v1.json'),
    readJson('canonical/sp-soldier-localizations-ko.v1.json'),
    readJson('generated/normal-soldiers.v1.json'),
    readJson('generated/sp-soldiers.v1.json'),
  ]);
  return { approval, relations, soldiers, normalNames, spNames, normalPresentation, spPresentation };
}

function renderHero15SoldierNames({ approval, relations, soldiers, normalNames, spNames, normalPresentation, spPresentation }) {
  if (approval.heroId !== 15 || approval.surface !== HERO_15_MINIMAL_DETAIL_FRAGMENT
    || approval.status !== 'APPROVED') throw new Error('Hero 15 Soldier publication scope mismatch');
  const { records } = JSON.parse(renderHero15SoldierInternal({ relations, soldiers }));
  const expectedPublicKeys = [
    ['NORMAL', [210, 326, 602, 621, 802, 811, 815]],
    ['SP', [5210, 5326, 5602, 5621, 5802, 5811, 5815]],
  ].flatMap(([namespace, ids]) => ids.map(id => [namespace, id]));
  if (!Array.isArray(approval.soldiers)
    || !isDeepStrictEqual(approval.soldiers.map(({ namespace, soldierId }) => [namespace, soldierId]), expectedPublicKeys)) {
    throw new Error('Hero 15 Soldier public keys or order differ from the approved 14-pair scope');
  }
  const namesByVariant = { NORMAL: normalNames.records, SP: spNames.records };
  const rows = approval.soldiers.map(({ soldierId, namespace }) => {
    const matches = records.filter(row => row.soldierId === soldierId && row.soldierIdentity.variant === namespace);
    if (matches.length !== 1) throw new Error(`Hero 15 Soldier public relationship is unresolved for ${namespace} ${soldierId}`);
    const names = namesByVariant[namespace].filter(row => row.soldierId === soldierId);
    if (names.length !== 1 || !names[0].nameKo?.trim()) {
      throw new Error(`Hero 15 Soldier name is unresolved for ${namespace} ${soldierId}`);
    }
    return { soldierId, namespace, nameKo: names[0].nameKo };
  });
  if (!isDeepStrictEqual(rows, approval.soldiers)) {
    throw new Error('Hero 15 Soldier names differ from the approved subset');
  }
  if (approval.navigation?.status !== 'APPROVED' || approval.navigation.approval?.kind !== 'DIRECT_USER_STANDING_APPROVAL') {
    throw new Error('Hero 15 Soldier navigation publication scope mismatch');
  }
  const targets = {
    NORMAL: [normalPresentation.soldiers, 'normalSoldierId', 'normal-soldier'],
    SP: [spPresentation.soldiers, 'spSoldierId', 'sp-soldier'],
  };
  return rows.map(({ soldierId, namespace, nameKo }) => {
    const [published, idField, prefix] = targets[namespace];
    const matches = published.filter((entry) => entry[idField] === soldierId);
    if (matches.length !== 1 || matches[0].nameKo !== nameKo) {
      throw new Error(`Hero 15 Soldier navigation target mismatch for ${namespace} ${soldierId}`);
    }
    return { namespace, nameKo, fragment: `${prefix}-${soldierId}` };
  });
}

const finalJobMovementDecisionPath = 'docs/decisions/hero-15-minimal-final-job-movement-publication.v1.json';

export async function readHero15JobPublicationInputs(readJson) {
  const [approval, tree, movementDecision, movement, effectsDecision, heartFetterLevels, rankDecision, jobLevelStats] = await Promise.all([
    readJson('docs/decisions/hero-15-minimal-job-publication.v1.json'),
    loadJobTree(),
    readJson(finalJobMovementDecisionPath),
    readJson('canonical/hero-15-final-job-movement.v1.json'),
    readJson('docs/decisions/hero-15-minimal-heart-fetter-effects-publication.v1.json'),
    readJson('canonical/hero-heart-fetter-raw-conditions.v1.json'),
    readJson('docs/decisions/hero-15-minimal-job-rank-publication.v1.json'),
    readJson('canonical/hero-job-level-raw-stats.v1.json'),
  ]);
  return { approval, tree, movementDecision, movement, effectsDecision, heartFetterLevels, rankDecision, jobLevelStats };
}

function renderHero15SoldierCommand({ commandDecision, commandBase, commandBond }) {
  const labels = { hp: '생명', at: '공격', df: '방어', magicDf: '마방' };
  if (commandDecision?.schemaVersion !== 1 || commandDecision.status !== 'APPROVED'
    || commandDecision.heroId !== 15 || commandDecision.surface !== HERO_15_MINIMAL_DETAIL_FRAGMENT
    || commandDecision.approval?.kind !== 'DIRECT_USER_STANDING_APPROVAL'
    || JSON.stringify(commandDecision.labelsKo) !== JSON.stringify(labels)) {
    throw new Error('Hero 15 Soldier Command publication scope mismatch');
  }
  const groups = [
    ['기본 지휘', commandBase, 'base', { hp: 15, magicDf: 15 }],
    ['최대 레벨 일반 유대', commandBond, 'contribution', { hp: 25, at: 10, df: 10, magicDf: 25 }],
  ];
  return groups.map(([title, owner, field, expected]) => {
    const [row] = owner.records;
    const values = row?.[field];
    if (owner.schemaVersion !== 1 || owner.records.length !== 1 || row.heroId !== 15
      || Object.keys(values ?? {}).length !== Object.keys(expected).length
      || !Object.entries(expected).every(([key, value]) => values[key] === value)) {
      throw new Error('Hero 15 Soldier Command owner values mismatch');
    }
    const modifiers = Object.keys(expected).map((key) => `${labels[key]} +${values[key]}%`);
    return `${title} · ${modifiers.join(' · ')}`;
  });
}

function projectHeartFetterEffects(decision, heartFetterLevels, directEdges) {
  // Exact display tuples and UTF-8 source and translation digests verified against the pinned sources.
  const expected = [
    [154, 811, 4, 70421, '先知', '64624ce0f83ebc05770eaa8da912f01097470baa82ea31d837aac610851f32da'],
    [154, 811, 7, 70423, '先知', 'be46b705c0c66b451900d35830a77a804565c555fc97dd9ee92c24c9aa6bf67a'],
    [155, 707, 4, 70422, '隐士', '5adeb50b0f01b3294926599d45149bd921ad761fd94cd8c035533d6482e555d9'],
    [155, 707, 7, 70424, '隐士', 'd6500e1a37e73346475d2fe37370c7c8490383d7d6de96ad6987db072e9fbd7b'],
  ];
  if (decision?.schemaVersion !== 1 || decision.status !== 'APPROVED_FOR_PR'
    || decision.heroId !== 15 || decision.surface !== HERO_15_MINIMAL_DETAIL_FRAGMENT
    || decision.source?.gitBlobSha1 !== 'dbd7f8f94702bb43d2ceb0091e9755c9aebaed19'
    || decision.source.sha256 !== '2ff6d67e8c010037597928bccd2dc7b4b9abc0d2a78c9705d816c8218df3e741'
    || decision.koreanOverlay?.gitBlobSha1 !== 'b884f7594636800233aea40566918487d919a4d9'
    || decision.koreanOverlay.officialKrProvenanceStatus !== 'NOT_VERIFIED'
    || decision.rows?.length !== expected.length) {
    throw new Error('Hero 15 Heart Fetter display scope or source mismatch');
  }
  const byConnection = new Map();
  for (const [connectionId, jobId, level, skillId, jobNameCn, descriptionHash] of expected) {
    const rows = decision.rows.filter((row) => row.skillId === skillId);
    const levels = heartFetterLevels.records.filter((entry) => entry.heroId === 15
      && entry.heartFetterId === 15 && entry.heartFetterLevel === level && entry.skillId === skillId);
    const [row] = rows;
    if (rows.length !== 1 || levels.length !== 1
      || row.connectionId !== connectionId || row.jobId !== jobId || row.level !== level
      || row.sourceIndex !== levels[0].sourceProvenance.skillSourceIndex
      || directEdges.filter((edge) => edge.successorConnectionId === connectionId && edge.successorJobId === jobId).length !== 1
      || !row.descriptionCn?.startsWith(`职业为${jobNameCn}生效:`)
      || typeof row.descriptionKo !== 'string'
      || createHash('sha256').update(row.descriptionCn).update('\n').update(row.descriptionKo).digest('hex') !== descriptionHash) {
      throw new Error(`Hero 15 Heart Fetter display row mismatch for Skill ${skillId}`);
    }
    exactKeys(row, ['connectionId', 'jobId', 'level', 'skillId', 'sourceIndex', 'descriptionCn', 'descriptionKo'], 'Hero 15 Heart Fetter display row');
    if (!byConnection.has(connectionId)) byConnection.set(connectionId, []);
    byConnection.get(connectionId).push({ level, descriptionKo: row.descriptionKo });
  }
  return byConnection;
}

function projectHero15JobRanks(decision, jobLevelStats, jobs) {
  if (decision?.schemaVersion !== 1 || decision.status !== 'APPROVED'
    || decision.heroId !== 15 || decision.surface !== HERO_15_MINIMAL_DETAIL_FRAGMENT
    || decision.approval?.kind !== 'DIRECT_USER_STANDING_APPROVAL'
    || decision.source?.blobSha1 !== '4cbcac591ff5bc8d7cf2dcbf971cf2465f0cb133'
    || decision.rows?.length !== jobs.length) {
    throw new Error('Hero 15 Job rank publication scope mismatch');
  }
  return new Map(jobs.map(({ connectionId, jobId, localization: { nameKo } }) => {
    const rows = decision.rows.filter((row) => row.connectionId === connectionId && row.jobId === jobId);
    const levels = jobLevelStats.records.filter((row) => row.heroId === 15
      && row.jobConnectionId === connectionId && row.jobId === jobId);
    const [row] = rows;
    if (rows.length !== 1 || levels.length === 0 || ![2, 3, 4].includes(row.rank)
      || levels.some((level) => level.jobRank !== row.rank) || row.labelKo !== `T${row.rank} ${nameKo}`) {
      throw new Error(`Hero 15 Job rank display mismatch for Connection ${connectionId}`);
    }
    return [connectionId, row.rank];
  }));
}

function renderHero15JobPaths({ approval, tree, movementDecision, movement, effectsDecision, heartFetterLevels, rankDecision, jobLevelStats }) {
  if (approval.heroId !== 15 || approval.surface !== HERO_15_MINIMAL_DETAIL_FRAGMENT
    || approval.status !== 'APPROVED') throw new Error('Hero 15 Job publication scope mismatch');
  const { jobs, directEdges } = JSON.parse(renderJobTree(tree));
  if (jobs.some(({ localization }) => localization.status !== 'ADMITTED' || !localization.nameKo?.trim())) {
    throw new Error('Hero 15 Job Korean name is absent');
  }
  const names = new Map(jobs.map(({ jobId, localization }) => [jobId, localization.nameKo]));
  const paths = directEdges.map(({ predecessorJobId, successorJobId }) => [
    predecessorJobId, successorJobId, names.get(predecessorJobId), names.get(successorJobId),
  ]);
  if (JSON.stringify(paths) !== JSON.stringify(approval.paths)) {
    throw new Error('Hero 15 Job paths differ from the approved direct edges');
  }
  const approvedEndpoints = new Map([[154, 811], [155, 707]]);
  const label = movementDecision?.movementLabel;
  const source = movementDecision?.source;
  if (movementDecision?.schemaVersion !== 1 || movementDecision.status !== 'APPROVED'
    || movementDecision.heroId !== 15 || movementDecision.surface !== HERO_15_MINIMAL_DETAIL_FRAGMENT
    || movementDecision.approval?.originalMessageId !== 'bbb2164c-5198-4732-b08a-22ac1ef252a2'
    || movement?.schemaVersion !== 1 || movement.provenance !== finalJobMovementDecisionPath
    || movement.records?.length !== approvedEndpoints.size || source?.records?.length !== approvedEndpoints.size
    || source.gitBlobSha1 !== '4cbcac591ff5bc8d7cf2dcbf971cf2465f0cb133'
    || source.sha256 !== '2e522fc464549cfe7ed1f5974e166b3952fa7398e07d0610ec2a90b950e094cf'
    || label?.gitBlobSha1 !== '422078f935ec57a66b4763514fa2da8f2d3fccda'
    || label.id !== 2 || label.key !== 'WALK' || label.sourceNameKr !== '보행 이동' || label.displayNameKo !== '보행') {
    throw new Error('Hero 15 final Job movement publication scope or source mismatch');
  }
  const attributes = new Map();
  for (const [connectionId, jobId] of approvedEndpoints) {
    const rows = movement.records.filter((row) => row.connectionId === connectionId);
    const sourceRows = source.records.filter((row) => row.connectionId === connectionId);
    const row = rows[0];
    const native = sourceRows[0]?.fields;
    if (rows.length !== 1 || sourceRows.length !== 1 || row.heroId !== 15 || row.jobId !== jobId || native?.ID !== jobId
      || jobs.filter((job) => job.connectionId === connectionId && job.jobId === jobId).length !== 1
      || directEdges.filter((edge) => edge.successorConnectionId === connectionId && edge.successorJobId === jobId).length !== 1
      || row.BF_AttackDistance !== native.BF_AttackDistance || row.BF_MovePoint !== native.BF_MovePoint
      || row.MoveType !== native.MoveType || row.MoveType !== label.id
      || !Number.isInteger(row.BF_AttackDistance) || !Number.isInteger(row.BF_MovePoint)) {
      throw new Error('Hero 15 final Job movement row or endpoint mismatch');
    }
    attributes.set(connectionId, `기본 사거리 ${row.BF_AttackDistance} · ${label.displayNameKo} · 이동력 ${row.BF_MovePoint}`);
  }
  const effects = projectHeartFetterEffects(effectsDecision, heartFetterLevels, directEdges);
  const ranks = projectHero15JobRanks(rankDecision, jobLevelStats, jobs);
  return directEdges.map(({ predecessorJobId, predecessorConnectionId, successorJobId, successorConnectionId }) => {
    const path = {
      fromNameKo: names.get(predecessorJobId), fromRank: ranks.get(predecessorConnectionId),
      toNameKo: names.get(successorJobId), toRank: ranks.get(successorConnectionId),
    };
    const baseAttributesKo = attributes.get(successorConnectionId);
    return baseAttributesKo === undefined ? path : {
      ...path, baseAttributesKo, heartFetterEffects: effects.get(successorConnectionId),
    };
  });
}

function projectOrdinarySkillCosts(decision, owner, approvedIds) {
  if (decision?.schemaVersion !== 1 || decision.status !== 'APPROVED' || decision.heroId !== 15
    || decision.surface !== HERO_15_MINIMAL_DETAIL_FRAGMENT || decision.owner !== ordinarySkillCostOwnerPath
    || decision.approval?.kind !== 'DIRECT_USER_STANDING_APPROVAL'
    || decision.approval.workId !== '6b06c8ec-d3c0-83ee-a8dd-73f2f9aca716'
    || decision.approval.originalMessageId !== '48a8bc75-6dbb-42c3-83b9-a185c0d0d25c'
    || !Array.isArray(decision.rows) || decision.rows.length !== approvedIds.length
    || owner?.schemaVersion !== 1 || !Array.isArray(owner.records)
    || new Set(owner.records.map(({ skillId }) => skillId)).size !== owner.records.length
    || owner.records.some(({ heroId, skillId, skillCost }) =>
      heroId !== 15 || !approvedIds.includes(skillId) || ![1, 2].includes(skillCost))) {
    throw new Error('Hero 15 ordinary SkillCost publication scope mismatch');
  }
  const costs = new Map();
  for (const skillId of approvedIds) {
    const rows = decision.rows.filter((row) => row.skillId === skillId);
    if (rows.length !== 1) throw new Error(`Hero 15 ordinary SkillCost decision coverage mismatch for ${skillId}`);
    const [row] = rows;
    if (row.status === 'MANUAL_REVIEW' && typeof row.reason === 'string' && row.reason.trim()) continue;
    const cost = owner.records.find((record) => record.skillId === skillId)?.skillCost;
    if (row.status !== 'APPROVED' || cost === undefined || row.shardCost !== cost || row.legacyCostLabel !== `${cost}코스트`) {
      throw new Error(`Hero 15 ordinary SkillCost source or display mismatch for ${skillId}`);
    }
    costs.set(skillId, cost);
  }
  return costs;
}

const ordinarySkillShardPaths = new Map([
  [10801, 'heroDirectSkills/0'], [10816, 'jobLevelAcquisitions/0/skill'], [10805, 'jobLevelAcquisitions/1/skill'],
  [10707, 'jobLevelAcquisitions/2/skill'], [10705, 'jobLevelAcquisitions/3/skill'], [10804, 'jobLevelAcquisitions/4/skill'],
  [10807, 'jobLevelAcquisitions/5/skill'], [6009, 'jobLevelAcquisitions/6/skill'], [11786, 'jobLevelAcquisitions/7/skill'],
]);

function projectOrdinarySkillLabels(decision, owner, approvedIds, {
  field, ownerPath, ownerField, shardField, pointerKey, comparisonKey, labelKey, hiddenTexts, labels,
}) {
  if (decision?.schemaVersion !== 1 || decision.status !== 'APPROVED' || decision.heroId !== 15
    || decision.surface !== HERO_15_MINIMAL_DETAIL_FRAGMENT || decision.owner !== ownerPath
    || decision.approval?.kind !== 'DIRECT_USER_STANDING_APPROVAL'
    || decision.approval.workId !== '6b06c8ec-d3c0-83ee-a8dd-73f2f9aca716'
    || decision.approval.originalMessageId !== '48a8bc75-6dbb-42c3-83b9-a185c0d0d25c'
    || decision.legacyComparison?.shardBlobSha1 !== '7cc3f9e79395e79b08d99c79905f69a0bba9b1bb'
    || !Array.isArray(decision.rows) || decision.rows.length !== approvedIds.length
    || owner?.schemaVersion !== 1 || !Array.isArray(owner.records)
    || new Set(owner.records.map(({ skillId }) => skillId)).size !== owner.records.length
    || owner.records.some(({ heroId, skillId }) => heroId !== 15 || !approvedIds.includes(skillId))) {
    throw new Error(`Hero 15 ordinary ${field} publication scope mismatch`);
  }
  const projected = new Map();
  for (const skillId of approvedIds) {
    const rows = decision.rows.filter((row) => row.skillId === skillId);
    if (rows.length !== 1) throw new Error(`Hero 15 ordinary ${field} decision coverage mismatch for ${skillId}`);
    const [row] = rows;
    if (row.status === 'MANUAL_REVIEW' && typeof row.reason === 'string' && row.reason.trim()) continue;
    const sourceText = owner.records.find((record) => record.skillId === skillId)?.[ownerField];
    if (row[pointerKey] !== `/normal/skills/${ordinarySkillShardPaths.get(skillId)}/${shardField}` || row[comparisonKey] !== sourceText) {
      throw new Error(`Hero 15 ordinary ${field} shard mismatch for ${skillId}`);
    }
    if (hiddenTexts.has(skillId)) {
      if (row.status !== 'HIDDEN' || sourceText !== hiddenTexts.get(skillId) || Object.hasOwn(row, labelKey)) {
        throw new Error(`Hero 15 ordinary ${field} hidden row mismatch for ${skillId}`);
      }
      continue;
    }
    const label = labels.get(sourceText);
    if (row.status !== 'APPROVED' || label === undefined || row[labelKey] !== label) {
      throw new Error(`Hero 15 ordinary ${field} source or display mismatch for ${skillId}`);
    }
    projected.set(skillId, label);
  }
  return projected;
}

function renderHero15OrdinarySkills({
  skillDecision, skillReferences, skillIdentities, ordinarySkillCostDecision, ordinarySkillCosts,
  ordinarySkillCooldownDecision, ordinarySkillCooldowns, ordinarySkillDistanceDecision, ordinarySkillDistances,
  ordinarySkillAreaDecision, ordinarySkillAreaEvidence, ordinarySkillAreas,
  ordinarySkillTypeDecision, ordinarySkillTypeEvidence, ordinarySkillTypes,
}) {
  const approvedIds = [10801, 10816, 10805, 10707, 10705, 10804, 10807, 6009, 11786];
  const namesOnly = new Set([10705, 10804, 6009]);
  const ordinaryKinds = new Set(['HERO_DIRECT_SKILL_REFERENCE', 'JOB_LEVEL_SKILL_ACQUISITION']);
  const references = skillReferences.records.filter(({ heroId, referenceKind }) => heroId === 15 && ordinaryKinds.has(referenceKind));
  if (skillDecision?.status !== 'APPROVED' || skillDecision.heroId !== 15
    || skillDecision.surface !== HERO_15_MINIMAL_DETAIL_FRAGMENT || skillDecision.displayAuthority !== 'PROJECT_DISPLAY_ONLY'
    || skillDecision.source?.canonicalSnapshot !== skillIdentities.sourceScope
    || JSON.stringify(skillDecision.skills?.map(({ skillId }) => skillId)) !== JSON.stringify(approvedIds)
    || JSON.stringify(references.map(({ skillId }) => skillId)) !== JSON.stringify(approvedIds)) {
    throw new Error('Hero 15 ordinary Skill publication scope mismatch');
  }
  const costs = projectOrdinarySkillCosts(ordinarySkillCostDecision, ordinarySkillCosts, approvedIds);
  const cooldowns = projectOrdinarySkillLabels(ordinarySkillCooldownDecision, ordinarySkillCooldowns, approvedIds, {
    field: 'CDText', ownerPath: ordinarySkillCooldownOwnerPath, ownerField: 'cdText', shardField: 'cooldown',
    pointerKey: 'shardCooldownPointer', comparisonKey: 'shardCooldown', labelKey: 'legacyCooldownLabelKo',
    hiddenTexts: new Map([[10801, '无'], [6009, '-']]),
    labels: new Map([['1回合', '쿨 1턴'], ['2回合', '쿨 2턴'], ['3回合', '쿨 3턴'], ['4回合', '쿨 4턴']]),
  });
  const distances = projectOrdinarySkillLabels(ordinarySkillDistanceDecision, ordinarySkillDistances, approvedIds, {
    field: 'DistanceText', ownerPath: ordinarySkillDistanceOwnerPath, ownerField: 'distanceText', shardField: 'range',
    pointerKey: 'shardDistancePointer', comparisonKey: 'shardDistanceText', labelKey: 'legacyDistanceLabelKo',
    hiddenTexts: new Map([[6009, '-']]),
    labels: new Map([['2格', '사거리 2칸'], ['3格', '사거리 3칸']]),
  });
  validateHero15OrdinarySkillAreas(ordinarySkillAreaEvidence, ordinarySkillAreas);
  const areas = projectOrdinarySkillLabels(ordinarySkillAreaDecision, ordinarySkillAreas, approvedIds, {
    field: 'RangeText', ownerPath: hero15AreaCanonicalPath, ownerField: 'rangeText', shardField: 'areaOrTarget',
    pointerKey: 'shardAreaPointer', comparisonKey: 'shardAreaText', labelKey: 'legacyAreaLabelKo',
    hiddenTexts: new Map([[6009, '-']]),
    labels: new Map([['单体', '범위 단일'], ['3格', '범위 3칸'], ['6格', '범위 6칸']]),
  });
  validateHero15OrdinarySkillTypes(ordinarySkillTypeEvidence, ordinarySkillTypes);
  if (ordinarySkillTypeDecision?.legacyComparison?.mappingBlobSha1 !== 'c88dc1a8dca4bfe0591c1b3d32b511c3a97a7e36') {
    throw new Error('Hero 15 ordinary TypeText Korean mapping pin mismatch');
  }
  const types = projectOrdinarySkillLabels(ordinarySkillTypeDecision, ordinarySkillTypes, approvedIds, {
    field: 'TypeText', ownerPath: hero15TypeCanonicalPath, ownerField: 'typeText', shardField: 'displayType',
    pointerKey: 'shardTypePointer', comparisonKey: 'shardTypeText', labelKey: 'legacyTypeLabelKo',
    hiddenTexts: new Map(),
    labels: new Map([['治疗', '치료'], ['支援', '지원'], ['魔法伤害', '마법 피해'], ['被动', '패시브'], ['召唤', '소환']]),
  });
  return skillDecision.skills.map(({ skillId, sourceNameCn, sourceDescSha256, nameKo, descriptionKo }) => {
    const identities = skillIdentities.records.filter((row) => row.skillId === skillId);
    const identity = identities[0];
    if (identities.length !== 1 || identity.nameCn !== sourceNameCn
      || createHash('sha256').update(identity.descriptionCn).digest('hex') !== sourceDescSha256
      || typeof nameKo !== 'string' || !nameKo.trim()
      || (namesOnly.has(skillId) ? descriptionKo !== undefined : typeof descriptionKo !== 'string' || !descriptionKo.trim())) {
      throw new Error(`Hero 15 ordinary Skill source or Korean display fields mismatch: ${skillId}`);
    }
    const display = { skillId, nameKo };
    if (descriptionKo !== undefined) display.descriptionKo = descriptionKo;
    if (costs.has(skillId)) display.cost = costs.get(skillId);
    if (cooldowns.has(skillId)) display.cooldownLabelKo = cooldowns.get(skillId);
    if (distances.has(skillId)) display.distanceLabelKo = distances.get(skillId);
    if (areas.has(skillId)) display.areaLabelKo = areas.get(skillId);
    if (types.has(skillId)) display.typeLabelKo = types.get(skillId);
    return display;
  });
}

function renderHero15CentralDiscipline({ centralDisciplineDecision: decision, skillReferences, skillIdentities }) {
  const references = skillReferences.records.filter(({ heroId, referenceKind }) =>
    heroId === 15 && referenceKind === 'HERO_CENTRAL_DISCIPLINE_SKILL_REFERENCE');
  const identities = skillIdentities.records.filter(({ skillId }) => skillId === 90089);
  if (decision?.status !== 'APPROVED' || decision.heroId !== 15 || decision.skillId !== 90089
    || decision.surface !== HERO_15_MINIMAL_DETAIL_FRAGMENT || decision.displayAuthority !== 'PROJECT_DISPLAY_ONLY'
    || references.length !== 1 || references[0].skillId !== 90089
    || references[0].sourceField !== 'ConfigDataHeroInfo.CastingLawSkill_ID'
    || references[0].endpointNamespace !== 'ConfigDataSkillInfo.ID'
    || identities.length !== 1
    || createHash('sha256').update(identities[0].descriptionCn).digest('hex') !== decision.sourceDescSha256
    || typeof decision.effectTextKo !== 'string' || !decision.effectTextKo.trim()) {
    throw new Error('Hero 15 Central Discipline publication scope or source mismatch');
  }
  return decision.effectTextKo;
}

function renderHero15CentralDisciplineGold({ centralDisciplineGoldDecision: decision, castingLawHero, castingLawLevels, castingLawRaw }) {
  const templateIds = [14, 12, 37, 40, 41];
  const range = [1, 10];
  // Ordered [template ID, list index, explicit LevelUp ID, raw row index, gold] tuples
  // independently verified against the pinned ConfigData snapshots.
  const projectionSha256 = '007f15969a64646a3b73d99af091453dae0d530e1988bbe6d1b825907491ef8d';
  if (decision?.schemaVersion !== 1 || decision.status !== 'APPROVED' || decision.heroId !== 15
    || decision.surface !== HERO_15_MINIMAL_DETAIL_FRAGMENT || decision.field !== 'centralDisciplineGoldTotal'
    || decision.unit !== 'gold' || !isDeepStrictEqual(decision.levels, range)
    || decision.approval?.kind !== 'DIRECT_USER_STANDING_APPROVAL'
    || decision.approval.workId !== '6b06c8ec-d3c0-83ee-a8dd-73f2f9aca716'
    || decision.approval.originalMessageId !== '48a8bc75-6dbb-42c3-83b9-a185c0d0d25c'
    || !isDeepStrictEqual(decision.canonicalSources, centralDisciplineGoldPaths)
    || decision.source?.field !== 'LevelUpGoldCost' || decision.source.orderedProjectionSha256 !== projectionSha256
    || !Array.isArray(decision.templates) || !isDeepStrictEqual(decision.templates.map(row => row.templateId), templateIds)) {
    throw new Error('Hero 15 Central Discipline Gold publication scope mismatch');
  }
  for (const [owner, count] of [[castingLawHero, 5], [castingLawLevels, 50], [castingLawRaw, 50]]) {
    if (owner?.schemaVersion !== 1 || !Array.isArray(owner.records) || owner.records.length !== count) {
      throw new Error('Hero 15 Central Discipline Gold Canonical population mismatch');
    }
  }
  if (!isDeepStrictEqual(castingLawLevels.sourceOrder, templateIds)
    || !castingLawHero.records.every((row, index) => row.heroId === 15 && row.templateId === templateIds[index]
      && row.sourceArrayIndex === index && row.sourceField === 'ConfigDataHeroInfo.CastingLawTemplates_ID'
      && row.templateNamespace === 'ConfigDataCastingLawTemplateInfo.ID')) {
    throw new Error('Hero 15 Central Discipline Gold Hero–Template references mismatch');
  }

  const levelUpIds = castingLawLevels.records.map(row => row.levelUpInfoId);
  if (new Set(levelUpIds).size !== 50 || !isDeepStrictEqual(castingLawRaw.sourceOrder, levelUpIds)) {
    throw new Error('Hero 15 Central Discipline Gold LevelUp order or uniqueness mismatch');
  }
  const subtotals = new Map(templateIds.map(id => [id, 0]));
  const tuples = castingLawLevels.records.map((row, index) => {
    const { templateId, sourceArrayIndex, levelUpInfoId, levelUpSourceArrayIndex } = row;
    const template = decision.templates[Math.floor(index / 10)];
    exactKeys(row, ['templateId', 'sourceField', 'sourceArrayIndex', 'levelUpInfoId', 'levelUpEndpointNamespace', 'levelUpSourceArrayIndex', 'levelUpRecordLocator'], 'Central Discipline Gold level reference');
    if (template.levelUpInfoIds?.length !== 10 || template.templateId !== templateId
      || sourceArrayIndex !== index % 10 || template.levelUpInfoIds[sourceArrayIndex] !== levelUpInfoId
      || row.sourceField !== 'ConfigDataCastingLawTemplateInfo.CastingLawLevelUpInfoList'
      || row.levelUpEndpointNamespace !== 'ConfigDataCastingLawLevelUpInfo.ID'
      || row.levelUpRecordLocator !== `ConfigDataCastingLawLevelUpInfo#ID=${levelUpInfoId}`) {
      throw new Error('Hero 15 Central Discipline Gold Template–LevelUp reference mismatch');
    }
    const detail = castingLawRaw.records[index];
    exactKeys(detail, ['levelUpInfoId', 'rawFields', 'provenance'], 'Central Discipline Gold LevelUp detail');
    exactKeys(detail.rawFields, ['ID', 'Name', 'LevelUpGoldCost'], 'Central Discipline Gold raw fields');
    const { ID, LevelUpGoldCost } = detail.rawFields;
    if (detail.levelUpInfoId !== levelUpInfoId || ID !== levelUpInfoId
      || !Number.isSafeInteger(LevelUpGoldCost) || LevelUpGoldCost <= 0) {
      throw new Error('Hero 15 Central Discipline Gold endpoint or value mismatch');
    }
    subtotals.set(templateId, subtotals.get(templateId) + LevelUpGoldCost);
    return [templateId, sourceArrayIndex, levelUpInfoId, levelUpSourceArrayIndex, LevelUpGoldCost];
  });
  if (createHash('sha256').update(JSON.stringify(tuples)).digest('hex') !== projectionSha256
    || !decision.templates.every(row => subtotals.get(row.templateId) === row.subtotalGold)) {
    throw new Error('Hero 15 Central Discipline Gold source projection or subtotal mismatch');
  }
  const total = [...subtotals.values()].reduce((sum, gold) => sum + gold, 0);
  if (total !== decision.totalGold) throw new Error('Hero 15 Central Discipline Gold approved total mismatch');
  return total;
}

function renderHero15AwakeningMaterials({ awakeningDecision: decision, awakeningInputs }) {
  const expected = [
    [1015, [[3247, '생령의 수정', 8], [3249, '심연의 수정', 8], [3253, '빛나는 별의 조각', 5]]],
    [2015, [[3254, '계절풍의 마음', 12], [3256, '대륙의 마음', 12], [3260, '영원한 달의 빛', 5]]],
  ];
  if (decision?.status !== 'APPROVED' || decision.heroId !== 15 || decision.surface !== HERO_15_MINIMAL_DETAIL_FRAGMENT
    || decision.scope !== 'SIX_VERIFIED_PROJECT_DISPLAY_ROWS'
    || decision.noticeKo !== '현재 검증된 각성 재료 6개를 표시합니다.'
    || JSON.stringify(decision.stages?.map(({ levelId, materials }) =>
      [levelId, materials.map(({ itemId, nameKo, count }) => [itemId, nameKo, count])])) !== JSON.stringify(expected)) {
    throw new Error('Hero 15 Awakening material publication scope mismatch');
  }
  const { stage1, stage2 } = JSON.parse(renderAwakeningInternal(awakeningInputs));
  const stages = decision.stages.map(({ levelId, materials }, index) => {
    const stage = [stage1, stage2][index];
    if (stage.reference.levelId !== levelId) throw new Error('Hero 15 Awakening material stage mismatch');
    return {
      stageLabelKo: `${index + 1}단계`,
      materials: materials.map(({ itemId, nameKo, count }) => {
        const matches = stage.goods.filter((row) => row.itemId === itemId);
        if (matches.length !== 1 || matches[0].goodsType !== 6 || matches[0].count !== count
          || matches[0].endpointNamespace !== 'ConfigDataItemInfo.ID') {
          throw new Error('Hero 15 Awakening material row mismatch');
        }
        return { nameKo, count };
      }),
    };
  });
  return { noticeKo: decision.noticeKo, stages };
}

function hasHero15FetterMissionReference({ fetterReferences, fetterDetails }, fetterId, missionId) {
  const references = fetterReferences.records.filter((row) => row.fetterId === fetterId);
  const details = fetterDetails.records.filter(({ detailKind, endpointId }) =>
    detailKind === 'FETTER_RAW_DETAIL' && endpointId === fetterId);
  const missionReferences = details[0]?.fields?.CompletionConditions?.filter(({ ConditionType }) => ConditionType === 2);
  return references.length === 1 && references[0].heroId === 15 && references[0].referenceKind === 'HERO_FETTER_ID_REFERENCE'
    && details.length === 1 && details[0].heroId === 15 && missionReferences?.length === 1
    && missionReferences[0].Parm1 === missionId;
}

function renderHero15Bond45Descriptions(inputs, heroLocalizations) {
  const { bond45Decision: decision } = inputs;
  const expected = [[4, 69, 5051, 13, 15, 155, '5'], [5, 70, 5052, 12, 15, 157, '7']];
  if (decision?.status !== 'APPROVED' || decision.heroId !== 15
    || decision.surface !== HERO_15_MINIMAL_DETAIL_FRAGMENT || decision.scope !== 'PROJECT_BOND_DESCRIPTION_ONLY'
    || JSON.stringify(decision.rows?.map(({ bondNumber, fetterId, missionId, companionHeroId, dungeonOwnerHeroId, stageId, stageNameNum }) =>
      [bondNumber, fetterId, missionId, companionHeroId, dungeonOwnerHeroId, stageId, stageNameNum])) !== JSON.stringify(expected)) {
    throw new Error('Hero 15 Bond 4/5 description publication scope mismatch');
  }
  return decision.rows.map(({ fetterId, missionId, companionHeroId, stageNameNum, descriptionKo }) => {
    const names = heroLocalizations.records.filter(({ heroId }) => heroId === companionHeroId);
    if (!hasHero15FetterMissionReference(inputs, fetterId, missionId)
      || names.length !== 1 || descriptionKo !== `${names[0].nameKo}과 함께 운명의문 ${stageNameNum} 클리어`) {
      throw new Error('Hero 15 Bond 4/5 description source mismatch');
    }
    return descriptionKo;
  });
}

function renderHero15Bond2Description(inputs, nameKo) {
  const { bond2Decision: decision } = inputs;
  if (decision?.status !== 'APPROVED' || decision.heroId !== 15 || decision.fetterId !== 67 || decision.missionId !== 5049
    || decision.surface !== HERO_15_MINIMAL_DETAIL_FRAGMENT || decision.scope !== 'PROJECT_TRANSLATED_SOURCE_DESCRIPTION_ONLY'
    || decision.source?.desc !== '使用莉亚娜完成时空裂缝3-6'
    || decision.descriptionKo !== `${nameKo}를 출전시켜 시공의 균열 3-6 클리어`
    || !hasHero15FetterMissionReference(inputs, 67, 5049)) {
    throw new Error('Hero 15 Bond 2 description publication scope or source mismatch');
  }
  return decision.descriptionKo;
}

function renderHero15Bond3Description(inputs) {
  const { bond3Decision: decision } = inputs;
  if (decision?.status !== 'APPROVED' || decision.heroId !== 15 || decision.fetterId !== 68 || decision.missionId !== 5050
    || decision.surface !== HERO_15_MINIMAL_DETAIL_FRAGMENT || decision.scope !== 'PROJECT_TRANSLATED_SOURCE_DESCRIPTION_ONLY'
    || decision.source?.desc !== '莉亚娜转职成为先知' || decision.descriptionKo !== '프로핏으로 전직'
    || !hasHero15FetterMissionReference(inputs, 68, 5050)) {
    throw new Error('Hero 15 Bond 3 description publication scope or source mismatch');
  }
  return decision.descriptionKo;
}

export function renderHero15MinimalDetail({ decision, heroIdentities, heroLocalizations, relations, equipmentIdentities, equipmentLocalizations, sourceHashes, profileInputs, soldierInputs, jobInputs }) {
  validateHero15IntegratedPublication(decision);
  exactKeys(sourceHashes, ['heroIdentity', 'heroLocalization', 'equipmentRelation', 'equipmentIdentity', 'equipmentLocalization'], 'Hero 15 Canonical source hashes');
  for (const key of Object.keys(sourceHashes)) {
    if (sourceHashes[key] !== decision.approvedScope.canonicalSources[key].sha256) throw new Error(`Hero 15 Canonical source hash changed: ${key}`);
  }
  for (const [value, label] of [[heroIdentities, 'Hero Identity'], [heroLocalizations, 'Hero Localization'], [relations, 'Hero-Equipment relation'], [equipmentIdentities, 'Equipment Identity'], [equipmentLocalizations, 'Equipment Localization']]) {
    if (value?.schemaVersion !== 1 || !Array.isArray(value.records)) throw new Error(`Unsupported ${label} input`);
  }
  const hero = heroIdentities.records.filter(({ heroId }) => heroId === 15);
  const heroName = heroLocalizations.records.filter(({ heroId }) => heroId === 15);
  const relation = relations.records.filter(({ heroId, equipmentId }) => heroId === 15 && equipmentId === 535);
  const heroRelations = relations.records.filter(({ heroId }) => heroId === 15);
  const equipmentRelations = relations.records.filter(({ equipmentId }) => equipmentId === 535);
  const equipment = equipmentIdentities.records.filter(({ equipmentId }) => equipmentId === 535);
  const equipmentName = equipmentLocalizations.records.filter(({ equipmentId }) => equipmentId === 535);
  if (hero.length !== 1 || heroName.length !== 1 || heroName[0].nameKo !== '리아나'
    || relation.length !== 1 || heroRelations.length !== 1 || equipmentRelations.length !== 1
    || equipment.length !== 1 || equipmentName.length !== 1
    || !equipmentName[0].nameKo?.trim() || !equipmentName[0].effectDescriptionKo?.trim()) {
    throw new Error('Hero 15 minimal detail Canonical inputs do not resolve the exact approved claims');
  }
  const [bond4DescriptionKo, bond5DescriptionKo] = renderHero15Bond45Descriptions(profileInputs, heroLocalizations);
  const consumer = {
    schemaVersion: 1,
    heroes: [{
      heroId: 15,
      nameKo: heroName[0].nameKo,
      profile: renderHero15Profile(profileInputs),
      soldiers: renderHero15SoldierNames(soldierInputs),
      soldierCommandLinesKo: renderHero15SoldierCommand(profileInputs),
      jobPaths: renderHero15JobPaths(jobInputs),
      centralDisciplineEffectKo: renderHero15CentralDiscipline(profileInputs),
      centralDisciplineGoldTotal: renderHero15CentralDisciplineGold(profileInputs),
      awakeningMaterials: renderHero15AwakeningMaterials(profileInputs),
      bond2DescriptionKo: renderHero15Bond2Description(profileInputs, heroName[0].nameKo),
      bond3DescriptionKo: renderHero15Bond3Description(profileInputs),
      bond4DescriptionKo,
      bond5DescriptionKo,
      fetterGold: renderHero15FetterGold(profileInputs),
      ordinarySkills: renderHero15OrdinarySkills(profileInputs),
      exclusiveEquipment: {
        equipmentId: 535,
        nameKo: equipmentName[0].nameKo,
        effectDescriptionKo: equipmentName[0].effectDescriptionKo,
      },
    }],
  };
  return `${JSON.stringify(consumer, null, 2)}\n`;
}

function renderHero15FetterGold({ goldDecision, goldOwner, fetterDetails, heartFetterDetails }) {
  const groups = [
    [66, '유대 1'], [67, '유대 2'], [68, '유대 3'], [69, '유대 4'], [70, '유대 5'], [15, '마음의 유대'],
  ];
  const levels = [2, 3, 4, 5, 6, 7, 8, 9, 10];
  if (goldDecision?.status !== 'APPROVED' || goldDecision.schemaVersion !== 1
    || goldDecision.heroId !== 15 || goldDecision.surface !== HERO_15_MINIMAL_DETAIL_FRAGMENT
    || goldDecision.approval?.kind !== 'DIRECT_USER_STANDING_APPROVAL'
    || goldDecision.groups?.length !== groups.length || goldOwner.goldLocators?.length !== groups.length * levels.length
    || JSON.stringify(goldDecision.targetLevels) !== JSON.stringify(levels)) {
    throw new Error('Hero 15 Fetter Gold publication scope mismatch');
  }
  return groups.map(([endpointId, labelKo]) => {
    const isHeart = endpointId === 15;
    const endpointKind = isHeart ? 'HEART_FETTER' : 'FETTER';
    const owner = isHeart ? heartFetterDetails : fetterDetails;
    const matchingDetails = owner.records.filter((row) => row.heroId === 15 && row.endpointId === endpointId);
    const matchingDecisions = goldDecision.groups.filter((row) => row.endpointKind === endpointKind && row.endpointId === endpointId);
    if (matchingDetails.length !== 1 || matchingDecisions.length !== 1 || matchingDecisions[0].labelKo !== labelKo) {
      throw new Error('Hero 15 Fetter Gold endpoint mismatch');
    }
    const [detail] = matchingDetails;
    const rows = levels.map((level) => {
      const matchingLocators = goldOwner.goldLocators.filter((row) => row.heroId === 15
        && row.endpointKind === endpointKind && row.endpointId === endpointId && row.targetLevel === level);
      const [locator] = matchingLocators;
      const gold = detail.fields.LevelUpGold?.[locator?.sourceArrayIndex];
      if (matchingLocators.length !== 1 || locator.sourceField !== 'LevelUpGold'
        || locator.sourceRecordLocator !== detail.sourceRecordLocator
        || locator.sourceArrayIndex !== level - 2 || !Number.isSafeInteger(gold) || gold <= 0) {
        throw new Error('Hero 15 Fetter Gold level locator mismatch');
      }
      return { level, gold };
    });
    if (JSON.stringify(rows.map(({ gold }) => gold)) !== JSON.stringify(matchingDecisions[0].gold)) {
      throw new Error('Hero 15 Fetter Gold values differ from the verified Legacy display');
    }
    return { labelKo, rows };
  });
}

export function validateHero15MinimalDetail({ generatedText, inputs }) {
  const expected = renderHero15MinimalDetail(inputs);
  if (generatedText !== expected) throw new Error('Generated Hero 15 minimal detail is stale or non-deterministic');
  const data = JSON.parse(generatedText);
  exactKeys(data, ['schemaVersion', 'heroes'], 'Generated Hero 15 minimal detail');
  if (data.schemaVersion !== 1 || data.heroes.length !== 1) throw new Error('Hero 15 minimal detail population or schema mismatch');
  exactKeys(data.heroes[0], ['heroId', 'nameKo', 'exclusiveEquipment', 'profile', 'soldiers', 'soldierCommandLinesKo', 'jobPaths', 'ordinarySkills', 'centralDisciplineEffectKo', 'centralDisciplineGoldTotal', 'awakeningMaterials', 'bond2DescriptionKo', 'bond3DescriptionKo', 'bond4DescriptionKo', 'bond5DescriptionKo', 'fetterGold'], 'Hero 15 minimal detail row');
  exactKeys(data.heroes[0].exclusiveEquipment, ['equipmentId', 'nameKo', 'effectDescriptionKo'], 'Hero 15 minimal equipment');
  if (data.heroes[0].heroId !== 15 || data.heroes[0].exclusiveEquipment.equipmentId !== 535) throw new Error('Hero 15 minimal detail endpoint is out of approved scope');
  return data;
}
