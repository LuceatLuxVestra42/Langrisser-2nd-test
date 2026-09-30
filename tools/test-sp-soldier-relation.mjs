import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { validateSpSoldierRelation } from './validate-sp-soldier-relation.mjs';

const read = async (path) => JSON.parse(await readFile(resolve(path), 'utf8'));
const [soldiers, relations, soldierInfo, spSoldierInfo, manifest] = await Promise.all([
  read('canonical/soldiers.v1.json'),
  read('canonical/sp-soldier-normal-relations.v1.json'),
  read('evidence/source/configdata/ConfigDataSoldierInfo.records-identity-115.v1.json'),
  read('evidence/source/configdata/ConfigDataSPSoldierInfo.record-5115.v1.json'),
  read('evidence/source/configdata/soldier-identity-115.source-manifest.v1.json'),
]);
validateSpSoldierRelation({ soldiers, relations, soldierInfo, spSoldierInfo, manifest });

const wrongSp = structuredClone(spSoldierInfo);
wrongSp.records[0].ID = 5116;
assert.throws(() => validateSpSoldierRelation({ soldiers, relations, soldierInfo, spSoldierInfo: wrongSp, manifest }), /SPSoldierInfo.ID exact match failed/);

const wrongTarget = structuredClone(spSoldierInfo);
wrongTarget.records[0].NormalSoliderId = 116;
assert.throws(() => validateSpSoldierRelation({ soldiers, relations, soldierInfo, spSoldierInfo: wrongTarget, manifest }), /SPSoldierInfo.NormalSoliderId exact match failed/);

const dangling = structuredClone(soldiers);
dangling.records = dangling.records.filter((row) => !(row.id === 115 && row.variant === 'NORMAL'));
assert.throws(() => validateSpSoldierRelation({ soldiers: dangling, relations, soldierInfo, spSoldierInfo, manifest }), /NORMAL Soldier 115 canonical identity missing or duplicated/);

process.stdout.write('SP Soldier relation negative cases: PASS (SP ID mismatch; target mismatch; missing NORMAL endpoint rejected)\\n');
