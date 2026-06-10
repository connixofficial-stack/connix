import { useState } from 'react';
import type { SectionHeaderConfig } from '../types/sectionHeader';
import { DEFAULT_SECTION_SPACING, normalizeSectionSpacing } from '../types/sectionSpacing';

export function useSectionHeaderState(initialConfig?: Partial<SectionHeaderConfig>) {
  const [hideHeader, setHideHeader] = useState(initialConfig?.hideHeader ?? false);
  const [showTitle, setShowTitle] = useState(initialConfig?.showTitle ?? true);
  const [showSubtitle, setShowSubtitle] = useState(initialConfig?.showSubtitle ?? true);
  const [subtitle, setSubtitle] = useState(initialConfig?.subtitle ?? '');
  const [headerAlign, setHeaderAlign] = useState<'left' | 'center' | 'right'>(initialConfig?.headerAlign ?? 'left');
  const [titleColorPrimary, setTitleColorPrimary] = useState(initialConfig?.titleColorPrimary ?? false);
  const [subtitleAboveTitle, setSubtitleAboveTitle] = useState(initialConfig?.subtitleAboveTitle ?? false);
  const [uppercaseText, setUppercaseText] = useState(initialConfig?.uppercaseText ?? false);
  const [showBadge, setShowBadge] = useState(initialConfig?.showBadge ?? true);
  const [badgeText, setBadgeText] = useState(initialConfig?.badgeText ?? '');
  const [spacing, setSpacing] = useState(normalizeSectionSpacing(initialConfig?.spacing ?? DEFAULT_SECTION_SPACING));

  return {
    hideHeader,
    setHideHeader,
    showTitle,
    setShowTitle,
    showSubtitle,
    setShowSubtitle,
    subtitle,
    setSubtitle,
    headerAlign,
    setHeaderAlign,
    titleColorPrimary,
    setTitleColorPrimary,
    subtitleAboveTitle,
    setSubtitleAboveTitle,
    uppercaseText,
    setUppercaseText,
    showBadge,
    setShowBadge,
    badgeText,
    setBadgeText,
    spacing,
    setSpacing,
  };
}

export function extractSectionHeaderConfig(config: Record<string, unknown>): SectionHeaderConfig {
  return {
    hideHeader: typeof config.hideHeader === 'boolean' ? config.hideHeader : false,
    showTitle: typeof config.showTitle === 'boolean' ? config.showTitle : true,
    showSubtitle: typeof config.showSubtitle === 'boolean' ? config.showSubtitle : true,
    subtitle: typeof config.subtitle === 'string' ? config.subtitle : '',
    headerAlign: (config.headerAlign === 'left' || config.headerAlign === 'center' || config.headerAlign === 'right') 
      ? config.headerAlign 
      : 'left',
    titleColorPrimary: typeof config.titleColorPrimary === 'boolean' ? config.titleColorPrimary : false,
    subtitleAboveTitle: typeof config.subtitleAboveTitle === 'boolean' ? config.subtitleAboveTitle : false,
    uppercaseText: typeof config.uppercaseText === 'boolean' ? config.uppercaseText : false,
    showBadge: typeof config.showBadge === 'boolean' ? config.showBadge : true,
    badgeText: typeof config.badgeText === 'string' ? config.badgeText : '',
    spacing: normalizeSectionSpacing(config.spacing),
  };
}
