import assert from 'node:assert/strict';
import { cp, mkdtemp, mkdir, readFile, rm, writeFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { renderSkinConsumer } from './generate.mjs';

const paths = [
  'canonical/skin-identities.v1.json',
  'canonical/skin-hero-relations-m02.v1.json',
  'canonical/skin-source-orders-m02.v1.json',
  'canonical/hero-identities.v1.json',
  'generated/skin-consumer.v1.json',
];
const validatorPath = 'tools/validate-skin-generated.mjs';
const original = new Map(await Promise.all(paths.map(async (path) => [path, await readFile(path, 'utf8')])));
const temp = await mkdtemp(join(tmpdir(), 'skin-generated-m03-'));
const put = async (path, data) => {
  await mkdir(dirname(join(temp, path)), { recursive: true });
  await writeFile(join(temp, path), data);
};
const putJson = (path, value) => put(path, `${JSON.stringify(value, null, 2)}\n`);
const reset = async () => {
  for (const [path, content] of original) await put(path, content);
};
const run = () => spawnSync(process.execPath, [validatorPath], { cwd: temp, encoding: 'utf8' });
const diagnostic = (result) => `${result.stdout}\n${result.stderr}`;
const cases = [
  ['missing Skin identity', 'canonical/skin-identities.v1.json', (value) => value.records.pop(), /M01 Skin Identity: missing or additional Skin IDs/],
  ['duplicate Skin identity', 'canonical/skin-identities.v1.json', (value) => { value.records[1].skinId = 102; }, /M01 Skin Identity: duplicate IDs/],
  ['extra Skin identity', 'canonical/skin-identities.v1.json', (value) => value.records.push({ skinId: 301, provenance: 'fixture' }), /M01 Skin Identity: missing or additional Skin IDs/],
  ['identity scope field injection', 'canonical/skin-identities.v1.json', (value) => { value.records[0].heroId = 1; }, /M01 Skin 102: fields drift/],
  ['wrong Hero ownership', 'canonical/skin-hero-relations-m02.v1.json', (value) => { value.records[0].heroId = 3; }, /M02 Ownership drift for Skin 102/],
  ['invalid Hero foreign key', 'canonical/skin-hero-relations-m02.v1.json', (value) => { value.records[0].heroId = 999; }, /invalid Hero FK for Skin 102/],
  ['missing ownership', 'canonical/skin-hero-relations-m02.v1.json', (value) => value.records.pop(), /M02 Ownership: missing or additional Skin IDs/],
  ['multiple ownership claims', 'canonical/skin-hero-relations-m02.v1.json', (value) => value.records.push({ ...value.records[0] }), /M02 Ownership: duplicate IDs/],
  ['extra ownership endpoint', 'canonical/skin-hero-relations-m02.v1.json', (value) => value.records.push({ skinId: 301, heroId: 1, provenance: 'fixture' }), /M02 Ownership: missing or additional Skin IDs/],
  ['missing Source Order', 'canonical/skin-source-orders-m02.v1.json', (value) => value.records.pop(), /M02 Source Order: missing or additional Skin IDs/],
  ['wrong Source Order', 'canonical/skin-source-orders-m02.v1.json', (value) => { value.records[0].sourceOrder = 5; }, /M02 Source Order drift for Skin 102/],
  ['duplicate Source Order', 'canonical/skin-source-orders-m02.v1.json', (value) => { value.records[1].sourceOrder = 1; }, /duplicate Source Order 1/],
  ['stale Generated file', 'generated/skin-consumer.v1.json', (value) => { value.skins[0].sourceOrder = 4; }, /Generated output is stale/],
  ['Generated and Canonical disagree', 'generated/skin-consumer.v1.json', (value) => { value.skins[0].heroId = 3; }, /Generated output is stale/],
  ['Generated scope field injection', 'generated/skin-consumer.v1.json', (value) => { value.skins[0].nameKo = 'guess'; }, /Generated Skin 102: fields drift/],
  ['coordinated Canonical and Generated tamper', 'BOTH', (canonical, generated) => {
    canonical.records[0].heroId = 3;
    generated.skins[0].heroId = 3;
  }, /M02 Ownership drift for Skin 102/],
  ['missing relation owner has no fallback', 'REMOVE_RELATION_OWNER', null, /ENOENT/],
  ['missing Source Order owner has no fallback', 'REMOVE_ORDER_OWNER', null, /ENOENT/],
];

function sortedIdFixture() {
  const identities = { schemaVersion: 1, records: [80, 12, 50].map((skinId) => ({ skinId, provenance: `identity:${skinId}` })) };
  const relations = { schemaVersion: 1, records: [
    { skinId: 12, heroId: 7, provenance: 'relation:12' },
    { skinId: 80, heroId: 1, provenance: 'relation:80' },
    { skinId: 50, heroId: 3, provenance: 'relation:50' },
  ] };
  const orders = { schemaVersion: 1, records: [
    { skinId: 12, sourceOrder: 3, provenance: 'order:12' },
    { skinId: 80, sourceOrder: 2, provenance: 'order:80' },
    { skinId: 50, sourceOrder: 1, provenance: 'order:50' },
  ] };
  const heroes = { schemaVersion: 1, records: [1, 3, 7].map((heroId) => ({ heroId, provenance: `hero:${heroId}` })) };
  return { identities, relations, orders, heroes };
}

try {
  await mkdir(join(temp, 'tools'), { recursive: true });
  await cp(validatorPath, join(temp, validatorPath));
  await reset();
  assert.equal(run().status, 0, 'valid Canonical-backed Generated consumer must pass');

  for (const [label, path, mutate, expected] of cases) {
    await reset();
    if (path === 'BOTH') {
      const canonical = JSON.parse(original.get('canonical/skin-hero-relations-m02.v1.json'));
      const generated = JSON.parse(original.get('generated/skin-consumer.v1.json'));
      mutate(canonical, generated);
      await putJson('canonical/skin-hero-relations-m02.v1.json', canonical);
      await putJson('generated/skin-consumer.v1.json', generated);
    } else if (path === 'REMOVE_RELATION_OWNER') {
      await unlink(join(temp, 'canonical/skin-hero-relations-m02.v1.json'));
    } else if (path === 'REMOVE_ORDER_OWNER') {
      await unlink(join(temp, 'canonical/skin-source-orders-m02.v1.json'));
    } else {
      const value = JSON.parse(original.get(path));
      mutate(value);
      await putJson(path, value);
    }
    const result = run();
    assert.notEqual(result.status, 0, `${label} must fail`);
    assert.match(diagnostic(result), expected, label);
  }

  const fixture = sortedIdFixture();
  const output = renderSkinConsumer(fixture.identities, fixture.relations, fixture.orders, fixture.heroes);
  assert.deepEqual(JSON.parse(output).skins, [
    { skinId: 50, heroId: 3, sourceOrder: 1 },
    { skinId: 80, heroId: 1, sourceOrder: 2 },
    { skinId: 12, heroId: 7, sourceOrder: 3 },
  ], 'fixture must follow the Canonical Source Order even when SkinID numeric order differs');
  assert.equal(renderSkinConsumer(
    { ...fixture.identities, records: [...fixture.identities.records].reverse() },
    { ...fixture.relations, records: [...fixture.relations.records].reverse() },
    { ...fixture.orders, records: [...fixture.orders.records].reverse() },
    fixture.heroes,
  ), output, 'row input order must not change deterministic Source Order output');
  assert.throws(() => renderSkinConsumer(fixture.identities, { ...fixture.relations, records: fixture.relations.records.slice(1) }, fixture.orders, fixture.heroes), /populations differ|Missing ownership/);
  assert.throws(() => renderSkinConsumer(fixture.identities, { ...fixture.relations, records: [...fixture.relations.records, fixture.relations.records[0]] }, fixture.orders, fixture.heroes), /Multiple ownership/);
  assert.throws(() => renderSkinConsumer(fixture.identities, fixture.relations, { ...fixture.orders, records: fixture.orders.records.map((row) => ({ ...row, sourceOrder: 1 })) }, fixture.heroes), /Duplicate Source Order/);
  process.stdout.write(`Skin Generated tests: PASS (${cases.length} failure controls, nonnumeric-order fixture, deterministic join and owner-boundary failures)\n`);
} finally {
  await rm(temp, { recursive: true, force: true });
}
