import { createHash } from 'node:crypto';

export const HERO_MINIMAL_DETAIL_THIRTY_BATCH_PUBLICATION_PATH = 'docs/decisions/hero-thirty-minimal-detail-integrated-publication.v1.json';
export const HERO_MINIMAL_DETAIL_THIRTY_BATCH_PATH = 'generated/hero-minimal-detail-thirty-batch.v1.json';
export const HERO_MINIMAL_DETAIL_THIRTY_BATCH = [
  { heroId: 101, nameKo: "헬레나", equipmentId: 463, equipmentNameKo: "황금 수정의 갑옷", nameCn: "海伦娜", nameSourceLine: 125 },
  { heroId: 102, nameKo: "세계수의 현자", equipmentId: 477, equipmentNameKo: "낡은 두건", nameCn: "树之贤者", nameSourceLine: 126 },
  { heroId: 103, nameKo: "실린카", equipmentId: 451, equipmentNameKo: "역날개의 가면", nameCn: "希琳卡", nameSourceLine: 127 },
  { heroId: 104, nameKo: "알파", equipmentId: 508, equipmentNameKo: "개조된 신체 αEX", nameCn: "阿尔法", nameSourceLine: 128 },
  { heroId: 105, nameKo: "뮤", equipmentId: 497, equipmentNameKo: "만개의 월계관", nameCn: "茉", nameSourceLine: 129 },
  { heroId: 106, nameKo: "입실론", equipmentId: 487, equipmentNameKo: "소멸 · 개", nameCn: "伊普西龙", nameSourceLine: 130 },
  { heroId: 108, nameKo: "사신 크루거", equipmentId: 499, equipmentNameKo: "사기꾼의 가면", nameCn: "邪神库鲁加", nameSourceLine: 131 },
  { heroId: 109, nameKo: "화이트 시시", equipmentId: 489, equipmentNameKo: "비즈니스 마인드", nameCn: "怀特·茜茜", nameSourceLine: 132 },
  { heroId: 110, nameKo: "아레스", equipmentId: 475, equipmentNameKo: "자경단의 투구", nameCn: "阿雷斯", nameSourceLine: 133 },
  { heroId: 111, nameKo: "마이야", equipmentId: 449, equipmentNameKo: "치명적인 빗자루", nameCn: "梅雅", nameSourceLine: 134 },
  { heroId: 112, nameKo: "토와", equipmentId: 501, equipmentNameKo: "스피릿 비전 고글", nameCn: "托娃", nameSourceLine: 135 },
  { heroId: 113, nameKo: "탄생의 빛", equipmentId: 507, equipmentNameKo: "전생의 글귀", nameCn: "降生之光", nameSourceLine: 136 },
  { heroId: 114, nameKo: "마리엘", equipmentId: 485, equipmentNameKo: "저스티스 플레일", nameCn: "玛丽埃尔", nameSourceLine: 137 },
  { heroId: 115, nameKo: "로자리아", equipmentId: 478, equipmentNameKo: "세인트 소드", nameCn: "罗莎莉娅", nameSourceLine: 138 },
  { heroId: 116, nameKo: "노에미", equipmentId: 461, equipmentNameKo: "기발한 모자", nameCn: "诺埃米", nameSourceLine: 139 },
  { heroId: 118, nameKo: "오토크라트 4세", equipmentId: 496, equipmentNameKo: "금단의 황실 갑옷", nameCn: "奥托克拉托四世", nameSourceLine: 140 },
  { heroId: 119, nameKo: "루크레치아", equipmentId: 526, equipmentNameKo: "면죄의 모자", nameCn: "卢克蕾蒂娅", nameSourceLine: 141 },
  { heroId: 120, nameKo: "플로렌티아", equipmentId: 473, equipmentNameKo: "제국의 보배", nameCn: "弗洛朗蒂娅", nameSourceLine: 142 },
  { heroId: 121, nameKo: "츠바메", equipmentId: 454, equipmentNameKo: "숨겨진 별의 투구", nameCn: "燕", nameSourceLine: 143 },
  { heroId: 122, nameKo: "힐다", equipmentId: 502, equipmentNameKo: "선홍색 무장", nameCn: "希尔达", nameSourceLine: 144 },
  { heroId: 123, nameKo: "베르너", equipmentId: 486, equipmentNameKo: "기동 폭발검", nameCn: "沃尔纳", nameSourceLine: 145 },
  { heroId: 124, nameKo: "크리스티아네", equipmentId: 519, equipmentNameKo: "깃털 장식 모자", nameCn: "克里斯蒂安妮", nameSourceLine: 146 },
  { heroId: 125, nameKo: "리코리스", equipmentId: 467, equipmentNameKo: "어린 왕", nameCn: "丽可丽丝", nameSourceLine: 147 },
  { heroId: 126, nameKo: "팟시르", equipmentId: 484, equipmentNameKo: "심취의 베일", nameCn: "帕希尔", nameSourceLine: 148 },
  { heroId: 127, nameKo: "레나타", equipmentId: 450, equipmentNameKo: "드래곤 크레스트", nameCn: "蕾娜塔", nameSourceLine: 149 },
  { heroId: 129, nameKo: "구스타프", equipmentId: 520, equipmentNameKo: "머나먼 메아리", nameCn: "古斯塔夫", nameSourceLine: 150 },
  { heroId: 130, nameKo: "미셸", equipmentId: 512, equipmentNameKo: "마도 과학 무장", nameCn: "米歇尔", nameSourceLine: 151 },
  { heroId: 99161, nameKo: "크림조의 왕", equipmentId: 495, equipmentNameKo: "월식 갑옷", nameCn: "红月之王", nameSourceLine: 170 },
  { heroId: 99162, nameKo: "수제트", equipmentId: 498, equipmentNameKo: "빛의 심판자", nameCn: "修杰特", nameSourceLine: 171 },
  { heroId: 99163, nameKo: "초월자", equipmentId: 500, equipmentNameKo: "무한한 고리", nameCn: "超越之人", nameSourceLine: 172 },
];

