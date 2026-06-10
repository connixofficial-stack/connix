'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { toast } from 'sonner';
import { api } from '@/convex/_generated/api';
import {
  AlertCircle,
  Award,
  BadgeCheck,
  Bell,
  Bolt,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  Gift,
  Globe,
  Heart,
  HeartHandshake,
  LayoutTemplate,
  Leaf,
  Loader2,
  Lock,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  Plus,
  RotateCcw,
  Save,
  Shield,
  ShoppingCart,
  Star,
  ThumbsUp,
  Trash2,
  Truck,
  GripVertical,
  Facebook,
  Instagram,
  Youtube,
  Send,
  Mail,
  Download,
} from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, cn } from '@/app/admin/components/ui';
import { 
  ExperienceModuleLink, 
  ExperienceHintCard,
  ProductDetailPreview,
  ExampleLinks,
} from '@/components/experiences';
import {
  BrowserFrame,
  DeviceToggle,
  deviceWidths,
  LayoutTabs,
  ControlCard,
  ColorConfigCard,
  ToggleRow,
  SelectRow,
  type DeviceType,
  type LayoutOption,
} from '@/components/experiences/editor';
import { IconPopoverPicker } from '@/app/admin/home-components/_shared/components/IconPopoverPicker';

import { useExperienceConfig, useExampleProduct, useExampleProductSlug, EXPERIENCE_GROUP, EXPERIENCE_NAMES, MESSAGES } from '@/lib/experiences';
import { useBrandColors } from '@/components/site/hooks';
import {
  DEFAULT_PRODUCT_IMAGE_ASPECT_RATIO,
  isProductImageAspectRatio,
  PRODUCT_IMAGE_ASPECT_RATIO_OPTIONS,
  type ProductImageAspectRatio,
} from '@/components/site/products/detail/_lib/image-aspect-ratio';
import type { ProductDetailElementColorChoice } from '@/components/site/products/detail/_lib/colors';
import { resolveProductImageAspectRatio } from '@/lib/products/image-aspect-ratio';

import * as LucideIcons from 'lucide-react';

const POPULAR_ICON_NAMES = [
  // CTA & Phổ biến hàng đầu
  'Send', 'Phone', 'PhoneCall', 'MessageCircle', 'MessageSquare', 'Mail', 'Globe', 'Sparkles', 'Star', 'Award', 
  'Heart', 'Gift', 'ShoppingCart', 'ShoppingBag', 'Truck', 'MapPin', 'Shield', 'CheckCircle2', 'BadgeCheck', 'ThumbsUp',
  // Nhóm Bán hàng & Ưu đãi
  'Store', 'Tag', 'Compass', 'CreditCard', 'Badge', 'Banknote', 'Landmark', 'Percent', 'Zap', 'Wallet', 
  'HandCoins', 'Receipt', 'PiggyBank', 'Trophy', 'Crown', 'Gem', 'Diamond', 'Medal', 'Verified', 'ShieldCheck',
  'HeartHandshake', 'Leaf', 'Flame', 'Activity', 'Clock', 'Calendar', 'Bell', 'Bolt', 'Settings', 'Package', 
  // Giao nhận & Du lịch
  'Map', 'Navigation', 'Navigation2', 'Anchor', 'Flag', 'Plane', 'Train', 'Bus', 'Bike', 'Car',
  // Giao tiếp & Thông tin
  'HelpCircle', 'AlertCircle', 'Info', 'Share2', 'Eye', 'EyeOff', 'Search', 'User', 'Users', 'UserCheck', 
  'UserPlus', 'Lock', 'Unlock', 'Key', 'KeyRound', 'Fingerprint', 'FileText', 'FileCheck2', 'Clipboard', 'List', 
  // Biểu tượng & Phong cách sống
  'Coffee', 'GlassWater', 'Wine', 'Beer', 'Utensils', 'ChefHat', 'Pizza', 'Cake', 'Cookie', 'Apple', 
  'Banana', 'Citrus', 'Strawberry', 'TreePine', 'Trees', 'Flower2', 'Sprout', 'Sun', 'Moon', 'Cloud', 
  'CloudRain', 'Wind', 'Umbrella', 'Smile', 'Laugh', 'Music', 'Volume2', 'Video', 'Tv', 'Laptop', 
  // Công nghệ & Kinh doanh
  'Smartphone', 'Tablet', 'Monitor', 'Cpu', 'Server', 'Database', 'HardDrive', 'Network', 'Wifi', 'Battery', 
  'Briefcase', 'Folder', 'FolderOpen', 'Archive', 'Book', 'BookOpen', 'GraduationCap', 'Bookmark', 'Scissors', 'Wrench', 
  'Hammer', 'Nut', 'Screwdriver', 'Paintbrush', 'Palette', 'PenTool', 'Pencil', 'Eraser', 'Ruler', 'StickyNote', 
  // Mở rộng thêm cho đủ 200+ icon
  'AlertTriangle', 'BookmarkCheck', 'Boxes', 'CalendarClock', 'CalendarDays', 'Camera', 'CircleDollarSign', 'CirclePercent', 'Coins', 'ConciergeBell',
  'DollarSign', 'Download', 'Euro', 'ExternalLink', 'FileCode2', 'FileHeart', 'FileImage', 'FileSpreadsheet', 'FolderHeart', 'GiftCard',
  'HammerIcon', 'HandHeart', 'History', 'Home', 'Hourglass', 'Inbox', 'Languages', 'Layers', 'LifeBuoy', 'Lightbulb',
  'Link2', 'Link', 'Megaphone', 'Menu', 'MessagesSquare', 'Mic', 'MonitorCheck', 'MonitorPlay', 'MonitorSmartphone', 'Newspaper',
  'Package2', 'PackageCheck', 'PackagePlus', 'PackageSearch', 'PackageX', 'PartyPopper', 'PhoneForwarded', 'PhoneIncoming', 'PhoneMissed', 'PhoneOutgoing',
  'Plug', 'Power', 'QrCode', 'Radio', 'ReceiptCent', 'ReceiptText', 'RefreshCw', 'RotateCcw', 'Scale', 'Scan',
  'ScanFace', 'ScanLine', 'SearchCode', 'SendHorizontal', 'ServerCog', 'ShoppingBag2', 'ShoppingCart2', 'Shuffle', 'Sigma', 'Signpost',
  'Siren', 'Sliders', 'Sparkle', 'Speaker', 'Speech', 'SquareAsterisk', 'SquareDollarSign', 'SquarePercent', 'Stamp', 'StarHalf',
  'Subscription', 'Tag2', 'Tags', 'Target', 'Telescope', 'Ticket', 'TrendingDown', 'TrendingUp', 'Truck2', 'Tv2',
  'Undo2', 'Upload', 'User2', 'UserCog', 'VideoOff', 'Voicemail', 'VolumeX', 'Warehouse', 'Watch', 'Webcam',
  'Wrench2', 'Youtube', 'ZapOff', 'CircleDot', 'Check', 'Plus', 'Minus', 'Trash2', 'ChevronRight', 'ChevronLeft'
];

const PREMIUM_ICON_OPTIONS = POPULAR_ICON_NAMES.map((name) => {
  const IconComp = (LucideIcons as any)[name];
  return {
    value: name,
    label: name,
    Icon: IconComp || LucideIcons.Star
  };
});

const ZaloSvg = ({ size = 18 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
    <path d="M12.49 10.2722v-.4496h1.3467v6.3218h-.7704a.576.576 0 01-.5763-.5729l-.0006.0005a3.273 3.273 0 01-1.9372.6321c-1.8138 0-3.2844-1.4697-3.2844-3.2823 0-1.8125 1.4706-3.2822 3.2844-3.2822a3.273 3.273 0 011.9372.6321l.0006.0005zM6.9188 7.7896v.205c0 .3823-.051.6944-.2995 1.0605l-.03.0343c-.0542.0615-.1815.206-.2421.2843L2.024 14.8h4.8948v.7682a.5764.5764 0 01-.5767.5761H0v-.3622c0-.4436.1102-.6414.2495-.8476L4.8582 9.23H.1922V7.7896h6.7266zm8.5513 8.3548a.4805.4805 0 01-.4803-.4798v-7.875h1.4416v8.3548H15.47zM20.6934 9.6C22.52 9.6 24 11.0807 24 12.9044c0 1.8252-1.4801 3.306-3.3066 3.306-1.8264 0-3.3066-1.4808-3.3066-3.306 0-1.8237 1.4802-3.3044 3.3066-3.3044zm-10.1412 5.253c1.0675 0 1.9324-.8645 1.9324-1.9312 0-1.065-.865-1.9295-1.9324-1.9295s-1.9324.8644-1.9324 1.9295c0 1.0667.865 1.9312 1.9324 1.9312zm10.1412-.0033c1.0737 0 1.945-.8707 1.945-1.9453 0-1.073-.8713-1.9436-1.945-1.9436-1.0753 0-1.945.8706-1.945 1.9436 0 1.0746.8697 1.9453 1.945 1.9453z" />
  </svg>
);

const TikTokSvg = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const XSvg = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const ShopeeSvg = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.9414 17.9633c.229-1.879-.981-3.077-4.1758-4.0969-1.548-.528-2.277-1.22-2.26-2.1719.065-1.056 1.048-1.825 2.352-1.85a5.2898 5.2898 0 0 1 2.8838.89c.116.072.197.06.263-.039.09-.145.315-.494.39-.62.051-.081.061-.187-.068-.281-.185-.1369-.704-.4149-.983-.5319a6.4697 6.4697 0 0 0-2.5118-.514c-1.909.008-3.4129 1.215-3.5389 2.826-.082 1.1629.494 2.1078 1.73 2.8278.262.152 1.6799.716 2.2438.892 1.774.552 2.695 1.5419 2.478 2.6969-.197 1.047-1.299 1.7239-2.818 1.7439-1.2039-.046-2.2878-.537-3.1278-1.19l-.141-.11c-.104-.08-.218-.075-.287.03-.05.077-.376.547-.458.67-.077.108-.035.168.045.234.35.293.817.613 1.134.775a6.7097 6.7097 0 0 0 2.8289.727 4.9048 4.9048 0 0 0 2.0759-.354c1.095-.465 1.8029-1.394 1.9449-2.554zM11.9986 1.4009c-2.068 0-3.7539 1.95-3.8329 4.3899h7.6657c-.08-2.44-1.765-4.3899-3.8328-4.3899zm7.8516 22.5981-.08.001-15.7843-.002c-1.074-.04-1.863-.91-1.971-1.991l-.01-.195L1.298 6.2858a.459.459 0 0 1 .45-.494h4.9748C6.8448 2.568 9.1607 0 11.9996 0c2.8388 0 5.1537 2.5689 5.2757 5.7898h4.9678a.459.459 0 0 1 .458.483l-.773 15.5883-.007.131c-.094 1.094-.979 1.9769-2.0709 2.0059z"/>
  </svg>
);

