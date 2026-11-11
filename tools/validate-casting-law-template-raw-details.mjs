import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

const EVIDENCE_PATH = 'evidence/source/jobs/casting-law-template-raw-details.v1.json';
const CANONICAL_PATH = 'canonical/casting-law-template-raw-details.v1.json';
const REFERENCE_EVIDENCE_PATH = 'evidence/source/jobs/hero15-casting-law-template-references.v1.json';
const REFERENCE_CANONICAL_PATH = 'canonical/hero-casting-law-template-references.v1.json';
const SOURCE = {
  repository: 'LuceatLuxVestra42/langrisser-future-guide',
  commit: '6475e63ee23d18adf733756c26a14fa9e3ed662c',
  tree: '08e1e6c2773730e60b258940e31494f68d65f86a',
  configDataSubtree: 'b18983f60cb054c2e6e094d64cdb98979211d7fc',
  path: 'data/configdata/ConfigDataCastingLawTemplateInfo.json',
  gitBlobSha1: '3d3f403120324a258cc1e1d03dd4af3cf56ad10e',
  sha256: '8e26a550cfb55757daa5221a674281eebea1a71e0993e30b136b98fcc98c459d',
  byteLength: 14036,
  recordCount: 50,
  encoding: 'UTF-8 JSON; parsed for record selection; original source bytes retained externally by pinned blob.',
};
const IDS = [12, 14, 37, 40, 41];
const EXPECTED = [
  { sourceArrayIndex: 11, rawRecord: { ID: 12, Name: '锤之铸纹', CastingLawLevelUpInfoList: [56,57,58,59,60,10056,10057,10058,10059,10060], Icon: 'UI/Common_New_ABS/Icon/Icon_CastingLaw_Hammer.png' }, equipmentType: 'ABSENT' },
  { sourceArrayIndex: 13, rawRecord: { ID: 14, Name: '杖之铸纹', CastingLawLevelUpInfoList: [66,67,68,69,70,10066,10067,10068,10069,10070], Icon: 'UI/Common_New_ABS/Icon/Icon_CastingLaw_Wand.png' }, equipmentType: 'ABSENT' },
  { sourceArrayIndex: 36, rawRecord: { ID: 37, Name: '布甲铸纹', EquipmentType: 1, CastingLawLevelUpInfoList: [181,182,183,184,185,10181,10182,10183,10184,10185], Icon: 'UI/Common_New_ABS/Icon/Icon_CastingLaw_Cloth.png' }, equipmentType: 'PRESENT' },
  { sourceArrayIndex: 39, rawRecord: { ID: 40, Name: '布帽铸纹', EquipmentType: 2, CastingLawLevelUpInfoList: [196,197,198,199,200,10196,10197,10198,10199,10200], Icon: 'UI/Common_New_ABS/Icon/Icon_CastingLaw_Cap.png' }, equipmentType: 'PRESENT' },
  { sourceArrayIndex: 40, rawRecord: { ID: 41, Name: '饰品铸纹', EquipmentType: 3, CastingLawLevelUpInfoList: [201,202,203,204,205,10201,10202,10203,10204,10205], Icon: 'UI/Common_New_ABS/Icon/Icon_CastingLaw_Ornaments.png' }, equipmentType: 'PRESENT' },
];
const check = (value, code, message) => { if (!value) throw new Error(`Casting Law Template raw-detail validation failed [${code}]: ${message}`); };
const exactKeys = (value, keys, label, code = 'SCHEMA') => check(value && typeof value === 'object' && !Array.isArray(value)
  && isDeepStrictEqual(Object.keys(value).sort(), [...keys].sort()), code, `${label} keys drift`);
