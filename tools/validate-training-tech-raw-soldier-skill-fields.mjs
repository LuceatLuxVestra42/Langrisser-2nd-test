import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const EVIDENCE_PATH = 'evidence/source/configdata/ConfigDataTrainingTechLevelInfo.raw-soldier-skill-fields-2230-2239.v1.json';

const SOURCE_PATH = 'data/configdata/ConfigDataTrainingTechLevelInfo.json';
const IDS = [2230,2231,2232,2233,2234,2235,2236,2237,2238,2239];
const EXPECTED_ROWS = [
  {ID:2230,SoldierSkillID:65110,SoldierSkillLevelup:1},
  {ID:2231,SoldierSkillID:65111,SoldierSkillLevelup:2},
  {ID:2232,SoldierSkillID:65112,SoldierSkillLevelup:3},
  {ID:2233,SoldierSkillID:65113,SoldierSkillLevelup:4},
  {ID:2234,SoldierSkillID:65114,SoldierSkillLevelup:5},
  {ID:2235,SoldierSkillID:65115,SoldierSkillLevelup:6},
  {ID:2236,SoldierSkillID:65116,SoldierSkillLevelup:7},
  {ID:2237,SoldierSkillID:65117,SoldierSkillLevelup:8},
  {ID:2238,SoldierSkillID:65118,SoldierSkillLevelup:9},
  {ID:2239,SoldierSkillID:65119,SoldierSkillLevelup:10},
];
const SOURCE = {
  repository:'LuceatLuxVestra42/langrisser-future-guide',
  commit:'6475e63ee23d18adf733756c26a14fa9e3ed662c',
  path:SOURCE_PATH,
  gitBlobSha1:'30789c3e4fb0d79b56514e720bb71a053df78c72',
  sha256:'4d4afb874c0540bf4999cd5aa7c2f8a6ce5d3fa5838a7522c343365e165e8905',
  sizeBytes:1862920,
  recordCount:2945,
  topLevelType:'array',
  sourceVersionStatus:'unknown',
  authority:'PINNED_UNITYDATATOOL_PARSED_CONFIGDATA_SNAPSHOT',
};
const PROJECTION_SHA256 = 'c181bc90dd1f6f6ad5df747b70b29004fd8d460b491427180d885ce1004ec89c';
const SCOPE = {
  claim:'Preserve the source-native SoldierSkillID and SoldierSkillLevelup values on exactly LevelInfo records 2230 through 2239.',
  sourceScope:'Pinned CN ConfigData snapshot at 6475e63ee23d18adf733756c26a14fa9e3ed662c',
  recordIds:IDS,
  fields:['SoldierSkillID','SoldierSkillLevelup'],
  excluded:[
    'SkillInfo target table or relation contract','Relation cardinality or kind','Game Skill Level meaning',
    'Skill effects or combat mechanics','NORMAL/SP Skill correspondence','Localization',
    'Other TrainingTechLevelInfo records','Generated or frontend presentation',
  ],
};
const PROJECTION = {
  fields:['ID','SoldierSkillID','SoldierSkillLevelup'],
  recordOrder:'ascending explicit ID order 2230 through 2239',
  fieldOrder:['ID','SoldierSkillID','SoldierSkillLevelup'],
  serialization:'UTF-8 compact JSON with no whitespace, equivalent to JSON.stringify over ordered records and ordered fields',
  sha256:PROJECTION_SHA256,
};

const fail = message => { throw new Error('TrainingTech raw SoldierSkill fields validation failed: ' + message); };
const check = (condition, message) => { if (!condition) fail(message); };
const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
const hashJson = value => crypto.createHash('sha256').update(JSON.stringify(value), 'utf8').digest('hex');
function exactKeys(value, keys, label) {
  check(value && typeof value === 'object' && !Array.isArray(value), label + ' must be an object');
  check(same(Object.keys(value).sort(), [...keys].sort()), label + ' has unexpected or missing fields');
}
function provenance(id) {
  const base = SOURCE_PATH + '#ID=' + id;
  return {record:base,SoldierSkillID:base + '/SoldierSkillID',SoldierSkillLevelup:base + '/SoldierSkillLevelup'};
}

