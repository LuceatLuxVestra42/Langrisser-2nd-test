import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const paths = {
  skinIdentities: 'canonical/skin-identities.v1.json',
  ownership: 'canonical/skin-hero-relations-m02.v1.json',
  sourceOrders: 'canonical/skin-source-orders-m02.v1.json',
  heroIdentities: 'canonical/hero-identities.v1.json',
  generated: 'generated/skin-consumer.v1.json',
};
const admittedClaims = [
  { skinId: 102, heroId: 1, sourceOrder: 1 },
  { skinId: 103, heroId: 1, sourceOrder: 2 },
  { skinId: 104, heroId: 1, sourceOrder: 3 },
  { skinId: 105, heroId: 1, sourceOrder: 4 },
];
const approvedIds = admittedClaims.map((row) => row.skinId);
const fail = (message) => { throw new Error(`Skin Generated validation failed: ${message}`); };
const check = (condition, message) => { if (!condition) fail(message); };
const equal = (actual, expected, message) => check(isDeepStrictEqual(actual, expected), message);

function exactKeys(value, fields, label) {
  check(value && typeof value === 'object' && !Array.isArray(value), `${label}: object required`);
  equal(Object.keys(value).sort(), [...fields].sort(), `${label}: fields drift`);
}

function exactPopulation(rows, field, label) {
  check(Array.isArray(rows), `${label}: records array required`);
  const ids = rows.map((row) => row?.[field]);
  check(ids.every(Number.isSafeInteger), `${label}: integer IDs required`);
  check(new Set(ids).size === ids.length, `${label}: duplicate IDs`);
  equal([...ids].sort((a, b) => a - b), approvedIds, `${label}: missing or additional Skin IDs`);
}

