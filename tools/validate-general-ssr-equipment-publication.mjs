import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { resolveCurrentGeneralSsrEquipmentIds, loadAndValidateGeneralSsrEquipmentIdentity } from './validate-general-ssr-equipment-identity.mjs';

export const GENERAL_SSR_PUBLICATION_DECISION_PATH = 'docs/decisions/general-ssr-equipment-publication.v1.json';
export const GENERAL_SSR_EXCLUDED_PUBLIC_IDS = Object.freeze([265, 266, 267, 268, 288, 289, 290, 291]);
const expectedSurface = ['GENERAL_SSR_LIST', 'GENERAL_SSR_SEARCH', 'GENERAL_SSR_PUBLIC_DETAIL_IF_PRESENT'];
const expectedRule = 'the exact reviewed 206-ID canonical baseline minus excludedIds; no future IDs are included';
const expectedLegacyEvidence = {
  repository: 'LuceatLuxVestra42/langrisser-future-guide',
  commit: '57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff',
  path: 'data/presentation/equipment-public-admission-correction.v1.json',
  blob: 'e221735636a72ab80948149bae18e6691954d694',
  locator: 'excludedEquipmentIds; policy.scope; expectedPublicProjection',
};
const fail = message => { throw new Error(`General SSR publication: ${message}`); };
const check = (condition, message) => { if (!condition) fail(message); };
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const keys = (value, expected, label) => check(value && equal(Object.keys(value).sort(), [...expected].sort()), `${label} shape mismatch`);

function validateApproval(decision) {
  keys(decision.approval, ['source','verification','messageId','url','timestamp','limitations'], 'approval provenance');
  check(decision.approval.source === "user-provided screenshot showing the approval question and the user's reply in the same conversation view", 'approval source mismatch');
  check(decision.approval.verification === 'visually reviewed in this conversation; approval scope matched against PR #211 decision scope', 'approval verification mismatch');
  check(decision.approval.messageId === 'NOT_AVAILABLE' && decision.approval.url === 'NOT_AVAILABLE' && decision.approval.timestamp === 'NOT_AVAILABLE', 'unverified approval identifier must remain unavailable');
  check(decision.approval.limitations === 'Screenshot confirms displayed request-response context and wording; it does not expose message identifier, source URL, or exact time.', 'approval limitation mismatch');
}

function validateLimitations(limitations) {
  keys(limitations, ['canonicalIdentity','localization','aliasReplacement','futureEquipmentAutoPublication','newSemanticAdmission'], 'limitations');
  check(limitations.canonicalIdentity === 'unchanged' && limitations.localization === 'unchanged'
    && limitations.aliasReplacement === 'NOT_APPROVED' && limitations.futureEquipmentAutoPublication === 'NOT_APPROVED'
    && limitations.newSemanticAdmission === 'NOT_APPROVED', 'publication limitations mismatch');
}

