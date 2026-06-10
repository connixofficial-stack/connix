'use client';

import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { ColorInfoPanel } from '../../_shared/components/ColorInfoPanel';
import { PreviewWrapper, usePreviewDark } from '../../_shared/components/PreviewWrapper';
import { deviceWidths, usePreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import type { SectionSpacing } from '../../_shared/types/sectionSpacing';
import {
  getClientsValidationResult,
} from '../_lib/colors';
import { CLIENTS_STYLES } from '../_lib/constants';
import { ClientsSectionShared } from './ClientsSectionShared';
import type { ClientItem, ClientsBrandMode, ClientsCornerRadius, ClientsStyle, ClientsHeaderAlign } from '../_types';
import { adaptTokensForDarkMode } from '@/components/site/home/utils/darkModeColorAdapter';

interface ClientsPreviewProps {
  items: ClientItem[];
  title?: string;
  brandColor: string;
  secondary: string;
  mode?: ClientsBrandMode;
  selectedStyle?: ClientsStyle;
  onStyleChange?: (style: ClientsStyle) => void;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
  // Shared header config
  hideHeader?: boolean;
  showTitle?: boolean;
  subtitle?: string;
  showSubtitle?: boolean;
  headerAlign?: ClientsHeaderAlign;
  titleColorPrimary?: boolean;
  subtitleAboveTitle?: boolean;
  uppercaseText?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  spacing?: SectionSpacing;
  cornerRadius?: ClientsCornerRadius;
}

const getImageInfoText = (style: ClientsStyle, count: number) => {
  if (count === 0) {return 'Chưa có ảnh banner';}
  if (style === 'layout01') {return `${count} ảnh • Mosaic 1 lớn + 3 phụ`;}
  if (style === 'layout02') {return `${count} ảnh • 1 banner full-width`;}
  if (style === 'layout03') {return `${count} ảnh • 1 ảnh trên + 2 ảnh dưới`;}
  if (style === 'layout04') {return `${count} ảnh • 2 banner ngang cân đối`;}
  if (style === 'layout05') {return `${count} ảnh • 3 banner landscape`;}
  if (style === 'layout07') {return `${count} ảnh • Grid 2×2 ngang`;}
  if (style === 'layout08') {return `${count} ảnh • Carousel vuốt ngang`;}
  return `${count} ảnh • 4 banner dọc nổi bật`;
};

export const ClientsPreview = ({
  items,
  title = 'Khách hàng tin tưởng',
  brandColor,
  secondary,
  mode = 'dual',
  selectedStyle = 'layout02',
  onStyleChange,
  fontStyle,
  fontClassName,
  hideHeader,
  showTitle,
  subtitle,
  showSubtitle,
  headerAlign,
  titleColorPrimary,
  subtitleAboveTitle,
  uppercaseText,
  showBadge,
  badgeText,
  spacing,
  cornerRadius,
}: ClientsPreviewProps) => {
  const { device, setDevice } = usePreviewDevice();
  const { isDark } = usePreviewDark();

  const validation = React.useMemo(() => getClientsValidationResult({
    primary: brandColor,
    secondary,
    mode,
    style: selectedStyle,
  }), [brandColor, secondary, mode, selectedStyle]);
  const tokens = React.useMemo(() => adaptTokensForDarkMode(validation.tokens, isDark), [validation.tokens, isDark]);

  const info = getImageInfoText(selectedStyle, items.length);
  const resolvedTitle = typeof title === 'string' ? title.trim() : '';
  const previewSubtitle = (subtitle ?? '').trim();
  const previewBadgeText = (badgeText ?? '').trim();

  return (
    <>
      <PreviewWrapper
        title="Preview Banner ảnh thương hiệu"
        device={device}
        setDevice={setDevice}
        previewStyle={selectedStyle}
        setPreviewStyle={(value) => onStyleChange?.(value as ClientsStyle)}
        styles={CLIENTS_STYLES}
        info={info}
        deviceWidthClass={deviceWidths[device]}
        fontStyle={fontStyle}
        fontClassName={fontClassName}
      >
        <BrowserFrame>
          {items.length === 0 ? (
            <section className="px-4 py-8" style={{ backgroundColor: tokens.neutralSurface }}>
              <div className="flex flex-col items-center justify-center h-40">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: tokens.placeholderIconBackground }}>
                  <ImageIcon size={28} style={{ color: tokens.placeholderIcon }} />
                </div>
                <p className="text-sm font-medium" style={{ color: tokens.neutralText }}>Chưa có ảnh banner</p>
                <p className="text-xs mt-1" style={{ color: tokens.placeholderText }}>Thêm từ 1 đến 8 ảnh để xem preview</p>
              </div>
            </section>
          ) : (
            <ClientsSectionShared
              context="preview"
              title={resolvedTitle}
              style={selectedStyle}
              items={items}
              tokens={tokens}
              device={device}
              hideHeader={hideHeader}
              showTitle={showTitle}
              subtitle={previewSubtitle}
              showSubtitle={showSubtitle}
              headerAlign={headerAlign}
              titleColorPrimary={titleColorPrimary}
              subtitleAboveTitle={subtitleAboveTitle}
              uppercaseText={uppercaseText}
              showBadge={showBadge}
              badgeText={previewBadgeText}
              spacing={spacing}
              cornerRadius={cornerRadius}
              brandColor={brandColor}
            />
          )}
        </BrowserFrame>
      </PreviewWrapper>

      <ColorInfoPanel
        brandColor={tokens.primary}
        secondary={mode === 'single' ? tokens.primary : tokens.secondary}
        description={mode === 'single'
          ? 'Chế độ một màu: màu chính được dùng cho badge, viền ảnh, nền overlay và các điểm nhấn của banner ảnh thương hiệu.'
          : 'Màu phụ áp dụng cho badge, viền ảnh, nền overlay và các điểm nhấn của banner ảnh thương hiệu.'}
      />

      <div className="mt-3 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <ImageIcon size={14} className="text-slate-400 flex-shrink-0" />
          <div className="text-xs text-slate-600 dark:text-slate-400">
            {selectedStyle === 'layout01' && <span><strong>Layout 01</strong> • 1 ảnh lớn bên trái, 2 ảnh vuông phía trên và 1 ảnh ngang phía dưới</span>}
            {selectedStyle === 'layout02' && <span><strong>Layout 02</strong> • 1 banner full-width theo đúng showcase hero</span>}
            {selectedStyle === 'layout03' && <span><strong>Layout 03</strong> • 1 banner ngang phía trên và 2 banner nhỏ phía dưới</span>}
            {selectedStyle === 'layout04' && <span><strong>Layout 04</strong> • 2 banner ngang song song</span>}
            {selectedStyle === 'layout05' && <span><strong>Layout 05</strong> • 3 banner landscape trong một hàng</span>}
            {selectedStyle === 'layout06' && <span><strong>Layout 06</strong> • 4 banner dọc/portrait</span>}
            {selectedStyle === 'layout07' && <span><strong>Layout 07</strong> • Grid 2×2, 4 ảnh ngang</span>}
            {selectedStyle === 'layout08' && <span><strong>Layout 08</strong> • Carousel vuốt ngang, có trạng thái nút trước/sau</span>}
          </div>
        </div>
      </div>
    </>
  );
};
