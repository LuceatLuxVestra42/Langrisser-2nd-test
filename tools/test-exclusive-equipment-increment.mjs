import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { screenExclusiveEquipmentIncrement as screen } from './exclusive-equipment-increment-contract.mjs';
import { verifyPinnedExclusiveEquipmentSnapshot as verifyPinned } from './exclusive-equipment-increment-contract.mjs';
import { loadAndValidateHeroExclusiveEquipmentRelations } from './validate-hero-exclusive-equipment-relations.mjs';
const read = async p => JSON.parse(await readFile(p, 'utf8'));
await loadAndValidateHeroExclusiveEquipmentRelations();
const heroes = (await read('canonical/hero-identities.v1.json')).records;
const equipment = (await read('canonical/exclusive-equipment.v1.json')).records;
const relations = (await read('canonical/hero-exclusive-equipment-relations.v1.json')).records;
const available = heroes.find(h => !relations.some(r => r.heroId === h.heroId)).heroId;
const fixture = { equipmentId: 99999999, heroId: available, evidence: { sourceFamily: 'fixture', version: 'fixture-v1', snapshot: 'fixture snapshot', locator: 'ConfigDataEquipmentInfo#ID=99999999', record: { ID: 99999999, SkillHero: available }, relationField: 'SkillHero', selectionEvidence: 'fixture selector', semanticDecision: 'fixture decision', scope: 'fixture only', transformation: 'copy explicit fields', limitations: 'synthetic record', evidenceClass: 'A', provenanceKind: 'source', anchor: 'fixture source anchor', claimReference: 'fixture claim', provenanceEdges: [{ from: 'fixture claim', to: 'fixture source anchor' }] } };
const inputs = { heroes, equipment, relations, candidates: [fixture] };
const before = structuredClone(inputs);
assert.deepEqual(screen(inputs), [{ equipmentId: 99999999, heroId: available, structuralScreen: 'PASS', sourceAuthenticity: 'NOT_VERIFIED', semanticDecision: 'MANUAL_REVIEW', admission: 'NOT_APPROVED', publication: 'NOT_APPROVED' }]);
assert.deepEqual(inputs, before, 'screening must not mutate inputs');
const bad = (mutate, error) => { const x = structuredClone(inputs); mutate(x); assert.throws(() => screen(x), new RegExp(error)); };
bad(x => { x.candidates[0].evidence.version = ''; }, 'MISSING_SOURCE_PROVENANCE');
bad(x => { x.candidates[0].evidence.locator = ''; }, 'MISSING_SOURCE_PROVENANCE');
bad(x => { x.candidates[0].evidence.selectionEvidence = ''; }, 'MISSING_SEMANTIC_PROVENANCE');
bad(x => { x.candidates[0].evidence.record.ID++; }, 'SOURCE_ID_MISMATCH');
bad(x => { x.candidates[0].equipmentId = equipment[0].equipmentId; }, 'DUPLICATE_EQUIPMENT');
bad(x => { x.candidates.push(structuredClone(x.candidates[0])); }, 'DUPLICATE_EQUIPMENT');
bad(x => { delete x.candidates[0].evidence.record.SkillHero; }, 'MISSING_SKILL_HERO');
bad(x => { x.candidates[0].evidence.record.SkillHero = 123456789; }, 'RELATION_MISMATCH');
bad(x => { x.candidates[0].heroId = 123456789; }, 'UNKNOWN_HERO');
bad(x => { x.candidates[0].heroId = relations[0].heroId; }, 'HERO_RELATION_CONFLICT');
bad(x => { x.candidates[0].evidence.anchor = x.candidates[0].evidence.locator; }, 'CIRCULAR_OR_MISSING_ANCHOR');
bad(x => { x.candidates[0].evidence.anchor = ''; }, 'CIRCULAR_OR_MISSING_ANCHOR');
bad(x => { x.candidates[0].evidence.provenanceEdges = [{ from: 'fixture claim', to: 'intermediate' }, { from: 'intermediate', to: 'fixture claim' }]; }, 'CIRCULAR_PROVENANCE');
bad(x => { x.candidates[0].evidence.provenanceEdges = [{ from: 'fixture claim', to: 'unrelated' }]; }, 'MISSING_SOURCE_ANCHOR');
bad(x => { x.candidates[0].evidence.evidenceClass = 'C'; }, 'UNSUPPORTED_EVIDENCE_CLASS');
bad(x => { x.candidates[0].evidence.evidenceClass = 'D'; }, 'UNSUPPORTED_EVIDENCE_CLASS');
bad(x => { x.equipment.pop(); }, 'INVALID_EQUIPMENT_BASELINE');
assert.equal(screen(inputs)[0].admission, 'NOT_APPROVED', 'declared A is not admission');
console.log('Exclusive equipment increment: synthetic positive, 17 negative cases, input immutability and approval boundary PASS');

