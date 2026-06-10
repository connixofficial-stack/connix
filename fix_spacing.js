const fs = require('fs');
const path = require('path');

const filesToFix = [
  "app/admin/home-components/clients/[id]/edit/page.tsx",
  "app/admin/home-components/create/clients/page.tsx",
  "app/admin/home-components/create/gallery/page.tsx",
  "app/admin/home-components/create/pricing/page.tsx",
  "app/admin/home-components/create/team/page.tsx",
  "app/admin/home-components/create/video/page.tsx",
  "app/admin/home-components/create/voucher-promotions/page.tsx",
  "app/admin/home-components/gallery/[id]/edit/page.tsx",
  "app/admin/home-components/pricing/[id]/edit/page.tsx",
  "app/admin/home-components/service-list/[id]/edit/page.tsx",
  "app/admin/home-components/team/[id]/edit/page.tsx",
  "app/admin/home-components/video/[id]/edit/page.tsx",
  "app/admin/home-components/voucher-promotions/[id]/edit/page.tsx"
];

filesToFix.forEach(relPath => {
  const fullPath = path.join("e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs", relPath);
  let content = fs.readFileSync(fullPath, 'utf8');

  const spacingMatch = content.match(/spacing={([^}]+)}/);
  const onSpacingChangeMatch = content.match(/onSpacingChange={([^}]+)}/);

  // also handle implicit any for onSpacingChange={(value) => ...}
  const onSpacingChangeArrowMatch = content.match(/onSpacingChange={\([^)]*\)\s*=>[^}]*}/);

  if (spacingMatch && (onSpacingChangeMatch || onSpacingChangeArrowMatch)) {
    const spacingVal = spacingMatch[1];
    let onSpacingChangeVal = '';
    
    if (onSpacingChangeMatch && !onSpacingChangeMatch[0].includes('=>')) {
       onSpacingChangeVal = onSpacingChangeMatch[1];
    } else if (onSpacingChangeArrowMatch) {
       onSpacingChangeVal = onSpacingChangeArrowMatch[0].replace('onSpacingChange={', '').slice(0, -1);
    }

    // Remove from HeaderConfigSection
    content = content.replace(/\s+spacing=\{[^}]+\}/g, '');
    content = content.replace(/\s+onSpacingChange=\{[^}]+\}/g, '');

    const hasSectionSpacing = content.includes('<SectionSpacingControl');
    const hasDisplaySpacing = content.includes('<DisplaySpacingCard');
    
    if (!hasSectionSpacing && !hasDisplaySpacing) {
       const injection = `\n\n      <DisplaySpacingCard value={${spacingVal}} onChange={${onSpacingChangeVal}} />`;
       
       const replaceRegex = /(<HeaderConfigSection[\s\S]*?^[ \t]*\/>)/m;
       content = content.replace(replaceRegex, `$1${injection}`);

       const importDepth = relPath.includes('[id]/edit') ? '../../../' : '../../';
       const importStmt = `import { DisplaySpacingCard } from '${importDepth}_shared/components/DisplaySpacingCard';\n`;
       content = content.replace(/(import { HeaderConfigSection } [^\n]+\n)/, `$1${importStmt}`);
    }
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Fixed ${relPath}`);
  }
});
