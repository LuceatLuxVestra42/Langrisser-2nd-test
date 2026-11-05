export const HERO_MINIMAL_DETAIL_BATCH_PUBLICATION_PATH = 'docs/decisions/hero-17-18-20-21-30-integrated-publication.v1.json';
export const HERO_MINIMAL_DETAIL_BATCH_PATH = 'generated/hero-minimal-detail-batch-17-18-20-21-30.v1.json';
export const HERO_MINIMAL_DETAIL_BATCH = [
  { heroId: 17, nameKo: '에그베르트', equipmentId: 405, equipmentNameKo: '플레임 코트' },
  { heroId: 18, nameKo: '이멜다', equipmentId: 276, equipmentNameKo: '매혹의 립스틱' },
  { heroId: 20, nameKo: '소니아', equipmentId: 281, equipmentNameKo: '검은 서광' },
  { heroId: 21, nameKo: '발가스', equipmentId: 441, equipmentNameKo: '염룡의 휘광' },
  { heroId: 30, nameKo: '리파니', equipmentId: 286, equipmentNameKo: '요정의 날개' },
];
export const MINIMAL_DETAIL_FIELDS = ['heroId', 'nameKo', 'exclusiveEquipment.equipmentId', 'exclusiveEquipment.nameKo', 'exclusiveEquipment.effectDescriptionKo'];
const sourceHashes = {
  heroIdentity: '6cb710d09df61cbc31d2021fd41b9e1e1b5899377991d14af7a4a5d89e7fe11c',
  heroLocalization: '7f0ca08eb578dd2d1fcf9aa44eb825c49f7e415faeedd2fffa4b604d2c4ab299',
  equipmentRelation: 'a0aa17178c04456482018d3b166baa176224a8562b713fb5f583f2b5a113ba01',
  equipmentIdentity: 'bd59b9cce913ffd3f310d9f96b1295e939959b2e207e55324dc60b2a50f38b9f',
  equipmentLocalization: 'edd54afd11a4701dc039710670dcd321b7f459648887f55d48423ff26f1a125c',
};
const sourcePaths = {
  heroIdentity: 'canonical/hero-identities.v1.json',
  heroLocalization: 'canonical/hero-localizations-ko.v1.json',
  equipmentRelation: 'canonical/hero-exclusive-equipment-relations.v1.json',
  equipmentIdentity: 'canonical/exclusive-equipment.v1.json',
  equipmentLocalization: 'canonical/exclusive-equipment-localizations-ko.v1.json',
};
const exactKeys = (value, keys, label) => {
  if (!value || JSON.stringify(Object.keys(value).sort()) !== JSON.stringify([...keys].sort())) throw new Error(`${label} has unexpected or missing fields`);
};

