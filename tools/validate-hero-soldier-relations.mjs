import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { validateSpHeroRewardSource } from './validate-sp-hero-reward-source.mjs';

const root = process.cwd();
const canonicalPath = 'canonical/hero-soldier-relations.v1.json';
const heroOwnerPath = 'canonical/hero-identities.v1.json';
const soldierOwnerPath = 'canonical/soldiers.v1.json';
const directManifestPath = 'evidence/source/configdata/hero-soldier-direct-source-evidence.v1.json';
const soldierSourcePath = 'evidence/source/configdata/ConfigDataSoldierInfo.records-sp-soldier-endpoints.v1.json';
const spSoldierSourcePath = 'evidence/source/configdata/ConfigDataSPSoldierInfo.records-all-sp-soldiers.v1.json';
const soldierSourceManifestPath = 'evidence/source/configdata/sp-soldier-population.source-manifest.v1.json';
const sourceContractPath = 'evidence/source/legacy/hero-soldier/contracts/hero-soldier-relation-source-contract.v1.json';
const currentRelationCount = 379;
const currentProvenanceCount = 380;
const currentSourceKindCounts = {
  BASE_SOLDIER_HERO: 170,
  SP_HERO_REWARD: 5,
  SP_SOLDIER_EXPAND: 30,
  SP_SOLDIER_INHERIT: 175,
};
const check = (condition, message) => { if (!condition) throw new Error(`Hero-Soldier direct-source validation failed: ${message}`); };
const readBytes = (path) => readFile(resolve(root, path));
const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const gitBlobSha1 = (bytes) => createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`), bytes])).digest('hex');
const pairKey = (heroId, soldierId) => `${heroId}:${soldierId}`;
const exactKeys = (value, expected, label) => check(isDeepStrictEqual(Object.keys(value).sort(), [...expected].sort()), `${label} has unexpected or missing fields`);

function addProvenance(byPair, targetHeroIds, targetSoldierIds, heroId, soldierId, provenance) {
  if (!targetHeroIds.has(heroId) || !targetSoldierIds.has(soldierId)) return;
  const key = pairKey(heroId, soldierId);
  let edge = byPair.get(key);
  if (!edge) {
    edge = { heroId, soldierId, provenance: [] };
    byPair.set(key, edge);
  }
  if (!edge.provenance.some((candidate) => isDeepStrictEqual(candidate, provenance))) edge.provenance.push(provenance);
}

export async function validateHeroSoldierRelations() {
  const rewardEvidence = await validateSpHeroRewardSource();
  const [
    directManifest,
    canonical,
    heroOwner,
    soldierOwner,
    soldierSourceDoc,
    spSoldierSourceDoc,
    soldierSourceManifest,
    sourceContract,
    soldierSourceBytes,
    spSoldierSourceBytes,
  ] = await Promise.all([
    readJson(directManifestPath),
    readJson(canonicalPath),
    readJson(heroOwnerPath),
    readJson(soldierOwnerPath),
    readJson(soldierSourcePath),
    readJson(spSoldierSourcePath),
    readJson(soldierSourceManifestPath),
    readJson(sourceContractPath),
    readBytes(soldierSourcePath),
    readBytes(spSoldierSourcePath),
  ]);

  exactKeys(directManifest, [
    'schemaVersion','sourceRole','canonical','generated','productionRuntimeDependency','canonicalTarget',
    'claimScope','locatorFormat','locatorSemantics','sourceSemanticsContract','sources',
    'currentRegression','knownLimitations'
  ], 'direct-source provenance manifest');
  check(directManifest.schemaVersion === 1
    && directManifest.sourceRole === 'hero_soldier_direct_source_provenance'
    && directManifest.canonical === false
    && directManifest.generated === false
    && directManifest.productionRuntimeDependency === false,
  'direct-source manifest authority boundary changed');
  check(directManifest.canonicalTarget === canonicalPath, 'direct-source manifest canonical target drift');
  check(directManifest.sourceSemanticsContract === sourceContractPath, 'direct-source semantics contract locator drift');
  check(directManifest.locatorFormat === `${directManifestPath}#heroId=<HeroID>&soldierId=<SoldierID>`, 'direct-source locator format drift');
  check(directManifest.claimScope === 'Current admitted Hero-Soldier relation claims only; this manifest resolves provenance to retained direct source evidence and does not define future relation completeness or admission.', 'direct-source manifest scope must remain admission-bounded');

  const sources = directManifest.sources;
  const expectedSourceSpecs = {
    BASE_SOLDIER_HERO: {
      artifactPath: soldierSourcePath,
      artifactGitBlobSha1: 'bcfcd84df8647646aa42ab95793b0bae58cb0edd',
      manifestPath: soldierSourceManifestPath,
      originalSourcePath: 'data/configdata/ConfigDataSoldierInfo.json',
      originalSourceGitBlobSha1: '23649493c4d4c602e8d990db7bb5fade11747cc3',
      sourceTable: 'ConfigDataSoldierInfo',
      sourceField: 'GetSoldierHeros_ID',
    },
    SP_HERO_REWARD: {
      artifactPath: rewardEvidence.sourcePath,
      artifactGitBlobSha1: 'faec10b937b8bd8678415df83ccacdba10848778',
      manifestPath: rewardEvidence.manifestPath,
      originalSourcePath: 'data/configdata/ConfigDataSPHeroInfo.json',
      originalSourceGitBlobSha1: 'c3dc00ad0e1454481715ade378f56104febed9a3',
      sourceTable: 'ConfigDataSPHeroInfo',
      sourceField: 'SecondStageRewardSoldiers',
    },
    SP_SOLDIER_EXPAND: {
      artifactPath: spSoldierSourcePath,
      artifactGitBlobSha1: 'f1d5ba516c38f20d71a07e9f26e565c1ff8e04dd',
      manifestPath: soldierSourceManifestPath,
      originalSourcePath: 'data/configdata/ConfigDataSPSoldierInfo.json',
      originalSourceGitBlobSha1: '93dd784a7de913daa6d72f5df6cf6890a710c58a',
      sourceTable: 'ConfigDataSPSoldierInfo',
      sourceField: 'SecondStageExpandHeroList',
    },
    SP_SOLDIER_INHERIT: {
      artifactPath: spSoldierSourcePath,
      artifactGitBlobSha1: 'f1d5ba516c38f20d71a07e9f26e565c1ff8e04dd',
      manifestPath: soldierSourceManifestPath,
      originalSourcePath: 'data/configdata/ConfigDataSPSoldierInfo.json',
      originalSourceGitBlobSha1: '93dd784a7de913daa6d72f5df6cf6890a710c58a',
      sourceTable: 'ConfigDataSPSoldierInfo',
      supportField: 'NormalSoliderId',
      spIdField: 'ID',
    },
  };
  check(isDeepStrictEqual(sources, expectedSourceSpecs), 'direct-source artifact/provenance mapping drift');
  check(gitBlobSha1(soldierSourceBytes) === sources.BASE_SOLDIER_HERO.artifactGitBlobSha1, 'preserved SoldierInfo artifact bytes drift');
  check(gitBlobSha1(spSoldierSourceBytes) === sources.SP_SOLDIER_EXPAND.artifactGitBlobSha1, 'preserved SPSoldierInfo artifact bytes drift');

  check(soldierSourceManifest.source?.repository === 'LuceatLuxVestra42/langrisser-future-guide'
    && soldierSourceManifest.source?.commit === '6475e63ee23d18adf733756c26a14fa9e3ed662c',
  'pinned Soldier source repository/commit drift');
  check(soldierSourceManifest.artifacts?.soldierInfoEndpoints?.repoPreservedPath === soldierSourcePath
    && soldierSourceManifest.artifacts.soldierInfoEndpoints.gitBlobSha1 === sources.BASE_SOLDIER_HERO.originalSourceGitBlobSha1,
  'SoldierInfo direct-source provenance mismatch');
  check(soldierSourceManifest.artifacts?.spSoldierInfo?.repoPreservedPath === spSoldierSourcePath
    && soldierSourceManifest.artifacts.spSoldierInfo.gitBlobSha1 === sources.SP_SOLDIER_EXPAND.originalSourceGitBlobSha1,
  'SPSoldierInfo direct-source provenance mismatch');

  const kinds = sourceContract.edgeSourceKinds;
  check(kinds?.BASE_SOLDIER_HERO?.class === 'DIRECT'
    && kinds.BASE_SOLDIER_HERO.table === 'ConfigDataSoldierInfo'
    && kinds.BASE_SOLDIER_HERO.field === 'GetSoldierHeros_ID',
  'BASE_SOLDIER_HERO source semantics drift');
  check(kinds?.SP_HERO_REWARD?.class === 'DIRECT'
    && kinds.SP_HERO_REWARD.table === 'ConfigDataSPHeroInfo'
    && kinds.SP_HERO_REWARD.field === 'SecondStageRewardSoldiers',
  'SP_HERO_REWARD source semantics drift');
  check(kinds?.SP_SOLDIER_EXPAND?.class === 'DIRECT'
    && kinds.SP_SOLDIER_EXPAND.table === 'ConfigDataSPSoldierInfo'
    && kinds.SP_SOLDIER_EXPAND.field === 'SecondStageExpandHeroList',
  'SP_SOLDIER_EXPAND source semantics drift');
  check(kinds?.SP_SOLDIER_INHERIT?.class === 'DERIVED'
    && isDeepStrictEqual(kinds.SP_SOLDIER_INHERIT.allowedParentKinds, ['BASE_SOLDIER_HERO', 'SP_HERO_REWARD'])
    && kinds.SP_SOLDIER_INHERIT.requiresSupportRelation === 'SP_FORM_LINK',
  'SP_SOLDIER_INHERIT source semantics drift');
  const link = sourceContract.supportRelationKinds?.SP_FORM_LINK;
  check(link?.table === 'ConfigDataSPSoldierInfo'
    && link.normalField === 'NormalSoliderId'
    && link.spField === 'ID'
    && link.createsHeroSoldierEdge === false
    && link.inferenceForbidden === true,
  'SP_FORM_LINK source semantics drift');

  exactKeys(canonical, ['schemaVersion','scope','heroEndpointOwner','soldierEndpointOwner','evidencePool','records'], 'canonical Hero-Soldier document');
  check(canonical.schemaVersion === 1, 'unsupported canonical schemaVersion');
  check(canonical.evidencePool === directManifestPath, 'canonical direct-source evidence manifest locator drift');
  check(Array.isArray(canonical.records), 'canonical records are missing');
  check(Array.isArray(heroOwner.records) && Array.isArray(soldierOwner.records), 'canonical endpoint owners are malformed');
  check(Array.isArray(soldierSourceDoc.records) && Array.isArray(spSoldierSourceDoc.records), 'preserved Soldier source records are malformed');

  const heroIds = new Set();
  for (const row of heroOwner.records) {
    check(Number.isInteger(row.heroId) && !heroIds.has(row.heroId), `malformed or duplicate Hero endpoint ${row.heroId}`);
    heroIds.add(row.heroId);
  }
  const soldierVariant = new Map();
  for (const row of soldierOwner.records) {
    check(Number.isInteger(row.id) && !soldierVariant.has(row.id), `malformed or duplicate Soldier endpoint ${row.id}`);
    check(row.variant === 'NORMAL' || row.variant === 'SP', `unsupported Soldier variant for ${row.id}`);
    soldierVariant.set(row.id, row.variant);
  }

  const canonicalByPair = new Map();
  let previousHeroId = -Infinity;
  let previousSoldierId = -Infinity;
  for (const row of canonical.records) {
    exactKeys(row, ['heroId','soldierId','evidenceClass','evidencePoolLocator','provenance'], `canonical Hero-Soldier ${row.heroId}:${row.soldierId}`);
    check(Number.isInteger(row.heroId) && Number.isInteger(row.soldierId), 'malformed canonical relation endpoints');
    const key = pairKey(row.heroId, row.soldierId);
    check(!canonicalByPair.has(key), `duplicate canonical pair ${key}`);
    check(row.heroId > previousHeroId || (row.heroId === previousHeroId && row.soldierId > previousSoldierId), `canonical relation ordering drift at ${key}`);
    previousHeroId = row.heroId;
    previousSoldierId = row.soldierId;
    check(heroIds.has(row.heroId), `canonical pair ${key} references missing Hero endpoint`);
    check(soldierVariant.has(row.soldierId), `canonical pair ${key} references missing Soldier endpoint`);
    check(row.evidenceClass === 'B', `canonical pair ${key} evidence class drift`);
    check(row.evidencePoolLocator === `${directManifestPath}#heroId=${row.heroId}&soldierId=${row.soldierId}`, `canonical pair ${key} direct-source evidence locator drift`);
    check(Array.isArray(row.provenance) && row.provenance.length > 0, `canonical pair ${key} has no provenance`);
    canonicalByPair.set(key, row);
  }

  // The current canonical target bounds this equivalence proof. New endpoint-owner records do not
  // automatically create a completeness or admission obligation.
  const targetHeroIds = new Set(canonical.records.map((row) => row.heroId));
  const targetSoldierIds = new Set(canonical.records.map((row) => row.soldierId));
  const byPair = new Map();

  for (const row of soldierSourceDoc.records) {
    if (!targetSoldierIds.has(row.ID) || soldierVariant.get(row.ID) !== 'NORMAL') continue;
    check(Array.isArray(row.GetSoldierHeros_ID), `ConfigDataSoldierInfo.ID=${row.ID} has malformed GetSoldierHeros_ID`);
    for (const heroId of row.GetSoldierHeros_ID) {
      addProvenance(byPair, targetHeroIds, targetSoldierIds, heroId, row.ID, {
        sourceKind: 'BASE_SOLDIER_HERO',
        sourceClass: 'DIRECT',
        origin: { table: 'ConfigDataSoldierInfo', recordId: row.ID, recordKeyField: 'ID', field: 'GetSoldierHeros_ID' },
      });
    }
  }

  for (const row of rewardEvidence.records) {
    for (const soldierId of row.SecondStageRewardSoldiers) {
      addProvenance(byPair, targetHeroIds, targetSoldierIds, row.ID, soldierId, {
        sourceKind: 'SP_HERO_REWARD',
        sourceClass: 'DIRECT',
        origin: { table: 'ConfigDataSPHeroInfo', recordId: row.ID, recordKeyField: 'ID', field: 'SecondStageRewardSoldiers' },
      });
    }
  }

  for (const row of spSoldierSourceDoc.records) {
    if (!targetSoldierIds.has(row.ID) || soldierVariant.get(row.ID) !== 'SP') continue;
    const expandedHeroes = row.SecondStageExpandHeroList ?? [];
    check(Array.isArray(expandedHeroes), `ConfigDataSPSoldierInfo.ID=${row.ID} has malformed SecondStageExpandHeroList`);
    for (const heroId of expandedHeroes) {
      addProvenance(byPair, targetHeroIds, targetSoldierIds, heroId, row.ID, {
        sourceKind: 'SP_SOLDIER_EXPAND',
        sourceClass: 'DIRECT',
        origin: { table: 'ConfigDataSPSoldierInfo', recordId: row.ID, recordKeyField: 'ID', field: 'SecondStageExpandHeroList' },
      });
    }
  }

  const directEdges = [...byPair.values()].map((edge) => ({ heroId: edge.heroId, soldierId: edge.soldierId, provenance: [...edge.provenance] }));
  for (const row of spSoldierSourceDoc.records) {
    if (!targetSoldierIds.has(row.ID) || soldierVariant.get(row.ID) !== 'SP') continue;
    if (!targetSoldierIds.has(row.NormalSoliderId)) continue;
    check(Number.isInteger(row.NormalSoliderId), `ConfigDataSPSoldierInfo.ID=${row.ID} has malformed NormalSoliderId`);
    for (const parent of directEdges) {
      if (parent.soldierId !== row.NormalSoliderId) continue;
      for (const provenance of parent.provenance) {
        if (!kinds.SP_SOLDIER_INHERIT.allowedParentKinds.includes(provenance.sourceKind)) continue;
        addProvenance(byPair, targetHeroIds, targetSoldierIds, parent.heroId, row.ID, {
          sourceKind: 'SP_SOLDIER_INHERIT',
          sourceClass: 'DERIVED',
          origin: provenance.origin,
          parentEdge: { heroId: parent.heroId, soldierId: row.NormalSoliderId, parentSourceKind: provenance.sourceKind },
          supportRelation: {
            kind: 'SP_FORM_LINK',
            table: 'ConfigDataSPSoldierInfo',
            recordId: row.ID,
            normalSoldierId: row.NormalSoliderId,
            spSoldierId: row.ID,
          },
        });
      }
    }
  }

  const reconstructed = [...byPair.values()].sort((a, b) => a.heroId - b.heroId || a.soldierId - b.soldierId);
  const reconstructedByPair = new Map(reconstructed.map((row) => [pairKey(row.heroId, row.soldierId), row]));
  const missing = [...canonicalByPair.keys()].filter((key) => !reconstructedByPair.has(key));
  const extra = [...reconstructedByPair.keys()].filter((key) => !canonicalByPair.has(key));
  const provenanceMismatches = [];
  for (const [key, canonicalRow] of canonicalByPair) {
    const sourceRow = reconstructedByPair.get(key);
    if (sourceRow && !isDeepStrictEqual(canonicalRow.provenance, sourceRow.provenance)) provenanceMismatches.push(key);
  }

  const provenanceCount = reconstructed.reduce((sum, row) => sum + row.provenance.length, 0);
  const sourceKindCounts = { BASE_SOLDIER_HERO: 0, SP_HERO_REWARD: 0, SP_SOLDIER_EXPAND: 0, SP_SOLDIER_INHERIT: 0 };
  for (const row of reconstructed) for (const provenance of row.provenance) {
    check(Object.hasOwn(sourceKindCounts, provenance.sourceKind), `unsupported reconstructed source kind ${provenance.sourceKind}`);
    sourceKindCounts[provenance.sourceKind] += 1;
  }
  const multiProvenance = reconstructed.filter((row) => row.provenance.length > 1);

  check(missing.length === 0, `missing canonical-supported edges: ${missing.join(', ') || 'none'}`);
  check(extra.length === 0, `extra direct-source edges within current admitted target: ${extra.join(', ') || 'none'}`);
  check(provenanceMismatches.length === 0, `provenance mismatches: ${provenanceMismatches.join(', ') || 'none'}`);
  check(reconstructed.length === currentRelationCount && canonical.records.length === currentRelationCount, `current relation count drift: reconstructed=${reconstructed.length}; canonical=${canonical.records.length}`);
  check(provenanceCount === currentProvenanceCount, `current provenance count drift: reconstructed=${provenanceCount}`);
  check(isDeepStrictEqual(sourceKindCounts, currentSourceKindCounts), `current source-kind counts drift: ${JSON.stringify(sourceKindCounts)}`);
  check(isDeepStrictEqual(directManifest.currentRegression, {
    relationCount: currentRelationCount,
    provenanceCount: currentProvenanceCount,
    sourceKindCounts: currentSourceKindCounts,
    multiProvenanceEdges: [{ heroId: 37, soldierId: 5423, provenanceCount: 2 }],
  }), 'direct-source manifest current regression metadata drift');
  check(multiProvenance.length === 1
    && multiProvenance[0].heroId === 37
    && multiProvenance[0].soldierId === 5423
    && multiProvenance[0].provenance.length === 2,
  'current dual-provenance edge regression drift');

  return {
    relationCount: reconstructed.length,
    provenanceCount,
    sourceKindCounts,
    missingEdges: missing.length,
    extraEdges: extra.length,
    provenanceMismatches: provenanceMismatches.length,
    multiProvenanceEdges: multiProvenance.length,
  };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  check(process.argv.slice(2).length === 0, 'Usage: node tools/validate-hero-soldier-relations.mjs');
  const result = await validateHeroSoldierRelations();
  process.stdout.write(`Hero-Soldier direct-source validation: PASS (${result.relationCount} relations; ${result.provenanceCount} provenance; missing ${result.missingEdges}; extra ${result.extraEdges}; provenance mismatches ${result.provenanceMismatches})\n`);
}
