import { createHash } from 'node:crypto';

export const HERO_MINIMAL_DETAIL_THIRTY_ONE_BATCH_PUBLICATION_PATH = 'docs/decisions/hero-minimal-detail-thirty-one-batch-integrated-publication.v1.json';
export const HERO_MINIMAL_DETAIL_THIRTY_ONE_BATCH_PATH = 'generated/hero-minimal-detail-thirty-one-batch.v1.json';
export const HERO_MINIMAL_DETAIL_THIRTY_ONE_BATCH = [
  { heroId: 99164, nameKo: "베르너 폰 에길", equipmentId: 534, equipmentNameKo: "은빛 바람의 망토", nameCn: "维尔纳", nameSourceLine: 173 },
  { heroId: 99165, nameKo: "마리안델", equipmentId: 510, equipmentNameKo: "세계수의 꽃웃음", nameCn: "玛丽安蒂尔", nameSourceLine: 174 },
  { heroId: 99166, nameKo: "웨탐", equipmentId: 539, equipmentNameKo: "악마 우두머리", nameCn: "维坦", nameSourceLine: 175 },
  { heroId: 99167, nameKo: "리사", equipmentId: 511, equipmentNameKo: "유령 대장", nameCn: "丽莎", nameSourceLine: 176 },
  { heroId: 99168, nameKo: "엘마", equipmentId: 537, equipmentNameKo: "경건한 축하", nameCn: "艾尔玛", nameSourceLine: 177 },
  { heroId: 99169, nameKo: "켈티스", equipmentId: 509, equipmentNameKo: "초혼의 모자", nameCn: "凯尔蒂斯", nameSourceLine: 178 },
  { heroId: 99170, nameKo: "로비나 대제", equipmentId: 513, equipmentNameKo: "호령의 칼날", nameCn: "洛维奈尔大帝", nameSourceLine: 179 },
  { heroId: 99171, nameKo: "방주의 성녀", equipmentId: 514, equipmentNameKo: "여명의 왕관", nameCn: "方舟圣女", nameSourceLine: 180 },
  { heroId: 99172, nameKo: "크림조의 집정관", equipmentId: 524, equipmentNameKo: "우주전함의 결의", nameCn: "月之执政官", nameSourceLine: 181 },
  { heroId: 99173, nameKo: "아이언 챈슬러", equipmentId: 538, equipmentNameKo: "검붉은 의지", nameCn: "铁血总帅", nameSourceLine: 182 },
  { heroId: 99174, nameKo: "아즈사", equipmentId: 533, equipmentNameKo: "낭월청진", nameCn: "梓", nameSourceLine: 183 },
  { heroId: 99175, nameKo: "오보로", equipmentId: 536, equipmentNameKo: "영혼이 깃든 법상", nameCn: "胧", nameSourceLine: 184 },
  { heroId: 99176, nameKo: "캐롤리안", equipmentId: 521, equipmentNameKo: "역행의 투구", nameCn: "卡洛莉安", nameSourceLine: 185 },
  { heroId: 99177, nameKo: "카구야", equipmentId: 523, equipmentNameKo: "꿈의 달빛", nameCn: "辉夜", nameSourceLine: 186 },
  { heroId: 99178, nameKo: "아사멜", equipmentId: 532, equipmentNameKo: "타오르는 북극성", nameCn: "亚莎梅尔", nameSourceLine: 187 },
  { heroId: 99179, nameKo: "로스탐", equipmentId: 547, equipmentNameKo: "뜨거운 모래바람", nameCn: "洛斯塔姆", nameSourceLine: 188 },
  { heroId: 99180, nameKo: "방랑투사", equipmentId: 525, equipmentNameKo: "방랑의 상처", nameCn: "漂逐斗客", nameSourceLine: 189 },
  { heroId: 99181, nameKo: "줄리안", equipmentId: 551, equipmentNameKo: "처형자의 침묵", nameCn: "朱利安", nameSourceLine: 190 },
  { heroId: 99182, nameKo: "리키", equipmentId: 531, equipmentNameKo: "진정한 영웅", nameCn: "里奇", nameSourceLine: 191 },
  { heroId: 99183, nameKo: "마크렌", equipmentId: 550, equipmentNameKo: "메카파츠", nameCn: "马库雷", nameSourceLine: 192 },
  { heroId: 99184, nameKo: "빛의 수호사도", equipmentId: 559, equipmentNameKo: "잿불의 수호", nameCn: "光佑使徒", nameSourceLine: 193 },
  { heroId: 99185, nameKo: "아단켈모", equipmentId: 560, equipmentNameKo: "아득한 수수께끼", nameCn: "亚德凯摩", nameSourceLine: 194 },
  { heroId: 99186, nameKo: "빛과 그림자 검의 영혼", equipmentId: 568, equipmentNameKo: "엇갈린 숙명", nameCn: "光影剑魄", nameSourceLine: 195 },
  { heroId: 99187, nameKo: "껍질 소녀", equipmentId: 548, equipmentNameKo: "소스 코어", nameCn: "壳中少女", nameSourceLine: 196 },
  { heroId: 99188, nameKo: "리오벡", equipmentId: 546, equipmentNameKo: "세월의 연못", nameCn: "里奥贝克", nameSourceLine: 197 },
  { heroId: 99189, nameKo: "시엔", equipmentId: 545, equipmentNameKo: "도사리는 어둠", nameCn: "席恩", nameSourceLine: 198 },
  { heroId: 99190, nameKo: "폴리알", equipmentId: 569, equipmentNameKo: "선령의 속삭임", nameCn: "波莉阿鲁", nameSourceLine: 199 },
  { heroId: 99191, nameKo: "루그너", equipmentId: 552, equipmentNameKo: "신자의 면류관", nameCn: "卢古耐尔", nameSourceLine: 200 },
  { heroId: 99192, nameKo: "그렌실", equipmentId: 570, equipmentNameKo: "겨울 서리의 오만", nameCn: "格伦希尔", nameSourceLine: 201 },
  { heroId: 99193, nameKo: "요아&코니", equipmentId: 557, equipmentNameKo: "Y자 비주얼 디바이스", nameCn: "琼&康娜", nameSourceLine: 202 },
  { heroId: 99197, nameKo: "각성자", equipmentId: 603, equipmentNameKo: "최후의 시선", nameCn: "醒觉者", nameSourceLine: 206 },
];

