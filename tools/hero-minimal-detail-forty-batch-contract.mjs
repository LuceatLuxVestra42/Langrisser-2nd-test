import { createHash } from 'node:crypto';

export const HERO_MINIMAL_DETAIL_FORTY_BATCH_PUBLICATION_PATH = 'docs/decisions/hero-minimal-detail-forty-batch-integrated-publication.v1.json';
export const HERO_MINIMAL_DETAIL_FORTY_BATCH_PATH = 'generated/hero-minimal-detail-forty-batch.v1.json';
export const HERO_MINIMAL_DETAIL_FORTY_BATCH = [
  [99198, 558, '아마데우스', '반짝이는 가시창'], [99199, 562, '사그니', '겨울의 제사 로브'],
  [99203, 567, '님프', '먼 바다의 조가비'], [99204, 561, '타탈리아', '징벌의 협객'],
  [99205, 572, '투어밀크', '침묵의 고백'], [99206, 571, '이리스', '극야의 열쇠'],
  [99207, 578, '롤랑', '새벽빛의 비밀'], [99208, 573, '프레시아', '순차의 빛'],
  [99212, 580, '강신자', '심연의 계시'], [99213, 579, '캡틴 잭', '검은 고양이 선장 모자'],
  [99214, 582, '네미아', '기원 탐구의 길'], [99215, 604, '안드리올', '황제가 내린 훈장'],
  [99216, 612, '에쉬앤', '페가수스의 광휘'], [99217, 581, '호프만', '녹과 영광'],
  [99218, 619, '이졸데', '잊혀진 전설'], [99219, 589, '제이스', '새벽 바람'],
  [99220, 588, '패트리샤', '붉은 숨결'], [99221, 587, '군', '산행의 망토'],
  [99225, 643, '빙설 심연의 지배자', '빙룡의 서리 왕관'], [99226, 595, '테란틸', '초대 왕의 후손'],
  [99227, 590, '타브리스', '암흑 날개 투구'], [99228, 620, '이미르', '잃어버린 여명'],
  [99229, 628, '셀리카', '연금의 법칙'], [99230, 596, '세라피나', '칼날의 포옹'],
  [99231, 614, '비리아', '섬의 예절'], [99233, 597, '시온', '운명의 왕검'],
  [99234, 598, '티아나', '고독한 기사의 결의'], [99238, 605, '아리아', '축복의 달'],
  [99239, 636, '이리아', '영력의 비단 왕관'], [99240, 613, '사프린', '엘프의 새싹'],
  [99241, 606, '노노린', '파도의 메아리'], [99243, 627, '날개 꺾인 새', '부러진 깃털의 잔상'],
  [99244, 611, '란델', '꿈의 망토'], [99249, 622, '마카엘라', '마지막 알현'],
  [99250, 621, '샘', '베오프의 비극'], [99252, 635, '루크만', '수호의 칼날'],
  [99253, 629, '아브샤이트', '신의 인형의 족쇄'], [99254, 637, '레이아', '지혜의 날개 왕관'],
  [99255, 634, '엘비스', '암흑 날개의 부활'], [99259, 638, '레이피어', '신제국의 대검'],
].map(([heroId, equipmentId, nameKo, equipmentNameKo]) => ({ heroId, equipmentId, nameKo, equipmentNameKo }));
export const HERO_MINIMAL_DETAIL_FORTY_FIELDS = ['heroId', 'nameKo', 'exclusiveEquipment.equipmentId', 'exclusiveEquipment.nameKo', 'exclusiveEquipment.effectDescriptionKo'];
const sourcePaths = { heroIdentity: 'canonical/hero-identities.v1.json', heroLocalization: 'canonical/hero-localizations-ko.v1.json', equipmentRelation: 'canonical/hero-exclusive-equipment-relations.v1.json', equipmentIdentity: 'canonical/exclusive-equipment.v1.json', equipmentLocalization: 'canonical/exclusive-equipment-localizations-ko.v1.json' };
const exactKeys = (value, keys, label) => { if (!value || JSON.stringify(Object.keys(value).sort()) !== JSON.stringify([...keys].sort())) throw new Error(`${label} has unexpected or missing fields`); };
const expectedSources = {
  heroIdentity: '6cb710d09df61cbc31d2021fd41b9e1e1b5899377991d14af7a4a5d89e7fe11c',
  heroLocalization: '7f0ca08eb578dd2d1fcf9aa44eb825c49f7e415faeedd2fffa4b604d2c4ab299',
  equipmentRelation: 'a0aa17178c04456482018d3b166baa176224a8562b713fb5f583f2b5a113ba01',
  equipmentIdentity: 'bd59b9cce913ffd3f310d9f96b1295e939959b2e207e55324dc60b2a50f38b9f',
  equipmentLocalization: 'edd54afd11a4701dc039710670dcd321b7f459648887f55d48423ff26f1a125c',
};

