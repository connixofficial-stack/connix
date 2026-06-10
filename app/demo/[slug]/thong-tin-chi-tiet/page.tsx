import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Be_Vietnam_Pro } from 'next/font/google';
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileText,
  ImageIcon,
  Layers,
  MapPin,
  Menu,
  Palette,
  Phone,
  ChevronDown,
  ShieldCheck,
  Zap,
  LayoutTemplate,
  MousePointerClick
} from 'lucide-react';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/convex';
import { ZaloIcon } from '@/components/site/SocialIcons';

const fontBeVietnamPro = Be_Vietnam_Pro({
  subsets: ['vietnamese'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

type DetailComponent = {
  _id: string;
  active: boolean;
  config: Record<string, unknown>;
  order: number;
  title: string;
  type: string;
};

type DetailBundle = {
  settings?: {
    site?: Record<string, unknown>;
    contact?: Record<string, unknown>;
    social?: Record<string, unknown>;
    seo?: Record<string, unknown>;
  };
  menus?: {
    header?: { items?: unknown[] } | null;
    footer?: { items?: unknown[] } | null;
  };
  componentData?: Record<string, unknown>;
};

const TYPE_LABELS: Record<string, string> = {
  Blog: 'Bài viết tư vấn',
  ProductList: 'Trưng bày sản phẩm',
  ProductGrid: 'Lưới sản phẩm',
  ServiceList: 'Dịch vụ nổi bật',
  ProductCategories: 'Danh mục sản phẩm',
  CategoryProducts: 'Sản phẩm theo nhóm',
  HomepageCategoryHero: 'Khu vực danh mục nổi bật',
  Hero: 'Banner mở đầu',
  About: 'Câu chuyện Thương hiệu',
  Contact: 'Liên hệ / Nhận tư vấn',
  Gallery: 'Thư viện hình ảnh',
  Partners: 'Đối tác / Bảo chứng',
  Testimonials: 'Đánh giá khách hàng',
  Footer: 'Chân trang / Liên kết nhanh',
};

const getEnterpriseValueProposition = (type: string): { title: string; desc: string; icon: ReactNode } => {
  switch (type) {
    case 'Hero':
    case 'HomepageCategoryHero':
      return { 
        title: 'Gây ấn tượng ngay khi mở trang', 
        desc: 'Khu vực đầu trang giúp khách hiểu nhanh thương hiệu đang bán gì, điểm nổi bật là gì và nên bấm vào đâu tiếp theo.', 
        icon: <MousePointerClick className="w-4 h-4 text-amber-500" /> 
      };
    case 'Testimonials':
    case 'Partners':
    case 'About':
      return { 
        title: 'Tăng độ tin cậy', 
        desc: 'Các nội dung về thương hiệu, đối tác và đánh giá giúp khách bớt nghi ngại trước khi liên hệ hoặc mua hàng.', 
        icon: <ShieldCheck className="w-4 h-4 text-emerald-500" /> 
      };
    case 'ProductList':
    case 'ProductGrid':
    case 'ServiceList':
    case 'ProductCategories':
    case 'CategoryProducts':
      return { 
        title: 'Trưng bày sản phẩm rõ ràng', 
        desc: 'Sản phẩm, danh mục và dịch vụ được chia nhóm để khách dễ xem, dễ so sánh và nhanh tìm được thứ họ cần.', 
        icon: <LayoutTemplate className="w-4 h-4 text-blue-500" /> 
      };
    case 'Blog':
    case 'Footer':
    case 'Contact':
    case 'Gallery':
      return { 
        title: 'Dễ tìm kiếm và dễ liên hệ', 
        desc: 'Bài viết, thư viện ảnh, footer và form liên hệ giúp khách có thêm thông tin trước khi ra quyết định.', 
        icon: <Zap className="w-4 h-4 text-purple-500" /> 
      };
    default:
      return { 
        title: 'Dễ cập nhật nội dung', 
        desc: 'Khối nội dung có thể thay đổi để phù hợp chiến dịch, mùa bán hàng hoặc thông điệp mới của thương hiệu.', 
        icon: <LayoutTemplate className="w-4 h-4 text-slate-500" /> 
      };
  }
};

const toText = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const firstText = (...values: unknown[]): string => {
  for (const value of values) {
    const text = toText(value);
    if (text) return text;
  }
  return '';
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

const MessengerLogo = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.24 0 0 4.952 0 11.64c0 3.499 1.434 6.521 3.769 8.61a.96.96 0 0 1 .323.683l.065 2.135a.96.96 0 0 0 1.347.85l2.381-1.053a.96.96 0 0 1 .641-.046A13 13 0 0 0 12 23.28c6.76 0 12-4.952 12-11.64S18.76 0 12 0m6.806 7.44c.522-.03.971.567.63 1.094l-4.178 6.457a.707.707 0 0 1-.977.208l-3.87-2.504a.44.44 0 0 0-.49.007l-4.363 3.01c-.637.438-1.415-.317-.995-.966l4.179-6.457a.706.706 0 0 1 .977-.21l3.87 2.505c.15.097.344.094.491-.007l4.362-3.008a.7.7 0 0 1 .364-.13" />
  </svg>
);

const isImageUrl = (value: string): boolean => /\.(png|jpe?g|webp|gif|avif|svg)(\?.*)?$/i.test(value);

const collectImages = (value: unknown, images: string[] = [], depth = 0): string[] => {
  if (images.length >= 8 || depth > 4) return images;
  if (typeof value === 'string' && isImageUrl(value) && !images.includes(value)) {
    images.push(value);
    return images;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectImages(item, images, depth + 1));
    return images;
  }
  const record = asRecord(value);
  if (record) Object.values(record).forEach((item) => collectImages(item, images, depth + 1));
  return images;
};

const collectTitles = (value: unknown, titles: string[] = [], depth = 0): string[] => {
  if (titles.length >= 8 || depth > 4) return titles;
  if (Array.isArray(value)) {
    value.forEach((item) => collectTitles(item, titles, depth + 1));
    return titles;
  }
  const record = asRecord(value);
  if (!record) return titles;

  const title = firstText(record.title, record.name, record.heading, record.label);
  if (title && !titles.includes(title)) titles.push(title);
  Object.values(record).forEach((item) => collectTitles(item, titles, depth + 1));
  return titles;
};

const getComponentSummary = (component: DetailComponent, data: unknown): string => {
  const config = component.config;
  return firstText(
    config.description,
    config.subtitle,
    config.heading,
    config.title,
    asRecord(data)?.description,
    asRecord(data)?.subtitle,
  );
};

const getMenuCount = (bundle: DetailBundle | null): number => {
  const header = bundle?.menus?.header?.items?.length ?? 0;
  const footer = bundle?.menus?.footer?.items?.length ?? 0;
  return header + footer;
};

async function getSnapshot(slug: string) {
  const client = getConvexClient();
  return client.query(api.homepageSnapshots.getHomepageSnapshotBySlug, { slug });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const snapshot = await getSnapshot(slug);
  if (!snapshot) return { title: 'Thông tin demo không tồn tại' };

  const bundle = snapshot.bundle as DetailBundle | null;
  const site = bundle?.settings?.site ?? {};
  const seo = bundle?.settings?.seo ?? {};
  const brandName = firstText(site.site_name, snapshot.label);
  const tagline = firstText(site.site_tagline);
  const title = `${brandName} - Xem chi tiết website`;
  const description = tagline || `Xem chi tiết bố cục, nội dung và khả năng chia sẻ link của website ${snapshot.label}`;
  const ogImage = firstText(seo.seo_og_image, site.site_logo);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: brandName,
      type: 'website',
      locale: 'vi_VN',
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630, alt: title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    robots: { index: false, follow: false },
  };
}

export default async function ThemeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const snapshot = await getSnapshot(slug);

  if (!snapshot) notFound();

  const bundle = snapshot.bundle as DetailBundle | null;
  const components = (snapshot.components ?? []) as DetailComponent[];
  const activeComponents = components.filter((component) => component.active);
  const inactiveComponents = components.length - activeComponents.length;
  const site = bundle?.settings?.site ?? {};
  const contact = bundle?.settings?.contact ?? {};
  const seo = bundle?.settings?.seo ?? {};
  const componentData = bundle?.componentData ?? {};

  const demoUrl = `/demo/${slug}`;
  const detailUrl = `/demo/${slug}/thong-tin-chi-tiet`;
  const brandName = firstText(site.site_name, snapshot.label);
  const tagline = firstText(site.site_tagline, 'Trang giới thiệu thương hiệu, sản phẩm và các điểm nổi bật để khách hàng xem trước trước khi liên hệ.');
  const seoTitle = firstText(seo.seo_title, `${brandName} - Website giới thiệu thương hiệu`);
  const seoDescription = firstText(seo.seo_description, tagline);
  const ogImage = firstText(seo.seo_og_image, site.site_logo);
  const primaryColor = firstText(site.site_brand_primary, '#111827');
  const secondaryColor = firstText(site.site_brand_secondary);
  const phone = firstText(contact.contact_phone);
  const address = firstText(contact.contact_address);
  const email = firstText(contact.contact_email);
  const categoryLabel = firstText(snapshot.category) && snapshot.category !== 'other' ? snapshot.category : 'Khác';
  const categoryPreviewLabel = categoryLabel === 'Khác' ? 'mẫu giao diện' : `mẫu ${categoryLabel.toLowerCase()}`;
  const categoryContext = categoryLabel === 'Khác' ? 'giao diện này' : `ngành ${categoryLabel.toLowerCase()}`;
  
  const images = collectImages({ site, components, componentData });
  const menuCount = getMenuCount(bundle);
  const headerMenuCount = bundle?.menus?.header?.items?.length ?? 0;
  const footerMenuCount = bundle?.menus?.footer?.items?.length ?? 0;
  const componentTypes = [...new Set(activeComponents.map((component) => component.type))];
  const sampleContent = collectTitles(componentData).slice(0, 8);
  const hasContactModule = activeComponents.some((component) => component.type === 'Contact');
  const hasCommerceModule = activeComponents.some((component) => ['ProductList', 'ProductGrid', 'ProductCategories', 'CategoryProducts'].includes(component.type));
  const hasContentModule = activeComponents.some((component) => component.type === 'Blog');
  const readableSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
  const seoChecklist = [
    { label: 'Tiêu đề khi lên Google', ok: Boolean(seoTitle), value: seoTitle },
    { label: 'Mô tả ngắn khi lên Google', ok: Boolean(seoDescription), value: seoDescription },
    { label: 'Ảnh khi gửi link', ok: Boolean(ogImage), value: ogImage ? 'Đã có ảnh đẹp cho Zalo, Messenger và Facebook' : 'Chưa thiết lập' },
    { label: 'Đường dẫn dễ nhớ', ok: readableSlug, value: readableSlug ? `/${slug} ngắn, không dấu, dễ đọc` : `/${slug}` },
    { label: 'Nhóm ngành rõ ràng', ok: categoryLabel !== 'Khác', value: categoryLabel },
    ...(sampleContent.length > 0 ? [{ label: 'Nội dung có thể giới thiệu', ok: true, value: `${sampleContent.length} nhóm nội dung nổi bật đã có trên trang` }] : []),
    { label: 'Trạng thái Google', ok: true, value: 'Bản xem trước chưa cho Google lưu vào kết quả tìm kiếm để tránh lộ trang trước khi bàn giao' },
  ];
  const customerValueItems = [
    ...(ogImage ? [{
      title: 'Khách thấy preview đẹp khi bạn gửi link',
      value: 'Ảnh chia sẻ đã sẵn sàng',
      detail: 'Khi gửi link qua Zalo hoặc Messenger, khách thấy ngay ảnh, tiêu đề và mô tả đủ hấp dẫn để bấm mở.',
    }] : []),
    {
      title: 'Có cấu trúc nội dung thật để bán hàng',
      value: `${activeComponents.length} khối nội dung đang bật`,
      detail: hasCommerceModule ? 'Có cụm sản phẩm/danh mục giúp khách hiểu nhanh mặt hàng chính.' : 'Các khối nội dung đang được đóng gói để trình bày thương hiệu rõ ràng.',
    },
    ...(menuCount > 0 ? [{
      title: 'Khách có đường đi rõ trên website',
      value: `${headerMenuCount} header · ${footerMenuCount} footer`,
      detail: 'Menu trên đầu và cuối trang giúp khách nhanh chóng tìm sản phẩm, thông tin và khu vực liên hệ.',
    }] : []),
    ...((phone || email || hasContactModule) ? [{
      title: 'Có tín hiệu chuyển đổi',
      value: 'Đã có điểm liên hệ',
      detail: hasContactModule ? 'Có khu vực liên hệ để khách để lại nhu cầu tư vấn.' : 'Thông tin điện thoại/email được dùng làm điểm chạm nhanh nếu có.',
    }] : []),
    ...(images.length > 0 ? [{
      title: 'Có tài nguyên hình ảnh để tạo niềm tin',
      value: `${images.length} ảnh được phát hiện`,
      detail: 'Ảnh thật trên trang giúp khách đánh giá gu thẩm mỹ và nhận diện thương hiệu.',
    }] : []),
    ...((hasContentModule || sampleContent.length > 0) ? [{
      title: 'Có nền tảng nội dung để lên Google dài hạn',
      value: hasContentModule ? 'Có khu vực bài viết' : sampleContent.length > 0 ? `${sampleContent.length} nội dung nổi bật` : 'Có thể bổ sung bài viết',
      detail: hasContentModule ? 'Bài viết giúp mở rộng khách hàng từ tìm kiếm và nội dung tư vấn.' : sampleContent.length > 0 ? 'Các tiêu đề/nội dung hiện có có thể dùng làm nền cho trang bán hàng.' : 'Nên thêm bài tư vấn hoặc bộ sưu tập nội dung để hỗ trợ tìm kiếm dài hạn.',
    }] : []),
  ];
  const tocItems = [
    { href: '#brand-identity', label: 'Hồ sơ định danh' },
    { href: '#seo-readiness', label: 'Google & chia sẻ link' },
    { href: '#customer-value', label: 'Điều khách hàng quan tâm' },
    { href: '#share-preview', label: 'Mockup Zalo/Messenger' },
    { href: '#responsive-preview', label: 'Hiển thị đa thiết bị' },
    { href: '#enterprise-ready', label: 'Điểm mạnh kinh doanh' },
    { href: '#sections', label: 'Khối nội dung bán hàng' },
    ...(sampleContent.length > 0 ? [{ href: '#content-index', label: 'Nội dung nổi bật' }] : []),
    ...((phone || address || email) ? [{ href: '#contact-info', label: 'Thông tin liên hệ' }] : []),
    ...(images.length > 1 ? [{ href: '#media-assets', label: 'Tài nguyên hình ảnh' }] : []),
  ];

  // Fallback check if primaryColor is very dark so we can adjust text contrast if needed
  const isDarkPrimary = primaryColor !== '#111827' && primaryColor !== '#ffffff';

  return (
    <main className={`min-h-screen bg-slate-50 text-slate-900 ${fontBeVietnamPro.className} selection:bg-slate-900 selection:text-white pb-24`} style={{ colorScheme: 'light' }}>
      {/* Custom scrollbar color based on brand */}
      <style dangerouslySetInnerHTML={{ __html: `
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: ${primaryColor}; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { opacity: 0.8; }
        * { scrollbar-color: ${primaryColor} #f1f5f9; scrollbar-width: thin; }
      `}} />
      {/* HEADER SECTION - Minimalist & Square */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 xl:px-8 py-5 flex items-center justify-between">
          <Link href="/theme-gallery" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Về Kho Giao Diện
          </Link>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-none opacity-75" style={{ backgroundColor: primaryColor }}></span>
              <span className="relative inline-flex h-2 w-2 rounded-none" style={{ backgroundColor: primaryColor }}></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: primaryColor }}>
              Sẵn Sàng Triển Khai
            </span>
          </div>
        </div>
      </section>

      {/* HERO BANNER */}
      <section className="bg-slate-900 text-white border-b border-slate-800 relative overflow-hidden">
        {/* Subtle background glow based on primary color */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] opacity-10 blur-[100px] pointer-events-none rounded-full" style={{ backgroundColor: primaryColor }}></div>
        
        <div className="max-w-7xl mx-auto px-4 md:px-6 xl:px-8 py-12 md:py-16 relative z-10">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-none border px-3 py-1.5 text-xs font-bold tracking-wide" style={{ borderColor: `${primaryColor}40`, backgroundColor: `${primaryColor}10`, color: isDarkPrimary ? primaryColor : '#60a5fa' }}>
                TRANG MẪU DỰA TRÊN NỘI DUNG THẬT
              </div>
              <div className="inline-flex items-center gap-2 rounded-none border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold tracking-wide text-slate-200">
                DANH MỤC: {categoryLabel}
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                  {brandName}
                </h1>
                <p className="mt-4 text-base leading-relaxed text-slate-400 max-w-lg">
                  {tagline}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href={demoUrl}
                  target="_blank"
                  className="inline-flex items-center justify-center gap-2 rounded-none px-6 py-3 text-sm font-bold bg-white transition-colors"
                  style={{ color: primaryColor }}
                >
                  Mở Website Mẫu
                  <ExternalLink className="h-4 w-4" />
                </Link>
                <a
                  href="#sections"
                  className="inline-flex items-center justify-center gap-2 rounded-none border bg-transparent px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/5"
                  style={{ borderColor: `${primaryColor}50` }}
                >
                  Xem Báo Cáo Kỹ Thuật
                  <FileText className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* HERO - Overlapping Device Mockups (theme marketplace style) */}
            <div className="relative w-full mt-4 lg:mt-0 min-h-[280px] sm:min-h-[340px]">

              {/* ── Desktop Browser (back, largest) ── */}
              <div className="relative w-[88%] sm:w-[85%] z-10">
                <div className="bg-white border border-slate-200 rounded-lg shadow-2xl overflow-hidden">
                  {/* Browser chrome with 3 dots */}
                  <div className="h-8 bg-slate-100 border-b border-slate-200 flex items-center px-3 gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                    <div className="ml-3 flex-1 h-4 bg-white border border-slate-200 rounded-sm flex items-center px-2">
                      <span className="text-[8px] text-slate-400 truncate">{demoUrl}</span>
                    </div>
                  </div>
                  {/* Screen — render at 1440×900 then scale down to fill container */}
                  <div className="relative w-full overflow-hidden" style={{ paddingBottom: '62.5%' }}>
                    <iframe src={demoUrl} title="Desktop" className="absolute top-0 left-0 border-0 pointer-events-none" style={{ width: '1440px', height: '900px', transform: 'scale(0.38)', transformOrigin: 'top left' }} loading="lazy" sandbox="allow-same-origin allow-scripts" />
                  </div>
                </div>
              </div>

              {/* ── Tablet (overlapping, right side) ── */}
              <div className="absolute -right-2 sm:right-0 top-[12%] z-20">
                <div className="bg-gray-800 border-[7px] border-gray-800 rounded-[1.2rem] shadow-2xl overflow-hidden" style={{ width: '180px', height: '240px' }}>
                  <div className="bg-white rounded-[0.6rem] overflow-hidden" style={{ width: '166px', height: '226px' }}>
                    <iframe src={demoUrl} title="Tablet" className="border-0 pointer-events-none" style={{ width: '768px', height: '1024px', transform: 'scale(0.216)', transformOrigin: 'top left' }} loading="lazy" sandbox="allow-same-origin allow-scripts" />
                  </div>
                </div>
              </div>

              {/* ── Phone (overlapping, bottom right) ── */}
              <div className="absolute right-[6%] sm:right-[3%] -bottom-2 sm:-bottom-4 z-30">
                <div className="bg-gray-800 border-[5px] border-gray-800 rounded-[1rem] shadow-2xl overflow-hidden" style={{ width: '100px', height: '210px' }}>
                  {/* Notch */}
                  <div className="w-[36px] h-[5px] bg-gray-800 rounded-full mx-auto mt-[2px] mb-[1px]"></div>
                  <div className="bg-white rounded-[0.5rem] overflow-hidden" style={{ width: '90px', height: '192px' }}>
                    <iframe src={demoUrl} title="Mobile" className="border-0 pointer-events-none" style={{ width: '390px', height: '844px', transform: 'scale(0.228)', transformOrigin: 'top left' }} loading="lazy" sandbox="allow-same-origin allow-scripts" />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-6 xl:px-8 mt-12 grid gap-6 lg:grid-cols-[1fr_320px] items-start">
        {/* MAIN CONTENT COLUMN */}
        <div className="space-y-8">
          
          {/* STATS BENTO GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={<Layers className="h-4 w-4" />} label="Khối Nội Dung" value={String(activeComponents.length)} brandColor={primaryColor} />
            <StatCard icon={<Menu className="h-4 w-4" />} label="Mục Điều Hướng" value={String(menuCount)} brandColor={primaryColor} />
            <StatCard icon={<ImageIcon className="h-4 w-4" />} label="Hình Ảnh" value={String(images.length)} brandColor={primaryColor} />
            <StatCard icon={<Palette className="h-4 w-4" />} label="Kiểu Nội Dung" value={String(componentTypes.length)} brandColor={primaryColor} />
          </div>

          {/* OVERVIEW PANEL */}
          <BentoPanel id="brand-identity" title="Hồ Sơ Thương Hiệu" brandColor={primaryColor}>
            <div className="grid gap-[1px] bg-slate-200 sm:grid-cols-2 border border-slate-200">
              <DetailCell label="Tên bản mẫu" value={snapshot.label} />
              <DetailCell label="Thương Hiệu / Tổ Chức" value={brandName} />
              <DetailCell label="Thông Điệp Cốt Lõi" value={tagline || 'Không thiết lập'} />
              <DetailCell label="Tên Miền (Slug)" value={slug} />
              <DetailCell label="Danh Mục" value={categoryLabel} />
              <DetailCell label="Màu Nhận Diện Chính" value={primaryColor} swatch={primaryColor} />
              <DetailCell label="Màu Bổ Trợ" value={secondaryColor || 'Chưa thiết lập'} swatch={secondaryColor} />
            </div>
          </BentoPanel>

          <BentoPanel id="seo-readiness" title="Google & Khả Năng Chia Sẻ Link" brandColor={primaryColor}>
            <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
              <div className="border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Nhìn từ khách hàng và công cụ tìm kiếm</p>
                <h3 className="mt-1 text-xl font-black text-slate-900">Khi website xuất hiện trên Google hoặc trong tin nhắn</h3>
                <div className="mt-5 space-y-3">
                  <SeoField label="Tiêu đề hiển thị" value={seoTitle} />
                  <SeoField label="Mô tả ngắn" value={seoDescription} />
                  <SeoField label="Ảnh khi gửi link" value={ogImage || 'Chưa thiết lập'} />
                </div>
              </div>
              <div className="grid gap-[1px] border border-slate-200 bg-slate-200">
                {seoChecklist.map((item) => (
                  <div key={item.label} className="bg-white p-4">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border" style={{ borderColor: item.ok ? primaryColor : '#cbd5e1', color: item.ok ? primaryColor : '#94a3b8' }}>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
                        <p className="mt-1 line-clamp-2 text-xs font-semibold leading-relaxed text-slate-700">{item.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </BentoPanel>

          <BentoPanel id="customer-value" title="Điều Khách Hàng Thực Sự Quan Tâm" brandColor={primaryColor}>
            <div className="grid gap-[1px] border border-slate-200 bg-slate-200 md:grid-cols-2">
              {customerValueItems.map((item) => (
                <div key={item.title} className="bg-white p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: primaryColor }}>{item.value}</p>
                  <h3 className="mt-2 text-sm font-black text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">{item.detail}</p>
                </div>
              ))}
            </div>
          </BentoPanel>

          <BentoPanel id="share-preview" title="Mockup Chia Sẻ Link (Zalo / Messenger)" brandColor={primaryColor}>
            <div className="border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Xem trước trong khung chat</p>
                  <h3 className="mt-1 text-xl font-black text-slate-900">Khách hàng nhìn thấy gì khi bạn gửi link?</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
                    Mô phỏng khung chat thực tế: khi gửi link, Zalo/Messenger tự hiện ảnh, tiêu đề và mô tả để khách hàng nhận diện ngay website.
                  </p>
                </div>
                <span className="w-fit shrink-0 border px-3 py-1 text-[10px] font-black uppercase tracking-widest" style={{ borderColor: `${primaryColor}30`, color: primaryColor }}>
                  Ảnh chia sẻ · 1200 × 630
                </span>
              </div>

              <div className="grid gap-5 xl:grid-cols-2">
                {([
                  {
                    accent: '#0068ff',
                    bg: 'from-[#eaf3ff] via-[#f7fbff] to-white',
                    customer: 'Chị Linh',
                    incoming: 'bg-white text-slate-800',
                    name: 'Zalo',
                    outgoing: 'bg-[#0068ff] text-white',
                    reply: `Nhìn preview là biết đúng ${categoryPreviewLabel} luôn, gửi em xem chi tiết nhé.`,
                    status: 'Đã xem',
                    urlLabel: 'zalo.me/share · localhost:3000',
                  },
                  {
                    accent: '#0084ff',
                    bg: 'from-[#eef5ff] via-white to-[#f6f7fb]',
                    customer: 'Anh Minh',
                    incoming: 'bg-[#f0f2f5] text-slate-900',
                    name: 'Messenger',
                    outgoing: 'bg-gradient-to-r from-[#0084ff] to-[#7b2ff7] text-white',
                    reply: 'Ảnh preview rõ ràng, anh mở link xem bố cục chi tiết.',
                    status: 'Seen',
                    urlLabel: 'messenger.com · localhost:3000',
                  },
                ] as const).map((platform) => (
                  <div key={platform.name} className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-2xl ring-1 ring-slate-900/5">
                    <div className="bg-slate-950 px-5 py-2 text-white">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span>09:41</span>
                        <div className="flex items-center gap-1.5">
                          <span className="flex items-end gap-0.5">
                            <span className="h-1.5 w-0.5 rounded bg-white/60"></span>
                            <span className="h-2 w-0.5 rounded bg-white/70"></span>
                            <span className="h-2.5 w-0.5 rounded bg-white/80"></span>
                            <span className="h-3 w-0.5 rounded bg-white"></span>
                          </span>
                          <span className="text-[10px] leading-none">98%</span>
                          <span className="relative h-2.5 w-5 rounded-[3px] border border-white/80">
                            <span className="absolute left-0.5 top-0.5 h-1.5 w-4 rounded-[2px] bg-emerald-400"></span>
                            <span className="absolute -right-1 top-1 h-1 w-0.5 rounded-r bg-white/80"></span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
                      <div className="relative flex h-11 w-11 items-center justify-center rounded-full text-sm font-black text-white shadow-md" style={{ backgroundColor: platform.accent }}>
                        {platform.name === 'Zalo' ? <ZaloIcon size={25} /> : <MessengerLogo size={25} />}
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500"></span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-900">{platform.customer}</p>
                        <p className="text-[11px] font-semibold" style={{ color: platform.accent }}>{platform.name} · Đang hoạt động</p>
                      </div>
                      <div className="ml-auto flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-black" style={{ color: platform.accent }}>☎</span>
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-black" style={{ color: platform.accent }}>⋯</span>
                      </div>
                    </div>

                    <div className={`space-y-4 bg-gradient-to-b ${platform.bg} p-4`}>
                      <div className={`max-w-[78%] rounded-[20px] rounded-bl-md px-4 py-3 text-sm font-medium leading-relaxed shadow-sm ${platform.incoming}`}>
                        Em muốn xem trước giao diện khi gửi cho khách hàng trên điện thoại.
                      </div>

                      <div className="ml-auto max-w-[88%] space-y-2">
                        <div className={`ml-auto w-fit rounded-[20px] rounded-br-md px-4 py-3 text-sm font-semibold leading-relaxed shadow-md ${platform.outgoing}`}>
                          Dạ em gửi chị trang xem chi tiết cho {categoryContext} của {brandName} ạ.
                        </div>

                        <div className="ml-auto overflow-hidden rounded-lg rounded-br-sm border border-slate-200 bg-white shadow-xl">
                          {ogImage ? (
                            <img src={ogImage} alt={seoTitle} className="aspect-[1200/630] w-full object-cover" />
                          ) : (
                            <div className="flex aspect-[1200/630] w-full flex-col items-center justify-center gap-2 bg-slate-100 text-slate-400">
                              <ImageIcon className="h-8 w-8" />
                              <p className="text-xs font-semibold">Chưa có ảnh chia sẻ</p>
                            </div>
                          )}
                          <div className="space-y-1 border-t border-slate-100 p-3">
                            <p className="line-clamp-2 text-sm font-black leading-snug text-slate-900">{seoTitle}</p>
                            <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">{seoDescription}</p>
                            <p className="truncate pt-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">{platform.urlLabel}{detailUrl}</p>
                          </div>
                        </div>
                        <p className="pr-2 text-right text-[11px] font-semibold text-slate-400">{platform.status}</p>
                      </div>

                      <div className={`max-w-[82%] rounded-[20px] rounded-bl-md px-4 py-3 text-sm font-medium leading-relaxed shadow-sm ${platform.incoming}`}>
                        {platform.reply}
                      </div>

                      <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-2 shadow-sm">
                        <span className="h-7 w-7 rounded-full bg-slate-100"></span>
                        <span className="flex-1 text-xs font-medium text-slate-400">Nhập tin nhắn...</span>
                        <span className="text-sm font-black" style={{ color: platform.accent }}>➤</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </BentoPanel>

          {/* ═══ RESPONSIVE MOCKUP — inline, before less important sections ═══ */}
          <div id="responsive-preview" className="bg-slate-50 border border-slate-200 relative overflow-hidden py-10 sm:py-14 px-4 sm:px-8 scroll-mt-24">
            <div className="absolute inset-0 opacity-[0.35]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #cbd5e1 0.5px, transparent 0)', backgroundSize: '20px 20px' }}></div>
            <div className="relative z-10 flex flex-col items-center gap-12 mx-auto">

              {/* LAPTOP — scale 1440×900 into full width */}
              <div className="w-full">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 text-center">Desktop · 1440 × 900</p>
                <div className="relative mx-auto border-gray-800 bg-gray-800 border-[8px] rounded-t-xl shadow-xl">
                  <div className="relative w-full overflow-hidden rounded-lg bg-white" style={{ paddingBottom: '62.5%' }}>
                    <iframe src={demoUrl} title="Laptop" className="absolute top-0 left-0 border-0 pointer-events-none" style={{ width: '1440px', height: '900px', transform: 'scale(0.55)', transformOrigin: 'top left' }} loading="lazy" sandbox="allow-same-origin allow-scripts" />
                  </div>
                </div>
                <div className="relative mx-auto bg-gray-900 rounded-b-xl rounded-t-sm h-[17px] md:h-[21px]">
                  <div className="absolute left-1/2 top-0 -translate-x-1/2 rounded-b-xl w-[56px] h-[5px] md:w-[96px] md:h-[8px] bg-gray-800"></div>
                </div>
              </div>

              {/* TABLET + PHONE row */}
              <div className="flex flex-col sm:flex-row items-end justify-center gap-10 sm:gap-16">
                {/* TABLET — 768×1024, scale=313/768=0.407, displayed: 313×417 */}
                <div className="flex flex-col items-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Tablet · 768 × 1024</p>
                  <div className="relative mx-auto border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] shadow-xl" style={{ width: '341px', height: '445px' }}>
                    <div className="h-[32px] w-[3px] bg-gray-800 absolute -start-[17px] top-[72px] rounded-s-lg"></div>
                    <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[124px] rounded-s-lg"></div>
                    <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[178px] rounded-s-lg"></div>
                    <div className="h-[64px] w-[3px] bg-gray-800 absolute -end-[17px] top-[142px] rounded-e-lg"></div>
                    <div className="rounded-[2rem] overflow-hidden bg-white" style={{ width: '313px', height: '417px' }}>
                      <iframe src={demoUrl} title="Tablet" className="border-0 pointer-events-none" style={{ width: '768px', height: '1024px', transform: 'scale(0.407)', transformOrigin: 'top left' }} loading="lazy" sandbox="allow-same-origin allow-scripts" />
                    </div>
                  </div>
                </div>
                {/* PHONE — 390×844, scale=272/390=0.697, displayed: 272×589 (clip at 572) */}
                <div className="flex flex-col items-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Mobile · 390 × 844</p>
                  <div className="relative mx-auto border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] shadow-xl" style={{ width: '300px', height: '600px' }}>
                    <div className="w-[148px] h-[18px] bg-gray-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute"></div>
                    <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[124px] rounded-s-lg"></div>
                    <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[178px] rounded-s-lg"></div>
                    <div className="h-[64px] w-[3px] bg-gray-800 absolute -end-[17px] top-[142px] rounded-e-lg"></div>
                    <div className="rounded-[2rem] overflow-hidden bg-white" style={{ width: '272px', height: '572px' }}>
                      <iframe src={demoUrl} title="Mobile" className="border-0 pointer-events-none" style={{ width: '390px', height: '844px', transform: 'scale(0.697)', transformOrigin: 'top left' }} loading="lazy" sandbox="allow-same-origin allow-scripts" />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* HIGHLIGHTS */}
          <BentoPanel id="enterprise-ready" title="Điểm Mạnh Khi Đưa Vào Kinh Doanh" brandColor={primaryColor}>
            <div className="grid gap-[1px] bg-slate-200 sm:grid-cols-2 border border-slate-200">
              <HighlightCell 
                brandColor={primaryColor}
                text={activeComponents.length > 5 ? `Trang có ${activeComponents.length} khu vực nội dung để dẫn khách từ xem thông tin đến ra quyết định.` : `Bố cục gọn, tập trung vào thông điệp chính và hành động tiếp theo của khách.`} 
              />
              <HighlightCell 
                brandColor={primaryColor}
                text={componentTypes.length > 0 ? `Các khu vực được tách rõ để dễ thay ảnh, đổi nội dung, thêm sản phẩm hoặc chạy chiến dịch mới.` : 'Cấu trúc trang đã sẵn sàng để biên tập và xuất bản.'} 
              />
              <HighlightCell 
                brandColor={primaryColor}
                text={`Trang đang có ${images.length} ảnh/tài nguyên hình ảnh để thể hiện thương hiệu và tăng độ tin cậy.`} 
              />
              <HighlightCell 
                brandColor={primaryColor}
                text={menuCount > 0 ? `Có ${menuCount} mục điều hướng giúp khách tìm đúng thông tin nhanh hơn.` : 'Có thể bổ sung menu để khách đi qua các nội dung chính dễ hơn.'} 
              />
            </div>
          </BentoPanel>

          {/* SECTIONS ACCORDION */}
          <BentoPanel title="Các Khối Nội Dung Đang Có Trên Trang" id="sections" brandColor={primaryColor}>
            <div className="border border-slate-200 divide-y divide-slate-200 bg-white shadow-sm">
              {activeComponents.map((component, index) => {
                const data = componentData[component._id] ?? componentData[component.type];
                const summary = getComponentSummary(component, data);
                const titles = collectTitles(data).slice(0, 4);
                const valueProp = getEnterpriseValueProposition(component.type);

                return (
                  <details key={component._id} className="group p-0 [&_summary::-webkit-details-marker]:hidden open:bg-slate-50/50">
                    <summary className="flex cursor-pointer items-center justify-between gap-4 p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center justify-center w-8 h-8 bg-slate-100 text-slate-900 font-mono text-xs font-bold border border-slate-200 shadow-sm">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">{component.title}</h3>
                          <p className="text-[11px] text-slate-500 mt-0.5">{TYPE_LABELS[component.type] ?? component.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {/* Value proposition tag on desktop */}
                        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 border border-slate-200 bg-white shadow-sm">
                          {valueProp.icon}
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                            {valueProp.title}
                          </span>
                        </div>
                        <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" />
                      </div>
                    </summary>
                    <div className="px-4 pb-5 pt-1 border-t border-slate-100 text-sm text-slate-600">
                      <div className="pl-12">
                        {/* Business Value Highlight */}
                        <div className="mb-4 bg-white border border-slate-200 p-3 shadow-sm border-l-2" style={{ borderLeftColor: primaryColor }}>
                          <p className="text-xs font-semibold text-slate-800 mb-1 flex items-center gap-2">
                            <Zap className="h-3.5 w-3.5" style={{ color: primaryColor }} />
                            Giá trị với khách hàng
                          </p>
                          <p className="text-[13px] leading-relaxed text-slate-600">
                            {valueProp.desc}
                          </p>
                        </div>

                        {/* Tech/Data config */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] font-bold uppercase text-slate-400 mb-1.5 tracking-wider">Cấu hình Hiển thị</p>
                            {summary ? (
                              <p className="text-[13px] leading-relaxed text-slate-700">{summary}</p>
                            ) : (
                              <p className="text-[13px] leading-relaxed text-slate-500 italic">Dữ liệu phân hệ đang chờ cập nhật biên tập.</p>
                            )}
                          </div>
                          
                          {titles.length > 0 && (
                            <div>
                              <p className="text-[10px] font-bold uppercase text-slate-400 mb-1.5 tracking-wider">Trường Dữ liệu trích xuất</p>
                              <div className="flex flex-wrap gap-1.5">
                                {titles.map((title) => (
                                  <span key={title} className="bg-white border border-slate-200 px-2 py-1 text-[11px] text-slate-700 font-medium shadow-sm">
                                    {title}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </details>
                );
              })}
            </div>
            {inactiveComponents > 0 && (
              <div className="mt-4 border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-700">
                <strong>Ghi chú:</strong> Có {inactiveComponents} khối nội dung đang tạm ẩn. Có thể bật lại khi cần thêm nội dung cho chiến dịch mới.
              </div>
            )}
          </BentoPanel>

          {/* SAMPLE CONTENT */}
          {sampleContent.length > 0 && (
            <BentoPanel id="content-index" title="Nội Dung Nổi Bật Có Thể Dùng Làm Từ Khóa" brandColor={primaryColor}>
              <div className="flex flex-wrap gap-[1px] bg-slate-200 border border-slate-200">
                {sampleContent.map((item) => (
                  <div key={item} className="bg-white px-3 py-2 text-xs font-semibold text-slate-700 flex-auto border-[0.5px] border-slate-200">
                    {item}
                  </div>
                ))}
              </div>
            </BentoPanel>
          )}
        </div>

        {/* SIDEBAR COLUMN */}
        <aside className="space-y-6 lg:sticky lg:top-6">
          <div className="border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-3 mb-4" style={{ borderBottomColor: `${primaryColor}30` }}>Mục Lục Nhanh</h2>
            <nav className="space-y-1">
              {tocItems.map((item, index) => (
                <a key={item.href} href={item.href} className="group flex items-center gap-2 rounded-sm px-2 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950">
                  <span className="font-mono text-[10px] text-slate-400 group-hover:text-slate-700">{String(index + 1).padStart(2, '0')}</span>
                  <span>{item.label}</span>
                </a>
              ))}
            </nav>
          </div>

          <div className="border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-3 mb-4" style={{ borderBottomColor: `${primaryColor}30` }}>Bản Mẫu Hoạt Động</h2>
            <p className="text-xs leading-relaxed text-slate-500 mb-5">
              Mở website mẫu để xem giao diện, nội dung, cách hiển thị trên điện thoại và cảm giác sử dụng thực tế.
            </p>
            <Link
              href={demoUrl}
              target="_blank"
              className="flex w-full items-center justify-center gap-2 px-4 py-3 text-xs font-bold text-white transition-opacity hover:opacity-90 border shadow-sm"
              style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
            >
              MỞ WEBSITE MẪU
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          {(phone || address || email) && (
            <div id="contact-info" className="border border-slate-200 bg-white p-5 shadow-sm scroll-mt-24">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-3 mb-4" style={{ borderBottomColor: `${primaryColor}30` }}>Thông tin Doanh nghiệp</h2>
              <div className="space-y-3 text-xs text-slate-700 font-medium">
                {phone && <ContactLine brandColor={primaryColor} icon={<Phone className="h-3.5 w-3.5" />} text={phone} />}
                {address && <ContactLine brandColor={primaryColor} icon={<MapPin className="h-3.5 w-3.5" />} text={address} />}
                {email && <ContactLine brandColor={primaryColor} icon={<FileText className="h-3.5 w-3.5" />} text={email} />}
              </div>
            </div>
          )}

          {images.length > 1 && (
            <div id="media-assets" className="border border-slate-200 bg-white p-5 shadow-sm scroll-mt-24">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-3 mb-4" style={{ borderBottomColor: `${primaryColor}30` }}>Tài Nguyên Hình Ảnh</h2>
              <div className="grid grid-cols-2 gap-2">
                {images.slice(0, 6).map((image) => (
                  <div key={image} className="aspect-square bg-slate-100 border border-slate-200 overflow-hidden relative group">
                    <img src={image} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Bottom mockup section removed — now inline above */}

    </main>
  );
}

function StatCard({ icon, label, value, brandColor }: { icon: ReactNode; label: string; value: string; brandColor: string }) {
  return (
    <div className="border border-slate-200 bg-white p-4 flex flex-col justify-between h-28 hover:border-slate-300 transition-colors group relative overflow-hidden shadow-sm">
      <div className="absolute top-0 right-0 w-16 h-16 opacity-5 translate-x-4 -translate-y-4 rounded-full" style={{ backgroundColor: brandColor }}></div>
      <div className="flex justify-between items-start relative z-10">
        <div className="p-2 border" style={{ color: brandColor, borderColor: `${brandColor}40`, backgroundColor: `${brandColor}10` }}>
          {icon}
        </div>
      </div>
      <div className="relative z-10">
        <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">{label}</p>
      </div>
    </div>
  );
}

function BentoPanel({ id, title, children, brandColor }: { id?: string; title: string; children: ReactNode; brandColor: string }) {
  return (
    <section id={id} className="space-y-4 scroll-mt-24">
      <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-3">
        <span className="h-4 w-1 block shadow-sm" style={{ backgroundColor: brandColor }}></span>
        {title}
        <span className="flex-1 h-px bg-slate-200"></span>
      </h2>
      {children}
    </section>
  );
}

function SeoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-slate-200 bg-slate-50 p-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 break-words text-xs font-semibold leading-relaxed text-slate-700">{value || 'Chưa thiết lập'}</p>
    </div>
  );
}

function DetailCell({ label, value, swatch }: { label: string; value: string; swatch?: string }) {
  return (
    <div className="bg-white p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        {swatch && (
          <span className="h-3 w-3 border border-slate-300 shadow-sm block flex-shrink-0" style={{ background: swatch }} />
        )}
        <p className="text-sm font-bold text-slate-800 truncate">{value}</p>
      </div>
    </div>
  );
}

function HighlightCell({ text, brandColor }: { text: string; brandColor: string }) {
  return (
    <div className="bg-white p-4 flex gap-3 items-start relative overflow-hidden group shadow-sm">
      <div className="absolute left-0 top-0 bottom-0 w-[2px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: brandColor }}></div>
      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: brandColor }} />
      <p className="text-[13px] font-semibold leading-relaxed text-slate-700">{text}</p>
    </div>
  );
}

function ContactLine({ icon, text, brandColor }: { icon: ReactNode; text: string; brandColor: string }) {
  return (
    <div className="flex gap-3 items-start">
      <span className="mt-0.5 shrink-0 p-1 border" style={{ color: brandColor, borderColor: `${brandColor}30`, backgroundColor: `${brandColor}10` }}>{icon}</span>
      <span className="break-words mt-1">{text}</span>
    </div>
  );
}
