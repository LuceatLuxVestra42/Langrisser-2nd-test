import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const CANONICAL_PATH = 'canonical/soldier-raw-skill-references.v1.json';
export const SOURCE_EVIDENCE_PATH = 'evidence/source/configdata/ConfigDataSoldierInfo.records-sp-soldier-endpoints.v1.json';
export const SOURCE_MANIFEST_PATH = 'evidence/source/configdata/sp-soldier-population.source-manifest.v1.json';

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
const EXPECTED = [
  { id: 115, variant: 'NORMAL', ids: [60666,60667,60668,60669,60670,60671,60672,60673,60674,60675] },
  { id: 5115, variant: 'SP', ids: [66957,66958,66959,66960,66961,66962,66963,66964,66965,66966] },
];
const EXPECTED_SCOPE = {
  claim: "Preserve the ordered raw integer values of Skills_ID from each named Soldier's own ConfigDataSoldierInfo record.",
  sourceScope: 'Pinned CN ConfigData at 6475e63ee23d18adf733756c26a14fa9e3ed662c',
  excluded: [
    'Skill target identity or target record existence',
    'Soldier-to-Skill relation semantics',
    'Skill names, descriptions, effects, or levels',
    'Mapping array positions to game levels',
    'NORMAL/SP Skill correspondence',
    'TrainingTech SoldierSkillID joins',
    'Battle mechanics and Korean localization',
    'Other Soldier records',
  ],
};
const fail = message => { throw new Error(`Soldier raw Skills_ID validation failed: ${message}`); };
const check = (condition, message) => { if (!condition) fail(message); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function exactKeys(value, keys, label) {
  check(value && typeof value === 'object' && !Array.isArray(value), `${label} must be an object`);
  check(same(Object.keys(value).sort(), [...keys].sort()), `${label} has unexpected or missing fields`);
}
function sourceLocator(id) { return `${SOURCE_EVIDENCE_PATH}#ID=${id}`; }
function fieldLocator(id) { return `${sourceLocator(id)}/Skills_ID`; }

export function validateSoldierRawSkillReferences({
  canonical, sourceEvidence, sourceEvidenceSha256, sourceManifest,
  soldiers, relations,
}) {
  check(sourceEvidenceSha256 === PINNED.endpointSha256, 'preserved SoldierInfo endpoint evidence SHA-256 mismatch');
  check(sourceManifest.schemaVersion === 1
    && sourceManifest.source?.repository === PINNED.repository
    && sourceManifest.source?.commit === PINNED.commit
    && sourceManifest.source?.semanticContentAuthority === 'PINNED_UNITYDATATOOL_PARSED_CONFIGDATA_SNAPSHOT'
    && sourceManifest.source?.sourceVersionStatus === 'unknown',
  'pinned SoldierInfo source manifest identity/scope mismatch');
  const anchor = sourceManifest.artifacts?.soldierInfoEndpoints;
  check(anchor?.sourcePath === PINNED.sourcePath
    && anchor.repoPreservedPath === PINNED.endpointPath
    && anchor.gitBlobSha1 === PINNED.sourceGitBlobSha1
    && anchor.sha256 === PINNED.sourceSha256
    && anchor.bytes === PINNED.sourceBytes
    && anchor.sourceTableTopLevelRecordCount === PINNED.sourceTopLevelRecordCount
    && anchor.selectedRecordCount === PINNED.endpointCount
    && anchor.exactSingleRecordPerEndpoint === true,
  'SoldierInfo source blob/digest/selection anchor mismatch');

  check(Array.isArray(sourceEvidence.records) && sourceEvidence.records.length === PINNED.endpointCount,
    'preserved SoldierInfo endpoint evidence count mismatch');
  const evidenceIds = new Set();
  const sourceById = new Map();
  for (const row of sourceEvidence.records) {
    check(row && Number.isSafeInteger(row.ID), 'source endpoint ID missing or malformed');
    check(!evidenceIds.has(row.ID), `duplicate source Soldier ID=${row.ID}`);
    evidenceIds.add(row.ID);
    if (EXPECTED.some(item => item.id === row.ID)) sourceById.set(row.ID, row);
  }
  check(sourceById.size === EXPECTED.length, 'source evidence must contain exact Soldier IDs 115 and 5115');
  for (const item of EXPECTED) {
    const row = sourceById.get(item.id);
    check(Object.hasOwn(row, 'Skills_ID'), `source field absent: ID=${item.id}/Skills_ID`);
    check(Array.isArray(row.Skills_ID), `source Skills_ID must be a JSON array at ID=${item.id}`);
    check(row.Skills_ID.length === item.ids.length, `source Skills_ID length mismatch at ID=${item.id}`);
    check(row.Skills_ID.every(Number.isSafeInteger), `source Skills_ID must contain JSON integers at ID=${item.id}`);
    check(same(row.Skills_ID, item.ids), `pinned source Skills_ID values/order/type mismatch at ID=${item.id}`);
    check(new Set(row.Skills_ID).size === row.Skills_ID.length, `duplicate Skills_ID reference at ID=${item.id}`);
  }

  exactKeys(canonical, ['schemaVersion','responsibility','scope','source','records'], 'raw Skill Reference canonical');
  check(canonical.schemaVersion === 1 && canonical.responsibility === 'soldier-raw-skill-references',
    'raw Skill Reference canonical owner/schema mismatch');
  check(same(canonical.scope, EXPECTED_SCOPE), 'raw Skill Reference claim scope/exclusions changed');
  const expectedSource = {
    repository: PINNED.repository, commit: PINNED.commit, sourcePath: PINNED.sourcePath,
    gitBlobSha1: PINNED.sourceGitBlobSha1, sha256: PINNED.sourceSha256, sourceVersionStatus: 'unknown',
  };
  check(same(canonical.source, expectedSource), 'raw Skill Reference Source provenance mismatch');
  check(Array.isArray(canonical.records) && canonical.records.length === EXPECTED.length,
    'raw Skill Reference canonical must contain exactly two Soldier records');
  for (let i = 0; i < EXPECTED.length; i++) {
    const item = EXPECTED[i], row = canonical.records[i], sourceRow = sourceById.get(item.id);
    exactKeys(row, ['entity','id','variant','sourceField','rawReferenceIds','provenance'], `canonical Soldier ${item.id}`);
    check(row.entity === 'Soldier' && row.id === item.id && row.variant === item.variant,
      `canonical Soldier ID/variant mismatch at ${item.id}`);
    check(row.sourceField === 'Skills_ID', `canonical Source Field mismatch at ${item.id}`);
    check(Array.isArray(row.rawReferenceIds) && row.rawReferenceIds.length === 10
      && row.rawReferenceIds.every(Number.isSafeInteger),
    `canonical raw reference must be ten JSON integers at ${item.id}`);
    check(same(row.rawReferenceIds, sourceRow.Skills_ID), `canonical raw Skills_ID values/order/type differ from Source at ${item.id}`);
    exactKeys(row.provenance, ['sourceRecord','sourceField'], `canonical provenance for Soldier ${item.id}`);
    check(row.provenance.sourceRecord === sourceLocator(item.id)
      && row.provenance.sourceField === fieldLocator(item.id),
    `canonical Source Record/Field locator mismatch at ${item.id}`);
  }

  // Raw references do not consume Skill identity, growth, or other independent owners.
  check(soldiers?.schemaVersion === 1 && Array.isArray(soldiers.records),
    'Soldier identity owner/schema missing');
  for (const item of EXPECTED) {
    const endpoints = soldiers.records.filter(r => r.entity === 'Soldier' && r.id === item.id);
    check(endpoints.length === 1 && endpoints[0].variant === item.variant,
      `existing Soldier identity/variant endpoint mismatch at ${item.id}`);
  }
  check(relations?.schemaVersion === 1 && Array.isArray(relations.records)
    && relations.records.filter(r => r.spSoldierId === 5115).length === 1
    && relations.records.find(r => r.spSoldierId === 5115).normalSoldierId === 115,
  'existing explicit SP 5115 to NORMAL 115 relation changed');
  return { soldierRecordCount: canonical.records.length, referenceIdCount: canonical.records.reduce((n,r)=>n+r.rawReferenceIds.length,0), sourceEvidenceCount: sourceEvidence.records.length };
}

export function loadAndValidateSoldierRawSkillReferences(root = process.cwd()) {
  const readBytes = relative => fs.readFileSync(path.resolve(root, relative));
  const read = relative => JSON.parse(readBytes(relative).toString('utf8'));
  const evidenceBytes = readBytes(SOURCE_EVIDENCE_PATH);
  return validateSoldierRawSkillReferences({
    canonical: read(CANONICAL_PATH),
    sourceEvidence: JSON.parse(evidenceBytes.toString('utf8')),
    sourceEvidenceSha256: hash(evidenceBytes),
    sourceManifest: read(SOURCE_MANIFEST_PATH),
    soldiers: read('canonical/soldiers.v1.json'),
    relations: read('canonical/sp-soldier-normal-relations.v1.json'),
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = loadAndValidateSoldierRawSkillReferences();
  process.stdout.write(`Soldier raw Skills_ID references: PASS (${result.soldierRecordCount} Soldiers; ${result.referenceIdCount} opaque IDs; no Skill Targets or relations admitted)\n`);
}
