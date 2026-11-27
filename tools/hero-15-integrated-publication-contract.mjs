import { loadAwakeningInputs, renderAwakeningInternal } from './hero-15-awakening-internal-consumer.mjs';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { CANONICAL as HERO_CV_CANONICAL, renderHero15ProfileCvInternal } from './hero-15-profile-cv-internal.mjs';
import { loadInputs as loadJobTree, render as renderJobTree } from './hero-15-job-tree-internal.mjs';
import { loadPublicNormalSoldierLocalization } from './validate-normal-soldier-ko-localization.mjs';
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

export const bondKeyDecisionPath = 'docs/decisions/hero-15-minimal-bond-key-icons-publication.v1.json';
export const bondKeyAssets = [
  { itemId: 3200, sourcePath: 'UI/Icon/Item_ABS/FetterMaterial01.png',
    repositoryAsset: 'public/images/heroes/bond-materials/FetterMaterial01.png', path: 'assets/bond-materials/FetterMaterial01.png',
    blobSha1: '7fe77ca370a1154856f081adc2231052b585ddba', bytes: 16721 },
  { itemId: 3201, sourcePath: 'UI/Icon/Item_ABS/FetterMaterial02.png',
    repositoryAsset: 'public/images/heroes/bond-materials/FetterMaterial02.png', path: 'assets/bond-materials/FetterMaterial02.png',
    blobSha1: '66c4f6b619ccf07d441a0cf770ff3de9c5f5d610', bytes: 19861 },
  { itemId: 3202, sourcePath: 'UI/Icon/Item_ABS/FetterMaterial03.png',
    repositoryAsset: 'public/images/heroes/bond-materials/FetterMaterial03.png', path: 'assets/bond-materials/FetterMaterial03.png',
    blobSha1: '8f23f82ee1988a736ce579fd42f8a7a9fc6dfd8f', bytes: 21788 },
  { itemId: 3203, sourcePath: 'UI/Icon/Item_ABS/FetterMaterial04.png',
    repositoryAsset: 'public/images/heroes/bond-materials/FetterMaterial04.png', path: 'assets/bond-materials/FetterMaterial04.png',
    blobSha1: '532e8b864de1764b8ea181cd0453f410c058370c', bytes: 33716 },
];

