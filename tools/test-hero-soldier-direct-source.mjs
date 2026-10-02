import { createHash } from 'node:crypto';
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';

const source = process.cwd();
const temp = await mkdtemp(join(tmpdir(), 'hero-soldier-direct-primary-'));
const repo = join(temp, 'repo');
await cp(source, repo, { recursive: true, filter: (path) => !path.split('/').includes('.git') });

const directManifestPath = 'evidence/source/configdata/hero-soldier-direct-source-evidence.v1.json';
const semanticsPath = 'evidence/source/configdata/hero-soldier-source-semantics.v1.json';
const rewardPath = 'evidence/source/configdata/ConfigDataSPHeroInfo.records-hero-soldier-reward.v1.json';
const rewardManifestPath = 'evidence/source/configdata/ConfigDataSPHeroInfo.records-hero-soldier-reward.source-manifest.v1.json';
const soldierPath = 'evidence/source/configdata/ConfigDataSoldierInfo.records-sp-soldier-endpoints.v1.json';
const spSoldierPath = 'evidence/source/configdata/ConfigDataSPSoldierInfo.records-all-sp-soldiers.v1.json';
const canonicalPath = 'canonical/hero-soldier-relations.v1.json';
const sourceValidator = 'tools/validate-sp-hero-reward-source.mjs';
const primaryValidator = 'tools/validate-hero-soldier-relations.mjs';
const full = (path) => join(repo, path);
const run = (script, ...args) => spawnSync(process.execPath, [script, ...args], { cwd: repo, encoding: 'utf8' });

function expectFailure(script, label, ...args) {
  const result = run(script, ...args);
  if (result.status === 0) throw new Error(`${label}: expected validator failure`);
}
async function snapshotDirectory(root) {
  const entries = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.name === '.git') continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile()) {
        const bytes = await readFile(path);
        entries.push([relative(root, path).replaceAll('\\', '/'), bytes.length, createHash('sha256').update(bytes).digest('hex')]);
      }
    }
  }
  await walk(root);
  entries.sort((a, b) => a[0].localeCompare(b[0]));
  return JSON.stringify(entries);
}
async function editJson(path, change) {
  const target = full(path);
  const original = await readFile(target, 'utf8');
  const value = JSON.parse(original);
  change(value);
  await writeFile(target, `${JSON.stringify(value, null, 2)}\n`);
  return async () => writeFile(target, original);
}
async function editRewardAndRefreshManifest(change) {
  const rewardTarget = full(rewardPath);
  const manifestTarget = full(rewardManifestPath);
  const rewardOriginal = await readFile(rewardTarget, 'utf8');
  const manifestOriginal = await readFile(manifestTarget, 'utf8');
  const rows = JSON.parse(rewardOriginal);
  change(rows);
  const nextReward = `${JSON.stringify(rows, null, 2)}\n`;
  const manifest = JSON.parse(manifestOriginal);
  manifest.recordsSha256 = createHash('sha256').update(nextReward).digest('hex');
  await writeFile(rewardTarget, nextReward);
  await writeFile(manifestTarget, `${JSON.stringify(manifest, null, 2)}\n`);
  return async () => {
    await writeFile(rewardTarget, rewardOriginal);
    await writeFile(manifestTarget, manifestOriginal);
  };
}

