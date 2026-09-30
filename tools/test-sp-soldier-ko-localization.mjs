import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { validateSoldierIdentity } from './validate-soldier-identity.mjs';
import { validateSpSoldierRelation } from './validate-sp-soldier-relation.mjs';
import { validateSpSoldierBaseStats } from './validate-sp-soldier-base-stats.mjs';
import { validateSpSoldierKoLocalization } from './validate-sp-soldier-ko-localization.mjs';

const read=async p=>JSON.parse(await readFile(resolve(p),'utf8'));
const [soldiers,relations,canonical,evidence,manifest,rawSource,soldierInfo,stats,statEvidence,statManifest,spSoldierInfo,identityManifest]=await Promise.all([
 read('canonical/soldiers.v1.json'),read('canonical/sp-soldier-normal-relations.v1.json'),
 read('canonical/sp-soldier-localizations-ko.v1.json'),read('evidence/localization/sp-soldier-names-ko.v1.json'),
 read('evidence/localization/source/sp-soldier-names-ko.source-manifest.v1.json'),
 readFile(resolve('evidence/localization/source/sp-soldier-names-ko.v1.txt'),'utf8'),
 read('evidence/source/configdata/ConfigDataSoldierInfo.records-sp-soldier-endpoints.v1.json'),
 read('canonical/sp-soldier-base-stats.v1.json'),read('evidence/source/configdata/ConfigDataSoldierInfo.records-sp-soldier-base-stats.v1.json'),
 read('evidence/source/configdata/sp-soldier-base-stats.source-manifest.v1.json'),
 read('evidence/source/configdata/ConfigDataSPSoldierInfo.records-all-sp-soldiers.v1.json'),
 read('evidence/source/configdata/sp-soldier-population.source-manifest.v1.json')]);
const args={soldiers,relations,canonical,evidence,manifest,rawSource};
const valid=validateSpSoldierKoLocalization(args);
validateSoldierIdentity({canonical:soldiers,soldierInfo,spSoldierInfo,manifest:identityManifest});
validateSpSoldierRelation({soldiers,relations,soldierInfo,spSoldierInfo,manifest:identityManifest});
validateSpSoldierBaseStats({soldiers,relations,stats,evidence:statEvidence,spSoldierInfo,manifest:statManifest});
assert.equal(valid.localizedCount,56);
const mutatedName=structuredClone(canonical);mutatedName.records[0].nameKo+='x';assert.throws(()=>validateSpSoldierKoLocalization({...args,canonical:mutatedName}),/Korean display name mismatch/);
const changedId=structuredClone(canonical);changedId.records[0].soldierId=999999;assert.throws(()=>validateSpSoldierKoLocalization({...args,canonical:changedId}),/canonical localization ID set mismatch/);
const extra=structuredClone(canonical);extra.records.push({...extra.records[0],soldierId:999999});assert.throws(()=>validateSpSoldierKoLocalization({...args,canonical:extra}),/duplicate localization ID|localization coverage mismatch/);
const missing=structuredClone(canonical);missing.records.pop();assert.throws(()=>validateSpSoldierKoLocalization({...args,canonical:missing}),/localization coverage mismatch/);
const duplicate=structuredClone(canonical);duplicate.records.push({...duplicate.records[0]});assert.throws(()=>validateSpSoldierKoLocalization({...args,canonical:duplicate}),/duplicate localization ID/);
const badLocator=structuredClone(evidence);badLocator.records[0].sourceLocator='SPSoldierID=1';assert.throws(()=>validateSpSoldierKoLocalization({...args,evidence:badLocator}),/source locator key mismatch/);
const badAlias=structuredClone(manifest);badAlias.sourceSha256='0'.repeat(64);assert.throws(()=>validateSpSoldierKoLocalization({...args,manifest:badAlias}),/source provenance mismatch/);
process.stdout.write('SP Soldier KO localization negatives: PASS (changed name/ID; noncanonical ID; missing/duplicate row; bad source locator/hash)\\n');
