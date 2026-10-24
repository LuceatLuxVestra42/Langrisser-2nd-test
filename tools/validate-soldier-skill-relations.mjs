import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

export const CANONICAL_PATH = 'canonical/soldier-skill-relations.v1.json';
export const CONTRACT_EVIDENCE_PATH = 'evidence/source/configdata/ConfigDataSoldierInfo.skill-direct-reference-contract-115-5115.v1.json';
const RAW_REFERENCE_PATH = 'canonical/soldier-raw-skill-references.v1.json';
const SOLDIER_IDENTITY_PATH = 'canonical/soldiers.v1.json';
const SOLDIER_RELATION_PATH = 'canonical/sp-soldier-normal-relations.v1.json';
const SKILL_IDENTITY_PATH = 'canonical/skills.v1.json';
const PINNED_EVIDENCE_SHA256 = '4b9a698b7dc003bcd0d82263d9ce0dd4111dc9535a8f6aa8843819ac4f913a96';
const PINNED_SOURCE = {
  repository: 'LuceatLuxVestra42/langrisser-future-guide',
  commit: '6475e63ee23d18adf733756c26a14fa9e3ed662c',
  contract: {
    path: 'data/contracts/configdata-lookup-stage2-forward-join-contract.v1.json',
    gitBlobSha1: 'c4e54bb1d14c0f568fe6200d47366bcb2dfa6e7a',
    key: 'soldier.skills',
  },
  forwardIndex: {
    path: 'data/index/forward/soldier.v1.json',
    gitBlobSha1: '9fbaf842b5b1afa11fa2d4c9aa86d3502e6c5e2b',
    relationLocator: 'relations[name=soldier.skills]',
  },
  validationSummary: {
    path: 'data/validation/configdata-lookup-stage2-summary.v1.json',
    gitBlobSha1: '02bcc746ff17db29491bb7289985f7bb67dec3a7',
    status: 'PASS_CONFIGDATA_LOOKUP_STAGE2_FORWARD_JOINS',
  },
  sourceSnapshots: {
    soldierInfo: {
      path: 'data/configdata/ConfigDataSoldierInfo.json',
      sha256: '8a73b178be5b2f15ebcc84e83741d42e242ea4650f1d590fb2c1bcee8b8bbcc4',
      recordCount: 777,
    },
    skillInfo: {
      path: 'data/configdata/ConfigDataSkillInfo.json',
      sha256: '2ff6d67e8c010037597928bccd2dc7b4b9abc0d2a78c9705d816c8218df3e741',
      recordCount: 27198,
    },
  },
};
const SOURCE_IDS = [115, 5115];
const EXPECTED_VARIANTS = new Map([[115, 'NORMAL'], [5115, 'SP']]);
const RAW_FIELD_LOCATORS = new Map([
  [115, 'evidence/source/configdata/ConfigDataSoldierInfo.records-sp-soldier-endpoints.v1.json#ID=115/Skills_ID'],
  [5115, 'evidence/source/configdata/ConfigDataSoldierInfo.records-sp-soldier-endpoints.v1.json#ID=5115/Skills_ID'],
]);
const contract = {
  name: 'soldier.skills', domain: 'Soldier', sourceType: 'Soldier', sourcePrimaryKey: 'ID',
  sourceField: 'Skills_ID', cardinality: 'MANY', targetType: 'Skill',
  semanticStatus: 'RAW_DIRECT_REFERENCE', missingPositiveTarget: 'FAIL', wrongFieldShape: 'FAIL',
};
const excluded = [
  'Other Soldier references', 'TrainingTech SoldierSkillID references', 'Skill effects or mechanics',
  'Game Skill levels or application order', 'NORMAL/SP Skill correspondence',
  'Array index as semantic ordering',
];
const check = (condition, message) => { if (!condition) throw new Error(`Soldier Skill Relation validation failed: ${message}`); };
const exactKeys = (value, keys, label) => check(value && typeof value === 'object' && !Array.isArray(value)
  && isDeepStrictEqual(Object.keys(value).sort(), [...keys].sort()), `${label} fields drift`);
