'use client';

import React from 'react';
import {
  Bot, GripVertical, Plus, Trash2, Type,
} from 'lucide-react';
import { Button, Input, cn } from '../../../components/ui';
import {
  createMarqueeItem,
  type MarqueeItem,
  type MarqueeTextStyle,
} from '../_types';
import { DEMO_MARQUEE_ITEMS, SEPARATOR_OPTIONS, TEXT_STYLE_OPTIONS } from '../_lib/constants';
import { AiDemoMarqueeImport } from '../../product-list/_components/AiDemoProductsImport';
import { CollapsibleSubSection as SubSection } from '../../_shared/components/CollapsibleSubSection';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { FormSectionsToggleAllButton } from '../../_shared/components/FormSectionsToggleAllButton';


// ── Separator popup picker ───────────────────────────────────────
function SeparatorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="h-8 w-10 rounded border border-slate-200 bg-white flex items-center justify-center text-base hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-900"
        title="Ký tự phân cách"
      >
        {value === '  ' ? '␣' : value}
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-50 rounded-lg border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900 animate-in fade-in-0 zoom-in-95"
          style={{ width: '240px' }}>
          <div className="grid grid-cols-6 gap-1">
            {SEPARATOR_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={cn(
                  'h-8 w-full rounded flex items-center justify-center text-base transition-all hover:bg-blue-50 hover:scale-110',
                  value === opt.value ? 'bg-blue-100 ring-1 ring-blue-400' : 'bg-slate-50 dark:bg-slate-800',
                )}
                title={opt.label}
              >
                {opt.value === '  ' ? '␣' : opt.value}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Drag reorder ─────────────────────────────────────────────────
function useDragReorder(items: MarqueeItem[], setItems: React.Dispatch<React.SetStateAction<MarqueeItem[]>>) {
  const [draggedId, setDraggedId] = React.useState<string | null>(null);
  const [dragOverId, setDragOverId] = React.useState<string | null>(null);

  const dragProps = (id: string) => ({
    draggable: true,
    onDragEnd: () => { setDraggedId(null); setDragOverId(null); },
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); if (draggedId !== id) { setDragOverId(id); } },
    onDragStart: () => { setDraggedId(id); },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      if (!draggedId || draggedId === id) { return; }
      setItems((prev) => {
        const next = [...prev];
        const from = next.findIndex((x) => x.id === draggedId);
        const to = next.findIndex((x) => x.id === id);
        if (from < 0 || to < 0) { return prev; }
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        return next;
      });
      setDraggedId(null); setDragOverId(null);
    },
  });

  return { draggedId, dragOverId, dragProps };
}

// ── Text style indicator ─────────────────────────────────────────
const textStyleBadge: Record<MarqueeTextStyle, { label: string; className: string }> = {
  normal: { label: 'Aa', className: 'font-normal' },
  outlined: { label: 'Aa', className: 'font-bold [text-shadow:none]' },
  bold: { label: 'Aa', className: 'font-black' },
  shadow: { label: 'Aa', className: 'font-semibold' },
};

// ── Main form ────────────────────────────────────────────────────
interface MarqueeFormProps {
  items: MarqueeItem[];
  setItems: React.Dispatch<React.SetStateAction<MarqueeItem[]>>;
  defaultExpanded?: boolean;
}

export function MarqueeForm({ items, setItems, defaultExpanded = true }: MarqueeFormProps) {
  const { draggedId, dragOverId, dragProps } = useDragReorder(items, setItems);

  const { openSections, toggleSection, hasClosedSection, handleToggleAll } = useFormSectionsState(
    ['marquee'],
    defaultExpanded
  );

  const addItem = () => { setItems((prev) => [...prev, createMarqueeItem(Date.now())]); };

  const removeItem = (id: string) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((x) => x.id !== id) : prev));
  };

  const updateItem = (id: string, patch: Partial<MarqueeItem>) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  const loadDemo = () => {
    setItems(DEMO_MARQUEE_ITEMS.map((d, i) => ({ ...createMarqueeItem(Date.now() + i), ...d })));
  };

  return (
    <div className="mb-6">
      <FormSectionsToggleAllButton
        hasClosedSection={hasClosedSection}
        onToggleAll={handleToggleAll}
      />
      <SubSection
        icon={Type}
        title={`Nội dung chạy chữ (${items.length})`}
        open={openSections.marquee}
        onOpenChange={(open) => toggleSection('marquee', open)}
        actions={(
          <>
            <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={loadDemo}>
              <Bot size={11} /> Demo
            </Button>
            <AiDemoMarqueeImport onApply={setItems} />
            <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={addItem}>
              <Plus size={12} /> Thêm
            </Button>
          </>
        )}
      >
        <div className="space-y-2">
          {items.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 py-8 text-center dark:border-slate-700">
              <Type size={24} className="mb-2 text-slate-300" />
              <p className="text-sm text-slate-500 mb-3">Chưa có nội dung nào</p>
              <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addItem}>
                <Plus size={12} /> Thêm nội dung
              </Button>
            </div>
          )}

          {items.map((item) => (
            <div key={item.id} {...dragProps(item.id)}
              className={cn('cursor-grab rounded-lg border transition-all active:cursor-grabbing',
                draggedId === item.id && 'opacity-50 scale-[0.98]',
                dragOverId === item.id && 'ring-2 ring-blue-500 ring-offset-1',
                'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900')}>

              <div className="flex items-center gap-2 px-2.5 py-2">
                <GripVertical size={14} className="shrink-0 text-slate-300 cursor-grab" />

                {/* Text style badge */}
                <div
                  className={cn('shrink-0 h-8 w-8 overflow-hidden rounded-lg flex items-center justify-center text-[11px] cursor-pointer select-none transition-colors',
                    item.textStyle === 'outlined'
                      ? 'bg-purple-50 text-purple-600 border border-purple-200'
                      : item.textStyle === 'bold'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : item.textStyle === 'shadow'
                          ? 'bg-cyan-50 text-cyan-600 border border-cyan-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800'
                  )}
                  title="Kiểu chữ"
                >
                  <span className={textStyleBadge[item.textStyle || 'normal'].className}>
                    {textStyleBadge[item.textStyle || 'normal'].label}
                  </span>
                </div>

                <Input placeholder="Nhập nội dung chạy chữ..." className="h-8 flex-1 text-xs min-w-0" value={item.text}
                  onChange={(e) => updateItem(item.id, { text: e.target.value })} />

                {/* Separator picker (popup) */}
                <SeparatorPicker
                  value={item.separator ?? '✦'}
                  onChange={(val) => updateItem(item.id, { separator: val })}
                />

                {/* Text style picker */}
                <select
                  className="h-8 rounded border border-slate-200 bg-white px-1.5 text-[11px] text-slate-600 focus:outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 cursor-pointer shrink-0 w-[70px]"
                  value={item.textStyle ?? 'normal'}
                  onChange={(e) => updateItem(item.id, { textStyle: e.target.value as MarqueeTextStyle })}
                  title="Kiểu chữ"
                >
                  {TEXT_STYLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>

                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-slate-400 hover:text-red-500"
                  onClick={() => removeItem(item.id)}>
                  <Trash2 size={13} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </SubSection>
    </div>
  );
}
