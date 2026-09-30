import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { validateSoldierIdentity } from './validate-soldier-identity.mjs';
import { validateSpSoldierRelation } from './validate-sp-soldier-relation.mjs';
import { validateSpSoldierBaseStats } from './validate-sp-soldier-base-stats.mjs';

const PINNED_COMMIT = '6475e63ee23d18adf733756c26a14fa9e3ed662c';
const PINNED_SOURCE = 'LuceatLuxVestra42/langrisser-future-guide';
const fail = (message) => { throw new Error(`Soldier provenance validation failed: ${message}`); };
const check = (condition, message) => { if (!condition) fail(message); };
const EXPECTED = {
  identity115: {
    path: 'evidence/source/configdata/ConfigDataSoldierInfo.records-identity-115.v1.json',
    sha256: '065de712385f71446a8a5a813d7f632aaf9332d648496ca89a4c476cd234189d',
  },
  sp5115: {
    path: 'evidence/source/configdata/ConfigDataSPSoldierInfo.record-5115.v1.json',
    sha256: '47029e0785e25ef57d3599d8ad59fa38b5620f2ea432599f4cc6db33ef76e383',
  },
  spPopulation: {
    path: 'evidence/source/configdata/ConfigDataSPSoldierInfo.records-all-sp-soldiers.v1.json',
    sha256: 'aafa357ebf9f94a7932dd2342edff90a7a2c87717a5601edfd933c02d35d6ac2',
  },
  soldierEndpoints: {
    path: 'evidence/source/configdata/ConfigDataSoldierInfo.records-sp-soldier-endpoints.v1.json',
    sha256: '938adb7f054ccc925116b769fe2ce770a8a5f60c68112fef3eb21977c2908592',
  },
  soldierStats: {
    path: 'evidence/source/configdata/ConfigDataSoldierInfo.records-sp-soldier-base-stats.v1.json',
    sha256: 'b4b9b05f9ba95cd31ec349756068ec4cb5e5fa8feef3bace1d6b43c6a8e889f5',
  },
};

const readBytes = (root, path) => readFile(resolve(root, path));
const readJson = async (root, path) => JSON.parse(await readBytes(root, path));
const verifyArtifact = async (root, { path, sha256 }) => {
  let bytes;
  try { bytes = await readBytes(root, path); } catch { fail(`referenced evidence artifact missing: ${path}`); }
  const actual = createHash('sha256').update(bytes).digest('hex');
  check(actual === sha256, `preserved evidence SHA-256 mismatch: ${path}`);
  return JSON.parse(bytes.toString('utf8'));
};
const recordMap = (table, field = 'ID') => new Map(table.records.map(row => [row[field], row]));

