import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
const CONTRACT_PATH='evidence/source/equipment/general-ssr-equipment-population-contract.v1.json';
const EVIDENCE_PATH='evidence/source/equipment/general-ssr-equipment-population.v1.json';
const CANONICAL_PATH='canonical/general-ssr-equipment.v1.json';
const LOCALIZATION_PATH='evidence/localization/general-ssr-equipment-ko.v1.json';
const MANUAL_REVIEW_IDS=[265,266,267,268,288,289,290,291];
const CLASS_COUNTS={launch:94,'legacy-additional':80,'current-additional':32};
const PROVENANCE_FIELDS=['equipmentId','predecessorLocator','acquisitionClass'];
const HISTORICAL_PROVENANCE_SHA256='f914fe93767074df78dc7353ef44a90578750e9be0b4a6f96874484aa7fdfe29';
const ANCHORS={
 baselineRepository:'LuceatLuxVestra42/Langrisser-2nd-test',
 baselinePullRequest:19,
 baselineCommit:'448c85576b1bb2e4cde2de365eb5bc9df09b8bd2',
 baselineCanonicalBlob:'000826ba1b2216c68897b6a192850e6eb669f989',
 baselineIdSetSha256:'8ebfa88ede242bee1d12527ea66f73f0aa4f2ef50f50eb27cea230e7ed551e68',
 predecessorRepository:'LuceatLuxVestra42/langrisser-future-guide',
 predecessorCommit:'57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff',
 acquisitionPath:'data/generated/equipment_stage2_7_acquisition.json',
 acquisitionBlob:'9933a2406fa026e1b340e31a080587a0828db8bc',
 referenceContractPath:'data/contracts/equipment-stage2-7-acquisition-reference.v1.json',
 referenceContractBlob:'7f02a862a72cd57819827c24c60f740f36c45573',
 predecessorValidationPath:'data/validation/equipment-stage3-0-input-summary.v1.json',
 predecessorValidationBlob:'56d11985799dde5cd1ac52c703afb43736e64cb6',
 configDataBlob:'353c4f00b44a2ba0f8eb32dd03a76c3224635d04',
 configDataSha256:'b4e4a27c68a7038c1b282140b82a634c9d18c348f79b9e6d411840c7ffe54e70'
};
const fail=m=>{throw new Error(`General SSR Equipment identity validation failed: ${m}`);};
const check=(c,m)=>{if(!c)fail(m);};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const sortedIds=rows=>rows.map(r=>r.id??r.equipmentId).sort((a,b)=>a-b);
const digestIds=ids=>createHash('sha256').update(JSON.stringify(ids),'utf8').digest('hex');
const digestHistoricalRecords=records=>{
 const normalized=records.map(r=>({equipmentId:r.equipmentId,predecessorLocator:r.predecessorLocator,acquisitionClass:r.acquisitionClass})).sort((a,b)=>a.equipmentId-b.equipmentId);
 return createHash('sha256').update(JSON.stringify(normalized),'utf8').digest('hex');
};
function checkOwnerContract(contract){
 check(contract?.schemaVersion===1&&contract.owner==='General SSR Equipment'&&contract.authorityRole==='current-semantic-population-owner','population owner contract mismatch');
 check(contract.population?.entity==='Equipment'&&contract.population.population==='GENERAL_SSR'&&contract.population.recordCount===206,'contract population scope mismatch');
 check(contract.population.canonicalPath===CANONICAL_PATH,'contract canonical path mismatch');
 check(contract.population.membershipBasis?.includes('existing reviewed population result'),'contract must carry forward existing reviewed result');
 const baseline=contract.population?.canonicalBaseline;
 check(baseline?.repository===ANCHORS.baselineRepository&&baseline?.pullRequest===ANCHORS.baselinePullRequest
  &&baseline?.reviewedCommit===ANCHORS.baselineCommit,'reviewed baseline provenance mismatch');
 check(baseline?.gitBlobSha1===ANCHORS.baselineCanonicalBlob&&baseline?.sortedIdSetSha256===ANCHORS.baselineIdSetSha256,
  'immutable PR #19 baseline anchor mismatch');
}
export function resolveCurrentGeneralSsrEquipmentIds({canonical,contract}){
 checkOwnerContract(contract);
 check(canonical?.schemaVersion===1&&canonical.responsibility==='General SSR Equipment identity/population'&&Array.isArray(canonical.records),'canonical schema mismatch');
 const canonicalIds=sortedIds(canonical.records);
 check(canonical.records.length===206&&new Set(canonicalIds).size===206,'canonical population count/uniqueness mismatch');
 check(canonical.records.every(r=>r.entity==='Equipment'&&r.population==='GENERAL_SSR'&&r.evidenceClass==='B'),'canonical identity record malformed');
 check(canonical.records.every(r=>r.provenance===`${EVIDENCE_PATH}#EquipmentID=${r.id}`),'canonical provenance mismatch');
 check(canonical.records.every(r=>same(Object.keys(r).sort(),['entity','id','population','evidenceClass','provenance'].sort())),'canonical identity record contains out-of-scope semantic fields');
 check(digestIds(canonicalIds)===contract.population.canonicalBaseline.sortedIdSetSha256,'canonical ID set does not match reviewed owner contract');
 for(const id of MANUAL_REVIEW_IDS)check(canonicalIds.includes(id),'manual-review population member missing '+id);
 return canonicalIds;
}
function validateHistoricalProvenance({evidence,contract}){
 const hist=contract.historicalPredecessor;
 const snapshot=hist?.provenanceSnapshotIntegrity;
 check(hist?.role?.includes('Provenance and migration trace only')&&hist.role.includes('do not determine current expected population'),'historical predecessor semantic boundary mismatch');
 check(hist.repository===ANCHORS.predecessorRepository&&hist.pinnedCommit===ANCHORS.predecessorCommit,'historical predecessor contract anchor mismatch');
 check(hist.acquisitionArtifact?.path===ANCHORS.acquisitionPath&&hist.acquisitionArtifact?.gitBlobSha1===ANCHORS.acquisitionBlob,'historical acquisition contract anchor mismatch');
 check(hist.referenceContract?.path===ANCHORS.referenceContractPath&&hist.referenceContract?.gitBlobSha1===ANCHORS.referenceContractBlob,'historical reference contract anchor mismatch');
 check(hist.validationArtifact?.path===ANCHORS.predecessorValidationPath&&hist.validationArtifact?.gitBlobSha1===ANCHORS.predecessorValidationBlob,'historical validation contract anchor mismatch');
 check(snapshot?.recordCount===206&&same(snapshot.fields,PROVENANCE_FIELDS),'historical provenance integrity basis mismatch');
 check(snapshot.normalizedRecordSetSha256===HISTORICAL_PROVENANCE_SHA256,'historical provenance contract digest mismatch');
 check(snapshot.acquisitionClassRole?.includes('historical semantic transformation')&&snapshot.acquisitionClassRole.includes('do not select or recalculate current expected membership'),'historical acquisitionClass role mismatch');
 check(snapshot.semanticPopulationImpact?.includes('No current membership-selector impact')&&snapshot.semanticPopulationImpact.includes('historical classification remains part of the traceable rationale'),'historical semantic role mismatch');
 const rationale=hist.transformationRationale;
 check(rationale?.role?.includes('historical semantic transformation provenance')&&rationale.role.includes('not the current membership selector'),'historical rationale role mismatch');
 check(rationale.launch?.historicalSource==='Korean SSR launch sheets'&&rationale.launch.historicalExpectedCount===94
  &&rationale.launch.predecessorTransformation?.includes('launch-sheet rows')
  &&rationale.launch.derivedBoundary?.field==='maxEquipmentId'&&rationale.launch.derivedBoundary.value===264
  &&rationale.launch.derivedBoundary.role.includes('not a current selector, future boundary, or numeric-range admission rule')
  &&rationale.launch.predecessorClassificationBasis==='legacy-launch-sheet-count-and-canonical-boundary','launch historical rationale mismatch');
 check(rationale.legacyAdditional?.historicalSource==='추가장비'&&rationale.legacyAdditional.groupCount===20
  &&rationale.legacyAdditional.itemsPerGroup===4&&rationale.legacyAdditional.historicalExpectedCount===80
  &&rationale.legacyAdditional.predecessorTransformation?.includes('Date/group-based matching')
  &&rationale.legacyAdditional.predecessorClassificationBasis==='legacy-additional-sheet-date-group-match','legacy-additional historical rationale mismatch');
 check(rationale.currentAdditional?.historicalExpectedCount===32
  &&rationale.currentAdditional.predecessorClassificationBasis==='canonical-generic-complement-after-launch-and-legacy'
  &&rationale.currentAdditional.currentRole?.includes('not current selector or reusable future auto-classification rule'),'current-additional historical rationale mismatch');
 check(evidence.provenance?.pinnedPredecessorCommit===ANCHORS.predecessorCommit,'historical predecessor commit anchor mismatch');
 check(evidence.provenance?.predecessorAcquisitionArtifact?.path===ANCHORS.acquisitionPath&&evidence.provenance.predecessorAcquisitionArtifact.gitBlobSha1===ANCHORS.acquisitionBlob,'historical acquisition evidence anchor mismatch');
 check(evidence.provenance?.acquisitionReferenceContract?.path===ANCHORS.referenceContractPath&&evidence.provenance.acquisitionReferenceContract.gitBlobSha1===ANCHORS.referenceContractBlob,'historical reference contract evidence anchor mismatch');
 check(evidence.provenance?.predecessorValidation?.path===ANCHORS.predecessorValidationPath&&evidence.provenance.predecessorValidation.gitBlobSha1===ANCHORS.predecessorValidationBlob,'historical validation evidence anchor mismatch');
 check(evidence.historicalProvenance?.pinnedPredecessorCommit===ANCHORS.predecessorCommit&&evidence.historicalProvenance.acquisitionArtifactPath===ANCHORS.acquisitionPath,'historical trace locator mismatch');
 const records=evidence.records;
 check(Array.isArray(records)&&records.length===snapshot.recordCount,'historical provenance record count mismatch');
 const ids=new Set();const counts={launch:0,'legacy-additional':0,'current-additional':0};
 for(const r of records){
  check(Number.isInteger(r.equipmentId),'historical provenance equipmentId malformed');
  check(!ids.has(r.equipmentId),`duplicate historical provenance ID ${r.equipmentId}`);ids.add(r.equipmentId);
  check(r.predecessorLocator===`${hist.acquisitionArtifact.path}#equipmentId=${r.equipmentId}`,`historical predecessor locator mismatch ${r.equipmentId}`);
  check(Object.hasOwn(counts,r.acquisitionClass),`historical acquisitionClass malformed ${r.equipmentId}`);counts[r.acquisitionClass]++;
  check(r.evidenceClass==='B','historical trace record evidenceClass mismatch');
  check(same(Object.keys(r).sort(),['equipmentId','predecessorLocator','acquisitionClass','evidenceClass'].sort()),`historical trace record shape mismatch ${r.equipmentId}`);
 }
 check(same(counts,CLASS_COUNTS),'historical provenance class counts do not match preserved snapshot');
 check(same(hist.referenceContract.validatedCounts,CLASS_COUNTS),'historical contract class counts mismatch');
 check(same(evidence.historicalProvenance.classCounts,CLASS_COUNTS),'historical evidence class counts mismatch');
 check(digestHistoricalRecords(records)===snapshot.normalizedRecordSetSha256,'historical provenance snapshot digest mismatch');
 check(digestHistoricalRecords(records)===HISTORICAL_PROVENANCE_SHA256,'historical provenance differs from validator integrity anchor');
 check(evidence.provenance?.role?.includes('historical semantic transformation behind the inherited PR #19 B claim')
  &&evidence.provenance.role.includes('do not select or recalculate the current expected population'),'historical evidence role mismatch');
 check(evidence.historicalProvenance?.recordRole?.includes('historical transformation provenance for the inherited PR #19 B claim')
  &&evidence.historicalProvenance.recordRole.includes('current membership selector'),'historical row role mismatch');
 return [...ids].sort((a,b)=>a-b);
}
export function validateGeneralSsrEquipmentIdentity(args){
 const {canonical,evidence,contract,localization}=args;
 checkOwnerContract(contract);
 check(evidence?.schemaVersion===1&&evidence.evidenceClass==='B'&&evidence.responsibility==='General SSR Equipment identity/population','population evidence schema mismatch');
 check(evidence.ownerContract?.path===CONTRACT_PATH&&evidence.ownerContract?.authorityRole===contract.authorityRole,'population evidence owner link mismatch');
 check(evidence.scope?.ownerContract===CONTRACT_PATH&&evidence.scope?.recordCount===206,'population evidence scope mismatch');
 check(evidence.scope?.membershipRule?.includes('no ConfigData heuristic')&&evidence.scope.membershipRule.includes('historical class union'),'membership rule boundary mismatch');
 const historicalIds=validateHistoricalProvenance({evidence,contract});
 const config=contract.sourceValidation?.configData;
 check(config?.repository==='LuceatLuxVestra42/langrisser-future-guide'&&config.sourcePath==='data/configdata/ConfigDataEquipmentInfo.json','ConfigData source locator mismatch');
 check(config.preservedSourceCommit==='4d5e9d141d9720ced9b5ad99fa7b52f99b0d0706'&&config.gitBlobSha1===ANCHORS.configDataBlob&&config.sha256===ANCHORS.configDataSha256,'ConfigData source integrity anchor mismatch');
 check(config.directPopulationFieldPresent===false&&config.role.includes('not a population selector'),'ConfigData must remain validation-only');
 check(evidence.provenance?.configDataAnchor?.gitBlobSha1===ANCHORS.configDataBlob&&evidence.provenance.configDataAnchor.sha256===ANCHORS.configDataSha256,'ConfigData source anchor mismatch');
 check(evidence.provenance.configDataAnchor.sourcePath===config.sourcePath&&evidence.provenance.configDataAnchor.preservedSourceCommit===config.preservedSourceCommit&&evidence.provenance.configDataAnchor.recordCount===config.sourceRecordCount&&evidence.provenance.configDataAnchor.explicitIdentityField===config.explicitIdentityField,'ConfigData source-side anchor metadata mismatch');
 check(contract.sourceValidation?.projectIntegration?.joinKey==='EquipmentID'&&contract.crossRepositoryMapping?.joinKey==='EquipmentID','explicit EquipmentID join contract missing');
 check(contract.crossRepositoryMapping?.filenameSimilarityUsed===false&&contract.crossRepositoryMapping?.nameJoinUsed===false&&contract.crossRepositoryMapping?.recordOrderUsed===false&&contract.crossRepositoryMapping?.idArithmeticUsed===false,'cross-repository mapping boundary mismatch');
 check(contract.boundaryFixtures?.ids?.includes(304)&&contract.boundaryFixtures?.ids?.includes(308),'boundary fixtures missing');
 const canonicalIds=resolveCurrentGeneralSsrEquipmentIds({canonical,contract});
 check(digestIds(historicalIds)===ANCHORS.baselineIdSetSha256,'historical EquipmentID set differs from immutable PR #19 baseline');
 check(same(historicalIds,canonicalIds),'historical EquipmentID set differs from current canonical baseline');
 check(localization?.evidenceClass==='A'&&localization.projectSource?.name===contract.sourceValidation.projectIntegration.name,'project integration source provenance mismatch');
 const lp=localization.projectSource,cp=contract.sourceValidation.projectIntegration;
 check(lp.fileId===cp.fileId&&lp.sha256===cp.sha256&&lp.bytes===cp.bytes&&lp.recordCount===206&&lp.joinKey==='EquipmentID'&&lp.duplicateEquipmentIdCount===0,'project integration source metadata mismatch');
 const localizedIds=sortedIds(localization.records||[]);
 check(localizedIds.length===206&&new Set(localizedIds).size===206,'project localization ID count/uniqueness mismatch');
 const digestIdsLocalized=digestIds(localizedIds);
 check(digestIdsLocalized===cp.sortedEquipmentIdSetSha256,'project integration source ID-set digest mismatch');
 check(same(canonicalIds,localizedIds),'canonical and project integration EquipmentID parity mismatch');
 for(const id of contract.boundaryFixtures.ids)check(!canonicalIds.includes(id),`boundary fixture ${id} was admitted into population`);
 check(evidence.manualReview?.statement==='population inclusion != alias/replacement resolution'&&same(evidence.manualReview?.aliasReplacementMeaningUnresolvedIds,MANUAL_REVIEW_IDS),'alias/replacement review boundary mismatch');
 return {recordCount:canonicalIds.length,idSetSha256:digestIds(canonicalIds),integrationParity:'PASS',historicalRecordCount:historicalIds.length,boundaryFixtureIds:contract.boundaryFixtures.ids};
}
export async function loadAndValidateGeneralSsrEquipmentIdentity(root=process.cwd()){
 const read=async p=>JSON.parse(await readFile(resolve(root,p),'utf8'));
 const [canonical,evidence,contract,localization]=await Promise.all([read(CANONICAL_PATH),read(EVIDENCE_PATH),read(CONTRACT_PATH),read(LOCALIZATION_PATH)]);
 return validateGeneralSsrEquipmentIdentity({canonical,evidence,contract,localization});
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 const r=await loadAndValidateGeneralSsrEquipmentIdentity();
 process.stdout.write(`General SSR Equipment identity: PASS (${r.recordCount}; canonical/integration parity; historical provenance integrity; fixtures ${r.boundaryFixtureIds.join('/')})\\n`);
}