export function validateHeroMinimalDetailBatchPublication(decision) {
  exactKeys(decision, ['schemaVersion', 'decisionType', 'status', 'approval', 'approvedScope', 'effect'], 'Batch Publication decision');
  exactKeys(decision.approval, ['approverRole', 'source', 'recordedAtDate'], 'Batch approval');
  exactKeys(decision.approval.source, ['kind', 'quote', 'originalMessageIdOrUrl', 'contextVerified'], 'Batch approval source');
  exactKeys(decision.approvedScope, ['repository', 'baselineRef', 'baselineHead', 'surfaces', 'fields', 'nameLabelStatus', 'officialKrProvenanceStatus', 'canonicalSources', 'heroes', 'preservedPopulations', 'excluded'], 'Batch approved scope');
  exactKeys(decision.approvedScope.canonicalSources, Object.keys(sourceHashes), 'Batch Canonical sources');
  for (const [key, path] of Object.entries(sourcePaths)) {
    exactKeys(decision.approvedScope.canonicalSources[key], ['path', 'sha256'], `${key} source`);
    if (decision.approvedScope.canonicalSources[key].path !== path || decision.approvedScope.canonicalSources[key].sha256 !== sourceHashes[key]) throw new Error(`Batch ${key} source scope changed`);
  }
  exactKeys(decision.approvedScope.preservedPopulations, ['heroIndex', 'fullHeroDetail', 'exclusiveEquipmentNavigation', 'minimalDetailBefore', 'minimalDetailAfter'], 'Batch preserved populations');
  exactKeys(decision.effect, ['effective', 'condition', 'reviewWhen'], 'Batch decision effect');
  const scope = decision.approvedScope;
  const expectedHeroes = HERO_MINIMAL_DETAIL_BATCH.map(({ heroId, nameKo, equipmentId, equipmentNameKo }) => ({
    heroId, nameKo, equipmentId, equipmentNameKo, detailSurface: 'HERO_MINIMAL_DETAIL',
    detailFragment: `hero-minimal-detail-${heroId}`,
    heroIndexTarget: { surface: 'HERO_MINIMAL_DETAIL', fragment: `hero-minimal-detail-${heroId}` },
    equipmentPreviousTarget: { surface: 'HERO_INDEX', fragment: `hero-index-entry-${heroId}` },
    equipmentTarget: { surface: 'HERO_MINIMAL_DETAIL', fragment: `hero-minimal-detail-${heroId}` },
  }));
  if (decision.schemaVersion !== 1 || decision.decisionType !== 'FIVE_HERO_INTEGRATED_PUBLICATION' || decision.status !== 'APPROVED'
    || decision.approval.approverRole !== 'USER' || decision.approval.source.kind !== 'CURRENT_USER_MESSAGE'
    || decision.approval.source.quote !== '나는 `LuceatLuxVestra42/Langrisser-2nd-test`의 다음 5명에 대한 P-A·P-B·P-C 통합 Publication 전체를 직접 승인한다.'
    || decision.approval.source.originalMessageIdOrUrl !== 'NOT_AVAILABLE' || decision.approval.source.contextVerified !== true
    || decision.approval.recordedAtDate !== '2026-11-05'
    || scope.repository !== 'LuceatLuxVestra42/Langrisser-2nd-test' || scope.baselineRef !== 'main'
    || scope.baselineHead !== '4d20b4d32f77abd97dd1358df1f109b91bfbb1af'
    || JSON.stringify(scope.surfaces) !== JSON.stringify(['HERO_MINIMAL_DETAIL', 'HERO_INDEX_LIST', 'EXCLUSIVE_EQUIPMENT_LIST'])
    || JSON.stringify(scope.fields) !== JSON.stringify(MINIMAL_DETAIL_FIELDS)
    || scope.nameLabelStatus !== 'PROJECT_REVIEWED' || scope.officialKrProvenanceStatus !== 'unverified'
    || JSON.stringify(scope.heroes) !== JSON.stringify(expectedHeroes)
    || JSON.stringify(scope.preservedPopulations) !== JSON.stringify({ heroIndex: 267, fullHeroDetail: 29, exclusiveEquipmentNavigation: 167, minimalDetailBefore: 2, minimalDetailAfter: 7 })
    || JSON.stringify(scope.excluded) !== JSON.stringify(['New Semantic Admission', 'Canonical or Evidence mutation', 'Legacy Repository mutation', 'Other Hero publication changes', 'Other Equipment target changes', 'Rarity', 'Faction', 'Production', 'Job', 'Soldier', 'Talent', 'Skill', 'Portrait or Asset', 'Unverified statistics'])
    || decision.effect.effective !== true
    || decision.effect.condition !== 'Only the five exact approved Hero and Equipment pairs, fields, and targets may change; Hero 15 and 16 remain unchanged and all other approved populations and targets are preserved.'
    || decision.effect.reviewWhen !== 'Re-review if an approved ID, field, Canonical source, surface, target, or preserved population changes.') throw new Error('Five-Hero integrated Publication approval or exact scope is invalid');
  return decision;
}

