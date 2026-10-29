import assert from 'node:assert/strict';
import { readFile, mkdtemp, mkdir, rm, writeFile, symlink, copyFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildSite, publicSitePaths, validatePublicSiteDirectory } from './build.mjs';
import { TRAINING_TECH_DECISION_RECORD_PATH } from './soldier-training-tech-presentation-contract.mjs';

const heroes = JSON.parse(await readFile('canonical/heroes.v1.json', 'utf8'));
const decision = JSON.parse(await readFile(TRAINING_TECH_DECISION_RECORD_PATH, 'utf8'));
const temp = await mkdtemp(join(tmpdir(), 'public-build-test-'));
const output = join(temp, 'site');
const trainingPath = 'generated/soldier-training-tech-descriptions.v1.json';
try {
  const built = await buildSite({ outputDir: output });
  assert.deepEqual(built.files.map(file => file.path), publicSitePaths(heroes, decision));
  assert.ok(built.files.every(file => !/^(canonical|evidence|tools|docs)\//.test(file.path)));
  await assert.rejects(buildSite({ outputDir: output }), /EEXIST/);
  const validate = (record = decision) => validatePublicSiteDirectory(output, heroes, record);
  await writeFile(join(output, 'unexpected.json'), '{}');
  await assert.rejects(validate(), /allowlist mismatch/);
  await rm(join(output, 'unexpected.json'));
  await mkdir(join(output, 'evidence'));
  await assert.rejects(validate(), /Unexpected public directory/);
  await rm(join(output, 'evidence'), { recursive: true });
  await symlink(join(process.cwd(), 'app.js'), join(output, 'linked.js'));
  await assert.rejects(validate(), /Non-regular public entry/);
  await rm(join(output, 'linked.js'));
  await writeFile(join(output, 'app.js'), '// wrong bytes');
  await assert.rejects(validate(), /bytes differ.*app.js/);
  await copyFile('app.js', join(output, 'app.js'));
  await rm(join(output, 'styles.css'));
  await assert.rejects(validate(), /allowlist mismatch/);
  await copyFile('styles.css', join(output, 'styles.css'));

  for (const state of ['REVOKED', 'APPROVED_ONLY', 'PROPOSED']) {
    const disabled = structuredClone(decision);
    disabled.contract.effectivenessStatus = state;
    if (state === 'REVOKED') {
      disabled.revocation.status = 'REVOKED';
      disabled.revocation.revokedAt = '2026-10-29';
      disabled.revocation.reason = 'test-only revocation';
    }
    if (state === 'PROPOSED') {
      disabled.contract.approvalStatus = 'NOT_APPROVED';
      disabled.decisionA.status = 'NOT_APPROVED';
      disabled.decisionB.status = 'NOT_APPROVED';
    }
    assert.ok(!publicSitePaths(heroes, disabled).includes(trainingPath));
    await assert.rejects(validate(disabled), /allowlist mismatch/);
    await rm(join(output, trainingPath));
    await validate(disabled);
    await copyFile(trainingPath, join(output, trainingPath));
  }
  const invalid = structuredClone(decision);
  invalid.contract.version = 999;
  assert.throws(() => publicSitePaths(heroes, invalid), /contract approval\/effectiveness state mismatch/);
  await validate();
  await buildSite({ verifyDir: output });
  console.log('Public Build negatives: PASS (extra/missing files, directories, symlinks, wrong bytes, no overwrite, invalid/revoked/non-effective publication)');
} finally {
  await rm(temp, { recursive: true, force: true });
}
