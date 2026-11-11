import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const HERO15_FETTER_EVIDENCE_PATH = 'evidence/source/bonds/hero15-fetter-references.v1.json';
export const HERO15_FETTER_CANONICAL_PATH = 'canonical/hero-fetter-references.v1.json';

const check = (ok, message) => { if (!ok) throw new Error(message); };
const exactKeys = (obj, keys, label) => check(JSON.stringify(Object.keys(obj).sort()) === JSON.stringify([...keys].sort()), `${label} fields drift`);
const parse = async (root, path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));

export function validateHero15FetterReferencesData({ evidence, canonical, heroIdentities }) {
  exactKeys(evidence, ['schemaVersion', 'claimType', 'evidenceClass', 'scope', 'source', 'extraction', 'claims', 'nonClaims'], 'evidence');
  check(evidence.schemaVersion === 1 && evidence.claimType === 'hero-15-fetter-source-references' && evidence.evidenceClass === 'A', 'unsupported evidence contract');
  exactKeys(evidence.scope, ['heroId', 'heroInformationId', 'sourceFields'], 'evidence.scope');
  check(evidence.scope.heroId === 15 && evidence.scope.heroInformationId === 15, 'Hero 15 scope drift');
  check(JSON.stringify(evidence.scope.sourceFields) === JSON.stringify(['ConfigDataHeroInformationInfo.HeroFetters_ID', 'ConfigDataHeroInformationInfo.HeroHeartFetterId']), 'source field scope drift');

  const src = evidence.source;
  check(src.repository === 'LuceatLuxVestra42/langrisser-future-guide' && src.commit === '6475e63ee23d18adf733756c26a14fa9e3ed662c' && src.tree === '08e1e6c2773730e60b258940e31494f68d65f86a', 'source snapshot pin drift');
  const sourceFiles = {
    heroInfo: ['data/configdata/ConfigDataHeroInfo.json', '728daab3370f0c7779449663ea02e638677944d4'],
    heroInformationInfo: ['data/configdata/ConfigDataHeroInformationInfo.json', '49aef6be8ea1a65d5725c16a05dab94fffa73f92'],
    heroFetterInfo: ['data/configdata/ConfigDataHeroFetterInfo.json', '1beec024e3d82e57923e59c70048c5abefd92d06'],
    heroHeartFetterInfo: ['data/configdata/ConfigDataHeroHeartFetterInfo.json', 'be61dd6fb14662d70335e833c4c857dda5105f74']
  };
  const expectedHashes = {
    heroInfo: '2385599493d2598aa3f7d6b2c76ecdfd8615d91f19b6241933986282fcb17f7b',
    heroInformationInfo: 'ee9f81f161f79939e771b16db97329bfaa45872edad0ecbf9dd9285587ebad7e',
    heroFetterInfo: '1c058ddd7ad2fd038e8fae73391aafa85b3dea4fe49868a2c834a490497172a6',
    heroHeartFetterInfo: '7a150f7fd0658ffc9b05d68b8131a677290ab67710f97a22c4e4c4d78ea42b8a'
  };
  for (const [key, [path, blob]] of Object.entries(sourceFiles)) {
    check(src[key]?.path === path && src[key]?.blobSha1 === blob && src[key]?.sha256 === expectedHashes[key], `${key} Source pin drift`);
  }
  check(src.heroInfo.recordLocator === 'ConfigDataHeroInfo#ID=15' && src.heroInfo.recordIndex === 14 && src.heroInfo.fields?.ID === 15 && src.heroInfo.fields?.HeroInformation_ID === 15, 'HeroInfo bridge locator drift');
  check(src.heroInformationInfo.recordLocator === 'ConfigDataHeroInformationInfo#ID=15' && src.heroInformationInfo.recordIndex === 14 && src.heroInformationInfo.recordCount === 291, 'HeroInformationInfo locator drift');
  check(src.heroInformationInfo.fields?.ID === 15 && src.heroInformationInfo.fields?.Name === '莉亚娜', 'HeroInformationInfo identity endpoint drift');
  check(JSON.stringify(src.heroInformationInfo.fields?.HeroFetters_ID) === JSON.stringify([66, 67, 68, 69, 70]) && src.heroInformationInfo.fields?.HeroHeartFetterId === 15, 'raw source references drift');
  check(src.heroFetterInfo.recordCount === 1430 && JSON.stringify(src.heroFetterInfo.endpoints?.map(x => [x.recordIndex, x.id, x.nameCn])) === JSON.stringify([[65,66,'军团羁绊·辉'],[66,67,'英雄羁绊·光'],[67,68,'军团羁绊·耀'],[68,69,'英雄羁绊·韧'],[69,70,'英雄羁绊·力']]), 'Fetter endpoint locator set drift');
  check(src.heroHeartFetterInfo.recordLocator === 'ConfigDataHeroHeartFetterInfo#ID=15' && src.heroHeartFetterInfo.recordIndex === 13 && src.heroHeartFetterInfo.fields?.ID === 15 && src.heroHeartFetterInfo.fields?.Name === '莉亚娜', 'HeartFetter endpoint drift');
  check(src.schemaMetadata?.path === 'data/metadata/dump.cs' && src.schemaMetadata?.blobSha1 === '201bc8004792d13c52a26afc79f73e5ed8d1c2ac' && src.schemaMetadata?.sha256 === '15f2030df8a0d3f9363adfe67113b01065eb70166c13a08f04a96d5e5edb2e31', 'typed HeartFetter endpoint metadata drift');

  exactKeys(evidence.extraction, ['kind', 'sourceBytesCopied', 'recordSelection', 'transformation', 'sha256RecomputedFromPinnedBytes', 'sha256ReusedFromVerifiedPin'], 'evidence.extraction');
  check(evidence.extraction.kind === 'claim-scoped-record-field-projection' && evidence.extraction.sourceBytesCopied === false
    && evidence.extraction.recordSelection === 'explicit ID=15, HeroFetters_ID endpoint IDs 66-70, and HeroHeartFetterInfo ID=15 only'
    && evidence.extraction.transformation === 'selected source-native fields and endpoint ID/name locators copied without translating, calculating, sorting, or interpreting condition parameters'
    && JSON.stringify(evidence.extraction.sha256RecomputedFromPinnedBytes) === JSON.stringify(['heroInformationInfo','heroFetterInfo','heroHeartFetterInfo','schemaMetadata'])
    && JSON.stringify(evidence.extraction.sha256ReusedFromVerifiedPin) === JSON.stringify(['heroInfo']), 'extraction declaration drift');
  exactKeys(evidence.claims, ['heroFetterReferences', 'heroHeartFetterReference'], 'evidence.claims');
  exactKeys(evidence.claims.heroFetterReferences, ['sourceField','rawValue','endpointNamespace','endpointStatus','supportedMeaning','limitation'], 'heroFetterReferences claim');
  exactKeys(evidence.claims.heroHeartFetterReference, ['sourceField','rawValue','endpointNamespace','endpointStatus','supportedMeaning','limitation'], 'heroHeartFetterReference claim');
  check(evidence.claims.heroFetterReferences.sourceField === 'ConfigDataHeroInformationInfo.HeroFetters_ID' && evidence.claims.heroFetterReferences.endpointNamespace === 'ConfigDataHeroFetterInfo.ID'
    && JSON.stringify(evidence.claims.heroFetterReferences.rawValue) === '[66,67,68,69,70]'
    && evidence.claims.heroFetterReferences.supportedMeaning === 'HeroInformationInfo record 15 contains these source-native Fetter ID references'
    && evidence.claims.heroFetterReferences.limitation === 'Does not admit completion conditions, Fetter levels, rewards, skills, Korean system labels, or gameplay effects.', 'Fetter raw reference meaning drift');
  check(evidence.claims.heroHeartFetterReference.sourceField === 'ConfigDataHeroInformationInfo.HeroHeartFetterId' && evidence.claims.heroHeartFetterReference.endpointNamespace === 'ConfigDataHeroHeartFetterInfo.ID'
    && evidence.claims.heroHeartFetterReference.rawValue === 15
    && evidence.claims.heroHeartFetterReference.supportedMeaning === 'HeroInformationInfo record 15 contains an explicit HeartFetter ID reference'
    && evidence.claims.heroHeartFetterReference.limitation === 'Does not admit level/unlock conditions, unlock skills, rewards, stats, or gameplay effects.', 'HeartFetter raw reference meaning drift');
  check(JSON.stringify(evidence.nonClaims) === JSON.stringify([
    'No Mastery reference, reward, condition, stat, accumulation rule, or battle effect.',
    'No Fetter or HeartFetter condition, reward, skill, stat, or unlock rule.',
    'No Korean localization, official Korea-server provenance, UI, or publication eligibility.'
  ]), 'non-claim boundary drift');

  check(heroIdentities.schemaVersion === 1 && heroIdentities.records.some(x => x.heroId === 15), 'Hero 15 identity endpoint missing');
  exactKeys(canonical, ['schemaVersion', 'scope', 'records'], 'canonical');
  check(canonical.schemaVersion === 1 && canonical.records.length === 6, 'canonical population drift');
  check(canonical.scope === 'Hero 15 source-native ConfigData Fetter ID references only; not an admission of stages, completion/unlock conditions, rewards, stats, skills, battle effects, Korean localization, or publication.', 'canonical scope drift');
  const expected = [
    ...[66,67,68,69,70].map(fetterId => ['HERO_FETTER_ID_REFERENCE',15,15,fetterId,'ConfigDataHeroInformationInfo.HeroFetters_ID','ConfigDataHeroFetterInfo.ID','evidence/source/bonds/hero15-fetter-references.v1.json#claims/heroFetterReferences']),
    ['HERO_HEART_FETTER_ID_REFERENCE',15,15,15,'ConfigDataHeroInformationInfo.HeroHeartFetterId','ConfigDataHeroHeartFetterInfo.ID','evidence/source/bonds/hero15-fetter-references.v1.json#claims/heroHeartFetterReference']
  ];
  const actual = canonical.records.map(r => {
    exactKeys(r, r.referenceKind === 'HERO_FETTER_ID_REFERENCE' ? ['referenceKind','heroId','heroInformationId','fetterId','sourceField','endpointNamespace','provenance'] : ['referenceKind','heroId','heroInformationId','heartFetterId','sourceField','endpointNamespace','provenance'], 'canonical.record');
    return [r.referenceKind,r.heroId,r.heroInformationId,r.fetterId ?? r.heartFetterId,r.sourceField,r.endpointNamespace,r.provenance];
  });
  check(JSON.stringify(actual) === JSON.stringify(expected), 'canonical raw reference set, order, or provenance drift');
  return { references: actual.length, heroFetter: 5, heroHeartFetter: 1, masteryClaims: 0, publicationClaims: 0 };
}

export async function validateHero15FetterReferences(root = process.cwd()) {
  const [evidence, canonical, heroIdentities] = await Promise.all([
    parse(root, HERO15_FETTER_EVIDENCE_PATH),
    parse(root, HERO15_FETTER_CANONICAL_PATH),
    parse(root, 'canonical/hero-identities.v1.json')
  ]);
  const result = validateHero15FetterReferencesData({ evidence, canonical, heroIdentities });
  process.stdout.write(`Hero 15 source-native Fetter references: PASS (references=${result.references}; no conditions, rewards, stats, effects, or publication admitted)\n`);
  return result;
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  await validateHero15FetterReferences();
}
