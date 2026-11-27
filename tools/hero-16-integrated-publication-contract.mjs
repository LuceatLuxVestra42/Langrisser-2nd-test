import { lianaCastingInput } from './liana-casting-input.mjs';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';

export const HERO_16_INTEGRATED_PUBLICATION_PATH = 'docs/decisions/hero-16-integrated-publication.v1.json';
export const HERO_16_MINIMAL_DETAIL_PATH = 'generated/hero-minimal-detail-16.v1.json';
export const HERO_16_MINIMAL_DETAIL_FRAGMENT = 'hero-minimal-detail-16';

export const HERO_16_PROFILE_DECISION = 'docs/decisions/hero-16-minimal-profile-publication.v1.json';

const heroInfoPath = 'evidence/source/configdata/ConfigDataHeroInfo.record-hero-16-name-eng.v1.json';
const charImagePath = 'evidence/source/configdata/ConfigDataCharImageInfo.record-hero-16-cv-name.v1.json';
const chineseNamePath = 'evidence/source/configdata/hero-name-master.records-hero-ko-localization-expansion.v1.json';
const cvCanonicalPath = 'canonical/hero-profile-cv-names.v1.json';
const presencePath = 'evidence/source/hero-16-cv-presence.v1.json';
const freezePath = 'evidence/localization/hero-16-cv-ko-freeze.v1.json';

async function hero16NameAndVoiceLines(decision, identities, readJson) {
  const config = '6475e63ee23d18adf733756c26a14fa9e3ed662c';
  const legacy = '57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff';
  async function readEvidence(input, commit, path, blob, locator) {
    const evidence = await readJson(input);
    const source = { repository:'LuceatLuxVestra42/langrisser-future-guide', commit, path, blob, locator };
    if (evidence.schemaVersion !== 1 || !isDeepStrictEqual(evidence.source,source) || !Array.isArray(evidence.records)) {
      throw new Error('Hero 16 profile evidence source mismatch: ' + input);
    }
    return evidence.records;
  }
  const [heroes, images, presence, mapping, master, canonical] = await Promise.all([
    readEvidence(heroInfoPath, config, 'data/configdata/ConfigDataHeroInfo.json', '728daab3370f0c7779449663ea02e638677944d4', '#/15'),
    readEvidence(charImagePath, config, 'data/configdata/ConfigDataCharImageInfo.json', '397afb3e76c0fe4f3e424c04ba68459ff48d74c5', '#/14'),
    readEvidence(presencePath, legacy, 'data/validation/hero-page-stage5-5-2-cv.v1.json', '67c21e9097ac95110a5ff53b8889f677e4f34d17', '#/heroes/14'),
    readEvidence(freezePath, legacy, 'data/presentation/hero-cv-localization-stage4-freeze.v1.json', '1b599f4aa49268ea5723bbc59c1a72d7fb1257ba', '#/records/2'),
    readJson(chineseNamePath), readJson(cvCanonicalPath),
  ]);
  if (identities.records.filter(r=>r.heroId===16).length !== 1 || heroes.length !== 1 || heroes[0].ID !== 16
    || heroes[0].Name !== '兰斯' || heroes[0].Name_Eng !== 'Lance') throw new Error('Hero 16 original name attribution mismatch');
  const hero = heroes[0];
  const names = master.records.filter(r=>r.heroId===hero.ID);
  if (names.length !== 1 || names[0] !== master.records[23] || names[0].status !== 'verified' || names[0].nameCn !== hero.Name) {
    throw new Error('Hero 16 verified Chinese name mismatch');
  }
  if (images.length !== 1 || images[0].ID !== 16 || hero.CharImage_ID !== images[0].ID || images[0].CVName !== '最上嗣生') {
    throw new Error('Hero 16 CharImage foreign key or CV endpoint mismatch');
  }
  const image = images[0];
  const cv = canonical.records.filter(r=>r.heroId===hero.ID);
  if (canonical.schemaVersion !== 1 || canonical.responsibility !== 'hero-profile-source-cv-name'
    || !isDeepStrictEqual(cv,[{heroId:hero.ID, charImageId:image.ID, cvNameRaw:image.CVName,
      provenance:{cvNameRaw:charImagePath+'#/records/0/CVName', heroToCharImageRelation:heroInfoPath+'#/records/0/CharImage_ID'}}])) {
    throw new Error('Hero 16 CV Canonical claim or provenance mismatch');
  }
  if (!isDeepStrictEqual(presence,[{heroId:hero.ID,charImageId:image.ID,cvNameRaw:cv[0].cvNameRaw,voiceActorStatus:'PRESENT'}])) {
    throw new Error('Hero 16 CharImage 16 PRESENT evidence missing or mismatched');
  }
  const matches = mapping.filter(r=>r.sourceValue===presence[0].cvNameRaw);
  if (mapping.length !== 1 || matches.length !== 1) throw new Error('Hero 16 frozen CV source value mismatch');
  if (matches[0].nameKr !== '모가미 츠구오') throw new Error('Hero 16 frozen CV Korean name mismatch');
  if (matches[0].status !== 'CONFIRMED') throw new Error('Hero 16 frozen CV confirmation status mismatch');
  const sourceNames = `중국어명 · ${hero.Name} / 영문명 · ${hero.Name_Eng}`;
  const voiceActor = `성우 · ${matches[0].nameKr}`;
  const expected = {
    displayStatus:'PROJECT_DISPLAY_ONLY', officialKrProvenanceStatus:'unverified', placement:'two-paragraphs-after-factions-before-equipment-418',
    sourceNames:{heroInfo:heroInfoPath,chineseNameMaster:chineseNamePath+'#/records/23',lineKo:sourceNames},
    voiceActor:{charImageInfo:charImagePath,canonical:cvCanonicalPath,presence:presencePath,koreanMapping:freezePath,lineKo:voiceActor},
  };
  if (!decision.approval?.source || !decision.approval?.basis || !isDeepStrictEqual(decision.nameAndVoice,expected)) {
    throw new Error('Hero 16 original names and voice publication scope mismatch');
  }
  return [sourceNames, voiceActor];
}

