import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

const evidencePath = 'evidence/source/hero-talent-star-skills.v1.json';
const canonicalPath = 'canonical/hero-talent-star-skills.v1.json';
const rawConnectionPath = 'evidence/source/configdata/ConfigDataJobConnectionInfo.records-hero-5-6-8.json';
const connectionRelationPath = 'evidence/source/jobs/hero-job-connection-slice.v1.json';
const heroPath = 'canonical/heroes.v1.json';
const heroIdentityPath = 'canonical/hero-identities.v1.json';
const jobRelationPath = 'canonical/hero-job-relations.v1.json';
const expected = new Map([
  ['6:3', 3067], ['6:4', 3072], ['6:5', 3077], ['6:6', 3082],
  ['8:3', 3196], ['8:4', 3197], ['8:5', 3198], ['8:6', 3199],
]);
const connectionIds = new Map([[6, [60, 61, 62, 63, 64, 65]], [8, [80, 81, 82, 83, 84, 85]]]);
const arrays = new Map([[6, [3067, 3067, 3067, 3072, 3077, 3082]], [8, [3196, 3196, 3196, 3197, 3198, 3199]]]);
const firstRule = {
  repository: 'LuceatLuxVestra42/langrisser-future-guide',
  ref: '57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff',
  contract: { path: 'data/hero-basic-combat-stage4-5.v1.json', blobSha1: '0566bfc26c54694f089fd765a9aefbe83208ca41', claim: 'TalentSkill_IDs[star - 1] selects the displayed talent for star 1..6; all normal JobConnections for one Hero must carry the same six-slot array.' },
  producer: { path: 'scripts/prepare_hero_basic_combat_stage45.cjs', blobSha1: 'bb4383e8be590185bf68b56096530dce50e1b527', operation: 'Checks six-slot TalentSkill_IDs across all normal connections; maps each array index i to star i+1; reads initialStar from ConfigDataHeroInfo.Star.' },
  validator: { path: 'scripts/validate_hero_stage4_final.cjs', blobSha1: 'c4c31d11b8d1c5fb7c3204ddcb7ee6975045f145', operation: 'Validates VERIFIED progression, selectionRule, six rows, and star/index parity.' },
  validation: { path: 'data/validation/hero-basic-combat-stage4-5-summary.v1.json', blobSha1: '1ea45f081238ff41995c4e444bc6f953c73c5e64', status: 'PASS', scope: 'Stage 4-5 Hero basic combat and Talent star progression; 267 canonical Heroes.' },
};
const legacyPins = {
  stage6: { path: 'data/validation/hero-talent-legacy-sheet-stage6-identity-completeness.v1.json', blobSha1: 'ffaaaaa7f3ca8a48cadf6ff4f975e10efce87227' },
  stage7: { path: 'data/validation/hero-talent-legacy-sheet-stage7-semantic-parity.v1.json', blobSha1: '470643e627e28454222207674c5c7770f7118738' },
};
const fail = (code, message) => { throw new Error(`Hero Talent star-skill validation failed [${code}]: ${message}`); };
const check = (condition, code, message) => { if (!condition) fail(code, message); };
const exactKeys = (value, keys, label) => check(value && typeof value === 'object' && !Array.isArray(value)
  && isDeepStrictEqual(Object.keys(value).sort(), [...keys].sort()), 'SCHEMA', `${label} fields drift`);
const readJson = async (root, path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));

