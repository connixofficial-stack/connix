import { BadgeDollarSign, Code, FileText, Filter, Images, Star } from 'lucide-react';
import { defineModuleWithRuntime } from '../define-module';

export const resourcesModule = defineModuleWithRuntime({
  key: 'resources',
  name: 'Tài nguyên',
  description: 'Cấu hình thư viện tài nguyên, link tải và quyền truy cập',
  icon: FileText,
  color: 'cyan',
  categoryModuleKey: 'resourceCategories',

  features: [
    { key: 'enablePricing', label: 'Giá tài nguyên', icon: BadgeDollarSign, linkedField: 'priceAmount' },
    { key: 'enableGallery', label: 'Gallery ảnh', icon: Images, linkedField: 'images', enabled: true },
    { key: 'enableFeatured', label: 'Nổi bật', icon: Star, linkedField: 'featured', enabled: false },
    { key: 'enableResourceFilters', label: 'Bộ lọc tài nguyên', icon: Filter, enabled: false },
    { key: 'enableMarkdownRender', label: 'Nội dung Markdown', icon: FileText, linkedField: 'markdownRender', enabled: false },
    { key: 'enableHtmlRender', label: 'Nội dung HTML', icon: Code, linkedField: 'htmlRender', enabled: false },
  ],

  settings: [
    { key: 'resourcesPerPage', label: 'Số tài nguyên / trang', type: 'number', default: 10 },
    {
      key: 'enableMultipleCategories',
      label: 'Cho phép nhiều danh mục',
      type: 'toggle',
      default: false,
    },
    {
      key: 'commerceMode',
      label: 'Chế độ thương mại',
      type: 'select',
      default: 'cart',
      options: [
        { value: 'cart', label: 'Giỏ hàng & thanh toán' },
        { value: 'contact', label: 'Nút liên hệ (/contact)' },
      ],
    },
    {
      key: 'defaultStatus',
      label: 'Trạng thái mặc định',
      type: 'select',
      default: 'draft',
      options: [
        { value: 'draft', label: 'Bản nháp' },
        { value: 'published', label: 'Xuất bản' },
      ],
    },
    {
      key: 'defaultPricingType',
      label: 'Kiểu giá mặc định',
      type: 'select',
      default: 'free',
      options: [
        { value: 'free', label: 'Miễn phí' },
        { value: 'paid', label: 'Trả phí' },
        { value: 'contact', label: 'Liên hệ' },
      ],
    },
  ],

  conventionNote: 'Link tải Google Drive chỉ được trả về qua thao tác tải sau khi kiểm tra đăng nhập/quyền mua.',

  runtimeConfig: {
    fields: [
      { enabled: true, fieldKey: 'title', isSystem: true, name: 'Tiêu đề', order: 0, required: true, type: 'text' },
      { enabled: true, fieldKey: 'slug', isSystem: true, name: 'Slug', order: 1, required: true, type: 'text' },
      { enabled: true, fieldKey: 'content', isSystem: true, name: 'Nội dung', order: 2, required: true, type: 'richtext' },
      { enabled: true, fieldKey: 'downloadUrl', isSystem: true, name: 'Link tải Google Drive', order: 3, required: true, type: 'text' },
      { enabled: true, fieldKey: 'order', isSystem: true, name: 'Thứ tự', order: 4, required: true, type: 'number' },
      { enabled: true, fieldKey: 'status', isSystem: true, name: 'Trạng thái', order: 5, required: true, type: 'select' },
      { enabled: true, fieldKey: 'excerpt', isSystem: false, name: 'Mô tả ngắn', order: 6, required: false, type: 'textarea' },
      { enabled: true, fieldKey: 'thumbnail', isSystem: false, name: 'Ảnh đại diện', order: 7, required: false, type: 'image' },
      { enabled: true, fieldKey: 'images', isSystem: false, linkedFeature: 'enableGallery', name: 'Gallery ảnh', order: 8, required: false, type: 'image' },
      { enabled: true, fieldKey: 'categoryId', isSystem: true, name: 'Danh mục', order: 9, required: true, type: 'select' },
      { enabled: true, fieldKey: 'pricingType', isSystem: false, linkedFeature: 'enablePricing', name: 'Kiểu giá', order: 10, required: true, type: 'select' },
      { enabled: true, fieldKey: 'priceAmount', isSystem: false, linkedFeature: 'enablePricing', name: 'Giá bán', order: 11, required: false, type: 'price' },
      { enabled: true, fieldKey: 'comparePriceAmount', isSystem: false, linkedFeature: 'enablePricing', name: 'Giá gốc', order: 12, required: false, type: 'price' },
      { enabled: true, fieldKey: 'priceNote', isSystem: false, linkedFeature: 'enablePricing', name: 'Ghi chú giá', order: 13, required: false, type: 'text' },
      { enabled: false, fieldKey: 'featured', isSystem: false, linkedFeature: 'enableFeatured', name: 'Nổi bật', order: 14, required: false, type: 'boolean' },
      { enabled: true, fieldKey: 'metaTitle', group: 'seo', isSystem: false, name: 'Tiêu đề SEO', order: 15, required: false, type: 'text' },
      { enabled: true, fieldKey: 'metaDescription', group: 'seo', isSystem: false, name: 'Mô tả SEO', order: 16, required: false, type: 'textarea' },
      { enabled: true, fieldKey: 'renderType', isSystem: false, name: 'Kiểu nội dung', order: 17, required: false, type: 'select' },
      { enabled: false, fieldKey: 'markdownRender', isSystem: false, linkedFeature: 'enableMarkdownRender', name: 'Nội dung Markdown', order: 18, required: false, type: 'textarea' },
      { enabled: false, fieldKey: 'htmlRender', isSystem: false, linkedFeature: 'enableHtmlRender', name: 'Nội dung HTML', order: 19, required: false, type: 'textarea' },
    ],
  },

  tabs: ['config'],
});