export function renderHeroMinimalDetailBatch({ decision, heroIdentities, heroLocalizations, relations, equipmentIdentities, equipmentLocalizations, sourceHashes: actualHashes }) {
  validateHeroMinimalDetailBatchPublication(decision);
  exactKeys(actualHashes, Object.keys(sourceHashes), 'Batch Canonical source hashes');
  for (const [key, expected] of Object.entries(sourceHashes)) if (actualHashes[key] !== expected) throw new Error(`Batch Canonical source hash changed: ${key}`);
  for (const [value, label] of [[heroIdentities, 'Hero Identity'], [heroLocalizations, 'Hero Localization'], [relations, 'Hero-Equipment relation'], [equipmentIdentities, 'Equipment Identity'], [equipmentLocalizations, 'Equipment Localization']]) {
    if (value?.schemaVersion !== 1 || !Array.isArray(value.records)) throw new Error(`Unsupported ${label} input`);
  }
  const one = (rows, predicate, label) => {
    const matches = rows.filter(predicate);
    if (matches.length !== 1) throw new Error(`${label} must resolve exactly once`);
    return matches[0];
  };
  const heroes = HERO_MINIMAL_DETAIL_BATCH.map((approved) => {
    one(heroIdentities.records, ({ heroId }) => heroId === approved.heroId, `Hero ${approved.heroId} Identity`);
    const localization = one(heroLocalizations.records, ({ heroId }) => heroId === approved.heroId, `Hero ${approved.heroId} Localization`);
    if (localization.nameKo !== approved.nameKo) throw new Error(`Hero ${approved.heroId} Korean name differs from approved display label`);
    one(relations.records, ({ heroId, equipmentId }) => heroId === approved.heroId && equipmentId === approved.equipmentId, `Hero ${approved.heroId} approved relation`);
    if (relations.records.filter(({ heroId }) => heroId === approved.heroId).length !== 1 || relations.records.filter(({ equipmentId }) => equipmentId === approved.equipmentId).length !== 1) throw new Error(`Hero ${approved.heroId} relation endpoints are not unique`);
    one(equipmentIdentities.records, ({ equipmentId }) => equipmentId === approved.equipmentId, `Equipment ${approved.equipmentId} Identity`);
    const equipment = one(equipmentLocalizations.records, ({ equipmentId }) => equipmentId === approved.equipmentId, `Equipment ${approved.equipmentId} Localization`);
    if (equipment.nameKo !== approved.equipmentNameKo || !equipment.effectDescriptionKo?.trim()) throw new Error(`Equipment ${approved.equipmentId} localization differs from approved presentation`);
    return { heroId: approved.heroId, nameKo: localization.nameKo, exclusiveEquipment: { equipmentId: approved.equipmentId, nameKo: equipment.nameKo, effectDescriptionKo: equipment.effectDescriptionKo } };
  });
  return `${JSON.stringify({ schemaVersion: 1, heroes }, null, 2)}\n`;
}

export function validateHeroMinimalDetailBatch({ generatedText, inputs }) {
  const expected = renderHeroMinimalDetailBatch(inputs);
  if (generatedText !== expected) throw new Error('Generated five-Hero Minimal Detail Consumer is stale or non-deterministic');
  const data = JSON.parse(generatedText);
  exactKeys(data, ['schemaVersion', 'heroes'], 'Generated batch Consumer');
  if (data.schemaVersion !== 1 || data.heroes.length !== 5 || JSON.stringify(data.heroes.map(({ heroId }) => heroId)) !== JSON.stringify(HERO_MINIMAL_DETAIL_BATCH.map(({ heroId }) => heroId))) throw new Error('Generated batch population is invalid');
  for (const row of data.heroes) {
    exactKeys(row, ['heroId', 'nameKo', 'exclusiveEquipment'], `Hero ${row.heroId} batch row`);
    exactKeys(row.exclusiveEquipment, ['equipmentId', 'nameKo', 'effectDescriptionKo'], `Hero ${row.heroId} equipment`);
    if (!row.exclusiveEquipment.effectDescriptionKo.trim()) throw new Error(`Hero ${row.heroId} equipment effect is missing`);
  }
  return data;
}
