import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  PINNED_GENERAL_SSR_SOURCE,
  compareCandidateSourceRecord,
  screenGeneralSsrEquipmentIncrement as screen,
  verifyPinnedGeneralSsrSource,
} from './general-ssr-equipment-increment-contract.mjs';

const read = async path => JSON.parse(await readFile(path, 'utf8'));
const canonical = await read('canonical/general-ssr-equipment.v1.json');
const exclusive = await read('canonical/exclusive-equipment.v1.json');
const candidate = id => ({
  equipmentId: id,
  candidateDomain: 'GENERAL_SSR_EQUIPMENT',
  source: {
    repository: PINNED_GENERAL_SSR_SOURCE.repository,
    version: PINNED_GENERAL_SSR_SOURCE.commit,
    path: PINNED_GENERAL_SSR_SOURCE.path,
    recordLocator: `${PINNED_GENERAL_SSR_SOURCE.path}#ID=${id}`,
    fieldLocator: `${PINNED_GENERAL_SSR_SOURCE.path}#ID=${id}/Rank`,
    fields: { ID: id, Rank: 5 },
  },
  selectionEvidence: null,
});
const input = { candidates: [candidate(99999999)], sourceIdentity: { ...PINNED_GENERAL_SSR_SOURCE } };
const before = structuredClone(input);
const positiveStructure = await screen(input);
assert.equal(positiveStructure.baseline.generalSsrCanonical, 206);
assert.equal(positiveStructure.baseline.exclusiveEquipment, 167);
assert.deepEqual(positiveStructure.candidates[0], {
  equipmentId: 99999999,
  structuralScreen: 'PASS',
  sourceIdentity: 'NOT_VERIFIED',
  sourceRecord: 'NOT_VERIFIED',
  membership: 'MANUAL_REVIEW',
  status: 'REVIEW',
  canonicalAdmission: 'NOT_APPROVED',
  localizationAdmission: 'NOT_APPROVED',
  assetAdmission: 'NOT_APPROVED',
  publication: 'NOT_APPROVED',
});
assert.deepEqual(input, before, 'screening must not mutate its inputs');

const block = async (items, reason) => {
  const result = await screen({ candidates: items, sourceIdentity: { ...PINNED_GENERAL_SSR_SOURCE } });
  assert.equal(result.candidates[0].status, 'BLOCKER');
  assert.equal(result.candidates[0].reason, reason);
};
await block([candidate('12')], 'INVALID_CANDIDATE_ID');
await block([candidate(canonical.records[0].id)], 'CANONICAL_ID_COLLISION');
await block([candidate(exclusive.records[0].equipmentId)], 'EXCLUSIVE_EQUIPMENT_ID_COLLISION');
await block([candidate(99999999), candidate(99999999)], 'DUPLICATE_CANDIDATE_ID');
for (const id of [265, 266, 267, 268, 288, 289, 290, 291]) await block([candidate(id)], 'CANONICAL_ID_COLLISION');
await block([(() => { const c = candidate(99999999); c.source.fields.ID++; return c; })()], 'CANDIDATE_SOURCE_FIELDS_INVALID');
await block([(() => { const c = candidate(99999999); c.source.recordLocator += '/wrong'; return c; })()], 'SOURCE_RECORD_LOCATOR_MISMATCH');
await block([(() => { const c = candidate(99999999); c.source.fieldLocator += '/wrong'; return c; })()], 'SOURCE_FIELD_LOCATOR_MISMATCH');
await block([(() => { const c = candidate(99999999); c.relationLocalId = 42; return c; })()], 'CANDIDATE_SCHEMA_MISMATCH');
await block([(() => { const c = candidate(99999999); c.canonicalAdmission = 'APPROVED'; return c; })()], 'CANDIDATE_SCHEMA_MISMATCH');
await block([(() => { const c = candidate(99999999); c.publication = 'APPROVED'; return c; })()], 'CANDIDATE_SCHEMA_MISMATCH');

const pinnedTamper = await screen({
  candidates: [candidate(99999999)],
  sourceIdentity: { ...PINNED_GENERAL_SSR_SOURCE, commit: 'f'.repeat(40) },
});
assert.equal(pinnedTamper.candidates[0].sourceIdentity, 'NOT_VERIFIED', 'a changed Source Commit must not authenticate');
const blobTamper = await screen({
  candidates: [candidate(99999999)],
  sourceIdentity: { ...PINNED_GENERAL_SSR_SOURCE, gitBlobSha1: 'f'.repeat(40) },
});
assert.equal(blobTamper.candidates[0].sourceIdentity, 'NOT_VERIFIED', 'a changed Source Blob must not authenticate');
const digestOnly = await screen({
  candidates: [candidate(99999999)],
  sourceIdentity: { sha256: PINNED_GENERAL_SSR_SOURCE.sha256 },
});
assert.equal(digestOnly.candidates[0].sourceIdentity, 'NOT_VERIFIED', 'caller-supplied digest alone is not an anchor');
assert.throws(() => verifyPinnedGeneralSsrSource({
  sourceIdentity: { ...PINNED_GENERAL_SSR_SOURCE },
  sourceBytes: Buffer.from('[]'),
}), /SOURCE_BYTE_LENGTH_MISMATCH/);

const row = { ID: 99999999, Rank: 5, Name: 'fixture only' };
assert.doesNotThrow(() => compareCandidateSourceRecord(candidate(99999999), row));
assert.throws(() => compareCandidateSourceRecord(candidate(99999999), { ...row, ID: 7 }), /SOURCE_RECORD_ID_MISMATCH/);
assert.throws(() => compareCandidateSourceRecord(candidate(99999999), { ...row, Rank: 6 }), /SOURCE_FIELD_MISMATCH/);

const selectorClaim = candidate(99999998);
selectorClaim.selectionEvidence = {
  repository: 'fixture/research', version: 'unverified', locator: 'fixture#Rank=5',
  claim: 'Rank 5 means General SSR', scope: 'future General SSR membership', limitations: 'not independently admitted',
};
const selectorResult = await screen({ candidates: [selectorClaim], sourceIdentity: { ...PINNED_GENERAL_SSR_SOURCE } });
assert.equal(selectorResult.candidates[0].membership, 'MANUAL_REVIEW', 'Rank must not become a membership selector');
assert.equal(selectorResult.candidates[0].canonicalAdmission, 'NOT_APPROVED');
assert.equal(selectorResult.candidates[0].publication, 'NOT_APPROVED');

process.stdout.write('General SSR Equipment increment screening tests: PASS (206 baseline, 167 cross-domain collision set, ID/source boundaries, MANUAL_REVIEW and no admission/publication)\n');
