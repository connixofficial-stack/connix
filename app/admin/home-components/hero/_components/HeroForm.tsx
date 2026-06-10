'use client';

import React from 'react';
import { ToggleSwitch } from '@/components/modules/shared';
import { Input, Label } from '../../../components/ui';
import { MultiImageUploader } from '../../../components/MultiImageUploader';
import { type HeroContent, type HeroCornerRadius, type HeroSlide, type HeroSpacing, type HeroStyle } from '../_types';
import { AiDemoHeroImport } from '../../product-list/_components/AiDemoProductsImport';
import { AlignCenter, AlignLeft, AlignRight, ExternalLink, FileText, Image } from 'lucide-react';
import { getHeroCropAspectRatio } from '../_lib/constants';
import type { Id } from '@/convex/_generated/dataModel';
import { CollapsibleSubSection as SubSection } from '../../_shared/components/CollapsibleSubSection';
import { SectionSpacingControl } from '../../_shared/components/SectionSpacingControl';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { FormSectionsToggleAllButton } from '../../_shared/components/FormSectionsToggleAllButton';
import { HomeComponentDisplaySettingsSection } from '../../_shared/components/HomeComponentDisplaySettingsSection';

export const HeroForm = ({
  heroSlides,
  setHeroSlides,
  heroStyle,
  heroContent,
  setHeroContent,
  noBorderRadius,
  setNoBorderRadius,
  cornerRadius,
  setCornerRadius,
  spacing,
  setSpacing,
  onUploadComplete,
  defaultExpanded = true,
  actions,
}: {
  heroSlides: HeroSlide[];
  setHeroSlides: (slides: HeroSlide[]) => void;
  heroStyle: HeroStyle;
  heroContent: HeroContent;
  setHeroContent: (content: HeroContent) => void;
  noBorderRadius?: boolean;
  setNoBorderRadius?: (value: boolean) => void;
  cornerRadius?: HeroCornerRadius;
  setCornerRadius?: (value: HeroCornerRadius) => void;
  spacing?: HeroSpacing;
  setSpacing?: (value: HeroSpacing) => void;
  onUploadComplete?: (info: { itemId: string | number; storageId: Id<'_storage'>; url: string; folder: string }) => void | Promise<void>;
  defaultExpanded?: boolean;
  actions?: React.ReactNode;
}) => {
  const showSettingsSection = Boolean((cornerRadius && setCornerRadius && spacing && setSpacing) || setNoBorderRadius || (spacing && setSpacing));
  const showContentSection = ['fullscreen', 'conquest', 'split', 'parallax'].includes(heroStyle);

  const activeSections = React.useMemo(() => {
    const sections: ('settings' | 'slides' | 'content')[] = [];
    if (showSettingsSection) {
      sections.push('settings');
    }
    sections.push('slides');
    if (showContentSection) {
      sections.push('content');
    }
    return sections;
  }, [showSettingsSection, showContentSection]);

  const { openSections, toggleSection, hasClosedSection, handleToggleAll } = useFormSectionsState(
    activeSections,
    defaultExpanded
  );

  return (
    <div className="mb-6 space-y-3">
      <AiDemoHeroImport heroStyle={heroStyle} onApply={(items) => setHeroSlides(items as HeroSlide[])} />

      <FormSectionsToggleAllButton
        hasClosedSection={hasClosedSection}
        onToggleAll={handleToggleAll}
      />

      {showSettingsSection ? (
        cornerRadius && setCornerRadius && spacing && setSpacing ? (
          <HomeComponentDisplaySettingsSection
            open={openSections.settings}
            onOpenChange={(open) => toggleSection('settings', open)}
            cornerRadius={cornerRadius}
            onCornerRadiusChange={(value) => {
              setCornerRadius(value);
              setNoBorderRadius?.(value === 'none');
            }}
            spacing={spacing}
            onSpacingChange={setSpacing}
          />
        ) : (
          <SubSection
            icon={Image}
            title="Cài đặt hiển thị"
            open={openSections.settings}
            onOpenChange={(open) => toggleSection('settings', open)}
          >
            {setNoBorderRadius ? (
            <label className="inline-flex cursor-pointer select-none items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={Boolean(noBorderRadius)}
                onChange={(event) => setNoBorderRadius(event.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-300"
              />
              Bỏ bo góc ảnh banner
            </label>
            ) : null}
            {spacing && setSpacing ? (
              <SectionSpacingControl value={spacing} onChange={setSpacing} />
            ) : null}
          </SubSection>
        )
      ) : null}

      <SubSection
        icon={Image}
        title="Danh sách Banner (Slider)"
        open={openSections.slides}
        onOpenChange={(open) => toggleSection('slides', open)}
        actions={actions}
      >
        <div className="space-y-2">
          <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Hệ thống chỉ upload ảnh. Với video, hãy upload ngoài như Cloudinary rồi dán link .mp4/.webm/.ogg hoặc link YouTube để không tốn storage.
            </p>
            <a
              href="https://cloudinary.com/users/register_free"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Mở Cloudinary
              <ExternalLink size={12} />
            </a>
          </div>
          <MultiImageUploader<HeroSlide>
            items={heroSlides}
            onChange={setHeroSlides}
            folder="hero-banners"
            imageKey="url"
            extraFields={[{ key: 'link', placeholder: 'URL liên kết (khi click vào banner)', type: 'url' }]}
            minItems={1}
            maxItems={10}
            aspectRatio="banner"
            columns={1}
            showReorder={true}
            addButtonText="Thêm Banner"
            emptyText="Chưa có banner nào"
            enableCrop
            cropOnUpload={false}
            cropAspectRatio={(_, index) => getHeroCropAspectRatio(heroStyle, index)}
            imageAspectRatio={getHeroCropAspectRatio(heroStyle)}
            allowVideoUrl
            deleteMode="defer"
            onUploadComplete={onUploadComplete}
          />
        </div>
      </SubSection>

      {showContentSection && (
        <SubSection
          icon={FileText}
          title={`Nội dung Hero (${heroStyle})`}
          open={openSections.content}
          onOpenChange={(open) => toggleSection('content', open)}
        >
          <div className="space-y-4">
            {heroStyle === 'fullscreen' && (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2">
                <div className="space-y-0.5">
                  <Label className="text-sm">Hiển thị nội dung Hero</Label>
                  <p className="text-xs text-slate-500">Tắt để ẩn chữ và lớp mờ trên ảnh</p>
                </div>
                <ToggleSwitch
                  enabled={heroContent.showFullscreenContent !== false}
                  onChange={() =>
                    setHeroContent({
                      ...heroContent,
                      showFullscreenContent: !(heroContent.showFullscreenContent !== false),
                    })
                  }
                />
              </div>
            )}
            {(heroStyle === 'fullscreen' || heroStyle === 'conquest' || heroStyle === 'parallax') && (
              <div className="flex items-center gap-4 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2">
                <Label className="text-sm shrink-0">Backdrop</Label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={heroContent.overlayOpacity ?? 50}
                  onChange={(e) => setHeroContent({ ...heroContent, overlayOpacity: Number(e.target.value) })}
                  className="flex-1 h-1.5 accent-blue-500 cursor-pointer"
                />
                <span className="text-xs text-slate-500 tabular-nums w-8 text-right">{heroContent.overlayOpacity ?? 50}%</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Badge / Nhãn</Label>
                <Input 
                  value={heroContent.badge} 
                  onChange={(e) =>{  setHeroContent({ ...heroContent, badge: e.target.value }); }}
                  placeholder="VD: Nổi bật, Hot, Mới..."
                />
              </div>
              <div className="space-y-2">
                <Label>Màu highlight</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={heroContent.highlightColor || '#ef4444'}
                    onChange={(e) => setHeroContent({ ...heroContent, highlightColor: e.target.value })}
                    className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer p-0.5"
                  />
                  <Input
                    value={heroContent.highlightColor || '#ef4444'}
                    onChange={(e) => setHeroContent({ ...heroContent, highlightColor: e.target.value })}
                    placeholder="#ef4444"
                    className="flex-1 text-sm font-mono"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2">
              <Label className="text-sm shrink-0">Căn chỉnh</Label>
              <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                {(['left', 'center', 'right'] as const).map((align) => {
                  const Icon = align === 'left' ? AlignLeft : align === 'center' ? AlignCenter : AlignRight;
                  const isActive = (heroContent.textAlign || 'left') === align;
                  return (
                    <button
                      key={align}
                      type="button"
                      onClick={() => setHeroContent({ ...heroContent, textAlign: align })}
                      className={`px-3 py-1.5 transition-colors ${isActive ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                      <Icon size={16} />
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Tiêu đề chính</Label>
                <span className="text-[11px] text-slate-400">Dùng <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-blue-600 dark:text-blue-400">{'{text}'}</code> để tô màu · Enter để xuống dòng</span>
              </div>
              <textarea 
                value={heroContent.heading} 
                onChange={(e) =>{  setHeroContent({ ...heroContent, heading: e.target.value }); }}
                placeholder={"VD: Nhanh Chóng - An Toàn\nCùng Bean {Cargo}"}
                rows={2}
                className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <textarea 
                value={heroContent.description} 
                onChange={(e) =>{  setHeroContent({ ...heroContent, description: e.target.value }); }}
                placeholder="Mô tả ngắn gọn..."
                className="w-full min-h-[60px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nút chính</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={heroContent.primaryButtonColor || '#000000'}
                    onChange={(e) => setHeroContent({ ...heroContent, primaryButtonColor: e.target.value })}
                    className="w-9 h-9 shrink-0 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer p-0.5"
                    title="Màu nút chính"
                  />
                  <Input 
                    value={heroContent.primaryButtonText} 
                    onChange={(e) =>{  setHeroContent({ ...heroContent, primaryButtonText: e.target.value }); }}
                    placeholder="VD: Khám phá ngay, Mua ngay..."
                  />
                </div>
              </div>
              {(heroStyle === 'fullscreen' || heroStyle === 'conquest') && (
                <div className="space-y-2">
                  <Label>Nút phụ</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={heroContent.secondaryButtonColor || '#ffffff'}
                      onChange={(e) => setHeroContent({ ...heroContent, secondaryButtonColor: e.target.value })}
                      className="w-9 h-9 shrink-0 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer p-0.5"
                      title="Màu nút phụ"
                    />
                    <Input 
                      value={heroContent.secondaryButtonText} 
                      onChange={(e) =>{  setHeroContent({ ...heroContent, secondaryButtonText: e.target.value }); }}
                      placeholder="VD: Tìm hiểu thêm..."
                    />
                  </div>
                </div>
              )}
              {heroStyle === 'parallax' && (
                <div className="space-y-2">
                  <Label>Text đếm ngược / Phụ</Label>
                  <Input 
                    value={heroContent.countdownText} 
                    onChange={(e) =>{  setHeroContent({ ...heroContent, countdownText: e.target.value }); }}
                    placeholder="VD: Còn 3 ngày, Chỉ hôm nay..."
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Liên kết nút chính</Label>
                <Input 
                  value={heroContent.primaryButtonLink} 
                  onChange={(e) =>{  setHeroContent({ ...heroContent, primaryButtonLink: e.target.value }); }}
                  placeholder="/contact hoặc https://..."
                />
              </div>
              {(heroStyle === 'fullscreen' || heroStyle === 'conquest') && (
                <div className="space-y-2">
                  <Label>Liên kết nút phụ</Label>
                  <Input 
                    value={heroContent.secondaryButtonLink} 
                    onChange={(e) =>{  setHeroContent({ ...heroContent, secondaryButtonLink: e.target.value }); }}
                    placeholder="/pricing hoặc https://..."
                  />
                </div>
              )}
            </div>
          </div>
        </SubSection>
      )}
    </div>
  );
};
