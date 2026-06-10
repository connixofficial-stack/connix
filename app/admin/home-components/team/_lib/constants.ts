import type {
  TeamAvatarType,
  TeamConfig,
  TeamEditorMember,
  TeamMember,
  TeamStyle,
} from '../_types';
import {
  DEFAULT_TEAM_CORNER_RADIUS,
  DEFAULT_TEAM_DESKTOP_COLUMNS,
  normalizeTeamCornerRadius,
  normalizeTeamDesktopColumns,
} from '../_types';
import { DEFAULT_SECTION_SPACING, normalizeSectionSpacing } from '../../_shared/types/sectionSpacing';

export const TEAM_STYLES: Array<{ id: TeamStyle; label: string }> = [
  { id: 'grid', label: '(1) Dạng lưới' },
  { id: 'cards', label: '(2) Dạng thẻ' },
  { id: 'carousel', label: '(3) Trượt ngang' },
  { id: 'bento', label: '(4) Ô ghép' },
  { id: 'timeline', label: '(5) Tiến trình' },
  { id: 'spotlight', label: '(6) Tiêu điểm' },
  { id: 'construction', label: '(7) Góc cạnh' },
  { id: 'layout8', label: '(8) Tối giản' },
];

const TEAM_STYLE_SET = new Set<TeamStyle>(TEAM_STYLES.map((item) => item.id));

const toText = (value: unknown) => {
  if (typeof value === 'string') {return value;}
  if (typeof value === 'number') {return String(value);}
  return '';
};

export const normalizeTeamStyle = (value?: unknown): TeamStyle => {
  if (typeof value === 'string' && TEAM_STYLE_SET.has(value as TeamStyle)) {
    return value as TeamStyle;
  }

  return 'grid';
};

const toMemberRecord = (raw: unknown): Record<string, unknown> => {
  if (typeof raw === 'object' && raw !== null) {
    return raw as Record<string, unknown>;
  }

  return {};
};

const normalizeTeamMember = (raw: unknown): TeamMember => {
  const member = toMemberRecord(raw);
  const avatarType = (['upload', 'url', 'icon'].includes(member.avatarType as string)
    ? member.avatarType as TeamAvatarType
    : 'upload');
  const avatarStorageId = member.avatarStorageId === null ? null : (member.avatarStorageId ? toText(member.avatarStorageId) : undefined);

  return {
    name: toText(member.name),
    role: toText(member.role),
    avatar: toText(member.avatar),
    avatarType,
    avatarIcon: toText(member.avatarIcon) || undefined,
    avatarStorageId,
    bio: toText(member.bio),
    facebook: toText(member.facebook),
    linkedin: toText(member.linkedin),
    twitter: toText(member.twitter),
    phone: toText(member.phone),
    zalo: toText(member.zalo),
    tiktok: toText(member.tiktok),
    youtube: toText(member.youtube),
    email: toText(member.email),
  };
};

export const normalizeTeamMembers = (input: unknown): TeamMember[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map(normalizeTeamMember);
};

const buildEditorIdSeed = (member: TeamMember, index: number) => {
  const seed = `${member.name}|${member.role}|${member.email}|${index}`;
  let hash = 0;

  for (let i = 0; i < seed.length; i += 1) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }

  return Math.abs(hash) + 1_000 + index;
};

export const toTeamEditorMembers = (members: TeamMember[]): TeamEditorMember[] => {
  const seen = new Set<number>();

  return members.map((member, index) => {
    let id = buildEditorIdSeed(member, index);

    while (seen.has(id)) {
      id += 1;
    }

    seen.add(id);

    return {
      id,
      ...member,
    };
  });
};

export const toTeamPersistMembers = (members: TeamEditorMember[]): TeamMember[] => (
  members.map((member) => ({
    name: member.name,
    role: member.role,
    avatar: member.avatar,
    avatarType: member.avatarType,
    avatarIcon: member.avatarIcon,
    avatarStorageId: member.avatarStorageId,
    bio: member.bio,
    facebook: member.facebook,
    linkedin: member.linkedin,
    twitter: member.twitter,
    phone: member.phone ?? '',
    zalo: member.zalo ?? '',
    tiktok: member.tiktok ?? '',
    youtube: member.youtube ?? '',
    email: member.email,
  }))
);

