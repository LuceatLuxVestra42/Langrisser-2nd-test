import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const CANONICAL = 'canonical/hero-profile-cv-names.v1.json';
export const OUTPUT = 'generated/hero-15-profile-cv-internal.v1.json';
export const SCOPE = 'Internal-only projection of the source-native CVName field; no Korean localization, public eligibility, or Full Detail publication is implied.';

export function renderHero15ProfileCvInternal(canonical) {
  if (canonical?.schemaVersion !== 1 || canonical?.responsibility !== 'hero-profile-source-cv-name'
    || !Array.isArray(canonical.records) || canonical.records.length !== 1) {
    throw new Error('Hero 15 source CVName Canonical scope is invalid');
  }
  const record = canonical.records[0];
  if (record.heroId !== 15 || record.charImageId !== 15 || record.cvNameRaw !== '小清水亚美'
    || record.provenance?.cvNameRaw !== 'evidence/source/configdata/ConfigDataCharImageInfo.record-hero-15-cv-name.v1.json#claim/CVName'
    || record.provenance?.heroToCharImageRelation !== 'evidence/source/configdata/ConfigDataCharImageInfo.record-hero-15-cv-name.v1.json#relation') {
    throw new Error('Hero 15 source CVName Canonical claim is invalid');
  }
  return `${JSON.stringify({ schemaVersion: 1, scope: SCOPE, heroId: record.heroId, charImageId: record.charImageId,
    cvNameRaw: record.cvNameRaw, provenance: record.provenance }, null, 2)}\n`;
}

export async function generate(root = process.cwd()) {
  const canonical = JSON.parse(await readFile(resolve(root, CANONICAL), 'utf8'));
  const output = renderHero15ProfileCvInternal(canonical);
  await writeFile(resolve(root, OUTPUT), output, 'utf8');
  return output;
}
