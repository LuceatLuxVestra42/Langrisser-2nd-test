import { spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

function run(script) {
  const result = spawnSync(process.execPath, [script], { cwd: process.cwd(), encoding: 'utf8' });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run('tools/validate.mjs');

const generatedPath = resolve('generated/hero-slice.v1.json');
const generated = JSON.parse(await readFile(generatedPath, 'utf8'));
const portraitPaths = [...new Set(generated.heroes.map((hero) => hero.portrait))];

const output = await mkdtemp(join(tmpdir(), 'langrisser-hero-slice-build-'));
await mkdir(join(output, 'generated'), { recursive: true });
for (const file of ['index.html', 'app.js', 'styles.css']) await cp(resolve(file), join(output, file));
await cp(generatedPath, join(output, 'generated', 'hero-slice.v1.json'));

for (const portraitPath of portraitPaths) {
  if (typeof portraitPath !== 'string' || !/^assets\/portraits\/[^/]+\.png$/.test(portraitPath)) {
    throw new Error(`unsupported generated portrait path: ${String(portraitPath)}`);
  }
  const destination = join(output, ...portraitPath.split('/'));
  await mkdir(dirname(destination), { recursive: true });
  await cp(resolve(portraitPath), destination);
}

const html = await readFile(join(output, 'index.html'), 'utf8');
if (!html.includes('./app.js') || !html.includes('./styles.css')) throw new Error('built document is missing app or style entry');
process.stdout.write(`Static build: PASS (${output}; generated data and ${portraitPaths.length} portrait assets resolved)\n`);

await rm(output, { recursive: true, force: true });
