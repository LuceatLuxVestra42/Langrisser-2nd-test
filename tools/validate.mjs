import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { renderGenerated, renderGeneralSsrEquipment } from './generate.mjs';

const root = process.cwd();
const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const exactKeys = (value, expected, label) => {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) {
    throw new Error(`${label} fields were ${actual.join(',')}; expected ${wanted.join(',')}`);
  }
};
const check = (condition, message) => { if (!condition) throw new Error(message); };

const jobLocalization = await readJson('canonical/job-localizations-ko.v1.json');
const heroLocalization = await readJson('canonical/hero-localizations-ko.v1.json');
const canonical = await readJson('canonical/heroes.v1.json');
const exclusiveRelations = await readJson('canonical/hero-exclusive-equipment-relations.v1.json');
const exclusiveLocalizations = await readJson('canonical/exclusive-equipment-localizations-ko.v1.json');
const heroRarities = await readJson('canonical/hero-rarities.v1.json');
const factionIdentities = await readJson('canonical/faction-identities.v1.json');
const heroFactionRelations = await readJson('canonical/hero-faction-relations.v1.json');
const factionLocalizations = await readJson('canonical/faction-localizations-ko.v1.json');
const productionLocalizations = await readJson('canonical/production-localizations-ko.v1.json');
const productionIdentities = await readJson('canonical/production-identities.v1.json');
const heroProductionRelations = await readJson('canonical/hero-production-relations.v1.json');
const talentRelations = await readJson('canonical/hero-talent-star-skills.v1.json');
const talentLocalizations = await readJson('canonical/hero-talent-localizations-ko.v1.json');
const heroRarityEvidence = await readJson('evidence/source/hero-rarity.v1.json');
const heroInfoRarityRecords = await readJson('evidence/source/configdata/ConfigDataHeroInfo.records-rarity.v1.json');
const rankInfo = await readJson('evidence/source/configdata/ConfigDataRankInfo.json');
exactKeys(canonical, ['schemaVersion', 'sourceScope', 'records'], 'canonical');
check(canonical.schemaVersion === 1, 'unsupported canonical schemaVersion');
check(canonical.sourceScope === 'CN ConfigData snapshot 2026-09-02', 'canonical source scope drift');
const expected = new Map([[5, 'Chris'], [6, 'Leon'], [8, 'Lana']]);
const expectedExpansion = new Map([[28, 'Zalrahda'], [32, 'EmmaLink'], [52, 'Angelina'], [53, 'Ranford']]);
const expectedIds = new Set([...expected.keys(), ...expectedExpansion.keys()]);
check(canonical.records.length === expectedIds.size, 'canonical must contain exactly seven admitted Heroes');
const ids = canonical.records.map((record) => record.id);
check(new Set(ids).size === ids.length, 'duplicate canonical Hero ID');
check(JSON.stringify([...ids].sort((a, b) => a - b)) === '[5,6,8,28,32,52,53]', 'canonical Hero IDs must be exactly 5, 6, 8, 28, 32, 52, and 53');

const rarityTargets = [5, 6, 8, 28, 32, 52, 53];
check(heroRarityEvidence.schemaVersion === 1 && heroRarityEvidence.source?.commit === '6475e63ee23d18adf733756c26a14fa9e3ed662c', 'Hero rarity source snapshot pin drift');
check(heroRarityEvidence.source?.repository === 'LuceatLuxVestra42/langrisser-future-guide'
  && heroRarityEvidence.source?.commitTree === '08e1e6c2773730e60b258940e31494f68d65f86a'
  && heroRarityEvidence.source?.configDataSubtree === 'b18983f60cb054c2e6e094d64cdb98979211d7fc', 'Hero rarity source tree locator drift');
check(heroRarityEvidence.sourceFiles?.heroInfo?.blobSha1 === '728daab3370f0c7779449663ea02e638677944d4'
  && heroRarityEvidence.sourceFiles?.rankInfo?.blobSha1 === 'c8a5bb9ece5e3d2869075da68c98f5e3e88f3c0b', 'Hero rarity source file anchors drift');