const same = (a, b) => isDeepStrictEqual(a, b);
const edgeKey = (source, target) => `${source}:${target}`;
const compareEdges = (a, b) => a.sourceSoldierId - b.sourceSoldierId || a.targetSkillId - b.targetSkillId;

export function validateSoldierSkillRelations({ relationCanonical, contractEvidence, contractEvidenceSha256, rawReferences, soldiers, spNormalRelations, skills }) {
  check(contractEvidenceSha256 === PINNED_EVIDENCE_SHA256, 'contract evidence SHA-256 differs from the inspected Legacy contract and edge slice');
  exactKeys(contractEvidence, ['schemaVersion', 'responsibility', 'scope', 'source', 'contract', 'extraction', 'selectedEdges'], 'Contract Evidence');
  check(contractEvidence.schemaVersion === 1 && contractEvidence.responsibility === 'soldier-skill-direct-reference-contract-evidence', 'contract evidence owner/schema mismatch');
  exactKeys(contractEvidence.scope, ['claim', 'sourceSoldierIds', 'edgeCount', 'excluded'], 'Contract Evidence scope');
  check(contractEvidence.scope.claim === 'The pinned SoldierInfo Skills_ID fields for Soldier 115 and 5115 directly reference the listed Skill targets.'
    && same(contractEvidence.scope.sourceSoldierIds, SOURCE_IDS) && contractEvidence.scope.edgeCount === 20
    && same(contractEvidence.scope.excluded, excluded), 'contract evidence scope drift');
  check(same(contractEvidence.source, PINNED_SOURCE), 'Legacy contract, index, summary, or source snapshot anchor drift');
  exactKeys(contractEvidence.contract, Object.keys(contract), 'Legacy relation contract');
  check(same(contractEvidence.contract, contract), 'Legacy soldier.skills relation contract drift');
  exactKeys(contractEvidence.extraction, ['method', 'legacyPopulationContext', 'edgeCount', 'outputIdEncoding', 'sourceOrderMeaning'], 'contract evidence extraction');
  check(contractEvidence.extraction.method === 'Filter the committed Stage 2 Soldier forward index relation by source IDs 115 and 5115; retain explicit sourceId-targetId pairs.'
    && same(contractEvidence.extraction.legacyPopulationContext, { sourceSoldierRecords: 777, sourceRecordsWithEdges: 647, totalEdges: 2465 })
    && contractEvidence.extraction.edgeCount === 20
    && contractEvidence.extraction.outputIdEncoding === 'The Stage 2 index represents normalized positive integer IDs as decimal strings, per the pinned Stage 2 relationPolicy.referenceEncoding.'
    && contractEvidence.extraction.sourceOrderMeaning === 'Not represented in this relation evidence; the source array order remains owned by the raw Skills_ID Canonical.',
  'contract evidence extraction scope or ordering boundary drift');

  exactKeys(rawReferences, ['schemaVersion', 'responsibility', 'scope', 'source', 'records'], 'raw Soldier Skill references');
  check(rawReferences.schemaVersion === 1 && rawReferences.responsibility === 'soldier-raw-skill-references'
    && rawReferences.source?.commit === PINNED_SOURCE.commit, 'raw Soldier reference owner/source drift');
  check(Array.isArray(rawReferences.records), 'raw Soldier reference records missing');
  const rawById = new Map();
  for (const row of rawReferences.records.filter(row => SOURCE_IDS.includes(row?.id))) {
    check(row && row.entity === 'Soldier' && Number.isSafeInteger(row.id) && !rawById.has(row.id), 'duplicate or malformed raw Soldier reference record');
    check(row.variant === EXPECTED_VARIANTS.get(row.id) && row.sourceField === 'Skills_ID', `raw Soldier variant/field mismatch at ${row.id}`);
    check(Array.isArray(row.rawReferenceIds) && row.rawReferenceIds.length === 10 && row.rawReferenceIds.every(Number.isSafeInteger), `raw Skills_ID must have ten integer references at ${row.id}`);
    check(new Set(row.rawReferenceIds).size === row.rawReferenceIds.length, `duplicate raw Skill reference at ${row.id}`);
    check(row.provenance?.sourceField === RAW_FIELD_LOCATORS.get(row.id), `raw Skills_ID provenance mismatch at ${row.id}`);
    rawById.set(row.id, row);
  }
  check(SOURCE_IDS.every(id => rawById.has(id)), 'raw Soldier reference endpoint missing');

  check(Array.isArray(contractEvidence.selectedEdges) && contractEvidence.selectedEdges.length === 20, 'Legacy selected edge slice must have exactly 20 edges');
  const sourceEvidencePairs = new Set();
  const evidenceBySource = new Map(SOURCE_IDS.map(id => [id, []]));
  for (const edge of contractEvidence.selectedEdges) {
    exactKeys(edge, ['sourceId', 'targetId', 'legacyLocator'], 'Legacy selected edge');
    check(typeof edge.sourceId === 'string' && /^\d+$/.test(edge.sourceId) && typeof edge.targetId === 'string' && /^\d+$/.test(edge.targetId), 'Legacy index edge IDs must retain decimal-string encoding');
    const sourceId = Number(edge.sourceId), targetId = Number(edge.targetId);
    check(Number.isSafeInteger(sourceId) && Number.isSafeInteger(targetId) && String(sourceId) === edge.sourceId && String(targetId) === edge.targetId && SOURCE_IDS.includes(sourceId), 'malformed or out-of-scope Legacy edge');
    const key = edgeKey(sourceId, targetId);
    check(edge.legacyLocator === `${PINNED_SOURCE.forwardIndex.path}#${PINNED_SOURCE.forwardIndex.relationLocator}&sourceId=${sourceId}&targetId=${targetId}`, `Legacy forward edge locator mismatch ${key}`);
    check(!sourceEvidencePairs.has(key), `duplicate Legacy edge ${key}`);
    sourceEvidencePairs.add(key);
    evidenceBySource.get(sourceId).push(targetId);
  }
  check(SOURCE_IDS.every(id => evidenceBySource.get(id).length === 10), 'Legacy edge slice must contain ten edges per Soldier');
  for (const id of SOURCE_IDS) {
    const rawSet = new Set(rawById.get(id).rawReferenceIds);
    const evidenceSet = new Set(evidenceBySource.get(id));
    check(rawSet.size === 10 && evidenceSet.size === 10 && [...rawSet].every(target => evidenceSet.has(target)), `Legacy direct edges differ from raw Skills_ID at ${id}`);
  }

  exactKeys(soldiers, ['schemaVersion', 'scope', 'records'], 'Soldier identity Canonical');
  check(soldiers.schemaVersion === 1 && Array.isArray(soldiers.records), 'Soldier identity Canonical schema invalid');
  for (const id of SOURCE_IDS) {
    const endpoint = soldiers.records.filter(row => row.entity === 'Soldier' && row.id === id);
    check(endpoint.length === 1 && endpoint[0].variant === EXPECTED_VARIANTS.get(id), `Soldier identity endpoint missing/ambiguous at ${id}`);
  }
  check(spNormalRelations?.schemaVersion === 1 && Array.isArray(spNormalRelations.records)
    && spNormalRelations.records.filter(row => row.spSoldierId === 5115).length === 1
    && spNormalRelations.records.find(row => row.spSoldierId === 5115).normalSoldierId === 115,
  'existing SP 5115 -> NORMAL 115 relation is missing or ambiguous');
  check(skills?.schemaVersion === 1 && Array.isArray(skills.records), 'Skill Identity owner/schema missing');
  // The Skill owner admits its population; this relation needs only its selected endpoints.
  for (const edge of contractEvidence.selectedEdges) {
    check(skills.records.filter(row => row.skillId === Number(edge.targetId)).length === 1,
      `Skill Identity endpoint missing/ambiguous ${edge.targetId}`);
  }

  exactKeys(relationCanonical, ['schemaVersion', 'responsibility', 'scope', 'relationType', 'cardinality', 'contractEvidence', 'records'], 'Soldier Skill Relation Canonical');
  check(relationCanonical.schemaVersion === 1 && relationCanonical.responsibility === 'soldier-skill-relations'
    && relationCanonical.relationType === 'RAW_DIRECT_REFERENCE' && relationCanonical.cardinality === 'MANY', 'relation owner/schema/type/cardinality drift');
  exactKeys(relationCanonical.scope, ['claim', 'sourceScope', 'sourceSoldierIds', 'edgeCount', 'excluded'], 'Relation Canonical scope');
  check(relationCanonical.scope.claim === 'Admit only the source-direct Soldier-to-Skill references selected from SoldierInfo Skills_ID for Soldier 115 and 5115.'
    && relationCanonical.scope.sourceScope === `CN ConfigData and verified Legacy Stage 2 contract at ${PINNED_SOURCE.commit}`
    && same(relationCanonical.scope.sourceSoldierIds, SOURCE_IDS) && relationCanonical.scope.edgeCount === 20
    && same(relationCanonical.scope.excluded, excluded), 'relation Canonical scope drift');
  check(relationCanonical.contractEvidence === `${CONTRACT_EVIDENCE_PATH}#contract=name:soldier.skills`, 'relation contract evidence locator mismatch');
  check(Array.isArray(relationCanonical.records) && relationCanonical.records.length === 20, 'relation Canonical must contain exactly 20 edges');
  const actualEdges = [];
  const actualPairs = new Set();
  for (const row of relationCanonical.records) {
    exactKeys(row, ['sourceSoldierId', 'targetSkillId', 'sourceField', 'provenance'], 'Relation Edge');
    check(Number.isSafeInteger(row.sourceSoldierId) && Number.isSafeInteger(row.targetSkillId)
      && row.sourceField === 'Skills_ID' && SOURCE_IDS.includes(row.sourceSoldierId), 'malformed or out-of-scope relation edge');
    exactKeys(row.provenance, ['sourceField', 'contract'], `Relation edge provenance ${row.sourceSoldierId}:${row.targetSkillId}`);
    check(row.provenance.sourceField === rawById.get(row.sourceSoldierId).provenance.sourceField
      && row.provenance.contract === `${CONTRACT_EVIDENCE_PATH}#selectedEdges&sourceId=${row.sourceSoldierId}&targetId=${row.targetSkillId}`, 'relation edge provenance locator mismatch');
    const key = edgeKey(row.sourceSoldierId, row.targetSkillId);
    check(!actualPairs.has(key), `duplicate relation edge ${key}`);
    actualPairs.add(key);
    actualEdges.push({ sourceSoldierId: row.sourceSoldierId, targetSkillId: row.targetSkillId });
  }
  const expectedEdges = contractEvidence.selectedEdges.map(edge => ({ sourceSoldierId: Number(edge.sourceId), targetSkillId: Number(edge.targetId) })).sort(compareEdges);
  check(same(actualEdges, expectedEdges), 'relation Edge Set/order differs from the Legacy contract evidence');
  return { sourceSoldierCount: 2, edgeCount: 20, targetSkillCount: 20, skillIdentityCount: skills.records.length };
}

