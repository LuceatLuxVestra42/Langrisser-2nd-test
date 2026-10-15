import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateExclusiveEquipmentPresentation } from './validate-exclusive-equipment-presentation.mjs';
import { renderExclusiveEquipment } from './generate.mjs';
const read = async (p) => JSON.parse(await readFile(p, 'utf8'));
const [identity, localization, generatedText, frontend] = await Promise.all([
  read('canonical/exclusive-equipment.v1.json'),
  read('canonical/exclusive-equipment-localizations-ko.v1.json'),
  readFile('generated/exclusive-equipment.v1.json', 'utf8'),
  readFile('app.js', 'utf8'),
]);
const generated = JSON.parse(generatedText);
const args = { identity, localization, generated, generatedText, frontend };
assert.equal(validateExclusiveEquipmentPresentation(args).count, 167);
assert.equal(renderExclusiveEquipment(identity, localization), generatedText);
assert.throws(() => validateExclusiveEquipmentPresentation({ ...args, generatedText: generatedText + ' ' }), /stale or non-deterministic/);
const badCount = structuredClone(args); badCount.generated.equipment.pop();
assert.throws(() => validateExclusiveEquipmentPresentation(badCount), /generated population/);
const duplicate = structuredClone(args); duplicate.generated.equipment[1].equipmentId = duplicate.generated.equipment[0].equipmentId;
assert.throws(() => validateExclusiveEquipmentPresentation(duplicate), /duplicate generated/);
const missingName = structuredClone(args); missingName.generated.equipment[0].nameKo = ' ';
assert.throws(() => validateExclusiveEquipmentPresentation(missingName), /missing Korean name/);
const missingEffect = structuredClone(args); missingEffect.generated.equipment[0].effectDescriptionKo = '';
assert.throws(() => validateExclusiveEquipmentPresentation(missingEffect), /missing Korean effect/);
const noFrontend = { ...args, frontend: 'no fetch here' };
assert.throws(() => validateExclusiveEquipmentPresentation(noFrontend), /frontend fetch path/);
const noLocalization = structuredClone(args); noLocalization.localization.records.pop();
assert.throws(() => validateExclusiveEquipmentPresentation(noLocalization), /localization population/);
process.stdout.write('Exclusive Equipment presentation negatives: PASS (population, duplicate, field, freshness, and fetch-path regressions)\n');

