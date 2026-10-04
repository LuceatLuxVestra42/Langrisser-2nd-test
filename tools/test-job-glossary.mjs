import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderJobGlossary } from './generate.mjs';
import { validateJobGlossary } from './validate-job-glossary.mjs';

const canonical = JSON.parse(await readFile('canonical/job-localizations-ko.v1.json', 'utf8'));
const expected = renderJobGlossary(canonical);
validateJobGlossary(canonical, expected);

const baseline = JSON.parse(expected);

function expectValidationFailure(runValidation, expectedDiagnostic, label) {
  assert.throws(runValidation, expectedDiagnostic, `glossary regression: ${label}`);
}

assert.throws(
  () => expectValidationFailure(
    () => { throw new Error('unrelated prerequisite/runtime failure'); },
    /generated Job glossary is not in ascending numeric Job ID order/,
    'wrong-diagnostic fixture',
  ),
  assert.AssertionError,
  'unrelated exceptions must not satisfy a glossary negative assertion',
);
const cases = [
  ['missing record', (data) => { data.jobs.pop(); }, /generated Job glossary record count does not match canonical/],
  ['extra record', (data) => { data.jobs.push({ ...data.jobs.at(-1), jobId: 999999 }); }, /generated Job glossary record count does not match canonical/],
  ['duplicate Job ID', (data) => { data.jobs[1].jobId = data.jobs[0].jobId; }, /generated Job glossary IDs are invalid or duplicated/],
  ['wrong Korean name', (data) => { data.jobs[0].nameKo += 'X'; }, /generated Korean name does not match canonical Job \d+/],
  ['wrong Job ID', (data) => { data.jobs[0].jobId = 999999; }, /generated Job glossary ID set does not match canonical/],
  ['wrong ordering', (data) => { data.jobs.reverse(); }, /generated Job glossary is not in ascending numeric Job ID order/],
  ['unsupported field', (data) => { data.jobs[0].source = 'unsupported'; }, /generated Job \d+ schema fields do not match exactly/],
  ['stale generated content', (data) => { data.jobs[0].nameKo += ' stale'; }, /generated Korean name does not match canonical Job \d+/],
];
for (const [label, mutate, expectedDiagnostic] of cases) {
  const candidate = structuredClone(baseline);
  mutate(candidate);
  expectValidationFailure(
    () => validateJobGlossary(canonical, `${JSON.stringify(candidate, null, 2)}\n`),
    expectedDiagnostic,
    label,
  );
}
process.stdout.write(`Job glossary regressions: PASS (${cases.length} invalid projections rejected)\n`);