export async function hero16ProfileLines(decision, rarities, relations, localizations, identities, readJson) {
  const ids = [2, 4, 7];
  if (decision?.schemaVersion !== 1 || decision.status !== 'APPROVED' || decision.heroId !== 16
    || decision.surface !== HERO_16_MINIMAL_DETAIL_FRAGMENT || decision.placement !== 'after-name-provenance-before-equipment'
    || decision.rankId !== 3 || !isDeepStrictEqual(decision.factionIds, ids)) {
    throw new Error('Hero 16 profile publication scope mismatch');
  }
  const ranks = rarities.records.filter(row => row.heroId === 16);
  if (ranks.length !== 1 || ranks[0].rankId !== 3 || ranks[0].label !== 'SR') {
    throw new Error('Hero 16 profile Canonical rarity mismatch');
  }
  const factions = relations.records.filter(row => row.heroId === 16).map(row => row.factionId);
  if (!isDeepStrictEqual(factions, ids)) throw new Error('Hero 16 profile Canonical faction relations mismatch');
  const names = factions.map(id => {
    const rows = localizations.records.filter(row => row.factionId === id);
    if (rows.length !== 1) throw new Error(`Hero 16 Faction ${id} localization mismatch`);
    return rows[0].nameKo;
  });
  const lines = [`등급 · ${ranks[0].label}`, `진영 · ${names.join(' · ')}`];
  if (!isDeepStrictEqual(names, ['빛의 군단', '제국의 빛', '전략의 대가']) || !isDeepStrictEqual(decision.linesKo, lines)) {
    throw new Error('Hero 16 profile approved text mismatch');
  }
  return [...lines,...await hero16NameAndVoiceLines(decision, identities, readJson)];
}

