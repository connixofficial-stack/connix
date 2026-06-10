import type { SectionSpacing } from '../../_shared/types/sectionSpacing';
import type { HomeComponentCornerRadius } from '../../_shared/components/HomeComponentDisplaySettingsSection';
export type VideoStyle = 'centered' | 'split' | 'fullwidth' | 'cinema' | 'minimal' | 'parallax';

export type VideoBrandMode = 'single' | 'dual';
export type VideoProvider = 'youtube' | 'vimeo' | 'drive' | 'direct';
export type VideoAspect = 'landscape' | 'portrait';
export type VideoCornerRadius = HomeComponentCornerRadius;
export type VideoPlayButtonSize = 'small' | 'medium' | 'large';

export interface VideoConfig {
  videoUrl: string;
  thumbnailUrl?: string;
  heading?: string;
  description?: string;
  badge?: string;
  buttonText?: string;
  buttonLink?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  videoAspect?: VideoAspect;
  cornerRadius?: VideoCornerRadius;
  playButtonSize?: VideoPlayButtonSize;
  style?: VideoStyle;
  texts?: Record<string, string>;
  // Header config
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
  spacing?: SectionSpacing;
  noBorderRadius?: boolean;
  noVerticalMargin?: boolean;
}
