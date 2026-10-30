import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const canonicalPath = 'canonical/skin-source-orders-m02.v1.json';
const evidencePath = 'evidence/source/skin-source-orders-m02.v1.json';
const skinIdentityPath = 'canonical/skin-identities.v1.json';
const projectionPath = 'evidence/source/configdata/skin-relation-order-records-m02.v1.json';
const approvedIds = [102, 103, 104, 105];
const expectedSourceArray = [102, 103, 104, 105];
const scope = 'One-based Source Order for the four M01 Skin identities in ConfigDataHeroInfo.ID=1 at the pinned historical source snapshot only.';
const fail = message => { throw new Error(`M02 Skin Source Order validation failed: ${message}`); };
const check = (condition, message) => { if (!condition) fail(message); };
const equal = (a, b, message) => check(isDeepStrictEqual(a, b), message);
function exactKeys(value, fields, label) {
  check(value && typeof value === 'object' && !Array.isArray(value), `${label}: object required`);
  equal(Object.keys(value).sort(), [...fields].sort(), `${label}: fields drift`);
}
function exactPopulation(rows, field, label) {
  check(Array.isArray(rows), `${label}: array required`);
  const ids = rows.map(row => row?.[field]);
  check(ids.every(Number.isSafeInteger), `${label}: integer values required`);
  check(new Set(ids).size === ids.length, `${label}: duplicate values`);
  equal([...ids].sort((a, b) => a - b), approvedIds, `${label}: missing or additional Skin IDs`);
}
const sourceFiles = [
  { path: 'data/configdata/ConfigDataHeroInfo.json', blobSha1: '728daab3370f0c7779449663ea02e638677944d4', sizeBytes: 16894185, sha256: '2385599493d2598aa3f7d6b2c76ecdfd8615d91f19b6241933986282fcb17f7b' },
  { path: 'data/configdata/ConfigDataHeroSkinInfo.json', blobSha1: 'f6bd2611114ae8ae8aec24d8f304b94f2c314dc9', sizeBytes: 563343, sha256: '6fe685622a57a6546f4cce73ff788057605fca215eba6327eff66c3b5d4847c7' },
];
const legacyArtifacts = [
  ['data/contracts/skin-stage1-input-contract.v1.json', 'c2550a67e5538bf86dfad90fbc95b535b19dd4af'],
  ['data/generated/skin-stage1-canonical.v1.json', 'acd83dc94e4ef30841f53ad464ae53a9ffef92b7'],
  ['data/validation/skin-stage1-2-parity.v1.json', 'f7e5e03dbe7b89cb6e79f144eea8a8111e1c202d'],
  ['data/generated/skin-stage2-3-bidirectional-relation.v1.json', 'c69bc6a970909b66502574dcd709d3c731607ead'],
  ['data/contracts/skin-stage2-5-consumer-contract.v1.json', 'a7bc76818ad6bb20c1b27e1e7914e1ded885b7dc'],
  ['data/validation/skin-stage2-5-final.v1.json', '1ea21a2c72be78daab8ae7b326976544432b617b'],
  ['data/validation/hero-page-stage5-5-2-source-trace.v1.json', '84dc6c6b895120ec992d3fbf7ff70cdd62272de9'],
].map(([path, blobSha1]) => ({ path, blobSha1 }));