const MessengerSvg = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.24 0 0 4.952 0 11.64c0 3.499 1.434 6.521 3.769 8.61a.96.96 0 0 1 .323.683l.065 2.135a.96.96 0 0 0 1.347.85l2.381-1.053a.96.96 0 0 1 .641-.046A13 13 0 0 0 12 23.28c6.76 0 12-4.952 12-11.64S18.76 0 12 0m6.806 7.44c.522-.03.971.567.63 1.094l-4.178 6.457a.707.707 0 0 1-.977.208l-3.87-2.504a.44.44 0 0 0-.49.007l-4.363 3.01c-.637.438-1.415-.317-.995-.966l4.179-6.457a.706.706 0 0 1 .977-.21l3.87 2.505c.15.097.344.094.491-.007l4.362-3.008a.7.7 0 0 1 .364-.13"/>
  </svg>
);

interface SocialIconDef {
  value: string;
  label: string;
  brandColor: string;
  suggestedLabel: string;
  suggestedUrl: string;
  imageSrc?: string;
}

const SOCIAL_ICON_DEFS: SocialIconDef[] = [
  { value: 'zalo', label: 'Zalo', brandColor: '#0084ff', suggestedLabel: 'Chat Zalo', suggestedUrl: 'https://zalo.me/yourpage' },
  { value: 'shopee', label: 'Shopee', brandColor: '#ee4d2d', suggestedLabel: 'Shopee', suggestedUrl: 'https://shopee.vn/yourshop' },
  { value: 'lazada', label: 'Lazada', brandColor: '#0f1689', suggestedLabel: 'Lazada', suggestedUrl: 'https://lazada.vn/shop/yourshop', imageSrc: '/icons/lazada-logo.png' },
  { value: 'facebook', label: 'Facebook', brandColor: '#1877f2', suggestedLabel: 'Facebook', suggestedUrl: 'https://facebook.com/yourpage' },
  { value: 'instagram', label: 'Instagram', brandColor: '#e1306c', suggestedLabel: 'Instagram', suggestedUrl: 'https://instagram.com/yourpage' },
  { value: 'tiktok', label: 'TikTok', brandColor: '#000000', suggestedLabel: 'TikTok', suggestedUrl: 'https://tiktok.com/@yourpage' },
  { value: 'youtube', label: 'Youtube', brandColor: '#ff0000', suggestedLabel: 'Youtube', suggestedUrl: 'https://youtube.com/@yourchannel' },
  { value: 'phone', label: 'Điện thoại', brandColor: '#ef4444', suggestedLabel: 'Gọi ngay', suggestedUrl: 'tel:0123456789' },
  { value: 'messenger', label: 'Messenger', brandColor: '#0084ff', suggestedLabel: 'Messenger', suggestedUrl: 'https://m.me/yourpage' },
  { value: 'tiki', label: 'Tiki', brandColor: '#1a94ff', suggestedLabel: 'Tiki', suggestedUrl: 'https://tiki.vn/cua-hang/yourshop', imageSrc: '/icons/tiki-logo.png' },
  { value: 'mail', label: 'Email', brandColor: '#ea580c', suggestedLabel: 'Email', suggestedUrl: 'mailto:contact@example.com' },
];

const getSocialIconDef = (value: string): SocialIconDef =>
  SOCIAL_ICON_DEFS.find((d) => d.value === value) ?? SOCIAL_ICON_DEFS[0];

const renderSocialIcon = (value: string, size = 16) => {
  if (value === 'zalo') return <ZaloSvg size={size} />;
  if (value === 'tiktok') return <TikTokSvg size={size} />;
  if (value === 'x') return <XSvg size={size} />;
  if (value === 'shopee') return <ShopeeSvg size={size} />;
  if (value === 'messenger') return <MessengerSvg size={size} />;

  const def = SOCIAL_ICON_DEFS.find((d) => d.value === value);
  if (def?.imageSrc) {
    return <img src={def.imageSrc} alt={def.label} width={size} height={size} className="object-contain" style={{ borderRadius: '50%' }} />;
  }

  const map: Record<string, React.ElementType> = {
    phone: Phone,
    facebook: Facebook,
    instagram: Instagram,
    youtube: Youtube,
    telegram: Send,
    mail: Mail,
  };
  const Icon = map[value] ?? Phone;
  return <Icon size={size} />;
};

type ProductsDetailStyle = 'classic' | 'modern' | 'minimal' | 'premium';
type RelatedProductsMode = 'fixed' | 'infiniteScroll' | 'pagination';
type ProductImageAspectRatioSource = 'module' | 'custom';
type ComboAnimateType = 'none' | 'luxury-sheen' | 'typing' | 'letter-wave' | 'fire' | 'sparkle' | 'text-highlight' | 'border-rainbow';
type ComboEffectColor = 'black' | 'white' | 'red' | 'primary' | 'secondary' | 'gradient-1' | 'gradient-2' | 'gradient-3';

type ProductDetailAccentColorConfig = {
  categoryBadge?: ProductDetailElementColorChoice;
  discountBadge?: ProductDetailElementColorChoice;
  primaryButton?: ProductDetailElementColorChoice;
  comboBadge?: ProductDetailElementColorChoice;
};

type ProductDetailExperienceConfig = {
  layoutStyle: ProductsDetailStyle;
  imageAspectRatioSource: ProductImageAspectRatioSource;
  imageAspectRatio: ProductImageAspectRatio;
  showAllProductImagesSection: boolean;
  enableImageLightbox: boolean;
  layouts: {
    classic: ClassicLayoutConfig;
    modern: ModernLayoutConfig;
    minimal: MinimalLayoutConfig;
    premium: PremiumLayoutConfig;
  };
  showBuyNow: boolean;
  relatedProductsMode: RelatedProductsMode;
  relatedProductsPerPage: number;
  comboAnimateType?: ComboAnimateType;
  comboEffectColor?: ComboEffectColor;
  accentColors?: ProductDetailAccentColorConfig;
  showSocialButtons?: boolean;
  socialButtons?: Array<{ id: string; icon: string; label: string; url: string; active: boolean }>;
  cartButtonsLayout?: 'stack' | 'grid-2';
  highlightsPosition?: 'info_column' | 'image_column';
  highlightsSpacing?: 'low' | 'high' | 'none';
};

type BaseImageLayoutConfig = {
  showRating: boolean;
  showComments: boolean;
  showCommentLikes: boolean;
  showCommentReplies: boolean;
  showWishlist: boolean;
  showShare: boolean;
  showAddToCart: boolean;
};

type ClassicLayoutConfig = BaseImageLayoutConfig & {
  showClassicHighlights: boolean;
};

type ModernLayoutConfig = BaseImageLayoutConfig & {
  heroStyle: 'full' | 'split' | 'minimal';
};

type MinimalLayoutConfig = BaseImageLayoutConfig & {
  contentWidth: 'narrow' | 'medium' | 'wide';
};

type PremiumBannerItem = { title: string; subtitle: string };

type PremiumLayoutConfig = BaseImageLayoutConfig & {
  premiumBannerItems: PremiumBannerItem[];
  premiumBannerBg: ProductDetailElementColorChoice;
  premiumBannerText: ProductDetailElementColorChoice;
  showPremiumBanner: boolean;
  zaloText?: string;
  zaloIcon?: string;
  zaloUrl?: string;
  phoneText?: string;
  phoneIcon?: string;
  phoneUrl?: string;
  mobileFontSize?: 'xs' | 'sm' | 'base';
  priceLeftIcon?: string;
  priceRightIcon?: string;
  showPriceLeftIcon?: boolean;
  showPriceRightIcon?: boolean;
  cornerRadius?: 'none' | 'sm' | 'lg';
};

type ClassicHighlightIcon =
  | 'Award'
  | 'BadgeCheck'
  | 'Bell'
  | 'Bolt'
  | 'Calendar'
  | 'Camera'
  | 'CheckCircle2'
  | 'Clock'
  | 'CreditCard'
  | 'Gift'
  | 'Globe'
  | 'HeartHandshake'
  | 'Leaf'
  | 'Lock'
  | 'MapPin'
  | 'Phone'
  | 'RotateCcw'
  | 'Shield'
  | 'Star'
  | 'ThumbsUp'
  | 'Truck';

type ClassicHighlightItem = { icon: ClassicHighlightIcon; text: string };

const EXPERIENCE_KEY = 'product_detail_ui';
const CLASSIC_HIGHLIGHTS_KEY = 'products_detail_classic_highlights';

const LAYOUT_STYLES: LayoutOption<ProductsDetailStyle>[] = [
  { description: 'Layout 2 cột với gallery và info', id: 'classic', label: 'Classic' },
  { description: 'Full-width hero, landing page style', id: 'modern', label: 'Modern' },
  { description: 'Tối giản, tập trung sản phẩm', id: 'minimal', label: 'Minimal' },
  { description: 'Đẳng cấp, sang trọng, tối ưu Combo & Attributes', id: 'premium', label: 'Premium' },
];

