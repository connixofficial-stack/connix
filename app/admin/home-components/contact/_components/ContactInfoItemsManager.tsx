'use client';

import React, { useMemo, useState } from 'react';
import { Download, GripVertical, Plus, Trash2 } from 'lucide-react';
import type { ContactInfoItem } from '../_types';
import { Button, Input, cn } from '../../../components/ui';
import { AiDemoContactImport } from '../../product-list/_components/AiDemoProductsImport';
import { buildDefaultContactItemsFromSettings } from '../_lib/constants';
import { CONTACT_ICON_OPTIONS, resolveContactIcon } from '../_lib/iconOptions';
import { IconPopoverPicker } from '../../_shared/components/IconPopoverPicker';

interface ContactInfoItemsManagerProps {
  items: ContactInfoItem[];
  onChange: (items: ContactInfoItem[]) => void;
  settings?: Array<{ key: string; value: string | number | boolean }>;
  isLoadingSettings?: boolean;
  validationErrors?: Record<number, { href?: string }>;
}

const getNextId = (items: Array<{ id?: number | string }>) => {
  const max = items.reduce((acc, item) => {
    const asNumber = typeof item.id === 'number' ? item.id : Number(item.id);
    return Number.isFinite(asNumber) ? Math.max(acc, asNumber) : acc;
  }, 0);
  return max + 1;
};

export function ContactInfoItemsManager({
  items,
  onChange,
  settings,
  isLoadingSettings,
  validationErrors,
}: ContactInfoItemsManagerProps) {
  const itemsWithId = useMemo<ContactInfoItem[]>(() => items.map((item, index) => ({
    ...item,
    id: item.id ?? index + 1,
  })), [items]);

  const [draggedId, setDraggedId] = useState<number | string | null>(null);
  const [dragOverId, setDragOverId] = useState<number | string | null>(null);


  const iconLabelMap = useMemo(() => (
    CONTACT_ICON_OPTIONS.reduce<Record<string, string>>((acc, option) => {
      acc[option.value] = option.label;
      return acc;
    }, {})
  ), []);

  const addItem = () => {
    const newId = getNextId(itemsWithId);
    onChange([
      ...itemsWithId,
      {
        id: newId,
        icon: 'map-pin',
        label: 'Nhãn mới',
        value: '',
        href: '',
      },
    ]);
  };

  const removeItem = (id: number | string) => {
    onChange(itemsWithId.filter((item) => item.id !== id));
  };

  const updateItem = (id: number | string, patch: Partial<ContactInfoItem>) => {
    onChange(itemsWithId.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const loadFromSettings = () => {
    onChange(buildDefaultContactItemsFromSettings(settings));
  };

  const handleDragStart = (id: number | string) => { setDraggedId(id); };
  const handleDragEnd = () => { setDraggedId(null); setDragOverId(null); };
  const handleDragOver = (event: React.DragEvent, id: number | string) => {
    event.preventDefault();
    if (draggedId !== id) {setDragOverId(id);}
  };
  const handleDrop = (event: React.DragEvent, targetId: number | string) => {
    event.preventDefault();
    if (!draggedId || draggedId === targetId) {return;}
    const nextItems = [...itemsWithId];
    const draggedIndex = nextItems.findIndex((item) => item.id === draggedId);
    const targetIndex = nextItems.findIndex((item) => item.id === targetId);
    const [moved] = nextItems.splice(draggedIndex, 1);
    nextItems.splice(targetIndex, 0, moved);
    onChange(nextItems);
    setDraggedId(null);
    setDragOverId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Dòng thông tin liên hệ</p>
        <div className="flex items-center gap-2">
          <AiDemoContactImport onApply={(items) => onChange(items as ContactInfoItem[])} />
          <Button type="button" variant="outline" size="sm" onClick={loadFromSettings} disabled={isLoadingSettings}>
            <Download size={14} className="mr-1" /> Load từ Settings
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus size={14} className="mr-1" /> Thêm dòng
          </Button>
        </div>
      </div>

      {itemsWithId.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 dark:border-slate-700 px-4 py-8 text-center">
          <p className="text-sm text-slate-500">Chưa có dòng thông tin nào.</p>
          <div className="mt-3 flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={loadFromSettings} disabled={isLoadingSettings}>
              <Download size={14} className="mr-1" /> Load từ Settings
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus size={14} className="mr-1" /> Thêm dòng
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {itemsWithId.map((item) => {
            const _Icon = resolveContactIcon(item.icon);
            const hasError = validationErrors?.[item.id]?.href;
            const _iconLabel = iconLabelMap[item.icon] ?? item.icon;

            return (
              <div
                key={item.id}
                draggable
                onDragStart={() => { handleDragStart(item.id); }}
                onDragEnd={handleDragEnd}
                onDragOver={(event) => { handleDragOver(event, item.id); }}
                onDrop={(event) => { handleDrop(event, item.id); }}
                className={cn(
                  'rounded-lg border p-4 transition-all space-y-3',
                  draggedId === item.id && 'opacity-50',
                  dragOverId === item.id && 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20',
                  'border-slate-200 dark:border-slate-700'
                )}
              >
                <div className="flex items-center gap-3">
                  <GripVertical size={16} className="text-slate-400 cursor-grab flex-shrink-0" />
                    <IconPopoverPicker
                      value={item.icon}
                      onChange={(nextValue) => updateItem(item.id, { icon: nextValue })}
                      options={CONTACT_ICON_OPTIONS}
                    />
                  <div className="flex-1">
                    <Input
                      value={item.label}
                      onChange={(e) => { updateItem(item.id, { label: e.target.value }); }}
                      placeholder="Nhãn hiển thị"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => { removeItem(item.id); }}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>

                <div className="grid gap-3 md:grid-cols-[1.2fr,1fr]">
                  <Input
                    value={item.value}
                    onChange={(e) => { updateItem(item.id, { value: e.target.value }); }}
                    placeholder="Nội dung hiển thị"
                  />
                  <div>
                    <Input
                      value={item.href ?? ''}
                      onChange={(e) => { updateItem(item.id, { href: e.target.value }); }}
                      placeholder="Link tuỳ chọn (tel:, mailto:, https://...)"
                      className={hasError ? 'border-red-500 dark:border-red-500' : ''}
                    />
                    {hasError && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        {validationErrors?.[item.id]?.href}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}


    </div>
  );
}
