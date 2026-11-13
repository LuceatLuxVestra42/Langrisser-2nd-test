import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadAwakeningInputs, OUTPUT } from './hero-15-awakening-internal-consumer.mjs';
import { validateInternal } from './validate-hero-15-awakening-internal.mjs';
const original = await loadAwakeningInputs();
const text = await readFile(OUTPUT, 'utf8');
validateInternal(original, text);
const cases = [
  (i,o) => { i.references.records[0].heroId = 16; },
  (i,o) => { i.references.records[0].stage1LevelReference.levelId = 2015; },
  (i,o) => { i.references.records[0].stage2LevelReference.levelId = 1015; },
  (i,o) => { i.references.records[0].stage2SkillReference.skillId = 1; },
  (i,o) => { i.skills.records = i.skills.records.filter(x => x.skillId !== 12350); },
  (i,o) => { i.skills.records.push(structuredClone(i.skills.records.find(x => x.skillId === 12350))); },
  (i,o) => { i.skills.records.find(x => x.skillId === 12350).nameCn = 'wrong'; },
  (i,o) => { i.details.records.pop(); },
  (i,o) => { i.details.records.push(structuredClone(i.details.records[0])); },
  (i,o) => { o.stage1.detail.rawFields.Battle_ID++; },
  (i,o) => { o.stage1.detail.rawFields.MonsterLevel = '70'; },
  (i,o) => { o.stage1.detail.provenance = 'wrong'; },
  (i,o) => { o.stage1.goods.reverse(); },
  (i,o) => { o.stage1.goods[0].itemId++; },
  (i,o) => { o.stage2.goods[0].count++; },
  (i,o) => { [o.stage1.detail, o.stage2.detail] = [o.stage2.detail, o.stage1.detail]; },
  (i,o) => { o.stage1.skillReference = o.stage2.skillReference; },
  (i,o) => { o.publication = true; },
  (i,o) => { o.stage2.detail.runtimeBattle = true; },
  (i,o) => { o.stage2.skillIdentity.descriptionCn = 'wrong'; },
];
for (const [index, mutate] of cases.entries()) {
  const input = structuredClone(original), output = JSON.parse(text);
  mutate(input, output);
  assert.throws(() => validateInternal(input, `${JSON.stringify(output, null, 2)}\n`), undefined, `case ${index + 1}`);
}
console.log(`Hero 15 Awakening internal negative controls: PASS (${cases.length})`);
