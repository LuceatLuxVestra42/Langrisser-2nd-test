import { validateHero15CanonicalPopulation } from './hero-full-detail-population-migration-contract.mjs';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const HERO_15_PORTRAIT_CANONICAL_REFERENCE_PATH = 'docs/decisions/hero-15-portrait-canonical-reference-admission.v1.json';
const SOURCE_COMMIT = '6475e63ee23d18adf733756c26a14fa9e3ed662c';
const SOURCE_TREE = '08e1e6c2773730e60b258940e31494f68d65f86a';
const PORTRAIT_PATH = 'assets/portraits/hero-15.png';
const PORTRAIT_SHA256 = '2caad36dfbc17e3c570b36fcd74e5674822d2a0fb20e6df6ff72a1640b903073';
const PORTRAIT_BLOB = '1dbd9386854aa7058de28c164341c6c20059e145';
const FULL_DETAIL_IDS = [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 25, 26, 27, 28, 29, 32, 33, 37, 40, 52, 53, 55, 56, 60, 67, 89];
const fail = (message) => { throw new Error(`Hero 15 Portrait Canonical Reference: ${message}`); };
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const gitBlobSha1 = (bytes) => createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
const readJson = async (root, path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));

export async function loadHero15PortraitCanonicalReferenceInputs(root = process.cwd()) {
  const paths = {
    admission: HERO_15_PORTRAIT_CANONICAL_REFERENCE_PATH,
    portraitEvidence: 'evidence/source/portraits/hero-portrait-hero15.v1.json',
    candidate: 'docs/decisions/hero-15-full-detail-record-field-candidate.v1.json',
    canonical: 'canonical/heroes.v1.json',
    generated: 'generated/hero-slice.v1.json',
    migrationDecision: 'docs/decisions/hero-full-detail-population-migration.v1.json',
    publicationDecision: 'docs/decisions/hero-15-full-detail-publication.v1.json',
  };
  const input = Object.fromEntries(await Promise.all(Object.entries(paths).map(async ([key, path]) => [key, await readJson(root, path)])));
  input.assetBytes = await readFile(resolve(root, PORTRAIT_PATH));
  input.publicProjectionContract = await readFile(resolve(root, 'tools/full-detail-portrait-projection-contract.mjs'), 'utf8');
  return input;
}

