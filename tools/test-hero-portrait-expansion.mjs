import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const source = process.cwd();
const temp = await mkdtemp(join(tmpdir(), 'hero-portrait-expansion-'));
const repo = join(temp, 'repo');
await cp(source, repo, { recursive: true, filter: (path) => !path.split('/').includes('.git') });
const run = () => spawnSync(process.execPath, ['tools/validate-hero-portrait-expansion.mjs'], { cwd: repo, encoding: 'utf8' });
function success(r) { assert.equal(r.error, undefined); assert.equal(r.signal, null); assert.equal(r.status, 0, r.stderr || r.stdout); assert.match(r.stdout, /7 portrait evidence IDs; 7 presentation canonical IDs/); }
function failure(r,re) { assert.equal(r.error,undefined); assert.equal(r.signal,null); assert.notEqual(r.status,0,r.stdout); assert.match(r.stderr,re); }
async function mutate(path,change,re) { const p=join(repo,path),old=await readFile(p,'utf8');try{const d=JSON.parse(old);change(d);await writeFile(p,JSON.stringify(d,null,2)+'\n');failure(run(),re)}finally{await writeFile(p,old)} }
try {
 success(run());
 await mutate('evidence/source/portraits/hero-portrait-expansion.v1.json',d=>{d.records=d.records.filter(x=>x.heroId!==28)},/portrait evidence population must contain exactly/);
 await mutate('canonical/heroes.v1.json',d=>{d.records.push({id:28})},/presentation canonical population must be exactly/);
 const p=join(repo,'assets/portraits/hero-28.png'),old=await readFile(p);
 try{const b=Buffer.from(old);b[b.length-1]^=1;await writeFile(p,b);failure(run(),/PNG SHA-256 mismatch for 28/)}finally{await writeFile(p,old)}
 process.stdout.write('Hero portrait expansion regression tests: PASS (population boundary and exact asset integrity negatives)\\n');
} finally { await rm(temp,{recursive:true,force:true}); }
