import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const E='evidence/source/bonds/hero15-fetter-raw-details.v1.json';
const C='canonical/hero-fetter-raw-details.v1.json';
const SOURCE='1beec024e3d82e57923e59c70048c5abefd92d06';
const SOURCE_HASH='1c058ddd7ad2fd038e8fae73391aafa85b3dea4fe49868a2c834a490497172a6';
const E_DIGEST='caa691236af991731186903b32eb74f36186f59cb63c6d29b3ae208bec714e73';
const C_DIGEST='3c366be2ae33a31e7cc32a452cbc7a7ffa0eed5bac26438773b57224749a0e2f';
const FIELDS=['MaxLevel','CompletionConditions','Reward','GotSkills_ID','LevelUpMaterials','LevelUpGold'];
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const check=(x,m)=>{if(!x)throw new Error(m)};
const exact=(a,b,m)=>check(JSON.stringify(a)===JSON.stringify(b),m);
export function validateHero15FetterRawDetailsData({evidence,canonical,references}){
 check(evidence.schemaVersion===1&&evidence.claimType==='hero15-fetter-raw-details'&&evidence.evidenceClass==='A','Fetter detail evidence contract drift');
 exact(evidence.scope,{heroId:15,fetterIds:[66,67,68,69,70],sourceFields:FIELDS.map(x=>`ConfigDataHeroFetterInfo.${x}`)},'Fetter detail scope drift');
 check(evidence.source.repository==='LuceatLuxVestra42/langrisser-future-guide'&&evidence.source.commit==='6475e63ee23d18adf733756c26a14fa9e3ed662c'&&evidence.source.tree==='08e1e6c2773730e60b258940e31494f68d65f86a'&&evidence.source.path==='data/configdata/ConfigDataHeroFetterInfo.json'&&evidence.source.blobSha1===SOURCE&&evidence.source.sha256===SOURCE_HASH&&evidence.source.recordCount===1430,'Fetter detail source pin drift');
 const rows=evidence.selection?.records;check(Array.isArray(rows)&&sha(rows)===E_DIGEST,'Fetter evidence raw projection changed');
 check(JSON.stringify(rows.map(x=>[x.recordId,x.recordIndex,x.recordLocator]))===JSON.stringify([[66,65,'ConfigDataHeroFetterInfo#ID=66'],[67,66,'ConfigDataHeroFetterInfo#ID=67'],[68,67,'ConfigDataHeroFetterInfo#ID=68'],[69,68,'ConfigDataHeroFetterInfo#ID=69'],[70,69,'ConfigDataHeroFetterInfo#ID=70']]),'Fetter record locator set drift');
 for(const r of rows){exact(Object.keys(r.fields),FIELDS,`Fetter ${r.recordId} raw fields`);for(const f of FIELDS){check(r.fieldStates[f]?.state==='PRESENT','Fetter source field presence drift');const v=r.fields[f],t=Array.isArray(v)?'array':typeof v;check(r.fieldStates[f].jsonType===t,`Fetter ${r.recordId}.${f} JSON type drift`);}}
 check(evidence.transformation?.sourceBytesCopied===false&&evidence.transformation.kind==='claim-scoped-raw-field-projection','Fetter transformation drift');
 check(canonical.schemaVersion===1&&canonical.records?.length===5&&sha(canonical.records)===C_DIGEST,'Fetter canonical population or values drift');
 for(let i=0;i<rows.length;i++){const r=canonical.records[i];check(r.detailKind==='FETTER_RAW_DETAIL'&&r.heroId===15&&r.endpointId===rows[i].recordId&&r.endpointNamespace==='ConfigDataHeroFetterInfo.ID'&&r.sourceRecordLocator===rows[i].recordLocator&&r.provenance===`${E}#selection/records/${i}`,'Fetter canonical endpoint/provenance drift');exact(r.fields,rows[i].fields,'Fetter canonical field parity drift');exact(r.fieldStates,rows[i].fieldStates,'Fetter canonical field state parity drift');}
 check(references.records?.length===6&&references.records.filter(x=>x.referenceKind==='HERO_FETTER_ID_REFERENCE').map(x=>x.fetterId).join(',')==='66,67,68,69,70','Existing six Fetter references changed');
 check(evidence.limitations.some(x=>x.includes('no completion'))&&evidence.limitations.some(x=>x.includes('No Fetter UI')),'Fetter semantic/publication boundary missing');
 return {endpoints:5,fieldsPerEndpoint:6,sourcePin:SOURCE,gameplayRules:'NOT_ADMITTED',publication:false};
}
export async function validateHero15FetterRawDetails(root=process.cwd()){const read=async p=>JSON.parse(await readFile(resolve(root,p),'utf8'));const [evidence,canonical,references]=await Promise.all([read(E),read(C),read('canonical/hero-fetter-references.v1.json')]);const out=validateHero15FetterRawDetailsData({evidence,canonical,references});process.stdout.write('Hero 15 Fetter raw details: PASS (5 endpoints; six raw fields each; no gameplay rules/publication)\n');return out;}
if(process.argv[1]&&import.meta.url===new URL(`file://${process.argv[1]}`).href)await validateHero15FetterRawDetails();