export const HERO_MINIMAL_DETAIL_THIRTY_FIELDS = ['heroId', 'nameKo', 'exclusiveEquipment.equipmentId', 'exclusiveEquipment.nameKo', 'exclusiveEquipment.effectDescriptionKo'];
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

export function heroMinimalDetailThirtyApprovedHeroes() {
  return HERO_MINIMAL_DETAIL_THIRTY_BATCH.map(({ heroId, nameKo, equipmentId, equipmentNameKo, nameCn, nameSourceLine }) => ({
    heroId, nameKo, equipmentId, equipmentNameKo,
    detailSurface: 'HERO_MINIMAL_DETAIL', detailFragment: `hero-minimal-detail-${heroId}`,
    heroIndexTarget: { surface: 'HERO_MINIMAL_DETAIL', fragment: `hero-minimal-detail-${heroId}` },
    equipmentPreviousTarget: { surface: 'HERO_INDEX', fragment: `hero-index-entry-${heroId}` },
    equipmentTarget: { surface: 'HERO_MINIMAL_DETAIL', fragment: `hero-minimal-detail-${heroId}` },
    claimProvenance: {
      heroIdentity: { canonicalPath: sourcePaths.heroIdentity, canonicalLocator: `canonical/hero-identities.v1.json#heroId=${heroId}`, evidencePath: 'evidence/source/configdata/ConfigDataHeroInfo.records-playable-identity.v1.json', evidenceLocator: `evidence/source/configdata/ConfigDataHeroInfo.records-playable-identity.v1.json#ID=${heroId}`, sourceVersion: 'unknown', transformation: 'Exact Hero ID carried from the admitted identity evidence record.', limitation: 'Source version metadata is not declared by the preserved identity artifact.' },
      heroLocalization: { canonicalPath: sourcePaths.heroLocalization, canonicalLocator: `canonical/hero-localizations-ko.v1.json#heroId=${heroId}`, evidencePath: 'evidence/localization/hero-names-ko.v1.json', evidenceLocator: `evidence/localization/hero-names-ko.v1.json#heroId=${heroId}`, projectSource: 'evidence/localization/source/hero-names-ko.v1.txt', projectSourceLocator: `hero-names-ko.v1.txt#nameCn=${nameCn}`, sourceLine: nameSourceLine, sourceVersion: 'unknown', sourceSha256: '55f49fe6aac8d898c6f05feef821f4fab9e0b56ffe5e70690093478d8f2e41f6', transformation: 'Exact Chinese display-key equality to the reviewed Korean display label.', limitation: 'PROJECT_REVIEWED only; official Korean server provenance is unverified.' },
      relation: { canonicalPath: sourcePaths.equipmentRelation, canonicalLocator: `canonical/hero-exclusive-equipment-relations.v1.json#heroId=${heroId}`, evidencePath: 'evidence/source/configdata/hero-exclusive-equipment-skill-hero.v1.json', evidenceLocator: `evidence/source/configdata/hero-exclusive-equipment-skill-hero.v1.json#heroId=${heroId}`, source: `ConfigDataEquipmentInfo#ID=${equipmentId}/SkillHero=${heroId}`, sourceVersion: 'unknown', inheritedPredecessorHead: '57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff', transformation: 'Exact Equipment ID record and SkillHero value equality to the admitted Hero ID.', limitation: 'Reuses the existing admitted Relation; no new Semantic Admission.' },
      equipmentIdentity: { canonicalPath: sourcePaths.equipmentIdentity, canonicalLocator: `canonical/exclusive-equipment.v1.json#equipmentId=${equipmentId}`, authoritativeSource: 'LuceatLuxVestra42/langrisser-future-guide@6475e63ee23d18adf733756c26a14fa9e3ed662c:data/configdata/ConfigDataEquipmentInfo.json', sourceBlobSha1: '353c4f00b44a2ba0f8eb32dd03a76c3224635d04', sourceLocator: `data/configdata/ConfigDataEquipmentInfo.json#ID=${equipmentId}`, transformation: 'Admitted equipment identity selected by the existing exact source predicate; ID copied unchanged.', limitation: 'Existing Canonical admission only.' },
      equipmentLocalization: { canonicalPath: sourcePaths.equipmentLocalization, canonicalLocator: `canonical/exclusive-equipment-localizations-ko.v1.json#equipmentId=${equipmentId}`, evidencePath: 'evidence/localization/exclusive-equipment-ko.v1.json', evidenceLocator: `evidence/localization/exclusive-equipment-ko.v1.json#EquipmentID=${equipmentId}`, projectSource: '전용장비.txt', sourceSnapshotDate: '2026-09-20', sourceSha256: 'c5eaea947311ae115de66769421c0f2b929db09206ae29a3b26db792c2d1a78a', projectSourceLocator: `EquipmentID=${equipmentId}`, transformation: 'Exact EquipmentID match; decode literal newline escapes only and preserve other text.', limitation: 'PROJECT_REVIEWED display string only; effect text does not admit gameplay semantics; official Korean server provenance is unverified.' },
    },
  }));
}

