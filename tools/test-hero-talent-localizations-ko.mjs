import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const source = process.cwd();
const temp = await mkdtemp(join(tmpdir(), 'hero-talent-localizations-ko-'));
const repo = join(temp, 'repo');
await cp(source, repo, { recursive: true, filter: (path) => !path.split('/').includes('.git') });
const run = () => spawnSync(process.execPath, ['tools/validate-hero-talent-localizations-ko.mjs'], { cwd: repo, encoding: 'utf8' });
const assertPass = (result, label) => {
  if (result.error || result.signal || result.status !== 0) throw new Error(`${label} failed: ${result.error?.message || result.signal || result.stderr}`);
  assert.match(result.stdout, /Hero names=2, star descriptions=8/);
};
const assertReject = (result, label, pattern) => {
  if (result.error || result.signal || result.status === 0) throw new Error(`${label} was unexpectedly accepted: ${result.error?.message || result.stdout}`);
  assert.match(`${result.stdout}\n${result.stderr}`, pattern, label);
};
async function mutateJson(path, mutate, label, pattern) {
  const full = join(repo, path);
  const original = await readFile(full, 'utf8');
  try {
    const value = JSON.parse(original);
    mutate(value);
    await writeFile(full, `${JSON.stringify(value, null, 2)}\n`);
    assertReject(run(), label, pattern);
  } finally {
    await writeFile(full, original);
  }
}

try {
  assertPass(run(), 'normal two-name/eight-description fixture');
  const c = 'canonical/hero-talent-localizations-ko.v1.json';
  const e = 'evidence/source/hero-talent-localizations-ko.v1.json';
  await mutateJson(c, (v) => { v.nameRecords[0].talentNameKo = '변조 이름'; }, 'mutated Korean Talent name', /\[CANONICAL\].*name/);
  await mutateJson(c, (v) => { v.descriptionRecords[0].descriptionKoRaw += ' 변조'; }, 'mutated Korean description', /\[CANONICAL\].*parity/);
  await mutateJson(e, (v) => { v.descriptions[0].descriptionKoRaw += ' 변조'; }, 'unreviewed description added', /\[EVIDENCE\].*text/);
  await mutateJson(c, (v) => { v.nameRecords[0].heroId = 999; }, 'invalid Hero ID', /\[SCOPE\]/);
  await mutateJson(c, (v) => { v.descriptionRecords[0].star = 2; }, 'invalid star', /\[SCOPE\]/);
  await mutateJson(c, (v) => { v.descriptionRecords[0].skillId = 9999; }, 'invalid Skill ID', /\[CANONICAL\].*parity/);
  await mutateJson(c, (v) => { v.descriptionRecords[1] = { ...v.descriptionRecords[0] }; }, 'duplicate localization key', /\[SCOPE\].*duplicate/);
  await mutateJson(c, (v) => { v.descriptionRecords.pop(); }, 'missing localization key', /\[CANONICAL\].*eight/);
  await mutateJson(c, (v) => { v.descriptionRecords[0].provenance = 'evidence/source/other.json'; }, 'invalid provenance locator', /\[CANONICAL\].*parity/);
  await mutateJson(e, (v) => { v.descriptions[0].reviewRequired = true; }, 'reviewRequired drift', /\[PROVENANCE\].*locator or status/);
  await mutateJson(c, (v) => { v.nameRecords[0].localizationStatus = 'OFFICIAL_KR'; }, 'project review promoted to official', /\[CANONICAL\].*name/);
  await mutateJson(e, (v) => { v.projectReview.finalLocalization.gitBlobSha1 = 'generated-only'; }, 'Legacy artifact pin drift', /\[PROVENANCE\].*pin or scope/);
  await mutateJson(e, (v) => { v.records[0].nameSourceLocator = 'hero/data/other.js#TalentName'; }, 'bad source locator', /\[EVIDENCE\].*name source/);
  await mutateJson(c, (v) => { v.descriptionRecords[0].heroId = 9; }, 'out-of-scope Hero extension', /\[SCOPE\].*unsupported/);
  await mutateJson(c, (v) => { v.descriptionRecords[0].skillId = 3072; }, 'localization no longer matches admitted relation', /\[CANONICAL\].*parity/);
  await mutateJson(e, (v) => { v.projectReview.parityGuard.role = 'STAR_SELECTION_RULE_AUTHORITY'; }, 'parity guard promoted to semantic authority', /\[PROVENANCE\].*Stage 7 guard boundary/);
  console.log('Hero Talent Korean localization tests: PASS (normal fixture and 15 negative controls)');
} finally {
  await rm(temp, { recursive: true, force: true });
}
