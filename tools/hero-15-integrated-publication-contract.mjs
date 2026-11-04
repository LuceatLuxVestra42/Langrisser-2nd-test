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

export function renderHero15MinimalDetail({ decision, heroIdentities, heroLocalizations, relations, equipmentIdentities, equipmentLocalizations, sourceHashes }) {
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
  exactKeys(data.heroes[0], ['heroId', 'nameKo', 'exclusiveEquipment'], 'Hero 15 minimal detail row');
  exactKeys(data.heroes[0].exclusiveEquipment, ['equipmentId', 'nameKo', 'effectDescriptionKo'], 'Hero 15 minimal equipment');
  if (data.heroes[0].heroId !== 15 || data.heroes[0].exclusiveEquipment.equipmentId !== 535) throw new Error('Hero 15 minimal detail endpoint is out of approved scope');
  return data;
}
