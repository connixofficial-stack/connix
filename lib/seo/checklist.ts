export type SeoChecklistCategory = 'crawl' | 'entity' | 'content' | 'speed' | 'external';
export type SeoChecklistSeverity = 'critical' | 'high' | 'medium' | 'low';
export type SeoChecklistStatus = 'pass' | 'warning' | 'fail' | 'info';

export type SeoBestPractice = {
  summary: string;
  doFirst: string;
  checklist: string[];
  pitfalls: string[];
  referenceUrl?: string;
};

export type SeoQuickAction = {
  label: string;
  href: string;
  external?: boolean;
};

export type SeoChecklistItem = {
  id: string;
  category: SeoChecklistCategory;
  severity: SeoChecklistSeverity;
  status: SeoChecklistStatus;
  title: string;
  whyItMatters: string;
  howToFix: string;
  quickActions?: SeoQuickAction[];
  learnMoreUrl?: string;
  steps?: string[];
  isExternal?: boolean;
  autoCheck?: boolean;
  bestPractice?: SeoBestPractice;
};

export type SeoUrlHealth = {
  robotsReachable: boolean;
  sitemapReachable: boolean;
  llmsReachable: boolean;
};

export type SeoChecklistSummary = {
  progressPercent: number;
  completedWeight: number;
  totalWeight: number;
  bySeverity: Record<SeoChecklistSeverity, { total: number; completed: number }>;
  byCategory: Record<SeoChecklistCategory, { total: number; completed: number }>;
};

export type SeoChecklistBuildInput = {
  baseUrl: string;
  urlHealth?: SeoUrlHealth;
  siteName?: string;
  siteLogo?: string;
  siteTagline?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoOgImage?: string;
  seoKeywords?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  contactTaxId?: string;
  socialLinks?: string[];
  postsCount?: number;
  productsCount?: number;
  servicesCount?: number;
  landingPagesCount?: number;
};

export type SeoChecklistResult = {
  items: SeoChecklistItem[];
  criticalItems: SeoChecklistItem[];
  quickWins: SeoChecklistItem[];
  externalItems: SeoChecklistItem[];
  summary: SeoChecklistSummary;
};

const sanitizeUrl = (value?: string): string => {
  if (!value) {
    return '';
  }
  return value.trim().replace(/\/$/, '');
};

const isValidBaseUrl = (value: string): boolean => {
  if (!value || value === 'https://example.com') {
    return false;
  }
  return value.startsWith('http://') || value.startsWith('https://');
};

const buildQuickActions = (actions: SeoQuickAction[]): SeoQuickAction[] => {
  return actions.filter((action) => Boolean(action.href));
};

const SEVERITY_WEIGHT: Record<SeoChecklistSeverity, number> = {
  critical: 40,
  high: 30,
  medium: 20,
  low: 10,
};

const calculateSummary = (items: SeoChecklistItem[]): SeoChecklistSummary => {
  const bySeverity: Record<SeoChecklistSeverity, { total: number; completed: number }> = {
    critical: { total: 0, completed: 0 },
    high: { total: 0, completed: 0 },
    medium: { total: 0, completed: 0 },
    low: { total: 0, completed: 0 },
  };

  const byCategory: Record<SeoChecklistCategory, { total: number; completed: number }> = {
    crawl: { total: 0, completed: 0 },
    entity: { total: 0, completed: 0 },
    content: { total: 0, completed: 0 },
    speed: { total: 0, completed: 0 },
    external: { total: 0, completed: 0 },
  };

  let totalWeight = 0;
  let completedWeight = 0;

  items.forEach((item) => {
    const weight = SEVERITY_WEIGHT[item.severity];
    totalWeight += weight;

    const isCompleted = item.status === 'pass';
    const cat = item.category;

    bySeverity[item.severity].total += 1;
    byCategory[cat].total += 1;

    if (isCompleted) {
      completedWeight += weight;
      bySeverity[item.severity].completed += 1;
      byCategory[cat].completed += 1;
    }
  });

  const progressPercent = totalWeight === 0 ? 0 : Math.round((completedWeight / totalWeight) * 100);

  return {
    progressPercent,
    completedWeight,
    totalWeight,
    bySeverity,
    byCategory,
  };
};