export const HERO_16_JOB_PATH_DECISION = 'docs/decisions/hero-16-minimal-job-path-publication.v1.json';

export function hero16JobPathLine(decision, memberships, advancements, localizations) {
  const from = { connectionId: 160, jobId: 401 };
  const to = { connectionId: 162, jobId: 302 };
  if (decision?.schemaVersion !== 1 || decision.status !== 'APPROVED' || decision.surface !== HERO_16_MINIMAL_DETAIL_FRAGMENT
    || decision.heroId !== 16 || decision.placement !== 'paragraph-immediately-after-equipment-effect'
    || !isDeepStrictEqual(decision.predecessor, from) || !isDeepStrictEqual(decision.successor, to)) {
    throw new Error('Hero 16 job path publication scope mismatch');
  }
  for (const { jobId } of [from, to]) {
    if (memberships.records.filter(row => row.heroId === 16 && row.jobId === jobId).length !== 1) {
      throw new Error(`Hero 16 job path membership mismatch for Job ${jobId}`);
    }
  }
  const edges = advancements.records.filter(row => row.heroId === 16);
  if (edges.length !== 1) throw new Error('Hero 16 job path edge count mismatch');
  const [edge] = edges;
  if (edge.predecessorConnectionId !== from.connectionId || edge.predecessorJobId !== from.jobId
    || edge.successorConnectionId !== to.connectionId || edge.successorJobId !== to.jobId) {
    throw new Error('Hero 16 job path edge direction mismatch');
  }
  const names = [edge.predecessorJobId, edge.successorJobId].map(jobId => {
    const rows = localizations.records.filter(row => row.jobId === jobId);
    if (rows.length !== 1) throw new Error(`Hero 16 job path localization count mismatch for Job ${jobId}`);
    return rows[0].nameKo;
  });
  if (!isDeepStrictEqual(names, ['호크 나이트', '하이랜더'])) throw new Error('Hero 16 job path localization mismatch');
  const text = `전직 · ${names.join(' → ')}`;
  if (decision.textKo !== text) throw new Error('Hero 16 job path approved text mismatch');
  return text;
}

const sourceSpecs = {
  heroIdentity: { path: 'canonical/hero-identities.v1.json', sha256: '6cb710d09df61cbc31d2021fd41b9e1e1b5899377991d14af7a4a5d89e7fe11c', locator: 'evidence/source/configdata/ConfigDataHeroInfo.records-playable-identity.v1.json#ID=16' },
  heroLocalization: { path: 'canonical/hero-localizations-ko.v1.json', sha256: '7f0ca08eb578dd2d1fcf9aa44eb825c49f7e415faeedd2fffa4b604d2c4ab299', locator: 'evidence/localization/hero-names-ko.v1.json#heroId=16' },
  equipmentRelation: { path: 'canonical/hero-exclusive-equipment-relations.v1.json', sha256: 'a0aa17178c04456482018d3b166baa176224a8562b713fb5f583f2b5a113ba01', locator: 'ConfigDataEquipmentInfo#recordId=418&field=SkillHero&value=16' },
  equipmentIdentity: { path: 'canonical/exclusive-equipment.v1.json', sha256: 'bd59b9cce913ffd3f310d9f96b1295e939959b2e207e55324dc60b2a50f38b9f', locator: 'canonical/exclusive-equipment.v1.json#equipmentId=418' },
  equipmentLocalization: { path: 'canonical/exclusive-equipment-localizations-ko.v1.json', sha256: 'edd54afd11a4701dc039710670dcd321b7f459648887f55d48423ff26f1a125c', locator: 'evidence/localization/exclusive-equipment-ko.v1.json#EquipmentID=418' },
};

const exactKeys = (value, keys, label) => {
  if (!value || JSON.stringify(Object.keys(value).sort()) !== JSON.stringify([...keys].sort())) throw new Error(`${label} has unexpected or missing fields`);
};
const hash = (value) => createHash('sha256').update(value).digest('hex');