export const HERO_MINIMAL_DETAIL_THIRTY_ONE_FIELDS = ['heroId', 'nameKo', 'exclusiveEquipment.equipmentId', 'exclusiveEquipment.nameKo', 'exclusiveEquipment.effectDescriptionKo'];
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

export function heroMinimalDetailThirtyOneApprovedHeroes() {
  return HERO_MINIMAL_DETAIL_THIRTY_ONE_BATCH.map(({ heroId, nameKo, equipmentId, equipmentNameKo, nameCn, nameSourceLine }) => ({
    heroId, nameKo, equipmentId, equipmentNameKo,
    detailSurface: 'HERO_MINIMAL_DETAIL', detailFragment: `hero-minimal-detail-${heroId}`,
    heroIndexTarget: { surface: 'HERO_MINIMAL_DETAIL', fragment: `hero-minimal-detail-${heroId}` },
    equipmentPreviousTarget: { surface: 'HERO_INDEX', fragment: `hero-index-entry-${heroId}` },
    equipmentTarget: { surface: 'HERO_MINIMAL_DETAIL', fragment: `hero-minimal-detail-${heroId}` },
    claimProvenance: {
      heroIdentity: { canonicalPath: sourcePaths.heroIdentity, canonicalLocator: `canonical/hero-identities.v1.json#heroId=${heroId}`, evidencePath: 'evidence/source/configdata/ConfigDataHeroInfo.records-playable-identity.v1.json', evidenceLocator: `evidence/source/configdata/ConfigDataHeroInfo.records-playable-identity.v1.json#ID=${heroId}`, sourceVersion: 'unknown', transformation: 'Exact Hero ID carried from the admitted identity evidence record.', limitation: 'Source version metadata is not declared by the preserved identity artifact.' },
      heroLocalization: { canonicalPath: sourcePaths.heroLocalization, canonicalLocator: `canonical/hero-localizations-ko.v1.json#heroId=${heroId}`, evidencePath: 'evidence/localization/hero-names-ko.v1.json', evidenceLocator: `evidence/localization/hero-names-ko.v1.json#heroId=${heroId}`, projectSource: 'evidence/localization/source/hero-names-ko.v1.txt', projectSourceLocator: `hero-names-ko.v1.txt#nameCn=${nameCn}`, sourceLine: nameSourceLine, sourceVersion: 'unknown', sourceSha256: '55f49fe6aac8d898c6f05feef821f4fab9e0b56ffe5e70690093478d8f2e41f6', transformation: 'Exact Chinese display-key equality to the reviewed Korean display label.', limitation: 'PROJECT_REVIEWED only; official Korean server provenance is unverified.' },
      relation: { canonicalPath: sourcePaths.equipmentRelation, canonicalLocator: `canonical/hero-exclusive-equipment-relations.v1.json#heroId=${heroId}`, evidencePath: 'evidence/source/configdata/hero-exclusive-equipment-skill-hero.v1.json', evidenceLocator: `evidence/source/configdata/hero-exclusive-equipment-skill-hero.v1.json#heroId=${heroId}`, source: `ConfigDataEquipmentInfo#ID=${equipmentId}/SkillHero=${heroId}`, sourceVersion: 'unknown', inheritedPredecessorHead: '57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff', transformation: 'Exact Equipment ID record and SkillHero value equality to the admitted Hero ID.', limitation: 'Reuses the existing admitted Relation; no new Semantic Admission.' },
      equipmentIdentity: { canonicalPath: sourcePaths.equipmentIdentity, canonicalLocator: `canonical/exclusive-equipment.v1.json#equipmentId=${equipmentId}`, authoritativeSource: 'LuceatLuxVestra42/langrisser-future-guide@6475e63ee23d18adf733756c26a14fa9e3ed662c:data/configdata/ConfigDataEquipmentInfo.json', sourceBlobSha1: '353c4f00b44a2ba0f8eb32dd03a76c3224635d04', sourceLocator: `data/configdata/ConfigDataEquipmentInfo.json#ID=${equipmentId}`, transformation: 'Admitted equipment identity selected by the existing exact source predicate; ID copied unchanged.', limitation: 'Existing Canonical admission only; PathType=46 original enum documentation was not confirmed, so its source semantics remain limited.' },
      equipmentLocalization: { canonicalPath: sourcePaths.equipmentLocalization, canonicalLocator: `canonical/exclusive-equipment-localizations-ko.v1.json#equipmentId=${equipmentId}`, evidencePath: 'evidence/localization/exclusive-equipment-ko.v1.json', evidenceLocator: `evidence/localization/exclusive-equipment-ko.v1.json#EquipmentID=${equipmentId}`, projectSource: '전용장비.txt', sourceSnapshotDate: '2026-09-20', sourceSha256: 'c5eaea947311ae115de66769421c0f2b929db09206ae29a3b26db792c2d1a78a', projectSourceLocator: `EquipmentID=${equipmentId}`, transformation: 'Exact EquipmentID match; decode literal newline escapes only and preserve other text.', limitation: 'PROJECT_REVIEWED display string only; effect text does not admit gameplay semantics; official Korean server provenance is unverified.' },
    },
  }));
}

