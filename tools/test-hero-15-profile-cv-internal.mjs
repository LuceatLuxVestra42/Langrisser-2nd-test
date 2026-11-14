import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateHero15ProfileCvInternal } from './validate-hero-15-profile-cv-internal.mjs';

const read = async (path) => JSON.parse(await readFile(path, 'utf8'));
const baseline = {
  evidence: await read('evidence/source/configdata/ConfigDataCharImageInfo.record-hero-15-cv-name.v1.json'),
  canonical: await read('canonical/hero-profile-cv-names.v1.json'),
  identities: await read('canonical/hero-identities.v1.json'),
  portraitEvidence: await read('evidence/source/portraits/hero-portrait-hero15.v1.json'),
  fullDetailDecision: await read('docs/decisions/hero-15-full-detail-publication.v1.json'),
  generatedText: await readFile('generated/hero-15-profile-cv-internal.v1.json', 'utf8'),
};
assert.equal(validateHero15ProfileCvInternal(baseline), true);
const cases = [
  ['Hero ID changed', (x) => { x.evidence.claim.heroId = 16; }],
  ['CharImage endpoint changed', (x) => { x.evidence.claim.charImageId = 16; }],
  ['CVName source value changed', (x) => { x.evidence.source.fields.CVName = 'another'; }],
  ['wrong Source locator', (x) => { x.evidence.source.fieldLocators.CVName = '#records[14]/CVName'; }],
  ['source blob pin changed', (x) => { x.evidence.source.gitBlobSha1 = '0'.repeat(40); }],
  ['Hero foreign key changed', (x) => { x.evidence.relation.charImageId = 16; }],
  ['Canonical name changed', (x) => { x.canonical.records[0].cvNameRaw = 'another'; }],
  ['Canonical Hero ID changed', (x) => { x.canonical.records[0].heroId = 16; }],
  ['Canonical provenance detached', (x) => { x.canonical.records[0].provenance.cvNameRaw = 'legacy-output'; }],
  ['identity endpoint removed', (x) => { x.identities.records = x.identities.records.filter((row) => row.heroId !== 15); }],
  ['portrait FK relation changed', (x) => { x.portraitEvidence.source.heroInfo.fields.CharImage_ID = 16; }],
  ['public Full Detail approved', (x) => { x.fullDetailDecision.publication.fullDetailStatus = 'APPROVED'; }],
  ['CV published in Full Detail', (x) => { x.fullDetailDecision.fieldGroups.find((g) => g.id === 'profile').publicationApprovedFields.push('cv'); }],
  ['population expanded', (x) => { x.fullDetailDecision.population.canonicalPopulationCount = 30; }],
  ['Generated value changed', (x) => { x.generatedText = x.generatedText.replace('小清水亚美', 'changed'); }],
];
for (const [label, mutate] of cases) {
  const fixture = structuredClone(baseline);
  mutate(fixture);
  assert.throws(() => validateHero15ProfileCvInternal(fixture), undefined, label);
}
process.stdout.write(`Hero 15 profile CV internal negative tests: PASS (${cases.length} cases)\n`);