export function validateHero16IntegratedPublication(decision) {
  exactKeys(decision, ['schemaVersion', 'decisionType', 'status', 'approval', 'approvedScope', 'effect'], 'Hero 16 Publication decision');
  exactKeys(decision.approval, ['approverRole', 'source', 'recordedAtDate'], 'Hero 16 approval');
  exactKeys(decision.approval.source, ['kind', 'quote', 'originalMessageIdOrUrl', 'contextVerified'], 'Hero 16 approval source');
  const scope = decision.approvedScope;
  exactKeys(scope, ['repository', 'baselineRef', 'baselineHead', 'heroId', 'nameKo', 'nameLabelStatus', 'officialKrProvenanceStatus', 'canonicalSources', 'surfaces', 'minimalDetail', 'heroIndexNavigation', 'exclusiveEquipmentNavigation', 'preservedPopulations', 'excluded'], 'Hero 16 Publication scope');
  exactKeys(scope.canonicalSources, Object.keys(sourceSpecs), 'Hero 16 Canonical sources');
  for (const [key, spec] of Object.entries(sourceSpecs)) {
    exactKeys(scope.canonicalSources[key], ['path', 'sha256', 'locator'], `${key} source`);
    if (JSON.stringify(scope.canonicalSources[key]) !== JSON.stringify(spec)) throw new Error(`Hero 16 ${key} source scope changed`);
  }
  exactKeys(scope.minimalDetail, ['surface', 'heroId', 'fragment', 'fields'], 'P-A scope');
  exactKeys(scope.heroIndexNavigation, ['surface', 'heroId', 'targetSurface', 'fragment', 'fullDetailHeroIdsPreserved', 'minimalDetailHeroIdsAfter', 'heroIndexPopulation'], 'P-B scope');
  exactKeys(scope.exclusiveEquipmentNavigation, ['surface', 'equipmentId', 'heroId', 'previousTarget', 'target', 'otherEquipmentTargetsPreserved'], 'P-C scope');
  exactKeys(scope.exclusiveEquipmentNavigation.previousTarget, ['surface', 'fragment'], 'P-C previous target');
  exactKeys(scope.exclusiveEquipmentNavigation.target, ['surface', 'fragment'], 'P-C target');
  exactKeys(scope.preservedPopulations, ['heroIndex', 'fullHeroDetail', 'exclusiveEquipmentNavigation', 'hero15MinimalDetail', 'minimalDetailAfter'], 'preserved populations');
  exactKeys(decision.effect, ['effective', 'condition', 'reviewWhen'], 'Hero 16 decision effect');
  if (decision.schemaVersion !== 1 || decision.decisionType !== 'HERO_16_INTEGRATED_PUBLICATION' || decision.status !== 'APPROVED'
    || decision.approval.approverRole !== 'USER'
    || decision.approval.source.kind !== 'CURRENT_USER_MESSAGE'
    || decision.approval.source.quote !== '나는 `LuceatLuxVestra42/Langrisser-2nd-test`의 Hero 16(란스) 통합 Publication 변경 P-A·P-B·P-C 전체를 직접 승인한다.'
    || decision.approval.source.originalMessageIdOrUrl !== 'NOT_AVAILABLE' || decision.approval.source.contextVerified !== true
    || decision.approval.recordedAtDate !== '2026-11-04'
    || scope.repository !== 'LuceatLuxVestra42/Langrisser-2nd-test' || scope.baselineRef !== 'main'
    || scope.baselineHead !== '2ff8166e44f7688e1d230e727629aaa0abab9e75'
    || scope.heroId !== 16 || scope.nameKo !== '란스' || scope.nameLabelStatus !== 'PROJECT_REVIEWED'
    || scope.officialKrProvenanceStatus !== 'unverified'
    || JSON.stringify(scope.surfaces) !== JSON.stringify(['HERO_MINIMAL_DETAIL', 'HERO_INDEX_LIST', 'EXCLUSIVE_EQUIPMENT_LIST'])
    || scope.minimalDetail.surface !== 'HERO_MINIMAL_DETAIL' || scope.minimalDetail.heroId !== 16 || scope.minimalDetail.fragment !== HERO_16_MINIMAL_DETAIL_FRAGMENT
    || JSON.stringify(scope.minimalDetail.fields) !== JSON.stringify(['heroId', 'nameKo', 'exclusiveEquipment.equipmentId', 'exclusiveEquipment.nameKo', 'exclusiveEquipment.effectDescriptionKo'])
    || scope.heroIndexNavigation.surface !== 'HERO_INDEX_LIST' || scope.heroIndexNavigation.heroId !== 16
    || scope.heroIndexNavigation.targetSurface !== 'HERO_MINIMAL_DETAIL' || scope.heroIndexNavigation.fragment !== HERO_16_MINIMAL_DETAIL_FRAGMENT
    || scope.heroIndexNavigation.fullDetailHeroIdsPreserved !== 29 || scope.heroIndexNavigation.minimalDetailHeroIdsAfter !== 2 || scope.heroIndexNavigation.heroIndexPopulation !== 267
    || scope.exclusiveEquipmentNavigation.surface !== 'EXCLUSIVE_EQUIPMENT_LIST' || scope.exclusiveEquipmentNavigation.equipmentId !== 418 || scope.exclusiveEquipmentNavigation.heroId !== 16
    || JSON.stringify(scope.exclusiveEquipmentNavigation.previousTarget) !== JSON.stringify({ surface: 'HERO_INDEX', fragment: 'hero-index-entry-16' })
    || JSON.stringify(scope.exclusiveEquipmentNavigation.target) !== JSON.stringify({ surface: 'HERO_MINIMAL_DETAIL', fragment: HERO_16_MINIMAL_DETAIL_FRAGMENT })
    || scope.exclusiveEquipmentNavigation.otherEquipmentTargetsPreserved !== 166
    || JSON.stringify(scope.preservedPopulations) !== JSON.stringify({ heroIndex: 267, fullHeroDetail: 29, exclusiveEquipmentNavigation: 167, hero15MinimalDetail: 1, minimalDetailAfter: 2 })
    || JSON.stringify(scope.excluded) !== JSON.stringify(['New Semantic Admission', 'Canonical or Evidence mutation', 'Legacy Repository mutation', 'Hero IDs other than 16', 'Equipment IDs other than 418', 'Changes to Hero 15 publication', 'Changes to other 166 Equipment targets', 'Rarity', 'Faction', 'Production', 'Job', 'Soldier', 'Talent', 'Skill', 'Portrait or Asset', 'Release status', 'New game statistics'])
    || decision.effect.effective !== true
    || decision.effect.condition !== 'Only Hero 16 with the exact approved fields, Hero Index link, and Equipment 418 target may be published; Hero 15 and all other existing populations and targets remain unchanged.'
    || decision.effect.reviewWhen !== 'Re-review if the approved IDs, fields, source claims, surfaces, navigation targets, or preserved populations change.') throw new Error('Hero 16 integrated Publication approval or scope is invalid');
  return decision;
}

