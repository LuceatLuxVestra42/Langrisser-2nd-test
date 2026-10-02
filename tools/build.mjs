import { cp, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { renderGenerated, renderSpSoldiers } from './generate.mjs';

const readJson = async (path) => JSON.parse(await readFile(resolve(path), 'utf8'));
const exactKeys = (value, expected, label) => {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) {
    throw new Error(`${label} fields were ${actual.join(',')}; expected ${wanted.join(',')}`);
  }
};

const canonical = await readJson('canonical/heroes.v1.json');
const jobLocalization = await readJson('canonical/job-localizations-ko.v1.json');
const generatedPath = resolve('generated/hero-slice.v1.json');
const generatedText = await readFile(generatedPath, 'utf8');
const expectedGenerated = renderGenerated(canonical, jobLocalization);
if (generatedText !== expectedGenerated) {
  throw new Error('generated consumer is stale or non-deterministic relative to canonical input');
}

const [soldierIdentities, soldierLocalizations, soldierBaseStats, soldierRelations] = await Promise.all([
  readJson('canonical/soldiers.v1.json'),
  readJson('canonical/sp-soldier-localizations-ko.v1.json'),
  readJson('canonical/sp-soldier-base-stats.v1.json'),
  readJson('canonical/sp-soldier-normal-relations.v1.json'),
]);
const spGeneratedPath = resolve('generated/sp-soldiers.v1.json');
const spGeneratedText = await readFile(spGeneratedPath, 'utf8');
const expectedSpGenerated = renderSpSoldiers(soldierIdentities, soldierLocalizations, soldierBaseStats, soldierRelations);
if (spGeneratedText !== expectedSpGenerated) throw new Error('generated SP Soldier data is stale or non-deterministic');
const spGenerated = JSON.parse(spGeneratedText);
if (spGenerated.schemaVersion !== 1 || !Array.isArray(spGenerated.soldiers)) throw new Error('built document has unsupported SP Soldier presentation schema');

const generated = JSON.parse(generatedText);
exactKeys(generated, ['schemaVersion', 'heroes'], 'generated consumer');
if (generated.schemaVersion !== 1 || !Array.isArray(generated.heroes)) throw new Error('unsupported generated consumer schema');
for (const hero of generated.heroes) {
  exactKeys(hero, ['id', 'nameEng', 'portrait', 'jobConnections'], `generated Hero ${hero.id}`);
  if (!Number.isInteger(hero.id) || typeof hero.nameEng !== 'string' || !hero.nameEng || !Array.isArray(hero.jobConnections)) {
    throw new Error(`malformed generated Hero ${String(hero.id)}`);
  }
  for (const relation of hero.jobConnections) {
    exactKeys(relation, ['connectionId', 'jobId', 'sourceField', 'jobNameKo'], `generated Hero ${hero.id} Job relation`);
    if (!Number.isInteger(relation.connectionId) || !Number.isInteger(relation.jobId) || typeof relation.sourceField !== 'string'
      || typeof relation.jobNameKo !== 'string' || !relation.jobNameKo) {
      throw new Error(`malformed generated Job relation for Hero ${hero.id}`);
    }
  }
}
const portraitPaths = [...new Set(generated.heroes.map((hero) => hero.portrait))];

const output = await mkdtemp(join(tmpdir(), 'langrisser-hero-slice-build-'));
try {
  await mkdir(join(output, 'generated'), { recursive: true });
  for (const file of ['index.html', 'app.js', 'styles.css']) await cp(resolve(file), join(output, file));
  await cp(generatedPath, join(output, 'generated', 'hero-slice.v1.json'));
  await cp(spGeneratedPath, join(output, 'generated', 'sp-soldiers.v1.json'));

  for (const portraitPath of portraitPaths) {
    if (typeof portraitPath !== 'string' || !/^assets\/portraits\/[^/]+\.png$/.test(portraitPath)) {
      throw new Error(`unsupported generated portrait path: ${String(portraitPath)}`);
    }
    const destination = join(output, ...portraitPath.split('/'));
    await mkdir(dirname(destination), { recursive: true });
    await cp(resolve(portraitPath), destination);
  }

  const [html, app] = await Promise.all([
    readFile(join(output, 'index.html'), 'utf8'),
    readFile(join(output, 'app.js'), 'utf8'),
  ]);
  if (!html.includes('./app.js') || !html.includes('./styles.css')) {
    throw new Error('built document is missing app or style entry');
  }
  if (!app.includes("fetch('./generated/hero-slice.v1.json')")) {
    throw new Error('built app does not resolve the generated Hero data entry');
  }
  if (!app.includes("fetch('./generated/sp-soldiers.v1.json')")) throw new Error('built app does not resolve the generated SP Soldier data entry');
  await readFile(join(output, 'generated', 'sp-soldiers.v1.json'), 'utf8');

  process.stdout.write(`Static build: PASS (${output}; fresh Hero and ${spGenerated.soldiers.length} SP Soldier records packaged, ${portraitPaths.length} portrait assets resolved)\n`);
} finally {
  await rm(output, { recursive: true, force: true });
}
