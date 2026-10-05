import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolveCurrentGeneralSsrEquipmentIds, validateGeneralSsrEquipmentIdentity } from './validate-general-ssr-equipment-identity.mjs';
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const [canonical,evidence,contract,localization]=await Promise.all([
 read('canonical/general-ssr-equipment.v1.json'),
 read('evidence/source/equipment/general-ssr-equipment-population.v1.json'),
 read('evidence/source/equipment/general-ssr-equipment-population-contract.v1.json'),
 read('evidence/localization/general-ssr-equipment-ko.v1.json')
]);
const args={canonical,evidence,contract,localization};
assert.equal(validateGeneralSsrEquipmentIdentity(args).recordCount,206);
const semanticBaseline=resolveCurrentGeneralSsrEquipmentIds(args);
const changed=change=>{const x=structuredClone(args);change(x);return x;};
const assertFullFails=(change,pattern)=>assert.throws(()=>validateGeneralSsrEquipmentIdentity(changed(change)),pattern);
const assertHistoricalMutation=(change,pattern=/historical/)=>{
 const x=changed(change);
 assert.deepEqual(resolveCurrentGeneralSsrEquipmentIds(x),semanticBaseline);
 assert.throws(()=>validateGeneralSsrEquipmentIdentity(x),pattern);
};
const assertIndependentSemanticResult=change=>{
 const x=changed(change);
 assert.deepEqual(resolveCurrentGeneralSsrEquipmentIds(x),semanticBaseline);
};
assertFullFails(x=>x.canonical.records.pop(),/canonical population count/);
assertFullFails(x=>x.canonical.records[1].id=x.canonical.records[0].id,/canonical population count/);
assertFullFails(x=>x.canonical.records.push({...x.canonical.records[0],id:304,provenance:'evidence/source/equipment/general-ssr-equipment-population.v1.json#EquipmentID=304'}),/canonical population count|ID set/);
assertFullFails(x=>x.canonical.records.push({...x.canonical.records[0],id:308,provenance:'evidence/source/equipment/general-ssr-equipment-population.v1.json#EquipmentID=308'}),/canonical population count|ID set/);
assertFullFails(x=>x.localization.records.pop(),/project localization ID count/);
assertFullFails(x=>x.contract.sourceValidation.configData.sha256='0'.repeat(64),/ConfigData source integrity anchor mismatch/);
assertFullFails(x=>x.contract.population.canonicalBaseline.repository='unexpected/repository',/reviewed baseline/);
assertFullFails(x=>x.contract.population.canonicalBaseline.pullRequest=20,/reviewed baseline/);
assertFullFails(x=>x.contract.population.canonicalBaseline.reviewedCommit='0'.repeat(40),/reviewed baseline/);
assertFullFails(x=>x.contract.population.canonicalBaseline.gitBlobSha1='0'.repeat(40),/immutable PR #19 baseline anchor/);
assertFullFails(x=>x.contract.population.canonicalBaseline.sortedIdSetSha256='0'.repeat(64),/immutable PR #19 baseline anchor/);
const coordinatedBaselineTamper=changed(x=>{
 const record=x.canonical.records[0];
 record.id=9999;
 record.provenance='evidence/source/equipment/general-ssr-equipment-population.v1.json#EquipmentID=9999';
 const ids=x.canonical.records.map(r=>r.id).sort((a,b)=>a-b);
 x.contract.population.canonicalBaseline.sortedIdSetSha256=createHash('sha256').update(JSON.stringify(ids),'utf8').digest('hex');
});
assert.throws(()=>validateGeneralSsrEquipmentIdentity(coordinatedBaselineTamper),/immutable PR #19 baseline anchor/);
assertFullFails(x=>x.canonical.records[0].aliasOf=1,/canonical identity record contains out-of-scope semantic fields/);
for (const mutate of [
 x=>x.evidence.records.pop(),
 x=>x.evidence.records.push({...x.evidence.records.at(-1),equipmentId:999999,predecessorLocator:'data/generated/equipment_stage2_7_acquisition.json#equipmentId=999999'}),
 x=>{x.evidence.records[0].equipmentId=999999;x.evidence.records[0].predecessorLocator='data/generated/equipment_stage2_7_acquisition.json#equipmentId=999999';}
]) assertHistoricalMutation(mutate,/historical/); // removal, addition and replacement are rejected
assertHistoricalMutation(x=>x.evidence.records[0].equipmentId=999999,/historical predecessor locator mismatch/); // ID-only tamper
assertHistoricalMutation(x=>x.evidence.records[0].predecessorLocator='data/generated/equipment_stage2_7_acquisition.json#equipmentId=999999',/historical predecessor locator mismatch/); // locator-only tamper
assertHistoricalMutation(x=>{x.evidence.records[0].equipmentId=999999;x.evidence.records[0].predecessorLocator='data/generated/equipment_stage2_7_acquisition.json#equipmentId=999998';},/historical predecessor locator mismatch/); // ID/locator mismatch
assertHistoricalMutation(x=>x.evidence.records[0].predecessorLocator='malformed-locator',/historical predecessor locator mismatch/);
assertHistoricalMutation(x=>{x.evidence.records[0].equipmentId=999999;x.evidence.records[0].predecessorLocator='data/generated/equipment_stage2_7_acquisition.json#equipmentId=999999';},/historical provenance snapshot digest mismatch/); // coordinated tamper
assertHistoricalMutation(x=>x.evidence.records[0].acquisitionClass='current-additional',/historical provenance class counts|historical provenance snapshot digest/); // preserved provenance field tamper
assertHistoricalMutation(x=>x.evidence.records[0].evidenceClass='A',/historical trace record evidenceClass mismatch/); // record shape/value integrity
assertHistoricalMutation(x=>x.evidence.historicalProvenance.classCounts.launch=999,/historical evidence class counts mismatch/);
assertHistoricalMutation(x=>x.contract.historicalPredecessor.pinnedCommit='0'.repeat(40));
assertHistoricalMutation(x=>x.contract.historicalPredecessor.acquisitionArtifact.gitBlobSha1='0'.repeat(40));
assertHistoricalMutation(x=>x.contract.historicalPredecessor.referenceContract.gitBlobSha1='0'.repeat(40));
assertHistoricalMutation(x=>x.contract.historicalPredecessor.validationArtifact.gitBlobSha1='0'.repeat(40));
assertHistoricalMutation(x=>x.contract.historicalPredecessor.provenanceSnapshotIntegrity.normalizedRecordSetSha256='0'.repeat(64));
assertHistoricalMutation(x=>x.evidence.provenance.pinnedPredecessorCommit='0'.repeat(40));
assertHistoricalMutation(x=>x.evidence.provenance.predecessorAcquisitionArtifact.gitBlobSha1='0'.repeat(40));
assertHistoricalMutation(x=>x.evidence.provenance.acquisitionReferenceContract.gitBlobSha1='0'.repeat(40));
assertHistoricalMutation(x=>x.evidence.provenance.predecessorValidation.gitBlobSha1='0'.repeat(40));
// Historical values do not affect semantic expected IDs, but the full validator protects snapshot integrity.
const classChange=changed(x=>{x.evidence.records[0].acquisitionClass='current-additional';});
assert.deepEqual(resolveCurrentGeneralSsrEquipmentIds(classChange),semanticBaseline);
assert.throws(()=>validateGeneralSsrEquipmentIdentity(classChange),/historical/);
assertIndependentSemanticResult(x=>x.evidence.records[0].equipmentId=999999);
assertIndependentSemanticResult(x=>x.evidence.records[0].predecessorLocator='malformed-locator');
assert(!canonical.records.some(r=>[304,308].includes(r.id)));
process.stdout.write('General SSR Equipment identity tests: PASS (semantic authority and historical provenance integrity checked independently)\\n');
