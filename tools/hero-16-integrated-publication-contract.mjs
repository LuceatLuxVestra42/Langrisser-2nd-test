import { heartSkills, heartSourcePath, requireHeart } from './lance-heart-fetter.mjs';
import { readLanceFetterSource, lanceFetterDecision } from './lance-fetter-gold.mjs';
import { lanceCentralEvidence, lanceCentralSource, lanceDescDigest } from './validate-hero15-skill-references.mjs';
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

export const commandDecisionPath = 'docs/decisions/hero-16-minimal-soldier-command-publication.v1.json';

export function lanceCommandRows(baseRow, bondRow, decision) {
  if (baseRow?.heroId !== 16 || !isDeepStrictEqual(baseRow.base,{hp:10,at:5,df:10})) throw new Error('Lance command base attribution');
  if (bondRow?.heroId !== 16 || !isDeepStrictEqual(bondRow.contribution,{hp:25,at:10,df:25,magicDf:10})) throw new Error('Lance command bond attribution');
  const labels = {hp:'생명',at:'공격',df:'방어',magicDf:'마방'};
  const rows = Object.entries(labels).map(([key,label]) => [label,
    Object.hasOwn(baseRow.base,key) ? '+'+baseRow.base[key]+'%' : '', '+'+bondRow.contribution[key]+'%']);
  if (decision?.schemaVersion !== 1 || decision.status !== 'APPROVED' || decision.heroId !== 16
    || decision.surface !== HERO_16_MINIMAL_DETAIL_FRAGMENT || decision.mode !== 'NORMAL'
    || decision.placement !== 'immediately-after-second-final-job-paragraph' || decision.heading !== '병사 지휘 보정'
    || !isDeepStrictEqual(decision.columns,['능력치','기본 지휘','최대 레벨 일반 유대']) || !isDeepStrictEqual(decision.rows,rows)) {
    throw new Error('Lance command publication scope or values');
  }
  return rows;
}

export const finalJobPathDecision = 'docs/decisions/hero-16-minimal-final-job-paths-publication.v1.json';

export function splitJobAdvancements(advancements, expected) {
  const lance = advancements.records.filter(row => row.heroId === 16);
  if (lance.length !== 3) throw new Error('Hero 16 job path edge count mismatch');
  if (!isDeepStrictEqual(lance[0], expected[5])) throw new Error('Hero 16 job path edge direction mismatch');
  if (!isDeepStrictEqual(advancements.records, expected)) throw new Error('Direct advancement union differs from source endpoints or locators');
  return { first: {records:lance.slice(0,1)}, finals:lance.slice(1) };
}

export function finalJobPathLines(decision, memberships, edges, expected, localizations) {
  if (!isDeepStrictEqual(edges, expected) || edges.length !== 2) throw new Error('Hero 16 final path endpoint or locator mismatch');
  const names = [['드래곤 나이트','드래곤 마스터'],['하이랜더','로열 나이트']];
  const paths = edges.map((edge, index) => {
    const predecessor = [edge.predecessorConnectionId, edge.predecessorJobId];
    const successor = [edge.successorConnectionId, edge.successorJobId];
    const labels = [predecessor, successor].map(([,jobId], role) => {
      if (memberships.records.filter(row => row.heroId === 16 && row.jobId === jobId).length !== 1) {
        throw new Error('Hero 16 ' + predecessor.join('/') + ' → ' + successor.join('/') + ' missing '
          + ['predecessor','successor'][role] + ' Job ' + jobId);
      }
      const matches = localizations.records.filter(row => row.jobId === jobId);
      if (matches.length !== 1 || matches[0].nameKo !== names[index][role]) throw new Error('Hero 16 final Job localization mismatch');
      return matches[0].nameKo;
    });
    return {predecessor, successor, textKo:'전직 · ' + labels.join(' → ')};
  });
  if (decision?.schemaVersion !== 1 || decision.status !== 'APPROVED' || decision.heroId !== 16
    || decision.surface !== HERO_16_MINIMAL_DETAIL_FRAGMENT
    || decision.placement !== 'consecutive-plain-paragraphs-immediately-after-bond-gold-disclosure'
    || !isDeepStrictEqual(decision.paths, paths)) throw new Error('Hero 16 final path publication scope or order mismatch');
  return paths.map(path => path.textKo);
}

export const finalMovementEvidence = 'evidence/source/jobs/hero16-final-job-movement.v1.json';
export const finalMovementDecision = 'docs/decisions/hero-16-minimal-final-job-movement-publication.v1.json';

