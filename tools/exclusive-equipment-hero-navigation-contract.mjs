import { createHash } from 'node:crypto';

export const EXCLUSIVE_EQUIPMENT_HERO_PUBLICATION_PATH = 'docs/decisions/exclusive-equipment-hero-navigation-publication.v1.json';
export const EXCLUSIVE_EQUIPMENT_HERO_NAVIGATION_PATH = 'generated/exclusive-equipment-hero-navigation.v1.json';

const exactKeys = (value, keys, label) => {
  if (!value || JSON.stringify(Object.keys(value).sort()) !== JSON.stringify([...keys].sort())) {
    throw new Error(`${label} has unexpected or missing fields`);
  }
};
const sha256 = (value) => createHash('sha256').update(value).digest('hex');

export function renderExclusiveEquipmentHeroNavigation({ relations, equipmentIdentities, heroIdentities, heroLocalizations, heroSlice, heroIndexPublication, publicationDecision, heroLocalizationSha256, heroIdentitySha256 }) {
  if (relations?.schemaVersion !== 1 || !Array.isArray(relations.records)
    || equipmentIdentities?.schemaVersion !== 1 || !Array.isArray(equipmentIdentities.records)
    || heroIdentities?.schemaVersion !== 1 || !Array.isArray(heroIdentities.records)
    || heroLocalizations?.schemaVersion !== 1 || !Array.isArray(heroLocalizations.records)
    || heroSlice?.schemaVersion !== 1 || !Array.isArray(heroSlice.heroes)
    || heroIndexPublication?.status !== 'APPROVED'
    || publicationDecision?.schemaVersion !== 1
    || publicationDecision?.decisionType !== 'EXCLUSIVE_EQUIPMENT_HERO_NAVIGATION_PUBLICATION'
    || publicationDecision?.status !== 'APPROVED') throw new Error('Exclusive Equipment Hero publication inputs are unsupported');

  exactKeys(publicationDecision, ['schemaVersion', 'decisionType', 'status', 'approvedScope', 'approval', 'effect'], 'Exclusive Equipment Hero decision');
  const scope = publicationDecision.approvedScope;
  exactKeys(scope, ['repository', 'baselineRef', 'baselineHead', 'relationPath', 'relationSha256', 'relations', 'surface', 'fields', 'detailHeroIds', 'indexHeroIds', 'nameLabelStatus', 'officialKrProvenanceStatus', 'heroLocalizationPath', 'heroLocalizationSha256', 'heroIdentityPath', 'heroIdentitySha256', 'excluded'], 'Exclusive Equipment Hero approved scope');
  exactKeys(publicationDecision.approval, ['approverRole', 'source', 'recordedAtDate'], 'Exclusive Equipment Hero approval');
  exactKeys(publicationDecision.approval.source, ['kind', 'quote', 'attachmentName', 'attachmentSha256', 'originalMessageIdOrUrl', 'contextVerified'], 'Exclusive Equipment Hero approval source');
  exactKeys(publicationDecision.effect, ['effective', 'condition', 'reviewWhen'], 'Exclusive Equipment Hero effect');

  const expectedScope = {
    repository: 'LuceatLuxVestra42/Langrisser-2nd-test', baselineRef: 'main',
    relationPath: 'canonical/hero-exclusive-equipment-relations.v1.json',
    heroLocalizationPath: 'canonical/hero-localizations-ko.v1.json',
    heroLocalizationSha256: '7f0ca08eb578dd2d1fcf9aa44eb825c49f7e415faeedd2fffa4b604d2c4ab299',
    heroIdentityPath: 'canonical/hero-identities.v1.json',
    heroIdentitySha256: '6cb710d09df61cbc31d2021fd41b9e1e1b5899377991d14af7a4a5d89e7fe11c',
    surface: 'EXCLUSIVE_EQUIPMENT_LIST', fields: ['equipmentId', 'heroId', 'heroNameKo', 'navigationTarget'],
    nameLabelStatus: 'PROJECT_REVIEWED', officialKrProvenanceStatus: 'unverified',
  };
  for (const [key, value] of Object.entries(expectedScope)) {
    if (JSON.stringify(scope[key]) !== JSON.stringify(value)) throw new Error(`Exclusive Equipment Hero publication ${key} is out of scope`);
  }
  if (heroLocalizationSha256 !== scope.heroLocalizationSha256 || heroIdentitySha256 !== scope.heroIdentitySha256) {
    throw new Error('Exclusive Equipment Hero publication name or identity source differs from the approved baseline');
  }
  if (JSON.stringify(scope.excluded) !== JSON.stringify([
    'New Semantic Claim', 'New Hero Identity', 'New Exclusive Equipment Identity', 'New Hero–Exclusive Equipment relation',
    'New Hero Detail endpoint', 'Stats, Skill, or Talent expansion', 'Localization admission change',
    'Asset admission change', 'Release status',
  ])) throw new Error('Exclusive Equipment Hero publication exclusions are invalid');
  if (scope.baselineHead !== '47803aa0455a55e3af8c88c347e7aac82bbae30b'
    || sha256(`${JSON.stringify(relations, null, 2)}\n`) !== scope.relationSha256
    || scope.relationSha256 !== 'a0aa17178c04456482018d3b166baa176224a8562b713fb5f583f2b5a113ba01') {
    throw new Error('Exclusive Equipment Hero publication relation source differs from the approved baseline');
  }
  if (publicationDecision.approval.approverRole !== 'USER' || publicationDecision.approval.source.kind !== 'USER_PROVIDED_SCREENSHOT'
    || publicationDecision.approval.source.quote !== '승인해 다음 명령어 작성해줘'
    || publicationDecision.approval.source.attachmentName !== '스크린샷 2026-11-03 221559.png'
    || publicationDecision.approval.source.attachmentSha256 !== '438935b78b9f03569f6c4e2fb7dcb4027c2597eeb002874c34e9e89a7616775d'
    || publicationDecision.approval.source.originalMessageIdOrUrl !== 'NOT_AVAILABLE'
    || publicationDecision.approval.source.contextVerified !== true
    || publicationDecision.approval.recordedAtDate !== '2026-11-03'
    || publicationDecision.effect.effective !== true
    || publicationDecision.effect.condition !== 'Only the exact approved Relation pairs, fields, and EXCLUSIVE_EQUIPMENT_LIST surface may be published.'
    || publicationDecision.effect.reviewWhen !== 'Review if Relation source hash, approved IDs, navigation policy, localization status, or publication surface changes.') {
    throw new Error('Exclusive Equipment Hero publication approval evidence is invalid');
  }

  const pairs = relations.records.map(({ equipmentId, heroId }) => ({ equipmentId, heroId }));
  const equipmentIdSet = new Set(equipmentIdentities.records.map(({ equipmentId }) => equipmentId));
  if (pairs.length !== 167 || new Set(pairs.map(({ equipmentId }) => equipmentId)).size !== 167
    || new Set(pairs.map(({ heroId, equipmentId }) => `${heroId}:${equipmentId}`)).size !== 167
    || pairs.some(({ equipmentId }) => !equipmentIdSet.has(equipmentId))
    || JSON.stringify(scope.relations) !== JSON.stringify(pairs)) {
    throw new Error('Approved Exclusive Equipment Hero relation set must exactly match all 167 current Canonical pairs');
  }
  const heroIdSet = new Set(heroIdentities.records.map(({ heroId }) => heroId));
  const nameById = new Map();
  for (const row of heroLocalizations.records) {
    if (!Number.isSafeInteger(row.heroId) || typeof row.nameKo !== 'string' || !row.nameKo.trim() || nameById.has(row.heroId)) {
      throw new Error('Hero localization contains malformed or duplicate rows');
    }
    nameById.set(row.heroId, row.nameKo);
  }
  const approvedHeroIds = new Set(heroIndexPublication.approvedScope.heroIds);
  const detailIds = new Set(heroIndexPublication.approvedScope.detailHeroIds);
  const relationHeroIds = new Set(relations.records.map(({ heroId }) => heroId));
  const indexIds = new Set([...relationHeroIds].filter((id) => !detailIds.has(id)));
  if (scope.detailHeroIds.length !== 29 || scope.indexHeroIds.length !== 138
    || JSON.stringify(scope.detailHeroIds) !== JSON.stringify([...detailIds].sort((a, b) => a - b))
    || JSON.stringify(scope.indexHeroIds) !== JSON.stringify([...indexIds].sort((a, b) => a - b))) {
    throw new Error('Exclusive Equipment Hero navigation target populations differ from approved Hero Index policy');
  }
  const approvedPairs = new Set(scope.relations.map(({ heroId, equipmentId }) => `${heroId}:${equipmentId}`));
  const detailEquipmentByHero = new Map(heroSlice.heroes.map(({ id, exclusiveEquipment }) => [id, exclusiveEquipment?.equipmentId]));
  const seen = new Set();
  const records = pairs.sort((a, b) => a.equipmentId - b.equipmentId).map(({ equipmentId, heroId }) => {
    const pair = `${heroId}:${equipmentId}`;
    if (!approvedPairs.has(pair) || seen.has(pair)) throw new Error(`Unapproved or duplicate Exclusive Equipment Hero relation ${pair}`);
    seen.add(pair);
    if (!heroIdSet.has(heroId) || !approvedHeroIds.has(heroId) || !nameById.has(heroId)) throw new Error(`Unresolved or unpublished Hero endpoint ${heroId}`);
    if (detailIds.has(heroId)) {
      if (detailEquipmentByHero.get(heroId) !== equipmentId) throw new Error(`Approved Hero Detail endpoint ${heroId} does not own Equipment ${equipmentId} in the existing slice`);
      return { equipmentId, heroId, heroNameKo: nameById.get(heroId), navigationTarget: { surface: 'HERO_DETAIL', fragment: `hero-${heroId}` } };
    }
    if (indexIds.has(heroId)) return { equipmentId, heroId, heroNameKo: nameById.get(heroId), navigationTarget: { surface: 'HERO_INDEX', fragment: `hero-index-entry-${heroId}` } };
    throw new Error(`Hero ${heroId} has no approved navigation target`);
  });
  if (records.filter(({ navigationTarget }) => navigationTarget.surface === 'HERO_DETAIL').length !== 29
    || records.filter(({ navigationTarget }) => navigationTarget.surface === 'HERO_INDEX').length !== 138) {
    throw new Error('Exclusive Equipment Hero target counts must remain 29 detail and 138 index');
  }
  return `${JSON.stringify({ schemaVersion: 1, consumer: 'exclusive-equipment-hero-navigation', records }, null, 2)}\n`;
}

export function validateExclusiveEquipmentHeroNavigation({ generatedText, inputs }) {
  const expected = renderExclusiveEquipmentHeroNavigation(inputs);
  if (generatedText !== expected) throw new Error('Generated Exclusive Equipment Hero Navigation is stale or non-deterministic');
  const generated = JSON.parse(generatedText);
  exactKeys(generated, ['schemaVersion', 'consumer', 'records'], 'Generated Exclusive Equipment Hero Navigation');
  if (generated.schemaVersion !== 1 || generated.consumer !== 'exclusive-equipment-hero-navigation'
    || generated.records.length !== 167) throw new Error('Generated Exclusive Equipment Hero Navigation schema or count mismatch');
  for (const row of generated.records) {
    exactKeys(row, ['equipmentId', 'heroId', 'heroNameKo', 'navigationTarget'], `Navigation row ${row.equipmentId}`);
    exactKeys(row.navigationTarget, ['surface', 'fragment'], `Navigation target ${row.equipmentId}`);
    if (typeof row.heroNameKo !== 'string' || !row.heroNameKo.trim()) throw new Error(`Missing Hero Korean display name ${row.heroId}`);
  }
  return generated;
}
