import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const EVIDENCE_PATH='evidence/source/equipment/general-ssr-equipment-population.v1.json';
const CANONICAL_PATH='canonical/general-ssr-equipment.v1.json';
const EXPECTED_IDS=[6,7,8,13,14,15,22,23,24,30,31,32,38,39,40,46,47,48,52,53,59,60,66,67,73,74,80,81,87,88,94,95,99,100,106,107,108,114,115,116,120,121,122,126,127,128,132,133,134,137,140,144,147,150,153,157,158,163,164,165,166,171,172,173,174,179,180,181,182,187,188,189,190,195,196,197,198,203,204,205,206,209,210,212,213,214,256,257,258,260,261,262,263,264,265,266,267,268,269,270,271,272,282,283,284,285,288,289,290,291,299,400,401,402,407,408,409,410,419,420,421,422,430,431,432,433,442,443,444,445,456,457,458,459,468,469,470,471,480,481,482,483,491,492,493,494,503,504,505,506,515,516,517,518,527,528,529,530,541,542,543,544,553,554,555,556,563,564,565,566,574,575,576,577,583,584,585,586,591,592,593,594,599,600,601,602,607,608,609,610,615,616,617,618,623,624,625,626,630,631,632,633,639,640,641,642];
const MANUAL_REVIEW_IDS=[265,266,267,268,288,289,290,291];
const fail=m=>{throw new Error(`General SSR Equipment identity validation failed: ${m}`);};
const check=(c,m)=>{if(!c)fail(m);};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function validateGeneralSsrEquipmentIdentity({canonical,evidence}){
 check(evidence.schemaVersion===1&&evidence.evidenceClass==='B'&&Array.isArray(evidence.records),'evidence schema/class mismatch');
 check(evidence.responsibility==='General SSR Equipment identity/population','evidence responsibility mismatch');
 check(evidence.scope?.recordCount===206,'evidence population count mismatch');
 check(evidence.scope?.identityKey==='ConfigDataEquipmentInfo.ID / equipmentId','identity key mismatch');
 check(evidence.scope?.selectionRule?.includes('no name matching'),'selection rule must prohibit name matching');
 check(evidence.provenance?.predecessorRepository==='LuceatLuxVestra42/langrisser-future-guide','predecessor repository mismatch');
 check(evidence.provenance?.pinnedPredecessorCommit==='57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff','predecessor commit mismatch');
 check(evidence.provenance?.predecessorAcquisitionArtifact?.gitBlobSha1==='9933a2406fa026e1b340e31a080587a0828db8bc','acquisition blob mismatch');
 check(evidence.provenance?.acquisitionReferenceContract?.gitBlobSha1==='7f02a862a72cd57819827c24c60f740f36c45573','reference contract blob mismatch');
 check(evidence.provenance?.predecessorValidation?.gitBlobSha1==='56d11985799dde5cd1ac52c703afb43736e64cb6','validation blob mismatch');
 check(evidence.provenance?.configDataAnchor?.gitBlobSha1==='353c4f00b44a2ba0f8eb32dd03a76c3224635d04','ConfigData blob mismatch');
 check(evidence.provenance?.configDataAnchor?.sha256==='b4e4a27c68a7038c1b282140b82a634c9d18c348f79b9e6d411840c7ffe54e70','ConfigData sha256 mismatch');
 check(evidence.provenance?.configDataAnchor?.recordCount===548&&evidence.provenance?.configDataAnchor?.inheritedValidatedRank4Count===398,'ConfigData count anchor mismatch');
 check(evidence.provenance?.configDataAnchor?.explicitIdentityField==='ID','explicit identity field mismatch');
 check(evidence.scope.acquisitionClassCounts?.launch===94&&evidence.scope.acquisitionClassCounts?.['legacy-additional']===80&&evidence.scope.acquisitionClassCounts?.['current-additional']===32,'acquisition class count metadata mismatch');
 const eIds=[];const classes={launch:0,'legacy-additional':0,'current-additional':0};const eSeen=new Set();
 for(const r of evidence.records){
  check(Number.isInteger(r.equipmentId),'malformed evidence ID');check(!eSeen.has(r.equipmentId),`duplicate evidence ID ${r.equipmentId}`);eSeen.add(r.equipmentId);eIds.push(r.equipmentId);
  check(Object.hasOwn(classes,r.acquisitionClass),`unexpected acquisition class ${r.acquisitionClass}`);classes[r.acquisitionClass]++;
  check(r.evidenceClass==='B','record evidence class mismatch');
  check(r.predecessorLocator===`data/generated/equipment_stage2_7_acquisition.json#equipmentId=${r.equipmentId}`,`predecessor locator mismatch ${r.equipmentId}`);
  check(same(Object.keys(r).sort(),['equipmentId','acquisitionClass','evidenceClass','predecessorLocator'].sort()),`unsupported evidence record field ${r.equipmentId}`);
 }
 eIds.sort((a,b)=>a-b);check(same(eIds,EXPECTED_IDS),'evidence ID set mismatch');
 check(classes.launch===94&&classes['legacy-additional']===80&&classes['current-additional']===32,'evidence acquisition class counts mismatch');
 check(same(evidence.manualReview?.aliasReplacementMeaningUnresolvedIds,MANUAL_REVIEW_IDS),'manual-review ID set mismatch');
 check(evidence.manualReview?.statement==='population inclusion != alias/replacement resolution','manual-review boundary mismatch');
 check(canonical.schemaVersion===1&&canonical.responsibility==='General SSR Equipment identity/population'&&Array.isArray(canonical.records),'canonical schema mismatch');
 const cIds=[];const cSeen=new Set();
 for(const r of canonical.records){
  check(r?.entity==='Equipment'&&Number.isInteger(r.id)&&r.population==='GENERAL_SSR','malformed canonical identity');
  check(!cSeen.has(r.id),`duplicate canonical ID ${r.id}`);cSeen.add(r.id);cIds.push(r.id);
  check(r.evidenceClass==='B','canonical evidence class mismatch');
  check(r.provenance===`${EVIDENCE_PATH}#EquipmentID=${r.id}`,`canonical provenance mismatch ${r.id}`);
  check(same(Object.keys(r).sort(),['entity','id','population','evidenceClass','provenance'].sort()),`unsupported canonical field ${r.id}`);
 }
 cIds.sort((a,b)=>a-b);check(same(cIds,EXPECTED_IDS),'canonical ID set mismatch');check(canonical.records.length===206,'canonical record count mismatch');
 for(const id of MANUAL_REVIEW_IDS)check(cSeen.has(id),`manual-review population member missing ${id}`);
 check(canonical.scope.includes('alias/replacement meaning')&&canonical.scope.includes('not owned here'),'canonical non-scope boundary missing');
 return {recordCount:cIds.length,launch:classes.launch,legacyAdditional:classes['legacy-additional'],currentAdditional:classes['current-additional'],manualReviewCount:MANUAL_REVIEW_IDS.length};
}
export async function loadAndValidateGeneralSsrEquipmentIdentity(root=process.cwd()){
 const read=async p=>JSON.parse(await readFile(resolve(root,p),'utf8'));
 const [canonical,evidence]=await Promise.all([read(CANONICAL_PATH),read(EVIDENCE_PATH)]);
 return validateGeneralSsrEquipmentIdentity({canonical,evidence});
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 const r=await loadAndValidateGeneralSsrEquipmentIdentity();
 process.stdout.write(`General SSR Equipment identity: PASS (${r.recordCount}; launch ${r.launch}; legacy-additional ${r.legacyAdditional}; current-additional ${r.currentAdditional}; alias/replacement unresolved ${r.manualReviewCount})\\n`);
}
