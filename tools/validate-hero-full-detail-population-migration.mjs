import { validateHeroFullDetailPopulationMigrationFromRoot } from './hero-full-detail-population-migration-contract.mjs';

await validateHeroFullDetailPopulationMigrationFromRoot(process.cwd());
process.stdout.write('Hero Full Detail population migration contract: PASS (baseline preserved; Canonical admission and public population checked independently)\n');