export function validateHero15PortraitCanonicalReference(input) {
  const { admission: a, portraitEvidence: e, candidate: c, canonical, generated, publicProjectionContract, migrationDecision, publicationDecision, assetBytes } = input ?? {};
  if (a?.schemaVersion !== 1 || a?.artifactType !== 'HERO_15_FULL_DETAIL_PORTRAIT_CANONICAL_REFERENCE_ADMISSION'
    || a?.status !== 'ADMITTED_INTERNAL_ONLY') fail('admission identity/status mismatch');
  if (a.baseline?.repository !== 'LuceatLuxVestra42/Langrisser-2nd-test'
    || a.baseline?.baseRef !== 'feat/hero15-full-detail-field-admission'
    || a.baseline?.baseHead !== '1e505f11a55806618b476eb2c979c9a79a1f4035'
    || a.baseline?.predecessorPullRequest !== 263) fail('stacked-PR baseline does not match verified predecessor');
  if (!equal(a.claim, {
    heroId: 15, field: 'portrait', canonicalOwner: 'canonical/heroes.v1.json', ownerLocator: 'id=15/portrait', value: PORTRAIT_PATH,
    scope: 'The exact Portrait reference for a non-public Hero 15 Full Detail record candidate.', admissionStatus: 'ADMITTED_INTERNAL_ONLY', canonicalRecordApplied: false,
  })) fail('claim identity, owner, value, or scope changed');
  const s = a.support?.sourceRelation;
  if (a.support?.sourceEvidenceArtifact !== 'evidence/source/portraits/hero-portrait-hero15.v1.json'
    || a.support?.sourceVersion !== `LuceatLuxVestra42/langrisser-future-guide@${SOURCE_COMMIT}; ConfigData snapshot 2026-09-02T01:45:21Z`
    || s?.heroInfoArtifact !== 'data/configdata/ConfigDataHeroInfo.json' || s?.heroInfoVersion !== `commit ${SOURCE_COMMIT}; tree ${SOURCE_TREE}`
    || s?.heroInfoLocator !== 'records[14]/ID=15' || s?.heroIdFieldLocator !== 'records[14]/ID'
    || s?.portraitReferenceFieldLocator !== 'records[14]/CharImage_ID' || s?.heroId !== 15 || s?.charImageId !== 15
    || s?.charImageInfoArtifact !== 'data/configdata/ConfigDataCharImageInfo.json' || s?.charImageInfoVersion !== `commit ${SOURCE_COMMIT}; tree ${SOURCE_TREE}`
    || s?.charImageInfoLocator !== 'records[13]/ID=15' || s?.endpointIdFieldLocator !== 'records[13]/ID'
    || s?.artworkFieldLocator !== 'records[13]/HeroPainting' || s?.heroPainting !== 'UI/HeroPainting/SSR_ABS/Prefab/Riana.prefab'
    || s?.evidenceClass !== 'A') fail('explicit source relation or endpoint provenance changed');
  if (e?.schemaVersion !== 1 || e?.canonical !== false || e?.generated !== false || e?.productionRuntimeDependency !== false
    || e?.publicationApproved !== false || e?.admissionScope !== 'INTERNAL_HERO_PORTRAIT_ASSET_ONLY'
    || e?.source?.commit !== SOURCE_COMMIT || e?.source?.tree !== SOURCE_TREE
    || e?.source?.heroInfo?.fields?.ID !== 15 || e?.source?.heroInfo?.fields?.CharImage_ID !== 15
    || e?.source?.charImageInfo?.fields?.ID !== 15 || e?.source?.charImageInfo?.fields?.HeroPainting !== s.heroPainting
    || e?.asset?.path !== PORTRAIT_PATH || e?.asset?.sha256 !== PORTRAIT_SHA256 || e?.asset?.sourceGitBlobSha1 !== PORTRAIT_BLOB
    || e?.asset?.transformation !== a.support?.assetReference?.transformation) fail('underlying Asset Evidence is not the explicitly admitted internal asset');
  const ar = a.support?.assetReference;
  if (ar?.evidenceLocator !== '#asset' || ar?.internalPath !== PORTRAIT_PATH || ar?.sourcePath !== 'public/images/heroes/cards/15.png'
    || ar?.sourceGitBlobSha1 !== PORTRAIT_BLOB || ar?.sha256 !== PORTRAIT_SHA256 || ar?.bytes !== 183461
    || ar?.width !== 362 || ar?.height !== 682 || ar?.evidenceClass !== 'A'
    || assetBytes?.length !== ar.bytes || sha256(assetBytes) !== ar.sha256 || gitBlobSha1(assetBytes) !== ar.sourceGitBlobSha1) fail('internal Asset bytes or path do not match the admitted evidence');
  const role = a.support?.roleSupport;
  if (role?.evidenceLocator !== '#predecessorExtraction/record; heroes[heroId=15]' || role?.sourceArtworkPath !== s.heroPainting
    || role?.selectionStatus !== 'UNIQUE_REFERENCED_SPRITE' || role?.evidenceClass !== 'B'
    || !role?.limitation?.includes('not re-decoded')) fail('portrait role support or inherited limitation is missing');
  if (c?.record?.id !== 15 || c?.record?.portrait !== PORTRAIT_PATH || c?.target?.populationApplied !== false
    || c?.effect?.portraitPublicationApproved !== false || c?.effect?.publicBuildConsumption !== false) fail('candidate is missing the exact non-public reference or has public effects');
  if (c?.record?.provenance?.portrait !== `${HERO_15_PORTRAIT_CANONICAL_REFERENCE_PATH}#claim`) fail('candidate record provenance does not point to this Owner Admission claim');
  if (c?.fieldAssessments?.portrait?.status !== 'CANONICAL_REFERENCE_ADMITTED_INTERNAL_ONLY'
    || c?.fieldAssessments?.portrait?.evidenceArtifact !== HERO_15_PORTRAIT_CANONICAL_REFERENCE_PATH
    || c?.fieldAssessments?.portrait?.limitation !== 'The source Asset Evidence remains canonical=false and publicationApproved=false; this field admission grants no Asset Publication or Public Build eligibility.') fail('candidate field assessment is not synchronized to this scoped admission');
  validateHero15CanonicalPopulation(canonical, migrationDecision, c.record);
  if (!equal(generated?.heroes?.map(({ id }) => id), FULL_DETAIL_IDS)) fail('public Full Detail population changed');
  if (!publicProjectionContract?.includes("canonicalField: 'portrait'")
    || !publicProjectionContract.includes('canonicalPortraitReferenceRequiresOwnerAdmission: true')
    || !publicProjectionContract.includes("newHeroPortraitDefault: 'WITHHELD_UNTIL_FIELD_SPECIFIC_ASSET_PUBLICATION_APPROVAL'")
    || !publicProjectionContract.includes('populationMigrationRequiresPortraitPublicationApproval: false')
    || !publicProjectionContract.includes('publicPortraitExposureRequiresPublicationApproval: true')) fail('Full Detail Portrait Projection owner contract changed');
  if (publicationDecision?.status !== 'PROPOSED' || publicationDecision?.publication?.fullDetailStatus !== 'NOT_APPROVED'
    || publicationDecision?.publication?.publicEligibilityStatus !== 'NOT_APPROVED') fail('Migration or Publication gate was promoted');
  if (!equal(a.effect, {
    candidatePortraitReferenceAdmitted: true, canonicalRecordPopulationChanged: false, generatedPopulationChanged: false,
    portraitPublicationApproved: false, fullDetailPublicationApproved: false, publicEligibilityApproved: false, publicBuildEligible: false,
  })) fail('admission effect crossed Population, Asset Publication, or Full Detail Publication boundary');
  if (!equal(a.limitations, [
    'This admission is limited to the exact internal Portrait reference for the non-public Hero 15 Full Detail candidate; it does not add Hero 15 to canonical/heroes.v1.json.',
    'The source Asset Evidence remains canonical=false and publicationApproved=false because its scope is internal asset evidence, not this separate record-field claim.',
    'The inherited Unity extraction role support is Evidence Class B and retains its package re-decoding limitation.',
    'Portrait Asset Publication, Full Detail Publication, Public Eligibility, Generated population, and Public Build inclusion remain unapproved and unchanged.',
  ])) fail('explicit admission limitations drift');
  return true;
}

export async function validateHero15PortraitCanonicalReferenceFromRoot(root = process.cwd(), overrides = {}) {
  return validateHero15PortraitCanonicalReference({ ...await loadHero15PortraitCanonicalReferenceInputs(root), ...overrides });
}
