import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { validateSpSoldierBaseStats } from './validate-sp-soldier-base-stats.mjs';

const read=async p=>JSON.parse(await readFile(resolve(p),'utf8'));
const [soldiers,relations,stats,evidence,spSoldierInfo,manifest]=await Promise.all([
 read('canonical/soldiers.v1.json'),read('canonical/sp-soldier-normal-relations.v1.json'),
 read('canonical/sp-soldier-base-stats.v1.json'),
 read('evidence/source/configdata/ConfigDataSoldierInfo.records-sp-soldier-base-stats.v1.json'),
 read('evidence/source/configdata/ConfigDataSPSoldierInfo.records-all-sp-soldiers.v1.json'),
 read('evidence/source/configdata/sp-soldier-base-stats.source-manifest.v1.json')]);
const args={soldiers,relations,stats,evidence,spSoldierInfo,manifest};
const result=validateSpSoldierBaseStats(args);
assert.equal(result.spCount,56);

const changed=structuredClone(stats); changed.records[0].baseStats.hp++;
assert.throws(()=>validateSpSoldierBaseStats({...args,stats:changed}),/canonical hp mismatch/);
const missing=structuredClone(stats); delete missing.records[0].baseStats.attack;
assert.throws(()=>validateSpSoldierBaseStats({...args,stats:missing}),/canonical attack mismatch/);
const idMismatch=structuredClone(evidence); idMismatch.records[0].ID=999999;
assert.throws(()=>validateSpSoldierBaseStats({...args,evidence:idMismatch}),/evidence ID set differs/);
const commitMismatch=structuredClone(manifest); commitMismatch.source.commit='0000000000000000000000000000000000000000';
assert.throws(()=>validateSpSoldierBaseStats({...args,manifest:commitMismatch}),/source commit mismatch/);
const changedRelation=structuredClone(relations); changedRelation.records[0].normalSoldierId=999999;
assert.throws(()=>validateSpSoldierBaseStats({...args,relations:changedRelation}),/SP→NORMAL relations changed/);
process.stdout.write('SP Soldier base stats negatives: PASS (changed value; missing field; ID/evidence mismatch; source commit mismatch; relation endpoint mismatch)\\n');
