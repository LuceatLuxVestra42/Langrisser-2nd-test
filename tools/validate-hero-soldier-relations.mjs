import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { validateSpHeroRewardSource } from './validate-sp-hero-reward-source.mjs';

const root = process.cwd();
const canonicalPath = 'canonical/hero-soldier-relations.v1.json';
const heroOwnerPath = 'canonical/hero-identities.v1.json';
const soldierOwnerPath = 'canonical/soldiers.v1.json';
const directManifestPath = 'evidence/source/configdata/hero-soldier-direct-source-evidence.v1.json';
const soldierSourcePath = 'evidence/source/configdata/ConfigDataSoldierInfo.records-sp-soldier-endpoints.v1.json';
const spSoldierSourcePath = 'evidence/source/configdata/ConfigDataSPSoldierInfo.records-all-sp-soldiers.v1.json';
const soldierSourceManifestPath = 'evidence/source/configdata/sp-soldier-population.source-manifest.v1.json';
const sourceSemanticsPath = 'evidence/source/configdata/hero-soldier-source-semantics.v1.json';
const hero15SpAdmissionPath = 'evidence/source/configdata/hero-soldier-sp-inheritance-hero15.v1.json';
const currentRelationCount = 393;
const currentProvenanceCount = 394;
const preHero15SpBaselineSha256 = 'fd8a44f3f3ebf6b2d5d1f0a7562b40b1f577e64d7747eb3c2bbacd1356f010ec';
const currentSourceKindCounts = {
  BASE_SOLDIER_HERO: 177,
  SP_HERO_REWARD: 5,
  SP_SOLDIER_EXPAND: 30,
  SP_SOLDIER_INHERIT: 182,
};
const hero15SpAdmissionPairs = [[15, 5210], [15, 5326], [15, 5602], [15, 5621], [15, 5802], [15, 5811], [15, 5815]];
const check = (condition, message) => { if (!condition) throw new Error(`Hero-Soldier direct-source validation failed: ${message}`); };
const readBytes = (path) => readFile(resolve(root, path));
const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const gitBlobSha1 = (bytes) => createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`), bytes])).digest('hex');
const pairKey = (heroId, soldierId) => `${heroId}:${soldierId}`;
const exactKeys = (value, expected, label) => check(isDeepStrictEqual(Object.keys(value).sort(), [...expected].sort()), `${label} has unexpected or missing fields`);

function addProvenance(byPair, targetHeroIds, targetSoldierIds, heroId, soldierId, provenance) {
  if (!targetHeroIds.has(heroId) || !targetSoldierIds.has(soldierId)) return;
  const key = pairKey(heroId, soldierId);
  let edge = byPair.get(key);
  if (!edge) {
    edge = { heroId, soldierId, provenance: [] };
    byPair.set(key, edge);
  }
  if (!edge.provenance.some((candidate) => isDeepStrictEqual(candidate, provenance))) edge.provenance.push(provenance);
}

export async function validateHeroSoldierRelations() {
  const rewardEvidence = await validateSpHeroRewardSource();
  const [
    directManifest,
    canonical,
    heroOwner,
    soldierOwner,
    soldierSourceDoc,
    spSoldierSourceDoc,
    soldierSourceManifest,
    sourceSemantics,
    hero15SpAdmission,
    soldierSourceBytes,
    spSoldierSourceBytes,
  ] = await Promise.all([
    readJson(directManifestPath),
    readJson(canonicalPath),
    readJson(heroOwnerPath),
    readJson(soldierOwnerPath),
    readJson(soldierSourcePath),
    readJson(spSoldierSourcePath),
    readJson(soldierSourceManifestPath),
    readJson(sourceSemanticsPath),
    readJson(hero15SpAdmissionPath),
    readBytes(soldierSourcePath),
    readBytes(spSoldierSourcePath),
  ]);

  exactKeys(directManifest, [
    'schemaVersion','sourceRole','canonical','generated','productionRuntimeDependency','canonicalTarget',
    'claimScope','locatorFormat','locatorSemantics','sourceSemanticsContract','sources',
    'preservedBaselineRegression','knownLimitations','claimScopedAdmissionEvidence'
  ], 'direct-source provenance manifest');
  check(directManifest.schemaVersion === 1
    && directManifest.sourceRole === 'hero_soldier_direct_source_provenance'
    && directManifest.canonical === false
    && directManifest.generated === false
    && directManifest.productionRuntimeDependency === false,
  'direct-source manifest authority boundary changed');
  check(directManifest.canonicalTarget === canonicalPath, 'direct-source manifest canonical target drift');
  check(directManifest.sourceSemanticsContract === sourceSemanticsPath, 'direct-source semantics contract locator drift');
  check(directManifest.locatorFormat === `${directManifestPath}#heroId=<HeroID>&soldierId=<SoldierID>`, 'direct-source locator format drift');
  check(directManifest.claimScope === 'Current admitted Hero-Soldier relation claims only; this manifest resolves provenance to retained direct source evidence and does not define future relation completeness or admission.', 'direct-source manifest scope must remain admission-bounded');
  check(directManifest.locatorSemantics === 'The fragment identifies one current canonical Hero-Soldier claim. Its support is resolved by applying the retained source-kind semantics to the listed pinned ConfigData artifacts and, for scoped derived claims, the linked claim-scoped evidence artifact; this manifest contains no relation rows and is not a relation population or admission authority.', 'direct-source locator semantics drift');
  check(isDeepStrictEqual(directManifest.claimScopedAdmissionEvidence, {
    artifactPath: hero15SpAdmissionPath,
    claimType: 'hero-soldier-sp-inherited-relations',
    evidenceClass: 'B',
    sourceKind: 'SP_SOLDIER_INHERIT',
    claimCount: 7,
    locatorFormat: `${directManifestPath}#heroId=<HeroID>&soldierId=<SP SoldierID>`,
    admissionAuthority: false,
  }), 'claim-scoped derived admission evidence link drift');

  const sources = directManifest.sources;
  const expectedSourceSpecs = {
    BASE_SOLDIER_HERO: {
      artifactPath: soldierSourcePath,
      artifactGitBlobSha1: 'bcfcd84df8647646aa42ab95793b0bae58cb0edd',
      manifestPath: soldierSourceManifestPath,
      originalSourcePath: 'data/configdata/ConfigDataSoldierInfo.json',
      originalSourceGitBlobSha1: '23649493c4d4c602e8d990db7bb5fade11747cc3',
      sourceTable: 'ConfigDataSoldierInfo',
      sourceField: 'GetSoldierHeros_ID',
    },
    SP_HERO_REWARD: {
      artifactPath: rewardEvidence.sourcePath,
      artifactGitBlobSha1: 'faec10b937b8bd8678415df83ccacdba10848778',
      manifestPath: rewardEvidence.manifestPath,
      originalSourcePath: 'data/configdata/ConfigDataSPHeroInfo.json',
      originalSourceGitBlobSha1: 'c3dc00ad0e1454481715ade378f56104febed9a3',
      sourceTable: 'ConfigDataSPHeroInfo',
      sourceField: 'SecondStageRewardSoldiers',
    },
    SP_SOLDIER_EXPAND: {
      artifactPath: spSoldierSourcePath,
      artifactGitBlobSha1: 'f1d5ba516c38f20d71a07e9f26e565c1ff8e04dd',
      manifestPath: soldierSourceManifestPath,
      originalSourcePath: 'data/configdata/ConfigDataSPSoldierInfo.json',
      originalSourceGitBlobSha1: '93dd784a7de913daa6d72f5df6cf6890a710c58a',
      sourceTable: 'ConfigDataSPSoldierInfo',
      sourceField: 'SecondStageExpandHeroList',
    },
    SP_SOLDIER_INHERIT: {
      artifactPath: spSoldierSourcePath,
      artifactGitBlobSha1: 'f1d5ba516c38f20d71a07e9f26e565c1ff8e04dd',
      manifestPath: soldierSourceManifestPath,
      originalSourcePath: 'data/configdata/ConfigDataSPSoldierInfo.json',
      originalSourceGitBlobSha1: '93dd784a7de913daa6d72f5df6cf6890a710c58a',
      sourceTable: 'ConfigDataSPSoldierInfo',
      supportField: 'NormalSoliderId',
      spIdField: 'ID',
    },
  };
  check(isDeepStrictEqual(sources, expectedSourceSpecs), 'direct-source artifact/provenance mapping drift');
  check(gitBlobSha1(soldierSourceBytes) === sources.BASE_SOLDIER_HERO.artifactGitBlobSha1, 'preserved SoldierInfo artifact bytes drift');
  check(gitBlobSha1(spSoldierSourceBytes) === sources.SP_SOLDIER_EXPAND.artifactGitBlobSha1, 'preserved SPSoldierInfo artifact bytes drift');

  check(soldierSourceManifest.source?.repository === 'LuceatLuxVestra42/langrisser-future-guide'
    && soldierSourceManifest.source?.commit === '6475e63ee23d18adf733756c26a14fa9e3ed662c',
  'pinned Soldier source repository/commit drift');
  exactKeys(hero15SpAdmission, [
    'schemaVersion','claimType','evidenceClass','canonical','generated','productionRuntimeDependency',
    'claimScope','source','parentRelation','supportRelation','transformation','admissionBasis','records'
  ], 'Hero 15 SP inherited relation evidence');
  check(hero15SpAdmission.schemaVersion === 1
    && hero15SpAdmission.claimType === 'hero-soldier-sp-inherited-relations'
    && hero15SpAdmission.evidenceClass === 'B'
    && hero15SpAdmission.canonical === false
    && hero15SpAdmission.generated === false
    && hero15SpAdmission.productionRuntimeDependency === false,
  'Hero 15 SP inherited evidence authority or class drift');
  check(hero15SpAdmission.source?.repository === soldierSourceManifest.source.repository
    && hero15SpAdmission.source?.commit === soldierSourceManifest.source.commit
    && hero15SpAdmission.source?.tree === soldierSourceManifest.source.commitTree
    && hero15SpAdmission.source?.configDataSubtree === soldierSourceManifest.source.configDataSubtree
    && hero15SpAdmission.source?.sourceVersionStatus === 'unknown'
    && hero15SpAdmission.source?.originalPath === soldierSourceManifest.artifacts.spSoldierInfo.sourcePath
    && hero15SpAdmission.source?.originalBlobSha1 === soldierSourceManifest.artifacts.spSoldierInfo.gitBlobSha1
    && hero15SpAdmission.source?.preservedArtifactPath === spSoldierSourcePath
    && hero15SpAdmission.source?.preservedArtifactBlobSha1 === sources.SP_SOLDIER_INHERIT.artifactGitBlobSha1
    && hero15SpAdmission.source?.sourceManifestPath === soldierSourceManifestPath,
  'Hero 15 SP inherited source pin drift');
  check(hero15SpAdmission.parentRelation?.canonicalPath === canonicalPath
    && hero15SpAdmission.parentRelation?.sourceKind === 'BASE_SOLDIER_HERO'
    && hero15SpAdmission.parentRelation?.sourceTable === 'ConfigDataSoldierInfo'
    && hero15SpAdmission.parentRelation?.sourceField === 'GetSoldierHeros_ID'
    && hero15SpAdmission.parentRelation?.sourceArtifactPath === soldierSourcePath,
  'Hero 15 SP inherited parent evidence contract drift');
  check(hero15SpAdmission.supportRelation?.kind === 'SP_FORM_LINK'
    && hero15SpAdmission.supportRelation?.sourceTable === 'ConfigDataSPSoldierInfo'
    && hero15SpAdmission.supportRelation?.spKeyField === 'ID'
    && hero15SpAdmission.supportRelation?.normalField === 'NormalSoliderId'
    && hero15SpAdmission.supportRelation?.sourceArtifactPath === spSoldierSourcePath,
  'Hero 15 SP_FORM_LINK evidence contract drift');
  check(hero15SpAdmission.transformation?.sourceKind === 'SP_SOLDIER_INHERIT'
    && hero15SpAdmission.transformation?.sourceClass === 'DERIVED'
    && hero15SpAdmission.transformation?.contractPath === `${sourceSemanticsPath}#edgeSourceKinds.SP_SOLDIER_INHERIT`
    && hero15SpAdmission.transformation?.requiresSupportRelation === 'SP_FORM_LINK'
    && hero15SpAdmission.transformation?.rule === sourceSemantics.edgeSourceKinds?.SP_SOLDIER_INHERIT?.interpretation,
  'Hero 15 SP inheritance transformation drift');
  check(hero15SpAdmission.admissionBasis?.priorValidatedTransformationClaims === 175
    && hero15SpAdmission.admissionBasis?.owningValidator === 'tools/validate-hero-soldier-relations.mjs'
    && hero15SpAdmission.admissionBasis?.priorCanonicalBaseline?.relationCount === 386
    && hero15SpAdmission.admissionBasis?.priorCanonicalBaseline?.provenanceCount === 387
    && hero15SpAdmission.admissionBasis?.priorCanonicalBaseline?.recordsSha256 === preHero15SpBaselineSha256
    && typeof hero15SpAdmission.admissionBasis?.limitation === 'string'
    && hero15SpAdmission.admissionBasis.limitation.includes('source-version label remains unknown'),
  'Hero 15 SP inheritance admission basis or limitation drift');
  check(Array.isArray(hero15SpAdmission.records)
    && isDeepStrictEqual(hero15SpAdmission.records.map((row) => [row.heroId, row.spSoldierId]), hero15SpAdmissionPairs),
  'Hero 15 SP inherited evidence claim set drift');
  for (const row of hero15SpAdmission.records) {
    exactKeys(row, ['heroId','normalSoldierId','spSoldierId','evidenceClass','parentLocator','supportLocator','normalValue','transformation'], `Hero 15 SP inherited evidence ${row.spSoldierId}`);
    check(row.heroId === 15 && row.evidenceClass === 'B'
      && row.parentLocator === `${canonicalPath}#heroId=15&soldierId=${row.normalSoldierId}`
      && row.supportLocator === `ConfigDataSPSoldierInfo#ID=${row.spSoldierId}/NormalSoliderId`
      && row.normalValue === row.normalSoldierId
      && row.transformation === 'SP_SOLDIER_INHERIT',
    `Hero 15 SP inherited evidence locator or transformation drift for ${row.spSoldierId}`);
  }
  check(soldierSourceManifest.artifacts?.soldierInfoEndpoints?.repoPreservedPath === soldierSourcePath
    && soldierSourceManifest.artifacts.soldierInfoEndpoints.gitBlobSha1 === sources.BASE_SOLDIER_HERO.originalSourceGitBlobSha1,
  'SoldierInfo direct-source provenance mismatch');
  check(soldierSourceManifest.artifacts?.spSoldierInfo?.repoPreservedPath === spSoldierSourcePath
    && soldierSourceManifest.artifacts.spSoldierInfo.gitBlobSha1 === sources.SP_SOLDIER_EXPAND.originalSourceGitBlobSha1,
  'SPSoldierInfo direct-source provenance mismatch');

  exactKeys(sourceSemantics, [
    'schemaVersion','responsibility','canonical','generated','productionRuntimeDependency',
    'supportedClaim','claimScope','edgeSourceKinds','supportRelationKinds','compositionRules','limitations'
  ], 'Hero-Soldier source semantics');
  check(sourceSemantics.schemaVersion === 1
    && sourceSemantics.responsibility === 'Hero-Soldier direct-source interpretation'
    && sourceSemantics.canonical === false
    && sourceSemantics.generated === false
    && sourceSemantics.productionRuntimeDependency === false,
  'Hero-Soldier source-semantics authority boundary changed');
  check(sourceSemantics.claimScope.includes('current Hero-Soldier canonical claims')
    && sourceSemantics.claimScope.includes('not a source-population inventory')
    && sourceSemantics.claimScope.includes('not') && sourceSemantics.claimScope.includes('admission authority'),
  'Hero-Soldier source-semantics scope drift');

  const kinds = sourceSemantics.edgeSourceKinds;
  const directKinds = sourceSemantics.compositionRules?.directSourceKinds;
  const derivedKinds = sourceSemantics.compositionRules?.derivedSourceKinds;
  check(isDeepStrictEqual(directKinds, ['BASE_SOLDIER_HERO', 'SP_HERO_REWARD', 'SP_SOLDIER_EXPAND'])
    && isDeepStrictEqual(derivedKinds, ['SP_SOLDIER_INHERIT']),
  'Hero-Soldier source-kind set drift');
  for (const kind of directKinds) {
    const spec = kinds?.[kind];
    const carrierSpec = sources?.[kind];
    check(spec?.class === 'DIRECT' && carrierSpec, `missing direct source semantics for ${kind}`);
    check(spec.sourceArtifactPath === carrierSpec.artifactPath
      && spec.table === carrierSpec.sourceTable
      && spec.field === carrierSpec.sourceField,
    `direct-source carrier differs from current-native semantics for ${kind}`);
    check(spec.recordKeyField === 'ID', `unsupported record-key field for ${kind}`);
  }
  const inheritSpec = kinds?.SP_SOLDIER_INHERIT;
  const link = sourceSemantics.supportRelationKinds?.[inheritSpec?.requiresSupportRelation];
  check(inheritSpec?.class === 'DERIVED'
    && isDeepStrictEqual(inheritSpec.allowedParentKinds, ['BASE_SOLDIER_HERO', 'SP_HERO_REWARD'])
    && link?.class === 'SUPPORT_ONLY'
    && link.sourceArtifactPath === sources.SP_SOLDIER_INHERIT.artifactPath
    && link.table === sources.SP_SOLDIER_INHERIT.sourceTable
    && link.normalField === sources.SP_SOLDIER_INHERIT.supportField
    && link.spField === sources.SP_SOLDIER_INHERIT.spIdField
    && link.createsHeroSoldierEdge === false
    && link.inferenceForbidden === true,
  'SP inheritance/support semantics drift');
  check(sourceSemantics.compositionRules.duplicatePairBehavior === 'MERGE_PROVENANCE'
    && sourceSemantics.compositionRules.multipleIndependentProvenanceAllowed === true
    && sourceSemantics.compositionRules.spExpandIsAdditiveNotFullList === true
    && sourceSemantics.compositionRules.spFormLinkAloneCreatesNoEdge === true,
  'Hero-Soldier composition semantics drift');

  exactKeys(canonical, ['schemaVersion','scope','heroEndpointOwner','soldierEndpointOwner','evidencePool','records'], 'canonical Hero-Soldier document');
  check(canonical.schemaVersion === 1, 'unsupported canonical schemaVersion');
  check(canonical.evidencePool === directManifestPath, 'canonical direct-source evidence manifest locator drift');
  check(Array.isArray(canonical.records), 'canonical records are missing');
  check(Array.isArray(heroOwner.records) && Array.isArray(soldierOwner.records), 'canonical endpoint owners are malformed');
  check(Array.isArray(soldierSourceDoc.records) && Array.isArray(spSoldierSourceDoc.records), 'preserved Soldier source records are malformed');

  const heroIds = new Set();
  for (const row of heroOwner.records) {
    check(Number.isInteger(row.heroId) && !heroIds.has(row.heroId), `malformed or duplicate Hero endpoint ${row.heroId}`);
    heroIds.add(row.heroId);
  }
  const soldierVariant = new Map();
  for (const row of soldierOwner.records) {
    check(Number.isInteger(row.id) && !soldierVariant.has(row.id), `malformed or duplicate Soldier endpoint ${row.id}`);
    check(row.variant === 'NORMAL' || row.variant === 'SP', `unsupported Soldier variant for ${row.id}`);
    soldierVariant.set(row.id, row.variant);
  }

  const canonicalByPair = new Map();
  let previousHeroId = -Infinity;
  let previousSoldierId = -Infinity;
  for (const row of canonical.records) {
    exactKeys(row, ['heroId','soldierId','evidenceClass','evidencePoolLocator','provenance'], `canonical Hero-Soldier ${row.heroId}:${row.soldierId}`);
    check(Number.isInteger(row.heroId) && Number.isInteger(row.soldierId), 'malformed canonical relation endpoints');
    const key = pairKey(row.heroId, row.soldierId);
    check(!canonicalByPair.has(key), `duplicate canonical pair ${key}`);
    check(row.heroId > previousHeroId || (row.heroId === previousHeroId && row.soldierId > previousSoldierId), `canonical relation ordering drift at ${key}`);
    previousHeroId = row.heroId;
    previousSoldierId = row.soldierId;
    check(heroIds.has(row.heroId), `canonical pair ${key} references missing Hero endpoint`);
    check(soldierVariant.has(row.soldierId), `canonical pair ${key} references missing Soldier endpoint`);
    check(row.evidenceClass === 'B' || (row.heroId === 15 && row.evidenceClass === 'A'), `canonical pair ${key} evidence class drift`);
    if (row.evidenceClass === 'A') {
      check(row.heroId === 15 && row.provenance.every((item) => item.sourceKind === 'BASE_SOLDIER_HERO' && item.sourceClass === 'DIRECT'), `A-class canonical pair ${key} is outside the approved NORMAL direct-source slice`);
    }
    check(row.evidencePoolLocator === `${directManifestPath}#heroId=${row.heroId}&soldierId=${row.soldierId}`, `canonical pair ${key} direct-source evidence locator drift`);
    check(Array.isArray(row.provenance) && row.provenance.length > 0, `canonical pair ${key} has no provenance`);
    canonicalByPair.set(key, row);
  }

  // The current canonical target bounds this equivalence proof. New endpoint-owner records do not
  // automatically create a completeness or admission obligation.
  const targetHeroIds = new Set(canonical.records.map((row) => row.heroId));
  const targetSoldierIds = new Set(canonical.records.map((row) => row.soldierId));
  const byPair = new Map();

  for (const row of soldierSourceDoc.records) {
    if (!targetSoldierIds.has(row.ID) || soldierVariant.get(row.ID) !== 'NORMAL') continue;
    const spec = kinds.BASE_SOLDIER_HERO;
    const heroList = row[spec.field];
    check(Array.isArray(heroList), `${spec.table}.ID=${row.ID} has malformed ${spec.field}`);
    for (const heroId of heroList) {
      addProvenance(byPair, targetHeroIds, targetSoldierIds, heroId, row.ID, {
        sourceKind: 'BASE_SOLDIER_HERO',
        sourceClass: spec.class,
        origin: { table: spec.table, recordId: row.ID, recordKeyField: spec.recordKeyField, field: spec.field },
      });
    }
  }

  for (const row of rewardEvidence.records) {
    const spec = kinds.SP_HERO_REWARD;
    for (const soldierId of row[spec.field]) {
      addProvenance(byPair, targetHeroIds, targetSoldierIds, row[spec.recordKeyField], soldierId, {
        sourceKind: 'SP_HERO_REWARD',
        sourceClass: spec.class,
        origin: { table: spec.table, recordId: row[spec.recordKeyField], recordKeyField: spec.recordKeyField, field: spec.field },
      });
    }
  }

  for (const row of spSoldierSourceDoc.records) {
    if (!targetSoldierIds.has(row.ID) || soldierVariant.get(row.ID) !== 'SP') continue;
    const spec = kinds.SP_SOLDIER_EXPAND;
    const expandedHeroes = row[spec.field] ?? [];
    check(Array.isArray(expandedHeroes), `${spec.table}.ID=${row.ID} has malformed ${spec.field}`);
    for (const heroId of expandedHeroes) {
      addProvenance(byPair, targetHeroIds, targetSoldierIds, heroId, row[spec.recordKeyField], {
        sourceKind: 'SP_SOLDIER_EXPAND',
        sourceClass: spec.class,
        origin: { table: spec.table, recordId: row[spec.recordKeyField], recordKeyField: spec.recordKeyField, field: spec.field },
      });
    }
  }

  const directEdges = [...byPair.values()].map((edge) => ({ heroId: edge.heroId, soldierId: edge.soldierId, provenance: [...edge.provenance] }));
  for (const row of spSoldierSourceDoc.records) {
    if (!targetSoldierIds.has(row.ID) || soldierVariant.get(row.ID) !== 'SP') continue;
    if (!targetSoldierIds.has(row[link.normalField])) continue;
    check(Number.isInteger(row[link.normalField]), `ConfigDataSPSoldierInfo.ID=${row.ID} has malformed NormalSoliderId`);
    for (const parent of directEdges) {
      if (parent.soldierId !== row[link.normalField]) continue;
      for (const provenance of parent.provenance) {
        if (!kinds.SP_SOLDIER_INHERIT.allowedParentKinds.includes(provenance.sourceKind)) continue;
        addProvenance(byPair, targetHeroIds, targetSoldierIds, parent.heroId, row.ID, {
          sourceKind: 'SP_SOLDIER_INHERIT',
          sourceClass: inheritSpec.class,
          origin: provenance.origin,
          parentEdge: { heroId: parent.heroId, soldierId: row[link.normalField], parentSourceKind: provenance.sourceKind },
          supportRelation: {
            kind: inheritSpec.requiresSupportRelation,
            table: link.table,
            recordId: row[link.spField],
            normalSoldierId: row[link.normalField],
            spSoldierId: row[link.spField],
          },
        });
      }
    }
  }

  const reconstructed = [...byPair.values()].sort((a, b) => a.heroId - b.heroId || a.soldierId - b.soldierId);
  const hero15NormalAdmissions = reconstructed.filter((row) => row.heroId === 15
    && row.provenance.length > 0
    && row.provenance.every((item) => item.sourceKind === 'BASE_SOLDIER_HERO'));
  const hero15SpInheritanceCandidates = reconstructed.filter((row) => row.heroId === 15
    && row.provenance.some((item) => item.sourceKind === 'SP_SOLDIER_INHERIT'));
  check(hero15NormalAdmissions.length === 7, `expected seven source-supported Hero 15 NORMAL admissions; found ${hero15NormalAdmissions.length}`);
  check(isDeepStrictEqual(hero15NormalAdmissions.map((row) => row.soldierId), [210, 326, 602, 621, 802, 811, 815]), 'Hero 15 NORMAL source-derived admission set drift');
  check(hero15SpInheritanceCandidates.length === hero15SpAdmission.records.length
    && isDeepStrictEqual(hero15SpInheritanceCandidates.map((row) => [row.heroId, row.soldierId]), hero15SpAdmission.records.map((row) => [row.heroId, row.spSoldierId])),
  'Hero 15 source-derived SP candidates differ from the independently recorded admission claims');
  for (const record of hero15SpAdmission.records) {
    const candidate = hero15SpInheritanceCandidates.find((row) => row.heroId === record.heroId && row.soldierId === record.spSoldierId);
    const parent = canonicalByPair.get(pairKey(record.heroId, record.normalSoldierId));
    const spSource = spSoldierSourceDoc.records.find((row) => row.ID === record.spSoldierId);
    check(parent?.evidenceClass === 'A'
      && parent.provenance.length === 1
      && parent.provenance[0].sourceKind === 'BASE_SOLDIER_HERO'
      && candidate?.provenance.length === 1
      && candidate.provenance[0].sourceKind === 'SP_SOLDIER_INHERIT'
      && spSource?.ID === record.spSoldierId
      && spSource?.[link.normalField] === record.normalSoldierId
      && record.normalValue === spSource?.[link.normalField],
    `Hero 15 SP inherited claim lacks its approved NORMAL parent or explicit SP_FORM_LINK: ${record.heroId}:${record.spSoldierId}`);
    const canonicalRow = canonicalByPair.get(pairKey(record.heroId, record.spSoldierId));
    check(canonicalRow?.evidenceClass === record.evidenceClass
      && isDeepStrictEqual(canonicalRow.provenance, candidate.provenance),
    `Hero 15 SP canonical admission or complete parent/support provenance drift: ${record.heroId}:${record.spSoldierId}`);
  }

  const admittedReconstructed = reconstructed;
  const admittedByPair = new Map(admittedReconstructed.map((row) => [pairKey(row.heroId, row.soldierId), row]));
  const missing = [...canonicalByPair.keys()].filter((key) => !admittedByPair.has(key));
  const extra = [...admittedByPair.keys()].filter((key) => !canonicalByPair.has(key));
  const provenanceMismatches = [];
  for (const [key, canonicalRow] of canonicalByPair) {
    const sourceRow = admittedByPair.get(key);
    if (sourceRow && !isDeepStrictEqual(canonicalRow.provenance, sourceRow.provenance)) provenanceMismatches.push(key);
  }

  const provenanceCount = admittedReconstructed.reduce((sum, row) => sum + row.provenance.length, 0);
  const sourceKindCounts = { BASE_SOLDIER_HERO: 0, SP_HERO_REWARD: 0, SP_SOLDIER_EXPAND: 0, SP_SOLDIER_INHERIT: 0 };
  for (const row of admittedReconstructed) for (const provenance of row.provenance) {
    check(Object.hasOwn(sourceKindCounts, provenance.sourceKind), `unsupported reconstructed source kind ${provenance.sourceKind}`);
    sourceKindCounts[provenance.sourceKind] += 1;
  }
  const multiProvenance = admittedReconstructed.filter((row) => row.provenance.length > 1);

  const hero15Canonical = canonical.records.filter((row) => row.heroId === 15);
  const hero15NormalCanonical = hero15Canonical.filter((row) => soldierVariant.get(row.soldierId) === 'NORMAL');
  const hero15SpCanonical = hero15Canonical.filter((row) => soldierVariant.get(row.soldierId) === 'SP');
  check(isDeepStrictEqual(hero15NormalCanonical.map((row) => row.soldierId), [210, 326, 602, 621, 802, 811, 815]), 'Hero 15 Canonical NORMAL admission set drift');
  check(hero15NormalCanonical.every((row) => row.evidenceClass === 'A' && row.provenance.length === 1 && row.provenance[0].sourceKind === 'BASE_SOLDIER_HERO'), 'Hero 15 NORMAL Canonical contains an unsupported relation');
  check(isDeepStrictEqual(hero15SpCanonical.map((row) => row.soldierId), hero15SpAdmissionPairs.map(([, soldierId]) => soldierId)), 'Hero 15 Canonical SP admission set drift');
  check(hero15SpCanonical.every((row) => row.evidenceClass === 'B' && row.provenance.length === 1 && row.provenance[0].sourceKind === 'SP_SOLDIER_INHERIT'), 'Hero 15 SP Canonical contains an unsupported or promoted direct-source claim');

  check(missing.length === 0, `missing canonical-supported edges: ${missing.join(', ') || 'none'}`);
  check(extra.length === 0, `extra direct-source edges within current admitted target: ${extra.join(', ') || 'none'}`);
  check(provenanceMismatches.length === 0, `provenance mismatches: ${provenanceMismatches.join(', ') || 'none'}`);
  const priorRecords = canonical.records.filter((row) => row.heroId !== 15);
  const priorRecordsSha256 = createHash('sha256').update(JSON.stringify(priorRecords)).digest('hex');
  check(priorRecordsSha256 === directManifest.preservedBaselineRegression.baselineRecordsSha256, 'existing 379 canonical relation Pair/Provenance set changed');
  const spAdmissionPairKeys = new Set(hero15SpAdmissionPairs.map(([heroId, soldierId]) => pairKey(heroId, soldierId)));
  const preSpAdmissionRecords = canonical.records.filter((row) => !spAdmissionPairKeys.has(pairKey(row.heroId, row.soldierId)));
  check(preSpAdmissionRecords.length === 386
    && preSpAdmissionRecords.reduce((sum, row) => sum + row.provenance.length, 0) === 387
    && createHash('sha256').update(JSON.stringify(preSpAdmissionRecords)).digest('hex') === preHero15SpBaselineSha256
    && hero15SpAdmission.admissionBasis.priorCanonicalBaseline.recordsSha256 === preHero15SpBaselineSha256,
  'pre-Hero-15-SP canonical Pair/Type/Provenance/meaning baseline changed');
  check(admittedReconstructed.length === currentRelationCount && canonical.records.length === currentRelationCount, `current relation count drift: reconstructed=${admittedReconstructed.length}; canonical=${canonical.records.length}`);
  check(provenanceCount === currentProvenanceCount, `current provenance count drift: reconstructed=${provenanceCount}`);
  check(isDeepStrictEqual(sourceKindCounts, currentSourceKindCounts), `admitted source-kind counts drift: ${JSON.stringify(sourceKindCounts)}`);
  check(isDeepStrictEqual(directManifest.preservedBaselineRegression, {
    relationCount: 379,
    provenanceCount: 380,
    sourceKindCounts: {
      BASE_SOLDIER_HERO: 170,
      SP_HERO_REWARD: 5,
      SP_SOLDIER_EXPAND: 30,
      SP_SOLDIER_INHERIT: 175,
    },
    baselineRecordsSha256: '61ea23215c88306ef9cc842477afc36e6e52ab808aaccead27fe0c01045be974',
    multiProvenanceEdges: [{ heroId: 37, soldierId: 5423, provenanceCount: 2 }],
  }), 'direct-source manifest current regression metadata drift');
  check(multiProvenance.length === 1
    && multiProvenance[0].heroId === 37
    && multiProvenance[0].soldierId === 5423
    && multiProvenance[0].provenance.length === 2,
  'current dual-provenance edge regression drift');

  return {
    relationCount: admittedReconstructed.length,
    provenanceCount,
    sourceKindCounts,
    admittedHero15SpInheritanceRelations: hero15SpCanonical.length,
    deferredSpInheritanceCandidates: 0,
    sourceReconstructionCandidateCount: reconstructed.length,
    missingEdges: missing.length,
    extraEdges: extra.length,
    provenanceMismatches: provenanceMismatches.length,
    multiProvenanceEdges: multiProvenance.length,
  };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  check(process.argv.slice(2).length === 0, 'Usage: node tools/validate-hero-soldier-relations.mjs');
  const result = await validateHeroSoldierRelations();
  process.stdout.write(`Hero-Soldier direct-source validation: PASS (${result.relationCount} admitted relations; ${result.provenanceCount} admitted provenance; ${result.admittedHero15SpInheritanceRelations} Hero 15 SP inherited admissions; ${result.deferredSpInheritanceCandidates} deferred Hero 15 SP candidates; missing ${result.missingEdges}; extra ${result.extraEdges}; provenance mismatches ${result.provenanceMismatches})\n`);
}