export function validateFinalMovementEvidence(source) {
  if (source.repository !== 'LuceatLuxVestra42/langrisser-future-guide') throw new Error('Lance final movement source repository');
  for (const [table, commit, path, blob, projectionDigest] of [
    [source.jobs, '6475e63ee23d18adf733756c26a14fa9e3ed662c', 'data/configdata/ConfigDataJobInfo.json',
      '4cbcac591ff5bc8d7cf2dcbf971cf2465f0cb133', '20311e2d6d99fbdf3195776f77cc1ebf6ef4880589052f6b66f4ad8a4502803f'],
    [source.movement, '214e759b46741a534f0ffb297dd7265deb4bd5ca', 'data/contracts/hero-soldier-movement-type-presentation.v1.json',
      '422078f935ec57a66b4763514fa2da8f2d3fccda', '200c3619b810e92c57a1ebfc2463884b936517c48a83bef17e78e652ad9595ef'],
  ]) {
    const digest = createHash('sha256').update(JSON.stringify(table.records)).digest('hex');
    if (!isDeepStrictEqual([table.commit, table.path, table.blob, digest], [commit, path, blob, projectionDigest])) {
      throw new Error('Lance final movement pinned source: ' + path);
    }
  }
}

export function finalJobMovementLines(successors, jobs, definitions, decision) {
  const fields = ['BF_AttackDistance', 'MoveType', 'BF_MovePoint'];
  if (!isDeepStrictEqual([decision?.schemaVersion, decision?.status, decision?.scope, decision?.heroId, decision?.surface,
    decision?.placement, decision?.allowedFields, decision?.evidence, decision?.jobPaths],
    [1, 'APPROVED', 'FINAL_JOB_BASE_ATTRIBUTES_ONLY', 16, HERO_16_MINIMAL_DETAIL_FRAGMENT,
      'consecutive-plain-paragraphs-immediately-after-bond-gold-disclosure', fields, finalMovementEvidence, finalJobPathDecision])
    || !decision.approval?.source || !decision.approval?.basis) throw new Error('Lance final movement publication scope');
  if (decision.rows?.length !== 2) throw new Error('Lance final movement approved row missing');
  if (successors.length !== 2 || jobs.length !== 2 || definitions.length !== 2) throw new Error('Lance final movement population');

  const expected = [
    { connection: 164, job: 405, locator: '#/256', type: 4, key: 'FLY', korean: '비행 이동', short: '비행', definition: '#/definitions/3',
      path: '전직 · 드래곤 나이트 → 드래곤 마스터' },
    { connection: 165, job: 306, locator: '#/195', type: 1, key: 'RIDE', korean: '기마 이동', short: '기마', definition: '#/definitions/0',
      path: '전직 · 하이랜더 → 로열 나이트' },
  ];
  return successors.map(({ connectionId, jobId, pathText }, index) => {
    const spec = expected[index];
    if (connectionId !== spec.connection || jobId !== spec.job) {
      throw new Error('Lance final movement requires Connection ' + spec.connection + ' -> Job ' + spec.job);
    }
    if (pathText !== spec.path) throw new Error('Lance final movement path attribution');
    const job = jobs.find(row => row.ID === jobId);
    if (job?.locator !== spec.locator) throw new Error('Lance final movement Job locator ' + jobId);
    if (job.BF_AttackDistance !== 1) throw new Error('Lance final movement base range for Job ' + jobId);
    if (job.BF_MovePoint !== 5) throw new Error('Lance final movement points for Job ' + jobId);
    if (job.MoveType !== spec.type) throw new Error('Lance final movement type for Job ' + jobId);
    const definition = definitions.find(row => row.id === job.MoveType);
    if (!isDeepStrictEqual(definition, { locator: spec.definition, id: spec.type, key: spec.key, nameKr: spec.korean })) {
      throw new Error('Lance final movement Korean definition for ' + spec.type + '/' + spec.key);
    }
    const approved = decision.rows[index];
    const text = pathText + ' · 기본 사거리 ' + job.BF_AttackDistance + ' · ' + spec.short + ' · 이동력 ' + job.BF_MovePoint;
    if (!isDeepStrictEqual(approved, { connectionId, jobId, attackDistance: job.BF_AttackDistance, moveType: definition.id,
      moveLabelKo: spec.short, movePoint: job.BF_MovePoint, textKo: text })) throw new Error('Lance final movement approved row for Job ' + jobId);
    return text;
  });
}

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