const DEFAULT_CONFIG: ProductDetailExperienceConfig = {
  layoutStyle: 'classic',
  imageAspectRatioSource: 'module',
  imageAspectRatio: DEFAULT_PRODUCT_IMAGE_ASPECT_RATIO,
  showAllProductImagesSection: false,
  enableImageLightbox: false,
  layouts: {
    classic: { showRating: true, showComments: true, showCommentLikes: true, showCommentReplies: true, showWishlist: true, showShare: true, showAddToCart: true, showClassicHighlights: true },
    modern: { showRating: true, showComments: true, showCommentLikes: true, showCommentReplies: true, showWishlist: true, showShare: true, showAddToCart: true, heroStyle: 'full' },
    minimal: { showRating: true, showComments: true, showCommentLikes: true, showCommentReplies: true, showWishlist: true, showShare: true, showAddToCart: true, contentWidth: 'medium' },
    premium: { showRating: true, showComments: true, showCommentLikes: true, showCommentReplies: true, showWishlist: true, showShare: true, showAddToCart: true, premiumBannerBg: 'primary' as ProductDetailElementColorChoice, premiumBannerText: 'white' as ProductDetailElementColorChoice, showPremiumBanner: true, premiumBannerItems: [
      { title: 'FREESHIP TOÀN QUỐC', subtitle: 'Đơn từ 1.000.000đ' },
      { title: 'ĐÓNG GÓI AN TOÀN', subtitle: 'Chống sốc 100%' },
      { title: 'GIAO HÀNG NHANH', subtitle: 'Chỉ từ 2 - 3 ngày' },
      { title: 'QUÀ TẶNG HẤP DẪN', subtitle: 'Khi mua combo' },
    ],
    zaloText: 'MUA QUA ZALO',
    zaloIcon: 'Send',
    zaloUrl: '',
    phoneText: 'GỌI TƯ VẤN',
    phoneIcon: 'Phone',
    phoneUrl: '',
    mobileFontSize: 'xs',
    priceLeftIcon: 'Award',
    priceRightIcon: 'Gift',
    showPriceLeftIcon: true,
    showPriceRightIcon: true,
    cornerRadius: 'lg',
    },
  },
  showBuyNow: true,
  relatedProductsMode: 'fixed',
  relatedProductsPerPage: 8,
  comboAnimateType: 'luxury-sheen',
  comboEffectColor: 'gradient-1',
  accentColors: {
    categoryBadge: 'secondary',
    discountBadge: 'primary',
    primaryButton: 'primary',
    comboBadge: 'black',
  },
  showSocialButtons: false,
  socialButtons: [],
  cartButtonsLayout: 'stack',
  highlightsPosition: 'image_column',
  highlightsSpacing: 'high',
};

const HINTS = [
  'Classic layout phù hợp shop truyền thống.',
  'Modern layout tốt cho landing page sản phẩm.',
  'Mỗi layout có config riêng - chuyển tab để chỉnh.',
  'Buy now phụ thuộc module Orders + Checkout.',
  'Có thể kiểm tra UI tại đường dẫn sản phẩm thật.',
];

const DEFAULT_CLASSIC_HIGHLIGHTS: ClassicHighlightItem[] = [
  { icon: 'Truck', text: 'Giao hàng nhanh' },
  { icon: 'Shield', text: 'Bảo hành chính hãng' },
  { icon: 'RotateCcw', text: 'Đổi trả 30 ngày' },
];

const HIGHLIGHT_ICON_OPTIONS: ClassicHighlightIcon[] = [
  'Award',
  'BadgeCheck',
  'Bell',
  'Bolt',
  'Calendar',
  'Camera',
  'CheckCircle2',
  'Clock',
  'CreditCard',
  'Gift',
  'Globe',
  'HeartHandshake',
  'Leaf',
  'Lock',
  'MapPin',
  'Phone',
  'RotateCcw',
  'Shield',
  'Star',
  'ThumbsUp',
  'Truck',
];

const CLASSIC_HIGHLIGHT_ICON_MAP: Record<ClassicHighlightIcon, React.ElementType> = {
  Award,
  BadgeCheck,
  Bell,
  Bolt,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  CreditCard,
  Gift,
  Globe,
  HeartHandshake,
  Leaf,
  Lock,
  MapPin,
  Phone,
  RotateCcw,
  Shield,
  Star,
  ThumbsUp,
  Truck,
};

