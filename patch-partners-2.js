const fs = require('fs');
const file = 'e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/partners/[id]/edit/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace top
content = content.replace('"use client";', '"use client";\n\nimport { useUnsavedGuard } from \'../../../_shared/hooks/useUnsavedGuard\';\nimport { useUndoRedo } from \'../../../_shared/hooks/useUndoRedo\';');

// Add useUnsavedGuard
content = content.replace('  const handleSubmit = async (e: React.FormEvent) => {', '  useUnsavedGuard(hasChanges);\n\n  const handleSubmit = async (e: React.FormEvent) => {');

// Replace state
content = content.replace(
  'const [partnersItems, setPartnersItems] = useState<PartnerItem[]>([]);',
  `const {
    state: partnersItems,
    set: setPartnersItems,
    undo: undopartnersItems,
    redo: redopartnersItems,
    canUndo: canUndopartnersItems,
    canRedo: canRedopartnersItems,
    reset: resetpartnersItems,
  } = useUndoRedo<PartnerItem[]>([], { maxHistory: 15 });`
);

// Replace sets
content = content.replace('setPartnersItems(nextItems);', 'resetpartnersItems(nextItems);');
content = content.replace('setPartnersItems(DEMO_PARTNERS_ITEMS);', 'resetpartnersItems(DEMO_PARTNERS_ITEMS);');

// Fix implicitly any types
content = content.replace('items: partnersItems.map(item => ({ link: item.link, name: item.name, url: item.url })),', 'items: partnersItems.map((item: PartnerItem) => ({ link: item.link, name: item.name, url: item.url })),');
content = content.replace('items={partnersItems.map((item, idx) => ({ id: idx + 1, link: item.link, name: item.name, url: item.url }))}', 'items={partnersItems.map((item: PartnerItem, idx: number) => ({ id: idx + 1, link: item.link, name: item.name, url: item.url }))}');


// Replace footer
const footerStr = `<HomeComponentStickyFooter
          isSubmitting={isSubmitting}
          hasChanges={hasChanges}
          onCancel={() => { router.push(backHref); }}
          submitLabel="Lưu thay đổi"
          active={active}
          onActiveChange={setActive}
        />`;

const newFooterStr = `<HomeComponentStickyFooter
          isSubmitting={isSubmitting}
          hasChanges={hasChanges}
          onCancel={() => { router.push(backHref); }}
          submitLabel="Lưu thay đổi"
          active={active}
          onActiveChange={setActive}
          undoRedo={{
            canUndo: canUndopartnersItems,
            canRedo: canRedopartnersItems,
            onUndo: undopartnersItems,
            onRedo: redopartnersItems,
          }}
        />`;

content = content.replace(footerStr, newFooterStr);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed manually');
