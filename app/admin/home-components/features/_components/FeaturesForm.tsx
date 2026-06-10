'use client';
 
import React, { useState } from 'react';
import { GripVertical, Plus, Trash2, ListChecks } from 'lucide-react';
import { Button, Input, Label, cn } from '@/app/admin/components/ui';
import { ImageFieldWithUpload } from '../../../components/ImageFieldWithUpload';
import { IconPopoverPicker } from '../../_shared/components/IconPopoverPicker';
import { AiDemoFeaturesImport } from '../../product-list/_components/AiDemoProductsImport';
import type { FeatureItem, FeaturesStyle } from '../_types';
import { createFeatureItem, FEATURE_ICON_PICKER_OPTIONS } from '../_lib/constants';
import { CollapsibleSubSection as SubSection } from '../../_shared/components/CollapsibleSubSection';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { FormSectionsToggleAllButton } from '../../_shared/components/FormSectionsToggleAllButton';

 
interface FeaturesFormProps {
  items: FeatureItem[];
  onChange: (items: FeatureItem[]) => void;
  brandColor: string;
  style?: FeaturesStyle;
  showIcons?: boolean;
  onShowIconsChange?: (value: boolean) => void;
  defaultExpanded?: boolean;
}
 
export function FeaturesForm({
  items,
  onChange,
  brandColor,
  style,
  showIcons = true,
  onShowIconsChange,
  defaultExpanded = true,
}: FeaturesFormProps) {
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
 
  const { openSections, toggleSection, hasClosedSection, handleToggleAll } = useFormSectionsState(
    ['features'],
    defaultExpanded
  );
 
  const dragProps = (itemId: number) => ({
    draggable: true,
    onDragStart: () => setDraggedId(itemId),
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      if (draggedId !== itemId) setDragOverId(itemId);
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      if (!draggedId || draggedId === itemId) return;
 
      const next = [...items];
      const fromIndex = next.findIndex((item) => item.id === draggedId);
      const toIndex = next.findIndex((item) => item.id === itemId);
      if (fromIndex < 0 || toIndex < 0) return;
      
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      onChange(next);
 
      setDraggedId(null);
      setDragOverId(null);
    },
    onDragEnd: () => {
      setDraggedId(null);
      setDragOverId(null);
    },
  });
 
  return (
    <>
      <FormSectionsToggleAllButton
        hasClosedSection={hasClosedSection}
        onToggleAll={handleToggleAll}
      />
      <SubSection
        icon={ListChecks}
        title="Danh sách tính năng"
        open={openSections.features}
        onOpenChange={(open) => toggleSection('features', open)}
        actions={(
          <div className="flex items-center gap-2">
            <AiDemoFeaturesImport onApply={(newItems: any) => onChange(newItems as FeatureItem[])} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => onChange([...items, createFeatureItem({ icon: 'Zap' })])}
            >
              <Plus size={14} /> Thêm
            </Button>
          </div>
        )}
        className="mb-6"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
            <input
              type="checkbox"
              id="features-form-show-icons"
              checked={showIcons}
              onChange={(event) => { onShowIconsChange?.(event.target.checked); }}
              className="w-4 h-4 rounded border-slate-300"
            />
            <Label htmlFor="features-form-show-icons" className="cursor-pointer">Hiển thị icon trong layout</Label>
          </div>
          {items.map((item, idx) => (
            <div
              key={item.id}
              {...dragProps(item.id)}
              className={cn(
                'p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-3 cursor-grab active:cursor-grabbing transition-all',
                draggedId === item.id && 'opacity-50',
                dragOverId === item.id && 'ring-2 ring-blue-500',
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical size={16} className="text-slate-400" />
                  <Label>Tính năng {idx + 1}</Label>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-red-500 h-8 w-8"
                  onClick={() => {
                    if (items.length <= 1) return;
                    onChange(items.filter((feature) => feature.id !== item.id));
                  }}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
 
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {showIcons ? (
                  <IconPopoverPicker
                    value={item.icon}
                    onChange={(nextIcon: string) => {
                      onChange(items.map((feature) => feature.id === item.id ? { ...feature, icon: nextIcon } : feature));
                    }}
                    options={FEATURE_ICON_PICKER_OPTIONS}
                    brandColor={brandColor}
                  />
                ) : null}
 
                <Input
                  placeholder="Tiêu đề"
                  value={item.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    onChange(items.map((feature) => feature.id === item.id ? { ...feature, title: e.target.value } : feature));
                  }}
                  className={showIcons ? 'md:col-span-2' : 'md:col-span-3'}
                />
              </div>
 
              <Input
                placeholder="Mô tả ngắn"
                value={item.description}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  onChange(items.map((feature) => feature.id === item.id ? { ...feature, description: e.target.value } : feature));
                }}
              />
 
              {(style === 'carousel6' || style === 'timeline') && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 mt-2">
                  <ImageFieldWithUpload
                    label="Ảnh đại diện (Upload / URL / Dán / Cắt 1:1)"
                    value={item.image ?? ''}
                    onChange={(url) => {
                      onChange(items.map((feature) => feature.id === item.id ? { ...feature, image: url } : feature));
                    }}
                    folder="home-components"
                    aspectRatio="video"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </SubSection>
    </>
  );
}
