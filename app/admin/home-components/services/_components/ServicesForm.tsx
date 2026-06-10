'use client';

import React from 'react';
import { AdminImage } from '@/app/admin/components/AdminImage';
import { SettingsImageUploader } from '@/app/admin/components/SettingsImageUploader';
import {
  icons,
  GripVertical,
  Plus,
  Trash2,
  Search,
  X,
} from 'lucide-react';
import { Button, Input, Label, cn } from '../../../components/ui';
import type { ServiceEditorItem, ServiceItemMediaAlign, ServiceItemMediaPlacement, ServiceItemMediaType } from '../_types';
import { AVAILABLE_SERVICE_ICONS } from '../_lib/constants';
import { AiServicesImport } from './AiServicesImport';
import { CollapsibleSubSection as SubSection } from '../../_shared/components/CollapsibleSubSection';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { FormSectionsToggleAllButton } from '../../_shared/components/FormSectionsToggleAllButton';

const ImageIcon = icons.Image;
const StarIcon = icons.Star;

const getIconComponent = (iconName: string) => icons[iconName as keyof typeof icons] || StarIcon;
const ICON_OPTIONS = AVAILABLE_SERVICE_ICONS.map((icon) => ({ label: icon, value: icon }));

const MEDIA_PLACEMENT_OPTIONS: Array<{ value: ServiceItemMediaPlacement; label: string }> = [
  { value: 'top', label: 'Trên' },
  { value: 'left', label: 'Trái' },
];

const MEDIA_ALIGN_OPTIONS: Array<{ value: ServiceItemMediaAlign; label: string }> = [
  { value: 'left', label: 'Trái' },
  { value: 'center', label: 'Giữa' },
  { value: 'right', label: 'Phải' },
];

