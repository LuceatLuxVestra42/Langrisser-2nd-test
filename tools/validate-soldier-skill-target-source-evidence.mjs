import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

export const EVIDENCE_PATH = 'evidence/source/configdata/ConfigDataSkillInfo.records-soldier-skill-targets-30.v1.json';
const PINNED_SOURCE = {
  repository: 'LuceatLuxVestra42/langrisser-future-guide',
  commit: '6475e63ee23d18adf733756c26a14fa9e3ed662c',
  path: 'data/configdata/ConfigDataSkillInfo.json',
  gitBlobSha1: 'dbd7f8f94702bb43d2ceb0091e9755c9aebaed19',
  sha256: '2ff6d67e8c010037597928bccd2dc7b4b9abc0d2a78c9705d816c8218df3e741',
  sizeBytes: 20948140,
  recordCount: 27198,
  containerPath: '$',
  primaryKey: 'ID',
  archiveSha256: '65855321776cba9523669a2d486c2edbd2908006cf854572b7a87b0b63405c84',
  archiveBytesVerifiedHere: false,
};
const GROUPS = [
  { name: 'soldier-115-normal', sourceLocator: 'ConfigDataSoldierInfo#ID=115/Skills_ID', status: 'existing source-only reference values used as selection context', ids: [60666,60667,60668,60669,60670,60671,60672,60673,60674,60675] },
  { name: 'soldier-5115-sp', sourceLocator: 'ConfigDataSoldierInfo#ID=5115/Skills_ID', status: 'existing source-only reference values used as selection context', ids: [66957,66958,66959,66960,66961,66962,66963,66964,66965,66966] },
  { name: 'training-tech-223-level-info-candidate', sourceLocator: 'ConfigDataTrainingTechLevelInfo#ID=2230-2239/SoldierSkillID', status: 'selection context only; SkillInfo Target Table contract remains unverified', ids: [65110,65111,65112,65113,65114,65115,65116,65117,65118,65119] },
];
const EXPECTED_IDS = GROUPS.flatMap(group => group.ids);
// Hashes are SHA-256 of JSON.stringify(rawRecord) from the directly verified fixed-commit source bytes.
// They independently pin every selected Record value, field, JSON type, array order, and object key order.
const EXPECTED_RECORD_HASHES = {"60666":"05f41ff094cb5affef8c250e5c0c62cf28749c0108fef4be1f02fb5bb4b7e212","60667":"37057fd038aff6418b53e83fbd8d05ca7504a0f6c3ecd3029a283123e87b022a","60668":"f09b40b4faa25bde61324d9b911910dbfe6fe435a6be8dccb530b62af5cb65d1","60669":"163380d36ac60cf76bbc12983683b0b062b53e61f593769917f17f50e68fe7a5","60670":"3ea01c0a0ac7b02b0a1eaae9f61a58935ce193c3daec08ffbaff9b68c7b3eb96","60671":"a218d99038914f01b6c60a412f904847e2089bc89421d34fdc29d0923624c59e","60672":"bae98eca2d6ba1dfb4e760a6689793c88186ce3fabefa9de7e07dfe47a7fb4c7","60673":"6c3c6569cf7409dc02bc1a3a8eddc533d73ce35f8351cf8152731b93cf4a59c8","60674":"7ac0af505e5055674f24680dae2ade56005715db665fa7c43e1bf9bfd9ae0fa7","60675":"e27b3ce838e8155c20856a4edd65d230458fb3b0eb74b4667ed16518560b6e87","66957":"857a84208da5f2a380ce34010ca07084ec1b161f4c421c01c7c0bb9058dd6b9f","66958":"ffb95d19e8fc4dfb3cdfc8bda5b5286af5a94a24b9a969963982d34a3cb0346f","66959":"038714ef1da12899bdd31f62f4a5ec99defeae72619e37877f9c4c0c2243a2f0","66960":"090d2f07264da73dadf56574008d7659826fb82a08f66153ebad7f19d9711031","66961":"6976626bd26bf94a1da65dabbd2d944fdf6eb7bc9d7080b652113697192a705b","66962":"259476ae66676477196af50a8d33a3c3f1e999e26b8fc3221325df297cc67fbe","66963":"4df1047e493a3ca39b7fd6905cf2da4799e5996a4710c989b8e5b34394236f03","66964":"61072a67ae40b33ee0da0200496573084b8bd880d554629714cae3f0684f3656","66965":"78a629288ee3f8cc5e80276e005ad0a7a05925cb26b65db12a5cc0e9ef265db2","66966":"3490d3ee2b7951204671f8e1b6884e44361cc9b4809ad6cf96a16dcf02c2d7d2","65110":"e4350f103d316320941ee88b76667b1b45e51cab5d22ae4005cb4ce9139526d6","65111":"4046781bbe48eab90c96c9a7bd5ab11b0851e471233ff170e10cbab0a7e5b549","65112":"54334fa8c1d44e987a523abc82146bf3fed957687b15d6de76104adec32a7880","65113":"d7ffc56542faf29aff460ffdb3cc64ecf792d17f122b4f207119924991fd30e6","65114":"0738bfbb21efa5494e2ef9d1f38e899f2ff6df9a14d79c9958c4a0dec0633b58","65115":"16f275852a4acd94a4065870b31c119dd668f3eadfa566409a800398e0367ecd","65116":"773c3b618bdb7a401663b685130d1e78c7783d45ef7374ffd17915a28a12ad42","65117":"3bd2e8700d9852f042ef7b8fa31b6686840411e58a0fdb01ad8e5272950360b4","65118":"36caa036fcae6a416c4fcc6fbea134c41eb5d97c0288ace0b843b67b1d2ae582","65119":"127900e4c8d631a77bdd72d607d2fea2e2597c41e1665551f58fe12d6b4aa168"};
const GROUP_FIELDS = {
  'soldier-115-normal': ['ID','Name','Desc','PassiveBuffs_ID','SkillAIType','SkillType','BattlePower'],
  'soldier-5115-sp': ['ID','Name','Desc','PassiveBuffs_ID','SkillAIType','SkillType','Icon','BattlePower'],
  'training-tech-223-level-info-candidate': ['ID','Name','Desc','PassiveBuffs_ID','SkillAIType','SkillType'],
};
const EXPECTED_SCOPE = {
  sourceScope: 'CN ConfigData snapshot 2026-09-02',
  claim: 'The pinned ConfigData SkillInfo source contains the following exact raw SkillInfo records selected by explicit source-native ID.',
  recordIds: EXPECTED_IDS,
  selectionContexts: GROUPS,
  selectionContextLimit: 'Selection contexts document why these source IDs were selected. They do not admit Skill identities or Soldier-to-Skill relations, and the TrainingTechLevelInfo.SoldierSkillID-to-SkillInfo contract remains unverified.',
  outOfScope: [
    'canonical Skill identity admission', 'Soldier-to-Skill relation admission',
    'TrainingTech SoldierSkillID reference contract', 'Skill names as canonical game identities',
    'combat/effect rules', 'level semantics', 'NORMAL/SP correspondence',
    'PassiveBuffs_ID target identity', 'Korean localization', 'generated or frontend consumers',
  ],
};
const EXPECTED_EXTRACTION = {
  method: 'Download pinned raw file from raw.githubusercontent.com; verify byte length, SHA-256 and Git blob SHA-1; JSON.parse top-level array; select each record by explicit ID equality; verify each requested ID appears exactly once.',
  selectedBy: 'rawRecord.ID',
  fullSourceBytesVerified: true,
  recordSelectionVerifiedByExplicitId: true,
  recordFieldOrderAndValuesPreservedByJSONParser: true,
  limitation: 'JSON parsing and reserialization preserve JSON values, types, object key insertion order, and array order but not original lexical whitespace or number token spelling. Whole Source Pack archive digest was not verified.',
};
const fail = (condition, message) => { if (!condition) throw new Error(`Skill target source evidence validation failed: ${message}`); };
function exactKeys(value, expected, label) {
  fail(value && typeof value === 'object' && !Array.isArray(value), `${label} must be an object`);
  fail(isDeepStrictEqual(Object.keys(value).sort(), [...expected].sort()), `${label} has missing or unexpected fields`);
}
function stableJsonHash(value) {
  return createHash('sha256').update(JSON.stringify(value), 'utf8').digest('hex');
}

