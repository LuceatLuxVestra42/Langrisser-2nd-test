import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const COST_EVIDENCE_PATH = 'evidence/source/configdata/soldier-training-tech-223-level-costs.v1.json';
export const COST_CANONICAL_PATH = 'canonical/soldier-training-tech-level-costs.v1.json';
export const DESCRIPTION_PATH = 'canonical/soldier-training-tech-descriptions.v1.json';

const EXPECTED_IDS = [2230,2231,2232,2233,2234,2235,2236,2237,2238,2239];
const EXPECTED_SOURCE = {
  repository: 'LuceatLuxVestra42/langrisser-future-guide',
  commit: '6475e63ee23d18adf733756c26a14fa9e3ed662c',
  trainingTechPath: 'data/configdata/ConfigDataTrainingTechInfo.json',
  trainingTechBlob: 'ad8b290f0e34de24b6eab9538894068a06e086d4',
  levelInfoPath: 'data/configdata/ConfigDataTrainingTechLevelInfo.json',
  levelInfoBlob: '30789c3e4fb0d79b56514e720bb71a053df78c72',
  levelInfoSha256: '4d4afb874c0540bf4999cd5aa7c2f8a6ce5d3fa5838a7522c343365e165e8905',
  levelInfoBytes: 1862920,
  levelInfoPopulation: 2945,
};
const TECH_PROJECTION_SHA256 = 'cc42dd3ef0d3867ca3ece5fbcf54e3e600db94b9e241735b354a242668cbb28e';
const COST_PROJECTION_SHA256 = 'f60a7d5150db2e0714f8e0ed704e8f850564af0f059d955c67a12d71fa36d125';
const DESCRIPTION_CANONICAL_SHA256 = 'cdc9f04ea5ac454e91f55c06afa6a7251228c3aa22947669c199fa6971943bfa';
const EXPECTED_SCOPE = {
  sourceScope: 'Pinned CN ConfigData at 6475e63ee23d18adf733756c26a14fa9e3ed662c',
  claim: 'Preserve the two raw cost fields for the ten LevelInfo IDs explicitly referenced by TrainingTech 223.',
  excluded: ['Actual game level mapping','NORMAL/SP application costs','SP slot/application stage','Prerequisite or unlock interpretation','Skill reference semantics','Material item identity','Cumulative costs','Other TrainingTech records'],
};
const EXPECTED_EVIDENCE_SCOPE = {
  claim: 'Preserve the raw LevelupGoldCost and LevelupMaterialsCost fields on the ten LevelInfo records explicitly listed by source TrainingTech 223.',
  admitted: ['TrainingTech 223 source ID and explicit SoldierIDRelated and TechLevelupInfoList fields as selection support','LevelInfo source IDs and raw cost field values, JSON types, field presence, material array order and duplicates'],
  excluded: ['Actual game level mapping','NORMAL/SP cost application','SP slot or application stage','Unlock or prerequisite semantics','SoldierSkillID or SoldierSkillLevelup meaning','Skill effects','Material item identity, names or icons','Cumulative cost calculations','Other TrainingTech records'],
};

const fail = (message) => { throw new Error('Soldier TrainingTech 223 raw cost validation failed: ' + message); };
const check = (condition, message) => { if (!condition) fail(message); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const hashJson = (value) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
function exactKeys(value, keys, label) {
  check(value && typeof value === 'object' && !Array.isArray(value), label + ' must be an object');
  check(same(Object.keys(value).sort(), [...keys].sort()), label + ' has unexpected or missing fields');
}
function sourceType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}
function assertFieldState(state, present, value, label) {
  exactKeys(state, ['present','jsonType'], label + ' state');
  check(state.present === present, label + ' presence state mismatch');
  check(state.jsonType === (present ? sourceType(value) : 'absent'), label + ' JSON type state mismatch');
}
function provenance(id) {
  const base = COST_EVIDENCE_PATH + '#LevelInfoID=' + id;
  return {
    sourceCostRecord: base + '/LevelupGoldCost&LevelupMaterialsCost',
    trainingTechLink: COST_EVIDENCE_PATH + '#TrainingTechID=223/TechLevelupInfoList&contains=' + id,
  };
}