check(heroRarityEvidence.priorValidatedClaim?.repository === 'LuceatLuxVestra42/langrisser-future-guide'
  && heroRarityEvidence.priorValidatedClaim?.commit === '57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff'
  && heroRarityEvidence.priorValidatedClaim?.validationBlobSha1 === 'a572b97addde3a70a2fc4b08758819eef3b10866'
  && heroRarityEvidence.priorValidatedClaim?.analysisScriptPath === 'scripts/analyze_hero_rarity.cjs'
  && heroRarityEvidence.priorValidatedClaim?.analysisScriptBlobSha1 === '29fd399b427b60d4093e75c000c1b7a57de30bb7'
  && heroRarityEvidence.priorValidatedClaim?.status === 'PASS', 'inherited Hero rarity claim anchor drift');
check(heroRarityEvidence.claims?.heroRank?.class === 'A'
  && heroRarityEvidence.claims?.rankLabel?.class === 'A'
  && heroRarityEvidence.claims?.rankMeaning?.class === 'B'
  && heroRarityEvidence.canonical === false && heroRarityEvidence.generated === false
  && heroRarityEvidence.productionRuntimeDependency === false, 'Hero rarity evidence claim classes or boundary drift');
check(JSON.stringify(heroRarityEvidence.records.map((record) => record.heroId)) === JSON.stringify(rarityTargets), 'Hero rarity evidence target scope drift');
check(JSON.stringify(heroInfoRarityRecords.map((record) => record.ID)) === JSON.stringify(rarityTargets), 'preserved Hero rarity source record IDs drift');
for (const record of heroInfoRarityRecords) exactKeys(record, ['ID', 'Rank'], `preserved Hero rarity source record ${record.ID}`);
check(heroRarities.schemaVersion === 1 && heroRarities.sourceScope === canonical.sourceScope
  && JSON.stringify(heroRarities.records.map((record) => record.heroId)) === JSON.stringify(rarityTargets), 'Hero rarity canonical scope drift');
const heroInfoRarityById = new Map(heroInfoRarityRecords.map((record) => [record.ID, record]));
const evidenceRarityById = new Map(heroRarityEvidence.records.map((record) => [record.heroId, record]));
const rankLabelById = new Map(rankInfo.filter((record) => Number.isSafeInteger(record.ID)).map((record) => [record.ID, record.Desc]));
for (const rarity of heroRarities.records) {
  exactKeys(rarity, ['heroId', 'rankId', 'label', 'provenance'], `Hero ${rarity.heroId} rarity canonical`);
  const source = heroInfoRarityById.get(rarity.heroId);
  const evidence = evidenceRarityById.get(rarity.heroId);
  const sourcePath = [5, 6, 8].includes(rarity.heroId)
    ? 'evidence/source/configdata/ConfigDataHeroInfo.records-5-6-8.json'
    : 'evidence/source/configdata/ConfigDataHeroInfo.records-hero-expansion.v1.json';
  exactKeys(evidence, ['heroId', 'rankId', 'label', 'heroInfoRecord', 'rankInfoRecord'], `Hero ${rarity.heroId} rarity evidence`);
  check(source && source.Rank === rarity.rankId, `Hero ${rarity.heroId} rarity rank differs from HeroInfo.Rank`);
  check(evidence?.rankId === source.Rank, `Hero ${rarity.heroId} rarity evidence differs from HeroInfo.Rank`);
  check(evidence.heroInfoRecord === `${sourcePath}#ID=${rarity.heroId}`
    && evidence.rankInfoRecord === `evidence/source/configdata/ConfigDataRankInfo.json#ID=${source.Rank}`, `Hero ${rarity.heroId} rarity evidence locator drift`);
  check(rankLabelById.get(source.Rank) === rarity.label && evidence.label === rarity.label, `Hero ${rarity.heroId} rarity label differs from RankInfo.Desc`);
  check(rarity.provenance?.rank === `evidence/source/configdata/ConfigDataHeroInfo.records-rarity.v1.json#ID=${rarity.heroId}/Rank`
    && rarity.provenance?.label === `evidence/source/configdata/ConfigDataRankInfo.json#ID=${source.Rank}/Desc`, `Hero ${rarity.heroId} rarity provenance locator drift`);
}

