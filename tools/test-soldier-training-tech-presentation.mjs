import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { extractFunction } from './test-app-function-source.mjs';
import { renderSoldierTrainingTechDescriptions } from './generate.mjs';
import { validateSoldierTrainingTechPresentation } from './validate-soldier-training-tech-presentation.mjs';
import { TRAINING_TECH_DECISION_RECORD_PATH, makeTrainingTechContractEnvelope, shouldPublishTrainingTechDirectJson } from './soldier-training-tech-presentation-contract.mjs';

const [canonical, evidence, decisionRecord, generatedText, frontend] = await Promise.all([
  readFile('canonical/soldier-training-tech-descriptions.v1.json', 'utf8').then(JSON.parse),
  readFile('evidence/source/configdata/soldier-training-tech-223-descriptions.v1.json', 'utf8').then(JSON.parse),
  readFile(TRAINING_TECH_DECISION_RECORD_PATH, 'utf8').then(JSON.parse),
  readFile('generated/soldier-training-tech-descriptions.v1.json', 'utf8'),
  readFile('app.js', 'utf8'),
]);
const generated = JSON.parse(generatedText);
assert.equal(validateSoldierTrainingTechPresentation({ canonical, evidence, decisionRecord, generatedText, frontend }).claimCount, 20);
assert.equal(renderSoldierTrainingTechDescriptions(canonical, decisionRecord), generatedText);
assert.deepEqual([...new Set(generated.records.map((row) => row.soldierId))], [115, 5115]);
assert.deepEqual([...new Set(generated.records.map((row) => row.trainingTechId))], [223]);
assert.deepEqual([...new Set(generated.records.map((row) => row.levelInfoId))], [2230, 2231, 2232, 2233, 2234, 2235, 2236, 2237, 2238, 2239]);
assert.equal(generated.records.filter((row) => row.variant === 'NORMAL' && row.sourceField === 'Description').length, 10);
assert.equal(generated.records.filter((row) => row.variant === 'SP' && row.sourceField === 'SpSoidlierDescription').length, 10);
assert.equal(generated.contract.status, 'EFFECTIVE');
assert.equal(generated.contract.approved, true);
assert.equal(generated.contract.effective, true);
assert.equal(generated.contract.decisionRecord, TRAINING_TECH_DECISION_RECORD_PATH);
assert.deepEqual(generated.contract, makeTrainingTechContractEnvelope(decisionRecord));
assert.equal(shouldPublishTrainingTechDirectJson(decisionRecord), true,
  'Decision B must explicitly permit Build JSON and Hosted Direct JSON');

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
    canonical, evidence, decisionRecord, generatedText: `${JSON.stringify(input, null, 2)}\n`, frontend,
  }), undefined, label);
};
assertGeneratedRejected('reject Generated source-field crosswire', (input) => { input.records[0].sourceField = 'SpSoidlierDescription'; });
assertGeneratedRejected('reject approved flag without Decision Record references', (input) => {
  input.contract = { id: input.contract.id, version: 1, status: 'EFFECTIVE', approved: true, effective: true };
});
assertGeneratedRejected('reject Generated consumer scope expansion', (input) => { input.records.push({ ...input.records[0], soldierId: 1150 }); });
assertGeneratedRejected('reject Generated text mutation', (input) => { input.records[0].descriptionCn += ' altered'; });
assertGeneratedRejected('reject missing disclosure output envelope field', (input) => { delete input.source.commit; });
assert.match(frontend, /data\.contract\.status !== 'EFFECTIVE' \|\| data\.contract\.approved !== true \|\| data\.contract\.effective !== true/);
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
assert.equal(runtime.indexSoldierTrainingTechDescriptions(generated).size, 2,
  'the verified effective contract should expose only the two approved Soldier endpoints');

const approvalFixture = structuredClone(generated);
const effectiveFixtureIndex = runtime.indexSoldierTrainingTechDescriptions(approvalFixture);
assert.equal(effectiveFixtureIndex.size, 2);
assert.throws(() => runtime.indexSoldierTrainingTechDescriptions({
  ...approvalFixture,
  records: approvalFixture.records.map((row) => row.variant === 'SP' ? { ...row, sourceField: 'Description' } : row),
}), /Malformed or out-of-scope/);

const approvedOnlyRecord = structuredClone(decisionRecord);
approvedOnlyRecord.contract.effectivenessStatus = 'APPROVED_ONLY';
const approvedOnlyEnvelope = makeTrainingTechContractEnvelope(approvedOnlyRecord);
assert.equal(approvedOnlyEnvelope.approved, true);
assert.equal(approvedOnlyEnvelope.effective, false);
assert.equal(shouldPublishTrainingTechDirectJson(approvedOnlyRecord), false,
  'Build must omit direct JSON before the contract becomes effective');
