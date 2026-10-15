import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { validateAppCacheKey, validateStylesCacheKey } from './validate-app-cache-key.mjs';

const digest = (text) => createHash('sha256').update(text, 'utf8').digest('hex');
const app = 'export const version = 1;';
const htmlFor = (key) => `<script type="module" src="./app.js?v=${key}"></script>`;
const stylesheetFor = (key) => `<link rel="stylesheet" href="./styles.css?v=${key}">`;

assert.equal(validateAppCacheKey(htmlFor(digest(app)), app, 'matching fixture').cacheKey, digest(app));
assert.throws(() => validateAppCacheKey(htmlFor(digest(app)), `${app}\n// changed`, 'stale-key fixture'), /does not match/);
assert.throws(() => validateAppCacheKey(htmlFor('deadbeef'), app, 'wrong-key fixture'), /does not match/);
assert.throws(() => validateAppCacheKey(`<script type="module" src="./app.js?v=${digest(app)}"></script><script type="module" src="./app.js?v=${digest(app)}"></script>`, app), /exactly one/);
assert.throws(() => validateAppCacheKey(`<script src="./app.js?v=${digest(app)}"></script>`, app), /as a module/);
assert.throws(() => validateAppCacheKey(`<script type="module" src="./app.js"></script>`, app), /exactly one v/);
assert.throws(() => validateAppCacheKey(`<script type="module" src="./app.js?v=${digest(app)}&x=1"></script>`, app), /exactly one v/);
assert.throws(() => validateAppCacheKey(`<script type="module" src="./other.js?v=${digest(app)}"></script>`, app), /exactly one executable/);
assert.throws(() => validateAppCacheKey(`<script type="module" src="./assets/app.js?v=${digest(app)}"></script>`, app), /published site root/);
assert.throws(() => validateAppCacheKey(`<script type="module" src="https://cdn.example/app.js?v=${digest(app)}"></script>`, app), /published site root/);
assert.equal(validateAppCacheKey(`<!-- <script type="module" src="./app.js?v=stale"></script> -->${htmlFor(digest(app))}`, app).cacheKey, digest(app));

const [html, actualApp] = await Promise.all([readFile('index.html', 'utf8'), readFile('app.js', 'utf8')]);
validateAppCacheKey(html, actualApp, 'repository');
const actualStyles = await readFile('styles.css', 'utf8');
const stylesKey = digest(actualStyles);
assert.equal(validateStylesCacheKey(stylesheetFor(stylesKey), actualStyles, 'matching stylesheet fixture').cacheKey, stylesKey);
assert.throws(() => validateStylesCacheKey(stylesheetFor(stylesKey), `${actualStyles}\n/* changed */`, 'stale stylesheet fixture'), /does not match/);
assert.throws(() => validateStylesCacheKey(stylesheetFor('deadbeef'), actualStyles, 'wrong stylesheet fixture'), /does not match/);
assert.throws(() => validateStylesCacheKey(`<link rel="stylesheet" href="./styles.css?v=${stylesKey}"><link rel="stylesheet" href="./styles.css?v=${stylesKey}">`, actualStyles), /exactly one/);
assert.throws(() => validateStylesCacheKey(`<link rel="stylesheet" href="./styles.css">`, actualStyles), /exactly one v/);
assert.throws(() => validateStylesCacheKey(`<link rel="stylesheet" href="./assets/styles.css?v=${stylesKey}">`, actualStyles), /published site root/);
assert.equal(validateStylesCacheKey(`<!-- <link rel="stylesheet" href="./styles.css?v=stale"> -->${stylesheetFor(stylesKey)}`, actualStyles).cacheKey, stylesKey);
process.stdout.write('Static cache-key regression: PASS (JS and CSS content changes require matching resource keys; invalid, duplicate, commented, and decoy references rejected)\n');