// Fixture bytes are separate from the candidate record; neither the digest nor
// successful parsing purports to authenticate a real external source.
const { createHash } = await import('node:crypto');
const { verifyExclusiveEquipmentSnapshot: verify } = await import('./exclusive-equipment-increment-contract.mjs');
const sourceRow = { ID: 99999999, SkillHero: available, GetPathList: [{ PathType: 46 }] };
const bytes = Buffer.from(JSON.stringify([sourceRow]));
const manifest = { kind: 'fixture', sourceFamily: 'fixture', snapshot: 'fixture snapshot', version: 'fixture-v1', locator: 'fixture source anchor', sha256: createHash('sha256').update(bytes).digest('hex'), parser: 'configdata-json-array-v1', transformation: 'copy-ID-SkillHero-GetPathList', scope: 'fixture only', limitations: 'synthetic only', semanticDependency: 'fixture semantic decision' };
const verifiedCandidate = structuredClone(fixture);
verifiedCandidate.evidence.transformation = manifest.transformation;
verifiedCandidate.evidence.record.GetPathList = structuredClone(sourceRow.GetPathList);
verifiedCandidate.evidence.provenanceEdges = [{ from: 'fixture claim', to: verifiedCandidate.evidence.locator }, { from: verifiedCandidate.evidence.locator, to: manifest.locator }, { from: 'fixture claim', to: manifest.semanticDependency }];
const verificationInput = { candidate: verifiedCandidate, snapshotBytes: bytes, manifest };
const result = await verify(verificationInput);
assert.equal(result.verificationScope, 'FIXTURE_ONLY');
assert.equal(result.sourceAuthenticity, 'NOT_VERIFIED');
assert.equal(result.semanticDecision, 'MANUAL_REVIEW');
assert.equal(result.admission, 'NOT_APPROVED');
assert.equal(result.publication, 'NOT_APPROVED');
const invalid = async (change, error) => { const x = { candidate: structuredClone(verifiedCandidate), snapshotBytes: Buffer.from(bytes), manifest: structuredClone(manifest) }; change(x); await assert.rejects(verify(x), new RegExp(error)); };
await invalid(x => { x.manifest.snapshot = ''; }, 'MISSING_SNAPSHOT_IDENTITY');
await invalid(x => { x.snapshotBytes[0] ^= 1; }, 'SNAPSHOT_HASH_MISMATCH');
await invalid(x => { x.manifest.locator = 'missing'; }, 'SNAPSHOT_LOCATOR_MISMATCH');
await invalid(x => { x.candidate.equipmentId++; }, 'SOURCE_RECORD_NOT_FOUND_OR_DUPLICATE');
await invalid(x => { x.candidate.heroId++; }, 'SOURCE_FIELD_MISMATCH');
await invalid(x => { x.candidate.evidence.record.SkillHero++; }, 'SOURCE_FIELD_MISMATCH');
await invalid(x => { x.candidate.evidence.record.GetPathList[0].PathType = 99; }, 'SELECTION_EVIDENCE_MISMATCH');
await invalid(x => { x.manifest.snapshot = 'other'; }, 'SNAPSHOT_IDENTITY_MISMATCH');
await invalid(x => { x.candidate.evidence.provenanceEdges.pop(); }, 'MISSING_SEMANTIC_DEPENDENCY');
await invalid(x => { x.candidate.evidence.provenanceEdges.shift(); }, 'MISSING_SOURCE_DEPENDENCY');
await invalid(x => { const row = { ...sourceRow, GetPathList: [{ PathType: 47 }] }; x.snapshotBytes = Buffer.from(JSON.stringify([row])); x.manifest.sha256 = createHash('sha256').update(x.snapshotBytes).digest('hex'); }, 'SELECTION_PREDICATE_MISMATCH');
await invalid(x => { x.snapshotBytes = Buffer.from(JSON.stringify({ wrong: [] })); x.manifest.sha256 = createHash('sha256').update(x.snapshotBytes).digest('hex'); }, 'SNAPSHOT_LOCATOR_NOT_FOUND');
await invalid(x => { x.candidate.evidence.record.unverified = 1; }, 'UNSUPPORTED_RECORD_FIELD');
await invalid(x => { x.candidate.evidence.evidenceClass = 'C'; }, 'UNSUPPORTED_EVIDENCE_CLASS');
await invalid(x => { x.candidate.evidence.provenanceEdges.push({ from: x.manifest.locator, to: 'fixture claim' }); }, 'CIRCULAR_PROVENANCE');
const external = await verify({ ...verificationInput, manifest: { ...manifest, kind: 'external' } });
assert.equal(external.sourceAuthenticity, 'NOT_VERIFIED');
assert.equal(external.verificationScope, 'EXTERNAL_UNATTESTED');
console.log('Fixture snapshot integrity, independent record comparison and verification boundaries: PASS');

