import { lanceEvidencePath, validateLanceDirectRelations } from './validate-hero-soldier-relations.mjs';
import assert from 'node:assert/strict';
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
const hero15SpAdmissionPath = 'evidence/source/configdata/hero-soldier-sp-inheritance-hero15.v1.json';
const hero15DirectAdmissionPath = 'evidence/source/configdata/hero-soldier-normal-direct-hero15.v1.json';
const sourceValidator = 'tools/validate-sp-hero-reward-source.mjs';
const primaryValidator = 'tools/validate-hero-soldier-relations.mjs';
const full = (path) => join(repo, path);
const run = (script, ...args) => spawnSync(process.execPath, [script, ...args], { cwd: repo, encoding: 'utf8' });

function assertExecution(result, label) {
  if (result.error !== undefined && result.error !== null) {
    throw new Error(`${label}: validator process spawn failed: ${result.error.message}`);
  }
  if (result.signal !== null) {
    throw new Error(`${label}: validator process terminated by signal ${result.signal}`);
  }
  if (!Number.isInteger(result.status)) {
    throw new Error(`${label}: validator process did not return an integer exit status`);
  }
}

function expectFailureResult(result, label, expectedDiagnostic) {
  assertExecution(result, label);
  if (result.status === 0) throw new Error(`${label}: expected validator rejection`);
  const diagnostic = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
  if (!expectedDiagnostic.test(diagnostic)) {
    throw new Error(`${label}: expected diagnostic ${expectedDiagnostic}; received:\n${diagnostic}`);
  }
}

function expectSuccess(result, label, expectedDiagnostic) {
  assertExecution(result, label);
  if (result.status !== 0) throw new Error(`${label}: expected validator success; received:\n${result.stdout ?? ''}\n${result.stderr ?? ''}`);
  const diagnostic = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
  if (!expectedDiagnostic.test(diagnostic)) {
    throw new Error(`${label}: expected success diagnostic ${expectedDiagnostic}; received:\n${diagnostic}`);
  }
}

function testExpectFailureIntegrity() {
  const targetDiagnostic = /TARGET_REJECTION_FIXTURE/;
  expectFailure({
    error: undefined, signal: null, status: 1, stdout: '',
    stderr: 'TARGET_REJECTION_FIXTURE',
  }, 'helper target-rejection fixture', targetDiagnostic);
  assert.throws(() => expectFailure({
    error: Object.assign(new Error('missing executable'), { code: 'ENOENT' }),
    signal: null, status: null, stdout: '', stderr: '',
  }, 'helper spawn-error fixture', targetDiagnostic), /spawn failed/);
  assert.throws(() => expectFailure({
    error: undefined, signal: 'SIGTERM', status: null, stdout: '', stderr: '',
  }, 'helper signal fixture', targetDiagnostic), /terminated by signal/);
  assert.throws(() => expectFailure({
    error: undefined, signal: null, status: null, stdout: '', stderr: '',
  }, 'helper missing-status fixture', targetDiagnostic), /integer exit status/);
  assert.throws(() => expectFailure({
    error: undefined, signal: null, status: 0, stdout: '',
    stderr: 'TARGET_REJECTION_FIXTURE',
  }, 'helper zero-status fixture', targetDiagnostic), /expected validator rejection/);
  assert.throws(() => expectFailure({
    error: undefined, signal: null, status: 1, stdout: '',
    stderr: 'unrelated validation failed',
  }, 'helper unrelated-diagnostic fixture', targetDiagnostic), /expected diagnostic/);
}


function expectFailure(script, label, expectedDiagnostic, ...args) {
  if (typeof script !== 'string') {
    return expectFailureResult(script, label, expectedDiagnostic);
  }
  expectFailureResult(run(script, ...args), label, expectedDiagnostic);
}

