import { spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

function run(script) {
  const result = spawnSync(process.execPath, [script], { cwd: process.cwd(), encoding: 'utf8' });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run('tools/generate.mjs');
run('tools/validate.mjs');

const output = await mkdtemp(join(tmpdir(), 'langrisser-hero-slice-build-'));
await mkdir(join(output, 'generated'), { recursive: true });
await mkdir(join(output, 'assets', 'portraits'), { recursive: true });
for (const file of ['index.html', 'app.js', 'styles.css']) await cp(resolve(file), join(output, file));
await cp(resolve('generated/hero-slice.v1.json'), join(output, 'generated/hero-slice.v1.json'));
for (const id of [5, 6, 8]) await cp(resolve(`assets/portraits/hero-${id}.png`), join(output, 'assets', 'portraits', `hero-${id}.png`));
const html = await readFile(join(output, 'index.html'), 'utf8');
if (!html.includes('./app.js') || !html.includes('./styles.css')) throw new Error('built document is missing app or style entry');
process.stdout.write(`Static build: PASS (${output}; generated data and 3 portrait assets resolved)\n`);