export async function validateSoldierProvenance(root = process.cwd()) {
  const [identityManifest, populationManifest, statsManifest] = await Promise.all([
    readJson(root, 'evidence/source/configdata/soldier-identity-115.source-manifest.v1.json'),
    readJson(root, 'evidence/source/configdata/sp-soldier-population.source-manifest.v1.json'),
    readJson(root, 'evidence/source/configdata/sp-soldier-base-stats.source-manifest.v1.json'),
  ]);
  for (const manifest of [identityManifest, populationManifest, statsManifest]) {
    check(manifest.source?.repository === PINNED_SOURCE && manifest.source?.commit === PINNED_COMMIT,
      'manifest source repository/commit mismatch');
  }
  check(identityManifest.artifacts?.soldierInfo?.repoPreservedPath === EXPECTED.identity115.path,
    'historical SoldierInfo artifact path mismatch');
  check(identityManifest.artifacts?.spSoldierInfo?.repoPreservedPath === EXPECTED.sp5115.path,
    'historical SPSoldierInfo artifact path mismatch');
  check(identityManifest.artifacts.soldierInfo.sourcePath === 'data/configdata/ConfigDataSoldierInfo.json'
    && identityManifest.artifacts.soldierInfo.gitBlobSha1 === '23649493c4d4c602e8d990db7bb5fade11747cc3'
    && identityManifest.artifacts.soldierInfo.sha256 === '8a73b178be5b2f15ebcc84e83741d42e242ea4650f1d590fb2c1bcee8b8bbcc4',
  'historical SoldierInfo source locator/hash mismatch');
  check(identityManifest.artifacts.spSoldierInfo.sourcePath === 'data/configdata/ConfigDataSPSoldierInfo.json'
    && identityManifest.artifacts.spSoldierInfo.gitBlobSha1 === '93dd784a7de913daa6d72f5df6cf6890a710c58a'
    && identityManifest.artifacts.spSoldierInfo.sha256 === 'bec68e5693cbceacf9d9d23c9e416e0560052cf068809a9255e4210a56632b55',
  'historical SPSoldierInfo source locator/hash mismatch');
  check(populationManifest.artifacts?.spSoldierInfo?.repoPreservedPath === EXPECTED.spPopulation.path,
    'SP population artifact path mismatch');
  check(populationManifest.artifacts?.soldierInfoEndpoints?.repoPreservedPath === EXPECTED.soldierEndpoints.path,
    'Soldier endpoint artifact path mismatch');
  check(statsManifest.artifact?.preservedPath === EXPECTED.soldierStats.path,
    'base stats evidence artifact path mismatch');

  const [historicalSoldier, historicalSp, spPopulation, endpoints, statsEvidence,
    canonical, relations, stats, identityPopulationManifest, localization] = await Promise.all([
    verifyArtifact(root, EXPECTED.identity115),
    verifyArtifact(root, EXPECTED.sp5115),
    verifyArtifact(root, EXPECTED.spPopulation),
    verifyArtifact(root, EXPECTED.soldierEndpoints),
    verifyArtifact(root, EXPECTED.soldierStats),
    readJson(root, 'canonical/soldiers.v1.json'),
    readJson(root, 'canonical/sp-soldier-normal-relations.v1.json'),
    readJson(root, 'canonical/sp-soldier-base-stats.v1.json'),
    readJson(root, 'evidence/source/configdata/sp-soldier-population.source-manifest.v1.json'),
    readJson(root, 'canonical/sp-soldier-localizations-ko.v1.json'),
  ]);
  const historicalSoldierById = recordMap(historicalSoldier);
  const historicalSpById = recordMap(historicalSp);
  const endpointById = recordMap(endpoints);
  const spById = recordMap(spPopulation);
  check(historicalSoldierById.size === 2 && historicalSoldierById.has(115) && historicalSoldierById.has(5115),
    'historical SoldierInfo evidence must contain exactly IDs 115 and 5115');
  check(historicalSpById.size === 1 && historicalSpById.has(5115),
    'historical SPSoldierInfo evidence must contain exactly ID 5115');
  check(spPopulation.records.length === 56 && spById.size === 56,
    'complete SP Soldier evidence population is missing or duplicated');
  check(endpoints.records.length === identityPopulationManifest.artifacts?.soldierInfoEndpoints?.selectedRecordCount,
    'preserved endpoint record count differs from manifest');
  for (const [id, row] of historicalSoldierById) {
    check(JSON.stringify(row) === JSON.stringify(endpointById.get(id)),
      `historical SoldierInfo record differs from population endpoint ID=${id}`);
  }
  check(JSON.stringify(historicalSpById.get(5115)) === JSON.stringify(spById.get(5115)),
    'historical SPSoldierInfo record differs from population source ID=5115');

  const statsById = recordMap(statsEvidence);
  check(statsEvidence.records.length === spById.size, 'base stats evidence population differs from complete SP table');
  for (const id of spById.keys()) {
    const endpoint = endpointById.get(id);
    const selected = statsById.get(id);
    check(endpoint && selected, `source endpoint/stat evidence missing explicit ID=${id}`);
    for (const field of ['HP_INI', 'AT_INI', 'DF_INI', 'MagicDF_INI']) {
      check(typeof endpoint[field] === 'number',
        `pinned source field ${field} missing for ID=${id}`);
      check(selected[field] === endpoint[field],
        `preserved stats differ from complete SoldierInfo endpoint ID=${id} field=${field}`);
    }
  }

  const soldierInfo = { records: endpoints.records };
  validateSoldierIdentity({ canonical, soldierInfo, spSoldierInfo: spPopulation, manifest: identityPopulationManifest });
  validateSpSoldierRelation({ soldiers: canonical, relations, soldierInfo, spSoldierInfo: spPopulation, manifest: identityPopulationManifest });
  validateSpSoldierBaseStats({ soldiers: canonical, relations, stats, evidence: statsEvidence, spSoldierInfo: spPopulation, manifest: statsManifest });
  check(localization.records.every(row => Number.isInteger(row.soldierId) && spById.has(row.soldierId)),
    'Soldier localization endpoint is not in the verified SP population');
  return { evidenceArtifacts: Object.keys(EXPECTED).length, identityCount: canonical.records.length, relationCount: relations.records.length };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const result = await validateSoldierProvenance();
  process.stdout.write(`Soldier provenance integrity: PASS (${result.evidenceArtifacts} pinned artifacts; ${result.relationCount} relations)\\n`);
}
