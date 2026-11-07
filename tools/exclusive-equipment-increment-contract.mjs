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
    return { equipmentId: c.equipmentId, heroId: c.heroId, structuralScreen: 'PASS', sourceAuthenticity: 'NOT_VERIFIED', semanticDecision: 'MANUAL_REVIEW', admission: 'NOT_APPROVED', publication: 'NOT_APPROVED' };
  });
}
