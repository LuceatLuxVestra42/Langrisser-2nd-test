import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const fail = (message) => { throw new Error(`SP Soldier relation validation failed: ${message}`); };
const check = (condition, message) => { if (!condition) fail(message); };

export function validateSpSoldierRelation({ soldiers, relations, soldierInfo, spSoldierInfo, manifest }) {
  check(soldiers.schemaVersion === 1 && Array.isArray(soldiers.records), 'Soldier canonical schema mismatch');
  const ids = soldiers.records.map((row) => row.id);
  check(ids.every(Number.isInteger), 'Soldier canonical contains malformed ID');
  check(new Set(ids).size === ids.length, 'duplicate Soldier identity ID');
  const normalRows = soldiers.records.filter((row) => row.entity === 'Soldier' && row.id === 115 && row.variant === 'NORMAL');
  check(normalRows.length === 1, 'NORMAL Soldier 115 canonical identity missing or duplicated');
  const spRows = soldiers.records.filter((row) => row.entity === 'Soldier' && row.id === 5115 && row.variant === 'SP');
  check(spRows.length === 1, 'SP Soldier 5115 canonical identity missing or duplicated');
  check(spRows[0].provenance === 'evidence/source/configdata/ConfigDataSoldierInfo.records-identity-115.v1.json#ID=5115', 'SP identity provenance mismatch');

  check(relations.schemaVersion === 1 && Array.isArray(relations.records), 'relation canonical schema mismatch');
  check(relations.records.length === 1, 'SP relation slice must contain exactly one relation');
  const relation = relations.records[0];
  check(relation.spSoldierId === 5115, 'canonical relation SP identity mismatch');
  check(relation.normalSoldierId === 115, 'canonical relation NORMAL target mismatch');
  check(relation.provenance === 'evidence/source/configdata/ConfigDataSPSoldierInfo.record-5115.v1.json#ID=5115/NormalSoliderId', 'canonical relation provenance mismatch');
  check(soldiers.records.some((row) => row.entity === 'Soldier' && row.id === relation.normalSoldierId && row.variant === 'NORMAL'), 'relation target is dangling');

  check(Array.isArray(soldierInfo.records), 'SoldierInfo evidence missing records');
  check(soldierInfo.records.filter((row) => row.ID === 5115).length === 1, 'SoldierInfo.ID=5115 exact endpoint missing or duplicated');
  check(soldierInfo.records.filter((row) => row.ID === 115).length === 1, 'SoldierInfo.ID=115 NORMAL endpoint missing or duplicated');
  check(Array.isArray(spSoldierInfo.records) && spSoldierInfo.records.length === 1, 'SPSoldierInfo evidence must contain exactly one record');
  const [source] = spSoldierInfo.records;
  check(source.ID === 5115, 'SPSoldierInfo.ID exact match failed');
  check(source.NormalSoliderId === 115, 'SPSoldierInfo.NormalSoliderId exact match failed');

  check(manifest.source?.repository === 'LuceatLuxVestra42/langrisser-future-guide', 'pinned source repository mismatch');
  check(manifest.source?.commit === '6475e63ee23d18adf733756c26a14fa9e3ed662c', 'pinned source commit mismatch');
  check(manifest.source?.sourceVersionStatus === 'unknown', 'source version must remain unknown');
  check(manifest.artifacts?.soldierInfo?.repoPreservedPath === 'evidence/source/configdata/ConfigDataSoldierInfo.records-identity-115.v1.json', 'SoldierInfo manifest locator mismatch');
  check(manifest.artifacts?.spSoldierInfo?.repoPreservedPath === 'evidence/source/configdata/ConfigDataSPSoldierInfo.record-5115.v1.json', 'SPSoldierInfo manifest locator mismatch');
  return { spSoldierId: 5115, normalSoldierId: 115 };
}

export async function loadAndValidateSpSoldierRelation(root = process.cwd()) {
  const read = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
  const [soldiers, relations, soldierInfo, spSoldierInfo, manifest] = await Promise.all([
    read('canonical/soldiers.v1.json'),
    read('canonical/sp-soldier-normal-relations.v1.json'),
    read('evidence/source/configdata/ConfigDataSoldierInfo.records-identity-115.v1.json'),
    read('evidence/source/configdata/ConfigDataSPSoldierInfo.record-5115.v1.json'),
    read('evidence/source/configdata/soldier-identity-115.source-manifest.v1.json'),
  ]);
  return validateSpSoldierRelation({ soldiers, relations, soldierInfo, spSoldierInfo, manifest });
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const result = await loadAndValidateSpSoldierRelation();
  process.stdout.write(`SP Soldier relation: PASS (${result.spSoldierId} → ${result.normalSoldierId})\\n`);
}
