import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { renderExclusiveEquipmentHeroNavigation, validateExclusiveEquipmentHeroNavigation } from './exclusive-equipment-hero-navigation-contract.mjs';
import { HERO_15_INTEGRATED_PUBLICATION_PATH } from './hero-15-integrated-publication-contract.mjs';
import { HERO_16_INTEGRATED_PUBLICATION_PATH } from './hero-16-integrated-publication-contract.mjs';
import { HERO_MINIMAL_DETAIL_BATCH_PUBLICATION_PATH } from './hero-minimal-detail-batch-contract.mjs';
import { HERO_MINIMAL_DETAIL_TEN_BATCH_PUBLICATION_PATH } from './hero-minimal-detail-ten-batch-contract.mjs';
import { HERO_MINIMAL_DETAIL_THIRTY_BATCH, HERO_MINIMAL_DETAIL_THIRTY_BATCH_PUBLICATION_PATH } from './hero-minimal-detail-thirty-batch-contract.mjs';
import { HERO_MINIMAL_DETAIL_TWENTY_BATCH_PUBLICATION_PATH } from './hero-minimal-detail-twenty-batch-contract.mjs';

const read = async (path) => JSON.parse(await readFile(path, 'utf8'));
const [relations, equipmentIdentities, heroIdentities, heroLocalizations, heroSlice, heroIndexPublication, publicationDecision, integratedPublicationDecision, hero16IntegratedPublicationDecision, heroMinimalDetailBatchPublicationDecision, heroMinimalDetailTenBatchPublicationDecision, heroMinimalDetailTwentyBatchPublicationDecision, heroMinimalDetailThirtyBatchPublicationDecision, generatedText, heroLocalizationBytes, heroIdentityBytes] = await Promise.all([
  read('canonical/hero-exclusive-equipment-relations.v1.json'), read('canonical/exclusive-equipment.v1.json'),
  read('canonical/hero-identities.v1.json'), read('canonical/hero-localizations-ko.v1.json'), read('generated/hero-slice.v1.json'),
  read('docs/decisions/hero-index-publication.v1.json'), read('docs/decisions/exclusive-equipment-hero-navigation-publication.v1.json'),
  read(HERO_15_INTEGRATED_PUBLICATION_PATH),
  read(HERO_16_INTEGRATED_PUBLICATION_PATH),
  read(HERO_MINIMAL_DETAIL_BATCH_PUBLICATION_PATH),
  read(HERO_MINIMAL_DETAIL_TEN_BATCH_PUBLICATION_PATH),
  read(HERO_MINIMAL_DETAIL_TWENTY_BATCH_PUBLICATION_PATH),
  read(HERO_MINIMAL_DETAIL_THIRTY_BATCH_PUBLICATION_PATH),
  readFile('generated/exclusive-equipment-hero-navigation.v1.json', 'utf8'),
  readFile('canonical/hero-localizations-ko.v1.json'), readFile('canonical/hero-identities.v1.json'),
]);
const inputs = {
  relations, equipmentIdentities, heroIdentities, heroLocalizations, heroSlice, heroIndexPublication, publicationDecision, integratedPublicationDecision, hero16IntegratedPublicationDecision, heroMinimalDetailBatchPublicationDecision, heroMinimalDetailTenBatchPublicationDecision, heroMinimalDetailTwentyBatchPublicationDecision, heroMinimalDetailThirtyBatchPublicationDecision,
  heroLocalizationSha256: createHash('sha256').update(heroLocalizationBytes).digest('hex'),
  heroIdentitySha256: createHash('sha256').update(heroIdentityBytes).digest('hex'),
};
const output = validateExclusiveEquipmentHeroNavigation({ generatedText, inputs });
assert.equal(output.records.length, 167);
assert.equal(output.records.filter(({ navigationTarget }) => navigationTarget.surface === 'HERO_DETAIL').length, 29);
assert.equal(output.records.filter(({ navigationTarget }) => navigationTarget.surface === 'HERO_INDEX').length, 71);
assert.equal(output.records.filter(({ navigationTarget }) => navigationTarget.surface === 'HERO_MINIMAL_DETAIL').length, 67);
assert.deepEqual(output.records.find(({ equipmentId }) => equipmentId === 535).navigationTarget,
  { surface: 'HERO_MINIMAL_DETAIL', fragment: 'hero-minimal-detail-15' });
assert.deepEqual(output.records.find(({ equipmentId }) => equipmentId === 418).navigationTarget,
  { surface: 'HERO_MINIMAL_DETAIL', fragment: 'hero-minimal-detail-16' });
const minimalTargetEquipmentIds = [276,281,286,293,297,405,411,413,414,417,418,423,424,425,426,427,429,434,435,437,438,439,440,441,448,452,453,455,460,464,472,476,479,490,535,540,549,449,450,451,454,461,463,467,473,475,477,478,484,485,486,487,489,495,496,497,498,499,500,501,502,507,508,512,519,520,526].sort((a,b)=>a-b);
assert.equal(minimalTargetEquipmentIds.length, 67);
assert.deepEqual(output.records.filter(({ navigationTarget }) => navigationTarget.surface === 'HERO_MINIMAL_DETAIL').map(({ equipmentId }) => equipmentId), minimalTargetEquipmentIds);
const approvedThirty = HERO_MINIMAL_DETAIL_THIRTY_BATCH.map(({ equipmentId, heroId }) => [equipmentId, heroId]);
assert.deepEqual(approvedThirty.map(([equipmentId]) => {
  const row = output.records.find((candidate) => candidate.equipmentId === equipmentId);
  return [row?.heroId, row?.navigationTarget.surface, row?.navigationTarget.fragment];
}), approvedThirty.map(([, heroId]) => [heroId, 'HERO_MINIMAL_DETAIL', `hero-minimal-detail-${heroId}`]));
assert.equal(output.records.filter(({ navigationTarget }) => navigationTarget.surface === 'HERO_DETAIL').length
  + output.records.filter(({ navigationTarget }) => navigationTarget.surface === 'HERO_INDEX').length
  + output.records.filter(({ navigationTarget }) => navigationTarget.surface === 'HERO_MINIMAL_DETAIL').length, 167);
