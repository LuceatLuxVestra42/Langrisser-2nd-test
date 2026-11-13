import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadInputs, OUTPUT, PATHS, SCOPE, LIMITATIONS } from './hero-15-casting-law-internal.mjs';

// Compare each consumer component directly with its owning Canonical, independently of the projection function.
export function validate(inputs, text) {
  const out = JSON.parse(text);
  assert.deepEqual(Object.keys(out), ['schemaVersion', 'heroId', 'scope', 'limitations', 'canonicalSources', 'templates']);
  assert.equal(out.schemaVersion, 1); assert.equal(out.heroId, 15); assert.equal(out.scope, SCOPE); assert.deepEqual(out.limitations, LIMITATIONS);
  assert.deepEqual(out.canonicalSources, Object.fromEntries(Object.entries(inputs).map(([k,v]) => [k, {path: PATHS[k], scope: v.scope, ...(v.sourceScope === undefined ? {} : {sourceScope: v.sourceScope})}])));
  const heroes = inputs.hero.records.filter(r => r.heroId === 15);
  assert.equal(heroes.length, 5); assert.equal(new Set(heroes.map(r => r.templateId)).size, 5);
  assert.deepEqual(out.templates.map(t => t.reference), heroes);
  const seenLevels = [], seenMaterials = [], seenItems = new Set(); let previousCount = 0, absentCount = 0;
  for (const t of out.templates) {
    assert.deepEqual(Object.keys(t), ['reference','rawDetail','levels']);
    assert.deepEqual(t.rawDetail, inputs.templates.records.find(r => r.templateId === t.reference.templateId));
    const expectedLevels = inputs.levels.records.filter(r => r.templateId === t.reference.templateId);
    assert.deepEqual(t.levels.map(l => l.reference), expectedLevels);
    for (const l of t.levels) {
      assert.deepEqual(Object.keys(l), ['reference','rawDetail','previousReference','propertyRawDetail','materials']);
      const id = l.reference.levelUpInfoId; seenLevels.push(id);
      assert.deepEqual(l.rawDetail, inputs.raw.records.find(r => r.levelUpInfoId === id));
      assert.deepEqual(l.propertyRawDetail, inputs.properties.records.find(r => r.levelUpInfoId === id));
      const prev = inputs.previous.records.filter(r => r.levelUpInfoId === id); assert.ok(prev.length <= 1);
      assert.deepEqual(l.previousReference, prev.length ? {state:'ADMITTED',record:prev[0]} : {state:'NO_ADMITTED_REFERENCE'});
      prev.length ? previousCount++ : absentCount++;
      const materialRows = inputs.materials.records.filter(r => r.levelUpInfoId === id);
      assert.deepEqual(l.materials.map(m => m.reference), materialRows);
      for (const m of l.materials) {
        assert.deepEqual(Object.keys(m), ['reference','itemEndpoint']);
        const endpoints = inputs.materials.itemEndpoints.filter(e => e.itemId === m.reference.rawMaterial.Id);
        assert.equal(endpoints.length, 1); assert.deepEqual(m.itemEndpoint, endpoints[0]);
        seenMaterials.push(m.reference); seenItems.add(m.itemEndpoint.itemId);
      }
    }
  }
  assert.equal(seenLevels.length, 50); assert.equal(new Set(seenLevels).size, 50);
  assert.deepEqual(new Set(seenLevels), new Set(inputs.levels.records.map(r => r.levelUpInfoId)));
  for (const rows of [inputs.raw.records, inputs.properties.records]) assert.deepEqual(new Set(rows.map(r => r.levelUpInfoId)), new Set(seenLevels));
  assert.equal(previousCount, 45); assert.equal(absentCount, 5); assert.equal(inputs.previous.records.length, 45);
  assert.equal(seenMaterials.length, 115); assert.deepEqual(seenMaterials, inputs.materials.records);
  assert.equal(seenItems.size, 18); assert.equal(inputs.materials.itemEndpoints.length, 18);
  assert.deepEqual(seenItems, new Set(inputs.materials.itemEndpoints.map(r => r.itemId)));
  assert.equal(text, `${JSON.stringify(out, null, 2)}\n`);
}
export async function validateFromRoot(root = process.cwd()) { validate(await loadInputs(root), await readFile(resolve(root, OUTPUT), 'utf8')); console.log('Hero 15 Casting Law internal parity: PASS'); }
if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) await validateFromRoot();
