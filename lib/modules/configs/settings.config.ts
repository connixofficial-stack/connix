import { FileImage, Frame, Globe, LayoutTemplate, Mail, MapPin, Settings, Share2, Sparkles, Type } from 'lucide-react';
import { defineModuleWithRuntime } from '../define-module';
 
export const settingsModule = defineModuleWithRuntime({
   key: 'settings',
   name: 'Cài đặt hệ thống',
   description: 'Cấu hình thông tin website, liên hệ, SEO, mạng xã hội',
   icon: Settings,
   color: 'orange',
 
   features: [
     { key: 'enableContact', label: 'Thông tin liên hệ', icon: MapPin },
     { key: 'enableSEO', label: 'SEO cơ bản', icon: Globe },
     { key: 'enableSocial', label: 'Mạng xã hội', icon: Share2 },
     { key: 'enableProductImageAdvanced', label: 'Ảnh sản phẩm', description: 'Bật tab Ảnh sản phẩm trong Admin > Cài đặt nâng cao', icon: FileImage, enabled: true },
     { key: 'enableProductFrameAdvanced', label: 'Khung viền sản phẩm', description: 'Bật tab Khung viền sản phẩm trong Admin > Cài đặt nâng cao', icon: Frame, enabled: true },
     { key: 'enableProductWatermarkAdvanced', label: 'Watermark', description: 'Bật tab Watermark trong Admin > Cài đặt nâng cao', icon: Type, enabled: true },
     { key: 'enableMail', label: 'Cấu hình email', description: 'Bật tab Cấu hình email trong Admin > Cài đặt nâng cao', icon: Mail },
     { key: 'enableHeaderMenuAdvanced', label: 'Header', description: 'Bật tab Header trong Admin > Cài đặt nâng cao', icon: LayoutTemplate, enabled: true },
     { key: 'enableProductSupplementalAdvanced', label: 'Nội dung mô tả SP', description: 'Bật tab Nội dung mô tả SP trong Admin > Cài đặt nâng cao', icon: Type, enabled: true },
     { key: 'enableShopConfigAdvanced', label: 'Cấu hình cửa hàng', description: 'Bật tab Cấu hình cửa hàng trong Admin > Cài đặt nâng cao', icon: Settings, enabled: true },
     { key: 'enableTrustPages', label: 'Trang tin cậy', icon: Globe },
     { key: 'enableTrustPagesAutoGenerate', label: 'Tự sinh Trust Pages', icon: Sparkles },
   ],
 
  settings: [
    {
      key: 'site_brand_mode',
      label: 'Chế độ màu thương hiệu',
      type: 'select',
      default: 'dual',
      options: [
        { label: '1 màu (Primary)', value: 'single' },
        { label: '2 màu (Primary + Secondary)', value: 'dual' },
      ],
    },
    { key: 'cacheDuration', label: 'Cache duration (s)', type: 'number', default: 3600 },
  ],
 
   conventionNote: 'Settings lưu dạng key-value với group. Module này là isCore: true - không thể tắt.',
 
  runtimeConfig: {
    fields: [
      { enabled: true, fieldKey: 'site_name', group: 'site', isSystem: true, name: 'Tên website', order: 0, required: true, type: 'text' },
      { enabled: true, fieldKey: 'site_tagline', group: 'site', isSystem: false, name: 'Slogan', order: 1, required: false, type: 'text' },
      { enabled: true, fieldKey: 'site_url', group: 'site', isSystem: true, name: 'URL Website', order: 2, required: false, type: 'text' },
      { enabled: true, fieldKey: 'site_logo', group: 'site', isSystem: true, name: 'Logo', order: 3, required: false, type: 'image' },
      { enabled: true, fieldKey: 'site_favicon', group: 'site', isSystem: true, name: 'Favicon', order: 4, required: false, type: 'image' },
      { enabled: true, fieldKey: 'site_timezone', group: 'site', isSystem: false, name: 'Múi giờ', order: 5, required: false, type: 'select' },
      { enabled: true, fieldKey: 'site_language', group: 'site', isSystem: false, name: 'Ngôn ngữ', order: 6, required: false, type: 'select' },
      { enabled: true, fieldKey: 'site_brand_primary', group: 'site', isSystem: false, name: 'Màu thương hiệu (chính)', order: 7, required: false, type: 'color' },
      { enabled: true, fieldKey: 'site_brand_secondary', group: 'site', isSystem: false, name: 'Màu thương hiệu (phụ)', order: 8, required: false, type: 'color' },
      { enabled: true, fieldKey: 'contact_email', group: 'contact', linkedFeature: 'enableContact', isSystem: false, name: 'Email', order: 6, required: false, type: 'email' },
      { enabled: true, fieldKey: 'contact_phone', group: 'contact', linkedFeature: 'enableContact', isSystem: false, name: 'Số điện thoại', order: 7, required: false, type: 'phone' },
      { enabled: true, fieldKey: 'contact_address', group: 'contact', linkedFeature: 'enableContact', isSystem: false, name: 'Địa chỉ', order: 8, required: false, type: 'textarea' },
      { enabled: true, fieldKey: 'contact_tax_id', group: 'contact', linkedFeature: 'enableContact', isSystem: false, name: 'Mã số thuế', order: 9, required: false, type: 'text' },
      { enabled: true, fieldKey: 'contact_zalo', group: 'contact', linkedFeature: 'enableContact', isSystem: false, name: 'Zalo', order: 10, required: false, type: 'text' },
      { enabled: true, fieldKey: 'contact_messenger', group: 'contact', linkedFeature: 'enableContact', isSystem: false, name: 'Facebook Messenger', order: 11, required: false, type: 'text' },
      { enabled: true, fieldKey: 'seo_title', group: 'seo', linkedFeature: 'enableSEO', isSystem: false, name: 'Meta Title', order: 10, required: false, type: 'text' },
      { enabled: true, fieldKey: 'seo_description', group: 'seo', linkedFeature: 'enableSEO', isSystem: false, name: 'Meta Description', order: 11, required: false, type: 'textarea' },
      { enabled: true, fieldKey: 'seo_keywords', group: 'seo', linkedFeature: 'enableSEO', isSystem: false, name: 'Keywords', order: 12, required: false, type: 'tags' },
      { enabled: true, fieldKey: 'seo_og_image', group: 'seo', linkedFeature: 'enableSEO', isSystem: false, name: 'OG Image', order: 13, required: false, type: 'image' },
      { enabled: true, fieldKey: 'seo_google_verification', group: 'seo', linkedFeature: 'enableSEO', isSystem: false, name: 'Google Verification', order: 14, required: false, type: 'text' },
      { enabled: true, fieldKey: 'seo_bing_verification', group: 'seo', linkedFeature: 'enableSEO', isSystem: false, name: 'Bing Verification', order: 15, required: false, type: 'text' },
      { enabled: true, fieldKey: 'product_image_placeholder', group: 'advanced', isSystem: false, name: 'Ảnh placeholder sản phẩm', order: 20, required: false, type: 'image' },
      { enabled: true, fieldKey: 'social_facebook', group: 'social', linkedFeature: 'enableSocial', isSystem: false, name: 'Facebook', order: 16, required: false, type: 'text' },
      { enabled: true, fieldKey: 'social_instagram', group: 'social', linkedFeature: 'enableSocial', isSystem: false, name: 'Instagram', order: 17, required: false, type: 'text' },
      { enabled: true, fieldKey: 'social_youtube', group: 'social', linkedFeature: 'enableSocial', isSystem: false, name: 'Youtube', order: 18, required: false, type: 'text' },
      { enabled: false, fieldKey: 'social_tiktok', group: 'social', linkedFeature: 'enableSocial', isSystem: false, name: 'TikTok', order: 19, required: false, type: 'text' },
      { enabled: true, fieldKey: 'social_pinterest', group: 'social', linkedFeature: 'enableSocial', isSystem: false, name: 'Pinterest', order: 20, required: false, type: 'text' },
      { enabled: true, fieldKey: 'social_twitter', group: 'social', linkedFeature: 'enableSocial', isSystem: false, name: 'X (Twitter)', order: 21, required: false, type: 'text' },
    ],
  },

  tabs: ['config'],
 });
