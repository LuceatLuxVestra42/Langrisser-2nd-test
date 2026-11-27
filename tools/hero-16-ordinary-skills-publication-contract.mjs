import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

export const ordinaryEvidence = 'evidence/source/configdata/hero-16-ordinary-skills.v1.json';
export const ordinaryCanonical = 'canonical/hero-16-ordinary-skills.v1.json';
export const ordinaryDecision = 'docs/decisions/hero-16-minimal-ordinary-skills-publication.v1.json';
export const ordinaryPublic = 'generated/hero-16-ordinary-skills-public.v1.json';
export const ordinaryPublicV2 = 'generated/hero-16-ordinary-skills-public.v2.json';
export const ordinaryDecisionV2 = 'docs/decisions/hero-16-minimal-ordinary-skills-publication.v2.json';
export const ordinaryPublicV3 = 'generated/hero-16-ordinary-skills-public.v3.json';
export const ordinaryDecisionV3 = 'docs/decisions/hero-16-minimal-ordinary-skills-publication.v3.json';
export const ordinaryPublicV4 = 'generated/hero-16-ordinary-skills-public.v4.json';
export const ordinaryDecisionV4 = 'docs/decisions/hero-16-minimal-ordinary-skills-publication.v4.json';
const original = [
  { id:10401, name:'雷光', index:1862, connection:160, job:401, level:1602, cost:2, cd:'3回合', cooldown:'쿨 3턴',
    hash:'5f2262e391467ca876a139bcf3471bcd081ba92a2a2ffa9c30908a5bf678731e', ko:'뇌광',
    description:'단일 적 부대를 공격해 1.5배 피해를 준다. 이 스킬로 적을 처치하면 스킬 쿨타임 -3.' },
  { id:10311, name:'撞击', index:1852, connection:162, job:302, level:1622, cost:1, cd:'2回合', cooldown:'쿨 2턴',
    hash:'e45f9a67f22e48bfeb03c8ff0dffef7111905be292ccfeb55a7b210ac90e2593', ko:'격돌',
    description:'단일 적 부대를 공격해 1.2배 피해를 준다. 대상을 2칸 밀쳐내고 이동력 -2와 호위 불가를 1턴 부여한다.' },
];
const added = [
  { id:10403, index:1864, name:'风语', type:'物理伤害', cost:2, cd:'2回合', distance:'自身', area:'1圈',
    hash:'8b2f6b3abcfb506eaa76e8d3668e451d55d014b97feaaacfd975b45dc232966e', ko:'바람의 분노',
    description:'주위 1칸 내 모든 적에게 0.3배 범위 피해를 주고 각 대상에게 무작위 디버프를 부여한다.' },
  { id:5025, index:1788, name:'急救', type:'治疗', cost:1, cd:'3回合', distance:'自身', area:'单体',
    hash:'2fbae47b4a62abc620ac97f0647fd0c0694373742a882e87dc6580841c6d19d9', ko:'구급',
    description:'자신 부대 생명 100% 회복.' },
  { id:10303, index:1844, name:'冲锋', type:'被动', cost:1, cd:'-', distance:'-', area:'-',
    hash:'4c33156224b60ac99590688c74b2fea45f596ee0dc4aaf1a4a2ee2c393f78555', ko:'돌진',
    description:'공격 전 이동 1칸마다 공격 +5%, 최대 +15%.' },
  { id:10305, index:1846, name:'攻击指挥', type:'被动', cost:2, cd:'-', distance:'-', area:'-',
    hash:'465e0aee8785dd2e7c9023ad1cb6bbef5c859dd448673b0305b51c026677f635', ko:'공격 지휘',
    description:'주위 2칸 내 모든 아군의 공격, 지력 +10%.' },
  { id:10105, index:1810, name:'防御威吓', type:'被动', cost:2, cd:'-', distance:'-', area:'-',
    hash:'f2bbc8e4958b465c337b28f52fcd23db0f9efcbd910a960f1cd2f1ff8a9b5b54', ko:'방어 위협',
    description:'행동 종료 시 주위 2칸 내 모든 적의 방어 -15%, 1턴 지속.' },
  { id:11819, index:3288, name:'帝国疾风', type:'超绝强化', cost:2, cd:'3回合', distance:'自身', area:'全场',
    hash:'48fb062a99a6c812d60ab5bc072da5c2723c074ce4c0800bde34c46dd43344a3', ko:'제국 질풍',
    description:"[초절강화] 범위 내 모든 '제국의 빛' 아군의 공격, 방어 능력치가 크게 상승한다. 4턴 지속. 다른 초절강화와 중첩되지 않는다." },
];
const approved = [...original.map(r=>({...r,type:'物理伤害',distance:'1格',area:'单体'})), ...added];
const jobSources = [
  { connection:160, job:401, level:1602, skill:10401, slot:1, ci:104, li:599, membership:'evidence/source/jobs/hero16-job-advancement-direct.v1.json#/connections/0/Job_ID' },
  { connection:162, job:302, level:1622, skill:10311, slot:1, ci:106, li:609, membership:'evidence/source/jobs/hero16-job-advancement-direct.v1.json#/connections/1/Job_ID' },
  { connection:163, job:202, level:1632, skill:5025, slot:1, ci:107, li:614, membership:'evidence/source/configdata/hero-16-talent.v1.json#/connections/3/Job_ID' },
  { connection:165, job:306, level:1653, skill:10303, slot:2, ci:109, li:625, membership:'evidence/source/configdata/hero-16-talent.v1.json#/connections/5/Job_ID' },
  { connection:165, job:306, level:1651, skill:10305, slot:0, ci:109, li:623, membership:'evidence/source/configdata/hero-16-talent.v1.json#/connections/5/Job_ID' },
  { connection:164, job:405, level:1643, skill:10105, slot:2, ci:108, li:620, membership:'evidence/source/configdata/hero-16-talent.v1.json#/connections/4/Job_ID' },
  { connection:164, job:405, level:1641, skill:11819, slot:0, ci:108, li:618, membership:'evidence/source/configdata/hero-16-talent.v1.json#/connections/4/Job_ID' },
];
const readJson = async (root, path) => JSON.parse(await readFile(resolve(root,path),'utf8'));

