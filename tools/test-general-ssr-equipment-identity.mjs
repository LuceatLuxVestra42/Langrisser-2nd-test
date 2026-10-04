import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateGeneralSsrEquipmentIdentity } from './validate-general-ssr-equipment-identity.mjs';
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const [canonical,evidence,contract,localization]=await Promise.all([
 read('canonical/general-ssr-equipment.v1.json'),
 read('evidence/source/equipment/general-ssr-equipment-population.v1.json'),
 read('evidence/source/equipment/general-ssr-equipment-population-contract.v1.json'),
 read('evidence/localization/general-ssr-equipment-ko.v1.json')
]);
const args={canonical,evidence,contract,localization};
assert.equal(validateGeneralSsrEquipmentIdentity(args).recordCount,206);
const fail=(change,pattern)=>{const x=structuredClone(args);change(x);assert.throws(()=>validateGeneralSsrEquipmentIdentity(x),pattern);};
const pass=change=>{const x=structuredClone(args);change(x);assert.equal(validateGeneralSsrEquipmentIdentity(x).recordCount,206);};
fail(x=>x.canonical.records.pop(),/canonical population count/);
fail(x=>x.canonical.records[1].id=x.canonical.records[0].id,/canonical population count/);
fail(x=>x.canonical.records.push({...x.canonical.records[0],id:304,provenance:'evidence/source/equipment/general-ssr-equipment-population.v1.json#EquipmentID=304'}),/canonical population count|ID set/);
fail(x=>x.localization.records.pop(),/project localization ID count/);
fail(x=>x.contract.sourceValidation.configData.sha256='0'.repeat(64),/ConfigData source integrity anchor mismatch/);
fail(x=>x.evidence.provenance.pinnedPredecessorCommit='0'.repeat(40),/historical predecessor commit anchor mismatch/);
fail(x=>x.canonical.records[0].aliasOf=1,/canonical identity record contains out-of-scope semantic fields/);
// Historical class labels are documentary provenance; changing them cannot change current membership.
pass(x=>{for(const r of x.evidence.historicalProvenance.records)r.acquisitionClass='reclassified-historically';});
pass(x=>{x.evidence.historicalProvenance.records[0].equipmentId=999999;x.evidence.historicalProvenance.records[0].predecessorLocator='historical#equipmentId=999999';}); // historical membership cannot redefine current membership
// The boundary examples stay excluded from the contract-pinned population.
assert(!canonical.records.some(r=>[304,308].includes(r.id)));
process.stdout.write('General SSR Equipment identity negatives: PASS (owner contract, canonical parity, localization parity, historical non-authority, boundary fixtures)\\n');
