import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { validateGeneralSsrEquipmentIdentity, resolveCurrentGeneralSsrEquipmentIds } from './validate-general-ssr-equipment-identity.mjs';
import { validateExclusiveEquipmentIdentity } from './validate-exclusive-equipment-identity.mjs';

// This binding belongs to the General SSR population contract's preserved source
// commit. It is deliberately separate from PR #210's Exclusive Equipment commit.
// Source ID/Rank checks do not determine General SSR membership.
export const PINNED_GENERAL_SSR_SOURCE = Object.freeze({
  repository: 'LuceatLuxVestra42/langrisser-future-guide',
  commit: '4d5e9d141d9720ced9b5ad99fa7b52f99b0d0706',
  commitTreeGitSha1: '532189256ff58d325c71e0fdb79edf0314e7ce37',
  path: 'data/configdata/ConfigDataEquipmentInfo.json',
  gitBlobSha1: '353c4f00b44a2ba0f8eb32dd03a76c3224635d04',
  sha256: 'b4e4a27c68a7038c1b282140b82a634c9d18c348f79b9e6d411840c7ffe54e70',
  byteLength: 1343806,
  recordCount: 548,
  idField: 'ID',
  checkedFields: Object.freeze(['ID', 'Rank']),
});

const isText = value => typeof value === 'string' && value.trim().length > 0;
const isId = value => Number.isSafeInteger(value) && value > 0;
const fail = (condition, code) => { if (!condition) throw new Error(code); };
const exactKeys = (value, keys) => value && typeof value === 'object' && !Array.isArray(value)
  && Object.keys(value).sort().join(',') === [...keys].sort().join(',');

function sourceIdentityIsPinned(identity) {
  return exactKeys(identity, Object.keys(PINNED_GENERAL_SSR_SOURCE))
    && Object.entries(PINNED_GENERAL_SSR_SOURCE).every(([key, value]) => {
      if (key === 'checkedFields') return JSON.stringify(identity[key]) === JSON.stringify(value);
      return identity[key] === value;
    });
}

function gitBlobSha1(bytes) {
  const header = Buffer.from(`blob ${bytes.length}\0`, 'ascii');
  return createHash('sha1').update(Buffer.concat([header, bytes])).digest('hex');
}

/**
 * Authenticate only the one source object pinned by the General SSR owner.
 * Caller-supplied digests are not anchors. No future source is accepted here.
 */
export function verifyPinnedGeneralSsrSource({ sourceIdentity, sourceBytes }) {
  if (!sourceIdentityIsPinned(sourceIdentity) || !Buffer.isBuffer(sourceBytes)) {
    return { sourceIdentity: 'NOT_VERIFIED', sourceRecords: null, records: null };
  }
  fail(sourceBytes.length === PINNED_GENERAL_SSR_SOURCE.byteLength, 'SOURCE_BYTE_LENGTH_MISMATCH');
  fail(createHash('sha256').update(sourceBytes).digest('hex') === PINNED_GENERAL_SSR_SOURCE.sha256, 'SOURCE_SHA256_MISMATCH');
  fail(gitBlobSha1(sourceBytes) === PINNED_GENERAL_SSR_SOURCE.gitBlobSha1, 'SOURCE_GIT_BLOB_SHA1_MISMATCH');
  let records;
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(sourceBytes);
    records = JSON.parse(text);
  } catch {
    throw new Error('SOURCE_JSON_INVALID');
  }
  fail(Array.isArray(records) && records.length === PINNED_GENERAL_SSR_SOURCE.recordCount, 'SOURCE_RECORD_SET_INVALID');
  return { sourceIdentity: 'PASS', sourceRecords: 'PASS', records };
}

export function compareCandidateSourceRecord(candidate, row) {
  const fields = candidate.source.fields;
  fail(row && row.ID === candidate.equipmentId, 'SOURCE_RECORD_ID_MISMATCH');
  fail(fields.ID === row.ID && fields.Rank === row.Rank, 'SOURCE_FIELD_MISMATCH');
}

