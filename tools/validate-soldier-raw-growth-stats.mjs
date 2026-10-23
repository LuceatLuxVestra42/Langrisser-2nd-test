import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const CANONICAL_PATH = 'canonical/soldier-raw-growth-stats.v1.json';
export const SOURCE_EVIDENCE_PATH = 'evidence/source/configdata/ConfigDataSoldierInfo.records-sp-soldier-endpoints.v1.json';
export const SOURCE_MANIFEST_PATH = 'evidence/source/configdata/sp-soldier-population.source-manifest.v1.json';

const EXPECTED_IDS = [115, 5115];
const FIELDS = ['HP_UP', 'AT_UP', 'DF_UP', 'MagicDF_UP'];
const PINNED = {
  repository: 'LuceatLuxVestra42/langrisser-future-guide',
  commit: '6475e63ee23d18adf733756c26a14fa9e3ed662c',
  sourcePath: 'data/configdata/ConfigDataSoldierInfo.json',
  sourceGitBlobSha1: '23649493c4d4c602e8d990db7bb5fade11747cc3',
  sourceSha256: '8a73b178be5b2f15ebcc84e83741d42e242ea4650f1d590fb2c1bcee8b8bbcc4',
  sourceBytes: 1078582,
  sourceTopLevelRecordCount: 777,
  endpointPath: SOURCE_EVIDENCE_PATH,
  endpointSha256: '0710ba87cd15f205cdcfbbbe89a2662e35b5acb4441fbd7aa3c8ebba223c6b46',
  endpointCount: 112,
};
const SOURCE_PROJECTION_SHA256 = 'acf1ddc7e8add32530f4f44bf5c686eabfc54a0e930b1ea3f509d2383b0865fb';
const EXPECTED_VARIANTS = { 115: 'NORMAL', 5115: 'SP' };
const EXPECTED_STATS = {
  115: { hp: 43, attack: 40, defense: 23, magicDefense: 17 },
  5115: { hp: 46, attack: 40, defense: 23, magicDefense: 20 },
};
const fail = message => { throw new Error(`Soldier raw growth stats validation failed: ${message}`); };
const check = (condition, message) => { if (!condition) fail(message); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function exactKeys(value, keys, label) {
  check(value && typeof value === 'object' && !Array.isArray(value), `${label} must be an object`);
  check(same(Object.keys(value).sort(), [...keys].sort()), `${label} has unexpected or missing fields`);
}
function sourceType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}
function sourceLocator(id, field) {
  return `${SOURCE_EVIDENCE_PATH}#ID=${id}/${field}`;
}
function recordLocator(id) {
  return `${SOURCE_EVIDENCE_PATH}#ID=${id}`;
}

