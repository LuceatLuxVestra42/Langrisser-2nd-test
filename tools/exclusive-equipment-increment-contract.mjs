import { createHash } from 'node:crypto';

// Candidate screening only. No outcome grants admission or publication.
// Unpinned source authenticity, semantic interpretation and provenance independence require review.
const id = n => Number.isSafeInteger(n) && n > 0;
const text = s => typeof s === 'string' && s.trim().length > 0;
const requireCondition = (condition, code) => { if (!condition) throw new Error(code); };

// This anchor is limited to the historical EquipmentInfo file at one pinned
// predecessor commit. It does not authenticate a future snapshot or classify
// new equipment. Its values are bound to the existing identity evidence and
// independently checked Git object bytes for this exact path.
const PINNED_EQUIPMENT_INFO = Object.freeze({
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
});

function gitBlobSha1(bytes) {
  const header = Buffer.from(`blob ${bytes.length}\0`, 'ascii');
  return createHash('sha1').update(Buffer.concat([header, bytes])).digest('hex');
}

/** Baselines must first pass their existing owning validators. Inputs are read only.
 * Source records are caller-supplied: matching their values does not authenticate them.
 * Returns structural screening results, never an admission or publication decision.
 */
export function screenExclusiveEquipmentIncrement({ heroes, equipment, relations, candidates }) {
  requireCondition(Array.isArray(heroes) && Array.isArray(equipment) && Array.isArray(relations) && Array.isArray(candidates), 'INVALID_INPUT');
  const heroIds = new Set(heroes.map(x => x.heroId));
  const equipmentIds = new Set(equipment.map(x => x.equipmentId));
  const occupiedHeroes = new Set(relations.map(x => x.heroId));
  requireCondition(heroIds.size === heroes.length && [...heroIds].every(id), 'INVALID_HERO_BASELINE');
  requireCondition(equipment.length === 167 && equipmentIds.size === 167 && [...equipmentIds].every(id), 'INVALID_EQUIPMENT_BASELINE');
  requireCondition(relations.length === 167 && occupiedHeroes.size === 167 && relations.every(x => heroIds.has(x.heroId) && equipmentIds.has(x.equipmentId)) && new Set(relations.map(x => x.equipmentId)).size === 167, 'INVALID_RELATION_BASELINE');
  const seenEquipment = new Set();
  const seenHeroes = new Set();
  return candidates.map(c => {
    requireCondition(c && id(c.equipmentId) && id(c.heroId), 'INVALID_CLAIM');
    requireCondition(!equipmentIds.has(c.equipmentId) && !seenEquipment.has(c.equipmentId), 'DUPLICATE_EQUIPMENT');
    requireCondition(heroIds.has(c.heroId), 'UNKNOWN_HERO');
    requireCondition(!occupiedHeroes.has(c.heroId) && !seenHeroes.has(c.heroId), 'HERO_RELATION_CONFLICT');
    seenEquipment.add(c.equipmentId); seenHeroes.add(c.heroId);
    const e = c.evidence;
    requireCondition(e && text(e.sourceFamily) && text(e.version) && text(e.snapshot) && text(e.locator), 'MISSING_SOURCE_PROVENANCE');
    requireCondition(e.locator === `ConfigDataEquipmentInfo#ID=${c.equipmentId}`, 'RECORD_LOCATOR_MISMATCH');
    requireCondition(e.record && e.record.ID === c.equipmentId, 'SOURCE_ID_MISMATCH');
    requireCondition(Object.hasOwn(e.record, 'SkillHero'), 'MISSING_SKILL_HERO');
    requireCondition(e.record.SkillHero === c.heroId && e.relationField === 'SkillHero', 'RELATION_MISMATCH');
    requireCondition(text(e.selectionEvidence) && text(e.semanticDecision) && text(e.scope) && text(e.transformation) && text(e.limitations), 'MISSING_SEMANTIC_PROVENANCE');
    requireCondition(e.evidenceClass === 'A' || e.evidenceClass === 'B', 'UNSUPPORTED_EVIDENCE_CLASS');
    // A declared anchor is not independently verified. Derived or self-referential
    // evidence cannot be promoted; all other chains still need external review.
    requireCondition(e.provenanceKind === 'source' && text(e.anchor) && e.anchor !== e.locator && e.anchor !== e.claimReference, 'CIRCULAR_OR_MISSING_ANCHOR');
    // Check all supplied provenance edges for cycles, including indirect cycles.
    // Omitted or fabricated edges cannot be established by this structural check.
    requireCondition(Array.isArray(e.provenanceEdges) && e.provenanceEdges.length > 0, 'MISSING_PROVENANCE_CHAIN');
    const graph = new Map();
    for (const edge of e.provenanceEdges) {
      requireCondition(edge && text(edge.from) && text(edge.to), 'INVALID_PROVENANCE_EDGE');
      if (!graph.has(edge.from)) graph.set(edge.from, []);
      graph.get(edge.from).push(edge.to);
    }
    const visiting = new Set(), done = new Set();
    const visit = node => {
      requireCondition(!visiting.has(node), 'CIRCULAR_PROVENANCE');
      if (done.has(node)) return;
      visiting.add(node);
      for (const next of graph.get(node) ?? []) visit(next);
      visiting.delete(node); done.add(node);
    };
    for (const node of graph.keys()) visit(node);
    requireCondition(graph.has(e.claimReference), 'MISSING_CLAIM_CHAIN');
    const reachable = new Set();
    const collect = node => { if (reachable.has(node)) return; reachable.add(node); for (const next of graph.get(node) ?? []) collect(next); };
    collect(e.claimReference);
    requireCondition(reachable.has(e.anchor) && !graph.has(e.anchor), 'MISSING_SOURCE_ANCHOR');
    return { equipmentId: c.equipmentId, heroId: c.heroId, structuralScreen: 'PASS', sourceAuthenticity: 'NOT_VERIFIED', semanticDecision: 'MANUAL_REVIEW', admission: 'NOT_APPROVED', publication: 'NOT_APPROVED' };
  });
}

