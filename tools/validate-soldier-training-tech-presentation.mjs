import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { renderSoldierTrainingTechDescriptions } from './generate.mjs';
import { TRAINING_TECH_DECISION_RECORD_PATH, makeTrainingTechContractEnvelope, validateTrainingTechDecisionRecord } from './soldier-training-tech-presentation-contract.mjs';

const EXPECTED = new Map([
  ['NORMAL', { soldierId: 115, sourceField: 'Description' }],
  ['SP', { soldierId: 5115, sourceField: 'SpSoidlierDescription' }],
]);
const LEVEL_INFO_IDS = [2230, 2231, 2232, 2233, 2234, 2235, 2236, 2237, 2238, 2239];
const SOURCE_REPOSITORY = 'LuceatLuxVestra42/langrisser-future-guide';
const SOURCE_COMMIT = '6475e63ee23d18adf733756c26a14fa9e3ed662c';
const EVIDENCE_PATH = 'evidence/source/configdata/soldier-training-tech-223-descriptions.v1.json';

const fail = (message) => { throw new Error(`Soldier TrainingTech presentation validation failed: ${message}`); };
const check = (condition, message) => { if (!condition) fail(message); };
function exactKeys(value, keys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${label} is not an object`);
  const actual = Object.keys(value).sort();
  const wanted = [...keys].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) fail(`${label} fields mismatch (${actual.join(',')})`);
}

export function validateSoldierTrainingTechPresentation({ canonical, evidence, decisionRecord, generatedText, frontend }) {
  check(canonical?.schemaVersion === 1 && canonical.responsibility === 'soldier-training-tech-description-text', 'unsupported Canonical owner');
  check(canonical.scope?.sourceScope === `Pinned CN ConfigData at ${SOURCE_COMMIT}`, 'Canonical source scope mismatch');
  check(canonical.scope?.excluded?.includes('Downstream presentation eligibility (governed by the effective scoped Presentation Contract)'), 'Canonical downstream eligibility boundary is not reconciled');
  check(canonical.records?.length === 20, 'Canonical claim population must remain 20');
  check(evidence?.responsibility === 'soldier-training-tech-description-source-slice'
    && evidence.scope?.excluded?.includes('Generated or frontend publication authorization (governed by the effective scoped Presentation Contract)'),
  'Evidence publication authorization boundary is not reconciled');
  const decisionState = validateTrainingTechDecisionRecord(decisionRecord);
  check(decisionState.effective && !decisionState.revoked, 'Contract is not effective or has been revoked');
  check(generatedText === renderSoldierTrainingTechDescriptions(canonical, decisionRecord), 'Generated consumer is stale or non-deterministic');
  const generated = JSON.parse(generatedText);
  exactKeys(generated, ['schemaVersion', 'contract', 'source', 'records'], 'Generated envelope');
  check(generated.schemaVersion === 1 && Array.isArray(generated.records), 'Generated schema mismatch');
  exactKeys(generated.contract, ['id', 'version', 'status', 'approved', 'effective', 'decisionRecord', 'decisionIds', 'publicSurfaces'], 'Generated contract envelope');
  check(JSON.stringify(generated.contract) === JSON.stringify(makeTrainingTechContractEnvelope(decisionRecord))
    && generated.contract.status === 'EFFECTIVE' && generated.contract.approved === true && generated.contract.effective === true
    && generated.contract.decisionRecord === TRAINING_TECH_DECISION_RECORD_PATH,
  'Generated Contract envelope does not match the approved and effective Decision Record');
  exactKeys(generated.source, ['repository', 'commit', 'trainingTechPath', 'levelInfoPath'], 'Generated source pin');
  check(generated.source.repository === SOURCE_REPOSITORY && generated.source.commit === SOURCE_COMMIT
    && generated.source.trainingTechPath === 'data/configdata/ConfigDataTrainingTechInfo.json'
    && generated.source.levelInfoPath === 'data/configdata/ConfigDataTrainingTechLevelInfo.json', 'Generated source pin mismatch');

  const canonicalByKey = new Map();
  for (const row of canonical.records) {
    const target = EXPECTED.get(row.variant);
    check(target && row.soldierId === target.soldierId && row.trainingTechId === 223
      && LEVEL_INFO_IDS.includes(row.levelInfoId), `Canonical row outside approved proposal scope: ${row.variant}:${row.soldierId}:${row.levelInfoId}`);
    const key = `${row.variant}:${row.soldierId}:${row.trainingTechId}:${row.levelInfoId}`;
    check(!canonicalByKey.has(key), `duplicate Canonical claim ${key}`);
    exactKeys(row, ['variant', 'soldierId', 'trainingTechId', 'levelInfoId', 'descriptionCn', 'provenance'], `Canonical ${key}`);
    exactKeys(row.provenance, ['description', 'soldierRelation', 'levelInfoLink'], `Canonical provenance ${key}`);
    check(row.provenance.description === `${EVIDENCE_PATH}#ID=${row.levelInfoId}/${target.sourceField}`
      && row.provenance.soldierRelation === `${EVIDENCE_PATH}#ID=223/SoldierIDRelated&contains=${target.soldierId}`
      && row.provenance.levelInfoLink === `${EVIDENCE_PATH}#ID=223/TechLevelupInfoList&contains=${row.levelInfoId}`,
    `Canonical provenance mismatch ${key}`);
    canonicalByKey.set(key, row);
  }
  check(canonicalByKey.size === 20, 'Canonical exact claim set mismatch');

  const generatedByKey = new Map();
  for (const row of generated.records) {
    const target = EXPECTED.get(row.variant);
    check(target && row.soldierId === target.soldierId && row.trainingTechId === 223
      && LEVEL_INFO_IDS.includes(row.levelInfoId) && row.sourceField === target.sourceField,
    `Generated record outside exact ID/Field scope: ${row.variant}:${row.soldierId}:${row.levelInfoId}`);
    const key = `${row.variant}:${row.soldierId}:${row.trainingTechId}:${row.levelInfoId}`;
    check(!generatedByKey.has(key), `duplicate Generated claim ${key}`);
    exactKeys(row, ['variant', 'soldierId', 'trainingTechId', 'levelInfoId', 'sourceField', 'descriptionCn', 'provenance'], `Generated ${key}`);
    exactKeys(row.provenance, ['description', 'soldierRelation', 'levelInfoLink'], `Generated provenance ${key}`);
    const source = canonicalByKey.get(key);
    check(source && source.descriptionCn === row.descriptionCn
      && JSON.stringify(source.provenance) === JSON.stringify(row.provenance), `Generated text or provenance differs from Canonical ${key}`);
    generatedByKey.set(key, row);
  }
  check(generatedByKey.size === 20, 'Generated exact claim set mismatch');
  for (const [variant, target] of EXPECTED) {
    const rows = [...generatedByKey.values()].filter((row) => row.variant === variant);
    check(rows.length === 10 && LEVEL_INFO_IDS.every((id) => rows.some((row) => row.levelInfoId === id)),
      `${variant} must contain the ten exact LevelInfo IDs`);
  }

  check(typeof frontend === 'string'
    && frontend.includes("fetch('./generated/soldier-training-tech-descriptions.v1.json')")
    && frontend.includes("makeSoldierTrainingTechPresentation(soldier, 'NORMAL', soldierTrainingTechDescriptions)")
    && frontend.includes("makeSoldierTrainingTechPresentation(soldier, 'SP', soldierTrainingTechDescriptions)")
    && frontend.includes('row.provenance.description')
    && frontend.includes('row.provenance.soldierRelation')
    && frontend.includes('row.provenance.levelInfoLink'),
  'Frontend consumer path or exact NORMAL/SP card association is missing');
  check(!/\.innerHTML\s*=/.test(frontend), 'Frontend must not interpret source text as HTML');
  return { claimCount: generated.records.length, soldierIds: [115, 5115], levelInfoIds: LEVEL_INFO_IDS, publicationApproved: true, contractEffective: true };
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  const [canonical, evidence, decisionRecord, generatedText, frontend] = await Promise.all([
    readFile(resolve('canonical/soldier-training-tech-descriptions.v1.json'), 'utf8').then(JSON.parse),
    readFile(resolve(EVIDENCE_PATH), 'utf8').then(JSON.parse),
    readFile(resolve(TRAINING_TECH_DECISION_RECORD_PATH), 'utf8').then(JSON.parse),
    readFile(resolve('generated/soldier-training-tech-descriptions.v1.json'), 'utf8'),
    readFile(resolve('app.js'), 'utf8'),
  ]);
  const result = validateSoldierTrainingTechPresentation({ canonical, evidence, decisionRecord, generatedText, frontend });
  process.stdout.write(`Soldier TrainingTech presentation: PASS (${result.claimCount} exact claims; contract approved and effective)\n`);
}