export function validateGeneralSsrPublication({ canonical, localization, contract, decision }) {
  const ids = resolveCurrentGeneralSsrEquipmentIds({ canonical, contract });
  check(ids.length === 206, 'canonical baseline must contain exactly 206 IDs');
  check(decision && decision.schemaVersion === 1, 'unsupported decision schema');
  check(decision.semanticOwner === 'canonical/general-ssr-equipment.v1.json'
    && decision.localizationOwner === 'canonical/general-ssr-equipment-localizations-ko.v1.json', 'owner mismatch');
  const baselineDigest = contract?.population?.canonicalBaseline?.sortedIdSetSha256;
  check(typeof baselineDigest === 'string' && decision.baselineIdSetSha256 === baselineDigest, 'baseline digest mismatch');
  check(Array.isArray(localization?.records), 'localization records missing');
  const localizationIds = localization.records.map(row => row.equipmentId);
  check(localization.records.length === ids.length && new Set(localizationIds).size === localizationIds.length
    && ids.every(id => localizationIds.includes(id)), 'localization baseline must exactly match canonical');
  check(Array.isArray(decision.excludedIds) && equal(decision.excludedIds, GENERAL_SSR_EXCLUDED_PUBLIC_IDS), 'excluded ID set mismatch');
  check(new Set(decision.excludedIds).size === 8 && decision.excludedIds.every(id => ids.includes(id)), 'excluded IDs must be unique members of baseline');

  if (decision.status === 'REVIEW_REQUIRED') {
    keys(decision, ['schemaVersion','status','semanticOwner','localizationOwner','baselineIdSetSha256','surface','excludedIds','proposedRule','source','approval','limitations'], 'review decision');
    check(decision.approval === null, 'review decision cannot contain approval');
    check(decision.surface === 'generated/general-ssr-equipment.v1.json public general equipment list and detail', 'review surface mismatch');
    check(decision.proposedRule === 'exact reviewed canonical baseline minus excludedIds', 'review rule mismatch');
    check(equal(decision.source, expectedLegacyEvidence), 'legacy evidence mismatch');
    check(typeof decision.limitations === 'string' && decision.limitations.includes('No canonical identity or localization change, alias or replacement claim'), 'review limitations mismatch');
    return { status: 'REVIEW_REQUIRED', proposedCount: ids.length - decision.excludedIds.length, approvedPublicIds: [], publication: 'NOT_APPROVED' };
  }

  keys(decision, ['schemaVersion','status','decisionType','targetRepository','semanticOwner','localizationOwner','baselineIdSetSha256','approvedPublicCount','excludedIds','surface','publicIdRule','approval','legacyEvidence','limitations'], 'approved decision');
  check(decision.status === 'APPROVED' && decision.decisionType === 'GENERAL_SSR_PUBLICATION'
    && decision.targetRepository === 'LuceatLuxVestra42/Langrisser-2nd-test', 'approval target mismatch');
  check(decision.approvedPublicCount === 198 && equal(decision.surface, expectedSurface), 'approved scope mismatch');
  check(decision.publicIdRule === expectedRule, 'approved ID rule mismatch');
  check(equal(decision.legacyEvidence, expectedLegacyEvidence), 'legacy evidence locator mismatch');
  validateApproval(decision);
  validateLimitations(decision.limitations);
  const approvedPublicIds = ids.filter(id => !decision.excludedIds.includes(id));
  check(approvedPublicIds.length === 198, 'approved public population mismatch');
  return { status: 'APPROVED', proposedCount: 198, approvedPublicIds, publication: 'APPROVED' };
}

export async function loadAndValidateGeneralSsrPublication(root = process.cwd()) {
  await loadAndValidateGeneralSsrEquipmentIdentity(root);
  const read = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'));
  const [canonical, localization, contract, decision] = await Promise.all([
    read('canonical/general-ssr-equipment.v1.json'),
    read('canonical/general-ssr-equipment-localizations-ko.v1.json'),
    read('evidence/source/equipment/general-ssr-equipment-population-contract.v1.json'),
    read(GENERAL_SSR_PUBLICATION_DECISION_PATH),
  ]);
  return validateGeneralSsrPublication({ canonical, localization, contract, decision });
}

export async function loadAndValidateGeneralSsrPublicationForGenerator(root = process.cwd()) {
  const read = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'));
  const [canonical, localization, contract, decision] = await Promise.all([
    read('canonical/general-ssr-equipment.v1.json'),
    read('canonical/general-ssr-equipment-localizations-ko.v1.json'),
    read('evidence/source/equipment/general-ssr-equipment-population-contract.v1.json'),
    read(GENERAL_SSR_PUBLICATION_DECISION_PATH),
  ]);
  const result = validateGeneralSsrPublication({ canonical, localization, contract, decision });
  check(result.status === 'APPROVED', 'publication decision is not approved; public generation is blocked');
  return { decision, contract, result };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const result = await loadAndValidateGeneralSsrPublication();
  console.log(`General SSR publication: ${result.status}; ${result.approvedPublicIds.length || result.proposedCount} public IDs; publication ${result.publication}`);
}
