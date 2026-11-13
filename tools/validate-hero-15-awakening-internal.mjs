import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadAwakeningInputs, OUTPUT, SCOPE } from './hero-15-awakening-internal-consumer.mjs';
import { validateHero15AwakeningReferences } from './validate-hero15-awakening-references.mjs';
import { validateSkillIdentities } from './validate-skill-identities.mjs';
import { validateAwakeningLevelRawDetails } from './validate-awakening-level-raw-details.mjs';

export function validateInternal({ references, details, skills }, text) {
  assert.equal(references.records.length, 1);
  const ref = references.records[0];
  assert.equal(ref.heroId, 15); assert.equal(ref.awakenInfoId, 15);
  assert.equal(ref.stage1LevelReference.levelId, 1015);
  assert.equal(ref.stage2LevelReference.levelId, 2015);
  assert.equal(ref.stage2SkillReference.skillId, 12350);
  assert.equal(details.records.length, 2);
  const findOne = (rows, key, id) => {
    const found = rows.filter(row => row[key] === id);
    assert.equal(found.length, 1, `expected unique ${key}=${id}`);
    return found[0];
  };
  const detail1 = findOne(details.records, 'levelId', 1015);
  const detail2 = findOne(details.records, 'levelId', 2015);
  const skill = findOne(skills.records, 'skillId', 12350);
  assert.equal(skill.nameCn, '创生圣颂');
  assert.equal(skill.provenance.identity, 'evidence/source/configdata/ConfigDataSkillInfo.record-12350-awakening-skill.v1.json#ID=12350');
  const output = JSON.parse(text);
  assert.deepEqual(output, {
    schemaVersion: 1, scope: SCOPE, heroId: 15, awakenInfoId: 15,
    awakeningSourceNamespace: ref.awakeningSourceNamespace, evidenceProvenance: ref.evidenceProvenance,
    stage1: { reference: ref.stage1LevelReference, goods: ref.stage1SourceGoods, detail: detail1 },
    stage2: { reference: ref.stage2LevelReference, goods: ref.stage2SourceGoods, detail: detail2,
      skillReference: ref.stage2SkillReference, skillIdentity: skill },
  });
  assert.equal(text, `${JSON.stringify(output, null, 2)}\n`, 'serialization is not deterministic');
}
export async function validateFromRoot(root = process.cwd()) {
  await validateHero15AwakeningReferences(root);
  await validateAwakeningLevelRawDetails(root);
  await validateSkillIdentities(root);
  const inputs = await loadAwakeningInputs(root);
  validateInternal(inputs, await readFile(resolve(root, OUTPUT), 'utf8'));
  console.log('Hero 15 Awakening internal consumer: PASS');
}
if (process.argv[1] && resolve(process.argv[1]) === resolve('tools/validate-hero-15-awakening-internal.mjs')) await validateFromRoot();