export function validateSoldierRawGrowthStats({
  canonical, sourceEvidence, sourceEvidenceSha256, sourceManifest, soldiers, relations,
  normalStats, spStats, bfMovePoints, heroSoldierRelations, trainingDescriptions, trainingCosts,
}) {
  check(sourceEvidenceSha256 === PINNED.endpointSha256, 'preserved SoldierInfo endpoint evidence SHA-256 mismatch');
  check(sourceManifest.schemaVersion === 1
    && sourceManifest.source?.repository === PINNED.repository
    && sourceManifest.source?.commit === PINNED.commit
    && sourceManifest.source?.semanticContentAuthority === 'PINNED_UNITYDATATOOL_PARSED_CONFIGDATA_SNAPSHOT'
    && sourceManifest.source?.sourceVersionStatus === 'unknown', 'pinned SoldierInfo source manifest identity/scope mismatch');
  const sourceAnchor = sourceManifest.artifacts?.soldierInfoEndpoints;
  check(sourceAnchor?.sourcePath === PINNED.sourcePath
    && sourceAnchor.repoPreservedPath === PINNED.endpointPath
    && sourceAnchor.gitBlobSha1 === PINNED.sourceGitBlobSha1
    && sourceAnchor.sha256 === PINNED.sourceSha256
    && sourceAnchor.bytes === PINNED.sourceBytes
    && sourceAnchor.sourceTableTopLevelRecordCount === PINNED.sourceTopLevelRecordCount
    && sourceAnchor.selectedRecordCount === PINNED.endpointCount
    && sourceAnchor.exactSingleRecordPerEndpoint === true,
  'SoldierInfo source blob/digest/selection anchor mismatch');

  check(Array.isArray(sourceEvidence.records) && sourceEvidence.records.length === PINNED.endpointCount,
    'complete preserved SoldierInfo endpoint evidence is missing');
  const sourceRows = new Map();
  for (const row of sourceEvidence.records) {
    if (EXPECTED_IDS.includes(row.ID)) {
      check(!sourceRows.has(row.ID), `duplicate source Soldier ID=${row.ID}`);
      sourceRows.set(row.ID, row);
    }
  }
  check(sourceRows.size === EXPECTED_IDS.length, 'source evidence must contain exactly the two selected Soldier IDs');
  const projection = EXPECTED_IDS.map(id => {
    const row = sourceRows.get(id);
    const values = {};
    for (const field of FIELDS) {
      check(Object.hasOwn(row, field), `source field absent: ID=${id}/${field}`);
      check(sourceType(row[field]) === 'number', `source field JSON type is not number: ID=${id}/${field}`);
      check(Number.isSafeInteger(row[field]), `source field is not a safe source integer: ID=${id}/${field}`);
      values[field] = row[field];
    }
    return { ID: id, fields: values };
  });
  check(hash(JSON.stringify(projection)) === SOURCE_PROJECTION_SHA256, 'selected source _UP value/type projection digest mismatch');

  exactKeys(canonical, ['schemaVersion', 'responsibility', 'scope', 'source', 'records'], 'raw growth canonical');
  check(canonical.schemaVersion === 1 && canonical.responsibility === 'soldier-raw-growth-stats',
    'raw growth canonical owner/schema mismatch');
  const expectedScope = {
    claim: 'Preserve the four raw _UP numeric fields from each named Soldier\'s own ConfigDataSoldierInfo record.',
    sourceScope: `Pinned CN ConfigData at ${PINNED.commit}`,
    excluded: ['Growth application formula','Per-level increase interpretation','Final Soldier stats','Rank or level modifiers','TrainingTech effects','NORMAL/SP difference calculations','Other Soldier records'],
  };
  check(same(canonical.scope, expectedScope), 'raw growth canonical scope/exclusions changed');
  const expectedSource = {
    repository: PINNED.repository, commit: PINNED.commit, sourcePath: PINNED.sourcePath,
    gitBlobSha1: PINNED.sourceGitBlobSha1, sha256: PINNED.sourceSha256, sourceVersionStatus: 'unknown',
  };
  check(same(canonical.source, expectedSource), 'raw growth canonical Source provenance mismatch');
  check(Array.isArray(canonical.records) && canonical.records.length === EXPECTED_IDS.length,
    'raw growth canonical must contain exactly two Soldier records');

  for (let i = 0; i < EXPECTED_IDS.length; i++) {
    const id = EXPECTED_IDS[i], sourceRow = sourceRows.get(id), row = canonical.records[i];
    exactKeys(row, ['entity','id','variant','rawFields','provenance'], `canonical Soldier ${id}`);
    check(row.entity === 'Soldier' && row.id === id && row.variant === EXPECTED_VARIANTS[id],
      `canonical Soldier ID/variant mismatch at ${id}`);
    exactKeys(row.rawFields, FIELDS, `canonical raw fields for Soldier ${id}`);
    exactKeys(row.provenance, ['sourceRecord','fields'], `canonical provenance for Soldier ${id}`);
    check(row.provenance.sourceRecord === recordLocator(id), `canonical source record locator mismatch at ${id}`);
    exactKeys(row.provenance.fields, FIELDS, `canonical field provenance for Soldier ${id}`);
    for (const field of FIELDS) {
      check(typeof row.rawFields[field] === 'number' && Number.isSafeInteger(row.rawFields[field]),
        `canonical ${field} must remain a source JSON integer at ID=${id}`);
      check(row.rawFields[field] === sourceRow[field], `canonical ${field} value/type differs from pinned source at ID=${id}`);
      check(row.provenance.fields[field] === sourceLocator(id, field),
        `canonical ${field} provenance locator mismatch at ID=${id}`);
    }
  }

  check(soldiers?.schemaVersion === 1 && soldiers.records.length === 112, 'existing Soldier identity population changed');
  for (const id of EXPECTED_IDS) {
    check(soldiers.records.filter(r => r.entity === 'Soldier' && r.id === id && r.variant === EXPECTED_VARIANTS[id]).length === 1,
      `existing Soldier identity/variant endpoint mismatch at ${id}`);
  }
  check(relations?.schemaVersion === 1 && relations.records.length === 56
    && relations.records.filter(r => r.spSoldierId === 5115 && r.normalSoldierId === 115).length === 1,
  'existing explicit SP 5115 to NORMAL 115 relation changed');

  check(normalStats?.records?.length === 56 && spStats?.records?.length === 56,
    'existing NORMAL/SP base stats population changed');
  for (const [id, stats] of Object.entries(EXPECTED_STATS)) {
    const owner = Number(id) === 115 ? normalStats : spStats;
    const record = owner.records.find(r => r.id === Number(id) && r.variant === EXPECTED_VARIANTS[id]);
    check(record && same(record.baseStats, stats), `existing base stats endpoint changed at Soldier ${id}`);
  }
  check(bfMovePoints?.records?.length === 112, 'existing Soldier BF_MovePoint population changed');
  check(heroSoldierRelations?.records?.length === 379, 'existing Hero-Soldier relation population changed');
  check(trainingDescriptions?.records?.length === 20, 'existing TrainingTech description population changed');
  check(trainingCosts?.records?.length === 10, 'existing TrainingTech cost population changed');
  return { soldierRecordCount: canonical.records.length, rawFieldCount: EXPECTED_IDS.length * FIELDS.length, sourceEvidenceCount: sourceEvidence.records.length };
}

