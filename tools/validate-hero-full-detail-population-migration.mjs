import { validateHeroFullDetailPopulationMigrationFromRoot } from './hero-full-detail-population-migration-contract.mjs';

await validateHeroFullDetailPopulationMigrationFromRoot(process.cwd());
process.stdout.write('Hero Full Detail population migration contract: PASS (29 current records preserved; Hero 15 proposal non-effective; publication and portrait/schema gates separate)\n');