export function validateSoldierTrainingTechLevelCosts({ evidence, canonical, soldiers, spRelations, descriptions }) {
  exactKeys(evidence, ['schemaVersion','responsibility','scope','source','sources','selection','rawLevelInfoCostRecords','interpretation'], 'cost source evidence');
  check(evidence.schemaVersion === 1 && evidence.responsibility === 'soldier-training-tech-level-cost-source-slice', 'evidence owner/schema mismatch');
  check(same(evidence.scope, EXPECTED_EVIDENCE_SCOPE), 'evidence scope or admission boundary changed');
  check(evidence.source?.repository === EXPECTED_SOURCE.repository && evidence.source?.commit === EXPECTED_SOURCE.commit
    && evidence.source?.sourceVersionStatus === 'unknown'
    && evidence.source?.authority === 'PINNED_UNITYDATATOOL_PARSED_CONFIGDATA_SNAPSHOT', 'source identity/scope mismatch');
  const techSource = evidence.sources?.trainingTech;
  const levelSource = evidence.sources?.levelInfo;
  exactKeys(techSource, ['path','gitBlobSha1','locator','sourceBytes','sourceTopLevelRecordCount'], 'TrainingTech source anchor');
  exactKeys(levelSource, ['path','gitBlobSha1','sha256','sourceBytes','sourceTopLevelRecordCount'], 'LevelInfo source anchor');
  check(techSource.path === EXPECTED_SOURCE.trainingTechPath && techSource.gitBlobSha1 === EXPECTED_SOURCE.trainingTechBlob
    && techSource.locator === 'ID=223' && techSource.sourceBytes === 109874 && techSource.sourceTopLevelRecordCount === 287,
    'TrainingTech pinned source anchor mismatch');
  check(levelSource.path === EXPECTED_SOURCE.levelInfoPath && levelSource.gitBlobSha1 === EXPECTED_SOURCE.levelInfoBlob
    && levelSource.sha256 === EXPECTED_SOURCE.levelInfoSha256 && levelSource.sourceBytes === EXPECTED_SOURCE.levelInfoBytes
    && levelSource.sourceTopLevelRecordCount === EXPECTED_SOURCE.levelInfoPopulation, 'LevelInfo pinned source anchor mismatch');

  exactKeys(evidence.selection, ['trainingTechId','trainingTechRecord','levelInfoIds','extractionRule'], 'source selection');
  check(evidence.selection.trainingTechId === 223 && same(evidence.selection.levelInfoIds, EXPECTED_IDS), 'selected source ID set/order mismatch');
  const techRecord = evidence.selection.trainingTechRecord;
  exactKeys(techRecord, ['ID','SoldierIDRelated','TechLevelupInfoList'], 'TrainingTech 223 source projection');
  check(techRecord.ID === 223 && same(techRecord.SoldierIDRelated, [115,5115])
    && same(techRecord.TechLevelupInfoList, EXPECTED_IDS), 'TrainingTech 223 explicit endpoint/link mismatch');
  check(hashJson(techRecord) === TECH_PROJECTION_SHA256, 'TrainingTech selection evidence digest mismatch');

  const raw = evidence.rawLevelInfoCostRecords;
  check(Array.isArray(raw) && raw.length === EXPECTED_IDS.length, 'source cost evidence must contain exactly ten rows');
  for (let i = 0; i < EXPECTED_IDS.length; i++) {
    const row = raw[i], id = EXPECTED_IDS[i];
    exactKeys(row, ['ID','sourceFieldStates','LevelupGoldCost','LevelupMaterialsCost'], 'raw LevelInfo ' + id);
    check(row.ID === id, 'raw LevelInfo source ID/order mismatch at ' + id);
    const states = row.sourceFieldStates;
    exactKeys(states, ['LevelupGoldCost','LevelupMaterialsCost'], 'raw LevelInfo field states ' + id);
    assertFieldState(states.LevelupGoldCost, true, row.LevelupGoldCost, 'LevelInfo ' + id + ' LevelupGoldCost');
    exactKeys(states.LevelupMaterialsCost, ['present','jsonType','items'], 'LevelInfo ' + id + ' LevelupMaterialsCost state');
    check(states.LevelupMaterialsCost.present === true && states.LevelupMaterialsCost.jsonType === 'array', 'LevelInfo ' + id + ' materials presence/type state mismatch');
    check(typeof row.LevelupGoldCost === 'number' && Number.isSafeInteger(row.LevelupGoldCost), 'gold cost must remain a source JSON integer at ' + id);
    check(Array.isArray(row.LevelupMaterialsCost), 'materials field must remain a source array at ' + id);
    const itemStates = states.LevelupMaterialsCost.items;
    check(Array.isArray(itemStates) && itemStates.length === row.LevelupMaterialsCost.length, 'material item state count mismatch at ' + id);
    for (let j = 0; j < row.LevelupMaterialsCost.length; j++) {
      const item = row.LevelupMaterialsCost[j], itemState = itemStates[j];
      exactKeys(item, ['GoodsType','Id','Count'], 'raw LevelInfo ' + id + ' material ' + j);
      exactKeys(itemState, ['GoodsType','Id','Count'], 'raw LevelInfo ' + id + ' material state ' + j);
      for (const key of ['GoodsType','Id','Count']) {
        assertFieldState(itemState[key], true, item[key], 'LevelInfo ' + id + ' material ' + j + ' ' + key);
        check(typeof item[key] === 'number' && Number.isSafeInteger(item[key]), 'material source field must remain a JSON integer at ' + id + '/' + j + '/' + key);
      }
    }
  }
  const projectedCosts = raw.map(({ID,LevelupGoldCost,LevelupMaterialsCost}) => ({ID,LevelupGoldCost,LevelupMaterialsCost}));
  check(hashJson(projectedCosts) === COST_PROJECTION_SHA256, 'raw selected cost projection digest mismatch');
  check(evidence.interpretation?.goldCost?.sourceField === 'LevelupGoldCost'
    && evidence.interpretation.goldCost.meaning === 'Opaque source numeric cost field on the named LevelInfo record only.'
    && evidence.interpretation?.materialsCost?.sourceField === 'LevelupMaterialsCost'
    && evidence.interpretation.materialsCost.meaning === 'Opaque source ordered array of raw GoodsType, Id and Count fields. No item identity semantics asserted.',
    'cost field interpretation boundary changed');
  check(same(evidence.interpretation?.limitations, ['Source Version remains unknown.','Selected raw values are stored as JSON values, so lexical JSON token formatting is not byte-preserved; runtime JSON value and type parity is checked.']),
    'source evidence limitations changed');

  exactKeys(canonical, ['schemaVersion','responsibility','scope','records'], 'cost canonical');
  check(canonical.schemaVersion === 1 && canonical.responsibility === 'soldier-training-tech-level-costs'
    && same(canonical.scope, EXPECTED_SCOPE), 'canonical owner/schema/scope mismatch');
  exactKeys(canonical.scope, ['sourceScope','claim','excluded'], 'canonical scope');
  check(Array.isArray(canonical.records) && canonical.records.length === EXPECTED_IDS.length, 'canonical must contain exactly ten cost rows');
  for (let i = 0; i < EXPECTED_IDS.length; i++) {
    const source = raw[i], row = canonical.records[i], id = EXPECTED_IDS[i];
    exactKeys(row, ['trainingTechId','levelInfoId','levelupGoldCost','levelupMaterialsCost','provenance'], 'canonical LevelInfo ' + id);
    check(row.trainingTechId === 223 && row.levelInfoId === id, 'canonical source key/order mismatch at ' + id);
    check(typeof row.levelupGoldCost === 'number' && same(row.levelupGoldCost, source.LevelupGoldCost), 'canonical gold value/type differs from source at ' + id);
    check(Array.isArray(row.levelupMaterialsCost) && same(row.levelupMaterialsCost, source.LevelupMaterialsCost), 'canonical materials value/type/order differs from source at ' + id);
    check(same(row.provenance, provenance(id)), 'canonical provenance mismatch at ' + id);
  }

  check(descriptions?.schemaVersion === 1 && Array.isArray(descriptions.records) && descriptions.records.length === 20,
    'existing TrainingTech description canonical scope changed');
  check(hashJson(descriptions) === DESCRIPTION_CANONICAL_SHA256, 'existing TrainingTech description canonical changed');
  check(soldiers?.schemaVersion === 1 && Array.isArray(soldiers.records), 'Soldier identity owner missing');
  const identity = new Set(soldiers.records.filter(r => r.entity === 'Soldier').map(r => r.variant + ':' + r.id));
  check(identity.has('NORMAL:115') && identity.has('SP:5115'), 'source endpoint identity context is missing');
  check(spRelations?.schemaVersion === 1 && Array.isArray(spRelations.records)
    && spRelations.records.some(r => r.spSoldierId === 5115 && r.normalSoldierId === 115), 'existing explicit SP-to-NORMAL endpoint context is missing');
  return {recordCount:canonical.records.length,levelInfoIds:EXPECTED_IDS,materialRowCount:raw.reduce((sum,row)=>sum+row.LevelupMaterialsCost.length,0)};
}

export function loadAndValidateSoldierTrainingTechLevelCosts(root = process.cwd()) {
  const read = relativePath => JSON.parse(fs.readFileSync(path.resolve(root, relativePath), 'utf8'));
  return validateSoldierTrainingTechLevelCosts({
    evidence:read(COST_EVIDENCE_PATH),
    canonical:read(COST_CANONICAL_PATH),
    soldiers:read('canonical/soldiers.v1.json'),
    spRelations:read('canonical/sp-soldier-normal-relations.v1.json'),
    descriptions:read(DESCRIPTION_PATH),
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const result = loadAndValidateSoldierTrainingTechLevelCosts();
  process.stdout.write('Soldier TrainingTech 223 raw costs: PASS (' + result.recordCount + ' records; source field types, values, order, provenance and scope)\\n');
}

