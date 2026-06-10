'use client';

import React from 'react';
import { GripVertical, Layers, Loader2, Plus, Trash2, Upload, X } from 'lucide-react';
import { useMutation } from 'convex/react';
import { toast } from 'sonner';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { ImageEditorDialog } from '@/app/admin/components/ImageEditorDialog';
import { ImageSourceActions } from '@/app/admin/components/ImageSourceActions';
import { useFileDraftUploads } from '@/app/admin/components/useFileDraftUploads';
import { prepareImageForUpload, validateImageFile } from '@/lib/image/uploadPipeline';
import { resolveNamingContext } from '@/lib/image/uploadNaming';
import { Button, Input, Label, cn } from '../../../components/ui';
import type { ProcessFormStep } from '../_lib/normalize';
import { createProcessFormStep } from '../_lib/normalize';
import { AiDemoProcessImport } from '../../product-list/_components/AiDemoProductsImport';
import { CollapsibleSubSection as SubSection } from '../../_shared/components/CollapsibleSubSection';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { FormSectionsToggleAllButton } from '../../_shared/components/FormSectionsToggleAllButton';
import type { ProcessStyle } from '../_types';
import { QuickRouteInput } from '../../_shared/components/QuickRouteInput';

interface ProcessFormProps {
  steps: ProcessFormStep[];
  onChange: (steps: ProcessFormStep[]) => void;
  secondary: string;
  defaultExpanded?: boolean;
  style?: ProcessStyle;
  circularCtaText?: string;
  circularCtaLink?: string;
  onChangeCircularCtaText?: (value: string) => void;
  onChangeCircularCtaLink?: (value: string) => void;
}

const ProcessIconUpload = ({
  value,
  onChange,
  index,
}: {
  value: string;
  onChange: (url: string, storageId?: string | null) => void;
  index: number;
}) => {
  const [uploading, setUploading] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const [isEditorOpen, setIsEditorOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const saveImage = useMutation(api.storage.saveImage);
  const { trackDraftUpload } = useFileDraftUploads('process-icons');

  const handleFile = React.useCallback(async (file: File) => {
    const error = validateImageFile(file, 5);
    if (error) {
      toast.error(error);
      return;
    }

    setUploading(true);
    try {
      const naming = resolveNamingContext(undefined, { entityName: 'process', field: 'icon', index });
      const prepared = await prepareImageForUpload(file, { quality: 0.85, naming });
      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uploadUrl, {
        body: prepared.file,
        headers: { 'Content-Type': prepared.mimeType },
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { storageId } = await response.json() as { storageId: string };
      const result = await saveImage({
        filename: prepared.filename,
        folder: 'process-icons',
        height: prepared.height,
        mimeType: prepared.mimeType,
        size: prepared.size,
        storageId: storageId as Id<'_storage'>,
        width: prepared.width,
      });
      await trackDraftUpload(storageId as Id<'_storage'>, 'process-icons');
      onChange(result.url ?? '', storageId);
      toast.success('Tải icon thành công');
    } catch {
      toast.error('Lỗi tải icon');
    } finally {
      setUploading(false);
    }
  }, [generateUploadUrl, index, onChange, saveImage, trackDraftUpload]);

  const handleClipboardPaste = React.useCallback(async () => {
    if (uploading) {return;}
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        const imageType = item.types.find((type) => type.startsWith('image/'));
        if (!imageType) {continue;}

        const blob = await item.getType(imageType);
        const ext = imageType.split('/')[1] || 'png';
        void handleFile(new File([blob], `process-icon-clipboard-${Date.now()}.${ext}`, { type: imageType }));
        return;
      }
      toast.error('Clipboard không có ảnh. Hãy copy ảnh trước.');
    } catch {
      toast.error('Không đọc được clipboard. Hãy copy ảnh trước.');
    }
  }, [handleFile, uploading]);

  return (
    <>
      <div className="flex shrink-0 items-center gap-1">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) { void handleFile(file); }
            event.target.value = '';
          }}
        />
        <div
          className={cn(
            'flex h-9 w-9 cursor-pointer items-center justify-center overflow-hidden rounded-md border-2 border-dashed transition-all',
            uploading && 'pointer-events-none',
            dragging ? 'scale-105 border-blue-400 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800',
          )}
          onClick={() => { if (!uploading) { inputRef.current?.click(); } }}
          onDragOver={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setDragging(false);
            const file = event.dataTransfer.files[0];
            if (file) { void handleFile(file); }
          }}
        >
          {uploading ? (
            <Loader2 size={14} className="animate-spin text-blue-500" />
          ) : value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <Upload size={13} className="text-slate-400" />
          )}
        </div>
        <ImageSourceActions
          mode="upload"
          onUpload={() => inputRef.current?.click()}
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
};