export function renderHero16MinimalDetail({ decision, heroIdentities, heroLocalizations, relations, equipmentIdentities, equipmentLocalizations, sourceHashes }) {
  validateHero16IntegratedPublication(decision);
  exactKeys(sourceHashes, Object.keys(sourceSpecs), 'Hero 16 source hashes');
  for (const [key, spec] of Object.entries(sourceSpecs)) {
    if (sourceHashes[key] !== spec.sha256 || decision.approvedScope.canonicalSources[key].sha256 !== spec.sha256) throw new Error(`Hero 16 Canonical source hash changed: ${key}`);
  }
  for (const [value, label] of [[heroIdentities, 'Hero Identity'], [heroLocalizations, 'Hero Localization'], [relations, 'Hero-Equipment relation'], [equipmentIdentities, 'Equipment Identity'], [equipmentLocalizations, 'Equipment Localization']]) {
    if (value?.schemaVersion !== 1 || !Array.isArray(value.records)) throw new Error(`Unsupported ${label} input`);
  }
  const one = (rows, predicate, label) => {
    const matches = rows.filter(predicate);
    if (matches.length !== 1) throw new Error(`Hero 16 ${label} must resolve exactly once`);
    return matches[0];
  };
  one(heroIdentities.records, ({ heroId }) => heroId === 16, 'Identity');
  const hero = one(heroLocalizations.records, ({ heroId }) => heroId === 16, 'Localization');
  if (hero.nameKo !== '란스') throw new Error('Hero 16 Korean name differs from the approved localization');
  one(relations.records, ({ heroId, equipmentId }) => heroId === 16 && equipmentId === 418, 'approved relation');
  if (relations.records.filter(({ heroId }) => heroId === 16).length !== 1 || relations.records.filter(({ equipmentId }) => equipmentId === 418).length !== 1) throw new Error('Hero 16 relation endpoints are not unique');
  one(equipmentIdentities.records, ({ equipmentId }) => equipmentId === 418, 'Equipment Identity');
  const equipment = one(equipmentLocalizations.records, ({ equipmentId }) => equipmentId === 418, 'Equipment Localization');
  if (equipment.nameKo !== '칼자스의 왕관' || !equipment.effectDescriptionKo?.trim()) throw new Error('Equipment 418 localization differs from the approved display claim');
  return `${JSON.stringify({ schemaVersion: 1, heroes: [{ heroId: 16, nameKo: hero.nameKo, exclusiveEquipment: { equipmentId: 418, nameKo: equipment.nameKo, effectDescriptionKo: equipment.effectDescriptionKo } }] }, null, 2)}\n`;
}

