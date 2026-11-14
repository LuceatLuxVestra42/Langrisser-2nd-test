import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { CANONICAL, OUTPUT, renderHero15ProfileCvInternal, SCOPE } from './hero-15-profile-cv-internal.mjs';

const SOURCE = {
  repository: 'LuceatLuxVestra42/langrisser-future-guide',
  commit: '6475e63ee23d18adf733756c26a14fa9e3ed662c',
  tree: '08e1e6c2773730e60b258940e31494f68d65f86a',
  blob: '397afb3e76c0fe4f3e424c04ba68459ff48d74c5',
  sha256: '3a412fa72f8e4626bc5a723b8bede6a5b0f9032711bc3922f4234ea322b8582a',
  heroBlob: '728daab3370f0c7779449663ea02e638677944d4',
  heroSha256: '2385599493d2598aa3f7d6b2c76ecdfd8615d91f19b6241933986282fcb17f7b',
};
const EVIDENCE = 'evidence/source/configdata/ConfigDataCharImageInfo.record-hero-15-cv-name.v1.json';
const fail = (message) => { throw new Error(`Hero 15 profile CV internal validation failed: ${message}`); };
const check = (condition, message) => { if (!condition) fail(message); };
const readJson = async (root, path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));

export function validateHero15ProfileCvInternal({ evidence, canonical, identities, portraitEvidence, fullDetailDecision, generatedText }) {
  check(evidence.schemaVersion === 1 && evidence.evidenceType === 'CONFIGDATA_FIELD_CLAIM'
    && evidence.admissionScope === 'HERO_15_SOURCE_NATIVE_CVNAME_FIELD_ONLY', 'Evidence identity/scope');
  const src = evidence.source;
  check(src.repository === SOURCE.repository && src.commit === SOURCE.commit && src.tree === SOURCE.tree
    && src.path === 'data/configdata/ConfigDataCharImageInfo.json' && src.gitBlobSha1 === SOURCE.blob
    && src.sha256 === SOURCE.sha256 && src.bytes === 1593018 && src.recordCount === 1378
    && src.recordIndex === 13 && src.locator === 'data/configdata/ConfigDataCharImageInfo.json#records[13]/ID=15', 'Source pin/locator');
  check(src.fields?.ID === 15 && src.fields?.CVName === '小清水亚美'
    && src.fieldLocators?.ID === '#records[13]/ID' && src.fieldLocators?.CVName === '#records[13]/CVName', 'Source-native field value/locator');
  const relation = evidence.relation;
  check(relation.sourceGitBlobSha1 === SOURCE.heroBlob && relation.sourceSha256 === SOURCE.heroSha256
    && relation.sourceBytes === 16894185 && relation.heroRecordIndex === 14 && relation.heroId === 15
    && relation.foreignKeyField === 'CharImage_ID' && relation.foreignKeyLocator === '#records[14]/CharImage_ID'
    && relation.charImageId === 15 && relation.endpointField === 'ID'
    && relation.endpointLocator === 'data/configdata/ConfigDataCharImageInfo.json#records[13]/ID=15', 'Explicit source relation');
  check(evidence.claim?.heroId === 15 && evidence.claim?.charImageId === 15
    && evidence.claim?.sourceField === 'ConfigDataCharImageInfo.CVName' && evidence.claim?.cvNameRaw === '小清水亚美'
    && evidence.claim?.transformation === 'Exact source string copy; no trim, transliteration, translation, or normalization.', 'Claim/transformation');
  check(identities.schemaVersion === 1 && identities.records.filter((row) => row.heroId === 15).length === 1, 'Hero identity admission');
  const portraitRelation = portraitEvidence.source.heroInfo.fields.CharImage_ID;
  check(portraitEvidence.source.heroInfo.fields.ID === 15 && portraitRelation === 15
    && portraitEvidence.source.charImageInfo.fields.ID === 15, 'Existing explicit HeroInfo to CharImageInfo relation');
  check(canonical.schemaVersion === 1 && canonical.responsibility === 'hero-profile-source-cv-name'
    && canonical.records.length === 1, 'Canonical owner scope/population');
  const record = canonical.records[0];
  check(record.heroId === 15 && record.charImageId === 15 && record.cvNameRaw === '小清水亚美'
    && record.provenance?.cvNameRaw === `${EVIDENCE}#claim/CVName`
    && record.provenance?.heroToCharImageRelation === `${EVIDENCE}#relation`, 'Canonical claim/provenance parity');
  const expectedGenerated = renderHero15ProfileCvInternal(canonical);
  check(generatedText === expectedGenerated, 'Generated output is stale or non-deterministic');
  const output = JSON.parse(generatedText);
  check(output.schemaVersion === 1 && output.scope === SCOPE && output.heroId === 15
    && output.charImageId === 15 && output.cvNameRaw === '小清水亚美'
    && JSON.stringify(output.provenance) === JSON.stringify(record.provenance), 'Internal projection parity');
  check(fullDetailDecision.status === 'PROPOSED' && fullDetailDecision.publication.fullDetailStatus === 'NOT_APPROVED'
    && fullDetailDecision.publication.publicEligibilityStatus === 'NOT_APPROVED'
    && fullDetailDecision.population.currentEffectiveCount === 29
    && fullDetailDecision.population.canonicalPopulationCount === 29
    && fullDetailDecision.population.generatedPopulationCount === 29, 'Full Detail publication/population boundary');
  const profile = fullDetailDecision.fieldGroups.find((group) => group.id === 'profile');
  check(profile && profile.publicationApprovedFields.length === 0
    && !profile.publicationCandidateFields.includes('cv') && profile.withheldFields.includes('cv'), 'CV Full Detail field remains withheld');
  check(!JSON.stringify(output).includes('assets/portraits/'), 'Internal CV projection must not expose asset paths');
  return true;
}

export async function validateFromRoot(root = process.cwd()) {
  const [evidence, canonical, identities, portraitEvidence, fullDetailDecision, generatedText] = await Promise.all([
    readJson(root, EVIDENCE), readJson(root, CANONICAL), readJson(root, 'canonical/hero-identities.v1.json'),
    readJson(root, 'evidence/source/portraits/hero-portrait-hero15.v1.json'),
    readJson(root, 'docs/decisions/hero-15-full-detail-publication.v1.json'),
    readFile(resolve(root, OUTPUT), 'utf8'),
  ]);
  validateHero15ProfileCvInternal({ evidence, canonical, identities, portraitEvidence, fullDetailDecision, generatedText });
  process.stdout.write('Hero 15 profile CV internal: PASS (source-native field, explicit endpoint, internal-only; Full Detail withheld)\n');
}
if (process.argv[1] && resolve(process.argv[1]) === resolve('tools/validate-hero-15-profile-cv-internal.mjs')) await validateFromRoot();
