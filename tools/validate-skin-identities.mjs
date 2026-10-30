import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const canonicalPath = 'canonical/skin-identities.v1.json';
const evidencePath = 'evidence/source/skin-identity-m01.v1.json';
const subsetPath = 'evidence/source/configdata/ConfigDataHeroSkinInfo.records-identity-m01.v1.json';
// The explicit M01 approval set is local to this slice, never a domain-completeness rule.
const approvedIds = [102, 103, 104, 105];
const historicalOrders = new Map([[102, 1], [103, 2], [104, 3], [105, 4]]);
const scope = 'M01: source-native Skin Identity 102, 103, 104, 105 only; historical China ConfigData snapshot, not global Skin completeness or current release status.';
const check = (ok, message) => { if (!ok) throw new Error(`Skin identity validation failed: ${message}`); };
const equal = (a, b, label) => check(isDeepStrictEqual(a, b), label);
const keys = (value, fields, label) => {
  check(value && typeof value === 'object' && !Array.isArray(value), `${label}: object required`);
  equal(Object.keys(value).sort(), [...fields].sort(), `${label}: fields drift`);
};
const population = (rows, field, label) => {
  check(Array.isArray(rows), `${label}: array required`);
  const ids = rows.map(row => row?.[field]);
  check(ids.every(Number.isSafeInteger), `${label}: integer ID required`);
  check(new Set(ids).size === ids.length, `${label}: duplicate ID`);
  equal([...ids].sort((a, b) => a - b), approvedIds, `${label}: unapproved or missing ID`);
};

