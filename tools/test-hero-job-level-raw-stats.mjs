import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { validateHeroJobLevelRawStats } from './validate-hero-job-level-raw-stats.mjs';

const root = process.cwd();
const json = async file => JSON.parse(await readFile(resolve(root, file), 'utf8'));
const evidenceBytes = await readFile(resolve(root, 'evidence/source/configdata/ConfigDataJobLevelInfo.records-hero-6-8-raw-stats.v1.json'));
const base = {
  heroIdentities: await json('canonical/hero-identities.v1.json'),
  heroJobRelations: await json('canonical/hero-job-relations.v1.json'),
  connections: await json('evidence/source/configdata/ConfigDataJobConnectionInfo.records-hero-5-6-8.json'),
  jobs: await json('evidence/source/configdata/ConfigDataJobInfo.records-hero-5-6-8.json'),
  manifest: await json('evidence/source/configdata/ConfigDataJobLevelInfo.records-hero-6-8-raw-stats.source-manifest.v1.json'),
  evidence: JSON.parse(evidenceBytes.toString('utf8')),
  canonical: await json('canonical/hero-job-level-raw-stats.v1.json'),
  evidenceSha256: createHash('sha256').update(evidenceBytes).digest('hex'),
};

validateHeroJobLevelRawStats(base);
let rejected = 0;
const reject = (label, mutate) => {
  const fixture = structuredClone(base);
  mutate(fixture);
  assert.throws(() => validateHeroJobLevelRawStats(fixture), undefined, `${label} must be rejected`);
  rejected += 1;
};

reject('duplicate Canonical JobLevel ID', x => x.canonical.records.push(structuredClone(x.canonical.records[0])));
reject('Canonical Source value mismatch', x => { x.canonical.records[0].rawStats.HP_INI += 1; });
reject('unapproved Hero ID', x => { x.canonical.records[0].heroId = 9; });
reject('wrong Job endpoint', x => { x.canonical.records[0].jobId = 999; });
reject('invented DEX_UP field', x => { x.canonical.records[0].rawStats.DEX_UP = 0; });
reject('wrong Source locator', x => { x.canonical.records[0].provenance.jobLevel = 'data/configdata/guessed.json#ID=601'; });
reject('wrong Source commit pin', x => { x.manifest.source.commit = '0000000000000000000000000000000000000000'; });
reject('unmatched preserved Evidence value', x => { x.evidence.records[0].HP_INI += 1; });
reject('missing JobLevel Endpoint', x => { x.evidence.records.pop(); });
reject('missing Hero–Job endpoint', x => { x.heroJobRelations.records = x.heroJobRelations.records.filter(r => !(r.heroId === 6 && r.jobId === 301)); });
reject('wrong JobInfo rank', x => { x.jobs.find(r => r.ID === 301).Rank += 1; });

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  process.stdout.write(`Hero JobLevel raw stats negative tests: PASS (${rejected} rejection controls)\n`);
}
