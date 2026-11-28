import { conditionPath, lianaHeartConditions } from './lance-heart-fetter.mjs';
import { isDeepStrictEqual as equal } from 'node:util';

export const fetterReferences = 'canonical/hero-fetter-references.v1.json';
export const fetterDetails = 'canonical/hero-fetter-raw-details.v1.json';
export const heartDetails = 'canonical/hero-heart-fetter-raw-details.v1.json';
export const lanceFetterEvidence = 'evidence/source/bonds/hero16-fetter-gold.v1.json';
export const lanceFetterDecision = 'docs/decisions/hero-16-minimal-fetter-gold-totals-publication.v1.json';

const hero = 'ConfigDataHeroInfo';
const info = 'ConfigDataHeroInformationInfo';
const regular = 'ConfigDataHeroFetterInfo';
const heart = 'ConfigDataHeroHeartFetterInfo';
const sources = [
  [hero, '728daab3370f0c7779449663ea02e638677944d4'],
  [info, '49aef6be8ea1a65d5725c16a05dab94fffa73f92'],
  [regular, '1beec024e3d82e57923e59c70048c5abefd92d06'],
  [heart, 'be61dd6fb14662d70335e833c4c857dda5105f74'],
];
const groups = [
  ['유대 1', 71, 70, 118600, [1500,2300,3500,5300,8000,12000,18000,27000,41000]],
  ['유대 2', 72, 71, 383500, [5000,7500,11000,17000,26000,39000,59000,89000,130000]],
  ['유대 3', 73, 72, 736000, [9000,14000,21000,32000,48000,72000,110000,170000,260000]],
  ['유대 4', 74, 73, 1186000, [15000,23000,35000,53000,80000,120000,180000,270000,410000]],
  ['유대 5', 75, 74, 1523000, [20000,30000,45000,68000,100000,150000,230000,350000,530000]],
  ['마음의 유대', 16, 14, 650000, [10000,15000,23000,35000,53000,74000,100000,140000,200000]],
];
const file = table => 'data/configdata/' + table + '.json';
function requireMatch(actual, expected, claim) {
  if (!equal(actual, expected)) throw new Error('Lance Fetter ' + claim + ' mismatch');
}
function expectedGroup(i) {
  const [labelKo, endpointId, recordIndex, total, gold] = groups[i];
  const isHeart = i === 5;
  const table = isHeart ? heart : regular;
  const kind = isHeart ? 'HEART_FETTER' : 'FETTER';
  const field = isHeart ? 'HeroHeartFetterId' : 'HeroFetters_ID';
  const endpointNamespace = table + '.ID';
  const recordLocator = file(table) + '#/' + recordIndex;
  const reference = {
    referenceKind: 'HERO_' + kind + '_ID_REFERENCE', heroId: 16, heroInformationId: 16,
    [isHeart ? 'heartFetterId' : 'fetterId']: endpointId, sourceField: info + '.' + field, endpointNamespace,
    provenance: lanceFetterEvidence + '#/information/fields/' + field + (isHeart ? '' : '/' + i),
  };
  const detail = { detailKind: kind + '_RAW_DETAIL', heroId: 16, endpointId, endpointNamespace,
    sourceRecordLocator: recordLocator, fields: { LevelUpGold: gold }, provenance: lanceFetterEvidence + '#/endpoints/' + i };
  return { labelKo, endpointId, kind, endpointNamespace, recordLocator, total, gold, reference, detail };
}
const expected = groups.map((_, i) => expectedGroup(i));
const suffix = ' Hero 16: explicit Fetter references and LevelUpGold only.';
const referenceScope = 'Hero 15 source-native ConfigData Fetter ID references only; not an admission of stages, completion/unlock conditions, rewards, stats, skills, battle effects, Korean localization, or publication.';
const detailScope = 'Hero 15 source-native raw Fetter detail fields only; excludes gameplay rules, endpoint identity admission, and publication.';

