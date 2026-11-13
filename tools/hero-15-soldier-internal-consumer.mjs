import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const OUTPUT = 'generated/hero-15-soldier-internal.v1.json';
export const EXPECTED_SOLDIER_IDS = [210, 326, 602, 621, 802, 811, 815, 5210, 5326, 5602, 5621, 5802, 5811, 5815];
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
  if (selected.length !== EXPECTED_SOLDIER_IDS.length
      || JSON.stringify(selected.map(row => row.soldierId).sort((a,b) => a-b)) !== JSON.stringify(EXPECTED_SOLDIER_IDS)) {
    throw new Error('Hero 15 canonical relation population differs from the admitted 14-pair scope');
  }
  const records = selected.map(relation => {
    const endpoints = soldiers.records.filter(row => row.entity === 'Soldier' && row.id === relation.soldierId);
    if (endpoints.length !== 1) throw new Error(`Expected one Soldier identity endpoint ${relation.soldierId}`);
    return { ...structuredClone(relation), soldierIdentity: structuredClone(endpoints[0]) };
  });
  return `${JSON.stringify({ schemaVersion: 1, scope: SCOPE, relationOwner: 'canonical/hero-soldier-relations.v1.json', soldierIdentityOwner: 'canonical/soldiers.v1.json', records }, null, 2)}\n`;
}
