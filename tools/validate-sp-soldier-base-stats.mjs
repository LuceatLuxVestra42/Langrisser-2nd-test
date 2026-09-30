import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PINNED_COMMIT = '6475e63ee23d18adf733756c26a14fa9e3ed662c';
const FIELD_MAP = { HP_INI: 'hp', AT_INI: 'attack', DF_INI: 'defense', MagicDF_INI: 'magicDefense' };
const fail = (message) => { throw new Error(`SP Soldier base stats validation failed: ${message}`); };
const check = (condition, message) => { if (!condition) fail(message); };

export function validateSpSoldierBaseStats({ soldiers, relations, stats, evidence, spSoldierInfo, manifest }) {
  check(soldiers.schemaVersion === 1 && Array.isArray(soldiers.records), 'Soldier canonical schema mismatch');
  check(relations.schemaVersion === 1 && Array.isArray(relations.records), 'relation canonical schema mismatch');
  check(stats.schemaVersion === 1 && Array.isArray(stats.records), 'base stats canonical schema mismatch');
  check(Array.isArray(evidence.records), 'stat evidence missing');
  check(manifest.source?.repository === 'LuceatLuxVestra42/langrisser-future-guide', 'source repository mismatch');
  check(manifest.source?.commit === PINNED_COMMIT, 'source commit mismatch');
  check(manifest.source?.sourceVersionStatus === 'unknown', 'source version must remain unknown');
  check(manifest.artifact?.sourcePath === 'data/configdata/ConfigDataSoldierInfo.json', 'source path mismatch');
  check(manifest.artifact?.sourceGitBlobSha1 === '23649493c4d4c602e8d990db7bb5fade11747cc3', 'source blob mismatch');
  check(manifest.artifact?.sourceSha256 === '8a73b178be5b2f15ebcc84e83741d42e242ea4650f1d590fb2c1bcee8b8bbcc4', 'source hash mismatch');
  check(manifest.artifact?.preservedPath === 'evidence/source/configdata/ConfigDataSoldierInfo.records-sp-soldier-base-stats.v1.json', 'evidence path mismatch');
  check(JSON.stringify(manifest.artifact?.selectedFields) === JSON.stringify(['ID','HP_INI','AT_INI','DF_INI','MagicDF_INI']), 'field scope mismatch');

  const sourceSpIds = spSoldierInfo.records.map(r => r.ID).sort((a,b) => a-b);
  check(sourceSpIds.length === 56 && new Set(sourceSpIds).size === 56, 'SP source identity set malformed');
  const canonicalSpIds = soldiers.records.filter(r => r.entity === 'Soldier' && r.variant === 'SP').map(r => r.id).sort((a,b) => a-b);
  check(JSON.stringify(canonicalSpIds) === JSON.stringify(sourceSpIds), 'canonical SP identity set changed');
  const normalCanonical = new Set(soldiers.records.filter(r => r.entity === 'Soldier' && r.variant === 'NORMAL').map(r => r.id));
  const targetIds = spSoldierInfo.records.map(r => r.NormalSoliderId);
  check(targetIds.every(id => normalCanonical.has(id)) && normalCanonical.size === 56, 'NORMAL identity endpoints changed');
  const expectedRelations = new Set(spSoldierInfo.records.map(r => `${r.ID}:${r.NormalSoliderId}`));
  const actualRelations = new Set(relations.records.map(r => `${r.spSoldierId}:${r.normalSoldierId}`));
  check(expectedRelations.size === 56 && actualRelations.size === 56 && [...expectedRelations].every(k => actualRelations.has(k)), 'SP→NORMAL relations changed');
  check(relations.records.find(r => r.spSoldierId === 5115)?.normalSoldierId === 115, '5115 → 115 regression missing');

  const evidenceById = new Map();
  for (const row of evidence.records) {
    check(Number.isInteger(row.ID), 'evidence ID malformed');
    check(!evidenceById.has(row.ID), `duplicate evidence ID ${row.ID}`);
    evidenceById.set(row.ID, row);
  }
  check(JSON.stringify([...evidenceById.keys()].sort((a,b)=>a-b)) === JSON.stringify(sourceSpIds), 'evidence ID set differs from admitted SP population');
  const statsById = new Map();
  for (const row of stats.records) {
    check(row?.entity === 'Soldier' && row.variant === 'SP' && Number.isInteger(row.id), 'canonical stat identity malformed');
    check(!statsById.has(row.id), `duplicate canonical SP stats ${row.id}`);
    statsById.set(row.id, row);
  }
  check(JSON.stringify([...statsById.keys()].sort((a,b)=>a-b)) === JSON.stringify(sourceSpIds), 'canonical stat ID set mismatch');
  for (const id of sourceSpIds) {
    const raw=evidenceById.get(id), record=statsById.get(id);
    for (const [field, target] of Object.entries(FIELD_MAP)) {
      check(Object.hasOwn(raw,field) && typeof raw[field] === 'number' && Number.isFinite(raw[field]), `missing/malformed ${field} for ${id}`);
      check(Object.hasOwn(record.baseStats ?? {},target) && record.baseStats[target] === raw[field], `canonical ${target} mismatch for ${id}`);
    }
    check(record.provenance === `evidence/source/configdata/ConfigDataSoldierInfo.records-sp-soldier-base-stats.v1.json#ID=${id}`, `provenance mismatch for ${id}`);
  }
  check(evidence.records.length === 56 && stats.records.length === 56, 'SP population count mismatch');
  check(manifest.admittedSpIds?.length === 56 && manifest.admittedSpIds.every((id,i)=>id===sourceSpIds[i]), 'manifest SP selection mismatch');
  return { spCount: sourceSpIds.length, fieldCoverage: Object.fromEntries(Object.keys(FIELD_MAP).map(f=>[f,sourceSpIds.length])) };
}

export async function loadAndValidateSpSoldierBaseStats(root=process.cwd()) {
 const read=async p=>JSON.parse(await readFile(resolve(root,p),'utf8'));
 const [soldiers,relations,stats,evidence,spSoldierInfo,manifest]=await Promise.all([
  read('canonical/soldiers.v1.json'),read('canonical/sp-soldier-normal-relations.v1.json'),
  read('canonical/sp-soldier-base-stats.v1.json'),
  read('evidence/source/configdata/ConfigDataSoldierInfo.records-sp-soldier-base-stats.v1.json'),
  read('evidence/source/configdata/ConfigDataSPSoldierInfo.records-all-sp-soldiers.v1.json'),
  read('evidence/source/configdata/sp-soldier-base-stats.source-manifest.v1.json')]);
 return validateSpSoldierBaseStats({soldiers,relations,stats,evidence,spSoldierInfo,manifest});
}
if(process.argv[1] && pathToFileURL(resolve(process.argv[1])).href===import.meta.url) {
 const result=await loadAndValidateSpSoldierBaseStats();
 process.stdout.write(`SP Soldier base stats: PASS (${result.spCount} identities; 4 fields each)\\n`);
}