function validateCandidateShape(candidate) {
  fail(exactKeys(candidate, ['equipmentId', 'candidateDomain', 'source', 'selectionEvidence']), 'CANDIDATE_SCHEMA_MISMATCH');
  fail(isId(candidate.equipmentId), 'INVALID_CANDIDATE_ID');
  fail(candidate.candidateDomain === 'GENERAL_SSR_EQUIPMENT', 'INVALID_CANDIDATE_DOMAIN');
  const sourceKeys = ['repository', 'version', 'path', 'recordLocator', 'fieldLocator', 'fields'];
  fail(exactKeys(candidate.source, sourceKeys), 'CANDIDATE_SOURCE_SCHEMA_MISMATCH');
  const source = candidate.source;
  fail(isText(source.repository) && isText(source.version) && source.path === PINNED_GENERAL_SSR_SOURCE.path, 'INVALID_SOURCE_LOCATOR_OR_VERSION');
  const expectedRecord = `${source.path}#ID=${candidate.equipmentId}`;
  fail(source.recordLocator === expectedRecord, 'SOURCE_RECORD_LOCATOR_MISMATCH');
  fail(source.fieldLocator === `${expectedRecord}/Rank`, 'SOURCE_FIELD_LOCATOR_MISMATCH');
  fail(exactKeys(source.fields, ['ID', 'Rank']) && source.fields.ID === candidate.equipmentId
    && (typeof source.fields.Rank === 'number' || typeof source.fields.Rank === 'string'), 'CANDIDATE_SOURCE_FIELDS_INVALID');
  if (candidate.selectionEvidence !== null) {
    fail(exactKeys(candidate.selectionEvidence, ['repository', 'version', 'locator', 'claim', 'scope', 'limitations']), 'SELECTION_EVIDENCE_SCHEMA_MISMATCH');
    fail(Object.values(candidate.selectionEvidence).every(isText), 'SELECTION_EVIDENCE_INCOMPLETE');
  }
}

/**
 * Screen candidate structure and source-field consistency against the pinned
 * General SSR source. The verified 206-ID Canonical owner is the collision
 * baseline; the Exclusive Equipment owner is separately validated for global
 * Equipment.ID collisions. Membership is always MANUAL_REVIEW because the
 * existing ConfigData contract explicitly has no direct population selector.
 */
