'use client';

import React, { useCallback, useRef, useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { BarChart3, ChevronDown, Loader2, Plus, Search, Sparkles, Trash2, Upload } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { toast } from 'sonner';
import { prepareImageForUpload, validateImageFile } from '@/lib/image/uploadPipeline';
import { resolveNamingContext } from '@/lib/image/uploadNaming';
import { ImageEditorDialog } from '@/app/admin/components/ImageEditorDialog';
import { ImageSourceActions } from '@/app/admin/components/ImageSourceActions';
import { SettingsImageUploader } from '@/app/admin/components/SettingsImageUploader';
import { useFileDraftUploads } from '@/app/admin/components/useFileDraftUploads';
import { Button, Input, Label, cn } from '../../../components/ui';
import { STATS_ICON_CHOICES, type StatsIconType, type StatsItem, type StatsMediaPlacement, type StatsMediaAlign } from '../_types';
import { AiDemoStatsImport } from '../../product-list/_components/AiDemoProductsImport';
import { CollapsibleSubSection as SubSection } from '../../_shared/components/CollapsibleSubSection';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { FormSectionsToggleAllButton } from '../../_shared/components/FormSectionsToggleAllButton';

export interface StatsFormItem extends StatsItem {
  id: number | string;
}

const resolveIconComponent = (iconName: string) => {
  const iconMap = LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>;
  return iconMap[iconName] ?? Sparkles;
};

// ── Icon Upload ──────────────────────────────────────────────────
function IconUpload({ value, onChange, index }: { value: string; onChange: (url: string, storageId?: string | null) => void; index: number }) {
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const saveImage = useMutation(api.storage.saveImage);
  const { trackDraftUpload } = useFileDraftUploads('stats-icons');

  const handleFile = useCallback(async (file: File) => {
    const err = validateImageFile(file, 5);
    if (err) { toast.error(err); return; }
    setUploading(true);
    try {
      const naming = resolveNamingContext(undefined, { entityName: 'stats', field: 'icon', index });
      const prepared = await prepareImageForUpload(file, { quality: 0.85, naming });
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': prepared.mimeType }, body: prepared.file });
      if (!res.ok) { throw new Error('Upload failed'); }
      const { storageId } = await res.json() as { storageId: string };
      const result = await saveImage({ storageId: storageId as Id<'_storage'>, filename: prepared.filename, folder: 'stats-icons', mimeType: prepared.mimeType, size: prepared.size, width: prepared.width, height: prepared.height });
      await trackDraftUpload(storageId as Id<'_storage'>, 'stats-icons');
      onChange(result.url ?? '', storageId);
      toast.success('Tải icon thành công');
    } catch { toast.error('Lỗi tải icon'); } finally { setUploading(false); }
  }, [generateUploadUrl, index, onChange, saveImage, trackDraftUpload]);

  const handleClipboardPaste = useCallback(async () => {
    if (uploading) {return;}
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const clipItem of clipboardItems) {
        const imageType = clipItem.types.find((type) => type.startsWith('image/'));
        if (imageType) {
          const blob = await clipItem.getType(imageType);
          const ext = imageType.split('/')[1] || 'png';
          const file = new File([blob], `stats-icon-clipboard-${Date.now()}.${ext}`, { type: imageType });
          void handleFile(file);
          return;
        }
      }
      toast.error('Clipboard không có ảnh. Hãy copy ảnh trước.');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        toast.error('Trình duyệt chặn quyền đọc clipboard.');
      } else {
        toast.error('Không đọc được clipboard. Hãy copy ảnh trước.');
      }
    }
  }, [handleFile, uploading]);

  return (
    <>
      <div className="flex shrink-0 items-center gap-1">
        <div className="relative shrink-0">
          <input ref={ref} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) { void handleFile(f); } e.target.value = ''; }} />
          <div
            className={cn('h-8 w-8 cursor-pointer overflow-hidden rounded-md border-2 border-dashed transition-all', uploading && 'pointer-events-none', dragging ? 'border-blue-400 bg-blue-50 scale-110' : 'border-slate-200 hover:border-slate-300 dark:border-slate-600')}
            onClick={() => { if (!uploading) { ref.current?.click(); } }}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(false); }}
            onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) { void handleFile(f); } }}
          >
            {uploading ? (
              <div className="h-full w-full flex items-center justify-center bg-slate-100"><Loader2 size={12} className="animate-spin text-blue-500" /></div>
            ) : value ? (
              <img src={value} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-slate-50 dark:bg-slate-800"><Upload size={10} className="text-slate-400" /></div>
            )}
          </div>
          {value && (
            <button type="button" className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center"
              onClick={(e) => { e.stopPropagation(); onChange('', null); }}>×</button>
          )}
        </div>
        <ImageSourceActions
          mode="upload"
          onUpload={() => ref.current?.click()}
          onUrl={() => {
            const next = window.prompt('URL icon', value);
            if (next !== null) { onChange(next.trim()); }
          }}
          onPaste={handleClipboardPaste}
          onCrop={() => setIsEditorOpen(true)}
          cropLabel="1:1"
          cropDisabled={!value || uploading}
          disabled={uploading}
          iconSize={11}
          className="gap-1"
        />
      </div>
      {isEditorOpen && value && (
        <ImageEditorDialog
          imageUrl={value}
          preferredCropAspectRatio="square"
          onClose={() => setIsEditorOpen(false)}
          onApply={(editedFile) => {
            setIsEditorOpen(false);
            void handleFile(editedFile);
          }}
        />
      )}
    </>
  );
}

