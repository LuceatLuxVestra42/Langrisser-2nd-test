import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

const evidencePath = 'evidence/source/configdata/ConfigDataSkillInfo.records-hero-6-8-talent-skills.v1.json';
const canonicalPath = 'canonical/skills.v1.json';
const talentPath = 'canonical/hero-talent-star-skills.v1.json';
const expected = [
  [3067, 240, '传说的骑士', '每移动<color=#DC143C>1</color>格，伤害提升<color=#DC143C>1%</color>，防御提升<color=#DC143C>5%</color>。攻击后，可以再次移动<color=#DC143C>3</color>格。'],
  [3072, 241, '传说的骑士', '每移动<color=#DC143C>1</color>格，伤害提升<color=#DC143C>2%</color>，防御提升<color=#DC143C>10%</color>。攻击后，可以再次移动<color=#DC143C>3</color>格。'],
  [3077, 242, '传说的骑士', '每移动<color=#DC143C>1</color>格，伤害提升<color=#DC143C>3%</color>，防御提升<color=#DC143C>15%</color>。攻击后，可以再次移动<color=#DC143C>3</color>格。'],
  [3082, 243, '传说的骑士', '每移动<color=#DC143C>1</color>格，伤害提升<color=#DC143C>4%</color>，防御提升<color=#DC143C>20%</color>。攻击后，可以再次移动<color=#DC143C>3</color>格。'],
  [3196, 291, '秘法延伸', '进入战斗时，魔法伤害提升<color=#DC143C>10%</color>，使用技能时射程提升<color=#DC143C>1</color>。'],
  [3197, 292, '秘法延伸', '进入战斗时，魔法伤害提升<color=#DC143C>15%</color>，使用技能时射程提升<color=#DC143C>1</color>。'],
  [3198, 293, '秘法延伸', '进入战斗时，魔法伤害提升<color=#DC143C>20%</color>，使用技能时射程提升<color=#DC143C>1</color>。'],
  [3199, 294, '秘法延伸', '进入战斗时，魔法伤害提升<color=#DC143C>30%</color>，使用技能时射程提升<color=#DC143C>1</color>。'],
];
const expectedIds = expected.map(([id]) => id);
const recordIndices = Object.fromEntries(expected.map(([id, index]) => [String(id), index]));
const sourcePin = {
  repository: 'LuceatLuxVestra42/langrisser-future-guide',
  commit: '6475e63ee23d18adf733756c26a14fa9e3ed662c',
  commitTree: '08e1e6c2773730e60b258940e31494f68d65f86a',
  path: 'data/configdata/ConfigDataSkillInfo.json',
  gitBlobSha1: 'dbd7f8f94702bb43d2ceb0091e9755c9aebaed19',
  sha256: '2ff6d67e8c010037597928bccd2dc7b4b9abc0d2a78c9705d816c8218df3e741',
  sizeBytes: 20948140,
  containerPath: '$',
  primaryKey: 'ID',
  sourceIndex: {
    path: 'data/index/skill.v1.json',
    gitBlobSha1: '7bc7ce0f2ac59224763faf1a70e19e199eecc900',
    sourceSha256: '2ff6d67e8c010037597928bccd2dc7b4b9abc0d2a78c9705d816c8218df3e741',
    recordCount: 27198,
    recordIndices,
  },
  releaseArchive: {
    assetId: 540460413,
    name: 'configdata-source-v1-6475e63e.tar',
    sha256: '65855321776cba9523669a2d486c2edbd2908006cf854572b7a87b0b63405c84',
    archiveBytesVerifiedHere: false,
  },
};
const check = (condition, code, message) => { if (!condition) throw new Error(`Skill identity validation failed [${code}]: ${message}`); };
const exactKeys = (value, keys, label) => check(value && typeof value === 'object' && !Array.isArray(value)
  && isDeepStrictEqual(Object.keys(value).sort(), [...keys].sort()), 'SCHEMA', `${label} fields drift`);
const readJson = async (root, path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));

