import { readFile } from 'node:fs/promises';
import { renderJobGlossary } from './generate.mjs';
import { validateJobGlossary } from './validate-job-glossary.mjs';

const canonical = JSON.parse(await readFile('canonical/job-localizations-ko.v1.json', 'utf8'));
const expected = renderJobGlossary(canonical);
validateJobGlossary(canonical, expected);

const baseline = JSON.parse(expected);
const cases = [
  ['missing record', (data) => { data.jobs.pop(); }],
  ['extra record', (data) => { data.jobs.push({ ...data.jobs.at(-1), jobId: 999999 }); }],
  ['duplicate Job ID', (data) => { data.jobs[1].jobId = data.jobs[0].jobId; }],
  ['wrong Korean name', (data) => { data.jobs[0].nameKo += 'X'; }],
  ['wrong Job ID', (data) => { data.jobs[0].jobId = 999999; }],
  ['wrong ordering', (data) => { data.jobs.reverse(); }],
  ['unsupported field', (data) => { data.jobs[0].source = 'unsupported'; }],
  ['stale generated content', (data) => { data.jobs[0].nameKo += ' stale'; }],
];
for (const [label, mutate] of cases) {
  const candidate = structuredClone(baseline);
  mutate(candidate);
  let rejected = false;
  try { validateJobGlossary(canonical, `${JSON.stringify(candidate, null, 2)}\n`); } catch { rejected = true; }
  if (!rejected) throw new Error(`glossary regression was not rejected: ${label}`);
}
process.stdout.write(`Job glossary regressions: PASS (${cases.length} invalid projections rejected)\n`);
