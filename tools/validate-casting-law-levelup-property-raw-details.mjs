import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

const E = 'evidence/source/jobs/casting-law-levelup-property-raw-details.v1.json';
const C = 'canonical/casting-law-levelup-property-raw-details.v1.json';
const REF = 'canonical/casting-law-template-level-references.v1.json';
const TEMPLATE = 'canonical/casting-law-template-raw-details.v1.json';
const RAW = 'canonical/casting-law-levelup-raw-details.v1.json';
const RAW_EVIDENCE = 'evidence/source/jobs/casting-law-levelup-raw-details.v1.json';
const PREVIOUS = 'canonical/casting-law-levelup-previous-level-references.v1.json';
const MATERIALS = 'canonical/casting-law-levelup-material-references.v1.json';
const SNAPSHOT = { repository: 'LuceatLuxVestra42/langrisser-future-guide', commit: '6475e63ee23d18adf733756c26a14fa9e3ed662c', tree: '08e1e6c2773730e60b258940e31494f68d65f86a', configDataSubtree: 'b18983f60cb054c2e6e094d64cdb98979211d7fc' };
const SOURCE = { path: 'data/configdata/ConfigDataCastingLawLevelUpInfo.json', blobSha1: '83b99ebff9c54523d7f9476b92e8b3d59229179f', sha256: '07b91384b3dab506d501d74b4e70b6535b84f5d620e0082c3e557afec146e849', byteLength: 232171, recordCount: 500 };
const IDS = [66,67,68,69,70,10066,10067,10068,10069,10070,56,57,58,59,60,10056,10057,10058,10059,10060,181,182,183,184,185,10181,10182,10183,10184,10185,196,197,198,199,200,10196,10197,10198,10199,10200,201,202,203,204,205,10201,10202,10203,10204,10205];
const INDEXES = [65,66,67,68,69,315,316,317,318,319,55,56,57,58,59,305,306,307,308,309,180,181,182,183,184,430,431,432,433,434,195,196,197,198,199,445,446,447,448,449,200,201,202,203,204,450,451,452,453,454];
const FIELDS = Array.from({ length: 6 }, (_, i) => [`Property${i + 1}_ID`, `Property${i + 1}_Value`]).flat();
const STATES = ['PRESENT','ABSENT','NULL','ZERO','EMPTY_STRING','EMPTY_ARRAY','EMPTY_OBJECT'];
const EXPECTED_SUMMARY = [
  [50,0,50,0], [50,0,50,0], [50,0,50,0], [48,2,48,2],
  [30,20,30,20], [28,22,28,22], [10,40,10,40], [9,41,9,41],
  [10,40,10,40], [10,40,10,40], [10,40,10,40], [8,42,8,42],
].map(([keyPresentCount,keyAbsentCount,present,absent]) => ({
  keyPresentCount, keyAbsentCount,
  stateCounts: { PRESENT: present, ABSENT: absent, NULL: 0, ZERO: 0, EMPTY_STRING: 0, EMPTY_ARRAY: 0, EMPTY_OBJECT: 0 },
}));
// Computed from the independently inspected, pinned Source projection. It is
// deliberately not derived from mutable Evidence or Canonical at validation time.
const SOURCE_PROJECTION_SHA256 = 'a5260c5654d97157429c3771fbbbf2268096012b261c0b3ed384a26d5a138e8b';
const check = (condition, code, message) => { if (!condition) throw new Error(`Casting Law LevelUp Property raw-detail validation failed [${code}]: ${message}`); };
const exactKeys = (value, keys, label) => check(value && typeof value === 'object' && !Array.isArray(value) && isDeepStrictEqual(Object.keys(value).sort(), [...keys].sort()), 'SCHEMA', `${label} keys drift`);
const read = async (root, path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const sourceType = value => value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
const sourceState = value => value === null ? 'NULL' : value === 0 ? 'ZERO' : value === '' ? 'EMPTY_STRING' : Array.isArray(value) && value.length === 0 ? 'EMPTY_ARRAY' : value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0 ? 'EMPTY_OBJECT' : 'PRESENT';

export function validateCastingLawLevelUpPropertyRawDetailsData({ evidence, canonical, references, templates, rawDetails, rawEvidence, previous, materials }) {
  check(evidence.schemaVersion === 1 && evidence.claimType === 'casting-law-levelup-property-raw-details' && evidence.owner === 'shared-casting-law-levelup-property-raw-detail', 'EVIDENCE', 'Owner/schema identity drift');
  check(isDeepStrictEqual(evidence.sourceSnapshot, SNAPSHOT) && isDeepStrictEqual(evidence.source, SOURCE), 'SOURCE_PIN', 'fixed Source commit/tree/blob/hash/length/population drift');
  check(references?.records?.length === 50 && isDeepStrictEqual(references.records.map(x => x.levelUpInfoId), IDS) && isDeepStrictEqual(references.records.map(x => x.levelUpSourceArrayIndex), INDEXES), 'SELECTION', 'existing selected LevelUp IDs/order/indexes drift');
  check(references.records.every(x => [14,12,37,40,41].includes(x.templateId)), 'TEMPLATE_SELECTION', 'selected Template set drift');
  check(templates?.records?.length === 5, 'TEMPLATE_REGRESSION', 'existing Template Raw Detail population drift');
  check(rawDetails?.records?.length === 50 && isDeepStrictEqual(rawDetails.sourceOrder, IDS), 'RAW_REGRESSION', 'existing LevelUp Raw Detail population/order drift');
  check(previous?.records?.length === 45, 'PREVIOUS_REGRESSION', 'existing Previous-Level references drift');
  check(materials?.records?.length === 115 && materials?.itemEndpoints?.length === 18, 'MATERIAL_REGRESSION', 'existing material or ItemInfo populations drift');
  check(rawEvidence?.records?.length === 50, 'RAW_EVIDENCE_REGRESSION', 'existing source field inventory population drift');

  check(evidence.selectionEvidence?.referenceCanonical === REF && isDeepStrictEqual(evidence.selectionEvidence.templateIdsInSourceOrder, [14,12,37,40,41]), 'SELECTION_EVIDENCE', 'selection source or template ordering drift');
  check(isDeepStrictEqual(evidence.selectionEvidence.levelUpIdsInReferenceOrder, IDS) && isDeepStrictEqual(evidence.selectionEvidence.sourceIndexesInReferenceOrder, INDEXES), 'SELECTION_IDS', 'selected IDs or Source indexes differ from existing reference');
  check(isDeepStrictEqual(evidence.selectionEvidence.referenceRows, references.records), 'REFERENCE_PROVENANCE', 'preserved Template→LevelUp reference rows differ');
  check(isDeepStrictEqual(evidence.admission?.admittedSourceFields, FIELDS) && evidence.admission?.sourceIdentityField === 'ID' && evidence.admission?.sourceIdentityNamespace === 'ConfigDataCastingLawLevelUpInfo.ID', 'ADMITTED_FIELDS', 'admission field set or identity namespace drift');
  check(isDeepStrictEqual(evidence.admission?.existingAdmittedSourceFields, ['ID','Name','LevelUpGoldCost']) && isDeepStrictEqual(evidence.admission?.nonAdmittedSourceFields, ['LevelupMaterialsCost','PreCastingLawLevelID']), 'FIELD_BOUNDARY', 'existing or non-admitted field boundary drift');
  check(evidence.admission?.propertyIdNamespaceOrMeaning === 'NOT_ADMITTED' && evidence.admission?.runtimeOrPublicationMeaning === 'NOT_ADMITTED', 'SEMANTIC_BOUNDARY', 'unapproved Property meaning or publication claim');

  const records = evidence.sourceFieldInventory?.records;
  check(Array.isArray(records) && records.length === 50 && isDeepStrictEqual(records.map(x => x.levelUpInfoId), IDS) && isDeepStrictEqual(records.map(x => x.sourceArrayIndex), INDEXES), 'SOURCE_RECORDS', 'expected exactly the 50 ordered Source records');
  check(isDeepStrictEqual(evidence.sourceFieldInventory?.fieldNames, FIELDS), 'FIELD_NAMES', '12-field ordered Source inventory drift');
  for (const [i, record] of records.entries()) {
    exactKeys(record, ['levelUpInfoId','sourceArrayIndex','recordLocator','propertyObservations'], 'Evidence Source record');
    check(record.levelUpInfoId === IDS[i] && record.sourceArrayIndex === INDEXES[i] && record.recordLocator === `ConfigDataCastingLawLevelUpInfo#ID=${IDS[i]}`, 'RECORD_LOCATOR', `record locator drift at ${i}`);
    check(Array.isArray(record.propertyObservations) && record.propertyObservations.length === 12 && isDeepStrictEqual(record.propertyObservations.map(x => x.field), FIELDS), 'PROPERTY_FIELDS', `Property field set/order drift for ${record.levelUpInfoId}`);
    for (const observation of record.propertyObservations) {
      const present = observation.keyPresent === true;
      exactKeys(observation, present ? ['field','keyPresent','state','sourceType','fieldLocator','rawValue'] : ['field','keyPresent','state','sourceType','fieldLocator'], 'Evidence Property observation');
      check(FIELDS.includes(observation.field) && typeof observation.keyPresent === 'boolean', 'KEY_PRESENCE', 'invalid Property key presence');
      check(observation.fieldLocator === `ConfigDataCastingLawLevelUpInfo#ID=${record.levelUpInfoId}/${observation.field}`, 'FIELD_LOCATOR', 'Source field locator drift');
      if (!present) {
        check(observation.state === 'ABSENT' && observation.sourceType === 'absent' && !Object.hasOwn(observation, 'rawValue'), 'ABSENT', 'ABSENT key must have no value and no fabricated type');
      } else {
        check(STATES.includes(observation.state) && observation.state !== 'ABSENT' && observation.state === sourceState(observation.rawValue) && observation.sourceType === sourceType(observation.rawValue), 'PRESENT_STATE', 'present raw value, state, and type disagree');
      }
    }
  }
  const projection = records.map(r => ({ levelUpInfoId:r.levelUpInfoId, sourceArrayIndex:r.sourceArrayIndex, recordLocator:r.recordLocator, propertyObservations:r.propertyObservations }));
  check(digest(projection) === SOURCE_PROJECTION_SHA256, 'SOURCE_PROJECTION', 'independently pinned Source Property projection mismatch');

  check(Array.isArray(evidence.sourceFieldInventory.fieldSummary) && evidence.sourceFieldInventory.fieldSummary.length === FIELDS.length, 'FIELD_SUMMARY', 'field summary population mismatch');
  const summaryProjection = evidence.sourceFieldInventory.fieldSummary.map((row, i) => {
    exactKeys(row, ['field','keyPresentCount','keyAbsentCount','stateCounts'], 'Evidence Field summary');
    check(row.field === FIELDS[i] && isDeepStrictEqual(Object.keys(row.stateCounts).sort(), [...STATES].sort()), 'FIELD_SUMMARY_SCHEMA', `summary field/state set mismatch at ${i}`);
    const sourceObservations = records.flatMap(x => x.propertyObservations).filter(x => x.field === row.field);
    const actualStateCounts = Object.fromEntries(STATES.map(state => [state, sourceObservations.filter(x => x.state === state).length]));
    const presentCount = sourceObservations.filter(x => x.keyPresent).length;
    const absentCount = sourceObservations.filter(x => !x.keyPresent).length;
    check(row.keyPresentCount === presentCount && row.keyAbsentCount === absentCount && isDeepStrictEqual(row.stateCounts, actualStateCounts), 'FIELD_SUMMARY_PARITY', `${row.field} key presence and Field State counts disagree with observations`);
    check(row.keyPresentCount + row.keyAbsentCount === 50 && row.stateCounts.PRESENT + row.stateCounts.ZERO + row.stateCounts.NULL + row.stateCounts.EMPTY_STRING + row.stateCounts.EMPTY_ARRAY + row.stateCounts.EMPTY_OBJECT === row.keyPresentCount && row.stateCounts.ABSENT === row.keyAbsentCount, 'FIELD_SUMMARY_TOTAL', `${row.field} summary does not partition 50 records`);
    return { keyPresentCount: row.keyPresentCount, keyAbsentCount: row.keyAbsentCount, stateCounts: row.stateCounts };
  });
  check(isDeepStrictEqual(summaryProjection, EXPECTED_SUMMARY), 'EXPECTED_STATE_DISTRIBUTION', 'Source-pinned Key Presence or state distribution drift');

  const expectedPairSummary = [
    { propertyNumber:1,bothKeyPresent:50,idOnly:0,valueOnly:0,bothAbsent:0 },
    { propertyNumber:2,bothKeyPresent:48,idOnly:2,valueOnly:0,bothAbsent:0 },
    { propertyNumber:3,bothKeyPresent:28,idOnly:2,valueOnly:0,bothAbsent:20 },
    { propertyNumber:4,bothKeyPresent:9,idOnly:1,valueOnly:0,bothAbsent:40 },
    { propertyNumber:5,bothKeyPresent:10,idOnly:0,valueOnly:0,bothAbsent:40 },
    { propertyNumber:6,bothKeyPresent:8,idOnly:2,valueOnly:0,bothAbsent:40 },
  ];
  check(isDeepStrictEqual(evidence.sourceFieldInventory.pairSummary, expectedPairSummary), 'PAIR_SUMMARY', 'independent Property ID/Value key combinations drift');

  check(evidence.priorInventoryCrossCheck?.evidencePath === RAW_EVIDENCE && evidence.priorInventoryCrossCheck?.allSelectedRecordStatesMatch === true && isDeepStrictEqual(evidence.priorInventoryCrossCheck.fieldNames, FIELDS), 'PRIOR_INVENTORY', 'prior Raw Detail inventory cross-check metadata drift');
  for (const record of records) {
    const prior = rawEvidence.records.find(x => x.levelUpInfoId === record.levelUpInfoId);
    check(prior && prior.sourceArrayIndex === record.sourceArrayIndex, 'PRIOR_INVENTORY_ID', `no matching prior inventory for ${record.levelUpInfoId}`);
    for (const observation of record.propertyObservations) {
      const field = prior.fieldInventory.find(x => x.field === observation.field);
      check(field && field.state === observation.state && field.type === observation.sourceType, 'PRIOR_INVENTORY_STATE', `prior Source field inventory mismatch ${record.levelUpInfoId}.${observation.field}`);
    }
  }

  check(evidence.transformation?.method === 'For each selected LevelUp ID, locate exactly one ConfigDataCastingLawLevelUpInfo record by numeric ID equality; preserve each of the 12 Property keys independently. Missing keys have state ABSENT and no rawValue property. Present values retain original JSON type and value. No pairing, fill, conversion, or semantic join is applied.', 'TRANSFORMATION', 'Source-to-Canonical transformation drift');
  check(evidence.limitation === 'Source-native Property1_ID through Property6_ID and Property1_Value through Property6_Value observations only. No Property definition, stat name, unit, scale, combat effect, formula, runtime application, progression, cost/material consumption, localization, asset, or publication meaning is admitted.', 'LIMITATION', 'semantic limitation drift');

  exactKeys(canonical, ['schemaVersion','scope','sourceOrder','records'], 'Canonical');
  check(canonical.schemaVersion === 1 && canonical.scope === 'Selected shared Casting Law LevelUp Property1-6 source-native raw fields only; independent key presence, source state, original value/type, and source locator. No Property meaning, external relation, runtime effect, or publication.', 'CANONICAL_SCOPE', 'Canonical scope drift');
  check(isDeepStrictEqual(canonical.sourceOrder, IDS) && canonical.records.length === 50, 'CANONICAL_POPULATION', 'Canonical must preserve exact 50-record source selection order');
  const expectedCanonical = records.map(record => ({
    levelUpInfoId: record.levelUpInfoId,
    sourceArrayIndex: record.sourceArrayIndex,
    recordLocator: record.recordLocator,
    properties: record.propertyObservations.map(observation => ({
      field: observation.field,
      keyPresent: observation.keyPresent,
      state: observation.state,
      sourceType: observation.sourceType,
      ...(observation.keyPresent ? { rawValue: observation.rawValue } : {}),
      fieldLocator: observation.fieldLocator,
      evidenceProvenance: `${E}#sourceFieldInventory/records/levelUpInfoId=${record.levelUpInfoId}/field=${observation.field}`,
    })),
  }));
  check(isDeepStrictEqual(canonical.records, expectedCanonical), 'CANONICAL_PARITY', 'Canonical differs from independently pinned Source Property projection');
  check(canonical.records.every(record => record.properties.every(property => !Object.hasOwn(property, 'meaning') && !Object.hasOwn(property, 'statName') && !Object.hasOwn(property, 'unit') && !Object.hasOwn(property, 'formula') && !Object.hasOwn(property, 'published'))), 'SEMANTIC_BOUNDARY', 'unapproved Property meaning or publication field present');

  return { selectedRecords:50, propertyFields:12, fieldSummary:evidence.sourceFieldInventory.fieldSummary, propertyPairs:evidence.sourceFieldInventory.pairSummary, templateRawDetails:5, templateReferences:50, levelUpRawDetails:50, previousLevelReferences:45, materialRows:115, itemEndpoints:18 };
}

export async function validateCastingLawLevelUpPropertyRawDetails(root = process.cwd()) {
  const [evidence, canonical, references, templates, rawDetails, rawEvidence, previous, materials] = await Promise.all([
    read(root,E), read(root,C), read(root,REF), read(root,TEMPLATE), read(root,RAW), read(root,RAW_EVIDENCE), read(root,PREVIOUS), read(root,MATERIALS),
  ]);
  const result = validateCastingLawLevelUpPropertyRawDetailsData({ evidence, canonical, references, templates, rawDetails, rawEvidence, previous, materials });
  process.stdout.write(`Casting Law LevelUp Property raw details: PASS (selected=${result.selectedRecords}; property fields=${result.propertyFields}; ID-only property pairs=7; existing claims preserved; no Property meaning/runtime/publication admitted)\n`);
  return result;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve('tools/validate-casting-law-levelup-property-raw-details.mjs')) await validateCastingLawLevelUpPropertyRawDetails();
