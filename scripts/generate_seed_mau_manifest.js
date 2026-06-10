const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const publicRoot = path.join(root, 'public');
const seedRoot = path.join(publicRoot, 'seed_mau');
const outputPath = path.join(root, 'lib', 'seed-templates', 'available-seed-mau-paths.ts');

const VALID_EXTENSIONS = new Set(['.webp', '.jpg', '.jpeg', '.png']);

function walk(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(fullPath));
      continue;
    }
    if (!entry.isFile()) {
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    if (!VALID_EXTENSIONS.has(ext)) {
      continue;
    }
    results.push(fullPath);
  }

  return results;
}

const files = walk(seedRoot);
const paths = files
  .map((filePath) => {
    const relative = path.relative(publicRoot, filePath).split(path.sep).join('/');
    return `/${relative}`;
  })
  .sort((a, b) => a.localeCompare(b));

const lines = [
  'export const AVAILABLE_SEED_MAU_PATHS = new Set<string>([',
  ...paths.map((item) => `  '${item}',`),
  ']);',
  '',
];

fs.writeFileSync(outputPath, lines.join('\n'));

console.log(`Generated ${paths.length} paths -> ${path.relative(root, outputPath)}`);
