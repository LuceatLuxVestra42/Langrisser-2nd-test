import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { HERO15_NORMAL_SOLDIER_IDS, HERO15_SP_SOLDIER_IDS } from './validate-hero-soldier-relations.mjs';

export const OUTPUT = 'generated/hero-15-soldier-internal.v1.json';
export const EXPECTED_SOLDIER_IDS = Object.freeze([...HERO15_NORMAL_SOLDIER_IDS, ...HERO15_SP_SOLDIER_IDS]);
const normalIds = new Set(HERO15_NORMAL_SOLDIER_IDS);
const relationEvidencePath = 'evidence/source/configdata/hero-soldier-direct-source-evidence.v1.json';
export const SCOPE = 'Internal Hero 15 relation projection only; preserves admitted relation evidence and Soldier identity endpoints. Does not establish presentation eligibility, availability, job unlocks, localization, stats, skills, training, or publication.';

export async function loadHero15SoldierInputs(root = process.cwd()) {
  const read = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'));
  const [relations, soldiers] = await Promise.all([
    read('canonical/hero-soldier-relations.v1.json'),
    read('canonical/soldiers.v1.json'),
  ]);
  return { relations, soldiers };
}

export function renderHero15SoldierInternal({ relations, soldiers }) {
  if (relations?.schemaVersion !== 1 || !Array.isArray(relations.records)
      || soldiers?.schemaVersion !== 1 || !Array.isArray(soldiers.records)) throw new Error('Unsupported relation or Soldier identity owner');
  const selected = relations.records.filter(row => row.heroId === 15);
  if (!isDeepStrictEqual(selected.map(row => row.soldierId), EXPECTED_SOLDIER_IDS)) {
    throw new Error('Hero 15 canonical relation keys or order differ from the admitted 17-pair scope');
  }
  const records = selected.map(relation => {
    const endpoints = soldiers.records.filter(row => row.entity === 'Soldier' && row.id === relation.soldierId);
    const isNormal = normalIds.has(relation.soldierId);
    const namespace = isNormal ? 'NORMAL' : 'SP';
    if (endpoints.length !== 1 || endpoints[0].variant !== namespace) {
      throw new Error(`Expected one ${namespace} Soldier identity endpoint ${relation.soldierId}`);
    }
    const [claim] = relation.provenance ?? [];
    if (relation.evidencePoolLocator !== `${relationEvidencePath}#heroId=15&soldierId=${relation.soldierId}`
      || relation.evidenceClass !== (isNormal ? 'A' : 'B') || relation.provenance?.length !== 1
      || claim?.sourceKind !== (isNormal ? 'BASE_SOLDIER_HERO' : 'SP_SOLDIER_INHERIT')
      || claim?.sourceClass !== (isNormal ? 'DIRECT' : 'DERIVED')
      || (isNormal && !isDeepStrictEqual(claim.origin, {
        table: 'ConfigDataSoldierInfo', recordId: relation.soldierId, recordKeyField: 'ID', field: 'GetSoldierHeros_ID',
      }))) {
      throw new Error(`Hero 15 Soldier relation evidence drift for ${relation.soldierId}`);
    }
    return { ...structuredClone(relation), soldierIdentity: structuredClone(endpoints[0]) };
  });
  return `${JSON.stringify({ schemaVersion: 1, scope: SCOPE, relationOwner: 'canonical/hero-soldier-relations.v1.json', soldierIdentityOwner: 'canonical/soldiers.v1.json', records }, null, 2)}\n`;
}