export function validateLianaReferenceRows(records) {
  const expected = [
    ...[66,67,68,69,70].map(fetterId => ['HERO_FETTER_ID_REFERENCE',15,15,fetterId,'ConfigDataHeroInformationInfo.HeroFetters_ID','ConfigDataHeroFetterInfo.ID','evidence/source/bonds/hero15-fetter-references.v1.json#claims/heroFetterReferences']),
    ['HERO_HEART_FETTER_ID_REFERENCE',15,15,15,'ConfigDataHeroInformationInfo.HeroHeartFetterId','ConfigDataHeroHeartFetterInfo.ID','evidence/source/bonds/hero15-fetter-references.v1.json#claims/heroHeartFetterReference']
  ];
  const actual = records.map(r => {
    const idField = r.referenceKind === 'HERO_FETTER_ID_REFERENCE' ? 'fetterId' : 'heartFetterId';
    requireMatch(Object.keys(r).sort(), ['referenceKind','heroId','heroInformationId',idField,'sourceField','endpointNamespace','provenance'].sort(), 'Liana reference fields');
    return [r.referenceKind,r.heroId,r.heroInformationId,r.fetterId ?? r.heartFetterId,r.sourceField,r.endpointNamespace,r.provenance];
  });
  requireMatch(actual, expected, 'Liana reference set, order or provenance');
}

// Each shared owner retains its original ordered Liana population and appends the Lance rows.
export function lianaFetterInput(path, document, root = process.cwd()) {
  if (path === conditionPath) return lianaHeartConditions(document, root);
  if (![fetterReferences, fetterDetails, heartDetails].includes(path)) return document;
  const scope = path === fetterReferences ? referenceScope : detailScope;
  const rows = path === fetterReferences ? expected.map(group => group.reference)
    : expected.filter(group => (group.kind === 'HEART_FETTER') === (path === heartDetails)).map(group => group.detail);
  requireMatch([document.schemaVersion, document.scope, document.records.length], [1, scope + suffix, rows.length * 2], 'shared owner scope');
  requireMatch(document.records.slice(rows.length), rows, 'shared owner Lance rows');
  const selected = document.records.slice(0, rows.length);
  if (path === fetterReferences) validateLianaReferenceRows(selected);
  return { ...document, scope, records: selected };
}

export async function readLanceFetterSource(readJson) {
  const [source, references, regularDetails, heartDetail] = await Promise.all(
    [lanceFetterEvidence, fetterReferences, fetterDetails, heartDetails].map(path => readJson(path)));
  requireMatch([source.schemaVersion, source.repository, source.commit],
    [1, 'LuceatLuxVestra42/langrisser-future-guide', '6475e63ee23d18adf733756c26a14fa9e3ed662c'], 'snapshot');
  for (const [table, gitBlobSha1] of sources) {
    requireMatch(source.sources[table.slice('ConfigData'.length)], { path: file(table), gitBlobSha1 }, 'source pin');
  }
  requireMatch([source.hero.locator, source.hero.fields.ID, source.hero.fields.HeroInformation_ID,
    source.information.locator, source.information.fields.ID], ['#/15',16,16,'#/15',16], 'Hero to HeroInformation FK');
  requireMatch(source.information.fields, { ID:16, HeroFetters_ID:[71,72,73,74,75], HeroHeartFetterId:16 }, 'source selection');
  requireMatch(source.endpoints.length, 6, 'source groups');
  const approved = expected.map((group, i) => {
    const { labelKo, endpointId, kind, endpointNamespace, recordLocator, gold } = group;
    const raw = source.endpoints[i];
    const claim = kind + ' ' + endpointId;
    requireMatch(references.records[6+i], group.reference, claim + ' reference');
    const detail = kind === 'HEART_FETTER' ? heartDetail.records[1] : regularDetails.records[5+i];
    requireMatch([raw.kind,raw.ID,raw.endpointNamespace,raw.recordLocator], [kind,endpointId,endpointNamespace,recordLocator], claim + ' source record');
    requireMatch(detail, group.detail, claim + ' detail');
    requireMatch(raw.LevelUpGold, gold, claim + ' source gold');
    requireMatch(raw.levels.length, 9, claim + ' level count');
    for (const [j, value] of detail.fields.LevelUpGold.entries()) {
      requireMatch(raw.levels[j], { kind, endpointNamespace, level:j+2, locator:recordLocator+'/LevelUpGold/'+j, gold:value }, claim + ' level locator');
    }
    const total = detail.fields.LevelUpGold.reduce((sum, value) => sum + value, 0);
    requireMatch(total, group.total, claim + ' total');
    return { labelKo, kind, endpointId, total, paragraph:labelKo+' · Lv.2~10 합계 골드 '+total.toLocaleString('ko-KR') };
  });
  for (const [path, doc] of [[fetterReferences,references],[fetterDetails,regularDetails],[heartDetails,heartDetail]]) lianaFetterInput(path, doc);
  return approved;
}