export function validateHero16MinimalDetail({ generatedText, inputs }) {
  const expected = renderHero16MinimalDetail(inputs);
  if (generatedText !== expected) throw new Error('Generated Hero 16 minimal detail is stale or non-deterministic');
  const data = JSON.parse(generatedText);
  exactKeys(data, ['schemaVersion', 'heroes'], 'Generated Hero 16 minimal detail');
  if (data.schemaVersion !== 1 || data.heroes.length !== 1) throw new Error('Hero 16 minimal detail population or schema mismatch');
  exactKeys(data.heroes[0], ['heroId', 'nameKo', 'exclusiveEquipment'], 'Hero 16 minimal detail row');
  exactKeys(data.heroes[0].exclusiveEquipment, ['equipmentId', 'nameKo', 'effectDescriptionKo'], 'Hero 16 minimal equipment');
  if (data.heroes[0].heroId !== 16 || data.heroes[0].nameKo !== '란스' || data.heroes[0].exclusiveEquipment.equipmentId !== 418 || data.heroes[0].exclusiveEquipment.nameKo !== '칼자스의 왕관') throw new Error('Hero 16 minimal detail endpoint is out of approved scope');
  return data;
}

export const lanceGoldDecision = 'docs/decisions/hero-16-minimal-central-discipline-gold-publication.v1.json';
const goldEvidence = 'evidence/source/jobs/hero16-casting-law-gold.v1.json';
const goldInputs = [
  'canonical/hero-casting-law-template-references.v1.json',
  'canonical/casting-law-template-raw-details.v1.json',
  'canonical/casting-law-template-level-references.v1.json',
  'canonical/casting-law-levelup-raw-details.v1.json',
];

