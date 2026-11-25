import { loadAwakeningInputs, renderAwakeningInternal } from './hero-15-awakening-internal-consumer.mjs';
import { createHash } from 'node:crypto';
import { CANONICAL as HERO_CV_CANONICAL, renderHero15ProfileCvInternal } from './hero-15-profile-cv-internal.mjs';
import { loadInputs as loadJobTree, render as renderJobTree } from './hero-15-job-tree-internal.mjs';
import { renderHero15SoldierInternal } from './hero-15-soldier-internal-consumer.mjs';

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

export async function readHero15ProfileInputs(readJson) {
  const [approval, rarities, relations, names, sourceNamesApproval, nameMaster, englishNameEvidence, cvDecision, cvCanonical, skillDecision, skillReferences, skillIdentities, centralDisciplineDecision, awakeningDecision, awakeningInputs, bond3Decision, fetterReferences, fetterDetails] = await Promise.all([
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
  ]);
  return { approval, rarities, relations, names, sourceNamesApproval, nameMaster, englishNameEvidence, cvDecision, cvCanonical, skillDecision, skillReferences, skillIdentities, centralDisciplineDecision, awakeningDecision, awakeningInputs, bond3Decision, fetterReferences, fetterDetails };
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
  const [approval, relations, soldiers, normalNames, spNames] = await Promise.all([
    readJson('docs/decisions/hero-15-minimal-soldier-publication.v1.json'),
    readJson('canonical/hero-soldier-relations.v1.json'),
    readJson('canonical/soldiers.v1.json'),
    readJson('canonical/normal-soldier-localizations-ko.v1.json'),
    readJson('canonical/sp-soldier-localizations-ko.v1.json'),
  ]);
  return { approval, relations, soldiers, normalNames, spNames };
}

function renderHero15SoldierNames({ approval, relations, soldiers, normalNames, spNames }) {
  if (approval.heroId !== 15 || approval.surface !== HERO_15_MINIMAL_DETAIL_FRAGMENT
    || approval.status !== 'APPROVED') throw new Error('Hero 15 Soldier publication scope mismatch');
  const { records } = JSON.parse(renderHero15SoldierInternal({ relations, soldiers }));
  const namesByVariant = { NORMAL: normalNames.records, SP: spNames.records };
  const rows = records.map(({ soldierId, soldierIdentity: { variant } }) => {
    const names = namesByVariant[variant]?.filter((row) => row.soldierId === soldierId);
    if (names?.length !== 1 || !names[0].nameKo?.trim()) {
      throw new Error(`Hero 15 Soldier name is unresolved for ${variant} ${soldierId}`);
    }
    return { soldierId, namespace: variant, nameKo: names[0].nameKo };
  });
  if (JSON.stringify(rows) !== JSON.stringify(approval.soldiers)) {
    throw new Error('Hero 15 Soldier rows differ from the approved subset');
  }
  return rows.map(({ namespace, nameKo }) => ({ namespace, nameKo }));
}

export async function readHero15JobPublicationInputs(readJson) {
  const [approval, tree] = await Promise.all([
    readJson('docs/decisions/hero-15-minimal-job-publication.v1.json'),
    loadJobTree(),
  ]);
  return { approval, tree };
}

function renderHero15JobPaths({ approval, tree }) {
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
  return paths.map(([, , fromNameKo, toNameKo]) => ({ fromNameKo, toNameKo }));
}

function renderHero15OrdinarySkills({ skillDecision, skillReferences, skillIdentities }) {
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
  return skillDecision.skills.map(({ skillId, sourceNameCn, sourceDescSha256, nameKo, descriptionKo }) => {
    const identities = skillIdentities.records.filter((row) => row.skillId === skillId);
    const identity = identities[0];
    if (identities.length !== 1 || identity.nameCn !== sourceNameCn
      || createHash('sha256').update(identity.descriptionCn).digest('hex') !== sourceDescSha256
      || typeof nameKo !== 'string' || !nameKo.trim()
      || (namesOnly.has(skillId) ? descriptionKo !== undefined : typeof descriptionKo !== 'string' || !descriptionKo.trim())) {
      throw new Error(`Hero 15 ordinary Skill source or Korean display fields mismatch: ${skillId}`);
    }
    return descriptionKo === undefined ? { skillId, nameKo } : { skillId, nameKo, descriptionKo };
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

function renderHero15Bond3Description({ bond3Decision: decision, fetterReferences, fetterDetails }) {
  const references = fetterReferences.records.filter(({ fetterId }) => fetterId === 68);
  const details = fetterDetails.records.filter(({ detailKind, endpointId }) =>
    detailKind === 'FETTER_RAW_DETAIL' && endpointId === 68);
  const conditions = details[0]?.fields?.CompletionConditions;
  const missionReferences = conditions?.filter(({ ConditionType }) => ConditionType === 2);
  if (decision?.status !== 'APPROVED' || decision.heroId !== 15 || decision.fetterId !== 68 || decision.missionId !== 5050
    || decision.surface !== HERO_15_MINIMAL_DETAIL_FRAGMENT || decision.scope !== 'PROJECT_TRANSLATED_SOURCE_DESCRIPTION_ONLY'
    || decision.source?.desc !== '莉亚娜转职成为先知' || decision.descriptionKo !== '프로핏으로 전직'
    || references.length !== 1 || references[0].heroId !== 15 || references[0].referenceKind !== 'HERO_FETTER_ID_REFERENCE'
    || details.length !== 1 || details[0].heroId !== 15 || missionReferences?.length !== 1
    || missionReferences[0].Parm1 !== 5050) {
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
  const consumer = {
    schemaVersion: 1,
    heroes: [{
      heroId: 15,
      nameKo: heroName[0].nameKo,
      profile: renderHero15Profile(profileInputs),
      soldiers: renderHero15SoldierNames(soldierInputs),
      jobPaths: renderHero15JobPaths(jobInputs),
      centralDisciplineEffectKo: renderHero15CentralDiscipline(profileInputs),
      awakeningMaterials: renderHero15AwakeningMaterials(profileInputs),
      bond3DescriptionKo: renderHero15Bond3Description(profileInputs),
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

export function validateHero15MinimalDetail({ generatedText, inputs }) {
  const expected = renderHero15MinimalDetail(inputs);
  if (generatedText !== expected) throw new Error('Generated Hero 15 minimal detail is stale or non-deterministic');
  const data = JSON.parse(generatedText);
  exactKeys(data, ['schemaVersion', 'heroes'], 'Generated Hero 15 minimal detail');
  if (data.schemaVersion !== 1 || data.heroes.length !== 1) throw new Error('Hero 15 minimal detail population or schema mismatch');
  exactKeys(data.heroes[0], ['heroId', 'nameKo', 'exclusiveEquipment', 'profile', 'soldiers', 'jobPaths', 'ordinarySkills', 'centralDisciplineEffectKo', 'awakeningMaterials', 'bond3DescriptionKo'], 'Hero 15 minimal detail row');
  exactKeys(data.heroes[0].exclusiveEquipment, ['equipmentId', 'nameKo', 'effectDescriptionKo'], 'Hero 15 minimal equipment');
  if (data.heroes[0].heroId !== 15 || data.heroes[0].exclusiveEquipment.equipmentId !== 535) throw new Error('Hero 15 minimal detail endpoint is out of approved scope');
  return data;
}
