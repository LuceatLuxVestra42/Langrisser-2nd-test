import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CANONICAL_PATH, SOURCE_EVIDENCE_PATH, SOURCE_MANIFEST_PATH, validateSoldierRawGrowthStats } from './validate-soldier-raw-growth-stats.mjs';

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
};
const clone = value => structuredClone(value);
let checks = 0;
function rejects(label, mutate) {
  const input = clone(fixture);
  mutate(input);
  assert.throws(() => validateSoldierRawGrowthStats(input), undefined, label);
  checks++;
}
assert.deepEqual(validateSoldierRawGrowthStats(fixture), { soldierRecordCount: 2, rawFieldCount: 8, sourceEvidenceCount: 112 });
checks++;
rejects('wrong Soldier ID', x => { x.canonical.records[0].id = 116; });
rejects('NORMAL/SP variant swapped', x => { x.canonical.records[1].variant = 'NORMAL'; });
rejects('explicit SP-to-NORMAL relation changed', x => { x.relations.records = x.relations.records.filter(r => r.spSoldierId !== 5115); });
rejects('source record ID mislinked', x => { x.canonical.records[0].provenance.sourceRecord = 'wrong#ID=116'; });
rejects('_UP field omitted', x => { delete x.canonical.records[0].rawFields.HP_UP; });
rejects('_UP value changed', x => { x.canonical.records[0].rawFields.AT_UP++; });
rejects('_UP type changed to string', x => { x.canonical.records[1].rawFields.DF_UP = '23'; });
rejects('canonical null is distinct from absence', x => { x.canonical.records[0].rawFields.HP_UP = null; });
rejects('source field absence rejected', x => { delete x.sourceEvidence.records.find(r => r.ID === 115).HP_UP; });
rejects('source null is distinct from absence', x => { x.sourceEvidence.records.find(r => r.ID === 115).HP_UP = null; });
rejects('zero default substitution rejected', x => { x.canonical.records[1].rawFields.MagicDF_UP = 0; });
rejects('fractional source number rejected', x => { x.sourceEvidence.records.find(r => r.ID === 5115).AT_UP = 40.5; });
rejects('extra Soldier record rejected', x => { x.canonical.records.push(clone(x.canonical.records[0])); });
rejects('duplicate Soldier ID rejected', x => { x.canonical.records[1].id = 115; });
rejects('out-of-scope Soldier rejected', x => { x.canonical.records[1].id = 118; });
rejects('field provenance changed', x => { x.canonical.records[0].provenance.fields.HP_UP = 'ID=115/AT_UP'; });
rejects('source record evidence digest changed', x => { x.sourceEvidenceSha256 = '0'.repeat(64); });
rejects('pinned source anchor changed', x => { x.sourceManifest.artifacts.soldierInfoEndpoints.sha256 = '0'.repeat(64); });
rejects('growth formula leaked into canonical', x => { x.canonical.records[0].growthPerLevel = 1; });
rejects('existing base stats changed', x => { x.normalStats.records.find(r => r.id === 115).baseStats.hp++; });
rejects('existing Soldier identity changed', x => { x.soldiers.records = x.soldiers.records.filter(r => r.id !== 5115); });
process.stdout.write(`Soldier raw growth stats negative tests: PASS (${checks} checks)\n`);
