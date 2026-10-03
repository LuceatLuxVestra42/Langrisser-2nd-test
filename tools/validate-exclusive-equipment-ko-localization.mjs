import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const ID='canonical/exclusive-equipment.v1.json', EV='evidence/localization/exclusive-equipment-ko.v1.json', CAN='canonical/exclusive-equipment-localizations-ko.v1.json';
const ID_BLOB='a5e84c83c025d6dcb106ac6d754521341f7803d4';
const NORM_HASH='3e330c46d7a7078d3dfee88ef5f3c9e25e234460f11a328a89e20f7f17fad09f';
const SOURCE={"sourceName":"전용장비 단일 통합 source","fileName":"전용장비.txt","providedPath":"project_sources/05-txt","snapshotDate":"2026-09-20","sha256":"c5eaea947311ae115de66769421c0f2b929db09206ae29a3b26db792c2d1a78a","bytes":41655,"recordCount":167,"joinKey":"EquipmentID","recordLocatorPattern":"project_sources/05-txt#EquipmentID={EquipmentID}","duplicateEquipmentIdCount":0,"blankKoreanNameCount":0,"blankKoreanEffectCount":0,"unknownEquipmentIdCount":0,"missingEquipmentIdCount":0,"normalizedRecordSha256":"3e330c46d7a7078d3dfee88ef5f3c9e25e234460f11a328a89e20f7f17fad09f","normalizedRecordUtf8Bytes":42753};
const XVALIDATION={"repository":"LuceatLuxVestra42/langrisser-future-guide","commit":"57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff","nameArtifact":{"path":"data/generated/equipment-name-kr-user-approved.v1.json","gitBlobSha1":"016189930c6d4f5f645df1a69723a522a8bf3237","role":"value parity cross-check only"},"effectArtifacts":[{"path":"data/presentation/equipment-effect-description-kr-exclusive.part1.v1.json","gitBlobSha1":"c779f97b02e4db19e53389feee949f10ddf29bce"},{"path":"data/presentation/equipment-effect-description-kr-exclusive.part2.v1.json","gitBlobSha1":"4abcb5016466cd06cab3adf887557ca780b2cf65"}],"displayMetadata":{"path":"data/generated/equipment_stage3_2_display_metadata.json","gitBlobSha1":"0faeb47002c8017d58f9eff3068cd95d1a2a74f6","role":"Chinese-name value cross-check only"},"exactIdParityCount":167,"identitySourceAuthority":"Destination canonical identity set is the admission target; predecessor artifacts are parity cross-checks only."};
const fail=(c,m)=>{throw new Error(`Exclusive Equipment KO localization validation failed [${c}]: ${m}`);};
const check=(v,c,m)=>{if(!v)fail(c,m);};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const keys=(o,k)=>o&&typeof o==='object'&&!Array.isArray(o)&&same(Object.keys(o).sort(),[...k].sort());
const setSame=(a,b)=>a.size===b.size&&[...a].every(v=>b.has(v));
const blob=text=>createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${Buffer.byteLength(text)}\0`),Buffer.from(text)])).digest('hex');
export function validateExclusiveEquipmentKoLocalization({identity,identityText,evidence,canonical}){
 check(blob(identityText)===ID_BLOB,'IDENTITY_CHANGED','identity blob changed');
 check(identity?.schemaVersion===1&&identity?.responsibility==='Exclusive Equipment identity/population'&&identity?.scope?.identityKey==='EquipmentID'&&identity?.scope?.population==='EXCLUSIVE_EQUIPMENT'&&Array.isArray(identity.records),'IDENTITY_SCHEMA','identity schema/scope mismatch');
 const ids=[], idSet=new Set();
 for(const r of identity.records){check(keys(r,['equipmentId'])&&Number.isSafeInteger(r.equipmentId)&&r.equipmentId>0,'IDENTITY_SCHEMA','unsupported identity record');check(!idSet.has(r.equipmentId),'IDENTITY_DUPLICATE',`duplicate identity ID ${r.equipmentId}`);idSet.add(r.equipmentId);ids.push(r.equipmentId);}
 check(ids.length===167&&same(ids,[...ids].sort((a,b)=>a-b)),'IDENTITY_SCOPE','identity must remain sorted 167 IDs');
 check(keys(evidence,['schemaVersion','evidenceClass','responsibility','projectSource','claimScope','transformation','presentationFieldsNotAdmitted','effectTextBoundary','predecessorCrossValidation','manualReview','officialKrProvenanceStatus','records'])&&evidence.schemaVersion===1&&evidence.evidenceClass==='A'&&evidence.responsibility==='Exclusive Equipment KO localization/effect','EVIDENCE_SCHEMA','evidence schema/class mismatch');
 check(same(evidence.projectSource,SOURCE),'SOURCE_SNAPSHOT','source snapshot identity/hash/locator mismatch');
 check(same(evidence.predecessorCrossValidation,XVALIDATION),'PREDECESSOR_PARITY','predecessor cross-validation anchors changed');
 check(evidence.claimScope?.identityCanonical===ID&&evidence.claimScope?.identityKey==='EquipmentID'&&evidence.claimScope?.recordCount===167,'CLAIM_SCOPE','claim scope mismatch');
 check(evidence.transformation.includes('exact EquipmentID')&&!evidence.transformation.includes('nameCn JOIN')&&same(evidence.presentationFieldsNotAdmitted,['중국어명 (provenance cross-check only)','영웅','한섭 실장상태'])&&evidence.effectTextBoundary.includes('Localized presentation text only'),'BOUNDARY','transformation or semantic boundary mismatch');
 check(same(evidence.manualReview,{ids:[],statement:'No unresolved source-to-identity mapping within the admitted 167 EquipmentID scope.'})&&evidence.officialKrProvenanceStatus==='unverified','EVIDENCE_STATUS','review/provenance status mismatch');
 check(Array.isArray(evidence.records),'EVIDENCE_RECORDS','records missing');
 const em=new Map();
 for(const r of evidence.records){
  check(Number.isSafeInteger(r?.equipmentId)&&r.equipmentId>0,'EVIDENCE_ID','invalid evidence EquipmentID');
  check(!em.has(r.equipmentId),'DUPLICATE_EQUIPMENT_ID',`duplicate evidence ID ${r.equipmentId}`);
  check(idSet.has(r.equipmentId),'UNKNOWN_EQUIPMENT_ID',`unknown EquipmentID ${r.equipmentId}`);
  check(keys(r,['equipmentId','nameKo','effectDescriptionKo','evidenceClass','projectSourceLocator']),'EVIDENCE_FIELD_LEAKAGE',`unsupported evidence field ${r.equipmentId}`);
  check(typeof r.nameKo==='string'&&r.nameKo.trim().length>0,'BLANK_KOREAN_NAME',`blank name ${r.equipmentId}`);
  check(typeof r.effectDescriptionKo==='string'&&r.effectDescriptionKo.trim().length>0,'BLANK_KOREAN_EFFECT',`blank effect ${r.equipmentId}`);
  check(r.evidenceClass==='A'&&r.projectSourceLocator===`EquipmentID=${r.equipmentId}`,'EVIDENCE_LOCATOR',`locator mismatch ${r.equipmentId}`);
  em.set(r.equipmentId,r);
 }
 check(em.size===167&&setSame(new Set(em.keys()),idSet),'MISSING_EQUIPMENT_ID','source evidence does not exactly cover identity IDs');
 const normalized=JSON.stringify([...em.values()].sort((a,b)=>a.equipmentId-b.equipmentId).map(({equipmentId,nameKo,effectDescriptionKo})=>({equipmentId,nameKo,effectDescriptionKo})));
 const hash=createHash('sha256').update(normalized,'utf8').digest('hex');
 check(hash===NORM_HASH&&evidence.projectSource.normalizedRecordSha256===hash,'NORMALIZED_SOURCE_HASH','normalized source values differ from pinned snapshot projection');
 check(Buffer.byteLength(normalized,'utf8')===SOURCE.normalizedRecordUtf8Bytes,'NORMALIZED_SOURCE_SIZE','normalized source byte count mismatch');
 check(keys(canonical,['schemaVersion','purpose','sourceScope','officialKrProvenanceStatus','records'])&&canonical.schemaVersion===1&&canonical.officialKrProvenanceStatus==='unverified'&&Array.isArray(canonical.records),'CANONICAL_SCHEMA','canonical schema/status mismatch');
 const cm=new Map();
 for(const r of canonical.records){check(Number.isSafeInteger(r?.equipmentId)&&r.equipmentId>0,'CANONICAL_ID','invalid canonical ID');check(!cm.has(r.equipmentId),'CANONICAL_DUPLICATE_ID',`duplicate canonical ID ${r.equipmentId}`);check(idSet.has(r.equipmentId),'CANONICAL_UNKNOWN_ID',`unknown canonical ID ${r.equipmentId}`);check(keys(r,['equipmentId','nameKo','effectDescriptionKo','evidenceClass','provenance']),'CANONICAL_FIELD_LEAKAGE',`unsupported canonical field ${r.equipmentId}`);cm.set(r.equipmentId,r);}
 check(cm.size===167&&setSame(new Set(cm.keys()),idSet),'CANONICAL_COVERAGE','canonical IDs differ from identity');
 for(const id of ids){const e=em.get(id),c=cm.get(id);check(c.nameKo===e.nameKo,'KOREAN_NAME_MISMATCH',`name mismatch ${id}`);check(c.effectDescriptionKo===e.effectDescriptionKo,'KOREAN_EFFECT_MISMATCH',`effect mismatch ${id}`);check(c.evidenceClass==='A'&&c.provenance===`${EV}#EquipmentID=${id}`,'CANONICAL_PROVENANCE',`provenance mismatch ${id}`);}
 return {identityCount:167,evidenceCount:em.size,canonicalCount:cm.size,identityBlobUnchanged:true};
}
export async function loadAndValidateExclusiveEquipmentKoLocalization(root=process.cwd()){const read=async p=>readFile(resolve(root,p),'utf8');const [identityText,ev,ca]=await Promise.all([read(ID),read(EV),read(CAN)]);return validateExclusiveEquipmentKoLocalization({identity:JSON.parse(identityText),identityText,evidence:JSON.parse(ev),canonical:JSON.parse(ca)});}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){const r=await loadAndValidateExclusiveEquipmentKoLocalization();process.stdout.write(`Exclusive Equipment KO localization: PASS (${r.canonicalCount}/167; identity unchanged)\n`);}