export async function readHero15ProfileInputs(readJson) {
  const [approval, rarities, relations, names, sourceNamesApproval, nameMaster, englishNameEvidence, cvDecision, cvCanonical, skillDecision, skillReferences, skillIdentities, centralDisciplineDecision, awakeningDecision, awakeningInputs, bond3Decision, fetterReferences, fetterDetails, bond45Decision, bond2Decision, commandDecision, commandBase, commandBond, goldDecision, bond1GoldDecision, bond2GoldDecision, bond3GoldDecision, bond4GoldDecision, bond5GoldDecision, heartGoldDecision, bond1KeyDecision, bond2KeyDecision, bondKeyDecision, bondSelection, goldOwner, heartFetterDetails, ordinarySkillCostDecision, ordinarySkillCosts, ordinarySkillCooldownDecision, ordinarySkillCooldowns, ordinarySkillDistanceDecision, ordinarySkillDistances, ordinarySkillAreaDecision, ordinarySkillAreaEvidence, ordinarySkillAreas, ordinarySkillTypeDecision, ordinarySkillTypeEvidence, ordinarySkillTypes, centralDisciplineGoldDecision, headGoldDecision, castingLawHero, castingLawLevels, castingLawRaw] = await Promise.all([
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
    readJson('docs/decisions/hero-15-minimal-bond1-gold-total-publication.v1.json'),
    readJson('docs/decisions/hero-15-minimal-bond2-gold-total-publication.v1.json'),
    readJson('docs/decisions/hero-15-minimal-bond3-gold-total-publication.v1.json'),
    readJson('docs/decisions/hero-15-minimal-bond4-gold-total-publication.v1.json'),
    readJson('docs/decisions/hero-15-minimal-bond5-gold-total-publication.v1.json'),
    readJson('docs/decisions/hero-15-minimal-heart-fetter-gold-total-publication.v1.json'),
    readJson('docs/decisions/hero-15-minimal-bond1-key-totals-publication.v1.json'),
    readJson('docs/decisions/hero-15-minimal-bond2-key-totals-publication.v1.json'),
    readJson(bondKeyDecisionPath),
    readJson('evidence/source/bonds/hero15-fetter-references.v1.json'),
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
    readJson('docs/decisions/hero-15-minimal-central-discipline-head-gold-publication.v1.json'),
    readJson(centralDisciplineGoldPaths.hero),
    readJson(centralDisciplineGoldPaths.levels),
    readJson(centralDisciplineGoldPaths.raw),
  ]);
  return { approval, rarities, relations, names, sourceNamesApproval, nameMaster, englishNameEvidence, cvDecision, cvCanonical, skillDecision, skillReferences, skillIdentities, centralDisciplineDecision, awakeningDecision, awakeningInputs, bond3Decision, fetterReferences, fetterDetails, bond45Decision, bond2Decision, commandDecision, commandBase, commandBond, goldDecision, bond1GoldDecision, bond2GoldDecision, bond3GoldDecision, bond4GoldDecision, bond5GoldDecision, heartGoldDecision, bond1KeyDecision, bond2KeyDecision, bondKeyDecision, bondSelection, goldOwner, heartFetterDetails, ordinarySkillCostDecision, ordinarySkillCosts, ordinarySkillCooldownDecision, ordinarySkillCooldowns, ordinarySkillDistanceDecision, ordinarySkillDistances, ordinarySkillAreaDecision, ordinarySkillAreaEvidence, ordinarySkillAreas, ordinarySkillTypeDecision, ordinarySkillTypeEvidence, ordinarySkillTypes,
    centralDisciplineGoldDecision, headGoldDecision, castingLawHero, castingLawLevels, castingLawRaw };
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
  const [approval, relations, soldiers, { normalLocalizations: normalNames }, spNames, normalPresentation, spPresentation] = await Promise.all([
    readJson('docs/decisions/hero-15-minimal-soldier-publication.v1.json'),
    readJson('canonical/hero-soldier-relations.v1.json'),
    readJson('canonical/soldiers.v1.json'),
    loadPublicNormalSoldierLocalization(),
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

// Independently transcribed from the pinned Template 40 references and LevelUp gold fields.
export function renderHeadGoldSubtotal({ headGoldDecision: decision, castingLawHero, castingLawLevels, castingLawRaw }) {
  if (decision?.schemaVersion !== 1 || decision.status !== 'APPROVED' || decision.heroId !== 15
    || decision.surface !== HERO_15_MINIMAL_DETAIL_FRAGMENT || decision.slotType !== 'HEAD' || decision.templateId !== 40
    || !isDeepStrictEqual(decision.levels, [1, 10]) || decision.unit !== 'gold' || decision.placement !== '중앙율정 / 투구') {
    throw new Error('Head gold publication scope mismatch');
  }
  exactKeys(decision, ['schemaVersion', 'status', 'surface', 'heroId', 'slotType', 'templateId', 'levels', 'unit',
    'subtotalGold', 'placement', 'displayTextKo', 'displayDecisionReference', 'scope', 'source', 'slotEvidence'], 'Head gold decision');
  if (decision.slotEvidence?.blob !== 'd5e08e12823bc5a53c728cf4accfe0cf4ce79674'
    || decision.slotEvidence.record !== '/records/13' || decision.slotEvidence.slot !== '/records/13/slots/3') {
    throw new Error('Head gold slot evidence mismatch');
  }
  const heroRefs = castingLawHero.records.filter(row => row.heroId === 15 && row.templateId === 40);
  if (heroRefs.length !== 1 || heroRefs[0].sourceArrayIndex !== 3
    || heroRefs[0].sourceField !== 'ConfigDataHeroInfo.CastingLawTemplates_ID'
    || heroRefs[0].templateNamespace !== 'ConfigDataCastingLawTemplateInfo.ID') {
    throw new Error('Head gold Hero–Template relation mismatch');
  }
  const ids = [196, 197, 198, 199, 200, 10196, 10197, 10198, 10199, 10200];
  const indices = [195, 196, 197, 198, 199, 445, 446, 447, 448, 449];
  const gold = [50000, 70000, 120000, 200000, 300000, 380000, 460000, 560000, 660000, 800000];
  const refs = castingLawLevels.records.filter(row => row.templateId === decision.templateId);
  if (!isDeepStrictEqual(decision.source?.levelUpIds, ids) || !isDeepStrictEqual(decision.source?.sourceIndices, indices)
    || decision.source.field !== 'LevelUpGoldCost' || refs.length !== ids.length) {
    throw new Error('Head gold level reference scope mismatch');
  }
  const costs = refs.map((ref, i) => {
    if (ref.sourceArrayIndex !== i || ref.levelUpInfoId !== ids[i] || ref.levelUpSourceArrayIndex !== indices[i]
      || ref.sourceField !== 'ConfigDataCastingLawTemplateInfo.CastingLawLevelUpInfoList'
      || ref.levelUpEndpointNamespace !== 'ConfigDataCastingLawLevelUpInfo.ID') {
      throw new Error('Head gold Template–LevelUp relation mismatch');
    }
    const matches = castingLawRaw.records.filter(row => row.levelUpInfoId === ref.levelUpInfoId);
    if (matches.length !== 1 || matches[0].rawFields.ID !== ids[i] || matches[0].rawFields.LevelUpGoldCost !== gold[i]) {
      throw new Error(`Head gold source mismatch for LevelUp ${ids[i]}`);
    }
    return matches[0].rawFields.LevelUpGoldCost;
  });
  const subtotal = costs.reduce((sum, cost) => sum + cost, 0);
  const line = `투구 · Lv.1~10 소계 골드 ${subtotal.toLocaleString('ko-KR')}`;
  if (decision.subtotalGold !== subtotal || decision.displayTextKo !== line) throw new Error('Head gold subtotal display mismatch');
  return line;
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

export const bond1GoldValues = Object.freeze([1500, 2300, 3500, 5300, 8000, 12000, 18000, 27000, 41000]);
export const bond1GoldTotal = 118600;

export const bond2GoldValues = Object.freeze([5000, 7500, 11000, 17000, 26000, 39000, 59000, 89000, 130000]);
export const bond3GoldValues = Object.freeze([9000, 14000, 21000, 32000, 48000, 72000, 110000, 170000, 260000]);
export const bond4GoldValues = Object.freeze([15000, 23000, 35000, 53000, 80000, 120000, 180000, 270000, 410000]);
export const bond5GoldValues = Object.freeze([20000, 30000, 45000, 68000, 100000, 150000, 230000, 350000, 530000]);
export const heartFetterGoldValues = Object.freeze([10000, 15000, 23000, 35000, 53000, 74000, 100000, 140000, 200000]);
const bond1TotalScope = {
  fetterId: 66, labelKo: '유대 1', sourceRecordLocator: '/65', gold: bond1GoldValues, totalGold: bond1GoldTotal,
  authorization: { approvalMessageId: '48a8bc75-6dbb-42c3-83b9-a185c0d0d25c' },
};
const bond2TotalScope = {
  fetterId: 67, labelKo: '유대 2', sourceRecordLocator: '/66', gold: bond2GoldValues, totalGold: 383500,
  authorization: { approval: {
    work: '이전', date: '2026-11-26',
    quote: '지금 유대 2 합계 골드 383,500 표시와 검수된 두 Build 보완을 포함해, 실제 Future-guide 상세에 표시됐고 원본 근거·한국어 표기·현재 공개 조건이 확인된 같은 범위의 후속 작업은 건마다 다시 묻지 말고 진행해.',
  } },
};

const bond3TotalScope = {
  fetterId: 68, labelKo: '유대 3', sourceRecordLocator: '/67', gold: bond3GoldValues, totalGold: 736000,
  authorization: { approvalMessageId: '7720da79-b0f8-4c0d-9a31-09e27a9f6ffa' },
};
const bond4TotalScope = {
  fetterId: 69, labelKo: '유대 4', sourceRecordLocator: '/68', gold: bond4GoldValues, totalGold: 1186000,
  authorization: { approvalMessageId: '7720da79-b0f8-4c0d-9a31-09e27a9f6ffa' },
};
const bond5TotalScope = {
  fetterId: 70, labelKo: '유대 5', sourceRecordLocator: '/69', gold: bond5GoldValues, totalGold: 1523000,
  authorization: { approvalMessageId: '7720da79-b0f8-4c0d-9a31-09e27a9f6ffa' },
};

function validateBondGoldTotal(expected, decision, references, detail, locators, rows) {
  const { gold, totalGold, fetterId, labelKo, sourceRecordLocator, authorization } = expected;
  const levels = gold.map((_, i) => i + 2);
  const indices = gold.map((_, i) => i);
  if (!isDeepStrictEqual(decision, {
    schemaVersion: 1, status: 'APPROVED', ...authorization,
    surface: 'hero-minimal-detail-15', labelKo, heroId: 15, fetterId,
    sourceField: 'LevelUpGold', sourceRecordLocator, sourceArrayIndices: indices,
    targetLevels: levels, gold, totalGold,
  })) throw new Error(`${labelKo} Gold total approval scope mismatch`);
  const matches = references.records.filter(ref => ref.heroId === 15 && ref.fetterId === fetterId);
  const ref = matches[0];
  if (matches.length !== 1 || ref.heroInformationId !== 15 || ref.referenceKind !== 'HERO_FETTER_ID_REFERENCE'
    || ref.sourceField !== 'ConfigDataHeroInformationInfo.HeroFetters_ID' || ref.endpointNamespace !== 'ConfigDataHeroFetterInfo.ID'
    || detail.detailKind !== 'FETTER_RAW_DETAIL' || detail.endpointNamespace !== ref.endpointNamespace
    || detail.sourceRecordLocator !== `ConfigDataHeroFetterInfo#ID=${fetterId}`) throw new Error(`${labelKo} Gold total endpoint mismatch`);
  const selected = locators.filter(row => row.heroId === 15 && row.endpointKind === 'FETTER' && row.endpointId === fetterId);
  if (!isDeepStrictEqual(selected.map(row => row.targetLevel), levels)
    || !isDeepStrictEqual(selected.map(row => row.sourceArrayIndex), indices)
    || selected.some(row => row.endpointNamespace !== ref.endpointNamespace || row.locatorRule !== 'LevelUpGold[targetLevel-2]')) {
    throw new Error(`${labelKo} Gold total locator mismatch`);
  }
  if (!isDeepStrictEqual(detail.fields.LevelUpGold, gold)
    || rows.reduce((total, row) => total + row.gold, 0) !== totalGold) {
    throw new Error(`${labelKo} Gold total source vector or total mismatch`);
  }
}

const bond1KeySources = [
  { id: 3200, index: 391, png: 'FetterMaterial01.png', pngBlob: '7fe77ca370a1154856f081adc2231052b585ddba',
    webp: 'img/item/엔열쇠.webp', webpBlob: '9b5cdbb9e17cfed5b82ca68ff1f1e04a79b73e29', title: '순박한 마음의 열쇠' },
  { id: 3201, index: 392, png: 'FetterMaterial02.png', pngBlob: '66c4f6b619ccf07d441a0cf770ff3de9c5f5d610',
    webp: 'img/item/알열쇠.webp', webpBlob: '004d346c927a8b0dc6fc23ce62d0eb88ef30756f', title: '순수한 마음의 열쇠' },
];
const bond2KeySources = [...bond1KeySources, {
  id: 3202, index: 393, png: 'FetterMaterial03.png', pngBlob: '8f23f82ee1988a736ce579fd42f8a7a9fc6dfd8f',
  webp: 'img/item/스알열쇠.webp', webpBlob: '947bacea4b563b2d24c17c9a25b4d9be9aa02070', title: '빛나는 마음의 열쇠',
}];

function validateKeyNameSources(source, expected, bond) {
  const evidence = source?.nameEvidence;
  if (source?.repository !== 'LuceatLuxVestra42/langrisser-future-guide' || source.commit !== '6475e63ee23d18adf733756c26a14fa9e3ed662c'
    || evidence?.itemInfo?.path !== 'data/configdata/ConfigDataItemInfo.json' || evidence.itemInfo.blob !== 'fd34c0a83bd403c1fd01d34f3439e4c24a794f5e'
    || evidence.legacyPngCommit !== '57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff'
    || !isDeepStrictEqual(evidence.sheet, { repository: 'redpanda7301/langrisser', commit: '311c5e44f39c6938c78031bb2af3206e39ea270b',
      path: 'classup.html', blob: '5aa5a9bd9f94ac08c9c0b1cbc21a27b0601ab8c2' }) || evidence.items?.length !== expected.length) {
    throw new Error(`Bond ${bond} key name source version mismatch`);
  }
  for (const key of expected) {
    const item = evidence.items.find(row => row.itemId === key.id);
    if (item?.itemInfoIndex !== key.index || item.icon !== `UI/Icon/Item_ABS/${key.png}`
      || !isDeepStrictEqual(item.legacyPng, { path: `public/images/heroes/bond-materials/${key.png}`, blob: key.pngBlob })) {
      throw new Error(`Bond ${bond} key ItemInfo or PNG source mismatch for ID ${key.id}`);
    }
    if (!isDeepStrictEqual(item.comparisonWebp, { path: key.webp, blob: key.webpBlob })) {
      throw new Error(`Bond ${bond} key comparison WebP source mismatch for ID ${key.id}`);
    }
    if (!isDeepStrictEqual(item.sheetImage, { src: `https://redpanda7301.github.io/langrisser/${key.webp}`, title: key.title })) {
      throw new Error(`Bond ${bond} key sheet image source mismatch for ID ${key.id}`);
    }
  }
}

function readKeyMaterialRows({ fetterReferences, fetterDetails, goldOwner }, endpointId, rowCount, levels, bond) {
  const refs = fetterReferences.records.filter(r => r.heroId === 15 && r.fetterId === endpointId);
  const details = fetterDetails.records.filter(r => r.heroId === 15 && r.endpointId === endpointId);
  const namespace = 'ConfigDataHeroFetterInfo.ID';
  const locator = `ConfigDataHeroFetterInfo#ID=${endpointId}`;
  if (refs.length !== 1 || refs[0].heroInformationId !== 15 || refs[0].referenceKind !== 'HERO_FETTER_ID_REFERENCE'
    || refs[0].sourceField !== 'ConfigDataHeroInformationInfo.HeroFetters_ID' || refs[0].endpointNamespace !== namespace
    || details.length !== 1 || details[0].detailKind !== 'FETTER_RAW_DETAIL'
    || details[0].endpointNamespace !== namespace || details[0].sourceRecordLocator !== locator) {
    throw new Error(`Bond ${bond} key source endpoint mismatch`);
  }
  const raw = details[0].fields.LevelUpMaterials;
  const relations = goldOwner.materials.filter(r => r.heroId === 15 && r.endpointKind === 'FETTER' && r.endpointId === endpointId);
  if (raw.length !== rowCount || relations.length !== raw.length || relations.some((r, i) =>
    r.sourceArrayIndex !== i || r.sourceField !== 'LevelUpMaterials' || r.sourceRecordLocator !== locator || r.endpointNamespace !== namespace
    || r.itemNamespace !== 'ConfigDataItemInfo.ID' || r.itemType !== raw[i].ItemType || r.itemId !== raw[i].ItemId
    || r.targetLevel !== raw[i].Level || !levels.includes(r.targetLevel))) {
    throw new Error(`Bond ${bond} key material locator mismatch`);
  }

  return raw;
}

function validateKeyItemEndpoint(goldOwner, itemId, itemType, bond) {
  const endpoints = goldOwner.itemEndpoints.filter(r => r.itemId === itemId && r.itemType === itemType);
  if (endpoints.length !== 1 || endpoints[0].endpointNamespace !== 'ConfigDataItemInfo.ID'
    || endpoints[0].sourceRecordLocator !== `ConfigDataItemInfo#ID=${itemId}`) throw new Error(`Bond ${bond} key ItemInfo endpoint mismatch`);
}

export function readBondKeyDisplay(inputs) {
  const { bondKeyDecision: decision, bondSelection: { source } } = inputs;
  const levels = [2, 3, 4, 5, 6, 7, 8, 9, 10];
  const groups = [
    { slot: 0, fetterId: 66, recordIndex: 65 },
    { slot: 1, fetterId: 67, recordIndex: 66 },
    { slot: 2, fetterId: 68, recordIndex: 67 },
  ];
  if (decision?.schemaVersion !== 1 || decision.status !== 'APPROVED'
    || decision.surface !== HERO_15_MINIMAL_DETAIL_FRAGMENT || decision.heroId !== 15
    || !isDeepStrictEqual(decision.groups, groups) || !isDeepStrictEqual(decision.levels, levels)
    || !isDeepStrictEqual(decision.placement, ['after-level-gold', 'immediately-below-group-gold-total'])
    || decision.configCommit !== '6475e63ee23d18adf733756c26a14fa9e3ed662c'
    || decision.legacyCommit !== '57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff'
    || decision.manifest !== 'data/generated/hero-bond-material-icon-assets.v1.json'
    || !isDeepStrictEqual(decision.assets, bondKeyAssets)) throw new Error('Bond key icon decision scope mismatch');

  // Reviewed positive counts in ascending level order, independently of the display table.
  const vectors = [
    [[3200, 2, [1, 2, 3, 4, 5, 6, 7, 8, 9], 45], [3201, 6, [1, 2, 3, 4, 5], 15]],
    [[3200, 2, [5, 6, 7, 8], 26], [3201, 2, [2, 3, 4, 5, 7, 9, 11, 13, 15], 69],
      [3202, 6, [1, 2, 3, 4, 6], 16]],
    [[3201, 2, [5, 8, 10, 12, 15], 50], [3202, 2, [2, 3, 3, 4, 5, 6, 7, 8, 9], 47],
      [3203, 7, [1, 2, 3, 4], 10]],
  ];
  return groups.map(({ slot, fetterId, recordIndex }) => {
    const info = source.heroInformationInfo;
    if (source.commit !== decision.configCommit || info.recordIndex !== 14 || info.fields.ID !== 15
      || info.fields.HeroFetters_ID[slot] !== fetterId
      || !source.heroFetterInfo.endpoints.some(row => row.recordIndex === recordIndex && row.id === fetterId)) {
      throw new Error('Bond key icon source selection mismatch');
    }
    const items = vectors[slot];
    const expectedRows = levels.flatMap(level => items.filter(([, start, counts]) =>
      level >= start && level < start + counts.length).map(([itemId, start, counts]) =>
      [level, 6, itemId, counts[level - start]]));
    const rows = readKeyMaterialRows(inputs, fetterId, expectedRows.length, levels, slot + 1);
    if (!isDeepStrictEqual(rows.map(r => [r.Level, r.ItemType, r.ItemId, r.Count]), expectedRows)) {
      throw new Error('Bond key icon source rows or quantities mismatch');
    }
    const totals = items.map(([itemId, , , expected]) => {
      validateKeyItemEndpoint(inputs.goldOwner, itemId, 6, slot + 1);
      const total = rows.filter(r => r.ItemId === itemId).reduce((sum, r) => sum + r.Count, 0);
      if (total !== expected) throw new Error('Bond key icon group total mismatch');
      return [itemId, total];
    });
    return { levels: levels.map(level => rows.filter(r => r.Level === level).map(r => [r.ItemId, r.Count])), totals };
  });
}

export function renderBond1KeyTotals(inputs) {
  const { bond1KeyDecision: decision, goldOwner } = inputs;
  const materials = [
    { itemType: 6, itemId: 3200, nameKo: '순박한 마음의 열쇠', count: 45 },
    { itemType: 6, itemId: 3201, nameKo: '순수한 마음의 열쇠', count: 15 },
  ];
  if (decision?.status !== 'APPROVED' || decision.schemaVersion !== 1 || decision.surface !== HERO_15_MINIMAL_DETAIL_FRAGMENT
    || decision.heroId !== 15 || decision.labelKo !== '유대 1' || decision.endpointKind !== 'FETTER' || decision.endpointId !== 66
    || decision.sourceField !== 'LevelUpMaterials' || !isDeepStrictEqual(decision.targetLevels, [2, 3, 4, 5, 6, 7, 8, 9, 10])
    || !isDeepStrictEqual(decision.materials, materials)
    || decision.approval?.userText !== '순박한 마음의 열쇠 ×45 · 순수한 마음의 열쇠 ×15’를 텍스트로 공개하고, 검증이 통과하면 병합해도 된다') {
    throw new Error('Bond 1 key publication scope mismatch');
  }
  if (decision.approval.scope !== 'Two Korean project display names and their totals as plain text on Liana’s existing Bond 1 detail.') {
    throw new Error('Bond 1 key approval scope mismatch');
  }
  if (decision.approval.messageId !== 'bbb21ccc-89dc-453b-ba7a-d672d198235c') {
    throw new Error('Bond 1 key approval message ID mismatch');
  }
  validateKeyNameSources(decision.source, bond1KeySources, 1);
  const raw = readKeyMaterialRows(inputs, 66, 14, decision.targetLevels, 1);
  // Per-item counts in target-level order from the pinned Fetter 66 record.
  const countsByItem = [[1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 5]];
  return decision.materials.map(({ itemType, itemId, nameKo, count }, i) => {
    validateKeyItemEndpoint(goldOwner, itemId, itemType, 1);
    const rows = raw.filter(r => r.ItemId === itemId && r.ItemType === itemType);
    const levels = i === 0 ? decision.targetLevels : decision.targetLevels.slice(4);
    const total = rows.reduce((sum, r) => sum + r.Count, 0);
    if (!isDeepStrictEqual(rows.map(r => r.Level), levels) || !isDeepStrictEqual(rows.map(r => r.Count), countsByItem[i])
      || total !== count) throw new Error('Bond 1 key levels or quantities mismatch');
    return `${nameKo} ×${total}`;
  }).join(' · ');
}

export function renderBond2KeyTotals(inputs) {
  const { bond2KeyDecision: decision, goldOwner } = inputs;
  const materials = [
    { itemType: 6, itemId: 3200, nameKo: '순박한 마음의 열쇠', count: 26 },
    { itemType: 6, itemId: 3201, nameKo: '순수한 마음의 열쇠', count: 69 },
    { itemType: 6, itemId: 3202, nameKo: '빛나는 마음의 열쇠', count: 16 },
  ];
  const levels = [2, 3, 4, 5, 6, 7, 8, 9, 10];
  if (decision?.status !== 'APPROVED' || decision.schemaVersion !== 1 || decision.surface !== HERO_15_MINIMAL_DETAIL_FRAGMENT
    || decision.heroId !== 15 || decision.labelKo !== '유대 2' || decision.endpointKind !== 'FETTER' || decision.endpointId !== 67
    || decision.sourceField !== 'LevelUpMaterials' || !isDeepStrictEqual(decision.targetLevels, levels)
    || !isDeepStrictEqual(decision.materials, materials) || decision.approval?.userText !== '리아나 유대 2의 Lv.2~10 골드 합계 아래에 ‘순박한 마음의 열쇠 ×26 · 순수한 마음의 열쇠 ×69 · 빛나는 마음의 열쇠 ×16’을 텍스트로 공개하는 걸 승인해. 검수된 원본 대조와 필수 검증이 모두 통과하면 같은 Work에서 병합해도 돼.') {
    throw new Error('Bond 2 key publication scope mismatch');
  }
  if (decision.approval.messageId !== 'bbb219d3-135d-4fe5-907a-4e5809749dfb') throw new Error('Bond 2 key approval message ID mismatch');
  if (decision.approval.scope !== 'Hero 15, Bond 2 (FETTER 67): publish “순박한 마음의 열쇠 ×26 · 순수한 마음의 열쇠 ×69 · 빛나는 마음의 열쇠 ×16” as plain text below the Lv.2–10 gold total. Merge in this Work after source comparison and all required checks pass.') throw new Error('Bond 2 key approval scope mismatch');
  validateKeyNameSources(decision.source, bond2KeySources, 2);

  // Fetter 67, LevelUpMaterials[0..17], in source order.
  const sourceRows = [
    [2, 3200, 5], [2, 3201, 2], [3, 3200, 6], [3, 3201, 3],
    [4, 3200, 7], [4, 3201, 4], [5, 3200, 8], [5, 3201, 5],
    [6, 3201, 7], [6, 3202, 1], [7, 3201, 9], [7, 3202, 2],
    [8, 3201, 11], [8, 3202, 3], [9, 3201, 13], [9, 3202, 4],
    [10, 3201, 15], [10, 3202, 6],
  ].map(([level, itemId, count]) => ({ level, itemType: 6, itemId, count }));
  if (decision.source.selection !== 'ConfigDataHeroInformationInfo.json#/14/HeroFetters_ID/1'
    || decision.source.rows !== 'ConfigDataHeroFetterInfo.json#/66/LevelUpMaterials'
    || decision.source.rawDetailEvidence !== 'evidence/source/bonds/hero15-fetter-raw-details.v1.json#selection/records/1') {
    throw new Error('Bond 2 key source locator mismatch');
  }
  const raw = readKeyMaterialRows(inputs, 67, sourceRows.length, levels, 2);
  const rows = raw.map(({ Level, ItemType, ItemId, Count }) => ({ level: Level, itemType: ItemType, itemId: ItemId, count: Count }));
  if (!isDeepStrictEqual(decision.sourceRows, sourceRows) || !isDeepStrictEqual(rows, sourceRows)) {
    throw new Error('Bond 2 key source rows or quantities mismatch');
  }
  const line = materials.map(({ itemId, itemType, nameKo, count }) => {
    validateKeyItemEndpoint(goldOwner, itemId, itemType, 2);
    const total = rows.filter(row => row.itemId === itemId && row.itemType === itemType).reduce((sum, row) => sum + row.count, 0);
    if (total !== count) throw new Error('Bond 2 key total mismatch');
    return `${nameKo} ×${total}`;
  }).join(' · ');
  if (decision.lineKo !== line) throw new Error('Bond 2 key display text mismatch');
  return line;
}

function validateHeartFetterGoldTotal(decision, references, details, locators, levels) {
  const indices = levels.map(level => level - 2);
  if (!isDeepStrictEqual(decision, {
    schemaVersion: 1, status: 'APPROVED', approvalMessageId: '7720da79-b0f8-4c0d-9a31-09e27a9f6ffa',
    surface: HERO_15_MINIMAL_DETAIL_FRAGMENT, heroId: 15, labelKo: '마음의 유대',
    endpointKind: 'HEART_FETTER', heartFetterId: 15, sourceField: 'LevelUpGold', sourceRecordLocator: '/13',
    sourceArrayIndices: indices, targetLevels: levels, gold: heartFetterGoldValues, totalGold: 650000,
  })) throw new Error('Heart Fetter Gold total approval scope mismatch');

  const namespace = 'ConfigDataHeroHeartFetterInfo.ID';
  const sourceRecord = 'ConfigDataHeroHeartFetterInfo#ID=15';
  const refs = references.records.filter(row => row.heroId === 15 && row.referenceKind === 'HERO_HEART_FETTER_ID_REFERENCE');
  if (refs.length !== 1 || refs[0].heartFetterId !== 15 || refs[0].heroInformationId !== 15
    || refs[0].sourceField !== 'ConfigDataHeroInformationInfo.HeroHeartFetterId' || refs[0].endpointNamespace !== namespace) {
    throw new Error('Heart Fetter Gold total selection relation mismatch');
  }
  const matches = details.records.filter(row => row.heroId === 15 && row.endpointId === refs[0].heartFetterId);
  const [detail] = matches;
  if (matches.length !== 1 || detail.detailKind !== 'HEART_FETTER_RAW_DETAIL'
    || detail.endpointNamespace !== namespace || detail.sourceRecordLocator !== sourceRecord || detail.fields.MaxLevel !== 10) {
    throw new Error('Heart Fetter Gold total detail mismatch');
  }
  const selected = locators.filter(row => row.heroId === 15 && row.endpointKind === 'HEART_FETTER' && row.endpointId === detail.endpointId);
  if (selected.length !== levels.length || selected.some((row, i) =>
    row.endpointNamespace !== namespace || row.sourceRecordLocator !== sourceRecord || row.sourceField !== 'LevelUpGold'
    || row.locatorRule !== 'LevelUpGold[targetLevel-2]' || row.sourceArrayIndex !== indices[i] || row.targetLevel !== levels[i])) {
    throw new Error('Heart Fetter Gold total level locator mismatch');
  }
  if (!isDeepStrictEqual(detail.fields.LevelUpGold, heartFetterGoldValues)
    || detail.fields.LevelUpGold.reduce((total, gold) => total + gold, 0) !== decision.totalGold) {
    throw new Error('Heart Fetter Gold total source vector or total mismatch');
  }
}

function renderHero15FetterGold({ bond1GoldDecision, bond2GoldDecision, bond3GoldDecision, bond4GoldDecision, bond5GoldDecision, heartGoldDecision, fetterReferences, goldDecision, goldOwner, fetterDetails, heartFetterDetails }) {
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
  validateHeartFetterGoldTotal(heartGoldDecision, fetterReferences, heartFetterDetails, goldOwner.goldLocators, levels);
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
    if (endpointId === 66) validateBondGoldTotal(bond1TotalScope, bond1GoldDecision, fetterReferences, detail, goldOwner.goldLocators, rows);
    if (endpointId === 67) validateBondGoldTotal(bond2TotalScope, bond2GoldDecision, fetterReferences, detail, goldOwner.goldLocators, rows);
    if (endpointId === 68) validateBondGoldTotal(bond3TotalScope, bond3GoldDecision, fetterReferences, detail, goldOwner.goldLocators, rows);
    if (endpointId === 69) validateBondGoldTotal(bond4TotalScope, bond4GoldDecision, fetterReferences, detail, goldOwner.goldLocators, rows);
    if (endpointId === 70) validateBondGoldTotal(bond5TotalScope, bond5GoldDecision, fetterReferences, detail, goldOwner.goldLocators, rows);
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
