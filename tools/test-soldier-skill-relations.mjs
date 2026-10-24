import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CANONICAL_PATH, CONTRACT_EVIDENCE_PATH, validateSoldierSkillRelations,
} from './validate-soldier-skill-relations.mjs';

const root = process.env.SD14_FIXTURE_ROOT ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = async relative => JSON.parse(await fs.readFile(path.resolve(root, relative), 'utf8'));
const evidenceBytes = await fs.readFile(path.resolve(root, CONTRACT_EVIDENCE_PATH));
const fixture = {
  relationCanonical: await read(CANONICAL_PATH),
  contractEvidence: JSON.parse(evidenceBytes.toString('utf8')),
  contractEvidenceSha256: crypto.createHash('sha256').update(evidenceBytes).digest('hex'),
  rawReferences: await read('canonical/soldier-raw-skill-references.v1.json'),
  soldiers: await read('canonical/soldiers.v1.json'),
  spNormalRelations: await read('canonical/sp-soldier-normal-relations.v1.json'),
  skills: await read('canonical/skills.v1.json'),
};
const clone = value => structuredClone(value);
let checks = 0;
function rejects(label, mutate, pattern) {
  const input = clone(fixture);
  mutate(input);
  assert.throws(() => validateSoldierSkillRelations(input), pattern, label);
  checks++;
}
function accepts(label, mutate) {
  const input = clone(fixture);
  mutate(input);
  assert.deepEqual(validateSoldierSkillRelations(input), {
    sourceSoldierCount: 2, edgeCount: 20, targetSkillCount: 20, skillIdentityCount: input.skills.records.length,
  }, label);
  checks++;
}
assert.deepEqual(validateSoldierSkillRelations(fixture), {
  sourceSoldierCount: 2, edgeCount: 20, targetSkillCount: 20, skillIdentityCount: fixture.skills.records.length,
});
checks++;
rejects('one relation edge removed', x => { x.relationCanonical.records.pop(); });
rejects('one relation edge added', x => { x.relationCanonical.records.push(clone(x.relationCanonical.records[0])); });
rejects('target changed', x => { x.relationCanonical.records[0].targetSkillId++; });
rejects('source Soldier changed', x => { x.relationCanonical.records[0].sourceSoldierId = 118; });
rejects('relation duplicate inserted', x => { x.relationCanonical.records[1] = clone(x.relationCanonical.records[0]); });
rejects('TrainingTech Skill ID mixed into Soldier relation', x => { x.relationCanonical.records[0].targetSkillId = 65110; });
rejects('source Field changed', x => { x.relationCanonical.records[0].sourceField = 'SoldierSkillID'; });
rejects('relation type changed', x => { x.relationCanonical.relationType = 'EFFECT_RELATION'; });
rejects('cardinality changed', x => { x.relationCanonical.cardinality = 'ONE'; });
rejects('source provenance changed', x => { x.relationCanonical.records[0].provenance.sourceField = 'wrong'; });
rejects('contract provenance changed', x => { x.relationCanonical.records[0].provenance.contract = 'wrong'; });
rejects('contract evidence locator changed', x => { x.relationCanonical.contractEvidence = 'wrong'; });
rejects('game level semantic field inserted', x => { x.relationCanonical.records[0].gameSkillLevel = 1; });
rejects('effect formula semantic field inserted', x => { x.relationCanonical.records[0].effectFormula = 'x'; });
rejects('NORMAL/SP mapping semantic field inserted', x => { x.relationCanonical.records[0].normalSpSkillPair = true; });
rejects('relation edge target type changed', x => { x.relationCanonical.records[0].targetSkillId = String(x.relationCanonical.records[0].targetSkillId); });
rejects('raw source reference changed', x => { x.rawReferences.records.find(r => r.id === 115).rawReferenceIds[0]++; });
rejects('raw source Soldier removed', x => { x.rawReferences.records = x.rawReferences.records.filter(r => r.id !== 115); });
rejects('referenced raw Soldier duplicated', x => { x.rawReferences.records.push(clone(x.rawReferences.records[0])); });
rejects('Soldier identity endpoint removed', x => { x.soldiers.records = x.soldiers.records.filter(r => r.id !== 115); });
rejects('Soldier variant changed', x => { x.soldiers.records.find(r => r.id === 5115).variant = 'NORMAL'; });
rejects('SP to NORMAL relation changed', x => { x.spNormalRelations.records.find(r => r.spSoldierId === 5115).normalSoldierId = 118; });
rejects('Skill identity endpoint removed', x => { x.skills.records = x.skills.records.filter(r => r.skillId !== 60666); });
rejects('referenced Skill identity duplicate inserted', x => { x.skills.records.push(clone(x.skills.records.find(r => r.skillId === 60666))); });
rejects('Legacy source Commit changed', x => { x.contractEvidence.source.commit = '0'.repeat(40); });
rejects('Legacy contract key changed', x => { x.contractEvidence.source.contract.key = 'soldier.other'; });
rejects('Legacy source Field changed', x => { x.contractEvidence.contract.sourceField = 'OtherField'; });
rejects('Legacy target Table changed', x => { x.contractEvidence.contract.targetType = 'Other'; });
rejects('Legacy contract evidence edge removed', x => { x.contractEvidence.selectedEdges.pop(); });
rejects('Legacy contract evidence targetId modified', x => { x.contractEvidence.selectedEdges[0].targetId = '60667'; }, /Legacy forward edge locator mismatch/);
rejects('Legacy contract evidence digest changed', x => { x.contractEvidenceSha256 = '0'.repeat(64); });
rejects('contract evidence scope widened', x => { x.contractEvidence.scope.sourceSoldierIds.push(118); });
rejects('referenced Soldier duplicated', x => { x.soldiers.records.push(clone(x.soldiers.records.find(r => r.id === 115))); });
rejects('conflicting SP correspondence added', x => { x.spNormalRelations.records.push({ spSoldierId: 5115, normalSoldierId: 118 }); });
// Synthetic records exercise consumer independence; they are never canonical admissions.
accepts('unrelated Skill identity added', x => { x.skills.records.push({ ...clone(x.skills.records[0]), skillId: 999999 }); });
accepts('unreferenced Skill identity removed', x => { x.skills.records = x.skills.records.filter(r => r.skillId !== 65110); });
accepts('unrelated Soldier identity added', x => { x.soldiers.records.push({ entity: 'Soldier', id: 999999, variant: 'NORMAL' }); });
accepts('unrelated SP correspondence added', x => { x.spNormalRelations.records.push({ spSoldierId: 999999, normalSoldierId: 999998 }); });
accepts('unrelated raw reference record added', x => { x.rawReferences.records.push({ ...clone(x.rawReferences.records[0]), id: 999999 }); });
process.stdout.write(`Soldier-to-Skill relation negative tests: PASS (${checks} checks)\n`);