const normalizeTexts = (value: unknown): Record<string, string> => {
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    const result: Record<string, string> = {};
    
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (typeof val === 'string') {
        result[key] = val;
      }
    }
    
    return { ...DEFAULT_TEAM_TEXTS, ...result };
  }
  
  return DEFAULT_TEAM_TEXTS;
};

export const normalizeTeamConfig = (rawConfig: unknown): TeamConfig => {
  const config = (typeof rawConfig === 'object' && rawConfig !== null)
    ? rawConfig as Record<string, unknown>
    : {};

  const members = normalizeTeamMembers(config.members);

  return {
    members: members.length > 0 ? members : DEFAULT_TEAM_CONFIG.members,
    style: normalizeTeamStyle(config.style),
    texts: normalizeTexts(config.texts),
    // Shared header config
    hideHeader: typeof config.hideHeader === 'boolean' ? config.hideHeader : DEFAULT_TEAM_CONFIG.hideHeader,
    showTitle: typeof config.showTitle === 'boolean' ? config.showTitle : DEFAULT_TEAM_CONFIG.showTitle,
    showSubtitle: typeof config.showSubtitle === 'boolean' ? config.showSubtitle : DEFAULT_TEAM_CONFIG.showSubtitle,
    subtitle: typeof config.subtitle === 'string' ? config.subtitle : DEFAULT_TEAM_CONFIG.subtitle,
    headerAlign: (config.headerAlign === 'left' || config.headerAlign === 'center' || config.headerAlign === 'right')
      ? config.headerAlign
      : DEFAULT_TEAM_CONFIG.headerAlign,
    titleColorPrimary: typeof config.titleColorPrimary === 'boolean' ? config.titleColorPrimary : DEFAULT_TEAM_CONFIG.titleColorPrimary,
    subtitleAboveTitle: typeof config.subtitleAboveTitle === 'boolean' ? config.subtitleAboveTitle : DEFAULT_TEAM_CONFIG.subtitleAboveTitle,
    uppercaseText: typeof config.uppercaseText === 'boolean' ? config.uppercaseText : DEFAULT_TEAM_CONFIG.uppercaseText,
    showBadge: typeof config.showBadge === 'boolean' ? config.showBadge : DEFAULT_TEAM_CONFIG.showBadge,
    badgeText: typeof config.badgeText === 'string' ? config.badgeText : DEFAULT_TEAM_CONFIG.badgeText,
    spacing: normalizeSectionSpacing(config.noVerticalMargin === true && config.spacing === undefined ? 'none' : (config.spacing ?? DEFAULT_TEAM_CONFIG.spacing)),
    desktopColumns: normalizeTeamDesktopColumns(config.desktopColumns ?? DEFAULT_TEAM_CONFIG.desktopColumns),
    cornerRadius: normalizeTeamCornerRadius(config.cornerRadius, config.noBorderRadius),
  };
};

export const DEFAULT_TEAM_TEXTS: Record<string, string> = {
  subtitle: 'Đội ngũ chuyên nghiệp',
  emptyMessage: 'Chưa có thành viên nào.',
};

export const DEFAULT_TEAM_CONFIG: TeamConfig = {
  members: [
    {
      avatar: '',
      bio: '',
      email: '',
      facebook: '',
      linkedin: '',
      name: '',
      phone: '',
      role: '',
      zalo: '',
      tiktok: '',
      youtube: '',
      twitter: '',
    },
  ],
  style: 'grid',
  texts: DEFAULT_TEAM_TEXTS,
  // Shared header config
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
  spacing: DEFAULT_SECTION_SPACING,
  desktopColumns: DEFAULT_TEAM_DESKTOP_COLUMNS,
  cornerRadius: DEFAULT_TEAM_CORNER_RADIUS,
};
