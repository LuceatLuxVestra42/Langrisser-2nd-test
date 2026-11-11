import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const E='evidence/source/bonds/hero15-fetter-material-relations.v1.json';
const C='canonical/hero-fetter-material-relations.v1.json';
const SOURCE='fd34c0a83bd403c1fd01d34f3439e4c24a794f5e',SOURCE_HASH='99a037c766aeb9f1342f8033897d6786b88060126495fd201c0db1fcac761683';
const CONTRACT='5666c0c43c47205096c8c347f7055d45e1febef9',CONTRACT_HASH='66f1414f21f74295c450f78563717d7c737826f6f80c12663df294fa4b1ba93b';
const E_DIGEST='1079ba059fcc761af91d7030dccb3d649047506de52045e7f3c7f590b2e17a7d',C_DIGEST='db202d4f8995daf239935946f9112c7505058bd0ceacf383d06c83aff0bf375b';
const FETTER_RAW_DIGEST='3c366be2ae33a31e7cc32a452cbc7a7ffa0eed5bac26438773b57224749a0e2f',HEART_RAW_DIGEST='97b08ea508c274a30d1e9a7c28e83d37100d4e5b468a529a30ebcbd2bb5fe492';
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const check=(x,m)=>{if(!x)throw new Error(m)},exact=(a,b,m)=>check(JSON.stringify(a)===JSON.stringify(b),m);
const matKey=x=>`${x.endpointKind}:${x.endpointId}:${x.sourceArrayIndex}`;
const goldKey=x=>`${x.endpointKind}:${x.endpointId}:${x.targetLevel}`;
export function validateHero15FetterMaterialRelationsData({evidence,canonical,fetterDetails,heartDetails,references,conditions}){
 check(evidence.schemaVersion===1&&evidence.claimType==='hero15-fetter-material-and-gold-locators'&&evidence.evidenceClass==='A','Material evidence contract drift');
 check(evidence.source.repository==='LuceatLuxVestra42/langrisser-future-guide'&&evidence.source.commit==='6475e63ee23d18adf733756c26a14fa9e3ed662c'&&evidence.source.gitTree==='08e1e6c2773730e60b258940e31494f68d65f86a','Source snapshot drift');
 check(evidence.source.itemInfo.path==='data/configdata/ConfigDataItemInfo.json'&&evidence.source.itemInfo.blobSha1===SOURCE&&evidence.source.itemInfo.sha256===SOURCE_HASH&&evidence.source.itemInfo.recordCount===2250,'ItemInfo source pin drift');
 const lc=evidence.legacyContract;check(lc.path==='data/contracts/hero-bond-level-materials.v1.json'&&lc.blobSha1===CONTRACT&&lc.sha256===CONTRACT_HASH&&lc.observedHead==='57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff','Legacy cost contract pin drift');
 check(lc.sourcePackContract.sourceCommitSha===evidence.source.commit&&lc.sourcePackContract.logicalSourceRoot==='data/configdata','Legacy source-pack scope mismatch');
 exact(lc.costPolicy,{maxLevel:10,targetLevels:[2,3,4,5,6,7,8,9,10],gold:'LevelUpGold[targetLevel-2]',materials:'explicit LevelUpMaterials rows grouped by Level; preserve ItemType, ItemId, Count',skillLocator:'regular gotSkillIds[targetLevel-1] or HeartFetter HeroHeartFetterSkills[targetLevel-1]; locator only, no effect reinterpretation',totals:'sum explicit level costs only'},'Legacy cost policy drift');
 check(JSON.stringify(lc.relationContract).includes('cost ItemType=6 + ItemId -> ConfigDataItemInfo.ID'),'Legacy Item namespace relation absent');
 check(evidence.legacyValidation.status==='PASS'&&evidence.legacyValidation.population.regularFetterRefs===1335&&evidence.legacyValidation.population.heartFetterRefs===267,'Legacy validation scope drift');
 const claims=evidence.claims;check(sha(claims)===E_DIGEST,'Material evidence projection changed');
 check(claims.materials.length===104&&claims.itemEndpoints.length===18&&claims.goldLocators.length===54,'Material claim population drift');
 exact(Object.keys(canonical).sort(),['goldLocators','itemEndpoints','materials','schemaVersion','scope'].sort(),'Material canonical schema');
 check(canonical.schemaVersion===1&&canonical.materials?.length===104&&canonical.goldLocators?.length===54&&canonical.itemEndpoints?.length===18,'Material canonical population drift');
 check(sha(canonical.materials.concat(canonical.goldLocators,canonical.itemEndpoints))===C_DIGEST,'Material canonical projection changed');
 check(fetterDetails.records.length===5&&heartDetails.records.length===1&&references.records.length===6&&conditions.records.length===4,'Existing Fetter/Heart claims changed');
 check(sha(fetterDetails.records)===FETTER_RAW_DIGEST&&sha(heartDetails.records)===HEART_RAW_DIGEST,'Existing raw detail Claim regression');
 const detailMap=new Map([...fetterDetails.records.map(r=>[`FETTER:${r.endpointId}`,r]),...heartDetails.records.map(r=>[`HEART_FETTER:${r.endpointId}`,r])]);
 const itemMap=new Map(claims.itemEndpoints.map(r=>[r.itemId,r]));check(itemMap.size===18,'duplicate ItemInfo endpoints');
 for(const r of claims.itemEndpoints){check(r.recordLocator===`ConfigDataItemInfo#ID=${r.itemId}`&&r.fields.ID===r.itemId&&Number.isInteger(r.recordIndex)&&r.recordIndex>=0,'ItemInfo endpoint locator drift');check(typeof r.fields.Name==='string'&&typeof r.fields.Desc==='string'&&typeof r.fields.Icon==='string','ItemInfo endpoint metadata missing');}
 const canItems=new Map(canonical.itemEndpoints.map(r=>[r.itemId,r]));check(canItems.size===18,'duplicate canonical ItemInfo endpoint');
 for(let i=0;i<claims.itemEndpoints.length;i++){const e=claims.itemEndpoints[i],c=canonical.itemEndpoints[i];check(c.itemType===6&&c.itemId===e.itemId&&c.endpointNamespace==='ConfigDataItemInfo.ID'&&c.sourceRecordLocator===e.recordLocator&&c.evidenceProvenance===`${E}#claims/itemEndpoints/${i}`,'Item endpoint canonical provenance drift');}
 for(let i=0;i<claims.materials.length;i++){const e=claims.materials[i],c=canonical.materials[i];check(JSON.stringify(e)===JSON.stringify(c),'Material relation evidence/canonical parity drift');const d=detailMap.get(`${e.endpointKind}:${e.endpointId}`);check(d&&d.sourceRecordLocator===e.sourceRecordLocator,'Material Fetter endpoint mismatch');const row=d.fields.LevelUpMaterials[e.sourceArrayIndex];check(row&&row.Level===e.targetLevel&&row.ItemType===e.itemType&&row.ItemId===e.itemId&&row.Count>0,'Material raw row parity mismatch');check(e.itemType===6&&itemMap.has(e.itemId),'ItemType/ItemId endpoint unresolved');}
 for(let i=0;i<claims.goldLocators.length;i++){const e=claims.goldLocators[i],c=canonical.goldLocators[i];check(JSON.stringify(e)===JSON.stringify(c),'Gold locator evidence/canonical parity drift');const d=detailMap.get(`${e.endpointKind}:${e.endpointId}`);check(d&&d.sourceRecordLocator===e.sourceRecordLocator,'Gold Fetter endpoint mismatch');check(e.targetLevel>=2&&e.targetLevel<=10&&e.sourceArrayIndex===e.targetLevel-2&&e.locatorRule==='LevelUpGold[targetLevel-2]','Gold level/index locator mismatch');check(Number.isSafeInteger(d.fields.LevelUpGold[e.sourceArrayIndex]),'Gold locator outside source array');}
 check(evidence.limitations.some(x=>x.includes('actual item consumption'))&&evidence.limitations.some(x=>x.includes('No Fetter UI')),'Material semantic/publication boundary missing');
 return {materialRows:104,itemEndpoints:18,goldLocators:54,legacyPolicy:'REUSED_PINNED',itemConsumption:'NOT_ADMITTED',goldDeduction:'NOT_ADMITTED',publication:false};
}
export async function validateHero15FetterMaterialRelations(root=process.cwd()){const read=async p=>JSON.parse(await readFile(resolve(root,p),'utf8'));const [e,c,f,h,r,k]=await Promise.all([read(E),read(C),read('canonical/hero-fetter-raw-details.v1.json'),read('canonical/hero-heart-fetter-raw-details.v1.json'),read('canonical/hero-fetter-references.v1.json'),read('canonical/hero-heart-fetter-raw-conditions.v1.json')]);const out=validateHero15FetterMaterialRelationsData({evidence:e,canonical:c,fetterDetails:f,heartDetails:h,references:r,conditions:k});process.stdout.write('Hero 15 Fetter material endpoints and gold locators: PASS (104 rows; 18 ItemInfo endpoints; 54 LevelUpGold locators; no runtime cost/publication claims)\n');return out;}
if(process.argv[1]&&import.meta.url===new URL(`file://${process.argv[1]}`).href)await validateHero15FetterMaterialRelations();