/** Compare candidate fields against separately supplied snapshot bytes and a pinned
 * manifest. The caller must independently establish the manifest's authority. A hash
 * match establishes integrity relative to that manifest, not source authenticity.
 * The pinned predecessor uses a top-level JSON array. Future formats are not assumed.
 */
export async function verifyExclusiveEquipmentSnapshot({ candidate, snapshotBytes, manifest }) {
  requireCondition(candidate && candidate.evidence && manifest, 'INVALID_SOURCE_INPUT');
  const e = candidate.evidence;
  requireCondition(text(manifest.snapshot) && text(manifest.version) && text(manifest.sourceFamily) && text(manifest.locator) && text(manifest.sha256), 'MISSING_SNAPSHOT_IDENTITY');
  requireCondition(manifest.kind === 'fixture' || manifest.kind === 'external', 'INVALID_SNAPSHOT_KIND');
  requireCondition(manifest.parser === 'configdata-json-array-v1' && manifest.transformation === 'copy-ID-SkillHero-GetPathList', 'UNSUPPORTED_TRANSFORMATION');
  requireCondition(text(manifest.scope) && text(manifest.limitations) && text(manifest.semanticDependency), 'MISSING_MANIFEST_DEPENDENCY');
  requireCondition(e.sourceFamily === manifest.sourceFamily && e.snapshot === manifest.snapshot && e.version === manifest.version && e.scope === manifest.scope && e.transformation === manifest.transformation, 'SNAPSHOT_IDENTITY_MISMATCH');
  requireCondition(e.anchor === manifest.locator, 'SNAPSHOT_LOCATOR_MISMATCH');
  requireCondition(e.evidenceClass === 'A' || e.evidenceClass === 'B', 'UNSUPPORTED_EVIDENCE_CLASS');
  requireCondition(e.record && Object.keys(e.record).sort().join(',') === 'GetPathList,ID,SkillHero', 'UNSUPPORTED_RECORD_FIELD');
  requireCondition(Buffer.isBuffer(snapshotBytes), 'MISSING_SNAPSHOT_BYTES');
  requireCondition(/^[a-f0-9]{64}$/.test(manifest.sha256) && createHash('sha256').update(snapshotBytes).digest('hex') === manifest.sha256, 'SNAPSHOT_HASH_MISMATCH');
  let snapshot;
  try { snapshot = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(snapshotBytes)); } catch { throw new Error('INVALID_SNAPSHOT'); }
  requireCondition(Array.isArray(snapshot), 'SNAPSHOT_LOCATOR_NOT_FOUND');
  const matches = snapshot.filter(row => row && row.ID === candidate.equipmentId);
  requireCondition(matches.length === 1, 'SOURCE_RECORD_NOT_FOUND_OR_DUPLICATE');
  const row = matches[0];
  requireCondition(e.locator === `ConfigDataEquipmentInfo#ID=${row.ID}`, 'SOURCE_RECORD_LOCATOR_MISMATCH');
  requireCondition(Object.hasOwn(row, 'SkillHero') && row.SkillHero === candidate.heroId && e.record.SkillHero === row.SkillHero && e.record.ID === row.ID, 'SOURCE_FIELD_MISMATCH');
  requireCondition(Array.isArray(row.GetPathList) && row.GetPathList.length === 1 && row.GetPathList[0]?.PathType === 46, 'SELECTION_PREDICATE_MISMATCH');
  requireCondition(Object.hasOwn(e.record, 'GetPathList') && JSON.stringify(e.record.GetPathList) === JSON.stringify(row.GetPathList), 'SELECTION_EVIDENCE_MISMATCH');
  requireCondition(Array.isArray(e.provenanceEdges) && e.provenanceEdges.some(x => x.from === e.claimReference && x.to === e.locator) && e.provenanceEdges.some(x => x.from === e.locator && x.to === manifest.locator), 'MISSING_SOURCE_DEPENDENCY');
  requireCondition(e.provenanceEdges.some(x => x.from === e.claimReference && x.to === manifest.semanticDependency), 'MISSING_SEMANTIC_DEPENDENCY');
  const graph = new Map();
  for (const edge of e.provenanceEdges) {
    requireCondition(edge && text(edge.from) && text(edge.to), 'INVALID_PROVENANCE_EDGE');
    if (!graph.has(edge.from)) graph.set(edge.from, []);
    graph.get(edge.from).push(edge.to);
  }
  const visiting = new Set(), done = new Set();
  const visit = node => {
    requireCondition(!visiting.has(node), 'CIRCULAR_PROVENANCE');
    if (done.has(node)) return;
    visiting.add(node);
    for (const next of graph.get(node) ?? []) visit(next);
    visiting.delete(node); done.add(node);
  };
  for (const node of graph.keys()) visit(node);
  return { verificationScope: manifest.kind === 'fixture' ? 'FIXTURE_ONLY' : 'EXTERNAL_UNATTESTED', snapshotIntegrity: 'PASS_AGAINST_SUPPLIED_MANIFEST', sourceRecord: 'PASS_AGAINST_SUPPLIED_BYTES', selectionPredicate: 'PASS', sourceAuthenticity: 'NOT_VERIFIED', semanticDecision: 'MANUAL_REVIEW', externalDependencies: 'NOT_VERIFIED', admission: 'NOT_APPROVED', publication: 'NOT_APPROVED' };
}

