import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const CANONICAL_PATH='canonical/exclusive-equipment.v1.json';
// Immutable expected-ID fixture, independently preserved in the validator.
// It was extracted from the pinned ConfigData source and compared to the project source.
const EXPECTED_IDS=[273,274,275,276,277,278,279,280,281,286,287,292,293,294,295,296,297,298,403,404,405,406,411,412,413,414,415,416,417,418,423,424,425,426,427,428,429,434,435,436,437,438,439,440,441,446,447,448,449,450,451,452,453,454,455,460,461,462,463,464,465,466,467,472,473,474,475,476,477,478,479,484,485,486,487,488,489,490,495,496,497,498,499,500,501,502,507,508,509,510,511,512,513,514,519,520,521,522,523,524,525,526,531,532,533,534,535,536,537,538,539,540,545,546,547,548,549,550,551,552,557,558,559,560,561,562,567,568,569,570,571,572,573,578,579,580,581,582,587,588,589,590,595,596,597,598,603,604,605,606,611,612,613,614,619,620,621,622,627,628,629,634,635,636,637,638,643];
const EXPECTED_SOURCE={
 repository:'LuceatLuxVestra42/langrisser-future-guide',
 commit:'6475e63ee23d18adf733756c26a14fa9e3ed662c',
 path:'data/configdata/ConfigDataEquipmentInfo.json',
 gitBlobSha1:'353c4f00b44a2ba0f8eb32dd03a76c3224635d04',
 recordCount:548,
 identityField:'ID',
 locatorPattern:'data/configdata/ConfigDataEquipmentInfo.json#ID={EquipmentID}',
 selectionPredicate:'GetPathList.length == 1 && GetPathList[0].PathType == 46'
};
const EXPECTED_DECISION={
 repository:'LuceatLuxVestra42/langrisser-future-guide',
 commit:'6475e63ee23d18adf733756c26a14fa9e3ed662c',
 path:'data/contracts/equipment-stage2-7-acquisition-reference.v1.json',
 gitBlobSha1:'7f02a862a72cd57819827c24c60f740f36c45573',
 classification:'exclusive-equipment',
 confidencePercent:99,
 basis:'The PathType 46-only population aligns with a separate exclusive-equipment population; sentinel EquipmentIDs 273–277 match the opening rows of the predecessor Korean exclusive-equipment sheet.',
 sentinelReference:'https://docs.google.com/spreadsheets/d/1RZFY2N3RU-vctduO_Tg2e4RVoZvJAAveiMgPnW6VTQg/edit'
};
const EXPECTED_LIMITATION='The source-native enum documentation for PathType 46 was not confirmed. The exclusive-equipment meaning is a traceable predecessor semantic decision, not a literal ConfigData enum label.';
const fail=m=>{throw new Error(`Exclusive Equipment identity validation failed: ${m}`);};
const check=(condition,message)=>{if(!condition)fail(message);};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const exactKeys=(obj,keys)=>obj&&typeof obj==='object'&&!Array.isArray(obj)&&same(Object.keys(obj).sort(),[...keys].sort());
export function validateExclusiveEquipmentIdentity({canonical}){
 check(exactKeys(canonical,['schemaVersion','evidenceClass','responsibility','claim','scope','provenance','limitations','records']),'canonical top-level schema mismatch');
 check(canonical.schemaVersion===1&&canonical.evidenceClass==='B','canonical schema/evidence class mismatch');
 check(canonical.responsibility==='Exclusive Equipment identity/population','responsibility mismatch');
 check(canonical.claim==='These 167 EquipmentIDs are the Exclusive Equipment identity/population admitted by this project for the pinned source scope.','claim mismatch');
 check(exactKeys(canonical.scope,['entity','population','identityKey','recordCount','selectionRule']),'scope schema mismatch');
 check(canonical.scope.entity==='Equipment'&&canonical.scope.population==='EXCLUSIVE_EQUIPMENT','population scope mismatch');
 check(canonical.scope.identityKey==='EquipmentID'&&canonical.scope.recordCount===167,'identity key or population count mismatch');
 check(exactKeys(canonical.scope.selectionRule,['sourceField','predicate','sourceFact','mapping']),'selection rule schema mismatch');
 check(canonical.scope.selectionRule.sourceField==='ConfigDataEquipmentInfo.GetPathList','selection source mismatch');
 check(canonical.scope.selectionRule.predicate==='GetPathList has exactly one entry AND GetPathList[0].PathType equals 46','selection predicate mismatch');
 check(canonical.scope.selectionRule.sourceFact==='The pinned ConfigData records contain exactly one acquisition path entry with PathType 46 for each admitted EquipmentID.','source fact mismatch');
 check(canonical.scope.selectionRule.mapping==='Copy the source-native ConfigDataEquipmentInfo.ID value unchanged to EquipmentID.','identity mapping mismatch');
 check(exactKeys(canonical.provenance,['source','semanticDecision']),'provenance schema mismatch');
 check(same(canonical.provenance.source,EXPECTED_SOURCE),'source provenance mismatch');
 check(same(canonical.provenance.semanticDecision,EXPECTED_DECISION),'semantic decision provenance mismatch');
 check(Array.isArray(canonical.limitations)&&same(canonical.limitations,[EXPECTED_LIMITATION]),'limitation missing or changed');
 check(Array.isArray(canonical.records)&&canonical.records.length===167,'canonical population count mismatch');
 const ids=[],seen=new Set();
 for(const row of canonical.records){
  check(exactKeys(row,['equipmentId']),'unsupported canonical record field');
  check(Number.isSafeInteger(row.equipmentId)&&row.equipmentId>0,'malformed EquipmentID');
  check(!seen.has(row.equipmentId),`duplicate EquipmentID ${row.equipmentId}`);
  seen.add(row.equipmentId);ids.push(row.equipmentId);
 }
 const sorted=[...ids].sort((a,b)=>a-b);
 check(same(ids,sorted),'EquipmentID records must be sorted ascending');
 check(same(sorted,EXPECTED_IDS),'canonical EquipmentID set mismatch');
 return {recordCount:ids.length,exactMatch:EXPECTED_IDS.length,missing:0,unexpected:0,duplicates:0};
}
async function main(){
 const canonical=JSON.parse(await readFile(resolve(CANONICAL_PATH),'utf8'));
 const result=validateExclusiveEquipmentIdentity({canonical});
 process.stdout.write(JSON.stringify({ok:true,...result})+'\\n');
}
if(import.meta.url===pathToFileURL(process.argv[1]??'').href) await main();
