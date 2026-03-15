import fs from 'fs';
import path from 'path';

const root = process.cwd();
const sourceRoots = ['apps/api/src', 'apps/web/src', 'packages/shared/src'];
const orderedLayers = ['types', 'config', 'repo', 'service', 'runtime', 'ui'];

function detectLayer(filePath: string): string | null {
  const parts = filePath.toLowerCase().split(path.sep);
  for (const layer of orderedLayers) {
    if (parts.includes(layer)) return layer;
  }
  if (filePath.includes('controller') || filePath.includes('main.ts') || filePath.includes('routes')) return 'runtime';
  if (filePath.includes('components')) return 'ui';
  if (filePath.includes('validation')) return 'types';
  return null;
}

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

const violations: string[] = [];
for (const src of sourceRoots) {
  for (const file of walk(path.join(root, src))) {
    const currentLayer = detectLayer(file);
    if (!currentLayer) continue;
    const currentIdx = orderedLayers.indexOf(currentLayer);
    const content = fs.readFileSync(file, 'utf8');
    const imports = [...content.matchAll(/from ['"]([^'"]+)['"]/g)].map((m) => m[1]);
    for (const imp of imports) {
      if (!imp.startsWith('.') && !imp.startsWith('@/')) continue;
      const targetPath = imp.startsWith('@/') ? path.join(root, 'apps/web/src', imp.slice(2)) : path.resolve(path.dirname(file), imp);
      const targetLayer = detectLayer(targetPath);
      if (!targetLayer) continue;
      const targetIdx = orderedLayers.indexOf(targetLayer);
      if (targetIdx > currentIdx) {
        violations.push([
          `Import direction violation in ${path.relative(root, file)}`,
          `Rule: ${currentLayer} cannot depend on ${targetLayer}. Allowed direction is Types -> Config -> Repo -> Service -> Runtime -> UI.`,
          `Remediation: move the shared logic into a lower layer or invert the dependency via an interface in packages/shared.`,
        ].join('\n'));
      }
    }
  }
}

if (violations.length) {
  console.error(violations.join('\n\n'));
  process.exit(1);
}

console.log('check-imports: passed');