const readJson = async (root, path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const stateFor = (record, key) => {
  if (!Object.hasOwn(record, key)) return 'ABSENT';
  if (record[key] === null) return 'NULL';
  if (Array.isArray(record[key]) && record[key].length === 0) return 'EMPTY_ARRAY';
  if (record[key] && typeof record[key] === 'object' && !Array.isArray(record[key]) && Object.keys(record[key]).length === 0) return 'EMPTY_OBJECT';
  if (record[key] === '') return 'EMPTY_STRING';
  if (record[key] === 0) return 'ZERO';
  return 'PRESENT';
};

export function validateCastingLawTemplateRawDetailsData({ evidence, canonical, referenceEvidence, referenceCanonical }) {
  exactKeys(evidence, ['schemaVersion','claimType','owner','scope','source','selectionEvidence','fieldsInspected','templateRecords','interpretation'], 'Evidence');
  check(evidence.schemaVersion === 1 && evidence.claimType === 'casting-law-template-raw-details'
    && evidence.owner === 'shared-casting-law-template-raw-detail', 'EVIDENCE', 'owner or schema identity drift');
  check(isDeepStrictEqual(evidence.source, SOURCE), 'SOURCE_PIN', 'source version, blob, digest, byte length, or source count drift');
  check(evidence.scope?.templateNamespace === 'ConfigDataCastingLawTemplateInfo.ID'
    && isDeepStrictEqual(evidence.scope?.templateIds, IDS)
    && evidence.scope?.selectionBasis === 'Existing Hero 15 CastingLawTemplates_ID references select these shared Template endpoints; Hero ID is selection context only and is not part of Template identity.', 'SCOPE', 'shared Template scope drift');
  check(evidence.selectionEvidence?.path === REFERENCE_EVIDENCE_PATH
    && evidence.selectionEvidence?.referenceCanonical === REFERENCE_CANONICAL_PATH
    && isDeepStrictEqual(evidence.selectionEvidence?.templateIdsInSourceOrder, [14,12,37,40,41])
    && evidence.selectionEvidence?.existingEndpointPresenceEvidenceReused === true, 'SELECTION', 'selection source or prior endpoint reuse drift');
  check(isDeepStrictEqual(evidence.fieldsInspected, ['ID','Name','CastingLawLevelUpInfoList','Icon','EquipmentType']), 'FIELDS', 'inspected raw field set drift');
  check(evidence.interpretation?.evidenceClass === 'A_DIRECT_SOURCE_RECORD'
    && evidence.interpretation?.sourceIdentity === 'ConfigDataCastingLawTemplateInfo.ID only.'
    && evidence.interpretation?.limitation === 'Raw source fields and observed field states only. No Hero identity on Template records, Template-to-LevelUp relation admission, material/cost interpretation, equipment slot, mastery, unlock, use, application, combat, acquisition, or publication claim.', 'BOUNDARY', 'raw-only evidence boundary drift');
  check(Array.isArray(evidence.templateRecords) && evidence.templateRecords.length === EXPECTED.length, 'POPULATION', 'expected five selected Template records');

  const referenceIds = referenceCanonical?.records?.map((r) => r.templateId);
  check(referenceEvidence?.sourceSnapshot?.commit === SOURCE.commit
    && referenceEvidence?.templateSource?.blobSha1 === SOURCE.gitBlobSha1
    && isDeepStrictEqual(referenceEvidence?.templateRecords?.map((r) => r.fields.ID), IDS)
    && isDeepStrictEqual(referenceIds, [14,12,37,40,41]), 'REFERENCE_PRESERVATION', 'existing five Hero-Template references or endpoint presence differ');

  const expectedEvidence = EXPECTED.map(({ sourceArrayIndex, rawRecord, equipmentType }) => ({
    sourceArrayIndex,
    recordLocator: `ConfigDataCastingLawTemplateInfo#ID=${rawRecord.ID}`,
    rawRecord,
    fieldStates: {
      ID: 'PRESENT', Name: 'PRESENT', CastingLawLevelUpInfoList: 'PRESENT', Icon: 'PRESENT', EquipmentType: equipmentType,
    },
  }));
  check(isDeepStrictEqual(evidence.templateRecords, expectedEvidence), 'RAW_SOURCE_PARITY', 'exact source record, locator, array order, field values, or observed presence state changed');

  exactKeys(canonical, ['schemaVersion','scope','sourceScope','records'], 'Canonical');
  check(canonical.schemaVersion === 1 && canonical.sourceScope === 'CN ConfigData snapshot 2026-09-02'
    && canonical.scope === 'Selected shared Casting Law Template raw records keyed only by ConfigDataCastingLawTemplateInfo.ID. This is not a complete Template population and admits no Hero assignment or runtime meaning.', 'CANONICAL_SCOPE', 'Canonical identity or scope drift');
  const expectedCanonical = expectedEvidence.map((r) => ({
    templateId: r.rawRecord.ID,
    rawRecord: r.rawRecord,
    fieldStates: r.fieldStates,
    provenance: `${EVIDENCE_PATH}#templateRecords/ID=${r.rawRecord.ID}`,
  }));
  check(isDeepStrictEqual(canonical.records, expectedCanonical), 'CANONICAL_PARITY', 'Canonical raw fields, field states, order, provenance, or identity keys differ from direct evidence');
  check(canonical.records.every((r) => !Object.hasOwn(r, 'heroId') && !Object.hasOwn(r, 'jobId')
    && !Object.hasOwn(r, 'runtimeRules') && !Object.hasOwn(r, 'materials') && !Object.hasOwn(r, 'levelReferences')), 'BOUNDARY', 'Hero relation, Level relation, material detail, or runtime fields mixed into Template identity');
  for (const r of evidence.templateRecords) {
    check(r.rawRecord.ID === IDS[EXPECTED.findIndex((x) => x.sourceArrayIndex === r.sourceArrayIndex)], 'IDENTITY', 'Template ID/index mismatch');
    for (const [field, state] of Object.entries(r.fieldStates)) check(stateFor(r.rawRecord, field) === state, 'FIELD_STATE', `record ${r.rawRecord.ID} ${field} field state is not a direct raw observation`);
  }
  return { templateCount: canonical.records.length, templateIds: IDS };
}

export async function validateCastingLawTemplateRawDetails(root = process.cwd()) {
  const [evidence, canonical, referenceEvidence, referenceCanonical] = await Promise.all([
    readJson(root, EVIDENCE_PATH), readJson(root, CANONICAL_PATH),
    readJson(root, REFERENCE_EVIDENCE_PATH), readJson(root, REFERENCE_CANONICAL_PATH),
  ]);
  const result = validateCastingLawTemplateRawDetailsData({ evidence, canonical, referenceEvidence, referenceCanonical });
  process.stdout.write(`Casting Law Template raw details: PASS (templates=${result.templateCount}; shared Template identity; exact raw fields and presence states; no runtime/publication semantics)\n`);
  return result;
}
if (process.argv[1] && resolve(process.argv[1]) === resolve('tools/validate-casting-law-template-raw-details.mjs')) await validateCastingLawTemplateRawDetails();