const heroInfoRows = await readJson('evidence/source/configdata/ConfigDataHeroInfo.records-5-6-8.json');
const heroInfoById = new Map(heroInfoRows.map((record) => [record.ID, record]));
const charRows = await readJson('evidence/source/configdata/ConfigDataCharImageInfo.records-5-6-8.json');
const charById = new Map(charRows.map((record) => [record.ID, record]));
const expansionHeroInfoRows = await readJson('evidence/source/configdata/ConfigDataHeroInfo.records-hero-expansion.v1.json');
const expansionHeroInfoById = new Map(expansionHeroInfoRows.map((record) => [record.ID, record]));
const expansionCharRows = await readJson('evidence/source/configdata/ConfigDataCharImageInfo.records-hero-expansion.v1.json');
const expansionCharById = new Map(expansionCharRows.records.map((record) => [record.ID, record]));
const portraits = await readJson('evidence/source/portraits/hero-portrait-slice.v1.json');
const portraitByHero = new Map(portraits.records.map((record) => [record.heroId, record]));
const expansionPortraits = await readJson('evidence/source/portraits/hero-portrait-expansion.v1.json');
const expansionPortraitByHero = new Map(expansionPortraits.records.map((record) => [record.heroId, record]));
const expansionJobConnections = await readJson('evidence/source/jobs/hero-job-connection-expansion.v1.json');
const relationOwner = await readJson('canonical/hero-job-relations.v1.json');
const spRelationEvidence = await readJson('evidence/source/jobs/hero-sp-job-relation.v1.json');
const priorPortraitEvidence = await readJson('evidence/source/portraits/hero-portrait-prior-validation.v1.json');
const jobEvidence = await readJson('evidence/source/jobs/hero-job-connection-slice.v1.json');
const connectionRows = await readJson('evidence/source/configdata/ConfigDataJobConnectionInfo.records-hero-5-6-8.json');
const jobRows = await readJson('evidence/source/configdata/ConfigDataJobInfo.records-hero-5-6-8.json');
const connectionById = new Map(connectionRows.map((record) => [record.ID, record]));
const jobById = new Map(jobRows.map((record) => [record.ID, record]));
check(portraits.canonical === false && portraits.generated === false, 'portrait evidence must remain source evidence');
check(portraits.productionRuntimeDependency === false, 'evidence metadata must not become a runtime dependency');
check(portraits.scope.krDisplayName === 'C_DEFERRED' && portraits.scope.rankToRarity === 'C_DEFERRED', 'portrait evidence claim scope drift');
check(portraits.admissionBasis.contradictions.length === 0, 'unresolved contradiction exists in the admitted slice scope');
check(priorPortraitEvidence.canonical === false && priorPortraitEvidence.generated === false && priorPortraitEvidence.productionRuntimeDependency === false, 'surviving portrait support must remain non-runtime evidence');
check(priorPortraitEvidence.predecessor.repository === portraits.admissionBasis.priorValidation.repository, 'surviving portrait evidence repository locator drift');
check(priorPortraitEvidence.predecessor.commit === portraits.admissionBasis.priorValidation.commit, 'surviving portrait evidence commit locator drift');
check(priorPortraitEvidence.predecessor.validation.sourceTrace.gitBlobSha1 === portraits.admissionBasis.priorValidation.sourceTrace.gitBlobSha1, 'surviving source-trace locator drift');
check(priorPortraitEvidence.predecessor.validation.artworkValidation.gitBlobSha1 === portraits.admissionBasis.priorValidation.artworkValidation.gitBlobSha1, 'surviving artwork-validation locator drift');
check(priorPortraitEvidence.predecessor.sourceRecords.heroInfo.gitBlobSha1 === portraits.sourceRecords.heroInfo.sourceGitBlobSha1, 'surviving HeroInfo source locator drift');
check(priorPortraitEvidence.predecessor.sourceRecords.charImageInfo.gitBlobSha1 === portraits.sourceRecords.charImageInfo.sourceGitBlobSha1, 'surviving CharImageInfo source locator drift');
check(portraits.sourceRecords.charImageInfo.sourceGitBlobSha1 === '397afb3e76c0fe4f3e424c04ba68459ff48d74c5', 'CharImageInfo source locator drift');
check(portraits.sourceRecords.charImageInfo.sourceSha256 === '3a412fa72f8e4626bc5a723b8bede6a5b0f9032711bc3922f4234ea322b8582a', 'CharImageInfo source hash drift');
check(portraits.extraction.procedure.scriptGitBlobSha1 === 'a13be98a59dadcfc95e2287c138ff56e76b86518', 'extraction procedure locator drift');
check(priorPortraitEvidence.extraction.script.gitBlobSha1 === portraits.extraction.procedure.scriptGitBlobSha1, 'surviving extraction procedure locator drift');
check(priorPortraitEvidence.extraction.clientBuild.installVersion === portraits.extraction.clientBuild.installVersion, 'surviving client-build locator drift');
check(priorPortraitEvidence.extraction.clientBuild.packageBytes === portraits.extraction.clientBuild.packageBytes, 'surviving client-package size locator drift');
check(priorPortraitEvidence.records.length === 3, 'surviving portrait evidence must cover the selected slice only');
check(jobEvidence.canonical === false && jobEvidence.generated === false && jobEvidence.productionRuntimeDependency === false, 'Job relation evidence must remain source-only');
check(jobEvidence.sourceScope === canonical.sourceScope, 'Job relation evidence scope differs from canonical snapshot');
check(jobEvidence.claims.heroFieldToConnectionId.class === 'B' && jobEvidence.claims.connectionJobIdToJobInfoId.class === 'B' && jobEvidence.claims.selectedRecordsExist.class === 'A', 'Job relation evidence classes drift');
check(jobEvidence.limitations.some((item) => item.includes('not confirmed to match this exact snapshot')), 'Job relation version limitation must remain explicit');
check(connectionRows.length === 18 && jobRows.length === 18, 'preserved Job relation source subsets must contain exactly the 18 selected rows');
check(jobEvidence.records.length === 18, 'Job relation evidence manifest must cover exactly the selected relation rows');
const admittedPairs = new Set();
const expectedByHero = new Map([[5, 6], [6, 6], [8, 6]]);
const expectedPairs = new Map([
  [5, [817, 806, 807, 803, 812, 813]],
  [6, [301, 303, 302, 202, 307, 306]],
  [8, [701, 805, 702, 703, 810, 706]],
]);

