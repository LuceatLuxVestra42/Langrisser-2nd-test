import { validateHero15CanonicalPopulation } from './hero-full-detail-population-migration-contract.mjs';
import { readFile } from 'node:fs/promises';
import { validateFullDetailPortraitProjection } from './full-detail-portrait-projection-contract.mjs';
import { HERO_INDEX_PUBLICATION_PATH } from './full-detail-public-population-contract.mjs';

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const [canonical, generated, publicationDecision, migration, candidate] = await Promise.all([
  readJson('canonical/heroes.v1.json'),
  readJson('generated/hero-slice.v1.json'),
  readJson(HERO_INDEX_PUBLICATION_PATH),
  readJson('docs/decisions/hero-full-detail-population-migration.v1.json'),
  readJson('docs/decisions/hero-15-full-detail-record-field-candidate.v1.json'),
]);
const allowPopulationExtension = validateHero15CanonicalPopulation(canonical, migration, candidate.record);
validateFullDetailPortraitProjection({ canonical, generated, publicationDecision, allowPopulationExtension });
console.log('Full Detail portrait projection contract: PASS (29 existing public portraits preserved; unapproved future portrait omitted by contract)');
