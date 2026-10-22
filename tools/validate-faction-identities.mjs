import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

const evidencePath = 'evidence/source/hero-faction.v1.json';
const canonicalPath = 'canonical/faction-identities.v1.json';
const expected = new Map([
  [1, '主角光环'], [2, '光辉军团'], [3, '光之起源'], [4, '帝国之辉'], [5, '黑暗轮回'], [6, '公主联盟'],
  [7, '战略大师'], [8, '流星直击'], [9, '传说彼端'], [11, '超凡领域'],
]);
const fail = (message) => { throw new Error(`Faction identity validation failed: ${message}`); };
const check = (condition, message) => { if (!condition) fail(message); };
const exactKeys = (value, fields, label) => {
  check(value !== null && typeof value === 'object' && !Array.isArray(value), `${label} must be an object`);
  check(isDeepStrictEqual(Object.keys(value).sort(), [...fields].sort()), `${label} fields drift`);
};

export async function validateFactionIdentities(root = process.cwd()) {
  const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
  const evidence = await readJson(evidencePath);
  const canonical = await readJson(canonicalPath);
  exactKeys(evidence, ['schemaVersion', 'evidenceClass', 'projection', 'scope', 'source', 'semantics', 'limitations', 'records'], 'source evidence');
  exactKeys(evidence.scope, ['factionIds', 'heroIds'], 'evidence scope');
  exactKeys(evidence.source, ['repository', 'predecessorHead', 'snapshotDate', 'commit', 'tree', 'sourcePackRelease', 'sourcePackContract', 'sourcePackContractBlobSha1', 'sourcePackFormatContract', 'sourcePackFormatContractBlobSha1', 'sourcePackArchiveSha256', 'sourcePackInventorySha256', 'sourcePackChecksumsSha256', 'sourcePath', 'sourceFileBytes', 'sourceFileSha256'], 'source provenance');
  exactKeys(evidence.semantics, ['factionIdField', 'factionNameField', 'membershipField', 'excludedField', 'canonicalIdentityField', 'canonicalRelationFields'], 'source semantics');
  exactKeys(evidence.semantics.excludedField, ['name', 'meaning'], 'excluded source field');
  check(evidence.schemaVersion === 1 && evidence.evidenceClass === 'A' && evidence.projection === true, 'evidence classification or projection flag drift');
  check(isDeepStrictEqual(evidence.scope.factionIds, [...expected.keys()]), 'evidence faction scope drift');
  check(isDeepStrictEqual(evidence.scope.heroIds, [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 25, 26, 27, 28, 29, 32, 33, 37, 40, 52, 53, 55, 56, 60, 67, 89]), 'evidence Hero source-coverage scope drift');
  check(evidence.source.repository === 'LuceatLuxVestra42/langrisser-future-guide'
    && evidence.source.predecessorHead === '57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff'
    && evidence.source.snapshotDate === '2026-09-02'
    && evidence.source.commit === '6475e63ee23d18adf733756c26a14fa9e3ed662c'
    && evidence.source.tree === 'b18983f60cb054c2e6e094d64cdb98979211d7fc'
    && evidence.source.sourcePackRelease === 'source-configdata-v1-6475e63e'
    && evidence.source.sourcePackContract === 'data/contracts/configdata-source-pack-contract.v1.json'
    && evidence.source.sourcePackContractBlobSha1 === '0a7c58140f7c5f44a7aedbedbc950ef0f1bb4a0d'
    && evidence.source.sourcePackFormatContract === 'data/contracts/configdata-source-pack-format.v1.json'
    && evidence.source.sourcePackFormatContractBlobSha1 === '8b9e65e023f99fa05f03fca2aae42126f28e5e3c'
    && evidence.source.sourcePackArchiveSha256 === '65855321776cba9523669a2d486c2edbd2908006cf854572b7a87b0b63405c84'
    && evidence.source.sourcePackInventorySha256 === 'ea7c6381e0901a55fe11014d14bb82862d9474c418e89d11869e03ba876dcade'
    && evidence.source.sourcePackChecksumsSha256 === 'be81655d43cacbb31fd55d4c64f0cdb46a47953b8247eea1b600025719a56be2'
    && evidence.source.sourcePath === 'data/configdata/ConfigDataHeroTagInfo.json'
    && evidence.source.sourceFileBytes === 12682
    && evidence.source.sourceFileSha256 === '545e662920cde9f379ac03e15632e970d8a530bf2821e4dbeddc21d0f4ce4a91', 'source provenance pin drift');
  check(evidence.semantics.factionIdField === 'ID' && evidence.semantics.factionNameField === 'Name'
    && evidence.semantics.membershipField === 'RelatedHeros_ID'
    && evidence.semantics.excludedField?.name === 'SuperHero_ID', 'source field semantics drift');
  check(Array.isArray(evidence.records) && evidence.records.length === expected.size, 'evidence record count drift');
  const evidenceById = new Map();
  for (const record of evidence.records) {
    exactKeys(record, ['ID', 'Name', 'RelatedHeros_ID'], `source record ${record.ID}`);
    check(Number.isSafeInteger(record.ID) && expected.has(record.ID), `unexpected faction ID ${record.ID}`);
    check(!evidenceById.has(record.ID), `duplicate faction ID ${record.ID}`);
    check(record.Name === expected.get(record.ID), `source Name mismatch for faction ${record.ID}`);
    check(Array.isArray(record.RelatedHeros_ID)
      && record.RelatedHeros_ID.every(Number.isSafeInteger)
      && new Set(record.RelatedHeros_ID).size === record.RelatedHeros_ID.length, `invalid RelatedHeros_ID for faction ${record.ID}`);
    evidenceById.set(record.ID, record);
  }
  check(isDeepStrictEqual([...evidenceById.keys()].sort((a, b) => a - b), [...expected.keys()]), 'evidence IDs are not the exact admitted set');

  exactKeys(canonical, ['schemaVersion', 'scope', 'sourceEvidence', 'records'], 'canonical owner');
  check(canonical.schemaVersion === 1
    && canonical.scope === 'Faction identities referenced by the admitted Hero–Faction relation scope; source-backed CN names only.'
    && canonical.sourceEvidence === evidencePath, 'canonical scope or evidence pointer drift');
  check(Array.isArray(canonical.records) && canonical.records.length === expected.size, 'canonical record count drift');
  check(isDeepStrictEqual(canonical.records.map((record) => record.factionId), [...expected.keys()]), 'canonical identity order drift');
  const canonicalIds = new Set();
  for (const record of canonical.records) {
    exactKeys(record, ['factionId', 'nameCn', 'provenance'], `canonical faction ${record.factionId}`);
    check(expected.has(record.factionId) && !canonicalIds.has(record.factionId), `unexpected or duplicate canonical faction ${record.factionId}`);
    const source = evidenceById.get(record.factionId);
    check(record.nameCn === source?.Name, `canonical Name differs from source for faction ${record.factionId}`);
    check(record.provenance === `${evidencePath}#ID=${record.factionId}/Name`, `canonical source locator drift for faction ${record.factionId}`);
    canonicalIds.add(record.factionId);
  }
  check(isDeepStrictEqual([...canonicalIds].sort((a, b) => a - b), [...expected.keys()]), 'canonical IDs are not the exact admitted set');
  process.stdout.write('Faction identity owner: PASS (10 exact IDs and source-backed names)\n');
}

await validateFactionIdentities();
