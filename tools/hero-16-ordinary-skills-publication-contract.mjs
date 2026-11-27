import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const ordinaryEvidence = 'evidence/source/configdata/hero-16-ordinary-skills.v1.json';
export const ordinaryCanonical = 'canonical/hero-16-ordinary-skills.v1.json';
export const ordinaryDecision = 'docs/decisions/hero-16-minimal-ordinary-skills-publication.v1.json';
export const ordinaryPublic = 'generated/hero-16-ordinary-skills-public.v1.json';
const approved = [
  { id:10401, name:'雷光', index:1862, connection:160, job:401, level:1602, cost:2, cd:'3回合', cooldown:'쿨 3턴',
    hash:'5f2262e391467ca876a139bcf3471bcd081ba92a2a2ffa9c30908a5bf678731e', ko:'뇌광',
    description:'단일 적 부대를 공격해 1.5배 피해를 준다. 이 스킬로 적을 처치하면 스킬 쿨타임 -3.' },
  { id:10311, name:'撞击', index:1852, connection:162, job:302, level:1622, cost:1, cd:'2回合', cooldown:'쿨 2턴',
    hash:'e45f9a67f22e48bfeb03c8ff0dffef7111905be292ccfeb55a7b210ac90e2593', ko:'격돌',
    description:'단일 적 부대를 공격해 1.2배 피해를 준다. 대상을 2칸 밀쳐내고 이동력 -2와 호위 불가를 1턴 부여한다.' },
];
const readJson = async (root, path) => JSON.parse(await readFile(resolve(root,path),'utf8'));

export async function readOrdinarySkillEvidence(root) {
  const e = await readJson(root, ordinaryEvidence);
  assert.equal(e.repository,'LuceatLuxVestra42/langrisser-future-guide');
  assert.equal(e.commit,'6475e63ee23d18adf733756c26a14fa9e3ed662c');
  assert.deepEqual(e.files, {
    JobConnection:{path:'data/configdata/ConfigDataJobConnectionInfo.json',blob:'cdad8d6fda6edd30c92fbcda53e0f63af1903139'},
    JobLevel:{path:'data/configdata/ConfigDataJobLevelInfo.json',blob:'e9c978f78a96372db6e7b142512b69a8d0ab3182'},
    Skill:{path:'data/configdata/ConfigDataSkillInfo.json',blob:'dbd7f8f94702bb43d2ceb0091e9755c9aebaed19'},
  });
  assert.deepEqual(e.connections, approved.map((r,i)=>({index:[104,106][i],ID:r.connection,Job_ID:r.job,'JobLevels_ID/1':r.level})), 'Lance ordinary JobConnection source mismatch');
  assert.deepEqual(e.levels,approved.map((r,i)=>({index:[599,609][i], ID:r.level, GotSkill_ID:r.id})), 'Lance ordinary GotSkill_ID source mismatch');
  assert.equal(e.skills.length,2);
  for (const [i,r] of approved.entries()) {
    const {Desc,...metadata} = e.skills[i];
    assert.equal(createHash('sha256').update(Desc,'utf8').digest('hex'),r.hash,'Lance ordinary Desc hash mismatch');
    assert.deepEqual(metadata,{index:r.index,ID:r.id,Name:r.name,TypeText:'物理伤害',SkillCost:r.cost,CDText:r.cd,DistanceText:'1格',RangeText:'单体'}, 'Lance ordinary Skill source mismatch');
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
  const expectedRecords = e.connections.map((c,i)=>{
    const jobRow = jobs.records.filter(r=>r.heroId===16 && r.jobId===c.Job_ID);
    const jobEvidenceIndex = c.ID===160 ? 0 : 1;
    assert.deepEqual(jobRow,[{heroId:16,jobId:c.Job_ID,provenance:`evidence/source/jobs/hero16-job-advancement-direct.v1.json#/connections/${jobEvidenceIndex}/Job_ID`}], 'Lance ordinary Job membership mismatch');
    const level = e.levels.find(r=>r.ID===c['JobLevels_ID/1']);
    const skill = e.skills.find(r=>r.ID===level.GotSkill_ID);
    const {TypeText,SkillCost,CDText,DistanceText,RangeText} = skill;
    return {heroId:16,connectionId:c.ID,jobId:c.Job_ID,jobLevelIndex:1,jobLevelId:level.ID,skillId:skill.ID,TypeText,SkillCost,CDText,DistanceText,RangeText,
      provenance:{connection:`${ordinaryEvidence}#/connections/${i}`,acquisition:`${ordinaryEvidence}#/levels/${i}/GotSkill_ID`,metadata:`${ordinaryEvidence}#/skills/${i}`}};
  });
  assert.deepEqual(canonical,{schemaVersion:1,heroId:16,records:expectedRecords},'Lance ordinary acquisition or metadata mismatch');
  assert.deepEqual(identities.records.filter(row=>approved.some(r=>r.id===row.skillId)),ordinaryIdentities(e),'Lance ordinary Skill identity mismatch');
  const {approval,localization,corroboration,...scope} = decision;
  assert.ok(approval?.source && approval?.basis,'Lance ordinary approval reference missing');
  assert.deepEqual(scope,{schemaVersion:1,status:'APPROVED',surface:'hero-minimal-detail-16',heroId:16,publicPath:ordinaryPublic,
    placement:'after-talent',displayStatus:'PROJECT_DISPLAY_ONLY',officialKrProvenanceStatus:'unverified',
    rows:approved.map(r=>({skillId:r.id,nameKo:r.ko,descriptionKo:r.description}))},'Lance ordinary publication scope mismatch');
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
  return {schemaVersion:1,heroId:16,surface:scope.surface,officialKrProvenanceStatus:scope.officialKrProvenanceStatus,
    ordinarySkills:canonical.records.map((row,i)=>({
      skillId:row.skillId,nameKo:scope.rows[i].nameKo,typeLabelKo:'물리 피해',cost:row.SkillCost,cooldownLabelKo:approved[i].cooldown,
      distanceLabelKo:'사거리 1칸',areaLabelKo:'범위 단일',descriptionKo:scope.rows[i].descriptionKo,
    }))};
}

export function validateOrdinaryPublic(text, expected) {
  const doc = JSON.parse(text);
  assert.deepEqual(Object.keys(doc).sort(),Object.keys(expected).sort(),'Lance ordinary public root fields');
  assert.equal(doc.ordinarySkills.length,2,'Lance ordinary public row count');
  for (const row of doc.ordinarySkills) assert.deepEqual(Object.keys(row).sort(),Object.keys(expected.ordinarySkills[0]).sort(),'Lance ordinary public row fields');
  assert.deepEqual(doc,expected,'Lance ordinary public values');
  assert.equal(text,JSON.stringify(expected,null,2)+'\n','Lance ordinary public bytes');
}
