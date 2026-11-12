import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

const E='evidence/source/jobs/casting-law-levelup-previous-level-references.v1.json';
const C='canonical/casting-law-levelup-previous-level-references.v1.json';
const REF='canonical/casting-law-template-level-references.v1.json';
const RAW='canonical/casting-law-levelup-raw-details.v1.json';
const MAT='canonical/casting-law-levelup-material-references.v1.json';
const SNAPSHOT={repository:'LuceatLuxVestra42/langrisser-future-guide',commit:'6475e63ee23d18adf733756c26a14fa9e3ed662c',tree:'08e1e6c2773730e60b258940e31494f68d65f86a',configDataSubtree:'b18983f60cb054c2e6e094d64cdb98979211d7fc'};
const SOURCE={path:'data/configdata/ConfigDataCastingLawLevelUpInfo.json',blobSha1:'83b99ebff9c54523d7f9476b92e8b3d59229179f',sha256:'07b91384b3dab506d501d74b4e70b6535b84f5d620e0082c3e557afec146e849',byteLength:232171,recordCount:500};
const IDS=[66,67,68,69,70,10066,10067,10068,10069,10070,56,57,58,59,60,10056,10057,10058,10059,10060,181,182,183,184,185,10181,10182,10183,10184,10185,196,197,198,199,200,10196,10197,10198,10199,10200,201,202,203,204,205,10201,10202,10203,10204,10205];
const INDEXES=[65,66,67,68,69,315,316,317,318,319,55,56,57,58,59,305,306,307,308,309,180,181,182,183,184,430,431,432,433,434,195,196,197,198,199,445,446,447,448,449,200,201,202,203,204,450,451,452,453,454];
const OBSERVATION_SHA256='0f7a4cc1dba2fec39f4c79231c0116b5a7f4aaf60724aabe665c29b35266a00a';
const ENDPOINT_SHA256='f184129d99c17ddf90e92d908a328b51d11a3fd56e36ef069017f1c71b1eb79f';
const RELATION_SHA256='e2a7b5256a256f02d2921b371ebe2c4ac359294949d7639c733a225c3316982a';
const check=(x,code,msg)=>{if(!x)throw new Error(`Casting Law LevelUp Previous-Level reference validation failed [${code}]: ${msg}`);};
const exactKeys=(x,keys,label)=>check(x&&typeof x==='object'&&!Array.isArray(x)&&isDeepStrictEqual(Object.keys(x).sort(),[...keys].sort()),'SCHEMA',`${label} keys drift`);
const read=async(root,path)=>JSON.parse(await readFile(resolve(root,path),'utf8'));
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');

// Searches the supplied full source population by exact ID equality. The selected
// relation population is intentionally not used to restrict endpoint lookup.
export function findUniqueLevelUpEndpoint(sourceRecords, endpointId){
  if(!Number.isSafeInteger(endpointId))return {status:'INVALID_ID',matches:[]};
  const matches=sourceRecords.map((record,index)=>record?.ID===endpointId?{record,index}:null).filter(Boolean);
  return {status:matches.length===1?'UNIQUE':matches.length===0?'MISSING':'AMBIGUOUS',matches};
}

