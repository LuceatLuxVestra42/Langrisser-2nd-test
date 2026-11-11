import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateHero15FetterRewardTypeReferencesData } from './validate-hero15-fetter-reward-type-references.mjs';
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const [evidence,canonical,fetterDetails,references,heartConditions]=await Promise.all([read('evidence/source/bonds/hero15-fetter-reward-type-references.v1.json'),read('canonical/hero-fetter-reward-type-references.v1.json'),read('canonical/hero-fetter-raw-details.v1.json'),read('canonical/hero-fetter-references.v1.json'),read('canonical/hero-heart-fetter-raw-conditions.v1.json')]);
const fresh=()=>({evidence:structuredClone(evidence),canonical:structuredClone(canonical),fetterDetails:structuredClone(fetterDetails),references:structuredClone(references),heartConditions:structuredClone(heartConditions)});
assert.deepEqual(validateHero15FetterRewardTypeReferencesData(fresh()),{rewardTypeReferences:5,enumNamespace:'BlackJack.ConfigData.GoodsType',goodsTypeCode:2,enumMember:'GoodsType_Crystal',rewardIdentity:'NOT_ADMITTED',payoutSemantics:'NOT_ADMITTED',publication:false});
const cases=[
 [d=>d.evidence.source.dump.blobSha1='0'.repeat(40),'dump blob'],[d=>d.evidence.source.dump.sha256='0'.repeat(64),'dump hash'],[d=>d.evidence.source.heroFetterInfo.blobSha1='0'.repeat(40),'Fetter source blob'],[d=>d.evidence.typeDefinitions.goodsMessage.fields.GoodsType=3,'Goods field namespace'],[d=>d.evidence.typeDefinitions.goodsTypeEnum.members['2']='invented','enum member definition'],
 [d=>d.evidence.claims[0].fetterEndpointId=67,'Fetter endpoint'],[d=>d.evidence.claims[0].sourceArrayIndex++,'Reward array locator'],[d=>d.evidence.claims[0].goodsTypeCode=1,'GoodsType code'],[d=>d.evidence.claims[0].typeEnumNamespace='ConfigDataItemInfo.ID','enum namespace'],[d=>d.evidence.claims.pop(),'missing Reward relation'],[d=>d.evidence.claims.reverse(),'source order'],
 [d=>d.canonical.records[0].evidenceProvenance='wrong','provenance'],[d=>d.canonical.records[0].rewardId=100,'invented Reward ID'],[d=>d.canonical.records[0].payout=true,'payout rule'],[d=>d.canonical.records[0].count=15,'count semantic duplication'],[d=>d.fetterDetails.records[0].fields.Reward[0].GoodsType=1,'raw Reward field change'],[d=>d.references.records.pop(),'existing Fetter references'],[d=>d.heartConditions.records.pop(),'existing Heart conditions']
];
for(const [mutate,label] of cases){const d=fresh();mutate(d);assert.throws(()=>validateHero15FetterRewardTypeReferencesData(d),undefined,`must reject ${label}`);}
console.log(`Hero 15 Fetter reward type negative controls: PASS (${cases.length})`);
