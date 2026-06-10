import { TRUST_PAGE_SLOTS } from '@/lib/ia/trust-pages';
import type { FooterColumn, FooterConfig, FooterStyle } from '../_types';

type SettingMap = Record<string, unknown>;

type FooterGenerateInput = {
  settings: SettingMap;
  style?: FooterStyle | null;
};

type FooterGenerateResult = {
  patch: Partial<FooterConfig>;
  summary: {
    balance: number[];
    dedupedCount: number;
    generatedColumns: number;
    missingTrustKeys: string[];
    totalLinks: number;
  };
};

type FooterLink = {
  label: string;
  url: string;
};

const resolveString = (value: unknown) => (
  typeof value === 'string' && value.trim() ? value.trim() : ''
);

const resolveBoolean = (value: unknown, fallback = true) => (typeof value === 'boolean' ? value : fallback);

type FooterLayoutProfile = {
  columnTitles: string[];
  maxTotalLinks: number;
  targetColumns: number;
};

const LAYOUT_PROFILES: Record<FooterStyle, FooterLayoutProfile> = {
  centered: {
    columnTitles: ['Chính sách', 'Hỗ trợ', 'Thông tin', 'Tin cậy'],
    maxTotalLinks: 12,
    targetColumns: 4,
  },
  classic: {
    columnTitles: ['Chính sách & Tin cậy', 'Thông tin cần biết'],
    maxTotalLinks: 12,
    targetColumns: 2,
  },
  corporate: {
    columnTitles: ['Chính sách & Tin cậy', 'Thông tin cần biết'],
    maxTotalLinks: 10,
    targetColumns: 2,
  },
  minimal: {
    columnTitles: ['Liên kết quan trọng'],
    maxTotalLinks: 6,
    targetColumns: 1,
  },
  modern: {
    columnTitles: ['Chính sách & Tin cậy', 'Thông tin cần biết'],
    maxTotalLinks: 8,
    targetColumns: 2,
  },
  stacked: {
    columnTitles: ['Chính sách & Tin cậy', 'Thông tin cần biết'],
    maxTotalLinks: 10,
    targetColumns: 2,
  },
};

const CORE_ESSENTIAL_LINKS: FooterLink[] = [
  { label: 'Trang chủ', url: '/' },
  { label: 'Liên hệ', url: '/contact' },
  { label: 'Về chúng tôi', url: '/about' },
  { label: 'Câu hỏi thường gặp', url: '/faq' },
];

const pushUniqueLink = (bucket: FooterLink[], link: FooterLink, seen: Set<string>) => {
  const url = link.url.trim();
  const label = link.label.trim();
  if (!url || !label || seen.has(url)) {return;}
  seen.add(url);
  bucket.push({ label, url });
};

const buildTrustLinks = (settings: SettingMap) => {
  const seen = new Set<string>();
  const trustLinks: FooterLink[] = [];
  const missingTrustKeys: string[] = [];

  TRUST_PAGE_SLOTS.forEach((slot) => {
    const enabled = resolveBoolean(settings[slot.iaKey], true);
    const mappedPostId = resolveString(settings[slot.mappingKey]);
    if (!enabled) {return;}
    if (!mappedPostId) {
      missingTrustKeys.push(slot.key);
    }
    pushUniqueLink(trustLinks, { label: slot.label, url: slot.slug }, seen);
  });

  return { missingTrustKeys, trustLinks };
};

const buildCoreEssentialLinks = (settings: SettingMap) => {
  const seen = new Set<string>();
  const coreLinks: FooterLink[] = [];

  CORE_ESSENTIAL_LINKS.forEach((link) => {
    if (link.url === '/about' && !resolveBoolean(settings.ia_page_about, true)) {return;}
    if (link.url === '/faq' && !resolveBoolean(settings.ia_page_faq, true)) {return;}
    pushUniqueLink(coreLinks, link, seen);
  });

  return coreLinks;
};

const dedupeLinks = (links: FooterLink[]) => {
  const seen = new Set<string>();
  const deduped: FooterLink[] = [];

  links.forEach((link) => {
    pushUniqueLink(deduped, link, seen);
  });

  return { deduped, removedCount: links.length - deduped.length };
};

const resolveLayoutProfile = (style?: FooterStyle | null): FooterLayoutProfile => {
  if (!style) {return LAYOUT_PROFILES.classic;}
  return LAYOUT_PROFILES[style] ?? LAYOUT_PROFILES.classic;
};

const distributeBalanced = (links: FooterLink[], targetColumns: number) => {
  const safeColumns = Math.max(1, Math.min(targetColumns, links.length || 1));
  const buckets: FooterLink[][] = Array.from({ length: safeColumns }, () => []);
  const baseSize = Math.floor(links.length / safeColumns);
  const extra = links.length % safeColumns;
  let cursor = 0;

  for (let index = 0; index < safeColumns; index += 1) {
    const size = baseSize + (index < extra ? 1 : 0);
    buckets[index] = links.slice(cursor, cursor + size);
    cursor += size;
  }

  return buckets;
};

const inferColumnTitle = (links: FooterLink[], fallback: string) => {
  const urls = new Set(links.map((link) => link.url));
  const trustCount = links.filter((link) => TRUST_PAGE_SLOTS.some((slot) => slot.slug === link.url)).length;
  if (links.length === 0) {return fallback;}
  if (trustCount === links.length) {return 'Chính sách & Tin cậy';}
  if (urls.has('/contact') || urls.has('/faq')) {return 'Hỗ trợ';}
  if (urls.has('/') || urls.has('/about')) {return 'Thông tin';}
  return fallback;
};

export const generateFooterConfigFromData = ({
  settings,
  style,
}: FooterGenerateInput): FooterGenerateResult => {
  const profile = resolveLayoutProfile(style);
  const { missingTrustKeys, trustLinks } = buildTrustLinks(settings);
  const coreLinks = buildCoreEssentialLinks(settings);
  const orderedPool = [...trustLinks, ...coreLinks];
  const { deduped, removedCount } = dedupeLinks(orderedPool);
  const trimmedLinks = deduped.slice(0, profile.maxTotalLinks);
  const distributed = distributeBalanced(trimmedLinks, profile.targetColumns);
  const columns: FooterColumn[] = distributed.map((links, index) => ({
    id: index + 1,
    links,
    title: inferColumnTitle(links, profile.columnTitles[index] ?? `Cột ${index + 1}`),
  }));

  if (columns.length === 0) {
    columns.push({
      id: 1,
      links: [{ label: 'Liên hệ', url: '/contact' }],
      title: 'Thông tin',
    });
  }

  const siteName = resolveString(settings.site_name) || 'Website';
  const siteTagline = resolveString(settings.site_tagline);
  const balance = columns.map((column) => column.links.length);
  return {
    patch: {
      bctLogoLink: '',
      bctLogoType: 'thong-bao',
      columns: columns.slice(0, 4).map((column, index) => ({ ...column, id: index + 1 })),
      copyright: `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`,
      description: siteTagline || `Thông tin minh bạch, chính sách rõ ràng và trải nghiệm đáng tin cậy tại ${siteName}.`,
      logoName: siteName,
      showBctLogo: true,
    },
    summary: {
      balance,
      dedupedCount: removedCount,
      generatedColumns: columns.length,
      missingTrustKeys,
      totalLinks: trimmedLinks.length,
    },
  };
};