export async function loadAndValidateSoldierRawGrowthStats(root = process.cwd()) {
  const readBytes = relative => fs.readFileSync(path.resolve(root, relative));
  const read = relative => JSON.parse(readBytes(relative).toString('utf8'));
  const sourceBytes = readBytes(SOURCE_EVIDENCE_PATH);
  return validateSoldierRawGrowthStats({
    canonical: read(CANONICAL_PATH),
    sourceEvidence: JSON.parse(sourceBytes.toString('utf8')),
    sourceEvidenceSha256: hash(sourceBytes),
    sourceManifest: read(SOURCE_MANIFEST_PATH),
    soldiers: read('canonical/soldiers.v1.json'),
    relations: read('canonical/sp-soldier-normal-relations.v1.json'),
    normalStats: read('canonical/normal-soldier-base-stats.v1.json'),
    spStats: read('canonical/sp-soldier-base-stats.v1.json'),
    bfMovePoints: read('canonical/soldier-bf-move-points.v1.json'),
    heroSoldierRelations: read('canonical/hero-soldier-relations.v1.json'),
    trainingDescriptions: read('canonical/soldier-training-tech-descriptions.v1.json'),
    trainingCosts: read('canonical/soldier-training-tech-level-costs.v1.json'),
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await loadAndValidateSoldierRawGrowthStats();
  process.stdout.write(`Soldier raw growth stats: PASS (${result.soldierRecordCount} Soldiers; ${result.rawFieldCount} source fields)\n`);
}