const ServiceMediaPreview = ({ item, brandColor }: { item: ServiceEditorItem; brandColor: string }) => {
  if (item.mediaType === 'image' && item.image) {
    return (
      <div className="relative h-8 w-8 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700">
        <AdminImage src={item.image} alt="" fill className="object-cover" />
      </div>
    );
  }

  const IconComponent = getIconComponent(item.icon || 'Star');
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white dark:border-slate-700">
      <IconComponent size={16} style={{ color: brandColor }} />
    </div>
  );
};
const IconCombobox = ({
  value,
  onChange,
  brandColor,
}: {
  value: string;
  onChange: (value: string) => void;
  brandColor: string;
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!isOpen) {return;}
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const filtered = React.useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {return ICON_OPTIONS;}
    return ICON_OPTIONS.filter((option) => option.label.toLowerCase().includes(normalized));
  }, [query]);

  const selectedValue = ICON_OPTIONS.find((option) => option.value === value)?.value ?? 'Star';
  const SelectedIcon = getIconComponent(selectedValue);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-left text-sm"
      >
        <span className="flex min-w-0 items-center gap-2">
          <SelectedIcon size={16} style={{ color: brandColor }} />
          <span className="truncate">{selectedValue}</span>
        </span>
        <Search size={14} className="text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 w-[420px] rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 p-2 dark:border-slate-800">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm icon..."
                className="h-9 pl-9"
              />
            </div>
          </div>
          <div className="grid max-h-72 grid-cols-5 gap-1.5 overflow-y-auto p-2">
            {filtered.map((option) => {
              const IconComponent = getIconComponent(option.value);
              const selected = option.value === selectedValue;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-md border px-1 py-2 text-center text-xs transition-colors',
                    selected
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300'
                      : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800',
                  )}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800">
                    <IconComponent size={15} style={{ color: brandColor }} />
                  </span>
                  <span className="w-full truncate leading-tight">{option.label}</span>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-5 rounded-md border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-500 dark:border-slate-700">
                Không tìm thấy icon
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const ServicesForm = ({
  items,
  onChange,
  mediaPlacement,
  mediaAlign,
  onMediaPlacementChange,
  onMediaAlignChange,
  maxItems = 12,
  brandColor,
  defaultExpanded = true,
  onAiImport,
}: {
  items: ServiceEditorItem[];
  onChange: (next: ServiceEditorItem[]) => void;
  mediaPlacement: ServiceItemMediaPlacement;
  mediaAlign: ServiceItemMediaAlign;
  onMediaPlacementChange: (value: ServiceItemMediaPlacement) => void;
  onMediaAlignChange: (value: ServiceItemMediaAlign) => void;
  maxItems?: number;
  brandColor: string;
  defaultExpanded?: boolean;
  onAiImport?: (items: ServiceEditorItem[]) => void;
}) => {
  const [draggedId, setDraggedId] = React.useState<number | null>(null);
  const [dragOverId, setDragOverId] = React.useState<number | null>(null);

  const { openSections, toggleSection, hasClosedSection, handleToggleAll } = useFormSectionsState(
    ['services'],
    defaultExpanded
  );

  const handleAdd = () => {
    if (items.length >= maxItems) {return;}
    onChange([
      ...items,
      {
        id: (items[items.length - 1]?.id ?? 1_000_000) + 1,
        mediaType: 'icon',
        icon: 'Star',
        image: '',
        title: '',
        description: '',
      },
    ]);
  };

  const handleRemove = (id: number) => {
    if (items.length <= 1) {return;}
    onChange(items.filter((item) => item.id !== id));
  };

  const handleUpdate = (id: number, field: keyof ServiceEditorItem, value: string) => {
    onChange(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const handleMediaTypeChange = (id: number, mediaType: ServiceItemMediaType) => {
    onChange(items.map((item) => {
      if (item.id !== id) {return item;}
      return {
        ...item,
        mediaType,
        icon: mediaType === 'icon' ? (item.icon || 'Star') : item.icon,
        image: mediaType === 'image' ? item.image || '' : '',
      };
    }));
  };

  const handleDrop = (targetId: number) => {
    if (!draggedId || draggedId === targetId) {return;}
    const next = [...items];
    const draggedIndex = next.findIndex((item) => item.id === draggedId);
    const targetIndex = next.findIndex((item) => item.id === targetId);
    if (draggedIndex < 0 || targetIndex < 0) {return;}
    const [moved] = next.splice(draggedIndex, 1);
    next.splice(targetIndex, 0, moved);
    onChange(next);
    setDraggedId(null);
    setDragOverId(null);
  };

  const ClearableField = ({ value, onValueChange, className, ...rest }: Omit<React.ComponentProps<typeof Input>, 'onChange'> & { value: string; onValueChange: (v: string) => void }) => (
    <div className="relative flex-1 min-w-0">
      <Input {...rest} value={value} onChange={(e) => onValueChange(e.target.value)} className={cn(className, value && 'pr-7')} />
      {value && (
        <button type="button" className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700" onClick={() => onValueChange('')}>
          <X size={12} />
        </button>
      )}
    </div>
  );

  return (
    <div className="mb-6">
      <FormSectionsToggleAllButton
        hasClosedSection={hasClosedSection}
        onToggleAll={handleToggleAll}
      />
      <SubSection
        icon={ImageIcon}
        title={`Dịch vụ (${items.length}/${maxItems})`}
        open={openSections.services}
        onOpenChange={(open) => toggleSection('services', open)}
        actions={(
          <>
            {onAiImport && <AiServicesImport onApply={onAiImport} />}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAdd}
              className="gap-2"
              disabled={items.length >= maxItems}
            >
              <Plus size={14} /> Thêm
            </Button>
          </>
        )}
      >
      <div className="space-y-3">
        <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
          <Label className="text-sm font-medium">Căn icon/ảnh cho toàn bộ component</Label>
          <div className="grid grid-cols-2 gap-2">
            {MEDIA_PLACEMENT_OPTIONS.map((option) => {
              const selected = mediaPlacement === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onMediaPlacementChange(option.value)}
                  className={cn(
                    'h-9 rounded-md border text-xs transition-colors',
                    selected
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300'
                      : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          {mediaPlacement === 'top' && (
            <div className="space-y-2">
              <Label className="text-xs text-slate-500">Căn ngang khi icon nằm trên</Label>
              <div className="grid grid-cols-3 gap-2">
                {MEDIA_ALIGN_OPTIONS.map((option) => {
                  const selected = mediaAlign === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onMediaAlignChange(option.value)}
                      className={cn(
                        'h-9 rounded-md border text-xs transition-colors',
                        selected
                          ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300'
                          : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        {items.map((item, idx) => {
          return (
            <div
              key={item.id}
              draggable
              onDragStart={() => setDraggedId(item.id)}
              onDragEnd={() => {
                setDraggedId(null);
                setDragOverId(null);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                if (draggedId !== item.id) {
                  setDragOverId(item.id);
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                handleDrop(item.id);
              }}
              className={cn(
                'rounded-lg border bg-white dark:bg-slate-900 transition-all',
                draggedId === item.id && 'opacity-50',
                dragOverId === item.id && 'border-blue-500',
                !draggedId && !dragOverId && 'border-slate-200 dark:border-slate-700',
              )}
            >
              {/* Row 1: drag handle | index | media preview | media-type toggle | icon/image picker | delete */}
              <div className="flex items-center gap-2 px-3 py-2">
                <GripVertical size={16} className="shrink-0 cursor-grab text-slate-400" />
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {idx + 1}
                </span>
                <ServiceMediaPreview item={item} brandColor={brandColor} />

                {/* Icon / Ảnh toggle */}
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => handleMediaTypeChange(item.id, 'icon')}
                    className={cn(
                      'flex h-7 items-center gap-1 rounded-md border px-2 text-[11px] transition-colors',
                      item.mediaType !== 'image'
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300'
                        : 'border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400',
                    )}
                  >
                    <StarIcon size={11} /> Icon
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMediaTypeChange(item.id, 'image')}
                    className={cn(
                      'flex h-7 items-center gap-1 rounded-md border px-2 text-[11px] transition-colors',
                      item.mediaType === 'image'
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300'
                        : 'border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400',
                    )}
                  >
                    <ImageIcon size={11} /> Ảnh
                  </button>
                </div>

                {/* Icon picker or image uploader */}
                <div className="w-36 shrink-0">
                  {item.mediaType === 'image' ? (
                    <SettingsImageUploader
                      value={item.image}
                      onChange={(url) => handleUpdate(item.id, 'image', url ?? '')}
                      folder="services"
                      naming={{ entityName: 'services', field: 'image', index: idx + 1 }}
                      label=""
                      previewSize="sm"
                      cropAspectRatio="square"
                      smartLogoCrop
                    />
                  ) : (
                    <IconCombobox
                      value={item.icon || 'Star'}
                      onChange={(value) => handleUpdate(item.id, 'icon', value)}
                      brandColor={brandColor}
                    />
                  )}
                </div>

                <div className="flex-1" />

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-slate-400 hover:text-red-500"
                  onClick={() => handleRemove(item.id)}
                  disabled={items.length <= 1}
                >
                  <Trash2 size={14} />
                </Button>
              </div>

              {/* Row 2: title + description with clearable inputs */}
              <div className="flex items-center gap-2 border-t border-slate-100 px-3 py-2 dark:border-slate-800">
                <ClearableField
                  placeholder="Tiêu đề"
                  value={item.title}
                  onValueChange={(v) => handleUpdate(item.id, 'title', v)}
                  className="h-8 text-xs"
                />
                <ClearableField
                  placeholder="Mô tả ngắn"
                  value={item.description}
                  onValueChange={(v) => handleUpdate(item.id, 'description', v)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          );
        })}
      </div>
      </SubSection>
    </div>
  );
};
