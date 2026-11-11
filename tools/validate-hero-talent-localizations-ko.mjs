import { isDeepStrictEqual } from 'node:util';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const evidencePath = 'evidence/source/hero-talent-localizations-ko.v1.json';
const canonicalPath = 'canonical/hero-talent-localizations-ko.v1.json';
const talentRelationsPath = 'canonical/hero-talent-star-skills.v1.json';
const expected = new Map([
  ['6:3', { skillId: 3067, text: '<font color="red">1칸</font> 이동할 때마다 피해 <font color="red">+1%</font> 방어 <font color="red">+5%</font> 공격 후 <font color="red">3칸</font> 재이동 가능.' }],
  ['6:4', { skillId: 3072, text: '<font color="red">1칸</font> 이동할 때마다 피해 <font color="red">+2%</font> 방어 <font color="red">+10%</font> 공격 후 <font color="red">3칸</font> 재이동 가능.' }],
  ['6:5', { skillId: 3077, text: '<font color="red">1칸</font> 이동할 때마다 피해 <font color="red">+3%</font> 방어 <font color="red">+15%</font> 공격 후 <font color="red">3칸</font> 재이동 가능.' }],
  ['6:6', { skillId: 3082, text: '<font color="red">1칸</font> 이동할 때마다 피해 <font color="red">+4%</font> 방어 <font color="red">+20%</font> 공격 후 <font color="red">3칸</font> 재이동 가능.' }],
  ['8:3', { skillId: 3196, text: '전투 진입 시 마법 피해 <font color="red">+10%</font> 스킬 사거리 <font color="red">+1</font>.' }],
  ['8:4', { skillId: 3197, text: '전투 진입 시 마법 피해 <font color="red">+15%</font> 스킬 사거리 <font color="red">+1</font>.' }],
  ['8:5', { skillId: 3198, text: '전투 진입 시 마법 피해 <font color="red">+20%</font> 스킬 사거리 <font color="red">+1</font>.' }],
  ['8:6', { skillId: 3199, text: '전투 진입 시 마법 피해 <font color="red">+30%</font> 스킬 사거리 <font color="red">+1</font>.' }],
  ['15:3', { skillId: 3212, text: '행동 종료 시 주위 <font color="red">1칸</font> 내 다른 아군 부대 디버프 <font color="red">1개</font> 제거<br/> 동시에 자신 지력의 <font color="red">1.5배</font>만큼 회복.' }],
  ['15:4', { skillId: 3214, text: '행동 종료 시 주위 <font color="red">2칸</font> 내 다른 아군 부대 디버프 <font color="red">1개</font> 제거<br/> 동시에 자신 지력의 <font color="red">2배</font>만큼 회복.' }],
  ['15:5', { skillId: 3216, text: '행동 종료 시 주위 <font color="red">2칸</font> 내 다른 아군 부대 디버프 <font color="red">1개</font> 제거<br/> 동시에 자신 지력의 <font color="red">2.5배</font>만큼 회복.' }],
  ['15:6', { skillId: 3218, text: '행동 종료 시 주위 <font color="red">2칸</font> 내 다른 아군 부대 디버프 <font color="red">2개</font> 제거<br/> 동시에 자신 지력의 <font color="red">3배</font>만큼 회복.' }],
]);
const names = new Map([[6, '전설의 기사'], [8, '마력 강화'], [15, '성결한 수녀']]);
const sourceFiles = new Map([
  [6, { heroName: '레온', path: 'hero/data/레온.js', blob: '3b074244053151e0197c2cd1cfbbc01af0cb02b6' }],
  [8, { heroName: '라나', path: 'hero/data/라나.js', blob: 'f73a45f2df303788f1dd0ea047ca71ec34bba45e' }],
  [15, { heroName: '리아나', path: 'hero/data/리아나.js', blob: '139e57339caa0d07d540ed091a208cae6f39ddc3' }],
]);
const sourceCommit = 'a85bba49dcf073563e7366dc18e96b7ba67c2ae3';
const sourceTree = '9bc7b5a8c8317a87414c6e8ac8b16bc9df875204';
const legacyCommit = '57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff';
const legacyTree = '689a9bd47070be12438be66503096e424d392d42';
const finalPath = 'data/presentation/hero-talent-localization-final.v1.json';
const hero15FinalLocator = `${finalPath}#records[heroId=15]`;
const hero15SkillsByStar = { 3: 3212, 4: 3214, 5: 3216, 6: 3218 };
const skillIdentityPath = 'canonical/skills.v1.json';
const fail = (code, message) => { throw new Error(`Hero Talent Korean localization validation failed [${code}]: ${message}`); };
const check = (condition, code, message) => { if (!condition) fail(code, message); };
const exactKeys = (value, keys, label) => check(value && typeof value === 'object' && !Array.isArray(value)
  && isDeepStrictEqual(Object.keys(value).sort(), [...keys].sort()), 'SCHEMA', `${label} fields drift`);