// Independently reviewed ConfigData indexes and IDs, in the Hero FK and level order.
const goldSlots = [
  ['WEAPON_1','무기 1',1,0,null,[1,2,3,4,5,10001,10002,10003,10004,10005],[0,1,2,3,4,250,251,252,253,254]],
  ['WEAPON_2','무기 2',2,1,null,[6,7,8,9,10,10006,10007,10008,10009,10010],[5,6,7,8,9,255,256,257,258,259]],
  ['ARMOR','갑옷',30,29,1,[146,147,148,149,150,10146,10147,10148,10149,10150],[145,146,147,148,149,395,396,397,398,399]],
  ['HEAD','투구',33,32,2,[161,162,163,164,165,10161,10162,10163,10164,10165],[160,161,162,163,164,410,411,412,413,414]],
  ['ACCESSORY','장신구',41,40,3,[201,202,203,204,205,10201,10202,10203,10204,10205],[200,201,202,203,204,450,451,452,453,454]],
];
const goldVector = [25000,35000,60000,100000,150000,190000,230000,280000,330000,400000];
const armorVector = [50000,70000,120000,200000,300000,380000,460000,560000,660000,800000];
function requireGold(actual, expected, claim) {
  if (!isDeepStrictEqual(actual, expected)) throw new Error('Lance gold ' + claim + ' mismatch');
}

