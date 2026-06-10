import type { ContactSettings, SEOSettings, SiteSettings, SocialSettings } from '@/lib/get-settings';

type LlmsParams = {
  baseUrl: string;
  contact: ContactSettings;
  seo: SEOSettings;
  site: SiteSettings;
  social?: SocialSettings;
};

const normalizeUrl = (value: string, baseUrl: string): string => {
  if (!value) {
    return baseUrl;
  }
  if (value.startsWith('http')) {
    return value;
  }
  return `${baseUrl.replace(/\/$/, '')}/${value.replace(/^\//, '')}`;
};

const collectSameAs = (params: LlmsParams): string[] => {
  const raw = [
    params.social?.social_facebook,
    params.social?.social_instagram,
    params.social?.social_youtube,
    params.social?.social_tiktok,
    params.social?.social_twitter,
    params.social?.social_linkedin,
    params.social?.social_pinterest,
    params.contact.contact_zalo,
  ];

  return raw
    .map((value) => (value || '').trim())
    .filter((value) => value && value !== '#')
    .filter((value) => value.startsWith('http'));
};

export const buildLlmsText = (params: LlmsParams): string => {
  const baseUrl = params.baseUrl.replace(/\/$/, '');
  const summary = params.seo.seo_description || params.site.site_tagline || '';
  const sameAs = collectSameAs(params);

  const priorityUrls = [
    { url: baseUrl, note: 'Homepage' },
    { url: `${baseUrl}/features`, note: 'Tính năng' },
    { url: `${baseUrl}/use-cases`, note: 'Use cases' },
    { url: `${baseUrl}/solutions`, note: 'Giải pháp' },
    { url: `${baseUrl}/compare`, note: 'So sánh' },
    { url: `${baseUrl}/integrations`, note: 'Tích hợp' },
    { url: `${baseUrl}/templates`, note: 'Templates' },
    { url: `${baseUrl}/guides`, note: 'Guides' },
    { url: `${baseUrl}/posts`, note: 'Bài viết' },
    { url: `${baseUrl}/products`, note: 'Sản phẩm' },
    { url: `${baseUrl}/services`, note: 'Dịch vụ' },
    { url: `${baseUrl}/contact`, note: 'Liên hệ' },
  ];

  return [
    '# llms.txt',
    '',
    '## Summary',
    `Site: ${params.site.site_name || 'Website'}`,
    summary ? `Description: ${summary}` : 'Description: ',
    `Base URL: ${baseUrl}`,
    `Language: ${params.site.site_language || 'vi'}`,
    '',
    '## Priority URLs',
    ...priorityUrls.map((item) => `- ${item.url} — ${item.note}`),
    '',
    '## Sitemaps',
    `- ${baseUrl}/sitemap.xml`,
    '',
    '## Policies',
    `- Robots: ${baseUrl}/robots.txt`,
    '- Crawl friendly: ưu tiên HTML server-rendered, tránh chặn AI crawler chính.',
    '',
    '## Entity Links',
    ...(sameAs.length > 0 ? sameAs.map((url) => `- ${normalizeUrl(url, baseUrl)}`) : ['- (none)']),
  ].join('\n');
};
