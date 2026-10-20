import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

const EVIDENCE_PATH = 'evidence/localization/production-names-ko.v1.json';
const CANONICAL_PATH = 'canonical/production-localizations-ko.v1.json';
const EXPECTED = new Map([
  [3, { nameCn: '梦幻模拟战手游I', nameKo: '랑그릿사 모바일 Ch.1' }],
  [4, { nameCn: '梦幻模拟战I', nameKo: '랑그릿사I' }],
  [5, { nameCn: '梦幻模拟战II', nameKo: '랑그릿사II' }],
  [6, { nameCn: '梦幻模拟战III', nameKo: '랑그릿사III' }],
  [7, { nameCn: '梦幻模拟战IV', nameKo: '랑그릿사IV' }],
]);
const EXPECTED_IDS = [...EXPECTED.keys()];
const fail = (message) => { throw new Error('Production Korean localization validation failed: ' + message); };
const check = (condition, message) => { if (!condition) fail(message); };
const exactKeys = (value, fields, label) => check(value && typeof value === 'object' && !Array.isArray(value)
  && isDeepStrictEqual(Object.keys(value).sort(), [...fields].sort()), label + ' fields drift');

export function validateProductionKoLocalization({ identities, relations, heroes, evidence, localization }) {
  check(identities.schemaVersion === 1 && Array.isArray(identities.records), 'Production identity owner schema mismatch');
  const identityIds = identities.records.map(({ productionId }) => productionId);
  check(isDeepStrictEqual(identityIds, EXPECTED_IDS), 'current Production identity set/order changed; reassess scope');
  check(relations.schemaVersion === 1 && Array.isArray(relations.records),
    'Hero–Production Canonical schema mismatch');
  check(heroes?.schemaVersion === 1 && Array.isArray(heroes.records),
    'Hero presentation Canonical schema mismatch');

  exactKeys(evidence, ['schemaVersion', 'canonical', 'generated', 'productionRuntimeDependency', 'inputClassification',
    'sourceDescription', 'officialKrProvenanceStatus', 'scope', 'records', 'limitations'], 'localization evidence');
  check(evidence.schemaVersion === 1 && evidence.canonical === false && evidence.generated === false
    && evidence.productionRuntimeDependency === false, 'evidence authority boundary drift');
  check(evidence.inputClassification === 'PROJECT_REVIEWED_LOCALIZATION'
    && evidence.officialKrProvenanceStatus === 'unverified'
    && evidence.sourceDescription === 'Korean Production display-name mapping explicitly supplied in the user instruction for this task.',
  'input classification, provenance status, or source description drift');
  exactKeys(evidence.scope, ['claim', 'productionIds', 'consumer'], 'evidence scope');
  check(evidence.scope.claim === 'Project-reviewed Korean Production display label by exact existing Canonical ProductionID.'
    && isDeepStrictEqual(evidence.scope.productionIds, EXPECTED_IDS)
    && evidence.scope.consumer === 'Current seven-Hero presentation slice only.', 'evidence target or consumer scope drift');
  check(isDeepStrictEqual(evidence.limitations, [
    'Official Korean-server terminology and release status are unverified.',
    'This input supports display localization only; it does not establish Production identity, population, Hero relation, release status, or game semantics.',
  ]), 'evidence limitations drift');
  check(Array.isArray(evidence.records) && evidence.records.length === EXPECTED.size, 'evidence record count mismatch');
  const identityById = new Map(identities.records.map((row) => [row.productionId, row]));
  const evidenceById = new Map();
  for (const row of evidence.records) {
    exactKeys(row, ['productionId', 'nameCn', 'nameKo', 'locator', 'reviewStatus'], 'evidence Production ' + row.productionId);
    const expected = EXPECTED.get(row.productionId);
    check(expected && row.nameCn === expected.nameCn && row.nameKo === expected.nameKo
      && row.nameCn === identityById.get(row.productionId)?.nameCn
      && row.locator === 'user-instruction#ProductionID=' + row.productionId
      && row.reviewStatus === 'PROJECT_REVIEWED', 'input or Canonical identity mismatch for Production ' + row.productionId);
    check(!evidenceById.has(row.productionId), 'duplicate evidence Production ' + row.productionId);
    evidenceById.set(row.productionId, row);
  }
  check(isDeepStrictEqual([...evidenceById.keys()], EXPECTED_IDS), 'evidence Production ID set/order mismatch');

  exactKeys(localization, ['schemaVersion', 'purpose', 'sourceScope', 'inputClassification',
    'officialKrProvenanceStatus', 'evidence', 'records'], 'Canonical localization owner');
  check(localization.schemaVersion === 1
    && localization.purpose === 'Project-reviewed Korean Production display localization only; not Production identity, population, relation, release status, or official Korean-server authority.'
    && localization.sourceScope === 'Exact ProductionID mapping for the five explicitly supplied project-reviewed Korean display names that exist in the current Canonical identity owner; consumed only by the current seven-Hero presentation slice.'
    && localization.inputClassification === 'PROJECT_REVIEWED_LOCALIZATION'
    && localization.officialKrProvenanceStatus === 'unverified'
    && localization.evidence === EVIDENCE_PATH, 'Canonical localization metadata/provenance drift');
  check(Array.isArray(localization.records) && localization.records.length === EXPECTED.size, 'Canonical localization count mismatch');
  const localizationById = new Map();
  for (const row of localization.records) {
    exactKeys(row, ['productionId', 'nameKo', 'evidenceClass', 'provenance'], 'Canonical Production ' + row.productionId);
    const expected = EXPECTED.get(row.productionId);
    check(expected && row.nameKo === expected.nameKo && row.evidenceClass === 'A'
      && row.provenance === EVIDENCE_PATH + '#ProductionID=' + row.productionId,
      'Canonical localization or provenance mismatch for Production ' + row.productionId);
    check(!localizationById.has(row.productionId), 'duplicate Canonical localization Production ' + row.productionId);
    localizationById.set(row.productionId, row);
  }
  check(isDeepStrictEqual([...localizationById.keys()], EXPECTED_IDS), 'Canonical localization ID set/order mismatch');
  check(EXPECTED_IDS.every((id) => identityById.has(id)), 'localization target missing from Production identity owner');
  const presentationHeroIds = heroes.records.map((row) => row.id);
  check(presentationHeroIds.every(Number.isSafeInteger) && new Set(presentationHeroIds).size === presentationHeroIds.length,
    'presentation Hero IDs are malformed or duplicated');
  for (const heroId of presentationHeroIds) {
    const heroRelations = relations.records.filter((row) => row.heroId === heroId);
    check(heroRelations.length === 1, 'presentation Hero ' + heroId + ' must have exactly one Production relation');
    check(localizationById.has(heroRelations[0].productionId),
      'presentation Hero ' + heroId + ' references an unlocalized Production ID');
  }
  return {
    localizedIds: [...localizationById.keys()],
    identityCount: identityIds.length,
    relationCount: relations.records.length,
    presentationRelationCount: presentationHeroIds.length,
  };
}

export async function loadProductionKoLocalizationInputs(root = process.cwd()) {
  const read = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
  const [identities, relations, heroes, evidence, localization] = await Promise.all([
    read('canonical/production-identities.v1.json'),
    read('canonical/hero-production-relations.v1.json'),
    read('canonical/heroes.v1.json'),
    read(EVIDENCE_PATH),
    read(CANONICAL_PATH),
  ]);
  return { identities, relations, heroes, evidence, localization };
}

export async function validateProductionKoLocalizationFromDisk(root = process.cwd()) {
  return validateProductionKoLocalization(await loadProductionKoLocalizationInputs(root));
}

if (process.argv[1] && resolve(process.argv[1]) === resolve('tools/validate-production-ko-localization.mjs')) {
  const result = await validateProductionKoLocalizationFromDisk();
  process.stdout.write('Production Korean localization: PASS (' + result.localizedIds.length + ' IDs; '
    + result.identityCount + ' identities; ' + result.presentationRelationCount
    + ' presentation relations across ' + result.relationCount + ' Canonical relations)\n');
}
