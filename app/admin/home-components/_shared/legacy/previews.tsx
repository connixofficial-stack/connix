'use client';

import React, { useState } from 'react';
import { AdminImage as Image } from '@/app/admin/components/AdminImage';
import { BrandBadge, IconContainer, CheckIcon, AccentLine } from '@/components/site/shared/BrandColorHelpers';
import { 
  ArrowRight, Briefcase, Building2, Check, ChevronDown, ChevronLeft,
  ChevronRight, Clock, Cpu, Eye, Facebook, FileText,
  Globe, HelpCircle, Image as ImageIcon, Instagram, Layers, Linkedin, Mail, MapPin, MessageCircle,
  Monitor, Package, Phone, Plus, Rocket, Settings, Shield, Smartphone, Star, Tablet, Tag, Target,
  Twitter, Users, X, Youtube, Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, cn } from '../../../components/ui';
import { DEFAULT_VOUCHER_STYLE, normalizeVoucherLimit, normalizeVoucherStyle, type VoucherPromotionsStyle } from '@/lib/home-components/voucher-promotions';
import { getFooterLayoutColors, type FooterLayoutColors } from '@/app/admin/home-components/footer/_lib/colors';
import type { FooterBrandMode } from '@/app/admin/home-components/footer/_types';
import { ProcessPreview as ProcessPreviewModern } from '../../process/_components/ProcessPreview';
import { AboutPreview } from '../../about/_components/AboutPreview';
import { useBrandColors } from '../../create/shared';

export { AboutPreview };

type PreviewDevice = 'desktop' | 'tablet' | 'mobile';

const deviceWidths = {
  desktop: 'w-full max-w-7xl',
  mobile: 'w-[375px] max-w-full',
  tablet: 'w-[768px] max-w-full'
};

type PreviewImageProps = Omit<React.ComponentProps<typeof Image>, 'width' | 'height' | 'src'> & {
  src?: React.ComponentProps<typeof Image>['src'];
  width?: number | string;
  height?: number | string;
};

const PreviewImage = ({ src, alt = '', width = 1200, height = 800, ...rest }: PreviewImageProps) => {
  if (!src) {return null;}
  const normalizedWidth = typeof width === 'string' ? Number.parseInt(width, 10) || 1200 : width;
  const normalizedHeight = typeof height === 'string' ? Number.parseInt(height, 10) || 800 : height;

  return (
    <Image
      src={src}
      {...rest}
      alt={alt}
      width={normalizedWidth}
      height={normalizedHeight}
      unoptimized
    />
  );
};

const devices = [
  { icon: Monitor, id: 'desktop' as const, label: 'Desktop (max-w-7xl)' },
  { icon: Tablet, id: 'tablet' as const, label: 'Tablet (768px)' },
  { icon: Smartphone, id: 'mobile' as const, label: 'Mobile (375px)' }
];

// Browser Frame Component
const BrowserFrame = ({ children, url = 'yoursite.com' }: { children: React.ReactNode; url?: string }) => (
  <div className="border rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-lg">
    <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 flex items-center gap-2 border-b">
      <div className="flex gap-1.5">
        <div className="w-3 h-3 rounded-full bg-red-400"></div>
        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
        <div className="w-3 h-3 rounded-full bg-green-400"></div>
      </div>
      <div className="flex-1 ml-4">
        <div className="bg-white dark:bg-slate-700 rounded-md px-3 py-1 text-xs text-slate-400 max-w-xs">{url}</div>
      </div>
    </div>
    {children}
  </div>
);

