import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadInputs, validateSkillDetailProjection } from './hero-15-skill-detail-internal.mjs';

const { references, skills } = await loadInputs();
const generated = await readFile('generated/hero-15-skill-detail-internal.v1.json', 'utf8');
validateSkillDetailProjection(references, skills, generated);
let rejected = 0;
const reject = (label, refs = references, identities = skills, text = generated) => {
  assert.throws(() => validateSkillDetailProjection(refs, identities, text), undefined, label);
  rejected += 1;
};
const editGenerated = (fn) => {
  const value = JSON.parse(generated);
  fn(value);
  return `${JSON.stringify(value, null, 2)}\n`;
};

reject('wrong Skill Identity endpoint', (() => { const x=structuredClone(references); x.records[0].skillId=10816; return x; })());
reject('wrong Generated Skill Identity link', references, skills, editGenerated(x => { x.references[0].skillIdentity.skillId=10816; }));
reject('missing reference', references, skills, editGenerated(x => x.references.pop()));
reject('duplicate reference', references, skills, editGenerated(x => x.references.push(structuredClone(x.references[0]))));
reject('wrong reference kind', references, skills, editGenerated(x => { x.references[0].referenceKind='JOB_LEVEL_SKILL_ACQUISITION'; }));
reject('wrong Job Connection', references, skills, editGenerated(x => { x.references[1].jobConnectionId=155; }));
reject('wrong Job Level', references, skills, editGenerated(x => { x.references[1].jobLevelId=1551; }));
reject('wrong Skill name', references, skills, editGenerated(x => { x.references[0].skillIdentity.nameCn='changed'; }));
reject('wrong Skill description', references, skills, editGenerated(x => { x.references[0].skillIdentity.descriptionCn+=' changed'; }));
reject('wrong Reference provenance', references, skills, editGenerated(x => { x.references[0].provenance.reference='tampered'; }));
reject('wrong Skill Identity provenance', references, skills, editGenerated(x => { x.references[0].skillIdentity.provenance.name='tampered'; }));
reject('unapproved Runtime field', references, skills, editGenerated(x => { x.references[0].cooldown=1; }));
reject('unapproved Korean localization fallback', references, skills, editGenerated(x => { x.references[0].skillIdentity.nameKo='임의 번역'; }));
reject('Generated parity damage', references, skills, `${generated.trim()} `);
reject('other Hero contamination', (() => { const x=structuredClone(references); x.records.push({...structuredClone(x.records[0]),heroId:8}); return x; })());
reject('missing Skill Identity', references, (() => { const x=structuredClone(skills); x.records=x.records.filter(row=>row.skillId!==10801); return x; })());
reject('duplicate Skill Identity', references, (() => { const x=structuredClone(skills); x.records.push(structuredClone(x.records.find(row=>row.skillId===10801))); return x; })());
console.log(`Hero 15 Skill Detail internal negative controls: PASS (${rejected})`);
