import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const root = process.cwd();
const sourcePath = 'evidence/source/configdata/ConfigDataSPHeroInfo.records-hero-soldier-reward.v1.json';
const manifestPath = 'evidence/source/configdata/ConfigDataSPHeroInfo.records-hero-soldier-reward.source-manifest.v1.json';
const expectedIds = [60, 13, 11, 9, 37];
const expectedFields = ['ID', 'SecondStageRewardSoldiers'];
const check = (condition, message) => { if (!condition) throw new Error(`SP Hero reward source validation failed: ${message}`); };
const exactKeys = (value, expected, label) => check(isDeepStrictEqual(Object.keys(value).sort(), [...expected].sort()), `${label} has unexpected or missing fields`);
const readBytes = (path) => readFile(resolve(root, path));
const readJson = async (path) => JSON.parse(await readBytes(path));
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

export async function validateSpHeroRewardSource() {
  const [sourceBytes, manifest] = await Promise.all([readBytes(sourcePath), readJson(manifestPath)]);
  let records;
  try {
    records = JSON.parse(sourceBytes.toString('utf8'));
  } catch {
    throw new Error('SP Hero reward source validation failed: preserved source artifact is not valid JSON');
  }

  exactKeys(manifest, [
    'schemaVersion', 'sourceName', 'repoPreservedPath', 'sourceRole', 'canonical', 'generated',
    'productionRuntimeDependency', 'source', 'selection', 'sourceRecordCount', 'recordCount',
    'recordsSha256', 'sourceScope', 'supportedClaim', 'knownLimitations'
  ], 'reward source manifest');
  check(manifest.schemaVersion === 1, 'unsupported manifest schemaVersion');
  check(manifest.sourceName === 'ConfigDataSPHeroInfo.records-hero-soldier-reward.v1.json', 'sourceName mismatch');
  check(manifest.repoPreservedPath === sourcePath, 'repo preserved path mismatch');
  check(manifest.sourceRole === 'selected_configdata_source_evidence'
    && manifest.canonical === false
    && manifest.generated === false
    && manifest.productionRuntimeDependency === false,
  'source authority boundary changed');

  const source = manifest.source;
  check(source.repository === 'LuceatLuxVestra42/langrisser-future-guide', 'pinned source repository mismatch');
  check(source.commit === '6475e63ee23d18adf733756c26a14fa9e3ed662c', 'pinned source commit mismatch');
  check(source.commitDate === '2026-09-02T01:45:21Z', 'pinned source commit date mismatch');
  check(source.path === 'data/configdata/ConfigDataSPHeroInfo.json', 'pinned source path mismatch');
  check(source.gitBlobSha1 === 'c3dc00ad0e1454481715ade378f56104febed9a3', 'pinned source Git blob mismatch');
  check(source.sha256 === '9ab506e525662e4107fbec4d0433827fc5c7c6a6bd4aff69ea9d883b9575b174', 'pinned source SHA-256 mismatch');
  check(source.bytes === 37157 && source.sourceVersionStatus === 'unknown', 'pinned source size/version boundary mismatch');
  check(isDeepStrictEqual(source.sourceContract, {"repository":"LuceatLuxVestra42/langrisser-future-guide","commit":"57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff","path":"data/contracts/configdata-source-pack-contract.v1.json","gitBlobSha1":"0a7c58140f7c5f44a7aedbedbc950ef0f1bb4a0d","sha256":"5ae5443a7533760c9048d04355ad9445bb1f89812c10abced1c23d019d38df4d","sourceCommit":"6475e63ee23d18adf733756c26a14fa9e3ed662c","sourceTreeGitSha1":"b18983f60cb054c2e6e094d64cdb98979211d7fc","semanticContentAuthority":"PINNED_UNITYDATATOOL_PARSED_CONFIGDATA_SNAPSHOT","release":{"tag":"source-configdata-v1-6475e63e","archiveName":"configdata-source-v1-6475e63e.tar","archiveSha256":"65855321776cba9523669a2d486c2edbd2908006cf854572b7a87b0b63405c84"}}), 'pinned ConfigData source contract mismatch');

  check(manifest.selection.parser === 'UTF-8 JSON parser; source is a JSON array', 'selection parser mismatch');
  check(manifest.selection.method === 'Select exact ConfigDataSPHeroInfo.ID records referenced by the current admitted SP_HERO_REWARD provenance; retain only ID and SecondStageRewardSoldiers without semantic edits. This is claim-scoped evidence selection, not a source completeness or future admission rule.', 'selection method drift');
  check(isDeepStrictEqual(manifest.selection.selectedFields, expectedFields), 'selected source fields mismatch');
  check(isDeepStrictEqual(manifest.selection.selectedIds, expectedIds), 'selected source IDs mismatch');
  check(manifest.sourceRecordCount === 25 && manifest.recordCount === 5, 'source/preserved record count mismatch');
  check(manifest.recordsSha256 === sha256(sourceBytes), 'preserved reward source bytes differ from manifest hash');

  check(manifest.sourceScope === 'Pinned ConfigDataSPHeroInfo rows needed to support the current admitted SP_HERO_REWARD Hero-Soldier provenance only.', 'source scope drift');
  check(isDeepStrictEqual(manifest.supportedClaim, {
    sourceKind: 'SP_HERO_REWARD',
    heroIdField: 'ID',
    soldierIdsField: 'SecondStageRewardSoldiers',
    locatorFormat: 'evidence/source/configdata/ConfigDataSPHeroInfo.records-hero-soldier-reward.v1.json#ID=<HeroID>/SecondStageRewardSoldiers',
    semanticInterpretationContract: 'evidence/source/legacy/hero-soldier/contracts/hero-soldier-relation-source-contract.v1.json'
  }), 'supported claim metadata drift');
  check(isDeepStrictEqual(manifest.knownLimitations, [
    'Selected IDs are scoped to current admitted SP_HERO_REWARD provenance; this artifact is not a complete inventory of all SecondStageRewardSoldiers values in the pinned source.',
    'This artifact does not admit new Hero-Soldier relations or define future relation completeness.',
    'Source version beyond the pinned repository commit is unknown.'
  ]), 'known limitations drift');

  check(Array.isArray(records) && records.length === 5, 'preserved reward source must contain exactly five source rows');
  const seen = new Set();
  for (const [index, row] of records.entries()) {
    exactKeys(row, expectedFields, `reward source row ${index + 1}`);
    check(Number.isInteger(row.ID), `reward source row ${index + 1} has malformed ID`);
    check(!seen.has(row.ID), `duplicate reward source Hero ID ${row.ID}`);
    seen.add(row.ID);
    check(Array.isArray(row.SecondStageRewardSoldiers) && row.SecondStageRewardSoldiers.length > 0,
      `reward source Hero ${row.ID} has malformed SecondStageRewardSoldiers`);
    check(row.SecondStageRewardSoldiers.every(Number.isInteger),
      `reward source Hero ${row.ID} has non-integer Soldier ID`);
    check(new Set(row.SecondStageRewardSoldiers).size === row.SecondStageRewardSoldiers.length,
      `reward source Hero ${row.ID} repeats a Soldier ID`);
  }
  check(isDeepStrictEqual(records.map((row) => row.ID), expectedIds), 'reward source record IDs/order differ from the claim-scoped source selection');

  return { sourcePath, manifestPath, records, manifest };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  check(process.argv.slice(2).length === 0, 'Usage: node tools/validate-sp-hero-reward-source.mjs');
  const result = await validateSpHeroRewardSource();
  process.stdout.write(`SP Hero reward source evidence: PASS (${result.records.length} pinned claim-scoped source rows; source integrity and provenance verified)\n`);
}
