import { createHash } from 'node:crypto';

export const HERO_16_INTEGRATED_PUBLICATION_PATH = 'docs/decisions/hero-16-integrated-publication.v1.json';
export const HERO_16_MINIMAL_DETAIL_PATH = 'generated/hero-minimal-detail-16.v1.json';
export const HERO_16_MINIMAL_DETAIL_FRAGMENT = 'hero-minimal-detail-16';

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
