export const HERO_15_TALENT_PUBLICATION_PATH = 'docs/decisions/hero-15-talent-publication.v1.json';
export const HERO_15_TALENT_PUBLIC_PATH = 'generated/hero-15-talent-public.v1.json';
export const HERO_15_TALENT_APPROVAL_QUOTE = '나는 LuceatLuxVestra42/Langrisser-2nd-test에서 Hero 15의 일반 Talent를 기존 hero-minimal-detail-15 Minimal Detail 화면에만 표시하는 별도 Publication을 승인한다. 공개 범위는 Hero ID 15, Talent 한국어 이름 성결한 수녀, 3~6성 기존 Skill ID(3212, 3214, 3216, 3218), 각 한국어 설명, 현재 Hero 6·8 Talent 표시와 동일한 중국어 원문 이름·설명이다. 공식 한국 서버 표기를 주장하지 않고 공식 한국 Provenance는 unverified로 유지한다. Hero Full Detail 승격, Hero Index 변경, 다른 Hero의 Talent 공개, 새 Semantic 관계·전투 효과·획득 관계, 출시 상태 주장, 기존 Hero 15 통합 Publication Decision 변경은 승인하지 않는다.';
const expectedRows = [
  {star:3,skillId:3212,descriptionKoRaw:'행동 종료 시 주위 <font color="red">1칸</font> 내 다른 아군 부대 디버프 <font color="red">1개</font> 제거<br/> 동시에 자신 지력의 <font color="red">1.5배</font>만큼 회복.',nameCn:'圣洁的修女',descriptionCn:'行动结束时驱散<color=#DC143C>1</color>格内其他友军<color=#DC143C>1</color>个弱化效果并治疗生命值，治疗量为自身智力的<color=#DC143C>1.5</color>倍。'},
  {star:4,skillId:3214,descriptionKoRaw:'행동 종료 시 주위 <font color="red">2칸</font> 내 다른 아군 부대 디버프 <font color="red">1개</font> 제거<br/> 동시에 자신 지력의 <font color="red">2배</font>만큼 회복.',nameCn:'圣洁的修女',descriptionCn:'行动结束时驱散<color=#DC143C>2</color>格内其他友军<color=#DC143C>1</color>个弱化效果并治疗生命值，治疗量为自身智力的<color=#DC143C>2</color>倍。'},
  {star:5,skillId:3216,descriptionKoRaw:'행동 종료 시 주위 <font color="red">2칸</font> 내 다른 아군 부대 디버프 <font color="red">1개</font> 제거<br/> 동시에 자신 지력의 <font color="red">2.5배</font>만큼 회복.',nameCn:'圣洁的修女',descriptionCn:'行动结束时驱散<color=#DC143C>2</color>格内其他友军<color=#DC143C>1</color>个弱化效果并治疗生命值，治疗量为自身智力的<color=#DC143C>2.5</color>倍。'},
  {star:6,skillId:3218,descriptionKoRaw:'행동 종료 시 주위 <font color="red">2칸</font> 내 다른 아군 부대 디버프 <font color="red">2개</font> 제거<br/> 동시에 자신 지력의 <font color="red">3배</font>만큼 회복.',nameCn:'圣洁的修女',descriptionCn:'行动结束时驱散<color=#DC143C>2</color>格内其他友军<color=#DC143C>2</color>个弱化效果并治疗生命值，治疗量为自身智力的<color=#DC143C>3</color>倍。'},
];
const exact = (value, keys, label) => {
  if (!value || JSON.stringify(Object.keys(value).sort()) !== JSON.stringify([...keys].sort())) throw new Error(`${label} fields mismatch`);
};
export function validateHero15TalentDecision(d) {
  exact(d, ['schemaVersion','decisionType','status','approval','approvedScope','effect'], 'Talent Publication decision');
  exact(d.approval, ['approverRole','source','recordedAtDate'], 'Talent approval');
  exact(d.approval?.source, ['kind','quote','originalMessageIdOrUrl','contextVerified'], 'Talent approval source');
  exact(d.approvedScope, ['repository','baselineRef','baselineHead','heroId','surface','fields','officialKrProvenanceStatus','stars','canonicalSources','excluded'], 'Talent scope');
  exact(d.approvedScope?.canonicalSources, ['talentRelations','skills','localizations'], 'Talent Canonical sources');
  for (const [key, locator] of [['talentRelations','heroId=15&star=3..6'],['skills','skillId=3212,3214,3216,3218'],['localizations','heroId=15&star=3..6']]) {
    exact(d.approvedScope.canonicalSources[key], ['path','locator'], `${key} source`);
    const expectedPath = key === 'talentRelations' ? 'canonical/hero-talent-star-skills.v1.json' : key === 'skills' ? 'canonical/skills.v1.json' : 'canonical/hero-talent-localizations-ko.v1.json';
    if (d.approvedScope.canonicalSources[key].path !== expectedPath || d.approvedScope.canonicalSources[key].locator !== locator) throw new Error(`Talent ${key} provenance mismatch`);
  }
  exact(d.effect, ['effective','condition','reviewWhen'], 'Talent publication effect');
  const s = d.approvedScope;
  if (d.schemaVersion !== 1 || d.decisionType !== 'HERO_15_TALENT_PUBLICATION' || d.status !== 'APPROVED'
    || d.approval.approverRole !== 'USER' || d.approval.source.kind !== 'CURRENT_USER_MESSAGE'
    || d.approval.source.quote !== HERO_15_TALENT_APPROVAL_QUOTE || d.approval.source.originalMessageIdOrUrl !== 'NOT_AVAILABLE'
    || d.approval.source.contextVerified !== true || d.approval.recordedAtDate !== '2026-11-11'
    || s.repository !== 'LuceatLuxVestra42/Langrisser-2nd-test' || s.baselineRef !== 'main'
    || s.baselineHead !== '4e5cbabc703c8c76e8a1bcc6fb812c5ebe90d089' || s.heroId !== 15
    || s.surface !== 'hero-minimal-detail-15' || s.officialKrProvenanceStatus !== 'unverified'
    || JSON.stringify(s.fields) !== JSON.stringify(['heroId','talent.nameKo','talent.starDescriptions.star','talent.starDescriptions.skillId','talent.starDescriptions.descriptionKoRaw','talent.starDescriptions.nameCn','talent.starDescriptions.descriptionCn','officialKrProvenanceStatus'])
    || JSON.stringify(s.stars) !== JSON.stringify([{star:3,skillId:3212},{star:4,skillId:3214},{star:5,skillId:3216},{star:6,skillId:3218}])
    || JSON.stringify(s.excluded) !== JSON.stringify(['Hero Full Detail','Hero Index','other Hero Talent','new Semantic relation','battle-effect formula','skill acquisition/equip relation','release status','change to hero-15-integrated-publication.v1.json'])
    || d.effect.effective !== true) throw new Error('Hero 15 Talent Publication approval or exact scope invalid');
  return d;
}
export function renderHero15TalentPublic({ decision, talentRelations, skills, localizations }) {
  validateHero15TalentDecision(decision);
  if (talentRelations?.schemaVersion !== 1 || !Array.isArray(talentRelations.records)
    || skills?.schemaVersion !== 1 || !Array.isArray(skills.records)
    || localizations?.schemaVersion !== 1 || !Array.isArray(localizations.nameRecords) || !Array.isArray(localizations.descriptionRecords)
    || localizations.officialKrProvenanceStatus !== 'unverified') throw new Error('Hero 15 Talent Canonical inputs invalid');
  const relations = talentRelations.records.filter(r => r.heroId === 15);
  if (JSON.stringify(relations.map(({star,skillId})=>({star,skillId}))) !== JSON.stringify(decision.approvedScope.stars)
    || relations.some(r=>r.provenance!==`evidence/source/hero-talent-star-skills.v1.json#heroId=15&star=${r.star}`)) throw new Error('Hero 15 Talent relation endpoint or provenance mismatch');
  const name = localizations.nameRecords.filter(r => r.heroId === 15);
  if (name.length !== 1 || name[0].talentNameKo !== '성결한 수녀' || name[0].localizationStatus !== 'CONFIRMED_EXISTING_KR_REUSE' || name[0].reviewRequired !== false
    || name[0].provenance!=='evidence/source/hero-talent-localizations-ko.v1.json#heroId=15&claim=name') throw new Error('Hero 15 Talent Korean name or provenance mismatch');
  const rows = decision.approvedScope.stars.map(({star,skillId}) => {
    const locs = localizations.descriptionRecords.filter(r => r.heroId===15 && r.star===star);
    const skill = skills.records.filter(r=>r.skillId===skillId);
    if (locs.length!==1 || locs[0].skillId!==skillId || locs[0].localizationStatus!=='CONFIRMED_EXISTING_KR_REUSE' || locs[0].reviewRequired!==false
      || locs[0].provenance!==`evidence/source/hero-talent-localizations-ko.v1.json#heroId=15&star=${star}&skillId=${skillId}` || skill.length!==1) throw new Error(`Hero 15 Talent row mismatch ${star}`);
    const expected=expectedRows.find(r=>r.star===star);
    const row={ star, skillId, descriptionKoRaw: locs[0].descriptionKoRaw, nameCn: skill[0].nameCn, descriptionCn: skill[0].descriptionCn };
    const base=`evidence/source/configdata/ConfigDataSkillInfo.records-hero-15-talent-skills.v1.json#ID=${skillId}`;
    if (JSON.stringify(row)!==JSON.stringify(expected)
      || JSON.stringify(skill[0].provenance)!==JSON.stringify({identity:base,name:`${base}/Name`,description:`${base}/Desc`})) throw new Error(`Hero 15 Talent published fields or Skill provenance differ from approved claims (${star})`);
    return row;
  });
  return `${JSON.stringify({schemaVersion:1,surface:'hero-minimal-detail-15',heroId:15,officialKrProvenanceStatus:'unverified',talent:{nameKo:name[0].talentNameKo,starDescriptions:rows}},null,2)}\n`;
}
export function validateHero15TalentPublic({ generatedText, inputs }) {
  if (generatedText !== renderHero15TalentPublic(inputs)) throw new Error('Hero 15 Talent generated output is stale or non-deterministic');
  const x=JSON.parse(generatedText); exact(x,['schemaVersion','surface','heroId','officialKrProvenanceStatus','talent'],'Hero15 Talent output');
  exact(x.talent,['nameKo','starDescriptions'],'Hero15 Talent');
  if(x.heroId!==15||x.surface!=='hero-minimal-detail-15'||x.officialKrProvenanceStatus!=='unverified'||x.talent.starDescriptions.length!==4)throw new Error('Hero15 Talent output scope mismatch');
  for(const row of x.talent.starDescriptions) exact(row,['star','skillId','descriptionKoRaw','nameCn','descriptionCn'],'Hero15 Talent row');
  return x;
}
