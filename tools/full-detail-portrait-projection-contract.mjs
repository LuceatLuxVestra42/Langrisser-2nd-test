import { HERO_FULL_DETAIL_CURRENT_IDS } from './hero-full-detail-population-migration-contract.mjs';

export const FULL_DETAIL_PORTRAIT_PROJECTION_CONTRACT = Object.freeze({
  canonicalField: 'portrait',
  publicGeneratedField: 'portrait',
  absenceRepresentation: 'OMIT_FIELD',
  publicAssetPathPattern: /^assets\/portraits\/[^/]+\.png$/,
  preservedCurrentPublicHeroIds: Object.freeze([...HERO_FULL_DETAIL_CURRENT_IDS]),
  newHeroPortraitDefault: 'WITHHELD_UNTIL_FIELD_SPECIFIC_ASSET_PUBLICATION_APPROVAL',
  populationMigrationRequiresPortraitPublicationApproval: false,
  publicPortraitExposureRequiresPublicationApproval: true,
  canonicalPortraitReferenceRequiresOwnerAdmission: true,
});

const preservedIds = new Set(FULL_DETAIL_PORTRAIT_PROJECTION_CONTRACT.preservedCurrentPublicHeroIds);
const fail = (message) => { throw new Error(`Full Detail portrait projection contract: ${message}`); };
const equal = (left, right) => JSON.stringify(left) === JSON.stringify(right);

export function projectFullDetailPortraitField(record) {
  if (!record || !Number.isSafeInteger(record.id)) fail('Hero record requires an explicit integer ID');
  if (!preservedIds.has(record.id)) return {};
  if (typeof record.portrait !== 'string' || !FULL_DETAIL_PORTRAIT_PROJECTION_CONTRACT.publicAssetPathPattern.test(record.portrait)) {
    fail(`preserved public portrait is missing or malformed for Hero ${record.id}`);
  }
  return { portrait: record.portrait };
}
export function validateFullDetailPortraitProjection({ canonical, generated, allowPopulationExtension = false }) {
  if (!Array.isArray(canonical?.records) || !Array.isArray(generated?.heroes)) fail('Canonical and Generated records must be arrays');
  const canonicalIds = canonical.records.map(({ id }) => id);
  const generatedIds = generated.heroes.map(({ id }) => id);
  if (new Set(canonicalIds).size !== canonicalIds.length || new Set(generatedIds).size !== generatedIds.length
    || !equal(generatedIds, canonicalIds)) fail('Canonical and Generated Hero IDs must remain unique and in exact parity');
  const preservedIdsInCanonical = canonicalIds.filter((id) => preservedIds.has(id));
  if (!equal(preservedIdsInCanonical, FULL_DETAIL_PORTRAIT_PROJECTION_CONTRACT.preservedCurrentPublicHeroIds)) {
    fail('the existing 29 public Full Detail Hero IDs and their relative order must be preserved');
  }
  if (!allowPopulationExtension && !equal(canonicalIds, FULL_DETAIL_PORTRAIT_PROJECTION_CONTRACT.preservedCurrentPublicHeroIds)) {
    fail('current Full Detail population must remain exactly 29 until the Population Migration is effective');
  }
  const canonicalById = new Map(canonical.records.map((row) => [row.id, row]));
  for (const hero of generated.heroes) {
    const source = canonicalById.get(hero.id);
    const expected = projectFullDetailPortraitField(source);
    const hasExpectedPortrait = Object.hasOwn(expected, 'portrait');
    if (Object.hasOwn(hero, 'portrait') !== hasExpectedPortrait
      || (hasExpectedPortrait && !equal({ portrait: hero.portrait }, expected))) {
      fail(`existing Public portrait field changed for Hero ${hero.id}`);
    }
  }
  return true;
}
