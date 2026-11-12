import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

const EVIDENCE_PATH = 'evidence/source/awakening/awakening-level-raw-details.v1.json';
const CANONICAL_PATH = 'canonical/awakening-level-raw-details.v1.json';
const REFERENCE_EVIDENCE_PATH = 'evidence/source/awakening/hero15-awakening-references.v1.json';
const REFERENCE_CANONICAL_PATH = 'canonical/hero-awakening-references.v1.json';
const SOURCE = {
  repository: 'LuceatLuxVestra42/langrisser-future-guide',
  commit: '6475e63ee23d18adf733756c26a14fa9e3ed662c',
  tree: '08e1e6c2773730e60b258940e31494f68d65f86a',
  configDataSubtree: 'b18983f60cb054c2e6e094d64cdb98979211d7fc',
  path: 'data/configdata/ConfigDataAwakenLevelInfo.json',
  gitBlobSha1: 'cce2eea928ecfc9e09b03e9f694411af4db69da4',
  sha256: '370ea380cb6f78495e7ad327afd8794d5fa44616865c578627175c30aac7be16',
  byteLength: 137268,
  recordCount: 566,
  encoding: 'UTF-8 JSON parsed from the exact pinned Git blob.',
};
const FIELDS = ['ID', 'Name', 'Battle_ID', 'MonsterLevel', 'Desc', 'Image'];
const EXPECTED = [
  { sourceArrayIndex: 13, recordLocator: 'ConfigDataAwakenLevelInfo#ID=1015', rawRecord: { ID: 1015, Name: '光明之火', Battle_ID: 42013, MonsterLevel: 70, Desc: '艾尔文，你难道没有什么要和我解释吗？', Image: 'UI/BattleThumbnail_ABS/Castle007.png' } },
  { sourceArrayIndex: 296, recordLocator: 'ConfigDataAwakenLevelInfo#ID=2015', rawRecord: { ID: 2015, Name: '辉光的信标', Battle_ID: 42616, MonsterLevel: 70, Desc: '无论他作何抉择，我都已坚定自己的信仰，愿化身道标，照亮光辉的前路！', Image: 'UI/BattleThumbnail_ABS/Arena003.png' } },
];
const EXPECTED_STATES = Object.fromEntries(FIELDS.map((field) => [field, 'PRESENT']));
const check = (value, code, message) => { if (!value) throw new Error(`Awakening Level raw-detail validation failed [${code}]: ${message}`); };
const exactKeys = (value, keys, label) => check(value && typeof value === 'object' && !Array.isArray(value)
  && isDeepStrictEqual(Object.keys(value).sort(), [...keys].sort()), 'SCHEMA', `${label} fields drift`);
const readJson = async (root, path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));