export const ProcessForm = ({
  steps,
  onChange,
  secondary,
  defaultExpanded = true,
  style,
  circularCtaText = '',
  circularCtaLink = '',
  onChangeCircularCtaText,
  onChangeCircularCtaLink,
}: ProcessFormProps) => {
  const [draggedId, setDraggedId] = React.useState<string | null>(null);
  const [dragOverId, setDragOverId] = React.useState<string | null>(null);

  const { openSections, toggleSection, hasClosedSection, handleToggleAll } = useFormSectionsState(
    ['steps', 'circular'],
    defaultExpanded
  );

  const safeSecondary = secondary.trim().length > 0 ? secondary : '#3b82f6';

  const handleAdd = () => {
    if (steps.length >= 8) { return; }
    onChange([...steps, createProcessFormStep({ icon: String(steps.length + 1) })]);
  };

  const handleUpdate = (id: string, updater: (step: ProcessFormStep) => ProcessFormStep) => {
    onChange(steps.map((step) => (step.id === id ? updater(step) : step)));
  };

  const handleRemove = (id: string) => {
    if (steps.length <= 1) {return;}
    onChange(steps.filter((step) => step.id !== id));
  };

  const dragProps = (id: string) => ({
    draggable: true,
    onDragStart: () => { setDraggedId(id); },
    onDragOver: (event: React.DragEvent) => {
      event.preventDefault();
      if (draggedId !== id) {
        setDragOverId(id);
      }
    },
    onDrop: (event: React.DragEvent) => {
      event.preventDefault();
      if (!draggedId || draggedId === id) {return;}

      const sourceIndex = steps.findIndex((step) => step.id === draggedId);
      const targetIndex = steps.findIndex((step) => step.id === id);

      if (sourceIndex < 0 || targetIndex < 0) {
        setDraggedId(null);
        setDragOverId(null);
        return;
      }

      const next = [...steps];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
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
    <div className="mb-6">
      <FormSectionsToggleAllButton
        hasClosedSection={hasClosedSection}
        onToggleAll={handleToggleAll}
      />
      <SubSection
        icon={Layers}
        title={`Các bước quy trình (${steps.length})`}
        open={openSections.steps}
        onOpenChange={(open) => toggleSection('steps', open)}
        actions={(
          <>
            <AiDemoProcessImport onApply={(items) => onChange(items as ProcessFormStep[])} />
            {steps.length < 8 && (
              <Button type="button" variant="outline" size="sm" onClick={handleAdd} className="gap-2">
                <Plus size={14} /> Thêm bước
              </Button>
            )}
          </>
        )}
      >
      <div className="space-y-4">
        {steps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: `${safeSecondary}14` }}>
              <Layers size={28} style={{ color: safeSecondary }} />
            </div>
            <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1">Chưa có bước nào</h3>
            <p className="text-sm text-slate-500">Nhấn “Thêm bước” để bắt đầu</p>
          </div>
        ) : (
          steps.map((step, idx) => (
            <div
              key={step.id}
              {...dragProps(step.id)}
              className={cn(
                'p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-3 cursor-grab active:cursor-grabbing transition-all',
                draggedId === step.id && 'opacity-50',
                dragOverId === step.id && 'ring-2 ring-blue-500',
              )}
            >
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <GripVertical size={16} className="text-slate-400 cursor-grab" />
                  <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </span>
                  Bước {idx + 1}
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-red-500 h-8 w-8"
                  onClick={() => { handleRemove(step.id); }}
                >
                  <Trash2 size={14} />
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs text-slate-500">Icon / ảnh</Label>
                  <div className="flex items-center gap-2">
                    <ProcessIconUpload
                      value={step.icon}
                      index={idx}
                      onChange={(url, storageId) => handleUpdate(step.id, (current) => ({ ...current, icon: url, iconStorageId: storageId }))}
                    />
                    <div className="relative min-w-0 flex-1">
                      <Input
                        placeholder="Số, ký tự hoặc URL"
                        value={step.icon}
                        onChange={(event) => {
                          handleUpdate(step.id, (current) => ({ ...current, icon: event.target.value, iconStorageId: null }));
                        }}
                        className="pr-6"
                      />
                      {step.icon && (
                        <button type="button" className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" onClick={() => handleUpdate(step.id, (c) => ({ ...c, icon: '', iconStorageId: null }))}>
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5 md:col-span-3">
                  <Label className="text-xs text-slate-500">Tiêu đề bước</Label>
                  <div className="relative">
                    <Input
                      placeholder="Tiêu đề bước"
                      value={step.title}
                      onChange={(event) => {
                        handleUpdate(step.id, (current) => ({ ...current, title: event.target.value }));
                      }}
                      className="pr-6"
                    />
                    {step.title && (
                      <button type="button" className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" onClick={() => handleUpdate(step.id, (c) => ({ ...c, title: '' }))}>
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">Mô tả</Label>
                <div className="relative">
                  <Input
                    placeholder="Mô tả chi tiết bước này..."
                    value={step.description}
                    onChange={(event) => {
                      handleUpdate(step.id, (current) => ({ ...current, description: event.target.value }));
                    }}
                    className="pr-6"
                  />
                  {step.description && (
                    <button type="button" className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" onClick={() => handleUpdate(step.id, (c) => ({ ...c, description: '' }))}>
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      </SubSection>

      {style === 'circular' && (
        <SubSection
          icon={Layers}
          title="Cấu hình Circular (Builder.io)"
          open={openSections.circular}
          onOpenChange={(open) => toggleSection('circular', open)}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Nút CTA (Text)</Label>
              <Input
                placeholder="Nhãn nút CTA (mặc định: BẮT ĐẦU DỰ ÁN)"
                value={circularCtaText}
                onChange={(e) => onChangeCircularCtaText?.(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Đường dẫn CTA (Link)</Label>
              <QuickRouteInput
                value={circularCtaLink}
                onChangeValue={(value) => onChangeCircularCtaLink?.(value)}
                placeholder="Đường dẫn nút (mặc định: #contact)"
              />
            </div>
          </div>
        </SubSection>
      )}
    </div>
  );
};