const readJson = async (root, path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));

export async function validateHeroTalentLocalizationsKo(root = process.cwd()) {
  const [evidence, canonical, relations, skills] = await Promise.all([
    readJson(root, evidencePath), readJson(root, canonicalPath), readJson(root, talentRelationsPath), readJson(root, skillIdentityPath),
  ]);
  exactKeys(evidence, ['schemaVersion', 'responsibility', 'scope', 'source', 'projectReview', 'records', 'descriptions'], 'Evidence');
  check(evidence.schemaVersion === 1 && evidence.responsibility === 'hero-talent-localization-ko', 'SCHEMA', 'Evidence identity drift');
  exactKeys(evidence.scope, ['heroIds', 'stars', 'claim', 'outOfScope'], 'Evidence scope');
  check(isDeepStrictEqual(evidence.scope.heroIds, [6, 8, 15]) && isDeepStrictEqual(evidence.scope.stars, [3, 4, 5, 6]), 'SCOPE', 'Hero/star scope drift');
  check(evidence.scope.claim === 'Project-reviewed Korean normal Talent display name per Hero and Korean star-specific description keyed by exact Hero ID, star, and already-admitted Skill ID.', 'SCOPE', 'Claim meaning drift');
  check(Array.isArray(evidence.scope.outOfScope) && evidence.scope.outOfScope.includes('official Korean-server terminology')
    && evidence.scope.outOfScope.includes('structured combat mechanics') && evidence.scope.outOfScope.includes('Talent star-selection rule revalidation'), 'SCOPE', 'out-of-scope limitations missing');

  exactKeys(evidence.source, ['evidenceClass', 'claimScope', 'repository', 'ref', 'commitTree', 'fetchMode', 'baseUrl', 'nameField', 'descriptionFieldRule', 'files'], 'Source');
  check(evidence.source.evidenceClass === 'A' && evidence.source.claimScope === 'Exact Korean TalentName and star-specific Desc source strings at the pinned public-project commit only.'
    && evidence.source.repository === 'redpanda7301/langrisser' && evidence.source.ref === sourceCommit && evidence.source.commitTree === sourceTree
    && evidence.source.fetchMode === 'PINNED_RAW_GITHUB'
    && evidence.source.baseUrl === `https://raw.githubusercontent.com/redpanda7301/langrisser/${sourceCommit}/`
    && evidence.source.nameField === 'data[0].Talent[0].TalentName'
    && evidence.source.descriptionFieldRule === 'data[0].Talent[0].Abilities[star - 1].Desc', 'SOURCE', 'pinned source contract drift');
  check(Array.isArray(evidence.source.files) && evidence.source.files.length === 3, 'SOURCE', 'expected exactly three source files');
  for (const [heroId, expectedFile] of sourceFiles) {
    const file = evidence.source.files.find((row) => row.heroId === heroId);
    exactKeys(file, ['heroId', 'heroName', 'path', 'gitBlobSha1'], `source file Hero ${heroId}`);
    check(file.heroName === expectedFile.heroName && file.path === expectedFile.path && file.gitBlobSha1 === expectedFile.blob, 'SOURCE', `source file pin mismatch for Hero ${heroId}`);
  }

  exactKeys(evidence.projectReview, ['evidenceClass', 'claimScope', 'repository', 'ref', 'legacyCommitTree', 'contract', 'finalLocalization', 'sourceIntake', 'sourceContract', 'stage5Decision', 'hero15FinalRecord', 'owningReview', 'parityGuard', 'overlayGuard', 'limitations'], 'Project review');
  const review = evidence.projectReview;
  check(review.evidenceClass === 'B' && review.claimScope === 'Prior project review decision and applicability for the exact Hero 6, 8, and 15 localization records.'
    && review.repository === 'LuceatLuxVestra42/langrisser-future-guide' && review.ref === legacyCommit && review.legacyCommitTree === legacyTree, 'PROVENANCE', 'Legacy review ref, tree, or evidence class drift');
  exactKeys(review.contract, ['path', 'gitBlobSha1'], 'Legacy contract');
  check(review.contract.path === 'data/contracts/localization-audit-hero-talent-stage6-final.v1.json' && review.contract.gitBlobSha1 === '942fd0182888ad4d4bce383cedb3f65b019f7eb5', 'PROVENANCE', 'Legacy contract pin drift');
  exactKeys(review.finalLocalization, ['path', 'gitBlobSha1', 'overallStatus', 'overallScope'], 'Legacy final localization');
  check(review.finalLocalization.path === finalPath && review.finalLocalization.gitBlobSha1 === 'fd0cc58eb68a415a7d25064c6f06360e8dd2f9b0'
    && review.finalLocalization.overallStatus === 'PASS_WITH_REVIEW' && review.finalLocalization.overallScope === '251-Hero-normal-talent-KR-localization-through-Taj-Lynn', 'PROVENANCE', 'Legacy final artifact pin or scope drift');
  exactKeys(review.sourceIntake, ['path', 'gitBlobSha1', 'status', 'scope'], 'Legacy source intake');
  check(review.sourceIntake.path === 'data/presentation/hero-talent-legacy-sheet-intake-stage5.v1.json' && review.sourceIntake.gitBlobSha1 === 'b9f11bf0d94057acca2b1fd22de39cfe3b3ae0f3'
    && review.sourceIntake.status === 'PASS', 'PROVENANCE', 'Legacy source intake pin drift');
  exactKeys(review.sourceContract, ['path', 'gitBlobSha1', 'status', 'scope'], 'Legacy source contract');
  check(review.sourceContract.path === 'data/presentation/hero-talent-kr-sheet-source.v1.json' && review.sourceContract.gitBlobSha1 === '2d5abd279eccc1186335cd513a74472117258090'
    && review.sourceContract.status === 'PASS' && review.sourceContract.scope === 'localization-presentation-evidence-only', 'PROVENANCE', 'Legacy source contract pin drift');
  exactKeys(review.stage5Decision, ['path', 'gitBlobSha1', 'recordLocator', 'heroId', 'talentNameKo', 'sourceClassification', 'correctedNumericClassification', 'reason'], 'Hero 15 Stage 5 review decision');
  check(review.stage5Decision.path === 'data/presentation/hero-talent-stage5-review.v1.json'
    && review.stage5Decision.gitBlobSha1 === '63a5e119340c330038e2e95ae63c79648b524d66'
    && review.stage5Decision.recordLocator === 'data/presentation/hero-talent-stage5-review.v1.json#records[heroId=15]'
    && review.stage5Decision.heroId === 15 && review.stage5Decision.talentNameKo === names.get(15)
    && review.stage5Decision.sourceClassification === 'DIRECT_REUSE_STRONG'
    && review.stage5Decision.correctedNumericClassification === 'CORRECTED_STRONG'
    && review.stage5Decision.reason === 'STAGE4_STRONG', 'PROVENANCE', 'Hero 15 Stage 5 decision pin or scope drift');
  exactKeys(review.hero15FinalRecord, ['locator', 'heroId', 'nameKr', 'nameCn', 'talentNameKr', 'finalDecision', 'localizationStatus', 'reviewRequired', 'stage3KrSheetSourcePaths', 'stage5Decision', 'stage6Override', 'skillIdsByStar'], 'Hero 15 final review record');
  check(review.hero15FinalRecord.locator === hero15FinalLocator && review.hero15FinalRecord.heroId === 15
    && review.hero15FinalRecord.nameKr === '리아나' && review.hero15FinalRecord.nameCn === '莉亚娜'
    && review.hero15FinalRecord.talentNameKr === names.get(15)
    && review.hero15FinalRecord.finalDecision === 'DIRECT_REUSE_FINAL'
    && review.hero15FinalRecord.localizationStatus === 'CONFIRMED_EXISTING_KR_REUSE'
    && review.hero15FinalRecord.reviewRequired === false
    && isDeepStrictEqual(review.hero15FinalRecord.stage3KrSheetSourcePaths, ['hero/data/리아나.js'])
    && review.hero15FinalRecord.stage5Decision === 'data/presentation/hero-talent-stage5-review.v1.json'
    && review.hero15FinalRecord.stage6Override === null
    && isDeepStrictEqual(review.hero15FinalRecord.skillIdsByStar, hero15SkillsByStar), 'REVIEW_STATUS', 'Hero 15 final per-record review decision or Skill mapping drift');
  exactKeys(review.owningReview, ['validatorPath', 'contractRule', 'selectedRecordDecision', 'localizationStatus', 'reviewRequired'], 'Legacy owning review');
  check(review.owningReview.validatorPath === 'scripts/audit-localization-hero-talent-stage6-final.mjs'
    && review.owningReview.selectedRecordDecision === 'DIRECT_REUSE_FINAL'
    && review.owningReview.localizationStatus === 'CONFIRMED_EXISTING_KR_REUSE'
    && review.owningReview.reviewRequired === false, 'REVIEW_STATUS', 'selected project review status drift');
  exactKeys(review.parityGuard, ['path', 'gitBlobSha1', 'status', 'role'], 'Stage 7 parity guard');
  check(review.parityGuard.path === 'data/validation/hero-talent-legacy-sheet-stage7-semantic-parity.v1.json'
    && review.parityGuard.gitBlobSha1 === '470643e627e28454222207674c5c7770f7118738'
    && review.parityGuard.status === 'PASS_WITH_BLOCKER' && review.parityGuard.role === 'PRESENTATION_PARITY_GUARD_ONLY', 'PROVENANCE', 'Stage 7 guard boundary drift');
  exactKeys(review.overlayGuard, ['path', 'gitBlobSha1', 'status', 'role'], 'Stage 8 overlay guard');
  check(review.overlayGuard.path === 'data/validation/hero-talent-legacy-sheet-stage8-overlay.v1.json'
    && review.overlayGuard.gitBlobSha1 === '48bc78488a20445888aa4a6abd4174c5366196a4'
    && review.overlayGuard.status === 'PASS_WITH_BLOCKER' && review.overlayGuard.role === 'EXACT_HERO_STAR_SKILL_PRESENTATION_PARITY_GUARD', 'PROVENANCE', 'Stage 8 guard boundary drift');

  exactKeys(canonical, ['schemaVersion', 'scope', 'officialKrProvenanceStatus', 'nameRecords', 'descriptionRecords'], 'Canonical');
  check(canonical.schemaVersion === 1 && canonical.officialKrProvenanceStatus === 'unverified', 'CANONICAL', 'Canonical version or official localization boundary drift');
  check(canonical.scope === 'Project-reviewed Korean normal Talent names for Heroes 6, 8, and 15 and star 3-6 descriptions keyed by exact Hero ID, star, and existing Talent Skill ID; official Korean-server status is unverified.', 'CANONICAL', 'Canonical scope drift');

  const relationByKey = new Map();
  check(Array.isArray(relations.records), 'RELATION', 'existing Talent relation owner records missing');
  for (const row of relations.records) {
    const key = `${row.heroId}:${row.star}`;
    check(!relationByKey.has(key), 'RELATION', `duplicate existing Talent relation ${key}`);
    relationByKey.set(key, row.skillId);
  }
  const expectedRelations = new Map([
    ['6:3', 3067], ['6:4', 3072], ['6:5', 3077], ['6:6', 3082],
    ['8:3', 3196], ['8:4', 3197], ['8:5', 3198], ['8:6', 3199],
    ...Object.entries(hero15SkillsByStar).map(([star, skillId]) => [`15:${star}`, skillId]),
  ]);
  check(relationByKey.size === 12 && expectedRelations.size === 12, 'RELATION', 'Talent relation population must remain exactly 12');
  for (const [key, skillId] of expectedRelations) check(relationByKey.get(key) === skillId, 'RELATION', `existing admitted Talent relation mismatch ${key}`);
  check(Array.isArray(skills.records) && skills.records.length === 42, 'SKILL_IDENTITY', 'admitted Skill Identity population must remain exactly 42');
  const skillRows = new Map(skills.records.map(row => [row.skillId, row]));
  for (const [key, row] of expected) {
    const skill = skillRows.get(row.skillId);
    check(skill && (key.startsWith('15:') ? skill.nameCn === '圣洁的修女' : true), 'SKILL_IDENTITY', `Talent Skill Identity missing or mismatched ${key}`);
  }

  check(Array.isArray(evidence.records) && evidence.records.length === names.size, 'EVIDENCE', 'exactly two Hero-level Talent names are required');
  check(Array.isArray(canonical.nameRecords) && canonical.nameRecords.length === names.size, 'CANONICAL', 'exactly two Hero-level Talent names are required');
  const evidenceNames = new Map();
  for (const row of evidence.records) {
    exactKeys(row, ['heroId', 'talentNameKo', 'nameSourceLocator', 'reviewLocator', 'reviewStatus', 'reviewRequired'], 'Evidence name');
    check(names.has(row.heroId) && !evidenceNames.has(row.heroId), 'SCOPE', `unsupported or duplicate Hero name ${row.heroId}`);
    const file = sourceFiles.get(row.heroId);
    check(row.talentNameKo === names.get(row.heroId) && row.nameSourceLocator === `${file.path}#data[0].Talent[0].TalentName`
      && row.reviewLocator === `${finalPath}#records[heroId=${row.heroId}]`
      && row.reviewStatus === 'CONFIRMED_EXISTING_KR_REUSE' && row.reviewRequired === false, 'EVIDENCE', `name source or review mismatch for Hero ${row.heroId}`);
    evidenceNames.set(row.heroId, row);
  }
  const canonicalNames = new Map();
  for (const row of canonical.nameRecords) {
    exactKeys(row, ['heroId', 'talentNameKo', 'localizationStatus', 'reviewRequired', 'evidenceClass', 'provenance'], 'Canonical name');
    check(names.has(row.heroId) && !canonicalNames.has(row.heroId), 'SCOPE', `unsupported or duplicate Canonical name ${row.heroId}`);
    check(row.talentNameKo === names.get(row.heroId) && row.localizationStatus === 'CONFIRMED_EXISTING_KR_REUSE'
      && row.reviewRequired === false && row.evidenceClass === 'B'
      && row.provenance === `${evidencePath}#heroId=${row.heroId}&claim=name`, 'CANONICAL', `Canonical name/provenance mismatch for Hero ${row.heroId}`);
    check(evidenceNames.has(row.heroId), 'PROVENANCE', `missing name Evidence for Hero ${row.heroId}`);
    canonicalNames.set(row.heroId, row);
  }
  check(evidenceNames.size === names.size && canonicalNames.size === names.size, 'CANONICAL', 'name claim set incomplete');

  check(Array.isArray(evidence.descriptions) && evidence.descriptions.length === expected.size, 'EVIDENCE', 'exactly eight reviewed star descriptions are required');
  check(Array.isArray(canonical.descriptionRecords) && canonical.descriptionRecords.length === expected.size, 'CANONICAL', 'exactly eight star descriptions are required');
  const evidenceDescriptions = new Map();
  for (const row of evidence.descriptions) {
    exactKeys(row, ['heroId', 'star', 'skillId', 'descriptionKoRaw', 'sourceLocator', 'reviewLocator', 'reviewStatus', 'reviewRequired'], 'Evidence description');
    const key = `${row.heroId}:${row.star}`;
    const expectedRow = expected.get(key);
    check(expectedRow !== undefined && !evidenceDescriptions.has(key), 'SCOPE', `unsupported or duplicate description ${key}`);
    const file = sourceFiles.get(row.heroId);
    const abilityIndex = row.star - 1;
    check(row.skillId === expectedRow.skillId && row.descriptionKoRaw === expectedRow.text, 'EVIDENCE', `reviewed source text or Skill ID mismatch ${key}`);
    check(row.sourceLocator === `${file.path}#data[0].Talent[0].Abilities[${abilityIndex}].Desc`
      && row.reviewLocator === `${finalPath}#records[heroId=${row.heroId}].descriptions.star${row.star}`
      && row.reviewStatus === 'CONFIRMED_EXISTING_KR_REUSE' && row.reviewRequired === false, 'PROVENANCE', `description source/review locator or status mismatch ${key}`);
    check(relationByKey.get(key) === row.skillId, 'RELATION', `description does not reference the existing Talent relation ${key}`);
    evidenceDescriptions.set(key, row);
  }
  const canonicalDescriptions = new Map();
  for (const row of canonical.descriptionRecords) {
    exactKeys(row, ['heroId', 'star', 'skillId', 'descriptionKoRaw', 'localizationStatus', 'reviewRequired', 'evidenceClass', 'provenance'], 'Canonical description');
    const key = `${row.heroId}:${row.star}`;
    const source = evidenceDescriptions.get(key);
    check(source !== undefined && !canonicalDescriptions.has(key), 'SCOPE', `missing, unsupported, or duplicate Canonical description ${key}`);
    check(row.skillId === source.skillId && row.descriptionKoRaw === source.descriptionKoRaw
      && row.localizationStatus === 'CONFIRMED_EXISTING_KR_REUSE' && row.reviewRequired === false && row.evidenceClass === 'B'
      && row.provenance === `${evidencePath}#heroId=${row.heroId}&star=${row.star}&skillId=${row.skillId}`, 'CANONICAL', `Canonical description/parity mismatch ${key}`);
    canonicalDescriptions.set(key, row);
  }
  check(evidenceDescriptions.size === expected.size && canonicalDescriptions.size === expected.size, 'CANONICAL', 'description claim set incomplete');
  return { heroNames: canonical.nameRecords.length, descriptions: canonical.descriptionRecords.length, evidenceClass: 'A_SOURCE_TEXT+B_PROJECT_REVIEW_REUSE', relationOwner: talentRelationsPath };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const result = await validateHeroTalentLocalizationsKo();
    console.log(`Hero Talent Korean localization validation: PASS (Hero names=${result.heroNames}, star descriptions=${result.descriptions}, evidence=${result.evidenceClass})`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
