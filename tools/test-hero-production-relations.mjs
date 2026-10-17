import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const source = process.cwd();
const temp = await mkdtemp(join(tmpdir(), 'hero-production-relations-'));
const repo = join(temp, 'repo');
await cp(source, repo, { recursive: true, filter: (path) => !path.split('/').includes('.git') });
const validator = () => spawnSync(process.execPath, ['tools/validate-hero-production-relations.mjs'], { cwd: repo, encoding: 'utf8' });
const diagnostic = (result) => `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
const readJson = async (path) => JSON.parse(await readFile(join(repo, path), 'utf8'));
const writeJson = async (path, value) => writeFile(join(repo, path), `${JSON.stringify(value, null, 2)}\n`);
try {
  let result = validator();
  assert.equal(result.status, 0, diagnostic(result));

  const canonicalPath = 'canonical/hero-production-relations.v1.json';
  const originalCanonical = await readJson(canonicalPath);
  const missing = structuredClone(originalCanonical);
  missing.records.pop();
  await writeJson(canonicalPath, missing);
  result = validator();
  assert.notEqual(result.status, 0, 'missing relation must fail');
  assert.match(diagnostic(result), /exactly seven scoped edges/);
  await writeJson(canonicalPath, originalCanonical);

  const wrongEndpoint = structuredClone(originalCanonical);
  wrongEndpoint.records[0].productionId = 999;
  await writeJson(canonicalPath, wrongEndpoint);
  result = validator();
  assert.notEqual(result.status, 0, 'unknown endpoint must fail');
  assert.match(diagnostic(result), /unresolved endpoint|differs from Legacy relation projection/);
  await writeJson(canonicalPath, originalCanonical);

  const wrongProvenance = structuredClone(originalCanonical);
  wrongProvenance.records[0].provenance = 'evidence/source/hero-origin-dictionary.v1.json#records/productionId=4';
  await writeJson(canonicalPath, wrongProvenance);
  result = validator();
  assert.notEqual(result.status, 0, 'dictionary evidence must not support a relation claim');
  assert.match(diagnostic(result), /relation provenance must point to HeroBelongProduction evidence/);

  const duplicate = structuredClone(originalCanonical);
  duplicate.records.push(structuredClone(duplicate.records[0]));
  await writeJson(canonicalPath, duplicate);
  result = validator();
  assert.notEqual(result.status, 0, 'duplicate relation must fail');
  assert.match(diagnostic(result), /exactly seven scoped edges/);

  process.stdout.write('Hero–Production relation tests: PASS (valid owner, missing, duplicate, unknown endpoint and cross-domain provenance negatives)\n');
} finally {
  await rm(temp, { recursive: true, force: true });
}