const MEDIA_PLACEMENT_OPTIONS: Array<{ value: StatsMediaPlacement; label: string }> = [
  { value: 'top', label: 'Trên' },
  { value: 'left', label: 'Trái' },
];

const MEDIA_ALIGN_OPTIONS: Array<{ value: StatsMediaAlign; label: string }> = [
  { value: 'left', label: 'Trái' },
  { value: 'center', label: 'Giữa' },
  { value: 'right', label: 'Phải' },
];

export const StatsForm = ({ 
  items, 
  onChange,
  mediaPlacement,
  mediaAlign,
  backgroundImage,
  backgroundImageStorageId,
  onMediaPlacementChange,
  onMediaAlignChange,
  onBackgroundImageChange,
  defaultExpanded = true,
  className,
  openSections: openSectionsProp,
  onToggleSection: onToggleSectionProp,
  showToggleAll = true,
}: { 
  items: StatsFormItem[]; 
  onChange: (items: StatsFormItem[]) => void;
  mediaPlacement: StatsMediaPlacement;
  mediaAlign: StatsMediaAlign;
  backgroundImage?: string;
  backgroundImageStorageId?: string | null;
  onMediaPlacementChange: (value: StatsMediaPlacement) => void;
  onMediaAlignChange: (value: StatsMediaAlign) => void;
  onBackgroundImageChange?: (value: string, storageId?: string | null) => void;
  defaultExpanded?: boolean;
  className?: string;
  openSections?: Record<string, boolean>;
  onToggleSection?: (key: any, open?: boolean) => void;
  showToggleAll?: boolean;
}) => {
  const [iconSearch, setIconSearch] = useState<Record<string | number, string>>({});
  const [expandedItem, setExpandedItem] = useState<string | number | null>(null);
  const MAX_ITEMS = 4;

  const localSectionsState = useFormSectionsState(
    ['stats'],
    defaultExpanded
  );

  const activeOpenSections = openSectionsProp ?? localSectionsState.openSections;
  const activeToggleSection = onToggleSectionProp ?? ((key: string, open?: boolean) => localSectionsState.toggleSection(key as any, open));
  const activeHasClosedSection = openSectionsProp
    ? !activeOpenSections['stats']
    : localSectionsState.hasClosedSection;
  const activeHandleToggleAll = openSectionsProp
    ? (() => activeToggleSection('stats', activeHasClosedSection))
    : localSectionsState.handleToggleAll;

  const handleAdd = () => {
    if (items.length >= MAX_ITEMS) {return;}
    onChange([...items, { id: Date.now(), iconType: 'none', label: '', value: '' }]);
  };

  const handleUpdate = (id: number | string, patch: Partial<StatsFormItem>) => {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const handleRemove = (id: number | string) => {
    if (items.length <= 1) {return;}
    onChange(items.filter((item) => item.id !== id));
  };

  const iconTypeOptions: Array<{ value: StatsIconType; label: string }> = [
    { value: 'none', label: 'Không' },
    { value: 'lucide', label: 'Icon' },
    { value: 'url', label: 'URL' },
    { value: 'upload', label: 'Upload' },
  ];

  const getFilteredIcons = (itemId: string | number) => {
    const searchTerm = (iconSearch[itemId] || '').toLowerCase();
    if (!searchTerm) {return STATS_ICON_CHOICES;}
    return STATS_ICON_CHOICES.filter((icon) => icon.toLowerCase().includes(searchTerm));
  };

  return (
    <div className={cn('mb-6', className)}>
      {showToggleAll && (
        <FormSectionsToggleAllButton hasClosedSection={activeHasClosedSection} onToggleAll={activeHandleToggleAll} />
      )}

      <SubSection
        icon={BarChart3}
        title={`Số liệu thống kê (${items.length}/${MAX_ITEMS})`}
        open={activeOpenSections.stats}
        onOpenChange={(open) => activeToggleSection('stats', open)}
        actions={(
          <>
            {items.length < MAX_ITEMS && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAdd}
                className="gap-2"
              >
                <Plus size={14} /> Thêm
              </Button>
            )}
            <AiDemoStatsImport onApply={(items) => onChange(items as StatsFormItem[])} />
          </>
        )}
      >
          {onBackgroundImageChange && (
            <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
              <SettingsImageUploader
                label="Ảnh nền layout Hero ảnh nền"
                value={backgroundImage}
                storageId={backgroundImageStorageId as Id<'_storage'>}
                onChange={(url, storageId) => onBackgroundImageChange(url ?? '', storageId)}
                folder="stats-backgrounds"
                naming={{ entityName: 'stats', field: 'background-image', index: 1 }}
                previewSize="md"
              />
            </div>
          )}

          {/* Căn icon/ảnh */}
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

          {/* Danh sách items — mỗi item 1 dòng */}
          {items.map((item, idx) => {
            const filteredIcons = getFilteredIcons(item.id);
            const isIconExpanded = expandedItem === item.id && item.iconType === 'lucide';
            return (
              <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                {/* Row chính */}
                <div className="flex items-center gap-2 px-3 py-2">
                  <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-500 shrink-0">
                    {idx + 1}
                  </div>

                  <Input
                    placeholder="Số liệu (VD: 1000+)"
                    value={item.value}
                    onChange={(e) => { handleUpdate(item.id, { value: e.target.value }); }}
                    className="h-8 flex-1 text-xs"
                  />

                  <Input
                    placeholder="Nhãn (VD: Khách hàng)"
                    value={item.label}
                    onChange={(e) => { handleUpdate(item.id, { label: e.target.value }); }}
                    className="h-8 flex-1 text-xs"
                  />

                  {/* Icon type toggle inline */}
                  <div className="flex shrink-0 gap-1">
                    {iconTypeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          const newIconType = option.value;
                          handleUpdate(item.id, {
                            iconName: newIconType === 'lucide' ? (item.iconName || STATS_ICON_CHOICES[0]) : undefined,
                            iconType: newIconType,
                            iconUrl: (newIconType === 'url' || newIconType === 'upload') ? item.iconUrl : undefined,
                            iconStorageId: newIconType === 'upload' ? item.iconStorageId : null,
                          });
                          // Mở picker lucide khi chọn lucide
                          if (newIconType === 'lucide') {
                            setExpandedItem(item.id);
                          } else {
                            setExpandedItem(null);
                          }
                        }}
                        className={cn(
                          'h-8 rounded-md border px-2 text-xs font-medium transition-colors',
                          (item.iconType || 'none') === option.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-red-500 h-8 w-8 shrink-0"
                    onClick={() => { handleRemove(item.id); }}
                    disabled={items.length <= 1}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>

                <div className="px-3 pb-2">
                  <Input
                    placeholder="Mô tả ngắn cho layout Hero ảnh nền"
                    value={item.description ?? ''}
                    onChange={(e) => { handleUpdate(item.id, { description: e.target.value }); }}
                    className="h-8 text-xs"
                  />
                </div>

                {/* URL input (chỉ hiện khi chọn URL) */}
                {item.iconType === 'url' && (
                  <div className="px-3 pb-3">
                    <Input
                      placeholder="https://example.com/icon.svg"
                      value={item.iconUrl ?? ''}
                      onChange={(e) => { handleUpdate(item.id, { iconUrl: e.target.value }); }}
                      className="h-8 text-xs"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Nhập URL icon (SVG, PNG...)</p>
                  </div>
                )}

                {/* Upload icon */}
                {item.iconType === 'upload' && (
                  <div className="px-3 pb-3">
                    <div className="flex items-center gap-2">
                      <IconUpload
                        value={item.iconUrl ?? ''}
                        onChange={(url, storageId) => { handleUpdate(item.id, { iconUrl: url, iconStorageId: storageId }); }}
                        index={idx + 1}
                      />
                      {item.iconUrl ? (
                        <span className="text-[11px] text-slate-500 truncate">{item.iconUrl}</span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Nhấn ô vuông để chọn ảnh icon</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Lucide picker (chỉ hiện khi chọn lucide và đang expanded) */}
                {item.iconType === 'lucide' && (
                  <div className="px-3 pb-3 space-y-2">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedItem(isIconExpanded ? null : item.id)}
                    >
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        {(() => { const IconCmp = resolveIconComponent(item.iconName || STATS_ICON_CHOICES[0]); return <IconCmp size={14} className="text-blue-500" />; })()}
                        <span>{item.iconName || STATS_ICON_CHOICES[0]}</span>
                      </div>
                      <ChevronDown
                        size={14}
                        className={cn('transition-transform duration-200 text-slate-400', isIconExpanded ? 'rotate-180' : '')}
                      />
                    </div>
                    {isIconExpanded && (
                      <div className="space-y-2">
                        <div className="relative">
                          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                          <Input
                            placeholder="Tìm icon..."
                            value={iconSearch[item.id] || ''}
                            onChange={(e) => { setIconSearch((prev) => ({ ...prev, [item.id]: e.target.value })); }}
                            className="pl-7 h-8 text-xs"
                          />
                        </div>
                        <div className="max-h-[200px] overflow-y-auto border rounded-md p-2 bg-white dark:bg-slate-900">
                          <div className="grid grid-cols-4 md:grid-cols-6 gap-1.5">
                            {filteredIcons.map((iconName) => {
                              const IconCmp = resolveIconComponent(iconName);
                              const isActive = (item.iconName || STATS_ICON_CHOICES[0]) === iconName;
                              return (
                                <button
                                  key={iconName}
                                  type="button"
                                  onClick={() => { handleUpdate(item.id, { iconName, iconType: 'lucide' }); }}
                                  className={cn(
                                    'min-h-[40px] rounded-md border px-1 py-2 flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors',
                                    isActive
                                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                                  )}
                                >
                                  <IconCmp size={14} />
                                  <span className="truncate max-w-full text-[9px]">{iconName}</span>
                                </button>
                              );
                            })}
                          </div>
                          {filteredIcons.length === 0 && (
                            <div className="text-center py-6 text-xs text-slate-400">
                              Không tìm thấy icon
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
      </SubSection>
    </div>
  );
};
