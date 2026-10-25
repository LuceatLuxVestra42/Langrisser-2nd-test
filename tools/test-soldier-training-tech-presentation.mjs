import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { extractFunction } from './test-app-function-source.mjs';
import { renderSoldierTrainingTechDescriptions } from './generate.mjs';
import { validateSoldierTrainingTechPresentation } from './validate-soldier-training-tech-presentation.mjs';

const [canonical, generatedText, frontend] = await Promise.all([
  readFile('canonical/soldier-training-tech-descriptions.v1.json', 'utf8').then(JSON.parse),
  readFile('generated/soldier-training-tech-descriptions.v1.json', 'utf8'),
  readFile('app.js', 'utf8'),
]);
const generated = JSON.parse(generatedText);
assert.equal(validateSoldierTrainingTechPresentation({ canonical, generatedText, frontend }).claimCount, 20);
assert.equal(renderSoldierTrainingTechDescriptions(canonical), generatedText);
assert.deepEqual([...new Set(generated.records.map((row) => row.soldierId))], [115, 5115]);
assert.deepEqual([...new Set(generated.records.map((row) => row.trainingTechId))], [223]);
assert.deepEqual([...new Set(generated.records.map((row) => row.levelInfoId))], [2230, 2231, 2232, 2233, 2234, 2235, 2236, 2237, 2238, 2239]);
assert.equal(generated.records.filter((row) => row.variant === 'NORMAL' && row.sourceField === 'Description').length, 10);
assert.equal(generated.records.filter((row) => row.variant === 'SP' && row.sourceField === 'SpSoidlierDescription').length, 10);
assert.equal(generated.contract.status, 'PROPOSED');
assert.equal(generated.contract.approved, false);

const badCanonical = (label, mutate) => {
  const input = structuredClone(canonical);
  mutate(input);
  assert.throws(() => renderSoldierTrainingTechDescriptions(input), undefined, label);
};
badCanonical('reject unapproved Soldier endpoint', (input) => { input.records[0].soldierId = 116; });
badCanonical('reject unapproved TrainingTech endpoint', (input) => { input.records[0].trainingTechId = 224; });
badCanonical('reject unapproved LevelInfo ID', (input) => { input.records[0].levelInfoId = 2240; });
badCanonical('reject NORMAL/SP field crosswire by variant', (input) => { input.records[0].variant = 'SP'; });
badCanonical('reject extra claim beyond the exact population', (input) => { input.records.push(structuredClone(input.records[0])); });
badCanonical('reject unsupported HTML-like source markup', (input) => { input.records[0].descriptionCn += '<img src=x onerror=alert(1)>'; });
badCanonical('reject changed provenance', (input) => { input.records[0].provenance.description = 'generated/guess'; });

const assertGeneratedRejected = (label, mutate) => {
  const input = JSON.parse(generatedText);
  mutate(input);
  assert.throws(() => validateSoldierTrainingTechPresentation({
    canonical, generatedText: `${JSON.stringify(input, null, 2)}\n`, frontend,
  }), undefined, label);
};
assertGeneratedRejected('reject Generated source-field crosswire', (input) => { input.records[0].sourceField = 'SpSoidlierDescription'; });
assertGeneratedRejected('reject Generated publication self-approval', (input) => { input.contract.approved = true; });
assertGeneratedRejected('reject Generated consumer scope expansion', (input) => { input.records.push({ ...input.records[0], soldierId: 1150 }); });
assertGeneratedRejected('reject Generated text mutation', (input) => { input.records[0].descriptionCn += ' altered'; });
assertGeneratedRejected('reject missing disclosure output envelope field', (input) => { delete input.source.commit; });
assert.match(frontend, /data\.contract\.status === 'PROPOSED' && data\.contract\.approved === false/);
assert.doesNotMatch(frontend, /\.innerHTML\s*=/);