export function validateHeroMinimalDetailFortyBatchPublication(decision) {
  exactKeys(decision, ['schemaVersion','decisionType','status','approval','approvedScope','effect'], 'Forty-Hero publication decision');
  exactKeys(decision.approval, ['approverRole','source','recordedAtDate'], 'Forty-Hero approval');
  exactKeys(decision.approval.source, ['kind','quote','originalMessageIdOrUrl','contextVerified'], 'Forty-Hero approval source');
  const scope = decision.approvedScope;
  exactKeys(scope, ['repository','baselineRef','baselineHead','surfaces','fields','nameLabelStatus','officialKrProvenanceStatus','canonicalSources','claimProvenance','heroes','preservedPopulations','excluded'], 'Forty-Hero scope');
  exactKeys(scope.claimProvenance, ['heroIdentity','heroLocalization','relation','equipmentIdentity','equipmentLocalization'], 'Forty-Hero claim provenance');
  exactKeys(scope.canonicalSources, Object.keys(sourcePaths), 'Forty-Hero sources');
  for (const [key, path] of Object.entries(sourcePaths)) {
    exactKeys(scope.canonicalSources[key], ['path','sha256'], `${key} source`);
    if (scope.canonicalSources[key].path !== path || scope.canonicalSources[key].sha256 !== expectedSources[key]) throw new Error(`Forty-Hero ${key} source mismatch`);
  }
  const expectedClaimProvenance = {
    heroIdentity: { sourceVersion: 'unknown', evidencePath: 'evidence/source/configdata/ConfigDataHeroInfo.records-playable-identity.v1.json', locatorPattern: 'ID=<Hero ID>', limitation: 'Source version metadata is not declared by the preserved identity artifact.' },
    heroLocalization: { sourceVersion: 'unknown', evidencePath: 'evidence/localization/hero-names-ko.v1.json', locatorPattern: 'heroId=<Hero ID>', limitation: 'PROJECT_REVIEWED display label only; official Korean server provenance is unverified.' },
    relation: { sourceVersion: 'unknown', evidencePath: 'evidence/source/configdata/hero-exclusive-equipment-skill-hero.v1.json', source: 'ConfigDataEquipmentInfo#ID=<Equipment ID>/SkillHero=<Hero ID>', limitation: 'Reuses the existing admitted relation; no new Semantic Admission.' },
    equipmentIdentity: { sourceVersion: 'unknown', evidencePath: 'evidence/exclusive-equipment-identity.v1.json', locatorPattern: 'equipmentId=<Equipment ID>', limitation: 'Existing Canonical admission only; PathType=46 original enum documentation was not confirmed, so source semantics remain limited.' },
    equipmentLocalization: { sourceVersion: 'unknown', evidencePath: 'evidence/localization/exclusive-equipment-ko.v1.json', locatorPattern: 'EquipmentID=<Equipment ID>', sourceSnapshotDate: '2026-09-20', sourceSha256: 'c5eaea947311ae115de66769421c0f2b929db09206ae29a3b26db792c2d1a78a', transformation: 'Exact EquipmentID match; decode literal newline escapes only and preserve other text.', limitation: 'PROJECT_REVIEWED display strings only; effect text does not admit gameplay semantics; official Korean server provenance is unverified.' },
  };
  exactKeys(scope.preservedPopulations, ['heroIndex','fullHeroDetail','equipmentNavigation','minimalDetailBefore','minimalDetailAfter','heroDetailTargets','minimalDetailTargets','heroIndexTargets'], 'Forty-Hero population');
  exactKeys(decision.effect, ['effective','condition','reviewWhen'], 'Forty-Hero effect');
  const expectedHeroes = HERO_MINIMAL_DETAIL_FORTY_BATCH.map(({heroId,equipmentId,nameKo,equipmentNameKo}) => ({
    heroId, nameKo, equipmentId, equipmentNameKo,
    detailSurface:'HERO_MINIMAL_DETAIL', detailFragment:`hero-minimal-detail-${heroId}`,
    heroIndexTarget:{surface:'HERO_MINIMAL_DETAIL',fragment:`hero-minimal-detail-${heroId}`},
    equipmentPreviousTarget:{surface:'HERO_INDEX',fragment:`hero-index-entry-${heroId}`},
    equipmentTarget:{surface:'HERO_MINIMAL_DETAIL',fragment:`hero-minimal-detail-${heroId}`},
  }));
  if (decision.schemaVersion !== 1 || decision.decisionType !== 'FORTY_HERO_INTEGRATED_PUBLICATION' || decision.status !== 'APPROVED'
    || decision.approval.approverRole !== 'USER' || decision.approval.source.kind !== 'CURRENT_USER_MESSAGE'
    || decision.approval.source.quote !== '나는 `LuceatLuxVestra42/Langrisser-2nd-test`의 Slice B 마지막 40개 Hero↔Equipment 쌍에 대한 P-A·P-B·P-C 통합 Publication 전체를 명시적으로 승인한다.'
    || decision.approval.source.originalMessageIdOrUrl !== 'NOT_AVAILABLE' || decision.approval.source.contextVerified !== true
    || decision.approval.recordedAtDate !== '2026-11-07'
    || scope.repository !== 'LuceatLuxVestra42/Langrisser-2nd-test' || scope.baselineRef !== 'main' || scope.baselineHead !== 'e144018cd8368ac02199ce8ee45fb7e10de11e99'
    || JSON.stringify(scope.surfaces) !== JSON.stringify(['HERO_MINIMAL_DETAIL','HERO_INDEX_LIST','EXCLUSIVE_EQUIPMENT_LIST'])
    || JSON.stringify(scope.fields) !== JSON.stringify(HERO_MINIMAL_DETAIL_FORTY_FIELDS)
    || scope.nameLabelStatus !== 'PROJECT_REVIEWED' || scope.officialKrProvenanceStatus !== 'unverified'
    || JSON.stringify(scope.claimProvenance) !== JSON.stringify(expectedClaimProvenance)
    || JSON.stringify(scope.heroes) !== JSON.stringify(expectedHeroes)
    || JSON.stringify(scope.preservedPopulations) !== JSON.stringify({heroIndex:267,fullHeroDetail:29,equipmentNavigation:167,minimalDetailBefore:98,minimalDetailAfter:138,heroDetailTargets:29,minimalDetailTargets:138,heroIndexTargets:0})
    || JSON.stringify(scope.excluded) !== JSON.stringify(['New Semantic Admission','Canonical, Evidence, or Raw ConfigData mutation','Legacy Repository mutation','Other Hero or Equipment publication','Asset or Portrait','Unverified statistics or additional Domains'])
    || decision.effect.effective !== true
    || decision.effect.condition !== 'Only the forty exact approved Hero and Equipment pairs, five approved fields, and corresponding P-A, P-B, and P-C targets may change; existing ninety-eight Minimal Detail Heroes, twenty-nine Full Detail Heroes, 267 Hero Index entries, and all other Equipment targets are preserved.'
    || decision.effect.reviewWhen !== 'Re-review if an approved ID, pair, field, source, surface, target, limitation, or preserved population changes.') throw new Error('Forty-Hero publication approval or exact scope is invalid');
  return decision;
}