export async function validateSkinIdentities(root = process.cwd()) {
  const read = path => readFile(resolve(root, path), 'utf8');
  const [canonicalText, evidenceText, subsetText] = await Promise.all([
    read(canonicalPath), read(evidencePath), read(subsetPath),
  ]);
  const canonical = JSON.parse(canonicalText);
  const evidence = JSON.parse(evidenceText);
  const subset = JSON.parse(subsetText);
  population(subset, 'ID', 'source subset');
  // Pinned from the independently retrieved raw source projection, not canonical or generator output.
  check(createHash('sha256').update(subsetText).digest('hex')
    === '2eadf99858cf33ff5aa8a1a6d783de6ced8517ea0bf59192d6cc63b4c1bc57d0', 'source subset bytes drift');
  for (const row of subset) keys(row, ['ID', 'Name'], 'source subset record');
  keys(canonical, ['schemaVersion', 'scope', 'sourceEvidence', 'records'], 'canonical');
  check(canonical.schemaVersion === 1 && canonical.scope === scope
    && canonical.sourceEvidence === evidencePath, 'canonical schema, scope or evidence pointer');
  check(evidence.schemaVersion === 1 && evidence.claimType === 'skin-identity'
    && evidence.scope === scope, 'evidence schema or claim scope');
  const source = evidence.source;
  check(source?.family === 'China ConfigData'
    && source.repository === 'LuceatLuxVestra42/langrisser-future-guide'
    && source.commit === '6475e63ee23d18adf733756c26a14fa9e3ed662c'
    && source.path === 'data/configdata/ConfigDataHeroSkinInfo.json'
    && source.blobSha1 === 'f6bd2611114ae8ae8aec24d8f304b94f2c314dc9'
    && source.sha256 === '6fe685622a57a6546f4cce73ff788057605fca215eba6327eff66c3b5d4847c7'
    && source.sizeBytes === 563343 && source.preservedSubset === subsetPath, 'source snapshot anchor');
  check(typeof source.selection === 'string' && source.selection.includes('[102, 103, 104, 105]')
    && typeof source.transformation === 'string' && source.transformation.startsWith('ID -> skinId'), 'selection/transformation provenance');
  check(evidence.semanticBasis?.identityField === 'ConfigDataHeroSkinInfo.ID', 'source-native identity meaning');
  equal(evidence.semanticBasis?.preservedInterpretation, {
    detailSource: 'ConfigDataHeroSkinInfo',
    join: 'ConfigDataHeroInfo.Skins_ID[] -> ConfigDataHeroSkinInfo.ID',
  }, 'preserved source interpretation');
  const legacy = evidence.legacyComparison;
  check(legacy?.repository === source.repository && legacy.commit === '57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff'
    && legacy.referencesOnly === true, 'historical comparison scope');
  const anchors = new Map([
    ['data/contracts/skin-stage1-input-contract.v1.json', 'c2550a67e5538bf86dfad90fbc95b535b19dd4af'],
    ['data/generated/skin-stage1-canonical.v1.json', 'acd83dc94e4ef30841f53ad464ae53a9ffef92b7'],
    ['data/validation/skin-stage1-2-parity.v1.json', 'f7e5e03dbe7b89cb6e79f144eea8a8111e1c202d'],
    ['data/generated/skin-stage2-3-bidirectional-relation.v1.json', 'c69bc6a970909b66502574dcd709d3c731607ead'],
    ['data/contracts/skin-stage2-5-consumer-contract.v1.json', 'a7bc76818ad6bb20c1b27e1e7914e1ded885b7dc'],
    ['data/validation/skin-stage2-5-final.v1.json', '1ea21a2c72be78daab8ae7b326976544432b617b'],
    ['data/validation/hero-page-stage5-5-2-source-trace.v1.json', '84dc6c6b895120ec992d3fbf7ff70cdd62272de9'],
    ['scripts/build_hero_page_stage5_5_3.cjs', '764c6cb7c0464b7ce34738210158a681926b6a66'],
    ['scripts/generate-skin-stage1-1.py', '0155c2dd789201194f761efd2834153aaa311f49'],
  ]);
  check(Array.isArray(legacy.artifacts) && legacy.artifacts.length === anchors.size, 'historical evidence anchors');
  const paths = new Set();
  for (const artifact of legacy.artifacts) {
    check(anchors.get(artifact.path) === artifact.blobSha1 && !paths.has(artifact.path), 'historical blob anchor');
    paths.add(artifact.path);
  }
  check(typeof legacy.transformationProvenance === 'string' && legacy.transformationProvenance.trim()
    && typeof legacy.rawSnapshotLimitation === 'string' && legacy.rawSnapshotLimitation.trim(), 'historical transformation provenance');
  check(Array.isArray(evidence.limitations) && evidence.limitations.length >= 4
    && evidence.limitations.every(value => typeof value === 'string' && value.trim()), 'scope limitations');
  population(evidence.records, 'skinId', 'evidence');
  population(canonical.records, 'skinId', 'canonical');
  const sourceById = new Map(subset.map(row => [row.ID, row]));
  for (const row of evidence.records) {
    keys(row, ['skinId', 'evidenceClass', 'sourceLocator', 'preservedLocator', 'sourceName', 'legacyLocator',
      'comparisonOnly', 'contradiction', 'decision'], 'identity evidence');
    // This admission has direct A support. A future inherited B claim needs its own reviewed evidence path.
    check(row.evidenceClass === 'A' && row.decision === 'ADMIT_IDENTITY_ONLY', 'A provenance required for M01');
    check(row.sourceLocator === `data/configdata/ConfigDataHeroSkinInfo.json#records[ID=${row.skinId}].ID`
      && row.preservedLocator === `${subsetPath}#records[ID=${row.skinId}].ID`, 'source-native locator');
    check(row.legacyLocator === `data/generated/skin-stage1-canonical.v1.json#records[skinId=${row.skinId}]`, 'historical locator');
    check(row.sourceName === sourceById.get(row.skinId)?.Name, 'reference name differs from preserved source');
    check(row.contradiction === 'NONE_OBSERVED_IN_INSPECTED_SCOPE', 'unresolved contradiction');
    keys(row.comparisonOnly, ['heroId', 'sourceOrder'], 'historical comparison');
    // Historical references only: not an admission or sorting rule for current/future identities.
    check(row.comparisonOnly.heroId === 1 && row.comparisonOnly.sourceOrder === historicalOrders.get(row.skinId),
      'historical comparison reference');
  }
  for (const row of canonical.records) {
    keys(row, ['skinId', 'provenance'], 'identity canonical record');
    check(sourceById.has(row.skinId), 'identity missing from source');
    check(row.provenance === `${evidencePath}#records/skinId=${row.skinId}`, 'claim provenance pointer');
  }
  process.stdout.write('Skin identity validator: PASS (four source-native A identities; no canonical relation/order/localization)\n');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await validateSkinIdentities();
}
