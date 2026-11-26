import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { isDeepStrictEqual } from 'node:util';
import { loadHero15SoldierInputs, renderHero15SoldierInternal } from './hero-15-soldier-internal-consumer.mjs';
import { loadAndValidateSoldierIdentity, privateNormalIdentityEvidencePath } from './validate-soldier-identity.mjs';
import { loadValidatedNormalSoldierKoLocalization } from './validate-normal-soldier-ko-localization.mjs';

export const HERO_15_SOLDIER_TEXT_DECISION = 'docs/decisions/hero-15-soldier-text-publication.v1.json';
export const HERO_15_SOLDIER_TEXT_PUBLIC = 'generated/hero-15-soldier-text-public.v1.json';

// Fixed by the user approval and independently checked against the admitted owners.
const approvedRows = [
  { soldierId: 806, namespace: 'NORMAL', nameKo: '무녀' },
  { soldierId: 817, namespace: 'NORMAL', nameKo: '바람과 꽃을 찬송하는 자' },
  { soldierId: 819, namespace: 'NORMAL', nameKo: '산별 구조대' },
];
const approvedSha256 = 'ca58476f1948483015630e217047a43e6107b4ec4f328cd57b3fdca35b2c9231';

export function validateHero15SoldierTextDecision(decision) {
  if (!isDeepStrictEqual(decision, {
    schemaVersion: 1, status: 'APPROVED', heroId: 15, surface: 'hero-minimal-detail-15',
    section: 'soldiers', display: 'TEXT_ONLY', approvalMessageId: 'bbb219e9-bea1-4d1e-858e-04f603a20c1e',
    soldiers: approvedRows,
  })) {
    throw new Error('Hero 15 Soldier text decision differs from the independently approved ordered scope');
  }
  return decision;
}

export async function readHero15SoldierTextInputs() {
  const [decision, relationInputs, { canonical, population }, tierDecision, rankEvidence] = await Promise.all([
    readFile(HERO_15_SOLDIER_TEXT_DECISION, 'utf8').then(JSON.parse),
    loadHero15SoldierInputs(),
    loadValidatedNormalSoldierKoLocalization(process.cwd()),
    readFile('docs/decisions/hero-15-soldier-text-tier-publication.v1.json', 'utf8').then(JSON.parse),
    readFile(privateNormalIdentityEvidencePath),
    loadAndValidateSoldierIdentity(),
  ]);
  // Bind the Rank values consumed here to the same bytes authenticated by the Identity owner.
  if (createHash('sha256').update(rankEvidence).digest('hex') !== 'f5facc70a31c40fe15b09f7bd597dcb298ac820184ada0f6f2f91dc64728c788') {
    throw new Error('Hero 15 Soldier tier evidence SHA-256 mismatch');
  }
  const rankRows = JSON.parse(rankEvidence.toString('utf8')).records.map(({ rawFields }) => ({
    soldierId: rawFields.ID, rank: rawFields.Rank,
  }));
  return { decision, tierDecision, rankRows, relationInputs, names: canonical.records, publicIdentities: population.identities.records };
}

export function renderHero15SoldierText({ decision, tierDecision, rankRows, relationInputs, names, publicIdentities }) {
  validateHero15SoldierTextDecision(decision);
  const approvedTiers = approvedRows.map(row => ({ ...row, rank: 3 }));
  if (!isDeepStrictEqual(tierDecision, {
    schemaVersion: 1, status: 'APPROVED', heroId: 15, surface: 'hero-minimal-detail-15',
    section: 'soldiers', display: 'T3_PREFIX_TEXT_ONLY', approvalMessageId: '48a8bc75-6dbb-42c3-83b9-a185c0d0d25c',
    rankSource: privateNormalIdentityEvidencePath, soldiers: approvedTiers,
  })) throw new Error('Hero 15 Soldier tier decision differs from the approved ordered scope');
  if (!isDeepStrictEqual(rankRows, approvedTiers.map(({ soldierId, rank }) => ({ soldierId, rank })))) {
    throw new Error('Hero 15 Soldier Rank evidence differs from the approved tiers');
  }
  const { records } = JSON.parse(renderHero15SoldierInternal(relationInputs));
  const soldiers = approvedRows.map(({ soldierId, namespace, nameKo }) => {
    const [relation] = records.filter(row => row.soldierId === soldierId);
    const matches = names.filter(row => row.soldierId === soldierId);
    if (relation?.soldierIdentity.variant !== namespace || matches.length !== 1 || matches[0].nameKo !== nameKo
      || publicIdentities.some(row => row.id === soldierId)) {
      throw new Error(`Hero 15 Soldier text Owner or public endpoint mismatch for ${soldierId}`);
    }
    return { soldierId, namespace, nameKo: matches[0].nameKo };
  });
  return `${JSON.stringify({ schemaVersion: 1, heroId: 15, soldiers }, null, 2)}\n`;
}

export function validateHero15SoldierTextBytes(bytes, app) {
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  if (sha256 !== approvedSha256) throw new Error('Hero 15 Soldier text bytes differ from the approved SHA-256');
  const fetchCall = /fetch\('\.\/generated\/hero-15-soldier-text-public\.v1\.json', \{ integrity: 'sha256-([A-Za-z0-9+/]+={0,2})' \}\)/g;
  const [match, duplicate] = app.matchAll(fetchCall);
  if (!match || duplicate || match[1] !== Buffer.from(sha256, 'hex').toString('base64')) {
    throw new Error('Hero 15 Soldier text app integrity does not match the approved bytes');
  }
}

export function validateHero15SoldierText({ bytes, app, inputs }) {
  if (!bytes.equals(Buffer.from(renderHero15SoldierText(inputs)))) {
    throw new Error('Hero 15 Soldier text Generated bytes are stale or outside the approved scope');
  }
  validateHero15SoldierTextBytes(bytes, app);
}
