import { ordinaryCanonical, ordinaryDecision, ordinaryEvidence, ordinaryPublic, ordinaryPublicV2, ordinaryDecisionV2, ordinaryDecisionV3, ordinaryPublicV3 } from './hero-16-ordinary-skills-publication-contract.mjs';
import { lanceTalentDecision, lanceTalentPublic } from './hero-16-talent-publication-contract.mjs';
import { HERO_15_SOLDIER_TEXT_DECISION, HERO_15_SOLDIER_TEXT_PUBLIC } from './hero-15-soldier-text-publication-contract.mjs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, mkdtemp, mkdir, rm, cp, writeFile, symlink, copyFile, rename } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildSite, publicSitePaths, validatePublicSiteDirectory } from './build.mjs';
import { TRAINING_TECH_DECISION_RECORD_PATH } from './soldier-training-tech-presentation-contract.mjs';
import { EXCLUSIVE_EQUIPMENT_HERO_NAVIGATION_PATH, EXCLUSIVE_EQUIPMENT_HERO_PUBLICATION_PATH } from './exclusive-equipment-hero-navigation-contract.mjs';
import { slotGoldDecisionPath, bondKeyDecisionPath, HERO_15_INTEGRATED_PUBLICATION_PATH, HERO_15_MINIMAL_DETAIL_PATH } from './hero-15-integrated-publication-contract.mjs';
import { HERO_15_TALENT_PUBLIC_PATH } from './hero-15-talent-publication-contract.mjs';
import { HERO_16_JOB_PATH_DECISION, HERO_16_PROFILE_DECISION, HERO_16_INTEGRATED_PUBLICATION_PATH, HERO_16_MINIMAL_DETAIL_PATH } from './hero-16-integrated-publication-contract.mjs';
import { HERO_MINIMAL_DETAIL_BATCH_PATH, HERO_MINIMAL_DETAIL_BATCH_PUBLICATION_PATH } from './hero-minimal-detail-batch-contract.mjs';
import { HERO_MINIMAL_DETAIL_TEN_BATCH_PATH, HERO_MINIMAL_DETAIL_TEN_BATCH_PUBLICATION_PATH } from './hero-minimal-detail-ten-batch-contract.mjs';
import { HERO_MINIMAL_DETAIL_TWENTY_BATCH_PATH, HERO_MINIMAL_DETAIL_TWENTY_BATCH_PUBLICATION_PATH } from './hero-minimal-detail-twenty-batch-contract.mjs';
import { HERO_MINIMAL_DETAIL_THIRTY_BATCH_PATH, HERO_MINIMAL_DETAIL_THIRTY_BATCH_PUBLICATION_PATH } from './hero-minimal-detail-thirty-batch-contract.mjs';
import { HERO_MINIMAL_DETAIL_THIRTY_ONE_BATCH_PATH, HERO_MINIMAL_DETAIL_THIRTY_ONE_BATCH_PUBLICATION_PATH } from './hero-minimal-detail-thirty-one-batch-contract.mjs';
import { HERO_MINIMAL_DETAIL_FORTY_BATCH, HERO_MINIMAL_DETAIL_FORTY_BATCH_PATH, HERO_MINIMAL_DETAIL_FORTY_BATCH_PUBLICATION_PATH } from './hero-minimal-detail-forty-batch-contract.mjs';

