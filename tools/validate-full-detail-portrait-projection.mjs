import { readFile } from 'node:fs/promises';
import { validateFullDetailPortraitProjection } from './full-detail-portrait-projection-contract.mjs';
import { HERO_INDEX_PUBLICATION_PATH } from './full-detail-public-population-contract.mjs';

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const [canonical, generated, publicationDecision] = await Promise.all([
  readJson('canonical/heroes.v1.json'),
  readJson('generated/hero-slice.v1.json'),
  readJson(HERO_INDEX_PUBLICATION_PATH),
]);
validateFullDetailPortraitProjection({ canonical, generated, publicationDecision });
console.log('Full Detail portrait projection contract: PASS (29 existing public portraits preserved; unapproved future portrait omitted by contract)');
