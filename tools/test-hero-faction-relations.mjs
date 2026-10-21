import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const source = process.cwd();
const temp = await mkdtemp(join(tmpdir(), 'langrisser-hero-faction-relations-'));
const repo = join(temp, 'repo');
await cp(source, repo, { recursive: true, filter: (path) => !path.split('/').includes('.git') });

function run(script) {
  return spawnSync(process.execPath, [script], { cwd: repo, encoding: 'utf8' });
}
function expectSuccess(result, label, diagnostic) {
  if (result.error || result.signal !== null || result.status !== 0) {
    throw new Error(`${label}: expected success; status=${result.status}; error=${result.error?.message ?? ''}; output=\n${result.stdout ?? ''}\n${result.stderr ?? ''}`);
  }
  if (!diagnostic.test(`${result.stdout ?? ''}\n${result.stderr ?? ''}`)) throw new Error(`${label}: success diagnostic mismatch`);
}
function expectFailure(result, label, diagnostic) {
  if (result.error || result.signal !== null || !Number.isInteger(result.status) || result.status === 0) {
    throw new Error(`${label}: expected failure; status=${result.status}; error=${result.error?.message ?? ''}; output=\n${result.stdout ?? ''}\n${result.stderr ?? ''}`);
  }
  if (!diagnostic.test(`${result.stdout ?? ''}\n${result.stderr ?? ''}`)) throw new Error(`${label}: failure diagnostic mismatch; output=\n${result.stdout ?? ''}\n${result.stderr ?? ''}`);
}
async function mutateAndRun(path, change, script, label, diagnostic) {
  const fullPath = join(repo, path);
  const original = await readFile(fullPath, 'utf8');
  try {
    const document = JSON.parse(original);
    change(document);
    await writeFile(fullPath, `${JSON.stringify(document, null, 2)}\n`);
    expectFailure(run(script), label, diagnostic);
  } finally {
    await writeFile(fullPath, original);
  }
}

const canonicalPath = 'canonical/hero-faction-relations.v1.json';
const evidencePath = 'evidence/source/hero-faction.v1.json';
const relationValidator = 'tools/validate-hero-faction-relations.mjs';
try {
  expectSuccess(run(relationValidator), 'Faction relation baseline', /28 Canonical Heroes, 65 admitted edges/);

  const generatedPath = join(repo, 'generated/hero-slice.v1.json');
  const generatedBefore = await readFile(generatedPath, 'utf8');
  expectSuccess(run('tools/generate.mjs'), 'Generator with 28-hero Canonical relation owner', /Generated .*hero-slice\.v1\.json/);
  const generatedAfter = await readFile(generatedPath, 'utf8');
  assert.equal(generatedAfter, generatedBefore, 'valid out-of-slice Faction relations changed generated Hero bytes');
  assert.deepEqual(JSON.parse(generatedAfter).heroes.map((hero) => hero.id), [1, 3, 5, 6, 7, 8, 10, 11, 12, 13, 14, 25, 26, 27, 28, 32, 52, 53, 55, 67]);

  await mutateAndRun(canonicalPath, (doc) => { doc.records[0].heroId = 999999; }, 'tools/generate.mjs',
    'Generator rejects Hero endpoint absent from Identity owner', /unknown Hero identity 999999/);
  await mutateAndRun(canonicalPath, (doc) => { doc.records[0].factionId = 999999; doc.records[0].provenance = 'evidence/source/hero-faction.v1.json#ID=999999/RelatedHeros_ID&contains=5'; }, 'tools/generate.mjs',
    'Generator rejects missing Faction endpoint', /unknown Faction 999999/);
  await mutateAndRun(canonicalPath, (doc) => { doc.records.push({ ...doc.records[0] }); }, relationValidator,
    'duplicate Canonical pair', /exactly 65/);
  await mutateAndRun(canonicalPath, (doc) => { doc.records[0].heroId = 40; }, relationValidator,
    'Hero 40 remains outside Faction evidence scope', /out of scope/);
  await mutateAndRun(canonicalPath, (doc) => { doc.records[0].provenance = 'evidence/wrong.json#record=1'; }, relationValidator,
    'Canonical provenance mismatch', /source locator drift/);
  await mutateAndRun(canonicalPath, (doc) => { doc.records = doc.records.filter((row) => !(row.heroId === 5 && row.factionId === 1)); }, relationValidator,
    'existing visible relation cannot be removed', /exactly 65/);
  await mutateAndRun(evidencePath, (doc) => {
    const row = doc.records.find((record) => record.ID === 1);
    row.RelatedHeros_ID = row.RelatedHeros_ID.filter((heroId) => heroId !== 1);
  }, relationValidator, 'Canonical cannot outgrow source membership', /source RelatedHeros_ID target projection differs/);

  process.stdout.write('Hero–Faction relation regression tests: PASS (65-pair admission, endpoint/provenance negatives, Hero 40 exclusion, and byte-identical generated output across generator run)\n');
} finally {
  await rm(temp, { recursive: true, force: true });
}
