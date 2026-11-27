import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const lanceTalentEvidence = 'evidence/source/configdata/hero-16-talent.v1.json';
export const lanceTalentDecision = 'docs/decisions/hero-16-talent-publication.v1.json';
export const lanceTalentPublic = 'generated/hero-16-talent-public.v1.json';
const approved = [[2, 3277, '10%'], [3, 3278, '15%'], [4, 3279, '20%'], [5, 3280, '25%'], [6, 3281, '30%']];
const ids = [160, 161, 162, 163, 164, 165];
const jobIds = [401, 403, 302, 202, 405, 306];
const sheet = 'hero/data/란스.js#data[0].Talent[0].Abilities[1].Desc';
const display2 = '"비병" 및 "기병"과 전투 시 공격 방어 +10%.';
const nameKo = '하늘의 사령관';
const surface = 'hero-minimal-detail-16';
const tag = (value) => `对战“飞兵”与“骑兵”部队时，攻击和防御提升<color=#DC143C>${value}</color>。`;
export const selectTalentSkill = (connection, star) => connection.TalentSkill_IDs[star - 1];
const json = async (root, path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));

export async function readLanceTalentSource(root) {
  const src = await json(root, lanceTalentEvidence);
  assert.equal(src.commit, '6475e63ee23d18adf733756c26a14fa9e3ed662c');
  assert.equal(src.repository, 'LuceatLuxVestra42/langrisser-future-guide');
  assert.equal(src.selectionRuleCommit, '57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff');
  assert.equal(src.selectionRule, 'data/hero-basic-combat-stage4-5.v1.json#semanticGates[talentStarProgression]');
  for (const [key, sha] of Object.entries({Hero:'728daab3370f0c7779449663ea02e638677944d4', JobConnection:'cdad8d6fda6edd30c92fbcda53e0f63af1903139', Skill:'dbd7f8f94702bb43d2ceb0091e9755c9aebaed19', Job:'4cbcac591ff5bc8d7cf2dcbf971cf2465f0cb133'})) {
    assert.deepEqual(src.files[key], {path:`data/configdata/ConfigData${key}Info.json`, gitBlobSha1:sha});
  }
  assert.deepEqual(src.hero, {recordIndex:15, ID:16, Star:2, JobConnection_ID:160, UseableJobConnections_ID:ids.slice(1)});
  assert.deepEqual(src.connections.map(row => row.ID), [src.hero.JobConnection_ID,...src.hero.UseableJobConnections_ID]);
  assert.deepEqual(src.connections.map(row => row.Job_ID), jobIds, 'Lance connection Job mismatch');
  assert.deepEqual(src.connections.map(row => row.recordIndex), [104,105,106,107,108,109]);
  for (const row of src.connections) assert.deepEqual(row.TalentSkill_IDs, [3277,3277,3278,3279,3280,3281], 'Lance connection Talent array mismatch');
  assert.deepEqual(src.jobs.map(r => [r.recordIndex,r.ID,r.Name]), [[46,202,'剑士'],[195,306,'皇家骑士'],[254,403,'龙骑士'],[256,405,'龙骑统帅']]);
  assert.deepEqual(src.skills.map(r => [r.recordIndex,r.ID,r.Name,r.Desc]), approved.map(([,id,value],i) => [335+i,id,'空骑统帅',tag(value)]), 'Lance CN source mismatch');
  return src;
}

export function lanceTalentRelations(src) {
  return approved.map(([star, expected]) => {
    const skillId = selectTalentSkill(src.connections[0], star);
    assert.ok(skillId === expected && src.connections.every(c => selectTalentSkill(c, star) === skillId), 'Lance Talent selector mismatch');
    return {heroId:16, star, skillId, provenance:`${lanceTalentEvidence}#/connections/0/TalentSkill_IDs/${star-1}`};
  });
}

export function lanceSkillRecords(src) {
  return src.skills.map(({ID,Name,Desc}, i) => {
    const base = `${lanceTalentEvidence}#/skills/${i}`;
    return {skillId:ID, nameCn:Name, descriptionCn:Desc, provenance:{identity:base+'/ID',name:base+'/Name',description:base+'/Desc'}};
  });
}