export async function validateSkinSourceOrders(root = process.cwd()) {
  const readText = path => readFile(resolve(root, path), 'utf8');
  const [canonicalText, evidenceText, skinText, projectionText] = await Promise.all([
    readText(canonicalPath), readText(evidencePath), readText(skinIdentityPath), readText(projectionPath),
  ]);
  const canonical = JSON.parse(canonicalText);
  const evidence = JSON.parse(evidenceText);
  const skinIdentity = JSON.parse(skinText);
  const projection = JSON.parse(projectionText);
  exactKeys(canonical, ['schemaVersion', 'scope', 'sourceEvidence', 'records'], 'order canonical');
  check(canonical.schemaVersion === 1 && canonical.scope === scope && canonical.sourceEvidence === evidencePath, 'canonical schema/scope/evidence pointer');
  exactPopulation(skinIdentity.records, 'skinId', 'M01 Skin Identity regression');
  exactPopulation(canonical.records, 'skinId', 'order canonical');

  exactKeys(evidence, ['schemaVersion', 'claimType', 'evidenceClass', 'scope', 'source', 'semanticBasis', 'legacySupport', 'limitations', 'records'], 'order evidence');
  check(evidence.schemaVersion === 1 && evidence.claimType === 'skin-source-order' && evidence.evidenceClass === 'A'
    && evidence.scope === 'One-based positions of M01 Skin IDs in the complete ConfigDataHeroInfo.ID=1 Skins_ID array at the pinned historical snapshot. No future population or UI sorting claim.', 'A provenance and order scope required');
  const source = evidence.source;
  check(source?.repository === 'LuceatLuxVestra42/langrisser-future-guide'
    && source.commit === '6475e63ee23d18adf733756c26a14fa9e3ed662c'
    && source.projectionPath === projectionPath
    && source.projectionSha256 === '063f36b71af111f6968024143ea40172b5654de1968e54a32d19fb956cdc987e', 'pinned source/projection anchor');
  equal(source.files, sourceFiles, 'full source file anchors');
  equal(createHash('sha256').update(projectionText).digest('hex'), source.projectionSha256, 'source projection digest mismatch');
  exactKeys(projection, ['heroInfoRecords', 'heroSkinInfoRecords'], 'source projection');
  equal(projection.heroInfoRecords, [{ ID: 1, Skins_ID: expectedSourceArray }], 'source array/order differs from frozen HeroInfo field');
  exactPopulation(projection.heroSkinInfoRecords, 'ID', 'identity endpoint source records');
  exactKeys(evidence.semanticBasis, ['orderedField', 'recordLocator', 'orderDefinition', 'populationBoundary'], 'order interpretation');
  check(evidence.semanticBasis.orderedField === 'ConfigDataHeroInfo.Skins_ID[]'
    && evidence.semanticBasis.recordLocator === 'ConfigDataHeroInfo.ID=1'
    && evidence.semanticBasis.orderDefinition === 'arrayIndexZeroBased is the literal zero-based source array offset; sourceOrder is the corresponding one-based position. The mapping preserves array position and does not sort or derive from SkinID.'
    && evidence.semanticBasis.populationBoundary === 'The source record contains exactly [102,103,104,105] in this pinned snapshot. This states only the contents of that one source field at that snapshot; it does not create a general Skin completeness or future count rule.', 'order source semantics or scope drift');
  check(evidence.legacySupport?.repository === 'LuceatLuxVestra42/langrisser-future-guide'
    && evidence.legacySupport.commit === '57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff', 'Legacy support anchor');
  equal(evidence.legacySupport.artifacts, legacyArtifacts, 'Legacy provenance anchors');
  check(evidence.legacySupport.scope === "Historical 540-skin regular-Hero-skin validation is corroboration and population contract only; M02 admits only M01's four endpoints.", 'Legacy scope must not promote broader population');
  check(Array.isArray(evidence.limitations) && evidence.limitations.length >= 4, 'order limitations missing');
  exactPopulation(evidence.records, 'skinId', 'order evidence');

  const evidenceBySkin = new Map();
  for (const row of evidence.records) {
    exactKeys(row, ['skinId', 'sourceRecordHeroId', 'arrayIndexZeroBased', 'sourceOrder', 'evidenceClass', 'sourceLocator', 'projectionLocator', 'decision', 'contradiction'], `order claim ${row.skinId}`);
    check(row.sourceRecordHeroId === 1 && row.evidenceClass === 'A' && row.decision === 'ADMIT_SNAPSHOT_SOURCE_ORDER', `unsupported order claim ${row.skinId}`);
    check(Number.isSafeInteger(row.arrayIndexZeroBased) && row.arrayIndexZeroBased >= 0
      && projection.heroInfoRecords[0].Skins_ID[row.arrayIndexZeroBased] === row.skinId, `array position mismatch for ${row.skinId}`);
    check(row.sourceOrder === row.arrayIndexZeroBased + 1 && row.sourceOrder >= 1, `one-based Source Order mismatch for ${row.skinId}`);
    check(row.sourceLocator === `data/configdata/ConfigDataHeroInfo.json#records[ID=1].Skins_ID[${row.arrayIndexZeroBased}]`
      && row.projectionLocator === `${projectionPath}#heroInfoRecords[ID=1].Skins_ID[${row.arrayIndexZeroBased}]`, `source locator mismatch for ${row.skinId}`);
    check(row.contradiction === 'NONE_OBSERVED_IN_INSPECTED_SCOPE', `unresolved order contradiction for ${row.skinId}`);
    evidenceBySkin.set(row.skinId, row);
  }
  const positions = evidence.records.map(row => row.arrayIndexZeroBased);
  const orders = evidence.records.map(row => row.sourceOrder);
  check(new Set(positions).size === positions.length && new Set(orders).size === orders.length, 'duplicate source position/order');
  const canonicalBySkin = new Map();
  for (const row of canonical.records) {
    exactKeys(row, ['skinId', 'sourceOrder', 'provenance'], `order canonical record ${row.skinId}`);
    const claim = evidenceBySkin.get(row.skinId);
    check(claim && row.sourceOrder === claim.sourceOrder, `canonical/evidence source position mismatch for ${row.skinId}`);
    check(row.provenance === `${evidencePath}#records/skinId=${row.skinId}`, `order evidence pointer missing for ${row.skinId}`);
    canonicalBySkin.set(row.skinId, row);
  }
  for (const id of approvedIds) check(canonicalBySkin.has(id), `missing Source Order claim for ${id}`);
  process.stdout.write('M02 Skin Source Order validator: PASS (four exact array positions; pinned snapshot; no global completeness/UI rule)\n');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await validateSkinSourceOrders();
