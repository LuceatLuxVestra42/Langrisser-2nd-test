import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateHeroExclusiveEquipmentRelations } from './validate-hero-exclusive-equipment-relations.mjs';

const read = async (path) => JSON.parse(await readFile(path, 'utf8'));
const [heroes, equipment, canonical, evidence] = await Promise.all([
  read('canonical/hero-identities.v1.json'),
  read('canonical/exclusive-equipment.v1.json'),
  read('canonical/hero-exclusive-equipment-relations.v1.json'),
  read('evidence/source/configdata/hero-exclusive-equipment-skill-hero.v1.json')
]);
const baseline = validateHeroExclusiveEquipmentRelations({ heroes, equipment, canonical, evidence });
assert.deepEqual(baseline, {
  edges: 167,
  uniqueHeroIds: 167,
  uniqueEquipmentIds: 167,
  duplicatePairs: 0,
  multiOwnerEquipment: 0,
  heroesWithMultipleExclusive: 0
});

function fails(label, mutate, expected) {
  const docs = structuredClone({ heroes, equipment, canonical, evidence });
  mutate(docs);
  assert.throws(
    () => validateHeroExclusiveEquipmentRelations(docs),
    expected,
    label
  );
}

fails('unknown heroId', (d) => {
  d.canonical.records[0].heroId = 999999;
  d.evidence.records[0].heroId = 999999;
  d.evidence.records[0].value = 999999;
  d.canonical.records[0].provenance[0].value = 999999;
}, /unknown heroId/);

fails('unknown equipmentId', (d) => {
  d.canonical.records[0].equipmentId = 999999;
  d.evidence.records[0].equipmentId = 999999;
  d.evidence.records[0].recordId = 999999;
  d.canonical.records[0].provenance[0].recordId = 999999;
}, /unknown equipmentId/);

fails('missing equipment edge', (d) => {
  d.canonical.records.pop();
  d.evidence.records.pop();
  d.evidence.recordCount -= 1;
}, /count drift|exactly 167/);

fails('duplicate pair', (d) => {
  d.canonical.records.push(structuredClone(d.canonical.records[0]));
}, /duplicate canonical relation pair/);

fails('equipment with second owner', (d) => {
  const canonicalRow = d.canonical.records[1];
  const evidenceRow = d.evidence.records[1];
  canonicalRow.equipmentId = d.canonical.records[0].equipmentId;
  evidenceRow.equipmentId = d.evidence.records[0].equipmentId;
  evidenceRow.recordId = evidenceRow.equipmentId;
  canonicalRow.provenance[0].recordId = evidenceRow.equipmentId;
}, /equipmentId maps to multiple owner Heroes/);

fails('Hero with second current Exclusive Equipment', (d) => {
  d.canonical.records[1].heroId = d.canonical.records[0].heroId;
  d.evidence.records[1].heroId = d.evidence.records[0].heroId;
  d.evidence.records[1].value = d.evidence.records[1].heroId;
  d.canonical.records[1].provenance[0].value = d.canonical.records[1].heroId;
}, /Hero maps to multiple current Exclusive Equipment/);

fails('malformed endpoint', (d) => {
  d.canonical.records[0].heroId = '1';
  d.evidence.records[0].heroId = '1';
  d.evidence.records[0].value = '1';
  d.canonical.records[0].provenance[0].value = '1';
}, /malformed evidence endpoint/);

fails('provenance sourceKind mismatch', (d) => {
  d.evidence.records[0].sourceKind = 'DESCRIPTION_OWNER_NAME';
  d.canonical.records[0].provenance[0].sourceKind = 'DESCRIPTION_OWNER_NAME';
}, /unsupported or heuristic relation source kind/);

fails('provenance recordId mismatch', (d) => {
  d.canonical.records[0].provenance[0].recordId += 1;
}, /canonical SkillHero provenance mismatch/);

fails('provenance SkillHero value mismatch', (d) => {
  d.evidence.records[0].value += 1;
  d.canonical.records[0].provenance[0].value += 1;
}, /SkillHero value must equal canonical heroId/);

fails('unsupported canonical field', (d) => {
  d.canonical.records[0].heroName = 'must not be admitted';
}, /unsupported or missing fields/);

fails('Equipment localization leakage', (d) => {
  d.canonical.records[0].equipmentNameKo = 'must not be admitted';
}, /unsupported or missing fields/);

fails('Hero localization leakage', (d) => {
  d.evidence.records[0].heroNameKo = 'must not be admitted';
}, /unsupported or missing fields/);

process.stdout.write('Hero-Exclusive Equipment relation tests: PASS (endpoint, cardinality, provenance, duplicate, and boundary negatives)\\n');
