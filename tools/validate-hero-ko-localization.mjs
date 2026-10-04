import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const PATHS = Object.freeze({
  heroIdentities: 'canonical/hero-identities.v1.json',
  heroInfo: 'evidence/source/configdata/ConfigDataHeroInfo.records-5-6-8.json',
  snapshot: 'evidence/source/configdata/snapshot.json',
  heroIdentityManifest: 'evidence/source/configdata/ConfigDataHeroInfo.records-playable-identity.source-manifest.v1.json',
  source: 'evidence/localization/source/hero-names-ko.v1.txt',
  sourceManifest: 'evidence/localization/source/hero-names-ko.source-manifest.v1.json',
  evidence: 'evidence/localization/hero-names-ko.v1.json',
  canonical: 'canonical/hero-localizations-ko.v1.json',
});
const TARGETS = Object.freeze([
  { heroId: 5, nameCn: '克丽丝', nameKo: '크리스', sourceLine: 33, sourceRow: 4 },
  { heroId: 6, nameCn: '利昂', nameKo: '레온', sourceLine: 34, sourceRow: 5 },
  { heroId: 8, nameCn: '拉娜', nameKo: '라나', sourceLine: 36, sourceRow: 7 },
]);
const fail = (message) => { throw new Error(`Hero Korean localization validation failed: ${message}`); };
const check = (condition, message) => { if (!condition) fail(message); };
const same = (a, b) => isDeepStrictEqual(a, b);
const exactKeys = (value, expected, label) =>
  check(same(Object.keys(value).sort(), [...expected].sort()), `${label} has unexpected or missing fields`);
const targetIds = TARGETS.map((row) => row.heroId);

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
  for (const id of targetIds) check(identitySet.has(id), `Hero ${id} is not in the existing identity owner`);

  check(Array.isArray(heroInfoRecords), 'ConfigData HeroInfo evidence is not an array');
  check(same(heroInfoRecords.map((row) => row.ID), targetIds), 'direct ConfigData record ID set or order mismatch');
  check(new Set(heroInfoRecords.map((row) => row.ID)).size === heroInfoRecords.length,
    'duplicate direct ConfigData Hero ID');
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
  check(sourceManifest.schemaVersion === 1
    && sourceManifest.repoPreservedPath === PATHS.source
    && sourceManifest.sourceIdentity === 'User-provided Project localization reference; upload artifact libfile_893eb8bea16081918519d321d2e5720a',
  'localization source identity/path mismatch');
  check(sourceManifest.sourceSha256 === sourceHash && sourceManifest.sourceBytes === textBytes.length,
    'localization source hash or byte count mismatch');
  check(sourceManifest.sourceVersionStatus === 'unknown'
    && sourceManifest.sourceProvenanceStatus === 'incomplete'
    && sourceManifest.officialKrProvenanceStatus === 'unverified'
    && sourceManifest.scope === 'localization/presentation only',
  'localization source limitations were overstated');
  check(same(sourceManifest.targetIds, targetIds), 'localization target Hero ID set mismatch');
  check(sourceManifest.sourceRowCount === 267 && sourceManifest.selectedRowCount === targetIds.length,
    'localization source/selected row count mismatch');
  const sourceRows = parseHeroLocalizationSource(sourceText);
  check(sourceRows.length === sourceManifest.sourceRowCount, 'localization source row count differs from manifest');
  const sourceByName = new Map(sourceRows.map((row) => [row.nameCn, row]));
  const selectedRows = sourceManifest.selectedRows;
  check(Array.isArray(selectedRows) && selectedRows.length === targetIds.length, 'selected source locator count mismatch');

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
  check(evidence.records.length === targetIds.length, 'Hero localization evidence coverage mismatch');

  check(canonical.schemaVersion === 1 && Array.isArray(canonical.records), 'Hero localization canonical schema mismatch');
  check(canonical.officialKrProvenanceStatus === 'unverified', 'official Korean-server provenance was overstated');
  check(canonical.records.length === targetIds.length, 'Hero localization canonical coverage mismatch');
  check(same(canonical.records.map((row) => row.heroId), targetIds), 'Hero localization canonical Hero ID set/order mismatch');

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

  for (let i = 0; i < TARGETS.length; i++) {
    const target = TARGETS[i];
    const directRecords = heroInfoRecords.filter((row) => row.ID === target.heroId);
    check(directRecords.length === 1, `ConfigData Hero ID=${target.heroId} must occur exactly once`);
    const directName = directRecords[0].Name;
    check(directName === target.nameCn, `ConfigData Chinese Name mismatch for Hero ${target.heroId}`);
    const sourceRow = sourceByName.get(directName);
    check(sourceRow, `localization source has no exact Chinese key for Hero ${target.heroId}`);
    check(sourceRow.nameKo === target.nameKo, `Korean display value mismatch for Hero ${target.heroId}`);
    check(sourceRow.sourceLine === target.sourceLine && sourceRow.sourceRow === target.sourceRow,
      `source locator mismatch for Hero ${target.heroId}`);
    const selected = selectedRows[i];
    exactKeys(selected, ['heroId', 'sourceLine', 'sourceRow', 'nameCn'], `selected source row for Hero ${target.heroId}`);
    check(same(selected, { heroId: target.heroId, sourceLine: target.sourceLine,
      sourceRow: target.sourceRow, nameCn: target.nameCn }), `selected source manifest row mismatch for Hero ${target.heroId}`);

    const evidenceRow = evidenceById.get(target.heroId);
    const canonicalRow = canonicalById.get(target.heroId);
    check(evidenceRow && canonicalRow, `localization missing for Hero ${target.heroId}`);
    exactKeys(evidenceRow, ['heroId','nameCn','nameKo','identityLocator','configDataLocator','sourceLocator','sourceLine','sourceRow','evidenceClass'],
      `localization evidence Hero ${target.heroId}`);
    check(evidenceRow.nameCn === directName && evidenceRow.nameKo === sourceRow.nameKo,
      `source/evidence localization mismatch for Hero ${target.heroId}`);
    check(evidenceRow.identityLocator === `canonical/hero-identities.v1.json#heroId=${target.heroId}`
      && evidenceRow.configDataLocator === `${PATHS.heroInfo}#ID=${target.heroId}/Name`
      && evidenceRow.sourceLocator === `hero-names-ko.v1.txt#nameCn=${target.nameCn}`
      && evidenceRow.sourceLine === target.sourceLine && evidenceRow.sourceRow === target.sourceRow
      && evidenceRow.evidenceClass === 'A',
    `localization evidence locator/class mismatch for Hero ${target.heroId}`);
    exactKeys(canonicalRow, ['heroId','nameKo','evidenceClass','provenance'], `canonical localization Hero ${target.heroId}`);
    check(canonicalRow.nameKo === target.nameKo && canonicalRow.evidenceClass === 'A'
      && canonicalRow.provenance === `${PATHS.evidence}#heroId=${target.heroId}`,
    `canonical localization/provenance mismatch for Hero ${target.heroId}`);
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
