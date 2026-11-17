import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const CANONICAL = 'canonical/hero-soldier-command-bond-contributions.v1.json';
export const EVIDENCE = 'evidence/source/configdata/hero-15-soldier-command-bond-contribution.v1.json';
const REFERENCES = 'canonical/hero-fetter-references.v1.json';
const FETTER_DETAILS = 'canonical/hero-fetter-raw-details.v1.json';
const HERO_IDENTITIES = 'canonical/hero-identities.v1.json';
const COMPONENTS = new Map([[93, 'hp'], [94, 'at'], [95, 'df'], [96, 'magicDf']]);
// Pins were calculated from verified Git blobs and their exact selected records.
const EVIDENCE_PINS = {
  source: 'b4b2026a111074ec06194c09d71434563c6ddfd5c640f214f92309bc076d642c',
  records: 'f99012bf57462db8c0c66299a29a2107152e38001c8d9a59d901845e68467dfa',
  propertyNamespace: 'e02faea30ce2d37063da08cf38e2a74c5685dee9be0bc85b65a5a781c302f1ef',
  predecessor: 'fe1a1487c0b5e31b2d6a4c9bd303d5a0c12937621f0862e40e794b8b89165e80',
  transformation: 'b80d74a74a7ed894cfdf90c47059113d7247a158781a05d746449480e024a5d0',
};

export async function loadInputs(root = process.cwd()) {
  const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
  const [evidence, canonical, references, fetterDetails, identities] = await Promise.all(
    [EVIDENCE, CANONICAL, REFERENCES, FETTER_DETAILS, HERO_IDENTITIES].map(readJson),
  );
  return { evidence, canonical, references, fetterDetails, identities };
}

export function validateHero15SoldierCommandBondContribution({ evidence, canonical, references, fetterDetails, identities }) {
  assert.equal(evidence.schemaVersion, 1);
  assert.equal(evidence.productionRuntimeDependency, false);
  assert.deepEqual(evidence.claimEvidence, {
    sourceRecordsAndCommandProperties: 'A',
    maxLevelSelectionAggregationAndScale: 'B',
  });
  for (const [section, expected] of Object.entries(EVIDENCE_PINS)) {
    const bytes = JSON.stringify(evidence[section]);
    assert(bytes, `Missing evidence section ${section}`);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), expected, `Verified evidence section ${section} drift`);
  }

  const records = (name) => evidence.records[name].map((row) => row.rawRecord);
  const [hero] = records('ConfigDataHeroInfo');
  const [information] = records('ConfigDataHeroInformationInfo');
  const heroId = hero.ID;
  assert.equal(heroId, 15);
  assert.equal(identities.records.filter((row) => row.heroId === heroId).length, 1, 'Hero Identity missing or duplicated');
  assert.equal(hero.HeroInformation_ID, information.ID, 'HeroInfo to HeroInformation endpoint mismatch');
  const regular = references.records.filter((row) => row.heroId === heroId && row.referenceKind === 'HERO_FETTER_ID_REFERENCE');
  assert.deepEqual(regular.map((row) => [row.heroInformationId, row.fetterId, row.sourceField, row.endpointNamespace]),
    information.HeroFetters_ID.map((id) => [information.ID, id, 'ConfigDataHeroInformationInfo.HeroFetters_ID', 'ConfigDataHeroFetterInfo.ID']),
    'Canonical regular Fetter references differ from the raw HeroInformation records');

  const fetters = records('ConfigDataHeroFetterInfo');
  assert.deepEqual(fetters.map((row) => row.ID), information.HeroFetters_ID, 'Regular Fetter source set drift');
  const maxSkills = fetters.map((fetter) => {
    const matches = fetterDetails.records.filter((row) => row.heroId === heroId && row.endpointId === fetter.ID);
    assert.equal(matches.length, 1, `Canonical raw Fetter ${fetter.ID} missing or duplicated`);
    assert.equal(matches[0].fields.MaxLevel, fetter.MaxLevel);
    assert.deepEqual(matches[0].fields.GotSkills_ID, fetter.GotSkills_ID);
    assert(fetter.MaxLevel > 0 && fetter.GotSkills_ID.length === fetter.MaxLevel, 'MaxLevel selector scope drift');
    return fetter.GotSkills_ID[fetter.MaxLevel - 1];
  });
  const skills = records('ConfigDataSkillInfo');
  assert.deepEqual(skills.map((row) => row.ID), maxSkills, 'Maximum-level SkillInfo endpoints drift');
  const buffs = records('ConfigDataBuffInfo');
  assert.deepEqual(buffs.map((row) => row.ID), skills.flatMap((row) => row.PassiveBuffs_ID),
    'BuffInfo occurrences must match exact passive references in order');
  const properties = records('ConfigDataPropertyModifyInfo');
  assert.deepEqual(properties.map((row) => [row.ID, row.PropertyModifyType, row.IsAddType]),
    [...COMPONENTS.keys()].map((id) => [id, id, true]), 'Additive command property namespace drift');

  const raw = Object.fromEntries([...COMPONENTS.values()].map((key) => [key, 0]));
  for (const buff of buffs) {
    for (const slot of [1, 2, 3, 4]) {
      const key = COMPONENTS.get(buff[`Property${slot}_ID`]);
      if (key === undefined) continue;
      const value = buff[`Property${slot}_Value`];
      assert(Number.isSafeInteger(value), `Buff ${buff.ID} command property must carry an integer`);
      raw[key] += value;
    }
  }
  const contribution = Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, value / 100]));
  assert.deepEqual({ heroId, raw, contribution }, evidence.predecessor.comparison.record, 'Independent max-level contribution differs from frozen predecessor');
  assert.deepEqual(canonical, {
    schemaVersion: 1,
    scope: 'Hero 15 maximum-level regular Fetter Soldier Command contribution (Hero3). Percent contribution only, without base composition or runtime applicability.',
    records: [{ heroId, raw, contribution, provenance: {
      source: `${EVIDENCE}#records`,
      propertyNamespace: `${EVIDENCE}#propertyNamespace`,
      transformation: `${EVIDENCE}#transformation`,
    } }],
  }, 'Canonical must preserve only the verified Hero 15 contribution');
}

if (process.argv[1] && resolve(process.argv[1]) === resolve('tools/validate-hero-15-soldier-command-bond-contribution.mjs')) {
  validateHero15SoldierCommandBondContribution(await loadInputs());
  console.log('Hero 15 Soldier Command bond contribution: PASS (5 regular Fetters, 5 max-level Skills, 6 Buff occurrences, 4 command properties)');
}
