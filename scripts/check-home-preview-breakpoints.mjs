import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const targets = [
  'app/admin/home-components/footer/_components/FooterPreview.tsx',
  'app/admin/home-components/gallery/_components/GalleryPreview.tsx',
  'app/admin/home-components/gallery/_components/TrustBadgesPreview.tsx',
  'app/admin/home-components/partners/_components/PartnersPreview.tsx',
  'app/admin/home-components/product-list/_components/ProductListSectionShared.tsx',
  'app/admin/home-components/video/_components/VideoSectionShared.tsx',
  'app/admin/home-components/services/_components/ServicesPreview.tsx',
];

const forbiddenPatterns = [
  /sm:grid-cols-/,
  /md:grid-cols-/,
  /lg:grid-cols-/,
  /xl:grid-cols-/,
  /2xl:grid-cols-/,
  /md:col-span-/,
  /lg:col-span-/,
  /md:row-span-/,
  /lg:row-span-/,
  /md:flex-row/,
  /lg:flex-row/,
  /md:w-\[/,
  /lg:w-\[/,
  /md:auto-rows-/,
  /lg:auto-rows-/,
  /lg:grid-cols-2/,
];

const allowMarker = 'preview-breakpoint-allow: cosmetic';
const failures = [];

for (const relativePath of targets) {
  const absolutePath = join(root, relativePath);
  const content = readFileSync(absolutePath, 'utf8');
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    if (line.includes(allowMarker)) {return;}
    const hasPreviewContext = /isPreview|device|PreviewWrapper|BrowserFrame|context === 'preview'|context: 'preview'/.test(content);
    if (!hasPreviewContext) {return;}
    const isExplicitSiteLine = /site:\s*'/.test(line) || /:\s*'[^']*(sm:|md:|lg:|xl:|2xl:)/.test(line);
    if (isExplicitSiteLine) {return;}

    for (const pattern of forbiddenPatterns) {
      if (pattern.test(line)) {
        failures.push(`${relativePath}:${index + 1}: ${line.trim()}`);
        break;
      }
    }
  });
}

if (failures.length > 0) {
  console.error('Preview breakpoint guard failed. Replace layout-critical viewport breakpoints with preview device-aware classes.');
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('Preview breakpoint guard passed.');
