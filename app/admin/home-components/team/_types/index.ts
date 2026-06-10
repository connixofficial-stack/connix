import type { SectionSpacing } from '../../_shared/types/sectionSpacing';
export type TeamAvatarType = 'upload' | 'url' | 'icon';

export interface TeamMember {
  name: string;
  role: string;
  avatar: string;
  avatarType?: TeamAvatarType; // 'upload' | 'url' | 'icon'
  avatarIcon?: string; // lucide icon name when avatarType === 'icon'
  avatarStorageId?: string | null;
  bio: string;
  facebook: string;
  linkedin: string;
  twitter: string;
  phone: string;
  zalo: string;
  tiktok: string;
  youtube: string;
  email: string;
}

export interface TeamEditorMember extends TeamMember {
  id: number;
}

export type TeamStyle = 'grid' | 'cards' | 'carousel' | 'bento' | 'timeline' | 'spotlight' | 'construction' | 'layout8';

export type TeamBrandMode = 'single' | 'dual';
export type TeamDesktopColumns = 3 | 4;
export type TeamCornerRadius = 'none' | 'sm' | 'lg';

export interface TeamConfig {
  members: TeamMember[];
  style: TeamStyle;
  texts?: Record<string, string>;
  // Shared header config
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
  noBorderRadius?: boolean;
  noVerticalMargin?: boolean;
}

export type TeamHeaderAlign = 'left' | 'center' | 'right';

export const DEFAULT_TEAM_DESKTOP_COLUMNS: TeamDesktopColumns = 4;
export const DEFAULT_TEAM_CORNER_RADIUS: TeamCornerRadius = 'lg';

export const normalizeTeamDesktopColumns = (value: unknown): TeamDesktopColumns => (
  value === 3 ? 3 : DEFAULT_TEAM_DESKTOP_COLUMNS
);

export const normalizeTeamCornerRadius = (
  value: unknown,
  legacyNoBorderRadius?: unknown,
): TeamCornerRadius => {
  if (value === 'none' || value === 'sm' || value === 'lg') {
    return value;
  }

  if (legacyNoBorderRadius === true) {
    return 'none';
  }

  return DEFAULT_TEAM_CORNER_RADIUS;
};

export const getTeamCornerRadiusClassName = (
  value: TeamCornerRadius = DEFAULT_TEAM_CORNER_RADIUS,
) => {
  if (value === 'none') {
    return 'rounded-none';
  }

  if (value === 'sm') {
    return 'rounded-md';
  }

  return 'rounded-2xl';
};
