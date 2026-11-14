import { validateFullDetailPublicPopulationFromRoot } from './full-detail-public-population-contract.mjs';

await validateFullDetailPublicPopulationFromRoot();
console.log('Full Detail Public Population: PASS (approved endpoint IDs only; Canonical-only records are not projected)');
