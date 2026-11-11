import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { validateHero15JobLevelRawStats, validateHeroJobLevelRawStats } from './validate-hero-job-level-raw-stats.mjs';
import { projectHeroJobLevelSourceStats } from './generate.mjs';
import { extractFunction } from './test-app-function-source.mjs';
import { runInNewContext } from 'node:vm';

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
  heroes: await json('canonical/heroes.v1.json'),
  evidenceSha256: createHash('sha256').update(evidenceBytes).digest('hex'),
};

base.legacyCanonical = { ...base.canonical, scope: 'Raw ConfigDataJobLevel stat fields for every JobLevel_ID explicitly referenced by the 12 normal JobConnections of Hero 6 and 8. Values remain Job/JobLevel source facts; no Hero-level, Star, Hero-rank modifier, formula, mastery, bond effect, derived stat, or final combat stat is asserted. The selected 50 records contain DEX_INI but no DEX_UP field; no Dexterity growth value is inferred.', records: base.canonical.records.filter(row => [6, 8].includes(row.heroId)) };
const [hero15SourceManifest, hero15ConnectionEvidence, hero15JobEvidence, hero15LevelEvidence, hero15ManifestBytes, hero15ConnectionBytes, hero15JobBytes, hero15LevelBytes] = await Promise.all([
  json('evidence/source/configdata/ConfigDataJobLevelInfo.records-hero-15-raw-stats.source-manifest.v1.json'),
  json('evidence/source/configdata/ConfigDataJobConnectionInfo.records-hero-15-job-level-raw-stats.v1.json'),
  json('evidence/source/configdata/ConfigDataJobInfo.records-hero-15-job-level-raw-stats.v1.json'),
  json('evidence/source/configdata/ConfigDataJobLevelInfo.records-hero-15-raw-stats.v1.json'),
  readFile('evidence/source/configdata/ConfigDataJobLevelInfo.records-hero-15-raw-stats.source-manifest.v1.json'),
  readFile('evidence/source/configdata/ConfigDataJobConnectionInfo.records-hero-15-job-level-raw-stats.v1.json'),
  readFile('evidence/source/configdata/ConfigDataJobInfo.records-hero-15-job-level-raw-stats.v1.json'),
  readFile('evidence/source/configdata/ConfigDataJobLevelInfo.records-hero-15-raw-stats.v1.json'),
]);
base.hero15Validation = {
  heroIdentities: base.heroIdentities, heroJobRelations: base.heroJobRelations, canonical: base.canonical,
  sourceManifest: hero15SourceManifest, connectionEvidence: hero15ConnectionEvidence, jobEvidence: hero15JobEvidence,
  levelEvidence: hero15LevelEvidence,
  evidenceHashes: Object.fromEntries([
    ['manifest', hero15ManifestBytes], ['connection', hero15ConnectionBytes], ['job', hero15JobBytes], ['level', hero15LevelBytes],
  ].map(([key, bytes]) => [key, createHash('sha256').update(bytes).digest('hex')])),
};

validateHeroJobLevelRawStats({ ...base, canonical: base.legacyCanonical });
validateHero15JobLevelRawStats(base.hero15Validation);
let rejected = 0;
const reject = (label, mutate) => {
  const fixture = structuredClone(base);
  mutate(fixture);
  assert.throws(() => validateHeroJobLevelRawStats({ ...fixture, canonical: fixture.legacyCanonical }), undefined, `${label} must be rejected`);
  rejected += 1;
};

reject('duplicate Canonical JobLevel ID', x => x.legacyCanonical.records.push(structuredClone(x.legacyCanonical.records[0])));
reject('Canonical Source value mismatch', x => { x.legacyCanonical.records[0].rawStats.HP_INI += 1; });
reject('unapproved Hero ID', x => { x.legacyCanonical.records[0].heroId = 9; });
reject('wrong Job endpoint', x => { x.legacyCanonical.records[0].jobId = 999; });
reject('invented DEX_UP field', x => { x.legacyCanonical.records[0].rawStats.DEX_UP = 0; });
reject('wrong Source locator', x => { x.legacyCanonical.records[0].provenance.jobLevel = 'data/configdata/guessed.json#ID=601'; });
reject('wrong Source commit pin', x => { x.manifest.source.commit = '0000000000000000000000000000000000000000'; });
reject('unmatched preserved Evidence value', x => { x.evidence.records[0].HP_INI += 1; });
reject('missing JobLevel Endpoint', x => { x.evidence.records.pop(); });
reject('missing Hero–Job endpoint', x => { x.heroJobRelations.records = x.heroJobRelations.records.filter(r => !(r.heroId === 6 && r.jobId === 301)); });
reject('wrong JobInfo rank', x => { x.jobs.find(r => r.ID === 301).Rank += 1; });