export function checkLianaRegularFetters(document, consumer) {
  const ids = [66,67,68,69,70];
  if (document.records.length !== ids.length || !document.records.every((row, i) => row.heroId === 15 && row.endpointId === ids[i]
      && row.sourceRecordLocator === 'ConfigDataHeroFetterInfo#ID=' + ids[i]
      && row.provenance === 'evidence/source/bonds/hero15-fetter-raw-details.v1.json#selection/records/' + i)) {
    throw new Error('Liana ' + consumer + ' Fetter attribution mismatch');
  }
}

export const bond1LevelDecisionPath = 'docs/decisions/hero-16-minimal-bond1-level-gold-publication.v1.json';

export function lanceBond1LevelLines(references, detail, levels, decision) {
  return lanceBondLevelLines(1, references, detail, levels, decision);
}

const levelPlacements = [
  'Closed details between the first and second bond totals, summary followed by one list.',
  'Closed details between the second and third bond totals, summary followed by one list.',
  'Closed details between the third and fourth bond totals, summary followed by one list.',
  'Closed details between the fourth and fifth bond totals, summary followed by one list.',
  'Closed details between the fifth bond total and the Heart Fetter total, summary followed by one list.',
];

export function lanceBondLevelLines(bond, references, detail, levels, decision) {
  const placement = levelPlacements[bond - 1];
  if (!placement) throw new Error('Unsupported Lance bond level disclosure');
  const label = 'bond ' + bond;
  const group = expected[bond - 1];
  const selected = references.records.filter(row => row.heroId === 16 && row.fetterId === group.endpointId);
  requireMatch(selected, [group.reference], label + ' selection reference');
  requireMatch(detail, group.detail, label + ' detail attribution');
  requireMatch(levels.length, group.gold.length, label + ' level count');
  const prefix = group.recordLocator + '/LevelUpGold/';
  requireMatch(levels.every(row => row.locator?.startsWith(prefix)), true, label + ' level evidence group');
  const rows = group.gold.map((gold, index) => {
    const level = index + 2;
    const row = levels[index];
    const claim = label + ' Lv.' + level;
    requireMatch([row.kind, row.endpointNamespace, row.level], [group.kind, group.endpointNamespace, level], claim + ' endpoint or level');
    requireMatch(row.locator, prefix + index, claim + ' source locator');
    requireMatch([row.gold, detail.fields.LevelUpGold[index]], [gold, gold], claim + ' evidence amount');
    return { level, gold, textKo: 'Lv.' + level + ' · ' + row.gold.toLocaleString('ko-KR') + ' 골드' };
  });
  requireMatch(rows.reduce((sum, row) => sum + row.gold, 0), group.total, label + ' level total');
  if (!decision) throw new Error('Lance Fetter ' + label + ' level decision missing');
  requireMatch(decision.status, 'APPROVED', label + ' level approval status');
  requireMatch([decision.schemaVersion, decision.heroId, decision.surface, decision.kind, decision.endpointId, decision.unit],
    [1, 16, 'hero-minimal-detail-16', 'FETTER', group.endpointId, 'gold'], label + ' level approval target');
  requireMatch(decision.targetLevels, [2,3,4,5,6,7,8,9,10], label + ' approved level order');
  requireMatch(decision.evidence, lanceFetterEvidence + '#/endpoints/' + (bond - 1) + '/levels', label + ' decision evidence path');
  requireMatch(decision.rows?.length, rows.length, label + ' approved row count');
  for (const [index, row] of rows.entries()) {
    requireMatch(decision.rows[index]?.gold, row.gold, label + ' approved Lv.' + row.level + ' amount');
  }
  requireMatch(decision.rows, rows, label + ' approved level rows');
  requireMatch([decision.summary, decision.placement], [group.labelKo + ' 레벨별 골드', placement], label + ' level placement');
  return rows.map(row => row.textKo);
}
