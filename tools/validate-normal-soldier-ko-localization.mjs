import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const SOURCE_PATH='evidence/localization/source/normal-soldier-names-ko.v1.txt';
const EVIDENCE_PATH='evidence/localization/normal-soldier-names-ko.v1.json';
const fail=m=>{throw new Error(`NORMAL Soldier KO localization validation failed: ${m}`);};
const check=(c,m)=>{if(!c)fail(m);};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function parseNormalSoldierSource(text){
 const lines=text.split(/\r?\n/); const header=lines.find(x=>x&&!x.startsWith('#'));
 check(header==='SoldierID\t한국명','source header mismatch'); const rows=[]; let row=0;
 for(let i=0;i<lines.length;i++){const line=lines[i];if(!line||line.startsWith('#')||line===header)continue;const c=line.split('\t');check(c.length===2&&/^\d+$/.test(c[0]),`malformed source row at line ${i+1}`);check(c[1].length>0&&c[1].trim()===c[1],`empty/malformed Korean name at line ${i+1}`);rows.push({id:Number(c[0]),name:c[1],line:i+1,row:++row});}
 return rows;
}
export function validateNormalSoldierKoLocalization({soldiers,relations,canonical,evidence,manifest,rawSource}){
 check(soldiers.schemaVersion===1&&Array.isArray(soldiers.records),'Soldier identity schema mismatch');check(relations.schemaVersion===1&&Array.isArray(relations.records),'relation schema mismatch');
 check(canonical.schemaVersion===1&&Array.isArray(canonical.records),'canonical localization schema mismatch');check(evidence.schemaVersion===1&&Array.isArray(evidence.records),'localization evidence schema mismatch');
 const hash=createHash('sha256').update(rawSource,'utf8').digest('hex');check(hash==='d812b23bcae880e4971cb43a0b13012769372c339d708182cc0bf250eaffe1c4','source hash mismatch');
 check(manifest.sourceName==='일반용병명.txt'&&manifest.sourceSha256===hash,'source provenance mismatch');check(Buffer.byteLength(rawSource,'utf8')===manifest.sourceBytes,'source byte count mismatch');check(manifest.sourceVersionStatus==='unknown'&&manifest.officialKrProvenanceStatus==='unverified','source authority overstated');check(manifest.scope==='localization/presentation only','source scope mismatch');
 const sourceRows=parseNormalSoldierSource(rawSource);check(sourceRows.length===168&&manifest.sourceRowCount===168,'source row count mismatch');
 const bySource=new Map();for(const r of sourceRows){check(!bySource.has(r.id),`duplicate source ID ${r.id}`);bySource.set(r.id,r);}
 const normalIds=soldiers.records.filter(r=>r.entity==='Soldier'&&r.variant==='NORMAL').map(r=>r.id);check(new Set(normalIds).size===normalIds.length,'duplicate NORMAL identity');const normalSet=new Set(normalIds);
 const targets=relations.records.map(r=>r.normalSoldierId);check(new Set(targets).size===targets.length,'duplicate relation target');for(const id of targets)check(normalSet.has(id),`NORMAL relation endpoint ${id} missing from identity owner`);const ids=[...targets].sort((a,b)=>a-b);check(ids.length===56,'NORMAL endpoint target count mismatch');
 check(same(manifest.targetIds,ids),'manifest target ID set mismatch');const excluded=sourceRows.filter(r=>!new Set(ids).has(r.id)).map(r=>r.id).sort((a,b)=>a-b);check(same(manifest.excludedNonTargetIds,excluded),'manifest excluded ID set mismatch');check(manifest.selectedRowCount===ids.length,'manifest selected row count mismatch');check(manifest.claimScope==='This evidence supports Korean display labels only for the currently admitted NORMAL Soldier target ID set. It does not establish the full NORMAL Soldier population.','claim scope mismatch');
 const eMap=new Map();for(const r of evidence.records){check(Number.isInteger(r.soldierId),'evidence ID malformed');check(!eMap.has(r.soldierId),`duplicate evidence ID ${r.soldierId}`);eMap.set(r.soldierId,r);}const cMap=new Map();for(const r of canonical.records){check(Number.isInteger(r.soldierId),'canonical ID malformed');check(!cMap.has(r.soldierId),`duplicate canonical ID ${r.soldierId}`);cMap.set(r.soldierId,r);}
 check(cMap.size===ids.length&&eMap.size===ids.length,'localization target coverage mismatch');check(same([...cMap.keys()].sort((a,b)=>a-b),ids),'canonical target ID set mismatch');check(same([...eMap.keys()].sort((a,b)=>a-b),ids),'evidence target ID set mismatch');
 const identitySet=new Set(normalIds);for(const id of ids){const s=bySource.get(id),e=eMap.get(id),c=cMap.get(id);check(identitySet.has(id),`canonical ID ${id} is not NORMAL identity`);check(s&&e&&c,`target localization missing ${id}`);check(e.nameKo===s.name&&c.nameKo===s.name,`source/canonical name mismatch ${id}`);check(e.sourceArtifact===SOURCE_PATH&&e.sourceLocator===`SoldierID=${id}`&&e.sourceLine===s.line&&e.sourceRow===s.row,'evidence locator mismatch '+id);check(e.evidenceClass==='A','evidence class mismatch '+id);check(c.evidenceClass==='A'&&c.provenance===`${EVIDENCE_PATH}#SoldierID=${id}`,'canonical provenance mismatch '+id);check(same(Object.keys(c).sort(),['soldierId','nameKo','evidenceClass','provenance'].sort()),`unsupported canonical field ${id}`);}
 check(same(Object.keys(canonical).sort(),['schemaVersion','purpose','sourceScope','officialKrProvenanceStatus','records'].sort()),'canonical top-level schema mismatch');
 check(canonical.officialKrProvenanceStatus==='unverified','canonical overstates official KR provenance');check(canonical.sourceScope.includes('does not establish the full NORMAL Soldier population'),'canonical scope mismatch');
 return {targetCount:ids.length,localizedCount:cMap.size,sourceRowCount:sourceRows.length,uniqueSourceIds:bySource.size,excludedCount:excluded.length};
}
export async function loadAndValidateNormalSoldierKoLocalization(root=process.cwd()){
 const read=async p=>JSON.parse(await readFile(resolve(root,p),'utf8'));const [soldiers,relations,canonical,evidence,manifest,rawSource]=await Promise.all([read('canonical/soldiers.v1.json'),read('canonical/sp-soldier-normal-relations.v1.json'),read('canonical/normal-soldier-localizations-ko.v1.json'),read(EVIDENCE_PATH),read('evidence/localization/source/normal-soldier-names-ko.source-manifest.v1.json'),readFile(resolve(root,SOURCE_PATH),'utf8')]);return validateNormalSoldierKoLocalization({soldiers,relations,canonical,evidence,manifest,rawSource});
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){const r=await loadAndValidateNormalSoldierKoLocalization();process.stdout.write(`NORMAL Soldier KO localization: PASS (${r.localizedCount}/${r.targetCount}; ${r.sourceRowCount} source rows)\n`);}
