import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const OUTPUT = 'generated/hero-15-awakening-internal.v1.json';
export const SCOPE = 'Internal projection only; source references and raw fields do not establish unlock, completion, consumption, skill acquisition, equip, activation, combat, asset, or publication semantics.';
export async function loadAwakeningInputs(root = process.cwd()) {
  const read = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'));
  const [references, details, skills] = await Promise.all([
    read('canonical/hero-awakening-references.v1.json'),
    read('canonical/awakening-level-raw-details.v1.json'),
    read('canonical/skills.v1.json'),
  ]);
  return { references, details, skills };
}
export function renderAwakeningInternal({ references, details, skills }) {
  if (references.records.length !== 1 || references.records[0].heroId !== 15) throw new Error('Hero 15 scope required');
  const ref = references.records[0];
  const one = (rows, field, id) => {
    const matches = rows.filter(row => row[field] === id);
    if (matches.length !== 1) throw new Error(`Expected one ${field}=${id}`);
    return matches[0];
  };
  const stage = (reference, goods) => ({ reference, goods, detail: one(details.records, 'levelId', reference.levelId) });
  const result = {
    schemaVersion: 1, scope: SCOPE,
    heroId: ref.heroId, awakenInfoId: ref.awakenInfoId,
    awakeningSourceNamespace: ref.awakeningSourceNamespace, evidenceProvenance: ref.evidenceProvenance,
    stage1: stage(ref.stage1LevelReference, ref.stage1SourceGoods),
    stage2: { ...stage(ref.stage2LevelReference, ref.stage2SourceGoods), skillReference: ref.stage2SkillReference,
      skillIdentity: one(skills.records, 'skillId', ref.stage2SkillReference.skillId) },
  };
  return `${JSON.stringify(result, null, 2)}\n`;
}
