import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const fail = (message) => { throw new Error(`app.js cache-key contract: ${message}`); };

function attributeMap(tag) {
  const attributes = new Map();
  const body = tag.replace(/^<script\b|\s*\/?\s*>$/gi, '');
  const matcher = /([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  for (const match of body.matchAll(matcher)) {
    const name = match[1].toLowerCase();
    if (attributes.has(name)) fail(`duplicate ${name} attribute`);
    attributes.set(name, match[2] ?? match[3] ?? match[4] ?? '');
  }
  return attributes;
}

export function validateAppCacheKey(html, app, label = 'site') {
  if (typeof html !== 'string' || typeof app !== 'string') fail(`${label}: HTML and JavaScript must be text`);
  const withoutComments = html.replace(/<!--[\s\S]*?-->/g, '');
  const scriptTags = [...withoutComments.matchAll(/<script\b[^>]*>/gi)].map((match) => match[0]);
  const appScripts = scriptTags.map((tag) => ({ tag, attributes: attributeMap(tag) }))
    .filter(({ attributes }) => {
      const src = attributes.get('src');
      return typeof src === 'string' && /(?:^|\/)app\.js(?:\?|#|$)/.test(src);
    });

  if (appScripts.length !== 1) fail(`${label}: expected exactly one executable app.js script; found ${appScripts.length}`);
  const { attributes } = appScripts[0];
  if ((attributes.get('type') ?? '').toLowerCase() !== 'module') fail(`${label}: app.js must be loaded as a module`);

  const src = attributes.get('src');
  const relativePath = src.split(/[?#]/, 1)[0];
  if (relativePath !== './app.js') fail(`${label}: app.js must be loaded from the published site root`);
  let url;
  try { url = new URL(src, 'https://pages.invalid/Langrisser-2nd-test/'); }
  catch { fail(`${label}: invalid app.js script URL`); }
  if (!url.pathname.endsWith('/app.js') || url.hash) fail(`${label}: app.js script path or fragment is invalid`);
  const versions = url.searchParams.getAll('v');
  if (versions.length !== 1 || [...url.searchParams.keys()].length !== 1) fail(`${label}: app.js URL must have exactly one v cache key`);

  const expected = createHash('sha256').update(app, 'utf8').digest('hex');
  if (versions[0] !== expected) fail(`${label}: app.js URL cache key does not match its SHA-256 content`);
  return { src, cacheKey: versions[0], contentSha256: expected };
}

if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  const [html, app] = await Promise.all([readFile('index.html', 'utf8'), readFile('app.js', 'utf8')]);
  const result = validateAppCacheKey(html, app, 'repository');
  process.stdout.write(`app.js cache-key contract: PASS (${result.src}; SHA-256 ${result.contentSha256})\n`);
}
