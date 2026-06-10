'use client';

import React from 'react';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { ColorInfoPanel } from '../../_shared/components/ColorInfoPanel';
import { PreviewWrapper, usePreviewDark } from '../../_shared/components/PreviewWrapper';
import { deviceWidths, usePreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import type { SectionSpacing } from '../../_shared/types/sectionSpacing';
import {
  TEAM_STYLES,
  normalizeTeamStyle,
} from '../_lib/constants';
import { getTeamValidationResult } from '../_lib/colors';
import { TeamSectionShared } from './TeamSectionShared';
import type {
  TeamBrandMode,
  TeamCornerRadius,
  TeamDesktopColumns,
  TeamEditorMember,
  TeamStyle,
} from '../_types';
import { adaptTokensForDarkMode } from '@/components/site/home/utils/darkModeColorAdapter';

interface TeamPreviewProps {
  members: TeamEditorMember[];
  brandColor: string;
  secondary: string;
  title?: string;
  mode?: TeamBrandMode;
  selectedStyle?: TeamStyle;
  onStyleChange?: (style: TeamStyle) => void;
  texts?: Record<string, string>;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
  // Header props
  hideHeader?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
  subtitle?: string;
  headerAlign?: 'left' | 'center' | 'right';
  titleColorPrimary?: boolean;
  subtitleAboveTitle?: boolean;
  uppercaseText?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  spacing?: SectionSpacing;
  desktopColumns?: TeamDesktopColumns;
  cornerRadius?: TeamCornerRadius;
}

export const TeamPreview = ({
  members,
  brandColor,
  secondary,
  title = 'Đội ngũ',
  mode = 'dual',
  selectedStyle = 'grid',
  onStyleChange,
  texts = {},
  fontStyle,
  fontClassName,
  hideHeader,
  showTitle,
  showSubtitle,
  subtitle,
  headerAlign,
  titleColorPrimary,
  subtitleAboveTitle,
  uppercaseText,
  showBadge,
  badgeText,
  spacing,
  desktopColumns,
  cornerRadius,
}: TeamPreviewProps) => {
  const { device, setDevice } = usePreviewDevice();
  const { isDark } = usePreviewDark();
  const style = normalizeTeamStyle(selectedStyle);

  const validation = React.useMemo(() => getTeamValidationResult({
    primary: brandColor,
    secondary,
    mode,
  }), [brandColor, secondary, mode]);
  const tokens = React.useMemo(() => adaptTokensForDarkMode(validation.tokens, isDark), [validation.tokens, isDark]);

  const modeLabel = mode === 'single' ? '1 màu (single)' : '2 màu (dual)';

  return (
    <div className="space-y-3">
      <PreviewWrapper
        title="Preview Team"
        device={device}
        setDevice={setDevice}
        previewStyle={style}
        setPreviewStyle={(next) => { onStyleChange?.(normalizeTeamStyle(next)); }}
        styles={TEAM_STYLES}
        info={`${members.length} thành viên • ${modeLabel}`}
        deviceWidthClass={deviceWidths[device]}
        fontStyle={fontStyle}
        fontClassName={fontClassName}
      >
        <BrowserFrame url="yoursite.com/team">
          <TeamSectionShared
            context="preview"
            members={members}
            mode={mode}
            style={style}
            title={title}
            tokens={tokens}
            device={device}
            carouselId={`team-preview-carousel-${device}`}
            texts={texts}
            hideHeader={hideHeader}
            showTitle={showTitle}
            showSubtitle={showSubtitle}
            subtitle={subtitle}
            headerAlign={headerAlign}
            titleColorPrimary={titleColorPrimary}
            subtitleAboveTitle={subtitleAboveTitle}
            uppercaseText={uppercaseText}
            showBadge={showBadge}
            badgeText={badgeText}
            spacing={spacing}
            desktopColumns={desktopColumns}
            cornerRadius={cornerRadius}
          />
        </BrowserFrame>
      </PreviewWrapper>

      {mode === 'dual' ? (
        <ColorInfoPanel
          brandColor={tokens.primary}
          secondary={validation.resolvedSecondary}
          description="Màu phụ áp dụng cho role, icon social, accent line và điều hướng carousel của Team."
        />
      ) : null}

    </div>
  );
};
