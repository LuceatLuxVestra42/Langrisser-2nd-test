import { ordinaryCanonical, ordinaryDecision, ordinaryEvidence, ordinaryPublic, ordinaryPublicV2, ordinaryDecisionV2, ordinaryDecisionV3, ordinaryPublicV3, ordinaryDecisionV4, ordinaryPublicV4, ordinaryDecisionV5, ordinaryPublicV5 } from './hero-16-ordinary-skills-publication-contract.mjs';
import { lanceTalentDecision, lanceTalentPublic } from './hero-16-talent-publication-contract.mjs';
import { HERO_15_SOLDIER_TEXT_DECISION, HERO_15_SOLDIER_TEXT_PUBLIC } from './hero-15-soldier-text-publication-contract.mjs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cpSync } from 'node:fs';
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
import { lanceEffectFreeze, lanceEffectDecision, lanceGoldDecision, HERO_16_JOB_PATH_DECISION, HERO_16_PROFILE_DECISION, HERO_16_INTEGRATED_PUBLICATION_PATH, HERO_16_MINIMAL_DETAIL_PATH } from './hero-16-integrated-publication-contract.mjs';
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

  // Filter the checkout once. Each negative case still receives its own writable source copy.
  const normalSource = join(temp, 'approved-source');
  await cp(process.cwd(), normalSource, { recursive: true, filter: path => path !== join(process.cwd(), '.git') });

  const skillDecisionPath = 'docs/decisions/hero-15-minimal-ordinary-skills-publication.v1.json';
  const templatePath = 'canonical/casting-law-template-raw-details.v1.json';
  const membership = 'canonical/hero-job-relations.v1.json';
  const advancement = 'canonical/hero-job-advancement-relations.v1.json';
  const talentError = message => () => 'AssertionError [ERR_ASSERTION]: ' + message;
  const heroGoldRefs = 'canonical/hero-casting-law-template-references.v1.json';
  const levelGoldRefs = 'canonical/casting-law-template-level-references.v1.json';
  const levelCosts = 'canonical/casting-law-levelup-raw-details.v1.json';
  const lianaDecision = JSON.parse(await readFile('docs/decisions/hero-15-minimal-central-discipline-gold-publication.v1.json','utf8'));
  const costsFor = (records, ids) => ids.map(id => records.find(row => row.levelUpInfoId === id).rawFields);
  function exchangeCost(a, b) {
    [a.LevelUpGoldCost, b.LevelUpGoldCost] = [b.LevelUpGoldCost, a.LevelUpGoldCost];
  }
  const stormRow = d => d.ordinarySkills.find(row => row.skillId === 11819);
  const lianaConsumer = 'tools/hero-15-skill-detail-internal.mjs';
  const sharedReferences = 'canonical/hero-skill-references.v1.json';
  const firstFrozenLine = '상성 우세인 부대와 전투 시 모든 스탯 +15%';
  const sheetLine = '상성 우세인 부대와 전투 시 올스탯 +15%';
  const lanceReference = doc => doc.records.find(row => row.heroId === 16 && row.skillId === 90092);
  const goldEvidence = 'evidence/source/bonds/hero16-fetter-gold.v1.json';
  const goldPublication = 'docs/decisions/hero-16-minimal-fetter-gold-totals-publication.v1.json';
  const regularDetails = 'canonical/hero-fetter-raw-details.v1.json';
  const heartDetails = 'canonical/hero-heart-fetter-raw-details.v1.json';
  const fetterReferences = 'canonical/hero-fetter-references.v1.json';
  const groups = [71,72,73,74,75,16];
  const finalDecision = 'docs/decisions/hero-16-minimal-final-job-paths-publication.v1.json';
  const finalSource = 'evidence/source/jobs/hero16-final-job-advancement-direct.v1.json';
  function consumerMutation(name, module, original, replacement, error) {
    return {name, decisionPath:'tools/' + module + '.mjs', error:() => 'Error: ' + error,
      mutateSource(source) {
        assert.equal(source.split(original).length, 2, name);
        return source.replace(original, replacement);
      }};
  }
  const finalOwnerCall = 'finalJobPathLines(finalDecision, heroJobRelations, jobEdges.finals, expectedJobEdges.slice(6), jobLocalization)';
  const commandBaseEvidence = 'evidence/source/configdata/hero-16-soldier-command-base.v1.json';
  const commandBondEvidence = 'evidence/source/configdata/hero-16-soldier-command-bond-contribution.v1.json';
  const commandDecision = 'docs/decisions/hero-16-minimal-soldier-command-publication.v1.json';
  const bondCall = 'validateHero15SoldierCommandBondContribution(bondCommand);';
  const heartEvidence = 'evidence/source/bonds/hero16-heart-fetter-raw-conditions.v1.json';
  const heartDecision = 'docs/decisions/hero-16-minimal-heart-fetter-effects-publication.v1.json';
  const rawPath = 'canonical/hero-heart-fetter-raw-conditions.v1.json';
  const heartCall = 'lanceHeartGroups(heartConditions, heartSource, jobEdges.finals, heroJobRelations, jobLocalization, await readJson(heartDecisionPath))';
  const v4Text = await readFile(ordinaryPublicV4,'utf8');
  const windCall = 'publishWindSkill(e, canonical, identities, jobs, decisionV5, v4, scopeV4)';
  function windOwnerMutation(name, input, statement, reason) {
    const args = ['e','canonical','identities','jobs','decisionV5','v4','scopeV4'];
    args[args.indexOf(input)] = 'changed';
    const replacement = `(() => { const changed = structuredClone(${input}); ${statement}; return publishWindSkill(${args.join(', ')}); })()`;
    return {...consumerMutation('10418 '+name,'hero-16-ordinary-skills-publication-contract',windCall,replacement,reason),
      error:talentError(reason)};
  }
  function bondDescriptionMutation(name, input, change, reason, companion = false) {
    const owner = companion ? 'lanceCompanionBondDescriptions' : 'lanceBondDescriptions';
    const args = companion ? ['bondReferences', 'companionSource', 'heroLocalization', 'companionDecision']
      : ['bondReferences', 'bondDescriptionSource', 'heroLocalization', 'bondDescriptionDecision'];
    const call = owner + '(' + args.join(', ') + ')';
    const index = args.indexOf(input);
    assert.notEqual(index, -1);
    args[index] = 'copy';
    const replacement = `(() => { let copy = structuredClone(${input}); ${change}; return ${owner}(${args.join(', ')}); })()`;
    return consumerMutation(name, 'build', call, replacement, 'Lance bond descriptions: ' + reason);
  }
  const mission = 'copy.tables.MissionInfo.records';
  const fetter = 'copy.tables.HeroFetterInfo.records';
  const stage = 'copy.tables.HeroDungeonLevelInfo.records';
  const ownership = 'copy.tables.HeroInformationInfo.ownerReferences';
  function movementMutation(name, input, change, reason) {
    const args = ['successors', 'movementEvidence.jobs.records', 'movementEvidence.movement.records', 'movementDecision'];
    const original = 'finalJobMovementLines(' + args.join(', ') + ')';
    const position = args.indexOf(input);
    assert.notEqual(position, -1);
    args[position] = 'copy';
    const replacement = `(() => { const copy = structuredClone(${input}); ${change}; return finalJobMovementLines(${args.join(', ')}); })()`;
    return consumerMutation(name, 'build', original, replacement, reason);
  }
  const levelCall = 'lanceBond1LevelLines(levelReferences, firstBondDetail, levelEvidence, levelDecision)';
  const levelPublication = 'docs/decisions/hero-16-minimal-bond1-level-gold-publication.v1.json';
  // Inject only after the source and six totals have passed their normal checks.
  const levelBoundary = 'const additionalLevelLines = bondLevelInputs.map(';
  function levelInputMutation(name, statement, reason) {
    return consumerMutation(name, 'build', levelBoundary, statement + '\n' + levelBoundary,
      'Lance Fetter ' + reason + ' mismatch');
  }
  const forwardDecision = 'docs/decisions/hero-16-minimal-soldier-forward-links-publication.v1.json';
  const forwardCall = 'const forwardLinks = lanceSoldierForwardLinks(forwardInputs);';
  const cases = [
    ...[
      ['Rank', 'forwardInputs.source.find(r => r.ID === 115).Rank = 2;', '115 T3 Rank mismatch'],
      ['name', 'forwardInputs.names = forwardInputs.names.filter(r => r.soldierId !== 115);', 'NORMAL 115 Korean name missing or duplicated'],
      ['relation', 'forwardInputs.relations = forwardInputs.relations.filter(r => !(r.heroId === 16 && r.soldierId === 115));', '115 relation missing or duplicated'],
      ['identity', "forwardInputs.identities.find(r => r.id === 115).variant = 'SP';", '115 NORMAL namespace'],
      ['destination', 'forwardInputs.destinations = forwardInputs.destinations.filter(r => r.normalSoldierId !== 115);', '115 NORMAL destination'],
    ].map(([name, mutation, reason]) => consumerMutation('Lance forward ' + name, 'build', forwardCall,
      mutation + '\n' + forwardCall, 'Lance forward links: ' + reason)),
    ...[
      ['decision missing', undefined, 'publication decision missing'],
      ['status', d => { d.status = 'PENDING'; }, 'approval status'],
      ['direction', d => { d.direction = 'BIDIRECTIONAL'; }, 'approved direction'],
      ['approved fragments exchanged', d => {
        const [a, b] = d.soldiers;
        [a.fragment, b.fragment] = [b.fragment, a.fragment];
      }, 'approved ordered destinations'],
    ].map(([name, mutate, reason]) => ({ name: 'Lance forward ' + name, decisionPath: forwardDecision, mutate,
      error: () => 'Error: Lance forward links: ' + reason })),
    ...[[2,72,67,5000], [3,73,68,9000]].flatMap(([bond, endpoint, lianaId, firstGold], index) => {
      const input = 'bondLevelInputs[' + index + ']';
      const label = 'bond ' + bond;
      const decisionPath = 'docs/decisions/hero-16-minimal-bond' + bond + '-level-gold-publication.v1.json';
      return [
        levelInputMutation(label + ' reference removed',
          `${input}.references = {records:levelReferences.records.filter(r => !(r.heroId===16 && r.fetterId===${endpoint}))};`, label + ' selection reference'),
        levelInputMutation(label + ' Liana detail substituted',
          `${input}.detail = regularGoldDetails.find(r => r.heroId===15 && r.endpointId===${lianaId});`, label + ' detail attribution'),
        ...[['gold','evidence amount'], ['locator','source locator']].map(([field, reason]) => levelInputMutation(
          label + ' exchanged ' + field,
          `${input}.levels = ${input}.levels.map((row,i,rows) => i < 2 ? {...row, ${field}:rows[1-i].${field}} : row);`,
          label + ' Lv.2 ' + reason)),
        {name:label + ' missing level decision', decisionPath, error:() => 'Error: Lance Fetter ' + label + ' level decision missing'},
        ...[
          ['approval status', d => { d.status = 'PENDING'; }, 'level approval status'],
          ['target order', d => { [d.targetLevels[0],d.targetLevels[1]] = [3,2]; }, 'approved level order'],
          ['evidence path', d => { d.evidence = goldEvidence + '#/endpoints/' + (bond === 2 ? 2 : 1) + '/levels'; }, 'decision evidence path'],
          ['approved Lv.2 gold', d => { d.rows[0].gold = firstGold + 1; }, 'approved Lv.2 amount'],
        ].map(([name, mutate, reason]) => ({name:label + ' wrong ' + name, decisionPath, mutate,
          error:() => 'Error: Lance Fetter ' + label + ' ' + reason + ' mismatch'})),
      ];
    }),
    levelInputMutation('Lance bonds 2 and 3 evidence inputs exchanged',
      '[bondLevelInputs[0].levels,bondLevelInputs[1].levels] = [bondLevelInputs[1].levels,bondLevelInputs[0].levels];', 'bond 2 level evidence group'),
    levelInputMutation('Lance bonds 2 and 3 decision endpoints exchanged',
      '[bondLevelInputs[0].decision.endpointId,bondLevelInputs[1].decision.endpointId] = [73,72];', 'bond 2 level approval target'),
    ...[
      ['selection absent', 'levelReferences', '{records:levelReferences.records.filter(r => !(r.heroId===16 && r.fetterId===71))}', 'bond 1 selection reference'],
      ['Liana detail substituted', 'firstBondDetail', 'regularGoldDetails.find(r => r.heroId===15 && r.endpointId===66)', 'bond 1 detail attribution'],
      ...[['gold','evidence amount'], ['locator','source locator']].map(([field, reason]) =>
        [field + ' exchanged', 'levelEvidence', `levelEvidence.map((r,i) => i < 2 ? {...r, ${field}:levelEvidence[1-i].${field}} : r)`, 'bond 1 Lv.2 ' + reason]),
    ].map(([name, input, replacement, reason]) => consumerMutation('Lance bond 1 ' + name, 'build',
      levelCall, levelCall.replace(input, replacement), 'Lance Fetter ' + reason + ' mismatch')),
    { decisionPath:levelPublication, name:'bond 1 level decision missing', error:() => 'Error: Lance Fetter bond 1 level decision missing' },
    ...[
      ['endpoint', d => { d.endpointId = 72; }, 'bond 1 level approval target'],
      ['status', d => { d.status = 'PENDING'; }, 'bond 1 level approval status'],
      ['target order', d => { [d.targetLevels[0], d.targetLevels[1]] = [3, 2]; }, 'bond 1 approved level order'],
    ].map(([name, mutate, reason]) => ({name:'bond 1 level decision ' + name, decisionPath:levelPublication, mutate,
      error:() => 'Error: Lance Fetter ' + reason + ' mismatch'})),
    ...[
      ['Lance Connection 164 wrong successor', 'successors', 'copy[0].jobId=306', 'Lance final movement requires Connection 164 -> Job 405'],
      ['Lance Connection 165 wrong successor', 'successors', 'copy[1].jobId=405', 'Lance final movement requires Connection 165 -> Job 306'],
      ['Lance definitions Korean names exchanged', 'movementEvidence.movement.records',
        '[copy[0].nameKr,copy[1].nameKr]=[copy[1].nameKr,copy[0].nameKr]', 'Lance final movement Korean definition for 4/FLY'],
      ['Lance final Job movement types exchanged', 'movementEvidence.jobs.records',
        '[copy[0].MoveType,copy[1].MoveType]=[copy[1].MoveType,copy[0].MoveType]', 'Lance final movement type for Job 405'],
      ['Lance final Job wrong base range', 'movementEvidence.jobs.records', 'copy[0].BF_AttackDistance=2', 'Lance final movement base range for Job 405'],
      ['Lance final Job wrong movement points', 'movementEvidence.jobs.records', 'copy[1].BF_MovePoint=4', 'Lance final movement points for Job 306'],
      ['Lance movement decision missing successor', 'movementDecision', 'copy.rows.shift()', 'Lance final movement approved row missing'],
      ['Lance approved movement assignments exchanged', 'movementDecision',
        'for (const field of ["moveType","moveLabelKo"]) [copy.rows[0][field],copy.rows[1][field]]=[copy.rows[1][field],copy.rows[0][field]]',
        'Lance final movement approved row for Job 405'],
    ].map(args => movementMutation(...args)),
    ...[
      ...[[4,74],[5,75]].map(([bond,id])=>['Lance bond '+bond+' reference missing', 'bondReferences',
        'copy.records=copy.records.filter(r=>!(r.heroId===16 && r.fetterId==='+id+'))', 'bond '+bond+' Hero 16 regular Fetter '+id+' reference']),
      ...[[4,5055,11],[5,5056,14]].map(([bond,mid,id])=>['Lance companion '+id+' name missing', 'heroLocalization',
        'copy.records=copy.records.filter(r=>r.heroId!=='+id+')', 'bond '+bond+' Mission '+mid+' Hero '+id+' Korean name']),
      ['Lance Mission 5055 type', 'companionSource', mission+'[0].MissionType=34', 'Mission 5055 MissionType=5'],
      ['Lance Mission 5055 Param2', 'companionSource', mission+'[0].Param2=5', 'Mission 5055 Param2=6'],
      ['Lance Stage 164 multiple owners', 'companionSource', ownership+'.find(r=>r.ID===14).DungeonLevels_ID.push(164)', 'Stage 164 complete reverse-owner set'],
      ['Lance Stage 164 missing ownership', 'companionSource', ownership+'[15].DungeonLevels_ID.splice(3,1)', 'Hero 16 missing Stage 164 ownership'],
      ['Lance companions exchanged', 'companionSource', mission+'[0].Param1=14; '+mission+'[1].Param1=11', 'Mission 5055 companion attribution'],
      ['Lance stages exchanged', 'companionSource', mission+'[0].Param3=165; '+mission+'[1].Param3=164', 'Mission 5055 Stage attribution'],
      ['Lance Stage 164 number', 'companionSource', stage+"[0].NameNum='5'", 'Stage 164 NameNum'],
      ['Lance Stage 165 number', 'companionSource', stage+"[1].NameNum='4'", 'Stage 165 NameNum'],
      ['Lance Fetter 74 and 75 Missions exchanged', 'companionSource',
        fetter+'[0].CompletionConditions[1].Parm1=5056; '+fetter+'[1].CompletionConditions[1].Parm1=5055', 'Fetter 74 Mission attribution'],
      ['Lance Fetter 74 condition order', 'companionSource', fetter+'[0].CompletionConditions.reverse()', 'Fetter 74 condition object at [1]'],
      ['Lance Fetter 74 locator', 'companionSource', fetter+"[0].selectedLocator='#/73/CompletionConditions/0'", 'Fetter 74 selected locator'],
      ['Lance decision stages exchanged', 'companionDecision', 'copy.rows[0].stageId=165; copy.rows[1].stageId=164', 'bond 4/5 approved decision tuples'],
      ['Lance companion decision missing', 'companionDecision', 'copy=undefined', 'missing bond 4/5 decision'],
      ['Lance companion decision status', 'companionDecision', "copy.status='PENDING'", 'bond 4/5 approval status'],
      ['Lance companion decision scope', 'companionDecision', "copy.scope='RUNTIME_COMPLETION'", 'bond 4/5 description-only scope'],
    ].map(args => bondDescriptionMutation(...args, true)),
    ...[
      ['Mission references exchanged', 'bondDescriptionSource',
        '[copy.fetters.records[0].CompletionConditions[1].Parm1,copy.fetters.records[1].CompletionConditions[1].Parm1] = [5054,5053]',
        'Fetter 72 Mission attribution at [1]'],
      ['Fetter 72 objects exchanged', 'bondDescriptionSource', 'copy.fetters.records[0].CompletionConditions.reverse()',
        'Fetter 72 Mission condition misplaced at [1]'],
      ['Fetter 72 locator', 'bondDescriptionSource', "copy.fetters.records[0].selectedLocator='#/71/CompletionConditions/0'", 'Fetter 72 selected locator'],
      ...[72,73].map(id => ['Fetter ' + id + ' absent', 'bondReferences',
        'copy.records=copy.records.filter(r=>!(r.heroId===16 && r.fetterId===' + id + '))', 'Hero 16 regular Fetter ' + id + ' reference']),
      ['Fetter 72 condition type', 'bondDescriptionSource', 'copy.fetters.records[0].CompletionConditions[1].ConditionType=1', 'Fetter 72 condition type at [1]'],
      ['Mission 5053 level changed', 'bondDescriptionSource', "copy.missions.records[0].Desc='兰斯到达31级'", 'Mission 5053 pinned Desc'],
      ['Mission 5054 elite removed', 'bondDescriptionSource', "copy.missions.records[1].Desc='使用兰斯完成时空裂缝3-1'", 'Mission 5054 pinned Desc'],
      ['Hero 16 Korean subject missing', 'heroLocalization', 'copy.records=copy.records.filter(r=>r.heroId!==16)', 'bond 3 Mission 5054 requires Hero 16 Korean name'],
      ['bond translation approval status', 'bondDescriptionDecision', "copy.status='PENDING'", 'publication approval status'],
      ['bond translation scope', 'bondDescriptionDecision', "copy.scope='RUNTIME_COMPLETION'", 'translation-only scope'],
      ['bond translation missing decision', 'bondDescriptionDecision', 'copy=undefined', 'missing publication decision'],
      ['bond translation Mission attribution', 'bondDescriptionDecision', '[copy.rows[0].missionId,copy.rows[1].missionId]=[5054,5053]', 'publication Mission attribution'],
      ['bond translation elite removed', 'bondDescriptionDecision', "copy.rows[1].textKo=copy.rows[1].textKo.replace('[정예]','')", 'publication Korean text'],
    ].map(args => bondDescriptionMutation(...args)),
    windOwnerMutation('acquisition only','canonical','changed.records = changed.records.filter(r=>r.skillId!==10418)',
      '10418 missing or incorrect Canonical acquisition 161/403 -> 1612 -> 10418'),
    windOwnerMutation('identity only','identities','changed.records = changed.records.filter(r=>r.skillId!==10418)','Skill Identity 10418 missing or duplicated'),
    windOwnerMutation('confirmation missing','decisionV5','delete changed.windBoundary.userConfirmation',
      '10418 missing user evidence for inclusive 50% Korean display'),
    windOwnerMutation('official KR promotion','decisionV5',"changed.windBoundary.userConfirmation.kind='OFFICIAL_KR'",
      '10418 Korean display evidence must come from user confirmation'),
    windOwnerMutation('combat runtime promotion','decisionV5',"changed.windBoundary.userConfirmation.scope='COMBAT_RUNTIME_VERIFIED'",
      '10418 Korean display scope cannot establish combat runtime'),
    windOwnerMutation('membership only','jobs','changed.records=changed.records.filter(r=>!(r.heroId===16 && r.jobId===403))','10418 Hero 16 Job 403 membership'),
    windOwnerMutation('usable Connection only','e',"changed.hero['UseableJobConnections_ID/0']=162",'10418 Hero usable Connection 161'),
    windOwnerMutation('JobLevel slot only','e',"changed.connections.find(r=>r.ID===161)['JobLevels_ID/1']=1613",'10418 Connection 161 JobLevels_ID[1]'),
    windOwnerMutation('GotSkill only','e',"changed.levels.find(r=>r.ID===1612).GotSkill_ID=10311",'10418 JobLevel 1612 acquisition'),
    {name:'10418 source operator',decisionPath:ordinaryEvidence,mutate:d=>{
      const row = d.skills.find(r=>r.ID===10418); row.Desc=row.Desc.replace('大于','大于等于');
    },error:talentError('10418 pinned Chinese Desc hash mismatch')},
    {name:'10418 missing decision',decisionPath:ordinaryDecisionV5,error:path=>"Error: ENOENT: no such file or directory, open '"+path+"'"},
    ...[
      ['description',d=>{d.rows[3].descriptionKo=d.rows[3].descriptionKo.replace('50% 이상','50% 초과');},'10418 Korean display decision or row order'],
      ['other Hero',d=>{d.windBoundary.heroId=15;},'10418 boundary subject or source scope'],
      ['other Skill',d=>{d.windBoundary.skillId=10303;},'10418 boundary subject or source scope'],
    ].map(([name,mutate,message])=>({name:'10418 decision '+name,decisionPath:ordinaryDecisionV5,mutate,error:talentError(message)})),
    ...[
      ['v4 at v5 path',d=>Object.assign(d,JSON.parse(v4Text)),'10418 public v5 schema version'],
      ['row order',d=>{[d.ordinarySkills[2],d.ordinarySkills[3]]=[d.ordinarySkills[3],d.ordinarySkills[2]];},'Lance ordinary public row fields'],
      ['duplicate',d=>{d.ordinarySkills.push(d.ordinarySkills[3]);},'Lance ordinary public row count'],
      ...['cooldownLabelKo','distanceLabelKo','areaLabelKo'].map(key=>[key,d=>{d.ordinarySkills[3][key]='-';},'Lance ordinary public row fields']),
    ].map(([name,mutate,message])=>({name:'10418 package '+name,decisionPath:ordinaryPublicV5,finalFile:true,mutate,error:talentError(message)})),

    ...[
      ['first FK',d=>{d.sources.HeroInfo.records[0].fields.HeroInformation_ID=15;},'Hero to HeroInformation FK'],
      ['second FK',d=>{d.sources.HeroInformationInfo.records[0].fields.HeroHeartFetterId=15;},'HeroInformation to Heart Fetter FK'],
      ['same-level Skills exchanged',d=>{
        const [first,second] = d.sources.HeroHeartFetterInfo.records[0].fields.UnlockSkills_ID;
        [first.SkillId,second.SkillId] = [second.SkillId,first.SkillId];
      },'UnlockSkills_ID level and Skill attribution'],
      ['wrong passive Buff',d=>{d.sources.SkillInfo.records[0].fields.PassiveBuffs_ID=[70226];},'Skill to Buff link'],
      ['two job mappings exchanged',d=>{
        const [first,second]=d.korean.mapping.rows;
        [first[1],second[1]]=[second[1],first[1]];
      },'frozen job mapping'],
      ['royal Lv7 threshold changed',d=>{const row=d.korean.overlay.skills['70228'];row.descriptionKr=row.descriptionKr.replace('미만','이하');},'frozen Korean text 70228'],
    ].map(([name,mutate,reason])=>({name,decisionPath:heartEvidence,mutate,error:()=>'Error: Heart Fetter '+reason})),
    consumerMutation('Lance Heart relation missing only at admission','lance-heart-fetter',
      'lanceRawRows(read(heartSourcePath),read(referencePath))',
      'lanceRawRows(read(heartSourcePath),{records:read(referencePath).records.filter(r=>!(r.heroId===16 && r.heartFetterId===16))})',
      'Heart Fetter missing Lance Heart Fetter 16 reference'),
    {
      ...consumerMutation('Liana internal receives Lance only after validator','hero-15-fetter-internal',
        '  validateFetterInternalProjection(input, generatedText);',
        `  const union = await readJson(root, '${rawPath}');
  const changed = structuredClone(input.heartConditions);
  changed.records[3] = structuredClone(union.records.find(r=>r.skillId===70228));
  validateFetterInternalProjection({...input,heartConditions:changed}, generatedText);`,''),
      error:()=>'AssertionError [ERR_ASSERTION]: Heart Fetter unresolved condition scope drift',
    },
    consumerMutation('Liana Minimal receives Lance in its effect rows','hero-15-integrated-publication-contract',
      'projectHeartFetterEffects(effectsDecision, heartFetterLevels, directEdges)',
      'projectHeartFetterEffects(effectsDecision, {...heartFetterLevels,records:heartFetterLevels.records.filter(r=>r.heroId===15).map(r=>r.skillId===70424 ? heartFetterLevels.records.find(x=>x.skillId===70228) : r)}, directEdges)',
      'Hero 15 Heart Fetter display row mismatch for Skill 70424'),
    consumerMutation('Lance royal Lv7 absent only at display','build',heartCall,
      heartCall.replace('(heartConditions,','({records:heartConditions.records.filter(r=>r.skillId!==70228)},'),
      'Heart Fetter 로열 나이트 Lv.7 Skill 70228 missing at #/14/UnlockSkills_ID/3, #/16419, #/32655'),
    ...[[164,405],[165,306]].map(([connection,job])=>consumerMutation('Heart edge missing '+connection,'build',heartCall,
      heartCall.replace('jobEdges.finals','jobEdges.finals.filter(r=>r.successorConnectionId!=='+connection+')'),
      'Heart Fetter direct edge '+connection+'/'+job)),
    {name:'heart decision missing',decisionPath:heartDecision,error:path=>"Error: ENOENT: no such file or directory, open '"+path+"'"},
    ...[
      ['job and level exchanged',d=>{const [first,,,last]=d.rows;[first.jobId,last.jobId]=[last.jobId,first.jobId];[first.level,last.level]=[last.level,first.level];}],
      ['level ten added',d=>{d.rows.push({...d.rows[3],level:10,skillId:70110});}],
    ].map(([name,mutate])=>({name:'heart decision '+name,decisionPath:heartDecision,mutate,error:()=>'Error: Heart Fetter Lance publication scope'})),

    ...[
      [commandBaseEvidence,'absent base materialized',d => {d.rawRecord.MagicDFCmd_INI=0;},'Lance explicit base fields'],
      [commandBaseEvidence,'base attack removed',d => {delete d.rawRecord.ATCmd_INI;},'Lance explicit base fields'],
      [commandBaseEvidence,'base other Hero locator',d => {d.source.recordLocator=d.source.path+'#/14';},'Lance base HeroInfo provenance'],
      [commandBondEvidence,'third Fetter selects Liana skill',d => {d.fetters[2].GotSkills_ID[9]=70039;},'Lance maximum-level Skill endpoints'],
      [commandBondEvidence,'third skill points to Liana buff',d => {d.skills[2].PassiveBuffs_ID=[70039];},'Lance passive Buff links'],
      [commandBondEvidence,'third Fetter defense replaced by magic defense',d => {d.buffs[3].Property2_ID=96;},'Lance Buff property slots 70019'],
      [commandBondEvidence,'second noncommand buff missing',d => {d.buffs.splice(2,1);},'Lance Buff endpoints'],
      [commandBondEvidence,'wrong enum',d => {d.propertyNamespace.members[95]='Hero3_MagicDFCmdAdd';},'Lance command enum'],
      [commandBondEvidence,'property not additive',d => {d.properties[2].IsAddType=false;},'Lance property type and additivity'],
      [commandBondEvidence,'wrong unit',d => {d.transformation.divisor=1000;},'Lance command percentage divisor'],
    ].map(([decisionPath,name,mutate,reason]) => ({decisionPath,name,mutate,error:()=>'AssertionError [ERR_ASSERTION]: '+reason})),
    ...[
      ['HeroInformation FK','{...bondCommand,lanceEvidence:{...bondCommand.lanceEvidence,hero:{...bondCommand.lanceEvidence.hero,HeroInformation_ID:15}}}', 'Hero 16 to HeroInformation attribution'],
      ['regular Fetter 73','{...bondCommand,references:{...bondCommand.references,records:bondCommand.references.records.filter(r => !(r.heroId===16 && r.fetterId===73))}}','Hero 16 regular Fetter relation 73'],
    ].map(([name,input,reason]) => ({
      ...consumerMutation('bond Owner isolated '+name,'build',bondCall,bondCall.replace('(bondCommand)','('+input+')'),reason),
      error:()=>'AssertionError [ERR_ASSERTION]: '+reason,
    })),
    ...['base','bond'].flatMap(kind => ['missing','Liana'].map(change => {
      const input = kind+'Command.canonical.records.find(row => row.heroId === 16)';
      return consumerMutation('Lance display '+kind+' '+change,'build',input,change==='missing'?'undefined':input.replace('=== 16','=== 15'),
        'Lance command '+kind+' attribution');
    })),
    {decisionPath:commandDecision,name:'command decision missing',error:path=>"Error: ENOENT: no such file or directory, open '"+path+"'"},
    {decisionPath:commandDecision,name:'command decision wrong form',mutate:d=>{d.mode='SP';},error:()=>'Error: Lance command publication scope or values'},
    ...[['base','canonical/hero-soldier-command-base.v1.json','soldierCommandBase'],
        ['bond','canonical/hero-soldier-command-bond-contributions.v1.json','soldierCommandBond']].flatMap(([kind,path,key]) => {
      const min = "readJson('"+path+"').then(owner => ({...owner, records:owner.records.filter(row => row.heroId === 15)}))";
      const full = "data['canonical."+key+"'].records.filter(row => row.heroId === 15)";
      return [
        consumerMutation('Liana Minimal '+kind+' receives Lance','hero-15-integrated-publication-contract',min,min.replace('=== 15','=== 16'),'Hero 15 Soldier Command owner values mismatch'),
        consumerMutation('Liana Full '+kind+' receives Lance','hero-15-full-detail-publication-contract',full,full.replace('=== 15','=== 16'),
          'Hero 15 Full Detail Publication contract: Hero 15 Soldier Command '+(kind==='base'?'base':'bond contribution')+' expected exactly one matching record; received 0'),
      ];
    }),
    ...[[403,'161/403 → 164/405','predecessor'], [405,'161/403 → 164/405','successor'],
        [302,'162/302 → 165/306','predecessor'], [306,'162/302 → 165/306','successor']].map(([id,edge,role]) =>
      consumerMutation('final path missing ' + role + ' Job ' + id, 'build', finalOwnerCall,
        finalOwnerCall.replace('heroJobRelations','{records:heroJobRelations.records.filter(row => row.heroId !== 16 || row.jobId !== '+id+')}'),
        'Hero 16 ' + edge + ' missing ' + role + ' Job ' + id)),
    ...[[2,162,164],[3,161,165]].map(([index,wrong,successor]) => ({
      name:'source predecessor for ' + successor, decisionPath:finalSource,
      mutate:doc => {doc.connections[index].PreJobConnectionList[0] = wrong;},
      error:() => 'Error: Hero 16 predecessor mismatch for successor ' + successor,
    })),
    ...[
      ['direction','({...row,predecessorConnectionId:row.successorConnectionId,predecessorJobId:row.successorJobId,successorConnectionId:row.predecessorConnectionId,successorJobId:row.predecessorJobId})'],
      ['successor','({...row,successorConnectionId:all[1-i].successorConnectionId,successorJobId:all[1-i].successorJobId})'],
      ['locator','({...row,sourceLocator:all[1-i].sourceLocator})'],
    ].map(([name, expression]) => consumerMutation('final path ' + name, 'build', finalOwnerCall,
      finalOwnerCall.replace('jobEdges.finals','jobEdges.finals.map((row,i,all) => '+expression+')'), 'Hero 16 final path endpoint or locator mismatch')),
    consumerMutation('final job names exchanged', 'build', finalOwnerCall,
      finalOwnerCall.replace('jobLocalization)', '{records:jobLocalization.records.map(r => [405,306].includes(r.jobId) ? {...r,jobId:r.jobId===405?306:405} : r)})'),
      'Hero 16 final Job localization mismatch'),
    consumerMutation('first Lance publication receives different single edge', 'build', 'jobEdges.first, jobLocalization',
      '{records:[jobEdges.finals[0]]}, jobLocalization', 'Hero 16 job path edge direction mismatch'),
    {name:'missing final job decision', decisionPath:finalDecision, error:path => "Error: ENOENT: no such file or directory, open '" + path + "'"},
    ...[['target',d => {d.heroId=15;}],['direction',d => {
      const path=d.paths[0]; [path.predecessor,path.successor]=[path.successor,path.predecessor];
    }],['order',d => d.paths.reverse()]].map(([name, mutate]) => ({name:'final job decision ' + name, decisionPath:finalDecision, mutate,
      error:() => 'Error: Hero 16 final path publication scope or order mismatch'})),
    consumerMutation('Liana internal tree receives Lance edge','hero-15-job-tree-internal',
      'edges:{records:lianaEdges}', 'edges:{records:[...lianaEdges.slice(0,4),edges.records[6]]}',
      'Advancement Canonical differs from its admitted evidence'),
    consumerMutation('Liana Minimal receives different valid successor after internal rendering','hero-15-integrated-publication-contract',
      'const paths = directEdges.map(', 'const paths = directEdges.map(row => row.successorConnectionId===154 ? {...row,successorConnectionId:155,successorJobId:707} : row).map(',
      'Hero 15 Job paths differ from the approved direct edges'),
    consumerMutation('Liana Full receives five rows with changed successor','hero-15-full-detail-publication-contract',
      'canonical.jobAdvancementRelations.records.filter((row) => row.heroId === 15)',
      'canonical.jobAdvancementRelations.records.filter((row) => row.heroId === 15).map(row => row.successorConnectionId===155 ? {...row,successorConnectionId:154,successorJobId:811} : row)',
      'Hero 15 Full Detail Publication contract: Job membership/Advancement relation parity failed'),
    { decisionPath:goldPublication, name:'Lance bond decision missing',
      error:path => `Error: ENOENT: no such file or directory, open '${path}'` },
    ...[
      [goldEvidence, 'source HeroInformation FK', doc => { doc.hero.fields.HeroInformation_ID = 15; }, 'Hero to HeroInformation FK'],
      [goldEvidence, 'source Fetter slots', doc => { [doc.information.fields.HeroFetters_ID[0],doc.information.fields.HeroFetters_ID[1]] = [72,71]; }, 'source selection'],
      [fetterReferences, 'heart relation namespace only', doc => { const row = doc.records.at(-1);
        row.referenceKind = 'HERO_FETTER_ID_REFERENCE'; row.fetterId = row.heartFetterId; delete row.heartFetterId;
        row.sourceField = 'ConfigDataHeroInformationInfo.HeroFetters_ID'; row.endpointNamespace = 'ConfigDataHeroFetterInfo.ID';
      }, 'HEART_FETTER 16 reference'],
      [heartDetails, 'heart detail namespace only', doc => { Object.assign(doc.records[1], {
        detailKind:'FETTER_RAW_DETAIL', endpointNamespace:'ConfigDataHeroFetterInfo.ID', sourceRecordLocator:'data/configdata/ConfigDataHeroFetterInfo.json#/15',
      }); }, 'HEART_FETTER 16 detail'],
      [goldEvidence, 'heart level locator namespace only', doc => { Object.assign(doc.endpoints[5].levels[0],
        { kind:'FETTER',endpointNamespace:'ConfigDataHeroFetterInfo.ID' }); }, 'HEART_FETTER 16 level locator'],
      [regularDetails, 'Liana same gold regular detail', doc => { const src = doc.records[0];
        Object.assign(doc.records[5], {heroId:src.heroId, endpointId:src.endpointId, sourceRecordLocator:src.sourceRecordLocator, provenance:src.provenance}); }, 'FETTER 71 detail'],
      [heartDetails, 'Liana same gold heart detail', doc => { const src = doc.records[0];
        Object.assign(doc.records[1], {heroId:src.heroId, endpointId:src.endpointId, sourceRecordLocator:src.sourceRecordLocator, provenance:src.provenance}); }, 'HEART_FETTER 16 detail'],
      [regularDetails, 'other group gold vector', doc => { doc.records[5].fields.LevelUpGold = doc.records[6].fields.LevelUpGold; }, 'FETTER 71 detail'],
      [goldPublication, 'one group omitted', doc => { doc.groups.pop(); }, 'publication scope'],
      ...groups.flatMap((id, i) => {
        const reason = (i === 5 ? 'HEART_FETTER ' : 'FETTER ') + id + ' source gold';
        return [
          [goldEvidence, 'positive gold ' + id, doc => { doc.endpoints[i].LevelUpGold[0]++; }, reason],
          [goldEvidence, 'equal total swapped levels ' + id, doc => { const gold = doc.endpoints[i].LevelUpGold;
            [gold[0],gold[1]] = [gold[1],gold[0]]; }, reason],
        ];
      }),
    ].map(([decisionPath,name,mutate,reason]) => ({ decisionPath,name:'Lance bond '+name,mutate,error:()=>'Error: Lance Fetter '+reason+' mismatch' })),
    ...[
      ['hero-15-fetter-internal','internal'], ['hero-15-integrated-publication-contract','Minimal Detail'],
      ['hero-15-full-detail-publication-contract','Full Detail'], ['validate-hero15-fetter-material-relations','material'],
      ['validate-hero15-fetter-condition-type-references','condition'], ['validate-hero15-fetter-reward-type-references','reward'],
      ['validate-hero15-fetter-skill-references','skill'],
    ].map(([module,consumer]) => ({
      decisionPath:'tools/'+module+'.mjs', name:'same-gold substitution in Liana '+consumer, mutateSource: source => {
        const original = "import { lianaFetterInput, checkLianaRegularFetters } from './lance-fetter-gold.mjs';";
        assert.equal(source.split(original).length, 2);
        return source.replace(original, `import { lianaFetterInput as selectLiana, checkLianaRegularFetters } from './lance-fetter-gold.mjs';
function lianaFetterInput(path, union) {
  const selected = selectLiana(path, union);
  if (path === '${regularDetails}') selected.records[0] = structuredClone(union.records[5]);
  return selected;
}`);
      }, error:()=>'Error: Liana '+consumer+' Fetter attribution mismatch',
    })),

    { decisionPath: lianaConsumer, name: 'Liana ten-row input replaced after union validation', mutateSource: source => {
      const input = 'const lianaRows = references.records.filter(row => row.heroId === 15);';
      assert.ok(source.includes(input));
      return source.replace(input, input + '\n  lianaRows[lianaRows.findIndex(row => row.skillId === 90089)] = references.records.find(row => row.heroId === 16 && row.skillId === 90092);');
    }, error: () => 'AssertionError [ERR_ASSERTION]: Hero 15 ten ordered Skill references or provenance mismatch' },
    { decisionPath: lanceEffectDecision, name: 'Lance central effect decision missing',
      error: path => `Error: ENOENT: no such file or directory, open '${path}'` },
    ...[
      [lanceEffectFreeze, 'frozen first line only', doc => {
        assert.ok(doc.record.effectTextKo.startsWith(firstFrozenLine));
        doc.record.effectTextKo = doc.record.effectTextKo.replace(firstFrozenLine, sheetLine);
      }, 'frozen Korean first line'],
      ['evidence/source/configdata/hero-16-central-discipline-skill.v1.json', 'source FK', doc => { doc.heroInfo.rawRecord.CastingLawSkill_ID = 90089; }, 'source FK'],
      [sharedReferences, 'reference omitted', doc => { doc.records.splice(doc.records.indexOf(lanceReference(doc)), 1); }, 'reference missing or duplicated'],
      [sharedReferences, 'reference kind', doc => { lanceReference(doc).referenceKind = 'HERO_DIRECT_SKILL_REFERENCE'; }, 'reference kind'],
      [sharedReferences, 'reference namespace', doc => { lanceReference(doc).endpointNamespace = 'ConfigDataJobInfo.ID'; }, 'endpoint namespace'],
      ['canonical/skills.v1.json', 'identity Desc', doc => { doc.records.find(row => row.skillId === 90092).descriptionCn += '。'; }, 'identity Desc digest'],
      ...[['heroId', 15], ['skillId', 90089], ['surface', 'hero-minimal-detail-15']].map(([key, value]) =>
        [lanceEffectDecision, 'decision ' + key, doc => { doc[key] = value; }, 'publication scope']),
      [lanceEffectDecision, 'decision locator', doc => { doc.koreanSource.locator = '#/records/8'; }, 'decision frozen locator'],
      [lanceEffectDecision, 'decision first line', doc => { doc.effectLines[0] = sheetLine; }, 'decision Korean text'],
    ].map(([decisionPath, label, mutate, reason]) => ({ decisionPath, name: 'Lance central ' + label, mutate,
      error: () => 'Error: Lance central ' + reason + (reason === 'reference missing or duplicated' ? '' : ' mismatch') })),

    {decisionPath:ordinaryEvidence,name:'1641 grants a different skill',mutate:d=>{
      d.levels.find(row=>row.ID===1641).GotSkill_ID=10105;
    },error:talentError('JobLevel 1641 must grant Skill 11819')},
    {decisionPath:ordinaryDecisionV4,name:'missing v4 decision',error:path=>`Error: ENOENT: no such file or directory, open '${path}'`},
    ...[
      ['Hero',d=>{d.heroId=15;},'Hero'],
      ['path',d=>{d.publicPath=ordinaryPublicV3;},'public path'],
      ['rows',d=>{d.rows.splice(6,1);},'rows'],
    ].map(([name,mutate,reason])=>({decisionPath:ordinaryDecisionV4,name:'v4 decision '+name,mutate,error:talentError('Lance v4 decision '+reason)})),
    ...[
      ['passive',d=>{stormRow(d).typeLabelKo='패시브';},'values'],
      ['cooldown and duration exchanged',d=>{const r=stormRow(d); r.cooldownLabelKo='쿨 4턴'; r.descriptionKo=r.descriptionKo.replace('4턴','3턴');},'values'],
      ['faction omitted',d=>{stormRow(d).descriptionKo=stormRow(d).descriptionKo.replace("'제국의 빛' ",'');},'values'],
      ['non-stacking omitted',d=>{stormRow(d).descriptionKo=stormRow(d).descriptionKo.split(' 다른 초절강화')[0];},'values'],
      ['unapproved percentage',d=>{stormRow(d).descriptionKo=stormRow(d).descriptionKo.replace('크게','20%');},'values'],
      ['extra field',d=>{stormRow(d).factionId=4;},'row fields'],
      ['duplicate',d=>{d.ordinarySkills.push(stormRow(d));},'row count'],
      ['misordered rows',d=>{const rows=d.ordinarySkills; [rows[6],rows[1]]=[rows[1],rows[6]];},'values'],
    ].map(([name,mutate,reason])=>({decisionPath:ordinaryPublicV4,finalFile:true,name:'v4 '+name,mutate,error:talentError('Lance ordinary public '+reason)})),

    {decisionPath:lanceGoldDecision, name:'Lance gold decision missing', error:path => `Error: ENOENT: no such file or directory, open '${path}'`},
    ...[
      [lanceGoldDecision, 'Liana decision replaces Lance decision', doc => {
        for (const key of Object.keys(doc)) delete doc[key];
        Object.assign(doc,lianaDecision);
      }, 'publication scope'],
      [lanceGoldDecision, 'Lance gold slot missing', doc => doc.slots.splice(2,1), 'publication scope'],
      [levelGoldRefs, 'Lance weapon ordered ID and locator bundles exchanged', ({records}) => {
        for (const first of records.filter(row => row.templateId === 1)) {
          const second = records.find(row => row.templateId === 2 && row.sourceArrayIndex === first.sourceArrayIndex);
          for (const key of ['levelUpInfoId','levelUpSourceArrayIndex','levelUpRecordLocator']) {
            [first[key],second[key]] = [second[key],first[key]];
          }
        }
      }, 'CastingLawLevelUpInfoList attribution'],
      [heroGoldRefs, 'Lance weapon FK exchange', ({records}) => {
        const [first,second] = records.filter(row => row.heroId === 16);
        [first.templateId,second.templateId] = [second.templateId,first.templateId];
      }, 'Hero FK'],
      [heroGoldRefs, 'Lance shared accessory FK missing', doc => {
        doc.records = doc.records.filter(row => !(row.heroId === 16 && row.templateId === 41));
      }, 'Hero FK'],
      [templatePath, 'Lance armor equipment type', ({records}) => {
        records.find(row => row.templateId === 30).rawRecord.EquipmentType = 2;
      }, 'EquipmentType'],
      [levelCosts, 'Lance two costs exchanged within weapon', ({records}) => {
        exchangeCost(...costsFor(records,[1,2]));
      }, 'level cost'],
      [levelCosts, 'Lance armor and head cost vectors exchanged', ({records}) => {
        const armor = costsFor(records,[146,147,148,149,150,10146,10147,10148,10149,10150]);
        const head = costsFor(records,[161,162,163,164,165,10161,10162,10163,10164,10165]);
        armor.forEach((row,index) => exchangeCost(row,head[index]));
      }, 'level cost'],
    ].map(([decisionPath,name,mutate,reason]) => ({decisionPath,name,mutate,error:()=>'Error: Lance gold '+reason+' mismatch'})),

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
    ...[[5025,202],['10303·10305',306],['10105·11819',405]].map(([skill,job])=>({
      decisionPath:membership, name:`Skill ${skill} missing Hero 16–Job ${job}`,
      mutate:doc=>{ doc.records = doc.records.filter(r=>!(r.heroId===16 && r.jobId===job)); },
      error:talentError(`${skill}의 Hero 16–Job ${job} 소속 누락 또는 출처 불일치`),
    })),
    ...[
      [165, 0, 1653, 1651, 10305],
      [164, 2, 1641, 1643, 10105],
      [164, 0, 1643, 1641, 11819],
    ].map(([connection,slot,wrong,expected,skill])=>({
      decisionPath:ordinaryEvidence, name:`Skill ${skill}: Connection ${connection} [${slot}] only`,
      mutate:d=>{d.connections.find(r=>r.ID===connection)[`JobLevels_ID/${slot}`]=wrong;},
      error:talentError(`Skill ${skill} requires Connection ${connection} JobLevels_ID[${slot}]=${expected}, found ${wrong}`),
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
    }, error:talentError('Skill 10303 requires Connection 165 JobLevels_ID[2]=1653, found undefined') },
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

    { ...consumerMutation('Lance Talent Job 403 omitted','hero-16-talent-publication-contract',
      'assert.deepEqual(jobs.records.filter(r => r.heroId === 16)', 'assert.deepEqual(jobs.records.filter(r => r.heroId === 16 && r.jobId !== 403)',
      'Lance Talent Job membership'), error:talentError('Lance Talent Job membership') },
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
      cpSync(normalSource, source, { recursive: true });
      if (mode === '--verify-dir') await cp(normalPackage, destination, { recursive: true });
      const path = join(test.finalFile && mode === '--verify-dir' ? destination : source, test.decisionPath);
      if (test.mutateSource) {
        await writeFile(path, test.mutateSource(await readFile(path, 'utf8')));
      } else if (test.mutate) {
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

  for (const file of [lanceTalentPublic,ordinaryPublic,ordinaryPublicV2,ordinaryPublicV3,ordinaryPublicV4,ordinaryPublicV5]) for (const mode of modes) {
    const root = await mkdtemp(join(temp, 'lance-json-missing-'));
    const source = join(root, 'source');
    const destination = join(root, 'package');
    cpSync(normalSource, source, { recursive: true });
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
    cpSync(normalSource, source, { recursive: true });
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
  const secondFrozenLine = '혼합부대로 구성 시 이동력 +2, 전투 후 피해량의 20%만큼 회복';
  const goldDecision = JSON.parse(await readFile(lanceGoldDecision, 'utf8'));
  const appParagraphs = lines => lines.map(line => `    '${line}',`).join('\n');
  const lanceDefense = "['방어', '+10%', '+25%'],\n    ['마방', '', '+10%']";
  const dragonFour = 'Lv.4 · 부대 생명이 100%일 시, 받는 피해 -10%';
  const royalFour = 'Lv.4 · 공격을 받아 전투 진입 시, 받는 마법 피해 -10%';
  const royalSeven = 'Lv.7 · 부대 생명이 70% 미만일 시, 주는 피해 +10%';
  const bothGroups = approvedApp.toString('utf8').match(/    \['드래곤 마스터', 'Lv\.4[^\n]+\n    \['로열 나이트', 'Lv\.4[^\n]+/)[0];
  const windList = "renderMinimalDetailList('일반 스킬', labels)";
  const dragonPath = '전직 · 드래곤 나이트 → 드래곤 마스터';
  const royalPath = '전직 · 하이랜더 → 로열 나이트';
  const finalMovementRows = "'"+dragonPath+" · 기본 사거리 1 · 비행 · 이동력 5', '"+royalPath+" · 기본 사거리 1 · 기마 · 이동력 5'";
  const afterBondPanel = '  const finalPaths = [';
  function moveListAfterNextTotal(index) {
    return `const nodes = [...bonds.children]; [nodes[${index}],nodes[${index+1}]] = [nodes[${index+1}],nodes[${index}]]; bonds.replaceChildren(...nodes);\n` + afterBondPanel;
  }
  const rendererCases = [
    ['Lance 115 link to homonymous SP', 'Lance forward destination 115',
      "['근위창병', 'normal-soldier-115']", "['근위창병', 'sp-soldier-5115']"],
    ['NORMAL 115 reverse Lance link', 'NORMAL 115 reverse DOM',
      'const heroLinks = makeSoldierHeroLinks(soldier.normalSoldierId);',
      "const heroLinks = makeSoldierHeroLinks(soldier.normalSoldierId); if (soldier.normalSoldierId === 115) { const item = document.createElement('li'); item.append(makeAnchor('란스 (영웅 ID 16)', 'hero-minimal-detail-16')); heroLinks.children[1].append(item); }"],
    ['Lance bond 1 list after second total', 'Lance bond 1 level list placement', afterBondPanel, moveListAfterNextTotal(2)],
    ['Lance bond 1 rendered gold exchanged', 'Lance bond 1 level gold text',
      '    [1500, 2300, 3500, 5300,', '    [2300, 1500, 3500, 5300,'],
    ['Lance bonds 2 and 3 lists exchanged', 'Lance bond 2 level gold text', afterBondPanel,
      'const second = bonds.children[4], third = bonds.children[6]; const a = second.children[1], b = third.children[1]; ' +
      'second.replaceChildren(second.children[0], b); third.replaceChildren(third.children[0], a);\n' + afterBondPanel],
    ['Lance bond 3 list after fourth total', 'Lance bond 3 level list placement', afterBondPanel, moveListAfterNextTotal(6)],
    ['Lance displayed movement labels exchanged', 'Lance successor Job movement mismatch: ' + dragonPath,
      finalMovementRows, finalMovementRows.replace('비행','기마').replace(royalPath+' · 기본 사거리 1 · 기마',royalPath+' · 기본 사거리 1 · 비행')],
    ['Lance obsolete first final job paragraph', 'Lance old final job paragraph occurrence: ' + dragonPath,
      'command, heart, ...bondDescriptions, soldiers]);',
      "command, heart, ...bondDescriptions, soldiers, Object.assign(document.createElement('p'), {textContent: '" + dragonPath + "'})]);"],
    ['Lance bond 4 Gate of Fate number', 'Lance bond 4 rendered Gate of Fate number or text',
      '유대 4 · 나암과 함께 운명의문 4 클리어', '유대 4 · 나암과 함께 운명의문 5 클리어'],
    ['Lance bond 5 Gate of Fate number', 'Lance bond 5 rendered Gate of Fate number or text',
      '유대 5 · 쉐리와 함께 운명의문 5 클리어', '유대 5 · 쉐리와 함께 운명의문 4 클리어'],
    ['Lance companion paragraph order', 'Lance companion paragraph placement after bond 3',
      appParagraphs(['유대 4 · 나암과 함께 운명의문 4 클리어','유대 5 · 쉐리와 함께 운명의문 5 클리어']),
      appParagraphs(['유대 5 · 쉐리와 함께 운명의문 5 클리어','유대 4 · 나암과 함께 운명의문 4 클리어'])],
    ['Lance bond description order', 'Lance bond description placement after Heart Fetter',
      'command, heart, ...bondDescriptions, soldiers]', 'command, heart, ...bondDescriptions.reverse(), soldiers]'],
    ['Lance bond 3 missing elite', 'Lance bond description rendered text',
      '란스를 출전시켜 시공의 균열 3-1[정예] 클리어', '란스를 출전시켜 시공의 균열 3-1 클리어'],
    ['10418 renderer threshold','10418 rendered Korean text',windList,
      "renderMinimalDetailList('일반 스킬', labels.map(line=>line.replace('생명 50% 이상','생명 50% 초과')))"],
    ['10418 renderer position','10418 rendered row must follow 격돌 and precede 구급',windList,
      "renderMinimalDetailList('일반 스킬', [...labels.slice(0,2),labels[3],labels[2],...labels.slice(4)])"],

    ['Lance Heart Lv4 job exchange','Lance Heart job attribution',bothGroups,
      bothGroups.replace(dragonFour,'TEMP').replace(royalFour,dragonFour).replace('TEMP',royalFour)],
    ['Lance Heart incoming direction','Lance Heart effect text',dragonFour,dragonFour.replace('받는','주는')],
    ['Lance Heart incoming sign','Lance Heart effect text',royalFour,royalFour.replace('-10%','+10%')],
    ['Lance Heart threshold','Lance Heart effect text',royalSeven,royalSeven.replace('미만','이하')],
    ['Lance Heart position only','Lance Heart placement after command','[jobPath, discipline, bonds, ...finalPaths, command, heart, ...bondDescriptions, soldiers]',
      '[jobPath, heart, discipline, bonds, ...finalPaths, command, ...bondDescriptions, soldiers]'],

    ['Lance defense and magic defense values swapped','Soldier Command values: 방어',lanceDefense,
      "['방어', '', '+10%'],\n    ['마방', '+10%', '+25%']"],
    ['Lance absent magic defense has text','Lance unadmitted base magic defense text',"['마방', '', '+10%']","['마방', '+0%', '+10%']"],
    ...[['aria-label','name'],['aria-description','description']].map(([attribute,label]) =>
      ['Lance blank cell '+attribute,'Lance base magic defense accessible '+label,'cell.textContent = value;',
        "cell.textContent = value; if (stat === '마방' && value === '') cell.setAttribute('"+attribute+"','+0%');"]),
    ['Lance command additional paragraph','Soldier Command table structure','...finalPaths, command, heart, ...bondDescriptions, soldiers]);',
      "...finalPaths, (command.append(document.createElement('p')), command), heart, ...bondDescriptions, soldiers]);"],
    ['Lance command section moved','Lance command must immediately follow second final job paragraph','...finalPaths, command, heart, ...bondDescriptions, soldiers]);','command, ...finalPaths, heart, ...bondDescriptions, soldiers]);'],
    ['Lance bond totals exchanged', 'Lance bond total paragraph attribution',
      appParagraphs(['유대 1 · Lv.2~10 합계 골드 118,600','유대 2 · Lv.2~10 합계 골드 383,500']),
      appParagraphs(['유대 1 · Lv.2~10 합계 골드 383,500','유대 2 · Lv.2~10 합계 골드 118,600'])],

    ['Lance effect lines exchanged', 'Lance central effect order or placement',
      appParagraphs([firstFrozenLine, secondFrozenLine]), appParagraphs([secondFrozenLine, firstFrozenLine])],
    ['Lance second effect after gold', 'Lance central effect order or placement',
      appParagraphs([secondFrozenLine, ...goldDecision.paragraphs]), appParagraphs([...goldDecision.paragraphs, secondFrozenLine])],
    ['Lance storm and defense threat descriptions exchanged','Packaged Lance ordinary skill row text or placement',
      '...range, row.descriptionKo].join', '...range, (i===7 || i===8) ? data.ordinarySkills[15-i].descriptionKo : row.descriptionKo].join'],

    ["Lance armor and head gold exchanged", "Lance gold paragraph attribution", "    '갑옷 · Lv.1~10 소계 골드 3,600,000',\n    '투구 · Lv.1~10 소계 골드 1,800,000',", "    '갑옷 · Lv.1~10 소계 골드 1,800,000',\n    '투구 · Lv.1~10 소계 골드 3,600,000',"],
    ["Lance weapon labels exchanged", "Lance gold paragraph attribution", "    '무기 1 · Lv.1~10 소계 골드 1,800,000',\n    '무기 2 · Lv.1~10 소계 골드 1,800,000',", "    '무기 2 · Lv.1~10 소계 골드 1,800,000',\n    '무기 1 · Lv.1~10 소계 골드 1,800,000',"],

    ['Lance ordinary cost and cooldown swapped', 'Packaged Lance ordinary skill row text or placement',
      '`${row.cost}코스트`, ...range', '`${data.ordinarySkills[i===1 ? 2 : i===2 ? 1 : i].cost}코스트`, ...range.map((value,j)=>j===0 && (i===1 || i===2) ? data.ordinarySkills[3-i].cooldownLabelKo : value)'],
    ['Lance ordinary 10311 type changed', 'Packaged Lance ordinary skill row text or placement',
      'labels.push([row.nameKo, row.typeLabelKo,', "labels.push([row.nameKo, row.skillId === 10311 ? '패시브' : row.typeLabelKo,"],

    ...[
      ['attack command after charge', '[...labels.slice(0,5),labels[6],labels[5],...labels.slice(7)]'],
      ['passive descriptions exchanged', 'labels.map((line,i)=>(i===5 || i===8) ? line.replace(data.ordinarySkills[i].descriptionKo,data.ordinarySkills[13-i].descriptionKo) : line)'],
      ['order', 'labels.reverse()'], ['duplication', '[...labels, labels[0]]'],
      ['description attribution', 'labels.map((line,i)=>i===0 ? line.replace(data.ordinarySkills[0].descriptionKo,data.ordinarySkills[4].descriptionKo) : line)'],
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
    ['Lance final jobs interchanged', 'Lance final job paragraph attribution',
      finalMovementRows, finalMovementRows.replace(dragonPath, '전직 · 드래곤 나이트 → 로열 나이트').replace(royalPath, '전직 · 하이랜더 → 드래곤 마스터')],
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
      cpSync(normalSource, source, { recursive: true });
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
      cpSync(normalSource, source, { recursive: true });
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
