import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { loadPublicSoldierPopulation } from './validate-sp-soldier-relation.mjs';

const SOURCE_PATH = 'evidence/localization/source/normal-soldier-names-ko.v1.txt';
const EVIDENCE_PATH = 'evidence/localization/normal-soldier-names-ko.v1.json';
const PRIVATE_IDS = [806, 817, 819];
const CLAIM_SCOPE = 'Korean display labels for the 56 existing public NORMAL Soldier endpoints and three internal NORMAL identities (806, 817, 819). This evidence does not establish the full NORMAL Soldier population.';
const check = (condition, message) => {
  if (!condition) throw new Error(`NORMAL Soldier KO localization validation failed: ${message}`);
};

export function parseNormalSoldierSource(text) {
  const lines = text.split(/\r?\n/);
  const header = lines.find(line => line && !line.startsWith('#'));
  check(header === 'SoldierID\t한국명', 'source header mismatch');
  const rows = [];
  for (const [index, line] of lines.entries()) {
    if (!line || line.startsWith('#') || line === header) continue;
    const columns = line.split('\t');
    check(columns.length === 2 && /^\d+$/.test(columns[0]), `malformed source row at line ${index + 1}`);
    const [id, name] = columns;
    check(name.length > 0 && name.trim() === name, `empty/malformed Korean name at line ${index + 1}`);
    rows.push({ id: Number(id), name, line: index + 1, row: rows.length + 1 });
  }
  return rows;
}