export function validateTrainingTechRawSoldierSkillFields(evidence) {
  exactKeys(evidence,['schemaVersion','responsibility','scope','source','extraction','records'],'raw field evidence');
  check(evidence.schemaVersion === 1 && evidence.responsibility === 'training-tech-level-raw-soldier-skill-fields','evidence owner/schema mismatch');
  check(same(evidence.scope,SCOPE),'evidence scope, population, or semantic exclusions changed');
  exactKeys(evidence.source,Object.keys(SOURCE),'source anchor');
  check(same(evidence.source,SOURCE),'fixed source commit/path/blob/digest/size/count mismatch');
  exactKeys(evidence.extraction,['method','sourceLocatorTemplate','projection','limitations'],'extraction metadata');
  check(evidence.extraction.method === 'Download the complete raw file from the immutable source commit; verify byte size, SHA-256, and Git blob SHA-1 before parsing; select records by explicit numeric ID and retain only ID plus the two scoped raw fields.','extraction method changed');
  check(evidence.extraction.sourceLocatorTemplate === SOURCE_PATH + '#ID=<ID>','source locator template mismatch');
  check(same(evidence.extraction.limitations,[
    'Projection SHA-256 covers only the ordered ID and two raw fields; it is not the whole source file hash.',
    'JSON numeric values and types are preserved; original lexical number token formatting is not preserved.',
    'The source snapshot version label is unknown.',
  ]),'source/extraction limitations changed');
  exactKeys(evidence.extraction.projection,Object.keys(PROJECTION),'field projection');
  check(same(evidence.extraction.projection,PROJECTION),'projection order, serialization rule, or digest mismatch');

  const rows = evidence.records;
  check(Array.isArray(rows) && rows.length === IDS.length,'evidence must contain exactly ten records');
  const projection = [];
  for (let i=0;i<IDS.length;i++) {
    const row=rows[i], expected=EXPECTED_ROWS[i], id=IDS[i];
    exactKeys(row,['ID','SoldierSkillID','SoldierSkillLevelup','sourceFieldStates','provenance'],'LevelInfo ' + id);
    check(row.ID === id && Number.isSafeInteger(row.ID),'explicit LevelInfo ID/order/type mismatch at ' + id);
    check(row.SoldierSkillID === expected.SoldierSkillID && Number.isSafeInteger(row.SoldierSkillID),'SoldierSkillID source value/type mismatch at ' + id);
    check(row.SoldierSkillLevelup === expected.SoldierSkillLevelup && Number.isSafeInteger(row.SoldierSkillLevelup),'SoldierSkillLevelup source value/type mismatch at ' + id);
    exactKeys(row.sourceFieldStates,['SoldierSkillID','SoldierSkillLevelup'],'source field states at ' + id);
    for (const field of ['SoldierSkillID','SoldierSkillLevelup']) {
      const state=row.sourceFieldStates[field];
      exactKeys(state,['present','jsonType','integer'],field + ' state at ' + id);
      check(state.present === true && state.jsonType === 'number' && state.integer === true,field + ' source presence/type state mismatch at ' + id);
    }
    check(same(row.provenance,provenance(id)),'record/field provenance mismatch at ' + id);
    projection.push({ID:row.ID,SoldierSkillID:row.SoldierSkillID,SoldierSkillLevelup:row.SoldierSkillLevelup});
  }
  check(same(projection,EXPECTED_ROWS),'raw source projection differs from independently pinned values');
  check(hashJson(projection) === PROJECTION_SHA256,'ordered raw field projection digest mismatch');
  return {recordCount:rows.length,rawFieldCount:rows.length*2,levelInfoIds:IDS,projectionSha256:PROJECTION_SHA256};
}

export function loadAndValidateTrainingTechRawSoldierSkillFields(root=process.cwd()) {
  const evidence=JSON.parse(fs.readFileSync(path.resolve(root,EVIDENCE_PATH),'utf8'));
  return validateTrainingTechRawSoldierSkillFields(evidence);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result=loadAndValidateTrainingTechRawSoldierSkillFields();
  process.stdout.write('TrainingTech raw SoldierSkill fields: PASS (' + result.recordCount + ' records; ' + result.rawFieldCount + ' raw values; projection ' + result.projectionSha256 + ')\n');
}
