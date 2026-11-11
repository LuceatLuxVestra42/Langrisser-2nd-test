import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

const evidencePath = 'evidence/source/configdata/ConfigDataSkillInfo.records-hero-6-8-talent-skills.v1.json';
const soldierEvidencePath = 'evidence/source/configdata/ConfigDataSkillInfo.records-soldier-skill-targets-30.v1.json';
const hero15EvidencePath = 'evidence/source/configdata/ConfigDataSkillInfo.records-hero-15-talent-skills.v1.json';
const hero15GeneralEvidencePath = 'evidence/source/configdata/ConfigDataSkillInfo.records-hero-15-general-skills.v1.json';
const canonicalPath = 'canonical/skills.v1.json';
const talentPath = 'canonical/hero-talent-star-skills.v1.json';
const expected = [
  [3067, 240, '传说的骑士', '每移动<color=#DC143C>1</color>格，伤害提升<color=#DC143C>1%</color>，防御提升<color=#DC143C>5%</color>。攻击后，可以再次移动<color=#DC143C>3</color>格。'],
  [3072, 241, '传说的骑士', '每移动<color=#DC143C>1</color>格，伤害提升<color=#DC143C>2%</color>，防御提升<color=#DC143C>10%</color>。攻击后，可以再次移动<color=#DC143C>3</color>格。'],
  [3077, 242, '传说的骑士', '每移动<color=#DC143C>1</color>格，伤害提升<color=#DC143C>3%</color>，防御提升<color=#DC143C>15%</color>。攻击后，可以再次移动<color=#DC143C>3</color>格。'],
  [3082, 243, '传说的骑士', '每移动<color=#DC143C>1</color>格，伤害提升<color=#DC143C>4%</color>，防御提升<color=#DC143C>20%</color>。攻击后，可以再次移动<color=#DC143C>3</color>格。'],
  [3196, 291, '秘法延伸', '进入战斗时，魔法伤害提升<color=#DC143C>10%</color>，使用技能时射程提升<color=#DC143C>1</color>。'],
  [3197, 292, '秘法延伸', '进入战斗时，魔法伤害提升<color=#DC143C>15%</color>，使用技能时射程提升<color=#DC143C>1</color>。'],
  [3198, 293, '秘法延伸', '进入战斗时，魔法伤害提升<color=#DC143C>20%</color>，使用技能时射程提升<color=#DC143C>1</color>。'],
  [3199, 294, '秘法延伸', '进入战斗时，魔法伤害提升<color=#DC143C>30%</color>，使用技能时射程提升<color=#DC143C>1</color>。'],
];
const hero15Expected = [
  [3212, 307, '圣洁的修女', '行动结束时驱散<color=#DC143C>1</color>格内其他友军<color=#DC143C>1</color>个弱化效果并治疗生命值，治疗量为自身智力的<color=#DC143C>1.5</color>倍。'],
  [3214, 308, '圣洁的修女', '行动结束时驱散<color=#DC143C>2</color>格内其他友军<color=#DC143C>1</color>个弱化效果并治疗生命值，治疗量为自身智力的<color=#DC143C>2</color>倍。'],
  [3216, 309, '圣洁的修女', '行动结束时驱散<color=#DC143C>2</color>格内其他友军<color=#DC143C>1</color>个弱化效果并治疗生命值，治疗量为自身智力的<color=#DC143C>2.5</color>倍。'],
  [3218, 310, '圣洁的修女', '行动结束时驱散<color=#DC143C>2</color>格内其他友军<color=#DC143C>2</color>个弱化效果并治疗生命值，治疗量为自身智力的<color=#DC143C>3</color>倍。'],
];
const hero15GeneralExpected = [
  [10801,1913,'治疗术','[治疗]主动使用，恢复单个部队的生命值，恢复量为施法者智力的<color=#DC143C>5</color>倍。并且驱散<color=#DC143C>1</color>个弱化效果。'],
  [10816,1932,'再行动','[支援]主动使用，可以使<color=#DC143C>1</color>个己方行动完的部队再次行动。并恢复施法者智力<color=#DC143C>2</color>倍的生命。'],
  [10805,1917,'福音','[支援]主动使用，使得单个部队的攻击、智力、防御提升<color=#DC143C>20%</color>，且免疫所有弱化效果，持续<color=#DC143C>2</color>回合。'],
  [10707,1896,'风刃','[魔法伤害]攻击单个敌军，造成<color=#DC143C>1.5</color>倍伤害，对「飞兵」有特效。'],
  [10705,1894,'冰冻','[魔法伤害]攻击单个敌军，造成<color=#DC143C>1.5</color>倍伤害，对「枪兵」有特效。'],
  [10804,1916,'群体护盾','[支援]主动使用，使得范围内多个部队的防御提升<color=#DC143C>20%</color>，且免疫:“防御、魔防降低”、"无法被治疗“，持续<color=#DC143C>2</color>回合。'],
  [10807,1921,'圣疗','[治疗]恢复大范围内多个部队的生命，恢复量为施法者智力的<color=#DC143C>4</color>倍，并在行动结束时，恢复<color=#DC143C>20%</color>的生命，持续<color=#DC143C>2</color>回合。'],
  [6009,1805,'冥想','[被动]当部队生命值高于<color=#DC143C>90%</color>时，智力、魔防提升<color=#DC143C>10%</color>。'],
  [11786,2028,'召唤天空射手','[召唤]召唤一个天空射手。'],
];
const hero15GeneralIds = hero15GeneralExpected.map(([id]) => id);
const expectedIds = expected.map(([id]) => id);
const hero15ExpectedIds = hero15Expected.map(([id]) => id);
const soldierSkillIds = [60666,60667,60668,60669,60670,60671,60672,60673,60674,60675,66957,66958,66959,66960,66961,66962,66963,66964,66965,66966,65110,65111,65112,65113,65114,65115,65116,65117,65118,65119];
const allExpectedIds = [...expectedIds, ...hero15ExpectedIds, ...soldierSkillIds, ...hero15GeneralIds];
const recordIndices = Object.fromEntries(expected.map(([id, index]) => [String(id), index]));
const sourcePin = {
  repository: 'LuceatLuxVestra42/langrisser-future-guide',
  commit: '6475e63ee23d18adf733756c26a14fa9e3ed662c',
  commitTree: '08e1e6c2773730e60b258940e31494f68d65f86a',
  path: 'data/configdata/ConfigDataSkillInfo.json',
  gitBlobSha1: 'dbd7f8f94702bb43d2ceb0091e9755c9aebaed19',
  sha256: '2ff6d67e8c010037597928bccd2dc7b4b9abc0d2a78c9705d816c8218df3e741',
  sizeBytes: 20948140,
  containerPath: '$',
  primaryKey: 'ID',
  sourceIndex: {
    path: 'data/index/skill.v1.json',
    gitBlobSha1: '7bc7ce0f2ac59224763faf1a70e19e199eecc900',
    sourceSha256: '2ff6d67e8c010037597928bccd2dc7b4b9abc0d2a78c9705d816c8218df3e741',
    recordCount: 27198,
    recordIndices,
  },
  releaseArchive: {
    assetId: 540460413,
    name: 'configdata-source-v1-6475e63e.tar',
    sha256: '65855321776cba9523669a2d486c2edbd2908006cf854572b7a87b0b63405c84',
    archiveBytesVerifiedHere: false,
  },
};
const hero15SourcePin = {...sourcePin, sourceIndex: {...sourcePin.sourceIndex, recordIndices: Object.fromEntries(hero15Expected.map(([id,idx])=>[id,idx]))}};
const prior38RecordsGitBlob = '5a6112db267526037c0e996d24c9df72eb0023cd';
const check = (condition, code, message) => { if (!condition) throw new Error(`Skill identity validation failed [${code}]: ${message}`); };
const exactKeys = (value, keys, label) => check(value && typeof value === 'object' && !Array.isArray(value)
  && isDeepStrictEqual(Object.keys(value).sort(), [...keys].sort()), 'SCHEMA', `${label} fields drift`);
