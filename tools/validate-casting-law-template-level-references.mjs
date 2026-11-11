import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

const EVIDENCE = 'evidence/source/jobs/casting-law-template-level-references.v1.json';
const CANONICAL = 'canonical/casting-law-template-level-references.v1.json';
const TEMPLATE_EVIDENCE = 'evidence/source/jobs/casting-law-template-raw-details.v1.json';
const TEMPLATE_CANONICAL = 'canonical/casting-law-template-raw-details.v1.json';
const SOURCE = {
  repository: 'LuceatLuxVestra42/langrisser-future-guide',
  commit: '6475e63ee23d18adf733756c26a14fa9e3ed662c',
  tree: '08e1e6c2773730e60b258940e31494f68d65f86a',
  configDataSubtree: 'b18983f60cb054c2e6e094d64cdb98979211d7fc',
};
const TEMPLATE_SOURCE = { path: 'data/configdata/ConfigDataCastingLawTemplateInfo.json', blobSha1: '3d3f403120324a258cc1e1d03dd4af3cf56ad10e', sha256: '8e26a550cfb55757daa5221a674281eebea1a71e0993e30b136b98fcc98c459d', byteLength: 14036, recordCount: 50 };
const LEVEL_SOURCE = { path: 'data/configdata/ConfigDataCastingLawLevelUpInfo.json', blobSha1: '83b99ebff9c54523d7f9476b92e8b3d59229179f', sha256: '07b91384b3dab506d501d74b4e70b6535b84f5d620e0082c3e557afec146e849', byteLength: 232171, recordCount: 500 };
const TEMPLATE_IDS_IN_SELECTION_ORDER = [14, 12, 37, 40, 41];
const LEVEL_IDS = {
  14: [66,67,68,69,70,10066,10067,10068,10069,10070],
  12: [56,57,58,59,60,10056,10057,10058,10059,10060],
  37: [181,182,183,184,185,10181,10182,10183,10184,10185],
  40: [196,197,198,199,200,10196,10197,10198,10199,10200],
  41: [201,202,203,204,205,10201,10202,10203,10204,10205],
};
const LEVEL_SOURCE_INDEX = {
  66:65,67:66,68:67,69:68,70:69,10066:315,10067:316,10068:317,10069:318,10070:319,
  56:55,57:56,58:57,59:58,60:59,10056:305,10057:306,10058:307,10059:308,10060:309,
  181:180,182:181,183:182,184:183,185:184,10181:430,10182:431,10183:432,10184:433,10185:434,
  196:195,197:196,198:197,199:198,200:199,10196:445,10197:446,10198:447,10199:448,10200:449,
  201:200,202:201,203:202,204:203,205:204,10201:450,10202:451,10203:452,10204:453,10205:454,
};
const check = (ok, code, message) => { if (!ok) throw new Error(`Casting Law Template Level-reference validation failed [${code}]: ${message}`); };
const exactKeys = (v, keys, label) => check(v && typeof v === 'object' && !Array.isArray(v) && isDeepStrictEqual(Object.keys(v).sort(), [...keys].sort()), 'SCHEMA', `${label} keys drift`);
const readJson = async (root, path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));

