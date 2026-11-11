import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const EVIDENCE_PATH = 'evidence/source/awakening/hero15-awakening-references.v1.json';
const CANONICAL_PATH = 'canonical/hero-awakening-references.v1.json';
const EXPECTED_STAGE1_GOODS = [
  { GoodsType: 6, Id: 3253, Count: 5 },
  { GoodsType: 6, Id: 3249, Count: 8 },
  { GoodsType: 6, Id: 3247, Count: 8 },
];
const EXPECTED_STAGE2_GOODS = [
  { GoodsType: 6, Id: 3260, Count: 5 },
  { GoodsType: 6, Id: 3256, Count: 12 },
  { GoodsType: 6, Id: 3254, Count: 12 },
];
const EXPECTED_ITEM_ENDPOINTS = [
  { sourceArrayIndex: 444, recordLocator: 'ConfigDataItemInfo#ID=3253', fields: { ID: 3253 } },
  { sourceArrayIndex: 440, recordLocator: 'ConfigDataItemInfo#ID=3249', fields: { ID: 3249 } },
  { sourceArrayIndex: 438, recordLocator: 'ConfigDataItemInfo#ID=3247', fields: { ID: 3247 } },
  { sourceArrayIndex: 451, recordLocator: 'ConfigDataItemInfo#ID=3260', fields: { ID: 3260 } },
  { sourceArrayIndex: 447, recordLocator: 'ConfigDataItemInfo#ID=3256', fields: { ID: 3256 } },
  { sourceArrayIndex: 445, recordLocator: 'ConfigDataItemInfo#ID=3254', fields: { ID: 3254 } },
];
const check = (condition, message) => { if (!condition) throw new Error(message); };

