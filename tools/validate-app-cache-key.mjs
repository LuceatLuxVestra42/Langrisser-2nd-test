import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const fail = (message) => { throw new Error(`static resource cache-key contract: ${message}`); };

function attributeMap(tag) {
  const attributes = new Map();
  const body = tag.replace(/^<(?:script|link)\b|\s*\/?\s*>$/gi, '');
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

export function validateStylesCacheKey(html, styles, label = 'site') {
  if (typeof html !== 'string' || typeof styles !== 'string') fail(`${label}: HTML and CSS must be text`);
  const withoutComments = html.replace(/<!--[\s\S]*?-->/g, '');
  const stylesheetLinks = [...withoutComments.matchAll(/<link\b[^>]*>/gi)].map((match) => ({
    tag: match[0], attributes: attributeMap(match[0]),
  })).filter(({ attributes }) => {
    const href = attributes.get('href');
    return (attributes.get('rel') ?? '').toLowerCase().split(/\s+/).includes('stylesheet')
      && typeof href === 'string' && /(?:^|\/)styles\.css(?:\?|#|$)/.test(href);
  });

  if (stylesheetLinks.length !== 1) fail(`${label}: expected exactly one executable styles.css stylesheet; found ${stylesheetLinks.length}`);
  const { attributes } = stylesheetLinks[0];
  const href = attributes.get('href');
  if (href.split(/[?#]/, 1)[0] !== './styles.css') fail(`${label}: styles.css must be loaded from the published site root`);
  let url;
  try { url = new URL(href, 'https://pages.invalid/Langrisser-2nd-test/'); }
  catch { fail(`${label}: invalid styles.css stylesheet URL`); }
  if (!url.pathname.endsWith('/styles.css') || url.hash) fail(`${label}: styles.css path or fragment is invalid`);
  const versions = url.searchParams.getAll('v');
  if (versions.length !== 1 || [...url.searchParams.keys()].length !== 1) fail(`${label}: styles.css URL must have exactly one v cache key`);

  const expected = createHash('sha256').update(styles, 'utf8').digest('hex');
  if (versions[0] !== expected) fail(`${label}: styles.css URL cache key does not match its SHA-256 content`);
  return { href, cacheKey: versions[0], contentSha256: expected };
}

if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  const [html, app, styles] = await Promise.all([readFile('index.html', 'utf8'), readFile('app.js', 'utf8'), readFile('styles.css', 'utf8')]);
  const appResult = validateAppCacheKey(html, app, 'repository');
  const stylesResult = validateStylesCacheKey(html, styles, 'repository');
  process.stdout.write(`Static cache-key contract: PASS (${appResult.src}; SHA-256 ${appResult.contentSha256}; ${stylesResult.href}; SHA-256 ${stylesResult.contentSha256})\n`);
}
