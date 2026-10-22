import fs from 'node:fs';
import crypto from 'node:crypto';

const EVIDENCE_PATH = 'evidence/source/configdata/soldier-training-tech-223-descriptions.v1.json';
const CANONICAL_PATH = 'canonical/soldier-training-tech-descriptions.v1.json';
const LEVEL_IDS = [2230, 2231, 2232, 2233, 2234, 2235, 2236, 2237, 2238, 2239];
const TRAINING_TECH_RECORD_SHA256 = '6ff4b793888b1e81fd34404d560b128ec0e38b146683e63c151a318c51750e60';
const LEVEL_RECORDS_SHA256 = 'c9eb7ed97efbcdb36ff3874d9f9221ab79fe00fd4b8ac23207091712c237e13e';
const EXPECTED_SOURCE = {
  repository: 'LuceatLuxVestra42/langrisser-future-guide',
  commit: '6475e63ee23d18adf733756c26a14fa9e3ed662c',
};

function fail(message) {
  throw new Error(message);
}

function exactKeys(value, keys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${label} must be an object`);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) fail(`${label} fields must be exactly ${expected.join(', ')}`);
}

function digest(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export function validate(evidence, canonical, soldiers, spRelations) {
  if (evidence?.schemaVersion !== 1 || evidence?.responsibility !== 'soldier-training-tech-description-source-slice') fail('Unexpected evidence owner/schema');
  if (canonical?.schemaVersion !== 1 || canonical?.responsibility !== 'soldier-training-tech-description-text') fail('Unexpected canonical owner/schema');
  if (JSON.stringify(evidence.scope?.admitted) !== JSON.stringify([
    'Source-native IDs and explicit TrainingTech-to-soldier endpoints',
    'Opaque NORMAL and SP Chinese description strings keyed by source LevelInfo ID',
  ])) fail('Evidence admission boundary changed');
  if (JSON.stringify(evidence.scope?.excluded) !== JSON.stringify([
    'Game-level or slot application',
    'Training progression or unlock conditions',
    'SoldierSkillID or SoldierSkillLevelup relations',
    'Combat formula interpretation',
    'Korean localization',
    'Generated or frontend presentation',
  ])) fail('Evidence exclusion boundary changed');
  if (evidence.interpretation?.normalTextField?.sourceField !== 'Description' || evidence.interpretation.normalTextField.evidenceClass !== 'A') fail('NORMAL text field meaning changed');
  if (evidence.interpretation?.spTextField?.sourceField !== 'SpSoidlierDescription' || evidence.interpretation.spTextField.evidenceClass !== 'B' || !evidence.interpretation.spTextField.meaning.includes('SP slot/application is not established')) fail('SP text field support/limitation changed');
  if (evidence.priorValidation?.validatedProjection?.path !== 'data/generated/soldier-detail-stage5-3.v1.json' || evidence.priorValidation.validatedProjection.gitBlobSha1 !== '61a59e9bb9d51b90fe5d417425f64978e4715667' || evidence.priorValidation.validatedProjection.commit !== EXPECTED_SOURCE.commit) fail('Prior validated projection pin changed');
  if (canonical.scope?.claim !== 'Preserve opaque TrainingTech NORMAL/SP description text for Soldier 115 and related SP Soldier 5115, keyed by source LevelInfo ID.' || JSON.stringify(canonical.scope?.excluded) !== JSON.stringify([
    'Game level or slot assignment',
    'SP level application',
    'Training unlock semantics',
    'Soldier skill relations',
    'Combat mechanics interpretation',
    'Korean localization',
    'Frontend display',
  ])) fail('Canonical semantic boundary changed');
  if (!Array.isArray(evidence.rawLevelInfoRecords) || evidence.rawLevelInfoRecords.length !== 10) fail('Evidence must contain exactly ten selected LevelInfo rows');
  if (digest(evidence.rawTrainingTechRecord) !== TRAINING_TECH_RECORD_SHA256) fail('TrainingTech source slice differs from the reviewed source record');
  if (digest(evidence.rawLevelInfoRecords) !== LEVEL_RECORDS_SHA256) fail('LevelInfo source slice differs from the reviewed source records');

  const tech = evidence.rawTrainingTechRecord;
  exactKeys(tech, ['ID', 'Name', 'SoldierIDRelated', 'TechLevelupInfoList'], 'TrainingTech raw record');
  if (tech.ID !== 223 || tech.Name !== '近卫枪兵') fail('TrainingTech identity mismatch');
  if (JSON.stringify(tech.SoldierIDRelated) !== JSON.stringify([115, 5115])) fail('TrainingTech relation endpoints mismatch');
  if (JSON.stringify(tech.TechLevelupInfoList) !== JSON.stringify(LEVEL_IDS)) fail('TrainingTech LevelInfo links mismatch');

  const techSource = evidence.sources?.trainingTech;
  const levelSource = evidence.sources?.trainingTechLevelInfo;
  for (const [label, source] of [['TrainingTech source', techSource], ['LevelInfo source', levelSource]]) {
    if (source?.repository !== EXPECTED_SOURCE.repository || source?.commit !== EXPECTED_SOURCE.commit) fail(`${label} pin mismatch`);
  }
  if (techSource.path !== 'data/configdata/ConfigDataTrainingTechInfo.json' || techSource.gitBlobSha1 !== 'ad8b290f0e34de24b6eab9538894068a06e086d4' || techSource.locator !== `${techSource.path}#ID=223`) fail('TrainingTech source locator/pin mismatch');
  if (levelSource.path !== 'data/configdata/ConfigDataTrainingTechLevelInfo.json' || levelSource.gitBlobSha1 !== '30789c3e4fb0d79b56514e720bb71a053df78c72' || levelSource.sha256 !== '4d4afb874c0540bf4999cd5aa7c2f8a6ce5d3fa5838a7522c343365e165e8905' || levelSource.sizeBytes !== 1862920 || levelSource.sourcePopulation !== 2945) fail('LevelInfo source pin mismatch');

  evidence.rawLevelInfoRecords.forEach((row, index) => {
    exactKeys(row, ['ID', 'Description', 'SpSoidlierDescription'], `LevelInfo ${index}`);
    if (row.ID !== LEVEL_IDS[index]) fail(`LevelInfo ID order/membership mismatch at ${index}`);
    if (typeof row.Description !== 'string' || !row.Description.trim()) fail(`NORMAL source description missing for ${row.ID}`);
    if (typeof row.SpSoidlierDescription !== 'string' || !row.SpSoidlierDescription.trim()) fail(`SP source description missing for ${row.ID}`);
  });

  if (canonical.scope?.sourceScope !== `Pinned CN ConfigData at ${EXPECTED_SOURCE.commit}`) fail('Canonical source scope mismatch');
  if (!Array.isArray(canonical.records) || canonical.records.length !== 20) fail('Canonical must contain exactly twenty scoped description claims');
  const soldierIds = new Set((soldiers?.records ?? []).filter(r => r.entity === 'Soldier').map(r => `${r.variant}:${r.id}`));
  if (!soldierIds.has('NORMAL:115') || !soldierIds.has('SP:5115')) fail('Canonical Soldier endpoints are not admitted identities');
  const spPairs = new Set((spRelations?.records ?? []).map(r => `${r.spSoldierId}:${r.normalSoldierId}`));
  if (!spPairs.has('5115:115')) fail('SP-to-NORMAL Soldier relation endpoint is not admitted');

  const actualPairs = new Set();
  for (const [index, row] of canonical.records.entries()) {
    exactKeys(row, ['variant', 'soldierId', 'trainingTechId', 'levelInfoId', 'descriptionCn', 'provenance'], `Canonical row ${index}`);
    if (!['NORMAL', 'SP'].includes(row.variant)) fail(`Invalid Soldier variant at canonical row ${index}`);
    const levelIndex = LEVEL_IDS.indexOf(row.levelInfoId);
    if (levelIndex < 0) fail(`Unadmitted LevelInfo ID ${row.levelInfoId}`);
    const expectedSoldier = row.variant === 'NORMAL' ? 115 : 5115;
    if (row.soldierId !== expectedSoldier || row.trainingTechId !== 223) fail(`Unexpected Soldier/TrainingTech endpoint at canonical row ${index}`);
    const key = `${row.variant}:${row.levelInfoId}`;
    if (actualPairs.has(key)) fail(`Duplicate canonical claim ${key}`);
    actualPairs.add(key);
    const raw = evidence.rawLevelInfoRecords[levelIndex];
    const field = row.variant === 'NORMAL' ? 'Description' : 'SpSoidlierDescription';
    if (row.descriptionCn !== raw[field]) fail(`Canonical text differs from ${field} source value at ${key}`);
    exactKeys(row.provenance, ['description', 'soldierRelation', 'levelInfoLink'], `Provenance ${key}`);
    const sourcePath = EVIDENCE_PATH;
    if (row.provenance.description !== `${sourcePath}#ID=${row.levelInfoId}/${field}`) fail(`Description provenance mismatch at ${key}`);
    if (row.provenance.soldierRelation !== `${sourcePath}#ID=223/SoldierIDRelated&contains=${expectedSoldier}`) fail(`Soldier relation provenance mismatch at ${key}`);
    if (row.provenance.levelInfoLink !== `${sourcePath}#ID=223/TechLevelupInfoList&contains=${row.levelInfoId}`) fail(`LevelInfo link provenance mismatch at ${key}`);
  }
  for (const variant of ['NORMAL', 'SP']) {
    for (const id of LEVEL_IDS) if (!actualPairs.has(`${variant}:${id}`)) fail(`Missing ${variant} claim for LevelInfo ${id}`);
  }
  return { levelInfoCount: LEVEL_IDS.length, canonicalClaimCount: canonical.records.length, normalSoldierId: 115, spSoldierId: 5115 };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const evidence = JSON.parse(fs.readFileSync(EVIDENCE_PATH, 'utf8'));
  const canonical = JSON.parse(fs.readFileSync(CANONICAL_PATH, 'utf8'));
  const soldiers = JSON.parse(fs.readFileSync('canonical/soldiers.v1.json', 'utf8'));
  const spRelations = JSON.parse(fs.readFileSync('canonical/sp-soldier-normal-relations.v1.json', 'utf8'));
  const result = validate(evidence, canonical, soldiers, spRelations);
  console.log(`Soldier TrainingTech descriptions valid: ${result.canonicalClaimCount} opaque strings across ${result.levelInfoCount} source records (NORMAL 115 / SP 5115).`);
}
