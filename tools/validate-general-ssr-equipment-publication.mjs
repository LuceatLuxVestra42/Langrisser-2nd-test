import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { resolveCurrentGeneralSsrEquipmentIds, loadAndValidateGeneralSsrEquipmentIdentity } from './validate-general-ssr-equipment-identity.mjs';

const decisionPath = 'docs/decisions/general-ssr-equipment-publication.v1.json';
const excluded = [265, 266, 267, 268, 288, 289, 290, 291];
const expectedSource = { repository: 'LuceatLuxVestra42/langrisser-future-guide', commit: '57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff', path: 'data/presentation/equipment-public-admission-correction.v1.json', blob: 'e221735636a72ab80948149bae18e6691954d694', locator: 'excludedEquipmentIds; policy.scope; expectedPublicProjection' };
const fail = message => { throw new Error(`General SSR publication draft: ${message}`); };
const check = (condition, message) => { if (!condition) fail(message); };
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// This validates a proposal only: it cannot produce an approved public set.
export function validateGeneralSsrPublicationDraft({ canonical, contract, decision }) {
  const ids = resolveCurrentGeneralSsrEquipmentIds({ canonical, contract });
  check(decision && equal(Object.keys(decision).sort(), ['schemaVersion','status','semanticOwner','localizationOwner','baselineIdSetSha256','surface','excludedIds','proposedRule','source','approval','limitations'].sort()), 'invalid decision shape');
  check(decision.schemaVersion === 1 && decision.status === 'REVIEW_REQUIRED' && decision.approval === null, 'unapproved draft required');
  check(decision.semanticOwner === 'canonical/general-ssr-equipment.v1.json' && decision.localizationOwner === 'canonical/general-ssr-equipment-localizations-ko.v1.json', 'owner mismatch');
  check(decision.baselineIdSetSha256 === contract.population.canonicalBaseline.sortedIdSetSha256, 'baseline mismatch');
  check(decision.surface === 'generated/general-ssr-equipment.v1.json public general equipment list and detail', 'surface mismatch');
  check(decision.proposedRule === 'exact reviewed canonical baseline minus excludedIds', 'rule mismatch');
  check(equal(decision.source, expectedSource), 'source mismatch');
  check(equal(decision.excludedIds, excluded), 'excluded ID set mismatch');
  check(new Set(decision.excludedIds).size === 8 && decision.excludedIds.every(id => ids.includes(id)), 'excluded ID not in baseline');
  check(typeof decision.limitations === 'string' && decision.limitations.includes('No canonical identity or localization change, alias or replacement claim'), 'limitations mismatch');
  const proposedIds = ids.filter(id => !decision.excludedIds.includes(id));
  check(proposedIds.length === 198, 'proposed count mismatch');
  return { status: 'REVIEW_REQUIRED', proposedCount: proposedIds.length, admission: 'NOT_APPROVED', publication: 'NOT_APPROVED' };
}

export async function loadAndValidateGeneralSsrPublicationDraft(root = process.cwd()) {
  await loadAndValidateGeneralSsrEquipmentIdentity(root);
  const read = async p => JSON.parse(await readFile(resolve(root, p), 'utf8'));
  const [canonical, contract, decision] = await Promise.all([read('canonical/general-ssr-equipment.v1.json'), read('evidence/source/equipment/general-ssr-equipment-population-contract.v1.json'), read(decisionPath)]);
  return validateGeneralSsrPublicationDraft({ canonical, contract, decision });
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const result = await loadAndValidateGeneralSsrPublicationDraft();
  console.log(`General SSR publication proposal: ${result.status}; ${result.proposedCount} proposed; publication ${result.publication}`);
}
