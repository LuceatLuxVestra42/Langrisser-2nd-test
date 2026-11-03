import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderHeroIndex } from './generate.mjs';

const readJson = async (path) => JSON.parse(await readFile(resolve(path), 'utf8'));
const fail = (message) => { throw new Error(`Hero Index validation failed: ${message}`); };
const sameIds = (left, right) => JSON.stringify([...left].sort((a, b) => a - b))
  === JSON.stringify([...right].sort((a, b) => a - b));

export async function validateHeroIndex(root = process.cwd()) {
  const [identity, localization, approval, heroSlice] = await Promise.all([
    readJson(resolve(root, 'canonical/hero-identities.v1.json')),
    readJson(resolve(root, 'canonical/hero-localizations-ko.v1.json')),
    readJson(resolve(root, 'docs/decisions/hero-index-publication.v1.json')),
    readJson(resolve(root, 'generated/hero-slice.v1.json')),
  ]);
  const generatedText = await readFile(resolve(root, 'generated/hero-index.v1.json'), 'utf8');
  return validateHeroIndexData({ identity, localization, approval, heroSlice, generatedText });
}

export function validateHeroIndexData({ identity, localization, approval, heroSlice, generatedText }) {
  const expectedText = renderHeroIndex(identity, localization, approval);
  if (generatedText !== expectedText) fail('generated consumer is stale or non-deterministic');

  const generated = JSON.parse(generatedText);
  if (JSON.stringify(Object.keys(generated).sort()) !== JSON.stringify(['heroes', 'schemaVersion'])
    || generated.schemaVersion !== 1 || !Array.isArray(generated.heroes) || generated.heroes.length !== 267) {
    fail('consumer schema or approved record count is invalid');
  }
  const expectedIds = approval.approvedScope.heroIds;
  const identityIds = identity.records.map(({ heroId }) => heroId);
  const localizationById = new Map(localization.records.map(({ heroId, nameKo }) => [heroId, nameKo]));
  const generatedIds = generated.heroes.map(({ heroId }) => heroId);
  if (!sameIds(expectedIds, identityIds) || !sameIds(expectedIds, localization.records.map(({ heroId }) => heroId))
    || JSON.stringify(generatedIds) !== JSON.stringify(expectedIds)) fail('approved IDs do not exactly match Canonical and Generated populations');
  const seen = new Set();
  for (const row of generated.heroes) {
    if (JSON.stringify(Object.keys(row).sort()) !== JSON.stringify(['heroId', 'nameKo'])
      || !Number.isSafeInteger(row.heroId) || typeof row.nameKo !== 'string' || !row.nameKo.trim()
      || seen.has(row.heroId) || localizationById.get(row.heroId) !== row.nameKo) {
      fail(`malformed, duplicate, extra-field, or localization-mismatched row ${row.heroId}`);
    }
    seen.add(row.heroId);
  }
  const approvedDetailIds = approval.approvedScope.detailHeroIds;
  const actualDetailIds = heroSlice.heroes.map(({ id }) => id).sort((a, b) => a - b);
  if (!sameIds(approvedDetailIds, actualDetailIds) || actualDetailIds.length !== 29) {
    fail('detail-link allowlist does not exactly match the existing 29 Hero Slice endpoints');
  }
  return { indexCount: generated.heroes.length, detailCount: actualDetailIds.length };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await validateHeroIndex();
  process.stdout.write(`Hero Index validation: PASS (${result.indexCount} exact approved ID/name rows; ${result.detailCount} detail endpoints)\n`);
}
