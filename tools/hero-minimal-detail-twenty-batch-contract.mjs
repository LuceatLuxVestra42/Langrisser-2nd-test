import { createHash } from 'node:crypto';

export const HERO_MINIMAL_DETAIL_TWENTY_BATCH_PUBLICATION_PATH = 'docs/decisions/hero-58-59-61-62-63-64-65-66-87-88-91-92-93-94-95-96-97-98-99-100-integrated-publication.v1.json';
export const HERO_MINIMAL_DETAIL_TWENTY_BATCH_PATH = 'generated/hero-minimal-detail-batch-58-59-61-62-63-64-65-66-87-88-91-92-93-94-95-96-97-98-99-100.v1.json';
export const HERO_MINIMAL_DETAIL_TWENTY_BATCH = [
  { heroId: 58, nameKo: '세레나', equipmentId: 423, equipmentNameKo: '여명의 수호자', nameCn: '塞蕾娜', nameSourceLine: 84 },
  { heroId: 59, nameKo: '기자로프', equipmentId: 424, equipmentNameKo: '파멸과 창조의 지팡이', nameCn: '基扎洛夫', nameSourceLine: 85 },
  { heroId: 61, nameKo: '람다', equipmentId: 413, equipmentNameKo: '세계수의 꽃', nameCn: '拉姆达', nameSourceLine: 87 },
  { heroId: 62, nameKo: '알프레드', equipmentId: 427, equipmentNameKo: '오션즈 하트', nameCn: '阿尔弗雷德', nameSourceLine: 88 },
  { heroId: 63, nameKo: '레인폴스', equipmentId: 452, equipmentNameKo: '크림조의 심장', nameCn: '雷因法鲁斯', nameSourceLine: 89 },
  { heroId: 64, nameKo: '브렌다', equipmentId: 439, equipmentNameKo: '아득한 달의 기억', nameCn: '布琳达', nameSourceLine: 90 },
  { heroId: 65, nameKo: '비라쥬', equipmentId: 437, equipmentNameKo: '크림조 아머', nameCn: '维拉玖', nameSourceLine: 91 },
  { heroId: 66, nameKo: '클라렛', equipmentId: 464, equipmentNameKo: '칼자스의 군신', nameCn: '克拉蕾特', nameSourceLine: 92 },
  { heroId: 87, nameKo: '베티', equipmentId: 435, equipmentNameKo: '파멸의 샛별', nameCn: '贝蒂', nameSourceLine: 112 },
  { heroId: 88, nameKo: '엘라스타', equipmentId: 417, equipmentNameKo: '바람을 싣는 날개', nameCn: '艾拉斯卓', nameSourceLine: 113 },
  { heroId: 91, nameKo: '에밀리아', equipmentId: 453, equipmentNameKo: '영광의 전승', nameCn: '艾米莉亚', nameSourceLine: 115 },
  { heroId: 92, nameKo: '환생 제시카', equipmentId: 426, equipmentNameKo: '신탁을 받은 자', nameCn: '女神化身', nameSourceLine: 116 },
  { heroId: 93, nameKo: '미지의 기사', equipmentId: 479, equipmentNameKo: '수호의 맹세', nameCn: '谜之骑士', nameSourceLine: 117 },
  { heroId: 94, nameKo: '아카야', equipmentId: 440, equipmentNameKo: '성령의 손길', nameCn: '阿卡娅', nameSourceLine: 118 },
  { heroId: 95, nameKo: '올리버', equipmentId: 438, equipmentNameKo: '위대한 왕의 증표', nameCn: '奥利佛', nameSourceLine: 119 },
  { heroId: 96, nameKo: '멜파니', equipmentId: 460, equipmentNameKo: '활기찬 소환사', nameCn: '梅露帕妮', nameSourceLine: 120 },
  { heroId: 97, nameKo: '일루시아', equipmentId: 448, equipmentNameKo: '그 여름의 기억', nameCn: '伊露希亚', nameSourceLine: 121 },
  { heroId: 98, nameKo: '빈센트', equipmentId: 476, equipmentNameKo: '타락한 날개', nameCn: '文森特', nameSourceLine: 122 },
  { heroId: 99, nameKo: '클로테르', equipmentId: 540, equipmentNameKo: '영원한 불꽃의 맹세', nameCn: '克洛泰尔', nameSourceLine: 123 },
  { heroId: 100, nameKo: '로젠실', equipmentId: 549, equipmentNameKo: '순백의 면사포', nameCn: '罗泽希尔', nameSourceLine: 124 },
];

