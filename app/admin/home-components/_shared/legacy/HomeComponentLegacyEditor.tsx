'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { 
  AlertCircle, Award, Briefcase, Check, ChevronDown, ChevronUp, 
  Download, FileText, Grid, GripVertical, HelpCircle, 
  Image as ImageIcon, LayoutTemplate, Loader2, MousePointerClick, Package, Phone, Plus, Star, Tag, Trash2,
  User as UserIcon, Users, Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, cn } from '../../../components/ui';
import { CopyableInput } from '../../../components/CopyTextButton';
import type { ImageItem } from '../../../components/MultiImageUploader';
import { MultiImageUploader } from '../../../components/MultiImageUploader';
import { ImageFieldWithUpload } from '../../../components/ImageFieldWithUpload';
import type { AboutStyle, BenefitsStyle, CTAStyle, CareerStyle, ClientsStyle, ContactStyle, CountdownStyle, FaqStyle, FeaturesStyle, FooterStyle, PricingConfig, PricingStyle, ProcessStyle, SpeedDialStyle, TeamStyle, TestimonialsStyle, VideoStyle
} from './previews';
import type { ServicesStyle } from '../../services/_types';
import type { HeroContent, HeroStyle, HeroSlide } from '../../hero/_types';
import {
  AboutPreview,
  BenefitsPreview,
  CTAPreview,
  CareerPreview,
  ClientsPreview,
  ContactPreview,
  CountdownPreview,
  FaqPreview,
  FeaturesPreview,
  FooterPreview,

  PricingPreview,
  ProcessPreview,
  SpeedDialPreview,
  TeamPreview,
  TestimonialsPreview,
  VideoPreview,
  VoucherPromotionsPreview
} from './previews';
import { ServicesPreview } from '../../services/_components/ServicesPreview';
import { useBrandColors } from '../../create/shared';
import { DEFAULT_VOUCHER_STYLE, normalizeVoucherLimit, normalizeVoucherStyle, type VoucherPromotionsStyle } from '@/lib/home-components/voucher-promotions';
import { DEFAULT_HERO_CONTENT } from '../../hero/_lib/constants';
import { HeroPreview } from '../../hero/_components/HeroPreview';

const COMPONENT_TYPES = [
  { icon: LayoutTemplate, label: 'Hero Banner', value: 'Hero' },
  { icon: AlertCircle, label: 'Thống kê', value: 'Stats' },
  { icon: Package, label: 'Danh sách Sản phẩm', value: 'ProductList' },
  { icon: Briefcase, label: 'Danh sách Dịch vụ', value: 'ServiceList' },
  { icon: FileText, label: 'Tin tức / Blog', value: 'Blog' },
  { icon: Users, label: 'Đối tác / Logos', value: 'Partners' },
  { icon: MousePointerClick, label: 'Kêu gọi hành động (CTA)', value: 'CTA' },
  { icon: HelpCircle, label: 'Câu hỏi thường gặp', value: 'FAQ' },
  { icon: UserIcon, label: 'Về chúng tôi', value: 'About' },
  { icon: LayoutTemplate, label: 'Footer', value: 'Footer' },
  { icon: Briefcase, label: 'Dịch vụ chi tiết', value: 'Services' },
  { icon: Check, label: 'Lợi ích', value: 'Benefits' },
  { icon: Star, label: 'Đánh giá / Review', value: 'Testimonials' },
  { icon: Award, label: 'Chứng nhận', value: 'TrustBadges' },
  { icon: Tag, label: 'Bảng giá', value: 'Pricing' },
  { icon: ImageIcon, label: 'Thư viện ảnh', value: 'Gallery' },
  { icon: FileText, label: 'Dự án thực tế', value: 'CaseStudy' },
  { icon: Users, label: 'Tuyển dụng', value: 'Career' },
  { icon: Phone, label: 'Liên hệ', value: 'Contact' },
  { icon: Package, label: 'Sản phẩm', value: 'ProductGrid' },
  { icon: FileText, label: 'Tin tức', value: 'News' },
  { icon: LayoutTemplate, label: 'Banner', value: 'Banner' },
  { icon: Zap, label: 'Speed Dial', value: 'SpeedDial' },
  { icon: Package, label: 'Danh mục sản phẩm', value: 'ProductCategories' },
  { icon: Package, label: 'Sản phẩm theo danh mục', value: 'CategoryProducts' },
  { icon: Users, label: 'Đội ngũ', value: 'Team' },
  { icon: Zap, label: 'Tính năng', value: 'Features' },
  { icon: LayoutTemplate, label: 'Quy trình', value: 'Process' },
  { icon: Users, label: 'Banner ảnh thương hiệu', value: 'Clients' },
  { icon: LayoutTemplate, label: 'Video / Media', value: 'Video' },
  { icon: AlertCircle, label: 'Khuyến mãi / Countdown', value: 'Countdown' },
  { icon: Tag, label: 'Voucher khuyến mãi', value: 'VoucherPromotions' },
];

interface GalleryItem extends ImageItem {
  id: string | number;
  url: string;
  link: string;
  name?: string;
}

type LegacyEditableComponent = {
  _id: string;
  active: boolean;
  config?: Record<string, any>;
  title: string;
  type: string;
};

type HomeComponentEditPageProps = {
  backHref?: string;
  onSnapshotSave?: (next: { active: boolean; config: Record<string, any>; title: string }) => Promise<void>;
  params?: Promise<{ id: string }>;
  snapshotComponent?: LegacyEditableComponent;
};

