import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const source = process.cwd();
const temp = await mkdtemp(join(tmpdir(), 'skill-identities-'));
const repo = join(temp, 'repo');
const paths = [
  'canonical/skills.v1.json',
  'canonical/hero-talent-star-skills.v1.json',
  'evidence/source/configdata/ConfigDataSkillInfo.records-hero-6-8-talent-skills.v1.json',
  'tools/validate-skill-identities.mjs',
];
await Promise.all(paths.map(async (path) => {
  const target = join(repo, path);
  await mkdir(dirname(target), { recursive: true });
  await cp(join(source, path), target);
}));
const run = () => spawnSync(process.execPath, ['tools/validate-skill-identities.mjs'], { cwd: repo, encoding: 'utf8' });
const assertPass = (result, label) => {
  if (result.error || result.signal || result.status !== 0) throw new Error(`${label} failed: ${result.error?.message || result.signal || result.stderr}`);
  assert.match(result.stdout, /records=8/);
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
  assertPass(run(), 'normal eight-record fixture');
  const c = 'canonical/skills.v1.json';
  const e = 'evidence/source/configdata/ConfigDataSkillInfo.records-hero-6-8-talent-skills.v1.json';
  const t = 'canonical/hero-talent-star-skills.v1.json';
  await mutateJson(c, (v) => { v.records.pop(); }, 'missing Skill', /\[CANONICAL\]/);
  await mutateJson(c, (v) => { v.records.push({ ...v.records[0], skillId: 99999 }); }, 'unapproved Skill ID', /\[CANONICAL\]/);
  await mutateJson(c, (v) => { v.records[1].skillId = v.records[0].skillId; }, 'duplicate Skill ID', /\[CANONICAL\]/);
  await mutateJson(c, (v) => { v.records[0].nameCn = '改名'; }, 'wrong source Name', /\[CANONICAL\]/);
  await mutateJson(c, (v) => { v.records[0].descriptionCn += '改'; }, 'wrong source Desc', /\[CANONICAL\]/);
  await mutateJson(c, (v) => { v.records[0].provenance.description = 'evidence/source/other.json'; }, 'invalid field provenance', /\[PROVENANCE\]/);
  await mutateJson(c, (v) => { v.records[0].nameKo = '추정 번역'; }, 'unreviewed Korean localization', /\[SCHEMA\]/);
  await mutateJson(c, (v) => { v.records[0].effectFormula = 'guessed'; }, 'unadmitted combat formula', /\[SCHEMA\]/);
  await mutateJson(e, (v) => { v.source.gitBlobSha1 = 'wrong'; }, 'wrong source blob pin', /\[SOURCE_PIN\]/);
  await mutateJson(e, (v) => { v.records[0].rawRecord.ID = 3072; }, 'source ID/locator mismatch', /\[SOURCE_RECORDS\]/);
  await mutateJson(e, (v) => { v.records[0].sourceRecordIndex += 1; }, 'wrong index locator', /\[SOURCE_RECORDS\]/);
  await mutateJson(e, (v) => { v.records[0].rawRecord.Desc += '改'; }, 'mutated preserved source field', /\[SOURCE_RECORDS\]/);
  await mutateJson(e, (v) => { v.fieldMeaningContract.gitBlobSha1 = 'wrong'; }, 'wrong field meaning contract pin', /\[FIELD_CONTRACT\]/);
  await mutateJson(e, (v) => { v.claimEvidence.fieldDisplayMeaning = 'A'; }, 'overstated evidence class', /\[EVIDENCE_CLASS\]/);
  await mutateJson(e, (v) => { v.scope.skillIds.push(99999); }, 'out-of-scope ID extension', /\[SCOPE\]/);
  await mutateJson(t, (v) => { v.records.pop(); }, 'Talent relation parity regression', /\[TALENT_PARITY\]/);
  console.log('Skill identity tests: PASS (normal fixture and 16 negative controls)');
} finally {
  await rm(temp, { recursive: true, force: true });
}
