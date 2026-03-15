import fs from 'fs';
import path from 'path';

const root = process.cwd();
const agentsPath = path.join(root, 'AGENTS.md');
const content = fs.existsSync(agentsPath) ? fs.readFileSync(agentsPath, 'utf8') : '';
const refs = [...content.matchAll(/docs\/[^\s)]+\.md/g)].map((m) => m[0]);
const violations: string[] = [];

for (const ref of refs) {
  const full = path.join(root, ref);
  if (!fs.existsSync(full)) {
    violations.push([
      `Documentation reference is broken: ${ref}`,
      `Rule: every docs link mentioned in AGENTS.md must resolve to a real file.`,
      `Remediation: create ${ref} or update AGENTS.md to point at the correct path.`,
    ].join('\n'));
  }
}

const docsRoot = path.join(root, 'docs');
if (fs.existsSync(docsRoot)) {
  for (const file of fs.readdirSync(docsRoot)) {
    const full = path.join(docsRoot, file);
    const stat = fs.statSync(full);
    const ageDays = (Date.now() - stat.mtimeMs) / 86400000;
    if (ageDays > 180) {
      violations.push([
        `Documentation may be stale: docs/${file}`,
        `Rule: top-level docs older than 180 days must be reviewed when touched by architecture changes.`,
        `Remediation: update the file's guidance or add a dated review note explaining why it is still accurate.`,
      ].join('\n'));
    }
  }
}

if (violations.length) {
  console.error(violations.join('\n\n'));
  process.exit(1);
}

console.log('check-docs: passed');