for (const record of canonical.records.filter((item) => expected.has(item.id))) {
  exactKeys(record, ['id', 'nameEng', 'portrait', 'jobConnections', 'provenance'], `Hero ${record.id}`);
  exactKeys(record.provenance, ['identity', 'nameEng', 'portrait', 'jobConnections'], `Hero ${record.id} provenance`);
  check(expected.get(record.id) === record.nameEng, `Hero ${record.id} Name_Eng differs from admitted expected value`);
  const sourceHero = heroInfoById.get(record.id);
  check(sourceHero, `missing HeroInfo source record ${record.id}`);
  check(sourceHero.Name_Eng === record.nameEng, `Hero ${record.id} Name_Eng differs from raw source`);
  check(record.provenance.identity.includes(`#ID=${record.id}`), `Hero ${record.id} identity provenance locator missing`);
  check(record.provenance.nameEng.includes(`#ID=${record.id}/Name_Eng`), `Hero ${record.id} Name_Eng provenance locator missing`);
  check(record.provenance.jobConnections === `evidence/source/jobs/hero-job-connection-slice.v1.json#heroId=${record.id}`, `Hero ${record.id} Job relation evidence locator missing`);

  const portrait = portraitByHero.get(record.id);
  check(portrait, `missing portrait evidence record ${record.id}`);
  check(portrait.charImageIdClass === 'A', `Hero ${record.id} P1 raw CharImage_ID must remain A`);
  check(portrait.relationClass === 'B' && portrait.heroPaintingRoleClass === 'B' && portrait.sourceAssetClass === 'B' && portrait.reproducibilityClass === 'B', `Hero ${record.id} P2–P5 must remain B`);
  const survivingPortrait = priorPortraitEvidence.records.find((item) => item.heroId === record.id);
  check(survivingPortrait, `missing surviving portrait support record ${record.id}`);
  check(survivingPortrait.charImageId === portrait.charImageId && survivingPortrait.heroPainting === portrait.heroPainting, `Hero ${record.id} surviving source-record locator mismatch`);
  check(survivingPortrait.bundle.name === portrait.bundleName, `Hero ${record.id} surviving bundle locator mismatch`);
  check(survivingPortrait.objectGraph.prefabPathId === portrait.prefabPathId && survivingPortrait.objectGraph.spritePathId === portrait.spritePathId && survivingPortrait.objectGraph.texturePathId === portrait.texturePathId, `Hero ${record.id} surviving object-path locator mismatch`);
  check(survivingPortrait.extractedPng.sha256 === portrait.extractedSourcePng.sha256 && survivingPortrait.extractedPng.bytes === portrait.extractedSourcePng.bytes, `Hero ${record.id} surviving extracted-image integrity locator mismatch`);
  const bundleEvidence = priorPortraitEvidence.extraction.bundles[portrait.bundleName];
  check(bundleEvidence && bundleEvidence.sha256 === survivingPortrait.bundle.sha256 && bundleEvidence.bundleBytes === survivingPortrait.bundle.bytes, `Hero ${record.id} surviving bundle integrity locator mismatch`);
  check(sourceHero.CharImage_ID === portrait.charImageId, `Hero ${record.id} raw CharImage_ID does not match its source evidence value`);
  const charImage = charById.get(sourceHero.CharImage_ID);
  check(charImage, `CharImageInfo foreign-key lookup unresolved for Hero ${record.id}`);
  check(charImage.HeroPainting === portrait.heroPainting, `Hero ${record.id} HeroPainting differs from preserved source row`);
  check(record.provenance.portrait.endsWith(`#heroId=${record.id}`), `Hero ${record.id} portrait provenance locator missing`);
  check(record.portrait === portrait.extractedSourcePng.path, `Hero ${record.id} canonical portrait path differs from evidence`);
  const sourceFields = new Map([[sourceHero.JobConnection_ID, 'JobConnection_ID'], ...sourceHero.UseableJobConnections_ID.map((connectionId) => [connectionId, 'UseableJobConnections_ID'])]);
  check(record.jobConnections.length === expectedByHero.get(record.id), `Hero ${record.id} must have exactly the selected six Job connection records`);
  check(JSON.stringify(record.jobConnections.map((item) => item.jobId)) === JSON.stringify(expectedPairs.get(record.id)), `Hero ${record.id} Job relation pairs changed from the admitted slice`);
  const sourceIds = [sourceHero.JobConnection_ID, ...sourceHero.UseableJobConnections_ID];
  check(JSON.stringify(record.jobConnections.map((item) => item.connectionId)) === JSON.stringify(sourceIds), `Hero ${record.id} Job connection IDs must follow the explicit raw HeroInfo fields in stored source order`);
  for (const relation of record.jobConnections) {
    exactKeys(relation, ['connectionId', 'jobId', 'sourceField'], `Hero ${record.id} Job relation`);
    check(relation.sourceField === sourceFields.get(relation.connectionId), `Hero ${record.id} relation sourceField differs from raw HeroInfo`);
    const key = `${record.id}:${relation.connectionId}`;
    check(!admittedPairs.has(key), `duplicate Hero connection pair ${key}`);
    admittedPairs.add(key);
    const sourceRelation = connectionById.get(relation.connectionId);
    check(sourceRelation, `missing preserved JobConnectionInfo.ID ${relation.connectionId}`);
    check(sourceRelation.Job_ID === relation.jobId, `Hero ${record.id} connection ${relation.connectionId} Job_ID differs from canonical target`);
    check(jobById.has(relation.jobId), `missing preserved JobInfo.ID ${relation.jobId}`);
    const manifestRow = jobEvidence.records.find((item) => item.heroId === record.id && item.connectionId === relation.connectionId);
    check(manifestRow && manifestRow.jobId === relation.jobId && manifestRow.sourceField === relation.sourceField, `Hero ${record.id} relation evidence locator mismatch for connection ${relation.connectionId}`);
  }
  check(/^assets\/portraits\/hero-(5|6|8)\.png$/.test(record.portrait), `Hero ${record.id} portrait path outside slice asset scope`);
  check(/^[-]?\d+$/.test(portrait.prefabPathId) && /^[-]?\d+$/.test(portrait.spritePathId) && /^[-]?\d+$/.test(portrait.texturePathId), `Hero ${record.id} Unity path IDs must be exact decimal strings`);
  const assetPath = resolve(root, record.portrait);
  check(assetPath.startsWith(`${root}${sep}`), `Hero ${record.id} portrait path escapes repository`);
  const bytes = await readFile(assetPath);
  const digest = createHash('sha256').update(bytes).digest('hex');
  check(bytes.length === portrait.extractedSourcePng.bytes, `Hero ${record.id} portrait byte length mismatch`);
  check(digest === portrait.extractedSourcePng.sha256, `Hero ${record.id} portrait SHA-256 mismatch`);
  check(portrait.extractedSourcePng.width > 0 && portrait.extractedSourcePng.height > 0, `Hero ${record.id} portrait dimensions invalid`);
  check(JSON.stringify(survivingPortrait.extractedPng.dimensions) === JSON.stringify([portrait.extractedSourcePng.width, portrait.extractedSourcePng.height]), `Hero ${record.id} surviving image dimensions locator mismatch`);
}

