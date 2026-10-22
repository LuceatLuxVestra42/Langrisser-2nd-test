import fs from 'node:fs';
import { validate } from './validate-soldier-training-tech-descriptions.mjs';

const evidence = JSON.parse(fs.readFileSync('evidence/source/configdata/soldier-training-tech-223-descriptions.v1.json', 'utf8'));
const canonical = JSON.parse(fs.readFileSync('canonical/soldier-training-tech-descriptions.v1.json', 'utf8'));
const soldiers = JSON.parse(fs.readFileSync('canonical/soldiers.v1.json', 'utf8'));
const spRelations = JSON.parse(fs.readFileSync('canonical/sp-soldier-normal-relations.v1.json', 'utf8'));

function mustReject(label, mutate, target = 'canonical') {
  const e = structuredClone(evidence);
  const c = structuredClone(canonical);
  const s = structuredClone(soldiers);
  const r = structuredClone(spRelations);
  mutate(target === 'evidence' ? e : c);
  let rejected = false;
  try { validate(e, c, s, r); } catch { rejected = true; }
  if (!rejected) throw new Error(`Negative case unexpectedly passed: ${label}`);
}

const result = validate(evidence, canonical, soldiers, spRelations);
if (result.canonicalClaimCount !== 20 || result.levelInfoCount !== 10) throw new Error('Unexpected valid claim population');
mustReject('duplicate description claim', c => c.records.push(structuredClone(c.records[0])));
mustReject('unapproved LevelInfo endpoint', c => { c.records[0].levelInfoId = 9999; });
mustReject('description does not match evidence', c => { c.records[0].descriptionCn += ' '; });
mustReject('NORMAL/SP source-field crosswire', c => { c.records[10].descriptionCn = c.records[0].descriptionCn; });
mustReject('unapproved Soldier endpoint', c => { c.records[0].soldierId = 1150; });
mustReject('unapproved TrainingTech endpoint', c => { c.records[0].trainingTechId = 224; });
mustReject('unprovenanced LevelInfo link', c => { c.records[0].provenance.levelInfoLink = 'generated/output.json#level=1'; });
mustReject('SP output slot promoted into canonical', c => { c.records[10].slot = 1; });
mustReject('SP game level promoted into canonical', c => { c.records[10].level = 1; });
mustReject('combat semantic added', c => { c.records[0].combatEffect = 'inferred'; });
mustReject('soldier skill relation added', c => { c.records[0].soldierSkillId = 65110; });
mustReject('raw source slice changed without reviewed re-verification', e => { e.rawLevelInfoRecords[0].Description += ' '; }, 'evidence');
mustReject('unscoped Source Relation expanded', e => { e.rawTrainingTechRecord.SoldierIDRelated.push(1150); }, 'evidence');
console.log(`Soldier TrainingTech description validator negatives PASS (13 cases).`);