export const lanceEffectDecision = 'docs/decisions/hero-16-minimal-central-discipline-publication.v1.json';
export const lanceEffectFreeze = 'evidence/localization/hero-16-central-discipline-ko-freeze.v1.json';
const lanceEffectText = [
  '상성 우세인 부대와 전투 시 모든 스탯 +15%',
  '혼합부대로 구성 시 이동력 +2, 전투 후 피해량의 20%만큼 회복',
];

export async function readLanceCentralEffect(readJson) {
  const [decision, evidence, frozen, references, skills] = await Promise.all([
    readJson(lanceEffectDecision), readJson(lanceCentralEvidence), readJson(lanceEffectFreeze),
    readJson('canonical/hero-skill-references.v1.json'), readJson('canonical/skills.v1.json'),
  ]);
  const expected = lanceCentralSource(evidence);
  const matches = references.records.filter(row => row.heroId === 16 && row.skillId === 90092);
  if (matches.length !== 1) throw new Error('Lance central reference missing or duplicated');
  if (matches[0].referenceKind !== expected.reference.referenceKind) throw new Error('Lance central reference kind mismatch');
  if (matches[0].endpointNamespace !== expected.reference.endpointNamespace) throw new Error('Lance central endpoint namespace mismatch');
  if (!isDeepStrictEqual(matches[0], expected.reference)) throw new Error('Lance central reference provenance mismatch');
  const identities = skills.records.filter(row => row.skillId === 90092);
  if (identities.length !== 1 || createHash('sha256').update(identities[0].descriptionCn).digest('hex') !== lanceDescDigest)
    throw new Error('Lance central identity Desc digest mismatch');
  if (!isDeepStrictEqual(identities[0], expected.identity)) throw new Error('Lance central identity provenance mismatch');

  const pin = {
    repository: 'LuceatLuxVestra42/langrisser-future-guide', commit: '57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff',
    path: 'data/presentation/hero-central-discipline-ko/part-04.v1.json',
    gitBlobSha1: 'd6113b7279d840f832165ee5b2d7bc412a8040b0', locator: '#/records/11',
  };
  const { record } = frozen;
  if (frozen.schemaVersion !== 1 || !isDeepStrictEqual(frozen.source, pin)
      || record.heroId !== 16 || record.castingLawSkillId !== 90092
      || record.source.sheet !== '출시된 율정' || record.source.effectRow !== 184 || record.source.heroRow !== 185
      || record.source.heroNameKoRaw !== '란스') throw new Error('Lance central frozen Korean record mismatch');
  const lines = record.effectTextKo.split('\n');
  if (lines[0] !== lanceEffectText[0]) throw new Error('Lance central frozen Korean first line mismatch');
  if (!isDeepStrictEqual(lines, lanceEffectText)) throw new Error('Lance central frozen Korean text mismatch');

  if (decision.schemaVersion !== 1 || decision.status !== 'APPROVED' || decision.heroId !== 16 || decision.skillId !== 90092
      || decision.surface !== 'hero-minimal-detail-16' || decision.classification !== 'PROJECT_DISPLAY_ONLY'
      || decision.descriptionCnSha256 !== lanceDescDigest
      || decision.placement !== 'Two plain paragraphs directly after the central discipline heading and before the six gold paragraphs.')
    throw new Error('Lance central publication scope mismatch');
  if (!isDeepStrictEqual(decision.koreanSource, pin)) throw new Error('Lance central decision frozen locator mismatch');
  if (!isDeepStrictEqual(decision.effectLines, lines)) throw new Error('Lance central decision Korean text mismatch');
  return lines;
}

export async function readLanceFetterTotals(readJson) {
  const [approved, decision] = await Promise.all([readLanceFetterSource(readJson), readJson(lanceFetterDecision)]);
  const expected = {
    schemaVersion: 1, status: 'APPROVED', heroId: 16, surface: 'hero-minimal-detail-16', levels: [2,10],
    title: '유대 강화 골드', unit: 'gold',
    placement: 'Closed details directly after central discipline; six total paragraphs in source group order.',
    groups: approved,
  };
  for (const [field, value] of Object.entries(expected)) {
    if (!isDeepStrictEqual(decision[field], value)) throw new Error('Lance Fetter publication scope mismatch');
  }
  return approved.map(group => group.paragraph);
}

