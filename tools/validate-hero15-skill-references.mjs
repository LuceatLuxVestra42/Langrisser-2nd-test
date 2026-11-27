import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

const evidencePath='evidence/source/jobs/hero15-job-skill-references.v1.json';
const identityEvidencePath='evidence/source/configdata/ConfigDataSkillInfo.records-hero-15-general-skills.v1.json';
const centralEvidencePath='evidence/source/configdata/hero-15-central-discipline-skill.v1.json';
const canonicalPath='canonical/hero-skill-references.v1.json';
const check=(v,code,msg)=>{if(!v)throw new Error(`Hero 15 Skill reference validation failed [${code}]: ${msg}`)};
const exact=(v,keys,label)=>check(v&&typeof v==='object'&&!Array.isArray(v)&&isDeepStrictEqual(Object.keys(v).sort(),[...keys].sort()),'SCHEMA',`${label} fields drift`);
const read=async(root,path)=>JSON.parse(await readFile(resolve(root,path),'utf8'));
const jobRefs=[
 [150,802,1502,10816,569], [151,803,1512,10805,574], [152,806,1522,10707,579], [153,703,1532,10705,584],
 [154,811,1541,10804,588], [154,811,1543,10807,590], [155,707,1551,6009,593], [155,707,1553,11786,595],
];
const connections=[[150,802,[1501,1502,1503]],[151,803,[1511,1512,1513,1514]],[152,806,[1521,1522,1523,1524]],[153,703,[1531,1532,1533,1534]],[154,811,[1541,1542,1543,1544,1545]],[155,707,[1551,1552,1553,1554,1555]]];
const skills=[10801,10816,10805,10707,10705,10804,10807,6009,11786];

export const lanceCentralEvidence = 'evidence/source/configdata/hero-16-central-discipline-skill.v1.json';
export const lanceDescDigest = '51dfe79791536a5903dd527027c97dc855ad2c9c15c8795a905380482009dc34';
export const sharedSkillReferenceScope = 'Hero 15: direct HeroInfo Skills_ID, JobLevelInfo GotSkill_ID, and HeroInfo CastingLawSkill_ID references; Hero 16: CastingLawSkill_ID reference only. No equipping, unlock condition, combat effect, or publication claim.';

export function lanceCentralSource(evidence) {
  const { source, heroInfo, skillInfo } = evidence;
  if (evidence.schemaVersion !== 1 || source.repository !== 'LuceatLuxVestra42/langrisser-future-guide'
      || source.commit !== '6475e63ee23d18adf733756c26a14fa9e3ed662c'
      || source.tree !== '08e1e6c2773730e60b258940e31494f68d65f86a'
      || heroInfo.sha256 !== '2385599493d2598aa3f7d6b2c76ecdfd8615d91f19b6241933986282fcb17f7b'
      || skillInfo.sha256 !== '2ff6d67e8c010037597928bccd2dc7b4b9abc0d2a78c9705d816c8218df3e741'
      || heroInfo.path !== 'data/configdata/ConfigDataHeroInfo.json' || heroInfo.locator !== '#/15'
      || heroInfo.gitBlobSha1 !== '728daab3370f0c7779449663ea02e638677944d4'
      || skillInfo.path !== 'data/configdata/ConfigDataSkillInfo.json' || skillInfo.locator !== '#/20260'
      || skillInfo.gitBlobSha1 !== 'dbd7f8f94702bb43d2ceb0091e9755c9aebaed19') throw new Error('Lance central source locator mismatch');
  if (!isDeepStrictEqual(heroInfo.rawRecord, { ID: 16, CastingLawSkill_ID: 90092 })) throw new Error('Lance central source FK mismatch');
  const { ID, Name, Desc } = skillInfo.rawRecord;
  if (!isDeepStrictEqual(Object.keys(skillInfo.rawRecord).sort(), ['Desc', 'ID', 'Name'])
      || ID !== heroInfo.rawRecord.CastingLawSkill_ID || Name !== '长驰锐骑'
      || createHash('sha256').update(Desc).digest('hex') !== lanceDescDigest) throw new Error('Lance central source identity mismatch');
  const locator = lanceCentralEvidence + '#skillInfo/rawRecord';
  return {
    reference: {
      heroId: heroInfo.rawRecord.ID, skillId: ID, referenceKind: 'HERO_CENTRAL_DISCIPLINE_SKILL_REFERENCE',
      sourceField: 'ConfigDataHeroInfo.CastingLawSkill_ID', endpointNamespace: 'ConfigDataSkillInfo.ID',
      provenance: { reference: lanceCentralEvidence + '#heroInfo/rawRecord/CastingLawSkill_ID', endpoint: 'canonical/skills.v1.json#skillId=' + ID },
    },
    identity: { skillId: ID, nameCn: Name, descriptionCn: Desc,
      provenance: { identity: locator + '/ID', name: locator + '/Name', description: locator + '/Desc' } },
  };
}

