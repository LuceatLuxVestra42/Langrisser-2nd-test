import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { renderJobGlossary } from './generate.mjs';

const exactKeys = (value, expected, label) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || JSON.stringify(Object.keys(value).sort()) !== JSON.stringify([...expected].sort())) {
    throw new Error(`${label} schema fields do not match exactly`);
  }
};

export function validateJobGlossary(jobLocalization, generatedText) {
  const canonical = jobLocalization.records;
  if (!Array.isArray(canonical)) throw new Error('canonical Job localization records are missing');
  const canonicalIds = canonical.map((record) => record.jobId);
  if (canonicalIds.some((id) => !Number.isInteger(id)) || new Set(canonicalIds).size !== canonicalIds.length) {
    throw new Error('canonical Job localization IDs are invalid or duplicated');
  }
  if (canonical.some(({ nameKo }) => typeof nameKo !== 'string' || !nameKo.trim())) {
    throw new Error('canonical Job localization contains a missing Korean name');
  }

  let generated;
  try { generated = JSON.parse(generatedText); } catch { throw new Error('generated Job glossary is not valid JSON'); }
  exactKeys(generated, ['schemaVersion', 'jobs'], 'generated glossary');
  if (generated.schemaVersion !== 1 || !Array.isArray(generated.jobs)) throw new Error('unsupported generated Job glossary schema');
  if (generated.jobs.length !== canonical.length) throw new Error('generated Job glossary record count does not match canonical');
  const generatedIds = generated.jobs.map((record) => record?.jobId);
  if (generatedIds.some((id) => !Number.isInteger(id)) || new Set(generatedIds).size !== generatedIds.length) {
    throw new Error('generated Job glossary IDs are invalid or duplicated');
  }
  const canonicalSet = new Set(canonicalIds);
  if (generatedIds.some((id) => !canonicalSet.has(id))) throw new Error('generated Job glossary ID set does not match canonical');
  const nameById = new Map(canonical.map(({ jobId, nameKo }) => [jobId, nameKo]));
  generated.jobs.forEach((record) => {
    exactKeys(record, ['jobId', 'nameKo'], `generated Job ${record.jobId}`);
    if (record.nameKo !== nameById.get(record.jobId)) throw new Error(`generated Korean name does not match canonical Job ${record.jobId}`);
  });
  if (generatedIds.some((id, index) => index > 0 && generatedIds[index - 1] >= id)) {
    throw new Error('generated Job glossary is not in ascending numeric Job ID order');
  }
  if (generatedText !== renderJobGlossary(jobLocalization)) throw new Error('generated Job glossary is stale or non-deterministic');
  return generated;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  const [canonicalText, generatedText] = await Promise.all([
    readFile(resolve('canonical/job-localizations-ko.v1.json'), 'utf8'),
    readFile(resolve('generated/job-glossary.v1.json'), 'utf8'),
  ]);
  const canonical = JSON.parse(canonicalText);
  const generated = validateJobGlossary(canonical, generatedText);
  process.stdout.write(`Job glossary presentation: PASS (${generated.jobs.length} records; exact canonical labels and deterministic ordering)\n`);
}
