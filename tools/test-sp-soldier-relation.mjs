import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { validateSoldierIdentity } from './validate-soldier-identity.mjs';
import { validateSpSoldierRelation } from './validate-sp-soldier-relation.mjs';

const read = async (path) => JSON.parse(await readFile(resolve(path), 'utf8'));
const [soldiers, relations, soldierInfo, spSoldierInfo, manifest] = await Promise.all([
  read('canonical/soldiers.v1.json'),
  read('canonical/sp-soldier-normal-relations.v1.json'),
  read('evidence/source/configdata/ConfigDataSoldierInfo.records-sp-soldier-endpoints.v1.json'),
  read('evidence/source/configdata/ConfigDataSPSoldierInfo.records-all-sp-soldiers.v1.json'),
  read('evidence/source/configdata/sp-soldier-population.source-manifest.v1.json'),
]);
validateSoldierIdentity({ canonical: soldiers, soldierInfo, spSoldierInfo, manifest });
validateSpSoldierRelation({ soldiers, relations, soldierInfo, spSoldierInfo, manifest });
assert.equal(relations.records.find(row => row.spSoldierId === 5115)?.normalSoldierId, 115);

const missingSp = structuredClone(soldiers);
missingSp.records = missingSp.records.filter(row => !(row.variant === 'SP' && row.id === 5203));
assert.throws(() => validateSoldierIdentity({ canonical: missingSp, soldierInfo, spSoldierInfo, manifest }), /canonical identity set differs/);

const extraSp = structuredClone(soldiers);
extraSp.records.push({ entity: 'Soldier', id: 9999, variant: 'SP', provenance: 'unsupported' });
assert.throws(() => validateSoldierIdentity({ canonical: extraSp, soldierInfo, spSoldierInfo, manifest }), /not source-derived/);

const changedTarget = structuredClone(relations);
changedTarget.records.find(row => row.spSoldierId === 5203).normalSoldierId = 115;
assert.throws(() => validateSpSoldierRelation({ soldiers, relations: changedTarget, soldierInfo, spSoldierInfo, manifest }), /canonical relation set differs/);

const missingNormal = structuredClone(soldiers);
missingNormal.records = missingNormal.records.filter(row => !(row.variant === 'NORMAL' && row.id === 115));
assert.throws(() => validateSpSoldierRelation({ soldiers: missingNormal, relations, soldierInfo, spSoldierInfo, manifest }), /NORMAL target canonical identity missing/);

const duplicateRelation = structuredClone(relations);
duplicateRelation.records.push({ ...duplicateRelation.records[1] });
assert.throws(() => validateSpSoldierRelation({ soldiers, relations: duplicateRelation, soldierInfo, spSoldierInfo, manifest }), /duplicate\/conflicting canonical relation/);

const conflictingRelation = structuredClone(relations);
conflictingRelation.records.push({ spSoldierId: 5203, normalSoldierId: 203, provenance: 'test' });
assert.throws(() => validateSpSoldierRelation({ soldiers, relations: conflictingRelation, soldierInfo, spSoldierInfo, manifest }), /duplicate\/conflicting canonical relation/);

const changedCommit = structuredClone(manifest);
changedCommit.source.commit = '0000000000000000000000000000000000000000';
assert.throws(() => validateSpSoldierRelation({ soldiers, relations, soldierInfo, spSoldierInfo, manifest: changedCommit }), /source commit mismatch/);
process.stdout.write('SP Soldier population negative cases: PASS (missing/extra SP; changed target; missing NORMAL; duplicate/conflict; commit mismatch)\\n');