async function readJson(root, relative) { return JSON.parse(await fs.readFile(path.resolve(root, relative), 'utf8')); }
export async function validateFromRepository(root = process.cwd()) {
  const [relationCanonical, rawReferences, soldiers, spNormalRelations, skills] = await Promise.all([
    readJson(root, CANONICAL_PATH), readJson(root, RAW_REFERENCE_PATH), readJson(root, SOLDIER_IDENTITY_PATH),
    readJson(root, SOLDIER_RELATION_PATH), readJson(root, SKILL_IDENTITY_PATH),
  ]);
  const evidenceBytes = await fs.readFile(path.resolve(root, CONTRACT_EVIDENCE_PATH));
  const contractEvidence = JSON.parse(evidenceBytes.toString('utf8'));
  const contractEvidenceSha256 = crypto.createHash('sha256').update(evidenceBytes).digest('hex');
  return validateSoldierSkillRelations({ relationCanonical, contractEvidence, contractEvidenceSha256, rawReferences, soldiers, spNormalRelations, skills });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await validateFromRepository();
    process.stdout.write(`Soldier-to-Skill direct relations: PASS (${result.sourceSoldierCount} Soldiers; ${result.edgeCount} direct edges; ${result.targetSkillCount} Skill endpoints)\n`);
  } catch (error) {
    console.error(error?.stack ?? error);
    process.exitCode = 1;
  }
}