export function validateCastingLawTemplateLevelReferencesData({ evidence, canonical, templateEvidence, templateCanonical }) {
  check(evidence.schemaVersion === 1 && evidence.claimType === 'casting-law-template-level-references' && evidence.owner === 'shared-casting-law-template-level-reference', 'EVIDENCE', 'owner/schema identity drift');
  check(isDeepStrictEqual(evidence.sourceSnapshot, SOURCE), 'SOURCE', 'source repository, commit, tree, or subtree drift');
  check(isDeepStrictEqual(evidence.templateSource, TEMPLATE_SOURCE) && isDeepStrictEqual(evidence.levelUpSource, LEVEL_SOURCE), 'SOURCE_PIN', 'Template or LevelUp source pin drift');
  check(isDeepStrictEqual(evidence.scope?.templateIds, TEMPLATE_IDS_IN_SELECTION_ORDER) && evidence.scope?.templateNamespace === 'ConfigDataCastingLawTemplateInfo.ID', 'SCOPE', 'shared Template scope drift');
  check(evidence.selectionEvidence?.templateRawClaimsReused === true && evidence.selectionEvidence?.heroReferenceEvidence === 'evidence/source/jobs/hero15-casting-law-template-references.v1.json', 'SELECTION', 'selection evidence boundary drift');
  check(templateEvidence?.source?.gitBlobSha1 === TEMPLATE_SOURCE.blobSha1 && templateCanonical?.records?.length === 5
    && isDeepStrictEqual(templateCanonical.records.map(r => r.templateId).sort((a,b)=>a-b), [12,14,37,40,41]), 'TEMPLATE_ENDPOINT', 'shared Template raw detail endpoint mismatch');
  check(evidence.templateRecords?.length === 5, 'POPULATION', 'expected five selected template records');
  const templateSourceIndex = { 14: 13, 12: 11, 37: 36, 40: 39, 41: 40 };
  const expectedTemplates = TEMPLATE_IDS_IN_SELECTION_ORDER.map((templateId) => {
    const raw = templateCanonical.records.find(r => r.templateId === templateId)?.rawRecord;
    check(raw && isDeepStrictEqual(raw.CastingLawLevelUpInfoList, LEVEL_IDS[templateId]), 'TEMPLATE_SOURCE_PARITY', `Template ${templateId} raw list missing or changed`);
    const refs = LEVEL_IDS[templateId].map((levelUpInfoId, sourceArrayIndex) => ({
      templateId,
      sourceField: 'ConfigDataCastingLawTemplateInfo.CastingLawLevelUpInfoList',
      sourceArrayIndex,
      levelUpInfoId,
      levelUpEndpointNamespace: 'ConfigDataCastingLawLevelUpInfo.ID',
      levelUpSourceArrayIndex: LEVEL_SOURCE_INDEX[levelUpInfoId],
      levelUpRecordLocator: `ConfigDataCastingLawLevelUpInfo#ID=${levelUpInfoId}`,
    }));
    return { templateId, templateSourceArrayIndex: templateSourceIndex[templateId], templateRecordLocator: `ConfigDataCastingLawTemplateInfo#ID=${templateId}`, sourceField: 'ConfigDataCastingLawTemplateInfo.CastingLawLevelUpInfoList', rawLevelUpInfoIds: LEVEL_IDS[templateId], references: refs };
  });
  check(isDeepStrictEqual(evidence.templateRecords, expectedTemplates), 'RAW_REFERENCE', 'exact raw array, order, indexes, or LevelUp endpoint locators drift');
  exactKeys(canonical, ['schemaVersion','scope','sourceOrder','records'], 'Canonical');
  check(canonical.schemaVersion === 1 && isDeepStrictEqual(canonical.sourceOrder, TEMPLATE_IDS_IN_SELECTION_ORDER), 'CANONICAL_SCOPE', 'canonical source ordering drift');
  check(canonical.scope === 'Ordered ConfigDataCastingLawTemplateInfo.CastingLawLevelUpInfoList references to ConfigDataCastingLawLevelUpInfo.ID for selected shared Templates; no runtime meaning.', 'CANONICAL_SCOPE', 'canonical scope text drift');
  check(isDeepStrictEqual(canonical.records, expectedTemplates.flatMap(t => t.references)), 'CANONICAL_PARITY', 'canonical relation rows differ from direct source evidence');
  check(canonical.records.length === 50 && new Set(canonical.records.map(r => `${r.templateId}:${r.sourceArrayIndex}`)).size === 50, 'DUPLICATE', 'relation duplicate or population drift');
  check(canonical.records.every(r => !Object.hasOwn(r,'heroId') && !Object.hasOwn(r,'jobId') && !Object.hasOwn(r,'level') && !Object.hasOwn(r,'materials') && !Object.hasOwn(r,'runtimeRule')), 'BOUNDARY', 'Hero membership, level semantics, material detail, or runtime meaning mixed into relation');
  return { templateCount: 5, relationCount: 50 };
}
export async function validateCastingLawTemplateLevelReferences(root = process.cwd()) {
  const [evidence, canonical, templateEvidence, templateCanonical] = await Promise.all([
    readJson(root,EVIDENCE),readJson(root,CANONICAL),readJson(root,TEMPLATE_EVIDENCE),readJson(root,TEMPLATE_CANONICAL),
  ]);
  const result = validateCastingLawTemplateLevelReferencesData({ evidence, canonical, templateEvidence, templateCanonical });
  process.stdout.write(`Casting Law Template-LevelUp references: PASS (templates=${result.templateCount}; ordered relations=${result.relationCount}; no runtime or material meaning)\n`);
  return result;
}
if (process.argv[1] && resolve(process.argv[1]) === resolve('tools/validate-casting-law-template-level-references.mjs')) await validateCastingLawTemplateLevelReferences();
