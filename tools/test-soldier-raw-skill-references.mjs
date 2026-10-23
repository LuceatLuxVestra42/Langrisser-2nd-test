import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CANONICAL_PATH, SOURCE_EVIDENCE_PATH, SOURCE_MANIFEST_PATH,
  validateSoldierRawSkillReferences,
} from './validate-soldier-raw-skill-references.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readBytes = relative => fs.readFileSync(path.resolve(root, relative));
const read = relative => JSON.parse(readBytes(relative).toString('utf8'));
const evidenceBytes = readBytes(SOURCE_EVIDENCE_PATH);
const fixture = {
  canonical: read(CANONICAL_PATH),
  sourceEvidence: JSON.parse(evidenceBytes.toString('utf8')),
  sourceEvidenceSha256: crypto.createHash('sha256').update(evidenceBytes).digest('hex'),
  sourceManifest: read(SOURCE_MANIFEST_PATH),
  soldiers: read('canonical/soldiers.v1.json'),
  relations: read('canonical/sp-soldier-normal-relations.v1.json'),
  normalStats: read('canonical/normal-soldier-base-stats.v1.json'),
  spStats: read('canonical/sp-soldier-base-stats.v1.json'),
  bfMovePoints: read('canonical/soldier-bf-move-points.v1.json'),
  heroSoldierRelations: read('canonical/hero-soldier-relations.v1.json'),
  trainingDescriptions: read('canonical/soldier-training-tech-descriptions.v1.json'),
  trainingCosts: read('canonical/soldier-training-tech-level-costs.v1.json'),
  skills: read('canonical/skills.v1.json'),
  rawGrowthStats: read('canonical/soldier-raw-growth-stats.v1.json'),
};
const clone = value => structuredClone(value);
let checks = 0;
function rejects(label, mutate) {
  const input = clone(fixture);
  mutate(input);
  assert.throws(() => validateSoldierRawSkillReferences(input), undefined, label);
  checks++;
}
assert.deepEqual(validateSoldierRawSkillReferences(fixture), {
  soldierRecordCount: 2, referenceIdCount: 20, sourceEvidenceCount: 112,
});
checks++;
rejects('wrong Soldier ID', x => { x.canonical.records[0].id = 116; });
rejects('NORMAL/SP variant swapped', x => { x.canonical.records[1].variant = 'NORMAL'; });
rejects('Source Record locator changed', x => { x.canonical.records[0].provenance.sourceRecord = 'wrong#ID=116'; });
rejects('Source Field provenance changed', x => { x.canonical.records[0].provenance.sourceField = 'wrong#ID=115/Other'; });
rejects('source manifest commit changed', x => { x.sourceManifest.source.commit = '0'.repeat(40); });
rejects('pinned source blob changed', x => { x.sourceManifest.artifacts.soldierInfoEndpoints.gitBlobSha1 = '0'.repeat(40); });
rejects('endpoint evidence digest changed', x => { x.sourceEvidenceSha256 = '0'.repeat(64); });
rejects('Skills_ID field missing', x => { delete x.sourceEvidence.records.find(r => r.ID === 115).Skills_ID; });
rejects('Skills_ID null differs from a missing field', x => { x.sourceEvidence.records.find(r => r.ID === 115).Skills_ID = null; });
rejects('raw reference array replaced by null', x => { x.canonical.records[0].rawReferenceIds = null; });
rejects('source reference omitted', x => { x.sourceEvidence.records.find(r => r.ID === 115).Skills_ID.pop(); });
rejects('source reference added', x => { x.sourceEvidence.records.find(r => r.ID === 115).Skills_ID.push(60676); });
rejects('source reference order changed', x => { x.sourceEvidence.records.find(r => r.ID === 115).Skills_ID.reverse(); });
rejects('reference value changed', x => { x.canonical.records[0].rawReferenceIds[0]++; });
rejects('reference type changed to string', x => { x.canonical.records[1].rawReferenceIds[0] = String(x.canonical.records[1].rawReferenceIds[0]); });
rejects('duplicate reference inserted', x => { x.sourceEvidence.records.find(r => r.ID === 5115).Skills_ID[1] = x.sourceEvidence.records.find(r => r.ID === 5115).Skills_ID[0]; });
rejects('out-of-scope Soldier added', x => { x.canonical.records.push(clone(x.canonical.records[0])); x.canonical.records[2].id = 118; });
rejects('duplicate Soldier canonical record', x => { x.canonical.records.push(clone(x.canonical.records[0])); });
rejects('extra Skill Target semantics rejected', x => { x.canonical.records[0].skillTargets = [60666]; });
rejects('extra Skill Effect semantics rejected', x => { x.canonical.records[0].skillEffects = []; });
rejects('game level interpretation rejected', x => { x.canonical.records[0].gameLevels = [1,2,3,4,5,6,7,8,9,10]; });
rejects('TrainingTech Skill JOIN rejected', x => { x.canonical.records[0].trainingTechSkillIds = [65110]; });
rejects('Soldier identity endpoint removed', x => { x.soldiers.records = x.soldiers.records.filter(r => r.id !== 115); });
rejects('SP-to-NORMAL relation changed', x => { x.relations.records.find(r => r.spSoldierId === 5115).normalSoldierId = 118; });
rejects('base stats population changed', x => { x.normalStats.records.pop(); });
rejects('raw growth stats scope changed', x => { x.rawGrowthStats.records.pop(); });
rejects('TrainingTech descriptions changed', x => { x.trainingDescriptions.records.pop(); });
rejects('TrainingTech costs changed', x => { x.trainingCosts.records.pop(); });
rejects('existing Skill Identity population changed', x => { x.skills.records.pop(); });
process.stdout.write(`Soldier raw Skills_ID negative tests: PASS (${checks} checks)\n`);
