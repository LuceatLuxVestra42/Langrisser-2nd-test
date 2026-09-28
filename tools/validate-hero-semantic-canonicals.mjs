import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const check = (condition, message) => { if (!condition) throw new Error(`Hero semantic canonical validation failed: ${message}`); };
const exactKeys = (value, expected, label) => check(isDeepStrictEqual(Object.keys(value).sort(), [...expected].sort()), `${label} has unexpected or missing fields`);

export async function validateHeroSemanticCanonicals(root = process.cwd()) {
  const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
  const identityPath = 'canonical/hero-identities.v1.json';
  const relationPath = 'canonical/hero-job-relations.v1.json';
  const [identities, relations, selected, classicEvidence, spEvidence, classicJobs, spJobs] = await Promise.all([
    readJson(identityPath),
    readJson(relationPath),
    readJson('canonical/heroes.v1.json'),
    readJson('evidence/source/jobs/hero-job-connection-slice.v1.json'),
    readJson('evidence/source/jobs/hero-sp-job-relation.v1.json'),
    readJson('evidence/source/configdata/ConfigDataJobInfo.records-hero-5-6-8.json'),
    readJson('evidence/source/configdata/ConfigDataJobInfo.records-sp-job-localization.v1.json'),
  ]);

  exactKeys(identities, ['schemaVersion', 'scope', 'records'], 'Hero identity canonical');
  check(identities.schemaVersion === 1 && identities.scope === 'Current evidence-backed Hero identity union; not a claim of complete game population.', 'Hero identity schema or scope drift');
  exactKeys(relations, ['schemaVersion', 'scope', 'records'], 'Hero→Job relation canonical');
  check(relations.schemaVersion === 1 && relations.scope === 'Current evidence-backed Hero-to-Job relation union; not a claim of complete game relation population.', 'Hero→Job schema or scope drift');

  const expectedIdentityLocators = new Map();
  for (const row of spEvidence.records) expectedIdentityLocators.set(row.heroId, row.heroInfoLocator);
  for (const row of selected.records) expectedIdentityLocators.set(row.id, row.provenance.identity);
  check(expectedIdentityLocators.size === 26, 'current evidence-backed identity scope must contain 26 unique Hero IDs');

  const identityById = new Map();
  for (const row of identities.records) {
    exactKeys(row, ['heroId', 'provenance'], `Hero identity ${row.heroId}`);
    check(Number.isInteger(row.heroId) && !identityById.has(row.heroId), `malformed or duplicate Hero ID ${row.heroId}`);
    check(typeof row.provenance === 'string' && row.provenance.length > 0, `Hero ${row.heroId} has no identity evidence locator`);
    check(expectedIdentityLocators.get(row.heroId) === row.provenance, `Hero ${row.heroId} identity evidence locator/value mismatch`);
    identityById.set(row.heroId, row);
  }
  check(identityById.size === expectedIdentityLocators.size, 'Hero identity count differs from the current evidence-backed scope');
  for (const [heroId, locator] of expectedIdentityLocators) {
    check(identityById.get(heroId)?.provenance === locator, `Hero ${heroId} identity evidence is missing`);
  }

  const expectedRelations = new Map();
  const addExpectedRelation = (heroId, jobId, provenance, source) => {
    const key = `${heroId}:${jobId}`;
    check(!expectedRelations.has(key), `duplicate evidence relation pair ${key} (${source})`);
    expectedRelations.set(key, { heroId, jobId, provenance });
  };
  for (const row of classicEvidence.records) {
    addExpectedRelation(row.heroId, row.jobId,
      `evidence/source/jobs/hero-job-connection-slice.v1.json#heroId=${row.heroId}&connectionId=${row.connectionId}`, 'selected Hero evidence');
  }
  for (const row of spEvidence.records) {
    addExpectedRelation(row.heroId, row.spJobId,
      `evidence/source/jobs/hero-sp-job-relation.v1.json#heroId=${row.heroId}`, 'SP relation evidence');
  }
  check(classicEvidence.records.length === 18 && spEvidence.records.length === 25 && expectedRelations.size === 43, 'current evidence-backed relation scope must contain 18 selected plus 25 SP relations');

  const jobIds = new Set([...classicJobs, ...spJobs].map((row) => row.ID));
  check(jobIds.size === classicJobs.length + spJobs.length, 'JobInfo evidence subsets contain duplicate IDs');
  const relationByPair = new Map();
  for (const row of relations.records) {
    exactKeys(row, ['heroId', 'jobId', 'provenance'], `Hero→Job relation ${row.heroId}:${row.jobId}`);
    check(Number.isInteger(row.heroId) && Number.isInteger(row.jobId), `malformed relation endpoint ${row.heroId}:${row.jobId}`);
    const key = `${row.heroId}:${row.jobId}`;
    check(!relationByPair.has(key), `duplicate Hero→Job relation pair ${key}`);
    check(identityById.has(row.heroId), `relation Hero ${row.heroId} has no canonical identity`);
    check(jobIds.has(row.jobId), `relation Job ${row.jobId} has no preserved JobInfo evidence`);
    const expected = expectedRelations.get(key);
    check(expected && expected.provenance === row.provenance, `relation pair/evidence locator mismatch for ${key}`);
    relationByPair.set(key, row);
  }
  check(relationByPair.size === expectedRelations.size, 'Hero→Job relation count differs from the current evidence-backed scope');
  for (const [key, expected] of expectedRelations) {
    check(relationByPair.has(key), `evidence relation ${key} is missing from the general owner`);
  }

  const selectedIds = new Set(selected.records.map((row) => row.id));
  for (const heroId of selectedIds) check(identityById.has(heroId), `selected Hero ${heroId} is absent from the general identity owner`);
  const selectedPairs = new Set();
  for (const hero of selected.records) {
    for (const relation of hero.jobConnections) {
      const key = `${hero.id}:${relation.jobId}`;
      check(!selectedPairs.has(key), `duplicate selected slice relation ${key}`);
      check(relationByPair.has(key), `selected slice relation ${key} is absent from the general relation owner`);
      selectedPairs.add(key);
    }
  }
  const selectedOwnerPairs = [...expectedRelations.keys()].filter((key) => selectedIds.has(Number(key.split(':')[0])) && classicEvidence.records.some((row) => `${row.heroId}:${row.jobId}` === key));
  check(selectedPairs.size === 18 && selectedOwnerPairs.length === 18, 'selected 5/6/8 relation parity must cover exactly the existing 18 relations');
  for (const row of classicEvidence.records) check(selectedPairs.has(`${row.heroId}:${row.jobId}`), `selected relation ${row.heroId}:${row.jobId} is missing from the slice`);

  return { identities: identityById.size, relations: relationByPair.size, selectedHeroes: selectedIds.size, selectedRelations: selectedPairs.size };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const result = await validateHeroSemanticCanonicals();
  process.stdout.write(`Hero semantic canonicals: PASS (${result.identities} evidence-backed identities; ${result.relations} relations; ${result.selectedRelations} selected-slice parity pairs; localization/release independent)\n`);
}
