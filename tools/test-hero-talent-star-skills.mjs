import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const source = process.cwd();
const temp = await mkdtemp(join(tmpdir(), 'hero-talent-star-skills-'));
const repo = join(temp, 'repo');
await cp(source, repo, { recursive: true, filter: (path) => !path.split('/').includes('.git') });
const run = () => spawnSync(process.execPath, ['tools/validate-hero-talent-star-skills.mjs'], { cwd: repo, encoding: 'utf8' });
const assertPass = (result, label) => {
  if (result.error || result.signal || result.status !== 0) throw new Error(`${label} failed: ${result.error?.message || result.signal || result.stderr}`);
  assert.match(result.stdout, /relations=8/);
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
  assertPass(run(), 'normal eight-relation fixture');
  const c = 'canonical/hero-talent-star-skills.v1.json';
  const e = 'evidence/source/hero-talent-star-skills.v1.json';
  const r = 'evidence/source/configdata/ConfigDataJobConnectionInfo.records-hero-5-6-8.json';
  await mutateJson(c, (v) => { v.records.pop(); }, 'missing relation', /\[CANONICAL\]/);
  await mutateJson(c, (v) => { v.records[v.records.length - 1] = { ...v.records[0] }; }, 'duplicate Hero/star', /\[CANONICAL\].*duplicate/);
  await mutateJson(c, (v) => { v.records[0].skillId = 9999; }, 'wrong Skill ID', /\[CANONICAL\].*mismatch/);
  await mutateJson(c, (v) => { v.records[0].heroId = 999; }, 'unregistered Hero endpoint', /\[SCOPE\]|\[ENDPOINT\]/);
  await mutateJson(c, (v) => { v.records[0].star = 7; }, 'out-of-range star', /\[SCOPE\]/);
  await mutateJson(e, (v) => { v.claims[0].star = 0; }, 'array index out of range', /\[SCOPE\]/);
  await mutateJson(r, (v) => { v.find((row) => row.ID === 60).TalentSkill_IDs[3] = 7777; }, 'source array differs from admitted projection', /\[SOURCE\].*mismatch/);
  await mutateJson(r, (v) => { v.find((row) => row.ID === 61).TalentSkill_IDs[3] = 7777; }, 'JobConnection arrays disagree', /\[SOURCE\].*mismatch/);
  await mutateJson(c, (v) => { v.records[0].provenance = 'evidence/source/other.json#heroId=6&star=3'; }, 'invalid provenance locator', /\[PROVENANCE\]/);
  await mutateJson(e, (v) => { v.selectionRule.frozenParity.role = 'INITIAL_RULE_VALIDATION'; }, 'Stage 7 mislabeled as rule origin', /\[PROVENANCE\]/);
  await mutateJson(e, (v) => { v.claims[0].selectionRuleLocator = 'evidence/source/configdata/ConfigDataJobConnectionInfo.records-hero-5-6-8.json#ID=60'; }, 'array evidence substituted for interpretation evidence', /\[PROVENANCE\]/);
  await mutateJson(e, (v) => { v.sourceArrays.records[0].field = 'Skill_IDs'; }, 'wrong source field', /\[SOURCE\]/);
  await mutateJson(e, (v) => { v.claims[0].sourceArrayLocators.pop(); }, 'incomplete connection array provenance', /\[PROVENANCE\]/);
  console.log('Hero Talent star-skill tests: PASS (normal fixture and 13 negative controls)');
} finally {
  await rm(temp, { recursive: true, force: true });
}