export async function validateHeroTalentStarSkills(root = process.cwd()) {
  const [evidence, canonical, rawRows, relationEvidence, heroes, identities, jobRelations] = await Promise.all([
    readJson(root, evidencePath), readJson(root, canonicalPath), readJson(root, rawConnectionPath),
    readJson(root, connectionRelationPath), readJson(root, heroPath), readJson(root, heroIdentityPath),
    readJson(root, jobRelationPath),
  ]);
  exactKeys(evidence, ['schemaVersion', 'responsibility', 'scope', 'sourceArrays', 'selectionRule', 'claims'], 'Evidence');
  check(evidence.schemaVersion === 1 && evidence.responsibility === 'hero-talent-star-skill-reference', 'SCHEMA', 'Evidence identity drift');
  exactKeys(evidence.scope, ['heroIds', 'stars', 'claim', 'outOfScope'], 'Evidence scope');
  check(isDeepStrictEqual(evidence.scope.heroIds, [6, 8]) && isDeepStrictEqual(evidence.scope.stars, [3, 4, 5, 6]), 'SCOPE', 'admission scope drift');
  check(evidence.scope.claim === "A Hero's normal Talent Skill ID at a specified star stage.", 'SCOPE', 'claim meaning drift');
  exactKeys(evidence.sourceArrays, ['evidenceClass', 'sourceScope', 'sourcePackIntegrity', 'sourceFile', 'preservedEvidencePath', 'relationEvidencePath', 'rawSourceFileDirectlyRecheckedThisAdmission', 'records'], 'source-array evidence');
  const sourceArrays = evidence.sourceArrays;
  check(sourceArrays.evidenceClass === 'A' && sourceArrays.sourceScope === 'CN ConfigData snapshot 2026-09-02', 'SOURCE', 'source-array claim class or scope drift');
  check(sourceArrays.rawSourceFileDirectlyRecheckedThisAdmission === false, 'SOURCE', 'raw-source recheck state must remain explicit');
  exactKeys(sourceArrays.sourcePackIntegrity, ['status', 'repository', 'commit', 'tree', 'configDataSubtree', 'archive'], 'source-pack provenance');
  check(sourceArrays.sourcePackIntegrity.status === 'PASS_REUSED_FROM_H-02-B1'
    && sourceArrays.sourcePackIntegrity.repository === 'LuceatLuxVestra42/langrisser-future-guide'
    && sourceArrays.sourcePackIntegrity.commit === '6475e63ee23d18adf733756c26a14fa9e3ed662c'
    && sourceArrays.sourcePackIntegrity.tree === '08e1e6c2773730e60b258940e31494f68d65f86a'
    && sourceArrays.sourcePackIntegrity.configDataSubtree === 'b18983f60cb054c2e6e094d64cdb98979211d7fc'
    && sourceArrays.sourcePackIntegrity.archive?.sha256 === '65855321776cba9523669a2d486c2edbd2908006cf854572b7a87b0b63405c84', 'SOURCE', 'source-pack pin drift');
  exactKeys(sourceArrays.sourceFile, ['path', 'gitBlobSha1', 'sizeBytes', 'field'], 'source-file locator');
  check(sourceArrays.sourceFile.path === 'data/configdata/ConfigDataJobConnectionInfo.json'
    && sourceArrays.sourceFile.gitBlobSha1 === 'cdad8d6fda6edd30c92fbcda53e0f63af1903139'
    && sourceArrays.sourceFile.sizeBytes === 11498868
    && sourceArrays.sourceFile.field === 'TalentSkill_IDs', 'SOURCE', 'source-file field or pin drift');
  check(sourceArrays.preservedEvidencePath === rawConnectionPath && sourceArrays.relationEvidencePath === connectionRelationPath, 'SOURCE', 'preserved evidence locator drift');

  exactKeys(evidence.selectionRule, ['evidenceClass', 'sourceField', 'fieldContract', 'rule', 'starDomain', 'initialStar', 'initialStarLocator', 'firstLocatedRule', 'initialStarEvidence', 'frozenParity', 'stage6LocalizationBoundary', 'claimAssessment', 'limitations'], 'selection-rule evidence');
  const rule = evidence.selectionRule;
  exactKeys(rule.fieldContract, ['repository', 'ref', 'path', 'blobSha1', 'locator', 'meaning', 'sourceFieldNumber', 'evidenceClass'], 'field meaning evidence');
  check(rule.fieldContract.repository === firstRule.repository && rule.fieldContract.ref === firstRule.ref
    && rule.fieldContract.path === 'data/hero-skill-acquisition-stage4-4.v1.json'
    && rule.fieldContract.blobSha1 === 'afdabed9f82a401f50ed344e5ee4877bbc024f9c'
    && rule.fieldContract.sourceFieldNumber === 'ConfigDataJobConnectionInfo.TalentSkill_IDs protobuf field 8'
    && rule.fieldContract.evidenceClass === 'B'
    && /distinct from JobLevelInfo[.]GotSkill_ID/.test(rule.fieldContract.meaning), 'PROVENANCE', 'TalentSkill_IDs field semantics or source locator drift');
  check(rule.evidenceClass === 'B' && rule.sourceField === 'ConfigDataJobConnectionInfo.TalentSkill_IDs'
    && rule.rule === 'TalentSkill_IDs[star - 1]' && isDeepStrictEqual(rule.starDomain, [1, 2, 3, 4, 5, 6])
    && rule.initialStar === 3, 'INTERPRETATION', 'selection rule or star scope drift');
  check(rule.initialStarLocator === `${legacyPins.stage6.path}#confirmedRecords[heroId=6|8].talent.initialStar`, 'PROVENANCE', 'initialStar locator drift');
  check(isDeepStrictEqual(rule.firstLocatedRule, firstRule), 'PROVENANCE', 'first located selection-rule authority drift');
  exactKeys(rule.initialStarEvidence, ['repository', 'ref', 'path', 'blobSha1', 'confirmedHeroIds', 'value', 'class'], 'initial-star evidence');
  check(rule.initialStarEvidence.repository === firstRule.repository && rule.initialStarEvidence.ref === firstRule.ref
    && rule.initialStarEvidence.path === legacyPins.stage6.path && rule.initialStarEvidence.blobSha1 === legacyPins.stage6.blobSha1
    && isDeepStrictEqual(rule.initialStarEvidence.confirmedHeroIds, [6, 8]) && rule.initialStarEvidence.value === 3
    && rule.initialStarEvidence.class === 'B', 'PROVENANCE', 'initial-star evidence scope drift');
  exactKeys(rule.frozenParity, ['repository', 'ref', 'path', 'blobSha1', 'role', 'status', 'scope', 'admittedHeroIds', 'rows'], 'frozen parity reference');
  check(rule.frozenParity.repository === firstRule.repository && rule.frozenParity.ref === firstRule.ref
    && rule.frozenParity.path === legacyPins.stage7.path && rule.frozenParity.blobSha1 === legacyPins.stage7.blobSha1
    && rule.frozenParity.role === 'PARITY_GUARD_ONLY_NOT_INITIAL_RULE_VALIDATION'
    && rule.frozenParity.status === 'PASS_WITH_BLOCKER'
    && isDeepStrictEqual(rule.frozenParity.admittedHeroIds, [6, 8]), 'PROVENANCE', 'Stage 7 must remain a limited parity guard, not the rule origin');
  const frozenExpected = [...expected].map(([key, skillId]) => {
    const [heroId, star] = key.split(':').map(Number);
    return { heroId, star, skillId };
  });
  const parityRows = rule.frozenParity.rows.flatMap((hero) => hero.starSkills.map((row) => ({ heroId: hero.heroId, star: row.star, skillId: row.skillId })));
  check(isDeepStrictEqual(parityRows, frozenExpected), 'PARITY', 'frozen Legacy parity rows drift');
  check(rule.frozenParity.rows.every((hero) => hero.initialStar === 3 && hero.selectionRule === rule.rule), 'PARITY', 'frozen Legacy per-Hero interpretation drift');
  exactKeys(rule.stage6LocalizationBoundary, ['path', 'status', 'blockerScope', 'localizationAdmissionForHero6And8'], 'Stage 6 boundary');
  check(rule.stage6LocalizationBoundary.path === legacyPins.stage6.path && rule.stage6LocalizationBoundary.status === 'BLOCKER'
    && rule.stage6LocalizationBoundary.localizationAdmissionForHero6And8 === false
    && /248/.test(rule.stage6LocalizationBoundary.blockerScope), 'LOCALIZATION', 'localization blocker boundary drift');
  exactKeys(rule.claimAssessment, ['sourceArrayValues', 'selectionAndRelation', 'newIndependentRawInterpretation'], 'claim assessment');
  check(rule.claimAssessment.newIndependentRawInterpretation === 'NOT_CLAIMED'
    && /^A —/.test(rule.claimAssessment.sourceArrayValues)
    && /^B —/.test(rule.claimAssessment.selectionAndRelation), 'CLAIM_CLASS', 'source-array and selection-rule evidence classes are conflated');
  check(Array.isArray(rule.limitations) && rule.limitations.length >= 6
    && rule.limitations.some((x) => /not newly independently proven/.test(x))
    && rule.limitations.some((x) => /Stage 7.*not the first rule validation/.test(x))
    && rule.limitations.some((x) => /Talent Korean localization is not admitted/.test(x)), 'LIMITATIONS', 'required claim limitations missing');

  exactKeys(canonical, ['schemaVersion', 'scope', 'records'], 'Canonical');
  check(canonical.schemaVersion === 1 && canonical.scope === "Inherited B-class Hero normal Talent Skill reference by exact Hero ID and star; admitted Heroes 6 and 8 at stars 3 through 6 only.", 'CANONICAL', 'Canonical schema or scope drift');
  check(Array.isArray(rawRows), 'SOURCE', 'preserved JobConnection source projection must be an array');
  const rawById = new Map();
  for (const row of rawRows) {
    check(Number.isInteger(row.ID) && !rawById.has(row.ID), 'SOURCE', 'duplicate or invalid JobConnection source ID');
    rawById.set(row.ID, row);
  }
  exactKeys(relationEvidence, ['version', 'purpose', 'sourceScope', 'source', 'sourceFiles', 'preservedSubsets', 'schemaEvidence', 'priorInterpretationAnchor', 'claims', 'records', 'limitations', 'canonical', 'generated', 'productionRuntimeDependency'], 'Hero–JobConnection evidence');
  const relByKey = new Map();
  for (const row of relationEvidence.records) {
    const key = `${row.heroId}:${row.connectionId}`;
    check(!relByKey.has(key), 'RELATION', `duplicate Hero-JobConnection evidence ${key}`);
    relByKey.set(key, row);
  }
  const heroById = new Map(heroes.records.map((row) => [row.id, row]));
  const identityIds = new Set(identities.records.map((row) => row.heroId));
  const jobPairSet = new Set(jobRelations.records.map((row) => `${row.heroId}:${row.jobId}`));

  check(Array.isArray(sourceArrays.records) && sourceArrays.records.length === 12, 'SOURCE', 'expected exact connection-value projection for two Heroes × six connections');
  const evidenceByKey = new Map();
  for (const row of sourceArrays.records) {
    exactKeys(row, ['heroId', 'connectionId', 'relationLocator', 'sourceRecordLocator', 'field', 'values'], 'source array row');
    const key = `${row.heroId}:${row.connectionId}`;
    check(!evidenceByKey.has(key), 'SOURCE', `duplicate source array row ${key}`);
    evidenceByKey.set(key, row);
  }
  for (const [heroId, ids] of connectionIds) {
    check(identityIds.has(heroId), 'ENDPOINT', `Hero identity ${heroId} is missing`);
    const hero = heroById.get(heroId);
    check(hero !== undefined, 'ENDPOINT', `Hero owner ${heroId} is missing`);
    const ownedIds = hero.jobConnections.map((row) => row.connectionId);
    check(isDeepStrictEqual(ownedIds, ids), 'RELATION', `Hero owner JobConnection endpoint mismatch for Hero ${heroId}`);
    for (const id of ids) {
      const key = `${heroId}:${id}`;
      const row = evidenceByKey.get(key);
      const relation = relByKey.get(key);
      const raw = rawById.get(id);
      check(row !== undefined && relation !== undefined && raw !== undefined, 'SOURCE', `missing linked source or Hero-JobConnection endpoint ${key}`);
      check(row.relationLocator === `${connectionRelationPath}#heroId=${heroId}&connectionId=${id}`
        && relation.heroId === heroId && relation.connectionId === id, 'RELATION', `Hero-JobConnection locator mismatch ${key}`);
      check(row.sourceRecordLocator === `${rawConnectionPath}#ID=${id}` && row.field === 'TalentSkill_IDs', 'SOURCE', `wrong source field or locator ${key}`);
      check(isDeepStrictEqual(row.values, arrays.get(heroId)) && isDeepStrictEqual(raw.TalentSkill_IDs, row.values), 'SOURCE', `source TalentSkill_IDs mismatch at ${key}`);
      check(row.values.length === 6 && row.values.every((v) => Number.isInteger(v) && v > 0), 'SOURCE', `invalid six-slot TalentSkill_IDs at ${key}`);
      check(jobPairSet.has(`${heroId}:${relation.jobId}`) && hero.jobConnections.find((j) => j.connectionId === id)?.jobId === relation.jobId, 'RELATION', `existing Hero-Job endpoint parity mismatch ${key}`);
    }
  }

  const claimByKey = new Map();
  check(Array.isArray(evidence.claims) && evidence.claims.length === expected.size, 'CLAIM', 'Evidence claim coverage must be exact');
  for (const claim of evidence.claims) {
    exactKeys(claim, ['heroId', 'star', 'skillId', 'sourceArrayLocators', 'selectionRuleLocator', 'frozenParityLocator'], 'Evidence claim');
    const key = `${claim.heroId}:${claim.star}`;
    check(!claimByKey.has(key), 'CLAIM', `duplicate Evidence claim ${key}`);
    const ids = connectionIds.get(claim.heroId);
    check(expected.has(key) && ids !== undefined, 'SCOPE', `unsupported Hero/star ${key}`);
    check(claim.skillId === expected.get(key), 'PARITY', `frozen relation mismatch ${key}`);
    check(isDeepStrictEqual(claim.sourceArrayLocators, ids.map((id) => `${rawConnectionPath}#ID=${id}.TalentSkill_IDs`))
      && claim.selectionRuleLocator === 'data/hero-basic-combat-stage4-5.v1.json#semanticGates[talentStarProgression]'
      && claim.frozenParityLocator === `${legacyPins.stage7.path}#confirmedParityRecords[heroId=${claim.heroId},star=${claim.star}]`, 'PROVENANCE', `claim provenance locator drift ${key}`);
    check(arrays.get(claim.heroId)[claim.star - 1] === claim.skillId, 'PARITY', `array-index selection mismatch ${key}`);
    claimByKey.set(key, claim);
  }
  check(claimByKey.size === expected.size && [...expected.keys()].every((key) => claimByKey.has(key)), 'CLAIM', 'Evidence claim set missing or extra');

  check(Array.isArray(canonical.records) && canonical.records.length === expected.size, 'CANONICAL', 'Canonical must contain exactly eight admitted rows');
  const canonicalByKey = new Map();
  for (const row of canonical.records) {
    exactKeys(row, ['heroId', 'star', 'skillId', 'provenance'], 'Canonical row');
    check(Number.isInteger(row.heroId) && Number.isInteger(row.star) && Number.isInteger(row.skillId), 'CANONICAL', 'Canonical IDs and star must be integers');
    const key = `${row.heroId}:${row.star}`;
    check(!canonicalByKey.has(key), 'CANONICAL', `duplicate Hero/star row ${key}`);
    const claim = claimByKey.get(key);
    check(claim !== undefined, 'SCOPE', `Canonical Hero/star outside admitted scope ${key}`);
    check(row.skillId === claim.skillId && row.skillId === expected.get(key), 'CANONICAL', `Canonical source/parity mismatch ${key}`);
    check(row.provenance === `${evidencePath}#heroId=${row.heroId}&star=${row.star}`, 'PROVENANCE', `Canonical provenance locator mismatch ${key}`);
    canonicalByKey.set(key, row);
  }
  check(canonicalByKey.size === expected.size && [...expected.keys()].every((key) => canonicalByKey.has(key)), 'CANONICAL', 'Canonical relation set missing or extra');
  return { heroCount: 2, relationCount: canonical.records.length, sourceArrayRecords: sourceArrays.records.length, sourceArrayClass: 'A_REUSED_HASH_VERIFIED_PROJECTION', selectionRelationClass: 'B', stage7Role: 'PARITY_GUARD_ONLY' };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const result = await validateHeroTalentStarSkills();
    console.log(`Hero Talent star-skill validation: PASS (Heroes=${result.heroCount}, relations=${result.relationCount}, source-array rows=${result.sourceArrayRecords})`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
