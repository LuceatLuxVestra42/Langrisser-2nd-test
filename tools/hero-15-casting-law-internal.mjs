import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const OUTPUT = 'generated/hero-15-casting-law-internal.v1.json';
export const PATHS = {
  hero: 'canonical/hero-casting-law-template-references.v1.json',
  templates: 'canonical/casting-law-template-raw-details.v1.json',
  levels: 'canonical/casting-law-template-level-references.v1.json',
  raw: 'canonical/casting-law-levelup-raw-details.v1.json',
  previous: 'canonical/casting-law-levelup-previous-level-references.v1.json',
  materials: 'canonical/casting-law-levelup-material-references.v1.json',
  properties: 'canonical/casting-law-levelup-property-raw-details.v1.json',
};
export const SCOPE = 'Internal Hero 15 projection of admitted Casting Law references and raw fields; no publication or runtime semantics.';
export const LIMITATIONS = [
  'MANUAL_REVIEW: unlock, completion, progression, application, material and gold consumption timing, property meaning and formula, and skill acquisition, equipment and activation are not established.',
  'A missing previous reference means no admitted reference for this selected record; it does not establish a source field state or game rule.',
  'Item endpoints establish only the admitted source ID endpoint. Icons are raw paths, not approved assets.',
];
export async function loadInputs(root = process.cwd()) {
  return Object.fromEntries(await Promise.all(Object.entries(PATHS).map(async ([key, path]) => [key, JSON.parse(await readFile(resolve(root, path), 'utf8'))])));
}
export function project(inputs) {
  const lookup = (rows, key, id) => {
    const matches = rows.filter(row => row[key] === id);
    if (matches.length !== 1) throw new Error(`Expected one ${key}=${id}, found ${matches.length}`);
    return matches[0];
  };
  return {
    schemaVersion: 1, heroId: 15, scope: SCOPE, limitations: LIMITATIONS,
    canonicalSources: Object.fromEntries(Object.entries(inputs).map(([key, value]) => [key, { path: PATHS[key], scope: value.scope, ...(value.sourceScope === undefined ? {} : { sourceScope: value.sourceScope }) }])),
    templates: inputs.hero.records.filter(row => row.heroId === 15).map(reference => ({
      reference,
      rawDetail: lookup(inputs.templates.records, 'templateId', reference.templateId),
      levels: inputs.levels.records.filter(row => row.templateId === reference.templateId).map(levelReference => {
        const id = levelReference.levelUpInfoId;
        const previous = inputs.previous.records.filter(row => row.levelUpInfoId === id);
        if (previous.length > 1) throw new Error(`Duplicate previous reference ${id}`);
        return {
          reference: levelReference,
          rawDetail: lookup(inputs.raw.records, 'levelUpInfoId', id),
          previousReference: previous.length ? { state: 'ADMITTED', record: previous[0] } : { state: 'NO_ADMITTED_REFERENCE' },
          propertyRawDetail: lookup(inputs.properties.records, 'levelUpInfoId', id),
          materials: inputs.materials.records.filter(row => row.levelUpInfoId === id).map(reference => ({
            reference, itemEndpoint: lookup(inputs.materials.itemEndpoints, 'itemId', reference.rawMaterial.Id),
          })),
        };
      }),
    })),
  };
}
export const render = inputs => `${JSON.stringify(project(inputs), null, 2)}\n`;
export async function generate(root = process.cwd()) { await writeFile(resolve(root, OUTPUT), render(await loadInputs(root))); }
if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) await generate();