assert.equal(output.records[0].navigationTarget.fragment.startsWith('hero-'), true);
assert.equal(output.records.find(({ navigationTarget }) => navigationTarget.surface === 'HERO_INDEX').navigationTarget.fragment.startsWith('hero-index-entry-'), true);
assert.equal(new Set(output.records.map(({ equipmentId }) => equipmentId)).size, 167);

const fails = (mutate, pattern) => {
  const altered = structuredClone(inputs);
  mutate(altered);
  assert.throws(() => renderExclusiveEquipmentHeroNavigation(altered), pattern);
};
fails((x) => { x.publicationDecision.status = 'NOT_APPROVED'; }, /unsupported/);
fails((x) => { x.publicationDecision.approval.source.attachmentSha256 = '0'.repeat(64); }, /approval evidence/);
fails((x) => { x.relations.records.push(structuredClone(x.relations.records[0])); }, /relation source differs|167 current Canonical pairs/);
fails((x) => { x.relations.records[0].equipmentId = 999999; }, /source differs|unresolved|exactly match/);
fails((x) => { x.equipmentIdentities.records = x.equipmentIdentities.records.filter(({ equipmentId }) => equipmentId !== x.relations.records[0].equipmentId); }, /exactly match/);
fails((x) => { x.heroIdentities.records = x.heroIdentities.records.filter(({ heroId }) => heroId !== x.relations.records[0].heroId); }, /Unresolved or unpublished/);
fails((x) => { x.heroLocalizationSha256 = '0'.repeat(64); }, /name or identity source differs/);
fails((x) => { x.publicationDecision.approvedScope.relations.pop(); }, /exactly match/);
fails((x) => { x.publicationDecision.approvedScope.detailHeroIds.pop(); }, /target populations/);
fails((x) => { x.publicationDecision.approvedScope.indexHeroIds[0] = -1; }, /target populations/);
fails((x) => { x.integratedPublicationDecision.approvedScope.exclusiveEquipmentNavigation.equipmentId = 536; }, /integrated Publication approval or scope/);
fails((x) => { x.hero16IntegratedPublicationDecision.approvedScope.exclusiveEquipmentNavigation.equipmentId = 419; }, /Hero 16 integrated Publication approval or scope/);
fails((x) => { x.hero16IntegratedPublicationDecision.approvedScope.exclusiveEquipmentNavigation.otherEquipmentTargetsPreserved = 165; }, /Hero 16 integrated Publication approval or scope/);
fails((x) => { x.heroMinimalDetailBatchPublicationDecision.approvedScope.heroes[0].equipmentTarget.fragment = 'hero-index-entry-17'; }, /Five-Hero integrated Publication approval/);
fails((x) => { x.heroMinimalDetailTwentyBatchPublicationDecision.status = 'NOT_APPROVED'; }, /Twenty-Hero integrated Publication approval/);
fails((x) => { x.heroMinimalDetailTwentyBatchPublicationDecision.approvedScope.heroes[0].equipmentTarget.fragment = 'hero-index-entry-58'; }, /Twenty-Hero integrated Publication approval/);
fails((x) => { x.heroMinimalDetailThirtyBatchPublicationDecision.status = 'NOT_APPROVED'; }, /Thirty-Hero integrated Publication approval/);
fails((x) => { x.heroMinimalDetailThirtyBatchPublicationDecision.approvedScope.heroes[0].equipmentTarget.fragment = 'hero-index-entry-101'; }, /Thirty-Hero integrated Publication approval/);
fails((x) => { x.heroSlice.heroes = x.heroSlice.heroes.slice(1); }, /existing slice/);
assert.throws(() => validateExclusiveEquipmentHeroNavigation({ generatedText: `${generatedText}\n`, inputs }), /stale or non-deterministic/);
const wrongTarget = JSON.parse(generatedText);
wrongTarget.records[0].navigationTarget.fragment = 'hero-index-entry-999999';
assert.throws(() => validateExclusiveEquipmentHeroNavigation({ generatedText: `${JSON.stringify(wrongTarget, null, 2)}\n`, inputs }), /stale or non-deterministic/);
const wrongHero16Target = JSON.parse(generatedText);
wrongHero16Target.records.find(({ equipmentId }) => equipmentId === 418).navigationTarget.fragment = 'hero-index-entry-16';
assert.throws(() => validateExclusiveEquipmentHeroNavigation({ generatedText: `${JSON.stringify(wrongHero16Target, null, 2)}\n`, inputs }), /stale or non-deterministic/);

process.stdout.write('Exclusive Equipment Hero Navigation regression: PASS (167 exact pairs; 29 Full Detail, 71 Index, 67 exact Minimal Detail targets; approval, endpoint, localization, scope, target, and stale-output negatives)\n');
