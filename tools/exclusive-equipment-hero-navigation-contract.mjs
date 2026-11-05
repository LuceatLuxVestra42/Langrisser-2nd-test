import { createHash } from 'node:crypto';
import { HERO_15_MINIMAL_DETAIL_FRAGMENT, validateHero15IntegratedPublication } from './hero-15-integrated-publication-contract.mjs';
import { HERO_16_MINIMAL_DETAIL_FRAGMENT, validateHero16IntegratedPublication } from './hero-16-integrated-publication-contract.mjs';
import { HERO_MINIMAL_DETAIL_BATCH, validateHeroMinimalDetailBatchPublication } from './hero-minimal-detail-batch-contract.mjs';
import { HERO_MINIMAL_DETAIL_TEN_BATCH, validateHeroMinimalDetailBatchPublication as validateHeroMinimalDetailTenBatchPublication } from './hero-minimal-detail-ten-batch-contract.mjs';
import { HERO_MINIMAL_DETAIL_TWENTY_BATCH, validateHeroMinimalDetailTwentyBatchPublication } from './hero-minimal-detail-twenty-batch-contract.mjs';
import { HERO_MINIMAL_DETAIL_THIRTY_BATCH, validateHeroMinimalDetailThirtyBatchPublication } from './hero-minimal-detail-thirty-batch-contract.mjs';

export const EXCLUSIVE_EQUIPMENT_HERO_PUBLICATION_PATH = 'docs/decisions/exclusive-equipment-hero-navigation-publication.v1.json';
export const EXCLUSIVE_EQUIPMENT_HERO_NAVIGATION_PATH = 'generated/exclusive-equipment-hero-navigation.v1.json';

const exactKeys = (value, keys, label) => {
  if (!value || JSON.stringify(Object.keys(value).sort()) !== JSON.stringify([...keys].sort())) {
    throw new Error(`${label} has unexpected or missing fields`);
  }
};
const sha256 = (value) => createHash('sha256').update(value).digest('hex');

