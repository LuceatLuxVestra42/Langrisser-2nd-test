import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

const EXPECTED_NAMES = new Map([
  [1, '시대의 주역'], [2, '빛의 군단'], [4, '제국의 빛'], [5, '어둠의 윤회'],
  [6, '공주 연맹'], [7, '전략의 대가'], [8, '메테오 스트라이크'], [9, '전설의 저편'], [11, '초월 영역'],
]);
const EXPECTED_FACTION_IDS = [1, 2, 4, 5, 6, 7, 8, 9, 11];
const PRESENTATION_HERO_IDS = new Set([1, 3, 5, 6, 8, 10, 12, 13, 25, 28, 32, 52, 53, 55]);
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
  check(relations.schemaVersion === 1 && Array.isArray(relations.records), 'Hero–Faction relation owner schema mismatch');
  const presentationRelations = relations.records.filter((relation) => PRESENTATION_HERO_IDS.has(relation.heroId));
  check(presentationRelations.length === 32,
    'current presentation relation projection changed; reassess this task scope');
  check(evidence.schemaVersion === 1 && evidence.canonical === false && evidence.generated === false
    && evidence.productionRuntimeDependency === false, 'evidence authority boundary changed');
  check(evidence.inputClassification === 'PROJECT_REVIEWED_LOCALIZATION'
    && evidence.officialKrProvenanceStatus === 'unverified'
    && evidence.scope?.claim === 'Project-reviewed Korean Faction display label by exact existing Canonical FactionID.',
  'input classification, provenance state, or claim scope drift');
  check(isDeepStrictEqual(evidence.scope?.factionIds, [...EXPECTED_NAMES.keys()])
    && evidence.scope?.consumer === 'Current Hero Presentation slice only.', 'evidence target/consumer scope drift');
  check(isDeepStrictEqual(evidence.limitations, [
    'Official Korean-server terminology and release status are unverified.',
    'Faction 3 is outside the current Canonical population and this localization scope; its supplied label is not admitted.',
    'This input supports display localization only; it does not establish identity, population, relation, release status, or mechanics.',
  ]), 'evidence limitations drift');
  check(Array.isArray(evidence.records) && evidence.records.length === EXPECTED_NAMES.size, 'evidence record count mismatch');
  const evidenceById = new Map();
  for (const row of evidence.records) {
    exactKeys(row, ['factionId', 'nameKo', 'nameCn', 'locator', 'reviewStatus'], `evidence Faction ${row.factionId}`);
    check(EXPECTED_NAMES.has(row.factionId) && row.nameKo === EXPECTED_NAMES.get(row.factionId)
      && row.nameCn === identities.records.find((identity) => identity.factionId === row.factionId)?.nameCn
      && row.locator === `user-instruction#FactionID=${row.factionId}`
      && row.reviewStatus === 'PROJECT_REVIEWED', `input value/provenance mismatch for Faction ${row.factionId}`);
    check(!evidenceById.has(row.factionId), `duplicate evidence Faction ${row.factionId}`);
    evidenceById.set(row.factionId, row);
  }
  check(isDeepStrictEqual([...evidenceById.keys()], [...EXPECTED_NAMES.keys()]), 'evidence ID set/order mismatch');
  check(isDeepStrictEqual(evidence.outOfScope, [{
    factionId: 3, nameCn: '光之起源', nameKo: '빛의 기원', status: 'OUT_OF_SCOPE',
    reason: 'Faction 3 is outside the current Canonical population scoped to the admitted seven-Hero relation slice; no Identity, Relation, or Canonical localization is admitted.',
  }]), 'Faction 3 out-of-scope boundary drift');

  exactKeys(localization, ['schemaVersion', 'purpose', 'sourceScope', 'inputClassification',
    'officialKrProvenanceStatus', 'evidence', 'untranslatedFactionIds', 'records'], 'canonical localization owner');
  check(localization.schemaVersion === 1 && localization.inputClassification === evidence.inputClassification
    && localization.officialKrProvenanceStatus === 'unverified'
    && localization.evidence === EVIDENCE_PATH, 'canonical localization metadata/provenance drift');
  check(isDeepStrictEqual(localization.untranslatedFactionIds, []), 'all supplied current Canonical Faction IDs must be localized');
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
  check(!canonicalById.has(3) && canonicalById.has(11), 'Faction 3 exclusion or Faction 11 admission boundary drift');
  check([...EXPECTED_NAMES.keys()].every((id) => identityIds.includes(id)), 'localization target missing from current Canonical identity owner');
  return { localizedIds: [...canonicalById.keys()], untranslatedIds: localization.untranslatedFactionIds, outOfScopeIds: [3], relationCount: presentationRelations.length };
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
  process.stdout.write(`Faction Korean localization: PASS (${result.localizedIds.length} localized IDs; Faction 3 OUT_OF_SCOPE; 32 presentation relations)\n`);
}
