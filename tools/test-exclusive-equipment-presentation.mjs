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
