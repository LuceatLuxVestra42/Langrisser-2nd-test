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
  assert.match(result.stdout, /Hero names=3, star descriptions=12/);
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
  assertPass(run(), 'normal three-name/twelve-description fixture');
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
  const relation = 'canonical/hero-talent-star-skills.v1.json';
  const skills = 'canonical/skills.v1.json';
  await mutateJson(c, (v) => { v.nameRecords.find(row => row.heroId === 15).talentNameKo = '변조 이름'; }, 'Hero 15 Korean Talent name changed', /\[CANONICAL\].*name/);
  await mutateJson(c, (v) => { v.descriptionRecords.find(row => row.heroId === 15 && row.star === 3).descriptionKoRaw += '변조'; }, 'Hero 15 star 3 description changed', /\[CANONICAL\].*parity/);
  await mutateJson(c, (v) => { v.descriptionRecords.find(row => row.heroId === 15 && row.star === 4).descriptionKoRaw += '변조'; }, 'Hero 15 star 4 description changed', /\[CANONICAL\].*parity/);
  await mutateJson(c, (v) => { v.descriptionRecords.find(row => row.heroId === 15 && row.star === 5).descriptionKoRaw += '변조'; }, 'Hero 15 star 5 description changed', /\[CANONICAL\].*parity/);
  await mutateJson(c, (v) => { v.descriptionRecords.find(row => row.heroId === 15 && row.star === 6).descriptionKoRaw += '변조'; }, 'Hero 15 star 6 description changed', /\[CANONICAL\].*parity/);
  await mutateJson(c, (v) => { v.nameRecords.find(row => row.heroId === 15).heroId = 8; }, 'Hero 15 name assigned to another Hero', /\[SCOPE\]/);
  await mutateJson(c, (v) => { v.descriptionRecords.find(row => row.heroId === 15 && row.star === 3).star = 4; }, 'Hero 15 star mismatch', /\[(SCOPE|CANONICAL)\]/);
  await mutateJson(c, (v) => { v.descriptionRecords.find(row => row.heroId === 15 && row.star === 3).skillId = 3214; }, 'Hero 15 Skill ID mismatch', /\[CANONICAL\].*parity/);
  await mutateJson(e, (v) => { v.source.files.find(row => row.heroId === 15).gitBlobSha1 = '0'.repeat(40); }, 'Hero 15 source blob pin changed', /\[SOURCE\].*Hero 15/);
  await mutateJson(e, (v) => { v.source.commitTree = '0'.repeat(40); }, 'pinned source tree changed', /\[SOURCE\]/);
  await mutateJson(e, (v) => { v.records.find(row => row.heroId === 15).nameSourceLocator = 'hero/data/other.js#TalentName'; }, 'Hero 15 name source locator changed', /\[EVIDENCE\].*name source/);
  await mutateJson(e, (v) => { v.descriptions.find(row => row.heroId === 15 && row.star === 3).sourceLocator = 'hero/data/리아나.js#Abilities[3]'; }, 'Hero 15 description source locator changed', /\[PROVENANCE\].*description source/);
  await mutateJson(e, (v) => { v.descriptions.find(row => row.heroId === 15 && row.star === 3).reviewLocator = 'unreviewed'; }, 'Hero 15 review locator removed', /\[PROVENANCE\]/);
  await mutateJson(e, (v) => { v.projectReview.hero15FinalRecord.finalDecision = 'MANUAL_REVIEW'; }, 'Hero 15 unreviewed claim promoted', /\[REVIEW_STATUS\]/);
  await mutateJson(c, (v) => { v.descriptionRecords.find(row => row.heroId === 15 && row.star === 3).localizationStatus = 'UNREVIEWED_TRANSLATION'; }, 'unapproved Hero 15 translation admitted', /\[CANONICAL\].*parity/);
  await mutateJson(c, (v) => { v.officialKrProvenanceStatus = 'verified'; }, 'official Korean provenance falsely approved', /\[CANONICAL\]/);
  await mutateJson(e, (v) => { v.descriptions.find(row => row.heroId === 15 && row.star === 3).reviewRequired = true; }, 'Hero 15 review requirement tampered', /\[PROVENANCE\].*description source\/review/);
  await mutateJson(e, (v) => { v.records.find(row => row.heroId === 15).reviewStatus = 'MANUAL_REVIEW'; }, 'Hero 15 reviewed name status downgraded', /\[EVIDENCE\].*name source or review/);
  await mutateJson(e, (v) => { v.projectReview.hero15FinalRecord.skillIdsByStar['3'] = 3214; }, 'reviewed Skill ID mapping changed', /\[REVIEW_STATUS\]/);
  await mutateJson(relation, (v) => { v.records.find(row => row.heroId === 15 && row.star === 3).skillId = 3214; }, 'Talent relation changed under Localization', /\[RELATION\]/);
  await mutateJson(skills, (v) => { v.records.pop(); }, 'Skill Identity population regression', /\[SKILL_IDENTITY\]/);
  await mutateJson(c, (v) => { v.nameRecords.find(row => row.heroId === 15).publicationApproval = true; }, 'Hero 15 Publication approval added', /\[SCHEMA\]/);
  await mutateJson(c, (v) => { v.nameRecords = v.nameRecords.filter(row => row.heroId !== 6); }, 'existing Hero 6 localization removed', /\[CANONICAL\].*names/);
  await mutateJson(c, (v) => { v.descriptionRecords = v.descriptionRecords.filter(row => row.heroId !== 8 || row.star !== 6); }, 'existing Hero 8 localization removed', /\[CANONICAL\].*descriptions/);
  console.log('Hero Talent Korean localization tests: PASS (normal fixture, 15 existing and 24 Hero 15 negative controls)');
} finally {
  await rm(temp, { recursive: true, force: true });
}