for (const record of canonical.records.filter((item) => expectedExpansion.has(item.id))) {
  exactKeys(record, ['id', 'nameEng', 'portrait', 'jobConnections', 'provenance'], `Hero ${record.id}`);
  exactKeys(record.provenance, ['identity', 'nameEng', 'portrait', 'jobConnections'], `Hero ${record.id} provenance`);
  check(expectedExpansion.get(record.id) === record.nameEng, `Hero ${record.id} Name_Eng differs from admitted expected value`);
  const sourceHero = expansionHeroInfoById.get(record.id);
  check(sourceHero && sourceHero.Name_Eng === record.nameEng, `Hero ${record.id} Name_Eng differs from preserved expansion source`);
  check(record.provenance.identity === `evidence/source/configdata/ConfigDataHeroInfo.records-hero-expansion.v1.json#ID=${record.id}`, `Hero ${record.id} identity provenance locator mismatch`);
  check(record.provenance.nameEng === `evidence/source/configdata/ConfigDataHeroInfo.records-hero-expansion.v1.json#ID=${record.id}/Name_Eng`, `Hero ${record.id} Name_Eng provenance locator mismatch`);
  const portrait = expansionPortraitByHero.get(record.id);
  check(portrait && sourceHero.CharImage_ID === portrait.charImageId, `Hero ${record.id} portrait evidence linkage mismatch`);
  const charImage = expansionCharById.get(sourceHero.CharImage_ID);
  check(charImage && charImage.HeroPainting === portrait.heroPainting, `Hero ${record.id} CharImageInfo HeroPainting mismatch`);
  check(record.provenance.portrait === `evidence/source/portraits/hero-portrait-expansion.v1.json#heroId=${record.id}`, `Hero ${record.id} portrait provenance locator mismatch`);
  check(record.portrait === portrait.extractedSourcePng.path, `Hero ${record.id} canonical portrait path differs from admitted evidence`);
  const assetPath = resolve(root, record.portrait);
  const bytes = await readFile(assetPath);
  check(bytes.length === portrait.extractedSourcePng.bytes, `Hero ${record.id} portrait byte length mismatch`);
  check(createHash('sha256').update(bytes).digest('hex') === portrait.extractedSourcePng.sha256, `Hero ${record.id} portrait SHA-256 mismatch`);
  const expectedConnections = expansionJobConnections.records.filter((row) => row.heroId === record.id).map((row) => ({ connectionId: row.connectionId, jobId: row.jobId, sourceField: row.sourceField }));
  if (record.id === 53) {
    const spRelation = spRelationEvidence.records.find((row) => row.heroId === 53);
    check(spRelation && spRelation.spJobConnectionId === 536 && spRelation.spJobId === 426, 'Hero 53 SP presentation relation source locator drift');
    expectedConnections.push({ connectionId: spRelation.spJobConnectionId, jobId: spRelation.spJobId, sourceField: 'JobConnection_ID' });
  }
  check(JSON.stringify(record.jobConnections) === JSON.stringify(expectedConnections), `Hero ${record.id} Job connection presentation differs from current evidence owners`);
  const expectedRelationPairs = relationOwner.records.filter((row) => row.heroId === record.id).map((row) => row.jobId).sort((a, b) => a - b);
  const actualRelationPairs = record.jobConnections.map((row) => row.jobId).sort((a, b) => a - b);
  check(JSON.stringify(actualRelationPairs) === JSON.stringify(expectedRelationPairs), `Hero ${record.id} presented Job IDs differ from current relation canonical`);
  const expectedJobProvenance = record.id === 53 ? 'canonical/hero-job-relations.v1.json#heroId=53' : `evidence/source/jobs/hero-job-connection-expansion.v1.json#heroId=${record.id}`;
  check(record.provenance.jobConnections === expectedJobProvenance, `Hero ${record.id} Job relation provenance locator mismatch`);
}