export function validateHeroMinimalDetailThirtyBatchPublication(decision) {
  exactKeys(decision, ['schemaVersion', 'decisionType', 'status', 'approval', 'approvedScope', 'effect'], 'Thirty-Hero Publication decision');
  exactKeys(decision.approval, ['approverRole', 'source', 'recordedAtDate'], 'Thirty-Hero approval');
  exactKeys(decision.approval.source, ['kind', 'quote', 'originalMessageIdOrUrl', 'contextVerified'], 'Thirty-Hero approval source');
  exactKeys(decision.approvedScope, ['repository', 'baselineRef', 'baselineHead', 'surfaces', 'fields', 'nameLabelStatus', 'officialKrProvenanceStatus', 'canonicalSources', 'heroes', 'preservedPopulations', 'excluded'], 'Thirty-Hero approved scope');
  exactKeys(decision.approvedScope.canonicalSources, Object.keys(sourceHashes), 'Thirty-Hero Canonical sources');
  for (const [key, path] of Object.entries(sourcePaths)) {
    exactKeys(decision.approvedScope.canonicalSources[key], ['path', 'sha256'], `${key} source`);
    if (decision.approvedScope.canonicalSources[key].path !== path || decision.approvedScope.canonicalSources[key].sha256 !== sourceHashes[key]) throw new Error(`Thirty-Hero ${key} source scope changed`);
  }
  exactKeys(decision.approvedScope.preservedPopulations, ['heroIndex', 'fullHeroDetail', 'equipmentNavigation', 'minimalDetailBefore', 'minimalDetailAfter', 'heroDetailTargets', 'minimalDetailTargets', 'heroIndexTargets'], 'Thirty-Hero preserved populations');
  exactKeys(decision.effect, ['effective', 'condition', 'reviewWhen'], 'Thirty-Hero decision effect');
  const scope = decision.approvedScope;
  if (decision.schemaVersion !== 1 || decision.decisionType !== 'THIRTY_HERO_INTEGRATED_PUBLICATION' || decision.status !== 'APPROVED'
    || decision.approval.approverRole !== 'USER' || decision.approval.source.kind !== 'CURRENT_USER_MESSAGE'
    || decision.approval.source.quote !== '나는 `LuceatLuxVestra42/Langrisser-2nd-test`의 신규 영웅 30명에 대한 **P-A·P-B·P-C 통합 Publication 전체를 승인한다.**'
    || decision.approval.source.originalMessageIdOrUrl !== 'NOT_AVAILABLE' || decision.approval.source.contextVerified !== true
    || decision.approval.recordedAtDate !== '2026-11-05'
    || scope.repository !== 'LuceatLuxVestra42/Langrisser-2nd-test' || scope.baselineRef !== 'main'
    || scope.baselineHead !== '178dace81c3b3ac55c955d22d80d6f87e837c23f'
    || JSON.stringify(scope.surfaces) !== JSON.stringify(['HERO_MINIMAL_DETAIL', 'HERO_INDEX_LIST', 'EXCLUSIVE_EQUIPMENT_LIST'])
    || JSON.stringify(scope.fields) !== JSON.stringify(HERO_MINIMAL_DETAIL_THIRTY_FIELDS)
    || scope.nameLabelStatus !== 'PROJECT_REVIEWED' || scope.officialKrProvenanceStatus !== 'unverified'
    || JSON.stringify(scope.heroes) !== JSON.stringify(heroMinimalDetailThirtyApprovedHeroes())
    || JSON.stringify(scope.preservedPopulations) !== JSON.stringify({ heroIndex: 267, fullHeroDetail: 29, equipmentNavigation: 167, minimalDetailBefore: 37, minimalDetailAfter: 67, heroDetailTargets: 29, minimalDetailTargets: 67, heroIndexTargets: 71 })
    || JSON.stringify(scope.excluded) !== JSON.stringify(['New Semantic Admission', 'Canonical or Evidence mutation', 'Legacy Repository mutation', 'Other Hero publication changes', 'Other Equipment target changes', 'Rarity', 'Faction', 'Production', 'Job', 'Soldier', 'Talent', 'Skill', 'Portrait or Asset', 'Unverified statistics'])
    || decision.effect.effective !== true
    || decision.effect.condition !== 'Only the thirty exact approved Hero and Equipment pairs, five approved fields, and corresponding P-A, P-B, and P-C targets may change; existing thirty-seven Minimal Detail Heroes, twenty-nine Full Detail Heroes, 267 Hero Index entries, and all other Equipment targets are preserved.'
    || decision.effect.reviewWhen !== 'Re-review if any approved Hero or Equipment ID, pair, field, source, surface, target, limitation, or preserved population changes.') throw new Error('Thirty-Hero integrated Publication approval or exact scope is invalid');
  return decision;
}