export function validateNormalSoldierKoLocalization({ soldiers, publicIdentities, canonical, evidence, manifest, rawSource }) {
  check(soldiers.schemaVersion === 1 && Array.isArray(soldiers.records), 'Soldier identity schema mismatch');
  check(publicIdentities.schemaVersion === 1 && Array.isArray(publicIdentities.records), 'public Soldier identity schema mismatch');
  check(canonical.schemaVersion === 1 && Array.isArray(canonical.records), 'canonical localization schema mismatch');
  check(evidence.schemaVersion === 1 && Array.isArray(evidence.records), 'localization evidence schema mismatch');
  const hash = createHash('sha256').update(rawSource).digest('hex');
  check(hash === 'd812b23bcae880e4971cb43a0b13012769372c339d708182cc0bf250eaffe1c4', 'source hash mismatch');
  check(manifest.sourceName === '일반용병명.txt' && manifest.sourceSha256 === hash, 'source provenance mismatch');
  check(rawSource.byteLength === manifest.sourceBytes, 'source byte count mismatch');
  check(manifest.sourceVersionStatus === 'unknown' && manifest.officialKrProvenanceStatus === 'unverified', 'source authority overstated');
  check(manifest.scope === 'localization/presentation only' && manifest.claimScope === CLAIM_SCOPE, 'claim scope mismatch');

  const sourceRows = parseNormalSoldierSource(new TextDecoder('utf-8', { fatal: true }).decode(rawSource));
  check(sourceRows.length === 168 && manifest.sourceRowCount === 168, 'source row count mismatch');
  const bySource = new Map(sourceRows.map(row => [row.id, row]));
  check(bySource.size === sourceRows.length, 'duplicate source IDs');
  const publicIds = publicIdentities.records.filter(row => row.entity === 'Soldier' && row.variant === 'NORMAL')
    .map(row => row.id).sort((a, b) => a - b);
  const publicSet = new Set(publicIds);
  check(publicIds.length === 56 && publicSet.size === 56 && publicIds.every(Number.isInteger), 'public NORMAL endpoint target count or keys mismatch');
  check(PRIVATE_IDS.every(id => !publicSet.has(id)), 'private NORMAL identity overlaps public endpoints');
  const ids = [...publicIds, ...PRIVATE_IDS].sort((a, b) => a - b);
  for (const id of ids) {
    const matches = soldiers.records.filter(row => row.id === id);
    check(matches.length === 1 && matches[0].entity === 'Soldier' && matches[0].variant === 'NORMAL',
      `expected one registered NORMAL identity for ${id}`);
  }
  const admitted = new Set(ids);
  const excluded = sourceRows.filter(row => !admitted.has(row.id)).map(row => row.id).sort((a, b) => a - b);
  check(isDeepStrictEqual(manifest.targetIds, ids), 'manifest approved target ID set mismatch');
  check(isDeepStrictEqual(manifest.excludedNonTargetIds, excluded), 'manifest excluded ID set mismatch');
  check(manifest.selectedRowCount === ids.length, 'manifest selected row count mismatch');
  check(canonical.records.length === ids.length && evidence.records.length === ids.length, 'localization target coverage mismatch');
  for (const [label, rows] of [['canonical', canonical.records], ['evidence', evidence.records]]) {
    const actual = rows.map(row => row.soldierId);
    check(new Set(actual).size === actual.length, `duplicate ${label} ID`);
    check(isDeepStrictEqual(actual, ids), `${label} approved target ID set mismatch or ordering drift`);
  }

  const publicRecords = [];
  for (const [index, id] of ids.entries()) {
    const source = bySource.get(id);
    const proof = evidence.records[index];
    const claim = canonical.records[index];
    check(source && proof.nameKo === source.name && claim.nameKo === source.name, `source/canonical name mismatch ${id}`);
    check(isDeepStrictEqual(proof, {
      soldierId: id, nameKo: source.name, sourceArtifact: SOURCE_PATH, sourceLocator: `SoldierID=${id}`,
      sourceLine: source.line, sourceRow: source.row, evidenceClass: 'A',
    }), `evidence locator or schema mismatch ${id}`);
    check(isDeepStrictEqual(claim, {
      soldierId: id, nameKo: source.name, evidenceClass: 'A', provenance: `${EVIDENCE_PATH}#SoldierID=${id}`,
    }), `canonical provenance or schema mismatch ${id}`);
    if (publicSet.has(id)) publicRecords.push(claim);
  }
  check(isDeepStrictEqual(Object.keys(canonical).sort(), ['officialKrProvenanceStatus', 'purpose', 'records', 'schemaVersion', 'sourceScope']), 'canonical top-level schema mismatch');
  check(canonical.officialKrProvenanceStatus === 'unverified', 'canonical overstates official KR provenance');
  check(canonical.sourceScope === `${CLAIM_SCOPE} Official Korean-server provenance is unverified.`, 'canonical scope mismatch');
  check(isDeepStrictEqual(publicRecords.map(row => row.soldierId), publicIds), 'public Korean localization target ID set mismatch');
  return { localizedCount: ids.length, sourceRowCount: sourceRows.length, excludedCount: excluded.length, publicRecords };
}

export async function loadValidatedNormalSoldierKoLocalization(root) {
  const read = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'));
  const [population, soldiers, canonical, evidence, manifest, rawSource] = await Promise.all([
    loadPublicSoldierPopulation(root),
    read('canonical/soldiers.v1.json'),
    read('canonical/normal-soldier-localizations-ko.v1.json'),
    read(EVIDENCE_PATH),
    read('evidence/localization/source/normal-soldier-names-ko.source-manifest.v1.json'),
    readFile(resolve(root, SOURCE_PATH)),
  ]);
  const result = validateNormalSoldierKoLocalization({
    soldiers, publicIdentities: population.identities, canonical, evidence, manifest, rawSource,
  });
  return { population, canonical, result };
}

export async function loadPublicNormalSoldierLocalization(root = process.cwd()) {
  const { population, canonical, result } = await loadValidatedNormalSoldierKoLocalization(root);
  return { ...population, normalLocalizations: { ...canonical, records: result.publicRecords } };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const { result } = await loadValidatedNormalSoldierKoLocalization(process.cwd());
  process.stdout.write(`NORMAL Soldier KO localization: PASS (${result.localizedCount} admitted; ${result.publicRecords.length} public; ${result.excludedCount} unadmitted; ${result.sourceRowCount} source rows)\n`);
}