export function renderHeroMinimalDetailFortyBatch({decision,heroIdentities,heroLocalizations,relations,equipmentIdentities,equipmentLocalizations,sourceHashes}) {
  validateHeroMinimalDetailFortyBatchPublication(decision);
  for (const [key, expected] of Object.entries(expectedSources)) if (sourceHashes?.[key] !== expected) throw new Error(`Forty-Hero Canonical source hash changed: ${key}`);
  for (const [value,label] of [[heroIdentities,'Hero Identity'],[heroLocalizations,'Hero Localization'],[relations,'Relation'],[equipmentIdentities,'Equipment Identity'],[equipmentLocalizations,'Equipment Localization']]) if (value?.schemaVersion !== 1 || !Array.isArray(value.records)) throw new Error(`Unsupported ${label} input`);
  const one=(rows,predicate,label)=>{const found=rows.filter(predicate);if(found.length!==1)throw new Error(`${label} must resolve exactly once`);return found[0];};
  const heroes=HERO_MINIMAL_DETAIL_FORTY_BATCH.map(({heroId,equipmentId,nameKo,equipmentNameKo})=>{
    one(heroIdentities.records,({heroId:id})=>id===heroId,`Hero ${heroId} Identity`);
    const loc=one(heroLocalizations.records,({heroId:id})=>id===heroId,`Hero ${heroId} Localization`);
    if(loc.nameKo!==nameKo)throw new Error(`Hero ${heroId} Korean name differs from approved label`);
    const relation=one(relations.records,({heroId:id,equipmentId:id2})=>id===heroId&&id2===equipmentId,`Hero ${heroId} relation`);
    if(relations.records.filter(({heroId:id})=>id===heroId).length!==1||relations.records.filter(({equipmentId:id})=>id===equipmentId).length!==1
      ||JSON.stringify(relation.provenance)!==JSON.stringify([{sourceKind:'EQUIPMENT_SKILL_HERO',table:'ConfigDataEquipmentInfo',recordId:equipmentId,field:'SkillHero',value:heroId}]))throw new Error(`Hero ${heroId} relation is not the exact admitted source field`);
    one(equipmentIdentities.records,({equipmentId:id})=>id===equipmentId,`Equipment ${equipmentId} Identity`);
    const eq=one(equipmentLocalizations.records,({equipmentId:id})=>id===equipmentId,`Equipment ${equipmentId} Localization`);
    if(eq.nameKo!==equipmentNameKo||!eq.effectDescriptionKo?.trim())throw new Error(`Equipment ${equipmentId} localization differs from approved display value`);
    return {heroId,nameKo:loc.nameKo,exclusiveEquipment:{equipmentId,nameKo:eq.nameKo,effectDescriptionKo:eq.effectDescriptionKo}};
  });
  return `${JSON.stringify({schemaVersion:1,heroes},null,2)}\n`;
}

