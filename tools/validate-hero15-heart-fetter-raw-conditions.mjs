import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const EVIDENCE_PATH = 'evidence/source/bonds/hero15-heart-fetter-raw-conditions.v1.json';
export const CANONICAL_PATH = 'canonical/hero-heart-fetter-raw-conditions.v1.json';
const PIN = { repository: 'LuceatLuxVestra42/langrisser-future-guide', commit: '6475e63ee23d18adf733756c26a14fa9e3ed662c', tree: '08e1e6c2773730e60b258940e31494f68d65f86a' };
const expected = [
  [4,70421,[70421],7,[[811]],16612,[32857]],
  [4,70422,[70422],7,[[707]],16613,[32858]],
  [7,70423,[70423],7,[[811]],16614,[32859]],
  [7,70424,[70424,9970424],7,[[707],[707]],16615,[32860,32861]],
];
const check = (v,m) => assert.ok(v,m);
const exactKeys = (o, keys, m) => equal(Object.keys(o).sort(), [...keys].sort(), m);
const equal = (a,b,m) => assert.deepEqual(a,b,m);
const hasForbiddenSemantic = (x) => {
  if (!x || typeof x !== 'object') return false;
  if (Array.isArray(x)) return x.some(hasForbiddenSemantic);
  const forbidden = /^(applicableJobIds|jobRestricted|unlockJobIds|activeWhenJob|jobSpecificEffect|finalStatBonus|unlockCondition|reward|battleEffect|combatEffect|gameplayMeaning)$/i;
  return Object.entries(x).some(([k,v]) => forbidden.test(k) || hasForbiddenSemantic(v));
};
export function validateHero15HeartFetterRawConditionsData({ evidence, canonical, references }) {
  exactKeys(evidence,['schemaVersion','claimType','evidenceClass','scope','source','extraction','legacyValidation','claims','limitations'],'evidence schema');
  check(evidence.schemaVersion === 1 && evidence.claimType === 'hero-15-heart-fetter-raw-conditions' && evidence.evidenceClass === 'A', 'evidence contract drift');
  equal(evidence.source && {repository:evidence.source.repository,commit:evidence.source.commit,tree:evidence.source.tree}, PIN, 'pinned source drift');
  equal(evidence.scope, {heroId:15,heartFetterId:15,levels:[4,7],recordCount:4,conditionType7Meaning:'MANUAL_REVIEW'}, 'scope drift');
  check(evidence.extraction?.kind === 'claim-scoped-record-field-projection' && evidence.extraction.sourceBytesCopied === false, 'extraction contract drift');
  check(evidence.extraction.sha256RecomputedFromPinnedBytes.join(',') === 'heroInformation,heartFetter,skillInfo,buffInfo', 'hash verification declaration drift');
  const sources = evidence.source;
  const pins = [
    [sources.heroInformation,'data/configdata/ConfigDataHeroInformationInfo.json','49aef6be8ea1a65d5725c16a05dab94fffa73f92','ee9f81f161f79939e771b16db97329bfaa45872edad0ecbf9dd9285587ebad7e',291],
    [sources.heartFetter,'data/configdata/ConfigDataHeroHeartFetterInfo.json','be61dd6fb14662d70335e833c4c857dda5105f74','7a150f7fd0658ffc9b05d68b8131a677290ab67710f97a22c4e4c4d78ea42b8a',286],
    [sources.skillInfo,'data/configdata/ConfigDataSkillInfo.json','dbd7f8f94702bb43d2ceb0091e9755c9aebaed19','2ff6d67e8c010037597928bccd2dc7b4b9abc0d2a78c9705d816c8218df3e741',27198],
    [sources.buffInfo,'data/configdata/ConfigDataBuffInfo.json','bc7d5c7e5b4ac68b5192955a76cd21b810f36982','ce84692846e4306dc15270ad959d9a258b5e599df5aaef352bc35992f5095225',74054],
  ];
  for (const [s,path,blob,sha,count] of pins) check(s.path===path && s.blobSha1===blob && s.sha256===sha && s.recordCount===count, `source pin drift: ${path}`);
  check(sources.heroInformation.recordIndex===14 && sources.heroInformation.fields.ID===15 && sources.heroInformation.fields.HeroHeartFetterId===15, 'HeroInformation endpoint drift');
  check(sources.heartFetter.recordIndex===13 && sources.heartFetter.fields.ID===15, 'Heart Fetter endpoint drift');
  equal(sources.heartFetter.fields.UnlockSkills_ID, [
    {SkillId:70421,HeartFetterLevel:4},{SkillId:70422,HeartFetterLevel:4},{SkillId:70423,HeartFetterLevel:7},{SkillId:70424,HeartFetterLevel:7},{SkillId:70110,HeartFetterLevel:10}
  ], 'source unlock skill projection drift');
  for (const claim of evidence.claims) exactKeys(claim,['heroId','heartFetterId','heartFetterLevel','skillId','passiveBuffIds','conditions','sourceProvenance'],'evidence claim schema');
  equal(evidence.claims.map(c=>[c.heartFetterLevel,c.skillId,c.passiveBuffIds,c.conditions[0].conditionType,c.conditions.map(x=>x.conditionParams),c.sourceProvenance.skillSourceIndex,c.sourceProvenance.passiveBuffSourceIndices]), expected, 'raw condition claims drift');
  equal(sources.skillInfo.records.map(r=>[r.recordIndex,r.fields.ID,r.fields.PassiveBuffs_ID]), expected.map(x=>[x[5],x[1],x[2]]), 'SkillInfo projections drift');
  equal(sources.buffInfo.records.map(r=>[r.recordIndex,r.fields.ID,r.fields.ConditionType,r.fields.ConditionParam]), [[32857,70421,7,[811]],[32858,70422,7,[707]],[32859,70423,7,[811]],[32860,70424,7,[707]],[32861,9970424,7,[707]]], 'BuffInfo projections drift');
  check(evidence.legacyValidation.repository==='LuceatLuxVestra42/langrisser-future-guide' && evidence.legacyValidation.ref==='57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff' && evidence.legacyValidation.rawConditionContractBlobSha1==='42a815952dc468be59b40f34592a91c70c148654' && evidence.legacyValidation.admissionArtifactBlobSha1==='766c6dcce95c83ca83d30aaa8d341771df9af9b3' && evidence.legacyValidation.publicationArtifactBlobSha1==='94dd23d78c8e45659605c673630911c7531e5730', 'Legacy validation artifact provenance drift');
  check(evidence.legacyValidation.admissionStatus==='PASS' && evidence.legacyValidation.publicationStatus==='PASS', 'legacy validation provenance drift');
  check(evidence.legacyValidation.scope.includes('1,066 raw rows') && evidence.legacyValidation.scope.includes('not as Target Canonical'), 'legacy scope overreach');
  check(evidence.scope.conditionType7Meaning==='MANUAL_REVIEW' && evidence.limitations.some(x=>x.includes('No applicableJobIds')), 'semantic boundary missing');
  equal(references.records.filter(r=>r.referenceKind==='HERO_HEART_FETTER_ID_REFERENCE').map(r=>r.heartFetterId), [15], 'existing Heart Fetter reference missing');
  check(canonical.schemaVersion===1 && canonical.scope==='Hero 15 Heart Fetter Lv4/Lv7 raw source condition fields only; ConditionType and ConditionParam runtime meaning remains MANUAL_REVIEW; no unlock, reward, job-restriction, stat, effect, or publication admission.', 'canonical scope drift');
  equal(canonical.records.length,4,'canonical population drift');
  for (const row of canonical.records) exactKeys(row,['heroId','heartFetterId','heartFetterLevel','skillId','passiveBuffIds','conditions','sourceProvenance','sourceField','provenance'],'canonical record schema');
  equal(canonical.records.map(r=>[r.heroId,r.heartFetterId,r.heartFetterLevel,r.skillId,r.passiveBuffIds,r.conditions,r.sourceField,r.provenance]), evidence.claims.map(c=>[c.heroId,c.heartFetterId,c.heartFetterLevel,c.skillId,c.passiveBuffIds,c.conditions,'ConfigDataBuffInfo.ConditionType+ConditionParam',`${EVIDENCE_PATH}#claims[skillId=${c.skillId}]`]), 'canonical/evidence parity drift');
  check(!hasForbiddenSemantic(canonical), 'unadmitted gameplay meaning found in canonical');
  check(canonical.records.every(r=>r.heroId===15&&r.heartFetterId===15), 'wrong Hero or endpoint');
  check(references.records.length===6, 'existing six Fetter references changed');
  return {records:4, rawConditions:5, conditionType7Meaning:'MANUAL_REVIEW', publication:false};
}
export async function validateHero15HeartFetterRawConditions(root=process.cwd()) {
  const read = async p=>JSON.parse(await readFile(resolve(root,p),'utf8'));
  const [evidence,canonical,references]=await Promise.all([read(EVIDENCE_PATH),read(CANONICAL_PATH),read('canonical/hero-fetter-references.v1.json')]);
  const result=validateHero15HeartFetterRawConditionsData({evidence,canonical,references});
  process.stdout.write('Hero 15 Heart Fetter raw conditions: PASS (4 claims; runtime meaning remains MANUAL_REVIEW; no publication)\n');
  return result;
}
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) await validateHero15HeartFetterRawConditions();
