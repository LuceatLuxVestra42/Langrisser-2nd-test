import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';

const EVIDENCE_PATH = 'evidence/localization/production-names-ko.v1.json';
const CANONICAL_PATH = 'canonical/production-localizations-ko.v1.json';
const REFERENCE_PATH = 'evidence/localization/source/production-names-ko.reference.v1.txt';
const REFERENCE_SHA256 = '945957a30a35126f477d8efcdeabd013785eeb1032fe2a04bc18ee184df9093c';
const EXPECTED_IDS = [3, 4, 5, 6, 7, 8];
const EXPECTED_CN = new Map([
  [3, '梦幻模拟战手游I'],
  [4, '梦幻模拟战I'],
  [5, '梦幻模拟战II'],
  [6, '梦幻模拟战III'],
  [7, '梦幻模拟战IV'],
  [8, '梦幻模拟战V'],
]);
const fail = (message) => { throw new Error('Production Korean localization validation failed: ' + message); };
const check = (condition, message) => { if (!condition) fail(message); };
const exactKeys = (value, fields, label) => check(value && typeof value === 'object' && !Array.isArray(value)
  && isDeepStrictEqual(Object.keys(value).sort(), [...fields].sort()), label + ' fields drift');

function parseProductionReference(referenceBytes) {
  const bytes = Buffer.from(referenceBytes);
  check(createHash('sha256').update(bytes).digest('hex') === REFERENCE_SHA256,
    'Production localization reference snapshot checksum mismatch');
  const lines = bytes.toString('utf8').split(/\r?\n/);
  const rows = new Map();
  let inProductions = false;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim() === '[출전작]') { inProductions = true; continue; }
    if (line.trim() === '[진영]') { inProductions = false; continue; }
    if (!inProductions || !line.trim() || line.trim().startsWith('#')) continue;
    const match = line.match(/^(\d+) - (.*)$/);
    check(match, 'malformed Production reference row at line ' + (index + 1));
    const productionId = Number(match[1]);
    check(!rows.has(productionId), 'duplicate Production reference ID ' + productionId);
    const row = { productionId, line: index + 1 };
    if (EXPECTED_CN.has(productionId)) {
      const prefix = productionId + ' - ' + EXPECTED_CN.get(productionId) + ' - ';
      check(line.startsWith(prefix), 'Production reference Chinese identity mismatch for ID ' + productionId);
      row.nameCn = EXPECTED_CN.get(productionId);
      row.nameKo = line.slice(prefix.length);
      check(row.nameKo.trim().length > 0, 'empty Production reference Korean label for ID ' + productionId);
    }
    rows.set(productionId, row);
  }
  for (const id of EXPECTED_IDS) check(rows.has(id), 'missing Production reference ID ' + id);
  check(rows.get(8).line === 50 && lines[49] === '8 - 梦幻模拟战V - 랑그릿사V',
    'ID 8 Korean display label source row/line locator mismatch');
  return rows;
}


export function validateProductionKoLocalization({ identities, relations, heroes, evidence, localization, referenceBytes }) {
  const sourceById = parseProductionReference(referenceBytes);
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
  check(evidence.inputClassification === 'PROJECT_SUPPLIED_LOCALIZATION'
    && evidence.officialKrProvenanceStatus === 'unverified'
    && evidence.sourceDescription === 'Korean Production display-name reference supplied as project_sources/04-txt; preserved verbatim at evidence/localization/source/production-names-ko.reference.v1.txt (SHA-256 945957a30a35126f477d8efcdeabd013785eeb1032fe2a04bc18ee184df9093c). ID 8 is sourced from line 50.',
  'input classification, provenance status, or source description drift');
  exactKeys(evidence.scope, ['claim', 'productionIds', 'consumer'], 'evidence scope');
  check(evidence.scope.claim === 'Project-supplied Korean Production display label by exact existing Canonical ProductionID.'
    && isDeepStrictEqual(evidence.scope.productionIds, EXPECTED_IDS)
    && evidence.scope.consumer === 'Current seven-Hero presentation slice only.', 'evidence target or consumer scope drift');
  check(isDeepStrictEqual(evidence.limitations, [
    'Official Korean-server terminology and release status are unverified.',
    'This input supports display localization only; it does not establish Production identity, population, Hero relation, release status, or game semantics.',
  ]), 'evidence limitations drift');
  check(Array.isArray(evidence.records) && evidence.records.length === EXPECTED_IDS.length, 'evidence record count mismatch');
  const identityById = new Map(identities.records.map((row) => [row.productionId, row]));
  const evidenceById = new Map();
  for (const row of evidence.records) {
    exactKeys(row, ['productionId', 'nameCn', 'nameKo', 'locator', 'reviewStatus'], 'evidence Production ' + row.productionId);
    const source = sourceById.get(row.productionId);
    check(source && row.nameCn === source.nameCn && row.nameKo === source.nameKo
      && row.nameCn === identityById.get(row.productionId)?.nameCn
      && row.locator === (row.productionId === 8 ? REFERENCE_PATH + '#L' + source.line : 'user-instruction#ProductionID=' + row.productionId)
      && row.reviewStatus === (row.productionId === 8 ? 'PROJECT_REFERENCE' : 'PROJECT_REVIEWED'),
    'Source or identity parity mismatch for Production ' + row.productionId);
    check(!evidenceById.has(row.productionId), 'duplicate evidence Production ' + row.productionId);
    evidenceById.set(row.productionId, row);
  }
  check(isDeepStrictEqual([...evidenceById.keys()], EXPECTED_IDS), 'evidence Production ID set/order mismatch');

  exactKeys(localization, ['schemaVersion', 'purpose', 'sourceScope', 'inputClassification',
    'officialKrProvenanceStatus', 'evidence', 'records'], 'Canonical localization owner');
  check(localization.schemaVersion === 1
    && localization.purpose === 'Project-supplied Korean Production display localization references only; not Production identity, population, relation, release status, or official Korean-server authority.'
    && localization.sourceScope === 'Exact ProductionID mapping for project-supplied Korean display-name references that exist in the current Canonical identity owner; consumed only by the current seven-Hero presentation slice.'
    && localization.inputClassification === 'PROJECT_SUPPLIED_LOCALIZATION'
    && localization.officialKrProvenanceStatus === 'unverified'
    && localization.evidence === EVIDENCE_PATH, 'Canonical localization metadata/provenance drift');
  check(Array.isArray(localization.records) && localization.records.length === EXPECTED_IDS.length, 'Canonical localization count mismatch');
  const localizationById = new Map();
  for (const row of localization.records) {
    exactKeys(row, ['productionId', 'nameKo', 'evidenceClass', 'provenance'], 'Canonical Production ' + row.productionId);
    const source = sourceById.get(row.productionId);
    const evidenceRow = evidenceById.get(row.productionId);
    check(source && evidenceRow && row.nameKo === source.nameKo && row.nameKo === evidenceRow.nameKo
      && row.evidenceClass === 'A'
      && row.provenance === EVIDENCE_PATH + '#ProductionID=' + row.productionId,
      'Source-to-Evidence-to-Canonical localization parity or provenance mismatch for Production ' + row.productionId);
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
  const [identities, relations, heroes, evidence, localization, referenceBytes] = await Promise.all([
    read('canonical/production-identities.v1.json'),
    read('canonical/hero-production-relations.v1.json'),
    read('canonical/heroes.v1.json'),
    read(EVIDENCE_PATH),
    read(CANONICAL_PATH),
    readFile(resolve(root, REFERENCE_PATH)),
  ]);
  return { identities, relations, heroes, evidence, localization, referenceBytes };
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