export function lanceHeartGroups(conditions, source, edges, memberships, names, decision) {
  const { sources, korean } = source;
  requireHeart([korean.commit,korean.mapping.path,korean.mapping.locator,korean.mapping.blob,korean.overlay.path,korean.overlay.blob,korean.overlay.status],
    ['57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff','data/generated/hero-heart-fetter-site-consumer/hero-map-001.json','#/heroes/16',
      'a7941ba92b6a91bd752d7791cdcd39ebc9c5af27','data/presentation/hero-heart-fetter-effect-kr.v1.json',
      'b884f7594636800233aea40566918487d919a4d9','AUTO_TRANSLATED_REVIEWABLE'],'frozen Korean provenance');
  const descriptions = [
    '00ed8e1331b6b958bd91c4d9dddb01c3134dbf8c3cc968749add5d20975caa3a','4461dc2fdb3855301e85eea193c50b37c4b0dfeb3995e57d1c59697a5f03a34b',
    '3f397eb11d2fb74c4864adb76a0e7fa9975b215d7a2af2da8050c0646d67355f','8a19f82eda60a992a5f1307066c6f4e804715c2b352abe87b134cfab4623b00a',
  ];
  requireHeart(korean.sheet,{repository:'redpanda7301/langrisser',commit:'a85bba49dcf073563e7366dc18e96b7ba67c2ae3',
    path:'hero/data/란스.js',royalKnightLines:[136,137],dragonMasterLines:[168,169]},'sheet provenance');
  requireHeart(korean.mapping.rows.length,4,'frozen job population');
  const publication = [];
  const groups = [[164,405,161,403,108,256,'龙骑统帅','드래곤 마스터'],[165,306,162,302,109,195,'皇家骑士','로열 나이트']];
  const display = groups.map(([connectionId,jobId,predecessor,fromJob,connectionIndex,jobIndex,nameCn,nameKo],g) => {
    const edge = edges.filter(row => row.heroId === 16 && row.successorConnectionId === connectionId);
    requireHeart(edge.map(r=>[r.predecessorConnectionId,r.predecessorJobId,r.successorJobId,r.sourceLocator]),
      [[predecessor,fromJob,jobId,'data/configdata/ConfigDataJobConnectionInfo.json#/'+connectionIndex+'/PreJobConnectionList/0']],'direct edge '+connectionId+'/'+jobId);
    requireHeart(sources.HeroInfo.records[0].fields.UseableJobConnections_ID[3+g],connectionId,'Hero Job Connection');
    requireHeart(sources.JobConnectionInfo.records[g],{index:connectionIndex,fields:{ID:connectionId,Job_ID:jobId,PreJobConnectionList:[predecessor]}},'Job Connection source');
    requireHeart(sources.JobInfo.records[g],{index:jobIndex,fields:{ID:jobId,Name:nameCn}},'Job name source');
    requireHeart(memberships.records.filter(r=>r.heroId===16 && r.jobId===jobId).length,1,'Job membership');
    requireHeart(names.records.filter(r=>r.jobId===jobId).map(r=>r.nameKo),[nameKo],'Job localization');
    const lines = [];
    for (const [i,[skillId,level,job,skillIndex,buffIndex,text]] of heartSkills.entries()) {
      if (job !== jobId) continue;
      const rows = conditions.records.filter(r=>r.heroId===16 && r.heartFetterId===16 && r.heartFetterLevel===level && r.skillId===skillId);
      requireHeart(rows.map(r=>r.sourceProvenance),[{heartFetterSourceIndex:i,skillSourceIndex:skillIndex,passiveBuffSourceIndices:[buffIndex]}],
        nameKo+' Lv.'+level+' Skill '+skillId+' missing at #/14/UnlockSkills_ID/'+i+', #/'+skillIndex+', #/'+buffIndex);
      requireHeart(korean.mapping.rows.filter(r=>r[2]===skillId),[[level,jobId,skillId,'VALIDATED_DEFAULT']],'frozen job mapping');
      const cn = sources.SkillInfo.records[i].fields.Desc;
      const translation = korean.overlay.skills[skillId];
      requireHeart([cn.startsWith('职业为'+nameCn+'生效:'),createHash('sha256').update(cn).digest('hex')],[true,descriptions[i]],'Skill description');
      requireHeart([translation?.descriptionCn,translation?.descriptionKr],[cn,text],'frozen Korean text '+skillId);
      publication.push({connectionId,jobId,level,skillId,descriptionKo:text});
      lines.push('Lv.'+level+' · '+text);
    }
    return [nameKo,...lines];
  });
  requireHeart([decision.schemaVersion,decision.status,decision.heroId,decision.heartFetterId,decision.surface,
    decision.placement,decision.displayStatus,decision.officialKrProvenanceStatus,decision.evidence,decision.rows],
    [1,'APPROVED',16,16,'hero-minimal-detail-16','immediately-after-soldier-command','PROJECT_DISPLAY_ONLY','unverified',heartSourcePath,publication],
    'Lance publication scope');
  if (!decision.approval?.source || !decision.approval?.basis) throw new Error('Heart Fetter publication approval source');
  return display;
}

