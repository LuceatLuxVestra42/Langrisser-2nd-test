import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const EVIDENCE = 'evidence/source/jobs/hero15-casting-law-template-references.v1.json';
const CANONICAL = 'canonical/hero-casting-law-template-references.v1.json';
const EXPECTED_IDS = [14, 12, 37, 40, 41];
const TEMPLATE_LOCATORS = [
  { sourceArrayIndex: 11, recordLocator: 'ConfigDataCastingLawTemplateInfo#ID=12', fields: { ID: 12 } },
  { sourceArrayIndex: 13, recordLocator: 'ConfigDataCastingLawTemplateInfo#ID=14', fields: { ID: 14 } },
  { sourceArrayIndex: 36, recordLocator: 'ConfigDataCastingLawTemplateInfo#ID=37', fields: { ID: 37 } },
  { sourceArrayIndex: 39, recordLocator: 'ConfigDataCastingLawTemplateInfo#ID=40', fields: { ID: 40 } },
  { sourceArrayIndex: 40, recordLocator: 'ConfigDataCastingLawTemplateInfo#ID=41', fields: { ID: 41 } },
];
const check = (condition, message) => { if (!condition) throw new Error(message); };

export function validateHero15CastingLawTemplateReferencesData({ evidence, canonical }) {
  check(evidence.schemaVersion === 1 && evidence.claimType === 'hero15-casting-law-template-source-references', 'Casting Law evidence contract mismatch');
  check(evidence.scope.includes('No cost') && evidence.scope.includes('publication'), 'Casting Law evidence scope boundary missing');
  assert.deepEqual(evidence.sourceSnapshot, {
    repository: 'LuceatLuxVestra42/langrisser-future-guide',
    commit: '6475e63ee23d18adf733756c26a14fa9e3ed662c',
    tree: '08e1e6c2773730e60b258940e31494f68d65f86a',
  }, 'Frozen source snapshot mismatch');
  assert.deepEqual(evidence.heroSource, {
    path: 'data/configdata/ConfigDataHeroInfo.json',
    blobSha1: '728daab3370f0c7779449663ea02e638677944d4',
    sha256: '2385599493d2598aa3f7d6b2c76ecdfd8615d91f19b6241933986282fcb17f7b',
    recordCount: 28789,
    sourceArrayIndex: 14,
    recordLocator: 'ConfigDataHeroInfo#ID=15',
    fields: { ID: 15, CastingLawTemplates_ID: EXPECTED_IDS },
    fieldLocator: 'ConfigDataHeroInfo#ID=15/CastingLawTemplates_ID',
  }, 'Hero source pin, locator, or reference values mismatch');
  assert.deepEqual(evidence.templateSource, {
    path: 'data/configdata/ConfigDataCastingLawTemplateInfo.json',
    blobSha1: '3d3f403120324a258cc1e1d03dd4af3cf56ad10e',
    sha256: '8e26a550cfb55757daa5221a674281eebea1a71e0993e30b136b98fcc98c459d',
    recordCount: 50,
    endpointNamespace: 'ConfigDataCastingLawTemplateInfo.ID',
  }, 'Template source pin mismatch');
  assert.deepEqual(evidence.templateRecords, TEMPLATE_LOCATORS, 'Template endpoint evidence mismatch');
  check(evidence.interpretation.evidenceClass === 'A_DIRECT_SOURCE_REFERENCE', 'Evidence class mismatch');
  check(evidence.interpretation.transformation.includes('source order') && evidence.interpretation.transformation.includes('No sorting or deduplication'), 'Source order transformation mismatch');
  check(evidence.interpretation.limitation.includes('outside this admission'), 'Semantic limitation missing');

  assert.deepEqual(Object.keys(canonical).sort(), ['records', 'schemaVersion', 'scope'].sort(), 'Casting Law Canonical schema drift');
  check(canonical.schemaVersion === 1 && canonical.records.length === 5, 'Casting Law Canonical population mismatch');
  check(canonical.scope.includes('no cost') && canonical.scope.includes('publication'), 'Casting Law Canonical scope boundary missing');
  const expected = EXPECTED_IDS.map((templateId, sourceArrayIndex) => ({
    heroId: 15,
    sourceField: 'ConfigDataHeroInfo.CastingLawTemplates_ID',
    sourceArrayIndex,
    templateId,
    templateNamespace: 'ConfigDataCastingLawTemplateInfo.ID',
    evidenceProvenance: `${EVIDENCE}#heroSource/fields/CastingLawTemplates_ID/${sourceArrayIndex}`,
    endpointProvenance: `${EVIDENCE}#templateRecords/${TEMPLATE_LOCATORS.findIndex(row => row.fields.ID === templateId)}`,
  }));
  assert.deepEqual(canonical.records, expected, 'Casting Law references or provenance mismatch');
  const forbidden = ['cost', 'gold', 'material', 'slot', 'mastery', 'unlock', 'effect', 'skill', 'publication'];
  check(!canonical.records.some(row => Object.keys(row).some(key => forbidden.some(term => key.toLowerCase().includes(term)))), 'Out-of-scope Casting Law semantic field found');
  return { heroId: 15, templateReferences: 5, orderedTemplateIds: EXPECTED_IDS, materialOrEffectSemantics: false, publication: false };
}

export async function validateHero15CastingLawTemplateReferences(root = process.cwd()) {
  const read = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'));
  const [evidence, canonical] = await Promise.all([read(EVIDENCE), read(CANONICAL)]);
  const result = validateHero15CastingLawTemplateReferencesData({ evidence, canonical });
  process.stdout.write('Hero 15 Casting Law template references: PASS (5 direct ordered references; no costs, effects, or publication admitted)\n');
  return result;
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) await validateHero15CastingLawTemplateReferences();
