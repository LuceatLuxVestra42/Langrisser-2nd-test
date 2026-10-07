import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PINNED = Object.freeze({
  repository: 'LuceatLuxVestra42/langrisser-future-guide',
  commit: '6475e63ee23d18adf733756c26a14fa9e3ed662c',
  sourcePath: 'data/configdata/ConfigDataSoldierInfo.json',
  sourceBlobSha1: '23649493c4d4c602e8d990db7bb5fade11747cc3',
  sourceSha256: '8a73b178be5b2f15ebcc84e83741d42e242ea4650f1d590fb2c1bcee8b8bbcc4',
  sourceContractCommit: '57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff',
  sourceContractBlobSha1: '0a7c58140f7c5f44a7aedbedbc950ef0f1bb4a0d',
  sourceContractSha256: '5ae5443a7533760c9048d04355ad9445bb1f89812c10abced1c23d019d38df4d',
  endpointPath: 'evidence/source/configdata/ConfigDataSoldierInfo.records-sp-soldier-endpoints.v1.json',
  endpointSha256: '0710ba87cd15f205cdcfbbbe89a2662e35b5acb4441fbd7aa3c8ebba223c6b46',
  endpointCount: 112,
  sourceRecordCount: 777,
});
const CANONICAL_SCOPE = 'Source-level Soldier BF_MovePoint values for IDs already admitted by canonical/soldiers.v1.json. This owner does not admit Soldier identities, define Soldier population or relations, or include MoveType or runtime movement semantics.';
const fail = message => { throw new Error(`Soldier BF_MovePoint validation failed: ${message}`); };
const check = (condition, message) => { if (!condition) fail(message); };
const exactKeys = (value, expected, label) => {
  check(value && typeof value === 'object' && !Array.isArray(value), `${label} must be an object`);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  check(JSON.stringify(actual) === JSON.stringify(wanted), `${label} schema mismatch`);
};

export function validateSoldierBfMovePoints({ soldiers, canonical, endpoints, manifest, endpointSha256 }) {
  check(soldiers?.schemaVersion === 1 && Array.isArray(soldiers.records), 'Soldier identity schema mismatch');
  check(canonical?.schemaVersion === 1 && canonical.scope === CANONICAL_SCOPE && Array.isArray(canonical.records), 'canonical schema/scope mismatch');
  check(Array.isArray(endpoints?.records), 'preserved endpoint evidence missing');

  check(manifest?.source?.repository === PINNED.repository && manifest.source.commit === PINNED.commit, 'pinned source repository/commit mismatch');
  check(manifest.source.sourceVersionStatus === 'unknown', 'source version status must remain unknown');
  const contract = manifest.source.sourceContract;
  check(contract?.repository === PINNED.repository
    && contract.commit === PINNED.sourceContractCommit
    && contract.path === 'data/contracts/configdata-source-pack-contract.v1.json'
    && contract.gitBlobSha1 === PINNED.sourceContractBlobSha1
    && contract.sha256 === PINNED.sourceContractSha256, 'pinned source-pack contract mismatch');

  const artifact = manifest.artifacts?.soldierInfoEndpoints;
  check(artifact?.sourcePath === PINNED.sourcePath
    && artifact.gitBlobSha1 === PINNED.sourceBlobSha1
    && artifact.sha256 === PINNED.sourceSha256
    && artifact.repoPreservedPath === PINNED.endpointPath
    && artifact.selectedFields === 'complete source records; values preserved without semantic normalization'
    && artifact.sourceTableTopLevelRecordCount === PINNED.sourceRecordCount
    && artifact.selectedRecordCount === PINNED.endpointCount
    && artifact.exactSingleRecordPerEndpoint === true, 'pinned Soldier endpoint provenance mismatch');
  check(endpoints.records.length === artifact.selectedRecordCount, 'preserved endpoint record count mismatch');
  check(endpointSha256 === PINNED.endpointSha256, 'preserved endpoint evidence hash mismatch');

  const identityRows = soldiers.records.filter(row => row?.entity === 'Soldier');
  const identityIds = identityRows.map(row => row.id);
  const identitySet = new Set(identityIds);
  const canonicalIds = new Set();

  for (const record of canonical.records) {
    exactKeys(record, ['soldierId', 'bfMovePoint', 'provenance'], 'canonical Soldier BF_MovePoint record');
    check(Number.isInteger(record.soldierId), 'canonical Soldier ID malformed');
    check(!canonicalIds.has(record.soldierId), `duplicate canonical Soldier ID ${record.soldierId}`);
    canonicalIds.add(record.soldierId);

    check(identitySet.has(record.soldierId), `Soldier ID=${record.soldierId} is not admitted by Soldier identity owner`);
    check(identityIds.filter(id => id === record.soldierId).length === 1, `Soldier ID=${record.soldierId} identity is ambiguous`);

    const sourceRows = endpoints.records.filter(row => row?.ID === record.soldierId);
    check(sourceRows.length === 1, `pinned Soldier source row must occur exactly once for ID=${record.soldierId}`);
    const sourceRow = sourceRows[0];
    check(Object.hasOwn(sourceRow, 'BF_MovePoint'), `BF_MovePoint missing for Soldier ID=${record.soldierId}`);
    check(JSON.stringify(record.bfMovePoint) === JSON.stringify(sourceRow.BF_MovePoint),
      `canonical BF_MovePoint differs from pinned source for ID=${record.soldierId}`);
    check(record.provenance === `${PINNED.endpointPath}#ID=${record.soldierId}/BF_MovePoint`,
      `BF_MovePoint provenance locator mismatch for ID=${record.soldierId}`);
  }

  return { canonicalCount: canonical.records.length, fieldCoverage: canonical.records.length, endpointCount: endpoints.records.length };
}

export async function loadAndValidateSoldierBfMovePoints(root = process.cwd()) {
  const json = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'));
  const endpointPath = PINNED.endpointPath;
  const [soldiers, canonical, endpoints, manifest, endpointBytes] = await Promise.all([
    json('canonical/soldiers.v1.json'),
    json('canonical/soldier-bf-move-points.v1.json'),
    json(endpointPath),
    json('evidence/source/configdata/sp-soldier-population.source-manifest.v1.json'),
    readFile(resolve(root, endpointPath)),
  ]);
  const endpointSha256 = createHash('sha256').update(endpointBytes).digest('hex');
  return validateSoldierBfMovePoints({ soldiers, canonical, endpoints, manifest, endpointSha256 });
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const result = await loadAndValidateSoldierBfMovePoints();
  process.stdout.write(`Soldier BF_MovePoint: PASS (${result.canonicalCount} canonical records; ${result.endpointCount} preserved endpoints)\\n`);
}
