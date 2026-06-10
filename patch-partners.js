const fs = require('fs');
const file = 'e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/partners/[id]/edit/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/'use client';\r?\n/, `'use client';\n\nimport { useUnsavedGuard } from '../../../_shared/hooks/useUnsavedGuard';\nimport { useUndoRedo } from '../../../_shared/hooks/useUndoRedo';\n`);

content = content.replace(/\n\s*const handleSubmit =/, match => '\n\n  useUnsavedGuard(hasChanges);' + match);

const useStateStr = 'const [partnersItems, setPartnersItems] = useState<PartnerItem[]>([]);';
const useUndoRedoStr = `const {
    state: partnersItems,
    set: setPartnersItems,
    undo: undopartnersItems,
    redo: redopartnersItems,
    canUndo: canUndopartnersItems,
    canRedo: canRedopartnersItems,
    reset: resetpartnersItems,
  } = useUndoRedo<PartnerItem[]>([], { maxHistory: 15 });`;

content = content.replace(useStateStr, useUndoRedoStr);

content = content.replace(/setPartnersItems\(nextItems\);/g, 'resetpartnersItems(nextItems);');
content = content.replace(/setPartnersItems\(DEMO_PARTNERS_ITEMS\);/g, 'resetpartnersItems(DEMO_PARTNERS_ITEMS);');

const footerRegex = /<HomeComponentStickyFooter([\s\S]*?)\/>/;
content = content.replace(footerRegex, `<HomeComponentStickyFooter$1\n        undoRedo={{\n          canUndo: canUndopartnersItems,\n          canRedo: canRedopartnersItems,\n          onUndo: undopartnersItems,\n          onRedo: redopartnersItems,\n        }}\n        />`);

fs.writeFileSync(file, content, 'utf8');