assert.equal(runtime.indexSoldierTrainingTechDescriptions({ ...approvalFixture, contract: approvedOnlyEnvelope }).size, 0,
  'approval without effectiveness must remain hidden');

const revokedRecord = structuredClone(decisionRecord);
revokedRecord.contract.effectivenessStatus = 'REVOKED';
revokedRecord.revocation.status = 'REVOKED';
revokedRecord.revocation.revokedAt = 'test-fixture';
revokedRecord.revocation.reason = 'negative test';
const revokedEnvelope = makeTrainingTechContractEnvelope(revokedRecord);
assert.equal(revokedEnvelope.effective, false);
assert.equal(shouldPublishTrainingTechDirectJson(revokedRecord), false,
  'new Builds must omit direct JSON after revocation');
assert.equal(runtime.indexSoldierTrainingTechDescriptions({ ...approvalFixture, contract: revokedEnvelope }).size, 0,
  'revoked contracts must remain hidden');

const proposalRecord = structuredClone(decisionRecord);
proposalRecord.contract.approvalStatus = 'NOT_APPROVED';
proposalRecord.contract.effectivenessStatus = 'PROPOSED';
proposalRecord.decisionA.status = 'NOT_APPROVED';
proposalRecord.decisionB.status = 'NOT_APPROVED';
const proposalEnvelope = makeTrainingTechContractEnvelope(proposalRecord);
assert.equal(proposalEnvelope.approved, false);
assert.equal(shouldPublishTrainingTechDirectJson(proposalRecord), false,
  'Build must omit direct JSON for unapproved decisions');
assert.equal(runtime.indexSoldierTrainingTechDescriptions({ ...approvalFixture, contract: proposalEnvelope }).size, 0,
  'unapproved proposals must remain hidden');

const revokedGenerated = JSON.parse(renderSoldierTrainingTechDescriptions(canonical, revokedRecord));
assert.equal(revokedGenerated.contract.status, 'REVOKED');
assert.equal(revokedGenerated.contract.approved, true);
assert.equal(revokedGenerated.contract.effective, false);

assert.throws(() => runtime.indexSoldierTrainingTechDescriptions({
  ...approvalFixture,
  contract: { id: approvalFixture.contract.id, status: 'EFFECTIVE', approved: true },
}), /Unsupported Soldier TrainingTech description consumer/,
'approved flag alone must not grant publication');

const widenedDecision = structuredClone(decisionRecord);
widenedDecision.decisionB.publicSurfaces.push('arbitrary_new_consumer');
assert.throws(() => makeTrainingTechContractEnvelope(widenedDecision), /Decision B record mismatch/,
  'Decision B must reject an unapproved consumer surface');

function visibleText(node) {
  return (node.textContent ?? '') + (node.children ?? []).map(visibleText).join('');
}
for (const [variant, soldier] of [
  ['NORMAL', { normalSoldierId: 115 }],
  ['SP', { spSoldierId: 5115 }],
]) {
  const disclosure = runtime.makeSoldierTrainingTechPresentation(soldier, variant, effectiveFixtureIndex);
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
  assert.ok(disclosure.children.at(-1).children.every((item) => item.children[1].textContent.includes('ConfigDataTrainingTechLevelInfo.json#ID=')));
  assert.ok(disclosure.children.at(-1).children.every((item) => item.children[1].textContent.includes('evidence/source/configdata/soldier-training-tech-223-descriptions.v1.json#ID=')));
  if (variant === 'SP') assert.match(visibleText(disclosure), /슬롯·시점·게임 내 적용 의미는 확인되지 않았습니다/);
}
assert.equal(runtime.makeSoldierTrainingTechPresentation({ normalSoldierId: 116 }, 'NORMAL', effectiveFixtureIndex), null,
  'no unapproved Soldier may receive the presentation');

const safeSource = element('p');
runtime.appendSkillDescription(safeSource, '값 <color=#DC143C>+12%</color>\n다음 줄');
assert.ok(safeSource.children.some((child) => child.className === 'skill-description-emphasis'));
assert.equal(visibleText(safeSource), '값 +12%\n다음 줄');
const unsafeSource = element('p');
runtime.appendSkillDescription(unsafeSource, '<img src=x onerror=alert(1)>');
assert.equal(unsafeSource.textContent, '<img src=x onerror=alert(1)>');
assert.equal(unsafeSource.children.length, 0, 'unsupported markup must stay plain text');

console.log('Soldier TrainingTech presentation tests PASS (20 exact claims, approval/effectiveness/revocation gates, safe rendering, scope negatives)');
