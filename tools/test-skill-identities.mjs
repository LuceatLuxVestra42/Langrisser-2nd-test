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
  'evidence/source/configdata/ConfigDataSkillInfo.records-soldier-skill-targets-30.v1.json',
  'evidence/source/configdata/ConfigDataSkillInfo.records-hero-15-talent-skills.v1.json',
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
  assert.match(result.stdout, /records=42/);
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
  assertPass(run(), 'normal 42-record fixture');
  const c = 'canonical/skills.v1.json';
  const e = 'evidence/source/configdata/ConfigDataSkillInfo.records-hero-6-8-talent-skills.v1.json';
  const se = 'evidence/source/configdata/ConfigDataSkillInfo.records-soldier-skill-targets-30.v1.json';
  const t = 'canonical/hero-talent-star-skills.v1.json';
  const h15 = 'evidence/source/configdata/ConfigDataSkillInfo.records-hero-15-talent-skills.v1.json';
  await mutateJson(c, (v) => { v.records.pop(); }, 'missing Skill', /\[CANONICAL\]/);
  await mutateJson(c, (v) => { v.records.push({ ...v.records[0], skillId: 99999 }); }, 'unapproved Skill ID', /\[CANONICAL\]/);
  await mutateJson(c, (v) => { v.records[1].skillId = v.records[0].skillId; }, 'duplicate Skill ID', /\[CANONICAL\]/);
  await mutateJson(c, (v) => { v.records[0].nameCn = '改名'; }, 'wrong source Name', /\[CANONICAL\]/);
  await mutateJson(c, (v) => { v.records[0].descriptionCn += '改'; }, 'wrong source Desc', /\[CANONICAL\]/);
  await mutateJson(c, (v) => { v.records[0].provenance.description = 'evidence/source/other.json'; }, 'invalid field provenance', /\[PROVENANCE\]/);
  await mutateJson(c, (v) => { v.records[0].nameKo = '추정 번역'; }, 'unreviewed Korean localization', /\[SCHEMA\]/);
  await mutateJson(c, (v) => { v.records[0].effectFormula = 'guessed'; }, 'unadmitted combat formula', /\[SCHEMA\]/);
  await mutateJson(c, (v) => { v.records[12].nameCn = '변조'; }, 'new source Name changed', /\[CANONICAL\]/);
  await mutateJson(c, (v) => { v.records[12].descriptionCn += '变'; }, 'new source Desc changed', /\[CANONICAL\]/);
  await mutateJson(c, (v) => { v.records[12].skillId = String(v.records[12].skillId); }, 'new identity ID type changed', /\[CANONICAL\]/);
  await mutateJson(c, (v) => { v.records[12].provenance.name = `${se}#ID=60666/Desc`; }, 'new field locator changed', /\[PROVENANCE\]/);
  await mutateJson(c, (v) => { v.records[12].gameLevel = 1; }, 'unadmitted game level meaning', /\[SCHEMA\]/);
  await mutateJson(c, (v) => { v.records[12].soldierRelation = 115; }, 'unadmitted Soldier relation', /\[SCHEMA\]/);
  await mutateJson(c, (v) => { v.records[12].trainingTechSkillId = 65110; }, 'unadmitted TrainingTech join', /\[SCHEMA\]/);
  await mutateJson(se, (v) => { v.records[0].rawRecord.Name = '변조'; }, 'new evidence Name differs from canonical', /\[CANONICAL\]/);
  await mutateJson(se, (v) => { v.records.pop(); }, 'new evidence record removed', /\[SOLDIER_EVIDENCE\]/);
  await mutateJson(se, (v) => { v.source.commit = '0'.repeat(40); }, 'new evidence source commit changed', /\[SOLDIER_EVIDENCE\]/);
  await mutateJson(e, (v) => { v.source.gitBlobSha1 = 'wrong'; }, 'wrong source blob pin', /\[SOURCE_PIN\]/);
  await mutateJson(e, (v) => { v.records[0].rawRecord.ID = 3072; }, 'source ID/locator mismatch', /\[SOURCE_RECORDS\]/);
  await mutateJson(e, (v) => { v.records[0].sourceRecordIndex += 1; }, 'wrong index locator', /\[SOURCE_RECORDS\]/);
  await mutateJson(e, (v) => { v.records[0].rawRecord.Desc += '改'; }, 'mutated preserved source field', /\[SOURCE_RECORDS\]/);
  await mutateJson(e, (v) => { v.fieldMeaningContract.gitBlobSha1 = 'wrong'; }, 'wrong field meaning contract pin', /\[FIELD_CONTRACT\]/);
  await mutateJson(e, (v) => { v.claimEvidence.fieldDisplayMeaning = 'A'; }, 'overstated evidence class', /\[EVIDENCE_CLASS\]/);
  await mutateJson(e, (v) => { v.scope.skillIds.push(99999); }, 'out-of-scope ID extension', /\[SCOPE\]/);
  await mutateJson(t, (v) => { v.records = v.records.filter((row) => !(row.heroId === 8 && row.star === 6)); }, 'Talent relation parity regression', /\[TALENT_PARITY\]/);

  await mutateJson(c,v=>{v.records[8].skillId=99998;},'Hero15 ID changed',/\\[CANONICAL\\]/);
  await mutateJson(c,v=>{v.records[9].skillId=v.records[8].skillId;},'Hero15 duplicate ID',/\\[CANONICAL\\]/);
  await mutateJson(c,v=>{v.records.splice(8,1);},'Hero15 missing ID',/\\[CANONICAL\\]/);
  await mutateJson(c,v=>{v.records[8].nameCn='改名';},'Hero15 Name changed',/\\[CANONICAL\\]/);
  await mutateJson(c,v=>{v.records[11].descriptionCn+='变';},'Hero15 Desc changed',/\\[CANONICAL\\]/);
  await mutateJson(c,v=>{v.records[8].provenance.name=h15+'#ID=3212/Desc';},'Hero15 Canonical provenance changed',/\\[PROVENANCE\\]/);
  await mutateJson(c,v=>{v.records[8].nameKo='미승인';},'Hero15 Korean name unapproved',/\\[SCHEMA\\]/);
  await mutateJson(c,v=>{v.records[8].effectFormula='guess';},'Hero15 formula unapproved',/\\[SCHEMA\\]/);
  await mutateJson(c,v=>{v.records[8].heroRelation=15;},'Hero15 relation unapproved',/\\[SCHEMA\\]/);
  await mutateJson(h15,v=>{v.source.gitBlobSha1='0'.repeat(40);},'Hero15 source blob changed',/\\[HERO15_SOURCE_PIN\\]/);
  await mutateJson(h15,v=>{v.source.sha256='0'.repeat(64);},'Hero15 source hash changed',/\\[HERO15_SOURCE_PIN\\]/);
  await mutateJson(h15,v=>{v.source.sourceIndex.recordIndices['3212']=308;},'Hero15 source index changed',/\\[HERO15_SOURCE_PIN\\]/);
  await mutateJson(h15,v=>{v.records[0].sourceRecordIndex=308;},'Hero15 source row index changed',/\\[HERO15_SOURCE_RECORDS\\]/);
  await mutateJson(h15,v=>{v.records[0].sourceRecordLocator='bad';},'Hero15 source locator changed',/\\[HERO15_SOURCE_RECORDS\\]/);
  await mutateJson(h15,v=>{v.records[0].rawRecord.ID=3214;},'Hero15 raw ID changed',/\\[HERO15_SOURCE_RECORDS\\]/);
  await mutateJson(h15,v=>{v.records[0].rawRecord.Name='改名';},'Hero15 raw Name changed',/\\[HERO15_SOURCE_RECORDS\\]/);
  await mutateJson(h15,v=>{v.records[0].rawRecord.Desc+='变';},'Hero15 raw Desc changed',/\\[HERO15_SOURCE_RECORDS\\]/);
  await mutateJson(h15,v=>{v.records[0].fieldProvenance.Desc+='other';},'Hero15 field locator changed',/\\[HERO15_PROVENANCE\\]/);
  await mutateJson(h15,v=>{v.fieldMeaningContract.gitBlobSha1='wrong';},'Hero15 predecessor meaning pin changed',/\\[HERO15_FIELD_CONTRACT\\]/);
  await mutateJson(h15,v=>{v.claimEvidence.sourceSha256='A';},'Hero15 hash evidence class overstated',/\\[HERO15_EVIDENCE_CLASS\\]/);
  await mutateJson(h15,v=>{v.publicationApproval=true;},'Hero15 publication falsely claimed',/\\[HERO15_BOUNDARY\\]/);
  await mutateJson(t,v=>{v.records[8].skillId=3214;},'Hero15 Talent relation regression',/\\[TALENT_PARITY\\]/);

  console.log('Skill identity tests: PASS (normal fixture and 48 negative controls)');
} finally {
  await rm(temp, { recursive: true, force: true });
}
