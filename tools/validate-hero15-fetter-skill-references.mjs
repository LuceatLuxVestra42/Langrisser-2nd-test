import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const EVIDENCE = 'evidence/source/bonds/hero15-fetter-skill-references.v1.json';
const CANONICAL = 'canonical/hero-fetter-skill-references.v1.json';
const EXPECTED_SKILL_BLOB = 'dbd7f8f94702bb43d2ceb0091e9755c9aebaed19';
const EXPECTED_SKILL_SHA256 = '2ff6d67e8c010037597928bccd2dc7b4b9abc0d2a78c9705d816c8218df3e741';
const EXPECTED_CONTRACT_BLOB = '5666c0c43c47205096c8c347f7055d45e1febef9';
const EXPECTED_SHARD_BLOB = '7cc3f9e79395e79b08d99c79905f69a0bba9b1bb';
const EXPECTED_ENDPOINT_PROJECTION = 'e535acf5ffccb87e96608d841b17e477c779398a5e6e3efaa2e93be6f1efc94d';
const assertThat = (v, m) => { if (!v) throw new Error(m); };
const same = (a, b, m) => assert.deepEqual(a, b, m);

export function validateHero15FetterSkillReferencesData({ evidence, canonical, fetterDetails, heartDetails }) {
  assertThat(evidence.schemaVersion === 1 && evidence.claimType === 'hero15-fetter-skill-level-locators', 'Evidence contract mismatch');
  assertThat(evidence.source.repository === 'LuceatLuxVestra42/langrisser-future-guide', 'Source repository mismatch');
  assertThat(evidence.source.configDataCommit === '6475e63ee23d18adf733756c26a14fa9e3ed662c' && evidence.source.configDataTree === '08e1e6c2773730e60b258940e31494f68d65f86a', 'Frozen ConfigData snapshot mismatch');
  assertThat(evidence.source.skillInfo.blobSha1 === EXPECTED_SKILL_BLOB && evidence.source.skillInfo.sha256 === EXPECTED_SKILL_SHA256 && evidence.source.skillInfo.recordCount === 27198, 'SkillInfo source pin mismatch');
  assertThat(evidence.legacyLocatorContract.blobSha1 === EXPECTED_CONTRACT_BLOB && evidence.legacyLocatorContract.costPolicy.regularLocator === 'gotSkillIds[targetLevel-1]' && evidence.legacyLocatorContract.costPolicy.heartLocator === 'HeroHeartFetterSkills[targetLevel-1]', 'Legacy locator contract mismatch');
  assertThat(evidence.legacyFrozenProjection.blobSha1 === EXPECTED_SHARD_BLOB, 'Legacy frozen projection pin mismatch');
  assertThat(evidence.legacyFrozenProjection.transformation.includes('camelCase projection of the pinned ConfigDataHeroFetterInfo.GotSkills_ID array'), 'Regular field alias transformation not documented');
  assertThat(evidence.scope.includes('no Skill Identity admission') && evidence.scope.includes('acquisition'), 'Evidence limitation missing');
  same(Object.keys(canonical).sort(), ['records','schemaVersion','scope'].sort(), 'Canonical schema drift');
  assertThat(canonical.schemaVersion === 1 && canonical.scope.includes('no Skill Identity admission') && canonical.records.length === 54, 'Canonical scope/population mismatch');

  const raw = [
    ...fetterDetails.records.map(r => ({ record:r, kind:'REGULAR_FETTER', field:'GotSkills_ID', ns:'ConfigDataHeroFetterInfo.ID', base:r.endpointId-66, path:'evidence/source/bonds/hero15-fetter-raw-details.v1.json' })),
    ...heartDetails.records.map(r => ({ record:r, kind:'HEART_FETTER', field:'HeroHeartFetterSkills', ns:'ConfigDataHeroHeartFetterInfo.ID', base:0, path:'evidence/source/bonds/hero15-heart-fetter-raw-details.v1.json' })),
  ];
  assertThat(raw.length === 6 && fetterDetails.records.length === 5 && heartDetails.records.length === 1, 'Raw detail endpoint population changed');
  const expected = [];
  for (const x of raw) {
    const { record:r, kind, field, ns, base, path } = x;
    assertThat(r.heroId === 15 && r.endpointNamespace === ns && Array.isArray(r.fields[field]) && r.fields[field].length === 10, `Raw Skill array mismatch at ${r.sourceRecordLocator}`);
    for (let level=2; level<=10; level++) {
      const index=level-1;
      expected.push({ heroId:15, trackKind:kind, trackEndpointId:r.endpointId, trackEndpointNamespace:ns, sourceField:field, targetLevel:level, sourceArrayIndex:index, locatorRule:`${field}[targetLevel-1]`, skillId:r.fields[field][index], skillNamespace:'ConfigDataSkillInfo.ID', trackEvidenceProvenance:`${path}#selection/records/${base}/fields/${field}` });
    }
  }
  same(evidence.claims, expected, 'Evidence locator projection differs from pinned raw details');
  assertThat(evidence.skillEndpoints.length === 54, 'SkillInfo endpoint presence population mismatch');
  assertThat(createHash('sha256').update(JSON.stringify(evidence.skillEndpoints)).digest('hex') === EXPECTED_ENDPOINT_PROJECTION, 'SkillInfo endpoint IDs/record locators differ from pinned projection');
  const endpoints = new Map(evidence.skillEndpoints.map(x=>[x.skillId,x]));
  assertThat(endpoints.size === 54, 'Duplicate or missing SkillInfo endpoint');
  for (const [i, c] of expected.entries()) {
    const e=evidence.skillEndpoints.find(x=>x.skillId===c.skillId);
    assertThat(e && e.recordLocator===`ConfigDataSkillInfo#ID=${c.skillId}` && e.sourceField==='ID' && e.identityAdmission==='NOT_INCLUDED' && Number.isInteger(e.recordIndex) && e.recordIndex>=0, `SkillInfo endpoint locator invalid: ${c.skillId}`);
    const canonicalRecord=canonical.records[i];
    same(canonicalRecord, {...c,evidenceProvenance:`${EVIDENCE}#claims/${i}`}, `Canonical locator/provenance mismatch at ${i}`);
  }
  assertThat(!JSON.stringify(canonical).match(/(acquired|equipped|activated|unlock|battleEffect|combatRule|publicationApproval)/i), 'Unapproved skill/gameplay/publication semantics added');
  return { locatorRelations:54, skillInfoEndpoints:54, regularFetters:45, heartFetter:9, skillIdentityAdmission:false, acquisitionSemantics:false, publication:false };
}

export async function validateHero15FetterSkillReferences(root=process.cwd()) {
  const read=async p=>JSON.parse(await readFile(resolve(root,p),'utf8'));
  const [evidence,canonical,fetterDetails,heartDetails]=await Promise.all([read(EVIDENCE),read(CANONICAL),read('canonical/hero-fetter-raw-details.v1.json'),read('canonical/hero-heart-fetter-raw-details.v1.json')]);
  const result=validateHero15FetterSkillReferencesData({evidence,canonical,fetterDetails,heartDetails});
  process.stdout.write('Hero 15 Fetter SkillInfo level locators: PASS (54 locators, exact endpoints, no acquisition semantics)\n');
  return result;
}
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) await validateHero15FetterSkillReferences();