export function validateAwakeningLevelRawDetailsData({ evidence, canonical, referenceEvidence, referenceCanonical }) {
  exactKeys(evidence, ['schemaVersion', 'claimType', 'owner', 'scope', 'source', 'selection', 'inspectedFields', 'admittedFields', 'nonAdmittedFields', 'records', 'interpretation'], 'Evidence');
  check(evidence.schemaVersion === 1 && evidence.claimType === 'awakening-level-raw-details'
    && evidence.owner === 'shared-awakening-level-raw-detail', 'EVIDENCE', 'owner or schema identity drift');
  check(isDeepStrictEqual(evidence.source, SOURCE), 'SOURCE_PIN', 'source version, blob, digest, length, count, or encoding drift');
  check(evidence.scope?.namespace === 'ConfigDataAwakenLevelInfo.ID'
    && isDeepStrictEqual(evidence.scope?.ids, [1015, 2015]), 'SCOPE', 'selected shared Level identity scope drift');
  check(evidence.selection?.referenceEvidence === REFERENCE_EVIDENCE_PATH
    && evidence.selection?.referenceCanonical === REFERENCE_CANONICAL_PATH
    && evidence.selection?.stage1LevelId === 1015 && evidence.selection?.stage2LevelId === 2015, 'SELECTION', 'selection must reuse the existing Hero 15 Stage references');
  check(isDeepStrictEqual(evidence.inspectedFields, FIELDS)
    && isDeepStrictEqual(evidence.admittedFields, FIELDS)
    && isDeepStrictEqual(evidence.nonAdmittedFields, []), 'FIELD_SCOPE', 'inspected, admitted, and non-admitted fields differ from the observed source inventory');
  check(evidence.interpretation?.evidenceClass === 'A_DIRECT_SOURCE_RECORD'
    && evidence.interpretation?.fieldInventoryBoundary === 'The source records contain exactly the six inspected fields listed above. No additional, absent, null, empty, or zero-valued field was observed in either selected record. The admitted field set equals the observed source field set for these two records only.', 'FIELD_INVENTORY', 'observed source inventory or admission boundary drift');
  check(evidence.interpretation?.transformation === 'Parse the exact pinned UTF-8 JSON bytes and select records by exact integer ID equality. Preserve the selected six fields and source array indices without normalization.', 'TRANSFORMATION', 'extraction transformation drift');
  check(Array.isArray(evidence.records) && evidence.records.length === 2, 'POPULATION', 'expected exactly two selected source records');

  check(referenceEvidence?.sourceSnapshot?.commit === SOURCE.commit
    && referenceEvidence?.sourceRecords?.awakenInfo?.fields?.ID === 15
    && referenceEvidence?.sourceRecords?.awakenLevelEndpoints?.records?.[0]?.fields?.ID === 1015
    && referenceEvidence?.sourceRecords?.awakenLevelEndpoints?.records?.[1]?.fields?.ID === 2015
    && referenceCanonical?.records?.[0]?.stage1LevelReference?.levelId === 1015
    && referenceCanonical?.records?.[0]?.stage2LevelReference?.levelId === 2015, 'REFERENCE', 'existing Hero 15 Stage references or endpoint evidence differ');

  const expectedEvidence = EXPECTED.map((record) => ({
    ...record,
    fieldStates: structuredClone(EXPECTED_STATES),
  }));
  check(isDeepStrictEqual(evidence.records, expectedEvidence), 'SOURCE_PARITY', 'source record identity, index, locator, field inventory, state, type, or exact value mismatch');
  for (const record of evidence.records) {
    exactKeys(record.rawRecord, FIELDS, `Source record ${record.rawRecord?.ID}`);
    check(isDeepStrictEqual(record.fieldStates, EXPECTED_STATES), 'FIELD_STATES', `record ${record.rawRecord.ID} field state mismatch`);
    check(Number.isInteger(record.rawRecord.ID) && Number.isInteger(record.rawRecord.Battle_ID)
      && Number.isInteger(record.rawRecord.MonsterLevel)
      && ['Name', 'Desc', 'Image'].every((field) => typeof record.rawRecord[field] === 'string'), 'FIELD_TYPES', `record ${record.rawRecord.ID} field types mismatch`);
  }

  exactKeys(canonical, ['schemaVersion', 'scope', 'sourceScope', 'records'], 'Canonical');
  check(canonical.schemaVersion === 1
    && canonical.scope === 'Selected ConfigDataAwakenLevelInfo raw fields keyed only by source ID. This is an optional two-record projection, not complete source-record admission, Hero ownership, runtime semantics, or publication.'
    && canonical.sourceScope === 'CN ConfigData snapshot 2026-09-02', 'CANONICAL_SCOPE', 'canonical scope drift');
  const expectedCanonical = expectedEvidence.map((record) => ({
    levelId: record.rawRecord.ID,
    rawFields: record.rawRecord,
    fieldStates: record.fieldStates,
    provenance: `${EVIDENCE_PATH}#records/ID=${record.rawRecord.ID}`,
  }));
  check(isDeepStrictEqual(canonical.records, expectedCanonical), 'CANONICAL_PARITY', 'canonical selected fields, type, order, field states, or provenance differ from independent fixed expectations');
  check(canonical.records.every((record) => !Object.hasOwn(record, 'heroId')
    && !Object.hasOwn(record, 'runtimeRules') && !Object.hasOwn(record, 'publication')
    && !Object.hasOwn(record.rawFields, 'Battle') && !Object.hasOwn(record.rawFields, 'Unlock')), 'BOUNDARY', 'Hero ownership, runtime, Battle relation, or publication semantics added');
  return { levelIds: [1015, 2015], recordCount: 2, admittedFields: FIELDS };
}

export async function validateAwakeningLevelRawDetails(root = process.cwd()) {
  const [evidence, canonical, referenceEvidence, referenceCanonical] = await Promise.all([
    readJson(root, EVIDENCE_PATH), readJson(root, CANONICAL_PATH),
    readJson(root, REFERENCE_EVIDENCE_PATH), readJson(root, REFERENCE_CANONICAL_PATH),
  ]);
  const result = validateAwakeningLevelRawDetailsData({ evidence, canonical, referenceEvidence, referenceCanonical });
  process.stdout.write('Awakening Level raw details: PASS (IDs=1015,2015; exact six-field optional projection; no runtime or publication semantics)\n');
  return result;
}
if (process.argv[1] && resolve(process.argv[1]) === resolve('tools/validate-awakening-level-raw-details.mjs')) await validateAwakeningLevelRawDetails();