const projected = projectHeroJobLevelSourceStats(base.heroes, base.canonical);
assert.deepEqual([...projected.keys()].sort(), [6, 8]);
assert.equal(projected.get(6).length, 25);
assert.equal(projected.get(8).length, 25);
for (const heroId of [6, 8]) {
  const expectedRows = base.canonical.records.filter((row) => row.heroId === heroId).map((row) => ({
    jobConnectionId: row.jobConnectionId,
    jobId: row.jobId,
    jobRank: row.jobRank,
    jobLevelId: row.jobLevelId,
    jobLevelUpHeroLevel: row.jobLevelUpHeroLevel,
    rankCode: row.rankCode,
    rawStats: row.rawStats,
  }));
  assert.deepEqual(projected.get(heroId), expectedRows, `Hero ${heroId} projection preserves the exact admitted raw fields`);
}
for (const hero of base.heroes.records) {
  const renderedHero = (await json('generated/hero-slice.v1.json')).heroes.find((row) => row.id === hero.id);
  if ([6, 8].includes(hero.id)) assert.deepEqual(renderedHero.jobLevelSourceStats, projected.get(hero.id));
  else assert.equal(renderedHero.jobLevelSourceStats, undefined, `Hero ${hero.id} remains outside the admitted raw JobLevel scope`);
}
const rejectProjection = (label, mutateHeroes, mutateStats) => {
  const heroes = structuredClone(base.heroes);
  const stats = structuredClone(base.canonical);
  mutateHeroes?.(heroes);
  mutateStats?.(stats);
  assert.throws(() => projectHeroJobLevelSourceStats(heroes, stats), undefined, label);
  rejected += 1;
};
rejectProjection('projection rejects an out-of-scope Hero', null, x => { x.records[0].heroId = 9; });
rejectProjection('projection rejects a wrong Job endpoint', null, x => { x.records[0].jobId = 999; });
rejectProjection('projection rejects a wrong JobConnection endpoint', null, x => { x.records[0].jobConnectionId = 999; });
rejectProjection('projection rejects a duplicate JobLevel endpoint', null, x => x.records.push(structuredClone(x.records[0])));
rejectProjection('projection rejects a missing JobLevel record', null, x => x.records.pop());
rejectProjection('projection rejects a missing JobConnection coverage', null, x => {
  const rows = x.records.filter(row => row.heroId === 6 && row.jobConnectionId === 60);
  const target = base.heroes.records.find(row => row.id === 6).jobConnections.find(row => row.connectionId === 61);
  for (const row of rows) { row.jobConnectionId = target.connectionId; row.jobId = target.jobId; }
});
rejectProjection('projection rejects an extra raw field', null, x => { x.records[0].rawStats.DEX_UP = 0; });
rejectProjection('projection rejects a missing raw field', null, x => { delete x.records[0].rawStats.HP_INI; });
rejectProjection('projection rejects a missing canonical Hero endpoint', x => { x.records = x.records.filter(row => row.id !== 8); });
rejectProjection('projection rejects a duplicate canonical connection', x => { x.records.find(row => row.id === 6).jobConnections.push(structuredClone(x.records.find(row => row.id === 6).jobConnections[0])); });