export async function validateSkillIdentities(root = process.cwd()) {
  const [evidence, canonical, talent] = await Promise.all([
    readJson(root, evidencePath), readJson(root, canonicalPath), readJson(root, talentPath),
  ]);
  exactKeys(evidence, ['schemaVersion', 'responsibility', 'scope', 'source', 'extraction', 'records', 'claimEvidence', 'fieldMeaningContract', 'interpretation', 'canonical', 'generated', 'productionRuntimeDependency'], 'Evidence');
  check(evidence.schemaVersion === 1 && evidence.responsibility === 'skill-identity-and-source-detail', 'EVIDENCE', 'Evidence owner identity drift');
  exactKeys(evidence.scope, ['sourceScope', 'skillIds', 'claim', 'outOfScope'], 'Evidence scope');
  check(evidence.scope.sourceScope === 'CN ConfigData snapshot 2026-09-02'
    && isDeepStrictEqual(evidence.scope.skillIds, expectedIds)
    && evidence.scope.claim === 'The pinned ConfigData SkillInfo source has these native Skill IDs, Chinese Name strings, and Chinese Desc strings.'
    && isDeepStrictEqual(evidence.scope.outOfScope, ['Korean Skill localization', 'structured combat/effect rules', 'PassiveBuffs_ID endpoint semantics', 'Skill acquisition', 'Hero or Job ownership', 'icon asset existence or meaning']),
  'SCOPE', 'Evidence scope or limitations drift');
  exactKeys(evidence.source, Object.keys(sourcePin), 'Evidence source pin');
  check(isDeepStrictEqual(evidence.source, sourcePin), 'SOURCE_PIN', 'Source commit, blob, checksum, index, or record locators drift');
  exactKeys(evidence.extraction, ['selection', 'rawSourceDownloadedAtPinnedCommit', 'blobAndSha256Verified', 'sourceIndexIdToRecordIndexVerified'], 'Extraction');
  check(evidence.extraction.selection === 'Select top-level array records only when numeric source-native ID equals one of the declared skillIds; preserve only the exact raw ID, Name, and Desc fields used by admitted claims. Other source fields are intentionally excluded.'
    && evidence.extraction.rawSourceDownloadedAtPinnedCommit === true
    && evidence.extraction.blobAndSha256Verified === true
    && evidence.extraction.sourceIndexIdToRecordIndexVerified === true, 'EXTRACTION', 'Extraction statement drift');
  check(Array.isArray(evidence.records) && evidence.records.length === expected.length, 'SOURCE_RECORDS', 'Evidence must contain exactly eight selected source records');
  const evidenceIds = [];
  for (let i = 0; i < expected.length; i += 1) {
    const [id, index, name, description] = expected[i];
    const record = evidence.records[i];
    exactKeys(record, ['sourceRecordIndex', 'sourceRecordLocator', 'rawRecord'], `Evidence record ${id}`);
    exactKeys(record.rawRecord, ['ID', 'Name', 'Desc'], `Raw SkillInfo record ${id}`);
    check(record.sourceRecordIndex === index && record.sourceRecordLocator === `${sourcePin.path}#ID=${id}`
      && record.rawRecord.ID === id && typeof record.rawRecord.ID === 'number'
      && record.rawRecord.Name === name && typeof record.rawRecord.Name === 'string'
      && record.rawRecord.Desc === description && typeof record.rawRecord.Desc === 'string',
    'SOURCE_RECORDS', `Raw SkillInfo record ${id} differs from the directly checked pinned source slice`);
    evidenceIds.push(record.rawRecord.ID);
  }
  check(new Set(evidenceIds).size === evidenceIds.length, 'SOURCE_RECORDS', 'Duplicate source Skill ID');
  exactKeys(evidence.claimEvidence, ['sourceIdNameAndDescValues', 'fieldDisplayMeaning'], 'Claim evidence assessment');
  check(evidence.claimEvidence.sourceIdNameAndDescValues === 'A' && evidence.claimEvidence.fieldDisplayMeaning === 'B',
    'EVIDENCE_CLASS', 'Claim evidence class drift');
  const meaningContract = evidence.fieldMeaningContract;
  exactKeys(meaningContract, ['evidenceClass', 'repository', 'commit', 'path', 'gitBlobSha1', 'status', 'skillInfoFieldNumbers', 'supportedMeaning', 'limitation'], 'Field meaning contract');
  exactKeys(meaningContract.skillInfoFieldNumbers, ['ID', 'Name', 'Desc'], 'SkillInfo field numbers');
  check(meaningContract.evidenceClass === 'B'
    && meaningContract.repository === 'LuceatLuxVestra42/langrisser-future-guide'
    && meaningContract.commit === '6475e63ee23d18adf733756c26a14fa9e3ed662c'
    && meaningContract.path === 'data/hero-skill-acquisition-stage4-4.v1.json'
    && meaningContract.gitBlobSha1 === 'afdabed9f82a401f50ed344e5ee4877bbc024f9c'
    && meaningContract.status === 'validated-review'
    && isDeepStrictEqual(meaningContract.skillInfoFieldNumbers, { ID: 2, Name: 3, Desc: 5 })
    && meaningContract.supportedMeaning === 'SkillInfo IDs are resolved to display metadata only after the explicit acquisition/reference edge has been established.'
    && meaningContract.limitation === 'This predecessor contract is review-scoped, does not establish combat mechanics, and its other candidate field numbers are not admitted here.',
  'FIELD_CONTRACT', 'Field meaning evidence pin or scope drift');
  exactKeys(evidence.interpretation, ['name', 'description'], 'Interpretation');
  check(evidence.interpretation.name === 'ConfigDataSkillInfo.Name is preserved as the source Chinese name string; no Korean translation or alias is asserted.'
    && evidence.interpretation.description === 'ConfigDataSkillInfo.Desc is preserved as an opaque source Chinese description string, including markup; no structured formula or independent mechanic claim is derived from its text.',
  'INTERPRETATION', 'Field meaning or limitation drift');
  check(evidence.canonical === false && evidence.generated === false && evidence.productionRuntimeDependency === false,
    'BOUNDARY', 'Evidence must remain non-canonical, non-generated, and outside runtime dependencies');

  exactKeys(canonical, ['schemaVersion', 'sourceScope', 'scope', 'records'], 'Canonical');
  check(canonical.schemaVersion === 1 && canonical.sourceScope === evidence.scope.sourceScope
    && canonical.scope === 'Source-native Skill ID with its ConfigDataSkillInfo Name and opaque Desc strings only; not a combat-rule or acquisition model.',
  'CANONICAL', 'Canonical owner scope drift');
  check(Array.isArray(canonical.records) && canonical.records.length === expected.length, 'CANONICAL', 'Canonical must contain exactly eight Skill records');
  const canonicalIds = [];
  for (let i = 0; i < expected.length; i += 1) {
    const [id, , name, description] = expected[i];
    const record = canonical.records[i];
    exactKeys(record, ['skillId', 'nameCn', 'descriptionCn', 'provenance'], `Canonical Skill ${id}`);
    exactKeys(record.provenance, ['identity', 'name', 'description'], `Canonical Skill ${id} provenance`);
    check(record.skillId === id && Number.isSafeInteger(record.skillId)
      && record.nameCn === name && record.descriptionCn === description,
    'CANONICAL', `Canonical Skill ${id} differs from its source fields`);
    const locator = `${evidencePath}#ID=${id}`;
    check(record.provenance.identity === locator
      && record.provenance.name === `${locator}/Name`
      && record.provenance.description === `${locator}/Desc`, 'PROVENANCE', `Canonical Skill ${id} has an incorrect field locator`);
    canonicalIds.push(record.skillId);
  }
  check(new Set(canonicalIds).size === canonicalIds.length, 'CANONICAL', 'Duplicate canonical Skill ID');

  exactKeys(talent, ['schemaVersion', 'scope', 'records'], 'Talent reference owner');
  check(Array.isArray(talent.records), 'TALENT_PARITY', 'Talent reference records are missing');
  const talentSkillIds = talent.records.map((row) => row.skillId).filter((id) => expectedIds.includes(id)).sort((a, b) => a - b);
  check(isDeepStrictEqual(talentSkillIds, [...expectedIds].sort((a, b) => a - b)), 'TALENT_PARITY', 'Existing Hero 6/8 Talent Skill references are not preserved exactly once');
  console.log(`Skill identity validation: PASS (records=${canonical.records.length}; source=CN ConfigData snapshot 2026-09-02; canonical claims=ID/Name/Desc only)`);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve('tools/validate-skill-identities.mjs')) {
  await validateSkillIdentities();
}
