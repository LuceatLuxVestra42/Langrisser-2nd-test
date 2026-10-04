import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
const CONTRACT_PATH='evidence/source/equipment/general-ssr-equipment-population-contract.v1.json';
const EVIDENCE_PATH='evidence/source/equipment/general-ssr-equipment-population.v1.json';
const CANONICAL_PATH='canonical/general-ssr-equipment.v1.json';
const LOCALIZATION_PATH='evidence/localization/general-ssr-equipment-ko.v1.json';
const MANUAL_REVIEW_IDS=[265,266,267,268,288,289,290,291];
const ANCHORS={predecessorCommit:'57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff',acquisitionBlob:'9933a2406fa026e1b340e31a080587a0828db8bc',referenceContractBlob:'7f02a862a72cd57819827c24c60f740f36c45573',predecessorValidationBlob:'56d11985799dde5cd1ac52c703afb43736e64cb6',configDataBlob:'353c4f00b44a2ba0f8eb32dd03a76c3224635d04',configDataSha256:'b4e4a27c68a7038c1b282140b82a634c9d18c348f79b9e6d411840c7ffe54e70'};
const fail=m=>{throw new Error(`General SSR Equipment identity validation failed: ${m}`);};
const check=(c,m)=>{if(!c)fail(m);};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const sortedIds=rows=>rows.map(r=>r.id??r.equipmentId).sort((a,b)=>a-b);
const digestIds=ids=>createHash('sha256').update(JSON.stringify(ids)).digest('hex');
export function validateGeneralSsrEquipmentIdentity({canonical,evidence,contract,localization}){
 check(contract?.schemaVersion===1&&contract.owner==='General SSR Equipment'&&contract.authorityRole==='current-semantic-population-owner','population owner contract mismatch');
 check(contract.population?.entity==='Equipment'&&contract.population.population==='GENERAL_SSR'&&contract.population.recordCount===206,'contract population scope mismatch');
 check(contract.population.canonicalPath===CANONICAL_PATH,'contract canonical path mismatch');
 check(contract.population.membershipBasis?.includes('existing reviewed population result'),'contract must carry forward existing reviewed result');
 check(contract.population.canonicalBaseline?.pullRequest===19&&contract.population.canonicalBaseline?.reviewedCommit==='448c85576b1bb2e4cde2de365eb5bc9df09b8bd2','reviewed baseline provenance mismatch');
 check(contract.population.canonicalBaseline?.repository==='LuceatLuxVestra42/Langrisser-2nd-test','reviewed baseline repository mismatch');
 check(evidence?.schemaVersion===1&&evidence.evidenceClass==='B'&&evidence.responsibility==='General SSR Equipment identity/population','population evidence schema mismatch');
 check(evidence.ownerContract?.path===CONTRACT_PATH&&evidence.ownerContract?.authorityRole===contract.authorityRole,'population evidence owner link mismatch');
 check(evidence.scope?.ownerContract===CONTRACT_PATH&&evidence.scope?.recordCount===206,'population evidence scope mismatch');
 check(evidence.scope?.membershipRule?.includes('no ConfigData heuristic')&&evidence.scope.membershipRule.includes('historical class union'),'membership rule boundary mismatch');
 check(evidence.provenance?.role?.includes('Historical provenance'),'historical provenance role mismatch');
 check(evidence.historicalProvenance?.records?.length===206,'historical migration trace count mismatch');
 check(evidence.historicalProvenance?.records?.every(r=>Number.isInteger(r.equipmentId)&&typeof r.predecessorLocator==='string'),'historical migration locator malformed');
 check(evidence.provenance?.pinnedPredecessorCommit===ANCHORS.predecessorCommit,'historical predecessor commit anchor mismatch');
 check(evidence.provenance?.predecessorAcquisitionArtifact?.gitBlobSha1===ANCHORS.acquisitionBlob,'historical acquisition blob anchor mismatch');
 check(evidence.provenance?.acquisitionReferenceContract?.gitBlobSha1===ANCHORS.referenceContractBlob,'historical reference contract anchor mismatch');
 check(evidence.provenance?.predecessorValidation?.gitBlobSha1===ANCHORS.predecessorValidationBlob,'historical validation anchor mismatch');
 check(evidence.provenance?.configDataAnchor?.gitBlobSha1===ANCHORS.configDataBlob&&evidence.provenance?.configDataAnchor?.sha256===ANCHORS.configDataSha256,'ConfigData source anchor mismatch');
 const config=contract.sourceValidation?.configData;
 check(config?.repository==='LuceatLuxVestra42/langrisser-future-guide'&&config.sourcePath==='data/configdata/ConfigDataEquipmentInfo.json','ConfigData source locator mismatch');
 check(config.preservedSourceCommit==='4d5e9d141d9720ced9b5ad99fa7b52f99b0d0706'&&config.gitBlobSha1===ANCHORS.configDataBlob&&config.sha256===ANCHORS.configDataSha256,'ConfigData source integrity anchor mismatch');
 check(config.directPopulationFieldPresent===false&&config.role.includes('not a population selector'),'ConfigData must remain validation-only');
 check(contract.sourceValidation?.projectIntegration?.joinKey==='EquipmentID'&&contract.crossRepositoryMapping?.joinKey==='EquipmentID','explicit EquipmentID join contract missing');
 check(contract.crossRepositoryMapping?.filenameSimilarityUsed===false&&contract.crossRepositoryMapping?.nameJoinUsed===false&&contract.crossRepositoryMapping?.recordOrderUsed===false&&contract.crossRepositoryMapping?.idArithmeticUsed===false,'cross-repository mapping boundary mismatch');
 check(contract.boundaryFixtures?.ids?.includes(304)&&contract.boundaryFixtures?.ids?.includes(308),'boundary fixtures missing');
 check(canonical?.schemaVersion===1&&canonical.responsibility==='General SSR Equipment identity/population'&&Array.isArray(canonical.records),'canonical schema mismatch');
 const canonicalIds=sortedIds(canonical.records);check(canonical.records.length===206&&new Set(canonicalIds).size===206,'canonical population count/uniqueness mismatch');
 check(canonical.records.every(r=>r.entity==='Equipment'&&r.population==='GENERAL_SSR'&&r.evidenceClass==='B'),'canonical identity record malformed');
 check(canonical.records.every(r=>r.provenance===`${EVIDENCE_PATH}#EquipmentID=${r.id}`),'canonical provenance mismatch');
 check(canonical.records.every(r=>same(Object.keys(r).sort(),['entity','id','population','evidenceClass','provenance'].sort())),'canonical identity record contains out-of-scope semantic fields');
 check(digestIds(canonicalIds)===contract.population.canonicalBaseline.sortedIdSetSha256,'canonical ID set does not match reviewed owner contract');
 for(const id of MANUAL_REVIEW_IDS)check(canonicalIds.includes(id),'manual-review population member missing '+id);
 const cfg=evidence.provenance.configDataAnchor;
 check(cfg?.sourcePath===config.sourcePath&&cfg.preservedSourceCommit===config.preservedSourceCommit&&cfg.recordCount===config.sourceRecordCount&&cfg.explicitIdentityField===config.explicitIdentityField,'ConfigData source-side anchor metadata mismatch');
 check(localization?.evidenceClass==='A'&&localization.projectSource?.name===contract.sourceValidation.projectIntegration.name,'project integration source provenance mismatch');
 const lp=localization.projectSource, cp=contract.sourceValidation.projectIntegration;
 check(lp.fileId===cp.fileId&&lp.sha256===cp.sha256&&lp.bytes===cp.bytes&&lp.recordCount===206&&lp.joinKey==='EquipmentID'&&lp.duplicateEquipmentIdCount===0,'project integration source metadata mismatch');
 const localizedIds=sortedIds(localization.records||[]);check(localizedIds.length===206&&new Set(localizedIds).size===206,'project localization ID count/uniqueness mismatch');
 check(digestIds(localizedIds)===cp.sortedEquipmentIdSetSha256,'project integration source ID-set digest mismatch');
 check(same(canonicalIds,localizedIds),'canonical and project integration EquipmentID parity mismatch');
 for(const id of contract.boundaryFixtures.ids)check(!canonicalIds.includes(id),`boundary fixture ${id} was admitted into population`);
 check(evidence.manualReview?.statement==='population inclusion != alias/replacement resolution'&&same(evidence.manualReview?.aliasReplacementMeaningUnresolvedIds,MANUAL_REVIEW_IDS),'alias/replacement review boundary mismatch');
 return {recordCount:canonicalIds.length,idSetSha256:digestIds(canonicalIds),integrationParity:'PASS',historicalRecordCount:evidence.historicalProvenance.records.length,boundaryFixtureIds:contract.boundaryFixtures.ids};
}
export async function loadAndValidateGeneralSsrEquipmentIdentity(root=process.cwd()){
 const read=async p=>JSON.parse(await readFile(resolve(root,p),'utf8'));
 const [canonical,evidence,contract,localization]=await Promise.all([read(CANONICAL_PATH),read(EVIDENCE_PATH),read(CONTRACT_PATH),read(LOCALIZATION_PATH)]);
 return validateGeneralSsrEquipmentIdentity({canonical,evidence,contract,localization});
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 const r=await loadAndValidateGeneralSsrEquipmentIdentity();
 process.stdout.write(`General SSR Equipment identity: PASS (${r.recordCount}; canonical/integration parity; historical provenance only; fixtures ${r.boundaryFixtureIds.join('/')})\\n`);
}
