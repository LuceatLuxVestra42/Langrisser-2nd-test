import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PINNED_COMMIT = '6475e63ee23d18adf733756c26a14fa9e3ed662c';
const fail = (message) => { throw new Error(`Soldier identity validation failed: ${message}`); };
const check = (condition, message) => { if (!condition) fail(message); };
const key = (variant, id) => `${variant}:${id}`;

export function validateSoldierIdentity({ canonical, soldierInfo, spSoldierInfo, manifest }) {
  check(canonical.schemaVersion === 1 && Array.isArray(canonical.records), 'canonical schema mismatch');
  check(canonical.scope === 'Explicitly admitted NORMAL identity endpoints and the full pinned SP Soldier identity population; each SP to NORMAL correspondence is owned by a separate relation canonical.', 'canonical scope mismatch');
  check(Array.isArray(spSoldierInfo.records) && spSoldierInfo.records.length > 0, 'complete SPSoldierInfo evidence missing');
  check(Array.isArray(soldierInfo.records), 'SoldierInfo endpoint evidence missing');

  const sourceSpIds = [];
  const targetIds = [];
  const targetBySp = new Map();
  for (const row of spSoldierInfo.records) {
    check(row && Number.isInteger(row.ID), 'SPSoldierInfo.ID missing or malformed');
    check(Number.isInteger(row.NormalSoliderId), `NormalSoliderId missing or malformed for SP ${row.ID}`);
    check(!targetBySp.has(row.ID), `duplicate SP ID ${row.ID}`);
    sourceSpIds.push(row.ID);
    targetIds.push(row.NormalSoliderId);
    targetBySp.set(row.ID, row.NormalSoliderId);
  }
  const spSet = new Set(sourceSpIds);
  const targetSet = new Set(targetIds);
  check(spSet.size === sourceSpIds.length, 'duplicate SP identity in source evidence');
  check(targetSet.size === targetIds.length, 'duplicate NORMAL target in source population');
  check(spSoldierInfo.records.length === manifest.sourceDerivedPopulation?.recordCount, 'source population count differs from manifest');
  check(spSet.size === manifest.sourceDerivedPopulation?.uniqueSpIdCount, 'unique SP count differs from manifest');
  check(targetSet.size === manifest.sourceDerivedPopulation?.uniqueNormalTargetCount, 'unique NORMAL target count differs from manifest');
  check(spSoldierInfo.records.length === 56 && spSet.size === 56, 'source-derived SP population scope mismatch');

  const requiredEndpointIds = new Set([...spSet, ...targetSet]);
  const endpointCounts = new Map();
  for (const row of soldierInfo.records) {
    check(row && Number.isInteger(row.ID), 'SoldierInfo endpoint evidence has malformed ID');
    endpointCounts.set(row.ID, (endpointCounts.get(row.ID) ?? 0) + 1);
  }
  check(soldierInfo.records.length === requiredEndpointIds.size, 'unexpected or missing SoldierInfo endpoint records');
  for (const id of requiredEndpointIds) check(endpointCounts.get(id) === 1, `SoldierInfo.ID=${id} endpoint must occur exactly once`);
  for (const id of endpointCounts.keys()) check(requiredEndpointIds.has(id), `unexpected SoldierInfo endpoint ID ${id}`);

  check(manifest.source?.repository === 'LuceatLuxVestra42/langrisser-future-guide', 'pinned source repository mismatch');
  check(manifest.source?.commit === PINNED_COMMIT, 'pinned source commit mismatch');
  check(manifest.source?.sourceVersionStatus === 'unknown', 'source version must remain unknown');
  check(manifest.artifacts?.spSoldierInfo?.sourcePath === 'data/configdata/ConfigDataSPSoldierInfo.json', 'SPSoldierInfo source path mismatch');
  check(manifest.artifacts?.spSoldierInfo?.gitBlobSha1 === '93dd784a7de913daa6d72f5df6cf6890a710c58a', 'SPSoldierInfo pinned blob mismatch');
  check(manifest.artifacts?.spSoldierInfo?.repoPreservedPath === 'evidence/source/configdata/ConfigDataSPSoldierInfo.records-all-sp-soldiers.v1.json', 'SPSoldierInfo evidence locator mismatch');
  check(manifest.artifacts?.soldierInfoEndpoints?.sourcePath === 'data/configdata/ConfigDataSoldierInfo.json', 'SoldierInfo source path mismatch');
  check(manifest.artifacts?.soldierInfoEndpoints?.gitBlobSha1 === '23649493c4d4c602e8d990db7bb5fade11747cc3', 'SoldierInfo pinned blob mismatch');
  check(manifest.artifacts?.soldierInfoEndpoints?.repoPreservedPath === 'evidence/source/configdata/ConfigDataSoldierInfo.records-sp-soldier-endpoints.v1.json', 'SoldierInfo evidence locator mismatch');
  check(manifest.artifacts.spSoldierInfo.selector === 'entire top-level source array; no record inclusion or exclusion filter', 'SP evidence is not a full-table extraction');
  check(manifest.artifacts.spSoldierInfo.preservedRecordCount === spSoldierInfo.records.length, 'preserved SP record count mismatch');

  const expected = new Set();
  for (const id of spSet) expected.add(key('SP', id));
  for (const id of targetSet) expected.add(key('NORMAL', id));
  const actual = new Set();
  for (const row of canonical.records) {
    check(row?.entity === 'Soldier' && Number.isInteger(row.id) && ['SP', 'NORMAL'].includes(row.variant), 'malformed canonical Soldier identity');
    const identityKey = key(row.variant, row.id);
    check(!actual.has(identityKey), `duplicate canonical Soldier identity ${identityKey}`);
    actual.add(identityKey);
    check(expected.has(identityKey), `canonical Soldier identity is not source-derived: ${identityKey}`);
    if (row.variant === 'SP') {
      const expectedProvenance = row.id === 5115
        ? 'evidence/source/configdata/ConfigDataSoldierInfo.records-identity-115.v1.json#ID=5115'
        : `evidence/source/configdata/ConfigDataSPSoldierInfo.records-all-sp-soldiers.v1.json#ID=${row.id}/ID`;
      check(row.provenance === expectedProvenance, `SP identity provenance mismatch for ${row.id}`);
    } else {
      const expectedProvenance = row.id === 115
        ? 'evidence/source/configdata/ConfigDataSoldierInfo.records-identity-115.v1.json#ID=115'
        : `evidence/source/configdata/ConfigDataSoldierInfo.records-sp-soldier-endpoints.v1.json#ID=${row.id}`;
      check(row.provenance === expectedProvenance, `NORMAL identity provenance mismatch for ${row.id}`);
    }
  }
  check(actual.size === expected.size && [...expected].every(item => actual.has(item)), 'canonical identity set differs from source-derived SP and NORMAL endpoint sets');
  check(actual.has(key('SP', 5115)) && actual.has(key('NORMAL', 115)), '5115 → 115 regression identities missing');

  return { spIdentityCount: spSet.size, normalEndpointIdentityCount: targetSet.size, totalIdentityCount: actual.size };
}

export async function loadAndValidateSoldierIdentity(root = process.cwd()) {
  const read = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
  const [canonical, soldierInfo, spSoldierInfo, manifest] = await Promise.all([
    read('canonical/soldiers.v1.json'),
    read('evidence/source/configdata/ConfigDataSoldierInfo.records-sp-soldier-endpoints.v1.json'),
    read('evidence/source/configdata/ConfigDataSPSoldierInfo.records-all-sp-soldiers.v1.json'),
    read('evidence/source/configdata/sp-soldier-population.source-manifest.v1.json'),
  ]);
  return validateSoldierIdentity({ canonical, soldierInfo, spSoldierInfo, manifest });
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const result = await loadAndValidateSoldierIdentity();
  process.stdout.write(`Soldier identity population: PASS (${result.spIdentityCount} SP; ${result.normalEndpointIdentityCount} NORMAL endpoints)\\n`);
}
