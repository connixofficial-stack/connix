'use client';

import React from 'react';
import { SettingsImageUploader } from '@/app/admin/components/SettingsImageUploader';
import {
  GripVertical,
  ImageIcon,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button, Input, Label, cn } from '../../../components/ui';
import { ImageFieldWithUpload } from '../../../components/ImageFieldWithUpload';
import { IconPopoverPicker } from '../../_shared/components/IconPopoverPicker';
import { CollapsibleSubSection as SubSection } from '../../_shared/components/CollapsibleSubSection';
import { HomeComponentDisplaySettingsSection } from '../../_shared/components/HomeComponentDisplaySettingsSection';
import { AiAboutImport } from './AiAboutImport';
import { createAboutEditorFeature, createAboutEditorStat } from '../_lib/constants';
import { ABOUT_POPOVER_OPTIONS } from '../_lib/iconRegistry';
import type { SectionSpacing } from '../../_shared/types/sectionSpacing';
import type { AboutCornerRadius, AboutEditorState, AboutStyle } from '../_types';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { FormSectionsToggleAllButton } from '../../_shared/components/FormSectionsToggleAllButton';

interface AboutFormProps {
  state: AboutEditorState;
  previewStyle: AboutStyle;
  onChange: (updater: (prev: AboutEditorState) => AboutEditorState) => void;
  spacing: SectionSpacing;
  onSpacingChange: (value: SectionSpacing) => void;
  cornerRadius: AboutCornerRadius;
  onCornerRadiusChange: (value: AboutCornerRadius) => void;
  /** Mặc định mở (true = create) hay đóng (false = edit) */
  defaultExpanded?: boolean;
}

const MIN_FEATURES = 1;
const MAX_FEATURES = 6;

