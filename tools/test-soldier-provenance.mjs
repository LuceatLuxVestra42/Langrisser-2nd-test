import assert from 'node:assert/strict';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { validateSoldierProvenance } from './validate-soldier-provenance.mjs';

const paths = [
  'canonical/soldiers.v1.json',
  'canonical/sp-soldier-normal-relations.v1.json',
  'canonical/sp-soldier-base-stats.v1.json',
  'canonical/sp-soldier-localizations-ko.v1.json',
  'evidence/source/configdata/ConfigDataSoldierInfo.records-identity-115.v1.json',
  'evidence/source/configdata/ConfigDataSPSoldierInfo.record-5115.v1.json',
  'evidence/source/configdata/ConfigDataSPSoldierInfo.records-all-sp-soldiers.v1.json',
  'evidence/source/configdata/ConfigDataSoldierInfo.records-sp-soldier-endpoints.v1.json',
  'evidence/source/configdata/ConfigDataSoldierInfo.records-sp-soldier-base-stats.v1.json',
  'evidence/source/configdata/soldier-identity-115.source-manifest.v1.json',
  'evidence/source/configdata/sp-soldier-population.source-manifest.v1.json',
  'evidence/source/configdata/sp-soldier-base-stats.source-manifest.v1.json',
];

const makeCopy = async () => {
  const root = await mkdtemp(resolve(tmpdir(), 'soldier-provenance-'));
  for (const path of paths) {
    const target = resolve(root, path);
    await mkdir(dirname(target), { recursive: true });
    await copyFile(resolve(path), target);
  }
  return root;
};
const editJson = async (root, path, edit) => {
  const full = resolve(root, path);
  const json = JSON.parse(await readFile(full, 'utf8'));
  edit(json);
  await writeFile(full, `${JSON.stringify(json, null, 2)}\n`);
};
const expectRejected = async (edit, pattern) => {
  const root = await makeCopy();
  try {
    await edit(root);
    await assert.rejects(validateSoldierProvenance(root), pattern);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
};

await validateSoldierProvenance();
await expectRejected(async root => {
  const { unlink } = await import('node:fs/promises');
  await unlink(resolve(root, 'evidence/source/configdata/ConfigDataSoldierInfo.records-identity-115.v1.json'));
}, /referenced evidence artifact missing/);
await expectRejected(root => editJson(root,
  'evidence/source/configdata/ConfigDataSPSoldierInfo.records-all-sp-soldiers.v1.json',
  json => { json.records.find(row => row.ID === 5115).NormalSoliderId = 114; }),
/preserved evidence SHA-256 mismatch/);
await expectRejected(root => editJson(root,
  'evidence/source/configdata/sp-soldier-population.source-manifest.v1.json',
  json => { json.artifacts.soldierInfoEndpoints.repoPreservedPath = '../missing.json'; }),
/endpoint artifact path mismatch/);
await expectRejected(root => editJson(root,
  'canonical/sp-soldier-normal-relations.v1.json',
  json => { json.records.find(row => row.spSoldierId === 5115).normalSoldierId = 114; }),
/relation NORMAL target is dangling|canonical relation set differs from explicit source fields/);

process.stdout.write('Soldier provenance negatives: PASS (missing historical artifact; changed preserved relation source; invalid manifest path; canonical endpoint mismatch)\\n');