export async function screenGeneralSsrEquipmentIncrement({ candidates, sourceIdentity, sourceBytes, root = process.cwd() }) {
  fail(Array.isArray(candidates), 'INVALID_CANDIDATE_LIST');
  const read = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'));
  const [canonical, evidence, contract, localization] = await Promise.all([
    read('canonical/general-ssr-equipment.v1.json'),
    read('evidence/source/equipment/general-ssr-equipment-population.v1.json'),
    read('evidence/source/equipment/general-ssr-equipment-population-contract.v1.json'),
    read('evidence/localization/general-ssr-equipment-ko.v1.json'),
  ]);
  const semantic = validateGeneralSsrEquipmentIdentity({ canonical, evidence, contract, localization });
  const generalIds = new Set(resolveCurrentGeneralSsrEquipmentIds({ canonical, contract }));
  fail(semantic.recordCount === 206 && generalIds.size === 206, 'INVALID_GENERAL_SSR_BASELINE');

  const [exclusiveCanonical, exclusiveEvidenceText] = await Promise.all([
    read('canonical/exclusive-equipment.v1.json'),
    readFile(resolve(root, 'evidence/exclusive-equipment-identity.v1.json'), 'utf8'),
  ]);
  const exclusiveEvidence = JSON.parse(exclusiveEvidenceText);
  validateExclusiveEquipmentIdentity({ canonical: exclusiveCanonical, evidence: exclusiveEvidence, evidenceText: exclusiveEvidenceText });
  const exclusiveIds = new Set(exclusiveCanonical.records.map(record => record.equipmentId));
  fail(exclusiveCanonical.records.length === 167 && exclusiveIds.size === 167, 'INVALID_EXCLUSIVE_EQUIPMENT_BASELINE');

  const duplicateIds = new Set();
  const counts = new Map();
  for (const candidate of candidates) if (isId(candidate?.equipmentId)) counts.set(candidate.equipmentId, (counts.get(candidate.equipmentId) ?? 0) + 1);
  for (const [id, count] of counts) if (count > 1) duplicateIds.add(id);

  const pinned = verifyPinnedGeneralSsrSource({ sourceIdentity, sourceBytes });
  const outcomes = candidates.map(candidate => {
    try {
      validateCandidateShape(candidate);
      fail(!duplicateIds.has(candidate.equipmentId), 'DUPLICATE_CANDIDATE_ID');
      fail(!generalIds.has(candidate.equipmentId), 'CANONICAL_ID_COLLISION');
      fail(!exclusiveIds.has(candidate.equipmentId), 'EXCLUSIVE_EQUIPMENT_ID_COLLISION');

      let sourceRecord = 'NOT_VERIFIED';
      if (pinned.sourceIdentity === 'PASS') {
        const matches = pinned.records.filter(row => row && row.ID === candidate.equipmentId);
        fail(matches.length === 1, 'SOURCE_RECORD_NOT_FOUND_OR_DUPLICATE');
        compareCandidateSourceRecord(candidate, matches[0]);
        sourceRecord = 'PASS';
      }
      const candidateUsesPinnedSource = sourceIdentityIsPinned(sourceIdentity)
        && candidate.source.repository === sourceIdentity.repository
        && candidate.source.version === sourceIdentity.commit;
      const sourceAuthenticity = candidateUsesPinnedSource ? pinned.sourceIdentity : 'NOT_VERIFIED';
      const status = sourceAuthenticity === 'PASS' && sourceRecord === 'PASS' ? 'MANUAL_REVIEW' : 'REVIEW';
      return {
        equipmentId: candidate.equipmentId,
        structuralScreen: 'PASS',
        sourceIdentity: sourceAuthenticity,
        sourceRecord,
        membership: 'MANUAL_REVIEW',
        status,
        canonicalAdmission: 'NOT_APPROVED',
        localizationAdmission: 'NOT_APPROVED',
        assetAdmission: 'NOT_APPROVED',
        publication: 'NOT_APPROVED',
      };
    } catch (error) {
      return {
        equipmentId: candidate?.equipmentId ?? null,
        structuralScreen: 'BLOCKER',
        sourceIdentity: 'NOT_VERIFIED',
        sourceRecord: 'NOT_VERIFIED',
        membership: 'MANUAL_REVIEW',
        status: 'BLOCKER',
        reason: error.message,
        canonicalAdmission: 'NOT_APPROVED',
        localizationAdmission: 'NOT_APPROVED',
        assetAdmission: 'NOT_APPROVED',
        publication: 'NOT_APPROVED',
      };
    }
  });
  return {
    baseline: { generalSsrCanonical: semantic.recordCount, exclusiveEquipment: exclusiveCanonical.records.length },
    sourceAnchor: pinned.sourceIdentity,
    candidates: outcomes,
    semanticMembershipRule: 'MANUAL_REVIEW',
    canonicalAdmission: 'NOT_APPROVED',
    publication: 'NOT_APPROVED',
  };
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  const read = async path => JSON.parse(await readFile(resolve(path), 'utf8'));
  const result = await screenGeneralSsrEquipmentIncrement({ candidates: [], root: process.cwd() });
  process.stdout.write(`General SSR Equipment increment baseline: PASS (${result.baseline.generalSsrCanonical} canonical, ${result.baseline.exclusiveEquipment} exclusive; source byte authentication requires caller bytes)\n`);
}
