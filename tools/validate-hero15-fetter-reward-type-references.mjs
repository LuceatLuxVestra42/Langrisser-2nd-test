import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const E='evidence/source/bonds/hero15-fetter-reward-type-references.v1.json';
const C='canonical/hero-fetter-reward-type-references.v1.json';
const check=(v,m)=>{if(!v)throw new Error(m);};
export function validateHero15FetterRewardTypeReferencesData({evidence,canonical,fetterDetails,references,heartConditions}){
 check(evidence.schemaVersion===1&&evidence.claimType==='hero15-fetter-reward-goods-type-enum-references','Reward type evidence contract mismatch');
 check(evidence.source.repository==='LuceatLuxVestra42/langrisser-future-guide'&&evidence.source.commit==='6475e63ee23d18adf733756c26a14fa9e3ed662c'&&evidence.source.tree==='08e1e6c2773730e60b258940e31494f68d65f86a','Frozen Reward source snapshot mismatch');
 check(evidence.source.dump.blobSha1==='201bc8004792d13c52a26afc79f73e5ed8d1c2ac'&&evidence.source.dump.sha256==='15f2030df8a0d3f9363adfe67113b01065eb70166c13a08f04a96d5e5edb2e31','GoodsType metadata pin mismatch');
 check(evidence.source.heroFetterInfo.blobSha1==='1beec024e3d82e57923e59c70048c5abefd92d06'&&evidence.source.heroFetterInfo.sha256==='1c058ddd7ad2fd038e8fae73391aafa85b3dea4fe49868a2c834a490497172a6','Fetter source pin mismatch');
 assert.deepEqual(evidence.typeDefinitions,
  {goodsMessage:{namespace:'BlackJack.ConfigData.Goods',typeDefIndex:10824,locator:'data/metadata/dump.cs#L630667-L630677',fields:{GoodsType:1,Id:2,Count:3}},goodsTypeEnum:{namespace:'BlackJack.ConfigData.GoodsType',typeDefIndex:10701,locator:'data/metadata/dump.cs#L621948-L621959',members:{1:'GoodsType_Gold',2:'GoodsType_Crystal'}}},'Goods message/enum source definitions mismatch');
 assert.deepEqual(Object.keys(canonical).sort(),['records','schemaVersion','scope'].sort(),'Reward type canonical schema drift');
 check(canonical.schemaVersion===1&&canonical.records.length===5&&canonical.scope.includes('no reward identity')&&canonical.scope.includes('payout'),'Reward type scope/population mismatch');
 check(fetterDetails.records.length===5&&references.records.length===6&&heartConditions.records.length===4,'Existing Fetter population regression');
 const expected=fetterDetails.records.map((r,i)=>{check(r.heroId===15&&r.endpointId===66+i&&r.endpointNamespace==='ConfigDataHeroFetterInfo.ID','Unexpected Fetter endpoint');check(Array.isArray(r.fields.Reward)&&r.fields.Reward.length===1&&r.fields.Reward[0].GoodsType===2,'Raw Reward GoodsType mismatch');return {heroId:15,fetterEndpointId:r.endpointId,fetterEndpointNamespace:'ConfigDataHeroFetterInfo.ID',sourceField:'Reward',sourceArrayIndex:0,sourceTypeField:'GoodsType',goodsTypeCode:2,typeEnumNamespace:'BlackJack.ConfigData.GoodsType',enumMember:'GoodsType_Crystal',rawRewardProvenance:`evidence/source/bonds/hero15-fetter-raw-details.v1.json#selection/records/${i}/fields/Reward/0/GoodsType`};});
 assert.deepEqual(evidence.claims,expected,'Reward type evidence differs from admitted raw Reward fields');
 for(const [i,row] of expected.entries())assert.deepEqual(canonical.records[i],{...row,evidenceProvenance:`${E}#claims/${i}`},`Reward type Canonical/provenance mismatch ${i}`);
 check(!canonical.records.some(r=>['rewardId','itemId','count','payout','deliveryRule','rewardGrantedAt','publicationApproval'].some(k=>Object.hasOwn(r,k))),'Reward identity/payout semantics added');
 return {rewardTypeReferences:5,enumNamespace:'BlackJack.ConfigData.GoodsType',goodsTypeCode:2,enumMember:'GoodsType_Crystal',rewardIdentity:'NOT_ADMITTED',payoutSemantics:'NOT_ADMITTED',publication:false};
}
export async function validateHero15FetterRewardTypeReferences(root=process.cwd()){
 const read=async p=>JSON.parse(await readFile(resolve(root,p),'utf8'));
 const [evidence,canonical,fetterDetails,references,heartConditions]=await Promise.all([read(E),read(C),read('canonical/hero-fetter-raw-details.v1.json'),read('canonical/hero-fetter-references.v1.json'),read('canonical/hero-heart-fetter-raw-conditions.v1.json')]);
 const result=validateHero15FetterRewardTypeReferencesData({evidence,canonical,fetterDetails,references,heartConditions});
 process.stdout.write('Hero 15 Fetter reward GoodsType references: PASS (5 enum references; no payout semantics)\n');return result;
}
if(process.argv[1]&&import.meta.url===new URL(`file://${process.argv[1]}`).href)await validateHero15FetterRewardTypeReferences();