testExpectFailureIntegrity();
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
  expectSuccess(run(sourceValidator), 'clean SP Hero reward source validator', /SP Hero reward source evidence: PASS/);
  expectSuccess(run(primaryValidator), 'clean Hero-Soldier relation validator', /401 admitted relations; 402 admitted provenance; 7 Hero 15 SP inherited admissions; 0 deferred Hero 15 SP candidates/);
  const after = await snapshotDirectory(repo);
  if (after !== before) throw new Error('Hero-Soldier validators mutated repository content');

  // The normal validator above authenticated both source artifacts. Exercise its actual
  // relation boundary with fresh copies so these tests cannot pass on file hash errors.
  const readDocument = async path => JSON.parse(await readFile(full(path), 'utf8'));
  const inputs = {
    records: (await readDocument(canonicalPath)).records,
    evidence: await readDocument(lanceEvidencePath),
    retained: (await readDocument(soldierPath)).records,
    identities: (await readDocument('canonical/soldiers.v1.json')).records,
    names: (await readDocument('canonical/normal-soldier-localizations-ko.v1.json')).records,
  };
  const verify = ({records, evidence, retained, identities, names}) =>
    validateLanceDirectRelations(records, evidence, retained, identities, names);
  const lanceRow = (doc, id) => doc.records.find(row => row.heroId === 16 && row.soldierId === id);
  assert.equal(verify(inputs).length, 5);
  for (const [mutate, diagnostic] of [
    [doc => {
      const claims = doc.evidence.records.map(row => row.claim);
      const first = claims.find(row => row.soldierId === 419);
      const second = claims.find(row => row.soldierId === 402);
      [first.fieldLocator, second.fieldLocator] = [second.fieldLocator, first.fieldLocator];
    }, /original field locator for 16:402/],
    [doc => { doc.retained.find(row => row.ID === 115).GetSoldierHeros_ID[4] = 15; }, /Soldier 115 must reference Hero 16/],
    [doc => { lanceRow(doc, 115).evidenceClass = 'B'; }, /A-class direct relation required for 16:115/],
    [doc => { lanceRow(doc, 419).provenance[0].origin.recordId = 402; }, /single direct Soldier provenance for 16:419/],
    [doc => { doc.identities.find(row => row.id === 115).variant = 'SP'; }, /NORMAL identity for 16:115/],
    ...[5115, 422].map(id => [doc => { lanceRow(doc, 115).soldierId = id; }, /exactly five approved NORMAL direct relation keys/]),
    [doc => {
      const inherited = structuredClone(doc.records.find(row => row.soldierId === 5115
        && row.provenance.some(item => item.sourceKind === 'SP_SOLDIER_INHERIT')));
      inherited.heroId = 16;
      inherited.evidencePoolLocator = directManifestPath + '#heroId=16&soldierId=5115';
      inherited.provenance[0].parentEdge.heroId = 16;
      doc.records.push(inherited);
    }, /exactly five approved NORMAL direct relation keys/],
  ]) {
    const copy = structuredClone(inputs);
    mutate(copy);
    assert.throws(() => verify(copy), diagnostic);
  }
  const prior = inputs.records.find(row => row.soldierId === 115 && row.heroId !== 16);
  const restorePrior = await editJson(canonicalPath, doc => {
    const row = doc.records.find(row => row.heroId === prior.heroId && row.soldierId === 115);
    row.provenance[0].origin.recordId = 324;
  });
  restores.push(restorePrior);
  expectFailure(primaryValidator, 'other Hero with same NORMAL Soldier changed',
    new RegExp('#347 preserved provenance mismatches: ' + prior.heroId + ':115'));
  await restorePrior(); restores.pop();

  const scopedSource = JSON.parse(await readFile(full(hero15DirectAdmissionPath), 'utf8'));
  for (const [heroId, soldierId, elementIndex] of [[13, 806, 0], [4, 817, 0], [4, 819, 0], [29, 817, 3], [29, 819, 2]]) {
    const sourceRow = scopedSource.records.find(row => row.rawFields.ID === soldierId);
    assert.equal(sourceRow.rawFields.GetSoldierHeros_ID[elementIndex], heroId);
    const restore = await editJson(canonicalPath, doc => {
      const row = doc.records.find(row => row.heroId === 15 && row.soldierId === soldierId);
      row.heroId = heroId;
      row.evidenceClass = 'B';
      row.evidencePoolLocator = `${directManifestPath}#heroId=${heroId}&soldierId=${soldierId}`;
      doc.records.sort((a, b) => a.heroId - b.heroId || a.soldierId - b.soldierId);
      assert.equal(doc.records.length, 401);
    });
    restores.push(restore);
    expectFailure(primaryValidator, `unapproved source relationship ${heroId}:${soldierId}`,
      new RegExp(`outside approved Hero 15 NORMAL relation keys: ${heroId}:${soldierId}`));
    await restore(); restores.pop();
  }

  for (const [label, mutate] of [
    ['wrong source ID', doc => { doc.records[0].rawFields.ID = 115; }],
    ['wrong element locator and forged in-file hash', doc => {
      doc.records[0].claim.fieldLocator = '/161/GetSoldierHeros_ID/0';
      doc.sha256 = createHash('sha256').update(JSON.stringify(doc)).digest('hex');
    }],
    ['missing approved evidence', doc => { doc.records.pop(); }],
    ['duplicated approved evidence', doc => { doc.records[1] = structuredClone(doc.records[0]); }],
    ['non-approved evidence', doc => { doc.records[0].claim.heroId = 13; }],
    ['truncated source array', doc => { doc.records[0].rawFields.GetSoldierHeros_ID = [13, 15]; }],
  ]) {
    const restore = await editJson(hero15DirectAdmissionPath, mutate);
    restores.push(restore);
    expectFailure(primaryValidator, label, /Hero 15 NORMAL direct admission evidence SHA-256 mismatch/);
    await restore(); restores.pop();
  }

  let restore = await editJson(canonicalPath, doc => {
    doc.records = doc.records.filter(row => !(row.heroId === 15 && row.soldierId === 806));
  });
  restores.push(restore);
  expectFailure(primaryValidator, 'missing scoped NORMAL pair', /Hero 15 Canonical NORMAL admission set drift/);
  await restore(); restores.pop();

  restore = await editJson(canonicalPath, (doc) => {
    doc.records = doc.records.filter((row) => !(row.heroId === 15 && row.soldierId === 210));
  });
  restores.push(restore); expectFailure(primaryValidator, 'missing Hero 15 NORMAL admission', /approved NORMAL parent or explicit SP_FORM_LINK/); await restore(); restores.pop();

  restore = await editJson(canonicalPath, (doc) => {
    const row = structuredClone(doc.records.find((item) => item.heroId === 15 && item.soldierId === 5210));
    row.soldierId = 5216;
    row.evidencePoolLocator = `${directManifestPath}#heroId=15&soldierId=5216`;
    row.provenance[0].origin.recordId = 216;
    row.provenance[0].parentEdge.soldierId = 216;
    row.provenance[0].supportRelation.recordId = 5216;
    row.provenance[0].supportRelation.normalSoldierId = 216;
    row.provenance[0].supportRelation.spSoldierId = 5216;
    doc.records.push(row);
    doc.records.sort((a, b) => a.heroId - b.heroId || a.soldierId - b.soldierId);
  });
  restores.push(restore); expectFailure(primaryValidator, 'unapproved Hero 15 SP inheritance admission', /Hero 15 Canonical SP admission set drift/); await restore(); restores.pop();

  restore = await editJson(canonicalPath, (doc) => {
    doc.records = doc.records.filter((row) => !(row.heroId === 15 && row.soldierId === 5210));
  });
  restores.push(restore); expectFailure(primaryValidator, 'missing Hero 15 SP inherited admission', /Hero 15 SP canonical admission or complete parent\/support provenance drift/); await restore(); restores.pop();

  restore = await editJson(canonicalPath, (doc) => {
    const row = doc.records.find((item) => item.heroId === 15 && item.soldierId === 5210);
    row.evidenceClass = 'A';
  });
  restores.push(restore); expectFailure(primaryValidator, 'SP derived evidence promoted to direct A class', /A-class canonical pair 15:5210 is outside the approved NORMAL direct-source slice/); await restore(); restores.pop();

  restore = await editJson(canonicalPath, (doc) => {
    const row = doc.records.find((item) => item.heroId === 15 && item.soldierId === 5210);
    row.provenance[0].supportRelation.normalSoldierId = 326;
  });
  restores.push(restore); expectFailure(primaryValidator, 'SP_FORM_LINK support endpoint mismatch', /complete parent\/support provenance drift: 15:5210/); await restore(); restores.pop();

  restore = await editJson(hero15SpAdmissionPath, (doc) => {
    doc.records = doc.records.filter((row) => row.spSoldierId !== 5210);
  });
  restores.push(restore); expectFailure(primaryValidator, 'missing claim-scoped SP admission evidence', /Hero 15 SP inherited evidence claim set drift/); await restore(); restores.pop();

  restore = await editJson(canonicalPath, (doc) => {
    doc.records.push({
      heroId: 15, soldierId: 216, evidenceClass: 'A',
      evidencePoolLocator: `${directManifestPath}#heroId=15&soldierId=216`,
      provenance: [{ sourceKind: 'BASE_SOLDIER_HERO', sourceClass: 'DIRECT', origin: { table: 'ConfigDataSoldierInfo', recordId: 216, recordKeyField: 'ID', field: 'GetSoldierHeros_ID' } }],
    });
    doc.records.sort((a, b) => a.heroId - b.heroId || a.soldierId - b.soldierId);
  });
  restores.push(restore); expectFailure(primaryValidator, 'NORMAL relation absent from direct source', /Hero 15 Canonical NORMAL admission set drift/); await restore(); restores.pop();

  restore = await editJson(canonicalPath, (doc) => { doc.records.splice(0, 1); });
  restores.push(restore); expectFailure(primaryValidator, 'missing canonical edge', /extra direct-source edges within current admitted target: 1:210/); await restore(); restores.pop();

  restore = await editJson(canonicalPath, (doc) => {
    doc.records.push({ ...doc.records[0], provenance: doc.records[0].provenance.map((p) => structuredClone(p)) });
  });
  restores.push(restore); expectFailure(primaryValidator, 'duplicate canonical edge', /duplicate canonical pair/); await restore(); restores.pop();

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
  restores.push(restore); expectFailure(primaryValidator, 'extra canonical edge', /missing canonical-supported edges: 1:121/); await restore(); restores.pop();

  restore = await editJson(canonicalPath, (doc) => {
    doc.records[0].heroId = 999999;
    doc.records[0].evidencePoolLocator = `${directManifestPath}#heroId=999999&soldierId=${doc.records[0].soldierId}`;
  });
  restores.push(restore); expectFailure(primaryValidator, 'invalid Hero endpoint', /canonical pair 999999:\d+ references missing Hero endpoint/); await restore(); restores.pop();

  restore = await editJson(canonicalPath, (doc) => {
    doc.records[0].soldierId = 999999;
    doc.records[0].evidencePoolLocator = `${directManifestPath}#heroId=${doc.records[0].heroId}&soldierId=999999`;
  });
  restores.push(restore); expectFailure(primaryValidator, 'invalid Soldier endpoint', /canonical pair \d+:999999 references missing Soldier endpoint/); await restore(); restores.pop();

  restore = await editJson(canonicalPath, (doc) => { doc.records[0].provenance[0].origin.recordId += 1; });
  restores.push(restore); expectFailure(primaryValidator, 'canonical provenance mismatch', /provenance mismatches:/); await restore(); restores.pop();

  restore = await editJson(canonicalPath, (doc) => { doc.records[0].provenance[0].sourceKind = 'UNSUPPORTED_SOURCE_KIND'; });
  restores.push(restore); expectFailure(primaryValidator, 'unsupported source kind', /provenance mismatches:/); await restore(); restores.pop();

  restore = await editJson(canonicalPath, (doc) => { delete doc.records[0].evidenceClass; });
  restores.push(restore); expectFailure(primaryValidator, 'malformed canonical record', /canonical Hero-Soldier 1:210 has unexpected or missing fields/); await restore(); restores.pop();

  restore = await editJson(canonicalPath, (doc) => { doc.records[0].evidencePoolLocator = `${directManifestPath}#heroId=999&soldierId=999`; });
  restores.push(restore); expectFailure(primaryValidator, 'direct-source locator mismatch', /direct-source evidence locator drift/); await restore(); restores.pop();

  restore = await editJson(directManifestPath, (manifest) => { manifest.sources.BASE_SOLDIER_HERO.artifactGitBlobSha1 = '0000000000000000000000000000000000000000'; });
  restores.push(restore); expectFailure(primaryValidator, 'direct-source manifest artifact hash mismatch', /direct-source artifact\/provenance mapping drift/); await restore(); restores.pop();

  restore = await editRewardAndRefreshManifest((rows) => { rows.splice(0, 1); });
  restores.push(restore); expectFailure(sourceValidator, 'reward row missing', /preserved reward source must contain exactly five source rows/); await restore(); restores.pop();

  restore = await editRewardAndRefreshManifest((rows) => { rows[0].SecondStageRewardSoldiers[0] = 999999; });
  restores.push(restore); expectFailure(primaryValidator, 'reward Soldier ID mutation', /missing canonical-supported edges: 60:1113, 60:6113/); await restore(); restores.pop();

  restore = await editRewardAndRefreshManifest((rows) => { rows[1].ID = rows[0].ID; });
  restores.push(restore); expectFailure(sourceValidator, 'duplicate reward Hero ID', /duplicate reward source Hero ID/); await restore(); restores.pop();

  restore = await editRewardAndRefreshManifest((rows) => { rows[0].SecondStageRewardSoldiers = '1113'; });
  restores.push(restore); expectFailure(sourceValidator, 'malformed reward field', /has malformed SecondStageRewardSoldiers/); await restore(); restores.pop();

  restore = await editJson(rewardManifestPath, (manifest) => { manifest.selection.selectedIds[0] = 999999; });
  restores.push(restore); expectFailure(sourceValidator, 'manifest selected-ID mismatch', /selected source IDs mismatch/); await restore(); restores.pop();

  restore = await editJson(rewardManifestPath, (manifest) => { manifest.source.gitBlobSha1 = '0000000000000000000000000000000000000000'; });
  restores.push(restore); expectFailure(sourceValidator, 'pinned source hash mismatch', /pinned source Git blob mismatch/); await restore(); restores.pop();

  const canonical = JSON.parse(await readFile(full(canonicalPath), 'utf8'));
  const baseEdge = canonical.records.find((row) => row.provenance.some((p) => p.sourceKind === 'BASE_SOLDIER_HERO'));
  restore = await editJson(soldierPath, (doc) => {
    const row = doc.records.find((item) => item.ID === baseEdge.soldierId);
    row.GetSoldierHeros_ID = row.GetSoldierHeros_ID.filter((heroId) => heroId !== baseEdge.heroId);
  });
  restores.push(restore); expectFailure(primaryValidator, 'BASE relation source mutation', /preserved SoldierInfo artifact bytes drift/); await restore(); restores.pop();

  const expandEdge = canonical.records.find((row) => row.provenance.some((p) => p.sourceKind === 'SP_SOLDIER_EXPAND'));
  restore = await editJson(spSoldierPath, (doc) => {
    const row = doc.records.find((item) => item.ID === expandEdge.soldierId);
    row.SecondStageExpandHeroList = row.SecondStageExpandHeroList.filter((heroId) => heroId !== expandEdge.heroId);
  });
  restores.push(restore); expectFailure(primaryValidator, 'SP expand source mutation', /preserved SPSoldierInfo artifact bytes drift/); await restore(); restores.pop();

  const inheritEdge = canonical.records.find((row) => row.provenance.some((p) => p.sourceKind === 'SP_SOLDIER_INHERIT'));
  const inheritProvenance = inheritEdge.provenance.find((p) => p.sourceKind === 'SP_SOLDIER_INHERIT');
  restore = await editJson(spSoldierPath, (doc) => {
    const row = doc.records.find((item) => item.ID === inheritEdge.soldierId);
    row.NormalSoliderId = inheritProvenance.supportRelation.normalSoldierId + 999999;
  });
  restores.push(restore); expectFailure(primaryValidator, 'NormalSoliderId support mutation', /preserved SPSoldierInfo artifact bytes drift/); await restore(); restores.pop();

  restore = await editJson(semanticsPath, (semantics) => {
    semantics.edgeSourceKinds.SP_SOLDIER_INHERIT.allowedParentKinds = ['BASE_SOLDIER_HERO'];
  });
  restores.push(restore); expectFailure(primaryValidator, 'source-semantics inheritance eligibility mutation', /SP inheritance\/support semantics drift/); await restore(); restores.pop();

  expectFailure(primaryValidator, 'validator argument misuse', /Usage: node tools\/validate-hero-soldier-relations\.mjs/, 'sync', '--apply');

  process.stdout.write('Hero-Soldier direct-source primary cases: PASS (canonical/source/provenance/locator negatives; argument rejection; read-only snapshot)\n');
} finally {
  for (const restore of restores.reverse()) await restore().catch(() => {});
  await rm(temp, { recursive: true, force: true });
}
