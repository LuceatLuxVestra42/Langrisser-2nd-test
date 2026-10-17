import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

const evidencePath = 'evidence/source/hero-origin-dictionary.v1.json';
const canonicalPath = 'canonical/production-identities.v1.json';
const expected = new Map([
  [3, '梦幻模拟战手游I'], [4, '梦幻模拟战I'], [5, '梦幻模拟战II'],
  [6, '梦幻模拟战III'], [7, '梦幻模拟战IV'],
]);
const fail = (message) => { throw new Error(`Production identity validation failed: ${message}`); };
const check = (condition, message) => { if (!condition) fail(message); };
const exactKeys = (value, fields, label) => check(value && typeof value === 'object' && !Array.isArray(value)
  && isDeepStrictEqual(Object.keys(value).sort(), [...fields].sort()), `${label} fields drift`);

export async function validateProductionIdentities(root = process.cwd()) {
  const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
  const [evidence, canonical] = await Promise.all([readJson(evidencePath), readJson(canonicalPath)]);
  check(evidence.schemaVersion === 1 && evidence.claimType === 'production-identity-chinese-display-name'
    && evidence.evidenceClass === 'B' && evidence.projection === true, 'dictionary evidence must remain an explicit inherited B projection');
  check(evidence.source?.repository === 'LuceatLuxVestra42/langrisser-future-guide'
    && evidence.source?.dictionaryArtifact?.path === 'data/validation/hero-page-stage5-5-2-origin.v1.json'
    && evidence.source?.dictionaryArtifact?.blobSha1 === 'ea119a55f2aaf42713c9ec196bcb5fc0e322b902'
    && evidence.source?.dictionaryArtifact?.dictionaryLocator === 'dictionary[productionId]'
    && evidence.source?.dictionaryBuilder?.path === 'scripts/build_hero_origin_map.cjs'
    && evidence.source?.dictionaryBuilder?.blobSha1 === 'e55e44c558c628e7b00a8eb8fc5f66232bfb0c69', 'dictionary provenance chain drift');
  check(evidence.legacyValidation?.originArtifactStatus === 'PASS'
    && evidence.legacyValidation?.originArtifactBlobSha1 === 'ea119a55f2aaf42713c9ec196bcb5fc0e322b902'
    && evidence.legacyValidation?.dictionaryFieldStatus === 'SOURCE_DICTIONARY_CONFIRMED'
    && evidence.legacyValidation?.dictionaryLanguage === 'zh-CN', 'Legacy dictionary validation scope drift');
  check(evidence.source?.externalValidation?.individualReferenceUrlsPreservedInArtifact === false,
    'external reference limitation must remain explicit');
  exactKeys(canonical, ['schemaVersion', 'scope', 'sourceEvidence', 'records'], 'Production identity canonical');
  check(canonical.schemaVersion === 1 && canonical.sourceEvidence === evidencePath
    && canonical.scope === 'Production identities referenced by the admitted seven-Hero presentation slice; validated Chinese source-display names only.',
  'canonical schema, scope, or evidence pointer drift');
  check(Array.isArray(evidence.records) && evidence.records.length === expected.size, 'dictionary evidence must contain exactly five scoped records');
  check(Array.isArray(canonical.records) && canonical.records.length === expected.size, 'canonical must contain exactly five scoped identities');
  const evidenceById = new Map();
  for (const row of evidence.records) {
    exactKeys(row, ['productionId', 'nameCn', 'sourceLocator'], `Dictionary evidence ${row.productionId}`);
    check(Number.isSafeInteger(row.productionId) && typeof row.nameCn === 'string' && row.nameCn.trim(), 'malformed dictionary evidence record');
    check(row.sourceLocator === `data/validation/hero-page-stage5-5-2-origin.v1.json#dictionary[productionId=${row.productionId}]`,
      `dictionary source locator drift for ID ${row.productionId}`);
    check(!evidenceById.has(row.productionId), `duplicate dictionary ID ${row.productionId}`);
    evidenceById.set(row.productionId, row.nameCn);
  }
  const canonicalIds = new Set();
  for (const row of canonical.records) {
    exactKeys(row, ['productionId', 'nameCn', 'provenance'], `Production identity ${row.productionId}`);
    check(Number.isSafeInteger(row.productionId) && typeof row.nameCn === 'string' && row.nameCn.trim(), 'malformed Production identity');
    check(expected.has(row.productionId), `unapproved Production ID ${row.productionId}`);
    check(!canonicalIds.has(row.productionId), `duplicate Production ID ${row.productionId}`);
    check(row.nameCn === expected.get(row.productionId) && row.nameCn === evidenceById.get(row.productionId),
      `dictionary/canonical name parity mismatch for ID ${row.productionId}`);
    check(row.provenance === `${evidencePath}#records/productionId=${row.productionId}`,
      `name provenance must point to Dictionary Evidence for ID ${row.productionId}`);
    canonicalIds.add(row.productionId);
  }
  check(isDeepStrictEqual([...canonicalIds].sort((a, b) => a - b), [...expected.keys()]), 'canonical Production ID set mismatch');
  process.stdout.write('Production identity validator: PASS (five scoped IDs, exact Legacy dictionary parity, independent B provenance)\n');
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  await validateProductionIdentities();
}