export const bond23EvidencePath = 'evidence/source/bonds/hero16-bond23-mission-descriptions.v1.json';
export const bond23DecisionPath = 'docs/decisions/hero-16-minimal-bond23-descriptions-publication.v1.json';

function requireBondValue(actual, expected, reason) {
  if (!isDeepStrictEqual(actual, expected)) throw new Error('Lance bond descriptions: ' + reason);
}

export function lanceBondDescriptions(references, source, names, decision) {
  requireBondValue([source.schemaVersion, source.repository, source.commit], [1, 'LuceatLuxVestra42/langrisser-future-guide',
    '6475e63ee23d18adf733756c26a14fa9e3ed662c'], 'ConfigData origin');
  for (const [table, name, blob] of [
    [source.fetters, 'HeroFetterInfo', '1beec024e3d82e57923e59c70048c5abefd92d06'],
    [source.missions, 'MissionInfo', '72c62b297a0664844c3c53dc10452a1b0ca4704d'],
  ]) {
    requireBondValue([table.path, table.gitBlobSha1, table.records.length],
      ['data/configdata/ConfigData' + name + '.json', blob, 2], name + ' provenance');
  }
  const koreanNames = names.records.filter(row => row.heroId === 16).map(row => row.nameKo);
  requireBondValue(koreanNames, ['란스'], 'bond 3 Mission 5054 requires Hero 16 Korean name');
  const lines = ['유대 2 · 레벨 30 달성', '유대 3 · ' + koreanNames[0] + '를 출전시켜 시공의 균열 3-1[정예] 클리어'];
  const selections = [
    { bond: 2, fetterId: 72, missionId: 5053, slot: 1, level: 10, fetterLocator: '#/71', missionLocator: '#/370', type: 34, desc: '兰斯到达30级' },
    { bond: 3, fetterId: 73, missionId: 5054, slot: 2, level: 15, fetterLocator: '#/72', missionLocator: '#/371', type: 5, desc: '使用兰斯完成时空裂缝精英3-1' },
  ];
  for (const [index, spec] of selections.entries()) {
    const { fetterId, missionId, slot, level, fetterLocator, missionLocator, type, desc } = spec;
    const refs = references.records.filter(row => row.heroId === 16 && row.fetterId === fetterId);
    requireBondValue(refs, [{ heroId: 16, heroInformationId: 16, fetterId, referenceKind: 'HERO_FETTER_ID_REFERENCE',
      sourceField: 'ConfigDataHeroInformationInfo.HeroFetters_ID', endpointNamespace: 'ConfigDataHeroFetterInfo.ID',
      provenance: 'evidence/source/bonds/hero16-fetter-gold.v1.json#/information/fields/HeroFetters_ID/' + slot }],
      'Hero 16 regular Fetter ' + fetterId + ' reference');
    const fetter = source.fetters.records[index];
    requireBondValue([fetter.ID, fetter.locator], [fetterId, fetterLocator], 'Fetter ' + fetterId + ' record');
    requireBondValue(fetter.selectedLocator, fetterLocator + '/CompletionConditions/1', 'Fetter ' + fetterId + ' selected locator');
    const conditions = fetter.CompletionConditions;
    requireBondValue(conditions.length, 2, 'Fetter ' + fetterId + ' condition count');
    const affinityCondition = { ConditionType: 1, Parm1: 16, Parm2: level };
    if (isDeepStrictEqual(conditions[1], affinityCondition)) {
      throw new Error('Lance bond descriptions: Fetter ' + fetterId + ' Mission condition misplaced at [1]');
    }
    requireBondValue(conditions[1].ConditionType, 2, 'Fetter ' + fetterId + ' condition type at [1]');
    requireBondValue(conditions[1], { ConditionType: 2, Parm1: missionId }, 'Fetter ' + fetterId + ' Mission attribution at [1]');
    requireBondValue(conditions[0], affinityCondition, 'Fetter ' + fetterId + ' first condition');
    const mission = source.missions.records[index];
    requireBondValue([mission.locator, mission.ID, mission.Title, mission.MissionType], [missionLocator, missionId, '兰斯', type], 'Mission ' + missionId + ' record');
    requireBondValue(mission.Desc, desc, 'Mission ' + missionId + ' pinned Desc');
  }

  if (!decision) throw new Error('Lance bond descriptions: missing publication decision');
  requireBondValue(decision.status, 'APPROVED', 'publication approval status');
  requireBondValue(decision.scope, 'PROJECT_TRANSLATED_SOURCE_DESCRIPTION_ONLY', 'translation-only scope');
  requireBondValue([decision.schemaVersion, decision.heroId, decision.surface, decision.placement, decision.sourceEvidence, decision.heroNameSource],
    [1, 16, HERO_16_MINIMAL_DETAIL_FRAGMENT, 'consecutive-card-paragraphs-immediately-after-heart-fetter', bond23EvidencePath,
      'canonical/hero-localizations-ko.v1.json#heroId=16'], 'decision subject or placement');
  if (!decision.approval?.source || !decision.approval?.basis) throw new Error('Lance bond descriptions: publication approval source');
  requireBondValue(decision.rows.map(({ bond, fetterId, missionId }) => [bond, fetterId, missionId]),
    [[2, 72, 5053], [3, 73, 5054]], 'publication Mission attribution');
  requireBondValue(decision.rows.map(row => row.textKo), lines, 'publication Korean text');
  return lines;
}