// Fixed historical source anchor. These expected values are duplicated here
// intentionally so tests do not derive expected results from implementation.
const pinnedIdentity = {
  sourceRepository: 'LuceatLuxVestra42/langrisser-future-guide',
  sourceIdentityEvidence: 'evidence/exclusive-equipment-identity.v1.json#claims.claimA.provenance',
  sourcePackContract: 'data/contracts/configdata-source-pack-contract.v1.json#authoritativePredecessor',
  sourceFamily: 'UNITYDATATOOL_PARSED_CONFIGDATA',
  sourceCommit: '6475e63ee23d18adf733756c26a14fa9e3ed662c',
  commitTreeGitSha1: '08e1e6c2773730e60b258940e31494f68d65f86a',
  configDataTreeGitSha1: 'b18983f60cb054c2e6e094d64cdb98979211d7fc',
  snapshot: 'source-configdata-v1-6475e63e',
  version: '6475e63ee23d18adf733756c26a14fa9e3ed662c',
  logicalPath: 'data/configdata/ConfigDataEquipmentInfo.json',
  gitBlobSha1: '353c4f00b44a2ba0f8eb32dd03a76c3224635d04',
  anchorLocator: 'git-blob:6475e63ee23d18adf733756c26a14fa9e3ed662c:data/configdata/ConfigDataEquipmentInfo.json#353c4f00b44a2ba0f8eb32dd03a76c3224635d04',
  fileSha256: 'b4e4a27c68a7038c1b282140b82a634c9d18c348f79b9e6d411840c7ffe54e70',
  byteLength: 1343806,
  parser: 'configdata-json-array-v1',
  transformation: 'copy-ID-SkillHero-GetPathList',
  scope: 'pinned EquipmentInfo source-file identity and direct record-field comparison only',
  limitations: 'PathType=46 is a preserved selector in this pinned scope; its future semantic meaning and future snapshots are not authenticated',
  semanticDependency: 'existing exclusive-equipment identity evidence; semantic reuse remains claim-scoped',
};
const pinnedManifest = {
  kind: 'pinned-git-blob',
  sourceFamily: pinnedIdentity.sourceFamily,
  snapshot: pinnedIdentity.snapshot,
  version: pinnedIdentity.version,
  sourceRepository: pinnedIdentity.sourceRepository,
  sourceIdentityEvidence: pinnedIdentity.sourceIdentityEvidence,
  sourcePackContract: pinnedIdentity.sourcePackContract,
  sourceCommit: pinnedIdentity.sourceCommit,
  commitTreeGitSha1: pinnedIdentity.commitTreeGitSha1,
  configDataTreeGitSha1: pinnedIdentity.configDataTreeGitSha1,
  sourcePath: pinnedIdentity.logicalPath,
  sourceBlobSha1: pinnedIdentity.gitBlobSha1,
  sha256: pinnedIdentity.fileSha256,
  byteLength: pinnedIdentity.byteLength,
  parser: pinnedIdentity.parser,
  transformation: pinnedIdentity.transformation,
  scope: pinnedIdentity.scope,
  limitations: pinnedIdentity.limitations,
  semanticDependency: pinnedIdentity.semanticDependency,
  locator: pinnedIdentity.anchorLocator,
};
const pinnedCandidate = {
  equipmentId: 277,
  heroId: 1,
  evidence: {
    sourceFamily: pinnedIdentity.sourceFamily,
    version: pinnedIdentity.version,
    snapshot: pinnedIdentity.snapshot,
    locator: 'ConfigDataEquipmentInfo#ID=277',
    record: { ID: 277, SkillHero: 1, GetPathList: [{ PathType: 46, Name: 46 }] },
    relationField: 'SkillHero',
    selectionEvidence: 'GetPathList.length == 1 && GetPathList[0].PathType == 46',
    semanticDecision: 'existing admitted equipment relation used only as a source-record probe',
    scope: pinnedIdentity.scope,
    transformation: pinnedIdentity.transformation,
    limitations: pinnedIdentity.limitations,
    evidenceClass: 'B',
    provenanceKind: 'source',
    anchor: pinnedIdentity.anchorLocator,
    claimReference: 'existing-equipment-277-binding-probe',
    provenanceEdges: [
      { from: 'existing-equipment-277-binding-probe', to: 'ConfigDataEquipmentInfo#ID=277' },
      { from: 'ConfigDataEquipmentInfo#ID=277', to: pinnedIdentity.anchorLocator },
      { from: 'existing-equipment-277-binding-probe', to: pinnedIdentity.semanticDependency },
    ],
  },
};
const pinnedInput = snapshotBytes => ({ candidate: structuredClone(pinnedCandidate), snapshotBytes, sourceIdentity: { ...pinnedIdentity }, manifest: { ...pinnedManifest } });
const shortBytes = Buffer.from('[]');
const pinnedBad = async (mutate, error, bytes = shortBytes) => {
  const input = pinnedInput(Buffer.from(bytes));
  mutate(input);
  await assert.rejects(verifyPinned(input), new RegExp(error));
};
await pinnedBad(x => { x.sourceIdentity.sourceCommit = 'f'.repeat(40); }, 'PINNED_SOURCE_SOURCECOMMIT_MISMATCH');
await pinnedBad(x => { x.sourceIdentity.commitTreeGitSha1 = 'f'.repeat(40); }, 'PINNED_SOURCE_COMMITTREEGITSHA1_MISMATCH');
await pinnedBad(x => { x.sourceIdentity.configDataTreeGitSha1 = 'f'.repeat(40); }, 'PINNED_SOURCE_CONFIGDATATREEGITSHA1_MISMATCH');
await pinnedBad(x => { x.sourceIdentity.sourceFamily = 'other-source'; }, 'PINNED_SOURCE_SOURCEFAMILY_MISMATCH');
await pinnedBad(x => { x.sourceIdentity.snapshot = 'future-snapshot'; }, 'PINNED_SOURCE_SNAPSHOT_MISMATCH');
await pinnedBad(x => { x.sourceIdentity.version = 'future-version'; }, 'PINNED_SOURCE_VERSION_MISMATCH');
await pinnedBad(x => { x.sourceIdentity.logicalPath = 'data/configdata/Other.json'; }, 'PINNED_SOURCE_LOGICALPATH_MISMATCH');
await pinnedBad(x => { x.sourceIdentity.gitBlobSha1 = 'f'.repeat(40); }, 'PINNED_SOURCE_GITBLOBSHA1_MISMATCH');
await pinnedBad(x => { x.sourceIdentity.fileSha256 = 'f'.repeat(64); }, 'PINNED_SOURCE_FILESHA256_MISMATCH');
await pinnedBad(x => { x.sourceIdentity.byteLength++; }, 'PINNED_SOURCE_BYTELENGTH_MISMATCH');
await pinnedBad(x => { x.manifest.sourcePath = 'data/configdata/Other.json'; }, 'PINNED_MANIFEST_SOURCEPATH_MISMATCH');
await pinnedBad(x => { x.manifest.sourceBlobSha1 = 'f'.repeat(40); }, 'PINNED_MANIFEST_SOURCEBLOBSHA1_MISMATCH');
await pinnedBad(x => { x.manifest.sha256 = 'f'.repeat(64); }, 'PINNED_MANIFEST_SHA256_MISMATCH');
await pinnedBad(x => { x.manifest.byteLength++; }, 'PINNED_MANIFEST_BYTELENGTH_MISMATCH');
await pinnedBad(x => { x.manifest.parser = 'unapproved-parser'; }, 'PINNED_MANIFEST_PARSER_MISMATCH');
await pinnedBad(x => { x.manifest.transformation = 'unapproved-transform'; }, 'PINNED_MANIFEST_TRANSFORMATION_MISMATCH');
await pinnedBad(x => { x.manifest.kind = 'fixture'; }, 'PINNED_SOURCE_KIND_REQUIRED');
await pinnedBad(x => { x.snapshotBytes = Buffer.alloc(1343805); }, 'PINNED_SOURCE_BYTE_LENGTH_MISMATCH');
await pinnedBad(x => { x.snapshotBytes = Buffer.alloc(1343806); }, 'PINNED_SOURCE_SHA256_MISMATCH');
let pinnedSourceBytes = null;
if (process.env.PINNED_EQUIPMENT_INFO_BYTES_PATH) {
  pinnedSourceBytes = await readFile(process.env.PINNED_EQUIPMENT_INFO_BYTES_PATH);
} else if (process.env.PINNED_EQUIPMENT_INFO_GIT_DIR) {
  pinnedSourceBytes = execFileSync('git', ['-C', process.env.PINNED_EQUIPMENT_INFO_GIT_DIR, 'cat-file', 'blob', pinnedIdentity.gitBlobSha1], { maxBuffer: 4 * 1024 * 1024 });
}

