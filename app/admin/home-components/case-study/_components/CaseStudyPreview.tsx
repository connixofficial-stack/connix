'use client';

import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { ColorInfoPanel } from '../../_shared/components/ColorInfoPanel';
import { PreviewWrapper, usePreviewDark } from '../../_shared/components/PreviewWrapper';
import { deviceWidths, usePreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import { CASE_STUDY_STYLES } from '../_lib/constants';
import { getCaseStudyColors } from '../_lib/colors';
import { CaseStudySectionShared } from './CaseStudySectionShared';
import type { CaseStudyBrandMode, CaseStudyCornerRadius, CaseStudyDesktopColumns, CaseStudyProject, CaseStudySpacing, CaseStudyStyle } from '../_types';
import {
  DEFAULT_CASE_STUDY_CORNER_RADIUS,
  DEFAULT_CASE_STUDY_DESKTOP_COLUMNS,
  DEFAULT_CASE_STUDY_SPACING,
} from '../_types';
import { adaptTokensForDarkMode } from '@/components/site/home/utils/darkModeColorAdapter';

interface CaseStudyPreviewProps {
  projects: CaseStudyProject[];
  brandColor: string;
  secondary: string;
  mode?: CaseStudyBrandMode;
  selectedStyle?: CaseStudyStyle;
  onStyleChange?: (style: CaseStudyStyle) => void;
  title?: string;
  hideHeader?: boolean;
  showTitle?: boolean;
  subtitle?: string;
  showSubtitle?: boolean;
  headerAlign?: 'left' | 'center' | 'right';
  titleColorPrimary?: boolean;
  subtitleAboveTitle?: boolean;
  uppercaseText?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  cornerRadius?: CaseStudyCornerRadius;
  desktopColumns?: CaseStudyDesktopColumns;
  spacing?: CaseStudySpacing;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
}

const getImageSizeInfo = (count: number, style: CaseStudyStyle) => {
  if (count === 0) {return 'Chưa có dự án';}

  if (style === 'grid') {
    return `${count} dự án • Tất cả: 1200×900px (4:3)`;
  }

  if (style === 'featured') {
    if (count === 1) {return 'Dự án 1: 1200×900px (4:3)';}
    return `Dự án 1: 1200×800px • Dự án 2-${Math.min(count, 3)}: 600×600px (1:1)`;
  }

  if (style === 'list') {
    return `${count} dự án • Tất cả: 800×500px (16:10)`;
  }

  if (style === 'masonry') {
    return `${count} dự án • Ngang: 800×500px • Dọc: 600×900px • Vuông: 800×800px`;
  }

  if (style === 'carousel') {
    return `${count} dự án • Tất cả: 1000×750px (4:3)`;
  }

  return `${count} dự án • Tất cả: 800×600px (4:3)`;
};

export const CaseStudyPreview = ({
  projects,
  brandColor,
  secondary,
  mode = 'dual',
  selectedStyle,
  onStyleChange,
  title,
  hideHeader = false,
  showTitle = true,
  subtitle,
  showSubtitle = true,
  headerAlign = 'center',
  titleColorPrimary = false,
  subtitleAboveTitle = false,
  uppercaseText = false,
  showBadge = true,
  badgeText,
  cornerRadius = DEFAULT_CASE_STUDY_CORNER_RADIUS,
  desktopColumns = DEFAULT_CASE_STUDY_DESKTOP_COLUMNS,
  spacing = DEFAULT_CASE_STUDY_SPACING,
  fontStyle,
  fontClassName,
}: CaseStudyPreviewProps) => {
  const { device, setDevice } = usePreviewDevice();
  const { isDark } = usePreviewDark();
  const previewStyle = selectedStyle ?? 'grid';
  const setPreviewStyle = (value: string) => onStyleChange?.(value as CaseStudyStyle);

  const colors = React.useMemo(
    () => adaptTokensForDarkMode(getCaseStudyColors(brandColor, secondary, mode), isDark),
    [brandColor, secondary, mode, isDark],
  );

  return (
    <>
      <PreviewWrapper
        title="Preview Projects"
        device={device}
        setDevice={setDevice}
        previewStyle={previewStyle}
        setPreviewStyle={setPreviewStyle}
        styles={CASE_STUDY_STYLES}
        deviceWidthClass={deviceWidths[device]}
        info={getImageSizeInfo(projects.length, previewStyle)}
        fontStyle={fontStyle}
        fontClassName={fontClassName}
      >
        <BrowserFrame url="yoursite.com/projects">
          <CaseStudySectionShared
            projects={projects}
            style={previewStyle}
            mode={mode}
            tokens={colors}
            context="preview"
            device={device}
            title={title}
            hideHeader={hideHeader}
            showTitle={showTitle}
            subtitle={subtitle}
            showSubtitle={showSubtitle}
            headerAlign={headerAlign}
            titleColorPrimary={titleColorPrimary}
            subtitleAboveTitle={subtitleAboveTitle}
            uppercaseText={uppercaseText}
            showBadge={showBadge}
            badgeText={badgeText}
            cornerRadius={cornerRadius}
            desktopColumns={desktopColumns}
            spacing={spacing}
          />
        </BrowserFrame>

        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-start gap-2">
            <ImageIcon size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-slate-600 dark:text-slate-400">
              {previewStyle === 'grid' ? <p><strong>1200×900px</strong> (4:3) • Grid layout đều, card border nhẹ</p> : null}
              {previewStyle === 'featured' ? <p><strong>Dự án chính:</strong> 1200×900px (4:3) • <strong>Dự án phụ:</strong> 600×600px (1:1)</p> : null}
              {previewStyle === 'list' ? <p><strong>800×500px</strong> (16:10) • Horizontal list, thumb bên trái</p> : null}
              {previewStyle === 'masonry' ? <p><strong>Pinterest-style:</strong> Ngang 800×500px • Dọc 600×900px • Vuông 800×800px</p> : null}
              {previewStyle === 'carousel' ? <p><strong>1000×750px</strong> (4:3) • Carousel với navigation buttons & dots</p> : null}
              {previewStyle === 'timeline' ? <p><strong>800×600px</strong> (4:3) • Timeline dọc, alternate left-right</p> : null}
            </div>
          </div>
        </div>
      </PreviewWrapper>

      {mode === 'dual' ? (
        <ColorInfoPanel
          brandColor={colors.primary}
          secondary={colors.secondary}
          description="Màu phụ được áp dụng cho badge, action text và các điểm nhấn điều hướng."
        />
      ) : null}
    </>
  );
};