export async function readOrdinarySkillEvidence(root) {
  const e = await readJson(root, ordinaryEvidence);
  assert.equal(e.repository,'LuceatLuxVestra42/langrisser-future-guide');
  assert.equal(e.commit,'6475e63ee23d18adf733756c26a14fa9e3ed662c');
  assert.deepEqual(e.files, {
    Hero:{path:'data/configdata/ConfigDataHeroInfo.json',blob:'728daab3370f0c7779449663ea02e638677944d4'},
    JobConnection:{path:'data/configdata/ConfigDataJobConnectionInfo.json',blob:'cdad8d6fda6edd30c92fbcda53e0f63af1903139'},
    JobLevel:{path:'data/configdata/ConfigDataJobLevelInfo.json',blob:'e9c978f78a96372db6e7b142512b69a8d0ab3182'},
    Skill:{path:'data/configdata/ConfigDataSkillInfo.json',blob:'dbd7f8f94702bb43d2ceb0091e9755c9aebaed19'},
  });
  assert.deepEqual(e.hero,{index:15,ID:16,'Skills_ID/0':10403,'UseableJobConnections_ID/2':163,'UseableJobConnections_ID/3':164,'UseableJobConnections_ID/4':165},
    'Lance Hero 16 direct skill or usable connection source mismatch');
  const connections = new Map();
  for (const r of jobSources) {
    const expected = connections.get(r.connection) ?? {index:r.ci, ID:r.connection, Job_ID:r.job};
    const key = `JobLevels_ID/${r.slot}`;
    const actual = e.connections.find(row=>row.ID===r.connection);
    assert.equal(actual?.[key],r.level,`Skill ${r.skill} requires Connection ${r.connection} JobLevels_ID[${r.slot}]=${r.level}, found ${actual?.[key]}`);
    expected[key] = r.level;
    connections.set(r.connection,expected);
  }
  assert.deepEqual(e.connections,[...connections.values()],'Lance ordinary JobConnection source mismatch');
  assert.equal(e.levels.find(row => row.ID === 1641)?.GotSkill_ID,11819,'JobLevel 1641 must grant Skill 11819');
  assert.deepEqual(e.levels, jobSources.map(r=>({index:r.li, ID:r.level, GotSkill_ID:r.skill})), 'Lance ordinary GotSkill_ID source mismatch');
  assert.deepEqual(e.skills.map(r=>r.ID),approved.map(r=>r.id),'Lance ordinary Skill source locators');
  for (const r of approved) {
    const {Desc,...metadata} = e.skills.find(skill=>skill.ID===r.id);
    assert.equal(createHash('sha256').update(Desc,'utf8').digest('hex'),r.hash,'Lance ordinary Desc hash mismatch');
    assert.deepEqual(metadata,{index:r.index,ID:r.id,Name:r.name,TypeText:r.type,SkillCost:r.cost,CDText:r.cd,DistanceText:r.distance,RangeText:r.area},
      `Lance ordinary Skill ${r.id} source metadata`);
  }
  return e;
}