export function expectedLianaSkillReferences() {
 const expectedCanonical=[];
 expectedCanonical.push({referenceKind:'HERO_DIRECT_SKILL_REFERENCE',heroId:15,skillId:10801,sourceField:'ConfigDataHeroInfo.Skills_ID',endpointNamespace:'ConfigDataSkillInfo.ID',provenance:{reference:`${evidencePath}#references/0`,endpoint:'canonical/skills.v1.json#skillId=10801'}});
 for(let i=0;i<jobRefs.length;i++){
  const [cid,jid,lid,sid]=jobRefs[i];
  expectedCanonical.push({referenceKind:'JOB_LEVEL_SKILL_ACQUISITION',heroId:15,jobConnectionId:cid,jobId:jid,jobLevelId:lid,skillId:sid,sourceField:'ConfigDataJobLevelInfo.GotSkill_ID',endpointNamespace:'ConfigDataSkillInfo.ID',provenance:{reference:`${evidencePath}#references/${i+1}`,endpoint:`canonical/skills.v1.json#skillId=${sid}`}});
 }
 expectedCanonical.push({
  referenceKind:'HERO_CENTRAL_DISCIPLINE_SKILL_REFERENCE',heroId:15,skillId:90089,
  sourceField:'ConfigDataHeroInfo.CastingLawSkill_ID',endpointNamespace:'ConfigDataSkillInfo.ID',
  provenance:{reference:`${centralEvidencePath}#heroInfo/rawRecord/CastingLawSkill_ID`,endpoint:`canonical/skills.v1.json#skillId=90089`}
 });
 return expectedCanonical;
}