export function renderExclusiveEquipmentHeroNavigation({ relations, equipmentIdentities, heroIdentities, heroLocalizations, heroSlice, heroIndexPublication, publicationDecision, integratedPublicationDecision, hero16IntegratedPublicationDecision, heroMinimalDetailBatchPublicationDecision, heroMinimalDetailTenBatchPublicationDecision, heroMinimalDetailTwentyBatchPublicationDecision, heroMinimalDetailThirtyBatchPublicationDecision, heroLocalizationSha256, heroIdentitySha256 }) {
  if (relations?.schemaVersion !== 1 || !Array.isArray(relations.records)
    || equipmentIdentities?.schemaVersion !== 1 || !Array.isArray(equipmentIdentities.records)
    || heroIdentities?.schemaVersion !== 1 || !Array.isArray(heroIdentities.records)
    || heroLocalizations?.schemaVersion !== 1 || !Array.isArray(heroLocalizations.records)
    || heroSlice?.schemaVersion !== 1 || !Array.isArray(heroSlice.heroes)
    || heroIndexPublication?.status !== 'APPROVED'
    || publicationDecision?.schemaVersion !== 1
    || publicationDecision?.decisionType !== 'EXCLUSIVE_EQUIPMENT_HERO_NAVIGATION_PUBLICATION'
    || publicationDecision?.status !== 'APPROVED') throw new Error('Exclusive Equipment Hero publication inputs are unsupported');
  validateHero15IntegratedPublication(integratedPublicationDecision);
  validateHero16IntegratedPublication(hero16IntegratedPublicationDecision);
  validateHeroMinimalDetailBatchPublication(heroMinimalDetailBatchPublicationDecision);
  validateHeroMinimalDetailTenBatchPublication(heroMinimalDetailTenBatchPublicationDecision);
  validateHeroMinimalDetailTwentyBatchPublication(heroMinimalDetailTwentyBatchPublicationDecision);
  validateHeroMinimalDetailThirtyBatchPublication(heroMinimalDetailThirtyBatchPublicationDecision);

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
  const approvedIndexIds = new Set([...relationHeroIds].filter((id) => !detailIds.has(id)));
  if (scope.detailHeroIds.length !== 29 || scope.indexHeroIds.length !== 138
    || JSON.stringify(scope.detailHeroIds) !== JSON.stringify([...detailIds].sort((a, b) => a - b))
    || JSON.stringify(scope.indexHeroIds) !== JSON.stringify([...approvedIndexIds].sort((a, b) => a - b))) {
    throw new Error('Exclusive Equipment Hero navigation target populations differ from approved Hero Index policy');
  }
  const approvedPairs = new Set(scope.relations.map(({ heroId, equipmentId }) => `${heroId}:${equipmentId}`));
  const detailEquipmentByHero = new Map(heroSlice.heroes.map(({ id, exclusiveEquipment }) => [id, exclusiveEquipment?.equipmentId]));
  const minimalTargetByHero = new Map([
    [15, { equipmentId: 535, fragment: HERO_15_MINIMAL_DETAIL_FRAGMENT }],
    [16, { equipmentId: 418, fragment: HERO_16_MINIMAL_DETAIL_FRAGMENT }],
    ...HERO_MINIMAL_DETAIL_BATCH.map(({ heroId, equipmentId }) => [heroId, { equipmentId, fragment: `hero-minimal-detail-${heroId}` }]),
    ...HERO_MINIMAL_DETAIL_TEN_BATCH.map(({ heroId, equipmentId }) => [heroId, { equipmentId, fragment: `hero-minimal-detail-${heroId}` }]),
    ...HERO_MINIMAL_DETAIL_TWENTY_BATCH.map(({ heroId, equipmentId }) => [heroId, { equipmentId, fragment: `hero-minimal-detail-${heroId}` }]),
    ...HERO_MINIMAL_DETAIL_THIRTY_BATCH.map(({ heroId, equipmentId }) => [heroId, { equipmentId, fragment: `hero-minimal-detail-${heroId}` }]),
  ]);
  const minimalHeroIds = new Set(minimalTargetByHero.keys());
  const currentIndexIds = new Set(scope.indexHeroIds);
  const indexIds = new Set([...currentIndexIds].filter((id) => !minimalHeroIds.has(id)));
  if (minimalHeroIds.size !== 67 || indexIds.size !== 71 || [...minimalHeroIds].some((id) => !currentIndexIds.has(id))) {
    throw new Error('Approved Hero Index population must retain 67 minimal detail Heroes and 71 remaining equipment Index targets');
  }
  const seen = new Set();
  const records = pairs.sort((a, b) => a.equipmentId - b.equipmentId).map(({ equipmentId, heroId }) => {
    const pair = `${heroId}:${equipmentId}`;
    if (!approvedPairs.has(pair) || seen.has(pair)) throw new Error(`Unapproved or duplicate Exclusive Equipment Hero relation ${pair}`);
    seen.add(pair);
    if (!heroIdSet.has(heroId) || !approvedHeroIds.has(heroId) || !nameById.has(heroId)) throw new Error(`Unresolved or unpublished Hero endpoint ${heroId}`);
    if (minimalTargetByHero.has(heroId)) {
      const target = minimalTargetByHero.get(heroId);
      if (target.equipmentId !== equipmentId) throw new Error(`Approved minimal detail Hero ${heroId} does not match Equipment ${equipmentId}`);
      return { equipmentId, heroId, heroNameKo: nameById.get(heroId), navigationTarget: { surface: 'HERO_MINIMAL_DETAIL', fragment: target.fragment } };
    }
    if (detailIds.has(heroId)) {
      if (detailEquipmentByHero.get(heroId) !== equipmentId) throw new Error(`Approved Hero Detail endpoint ${heroId} does not own Equipment ${equipmentId} in the existing slice`);
      return { equipmentId, heroId, heroNameKo: nameById.get(heroId), navigationTarget: { surface: 'HERO_DETAIL', fragment: `hero-${heroId}` } };
    }
    if (indexIds.has(heroId)) return { equipmentId, heroId, heroNameKo: nameById.get(heroId), navigationTarget: { surface: 'HERO_INDEX', fragment: `hero-index-entry-${heroId}` } };
    throw new Error(`Hero ${heroId} has no approved navigation target`);
  });
  const expectedMinimalTargets = [
    [276,18,'hero-minimal-detail-18'],[281,20,'hero-minimal-detail-20'],[286,30,'hero-minimal-detail-30'],[293,51,'hero-minimal-detail-51'],[297,34,'hero-minimal-detail-34'],[405,17,'hero-minimal-detail-17'],[411,39,'hero-minimal-detail-39'],[413,61,'hero-minimal-detail-61'],[414,36,'hero-minimal-detail-36'],[417,88,'hero-minimal-detail-88'],[418,16,HERO_16_MINIMAL_DETAIL_FRAGMENT],[423,58,'hero-minimal-detail-58'],[424,59,'hero-minimal-detail-59'],[425,35,'hero-minimal-detail-35'],[426,92,'hero-minimal-detail-92'],[427,62,'hero-minimal-detail-62'],[429,49,'hero-minimal-detail-49'],[434,31,'hero-minimal-detail-31'],[435,87,'hero-minimal-detail-87'],[437,65,'hero-minimal-detail-65'],[438,95,'hero-minimal-detail-95'],[439,64,'hero-minimal-detail-64'],[440,94,'hero-minimal-detail-94'],[441,21,'hero-minimal-detail-21'],[448,97,'hero-minimal-detail-97'],[452,63,'hero-minimal-detail-63'],[453,91,'hero-minimal-detail-91'],[455,38,'hero-minimal-detail-38'],[460,96,'hero-minimal-detail-96'],[464,66,'hero-minimal-detail-66'],[472,57,'hero-minimal-detail-57'],[476,98,'hero-minimal-detail-98'],[479,93,'hero-minimal-detail-93'],[490,54,'hero-minimal-detail-54'],[535,15,HERO_15_MINIMAL_DETAIL_FRAGMENT],[540,99,'hero-minimal-detail-99'],[549,100,'hero-minimal-detail-100'],[449,111,'hero-minimal-detail-111'],[450,127,'hero-minimal-detail-127'],[451,103,'hero-minimal-detail-103'],[454,121,'hero-minimal-detail-121'],[461,116,'hero-minimal-detail-116'],[463,101,'hero-minimal-detail-101'],[467,125,'hero-minimal-detail-125'],[473,120,'hero-minimal-detail-120'],[475,110,'hero-minimal-detail-110'],[477,102,'hero-minimal-detail-102'],[478,115,'hero-minimal-detail-115'],[484,126,'hero-minimal-detail-126'],[485,114,'hero-minimal-detail-114'],[486,123,'hero-minimal-detail-123'],[487,106,'hero-minimal-detail-106'],[489,109,'hero-minimal-detail-109'],[495,99161,'hero-minimal-detail-99161'],[496,118,'hero-minimal-detail-118'],[497,105,'hero-minimal-detail-105'],[498,99162,'hero-minimal-detail-99162'],[499,108,'hero-minimal-detail-108'],[500,99163,'hero-minimal-detail-99163'],[501,112,'hero-minimal-detail-112'],[502,122,'hero-minimal-detail-122'],[507,113,'hero-minimal-detail-113'],[508,104,'hero-minimal-detail-104'],[512,130,'hero-minimal-detail-130'],[519,124,'hero-minimal-detail-124'],[520,129,'hero-minimal-detail-129'],[526,119,'hero-minimal-detail-119'],
  ].sort((a,b) => a[0] - b[0]);
  if (records.filter(({ navigationTarget }) => navigationTarget.surface === 'HERO_DETAIL').length !== 29
    || records.filter(({ navigationTarget }) => navigationTarget.surface === 'HERO_INDEX').length !== 71
    || records.filter(({ navigationTarget }) => navigationTarget.surface === 'HERO_MINIMAL_DETAIL').length !== 67
    || records.find(({ equipmentId }) => equipmentId === 535)?.navigationTarget.fragment !== HERO_15_MINIMAL_DETAIL_FRAGMENT
    || records.find(({ equipmentId }) => equipmentId === 418)?.navigationTarget.fragment !== HERO_16_MINIMAL_DETAIL_FRAGMENT
    || JSON.stringify(records.filter(({ navigationTarget }) => navigationTarget.surface === 'HERO_MINIMAL_DETAIL').map(({ equipmentId, heroId, navigationTarget }) => [equipmentId, heroId, navigationTarget.fragment]))
      !== JSON.stringify(expectedMinimalTargets)) {
    throw new Error('Exclusive Equipment Hero target counts must be 29 detail, 71 Index, and exactly sixty-seven approved minimal details');
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
