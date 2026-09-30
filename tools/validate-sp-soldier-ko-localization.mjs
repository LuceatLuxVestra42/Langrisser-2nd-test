import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const SOURCE_SHA256='4aa84a5dc6428947d87f556d48b632d12fdfa95ab396bfbecbd2adb87609dd53';
const EXPECTED_HEADER='SPSoldierID\\tNormalSoldierID\\t한국명';
const fail=m=>{throw new Error(`SP Soldier KO localization validation failed: ${m}`);};
const check=(c,m)=>{if(!c)fail(m);};

export function parseSource(text){
 const lines=text.split(/\\r?\\n/);
 const header=lines.find(x=>!x.startsWith('#')&&x.length>0);
 check(header===EXPECTED_HEADER,'source header mismatch');
 const rows=[];
 for(let i=0;i<lines.length;i++){
  const line=lines[i];
  if(!line||line.startsWith('#')||line===EXPECTED_HEADER)continue;
  const cols=line.split('\\t');
  check(cols.length===3,'malformed source row at line '+(i+1));
  check(/^\\d+$/.test(cols[0])&&/^\\d+$/.test(cols[1]),'source IDs malformed at line '+(i+1));
  check(cols[2].length>0&&cols[2].trim()===cols[2],'empty or whitespace-altered Korean name at line '+(i+1));
  rows.push({SPSoldierID:Number(cols[0]),NormalSoldierID:Number(cols[1]),nameKo:cols[2],line:i+1,sourceRow:line});
 }
 return rows;
}
export function validateSpSoldierKoLocalization({soldiers,relations,canonical,evidence,manifest,rawSource}){
 check(soldiers.schemaVersion===1&&Array.isArray(soldiers.records),'Soldier canonical schema mismatch');
 check(relations.schemaVersion===1&&Array.isArray(relations.records),'relation canonical schema mismatch');
 check(canonical.schemaVersion===1&&Array.isArray(canonical.records),'localization canonical schema mismatch');
 check(evidence.schemaVersion===1&&Array.isArray(evidence.records),'localization evidence missing');
 check(manifest.sourceName==='SP용병명.txt'&&manifest.sourceSha256===SOURCE_SHA256,'source provenance mismatch');
 check(manifest.sourceVersionStatus==='unknown','source version must remain unknown');
 check(manifest.officialKrProvenanceStatus==='unverified','official KR provenance overstated');
 check(manifest.scope==='localization/presentation only','localization scope mismatch');
 check(manifest.idField==='SPSoldierID'&&manifest.normalConsistencyField==='NormalSoldierID'&&manifest.krNameField==='한국명','source fields mismatch');
 check(createHash('sha256').update(rawSource,'utf8').digest('hex')===SOURCE_SHA256,'source content hash mismatch');
 check(Buffer.byteLength(rawSource,'utf8')===manifest.sourceBytes,'source byte count mismatch');
 const sourceRows=parseSource(rawSource);
 check(sourceRows.length===56&&manifest.recordCount===sourceRows.length,'source population count mismatch');
 const byId=new Map();
 for(const r of sourceRows){check(!byId.has(r.SPSoldierID),`duplicate source SPSoldierID ${r.SPSoldierID}`);byId.set(r.SPSoldierID,r);}
 const sp=soldiers.records.filter(r=>r.entity==='Soldier'&&r.variant==='SP').map(r=>r.id).sort((a,b)=>a-b);
 const sourceIds=sourceRows.map(r=>r.SPSoldierID).sort((a,b)=>a-b);
 check(sp.length===56&&new Set(sp).size===56,'canonical SP identity population mismatch');
 check(JSON.stringify(sp)===JSON.stringify(sourceIds),'source SPSoldierID set differs from canonical SP identities');
 const normalSet=new Set(soldiers.records.filter(r=>r.entity==='Soldier'&&r.variant==='NORMAL').map(r=>r.id));
 const relMap=new Map();
 for(const r of relations.records){check(!relMap.has(r.spSoldierId),`duplicate SP relation ${r.spSoldierId}`);relMap.set(r.spSoldierId,r.normalSoldierId);}
 check(relMap.size===56,'relation population changed');
 check(relMap.get(5115)===115,'5115 → 115 relation regression');
 for(const r of sourceRows){check(relMap.get(r.SPSoldierID)===r.NormalSoldierID,`NormalSoldierID conflicts with canonical relation for ${r.SPSoldierID}`);check(normalSet.has(r.NormalSoldierID),`NORMAL endpoint missing for ${r.SPSoldierID}`);}
 check(manifest.contentEquivalence==='PARTIAL','alias-equivalence status mismatch');
 const evidenceById=new Map();
 for(const r of evidence.records){check(Number.isInteger(r.soldierId), 'evidence soldierId malformed');check(!evidenceById.has(r.soldierId),`duplicate evidence ID ${r.soldierId}`);evidenceById.set(r.soldierId,r);}
 const canonicalById=new Map();
 for(const r of canonical.records){check(Number.isInteger(r.soldierId), 'canonical soldierId malformed');check(!canonicalById.has(r.soldierId),`duplicate localization ID ${r.soldierId}`);canonicalById.set(r.soldierId,r);}
 check(canonicalById.size===56&&evidenceById.size===56,'localization coverage mismatch');
 check(JSON.stringify([...canonicalById.keys()].sort((a,b)=>a-b))===JSON.stringify(sp),'canonical localization ID set mismatch');
 check(JSON.stringify([...evidenceById.keys()].sort((a,b)=>a-b))===JSON.stringify(sp),'evidence localization ID set mismatch');
 for(const id of sp){
  const source=byId.get(id),ev=evidenceById.get(id),loc=canonicalById.get(id);
  check(source&&ev&&loc,'missing localization record '+id);
  check(ev.sourceSPSoldierID===id&&ev.sourceNormalSoldierID===source.NormalSoldierID,'evidence ID linkage mismatch '+id);
  check(ev.nameKo===source.nameKo&&loc.nameKo===source.nameKo,'Korean display name mismatch '+id);
  check(ev.sourceRow===source.sourceRow&&ev.sourceLine===source.line,'source locator mismatch '+id);
  check(ev.sourceArtifact==='evidence/localization/source/sp-soldier-names-ko.v1.txt','source artifact locator mismatch '+id);
  check(ev.sourceLocator===`SPSoldierID=${id}`,'source locator key mismatch '+id);
  check(ev.evidenceClass==='A'&&loc.evidenceClass==='A','evidence class mismatch '+id);
  check(loc.provenance===`evidence/localization/sp-soldier-names-ko.v1.json#SPSoldierID=${id}`,'canonical provenance mismatch '+id);
 }
 return {canonicalSpCount:sp.length,sourceSpCount:sourceRows.length,exactIdMatches:sp.length,localizedCount:canonicalById.size,relationConflicts:0};
}
export async function loadAndValidateSpSoldierKoLocalization(root=process.cwd()){
 const read=async p=>JSON.parse(await readFile(resolve(root,p),'utf8'));
 const [soldiers,relations,canonical,evidence,manifest,rawSource]=await Promise.all([
  read('canonical/soldiers.v1.json'),read('canonical/sp-soldier-normal-relations.v1.json'),
  read('canonical/sp-soldier-localizations-ko.v1.json'),read('evidence/localization/sp-soldier-names-ko.v1.json'),
  read('evidence/localization/source/sp-soldier-names-ko.source-manifest.v1.json'),
  readFile(resolve(root,'evidence/localization/source/sp-soldier-names-ko.v1.txt'),'utf8')]);
 return validateSpSoldierKoLocalization({soldiers,relations,canonical,evidence,manifest,rawSource});
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 const r=await loadAndValidateSpSoldierKoLocalization();
 process.stdout.write(`SP Soldier KO localization: PASS (${r.localizedCount} / ${r.canonicalSpCount}; source ID exact match)\\n`);
}