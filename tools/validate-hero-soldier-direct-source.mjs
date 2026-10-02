import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { validateSpHeroRewardSource } from './validate-sp-hero-reward-source.mjs';

const root = process.cwd();
const canonicalPath = 'canonical/hero-soldier-relations.v1.json';
const heroOwnerPath = 'canonical/hero-identities.v1.json';
const soldierOwnerPath = 'canonical/soldiers.v1.json';
const soldierSourcePath = 'evidence/source/configdata/ConfigDataSoldierInfo.records-sp-soldier-endpoints.v1.json';
const spSoldierSourcePath = 'evidence/source/configdata/ConfigDataSPSoldierInfo.records-all-sp-soldiers.v1.json';
const sourceContractPath = 'evidence/source/legacy/hero-soldier/contracts/hero-soldier-relation-source-contract.v1.json';
const currentRelationCount = 379;
const currentProvenanceCount = 380;
const currentSourceKindCounts = {
  BASE_SOLDIER_HERO: 170,
  SP_HERO_REWARD: 5,
  SP_SOLDIER_EXPAND: 30,
  SP_SOLDIER_INHERIT: 175,
};
const check = (condition, message) => { if (!condition) throw new Error(`Hero-Soldier direct-source proof failed: ${message}`); };
const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const pairKey = (heroId, soldierId) => `${heroId}:${soldierId}`;

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

export async function validateHeroSoldierDirectSourceEquivalence() {
  const rewardEvidence = await validateSpHeroRewardSource();
  const [canonical, heroOwner, soldierOwner, soldierSourceDoc, spSoldierSourceDoc, sourceContract] = await Promise.all([
    readJson(canonicalPath),
    readJson(heroOwnerPath),
    readJson(soldierOwnerPath),
    readJson(soldierSourcePath),
    readJson(spSoldierSourcePath),
    readJson(sourceContractPath),
  ]);

  check(Array.isArray(canonical.records), 'canonical records are missing');
  check(Array.isArray(heroOwner.records) && Array.isArray(soldierOwner.records), 'canonical endpoint owners are malformed');
  check(Array.isArray(soldierSourceDoc.records) && Array.isArray(spSoldierSourceDoc.records), 'preserved Soldier source records are malformed');

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

  // E1 equivalence is intentionally scoped by the currently admitted canonical target.
  // New endpoint-owner records outside this target do not create a completeness/admission obligation.
  const targetHeroIds = new Set(canonical.records.map((row) => row.heroId));
  const targetSoldierIds = new Set(canonical.records.map((row) => row.soldierId));
  for (const heroId of targetHeroIds) check(heroIds.has(heroId), `canonical target references missing Hero endpoint ${heroId}`);
  for (const soldierId of targetSoldierIds) check(soldierVariant.has(soldierId), `canonical target references missing Soldier endpoint ${soldierId}`);

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

  const directEdges = [...byPair.values()].map((edge) => ({
    heroId: edge.heroId,
    soldierId: edge.soldierId,
    provenance: [...edge.provenance],
  }));
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
          parentEdge: {
            heroId: parent.heroId,
            soldierId: row.NormalSoliderId,
            parentSourceKind: provenance.sourceKind,
          },
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
  const canonicalByPair = new Map();
  for (const row of canonical.records) {
    const key = pairKey(row.heroId, row.soldierId);
    check(!canonicalByPair.has(key), `duplicate canonical pair ${key}`);
    canonicalByPair.set(key, row);
  }
  const reconstructedByPair = new Map(reconstructed.map((row) => [pairKey(row.heroId, row.soldierId), row]));

  const missing = [...canonicalByPair.keys()].filter((key) => !reconstructedByPair.has(key));
  const extra = [...reconstructedByPair.keys()].filter((key) => !canonicalByPair.has(key));
  const provenanceMismatches = [];
  for (const [key, canonicalRow] of canonicalByPair) {
    const sourceRow = reconstructedByPair.get(key);
    if (!sourceRow) continue;
    if (!isDeepStrictEqual(canonicalRow.provenance, sourceRow.provenance)) provenanceMismatches.push(key);
  }

  const provenanceCount = reconstructed.reduce((sum, row) => sum + row.provenance.length, 0);
  const sourceKindCounts = { BASE_SOLDIER_HERO: 0, SP_HERO_REWARD: 0, SP_SOLDIER_EXPAND: 0, SP_SOLDIER_INHERIT: 0 };
  for (const row of reconstructed) {
    for (const provenance of row.provenance) sourceKindCounts[provenance.sourceKind] += 1;
  }
  const multiProvenance = reconstructed.filter((row) => row.provenance.length > 1);

  check(missing.length === 0, `missing canonical-supported edges: ${missing.join(', ') || 'none'}`);
  check(extra.length === 0, `extra direct-source edges within the current admitted target: ${extra.join(', ') || 'none'}`);
  check(provenanceMismatches.length === 0, `provenance mismatches: ${provenanceMismatches.join(', ') || 'none'}`);
  check(reconstructed.length === currentRelationCount && canonical.records.length === currentRelationCount,
    `current equivalence relation count drift: reconstructed=${reconstructed.length}; canonical=${canonical.records.length}`);
  check(provenanceCount === currentProvenanceCount,
    `current equivalence provenance count drift: reconstructed=${provenanceCount}`);
  check(isDeepStrictEqual(sourceKindCounts, currentSourceKindCounts),
    `current source-kind provenance counts drift: ${JSON.stringify(sourceKindCounts)}`);
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
  check(process.argv.slice(2).length === 0, 'Usage: node tools/validate-hero-soldier-direct-source.mjs');
  const result = await validateHeroSoldierDirectSourceEquivalence();
  process.stdout.write(`Hero-Soldier direct-source equivalence: PASS (${result.relationCount} relations; ${result.provenanceCount} provenance; missing ${result.missingEdges}; extra ${result.extraEdges}; provenance mismatches ${result.provenanceMismatches})\n`);
}
