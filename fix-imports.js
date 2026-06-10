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

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  const unsavedMatch = content.match(/import \{ useUnsavedGuard \} from '([^']+)'\s*;/);
  if (unsavedMatch) {
    content = content.replace(new RegExp(`import \\{ useUnsavedGuard \\} from '[^']+'\\s*;\\r?\\n?`, 'g'), '');
    content = content.replace(/'use client';\r?\n/, `'use client';\n\nimport { useUnsavedGuard } from '${unsavedMatch[1]}';\n`);
    changed = true;
  }

  const undoMatch = content.match(/import \{ useUndoRedo \} from '([^']+)'\s*;/);
  if (undoMatch) {
    content = content.replace(new RegExp(`import \\{ useUndoRedo \\} from '[^']+'\\s*;\\r?\\n?`, 'g'), '');
    content = content.replace(/'use client';\r?\n/, `'use client';\n\nimport { useUndoRedo } from '${undoMatch[1]}';\n`);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed imports in ' + file);
  }
}