export function renderHeroMinimalDetailThirtyBatch({ decision, heroIdentities, heroLocalizations, relations, equipmentIdentities, equipmentLocalizations, sourceHashes: actualHashes }) {
  validateHeroMinimalDetailThirtyBatchPublication(decision);
  exactKeys(actualHashes, Object.keys(sourceHashes), 'Thirty-Hero Canonical source hashes');
  for (const [key, expected] of Object.entries(sourceHashes)) if (actualHashes[key] !== expected) throw new Error(`Thirty-Hero Canonical source hash changed: ${key}`);
  for (const [value, label] of [[heroIdentities, 'Hero Identity'], [heroLocalizations, 'Hero Localization'], [relations, 'Hero-Equipment relation'], [equipmentIdentities, 'Equipment Identity'], [equipmentLocalizations, 'Equipment Localization']]) {
    if (value?.schemaVersion !== 1 || !Array.isArray(value.records)) throw new Error(`Unsupported ${label} input`);
  }
  const one = (rows, predicate, label) => {
    const matches = rows.filter(predicate);
    if (matches.length !== 1) throw new Error(`${label} must resolve exactly once`);
    return matches[0];
  };
  const heroes = HERO_MINIMAL_DETAIL_THIRTY_BATCH.map((approved) => {
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

export function validateHeroMinimalDetailThirtyBatch({ generatedText, inputs }) {
  const expected = renderHeroMinimalDetailThirtyBatch(inputs);
  if (generatedText !== expected) throw new Error('Generated thirty-Hero Minimal Detail Consumer is stale or non-deterministic');
  const data = JSON.parse(generatedText);
  exactKeys(data, ['schemaVersion', 'heroes'], 'Generated thirty-Hero batch Consumer');
  if (data.schemaVersion !== 1 || data.heroes.length !== 30 || JSON.stringify(data.heroes.map(({ heroId }) => heroId)) !== JSON.stringify(HERO_MINIMAL_DETAIL_THIRTY_BATCH.map(({ heroId }) => heroId))) throw new Error('Generated thirty-Hero batch population is invalid');
  if (new Set(data.heroes.map(({ heroId }) => heroId)).size !== 30 || new Set(data.heroes.map(({ exclusiveEquipment }) => exclusiveEquipment.equipmentId)).size !== 30) throw new Error('Generated thirty-Hero batch contains duplicate IDs');
  for (const row of data.heroes) {
    exactKeys(row, ['heroId', 'nameKo', 'exclusiveEquipment'], `Hero ${row.heroId} batch row`);
    exactKeys(row.exclusiveEquipment, ['equipmentId', 'nameKo', 'effectDescriptionKo'], `Hero ${row.heroId} equipment`);
    if (!row.exclusiveEquipment.effectDescriptionKo.trim()) throw new Error(`Hero ${row.heroId} equipment effect is missing`);
  }
  return data;
}
