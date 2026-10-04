import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const PATHS = Object.freeze({
  heroIdentities: 'canonical/hero-identities.v1.json',
  heroInfo: 'evidence/source/configdata/ConfigDataHeroInfo.records-hero-ko-localization.v1.json',
  snapshot: 'evidence/source/configdata/snapshot.json',
  heroIdentityManifest: 'evidence/source/configdata/ConfigDataHeroInfo.records-playable-identity.source-manifest.v1.json',
  source: 'evidence/localization/source/hero-names-ko.v1.txt',
  sourceManifest: 'evidence/localization/source/hero-names-ko.source-manifest.v1.json',
  evidence: 'evidence/localization/hero-names-ko.v1.json',
  canonical: 'canonical/hero-localizations-ko.v1.json',
});
const fail = (message) => { throw new Error(`Hero Korean localization validation failed: ${message}`); };
const check = (condition, message) => { if (!condition) fail(message); };
const same = (a, b) => isDeepStrictEqual(a, b);
const exactKeys = (value, expected, label) =>
  check(same(Object.keys(value).sort(), [...expected].sort()), `${label} has unexpected or missing fields`);
const sameIdSet = (a, b) => a.length === b.length && a.every((id) => b.includes(id));

export function parseHeroLocalizationSource(text) {
  const rows = [];
  const seen = new Set();
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf(' - ');
    check(separator > 0 && line.indexOf(' - ', separator + 3) === -1,
      `malformed localization source row at line ${i + 1}`);
    const nameCn = line.slice(0, separator);
    const nameKo = line.slice(separator + 3);
    check(nameCn.trim() === nameCn && nameKo.trim() === nameKo && nameKo.length > 0,
      `empty or malformed localization source row at line ${i + 1}`);
    check(!seen.has(nameCn), `duplicate Chinese localization key ${nameCn}`);
    seen.add(nameCn);
    rows.push({ nameCn, nameKo, sourceLine: i + 1, sourceRow: rows.length + 1 });
  }
  return rows;
}

export async function readHeroKoLocalizationInputs(root = process.cwd()) {
  const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
  const [heroIdentities, heroInfoBytes, snapshot, heroIdentityManifest, sourceBytes, sourceManifest, evidence, canonical] =
    await Promise.all([
      readJson(PATHS.heroIdentities),
      readFile(resolve(root, PATHS.heroInfo)),
      readJson(PATHS.snapshot),
      readJson(PATHS.heroIdentityManifest),
      readFile(resolve(root, PATHS.source)),
      readJson(PATHS.sourceManifest),
      readJson(PATHS.evidence),
      readJson(PATHS.canonical),
    ]);
  return {
    heroIdentities,
    heroInfoBytes,
    heroInfoRecords: JSON.parse(heroInfoBytes.toString('utf8')),
    snapshot,
    heroIdentityManifest,
    sourceText: sourceBytes.toString('utf8'),
    sourceManifest,
    evidence,
    canonical,
  };
}

