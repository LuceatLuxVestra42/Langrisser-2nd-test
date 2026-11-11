import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateHero15AwakeningReferencesData } from './validate-hero15-awakening-references.mjs';

const read = async path => JSON.parse(await readFile(path, 'utf8'));
const [evidence, canonical] = await Promise.all([
  read('evidence/source/awakening/hero15-awakening-references.v1.json'),
  read('canonical/hero-awakening-references.v1.json'),
]);
const fresh = () => ({ evidence: structuredClone(evidence), canonical: structuredClone(canonical) });
const expected = { heroId: 15, sourceAwakenInfoId: 15, stageReferences: 2, skillReferences: 1, sourceGoodsEntries: 6, awakeningSkillIdentityAdmitted: false, unlockOrConsumptionSemantics: false, publication: false };
assert.deepEqual(validateHero15AwakeningReferencesData(fresh()), expected);

const cases = [
  [d => { d.evidence.sourceSnapshot.commit = '0'.repeat(40); }, 'source commit'],
  [d => { d.evidence.sourceSnapshot.tree = '0'.repeat(40); }, 'source tree'],
  [d => { d.evidence.sourceRecords.awakenInfo.blobSha1 = '0'.repeat(40); }, 'AwakenInfo blob'],
  [d => { d.evidence.sourceRecords.awakenInfo.sha256 = '0'.repeat(64); }, 'AwakenInfo SHA-256'],
  [d => { d.evidence.sourceRecords.awakenInfo.sourceArrayIndex = 12; }, 'Hero record locator'],
  [d => { d.evidence.sourceRecords.awakenInfo.fields.ID = 8; }, 'Hero to AwakenInfo endpoint'],
  [d => { d.evidence.sourceRecords.awakenInfo.fields.Awaken1LevelID = 1014; }, 'stage-one reference'],
  [d => { d.evidence.sourceRecords.awakenInfo.fields.Awaken1Material.reverse(); }, 'stage-one source order'],
  [d => { d.evidence.sourceRecords.awakenInfo.fields.Awaken1Material[0].Count = 4; }, 'stage-one raw count'],
  [d => { d.evidence.sourceRecords.awakenInfo.fields.Awaken2LevelID = 2014; }, 'stage-two reference'],
  [d => { d.evidence.sourceRecords.awakenInfo.fields.Level2SkillID = 12351; }, 'Skill reference'],
  [d => { d.evidence.sourceRecords.awakenInfo.fields.Awaken2Material[0].GoodsType = 5; }, 'Goods namespace'],
  [d => { d.evidence.sourceRecords.awakenLevelEndpoints.records.pop(); }, 'missing level endpoint'],
  [d => { d.evidence.sourceRecords.skillEndpoint.records[0].fields.ID = 12351; }, 'Skill endpoint'],
  [d => { d.evidence.sourceRecords.itemEndpoints.records[0].recordLocator = 'ConfigDataItemInfo#ID=3247'; }, 'Item endpoint locator'],
  [d => { d.canonical.records[0].stage2SourceGoods.reverse(); }, 'Canonical Goods order'],
  [d => { d.canonical.records[0].stage2SkillReference.skillId = 12351; }, 'Canonical Skill reference'],
  [d => { d.canonical.records[0].stage1SourceGoods[0].endpointNamespace = 'ConfigDataSkillInfo.ID'; }, 'Item namespace confusion'],
  [d => { d.canonical.records[0].stage1LevelReference.evidenceProvenance = 'wrong.json#field'; }, 'field provenance'],
  [d => { d.canonical.records[0].unlockCondition = true; }, 'unlock semantics escalation'],
  [d => { d.canonical.records[0].materialConsumptionRule = 'automatic'; }, 'consumption semantics escalation'],
  [d => { d.canonical.records[0].combatEffect = 'invented'; }, 'combat semantics escalation'],
  [d => { d.canonical.records.push(structuredClone(d.canonical.records[0])); }, 'duplicate Hero record'],
];
for (const [mutate, label] of cases) {
  const data = fresh();
  mutate(data);
  assert.throws(() => validateHero15AwakeningReferencesData(data), undefined, `must reject ${label}`);
}
console.log(`Hero 15 Awakening reference negative controls: PASS (${cases.length})`);
