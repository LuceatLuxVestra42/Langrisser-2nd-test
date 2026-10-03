import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const CANONICAL_PATH = 'canonical/hero-exclusive-equipment-relations.v1.json';
const EVIDENCE_PATH = 'evidence/source/configdata/hero-exclusive-equipment-skill-hero.v1.json';
const HERO_PATH = 'canonical/hero-identities.v1.json';
const EQUIPMENT_PATH = 'canonical/exclusive-equipment.v1.json';
const SOURCE_AUTHORITY = {
  "predecessorRepository": "LuceatLuxVestra42/langrisser-future-guide",
  "predecessorRef": "main",
  "predecessorHead": "57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff",
  "sourceContractPath": "data/contracts/hero-exclusive-equipment-relation-source-contract.v1.json",
  "sourceContractBlobSha": "919a8dd678e72646dba53c1b26fcf2acc0cb3ab8",
  "relationArtifactPath": "data/generated/hero-exclusive-equipment-relations.v1.json",
  "relationArtifactBlobSha": "33caa16212a5a71195015e05c815024fb62e6be6",
  "finalValidationPath": "data/validation/hero-exclusive-equipment-relation-stageB-final.v1.json",
  "finalValidationBlobSha": "ff3b0a8b1c7a9b364f4c638f0a1110aa3d7626ee",
  "relationStatus": "COMPLETE",
  "finalValidationStatus": "PASS_ACCEPTED",
  "productionSourceKind": "EQUIPMENT_SKILL_HERO",
  "sourceTable": "ConfigDataEquipmentInfo",
  "sourceField": "SkillHero",
  "nativeDirection": "equipmentId -> heroId",
  "semantic": "exclusive equipmentId -> ConfigDataEquipmentInfo.ID exact equality -> ConfigDataEquipmentInfo.SkillHero -> canonical heroId exact equality",
  "relationRecordCount": 167,
  "uniqueEquipmentIdCount": 167,
  "uniqueHeroIdCount": 167
};
const check = (ok, message) => { if (!ok) throw new Error('Hero-Exclusive Equipment relation validation failed: ' + message); };
const exactKeys = (value, keys, label) => {
  check(value !== null && typeof value === 'object' && !Array.isArray(value), label + ' must be an object');
  check(isDeepStrictEqual(Object.keys(value).sort(), [...keys].sort()), label + ' has unsupported or missing fields');
};
const validId = (value) => Number.isSafeInteger(value) && value > 0;
const pairKey = (heroId, equipmentId) => heroId + ':' + equipmentId;