const heroes = JSON.parse(await readFile('canonical/heroes.v1.json', 'utf8'));
const decision = JSON.parse(await readFile(TRAINING_TECH_DECISION_RECORD_PATH, 'utf8'));
const exclusiveHeroDecision = JSON.parse(await readFile(EXCLUSIVE_EQUIPMENT_HERO_PUBLICATION_PATH, 'utf8'));
const hero15IntegratedDecision = JSON.parse(await readFile(HERO_15_INTEGRATED_PUBLICATION_PATH, 'utf8'));
const hero16IntegratedDecision = JSON.parse(await readFile(HERO_16_INTEGRATED_PUBLICATION_PATH, 'utf8'));
const heroMinimalDetailBatchDecision = JSON.parse(await readFile(HERO_MINIMAL_DETAIL_BATCH_PUBLICATION_PATH, 'utf8'));
const heroMinimalDetailBatchConsumer = JSON.parse(await readFile(HERO_MINIMAL_DETAIL_BATCH_PATH, 'utf8'));
const heroMinimalDetailTenBatchDecision = JSON.parse(await readFile(HERO_MINIMAL_DETAIL_TEN_BATCH_PUBLICATION_PATH, 'utf8'));
const heroMinimalDetailTenBatchConsumer = JSON.parse(await readFile(HERO_MINIMAL_DETAIL_TEN_BATCH_PATH, 'utf8'));
const heroMinimalDetailTwentyBatchDecision = JSON.parse(await readFile(HERO_MINIMAL_DETAIL_TWENTY_BATCH_PUBLICATION_PATH, 'utf8'));
const heroMinimalDetailTwentyBatchConsumer = JSON.parse(await readFile(HERO_MINIMAL_DETAIL_TWENTY_BATCH_PATH, 'utf8'));
const heroMinimalDetailThirtyBatchDecision = JSON.parse(await readFile(HERO_MINIMAL_DETAIL_THIRTY_BATCH_PUBLICATION_PATH, 'utf8'));
const heroMinimalDetailThirtyBatchConsumer = JSON.parse(await readFile(HERO_MINIMAL_DETAIL_THIRTY_BATCH_PATH, 'utf8'));
const heroMinimalDetailThirtyOneBatchDecision = JSON.parse(await readFile(HERO_MINIMAL_DETAIL_THIRTY_ONE_BATCH_PUBLICATION_PATH, 'utf8'));
const heroMinimalDetailThirtyOneBatchConsumer = JSON.parse(await readFile(HERO_MINIMAL_DETAIL_THIRTY_ONE_BATCH_PATH, 'utf8'));
const heroMinimalDetailFortyBatchDecision = JSON.parse(await readFile(HERO_MINIMAL_DETAIL_FORTY_BATCH_PUBLICATION_PATH, 'utf8'));
const heroMinimalDetailFortyBatchConsumer = JSON.parse(await readFile(HERO_MINIMAL_DETAIL_FORTY_BATCH_PATH, 'utf8'));
const temp = await mkdtemp(join(tmpdir(), 'public-build-test-'));
const output = join(temp, 'site');
const trainingPath = 'generated/soldier-training-tech-descriptions.v1.json';
const skinConsumerPath = 'generated/skin-consumer.v1.json';
const publicConsumerPath = 'generated/skin-consumer-public-m05-g.v1.json';
const publicAssetsPath = 'generated/skin-assets-public-m05-g.v1.json';
const heroIndexPath = 'generated/hero-index.v1.json';
const heroIndex = JSON.parse(await readFile(heroIndexPath, 'utf8'));
const fullDetailPublicationDecision = JSON.parse(await readFile('docs/decisions/hero-index-publication.v1.json', 'utf8'));
const fullDetailGeneratedPath = 'generated/hero-slice.v1.json';
const fullDetailGenerated = JSON.parse(await readFile(fullDetailGeneratedPath, 'utf8'));
const publicAssets = JSON.parse(await readFile(publicAssetsPath, 'utf8'));
const skinAssetPaths = publicAssets.assets.map((row) => row.imageUrl.slice(2));
const expectedSkinRows = JSON.parse(await readFile(skinConsumerPath, 'utf8')).skins;
const expectedPublicRows = JSON.parse(await readFile(publicConsumerPath, 'utf8')).skins;
async function checkHeroDetailBuildFailures() {
  const bond1Path = 'docs/decisions/hero-15-minimal-bond1-key-totals-publication.v1.json';
  const bond2Path = 'docs/decisions/hero-15-minimal-bond2-key-totals-publication.v1.json';
  const bond1 = JSON.parse(await readFile(bond1Path, 'utf8'));
  const approvedApp = await readFile('app.js');
  const normalPackage = join(temp, 'approved-keys');
  const modes = ['--output-dir', '--verify-dir'];
  const run = (cwd, mode, destination) => {
    const result = spawnSync(process.execPath, ['tools/build.mjs', mode, destination], { cwd, encoding: 'utf8' });
    assert.ifError(result.error);
    assert.equal(result.signal, null);
    return result;
  };
  for (const mode of modes) {
    const result = run(process.cwd(), mode, normalPackage);
    assert.equal(result.status, 0, result.stderr);
  }
  assert.deepEqual(await readFile(join(normalPackage, 'app.js')), approvedApp);

  const skillDecisionPath = 'docs/decisions/hero-15-minimal-ordinary-skills-publication.v1.json';
  const templatePath = 'canonical/casting-law-template-raw-details.v1.json';
  const membership = 'canonical/hero-job-relations.v1.json';
  const advancement = 'canonical/hero-job-advancement-relations.v1.json';
  const talentError = message => () => 'AssertionError [ERR_ASSERTION]: ' + message;
  const cases = [
    ...[
      ['evidence/source/hero-16-cv-presence.v1.json', 'missing Lance PRESENT row',
        d=>{d.records=d.records.filter(r=>r.heroId!==16);}, 'Hero 16 CharImage 16 PRESENT evidence missing or mismatched'],
      ['evidence/localization/hero-16-cv-ko-freeze.v1.json', 'wrong frozen Korean CV',
        d=>{d.records[0].nameKr='다른 성우';}, 'Hero 16 frozen CV Korean name mismatch'],
      ['evidence/localization/hero-16-cv-ko-freeze.v1.json', 'unconfirmed frozen CV',
        d=>{d.records[0].status='PENDING';}, 'Hero 16 frozen CV confirmation status mismatch'],
      ['evidence/localization/hero-16-cv-ko-freeze.v1.json', 'wrong frozen CV source',
        d=>{d.records[0].sourceValue='小清水亚美';}, 'Hero 16 frozen CV source value mismatch'],
      ['evidence/source/configdata/hero-name-master.records-hero-ko-localization-expansion.v1.json', 'missing Lance Chinese name',
        d=>{d.records=d.records.filter(r=>r.heroId!==16);}, 'Hero 16 verified Chinese name mismatch'],
      ['evidence/source/configdata/ConfigDataHeroInfo.record-hero-16-name-eng.v1.json', 'Lance English name on another Hero',
        d=>{d.records[0].ID=15;}, 'Hero 16 original name attribution mismatch'],
      ['evidence/source/configdata/ConfigDataHeroInfo.record-hero-16-name-eng.v1.json', 'Lance points to another CharImage',
        d=>{d.records[0].CharImage_ID=15;}, 'Hero 16 CharImage foreign key or CV endpoint mismatch'],
      ['canonical/hero-profile-cv-names.v1.json', 'missing Lance CV claim',
        d=>{d.records=d.records.filter(r=>r.heroId!==16);}, 'Hero 16 CV Canonical claim or provenance mismatch'],
      ...['sourceNames','voiceActor'].map(field=>[HERO_16_PROFILE_DECISION, 'missing profile approval for '+field,
        d=>{delete d.nameAndVoice[field];}, 'Hero 16 original names and voice publication scope mismatch']),
    ].map(([decisionPath,name,mutate,message])=>({decisionPath,name,mutate,error:()=>'Error: '+message})),
    ...[[5025,202],['10303·10305',306],[10105,405]].map(([skill,job])=>({
      decisionPath:membership, name:`Skill ${skill} missing Hero 16–Job ${job}`,
      mutate:doc=>{ doc.records = doc.records.filter(r=>!(r.heroId===16 && r.jobId===job)); },
      error:talentError(`${skill}의 Hero 16–Job ${job} 소속 누락 또는 출처 불일치`),
    })),
    ...[
      [165, 0, 1653, 1651, 10305],
      [164, 2, 1641, 1643, 10105],
    ].map(([connection,slot,wrong,expected,skill])=>({
      decisionPath:ordinaryEvidence, name:`Skill ${skill}: Connection ${connection} [${slot}] only`,
      mutate:d=>{d.connections.find(r=>r.ID===connection)[`JobLevels_ID/${slot}`]=wrong;},
      error:talentError(`Skill ${skill} requires Connection ${connection} JobLevels_ID[${slot}]=${expected}`),
    })),
    {decisionPath:ordinaryEvidence,name:'1651 and 1653 acquisitions exchanged',mutate:d=>{
      const a=d.levels.find(r=>r.ID===1651), b=d.levels.find(r=>r.ID===1653);
      [a.GotSkill_ID,b.GotSkill_ID]=[b.GotSkill_ID,a.GotSkill_ID];
    },error:talentError('Lance ordinary GotSkill_ID source mismatch')},
    {decisionPath:ordinaryEvidence,name:'new source descriptions exchanged',mutate:d=>{
      const a=d.skills.find(r=>r.ID===10305), b=d.skills.find(r=>r.ID===10105);
      [a.Desc,b.Desc]=[b.Desc,a.Desc];
    },error:talentError('Lance ordinary Desc hash mismatch')},
    ...[[10305,'TypeText','指挥'],[10305,'CDText',undefined],[10105,'DistanceText',undefined],[10105,'RangeText',undefined]]
      .map(([id,field,value])=>({decisionPath:ordinaryEvidence,name:`passive ${id} invalid ${field}`,
        mutate:d=>{const row=d.skills.find(r=>r.ID===id); if (value===undefined) delete row[field]; else row[field]=value;},
        error:talentError(`Lance ordinary Skill ${id} source metadata`)})),
    {decisionPath:ordinaryDecisionV3,name:'missing v3 decision',error:path=>`Error: ENOENT: no such file or directory, open '${path}'`},
    ...[10418,11819].map(id=>({decisionPath:ordinaryDecisionV3,name:`v3 decision admits ${id}`,
      mutate:d=>{d.rows.push({...d.rows[0],skillId:id});},error:talentError('Lance ordinary v3 publication scope mismatch')})),
    ...['행동 종료 시','1턴 지속'].map(phrase=>({decisionPath:ordinaryDecisionV3,name:'defense threat decision omits '+phrase,
      mutate:d=>{const row=d.rows.find(r=>r.skillId===10105);row.descriptionKo=row.descriptionKo.replace(phrase,'');},
      error:talentError('Lance ordinary v3 publication scope mismatch')})),
    {decisionPath:ordinaryPublicV3,finalFile:true,name:'v3 passive area published',mutate:d=>{
      d.ordinarySkills.find(r=>r.skillId===10305).areaLabelKo='범위 2칸';
    },error:talentError('Lance ordinary public row fields')},
    {decisionPath:ordinaryPublicV3,finalFile:true,name:'v3 payload with v2 version',
      mutate:d=>{d.schemaVersion=2;},error:talentError('Lance ordinary public values')},
    { decisionPath:ordinaryEvidence, name:'10403 direct reference missing', mutate:doc=>{ delete doc.hero['Skills_ID/0']; },
      error:talentError('Lance Hero 16 direct skill or usable connection source mismatch') },
    { decisionPath:ordinaryCanonical, name:'5025 substituted with direct acquisition', mutate:doc=>{
      const row = doc.records.find(r=>r.skillId===5025);
      for (const field of ['jobId','jobLevelId','jobLevelIndex','connectionId']) delete row[field];
      row.provenance.acquisition = ordinaryEvidence+'#/hero/Skills_ID~10';
    }, error:talentError('Lance ordinary acquisition or metadata mismatch') },
    { decisionPath:ordinaryEvidence, name:'10303 JobLevels_ID index changed', mutate:doc=>{
      const row = doc.connections.find(r=>r.ID===165);
      row['JobLevels_ID/1']=row['JobLevels_ID/2'];
      delete row['JobLevels_ID/2'];
    }, error:talentError('Skill 10303 requires Connection 165 JobLevels_ID[2]=1653') },
    { decisionPath:ordinaryEvidence, name:'10403 and 5025 cooldowns exchanged', mutate:doc=>{
      const wind=doc.skills.find(r=>r.ID===10403), heal=doc.skills.find(r=>r.ID===5025);
      [wind.CDText,heal.CDText]=[heal.CDText,wind.CDText];
    }, error:talentError('Lance ordinary Skill 10403 source metadata') },
    ...[[5025,'TypeText','物理伤害'],[10303,'TypeText','物理伤害'],[10403,'DistanceText','1圈'],[10303,'CDText',undefined]].map(([id,key,value])=>({
      decisionPath:ordinaryEvidence, name:`Skill ${id} invalid ${key}`,
      mutate:doc=>{const row=doc.skills.find(r=>r.ID===id); if (value===undefined) delete row[key]; else row[key]=value;},
      error:talentError(`Lance ordinary Skill ${id} source metadata`),
    })),
    { decisionPath:ordinaryDecisionV2, name:'v2 decision missing',error:path=>`Error: ENOENT: no such file or directory, open '${path}'` },
    ...[
      ['path',d=>{d.publicPath=ordinaryPublic;}],
      ['out of scope 10418',d=>{d.rows.push({...d.rows[0],skillId:10418});}],
      ['wind area label',d=>{d.rows[0].areaLabelKo='범위 1칸';}],
    ].map(([name,mutate])=>({decisionPath:ordinaryDecisionV2,name:'v2 decision '+name,mutate,error:talentError('Lance ordinary v2 publication scope mismatch')})),
    ...[
      ['sixth skill',d=>{d.ordinarySkills.push({...d.ordinarySkills[0],skillId:10418});},'public row count'],
      ['iconPath',d=>{d.ordinarySkills[0].iconPath='invalid.png';},'public row fields'],
      ['passive cooldown',d=>{d.ordinarySkills[4].cooldownLabelKo='-';},'public row fields'],
      ['heal lacks cooldown',d=>{delete d.ordinarySkills[3].cooldownLabelKo;},'public row fields'],
      ['altered description',d=>{d.ordinarySkills[0].descriptionKo+='!';},'public values'],
      ['wrong version',d=>{d.schemaVersion=1;},'public values'],
    ].map(([name,mutate,reason])=>({decisionPath:ordinaryPublicV2,finalFile:true,name:'v2 '+name,mutate,error:talentError('Lance ordinary '+reason)})),
    { decisionPath:ordinaryPublic, finalFile:true, name:'v1 altered description', mutate:d=>{d.ordinarySkills[0].descriptionKo+='!';},
      error:talentError('Lance ordinary v1 digest') },
    { decisionPath:ordinaryEvidence, name:'ordinary GotSkill_ID swapped', mutate:({levels})=>{
      [levels[0].GotSkill_ID,levels[1].GotSkill_ID]=[levels[1].GotSkill_ID,levels[0].GotSkill_ID];
    }, error:talentError('Lance ordinary GotSkill_ID source mismatch') },
    { decisionPath:ordinaryCanonical, name:'ordinary 10311 acquisition missing',
      mutate:doc=>{doc.records=doc.records.filter(r=>r.skillId!==10311);}, error:talentError('Lance ordinary acquisition or metadata mismatch') },
    { decisionPath:ordinaryDecision, name:'ordinary decision missing', error:path=>`Error: ENOENT: no such file or directory, open '${path}'` },
    { decisionPath:ordinaryDecision, name:'ordinary decision third skill',
      mutate:doc=>{doc.rows.push({...doc.rows[0],skillId:10705});}, error:talentError('Lance ordinary publication scope mismatch') },
    { decisionPath:ordinaryPublic, finalFile:true, name:'final ordinary third skill',
      mutate:doc=>{doc.ordinarySkills.push({...doc.ordinarySkills[0],skillId:10705});}, error:talentError('Lance ordinary public row count') },
    { decisionPath:ordinaryPublic, finalFile:true, name:'final ordinary iconPath',
      mutate:doc=>{doc.ordinarySkills[1].iconPath='unexpected.png';}, error:talentError('Lance ordinary public row fields') },

    { decisionPath: membership, name: 'Lance Talent Job 403 omitted',
      mutate: doc => { doc.records = doc.records.filter(r=>!(r.heroId===16 && r.jobId===403)); },
      error: talentError('Lance Talent Job membership') },
    { decisionPath:'canonical/hero-talent-star-skills.v1.json', name:'Lance two-star relation missing',
      mutate: doc => { doc.records = doc.records.filter(r=>!(r.heroId===16 && r.star===2)); }, error:talentError('Lance Talent star relations') },
    { decisionPath:'canonical/skills.v1.json', name:'Lance CN Skill 3277 missing',
      mutate: doc => { doc.records = doc.records.filter(r=>r.skillId!==3277); }, error:talentError('Lance Talent CN Skill identity') },
    { decisionPath:'canonical/hero-talent-localizations-ko.v1.json', name:'Lance three-star reviewed text missing',
      mutate: doc => { doc.descriptionRecords = doc.descriptionRecords.filter(r=>!(r.heroId===16 && r.star===3)); }, error:talentError('Lance Talent reviewed KO relations') },
    { decisionPath:'canonical/hero-talent-localizations-ko.v1.json', name:'Lance two-star promoted to reviewed KO',
      mutate: doc => { doc.descriptionRecords.push({...doc.descriptionRecords.find(r=>r.heroId===16),star:2,skillId:3277}); },
      error:talentError('Lance Talent reviewed KO relations') },
    { decisionPath:lanceTalentDecision, name:'Lance Talent publication missing',
      error: path => `Error: ENOENT: no such file or directory, open '${path}'` },
    { decisionPath:lanceTalentDecision, name:'Lance display decision status changed',
      mutate: doc => { doc.scope.star2.status='CONFIRMED_EXISTING_KR_REUSE'; }, error:talentError('Lance Talent decision scope') },
    { decisionPath:lanceTalentDecision, name:'Lance two-star decision attached to 3278',
      mutate: doc => { doc.scope.star2.skillId=3278; }, error:talentError('Lance Talent decision scope') },
    { decisionPath:lanceTalentDecision, name:'Lance two-star decision wording changed',
      mutate: doc => { doc.scope.star2.descriptionKoRaw+=' '; }, error:talentError('Lance Talent decision scope') },
    { decisionPath:lanceTalentDecision, name:'Lance decision internal field publication',
      mutate: doc => { doc.scope.publicFields.star.push('connectionId'); }, error:talentError('Lance Talent decision scope') },
    { decisionPath:lanceTalentPublic, finalFile:true, name:'Lance generated internal field',
      mutate: doc => { doc.talent.starDescriptions[0].connectionId=160; }, error:talentError('Lance Talent public row keys') },
    { decisionPath:lanceTalentPublic, finalFile:true, name:'Lance final CN two and three stars switched',
      mutate: doc => {
        const [two,three]=doc.talent.starDescriptions;
        [two.descriptionCn,three.descriptionCn]=[three.descriptionCn,two.descriptionCn];
      }, error:talentError('Lance Talent final CN row attribution') },

    ...[401, 302].map(jobId => ({
      decisionPath: membership, name: `lance-job-${jobId}-missing`,
      mutate: doc => { doc.records = doc.records.filter(row => !(row.heroId === 16 && row.jobId === jobId)); },
      error: () => `Error: Hero 16 job path membership mismatch for Job ${jobId}`,
    })),
    { decisionPath: advancement, name: 'lance-edge-missing', mutate: doc => { doc.records = doc.records.filter(row => row.heroId !== 16); },
      error: () => 'Error: Hero 16 job path edge count mismatch' },
    { decisionPath: advancement, name: 'lance-edge-reversed', mutate: doc => {
      const e = doc.records.find(row => row.heroId === 16);
      [e.predecessorJobId, e.successorJobId] = [e.successorJobId, e.predecessorJobId];
      [e.predecessorConnectionId, e.successorConnectionId] = [e.successorConnectionId, e.predecessorConnectionId];
    }, error: () => 'Error: Hero 16 job path edge direction mismatch' },
    { decisionPath: 'canonical/job-localizations-ko.v1.json', name: 'lance-job-names-swapped', mutate: doc => {
      const from = doc.records.find(row => row.jobId === 401);
      const to = doc.records.find(row => row.jobId === 302);
      [from.nameKo, to.nameKo] = [to.nameKo, from.nameKo];
    }, error: () => 'Error: Hero 16 job path localization mismatch' },
    { decisionPath: HERO_16_JOB_PATH_DECISION, name: 'lance-job-decision-missing',
      error: path => `Error: ENOENT: no such file or directory, open '${path}'` },
    { decisionPath: HERO_16_JOB_PATH_DECISION, name: 'lance-job-decision-reversed', mutate: doc => {
      [doc.predecessor, doc.successor] = [doc.successor, doc.predecessor];
    }, error: () => 'Error: Hero 16 job path publication scope mismatch' },
    { decisionPath: HERO_16_PROFILE_DECISION, name: 'lance-decision-missing',
      error: path => `Error: ENOENT: no such file or directory, open '${path}'` },
    { decisionPath: HERO_16_PROFILE_DECISION, name: 'lance-decision-excludes-7', mutate: doc => { doc.factionIds.pop(); },
      error: () => 'Error: Hero 16 profile publication scope mismatch' },
    { decisionPath: 'canonical/hero-rarities.v1.json', name: 'lance-rarity-missing',
      mutate: doc => { doc.records = doc.records.filter(row => row.heroId !== 16); },
      error: () => 'Error: Hero 16 profile Canonical rarity mismatch' },
    { decisionPath: 'canonical/hero-faction-relations.v1.json', name: 'lance-membership-7-missing',
      mutate: doc => { doc.records = doc.records.filter(row => !(row.heroId === 16 && row.factionId === 7)); },
      error: () => 'Error: Hero 16 profile Canonical faction relations mismatch' },
    { decisionPath: slotGoldDecisionPath, name: 'slot-gold-missing',
      error: path => `Error: ENOENT: no such file or directory, open '${path}'` },
    { decisionPath: slotGoldDecisionPath, name: 'slot-gold-accessory-missing', mutate: decision => { decision.slots.pop(); },
      error: () => 'Error: Central Discipline slot gold decision scope mismatch' },
    { decisionPath: templatePath, name: 'equal-gold-weapon-references-swapped', mutate: ({ records }) => {
      const first = records.find(row => row.templateId === 14).rawRecord;
      const second = records.find(row => row.templateId === 12).rawRecord;
      [first.CastingLawLevelUpInfoList, second.CastingLawLevelUpInfoList] = [second.CastingLawLevelUpInfoList, first.CastingLawLevelUpInfoList];
    }, error: () => 'Error: Central Discipline slot LevelUp references mismatch for Template 14' },
    { decisionPath: templatePath, name: 'armor-equipment-type-changed', mutate: ({ records }) => {
      records.find(row => row.templateId === 37).rawRecord.EquipmentType = 3;
    }, error: () => 'Error: Central Discipline EquipmentType mismatch for Template 37' },
    { decisionPath: skillDecisionPath, name: 'freeze-missing', mutate: decision => { delete decision.freezeDisplay; },
      error: () => 'Error: Hero 15 Freeze display decision or source mismatch' },
    { decisionPath: skillDecisionPath, name: 'freeze-incomplete', mutate: decision => {
      decision.freezeDisplay.textKo = '적 1부대에 1.5배의 마법 피해를 준다.';
    }, error: () => 'Error: Hero 15 Freeze display decision or source mismatch' },
    { decisionPath: skillDecisionPath, name: 'shield-missing', mutate: decision => { delete decision.shieldDisplay; },
      error: () => 'Error: Hero 15 Shield display decision or source mismatch' },
    { decisionPath: skillDecisionPath, name: 'shield-duration', mutate: decision => {
      decision.shieldDisplay.textKo = decision.shieldDisplay.textKo.replace('2턴 동안 지속된다', '쿨타임 2행동이다');
    }, error: () => 'Error: Hero 15 Shield display decision or source mismatch' },
    { decisionPath: skillDecisionPath, name: 'meditation-missing', mutate: decision => { delete decision.meditationDisplay; },
      error: () => 'Error: Hero 15 Meditation display decision or source mismatch' },
    { decisionPath: skillDecisionPath, name: 'meditation-threshold', mutate: decision => {
      decision.meditationDisplay.textKo = decision.meditationDisplay.textKo.replace('90% 이상', '90% 초과');
    }, error: () => 'Error: Hero 15 Meditation display decision or source mismatch' },
    { decisionPath: bondKeyDecisionPath, name: 'icons-missing', error: path => `Error: ENOENT: no such file or directory, open '${path}'` },
    { decisionPath: bondKeyDecisionPath, name: 'icons-scope', mutate: decision => { decision.groups.pop(); },
      error: () => 'Error: Bond key icon decision scope mismatch' },
    { decisionPath: bond1Path, name: 'bond1-missing', error: path => `Error: ENOENT: no such file or directory, open '${path}'` },
    { decisionPath: bond1Path, name: 'bond1-scope', mutate: decision => { decision.approval.scope = 'Liana Bond 2'; },
      error: () => 'Error: Bond 1 key approval scope mismatch' },
    { decisionPath: bond1Path, name: 'bond1-webp', mutate: decision => {
      const [first, second] = decision.source.nameEvidence.items;
      [first.comparisonWebp, second.comparisonWebp] = [second.comparisonWebp, first.comparisonWebp];
    }, error: () => 'Error: Bond 1 key comparison WebP source mismatch for ID 3200' },
    { decisionPath: bond2Path, name: 'bond2-missing', error: path => `Error: ENOENT: no such file or directory, open '${path}'` },
    { decisionPath: bond2Path, name: 'bond2-scope', mutate: decision => { decision.approval.scope = bond1.approval.scope; },
      error: () => 'Error: Bond 2 key approval scope mismatch' },
    { decisionPath: bond2Path, name: 'bond2-webp', mutate: decision => {
      const [, second, third] = decision.source.nameEvidence.items;
      [second.comparisonWebp, third.comparisonWebp] = [third.comparisonWebp, second.comparisonWebp];
    }, error: () => 'Error: Bond 2 key comparison WebP source mismatch for ID 3201' },
  ];
  for (const test of cases) {
    for (const mode of modes) {
      const fixture = await mkdtemp(join(temp, `keys-${test.name}-`));
      const source = join(fixture, 'source');
      const destination = join(fixture, 'package');
      await cp(process.cwd(), source, { recursive: true, filter: path => path !== join(process.cwd(), '.git') });
      if (mode === '--verify-dir') await cp(normalPackage, destination, { recursive: true });
      const path = join(test.finalFile && mode === '--verify-dir' ? destination : source, test.decisionPath);
      if (test.mutate) {
        const decision = JSON.parse(await readFile(path, 'utf8'));
        test.mutate(decision);
        await writeFile(path, JSON.stringify(decision, null, 2) + '\n');
      } else {
        await rm(path);
      }
      assert.deepEqual(await readFile(join(source, 'app.js')), approvedApp);
      const result = run(source, mode, destination);
      assert.equal(result.status, 1, `${test.name} ${mode}: ${result.stderr}`);
      assert.ok(result.stderr.split('\n').includes(test.error(path)), result.stderr);
      console.log(`Hero detail ${mode}: rejected ${test.name} (exit ${result.status})`);
      await rm(fixture, { recursive: true });
    }
  }

  for (const file of [lanceTalentPublic,ordinaryPublic,ordinaryPublicV2,ordinaryPublicV3]) for (const mode of modes) {
    const root = await mkdtemp(join(temp, 'lance-json-missing-'));
    const source = join(root, 'source');
    const destination = join(root, 'package');
    await cp(process.cwd(), source, {recursive:true,filter:path=>path!==join(process.cwd(),'.git')});
    if (mode === '--verify-dir') await cp(normalPackage,destination,{recursive:true});
    await rm(join(mode === '--verify-dir' ? destination : source, file));
    const result = run(source,mode,destination);
    assert.equal(result.status,1);
    assert.ok(result.stderr.split('\n').some(line=>line.includes('ENOENT') && line.includes(file)),result.stderr);
    console.log(`Lance ${mode}: rejected missing ${file}`);
    await rm(root,{recursive:true});
  }
  for (const mode of modes) {
    const root = await mkdtemp(join(temp, 'lance-selector-'));
    const source = join(root, 'source');
    const destination = join(root, 'package');
    await cp(process.cwd(),source,{recursive:true,filter:path=>path!==join(process.cwd(),'.git')});
    if (mode === '--verify-dir') await cp(normalPackage,destination,{recursive:true});
    const owner = join(source,'tools/hero-16-talent-publication-contract.mjs');
    const correct = await readFile(owner,'utf8');
    const broken = correct.replace('connection.TalentSkill_IDs[star - 1]', 'connection.TalentSkill_IDs[star === 2 ? 0 : star - 1]');
    assert.notEqual(broken,correct);
    await writeFile(owner,broken);
    const result = run(source,mode,destination);
    assert.equal(result.status,1);
    assert.match(result.stderr,/AssertionError \[ERR_ASSERTION\]: Lance two-star selector must use index 1/);
    console.log(`Lance ${mode}: rejected production selector reading index zero`);
    await rm(root,{recursive:true});
  }
  const firstIcon = 'assets/bond-materials/FetterMaterial01.png';
  const secondIcon = 'assets/bond-materials/FetterMaterial02.png';
  async function changeRenderer(root, before, after) {
    const file = join(root, 'app.js');
    const original = await readFile(file, 'utf8');
    assert.equal(original.split(before).length, 2, 'renderer mutation must have one target');
    const changed = original.replace(before, () => after);
    await writeFile(file, changed);
    // Keep the cache key valid so the packaged renderer itself is exercised.
    const html = join(root, 'index.html');
    const digest = createHash('sha256').update(changed).digest('hex');
    await writeFile(html, (await readFile(html, 'utf8')).replace(/app\.js\?v=[a-f0-9]{64}/, 'app.js?v=' + digest));
  }
  const selector = 'displayDescriptions[skillId] ?? descriptionKo';
  const rendererCases = [
    ['Lance ordinary cost and cooldown swapped', 'Packaged Lance ordinary skill row text or placement',
      '`${row.cost}코스트`, ...range', '`${data.ordinarySkills[i===1 ? 2 : i===2 ? 1 : i].cost}코스트`, ...range.map((value,j)=>j===0 && (i===1 || i===2) ? data.ordinarySkills[3-i].cooldownLabelKo : value)'],
    ['Lance ordinary 10311 type changed', 'Packaged Lance ordinary skill row text or placement',
      'labels.push([row.nameKo, row.typeLabelKo,', "labels.push([row.nameKo, row.skillId === 10311 ? '패시브' : row.typeLabelKo,"],

    ...[
      ['attack command after charge', '[...labels.slice(0,4),labels[5],labels[4],labels[6]]'],
      ['passive descriptions exchanged', 'labels.map((line,i)=>(i===4 || i===6) ? line.replace(data.ordinarySkills[i].descriptionKo,data.ordinarySkills[10-i].descriptionKo) : line)'],
      ['order', 'labels.reverse()'], ['duplication', '[...labels, labels[0]]'],
      ['description attribution', 'labels.map((line,i)=>i===0 ? line.replace(data.ordinarySkills[0].descriptionKo,data.ordinarySkills[3].descriptionKo) : line)'],
    ].map(([name,expression])=>['Lance v3 '+name,'Packaged Lance ordinary skill row text or placement',
      "renderMinimalDetailList('일반 스킬', labels)",`renderMinimalDetailList('일반 스킬', ${expression})`]),
    ['Lance original names and CV exchanged','Packaged Hero 16 profile text or placement mismatch',
      "'중국어명 · 兰斯 / 영문명 · Lance', '성우 · 모가미 츠구오'", "'성우 · 모가미 츠구오', '중국어명 · 兰斯 / 영문명 · Lance'"],
    ['Lance profile paragraphs moved to Liana','Lance profile paragraph attribution',
      'void loadHero16Talent(hero16MinimalDetailContainer.children[0]);',
      `const lanceCard = hero16MinimalDetailContainer.children[0];
       const nodes = Array.from(lanceCard.children);
       const moved = nodes.slice(5,7);
       lanceCard.replaceChildren(...nodes.filter(node=>!moved.includes(node)));
       hero15MinimalDetailContainer.children[0].append(...moved);
       void loadHero16Talent(lanceCard);`],
    ['Lance job path reversed', 'Packaged Hero 16 job path text or direction mismatch',
      '전직 · 호크 나이트 → 하이랜더', '전직 · 하이랜더 → 호크 나이트'],
    ['Lance factions 4 and 7 swapped', 'Packaged Hero 16 profile text or placement mismatch',
      '진영 · 빛의 군단 · 제국의 빛 · 전략의 대가', '진영 · 빛의 군단 · 전략의 대가 · 제국의 빛'],
    ['Weapon subtotal labels swapped', 'Packaged Central Discipline slot subtotal order or label',
      "['무기 1', '무기 2', '갑옷', '장신구']", "['무기 2', '무기 1', '갑옷', '장신구']"],
    ['Freeze on Skill 10804', 'Packaged Skill 10705 row attribution or description mismatch', selector, 'skillId === 10705 ? descriptionKo : displayDescriptions[skillId === 10804 ? 10705 : skillId] ?? descriptionKo'],
    ['Shield omitted', 'Packaged Skill 10804 row attribution or description mismatch', selector, 'skillId === 10804 ? descriptionKo : ' + selector],
    ['Meditation omitted', 'Packaged Skill 6009 row attribution or description mismatch', selector, 'skillId === 6009 ? descriptionKo : ' + selector],
    ['Shield cooldown in effect text', 'Packaged Skill 10804 row attribution or description mismatch', '효과는 2턴 동안 지속된다.', '쿨타임 2행동'],
    ['Meditation exclusive threshold', 'Packaged Skill 6009 row attribution or description mismatch', '부대 생명이 90% 이상일 때', '부대 생명이 90% 초과일 때'],
    ['Shield and Meditation swapped', 'Packaged Skill 10804 row attribution or description mismatch', selector, 'displayDescriptions[skillId === 10804 ? 6009 : skillId === 6009 ? 10804 : skillId] ?? descriptionKo'],
    ['Life base moved to Attack', 'Soldier Command values: 생명',
      "['생명', '+15%', '+25%'],\n    ['공격', '', '+10%']", "['생명', '', '+25%'],\n    ['공격', '+15%', '+10%']"],
    ['Defense base zero text', 'Soldier Command values: 방어', "['방어', '', '+10%']", "['방어', '+0%', '+10%']"],
    ['Attack base hidden zero', 'Empty Soldier Command cell has a hidden value', 'cell.textContent = value;',
      "cell.textContent = value; if (stat === '공격' && value === '') cell.setAttribute('aria-label', '+0%');"],
    ['Bond 1 list outside its details', 'Bond level list ownership: 유대 1', 'levels.append(summary, list);\n    section.append(levels);',
      "levels.append(summary); section.append(levels); if (labelKo === '유대 1') section.append(list); else levels.append(list);"],
    ['Bond 2 and 4 share a name', 'Bond level lists must open independently', 'levels.append(summary, list);',
      "levels.append(summary, list); if (labelKo === '유대 2') levels.setAttribute('name', 'linked'); if (labelKo === '유대 4') levels.name = 'linked';"],
    ['Bond 1 empty open attribute', 'Bond level list must start closed', 'levels.append(summary, list);',
      "levels.append(summary, list); if (labelKo === '유대 1') levels.setAttribute('open', '');"],
  ];
  for (const [name, error, before, after] of rendererCases) {
    for (const mode of modes) {
      const fixture = await mkdtemp(join(temp, 'hero15-display-'));
      const source = join(fixture, 'source');
      const destination = join(fixture, 'package');
      await cp(process.cwd(), source, { recursive: true, filter: path => path !== join(process.cwd(), '.git') });
      await changeRenderer(source, before, after);
      if (mode === '--verify-dir') {
        await cp(normalPackage, destination, { recursive: true });
        for (const file of ['app.js', 'index.html']) await copyFile(join(source, file), join(destination, file));
      }
      const result = run(source, mode, destination);
      assert.equal(result.status, 1, result.stderr);
      assert.ok(result.stderr.includes(`AssertionError [ERR_ASSERTION]: ${error}`), result.stderr);
      console.log(`Hero detail ${mode}: rejected ${name}`);
      await rm(fixture, { recursive: true });
    }
  }
  const isFirstBadge = "parent.textContent === 'Lv.2 · 1,500 골드'";
  const sourceAssignment = 'image.src = keyImages.get(itemId);';
  const copyCases = [
    ...[[ordinaryPublic,ordinaryPublicV2],[ordinaryPublicV2,ordinaryPublicV3]].map(([left,right])=>[left+' exchanged with '+right, async root=>{
      const a=join(root,left), b=join(root,right);
      const [one,two]=await Promise.all([readFile(a),readFile(b)]);
      await Promise.all([writeFile(a,two),writeFile(b,one)]);
    }, /Lance ordinary public row count/]),
    ['v1 served at v2 path', root=>copyFile(join(root,ordinaryPublic),join(root,ordinaryPublicV2)), /Lance ordinary public row count/],
    ['v2 path relocated',root=>rename(join(root,ordinaryPublicV2),join(root,'generated/wrong-skill-path.json')), /ENOENT.*hero-16-ordinary-skills-public.v2/],
    ['missing PNG', (root) => rm(join(root, firstIcon)), /ENOENT.*FetterMaterial01|Public artifact file allowlist mismatch/],
    ['swapped PNG bytes', async root => {
      const [a, b] = await Promise.all([readFile(join(root, firstIcon)), readFile(join(root, secondIcon))]);
      await writeFile(join(root, firstIcon), b);
      await writeFile(join(root, secondIcon), a);
    }, /Bond key icon bytes mismatch/],
    ['relocated PNG', root => rename(join(root, firstIcon), join(root, 'assets/bond-materials/moved.png')),
      /ENOENT.*FetterMaterial01|Public artifact file allowlist mismatch/],
    ['fifth icon', async (root, mode) => {
      const extra = 'assets/bond-materials/unapproved.png';
      await copyFile(join(root, firstIcon), join(root, extra));
      if (mode === '--output-dir') {
        const path = join(root, 'tools/build.mjs');
        const build = await readFile(path, 'utf8');
        await writeFile(path, build.replace('return [...new Set(files)].sort();',
          `files.push('${extra}'); return [...new Set(files)].sort();`));
      }
    }, /Bond key icon deployment paths mismatch|Public artifact file allowlist mismatch/],
    ['swapped image sources', root => changeRenderer(root, sourceAssignment,
      'image.src = keyImages.get(itemId === 3200 ? 3201 : itemId === 3201 ? 3200 : itemId);'), /Bond key icon local src mismatch/],
    ['external image', root => changeRenderer(root, sourceAssignment,
      "image.src = 'https://example.invalid/icon.png';"), /Bond key icon local src mismatch/],
    ['badge title', root => changeRenderer(root, sourceAssignment,
      sourceAssignment + ` if (${isFirstBadge}) badge.title = '3200';`), /Bond key badge or image title is forbidden/],
    ['image alt', root => changeRenderer(root, "image.alt = '';",
      `image.alt = ${isFirstBadge} ? '3200' : '';`), /Bond key icon alt must be explicitly empty/],
    ['image srcset', root => changeRenderer(root, sourceAssignment,
      sourceAssignment + ` if (${isFirstBadge}) image.srcset = 'https://example.invalid/icon.png';`), /Bond key icon srcset is forbidden/],
    ['unused zero', root => changeRenderer(root, 'for (const [itemId, count] of pairs)',
      'for (const [itemId, count] of [...pairs, [3203, 0]])'), /Bond key badge count or group boundary mismatch/],
    ['Bond 3 icons repeated in Bond 4', root => changeRenderer(root, 'const keys = bondKeys.get(labelKo);',
      "const keys = bondKeys.get(labelKo === '유대 4' ? '유대 3' : labelKo);"), /Bond key badge count or group boundary mismatch/],
  ];
  for (const [name, mutate, error] of copyCases) {
    for (const mode of modes) {
      const fixture = await mkdtemp(join(temp, 'icons-'));
      const source = join(fixture, 'source');
      const destination = join(fixture, 'package');
      const root = mode === '--output-dir' ? source : destination;
      await cp(process.cwd(), source, { recursive: true, filter: path => path !== join(process.cwd(), '.git') });
      if (mode === '--verify-dir') await cp(normalPackage, destination, { recursive: true });
      await mutate(root, mode);
      if (mode === '--verify-dir') {
        for (const file of ['app.js', 'index.html']) await copyFile(join(destination, file), join(source, file));
      }
      const result = run(source, mode, destination);
      assert.equal(result.status, 1, name + ' ' + mode);
      assert.match(result.stderr, error);
      console.log(`Bond key icons ${mode}: rejected ${name}`);
      await rm(fixture, { recursive: true });
    }
  }
}