function sourceGitBlobSha1(bytes) {
  const body = Buffer.from(bytes);
  return createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${body.length}\0`), body])).digest('hex');
}

export function validateHeroKoLocalization(input) {
  const { heroIdentities, heroInfoBytes, heroInfoRecords, snapshot, heroIdentityManifest,
    sourceText, sourceManifest, evidence, canonical } = input;
  check(heroIdentities.schemaVersion === 1 && Array.isArray(heroIdentities.records), 'Hero identity schema mismatch');
  check(heroIdentities.records.length === 267, 'Hero identity population count changed');
  const identityIds = heroIdentities.records.map((row) => row.heroId);
  check(identityIds.every(Number.isInteger), 'malformed Hero identity ID');
  check(new Set(identityIds).size === identityIds.length, 'duplicate Hero identity ID');
  const identitySet = new Set(identityIds);

  check(sourceManifest.schemaVersion === 1 && Array.isArray(sourceManifest.targetIds),
    'localization target declaration schema mismatch');
  const targetIds = sourceManifest.targetIds;
  check(targetIds.every(Number.isInteger), 'malformed target Hero ID');
  check(new Set(targetIds).size === targetIds.length, 'duplicate target Hero ID');
  check(targetIds.every((id) => identitySet.has(id)), 'target Hero ID is absent from the existing identity owner');

  check(Array.isArray(heroInfoRecords), 'ConfigData HeroInfo evidence is not an array');
  const directIds = heroInfoRecords.map((row) => row.ID);
  check(directIds.every(Number.isInteger), 'malformed direct ConfigData Hero ID');
  check(new Set(directIds).size === directIds.length, 'duplicate direct ConfigData Hero ID');
  check(heroInfoRecords.every((row) => typeof row.Name === 'string' && row.Name.length > 0),
    'direct ConfigData Name missing');
  check(snapshot.source?.repository === 'LuceatLuxVestra42/langrisser-future-guide'
    && snapshot.source.commit === '6475e63ee23d18adf733756c26a14fa9e3ed662c',
  'pinned ConfigData source repository/commit mismatch');
  check(snapshot.sourceFiles?.['data/configdata/ConfigDataHeroInfo.json']?.gitBlob
    === '728daab3370f0c7779449663ea02e638677944d4',
  'pinned ConfigData source blob mismatch');
  check(snapshot.preservedArtifacts?.[PATHS.heroInfo]?.gitBlob === sourceGitBlobSha1(heroInfoBytes),
    'preserved ConfigData HeroInfo artifact Git blob mismatch');
  check(heroIdentityManifest.sourceRepository === snapshot.source.repository
    && heroIdentityManifest.sourceCommit === snapshot.source.commit
    && heroIdentityManifest.sourcePath === 'data/configdata/ConfigDataHeroInfo.json'
    && heroIdentityManifest.sourceBlobSha1 === snapshot.sourceFiles['data/configdata/ConfigDataHeroInfo.json'].gitBlob,
  'playable Hero source manifest does not match direct ConfigData evidence');

  const textBytes = Buffer.from(sourceText, 'utf8');
  const sourceHash = createHash('sha256').update(textBytes).digest('hex');
  check(sourceManifest.repoPreservedPath === PATHS.source
    && sourceManifest.sourceIdentity === 'User-provided Project localization reference; upload artifact libfile_893eb8bea16081918519d321d2e5720a',
  'localization source identity/path mismatch');
  check(sourceManifest.sourceSha256 === sourceHash && sourceManifest.sourceBytes === textBytes.length,
    'localization source hash or byte count mismatch');
  check(sourceManifest.sourceVersionStatus === 'unknown'
    && sourceManifest.sourceProvenanceStatus === 'incomplete'
    && sourceManifest.officialKrProvenanceStatus === 'unverified'
    && sourceManifest.scope === 'localization/presentation only'
    && sourceManifest.targetDeclarationRole === 'Explicit target set for this localization owner only; not Hero population, migration backlog, or selection from reference order.',
  'localization source limitations or target authority were overstated');
  check(sourceManifest.sourceRowCount === 267, 'localization reference integrity count mismatch');
  const sourceRows = parseHeroLocalizationSource(sourceText);
  check(sourceRows.length === sourceManifest.sourceRowCount, 'localization source row count differs from manifest');
  const sourceByName = new Map(sourceRows.map((row) => [row.nameCn, row]));
  check(sourceManifest.selectedRowCount === targetIds.length
    && Array.isArray(sourceManifest.selectedRows)
    && sourceManifest.selectedRows.length === targetIds.length,
  'selected source locator count mismatch');
  const selectedById = new Map();
  for (const row of sourceManifest.selectedRows) {
    exactKeys(row, ['heroId', 'sourceLine', 'sourceRow', 'nameCn'], 'selected localization source row');
    check(Number.isInteger(row.heroId) && !selectedById.has(row.heroId),
      'duplicate or malformed selected source Hero ID');
    check(Number.isInteger(row.sourceLine) && row.sourceLine > 0
      && Number.isInteger(row.sourceRow) && row.sourceRow > 0
      && typeof row.nameCn === 'string' && row.nameCn.length > 0,
    `malformed selected source locator for Hero ${row.heroId}`);
    selectedById.set(row.heroId, row);
  }
  check(sameIdSet([...selectedById.keys()], targetIds), 'target declaration/selected rows mismatch');
  check(sameIdSet(directIds, targetIds), 'direct ConfigData target ID set mismatch');

  check(evidence.schemaVersion === 1 && Array.isArray(evidence.records), 'Hero localization evidence schema mismatch');
  check(evidence.canonical === false && evidence.generated === false && evidence.productionRuntimeDependency === false,
    'Hero localization evidence authority boundary changed');
  check(evidence.sourceManifest === PATHS.sourceManifest, 'Hero localization source manifest locator mismatch');
  check(evidence.upstreamSource?.repository === snapshot.source.repository
    && evidence.upstreamSource.commit === snapshot.source.commit
    && evidence.upstreamSource.path === 'data/configdata/ConfigDataHeroInfo.json'
    && evidence.upstreamSource.sourceBlobSha1 === snapshot.sourceFiles['data/configdata/ConfigDataHeroInfo.json'].gitBlob
    && evidence.upstreamSource.preservedArtifact === PATHS.heroInfo
    && evidence.upstreamSource.preservedArtifactGitBlobSha1 === snapshot.preservedArtifacts[PATHS.heroInfo].gitBlob,
  'Hero localization upstream source provenance mismatch');

  check(canonical.schemaVersion === 1 && Array.isArray(canonical.records), 'Hero localization canonical schema mismatch');
  check(canonical.officialKrProvenanceStatus === 'unverified', 'official Korean-server provenance was overstated');

  const evidenceById = new Map();
  for (const row of evidence.records) {
    check(Number.isInteger(row.heroId), 'evidence Hero ID malformed');
    check(!evidenceById.has(row.heroId), `duplicate evidence Hero ID ${row.heroId}`);
    evidenceById.set(row.heroId, row);
  }
  const canonicalById = new Map();
  for (const row of canonical.records) {
    check(Number.isInteger(row.heroId), 'canonical Hero ID malformed');
    check(!canonicalById.has(row.heroId), `duplicate canonical Hero ID ${row.heroId}`);
    canonicalById.set(row.heroId, row);
  }
  check(sameIdSet([...evidenceById.keys()], targetIds), 'Hero localization evidence target ID set mismatch');
  check(sameIdSet([...canonicalById.keys()], targetIds), 'Hero localization canonical target ID set mismatch');

  const directById = new Map(heroInfoRecords.map((row) => [row.ID, row]));
  for (const heroId of targetIds) {
    const direct = directById.get(heroId);
    check(direct, `ConfigData Hero ID=${heroId} is missing`);
    const selected = selectedById.get(heroId);
    const sourceRow = sourceByName.get(direct.Name);
    check(selected && selected.nameCn === direct.Name,
      `ConfigData Chinese Name mismatch for Hero ${heroId}`);
    check(sourceRow, `localization source has no exact Chinese key for Hero ${heroId}`);
    check(selected.sourceLine === sourceRow.sourceLine && selected.sourceRow === sourceRow.sourceRow,
      `source locator mismatch for Hero ${heroId}`);

    const evidenceRow = evidenceById.get(heroId);
    const canonicalRow = canonicalById.get(heroId);
    check(evidenceRow && canonicalRow, `localization missing for Hero ${heroId}`);
    exactKeys(evidenceRow, ['heroId','nameCn','nameKo','identityLocator','configDataLocator','sourceLocator','sourceLine','sourceRow','evidenceClass'],
      `localization evidence Hero ${heroId}`);
    check(evidenceRow.nameCn === direct.Name && evidenceRow.nameKo === sourceRow.nameKo,
      `source/evidence localization mismatch for Hero ${heroId}`);
    check(evidenceRow.identityLocator === `canonical/hero-identities.v1.json#heroId=${heroId}`
      && evidenceRow.configDataLocator === `${PATHS.heroInfo}#ID=${heroId}/Name`
      && evidenceRow.sourceLocator === `hero-names-ko.v1.txt#nameCn=${direct.Name}`
      && evidenceRow.sourceLine === sourceRow.sourceLine && evidenceRow.sourceRow === sourceRow.sourceRow
      && evidenceRow.evidenceClass === 'A',
    `localization evidence locator/class mismatch for Hero ${heroId}`);
    exactKeys(canonicalRow, ['heroId','nameKo','evidenceClass','provenance'], `canonical localization Hero ${heroId}`);
    check(canonicalRow.nameKo === evidenceRow.nameKo && canonicalRow.evidenceClass === 'A'
      && canonicalRow.provenance === `${PATHS.evidence}#heroId=${heroId}`,
    `canonical localization/provenance mismatch for Hero ${heroId}`);
  }
  return { localizedCount: canonical.records.length, heroIds: targetIds, officialKrProvenanceStatus: 'unverified' };
}

export async function validateHeroKoLocalizationFromDisk(root = process.cwd()) {
  return validateHeroKoLocalization(await readHeroKoLocalizationInputs(root));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await validateHeroKoLocalizationFromDisk();
  process.stdout.write(`Hero Korean localization validation PASS (${result.localizedCount} records: ${result.heroIds.join(',')}; official KR provenance unverified)\n`);
}