export function validateHero15AwakeningReferencesData({ evidence, canonical }) {
  check(evidence.schemaVersion === 1 && evidence.claimType === 'hero15-awakening-source-references', 'Awakening evidence contract mismatch');
  assert.deepEqual(evidence.sourceSnapshot, {
    repository: 'LuceatLuxVestra42/langrisser-future-guide',
    commit: '6475e63ee23d18adf733756c26a14fa9e3ed662c',
    tree: '08e1e6c2773730e60b258940e31494f68d65f86a',
  }, 'Awakening source snapshot mismatch');
  assert.deepEqual(evidence.legacyValidationContext, {
    repository: 'LuceatLuxVestra42/langrisser-future-guide',
    mainCommit: '57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff',
    relationContract: 'data/contracts/hero-awakening-materials.v1.json#relationContract/heroAwaken',
    summaryArtifact: 'data/validation/hero-awakening-materials-summary.v1.json',
    summaryStatus: 'PASS',
    summaryScope: '267 upstream Hero IDs; 267 stage-I definitions; 257 defined and 10 undefined awakening entries; this aggregate status alone does not establish Hero 15 values.',
    producer: 'scripts/build_hero_awakening_materials.cjs',
    validator: 'scripts/validate_hero_awakening_materials.cjs',
    relationRule: 'upstream heroId resolves to ConfigDataAwakenInfo.ID by exact numeric equality',
    reuseBoundary: 'Legacy validation is supporting context only; this claim\'s values and endpoints were re-read from the fixed ConfigData Git blobs below.',
  }, 'Legacy contract or validation scope mismatch');
  assert.deepEqual(evidence.sourceRecords.awakenInfo, {
    path: 'data/configdata/ConfigDataAwakenInfo.json',
    blobSha1: '7593f77f0fa0aafac8850ee3fc2b093dd499bbcf',
    sha256: '7ac3ac7eba676fd7c5c8b4a4785b988a6cd556ffb1f6e184cca88fa1d5f3a1f4',
    recordCount: 283,
    sourceArrayIndex: 13,
    recordLocator: 'ConfigDataAwakenInfo#ID=15',
    fieldLocator: 'ConfigDataAwakenInfo#ID=15',
    fields: {
      ID: 15,
      Awaken1LevelID: 1015,
      Awaken1Material: EXPECTED_STAGE1_GOODS,
      Awaken2Unlock: true,
      Awaken2LevelID: 2015,
      Level2SkillID: 12350,
      Awaken2Material: EXPECTED_STAGE2_GOODS,
    },
  }, 'AwakenInfo source pin, record, or raw fields mismatch');
  assert.deepEqual(evidence.sourceRecords.awakenLevelEndpoints, {
    path: 'data/configdata/ConfigDataAwakenLevelInfo.json',
    blobSha1: 'cce2eea928ecfc9e09b03e9f694411af4db69da4',
    sha256: '370ea380cb6f78495e7ad327afd8794d5fa44616865c578627175c30aac7be16',
    recordCount: 566,
    records: [
      { sourceArrayIndex: 13, recordLocator: 'ConfigDataAwakenLevelInfo#ID=1015', fields: { ID: 1015 } },
      { sourceArrayIndex: 296, recordLocator: 'ConfigDataAwakenLevelInfo#ID=2015', fields: { ID: 2015 } },
    ],
  }, 'AwakenLevel endpoint evidence mismatch');
  assert.deepEqual(evidence.sourceRecords.skillEndpoint, {
    path: 'data/configdata/ConfigDataSkillInfo.json',
    blobSha1: 'dbd7f8f94702bb43d2ceb0091e9755c9aebaed19',
    sha256: '2ff6d67e8c010037597928bccd2dc7b4b9abc0d2a78c9705d816c8218df3e741',
    recordCount: 27198,
    records: [{ sourceArrayIndex: 2492, recordLocator: 'ConfigDataSkillInfo#ID=12350', fields: { ID: 12350 } }],
    limitation: 'Only the referenced Skill ID endpoint is checked here. Skill Name, Description, identity admission, acquisition, equip, and combat semantics are outside this claim.',
  }, 'Awakening Skill endpoint evidence mismatch');
  assert.deepEqual(evidence.sourceRecords.itemEndpoints, {
    path: 'data/configdata/ConfigDataItemInfo.json',
    blobSha1: 'fd34c0a83bd403c1fd01d34f3439e4c24a794f5e',
    sha256: '99a037c766aeb9f1342f8033897d6786b88060126495fd201c0db1fcac761683',
    recordCount: 2250,
    records: EXPECTED_ITEM_ENDPOINTS,
    limitation: 'Only exact Item ID endpoints for GoodsType=6 entries are checked. Item identities and acquisition/display details are not admitted.',
  }, 'Awakening material Item endpoint evidence mismatch');
  check(evidence.interpretation.evidenceClass === 'A_DIRECT_SOURCE_REFERENCE', 'Awakening Evidence Class mismatch');
  check(evidence.interpretation.transformation.includes('preserve stage, Skill, and Goods fields in source order'), 'Awakening transformation missing source-order preservation');
  check(evidence.interpretation.rawAwaken2Unlock.includes('not used as a gate'), 'Awaken2Unlock boundary missing');
  check(evidence.interpretation.limitation.includes('No claim is made about actual awakening availability'), 'Awakening semantic limitation missing');

  assert.deepEqual(Object.keys(canonical).sort(), ['records', 'schemaVersion', 'scope'].sort(), 'Awakening Canonical schema drift');
  check(canonical.schemaVersion === 1 && canonical.records.length === 1, 'Awakening Canonical population mismatch');
  const itemRef = (sourceIndex, itemId, count, endpointIndex) => ({
    sourceIndex, goodsType: 6, itemId, count, endpointNamespace: 'ConfigDataItemInfo.ID',
    endpointProvenance: `${EVIDENCE_PATH}#sourceRecords/itemEndpoints/records/${endpointIndex}`,
  });
  const expectedRecord = {
    heroId: 15,
    awakenInfoId: 15,
    awakeningSourceNamespace: 'ConfigDataAwakenInfo.ID',
    stage1LevelReference: {
      sourceField: 'Awaken1LevelID', levelId: 1015, endpointNamespace: 'ConfigDataAwakenLevelInfo.ID',
      evidenceProvenance: `${EVIDENCE_PATH}#sourceRecords/awakenInfo/fields/Awaken1LevelID`,
      endpointProvenance: `${EVIDENCE_PATH}#sourceRecords/awakenLevelEndpoints/records/0`,
    },
    stage1SourceGoods: [itemRef(0, 3253, 5, 0), itemRef(1, 3249, 8, 1), itemRef(2, 3247, 8, 2)],
    stage2LevelReference: {
      sourceField: 'Awaken2LevelID', levelId: 2015, endpointNamespace: 'ConfigDataAwakenLevelInfo.ID',
      evidenceProvenance: `${EVIDENCE_PATH}#sourceRecords/awakenInfo/fields/Awaken2LevelID`,
      endpointProvenance: `${EVIDENCE_PATH}#sourceRecords/awakenLevelEndpoints/records/1`,
    },
    stage2SkillReference: {
      sourceField: 'Level2SkillID', skillId: 12350, endpointNamespace: 'ConfigDataSkillInfo.ID',
      evidenceProvenance: `${EVIDENCE_PATH}#sourceRecords/awakenInfo/fields/Level2SkillID`,
      endpointProvenance: `${EVIDENCE_PATH}#sourceRecords/skillEndpoint/records/0`,
    },
    stage2SourceGoods: [itemRef(0, 3260, 5, 3), itemRef(1, 3256, 12, 4), itemRef(2, 3254, 12, 5)],
    evidenceProvenance: `${EVIDENCE_PATH}#sourceRecords/awakenInfo`,
  };
  assert.deepEqual(canonical.records, [expectedRecord], 'Awakening references, raw Goods, order, or provenance mismatch');
  const forbidden = ['unlock', 'consume', 'acquire', 'equip', 'combat', 'effect', 'publication', 'available', 'completion'];
  check(!canonical.records.some(row => Object.keys(row).some(key => forbidden.some(term => key.toLowerCase().includes(term)))), 'Out-of-scope Awakening semantic field found');
  return { heroId: 15, sourceAwakenInfoId: 15, stageReferences: 2, skillReferences: 1, sourceGoodsEntries: 6, awakeningSkillIdentityAdmitted: false, unlockOrConsumptionSemantics: false, publication: false };
}

export async function validateHero15AwakeningReferences(root = process.cwd()) {
  const read = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'));
  const [evidence, canonical] = await Promise.all([read(EVIDENCE_PATH), read(CANONICAL_PATH)]);
  const result = validateHero15AwakeningReferencesData({ evidence, canonical });
  process.stdout.write('Hero 15 Awakening source references: PASS (2 level endpoints, 1 Skill reference, 6 ordered source Goods entries; no unlock, consumption, or publication semantics admitted)\n');
  return result;
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) await validateHero15AwakeningReferences();
