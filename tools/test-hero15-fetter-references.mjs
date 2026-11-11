import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateHero15FetterReferencesData } from './validate-hero15-fetter-references.mjs';

const root = process.cwd();
const [evidence, canonical, heroIdentities] = await Promise.all([
  readFile(`${root}/evidence/source/bonds/hero15-fetter-references.v1.json`, 'utf8').then(JSON.parse),
  readFile(`${root}/canonical/hero-fetter-references.v1.json`, 'utf8').then(JSON.parse),
  readFile(`${root}/canonical/hero-identities.v1.json`, 'utf8').then(JSON.parse)
]);
const valid = () => validateHero15FetterReferencesData({ evidence: structuredClone(evidence), canonical: structuredClone(canonical), heroIdentities: structuredClone(heroIdentities) });
const rejects = (mutate, label) => {
  const e = structuredClone(evidence), c = structuredClone(canonical), h = structuredClone(heroIdentities);
  mutate(e, c, h);
  assert.throws(() => validateHero15FetterReferencesData({ evidence: e, canonical: c, heroIdentities: h }), undefined, label);
};
assert.deepEqual(valid(), { references: 6, heroFetter: 5, heroHeartFetter: 1, masteryClaims: 0, publicationClaims: 0 });
const controls = [
  [(e)=>{e.scope.heroId=8;},'rejects Hero scope mutation'],
  [(e)=>{e.source.commit='0'.repeat(40);},'rejects source commit mutation'],
  [(e)=>{e.source.tree='0'.repeat(40);},'rejects source tree mutation'],
  [(e)=>{e.source.heroInformationInfo.blobSha1='0'.repeat(40);},'rejects source blob mutation'],
  [(e)=>{e.source.heroInformationInfo.recordIndex++;},'rejects source locator mutation'],
  [(e)=>{e.source.heroInfo.fields.HeroInformation_ID=8;},'rejects Hero-to-information endpoint mutation'],
  [(e)=>{e.source.heroInformationInfo.fields.HeroFetters_ID[0]=65;},'rejects raw Fetter reference mutation'],
  [(e)=>{e.source.heroInformationInfo.fields.HeroHeartFetterId=14;},'rejects HeartFetter reference mutation'],
  [(e)=>{e.source.heroFetterInfo.endpoints.pop();},'rejects missing Fetter endpoint'],
  [(e)=>{e.source.heroFetterInfo.endpoints[0].recordIndex++;},'rejects endpoint locator mutation'],
  [(e)=>{e.source.heroFetterInfo.endpoints[0].id=67;},'rejects endpoint ID mismatch/duplicate'],
  [(e)=>{e.source.heroHeartFetterInfo.fields.ID=14;},'rejects missing HeartFetter endpoint'],
  [(e)=>{e.source.schemaMetadata.blobSha1='0'.repeat(40);},'rejects typed endpoint schema pin mutation'],
  [(_e,c)=>{c.records[0].heroId=8;},'rejects canonical Hero mutation'],
  [(_e,c)=>{c.records[0].fetterId=65;},'rejects canonical reference mutation'],
  [(_e,c)=>{c.records.pop();},'rejects missing canonical reference'],
  [(_e,c)=>{c.records.push(structuredClone(c.records[0]));},'rejects duplicate/extra canonical reference'],
  [(_e,c)=>{c.records[0].endpointNamespace='ConfigDataHeroHeartFetterInfo.ID';},'rejects endpoint namespace confusion'],
  [(_e,c)=>{c.records[0].provenance='wrong.json';},'rejects provenance mutation'],
  [(_e,c)=>{c.records[0].unlockCondition='approved';},'rejects unadmitted unlock semantics'],
  [(_e,c)=>{c.records[0].reward=[1];},'rejects unadmitted reward semantics'],
  [(_e,c)=>{c.records[0].battleEffect='approved';},'rejects unadmitted combat semantics'],
  [(e)=>{e.claims.heroFetterReferences.supportedMeaning='unlock condition';},'rejects raw-reference semantic escalation'],
  [(e)=>{e.extraction.sourceBytesCopied=true;},'rejects extraction boundary mutation']
];
for (const [mutate, label] of controls) rejects(mutate, label);
console.log(`Hero 15 Fetter reference negative controls: PASS (${controls.length})`);