export const bond45EvidencePath = 'evidence/source/bonds/hero16-bond45-mission-descriptions.v1.json';
export const bond45DecisionPath = 'docs/decisions/hero-16-minimal-bond45-description-publication.v1.json';

export function lanceCompanionBondDescriptions(references, source, names, decision) {
  const tuples = [[4, 74, 5055, 11, 16, 164, '4'], [5, 75, 5056, 14, 16, 165, '5']];
  const { HeroInfo, HeroInformationInfo, HeroFetterInfo, MissionInfo, HeroDungeonLevelInfo } = source.tables;
  requireBondValue([source.schemaVersion, source.repository, source.commit],
    [1, 'LuceatLuxVestra42/langrisser-future-guide', '6475e63ee23d18adf733756c26a14fa9e3ed662c'], 'bond 4/5 source version');
  for (const [name, blob, count] of [
    ['HeroInfo', '728daab3370f0c7779449663ea02e638677944d4', 3],
    ['HeroInformationInfo', '49aef6be8ea1a65d5725c16a05dab94fffa73f92', 291],
    ['HeroFetterInfo', '1beec024e3d82e57923e59c70048c5abefd92d06', 2],
    ['MissionInfo', '72c62b297a0664844c3c53dc10452a1b0ca4704d', 2],
    ['HeroDungeonLevelInfo', '3b4282a1a8707f4f83545138eb052c594055bfb7', 2],
  ]) {
    const table = source.tables[name];
    requireBondValue([table.path, table.blob, (table.records ?? table.ownerReferences).length],
      ['data/configdata/ConfigData' + name + '.json', blob, count], name + ' bond 4/5 provenance');
  }
  const owner = HeroInfo.records[2];
  const information = HeroInformationInfo.lance;
  requireBondValue([owner.locator, owner.ID, owner.Name, owner.HeroInformation_ID, information.locator, information.ID, information.HeroFetters_ID],
    ['#/15', 16, '兰斯', 16, '#/15', 16, [71, 72, 73, 74, 75]], 'Lance HeroInformation and regular Fetters');
  const lines = tuples.map((expected, i) => {
    const [bond, fetterId, missionId, companionId, ownerId, stageId, number] = expected;
    const slot = bond - 1;
    const selectedId = information.HeroFetters_ID[slot];
    const refs = references.records.filter(row => row.heroId === owner.ID && row.fetterId === selectedId);
    requireBondValue(refs, [{ heroId: 16, heroInformationId: 16, fetterId, referenceKind: 'HERO_FETTER_ID_REFERENCE',
      sourceField: 'ConfigDataHeroInformationInfo.HeroFetters_ID', endpointNamespace: 'ConfigDataHeroFetterInfo.ID',
      provenance: 'evidence/source/bonds/hero16-fetter-gold.v1.json#/information/fields/HeroFetters_ID/' + slot }],
      'bond ' + bond + ' Hero 16 regular Fetter ' + fetterId + ' reference');
    const fetter = HeroFetterInfo.records[i];
    const locator = ['#/73', '#/74'][i];
    requireBondValue([fetter.ID, fetter.locator], [selectedId, locator], 'Fetter ' + fetterId + ' source record');
    requireBondValue(fetter.selectedLocator, locator + '/CompletionConditions/1', 'Fetter ' + fetterId + ' selected locator');
    const conditions = fetter.CompletionConditions;
    requireBondValue([conditions.length, conditions[1].ConditionType], [2, 2], 'Fetter ' + fetterId + ' condition object at [1]');
    requireBondValue(conditions[0], { ConditionType: 1, Parm1: owner.ID, Parm2: [23, 25][i] }, 'Fetter ' + fetterId + ' first condition');
    requireBondValue(conditions[1], { ConditionType: 2, Parm1: missionId }, 'Fetter ' + fetterId + ' Mission attribution');

    const mission = MissionInfo.records.find(row => row.ID === conditions[1].Parm1);
    const companion = HeroInfo.records[i];
    const stage = HeroDungeonLevelInfo.records.find(row => row.ID === mission?.Param3);
    const stageName = ['魔物显形', '骑士'][i];
    requireBondValue([mission?.locator, mission?.Title, mission?.Param4, mission?.Desc],
      [['#/372', '#/373'][i], owner.Name, 1, ['在娜姆的帮助下完成魔物显形', '在雪莉的帮助下完成骑士'][i]], 'Mission ' + missionId + ' source');
    requireBondValue(mission.MissionType, 5, 'Mission ' + missionId + ' MissionType=5');
    requireBondValue(mission.Param2, 6, 'Mission ' + missionId + ' Param2=6');
    requireBondValue(mission.Param3, stageId, 'Mission ' + missionId + ' Stage attribution');
    const stageLocator = ['#/84', '#/85'][i];
    requireBondValue([stage?.locator, stage?.Name, stage?.nameNumLocator], [stageLocator, stageName, stageLocator + '/NameNum'], 'Stage ' + stageId + ' record');
    requireBondValue(stage.NameNum, number, 'Stage ' + stageId + ' NameNum');

    const stageOwners = new Set(HeroInformationInfo.ownerReferences
      .filter(row => row.DungeonLevels_ID?.includes(stage.ID)).map(row => row.ID));
    const heroIds = new Set(HeroInfo.ownerReferences.filter(row => stageOwners.has(row.HeroInformation_ID)).map(row => row.ID));
    requireBondValue(heroIds.has(owner.ID), true, 'Hero 16 missing Stage ' + stageId + ' ownership');
    requireBondValue([...heroIds], [ownerId], 'Stage ' + stageId + ' complete reverse-owner set');
    requireBondValue(HeroInformationInfo.ownerReferences[15].DungeonLevels_ID[slot], stage.ID, 'Lance dungeon slot ' + slot);
    const companions = new Set([...heroIds, mission.Param1]);
    companions.delete(owner.ID);
    requireBondValue([...companions], [companionId], 'Mission ' + missionId + ' companion attribution');
    requireBondValue([companion.ID, companion.Name, companion.locator], [mission.Param1, ['娜姆', '雪莉'][i], ['#/10', '#/13'][i]], 'companion Hero source');
    const [resolvedOwner] = heroIds;
    const [resolvedCompanion] = companions;
    requireBondValue([slot + 1, fetter.ID, mission.ID, resolvedCompanion, resolvedOwner, stage.ID, stage.NameNum], expected, 'source tuple for bond ' + bond);
    const ko = names.records.filter(row => row.heroId === resolvedCompanion).map(row => row.nameKo);
    requireBondValue(ko, [['나암', '쉐리'][i]], 'bond ' + bond + ' Mission ' + missionId + ' Hero ' + companionId + ' Korean name');
    return '유대 ' + bond + ' · ' + ko[0] + ['과', '와'][i] + ' 함께 운명의문 ' + stage.NameNum + ' 클리어';
  });
  // Pin both complete source projections after the row-specific attribution checks.
  for (const [rows, digest] of [
    [HeroInfo.ownerReferences, '35ec40d5ccef69e7c66e10f948cbcc4b9e44f6c2ad212b520cf2a52c003fbabf'],
    [HeroInformationInfo.ownerReferences, '6956fd67e66cb0121e2e0442508ca5497dd0fcf64583389da440ade3272a998e'],
  ]) requireBondValue(createHash('sha256').update(JSON.stringify(rows)).digest('hex'), digest, 'complete dungeon ownership inputs');
  if (!decision) throw new Error('Lance bond descriptions: missing bond 4/5 decision');
  requireBondValue(decision.status, 'APPROVED', 'bond 4/5 approval status');
  requireBondValue(decision.scope, 'PROJECT_BOND_DESCRIPTION_ONLY', 'bond 4/5 description-only scope');
  requireBondValue([decision.schemaVersion, decision.heroId, decision.surface, decision.placement, decision.evidence, decision.companionNames],
    [1, 16, HERO_16_MINIMAL_DETAIL_FRAGMENT, 'consecutive-card-paragraphs-immediately-after-bond-3-description',
      bond45EvidencePath, 'canonical/hero-localizations-ko.v1.json'], 'bond 4/5 decision surface or source');
  if (!decision.approval?.source || !decision.approval?.basis) throw new Error('Lance bond descriptions: missing bond 4/5 approval source');
  requireBondValue(decision.rows.map(row => [row.bondNumber, row.fetterId, row.missionId, row.companionHeroId,
    row.dungeonOwnerHeroId, row.stageId, row.stageNameNum]), tuples, 'bond 4/5 approved decision tuples');
  requireBondValue(lines, ['유대 4 · 나암과 함께 운명의문 4 클리어', '유대 5 · 쉐리와 함께 운명의문 5 클리어'], 'bond 4/5 display text');
  requireBondValue(decision.rows.map(row => row.textKo), lines, 'bond 4/5 decision text');
  return lines;
}

