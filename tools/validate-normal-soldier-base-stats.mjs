import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PINNED = {
  repository: 'LuceatLuxVestra42/langrisser-future-guide',
  commit: '6475e63ee23d18adf733756c26a14fa9e3ed662c',
  sourcePath: 'data/configdata/ConfigDataSoldierInfo.json',
  sourceGitBlobSha1: '23649493c4d4c602e8d990db7bb5fade11747cc3',
  sourceSha256: '8a73b178be5b2f15ebcc84e83741d42e242ea4650f1d590fb2c1bcee8b8bbcc4',
  sourceBytes: 1078582,
  sourceTopLevelRecordCount: 777,
  endpointPath: 'evidence/source/configdata/ConfigDataSoldierInfo.records-sp-soldier-endpoints.v1.json',
  endpointSha256: '0710ba87cd15f205cdcfbbbe89a2662e35b5acb4441fbd7aa3c8ebba223c6b46',
  evidencePath: 'evidence/source/configdata/ConfigDataSoldierInfo.records-normal-soldier-base-stats.v1.json',
  evidenceSha256: '49d58cb7128670a7c65c14076a604ea7fc6fd710dcd3c728ac884af0ff9c7581',
  manifestPath: 'evidence/source/configdata/ConfigDataSoldierInfo.records-normal-soldier-base-stats.source-manifest.v1.json',
  canonicalPath: 'canonical/normal-soldier-base-stats.v1.json',
};
const FIELD_MAP = { HP_INI: 'hp', AT_INI: 'attack', DF_INI: 'defense', MagicDF_INI: 'magicDefense' };
const fail = message => { throw new Error(`NORMAL Soldier base stats validation failed: ${message}`); };
const check = (condition, message) => { if (!condition) fail(message); };
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const exactKeys = (value, keys) => value && typeof value === 'object' && !Array.isArray(value)
  && JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...keys].sort());