export async function validateSkinGenerated(root = process.cwd()) {
  const readText = (path) => readFile(resolve(root, path), 'utf8');
  const [skinText, ownershipText, orderText, heroText, generatedText] = await Promise.all([
    readText(paths.skinIdentities), readText(paths.ownership), readText(paths.sourceOrders),
    readText(paths.heroIdentities), readText(paths.generated),
  ]);
  const skinIdentities = JSON.parse(skinText);
  const ownership = JSON.parse(ownershipText);
  const sourceOrders = JSON.parse(orderText);
  const heroIdentities = JSON.parse(heroText);
  const generated = JSON.parse(generatedText);

  exactKeys(skinIdentities, ['schemaVersion', 'scope', 'sourceEvidence', 'records'], 'M01 Skin Identity Canonical');
  check(skinIdentities.schemaVersion === 1
    && skinIdentities.scope === 'M01: source-native Skin Identity 102, 103, 104, 105 only; historical China ConfigData snapshot, not global Skin completeness or current release status.'
    && skinIdentities.sourceEvidence === 'evidence/source/skin-identity-m01.v1.json', 'M01 Identity owner contract drift');
  exactPopulation(skinIdentities.records, 'skinId', 'M01 Skin Identity');
  const identityById = new Map();
  for (const row of skinIdentities.records) {
    exactKeys(row, ['skinId', 'provenance'], `M01 Skin ${row.skinId}`);
    check(row.provenance === `evidence/source/skin-identity-m01.v1.json#records/skinId=${row.skinId}`,
      `M01 Identity provenance pointer drift for Skin ${row.skinId}`);
    identityById.set(row.skinId, row);
  }

  exactKeys(ownership, ['schemaVersion', 'scope', 'sourceEvidence', 'records'], 'M02 Ownership Canonical');
  check(ownership.schemaVersion === 1
    && ownership.scope === 'M02 Skin→Hero ownership for the four Skin identities admitted by M01; no other Skin or Hero population is implied.'
    && ownership.sourceEvidence === 'evidence/source/skin-hero-relations-m02.v1.json', 'M02 Ownership owner contract drift');
  exactPopulation(ownership.records, 'skinId', 'M02 Ownership');
  exactKeys(sourceOrders, ['schemaVersion', 'scope', 'sourceEvidence', 'records'], 'M02 Source Order Canonical');
  check(sourceOrders.schemaVersion === 1
    && sourceOrders.scope === 'One-based Source Order for the four M01 Skin identities in ConfigDataHeroInfo.ID=1 at the pinned historical source snapshot only.'
    && sourceOrders.sourceEvidence === 'evidence/source/skin-source-orders-m02.v1.json', 'M02 Source Order owner contract drift');
  exactPopulation(sourceOrders.records, 'skinId', 'M02 Source Order');

  exactKeys(heroIdentities, ['schemaVersion', 'scope', 'records'], 'Hero Identity Canonical');
  check(heroIdentities.schemaVersion === 1 && Array.isArray(heroIdentities.records), 'Hero Identity owner schema drift');
  const heroIds = new Set();
  for (const row of heroIdentities.records) {
    exactKeys(row, ['heroId', 'provenance'], `Hero identity ${row?.heroId}`);
    check(Number.isSafeInteger(row.heroId) && row.heroId > 0
      && typeof row.provenance === 'string' && row.provenance.trim(), 'malformed Hero identity endpoint');
    check(!heroIds.has(row.heroId), `duplicate Hero identity ${row.heroId}`);
    heroIds.add(row.heroId);
  }
  check(heroIds.has(1), 'Hero FK 1 is absent from Hero Identity Canonical');

  const relationById = new Map();
  for (const row of ownership.records) {
    exactKeys(row, ['skinId', 'heroId', 'provenance'], `M02 Ownership claim ${row.skinId}`);
    check(identityById.has(row.skinId), `Ownership references missing Skin ${row.skinId}`);
    check(Number.isSafeInteger(row.heroId) && heroIds.has(row.heroId), `invalid Hero FK for Skin ${row.skinId}`);
    check(row.provenance === `evidence/source/skin-hero-relations-m02.v1.json#records/skinId=${row.skinId}`,
      `Ownership provenance pointer drift for Skin ${row.skinId}`);
    check(!relationById.has(row.skinId), `multiple Ownership claims for Skin ${row.skinId}`);
    relationById.set(row.skinId, row.heroId);
  }

  const orderById = new Map();
  const uniqueOrders = new Set();
  for (const row of sourceOrders.records) {
    exactKeys(row, ['skinId', 'sourceOrder', 'provenance'], `M02 Source Order claim ${row.skinId}`);
    check(identityById.has(row.skinId), `Source Order references missing Skin ${row.skinId}`);
    check(Number.isSafeInteger(row.sourceOrder) && row.sourceOrder > 0, `malformed Source Order for Skin ${row.skinId}`);
    check(row.provenance === `evidence/source/skin-source-orders-m02.v1.json#records/skinId=${row.skinId}`,
      `Source Order provenance pointer drift for Skin ${row.skinId}`);
    check(!orderById.has(row.skinId), `multiple Source Order claims for Skin ${row.skinId}`);
    check(!uniqueOrders.has(row.sourceOrder), `duplicate Source Order ${row.sourceOrder}`);
    orderById.set(row.skinId, row.sourceOrder);
    uniqueOrders.add(row.sourceOrder);
  }

  const canonicalRows = admittedClaims.map(({ skinId, heroId, sourceOrder }) => {
    check(identityById.has(skinId), `admitted M03 Skin ${skinId} is missing from M01`);
    check(relationById.get(skinId) === heroId, `M02 Ownership drift for Skin ${skinId}`);
    check(orderById.get(skinId) === sourceOrder, `M02 Source Order drift for Skin ${skinId}`);
    return { skinId, heroId, sourceOrder };
  });
  exactKeys(generated, ['schemaVersion', 'skins'], 'Generated Skin consumer');
  check(generated.schemaVersion === 1 && Array.isArray(generated.skins), 'Generated Skin consumer schema drift');
  exactPopulation(generated.skins, 'skinId', 'Generated Skin consumer');
  for (const row of generated.skins) exactKeys(row, ['skinId', 'heroId', 'sourceOrder'], `Generated Skin ${row.skinId}`);

  const expectedText = `${JSON.stringify({ schemaVersion: 1, skins: canonicalRows }, null, 2)}\n`;
  equal(generatedText, expectedText, 'Generated output is stale or differs from the independent Canonical projection');
  process.stdout.write('Skin Generated validator: PASS (four exact IDs; Identity, Ownership and Source Order Canonical parity; internal-only schema)\n');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await validateSkinGenerated();