export const HERO_MINIMAL_DETAIL_TWENTY_FIELDS = ['heroId', 'nameKo', 'exclusiveEquipment.equipmentId', 'exclusiveEquipment.nameKo', 'exclusiveEquipment.effectDescriptionKo'];
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

export function heroMinimalDetailTwentyApprovedHeroes() {
  return HERO_MINIMAL_DETAIL_TWENTY_BATCH.map(({ heroId, nameKo, equipmentId, equipmentNameKo, nameCn, nameSourceLine }) => ({
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

export function validateHeroMinimalDetailTwentyBatchPublication(decision) {
  exactKeys(decision, ['schemaVersion', 'decisionType', 'status', 'approval', 'approvedScope', 'effect'], 'Twenty-Hero Publication decision');
  exactKeys(decision.approval, ['approverRole', 'source', 'recordedAtDate'], 'Twenty-Hero approval');
  exactKeys(decision.approval.source, ['kind', 'quote', 'originalMessageIdOrUrl', 'contextVerified'], 'Twenty-Hero approval source');
  exactKeys(decision.approvedScope, ['repository', 'baselineRef', 'baselineHead', 'surfaces', 'fields', 'nameLabelStatus', 'officialKrProvenanceStatus', 'canonicalSources', 'heroes', 'preservedPopulations', 'excluded'], 'Twenty-Hero approved scope');
  exactKeys(decision.approvedScope.canonicalSources, Object.keys(sourceHashes), 'Twenty-Hero Canonical sources');
  for (const [key, path] of Object.entries(sourcePaths)) {
    exactKeys(decision.approvedScope.canonicalSources[key], ['path', 'sha256'], `${key} source`);
    if (decision.approvedScope.canonicalSources[key].path !== path || decision.approvedScope.canonicalSources[key].sha256 !== sourceHashes[key]) throw new Error(`Twenty-Hero ${key} source scope changed`);
  }
  exactKeys(decision.approvedScope.preservedPopulations, ['heroIndex', 'fullHeroDetail', 'equipmentNavigation', 'minimalDetailBefore', 'minimalDetailAfter', 'heroDetailTargets', 'minimalDetailTargets', 'heroIndexTargets'], 'Twenty-Hero preserved populations');
  exactKeys(decision.effect, ['effective', 'condition', 'reviewWhen'], 'Twenty-Hero decision effect');
  const scope = decision.approvedScope;
  if (decision.schemaVersion !== 1 || decision.decisionType !== 'TWENTY_HERO_INTEGRATED_PUBLICATION' || decision.status !== 'APPROVED'
    || decision.approval.approverRole !== 'USER' || decision.approval.source.kind !== 'CURRENT_USER_MESSAGE'
    || decision.approval.source.quote !== '나는 `LuceatLuxVestra42/Langrisser-2nd-test`의 신규 영웅 20명에 대한 **P-A·P-B·P-C 통합 Publication 전체를 직접 승인한다.**'
    || decision.approval.source.originalMessageIdOrUrl !== 'NOT_AVAILABLE' || decision.approval.source.contextVerified !== true
    || decision.approval.recordedAtDate !== '2026-11-05'
    || scope.repository !== 'LuceatLuxVestra42/Langrisser-2nd-test' || scope.baselineRef !== 'main'
    || scope.baselineHead !== '299b1f5527dfc4af68fb1d31107bb8cbef6ff54f'
    || JSON.stringify(scope.surfaces) !== JSON.stringify(['HERO_MINIMAL_DETAIL', 'HERO_INDEX_LIST', 'EXCLUSIVE_EQUIPMENT_LIST'])
    || JSON.stringify(scope.fields) !== JSON.stringify(HERO_MINIMAL_DETAIL_TWENTY_FIELDS)
    || scope.nameLabelStatus !== 'PROJECT_REVIEWED' || scope.officialKrProvenanceStatus !== 'unverified'
    || JSON.stringify(scope.heroes) !== JSON.stringify(heroMinimalDetailTwentyApprovedHeroes())
    || JSON.stringify(scope.preservedPopulations) !== JSON.stringify({ heroIndex: 267, fullHeroDetail: 29, equipmentNavigation: 167, minimalDetailBefore: 17, minimalDetailAfter: 37, heroDetailTargets: 29, minimalDetailTargets: 37, heroIndexTargets: 101 })
    || JSON.stringify(scope.excluded) !== JSON.stringify(['New Semantic Admission', 'Canonical or Evidence mutation', 'Legacy Repository mutation', 'Other Hero publication changes', 'Other Equipment target changes', 'Rarity', 'Faction', 'Production', 'Job', 'Soldier', 'Talent', 'Skill', 'Portrait or Asset', 'Unverified statistics'])
    || decision.effect.effective !== true
    || decision.effect.condition !== 'Only the twenty exact approved Hero and Equipment pairs, five approved fields, and corresponding P-A, P-B, and P-C targets may change; existing seventeen Minimal Detail Heroes, twenty-nine Full Detail Heroes, 267 Hero Index entries, and all other Equipment targets are preserved.'
    || decision.effect.reviewWhen !== 'Re-review if any approved Hero or Equipment ID, pair, field, source, surface, target, limitation, or preserved population changes.') throw new Error('Twenty-Hero integrated Publication approval or exact scope is invalid');
  return decision;
}

export function renderHeroMinimalDetailTwentyBatch({ decision, heroIdentities, heroLocalizations, relations, equipmentIdentities, equipmentLocalizations, sourceHashes: actualHashes }) {
  validateHeroMinimalDetailTwentyBatchPublication(decision);
  exactKeys(actualHashes, Object.keys(sourceHashes), 'Twenty-Hero Canonical source hashes');
  for (const [key, expected] of Object.entries(sourceHashes)) if (actualHashes[key] !== expected) throw new Error(`Twenty-Hero Canonical source hash changed: ${key}`);
  for (const [value, label] of [[heroIdentities, 'Hero Identity'], [heroLocalizations, 'Hero Localization'], [relations, 'Hero-Equipment relation'], [equipmentIdentities, 'Equipment Identity'], [equipmentLocalizations, 'Equipment Localization']]) {
    if (value?.schemaVersion !== 1 || !Array.isArray(value.records)) throw new Error(`Unsupported ${label} input`);
  }
  const one = (rows, predicate, label) => {
    const matches = rows.filter(predicate);
    if (matches.length !== 1) throw new Error(`${label} must resolve exactly once`);
    return matches[0];
  };
  const heroes = HERO_MINIMAL_DETAIL_TWENTY_BATCH.map((approved) => {
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

export function validateHeroMinimalDetailTwentyBatch({ generatedText, inputs }) {
  const expected = renderHeroMinimalDetailTwentyBatch(inputs);
  if (generatedText !== expected) throw new Error('Generated twenty-Hero Minimal Detail Consumer is stale or non-deterministic');
  const data = JSON.parse(generatedText);
  exactKeys(data, ['schemaVersion', 'heroes'], 'Generated twenty-Hero batch Consumer');
  if (data.schemaVersion !== 1 || data.heroes.length !== 20 || JSON.stringify(data.heroes.map(({ heroId }) => heroId)) !== JSON.stringify(HERO_MINIMAL_DETAIL_TWENTY_BATCH.map(({ heroId }) => heroId))) throw new Error('Generated twenty-Hero batch population is invalid');
  if (new Set(data.heroes.map(({ heroId }) => heroId)).size !== 20 || new Set(data.heroes.map(({ exclusiveEquipment }) => exclusiveEquipment.equipmentId)).size !== 20) throw new Error('Generated twenty-Hero batch contains duplicate IDs');
  for (const row of data.heroes) {
    exactKeys(row, ['heroId', 'nameKo', 'exclusiveEquipment'], `Hero ${row.heroId} batch row`);
    exactKeys(row.exclusiveEquipment, ['equipmentId', 'nameKo', 'effectDescriptionKo'], `Hero ${row.heroId} equipment`);
    if (!row.exclusiveEquipment.effectDescriptionKo.trim()) throw new Error(`Hero ${row.heroId} equipment effect is missing`);
  }
  return data;
}
