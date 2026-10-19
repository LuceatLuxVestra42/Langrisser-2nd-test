import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

const EXPECTED_NAMES = new Map([
  [1, '시대의 주역'], [2, '빛의 군단'], [4, '제국의 빛'], [5, '어둠의 윤회'],
  [6, '공주 연맹'], [7, '전략의 대가'], [8, '메테오 스트라이크'], [9, '전설의 저편'],
]);
const EXPECTED_FACTION_IDS = [1, 2, 4, 5, 6, 7, 8, 9, 11];
const EVIDENCE_PATH = 'evidence/localization/faction-names-ko.v1.json';
const CANONICAL_PATH = 'canonical/faction-localizations-ko.v1.json';
const fail = (message) => { throw new Error(`Faction Korean localization validation failed: ${message}`); };
const check = (condition, message) => { if (!condition) fail(message); };
const exactKeys = (value, fields, label) => check(
  isDeepStrictEqual(Object.keys(value).sort(), [...fields].sort()), `${label} has unexpected or missing fields`,
);

export function validateFactionKoLocalization({ identities, relations, evidence, localization }) {
  check(identities.schemaVersion === 1 && Array.isArray(identities.records), 'Faction identity owner schema mismatch');
  const identityIds = identities.records.map(({ factionId }) => factionId);
  check(isDeepStrictEqual(identityIds, EXPECTED_FACTION_IDS), 'current Faction identity set/order changed; reassess this task scope');
  check(relations.schemaVersion === 1 && Array.isArray(relations.records) && relations.records.length === 17,
    'existing seven-Hero relation scope changed; reassess this task scope');
  check(evidence.schemaVersion === 1 && evidence.canonical === false && evidence.generated === false
    && evidence.productionRuntimeDependency === false, 'evidence authority boundary changed');
  check(evidence.inputClassification === 'PROJECT_REVIEWED_LOCALIZATION'
    && evidence.officialKrProvenanceStatus === 'unverified'
    && evidence.scope?.claim === 'Project-reviewed Korean Faction display label by exact existing Canonical FactionID.',
  'input classification, provenance state, or claim scope drift');
  check(isDeepStrictEqual(evidence.scope?.factionIds, [...EXPECTED_NAMES.keys()])
    && evidence.scope?.consumer === 'Current seven-Hero presentation slice only.', 'evidence target/consumer scope drift');
  check(isDeepStrictEqual(evidence.limitations, [
    'Official Korean-server terminology and release status are unverified.',
    'Faction 11 has no supplied Korean label and receives no localization record.',
    'This input supports display localization only; it does not establish identity, population, relation, or mechanics.',
  ]), 'evidence limitations drift');
  check(Array.isArray(evidence.records) && evidence.records.length === EXPECTED_NAMES.size, 'evidence record count mismatch');
  const evidenceById = new Map();
  for (const row of evidence.records) {
    exactKeys(row, ['factionId', 'nameKo', 'locator', 'reviewStatus'], `evidence Faction ${row.factionId}`);
    check(EXPECTED_NAMES.has(row.factionId) && row.nameKo === EXPECTED_NAMES.get(row.factionId)
      && row.locator === `user-instruction#FactionID=${row.factionId}`
      && row.reviewStatus === 'PROJECT_REVIEWED', `input value/provenance mismatch for Faction ${row.factionId}`);
    check(!evidenceById.has(row.factionId), `duplicate evidence Faction ${row.factionId}`);
    evidenceById.set(row.factionId, row);
  }
  check(isDeepStrictEqual([...evidenceById.keys()], [...EXPECTED_NAMES.keys()]), 'evidence ID set/order mismatch');
  check(isDeepStrictEqual(evidence.manualReview, [{
    factionId: 3, status: 'MANUAL_REVIEW',
    reason: 'No FactionID=3 exists in the current Canonical Faction identity owner; do not create identity or relation.',
  }]), 'Faction 3 manual-review boundary drift');

  exactKeys(localization, ['schemaVersion', 'purpose', 'sourceScope', 'inputClassification',
    'officialKrProvenanceStatus', 'evidence', 'untranslatedFactionIds', 'records'], 'canonical localization owner');
  check(localization.schemaVersion === 1 && localization.inputClassification === evidence.inputClassification
    && localization.officialKrProvenanceStatus === 'unverified'
    && localization.evidence === EVIDENCE_PATH, 'canonical localization metadata/provenance drift');
  check(isDeepStrictEqual(localization.untranslatedFactionIds, [11]), 'Faction 11 must remain explicitly untranslated');
  check(Array.isArray(localization.records) && localization.records.length === EXPECTED_NAMES.size, 'canonical localization count mismatch');
  const canonicalById = new Map();
  for (const row of localization.records) {
    exactKeys(row, ['factionId', 'nameKo', 'evidenceClass', 'provenance'], `canonical Faction ${row.factionId}`);
    check(EXPECTED_NAMES.has(row.factionId) && row.nameKo === EXPECTED_NAMES.get(row.factionId)
      && row.evidenceClass === 'A'
      && row.provenance === `${EVIDENCE_PATH}#FactionID=${row.factionId}`,
    `canonical localization/provenance mismatch for Faction ${row.factionId}`);
    check(!canonicalById.has(row.factionId), `duplicate canonical localization Faction ${row.factionId}`);
    canonicalById.set(row.factionId, row);
  }
  check(isDeepStrictEqual([...canonicalById.keys()], [...EXPECTED_NAMES.keys()]), 'canonical localization ID set/order mismatch');
  check(!canonicalById.has(3) && !canonicalById.has(11), 'excluded or untranslated Faction has a Korean localization');
  check([...EXPECTED_NAMES.keys()].every((id) => identityIds.includes(id)), 'localization target missing from current Canonical identity owner');
  return { localizedIds: [...canonicalById.keys()], untranslatedIds: localization.untranslatedFactionIds, manualReviewIds: [3], relationCount: relations.records.length };
}

export async function loadFactionKoLocalizationInputs(root = process.cwd()) {
  const read = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
  const [identities, relations, evidence, localization] = await Promise.all([
    read('canonical/faction-identities.v1.json'),
    read('canonical/hero-faction-relations.v1.json'),
    read(EVIDENCE_PATH),
    read(CANONICAL_PATH),
  ]);
  return { identities, relations, evidence, localization };
}

export async function validateFactionKoLocalizationFromDisk(root = process.cwd()) {
  return validateFactionKoLocalization(await loadFactionKoLocalizationInputs(root));
}

if (process.argv[1] && resolve(process.argv[1]) === resolve('tools/validate-faction-ko-localization.mjs')) {
  const result = await validateFactionKoLocalizationFromDisk();
  process.stdout.write(`Faction Korean localization: PASS (${result.localizedIds.length} localized IDs; 11 untranslated; 3 MANUAL_REVIEW; 17 existing relations)\n`);
}
