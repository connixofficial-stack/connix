const fs = require('fs');
const path = require('path');

function getPageFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getPageFiles(filePath, fileList);
    } else if (filePath.endsWith('edit\\page.tsx') || filePath.endsWith('edit/page.tsx')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const dir = 'e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components';
const files = getPageFiles(dir);

let modifiedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // We are excluding files that already have it (HeroEditor has it, but it's not named 'edit/page.tsx', it's '_components/HeroEditor.tsx')
  // So all edit/page.tsx files need it.
  if (!content.includes('useUnsavedGuard')) {
    let importDepth = '../../../';
    if (file.includes('snapshots')) {
      importDepth = '../../../../';
    }
    const importStatement = `import { useUnsavedGuard } from '${importDepth}_shared/hooks/useUnsavedGuard';\n`;
    
    // Find the last import
    const lastImportIndex = content.lastIndexOf('import ');
    const endOfLastImport = content.indexOf('\n', lastImportIndex) + 1;
    content = content.slice(0, endOfLastImport) + importStatement + content.slice(endOfLastImport);

    if (content.includes('const handleSubmit =')) {
      content = content.replace(/\n\s*const handleSubmit =/, match => `\n\n  useUnsavedGuard(hasChanges);${match}`);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    modifiedCount++;
    console.log('Updated ' + file);
  }
}
console.log('Total files modified: ' + modifiedCount);