export function validateSoldierSkillTargetSourceEvidence(evidence) {
  exactKeys(evidence, ['schemaVersion','responsibility','scope','source','extraction','records','canonical','generated','productionRuntimeDependency'], 'Evidence');
  fail(evidence.schemaVersion === 1 && evidence.responsibility === 'skill-target-source-evidence', 'Evidence owner/schema mismatch');
  fail(isDeepStrictEqual(evidence.scope, EXPECTED_SCOPE), 'scope, target IDs, reference locators, or exclusions changed');
  exactKeys(evidence.source, Object.keys(PINNED_SOURCE), 'Source metadata');
  fail(isDeepStrictEqual(evidence.source, PINNED_SOURCE), 'pinned Source identity, digest, size, or archive-verification limitation mismatch');
  fail(isDeepStrictEqual(evidence.extraction, EXPECTED_EXTRACTION), 'extraction method or verification boundary changed');
  fail(evidence.canonical === false && evidence.generated === false && evidence.productionRuntimeDependency === false,
    'Source Evidence must remain non-canonical, non-generated, and outside runtime dependencies');
  fail(Array.isArray(evidence.records) && evidence.records.length === EXPECTED_IDS.length, 'Evidence must contain exactly 30 records');
  const seen = new Set();
  for (let i = 0; i < EXPECTED_IDS.length; i += 1) {
    const expectedId = EXPECTED_IDS[i];
    const group = GROUPS.find(item => item.ids.includes(expectedId));
    const row = evidence.records[i];
    exactKeys(row, ['sourceRecordLocator','selectionContexts','rawRecord'], `Evidence wrapper ${expectedId}`);
    fail(row.sourceRecordLocator === `${PINNED_SOURCE.path}#ID=${expectedId}`, `source locator mismatch for ${expectedId}`);
    fail(isDeepStrictEqual(row.selectionContexts, [group.name]), `source selection context mismatch for ${expectedId}`);
    const raw = row.rawRecord;
    fail(raw && typeof raw === 'object' && !Array.isArray(raw), `raw record ${expectedId} must be an object`);
    fail(Number.isSafeInteger(raw.ID) && raw.ID === expectedId, `explicit integer ID mismatch for ${expectedId}`);
    fail(!seen.has(raw.ID), `duplicate target record ID ${raw.ID}`);
    seen.add(raw.ID);
    fail(isDeepStrictEqual(Object.keys(raw), GROUP_FIELDS[group.name]), `raw field set/order mismatch for ${expectedId}`);
    fail(typeof raw.Name === 'string' && typeof raw.Desc === 'string', `Name/Desc JSON type mismatch for ${expectedId}`);
    fail(Array.isArray(raw.PassiveBuffs_ID), `PassiveBuffs_ID JSON type mismatch for ${expectedId}`);
    fail(Number.isSafeInteger(raw.SkillAIType) && Number.isSafeInteger(raw.SkillType), `SkillAIType/SkillType JSON type mismatch for ${expectedId}`);
    if (group.name !== 'training-tech-223-level-info-candidate') fail(Number.isSafeInteger(raw.BattlePower), `BattlePower JSON type mismatch for ${expectedId}`);
    if (group.name === 'soldier-5115-sp') fail(typeof raw.Icon === 'string', `Icon JSON type mismatch for ${expectedId}`);
    fail(stableJsonHash(raw) === EXPECTED_RECORD_HASHES[expectedId], `raw record content/type/order differs from independently pinned Source Record ${expectedId}`);
  }
  fail(seen.size === EXPECTED_IDS.length, 'target IDs are missing or duplicated');
  return { recordCount: seen.size, targetIds: [...seen], canonicalAdmission: false, relationAdmission: false };
}

export async function loadAndValidateSoldierSkillTargetSourceEvidence(root = process.cwd()) {
  const evidence = JSON.parse(await readFile(resolve(root, EVIDENCE_PATH), 'utf8'));
  return validateSoldierSkillTargetSourceEvidence(evidence);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve('tools/validate-soldier-skill-target-source-evidence.mjs')) {
  const result = await loadAndValidateSoldierSkillTargetSourceEvidence();
  console.log(`Skill target Source Evidence: PASS (${result.recordCount} fixed-source raw records; no Skill identity or relation admitted)`);
}
