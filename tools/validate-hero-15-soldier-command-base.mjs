import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const CANONICAL = 'canonical/hero-soldier-command-base.v1.json';
const LANCE_EVIDENCE = 'evidence/source/configdata/hero-16-soldier-command-base.v1.json';
export const EVIDENCE = 'evidence/source/configdata/hero-15-soldier-command-base.v1.json';
const SOURCE_PATH = 'data/configdata/ConfigDataHeroInfo.json';
const HERO_IDENTITY = 'canonical/hero-identities.v1.json';
const SOURCE_FIELDS = { hp: 'HPCmd_INI', magicDf: 'MagicDFCmd_INI' };

export async function loadInputs(root = process.cwd()) {
  const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
  const [evidence, lanceEvidence, canonical, identities] = await Promise.all(
    [EVIDENCE, LANCE_EVIDENCE, CANONICAL, HERO_IDENTITY].map(readJson),
  );
  return { evidence, lanceEvidence, canonical, identities };
}

export function validateHero15SoldierCommandBase({ evidence, lanceEvidence, canonical, identities }) {
  assert.equal(evidence.schemaVersion, 1);
  assert.deepEqual(evidence.source, {
    repository: 'LuceatLuxVestra42/langrisser-future-guide',
    commit: '6475e63ee23d18adf733756c26a14fa9e3ed662c',
    tree: '08e1e6c2773730e60b258940e31494f68d65f86a',
    snapshotDate: '2026-09-02T01:45:21Z',
    path: SOURCE_PATH,
    gitBlobSha1: '728daab3370f0c7779449663ea02e638677944d4',
    sha256: '2385599493d2598aa3f7d6b2c76ecdfd8615d91f19b6241933986282fcb17f7b',
    recordIndex: 14,
    recordLocator: `${SOURCE_PATH}#ID=15`,
  }, 'HeroInfo snapshot or record locator drift');
  assert.deepEqual(evidence.rawRecord, { ID: 15, HPCmd_INI: 1500, MagicDFCmd_INI: 1500 },
    'Only the exact present HeroInfo integers may be preserved');
  assert.deepEqual(evidence.absentFields, ['ATCmd_INI', 'DFCmd_INI'], 'Source absence drift');
  assert.deepEqual(evidence.fieldContract, {
    path: 'data/metadata/dump.cs',
    gitBlobSha1: '201bc8004792d13c52a26afc79f73e5ed8d1c2ac',
    sha256: '15f2030df8a0d3f9363adfe67113b01065eb70166c13a08f04a96d5e5edb2e31',
    message: 'ConfigDataHeroInfo',
    descriptorType: 'int',
    fieldNumbers: { ID: 2, HPCmd_INI: 21, DFCmd_INI: 22, ATCmd_INI: 23, MagicDFCmd_INI: 24 },
  }, 'HeroInfo descriptor drift');

  const heroId = evidence.rawRecord.ID;
  assert.equal(evidence.heroIdentity, `${HERO_IDENTITY}#heroId=${heroId}`);
  assert.equal(identities.records.filter((record) => record.heroId === heroId).length, 1,
    'The selected HeroInfo ID must resolve to exactly one Canonical Hero');
  assert.deepEqual(evidence.claimEvidence, {
    rawValuesAndHeroIdentity: 'A',
    percentageScaleAndTroopMetadata: 'B',
  });
  assert.equal(evidence.productionRuntimeDependency, false);
  assert.deepEqual(evidence.transformationEvidence, {
    commit: 'a490ba76da27095f3ef9dfe6ad66b0450cc7b24d',
    contract: {
      path: 'data/hero-basic-combat-stage4-5.v1.json',
      gitBlobSha1: '0566bfc26c54694f089fd765a9aefbe83208ca41',
      locator: '#semanticGates/id=heroSoldierModifiers',
    },
    validation: {
      path: 'data/validation/hero-basic-combat-stage4-5-summary.v1.json',
      gitBlobSha1: '1ea45f081238ff41995c4e444bc6f953c73c5e64',
      locator: '#semanticGates/id=heroSoldierModifiers',
    },
    producer: {
      path: 'scripts/prepare_hero_basic_combat_stage45.cjs',
      gitBlobSha1: '5e998a5621950072ed59440a20de551b8b51e676',
      locator: '#soldierModifiers',
    },
    comparison: {
      path: 'data/generated/hero-basic-combat.v1.json',
      gitBlobSha1: '01246ee5da8e988f0e95b6a29d20e6e5caa2c1e6',
      locator: '#heroId=15/soldierModifiers',
      raw: { hp: 1500, at: 0, df: 0, magicDf: 1500 },
      base: { hp: 15, at: 0, df: 0, magicDf: 15 },
    },
    rule: 'raw / 100 = percent',
    appliesTo: 'Hero-owned troop stat base metadata',
  }, 'Predecessor scale, scope, or provenance drift');

  const raw = Object.fromEntries(Object.entries(SOURCE_FIELDS).map(([key, field]) => [key, evidence.rawRecord[field]]));
  const base = Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, value / 100]));
  const locators = Object.fromEntries(Object.entries(SOURCE_FIELDS).map(([key, field]) => [key, `${EVIDENCE}#rawRecord/${field}`]));
  const lance = lanceEvidence;
  assert.deepEqual(lance.source, {...evidence.source, recordIndex:15, recordLocator:SOURCE_PATH + '#/15'}, 'Lance base HeroInfo provenance');
  assert.equal(lance.schemaVersion, 1);
  assert.deepEqual(lance.rawRecord, { ID:16, HPCmd_INI:1000, ATCmd_INI:500, DFCmd_INI:1000 }, 'Lance explicit base fields');
  assert.deepEqual(lance.absentFields, ['MagicDFCmd_INI'], 'Lance absent base magic defense');
  assert.equal(identities.records.filter(row => row.heroId === lance.rawRecord.ID).length, 1);
  assert.deepEqual(lance.transformation, {commit:'57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff',
    path:'data/contracts/hero-soldier-command-base.v1.json',gitBlobSha1:'e7f2546945db23d5cc23c7707645100acc10c52f',
    locator:'#projection/normalization',divisor:100}, 'Lance base percentage contract');
  const fields = Object.entries({hp:'HPCmd_INI', at:'ATCmd_INI', df:'DFCmd_INI'});
  const lanceRaw = Object.fromEntries(fields.map(([stat, field]) => [stat,lance.rawRecord[field]]));
  const lanceRow = {heroId:lance.rawRecord.ID, raw:lanceRaw,
    base:Object.fromEntries(Object.entries(lanceRaw).map(([stat,value]) => [stat,value/lance.transformation.divisor])),
    provenance:{raw:Object.fromEntries(fields.map(([stat,field]) => [stat,LANCE_EVIDENCE+'#rawRecord/'+field])),
      heroIdentity:LANCE_EVIDENCE+'#rawRecord/ID',transformation:LANCE_EVIDENCE+'#transformation'}};
  assert.deepEqual(canonical, {
    schemaVersion: 1,
    scope: 'Heroes 15 and 16 only. Hero-owned troop base modifier metadata. Copy explicit HeroInfo integers and divide by 100 without rounding to express percentages. Absent fields have no admitted value.',
    records: [{ heroId, raw, base, provenance: {
      raw: locators,
      heroIdentity: `${EVIDENCE}#rawRecord/ID`,
      transformation: `${EVIDENCE}#transformationEvidence`,
    } }, lanceRow],
  }, 'Canonical must preserve and normalize only the two source-proven base modifiers');
}

if (process.argv[1] && resolve(process.argv[1]) === resolve('tools/validate-hero-15-soldier-command-base.mjs')) {
  validateHero15SoldierCommandBase(await loadInputs());
  console.log('Hero 15 and 16 Soldier Command base validation: PASS (2 and 3 explicit modifiers)');
}