export function validateHeroExclusiveEquipmentRelations({ heroes, equipment, canonical, evidence }) {
  exactKeys(heroes, ['schemaVersion', 'scope', 'records'], 'Hero identity owner');
  check(heroes.schemaVersion === 1 && Array.isArray(heroes.records), 'Hero identity owner schema drift');
  exactKeys(equipment, ['schemaVersion', 'evidenceClass', 'responsibility', 'claim', 'scope', 'provenance', 'limitations', 'records'], 'Exclusive Equipment identity owner');
  check(equipment.schemaVersion === 1 && Array.isArray(equipment.records), 'Exclusive Equipment identity owner schema drift');
  exactKeys(canonical, ['schemaVersion', 'scope', 'records'], 'relation canonical');
  check(canonical.schemaVersion === 1
    && canonical.scope === 'Current Hero to Exclusive Equipment ownership relations from the frozen ConfigDataEquipmentInfo.SkillHero source.'
    && Array.isArray(canonical.records), 'relation canonical schema or scope drift');
  exactKeys(evidence, ['schemaVersion', 'sourceAuthority', 'recordCount', 'records'], 'relation evidence');
  check(evidence.schemaVersion === 1 && evidence.recordCount === 167 && Array.isArray(evidence.records), 'relation evidence schema or count drift');
  exactKeys(evidence.sourceAuthority, Object.keys(SOURCE_AUTHORITY), 'relation source authority');
  check(isDeepStrictEqual(evidence.sourceAuthority, SOURCE_AUTHORITY), 'frozen predecessor source authority pin drift');

  const heroIds = new Set();
  for (const row of heroes.records) {
    exactKeys(row, ['heroId', 'provenance'], 'Hero identity record');
    check(validId(row.heroId) && !heroIds.has(row.heroId), 'malformed or duplicate Hero identity ID');
    heroIds.add(row.heroId);
  }
  check(heroIds.size === 267, 'Hero identity owner must contain 267 unique playable Hero IDs');

  const equipmentIds = new Set();
  for (const row of equipment.records) {
    exactKeys(row, ['equipmentId'], 'Exclusive Equipment identity record');
    check(validId(row.equipmentId) && !equipmentIds.has(row.equipmentId), 'malformed or duplicate Exclusive Equipment ID');
    equipmentIds.add(row.equipmentId);
  }
  check(equipmentIds.size === 167, 'Exclusive Equipment identity owner must contain 167 unique Equipment IDs');

  const evidenceByPair = new Map();
  const evidenceEquipmentOwners = new Map();
  const evidenceHeroEquipment = new Map();
  for (const row of evidence.records) {
    exactKeys(row, ['heroId', 'equipmentId', 'sourceKind', 'table', 'recordId', 'field', 'value'], 'SkillHero evidence record');
    check(validId(row.heroId) && validId(row.equipmentId), 'malformed evidence endpoint');
    check(row.sourceKind === 'EQUIPMENT_SKILL_HERO', 'unsupported or heuristic relation source kind');
    check(row.table === 'ConfigDataEquipmentInfo' && row.field === 'SkillHero', 'SkillHero evidence source table or field mismatch');
    check(row.recordId === row.equipmentId, 'source recordId must equal equipmentId');
    check(row.value === row.heroId, 'SkillHero value must equal canonical heroId');
    const key = pairKey(row.heroId, row.equipmentId);
    check(!evidenceByPair.has(key), 'duplicate evidence relation pair ' + key);
    evidenceByPair.set(key, row);
    if (!evidenceEquipmentOwners.has(row.equipmentId)) evidenceEquipmentOwners.set(row.equipmentId, new Set());
    evidenceEquipmentOwners.get(row.equipmentId).add(row.heroId);
    if (!evidenceHeroEquipment.has(row.heroId)) evidenceHeroEquipment.set(row.heroId, new Set());
    evidenceHeroEquipment.get(row.heroId).add(row.equipmentId);
  }
  check(evidence.records.length === 167 && evidenceByPair.size === 167, 'evidence must contain exactly 167 unique relation pairs');
  check([...evidenceEquipmentOwners.values()].every((owners) => owners.size === 1), 'an equipmentId maps to multiple owner Heroes');
  check([...evidenceHeroEquipment.values()].every((items) => items.size <= 1), 'a Hero maps to multiple current Exclusive Equipment');
  check([...evidenceEquipmentOwners.keys()].every((id) => equipmentIds.has(id)), 'evidence contains an unknown equipmentId');
  check([...equipmentIds].every((id) => evidenceEquipmentOwners.has(id)), 'an Exclusive Equipment identity has no relation edge');
  check([...evidenceHeroEquipment.keys()].every((id) => heroIds.has(id)), 'evidence contains an unknown heroId');
  check(evidenceHeroEquipment.size === 167, 'relation owner Hero count must equal 167');

  const canonicalByPair = new Map();
  const canonicalEquipmentOwners = new Map();
  const canonicalHeroEquipment = new Map();
  for (const row of canonical.records) {
    exactKeys(row, ['heroId', 'equipmentId', 'provenance'], 'canonical relation record');
    check(validId(row.heroId) && validId(row.equipmentId), 'malformed canonical relation endpoint');
    check(heroIds.has(row.heroId), 'canonical relation has unknown heroId ' + row.heroId);
    check(equipmentIds.has(row.equipmentId), 'canonical relation has unknown equipmentId ' + row.equipmentId);
    const key = pairKey(row.heroId, row.equipmentId);
    check(!canonicalByPair.has(key), 'duplicate canonical relation pair ' + key);
    check(Array.isArray(row.provenance) && row.provenance.length === 1, 'each canonical relation must retain one source provenance record');
    exactKeys(row.provenance[0], ['sourceKind', 'table', 'recordId', 'field', 'value'], 'canonical relation provenance');
    check(row.provenance[0].sourceKind === 'EQUIPMENT_SKILL_HERO'
      && row.provenance[0].table === 'ConfigDataEquipmentInfo'
      && row.provenance[0].recordId === row.equipmentId
      && row.provenance[0].field === 'SkillHero'
      && row.provenance[0].value === row.heroId, 'canonical SkillHero provenance mismatch');
    const source = evidenceByPair.get(key);
    check(source && isDeepStrictEqual(row.provenance[0], {
      sourceKind: source.sourceKind, table: source.table, recordId: source.recordId, field: source.field, value: source.value
    }), 'canonical/evidence pair or provenance mismatch for ' + key);
    canonicalByPair.set(key, row);
    if (!canonicalEquipmentOwners.has(row.equipmentId)) canonicalEquipmentOwners.set(row.equipmentId, new Set());
    canonicalEquipmentOwners.get(row.equipmentId).add(row.heroId);
    if (!canonicalHeroEquipment.has(row.heroId)) canonicalHeroEquipment.set(row.heroId, new Set());
    canonicalHeroEquipment.get(row.heroId).add(row.equipmentId);
  }
  check(canonical.records.length === 167 && canonicalByPair.size === 167, 'canonical must contain exactly 167 unique relation pairs');
  check(canonicalByPair.size === evidenceByPair.size && [...evidenceByPair.keys()].every((key) => canonicalByPair.has(key)), 'canonical/evidence relation sets differ');
  check([...canonicalEquipmentOwners.values()].every((owners) => owners.size === 1), 'canonical equipmentId maps to multiple owner Heroes');
  check([...canonicalHeroEquipment.values()].every((items) => items.size <= 1), 'canonical Hero has multiple current Exclusive Equipment');
  check(canonicalHeroEquipment.size === 167 && canonicalEquipmentOwners.size === 167, 'canonical relation owner or equipment cardinality drift');

  return {
    edges: canonicalByPair.size,
    uniqueHeroIds: canonicalHeroEquipment.size,
    uniqueEquipmentIds: canonicalEquipmentOwners.size,
    duplicatePairs: 0,
    multiOwnerEquipment: 0,
    heroesWithMultipleExclusive: 0
  };
}

export async function loadAndValidateHeroExclusiveEquipmentRelations(root = process.cwd()) {
  const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
  const [heroes, equipment, canonical, evidence] = await Promise.all([
    readJson(HERO_PATH), readJson(EQUIPMENT_PATH), readJson(CANONICAL_PATH), readJson(EVIDENCE_PATH)
  ]);
  return validateHeroExclusiveEquipmentRelations({ heroes, equipment, canonical, evidence });
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const result = await loadAndValidateHeroExclusiveEquipmentRelations();
  process.stdout.write('Hero-Exclusive Equipment relations: PASS (' + result.edges + ' edges; ' + result.uniqueHeroIds + ' owner Heroes; ' + result.uniqueEquipmentIds + ' Equipment IDs; exact SkillHero evidence parity)\\n');
}