export function validateNormalSoldierBaseStats({ soldiers, relations, stats, evidence, endpoints, manifest, endpointSha256, evidenceSha256 }) {
  check(exactKeys(soldiers, ['schemaVersion', 'scope', 'records']) && soldiers.schemaVersion === 1 && Array.isArray(soldiers.records), 'Soldier identity schema mismatch');
  check(exactKeys(relations, ['schemaVersion', 'scope', 'records']) && relations.schemaVersion === 1 && Array.isArray(relations.records), 'relation schema mismatch');
  check(exactKeys(stats, ['schemaVersion', 'scope', 'records']) && stats.schemaVersion === 1 && Array.isArray(stats.records), 'canonical schema mismatch');
  check(stats.scope === 'Raw base stats for the 56 currently admitted NORMAL Soldier endpoints targeted by explicit SP→NORMAL relations; no full NORMAL population or level/growth calculation.', 'canonical scope mismatch');
  check(exactKeys(evidence, ['schemaVersion', 'records']) && evidence.schemaVersion === 1 && Array.isArray(evidence.records), 'claim-scoped evidence schema mismatch');
  check(exactKeys(endpoints, ['records']) && Array.isArray(endpoints.records), 'pinned endpoint evidence schema mismatch');
  check(exactKeys(manifest, ['schemaVersion', 'purpose', 'source', 'artifact', 'claimScope', 'limitation']) && manifest.schemaVersion === 1, 'manifest schema mismatch');
  check(exactKeys(manifest.source, ['repository', 'commit', 'commitDate', 'sourceVersionStatus', 'semanticContentAuthority']), 'manifest source schema mismatch');
  check(exactKeys(manifest.artifact, ['sourcePath', 'sourceGitBlobSha1', 'sourceSha256', 'sourceBytes', 'sourceTopLevelRecordCount', 'preservedEndpointPath', 'preservedEndpointSha256', 'preservedPath', 'preservedSha256', 'selectedTargetIds', 'selectedRecordCount', 'selectedFields', 'extractionRule', 'sourceLocatorSemantics']), 'manifest artifact schema mismatch');
  check(manifest.source.repository === PINNED.repository && manifest.source.commit === PINNED.commit, 'pinned source repository/commit mismatch');
  check(manifest.source.sourceVersionStatus === 'unknown', 'source version status must remain unknown');
  for (const key of ['sourcePath', 'sourceGitBlobSha1', 'sourceSha256', 'sourceBytes', 'sourceTopLevelRecordCount']) check(manifest.artifact[key] === PINNED[key], `pinned source ${key} mismatch`);
  check(manifest.artifact.preservedEndpointPath === PINNED.endpointPath && endpointSha256 === PINNED.endpointSha256 && manifest.artifact.preservedEndpointSha256 === PINNED.endpointSha256, 'endpoint evidence hash/path mismatch');
  check(manifest.artifact.preservedPath === PINNED.evidencePath && evidenceSha256 === PINNED.evidenceSha256 && manifest.artifact.preservedSha256 === PINNED.evidenceSha256, 'selected evidence hash/path mismatch');
  check(JSON.stringify(manifest.artifact.selectedFields) === JSON.stringify(['ID', ...Object.keys(FIELD_MAP)]), 'selected source fields mismatch');
  check(manifest.claimScope === 'Base stats only for the currently admitted NORMAL Soldier target ID set used by current SP→NORMAL relations.', 'claim scope mismatch');
  check(manifest.limitation === 'This evidence supports base stats only for the currently admitted NORMAL Soldier target ID set. It does not establish the full NORMAL Soldier population or other Soldier semantics.', 'manifest limitation mismatch');

  const endpointById = new Map();
  for (const row of endpoints.records) {
    check(Number.isInteger(row.ID) && !endpointById.has(row.ID), `endpoint ID malformed/duplicate: ${row?.ID}`);
    endpointById.set(row.ID, row);
  }
  check(endpoints.records.length === 112 && endpointById.size === 112, 'pinned endpoint evidence population mismatch');
  const identityRows = soldiers.records.filter(row => row.entity === 'Soldier' && row.variant === 'NORMAL');
  const identityIds = identityRows.map(row => row.id);
  check(identityRows.length === 56 && new Set(identityIds).size === 56, 'NORMAL identity endpoint set malformed');
  const targetIds = relations.records.map(row => row.normalSoldierId);
  check(relations.records.length === 56 && targetIds.every(Number.isInteger) && new Set(targetIds).size === 56, 'SP→NORMAL target set malformed or duplicated');
  check(targetIds.every(id => identityIds.includes(id)), 'relation target is not in NORMAL identity owner');
  const sortedTargets = [...targetIds].sort((a, b) => a - b);
  check(JSON.stringify([...identityIds].sort((a, b) => a - b)) === JSON.stringify(sortedTargets), 'NORMAL identity set differs from current relation targets');
  check(JSON.stringify(manifest.artifact.selectedTargetIds) === JSON.stringify(sortedTargets), 'manifest target ID set mismatch');

  const evidenceById = new Map();
  for (const row of evidence.records) {
    check(exactKeys(row, ['ID', ...Object.keys(FIELD_MAP)]) && Number.isInteger(row.ID), `evidence row schema/ID malformed: ${row?.ID}`);
    check(!evidenceById.has(row.ID), `duplicate evidence row ${row.ID}`);
    evidenceById.set(row.ID, row);
  }
  check(evidence.records.length === 56 && evidenceById.size === 56 && JSON.stringify([...evidenceById.keys()].sort((a,b)=>a-b)) === JSON.stringify(sortedTargets), 'claim-scoped evidence ID set mismatch');
  check(manifest.artifact.selectedRecordCount === evidence.records.length, 'manifest selected count mismatch');

  const statById = new Map();
  for (const row of stats.records) {
    check(exactKeys(row, ['entity', 'id', 'variant', 'baseStats', 'provenance']) && row.entity === 'Soldier' && row.variant === 'NORMAL' && Number.isInteger(row.id), `canonical record schema/ID malformed: ${row?.id}`);
    check(exactKeys(row.baseStats, ['hp', 'attack', 'defense', 'magicDefense']), `canonical baseStats schema mismatch for ${row.id}`);
    check(!statById.has(row.id), `duplicate canonical record ${row.id}`);
    statById.set(row.id, row);
  }
  check(stats.records.length === 56 && statById.size === 56 && JSON.stringify([...statById.keys()].sort((a,b)=>a-b)) === JSON.stringify(sortedTargets), 'canonical ID set mismatch');
  check(JSON.stringify(stats.records.map(r=>r.id)) === JSON.stringify(sortedTargets), 'canonical ordering mismatch');
  for (const id of sortedTargets) {
    const raw = evidenceById.get(id); const endpoint = endpointById.get(id); const record = statById.get(id);
    check(endpoint, `pinned source row missing for ${id}`);
    check(raw, `claim-scoped evidence row missing for ${id}`);
    for (const field of Object.keys(FIELD_MAP)) {
      check(typeof endpoint[field] === 'number' && Number.isFinite(endpoint[field]), `source ${field} malformed for ${id}`);
      check(raw[field] === endpoint[field], `evidence ${field} differs from pinned source for ${id}`);
      const canonicalField = FIELD_MAP[field];
      check(typeof record.baseStats[canonicalField] === 'number' && Number.isFinite(record.baseStats[canonicalField]), `canonical ${canonicalField} malformed for ${id}`);
      check(record.baseStats[canonicalField] === raw[field], `canonical ${canonicalField} differs from source for ${id}`);
    }
    check(record.provenance === `${PINNED.evidencePath}#ID=${id}`, `provenance locator mismatch for ${id}`);
  }
  return { targetCount: 56, evidenceCount: evidence.records.length, canonicalCount: stats.records.length, fieldCoverage: Object.fromEntries(Object.values(FIELD_MAP).map(field => [field, 56])) };
}

export async function loadAndValidateNormalSoldierBaseStats(root = process.cwd()) {
  const bytes = async path => readFile(resolve(root, path));
  const json = async path => JSON.parse((await bytes(path)).toString('utf8'));
  const [soldiers, relations, stats, evidence, endpoints, manifest, endpointBytes, evidenceBytes] = await Promise.all([
    json('canonical/soldiers.v1.json'), json('canonical/sp-soldier-normal-relations.v1.json'), json(PINNED.canonicalPath),
    json(PINNED.evidencePath), json(PINNED.endpointPath), json(PINNED.manifestPath), bytes(PINNED.endpointPath), bytes(PINNED.evidencePath),
  ]);
  return validateNormalSoldierBaseStats({ soldiers, relations, stats, evidence, endpoints, manifest, endpointSha256: digest(endpointBytes), evidenceSha256: digest(evidenceBytes) });
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const result = await loadAndValidateNormalSoldierBaseStats();
  process.stdout.write(`NORMAL Soldier base stats: PASS (${result.targetCount} relation endpoints; 4 fields each)\n`);
}