export const buildSeoChecklist = (input: SeoChecklistBuildInput): SeoChecklistResult => {
  const baseUrl = sanitizeUrl(input.baseUrl);
  const hasValidBaseUrl = isValidBaseUrl(baseUrl);
  const sitemapUrl = baseUrl ? `${baseUrl}/sitemap.xml` : '';
  const robotsUrl = baseUrl ? `${baseUrl}/robots.txt` : '';
  const llmsUrl = baseUrl ? `${baseUrl}/llms.txt` : '';

  const urlHealth = input.urlHealth ?? {
    robotsReachable: false,
    sitemapReachable: false,
    llmsReachable: false,
  };

  const hasSeoDescription = Boolean(input.seoDescription?.trim());
  const hasOgImage = Boolean((input.seoOgImage || input.siteLogo)?.trim());
  const hasSiteName = Boolean(input.siteName?.trim());
  const hasContactPhone = Boolean(input.contactPhone?.trim());
  const hasContactEmail = Boolean(input.contactEmail?.trim());
  const hasContactAddress = Boolean(input.contactAddress?.trim());
  const hasAnyContact = hasContactPhone || hasContactEmail;
  const hasSocialLinks = (input.socialLinks ?? []).some((link) => link.startsWith('http'));

  const postsCount = input.postsCount ?? 0;
  const productsCount = input.productsCount ?? 0;
  const servicesCount = input.servicesCount ?? 0;
  const landingPagesCount = input.landingPagesCount ?? 0;

  const landingPagesHint = landingPagesCount > 0
    ? 'Duy trì tối thiểu 3 landing pages và cập nhật định kỳ.'
    : 'Tạo tối thiểu 3 landing pages (feature, use-case, solution) trước khi submit sitemap.'
  const postsHint = postsCount > 0
    ? 'Duy trì 3-5 bài viết nền và cập nhật đều mỗi tháng.'
    : 'Tạo tối thiểu 3 bài viết nền (giới thiệu, FAQ, hướng dẫn) để bot hiểu chủ đề.'
  const productsHint = productsCount > 0
    ? 'Duy trì danh mục sản phẩm có mô tả rõ, giá và hình ảnh.'
    : 'Publish tối thiểu 3 sản phẩm thật (tên, giá, mô tả, hình) để bot index.'
  const servicesHint = servicesCount > 0
    ? 'Duy trì danh mục dịch vụ có mô tả, lợi ích, CTA rõ.'
    : 'Publish tối thiểu 3 dịch vụ (title, mô tả, CTA) để bot hiểu dịch vụ chính.'
  const contactHint = hasAnyContact
    ? 'Giữ email/số điện thoại chính xác và đồng bộ với website.'
    : 'Điền ít nhất 1 thông tin liên hệ (email hoặc số điện thoại) trong Settings Contact.'
  const addressHint = hasContactAddress
    ? 'Đảm bảo địa chỉ đầy đủ (phường/quận/tỉnh) để LocalBusiness schema rõ.'
    : 'Thêm địa chỉ doanh nghiệp (phường/quận/tỉnh) để tăng trust local.'

  const items: SeoChecklistItem[] = [
    {
      id: 'site-url',
      category: 'crawl',
      severity: 'critical',
      status: hasValidBaseUrl ? 'pass' : 'fail',
      title: 'Có URL website chuẩn để bot hiểu đúng domain',
      whyItMatters: 'Nếu thiếu URL chuẩn, canonical và sitemap dễ sai, bot khó index nhanh.',
      howToFix: 'Điền Site URL đúng domain đang dùng.',
      quickActions: buildQuickActions([
        { label: 'Mở Settings', href: '/admin/settings' },
      ]),
      autoCheck: true,
    },
    {
      id: 'robots',
      category: 'crawl',
      severity: 'high',
      status: hasValidBaseUrl && urlHealth.robotsReachable ? 'pass' : hasValidBaseUrl ? 'warning' : 'fail',
      title: 'Robots.txt hoạt động và không chặn nhầm trang public',
      whyItMatters: 'Robots sai khiến bot không crawl được dù nội dung tốt.',
      howToFix: 'Mở robots.txt để kiểm tra và đảm bảo không chặn trang public.',
      quickActions: buildQuickActions([
        { label: 'Mở robots.txt', href: robotsUrl, external: true },
      ]),
      autoCheck: hasValidBaseUrl,
      bestPractice: {
        summary: 'Robots.txt cần truy cập được và không block nhầm trang public quan trọng.',
        doFirst: 'Mở robots.txt để chắc chắn không có dòng Disallow chặn homepage, posts, products, services.',
        checklist: [
          'Robots.txt trả về 200 OK',
          'Không có Disallow: / với site public',
          'Chỉ block admin, private paths',
          'Có dòng Sitemap trỏ đúng URL',
        ],
        pitfalls: [
          'Copy nhầm robots staging sang production',
          'Quên cập nhật sitemap URL sau khi đổi domain',
        ],
        referenceUrl: 'https://developers.google.com/search/docs/crawling-indexing/robots/intro',
      },
    },
    {
      id: 'sitemap',
      category: 'crawl',
      severity: 'high',
      status: hasValidBaseUrl && urlHealth.sitemapReachable ? 'pass' : hasValidBaseUrl ? 'warning' : 'fail',
      title: 'Sitemap có URL quan trọng để bot crawl nhanh',
      whyItMatters: 'Sitemap giúp bot biết URL mới và ưu tiên đúng trang.',
      howToFix: 'Mở sitemap để kiểm tra URL chính và dọn URL rỗng.',
      quickActions: buildQuickActions([
        { label: 'Mở sitemap', href: sitemapUrl, external: true },
      ]),
      autoCheck: hasValidBaseUrl,
      learnMoreUrl: 'https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap',
      bestPractice: {
        summary: 'Sitemap cần chứa URL thật, ưu tiên trang quan trọng, tránh URL rỗng.',
        doFirst: 'Kiểm tra sitemap có đúng domain chính và đủ trang core (homepage, products, services).',
        checklist: [
          'Sitemap trả về 200 OK',
          'URL trong sitemap là domain chính',
          'Không có URL /404 hoặc draft',
          'Có cập nhật lastmod hợp lý',
        ],
        pitfalls: [
          'Để URL staging/test trong sitemap',
          'Nhồi quá nhiều URL rác khiến bot chậm index',
        ],
        referenceUrl: 'https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap',
      },
    },
    {
      id: 'sitemap-hubs',
      category: 'crawl',
      severity: 'medium',
      status: landingPagesCount > 0 ? 'pass' : 'warning',
      title: 'Landing hub có nội dung thật để tránh sitemap loãng',
      whyItMatters: 'Hub rỗng làm bot crawl nhiều nhưng index kém.',
      howToFix: landingPagesHint,
      quickActions: buildQuickActions([
        { label: 'Mở Landing Pages', href: '/system/seo?tab=landing-pages' },
      ]),
      autoCheck: true,
    },
    {
      id: 'site-name',
      category: 'entity',
      severity: 'critical',
      status: hasSiteName ? 'pass' : 'fail',
      title: 'Tên website/brand đã có',
      whyItMatters: 'Thiếu tên thương hiệu làm giảm tín hiệu thực thể.',
      howToFix: 'Điền Site Name trong Settings.',
      quickActions: buildQuickActions([
        { label: 'Mở Settings', href: '/admin/settings' },
      ]),
      autoCheck: true,
    },
    {
      id: 'seo-description',
      category: 'entity',
      severity: 'medium',
      status: hasSeoDescription ? 'pass' : 'warning',
      title: 'Có mô tả SEO mặc định rõ ràng',
      whyItMatters: 'Mô tả giúp bot hiểu bạn bán gì và phục vụ ai.',
      howToFix: 'Điền Meta Description ngắn gọn, tự nhiên.',
      quickActions: buildQuickActions([
        { label: 'Mở Settings SEO', href: '/admin/settings' },
      ]),
      autoCheck: true,
    },
    {
      id: 'og-image',
      category: 'entity',
      severity: 'low',
      status: hasOgImage ? 'pass' : 'warning',
      title: 'Có logo/OG image đại diện thương hiệu',
      whyItMatters: 'Hình đại diện giúp tăng trust khi share và khi bot hiểu brand.',
      howToFix: 'Upload OG image hoặc logo.',
      quickActions: buildQuickActions([
        { label: 'Mở Settings SEO', href: '/admin/settings' },
      ]),
      autoCheck: true,
    },
    {
      id: 'contact-info',
      category: 'entity',
      severity: 'high',
      status: hasAnyContact ? 'pass' : 'warning',
      title: 'Có số điện thoại hoặc email liên hệ',
      whyItMatters: 'Thiếu liên hệ khiến bot khó xác nhận đây là site thật.',
      howToFix: contactHint,
      quickActions: buildQuickActions([
        { label: 'Mở Settings Contact', href: '/admin/settings' },
      ]),
      autoCheck: true,
    },
    {
      id: 'address-info',
      category: 'entity',
      severity: 'medium',
      status: hasContactAddress ? 'pass' : 'warning',
      title: 'Có địa chỉ để phát LocalBusiness schema',
      whyItMatters: 'Địa chỉ giúp bot hiểu bạn là doanh nghiệp thật và local.',
      howToFix: addressHint,
      quickActions: buildQuickActions([
        { label: 'Mở Settings Contact', href: '/admin/settings' },
      ]),
      autoCheck: true,
    },
    {
      id: 'social-links',
      category: 'entity',
      severity: 'low',
      status: hasSocialLinks ? 'pass' : 'info',
      title: 'Có link social để tăng trust',
      whyItMatters: 'Social giúp bot xác nhận brand và tăng tín hiệu thật.',
      howToFix: 'Thêm link Facebook/YouTube/Instagram nếu có.',
      quickActions: buildQuickActions([
        { label: 'Mở Settings Social', href: '/admin/settings' },
      ]),
      autoCheck: true,
    },
    {
      id: 'posts-count',
      category: 'content',
      severity: 'medium',
      status: postsCount > 0 ? 'pass' : 'warning',
      title: 'Có bài viết published',
      whyItMatters: 'Bài viết giúp bot hiểu nội dung và chủ đề site.',
      howToFix: postsHint,
      quickActions: buildQuickActions([
        { label: 'Mở Posts', href: '/admin/posts' },
      ]),
      autoCheck: true,
    },
    {
      id: 'products-count',
      category: 'content',
      severity: 'medium',
      status: productsCount > 0 ? 'pass' : 'warning',
      title: 'Có sản phẩm published',
      whyItMatters: 'Sản phẩm là nguồn traffic và index quan trọng nhất.',
      howToFix: productsHint,
      quickActions: buildQuickActions([
        { label: 'Mở Products', href: '/admin/products' },
      ]),
      autoCheck: true,
    },
    {
      id: 'services-count',
      category: 'content',
      severity: 'medium',
      status: servicesCount > 0 ? 'pass' : 'warning',
      title: 'Có dịch vụ published',
      whyItMatters: 'Dịch vụ giúp bot hiểu business scope và tăng index.',
      howToFix: servicesHint,
      quickActions: buildQuickActions([
        { label: 'Mở Services', href: '/admin/services' },
      ]),
      autoCheck: true,
    },
    {
      id: 'internal-links',
      category: 'content',
      severity: 'high',
      status: 'info',
      title: 'Homepage có link tới trang quan trọng',
      whyItMatters: 'Bot ưu tiên URL được link rõ từ homepage.',
      howToFix: 'Thêm link từ homepage tới Products/Services/Posts.',
      quickActions: buildQuickActions([
        { label: 'Mở Homepage', href: baseUrl, external: true },
      ]),
      autoCheck: false,
    },
    {
      id: 'rendering',
      category: 'speed',
      severity: 'medium',
      status: 'info',
      title: 'Trang public có text rõ ràng khi load',
      whyItMatters: 'Bot cần đọc được text mà không phụ thuộc JS quá nhiều.',
      howToFix: 'Đảm bảo nội dung chính render từ server.',
      quickActions: buildQuickActions([
        { label: 'Mở Homepage', href: baseUrl, external: true },
      ]),
      autoCheck: false,
      learnMoreUrl: 'https://developers.google.com/search/docs/crawling-indexing',
      bestPractice: {
        summary: 'Nội dung chính phải render sẵn, tránh blank/flash khi crawl.',
        doFirst: 'Kiểm tra homepage có text/CTA xuất hiện ngay khi load (view page source).',
        checklist: [
          'Hero có text thật, không chỉ hình',
          'Có nội dung sản phẩm/dịch vụ trong HTML ban đầu',
          'Không che nội dung bằng skeleton quá lâu',
        ],
        pitfalls: [
          'Render toàn bộ bằng client và để trống server HTML',
          'Che nội dung bởi modal/overlay không cần thiết',
        ],
      },
    },
    {
      id: 'gsc',
      category: 'external',
      severity: 'high',
      status: 'info',
      title: 'Submit sitemap trong Google Search Console',
      whyItMatters: 'Giúp Google biết URL mới nhanh hơn.',
      howToFix: 'Mở GSC, add property, rồi submit sitemap.',
      quickActions: buildQuickActions([
        { label: 'Mở GSC', href: 'https://search.google.com/search-console', external: true },
        { label: 'Copy Sitemap URL', href: sitemapUrl },
      ]),
      steps: [
        'Mở Google Search Console',
        'Add property → nhập domain',
        `Vào Sitemaps → dán ${sitemapUrl || 'URL sitemap'}`,
        'Bấm Submit',
      ],
      isExternal: true,
      autoCheck: false,
      learnMoreUrl: 'https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap',
      bestPractice: {
        summary: 'GSC giúp Google nhận sitemap và hiểu lỗi index nhanh hơn.',
        doFirst: 'Chỉ cần submit 1 lần sau khi có domain và sitemap.',
        checklist: [
          'Add property đúng domain',
          'Submit sitemap thành công (Status: Success)',
          'Theo dõi Coverage/Pages mỗi tuần',
        ],
        pitfalls: [
          'Submit nhầm domain có www/không www',
          'Sitemap chưa có URL thật nhưng vẫn submit',
        ],
        referenceUrl: 'https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap',
      },
    },
    {
      id: 'bing-webmaster',
      category: 'external',
      severity: 'medium',
      status: 'info',
      title: 'Submit sitemap trong Bing Webmaster',
      whyItMatters: 'Bing/Edge index nhanh hơn khi có sitemap.',
      howToFix: 'Đăng nhập Bing Webmaster và submit sitemap.',
      quickActions: buildQuickActions([
        { label: 'Mở Bing Webmaster', href: 'https://www.bing.com/webmasters', external: true },
        { label: 'Copy Sitemap URL', href: sitemapUrl },
      ]),
      steps: [
        'Mở Bing Webmaster',
        'Add site → nhập domain',
        `Submit sitemap: ${sitemapUrl || 'URL sitemap'}`,
        'Lưu lại',
      ],
      isExternal: true,
      autoCheck: false,
      learnMoreUrl: 'https://www.bing.com/webmasters/help/why-is-my-site-not-in-the-index-2141dfab',
      bestPractice: {
        summary: 'Bing/Edge vẫn mang traffic ổn định, nên submit sitemap để index nhanh.',
        doFirst: 'Sau khi GSC ổn, vào Bing Webmaster submit sitemap tương tự.',
        checklist: [
          'Add site thành công',
          'Sitemap status OK',
          'Không có lỗi fetch sitemap',
        ],
        pitfalls: [
          'Bỏ qua Bing khiến Edge không index đều',
        ],
        referenceUrl: 'https://www.bing.com/webmasters/help/why-is-my-site-not-in-the-index-2141dfab',
      },
    },
    {
      id: 'indexnow',
      category: 'external',
      severity: 'medium',
      status: 'info',
      title: 'Bật IndexNow để báo URL mới/cập nhật',
      whyItMatters: 'IndexNow giúp Bing/Edge nhận biết URL mới nhanh hơn.',
      howToFix: 'Tạo key IndexNow và gửi ping khi có content mới.',
      quickActions: buildQuickActions([
        { label: 'Mở IndexNow', href: 'https://www.bing.com/indexnow/getstarted', external: true },
      ]),
      steps: [
        'Mở IndexNow guide',
        'Tạo key và đặt file key tại root domain',
        'Ping IndexNow khi publish content mới',
      ],
      isExternal: true,
      autoCheck: false,
      learnMoreUrl: 'https://www.bing.com/indexnow/getstarted',
      bestPractice: {
        summary: 'IndexNow giúp báo nhanh URL mới, đặc biệt với Bing/Edge.',
        doFirst: 'Chỉ cần tạo key 1 lần, sau đó ping khi có bài mới.',
        checklist: [
          'Key đặt đúng root domain',
          'Ping URL khi publish mới',
          'Không ping quá nhiều URL lỗi',
        ],
        pitfalls: [
          'Đặt key sai path khiến IndexNow thất bại',
        ],
        referenceUrl: 'https://www.bing.com/indexnow/getstarted',
      },
    },
    {
      id: 'llms',
      category: 'external',
      severity: 'low',
      status: hasValidBaseUrl && urlHealth.llmsReachable ? 'pass' : hasValidBaseUrl ? 'warning' : 'fail',
      title: 'Có llms.txt để AI hiểu site rõ hơn',
      whyItMatters: 'AI search ngày càng quan trọng, llms.txt giúp hiểu nội dung nhanh.',
      howToFix: 'Mở llms.txt và bổ sung thông tin nếu cần.',
      quickActions: buildQuickActions([
        { label: 'Mở llms.txt', href: llmsUrl, external: true },
      ]),
      isExternal: true,
      autoCheck: hasValidBaseUrl,
      bestPractice: {
        summary: 'llms.txt giúp AI hiểu cấu trúc site và ưu tiên trang quan trọng.',
        doFirst: 'Đảm bảo llms.txt có link sitemap, trang chính, và nội dung nổi bật.',
        checklist: [
          'llms.txt trả về 200 OK',
          'Có mô tả ngắn về website',
          'Liệt kê 5-10 URL quan trọng',
          'Trỏ về sitemap/robots',
        ],
        pitfalls: [
          'Để llms.txt rỗng hoặc chỉ có 1 link',
          'Không cập nhật khi đổi cấu trúc site',
        ],
      },
    },
  ];

  const criticalItems = items.filter(
    (item) => item.severity === 'critical' && item.status !== 'pass'
  );

  const quickWins = items
    .filter((item) => item.status !== 'pass' && item.quickActions && item.quickActions.length > 0)
    .sort((a, b) => {
      const weight = { critical: 4, high: 3, medium: 2, low: 1 };
      return weight[b.severity] - weight[a.severity];
    })
    .slice(0, 5);

  const externalItems = items.filter((item) => item.category === 'external');
  const summary = calculateSummary(items);

  return {
    items,
    criticalItems,
    quickWins,
    externalItems,
    summary,
  };
};