try {
  await checkHeroDetailBuildFailures();
  const built = await buildSite({ outputDir: output });
  const publicEquipment = JSON.parse(await readFile(join(output, 'generated/general-ssr-equipment.v1.json'), 'utf8'));
  const excludedEquipmentIds = [265, 266, 267, 268, 288, 289, 290, 291];
  assert.equal(publicEquipment.equipment.length, 198, 'public General SSR Equipment must contain the approved 198 IDs');
  assert.equal(publicEquipment.equipment.some(({ equipmentId }) => excludedEquipmentIds.includes(equipmentId)), false, 'excluded General SSR Equipment IDs must not enter Build output');
  assert.deepEqual(built.files.map(file => file.path), publicSitePaths(heroes, fullDetailPublicationDecision, decision, skinAssetPaths, exclusiveHeroDecision, hero15IntegratedDecision, hero16IntegratedDecision, heroMinimalDetailBatchDecision, heroMinimalDetailTenBatchDecision, heroMinimalDetailTwentyBatchDecision, heroMinimalDetailThirtyBatchDecision, heroMinimalDetailThirtyOneBatchDecision, heroMinimalDetailFortyBatchDecision));
  assert.equal(built.files.some((file) => file.path === 'generated/hero-15-casting-law-internal.v1.json'), false, 'Casting Law internal consumer must remain outside the public Build');
  assert.equal(built.files.some((file) => file.path === 'assets/portraits/hero-15.png'), false, 'internally admitted Hero 15 portrait must remain outside the public Build');
  assert.ok(built.files.some((file) => file.path === heroIndexPath), 'approved Hero Index must enter the public artifact');
  const packagedFullDetail = JSON.parse(await readFile(join(output, fullDetailGeneratedPath), 'utf8'));
  assert.deepEqual(packagedFullDetail, fullDetailGenerated, 'Public Build must package only the validated Full Detail projection');
  assert.deepEqual(packagedFullDetail.heroes.map(({ id }) => id), fullDetailPublicationDecision.approvedScope.detailHeroIds,
    'Public Build Full Detail population must follow the approved endpoint ID set');
  assert.equal(packagedFullDetail.heroes.some(({ id }) => id === 15), false, 'unapproved Hero 15 Full Detail must not enter the Public Build');
  assert.equal(JSON.stringify(packagedFullDetail).includes('assets/portraits/hero-15.png'), false,
    'internal Hero 15 Portrait path must not enter the Public Build Full Detail payload');
  assert.ok(built.files.some((file) => file.path === EXCLUSIVE_EQUIPMENT_HERO_NAVIGATION_PATH), 'approved Exclusive Equipment Hero Navigation must enter the public artifact');
  assert.ok(built.files.some((file) => file.path === HERO_15_MINIMAL_DETAIL_PATH), 'approved Hero 15 Minimal Detail must enter the public artifact');
  const soldierTextFixture = 'tools/fixtures/hero-15-soldier-text-base-app.js';
  assert.ok(built.files.some(file => file.path === HERO_15_SOLDIER_TEXT_PUBLIC));
  assert.ok(!built.files.some(file => [HERO_15_SOLDIER_TEXT_DECISION, soldierTextFixture].includes(file.path)));
  const approvedSoldierText = await readFile(HERO_15_SOLDIER_TEXT_PUBLIC);
  assert.deepEqual(await readFile(join(output, HERO_15_SOLDIER_TEXT_PUBLIC)), approvedSoldierText);
  assert.ok(built.files.some((file) => file.path === HERO_15_TALENT_PUBLIC_PATH), 'separately approved Hero 15 Talent consumer must enter the public artifact');
  assert.deepEqual(JSON.parse(await readFile(join(output, HERO_15_TALENT_PUBLIC_PATH), 'utf8')).talent.starDescriptions.map(({star,skillId})=>[star,skillId]), [[3,3212],[4,3214],[5,3216],[6,3218]]);
  assert.ok(built.files.some((file) => file.path === HERO_16_MINIMAL_DETAIL_PATH), 'approved Hero 16 Minimal Detail must enter the public artifact');
  assert.ok(built.files.some((file) => file.path === HERO_MINIMAL_DETAIL_BATCH_PATH), 'approved five-Hero Minimal Detail batch must enter the public artifact');
  assert.ok(built.files.some((file) => file.path === HERO_MINIMAL_DETAIL_TEN_BATCH_PATH), 'approved ten-Hero Minimal Detail batch must enter the public artifact');
  assert.ok(built.files.some((file) => file.path === HERO_MINIMAL_DETAIL_TWENTY_BATCH_PATH), 'approved twenty-Hero Minimal Detail batch must enter the public artifact');
  assert.ok(built.files.some((file) => file.path === HERO_MINIMAL_DETAIL_THIRTY_BATCH_PATH), 'approved thirty-Hero Minimal Detail batch must enter the public artifact');
  assert.ok(built.files.some((file) => file.path === HERO_MINIMAL_DETAIL_THIRTY_ONE_BATCH_PATH), 'approved thirty-one-Hero Minimal Detail batch must enter the public artifact');
  assert.deepEqual(heroMinimalDetailThirtyOneBatchConsumer.heroes.map(({ heroId }) => heroId), [99164,99165,99166,99167,99168,99169,99170,99171,99172,99173,99174,99175,99176,99177,99178,99179,99180,99181,99182,99183,99184,99185,99186,99187,99188,99189,99190,99191,99192,99193,99197]);
  assert.equal(heroMinimalDetailFortyBatchConsumer.heroes.length, 40);
  assert.deepEqual(heroMinimalDetailThirtyBatchConsumer.heroes.map(({ heroId }) => heroId), [101,102,103,104,105,106,108,109,110,111,112,113,114,115,116,118,119,120,121,122,123,124,125,126,127,129,130,99161,99162,99163]);
  assert.deepEqual(heroMinimalDetailTenBatchConsumer.heroes.map(({ heroId }) => heroId), [31,34,35,36,38,39,49,51,54,57]);
  assert.deepEqual(heroMinimalDetailTwentyBatchConsumer.heroes.map(({ heroId }) => heroId), [58,59,61,62,63,64,65,66,87,88,91,92,93,94,95,96,97,98,99,100]);
  assert.ok(publicSitePaths(heroes, fullDetailPublicationDecision, decision, skinAssetPaths, exclusiveHeroDecision, hero15IntegratedDecision, hero16IntegratedDecision, heroMinimalDetailBatchDecision, heroMinimalDetailTenBatchDecision, heroMinimalDetailTwentyBatchDecision, heroMinimalDetailThirtyBatchDecision).includes(heroIndexPath), 'Hero Index must be explicitly allowlisted');
  assert.deepEqual(JSON.parse(await readFile(join(output, heroIndexPath), 'utf8')), heroIndex, 'packaged Hero Index must match the validated consumer');
  assert.equal(heroIndex.heroes.length, 267);
  assert.ok(heroIndex.heroes.every((row) => JSON.stringify(Object.keys(row).sort()) === '["heroId","nameKo"]'));
  assert.ok(built.files.some(file => file.path === skinConsumerPath), 'approved Skin Generated consumer must enter the public artifact');
  assert.ok(publicSitePaths(heroes, fullDetailPublicationDecision, decision, skinAssetPaths).includes(skinConsumerPath), 'Frozen M03 consumer compatibility artifact must remain published');
  assert.ok(publicSitePaths(heroes, fullDetailPublicationDecision, decision, skinAssetPaths).includes(publicConsumerPath), 'approved generic Skin consumer must be published');
  assert.ok(built.files.some((file) => file.path === HERO_MINIMAL_DETAIL_FORTY_BATCH_PATH), 'approved forty-Hero consumer must be included in the public artifact');
  assert.deepEqual(JSON.parse(await readFile(join(output, HERO_MINIMAL_DETAIL_FORTY_BATCH_PATH), 'utf8')).heroes.map(({ heroId }) => heroId), HERO_MINIMAL_DETAIL_FORTY_BATCH.map(({ heroId }) => heroId), 'published forty-Hero consumer must preserve the exact approved population');
  const skinConsumer = JSON.parse(await readFile(skinConsumerPath, 'utf8'));
  assert.deepEqual(skinConsumer, { schemaVersion: 1, skins: expectedSkinRows }, 'public Skin payload must preserve the exact approved M03 population and fields');
  assert.deepEqual(JSON.parse(await readFile(join(output, publicConsumerPath), 'utf8')).skins, expectedPublicRows);
  assert.deepEqual(JSON.parse(await readFile(join(output, publicAssetsPath), 'utf8')), publicAssets);
  for (const path of skinAssetPaths) {
    assert.ok(built.files.some((file) => file.path === path), `approved Skin Fullart must be published: ${path}`);
    assert.deepEqual(await readFile(join(output, path)), await readFile(path), `published Skin Fullart bytes must match source: ${path}`);
  }
  assert.ok(built.files.includes(undefined) === false);
  assert.ok(built.files.some((file) => file.path === 'skin-fullart-presentation.mjs'));
  assert.ok(built.files.some((file) => file.path === 'skin-asset-publication-contract.mjs'));
  assert.ok(built.files.every(file => !/^(canonical|evidence|tools|docs)\//.test(file.path)));
  assert.ok(!built.files.some((file) => file.path === 'evidence/assets/skin-fullart-m04.v1.json'), 'internal Asset Manifest must remain private');
  assert.ok(!built.files.some((file) => file.path === 'evidence/assets/skin-fullart-m05-d.v1.json'), 'M05-D internal Asset Evidence must remain private');
  assert.ok(!built.files.some((file) => file.path === 'evidence/assets/skin-fullart-m06.v1.json'), 'M06 internal Asset Evidence must remain private');
  assert.ok(built.files.some((file) => file.path === 'assets/skin-admissions/m05-d/skin-601.webp'), 'Publication-approved Skin 601 must be included from its exact manifest path');
  for (const id of [602, 603, 604, 605, 606]) {
    const path = `assets/skin-admissions/m06/skin-${id}.webp`;
    assert.ok(built.files.some((file) => file.path === path), `Publication-approved M06 Skin ${id} must be included from its exact manifest path`);
    assert.deepEqual(await readFile(join(output, path)), await readFile(path), `published M06 Skin ${id} bytes must match admitted Asset`);
  }
  await assert.rejects(buildSite({ outputDir: output }), /EEXIST/);
  const validate = (record = decision, canonical = heroes, soldierTextDecision = undefined) => validatePublicSiteDirectory(output, canonical, fullDetailPublicationDecision, record, process.cwd(), exclusiveHeroDecision, hero15IntegratedDecision, hero16IntegratedDecision, heroMinimalDetailBatchDecision, heroMinimalDetailTenBatchDecision, heroMinimalDetailTwentyBatchDecision, heroMinimalDetailThirtyBatchDecision, heroMinimalDetailThirtyOneBatchDecision, heroMinimalDetailFortyBatchDecision, undefined, soldierTextDecision);
  await assert.rejects(validate(decision, heroes, null), /independently approved/);
  await rm(join(output, HERO_15_SOLDIER_TEXT_PUBLIC));
  await assert.rejects(validate(), /allowlist mismatch/);
  await copyFile(HERO_15_SOLDIER_TEXT_PUBLIC, join(output, HERO_15_SOLDIER_TEXT_PUBLIC));
  await writeFile(join(output, HERO_15_SOLDIER_TEXT_PUBLIC), approvedSoldierText.toString().replace('무녀', '변경'));
  await assert.rejects(validate(), /Hero 15 Soldier text bytes differ from the approved SHA-256/);
  await copyFile(HERO_15_SOLDIER_TEXT_PUBLIC, join(output, HERO_15_SOLDIER_TEXT_PUBLIC));
  await rm(join(output, skinConsumerPath));
  await assert.rejects(validate(), /allowlist mismatch/);
  await copyFile(skinConsumerPath, join(output, skinConsumerPath));
  await rm(join(output, heroIndexPath));
  await assert.rejects(validate(), /allowlist mismatch/);
  await copyFile(heroIndexPath, join(output, heroIndexPath));
  await rm(join(output, HERO_15_MINIMAL_DETAIL_PATH));
  await assert.rejects(validate(), /allowlist mismatch/);
  await copyFile(HERO_15_MINIMAL_DETAIL_PATH, join(output, HERO_15_MINIMAL_DETAIL_PATH));
  await rm(join(output, HERO_15_TALENT_PUBLIC_PATH));
  await assert.rejects(validate(), /allowlist mismatch/);
  await copyFile(HERO_15_TALENT_PUBLIC_PATH, join(output, HERO_15_TALENT_PUBLIC_PATH));
  await writeFile(join(output, HERO_15_TALENT_PUBLIC_PATH), '{}');
  await assert.rejects(validate(), /bytes differ.*hero-15-talent-public/);
  await copyFile(HERO_15_TALENT_PUBLIC_PATH, join(output, HERO_15_TALENT_PUBLIC_PATH));
  await rm(join(output, HERO_16_MINIMAL_DETAIL_PATH));
  await assert.rejects(validate(), /allowlist mismatch/);
  await copyFile(HERO_16_MINIMAL_DETAIL_PATH, join(output, HERO_16_MINIMAL_DETAIL_PATH));
  await rm(join(output, HERO_MINIMAL_DETAIL_BATCH_PATH));
  await assert.rejects(validate(), /allowlist mismatch/);
  await copyFile(HERO_MINIMAL_DETAIL_BATCH_PATH, join(output, HERO_MINIMAL_DETAIL_BATCH_PATH));
  await writeFile(join(output, HERO_MINIMAL_DETAIL_BATCH_PATH), '{}');
  await assert.rejects(validate(), /bytes differ.*hero-minimal-detail-batch/);
  await copyFile(HERO_MINIMAL_DETAIL_BATCH_PATH, join(output, HERO_MINIMAL_DETAIL_BATCH_PATH));
  await writeFile(join(output, HERO_16_MINIMAL_DETAIL_PATH), '{}');
  await assert.rejects(validate(), /bytes differ.*hero-minimal-detail-16\.v1\.json/);
  await copyFile(HERO_16_MINIMAL_DETAIL_PATH, join(output, HERO_16_MINIMAL_DETAIL_PATH));
  await writeFile(join(output, HERO_15_MINIMAL_DETAIL_PATH), '{}');
  await assert.rejects(validate(), /bytes differ.*hero-minimal-detail\.v1\.json/);
  await copyFile(HERO_15_MINIMAL_DETAIL_PATH, join(output, HERO_15_MINIMAL_DETAIL_PATH));
  await writeFile(join(output, heroIndexPath), '{}');
  await assert.rejects(validate(), /bytes differ.*hero-index\.v1\.json/);
  await copyFile(heroIndexPath, join(output, heroIndexPath));
  await writeFile(join(output, skinConsumerPath), '{}');
  await assert.rejects(validate(), /bytes differ.*generated\/skin-consumer\.v1\.json/);
  await copyFile(skinConsumerPath, join(output, skinConsumerPath));
  await validate();
  const expandedCanonical = structuredClone(heroes);
  expandedCanonical.records = expandedCanonical.records.filter(({ id }) => id !== 15);
  expandedCanonical.records.push({ id: 15, portrait: 'assets/portraits/hero-15.png' });
  assert.deepEqual(await validate(decision, expandedCanonical), built.files,
    'an internal Hero 15 must leave the approved public file list and hashes unchanged');
  await mkdir(join(output, 'assets/portraits'), { recursive: true });
  await copyFile('assets/portraits/hero-15.png', join(output, 'assets/portraits/hero-15.png'));
  await assert.rejects(validate(decision, expandedCanonical), /allowlist mismatch/,
    'public Build validator must reject an unapproved Hero 15 portrait even when present in Canonical');
  await rm(join(output, 'assets/portraits/hero-15.png'));
  await validate();
  const server = createServer(async (request, response) => {
    const path = new URL(request.url ?? '/', 'http://127.0.0.1').pathname.replace(/^\/+/, '');
    if (!built.files.some(file => file.path === path)) {
      response.writeHead(404).end('Not Found');
      return;
    }
    try {
      const bytes = await readFile(join(output, path));
      response.writeHead(200, { 'content-type': path.endsWith('.webp') ? 'image/webp' : 'application/json; charset=utf-8' }).end(bytes);
    } catch {
      response.writeHead(404).end('Not Found');
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  try {
    const address = server.address();
    const origin = `http://127.0.0.1:${address.port}`;
    const response = await fetch(`${origin}/${publicConsumerPath}`, { cache: 'no-store' });
    assert.equal(response.status, 200, 'public Skin JSON URL must return HTTP 200');
    assert.deepEqual(await response.json(), { schemaVersion: 1, skins: expectedPublicRows }, 'fetched Skin JSON must retain approved semantic rows');
    const heroIndexResponse = await fetch(`${origin}/${heroIndexPath}`, { cache: 'no-store' });
    assert.equal(heroIndexResponse.status, 200, 'approved Hero Index JSON URL must return HTTP 200');
    assert.deepEqual(await heroIndexResponse.json(), heroIndex, 'fetched Hero Index must contain only the exact approved ID/name consumer');
  const minimalDetailResponse = await fetch(`${origin}/${HERO_15_MINIMAL_DETAIL_PATH}`, { cache: 'no-store' });
  assert.equal(minimalDetailResponse.status, 200, 'approved Hero 15 Minimal Detail JSON URL must return HTTP 200');
  assert.equal((await minimalDetailResponse.json()).heroes[0].heroId, 15, 'public minimal detail must contain only Hero 15');
  const hero16MinimalDetailResponse = await fetch(`${origin}/${HERO_16_MINIMAL_DETAIL_PATH}`, { cache: 'no-store' });
  assert.equal(hero16MinimalDetailResponse.status, 200, 'approved Hero 16 Minimal Detail JSON URL must return HTTP 200');
  assert.equal((await hero16MinimalDetailResponse.json()).heroes[0].heroId, 16, 'public Hero 16 minimal detail must contain only Hero 16');
  const batchMinimalDetailResponse = await fetch(`${origin}/${HERO_MINIMAL_DETAIL_BATCH_PATH}`, { cache: 'no-store' });
  assert.equal(batchMinimalDetailResponse.status, 200, 'approved batch Minimal Detail JSON URL must return HTTP 200');
  assert.deepEqual((await batchMinimalDetailResponse.json()).heroes.map(({ heroId }) => heroId), [17, 18, 20, 21, 30], 'public batch must contain exactly the five approved Heroes');
  const ownerNavigationResponse = await fetch(`${origin}/${EXCLUSIVE_EQUIPMENT_HERO_NAVIGATION_PATH}`, { cache: 'no-store' });
  assert.equal(ownerNavigationResponse.status, 200, 'approved Equipment Hero Navigation JSON URL must return HTTP 200');
  assert.deepEqual(await ownerNavigationResponse.json(), JSON.parse(await readFile(EXCLUSIVE_EQUIPMENT_HERO_NAVIGATION_PATH, 'utf8')),
    'fetched Equipment Hero Navigation must match the exact approved consumer');
    for (const path of skinAssetPaths) assert.equal((await fetch(`${origin}/${path}`)).status, 200, `published Skin Fullart URL must resolve: ${path}`);
    assert.equal((await fetch(`${origin}/assets/skin-admissions/other/skin-601.webp`)).status, 404, 'unregistered admission directories must not be published');
    assert.equal((await fetch(`${origin}/generated/skin-consumer-missing.v1.json`)).status, 404, 'unknown Generated path must return HTTP 404');
    assert.equal((await fetch(`${origin}/canonical/skin-identities.v1.json`)).status, 404, 'Canonical owner files must remain outside the publication surface');
    assert.equal((await fetch(`${origin}/canonical/hero-localizations-ko.v1.json`)).status, 404, 'Hero Canonical localization must remain outside the publication surface');
    assert.equal((await fetch(`${origin}/evidence/source/skin-identity-m01.v1.json`)).status, 404, 'Evidence files must remain outside the publication surface');
    assert.equal((await fetch(`${origin}/evidence/assets/skin-fullart-m05-d.v1.json`)).status, 404, 'M05-D Asset Evidence must remain private');
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
  await writeFile(join(output, 'unexpected.json'), '{}');
  await assert.rejects(validate(), /allowlist mismatch/);
  await rm(join(output, 'unexpected.json'));
  await mkdir(join(output, 'evidence'));
  await assert.rejects(validate(), /Unexpected public directory/);
  await rm(join(output, 'evidence'), { recursive: true });
  await symlink(join(process.cwd(), 'app.js'), join(output, 'linked.js'));
  await assert.rejects(validate(), /Non-regular public entry/);
  await rm(join(output, 'linked.js'));
  await writeFile(join(output, 'app.js'), '// wrong bytes');
  await assert.rejects(validate(), /bytes differ.*app.js/);
  await copyFile('app.js', join(output, 'app.js'));
  await rm(join(output, 'styles.css'));
  await assert.rejects(validate(), /allowlist mismatch/);
  await copyFile('styles.css', join(output, 'styles.css'));

  for (const state of ['REVOKED', 'APPROVED_ONLY', 'PROPOSED']) {
    const disabled = structuredClone(decision);
    disabled.contract.effectivenessStatus = state;
    if (state === 'REVOKED') {
      disabled.revocation.status = 'REVOKED';
      disabled.revocation.revokedAt = '2026-10-29';
      disabled.revocation.reason = 'test-only revocation';
    }
    if (state === 'PROPOSED') {
      disabled.contract.approvalStatus = 'NOT_APPROVED';
      disabled.decisionA.status = 'NOT_APPROVED';
      disabled.decisionB.status = 'NOT_APPROVED';
    }
    assert.ok(!publicSitePaths(heroes, fullDetailPublicationDecision, disabled, skinAssetPaths, exclusiveHeroDecision).includes(trainingPath));
    await assert.rejects(validate(disabled), /allowlist mismatch/);
    await rm(join(output, trainingPath));
    await validate(disabled);
    await copyFile(trainingPath, join(output, trainingPath));
  }
  const invalid = structuredClone(decision);
  invalid.contract.version = 999;
  assert.throws(() => publicSitePaths(heroes, fullDetailPublicationDecision, invalid), /contract approval\/effectiveness state mismatch/);
  await validate();
  await buildSite({ verifyDir: output });
  console.log('Public Build checks: PASS (generic approved Skin projections, registry WebP URLs, byte parity, private Evidence and allowlist negatives)');
} finally {
  await rm(temp, { recursive: true, force: true });
}
