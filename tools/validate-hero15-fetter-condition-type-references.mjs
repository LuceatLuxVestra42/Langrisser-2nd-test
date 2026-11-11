import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const E='evidence/source/bonds/hero15-fetter-condition-type-references.v1.json';
const C='canonical/hero-fetter-condition-type-references.v1.json';
const DUMP_BLOB='201bc8004792d13c52a26afc79f73e5ed8d1c2ac';
const MAP={
 REGULAR_FETTER:{namespace:'BlackJack.ConfigData.FetterCompleteConditionType',field:'CompletionConditions',endpointNamespace:'ConfigDataHeroFetterInfo.ID',enum:{1:'FetterCompleteConditionType_HeroFavorabilityLevel',2:'FetterCompleteConditionType_Mission'}},
 HEART_FETTER:{namespace:'BlackJack.ConfigData.HeroHeartFetterUnlockConditionType',field:'UnlockConditions',endpointNamespace:'ConfigDataHeroHeartFetterInfo.ID',enum:{1:'HeroHeartFetterUnlockConditionType_HeroFetterLevel',2:'HeroHeartFetterUnlockConditionType_HeroLevel'}},
};
const check=(v,m)=>{if(!v)throw new Error(m);};
const exact=(a,b,m)=>assert.deepEqual(a,b,m);
export function validateHero15FetterConditionTypeReferencesData({evidence,canonical,fetterDetails,heartDetails,references,heartConditions}){
 check(evidence.schemaVersion===1&&evidence.claimType==='hero15-fetter-condition-type-enum-references','Condition type evidence contract mismatch');
 check(evidence.source.repository==='LuceatLuxVestra42/langrisser-future-guide'&&evidence.source.commit==='6475e63ee23d18adf733756c26a14fa9e3ed662c'&&evidence.source.tree==='08e1e6c2773730e60b258940e31494f68d65f86a'&&evidence.source.blobSha1===DUMP_BLOB,'Frozen enum metadata pin mismatch');
 check(evidence.source.sha256==='15f2030df8a0d3f9363adfe67113b01065eb70166c13a08f04a96d5e5edb2e31','Frozen enum metadata hash mismatch');
 exact(evidence.enumDefinitions,[
  {namespace:'BlackJack.ConfigData.FetterCompleteConditionType',typeName:'FetterCompleteConditionType',typeDefIndex:10674,locator:'data/metadata/dump.cs#L620633-L620643',members:{1:'FetterCompleteConditionType_HeroFavorabilityLevel',2:'FetterCompleteConditionType_Mission'}},
  {namespace:'BlackJack.ConfigData.HeroHeartFetterUnlockConditionType',typeName:'HeroHeartFetterUnlockConditionType',typeDefIndex:10707,locator:'data/metadata/dump.cs#L622328-L622337',members:{1:'HeroHeartFetterUnlockConditionType_HeroFetterLevel',2:'HeroHeartFetterUnlockConditionType_HeroLevel'}},
 ],'Enum source definitions mismatch');
 exact(evidence.messageFieldDefinitions,[
  {message:'BlackJack.ConfigData.HeroFetterCompletionCondition',typeDefIndex:10992,locator:'data/metadata/dump.cs#L640814-L640826',fields:{ConditionType:1,Parm1:2,Parm2:3}},
  {message:'BlackJack.ConfigData.HeroHeartFetterUnlockCondition',typeDefIndex:10996,locator:'data/metadata/dump.cs#L641077-L641084',fields:{ConditionType:1,Parm1:2}},
 ],'Message-field source definitions mismatch');
 exact(Object.keys(canonical).sort(),['records','schemaVersion','scope'].sort(),'Condition type canonical schema drift');
 check(canonical.schemaVersion===1&&canonical.records.length===11&&canonical.scope.includes('parameter interpretation')&&canonical.scope.includes('AND-OR'),'Condition type scope/count mismatch');
 const raw=[...fetterDetails.records.map((r,i)=>({r,kind:'REGULAR_FETTER',base:i,path:'evidence/source/bonds/hero15-fetter-raw-details.v1.json'})),...heartDetails.records.map((r,i)=>({r,kind:'HEART_FETTER',base:i,path:'evidence/source/bonds/hero15-heart-fetter-raw-details.v1.json'}))];
 check(raw.length===6&&references.records.length===6&&heartConditions.records.length===4,'Existing Fetter claim population regression');
 const expected=[];
 for(const {r,kind,base,path} of raw){const spec=MAP[kind];check(r.heroId===15&&Array.isArray(r.fields[spec.field]),`Condition field missing for ${r.sourceRecordLocator}`);for(let i=0;i<r.fields[spec.field].length;i++){const v=r.fields[spec.field][i];check(Object.hasOwn(spec.enum,v.ConditionType),`Unmapped source enum code ${v.ConditionType}`);expected.push({heroId:15,trackKind:kind,trackEndpointId:r.endpointId,trackEndpointNamespace:spec.endpointNamespace,sourceField:spec.field,sourceArrayIndex:i,sourceTypeField:'ConditionType',typeCode:v.ConditionType,typeEnumNamespace:spec.namespace,enumMember:spec.enum[v.ConditionType],rawConditionProvenance:`${path}#selection/records/${kind==='REGULAR_FETTER'?r.endpointId-66:base}/fields/${spec.field}/${i}`});}}
 exact(evidence.claims,expected,'Condition type evidence projection differs from admitted raw source fields');
 check(expected.length===11,'Expected condition reference count drift');
 for(const [i,row] of expected.entries())exact(canonical.records[i],{...row,evidenceProvenance:`${E}#claims/${i}`},`Condition type canonical/provenance mismatch ${i}`);
 check(!canonical.records.some(r=>Object.keys(r).some(k=>['predicate','andOr','evaluationRule','completionRule','publicationApproval'].includes(k))),'Runtime condition/publication semantics added');
 return {typeReferences:11,regularFetter:9,heartFetter:2,runtimePredicate:'NOT_ADMITTED',parameterSemantics:'NOT_ADMITTED',publication:false};
}
export async function validateHero15FetterConditionTypeReferences(root=process.cwd()){
 const read=async p=>JSON.parse(await readFile(resolve(root,p),'utf8'));
 const [evidence,canonical,fetterDetails,heartDetails,references,heartConditions]=await Promise.all([read(E),read(C),read('canonical/hero-fetter-raw-details.v1.json'),read('canonical/hero-heart-fetter-raw-details.v1.json'),read('canonical/hero-fetter-references.v1.json'),read('canonical/hero-heart-fetter-raw-conditions.v1.json')]);
 const result=validateHero15FetterConditionTypeReferencesData({evidence,canonical,fetterDetails,heartDetails,references,heartConditions});
 process.stdout.write('Hero 15 Fetter condition type enum references: PASS (11 type references; runtime predicates remain unadmitted)\n');return result;
}
if(process.argv[1]&&import.meta.url===new URL(`file://${process.argv[1]}`).href)await validateHero15FetterConditionTypeReferences();