export function AboutForm({
  state,
  previewStyle,
  onChange,
  spacing,
  onSpacingChange,
  cornerRadius,
  onCornerRadiusChange,
  defaultExpanded = true,
}: AboutFormProps) {
  const [draggedId, setDraggedId] = React.useState<string | null>(null);
  const [dragOverId, setDragOverId] = React.useState<string | null>(null);

  const { openSections, toggleSection, hasClosedSection, handleToggleAll } = useFormSectionsState(
    ['settings', 'about', 'features'],
    defaultExpanded
  );

  const updateField = <K extends keyof AboutEditorState>(key: K, value: AboutEditorState[K]) => {
    onChange((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const applyAiImport = (patch: Partial<AboutEditorState>) => {
    onChange((prev) => ({
      ...prev,
      ...patch,
    }));
  };

  const addFeature = () => {
    onChange((prev) => {
      if (prev.features.length >= MAX_FEATURES) {return prev;}

      return {
        ...prev,
        features: [...prev.features, createAboutEditorFeature()],
      };
    });
  };

  const removeFeature = (id: string) => {
    onChange((prev) => {
      if (prev.features.length <= MIN_FEATURES) {return prev;}

      return {
        ...prev,
        features: prev.features.filter((item) => item.id !== id),
      };
    });
  };

  const updateFeature = (id: string, patch: Record<string, unknown>) => {
    onChange((prev) => ({
      ...prev,
      features: prev.features.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  };

  const updateImageAt = (index: number, value: string) => {
    onChange((prev) => {
      const nextImages = [...prev.images];
      nextImages[index] = value;

      return {
        ...prev,
        image: index === 0 ? value : prev.image,
        images: nextImages,
      };
    });
  };

  const updateSolarStat = (patch: { value?: string; label?: string }) => {
    onChange((prev) => {
      const [currentStat, ...restStats] = prev.stats;
      const nextStat = createAboutEditorStat({
        id: currentStat?.id ?? 'about-solar-stat',
        label: currentStat?.label ?? 'năm kinh nghiệm',
        value: currentStat?.value ?? '18+',
        ...patch,
      });

      return {
        ...prev,
        stats: [nextStat, ...restStats],
      };
    });
  };

  const handleDragStart = (id: string) => { setDraggedId(id); };
  const handleDragEnd = () => { setDraggedId(null); setDragOverId(null); };
  const handleDragOver = (event: React.DragEvent, id: string) => { event.preventDefault(); if (draggedId !== id) { setDragOverId(id); } };
  const handleDrop = (event: React.DragEvent, targetId: string) => {
    event.preventDefault();
    if (!draggedId || draggedId === targetId) {return;}
    onChange((prev) => {
      const next = [...prev.features];
      const draggedIndex = next.findIndex((item) => item.id === draggedId);
      const targetIndex = next.findIndex((item) => item.id === targetId);
      if (draggedIndex < 0 || targetIndex < 0) {return prev;}
      const [moved] = next.splice(draggedIndex, 1);
      next.splice(targetIndex, 0, moved);
      return { ...prev, features: next };
    });
    setDraggedId(null);
    setDragOverId(null);
  };

  const showThreeImages = previewStyle === 'minimal' || previewStyle === 'spaCollage';
  const showSolarStat = previewStyle === 'solarFeature';
  const solarStat = state.stats[0] ?? { label: 'năm kinh nghiệm', value: '18+' };

  return (
    <>
      <FormSectionsToggleAllButton
        hasClosedSection={hasClosedSection}
        onToggleAll={handleToggleAll}
      />

      <div className="mb-3">
        <HomeComponentDisplaySettingsSection
          open={openSections.settings}
          onOpenChange={(open) => toggleSection('settings', open)}
          cornerRadius={cornerRadius}
          onCornerRadiusChange={onCornerRadiusChange}
          spacing={spacing}
          onSpacingChange={onSpacingChange}
        />
      </div>

      <div className="mb-3">
        <SubSection
          icon={ImageIcon}
          title="Cấu hình Về chúng tôi"
          open={openSections.about}
          onOpenChange={(open) => toggleSection('about', open)}
          actions={<AiAboutImport onApply={applyAiImport} />}
        >
        <div className="space-y-4">
          {/* Row 1: 3 cols — Sub-heading / Highlight / Phone */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tiêu đề nhỏ (Sub-heading)</Label>
              <Input
                value={state.subHeading}
                onChange={(event) => { updateField('subHeading', event.target.value); }}
                placeholder="Câu chuyện thương hiệu"
              />
            </div>
            <div className="space-y-2">
              <Label>Chữ highlight</Label>
              <Input
                value={state.highlightText}
                onChange={(event) => { updateField('highlightText', event.target.value); }}
                placeholder="Tên thương hiệu"
              />
            </div>
            <div className="space-y-2">
              <Label>Số điện thoại</Label>
              <Input
                value={state.phone}
                onChange={(event) => { updateField('phone', event.target.value); }}
                placeholder="1800 6750"
              />
            </div>
          </div>

          {/* Row 2: 2 cols — Heading / Mô tả */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tiêu đề chính (Heading)</Label>
              <Input
                value={state.heading}
                onChange={(event) => { updateField('heading', event.target.value); }}
                placeholder="Mang đến giá trị thực"
              />
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <textarea
                value={state.description}
                onChange={(event) => { updateField('description', event.target.value); }}
                placeholder="Mô tả về công ty..."
                className="w-full min-h-[96px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm resize-y"
              />
            </div>
          </div>

          {/* Row 3: 2 cols — Ảnh (compact) / Nút bấm + Liên kết */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ImageFieldWithUpload
              label={showThreeImages ? 'Ảnh 1' : 'Hình ảnh'}
              value={state.image}
              onChange={(url) => { updateImageAt(0, url); }}
              folder="home-components"
              aspectRatio="banner"
              quality={0.85}
              placeholder="https://example.com/about-image.jpg"
            />
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Text nút bấm</Label>
                  <Input
                    value={state.buttonText}
                    onChange={(event) => { updateField('buttonText', event.target.value); }}
                    placeholder="Xem thêm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Liên kết</Label>
                  <Input
                    value={state.buttonLink}
                    onChange={(event) => { updateField('buttonLink', event.target.value); }}
                    placeholder="/about"
                  />
                </div>
              </div>
              {state.style === 'bento' ? (
                <div className="space-y-2">
                  <Label>Caption ảnh</Label>
                  <Input
                    value={state.imageCaption}
                    onChange={(event) => { updateField('imageCaption', event.target.value); }}
                    placeholder="Kiến tạo không gian làm việc hiện đại & bền vững."
                  />
                </div>
              ) : null}
              {showSolarStat ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Số liệu badge</Label>
                    <Input
                      value={solarStat.value}
                      onChange={(event) => { updateSolarStat({ value: event.target.value }); }}
                      placeholder="18+"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nhãn badge</Label>
                    <Input
                      value={solarStat.label}
                      onChange={(event) => { updateSolarStat({ label: event.target.value }); }}
                      placeholder="năm kinh nghiệm"
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {showThreeImages ? (
            <div className="space-y-3">
              <Label>Bộ ảnh layout</Label>
              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2].map((index) => (
                  <ImageFieldWithUpload
                    key={`about-image-${index}`}
                    label={`Ảnh ${index + 1}`}
                    value={state.images[index] ?? ''}
                    onChange={(url) => { updateImageAt(index, url); }}
                    folder="home-components"
                    aspectRatio="banner"
                    quality={0.85}
                    placeholder={`https://example.com/about-image-${index + 1}.jpg`}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-500">Layout này dùng 3 ảnh riêng.</p>
            </div>
          ) : null}
        </div>
        </SubSection>
      </div>

      <div className="mb-3">
        <SubSection
          icon={ImageIcon}
          title={`Điểm nổi bật (${state.features.length}/${MAX_FEATURES})`}
          open={openSections.features}
          onOpenChange={(open) => toggleSection('features', open)}
          actions={(
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addFeature}
              className="gap-2"
              disabled={state.features.length >= MAX_FEATURES}
            >
              <Plus size={14} /> Thêm
            </Button>
          )}
        >
        <div className="space-y-2">
          {state.features.map((feature, idx) => (
            <div
              key={feature.id}
              draggable
              onDragStart={() => { handleDragStart(feature.id); }}
              onDragEnd={handleDragEnd}
              onDragOver={(event) => { handleDragOver(event, feature.id); }}
              onDrop={(event) => { handleDrop(event, feature.id); }}
              className={cn('rounded-lg border px-2 py-1.5 transition-all', draggedId === feature.id && 'opacity-50', dragOverId === feature.id && 'ring-2 ring-blue-500')}
            >
              <div className="flex items-center gap-2">
                <GripVertical size={14} className="text-slate-400 shrink-0 cursor-grab" />
                <span className="text-[10px] text-slate-400 shrink-0 w-5 text-center">#{idx + 1}</span>
                {feature.mediaType === 'image' ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => { updateFeature(feature.id, { mediaType: 'icon', image: '' }); }}
                      className="flex h-8 items-center gap-1 rounded border border-slate-200 px-2 text-[11px] text-slate-500 hover:bg-slate-50"
                    >
                      <ImageIcon size={12} />
                      Ảnh
                    </button>
                    <SettingsImageUploader
                      value={feature.image}
                      onChange={(url) => { updateFeature(feature.id, { image: url ?? '' }); }}
                      folder="home-components"
                      previewSize="sm"
                    />
                  </div>
                ) : (
                  <IconPopoverPicker
                    value={feature.iconName || 'Star'}
                    onChange={(value) => { updateFeature(feature.id, { iconName: value, image: '' }); }}
                    options={ABOUT_POPOVER_OPTIONS}
                    compact
                  />
                )}
                <Input
                  placeholder="Tiêu đề"
                  value={feature.title}
                  onChange={(event) => { updateFeature(feature.id, { title: event.target.value }); }}
                  className="h-8 flex-1 text-sm"
                />
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      updateFeature(feature.id, feature.mediaType === 'image'
                        ? { mediaType: 'icon', image: '' }
                        : { mediaType: 'image' });
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    title={feature.mediaType === 'image' ? 'Chuyển sang Icon' : 'Chuyển sang Ảnh'}
                  >
                    {feature.mediaType === 'image' ? <ImageIcon size={13} /> : <ImageIcon size={13} />}
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-red-500 h-7 w-7 shrink-0"
                    onClick={() => { removeFeature(feature.id); }}
                    disabled={state.features.length <= MIN_FEATURES}
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        </SubSection>
      </div>
    </>
  );
}
