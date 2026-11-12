import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

const E = 'evidence/source/jobs/casting-law-levelup-raw-details.v1.json';
const C = 'canonical/casting-law-levelup-raw-details.v1.json';
const REL = 'canonical/casting-law-template-level-references.v1.json';
const MAT = 'canonical/casting-law-levelup-material-references.v1.json';
const SOURCE_SNAPSHOT = { repository: 'LuceatLuxVestra42/langrisser-future-guide', commit: '6475e63ee23d18adf733756c26a14fa9e3ed662c', tree: '08e1e6c2773730e60b258940e31494f68d65f86a', configDataSubtree: 'b18983f60cb054c2e6e094d64cdb98979211d7fc' };
const SOURCE = { path: 'data/configdata/ConfigDataCastingLawLevelUpInfo.json', blobSha1: '83b99ebff9c54523d7f9476b92e8b3d59229179f', sha256: '07b91384b3dab506d501d74b4e70b6535b84f5d620e0082c3e557afec146e849', byteLength: 232171, recordCount: 500 };
const IDS = [66,67,68,69,70,10066,10067,10068,10069,10070,56,57,58,59,60,10056,10057,10058,10059,10060,181,182,183,184,185,10181,10182,10183,10184,10185,196,197,198,199,200,10196,10197,10198,10199,10200,201,202,203,204,205,10201,10202,10203,10204,10205];
const INDEXES = [65,66,67,68,69,315,316,317,318,319,55,56,57,58,59,305,306,307,308,309,180,181,182,183,184,430,431,432,433,434,195,196,197,198,199,445,446,447,448,449,200,201,202,203,204,450,451,452,453,454];
const FIELD_NAMES = ['ID','LevelUpGoldCost','LevelupMaterialsCost','Name','PreCastingLawLevelID','Property1_ID','Property1_Value','Property2_ID','Property2_Value','Property3_ID','Property3_Value','Property4_ID','Property4_Value','Property5_ID','Property5_Value','Property6_ID','Property6_Value'];
const PROJECTION_SHA256 = '4a1dad08b5220552eaf19f08cd17911b75e7fb6ebdd33963942dc9170fde0cbb';
const INVENTORY_SHA256 = 'e68c88561667afef5162cca895d0647aafe2adb55fdae8d8a66ba5a389c2e5e8';
const check = (x, code, message) => { if (!x) throw new Error(`Casting Law LevelUp raw-detail validation failed [${code}]: ${message}`); };
const exactKeys = (x, keys, label) => check(x && typeof x === 'object' && !Array.isArray(x) && isDeepStrictEqual(Object.keys(x).sort(), [...keys].sort()), 'SCHEMA', `${label} keys drift`);
const read = async (root, path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const digest = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function validateCastingLawLevelUpRawDetailsData({ evidence, canonical, references, materials }) {
  check(evidence.schemaVersion === 1 && evidence.claimType === 'casting-law-levelup-raw-details' && evidence.owner === 'shared-casting-law-levelup-raw-detail', 'EVIDENCE', 'owner/schema identity drift');
  check(isDeepStrictEqual(evidence.sourceSnapshot, SOURCE_SNAPSHOT) && isDeepStrictEqual(evidence.source, SOURCE), 'SOURCE_PIN', 'source commit/tree/blob/hash/length/population drift');
  check(isDeepStrictEqual(evidence.admittedFields, ['ID','Name','LevelUpGoldCost']), 'ADMISSION_FIELDS', 'admitted source field set drift');
  check(evidence.selectionEvidence?.referenceCanonical === REL && isDeepStrictEqual(evidence.selectionEvidence?.templateIdsInSourceOrder, [14,12,37,40,41]), 'SELECTION', 'reference selection contract drift');
  check(references?.records?.length === 50 && materials?.records?.length === 115 && materials?.itemEndpoints?.length === 18, 'EXISTING_CLAIMS', 'existing LevelUp relation/material/ItemInfo scope drift');
  check(isDeepStrictEqual(references.records.map(r => r.levelUpInfoId), IDS) && isDeepStrictEqual(references.records.map(r => r.levelUpSourceArrayIndex), INDEXES), 'REFERENCE_ORDER', 'selected IDs/indexes differ from existing ordered Template references');
  check(evidence.selectionEvidence.levelUpIdsInReferenceOrder.length === 50 && isDeepStrictEqual(evidence.selectionEvidence.levelUpIdsInReferenceOrder, IDS), 'SELECTION_IDS', 'evidence selection differs from existing reference order');
  const referenceRows = references.records.map(r => ({ templateId: r.templateId, sourceField: r.sourceField, sourceArrayIndex: r.sourceArrayIndex, levelUpInfoId: r.levelUpInfoId, levelUpEndpointNamespace: r.levelUpEndpointNamespace, levelUpSourceArrayIndex: r.levelUpSourceArrayIndex, levelUpRecordLocator: r.levelUpRecordLocator }));
  check(isDeepStrictEqual(evidence.selectionEvidence.referenceRows, referenceRows), 'REFERENCE_PROVENANCE', 'reference rows no longer match prior canonical');
  check(Array.isArray(evidence.records) && evidence.records.length === 50, 'POPULATION', 'expected exactly 50 selected source records');
  check(isDeepStrictEqual(evidence.records.map(r => r.levelUpInfoId), IDS) && isDeepStrictEqual(evidence.records.map(r => r.sourceArrayIndex), INDEXES), 'SOURCE_LOCATOR', 'record ID/index order drift');
  check(evidence.records.every(r => r.recordLocator === `ConfigDataCastingLawLevelUpInfo#ID=${r.levelUpInfoId}`), 'RECORD_LOCATOR', 'source locator drift');
  check(evidence.records.every(r => r.rawFields?.ID === r.levelUpInfoId && Number.isSafeInteger(r.rawFields.ID) && typeof r.rawFields.Name === 'string' && typeof r.rawFields.LevelUpGoldCost === 'number' && Number.isFinite(r.rawFields.LevelUpGoldCost)), 'RAW_TYPES', 'admitted field value/type mismatch');
  check(evidence.records.every(r => isDeepStrictEqual(Object.keys(r.rawFields).sort(), ['ID','LevelUpGoldCost','Name'].sort())), 'RAW_FIELD_SET', 'non-admitted field present in admitted projection');
  check(evidence.records.every(r => Array.isArray(r.fieldInventory) && isDeepStrictEqual(r.fieldInventory.map(f => f.field), FIELD_NAMES)), 'FIELD_INVENTORY', 'source field inventory drift');
  check(evidence.records.every(r => r.fieldInventory.every(f => f.admitted === ['ID','Name','LevelUpGoldCost'].includes(f.field) && ['PRESENT','ABSENT','NULL','EMPTY_STRING','EMPTY_ARRAY','EMPTY_OBJECT','ZERO'].includes(f.state))), 'FIELD_STATES', 'field state or admission marker invalid');
  check(digest(evidence.records.map(r => ({ ID:r.rawFields.ID, Name:r.rawFields.Name, LevelUpGoldCost:r.rawFields.LevelUpGoldCost }))) === PROJECTION_SHA256, 'SOURCE_PROJECTION', 'independently pinned ID/Name/GoldCost projection mismatch');
  check(digest(evidence.records.map(r => ({ ID:r.levelUpInfoId, fields:r.fieldInventory }))) === INVENTORY_SHA256, 'FIELD_INVENTORY_PIN', 'independently pinned source field inventory mismatch');
  exactKeys(canonical, ['schemaVersion','scope','sourceOrder','records'], 'Canonical');
  check(canonical.schemaVersion === 1 && canonical.scope === 'Selected shared Casting Law LevelUp raw fields keyed only by ConfigDataCastingLawLevelUpInfo.ID: ID, Name, LevelUpGoldCost. Source-native values only; no runtime cost/consumption semantics or publication.', 'CANONICAL_SCOPE', 'scope drift');
  check(isDeepStrictEqual(canonical.sourceOrder, IDS) && canonical.records.length === 50, 'CANONICAL_ORDER', 'canonical source order/population drift');
  const expected = evidence.records.map(r => ({ levelUpInfoId:r.levelUpInfoId, rawFields:r.rawFields, provenance:`${E}#records/ID=${r.levelUpInfoId}` }));
  check(isDeepStrictEqual(canonical.records, expected), 'CANONICAL_PARITY', 'canonical records differ from directly evidenced source projection');
  check(canonical.records.every(r => !Object.hasOwn(r,'heroId') && !Object.hasOwn(r,'templateId') && !Object.hasOwn(r,'materials') && !Object.hasOwn(r,'runtimeCost') && !Object.hasOwn(r,'publication')), 'BOUNDARY', 'context, material, runtime, or publication semantics mixed into raw identity');
  check(evidence.interpretation?.limitation === 'No gold deduction, resource consumption, application timing, success condition, UI cost display policy, material change, previous-Level relation, Property semantics, localization, publication, or runtime rule is admitted.', 'LIMITATION', 'semantic limitation drift');
  return { levelUpRecords:50, templateReferences:50, materialRows:115, itemEndpoints:18 };
}

export async function validateCastingLawLevelUpRawDetails(root = process.cwd()) {
  const [evidence, canonical, references, materials] = await Promise.all([read(root,E),read(root,C),read(root,REL),read(root,MAT)]);
  const result = validateCastingLawLevelUpRawDetailsData({ evidence, canonical, references, materials });
  process.stdout.write(`Casting Law LevelUp raw details: PASS (records=${result.levelUpRecords}; reference rows=${result.templateReferences}; existing material rows=${result.materialRows}; ItemInfo endpoints=${result.itemEndpoints}; raw values only)\n`);
  return result;
}
if (process.argv[1] && resolve(process.argv[1]) === resolve('tools/validate-casting-law-levelup-raw-details.mjs')) await validateCastingLawLevelUpRawDetails();
