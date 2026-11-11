import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateHero15CastingLawTemplateReferencesData } from './validate-hero15-casting-law-template-references.mjs';

const read = async path => JSON.parse(await readFile(path, 'utf8'));
const [evidence, canonical] = await Promise.all([
  read('evidence/source/jobs/hero15-casting-law-template-references.v1.json'),
  read('canonical/hero-casting-law-template-references.v1.json'),
]);
const fresh = () => ({ evidence: structuredClone(evidence), canonical: structuredClone(canonical) });
const expected = { heroId: 15, templateReferences: 5, orderedTemplateIds: [14, 12, 37, 40, 41], materialOrEffectSemantics: false, publication: false };
assert.deepEqual(validateHero15CastingLawTemplateReferencesData(fresh()), expected);

const cases = [
  [d => { d.evidence.sourceSnapshot.commit = '0'.repeat(40); }, 'source commit'],
  [d => { d.evidence.sourceSnapshot.tree = '0'.repeat(40); }, 'source tree'],
  [d => { d.evidence.heroSource.blobSha1 = '0'.repeat(40); }, 'HeroInfo blob'],
  [d => { d.evidence.heroSource.sha256 = '0'.repeat(64); }, 'HeroInfo hash'],
  [d => { d.evidence.heroSource.recordLocator = 'ConfigDataHeroInfo#ID=14'; }, 'Hero locator'],
  [d => { d.evidence.heroSource.sourceArrayIndex = 15; }, 'Hero record index'],
  [d => { d.evidence.heroSource.fields.ID = 14; }, 'Hero identity'],
  [d => { d.evidence.heroSource.fields.CastingLawTemplates_ID[0] = 12; }, 'source array value'],
  [d => { d.evidence.heroSource.fields.CastingLawTemplates_ID.reverse(); }, 'source array order'],
  [d => { d.evidence.templateSource.blobSha1 = '0'.repeat(40); }, 'template blob'],
  [d => { d.evidence.templateRecords[0].fields.ID = 13; }, 'template endpoint ID'],
  [d => { d.evidence.templateRecords[0].sourceArrayIndex = 12; }, 'template record index'],
  [d => { d.evidence.templateRecords.pop(); }, 'missing endpoint'],
  [d => { d.evidence.templateRecords[0].recordLocator = 'ConfigDataCastingLawTemplateInfo#ID=14'; }, 'endpoint locator'],
  [d => { d.evidence.interpretation.transformation = 'Sort template IDs numerically'; }, 'unsupported transformation'],
  [d => { d.canonical.records[0].templateId = 12; }, 'canonical endpoint mismatch'],
  [d => { d.canonical.records[0].heroId = 8; }, 'wrong Hero relation'],
  [d => { d.canonical.records[0].templateNamespace = 'ConfigDataHeroInfo.ID'; }, 'namespace confusion'],
  [d => { d.canonical.records[0].sourceArrayIndex = 1; }, 'array locator mismatch'],
  [d => { d.canonical.records.pop(); }, 'missing Canonical relation'],
  [d => { d.canonical.records[4].templateId = 14; }, 'duplicate/misordered reference'],
  [d => { d.canonical.records[0].costProfile = 'A'; }, 'cost semantics escalation'],
  [d => { d.canonical.records[0].equipmentType = 1; }, 'slot semantics escalation'],
  [d => { d.canonical.records[0].unlockCondition = true; }, 'unlock semantics escalation'],
  [d => { d.canonical.records[0].combatEffect = 'invented'; }, 'effect escalation'],
  [d => { d.canonical.records[0].publicationApproval = true; }, 'publication escalation'],
];
for (const [mutate, label] of cases) {
  const data = fresh();
  mutate(data);
  assert.throws(() => validateHero15CastingLawTemplateReferencesData(data), undefined, `must reject ${label}`);
}
console.log(`Hero 15 Casting Law template-reference negative controls: PASS (${cases.length})`);