export function validateHeroMinimalDetailThirtyOneBatchPublication(decision) {
  exactKeys(decision, ['schemaVersion', 'decisionType', 'status', 'approval', 'approvedScope', 'effect'], 'Thirty-One-Hero Publication decision');
  exactKeys(decision.approval, ['approverRole', 'source', 'recordedAtDate'], 'Thirty-One-Hero approval');
  exactKeys(decision.approval.source, ['kind', 'quote', 'originalMessageIdOrUrl', 'contextVerified'], 'Thirty-One-Hero approval source');
  exactKeys(decision.approvedScope, ['repository', 'baselineRef', 'baselineHead', 'surfaces', 'fields', 'nameLabelStatus', 'officialKrProvenanceStatus', 'canonicalSources', 'heroes', 'preservedPopulations', 'excluded'], 'Thirty-One-Hero approved scope');
  exactKeys(decision.approvedScope.canonicalSources, Object.keys(sourceHashes), 'Thirty-One-Hero Canonical sources');
  for (const [key, path] of Object.entries(sourcePaths)) {
    exactKeys(decision.approvedScope.canonicalSources[key], ['path', 'sha256'], `${key} source`);
    if (decision.approvedScope.canonicalSources[key].path !== path || decision.approvedScope.canonicalSources[key].sha256 !== sourceHashes[key]) throw new Error(`Thirty-One-Hero ${key} source scope changed`);
  }
  exactKeys(decision.approvedScope.preservedPopulations, ['heroIndex', 'fullHeroDetail', 'equipmentNavigation', 'minimalDetailBefore', 'minimalDetailAfter', 'heroDetailTargets', 'minimalDetailTargets', 'heroIndexTargets'], 'Thirty-One-Hero preserved populations');
  exactKeys(decision.effect, ['effective', 'condition', 'reviewWhen'], 'Thirty-One-Hero decision effect');
  const scope = decision.approvedScope;
  if (decision.schemaVersion !== 1 || decision.decisionType !== 'THIRTY_ONE_HERO_INTEGRATED_PUBLICATION' || decision.status !== 'APPROVED'
    || decision.approval.approverRole !== 'USER' || decision.approval.source.kind !== 'CURRENT_USER_MESSAGE'
    || decision.approval.source.quote !== '위 31명의 `HERO_MINIMAL_DETAIL` 공개를 승인한다.'
    || decision.approval.source.originalMessageIdOrUrl !== 'NOT_AVAILABLE' || decision.approval.source.contextVerified !== true
    || decision.approval.recordedAtDate !== '2026-11-06'
    || scope.repository !== 'LuceatLuxVestra42/Langrisser-2nd-test' || scope.baselineRef !== 'main'
    || scope.baselineHead !== '82e83b1aeba7613793bf4b967cb8f645ee845c49'
    || JSON.stringify(scope.surfaces) !== JSON.stringify(['HERO_MINIMAL_DETAIL', 'HERO_INDEX_LIST', 'EXCLUSIVE_EQUIPMENT_LIST'])
    || JSON.stringify(scope.fields) !== JSON.stringify(HERO_MINIMAL_DETAIL_THIRTY_ONE_FIELDS)
    || scope.nameLabelStatus !== 'PROJECT_REVIEWED' || scope.officialKrProvenanceStatus !== 'unverified'
    || JSON.stringify(scope.heroes) !== JSON.stringify(heroMinimalDetailThirtyOneApprovedHeroes())
    || JSON.stringify(scope.preservedPopulations) !== JSON.stringify({ heroIndex: 267, fullHeroDetail: 29, equipmentNavigation: 167, minimalDetailBefore: 67, minimalDetailAfter: 98, heroDetailTargets: 29, minimalDetailTargets: 98, heroIndexTargets: 40 })
    || JSON.stringify(scope.excluded) !== JSON.stringify(['New Semantic Admission', 'Canonical or Evidence mutation', 'Legacy Repository mutation', 'Other Hero publication changes', 'Other Equipment target changes', 'Rarity', 'Faction', 'Production', 'Job', 'Soldier', 'Talent', 'Skill', 'Portrait or Asset', 'Unverified statistics'])
    || decision.effect.effective !== true
    || decision.effect.condition !== 'Only the thirty-one exact approved Hero and Equipment pairs, five approved fields, and corresponding P-A, P-B, and P-C targets may change; existing sixty-seven Minimal Detail Heroes, twenty-nine Full Detail Heroes, 267 Hero Index entries, and all other Equipment targets are preserved.'
    || decision.effect.reviewWhen !== 'Re-review if any approved Hero or Equipment ID, pair, field, source, surface, target, limitation, or preserved population changes.') throw new Error('Thirty-One-Hero integrated Publication approval or exact scope is invalid');
  return decision;
}