// Runtime projection fixtures reuse admitted records only. They do not admit
// a new Snapshot, Equipment ID, localization, or Hero relation.
const generalGenerated = await read('generated/general-ssr-equipment.v1.json');
const start = frontend.indexOf('function addGeneralEquipment(');
const end = frontend.indexOf('function addSpSoldier(', start);
assert.ok(start >= 0 && end > start, 'equipment runtime boundaries are missing');
const equipmentRuntime = frontend.slice(start, end);
const { runInNewContext } = await import('node:vm');
const element = () => ({
  children: [], listeners: {}, value: '', textContent: '', className: '',
  append(...children) { this.children.push(...children); },
  replaceChildren(...children) { this.children = children; },
  addEventListener(type, listener) { this.listeners[type] = listener; },
  focus() {},
});
async function runEquipmentRuntime(general, exclusive) {
  const generalEquipmentContainer = element();
  const exclusiveEquipmentContainer = element();
  const generalInput = element(); const generalClear = element(); const generalCount = element();
  const exclusiveInput = element(); const exclusiveClear = element(); const exclusiveCount = element();
  const selectors = {
    '#general-equipment-search': generalInput, '#general-equipment-clear': generalClear,
    '#general-equipment-count': generalCount, '#exclusive-equipment-search': exclusiveInput,
    '#exclusive-equipment-clear': exclusiveClear, '#exclusive-equipment-count': exclusiveCount,
  };
  const errors = [];
  await runInNewContext('(async () => {\n' + equipmentRuntime + '\n})()', {
    generalEquipmentContainer, exclusiveEquipmentContainer,
    generalEquipmentSearch: generalInput, generalEquipmentClear: generalClear, generalEquipmentCount: generalCount,
    exclusiveEquipmentSearch: exclusiveInput, exclusiveEquipmentClear: exclusiveClear, exclusiveEquipmentCount: exclusiveCount,
    document: { createElement: element, querySelector: (selector) => selectors[selector] },
    fetch: async (path) => ({
      ok: true,
      json: async () => structuredClone(
        path === './generated/general-ssr-equipment.v1.json' ? general : exclusive
      ),
    }),
    console: { error: (error) => errors.push(error.message) },
  });
  return { generalEquipmentContainer, exclusiveEquipmentContainer, generalInput, generalClear, generalCount,
    exclusiveInput, exclusiveClear, exclusiveCount, errors };
}
for (const [generalCount, exclusiveCount] of [[206, 167], [205, 166], [1, 1]]) {
  const general = { ...generalGenerated, equipment: generalGenerated.equipment.slice(0, generalCount) };
  const exclusive = { ...generated, equipment: generated.equipment.slice(0, exclusiveCount) };
  const result = await runEquipmentRuntime(general, exclusive);
  assert.deepEqual(result.errors, []);
  assert.equal(result.generalEquipmentContainer.children.length, generalCount);
  assert.equal(result.exclusiveEquipmentContainer.children.length, exclusiveCount);
  for (const [container, data] of [
    [result.generalEquipmentContainer, general],
    [result.exclusiveEquipmentContainer, exclusive],
  ]) {
    assert.deepEqual(container.children.map((card) => card.children[0].children[1].textContent),
      data.equipment.map((item) => 'Equipment ID ' + item.equipmentId));
    assert.deepEqual(container.children.map((card) => card.children[0].children[0].textContent),
      data.equipment.map((item) => item.nameKo));
    assert.deepEqual(container.children.map((card) => card.children[1].textContent),
      data.equipment.map((item) => item.effectDescriptionKo.replace(/\\n/g, '\n')));
  }
  assert.match(result.generalCount.textContent, new RegExp(`검색 결과 ${generalCount}건 / 전체 ${generalCount}건`));
  assert.match(result.exclusiveCount.textContent, new RegExp(`검색 결과 ${exclusiveCount}건 / 전체 ${exclusiveCount}건`));
  if (generalCount === 206 && exclusiveCount === 167) {
    const originalGeneral = JSON.stringify(general);
    const originalExclusive = JSON.stringify(exclusive);
    const assertFiltered = (input, container, count, query, expected) => {
      input.value = query;
      input.listeners.input();
      assert.equal(container.children.filter((child) => child.className === 'general-equipment-card').length, expected.length);
      assert.match(count.textContent, new RegExp(`검색 결과 ${expected.length}건 / 전체`));
      assert.deepEqual(container.children.filter((child) => child.className === 'general-equipment-card')
        .map((card) => card.children[0].children[1].textContent), expected.map((item) => 'Equipment ID ' + item.equipmentId));
    };
    assertFiltered(result.generalInput, result.generalEquipmentContainer, result.generalCount, '6',
      general.equipment.filter((item) => String(item.equipmentId) === '6'));
    assertFiltered(result.exclusiveInput, result.exclusiveEquipmentContainer, result.exclusiveCount, '273',
      exclusive.equipment.filter((item) => String(item.equipmentId) === '273'));
    assertFiltered(result.generalInput, result.generalEquipmentContainer, result.generalCount,
      general.equipment[0].nameKo.slice(1, 3), general.equipment.filter((item) => item.nameKo.includes(general.equipment[0].nameKo.slice(1, 3))));
    assertFiltered(result.exclusiveInput, result.exclusiveEquipmentContainer, result.exclusiveCount,
      exclusive.equipment[0].nameKo.slice(1, 3), exclusive.equipment.filter((item) => item.nameKo.includes(exclusive.equipment[0].nameKo.slice(1, 3))));
    for (const [input, container, count] of [
      [result.generalInput, result.generalEquipmentContainer, result.generalCount],
      [result.exclusiveInput, result.exclusiveEquipmentContainer, result.exclusiveCount],
    ]) {
      assertFiltered(input, container, count, '999999', []);
      assert.equal(container.children[0].textContent.includes('검색 결과가 없습니다'), true);
      input.value = '없는장비'; input.listeners.input();
      assert.equal(container.children.length, 1);
      assert.equal(container.children[0].textContent.includes('검색 결과가 없습니다'), true);
    }
    result.generalInput.value = '6'; result.generalInput.listeners.input(); result.generalClear.listeners.click();
    result.exclusiveInput.value = '273'; result.exclusiveInput.listeners.input(); result.exclusiveClear.listeners.click();
    assert.equal(result.generalEquipmentContainer.children.length, 206);
    assert.equal(result.exclusiveEquipmentContainer.children.length, 167);
    assert.match(result.generalCount.textContent, /검색 결과 206건 \/ 전체 206건/);
    assert.match(result.exclusiveCount.textContent, /검색 결과 167건 \/ 전체 167건/);
    assert.equal(JSON.stringify(general), originalGeneral);
    assert.equal(JSON.stringify(exclusive), originalExclusive);
  }
}
for (const mutate of [
  (data) => data.equipment.push(structuredClone(data.equipment[0])),
  (data) => { data.equipment[0].nameKo = ' '; },
  (data) => { data.equipment[0].effectDescriptionKo = ''; },
  (data) => { data.equipment[0].equipmentId = String(data.equipment[0].equipmentId); },
  (data) => { data.schemaVersion = 2; },
]) {
  const general = structuredClone(generalGenerated);
  const exclusive = structuredClone(generated);
  mutate(general); mutate(exclusive);
  const result = await runEquipmentRuntime(general, exclusive);
  assert.equal(result.errors.length, 2);
  for (const container of [result.generalEquipmentContainer, result.exclusiveEquipmentContainer]) {
    assert.equal(container.children.length, 1);
    assert.equal(container.children[0].className, 'status status-error');
  }
}
process.stdout.write('Equipment runtime projection: PASS (current IDs/text, count-independent rendering, duplicate/schema/field rejection; no admission mutation)\n');

