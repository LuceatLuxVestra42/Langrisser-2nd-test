import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const source = process.cwd();
const temp = await mkdtemp(join(tmpdir(), 'langrisser-hero-canonicals-'));
const repo = join(temp, 'repo');
await cp(source, repo, { recursive: true, filter: (path) => !path.split('/').includes('.git') });

function run() {
  return spawnSync(process.execPath, ['tools/validate-hero-semantic-canonicals.mjs'], { cwd: repo, encoding: 'utf8' });
}
function expectFailure(result, label) {
  if (result.status === 0) throw new Error(`${label}: expected validator failure`);
}
async function mutateAndExpectFailure(path, change, label) {
  const fullPath = join(repo, path);
  const original = await readFile(fullPath, 'utf8');
  try {
    const value = JSON.parse(original);
    change(value);
    await writeFile(fullPath, `${JSON.stringify(value, null, 2)}\n`);
    expectFailure(run(), label);
  } finally {
    await writeFile(fullPath, original);
  }
}

try {
  const baseline = run();
  if (baseline.status !== 0) throw new Error(`baseline canonical validation failed: ${baseline.stderr}`);
  if (!baseline.stdout.includes('267 playable identities; 43 relations; 18 selected-slice parity pairs')) throw new Error('baseline must retain 267 identities and exactly the existing 43/18 Hero→Job relation pairs');
  const relationPath = 'canonical/hero-job-relations.v1.json';
  const identityPath = 'canonical/hero-identities.v1.json';
  const identityEvidencePath = 'evidence/source/configdata/ConfigDataHeroInfo.records-playable-identity.v1.json';

  await mutateAndExpectFailure(identityEvidencePath, (doc) => { doc.records = doc.records.filter((row) => row.ID !== 1); }, 'playable identity source missing');
  await mutateAndExpectFailure(identityPath, (doc) => { doc.records.push({ heroId: 999999, provenance: identityEvidencePath + '#ID=999999' }); }, 'unexpected extra Hero ID');
  await mutateAndExpectFailure(identityPath, (doc) => { doc.records[1].heroId = doc.records[0].heroId; }, 'duplicate heroId');
  await mutateAndExpectFailure(identityPath, (doc) => { doc.records[0].heroId = 'not-an-id'; }, 'malformed Hero ID');
  await mutateAndExpectFailure(identityPath, (doc) => { doc.records[0].provenance = identityEvidencePath + '#ID=999'; }, 'provenance locator mismatch');
  await mutateAndExpectFailure(identityPath, (doc) => { doc.records[0].displayName = 'unexpected'; }, 'unsupported canonical field');
  await mutateAndExpectFailure(identityPath, (doc) => { delete doc.records[0].provenance; }, 'missing Hero identity provenance');
  await mutateAndExpectFailure(identityPath, (doc) => { doc.records = doc.records.filter((row) => row.heroId !== 1); }, 'missing playable Hero identity');

  await mutateAndExpectFailure(relationPath, (doc) => { doc.records[0].heroId = 999999; }, 'relation Hero absent from identity owner');
  await mutateAndExpectFailure(relationPath, (doc) => { doc.records[0].jobId = 999999; }, 'unsupported Job ID');
  await mutateAndExpectFailure(relationPath, (doc) => { doc.records[1] = { ...doc.records[0] }; }, 'duplicate Hero/Job pair');
  await mutateAndExpectFailure(relationPath, (doc) => { doc.records[0].jobId = 368; }, 'relation pair mutation');
  await mutateAndExpectFailure(relationPath, (doc) => { doc.records.push({ heroId: 15, jobId: 368, provenance: 'evidence/not-authorized.json#record=1' }); }, 'identity expansion must not expand Hero→Job relations');
  await mutateAndExpectFailure(relationPath, (doc) => { doc.records[0].provenance = 'evidence/wrong.json#record=1'; }, 'relation provenance mismatch');
  await mutateAndExpectFailure(relationPath, (doc) => { doc.records = doc.records.filter((row) => !(row.heroId === 5 && row.jobId === 817)); }, 'missing selected relation');
  await mutateAndExpectFailure(relationPath, (doc) => { doc.records = doc.records.filter((row) => !(row.heroId === 6 && row.jobId === 377)); }, 'missing SP relation');

  const selectedPath = 'canonical/heroes.v1.json';
  await mutateAndExpectFailure(selectedPath, (doc) => { doc.records[0].jobConnections[0].jobId = 999999; }, 'selected-slice parity mutation');

  const relationDoc = JSON.parse(await readFile(join(repo, relationPath), 'utf8'));
  for (const jobId of [1220, 20243, 20707]) {
    if (!relationDoc.records.some((row) => row.jobId === jobId)) throw new Error(`status-only Job ${jobId} missing from relation owner`);
  }
  const localizationPath = join(repo, 'canonical/job-localizations-ko.v1.json');
  const originalLocalization = await readFile(localizationPath, 'utf8');
  try {
    await writeFile(localizationPath, '{}\n');
    const independent = run();
    if (independent.status !== 0) throw new Error('Hero→Job canonical validation must not depend on Korean Job localization');
  } finally {
    await writeFile(localizationPath, originalLocalization);
  }

  process.stdout.write('Hero semantic canonical tests: PASS (playable identity source/canonical negatives, unchanged 43 Hero→Job pairs, selected-slice parity, status-only Jobs, localization independence)\n');
} finally {
  await rm(temp, { recursive: true, force: true });
}