const expectedGenerated = renderGenerated(canonical, heroLocalization, jobLocalization, exclusiveRelations, exclusiveLocalizations, heroRarities, factionIdentities, heroFactionRelations, productionIdentities, heroProductionRelations, talentRelations, talentLocalizations, factionLocalizations, productionLocalizations);
const generated = await readFile(resolve(root, 'generated/hero-slice.v1.json'), 'utf8');
check(generated === expectedGenerated, 'generated consumer is stale or non-deterministic relative to canonical input');
const generatedJson = JSON.parse(generated);
exactKeys(generatedJson, ['schemaVersion', 'heroes'], 'generated consumer');
check(generatedJson.heroes.every((hero) => {
  const expectedKeys = ['exclusiveEquipment', 'factions', 'id', 'jobConnections', 'nameEng', 'nameKo', 'origins', 'portrait', 'rarity'];
  if (talentRelations.records.some((row) => row.heroId === hero.id)) expectedKeys.push('talent');
  return JSON.stringify(Object.keys(hero).sort()) === JSON.stringify(expectedKeys.sort());
}), 'generated consumer contains non-presentation fields');
for (const hero of generatedJson.heroes) {
  if (hero.talent !== undefined) {
    exactKeys(hero.talent, ['nameKo', 'starDescriptions'], `Hero ${hero.id} Talent`);
    check(typeof hero.talent.nameKo === 'string' && hero.talent.nameKo.trim() && Array.isArray(hero.talent.starDescriptions), `Hero ${hero.id} generated Talent is malformed`);
    check(JSON.stringify(hero.talent.starDescriptions.map((row) => row.star)) === '[3,4,5,6]', `Hero ${hero.id} generated Talent star list is incomplete`);
    for (const row of hero.talent.starDescriptions) {
      exactKeys(row, ['star', 'skillId', 'descriptionKoRaw'], `Hero ${hero.id} Talent star ${row.star}`);
      check(Number.isSafeInteger(row.star) && Number.isSafeInteger(row.skillId) && typeof row.descriptionKoRaw === 'string' && row.descriptionKoRaw.trim(), `Hero ${hero.id} Talent star description is malformed`);
    }
  }
  check(Array.isArray(hero.factions) && hero.factions.length > 0, `Hero ${hero.id} generated Faction list is missing`);
  for (const faction of hero.factions) {
    const localized = faction.localizationStatus === 'PROJECT_REVIEWED';
    exactKeys(faction, localized ? ['factionId', 'nameCn', 'nameKo', 'localizationStatus'] : ['factionId', 'nameCn', 'localizationStatus'], `Hero ${hero.id} generated Faction`);
    check(Number.isSafeInteger(faction.factionId) && typeof faction.nameCn === 'string' && faction.nameCn.trim(), `Hero ${hero.id} generated Faction is malformed`);
    check(localized ? typeof faction.nameKo === 'string' && faction.nameKo.trim() : faction.localizationStatus === 'UNTRANSLATED', `Hero ${hero.id} generated Faction localization state is malformed`);
  }
  check(Array.isArray(hero.origins) && hero.origins.length > 0, `Hero ${hero.id} generated Production list is missing`);
  const originIds = new Set();
  for (const origin of hero.origins) {
    exactKeys(origin, ['productionId', 'nameCn', 'nameKo', 'localizationStatus'], `Hero ${hero.id} generated Production`);
    check(Number.isSafeInteger(origin.productionId) && typeof origin.nameCn === 'string' && origin.nameCn.trim()
      && typeof origin.nameKo === 'string' && origin.nameKo.trim() && origin.localizationStatus === 'PROJECT_REVIEWED'
      && !originIds.has(origin.productionId), `Hero ${hero.id} generated Production is malformed or duplicated`);
    originIds.add(origin.productionId);
  }
}
for (const hero of generatedJson.heroes) {
  const expectedOrigins = heroProductionRelations.records.filter((relation) => relation.heroId === hero.id)
    .map((relation) => {
      const identity = productionIdentities.records.find((record) => record.productionId === relation.productionId);
      const localization = productionLocalizations.records.find((record) => record.productionId === relation.productionId);
      return identity && localization && { productionId: identity.productionId, nameCn: identity.nameCn, nameKo: localization.nameKo, localizationStatus: 'PROJECT_REVIEWED' };
    })
    .sort((a, b) => a.productionId - b.productionId);
  check(JSON.stringify(hero.origins) === JSON.stringify(expectedOrigins), `Hero ${hero.id} generated Production data differs from Canonical ID JOIN`);
}
const heroNameKoById = new Map();
for (const localization of heroLocalization.records) {
  check(Number.isInteger(localization.heroId), `malformed Hero Korean localization ID ${localization.heroId}`);
  check(!heroNameKoById.has(localization.heroId), `duplicate Hero Korean localization ID ${localization.heroId}`);
  check(typeof localization.nameKo === 'string' && localization.nameKo.length > 0, `missing Hero Korean display name for ${localization.heroId}`);
  heroNameKoById.set(localization.heroId, localization.nameKo);
}
check(generatedJson.heroes.every((hero) => hero.nameKo === heroNameKoById.get(hero.id)), 'generated Korean Hero labels differ from canonical localization by Hero ID');
check(generatedJson.heroes.every((hero) => hero.jobConnections.every((relation) => typeof relation.jobNameKo === 'string' && relation.jobNameKo.length > 0)), 'generated consumer has missing Korean Job localization');
const expectedEquipmentByHero = new Map([[5, 447], [6, 416], [8, 275], [28, 412], [32, 287], [52, 294], [53, 296]]);
check(generatedJson.heroes.length === 7 && JSON.stringify(generatedJson.heroes.map((hero) => hero.id)) === '[5,6,8,28,32,52,53]', 'visible Hero population must be exactly 5, 6, 8, 28, 32, 52, and 53');
for (const hero of generatedJson.heroes) {
  exactKeys(hero.exclusiveEquipment, ['equipmentId', 'equipmentNameKo', 'effectDescriptionKo'], `Hero ${hero.id} Exclusive Equipment`);
  check(hero.exclusiveEquipment.equipmentId === expectedEquipmentByHero.get(hero.id), `Hero ${hero.id} Exclusive Equipment relation ID mismatch`);
  check(typeof hero.exclusiveEquipment.equipmentNameKo === 'string' && hero.exclusiveEquipment.equipmentNameKo.length > 0, `Hero ${hero.id} Exclusive Equipment Korean name missing`);
  check(typeof hero.exclusiveEquipment.effectDescriptionKo === 'string' && hero.exclusiveEquipment.effectDescriptionKo.length > 0, `Hero ${hero.id} Exclusive Equipment effect missing`);
}


