import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { HERO_FULL_DETAIL_CURRENT_IDS } from './hero-full-detail-population-migration-contract.mjs';

export const HERO_INDEX_PUBLICATION_PATH = 'docs/decisions/hero-index-publication.v1.json';
export const FULL_DETAIL_PUBLIC_POPULATION_BASELINE_IDS = Object.freeze([...HERO_FULL_DETAIL_CURRENT_IDS]);

const fail = (message) => { throw new Error(`Full Detail public population projection: ${message}`); };
const equal = (left, right) => JSON.stringify(left) === JSON.stringify(right);

export function approvedFullDetailPublicHeroIds(publicationDecision) {
  const scope = publicationDecision?.approvedScope;
  const ids = scope?.detailHeroIds;
  if (publicationDecision?.status !== 'APPROVED'
    || scope?.detailLinkPolicy !== 'ONLY_APPROVED_HERO_SLICE_ENDPOINTS'
    || !Array.isArray(scope?.surfaces)
    || !scope.surfaces.includes('HERO_INDEX_LIST')
    || !scope.surfaces.includes('HERO_INDEX_SEARCH')
    || !Array.isArray(ids)
    || ids.some((id) => !Number.isSafeInteger(id))
    || new Set(ids).size !== ids.length) {
    fail('approved Full Detail endpoint IDs are missing, malformed, or not owned by the approved Hero Index decision');
  }
  if (!equal(ids, FULL_DETAIL_PUBLIC_POPULATION_BASELINE_IDS)) {
    fail('the current approved Full Detail endpoint set changed; a separate reviewed Full Detail publication scope is required');
  }
  if (!Array.isArray(scope.excluded) || !scope.excluded.includes('Expansion of the existing detailed Hero presentation')) {
    fail('the existing Hero Index decision no longer excludes Full Detail presentation expansion');
  }
  return [...ids];
}

export function projectApprovedFullDetailRecords(canonical, publicationDecision) {
  const records = canonical?.records;
  if (!Array.isArray(records)) fail('Canonical records must be an array');
  const byId = new Map();
  for (const record of records) {
    if (!Number.isSafeInteger(record?.id) || byId.has(record.id)) fail('Canonical Full Detail records contain a malformed or duplicate ID');
    byId.set(record.id, record);
  }
  const approvedIds = approvedFullDetailPublicHeroIds(publicationDecision);
  const missing = approvedIds.filter((id) => !byId.has(id));
  if (missing.length) fail('an approved Full Detail endpoint has no Canonical record');
  return approvedIds.map((id) => byId.get(id));
}

export function validateFullDetailPublicPopulation({ canonical, generated, publicationDecision }) {
  const projected = projectApprovedFullDetailRecords(canonical, publicationDecision);
  const expectedIds = projected.map(({ id }) => id);
  const actualIds = generated?.heroes?.map(({ id }) => id);
  if (!Array.isArray(actualIds) || !equal(actualIds, expectedIds)) {
    fail('Public Generated Full Detail IDs must exactly follow the approved endpoint population and order');
  }
  return true;
}

export async function validateFullDetailPublicPopulationFromRoot(root = process.cwd()) {
  const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
  const [canonical, generated, publicationDecision] = await Promise.all([
    readJson('canonical/heroes.v1.json'),
    readJson('generated/hero-slice.v1.json'),
    readJson(HERO_INDEX_PUBLICATION_PATH),
  ]);
  return validateFullDetailPublicPopulation({ canonical, generated, publicationDecision });
}
