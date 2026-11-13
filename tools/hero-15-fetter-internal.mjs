import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

export const OUTPUT = 'generated/hero-15-fetter-internal.v1.json';
const PATHS = {
  references: 'canonical/hero-fetter-references.v1.json',
  fetterDetails: 'canonical/hero-fetter-raw-details.v1.json',
  heartDetails: 'canonical/hero-heart-fetter-raw-details.v1.json',
  skillReferences: 'canonical/hero-fetter-skill-references.v1.json',
  skills: 'canonical/skills.v1.json',
  materials: 'canonical/hero-fetter-material-relations.v1.json',
  rewards: 'canonical/hero-fetter-reward-type-references.v1.json',
  conditions: 'canonical/hero-fetter-condition-type-references.v1.json',
  heartConditions: 'canonical/hero-heart-fetter-raw-conditions.v1.json',
};
const SCOPE = 'Internal Hero 15 Fetter and separately scoped Heart Fetter projection from admitted Canonicals; no completion, unlock, reward payout, cost execution, skill availability, combat, or publication semantics.';
const LIMITATIONS = [
  'Fetter CompletionConditions and Heart Fetter UnlockConditions remain raw source fields; predicate evaluation and AND/OR grouping are not admitted.',
  'Reward GoodsType, Count, condition type codes, material rows, and LevelUpGold remain source/reference projections; no payout, consumption, deduction, or cost semantics are admitted.',
  'Fetter Skill references identify source level locators only; they do not establish acquisition, equipability, activation, or combat effects.',
  'Heart Fetter ConditionType=7 raw skill-condition claims remain MANUAL_REVIEW and are not interpreted.',
  'Casting Law PropertyN_ID relations are outside this Consumer and remain unjoined.',
  'This internal Consumer does not approve Korean localization, frontend use, publication, or runtime behavior.',
];