export function validateHeroMinimalDetailFortyBatch({generatedText,inputs}) {
  const expected=renderHeroMinimalDetailFortyBatch(inputs);if(generatedText!==expected)throw new Error('Generated forty-Hero Minimal Detail Consumer is stale or non-deterministic');
  const data=JSON.parse(generatedText);exactKeys(data,['schemaVersion','heroes'],'Generated forty-Hero Consumer');
  if(data.schemaVersion!==1||data.heroes.length!==40||JSON.stringify(data.heroes.map(x=>x.heroId))!==JSON.stringify(HERO_MINIMAL_DETAIL_FORTY_BATCH.map(x=>x.heroId)))throw new Error('Generated forty-Hero population mismatch');
  if(new Set(data.heroes.map(x=>x.heroId)).size!==40||new Set(data.heroes.map(x=>x.exclusiveEquipment.equipmentId)).size!==40)throw new Error('Generated forty-Hero Consumer contains duplicate IDs');
  for(const row of data.heroes){exactKeys(row,['heroId','nameKo','exclusiveEquipment'],`Hero ${row.heroId}`);exactKeys(row.exclusiveEquipment,['equipmentId','nameKo','effectDescriptionKo'],`Equipment ${row.exclusiveEquipment.equipmentId}`);if(!row.exclusiveEquipment.effectDescriptionKo.trim())throw new Error('Missing approved equipment effect');}
  return data;
}
