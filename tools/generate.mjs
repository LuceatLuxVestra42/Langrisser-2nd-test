import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export function renderGenerated(canonical, jobLocalization) {
  const nameByJobId = new Map(jobLocalization.records.map(({ jobId, nameKo }) => [jobId, nameKo]));
  const heroes = [...canonical.records]
    .sort((a, b) => a.id - b.id)
    .map(({ id, nameEng, portrait, jobConnections }) => ({
      id,
      nameEng,
      portrait,
      jobConnections: jobConnections.map((relation) => {
        const jobNameKo = nameByJobId.get(relation.jobId);
        if (typeof jobNameKo !== 'string' || !jobNameKo) throw new Error(`Missing admitted Korean Job localization for JobInfo.ID ${relation.jobId}`);
        return { ...relation, jobNameKo };
      }),
    }));
  return `${JSON.stringify({ schemaVersion: 1, heroes }, null, 2)}\n`;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  const inputPath = resolve('canonical/heroes.v1.json');
  const localizationPath = resolve('canonical/job-localizations-ko.v1.json');
  const outputPath = resolve('generated/hero-slice.v1.json');
  const canonical = JSON.parse(await readFile(inputPath, 'utf8'));
  const jobLocalization = JSON.parse(await readFile(localizationPath, 'utf8'));
  await writeFile(outputPath, renderGenerated(canonical, jobLocalization), 'utf8');
  process.stdout.write(`Generated ${outputPath}\n`);
}