function VariantFeatureStatus({ enabled, href, moduleName }: { enabled: boolean; href: string; moduleName: string }) {
  return (
    <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
      <div className="flex items-start gap-2">
        <span className={`mt-1 inline-flex h-2 w-2 rounded-full ${enabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
        <div>
          <p className="text-sm font-medium text-slate-700">Phiên bản sản phẩm</p>
          <p className="text-xs text-slate-500">
            {enabled ? 'Đang bật' : 'Chưa bật'} · Nếu muốn {enabled ? 'tắt' : 'bật'} hãy vào {moduleName}
          </p>
        </div>
      </div>
      <Link href={href} className="text-xs font-medium text-cyan-600 hover:underline">
        Đi đến →
      </Link>
    </div>
  );
}

function ModuleFeatureStatus({ label, enabled, href, moduleName }: { label: string; enabled: boolean; href: string; moduleName: string }) {
  return (
    <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
      <div className="flex items-start gap-2">
        <span className={`mt-1 inline-flex h-2 w-2 rounded-full ${enabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
        <div>
          <p className="text-sm font-medium text-slate-700">{label}</p>
          <p className="text-xs text-slate-500">
            {enabled ? 'Đang bật' : 'Chưa bật'} · Nếu muốn {enabled ? 'tắt' : 'bật'} hãy vào {moduleName}
          </p>
        </div>
      </div>
      <Link href={href} className="text-xs font-medium text-cyan-600 hover:underline">
        Đi đến →
      </Link>
    </div>
  );
}

const normalizeClassicHighlights = (value: unknown): ClassicHighlightItem[] => {
  if (!Array.isArray(value)) {
    return DEFAULT_CLASSIC_HIGHLIGHTS;
  }
  const normalized = value
    .filter((item): item is { icon: unknown; text: unknown } => typeof item === 'object' && item !== null && 'icon' in item && 'text' in item)
    .map((item) => {
      const icon = typeof item.icon === 'string' && HIGHLIGHT_ICON_OPTIONS.includes(item.icon as ClassicHighlightIcon)
        ? (item.icon as ClassicHighlightIcon)
        : null;
      const text = typeof item.text === 'string' ? item.text.trim() : '';
      if (!icon || text.length === 0) {
        return null;
      }
      return { icon, text } satisfies ClassicHighlightItem;
    })
    .filter((item): item is ClassicHighlightItem => item !== null);

  return normalized.length > 0 ? normalized : DEFAULT_CLASSIC_HIGHLIGHTS;
};

export default function ProductDetailExperiencePage() {
  const experienceSetting = useQuery(api.settings.getByKey, { key: EXPERIENCE_KEY });
  const highlightsSetting = useQuery(api.settings.getByKey, { key: CLASSIC_HIGHLIGHTS_KEY });
  const saleModeSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'saleMode' });
  const moduleAspectRatioSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'defaultImageAspectRatio' });
  const commentsModule = useQuery(api.admin.modules.getModuleByKey, { key: 'comments' });
  const commentsLikesFeature = useQuery(api.admin.modules.getModuleFeature, { featureKey: 'enableLikes', moduleKey: 'comments' });
  const commentsRepliesFeature = useQuery(api.admin.modules.getModuleFeature, { featureKey: 'enableReplies', moduleKey: 'comments' });
  const wishlistModule = useQuery(api.admin.modules.getModuleByKey, { key: 'wishlist' });
  const ordersModule = useQuery(api.admin.modules.getModuleByKey, { key: 'orders' });
  const cartModule = useQuery(api.admin.modules.getModuleByKey, { key: 'cart' });
  const variantsSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'variantEnabled' });
  const enableCombosSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'enableCombos' });
  const isCombosEnabled = enableCombosSetting?.value === true;
  const exampleProductSlug = useExampleProductSlug();
  const exampleProduct = useExampleProduct();
  const enableProductTypesSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'enableProductTypes' });
  const enableProductTypes = enableProductTypesSetting?.value === true;
  const productTermsSource = useQuery(
    api.attributeTerms.getTermsForProducts,
    enableProductTypes && exampleProduct?._id ? { productIds: [exampleProduct._id] } : 'skip'
  );
  const demoAttributes = productTermsSource?.[0]?.terms ?? [];
  const setMultipleSettings = useMutation(api.settings.setMultiple);
  const [previewDevice, setPreviewDevice] = useState<DeviceType>('desktop');
  const [isSaving, setIsSaving] = useState(false);
  const brandColors = useBrandColors();
  const [brandColor, setBrandColor] = useState(brandColors.primary);
  const [secondaryColor, setSecondaryColor] = useState(brandColors.secondary || '');
  const [colorMode, setColorMode] = useState<'single' | 'dual'>(brandColors.mode || 'single');

  const serverHighlights = useMemo(
    () => normalizeClassicHighlights(highlightsSetting?.value),
    [highlightsSetting?.value]
  );
  const [classicHighlights, setClassicHighlights] = useState<ClassicHighlightItem[]>(serverHighlights);

  useEffect(() => {
    setClassicHighlights(serverHighlights);
  }, [serverHighlights]);

  useEffect(() => {
    setBrandColor(brandColors.primary);
    setSecondaryColor(brandColors.secondary || '');
    setColorMode(brandColors.mode || 'single');
  }, [brandColors.primary, brandColors.secondary, brandColors.mode]);

  const [draggedBtnId, setDraggedBtnId] = useState<string | null>(null);
  const [dragOverBtnId, setDragOverBtnId] = useState<string | null>(null);

  const addSocialButton = () => {
    const id = `btn-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setConfig(prev => ({
      ...prev,
      socialButtons: [
        ...(prev.socialButtons || []),
        { id, icon: 'phone', label: 'Gọi ngay', url: '', active: true }
      ]
    }));
  };

  const removeSocialButton = (id: string) => {
    setConfig(prev => ({
      ...prev,
      socialButtons: (prev.socialButtons || []).filter(btn => btn.id !== id)
    }));
  };

  const updateSocialButton = (id: string, value: Partial<any>) => {
    setConfig(prev => ({
      ...prev,
      socialButtons: (prev.socialButtons || []).map(btn => btn.id === id ? { ...btn, ...value } : btn)
    }));
  };

  const systemSettingsForSocial = useQuery(api.settings.getMultiple, {
    keys: [
      'contact_phone',
      'contact_email',
      'contact_address',
      'contact_zalo',
      'social_facebook',
      'social_instagram',
      'social_youtube',
      'social_tiktok',
    ],
  });

  const loadSocialFromSettings = () => {
    if (!systemSettingsForSocial) {
      toast.error('Cấu hình hệ thống chưa tải xong.');
      return;
    }

    const loadedButtons: Array<{ id: string; icon: string; label: string; url: string; active: boolean }> = [];
    const getVal = (k: string) => {
      const v = systemSettingsForSocial[k];
      return typeof v === 'string' ? v.trim() : '';
    };

    const phone = getVal('contact_phone');
    const zalo = getVal('contact_zalo');
    const facebook = getVal('social_facebook');
    const email = getVal('contact_email');
    const instagram = getVal('social_instagram');
    const youtube = getVal('social_youtube');
    const tiktok = getVal('social_tiktok');

    const buildBtn = (icon: string, label: string, url: string) => ({
      id: `btn-${Date.now()}-${Math.random().toString(36).slice(2)}-${icon}`,
      icon,
      label,
      url,
      active: true,
    });

    const normalizePhoneUrl = (v: string) => v.startsWith('tel:') ? v : `tel:${v.replace(/\s+/g, '')}`;
    const normalizeEmailUrl = (v: string) => v.startsWith('mailto:') ? v : `mailto:${v}`;
    const normalizeZaloUrl = (v: string) => {
      if (/^https?:\/\//.test(v)) return v;
      return `https://zalo.me/${v.replace(/\s+/g, '')}`;
    };

    if (phone) loadedButtons.push(buildBtn('phone', 'Gọi ngay', normalizePhoneUrl(phone)));
    if (zalo) loadedButtons.push(buildBtn('zalo', 'Chat Zalo', normalizeZaloUrl(zalo)));
    if (facebook) loadedButtons.push(buildBtn('facebook', 'Facebook', facebook));
    if (email) loadedButtons.push(buildBtn('mail', 'Email', normalizeEmailUrl(email)));
    if (instagram) loadedButtons.push(buildBtn('instagram', 'Instagram', instagram));
    if (youtube) loadedButtons.push(buildBtn('youtube', 'Youtube', youtube));
    if (tiktok) loadedButtons.push(buildBtn('tiktok', 'TikTok', tiktok));

    if (loadedButtons.length === 0) {
      toast.error('Thông tin liên hệ/Mạng xã hội trong Settings hệ thống trống.');
      return;
    }

    setConfig(prev => ({
      ...prev,
      socialButtons: loadedButtons
    }));
    toast.success(`Đã tự động tải ${loadedButtons.length} liên kết liên hệ từ cài đặt chung.`);
  };

  const getDragPropsBtn = (id: string) => ({
    draggable: true,
    onDragStart: () => setDraggedBtnId(id),
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); if (draggedBtnId !== id) setDragOverBtnId(id); },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      if (!draggedBtnId || draggedBtnId === id) return;
      const btns = config.socialButtons || [];
      const si = btns.findIndex((b) => b.id === draggedBtnId);
      const ti = btns.findIndex((b) => b.id === id);
      if (si < 0 || ti < 0) { setDraggedBtnId(null); setDragOverBtnId(null); return; }
      const next = [...btns];
      const [moved] = next.splice(si, 1);
      next.splice(ti, 0, moved);
      setConfig(prev => ({ ...prev, socialButtons: next }));
      setDraggedBtnId(null); setDragOverBtnId(null);
    },
    onDragEnd: () => { setDraggedBtnId(null); setDragOverBtnId(null); },
  });

  const moduleDefaultAspectRatio = useMemo(
    () => resolveProductImageAspectRatio(moduleAspectRatioSetting?.value),
    [moduleAspectRatioSetting?.value]
  );

  const serverConfig = useMemo<ProductDetailExperienceConfig>(() => {
    const raw = experienceSetting?.value as Partial<Omit<ProductDetailExperienceConfig, 'layouts' | 'comboAnimateType'> & {
      showClassicHighlights?: boolean;
      imageAspectRatio?: ProductImageAspectRatio;
      imageAspectRatioSource?: ProductImageAspectRatioSource;
      showAllProductImagesSection?: boolean;
      enableImageLightbox?: boolean;
      comboAnimateType?: ComboAnimateType;
      comboEffectColor?: ComboEffectColor;
      accentColors?: ProductDetailAccentColorConfig;
      showSocialButtons?: boolean;
      socialButtons?: Array<{ id: string; icon: string; label: string; url: string; active: boolean }>;
      cartButtonsLayout?: 'stack' | 'grid-2';
      highlightsPosition?: 'info_column' | 'image_column';
      layouts?: Partial<Record<ProductsDetailStyle, Partial<ClassicLayoutConfig & ModernLayoutConfig & MinimalLayoutConfig & PremiumLayoutConfig & BaseImageLayoutConfig & {
        imageAspectRatio?: ProductImageAspectRatio;
      }>>>;
    }> | undefined;
    const classicHighlightsSetting = raw?.layouts?.classic?.showClassicHighlights
      ?? raw?.showClassicHighlights
      ?? DEFAULT_CONFIG.layouts.classic.showClassicHighlights;
    const selectedImageAspectRatio = isProductImageAspectRatio(raw?.imageAspectRatio)
      ? raw.imageAspectRatio
      : isProductImageAspectRatio(raw?.layouts?.classic?.imageAspectRatio)
        ? raw.layouts.classic.imageAspectRatio
        : isProductImageAspectRatio(raw?.layouts?.modern?.imageAspectRatio)
          ? raw.layouts.modern.imageAspectRatio
          : isProductImageAspectRatio(raw?.layouts?.minimal?.imageAspectRatio)
            ? raw.layouts.minimal.imageAspectRatio
            : DEFAULT_PRODUCT_IMAGE_ASPECT_RATIO;
    const imageAspectRatioSource = raw?.imageAspectRatioSource === 'custom' || raw?.imageAspectRatioSource === 'module'
      ? raw.imageAspectRatioSource
      : isProductImageAspectRatio(raw?.imageAspectRatio)
        || isProductImageAspectRatio(raw?.layouts?.classic?.imageAspectRatio)
        || isProductImageAspectRatio(raw?.layouts?.modern?.imageAspectRatio)
        || isProductImageAspectRatio(raw?.layouts?.minimal?.imageAspectRatio)
        ? 'custom'
        : 'module';
    const comboAnimateType: ComboAnimateType = raw?.comboAnimateType ?? DEFAULT_CONFIG.comboAnimateType ?? 'luxury-sheen';
    return {
      layoutStyle: raw?.layoutStyle ?? DEFAULT_CONFIG.layoutStyle,
      imageAspectRatioSource,
      imageAspectRatio: selectedImageAspectRatio,
      showAllProductImagesSection: raw?.showAllProductImagesSection ?? false,
      enableImageLightbox: raw?.enableImageLightbox ?? false,
      layouts: {
        classic: {
          ...DEFAULT_CONFIG.layouts.classic,
          showClassicHighlights: classicHighlightsSetting,
          ...raw?.layouts?.classic,
        },
         modern: {
           ...DEFAULT_CONFIG.layouts.modern,
           ...raw?.layouts?.modern,
         },
         minimal: {
           ...DEFAULT_CONFIG.layouts.minimal,
           ...raw?.layouts?.minimal,
         },
         premium: {
           ...DEFAULT_CONFIG.layouts.premium,
           ...raw?.layouts?.premium,
           showPremiumBanner: (raw?.layouts?.premium as Partial<PremiumLayoutConfig>)?.showPremiumBanner ?? DEFAULT_CONFIG.layouts.premium.showPremiumBanner,
           premiumBannerBg: (raw?.layouts?.premium as Partial<PremiumLayoutConfig>)?.premiumBannerBg ?? DEFAULT_CONFIG.layouts.premium.premiumBannerBg,
           premiumBannerText: (raw?.layouts?.premium as Partial<PremiumLayoutConfig>)?.premiumBannerText ?? DEFAULT_CONFIG.layouts.premium.premiumBannerText,
           premiumBannerItems: Array.isArray((raw?.layouts?.premium as Partial<PremiumLayoutConfig>)?.premiumBannerItems)
             ? ((raw?.layouts?.premium as Partial<PremiumLayoutConfig>)?.premiumBannerItems as PremiumBannerItem[])
             : DEFAULT_CONFIG.layouts.premium.premiumBannerItems,
           zaloText: (raw?.layouts?.premium as Partial<PremiumLayoutConfig>)?.zaloText ?? DEFAULT_CONFIG.layouts.premium.zaloText,
           zaloIcon: (raw?.layouts?.premium as Partial<PremiumLayoutConfig>)?.zaloIcon ?? DEFAULT_CONFIG.layouts.premium.zaloIcon,
           zaloUrl: (raw?.layouts?.premium as Partial<PremiumLayoutConfig>)?.zaloUrl ?? DEFAULT_CONFIG.layouts.premium.zaloUrl,
           phoneText: (raw?.layouts?.premium as Partial<PremiumLayoutConfig>)?.phoneText ?? DEFAULT_CONFIG.layouts.premium.phoneText,
           phoneIcon: (raw?.layouts?.premium as Partial<PremiumLayoutConfig>)?.phoneIcon ?? DEFAULT_CONFIG.layouts.premium.phoneIcon,
           phoneUrl: (raw?.layouts?.premium as Partial<PremiumLayoutConfig>)?.phoneUrl ?? DEFAULT_CONFIG.layouts.premium.phoneUrl,
           mobileFontSize: (raw?.layouts?.premium as Partial<PremiumLayoutConfig>)?.mobileFontSize ?? DEFAULT_CONFIG.layouts.premium.mobileFontSize,
           priceLeftIcon: (raw?.layouts?.premium as Partial<PremiumLayoutConfig>)?.priceLeftIcon ?? DEFAULT_CONFIG.layouts.premium.priceLeftIcon,
           priceRightIcon: (raw?.layouts?.premium as Partial<PremiumLayoutConfig>)?.priceRightIcon ?? DEFAULT_CONFIG.layouts.premium.priceRightIcon,
           showPriceLeftIcon: (raw?.layouts?.premium as Partial<PremiumLayoutConfig>)?.showPriceLeftIcon ?? DEFAULT_CONFIG.layouts.premium.showPriceLeftIcon,
           showPriceRightIcon: (raw?.layouts?.premium as Partial<PremiumLayoutConfig>)?.showPriceRightIcon ?? DEFAULT_CONFIG.layouts.premium.showPriceRightIcon,
           cornerRadius: (raw?.layouts?.premium as Partial<PremiumLayoutConfig>)?.cornerRadius ?? DEFAULT_CONFIG.layouts.premium.cornerRadius,
         },
       },
      showBuyNow: raw?.showBuyNow ?? true,
      relatedProductsMode: raw?.relatedProductsMode === 'infiniteScroll' || raw?.relatedProductsMode === 'pagination'
        ? raw.relatedProductsMode
        : DEFAULT_CONFIG.relatedProductsMode,
      relatedProductsPerPage: typeof raw?.relatedProductsPerPage === 'number' && raw.relatedProductsPerPage > 0
        ? raw.relatedProductsPerPage
        : DEFAULT_CONFIG.relatedProductsPerPage,
      comboAnimateType,
      comboEffectColor: raw?.comboEffectColor ?? DEFAULT_CONFIG.comboEffectColor,
      accentColors: {
        ...DEFAULT_CONFIG.accentColors,
        ...raw?.accentColors,
      },
      showSocialButtons: raw?.showSocialButtons ?? false,
      socialButtons: raw?.socialButtons ?? [],
      cartButtonsLayout: raw?.cartButtonsLayout ?? 'stack',
      highlightsPosition: raw?.highlightsPosition ?? 'image_column',
      highlightsSpacing: raw?.highlightsSpacing ?? 'high',
    };
  }, [experienceSetting?.value]);

  const isLoading = experienceSetting === undefined || highlightsSetting === undefined || saleModeSetting === undefined;

  const { config, setConfig, hasChanges } = useExperienceConfig(serverConfig, DEFAULT_CONFIG, isLoading);
  const saleMode = (saleModeSetting?.value as string | undefined) ?? 'cart';

  const currentLayoutConfig = config.layouts[config.layoutStyle];
  const resolvedImageAspectRatio = config.imageAspectRatioSource === 'module'
    ? moduleDefaultAspectRatio
    : config.imageAspectRatio;
  const moduleAspectRatioLabel = useMemo(() => {
    const match = PRODUCT_IMAGE_ASPECT_RATIO_OPTIONS.find((option) => option.value === moduleDefaultAspectRatio);
    return match?.label ?? 'Theo module';
  }, [moduleDefaultAspectRatio]);
  const accentColorOptions = useMemo(() => {
    const base: { value: ProductDetailElementColorChoice; label: string }[] = [
      { value: 'white', label: 'Trắng' },
      { value: 'black', label: 'Đen' },
      { value: 'red', label: 'Đỏ' },
      { value: 'primary', label: 'Màu chính' },
    ];
    if (colorMode === 'dual') {
      base.push({ value: 'secondary', label: 'Màu phụ' });
    }
    return base;
  }, [colorMode]);
  const canUseWishlist = wishlistModule?.enabled ?? false;
  const canUseComments = commentsModule?.enabled ?? false;
  const canUseCommentLikes = canUseComments && (commentsLikesFeature?.enabled ?? false);
  const canUseCommentReplies = canUseComments && (commentsRepliesFeature?.enabled ?? false);
  const canUseCart = (cartModule?.enabled ?? false) && (ordersModule?.enabled ?? false);
  const canUseOrders = ordersModule?.enabled ?? false;
  const updateLayoutConfig = <K extends keyof typeof currentLayoutConfig>(
    key: K,
    value: (typeof currentLayoutConfig)[K]
  ) => {
    setConfig(prev => ({
      ...prev,
      layouts: {
        ...prev.layouts,
        [prev.layoutStyle]: {
          ...prev.layouts[prev.layoutStyle],
          [key]: value,
        },
      },
    }));
  };
  const updateAccentColor = (key: keyof ProductDetailAccentColorConfig, value: ProductDetailElementColorChoice) => {
    setConfig(prev => ({
      ...prev,
      accentColors: {
        ...DEFAULT_CONFIG.accentColors,
        ...prev.accentColors,
        [key]: value,
      },
    }));
  };

  const hasHighlightsChanges = useMemo(
    () => JSON.stringify(classicHighlights) !== JSON.stringify(serverHighlights),
    [classicHighlights, serverHighlights]
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
       const normalizedLayouts = {
         classic: {
           ...config.layouts.classic,
           showRating: canUseComments ? config.layouts.classic.showRating : false,
           showComments: canUseComments ? config.layouts.classic.showComments : false,
           showCommentLikes: canUseCommentLikes ? config.layouts.classic.showCommentLikes : false,
           showCommentReplies: canUseCommentReplies ? config.layouts.classic.showCommentReplies : false,
           showWishlist: canUseWishlist ? config.layouts.classic.showWishlist : false,
           showAddToCart: canUseCart ? config.layouts.classic.showAddToCart : false,
         },
         modern: {
           ...config.layouts.modern,
           showRating: canUseComments ? config.layouts.modern.showRating : false,
           showComments: canUseComments ? config.layouts.modern.showComments : false,
           showCommentLikes: canUseCommentLikes ? config.layouts.modern.showCommentLikes : false,
           showCommentReplies: canUseCommentReplies ? config.layouts.modern.showCommentReplies : false,
           showWishlist: canUseWishlist ? config.layouts.modern.showWishlist : false,
           showAddToCart: canUseCart ? config.layouts.modern.showAddToCart : false,
         },
         minimal: {
           ...config.layouts.minimal,
           showRating: canUseComments ? config.layouts.minimal.showRating : false,
           showComments: canUseComments ? config.layouts.minimal.showComments : false,
           showCommentLikes: canUseCommentLikes ? config.layouts.minimal.showCommentLikes : false,
           showCommentReplies: canUseCommentReplies ? config.layouts.minimal.showCommentReplies : false,
           showWishlist: canUseWishlist ? config.layouts.minimal.showWishlist : false,
           showAddToCart: canUseCart ? config.layouts.minimal.showAddToCart : false,
         },
         premium: {
           ...config.layouts.premium,
           showRating: canUseComments ? config.layouts.premium.showRating : false,
           showComments: canUseComments ? config.layouts.premium.showComments : false,
           showCommentLikes: canUseCommentLikes ? config.layouts.premium.showCommentLikes : false,
           showCommentReplies: canUseCommentReplies ? config.layouts.premium.showCommentReplies : false,
           showWishlist: canUseWishlist ? config.layouts.premium.showWishlist : false,
           showAddToCart: canUseCart ? config.layouts.premium.showAddToCart : false,
         },
       };

      const normalizedConfig = {
        ...config,
        showBuyNow: canUseOrders ? config.showBuyNow : false,
        layouts: normalizedLayouts,
      };

      const settingsToSave = [
        { group: EXPERIENCE_GROUP, key: EXPERIENCE_KEY, value: normalizedConfig },
        { group: 'products', key: CLASSIC_HIGHLIGHTS_KEY, value: classicHighlights },
      ];
      await setMultipleSettings({ settings: settingsToSave });
      toast.success(MESSAGES.saveSuccess(EXPERIENCE_NAMES[EXPERIENCE_KEY]));
    } catch {
      toast.error(MESSAGES.saveError);
    } finally {
      setIsSaving(false);
    }
  };

  const getPreviewProps = () => {
    const premiumLayoutConfig = config.layouts.premium as PremiumLayoutConfig;
    const premiumBannerItems = premiumLayoutConfig.premiumBannerItems ?? DEFAULT_CONFIG.layouts.premium.premiumBannerItems;
    const premiumBannerBg = premiumLayoutConfig.premiumBannerBg ?? DEFAULT_CONFIG.layouts.premium.premiumBannerBg;
    const premiumBannerText = premiumLayoutConfig.premiumBannerText ?? DEFAULT_CONFIG.layouts.premium.premiumBannerText;
    const showPremiumBanner = premiumLayoutConfig.showPremiumBanner ?? DEFAULT_CONFIG.layouts.premium.showPremiumBanner;
    const base = {
      layoutStyle: config.layoutStyle,
      showRating: currentLayoutConfig.showRating && canUseComments,
      showWishlist: currentLayoutConfig.showWishlist && canUseWishlist,
      showShare: currentLayoutConfig.showShare,
      showAddToCart: currentLayoutConfig.showAddToCart && canUseCart,
      showBuyNow: config.showBuyNow && canUseOrders,
      showComments: currentLayoutConfig.showComments && canUseComments,
      showCommentLikes: currentLayoutConfig.showCommentLikes && canUseCommentLikes,
      showCommentReplies: currentLayoutConfig.showCommentReplies && canUseCommentReplies,
      showVariants: (variantsSetting?.value as boolean | undefined) ?? false,
      heroStyle: config.layoutStyle === 'modern'
        ? (currentLayoutConfig as ModernLayoutConfig).heroStyle
        : 'full',
      contentWidth: config.layoutStyle === 'minimal'
        ? (currentLayoutConfig as MinimalLayoutConfig).contentWidth
        : 'medium',
      imageAspectRatio: resolvedImageAspectRatio,
      showAllProductImagesSection: config.showAllProductImagesSection,
      enableImageLightbox: config.enableImageLightbox,
      showHighlights: config.layouts.classic.showClassicHighlights,
      classicHighlights,
      premiumBannerItems,
      premiumBannerBg,
      premiumBannerText,
      showPremiumBanner,
      device: previewDevice,
      brandColor,
      secondaryColor,
      colorMode,
      relatedProductsMode: config.relatedProductsMode,
      relatedProductsPerPage: config.relatedProductsPerPage,
      comboAnimateType: config.comboAnimateType,
      comboEffectColor: config.comboEffectColor,
      accentColors: config.accentColors,
      showSocialButtons: config.showSocialButtons,
      socialButtons: config.socialButtons,
      demoAttributes,
      productTypeId: exampleProduct?.productTypeId,
      zaloText: premiumLayoutConfig.zaloText,
      zaloIcon: premiumLayoutConfig.zaloIcon,
      zaloUrl: premiumLayoutConfig.zaloUrl,
      phoneText: premiumLayoutConfig.phoneText,
      phoneIcon: premiumLayoutConfig.phoneIcon,
      phoneUrl: premiumLayoutConfig.phoneUrl,
      mobileFontSize: premiumLayoutConfig.mobileFontSize,
      priceLeftIcon: premiumLayoutConfig.priceLeftIcon,
      priceRightIcon: premiumLayoutConfig.priceRightIcon,
      showPriceLeftIcon: premiumLayoutConfig.showPriceLeftIcon,
      showPriceRightIcon: premiumLayoutConfig.showPriceRightIcon,
      cartButtonsLayout: config.cartButtonsLayout,
      highlightsPosition: config.highlightsPosition,
      highlightsSpacing: config.highlightsSpacing,
      cornerRadius: premiumLayoutConfig.cornerRadius,
    };

    return base;
  };

  const updateHighlight = (index: number, value: Partial<ClassicHighlightItem>) => {
    setClassicHighlights(prev => prev.map((item, i) => (i === index ? { ...item, ...value } : item)));
  };

  const addHighlight = () => {
    setClassicHighlights(prev => ([...prev, { icon: 'Star', text: 'Điểm nổi bật mới' }]));
  };

  const removeHighlight = (index: number) => {
    setClassicHighlights(prev => prev.filter((_, i) => i !== index));
  };

  const updateClassicLayoutConfig = <K extends keyof ClassicLayoutConfig>(
    key: K,
    value: ClassicLayoutConfig[K]
  ) => {
    setConfig(prev => ({
      ...prev,
      layouts: {
        ...prev.layouts,
        classic: {
          ...prev.layouts.classic,
          [key]: value,
        },
      },
    }));
  };

  const renderHighlightsControls = () => (
    <div className="space-y-3">
      <ToggleRow
        label="Highlights"
        description="Hiện tính năng nổi bật"
        checked={config.layouts.classic.showClassicHighlights}
        onChange={(v) => updateClassicLayoutConfig('showClassicHighlights', v)}
        accentColor={brandColor}
      />
      {config.layouts.classic.showClassicHighlights && (
        <SelectRow
          label="Vị trí hiển thị"
          value={config.highlightsPosition || 'image_column'}
          options={[
            { label: 'Dưới thông tin sản phẩm (cột phải)', value: 'info_column' },
            { label: 'Dưới ảnh sản phẩm (cột trái)', value: 'image_column' },
          ]}
          onChange={(v) => setConfig(prev => ({ ...prev, highlightsPosition: v as 'info_column' | 'image_column' }))}
        />
      )}
      {config.layouts.classic.showClassicHighlights && (
        <SelectRow
          label={config.highlightsPosition === 'image_column' ? 'Khoảng cách dưới ảnh (Highlights)' : 'Khoảng cách cột phải (Highlights)'}
          value={config.highlightsSpacing || 'high'}
          options={config.highlightsPosition === 'image_column'
            ? [
                { label: 'Dính sát (Không khoảng cách)', value: 'none' },
                { label: 'Nhiều (Mặc định)', value: 'high' },
              ]
            : [
                { label: 'Nhiều (Mặc định)', value: 'high' },
                { label: 'Bỏ (Không khoảng cách)', value: 'none' },
              ]
          }
          onChange={(v) => setConfig(prev => ({ ...prev, highlightsSpacing: v as 'low' | 'high' | 'none' }))}
        />
      )}
      {classicHighlights.map((item, index) => {
        const Icon = CLASSIC_HIGHLIGHT_ICON_MAP[item.icon];
        return (
          <div key={`${item.icon}-${index}`} className="space-y-2 rounded-md border border-slate-200 bg-white p-2">
            <div className="grid grid-cols-6 gap-1">
              {HIGHLIGHT_ICON_OPTIONS.map((icon) => {
                const IconOption = CLASSIC_HIGHLIGHT_ICON_MAP[icon];
                const isActive = icon === item.icon;
                return (
                  <button
                    key={`${icon}-${index}`}
                    type="button"
                    aria-label={icon}
                    onClick={() => updateHighlight(index, { icon })}
                    className="h-7 w-7 rounded border flex items-center justify-center transition-colors"
                    style={isActive
                      ? { borderColor: brandColor, color: brandColor }
                      : { borderColor: '#e2e8f0', color: '#64748b' }}
                  >
                    <IconOption size={14} />
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded border border-slate-200 flex items-center justify-center text-slate-600">
                <Icon size={14} />
              </div>
              <Input
                value={item.text}
                onChange={(e) => updateHighlight(index, { text: e.target.value })}
                className="h-8 text-xs"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeHighlight(index)}
                className="h-8 w-8"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        );
      })}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addHighlight}
        className="gap-1.5 text-xs"
      >
        <Plus size={12} />
        Thêm highlight
      </Button>
    </div>
  );

  const renderSocialButtonsControls = () => {
    const btns = config.socialButtons || [];
    return (
      <div className="space-y-3">
        <ToggleRow
          label="Nút mạng xã hội"
          description="Hiện các nút liên hệ MXH"
          checked={config.showSocialButtons || false}
          onChange={(v) => setConfig(prev => ({ ...prev, showSocialButtons: v }))}
          accentColor={brandColor}
        />
        {config.showSocialButtons && (
          <>
            <div className="flex justify-end gap-2 mb-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={loadSocialFromSettings}
                className="h-7 text-[11px] gap-1.5"
              >
                <Download size={12} /> Tải từ cấu hình chung
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSocialButton}
                className="h-7 text-[11px] gap-1.5"
              >
                <Plus size={12} /> Thêm nút
              </Button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {btns.map((btn) => {
                const def = getSocialIconDef(btn.icon);
                const isDragOver = dragOverBtnId === btn.id;
                const isDragged = draggedBtnId === btn.id;

                return (
                  <div
                    key={btn.id}
                    {...getDragPropsBtn(btn.id)}
                    className={cn(
                      'rounded-lg border transition-all cursor-grab active:cursor-grabbing overflow-hidden bg-white dark:bg-slate-900',
                      'border-slate-200 dark:border-slate-700',
                      isDragged && 'opacity-50 scale-[0.98]',
                      isDragOver && 'ring-2 ring-blue-500 ring-offset-2',
                    )}
                  >
                    <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 dark:bg-slate-800/50">
                      <GripVertical size={13} className="text-slate-400 shrink-0" />
                      <span className="flex h-5 w-5 items-center justify-center rounded-full text-white shrink-0" style={{ backgroundColor: def.brandColor }}>
                        {renderSocialIcon(btn.icon, 11)}
                      </span>
                      <select
                        value={btn.icon}
                        onChange={(e) => {
                          const iconVal = e.target.value;
                          const iconDef = getSocialIconDef(iconVal);
                          updateSocialButton(btn.id, { icon: iconVal, label: iconDef.suggestedLabel });
                        }}
                        className="text-xs border rounded bg-transparent px-1 h-6 shrink-0"
                      >
                        {SOCIAL_ICON_DEFS.map(d => (
                          <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                      </select>
                      <span className="flex-1" />
                      <button
                        type="button"
                        onClick={() => updateSocialButton(btn.id, { active: !btn.active })}
                        className={cn('text-[10px] px-1.5 py-0.5 rounded border transition-colors', btn.active ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200')}
                      >
                        {btn.active ? 'Bật' : 'Tắt'}
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-red-500 h-6 w-6 shrink-0"
                        onClick={() => removeSocialButton(btn.id)}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>

                    <div className="p-2 space-y-1.5 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400">Nhãn</label>
                          <Input
                            value={btn.label}
                            onChange={(e) => updateSocialButton(btn.id, { label: e.target.value })}
                            className="h-7 text-xs px-2"
                            placeholder="Nhãn nút"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400">URL</label>
                          <Input
                            value={btn.url}
                            onChange={(e) => updateSocialButton(btn.id, { url: e.target.value })}
                            className="h-7 text-xs px-2"
                            placeholder="tel:, http://, ..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  };

  const renderLayoutSpecificControls = () => {
    if (config.layoutStyle === 'modern') {
      const layoutConfig = currentLayoutConfig as ModernLayoutConfig;
      return (
        <SelectRow
          label="Hero Style"
          value={layoutConfig.heroStyle}
          options={[
            { label: 'Full Width', value: 'full' },
            { label: 'Split Layout', value: 'split' },
            { label: 'Minimal', value: 'minimal' },
          ]}
          onChange={(v) => updateLayoutConfig('heroStyle' as keyof typeof currentLayoutConfig, v as never)}
        />
      );
    }
    if (config.layoutStyle === 'minimal') {
      const layoutConfig = currentLayoutConfig as MinimalLayoutConfig;
      return (
        <SelectRow
          label="Content Width"
          value={layoutConfig.contentWidth}
          options={[
            { label: 'Narrow', value: 'narrow' },
            { label: 'Medium', value: 'medium' },
            { label: 'Wide', value: 'wide' },
          ]}
          onChange={(v) => updateLayoutConfig('contentWidth' as keyof typeof currentLayoutConfig, v as never)}
        />
      );
    }
    if (config.layoutStyle === 'premium') {
      return null;
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">{MESSAGES.loading}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5" style={{ color: brandColor }} />
            <h1 className="text-2xl font-bold">Chi tiết sản phẩm</h1>
          </div>
          <Link href="/system/experiences" className="text-sm text-blue-600 hover:underline">
            Quay lại danh sách
          </Link>
        </div>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={(!hasChanges && !hasHighlightsChanges) || isSaving}
          className="gap-1.5"
          style={{ backgroundColor: brandColor, color: '#ffffff' }}
        >
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          <span>{hasChanges || hasHighlightsChanges ? 'Lưu' : 'Đã lưu'}</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thiết lập hiển thị</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ControlCard title="Màu thương hiệu">
            <ColorConfigCard
              primary={brandColor}
              secondary={secondaryColor}
              mode={colorMode}
              onPrimaryChange={setBrandColor}
              onSecondaryChange={setSecondaryColor}
              onModeChange={setColorMode}
            />
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-1">
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Phối màu điểm nhấn</p>
              <SelectRow
                label="Badge danh mục"
                value={config.accentColors?.categoryBadge ?? DEFAULT_CONFIG.accentColors?.categoryBadge ?? 'secondary'}
                options={accentColorOptions}
                onChange={(value) => updateAccentColor('categoryBadge', value as ProductDetailElementColorChoice)}
              />
              <SelectRow
                label="Badge giảm giá"
                value={config.accentColors?.discountBadge ?? DEFAULT_CONFIG.accentColors?.discountBadge ?? 'primary'}
                options={accentColorOptions}
                onChange={(value) => updateAccentColor('discountBadge', value as ProductDetailElementColorChoice)}
              />
              <SelectRow
                label="CTA chính (Thêm giỏ/Liên hệ)"
                value={config.accentColors?.primaryButton ?? DEFAULT_CONFIG.accentColors?.primaryButton ?? 'primary'}
                options={accentColorOptions}
                onChange={(value) => updateAccentColor('primaryButton', value as ProductDetailElementColorChoice)}
              />
              <SelectRow
                label="Badge combo"
                value={config.accentColors?.comboBadge ?? DEFAULT_CONFIG.accentColors?.comboBadge ?? 'black'}
                options={accentColorOptions}
                onChange={(value) => updateAccentColor('comboBadge', value as ProductDetailElementColorChoice)}
              />
            </div>
          </ControlCard>
          <ControlCard title="Khối hiển thị">
            <SelectRow
              label="Nguồn tỉ lệ ảnh"
              value={config.imageAspectRatioSource}
              options={[
                { label: `Theo module Sản phẩm (${moduleAspectRatioLabel})`, value: 'module' },
                { label: 'Tùy chỉnh', value: 'custom' },
              ]}
              onChange={(value) => setConfig(prev => ({ ...prev, imageAspectRatioSource: value as ProductImageAspectRatioSource }))}
            />
            {config.imageAspectRatioSource === 'custom' ? (
              <SelectRow
                label="Tỉ lệ ảnh sản phẩm"
                value={config.imageAspectRatio}
                options={PRODUCT_IMAGE_ASPECT_RATIO_OPTIONS}
                onChange={(value) => setConfig(prev => ({ ...prev, imageAspectRatio: value as ProductImageAspectRatio }))}
              />
            ) : (
              <p className="text-xs text-slate-500">Đang dùng tỉ lệ từ module Sản phẩm.</p>
            )}
            <ToggleRow
              label="Đánh giá"
              checked={currentLayoutConfig.showRating && canUseComments}
              onChange={(v) => updateLayoutConfig('showRating', v)}
              accentColor={brandColor}
              disabled={!canUseComments}
            />
            <ToggleRow
              label="Wishlist"
              checked={currentLayoutConfig.showWishlist && canUseWishlist}
              onChange={(v) => updateLayoutConfig('showWishlist', v)}
              accentColor={brandColor}
              disabled={!canUseWishlist}
            />
            <ToggleRow
              label="Nút chia sẻ"
              checked={currentLayoutConfig.showShare}
              onChange={(v) => updateLayoutConfig('showShare', v)}
              accentColor={brandColor}
            />
            <ToggleRow
              label="Add to Cart"
              checked={currentLayoutConfig.showAddToCart && canUseCart}
              onChange={(v) => updateLayoutConfig('showAddToCart', v)}
              accentColor={brandColor}
              disabled={!canUseCart}
            />
            <ToggleRow
              label="Buy Now"
              checked={config.showBuyNow && canUseOrders}
              onChange={(v) => setConfig(prev => ({ ...prev, showBuyNow: v }))}
              accentColor={brandColor}
              disabled={!canUseOrders}
            />
            {currentLayoutConfig.showAddToCart && saleMode === 'cart' && (
              <SelectRow
                label="Bố cục nút"
                value={config.cartButtonsLayout ?? 'stack'}
                options={[
                  { value: 'stack', label: 'Xếp dọc (Stack)' },
                  { value: 'grid-2', label: 'Xếp ngang (Grid 2)' },
                ]}
                onChange={(v) => setConfig(prev => ({ ...prev, cartButtonsLayout: v as 'stack' | 'grid-2' }))}
              />
            )}
            <ToggleRow
              label="Section toàn bộ ảnh"
              description="Hiển thị toàn bộ ảnh sản phẩm dưới mô tả"
              checked={config.showAllProductImagesSection}
              onChange={(v) => setConfig(prev => ({ ...prev, showAllProductImagesSection: v }))}
              accentColor={brandColor}
            />
            <ToggleRow
              label="Mở ảnh toàn màn hình"
              description="Nhấn ảnh chính để mở xem ảnh lớn"
              checked={config.enableImageLightbox}
              onChange={(v) => setConfig(prev => ({ ...prev, enableImageLightbox: v }))}
              accentColor={brandColor}
            />
            <VariantFeatureStatus
              enabled={(variantsSetting?.value as boolean | undefined) ?? false}
              href="/system/modules/products"
              moduleName="module Sản phẩm"
            />
          </ControlCard>

          <ControlCard title="Bình luận">
            <ToggleRow
              label="Hiển thị bình luận"
              checked={currentLayoutConfig.showComments && canUseComments}
              onChange={(v) => updateLayoutConfig('showComments' as keyof typeof currentLayoutConfig, v as never)}
              accentColor={brandColor}
              disabled={!canUseComments}
            />
            <ToggleRow
              label="Nút thích"
              checked={currentLayoutConfig.showCommentLikes && canUseCommentLikes}
              onChange={(v) => updateLayoutConfig('showCommentLikes' as keyof typeof currentLayoutConfig, v as never)}
              accentColor={brandColor}
              disabled={!canUseCommentLikes}
            />
            <ToggleRow
              label="Nút trả lời"
              checked={currentLayoutConfig.showCommentReplies && canUseCommentReplies}
              onChange={(v) => updateLayoutConfig('showCommentReplies' as keyof typeof currentLayoutConfig, v as never)}
              accentColor={brandColor}
              disabled={!canUseCommentReplies}
            />
            <ModuleFeatureStatus
              label="Module bình luận"
              enabled={commentsModule?.enabled ?? false}
              href="/system/modules/comments"
              moduleName="Module Bình luận"
            />
            <ModuleFeatureStatus
              label="Tính năng thích"
              enabled={commentsLikesFeature?.enabled ?? false}
              href="/system/modules/comments"
              moduleName="Module Bình luận"
            />
            <ModuleFeatureStatus
              label="Tính năng trả lời"
              enabled={commentsRepliesFeature?.enabled ?? false}
              href="/system/modules/comments"
              moduleName="Module Bình luận"
            />
          </ControlCard>

          <ControlCard title="Highlights">
            <div className="space-y-4">
              {renderHighlightsControls()}
              {renderLayoutSpecificControls()}
            </div>
          </ControlCard>

          {config.layoutStyle === 'premium' && (() => {
            const premiumLayoutConfig = currentLayoutConfig as PremiumLayoutConfig;
            const bannerBg = premiumLayoutConfig.premiumBannerBg ?? DEFAULT_CONFIG.layouts.premium.premiumBannerBg;
            const bannerText = premiumLayoutConfig.premiumBannerText ?? DEFAULT_CONFIG.layouts.premium.premiumBannerText;
            const bannerItems = premiumLayoutConfig.premiumBannerItems ?? DEFAULT_CONFIG.layouts.premium.premiumBannerItems;
            const showBanner = premiumLayoutConfig.showPremiumBanner ?? DEFAULT_CONFIG.layouts.premium.showPremiumBanner;
            const colorChoices = [
              { value: 'primary', label: 'Màu chính' },
              { value: 'secondary', label: 'Màu phụ' },
              { value: 'black', label: 'Đen' },
              { value: 'white', label: 'Trắng' },
            ];
            return (
              <>
                <ControlCard title="Dải cam kết (Premium)">
                  <ToggleRow
                    label="Hiện dải cam kết"
                    checked={showBanner}
                    onChange={(v) => updateLayoutConfig('showPremiumBanner' as keyof typeof currentLayoutConfig, v as never)}
                    accentColor={brandColor}
                  />
                  {showBanner && (
                    <>
                      <div className="pt-2 pb-3 mb-1 border-b border-slate-200 dark:border-slate-700 space-y-1">
                        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Phối màu dải cam kết</p>
                        <SelectRow
                          label="Màu nền"
                          value={bannerBg}
                          options={colorChoices}
                          onChange={(v) => updateLayoutConfig('premiumBannerBg' as keyof typeof currentLayoutConfig, v as never)}
                        />
                        <SelectRow
                          label="Màu chữ"
                          value={bannerText}
                          options={colorChoices}
                          onChange={(v) => updateLayoutConfig('premiumBannerText' as keyof typeof currentLayoutConfig, v as never)}
                        />
                      </div>
                      <div className="space-y-3 mt-3">
                        {bannerItems.map((item, idx) => (
                          <div key={idx} className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-slate-400">Tiêu đề #{idx + 1}</label>
                              <Input
                                value={item.title}
                                onChange={(e) => {
                                  const next = bannerItems.map((b, i) => i === idx ? { ...b, title: e.target.value } : b);
                                  updateLayoutConfig('premiumBannerItems' as keyof typeof currentLayoutConfig, next as never);
                                }}
                                className="h-7 text-xs px-2"
                                placeholder="VD: FREESHIP TOÀN QUỐC"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-400">Mô tả ngắn #{idx + 1}</label>
                              <Input
                                value={item.subtitle}
                                onChange={(e) => {
                                  const next = bannerItems.map((b, i) => i === idx ? { ...b, subtitle: e.target.value } : b);
                                  updateLayoutConfig('premiumBannerItems' as keyof typeof currentLayoutConfig, next as never);
                                }}
                                className="h-7 text-xs px-2"
                                placeholder="VD: Đơn từ 1.000.000đ"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </ControlCard>

                <ControlCard title="Dải nút CTA & Icon (Premium)">
                  <div className="space-y-4">
                    {/* Zalo Button Settings */}
                    <div className="space-y-2 pb-3 border-b border-slate-200 dark:border-slate-700">
                      <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Cấu hình nút Zalo</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400">Chữ trên nút</label>
                          <Input
                            value={premiumLayoutConfig.zaloText ?? 'MUA QUA ZALO'}
                            onChange={(e) => updateLayoutConfig('zaloText' as keyof typeof currentLayoutConfig, e.target.value as never)}
                            className="h-8 text-xs px-2"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Chọn Icon</label>
                          <IconPopoverPicker
                            value={premiumLayoutConfig.zaloIcon ?? 'Send'}
                            onChange={(v) => updateLayoutConfig('zaloIcon' as keyof typeof currentLayoutConfig, v as never)}
                            options={PREMIUM_ICON_OPTIONS}
                            brandColor={brandColor}
                            compact
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] text-slate-400">Link Zalo (Để trống để tự động lấy từ Settings hệ thống)</label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-5 text-[10px] text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded px-1.5 flex items-center gap-1"
                          onClick={() => {
                            if (!systemSettingsForSocial) {
                              toast.error('Cấu hình hệ thống chưa tải xong.');
                              return;
                            }
                            const val = (systemSettingsForSocial as any)?.contact_zalo?.trim() || '';
                            if (!val) {
                              toast.warning('Zalo hệ thống trống.');
                              return;
                            }
                            updateLayoutConfig('zaloUrl' as keyof typeof currentLayoutConfig, val as never);
                            toast.success('Đã tải Zalo cấu hình chung');
                          }}
                        >
                          Tải từ cấu hình chung
                        </Button>
                      </div>
                      <Input
                        value={premiumLayoutConfig.zaloUrl ?? ''}
                        onChange={(e) => updateLayoutConfig('zaloUrl' as keyof typeof currentLayoutConfig, e.target.value as never)}
                        placeholder="VD: 0912345678 hoặc link Zalo"
                        className="h-8 text-xs px-2"
                      />
                    </div>

                    {/* Phone Button Settings */}
                    <div className="space-y-2 pb-3 border-b border-slate-200 dark:border-slate-700">
                      <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Cấu hình nút Gọi tư vấn</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400">Chữ trên nút</label>
                          <Input
                            value={premiumLayoutConfig.phoneText ?? 'GỌI TƯ VẤN'}
                            onChange={(e) => updateLayoutConfig('phoneText' as keyof typeof currentLayoutConfig, e.target.value as never)}
                            className="h-8 text-xs px-2"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Chọn Icon</label>
                          <IconPopoverPicker
                            value={premiumLayoutConfig.phoneIcon ?? 'Phone'}
                            onChange={(v) => updateLayoutConfig('phoneIcon' as keyof typeof currentLayoutConfig, v as never)}
                            options={PREMIUM_ICON_OPTIONS}
                            brandColor={brandColor}
                            compact
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] text-slate-400">Số điện thoại (Để trống để lấy từ Settings hệ thống)</label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-5 text-[10px] text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded px-1.5 flex items-center gap-1"
                          onClick={() => {
                            if (!systemSettingsForSocial) {
                              toast.error('Cấu hình hệ thống chưa tải xong.');
                              return;
                            }
                            const val = (systemSettingsForSocial as any)?.contact_phone?.trim() || '';
                            if (!val) {
                              toast.warning('Số điện thoại hệ thống trống.');
                              return;
                            }
                            updateLayoutConfig('phoneUrl' as keyof typeof currentLayoutConfig, val as never);
                            toast.success('Đã tải SĐT cấu hình chung');
                          }}
                        >
                          Tải từ cấu hình chung
                        </Button>
                      </div>
                      <Input
                        value={premiumLayoutConfig.phoneUrl ?? ''}
                        onChange={(e) => updateLayoutConfig('phoneUrl' as keyof typeof currentLayoutConfig, e.target.value as never)}
                        placeholder="VD: 0912345678"
                        className="h-8 text-xs px-2"
                      />
                    </div>

                    {/* Font Size & Price Box Icons Settings */}
                    <div className="space-y-2 pt-1">
                      <SelectRow
                        label="Cỡ chữ nút trên mobile"
                        value={premiumLayoutConfig.mobileFontSize ?? 'xs'}
                        options={[
                          { value: 'xs', label: 'Cực nhỏ (xs)' },
                          { value: 'sm', label: 'Nhỏ (sm)' },
                          { value: 'base', label: 'Mặc định (base)' },
                        ]}
                        onChange={(v) => updateLayoutConfig('mobileFontSize' as keyof typeof currentLayoutConfig, v as never)}
                      />

                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
                        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Cấu hình Icon nền giá</p>

                        <div className="grid grid-cols-2 gap-2">
                          <ToggleRow
                            label="Hiện Icon Phải"
                            checked={premiumLayoutConfig.showPriceRightIcon ?? true}
                            onChange={(v) => updateLayoutConfig('showPriceRightIcon' as keyof typeof currentLayoutConfig, v as never)}
                            accentColor={brandColor}
                          />
                          {premiumLayoutConfig.showPriceRightIcon !== false && (
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1">Icon Phải (Mặc định Hộp quà)</label>
                              <IconPopoverPicker
                                value={premiumLayoutConfig.priceRightIcon ?? 'Gift'}
                                onChange={(v) => updateLayoutConfig('priceRightIcon' as keyof typeof currentLayoutConfig, v as never)}
                                options={PREMIUM_ICON_OPTIONS}
                                brandColor={brandColor}
                                compact
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
                        <SelectRow
                          label="Độ bo góc"
                          value={premiumLayoutConfig.cornerRadius ?? 'lg'}
                          options={[
                            { value: 'lg', label: 'Nhiều (Mặc định)' },
                            { value: 'sm', label: 'Ít (1/2)' },
                            { value: 'none', label: 'Không bo' },
                          ]}
                          onChange={(v) => updateLayoutConfig('cornerRadius' as keyof typeof currentLayoutConfig, v as never)}
                        />
                      </div>
                    </div>
                  </div>
                </ControlCard>
              </>
            );
          })()}



          {isCombosEnabled && (
            <ControlCard title="Hiệu ứng Combo">
              <SelectRow
                label="Kiểu hiệu ứng"
                value={config.comboAnimateType || 'none'}
                options={[
                  { value: 'none', label: 'Không có hiệu ứng' },
                  { value: 'luxury-sheen', label: 'Sang trọng (Luxury Sheen)' },
                  { value: 'typing', label: 'Đánh chữ' },
                  { value: 'letter-wave', label: 'Chữ nhảy tuần tự' },
                  { value: 'fire', label: 'Ngọn lửa cháy' },
                  { value: 'sparkle', label: 'Chữ lấp lánh' },
                  { value: 'text-highlight', label: 'Chữ ánh kim nhẹ' },
                  { value: 'border-rainbow', label: 'Viền ánh sáng nhẹ' },
                ]}
                onChange={(value) => setConfig(prev => ({ ...prev, comboAnimateType: value as ComboAnimateType }))}
              />
              {config.comboAnimateType !== 'none' && (
                <SelectRow
                  label="Màu hiệu ứng"
                  value={config.comboEffectColor ?? DEFAULT_CONFIG.comboEffectColor ?? 'gradient-1'}
                  options={[
                    { value: 'black', label: 'Đen' },
                    { value: 'white', label: 'Trắng' },
                    { value: 'red', label: 'Đỏ' },
                    { value: 'primary', label: 'Màu chính' },
                    { value: 'secondary', label: 'Màu phụ' },
                    { value: 'gradient-1', label: 'Gradient kiểu 1' },
                    { value: 'gradient-2', label: 'Gradient kiểu 2' },
                    { value: 'gradient-3', label: 'Gradient kiểu 3' },
                  ]}
                  onChange={(value) => setConfig(prev => ({ ...prev, comboEffectColor: value as ComboEffectColor }))}
                />
              )}
            </ControlCard>
          )}

          <ControlCard title="Nút mạng xã hội">
            {renderSocialButtonsControls()}
          </ControlCard>

          <ControlCard title="Sản phẩm liên quan">
            <SelectRow
              label="Kiểu hiển thị"
              value={config.relatedProductsMode}
              options={[
                { value: 'fixed', label: '4 sản phẩm' },
                { value: 'infiniteScroll', label: 'Tất cả + cuộn vô hạn' },
                { value: 'pagination', label: 'Phân trang' },
              ]}
              onChange={(value) => setConfig(prev => ({ ...prev, relatedProductsMode: value as RelatedProductsMode }))}
            />
            {config.relatedProductsMode !== 'fixed' && (
              <div className="mt-3">
                <label className="text-xs font-medium text-slate-600">Số lượng mỗi lần tải</label>
                <Input
                  type="number"
                  min={1}
                  value={config.relatedProductsPerPage}
                  onChange={(event) => setConfig(prev => ({
                    ...prev,
                    relatedProductsPerPage: Number(event.target.value) || DEFAULT_CONFIG.relatedProductsPerPage,
                  }))}
                  className="mt-2 h-8 text-xs"
                />
              </div>
            )}
          </ControlCard>

          <ControlCard title="Module liên quan">
            {(!commentsModule?.enabled || !wishlistModule?.enabled || !cartModule?.enabled) && (
              <div className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg text-xs text-amber-700 dark:text-amber-300 mb-2">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                <span>Một số module chưa bật.</span>
              </div>
            )}
            <ExperienceModuleLink
              enabled={commentsModule?.enabled ?? false}
              href="/system/modules/comments"
              icon={MessageSquare}
              title="Bình luận & đánh giá"
              colorScheme="cyan"
            />
            <ExperienceModuleLink
              enabled={wishlistModule?.enabled ?? false}
              href="/system/modules/wishlist"
              icon={Heart}
              title="Sản phẩm yêu thích"
              colorScheme="cyan"
            />
            <ExperienceModuleLink
              enabled={cartModule?.enabled ?? false}
              href="/system/modules/cart"
              icon={ShoppingCart}
              title="Giỏ hàng"
              colorScheme="cyan"
            />
            <ExperienceModuleLink
              enabled={ordersModule?.enabled ?? false}
              href="/system/modules/orders"
              icon={Package}
              title="Đơn hàng"
              colorScheme="cyan"
            />
          </ControlCard>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Link & ghi chú</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-2">
            {exampleProductSlug && (
              <div className="mb-2">
                <ExampleLinks
                  links={[{ label: 'Xem sản phẩm mẫu', url: `/products/${exampleProductSlug}` }]}
                  color={brandColor}
                  compact
                />
              </div>
            )}
            <ExperienceHintCard hints={HINTS} />
          </Card>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye size={18} /> Preview
            </CardTitle>
            <div className="flex items-center gap-3">
              <LayoutTabs
                layouts={LAYOUT_STYLES}
                activeLayout={config.layoutStyle}
                onChange={(layout) => setConfig(prev => ({ ...prev, layoutStyle: layout }))}
                accentColor={brandColor}
              />
              <DeviceToggle value={previewDevice} onChange={setPreviewDevice} size="sm" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`mx-auto transition-all duration-300 ${deviceWidths[previewDevice]}`}>
            <BrowserFrame url={`yoursite.com/products/${exampleProductSlug || 'example-product'}`}>
              <ProductDetailPreview {...getPreviewProps()} />
            </BrowserFrame>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Style: <strong className="text-slate-700 dark:text-slate-300">{LAYOUT_STYLES.find(s => s.id === config.layoutStyle)?.label}</strong>
            {' • '}{previewDevice === 'desktop' && 'Desktop (1920px)'}{previewDevice === 'tablet' && 'Tablet (768px)'}{previewDevice === 'mobile' && 'Mobile (375px)'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



