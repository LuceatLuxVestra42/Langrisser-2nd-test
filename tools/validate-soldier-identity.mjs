import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const PINNED_COMMIT = '6475e63ee23d18adf733756c26a14fa9e3ed662c';
const fail = (message) => { throw new Error(`Soldier identity validation failed: ${message}`); };
const check = (condition, message) => { if (!condition) fail(message); };
const exactKeys = (value, keys, label) => check(
  value && typeof value === 'object' && isDeepStrictEqual(Object.keys(value).sort(), [...keys].sort()),
  `${label} has unexpected or missing fields`,
);

export function validateSoldierIdentity({ canonical, soldierInfo, spSoldierInfo, manifest }) {
  exactKeys(canonical, ['schemaVersion', 'scope', 'records'], 'canonical owner');
  check(canonical.schemaVersion === 1, 'unsupported canonical schema');
  check(canonical.scope === 'Explicitly admitted Soldier identities for this slice; SP variant identity is separate from the NORMAL identity, with correspondence owned by a separate relation canonical.', 'canonical scope drift');
  check(Array.isArray(canonical.records), 'canonical identity records are missing');
  const normalRows = canonical.records.filter((row) => row.entity === 'Soldier' && row.id === 115 && row.variant === 'NORMAL');
  check(normalRows.length === 1, 'scope must contain exactly one admitted NORMAL identity 115');
  const [identity] = normalRows;
  exactKeys(identity, ['entity', 'id', 'variant', 'provenance'], 'canonical record');
  check(identity.entity === 'Soldier' && identity.id === 115 && identity.variant === 'NORMAL', 'canonical identity must exactly match NORMAL Soldier 115');
  check(identity.provenance === 'evidence/source/configdata/ConfigDataSoldierInfo.records-identity-115.v1.json#ID=115', 'canonical identity provenance locator mismatch');

  check(manifest.schemaVersion === 1, 'unsupported source manifest schema');
  check(manifest.source?.repository === 'LuceatLuxVestra42/langrisser-future-guide', 'source repository mismatch');
  check(manifest.source?.commit === PINNED_COMMIT, 'source commit does not match the pinned snapshot');
  check(manifest.source?.sourceVersionStatus === 'unknown', 'unknown source version must remain unknown');
  check(manifest.source?.semanticContentAuthority === 'PINNED_UNITYDATATOOL_PARSED_CONFIGDATA_SNAPSHOT', 'source authority contract mismatch');
  check(manifest.source?.commitTree === '08e1e6c2773730e60b258940e31494f68d65f86a', 'pinned source tree mismatch');
  check(manifest.source?.configDataSubtree === 'b18983f60cb054c2e6e094d64cdb98979211d7fc', 'pinned ConfigData subtree mismatch');
  check(manifest.source?.sourceContract?.commit === '57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff', 'source-pack contract commit mismatch');
  check(manifest.source?.sourceContract?.sha256 === '5ae5443a7533760c9048d04355ad9445bb1f89812c10abced1c23d019d38df4d', 'source-pack contract hash mismatch');
  check(manifest.source?.sourcePack?.archiveSha256 === '65855321776cba9523669a2d486c2edbd2908006cf854572b7a87b0b63405c84', 'pinned source-pack archive digest mismatch');

  const expected = {
    soldierInfo: {
      sourcePath: 'data/configdata/ConfigDataSoldierInfo.json',
      repoPreservedPath: 'evidence/source/configdata/ConfigDataSoldierInfo.records-identity-115.v1.json',
      gitBlobSha1: '23649493c4d4c602e8d990db7bb5fade11747cc3',
      sha256: '8a73b178be5b2f15ebcc84e83741d42e242ea4650f1d590fb2c1bcee8b8bbcc4',
      bytes: 1078582,
      recordLocators: ['top-level record ID=115', 'top-level record ID=5115'],
    },
    spSoldierInfo: {
      sourcePath: 'data/configdata/ConfigDataSPSoldierInfo.json',
      repoPreservedPath: 'evidence/source/configdata/ConfigDataSPSoldierInfo.record-5115.v1.json',
      gitBlobSha1: '93dd784a7de913daa6d72f5df6cf6890a710c58a',
      sha256: 'bec68e5693cbceacf9d9d23c9e416e0560052cf068809a9255e4210a56632b55',
      bytes: 51065,
      recordLocators: ['top-level record ID=5115'],
    },
  };
  for (const [key, fields] of Object.entries(expected)) {
    const artifact = manifest.artifacts?.[key];
    check(artifact && Object.entries(fields).every(([field, value]) => isDeepStrictEqual(artifact[field], value)), `${key} source locator or hash metadata mismatch`);
  }

  check(Array.isArray(soldierInfo.records) && Array.isArray(spSoldierInfo.records), 'source evidence records are missing');
  const soldierCounts = new Map();
  for (const row of soldierInfo.records) {
    check(row && Number.isInteger(row.ID), 'SoldierInfo evidence contains a malformed ID');
    soldierCounts.set(row.ID, (soldierCounts.get(row.ID) ?? 0) + 1);
  }
  check(soldierCounts.get(115) === 1, 'SoldierInfo.ID=115 evidence must occur exactly once');
  check(soldierCounts.get(5115) === 1, 'SoldierInfo.ID=5115 endpoint evidence must occur exactly once');
  check(soldierInfo.records.length === 2, 'unexpected SoldierInfo records outside this slice');

  check(spSoldierInfo.records.length === 1, 'unexpected SPSoldierInfo records outside this slice');
  const [spRecord] = spSoldierInfo.records;
  exactKeys(spRecord, Object.keys(spRecord), 'SPSoldierInfo evidence record');
  check(spRecord.ID === 5115, 'SPSoldierInfo.ID=5115 endpoint evidence is missing');
  check(spRecord.NormalSoliderId === 115, 'source field NormalSoliderId does not exactly equal 115');

  const normal = soldierInfo.records.filter((row) => row.ID === 115);
  check(normal[0].ID === identity.id, 'canonical NORMAL Soldier ID does not exactly match ConfigDataSoldierInfo.ID evidence');
  return { canonicalIdentities: 1, soldierInfoRecords: soldierInfo.records.length, spEndpointEvidenceRecords: 1 };
}

export async function loadAndValidateSoldierIdentity(root = process.cwd()) {
  const read = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
  const [canonical, soldierInfo, spSoldierInfo, manifest] = await Promise.all([
    read('canonical/soldiers.v1.json'),
    read('evidence/source/configdata/ConfigDataSoldierInfo.records-identity-115.v1.json'),
    read('evidence/source/configdata/ConfigDataSPSoldierInfo.record-5115.v1.json'),
    read('evidence/source/configdata/soldier-identity-115.source-manifest.v1.json'),
  ]);
  return validateSoldierIdentity({ canonical, soldierInfo, spSoldierInfo, manifest });
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const result = await loadAndValidateSoldierIdentity();
  process.stdout.write(`NORMAL Soldier identity: PASS (${result.canonicalIdentities} identity; ${result.soldierInfoRecords} SoldierInfo source records; SP endpoint retained as evidence only)\\n`);
}