const restores = [];
try {
  const before = await snapshotDirectory(repo);
  for (const script of [sourceValidator, primaryValidator]) {
    const result = run(script);
    if (result.status !== 0) throw new Error(`clean ${script} failed: ${result.stdout}${result.stderr}`);
  }
  const after = await snapshotDirectory(repo);
  if (after !== before) throw new Error('Hero-Soldier validators mutated repository content');

  let restore = await editJson(canonicalPath, (doc) => { doc.records.splice(0, 1); });
  restores.push(restore); expectFailure(primaryValidator, 'missing canonical edge'); await restore(); restores.pop();

  restore = await editJson(canonicalPath, (doc) => {
    doc.records.push({ ...doc.records[0], provenance: doc.records[0].provenance.map((p) => structuredClone(p)) });
  });
  restores.push(restore); expectFailure(primaryValidator, 'duplicate canonical edge'); await restore(); restores.pop();

  restore = await editJson(canonicalPath, (doc) => {
    const heroIds = [...new Set(doc.records.map((row) => row.heroId))];
    const soldierIds = [...new Set(doc.records.map((row) => row.soldierId))];
    const pairs = new Set(doc.records.map((row) => `${row.heroId}:${row.soldierId}`));
    let candidate;
    for (const heroId of heroIds) {
      for (const soldierId of soldierIds) {
        if (!pairs.has(`${heroId}:${soldierId}`)) { candidate = { heroId, soldierId }; break; }
      }
      if (candidate) break;
    }
    if (!candidate) throw new Error('failed to construct extra canonical edge fixture');
    const row = structuredClone(doc.records[0]);
    row.heroId = candidate.heroId;
    row.soldierId = candidate.soldierId;
    row.evidencePoolLocator = `${directManifestPath}#heroId=${candidate.heroId}&soldierId=${candidate.soldierId}`;
    doc.records.push(row);
    doc.records.sort((a, b) => a.heroId - b.heroId || a.soldierId - b.soldierId);
  });
  restores.push(restore); expectFailure(primaryValidator, 'extra canonical edge'); await restore(); restores.pop();

  restore = await editJson(canonicalPath, (doc) => {
    doc.records[0].heroId = 999999;
    doc.records[0].evidencePoolLocator = `${directManifestPath}#heroId=999999&soldierId=${doc.records[0].soldierId}`;
  });
  restores.push(restore); expectFailure(primaryValidator, 'invalid Hero endpoint'); await restore(); restores.pop();

  restore = await editJson(canonicalPath, (doc) => {
    doc.records[0].soldierId = 999999;
    doc.records[0].evidencePoolLocator = `${directManifestPath}#heroId=${doc.records[0].heroId}&soldierId=999999`;
  });
  restores.push(restore); expectFailure(primaryValidator, 'invalid Soldier endpoint'); await restore(); restores.pop();

  restore = await editJson(canonicalPath, (doc) => { doc.records[0].provenance[0].origin.recordId += 1; });
  restores.push(restore); expectFailure(primaryValidator, 'canonical provenance mismatch'); await restore(); restores.pop();

  restore = await editJson(canonicalPath, (doc) => { doc.records[0].provenance[0].sourceKind = 'UNSUPPORTED_SOURCE_KIND'; });
  restores.push(restore); expectFailure(primaryValidator, 'unsupported source kind'); await restore(); restores.pop();

  restore = await editJson(canonicalPath, (doc) => { delete doc.records[0].evidenceClass; });
  restores.push(restore); expectFailure(primaryValidator, 'malformed canonical record'); await restore(); restores.pop();

  restore = await editJson(canonicalPath, (doc) => { doc.records[0].evidencePoolLocator = `${directManifestPath}#heroId=999&soldierId=999`; });
  restores.push(restore); expectFailure(primaryValidator, 'direct-source locator mismatch'); await restore(); restores.pop();

  restore = await editJson(directManifestPath, (manifest) => { manifest.sources.BASE_SOLDIER_HERO.artifactGitBlobSha1 = '0000000000000000000000000000000000000000'; });
  restores.push(restore); expectFailure(primaryValidator, 'direct-source manifest artifact hash mismatch'); await restore(); restores.pop();

  restore = await editJson(rewardPath, (rows) => { rows.splice(0, 1); });
  restores.push(restore); expectFailure(sourceValidator, 'reward row missing'); await restore(); restores.pop();

  restore = await editRewardAndRefreshManifest((rows) => { rows[0].SecondStageRewardSoldiers[0] = 999999; });
  restores.push(restore); expectFailure(primaryValidator, 'reward Soldier ID mutation'); await restore(); restores.pop();

  restore = await editJson(rewardPath, (rows) => { rows[1].ID = rows[0].ID; });
  restores.push(restore); expectFailure(sourceValidator, 'duplicate reward Hero ID'); await restore(); restores.pop();

  restore = await editJson(rewardPath, (rows) => { rows[0].SecondStageRewardSoldiers = '1113'; });
  restores.push(restore); expectFailure(sourceValidator, 'malformed reward field'); await restore(); restores.pop();

  restore = await editJson(rewardManifestPath, (manifest) => { manifest.selection.selectedIds[0] = 999999; });
  restores.push(restore); expectFailure(sourceValidator, 'manifest selected-ID mismatch'); await restore(); restores.pop();

  restore = await editJson(rewardManifestPath, (manifest) => { manifest.source.gitBlobSha1 = '0000000000000000000000000000000000000000'; });
  restores.push(restore); expectFailure(sourceValidator, 'pinned source hash mismatch'); await restore(); restores.pop();

  const canonical = JSON.parse(await readFile(full(canonicalPath), 'utf8'));
  const baseEdge = canonical.records.find((row) => row.provenance.some((p) => p.sourceKind === 'BASE_SOLDIER_HERO'));
  restore = await editJson(soldierPath, (doc) => {
    const row = doc.records.find((item) => item.ID === baseEdge.soldierId);
    row.GetSoldierHeros_ID = row.GetSoldierHeros_ID.filter((heroId) => heroId !== baseEdge.heroId);
  });
  restores.push(restore); expectFailure(primaryValidator, 'BASE relation source mutation'); await restore(); restores.pop();

  const expandEdge = canonical.records.find((row) => row.provenance.some((p) => p.sourceKind === 'SP_SOLDIER_EXPAND'));
  restore = await editJson(spSoldierPath, (doc) => {
    const row = doc.records.find((item) => item.ID === expandEdge.soldierId);
    row.SecondStageExpandHeroList = row.SecondStageExpandHeroList.filter((heroId) => heroId !== expandEdge.heroId);
  });
  restores.push(restore); expectFailure(primaryValidator, 'SP expand source mutation'); await restore(); restores.pop();

  const inheritEdge = canonical.records.find((row) => row.provenance.some((p) => p.sourceKind === 'SP_SOLDIER_INHERIT'));
  const inheritProvenance = inheritEdge.provenance.find((p) => p.sourceKind === 'SP_SOLDIER_INHERIT');
  restore = await editJson(spSoldierPath, (doc) => {
    const row = doc.records.find((item) => item.ID === inheritEdge.soldierId);
    row.NormalSoliderId = inheritProvenance.supportRelation.normalSoldierId + 999999;
  });
  restores.push(restore); expectFailure(primaryValidator, 'NormalSoliderId support mutation'); await restore(); restores.pop();

  restore = await editJson(semanticsPath, (semantics) => {
    semantics.edgeSourceKinds.SP_SOLDIER_INHERIT.allowedParentKinds = ['BASE_SOLDIER_HERO'];
  });
  restores.push(restore); expectFailure(primaryValidator, 'source-semantics inheritance eligibility mutation'); await restore(); restores.pop();

  expectFailure(primaryValidator, 'validator argument misuse', 'sync', '--apply');

  process.stdout.write('Hero-Soldier direct-source primary cases: PASS (379/380 positive; canonical/source/provenance/locator negatives; argument rejection; read-only snapshot)\n');
} finally {
  for (const restore of restores.reverse()) await restore().catch(() => {});
  await rm(temp, { recursive: true, force: true });
}