// Preview Wrapper Component
const PreviewWrapper = ({ 
  title, 
  children, 
  device, 
  setDevice, 
  previewStyle, 
  setPreviewStyle, 
  styles,
  info 
}: { 
  title: string;
  children: React.ReactNode;
  device: PreviewDevice;
  setDevice: (d: PreviewDevice) => void;
  previewStyle: string;
  setPreviewStyle: (s: string) => void;
  styles: { id: string; label: string }[];
  info?: string;
}) => (
  <Card className="mt-6">
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Eye size={18} /> {title}
        </CardTitle>
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            {styles.map((s) => (
              <button key={s.id} type="button" onClick={() =>{  setPreviewStyle(s.id); }}
                className={cn("px-3 py-1 text-xs font-medium rounded-md transition-all",
                  previewStyle === s.id ? "bg-white dark:bg-slate-700 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                {s.label}
              </button>
            ))}
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            {devices.map((d) => (
              <button key={d.id} type="button" onClick={() =>{  setDevice(d.id); }} title={d.label}
                className={cn("p-1.5 rounded-md transition-all",
                  device === d.id ? "bg-white dark:bg-slate-700 shadow-sm" : "text-slate-400 hover:text-slate-600")}>
                <d.icon size={16} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className={cn("mx-auto transition-all duration-300", deviceWidths[device])}>
        {children}
      </div>
      {info && (
        <div className="mt-3 text-xs text-slate-500">
          Style: <strong className="text-slate-700 dark:text-slate-300">{styles.find(s => s.id === previewStyle)?.label}</strong>
          {' • '}{device === 'desktop' && 'max-w-7xl (1280px)'}{device === 'tablet' && '768px'}{device === 'mobile' && '375px'}
          {info && ` • ${info}`}
        </div>
      )}
    </CardContent>
  </Card>
);

// ============ FAQ PREVIEW ============
interface FaqItem { id: number; question: string; answer: string }
export type FaqStyle = 'accordion' | 'cards' | 'two-column' | 'minimal' | 'timeline' | 'tabbed';
export interface FaqConfig { description?: string; buttonText?: string; buttonLink?: string }
export const FaqPreview = ({ items, brandColor, secondary, selectedStyle, onStyleChange, config }: { items: FaqItem[]; brandColor: string;
  secondary: string; selectedStyle?: FaqStyle; onStyleChange?: (style: FaqStyle) => void; config?: FaqConfig }) => {
  const [device, setDevice] = useState<PreviewDevice>('desktop');
  const previewStyle = selectedStyle ?? 'accordion';
  const setPreviewStyle = (s: string) => onStyleChange?.(s as FaqStyle);
  const [openIndex, setOpenIndex] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const styles = [
    { id: 'accordion', label: 'Accordion' }, 
    { id: 'cards', label: 'Cards' }, 
    { id: 'two-column', label: '2 Cột' },
    { id: 'minimal', label: 'Minimal' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'tabbed', label: 'Tabbed' }
  ];

  const MAX_VISIBLE = device === 'mobile' ? 4 : 6;
  const visibleItems = items.slice(0, MAX_VISIBLE);
  const remainingCount = items.length - MAX_VISIBLE;

  // Empty state
  if (items.length === 0) {
    return (
      <PreviewWrapper title="Preview FAQ" device={device} setDevice={setDevice} previewStyle={previewStyle} setPreviewStyle={setPreviewStyle} styles={styles} info="0 câu hỏi">
        <BrowserFrame url="yoursite.com/faq">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: `${secondary}10` }}>
              <HelpCircle size={32} style={{ color: secondary }} />
            </div>
            <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1">Chưa có câu hỏi nào</h3>
            <p className="text-sm text-slate-500">Thêm câu hỏi đầu tiên để bắt đầu</p>
          </div>
        </BrowserFrame>
      </PreviewWrapper>
    );
  }

  // Style 1: Accordion - with ARIA, keyboard nav, brandColor hover
  const renderAccordionStyle = () => (
    <div className={cn("py-10 px-4", device === 'mobile' && 'py-6 px-3')}>
      <h3 className={cn("font-bold text-center mb-8 text-slate-900 dark:text-slate-100", device === 'mobile' ? 'text-lg mb-6' : 'text-2xl')}>Câu hỏi thường gặp</h3>
      <div className="space-y-3 max-w-3xl mx-auto" role="region" aria-label="Câu hỏi thường gặp">
        {visibleItems.map((item, idx) => {
          const isOpen = openIndex === idx;
          const panelId = `faq-panel-${idx}`;
          const buttonId = `faq-button-${idx}`;
          return (
            <div 
              key={item.id} 
              className="rounded-xl overflow-hidden transition-all"
              style={{ 
                border: `1px solid ${isOpen ? secondary + '40' : secondary + '15'}`,
                boxShadow: isOpen ? `0 4px 12px ${secondary}10` : 'none'
              }}
            >
              <button 
                type="button" 
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() =>{  setOpenIndex(isOpen ? -1 : idx); }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') { e.preventDefault(); setOpenIndex(Math.min(idx + 1, items.length - 1)); }
                  if (e.key === 'ArrowUp') { e.preventDefault(); setOpenIndex(Math.max(idx - 1, 0)); }
                }}
                className={cn(
                  "w-full flex items-center justify-between text-left font-medium transition-colors",
                  device === 'mobile' ? 'px-4 py-3 min-h-[44px] text-sm' : 'px-5 py-4 text-base',
                  isOpen ? "bg-slate-50 dark:bg-slate-800" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                )}
              >
                <span className="pr-4">{item.question || `Câu hỏi ${idx + 1}`}</span>
                <ChevronDown 
                  size={device === 'mobile' ? 16 : 18} 
                  className={cn("flex-shrink-0 transition-transform duration-200", isOpen && "rotate-180")} 
                  style={{ color: secondary }} 
                />
              </button>
              <div 
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className={cn(
                  "overflow-hidden transition-all duration-200",
                  isOpen ? "max-h-96" : "max-h-0"
                )}
              >
                <div className={cn(
                  "bg-slate-50 dark:bg-slate-800/50 border-t text-slate-600 dark:text-slate-300 leading-relaxed",
                  device === 'mobile' ? 'px-4 py-3 text-sm' : 'px-5 py-4'
                )} style={{ borderColor: `${secondary}15` }}>
                  {item.answer || 'Câu trả lời...'}
                </div>
              </div>
            </div>
          );
        })}
        {remainingCount > 0 && (
          <div className="flex items-center justify-center py-4">
            <span className="text-sm font-medium px-4 py-2 rounded-full" style={{ backgroundColor: `${secondary}10`, color: secondary }}>
              +{remainingCount} câu hỏi khác
            </span>
          </div>
        )}
      </div>
    </div>
  );

  // Style 2: Cards - with brandColor hover
  const renderCardsStyle = () => (
    <div className={cn("py-10 px-4", device === 'mobile' && 'py-6 px-3')}>
      <h3 className={cn("font-bold text-center mb-8 text-slate-900 dark:text-slate-100", device === 'mobile' ? 'text-lg mb-6' : 'text-2xl')}>Câu hỏi thường gặp</h3>
      <div className={cn("grid gap-4 max-w-5xl mx-auto", device === 'mobile' ? 'grid-cols-1 gap-3' : 'grid-cols-2')}>
        {visibleItems.slice(0, device === 'mobile' ? 4 : 6).map((item, idx) => (
          <div 
            key={item.id} 
            className="bg-white dark:bg-slate-800 rounded-xl transition-all cursor-pointer group"
            style={{ 
              border: `1px solid ${secondary}15`,
              padding: device === 'mobile' ? '14px' : '20px',
            }}
            onMouseEnter={(e) => { 
              e.currentTarget.style.borderColor = `${secondary}40`; 
              e.currentTarget.style.boxShadow = `0 4px 12px ${secondary}10`; 
            }}
            onMouseLeave={(e) => { 
              e.currentTarget.style.borderColor = `${secondary}15`; 
              e.currentTarget.style.boxShadow = 'none'; 
            }}
          >
            <div className="flex items-start gap-3">
              <div 
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
                style={{ backgroundColor: secondary }}
              >
                ?
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={cn("font-semibold text-slate-900 dark:text-slate-100 mb-2 line-clamp-2", device === 'mobile' ? 'text-sm' : 'text-base')}>
                  {item.question || `Câu hỏi ${idx + 1}`}
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {item.answer || 'Câu trả lời...'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      {remainingCount > 0 && (
        <div className="flex items-center justify-center mt-6">
          <span className="text-sm font-medium px-4 py-2 rounded-full" style={{ backgroundColor: `${secondary}10`, color: secondary }}>
            +{remainingCount} câu hỏi khác
          </span>
        </div>
      )}
    </div>
  );

  // Style 3: Two Column - with configurable CTA button
  const renderTwoColumnStyle = () => (
    <div className={cn("py-10 px-4", device === 'mobile' && 'py-6 px-3')}>
      <div className={cn("max-w-5xl mx-auto", device === 'mobile' ? 'space-y-6' : 'grid grid-cols-5 gap-10')}>
        <div className={cn(device === 'mobile' ? '' : 'col-span-2')}>
          <h3 className={cn("font-bold mb-3 text-slate-900 dark:text-slate-100", device === 'mobile' ? 'text-lg' : 'text-2xl')} style={{ color: secondary }}>
            Câu hỏi thường gặp
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
            {config?.description ?? 'Tìm câu trả lời cho các thắc mắc phổ biến của bạn'}
          </p>
          {config?.buttonText && (
            <a 
              href={config?.buttonLink ?? '#'}
              className={cn("inline-block rounded-lg text-white font-medium transition-all", device === 'mobile' ? 'px-4 py-2.5 text-sm min-h-[44px]' : 'px-5 py-2.5')}
              style={{ backgroundColor: brandColor, boxShadow: `0 4px 12px ${secondary}30` }}
            >
              {config.buttonText}
            </a>
          )}
        </div>
        <div className={cn("space-y-4", device === 'mobile' ? '' : 'col-span-3')}>
          {visibleItems.slice(0, device === 'mobile' ? 3 : 5).map((item, idx) => (
            <div key={item.id} className="pb-4" style={{ borderBottom: `1px solid ${secondary}15` }}>
              <h4 className={cn("font-semibold mb-2 text-slate-900 dark:text-slate-100", device === 'mobile' ? 'text-sm' : '')}>
                {item.question || `Câu hỏi ${idx + 1}`}
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                {item.answer || 'Câu trả lời...'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Style 4: Minimal - clean, simple, numbered
  const renderMinimalStyle = () => (
    <div className={cn("py-10 px-4", device === 'mobile' && 'py-6 px-3')}>
      <div className="max-w-3xl mx-auto">
        <h3 className={cn("font-bold mb-8 text-slate-900 dark:text-slate-100", device === 'mobile' ? 'text-lg mb-6' : 'text-2xl')}>
          Câu hỏi thường gặp
        </h3>
        <div className="space-y-6">
          {visibleItems.map((item, idx) => (
            <div key={item.id} className="flex gap-4">
              <span 
                className={cn("font-bold flex-shrink-0", device === 'mobile' ? 'text-lg' : 'text-xl')}
                style={{ color: secondary }}
              >
                {String(idx + 1).padStart(2, '0')}
              </span>
              <div className="flex-1">
                <h4 className={cn("font-semibold mb-2 text-slate-900 dark:text-slate-100", device === 'mobile' ? 'text-sm' : '')}>
                  {item.question || `Câu hỏi ${idx + 1}`}
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {item.answer || 'Câu trả lời...'}
                </p>
              </div>
            </div>
          ))}
        </div>
        {remainingCount > 0 && (
          <div className="mt-6 pt-4" style={{ borderTop: `1px solid ${secondary}15` }}>
            <span className="text-sm" style={{ color: secondary }}>+{remainingCount} câu hỏi khác</span>
          </div>
        )}
      </div>
    </div>
  );

  // Style 5: Timeline - vertical line connector
  const renderTimelineStyle = () => (
    <div className={cn("py-10 px-4", device === 'mobile' && 'py-6 px-3')}>
      <h3 className={cn("font-bold text-center mb-8 text-slate-900 dark:text-slate-100", device === 'mobile' ? 'text-lg mb-6' : 'text-2xl')}>
        Câu hỏi thường gặp
      </h3>
      <div className="max-w-3xl mx-auto relative">
        {/* Vertical line */}
        <div 
          className="absolute left-4 top-0 bottom-0 w-0.5"
          style={{ backgroundColor: `${secondary}20` }}
        />
        <div className="space-y-6">
          {visibleItems.map((item, idx) => (
            <div key={item.id} className="relative pl-12">
              {/* Dot */}
              <div 
                className="absolute left-2 top-1.5 w-5 h-5 rounded-full border-4 bg-white dark:bg-slate-900"
                style={{ borderColor: secondary }}
              />
              <div className={cn("rounded-xl p-4", device === 'mobile' && 'p-3')} style={{ backgroundColor: `${secondary}05` }}>
                <h4 className={cn("font-semibold mb-2 text-slate-900 dark:text-slate-100", device === 'mobile' ? 'text-sm' : '')}>
                  {item.question || `Câu hỏi ${idx + 1}`}
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {item.answer || 'Câu trả lời...'}
                </p>
              </div>
            </div>
          ))}
        </div>
        {remainingCount > 0 && (
          <div className="relative pl-12 mt-6">
            <div 
              className="absolute left-2 top-1.5 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${secondary}20` }}
            >
              <Plus size={12} style={{ color: secondary }} />
            </div>
            <span className="text-sm font-medium" style={{ color: secondary }}>+{remainingCount} câu hỏi khác</span>
          </div>
        )}
      </div>
    </div>
  );

  // Style 6: Tabbed - horizontal tabs navigation
  const renderTabbedStyle = () => (
    <div className={cn("py-10 px-4", device === 'mobile' && 'py-6 px-3')}>
      <h3 className={cn("font-bold text-center mb-6 text-slate-900 dark:text-slate-100", device === 'mobile' ? 'text-lg' : 'text-2xl')}>
        Câu hỏi thường gặp
      </h3>
      <div className="max-w-4xl mx-auto">
        {/* Tabs */}
        <div className={cn("flex gap-2 mb-6 overflow-x-auto pb-2", device === 'mobile' && 'gap-1')}>
          {visibleItems.slice(0, device === 'mobile' ? 3 : 5).map((item, idx) => (
            <button
              key={item.id}
              onClick={() =>{  setActiveTab(idx); }}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0",
                device === 'mobile' && 'px-3 py-1.5 text-xs min-h-[36px]',
                activeTab === idx ? 'text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              )}
              style={activeTab === idx ? { backgroundColor: secondary } : {}}
            >
              Q{idx + 1}
            </button>
          ))}
          {remainingCount > 0 && (
            <span className="px-3 py-2 text-xs text-slate-400 flex items-center">+{remainingCount}</span>
          )}
        </div>
        {/* Content */}
        <div 
          className="rounded-xl p-6"
          style={{ 
            backgroundColor: `${secondary}05`,
            border: `1px solid ${secondary}15`
          }}
        >
          {visibleItems[activeTab] && (
            <>
              <h4 className={cn("font-semibold mb-3 text-slate-900 dark:text-slate-100", device === 'mobile' ? 'text-base' : 'text-lg')}>
                {visibleItems[activeTab].question || `Câu hỏi ${activeTab + 1}`}
              </h4>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {visibleItems[activeTab].answer || 'Câu trả lời...'}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <PreviewWrapper title="Preview FAQ" device={device} setDevice={setDevice} previewStyle={previewStyle} setPreviewStyle={setPreviewStyle} styles={styles} info={`${items.length} câu hỏi`}>
      <BrowserFrame url="yoursite.com/faq">
        {previewStyle === 'accordion' && renderAccordionStyle()}
        {previewStyle === 'cards' && renderCardsStyle()}
        {previewStyle === 'two-column' && renderTwoColumnStyle()}
        {previewStyle === 'minimal' && renderMinimalStyle()}
        {previewStyle === 'timeline' && renderTimelineStyle()}
        {previewStyle === 'tabbed' && renderTabbedStyle()}
      </BrowserFrame>
    </PreviewWrapper>
  );
};

// ============ TESTIMONIALS PREVIEW ============
interface TestimonialItem { id: number; name: string; role: string; content: string; avatar: string; rating: number }
// ============ TESTIMONIALS PREVIEW ============
// 6 Professional Styles following Best Practices:
// - Authenticity: Real customer info (name, role, company)
// - Credibility indicators: Star ratings, avatar, verification
// - Diverse formats: Cards, Slider, Masonry, Quote, Carousel, Minimal
// - Mobile responsive with proper touch targets
export type TestimonialsStyle = 'cards' | 'slider' | 'masonry' | 'quote' | 'carousel' | 'minimal';
export const TestimonialsPreview = ({ items, brandColor, secondary, selectedStyle, onStyleChange }: { items: TestimonialItem[]; brandColor: string;
  secondary: string; selectedStyle?: TestimonialsStyle; onStyleChange?: (style: TestimonialsStyle) => void }) => {
  const [device, setDevice] = useState<PreviewDevice>('desktop');
  const previewStyle = selectedStyle ?? 'cards';
  const setPreviewStyle = (s: string) => onStyleChange?.(s as TestimonialsStyle);
  const [currentSlide, setCurrentSlide] = useState(0);
  const styles = [
    { id: 'cards', label: 'Cards' }, 
    { id: 'slider', label: 'Slider' }, 
    { id: 'masonry', label: 'Masonry' },
    { id: 'quote', label: 'Quote' },
    { id: 'carousel', label: 'Carousel' },
    { id: 'minimal', label: 'Minimal' }
  ];

  const renderStars = (rating: number, size: number = 12) => (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(star => (<Star key={star} size={size} className={star <= rating ? "text-yellow-400 fill-yellow-400" : "text-slate-300"} />))}
    </div>
  );

  // Helper: Get visible items with +N pattern
  const getVisibleItems = (maxVisible: number) => {
    const visible = items.slice(0, maxVisible);
    const remaining = items.length - maxVisible;
    return { remaining, visible };
  };

  // Empty State
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: `${secondary}10` }}>
        <Star size={32} style={{ color: secondary }} />
      </div>
      <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1">Chưa có đánh giá nào</h3>
      <p className="text-sm text-slate-500">Thêm đánh giá đầu tiên để bắt đầu</p>
    </div>
  );

  // Style 1: Cards - Grid layout with equal height
  const renderCardsStyle = () => {
    if (items.length === 0) {return renderEmptyState();}
    const maxVisible = device === 'mobile' ? 2 : (device === 'tablet' ? 4 : 6);
    const { visible, remaining } = getVisibleItems(maxVisible);
    
    // Centered layout for 1-2 items
    const gridClass = items.length === 1 
      ? 'max-w-md mx-auto' 
      : (items.length === 2 
        ? 'max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4'
        : cn("grid gap-4", device === 'mobile' ? 'grid-cols-1' : (device === 'tablet' ? 'grid-cols-2' : 'grid-cols-3')));
    
    return (
      <div className={cn("py-8 px-4", device === 'mobile' ? 'py-6' : '')}>
        <h3 className={cn("font-bold text-center mb-6", device === 'mobile' ? 'text-lg' : 'text-xl')}>Khách hàng nói gì về chúng tôi</h3>
        <div className={gridClass}>
          {visible.map((item) => (
            <div key={item.id} className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col h-full">
              {renderStars(item.rating)}
              <p className="my-3 text-slate-600 dark:text-slate-300 line-clamp-3 text-sm flex-1 min-h-[3.5rem]">“{item.content || 'Nội dung đánh giá...'}”</p>
              <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-700 mt-auto">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ backgroundColor: brandColor }}>{(item.name || 'U')[0]}</div>
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{item.name || 'Tên khách hàng'}</div>
                  <div className="text-xs text-slate-500 truncate">{item.role || 'Chức vụ'}</div>
                </div>
              </div>
            </div>
          ))}
          {remaining > 0 && (
            <div className="flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl aspect-square border-2 border-dashed border-slate-300 dark:border-slate-600">
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: secondary }}>+{remaining}</div>
                <p className="text-xs text-slate-500 mt-1">đánh giá khác</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Style 2: Slider - Single testimonial with navigation
  const renderSliderStyle = () => {
    if (items.length === 0) {return renderEmptyState();}
    const current = items[currentSlide] || items[0];
    return (
      <div className={cn("py-12 px-4 relative overflow-hidden", device === 'mobile' ? 'py-8' : '')}>
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[120px] leading-none font-serif opacity-5 pointer-events-none select-none" style={{ color: secondary }}>“</div>
        <div className="max-w-6xl mx-auto relative">
          <div className={cn("bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center relative", device === 'mobile' ? 'p-5' : '')} style={{ borderTop: `4px solid ${secondary}` }}>
            <div className="flex justify-center mb-4">{renderStars(current?.rating || 5, 16)}</div>
            <p className={cn("text-slate-700 dark:text-slate-200 leading-relaxed mb-6", device === 'mobile' ? 'text-base' : 'text-lg')}>“{current?.content || 'Nội dung đánh giá...'}”</p>
            <div className="flex items-center justify-center gap-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg flex-shrink-0" style={{ backgroundColor: brandColor }}>{(current?.name || 'U')[0]}</div>
              <div className="text-left">
                <div className="font-semibold text-slate-900 dark:text-white">{current?.name || 'Tên khách hàng'}</div>
                <div className="text-sm text-slate-500">{current?.role || 'Chức vụ'}</div>
              </div>
            </div>
          </div>
          {items.length > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button type="button" onClick={() =>{  setCurrentSlide(prev => prev === 0 ? items.length - 1 : prev - 1); }} className="w-10 h-10 min-h-[44px] rounded-full bg-white dark:bg-slate-800 shadow-md flex items-center justify-center hover:scale-105 transition-transform"><ChevronLeft size={18} /></button>
              <div className="flex gap-2">
                {items.map((_, idx) => (<button key={idx} type="button" onClick={() =>{  setCurrentSlide(idx); }} className={cn("w-2.5 h-2.5 rounded-full transition-all", idx === currentSlide ? "w-8" : "bg-slate-300")} style={idx === currentSlide ? { backgroundColor: secondary } : {}} />))}
              </div>
              <button type="button" onClick={() =>{  setCurrentSlide(prev => (prev + 1) % items.length); }} className="w-10 h-10 min-h-[44px] rounded-full bg-white dark:bg-slate-800 shadow-md flex items-center justify-center hover:scale-105 transition-transform"><ChevronRight size={18} /></button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Style 3: Masonry - Pinterest-like layout
  const renderMasonryStyle = () => {
    if (items.length === 0) {return renderEmptyState();}
    const maxVisible = device === 'mobile' ? 3 : 6;
    const { visible, remaining } = getVisibleItems(maxVisible);
    
    return (
      <div className={cn("py-8 px-4", device === 'mobile' ? 'py-6' : '')}>
        <h3 className={cn("font-bold text-center mb-6", device === 'mobile' ? 'text-lg' : 'text-xl')}>Khách hàng nói gì về chúng tôi</h3>
        <div className={cn("columns-1 gap-4", device === 'tablet' && 'columns-2', device === 'desktop' && 'columns-3')}>
          {visible.map((item, idx) => (
            <div key={item.id} className={cn("break-inside-avoid mb-4 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700", idx % 2 === 0 ? '' : 'pt-6')}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: brandColor }}>{(item.name || 'U')[0]}</div>
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{item.name || 'Tên'}</div>
                  <div className="text-xs text-slate-500 truncate">{item.role || 'Chức vụ'}</div>
                </div>
              </div>
              {renderStars(item.rating)}
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">“{item.content || 'Nội dung...'}”</p>
            </div>
          ))}
        </div>
        {remaining > 0 && (
          <div className="text-center mt-4">
            <span className="text-sm font-medium" style={{ color: secondary }}>+{remaining} đánh giá khác</span>
          </div>
        )}
      </div>
    );
  };

  // Style 4: Quote - Big quote focused, elegant typography
  const renderQuoteStyle = () => {
    if (items.length === 0) {return renderEmptyState();}
    const current = items[currentSlide] || items[0];
    
    return (
      <div className={cn("py-12 px-4", device === 'mobile' ? 'py-8' : '')} style={{ backgroundColor: `${secondary}05` }}>
        <div className="max-w-4xl mx-auto text-center">
          {/* Large quote mark */}
          <div className="text-[80px] md:text-[120px] leading-none font-serif mb-[-30px] md:mb-[-50px] select-none" style={{ color: secondary }}>“</div>
          
          <blockquote className={cn("text-slate-800 dark:text-slate-200 leading-relaxed font-medium italic", device === 'mobile' ? 'text-lg' : 'text-xl md:text-2xl')}>
            {current?.content || 'Nội dung đánh giá...'}
          </blockquote>
          
          <div className="mt-8 flex flex-col items-center gap-3">
            <div className="flex justify-center">{renderStars(current?.rating || 5, 18)}</div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: brandColor }}>
                {(current?.name || 'U')[0]}
              </div>
              <div className="text-left">
                <div className="font-semibold text-slate-900 dark:text-white">{current?.name || 'Tên khách hàng'}</div>
                <div className="text-sm text-slate-500">{current?.role || 'Chức vụ'}</div>
              </div>
            </div>
          </div>
          
          {items.length > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {items.map((_, idx) => (
                <button 
                  key={idx} 
                  type="button" 
                  onClick={() =>{  setCurrentSlide(idx); }} 
                  className={cn("w-3 h-3 rounded-full transition-all", idx === currentSlide ? "" : "bg-slate-300 hover:bg-slate-400")}
                  style={idx === currentSlide ? { backgroundColor: secondary } : {}}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Style 5: Carousel - Horizontal scroll cards
  const renderCarouselStyle = () => {
    if (items.length === 0) {return renderEmptyState();}
    
    return (
      <div className={cn("py-8", device === 'mobile' ? 'py-6' : '')}>
        <h3 className={cn("font-bold text-center mb-6 px-4", device === 'mobile' ? 'text-lg' : 'text-xl')}>Khách hàng nói gì về chúng tôi</h3>
        
        <div className="relative">
          {/* Scroll container */}
          <div className="flex gap-4 overflow-x-auto px-4 pb-4 snap-x snap-mandatory scrollbar-hide" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
            {items.map((item) => (
              <div 
                key={item.id} 
                className={cn(
                  "flex-shrink-0 snap-center bg-white dark:bg-slate-800 rounded-xl p-5 shadow-md border flex flex-col",
                  device === 'mobile' ? 'w-[280px]' : 'w-[320px]'
                )}
                style={{ borderColor: `${secondary}15` }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{ backgroundColor: brandColor }}>
                    {(item.name || 'U')[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{item.name || 'Tên khách hàng'}</div>
                    <div className="text-xs text-slate-500 truncate">{item.role || 'Chức vụ'}</div>
                  </div>
                </div>
                {renderStars(item.rating, 14)}
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 line-clamp-4 flex-1">“{item.content || 'Nội dung đánh giá...'}”</p>
              </div>
            ))}
          </div>
          
          {/* Scroll indicators */}
          {items.length > 2 && (
            <div className="flex justify-center gap-1.5 mt-4">
              {items.map((_, idx) => (
                <div 
                  key={idx} 
                  className="w-1.5 h-1.5 rounded-full bg-slate-300"
                  style={idx === 0 ? { backgroundColor: secondary } : {}}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Style 6: Minimal - Clean list with accent line
  const renderMinimalStyle = () => {
    if (items.length === 0) {return renderEmptyState();}
    const maxVisible = device === 'mobile' ? 3 : 4;
    const { visible, remaining } = getVisibleItems(maxVisible);
    
    return (
      <div className={cn("py-8 px-4", device === 'mobile' ? 'py-6' : '')}>
        <h3 className={cn("font-bold text-center mb-6", device === 'mobile' ? 'text-lg' : 'text-xl')}>Khách hàng nói gì về chúng tôi</h3>
        <div className="max-w-3xl mx-auto space-y-4">
          {visible.map((item) => (
            <div 
              key={item.id} 
              className="flex gap-4 p-4 rounded-lg bg-white dark:bg-slate-800 border-l-4 shadow-sm"
              style={{ borderLeftColor: secondary }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ backgroundColor: brandColor }}>
                {(item.name || 'U')[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-medium text-sm">{item.name || 'Tên khách hàng'}</span>
                  <span className="text-xs text-slate-500">•</span>
                  <span className="text-xs text-slate-500 truncate">{item.role || 'Chức vụ'}</span>
                  <div className="ml-auto">{renderStars(item.rating, 10)}</div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">“{item.content || 'Nội dung...'}”</p>
              </div>
            </div>
          ))}
          {remaining > 0 && (
            <div className="text-center pt-2">
              <button type="button" className="text-sm font-medium px-4 py-2 rounded-lg transition-colors" style={{ backgroundColor: `${secondary}10`, color: secondary }}>
                Xem thêm {remaining} đánh giá
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <PreviewWrapper title="Preview Testimonials" device={device} setDevice={setDevice} previewStyle={previewStyle} setPreviewStyle={setPreviewStyle} styles={styles} info={`${items.length} đánh giá`}>
      <BrowserFrame>
        {previewStyle === 'cards' && renderCardsStyle()}
        {previewStyle === 'slider' && renderSliderStyle()}
        {previewStyle === 'masonry' && renderMasonryStyle()}
        {previewStyle === 'quote' && renderQuoteStyle()}
        {previewStyle === 'carousel' && renderCarouselStyle()}
        {previewStyle === 'minimal' && renderMinimalStyle()}
      </BrowserFrame>
    </PreviewWrapper>
  );
};

// ============ PRICING PREVIEW ============
// 6 Styles: cards, horizontal, minimal, comparison, featured, compact
// Best Practices: Monthly/Yearly toggle, highlight popular, feature comparison, CTA hierarchy
interface PricingPlan { 
  id: number; 
  name: string; 
  price: string; 
  yearlyPrice?: string;
  period: string; 
  features: string[]; 
  isPopular: boolean; 
  buttonText: string; 
  buttonLink: string;
}
export interface PricingConfig {
  subtitle?: string;
  showBillingToggle?: boolean;
  monthlyLabel?: string;
  yearlyLabel?: string;
  yearlySavingText?: string;
}
export type PricingStyle = 'cards' | 'horizontal' | 'minimal' | 'comparison' | 'featured' | 'compact';

export const PricingPreview = ({ 
  plans, 
  brandColor, 
  secondary,
  selectedStyle, 
  onStyleChange,
  config 
}: { 
  plans: PricingPlan[]; 
  brandColor: string;
  secondary: string; 
  selectedStyle?: PricingStyle; 
  onStyleChange?: (style: PricingStyle) => void;
  config?: PricingConfig;
}) => {
  const [device, setDevice] = useState<PreviewDevice>('desktop');
  const [isYearly, setIsYearly] = useState(false);
  const previewStyle = selectedStyle ?? 'cards';
  const setPreviewStyle = (s: string) => onStyleChange?.(s as PricingStyle);
  
  const styles = [
    { id: 'cards', label: 'Cards' }, 
    { id: 'horizontal', label: 'Ngang' }, 
    { id: 'minimal', label: 'Minimal' },
    { id: 'comparison', label: 'So sánh' },
    { id: 'featured', label: 'Nổi bật' },
    { id: 'compact', label: 'Gọn' }
  ];

  // Config defaults
  const subtitle = config?.subtitle ?? 'Chọn gói phù hợp với nhu cầu của bạn';
  const showBillingToggle = config?.showBillingToggle ?? true;
  const monthlyLabel = config?.monthlyLabel ?? 'Hàng tháng';
  const yearlyLabel = config?.yearlyLabel ?? 'Hàng năm';
  const yearlySavingText = config?.yearlySavingText ?? 'Tiết kiệm 17%';

  // Get display price based on billing period
  const getPrice = (plan: PricingPlan) => {
    if (isYearly && plan.yearlyPrice) {return plan.yearlyPrice;}
    return plan.price || '0';
  };
  const getPeriod = () => isYearly ? '/năm' : '/tháng';

  // Empty state
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: `${secondary}10` }}>
        <Tag size={32} style={{ color: secondary }} />
      </div>
      <p className="text-sm font-medium">Chưa có gói nào</p>
      <p className="text-xs mt-1">Thêm gói để xem preview</p>
    </div>
  );

  // Billing Toggle Component (ARIA accessible)
  const BillingToggle = () => showBillingToggle ? (
    <div className="flex items-center justify-center gap-3 mb-6">
      <span className={cn("text-sm font-medium transition-colors", !isYearly ? 'text-slate-900 dark:text-white' : 'text-slate-400')}>
        {monthlyLabel}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={isYearly}
        onClick={() =>{  setIsYearly(!isYearly); }}
        className={cn(
          "relative w-12 h-6 rounded-full transition-colors",
          isYearly ? '' : 'bg-slate-200 dark:bg-slate-700'
        )}
        style={isYearly ? { backgroundColor: brandColor } : {}}
      >
        <span className={cn(
          "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm",
          isYearly ? 'translate-x-7' : 'translate-x-1'
        )} />
      </button>
      <span className={cn("text-sm font-medium transition-colors", isYearly ? 'text-slate-900 dark:text-white' : 'text-slate-400')}>
        {yearlyLabel}
      </span>
      {isYearly && yearlySavingText && (
        <BrandBadge text={yearlySavingText} variant="solid" brandColor={brandColor} secondary={secondary} />
      )}
    </div>
  ) : null;

  // Centered layout helper for few items
  const getGridClass = (count: number) => {
    if (device === 'mobile') {return 'grid-cols-1';}
    if (device === 'tablet') {return count <= 2 ? 'grid-cols-2' : 'grid-cols-2';}
    if (count === 1) {return 'grid-cols-1 max-w-md mx-auto';}
    if (count === 2) {return 'grid-cols-2 max-w-2xl mx-auto';}
    return 'grid-cols-3';
  };

  // Style 1: Cards - Classic pricing cards with feature list
  const renderCardsStyle = () => {
    if (plans.length === 0) {return renderEmptyState();}
    const displayPlans = plans.slice(0, 6);
    return (
      <div className={cn("py-8 px-4", device === 'mobile' ? 'py-6' : '')}>
        <h3 className={cn("font-bold text-center mb-2", device === 'mobile' ? 'text-lg' : 'text-xl')}>Bảng giá dịch vụ</h3>
        <p className="text-center text-sm text-slate-500 mb-4">{subtitle}</p>
        <BillingToggle />
        <div className={cn("grid gap-4", getGridClass(displayPlans.length))}>
          {displayPlans.map((plan) => (
            <div 
              key={plan.id} 
              className={cn(
                "bg-white dark:bg-slate-800 rounded-xl border-2 relative flex flex-col h-full",
                device === 'mobile' ? 'p-4' : 'p-5',
                plan.isPopular ? "shadow-lg" : ""
              )} 
              style={{ 
                borderColor: plan.isPopular ? brandColor : '#e2e8f0',
                transform: plan.isPopular && device === 'desktop' ? 'scale(1.02)' : undefined
              }}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <BrandBadge text="Phổ biến" variant="solid" brandColor={brandColor} secondary={secondary} />
                </div>
              )}
              <h4 className="font-semibold text-center line-clamp-1">{plan.name || 'Tên gói'}</h4>
              <div className="text-center my-4">
                <span className={cn("font-bold tabular-nums", device === 'mobile' ? 'text-2xl' : 'text-3xl')} style={{ color: secondary }}>
                  {getPrice(plan)}đ
                </span>
                <span className="text-sm text-slate-500">{getPeriod()}</span>
              </div>
              <ul className="space-y-2 mb-4 flex-1 min-h-[80px]">
                {(plan.features.length > 0 ? plan.features : ['Tính năng 1', 'Tính năng 2']).slice(0, 5).map((f, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <CheckIcon secondary={secondary} brandColor={brandColor} variant="minimal" size={14} className="mt-0.5" />
                    <span className="line-clamp-1">{f}</span>
                  </li>
                ))}
              </ul>
              <button 
                className={cn("w-full py-2.5 rounded-lg font-medium text-sm transition-opacity hover:opacity-90", plan.isPopular ? "text-white" : "border-2")} 
                style={plan.isPopular ? { backgroundColor: brandColor } : { borderColor: secondary, color: secondary }}
              >
                {plan.buttonText || 'Chọn gói'}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Style 2: Horizontal - Compact horizontal rows
  const renderHorizontalStyle = () => {
    if (plans.length === 0) {return renderEmptyState();}
    return (
      <div className={cn("py-8 px-4", device === 'mobile' ? 'py-6' : '')}>
        <h3 className={cn("font-bold text-center mb-2", device === 'mobile' ? 'text-lg' : 'text-xl')}>Bảng giá dịch vụ</h3>
        <p className="text-center text-sm text-slate-500 mb-4">{subtitle}</p>
        <BillingToggle />
        <div className="space-y-3 max-w-3xl mx-auto">
          {plans.slice(0, 5).map((plan) => (
            <div 
              key={plan.id} 
              className={cn(
                "bg-white dark:bg-slate-800 rounded-xl p-4 border-2 flex items-center justify-between transition-all",
                device === 'mobile' ? 'flex-col gap-3 text-center' : ''
              )} 
              style={{ borderColor: plan.isPopular ? brandColor : '#e2e8f0' }}
            >
              <div className={cn(device === 'mobile' ? '' : 'flex items-center gap-3 min-w-0 flex-1')}>
                <h4 className="font-semibold truncate">{plan.name || 'Tên gói'}</h4>
                {plan.isPopular && (
                  <BrandBadge text="Hot" variant="solid" brandColor={brandColor} secondary={secondary} />
                )}
              </div>
              <div className={cn("text-sm text-slate-500 truncate", device === 'mobile' ? '' : 'flex-1 text-center')}>
                {(plan.features.length > 0 ? plan.features : ['Tính năng']).slice(0, 2).join(' • ')}
              </div>
              <div className={cn("flex items-center gap-4", device === 'mobile' ? 'flex-col gap-2' : 'flex-shrink-0')}>
                <span className="font-bold text-lg tabular-nums whitespace-nowrap" style={{ color: secondary }}>
                  {getPrice(plan)}đ<span className="text-sm font-normal text-slate-500">{getPeriod()}</span>
                </span>
                <button className="px-4 py-2 rounded-lg text-sm text-white font-medium whitespace-nowrap" style={{ backgroundColor: brandColor }}>
                  {plan.buttonText || 'Chọn'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Style 3: Minimal - Clean list style
  const renderMinimalStyle = () => {
    if (plans.length === 0) {return renderEmptyState();}
    return (
      <div className={cn("py-10 px-4", device === 'mobile' ? 'py-6' : '')}>
        <h3 className={cn("font-bold text-center mb-2", device === 'mobile' ? 'text-lg' : 'text-xl')}>Bảng giá dịch vụ</h3>
        <p className="text-center text-sm text-slate-500 mb-4">{subtitle}</p>
        <BillingToggle />
        <div className={cn("max-w-3xl mx-auto", device === 'mobile' ? '' : 'border rounded-2xl overflow-hidden')}>
          {plans.slice(0, 5).map((plan, idx) => (
            <div 
              key={plan.id} 
              className={cn(
                "flex items-center gap-4 p-5 bg-white dark:bg-slate-800 transition-all relative",
                device === 'mobile' ? 'flex-col text-center rounded-xl border mb-3' : '',
                device !== 'mobile' && idx !== Math.min(plans.length, 5) - 1 && 'border-b'
              )} 
              style={plan.isPopular ? { backgroundColor: `${secondary}08` } : {}}
            >
              {plan.isPopular && (
                <div 
                  className={cn(
                    "absolute",
                    device === 'mobile' ? '-top-2 left-1/2 -translate-x-1/2' : 'top-3 right-4'
                  )} 
                >
                  <BrandBadge text="Phổ biến" variant="solid" brandColor={brandColor} secondary={secondary} />
                </div>
              )}
              <div className={cn("flex-1 min-w-0", device === 'mobile' ? 'pt-2' : '')}>
                <h4 className="font-semibold text-base truncate">{plan.name || 'Tên gói'}</h4>
                <div className="text-xs text-slate-500 truncate">
                  {(plan.features.length > 0 ? plan.features : ['Tính năng']).slice(0, 2).join(' • ')}
                </div>
              </div>
              <div className={cn("flex items-center gap-4", device === 'mobile' ? 'flex-col gap-3 mt-3' : '')}>
                <span className="text-2xl font-bold tabular-nums whitespace-nowrap" style={{ color: secondary }}>
                  {getPrice(plan)}đ<span className="text-sm text-slate-500">{getPeriod()}</span>
                </span>
                <button 
                  className={cn("px-5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap", plan.isPopular ? "text-white shadow-md" : "border-2")} 
                  style={plan.isPopular ? { backgroundColor: brandColor } : { borderColor: secondary, color: secondary }}
                >
                  {plan.buttonText || 'Chọn gói'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Style 4: Comparison - Feature comparison table
  const renderComparisonStyle = () => {
    if (plans.length === 0) {return renderEmptyState();}
    const displayPlans = plans.slice(0, device === 'mobile' ? 2 : 4);
    const allFeatures = [...new Set(displayPlans.flatMap(p => p.features))].slice(0, 8);
    
    return (
      <div className={cn("py-8 px-4", device === 'mobile' ? 'py-6 px-2' : '')}>
        <h3 className={cn("font-bold text-center mb-2", device === 'mobile' ? 'text-lg' : 'text-xl')}>So sánh các gói</h3>
        <p className="text-center text-sm text-slate-500 mb-4">{subtitle}</p>
        <BillingToggle />
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-3 text-left text-sm font-medium text-slate-500 border-b">Tính năng</th>
                {displayPlans.map((plan) => (
                  <th 
                    key={plan.id} 
                    className={cn("p-3 text-center border-b min-w-[120px]", device === 'mobile' ? 'text-xs' : 'text-sm')}
                    style={plan.isPopular ? { backgroundColor: `${secondary}08` } : {}}
                  >
                    <div className="font-semibold">{plan.name || 'Gói'}</div>
                    <div className="font-bold mt-1" style={{ color: secondary }}>
                      {getPrice(plan)}đ
                    </div>
                    {plan.isPopular && (
                      <div className="flex justify-center mt-1">
                        <BrandBadge text="Khuyên dùng" variant="solid" brandColor={brandColor} secondary={secondary} />
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allFeatures.map((feature, fIdx) => (
                <tr key={fIdx} className={fIdx % 2 === 0 ? 'bg-slate-50 dark:bg-slate-800/50' : ''}>
                  <td className="p-3 text-sm border-b">{feature}</td>
                  {displayPlans.map((plan) => (
                    <td 
                      key={plan.id} 
                      className="p-3 text-center border-b"
                      style={plan.isPopular ? { backgroundColor: `${secondary}05` } : {}}
                    >
                      {plan.features.includes(feature) ? (
                        <CheckIcon secondary={secondary} brandColor={brandColor} variant="minimal" size={16} className="mx-auto" />
                      ) : (
                        <X size={18} className="mx-auto text-slate-300" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="p-3"></td>
                {displayPlans.map((plan) => (
                  <td key={plan.id} className="p-3 text-center" style={plan.isPopular ? { backgroundColor: `${secondary}08` } : {}}>
                    <button 
                      className={cn("px-4 py-2 rounded-lg text-sm font-medium w-full", plan.isPopular ? "text-white" : "border-2")} 
                      style={plan.isPopular ? { backgroundColor: brandColor } : { borderColor: secondary, color: secondary }}
                    >
                      {plan.buttonText || 'Chọn'}
                    </button>
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  };

  // Style 5: Featured - One plan highlighted large
  const renderFeaturedStyle = () => {
    if (plans.length === 0) {return renderEmptyState();}
    const popularPlan = plans.find(p => p.isPopular) ?? plans[0];
    const otherPlans = plans.filter(p => p.id !== popularPlan.id).slice(0, 2);
    
    return (
      <div className={cn("py-8 px-4", device === 'mobile' ? 'py-6' : '')}>
        <h3 className={cn("font-bold text-center mb-2", device === 'mobile' ? 'text-lg' : 'text-xl')}>Bảng giá dịch vụ</h3>
        <p className="text-center text-sm text-slate-500 mb-4">{subtitle}</p>
        <BillingToggle />
        
        <div className={cn("max-w-4xl mx-auto", device === 'mobile' ? '' : 'flex gap-6 items-stretch')}>
          {/* Featured Plan */}
          <div 
            className={cn(
              "bg-white dark:bg-slate-800 rounded-2xl border-2 relative flex flex-col",
              device === 'mobile' ? 'p-5 mb-4' : 'p-8 flex-1'
            )}
            style={{ 
              borderColor: secondary,
              boxShadow: `0 8px 30px ${secondary}20`
            }}
          >
            <div 
              className="absolute -top-3 left-1/2 -translate-x-1/2"
            >
              <BrandBadge text="★ Phổ biến nhất" variant="solid" brandColor={brandColor} secondary={secondary} />
            </div>
            <h4 className={cn("font-bold text-center", device === 'mobile' ? 'text-lg mt-2' : 'text-xl mt-4')}>
              {popularPlan.name || 'Gói phổ biến'}
            </h4>
            <div className="text-center my-6">
              <span className={cn("font-bold tabular-nums", device === 'mobile' ? 'text-3xl' : 'text-4xl')} style={{ color: secondary }}>
                {getPrice(popularPlan)}đ
              </span>
              <span className="text-slate-500">{getPeriod()}</span>
            </div>
            <ul className="space-y-3 mb-6 flex-1">
              {(popularPlan.features.length > 0 ? popularPlan.features : ['Tính năng 1', 'Tính năng 2', 'Tính năng 3']).slice(0, 6).map((f, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckIcon secondary={secondary} brandColor={brandColor} variant="minimal" size={16} className="mt-0.5" />
                  <span className="line-clamp-1">{f}</span>
                </li>
              ))}
            </ul>
            <button 
              className="w-full py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: brandColor, boxShadow: `0 4px 12px ${secondary}40` }}
            >
              {popularPlan.buttonText || 'Bắt đầu ngay'}
            </button>
          </div>

          {/* Other Plans */}
          {otherPlans.length > 0 && (
            <div className={cn("flex gap-4", device === 'mobile' ? 'flex-col' : 'flex-col justify-center w-64')}>
              {otherPlans.map((plan) => (
                <div 
                  key={plan.id}
                  className="bg-white dark:bg-slate-800 rounded-xl border p-4 flex flex-col"
                  style={{ borderColor: `${secondary}20` }}
                >
                  <h5 className="font-semibold text-sm">{plan.name || 'Gói'}</h5>
                  <div className="my-2">
                    <span className="font-bold text-lg tabular-nums" style={{ color: secondary }}>
                      {getPrice(plan)}đ
                    </span>
                    <span className="text-xs text-slate-500">{getPeriod()}</span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 flex-1 mb-3">
                    {plan.features.slice(0, 2).join(', ') || 'Các tính năng cơ bản'}
                  </p>
                  <button 
                    className="w-full py-2 rounded-lg text-sm font-medium border-2"
                    style={{ borderColor: secondary, color: secondary }}
                  >
                    {plan.buttonText || 'Chọn'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Style 6: Compact - Small dense cards
  const renderCompactStyle = () => {
    if (plans.length === 0) {return renderEmptyState();}
    const displayPlans = plans.slice(0, device === 'mobile' ? 4 : 6);
    
    return (
      <div className={cn("py-8 px-4", device === 'mobile' ? 'py-6' : '')}>
        <h3 className={cn("font-bold text-center mb-2", device === 'mobile' ? 'text-lg' : 'text-xl')}>Bảng giá dịch vụ</h3>
        <p className="text-center text-sm text-slate-500 mb-4">{subtitle}</p>
        <BillingToggle />
        
        <div className={cn(
          "grid gap-3",
          device === 'mobile' ? 'grid-cols-2' : (device === 'tablet' ? 'grid-cols-3' : 'grid-cols-3 max-w-3xl mx-auto')
        )}>
          {displayPlans.map((plan) => (
            <div 
              key={plan.id}
              className={cn(
                "bg-white dark:bg-slate-800 rounded-lg border-2 p-3 relative flex flex-col text-center",
                plan.isPopular && "ring-2 ring-offset-2"
              )}
              style={{ 
                borderColor: plan.isPopular ? brandColor : '#e2e8f0',
                ...(plan.isPopular && { ringColor: secondary })
              }}
            >
              {plan.isPopular && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                  <BrandBadge text="HOT" variant="solid" brandColor={brandColor} secondary={secondary} />
                </div>
              )}
              <h5 className="font-semibold text-sm truncate mt-1">{plan.name || 'Gói'}</h5>
              <div className="my-2">
                <span className={cn("font-bold tabular-nums", device === 'mobile' ? 'text-lg' : 'text-xl')} style={{ color: secondary }}>
                  {getPrice(plan)}đ
                </span>
                <span className="text-[10px] text-slate-500 block">{getPeriod()}</span>
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-2 min-h-[2rem] mb-2">
                {plan.features.slice(0, 2).join(', ') || 'Tính năng cơ bản'}
              </p>
              <button 
                className={cn(
                  "w-full py-1.5 rounded text-xs font-medium mt-auto",
                  plan.isPopular ? "text-white" : "border"
                )}
                style={plan.isPopular ? { backgroundColor: brandColor } : { borderColor: secondary, color: secondary }}
              >
                {plan.buttonText || 'Chọn'}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Style hints for each style
  const getStyleHint = () => {
    const hints: Record<PricingStyle, string> = {
      cards: 'Classic cards với feature list đầy đủ, phù hợp 2-4 gói',
      compact: 'Cards nhỏ gọn, phù hợp sidebar hoặc nhiều gói',
      comparison: 'Bảng so sánh tính năng chi tiết giữa các gói',
      featured: 'Highlight 1 gói phổ biến, các gói khác nhỏ hơn',
      horizontal: 'Dạng hàng ngang gọn, phù hợp hiển thị nhiều gói',
      minimal: 'Tối giản dạng list, phù hợp trang đơn giản'
    };
    return hints[previewStyle];
  };

  return (
    <PreviewWrapper 
      title="Preview Pricing" 
      device={device} 
      setDevice={setDevice} 
      previewStyle={previewStyle} 
      setPreviewStyle={setPreviewStyle} 
      styles={styles} 
      info={`${plans.length} gói • ${getStyleHint()}`}
    >
      <BrowserFrame url="yoursite.com/pricing">
        {previewStyle === 'cards' && renderCardsStyle()}
        {previewStyle === 'horizontal' && renderHorizontalStyle()}
        {previewStyle === 'minimal' && renderMinimalStyle()}
        {previewStyle === 'comparison' && renderComparisonStyle()}
        {previewStyle === 'featured' && renderFeaturedStyle()}
        {previewStyle === 'compact' && renderCompactStyle()}
      </BrowserFrame>
    </PreviewWrapper>
  );
};

// ============ SERVICES/BENEFITS PREVIEW ============
// Professional Services UI/UX - 6 Variants: Elegant Grid, Modern List, Big Number, Cards, Carousel, Timeline
interface ServiceItem { id: number; icon: string; title: string; description: string }
export type ServicesStyle = 'elegantGrid' | 'modernList' | 'bigNumber' | 'cards' | 'carousel' | 'timeline';

// Dynamic Icon component for Services
const ServiceIcon = ({ name, size = 24, className, style }: { name: string; size?: number; className?: string; style?: React.CSSProperties }) => {
  const icons: Record<string, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
    Briefcase, Building2, Check, Clock, Cpu, FileText, Globe, HelpCircle, Layers, Mail, MapPin, Package, Phone, Rocket, Settings, Shield, Star, Target, Users, Zap
  };
  const IconComponent = icons[name] || Star;
  return <IconComponent size={size} className={className} style={style} />;
};

export const ServicesPreview = ({ items, brandColor, secondary, componentType, selectedStyle, onStyleChange }: { items: ServiceItem[]; brandColor: string;
  secondary: string; componentType: 'Services' | 'Benefits'; selectedStyle?: ServicesStyle; onStyleChange?: (style: ServicesStyle) => void }) => {
  const [device, setDevice] = useState<PreviewDevice>('desktop');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const previewStyle = selectedStyle ?? 'elegantGrid';
  const setPreviewStyle = (s: string) => onStyleChange?.(s as ServicesStyle);
  const styles = [
    { id: 'elegantGrid', label: 'Elegant Grid' }, 
    { id: 'modernList', label: 'Modern List' }, 
    { id: 'bigNumber', label: 'Big Number' },
    { id: 'cards', label: 'Icon Cards' },
    { id: 'carousel', label: 'Carousel' },
    { id: 'timeline', label: 'Timeline' }
  ];
  const titles = { Benefits: 'Tại sao chọn chúng tôi', Services: 'Dịch vụ của chúng tôi' };

  // Empty State
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: `${secondary}10` }}>
        <Briefcase size={32} style={{ color: secondary }} />
      </div>
      <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1">Chưa có {componentType === 'Services' ? 'dịch vụ' : 'lợi ích'} nào</h3>
      <p className="text-sm text-slate-500">Thêm mục đầu tiên để bắt đầu</p>
    </div>
  );

  // Get visible items with "+N" pattern
  const MAX_VISIBLE = device === 'mobile' ? 3 : (device === 'tablet' ? 4 : 6);
  const visibleItems = items.slice(0, MAX_VISIBLE);
  const remainingCount = Math.max(0, items.length - MAX_VISIBLE);

  // Style 1: Elegant Grid - Clean cards with top accent line, hover lift
  const renderElegantGridStyle = () => (
    <div className="w-full max-w-6xl mx-auto space-y-8 py-8 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-700 pb-4">
        <h2 className={cn(
          "font-bold tracking-tight text-slate-900 dark:text-slate-100",
          device === 'mobile' ? 'text-2xl' : 'text-3xl md:text-4xl'
        )}>
          {titles[componentType]}
        </h2>
      </div>

      {/* Grid */}
      <div className={cn(
        "grid gap-6",
        device === 'mobile' ? 'grid-cols-1' : (device === 'tablet' ? 'grid-cols-2' : 'grid-cols-3')
      )}>
        {items.slice(0, device === 'mobile' ? 3 : 6).map((item) => (
          <div 
            key={item.id} 
            className="group bg-white dark:bg-slate-800 p-6 pt-8 rounded-xl shadow-sm border border-slate-200/60 dark:border-slate-700 relative overflow-hidden transition-all hover:shadow-md hover:-translate-y-1"
          >
            {/* Top Accent Line with gradient */}
            <div 
              className="absolute top-0 left-0 right-0 h-1.5 w-full group-hover:h-2 transition-all"
              style={{ background: `linear-gradient(to right, ${brandColor}, ${secondary})` }}
            />
            
            <h3 className={cn(
              "font-bold text-slate-900 dark:text-slate-100 mb-2 tracking-tight",
              device === 'mobile' ? 'text-lg' : 'text-xl'
            )}>
              {item.title || 'Tiêu đề'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
              {item.description || 'Mô tả dịch vụ...'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  // Style 2: Modern List - Clean horizontal layout with big numbers
  const renderModernListStyle = () => (
    <div className="w-full max-w-5xl mx-auto space-y-5 py-6 px-4">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-700 pb-3">
        <h2 className={cn(
          "font-bold tracking-tight text-slate-900 dark:text-slate-100",
          device === 'mobile' ? 'text-xl' : 'text-2xl md:text-3xl'
        )}>
          {titles[componentType]}
        </h2>
      </div>

      {/* List */}
      <div className="space-y-0">
        {items.slice(0, device === 'mobile' ? 4 : 6).map((item, index) => (
          <div 
            key={item.id}
            className="flex items-baseline gap-3 md:gap-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-b-0"
          >
            {/* Number */}
            <span 
              className={cn(
                "font-bold tabular-nums flex-shrink-0",
                device === 'mobile' ? 'text-xl w-8' : 'text-2xl w-10'
              )}
              style={{ color: secondary }}
            >
              {String(index + 1).padStart(2, '0')}
            </span>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className={cn(
                "font-semibold text-slate-900 dark:text-slate-100 mb-0.5",
                device === 'mobile' ? 'text-sm' : 'text-base'
              )}>
                {item.title || 'Tiêu đề'}
              </h3>
              <p className={cn(
                "text-slate-500 dark:text-slate-400 leading-relaxed",
                device === 'mobile' ? 'text-xs' : 'text-sm'
              )}>
                {item.description || 'Mô tả dịch vụ...'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Style 3: Big Number Tiles - Bento/Typographic style with giant numbers
  const renderBigNumberStyle = () => (
    <div className="w-full max-w-6xl mx-auto space-y-8 py-8 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-700 pb-4">
        <h2 className={cn(
          "font-bold tracking-tight text-slate-900 dark:text-slate-100",
          device === 'mobile' ? 'text-2xl' : 'text-3xl md:text-4xl'
        )}>
          {titles[componentType]}
        </h2>
      </div>

      {/* Grid */}
      <div className={cn(
        "grid gap-3",
        device === 'mobile' ? 'grid-cols-1' : (device === 'tablet' ? 'grid-cols-2' : 'grid-cols-3')
      )}>
        {items.slice(0, device === 'mobile' ? 3 : 6).map((item, index) => {
          const isHighlighted = index === 1;
          return (
            <div 
              key={item.id} 
              className={cn(
                "relative overflow-hidden rounded-xl p-5 flex flex-col justify-end group border transition-colors",
                device === 'mobile' ? 'min-h-[150px]' : 'min-h-[180px]',
                isHighlighted 
                  ? "text-white border-transparent" 
                  : "bg-slate-100/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/50 dark:border-slate-700"
              )}
              style={isHighlighted ? { backgroundColor: brandColor } : {}}
            >
              {/* Giant Number Watermark */}
              <span className={cn(
                "absolute -top-6 -right-3 font-black leading-none select-none pointer-events-none transition-transform group-hover:scale-105 duration-500",
                device === 'mobile' ? 'text-[6rem]' : 'text-[8rem]',
                isHighlighted ? "text-white opacity-[0.15]" : "text-slate-900 dark:text-slate-100 opacity-[0.07]"
              )}>
                {index + 1}
              </span>

              <div className="relative z-10 space-y-2">
                {/* Accent bar */}
                <div 
                  className="w-6 h-1 mb-3 opacity-50 rounded-full"
                  style={{ backgroundColor: isHighlighted ? 'white' : secondary }}
                />
                <h3 className={cn(
                  "font-bold tracking-tight",
                  device === 'mobile' ? 'text-lg' : 'text-xl'
                )}>
                  {item.title || 'Tiêu đề'}
                </h3>
                <p className={cn(
                  "text-sm leading-relaxed",
                  isHighlighted ? "text-white/90" : "text-slate-500 dark:text-slate-400"
                )}>
                  {item.description || 'Mô tả dịch vụ...'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Style 4: Icon Cards - Cards with prominent icon
  const renderCardsStyle = () => {
    if (items.length === 0) {return renderEmptyState();}
    if (items.length <= 2) {
      return (
        <div className="w-full max-w-4xl mx-auto space-y-6 py-8 px-4">
          <h2 className={cn("font-bold tracking-tight text-slate-900 dark:text-slate-100 text-center", device === 'mobile' ? 'text-2xl' : 'text-3xl')}>{titles[componentType]}</h2>
          <div className={cn("mx-auto flex justify-center gap-6", items.length === 1 ? 'max-w-sm' : 'max-w-2xl')}>
            {items.map((item) => (
              <div key={item.id} className="flex-1 bg-white dark:bg-slate-800 rounded-2xl p-6 border shadow-sm" style={{ borderColor: `${secondary}15` }}>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${brandColor}10` }}>
                  <ServiceIcon name={item.icon} size={28} style={{ color: brandColor }} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">{item.title || 'Tiêu đề'}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.description || 'Mô tả...'}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return (
      <div className="w-full max-w-6xl mx-auto space-y-8 py-8 px-4">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <BrandBadge text={componentType === 'Services' ? 'Dịch vụ' : 'Lợi ích'} variant="default" brandColor={brandColor} secondary={secondary} />
          </div>
          <h2 className={cn("font-bold tracking-tight text-slate-900 dark:text-slate-100", device === 'mobile' ? 'text-2xl' : 'text-3xl md:text-4xl')}>{titles[componentType]}</h2>
        </div>
        <div className={cn("grid gap-5", device === 'mobile' ? 'grid-cols-1' : (device === 'tablet' ? 'grid-cols-2' : 'grid-cols-3'))}>
          {visibleItems.map((item) => (
            <div key={item.id} className="group bg-white dark:bg-slate-800 rounded-2xl p-6 border transition-all hover:shadow-lg" style={{ borderColor: `${secondary}15` }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${secondary}40`; e.currentTarget.style.boxShadow = `0 8px 30px ${secondary}15`; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${secondary}15`; e.currentTarget.style.boxShadow = 'none'; }}>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110" style={{ backgroundColor: `${brandColor}10` }}>
                <ServiceIcon name={item.icon} size={28} style={{ color: brandColor }} />
              </div>
              <h3 className={cn("font-bold text-slate-900 dark:text-slate-100 mb-2", device === 'mobile' ? 'text-base' : 'text-lg')}>{item.title || 'Tiêu đề'}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 min-h-[2.5rem]">{item.description || 'Mô tả dịch vụ...'}</p>
            </div>
          ))}
          {remainingCount > 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6" style={{ borderColor: `${secondary}30` }}>
              <Plus size={28} style={{ color: secondary }} className="mb-2" />
              <span className="text-lg font-bold" style={{ color: secondary }}>+{remainingCount}</span>
              <span className="text-xs text-slate-500">mục khác</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Style 5: Carousel - Horizontal scroll with navigation
  const renderCarouselStyle = () => {
    if (items.length === 0) {return renderEmptyState();}
    const itemsPerPage = device === 'mobile' ? 1 : (device === 'tablet' ? 2 : 3);
    const totalPages = Math.ceil(items.length / itemsPerPage);
    const startIdx = carouselIndex * itemsPerPage;
    const pageItems = items.slice(startIdx, startIdx + itemsPerPage);

    return (
      <div className="w-full max-w-6xl mx-auto space-y-6 py-8 px-4">
        <div className="flex items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-700 pb-4">
          <h2 className={cn("font-bold tracking-tight text-slate-900 dark:text-slate-100", device === 'mobile' ? 'text-xl' : 'text-2xl md:text-3xl')}>{titles[componentType]}</h2>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button onClick={() =>{  setCarouselIndex(prev => Math.max(0, prev - 1)); }} disabled={carouselIndex === 0} className="w-9 h-9 rounded-full border flex items-center justify-center disabled:opacity-30" style={{ borderColor: `${brandColor}30`, color: brandColor }}><ChevronLeft size={18} /></button>
              <button onClick={() =>{  setCarouselIndex(prev => Math.min(totalPages - 1, prev + 1)); }} disabled={carouselIndex === totalPages - 1} className="w-9 h-9 rounded-full border flex items-center justify-center disabled:opacity-30" style={{ borderColor: `${brandColor}30`, color: brandColor }}><ChevronRight size={18} /></button>
            </div>
          )}
        </div>
        <div className={cn("grid gap-5", device === 'mobile' ? 'grid-cols-1' : (device === 'tablet' ? 'grid-cols-2' : 'grid-cols-3'))}>
          {pageItems.map((item) => (
            <div key={item.id} className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border shadow-sm" style={{ borderColor: `${secondary}15` }}>
              <div className="h-2 w-full" style={{ background: `linear-gradient(to right, ${brandColor}, ${secondary})` }} />
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${brandColor}10` }}>
                    <ServiceIcon name={item.icon} size={24} style={{ color: brandColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1 truncate">{item.title || 'Tiêu đề'}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{item.description || 'Mô tả...'}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {totalPages > 1 && (
          <div className="flex justify-center gap-1.5">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button key={idx} onClick={() =>{  setCarouselIndex(idx); }} className={cn("h-1.5 rounded-full transition-all", idx === carouselIndex ? "w-6" : "w-1.5 bg-slate-200 dark:bg-slate-700")} style={idx === carouselIndex ? { backgroundColor: brandColor } : {}} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Style 6: Timeline - Vertical timeline layout
  const renderTimelineStyle = () => {
    if (items.length === 0) {return renderEmptyState();}
    return (
      <div className="w-full max-w-4xl mx-auto space-y-8 py-8 px-4">
        <div className="text-center space-y-2">
          <h2 className={cn("font-bold tracking-tight text-slate-900 dark:text-slate-100", device === 'mobile' ? 'text-2xl' : 'text-3xl md:text-4xl')}>{titles[componentType]}</h2>
        </div>
        <div className="relative">
          <div className="absolute left-4 md:left-1/2 md:-translate-x-px top-0 bottom-0 w-0.5" style={{ backgroundColor: `${secondary}20` }} />
          <div className="space-y-6">
            {visibleItems.map((item, idx) => (
              <div key={item.id} className={cn("relative flex", device !== 'mobile' && idx % 2 === 0 ? 'md:flex-row-reverse' : '')}>
                <div className="absolute left-4 md:left-1/2 md:-translate-x-1/2 w-10 h-10 rounded-full border-4 bg-white dark:bg-slate-800 flex items-center justify-center z-10" style={{ borderColor: secondary }}>
                  <ServiceIcon name={item.icon} size={18} style={{ color: secondary }} />
                </div>
                <div className={cn("ml-20 md:ml-0 md:w-5/12 bg-white dark:bg-slate-800 rounded-xl p-4 border shadow-sm", device !== 'mobile' && idx % 2 === 0 ? 'md:mr-auto md:ml-8' : 'md:ml-auto md:mr-8')} style={{ borderColor: `${secondary}15` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold tabular-nums" style={{ color: secondary }}>{String(idx + 1).padStart(2, '0')}</span>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100">{item.title || 'Tiêu đề'}</h3>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{item.description || 'Mô tả...'}</p>
                </div>
              </div>
            ))}
            {remainingCount > 0 && (
              <div className="relative flex">
                <div className="absolute left-4 md:left-1/2 md:-translate-x-1/2 w-10 h-10 rounded-full border-2 border-dashed bg-white dark:bg-slate-800 flex items-center justify-center z-10" style={{ borderColor: `${secondary}40` }}>
                  <Plus size={18} style={{ color: secondary }} />
                </div>
                <div className="ml-20 md:ml-auto md:mr-8 md:w-5/12 text-sm font-medium" style={{ color: secondary }}>+{remainingCount} mục khác</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <PreviewWrapper title={`Preview ${componentType}`} device={device} setDevice={setDevice} previewStyle={previewStyle} setPreviewStyle={setPreviewStyle} styles={styles} info={`${items.length} mục`}>
      <BrowserFrame>
        {items.length === 0 ? renderEmptyState() : (
          <>
            {previewStyle === 'elegantGrid' && renderElegantGridStyle()}
            {previewStyle === 'modernList' && renderModernListStyle()}
            {previewStyle === 'bigNumber' && renderBigNumberStyle()}
            {previewStyle === 'cards' && renderCardsStyle()}
            {previewStyle === 'carousel' && renderCarouselStyle()}
            {previewStyle === 'timeline' && renderTimelineStyle()}
          </>
        )}
      </BrowserFrame>
    </PreviewWrapper>
  );
};

// ============ FOOTER PREVIEW ============
// 6 Professional Styles: Classic Dark, Modern Center, Corporate, Minimal, Centered, Stacked
// Best Practices: Clear navigation hierarchy, Social proof, Contact accessibility, Mobile-first, Brand consistency
interface SocialLinkItem { id?: number | string; platform: string; url: string; icon: string }
interface FooterConfig { 
  logo: string; 
  description: string; 
  columns: { id: number; title: string; links: { label: string; url: string }[] }[]; 
  socialLinks?: SocialLinkItem[];
  copyright: string; 
  showSocialLinks: boolean 
}
export type FooterStyle = 'classic' | 'modern' | 'corporate' | 'minimal' | 'centered' | 'stacked';
export const FooterPreview = ({ config, brandColor, secondary, mode = 'dual', selectedStyle, onStyleChange }: { config: FooterConfig; brandColor: string;
  secondary: string; mode?: FooterBrandMode; selectedStyle?: FooterStyle; onStyleChange?: (style: FooterStyle) => void }) => {
  const [device, setDevice] = useState<PreviewDevice>('desktop');
  const previewStyle = selectedStyle ?? 'classic';
  const setPreviewStyle = (s: string) => onStyleChange?.(s as FooterStyle);
  const styles = [
    { id: 'classic', label: '1. Classic Dark' }, 
    { id: 'modern', label: '2. Modern Center' },
    { id: 'corporate', label: '3. Corporate' },
    { id: 'minimal', label: '4. Minimal' },
    { id: 'centered', label: '5. Centered' },
    { id: 'stacked', label: '6. Stacked' }
  ];

  const colors: FooterLayoutColors = getFooterLayoutColors(previewStyle, brandColor, secondary, mode);

  // Social media brand colors
  const socialColors: Record<string, string> = {
    facebook: '#1877F2',
    github: '#181717',
    instagram: '#E4405F',
    linkedin: '#0A66C2',
    tiktok: '#000000',
    twitter: '#1DA1F2',
    youtube: '#FF0000',
    zalo: '#0084FF',
  };

  // Custom Facebook icon
  const FacebookIcon = ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  );

  // Custom Instagram icon
  const InstagramIcon = ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  );

  // Custom Youtube icon
  const YoutubeIcon = ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="white"/>
    </svg>
  );

  // Custom TikTok icon
  const TikTokIcon = ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  );

  // Custom Zalo icon (Simple Icons - monochrome)
  const ZaloIcon = ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.49 10.2722v-.4496h1.3467v6.3218h-.7704a.576.576 0 01-.5763-.5729l-.0006.0005a3.273 3.273 0 01-1.9372.6321c-1.8138 0-3.2844-1.4697-3.2844-3.2823 0-1.8125 1.4706-3.2822 3.2844-3.2822a3.273 3.273 0 011.9372.6321l.0006.0005zM6.9188 7.7896v.205c0 .3823-.051.6944-.2995 1.0605l-.03.0343c-.0542.0615-.1815.206-.2421.2843L2.024 14.8h4.8948v.7682a.5764.5764 0 01-.5767.5761H0v-.3622c0-.4436.1102-.6414.2495-.8476L4.8582 9.23H.1922V7.7896h6.7266zm8.5513 8.3548a.4805.4805 0 01-.4803-.4798v-7.875h1.4416v8.3548H15.47zM20.6934 9.6C22.52 9.6 24 11.0807 24 12.9044c0 1.8252-1.4801 3.306-3.3066 3.306-1.8264 0-3.3066-1.4808-3.3066-3.306 0-1.8237 1.4802-3.3044 3.3066-3.3044zm-10.1412 5.253c1.0675 0 1.9324-.8645 1.9324-1.9312 0-1.065-.865-1.9295-1.9324-1.9295s-1.9324.8644-1.9324 1.9295c0 1.0667.865 1.9312 1.9324 1.9312zm10.1412-.0033c1.0737 0 1.945-.8707 1.945-1.9453 0-1.073-.8713-1.9436-1.945-1.9436-1.0753 0-1.945.8706-1.945 1.9436 0 1.0746.8697 1.9453 1.945 1.9453z"/>
    </svg>
  );

  // Render social icons based on platform
  const renderSocialIcon = (platform: string, size: number = 18) => {
    switch (platform) {
      case 'facebook': { return <FacebookIcon size={size} />;
      }
      case 'instagram': { return <InstagramIcon size={size} />;
      }
      case 'youtube': { return <YoutubeIcon size={size} />;
      }
      case 'tiktok': { return <TikTokIcon size={size} />;
      }
      case 'zalo': { return <ZaloIcon size={size} />;
      }
      default: { return <Globe size={size} />;
      }
    }
  };

  // Get socials - use config.socialLinks if available, else default
  const getSocials = () => {
    if (config.socialLinks && config.socialLinks.length > 0) {
      return config.socialLinks;
    }
    return [
      { icon: 'facebook', id: 1, platform: 'facebook', url: '#' },
      { icon: 'instagram', id: 2, platform: 'instagram', url: '#' },
      { icon: 'youtube', id: 3, platform: 'youtube', url: '#' },
    ];
  };

  // Default columns if none provided
  const getColumns = () => {
    if (config.columns && config.columns.length > 0) {
      return config.columns;
    }
    return [
      { id: 1, links: [{ label: 'Giới thiệu', url: '/about' }, { label: 'Tuyển dụng', url: '/careers' }, { label: 'Đội ngũ', url: '/team' }, { label: 'Tin tức', url: '/blog' }], title: 'Về chúng tôi' },
      { id: 2, links: [{ label: 'FAQ', url: '/faq' }, { label: 'Liên hệ', url: '/contact' }, { label: 'Chính sách', url: '/policy' }, { label: 'Báo cáo', url: '/report' }], title: 'Hỗ trợ' }
    ];
  };

  // Style 1: Classic Dark - Standard layout với brand column và menu columns
  const renderClassicStyle = () => (
    <footer className="w-full py-6 md:py-8" style={{ backgroundColor: colors.bg, borderTop: `1px solid ${colors.border}` }}>
      <div className={cn("container max-w-7xl mx-auto", device === 'mobile' ? 'px-3' : 'px-4')}>
        <div className={cn(
          "grid gap-6",
          device === 'mobile' ? 'grid-cols-1 gap-4' : (device === 'tablet' ? 'grid-cols-2 gap-5' : 'grid-cols-12 lg:gap-5')
        )}>
          <div className={cn(device === 'mobile' ? 'text-center' : (device === 'tablet' ? 'col-span-2' : 'lg:col-span-5'), "space-y-3")}>
            <div className={cn("flex items-center gap-2", device === 'mobile' ? 'justify-center' : '')}>
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
                {config.logo ? (
                  <PreviewImage src={config.logo} alt="Logo" className="h-5 w-5 object-contain brightness-110" />
                ) : (
                  <div className="h-5 w-5 rounded flex items-center justify-center text-xs font-bold" style={{ backgroundColor: colors.accent, color: colors.textOnAccent }}>V</div>
                )}
              </div>
              <span className="text-base font-bold tracking-tight" style={{ color: colors.textPrimary }}>VietAdmin</span>
            </div>
            <p className={cn("text-xs leading-relaxed", device === 'mobile' ? '' : 'max-w-sm')} style={{ color: colors.textMuted }}>
              {config.description || 'Đối tác tin cậy của bạn trong mọi giải pháp công nghệ và sáng tạo kỹ thuật số.'}
            </p>
            {config.showSocialLinks && (
              <div className={cn("flex gap-2", device === 'mobile' ? 'justify-center' : '')}>
                {getSocials().map((s, index) => (
                  <a
                    key={`${s.id ?? 'social'}-${index}`}
                    href={s.url}
                    className="h-5 w-5 flex items-center justify-center rounded-full transition-colors"
                    style={{ backgroundColor: colors.socialBg, color: socialColors[s.platform] || colors.socialIconFallback }}
                  >
                    {renderSocialIcon(s.platform, 14)}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className={cn(
            "grid gap-5",
            device === 'mobile' ? 'grid-cols-2 text-center' : (device === 'tablet' ? 'grid-cols-2' : 'lg:col-span-7 grid-cols-2 md:grid-cols-3')
          )}>
            {getColumns().slice(0, 2).map((col, colIdx) => (
              <div key={`${col.id ?? 'col'}-${colIdx}`}>
                <h3 className="font-semibold text-xs tracking-wide mb-2" style={{ color: colors.textPrimary }}>{col.title}</h3>
                <ul className="space-y-1.5">
                  {col.links.map((link, lIdx) => (
                    <li key={lIdx}>
                      <a
                        href={link.url}
                        className="text-xs transition-colors block"
                        style={{ color: colors.textMuted }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = colors.linkHover; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = colors.textMuted; }}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-3" style={{ borderTop: `1px solid ${colors.borderSoft}` }}>
          <p className={cn("text-[10px]", device === 'mobile' ? 'text-center' : '')} style={{ color: colors.textSubtle }}>{config.copyright || '© 2024 VietAdmin. All rights reserved.'}</p>
        </div>
      </div>
    </footer>
  );

  // Style 2: Modern Centered - Elegant centered layout
  const renderModernStyle = () => (
    <footer className="w-full py-6 md:py-8" style={{ backgroundColor: colors.bg }}>
      <div className={cn("container max-w-5xl mx-auto flex flex-col items-center text-center space-y-4", device === 'mobile' ? 'px-3 space-y-3' : 'px-4')}>
        <div className="flex flex-col items-center gap-2">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-1 border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            {config.logo ? (
              <PreviewImage src={config.logo} alt="Logo" className="h-6 w-6 object-contain" />
            ) : (
              <div className="h-6 w-6 rounded-lg flex items-center justify-center font-bold text-sm" style={{ backgroundColor: colors.accent, color: colors.textOnAccent }}>V</div>
            )}
          </div>
          <h2 className="text-base font-bold tracking-tight" style={{ color: colors.textPrimary }}>VietAdmin</h2>
          <p className={cn("text-xs leading-relaxed", device === 'mobile' ? 'max-w-xs' : 'max-w-md')} style={{ color: colors.textMuted }}>
            {config.description || 'Đối tác tin cậy của bạn trong mọi giải pháp công nghệ.'}
          </p>
        </div>

        <div className={cn("flex flex-wrap justify-center gap-x-4 gap-y-1.5", device === 'mobile' ? 'gap-x-3' : '')}>
          {getColumns().flatMap(col => col.links).slice(0, device === 'mobile' ? 4 : 8).map((link, i) => (
            <a
              key={i}
              href={link.url}
              className="text-xs font-medium underline-offset-4 transition-colors"
              style={{ color: colors.textMuted, textDecorationColor: colors.accent }}
              onMouseEnter={(e) => { e.currentTarget.style.color = colors.linkHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = colors.textMuted; }}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="w-12 h-px" style={{ backgroundColor: colors.dividerGradient }}></div>

        {config.showSocialLinks && (
          <div className="flex gap-3">
            {getSocials().map((s, index) => (
              <a
                key={`${s.id ?? 'social'}-${index}`}
                href={s.url}
                className="h-5 w-5 flex items-center justify-center rounded-full transition-colors"
                style={{ backgroundColor: colors.socialBg, color: socialColors[s.platform] || colors.socialIconFallback }}
              >
                {renderSocialIcon(s.platform, 14)}
              </a>
            ))}
          </div>
        )}

        <div className="text-[10px] font-medium" style={{ color: colors.textSubtle }}>
          {config.copyright || '© 2024 VietAdmin. All rights reserved.'}
        </div>
      </div>
    </footer>
  );

  // Style 3: Corporate Grid - Structured professional layout
  const renderCorporateStyle = () => (
    <footer className="w-full py-6 md:py-8" style={{ backgroundColor: colors.bg, borderTop: `1px solid ${colors.border}` }}>
      <div className={cn("container max-w-7xl mx-auto", device === 'mobile' ? 'px-3' : 'px-4')}>
        <div className={cn(
          "flex justify-between items-start gap-3 pb-4",
          device === 'mobile' ? 'flex-col items-center text-center' : 'md:flex-row md:items-center'
        )} style={{ borderBottom: `1px solid ${colors.border}` }}>
          <div className={cn("flex items-center gap-2", device === 'mobile' ? 'justify-center' : '')}>
            {config.logo ? (
              <PreviewImage src={config.logo} alt="Logo" className="h-5 w-5 object-contain" />
            ) : (
              <div className="h-5 w-5 rounded flex items-center justify-center text-xs font-bold" style={{ backgroundColor: colors.accent, color: colors.textOnAccent }}>V</div>
            )}
            <span className="text-sm font-bold" style={{ color: colors.textPrimary }}>VietAdmin</span>
          </div>
          {config.showSocialLinks && (
            <div className="flex gap-2">
              {getSocials().map((s, index) => (
                <a
                  key={`${s.id ?? 'social'}-${index}`}
                  href={s.url}
                  className="h-4 w-4 flex items-center justify-center rounded-full transition-colors"
                  style={{ backgroundColor: colors.socialBg, color: socialColors[s.platform] || colors.socialIconFallback }}
                >
                  {renderSocialIcon(s.platform, 12)}
                </a>
              ))}
            </div>
          )}
        </div>

        <div className={cn(
          "py-5 grid gap-5",
          device === 'mobile' ? 'grid-cols-1 text-center' : (device === 'tablet' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-4')
        )}>
          <div className={cn(device === 'mobile' ? '' : 'col-span-2 md:col-span-2 pr-4')}>
            <h4 className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: colors.textPrimary }}>Về Công Ty</h4>
            <p className="text-xs leading-relaxed" style={{ color: colors.textMuted }}>{config.description || 'Đối tác tin cậy của bạn trong mọi giải pháp công nghệ.'}</p>
          </div>

          {getColumns().slice(0, 2).map((col, colIdx) => (
            <div key={`${col.id ?? 'col'}-${colIdx}`}>
              <h4 className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: colors.textPrimary }}>{col.title}</h4>
              <ul className="space-y-1">
                {col.links.map((link, lIdx) => (
                  <li key={lIdx}>
                    <a
                      href={link.url}
                      className="text-xs transition-colors"
                      style={{ color: colors.textMuted }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = colors.linkHover; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = colors.textMuted; }}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className={cn("pt-3 text-[10px]", device === 'mobile' ? 'text-center' : '')} style={{ color: colors.textSubtle }}>
          {config.copyright || '© 2024 VietAdmin. All rights reserved.'}
        </div>
      </div>
    </footer>
  );

  // Style 4: Minimal - Compact single row
  const renderMinimalStyle = () => (
    <footer className="w-full py-3 md:py-4" style={{ backgroundColor: colors.bg, borderTop: `1px solid ${colors.border}` }}>
      <div className={cn("container max-w-7xl mx-auto", device === 'mobile' ? 'px-3' : 'px-4')}>
        <div className={cn(
          "flex items-center justify-between gap-3",
          device === 'mobile' ? 'flex-col text-center' : 'md:flex-row'
        )}>
          <div className={cn("flex items-center gap-2", device === 'mobile' ? 'flex-col' : '')}>
            {config.logo ? (
              <PreviewImage src={config.logo} alt="Logo" className="h-4 w-4" />
            ) : (
              <div className="h-4 w-4 rounded flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: colors.accent, color: colors.textOnAccent }}>V</div>
            )}
            <span className="text-[10px] font-medium" style={{ color: colors.textSubtle }}>{config.copyright || '© 2024 VietAdmin. All rights reserved.'}</span>
          </div>

          {config.showSocialLinks && (
            <div className="flex gap-2">
              {getSocials().map((s, index) => (
                <a
                  key={`${s.id ?? 'social'}-${index}`}
                  href={s.url}
                  className="h-4 w-4 flex items-center justify-center rounded-full transition-colors"
                  style={{ backgroundColor: colors.socialBg, color: socialColors[s.platform] || colors.socialIconFallback }}
                >
                  {renderSocialIcon(s.platform, 12)}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );

  // Style 5: Centered - Logo + social giữa, columns dàn 2 rows
  const renderCenteredStyle = () => (
    <footer className="w-full py-8 md:py-10" style={{ backgroundColor: colors.bg }}>
      <div className={cn("container max-w-6xl mx-auto text-center", device === 'mobile' ? 'px-3' : 'px-4')}>
        <div className="flex flex-col items-center gap-3 mb-6">
          <div
            className="h-12 w-12 rounded-2xl flex items-center justify-center border"
            style={{ backgroundColor: colors.centeredBrandBg, borderColor: colors.centeredBrandBorder }}
          >
            {config.logo ? (
              <PreviewImage src={config.logo} alt="Logo" className="h-7 w-7 object-contain" />
            ) : (
              <div className="h-7 w-7 rounded-lg flex items-center justify-center font-bold" style={{ backgroundColor: colors.accent, color: colors.textOnAccent }}>V</div>
            )}
          </div>
          <h2 className="text-lg font-bold tracking-tight" style={{ color: colors.textPrimary }}>VietAdmin</h2>
          <p className={cn("text-xs leading-relaxed max-w-md", device === 'mobile' ? 'max-w-xs' : '')} style={{ color: colors.textMuted }}>
            {config.description || 'Đối tác tin cậy của bạn trong mọi giải pháp công nghệ.'}
          </p>
        </div>

        <div className={cn(
          "grid gap-4 mb-6",
          device === 'mobile' ? 'grid-cols-2 gap-3' : 'grid-cols-4 gap-6'
        )}>
          {getColumns().slice(0, 4).map((col, colIdx) => (
            <div key={`${col.id ?? 'col'}-${colIdx}`} className="text-center">
              <h4 className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: colors.textPrimary }}>{col.title}</h4>
              <ul className="space-y-1">
                {col.links.slice(0, 4).map((link, lIdx) => (
                  <li key={lIdx}>
                    <a
                      href={link.url}
                      className="text-xs transition-colors inline-block"
                      style={{ color: colors.textSubtle }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = colors.linkHover; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = colors.textSubtle; }}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="w-16 h-px mx-auto mb-5" style={{ backgroundColor: colors.dividerGradient }}></div>

        {config.showSocialLinks && (
          <div className="flex justify-center gap-3 mb-4">
            {getSocials().map((s, index) => (
              <a
                key={`${s.id ?? 'social'}-${index}`}
                href={s.url}
                className="h-8 w-8 flex items-center justify-center rounded-full transition-colors"
                style={{ backgroundColor: colors.centeredSocialBg, border: `1px solid ${colors.centeredSocialBorder}`, color: colors.centeredSocialText }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.centeredSocialHoverBg;
                  e.currentTarget.style.borderColor = colors.centeredSocialHoverBorder;
                  e.currentTarget.style.color = colors.textOnAccent;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.centeredSocialBg;
                  e.currentTarget.style.borderColor = colors.centeredSocialBorder;
                  e.currentTarget.style.color = colors.centeredSocialText;
                }}
              >
                {renderSocialIcon(s.platform, 16)}
              </a>
            ))}
          </div>
        )}

        <p className="text-[10px]" style={{ color: colors.textSubtle }}>{config.copyright || '© 2024 VietAdmin. All rights reserved.'}</p>
      </div>
    </footer>
  );

  // Style 6: Stacked - Tất cả elements xếp chồng vertical, mobile-first compact
  const renderStackedStyle = () => (
    <footer className="w-full py-6" style={{ backgroundColor: colors.bg, borderTop: `3px solid ${colors.stackedTopBorder}` }}>
      <div className={cn("container max-w-4xl mx-auto", device === 'mobile' ? 'px-4' : 'px-6')}>
        <div className={cn("flex items-start gap-3 mb-5", device === 'mobile' ? 'flex-col items-center text-center' : '')}>
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: colors.accent, color: colors.textOnAccent }}
          >
            {config.logo ? (
              <PreviewImage src={config.logo} alt="Logo" className="h-6 w-6 object-contain brightness-110" />
            ) : (
              <span className="font-bold text-sm">V</span>
            )}
          </div>
          <div className={cn(device === 'mobile' ? '' : 'flex-1')}>
            <h3 className="text-sm font-bold mb-1" style={{ color: colors.textPrimary }}>VietAdmin</h3>
            <p className="text-xs leading-relaxed line-clamp-2" style={{ color: colors.textMuted }}>
              {config.description || 'Đối tác tin cậy của bạn trong mọi giải pháp công nghệ.'}
            </p>
          </div>
        </div>

        <div className="mb-5 pb-4" style={{ borderBottom: `1px solid ${colors.border}` }}>
          <div className={cn(
            "flex flex-wrap gap-x-4 gap-y-2",
            device === 'mobile' ? 'justify-center gap-x-3' : ''
          )}>
            {getColumns().flatMap(col => col.links).slice(0, device === 'mobile' ? 6 : 10).map((link, i) => (
              <a
                key={i}
                href={link.url}
                className="text-xs font-medium transition-colors"
                style={{ color: colors.textSubtle }}
                onMouseEnter={(e) => { e.currentTarget.style.color = colors.linkHover; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = colors.textSubtle; }}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <div className={cn(
          "flex items-center justify-between",
          device === 'mobile' ? 'flex-col gap-3' : ''
        )}>
          {config.showSocialLinks && (
            <div className="flex gap-2">
              {getSocials().map((s, index) => (
                <a
                  key={`${s.id ?? 'social'}-${index}`}
                  href={s.url}
                  className="h-7 w-7 flex items-center justify-center rounded-lg transition-colors"
                  style={{ backgroundColor: colors.stackedSocialBg, color: colors.stackedSocialText }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.stackedSocialHoverBg;
                    e.currentTarget.style.color = colors.textOnAccent;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.stackedSocialBg;
                    e.currentTarget.style.color = colors.stackedSocialText;
                  }}
                >
                  {renderSocialIcon(s.platform, 14)}
                </a>
              ))}
            </div>
          )}
          <p className="text-[10px]" style={{ color: colors.textSubtle }}>{config.copyright || '© 2024 VietAdmin. All rights reserved.'}</p>
        </div>
      </div>
    </footer>
  );

  // Logo size guidelines
  const logoGuidelines = {
    centered: '48×48px - Logo nổi bật ở giữa',
    classic: '40×40px - Logo nhỏ trong header box',
    corporate: '40×40px - Logo inline với brand name',
    minimal: '32×32px - Logo compact',
    modern: '48×48px - Logo trong box surface',
    stacked: '40×40px - Logo với secondary background'
  };

  return (
    <PreviewWrapper title="Preview Footer" device={device} setDevice={setDevice} previewStyle={previewStyle} setPreviewStyle={setPreviewStyle} styles={styles}>
      <BrowserFrame>
        {previewStyle === 'classic' && renderClassicStyle()}
        {previewStyle === 'modern' && renderModernStyle()}
        {previewStyle === 'corporate' && renderCorporateStyle()}
        {previewStyle === 'minimal' && renderMinimalStyle()}
        {previewStyle === 'centered' && renderCenteredStyle()}
        {previewStyle === 'stacked' && renderStackedStyle()}
      </BrowserFrame>
      {/* Logo size guidelines */}
      <div className="mt-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-start gap-2">
          <ImageIcon size={12} className="text-slate-400 mt-0.5 flex-shrink-0" />
          <p className="text-[10px] text-slate-600 dark:text-slate-400">
            <strong>Logo:</strong> {logoGuidelines[previewStyle as keyof typeof logoGuidelines]} • PNG/SVG trong suốt, tỉ lệ 1:1
          </p>
        </div>
      </div>
    </PreviewWrapper>
  );
};

// ============ CTA PREVIEW ============
// 6 Styles: banner, centered, split, floating, gradient, minimal
// Best Practices: Clear CTA, Urgency indicators, Visual hierarchy, Touch-friendly (44px min), Whitespace, Action-oriented text
interface CTAConfig { 
  title: string; 
  description: string; 
  buttonText: string; 
  buttonLink: string; 
  secondaryButtonText: string; 
  secondaryButtonLink: string;
  badge?: string;
  backgroundImage?: string;
}
export type CTAStyle = 'banner' | 'centered' | 'split' | 'floating' | 'gradient' | 'minimal';
export const CTAPreview = ({ config, brandColor, secondary, selectedStyle, onStyleChange }: { config: CTAConfig; brandColor: string;
  secondary: string; selectedStyle?: CTAStyle; onStyleChange?: (style: CTAStyle) => void }) => {
  const [device, setDevice] = useState<PreviewDevice>('desktop');
  const previewStyle = selectedStyle ?? 'banner';
  const setPreviewStyle = (s: string) => onStyleChange?.(s as CTAStyle);
  const styles = [
    { id: 'banner', label: 'Banner' }, 
    { id: 'centered', label: 'Centered' }, 
    { id: 'split', label: 'Split' },
    { id: 'floating', label: 'Floating' },
    { id: 'gradient', label: 'Gradient' },
    { id: 'minimal', label: 'Minimal' }
  ];

  // Style 1: Banner - Full width với solid background
  const renderBannerStyle = () => (
    <section 
      className={cn("w-full", device === 'mobile' ? 'py-8 px-4' : 'py-12 px-6')} 
      style={{ backgroundColor: brandColor }}
    >
      <div className={cn(
        "max-w-4xl mx-auto flex items-center justify-between",
        device === 'mobile' ? 'flex-col text-center gap-6' : 'gap-8'
      )}>
        <div className={cn("flex-1", device === 'mobile' ? '' : 'max-w-lg')}>
          {config.badge && (
            <BrandBadge text={config.badge} variant="solid" brandColor={brandColor} secondary={secondary} />
          )}
          <h3 className={cn(
            "font-bold text-white line-clamp-2",
            device === 'mobile' ? 'text-xl' : 'text-2xl'
          )}>
            {config.title || 'Sẵn sàng bắt đầu?'}
          </h3>
          <p className={cn(
            "text-white opacity-90 mt-2 line-clamp-2",
            device === 'mobile' ? 'text-sm' : 'text-base'
          )}>
            {config.description || 'Đăng ký ngay để nhận ưu đãi đặc biệt'}
          </p>
        </div>
        <div className={cn("flex gap-3 flex-shrink-0", device === 'mobile' ? 'flex-col w-full' : '')}>
          <button 
            className={cn(
              "rounded-lg font-medium bg-white whitespace-nowrap transition-all hover:shadow-lg hover:scale-105",
              device === 'mobile' ? 'px-5 py-3 min-h-[44px] text-sm' : 'px-6 py-3'
            )} 
            style={{ color: secondary, boxShadow: `0 4px 12px ${secondary}40` }}
          >
            {config.buttonText || 'Bắt đầu ngay'}
          </button>
          {config.secondaryButtonText && (
            <button className={cn(
              "border-2 border-white/50 text-white rounded-lg font-medium whitespace-nowrap hover:bg-white/10 transition-all",
              device === 'mobile' ? 'px-5 py-3 min-h-[44px] text-sm' : 'px-6 py-3'
            )}>
              {config.secondaryButtonText}
            </button>
          )}
        </div>
      </div>
    </section>
  );

  // Style 2: Centered - Text center với subtle background
  const renderCenteredStyle = () => (
    <section 
      className={cn("w-full text-center", device === 'mobile' ? 'py-10 px-4' : 'py-16 px-6')} 
      style={{ backgroundColor: 'white' }}
    >
      <div className="max-w-2xl mx-auto">
        {config.badge && (
          <BrandBadge text={config.badge} variant="default" brandColor={brandColor} secondary={secondary} />
        )}
        <h3 
          className={cn("font-bold line-clamp-2", device === 'mobile' ? 'text-xl' : 'text-3xl')} 
          style={{ color: secondary }}
        >
          {config.title || 'Sẵn sàng bắt đầu?'}
        </h3>
        <p className={cn(
          "text-slate-600 dark:text-slate-400 mt-3 line-clamp-3",
          device === 'mobile' ? 'text-sm' : 'text-base'
        )}>
          {config.description || 'Đăng ký ngay để nhận ưu đãi đặc biệt'}
        </p>
        <div className={cn("flex justify-center gap-3 mt-6", device === 'mobile' ? 'flex-col' : '')}>
          <button 
            className={cn(
              "rounded-lg font-medium text-white whitespace-nowrap transition-all hover:scale-105",
              device === 'mobile' ? 'px-6 py-3 min-h-[44px] text-sm' : 'px-8 py-3'
            )} 
            style={{ backgroundColor: brandColor, boxShadow: `0 4px 12px ${secondary}40` }}
          >
            {config.buttonText || 'Bắt đầu ngay'}
          </button>
          {config.secondaryButtonText && (
            <button 
              className={cn(
                "border-2 rounded-lg font-medium whitespace-nowrap hover:bg-opacity-10 transition-all",
                device === 'mobile' ? 'px-6 py-3 min-h-[44px] text-sm' : 'px-8 py-3'
              )} 
              style={{ borderColor: brandColor, color: secondary }}
            >
              {config.secondaryButtonText}
            </button>
          )}
        </div>
      </div>
    </section>
  );

  // Style 3: Split - Card với icon và border accent (khác Banner)
  const renderSplitStyle = () => (
    <section className={cn("w-full bg-slate-50 dark:bg-slate-900", device === 'mobile' ? 'py-8 px-4' : 'py-12 px-6')}>
      <div 
        className={cn(
          "max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border-l-4",
          device === 'mobile' ? 'p-5' : 'p-8'
        )}
        style={{ borderLeftColor: brandColor, boxShadow: `0 4px 20px ${brandColor}10` }}
      >
        <div className={cn(
          "flex items-start gap-5",
          device === 'mobile' ? 'flex-col' : ''
        )}>
          {/* Icon */}
          <div 
            className={cn(
              "rounded-xl flex items-center justify-center flex-shrink-0",
              device === 'mobile' ? 'w-12 h-12' : 'w-14 h-14'
            )}
            style={{ backgroundColor: `${brandColor}10` }}
          >
            <Rocket size={device === 'mobile' ? 24 : 28} style={{ color: brandColor }} />
          </div>
          
          {/* Content */}
          <div className="flex-1">
            {config.badge && (
              <BrandBadge text={config.badge} variant="minimal" brandColor={brandColor} secondary={secondary} />
            )}
            <h3 className={cn(
              "font-bold text-slate-900 dark:text-white line-clamp-2",
              device === 'mobile' ? 'text-lg' : 'text-xl'
            )}>
              {config.title || 'Sẵn sàng bắt đầu?'}
            </h3>
            <p className={cn(
              "text-slate-600 dark:text-slate-400 mt-1.5 line-clamp-2",
              device === 'mobile' ? 'text-sm' : 'text-base'
            )}>
              {config.description || 'Đăng ký ngay để nhận ưu đãi đặc biệt'}
            </p>
            
            {/* Buttons */}
            <div className={cn("flex gap-3 mt-4", device === 'mobile' ? 'flex-col' : '')}>
              <button 
                className={cn(
                  "rounded-lg font-medium text-white whitespace-nowrap transition-all hover:scale-105",
                  device === 'mobile' ? 'px-5 py-3 min-h-[44px] text-sm' : 'px-5 py-2.5'
                )} 
                style={{ backgroundColor: brandColor, boxShadow: `0 4px 12px ${brandColor}40` }}
              >
                {config.buttonText || 'Bắt đầu ngay'}
              </button>
              {config.secondaryButtonText && (
                <button 
                  className={cn(
                    "border rounded-lg font-medium whitespace-nowrap transition-all hover:bg-slate-50 dark:hover:bg-slate-700",
                    device === 'mobile' ? 'px-5 py-3 min-h-[44px] text-sm' : 'px-5 py-2.5'
                  )}
                  style={{ borderColor: `${secondary}30`, color: secondary }}
                >
                  {config.secondaryButtonText}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  // Style 4: Floating - Card nổi với shadow
  const renderFloatingStyle = () => (
    <section className={cn("w-full bg-slate-50 dark:bg-slate-900", device === 'mobile' ? 'py-8 px-4' : 'py-12 px-6')}>
      <div 
        className={cn(
          "max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-2xl border overflow-hidden",
          device === 'mobile' ? 'p-5' : 'p-8'
        )}
        style={{ 
          borderColor: `${secondary}20`,
          boxShadow: `0 20px 40px ${secondary}15`
        }}
      >
        <div className={cn(
          "flex items-center justify-between",
          device === 'mobile' ? 'flex-col text-center gap-5' : 'gap-8'
        )}>
          <div className={cn("flex-1", device === 'mobile' ? '' : 'max-w-md')}>
            {config.badge && (
              <BrandBadge text={`⚡ ${config.badge}`} variant="default" brandColor={brandColor} secondary={secondary} />
            )}
            <h3 className={cn(
              "font-bold text-slate-900 dark:text-white line-clamp-2",
              device === 'mobile' ? 'text-lg' : 'text-2xl'
            )}>
              {config.title || 'Sẵn sàng bắt đầu?'}
            </h3>
            <p className={cn(
              "text-slate-600 dark:text-slate-400 mt-2 line-clamp-2",
              device === 'mobile' ? 'text-sm' : 'text-base'
            )}>
              {config.description || 'Đăng ký ngay để nhận ưu đãi đặc biệt'}
            </p>
          </div>
          <div className={cn("flex gap-3 flex-shrink-0", device === 'mobile' ? 'flex-col w-full' : '')}>
            <button 
              className={cn(
                "rounded-xl font-medium text-white whitespace-nowrap transition-all hover:scale-105",
                device === 'mobile' ? 'px-5 py-3 min-h-[44px] text-sm' : 'px-6 py-3'
              )} 
              style={{ backgroundColor: brandColor, boxShadow: `0 4px 12px ${secondary}40` }}
            >
              {config.buttonText || 'Bắt đầu ngay'}
            </button>
            {config.secondaryButtonText && (
              <button 
                className={cn(
                  "rounded-xl font-medium whitespace-nowrap transition-all hover:bg-slate-100 dark:hover:bg-slate-700",
                  device === 'mobile' ? 'px-5 py-3 min-h-[44px] text-sm' : 'px-6 py-3'
                )}
              style={{ color: secondary }}
              >
                {config.secondaryButtonText}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );

  // Style 5: Gradient - Multi-color gradient với decorative elements
  const renderGradientStyle = () => (
    <section 
      className={cn("w-full relative overflow-hidden", device === 'mobile' ? 'py-10 px-4' : 'py-16 px-6')}
      style={{ 
        background: `linear-gradient(135deg, ${brandColor} 0%, ${secondary} 50%, ${brandColor} 100%)`
      }}
    >
      {/* Decorative circles */}
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/20" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/10" />
      
      <div className="max-w-3xl mx-auto text-center relative z-10">
        {config.badge && (
          <BrandBadge text={`★ ${config.badge}`} variant="solid" brandColor={brandColor} secondary={secondary} />
        )}
        <h3 className={cn(
          "font-bold text-white line-clamp-2",
          device === 'mobile' ? 'text-2xl' : 'text-4xl'
        )}>
          {config.title || 'Sẵn sàng bắt đầu?'}
        </h3>
        <p className={cn(
          "text-white/90 mt-4 max-w-xl mx-auto line-clamp-3",
          device === 'mobile' ? 'text-sm' : 'text-lg'
        )}>
          {config.description || 'Đăng ký ngay để nhận ưu đãi đặc biệt'}
        </p>
        <div className={cn("flex justify-center gap-4 mt-8", device === 'mobile' ? 'flex-col' : '')}>
          <button 
            className={cn(
              "rounded-full font-semibold bg-white whitespace-nowrap transition-all hover:scale-105 hover:shadow-xl",
              device === 'mobile' ? 'px-6 py-3 min-h-[44px] text-sm' : 'px-8 py-4'
            )} 
            style={{ color: secondary, boxShadow: `0 8px 24px rgba(0, 0, 0, 0.2)` }}
          >
            {config.buttonText || 'Bắt đầu ngay'}
          </button>
          {config.secondaryButtonText && (
            <button className={cn(
              "border-2 border-white text-white rounded-full font-semibold whitespace-nowrap hover:bg-white/10 transition-all",
              device === 'mobile' ? 'px-6 py-3 min-h-[44px] text-sm' : 'px-8 py-4'
            )}>
              {config.secondaryButtonText}
            </button>
          )}
        </div>
      </div>
    </section>
  );

  // Style 6: Minimal - Clean, simple với accent line
  const renderMinimalStyle = () => (
    <section className={cn(
      "w-full border-y",
      device === 'mobile' ? 'py-8 px-4' : 'py-12 px-6'
    )} style={{ borderColor: `${secondary}20` }}>
      <div className={cn(
        "max-w-4xl mx-auto flex items-center",
        device === 'mobile' ? 'flex-col text-center gap-5' : 'justify-between gap-8'
      )}>
        <div className="flex items-center gap-4">
          {/* Accent line */}
          <AccentLine orientation="vertical" thickness="thick" className={cn(device === 'mobile' ? 'hidden' : 'h-16')} brandColor={brandColor} secondary={secondary} />
          <div>
            <h3 className={cn(
              "font-bold text-slate-900 dark:text-white line-clamp-1",
              device === 'mobile' ? 'text-lg' : 'text-xl'
            )}>
              {config.title || 'Sẵn sàng bắt đầu?'}
            </h3>
            <p className={cn(
              "text-slate-500 dark:text-slate-400 mt-1 line-clamp-1",
              device === 'mobile' ? 'text-sm' : 'text-base'
            )}>
              {config.description || 'Đăng ký ngay để nhận ưu đãi đặc biệt'}
            </p>
          </div>
        </div>
        <div className={cn("flex gap-3 flex-shrink-0", device === 'mobile' ? 'w-full' : '')}>
          <button 
            className={cn(
              "rounded-lg font-medium text-white whitespace-nowrap transition-all hover:scale-105",
              device === 'mobile' ? 'flex-1 px-4 py-3 min-h-[44px] text-sm' : 'px-6 py-2.5'
            )} 
            style={{ backgroundColor: brandColor, boxShadow: `0 4px 12px ${secondary}30` }}
          >
            {config.buttonText || 'Bắt đầu ngay'}
          </button>
          {config.secondaryButtonText && (
            <button 
              className={cn(
                "border rounded-lg font-medium whitespace-nowrap transition-all hover:bg-slate-50 dark:hover:bg-slate-800",
                device === 'mobile' ? 'flex-1 px-4 py-3 min-h-[44px] text-sm' : 'px-6 py-2.5'
              )}
              style={{ borderColor: `${secondary}30`, color: secondary }}
            >
              {config.secondaryButtonText}
            </button>
          )}
        </div>
      </div>
    </section>
  );

  return (
    <PreviewWrapper title="Preview CTA" device={device} setDevice={setDevice} previewStyle={previewStyle} setPreviewStyle={setPreviewStyle} styles={styles}>
      <BrowserFrame>
        {previewStyle === 'banner' && renderBannerStyle()}
        {previewStyle === 'centered' && renderCenteredStyle()}
        {previewStyle === 'split' && renderSplitStyle()}
        {previewStyle === 'floating' && renderFloatingStyle()}
        {previewStyle === 'gradient' && renderGradientStyle()}
        {previewStyle === 'minimal' && renderMinimalStyle()}
      </BrowserFrame>
    </PreviewWrapper>
  );
};

export type AboutStyle = 'classic' | 'bento' | 'minimal' | 'split' | 'timeline' | 'showcase' | 'spaCollage' | 'solarFeature' | 'kanban';

// ============ BENEFITS PREVIEW (Why Choose Us) ============
// 6 Professional Styles: Solid Cards, Accent List, Bold Bento, Icon Row, Carousel, Timeline
interface BenefitItem { id: number; icon: string; title: string; description: string }
export type BenefitsStyle = 'cards' | 'list' | 'bento' | 'row' | 'carousel' | 'timeline';
export interface BenefitsConfig { subHeading?: string; heading?: string; buttonText?: string; buttonLink?: string }
export const BenefitsPreview = ({ items, brandColor, secondary: _secondary, selectedStyle, onStyleChange, config }: { items: BenefitItem[]; brandColor: string;
  secondary: string; selectedStyle?: BenefitsStyle; onStyleChange?: (style: BenefitsStyle) => void; config?: BenefitsConfig }) => {
  const [device, setDevice] = useState<PreviewDevice>('desktop');
  const previewStyle = selectedStyle ?? 'cards';
  const setPreviewStyle = (s: string) => onStyleChange?.(s as BenefitsStyle);
  const styles = [
    { id: 'cards', label: 'Solid Cards' }, 
    { id: 'list', label: 'Accent List' }, 
    { id: 'bento', label: 'Bold Bento' },
    { id: 'row', label: 'Icon Row' },
    { id: 'carousel', label: 'Carousel' },
    { id: 'timeline', label: 'Timeline' }
  ];
  const subHeading = config?.subHeading ?? 'Vì sao chọn chúng tôi?';
  const heading = config?.heading ?? 'Giá trị cốt lõi';

  // Header Component - reusable
  const BenefitsHeader = () => (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b-2 mb-6" style={{ borderColor: `${brandColor}20` }}>
      <div className="space-y-2">
        <div className="inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-wider" style={{ backgroundColor: `${brandColor}15`, color: brandColor }}>
          {subHeading}
        </div>
        <h2 className={cn("font-bold tracking-tight text-slate-900 dark:text-slate-100", device === 'mobile' ? 'text-xl' : 'text-2xl md:text-3xl')}>
          {heading}
        </h2>
      </div>
    </div>
  );

  // Empty State
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: `${brandColor}10` }}>
        <Check size={32} style={{ color: brandColor }} />
      </div>
      <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1">Chưa có lợi ích nào</h3>
      <p className="text-sm text-slate-500">Thêm lợi ích đầu tiên để bắt đầu</p>
    </div>
  );

  // Max visible items
  const MAX_VISIBLE = device === 'mobile' ? 4 : 6;
  const visibleItems = items.slice(0, MAX_VISIBLE);
  const remainingCount = items.length - MAX_VISIBLE;

  // Style 1: Corporate Cards - Solid background với icon đậm màu chủ đạo
  const renderCardsStyle = () => (
    <div className={cn("py-8 px-4", device === 'mobile' ? 'py-6 px-3' : 'md:py-12 md:px-6')}>
      <BenefitsHeader />
      {items.length === 0 ? <EmptyState /> : (
        <div className={cn(
          "grid gap-4 md:gap-6",
          items.length === 1 ? 'max-w-md mx-auto' : (items.length === 2 ? 'max-w-2xl mx-auto grid-cols-2' : ''),
          items.length >= 3 && (device === 'mobile' ? 'grid-cols-1' : (device === 'tablet' ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'))
        )}>
          {visibleItems.map((item) => (
            <div 
              key={item.id} 
              className="rounded-xl p-5 md:p-6 shadow-sm flex flex-col items-start border"
              style={{ backgroundColor: `${brandColor}08`, borderColor: `${brandColor}20` }}
            >
              <div 
                className="w-11 h-11 md:w-12 md:h-12 rounded-lg flex items-center justify-center mb-4 text-white"
                style={{ backgroundColor: brandColor, boxShadow: `0 4px 6px -1px ${brandColor}30` }}
              >
                <Check size={18} strokeWidth={3} />
              </div>
              <h3 className="font-bold text-base md:text-lg mb-2 line-clamp-2" style={{ color: brandColor }}>
                {item.title || 'Tiêu đề'}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3 min-h-[3.75rem]">
                {item.description || 'Mô tả lợi ích...'}
              </p>
            </div>
          ))}
          {remainingCount > 0 && (
            <div className="rounded-xl flex items-center justify-center border-2 border-dashed p-5" style={{ borderColor: `${brandColor}30` }}>
              <div className="text-center">
                <Plus size={28} className="mx-auto mb-2" style={{ color: brandColor }} />
                <span className="text-lg font-bold" style={{ color: brandColor }}>+{remainingCount}</span>
                <p className="text-xs text-slate-400">mục khác</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Style 2: Modern List - Thanh màu bên trái nhấn mạnh
  const renderListStyle = () => (
    <div className={cn("py-8 px-4", device === 'mobile' ? 'py-6 px-3' : 'md:py-12 md:px-6')}>
      <BenefitsHeader />
      {items.length === 0 ? <EmptyState /> : (
        <div className="flex flex-col gap-3 max-w-4xl mx-auto">
          {visibleItems.map((item, index) => (
            <div 
              key={item.id} 
              className="relative bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-lg p-4 md:p-5 pl-5 md:pl-6 overflow-hidden shadow-sm"
            >
              <div className="absolute top-0 bottom-0 left-0 w-1.5" style={{ backgroundColor: brandColor }} />
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-3">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center border" style={{ backgroundColor: `${brandColor}15`, borderColor: `${brandColor}30` }}>
                      <span className="text-[11px] font-bold" style={{ color: brandColor }}>{index + 1}</span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm md:text-base line-clamp-1">{item.title || 'Tiêu đề'}</h3>
                    <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 md:mt-1.5 leading-normal line-clamp-2">{item.description || 'Mô tả lợi ích...'}</p>
                  </div>
                </div>
                <div className="hidden md:block flex-shrink-0">
                  <svg className="w-[18px] h-[18px] opacity-60" style={{ color: brandColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
          {remainingCount > 0 && (
            <div className="text-center py-3">
              <span className="text-sm font-medium" style={{ color: brandColor }}>+{remainingCount} mục khác</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Style 3: Trust Bento - Typography focused với layout 2-1 / 1-2
  const renderBentoStyle = () => (
    <div className={cn("py-8 px-4", device === 'mobile' ? 'py-6 px-3' : 'md:py-12 md:px-6')}>
      <BenefitsHeader />
      {items.length === 0 ? <EmptyState /> : (
        <div className={cn("grid gap-3 md:gap-4", device === 'mobile' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3')}>
          {items.slice(0, 4).map((item, index) => {
            const isWide = index === 0 || index === 3;
            const isPrimary = index === 0;
            return (
              <div 
                key={item.id} 
                className={cn(
                  "flex flex-col justify-between p-5 md:p-6 lg:p-8 rounded-2xl transition-colors min-h-[160px] md:min-h-[180px]",
                  device !== 'mobile' && isWide ? "md:col-span-2" : (device !== 'mobile' ? "md:col-span-1" : ""),
                  isPrimary ? "text-white border border-transparent" : "bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700"
                )}
                style={isPrimary ? { backgroundColor: brandColor, boxShadow: `0 10px 15px -3px ${brandColor}30` } : {}}
              >
                <div className="flex justify-between items-start mb-3 md:mb-4">
                  <span className={cn("text-xs font-bold uppercase tracking-widest px-2 py-1 rounded", isPrimary ? "bg-white/20 text-white" : "")} style={!isPrimary ? { backgroundColor: `${brandColor}15`, color: brandColor } : {}}>
                    0{index + 1}
                  </span>
                </div>
                <div>
                  <h3 className={cn("font-bold mb-2 md:mb-3 tracking-tight line-clamp-2", device === 'mobile' ? 'text-lg' : 'text-xl md:text-2xl', isPrimary ? "text-white" : "text-slate-900 dark:text-slate-100")}>
                    {item.title || 'Tiêu đề'}
                  </h3>
                  <p className={cn("text-sm md:text-base leading-relaxed font-medium line-clamp-3", isPrimary ? "text-white/90" : "text-slate-500 dark:text-slate-400")}>
                    {item.description || 'Mô tả lợi ích...'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // Style 4: Minimal Row - Icon to với dividers
  const renderRowStyle = () => (
    <div className={cn("py-8 px-4", device === 'mobile' ? 'py-6 px-3' : 'md:py-12 md:px-6')}>
      <BenefitsHeader />
      {items.length === 0 ? <EmptyState /> : (
        <div className="bg-white dark:bg-slate-800 border-y-2 rounded-lg overflow-hidden" style={{ borderColor: `${brandColor}15` }}>
          <div className={cn("flex items-stretch", device === 'mobile' ? 'flex-col divide-y' : 'flex-row divide-x')} style={{ borderColor: `${brandColor}15` }}>
            {items.slice(0, 4).map((item) => (
              <div key={item.id} className="flex-1 w-full p-5 md:p-6 lg:p-8 flex flex-col items-center text-center">
                <div className="mb-3 md:mb-4 p-3 rounded-full" style={{ backgroundColor: `${brandColor}15`, boxShadow: `0 0 0 4px ${brandColor}08`, color: brandColor }}>
                  <Check size={22} strokeWidth={3} />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1.5 md:mb-2 text-sm md:text-base line-clamp-2 min-h-[2.5rem]">{item.title || 'Tiêu đề'}</h3>
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">{item.description || 'Mô tả lợi ích...'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Style 5: Carousel - Horizontal scroll với navigation
  const [carouselIndex, setCarouselIndex] = useState(0);
  const renderCarouselStyle = () => {
    const itemsPerView = device === 'mobile' ? 1 : (device === 'tablet' ? 2 : 3);
    const maxIndex = Math.max(0, items.length - itemsPerView);
    return (
      <div className={cn("py-8 px-4", device === 'mobile' ? 'py-6 px-3' : 'md:py-12 md:px-6')}>
        <BenefitsHeader />
        {items.length === 0 ? <EmptyState /> : (
          <div className="relative">
            {/* Navigation Arrows */}
            {items.length > itemsPerView && (
              <>
                <button
                  onClick={() =>{  setCarouselIndex(Math.max(0, carouselIndex - 1)); }}
                  disabled={carouselIndex === 0}
                  className={cn("absolute -left-2 md:-left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-lg border flex items-center justify-center transition-all", carouselIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110')}
                  style={{ borderColor: `${brandColor}20` }}
                >
                  <ChevronLeft size={20} style={{ color: brandColor }} />
                </button>
                <button
                  onClick={() =>{  setCarouselIndex(Math.min(maxIndex, carouselIndex + 1)); }}
                  disabled={carouselIndex >= maxIndex}
                  className={cn("absolute -right-2 md:-right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-lg border flex items-center justify-center transition-all", carouselIndex >= maxIndex ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110')}
                  style={{ borderColor: `${brandColor}20` }}
                >
                  <ChevronRight size={20} style={{ color: brandColor }} />
                </button>
              </>
            )}
            {/* Carousel Container */}
            <div className="overflow-hidden mx-4 md:mx-8">
              <div className="flex transition-transform duration-300 ease-out gap-4" style={{ transform: `translateX(-${carouselIndex * (100 / itemsPerView)}%)` }}>
                {items.map((item, idx) => (
                  <div 
                    key={item.id} 
                    className="flex-shrink-0 rounded-xl p-5 md:p-6 border shadow-sm"
                    style={{ backgroundColor: idx === 0 ? brandColor : `${brandColor}08`, borderColor: `${brandColor}20`, width: `calc(${100 / itemsPerView}% - ${(itemsPerView - 1) * 16 / itemsPerView}px)` }}
                  >
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-4", idx === 0 ? 'bg-white/20' : '')} style={idx !== 0 ? { backgroundColor: brandColor } : {}}>
                      <Check size={18} strokeWidth={3} className={idx === 0 ? 'text-white' : ''} style={idx !== 0 ? { color: 'white' } : {}} />
                    </div>
                    <h3 className={cn("font-bold text-base mb-2 line-clamp-2", idx === 0 ? 'text-white' : '')} style={idx !== 0 ? { color: brandColor } : {}}>{item.title || 'Tiêu đề'}</h3>
                    <p className={cn("text-sm leading-relaxed line-clamp-3", idx === 0 ? 'text-white/80' : 'text-slate-500 dark:text-slate-400')}>{item.description || 'Mô tả...'}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* Dots Indicator */}
            {items.length > itemsPerView && (
              <div className="flex justify-center gap-2 mt-4">
                {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
                  <button key={idx} onClick={() =>{  setCarouselIndex(idx); }} className={cn("w-2 h-2 rounded-full transition-all", carouselIndex === idx ? 'w-6' : '')} style={{ backgroundColor: carouselIndex === idx ? brandColor : `${brandColor}30` }} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Style 6: Timeline - Vertical timeline với milestones
  const renderTimelineStyle = () => (
    <div className={cn("py-8 px-4", device === 'mobile' ? 'py-6 px-3' : 'md:py-12 md:px-6')}>
      <BenefitsHeader />
      {items.length === 0 ? <EmptyState /> : (
        <div className="relative max-w-3xl mx-auto">
          {/* Vertical Line */}
          <div className={cn("absolute top-0 bottom-0 w-0.5", device === 'mobile' ? 'left-4' : 'left-1/2 -translate-x-px')} style={{ backgroundColor: `${brandColor}20` }} />
          <div className="space-y-6 md:space-y-8">
            {visibleItems.map((item, idx) => (
              <div key={item.id} className={cn("relative flex items-start", device === 'mobile' ? 'pl-12' : (idx % 2 === 0 ? 'flex-row' : 'flex-row-reverse'))}>
                {/* Dot */}
                <div className={cn("absolute w-8 h-8 rounded-full border-4 bg-white dark:bg-slate-900 flex items-center justify-center text-xs font-bold z-10", device === 'mobile' ? 'left-0' : 'left-1/2 -translate-x-1/2')} style={{ borderColor: brandColor, color: brandColor }}>
                  {idx + 1}
                </div>
                {/* Content Card */}
                <div className={cn("bg-white dark:bg-slate-800 rounded-xl p-4 md:p-5 border shadow-sm", device === 'mobile' ? 'w-full' : 'w-5/12')} style={{ borderColor: `${brandColor}15` }}>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-2 line-clamp-2" style={{ color: brandColor }}>{item.title || 'Tiêu đề'}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">{item.description || 'Mô tả...'}</p>
                </div>
              </div>
            ))}
          </div>
          {remainingCount > 0 && (
            <div className="text-center mt-6">
              <span className="text-sm font-medium" style={{ color: brandColor }}>+{remainingCount} mục khác</span>
            </div>
          )}
          {/* CTA Button */}
          {config?.buttonText && (
            <div className="text-center mt-8">
              <a href={config.buttonLink ?? '#'} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-white" style={{ backgroundColor: brandColor }}>
                {config.buttonText}
                <ArrowRight size={16} />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <PreviewWrapper title="Preview Lợi ích" device={device} setDevice={setDevice} previewStyle={previewStyle} setPreviewStyle={setPreviewStyle} styles={styles} info={`${items.length} lợi ích`}>
      <BrowserFrame url="yoursite.com/why-us">
        {previewStyle === 'cards' && renderCardsStyle()}
        {previewStyle === 'list' && renderListStyle()}
        {previewStyle === 'bento' && renderBentoStyle()}
        {previewStyle === 'row' && renderRowStyle()}
        {previewStyle === 'carousel' && renderCarouselStyle()}
        {previewStyle === 'timeline' && renderTimelineStyle()}
      </BrowserFrame>
    </PreviewWrapper>
  );
};

// ============ CAREER PREVIEW ============
// 6 Professional Styles: Cards, List, Minimal, Table, Featured, Timeline
// Best Practices: Accessibility (semantic HTML, ARIA), Equal Height Cards, Line Clamp, Edge Cases
interface JobPosition { id: number; title: string; department: string; location: string; type: string; salary: string; description: string }
export type CareerStyle = 'cards' | 'list' | 'minimal' | 'table' | 'featured' | 'timeline';
export const CareerPreview = ({ jobs, brandColor, secondary, selectedStyle, onStyleChange }: { jobs: JobPosition[]; brandColor: string;
  secondary: string; selectedStyle?: CareerStyle; onStyleChange?: (style: CareerStyle) => void }) => {
  const [device, setDevice] = useState<PreviewDevice>('desktop');
  const previewStyle = selectedStyle ?? 'cards';
  const setPreviewStyle = (s: string) => onStyleChange?.(s as CareerStyle);
  
  const styles = [
    { id: 'cards', label: 'Cards' }, 
    { id: 'list', label: 'List' }, 
    { id: 'minimal', label: 'Minimal' },
    { id: 'table', label: 'Table' },
    { id: 'featured', label: 'Featured' },
    { id: 'timeline', label: 'Timeline' }
  ];

  // Dynamic info bar - shows job counts by type or department
  const getJobsInfo = () => {
    const count = jobs.length;
    if (count === 0) {return 'Chưa có vị trí';}
    
    const typeCount = jobs.reduce< Record<string, number>>((acc, job) => {
      const type = job.type || 'Full-time';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    const typeSummary = Object.entries(typeCount).slice(0, 3).map(([type, cnt]) => `${type} (${cnt})`).join(', ');
    return count <= 3 ? `${count} vị trí • ${typeSummary}` : `${count} vị trí`;
  };

  // Empty State Component
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: `${brandColor}10` }}>
        <Briefcase size={32} style={{ color: brandColor }} />
      </div>
      <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1">Chưa có vị trí tuyển dụng</h3>
      <p className="text-sm text-slate-500">Thêm vị trí đầu tiên để bắt đầu</p>
    </div>
  );

  // Header Component
  const CareerHeader = ({ subtitle }: { subtitle?: string }) => (
    <div className="text-center mb-8">
      <h3 className={cn("font-bold text-slate-900 dark:text-slate-100", device === 'mobile' ? 'text-lg' : 'text-xl md:text-2xl')}>
        Cơ hội nghề nghiệp
      </h3>
      {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{subtitle}</p>}
    </div>
  );

  // Style 1: Cards - Grid layout với hover effects (IMPROVED: Equal Height + Line Clamp)
  const renderCardsStyle = () => {
    const MAX_DISPLAY = device === 'mobile' ? 4 : 6;
    const visibleJobs = jobs.slice(0, MAX_DISPLAY);
    const remainingCount = Math.max(0, jobs.length - MAX_DISPLAY);

    // Edge case: 1-2 items
    if (jobs.length === 1) {
      return (
        <div className={cn("px-4", device === 'mobile' ? 'py-6' : 'py-10 md:py-16')}>
          <CareerHeader subtitle="Tham gia đội ngũ của chúng tôi" />
          <div className="max-w-md mx-auto">
            <JobCard job={jobs[0]} brandColor={brandColor} secondary={secondary} device={device} />
          </div>
        </div>
      );
    }

    if (jobs.length === 2) {
      return (
        <div className={cn("px-4", device === 'mobile' ? 'py-6' : 'py-10 md:py-16')}>
          <CareerHeader subtitle="Tham gia đội ngũ của chúng tôi" />
          <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map(job => <JobCard key={job.id} job={job} brandColor={brandColor} secondary={secondary} device={device} />)}
          </div>
        </div>
      );
    }

    return (
      <div className={cn("px-4", device === 'mobile' ? 'py-6' : 'py-10 md:py-16')}>
        <CareerHeader subtitle="Tham gia đội ngũ của chúng tôi" />
        {jobs.length === 0 ? <EmptyState /> : (
          <>
            <div className={cn("grid gap-4 max-w-6xl mx-auto", device === 'mobile' ? 'grid-cols-1' : (device === 'tablet' ? 'grid-cols-2' : 'grid-cols-3'))}>
              {visibleJobs.map((job) => <JobCard key={job.id} job={job} brandColor={brandColor} secondary={secondary} device={device} />)}
            </div>
            {remainingCount > 0 && (
              <div className="text-center mt-6">
                <span className="text-sm font-medium" style={{ color: brandColor }}>+{remainingCount} vị trí khác</span>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // Job Card Component - Reusable with Equal Height
  const JobCard = ({ job, brandColor, device }: { job: JobPosition; brandColor: string;
  secondary: string; device: PreviewDevice }) => (
    <article 
      className="bg-white dark:bg-slate-800 rounded-xl border flex flex-col h-full transition-all"
      style={{ borderColor: `${brandColor}15` }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${brandColor}40`;
        e.currentTarget.style.boxShadow = `0 4px 12px ${brandColor}15`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = `${brandColor}15`;
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div className={cn("p-4", device === 'mobile' ? 'p-4' : 'p-5')}>
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-medium px-2 py-1 rounded whitespace-nowrap" style={{ backgroundColor: `${brandColor}15`, color: brandColor }}>
            {job.department || 'Đang cập nhật'}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">{job.type || 'Full-time'}</span>
        </div>
        <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 line-clamp-2 min-h-[2.5rem]">
          {job.title || 'Vị trí tuyển dụng'}
        </h4>
        {job.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2 min-h-[2rem]">
            {job.description}
          </p>
        )}
        <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 mb-4">
          <div className="flex items-center gap-1.5">
            <MapPin size={12} className="flex-shrink-0" />
            <span className="truncate">{job.location || 'Remote'}</span>
          </div>
          {job.salary && (
            <div className="flex items-center gap-1.5">
              <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium" style={{ color: brandColor }}>{job.salary}</span>
            </div>
          )}
        </div>
      </div>
      <div className={cn("mt-auto border-t", device === 'mobile' ? 'p-3' : 'p-4')} style={{ borderColor: `${brandColor}10` }}>
        <button 
          className={cn("w-full rounded-lg font-medium text-white transition-opacity hover:opacity-90", device === 'mobile' ? 'py-2 text-sm' : 'py-2.5 text-sm')} 
          style={{ backgroundColor: brandColor }}
        >
          Ứng tuyển ngay
        </button>
      </div>
    </article>
  );

  // Style 2: List - Compact horizontal layout
  const renderListStyle = () => {
    const MAX_DISPLAY = device === 'mobile' ? 5 : 8;
    const visibleJobs = jobs.slice(0, MAX_DISPLAY);
    const remainingCount = Math.max(0, jobs.length - MAX_DISPLAY);

    return (
      <div className={cn("px-4", device === 'mobile' ? 'py-6' : 'py-10 md:py-16')}>
        <CareerHeader />
        {jobs.length === 0 ? <EmptyState /> : (
          <div className="max-w-4xl mx-auto">
            <ul className="space-y-3" role="list" aria-label="Danh sách vị trí tuyển dụng">
              {visibleJobs.map((job) => (
                <li key={job.id}>
                  <article 
                    className={cn("bg-white dark:bg-slate-800 rounded-xl border flex items-center justify-between transition-all", device === 'mobile' ? 'flex-col gap-3 text-center p-4' : 'p-5')}
                    style={{ borderColor: `${brandColor}15` }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = `${brandColor}30`;
                      e.currentTarget.style.boxShadow = `0 2px 8px ${brandColor}10`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = `${brandColor}15`;
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">{job.title || 'Vị trí'}</h4>
                      <div className={cn("flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-1", device === 'mobile' ? 'flex-wrap justify-center' : '')}>
                        <span className="whitespace-nowrap">{job.department || 'Đang cập nhật'}</span>
                        <span className="hidden md:inline">•</span>
                        <span className="whitespace-nowrap">{job.location || 'Remote'}</span>
                        <span className="hidden md:inline">•</span>
                        <span className="whitespace-nowrap">{job.type || 'Full-time'}</span>
                      </div>
                    </div>
                    <div className={cn("flex items-center gap-3 flex-shrink-0", device === 'mobile' ? 'w-full' : '')}>
                      {job.salary && <span className="text-sm font-medium whitespace-nowrap" style={{ color: brandColor }}>{job.salary}</span>}
                      <button className={cn("rounded-lg font-medium text-white whitespace-nowrap", device === 'mobile' ? 'flex-1 py-2.5 text-sm' : 'px-5 py-2 text-sm')} style={{ backgroundColor: brandColor }}>
                        Ứng tuyển
                      </button>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
            {remainingCount > 0 && (
              <div className="text-center mt-6">
                <span className="text-sm font-medium" style={{ color: brandColor }}>+{remainingCount} vị trí khác</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Style 3: Minimal - Split layout with sidebar
  const renderMinimalStyle = () => (
    <div className={cn("px-4", device === 'mobile' ? 'py-6' : 'py-10 md:py-16')} style={{ backgroundColor: `${brandColor}05` }}>
      {jobs.length === 0 ? (
        <div className="max-w-5xl mx-auto">
          <EmptyState />
        </div>
      ) : (
        <div className="max-w-5xl mx-auto">
          <div className={cn("flex gap-8", device === 'mobile' ? 'flex-col' : 'md:flex-row md:gap-12')}>
            <div className={cn("text-center md:text-left", device === 'mobile' ? 'mb-6' : 'md:w-1/3')}>
              <p className="text-sm font-medium mb-2 uppercase tracking-wide" style={{ color: brandColor }}>TUYỂN DỤNG</p>
              <h3 className={cn("font-bold text-slate-900 dark:text-slate-100 mb-3", device === 'mobile' ? 'text-lg' : 'text-2xl')}>
                Gia nhập đội ngũ
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Chúng tôi đang tìm kiếm những tài năng mới</p>
            </div>
            <div className="flex-1">
              <ul className="space-y-3" role="list">
                {jobs.slice(0, 6).map((job) => (
                  <li key={job.id}>
                    <article className="bg-white dark:bg-slate-800 rounded-xl p-4 md:p-5 border flex items-center justify-between transition-shadow hover:shadow-sm" style={{ borderColor: `${brandColor}15` }}>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-slate-900 dark:text-slate-100 line-clamp-1">{job.title || 'Vị trí'}</h4>
                        <span className="text-sm text-slate-500 dark:text-slate-400">{job.location || 'Remote'} • {job.type || 'Full-time'}</span>
                      </div>
                      <a href="#" className="text-sm font-medium hover:underline whitespace-nowrap ml-4" style={{ color: brandColor }}>Chi tiết →</a>
                    </article>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Style 4: Table - Spreadsheet-like layout (NEW)
  const renderTableStyle = () => (
    <div className={cn("px-4", device === 'mobile' ? 'py-6' : 'py-10 md:py-16')}>
      <CareerHeader subtitle="Danh sách vị trí đang tuyển" />
      {jobs.length === 0 ? <EmptyState /> : (
        <div className="max-w-6xl mx-auto overflow-x-auto">
          <table className="w-full bg-white dark:bg-slate-800 rounded-xl overflow-hidden border" style={{ borderColor: `${brandColor}15` }}>
            <thead>
              <tr className="border-b" style={{ backgroundColor: `${brandColor}05`, borderColor: `${brandColor}15` }}>
                <th className="text-left p-4 font-semibold text-sm text-slate-700 dark:text-slate-300">Vị trí</th>
                {device !== 'mobile' && <th className="text-left p-4 font-semibold text-sm text-slate-700 dark:text-slate-300">Phòng ban</th>}
                <th className="text-left p-4 font-semibold text-sm text-slate-700 dark:text-slate-300">Địa điểm</th>
                {device !== 'mobile' && <th className="text-left p-4 font-semibold text-sm text-slate-700 dark:text-slate-300">Loại hình</th>}
                {device !== 'mobile' && <th className="text-left p-4 font-semibold text-sm text-slate-700 dark:text-slate-300">Mức lương</th>}
                <th className="text-right p-4 font-semibold text-sm text-slate-700 dark:text-slate-300">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {jobs.slice(0, 10).map((job) => (
                <tr key={job.id} className="border-b last:border-0 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50" style={{ borderColor: `${brandColor}10` }}>
                  <td className="p-4">
                    <h4 className="font-medium text-slate-900 dark:text-slate-100 line-clamp-1">{job.title || 'Vị trí tuyển dụng'}</h4>
                    {device === 'mobile' && job.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{job.description}</p>
                    )}
                  </td>
                  {device !== 'mobile' && <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{job.department || 'Đang cập nhật'}</td>}
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">{job.location || 'Remote'}</td>
                  {device !== 'mobile' && <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{job.type || 'Full-time'}</td>}
                  {device !== 'mobile' && <td className="p-4 text-sm font-medium" style={{ color: brandColor }}>{job.salary || 'Thỏa thuận'}</td>}
                  <td className="p-4 text-right">
                    <button className="px-4 py-1.5 rounded-lg text-xs font-medium text-white whitespace-nowrap" style={{ backgroundColor: brandColor }}>
                      {device === 'mobile' ? 'Ứng tuyển' : 'Xem chi tiết'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // Style 5: Featured - Highlight 1-2 hot positions (NEW)
  const renderFeaturedStyle = () => {
    if (jobs.length === 0) {
      return (
        <div className={cn("px-4", device === 'mobile' ? 'py-6' : 'py-10 md:py-16')}>
          <EmptyState />
        </div>
      );
    }

    const featuredJob = jobs[0];
    const otherJobs = jobs.slice(1, 7);

    return (
      <div className={cn("px-4", device === 'mobile' ? 'py-6' : 'py-10 md:py-16')}>
        <CareerHeader subtitle="Vị trí nổi bật đang tuyển gấp" />
        <div className="max-w-6xl mx-auto">
          {/* Featured Job - Large Card */}
          <article 
            className="bg-white dark:bg-slate-800 rounded-2xl border-2 p-6 md:p-8 mb-6 relative overflow-hidden"
            style={{ borderColor: brandColor, boxShadow: `0 8px 30px ${brandColor}20` }}
          >
            <div className="absolute top-4 right-4">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: brandColor }}>
                <Star size={12} fill="currentColor" />
                HOT
              </span>
            </div>
            <div className="max-w-3xl">
              <span className="text-xs font-medium px-2 py-1 rounded" style={{ backgroundColor: `${brandColor}15`, color: brandColor }}>
                {featuredJob.department || 'Đang cập nhật'}
              </span>
              <h3 className={cn("font-bold text-slate-900 dark:text-slate-100 mt-3 mb-2", device === 'mobile' ? 'text-xl' : 'text-2xl md:text-3xl')}>
                {featuredJob.title || 'Vị trí tuyển dụng'}
              </h3>
              {featuredJob.description && (
                <p className="text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">{featuredJob.description}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400 mb-6">
                <div className="flex items-center gap-2">
                  <MapPin size={16} />
                  <span>{featuredJob.location || 'Remote'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  <span>{featuredJob.type || 'Full-time'}</span>
                </div>
                {featuredJob.salary && (
                  <div className="flex items-center gap-2 font-medium" style={{ color: brandColor }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{featuredJob.salary}</span>
                  </div>
                )}
              </div>
              <button className="px-8 py-3 rounded-lg font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: brandColor }}>
                Ứng tuyển ngay
              </button>
            </div>
          </article>

          {/* Other Jobs - Compact Grid */}
          {otherJobs.length > 0 && (
            <>
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-4 text-lg">Vị trí khác</h4>
              <div className={cn("grid gap-4", device === 'mobile' ? 'grid-cols-1' : (device === 'tablet' ? 'grid-cols-2' : 'grid-cols-3'))}>
                {otherJobs.map((job) => (
                  <article 
                    key={job.id} 
                    className="bg-white dark:bg-slate-800 rounded-lg border p-4 transition-all hover:shadow-md"
                    style={{ borderColor: `${brandColor}15` }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ backgroundColor: `${brandColor}10`, color: brandColor }}>
                        {job.department || 'Đang cập nhật'}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{job.type || 'Full-time'}</span>
                    </div>
                    <h5 className="font-medium text-slate-900 dark:text-slate-100 mb-2 line-clamp-2 min-h-[2.5rem]">{job.title || 'Vị trí'}</h5>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
                      <MapPin size={12} />
                      <span>{job.location || 'Remote'}</span>
                    </div>
                    <a href="#" className="text-sm font-medium hover:underline" style={{ color: brandColor }}>Xem chi tiết →</a>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // Style 6: Timeline - Grouped by department (NEW)
  const renderTimelineStyle = () => {
    if (jobs.length === 0) {
      return (
        <div className={cn("px-4", device === 'mobile' ? 'py-6' : 'py-10 md:py-16')}>
          <EmptyState />
        </div>
      );
    }

    // Group jobs by department with global index tracking
    const groupedJobs = jobs.reduce< Record<string, (JobPosition & { globalIdx: number })[]>>((acc, job, globalIdx) => {
      const dept = job.department || 'Đang cập nhật';
      if (!acc[dept]) {acc[dept] = [];}
      acc[dept].push({ ...job, globalIdx: globalIdx + 1 }); // Track global 1-based index
      return acc;
    }, {});

    return (
      <div className={cn("px-4", device === 'mobile' ? 'py-6' : 'py-10 md:py-16')}>
        <CareerHeader subtitle="Vị trí theo phòng ban" />
        <div className="max-w-4xl mx-auto relative">
          {/* Vertical timeline line */}
          <div className={cn("absolute top-0 bottom-0 w-0.5", device === 'mobile' ? 'left-4' : 'left-6')} style={{ backgroundColor: `${brandColor}20` }} />
          
          <div className="space-y-8">
            {Object.entries(groupedJobs).map(([department, deptJobs], deptIdx) => (
              <div key={deptIdx} className={cn("relative", device === 'mobile' ? 'pl-12' : 'pl-16')}>
                {/* Department Badge - shows department name initial */}
                <div 
                  className={cn("absolute rounded-full border-4 bg-white dark:bg-slate-900 flex items-center justify-center font-bold z-10", device === 'mobile' ? 'w-8 h-8 left-0 text-xs' : 'w-12 h-12 left-0 text-sm')} 
                  style={{ borderColor: brandColor, color: brandColor }}
                >
                  {department.charAt(0).toUpperCase()}
                </div>
                
                {/* Department Content */}
                <div>
                  <h4 className={cn("font-bold text-slate-900 dark:text-slate-100 mb-4", device === 'mobile' ? 'text-base' : 'text-lg')} style={{ color: brandColor }}>
                    {department}
                  </h4>
                  <ul className="space-y-3" role="list">
                    {deptJobs.map((job) => (
                      <li key={job.id}>
                        <article 
                          className="bg-white dark:bg-slate-800 rounded-xl border p-4 transition-all hover:shadow-md"
                          style={{ borderColor: `${brandColor}15` }}
                        >
                          <div className="flex items-start gap-3 mb-2">
                            {/* Job number badge */}
                            <div 
                              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5" 
                              style={{ backgroundColor: `${brandColor}15`, color: brandColor }}
                            >
                              {job.globalIdx}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h5 className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 flex-1">{job.title || 'Vị trí'}</h5>
                                <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{job.type || 'Full-time'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400 mb-3">
                            <div className="flex items-center gap-1">
                              <MapPin size={12} />
                              <span>{job.location || 'Remote'}</span>
                            </div>
                            {job.salary && (
                              <div className="flex items-center gap-1 font-medium" style={{ color: brandColor }}>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{job.salary}</span>
                              </div>
                            )}
                          </div>
                          <button className={cn("rounded-lg font-medium text-white", device === 'mobile' ? 'w-full py-2 text-sm' : 'px-5 py-2 text-sm')} style={{ backgroundColor: brandColor }}>
                            Ứng tuyển
                          </button>
                        </article>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <PreviewWrapper 
      title="Preview Careers" 
      device={device} 
      setDevice={setDevice} 
      previewStyle={previewStyle} 
      setPreviewStyle={setPreviewStyle} 
      styles={styles} 
      info={getJobsInfo()}
    >
      <BrowserFrame url="yoursite.com/careers">
        {previewStyle === 'cards' && renderCardsStyle()}
        {previewStyle === 'list' && renderListStyle()}
        {previewStyle === 'minimal' && renderMinimalStyle()}
        {previewStyle === 'table' && renderTableStyle()}
        {previewStyle === 'featured' && renderFeaturedStyle()}
        {previewStyle === 'timeline' && renderTimelineStyle()}
      </BrowserFrame>
    </PreviewWrapper>
  );
};

// ============ CONTACT PREVIEW ============
// 6 Professional Styles: Modern Split, Floating Card, Grid Cards, Elegant Clean, Minimal Form, Centered
// Best Practices: Clear labels, keyboard navigation, inline validation, ARIA attributes, social links, response time expectation
export interface ContactConfig {
  showMap: boolean;
  mapEmbed: string;
  address: string;
  phone: string;
  email: string;
  workingHours: string;
  formFields: string[];
  socialLinks: { id: number; platform: string; url: string }[];
  showForm?: boolean;
  formTitle?: string;
  formDescription?: string;
  submitButtonText?: string;
  responseTimeText?: string;
}
export type ContactStyle = 'modern' | 'floating' | 'grid' | 'elegant' | 'minimal' | 'centered' | 'kanban';

const getSocialIcon = (platform: string) => {
  switch (platform.toLowerCase()) {
    case 'facebook': { return Facebook;
    }
    case 'zalo': { return MessageCircle;
    }
    case 'instagram': { return Instagram;
    }
    case 'twitter': { return Twitter;
    }
    case 'linkedin': { return Linkedin;
    }
    case 'youtube': { return Youtube;
    }
    default: { return Globe;
    }
  }
};

export const ContactPreview = ({ config, brandColor, secondary, selectedStyle, onStyleChange }: { config: ContactConfig; brandColor: string;
  secondary: string; selectedStyle?: ContactStyle; onStyleChange?: (style: ContactStyle) => void }) => {
  const [device, setDevice] = useState<PreviewDevice>('desktop');
  const previewStyle = selectedStyle ?? 'modern';
  const setPreviewStyle = (s: string) => onStyleChange?.(s as ContactStyle);
  const styles = [
    { id: 'modern', label: 'Modern Split' }, 
    { id: 'floating', label: 'Floating Card' }, 
    { id: 'grid', label: 'Grid Cards' },
    { id: 'elegant', label: 'Elegant Clean' },
    { id: 'minimal', label: 'Minimal Form' },
    { id: 'centered', label: 'Centered' }
  ];
  
  const activeSocials = config.socialLinks?.filter(s => s.url) || [];

  const getInfoText = () => {
    const parts: string[] = [];
    if (config.showMap && config.mapEmbed) {parts.push('Có bản đồ');}
    else if (config.showMap) {parts.push('Bản đồ (chưa có URL)');}
    if (config.showForm !== false && (previewStyle === 'minimal' || previewStyle === 'centered')) {parts.push('Có form liên hệ');}
    if (activeSocials.length > 0) {parts.push(`${activeSocials.length} MXH`);}
    return parts.length > 0 ? parts.join(' • ') : 'Thông tin liên hệ cơ bản';
  };

  const renderSocialLinks = (size: number = 18, className: string = "") => {
    if (activeSocials.length === 0) {return null;}
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {activeSocials.map(social => {
          const Icon = getSocialIcon(social.platform);
          return (<a key={social.id} href={social.url || '#'} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full flex items-center justify-center transition-colors" style={{ backgroundColor: `${brandColor}10`, color: brandColor }} aria-label={social.platform}><Icon size={size} /></a>);
        })}
      </div>
    );
  };



  const renderMapOrPlaceholder = (className: string = "w-full h-full") => {
    if (config.mapEmbed) {
      return <iframe src={config.mapEmbed} className={`${className} border-0`} loading="lazy" title="Google Map" />;
    }
    return (
      <div className={`${className} bg-slate-100 dark:bg-slate-700 flex flex-col items-center justify-center text-slate-400`}>
        <Globe size={32} />
        <span className="text-xs mt-2">Chưa có URL bản đồ</span>
      </div>
    );
  };

  // Style 1: Modern Split - Chia đôi: thông tin bên trái, bản đồ bên phải
  const renderModernStyle = () => (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-700/40 rounded-xl overflow-hidden shadow-sm">
      <div className={cn("flex min-h-[400px]", device === 'mobile' ? 'flex-col' : 'flex-col lg:flex-row')}>
        {/* Left Content */}
        <div className={cn("p-6 lg:p-10 flex flex-col justify-center bg-white dark:bg-slate-800", device === 'mobile' ? 'w-full' : 'lg:w-1/2')}>
          <div className="max-w-md mx-auto w-full">
            <BrandBadge text="Thông tin liên hệ" variant="default" brandColor={brandColor} secondary={secondary} />
            <h2 className={cn("font-bold tracking-tight mb-6 text-slate-900 dark:text-slate-100", device === 'mobile' ? 'text-xl' : 'text-2xl')}>
              Kết nối với chúng tôi
            </h2>

            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <IconContainer icon={<MapPin size={16} />} variant="tint" size="sm" brandColor={brandColor} secondary={secondary} className="shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-0.5">Địa chỉ văn phòng</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{config.address || '123 Nguyễn Huệ, Q1, TP.HCM'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <IconContainer icon={<Mail size={16} />} variant="tint" size="sm" brandColor={brandColor} secondary={secondary} className="shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-0.5">Email & Điện thoại</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">{config.email || 'contact@example.com'}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{config.phone || '1900 1234'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <IconContainer icon={<Clock size={16} />} variant="tint" size="sm" brandColor={brandColor} secondary={secondary} className="shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-0.5">Giờ làm việc</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">{config.workingHours || 'Thứ 2 - Thứ 6: 8:00 - 17:00'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Map */}
        {config.showMap && (
          <div className={cn("bg-slate-100 dark:bg-slate-700 relative border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-700", device === 'mobile' ? 'w-full min-h-[200px]' : 'lg:w-1/2 min-h-[300px] lg:min-h-full')}>
            {renderMapOrPlaceholder("absolute inset-0")}
          </div>
        )}
      </div>
    </div>
  );

  // Style 2: Floating Card - Bản đồ nền với card thông tin nổi
  const renderFloatingStyle = () => (
    <div className={cn("w-full relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm group", device === 'mobile' ? 'h-[500px]' : 'h-[450px]')}>
      {/* Background Map */}
      <div className="absolute inset-0">
        {config.mapEmbed ? (
          <iframe src={config.mapEmbed} className="w-full h-full border-0 filter grayscale-[30%] group-hover:grayscale-0 transition-all duration-1000" loading="lazy" title="Google Map" />
        ) : (
          <div className="w-full h-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
            <Globe size={64} className="text-slate-300" />
          </div>
        )}
      </div>
      
      {/* Floating Card */}
      <div className={cn("absolute inset-0 pointer-events-none flex items-center p-4", device === 'mobile' ? 'justify-center' : 'justify-start lg:pl-12')}>
        <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm p-6 rounded-xl shadow-lg pointer-events-auto max-w-sm w-full border border-slate-200/50 dark:border-slate-700/50">
          <h2 className="text-lg font-bold mb-5 text-slate-900 dark:text-slate-100">Thông tin liên hệ</h2>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin size={16} className="mt-0.5 shrink-0" style={{ color: brandColor }} />
              <div>
                <p className="text-[10px] text-slate-500 font-medium uppercase mb-0.5">Địa chỉ</p>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed">{config.address || '123 Nguyễn Huệ, Q1, TP.HCM'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone size={16} className="mt-0.5 shrink-0" style={{ color: brandColor }} />
              <div>
                <p className="text-[10px] text-slate-500 font-medium uppercase mb-0.5">Hotline</p>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{config.phone || '1900 1234'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail size={16} className="mt-0.5 shrink-0" style={{ color: brandColor }} />
              <div>
                <p className="text-[10px] text-slate-500 font-medium uppercase mb-0.5">Email</p>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{config.email || 'contact@example.com'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock size={16} className="mt-0.5 shrink-0" style={{ color: brandColor }} />
              <div>
                <p className="text-[10px] text-slate-500 font-medium uppercase mb-0.5">Giờ làm việc</p>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{config.workingHours || 'T2-T6: 8:00-17:00'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Style 3: Grid Cards - 3 cards nhỏ + bản đồ phía dưới
  const renderGridStyle = () => (
    <div className="w-full bg-slate-50 dark:bg-slate-800/30 p-6 rounded-xl border border-slate-200/40 dark:border-slate-700/40">
      <div className={cn("grid gap-3 mb-6", device === 'mobile' ? 'grid-cols-1' : 'grid-cols-3')}>
        {/* Card 1: Phone */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow-sm border border-slate-200/60 dark:border-slate-700 flex flex-col items-center text-center">
          <IconContainer icon={<Phone size={18} />} variant="tint" size="sm" brandColor={brandColor} secondary={secondary} className="mb-3" />
          <h3 className="font-medium text-sm text-slate-500 dark:text-slate-400 mb-1">Điện thoại</h3>
          <p className="font-semibold text-slate-900 dark:text-slate-100">{config.phone || '1900 1234'}</p>
        </div>

        {/* Card 2: Email */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow-sm border border-slate-200/60 dark:border-slate-700 flex flex-col items-center text-center">
          <IconContainer icon={<Mail size={18} />} variant="tint" size="sm" brandColor={brandColor} secondary={secondary} className="mb-3" />
          <h3 className="font-medium text-sm text-slate-500 dark:text-slate-400 mb-1">Email</h3>
          <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{config.email || 'contact@example.com'}</p>
        </div>

        {/* Card 3: Working Hours */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow-sm border border-slate-200/60 dark:border-slate-700 flex flex-col items-center text-center">
          <IconContainer icon={<Clock size={18} />} variant="tint" size="sm" brandColor={brandColor} secondary={secondary} className="mb-3" />
          <h3 className="font-medium text-sm text-slate-500 dark:text-slate-400 mb-1">Giờ làm việc</h3>
          <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{config.workingHours || 'T2-T6: 8:00-17:00'}</p>
        </div>
      </div>

      {/* Address + Map */}
      <div className={cn("bg-white dark:bg-slate-800 p-5 rounded-lg border border-slate-200/60 dark:border-slate-700", device === 'mobile' ? 'flex flex-col gap-4' : 'flex flex-row gap-6')}>
        <div className={cn("flex flex-col justify-center", device === 'mobile' ? 'w-full' : 'w-1/3')}>
          <div className="flex items-start gap-3">
            <MapPin size={20} className="shrink-0 mt-0.5" style={{ color: brandColor }} />
            <div>
              <h3 className="font-bold text-base mb-1.5 text-slate-900 dark:text-slate-100">Trụ sở chính</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{config.address || '123 Nguyễn Huệ, Q1, TP.HCM'}</p>
            </div>
          </div>
        </div>
        {config.showMap && (
          <div className={cn("rounded-md overflow-hidden bg-slate-100 dark:bg-slate-700", device === 'mobile' ? 'w-full h-48' : 'w-2/3 h-52')}>
            {renderMapOrPlaceholder()}
          </div>
        )}
      </div>
    </div>
  );

  // Style 4: Elegant Clean - Header section + chia đôi info/bản đồ
  const renderElegantStyle = () => (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-700/40 rounded-xl shadow-sm overflow-hidden">
      {/* Top Header Section */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-6 border-b border-slate-200 dark:border-slate-700 text-center">
        <div className="flex justify-center mb-3">
          <IconContainer icon={<Building2 size={22} />} variant="tint" size="md" brandColor={brandColor} secondary={secondary} />
        </div>
        <h2 className={cn("font-bold tracking-tight text-slate-900 dark:text-slate-100", device === 'mobile' ? 'text-lg' : 'text-xl')}>Văn phòng của chúng tôi</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1.5 max-w-lg mx-auto text-sm">
          Thông tin liên hệ và vị trí bản đồ chính xác.
        </p>
      </div>

      <div className={cn("flex", device === 'mobile' ? 'flex-col' : 'flex-row')}>
        {/* Left Info List */}
        <div className={cn("p-6 space-y-0 divide-y divide-slate-200 dark:divide-slate-700", device === 'mobile' ? 'w-full' : 'w-5/12')}>
          <div className="py-4 first:pt-0">
            <p className="text-[10px] font-semibold uppercase text-slate-500 mb-1.5">Địa chỉ</p>
            <div className="flex items-start gap-2.5">
              <MapPin size={16} className="shrink-0 mt-0.5" style={{ color: brandColor }} />
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{config.address || '123 Nguyễn Huệ, Q1, TP.HCM'}</span>
            </div>
          </div>

          <div className="py-4">
            <p className="text-[10px] font-semibold uppercase text-slate-500 mb-1.5">Liên lạc</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <Phone size={16} className="shrink-0" style={{ color: brandColor }} />
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{config.phone || '1900 1234'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail size={16} className="shrink-0" style={{ color: brandColor }} />
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{config.email || 'contact@example.com'}</span>
              </div>
            </div>
          </div>

          <div className="py-4 last:pb-0">
            <p className="text-[10px] font-semibold uppercase text-slate-500 mb-1.5">Thời gian</p>
            <div className="flex items-center gap-2.5">
              <Clock size={16} className="shrink-0" style={{ color: brandColor }} />
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{config.workingHours || 'T2-T6: 8:00-17:00'}</span>
            </div>
          </div>
        </div>

        {/* Right Map */}
        {config.showMap && (
          <div className={cn("bg-slate-100 dark:bg-slate-700 relative border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-700", device === 'mobile' ? 'w-full min-h-[250px]' : 'w-7/12 min-h-[320px]')}>
            {renderMapOrPlaceholder("absolute inset-0")}
          </div>
        )}
      </div>
    </div>
  );

  // Style 5: Minimal - Layout tối giản với info ngang hàng
  const renderMinimalStyle = () => (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-700/40 rounded-xl overflow-hidden shadow-sm">
      <div className={cn("p-6 lg:p-10", device === 'mobile' ? '' : '')}>
        <div className="text-center mb-8">
          <h2 className={cn("font-bold tracking-tight text-slate-900 dark:text-slate-100", device === 'mobile' ? 'text-xl' : 'text-2xl')}>Liên hệ với chúng tôi</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Chúng tôi luôn sẵn sàng hỗ trợ bạn</p>
        </div>
        <div className={cn("grid gap-4", device === 'mobile' ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-4')}>
          <a href={`tel:${config.phone}`} className="flex flex-col items-center p-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md transition-all text-center group">
            <IconContainer icon={<Phone size={20} />} variant="tint" size="md" brandColor={brandColor} secondary={secondary} className="mb-3" />
            <span className="text-xs text-slate-500 mb-1">Điện thoại</span>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{config.phone || '1900 1234'}</span>
          </a>
          <a href={`mailto:${config.email}`} className="flex flex-col items-center p-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md transition-all text-center group">
            <IconContainer icon={<Mail size={20} />} variant="tint" size="md" brandColor={brandColor} secondary={secondary} className="mb-3" />
            <span className="text-xs text-slate-500 mb-1">Email</span>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate max-w-full">{config.email || 'contact@example.com'}</span>
          </a>
          <div className="flex flex-col items-center p-5 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
            <IconContainer icon={<MapPin size={20} />} variant="tint" size="md" brandColor={brandColor} secondary={secondary} className="mb-3" />
            <span className="text-xs text-slate-500 mb-1">Địa chỉ</span>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">{config.address || '123 Nguyễn Huệ, Q1, TP.HCM'}</span>
          </div>
          <div className="flex flex-col items-center p-5 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
            <IconContainer icon={<Clock size={20} />} variant="tint" size="md" brandColor={brandColor} secondary={secondary} className="mb-3" />
            <span className="text-xs text-slate-500 mb-1">Giờ làm việc</span>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{config.workingHours || 'T2-T6: 8:00-17:00'}</span>
          </div>
        </div>
        {(activeSocials.length > 0 || config.showMap) && (
          <div className={cn("mt-8 pt-6 border-t border-slate-200 dark:border-slate-700", device === 'mobile' ? 'flex flex-col gap-4' : 'flex items-center justify-between')}>
            {renderSocialLinks(18, "")}
            {config.showMap && (<div className={cn("rounded-lg overflow-hidden", device === 'mobile' ? 'w-full h-48' : 'w-80 h-32')}>{renderMapOrPlaceholder()}</div>)}
          </div>
        )}
      </div>
    </div>
  );

  // Style 6: Centered - Layout centered với icon lớn
  const renderCenteredStyle = () => (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-700/40 rounded-xl overflow-hidden shadow-sm">
      <div className="text-center p-6 lg:p-10" style={{ backgroundColor: `${brandColor}05` }}>
        <div className="flex justify-center mb-5">
          <IconContainer icon={<Phone size={28} />} variant="tint" size="lg" brandColor={brandColor} secondary={secondary} />
        </div>
        <h2 className={cn("font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-2", device === 'mobile' ? 'text-xl' : 'text-2xl')}>Hãy kết nối với chúng tôi</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">Đội ngũ của chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn</p>
      </div>
      <div className="p-6 lg:p-8">
        <div className={cn("grid gap-6", device === 'mobile' ? 'grid-cols-1' : 'grid-cols-3')}>
          <a href={`tel:${config.phone}`} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <IconContainer icon={<Phone size={18} />} variant="tint" size="md" brandColor={brandColor} secondary={secondary} className="shrink-0" />
            <div><p className="text-xs text-slate-500 mb-0.5">Hotline</p><p className="text-sm font-bold text-slate-900 dark:text-slate-100">{config.phone || '1900 1234'}</p></div>
          </a>
          <a href={`mailto:${config.email}`} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <IconContainer icon={<Mail size={18} />} variant="tint" size="md" brandColor={brandColor} secondary={secondary} className="shrink-0" />
            <div><p className="text-xs text-slate-500 mb-0.5">Email</p><p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{config.email || 'contact@example.com'}</p></div>
          </a>
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <IconContainer icon={<Clock size={18} />} variant="tint" size="md" brandColor={brandColor} secondary={secondary} className="shrink-0" />
            <div><p className="text-xs text-slate-500 mb-0.5">Giờ làm việc</p><p className="text-sm font-bold text-slate-900 dark:text-slate-100">{config.workingHours || 'T2-T6: 8:00-17:00'}</p></div>
          </div>
        </div>
        <div className={cn("mt-6 p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50", device === 'mobile' ? '' : 'flex items-start gap-6')}>
          <div className="flex items-start gap-3 flex-1">
            <IconContainer icon={<MapPin size={18} />} variant="tint" size="md" brandColor={brandColor} secondary={secondary} className="shrink-0" />
            <div><p className="text-xs text-slate-500 mb-0.5">Địa chỉ văn phòng</p><p className="text-sm font-medium text-slate-900 dark:text-slate-100">{config.address || '123 Nguyễn Huệ, Q1, TP.HCM'}</p></div>
          </div>
          {config.showMap && (<div className={cn("rounded-lg overflow-hidden shrink-0", device === 'mobile' ? 'w-full h-40 mt-4' : 'w-64 h-28')}>{renderMapOrPlaceholder()}</div>)}
        </div>
        {activeSocials.length > 0 && (<div className="mt-6 text-center">{renderSocialLinks(20, "justify-center")}</div>)}
      </div>
    </div>
  );

  return (
    <PreviewWrapper title="Preview Contact" device={device} setDevice={setDevice} previewStyle={previewStyle} setPreviewStyle={setPreviewStyle} styles={styles} info={getInfoText()}>
      <BrowserFrame url="yoursite.com/contact">
        {previewStyle === 'modern' && renderModernStyle()}
        {previewStyle === 'floating' && renderFloatingStyle()}
        {previewStyle === 'grid' && renderGridStyle()}
        {previewStyle === 'elegant' && renderElegantStyle()}
        {previewStyle === 'minimal' && renderMinimalStyle()}
        {previewStyle === 'centered' && renderCenteredStyle()}
      </BrowserFrame>
    </PreviewWrapper>
  );
};

// ============ SPEED DIAL PREVIEW ============
interface SpeedDialAction { id: number; icon: string; label: string; url: string; bgColor: string }
export type SpeedDialStyle = 'fab' | 'sidebar' | 'pills' | 'stack' | 'dock' | 'minimal';

const SpeedDialIcon = ({ name, size = 20 }: { name: string; size?: number }) => {
  const icons: Record<string, React.ReactNode> = {
    'calendar': <span className="inline-flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg></span>,
    'facebook': <span className="inline-flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></span>,
    'headphones': <span className="inline-flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/></svg></span>,
    'help-circle': <span className="inline-flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg></span>,
    'instagram': <span className="inline-flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg></span>,
    'mail': <Mail size={size} />,
    'map-pin': <MapPin size={size} />,
    'message-circle': <span className="inline-flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg></span>,
    'phone': <Phone size={size} />,
    'shopping-cart': <span className="inline-flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg></span>,
    'youtube': <span className="inline-flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg></span>,
    'zalo': <span className="inline-flex items-center justify-center text-[10px] font-bold">Zalo</span>,
  };
  return <>{icons[name] ?? <Plus size={size} />}</>;
};

export const SpeedDialPreview = ({ 
  config, 
  brandColor, 
  secondary: _secondary,
  selectedStyle, 
  onStyleChange 
}: { 
  config: {
    actions: SpeedDialAction[];
    style: SpeedDialStyle;
    position: 'bottom-right' | 'bottom-left';
    mainButtonColor: string;
    alwaysOpen?: boolean;
  };
  brandColor: string;
  secondary: string;
  selectedStyle?: SpeedDialStyle;
  onStyleChange?: (style: SpeedDialStyle) => void;
}) => {
  const [device, setDevice] = useState<PreviewDevice>('desktop');
  const previewStyle = (selectedStyle ?? config.style) || 'fab';
  const setPreviewStyle = (s: string) => onStyleChange?.(s as SpeedDialStyle);
  
  // BẮT BUỘC 6 styles theo Best Practice
  const styles = [
    { id: 'fab', label: 'FAB' },
    { id: 'sidebar', label: 'Sidebar' },
    { id: 'pills', label: 'Pills' },
    { id: 'stack', label: 'Stack' },
    { id: 'dock', label: 'Dock' },
    { id: 'minimal', label: 'Minimal' },
  ];

  const isRight = config.position !== 'bottom-left';
  const isMobile = device === 'mobile';
  const isTablet = device === 'tablet';
  const gap = isMobile ? 'gap-2' : 'gap-2.5';

  // Empty State
  const renderEmptyState = () => (
    <div className={cn("absolute flex flex-col items-center justify-center", isRight ? "right-4 bottom-4" : "left-4 bottom-4")}>
      <div className="w-14 h-14 rounded-full flex items-center justify-center mb-2 opacity-40" style={{ backgroundColor: `${brandColor}20` }}>
        <Plus size={24} style={{ color: brandColor }} />
      </div>
      <p className="text-xs text-slate-400 text-center max-w-[100px]">Thêm hành động</p>
    </div>
  );

  // Style 1: FAB - Floating Action Buttons (vertical stack)
  const renderFabStyle = () => (
    <div className={cn(
      "absolute bottom-4 flex flex-col gap-2",
      isRight ? "right-4 items-end" : "left-4 items-start"
    )}>
      {config.actions.map((action) => (
        <a
          key={action.id}
          href={action.url || '#'}
          className="group flex items-center gap-2"
        >
          {isRight && action.label && (
            <span className="px-2.5 py-1 bg-slate-900/90 text-white text-xs font-medium rounded-md shadow-lg opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap">
              {action.label}
            </span>
          )}
          <div
            className="w-11 h-11 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 hover:shadow-xl transition-all duration-200 cursor-pointer"
            style={{ backgroundColor: action.bgColor || brandColor }}
          >
            <SpeedDialIcon name={action.icon} size={18} />
          </div>
          {!isRight && action.label && (
            <span className="px-2.5 py-1 bg-slate-900/90 text-white text-xs font-medium rounded-md shadow-lg opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap">
              {action.label}
            </span>
          )}
        </a>
      ))}
    </div>
  );

  // Style 2: Sidebar - Vertical bar attached to edge
  const renderSidebarStyle = () => (
    <div className={cn(
      "absolute top-1/2 -translate-y-1/2 flex flex-col overflow-hidden shadow-xl",
      isRight ? "right-0 rounded-l-xl" : "left-0 rounded-r-xl"
    )}>
      {config.actions.map((action, idx) => (
        <a
          key={action.id}
          href={action.url || '#'}
          className="group relative flex items-center justify-center w-12 h-12 text-white hover:w-32 transition-all duration-200 overflow-hidden"
          style={{ backgroundColor: action.bgColor || brandColor }}
        >
          <div className={cn(
            "absolute flex items-center gap-2 transition-all duration-200",
            isRight ? "right-3" : "left-3"
          )}>
            <SpeedDialIcon name={action.icon} size={18} />
          </div>
          {action.label && (
            <span className={cn(
              "absolute text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200",
              isRight ? "right-10" : "left-10"
            )}>
              {action.label}
            </span>
          )}
          {idx < config.actions.length - 1 && (
            <div className="absolute bottom-0 left-2 right-2 h-px bg-white/20" />
          )}
        </a>
      ))}
    </div>
  );

  // Style 3: Pills - Rounded pills with labels
  const renderPillsStyle = () => (
    <div className={cn("absolute flex flex-col", gap, isRight ? "right-4 bottom-4 items-end" : "left-4 bottom-4 items-start")} role="group" aria-label="Liên hệ nhanh">
      {config.actions.map((action) => (
        <a key={action.id} href={action.url || '#'} className={cn("flex items-center rounded-full shadow-lg text-white hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer min-h-[44px]", isMobile ? "gap-2 pl-3 pr-4 py-2" : "gap-2.5 pl-4 pr-5 py-2.5", isRight ? "flex-row" : "flex-row-reverse")} style={{ backgroundColor: action.bgColor || brandColor }} aria-label={action.label || action.icon}>
          <SpeedDialIcon name={action.icon} size={isMobile ? 14 : 16} />
          {action.label && <span className={cn("font-medium whitespace-nowrap", isMobile ? "text-[11px]" : "text-xs")}>{action.label}</span>}
        </a>
      ))}
    </div>
  );

  // Style 4: Stack - Overlapping buttons
  const renderStackStyle = () => (
    <div className={cn("absolute flex flex-col items-center", isRight ? "right-4 bottom-4" : "left-4 bottom-4")} role="group" aria-label="Liên hệ nhanh">
      <div className="relative" style={{ height: `${Math.min(config.actions.length * 32 + 20, 180)}px` }}>
        {config.actions.map((action, idx) => (
          <a key={action.id} href={action.url || '#'} className={cn("group absolute left-1/2 -translate-x-1/2 flex items-center justify-center rounded-full shadow-lg text-white hover:scale-110 hover:z-50 transition-all duration-200 cursor-pointer", isMobile ? "w-10 h-10" : "w-11 h-11")} style={{ backgroundColor: action.bgColor || brandColor, bottom: `${idx * (isMobile ? 28 : 32)}px`, boxShadow: `0 4px 12px ${action.bgColor || brandColor}40`, zIndex: config.actions.length - idx }} aria-label={action.label || action.icon}>
            <SpeedDialIcon name={action.icon} size={isMobile ? 14 : 16} />
            {action.label && <span className={cn("absolute px-2 py-1 bg-slate-900/90 text-white text-xs font-medium rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap", isRight ? "right-full mr-2" : "left-full ml-2")}>{action.label}</span>}
          </a>
        ))}
      </div>
    </div>
  );

  // Style 5: Dock - MacOS dock style
  const renderDockStyle = () => (
    <div className={cn("absolute bottom-4 left-1/2 -translate-x-1/2 flex items-end justify-center rounded-2xl p-2", isMobile ? "gap-1" : "gap-1.5")} style={{ backdropFilter: 'blur(8px)', backgroundColor: `${brandColor}10` }} role="group" aria-label="Liên hệ nhanh">
      {config.actions.map((action) => (
        <a key={action.id} href={action.url || '#'} className={cn("group relative flex items-center justify-center rounded-xl text-white transition-all duration-200 cursor-pointer hover:scale-125 hover:-translate-y-2", isMobile ? "w-10 h-10" : "w-11 h-11")} style={{ backgroundColor: action.bgColor || brandColor, boxShadow: `0 4px 12px ${action.bgColor || brandColor}30` }} aria-label={action.label || action.icon}>
          <SpeedDialIcon name={action.icon} size={isMobile ? 14 : 16} />
          {action.label && <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900/90 text-white text-[10px] font-medium rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap">{action.label}</span>}
        </a>
      ))}
    </div>
  );

  // Style 6: Minimal - Icons only, compact bar
  const renderMinimalStyle = () => (
    <div className={cn("absolute flex items-center bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full shadow-lg px-2 py-1.5", isMobile ? "gap-1 bottom-3" : "gap-1.5 bottom-4", isRight ? "right-4" : "left-4")} style={{ boxShadow: `0 4px 20px ${brandColor}15` }} role="group" aria-label="Liên hệ nhanh">
      {config.actions.map((action, idx) => (
        <React.Fragment key={action.id}>
          <a href={action.url || '#'} className={cn("group relative flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer hover:scale-110", isMobile ? "w-9 h-9" : "w-10 h-10")} style={{ color: action.bgColor || brandColor }} aria-label={action.label || action.icon}>
            <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ backgroundColor: `${action.bgColor || brandColor}15` }} />
            <SpeedDialIcon name={action.icon} size={isMobile ? 16 : 18} />
            {action.label && <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900/90 text-white text-[10px] font-medium rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-10">{action.label}</span>}
          </a>
          {idx < config.actions.length - 1 && <div className="w-px h-5 bg-slate-200 dark:bg-slate-600" />}
        </React.Fragment>
      ))}
    </div>
  );

  // Dynamic info
  const getInfo = () => {
    const count = config.actions.length;
    if (count === 0) {return 'Chưa có hành động';}
    const styleInfo: Record<string, string> = { dock: 'Dock style (phóng to hover)', fab: 'Buttons dọc với tooltip', minimal: 'Chỉ icons, gọn nhẹ', pills: 'Nhãn luôn hiển thị', sidebar: 'Thanh cố định bên cạnh', stack: 'Buttons xếp chồng' };
    return `${count} hành động • ${styleInfo[previewStyle] || ''}`;
  };

  return (
    <PreviewWrapper title="Preview Speed Dial" device={device} setDevice={setDevice} previewStyle={previewStyle} setPreviewStyle={setPreviewStyle} styles={styles} info={getInfo()}>
      <BrowserFrame>
        <div className={cn("relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 overflow-hidden", isMobile ? "h-64" : (isTablet ? "h-72" : "h-80"))}>
          {/* Sample page content */}
          <div className={cn("space-y-2", isMobile ? "p-3" : "p-4")}>
            <div className={cn("bg-slate-200 dark:bg-slate-700 rounded", isMobile ? "h-4 w-32" : "h-5 w-40")} />
            <div className="h-3 w-full bg-slate-100 dark:bg-slate-700/50 rounded" />
            <div className="h-3 w-4/5 bg-slate-100 dark:bg-slate-700/50 rounded" />
            <div className={cn("grid gap-2 mt-3", isMobile ? "grid-cols-2" : "grid-cols-3")}>
              <div className={cn("bg-slate-100 dark:bg-slate-700/50 rounded-lg", isMobile ? "h-12" : "h-16")} />
              <div className={cn("bg-slate-100 dark:bg-slate-700/50 rounded-lg", isMobile ? "h-12" : "h-16")} />
              {!isMobile && <div className="h-16 bg-slate-100 dark:bg-slate-700/50 rounded-lg" />}
            </div>
          </div>
          
          {/* Speed Dial - 6 styles + empty state */}
          {config.actions.length === 0 ? renderEmptyState() : (
            <>
              {previewStyle === 'fab' && renderFabStyle()}
              {previewStyle === 'sidebar' && renderSidebarStyle()}
              {previewStyle === 'pills' && renderPillsStyle()}
              {previewStyle === 'stack' && renderStackStyle()}
              {previewStyle === 'dock' && renderDockStyle()}
              {previewStyle === 'minimal' && renderMinimalStyle()}
            </>
          )}
        </div>
      </BrowserFrame>
    </PreviewWrapper>
  );
};

// ============ TEAM PREVIEW ============
// Professional Team Section UI/UX - 6 Variants: Grid, Cards, Carousel, Hexagon, Timeline, Spotlight
interface TeamMember { id: number; name: string; role: string; avatar: string; bio: string; facebook: string; linkedin: string; twitter: string; email: string }
export type TeamStyle = 'grid' | 'cards' | 'carousel' | 'hexagon' | 'timeline' | 'spotlight';

export const TeamPreview = ({ members, brandColor, secondary: _secondary, selectedStyle, onStyleChange }: { 
  members: TeamMember[]; 
  brandColor: string;
  secondary: string; 
  selectedStyle?: TeamStyle; 
  onStyleChange?: (style: TeamStyle) => void 
}) => {
  const [device, setDevice] = useState<PreviewDevice>('desktop');
  const previewStyle = selectedStyle ?? 'grid';
  const setPreviewStyle = (s: string) => onStyleChange?.(s as TeamStyle);
  const styles = [
    { id: 'grid', label: 'Grid' }, 
    { id: 'cards', label: 'Cards' }, 
    { id: 'carousel', label: 'Carousel' },
    { id: 'hexagon', label: 'Marquee' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'spotlight', label: 'Spotlight' }
  ];

  // Dynamic image size info based on style (Best Practice)
  const getImageSizeInfo = () => {
    const count = members.length;
    if (count === 0) {return 'Chưa có thành viên';}
    switch (previewStyle) {
      case 'grid': { return `${count} thành viên • Avatar: 400×400px (1:1)`;
      }
      case 'cards': { return `${count} thành viên • Avatar: 160×160px (1:1)`;
      }
      case 'carousel': { return `${count} thành viên • Avatar: 600×450px (4:3) - Horizontal scroll`;
      }
      case 'hexagon': { return `${count} thành viên • Avatar: 160×160px (1:1) - Marquee scroll`;
      }
      case 'timeline': { return `${count} thành viên • Avatar: 100×100px (1:1)`;
      }
      case 'spotlight': { return `${count} thành viên • Avatar: 400×400px (1:1)`;
      }
      default: { return `${count} thành viên`;
      }
    }
  };

  // Max visible items per device for +N pattern
  const getMaxVisible = () => {
    switch (previewStyle) {
      case 'grid': { return device === 'mobile' ? 4 : 8;
      }
      case 'cards': { return device === 'mobile' ? 3 : 6;
      }
      case 'carousel': { return members.length;
      } // All members scrollable
      case 'hexagon': { return device === 'mobile' ? 4 : 5;
      } // Overlap style shows 4-5 avatars
      case 'timeline': { return device === 'mobile' ? 3 : 4;
      }
      case 'spotlight': { return device === 'mobile' ? 3 : 6;
      }
      default: { return 6;
      }
    }
  };

  const maxVisible = getMaxVisible();
  const visibleMembers = members.slice(0, maxVisible);
  const remainingCount = members.length - maxVisible;

  // +N remaining card component
  const RemainingCard = ({ isHexagon = false }: { isHexagon?: boolean }) => {
    if (isHexagon) {
      return (
        <div className="group relative">
          <div className={cn("relative", device === 'mobile' ? 'w-28 h-32' : 'w-36 h-40')} style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
            <div className="absolute inset-1 flex items-center justify-center" style={{ backgroundColor: '#f1f5f9', clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
              <div className="text-center">
                <span className="text-lg font-bold" style={{ color: brandColor }}>+{remainingCount}</span>
                <p className="text-[10px] text-slate-400">khác</p>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-2xl aspect-square max-w-[180px] mx-auto">
        <div className="text-center">
          <span className="text-xl font-bold" style={{ color: brandColor }}>+{remainingCount}</span>
          <p className="text-xs text-slate-400">thành viên</p>
        </div>
      </div>
    );
  };

  const SocialIcon = ({ type, url }: { type: 'facebook' | 'linkedin' | 'twitter' | 'email'; url: string }) => {
    if (!url) {return null;}
    const icons = {
      email: <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
      facebook: <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
      linkedin: <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
      twitter: <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
    };
    return (
      <a 
        href={type === 'email' ? `mailto:${url}` : url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
        style={{ backgroundColor: `${brandColor}15`, color: brandColor }}
      >
        {icons[type]}
      </a>
    );
  };

  // Style 1: Grid - Clean grid với hover effects + "+N" pattern
  const renderGridStyle = () => (
    <div className={cn("py-8 px-4", device === 'mobile' ? 'py-6' : '')}>
      <h3 className={cn("font-bold text-center mb-8", device === 'mobile' ? 'text-lg' : 'text-2xl')}>Đội ngũ của chúng tôi</h3>
      <div className={cn(
        "grid gap-6",
        device === 'mobile' ? 'grid-cols-2 gap-4' : (device === 'tablet' ? 'grid-cols-3' : 'grid-cols-4')
      )}>
        {visibleMembers.map((member) => (
          <div key={member.id} className="group text-center">
            <div className="relative mb-4 mx-auto overflow-hidden rounded-2xl aspect-square max-w-[180px]">
              {member.avatar ? (
                <PreviewImage 
                  src={member.avatar} 
                  alt={member.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                />
              ) : (
                <div 
                  className="w-full h-full flex items-center justify-center text-3xl font-bold text-white"
                  style={{ backgroundColor: brandColor }}
                >
                  {(member.name || 'U').charAt(0)}
                </div>
              )}
              {/* Social overlay on hover */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-2">
                <SocialIcon type="facebook" url={member.facebook} />
                <SocialIcon type="linkedin" url={member.linkedin} />
                <SocialIcon type="twitter" url={member.twitter} />
                <SocialIcon type="email" url={member.email} />
              </div>
            </div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">{member.name || 'Họ và tên'}</h4>
            <p className="text-sm mt-1" style={{ color: brandColor }}>{member.role || 'Chức vụ'}</p>
          </div>
        ))}
        {/* +N remaining */}
        {remainingCount > 0 && (
          <div className="text-center">
            <RemainingCard />
            <p className="text-sm mt-4 text-slate-500">thành viên</p>
          </div>
        )}
      </div>
    </div>
  );

  // Style 2: Cards - Horizontal cards với bio + equal height + "+N" pattern
  const renderCardsStyle = () => (
    <div className={cn("py-8 px-4", device === 'mobile' ? 'py-6' : '')}>
      <h3 className={cn("font-bold text-center mb-8", device === 'mobile' ? 'text-lg' : 'text-2xl')}>Đội ngũ của chúng tôi</h3>
      <div className={cn(
        "grid gap-6",
        device === 'mobile' ? 'grid-cols-1' : (device === 'tablet' ? 'grid-cols-2' : 'grid-cols-3')
      )}>
        {visibleMembers.map((member) => (
          <div 
            key={member.id} 
            className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 flex gap-4 items-start group hover:shadow-md transition-shadow h-full"
          >
            <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden">
              {member.avatar ? (
                <PreviewImage src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
              ) : (
                <div 
                  className="w-full h-full flex items-center justify-center text-xl font-bold text-white"
                  style={{ backgroundColor: brandColor }}
                >
                  {(member.name || 'U').charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{member.name || 'Họ và tên'}</h4>
              <p className="text-sm mb-2" style={{ color: brandColor }}>{member.role || 'Chức vụ'}</p>
              {/* Equal height bio with min-height */}
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[2.5rem]">{member.bio || ''}</p>
              <div className="flex gap-1.5 mt-auto pt-3">
                {member.facebook && <SocialIcon type="facebook" url={member.facebook} />}
                {member.linkedin && <SocialIcon type="linkedin" url={member.linkedin} />}
                {member.twitter && <SocialIcon type="twitter" url={member.twitter} />}
                {member.email && <SocialIcon type="email" url={member.email} />}
              </div>
            </div>
          </div>
        ))}
        {/* +N remaining */}
        {remainingCount > 0 && (
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center">
            <div className="text-center">
              <span className="text-2xl font-bold" style={{ color: brandColor }}>+{remainingCount}</span>
              <p className="text-sm text-slate-500 mt-1">thành viên khác</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Style 3: Carousel - Horizontal scroll với partial peek (Best Practice: 10-20% của card tiếp theo visible)
  const renderCarouselStyle = () => {
    const cardWidth = device === 'mobile' ? 280 : (device === 'tablet' ? 260 : 280);
    const gap = device === 'mobile' ? 12 : 16;
    
    return (
      <div className={cn("py-8 relative", device === 'mobile' ? 'py-6' : '')}>
        {/* Header với navigation */}
        <div className={cn("flex items-center justify-between mb-6", device === 'mobile' ? 'px-4' : 'px-6')}>
          <div>
            <h3 className={cn("font-bold text-slate-900 dark:text-slate-100", device === 'mobile' ? 'text-lg' : 'text-2xl')}>
              Đội ngũ của chúng tôi
            </h3>
            <p className="text-sm text-slate-500 mt-1">Vuốt để xem thêm →</p>
          </div>
          {/* Navigation arrows */}
          {members.length > 2 && (
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => {
                  const container = document.getElementById(`team-carousel-${device}`);
                  if (container) {container.scrollBy({ behavior: 'smooth', left: -cardWidth - gap });}
                }}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 shadow-md hover:shadow-lg text-slate-700 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-600"
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                type="button"
                onClick={() => {
                  const container = document.getElementById(`team-carousel-${device}`);
                  if (container) {container.scrollBy({ behavior: 'smooth', left: cardWidth + gap });}
                }}
                className="w-9 h-9 rounded-full flex items-center justify-center text-white shadow-md hover:shadow-lg transition-all"
                style={{ backgroundColor: brandColor }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
        
        {/* Carousel container - contained với fade edges */}
        <div className="px-4 md:px-6">
          <div className="relative overflow-hidden rounded-xl">
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-10 md:w-16 bg-gradient-to-r from-white dark:from-slate-900 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-10 md:w-16 bg-gradient-to-l from-white dark:from-slate-900 to-transparent z-10 pointer-events-none" />
            
            {/* Scrollable area - hidden scrollbar, mouse drag enabled */}
            <div 
              id={`team-carousel-${device}`}
              className="team-carousel-scroll flex overflow-x-auto snap-x snap-mandatory py-3 px-2 cursor-grab active:cursor-grabbing select-none"
              style={{ gap: `${gap}px` }}
              onMouseDown={(e) => {
                const el = e.currentTarget;
                el.dataset.isDown = 'true';
                el.dataset.startX = String(e.pageX - el.offsetLeft);
                el.dataset.scrollLeft = String(el.scrollLeft);
                el.style.scrollBehavior = 'auto';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.dataset.isDown = 'false';
                e.currentTarget.style.scrollBehavior = 'smooth';
              }}
              onMouseUp={(e) => {
                e.currentTarget.dataset.isDown = 'false';
                e.currentTarget.style.scrollBehavior = 'smooth';
              }}
              onMouseMove={(e) => {
                const el = e.currentTarget;
                if (el.dataset.isDown !== 'true') {return;}
                e.preventDefault();
                const x = e.pageX - el.offsetLeft;
                const walk = (x - Number(el.dataset.startX)) * 1.5;
                el.scrollLeft = Number(el.dataset.scrollLeft) - walk;
              }}
            >
            {members.map((member) => (
              <div 
                key={member.id} 
                className="flex-shrink-0 snap-start group"
                style={{ width: cardWidth }}
              >
                {/* Card */}
                <div 
                  className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700 transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 h-full"
                  style={{ borderBottomColor: brandColor, borderBottomWidth: '3px' }}
                >
                  {/* Avatar */}
                  <div className="aspect-[4/3] relative overflow-hidden bg-slate-100 dark:bg-slate-700">
                    {member.avatar ? (
                      <PreviewImage 
                        src={member.avatar} 
                        alt={member.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      />
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center text-5xl font-bold text-white"
                        style={{ backgroundColor: brandColor }}
                      >
                        {(member.name || 'U').charAt(0)}
                      </div>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="p-5">
                    <h4 className="font-bold text-lg text-slate-900 dark:text-slate-100 truncate">{member.name || 'Họ và tên'}</h4>
                    <p className="text-sm mt-0.5 truncate" style={{ color: brandColor }}>{member.role || 'Chức vụ'}</p>
                    {member.bio && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 line-clamp-2">{member.bio}</p>
                    )}
                    {/* Social */}
                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                      {member.facebook && <SocialIcon type="facebook" url={member.facebook} />}
                      {member.linkedin && <SocialIcon type="linkedin" url={member.linkedin} />}
                      {member.twitter && <SocialIcon type="twitter" url={member.twitter} />}
                      {member.email && <SocialIcon type="email" url={member.email} />}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {/* Spacer for partial peek effect */}
            <div className="flex-shrink-0 w-4" />
            </div>
          </div>
        </div>

        {/* CSS to hide scrollbar */}
        <style>{`
          .team-carousel-scroll {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .team-carousel-scroll::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>
    );
  };

  // Style 4: Marquee - Modern infinite scroll with featured member (Best Practice: Eye-catching, dynamic)
  const renderHexagonStyle = () => {
    const featured = members[0];
    const marqueeMembers = members.length > 1 ? [...members, ...members] : members; // Duplicate for infinite effect
    const cardSize = device === 'mobile' ? 140 : 160;
    
    return (
      <div className={cn("py-10 overflow-hidden", device === 'mobile' ? 'py-8' : '')}>
        {/* Header */}
        <div className="text-center mb-8 px-4">
          <span 
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-3"
            style={{ backgroundColor: `${brandColor}10`, color: brandColor }}
          >
            <Users size={14} />
            Đội ngũ của chúng tôi
          </span>
          <h3 className={cn("font-bold text-slate-900 dark:text-slate-100", device === 'mobile' ? 'text-xl' : 'text-2xl')}>
            Những con người tuyệt vời
          </h3>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            Đội ngũ tài năng và đam mê đứng sau thành công của chúng tôi
          </p>
        </div>

        {/* Marquee Row - Contained infinite scroll */}
        <div className="mb-8 px-4">
          <div className="relative overflow-hidden rounded-xl">
            {/* Gradient fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-12 md:w-20 bg-gradient-to-r from-white dark:from-slate-900 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-12 md:w-20 bg-gradient-to-l from-white dark:from-slate-900 to-transparent z-10 pointer-events-none" />
            
            {/* Scrolling container */}
            <div 
              className="flex gap-4 py-3"
              style={{ 
                animation: members.length > 2 ? 'marquee 20s linear infinite' : 'none',
                width: 'max-content'
              }}
            >
            {marqueeMembers.map((member, idx) => (
              <div 
                key={`${member.id}-${idx}`}
                className="group flex-shrink-0 text-center"
                style={{ width: cardSize }}
              >
                {/* Avatar */}
                <div 
                  className="relative mx-auto mb-3 rounded-2xl overflow-hidden shadow-md transition-all duration-300 group-hover:shadow-xl group-hover:scale-105"
                  style={{ height: cardSize, width: cardSize }}
                >
                  {member.avatar ? (
                    <PreviewImage 
                      src={member.avatar} 
                      alt={member.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center text-4xl font-bold text-white"
                      style={{ backgroundColor: brandColor }}
                    >
                      {(member.name || 'U').charAt(0)}
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div 
                    className="absolute inset-0 flex items-end justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: `linear-gradient(to top, ${brandColor}ee, transparent)` }}
                  >
                    <div className="flex gap-1 pb-3">
                      {member.facebook && <SocialIcon type="facebook" url={member.facebook} />}
                      {member.linkedin && <SocialIcon type="linkedin" url={member.linkedin} />}
                      {member.email && <SocialIcon type="email" url={member.email} />}
                    </div>
                  </div>
                </div>
                {/* Name & Role */}
                <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate px-1">
                  {member.name || 'Họ và tên'}
                </h4>
                <p className="text-xs truncate px-1" style={{ color: brandColor }}>
                  {member.role || 'Chức vụ'}
                </p>
              </div>
            ))}
            </div>
          </div>
        </div>

        {/* Featured Member Card */}
        {featured && (
          <div className="max-w-2xl mx-auto px-4">
            <div 
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-5 items-center"
              style={{ borderTopColor: brandColor, borderTopWidth: '3px' }}
            >
              {/* Large Avatar */}
              <div className="flex-shrink-0 w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden shadow-md">
                {featured.avatar ? (
                  <PreviewImage src={featured.avatar} alt={featured.name} className="w-full h-full object-cover" />
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center text-3xl font-bold text-white"
                    style={{ backgroundColor: brandColor }}
                  >
                    {(featured.name || 'U').charAt(0)}
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <h4 className="font-bold text-xl text-slate-900 dark:text-slate-100">
                  {featured.name || 'Họ và tên'}
                </h4>
                <p className="text-sm font-medium mb-2" style={{ color: brandColor }}>
                  {featured.role || 'Chức vụ'}
                </p>
                {featured.bio && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                    {featured.bio}
                  </p>
                )}
                <div className="flex gap-2 justify-center md:justify-start">
                  {featured.facebook && <SocialIcon type="facebook" url={featured.facebook} />}
                  {featured.linkedin && <SocialIcon type="linkedin" url={featured.linkedin} />}
                  {featured.twitter && <SocialIcon type="twitter" url={featured.twitter} />}
                  {featured.email && <SocialIcon type="email" url={featured.email} />}
                </div>
              </div>
              {/* Team count badge */}
              <div 
                className="flex-shrink-0 w-16 h-16 rounded-full flex flex-col items-center justify-center"
                style={{ backgroundColor: `${brandColor}10` }}
              >
                <span className="text-xl font-bold" style={{ color: brandColor }}>{members.length}</span>
                <span className="text-[10px] text-slate-500">members</span>
              </div>
            </div>
          </div>
        )}

        {/* CSS Animation */}
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </div>
    );
  };

  // Style 5: Timeline - Dạng timeline sang trọng
  const renderTimelineStyle = () => (
    <div className={cn("py-8 px-4", device === 'mobile' ? 'py-6' : '')}>
      <div className="text-center mb-8">
        <h3 className={cn("font-bold text-slate-900 dark:text-slate-100 mb-2", device === 'mobile' ? 'text-lg' : 'text-2xl')}>
          Đội ngũ của chúng tôi
        </h3>
        <div 
          className="w-16 h-1 mx-auto rounded-full"
          style={{ background: `linear-gradient(90deg, transparent, ${brandColor}, transparent)` }}
        />
      </div>
      
      <div className="relative max-w-3xl mx-auto">
        {/* Timeline line */}
        <div 
          className={cn(
            "absolute top-0 bottom-0 w-0.5",
            device === 'mobile' ? 'left-4' : 'left-1/2 -translate-x-1/2'
          )}
          style={{ background: `linear-gradient(to bottom, transparent, ${brandColor}30, ${brandColor}30, transparent)` }}
        />
        
        <div className="space-y-6">
          {members.slice(0, device === 'mobile' ? 3 : 4).map((member, idx) => {
            const isEven = idx % 2 === 0;
            return (
              <div 
                key={member.id} 
                className={cn(
                  "relative flex items-center gap-4",
                  device === 'mobile' ? '' : (isEven ? 'flex-row' : 'flex-row-reverse')
                )}
              >
                {/* Timeline dot */}
                <div 
                  className={cn(
                    "absolute w-3 h-3 rounded-full border-2 border-white shadow-md z-10",
                    device === 'mobile' ? 'left-4 -translate-x-1/2' : 'left-1/2 -translate-x-1/2'
                  )}
                  style={{ backgroundColor: brandColor }}
                />
                
                {/* Content card */}
                <div className={cn(
                  "flex-1",
                  device === 'mobile' ? 'ml-8' : (isEven ? 'pr-8 text-right' : 'pl-8')
                )}>
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border border-slate-100 dark:border-slate-700">
                    <div className={cn(
                      "flex items-center gap-3",
                      device !== 'mobile' && isEven ? 'flex-row-reverse' : ''
                    )}>
                      {/* Avatar */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden ring-2 ring-white shadow-sm">
                        {member.avatar ? (
                          <PreviewImage src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          <div 
                            className="w-full h-full flex items-center justify-center text-lg font-bold text-white"
                            style={{ backgroundColor: brandColor }}
                          >
                            {(member.name || 'U').charAt(0)}
                          </div>
                        )}
                      </div>
                      
                      {/* Info */}
                      <div className={cn("flex-1 min-w-0", device !== 'mobile' && isEven ? 'text-right' : '')}>
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{member.name || 'Họ và tên'}</h4>
                        <p className="text-xs" style={{ color: brandColor }}>{member.role || 'Chức vụ'}</p>
                      </div>
                    </div>
                    {member.bio && (
                      <p className={cn(
                        "text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2",
                        device !== 'mobile' && isEven ? 'text-right' : ''
                      )}>{member.bio}</p>
                    )}
                  </div>
                </div>
                
                {/* Spacer for opposite side on desktop */}
                {device !== 'mobile' && <div className="flex-1" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // Style 6: Spotlight - Glassmorphism với hiệu ứng ánh sáng
  const renderSpotlightStyle = () => (
    <div 
      className={cn("py-8 px-4 relative overflow-hidden", device === 'mobile' ? 'py-6' : '')}
      style={{ background: `linear-gradient(135deg, ${brandColor}08 0%, #f8fafc 50%, ${brandColor}05 100%)` }}
    >
      {/* Decorative background elements */}
      <div 
        className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 blur-3xl"
        style={{ background: `radial-gradient(circle, ${brandColor}40, transparent)` }}
      />
      <div 
        className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-15 blur-3xl"
        style={{ background: `radial-gradient(circle, ${brandColor}30, transparent)` }}
      />
      
      <div className="relative">
        <div className="text-center mb-8">
          <h3 className={cn("font-bold text-slate-900 dark:text-slate-100 mb-2", device === 'mobile' ? 'text-lg' : 'text-2xl')}>
            Đội ngũ của chúng tôi
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Những con người tài năng đứng sau thành công</p>
        </div>
        
        <div className={cn(
          "grid gap-5",
          device === 'mobile' ? 'grid-cols-1' : (device === 'tablet' ? 'grid-cols-2' : 'grid-cols-3')
        )}>
          {members.slice(0, device === 'mobile' ? 3 : 6).map((member) => (
            <div key={member.id} className="group relative">
              {/* Glow effect behind card */}
              <div 
                className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-lg"
                style={{ background: `linear-gradient(135deg, ${brandColor}40, ${brandColor}20)` }}
              />
              
              {/* Main card with glassmorphism */}
              <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-5 border border-white/50 dark:border-slate-700/50 shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                {/* Spotlight effect */}
                <div 
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-500"
                  style={{ 
                    background: `radial-gradient(circle, ${brandColor}, transparent)`,
                    filter: 'blur(15px)'
                  }}
                />
                
                {/* Avatar with ring effect */}
                <div className="relative mx-auto w-20 h-20 mb-4">
                  <div 
                    className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ 
                      background: `conic-gradient(from 0deg, ${brandColor}, ${brandColor}40, ${brandColor})`,
                      padding: '2px'
                    }}
                  />
                  <div className="absolute inset-0.5 rounded-full bg-white dark:bg-slate-800" />
                  <div className="absolute inset-1.5 rounded-full overflow-hidden">
                    {member.avatar ? (
                      <PreviewImage 
                        src={member.avatar} 
                        alt={member.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center text-2xl font-bold text-white"
                        style={{ backgroundColor: brandColor }}
                      >
                        {(member.name || 'U').charAt(0)}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Info */}
                <div className="text-center relative">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-0.5">{member.name || 'Họ và tên'}</h4>
                  <p 
                    className="text-xs font-medium mb-2"
                    style={{ color: brandColor }}
                  >
                    {member.role || 'Chức vụ'}
                  </p>
                  
                  {member.bio && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{member.bio}</p>
                  )}
                  
                  {/* Social icons with glass effect */}
                  <div className="flex justify-center gap-2">
                    {member.facebook && <SocialIcon type="facebook" url={member.facebook} />}
                    {member.linkedin && <SocialIcon type="linkedin" url={member.linkedin} />}
                    {member.twitter && <SocialIcon type="twitter" url={member.twitter} />}
                    {member.email && <SocialIcon type="email" url={member.email} />}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <PreviewWrapper 
      title="Preview Team" 
      device={device} 
      setDevice={setDevice} 
      previewStyle={previewStyle} 
      setPreviewStyle={setPreviewStyle} 
      styles={styles} 
      info={getImageSizeInfo()}
    >
      <BrowserFrame>
        {previewStyle === 'grid' && renderGridStyle()}
        {previewStyle === 'cards' && renderCardsStyle()}
        {previewStyle === 'carousel' && renderCarouselStyle()}
        {previewStyle === 'hexagon' && renderHexagonStyle()}
        {previewStyle === 'timeline' && renderTimelineStyle()}
        {previewStyle === 'spotlight' && renderSpotlightStyle()}
      </BrowserFrame>
    </PreviewWrapper>
  );
};

// ============ FEATURES PREVIEW (Product Features) ============
// 6 Professional Styles: Icon Grid, Alternating, Compact, Cards, Carousel, Timeline
interface FeatureItem { id: number; icon: string; title: string; description: string }
export type FeaturesStyle = 'iconGrid' | 'alternating' | 'compact' | 'cards' | 'carousel' | 'timeline';

const featureIcons: Record<string, React.ElementType> = { Check, Cpu, Globe, Layers, Rocket, Settings, Shield, Star, Target, Zap };

export const FeaturesPreview = ({ items, brandColor: _brandColor, secondary, mode: _mode, selectedStyle, onStyleChange }: { items: FeatureItem[]; brandColor: string;
  secondary: string; mode?: 'single' | 'dual'; selectedStyle?: FeaturesStyle; onStyleChange?: (style: FeaturesStyle) => void }) => {
  const [device, setDevice] = useState<PreviewDevice>('desktop');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const previewStyle = selectedStyle ?? 'iconGrid';
  const setPreviewStyle = (s: string) => onStyleChange?.(s as FeaturesStyle);
  const styles = [
    { id: 'iconGrid', label: 'Icon Grid' }, { id: 'alternating', label: 'Alternating' }, { id: 'compact', label: 'Compact' },
    { id: 'cards', label: 'Cards' }, { id: 'carousel', label: 'Carousel' }, { id: 'timeline', label: 'Timeline' }
  ];

  const getIcon = (iconName: string) => featureIcons[iconName] || Zap;
  const MAX_VISIBLE = device === 'mobile' ? 4 : 6;

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: `${secondary}10` }}><Zap size={32} style={{ color: secondary }} /></div>
      <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1">Chưa có tính năng nào</h3>
      <p className="text-sm text-slate-500">Thêm tính năng đầu tiên để bắt đầu</p>
    </div>
  );

  const renderIconGridStyle = () => {
    if (items.length === 0) {return renderEmptyState();}
    const visibleItems = items.slice(0, MAX_VISIBLE);
    const remainingCount = items.length - MAX_VISIBLE;
    const gridClass = cn("grid gap-4 md:gap-6", items.length === 1 ? 'max-w-md mx-auto' : items.length === 2 ? 'max-w-2xl mx-auto grid-cols-2' : device === 'mobile' ? 'grid-cols-1' : device === 'tablet' ? 'grid-cols-2' : 'grid-cols-3');
    return (
      <div className={cn("py-8 px-4", device === 'mobile' ? 'py-6 px-3' : 'md:py-12 md:px-6')}>
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3" style={{ backgroundColor: `${secondary}15`, color: secondary }}><Zap size={12} />Tính năng</div>
          <h2 className={cn("font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-3", device === 'mobile' ? 'text-2xl' : 'text-3xl md:text-4xl')}>Tính năng nổi bật</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">Khám phá những tính năng ưu việt giúp bạn đạt hiệu quả tối đa</p>
        </div>
        <div className={gridClass}>
          {visibleItems.map((item, idx) => {
            const IconComponent = getIcon(item.icon);
            return (
              <div key={`${item.id ?? 'feature'}-${idx}`} className="group bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:border-transparent hover:shadow-xl transition-all duration-300 flex flex-col h-full">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-300" style={{ background: `linear-gradient(135deg, ${secondary} 0%, ${secondary}cc 100%)`, boxShadow: `0 8px 16px -4px ${secondary}40` }}><IconComponent size={24} className="text-white" strokeWidth={2} /></div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-2 line-clamp-1">{item.title || 'Tên tính năng'}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 min-h-[2.5rem]">{item.description || 'Mô tả tính năng...'}</p>
              </div>
            );
          })}
          {remainingCount > 0 && (<div className="flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-2xl aspect-square border-2 border-dashed border-slate-300 dark:border-slate-600"><div className="text-center"><Plus size={32} className="mx-auto mb-2 text-slate-400" /><span className="text-lg font-bold text-slate-600 dark:text-slate-300">+{remainingCount}</span><p className="text-xs text-slate-400">tính năng khác</p></div></div>)}
        </div>
      </div>
    );
  };

  const renderAlternatingStyle = () => {
    if (items.length === 0) {return renderEmptyState();}
    const maxItems = device === 'mobile' ? 4 : 6;
    const visibleItems = items.slice(0, maxItems);
    const remainingCount = items.length - maxItems;
    return (
      <div className={cn("py-6 px-4", device === 'mobile' ? 'py-4 px-3' : 'md:py-10 md:px-6')}>
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2" style={{ backgroundColor: `${secondary}15`, color: secondary }}><Zap size={12} />Tính năng</div>
          <h2 className={cn("font-bold tracking-tight text-slate-900 dark:text-slate-100", device === 'mobile' ? 'text-xl' : 'text-2xl md:text-3xl')}>Tính năng nổi bật</h2>
        </div>
        <div className={cn("max-w-3xl mx-auto", device === 'mobile' ? 'space-y-2' : 'grid grid-cols-2 gap-3')}>
          {visibleItems.map((item, idx) => {
            const IconComponent = getIcon(item.icon);
            return (
              <div key={`${item.id ?? 'feature'}-${idx}`} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${secondary}15` }}><IconComponent size={18} style={{ color: secondary }} strokeWidth={2} /></div>
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center" style={{ backgroundColor: secondary }}>{idx + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">{item.title || 'Tên tính năng'}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{item.description || 'Mô tả tính năng...'}</p>
                </div>
              </div>
            );
          })}
        </div>
        {remainingCount > 0 && (<div className="text-center mt-4"><span className="text-sm" style={{ color: secondary }}>+{remainingCount} tính năng khác</span></div>)}
      </div>
    );
  };

  const renderCompactStyle = () => {
    if (items.length === 0) {return renderEmptyState();}
    const maxItems = device === 'mobile' ? 4 : 8;
    const visibleItems = items.slice(0, maxItems);
    const remainingCount = items.length - maxItems;
    return (
      <div className={cn("py-8 px-4", device === 'mobile' ? 'py-6 px-3' : 'md:py-12 md:px-6')}>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b-2 mb-6" style={{ borderColor: `${secondary}20` }}>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider" style={{ backgroundColor: `${secondary}15`, color: secondary }}><Zap size={12} />Tính năng</div>
            <h2 className={cn("font-bold tracking-tight text-slate-900 dark:text-slate-100", device === 'mobile' ? 'text-xl' : 'text-2xl md:text-3xl')}>Tính năng nổi bật</h2>
          </div>
          {remainingCount > 0 && <span className="text-sm text-slate-500">+{remainingCount} tính năng khác</span>}
        </div>
        <div className={cn("grid gap-3", device === 'mobile' ? 'grid-cols-1' : (device === 'tablet' ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'))}>
          {visibleItems.map((item, idx) => {
            const IconComponent = getIcon(item.icon);
            return (
              <div key={`${item.id ?? 'feature'}-${idx}`} className="flex items-start gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${secondary}15` }}><IconComponent size={18} style={{ color: secondary }} strokeWidth={2} /></div>
                <div className="flex-1 min-w-0"><h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-0.5 truncate">{item.title || 'Tính năng'}</h3><p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[2rem]">{item.description || 'Mô tả...'}</p></div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCardsStyle = () => {
    if (items.length === 0) {return renderEmptyState();}
    const visibleItems = items.slice(0, MAX_VISIBLE);
    const remainingCount = items.length - MAX_VISIBLE;
    return (
      <div className={cn("py-8 px-4", device === 'mobile' ? 'py-6 px-3' : 'md:py-12 md:px-6')}>
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3" style={{ backgroundColor: `${secondary}15`, color: secondary }}><Zap size={12} />Tính năng</div>
          <h2 className={cn("font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-3", device === 'mobile' ? 'text-2xl' : 'text-3xl md:text-4xl')}>Tính năng nổi bật</h2>
        </div>
        <div className={cn("grid gap-5", items.length === 1 ? 'max-w-sm mx-auto' : items.length === 2 ? 'max-w-2xl mx-auto grid-cols-2' : device === 'mobile' ? 'grid-cols-1' : device === 'tablet' ? 'grid-cols-2' : 'grid-cols-3')}>
          {visibleItems.map((item, idx) => {
            const IconComponent = getIcon(item.icon);
            return (
              <div key={`${item.id ?? 'feature'}-${idx}`} className="group relative bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 flex flex-col">
                <div className="h-1" style={{ backgroundColor: secondary }} />
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${secondary}15` }}><IconComponent size={22} style={{ color: secondary }} strokeWidth={2} /></div>
                    <span className="text-3xl font-bold opacity-20" style={{ color: secondary }}>{String(idx + 1).padStart(2, '0')}</span>
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-2 line-clamp-1">{item.title || 'Tên tính năng'}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3 min-h-[3.75rem] flex-1">{item.description || 'Mô tả tính năng...'}</p>
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700"><span className="inline-flex items-center gap-1 text-sm font-medium group-hover:gap-2 transition-all" style={{ color: secondary }}>Tìm hiểu thêm <ArrowRight size={14} /></span></div>
                </div>
              </div>
            );
          })}
          {remainingCount > 0 && (<div className="flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 min-h-[250px]"><div className="text-center"><Plus size={32} className="mx-auto mb-2 text-slate-400" /><span className="text-lg font-bold text-slate-600 dark:text-slate-300">+{remainingCount}</span><p className="text-xs text-slate-400">tính năng khác</p></div></div>)}
        </div>
      </div>
    );
  };

  const renderCarouselStyle = () => {
    if (items.length === 0) {return renderEmptyState();}
    const itemsPerView = device === 'mobile' ? 1 : (device === 'tablet' ? 2 : 3);
    const maxIndex = Math.max(0, items.length - itemsPerView);
    return (
      <div className={cn("py-8 px-4", device === 'mobile' ? 'py-6 px-3' : 'md:py-12 md:px-6')}>
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3" style={{ backgroundColor: `${secondary}15`, color: secondary }}><Zap size={12} />Tính năng</div>
            <h2 className={cn("font-bold tracking-tight text-slate-900 dark:text-slate-100", device === 'mobile' ? 'text-2xl' : 'text-3xl md:text-4xl')}>Tính năng nổi bật</h2>
          </div>
          {items.length > itemsPerView && (<div className="flex gap-2">
            <button onClick={() =>{  setCarouselIndex(Math.max(0, carouselIndex - 1)); }} disabled={carouselIndex === 0} className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"><ChevronLeft size={20} /></button>
            <button onClick={() =>{  setCarouselIndex(Math.min(maxIndex, carouselIndex + 1)); }} disabled={carouselIndex >= maxIndex} className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"><ChevronRight size={20} /></button>
          </div>)}
        </div>
        <div className="overflow-hidden">
          <div className="flex gap-5 transition-transform duration-300" style={{ transform: `translateX(-${carouselIndex * (100 / itemsPerView)}%)`, width: `${(items.length / itemsPerView) * 100}%` }}>
            {items.map((item, idx) => {
              const IconComponent = getIcon(item.icon);
              return (
                <div key={`${item.id ?? 'feature'}-${idx}`} className="flex-shrink-0" style={{ width: `${100 / items.length}%` }}>
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 h-full flex flex-col">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4" style={{ background: `linear-gradient(135deg, ${secondary} 0%, ${secondary}cc 100%)`, boxShadow: `0 8px 16px -4px ${secondary}40` }}><IconComponent size={24} className="text-white" strokeWidth={2} /></div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-2 line-clamp-1">{item.title || 'Tên tính năng'}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3 min-h-[3.75rem]">{item.description || 'Mô tả tính năng...'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {items.length > itemsPerView && (<div className="flex justify-center gap-2 mt-6">{Array.from({ length: maxIndex + 1 }).map((_, idx) => (<button key={idx} onClick={() =>{  setCarouselIndex(idx); }} className={cn("w-2 h-2 rounded-full transition-all", idx === carouselIndex ? 'w-6' : 'bg-slate-300 dark:bg-slate-600')} style={idx === carouselIndex ? { backgroundColor: secondary } : {}} />))}</div>)}
      </div>
    );
  };

  const renderTimelineStyle = () => {
    if (items.length === 0) {return renderEmptyState();}
    const maxItems = device === 'mobile' ? 4 : 6;
    const visibleItems = items.slice(0, maxItems);
    const remainingCount = items.length - maxItems;
    return (
      <div className={cn("py-6 px-4", device === 'mobile' ? 'py-4 px-3' : 'md:py-10 md:px-6')}>
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2" style={{ backgroundColor: `${secondary}15`, color: secondary }}><Zap size={12} />Tính năng</div>
          <h2 className={cn("font-bold tracking-tight text-slate-900 dark:text-slate-100", device === 'mobile' ? 'text-xl' : 'text-2xl md:text-3xl')}>Tính năng nổi bật</h2>
        </div>
        <div className="max-w-2xl mx-auto relative">
          <div className={cn("absolute top-0 bottom-0 w-px", device === 'mobile' ? 'left-3' : 'left-1/2')} style={{ backgroundColor: `${secondary}30` }} />
          <div className={cn("relative", device === 'mobile' ? 'space-y-3' : 'space-y-4')}>
            {visibleItems.map((item, idx) => {
              const IconComponent = getIcon(item.icon);
              const isEven = idx % 2 === 0;
              return (
                <div key={`${item.id ?? 'feature'}-${idx}`} className={cn("relative flex items-center", device === 'mobile' ? 'pl-8' : (isEven ? 'flex-row pr-[52%]' : 'flex-row-reverse pl-[52%]'))}>
                  <div className={cn("absolute flex items-center justify-center w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 shadow z-10", device === 'mobile' ? 'left-0' : 'left-1/2 -translate-x-1/2')} style={{ backgroundColor: secondary }}><IconComponent size={12} className="text-white" strokeWidth={2.5} /></div>
                  <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: `${secondary}15`, color: secondary }}>{idx + 1}</span>
                      <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">{item.title || 'Tên tính năng'}</h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 pl-6">{item.description || 'Mô tả tính năng...'}</p>
                  </div>
                </div>
              );
            })}
          </div>
          {remainingCount > 0 && (<div className="text-center mt-4"><span className="text-sm" style={{ color: secondary }}>+{remainingCount} tính năng khác</span></div>)}
        </div>
      </div>
    );
  };

  return (
    <PreviewWrapper title="Preview Features" device={device} setDevice={setDevice} previewStyle={previewStyle} setPreviewStyle={setPreviewStyle} styles={styles} info={`${items.length} tính năng`}>
      <BrowserFrame>
        {previewStyle === 'iconGrid' && renderIconGridStyle()}
        {previewStyle === 'alternating' && renderAlternatingStyle()}
        {previewStyle === 'compact' && renderCompactStyle()}
        {previewStyle === 'cards' && renderCardsStyle()}
        {previewStyle === 'carousel' && renderCarouselStyle()}
        {previewStyle === 'timeline' && renderTimelineStyle()}
      </BrowserFrame>
    </PreviewWrapper>
  );
};

// ============ PROCESS/HOW IT WORKS PREVIEW ============
// 7 Professional Styles: Horizontal, Stepper, Cards, Accordion, Minimal, Grid, Alternating
export type ProcessStyle = 'horizontal' | 'stepper' | 'cards' | 'accordion' | 'minimal' | 'compactMinimal' | 'grid' | 'alternating' | 'circular';

export const ProcessPreview = ({
  steps,
  brandColor,
  secondary,
  selectedStyle,
  onStyleChange,
}: {
  steps: unknown;
  brandColor: string;
  secondary: string;
  selectedStyle?: ProcessStyle;
  onStyleChange?: (style: ProcessStyle) => void;
}) => {
  const { mode } = useBrandColors();

  return (
    <ProcessPreviewModern
      steps={steps}
      brandColor={brandColor}
      secondary={secondary}
      mode={mode}
      selectedStyle={selectedStyle}
      onStyleChange={onStyleChange}
    />
  );
};

// ============ CLIENTS MARQUEE PREVIEW ============
// Auto-scroll Logo Marquee - 6 Styles: marquee, dualRow, wave, grid, carousel, featured
// Best Practices: pause on hover, a11y, prefers-reduced-motion, compact spacing
interface ClientItem { id: number; url: string; link: string; name?: string }
export type ClientsStyle = 'marquee' | 'dualRow' | 'wave' | 'grid' | 'carousel' | 'featured';

export const ClientsPreview = ({ 
  items, 
  brandColor, 
  secondary: _secondary,
  selectedStyle, 
  onStyleChange 
}: { 
  items: ClientItem[]; 
  brandColor: string;
  secondary: string; 
  selectedStyle?: ClientsStyle; 
  onStyleChange?: (style: ClientsStyle) => void;
}) => {
  const [device, setDevice] = useState<PreviewDevice>('desktop');
  const carouselBaseId = React.useId();
  const previewStyle = selectedStyle ?? 'marquee';
  const setPreviewStyle = (s: string) => onStyleChange?.(s as ClientsStyle);
  const styles = [
    { id: 'marquee', label: 'Marquee' },
    { id: 'dualRow', label: 'Dual Row' },
    { id: 'wave', label: 'Wave' },
    { id: 'grid', label: 'Grid' },
    { id: 'carousel', label: 'Carousel' },
    { id: 'featured', label: 'Featured' },
  ];

  // Dynamic image size info
  const getImageSizeInfo = () => {
    const count = items.length;
    if (count === 0) {return 'Chưa có logo';}
    switch (previewStyle) {
      case 'marquee':
      case 'dualRow': {
        return `${count} logo • 240×96px`;
      }
      case 'wave': {
        return `${count} logo • 192×72px`;
      }
      case 'grid': {
        return `${count} logo • 216×84px`;
      }
      case 'carousel': {
        return `${count} logo • 240×96px`;
      }
      case 'featured': {
        return count <= 4 ? `${count} logo • 240×96px` : `4 featured + ${count - 4} khác`;
      }
      default: {
        return `${count} logo`;
      }
    }
  };

  // CSS keyframes với pause on hover và prefers-reduced-motion
  const marqueeKeyframes = `
    @keyframes clients-marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
    @keyframes clients-marquee-reverse { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
    @keyframes clients-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
    .clients-marquee-track { animation: clients-marquee var(--duration, 30s) linear infinite; }
    .clients-marquee-track-reverse { animation: clients-marquee-reverse var(--duration, 30s) linear infinite; }
    .clients-float { animation: clients-float 3s ease-in-out infinite; }
    .clients-marquee-container:hover .clients-marquee-track,
    .clients-marquee-container:hover .clients-marquee-track-reverse,
    .clients-marquee-container:focus-within .clients-marquee-track,
    .clients-marquee-container:focus-within .clients-marquee-track-reverse { animation-play-state: paused; }
    @media (prefers-reduced-motion: reduce) { .clients-marquee-track, .clients-marquee-track-reverse, .clients-float { animation: none !important; } }
  `;

  // Empty state
  if (items.length === 0) {
    return (
      <>
        <PreviewWrapper title="Preview Clients" device={device} setDevice={setDevice} previewStyle={previewStyle} setPreviewStyle={setPreviewStyle} styles={styles} info={getImageSizeInfo()}>
          <BrowserFrame>
            <section className={cn("px-4", device === 'mobile' ? 'py-6' : 'py-8')}>
              <div className="flex flex-col items-center justify-center h-40">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: `${brandColor}10` }}>
                  <Users size={28} style={{ color: brandColor }} />
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Chưa có logo khách hàng</p>
                <p className="text-xs text-slate-400 mt-1">Thêm ít nhất 3 logo</p>
              </div>
            </section>
          </BrowserFrame>
        </PreviewWrapper>
        <div className="mt-3 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <ImageIcon size={14} className="text-slate-400 flex-shrink-0" />
            <p className="text-xs text-slate-600 dark:text-slate-400"><strong>240×96px</strong> PNG trong suốt</p>
          </div>
        </div>
      </>
    );
  }

  // Logo item renderer - tăng 20% size, bỏ grayscale hover
  const renderLogoItem = (item: ClientItem, idx: number, options?: { size?: 'sm' | 'md' | 'lg' }) => {
    const { size = 'md' } = options ?? {};
    // Tăng 20%: sm: 10→12, md: 12→14, lg: 14→17
    const sizeClasses = { lg: 'h-16 md:h-[4.5rem]', md: 'h-14 md:h-16', sm: 'h-12 md:h-14' };
    return (
      <div key={`logo-${item.id}-${idx}`} className="shrink-0 flex items-center" role="listitem">
        {item.url ? (
          <PreviewImage src={item.url} alt={item.name ?? `Logo ${item.id}`} className={cn(sizeClasses[size], "w-auto object-contain select-none")} />
        ) : (
          <div className={cn(sizeClasses[size], "w-28 rounded-lg flex items-center justify-center")} style={{ backgroundColor: `${brandColor}15` }}>
            <ImageIcon size={22} style={{ color: brandColor }} className="opacity-40" />
          </div>
        )}
      </div>
    );
  };

  // Style 1: Simple Marquee - compact spacing
  const renderMarqueeStyle = () => (
    <section className={cn("w-full bg-white dark:bg-slate-900 border-b border-slate-200/40 dark:border-slate-700/40", device === 'mobile' ? 'py-6 px-3' : 'py-8 px-4')} aria-label="Khách hàng">
      <style>{marqueeKeyframes}</style>
      <div className="w-full max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className={cn("font-bold tracking-tight text-slate-900 dark:text-slate-100 relative pl-3", device === 'mobile' ? 'text-base' : 'text-lg md:text-xl')}>
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full" style={{ backgroundColor: brandColor }} />
            Khách hàng tin tưởng
          </h2>
          <span className="text-[10px] text-slate-400">Di chuột để dừng</span>
        </div>
        <div className="clients-marquee-container relative py-4 overflow-hidden" role="list" style={{ WebkitMaskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)', maskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)' }}>
          <div className="clients-marquee-track flex items-center gap-10 md:gap-12" style={{ '--duration': `${Math.max(20, items.length * 4)}s`, width: 'max-content' } as React.CSSProperties}>
            {items.map((item, idx) => renderLogoItem(item, idx))}
            {items.map((item, idx) => renderLogoItem(item, idx + items.length))}
          </div>
        </div>
      </div>
    </section>
  );

  // Style 2: Dual Row Marquee - compact, no grayscale
  const renderDualRowStyle = () => (
    <section className={cn("w-full bg-white dark:bg-slate-900 border-b border-slate-200/40 dark:border-slate-700/40", device === 'mobile' ? 'py-6 px-3' : 'py-8 px-4')} aria-label="Khách hàng">
      <style>{marqueeKeyframes}</style>
      <div className="w-full max-w-7xl mx-auto space-y-4">
        <h2 className={cn("font-bold tracking-tight text-slate-900 dark:text-slate-100 relative pl-3", device === 'mobile' ? 'text-base' : 'text-lg md:text-xl')}>
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full" style={{ backgroundColor: brandColor }} />
          Khách hàng tin tưởng
        </h2>
        <div className="space-y-2" role="list">
          <div className="clients-marquee-container relative py-2 overflow-hidden" style={{ WebkitMaskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)', maskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)' }}>
            <div className="clients-marquee-track flex items-center gap-10 md:gap-12" style={{ '--duration': `${Math.max(25, items.length * 5)}s`, width: 'max-content' } as React.CSSProperties}>
              {items.map((item, idx) => renderLogoItem(item, idx))}
              {items.map((item, idx) => renderLogoItem(item, idx + items.length))}
            </div>
          </div>
          <div className="clients-marquee-container relative py-2 overflow-hidden" style={{ WebkitMaskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)', maskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)' }}>
            <div className="clients-marquee-track-reverse flex items-center gap-10 md:gap-12" style={{ '--duration': `${Math.max(30, items.length * 6)}s`, width: 'max-content' } as React.CSSProperties}>
              {[...items].toReversed().map((item, idx) => renderLogoItem(item, idx))}
              {[...items].toReversed().map((item, idx) => renderLogoItem(item, idx + items.length))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  // Style 3: Wave - compact spacing, larger images
  const renderWaveStyle = () => (
    <section className={cn("w-full bg-gradient-to-b from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border-b border-slate-200/40 dark:border-slate-700/40 overflow-hidden", device === 'mobile' ? 'py-8 px-3' : 'py-10 px-4')} aria-label="Đối tác">
      <style>{marqueeKeyframes}</style>
      <div className="w-full max-w-7xl mx-auto space-y-5">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: `${brandColor}15`, color: brandColor }}>Đối tác & Khách hàng</div>
          <h2 className={cn("font-bold tracking-tight text-slate-900 dark:text-slate-100", device === 'mobile' ? 'text-base' : 'text-lg md:text-xl')}>Được tin tưởng bởi các thương hiệu hàng đầu</h2>
        </div>
        <div className="clients-marquee-container relative py-4 overflow-hidden" role="list" style={{ WebkitMaskImage: 'linear-gradient(to right, transparent, black 4%, black 96%, transparent)', maskImage: 'linear-gradient(to right, transparent, black 4%, black 96%, transparent)' }}>
          <div className="clients-marquee-track flex items-center gap-8 md:gap-10" style={{ '--duration': `${Math.max(35, items.length * 6)}s`, width: 'max-content' } as React.CSSProperties}>
            {items.map((item, idx) => (
              <div key={`wave-${item.id}-${idx}`} className="shrink-0 clients-float" style={{ animationDelay: `${idx * 0.3}s` }} role="listitem">
                <div className={cn("bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700", device === 'mobile' ? 'p-2.5' : 'p-3')}>
                  {item.url ? <PreviewImage src={item.url} alt={item.name ?? `Logo ${item.id}`} className={cn("w-auto object-contain select-none", device === 'mobile' ? 'h-10' : 'h-12')} /> : <div className="h-12 w-24 flex items-center justify-center"><ImageIcon size={20} className="text-slate-300" /></div>}
                </div>
              </div>
            ))}
            {items.map((item, idx) => (
              <div key={`wave2-${item.id}-${idx}`} className="shrink-0 clients-float" style={{ animationDelay: `${(idx + items.length) * 0.3}s` }} role="listitem">
                <div className={cn("bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700", device === 'mobile' ? 'p-2.5' : 'p-3')}>
                  {item.url ? <PreviewImage src={item.url} alt={item.name ?? `Logo ${item.id}`} className={cn("w-auto object-contain select-none", device === 'mobile' ? 'h-10' : 'h-12')} /> : <div className="h-12 w-24 flex items-center justify-center"><ImageIcon size={20} className="text-slate-300" /></div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );

  // Style 4: Grid - compact, no grayscale, larger images
  const renderGridStyle = () => {
    const MAX_VISIBLE = device === 'mobile' ? 6 : 12;
    const visibleItems = items.slice(0, MAX_VISIBLE);
    const remainingCount = Math.max(0, items.length - MAX_VISIBLE);
    const getGridClass = () => {
      const count = visibleItems.length;
      if (count <= 2) {return 'flex justify-center gap-6';}
      if (count <= 4) {return device === 'mobile' ? 'grid grid-cols-2 gap-3' : 'flex justify-center gap-6';}
      return device === 'mobile' ? 'grid grid-cols-2 gap-3' : (device === 'tablet' ? 'grid grid-cols-4 gap-4' : 'grid grid-cols-4 lg:grid-cols-6 gap-4');
    };
    return (
      <section className={cn("w-full bg-white dark:bg-slate-900 border-b border-slate-200/40 dark:border-slate-700/40", device === 'mobile' ? 'py-6 px-3' : 'py-8 px-4')} aria-label="Khách hàng tiêu biểu">
        <div className="w-full max-w-7xl mx-auto space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className={cn("font-bold tracking-tight text-slate-900 dark:text-slate-100 relative pl-3", device === 'mobile' ? 'text-base' : 'text-lg md:text-xl')}>
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full" style={{ backgroundColor: brandColor }} />
              Khách hàng tiêu biểu
            </h2>
            {items.length > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: `${brandColor}10`, color: brandColor }}>{items.length} đối tác</span>}
          </div>
          <div className={cn(getGridClass(), "py-3")} role="list">
            {visibleItems.map((item) => (
              <div key={`grid-${item.id}`} className="p-3 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer flex flex-col items-center" role="listitem">
                {item.url ? <PreviewImage src={item.url} alt={item.name ?? `Logo ${item.id}`} className={cn("w-auto object-contain select-none", device === 'mobile' ? 'h-12' : 'h-14 md:h-16')} /> : <div className={cn("w-24 rounded-lg flex items-center justify-center", device === 'mobile' ? 'h-12' : 'h-14 md:h-16')} style={{ backgroundColor: `${brandColor}10` }}><ImageIcon size={18} className="text-slate-300" /></div>}
                {item.name && <span className="text-[10px] text-slate-400 text-center mt-1.5 truncate max-w-full">{item.name}</span>}
              </div>
            ))}
            {remainingCount > 0 && (
              <div className="p-3 rounded-lg flex flex-col items-center justify-center" style={{ backgroundColor: `${brandColor}08` }} role="listitem">
                <div className="w-9 h-9 rounded-full flex items-center justify-center mb-1" style={{ backgroundColor: `${brandColor}15` }}><Plus size={18} style={{ color: brandColor }} /></div>
                <span className="text-sm font-bold" style={{ color: brandColor }}>+{remainingCount}</span>
                <span className="text-[10px] text-slate-400">khác</span>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  };

  // Style 5: Carousel - compact, larger images
  const renderCarouselStyle = () => {
    const carouselId = `clients-carousel-${carouselBaseId}`;
    const cardWidth = device === 'mobile' ? 150 : 170;
    const gap = device === 'mobile' ? 10 : 12;
    return (
      <section className={cn("w-full bg-white dark:bg-slate-900 border-b border-slate-200/40 dark:border-slate-700/40", device === 'mobile' ? 'py-6' : 'py-8')} aria-label="Khách hàng">
        <style>{`#${carouselId}::-webkit-scrollbar { display: none; }`}</style>
        <div className="w-full max-w-7xl mx-auto space-y-4">
          <div className={cn("flex items-center justify-between gap-3", device === 'mobile' ? 'px-3' : 'px-4')}>
            <div>
              <h2 className={cn("font-bold tracking-tight text-slate-900 dark:text-slate-100 relative pl-3", device === 'mobile' ? 'text-base' : 'text-lg md:text-xl')}>
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full" style={{ backgroundColor: brandColor }} />
                Khách hàng của chúng tôi
              </h2>
              <p className={cn("text-slate-400 pl-3", device === 'mobile' ? 'text-[10px]' : 'text-xs')}>Vuốt để xem thêm →</p>
            </div>
            {items.length > 3 && (
              <div className="flex gap-1.5">
                <button type="button" onClick={() => { const el = document.querySelector(`#${carouselId}`); if (el) {el.scrollBy({ behavior: 'smooth', left: -(cardWidth + gap) });} }} className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700" aria-label="Cuộn trái"><ChevronLeft size={14} /></button>
                <button type="button" onClick={() => { const el = document.querySelector(`#${carouselId}`); if (el) {el.scrollBy({ behavior: 'smooth', left: cardWidth + gap });} }} className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-all" style={{ backgroundColor: brandColor }} aria-label="Cuộn phải"><ChevronRight size={14} /></button>
              </div>
            )}
          </div>
          <div className={cn("relative overflow-hidden", device === 'mobile' ? 'mx-3' : 'mx-4', "rounded-lg")}>
            <div className="absolute left-0 top-0 bottom-0 w-6 md:w-8 bg-gradient-to-r from-white dark:from-slate-900 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-6 md:w-8 bg-gradient-to-l from-white dark:from-slate-900 to-transparent z-10 pointer-events-none" />
            <div id={carouselId} className="flex overflow-x-auto snap-x snap-mandatory gap-2.5 md:gap-3 py-3 px-1.5 cursor-grab active:cursor-grabbing select-none" style={{ WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none', scrollbarWidth: 'none' }} role="list"
              onMouseDown={(e) => { const el = e.currentTarget; el.dataset.isDown = 'true'; el.dataset.startX = String(e.pageX - el.offsetLeft); el.dataset.scrollLeft = String(el.scrollLeft); el.style.scrollBehavior = 'auto'; }}
              onMouseLeave={(e) => { e.currentTarget.dataset.isDown = 'false'; e.currentTarget.style.scrollBehavior = 'smooth'; }}
              onMouseUp={(e) => { e.currentTarget.dataset.isDown = 'false'; e.currentTarget.style.scrollBehavior = 'smooth'; }}
              onMouseMove={(e) => { const el = e.currentTarget; if (el.dataset.isDown !== 'true') {return;} e.preventDefault(); const x = e.pageX - el.offsetLeft; const walk = (x - Number(el.dataset.startX)) * 1.5; el.scrollLeft = Number(el.dataset.scrollLeft) - walk; }}>
              {items.map((item) => (
                <div key={`carousel-${item.id}`} className="flex-shrink-0 snap-start" style={{ width: cardWidth }} role="listitem">
                  <div className="h-full p-3 rounded-lg border bg-slate-50 dark:bg-slate-800 flex flex-col items-center justify-center transition-all hover:shadow-md" style={{ borderColor: `${brandColor}15` }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${brandColor}40`; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${brandColor}15`; }}>
                    {item.url ? <PreviewImage src={item.url} alt={item.name ?? `Logo ${item.id}`} className={cn("w-auto object-contain select-none", device === 'mobile' ? 'h-10' : 'h-12')} /> : <div className="h-12 w-full flex items-center justify-center"><ImageIcon size={22} className="text-slate-300" /></div>}
                    {item.name && <span className="text-[10px] text-slate-500 dark:text-slate-400 text-center mt-1.5 truncate w-full">{item.name}</span>}
                  </div>
                </div>
              ))}
              <div className="flex-shrink-0 w-3" />
            </div>
          </div>
        </div>
      </section>
    );
  };

  // Style 6: Featured - compact, no grayscale, larger images
  const renderFeaturedStyle = () => {
    const featuredItems = items.slice(0, 4);
    const otherItems = items.slice(4);
    const MAX_OTHER = device === 'mobile' ? 4 : 8;
    const visibleOthers = otherItems.slice(0, MAX_OTHER);
    const remainingCount = Math.max(0, otherItems.length - MAX_OTHER);
    return (
      <section className={cn("w-full bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 border-b border-slate-200/40 dark:border-slate-700/40", device === 'mobile' ? 'py-8 px-3' : 'py-10 px-4')} aria-label="Đối tác chiến lược">
        <div className="w-full max-w-7xl mx-auto space-y-5">
          <div className="text-center space-y-1">
            <h2 className={cn("font-bold tracking-tight text-slate-900 dark:text-slate-100", device === 'mobile' ? 'text-base' : 'text-lg md:text-xl')}>Đối tác chiến lược</h2>
            <p className={cn("text-slate-500 dark:text-slate-400", device === 'mobile' ? 'text-[10px]' : 'text-xs')}>Được tin tưởng bởi các thương hiệu hàng đầu</p>
          </div>
          <div className={cn("grid gap-3", device === 'mobile' ? 'grid-cols-2' : (featuredItems.length <= 2 ? 'flex justify-center gap-4' : 'grid-cols-2 md:grid-cols-4'))} role="list">
            {featuredItems.map((item, idx) => (
              <div key={`featured-${item.id}`} className={cn("group rounded-xl border bg-white dark:bg-slate-800 flex flex-col items-center justify-center transition-all hover:shadow-lg", device === 'mobile' ? 'p-4' : 'p-5', featuredItems.length <= 2 && 'w-44')} style={{ borderColor: `${brandColor}20`, boxShadow: `0 2px 8px ${brandColor}08` }} role="listitem">
                {item.url ? <PreviewImage src={item.url} alt={item.name ?? `Logo ${idx + 1}`} className={cn("w-auto object-contain select-none transition-transform duration-300 group-hover:scale-105", device === 'mobile' ? 'h-12' : 'h-14 md:h-16')} /> : <div className="h-16 w-full flex items-center justify-center"><ImageIcon size={26} className="text-slate-300" /></div>}
                {item.name && <span className={cn("font-medium text-slate-600 dark:text-slate-300 text-center mt-2 truncate w-full", device === 'mobile' ? 'text-[10px]' : 'text-xs')}>{item.name}</span>}
              </div>
            ))}
          </div>
          {visibleOthers.length > 0 && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <p className={cn("text-center text-slate-400 mb-3", device === 'mobile' ? 'text-[10px]' : 'text-xs')}>Và nhiều đối tác khác</p>
              <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6" role="list">
                {visibleOthers.map((item) => (
                  <div key={`other-${item.id}`} role="listitem">
                    {item.url ? <PreviewImage src={item.url} alt={item.name ?? `Logo`} className={cn("w-auto object-contain select-none", device === 'mobile' ? 'h-8' : 'h-9 md:h-10')} /> : <div className="h-10 w-16 flex items-center justify-center"><ImageIcon size={16} className="text-slate-300" /></div>}
                  </div>
                ))}
                {remainingCount > 0 && <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: `${brandColor}10`, color: brandColor }}>+{remainingCount}</span>}
              </div>
            </div>
          )}
        </div>
      </section>
    );
  };

  return (
    <>
      <PreviewWrapper title="Preview Clients" device={device} setDevice={setDevice} previewStyle={previewStyle} setPreviewStyle={setPreviewStyle} styles={styles} info={getImageSizeInfo()}>
        <BrowserFrame>
          {previewStyle === 'marquee' && renderMarqueeStyle()}
          {previewStyle === 'dualRow' && renderDualRowStyle()}
          {previewStyle === 'wave' && renderWaveStyle()}
          {previewStyle === 'grid' && renderGridStyle()}
          {previewStyle === 'carousel' && renderCarouselStyle()}
          {previewStyle === 'featured' && renderFeaturedStyle()}
        </BrowserFrame>
      </PreviewWrapper>
      <div className="mt-3 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <ImageIcon size={14} className="text-slate-400 flex-shrink-0" />
          <div className="text-xs text-slate-600 dark:text-slate-400">
            {previewStyle === 'marquee' && <span><strong>240×96px</strong> PNG trong suốt • Hover để dừng</span>}
            {previewStyle === 'dualRow' && <span><strong>240×96px</strong> PNG trong suốt • 2 hàng ngược chiều</span>}
            {previewStyle === 'wave' && <span><strong>192×72px</strong> PNG trong suốt • Cards với animation</span>}
            {previewStyle === 'grid' && <span><strong>216×84px</strong> PNG trong suốt • Grid tĩnh, max 12</span>}
            {previewStyle === 'carousel' && <span><strong>240×96px</strong> PNG trong suốt • Vuốt/kéo</span>}
            {previewStyle === 'featured' && <span><strong>240×96px</strong> PNG trong suốt • 4 logo featured</span>}
          </div>
        </div>
      </div>
    </>
  );
};


// ============ VIDEO PREVIEW ============
// 6 Professional Styles: Centered, Split, Fullwidth, Cinema, Minimal, Parallax
import { Play, Video as VideoIcon } from 'lucide-react';

export type VideoStyle = 'centered' | 'split' | 'fullwidth' | 'cinema' | 'minimal' | 'parallax';

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
}

// Helper: Extract video ID and type
const getVideoInfo = (url: string): { type: 'youtube' | 'vimeo' | 'drive' | 'direct'; id?: string } => {
  if (!url) {return { type: 'direct' };}
  
  // YouTube: regular, shorts, embed, youtu.be
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([^&?/]+)/);
  if (ytMatch) {return { id: ytMatch[1], type: 'youtube' };}
  
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {return { id: vimeoMatch[1], type: 'vimeo' };}
  
  // Google Drive
  const driveMatch = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([^/&?]+)/);
  if (driveMatch) {return { id: driveMatch[1], type: 'drive' };}
  
  return { type: 'direct' };
};

// Helper: Get YouTube thumbnail
const getYouTubeThumbnail = (videoId: string): string => `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

export const VideoPreview = ({ 
  config, 
  brandColor, 
  secondary: _secondary,
  selectedStyle, 
  onStyleChange 
}: { 
  config: VideoConfig; 
  brandColor: string;
  secondary: string; 
  selectedStyle?: VideoStyle; 
  onStyleChange?: (style: VideoStyle) => void;
}) => {
  const [device, setDevice] = useState<PreviewDevice>('desktop');
  const [isPlaying, setIsPlaying] = useState(false);
  const previewStyle = selectedStyle ?? 'centered';
  const setPreviewStyle = (s: string) => onStyleChange?.(s as VideoStyle);
  
  const styles = [
    { id: 'centered', label: 'Centered' },
    { id: 'split', label: 'Split' },
    { id: 'fullwidth', label: 'Fullwidth' },
    { id: 'cinema', label: 'Cinema' },
    { id: 'minimal', label: 'Minimal' },
    { id: 'parallax', label: 'Parallax' },
  ];

  const { videoUrl, thumbnailUrl, heading, description, badge, buttonText, buttonLink } = config;
  const videoInfo = getVideoInfo(videoUrl);
  
  // Determine thumbnail
  const displayThumbnail = thumbnailUrl ?? 
    (videoInfo.type === 'youtube' && videoInfo.id ? getYouTubeThumbnail(videoInfo.id) : '');

  // Play button component
  const PlayButton = ({ size = 'lg' }: { size?: 'sm' | 'lg' }) => (
    <button 
      type="button"
      onClick={() =>{  setIsPlaying(true); }}
      className={cn(
        "absolute inset-0 flex items-center justify-center group transition-all",
        "bg-black/30 hover:bg-black/40"
      )}
    >
      <div 
        className={cn(
          "rounded-full flex items-center justify-center transition-transform group-hover:scale-110 shadow-xl",
          size === 'lg' ? 'w-16 h-16 md:w-20 md:h-20' : 'w-12 h-12'
        )}
        style={{ backgroundColor: brandColor }}
      >
        <Play 
          className={cn("text-white ml-1", size === 'lg' ? 'w-7 h-7 md:w-8 md:h-8' : 'w-5 h-5')} 
          fill="white" 
        />
      </div>
    </button>
  );

  // Video embed component
  const VideoEmbed = () => {
    if (!isPlaying) {return null;}
    
    if (videoInfo.type === 'youtube' && videoInfo.id) {
      return (
        <iframe 
          src={`https://www.youtube.com/embed/${videoInfo.id}?autoplay=1&rel=0`}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }
    
    if (videoInfo.type === 'vimeo' && videoInfo.id) {
      return (
        <iframe 
          src={`https://player.vimeo.com/video/${videoInfo.id}?autoplay=1`}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      );
    }
    
    if (videoInfo.type === 'drive' && videoInfo.id) {
      return (
        <iframe 
          src={`https://drive.google.com/file/d/${videoInfo.id}/preview`}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; fullscreen"
          allowFullScreen
        />
      );
    }
    
    return (
      <video 
        src={videoUrl}
        className="absolute inset-0 w-full h-full object-cover"
        controls
        autoPlay
      />
    );
  };

  // Empty state
  const EmptyState = () => (
    <div 
      className="w-full aspect-video flex flex-col items-center justify-center rounded-xl"
      style={{ backgroundColor: `${brandColor}10` }}
    >
      <VideoIcon size={48} className="text-slate-300 mb-3" />
      <p className="text-sm text-slate-400">Chưa có video</p>
      <p className="text-xs text-slate-300">Thêm URL video để xem preview</p>
    </div>
  );

  // Style 1: Centered - Video ở giữa với heading/description
  const renderCenteredStyle = () => (
    <section className={cn("py-12 px-4", device === 'mobile' ? 'py-8' : 'py-16')}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        {(heading ?? description) && (
          <div className="text-center mb-8">
            {heading && (
              <h2 className={cn(
                "font-bold text-slate-900 mb-3",
                device === 'mobile' ? 'text-xl' : 'text-2xl md:text-3xl'
              )}>
                {heading}
              </h2>
            )}
            {description && (
              <p className={cn(
                "text-slate-500 max-w-2xl mx-auto",
                device === 'mobile' ? 'text-sm' : 'text-base'
              )}>
                {description}
              </p>
            )}
          </div>
        )}
        
        {/* Video */}
        {!videoUrl ? (
          <EmptyState />
        ) : (
          <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl bg-slate-900">
            {!isPlaying && displayThumbnail && (
              <PreviewImage 
                src={displayThumbnail} 
                alt="Video thumbnail" 
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            {!isPlaying && !displayThumbnail && (
              <div 
                className="absolute inset-0 flex items-center justify-center"
                style={{ backgroundColor: `${brandColor}20` }}
              >
                <VideoIcon size={64} className="text-slate-400" />
              </div>
            )}
            {!isPlaying && <PlayButton />}
            <VideoEmbed />
          </div>
        )}
      </div>
    </section>
  );

  // Style 2: Split - Video bên trái, content bên phải (hoặc ngược lại trên mobile)
  const renderSplitStyle = () => (
    <section className={cn("py-12 px-4", device === 'mobile' ? 'py-8' : 'py-16')}>
      <div className="max-w-6xl mx-auto">
        <div className={cn(
          "grid gap-8 items-center",
          device === 'mobile' ? 'grid-cols-1' : 'grid-cols-2 gap-12'
        )}>
          {/* Video */}
          <div className={cn(device === 'mobile' ? 'order-1' : 'order-1')}>
            {!videoUrl ? (
              <EmptyState />
            ) : (
              <div className="relative aspect-video rounded-xl overflow-hidden shadow-xl bg-slate-900">
                {!isPlaying && displayThumbnail && (
                  <PreviewImage 
                    src={displayThumbnail} 
                    alt="Video thumbnail" 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                {!isPlaying && !displayThumbnail && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ backgroundColor: `${brandColor}20` }}
                  >
                    <VideoIcon size={48} className="text-slate-400" />
                  </div>
                )}
                {!isPlaying && <PlayButton size="sm" />}
                <VideoEmbed />
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className={cn(device === 'mobile' ? 'order-2 text-center' : 'order-2')}>
            {badge && (
              <span 
                className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide mb-3"
                style={{ backgroundColor: `${brandColor}15`, color: brandColor }}
              >
                {badge}
              </span>
            )}
            {heading && (
              <h2 className={cn(
                "font-bold text-slate-900 dark:text-white mb-4",
                device === 'mobile' ? 'text-xl' : 'text-2xl md:text-3xl'
              )}>
                {heading}
              </h2>
            )}
            {description && (
              <p className={cn(
                "text-slate-500 dark:text-slate-400 mb-6",
                device === 'mobile' ? 'text-sm' : 'text-base'
              )}>
                {description}
              </p>
            )}
            {buttonText && (
              <a 
                href={buttonLink ?? '#'}
                className="inline-block px-6 py-2.5 rounded-lg text-white font-medium text-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: brandColor }}
              >
                {buttonText}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );

  // Style 3: Fullwidth - Video toàn màn hình với overlay text
  const renderFullwidthStyle = () => (
    <section className="relative">
      {!videoUrl ? (
        <div className="py-16 px-4">
          <EmptyState />
        </div>
      ) : (
        <div className={cn(
          "relative overflow-hidden",
          device === 'mobile' ? 'aspect-video' : 'aspect-[21/9] min-h-[400px]'
        )}>
          {/* Video/Thumbnail */}
          {!isPlaying && displayThumbnail && (
            <PreviewImage 
              src={displayThumbnail} 
              alt="Video thumbnail" 
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          {!isPlaying && !displayThumbnail && (
            <div 
              className="absolute inset-0"
              style={{ backgroundColor: `${brandColor}30` }}
            />
          )}
          
          {/* Overlay gradient */}
          {!isPlaying && (
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
          )}
          
          {/* Content overlay */}
          {!isPlaying && (
            <div className={cn(
              "absolute inset-0 flex items-center",
              device === 'mobile' ? 'px-4' : 'px-8 md:px-16'
            )}>
              <div className="max-w-xl">
                {heading && (
                  <h2 className={cn(
                    "font-bold text-white mb-4",
                    device === 'mobile' ? 'text-xl' : 'text-3xl md:text-4xl'
                  )}>
                    {heading}
                  </h2>
                )}
                {description && (
                  <p className={cn(
                    "text-white/80 mb-6",
                    device === 'mobile' ? 'text-sm' : 'text-lg'
                  )}>
                    {description}
                  </p>
                )}
                <button 
                  type="button"
                  onClick={() =>{  setIsPlaying(true); }}
                  className="flex items-center gap-3 px-6 py-3 rounded-lg text-white font-medium transition-transform hover:scale-105"
                  style={{ backgroundColor: brandColor }}
                >
                  <Play className="w-5 h-5" fill="white" />
                  {buttonText ?? 'Xem video'}
                </button>
              </div>
            </div>
          )}
          
          {/* Center play button (alternative) */}
          {!isPlaying && device !== 'mobile' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center opacity-50"
                style={{ backgroundColor: brandColor }}
              >
                <Play className="w-8 h-8 text-white ml-1" fill="white" />
              </div>
            </div>
          )}
          
          <VideoEmbed />
        </div>
      )}
    </section>
  );

  // Style 4: Cinema - Letterbox với gradient frame
  const renderCinemaStyle = () => (
    <section className={cn("py-12 px-4 bg-slate-900", device === 'mobile' ? 'py-8' : 'py-16')}>
      <div className="max-w-5xl mx-auto">
        {(heading ?? description) && (
          <div className="text-center mb-8">
            {badge && <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4" style={{ backgroundColor: `${brandColor}30`, color: brandColor }}>{badge}</span>}
            {heading && <h2 className={cn("font-bold text-white mb-3", device === 'mobile' ? 'text-xl' : 'text-2xl md:text-3xl')}>{heading}</h2>}
            {description && <p className={cn("text-slate-400 max-w-2xl mx-auto", device === 'mobile' ? 'text-sm' : 'text-base')}>{description}</p>}
          </div>
        )}
        {!videoUrl ? <EmptyState /> : (
          <div className="relative">
            <div className="absolute -top-3 -left-3 -right-3 h-3 rounded-t-xl" style={{ backgroundColor: `${brandColor}40` }} />
            <div className="absolute -bottom-3 -left-3 -right-3 h-3 rounded-b-xl" style={{ backgroundColor: `${brandColor}40` }} />
            <div className="relative aspect-[21/9] rounded-lg overflow-hidden bg-black">
              {!isPlaying && displayThumbnail && <PreviewImage src={displayThumbnail} alt="" className="absolute inset-0 w-full h-full object-cover" />}
              {!isPlaying && !displayThumbnail && <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: `${brandColor}10` }}><VideoIcon size={64} className="text-slate-600" /></div>}
              {!isPlaying && <PlayButton />}
              <VideoEmbed />
            </div>
          </div>
        )}
        {buttonText && !isPlaying && <div className="text-center mt-8"><a href={buttonLink ?? '#'} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium hover:opacity-90" style={{ backgroundColor: brandColor, boxShadow: `0 4px 14px ${brandColor}40` }}>{buttonText}</a></div>}
      </div>
    </section>
  );

  // Style 5: Minimal - Clean card với video và content
  const renderMinimalStyle = () => (
    <section className={cn("py-12 px-4 bg-slate-50 dark:bg-slate-900", device === 'mobile' ? 'py-8' : 'py-16')}>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {!videoUrl ? <div className="p-8"><EmptyState /></div> : (
            <div className="relative aspect-video">
              {!isPlaying && displayThumbnail && <PreviewImage src={displayThumbnail} alt="" className="absolute inset-0 w-full h-full object-cover" />}
              {!isPlaying && !displayThumbnail && <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: `${brandColor}10` }}><VideoIcon size={48} className="text-slate-300" /></div>}
              {!isPlaying && <PlayButton />}
              <VideoEmbed />
            </div>
          )}
          {(heading ?? description) && (
            <div className={cn("p-6 border-t border-slate-100 dark:border-slate-700", device === 'mobile' ? 'p-4' : 'p-8')}>
              <div className={cn("flex gap-4", device === 'mobile' ? 'flex-col' : 'flex-row items-center justify-between')}>
                <div className="flex-1">
                  {badge && <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-medium mb-2" style={{ backgroundColor: `${brandColor}15`, color: brandColor }}>{badge}</span>}
                  {heading && <h3 className={cn("font-bold text-slate-900 dark:text-white", device === 'mobile' ? 'text-lg' : 'text-xl')}>{heading}</h3>}
                  {description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{description}</p>}
                </div>
                {buttonText && <a href={buttonLink ?? '#'} className="inline-flex items-center px-5 py-2.5 rounded-lg text-white font-medium text-sm whitespace-nowrap hover:opacity-90" style={{ backgroundColor: brandColor }}>{buttonText}</a>}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );

  // Style 6: Parallax - Floating card với background blur
  const renderParallaxStyle = () => (
    <section className="relative">
      {!videoUrl ? <div className="py-16 px-4"><EmptyState /></div> : (
        <div className={cn("relative overflow-hidden", device === 'mobile' ? 'min-h-[350px]' : 'min-h-[450px] md:min-h-[500px]')}>
          {!isPlaying && displayThumbnail && (
            <>
              <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${displayThumbnail})`, backgroundPosition: 'center', backgroundSize: 'cover', filter: 'blur(8px)' }} />
              <PreviewImage src={displayThumbnail} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
            </>
          )}
          {!isPlaying && !displayThumbnail && <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${brandColor}dd 0%, ${brandColor} 100%)` }} />}
          {!isPlaying && <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />}
          {!isPlaying && (
            <div className={cn("absolute z-10 flex items-end", device === 'mobile' ? 'inset-x-4 bottom-4' : 'inset-x-8 bottom-8')}>
              <div className={cn("bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-xl shadow-2xl", device === 'mobile' ? 'p-4 w-full' : 'p-6 max-w-lg')}>
                {badge && <div className="flex items-center gap-2 mb-2"><div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: brandColor }} /><span className="text-xs font-semibold uppercase tracking-wide" style={{ color: brandColor }}>{badge}</span></div>}
                {heading && <h3 className={cn("font-bold text-slate-900 dark:text-white", device === 'mobile' ? 'text-base' : 'text-xl')}>{heading}</h3>}
                {description && <p className={cn("text-slate-600 dark:text-slate-300 mt-1", device === 'mobile' ? 'text-xs line-clamp-2' : 'text-sm')}>{description}</p>}
                <div className="flex items-center gap-3 mt-4">
                  <button type="button" onClick={() =>{  setIsPlaying(true); }} className={cn("flex items-center gap-2 font-medium rounded-lg text-white", device === 'mobile' ? 'px-4 py-2 text-xs' : 'px-5 py-2.5 text-sm')} style={{ backgroundColor: brandColor }}>
                    <Play className="w-4 h-4" fill="white" />{buttonText ?? 'Xem video'}
                  </button>
                </div>
              </div>
            </div>
          )}
          {!isPlaying && device !== 'mobile' && (
            <div className="absolute top-6 right-6 z-20">
              <button type="button" onClick={() =>{  setIsPlaying(true); }} className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
                <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
              </button>
            </div>
          )}
          <VideoEmbed />
        </div>
      )}
    </section>
  );

  const getThumbnailSizeInfo = () => {
    if (!videoUrl) {return 'Chưa có video';}
    const vType = videoInfo.type === 'direct' ? 'Direct' : videoInfo.type.charAt(0).toUpperCase() + videoInfo.type.slice(1);
    switch (previewStyle) {
      case 'centered': { return `${vType} • 1280×720px (16:9)`;
      }
      case 'split': { return `${vType} • 1280×720px (16:9)`;
      }
      case 'fullwidth': { return `${vType} • 1920×820px (21:9)`;
      }
      case 'cinema': { return `${vType} • 1920×820px (21:9)`;
      }
      case 'minimal': { return `${vType} • 1280×720px (16:9)`;
      }
      case 'parallax': { return `${vType} • 1920×1080px (16:9)`;
      }
      default: { return vType;
      }
    }
  };

  return (
    <>
      <PreviewWrapper title="Preview Video" device={device} setDevice={setDevice} previewStyle={previewStyle} setPreviewStyle={setPreviewStyle} styles={styles} info={getThumbnailSizeInfo()}>
        <BrowserFrame>
          {previewStyle === 'centered' && renderCenteredStyle()}
          {previewStyle === 'split' && renderSplitStyle()}
          {previewStyle === 'fullwidth' && renderFullwidthStyle()}
          {previewStyle === 'cinema' && renderCinemaStyle()}
          {previewStyle === 'minimal' && renderMinimalStyle()}
          {previewStyle === 'parallax' && renderParallaxStyle()}
        </BrowserFrame>
      </PreviewWrapper>
      <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-start gap-2">
          <ImageIcon size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-slate-600 dark:text-slate-400">
            {previewStyle === 'centered' && <p><strong>1280×720px</strong> (16:9) • Video centered với header text</p>}
            {previewStyle === 'split' && <p><strong>1280×720px</strong> (16:9) • Video trái, content phải</p>}
            {previewStyle === 'fullwidth' && <p><strong>1920×820px</strong> (21:9) • Fullwidth với overlay text</p>}
            {previewStyle === 'cinema' && <p><strong>1920×820px</strong> (21:9) • Letterbox cinema frame</p>}
            {previewStyle === 'minimal' && <p><strong>1280×720px</strong> (16:9) • Clean card layout</p>}
            {previewStyle === 'parallax' && <p><strong>1920×1080px</strong> (16:9) • Background blur + floating card</p>}
          </div>
        </div>
      </div>
    </>
  );
};

// ============ COUNTDOWN / PROMOTION PREVIEW ============
// 6 Professional Styles: Banner, Floating, Minimal, Split, Sticky, Popup
// Best Practices: Urgency indicators, expired state handling, accessibility (aria-live)
interface CountdownConfig {
  heading: string;
  subHeading: string;
  description: string;
  endDate: string;
  buttonText: string;
  buttonLink: string;
  backgroundImage: string;
  discountText: string;
  showDays: boolean;
  showHours: boolean;
  showMinutes: boolean;
  showSeconds: boolean;
}

export type CountdownStyle = 'banner' | 'floating' | 'minimal' | 'split' | 'sticky' | 'popup';

// Countdown Timer Hook with expired state
const useCountdown = (endDate: string) => {
  const [timeLeft, setTimeLeft] = React.useState({ days: 0, hours: 0, isExpired: false, minutes: 0, seconds: 0 });

  React.useEffect(() => {
    const calculateTime = () => {
      const end = new Date(endDate).getTime();
      const now = Date.now();
      const diff = end - now;
      
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, isExpired: true, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        isExpired: false,
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () =>{  clearInterval(timer); };
  }, [endDate]);

  return timeLeft;
};

export const CountdownPreview = ({ 
  config, 
  brandColor, 
  secondary: _secondary,
  selectedStyle, 
  onStyleChange 
}: { 
  config: CountdownConfig;
  brandColor: string;
  secondary: string; 
  selectedStyle?: CountdownStyle; 
  onStyleChange?: (style: CountdownStyle) => void;
}) => {
  const [device, setDevice] = useState<PreviewDevice>('desktop');
  const previewStyle = selectedStyle ?? 'banner';
  const setPreviewStyle = (s: string) => onStyleChange?.(s as CountdownStyle);
  const timeLeft = useCountdown(config.endDate);
  
  const styles = [
    { id: 'banner', label: 'Banner' },
    { id: 'floating', label: 'Nổi bật' },
    { id: 'minimal', label: 'Tối giản' },
    { id: 'split', label: 'Chia đôi' },
    { id: 'sticky', label: 'Dính header' },
    { id: 'popup', label: 'Popup' },
  ];

  // Image size guidance per style
  const getImageSizeInfo = () => {
    if (!config.backgroundImage) {return 'Chưa có ảnh nền';}
    switch (previewStyle) {
      case 'banner': { return 'Ảnh nền: 1920×600px (16:5) - Full width banner';
      }
      case 'floating': { return 'Ảnh nền: 1200×600px (2:1) - Card nổi bật';
      }
      case 'split': { return 'Ảnh nền: 800×600px (4:3) - Cột trái';
      }
      case 'sticky': { return 'Không dùng ảnh - Thanh compact';
      }
      case 'popup': { return 'Ảnh nền: 800×600px (4:3) - Modal center';
      }
      default: { return 'Ảnh nền tùy chọn';
      }
    }
  };

  // Expired State Component
  const ExpiredState = ({ variant = 'default' }: { variant?: 'default' | 'light' }) => (
    <div className={cn(
      "flex items-center gap-2 px-4 py-2 rounded-lg font-semibold",
      variant === 'light' ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'
    )}>
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>Khuyến mãi đã kết thúc</span>
    </div>
  );

  // Time unit renderer with accessibility
  const TimeUnit = ({ value, label, variant = 'default' }: { value: number; label: string; variant?: 'default' | 'light' | 'outlined' }) => {
    if (variant === 'light') {
      return (
        <div className="flex flex-col items-center" role="timer" aria-label={`${value} ${label}`}>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 min-w-[50px] md:min-w-[60px]">
            <span className="text-2xl md:text-3xl font-bold text-white tabular-nums" aria-hidden="true">{String(value).padStart(2, '0')}</span>
          </div>
          <span className="text-xs text-white/80 mt-1 uppercase tracking-wider">{label}</span>
        </div>
      );
    }
    if (variant === 'outlined') {
      return (
        <div className="flex flex-col items-center" role="timer" aria-label={`${value} ${label}`}>
          <div 
            className="border-2 rounded-lg px-3 py-2 min-w-[50px] md:min-w-[60px]"
            style={{ borderColor: brandColor }}
          >
            <span className="text-2xl md:text-3xl font-bold tabular-nums" style={{ color: brandColor }} aria-hidden="true">{String(value).padStart(2, '0')}</span>
          </div>
          <span className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{label}</span>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center" role="timer" aria-label={`${value} ${label}`}>
        <div 
          className="rounded-lg px-3 py-2 min-w-[50px] md:min-w-[60px] text-white"
          style={{ backgroundColor: brandColor }}
        >
          <span className="text-2xl md:text-3xl font-bold tabular-nums" aria-hidden="true">{String(value).padStart(2, '0')}</span>
        </div>
        <span className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{label}</span>
      </div>
    );
  };

  // Timer Display with aria-live for screen readers
  const TimerDisplay = ({ variant = 'default' }: { variant?: 'default' | 'light' | 'outlined' }) => (
    <div className={cn("flex items-center gap-2 md:gap-3", device === 'mobile' && 'gap-1.5')} role="timer" aria-live="polite" aria-atomic="true">
      {config.showDays && (
        <>
          <TimeUnit value={timeLeft.days} label="Ngày" variant={variant} />
          <span className={cn("text-xl font-bold", variant === 'light' ? 'text-white/60' : 'text-slate-300')}>:</span>
        </>
      )}
      {config.showHours && (
        <>
          <TimeUnit value={timeLeft.hours} label="Giờ" variant={variant} />
          <span className={cn("text-xl font-bold", variant === 'light' ? 'text-white/60' : 'text-slate-300')}>:</span>
        </>
      )}
      {config.showMinutes && (
        <>
          <TimeUnit value={timeLeft.minutes} label="Phút" variant={variant} />
          {config.showSeconds && <span className={cn("text-xl font-bold", variant === 'light' ? 'text-white/60' : 'text-slate-300')}>:</span>}
        </>
      )}
      {config.showSeconds && (
        <TimeUnit value={timeLeft.seconds} label="Giây" variant={variant} />
      )}
    </div>
  );

  // Style 1: Banner - Full width banner with gradient background
  const renderBannerStyle = () => (
    <section 
      className="relative w-full py-10 md:py-16 px-4 overflow-hidden"
      style={{ 
        background: config.backgroundImage 
          ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${config.backgroundImage}) center/cover`
          : `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}cc 100%)`
      }}
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ backgroundColor: 'white' }} />
      <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10 blur-3xl" style={{ backgroundColor: 'white' }} />
      
      <div className="max-w-5xl mx-auto text-center relative z-10">
        {/* Discount badge */}
        {config.discountText && (
          <div className="inline-block mb-4">
            <span className="bg-yellow-400 text-yellow-900 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider animate-pulse">
              {config.discountText}
            </span>
          </div>
        )}
        
        {config.subHeading && (
          <p className="text-white/80 text-sm md:text-base uppercase tracking-wider mb-2">{config.subHeading}</p>
        )}
        
        <h2 className={cn(
          "font-bold text-white mb-4",
          device === 'mobile' ? 'text-2xl' : 'text-3xl md:text-4xl'
        )}>
          {config.heading || 'Flash Sale'}
        </h2>
        
        {config.description && (
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">{config.description}</p>
        )}
        
        {/* Countdown Timer */}
        <div className="flex justify-center mb-6">
          <TimerDisplay variant="light" />
        </div>
        
        {config.buttonText && (
          <a 
            href={config.buttonLink || '#'} 
            className="inline-flex items-center gap-2 px-8 py-3 bg-white rounded-lg font-semibold transition-transform hover:scale-105"
            style={{ color: brandColor }}
          >
            {config.buttonText}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        )}
      </div>
    </section>
  );

  // Style 2: Floating - Card style với shadow nổi bật
  const renderFloatingStyle = () => (
    <section className="py-8 md:py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div 
          className="relative rounded-2xl overflow-hidden shadow-2xl"
          style={{ 
            background: config.backgroundImage 
              ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${config.backgroundImage}) center/cover`
              : `linear-gradient(135deg, ${brandColor}ee 0%, ${brandColor} 100%)`
          }}
        >
          {/* Discount badge - corner ribbon */}
          {config.discountText && (
            <div className="absolute -right-12 top-6 rotate-45 bg-yellow-400 text-yellow-900 px-12 py-1 text-sm font-bold shadow-lg">
              {config.discountText}
            </div>
          )}
          
          <div className={cn(
            "p-6 md:p-10 text-center",
            device === 'mobile' ? 'p-5' : ''
          )}>
            {config.subHeading && (
              <div className="inline-block mb-3 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm">
                <span className="text-xs md:text-sm text-white font-medium uppercase tracking-wider">{config.subHeading}</span>
              </div>
            )}
            
            <h2 className={cn(
              "font-bold text-white mb-3",
              device === 'mobile' ? 'text-xl' : 'text-2xl md:text-3xl'
            )}>
              {config.heading || 'Khuyến mãi đặc biệt'}
            </h2>
            
            {config.description && (
              <p className="text-white/80 mb-6 text-sm md:text-base">{config.description}</p>
            )}
            
            {/* Countdown Timer */}
            <div className="flex justify-center mb-6">
              <TimerDisplay variant="light" />
            </div>
            
            {config.buttonText && (
              <a 
                href={config.buttonLink || '#'} 
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-white rounded-full font-semibold text-sm transition-all hover:shadow-lg hover:scale-105"
                style={{ color: brandColor }}
              >
                {config.buttonText}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );

  // Style 3: Minimal - Clean, typography focused
  const renderMinimalStyle = () => (
    <section className="py-10 md:py-14 px-4 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 md:p-10">
          <div className={cn(
            "flex items-center justify-between gap-6",
            device === 'mobile' ? 'flex-col text-center' : ''
          )}>
            {/* Left content */}
            <div className={cn("flex-1", device === 'mobile' ? '' : 'max-w-md')}>
              {config.discountText && (
                <span 
                  className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-3"
                  style={{ backgroundColor: `${brandColor}15`, color: brandColor }}
                >
                  {config.discountText}
                </span>
              )}
              
              {config.subHeading && (
                <p className="text-sm text-slate-500 mb-1">{config.subHeading}</p>
              )}
              
              <h2 className={cn(
                "font-bold text-slate-900 dark:text-white",
                device === 'mobile' ? 'text-xl mb-2' : 'text-2xl mb-2'
              )}>
                {config.heading || 'Ưu đãi có hạn'}
              </h2>
              
              {config.description && (
                <p className="text-slate-500 text-sm mb-4">{config.description}</p>
              )}
              
              {config.buttonText && device !== 'mobile' && (
                <a 
                  href={config.buttonLink || '#'} 
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg font-medium text-sm text-white transition-colors hover:opacity-90"
                  style={{ backgroundColor: brandColor }}
                >
                  {config.buttonText}
                </a>
              )}
            </div>
            
            {/* Right - Timer */}
            <div className="flex flex-col items-center">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Kết thúc sau</p>
              <TimerDisplay variant="outlined" />
              
              {config.buttonText && device === 'mobile' && (
                <a 
                  href={config.buttonLink || '#'} 
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg font-medium text-sm text-white mt-4 transition-colors hover:opacity-90"
                  style={{ backgroundColor: brandColor }}
                >
                  {config.buttonText}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  // Style 4: Split - Two columns with image
  const renderSplitStyle = () => (
    <section className="py-8 md:py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div 
          className={cn(
            "rounded-2xl overflow-hidden shadow-lg",
            device === 'mobile' ? 'flex flex-col' : 'grid grid-cols-2'
          )}
        >
          {/* Left - Image/Visual */}
          <div 
            className={cn(
              "relative flex items-center justify-center",
              device === 'mobile' ? 'h-48' : 'min-h-[300px]'
            )}
            style={{ 
              background: config.backgroundImage 
                ? `url(${config.backgroundImage}) center/cover`
                : `linear-gradient(135deg, ${brandColor}dd 0%, ${brandColor} 100%)`
            }}
          >
            {!config.backgroundImage && (
              <div className="text-center text-white p-6">
                {config.discountText && (
                  <div className="text-5xl md:text-7xl font-black mb-2">{config.discountText}</div>
                )}
                <div className="text-lg md:text-xl font-medium opacity-90">GIẢM GIÁ</div>
              </div>
            )}
            {config.backgroundImage && config.discountText && (
              <div className="absolute top-4 left-4 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-lg font-bold text-xl">
                {config.discountText}
              </div>
            )}
          </div>
          
          {/* Right - Content */}
          <div className="bg-white dark:bg-slate-800 p-6 md:p-8 flex flex-col justify-center">
            {config.subHeading && (
              <p className="text-sm uppercase tracking-wider mb-2" style={{ color: brandColor }}>{config.subHeading}</p>
            )}
            
            <h2 className={cn(
              "font-bold text-slate-900 dark:text-white mb-3",
              device === 'mobile' ? 'text-xl' : 'text-2xl'
            )}>
              {config.heading || 'Khuyến mãi đặc biệt'}
            </h2>
            
            {config.description && (
              <p className="text-slate-500 text-sm mb-5">{config.description}</p>
            )}
            
            {/* Countdown */}
            <div className="mb-5">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Còn lại</p>
              {timeLeft.isExpired ? <ExpiredState /> : <TimerDisplay variant="default" />}
            </div>
            
            {config.buttonText && !timeLeft.isExpired && (
              <a 
                href={config.buttonLink || '#'} 
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all hover:opacity-90 w-full md:w-auto"
                style={{ backgroundColor: brandColor }}
              >
                {config.buttonText}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );

  // Style 5: Sticky - Compact top bar style (dính header)
  const renderStickyStyle = () => (
    <section 
      className="w-full py-3 px-4"
      style={{ backgroundColor: brandColor }}
      role="banner"
      aria-label="Khuyến mãi có thời hạn"
    >
      <div className="max-w-7xl mx-auto">
        <div className={cn(
          "flex items-center justify-between gap-4",
          device === 'mobile' ? 'flex-col gap-3' : ''
        )}>
          {/* Left - Content */}
          <div className={cn(
            "flex items-center gap-4",
            device === 'mobile' ? 'flex-col text-center gap-2' : ''
          )}>
            {config.discountText && (
              <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold uppercase">
                {config.discountText}
              </span>
            )}
            <span className="text-white font-semibold text-sm md:text-base">
              {config.heading || 'Flash Sale'}
            </span>
          </div>
          
          {/* Center - Timer (compact) */}
          <div className="flex items-center gap-2">
            {timeLeft.isExpired ? (
              <span className="text-white/80 text-sm">Đã kết thúc</span>
            ) : (
              <div className="flex items-center gap-1.5 text-white font-mono">
                {config.showDays && (
                  <>
                    <span className="bg-white/20 px-2 py-1 rounded text-sm font-bold">{String(timeLeft.days).padStart(2, '0')}</span>
                    <span className="text-white/60">:</span>
                  </>
                )}
                {config.showHours && (
                  <>
                    <span className="bg-white/20 px-2 py-1 rounded text-sm font-bold">{String(timeLeft.hours).padStart(2, '0')}</span>
                    <span className="text-white/60">:</span>
                  </>
                )}
                {config.showMinutes && (
                  <>
                    <span className="bg-white/20 px-2 py-1 rounded text-sm font-bold">{String(timeLeft.minutes).padStart(2, '0')}</span>
                    {config.showSeconds && <span className="text-white/60">:</span>}
                  </>
                )}
                {config.showSeconds && (
                  <span className="bg-white/20 px-2 py-1 rounded text-sm font-bold">{String(timeLeft.seconds).padStart(2, '0')}</span>
                )}
              </div>
            )}
          </div>
          
          {/* Right - CTA */}
          {config.buttonText && !timeLeft.isExpired && (
            <a 
              href={config.buttonLink || '#'} 
              className="bg-white px-4 py-1.5 rounded-full text-sm font-semibold transition-transform hover:scale-105 whitespace-nowrap"
              style={{ color: brandColor }}
            >
              {config.buttonText}
            </a>
          )}
        </div>
      </div>
    </section>
  );

  // Style 6: Popup - Modal/Dialog style (contained within preview)
  const renderPopupStyle = () => (
    <section className="relative min-h-[400px] bg-slate-100 dark:bg-slate-900">
      {/* Simulated page content behind popup */}
      <div className="absolute inset-0 p-6 opacity-30 pointer-events-none">
        <div className="max-w-4xl mx-auto">
          <div className="h-8 bg-slate-300 dark:bg-slate-700 rounded mb-4 w-3/4" />
          <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded mb-2 w-full" />
          <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded mb-2 w-5/6" />
          <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-4/6" />
        </div>
      </div>
      
      {/* Popup overlay - contained within section */}
      <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
        <div 
          className={cn(
            "bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden relative",
            device === 'mobile' ? 'w-full max-w-[280px]' : 'w-full max-w-md'
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby="popup-title"
        >
          {/* Close button */}
          <button type="button" className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 z-10">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* Image/Visual header */}
          <div 
            className={cn("flex items-center justify-center relative", device === 'mobile' ? 'h-24' : 'h-32 md:h-40')}
            style={{ 
              background: config.backgroundImage 
                ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${config.backgroundImage}) center/cover`
                : `linear-gradient(135deg, ${brandColor}ee 0%, ${brandColor} 100%)`
            }}
          >
            {config.discountText && (
              <div className="text-center text-white">
                <div className={cn("font-black", device === 'mobile' ? 'text-3xl' : 'text-4xl md:text-5xl')}>{config.discountText}</div>
                <div className="text-sm font-medium opacity-80 mt-1">{config.subHeading || 'GIẢM GIÁ'}</div>
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className={cn("text-center", device === 'mobile' ? 'p-4' : 'p-5 md:p-6')}>
            <h3 id="popup-title" className={cn("font-bold text-slate-900 dark:text-white mb-2", device === 'mobile' ? 'text-lg' : 'text-xl md:text-2xl')}>
              {config.heading || 'Ưu đãi đặc biệt!'}
            </h3>
            
            {config.description && (
              <p className="text-slate-500 text-sm mb-4 line-clamp-2">{config.description}</p>
            )}
            
            {/* Timer */}
            <div className="mb-4">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Còn lại</p>
              {timeLeft.isExpired ? <ExpiredState /> : <TimerDisplay variant="default" />}
            </div>
            
            {/* CTA */}
            {config.buttonText && !timeLeft.isExpired && (
              <a 
                href={config.buttonLink || '#'} 
                className={cn("inline-flex items-center justify-center gap-2 w-full rounded-lg font-semibold text-white transition-all hover:opacity-90", device === 'mobile' ? 'px-4 py-2.5 text-sm' : 'px-6 py-3')}
                style={{ backgroundColor: brandColor }}
              >
                {config.buttonText}
              </a>
            )}
            
            {/* Skip link */}
            <button type="button" className="text-slate-400 text-xs mt-3 hover:text-slate-600 transition-colors">
              Để sau
            </button>
          </div>
        </div>
      </div>
    </section>
  );

  return (
    <PreviewWrapper 
      title="Preview Countdown / Promotion" 
      device={device} 
      setDevice={setDevice} 
      previewStyle={previewStyle} 
      setPreviewStyle={setPreviewStyle} 
      styles={styles}
      info={getImageSizeInfo()}
    >
      <BrowserFrame>
        {previewStyle === 'banner' && renderBannerStyle()}
        {previewStyle === 'floating' && renderFloatingStyle()}
        {previewStyle === 'minimal' && renderMinimalStyle()}
        {previewStyle === 'split' && renderSplitStyle()}
        {previewStyle === 'sticky' && renderStickyStyle()}
        {previewStyle === 'popup' && renderPopupStyle()}
      </BrowserFrame>
    </PreviewWrapper>
  );
};

// ============ VOUCHER PROMOTIONS PREVIEW ============
interface VoucherPromotionsConfig {
  heading?: string;
  description?: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

const voucherSamples = [
  { code: 'EGA50', name: 'Giảm 15% đơn từ 500K', description: 'Áp dụng cho tất cả sản phẩm', max: 'Tối đa 250K', expiry: '28/12/2026' },
  { code: 'EGAT10', name: 'Giảm 10% cho đơn 1 triệu', description: 'Không áp dụng combo', max: 'Tối đa 300K', expiry: '30/12/2026' },
  { code: 'FREESHIP', name: 'Miễn phí vận chuyển nội thành', description: 'Áp dụng đơn từ 500K', max: 'Tối đa 50K', expiry: '31/12/2026' },
  { code: 'EGA500K', name: 'Giảm 90K cho đơn 1 triệu', description: 'Tối đa 1 mã/đơn', max: 'Tối đa 1 mã', expiry: '31/12/2026' },
  { code: 'VIP150', name: 'Ưu đãi khách VIP', description: 'Chỉ áp dụng khách VIP', max: 'Tối đa 150K', expiry: '05/01/2027' },
  { code: 'NEW100', name: 'Ưu đãi khách mới', description: 'Áp dụng khách đăng ký mới', max: 'Tối đa 100K', expiry: '10/01/2027' },
];

export const VoucherPromotionsPreview = ({ 
  config, 
  brandColor: _brandColor, 
  secondary,
  selectedStyle,
  limit,
  onStyleChange 
}: { 
  config: VoucherPromotionsConfig; 
  brandColor: string;
  secondary: string; 
  selectedStyle?: VoucherPromotionsStyle;
  limit?: number;
  onStyleChange?: (style: VoucherPromotionsStyle) => void;
}) => {
  const [device, setDevice] = useState<PreviewDevice>('desktop');
  const [currentIndex, setCurrentIndex] = useState(0);
  const previewStyle = normalizeVoucherStyle(selectedStyle ?? DEFAULT_VOUCHER_STYLE);
  const previewLimit = normalizeVoucherLimit(limit);
  const setPreviewStyle = (s: string) => onStyleChange?.(s as VoucherPromotionsStyle);
  const styles = [
    { id: 'enterpriseCards', label: 'Enterprise Cards' },
    { id: 'ticketHorizontal', label: 'Ticket Ngang' },
    { id: 'couponGrid', label: 'Coupon Grid' },
    { id: 'stackedBanner', label: 'Stacked Banner' },
    { id: 'carousel', label: 'Carousel' },
    { id: 'minimal', label: 'Minimal' },
  ];

  const heading = config.heading ?? 'Voucher khuyến mãi';
  const description = config.description ?? 'Áp dụng mã để nhận ưu đãi tốt nhất hôm nay.';
  const ctaLabel = config.ctaLabel ?? 'Xem tất cả ưu đãi';
  const ctaUrl = config.ctaUrl ?? '/promotions';
  const items = voucherSamples.slice(0, previewLimit);
  const carouselRef = React.useRef<HTMLDivElement>(null);
  const normalizedIndex = items.length > 0 ? ((currentIndex % items.length) + items.length) % items.length : 0;

  const scrollToIndex = (index: number) => {
    if (items.length === 0) {
      return;
    }
    const container = carouselRef.current;
    if (!container) {
      return;
    }
    const cards = container.querySelectorAll('[data-voucher-card]');
    const target = cards[index] as HTMLElement | undefined;
    if (!target) {
      return;
    }
    container.scrollTo({ left: target.offsetLeft - 12, behavior: 'smooth' });
  };

  const handlePrev = () => {
    if (items.length === 0) {
      return;
    }
    const nextIndex = normalizedIndex - 1;
    setCurrentIndex(nextIndex);
    scrollToIndex(((nextIndex % items.length) + items.length) % items.length);
  };

  const handleNext = () => {
    if (items.length === 0) {
      return;
    }
    const nextIndex = normalizedIndex + 1;
    setCurrentIndex(nextIndex);
    scrollToIndex(((nextIndex % items.length) + items.length) % items.length);
  };

  const Header = ({ align = 'center' }: { align?: 'center' | 'left' }) => (
    <div className={cn('space-y-2', align === 'center' ? 'text-center' : 'text-left')}>
      <h2 className={cn('font-bold text-slate-900 dark:text-slate-100', device === 'mobile' ? 'text-xl' : 'text-2xl md:text-3xl')}>{heading}</h2>
      <p className={cn('text-slate-500', device === 'mobile' ? 'text-sm' : 'text-base')}>{description}</p>
      {ctaLabel && ctaUrl && (
        <a href={ctaUrl} className={cn('inline-flex items-center gap-2 font-medium', device === 'mobile' ? 'text-sm' : 'text-base')} style={{ color: secondary }}>
          {ctaLabel}
          <ArrowRight size={16} />
        </a>
      )}
    </div>
  );

  const renderEnterpriseCards = () => (
    <section className="py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <Header />
        <div className={cn('grid gap-4', device === 'mobile' ? 'grid-cols-1' : (device === 'tablet' ? 'grid-cols-2' : 'grid-cols-4'))}>
          {items.map((item) => (
            <div key={item.code} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                    <Tag size={18} style={{ color: secondary }} />
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: secondary }}>Voucher</div>
                    <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{item.code}</div>
                    <div className="text-xs text-slate-500">{item.name}</div>
                  </div>
                </div>
                <button type="button" className="text-xs font-medium px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: secondary }}>Sao chép mã</button>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>{item.expiry}</span>
                <span>{item.max}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  const renderTicketHorizontal = () => (
    <section className="py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <Header align="left" />
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.code} className="relative rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
              <div className="absolute left-24 top-3 bottom-3 w-px border-l border-dashed border-slate-200 dark:border-slate-700" />
              <div className="flex">
                <div className="w-24 shrink-0 bg-slate-900 text-white flex flex-col items-center justify-center py-4">
                  <span className="text-[10px] uppercase tracking-wider">Mã</span>
                  <span className="text-base font-bold">{item.code}</span>
                </div>
                <div className="flex-1 p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.name}</div>
                    <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                    <div className="text-xs text-slate-400 mt-2">{item.expiry} • {item.max}</div>
                  </div>
                  <button type="button" className="text-xs font-medium px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: secondary }}>Sao chép mã</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  const renderCouponGrid = () => (
    <section className="py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <Header />
        <div className={cn('grid gap-4', device === 'mobile' ? 'grid-cols-1' : (device === 'tablet' ? 'grid-cols-2' : 'grid-cols-2'))}>
          {items.map((item) => (
            <div key={item.code} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <div className="flex h-full">
                <div className="w-1" style={{ backgroundColor: secondary }} />
                <div className="flex-1 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-wider" style={{ color: secondary }}>Voucher</div>
                      <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{item.code}</div>
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.name}</div>
                    </div>
                    <button type="button" className="text-xs font-medium px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: secondary }}>Sao chép mã</button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">{item.description}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span>{item.expiry}</span>
                    <span>• {item.max}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  const renderStackedBanner = () => (
    <section className="py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <Header align="left" />
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden" style={{ background: `linear-gradient(135deg, ${secondary}10, ${secondary}05)` }}>
          {items.map((item, index) => (
            <div key={item.code} className={cn('flex items-center justify-between gap-4 px-4 py-4', index < items.length - 1 && 'border-b border-dashed border-slate-200 dark:border-slate-700')}>
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${secondary}20` }}>
                  <Tag size={18} style={{ color: secondary }} />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider" style={{ color: secondary }}>Voucher</div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.code} • {item.name}</div>
                  <div className="text-xs text-slate-500 mt-1">{item.description}</div>
                  <div className="text-xs text-slate-400 mt-2">{item.expiry} • {item.max}</div>
                </div>
              </div>
              <button type="button" className="text-xs font-medium px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: secondary }}>Sao chép mã</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  const renderCarousel = () => (
    <section className="py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <Header align="left" />
        <div className="relative">
          <div ref={carouselRef} className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scroll-smooth">
            {items.map((item, index) => (
              <div
                key={item.code}
                data-voucher-card
                className={cn(
                  'min-w-[260px] max-w-[260px] snap-start rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm',
                  index === normalizedIndex && 'ring-2'
                )}
                style={index === normalizedIndex ? { '--tw-ring-color': `${secondary}40` } as React.CSSProperties : undefined}
              >
                <div className="h-2 w-16 rounded-full" style={{ backgroundColor: secondary }} />
                <div className="mt-4 text-xs uppercase tracking-wider" style={{ color: secondary }}>Voucher</div>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{item.code}</div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-1">{item.name}</div>
                <p className="text-xs text-slate-500 mt-2">{item.description}</p>
                <div className="text-xs text-slate-400 mt-3">{item.expiry} • {item.max}</div>
                <button type="button" className="mt-4 w-full text-xs font-medium px-3 py-2 rounded-lg text-white" style={{ backgroundColor: secondary }}>Sao chép mã</button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex gap-2">
              {items.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    setCurrentIndex(index);
                    scrollToIndex(index);
                  }}
                  className={cn('h-2 rounded-full transition-all', index === normalizedIndex ? 'w-6' : 'w-2 bg-slate-300')}
                  style={index === normalizedIndex ? { backgroundColor: secondary } : {}}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={handlePrev} className="h-8 w-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                <ChevronLeft size={14} />
              </button>
              <button type="button" onClick={handleNext} className="h-8 w-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const renderMinimal = () => (
    <section className="py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-1 w-16 rounded-full" style={{ backgroundColor: secondary }} />
        <Header align="left" />
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={item.code} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3">
              <div className="flex items-center gap-4">
                <div className="text-xs font-semibold text-slate-400">{String(index + 1).padStart(2, '0')}</div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.code} • {item.name}</div>
                  <div className="text-xs text-slate-500 mt-1">{item.description}</div>
                  <div className="text-xs text-slate-400 mt-1">{item.expiry} • {item.max}</div>
                </div>
              </div>
              <button type="button" className="text-xs font-medium px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: secondary }}>Sao chép mã</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  return (
    <PreviewWrapper
      title="Preview Voucher khuyến mãi"
      device={device}
      setDevice={setDevice}
      previewStyle={previewStyle}
      setPreviewStyle={setPreviewStyle}
      styles={styles}
      info={`${items.length} voucher mẫu`}
    >
      <BrowserFrame>
        {previewStyle === 'enterpriseCards' && renderEnterpriseCards()}
        {previewStyle === 'ticketHorizontal' && renderTicketHorizontal()}
        {previewStyle === 'couponGrid' && renderCouponGrid()}
        {previewStyle === 'stackedBanner' && renderStackedBanner()}
        {previewStyle === 'carousel' && renderCarousel()}
        {previewStyle === 'minimal' && renderMinimal()}
      </BrowserFrame>
    </PreviewWrapper>
  );
};

