import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const CANONICAL_PATH = 'canonical/exclusive-equipment.v1.json';
const EVIDENCE_PATH = 'evidence/exclusive-equipment-identity.v1.json';
const EXPECTED_EVIDENCE_GIT_BLOB_SHA1 = '39f4e945d199cf964360bcad43c16f6573a0a3ec';
const REPOSITORY = 'LuceatLuxVestra42/langrisser-future-guide';
const SOURCE_COMMIT = '6475e63ee23d18adf733756c26a14fa9e3ed662c';
const SOURCE_PATH = 'data/configdata/ConfigDataEquipmentInfo.json';
const SOURCE_BLOB = '353c4f00b44a2ba0f8eb32dd03a76c3224635d04';
const SELECTION = 'GetPathList.length == 1 && GetPathList[0].PathType == 46';
const CLASSIFICATION = 'exclusive-equipment';
const CLASSIFICATION_BASIS = 'PathType46-only-and-exclusive-sheet-sentinel-match';
const CLAIM_B_PATH = 'data/generated/equipment_stage2_7_acquisition.json';
const CLAIM_B_BLOB = '9933a2406fa026e1b340e31a080587a0828db8bc';
const CONTRACT_PATH = 'data/contracts/equipment-stage2-7-acquisition-reference.v1.json';
const CONTRACT_BLOB = '7f02a862a72cd57819827c24c60f740f36c45573';
const LIMITATIONS = [
  'The source-native enum documentation for PathType 46 was not confirmed.',
  'Claim B is a ConfigData-derived predecessor classification output and is traceable, but not fully independent of Claim A.',
  'Project source parity remains a supporting cross-check, not population authority.'
];
const EXPECTED_SOURCE = {
  repository: REPOSITORY,
  commit: SOURCE_COMMIT,
  path: SOURCE_PATH,
  gitBlobSha1: SOURCE_BLOB,
  recordCount: 548,
  identityField: 'ID',
  locatorPattern: 'data/configdata/ConfigDataEquipmentInfo.json#ID={EquipmentID}',
  selectionPredicate: SELECTION
};
const EXPECTED_DECISION = {
  repository: REPOSITORY,
  commit: SOURCE_COMMIT,
  path: CONTRACT_PATH,
  gitBlobSha1: CONTRACT_BLOB,
  classification: CLASSIFICATION,
  confidencePercent: 99,
  basis: 'The PathType 46-only population aligns with the separate exclusive-equipment population; sentinel rows beginning with IDs 273-277 match the opening rows of the legacy 전용장비 sheet.',
  sentinelReference: 'https://docs.google.com/spreadsheets/d/1RZFY2N3RU-vctduO_Tg2e4RVoZvJAAveiMgPnW6VTQg/edit'
};
const EXPECTED_CLAIM_A_PROVENANCE = {
  repository: REPOSITORY,
  commit: SOURCE_COMMIT,
  path: SOURCE_PATH,
  gitBlobSha1: SOURCE_BLOB,
  sourceRecordCount: 548,
  identityField: 'ID',
  selectionPredicate: SELECTION,
  recordLocatorPattern: 'data/configdata/ConfigDataEquipmentInfo.json#ID={EquipmentID}',
  preservedProjection: 'ID and GetPathList only'
};
const EXPECTED_CLAIM_B_PROVENANCE = {
  repository: REPOSITORY,
  commit: SOURCE_COMMIT,
  path: CLAIM_B_PATH,
  gitBlobSha1: CLAIM_B_BLOB,
  identityField: 'equipmentId',
  recordLocatorPattern: 'data/generated/equipment_stage2_7_acquisition.json#records[?equipmentId={EquipmentID}]',
  sourceRecordCount: 390,
  classification: CLASSIFICATION,
  classificationBasis: CLASSIFICATION_BASIS,
  generator: {
    path: 'scripts/finalize-equipment-stage2-7-acquisition.mjs',
    gitBlobSha1: '5955c658620d44c55914643260b9e4a564911936'
  },
  validation: {
    workflowPath: '.github/workflows/equipment-stage2-7-acquisition.yml',
    workflowBlobSha1: 'ae328c8e8d2fdcffe1916c7103aecf09f862e3cd',
    validatorPath: 'scripts/validate-equipment-stage2-7-acquisition.mjs',
    validatorBlobSha1: '877eff3ed87ab2c7d3471ad177b28538b2cac432',
    runId: 32905645828,
    runUrl: 'https://github.com/LuceatLuxVestra42/langrisser-future-guide/actions/runs/32905645828',
    runHeadCommit: 'cb7cdd4143fbd141da8a18e41d7b9572dcb9616d',
    runConclusion: 'success',
    validationStep: 'Validate Stage 2-7 final data',
    validationStepConclusion: 'success',
    generatedArtifactCommit: '42c2b5323f648488a59c0daf27ad0b4e9377f717'
  },
  observedClassifiedRecordCount: 167
};
const fail = (code, message) => {
  throw new Error('Exclusive Equipment identity validation failed [' + code + ']: ' + message);
};
const check = (condition, code, message) => {
  if (!condition) fail(code, message);
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const exactKeys = (obj, keys) =>
  obj !== null && typeof obj === 'object' && !Array.isArray(obj) &&
  same(Object.keys(obj).sort(), [...keys].sort());
const sorted = values => [...values].sort((a, b) => a - b);
const sameSet = (a, b) => same(sorted(a), sorted(b));
const gitBlobSha1 = text => {
  const bytes = Buffer.from(text, 'utf8');
  return createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex');
};
const collectUniqueIds = (rows, field, code) => {
  check(Array.isArray(rows), code, 'record projection must be an array');
  const ids = [];
  const seen = new Set();
  for (const row of rows) {
    const id = row?.[field];
    check(Number.isSafeInteger(id) && id > 0, code, 'invalid ' + field);
    check(!seen.has(id), code, 'duplicate ' + field + ' ' + id);
    seen.add(id);
    ids.push(id);
  }
  check(same(ids, sorted(ids)), code, 'record IDs must be sorted ascending');
  return ids;
};

export function validateExclusiveEquipmentIdentity({ canonical, evidence, evidenceText }) {
  check(exactKeys(canonical, [
    'schemaVersion', 'evidenceClass', 'responsibility', 'claim',
    'scope', 'provenance', 'limitations', 'records'
  ]), 'CANONICAL_SCHEMA_MISMATCH', 'canonical top-level schema mismatch');
  check(canonical.schemaVersion === 1 && canonical.evidenceClass === 'B',
    'CANONICAL_SCHEMA_MISMATCH', 'schema version or evidence class mismatch');
  check(canonical.responsibility === 'Exclusive Equipment identity/population',
    'CANONICAL_SCOPE_MISMATCH', 'responsibility mismatch');
  check(canonical.claim === 'The listed EquipmentIDs are the Exclusive Equipment identity/population admitted by this project for the pinned source scope.',
    'CANONICAL_SCOPE_MISMATCH', 'claim mismatch');
  check(exactKeys(canonical.scope, ['entity', 'population', 'identityKey', 'selectionRule']),
    'CANONICAL_SCOPE_MISMATCH', 'scope schema mismatch');
  check(canonical.scope.entity === 'Equipment' &&
    canonical.scope.population === 'EXCLUSIVE_EQUIPMENT' &&
    canonical.scope.identityKey === 'EquipmentID',
    'CANONICAL_SCOPE_MISMATCH', 'identity/population scope mismatch');
  check(exactKeys(canonical.scope.selectionRule, ['sourceField', 'predicate', 'sourceFact', 'mapping']),
    'CANONICAL_SCOPE_MISMATCH', 'selection rule schema mismatch');
  check(canonical.scope.selectionRule.sourceField === 'ConfigDataEquipmentInfo.GetPathList' &&
    canonical.scope.selectionRule.predicate === 'GetPathList has exactly one entry AND GetPathList[0].PathType equals 46' &&
    canonical.scope.selectionRule.sourceFact === 'The pinned ConfigData records contain exactly one acquisition path entry with PathType 46 for each admitted EquipmentID.' &&
    canonical.scope.selectionRule.mapping === 'Copy the source-native ConfigDataEquipmentInfo.ID value unchanged to EquipmentID.',
    'CANONICAL_SCOPE_MISMATCH', 'selection rule mismatch');

  check(exactKeys(evidence, ['schemaVersion', 'responsibility', 'scope', 'claims', 'semanticDecision', 'limitations']),
    'EVIDENCE_SCHEMA_MISMATCH', 'evidence top-level schema mismatch');
  const serializedEvidence = evidenceText ?? (JSON.stringify(evidence, null, 2) + '\n');
  check(gitBlobSha1(serializedEvidence) === EXPECTED_EVIDENCE_GIT_BLOB_SHA1,
    'EVIDENCE_INTEGRITY_MISMATCH', 'preserved predecessor evidence blob does not match its pinned content');
  check(evidence.schemaVersion === 1 &&
    evidence.responsibility === 'Exclusive Equipment identity/population' &&
    same(evidence.scope, { entity: 'Equipment', identityKey: 'EquipmentID', population: 'EXCLUSIVE_EQUIPMENT' }),
    'EVIDENCE_SCOPE_MISMATCH', 'evidence scope mismatch');
  check(exactKeys(evidence.claims, ['claimA', 'claimB']),
    'EVIDENCE_SCHEMA_MISMATCH', 'Claim A and Claim B must remain separate');
  const claimA = evidence.claims.claimA;
  const claimB = evidence.claims.claimB;
  check(exactKeys(claimA, ['claim', 'provenance', 'records', 'observedPredicateMatchCount']) &&
    claimA.claim === 'Each preserved ConfigData source fact row carries ID and a single GetPathList entry with PathType 46.' &&
    same(claimA.provenance, EXPECTED_CLAIM_A_PROVENANCE),
    'CLAIM_A_PROVENANCE_MISMATCH', 'Claim A source locator or selection fact mismatch');
  check(exactKeys(claimB, ['claim', 'provenance', 'records']) &&
    claimB.claim === 'The pinned predecessor generated classification artifact labels these per-ID rows as exclusive-equipment.' &&
    same(claimB.provenance, EXPECTED_CLAIM_B_PROVENANCE),
    'CLAIM_B_PROVENANCE_MISMATCH', 'Claim B artifact, generator, or validation provenance mismatch');
  check(same(evidence.semanticDecision, EXPECTED_DECISION),
    'SEMANTIC_DECISION_PROVENANCE_MISMATCH', 'pinned semantic contract provenance mismatch');
  check(same(evidence.limitations, LIMITATIONS),
    'EVIDENCE_LIMITATION_MISMATCH', 'evidence limitation mismatch');

  const claimAIds = collectUniqueIds(claimA.records, 'ID', 'CLAIM_A_RECORD_INVALID');
  check(claimA.observedPredicateMatchCount === claimAIds.length,
    'CLAIM_A_COUNT_MISMATCH', 'observed Claim A projection count mismatch');
  for (const row of claimA.records) {
    check(exactKeys(row, ['ID', 'GetPathList']) &&
      Array.isArray(row.GetPathList) &&
      row.GetPathList.length === 1 &&
      Number(row.GetPathList[0]?.PathType) === 46,
      'CLAIM_A_SOURCE_FACT_MISMATCH', 'Claim A row does not satisfy the pinned source-fact predicate');
  }

  const claimBIds = collectUniqueIds(claimB.records, 'equipmentId', 'CLAIM_B_RECORD_INVALID');
  check(claimB.provenance.observedClassifiedRecordCount === claimBIds.length,
    'CLAIM_B_COUNT_MISMATCH', 'observed Claim B projection count mismatch');
  for (const row of claimB.records) {
    check(row.acquisitionClass === evidence.semanticDecision.classification &&
      row.classificationBasis === CLASSIFICATION_BASIS &&
      row.confidencePercent === evidence.semanticDecision.confidencePercent,
      'CLAIM_B_CLASSIFICATION_MISMATCH', 'Claim B row classification differs from its pinned contract');
  }

  check(exactKeys(canonical.provenance, ['source', 'semanticDecision', 'claimEvidence']),
    'CANONICAL_PROVENANCE_MISMATCH', 'canonical provenance schema mismatch');
  check(same(canonical.provenance.source, EXPECTED_SOURCE),
    'CANONICAL_PROVENANCE_MISMATCH', 'Claim A source provenance mismatch');
  check(same(canonical.provenance.semanticDecision, EXPECTED_DECISION),
    'CANONICAL_PROVENANCE_MISMATCH', 'semantic decision provenance mismatch');
  check(same(canonical.provenance.claimEvidence, {
    path: EVIDENCE_PATH,
    claimAProjection: 'claims.claimA.records',
    claimBProjection: 'claims.claimB.records'
  }), 'CANONICAL_PROVENANCE_MISMATCH', 'canonical evidence locator mismatch');
  check(same(canonical.limitations, LIMITATIONS),
    'CANONICAL_PROVENANCE_MISMATCH', 'canonical limitations mismatch');

  check(Array.isArray(canonical.records), 'CANONICAL_RECORD_INVALID', 'canonical records must be an array');
  const canonicalIds = [];
  const canonicalSeen = new Set();
  for (const row of canonical.records) {
    check(exactKeys(row, ['equipmentId']), 'CANONICAL_SCOPE_LEAKAGE', 'unsupported canonical record field');
    check(Number.isSafeInteger(row.equipmentId) && row.equipmentId > 0,
      'CANONICAL_RECORD_INVALID', 'malformed EquipmentID');
    check(!canonicalSeen.has(row.equipmentId), 'CANONICAL_DUPLICATE_ID', 'duplicate EquipmentID ' + row.equipmentId);
    canonicalSeen.add(row.equipmentId);
    canonicalIds.push(row.equipmentId);
  }
  check(same(canonicalIds, sorted(canonicalIds)),
    'CANONICAL_RECORD_INVALID', 'canonical EquipmentID records must be sorted ascending');

  check(sameSet(claimAIds, claimBIds),
    'CLAIM_A_B_SET_MISMATCH', 'Claim A source-fact and Claim B classification projections differ');
  check(sameSet(canonicalIds, claimAIds) && sameSet(canonicalIds, claimBIds),
    'CANONICAL_ID_SET_MISMATCH', 'canonical IDs must exactly equal both pinned evidence projections');

  return {
    canonicalCount: canonicalIds.length,
    claimAObservedCount: claimAIds.length,
    claimBObservedCount: claimBIds.length,
    exactMatch: canonicalIds.length,
    missing: 0,
    unexpected: 0,
    duplicates: 0
  };
}

async function main() {
  const canonical = JSON.parse(await readFile(resolve(CANONICAL_PATH), 'utf8'));
  const evidenceText = await readFile(resolve(EVIDENCE_PATH), 'utf8');
  const evidence = JSON.parse(evidenceText);
  const result = validateExclusiveEquipmentIdentity({ canonical, evidence, evidenceText });
  process.stdout.write(JSON.stringify({ ok: true, ...result }) + '\n');
}
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) await main();