export default function HomeComponentEditPage({
  backHref = '/admin/home-components',
  onSnapshotSave,
  params,
  snapshotComponent,
}: HomeComponentEditPageProps) {
  const routeParams = snapshotComponent ? null : use(params!);
  const id = snapshotComponent?._id ?? routeParams?.id ?? '';
  const router = useRouter();
  const searchParams = useSearchParams();
  const { primary, secondary, mode } = useBrandColors();
  const modeSetting = useQuery(api.settings.getByKey, { key: 'site_brand_mode' });
  const brandMode = modeSetting?.value === 'single' ? 'single' : 'dual';
  const brandColor = primary;
  
  const liveComponent = useQuery(api.homeComponents.getById, snapshotComponent ? 'skip' : { id: id as Id<"homeComponents"> });
  const component = snapshotComponent ?? liveComponent;
  const updateMutation = useMutation(api.homeComponents.update);
  // Query settings for Footer
  const siteLogo = useQuery(api.settings.getByKey, { key: 'site_logo' });
  const socialFacebook = useQuery(api.settings.getByKey, { key: 'social_facebook' });
  const socialInstagram = useQuery(api.settings.getByKey, { key: 'social_instagram' });
  const socialYoutube = useQuery(api.settings.getByKey, { key: 'social_youtube' });
  const socialTiktok = useQuery(api.settings.getByKey, { key: 'social_tiktok' });
  const socialZalo = useQuery(api.settings.getByKey, { key: 'contact_zalo' });
  
  const [title, setTitle] = useState('');
  const [active, setActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Config states for different component types
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [heroStyle, setHeroStyle] = useState<HeroStyle>('slider');
  const [heroContent, setHeroContent] = useState<HeroContent>(DEFAULT_HERO_CONTENT);
  const [ctaConfig, setCtaConfig] = useState({ badge: '', buttonLink: '', buttonText: '', description: '', secondaryButtonLink: '', secondaryButtonText: '', title: '' });
  const [ctaStyle, setCtaStyle] = useState<CTAStyle>('banner');
  const [faqItems, setFaqItems] = useState<{id: number, question: string, answer: string}[]>([]);
  const [faqStyle, setFaqStyle] = useState<FaqStyle>('accordion');
  const [faqConfig, setFaqConfig] = useState<{description?: string, buttonText?: string, buttonLink?: string}>({
    buttonLink: '', buttonText: '', description: ''
  });
  const [aboutConfig, setAboutConfig] = useState({ buttonLink: '', buttonText: '', description: '', heading: '', image: '', imageCaption: '', stats: [] as {id: number, value: string, label: string}[], style: 'bento' as AboutStyle, subHeading: '' });
  const [footerConfig, setFooterConfig] = useState({
    columns: [] as { id: number; title: string; links: { label: string; url: string }[] }[],
    copyright: '',
    description: '',
    logo: '',
    showSocialLinks: true,
    socialLinks: [] as { id: number; platform: string; url: string; icon: string }[]
  });
  const [footerStyle, setFooterStyle] = useState<FooterStyle>('classic');
  const [servicesItems, setServicesItems] = useState<{id: number, icon: string, title: string, description: string}[]>([]);
  const [servicesStyle, setServicesStyle] = useState<ServicesStyle>('elegantGrid');
  const [draggedServiceId, setDraggedServiceId] = useState<number | null>(null);
  const [dragOverServiceId, setDragOverServiceId] = useState<number | null>(null);
  const [benefitsItems, setBenefitsItems] = useState<{id: number, icon: string, title: string, description: string}[]>([]);
  const [benefitsStyle, setBenefitsStyle] = useState<BenefitsStyle>('cards');
  const [benefitsConfig, setBenefitsConfig] = useState<{subHeading?: string, heading?: string, buttonText?: string, buttonLink?: string}>({});
  const [testimonialsItems, setTestimonialsItems] = useState<{id: number, name: string, role: string, content: string, avatar: string, rating: number}[]>([]);
  const [testimonialsStyle, setTestimonialsStyle] = useState<TestimonialsStyle>('cards');
  const [draggedTestimonialId, setDraggedTestimonialId] = useState<number | null>(null);
  const [dragOverTestimonialId, setDragOverTestimonialId] = useState<number | null>(null);
  const [pricingPlans, setPricingPlans] = useState<{id: number, name: string, price: string, yearlyPrice: string, period: string, features: string[], isPopular: boolean, buttonText: string, buttonLink: string}[]>([]);
  const [pricingStyle, setPricingStyle] = useState<PricingStyle>('cards');
  const [pricingConfig, setPricingConfig] = useState<PricingConfig>({ monthlyLabel: 'Hàng tháng', showBillingToggle: true, subtitle: '', yearlyLabel: 'Hàng năm', yearlySavingText: 'Tiết kiệm 17%' });
  const [draggedPricingId, setDraggedPricingId] = useState<number | null>(null);
  const [dragOverPricingId, setDragOverPricingId] = useState<number | null>(null);
  const [careerJobs, setCareerJobs] = useState<{id: number, title: string, department: string, location: string, type: string, salary: string, description: string}[]>([]);
  const [careerStyle, setCareerStyle] = useState<CareerStyle>('cards');
  const [speedDialActions, setSpeedDialActions] = useState<{id: number, icon: string, label: string, url: string, bgColor: string}[]>([]);
  const [speedDialStyle, setSpeedDialStyle] = useState<SpeedDialStyle>('fab');
  const [speedDialPosition, setSpeedDialPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right');
  const [speedDialAlwaysOpen, setSpeedDialAlwaysOpen] = useState(true);
  // Team states
  const [teamMembers, setTeamMembers] = useState<{id: number, name: string, role: string, avatar: string, bio: string, facebook: string, linkedin: string, twitter: string, email: string}[]>([]);
  const [teamStyle, setTeamStyle] = useState<TeamStyle>('grid');
  const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null);
  // Features states
  const [featuresItems, setFeaturesItems] = useState<{id: number, icon: string, title: string, description: string}[]>([]);
  const [featuresStyle, setFeaturesStyle] = useState<FeaturesStyle>('iconGrid');
  // Process states
  const [processSteps, setProcessSteps] = useState<{id: number, icon: string, title: string, description: string}[]>([]);
  const [processStyle, setProcessStyle] = useState<ProcessStyle>('horizontal');
  // Clients states
  const [clientItems, setClientItems] = useState<GalleryItem[]>([]);
  const [clientsStyle, setClientsStyle] = useState<ClientsStyle>('marquee');
  // Video states
  const [videoConfig, setVideoConfig] = useState({ autoplay: false, badge: '', buttonLink: '', buttonText: '', description: '', heading: '', loop: false, muted: true, thumbnailUrl: '', videoUrl: '' });
  const [videoStyle, setVideoStyle] = useState<VideoStyle>('centered');
  // Countdown states
  const [countdownConfig, setCountdownConfig] = useState({
    backgroundImage: '', buttonLink: '', buttonText: '', description: '', discountText: '', endDate: '',
    heading: '', showDays: true, showHours: true, showMinutes: true, showSeconds: true, subHeading: ''
  });
  const [countdownStyle, setCountdownStyle] = useState<CountdownStyle>('banner');
  const [voucherConfig, setVoucherConfig] = useState({
    ctaLabel: 'Xem tất cả ưu đãi',
    ctaUrl: '/promotions',
    description: 'Áp dụng mã để nhận ưu đãi tốt nhất hôm nay.',
    heading: 'Voucher khuyến mãi'
  });
  const [voucherStyle, setVoucherStyle] = useState<VoucherPromotionsStyle>(DEFAULT_VOUCHER_STYLE);
  const [voucherLimit, setVoucherLimit] = useState(4);
  const [contactConfig, setContactConfig] = useState({ address: '', email: '', formDescription: '', formFields: ['name', 'email', 'phone', 'message'], formTitle: '', mapEmbed: '', phone: '', responseTimeText: '', showMap: true, socialLinks: [] as { id: number; platform: string; url: string }[], submitButtonText: '', workingHours: '' });
  const [contactStyle, setContactStyle] = useState<ContactStyle>('modern');

  // Initialize form with component data
  useEffect(() => {
    if (component && !isInitialized) {
      if (!snapshotComponent && component.type === 'Partners') {
        router.replace(`/admin/home-components/partners/${component._id}/edit`);
        return;
      }
      if (!snapshotComponent && component.type === 'CategoryProducts') {
        router.replace(`/admin/home-components/category-products/${component._id}/edit`);
        return;
      }
      if (!snapshotComponent && component.type === 'ProductCategories') {
        router.replace(`/admin/home-components/product-categories/${component._id}/edit`);
        return;
      }
      if (!snapshotComponent && component.type === 'ProductList') {
        router.replace(`/admin/home-components/product-list/${component._id}/edit`);
        return;
      }
      if (!snapshotComponent && component.type === 'Gallery') {
        router.replace(`/admin/home-components/gallery/${component._id}/edit`);
        return;
      }
      if (!snapshotComponent && component.type === 'TrustBadges') {
        router.replace(`/admin/home-components/trust-badges/${component._id}/edit`);
        return;
      }
      setTitle(component.title);
      setActive(component.active);
      
      const config = component.config ?? {};
      
      // Initialize config based on type
      switch (component.type) {
        case 'Banner':
        case 'Hero': {
          setHeroSlides(config.slides?.map((s: {image: string, link: string}, i: number) => ({ id: `slide-${i}`, link: s.link || '', url: s.image })) ?? [{ id: 'slide-1', link: '', url: '' }]);
          setHeroStyle((config.style as HeroStyle) || 'slider');
          if (config.content) {
            setHeroContent(config.content as HeroContent);
          }
          break;
        }
        case 'CTA': {
          setCtaConfig({ badge: config.badge ?? '', buttonLink: config.buttonLink ?? '', buttonText: config.buttonText ?? '', description: config.description ?? '', secondaryButtonLink: config.secondaryButtonLink ?? '', secondaryButtonText: config.secondaryButtonText ?? '', title: config.title ?? '' });
          setCtaStyle((config.style as CTAStyle) || 'banner');
          break;
        }
        case 'FAQ': {
          setFaqItems(config.items?.map((item: {question: string, answer: string}, i: number) => ({ answer: item.answer, id: i, question: item.question })) ?? [{ answer: '', id: 1, question: '' }]);
          setFaqStyle((config.style as FaqStyle) || 'accordion');
          setFaqConfig({
            buttonLink: config.buttonLink ?? '',
            buttonText: config.buttonText ?? '',
            description: config.description ?? ''
          });
          break;
        }
        case 'About': {
          setAboutConfig({ 
            buttonLink: config.buttonLink ?? '',
            buttonText: config.buttonText ?? '',
            description: config.description ?? '',
            heading: config.heading ?? '',
            image: config.image ?? '',
            imageCaption: config.imageCaption ?? '',
            stats: config.stats?.map((s: {value: string, label: string}, i: number) => ({ id: i, label: s.label, value: s.value })) ?? [],
            style: (config.style as AboutStyle) || 'bento',
            subHeading: config.subHeading ?? '' 
          });
          break;
        }
        case 'Footer': {
          setFooterConfig({
            columns: config.columns?.map((c: { title: string; links: { label: string; url: string }[] }, i: number) => ({
              id: i + 1,
              links: c.links || [],
              title: c.title
            })) ?? [],
            copyright: config.copyright ?? '',
            description: config.description ?? '',
            logo: config.logo ?? '',
            showSocialLinks: config.showSocialLinks ?? true,
            socialLinks: config.socialLinks?.map((s: { platform: string; url: string; icon: string }, i: number) => ({
              icon: s.icon,
              id: i + 1,
              platform: s.platform,
              url: s.url
            })) ?? []
          });
          setFooterStyle((config.style as FooterStyle) || 'classic');
          break;
        }
        case 'Services': {
          setServicesItems(config.items?.map((item: {icon: string, title: string, description: string}, i: number) => ({ description: item.description, icon: item.icon, id: i, title: item.title })) ?? []);
          setServicesStyle((config.style as ServicesStyle) || 'elegantGrid');
          break;
        }
        case 'Benefits': {
          setBenefitsItems(config.items?.map((item: {icon: string, title: string, description: string}, i: number) => ({ description: item.description, icon: item.icon, id: i, title: item.title })) ?? []);
          setBenefitsStyle((config.style as BenefitsStyle) || 'cards');
          setBenefitsConfig({
            buttonLink: config.buttonLink ?? '',
            buttonText: config.buttonText ?? '',
            heading: config.heading ?? 'Giá trị cốt lõi',
            subHeading: config.subHeading ?? 'Vì sao chọn chúng tôi?'
          });
          break;
        }
        case 'Testimonials': {
          setTestimonialsItems(config.items?.map((item: {name: string, role: string, content: string, avatar: string, rating: number}, i: number) => ({ id: i, ...item })) ?? []);
          setTestimonialsStyle((config.style as TestimonialsStyle) || 'cards');
          break;
        }
        case 'Pricing': {
          setPricingPlans(config.plans?.map((p: {name: string, price: string, yearlyPrice?: string, period: string, features: string[], isPopular: boolean, buttonText: string, buttonLink: string}, i: number) => ({ id: i, yearlyPrice: '', ...p })) ?? []);
          setPricingStyle((config.style as PricingStyle) || 'cards');
          setPricingConfig({
            monthlyLabel: (config.monthlyLabel as string) || 'Hàng tháng',
            showBillingToggle: config.showBillingToggle !== false,
            subtitle: (config.subtitle as string) || 'Chọn gói phù hợp với nhu cầu của bạn',
            yearlyLabel: (config.yearlyLabel as string) || 'Hàng năm',
            yearlySavingText: (config.yearlySavingText as string) || 'Tiết kiệm 17%'
          });
          break;
        }
        case 'Career': {
          setCareerJobs(config.jobs?.map((j: {title: string, department: string, location: string, type: string, salary: string, description: string}, i: number) => ({ id: i, ...j })) ?? []);
          setCareerStyle((config.style as CareerStyle) || 'cards');
          break;
        }
        case 'Contact': {
          setContactConfig({ 
            address: config.address ?? '', email: config.email ?? '', formDescription: (config.formDescription as string) || '', formFields: (config.formFields as string[]) || ['name', 'email', 'phone', 'message'], 
            formTitle: (config.formTitle as string) || '', mapEmbed: config.mapEmbed ?? '', 
            phone: config.phone ?? '',
            responseTimeText: (config.responseTimeText as string) || '',
            showMap: config.showMap ?? true, socialLinks: (config.socialLinks as { id: number; platform: string; url: string }[]) || [],
            submitButtonText: (config.submitButtonText as string) || '', workingHours: config.workingHours ?? ''
          });
          setContactStyle((config.style as ContactStyle) || 'modern');
          break;
        }
        case 'SpeedDial': {
          setSpeedDialActions(config.actions?.map((a: {icon: string, label: string, url: string, bgColor: string}, i: number) => ({ id: i, ...a })) ?? [{ bgColor: '#22c55e', icon: 'phone', id: 1, label: 'Gọi ngay', url: '' }]);
          setSpeedDialStyle((config.style as SpeedDialStyle) || 'fab');
          setSpeedDialPosition(config.position ?? 'bottom-right');
          setSpeedDialAlwaysOpen(config.alwaysOpen ?? true);
          break;
        }
        case 'Team': {
          setTeamMembers(config.members?.map((m: {name: string, role: string, avatar: string, bio: string, facebook?: string, linkedin?: string, twitter?: string, email?: string}, i: number) => ({ 
            avatar: m.avatar || '', 
            bio: m.bio || '', 
            email: m.email ?? '', 
            facebook: m.facebook ?? '', 
            id: i, 
            linkedin: m.linkedin ?? '', 
            name: m.name || '', 
            role: m.role || '', 
            twitter: m.twitter ?? '' 
          })) ?? []);
          setTeamStyle((config.style as TeamStyle) || 'grid');
          break;
        }
        case 'Features': {
          setFeaturesItems(config.items?.map((item: {icon: string, title: string, description: string}, i: number) => ({ description: item.description, icon: item.icon || 'Zap', id: i, title: item.title })) ?? []);
          setFeaturesStyle((config.style as FeaturesStyle) || 'iconGrid');
          break;
        }
        case 'Process': {
          setProcessSteps(config.steps?.map((step: {icon: string, title: string, description: string}, i: number) => ({ description: step.description, icon: step.icon || String(i + 1), id: i, title: step.title })) ?? []);
          setProcessStyle((config.style as ProcessStyle) || 'horizontal');
          break;
        }
        case 'Clients': {
          setClientItems(config.items?.map((item: {url: string, link: string, name?: string}, i: number) => ({ id: `item-${i}`, link: item.link || '', name: item.name ?? '', url: item.url })) ?? []);
          setClientsStyle((config.style as ClientsStyle) || 'marquee');
          break;
        }
        case 'Video': {
          setVideoConfig({
            autoplay: config.autoplay as boolean || false,
            badge: config.badge as string || '',
            buttonLink: config.buttonLink as string || '',
            buttonText: config.buttonText as string || '',
            description: config.description as string || '',
            heading: config.heading as string || '',
            loop: config.loop as boolean || false,
            muted: config.muted as boolean ?? true,
            thumbnailUrl: config.thumbnailUrl as string || '',
            videoUrl: config.videoUrl as string || '',
          });
          setVideoStyle((config.style as VideoStyle) || 'centered');
          break;
        }
        case 'Countdown': {
          setCountdownConfig({
            backgroundImage: config.backgroundImage as string || '',
            buttonLink: config.buttonLink as string || '',
            buttonText: config.buttonText as string || '',
            description: config.description as string || '',
            discountText: config.discountText as string || '',
            endDate: config.endDate as string || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
            heading: config.heading as string || '',
            showDays: config.showDays as boolean ?? true,
            showHours: config.showHours as boolean ?? true,
            showMinutes: config.showMinutes as boolean ?? true,
            showSeconds: config.showSeconds as boolean ?? true,
            subHeading: config.subHeading as string || '',
          });
          setCountdownStyle((config.style as CountdownStyle) || 'banner');
          break;
        }
        case 'VoucherPromotions': {
          setVoucherConfig({
            ctaLabel: (config.ctaLabel as string) || 'Xem tất cả ưu đãi',
            ctaUrl: (config.ctaUrl as string) || '/promotions',
            description: (config.description as string) || 'Áp dụng mã để nhận ưu đãi tốt nhất hôm nay.',
            heading: (config.heading as string) || 'Voucher khuyến mãi',
          });
          setVoucherStyle(normalizeVoucherStyle(config.style as string | undefined));
          setVoucherLimit(normalizeVoucherLimit(config.limit as number | undefined));
          break;
        }
      }
      
      setIsInitialized(true);
    }
  }, [component, isInitialized, brandColor, router, snapshotComponent]);

  useEffect(() => {
    if (snapshotComponent) {return;}
    const typeParam = searchParams.get('type');
    if (typeParam?.toLowerCase() === 'hero') {
      router.replace(`/admin/home-components/hero/${id}/edit`);
    }
    if (typeParam?.toLowerCase() === 'stats') {
      router.replace(`/admin/home-components/stats/${id}/edit`);
    }
    if (['casestudy', 'case-study'].includes(typeParam?.toLowerCase() ?? '')) {
      router.replace(`/admin/home-components/case-study/${id}/edit`);
    }
    if (typeParam?.toLowerCase() === 'servicelist') {
      router.replace(`/admin/home-components/service-list/${id}/edit`);
    }
    if (typeParam?.toLowerCase() === 'productgrid') {
      router.replace(`/admin/home-components/product-grid/${id}/edit`);
    }
    if (typeParam?.toLowerCase() === 'productlist') {
      router.replace(`/admin/home-components/product-list/${id}/edit`);
    }
    if (typeParam?.toLowerCase() === 'blog') {
      router.replace(`/admin/home-components/blog/${id}/edit`);
    }
    if (typeParam?.toLowerCase() === 'cta') {
      router.replace(`/admin/home-components/cta/${id}/edit`);
    }
    if (typeParam?.toLowerCase() === 'faq') {
      router.replace(`/admin/home-components/faq/${id}/edit`);
    }
    if (typeParam?.toLowerCase() === 'about') {
      router.replace(`/admin/home-components/about/${id}/edit`);
    }
    if (typeParam?.toLowerCase() === 'footer') {
      router.replace(`/admin/home-components/footer/${id}/edit`);
    }
    if (typeParam?.toLowerCase() === 'services') {
      router.replace(`/admin/home-components/services/${id}/edit`);
    }
    if (typeParam?.toLowerCase() === 'benefits') {
      router.replace(`/admin/home-components/benefits/${id}/edit`);
    }
    if (typeParam?.toLowerCase() === 'testimonials') {
      router.replace(`/admin/home-components/testimonials/${id}/edit`);
    }
    if (typeParam?.toLowerCase() === 'pricing') {
      router.replace(`/admin/home-components/pricing/${id}/edit`);
    }
    if (typeParam?.toLowerCase() === 'career') {
      router.replace(`/admin/home-components/career/${id}/edit`);
    }
    if (typeParam?.toLowerCase() === 'contact') {
      router.replace(`/admin/home-components/contact/${id}/edit`);
    }
    if (typeParam?.toLowerCase() === 'speed-dial') {
      router.replace(`/admin/home-components/speed-dial/${id}/edit`);
    }
    if (typeParam?.toLowerCase() === 'team') {
      router.replace(`/admin/home-components/team/${id}/edit`);
    }
    if (typeParam?.toLowerCase() === 'features') {
      router.replace(`/admin/home-components/features/${id}/edit`);
    }
    if (typeParam?.toLowerCase() === 'process') {
      router.replace(`/admin/home-components/process/${id}/edit`);
    }
    if (typeParam?.toLowerCase() === 'clients') {
      router.replace(`/admin/home-components/clients/${id}/edit`);
    }
    if (typeParam?.toLowerCase() === 'video') {
      router.replace(`/admin/home-components/video/${id}/edit`);
    }
    if (typeParam?.toLowerCase() === 'countdown') {
      router.replace(`/admin/home-components/countdown/${id}/edit`);
    }
    if (typeParam?.toLowerCase() === 'voucher-promotions') {
      router.replace(`/admin/home-components/voucher-promotions/${id}/edit`);
    }
  }, [id, router, searchParams, snapshotComponent]);

  useEffect(() => {
    if (snapshotComponent) {return;}
    if (component?.type === 'Hero') {
      router.replace(`/admin/home-components/hero/${id}/edit`);
    }
    if (component?.type === 'Stats') {
      router.replace(`/admin/home-components/stats/${id}/edit`);
    }
    if (component?.type === 'CaseStudy') {
      router.replace(`/admin/home-components/case-study/${id}/edit`);
    }
    if (component?.type === 'ServiceList') {
      router.replace(`/admin/home-components/service-list/${id}/edit`);
    }
    if (component?.type === 'ProductGrid') {
      router.replace(`/admin/home-components/product-grid/${id}/edit`);
    }
    if (component?.type === 'ProductList') {
      router.replace(`/admin/home-components/product-list/${id}/edit`);
    }
    if (component?.type === 'Blog') {
      router.replace(`/admin/home-components/blog/${id}/edit`);
    }
    if (component?.type === 'CTA') {
      router.replace(`/admin/home-components/cta/${id}/edit`);
    }
    if (component?.type === 'FAQ') {
      router.replace(`/admin/home-components/faq/${id}/edit`);
    }
    if (component?.type === 'About') {
      router.replace(`/admin/home-components/about/${id}/edit`);
    }
    if (component?.type === 'Footer') {
      router.replace(`/admin/home-components/footer/${id}/edit`);
    }
    if (component?.type === 'Services') {
      router.replace(`/admin/home-components/services/${id}/edit`);
    }
    if (component?.type === 'Benefits') {
      router.replace(`/admin/home-components/benefits/${id}/edit`);
    }
    if (component?.type === 'Testimonials') {
      router.replace(`/admin/home-components/testimonials/${id}/edit`);
    }
    if (component?.type === 'Pricing') {
      router.replace(`/admin/home-components/pricing/${id}/edit`);
    }
    if (component?.type === 'Career') {
      router.replace(`/admin/home-components/career/${id}/edit`);
    }
    if (component?.type === 'Contact') {
      router.replace(`/admin/home-components/contact/${id}/edit`);
    }
    if (component?.type === 'SpeedDial') {
      router.replace(`/admin/home-components/speed-dial/${id}/edit`);
    }
    if (component?.type === 'Team') {
      router.replace(`/admin/home-components/team/${id}/edit`);
    }
    if (component?.type === 'Features') {
      router.replace(`/admin/home-components/features/${id}/edit`);
    }
    if (component?.type === 'Process') {
      router.replace(`/admin/home-components/process/${id}/edit`);
    }
    if (component?.type === 'Clients') {
      router.replace(`/admin/home-components/clients/${id}/edit`);
    }
    if (component?.type === 'Video') {
      router.replace(`/admin/home-components/video/${id}/edit`);
    }
    if (component?.type === 'Countdown') {
      router.replace(`/admin/home-components/countdown/${id}/edit`);
    }
    if (component?.type === 'VoucherPromotions') {
      router.replace(`/admin/home-components/voucher-promotions/${id}/edit`);
    }
  }, [component, id, router, snapshotComponent]);

  if (component === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (component === null) {
    return <div className="text-center py-8 text-slate-500">Không tìm thấy component</div>;
  }

  if (!snapshotComponent && (
    [
      'hero', 'stats', 'casestudy', 'case-study', 'servicelist', 'productgrid', 'productlist', 'blog',
      'cta', 'faq', 'about', 'footer', 'services', 'benefits', 'testimonials', 'pricing', 'career', 'contact',
      'speed-dial', 'team', 'features', 'process', 'clients', 'video', 'countdown', 'voucher-promotions'
    ].includes(searchParams.get('type')?.toLowerCase() ?? '')
    || [
      'Hero', 'Stats', 'CaseStudy', 'ServiceList', 'ProductGrid', 'ProductList', 'Blog',
      'CTA', 'FAQ', 'About', 'Footer', 'Services', 'Benefits', 'Testimonials', 'Pricing', 'Career', 'Contact',
      'SpeedDial', 'Team', 'Features', 'Process', 'Clients', 'Video', 'Countdown', 'VoucherPromotions'
    ].includes(component.type)
  )) {
    return <div className="flex items-center justify-center h-64 text-slate-500">Đang chuyển hướng...</div>;
  }

  const TypeIcon = COMPONENT_TYPES.find(t => t.value === component.type)?.icon ?? Grid;
  const typeLabel = COMPONENT_TYPES.find(t => t.value === component.type)?.label ?? component.type;

  const buildConfig = () => {
    switch (component.type) {
      case 'Banner':
      case 'Hero': {
        return { 
          content: heroContent, 
          slides: heroSlides.map(s => ({ image: s.url, link: s.link })),
          style: heroStyle,
        };
      }
      case 'CTA': {
        return { ...ctaConfig, style: ctaStyle };
      }
      case 'FAQ': {
        return { items: faqItems.map(f => ({ answer: f.answer, question: f.question })), style: faqStyle, ...faqConfig };
      }
      case 'About': {
        return aboutConfig;
      }
      case 'Footer': {
        return {
          columns: footerConfig.columns.map(c => ({ links: c.links, title: c.title })),
          copyright: footerConfig.copyright,
          description: footerConfig.description,
          logo: footerConfig.logo,
          showSocialLinks: footerConfig.showSocialLinks,
          socialLinks: footerConfig.socialLinks.map(s => ({ icon: s.icon, platform: s.platform, url: s.url })),
          style: footerStyle
        };
      }
      case 'Services': {
        return { items: servicesItems.map(s => ({ description: s.description, icon: s.icon, title: s.title })), style: servicesStyle };
      }
      case 'Benefits': {
        return { 
          buttonLink: benefitsConfig.buttonLink, 
          buttonText: benefitsConfig.buttonText,
          heading: benefitsConfig.heading,
          items: benefitsItems.map(s => ({ description: s.description, icon: s.icon, title: s.title })),
          style: benefitsStyle,
          subHeading: benefitsConfig.subHeading
        };
      }
      case 'Testimonials': {
        return { items: testimonialsItems.map(t => ({ avatar: t.avatar, content: t.content, name: t.name, rating: t.rating, role: t.role })), style: testimonialsStyle };
      }
      case 'Pricing': {
        return { 
          plans: pricingPlans.map(p => ({ buttonLink: p.buttonLink, buttonText: p.buttonText, features: p.features, isPopular: p.isPopular, name: p.name, period: p.period, price: p.price, yearlyPrice: p.yearlyPrice })), 
          style: pricingStyle,
          ...pricingConfig
        };
      }
      case 'Career': {
        return { jobs: careerJobs.map(j => ({ department: j.department, description: j.description, location: j.location, salary: j.salary, title: j.title, type: j.type })), style: careerStyle };
      }
      case 'Contact': {
        return { ...contactConfig, style: contactStyle };
      }
      case 'SpeedDial': {
        return {
          actions: speedDialActions.map(a => ({ bgColor: a.bgColor, icon: a.icon, label: a.label, url: a.url })),
          alwaysOpen: speedDialAlwaysOpen,
          mainButtonColor: brandColor,
          position: speedDialPosition,
          style: speedDialStyle,
        };
      }
      case 'Team': {
        return {
          members: teamMembers.map(m => ({ 
            avatar: m.avatar, 
            bio: m.bio, 
            email: m.email, 
            facebook: m.facebook, 
            linkedin: m.linkedin, 
            name: m.name, 
            role: m.role, 
            twitter: m.twitter 
          })),
          style: teamStyle,
        };
      }
      case 'Features': {
        return { 
          items: featuresItems.map(f => ({ description: f.description, icon: f.icon, title: f.title })), 
          style: featuresStyle 
        };
      }
      case 'Process': {
        return { 
          steps: processSteps.map(s => ({ description: s.description, icon: s.icon, title: s.title })), 
          style: processStyle 
        };
      }
      case 'Clients': {
        return { 
          items: clientItems.map(c => ({ link: c.link, name: c.name, url: c.url })), 
          style: clientsStyle 
        };
      }
      case 'Video': {
        return {
          ...videoConfig,
          style: videoStyle,
        };
      }
      case 'Countdown': {
        return {
          ...countdownConfig,
          style: countdownStyle,
        };
      }
      case 'VoucherPromotions': {
        return {
          ...voucherConfig,
          limit: normalizeVoucherLimit(voucherLimit),
          style: voucherStyle,
        };
      }
      default: {
        return {};
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) {return;}
    
    setIsSubmitting(true);
    try {
      const config = buildConfig();
      if (onSnapshotSave) {
        await onSnapshotSave({ active, config, title });
      } else {
        await updateMutation({
          active,
          config,
          id: id as Id<"homeComponents">,
          title,
        });
      }
      toast.success('Đã cập nhật component');
    } catch (error) {
      toast.error('Lỗi khi cập nhật');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa Component</h1>
        <Link href={backHref} className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TypeIcon size={20} />
              {typeLabel}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tiêu đề hiển thị <span className="text-red-500">*</span></Label>
              <CopyableInput
                value={title} 
                onChange={(e) =>{  setTitle(e.target.value); }} 
                copyLabel="tiêu đề hiển thị"
                required 
                placeholder="Nhập tiêu đề component..." 
              />
            </div>

            <div className="flex items-center gap-3">
              <Label>Trạng thái:</Label>
              <div 
                className={cn(
                  "cursor-pointer inline-flex items-center justify-center rounded-full w-12 h-6 transition-colors",
                  active ? "bg-green-500" : "bg-slate-300 dark:bg-slate-600"
                )}
                onClick={() =>{  setActive(!active); }}
              >
                <div className={cn(
                  "w-5 h-5 bg-white rounded-full transition-transform shadow",
                  active ? "translate-x-2.5" : "-translate-x-2.5"
                )}></div>
              </div>
              <span className="text-sm text-slate-500">{active ? 'Bật' : 'Tắt'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Banner slides */}
        {(component.type === 'Banner' || component.type === 'Hero') && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Danh sách Banner (Slider)</CardTitle>
              </CardHeader>
              <CardContent>
                <MultiImageUploader<HeroSlide>
                  items={heroSlides}
                  onChange={setHeroSlides}
                  folder="hero-banners"
                  imageKey="url"
                  extraFields={[{ key: 'link', placeholder: 'URL liên kết (khi click vào banner)', type: 'url' }]}
                  minItems={1}
                  maxItems={10}
                  aspectRatio="banner"
                  columns={1}
                  showReorder={true}
                  deleteMode="defer"
                  addButtonText="Thêm Banner"
                />
              </CardContent>
            </Card>
            {/* Form nội dung cho styles: fullscreen, conquest, split, parallax */}
            {['fullscreen', 'conquest', 'split', 'parallax'].includes(heroStyle) && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-base">Nội dung Hero ({heroStyle})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Badge / Nhãn</Label>
                      <Input 
                        value={heroContent.badge} 
                        onChange={(e) =>{  setHeroContent({...heroContent, badge: e.target.value}); }}
                        placeholder="VD: Nổi bật, Hot, Mới..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tiêu đề chính</Label>
                      <Input 
                        value={heroContent.heading} 
                        onChange={(e) =>{  setHeroContent({...heroContent, heading: e.target.value}); }}
                        placeholder="Tiêu đề lớn hiển thị trên hero"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Mô tả</Label>
                    <textarea 
                      value={heroContent.description} 
                      onChange={(e) =>{  setHeroContent({...heroContent, description: e.target.value}); }}
                      placeholder="Mô tả ngắn gọn..."
                      className="w-full min-h-[60px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nút chính</Label>
                      <Input 
                        value={heroContent.primaryButtonText} 
                        onChange={(e) =>{  setHeroContent({...heroContent, primaryButtonText: e.target.value}); }}
                        placeholder="VD: Khám phá ngay, Mua ngay..."
                      />
                    </div>
                    {(heroStyle === 'fullscreen' || heroStyle === 'conquest') && (
                      <div className="space-y-2">
                        <Label>Nút phụ</Label>
                        <Input 
                          value={heroContent.secondaryButtonText} 
                          onChange={(e) =>{  setHeroContent({...heroContent, secondaryButtonText: e.target.value}); }}
                          placeholder="VD: Tìm hiểu thêm..."
                        />
                      </div>
                    )}
                    {heroStyle === 'parallax' && (
                      <div className="space-y-2">
                        <Label>Text đếm ngược / Phụ</Label>
                        <Input 
                          value={heroContent.countdownText} 
                          onChange={(e) =>{  setHeroContent({...heroContent, countdownText: e.target.value}); }}
                          placeholder="VD: Còn 3 ngày, Chỉ hôm nay..."
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            <HeroPreview 
              slides={heroSlides.map((s, idx) => ({ id: idx + 1, image: s.url, link: s.link }))} 
              brandColor={brandColor} secondary={secondary}
              mode={brandMode}
              selectedStyle={heroStyle}
              onStyleChange={setHeroStyle}
              content={heroContent}
            />
          </>
        )}

        {/* CTA */}
        {component.type === 'CTA' && (
          <>
            <Card className="mb-6">
              <CardHeader><CardTitle className="text-base">Nội dung CTA</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Badge (tùy chọn)</Label>
                  <Input value={ctaConfig.badge} onChange={(e) =>{  setCtaConfig({...ctaConfig, badge: e.target.value}); }} placeholder="VD: Ưu đãi có hạn, Hot deal, Mới..." />
                  <p className="text-xs text-slate-500">Hiển thị nhãn nổi bật phía trên tiêu đề (urgency indicator)</p>
                </div>
                <div className="space-y-2">
                  <Label>Tiêu đề CTA</Label>
                  <Input value={ctaConfig.title} onChange={(e) =>{  setCtaConfig({...ctaConfig, title: e.target.value}); }} />
                </div>
                <div className="space-y-2">
                  <Label>Mô tả</Label>
                  <textarea value={ctaConfig.description} onChange={(e) =>{  setCtaConfig({...ctaConfig, description: e.target.value}); }} className="w-full min-h-[80px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Text nút chính</Label><Input value={ctaConfig.buttonText} onChange={(e) =>{  setCtaConfig({...ctaConfig, buttonText: e.target.value}); }} /></div>
                  <div className="space-y-2"><Label>Liên kết</Label><Input value={ctaConfig.buttonLink} onChange={(e) =>{  setCtaConfig({...ctaConfig, buttonLink: e.target.value}); }} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Text nút phụ</Label><Input value={ctaConfig.secondaryButtonText} onChange={(e) =>{  setCtaConfig({...ctaConfig, secondaryButtonText: e.target.value}); }} /></div>
                  <div className="space-y-2"><Label>Liên kết nút phụ</Label><Input value={ctaConfig.secondaryButtonLink} onChange={(e) =>{  setCtaConfig({...ctaConfig, secondaryButtonLink: e.target.value}); }} /></div>
                </div>
              </CardContent>
            </Card>
            <CTAPreview 
              config={ctaConfig} 
              brandColor={brandColor} secondary={secondary}
              selectedStyle={ctaStyle}
              onStyleChange={setCtaStyle}
            />
          </>
        )}

        {/* FAQ */}
        {component.type === 'FAQ' && (
          <FaqEditSection
            faqItems={faqItems}
            setFaqItems={setFaqItems}
            faqStyle={faqStyle}
            setFaqStyle={setFaqStyle}
            brandColor={brandColor} secondary={secondary}
            faqConfig={faqConfig}
            setFaqConfig={setFaqConfig}
          />
        )}

        {/* Footer */}
        {component.type === 'Footer' && (
          <>
            {/* Load from Settings Button */}
            <div className="mb-4 flex justify-end">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  const newSocialLinks: { id: number; platform: string; url: string; icon: string }[] = [];
                  let idCounter = 1;
                  if (socialFacebook?.value) {
                    newSocialLinks.push({ icon: 'facebook', id: idCounter++, platform: 'facebook', url: socialFacebook.value as string });
                  }
                  if (socialInstagram?.value) {
                    newSocialLinks.push({ icon: 'instagram', id: idCounter++, platform: 'instagram', url: socialInstagram.value as string });
                  }
                  if (socialYoutube?.value) {
                    newSocialLinks.push({ icon: 'youtube', id: idCounter++, platform: 'youtube', url: socialYoutube.value as string });
                  }
                  if (socialTiktok?.value) {
                    newSocialLinks.push({ icon: 'tiktok', id: idCounter++, platform: 'tiktok', url: socialTiktok.value as string });
                  }
                  if (socialZalo?.value) {
                    newSocialLinks.push({ icon: 'zalo', id: idCounter++, platform: 'zalo', url: socialZalo.value as string });
                  }
                  setFooterConfig(prev => ({
                    ...prev,
                    logo: (siteLogo?.value as string) || prev.logo,
                    socialLinks: newSocialLinks.length > 0 ? newSocialLinks : prev.socialLinks,
                  }));
                  toast.success('Đã load dữ liệu từ Settings');
                }}
              >
                <Download size={14} className="mr-1" /> Load từ Settings
              </Button>
            </div>

            {/* Logo & Basic Info */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Thông tin cơ bản</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ImageFieldWithUpload
                  label="Logo"
                  value={footerConfig.logo}
                  onChange={(url) =>{  setFooterConfig({...footerConfig, logo: url}); }}
                  folder="footer"
                  aspectRatio="square"
                  quality={0.9}
                  placeholder="https://example.com/logo.png"
                />
                <div className="space-y-2">
                  <Label>Mô tả công ty</Label>
                  <textarea 
                    value={footerConfig.description} 
                    onChange={(e) =>{  setFooterConfig({...footerConfig, description: e.target.value}); }} 
                    placeholder="Công ty TNHH ABC - Đối tác tin cậy của bạn"
                    className="w-full min-h-[60px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Copyright</Label>
                  <Input 
                    value={footerConfig.copyright} 
                    onChange={(e) =>{  setFooterConfig({...footerConfig, copyright: e.target.value}); }} 
                    placeholder="© 2024 Company. All rights reserved." 
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={footerConfig.showSocialLinks} 
                    onChange={(e) =>{  setFooterConfig({...footerConfig, showSocialLinks: e.target.checked}); }} 
                    className="w-4 h-4 rounded" 
                  />
                  <Label>Hiển thị social links</Label>
                </div>
              </CardContent>
            </Card>

            {/* Menu Columns */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Cột menu ({footerConfig.columns.length})</CardTitle>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      const newId = Math.max(0, ...footerConfig.columns.map(c => c.id), 0) + 1;
                      setFooterConfig({
                        ...footerConfig,
                        columns: [...footerConfig.columns, { id: newId, links: [{ label: 'Link mới', url: '#' }], title: `Cột ${newId}` }]
                      });
                    }}
                    disabled={footerConfig.columns.length >= 4}
                  >
                    <Plus size={14} className="mr-1" /> Thêm cột
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {footerConfig.columns.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-sm">
                    Chưa có cột menu nào. Nhấn “Thêm cột” để bắt đầu.
                  </div>
                ) : (
                  footerConfig.columns.map((column) => (
                    <div key={column.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <Input
                          value={column.title}
                          onChange={(e) =>{  setFooterConfig({
                            ...footerConfig,
                            columns: footerConfig.columns.map(c => c.id === column.id ? { ...c, title: e.target.value } : c)
                          }); }}
                          placeholder="Tiêu đề cột"
                          className="flex-1"
                        />
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() =>{  setFooterConfig({
                            ...footerConfig,
                            columns: footerConfig.columns.filter(c => c.id !== column.id)
                          }); }}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                      
                      {/* Links */}
                      <div className="pl-4 space-y-2">
                        <Label className="text-xs text-slate-500">Links ({column.links.length})</Label>
                        {column.links.map((link, linkIdx) => (
                          <div key={linkIdx} className="flex items-center gap-2">
                            <Input
                              value={link.label}
                              onChange={(e) =>{  setFooterConfig({
                                ...footerConfig,
                                columns: footerConfig.columns.map(c => 
                                  c.id === column.id ? { 
                                    ...c, 
                                    links: c.links.map((l, idx) => idx === linkIdx ? { ...l, label: e.target.value } : l)
                                  } : c
                                )
                              }); }}
                              placeholder="Tên link"
                              className="flex-1"
                            />
                            <Input
                              value={link.url}
                              onChange={(e) =>{  setFooterConfig({
                                ...footerConfig,
                                columns: footerConfig.columns.map(c => 
                                  c.id === column.id ? { 
                                    ...c, 
                                    links: c.links.map((l, idx) => idx === linkIdx ? { ...l, url: e.target.value } : l)
                                  } : c
                                )
                              }); }}
                              placeholder="/url"
                              className="flex-1"
                            />
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              onClick={() =>{  setFooterConfig({
                                ...footerConfig,
                                columns: footerConfig.columns.map(c => 
                                  c.id === column.id ? { ...c, links: c.links.filter((_, idx) => idx !== linkIdx) } : c
                                )
                              }); }}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
                              disabled={column.links.length <= 1}
                            >
                              <Trash2 size={12} />
                            </Button>
                          </div>
                        ))}
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() =>{  setFooterConfig({
                            ...footerConfig,
                            columns: footerConfig.columns.map(c => 
                              c.id === column.id ? { ...c, links: [...c.links, { label: 'Link mới', url: '#' }] } : c
                            )
                          }); }}
                          className="text-slate-500 hover:text-slate-700"
                        >
                          <Plus size={12} className="mr-1" /> Thêm link
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Social Links */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Mạng xã hội ({footerConfig.socialLinks.length})</CardTitle>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      const platforms = ['facebook', 'instagram', 'youtube', 'tiktok', 'zalo'];
                      const usedPlatforms = new Set(footerConfig.socialLinks.map(s => s.platform));
                      const availablePlatform = platforms.find(p => !usedPlatforms.has(p));
                      if (!availablePlatform) {return;}
                      const newId = Math.max(0, ...footerConfig.socialLinks.map(s => s.id), 0) + 1;
                      setFooterConfig({
                        ...footerConfig,
                        socialLinks: [...footerConfig.socialLinks, { icon: availablePlatform, id: newId, platform: availablePlatform, url: '' }]
                      });
                    }}
                    disabled={footerConfig.socialLinks.length >= 5}
                  >
                    <Plus size={14} className="mr-1" /> Thêm MXH
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {footerConfig.socialLinks.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-sm">
                    Chưa có mạng xã hội nào. Nhấn “Thêm MXH” để bắt đầu.
                  </div>
                ) : (
                  footerConfig.socialLinks.map((social) => (
                    <div key={social.id} className="flex items-center gap-3">
                      <select
                        value={social.platform}
                        onChange={(e) =>{  setFooterConfig({
                          ...footerConfig,
                          socialLinks: footerConfig.socialLinks.map(s => 
                            s.id === social.id ? { ...s, platform: e.target.value, icon: e.target.value } : s
                          )
                        }); }}
                        className="w-36 h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
                      >
                        {[
                          { key: 'facebook', label: 'Facebook' },
                          { key: 'instagram', label: 'Instagram' },
                          { key: 'youtube', label: 'Youtube' },
                          { key: 'tiktok', label: 'TikTok' },
                          { key: 'zalo', label: 'Zalo' },
                        ].map(p => (
                          <option 
                            key={p.key} 
                            value={p.key}
                            disabled={footerConfig.socialLinks.some(s => s.platform === p.key && s.id !== social.id)}
                          >
                            {p.label}
                          </option>
                        ))}
                      </select>
                      <Input
                        value={social.url}
                        onChange={(e) =>{  setFooterConfig({
                          ...footerConfig,
                          socialLinks: footerConfig.socialLinks.map(s => 
                            s.id === social.id ? { ...s, url: e.target.value } : s
                          )
                        }); }}
                        placeholder="https://facebook.com/yourpage"
                        className="flex-1"
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() =>{  setFooterConfig({
                          ...footerConfig,
                          socialLinks: footerConfig.socialLinks.filter(s => s.id !== social.id)
                        }); }}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <FooterPreview 
              config={footerConfig} 
              brandColor={brandColor} secondary={secondary}
              selectedStyle={footerStyle}
              onStyleChange={setFooterStyle}
            />
          </>
        )}

        {/* Services */}
        {component.type === 'Services' && (
          <>
            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Dịch vụ ({servicesItems.length})</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={() =>{  setServicesItems([...servicesItems, { description: '', icon: 'Star', id: Date.now(), title: '' }]); }} className="gap-2"><Plus size={14} /> Thêm</Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {servicesItems.map((item, idx) => {
                  const icons: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = { Briefcase, Check, Package, Star, Users, Zap };
                  const IconComponent = icons[item.icon] || Star;
                  return (
                    <div 
                      key={item.id} 
                      draggable
                      onDragStart={() =>{  setDraggedServiceId(item.id); }}
                      onDragEnd={() => { setDraggedServiceId(null); setDragOverServiceId(null); }}
                      onDragOver={(e) => { e.preventDefault(); if (draggedServiceId !== item.id) {setDragOverServiceId(item.id);} }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (!draggedServiceId || draggedServiceId === item.id) {return;}
                        const newItems = [...servicesItems];
                        const draggedIdx = newItems.findIndex(i => i.id === draggedServiceId);
                        const targetIdx = newItems.findIndex(i => i.id === item.id);
                        const [moved] = newItems.splice(draggedIdx, 1);
                        newItems.splice(targetIdx, 0, moved);
                        setServicesItems(newItems);
                        setDraggedServiceId(null);
                        setDragOverServiceId(null);
                      }}
                      className={cn(
                        "p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-3 border-2 transition-all cursor-grab active:cursor-grabbing",
                        draggedServiceId === item.id && "opacity-50",
                        dragOverServiceId === item.id && "border-blue-500",
                        !draggedServiceId && "border-transparent"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <GripVertical size={16} className="text-slate-400 flex-shrink-0" />
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${brandColor}15` }}>
                            <IconComponent size={16} style={{ color: brandColor }} />
                          </div>
                          <Label className="font-medium">Dịch vụ {idx + 1}</Label>
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="text-red-500 h-8 w-8 flex-shrink-0" onClick={() => servicesItems.length > 1 && setServicesItems(servicesItems.filter(s => s.id !== item.id))}><Trash2 size={14} /></Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <select 
                          value={item.icon} 
                          onChange={(e) =>{  setServicesItems(servicesItems.map(s => s.id === item.id ? {...s, icon: e.target.value} : s)); }}
                          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                        >
                          {['Briefcase', 'Star', 'Users', 'Package', 'Zap', 'Check', 'Shield', 'Target', 'Globe', 'Rocket', 'Settings', 'Layers', 'Cpu', 'Clock', 'MapPin', 'Mail', 'Building2', 'Phone'].map(icon => (
                            <option key={icon} value={icon}>{icon}</option>
                          ))}
                        </select>
                        <Input placeholder="Tiêu đề" value={item.title} onChange={(e) =>{  setServicesItems(servicesItems.map(s => s.id === item.id ? {...s, title: e.target.value} : s)); }} className="md:col-span-1" />
                        <Input placeholder="Mô tả ngắn" value={item.description} onChange={(e) =>{  setServicesItems(servicesItems.map(s => s.id === item.id ? {...s, description: e.target.value} : s)); }} className="md:col-span-2" />
                      </div>
                    </div>
                  );
                })}
                {servicesItems.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <Briefcase size={32} className="mx-auto mb-2 opacity-50" />
                    <p>Chưa có dịch vụ nào. Nhấn “Thêm” để bắt đầu.</p>
                  </div>
                )}
              </CardContent>
            </Card>
            <ServicesPreview
              items={servicesItems.map((item) => ({
                icon: item.icon,
                title: item.title,
                description: item.description,
              }))}
              brandColor={brandColor}
              secondary={secondary}
              mode={mode}
              selectedStyle={servicesStyle}
              onStyleChange={setServicesStyle}
              title={component.title}
            />
          </>
        )}

        {/* Benefits */}
        {component.type === 'Benefits' && (
          <>
            {/* Config Card */}
            <Card className="mb-6">
              <CardHeader><CardTitle className="text-base">Cấu hình hiển thị</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Badge text</Label>
                    <Input placeholder="Vì sao chọn chúng tôi?" value={benefitsConfig.subHeading ?? ''} onChange={(e) =>{  setBenefitsConfig({ ...benefitsConfig, subHeading: e.target.value }); }} />
                  </div>
                  <div>
                    <Label>Tiêu đề chính</Label>
                    <Input placeholder="Giá trị cốt lõi" value={benefitsConfig.heading ?? ''} onChange={(e) =>{  setBenefitsConfig({ ...benefitsConfig, heading: e.target.value }); }} />
                  </div>
                </div>
                {benefitsStyle === 'timeline' && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <Label>Nút CTA (tùy chọn)</Label>
                      <Input placeholder="Tìm hiểu thêm" value={benefitsConfig.buttonText ?? ''} onChange={(e) =>{  setBenefitsConfig({ ...benefitsConfig, buttonText: e.target.value }); }} />
                    </div>
                    <div>
                      <Label>Link nút CTA</Label>
                      <Input placeholder="/lien-he" value={benefitsConfig.buttonLink ?? ''} onChange={(e) =>{  setBenefitsConfig({ ...benefitsConfig, buttonLink: e.target.value }); }} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            {/* Benefits Items Card */}
            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Lợi ích ({benefitsItems.length}/8)</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={() => benefitsItems.length < 8 && setBenefitsItems([...benefitsItems, { description: '', icon: 'Star', id: Date.now(), title: '' }])} disabled={benefitsItems.length >= 8} className="gap-2"><Plus size={14} /> Thêm</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {benefitsItems.map((item, idx) => (
                  <div key={item.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Lợi ích {idx + 1}</Label>
                      <Button type="button" variant="ghost" size="icon" className="text-red-500 h-8 w-8" onClick={() => benefitsItems.length > 1 && setBenefitsItems(benefitsItems.filter(s => s.id !== item.id))} disabled={benefitsItems.length <= 1}><Trash2 size={14} /></Button>
                    </div>
                    <Input placeholder="Tiêu đề" value={item.title} onChange={(e) =>{  setBenefitsItems(benefitsItems.map(s => s.id === item.id ? {...s, title: e.target.value} : s)); }} />
                    <Input placeholder="Mô tả ngắn (max 150 ký tự)" maxLength={150} value={item.description} onChange={(e) =>{  setBenefitsItems(benefitsItems.map(s => s.id === item.id ? {...s, description: e.target.value} : s)); }} />
                    <p className="text-xs text-slate-400 text-right">{item.description.length}/150</p>
                  </div>
                ))}
              </CardContent>
            </Card>
            <BenefitsPreview 
              items={benefitsItems} 
              brandColor={brandColor} secondary={secondary}
              selectedStyle={benefitsStyle}
              onStyleChange={setBenefitsStyle}
              config={benefitsConfig}
            />
          </>
        )}

        {/* Testimonials */}
        {component.type === 'Testimonials' && (
          <>
            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Đánh giá khách hàng</CardTitle>
                  <p className="text-xs text-slate-500 mt-1">Kéo thả để sắp xếp thứ tự hiển thị</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() =>{  setTestimonialsItems([...testimonialsItems, { avatar: '', content: '', id: Date.now(), name: '', rating: 5, role: '' }]); }} className="gap-2"><Plus size={14} /> Thêm</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {testimonialsItems.map((item, idx) => (
                  <div 
                    key={item.id} 
                    draggable
                    onDragStart={() =>{  setDraggedTestimonialId(item.id); }}
                    onDragEnd={() => { setDraggedTestimonialId(null); setDragOverTestimonialId(null); }}
                    onDragOver={(e) => { e.preventDefault(); if (draggedTestimonialId !== item.id) {setDragOverTestimonialId(item.id);} }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (!draggedTestimonialId || draggedTestimonialId === item.id) {return;}
                      const newItems = [...testimonialsItems];
                      const draggedIndex = newItems.findIndex(i => i.id === draggedTestimonialId);
                      const targetIndex = newItems.findIndex(i => i.id === item.id);
                      const [moved] = newItems.splice(draggedIndex, 1);
                      newItems.splice(targetIndex, 0, moved);
                      setTestimonialsItems(newItems);
                      setDraggedTestimonialId(null);
                      setDragOverTestimonialId(null);
                    }}
                    className={cn(
                      "p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-3 transition-all",
                      draggedTestimonialId === item.id && "opacity-50 scale-[0.98]",
                      dragOverTestimonialId === item.id && "ring-2 ring-blue-500 ring-offset-2"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical size={16} className="text-slate-400 cursor-grab active:cursor-grabbing" />
                        <Label>Đánh giá {idx + 1}</Label>
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="text-red-500 h-8 w-8" onClick={() => testimonialsItems.length > 1 && setTestimonialsItems(testimonialsItems.filter(t => t.id !== item.id))}><Trash2 size={14} /></Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Input placeholder="Tên khách hàng" value={item.name} onChange={(e) =>{  setTestimonialsItems(testimonialsItems.map(t => t.id === item.id ? {...t, name: e.target.value} : t)); }} />
                        <p className="text-[10px] text-slate-400 mt-1">VD: Nguyễn Văn A</p>
                      </div>
                      <div>
                        <Input placeholder="Chức vụ / Công ty" value={item.role} onChange={(e) =>{  setTestimonialsItems(testimonialsItems.map(t => t.id === item.id ? {...t, role: e.target.value} : t)); }} />
                        <p className="text-[10px] text-slate-400 mt-1">VD: CEO, ABC Corp</p>
                      </div>
                    </div>
                    <div>
                      <textarea 
                        placeholder="Nội dung đánh giá chi tiết từ khách hàng..." 
                        value={item.content} 
                        onChange={(e) =>{  setTestimonialsItems(testimonialsItems.map(t => t.id === item.id ? {...t, content: e.target.value} : t)); }}
                        className="w-full min-h-[80px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm resize-y" 
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Nội dung chi tiết giúp tăng độ tin cậy (2-4 dòng)</p>
                    </div>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">Đánh giá:</Label>
                        {[1,2,3,4,5].map(star => (
                          <Star 
                            key={star} 
                            size={22} 
                            className={cn("cursor-pointer transition-colors", star <= item.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-300 hover:text-yellow-200")}
                            onClick={() =>{  setTestimonialsItems(testimonialsItems.map(t => t.id === item.id ? {...t, rating: star} : t)); }} 
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <UserIcon size={12} />
                        <span>Avatar: hiển thị chữ cái đầu tên</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {testimonialsItems.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                    <Star size={32} className="text-slate-300 mb-2" />
                    <p className="text-sm text-slate-500 mb-3">Chưa có đánh giá nào</p>
                    <Button type="button" variant="outline" size="sm" onClick={() =>{  setTestimonialsItems([...testimonialsItems, { avatar: '', content: '', id: Date.now(), name: '', rating: 5, role: '' }]); }} className="gap-2">
                      <Plus size={14} /> Thêm đánh giá đầu tiên
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            <TestimonialsPreview
              items={testimonialsItems}
              brandColor={brandColor} secondary={secondary}
              selectedStyle={testimonialsStyle}
              onStyleChange={setTestimonialsStyle}
            />
          </>
        )}

        {/* Pricing */}
        {component.type === 'Pricing' && (
          <>
            {/* Cấu hình chung */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Cấu hình bảng giá</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Mô tả ngắn (subtitle)</Label>
                  <Input 
                    placeholder="Chọn gói phù hợp với nhu cầu của bạn"
                    value={pricingConfig.subtitle ?? ''} 
                    onChange={(e) =>{  setPricingConfig({ ...pricingConfig, subtitle: e.target.value }); }} 
                  />
                </div>
                <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={pricingConfig.showBillingToggle} 
                      onChange={(e) =>{  setPricingConfig({ ...pricingConfig, showBillingToggle: e.target.checked }); }} 
                      className="w-4 h-4 rounded" 
                    />
                    <span>Hiển thị toggle Tháng/Năm</span>
                  </label>
                </div>
                {pricingConfig.showBillingToggle && (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Label tháng</Label>
                      <Input 
                        placeholder="Hàng tháng"
                        value={pricingConfig.monthlyLabel ?? ''} 
                        onChange={(e) =>{  setPricingConfig({ ...pricingConfig, monthlyLabel: e.target.value }); }} 
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Label năm</Label>
                      <Input 
                        placeholder="Hàng năm"
                        value={pricingConfig.yearlyLabel ?? ''} 
                        onChange={(e) =>{  setPricingConfig({ ...pricingConfig, yearlyLabel: e.target.value }); }} 
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Badge tiết kiệm</Label>
                      <Input 
                        placeholder="Tiết kiệm 17%"
                        value={pricingConfig.yearlySavingText ?? ''} 
                        onChange={(e) =>{  setPricingConfig({ ...pricingConfig, yearlySavingText: e.target.value }); }} 
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Danh sách gói */}
            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Các gói dịch vụ ({pricingPlans.length})</CardTitle>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() =>{  setPricingPlans([...pricingPlans, { buttonLink: '', buttonText: 'Chọn gói', features: [], id: Date.now(), isPopular: false, name: '', period: '/tháng', price: '', yearlyPrice: '' }]); }} 
                  className="gap-2"
                >
                  <Plus size={14} /> Thêm gói
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {pricingPlans.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-slate-100 dark:bg-slate-800">
                      <Tag size={32} className="text-slate-400" />
                    </div>
                    <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1">Chưa có gói nào</h3>
                    <p className="text-sm text-slate-500 mb-4">Thêm gói đầu tiên để bắt đầu</p>
                    <Button type="button" variant="outline" size="sm" onClick={() =>{  setPricingPlans([{ buttonLink: '', buttonText: 'Chọn gói', features: [], id: Date.now(), isPopular: false, name: '', period: '/tháng', price: '', yearlyPrice: '' }]); }} className="gap-2">
                      <Plus size={14} /> Thêm gói
                    </Button>
                  </div>
                ) : pricingPlans.map((plan, idx) => (
                  <div 
                    key={plan.id} 
                    draggable
                    onDragStart={() =>{  setDraggedPricingId(plan.id); }}
                    onDragEnd={() => { setDraggedPricingId(null); setDragOverPricingId(null); }}
                    onDragOver={(e) => { e.preventDefault(); if (draggedPricingId !== plan.id) {setDragOverPricingId(plan.id);} }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (!draggedPricingId || draggedPricingId === plan.id) {return;}
                      const newPlans = [...pricingPlans];
                      const draggedIdx = newPlans.findIndex(p => p.id === draggedPricingId);
                      const dropIdx = newPlans.findIndex(p => p.id === plan.id);
                      const [moved] = newPlans.splice(draggedIdx, 1);
                      newPlans.splice(dropIdx, 0, moved);
                      setPricingPlans(newPlans);
                      setDraggedPricingId(null);
                      setDragOverPricingId(null);
                    }}
                    className={cn(
                      "p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-3 transition-all",
                      draggedPricingId === plan.id && "opacity-50 scale-95",
                      dragOverPricingId === plan.id && "ring-2 ring-blue-500"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical size={16} className="text-slate-400 cursor-grab" />
                        <Label>Gói {idx + 1}</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={plan.isPopular} 
                            onChange={(e) =>{  setPricingPlans(pricingPlans.map(p => p.id === plan.id ? {...p, isPopular: e.target.checked} : p)); }} 
                            className="w-4 h-4 rounded" 
                          />
                          Nổi bật
                        </label>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-500 h-8 w-8" 
                          onClick={() => pricingPlans.length > 1 && setPricingPlans(pricingPlans.filter(p => p.id !== plan.id))}
                          disabled={pricingPlans.length <= 1}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input 
                        placeholder="Tên gói" 
                        value={plan.name} 
                        onChange={(e) =>{  setPricingPlans(pricingPlans.map(p => p.id === plan.id ? {...p, name: e.target.value} : p)); }} 
                      />
                      <Input 
                        placeholder="Giá tháng (VD: 299.000)" 
                        value={plan.price} 
                        onChange={(e) =>{  setPricingPlans(pricingPlans.map(p => p.id === plan.id ? {...p, price: e.target.value} : p)); }} 
                      />
                    </div>
                    {pricingConfig.showBillingToggle && (
                      <Input 
                        placeholder="Giá năm (VD: 2.990.000)" 
                        value={plan.yearlyPrice} 
                        onChange={(e) =>{  setPricingPlans(pricingPlans.map(p => p.id === plan.id ? {...p, yearlyPrice: e.target.value} : p)); }} 
                      />
                    )}
                    <Input 
                      placeholder="Tính năng (phân cách bởi dấu phẩy)" 
                      value={(plan.features || []).join(', ')} 
                      onChange={(e) =>{  setPricingPlans(pricingPlans.map(p => p.id === plan.id ? {...p, features: e.target.value.split(',').map(s => s.trim()).filter(Boolean)} : p)); }} 
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input 
                        placeholder="Text nút bấm" 
                        value={plan.buttonText} 
                        onChange={(e) =>{  setPricingPlans(pricingPlans.map(p => p.id === plan.id ? {...p, buttonText: e.target.value} : p)); }} 
                      />
                      <Input 
                        placeholder="Liên kết" 
                        value={plan.buttonLink} 
                        onChange={(e) =>{  setPricingPlans(pricingPlans.map(p => p.id === plan.id ? {...p, buttonLink: e.target.value} : p)); }} 
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <PricingPreview 
              plans={pricingPlans} 
              brandColor={brandColor} secondary={secondary}
              selectedStyle={pricingStyle}
              onStyleChange={setPricingStyle}
              config={pricingConfig}
            />
          </>
        )}

        {/* Contact */}
        {component.type === 'Contact' && (
          <>
            <Card className="mb-6">
              <CardHeader><CardTitle className="text-base">Thông tin liên hệ</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Địa chỉ</Label><Input value={contactConfig.address} onChange={(e) =>{  setContactConfig({...contactConfig, address: e.target.value}); }} /></div>
                  <div className="space-y-2"><Label>Số điện thoại</Label><Input value={contactConfig.phone} onChange={(e) =>{  setContactConfig({...contactConfig, phone: e.target.value}); }} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Email</Label><Input value={contactConfig.email} onChange={(e) =>{  setContactConfig({...contactConfig, email: e.target.value}); }} /></div>
                  <div className="space-y-2"><Label>Giờ làm việc</Label><Input value={contactConfig.workingHours} onChange={(e) =>{  setContactConfig({...contactConfig, workingHours: e.target.value}); }} /></div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={contactConfig.showMap} onChange={(e) =>{  setContactConfig({...contactConfig, showMap: e.target.checked}); }} className="w-4 h-4 rounded" />
                  <Label>Hiển thị bản đồ</Label>
                </div>
                {contactConfig.showMap && (
                  <div className="space-y-2">
                    <Label>Google Maps Embed URL</Label>
                    <Input value={contactConfig.mapEmbed} onChange={(e) =>{  setContactConfig({...contactConfig, mapEmbed: e.target.value}); }} placeholder="https://www.google.com/maps/embed?pb=..." />
                    <p className="text-xs text-muted-foreground">Lấy từ Google Maps: Chia sẻ → Nhúng bản đồ → Copy URL trong src của iframe</p>
                  </div>
                )}
              </CardContent>
            </Card>
            <ContactPreview 
              config={{ ...contactConfig, formFields: [], socialLinks: [] }} 
              brandColor={brandColor} secondary={secondary}
              selectedStyle={contactStyle}
              onStyleChange={setContactStyle}
            />
          </>
        )}

        {/* About */}
        {component.type === 'About' && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Cấu hình Về chúng tôi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tiêu đề nhỏ (Sub-heading)</Label>
                    <Input 
                      value={aboutConfig.subHeading} 
                      onChange={(e) =>{  setAboutConfig({...aboutConfig, subHeading: e.target.value}); }} 
                      placeholder="Về chúng tôi" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tiêu đề chính (Heading)</Label>
                    <Input 
                      value={aboutConfig.heading} 
                      onChange={(e) =>{  setAboutConfig({...aboutConfig, heading: e.target.value}); }} 
                      placeholder="Mang đến giá trị thực" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Mô tả</Label>
                  <textarea 
                    value={aboutConfig.description} 
                    onChange={(e) =>{  setAboutConfig({...aboutConfig, description: e.target.value}); }} 
                    placeholder="Mô tả về công ty..."
                    className="w-full min-h-[100px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" 
                  />
                </div>
                <ImageFieldWithUpload
                  label="Hình ảnh"
                  value={aboutConfig.image}
                  onChange={(url) =>{  setAboutConfig({...aboutConfig, image: url}); }}
                  folder="home-components"
                  aspectRatio="video"
                  quality={0.85}
                  placeholder="https://example.com/about-image.jpg"
                />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Text nút bấm</Label>
                    <Input 
                      value={aboutConfig.buttonText} 
                      onChange={(e) =>{  setAboutConfig({...aboutConfig, buttonText: e.target.value}); }} 
                      placeholder="Xem thêm" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Liên kết</Label>
                    <Input 
                      value={aboutConfig.buttonLink} 
                      onChange={(e) =>{  setAboutConfig({...aboutConfig, buttonLink: e.target.value}); }} 
                      placeholder="/about" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Số liệu nổi bật</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() =>{  setAboutConfig({...aboutConfig, stats: [...aboutConfig.stats, { id: Date.now(), label: '', value: '' }]}); }} 
                      className="gap-2"
                    >
                      <Plus size={14} /> Thêm
                    </Button>
                  </div>
                  {aboutConfig.stats.map((stat) => (
                    <div key={stat.id} className="flex gap-3 items-center">
                      <Input 
                        placeholder="Số liệu" 
                        value={stat.value} 
                        onChange={(e) =>{  setAboutConfig({...aboutConfig, stats: aboutConfig.stats.map(s => s.id === stat.id ? {...s, value: e.target.value} : s)}); }} 
                        className="flex-1" 
                      />
                      <Input 
                        placeholder="Nhãn" 
                        value={stat.label} 
                        onChange={(e) =>{  setAboutConfig({...aboutConfig, stats: aboutConfig.stats.map(s => s.id === stat.id ? {...s, label: e.target.value} : s)}); }} 
                        className="flex-1" 
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500 h-8 w-8" 
                        onClick={() => aboutConfig.stats.length > 1 && setAboutConfig({...aboutConfig, stats: aboutConfig.stats.filter(s => s.id !== stat.id)})}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <AboutPreview 
              config={aboutConfig} 
              brandColor={brandColor} secondary={secondary}
              selectedStyle={aboutConfig.style}
              onStyleChange={(style) =>{  setAboutConfig({...aboutConfig, style}); }}
            />
          </>
        )}

        {/* Career */}
        {component.type === 'Career' && (
          <>
            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Vị trí tuyển dụng</CardTitle>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() =>{  setCareerJobs([...careerJobs, { department: '', description: '', id: Date.now(), location: '', salary: '', title: '', type: 'Full-time' }]); }} 
                  className="gap-2"
                >
                  <Plus size={14} /> Thêm vị trí
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {careerJobs.map((job, idx) => (
                  <div key={job.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Vị trí {idx + 1}</Label>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500 h-8 w-8" 
                        onClick={() => careerJobs.length > 1 && setCareerJobs(careerJobs.filter(j => j.id !== job.id))}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input 
                        placeholder="Vị trí tuyển dụng" 
                        value={job.title} 
                        onChange={(e) =>{  setCareerJobs(careerJobs.map(j => j.id === job.id ? {...j, title: e.target.value} : j)); }} 
                      />
                      <Input 
                        placeholder="Phòng ban" 
                        value={job.department} 
                        onChange={(e) =>{  setCareerJobs(careerJobs.map(j => j.id === job.id ? {...j, department: e.target.value} : j)); }} 
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <Input 
                        placeholder="Địa điểm" 
                        value={job.location} 
                        onChange={(e) =>{  setCareerJobs(careerJobs.map(j => j.id === job.id ? {...j, location: e.target.value} : j)); }} 
                      />
                      <select 
                        className="h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" 
                        value={job.type} 
                        onChange={(e) =>{  setCareerJobs(careerJobs.map(j => j.id === job.id ? {...j, type: e.target.value} : j)); }}
                      >
                        <option>Full-time</option>
                        <option>Part-time</option>
                        <option>Contract</option>
                        <option>Internship</option>
                      </select>
                      <Input 
                        placeholder="Mức lương" 
                        value={job.salary} 
                        onChange={(e) =>{  setCareerJobs(careerJobs.map(j => j.id === job.id ? {...j, salary: e.target.value} : j)); }} 
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <CareerPreview 
              jobs={careerJobs} 
              brandColor={brandColor} secondary={secondary}
              selectedStyle={careerStyle}
              onStyleChange={setCareerStyle}
            />
          </>
        )}

        {/* SpeedDial */}
        {component.type === 'SpeedDial' && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Cấu hình chung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Vị trí hiển thị</Label>
                  <select
                    value={speedDialPosition}
                    onChange={(e) =>{  setSpeedDialPosition(e.target.value as 'bottom-right' | 'bottom-left'); }}
                    className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
                  >
                    <option value="bottom-right">Góc phải</option>
                    <option value="bottom-left">Góc trái</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Danh sách hành động ({speedDialActions.length})</CardTitle>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    const newId = Math.max(0, ...speedDialActions.map(a => a.id)) + 1;
                    setSpeedDialActions([...speedDialActions, { bgColor: brandColor, icon: 'phone', id: newId, label: '', url: '' }]);
                  }}
                  disabled={speedDialActions.length >= 6}
                  className="gap-2"
                >
                  <Plus size={14} /> Thêm
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {speedDialActions.map((action, idx) => (
                  <div key={action.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Hành động {idx + 1}</Label>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500 h-8 w-8" 
                        onClick={() => speedDialActions.length > 1 && setSpeedDialActions(speedDialActions.filter(a => a.id !== action.id))}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs text-slate-500">Icon</Label>
                        <select
                          value={action.icon}
                          onChange={(e) =>{  setSpeedDialActions(speedDialActions.map(a => a.id === action.id ? {...a, icon: e.target.value} : a)); }}
                          className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
                        >
                          <option value="phone">Điện thoại</option>
                          <option value="mail">Email</option>
                          <option value="message-circle">Chat</option>
                          <option value="map-pin">Địa chỉ</option>
                          <option value="facebook">Facebook</option>
                          <option value="instagram">Instagram</option>
                          <option value="youtube">Youtube</option>
                          <option value="zalo">Zalo</option>
                          <option value="calendar">Đặt lịch</option>
                          <option value="shopping-cart">Giỏ hàng</option>
                          <option value="headphones">Hỗ trợ</option>
                          <option value="help-circle">FAQ</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-slate-500">Màu nền</Label>
                        <div className="flex gap-2">
                          <Input 
                            type="color" 
                            value={action.bgColor} 
                            onChange={(e) =>{  setSpeedDialActions(speedDialActions.map(a => a.id === action.id ? {...a, bgColor: e.target.value} : a)); }}
                            className="w-12 h-9 p-1 cursor-pointer"
                          />
                          <Input 
                            value={action.bgColor} 
                            onChange={(e) =>{  setSpeedDialActions(speedDialActions.map(a => a.id === action.id ? {...a, bgColor: e.target.value} : a)); }}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs text-slate-500">Nhãn</Label>
                        <Input 
                          value={action.label} 
                          onChange={(e) =>{  setSpeedDialActions(speedDialActions.map(a => a.id === action.id ? {...a, label: e.target.value} : a)); }}
                          placeholder="VD: Gọi ngay"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-slate-500">URL / Liên kết</Label>
                        <Input 
                          value={action.url} 
                          onChange={(e) =>{  setSpeedDialActions(speedDialActions.map(a => a.id === action.id ? {...a, url: e.target.value} : a)); }}
                          placeholder="tel:0123456789"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <p className="text-xs text-slate-500">
                  Gợi ý URL: tel:0123456789 (gọi điện), mailto:email@example.com (email), https://zalo.me/... (Zalo)
                </p>
              </CardContent>
            </Card>

            <SpeedDialPreview 
              config={{
                actions: speedDialActions,
                alwaysOpen: speedDialAlwaysOpen,
                mainButtonColor: brandColor,
                position: speedDialPosition,
                style: speedDialStyle,
              }}
              brandColor={brandColor} secondary={secondary}
              selectedStyle={speedDialStyle}
              onStyleChange={setSpeedDialStyle}
            />
          </>
        )}

        {/* Team - Đội ngũ */}
        {component.type === 'Team' && (
          <>
            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <CardTitle className="text-sm font-medium">Thành viên ({teamMembers.length})</CardTitle>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    const newId = Math.max(0, ...teamMembers.map(m => m.id)) + 1;
                    setTeamMembers([...teamMembers, { avatar: '', bio: '', email: '', facebook: '', id: newId, linkedin: '', name: '', role: '', twitter: '' }]);
                  }}
                  className="h-7 text-xs gap-1"
                >
                  <Plus size={12} /> Thêm
                </Button>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {teamMembers.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">
                    Chưa có thành viên nào. Nhấn &quot;Thêm&quot; để bắt đầu.
                  </p>
                ) : (
                  teamMembers.map((member) => (
                    <div key={member.id} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                      <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900">
                        {/* Compact Avatar */}
                        <ImageFieldWithUpload
                          value={member.avatar}
                          onChange={(url) =>{  setTeamMembers(teamMembers.map(m => m.id === member.id ? {...m, avatar: url} : m)); }}
                          folder="team-avatars"
                          aspectRatio="square"
                          quality={0.85}
                          className="w-16 flex-shrink-0 [&>div:first-child]:hidden [&>div:last-child]:w-16 [&>div:last-child]:h-16 [&>div:last-child]:rounded-xl"
                        />
                        
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex gap-2">
                            <Input 
                              placeholder="Họ và tên" 
                              value={member.name} 
                              onChange={(e) =>{  setTeamMembers(teamMembers.map(m => m.id === member.id ? {...m, name: e.target.value} : m)); }} 
                              className="h-8 text-sm font-medium"
                            />
                            <Input 
                              placeholder="Chức vụ" 
                              value={member.role} 
                              onChange={(e) =>{  setTeamMembers(teamMembers.map(m => m.id === member.id ? {...m, role: e.target.value} : m)); }} 
                              className="h-8 text-sm text-slate-500 w-32"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            {/* Social Icons inline */}
                            {['facebook', 'linkedin', 'twitter', 'email'].map((social) => {
                              const icons: Record<string, React.ReactNode> = {
                                email: <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
                                facebook: <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
                                linkedin: <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
                                twitter: <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                              };
                              const val = member[social as keyof typeof member];
                              return (
                                <div key={social} className="relative group">
                                  <button
                                    type="button"
                                    className={cn(
                                      "w-7 h-7 rounded-md flex items-center justify-center transition-all",
                                      val ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50" : "bg-slate-100 text-slate-400 dark:bg-slate-700 hover:bg-slate-200"
                                    )}
                                    title={social}
                                  >
                                    {icons[social]}
                                  </button>
                                  <div className="absolute top-full left-0 mt-1 z-20 hidden group-hover:block group-focus-within:block">
                                    <Input
                                      value={val as string}
                                      onChange={(e) =>{  setTeamMembers(teamMembers.map(m => m.id === member.id ? {...m, [social]: e.target.value} : m)); }}
                                      placeholder={social === 'email' ? 'email@...' : `${social}.com/...`}
                                      className="text-xs h-8 w-48 bg-white dark:bg-slate-800 shadow-lg border"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                            <div className="flex-1" />
                            <button
                              type="button"
                              onClick={() =>{  setExpandedTeamId(expandedTeamId === member.id ? null : member.id); }}
                              className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
                            >
                              Bio {expandedTeamId === member.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                          </div>
                        </div>

                        <Button type="button" variant="ghost" size="icon" className="text-slate-400 hover:text-red-500 h-8 w-8 flex-shrink-0" onClick={() =>{  setTeamMembers(teamMembers.filter(m => m.id !== member.id)); }}>
                          <Trash2 size={14} />
                        </Button>
                      </div>

                      {expandedTeamId === member.id && (
                        <div className="px-3 pb-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                          <textarea 
                            placeholder="Giới thiệu ngắn về thành viên..." 
                            value={member.bio} 
                            onChange={(e) =>{  setTeamMembers(teamMembers.map(m => m.id === member.id ? {...m, bio: e.target.value} : m)); }}
                            className="w-full min-h-[60px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm mt-2" 
                          />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <TeamPreview 
              members={teamMembers} 
              brandColor={brandColor} secondary={secondary}
              selectedStyle={teamStyle}
              onStyleChange={setTeamStyle}
            />
          </>
        )}

        {/* Features - Tính năng */}
        {component.type === 'Features' && (
          <FeaturesEditSection
            featuresItems={featuresItems}
            setFeaturesItems={setFeaturesItems}
            brandColor={brandColor}
            secondary={secondary}
            brandMode={brandMode}
            featuresStyle={featuresStyle}
            setFeaturesStyle={setFeaturesStyle}
          />
        )}

        {/* Process */}
        {component.type === 'Process' && (
          <>
            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Các bước quy trình</CardTitle>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() =>{  setProcessSteps([...processSteps, { description: '', icon: String(processSteps.length + 1), id: Date.now(), title: '' }]); }} 
                  className="gap-2"
                >
                  <Plus size={14} /> Thêm bước
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {processSteps.map((step, idx) => (
                  <div key={step.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                        Bước {idx + 1}
                      </Label>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500 h-8 w-8" 
                        onClick={() => processSteps.length > 1 && setProcessSteps(processSteps.filter(s => s.id !== step.id))}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <Input 
                        placeholder="Icon/Số (VD: 1, 01, ✓)" 
                        value={step.icon} 
                        onChange={(e) =>{  setProcessSteps(processSteps.map(s => s.id === step.id ? {...s, icon: e.target.value} : s)); }}
                        className="md:col-span-1"
                      />
                      <Input 
                        placeholder="Tiêu đề bước" 
                        value={step.title} 
                        onChange={(e) =>{  setProcessSteps(processSteps.map(s => s.id === step.id ? {...s, title: e.target.value} : s)); }} 
                        className="md:col-span-3"
                      />
                    </div>
                    <Input 
                      placeholder="Mô tả chi tiết bước này..." 
                      value={step.description} 
                      onChange={(e) =>{  setProcessSteps(processSteps.map(s => s.id === step.id ? {...s, description: e.target.value} : s)); }} 
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <ProcessPreview 
              steps={processSteps} 
              brandColor={brandColor} secondary={secondary}
              selectedStyle={processStyle}
              onStyleChange={setProcessStyle}
            />
          </>
        )}

        {/* Clients */}
        {component.type === 'Clients' && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Logo khách hàng</CardTitle>
              </CardHeader>
              <CardContent>
                <MultiImageUploader<GalleryItem>
                  items={clientItems}
                  onChange={setClientItems}
                  folder="clients"
                  imageKey="url"
                  extraFields={[
                    { key: 'name', placeholder: 'Tên khách hàng (tùy chọn)', type: 'text' },
                    { key: 'link', placeholder: 'Link website (tùy chọn)', type: 'url' }
                  ]}
                  minItems={3}
                  maxItems={20}
                  aspectRatio="video"
                  columns={3}
                  showReorder={true}
                  addButtonText="Thêm logo"
                  emptyText="Chưa có logo nào (tối thiểu 3)"
                  layout="vertical"
                  deleteMode="defer"
                />
              </CardContent>
            </Card>
            <ClientsPreview 
              items={clientItems.map((item, idx) => ({ id: idx + 1, link: item.link, name: item.name, url: item.url }))} 
              brandColor={brandColor} secondary={secondary}
              selectedStyle={clientsStyle}
              onStyleChange={setClientsStyle}
            />
          </>
        )}

        {/* Video */}
        {component.type === 'Video' && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Video</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>URL Video <span className="text-red-500">*</span></Label>
                  <Input 
                    type="url"
                    value={videoConfig.videoUrl} 
                    onChange={(e) =>{  setVideoConfig({...videoConfig, videoUrl: e.target.value}); }} 
                    placeholder="https://www.youtube.com/watch?v=... hoặc link video trực tiếp"
                  />
                </div>
                <ImageFieldWithUpload
                  label="Thumbnail (ảnh bìa)"
                  value={videoConfig.thumbnailUrl}
                  onChange={(url) =>{  setVideoConfig({...videoConfig, thumbnailUrl: url}); }}
                  folder="video-thumbnails"
                  aspectRatio="video"
                  quality={0.85}
                  placeholder="Để trống sẽ tự động lấy thumbnail từ YouTube/Vimeo"
                />
              </CardContent>
            </Card>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Nội dung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tiêu đề</Label>
                  <Input 
                    value={videoConfig.heading} 
                    onChange={(e) =>{  setVideoConfig({...videoConfig, heading: e.target.value}); }} 
                    placeholder="Tiêu đề video section"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mô tả ngắn</Label>
                  <textarea 
                    value={videoConfig.description} 
                    onChange={(e) =>{  setVideoConfig({...videoConfig, description: e.target.value}); }} 
                    placeholder="Mô tả cho video section..."
                    className="w-full min-h-[80px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                  />
                </div>
              </CardContent>
            </Card>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Tùy chọn Video</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={videoConfig.autoplay} 
                      onChange={(e) =>{  setVideoConfig({...videoConfig, autoplay: e.target.checked}); }}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm">Tự động phát</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={videoConfig.loop} 
                      onChange={(e) =>{  setVideoConfig({...videoConfig, loop: e.target.checked}); }}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm">Lặp video</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={videoConfig.muted} 
                      onChange={(e) =>{  setVideoConfig({...videoConfig, muted: e.target.checked}); }}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm">Tắt tiếng</span>
                  </label>
                </div>
              </CardContent>
            </Card>
            <VideoPreview 
              config={videoConfig}
              brandColor={brandColor} secondary={secondary}
              selectedStyle={videoStyle}
              onStyleChange={setVideoStyle}
            />
          </>
        )}

        {/* Countdown / Promotion */}
        {component.type === 'Countdown' && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Nội dung khuyến mãi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tiêu đề chính</Label>
                    <Input 
                      value={countdownConfig.heading} 
                      onChange={(e) =>{  setCountdownConfig({...countdownConfig, heading: e.target.value}); }} 
                      placeholder="Flash Sale - Giảm giá sốc!" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tiêu đề phụ</Label>
                    <Input 
                      value={countdownConfig.subHeading} 
                      onChange={(e) =>{  setCountdownConfig({...countdownConfig, subHeading: e.target.value}); }} 
                      placeholder="Ưu đãi có hạn" 
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Mô tả</Label>
                  <textarea 
                    value={countdownConfig.description} 
                    onChange={(e) =>{  setCountdownConfig({...countdownConfig, description: e.target.value}); }} 
                    placeholder="Nhanh tay đặt hàng trước khi hết thời gian khuyến mãi"
                    className="w-full min-h-[60px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Thời gian kết thúc <span className="text-red-500">*</span></Label>
                    <Input 
                      type="datetime-local"
                      value={countdownConfig.endDate} 
                      onChange={(e) =>{  setCountdownConfig({...countdownConfig, endDate: e.target.value}); }} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Text giảm giá (VD: -50%)</Label>
                    <Input 
                      value={countdownConfig.discountText} 
                      onChange={(e) =>{  setCountdownConfig({...countdownConfig, discountText: e.target.value}); }} 
                      placeholder="-50%" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Text nút bấm</Label>
                    <Input 
                      value={countdownConfig.buttonText} 
                      onChange={(e) =>{  setCountdownConfig({...countdownConfig, buttonText: e.target.value}); }} 
                      placeholder="Mua ngay" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Liên kết</Label>
                    <Input 
                      value={countdownConfig.buttonLink} 
                      onChange={(e) =>{  setCountdownConfig({...countdownConfig, buttonLink: e.target.value}); }} 
                      placeholder="/products" 
                    />
                  </div>
                </div>

                <ImageFieldWithUpload
                  label="Ảnh nền (tùy chọn)"
                  value={countdownConfig.backgroundImage}
                  onChange={(url) =>{  setCountdownConfig({...countdownConfig, backgroundImage: url}); }}
                  folder="countdown"
                  aspectRatio="banner"
                  quality={0.85}
                  placeholder="https://example.com/banner.jpg"
                />

                <div className="space-y-2">
                  <Label>Hiển thị đơn vị thời gian</Label>
                  <div className="flex flex-wrap gap-4 mt-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input 
                        type="checkbox" 
                        checked={countdownConfig.showDays} 
                        onChange={(e) =>{  setCountdownConfig({...countdownConfig, showDays: e.target.checked}); }} 
                        className="w-4 h-4 rounded" 
                      />
                      Ngày
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input 
                        type="checkbox" 
                        checked={countdownConfig.showHours} 
                        onChange={(e) =>{  setCountdownConfig({...countdownConfig, showHours: e.target.checked}); }} 
                        className="w-4 h-4 rounded" 
                      />
                      Giờ
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input 
                        type="checkbox" 
                        checked={countdownConfig.showMinutes} 
                        onChange={(e) =>{  setCountdownConfig({...countdownConfig, showMinutes: e.target.checked}); }} 
                        className="w-4 h-4 rounded" 
                      />
                      Phút
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input 
                        type="checkbox" 
                        checked={countdownConfig.showSeconds} 
                        onChange={(e) =>{  setCountdownConfig({...countdownConfig, showSeconds: e.target.checked}); }} 
                        className="w-4 h-4 rounded" 
                      />
                      Giây
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <CountdownPreview 
              config={countdownConfig}
              brandColor={brandColor} secondary={secondary}
              selectedStyle={countdownStyle}
              onStyleChange={setCountdownStyle}
            />
          </>
        )}

        {component.type === 'VoucherPromotions' && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Nội dung voucher khuyến mãi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tiêu đề</Label>
                  <Input 
                    value={voucherConfig.heading} 
                    onChange={(e) =>{  setVoucherConfig({...voucherConfig, heading: e.target.value}); }} 
                    placeholder="Voucher khuyến mãi" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mô tả</Label>
                  <textarea 
                    value={voucherConfig.description} 
                    onChange={(e) =>{  setVoucherConfig({...voucherConfig, description: e.target.value}); }} 
                    placeholder="Áp dụng mã để nhận ưu đãi tốt nhất hôm nay."
                    className="w-full min-h-[60px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>CTA label</Label>
                    <Input 
                      value={voucherConfig.ctaLabel} 
                      onChange={(e) =>{  setVoucherConfig({...voucherConfig, ctaLabel: e.target.value}); }} 
                      placeholder="Xem tất cả ưu đãi" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CTA link</Label>
                    <Input 
                      value={voucherConfig.ctaUrl} 
                      onChange={(e) =>{  setVoucherConfig({...voucherConfig, ctaUrl: e.target.value}); }} 
                      placeholder="/promotions" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Giới hạn voucher (1-8)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={8}
                      value={voucherLimit}
                      onChange={(e) =>{  setVoucherLimit(Number(e.target.value)); }}
                      placeholder="4"
                    />
                    <p className="text-xs text-slate-500">Dữ liệu tự động từ Promotions (chỉ voucher có mã).</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <VoucherPromotionsPreview
              config={voucherConfig}
              limit={normalizeVoucherLimit(voucherLimit)}
              brandColor={brandColor} secondary={secondary}
              selectedStyle={voucherStyle}
              onStyleChange={setVoucherStyle}
            />
          </>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() =>{  router.push('/admin/home-components'); }} disabled={isSubmitting}>Hủy bỏ</Button>
          <Button type="submit" variant="accent" disabled={isSubmitting}>{isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}</Button>
        </div>
      </form>
    </div>
  );
}

// FAQ Edit Section with Drag & Drop
interface FaqItem { id: number; question: string; answer: string }
interface FaqConfigType { description?: string; buttonText?: string; buttonLink?: string }
function FaqEditSection({ 
  faqItems, setFaqItems, faqStyle, setFaqStyle, brandColor, secondary, faqConfig, setFaqConfig
}: { 
  faqItems: FaqItem[]; 
  setFaqItems: (items: FaqItem[]) => void; 
  faqStyle: FaqStyle; 
  setFaqStyle: (style: FaqStyle) => void; 
  brandColor: string;
  secondary: string;
  faqConfig: FaqConfigType;
  setFaqConfig: (config: FaqConfigType) => void;
}) {
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);

  const handleAddFaq = () =>{  setFaqItems([...faqItems, { answer: '', id: Date.now(), question: '' }]); };
  const handleRemoveFaq = (id: number) => faqItems.length > 1 && setFaqItems(faqItems.filter(f => f.id !== id));

  const dragProps = (id: number) => ({
    draggable: true,
    onDragEnd: () => { setDraggedId(null); setDragOverId(null); },
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); if (draggedId !== id) {setDragOverId(id);} },
    onDragStart: () =>{  setDraggedId(id); },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      if (!draggedId || draggedId === id) {return;}
      const newItems = [...faqItems];
      const draggedIdx = newItems.findIndex(i => i.id === draggedId);
      const targetIdx = newItems.findIndex(i => i.id === id);
      const [moved] = newItems.splice(draggedIdx, 1);
      newItems.splice(targetIdx, 0, moved);
      setFaqItems(newItems);
      setDraggedId(null); 
      setDragOverId(null);
    }
  });

  return (
    <>
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Câu hỏi thường gặp</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={handleAddFaq} className="gap-2">
            <Plus size={14} /> Thêm
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {faqItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: `${brandColor}10` }}>
                <HelpCircle size={24} style={{ color: brandColor }} />
              </div>
              <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1">Chưa có câu hỏi nào</h3>
              <p className="text-sm text-slate-500 mb-4">Thêm câu hỏi đầu tiên để bắt đầu</p>
              <Button type="button" variant="outline" size="sm" onClick={handleAddFaq} className="gap-2">
                <Plus size={14} /> Thêm câu hỏi
              </Button>
            </div>
          ) : (
            faqItems.map((item, idx) => (
              <div 
                key={item.id} 
                {...dragProps(item.id)}
                className={cn(
                  "p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-3 transition-all",
                  draggedId === item.id && "opacity-50",
                  dragOverId === item.id && "ring-2 ring-blue-500"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <GripVertical size={16} className="cursor-grab text-slate-400 hover:text-slate-600 flex-shrink-0" />
                    <Label className="text-sm font-medium">Câu hỏi {idx + 1}</Label>
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8" 
                    onClick={() => handleRemoveFaq(item.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
                <Input 
                  placeholder="Nhập câu hỏi..." 
                  value={item.question} 
                  onChange={(e) =>{  setFaqItems(faqItems.map(f => f.id === item.id ? {...f, question: e.target.value} : f)); }} 
                />
                <textarea 
                  placeholder="Nhập câu trả lời..." 
                  value={item.answer} 
                  onChange={(e) =>{  setFaqItems(faqItems.map(f => f.id === item.id ? {...f, answer: e.target.value} : f)); }}
                  className="w-full min-h-[80px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Config cho style 2 Cột */}
      {faqStyle === 'two-column' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Cấu hình style 2 Cột</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm mb-1.5 block">Mô tả ngắn</Label>
              <Input 
                placeholder="Tìm câu trả lời cho các thắc mắc phổ biến của bạn" 
                value={faqConfig.description ?? ''} 
                onChange={(e) =>{  setFaqConfig({...faqConfig, description: e.target.value}); }} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm mb-1.5 block">Nút CTA - Text</Label>
                <Input 
                  placeholder="Liên hệ hỗ trợ" 
                  value={faqConfig.buttonText ?? ''} 
                  onChange={(e) =>{  setFaqConfig({...faqConfig, buttonText: e.target.value}); }} 
                />
              </div>
              <div>
                <Label className="text-sm mb-1.5 block">Nút CTA - Link</Label>
                <Input 
                  placeholder="/lien-he" 
                  value={faqConfig.buttonLink ?? ''} 
                  onChange={(e) =>{  setFaqConfig({...faqConfig, buttonLink: e.target.value}); }} 
                />
              </div>
            </div>
            <p className="text-xs text-slate-500">Để trống nút CTA nếu không muốn hiển thị</p>
          </CardContent>
        </Card>
      )}

      <FaqPreview 
        items={faqItems} 
        brandColor={brandColor} secondary={secondary}
        selectedStyle={faqStyle}
        onStyleChange={setFaqStyle}
        config={faqConfig}
      />
    </>
  );
}

// Features Edit Section with Drag & Drop
function FeaturesEditSection({
  featuresItems,
  setFeaturesItems,
  brandColor,
  secondary,
  brandMode,
  featuresStyle,
  setFeaturesStyle
}: {
  featuresItems: {id: number, icon: string, title: string, description: string}[];
  setFeaturesItems: React.Dispatch<React.SetStateAction<{id: number, icon: string, title: string, description: string}[]>>;
  brandColor: string;
  secondary: string;
  brandMode: 'single' | 'dual';
  featuresStyle: FeaturesStyle;
  setFeaturesStyle: React.Dispatch<React.SetStateAction<FeaturesStyle>>;
}) {
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);

  const dragProps = (id: number) => ({
    draggable: true,
    onDragEnd: () => { setDraggedId(null); setDragOverId(null); },
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); if (draggedId !== id) {setDragOverId(id);} },
    onDragStart: () =>{  setDraggedId(id); },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      if (!draggedId || draggedId === id) {return;}
      const newItems = [...featuresItems];
      const draggedIdx = newItems.findIndex(i => i.id === draggedId);
      const targetIdx = newItems.findIndex(i => i.id === id);
      const [moved] = newItems.splice(draggedIdx, 1);
      newItems.splice(targetIdx, 0, moved);
      setFeaturesItems(newItems);
      setDraggedId(null); setDragOverId(null);
    }
  });

  return (
    <>
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Danh sách tính năng</CardTitle>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={() =>{  setFeaturesItems([...featuresItems, { description: '', icon: 'Zap', id: Date.now(), title: '' }]); }} 
            className="gap-2"
          >
            <Plus size={14} /> Thêm
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {featuresItems.map((item, idx) => (
            <div 
              key={item.id} 
              {...dragProps(item.id)}
              className={cn(
                "p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-3 cursor-grab active:cursor-grabbing transition-all",
                draggedId === item.id && "opacity-50",
                dragOverId === item.id && "ring-2 ring-blue-500"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical size={16} className="text-slate-400" />
                  <Label>Tính năng {idx + 1}</Label>
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="text-red-500 h-8 w-8" 
                  onClick={() => featuresItems.length > 1 && setFeaturesItems(featuresItems.filter(f => f.id !== item.id))}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select 
                  value={item.icon} 
                  onChange={(e) =>{  setFeaturesItems(featuresItems.map(f => f.id === item.id ? {...f, icon: e.target.value} : f)); }}
                  className="h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
                >
                  <option value="Zap">Zap - Nhanh</option>
                  <option value="Shield">Shield - Bảo mật</option>
                  <option value="Target">Target - Mục tiêu</option>
                  <option value="Layers">Layers - Tầng lớp</option>
                  <option value="Cpu">Cpu - Công nghệ</option>
                  <option value="Globe">Globe - Toàn cầu</option>
                  <option value="Rocket">Rocket - Khởi động</option>
                  <option value="Settings">Settings - Cài đặt</option>
                  <option value="Check">Check - Đúng</option>
                  <option value="Star">Star - Nổi bật</option>
                </select>
                <Input 
                  placeholder="Tiêu đề" 
                  value={item.title} 
                  onChange={(e) =>{  setFeaturesItems(featuresItems.map(f => f.id === item.id ? {...f, title: e.target.value} : f)); }} 
                  className="md:col-span-2"
                />
              </div>
              <Input 
                placeholder="Mô tả ngắn" 
                value={item.description} 
                onChange={(e) =>{  setFeaturesItems(featuresItems.map(f => f.id === item.id ? {...f, description: e.target.value} : f)); }} 
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <FeaturesPreview
        items={featuresItems}
        brandColor={brandColor}
        secondary={secondary}
        mode={brandMode}
        selectedStyle={featuresStyle}
        onStyleChange={setFeaturesStyle}
      />
    </>
  );
}