export async function validateHero15SkillReferences(root=process.cwd()){
 const [e,idEvidence,canonical,skillsCanon,heroJobs,rawStats,advancement,talent,centralEvidence,heroIdentities]=await Promise.all([
  read(root,evidencePath),read(root,identityEvidencePath),read(root,canonicalPath),read(root,'canonical/skills.v1.json'),read(root,'canonical/hero-job-relations.v1.json'),read(root,'canonical/hero-job-level-raw-stats.v1.json'),read(root,'canonical/hero-job-advancement-relations.v1.json'),read(root,'canonical/hero-talent-star-skills.v1.json'),
  read(root,centralEvidencePath),read(root,'canonical/hero-identities.v1.json')
 ]);
 exact(e,['schemaVersion','responsibility','scope','sourceSnapshot','protobufFieldContract','meaningEvidence','heroInfoSource','jobConnectionEndpointSource','jobLevelSource','references','endpointNamespace','endpointEvidencePath','claimEvidence','canonical','generated','publicationApproval','productionRuntimeDependency'],'Evidence');
 check(e.schemaVersion===1&&e.responsibility==='hero15-skill-source-references','EVIDENCE','Evidence owner/scope drift');
 check(e.scope?.heroId===15&&e.scope?.claim==='Direct HeroInfo Skill_ID reference plus JobLevelInfo GotSkill_ID references for explicitly related Hero 15 JobConnections 150–155.','SCOPE','Hero reference scope drift');
 check(isDeepStrictEqual(e.sourceSnapshot,{commit:'6475e63ee23d18adf733756c26a14fa9e3ed662c',tree:'08e1e6c2773730e60b258940e31494f68d65f86a'}),'SOURCE_PIN','Pinned source snapshot changed');
 check(e.protobufFieldContract?.path==='data/metadata/dump.cs'&&e.protobufFieldContract.gitBlobSha1==='201bc8004792d13c52a26afc79f73e5ed8d1c2ac'
  &&e.protobufFieldContract.sha256==='15f2030df8a0d3f9363adfe67113b01065eb70166c13a08f04a96d5e5edb2e31'
  &&e.protobufFieldContract.heroInfoSkillsIdFieldNumber===19&&e.protobufFieldContract.jobLevelGotSkillIdFieldNumber===28&&e.protobufFieldContract.skillInfoIdFieldNumber===2,
  'FIELD_CONTRACT','Protobuf field namespace/number pin changed');
 check(e.meaningEvidence?.predecessorContract?.path==='data/hero-skill-acquisition-stage4-4.v1.json'
  &&e.meaningEvidence.predecessorContract.gitBlobSha1==='afdabed9f82a401f50ed344e5ee4877bbc024f9c'
  &&e.meaningEvidence.predecessorContract.status==='validated-review','MEANING','Source meaning contract changed');
 const hp=e.heroInfoSource;
 check(hp?.repository==='LuceatLuxVestra42/langrisser-future-guide'&&hp.commit===e.sourceSnapshot.commit&&hp.tree===e.sourceSnapshot.tree
  &&hp.path==='data/configdata/ConfigDataHeroInfo.json'&&hp.gitBlobSha1==='728daab3370f0c7779449663ea02e638677944d4'
  &&hp.sha256==='2385599493d2598aa3f7d6b2c76ecdfd8615d91f19b6241933986282fcb17f7b'
  &&hp.sourceRecordIndex===14&&hp.recordLocator.endsWith('#ID=15')
  &&isDeepStrictEqual(hp.selectedFields,{ID:15,Skills_ID:[10801]}),'HERO_SOURCE','Hero direct reference source changed');
 const connEvidence=e.jobConnectionEndpointSource;
 check(connEvidence?.evidencePath==='evidence/source/configdata/ConfigDataJobConnectionInfo.records-hero-15-job-level-raw-stats.v1.json'
  &&connEvidence.source?.gitBlobSha1==='cdad8d6fda6edd30c92fbcda53e0f63af1903139','CONNECTION_ENDPOINT','JobConnection source pin changed');
 check(Array.isArray(connEvidence.records)&&isDeepStrictEqual(connEvidence.records.map(r=>[r.ID,r.Job_ID,r.JobLevels_ID]),connections),'CONNECTION_ENDPOINT','Hero 15 Connection→Job/Level endpoints changed');
 const levelSource=e.jobLevelSource;
 check(levelSource?.repository==='LuceatLuxVestra42/langrisser-future-guide'&&levelSource.commit===e.sourceSnapshot.commit&&levelSource.tree===e.sourceSnapshot.tree
  &&levelSource.path==='data/configdata/ConfigDataJobLevelInfo.json'&&levelSource.gitBlobSha1==='e9c978f78a96372db6e7b142512b69a8d0ab3182'
  &&levelSource.sha256==='0f02531a2b4244683b6a56f7d7b8ce607bf454f324a45312f20569983d2ed948'
  &&levelSource.fieldNumber===28,'JOBLEVEL_SOURCE','JobLevel source pin changed');
 check(Array.isArray(levelSource.selectedRecords)&&levelSource.selectedRecords.length===8,'JOBLEVEL_RECORDS','Expected exactly eight nonzero GotSkill_ID records');
 check(Array.isArray(e.references)&&e.references.length===9,'REFERENCE_COUNT','Expected one HeroInfo and eight JobLevel references');
 const heroRef=e.references[0];
 check(isDeepStrictEqual(heroRef,{referenceKind:'HERO_DIRECT_SKILL_REFERENCE',heroId:15,skillId:10801,sourceRecordLocator:'data/configdata/ConfigDataHeroInfo.json#ID=15',fieldLocator:'data/configdata/ConfigDataHeroInfo.json#arrayIndex=14/Skills_ID[0]',fieldNumber:19}),'HERO_REFERENCE','Direct Hero reference changed');
 for(let i=0;i<jobRefs.length;i++){
  const [cid,jid,lid,sid,index]=jobRefs[i], row=e.references[i+1], selected=levelSource.selectedRecords[i];
  check(row.referenceKind===undefined,'REFERENCE_SCHEMA','Job reference unexpectedly contains unrecognized fields');
  exact(row,['heroId','jobConnectionId','jobId','jobLevelId','skillId','sourceRecordIndex','sourceRecordLocator','fieldLocator'],'Job reference evidence');
  check(row.heroId===15&&row.jobConnectionId===cid&&row.jobId===jid&&row.jobLevelId===lid&&row.skillId===sid&&row.sourceRecordIndex===index
   &&row.sourceRecordLocator===`data/configdata/ConfigDataJobLevelInfo.json#ID=${lid}`
   &&row.fieldLocator===`data/configdata/ConfigDataJobLevelInfo.json#arrayIndex=${index}/GotSkill_ID`
   &&selected.sourceRecordIndex===index&&selected.sourceRecordLocator===row.sourceRecordLocator
   &&isDeepStrictEqual(selected.rawRecord,{ID:lid,GotSkill_ID:sid})&&selected.fieldLocator===row.fieldLocator,
   'JOBLEVEL_REFERENCE',`JobLevel reference ${lid} differs from exact Source projection`);
  check(connections.find(c=>c[0]===cid)[2].includes(lid),'JOBLEVEL_CONTEXT',`JobLevel ${lid} is not included by Connection ${cid}`);
 }
 check(e.endpointNamespace==='ConfigDataSkillInfo.ID'&&e.endpointEvidencePath===identityEvidencePath,'SKILL_NAMESPACE','Skill endpoint namespace changed');
 check(e.canonical===false&&e.generated===false&&e.publicationApproval===false&&e.productionRuntimeDependency===false,'BOUNDARY','Evidence cannot approve/publicize or runtime-depend');
 const idRows=new Map(idEvidence.records.map(r=>[r.rawRecord.ID,r.rawRecord]));
 const skillRows=new Map(skillsCanon.records.map(r=>[r.skillId,r]));
 check(skillsCanon.records.length>=51&&skills.length===9,'SKILL_ENDPOINT','Skill Identity endpoints for the nine existing Hero 15 references are unavailable');
 check(heroJobs.records.filter(r=>r.heroId===15).length===6&&isDeepStrictEqual(heroJobs.records.filter(r=>r.heroId===15).map(r=>r.jobId),[802,803,806,703,811,707]),'HERO_JOB_PARITY','Hero 15 Job membership changed');
 const stats15=rawStats.records.filter(r=>r.heroId===15);
 check(stats15.length===25,'JOBLEVEL_BASELINE','Hero 15 existing JobLevel raw-stat population changed');
 const statsIds=new Set(stats15.map(r=>r.jobLevelId));
 check(advancement.records.filter(r=>r.heroId===15).length===5,'ADVANCEMENT_BASELINE','Hero 15 direct advancement population changed');
 check(talent.records.filter(r=>[6,8,15].includes(r.heroId)).length===12,'TALENT_BASELINE','Existing Talent reference population changed');
 exact(centralEvidence,['schemaVersion','source','heroInfo','skillInfo','fieldContract','predecessorResolver','claimEvidence','transformation','scope','limitation','productionRuntimeDependency'],'Central Discipline Evidence');
 const { heroInfo, skillInfo, fieldContract, predecessorResolver } = centralEvidence;
 check(centralEvidence.schemaVersion===1
  && isDeepStrictEqual(centralEvidence.source,{repository:hp.repository,commit:hp.commit,tree:hp.tree,snapshotDate:'2026-09-02T01:45:21Z'})
  && isDeepStrictEqual(heroInfo,{
   path:hp.path,gitBlobSha1:hp.gitBlobSha1,sha256:hp.sha256,sourceRecordIndex:14,recordLocator:hp.recordLocator,
   fieldLocator:`${hp.recordLocator}/CastingLawSkill_ID`,rawRecord:{ID:15,CastingLawSkill_ID:90089}
  }),'CENTRAL_SOURCE','HeroInfo CastingLawSkill_ID evidence or source pin changed');
 check(isDeepStrictEqual(fieldContract,{
  path:e.protobufFieldContract.path,gitBlobSha1:e.protobufFieldContract.gitBlobSha1,sha256:e.protobufFieldContract.sha256,
  heroInfoCastingLawSkillIdFieldNumber:39,skillInfoIdFieldNumber:e.protobufFieldContract.skillInfoIdFieldNumber
 }) && isDeepStrictEqual(predecessorResolver,{
  commit:'57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff',path:'scripts/build_hero_stage5_2_exclusive_central.cjs',
  gitBlobSha1:'6b2937145f44e10a36435572be0385d76bae0c8d',locator:'centralDiscipline.resolver',
  namespace:'ConfigDataHeroInfo.CastingLawSkill_ID -> ConfigDataSkillInfo.ID'
 }) && isDeepStrictEqual(centralEvidence.claimEvidence,{sourceFields:'A',endpointNamespace:'B'})
  && centralEvidence.productionRuntimeDependency===false,'CENTRAL_NAMESPACE','Field or resolver contract changed');
 const { ID: heroId, CastingLawSkill_ID: centralSkillId } = heroInfo.rawRecord;
 check(heroIdentities.records.filter((row)=>row.heroId===heroId).length===1
  && skillInfo.rawRecord.ID===centralSkillId
  && skillsCanon.records.filter((row)=>row.skillId===centralSkillId).length===1,
  'CENTRAL_ENDPOINT','Hero or Skill Identity endpoint missing, duplicated, or mismatched');
 const expectedCanonical = expectedLianaSkillReferences();
 const lance = lanceCentralSource(await read(root, lanceCentralEvidence));
 check(heroIdentities.records.filter(row => row.heroId === lance.reference.heroId).length === 1 && skillRows.has(lance.reference.skillId), 'CENTRAL_ENDPOINT', 'Lance central discipline endpoint missing');
 expectedCanonical.push(lance.reference);
 exact(canonical,['schemaVersion','scope','records'],'Canonical');
 check(canonical.schemaVersion===1&&canonical.scope===sharedSkillReferenceScope
  &&isDeepStrictEqual(canonical.records,expectedCanonical),'CANONICAL','Canonical references differ from independently pinned source references');
 for(const id of skills){check(idRows.has(id)&&skillRows.has(id),'SKILL_ENDPOINT',`SkillInfo endpoint ${id} missing`)}
 for(const r of expectedCanonical){
  if(r.referenceKind==='JOB_LEVEL_SKILL_ACQUISITION'){
   check(statsIds.has(r.jobLevelId),'JOBLEVEL_ENDPOINT',`JobLevel endpoint ${r.jobLevelId} missing from existing admitted set`);
   const s=stats15.find(x=>x.jobLevelId===r.jobLevelId);
   check(s?.jobConnectionId===r.jobConnectionId&&s?.jobId===r.jobId,'JOBLEVEL_CONTEXT',`JobLevel ${r.jobLevelId} maps to wrong Hero/Connection/Job context`);
  }
 }
 console.log('Hero 15 Skill reference validation: PASS (references=11; HeroDirect=1; JobLevelGotSkill=8; CentralDiscipline=2; no publication)');
}
if(process.argv[1]&&resolve(process.argv[1])===resolve('tools/validate-hero15-skill-references.mjs')) await validateHero15SkillReferences();
