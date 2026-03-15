import fs from 'fs';
import path from 'path';

const root = process.cwd();
const apiRoot = path.join(root, 'apps/api/src');

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

function domainFor(file: string): string | null {
  const rel = path.relative(apiRoot, file).split(path.sep);
  const first = rel[0];
  const ignored = new Set(['common', 'prisma', 'auth', 'health']);
  if (!first || ignored.has(first)) return null;
  return first;
}

const violations: string[] = [];
for (const file of walk(apiRoot)) {
  const sourceDomain = domainFor(file);
  if (!sourceDomain) continue;
  const content = fs.readFileSync(file, 'utf8');
  const imports = [...content.matchAll(/from ['"]([^'"]+)['"]/g)].map((m) => m[1]);
  for (const imp of imports) {
    if (!imp.startsWith('.')) continue;
    const target = path.resolve(path.dirname(file), imp);
    const targetDomain = domainFor(target);
    if (targetDomain && targetDomain !== sourceDomain) {
      violations.push([
        `Boundary violation in ${path.relative(root, file)}`,
        `Rule: domain '${sourceDomain}' cannot import domain '${targetDomain}' directly.`,
        `Remediation: move the shared contract into packages/shared or expose a public service/module interface instead of deep-linking across domains.`,
      ].join('\n'));
    }
  }
}

if (violations.length) {
  console.error(violations.join('\n\n'));
  process.exit(1);
}

console.log('check-boundaries: passed');
