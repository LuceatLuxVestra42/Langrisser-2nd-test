import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

export const OUTPUT = 'generated/hero-15-skill-detail-internal.v1.json';
const REFERENCES = 'canonical/hero-skill-references.v1.json';
const SKILLS = 'canonical/skills.v1.json';
const SCOPE = 'Internal Hero 15 direct and JobLevel skill-reference detail projection only; no Korean localization, equipability, unlock, combat, or publication semantics.';
const LIMITATIONS = [
  'JOB_LEVEL_SKILL_ACQUISITION preserves the admitted source-reference kind and does not establish equipability, availability, or acquisition timing.',
  'Chinese Name and Desc are preserved as source text; no combat values, cooldowns, range, cost, or structured effects are derived.',
  'This internal projection does not approve Korean localization, publication, or runtime use.',
  'Only the nine ordinary Hero 15 references in hero-skill-references.v1.json are included; Talent, Awakening, Fetter, and Heart Fetter references are excluded.',
];

const readJson = async (root, path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
export async function loadInputs(root = process.cwd()) {
  const [references, skills] = await Promise.all([readJson(root, REFERENCES), readJson(root, SKILLS)]);
  return { references, skills };
}
const exactKeys = (value, keys, label) => {
  assert(value && typeof value === 'object' && !Array.isArray(value), `${label} must be an object`);
  assert(isDeepStrictEqual(Object.keys(value).sort(), [...keys].sort()), `${label} fields drift`);
};
const refKeys = (row) => row.referenceKind === 'HERO_DIRECT_SKILL_REFERENCE'
  ? ['referenceKind', 'heroId', 'skillId', 'sourceField', 'endpointNamespace', 'provenance']
  : row.referenceKind === 'JOB_LEVEL_SKILL_ACQUISITION'
    ? ['referenceKind', 'heroId', 'jobConnectionId', 'jobId', 'jobLevelId', 'skillId', 'sourceField', 'endpointNamespace', 'provenance']
    : null;

function validateCanonicalInputs(references, skills) {
  exactKeys(references, ['schemaVersion', 'scope', 'records'], 'Hero Skill Reference Canonical');
  assert.equal(references.schemaVersion, 1);
  assert.equal(references.scope, 'Hero 15 only: direct HeroInfo Skill_ID references and explicit JobLevelInfo GotSkill_ID acquisition references. No equipping, unlock condition, combat effect, or publication claim.');
  exactKeys(skills, ['schemaVersion', 'sourceScope', 'scope', 'records'], 'Skill Identity Canonical');
  assert.equal(skills.schemaVersion, 1);
  assert(Array.isArray(references.records) && references.records.length === 9, 'Expected exactly nine Hero 15 Skill references');
  assert(Array.isArray(skills.records), 'Skill Identity Canonical records must be an array');
  const referenceIdentities = new Set();
  const selectedSkillIds = new Set();
  for (const row of references.records) {
    const keys = refKeys(row);
    assert(keys, `Unsupported Skill reference kind ${row.referenceKind}`);
    exactKeys(row, keys, `Skill reference ${row.skillId}`);
    assert.equal(row.heroId, 15, 'Skill reference outside Hero 15 scope');
    assert(Number.isSafeInteger(row.skillId), 'Skill reference ID must be an integer');
    assert.equal(row.endpointNamespace, 'ConfigDataSkillInfo.ID');
    assert(typeof row.sourceField === 'string' && row.sourceField.length > 0);
    exactKeys(row.provenance, ['reference', 'endpoint'], `Skill reference provenance ${row.skillId}`);
    assert(Object.values(row.provenance).every((value) => typeof value === 'string' && value.length > 0));
    const identity = JSON.stringify([row.referenceKind, row.heroId, row.jobConnectionId ?? null, row.jobId ?? null, row.jobLevelId ?? null, row.skillId]);
    assert(!referenceIdentities.has(identity), `Duplicate Skill reference identity ${identity}`);
    referenceIdentities.add(identity);
    selectedSkillIds.add(row.skillId);
  }
  assert.equal(selectedSkillIds.size, 9, 'Expected nine distinct Skill Identity endpoints');
  for (const skillId of selectedSkillIds) {
    const matches = skills.records.filter((row) => row.skillId === skillId);
    assert.equal(matches.length, 1, `Skill Identity endpoint ${skillId} is missing or duplicated`);
    const identity = matches[0];
    exactKeys(identity, ['skillId', 'nameCn', 'descriptionCn', 'provenance'], `Skill Identity ${skillId}`);
    assert.equal(identity.skillId, skillId);
    assert(typeof identity.nameCn === 'string' && typeof identity.descriptionCn === 'string');
    exactKeys(identity.provenance, ['identity', 'name', 'description'], `Skill Identity provenance ${skillId}`);
    assert(Object.values(identity.provenance).every((value) => typeof value === 'string' && value.length > 0));
  }
}

function generationProjection(references, skills) {
  const byId = new Map(skills.records.map((row) => [row.skillId, row]));
  const records = references.records.map((reference) => {
    const identity = byId.get(reference.skillId);
    if (!identity) throw new Error(`Missing Skill Identity ${reference.skillId}`);
    return {
      ...structuredClone(reference),
      skillIdentity: {
        skillId: identity.skillId,
        nameCn: identity.nameCn,
        descriptionCn: identity.descriptionCn,
        provenance: structuredClone(identity.provenance),
      },
    };
  });
  return { schemaVersion: 1, scope: SCOPE, heroId: 15, limitations: [...LIMITATIONS], references: records };
}

// This verification path independently rebuilds the expectation from the two Canonicals.
// It intentionally does not call generationProjection or read Generated values as expected input.
export function validateSkillDetailProjection(references, skills, generatedText) {
  validateCanonicalInputs(references, skills);
  const generated = JSON.parse(generatedText);
  exactKeys(generated, ['schemaVersion', 'scope', 'heroId', 'limitations', 'references'], 'Generated Skill Detail Consumer');
  assert.equal(generated.schemaVersion, 1);
  assert.equal(generated.scope, SCOPE);
  assert.equal(generated.heroId, 15);
  assert(isDeepStrictEqual(generated.limitations, LIMITATIONS), 'Generated limitations drift');

  const expectedReferences = references.records.map((canonicalReference) => {
    const identityRows = skills.records.filter((row) => row.skillId === canonicalReference.skillId);
    assert.equal(identityRows.length, 1, `Skill Identity ${canonicalReference.skillId} is missing or duplicated`);
    const identity = identityRows[0];
    const expected = {
      referenceKind: canonicalReference.referenceKind,
      heroId: canonicalReference.heroId,
      skillId: canonicalReference.skillId,
    };
    for (const key of ['jobConnectionId', 'jobId', 'jobLevelId']) {
      if (Object.hasOwn(canonicalReference, key)) expected[key] = canonicalReference[key];
    }
    expected.sourceField = canonicalReference.sourceField;
    expected.endpointNamespace = canonicalReference.endpointNamespace;
    expected.provenance = {
      reference: canonicalReference.provenance.reference,
      endpoint: canonicalReference.provenance.endpoint,
    };
    expected.skillIdentity = {
      skillId: identity.skillId,
      nameCn: identity.nameCn,
      descriptionCn: identity.descriptionCn,
      provenance: {
        identity: identity.provenance.identity,
        name: identity.provenance.name,
        description: identity.provenance.description,
      },
    };
    return expected;
  });
  assert.equal(generated.references.length, 9, 'Generated reference population must be nine');
  assert(isDeepStrictEqual(generated.references, expectedReferences), 'Generated fields differ from independent Canonical projection');
  assert.equal(generatedText, `${JSON.stringify(generated, null, 2)}\n`, 'Generated serialization is not deterministic');
}

export async function generateHero15SkillDetailInternal(root = process.cwd()) {
  const { references, skills } = await loadInputs(root);
  validateCanonicalInputs(references, skills);
  const generatedText = `${JSON.stringify(generationProjection(references, skills), null, 2)}\n`;
  await writeFile(resolve(root, OUTPUT), generatedText, 'utf8');
  return generatedText;
}

export async function validateHero15SkillDetailInternal(root = process.cwd()) {
  const [{ references, skills }, generatedText] = await Promise.all([
    loadInputs(root), readFile(resolve(root, OUTPUT), 'utf8'),
  ]);
  validateSkillDetailProjection(references, skills, generatedText);
  console.log('Hero 15 Skill Detail internal Consumer: PASS (9 Canonical references and 9 Skill Identity endpoints)');
}
