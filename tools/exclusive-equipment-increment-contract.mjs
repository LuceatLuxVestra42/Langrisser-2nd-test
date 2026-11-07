// Candidate screening only. No outcome grants admission or publication.
// Authenticity, semantic interpretation and independence require human review.
const id = n => Number.isSafeInteger(n) && n > 0;
const text = s => typeof s === 'string' && s.trim().length > 0;
const requireCondition = (condition, code) => { if (!condition) throw new Error(code); };

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
  const { createHash } = await import('node:crypto');
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