const readJson = async (root, path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
export async function loadInputs(root = process.cwd()) {
  const entries = await Promise.all(Object.entries(PATHS).map(async ([key, path]) => [key, await readJson(root, path)]));
  return Object.fromEntries(entries);
}
const clone = (value) => structuredClone(value);
const exactKeys = (value, keys, label) => {
  assert(value && typeof value === 'object' && !Array.isArray(value), `${label} must be an object`);
  assert(isDeepStrictEqual(Object.keys(value).sort(), [...keys].sort()), `${label} fields drift`);
};
const counts = (rows, field) => Object.fromEntries([...new Set(rows.map((row) => row[field]))].map((key) => [key, rows.filter((row) => row[field] === key).length]));

function validateInputs(input) {
  const { references, fetterDetails, heartDetails, skillReferences, skills, materials, rewards, conditions, heartConditions } = input;
  for (const [key, value] of Object.entries(input)) {
    assert.equal(value.schemaVersion, 1, `${key} Canonical schema version drift`);
  }
  assert.equal(references.records.length, 6, 'Hero 15 Fetter reference population drift');
  assert.equal(references.records.filter((row) => row.referenceKind === 'HERO_FETTER_ID_REFERENCE').length, 5);
  assert.equal(references.records.filter((row) => row.referenceKind === 'HERO_HEART_FETTER_ID_REFERENCE').length, 1);
  assert(references.records.every((row) => row.heroId === 15 && row.heroInformationId === 15), 'Reference outside Hero 15 scope');
  assert.equal(fetterDetails.records.length, 5, 'Regular Fetter raw detail population drift');
  assert.equal(heartDetails.records.length, 1, 'Heart Fetter raw detail population drift');
  assert.equal(skillReferences.records.length, 54, 'Fetter Skill reference population drift');
  assert.deepEqual(counts(skillReferences.records, 'trackKind'), { REGULAR_FETTER: 45, HEART_FETTER: 9 });
  assert.equal(materials.materials.length, 104, 'Fetter material relation population drift');
  assert.deepEqual(counts(materials.materials, 'endpointKind'), { FETTER: 86, HEART_FETTER: 18 });
  assert.equal(materials.goldLocators.length, 54, 'Fetter gold locator population drift');
  assert.deepEqual(counts(materials.goldLocators, 'endpointKind'), { FETTER: 45, HEART_FETTER: 9 });
  assert.equal(materials.itemEndpoints.length, 18, 'Material Item endpoint population drift');
  assert.equal(rewards.records.length, 5, 'Fetter reward type reference population drift');
  assert.equal(conditions.records.length, 11, 'Fetter condition type reference population drift');
  assert.deepEqual(counts(conditions.records, 'trackKind'), { REGULAR_FETTER: 9, HEART_FETTER: 2 });
  assert.equal(heartConditions.records.length, 4, 'Heart Fetter raw condition population drift');
  assert(heartConditions.records.every((row) => row.heroId === 15 && row.heartFetterId === 15
    && row.conditions.every((condition) => condition.conditionType === 7)), 'Heart Fetter unresolved condition scope drift');
  assert.equal(skills.records.length, 108, 'Skill Identity Canonical population drift');

  for (const [label, rows] of [
    ['Skill reference', skillReferences.records],
    ['Material relation', materials.materials],
    ['Gold locator', materials.goldLocators],
    ['Reward type reference', rewards.records],
    ['Condition type reference', conditions.records],
    ['Heart condition', heartConditions.records],
  ]) assert(rows.every((row) => row.heroId === 15), `${label} outside Hero 15 scope`);

  const refKeys = new Set(references.records.map((row) => `${row.referenceKind}:${row.fetterId ?? row.heartFetterId}`));
  assert.equal(refKeys.size, references.records.length, 'Duplicate Fetter reference identity');
  const regularIds = references.records.filter((row) => row.referenceKind === 'HERO_FETTER_ID_REFERENCE').map((row) => row.fetterId);
  const regularDetailIds = fetterDetails.records.map((row) => row.endpointId);
  assert.deepEqual([...regularDetailIds].sort((a, b) => a - b), [...regularIds].sort((a, b) => a - b), 'Regular Fetter raw detail endpoint set differs from approved references');
  assert.equal(heartDetails.records[0].endpointId, references.records.find((row) => row.referenceKind === 'HERO_HEART_FETTER_ID_REFERENCE').heartFetterId);

  const identities = new Map();
  const selectedSkillIds = new Set(skillReferences.records.map((row) => row.skillId));
  assert.equal(selectedSkillIds.size, 54, 'Duplicate Fetter Skill Identity endpoint');
  for (const skillId of selectedSkillIds) {
    const matches = skills.records.filter((row) => row.skillId === skillId);
    assert.equal(matches.length, 1, `Skill Identity ${skillId} missing or duplicated`);
    const row = matches[0];
    exactKeys(row, ['skillId', 'nameCn', 'descriptionCn', 'provenance'], `Skill Identity ${skillId}`);
    assert.equal(typeof row.nameCn, 'string');
    assert.equal(typeof row.descriptionCn, 'string');
    identities.set(skillId, row);
  }
  const itemIds = materials.itemEndpoints.map((row) => row.itemId);
  const itemKeys = materials.itemEndpoints.map((row) => `${row.itemType}:${row.itemId}`);
  assert.equal(new Set(itemKeys).size, itemKeys.length, 'Duplicate Item type/ID endpoint identity');
  for (const row of materials.materials) {
    const matches = materials.itemEndpoints.filter((item) => item.itemType === row.itemType && item.itemId === row.itemId);
    assert.equal(matches.length, 1, `Material Item endpoint ${row.itemType}:${row.itemId} missing or duplicated`);
  }
  return identities;
}

function generationProjection(input) {
  const identities = validateInputs(input);
  const { references, fetterDetails, heartDetails, skillReferences, materials, rewards, conditions, heartConditions } = input;
  const attachSkills = (rows) => rows.map((reference) => ({
    reference: clone(reference),
    skillIdentity: clone(identities.get(reference.skillId)),
  }));
  const attachMaterials = (rows) => ({
    relations: rows.map((relation) => ({
      ...clone(relation),
      itemEndpoint: clone(materials.itemEndpoints.find((item) => item.itemType === relation.itemType && item.itemId === relation.itemId)),
    })),
  });
  const fetters = references.records.filter((row) => row.referenceKind === 'HERO_FETTER_ID_REFERENCE').map((reference) => {
    const id = reference.fetterId;
    const detail = fetterDetails.records.find((row) => row.endpointId === id);
    if (!detail) throw new Error(`Missing raw Fetter detail ${id}`);
    return {
      reference: clone(reference),
      rawDetail: clone(detail),
      skillReferences: attachSkills(skillReferences.records.filter((row) => row.trackKind === 'REGULAR_FETTER' && row.trackEndpointId === id)),
      materials: attachMaterials(materials.materials.filter((row) => row.endpointKind === 'FETTER' && row.endpointId === id)),
      goldLocators: clone(materials.goldLocators.filter((row) => row.endpointKind === 'FETTER' && row.endpointId === id)),
      rewardTypeReferences: clone(rewards.records.filter((row) => row.fetterEndpointId === id)),
      conditionTypeReferences: clone(conditions.records.filter((row) => row.trackKind === 'REGULAR_FETTER' && row.trackEndpointId === id)),
    };
  });
  const heartReference = references.records.find((row) => row.referenceKind === 'HERO_HEART_FETTER_ID_REFERENCE');
  const heartId = heartReference.heartFetterId;
  const heartDetail = heartDetails.records.find((row) => row.endpointId === heartId);
  if (!heartDetail) throw new Error(`Missing Heart Fetter raw detail ${heartId}`);
  const heartFetter = {
    reference: clone(heartReference),
    rawDetail: clone(heartDetail),
    skillReferences: attachSkills(skillReferences.records.filter((row) => row.trackKind === 'HEART_FETTER' && row.trackEndpointId === heartId)),
    materials: attachMaterials(materials.materials.filter((row) => row.endpointKind === 'HEART_FETTER' && row.endpointId === heartId)),
    goldLocators: clone(materials.goldLocators.filter((row) => row.endpointKind === 'HEART_FETTER' && row.endpointId === heartId)),
    conditionTypeReferences: clone(conditions.records.filter((row) => row.trackKind === 'HEART_FETTER' && row.trackEndpointId === heartId)),
    rawSkillConditions: { meaningStatus: 'MANUAL_REVIEW', records: clone(heartConditions.records) },
  };
  return { schemaVersion: 1, scope: SCOPE, heroId: 15, limitations: [...LIMITATIONS], fetters, heartFetter };
}

// The validator builds expected rows directly from Canonical inputs; it does not call generationProjection.
export function validateFetterInternalProjection(input, generatedText) {
  validateInputs(input);
  const actual = JSON.parse(generatedText);
  exactKeys(actual, ['schemaVersion', 'scope', 'heroId', 'limitations', 'fetters', 'heartFetter'], 'Generated Fetter Consumer');
  assert.equal(actual.schemaVersion, 1);
  assert.equal(actual.scope, SCOPE);
  assert.equal(actual.heroId, 15);
  assert(isDeepStrictEqual(actual.limitations, LIMITATIONS), 'Generated Fetter limitations drift');

  const refs = input.references.records;
  const regularExpected = refs.filter((row) => row.referenceKind === 'HERO_FETTER_ID_REFERENCE').map((reference) => {
    const id = reference.fetterId;
    const details = input.fetterDetails.records.filter((row) => row.endpointId === id);
    assert.equal(details.length, 1, `Raw Fetter detail ${id} missing or duplicated`);
    const skillRows = input.skillReferences.records.filter((row) => row.trackKind === 'REGULAR_FETTER' && row.trackEndpointId === id);
    const skillLinks = skillRows.map((referenceRow) => {
      const identityRows = input.skills.records.filter((row) => row.skillId === referenceRow.skillId);
      assert.equal(identityRows.length, 1, `Skill Identity ${referenceRow.skillId} missing or duplicated`);
      return { reference: clone(referenceRow), skillIdentity: clone(identityRows[0]) };
    });
    const relationRows = input.materials.materials.filter((row) => row.endpointKind === 'FETTER' && row.endpointId === id);
    const linkedMaterials = relationRows.map((relation) => {
      const endpoints = input.materials.itemEndpoints.filter((row) => row.itemType === relation.itemType && row.itemId === relation.itemId);
      assert.equal(endpoints.length, 1, `Item endpoint ${relation.itemId} missing or duplicated`);
      return { ...clone(relation), itemEndpoint: clone(endpoints[0]) };
    });
    return {
      reference: clone(reference),
      rawDetail: clone(details[0]),
      skillReferences: skillLinks,
      materials: { relations: linkedMaterials },
      goldLocators: clone(input.materials.goldLocators.filter((row) => row.endpointKind === 'FETTER' && row.endpointId === id)),
      rewardTypeReferences: clone(input.rewards.records.filter((row) => row.fetterEndpointId === id)),
      conditionTypeReferences: clone(input.conditions.records.filter((row) => row.trackKind === 'REGULAR_FETTER' && row.trackEndpointId === id)),
    };
  });
  const heartRefRows = refs.filter((row) => row.referenceKind === 'HERO_HEART_FETTER_ID_REFERENCE');
  assert.equal(heartRefRows.length, 1, 'Heart Fetter reference missing or duplicated');
  const heartRef = heartRefRows[0];
  const heartDetails = input.heartDetails.records.filter((row) => row.endpointId === heartRef.heartFetterId);
  assert.equal(heartDetails.length, 1, 'Heart Fetter raw detail missing or duplicated');
  const heartSkillLinks = input.skillReferences.records.filter((row) => row.trackKind === 'HEART_FETTER' && row.trackEndpointId === heartRef.heartFetterId).map((referenceRow) => {
    const identityRows = input.skills.records.filter((row) => row.skillId === referenceRow.skillId);
    assert.equal(identityRows.length, 1, `Heart Fetter Skill Identity ${referenceRow.skillId} missing or duplicated`);
    return { reference: clone(referenceRow), skillIdentity: clone(identityRows[0]) };
  });
  const heartMaterialRelations = input.materials.materials.filter((row) => row.endpointKind === 'HEART_FETTER' && row.endpointId === heartRef.heartFetterId).map((relation) => {
    const endpoints = input.materials.itemEndpoints.filter((row) => row.itemType === relation.itemType && row.itemId === relation.itemId);
    assert.equal(endpoints.length, 1, `Heart Fetter Item endpoint ${relation.itemId} missing or duplicated`);
    return { ...clone(relation), itemEndpoint: clone(endpoints[0]) };
  });
  const unresolvedConditions = input.heartConditions.records;
  assert(unresolvedConditions.every((row) => row.conditions.every((condition) => condition.conditionType === 7)), 'Unexpected Heart Fetter raw condition type');
  const expectedHeart = {
    reference: clone(heartRef),
    rawDetail: clone(heartDetails[0]),
    skillReferences: heartSkillLinks,
    materials: { relations: heartMaterialRelations },
    goldLocators: clone(input.materials.goldLocators.filter((row) => row.endpointKind === 'HEART_FETTER' && row.endpointId === heartRef.heartFetterId)),
    conditionTypeReferences: clone(input.conditions.records.filter((row) => row.trackKind === 'HEART_FETTER' && row.trackEndpointId === heartRef.heartFetterId)),
    rawSkillConditions: { meaningStatus: 'MANUAL_REVIEW', records: clone(unresolvedConditions) },
  };
  assert.equal(actual.fetters.length, 5, 'Generated regular Fetter count drift');
  assert(isDeepStrictEqual(actual.fetters, regularExpected), 'Generated Fetter fields differ from independent Canonical projection');
  assert(isDeepStrictEqual(actual.heartFetter, expectedHeart), 'Generated Heart Fetter fields differ from independent Canonical projection');
  assert.equal(generatedText, `${JSON.stringify(actual, null, 2)}\n`, 'Generated Fetter serialization is not deterministic');
}

export async function generateHero15FetterInternal(root = process.cwd()) {
  const input = await loadInputs(root);
  validateInputs(input);
  const text = `${JSON.stringify(generationProjection(input), null, 2)}\n`;
  await writeFile(resolve(root, OUTPUT), text, 'utf8');
  return text;
}

export async function validateHero15FetterInternal(root = process.cwd()) {
  const [input, generatedText] = await Promise.all([loadInputs(root), readFile(resolve(root, OUTPUT), 'utf8')]);
  validateFetterInternalProjection(input, generatedText);
  console.log('Hero 15 Fetter internal Consumer: PASS (5 regular Fetters, separate Heart Fetter, approved Canonical endpoints)');
}
