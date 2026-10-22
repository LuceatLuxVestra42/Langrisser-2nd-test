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
  expectSuccess(run(relationValidator), 'Faction relation baseline', /29 Canonical Heroes, 71 admitted edges; 22 presentation Heroes/);

  const generatedPath = join(repo, 'generated/hero-slice.v1.json');
  const generatedBefore = await readFile(generatedPath, 'utf8');
  expectSuccess(run('tools/generate.mjs'), 'Generator with 29-Hero Canonical relation owner', /Generated .*hero-slice\.v1\.json/);
  const generatedAfter = await readFile(generatedPath, 'utf8');
  assert.equal(generatedAfter, generatedBefore, 'deterministic generation changed bytes on its second run');
  const generated = JSON.parse(generatedAfter);
  assert.deepEqual(generated.heroes.map((hero) => hero.id), [1, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 25, 26, 27, 28, 32, 52, 53, 55, 60, 67]);
  assert.deepEqual(generated.heroes.find((hero) => hero.id === 26).factions.map((x) => x.factionId), [3, 6, 7]);
  assert.deepEqual(generated.heroes.find((hero) => hero.id === 27).factions.map((x) => x.factionId), [1, 3, 8]);
  for (const id of [29, 33, 37, 40]) assert.equal(generated.heroes.some((hero) => hero.id === id), false, `Hero ${id} must remain outside Presentation`);

  await mutateAndRun(canonicalPath, (doc) => { doc.records[0].heroId = 999999; }, 'tools/generate.mjs',
    'Generator rejects Hero endpoint absent from Identity owner', /unknown Hero identity 999999/);
  await mutateAndRun(canonicalPath, (doc) => { doc.records[0].factionId = 999999; doc.records[0].provenance = 'evidence/source/hero-faction.v1.json#ID=999999/RelatedHeros_ID&contains=5'; }, 'tools/generate.mjs',
    'Generator rejects missing Faction endpoint', /unknown Faction 999999/);
  await mutateAndRun(canonicalPath, (doc) => { doc.records.push({ ...doc.records[0] }); }, relationValidator,
    'duplicate Canonical pair', /exactly 71/);
  await mutateAndRun(canonicalPath, (doc) => { doc.records.pop(); doc.records.push({ heroId: 30, factionId: 3, provenance: 'evidence/source/hero-faction.v1.json#ID=3/RelatedHeros_ID&contains=30' }); }, relationValidator,
    'source membership outside approved six-edge admission is rejected', /out of scope/);
  await mutateAndRun(canonicalPath, (doc) => { doc.records = doc.records.filter((row) => !(row.heroId === 40 && row.factionId === 3)); }, relationValidator,
    'Hero 40 admitted relation cannot be removed', /exactly 71/);
  await mutateAndRun('canonical/hero-identities.v1.json', (doc) => { doc.records = doc.records.filter((row) => row.heroId !== 40); }, relationValidator,
    'Hero 40 endpoint must exist in the Identity owner', /Hero endpoint 40 missing/);
  await mutateAndRun('canonical/faction-identities.v1.json', (doc) => { doc.records.find((row) => row.factionId === 3).nameCn = '错误名称'; }, 'tools/validate-faction-identities.mjs',
    'Faction 3 identity name must match its source record', /canonical Name differs from source/);
  await mutateAndRun(canonicalPath, (doc) => { doc.records[0].provenance = 'evidence/wrong.json#record=1'; }, relationValidator,
    'Canonical provenance mismatch', /source locator drift/);
  await mutateAndRun(canonicalPath, (doc) => { doc.records = doc.records.filter((row) => !(row.heroId === 5 && row.factionId === 1)); }, relationValidator,
    'existing visible relation cannot be removed', /exactly 71/);
  await mutateAndRun(evidencePath, (doc) => {
    doc.records.find((record) => record.ID === 3).RelatedHeros_ID.push(999999);
  }, relationValidator, 'Faction 3 source packet must preserve exact pinned membership', /pinned source record/);
  await mutateAndRun(evidencePath, (doc) => {
    doc.records.find((record) => record.ID === 3).SuperHero_ID = [26];
  }, relationValidator, 'SuperHero_ID cannot be used as membership evidence', /fields drift/);

  await mutateAndRun(evidencePath, (doc) => {
    const row = doc.records.find((record) => record.ID === 1);
    row.RelatedHeros_ID = row.RelatedHeros_ID.filter((heroId) => heroId !== 1);
  }, relationValidator, 'Canonical cannot outgrow source membership', /source RelatedHeros_ID target projection differs/);

  process.stdout.write('Hero–Faction relation regression tests: PASS (71-pair admission, approved Faction 3 edges, rejected unapproved membership, endpoint/provenance negatives, Presentation parity, and deterministic generation)\n');
} finally {
  await rm(temp, { recursive: true, force: true });
}
