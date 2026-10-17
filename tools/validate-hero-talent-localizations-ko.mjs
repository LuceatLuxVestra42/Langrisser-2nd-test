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
]);
const names = new Map([[6, '전설의 기사'], [8, '마력 강화']]);
const sourceFiles = new Map([
  [6, { heroName: '레온', path: 'hero/data/레온.js', blob: '3b074244053151e0197c2cd1cfbbc01af0cb02b6' }],
  [8, { heroName: '라나', path: 'hero/data/라나.js', blob: 'f73a45f2df303788f1dd0ea047ca71ec34bba45e' }],
]);
const sourceCommit = 'a85bba49dcf073563e7366dc18e96b7ba67c2ae3';
const legacyCommit = '57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff';
const finalPath = 'data/presentation/hero-talent-localization-final.v1.json';
const fail = (code, message) => { throw new Error(`Hero Talent Korean localization validation failed [${code}]: ${message}`); };
const check = (condition, code, message) => { if (!condition) fail(code, message); };
const exactKeys = (value, keys, label) => check(value && typeof value === 'object' && !Array.isArray(value)
  && isDeepStrictEqual(Object.keys(value).sort(), [...keys].sort()), 'SCHEMA', `${label} fields drift`);
const readJson = async (root, path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));

export async function validateHeroTalentLocalizationsKo(root = process.cwd()) {
  const [evidence, canonical, relations] = await Promise.all([
    readJson(root, evidencePath), readJson(root, canonicalPath), readJson(root, talentRelationsPath),
  ]);
  exactKeys(evidence, ['schemaVersion', 'responsibility', 'scope', 'source', 'projectReview', 'records', 'descriptions'], 'Evidence');
  check(evidence.schemaVersion === 1 && evidence.responsibility === 'hero-talent-localization-ko', 'SCHEMA', 'Evidence identity drift');
  exactKeys(evidence.scope, ['heroIds', 'stars', 'claim', 'outOfScope'], 'Evidence scope');
  check(isDeepStrictEqual(evidence.scope.heroIds, [6, 8]) && isDeepStrictEqual(evidence.scope.stars, [3, 4, 5, 6]), 'SCOPE', 'Hero/star scope drift');
  check(evidence.scope.claim === 'Project-reviewed Korean normal Talent display name per Hero and Korean star-specific description keyed by exact Hero ID, star, and already-admitted Skill ID.', 'SCOPE', 'Claim meaning drift');
  check(Array.isArray(evidence.scope.outOfScope) && evidence.scope.outOfScope.includes('official Korean-server terminology')
    && evidence.scope.outOfScope.includes('structured combat mechanics') && evidence.scope.outOfScope.includes('Talent star-selection rule revalidation'), 'SCOPE', 'out-of-scope limitations missing');

  exactKeys(evidence.source, ['evidenceClass', 'claimScope', 'repository', 'ref', 'fetchMode', 'baseUrl', 'nameField', 'descriptionFieldRule', 'files'], 'Source');
  check(evidence.source.evidenceClass === 'A' && evidence.source.claimScope === 'Exact Korean TalentName and star-specific Desc source strings at the pinned public-project commit only.'
    && evidence.source.repository === 'redpanda7301/langrisser' && evidence.source.ref === sourceCommit
    && evidence.source.fetchMode === 'PINNED_RAW_GITHUB'
    && evidence.source.baseUrl === `https://raw.githubusercontent.com/redpanda7301/langrisser/${sourceCommit}/`
    && evidence.source.nameField === 'data[0].Talent[0].TalentName'
    && evidence.source.descriptionFieldRule === 'data[0].Talent[0].Abilities[star - 1].Desc', 'SOURCE', 'pinned source contract drift');
  check(Array.isArray(evidence.source.files) && evidence.source.files.length === 2, 'SOURCE', 'expected exactly two source files');
  for (const [heroId, expectedFile] of sourceFiles) {
    const file = evidence.source.files.find((row) => row.heroId === heroId);
    exactKeys(file, ['heroId', 'heroName', 'path', 'gitBlobSha1'], `source file Hero ${heroId}`);
    check(file.heroName === expectedFile.heroName && file.path === expectedFile.path && file.gitBlobSha1 === expectedFile.blob, 'SOURCE', `source file pin mismatch for Hero ${heroId}`);
  }

  exactKeys(evidence.projectReview, ['evidenceClass', 'claimScope', 'repository', 'ref', 'contract', 'finalLocalization', 'sourceIntake', 'sourceContract', 'owningReview', 'parityGuard', 'overlayGuard', 'limitations'], 'Project review');
  const review = evidence.projectReview;
  check(review.evidenceClass === 'B' && review.claimScope === 'Prior project review decision and applicability for the exact Hero 6/8 localization records.'
    && review.repository === 'LuceatLuxVestra42/langrisser-future-guide' && review.ref === legacyCommit, 'PROVENANCE', 'Legacy review ref or evidence class drift');
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
  check(canonical.scope === 'Project-reviewed Korean normal Talent names for Heroes 6 and 8 and star 3-6 descriptions keyed by exact Hero ID, star, and existing Talent Skill ID; official Korean-server status is unverified.', 'CANONICAL', 'Canonical scope drift');

  const relationByKey = new Map();
  check(Array.isArray(relations.records), 'RELATION', 'existing Talent relation owner records missing');
  for (const row of relations.records) {
    const key = `${row.heroId}:${row.star}`;
    check(!relationByKey.has(key), 'RELATION', `duplicate existing Talent relation ${key}`);
    relationByKey.set(key, row.skillId);
  }
  for (const [key, row] of expected) check(relationByKey.get(key) === row.skillId, 'RELATION', `existing admitted Talent relation mismatch ${key}`);

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
  return { heroNames: canonical.nameRecords.length, descriptions: canonical.descriptionRecords.length, evidenceClass: 'B_PROJECT_REVIEW_REUSE', relationOwner: talentRelationsPath };
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