/**
 * Bind bytes to the one previously evidenced EquipmentInfo Git blob. Both
 * sourceIdentity and manifest are caller claims; neither supplies the trusted
 * values. The fixed anchor above is the only accepted identity for this path.
 * This performs no live remote Git lookup and cannot authorize future snapshots.
 */
export async function verifyPinnedExclusiveEquipmentSnapshot({ candidate, snapshotBytes, sourceIdentity, manifest }) {
  requireCondition(candidate && candidate.evidence && sourceIdentity && manifest, 'INVALID_PINNED_SOURCE_INPUT');
  requireCondition(manifest.kind === 'pinned-git-blob', 'PINNED_SOURCE_KIND_REQUIRED');

  const identityKeys = Object.keys(PINNED_EQUIPMENT_INFO).sort();
  requireCondition(Object.keys(sourceIdentity).sort().join(',') === identityKeys.join(','), 'PINNED_SOURCE_IDENTITY_SHAPE_MISMATCH');
  for (const key of identityKeys) requireCondition(sourceIdentity[key] === PINNED_EQUIPMENT_INFO[key], `PINNED_SOURCE_${key.toUpperCase()}_MISMATCH`);

  const manifestExpected = {
    kind: 'pinned-git-blob',
    sourceFamily: PINNED_EQUIPMENT_INFO.sourceFamily,
    snapshot: PINNED_EQUIPMENT_INFO.snapshot,
    version: PINNED_EQUIPMENT_INFO.version,
    sourceRepository: PINNED_EQUIPMENT_INFO.sourceRepository,
    sourceIdentityEvidence: PINNED_EQUIPMENT_INFO.sourceIdentityEvidence,
    sourcePackContract: PINNED_EQUIPMENT_INFO.sourcePackContract,
    sourceCommit: PINNED_EQUIPMENT_INFO.sourceCommit,
    commitTreeGitSha1: PINNED_EQUIPMENT_INFO.commitTreeGitSha1,
    configDataTreeGitSha1: PINNED_EQUIPMENT_INFO.configDataTreeGitSha1,
    sourcePath: PINNED_EQUIPMENT_INFO.logicalPath,
    sourceBlobSha1: PINNED_EQUIPMENT_INFO.gitBlobSha1,
    sha256: PINNED_EQUIPMENT_INFO.fileSha256,
    byteLength: PINNED_EQUIPMENT_INFO.byteLength,
    parser: PINNED_EQUIPMENT_INFO.parser,
    transformation: PINNED_EQUIPMENT_INFO.transformation,
    scope: PINNED_EQUIPMENT_INFO.scope,
    limitations: PINNED_EQUIPMENT_INFO.limitations,
    semanticDependency: PINNED_EQUIPMENT_INFO.semanticDependency,
    locator: PINNED_EQUIPMENT_INFO.anchorLocator,
  };
  requireCondition(Object.keys(manifest).sort().join(',') === Object.keys(manifestExpected).sort().join(','), 'PINNED_MANIFEST_SHAPE_MISMATCH');
  for (const [key, value] of Object.entries(manifestExpected)) requireCondition(manifest[key] === value, `PINNED_MANIFEST_${key.toUpperCase()}_MISMATCH`);

  requireCondition(Buffer.isBuffer(snapshotBytes), 'MISSING_SNAPSHOT_BYTES');
  requireCondition(snapshotBytes.length === PINNED_EQUIPMENT_INFO.byteLength, 'PINNED_SOURCE_BYTE_LENGTH_MISMATCH');
  requireCondition(createHash('sha256').update(snapshotBytes).digest('hex') === PINNED_EQUIPMENT_INFO.fileSha256, 'PINNED_SOURCE_SHA256_MISMATCH');
  requireCondition(gitBlobSha1(snapshotBytes) === PINNED_EQUIPMENT_INFO.gitBlobSha1, 'PINNED_SOURCE_GIT_BLOB_SHA1_MISMATCH');

  // Reuse the existing record/field and selector contract, but construct its
  // manifest from the private fixed anchor instead of trusting caller values.
  const verified = await verifyExclusiveEquipmentSnapshot({
    candidate,
    snapshotBytes,
    manifest: {
      kind: 'external',
      sourceFamily: PINNED_EQUIPMENT_INFO.sourceFamily,
      snapshot: PINNED_EQUIPMENT_INFO.snapshot,
      version: PINNED_EQUIPMENT_INFO.version,
      locator: PINNED_EQUIPMENT_INFO.anchorLocator,
      sha256: PINNED_EQUIPMENT_INFO.fileSha256,
      parser: PINNED_EQUIPMENT_INFO.parser,
      transformation: PINNED_EQUIPMENT_INFO.transformation,
      scope: PINNED_EQUIPMENT_INFO.scope,
      limitations: PINNED_EQUIPMENT_INFO.limitations,
      semanticDependency: PINNED_EQUIPMENT_INFO.semanticDependency,
    },
  });
  return {
    ...verified,
    verificationScope: 'PINNED_GIT_BLOB_BYTES_ONLY',
    snapshotIntegrity: 'PASS_AGAINST_PINNED_SOURCE_ANCHOR',
    pinnedSourceIdentity: 'PASS_FOR_FIXED_ANCHOR_BYTE_IDENTITY',
    sourceRecord: 'PASS_AGAINST_PINNED_SOURCE_BYTES',
    sourceAuthenticity: 'PASS_FOR_PINNED_SOURCE_FILE_BYTES_ONLY',
    futureSnapshotAuthority: 'NOT_VERIFIED',
    semanticDecision: 'MANUAL_REVIEW',
    admission: 'NOT_APPROVED',
    publication: 'NOT_APPROVED',
  };
}
