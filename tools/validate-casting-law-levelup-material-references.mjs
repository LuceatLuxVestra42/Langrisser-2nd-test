import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
const E='evidence/source/jobs/casting-law-levelup-material-references.v1.json';
const C='canonical/casting-law-levelup-material-references.v1.json';
const REL='canonical/casting-law-template-level-references.v1.json';
const PIN={repository:'LuceatLuxVestra42/langrisser-future-guide',commit:'6475e63ee23d18adf733756c26a14fa9e3ed662c',tree:'08e1e6c2773730e60b258940e31494f68d65f86a',configDataSubtree:'b18983f60cb054c2e6e094d64cdb98979211d7fc'};
const LEVEL={path:'data/configdata/ConfigDataCastingLawLevelUpInfo.json',blobSha1:'83b99ebff9c54523d7f9476b92e8b3d59229179f',sha256:'07b91384b3dab506d501d74b4e70b6535b84f5d620e0082c3e557afec146e849',byteLength:232171,recordCount:500,selectedFieldProjectionSha256:'498d835ca25ed66eb1a39532a5eb1fbb2e2cc36519c4ec7ca2a0b29226347f6a'};
const ITEM={path:'data/configdata/ConfigDataItemInfo.json',blobSha1:'fd34c0a83bd403c1fd01d34f3439e4c24a794f5e',sha256:'99a037c766aeb9f1342f8033897d6786b88060126495fd201c0db1fcac761683',byteLength:963728,recordCount:2250,endpointNamespace:'ConfigDataItemInfo.ID'};
const LEGACY={repository:'LuceatLuxVestra42/langrisser-future-guide',refCommit:'57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff',path:'data/contracts/hero-casting-law-materials.v1.json',blobSha1:'9a3b29dec4f594923b5fe6dd8508ae757a6d69f7',relationRule:'LevelupMaterialsCost[].GoodsType == 6: Id -> ConfigDataItemInfo.ID by explicit numeric equality',use:'Transformation precedent only; does not transfer Legacy status or admission.'};
const ITEM_ENDPOINTS=[[3267,458],[3281,472],[3295,486],[3308,499],[3309,500],[3310,501],[3265,456],[3279,470],[3293,484],[3270,461],[3284,475],[3298,489],[3273,464],[3287,478],[3301,492],[3274,465],[3288,479],[3302,493]].map(([itemId,sourceArrayIndex])=>({itemId,sourceArrayIndex,recordLocator:`ConfigDataItemInfo#ID=${itemId}`,fields:{ID:itemId}}));
const check=(x,c,m)=>{if(!x)throw new Error(`Casting Law LevelUp material reference validation failed [${c}]: ${m}`);};
const read=async(root,p)=>JSON.parse(await readFile(resolve(root,p),'utf8'));
const projectionDigest=rows=>createHash('sha256').update(JSON.stringify(rows)).digest('hex');
export function validateCastingLawLevelUpMaterialReferencesData({evidence,canonical,templateLevelReferences}){
 check(evidence.schemaVersion===1&&evidence.claimType==='casting-law-template-levelup-material-references'&&evidence.owner==='casting-law-levelup-material-reference','EVIDENCE','owner/schema drift');
 check(isDeepStrictEqual(evidence.sourceSnapshot,PIN)&&isDeepStrictEqual(evidence.levelUpSource,LEVEL)&&isDeepStrictEqual(evidence.itemSource,ITEM)&&isDeepStrictEqual(evidence.legacyContract,LEGACY),'SOURCE_PIN','Source or precedent pin drift');
 check(evidence.scope?.meaning==='Raw LevelupMaterialsCost rows and GoodsType=6 ItemInfo.ID endpoint existence only.','SCOPE','scope drift');
 check(templateLevelReferences.records.length===50,'DEPENDENCY','Template-LevelUp relation population changed');
 check(evidence.levelRecords.length===50&&evidence.materialRecords.length===115,'POPULATION','selected record or material row population drift');
 const allowedLevelIds=new Set(templateLevelReferences.records.map(r=>r.levelUpInfoId));
 check(evidence.levelRecords.every(r=>allowedLevelIds.has(r.levelUpInfoId)&&r.field==='LevelupMaterialsCost'&&r.rawValue.length>0),'LEVEL_ROWS','unexpected LevelUp record or source field');
 check(isDeepStrictEqual(evidence.levelRecords.map(r=>({templateId:r.templateId,templateSourceArrayIndex:r.templateSourceArrayIndex,levelUpInfoId:r.levelUpInfoId,sourceArrayIndex:r.sourceArrayIndex,recordLocator:r.recordLocator})),templateLevelReferences.records.map(r=>({templateId:r.templateId,templateSourceArrayIndex:r.sourceArrayIndex,levelUpInfoId:r.levelUpInfoId,sourceArrayIndex:r.levelUpSourceArrayIndex,recordLocator:r.levelUpRecordLocator}))), 'LEVEL_ORDER', 'selected LevelUp records differ from ordered Template-LevelUp relations');
 const digestRows=evidence.levelRecords.map(r=>({ID:r.levelUpInfoId,LevelupMaterialsCost:r.rawValue}));
 check(projectionDigest(digestRows)===LEVEL.selectedFieldProjectionSha256,'SOURCE_PROJECTION','pinned selected raw field projection mismatch');
 const expected=[];
 for(const r of evidence.levelRecords){
  check(Array.isArray(r.rawValue),'MATERIAL_TYPE','LevelupMaterialsCost is not an array');
  for(let i=0;i<r.rawValue.length;i++){
   const row=r.rawValue[i];check(row.GoodsType===6&&Number.isSafeInteger(row.Id)&&Number.isSafeInteger(row.Count),'MATERIAL_ROW','malformed raw GoodsType/Id/Count row');
   expected.push({levelUpInfoId:r.levelUpInfoId,levelUpSourceArrayIndex:r.sourceArrayIndex,levelUpRecordLocator:r.recordLocator,sourceField:'ConfigDataCastingLawLevelUpInfo.LevelupMaterialsCost',sourceArrayIndex:i,rawMaterial:row,goodsEndpointNamespace:'ConfigDataItemInfo.ID'});
  }
 }
 check(isDeepStrictEqual(evidence.materialRecords,expected),'TRANSFORMATION','material rows differ from source arrays/order');
 check(isDeepStrictEqual(evidence.itemEndpoints,ITEM_ENDPOINTS),'ITEM_ENDPOINT','exact ItemInfo ID endpoints or source locators drift');
 const itemIds=new Set(ITEM_ENDPOINTS.map(r=>r.itemId));check(expected.every(r=>itemIds.has(r.rawMaterial.Id)),'ITEM_JOIN','material ItemInfo endpoint is missing');
 check(canonical.schemaVersion===1&&canonical.scope==='Selected Casting Law LevelUp source material rows with GoodsType=6 and direct ConfigDataItemInfo.ID endpoint presence; raw references only, no runtime cost or consumption meaning.','CANONICAL_SCOPE','canonical scope drift');
 check(isDeepStrictEqual(canonical.records,expected)&&isDeepStrictEqual(canonical.itemEndpoints,ITEM_ENDPOINTS),'CANONICAL_PARITY','canonical/source evidence mismatch');
 check(canonical.records.every(r=>!Object.hasOwn(r,'heroId')&&!Object.hasOwn(r,'jobId')&&!Object.hasOwn(r,'paid')&&!Object.hasOwn(r,'consumed')&&!Object.hasOwn(r,'unlockCondition')&&!Object.hasOwn(r,'runtimeEffect')),'BOUNDARY','Hero relation or runtime/payment meaning mixed into raw reference');
 return {levelRecords:50,materialRows:115,itemEndpoints:18,materialConsumption:'NOT_ADMITTED',goldDeduction:'NOT_ADMITTED'};
}
export async function validateCastingLawLevelUpMaterialReferences(root=process.cwd()){
 const [evidence,canonical,templateLevelReferences]=await Promise.all([read(root,E),read(root,C),read(root,REL)]);
 const out=validateCastingLawLevelUpMaterialReferencesData({evidence,canonical,templateLevelReferences});
 process.stdout.write(`Casting Law LevelUp material references: PASS (levels=${out.levelRecords}; rows=${out.materialRows}; ItemInfo endpoints=${out.itemEndpoints}; no payment or consumption semantics)\n`);return out;
}
if(process.argv[1]&&resolve(process.argv[1])===resolve('tools/validate-casting-law-levelup-material-references.mjs'))await validateCastingLawLevelUpMaterialReferences();
