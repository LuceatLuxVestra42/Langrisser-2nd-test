import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

const evidencePath='evidence/source/jobs/hero15-job-skill-references.v1.json';
const identityEvidencePath='evidence/source/configdata/ConfigDataSkillInfo.records-hero-15-general-skills.v1.json';
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
export async function validateHero15SkillReferences(root=process.cwd()){
 const [e,idEvidence,canonical,skillsCanon,heroJobs,rawStats,advancement,talent]=await Promise.all([
  read(root,evidencePath),read(root,identityEvidencePath),read(root,canonicalPath),read(root,'canonical/skills.v1.json'),read(root,'canonical/hero-job-relations.v1.json'),read(root,'canonical/hero-job-level-raw-stats.v1.json'),read(root,'canonical/hero-job-advancement-relations.v1.json'),read(root,'canonical/hero-talent-star-skills.v1.json')
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
 check(skillsCanon.records.length===51&&skills.length===9,'SKILL_ENDPOINT','Expected Skill Identity endpoint set changed');
 check(heroJobs.records.filter(r=>r.heroId===15).length===6&&isDeepStrictEqual(heroJobs.records.filter(r=>r.heroId===15).map(r=>r.jobId),[802,803,806,703,811,707]),'HERO_JOB_PARITY','Hero 15 Job membership changed');
 const stats15=rawStats.records.filter(r=>r.heroId===15);
 check(stats15.length===25,'JOBLEVEL_BASELINE','Hero 15 existing JobLevel raw-stat population changed');
 const statsIds=new Set(stats15.map(r=>r.jobLevelId));
 check(advancement.records.filter(r=>r.heroId===15).length===5,'ADVANCEMENT_BASELINE','Hero 15 direct advancement population changed');
 check(talent.records.length===12,'TALENT_BASELINE','Existing Talent reference population changed');
 const expectedCanonical=[];
 expectedCanonical.push({referenceKind:'HERO_DIRECT_SKILL_REFERENCE',heroId:15,skillId:10801,sourceField:'ConfigDataHeroInfo.Skills_ID',endpointNamespace:'ConfigDataSkillInfo.ID',provenance:{reference:`${evidencePath}#references/0`,endpoint:'canonical/skills.v1.json#skillId=10801'}});
 for(let i=0;i<jobRefs.length;i++){
  const [cid,jid,lid,sid]=jobRefs[i];
  expectedCanonical.push({referenceKind:'JOB_LEVEL_SKILL_ACQUISITION',heroId:15,jobConnectionId:cid,jobId:jid,jobLevelId:lid,skillId:sid,sourceField:'ConfigDataJobLevelInfo.GotSkill_ID',endpointNamespace:'ConfigDataSkillInfo.ID',provenance:{reference:`${evidencePath}#references/${i+1}`,endpoint:`canonical/skills.v1.json#skillId=${sid}`}});
 }
 exact(canonical,['schemaVersion','scope','records'],'Canonical');
 check(canonical.schemaVersion===1&&canonical.scope==='Hero 15 only: direct HeroInfo Skill_ID references and explicit JobLevelInfo GotSkill_ID acquisition references. No equipping, unlock condition, combat effect, or publication claim.'
  &&isDeepStrictEqual(canonical.records,expectedCanonical),'CANONICAL','Canonical references differ from independently pinned source references');
 for(const id of skills){check(idRows.has(id)&&skillRows.has(id),'SKILL_ENDPOINT',`SkillInfo endpoint ${id} missing`)}
 for(const r of expectedCanonical){
  if(r.referenceKind==='JOB_LEVEL_SKILL_ACQUISITION'){
   check(statsIds.has(r.jobLevelId),'JOBLEVEL_ENDPOINT',`JobLevel endpoint ${r.jobLevelId} missing from existing admitted set`);
   const s=stats15.find(x=>x.jobLevelId===r.jobLevelId);
   check(s?.jobConnectionId===r.jobConnectionId&&s?.jobId===r.jobId,'JOBLEVEL_CONTEXT',`JobLevel ${r.jobLevelId} maps to wrong Hero/Connection/Job context`);
  }
 }
 console.log(`Hero 15 Skill reference validation: PASS (references=9; HeroDirect=1; JobLevelGotSkill=8; SkillIdentityEndpoints=9; no publication)`);
}
if(process.argv[1]&&resolve(process.argv[1])===resolve('tools/validate-hero15-skill-references.mjs')) await validateHero15SkillReferences();