export const lanceForwardDecisionPath = 'docs/decisions/hero-16-minimal-soldier-forward-links-publication.v1.json';
const lanceForwardSoldiers = [
  [115, '근위창병', '/9/GetSoldierHeros_ID/4'],
  [324, '천상의 수호자', '/68/GetSoldierHeros_ID/1'],
  [423, '메카 드래곤 나이트', '/101/GetSoldierHeros_ID/1'],
  [419, '홀리 페가수스', '/97/GetSoldierHeros_ID/0'],
  [402, '로열 그리폰', '/85/GetSoldierHeros_ID/3'],
];

export function lanceSoldierForwardLinks({ relations, identities, source, names, destinations, decision }) {
  function requireClaim(condition, message) {
    if (!condition) throw new Error('Lance forward links: ' + message);
  }
  requireClaim(decision, 'publication decision missing');
  requireClaim(decision.status === 'APPROVED', 'approval status');
  requireClaim(decision.heroId === 16 && decision.surface === HERO_16_MINIMAL_DETAIL_FRAGMENT, 'approved surface');
  requireClaim(decision.direction === 'HERO_TO_SOLDIER_ONLY', 'approved direction');
  requireClaim(decision.title === '일반 3티어 용병 (일부)' && decision.placement === 'after-bond-5-description', 'title or placement');
  requireClaim(decision.approval?.source?.trim() && decision.approval.basis?.trim(), 'approval source and basis');

  const links = lanceForwardSoldiers.map(([soldierId, expectedName, fieldLocator]) => {
    const matches = relations.filter(row => row.heroId === 16 && row.soldierId === soldierId);
    requireClaim(matches.length === 1, soldierId + ' relation missing or duplicated');
    const direct = [{ sourceKind: 'BASE_SOLDIER_HERO', sourceClass: 'DIRECT', origin: {
      table: 'ConfigDataSoldierInfo', recordId: soldierId, recordKeyField: 'ID', field: 'GetSoldierHeros_ID', fieldLocator,
    } }];
    requireClaim(matches[0].evidenceClass === 'A' && isDeepStrictEqual(matches[0].provenance, direct), soldierId + ' direct provenance');
    const identity = identities.filter(row => row.id === soldierId);
    requireClaim(identity.length === 1 && identity[0].entity === 'Soldier' && identity[0].variant === 'NORMAL', soldierId + ' NORMAL namespace');
    const records = source.filter(row => row.ID === soldierId);
    requireClaim(records.length === 1 && records[0].Rank === 3, soldierId + ' T3 Rank mismatch');
    const labels = names.filter(row => row.soldierId === soldierId);
    requireClaim(labels.length === 1, 'NORMAL ' + soldierId + ' Korean name missing or duplicated');
    const { nameKo, evidenceClass } = labels[0];
    requireClaim(evidenceClass === 'A' && nameKo === expectedName, soldierId + ' approved Korean name');
    const cards = destinations.filter(row => row.normalSoldierId === soldierId);
    requireClaim(cards.length === 1 && cards[0].nameKo === nameKo, soldierId + ' NORMAL destination');
    return { soldierId, namespace: identity[0].variant, rank: records[0].Rank, nameKo, fragment: 'normal-soldier-' + cards[0].normalSoldierId };
  });
  requireClaim(isDeepStrictEqual(decision.soldiers, links), 'approved ordered destinations');
  return links;
}