export function renderHeroMinimalDetailThirtyOneBatch({ decision, heroIdentities, heroLocalizations, relations, equipmentIdentities, equipmentLocalizations, sourceHashes: actualHashes }) {
  validateHeroMinimalDetailThirtyOneBatchPublication(decision);
  exactKeys(actualHashes, Object.keys(sourceHashes), 'Thirty-One-Hero Canonical source hashes');
  for (const [key, expected] of Object.entries(sourceHashes)) if (actualHashes[key] !== expected) throw new Error(`Thirty-One-Hero Canonical source hash changed: ${key}`);
  for (const [value, label] of [[heroIdentities, 'Hero Identity'], [heroLocalizations, 'Hero Localization'], [relations, 'Hero-Equipment relation'], [equipmentIdentities, 'Equipment Identity'], [equipmentLocalizations, 'Equipment Localization']]) {
    if (value?.schemaVersion !== 1 || !Array.isArray(value.records)) throw new Error(`Unsupported ${label} input`);
  }
  const one = (rows, predicate, label) => {
    const matches = rows.filter(predicate);
    if (matches.length !== 1) throw new Error(`${label} must resolve exactly once`);
    return matches[0];
  };
  const heroes = HERO_MINIMAL_DETAIL_THIRTY_ONE_BATCH.map((approved) => {
    one(heroIdentities.records, ({ heroId }) => heroId === approved.heroId, `Hero ${approved.heroId} Identity`);
    const localization = one(heroLocalizations.records, ({ heroId }) => heroId === approved.heroId, `Hero ${approved.heroId} Localization`);
    if (localization.nameKo !== approved.nameKo) throw new Error(`Hero ${approved.heroId} Korean name differs from approved display label`);
    const relation = one(relations.records, ({ heroId, equipmentId }) => heroId === approved.heroId && equipmentId === approved.equipmentId, `Hero ${approved.heroId} approved relation`);
    if (relations.records.filter(({ heroId }) => heroId === approved.heroId).length !== 1 || relations.records.filter(({ equipmentId }) => equipmentId === approved.equipmentId).length !== 1
      || JSON.stringify(relation.provenance) !== JSON.stringify([{ sourceKind: 'EQUIPMENT_SKILL_HERO', table: 'ConfigDataEquipmentInfo', recordId: approved.equipmentId, field: 'SkillHero', value: approved.heroId }])) throw new Error(`Hero ${approved.heroId} relation provenance is not the exact approved source field`);
    one(equipmentIdentities.records, ({ equipmentId }) => equipmentId === approved.equipmentId, `Equipment ${approved.equipmentId} Identity`);
    const equipment = one(equipmentLocalizations.records, ({ equipmentId }) => equipmentId === approved.equipmentId, `Equipment ${approved.equipmentId} Localization`);
    if (equipment.nameKo !== approved.equipmentNameKo || !equipment.effectDescriptionKo?.trim()) throw new Error(`Equipment ${approved.equipmentId} localization differs from approved presentation`);
    return { heroId: approved.heroId, nameKo: localization.nameKo, exclusiveEquipment: { equipmentId: approved.equipmentId, nameKo: equipment.nameKo, effectDescriptionKo: equipment.effectDescriptionKo } };
  });
  return `${JSON.stringify({ schemaVersion: 1, heroes }, null, 2)}\n`;
}

