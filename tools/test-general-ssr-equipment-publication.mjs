import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateGeneralSsrPublication as validate, loadAndValidateGeneralSsrPublication } from './validate-general-ssr-equipment-publication.mjs';

const read = async path => JSON.parse(await readFile(path, 'utf8'));
const args = {
  canonical: await read('canonical/general-ssr-equipment.v1.json'),
  localization: await read('canonical/general-ssr-equipment-localizations-ko.v1.json'),
  contract: await read('evidence/source/equipment/general-ssr-equipment-population-contract.v1.json'),
  decision: await read('docs/decisions/general-ssr-equipment-publication.v1.json'),
};
const original = structuredClone(args);
const expectedExcluded = [265, 266, 267, 268, 288, 289, 290, 291];
const expectedIds = args.canonical.records.map(({ id }) => id).filter(id => !expectedExcluded.includes(id)).sort((a,b) => a-b);
const loaded = await loadAndValidateGeneralSsrPublication();
assert.equal(loaded.status, 'APPROVED');
assert.deepEqual(loaded.approvedPublicIds, expectedIds);
assert.equal(loaded.approvedPublicIds.length, 198);
const result = validate(args);
assert.deepEqual(result.approvedPublicIds, expectedIds);
assert.deepEqual(args, original, 'validator must not mutate its input');

const draft = structuredClone(args);
draft.decision = {
  schemaVersion: 1, status: 'REVIEW_REQUIRED',
  semanticOwner: args.decision.semanticOwner,
  localizationOwner: args.decision.localizationOwner,
  baselineIdSetSha256: args.decision.baselineIdSetSha256,
  surface: 'generated/general-ssr-equipment.v1.json public general equipment list and detail',
  excludedIds: expectedExcluded,
  proposedRule: 'exact reviewed canonical baseline minus excludedIds',
  source: args.decision.legacyEvidence,
  approval: null,
  limitations: 'No canonical identity or localization change, alias or replacement claim',
};
assert.equal(validate(draft).publication, 'NOT_APPROVED');
assert.deepEqual(validate(draft).approvedPublicIds, []);

const bad = change => { const input = structuredClone(args); change(input); assert.throws(() => validate(input)); };
bad(x => x.decision.status = 'REVIEW_REQUIRED');
bad(x => delete x.decision.approval);
bad(x => x.decision.approval.messageId = 'invented');
bad(x => x.decision.approval.source = 'unverified');
bad(x => x.decision.surface.pop());
bad(x => x.decision.baselineIdSetSha256 = '0'.repeat(64));
bad(x => x.decision.legacyEvidence.locator = 'wrong');
bad(x => x.decision.excludedIds.pop());
bad(x => x.decision.excludedIds.push(6));
bad(x => x.decision.excludedIds[0] = 999999);
bad(x => x.decision.excludedIds[0] = x.decision.excludedIds[1]);
bad(x => x.canonical.records[0].id = 999999);
bad(x => x.canonical.records.push({ ...x.canonical.records[0], id: 999999 }));
bad(x => x.localization.records[0].equipmentId = 999999);
bad(x => x.decision.approvedPublicCount = 197);
bad(x => x.decision.semanticOwner = 'other');
bad(x => x.decision.aliasOfEquipmentId = 1);
const future = structuredClone(args);
future.canonical.records.push({ ...future.canonical.records[0], id: 999999 });
assert.throws(() => validate(future), /206|baseline|population/i);
const missingPublic = structuredClone(args);
missingPublic.canonical.records.pop();
assert.throws(() => validate(missingPublic));

console.log('General SSR publication: approved/review boundaries, exact ID set, provenance, scope, immutability and negative tests PASS (198 public IDs)');