const element = (tagName = '#text') => ({
  tagName, children: [], attributes: {}, className: '', textContent: '',
  append(...children) { this.children.push(...children); },
  setAttribute(name, value) { this.attributes[name] = value; },
});
const document = {
  createElement: (tagName) => element(tagName),
  createTextNode: (text) => Object.assign(element(), { textContent: text }),
};
const appFunctions = [
  'appendSkillDescription', 'indexSoldierTrainingTechDescriptions', 'makeSoldierTrainingTechPresentation',
].map((name) => extractFunction(frontend, name)).join('\n');
const runtime = runInNewContext(`(() => { ${appFunctions}; return { appendSkillDescription, indexSoldierTrainingTechDescriptions, makeSoldierTrainingTechPresentation }; })()`, {
  document, Map, Set, String, Number, Error, Array,
});
assert.equal(runtime.indexSoldierTrainingTechDescriptions(generated).size, 0,
  'the actual proposal state must expose no Soldier card content');
assert.equal(runtime.makeSoldierTrainingTechPresentation({ normalSoldierId: 115 }, 'NORMAL', new Map()), null);

// A synthetic test-only approval state exercises the renderer; it is not an approval record or production input.
const approvalFixture = structuredClone(generated);
approvalFixture.contract.status = 'APPROVED';
approvalFixture.contract.approved = true;
const approvedFixtureIndex = runtime.indexSoldierTrainingTechDescriptions(approvalFixture);
assert.equal(approvedFixtureIndex.size, 2);
assert.throws(() => runtime.indexSoldierTrainingTechDescriptions({
  ...approvalFixture,
  records: approvalFixture.records.map((row) => row.variant === 'SP' ? { ...row, sourceField: 'Description' } : row),
}), /Malformed or out-of-scope/);

function visibleText(node) {
  return (node.textContent ?? '') + (node.children ?? []).map(visibleText).join('');
}
for (const [variant, soldier] of [
  ['NORMAL', { normalSoldierId: 115 }],
  ['SP', { spSoldierId: 5115 }],
]) {
  const disclosure = runtime.makeSoldierTrainingTechPresentation(soldier, variant, approvedFixtureIndex);
  assert.equal(disclosure.tagName, 'details');
  assert.equal(disclosure.className, 'soldier-training-tech-descriptions');
  assert.equal(disclosure.attributes.open, undefined, 'native disclosure must start collapsed');
  assert.equal(disclosure.children[0].tagName, 'summary', 'native summary provides keyboard disclosure semantics');
  assert.match(disclosure.children[0].textContent, /CN ConfigData 원문 설명/);
  assert.match(visibleText(disclosure), /공식 번역 아님|한국어 공식 번역 아님/);
  assert.match(visibleText(disclosure), /LevelInfo ID는 원본 레코드 식별자/);
  assert.match(visibleText(disclosure), /Commit 6475e63ee23d18adf733756c26a14fa9e3ed662c/);
  assert.equal(disclosure.children.at(-1).children.length, 10);
  assert.ok(disclosure.children.at(-1).children.every((item) => item.children[0].textContent.includes(variant === 'NORMAL' ? 'Description' : 'SpSoidlierDescription')));
  if (variant === 'SP') assert.match(visibleText(disclosure), /슬롯·시점·게임 내 적용 의미는 확인되지 않았습니다/);
}
assert.equal(runtime.makeSoldierTrainingTechPresentation({ normalSoldierId: 116 }, 'NORMAL', approvedFixtureIndex), null,
  'no unapproved Soldier may receive the presentation');

const safeSource = element('p');
runtime.appendSkillDescription(safeSource, '값 <color=#DC143C>+12%</color>\n다음 줄');
assert.ok(safeSource.children.some((child) => child.className === 'skill-description-emphasis'));
assert.equal(visibleText(safeSource), '값 +12%\n다음 줄');
const unsafeSource = element('p');
runtime.appendSkillDescription(unsafeSource, '<img src=x onerror=alert(1)>');
assert.equal(unsafeSource.textContent, '<img src=x onerror=alert(1)>');
assert.equal(unsafeSource.children.length, 0, 'unsupported markup must stay plain text');

console.log('Soldier TrainingTech presentation tests PASS (20 exact claims, unapproved runtime hidden, synthetic renderer fixture, markup safety, ID/field negatives)');