export function validateHeroMinimalDetailThirtyOneBatch({ generatedText, inputs }) {
  const expected = renderHeroMinimalDetailThirtyOneBatch(inputs);
  if (generatedText !== expected) throw new Error('Generated thirty-one-Hero Minimal Detail Consumer is stale or non-deterministic');
  const data = JSON.parse(generatedText);
  exactKeys(data, ['schemaVersion', 'heroes'], 'Generated thirty-one-Hero batch Consumer');
  if (data.schemaVersion !== 1 || data.heroes.length !== 31 || JSON.stringify(data.heroes.map(({ heroId }) => heroId)) !== JSON.stringify(HERO_MINIMAL_DETAIL_THIRTY_ONE_BATCH.map(({ heroId }) => heroId))) throw new Error('Generated thirty-one-Hero batch population is invalid');
  if (new Set(data.heroes.map(({ heroId }) => heroId)).size !== 31 || new Set(data.heroes.map(({ exclusiveEquipment }) => exclusiveEquipment.equipmentId)).size !== 31) throw new Error('Generated thirty-one-Hero batch contains duplicate IDs');
  for (const row of data.heroes) {
    exactKeys(row, ['heroId', 'nameKo', 'exclusiveEquipment'], `Hero ${row.heroId} batch row`);
    exactKeys(row.exclusiveEquipment, ['equipmentId', 'nameKo', 'effectDescriptionKo'], `Hero ${row.heroId} equipment`);
    if (!row.exclusiveEquipment.effectDescriptionKo.trim()) throw new Error(`Hero ${row.heroId} equipment effect is missing`);
  }
  return data;
}
