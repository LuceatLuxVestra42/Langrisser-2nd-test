import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const canonicalPath = 'canonical/skin-hero-relations-m02.v1.json';
const evidencePath = 'evidence/source/skin-hero-relations-m02.v1.json';
const skinIdentityPath = 'canonical/skin-identities.v1.json';
const heroIdentityPath = 'canonical/hero-identities.v1.json';
const projectionPath = 'evidence/source/configdata/skin-relation-order-records-m02.v1.json';
const approvedIds = [102, 103, 104, 105];
const expectedHero = 1;
const scope = 'M02 Skin→Hero ownership for the four Skin identities admitted by M01; no other Skin or Hero population is implied.';
const fail = message => { throw new Error(`M02 Skin→Hero relation validation failed: ${message}`); };
const check = (condition, message) => { if (!condition) fail(message); };
const equal = (a, b, message) => check(isDeepStrictEqual(a, b), message);
function exactKeys(value, fields, label) {
  check(value && typeof value === 'object' && !Array.isArray(value), `${label}: object required`);
  equal(Object.keys(value).sort(), [...fields].sort(), `${label}: fields drift`);
}
function exactPopulation(rows, field, label) {
  check(Array.isArray(rows), `${label}: array required`);
  const ids = rows.map(row => row?.[field]);
  check(ids.every(Number.isSafeInteger), `${label}: integer IDs required`);
  check(new Set(ids).size === ids.length, `${label}: duplicate IDs`);
  equal([...ids].sort((a, b) => a - b), approvedIds, `${label}: missing or additional IDs`);
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

export async function validateSkinHeroRelations(root = process.cwd()) {
  const readText = path => readFile(resolve(root, path), 'utf8');
  const [canonicalText, evidenceText, skinText, heroText, projectionText] = await Promise.all([
    readText(canonicalPath), readText(evidencePath), readText(skinIdentityPath), readText(heroIdentityPath), readText(projectionPath),
  ]);
  const canonical = JSON.parse(canonicalText);
  const evidence = JSON.parse(evidenceText);
  const skinIdentity = JSON.parse(skinText);
  const heroIdentity = JSON.parse(heroText);
  const projection = JSON.parse(projectionText);
  exactKeys(canonical, ['schemaVersion', 'scope', 'sourceEvidence', 'records'], 'relation canonical');
  check(canonical.schemaVersion === 1 && canonical.scope === scope && canonical.sourceEvidence === evidencePath, 'canonical schema/scope/evidence pointer');
  exactPopulation(skinIdentity.records, 'skinId', 'M01 Skin Identity regression');
  exactPopulation(canonical.records, 'skinId', 'relation canonical');
  check(heroIdentity.records?.some(row => row.heroId === expectedHero), 'Hero endpoint identity missing');

  exactKeys(evidence, ['schemaVersion', 'claimType', 'evidenceClass', 'scope', 'source', 'semanticBasis', 'legacySupport', 'limitations', 'records'], 'relation evidence');
  check(evidence.schemaVersion === 1 && evidence.claimType === 'skin-to-hero-ownership' && evidence.evidenceClass === 'A'
    && evidence.scope === 'Four M01 identities only: explicit Skin membership and ConfigDataHeroSkinInfo.SpecifiedHero cross-check in the pinned historical ConfigData snapshot.', 'A provenance and claim scope required');
  const source = evidence.source;
  check(source?.repository === 'LuceatLuxVestra42/langrisser-future-guide'
    && source.commit === '6475e63ee23d18adf733756c26a14fa9e3ed662c'
    && source.projectionPath === projectionPath
    && source.projectionSha256 === '063f36b71af111f6968024143ea40172b5654de1968e54a32d19fb956cdc987e', 'pinned source/projection anchor');
  equal(source.files, sourceFiles, 'full source file anchors');
  equal(createHash('sha256').update(projectionText).digest('hex'), source.projectionSha256, 'source projection digest mismatch');
  exactKeys(projection, ['heroInfoRecords', 'heroSkinInfoRecords'], 'raw source projection');
  equal(projection.heroInfoRecords, [{ ID: 1, Skins_ID: approvedIds }], 'membership projection differs from pinned source record');
  exactPopulation(projection.heroSkinInfoRecords, 'ID', 'skin source records');
  for (const row of projection.heroSkinInfoRecords) exactKeys(row, ['ID', 'SpecifiedHero'], `skin source record ${row.ID}`);
  exactKeys(evidence.semanticBasis, ['membership', 'ownership', 'crossCheck'], 'source interpretation');
  check(evidence.semanticBasis.membership === 'ConfigDataHeroInfo.Skins_ID[] explicitly contains Skin IDs for the Hero record.'
    && evidence.semanticBasis.ownership === 'ConfigDataHeroSkinInfo.SpecifiedHero is the explicit owning Hero field; its interpretation as owner is documented by the pinned Legacy source trace and Skin Stage 1 contract.'
    && evidence.semanticBasis.crossCheck === "Each target Skin ID appears exactly once in the target Hero's source membership array, and its matching source-native Skin record has SpecifiedHero equal to the target Hero ID.", 'membership/owner interpretation unsupported');
  check(evidence.legacySupport?.repository === 'LuceatLuxVestra42/langrisser-future-guide'
    && evidence.legacySupport.commit === '57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff', 'Legacy support anchor');
  equal(evidence.legacySupport.artifacts, legacyArtifacts, 'Legacy provenance anchors');
  check(evidence.legacySupport.scope === "Historical 540-skin regular-Hero-skin validation is corroboration and population contract only; M02 admits only M01's four endpoints.", 'Legacy scope must not promote broader population');
  check(Array.isArray(evidence.limitations) && evidence.limitations.length >= 4, 'claim limitations missing');
  exactPopulation(evidence.records, 'skinId', 'relation evidence');

  const sourceBySkin = new Map(projection.heroSkinInfoRecords.map(row => [row.ID, row]));
  const membershipCounts = new Map(approvedIds.map(id => [id, projection.heroInfoRecords[0].Skins_ID.filter(ref => ref === id).length]));
  const evidenceBySkin = new Map();
  for (const row of evidence.records) {
    exactKeys(row, ['skinId', 'heroId', 'evidenceClass', 'membershipLocator', 'ownershipLocator', 'projectionMembershipLocator', 'projectionOwnershipLocator', 'decision', 'contradiction'], `relation claim ${row.skinId}`);
    check(row.evidenceClass === 'A' && row.decision === 'ADMIT_SKIN_HERO_RELATION', `A provenance required for ${row.skinId}`);
    check(row.heroId === expectedHero && membershipCounts.get(row.skinId) === 1, `source Membership missing/duplicate for ${row.skinId}`);
    check(sourceBySkin.get(row.skinId)?.SpecifiedHero === row.heroId, `SpecifiedHero ownership mismatch for ${row.skinId}`);
    check(row.membershipLocator === 'data/configdata/ConfigDataHeroInfo.json#records[ID=1].Skins_ID'
      && row.ownershipLocator === `data/configdata/ConfigDataHeroSkinInfo.json#records[ID=${row.skinId}].SpecifiedHero`
      && row.projectionMembershipLocator === `${projectionPath}#heroInfoRecords[ID=1].Skins_ID`
      && row.projectionOwnershipLocator === `${projectionPath}#heroSkinInfoRecords[ID=${row.skinId}].SpecifiedHero`, `source locator mismatch for ${row.skinId}`);
    check(row.contradiction === 'NONE_OBSERVED_IN_INSPECTED_SCOPE', `unresolved contradiction for ${row.skinId}`);
    evidenceBySkin.set(row.skinId, row);
  }
  const canonicalBySkin = new Map();
  for (const row of canonical.records) {
    exactKeys(row, ['skinId', 'heroId', 'provenance'], `relation canonical record ${row.skinId}`);
    check(row.heroId === expectedHero && heroIdentity.records.some(hero => hero.heroId === row.heroId), `invalid Hero FK for Skin ${row.skinId}`);
    check(row.provenance === `${evidencePath}#records/skinId=${row.skinId}` && evidenceBySkin.has(row.skinId), `relation evidence pointer missing for ${row.skinId}`);
    check(row.heroId === evidenceBySkin.get(row.skinId).heroId && row.heroId === sourceBySkin.get(row.skinId)?.SpecifiedHero, `canonical/evidence/source mismatch for ${row.skinId}`);
    canonicalBySkin.set(row.skinId, row);
  }
  for (const id of approvedIds) check(canonicalBySkin.has(id), `missing relation for ${id}`);
  process.stdout.write('M02 Skin→Hero relation validator: PASS (four exact endpoints, explicit Membership + SpecifiedHero A evidence)\n');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await validateSkinHeroRelations();