export function ordinaryIdentities(e) {
  return e.skills.map(({ID,Name,Desc},i)=>{
    const path = `${ordinaryEvidence}#/skills/${i}`;
    return {skillId:ID,nameCn:Name,descriptionCn:Desc,provenance:{identity:path+'/ID',name:path+'/Name',description:path+'/Desc'}};
  });
}

export async function generateOrdinarySkills(root=process.cwd()) {
  const [e, canonical, jobs, identities, decision] = await Promise.all([
    readOrdinarySkillEvidence(root), ...[ordinaryCanonical,'canonical/hero-job-relations.v1.json','canonical/skills.v1.json',ordinaryDecision].map(path=>readJson(root,path)),
  ]);
  for (const job of new Set(jobSources.map(r=>r.job))) {
    const references = jobSources.filter(r=>r.job===job);
    const members = jobs.records.filter(r=>r.heroId===16 && r.jobId===job);
    const missing = references.filter(r=>!isDeepStrictEqual(members,[{heroId:16,jobId:job,provenance:r.membership}]));
    if (missing.length) {
      const skills = missing.map(r=>r.skill).join('·');
      assert.fail(`${skills}의 Hero 16–Job ${job} 소속 누락 또는 출처 불일치`);
    }
  }
  const expectedRecords = e.skills.map((skill,skillIndex)=>{
    const {TypeText,SkillCost,CDText,DistanceText,RangeText} = skill;
    const metadata = {skillId:skill.ID,TypeText,SkillCost,CDText,DistanceText,RangeText};
    const source = `${ordinaryEvidence}#/skills/${skillIndex}`;
    if (skill.ID===e.hero['Skills_ID/0']) {
      return {heroId:e.hero.ID,...metadata,provenance:{acquisition:ordinaryEvidence+'#/hero/Skills_ID~10', metadata:source}};
    }
    const acquisition = jobSources.find(r=>r.skill===skill.ID);
    const ci = e.connections.findIndex(row=>row.ID===acquisition.connection);
    const connection = e.connections[ci];
    const li = e.levels.findIndex(row=>row.ID===connection[`JobLevels_ID/${acquisition.slot}`]);
    const level = e.levels[li];
    assert.equal(level.GotSkill_ID,skill.ID,'Lance ordinary acquisition link');
    return {heroId:16,connectionId:connection.ID,jobId:connection.Job_ID,jobLevelIndex:acquisition.slot,jobLevelId:level.ID,...metadata,
      provenance:{connection:`${ordinaryEvidence}#/connections/${ci}`,acquisition:`${ordinaryEvidence}#/levels/${li}/GotSkill_ID`,metadata:source}};
  });
  assert.deepEqual(canonical,{schemaVersion:1,heroId:16,records:expectedRecords},'Lance ordinary acquisition or metadata mismatch');
  assert.deepEqual(identities.records.filter(row=>approved.some(r=>r.id===row.skillId)),ordinaryIdentities(e),'Lance ordinary Skill identity mismatch');
  const {approval,localization,corroboration,...scope} = decision;
  assert.ok(approval?.source && approval?.basis,'Lance ordinary approval reference missing');
  assert.deepEqual(scope,{schemaVersion:1,status:'APPROVED',surface:'hero-minimal-detail-16',heroId:16,publicPath:ordinaryPublic,
    placement:'after-talent',displayStatus:'PROJECT_DISPLAY_ONLY',officialKrProvenanceStatus:'unverified',
    rows:original.map(r=>({skillId:r.id,nameKo:r.ko,descriptionKo:r.description}))},'Lance ordinary publication scope mismatch');
  const legacy = '57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff';
  assert.deepEqual(localization, {
    catalog: {repository:e.repository,commit:legacy,path:'src/lib/hero-skill-localization.data.ts',
      blob:'95f789c504394aee305e21bfab0d2be2612e205d',locator:'L248-L277; skillId + sourceNameCn'},
    sheet: {repository:'redpanda7301/langrisser',commit:'a85bba49dcf073563e7366dc18e96b7ba67c2ae3',path:'hero/data/란스.js',
      blob:'0be2f806f90c21507a814dc64057921c51b1bd2e',locator:['L421-L443','L501-L523']},
  }, 'Lance ordinary Korean display sources');
  assert.deepEqual(corroboration,{commit:legacy,path:'data/generated/hero-detail/by-id/16.json',locator:'/normal/skills/jobLevelAcquisitions/0,1',
    blob:'929798dd8019d033750e43d0af353869cc087a31',page:'https://luceatluxvestra42.github.io/langrisser-future-guide/heroes/16/'},
    'Lance ordinary Legacy display reference');
  function publicRow(id) {
    const row = canonical.records.find(r=>r.skillId===id);
    const display = approved.find(r=>r.id===id);
    const labels = row.TypeText==='被动' ? {} : {
      cooldownLabelKo:{'2回合':'쿨 2턴','3回合':'쿨 3턴'}[row.CDText],
      distanceLabelKo:{'自身':'사거리 자신','1格':'사거리 1칸'}[row.DistanceText],
      areaLabelKo:{'单体':'범위 단일','1圈':'범위 주위 1칸','全场':'범위 전체'}[row.RangeText],
    };
    return {skillId:id,nameKo:display.ko,typeLabelKo:{'被动':'패시브','治疗':'치료','物理伤害':'물리 피해','超绝强化':'초절강화'}[row.TypeText],
      cost:row.SkillCost,...labels,descriptionKo:display.description};
  }
  const v1 = {schemaVersion:1,heroId:16,surface:scope.surface,officialKrProvenanceStatus:scope.officialKrProvenanceStatus,
    ordinarySkills:scope.rows.map(r=>publicRow(r.skillId))};
  const decisionV2 = await readJson(root,ordinaryDecisionV2);
  const {approval:approvalV2,...scopeV2} = decisionV2;
  assert.ok(approvalV2?.source && approvalV2?.basis,'Lance v2 approval reference missing');
  const rows = [10403,10401,10311,5025,10303].map(publicRow);
  assert.deepEqual(scopeV2,{...scope,schemaVersion:2,publicPath:ordinaryPublicV2,rows,
    localization:{
      catalog:{...localization.catalog,locator:['10403 风语 L1312-L1317','10401 雷光, 10311 撞击 L248-L277','5025 急救 L568-L573','10303 冲锋 L680-L685']},
      sheet:{...localization.sheet,locator:['L395-L417','L421-L443','L501-L523','L555-L577','L541-L553']},
    },
    corroboration:{...corroboration,locator:['/normal/skills/heroDirectSkills/0',...([0,1,3,5].map(i=>'/normal/skills/jobLevelAcquisitions/'+i))]},
  },'Lance ordinary v2 publication scope mismatch');
  const {approval:approvalV3,...scopeV3} = await readJson(root,ordinaryDecisionV3);
  assert.ok(approvalV3?.source && approvalV3?.basis,'Lance v3 approval reference missing');
  const v3Rows = [10403,10401,10311,5025,10305,10303,10105].map(publicRow);
  const {catalog,sheet} = scopeV2.localization;
  assert.deepEqual(scopeV3,{...scopeV2,schemaVersion:3,publicPath:ordinaryPublicV3,rows:v3Rows,
    localization:{
      catalog:{...catalog,locator:[...catalog.locator,'10305 攻击指挥 L1304-L1309','10105 防御威吓 L712-L717']},
      sheet:{...sheet,locator:[...sheet.locator,'L527-L536','L487-L496']},
    },
    corroboration:{...scopeV2.corroboration,locator:[...scopeV2.corroboration.locator,
      '/normal/skills/jobLevelAcquisitions/4','/normal/skills/jobLevelAcquisitions/7']},
  },'Lance ordinary v3 publication scope mismatch');
  const {approval:approvalV4, rows:v4Rows, ...scopeV4} = await readJson(root,ordinaryDecisionV4);
  assert.ok(approvalV4?.source && approvalV4?.basis,'Lance v4 approval reference missing');
  assert.equal(scopeV4.heroId,16,'Lance v4 decision Hero');
  assert.equal(scopeV4.publicPath,ordinaryPublicV4,'Lance v4 decision public path');
  const {rows:priorRows, ...previousScope} = scopeV3;
  const expectedV4 = [...priorRows.slice(0,6),publicRow(11819),priorRows[6]];
  assert.deepEqual(v4Rows,expectedV4,'Lance v4 decision rows');
  assert.deepEqual(scopeV4,{...previousScope,schemaVersion:4,publicPath:ordinaryPublicV4,
    localization:{
      catalog:{...catalog,locator:[...scopeV3.localization.catalog.locator,'11819 帝国疾风 L2136-L2141']},
      sheet:{...sheet,locator:[...scopeV3.localization.sheet.locator,'L461-L483']},
    },
    corroboration:{...scopeV3.corroboration,locator:[...scopeV3.corroboration.locator,'/normal/skills/jobLevelAcquisitions/6']},
  },'Lance ordinary v4 publication scope mismatch');
  return {v1,v2:{...v1,schemaVersion:2,ordinarySkills:rows},v3:{...v1,schemaVersion:3,ordinarySkills:v3Rows},
    v4:{...v1,schemaVersion:4,ordinarySkills:expectedV4}};

}

export function validateOrdinaryPublic(text, expected) {
  const doc = JSON.parse(text);
  assert.deepEqual(Object.keys(doc).sort(),Object.keys(expected).sort(),'Lance ordinary public root fields');
  assert.equal(doc.ordinarySkills.length,expected.ordinarySkills.length,'Lance ordinary public row count');
  for (const [i,row] of doc.ordinarySkills.entries()) assert.deepEqual(Object.keys(row).sort(),Object.keys(expected.ordinarySkills[i]).sort(),'Lance ordinary public row fields');
  if (expected.schemaVersion===1) {
    assert.equal(createHash('sha256').update(text).digest('hex'),'99a7286ae79655c8351d67471baa0bc2b7001c41a8bb2d26b94f94bc3e404e06','Lance ordinary v1 digest');
    assert.equal(Buffer.byteLength(text),921,'Lance ordinary v1 length');
  }
  assert.deepEqual(doc,expected,'Lance ordinary public values');
  assert.equal(text,JSON.stringify(expected,null,2)+'\n','Lance ordinary public bytes');
}
