import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const source = process.cwd();
const temp = await mkdtemp(join(tmpdir(), 'production-identities-'));
const repo = join(temp, 'repo');
await cp(source, repo, { recursive: true, filter: (path) => !path.split('/').includes('.git') });
const validator = () => spawnSync(process.execPath, ['tools/validate-production-identities.mjs'], { cwd: repo, encoding: 'utf8' });
const diagnostic = (result) => `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
const readJson = async (path) => JSON.parse(await readFile(join(repo, path), 'utf8'));
const writeJson = async (path, value) => writeFile(join(repo, path), `${JSON.stringify(value, null, 2)}\n`);
try {
  let result = validator();
  assert.equal(result.status, 0, diagnostic(result));

  const canonicalPath = 'canonical/production-identities.v1.json';
  const originalCanonical = await readJson(canonicalPath);
  const missing = structuredClone(originalCanonical);
  missing.records.pop();
  await writeJson(canonicalPath, missing);
  result = validator();
  assert.notEqual(result.status, 0, 'missing identity must fail');
  assert.match(diagnostic(result), /exactly six scoped identities/);
  await writeJson(canonicalPath, originalCanonical);

  const wrongNameProvenance = structuredClone(originalCanonical);
  wrongNameProvenance.records[0].provenance = 'evidence/source/configdata/ConfigDataHeroInfo.hero-production.v1.json#claims/heroId=28';
  await writeJson(canonicalPath, wrongNameProvenance);
  result = validator();
  assert.notEqual(result.status, 0, 'relation evidence must not support a name claim');
  assert.match(diagnostic(result), /name provenance must point to Dictionary Evidence/);

  const wrongName = structuredClone(originalCanonical);
  wrongName.records[0].nameCn = 'wrong title';
  await writeJson(canonicalPath, wrongName);
  result = validator();
  assert.notEqual(result.status, 0, 'dictionary name mismatch must fail');
  assert.match(diagnostic(result), /dictionary\/canonical name parity mismatch/);

  process.stdout.write('Production identity tests: PASS (valid owner, missing identity, name parity and cross-domain provenance negatives)\n');
} finally {
  await rm(temp, { recursive: true, force: true });
}