const equipmentIdentity = await readJson('canonical/general-ssr-equipment.v1.json');
const equipmentLocalization = await readJson('canonical/general-ssr-equipment-localizations-ko.v1.json');
const equipmentGeneratedText = await readFile(resolve(root, 'generated/general-ssr-equipment.v1.json'), 'utf8');
check(Array.isArray(equipmentIdentity.records) && Array.isArray(equipmentLocalization.records), 'General SSR Equipment canonical records missing');
check(equipmentGeneratedText === renderGeneralSsrEquipment(equipmentIdentity, equipmentLocalization), 'generated General SSR Equipment consumer is stale or non-deterministic');
const equipmentGenerated = JSON.parse(equipmentGeneratedText);
exactKeys(equipmentGenerated, ['schemaVersion', 'equipment'], 'generated General SSR Equipment');
check(equipmentGenerated.schemaVersion === 1 && Array.isArray(equipmentGenerated.equipment), 'generated General SSR Equipment schema mismatch');
const identityIds = new Set(equipmentIdentity.records.map((record) => record.id));
const localizationById = new Map();
for (const record of equipmentLocalization.records) {
  check(Number.isInteger(record.equipmentId) && !localizationById.has(record.equipmentId), 'malformed or duplicate General SSR Equipment localization ID');
  localizationById.set(record.equipmentId, record);
}
const generatedIds = equipmentGenerated.equipment.map((record) => record.equipmentId);
check(new Set(generatedIds).size === generatedIds.length && generatedIds.length === identityIds.size && generatedIds.every((id) => identityIds.has(id)), 'generated General SSR Equipment ID set differs from canonical identity');
for (const record of equipmentGenerated.equipment) {
  exactKeys(record, ['equipmentId', 'nameKo', 'effectDescriptionKo'], 'generated General SSR Equipment ' + record.equipmentId);
  const localized = localizationById.get(record.equipmentId);
  check(localized && record.nameKo === localized.nameKo && record.effectDescriptionKo === localized.effectDescriptionKo, 'generated General SSR Equipment localization parity mismatch for ' + record.equipmentId);
}

process.stdout.write('Hero slice and General SSR Equipment validators: PASS (Hero relation/source locators, portrait asset integrity, generated freshness and presentation shape; unrelated semantic domains excluded)\n');