if (pinnedSourceBytes) {
  const rawBytes = pinnedSourceBytes;
  const bound = await verifyPinned(pinnedInput(rawBytes));
  assert.equal(bound.verificationScope, 'PINNED_GIT_BLOB_BYTES_ONLY');
  assert.equal(bound.snapshotIntegrity, 'PASS_AGAINST_PINNED_SOURCE_ANCHOR');
  assert.equal(bound.pinnedSourceIdentity, 'PASS_FOR_FIXED_ANCHOR_BYTE_IDENTITY');
  assert.equal(bound.sourceRecord, 'PASS_AGAINST_SUPPLIED_BYTES');
  assert.equal(bound.sourceAuthenticity, 'PASS_FOR_PINNED_SOURCE_FILE_BYTES_ONLY');
  assert.equal(bound.futureSnapshotAuthority, 'NOT_VERIFIED');
  assert.equal(bound.semanticDecision, 'MANUAL_REVIEW');
  assert.equal(bound.admission, 'NOT_APPROVED');
  assert.equal(bound.publication, 'NOT_APPROVED');

  const changedRecord = pinnedInput(rawBytes);
  changedRecord.candidate.evidence.record.ID = 278;
  await assert.rejects(verifyPinned(changedRecord), /SOURCE_FIELD_MISMATCH/);
  const changedHero = pinnedInput(rawBytes);
  changedHero.candidate.evidence.record.SkillHero = 2;
  await assert.rejects(verifyPinned(changedHero), /SOURCE_FIELD_MISMATCH/);
  const changedSelection = pinnedInput(rawBytes);
  changedSelection.candidate.evidence.record.GetPathList = [{ PathType: 47, Name: 47 }];
  await assert.rejects(verifyPinned(changedSelection), /SELECTION_EVIDENCE_MISMATCH/);
  console.log(`Pinned Git Blob source bytes: PASS (${rawBytes.length} bytes; fixed EquipmentInfo anchor only)`);
} else {
  console.log('Pinned Git Blob source bytes: NOT_VERIFIED in this run (no original-source byte input configured)');
}
console.log('Pinned source anchor spoofing, snapshot/version/path/parser/transform changes, byte tampering, future-snapshot boundary and non-promotion negatives: PASS');
