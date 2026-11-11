import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const E='evidence/source/bonds/hero15-heart-fetter-raw-details.v1.json',C='canonical/hero-heart-fetter-raw-details.v1.json';
const SOURCE='be61dd6fb14662d70335e833c4c857dda5105f74',SOURCE_HASH='7a150f7fd0658ffc9b05d68b8131a677290ab67710f97a22c4e4c4d78ea42b8a';
const E_DIGEST='52ee4e47d363a68fd8e731ada77e6fecf5e6e49a5932e81dd56dfad3dde9c1bd',C_DIGEST='97b08ea508c274a30d1e9a7c28e83d37100d4e5b468a529a30ebcbd2bb5fe492';
const FIELDS=['MaxLevel','UnlockConditions','HeroHeartFetterSkills','LevelUpMaterials','LevelUpGold','ShownSkillCount'];
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex'),check=(x,m)=>{if(!x)throw new Error(m)},exact=(a,b,m)=>check(JSON.stringify(a)===JSON.stringify(b),m);
export function validateHero15HeartFetterRawDetailsData({evidence,canonical,references,conditions}){
 check(evidence.schemaVersion===1&&evidence.claimType==='hero15-heart-fetter-raw-details'&&evidence.evidenceClass==='A','Heart Fetter detail evidence contract drift');
 exact(evidence.scope,{heroId:15,heartFetterId:15,sourceFields:FIELDS.map(x=>`ConfigDataHeroHeartFetterInfo.${x}`)},'Heart Fetter detail scope drift');
 check(evidence.source.repository==='LuceatLuxVestra42/langrisser-future-guide'&&evidence.source.commit==='6475e63ee23d18adf733756c26a14fa9e3ed662c'&&evidence.source.tree==='08e1e6c2773730e60b258940e31494f68d65f86a'&&evidence.source.path==='data/configdata/ConfigDataHeroHeartFetterInfo.json'&&evidence.source.blobSha1===SOURCE&&evidence.source.sha256===SOURCE_HASH&&evidence.source.recordCount===286,'Heart Fetter source pin drift');
 const rows=evidence.selection?.records;check(Array.isArray(rows)&&sha(rows)===E_DIGEST,'Heart Fetter evidence raw projection changed');
 check(rows.length===1&&rows[0].recordId===15&&rows[0].recordIndex===13&&rows[0].recordLocator==='ConfigDataHeroHeartFetterInfo#ID=15','Heart Fetter record locator drift');
 exact(Object.keys(rows[0].fields),FIELDS,'Heart Fetter raw fields');for(const f of FIELDS){check(rows[0].fieldStates[f]?.state==='PRESENT','Heart Fetter field presence drift');const v=rows[0].fields[f],t=Array.isArray(v)?'array':typeof v;check(rows[0].fieldStates[f].jsonType===t,`Heart Fetter ${f} type drift`);}
 check(evidence.selection.contextOnlyFields?.includes('UnlockSkills_ID')&&evidence.transformation?.sourceBytesCopied===false,'Heart Fetter duplicate-condition boundary drift');
 check(canonical.schemaVersion===1&&canonical.records?.length===1&&sha(canonical.records)===C_DIGEST,'Heart Fetter canonical population or values drift');
 const r=canonical.records[0],s=rows[0];check(r.detailKind==='HEART_FETTER_RAW_DETAIL'&&r.heroId===15&&r.endpointId===15&&r.endpointNamespace==='ConfigDataHeroHeartFetterInfo.ID'&&r.sourceRecordLocator===s.recordLocator&&r.provenance===`${E}#selection/records/0`,'Heart Fetter canonical endpoint/provenance drift');exact(r.fields,s.fields,'Heart Fetter canonical field parity drift');exact(r.fieldStates,s.fieldStates,'Heart Fetter field state parity drift');
 check(references.records?.length===6&&references.records[5].heartFetterId===15,'Existing Fetter references changed');
 check(conditions.records?.length===4&&conditions.records.map(x=>x.skillId).join(',')==='70421,70422,70423,70424','Existing Heart raw condition rows changed');
 check(evidence.limitations.some(x=>x.includes('MANUAL_REVIEW'))&&evidence.limitations.some(x=>x.includes('No ConditionType=7')),'Heart Fetter runtime boundary missing');
 return {endpoints:1,fields:FIELDS.length,existingRawConditionRows:4,conditionType7Meaning:'MANUAL_REVIEW',publication:false};
}
export async function validateHero15HeartFetterRawDetails(root=process.cwd()){const read=async p=>JSON.parse(await readFile(resolve(root,p),'utf8'));const [evidence,canonical,references,conditions]=await Promise.all([read(E),read(C),read('canonical/hero-fetter-references.v1.json'),read('canonical/hero-heart-fetter-raw-conditions.v1.json')]);const out=validateHero15HeartFetterRawDetailsData({evidence,canonical,references,conditions});process.stdout.write('Hero 15 Heart Fetter raw details: PASS (ID 15; six non-duplicate raw fields; Type 7 remains MANUAL_REVIEW)\n');return out;}
if(process.argv[1]&&import.meta.url===new URL(`file://${process.argv[1]}`).href)await validateHero15HeartFetterRawDetails();
