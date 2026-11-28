import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const CANONICAL = 'canonical/hero-soldier-command-bond-contributions.v1.json';
const LANCE_EVIDENCE = 'evidence/source/configdata/hero-16-soldier-command-bond-contribution.v1.json';
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

function lanceContribution(lance, references, identities, source) {
  assert.equal(lance.schemaVersion, 1);
  assert.deepEqual(lance.source, source, 'Lance command source pin');
  assert.equal(lance.hero.index, 15);
  assert.equal(lance.hero.ID, 16);
  assert.equal(identities.records.filter(row => row.heroId === lance.hero.ID).length, 1);
  const ids = [71,72,73,74,75];
  assert.deepEqual(lance.information, {index:15, ID:16, HeroFetters_ID:ids});
  assert.equal(lance.hero.HeroInformation_ID, lance.information.ID, 'Hero 16 to HeroInformation attribution');
  const regular = references.records.filter(row => row.heroId === 16 && row.referenceKind === 'HERO_FETTER_ID_REFERENCE');
  for (const id of lance.information.HeroFetters_ID) {
    assert.equal(regular.filter(row => row.heroInformationId === lance.information.ID && row.fetterId === id
      && row.sourceField === 'ConfigDataHeroInformationInfo.HeroFetters_ID' && row.endpointNamespace === 'ConfigDataHeroFetterInfo.ID').length,
      1, 'Hero 16 regular Fetter relation ' + id);
  }
  assert.deepEqual(regular.map(row => row.fetterId), ids);
  assert.deepEqual(lance.fetters.map(row => [row.index,row.ID,row.MaxLevel,row.GotSkills_ID.length]),
    [[70,71,10,10],[71,72,10,10],[72,73,10,10],[73,74,10,10],[74,75,10,10]]);
  const skills = lance.fetters.map(row => row.GotSkills_ID[row.MaxLevel - 1]);
  assert.deepEqual(skills, [70009,70088,70019,70099,70109], 'Lance maximum-level Skill endpoints');
  assert.deepEqual(lance.skills.map(row => row.ID), skills);
  assert.deepEqual(lance.skills.map(row => row.index), [16208,16278,16218,16288,16298]);
  assert.deepEqual(lance.skills.map(row => row.PassiveBuffs_ID), [[70009],[70088,70089],[70019],[70099],[70109]], 'Lance passive Buff links');
  assert.deepEqual(lance.buffs.map(row => row.ID), lance.skills.flatMap(row => row.PassiveBuffs_ID), 'Lance Buff endpoints');
  assert.deepEqual(lance.buffs.map(row => row.index), [32406,32485,32486,32416,32496,32506]);
  const enumNames = ['HPCmdAdd','ATCmdAdd','DFCmdAdd','MagicDFCmdAdd','HPMul','ATMul','DFMul','MagicMul','MagicDFMul','DEXMul'];
  const properties = [93,94,95,96,99,100,101,102,103,104];
  assert.deepEqual(lance.propertyNamespace, {path:'data/metadata/dump.cs',gitBlobSha1:'201bc8004792d13c52a26afc79f73e5ed8d1c2ac',
    sha256:'15f2030df8a0d3f9363adfe67113b01065eb70166c13a08f04a96d5e5edb2e31',enum:'PropertyModifyType',
    members:Object.fromEntries(properties.map((id,i) => [id,'Hero3_'+enumNames[i]]))}, 'Lance command enum');
  assert.deepEqual(lance.properties, properties.map(id => ({index:id,ID:id,PropertyModifyType:id,
    ...(COMPONENTS.has(id) ? {IsAddType:true} : {})})), 'Lance property type and additivity');
  const expectedIds = [[93,94,95,96],[99,101,103],[100,102,104],[93,95],[99,101,103],[100,102,104]];
  const expectedValues = [1000,1000,1000,1500,1500,1500];
  const raw = {hp:0, at:0, df:0, magicDf:0};
  for (const [i,buff] of lance.buffs.entries()) {
    const expected = {index:buff.index,ID:buff.ID};
    for (const [slot,id] of expectedIds[i].entries()) {
      const property = 'Property' + (slot+1);
      expected[property+'_ID'] = id;
      expected[property+'_Value'] = expectedValues[i];
    }
    assert.deepEqual(buff, expected, 'Lance Buff property slots ' + buff.ID);
    for (let slot = 1; slot <= expectedIds[i].length; slot++) {
      const stat = COMPONENTS.get(buff['Property'+slot+'_ID']);
      if (stat) raw[stat] += buff['Property'+slot+'_Value'];
    }
  }
  assert.equal(lance.transformation.divisor, 100, 'Lance command percentage divisor');
  assert.equal(lance.transformation.gitBlobSha1,'5b22c27b0850023895dc9cf5a65cbb37bd954b71');
  assert.equal(lance.transformation.commit,'57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff');
  assert.equal(lance.transformation.path,'data/validation/hero-soldier-bond-command-contribution-r5-f.v1.json');
  assert.equal(lance.transformation.locator,'#frozenSemantics');
  return {heroId:lance.hero.ID,raw,contribution:Object.fromEntries(Object.entries(raw).map(([stat,value]) => [stat,value/lance.transformation.divisor])),
    provenance:{source:LANCE_EVIDENCE+'#buffs',propertyNamespace:LANCE_EVIDENCE+'#propertyNamespace',transformation:LANCE_EVIDENCE+'#transformation'}};
}

export async function loadInputs(root = process.cwd()) {
  const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
  const [evidence, lanceEvidence, canonical, references, fetterDetails, identities] = await Promise.all(
    [EVIDENCE, LANCE_EVIDENCE, CANONICAL, REFERENCES, FETTER_DETAILS, HERO_IDENTITIES].map(readJson),
  );
  return { evidence, lanceEvidence, canonical, references, fetterDetails, identities };
}

export function validateHero15SoldierCommandBondContribution({ evidence, lanceEvidence, canonical, references, fetterDetails, identities }) {
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
    scope: 'Heroes 15 and 16 maximum-level regular Fetter Soldier Command contribution (Hero3). Percent contribution only, without base composition or runtime applicability.',
    records: [{ heroId, raw, contribution, provenance: {
      source: `${EVIDENCE}#records`,
      propertyNamespace: `${EVIDENCE}#propertyNamespace`,
      transformation: `${EVIDENCE}#transformation`,
    } }, lanceContribution(lanceEvidence, references, identities, evidence.source)],
  }, 'Canonical must preserve only the verified Hero 15 contribution');
}

if (process.argv[1] && resolve(process.argv[1]) === resolve('tools/validate-hero-15-soldier-command-bond-contribution.mjs')) {
  validateHero15SoldierCommandBondContribution(await loadInputs());
  console.log('Hero 15 and 16 Soldier Command bond contributions: PASS (5 regular Fetters and 6 Buff occurrences per Hero)');
}
