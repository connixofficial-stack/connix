'use client';

import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { Button, Label, cn } from '../../../components/ui';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { useSectionHeaderState } from '../../_shared/hooks/useSectionHeaderState';
import { HeaderConfigSection } from '../../_shared/components/HeaderConfigSection';
import { HomeComponentDisplaySettingsSection } from '../../_shared/components/HomeComponentDisplaySettingsSection';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { GalleryForm } from '../../gallery/_components/GalleryForm';
import { GalleryPreview } from '../../gallery/_components/GalleryPreview';
import type { GalleryItem, GalleryStyle, GalleryCornerRadius, GalleryDesktopColumns } from '../../gallery/_types';
import { DEFAULT_GALLERY_CONFIG } from '../../gallery/_types';
import { normalizeGalleryHarmony } from '../../gallery/_lib/colors';
import { AiDemoGalleryImport } from '../../product-list/_components/AiDemoProductsImport';
import { ToggleSwitch } from '@/components/modules/shared';

const DEFAULT_GALLERY_ITEMS: GalleryItem[] = [
  { id: 'item-1', link: '', name: '', url: '' },
  { id: 'item-2', link: '', name: '', url: '' },
];

export default function GalleryCreatePage() {
  const COMPONENT_TYPE = 'Gallery';
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Thư viện ảnh', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { primary, secondary, mode } = effectiveColors;
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  const headerState = useSectionHeaderState({
    hideHeader: false,
    showTitle: true,
    showSubtitle: true,
    subtitle: '',
    headerAlign: 'left',
    titleColorPrimary: false,
    subtitleAboveTitle: false,
    uppercaseText: false,
    showBadge: true,
    badgeText: '',
  });

  const { openSections: headerOpenSections, toggleSection: toggleHeaderSection } = useFormSectionsState(['header', 'display'], true);

  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(DEFAULT_GALLERY_ITEMS);
  const [galleryStyle, setGalleryStyle] = useState<GalleryStyle>('spotlight');
  const [fullWidthDesktop, setFullWidthDesktop] = useState(DEFAULT_GALLERY_CONFIG.fullWidthDesktop ?? DEFAULT_GALLERY_CONFIG.fullWidth ?? false);
  const [desktopColumns, setDesktopColumns] = useState<GalleryDesktopColumns>(DEFAULT_GALLERY_CONFIG.desktopColumns ?? 4);
  const [cornerRadius, setCornerRadius] = useState<GalleryCornerRadius>(DEFAULT_GALLERY_CONFIG.cornerRadius ?? 'lg');

  const harmony = normalizeGalleryHarmony(undefined);

  const DEMO_GALLERY_ITEMS: GalleryItem[] = [
    { id: 'demo-1', link: '', name: '', url: '/demo/gallery/gallery-1.png' },
    { id: 'demo-2', link: '', name: '', url: '/demo/gallery/gallery-2.png' },
    { id: 'demo-3', link: '', name: '', url: '/demo/gallery/gallery-3.png' },
    { id: 'demo-4', link: '', name: '', url: '/demo/gallery/gallery-4.png' },
    { id: 'demo-5', link: '', name: '', url: '/demo/gallery/gallery-5.png' },
    { id: 'demo-6', link: '', name: '', url: '/demo/gallery/gallery-6.png' },
  ];


  const onSubmit = (e: React.FormEvent) => {
    void handleSubmit(e, {
      harmony,
      items: galleryItems.map((item) => ({ link: item.link, name: item.name, url: item.url, storageId: item.storageId })),
      style: galleryStyle,
      hideHeader: headerState.hideHeader,
      showTitle: headerState.showTitle,
      subtitle: headerState.subtitle,
      showSubtitle: headerState.showSubtitle,
      headerAlign: headerState.headerAlign,
      titleColorPrimary: headerState.titleColorPrimary,
      subtitleAboveTitle: headerState.subtitleAboveTitle,
      uppercaseText: headerState.uppercaseText,
      showBadge: headerState.showBadge,
      badgeText: headerState.badgeText,
      spacing: headerState.spacing,
      noVerticalMargin: headerState.spacing === 'none',
      fullWidthDesktop,
      desktopColumns,
      cornerRadius,
      noBorderRadius: cornerRadius === 'none',
    });
  };

  return (
    <ComponentFormWrapper
      type={COMPONENT_TYPE}
      title={title}
      setTitle={setTitle}
      active={active}
      setActive={setActive}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      customState={customState}
      showCustomBlock={showCustomBlock}
      setCustomState={setCustomState}
      systemColors={systemColors}
      customFontState={customFontState}
      showFontCustomBlock={showFontCustomBlock}
      setCustomFontState={setCustomFontState}
      skipTitleInput={true}
    >
      <HeaderConfigSection
        hideHeader={headerState.hideHeader}
        title={title}
        showTitle={headerState.showTitle}
        subtitle={headerState.subtitle}
        showSubtitle={headerState.showSubtitle}
        headerAlign={headerState.headerAlign}
        titleColorPrimary={headerState.titleColorPrimary}
        subtitleAboveTitle={headerState.subtitleAboveTitle}
        uppercaseText={headerState.uppercaseText}
        showBadge={headerState.showBadge}
        badgeText={headerState.badgeText}
        onHideHeaderChange={headerState.setHideHeader}
        onTitleChange={setTitle}
        onShowTitleChange={headerState.setShowTitle}
        onSubtitleChange={headerState.setSubtitle}
        onShowSubtitleChange={headerState.setShowSubtitle}
        onHeaderAlignChange={headerState.setHeaderAlign}
        onTitleColorPrimaryChange={headerState.setTitleColorPrimary}
        onSubtitleAboveTitleChange={headerState.setSubtitleAboveTitle}
        onUppercaseTextChange={headerState.setUppercaseText}
        onShowBadgeChange={headerState.setShowBadge}
        onBadgeTextChange={headerState.setBadgeText}
        expanded={headerOpenSections.header}
        onExpandedChange={(open) => toggleHeaderSection('header', open)}
        titleRequired={true}
        titleLabel="Tiêu đề hiển thị"
        titlePlaceholder="Nhập tiêu đề component..."
      />

      <div className="mb-3">
        <HomeComponentDisplaySettingsSection
          open={headerOpenSections.display}
          onOpenChange={(open) => toggleHeaderSection('display', open)}
          spacing={headerState.spacing}
          onSpacingChange={headerState.setSpacing}
          cornerRadius={cornerRadius}
          onCornerRadiusChange={setCornerRadius}
        >
          <div className="space-y-2">
            <Label>Số cột desktop</Label>
            <div className="grid grid-cols-3 gap-2">
              {[3, 4, 6].map((option) => {
                const selected = desktopColumns === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setDesktopColumns(option as GalleryDesktopColumns)}
                    className={cn(
                      'h-9 rounded-md border text-xs transition-colors',
                      selected
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300'
                        : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
                    )}
                  >
                    {option} cột
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
            <div className="space-y-0.5">
              <Label className="text-sm">Full width desktop</Label>
              <p className="text-xs text-slate-500">Bật để mở rộng toàn màn hình</p>
            </div>
            <ToggleSwitch enabled={fullWidthDesktop} onChange={() => setFullWidthDesktop((current) => !current)} />
          </div>
        </HomeComponentDisplaySettingsSection>
      </div>

      <div className="mb-6">
        <GalleryForm
          galleryItems={galleryItems}
          setGalleryItems={setGalleryItems}
          componentType="Gallery"
          style={galleryStyle}
          headerPrimary={primary}
          headerSecondary={secondary}
        />

        <div className="mt-3 flex items-center justify-between">
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setGalleryItems(DEMO_GALLERY_ITEMS)}>
              Dùng ảnh demo
            </Button>
            <AiDemoGalleryImport buttonClassName="h-10" onApply={setGalleryItems} />
          </div>
        </div>
      </div>

      <GalleryPreview
        items={galleryItems.map((item, idx) => ({ id: idx + 1, link: item.link, name: '', url: item.url }))}
        brandColor={primary}
        secondary={secondary}
        mode={mode}
        harmony={harmony}
        selectedStyle={galleryStyle}
        onStyleChange={setGalleryStyle}
        title={title}
        fontStyle={fontStyle}
        fontClassName="font-active"
        hideHeader={headerState.hideHeader}
        showTitle={headerState.showTitle}
        subtitle={headerState.subtitle}
        showSubtitle={headerState.showSubtitle}
        headerAlign={headerState.headerAlign}
        titleColorPrimary={headerState.titleColorPrimary}
        subtitleAboveTitle={headerState.subtitleAboveTitle}
        uppercaseText={headerState.uppercaseText}
        showBadge={headerState.showBadge}
        badgeText={headerState.badgeText}
        spacing={headerState.spacing}
        fullWidthDesktop={fullWidthDesktop}
        desktopColumns={desktopColumns}
        cornerRadius={cornerRadius}
      />

      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center flex-shrink-0">
            <ImageIcon size={16} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">Kích thước ảnh tối ưu</p>
            <div className="text-xs text-blue-700 dark:text-blue-300">
              {galleryStyle === 'spotlight' && (
                <div className="space-y-1">
                  <p><strong className="text-blue-900 dark:text-blue-100">Tiêu điểm (Spotlight)</strong></p>
                  <p>• Ảnh chính: <strong>1200×900px</strong> (tỷ lệ 4:3)</p>
                  <p>• Ảnh phụ: <strong>600×600px</strong> (tỷ lệ 1:1, vuông)</p>
                  <p className="text-blue-500 dark:text-blue-400 italic">Layout: 1 ảnh lớn bên trái + 3 ảnh vuông bên phải</p>
                </div>
              )}
              {galleryStyle === 'explore' && (
                <div className="space-y-1">
                  <p><strong className="text-blue-900 dark:text-blue-100">Khám phá (Explore)</strong></p>
                  <p>• Tất cả ảnh: <strong>600×600px</strong> (tỷ lệ 1:1, vuông)</p>
                  <p className="text-blue-500 dark:text-blue-400 italic">Layout: Grid đều kiểu Instagram - 5 cột desktop, 3 cột mobile</p>
                </div>
              )}
              {galleryStyle === 'stories' && (
                <div className="space-y-1">
                  <p><strong className="text-blue-900 dark:text-blue-100">Câu chuyện (Stories)</strong></p>
                  <p>• Ảnh nhỏ: <strong>800×600px</strong> (tỷ lệ 4:3)</p>
                  <p>• Ảnh lớn: <strong>1200×600px</strong> (tỷ lệ 2:1)</p>
                  <p className="text-blue-500 dark:text-blue-400 italic">Layout: Masonry nhẹ - ảnh 1,4 chiếm 2 cột, còn lại 1 cột</p>
                </div>
              )}
              {galleryStyle === 'grid' && (
                <div className="space-y-1">
                  <p><strong className="text-blue-900 dark:text-blue-100">Grid</strong></p>
                  <p>• Tất cả ảnh: <strong>800×800px</strong> (tỷ lệ 1:1, vuông)</p>
                  <p className="text-blue-500 dark:text-blue-400 italic">Layout: Grid đều - 4 cột desktop, 2 cột mobile. Click để xem lightbox.</p>
                </div>
              )}
              {galleryStyle === 'marquee' && (
                <div className="space-y-1">
                  <p><strong className="text-blue-900 dark:text-blue-100">Marquee</strong></p>
                  <p>• Tất cả ảnh: <strong>800×600px</strong> (tỷ lệ 4:3)</p>
                  <p className="text-blue-500 dark:text-blue-400 italic">Layout: Auto scroll horizontal. Hover/focus/touch để tạm dừng. Có thể kéo vuốt ngang bằng chuột.</p>
                </div>
              )}
              {galleryStyle === 'masonry' && (
                <div className="space-y-1">
                  <p><strong className="text-blue-900 dark:text-blue-100">Masonry</strong></p>
                  <p>• Ảnh ngang: <strong>800×600px</strong> (tỷ lệ 4:3)</p>
                  <p>• Ảnh dọc: <strong>600×800px</strong> (tỷ lệ 3:4)</p>
                  <p>• Ảnh vuông: <strong>600×600px</strong> (tỷ lệ 1:1)</p>
                  <p className="text-blue-500 dark:text-blue-400 italic">Layout: Pinterest-like - ảnh cao/thấp khác nhau. 4 cột desktop, 2 cột mobile.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ComponentFormWrapper>
  );
}