export async function readLanceGoldSource(readJson) {
  const [hero, templates, references, costs, evidence] = await Promise.all([...goldInputs, goldEvidence].map(path => readJson(path)));
  requireGold(evidence.sourceBlobs, {
    ConfigDataHeroInfo:'728daab3370f0c7779449663ea02e638677944d4',
    ConfigDataCastingLawTemplateInfo:'3d3f403120324a258cc1e1d03dd4af3cf56ad10e',
    ConfigDataCastingLawLevelUpInfo:'83b99ebff9c54523d7f9476b92e8b3d59229179f',
  }, 'ConfigData blobs');
  requireGold([evidence.schemaVersion,evidence.repository,evidence.commit,evidence.sourceDirectory],
    [1,'LuceatLuxVestra42/langrisser-future-guide','6475e63ee23d18adf733756c26a14fa9e3ed662c','data/configdata/'], 'ConfigData source');
  const ids = [1,2,30,33,41];
  requireGold(evidence.hero, { sourceArrayIndex:15, ID:16, CastingLawTemplates_ID:ids }, 'Hero source');
  const assignments = hero.records.filter(row => row.heroId === 16);
  requireGold(assignments.map(row => row.templateId), ids, 'Hero FK');
  requireGold([hero.records.length,templates.records.length,references.records.length,costs.records.length,
    evidence.templates.length,evidence.levels.length], [10,9,90,90,4,40], 'shared population');
  const expectedSlots = [];
  for (const [i,[slot,labelKo,templateId,sourceArrayIndex,equipmentType,levelIds,positions]] of goldSlots.entries()) {
    requireGold(assignments[i], {
      heroId:16, sourceField:'ConfigDataHeroInfo.CastingLawTemplates_ID', sourceArrayIndex:i, templateId,
      templateNamespace:'ConfigDataCastingLawTemplateInfo.ID', evidenceProvenance:goldEvidence+'#/hero/CastingLawTemplates_ID/'+i,
      endpointProvenance:templateId === 41 ? 'evidence/source/jobs/hero15-casting-law-template-references.v1.json#templateRecords/4' : goldEvidence+'#/templates/'+i,
    }, 'Hero FK');
    const matches = templates.records.filter(row => row.templateId === templateId);
    requireGold(matches.length,1,'Template identity');
    const [template] = matches;
    requireGold(template.rawRecord.CastingLawLevelUpInfoList, levelIds, 'CastingLawLevelUpInfoList attribution');
    requireGold([template.rawRecord.EquipmentType,template.fieldStates.EquipmentType],
      equipmentType === null ? [undefined,'ABSENT'] : [equipmentType,'PRESENT'], 'EquipmentType');
    if (templateId !== 41) {
      const rawRecord = { ID:templateId, CastingLawLevelUpInfoList:levelIds };
      if (equipmentType !== null) rawRecord.EquipmentType = equipmentType;
      const fieldStates = { ID:'PRESENT', CastingLawLevelUpInfoList:'PRESENT', EquipmentType:equipmentType === null ? 'ABSENT' : 'PRESENT' };
      requireGold(evidence.templates[i], {sourceArrayIndex,rawRecord,fieldStates}, 'Template evidence');
      requireGold(template, {templateId,rawRecord,fieldStates,provenance:goldEvidence+'#/templates/'+i}, 'Template fields');
    }
    const rows = references.records.filter(row => row.templateId === templateId);
    requireGold(rows.map(row => row.levelUpInfoId),template.rawRecord.CastingLawLevelUpInfoList,'CastingLawLevelUpInfoList attribution');
    let subtotalGold = 0;
    for (const [j,id] of levelIds.entries()) {
      requireGold(rows[j], {templateId,sourceField:'ConfigDataCastingLawTemplateInfo.CastingLawLevelUpInfoList',sourceArrayIndex:j,
        levelUpInfoId:id,levelUpEndpointNamespace:'ConfigDataCastingLawLevelUpInfo.ID',levelUpSourceArrayIndex:positions[j],
        levelUpRecordLocator:'ConfigDataCastingLawLevelUpInfo#ID='+id}, 'level locator');
      const records = costs.records.filter(row => row.levelUpInfoId === id);
      requireGold(records.length,1,'level endpoint');
      const [cost] = records;
      const expected = (templateId === 30 ? armorVector : goldVector)[j];
      requireGold(cost.rawFields.LevelUpGoldCost,expected,'level cost');
      subtotalGold += cost.rawFields.LevelUpGoldCost;
      if (templateId !== 41) {
        const index = i * 10 + j;
        const rawFields = { ID:id, LevelUpGoldCost:expected };
        requireGold(cost,{levelUpInfoId:id,rawFields,provenance:goldEvidence+'#/levels/'+index},'level fields');
        requireGold(evidence.levels[index],{sourceArrayIndex:positions[j],rawFields},'level evidence');
      }
    }
    expectedSlots.push({index:i,slot,templateId,labelKo,subtotalGold});
  }
  requireGold(references.sourceOrder,[14,12,37,40,41,1,2,30,33],'Template order');
  requireGold(costs.sourceOrder,references.records.map(row => row.levelUpInfoId),'LevelUp order');
  // The #335 owners retain their full records and provenance. Template 41 belongs to both heroes.
  const lianaDigests = [
    'c6a212941bbafb4bbc061ad615170d9a58692248a24ef017ffdea4089e3c7213',
    '7d5c18ccd379949168133ef23057b5a6adfb57869220a995eb8c403366afdabe',
    '9aedbb0d5bc047797877188f80d0410e4d35f5a287f781923a698f1480e759ff',
    '059f5634d8369e95cd65dee2078345c892e489e100cf987b94b149d2a1cbf7f3',
  ];
  for (const [i,document] of [hero, templates, references, costs].entries()) {
    const subset = lianaCastingInput(goldInputs[i], document);
    const digest = createHash('sha256').update(JSON.stringify(subset)).digest('hex');
    requireGold(digest, lianaDigests[i], 'preserved Hero 15 owner');
  }
  return expectedSlots;
}

export async function readLanceGoldDisplay(readJson) {
  const slots = await readLanceGoldSource(readJson);
  const decision = await readJson(lanceGoldDecision);
  requireGold([decision.schemaVersion,decision.status,decision.heroId,decision.surface,decision.unit,decision.levels,decision.placement,decision.slots],
    [1,'APPROVED',16,'hero-minimal-detail-16','gold',[1,10],'directly after the job path',slots], 'publication scope');
  const total = slots.reduce((sum,row) => sum + row.subtotalGold, 0);
  requireGold(total,10800000,'total');
  const lines = ['Lv.1~10 합계 골드 '+total.toLocaleString('ko-KR'),
    ...slots.map(row => row.labelKo+' · Lv.1~10 소계 골드 '+row.subtotalGold.toLocaleString('ko-KR'))];
  requireGold(decision.paragraphs,lines,'publication paragraphs');
  return lines;
}