export async function generateLanceTalent(root = process.cwd()) {
  const [src, decision, jobs, stars, skills, ko] = await Promise.all([
    readLanceTalentSource(root), ...[lanceTalentDecision,'canonical/hero-job-relations.v1.json','canonical/hero-talent-star-skills.v1.json',
      'canonical/skills.v1.json','canonical/hero-talent-localizations-ko.v1.json'].map(path => json(root,path)),
  ]);
  assert.deepEqual(Object.keys(decision).sort(), ['approval','schemaVersion','scope','status'], 'Lance Talent decision fields');
  assert.equal(decision.schemaVersion, 1, 'Lance Talent decision version');
  assert.equal(decision.status, 'APPROVED', 'Lance Talent publication decision');
  assert.equal(decision.approval?.source, 'https://chatgpt.com/?messageId=Sentinel_1b50121b85848191b3ab27b9166f6246', 'Lance Talent approval source');
  assert.deepEqual(decision.scope, {heroId:16,surface,path:lanceTalentPublic,nameKo,stars:approved.map(([star,id])=>[star,id]),initialDisplayStar:6,
    officialKrProvenanceStatus:'unverified',star2:{status:'PROJECT_DISPLAY_ONLY',skillId:3277,descriptionKoRaw:display2,sheet,
      sheetCommit:'a85bba49dcf073563e7366dc18e96b7ba67c2ae3',sheetBlob:'0be2f806f90c21507a814dc64057921c51b1bd2e'},
    publicFields:{root:['schemaVersion','surface','heroId','officialKrProvenanceStatus','talent'],talent:['nameKo','starDescriptions'],
      star:['star','skillId','descriptionKoRaw','nameCn','descriptionCn']}}, 'Lance Talent decision scope');
  assert.deepEqual(jobs.records.filter(r => r.heroId === 16).map(r => r.jobId).sort((a,b)=>a-b), [...jobIds].sort((a,b)=>a-b), 'Lance Talent Job membership');
  const relations = stars.records.filter(r=>r.heroId===16);
  assert.deepEqual(relations, lanceTalentRelations(src), 'Lance Talent star relations');
  const cn = skills.records.filter(r => approved.some(([,id]) => id === r.skillId));
  assert.deepEqual(cn, lanceSkillRecords(src), 'Lance Talent CN Skill identity');
  const reviewed = ko.descriptionRecords.filter(r=>r.heroId===16);
  assert.deepEqual(reviewed.map(r=>[r.star,r.skillId]), approved.slice(1).map(([star,id])=>[star,id]), 'Lance Talent reviewed KO relations');
  const names = ko.nameRecords.filter(r=>r.heroId===16);
  assert.equal(ko.officialKrProvenanceStatus,'unverified');
  const evidence = 'evidence/source/hero-talent-localizations-ko.v1.json#heroId=16';
  assert.deepEqual(names,[{heroId:16,talentNameKo:nameKo,localizationStatus:'CONFIRMED_EXISTING_KR_REUSE',reviewRequired:false,evidenceClass:'B',provenance:evidence+'&claim=name'}], 'Lance Talent reviewed KO name');
  const starDescriptions = relations.map(({star,skillId},i) => {
    const source = cn[i];
    const row = reviewed.find(r=>r.star===star);
    if (star !== 2) assert.deepEqual(row, {heroId:16,star,skillId,descriptionKoRaw:`"비병" 및 "기병"과 전투 시 공격 방어 <font color="red">+${approved[i][2]}</font>.`,
      localizationStatus:'CONFIRMED_EXISTING_KR_REUSE',reviewRequired:false,evidenceClass:'B',provenance:evidence+`&star=${star}&skillId=${skillId}`}, 'Lance Talent reviewed KO description');
    return {star,skillId,descriptionKoRaw:star===2 ? decision.scope.star2.descriptionKoRaw : row.descriptionKoRaw,nameCn:source.nameCn,descriptionCn:source.descriptionCn};
  });
  return {schemaVersion:1,surface,heroId:16,officialKrProvenanceStatus:'unverified',talent:{nameKo:names[0].talentNameKo,starDescriptions}};
}

export function validateLanceTalentPackage(text, expected) {
  const doc = JSON.parse(text);
  assert.deepEqual(Object.keys(doc).sort(), Object.keys(expected).sort(), 'Lance Talent public keys');
  assert.deepEqual(Object.keys(doc.talent).sort(), ['nameKo','starDescriptions'], 'Lance Talent public keys');
  for (const row of doc.talent.starDescriptions) assert.deepEqual(Object.keys(row).sort(), ['descriptionCn','descriptionKoRaw','nameCn','skillId','star'], 'Lance Talent public row keys');
  assert.deepEqual(doc.talent.starDescriptions.map(r=>[r.star,r.skillId,r.nameCn,r.descriptionCn]),
    expected.talent.starDescriptions.map(r=>[r.star,r.skillId,r.nameCn,r.descriptionCn]), 'Lance Talent final CN row attribution');
  assert.deepEqual(doc, expected, 'Lance Talent public row attribution');
  assert.equal(text, JSON.stringify(expected,null,2)+'\n', 'Lance Talent generated bytes');
}