const rejectHero15 = (label, mutate) => {
  const fixture = structuredClone(base.hero15Validation);
  mutate(fixture);
  assert.throws(() => validateHero15JobLevelRawStats(fixture), undefined, `${label} must be rejected`);
  rejected += 1;
};
rejectHero15('Hero 15 JobLevels_ID endpoint mismatch', x => { x.connectionEvidence.records[0].JobLevels_ID[0] = 802; });
rejectHero15('shared Job ID cannot inherit Hero 8 Connection 83 JobLevels_ID', x => { x.connectionEvidence.records[3].JobLevels_ID = [831, 832, 833, 834]; });
rejectHero15('Hero 15 Connection omitted', x => { x.connectionEvidence.records.pop(); });
rejectHero15('Hero 15 Job_ID mismatch', x => { x.connectionEvidence.records[3].Job_ID = 7030; });
rejectHero15('Hero 15 JobInfo Rank mismatch', x => { x.jobEvidence.records[0].Rank += 1; });
rejectHero15('Hero 15 JobLevel record omitted', x => { x.levelEvidence.records.pop(); });
rejectHero15('Hero 15 raw stat tampering', x => { x.levelEvidence.records[0].HP_INI += 1; });
rejectHero15('Hero 15 source pin tampering', x => { x.sourceManifest.source.connection.gitBlobSha1 = '0'.repeat(40); });
rejectHero15('Hero 15 source locator tampering', x => { x.connectionEvidence.source.path = 'guessed.json'; });
rejectHero15('Hero 15 Provenance tampering', x => { x.canonical.records.find(row => row.heroId === 15).provenance.jobConnection = 'guessed.json#ID=150'; });
rejectHero15('Hero 15 unapproved relation endpoint', x => { x.heroJobRelations.records = x.heroJobRelations.records.filter(row => !(row.heroId === 15 && row.jobId === 802)); });
rejectHero15('Hero 15 DEX_UP inference', x => { x.canonical.records.find(row => row.heroId === 15).rawStats.DEX_UP = 0; });
rejectHero15('Hero 15 duplicated Canonical endpoint', x => { x.canonical.records.push(structuredClone(x.canonical.records.find(row => row.heroId === 15))); });
rejectHero15('Hero 15 Canonical raw field tampering', x => { x.canonical.records.find(row => row.heroId === 15).rawStats.HP_INI += 1; });
rejectHero15('Hero 15 Evidence digest tampering', x => { x.evidenceHashes.level = '0'.repeat(64); });
rejectHero15('Hero 15 Generation scope expansion', x => { x.canonical.records.find(row => row.heroId === 15).heroId = 6; });
assert.deepEqual([...projected.keys()].sort(), [6, 8], 'Hero 15 Semantic admission must not expand the public generated projection');

const [appSource, generatedHeroData] = await Promise.all([
  readFile('app.js', 'utf8'),
  json('generated/hero-slice.v1.json'),
]);
const makeElement = (tagName = '#text') => ({
  tagName, children: [], className: '', textContent: '', attributes: {},
  append(...children) { this.children.push(...children); },
  setAttribute(key, value) { this.attributes[key] = value; },
});
const document = { createElement: (tag) => makeElement(tag) };
const uiFunction = extractFunction(appSource, 'makeJobLevelSourceStatsPresentation');
const makePresentation = runInNewContext(`(() => { ${uiFunction}; return makeJobLevelSourceStatsPresentation; })()`, { document, Error, Number, Object, Map });
for (const heroId of [6, 8]) {
  const hero = generatedHeroData.heroes.find((row) => row.id === heroId);
  const details = makePresentation(hero);
  assert.equal(details.tagName, 'details');
  assert.equal(details.className, 'job-level-source-stats');
  assert.equal(details.children[0].textContent, 'CN ConfigData 원본 JobLevel 필드 · 최종 전투 능력치 아님');
  assert.match(details.children[1].textContent, /전투 능력치 환산·성장 적용이나 나열 순서의 의미는 주장하지 않습니다/);
  assert.equal(details.children.length, hero.jobConnections.length + 2, 'one disclosure, one note, and exact JobConnection groups');
  assert.ok(details.children.slice(2).every((group) => group.tagName === 'details'));
}
assert.equal(makePresentation(generatedHeroData.heroes.find((row) => row.id === 5)), null);
assert.ok(!uiFunction.includes('innerHTML'), 'raw source fields are rendered through textContent only');

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  process.stdout.write(`Hero JobLevel raw stats negative tests: PASS (${rejected} rejection controls)\n`);
}
