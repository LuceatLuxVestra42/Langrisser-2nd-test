import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

export const conditionPath = 'canonical/hero-heart-fetter-raw-conditions.v1.json';
export const heartSourcePath = 'evidence/source/bonds/hero16-heart-fetter-raw-conditions.v1.json';
export const heartDecisionPath = 'docs/decisions/hero-16-minimal-heart-fetter-effects-publication.v1.json';
const lianaSourcePath = 'evidence/source/bonds/hero15-heart-fetter-raw-conditions.v1.json';
const referencePath = 'canonical/hero-fetter-references.v1.json';
const oldScope = 'Hero 15 Heart Fetter Lv4/Lv7 raw source condition fields only; ConditionType and ConditionParam runtime meaning remains MANUAL_REVIEW; no unlock, reward, job-restriction, stat, effect, or publication admission.';

export const heartSkills = [
  [70225, 4, 405, 16416, 32652, '부대 생명이 100%일 시, 받는 피해 -10%'],
  [70226, 4, 306, 16417, 32653, '공격을 받아 전투 진입 시, 받는 마법 피해 -10%'],
  [70227, 7, 405, 16418, 32654, '부대 생명이 100%일 시, 주는 피해 +10%'],
  [70228, 7, 306, 16419, 32655, '부대 생명이 70% 미만일 시, 주는 피해 +10%'],
];
const sourcePins = {
  HeroInfo:'728daab3370f0c7779449663ea02e638677944d4', HeroInformationInfo:'49aef6be8ea1a65d5725c16a05dab94fffa73f92',
  HeroHeartFetterInfo:'be61dd6fb14662d70335e833c4c857dda5105f74', SkillInfo:'dbd7f8f94702bb43d2ceb0091e9755c9aebaed19',
  BuffInfo:'bc7d5c7e5b4ac68b5192955a76cd21b810f36982', JobInfo:'4cbcac591ff5bc8d7cf2dcbf971cf2465f0cb133',
  JobConnectionInfo:'cdad8d6fda6edd30c92fbcda53e0f63af1903139',
};
export function requireHeart(actual, expected, claim) {
  if (!isDeepStrictEqual(actual, expected)) throw new Error('Heart Fetter ' + claim);
}
export function lanceRawRows(source, references) {
  const {sources} = source;
  requireHeart([source.schemaVersion,source.repository,source.commit,source.conditionType7Meaning],
    [1,'LuceatLuxVestra42/langrisser-future-guide','6475e63ee23d18adf733756c26a14fa9e3ed662c','MANUAL_REVIEW'],'source snapshot');
  for (const [table,blob] of Object.entries(sourcePins)) {
    requireHeart([sources[table].path,sources[table].blob],['data/configdata/ConfigData'+table+'.json',blob],'source pin '+table);
  }
  const [hero] = sources.HeroInfo.records;
  const [info] = sources.HeroInformationInfo.records;
  const [heart] = sources.HeroHeartFetterInfo.records;
  requireHeart([hero.index,hero.fields.ID,hero.fields.HeroInformation_ID,info.index,info.fields.ID],[15,16,16,15,16],'Hero to HeroInformation FK');
  requireHeart([info.fields.HeroHeartFetterId,heart.index,heart.fields.ID],[16,14,16],'HeroInformation to Heart Fetter FK');
  const reference = references.records.filter(r => r.heroId === 16 && r.referenceKind === 'HERO_HEART_FETTER_ID_REFERENCE');
  requireHeart(reference.map(r => [r.heroInformationId,r.heartFetterId,r.sourceField,r.endpointNamespace]),
    [[16,16,'ConfigDataHeroInformationInfo.HeroHeartFetterId','ConfigDataHeroHeartFetterInfo.ID']],'missing Lance Heart Fetter 16 reference');
  requireHeart(heart.fields.UnlockSkills_ID, [...heartSkills.map(([SkillId,HeartFetterLevel]) => ({SkillId,HeartFetterLevel})),
    {SkillId:70110,HeartFetterLevel:10}],'UnlockSkills_ID level and Skill attribution');
  requireHeart([sources.SkillInfo.records.length,sources.BuffInfo.records.length],[4,4],'Skill and Buff population');
  return heartSkills.map(([id,level,job,skillIndex,buffIndex],i) => {
    const skill = sources.SkillInfo.records[i], buff = sources.BuffInfo.records[i];
    requireHeart([skill.index,skill.fields.ID,skill.fields.PassiveBuffs_ID],[skillIndex,id,[id]],'Skill to Buff link');
    requireHeart([buff.index,buff.fields],[buffIndex,{ID:id,ConditionType:7,ConditionParam:[job]}],'Buff condition attribution');
    return {heroId:hero.fields.ID,heartFetterId:heart.fields.ID,heartFetterLevel:level,skillId:skill.fields.ID,
      passiveBuffIds:skill.fields.PassiveBuffs_ID,conditions:[{conditionType:buff.fields.ConditionType,conditionParams:buff.fields.ConditionParam}],
      sourceProvenance:{heartFetterSourceIndex:i,skillSourceIndex:skill.index,passiveBuffSourceIndices:[buff.index]},
      sourceField:'ConfigDataBuffInfo.ConditionType+ConditionParam',provenance:heartSourcePath+'#/sources/HeroHeartFetterInfo/records/0/fields/UnlockSkills_ID/'+i};
  });
}

// Validate the complete document before returning the original Liana consumer input.
export function lianaHeartConditions(document, root) {
  const read = path => JSON.parse(readFileSync(resolve(root,path),'utf8'));
  const lance = lanceRawRows(read(heartSourcePath),read(referencePath));
  const liana = read(lianaSourcePath).claims.map(claim => ({...claim,sourceField:'ConfigDataBuffInfo.ConditionType+ConditionParam',
    provenance:lianaSourcePath+'#claims[skillId='+claim.skillId+']'}));
  requireHeart(liana.map(r=>r.skillId),[70421,70422,70423,70424],'Liana source order');
  requireHeart([document.schemaVersion,document.scope,document.records],
    [1,oldScope.replace('Hero 15','Heroes 15 and 16'),[...liana,...lance]],'shared eight-row scope, order or provenance');
  return {...document,scope:oldScope,records:document.records.slice(0,liana.length)};
}