export function validateCastingLawLevelUpPreviousLevelReferencesData({evidence,canonical,references,rawDetails,materials}){
  check(evidence.schemaVersion===1&&evidence.claimType==='casting-law-levelup-previous-level-references'&&evidence.owner==='shared-casting-law-levelup-previous-level-reference','EVIDENCE','Owner/schema drift');
  check(isDeepStrictEqual(evidence.sourceSnapshot,SNAPSHOT)&&isDeepStrictEqual(evidence.source,SOURCE),'SOURCE_PIN','fixed Source pin drift');
  check(references?.records?.length===50&&isDeepStrictEqual(references.records.map(x=>x.levelUpInfoId),IDS)&&isDeepStrictEqual(references.records.map(x=>x.levelUpSourceArrayIndex),INDEXES),'SELECTION','existing selected IDs/order/indexes drift');
  check(rawDetails?.records?.length===50&&isDeepStrictEqual(rawDetails.sourceOrder,IDS),'RAW_DETAIL_DEPENDENCY','existing LevelUp raw-detail population drift');
  check(materials?.records?.length===115&&materials?.itemEndpoints?.length===18,'MATERIAL_DEPENDENCY','existing LevelUp materials or ItemInfo scope drift');
  check(evidence.selectionEvidence?.referenceCanonical===REF&&isDeepStrictEqual(evidence.selectionEvidence?.templateIdsInSourceOrder,[14,12,37,40,41])&&isDeepStrictEqual(evidence.selectionEvidence?.levelUpIdsInReferenceOrder,IDS),'SELECTION_EVIDENCE','selection provenance drift');
  const rows=references.records.map(r=>({templateId:r.templateId,sourceField:r.sourceField,sourceArrayIndex:r.sourceArrayIndex,levelUpInfoId:r.levelUpInfoId,levelUpEndpointNamespace:r.levelUpEndpointNamespace,levelUpSourceArrayIndex:r.levelUpSourceArrayIndex,levelUpRecordLocator:r.levelUpRecordLocator}));
  check(isDeepStrictEqual(evidence.selectionEvidence.referenceRows,rows),'REFERENCE_PROVENANCE','existing ordered reference rows differ');
  check(evidence.sourcePopulationAudit?.recordCount===500&&evidence.sourcePopulationAudit?.identityField==='ID'&&evidence.sourcePopulationAudit?.identityType==='number'&&evidence.sourcePopulationAudit?.uniqueIdentityCount===500&&isDeepStrictEqual(evidence.sourcePopulationAudit?.duplicateIds,[])&&evidence.sourcePopulationAudit?.searchMethod==='Exact equality against every parsed Source record ID; no index-only endpoint acceptance.','SOURCE_IDENTITY_AUDIT','full Source identity scan or duplicate check drift');
  check(Array.isArray(evidence.observations)&&evidence.observations.length===50&&isDeepStrictEqual(evidence.observations.map(x=>x.levelUpInfoId),IDS)&&isDeepStrictEqual(evidence.observations.map(x=>x.sourceArrayIndex),INDEXES),'OBSERVATION_POPULATION','expected exactly the selected 50 ordered observations');
  for(const o of evidence.observations){
    const absent=o.fieldState==='ABSENT';
    exactKeys(o,absent?['levelUpInfoId','sourceArrayIndex','recordLocator','sourceField','fieldLocator','fieldState','sourceType','existingRawInventoryState','decision']:['levelUpInfoId','sourceArrayIndex','recordLocator','sourceField','fieldLocator','fieldState','sourceType','rawValue','existingRawInventoryState','decision'],'Source observation');
    check(o.sourceField==='PreCastingLawLevelID'&&o.recordLocator===`ConfigDataCastingLawLevelUpInfo#ID=${o.levelUpInfoId}`&&o.fieldLocator===`ConfigDataCastingLawLevelUpInfo#ID=${o.levelUpInfoId}.PreCastingLawLevelID`,'FIELD_LOCATOR','field locator drift');
    check(o.fieldState===(absent?'ABSENT':'PRESENT')&&o.sourceType===(absent?'absent':'number')&&o.existingRawInventoryState===o.fieldState&&o.decision===(absent?'NOT_ADMITTED':'ADMITTED'),'FIELD_STATE','field state or cross-check against prior inventory drift');
    if(!absent)check(Number.isSafeInteger(o.rawValue),'RAW_VALUE','present Previous-Level field is not an integer numeric Source value');
    else check(!Object.hasOwn(o,'rawValue'),'ABSENT_VALUE','ABSENT field must not have a fabricated value');
  }
  check(digest(evidence.observations)===OBSERVATION_SHA256,'SOURCE_OBSERVATION_PIN','independent expected Source observation digest mismatch');
  check(Array.isArray(evidence.endpointEvidence)&&evidence.endpointEvidence.length===45,'ENDPOINT_POPULATION','endpoint records must be determined from directly verified present values');
  const present=evidence.observations.filter(x=>x.fieldState==='PRESENT');
  check(isDeepStrictEqual(evidence.endpointEvidence.map(x=>x.levelUpInfoId),present.map(x=>x.levelUpInfoId)),'ENDPOINT_ORDER','endpoint evidence differs from present source fields or source selection order');
  for(const ep of evidence.endpointEvidence){
    check(ep.endpointNamespace==='ConfigDataCastingLawLevelUpInfo.ID'&&ep.sourceType==='number'&&ep.endpointType==='number'&&ep.endpointId===ep.previousLevelUpInfoId&&Number.isSafeInteger(ep.endpointId),'ENDPOINT_IDENTITY','endpoint namespace, ID, or type mismatch');
    check(ep.endpointMatchCount===1&&ep.endpointSearchPopulation===500&&ep.directSourceRecordVerified===true,'ENDPOINT_DIRECTNESS','endpoint must be uniquely matched against all 500 fixed Source records');
    check(ep.endpointRecordLocator===`ConfigDataCastingLawLevelUpInfo#ID=${ep.endpointId}`&&ep.endpointSourceArrayIndex===INDEXES[IDS.indexOf(ep.endpointId)],'ENDPOINT_LOCATOR','endpoint Source index/locator mismatch');
  }
  check(digest(evidence.endpointEvidence)===ENDPOINT_SHA256,'ENDPOINT_SOURCE_PIN','independent expected endpoint record projection mismatch');
  check(isDeepStrictEqual(evidence.structureObservation,{selfReferenceIds:[],duplicatePreviousEndpointIds:[],cycles:[],endpointInsideSelectedPopulation:45,endpointOutsideSelectedPopulation:0}),'STRUCTURE','observed relation structure drift');
  check(evidence.admission?.relationCount===45&&evidence.admission?.notAdmittedAbsentCount===5&&evidence.admission?.evidenceGapCount===0&&evidence.admission?.limitation==='Source-native reference and direct endpoint presence only; no runtime prerequisite, progression requirement, completion gate, unlock rule, gold/material consumption, Property meaning, localization, or publication.','ADMISSION_SCOPE','admission count or limitation drift');
  exactKeys(canonical,['schemaVersion','scope','sourceOrder','selectedLevelUpIds','records'],'Canonical');
  check(canonical.schemaVersion===1&&canonical.scope==='Verified source-native ConfigDataCastingLawLevelUpInfo.PreCastingLawLevelID references for the selected shared LevelUp population only; direct ConfigDataCastingLawLevelUpInfo.ID endpoint presence. No runtime progression or consumption meaning.','CANONICAL_SCOPE','Canonical scope drift');
  check(isDeepStrictEqual(canonical.selectedLevelUpIds,IDS)&&isDeepStrictEqual(canonical.sourceOrder,present.map(x=>x.levelUpInfoId))&&canonical.records.length===45,'CANONICAL_POPULATION','Canonical relation population/order drift');
  const expected= evidence.endpointEvidence.map(ep=>({levelUpInfoId:ep.levelUpInfoId,sourceField:'PreCastingLawLevelID',previousLevelUpInfoId:ep.previousLevelUpInfoId,endpointNamespace:ep.endpointNamespace,sourceRecordLocator:ep.sourceRecordLocator,endpointRecordLocator:ep.endpointRecordLocator,evidenceProvenance:`${E}#endpointEvidence/levelUpInfoId=${ep.levelUpInfoId}`}));
  check(isDeepStrictEqual(canonical.records,expected)&&digest(canonical.records)===RELATION_SHA256,'CANONICAL_PARITY','Canonical relations differ from the independently pinned admitted relation projection');
  check(new Set(canonical.records.map(x=>x.levelUpInfoId)).size===45&&new Set(canonical.records.map(x=>x.previousLevelUpInfoId)).size===45,'DUPLICATE','duplicate source or endpoint relation identity');
  check(canonical.records.every(x=>!Object.hasOwn(x,'runtimePrerequisite')&&!Object.hasOwn(x,'mustComplete')&&!Object.hasOwn(x,'goldCost')&&!Object.hasOwn(x,'materialCost')&&!Object.hasOwn(x,'propertyEffects')&&!Object.hasOwn(x,'published')),'SEMANTIC_BOUNDARY','runtime, cost, Property, or publication semantics mixed into relation');
  return {selected:50,fieldPresent:45,fieldAbsent:5,endpointVerified:45,relationCount:45,endpointInsideSelected:45,endpointOutsideSelected:0};
}

export async function validateCastingLawLevelUpPreviousLevelReferences(root=process.cwd()){
  const [evidence,canonical,references,rawDetails,materials]=await Promise.all([read(root,E),read(root,C),read(root,REF),read(root,RAW),read(root,MAT)]);
  const result=validateCastingLawLevelUpPreviousLevelReferencesData({evidence,canonical,references,rawDetails,materials});
  process.stdout.write(`Casting Law LevelUp Previous-Level references: PASS (selected=${result.selected}; PRESENT=${result.fieldPresent}; ABSENT=${result.fieldAbsent}; directly verified endpoints=${result.endpointVerified}; admitted relations=${result.relationCount}; no runtime progression semantics)\n`);
  return result;
}
if(process.argv[1]&&resolve(process.argv[1])===resolve('tools/validate-casting-law-levelup-previous-level-references.mjs'))await validateCastingLawLevelUpPreviousLevelReferences();
