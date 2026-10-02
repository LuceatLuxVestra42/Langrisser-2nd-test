import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateExclusiveEquipmentIdentity } from './validate-exclusive-equipment-identity.mjs';

const canonical = JSON.parse(await readFile('canonical/exclusive-equipment.v1.json', 'utf8'));
const evidence = JSON.parse(await readFile('evidence/exclusive-equipment-identity.v1.json', 'utf8'));
assert.deepEqual(validateExclusiveEquipmentIdentity({ canonical, evidence }), {
  canonicalCount: evidence.claims.claimB.records.length,
  claimAObservedCount: evidence.claims.claimA.records.length,
  claimBObservedCount: evidence.claims.claimB.records.length,
  exactMatch: evidence.claims.claimB.records.length,
  missing: 0,
  unexpected: 0,
  duplicates: 0
});

const expectFailure = (code, mutateCanonical, mutateEvidence) => {
  const c = structuredClone(canonical);
  const e = structuredClone(evidence);
  if (mutateCanonical) mutateCanonical(c);
  if (mutateEvidence) mutateEvidence(e);
  assert.throws(
    () => validateExclusiveEquipmentIdentity({ canonical: c, evidence: e }),
    error => String(error?.message).includes('[' + code + ']')
  );
};

expectFailure('CANONICAL_ID_SET_MISMATCH', x => x.records.pop());
expectFailure('CANONICAL_ID_SET_MISMATCH', x => x.records.push({ equipmentId: 999999 }));
expectFailure('CANONICAL_DUPLICATE_ID', x => { x.records[1].equipmentId = x.records[0].equipmentId; });

expectFailure('EVIDENCE_INTEGRITY_MISMATCH', null, x => { x.claims.claimB.records.pop(); });
expectFailure('EVIDENCE_INTEGRITY_MISMATCH', null, x => { x.claims.claimB.records.push(structuredClone(x.claims.claimB.records[0])); x.claims.claimB.records.at(-1).equipmentId = 999999; });
expectFailure('EVIDENCE_INTEGRITY_MISMATCH', null, x => { x.claims.claimB.records[0].acquisitionClass = 'generic-equipment'; });
expectFailure('EVIDENCE_INTEGRITY_MISMATCH', null, x => { x.claims.claimB.records[0].classificationBasis = 'tampered'; });
expectFailure('EVIDENCE_INTEGRITY_MISMATCH', null, x => { x.claims.claimA.provenance.commit = 'tampered'; });
expectFailure('EVIDENCE_INTEGRITY_MISMATCH', null, x => { x.claims.claimA.provenance.path = 'tampered'; });
expectFailure('EVIDENCE_INTEGRITY_MISMATCH', null, x => { x.claims.claimA.provenance.gitBlobSha1 = 'tampered'; });
expectFailure('EVIDENCE_INTEGRITY_MISMATCH', null, x => { x.semanticDecision.commit = 'tampered'; });
expectFailure('EVIDENCE_INTEGRITY_MISMATCH', null, x => { x.semanticDecision.path = 'tampered'; });
expectFailure('EVIDENCE_INTEGRITY_MISMATCH', null, x => { x.semanticDecision.gitBlobSha1 = 'tampered'; });
expectFailure('EVIDENCE_INTEGRITY_MISMATCH', null, x => { x.semanticDecision.classification = 'generic-equipment'; });

expectFailure('CANONICAL_SCOPE_LEAKAGE', x => { x.records[0].heroId = 1; });
expectFailure('CANONICAL_SCOPE_LEAKAGE', x => { x.records[0].nameKo = '...'; });
expectFailure('CANONICAL_SCOPE_LEAKAGE', x => { x.records[0].effectText = '...'; });
expectFailure('CANONICAL_SCOPE_LEAKAGE', x => { x.records[0].releaseStatus = 'released'; });

process.stdout.write('Exclusive Equipment identity negatives: PASS (canonical/evidence set tamper, pinned provenance tamper, class tamper, and scope leakage)\n');