const readJson = async (root, path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));

export async function validateSkillIdentities(root = process.cwd()) {
  const [evidence, soldierEvidence, canonical, talent, hero15Evidence, hero15GeneralEvidence] = await Promise.all([
    readJson(root, evidencePath), readJson(root, soldierEvidencePath), readJson(root, canonicalPath), readJson(root, talentPath), readJson(root, hero15EvidencePath), readJson(root, hero15GeneralEvidencePath),
  ]);
  exactKeys(evidence, ['schemaVersion', 'responsibility', 'scope', 'source', 'extraction', 'records', 'claimEvidence', 'fieldMeaningContract', 'interpretation', 'canonical', 'generated', 'productionRuntimeDependency'], 'Evidence');
  check(evidence.schemaVersion === 1 && evidence.responsibility === 'skill-identity-and-source-detail', 'EVIDENCE', 'Evidence owner identity drift');
  exactKeys(evidence.scope, ['sourceScope', 'skillIds', 'claim', 'outOfScope'], 'Evidence scope');
  check(evidence.scope.sourceScope === 'CN ConfigData snapshot 2026-09-02'
    && isDeepStrictEqual(evidence.scope.skillIds, expectedIds)
    && evidence.scope.claim === 'The pinned ConfigData SkillInfo source has these native Skill IDs, Chinese Name strings, and Chinese Desc strings.'
    && isDeepStrictEqual(evidence.scope.outOfScope, ['Korean Skill localization', 'structured combat/effect rules', 'PassiveBuffs_ID endpoint semantics', 'Skill acquisition', 'Hero or Job ownership', 'icon asset existence or meaning']),
  'SCOPE', 'Evidence scope or limitations drift');
  exactKeys(evidence.source, Object.keys(sourcePin), 'Evidence source pin');
  check(isDeepStrictEqual(evidence.source, sourcePin), 'SOURCE_PIN', 'Source commit, blob, checksum, index, or record locators drift');
  exactKeys(evidence.extraction, ['selection', 'rawSourceDownloadedAtPinnedCommit', 'blobAndSha256Verified', 'sourceIndexIdToRecordIndexVerified'], 'Extraction');
  check(evidence.extraction.selection === 'Select top-level array records only when numeric source-native ID equals one of the declared skillIds; preserve only the exact raw ID, Name, and Desc fields used by admitted claims. Other source fields are intentionally excluded.'
    && evidence.extraction.rawSourceDownloadedAtPinnedCommit === true
    && evidence.extraction.blobAndSha256Verified === true
    && evidence.extraction.sourceIndexIdToRecordIndexVerified === true, 'EXTRACTION', 'Extraction statement drift');
  check(Array.isArray(evidence.records) && evidence.records.length === expected.length, 'SOURCE_RECORDS', 'Evidence must contain exactly eight selected source records');
  const evidenceIds = [];
  for (let i = 0; i < expected.length; i += 1) {
    const [id, index, name, description] = expected[i];
    const record = evidence.records[i];
    exactKeys(record, ['sourceRecordIndex', 'sourceRecordLocator', 'rawRecord'], `Evidence record ${id}`);
    exactKeys(record.rawRecord, ['ID', 'Name', 'Desc'], `Raw SkillInfo record ${id}`);
    check(record.sourceRecordIndex === index && record.sourceRecordLocator === `${sourcePin.path}#ID=${id}`
      && record.rawRecord.ID === id && typeof record.rawRecord.ID === 'number'
      && record.rawRecord.Name === name && typeof record.rawRecord.Name === 'string'
      && record.rawRecord.Desc === description && typeof record.rawRecord.Desc === 'string',
    'SOURCE_RECORDS', `Raw SkillInfo record ${id} differs from the directly checked pinned source slice`);
    evidenceIds.push(record.rawRecord.ID);
  }
  check(new Set(evidenceIds).size === evidenceIds.length, 'SOURCE_RECORDS', 'Duplicate source Skill ID');
  exactKeys(evidence.claimEvidence, ['sourceIdNameAndDescValues', 'fieldDisplayMeaning'], 'Claim evidence assessment');
  check(evidence.claimEvidence.sourceIdNameAndDescValues === 'A' && evidence.claimEvidence.fieldDisplayMeaning === 'B',
    'EVIDENCE_CLASS', 'Claim evidence class drift');
  const meaningContract = evidence.fieldMeaningContract;
  exactKeys(meaningContract, ['evidenceClass', 'repository', 'commit', 'path', 'gitBlobSha1', 'status', 'skillInfoFieldNumbers', 'supportedMeaning', 'limitation'], 'Field meaning contract');
  exactKeys(meaningContract.skillInfoFieldNumbers, ['ID', 'Name', 'Desc'], 'SkillInfo field numbers');
  check(meaningContract.evidenceClass === 'B'
    && meaningContract.repository === 'LuceatLuxVestra42/langrisser-future-guide'
    && meaningContract.commit === '6475e63ee23d18adf733756c26a14fa9e3ed662c'
    && meaningContract.path === 'data/hero-skill-acquisition-stage4-4.v1.json'
    && meaningContract.gitBlobSha1 === 'afdabed9f82a401f50ed344e5ee4877bbc024f9c'
    && meaningContract.status === 'validated-review'
    && isDeepStrictEqual(meaningContract.skillInfoFieldNumbers, { ID: 2, Name: 3, Desc: 5 })
    && meaningContract.supportedMeaning === 'SkillInfo IDs are resolved to display metadata only after the explicit acquisition/reference edge has been established.'
    && meaningContract.limitation === 'This predecessor contract is review-scoped, does not establish combat mechanics, and its other candidate field numbers are not admitted here.',
  'FIELD_CONTRACT', 'Field meaning evidence pin or scope drift');
  exactKeys(evidence.interpretation, ['name', 'description'], 'Interpretation');
  check(evidence.interpretation.name === 'ConfigDataSkillInfo.Name is preserved as the source Chinese name string; no Korean translation or alias is asserted.'
    && evidence.interpretation.description === 'ConfigDataSkillInfo.Desc is preserved as an opaque source Chinese description string, including markup; no structured formula or independent mechanic claim is derived from its text.',
  'INTERPRETATION', 'Field meaning or limitation drift');
  check(evidence.canonical === false && evidence.generated === false && evidence.productionRuntimeDependency === false,
    'BOUNDARY', 'Evidence must remain non-canonical, non-generated, and outside runtime dependencies');


  // Four source-native Hero 15 Skill claims have independent evidence and a separate display/publication boundary.
  exactKeys(hero15Evidence, ['schemaVersion','responsibility','scope','source','extraction','records','claimEvidence','fieldMeaningContract','interpretation','canonical','generated','publicationApproval','productionRuntimeDependency'], 'Hero15 Evidence');
  check(hero15Evidence.schemaVersion === 1 && hero15Evidence.responsibility === 'skill-identity-and-source-detail', 'HERO15_EVIDENCE', 'Evidence owner drift');
  exactKeys(hero15Evidence.scope, ['sourceScope','skillIds','claim','outOfScope'], 'Hero15 Evidence Scope');
  check(hero15Evidence.scope.sourceScope === evidence.scope.sourceScope && isDeepStrictEqual(hero15Evidence.scope.skillIds, hero15ExpectedIds)
    && hero15Evidence.scope.claim === 'Four distinct Hero 15 SkillInfo IDs with exact Chinese Name/Desc source strings.'
    && isDeepStrictEqual(hero15Evidence.scope.outOfScope, [...evidence.scope.outOfScope,'Hero 15 Talent relation changes','Hero 15 Talent localization/publication']),
    'HERO15_SCOPE', 'Hero15 admission scope changed');
  exactKeys(hero15Evidence.source, Object.keys(hero15SourcePin), 'Hero15 Source Pin');
  check(isDeepStrictEqual(hero15Evidence.source,hero15SourcePin), 'HERO15_SOURCE_PIN','Source commit/blob/hash/index changed');
  exactKeys(hero15Evidence.extraction,['selection','verification','digestSha256RecomputedThisAdmission','indexIsLocatorOnly'],'Hero15 Extraction');
  check(hero15Evidence.extraction.selection === 'Read exact top-level array indices 307-310, preserving only ID/Name/Desc without markup changes.'
    && hero15Evidence.extraction.verification === 'Four pinned Git Blob records and array indices checked via GitHub API in task handoff.'
    && hero15Evidence.extraction.digestSha256RecomputedThisAdmission === false && hero15Evidence.extraction.indexIsLocatorOnly === true,
    'HERO15_EXTRACTION', 'Extraction or SHA-256 verification scope changed');
  check(Array.isArray(hero15Evidence.records) && hero15Evidence.records.length === 4,'HERO15_SOURCE_RECORDS','Expected exactly four original records');
  for (let i=0;i<hero15Expected.length;i+=1) {
    const [id,idx,name,desc] = hero15Expected[i], row=hero15Evidence.records[i];
    exactKeys(row,['sourceRecordIndex','sourceRecordLocator','rawRecord','fieldProvenance'],`Hero15 row ${id}`);
    exactKeys(row.rawRecord,['ID','Name','Desc'],`Hero15 raw ${id}`);
    exactKeys(row.fieldProvenance,['ID','Name','Desc'],`Hero15 provenance ${id}`);
    check(row.sourceRecordIndex === idx && row.sourceRecordLocator === `${sourcePin.path}#ID=${id}`
      && row.rawRecord.ID === id && row.rawRecord.Name === name && row.rawRecord.Desc === desc,
      'HERO15_SOURCE_RECORDS', `Original ID, index, Name or Desc changed: ${id}`);
    for(const field of ['ID','Name','Desc']) {
      check(row.fieldProvenance[field] === `${sourcePin.path}#arrayIndex=${idx}/${field}`,
        'HERO15_PROVENANCE',`Field locator mismatch: ${id}/${field}`);
    }
  }
  exactKeys(hero15Evidence.claimEvidence,['sourceIdNameAndDescValues','fieldDisplayMeaning','sourceSha256'],'Hero15 Evidence Class');
  check(hero15Evidence.claimEvidence.sourceIdNameAndDescValues === 'A'
    && hero15Evidence.claimEvidence.fieldDisplayMeaning === 'B'
    && hero15Evidence.claimEvidence.sourceSha256 === 'REUSED_NOT_RECOMPUTED',
    'HERO15_EVIDENCE_CLASS', 'Evidence class or digest provenance changed');
  check(isDeepStrictEqual(hero15Evidence.fieldMeaningContract,evidence.fieldMeaningContract),
    'HERO15_FIELD_CONTRACT','Field meaning contract changed');
  check(isDeepStrictEqual(hero15Evidence.interpretation,evidence.interpretation),
    'HERO15_INTERPRETATION','Original Chinese text interpretation changed');
  check(hero15Evidence.canonical === false && hero15Evidence.generated === false
    && hero15Evidence.publicationApproval === false && hero15Evidence.productionRuntimeDependency === false,
    'HERO15_BOUNDARY','Source evidence cannot approve Canonical/publication/runtime');

  check(soldierEvidence.schemaVersion === 1
    && soldierEvidence.source?.repository === sourcePin.repository
    && soldierEvidence.source?.commit === sourcePin.commit
    && soldierEvidence.source?.path === sourcePin.path
    && soldierEvidence.source?.gitBlobSha1 === sourcePin.gitBlobSha1
    && soldierEvidence.source?.sha256 === sourcePin.sha256,
  'SOLDIER_EVIDENCE', 'SD-10 pinned source evidence identity drift');
  check(Array.isArray(soldierEvidence.records) && soldierEvidence.records.length === soldierSkillIds.length,
    'SOLDIER_EVIDENCE', 'SD-10 evidence must contain exactly 30 selected raw records');
  const soldierEvidenceIds = soldierEvidence.records.map(row => row?.rawRecord?.ID);
  check(isDeepStrictEqual(soldierEvidenceIds, soldierSkillIds), 'SOLDIER_EVIDENCE', 'SD-10 record IDs/order differ from the declared 30-ID scope');
  for (const row of soldierEvidence.records) {
    check(row.sourceRecordLocator === `${sourcePin.path}#ID=${row.rawRecord.ID}`
      && Number.isSafeInteger(row.rawRecord.ID)
      && typeof row.rawRecord.Name === 'string'
      && typeof row.rawRecord.Desc === 'string',
    'SOLDIER_EVIDENCE', `SD-10 raw ID/Name/Desc is missing or malformed at ${row.sourceRecordLocator}`);
  }

  exactKeys(canonical, ['schemaVersion', 'sourceScope', 'scope', 'records'], 'Canonical');
  check(canonical.schemaVersion === 1 && canonical.sourceScope === evidence.scope.sourceScope
    && canonical.scope === 'Selected source-native Skill identity subset: 12 pinned Hero Talent identities, 30 explicitly selected Soldier SkillInfo records, and 9 directly referenced Hero 15 general SkillInfo identities; ID/Name/Desc only, not a complete Skill population, combat-rule, or acquisition model.',
  'CANONICAL', 'Canonical owner scope drift');
  check(Array.isArray(canonical.records) && canonical.records.length === allExpectedIds.length, 'CANONICAL', 'Canonical must contain exactly the 51 admitted Skill records');
  const canonicalIds = [];
  for (let i = 0; i < expected.length; i += 1) {
    const [id, , name, description] = expected[i];
    const record = canonical.records[i];
    exactKeys(record, ['skillId', 'nameCn', 'descriptionCn', 'provenance'], `Canonical Skill ${id}`);
    exactKeys(record.provenance, ['identity', 'name', 'description'], `Canonical Skill ${id} provenance`);
    check(record.skillId === id && Number.isSafeInteger(record.skillId)
      && record.nameCn === name && record.descriptionCn === description,
    'CANONICAL', `Canonical Skill ${id} differs from its source fields`);
    const locator = `${evidencePath}#ID=${id}`;
    check(record.provenance.identity === locator
      && record.provenance.name === `${locator}/Name`
      && record.provenance.description === `${locator}/Desc`, 'PROVENANCE', `Canonical Skill ${id} has an incorrect field locator`);
    canonicalIds.push(record.skillId);
  }

  for(let i=0;i<hero15Expected.length;i+=1) {
    const [id,,name,desc]=hero15Expected[i], row=canonical.records[expected.length+i], evidenceRow=hero15Evidence.records[i];
    exactKeys(row,['skillId','nameCn','descriptionCn','provenance'],`Canonical Hero15 Skill ${id}`);
    exactKeys(row.provenance,['identity','name','description'],`Hero15 Skill ${id} provenance`);
    check(row.skillId===id && Number.isSafeInteger(row.skillId)
      && row.nameCn===name && row.descriptionCn===desc
      && row.nameCn===evidenceRow.rawRecord.Name && row.descriptionCn===evidenceRow.rawRecord.Desc,
      'CANONICAL',`SkillInfo ${id} ID/Name/Desc parity broken`);
    const locator=`${hero15EvidencePath}#ID=${id}`;
    check(row.provenance.identity===locator && row.provenance.name===`${locator}/Name`
      && row.provenance.description===`${locator}/Desc`,
      'PROVENANCE',`Hero15 SkillInfo ${id} field provenance broken`);
    canonicalIds.push(row.skillId);
  }

  exactKeys(hero15GeneralEvidence,['schemaVersion','responsibility','scope','source','extraction','records','claimEvidence','fieldMeaningContract','interpretation','canonical','generated','publicationApproval','productionRuntimeDependency'],'Hero15 general SkillInfo Evidence');
  const generalSource=hero15GeneralEvidence.source;
  check(hero15GeneralEvidence.schemaVersion===1 && hero15GeneralEvidence.responsibility==='skill-identity-and-source-detail'
    && hero15GeneralEvidence.scope?.sourceScope===evidence.scope.sourceScope
    && isDeepStrictEqual(hero15GeneralEvidence.scope?.skillIds,hero15GeneralIds)
    && hero15GeneralEvidence.scope?.claim==='Nine source-native Hero 15 general SkillInfo identities selected only after direct HeroInfo/JobLevel reference verification.'
    && isDeepStrictEqual(hero15GeneralEvidence.scope?.outOfScope,['Hero/Job/Connection/Level ownership','skill acquisition or unlock rules','Korean localization','combat effect semantics/formulas','publication approval','icon or asset meaning']),
    'HERO15_GENERAL_SCOPE','Hero15 general identity evidence scope drift');
  check(generalSource?.repository==='LuceatLuxVestra42/langrisser-future-guide' && generalSource?.commit===sourcePin.commit
    && generalSource?.tree===sourcePin.commitTree && generalSource?.path===sourcePin.path
    && generalSource?.gitBlobSha1===sourcePin.gitBlobSha1 && generalSource?.sha256===sourcePin.sha256
    && generalSource?.sizeBytes===sourcePin.sizeBytes && generalSource?.primaryKey==='ID'
    && generalSource?.sourceIndex?.path===sourcePin.sourceIndex.path
    && generalSource?.sourceIndex?.gitBlobSha1===sourcePin.sourceIndex.gitBlobSha1
    && isDeepStrictEqual(generalSource?.sourceIndex?.recordIndices,Object.fromEntries(hero15GeneralExpected.map(([id,index])=>[String(id),index]))),
    'HERO15_GENERAL_SOURCE_PIN','Hero15 general SkillInfo source/index pin changed');
  check(hero15GeneralEvidence.extraction?.sourceBlobSha256Recomputed===true && hero15GeneralEvidence.extraction?.sourceIndexIsLocatorOnly===true,
    'HERO15_GENERAL_EXTRACTION','Source extraction/hash verification claim drift');
  check(Array.isArray(hero15GeneralEvidence.records) && hero15GeneralEvidence.records.length===hero15GeneralExpected.length,
    'HERO15_GENERAL_SOURCE_RECORDS','Expected exactly nine source rows');
  for(let i=0;i<hero15GeneralExpected.length;i+=1){
    const [id,index,name,desc]=hero15GeneralExpected[i], row=hero15GeneralEvidence.records[i];
    exactKeys(row,['sourceRecordIndex','sourceRecordLocator','rawRecord','fieldProvenance'],`Hero15 general row ${id}`);
    check(row.sourceRecordIndex===index && row.sourceRecordLocator===`${sourcePin.path}#ID=${id}`
      && isDeepStrictEqual(row.rawRecord,{ID:id,Name:name,Desc:desc})
      && isDeepStrictEqual(row.fieldProvenance,{ID:`${sourcePin.path}#arrayIndex=${index}/ID`,Name:`${sourcePin.path}#arrayIndex=${index}/Name`,Desc:`${sourcePin.path}#arrayIndex=${index}/Desc`}),
      'HERO15_GENERAL_SOURCE_RECORDS',`Source fields/locator differ for ${id}`);
  }
  check(hero15GeneralEvidence.claimEvidence?.sourceIdNameAndDescValues==='A'
    && hero15GeneralEvidence.claimEvidence?.fieldDisplayMeaning==='B'
    && hero15GeneralEvidence.canonical===false && hero15GeneralEvidence.generated===false
    && hero15GeneralEvidence.publicationApproval===false && hero15GeneralEvidence.productionRuntimeDependency===false,
    'HERO15_GENERAL_BOUNDARY','General identity evidence overstated admission or publication');

  for (let i = 0; i < soldierSkillIds.length; i += 1) {
    const id = soldierSkillIds[i], evidenceRow = soldierEvidence.records[i], record = canonical.records[expected.length + hero15Expected.length + i];
    exactKeys(record, ['skillId', 'nameCn', 'descriptionCn', 'provenance'], `Canonical Skill ${id}`);
    exactKeys(record.provenance, ['identity', 'name', 'description'], `Canonical Skill ${id} provenance`);
    check(record.skillId === id && Number.isSafeInteger(record.skillId)
      && record.nameCn === evidenceRow.rawRecord.Name && typeof record.nameCn === 'string'
      && record.descriptionCn === evidenceRow.rawRecord.Desc && typeof record.descriptionCn === 'string',
    'CANONICAL', `Canonical Skill ${id} differs from SD-10 raw ID/Name/Desc fields`);
    const locator = `${soldierEvidencePath}#ID=${id}`;
    check(record.provenance.identity === locator
      && record.provenance.name === `${locator}/Name`
      && record.provenance.description === `${locator}/Desc`, 'PROVENANCE', `Canonical Skill ${id} has an incorrect SD-10 field locator`);
    canonicalIds.push(record.skillId);
  }
  for(let i=0;i<hero15GeneralExpected.length;i++){
    const [id,,name,desc]=hero15GeneralExpected[i], evidenceRow=hero15GeneralEvidence.records[i], record=canonical.records[expected.length+hero15Expected.length+soldierSkillIds.length+i];
    exactKeys(record,['skillId','nameCn','descriptionCn','provenance'],`Canonical Hero15 general Skill ${id}`);
    exactKeys(record.provenance,['identity','name','description'],`Hero15 general Skill ${id} provenance`);
    check(record.skillId===id && record.nameCn===name && record.descriptionCn===desc
      && evidenceRow.rawRecord.ID===id && evidenceRow.rawRecord.Name===name && evidenceRow.rawRecord.Desc===desc,
      'CANONICAL',`Hero15 general Skill ${id} differs from exact source fields`);
    const locator=`${hero15GeneralEvidencePath}#ID=${id}`;
    check(record.provenance.identity===locator && record.provenance.name===`${locator}/Name`
      && record.provenance.description===`${locator}/Desc`,'PROVENANCE',`Hero15 general Skill ${id} field provenance changed`);
    canonicalIds.push(record.skillId);
  }
  check(isDeepStrictEqual(canonicalIds, allExpectedIds), 'CANONICAL', 'Canonical Skill ID order/scope differs from prior 42 plus nine source-verified Hero15 IDs');
  check(new Set(canonicalIds).size === canonicalIds.length, 'CANONICAL', 'Duplicate canonical Skill ID');
  const preserved38Json = JSON.stringify(canonical.records.filter(row=>!hero15ExpectedIds.includes(row.skillId) && !hero15GeneralIds.includes(row.skillId)));
  const preserved38Blob = createHash('sha1').update('blob '+Buffer.byteLength(preserved38Json,'utf8')+String.fromCharCode(0)).update(preserved38Json).digest('hex');
  check(preserved38Blob === prior38RecordsGitBlob, 'BASELINE', 'Previously admitted 38 exact Skill records or relative order changed');

  exactKeys(talent, ['schemaVersion', 'scope', 'records'], 'Talent reference owner');
  check(Array.isArray(talent.records), 'TALENT_PARITY', 'Talent reference records are missing');
  const talentSkillIds = talent.records.map((row) => row.skillId).filter((id) => expectedIds.includes(id)).sort((a, b) => a - b);
  check(isDeepStrictEqual(talentSkillIds, [...expectedIds].sort((a, b) => a - b)), 'TALENT_PARITY', 'Existing Hero 6/8 Talent Skill references are not preserved exactly once');
  const expectedTalentRows=[
    ...expectedIds.map((skillId,i)=>[i<4?6:8,(i%4)+3,skillId]),
    ...hero15ExpectedIds.map((skillId,i)=>[15,i+3,skillId]),
  ];
  check(isDeepStrictEqual(talent.records.map(row=>[row.heroId,row.star,row.skillId]),expectedTalentRows),
    'TALENT_PARITY','All 12 prior Talent references must remain unchanged');
  console.log(`Skill identity validation: PASS (records=${canonical.records.length}; preserved=38; Hero15Talent=4; Hero15General=9; TalentReferences=12; SoldierSkills=30; ID/Name/Desc only)`);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve('tools/validate-skill-identities.mjs')) {
  await validateSkillIdentities();
}
