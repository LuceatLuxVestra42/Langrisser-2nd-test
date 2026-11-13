import assert from 'node:assert/strict';
import { loadInputs, render } from './hero-15-casting-law-internal.mjs';
import { validate } from './validate-hero-15-casting-law-internal.mjs';
const inputs = await loadInputs();
const text = render(inputs); validate(inputs, text); assert.equal(render(inputs), text);
for (const mutate of [
  o => { o.heroId = 16; },
  o => { o.templates.pop(); },
  o => { o.templates[0].levels.reverse(); },
  o => { o.templates[0].levels[1].previousReference = {state:'NO_ADMITTED_REFERENCE'}; },
  o => { o.templates[0].levels[0].propertyRawDetail.properties[0].rawValue = -1; },
  o => { o.templates[0].levels[0].propertyRawDetail.properties[4].rawValue = 0; },
  o => { o.templates[0].levels[0].materials.push(o.templates[0].levels[0].materials[0]); },
  o => { o.templates[0].levels[1].materials.reverse(); },
  o => { o.templates[0].levels[0].materials[0].itemEndpoint.itemId = -1; },
  o => { o.templates[0].levels[0].rawDetail.rawFields.LevelUpGoldCost = 0; },
  o => { o.templates[0].levels[0].newRule = 'invented'; },
]) {
  const altered = JSON.parse(text); mutate(altered);
  assert.throws(() => validate(inputs, `${JSON.stringify(altered, null, 2)}\n`));
}
console.log('Hero 15 Casting Law internal negative tests: PASS');
