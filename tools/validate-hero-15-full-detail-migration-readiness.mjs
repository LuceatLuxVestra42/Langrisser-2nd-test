import { validateHero15FullDetailMigrationReadinessFromRoot } from './hero-15-full-detail-migration-readiness-contract.mjs';

await validateHero15FullDetailMigrationReadinessFromRoot();
console.log('Hero 15 Full Detail migration readiness: PASS (record data not ready; migration/publication remain gated)');
