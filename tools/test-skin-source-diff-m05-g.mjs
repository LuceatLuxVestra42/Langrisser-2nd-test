import assert from 'node:assert/strict';
import { classifySkinSnapshotDiff } from './classify-skin-source-diff-m05-g.mjs';
import { readFile } from 'node:fs/promises';

const fixture = JSON.parse(await readFile('tools/fixtures/skin-source-diff-m05-g.v1.json', 'utf8'));
const before = structuredClone(fixture.before), after = structuredClone(fixture.after);
const result = classifySkinSnapshotDiff(before, after);
assert.deepEqual(result.changes, [
  { skinId: 8, classification: 'MISSING_RECORD_REVIEW' },
  { skinId: 12, classification: 'CHANGED_CLAIM_REVIEW' },
  { skinId: 50, classification: 'NEW_CLAIM_CANDIDATE' },
]);
assert.equal(result.snapshotChanged, true);
assert.deepEqual(before, fixture.before, 'classifier mutated its inputs');
assert.deepEqual(after, fixture.after, 'classifier mutated its inputs');
assert.throws(() => classifySkinSnapshotDiff({ snapshot: {}, records: [{ skinId: 1 }, { skinId: 1 }] }, fixture.after), /duplicate/);
const unverifiable = structuredClone(fixture.after);
unverifiable.records[0].verificationStatus = 'UNVERIFIABLE';
assert.equal(classifySkinSnapshotDiff(fixture.before, unverifiable).changes.find((row) => row.skinId === 12).classification, 'UNVERIFIABLE_RECORD_REVIEW');
process.stdout.write('M05-G Source Snapshot Diff: PASS (read-only new, changed, missing and snapshot classification)\n');
