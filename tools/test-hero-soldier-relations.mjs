import { createHash } from 'node:crypto';
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';

const source = process.cwd();
const temp = await mkdtemp(join(tmpdir(), 'hero-soldier-readonly-'));
const repo = join(temp, 'repo');
await cp(source, repo, { recursive: true, filter: (path) => !path.split('/').includes('.git') });

const canonicalPath = 'canonical/hero-soldier-relations.v1.json';
const heroPath = 'canonical/hero-identities.v1.json';
const soldierPath = 'canonical/soldiers.v1.json';
const poolPath = 'evidence/source/legacy/hero-soldier/hero-soldier-relations.v1.json';
const validator = 'tools/validate-hero-soldier-relations.mjs';
const full = (path) => join(repo, path);
const run = (...args) => spawnSync(process.execPath, [validator, ...args], { cwd: repo, encoding: 'utf8' });
const [fixtureHeroes, fixtureSoldiers, fixturePool] = await Promise.all([
  readFile(full(heroPath), 'utf8').then((text) => JSON.parse(text)),
  readFile(full(soldierPath), 'utf8').then((text) => JSON.parse(text)),
  readFile(full(poolPath), 'utf8').then((text) => JSON.parse(text)),
]);

function expectFailure(label) {
  const result = run();
  if (result.status === 0) throw new Error(`${label}: expected validator failure`);
}

async function snapshotDirectory(root) {
  const entries = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.name === '.git') continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(path);
      } else if (entry.isFile()) {
        const bytes = await readFile(path);
        entries.push([
          relative(root, path).replaceAll('\\', '/'),
          bytes.length,
          createHash('sha256').update(bytes).digest('hex'),
        ]);
      }
    }
  }
  await walk(root);
  entries.sort((a, b) => a[0].localeCompare(b[0]));
  return JSON.stringify(entries);
}

async function mutateJson(path, change) {
  const target = full(path);
  const original = await readFile(target, 'utf8');
  const value = JSON.parse(original);
  change(value);
  await writeFile(target, `${JSON.stringify(value, null, 2)}\n`);
  return async () => writeFile(target, original);
}

const restores = [];
try {
  const before = await snapshotDirectory(repo);
  const clean = run();
  if (clean.status !== 0) throw new Error(`clean read-only validation failed: ${clean.stdout}${clean.stderr}`);
  const after = await snapshotDirectory(repo);
  if (after !== before) throw new Error('normal Hero-Soldier validator mutated repository content');

  let restore = await mutateJson(canonicalPath, (canonical) => { canonical.records.splice(0, 1); });
  restores.push(restore); expectFailure('missing canonical edge'); await restore(); restores.pop();

  restore = await mutateJson(canonicalPath, (canonical) => {
    const existing = new Set(canonical.records.map((row) => `${row.heroId}:${row.soldierId}`));
    const poolPairs = new Set(fixturePool.edges.map((row) => `${row.heroId}:${row.soldierId}`));
    let candidate;
    for (const hero of fixtureHeroes.records) {
      for (const soldier of fixtureSoldiers.records) {
        const key = `${hero.heroId}:${soldier.id}`;
        if (!existing.has(key) && !poolPairs.has(key)) {
          candidate = { heroId: hero.heroId, soldierId: soldier.id };
          break;
        }
      }
      if (candidate) break;
    }
    if (!candidate) throw new Error('failed to construct unsupported extra pair fixture');
    canonical.records.push({
      ...canonical.records[0],
      ...candidate,
      evidencePoolLocator: `${poolPath}#heroId=${candidate.heroId}&soldierId=${candidate.soldierId}`,
    });
    canonical.records.sort((a, b) => a.heroId - b.heroId || a.soldierId - b.soldierId);
  });
  restores.push(restore); expectFailure('extra canonical edge'); await restore(); restores.pop();

  restore = await mutateJson(canonicalPath, (canonical) => { canonical.records.push({ ...canonical.records[0] }); });
  restores.push(restore); expectFailure('duplicate canonical edge'); await restore(); restores.pop();

  restore = await mutateJson(canonicalPath, (canonical) => {
    canonical.records[0].heroId = 999999;
    canonical.records[0].evidencePoolLocator = `${poolPath}#heroId=999999&soldierId=${canonical.records[0].soldierId}`;
  });
  restores.push(restore); expectFailure('invalid Hero reference'); await restore(); restores.pop();

  restore = await mutateJson(canonicalPath, (canonical) => {
    canonical.records[0].soldierId = 999999;
    canonical.records[0].evidencePoolLocator = `${poolPath}#heroId=${canonical.records[0].heroId}&soldierId=999999`;
  });
  restores.push(restore); expectFailure('invalid Soldier reference'); await restore(); restores.pop();

  restore = await mutateJson(canonicalPath, (canonical) => {
    canonical.records[0].provenance[0].origin.field = 'WrongField';
  });
  restores.push(restore); expectFailure('provenance mismatch'); await restore(); restores.pop();

  restore = await mutateJson(canonicalPath, (canonical) => {
    canonical.records[0].provenance[0].sourceKind = 'UNSUPPORTED_SOURCE_KIND';
  });
  restores.push(restore); expectFailure('unsupported source kind'); await restore(); restores.pop();

  restore = await mutateJson(canonicalPath, (canonical) => { delete canonical.records[0].evidenceClass; });
  restores.push(restore); expectFailure('malformed canonical record'); await restore(); restores.pop();

  const argResult = run('sync', '--apply');
  if (argResult.status === 0) throw new Error('read-only validator accepted removed sync --apply invocation');

  process.stdout.write('Hero-Soldier read-only validator cases: PASS (379/380 positive; missing/extra/duplicate endpoints/provenance/source-kind/malformed negatives; no repository mutation)\n');
} finally {
  for (const restore of restores.reverse()) await restore().catch(() => {});
  await rm(temp, { recursive: true, force: true });
}
