import { DollarSign, Clock, Star, Briefcase, FileText, Code } from 'lucide-react';
import { defineModuleWithRuntime } from '../define-module';
 
export const servicesModule = defineModuleWithRuntime({
   key: 'services',
  name: 'Dịch vụ',
   description: 'Cấu hình dịch vụ và danh mục',
   icon: Briefcase,
  color: 'emerald',
  categoryModuleKey: 'serviceCategories',

   features: [
     { key: 'enablePrice', label: 'Hiển thị giá', icon: DollarSign, linkedField: 'price' },
     { key: 'enableDuration', label: 'Thời gian', icon: Clock, linkedField: 'duration' },
     { key: 'enableFeatured', label: 'Nổi bật', icon: Star, linkedField: 'featured', enabled: false },
     { key: 'enableMarkdownRender', label: 'Markdown render', icon: FileText, linkedField: 'markdownRender', enabled: false },
     { key: 'enableHtmlRender', label: 'HTML render', icon: Code, linkedField: 'htmlRender', enabled: false },
   ],

   settings: [
    { key: 'servicesPerPage', label: 'Số dịch vụ / trang', type: 'number', default: 10 },
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
      default: 'contact',
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
   ],

   conventionNote: 'Slug tự động từ tiêu đề. Trường order và active bắt buộc theo Rails convention.',

  runtimeConfig: {
    fields: [
      { enabled: true, fieldKey: 'title', isSystem: true, name: 'Tiêu đề', order: 0, required: true, type: 'text' },
      { enabled: true, fieldKey: 'slug', isSystem: true, name: 'Slug', order: 1, required: true, type: 'text' },
      { enabled: true, fieldKey: 'content', isSystem: true, name: 'Nội dung', order: 2, required: true, type: 'richtext' },
      { enabled: true, fieldKey: 'order', isSystem: true, name: 'Thứ tự', order: 3, required: true, type: 'number' },
      { enabled: true, fieldKey: 'status', isSystem: true, name: 'Trạng thái', order: 4, required: true, type: 'select' },
      { enabled: false, fieldKey: 'excerpt', isSystem: false, name: 'Mô tả ngắn', order: 5, required: false, type: 'textarea' },
      { enabled: true, fieldKey: 'thumbnail', isSystem: false, name: 'Ảnh đại diện', order: 6, required: false, type: 'image' },
      { enabled: true, fieldKey: 'categoryId', isSystem: true, name: 'Danh mục', order: 7, required: true, type: 'select' },
      { enabled: true, fieldKey: 'price', isSystem: false, linkedFeature: 'enablePrice', name: 'Giá dịch vụ', order: 8, required: false, type: 'price' },
      { enabled: true, fieldKey: 'duration', isSystem: false, linkedFeature: 'enableDuration', name: 'Thời gian', order: 9, required: false, type: 'text' },
      { enabled: false, fieldKey: 'featured', isSystem: false, linkedFeature: 'enableFeatured', name: 'Nổi bật', order: 10, required: false, type: 'boolean' },
      { enabled: true, fieldKey: 'metaTitle', group: 'seo', isSystem: false, name: 'Meta Title', order: 11, required: false, type: 'text' },
      { enabled: true, fieldKey: 'metaDescription', group: 'seo', isSystem: false, name: 'Meta Description', order: 12, required: false, type: 'textarea' },
      { enabled: true, fieldKey: 'renderType', isSystem: false, name: 'Kiểu render', order: 13, required: false, type: 'select' },
      { enabled: false, fieldKey: 'markdownRender', isSystem: false, linkedFeature: 'enableMarkdownRender', name: 'Markdown render', order: 14, required: false, type: 'textarea' },
      { enabled: false, fieldKey: 'htmlRender', isSystem: false, linkedFeature: 'enableHtmlRender', name: 'HTML render', order: 15, required: false, type: 'textarea' },
      { enabled: true, fieldKey: 'bookingEnabled', group: 'booking', isSystem: false, name: 'Cho phép đặt lịch', order: 16, required: false, type: 'boolean' },
      { enabled: true, fieldKey: 'bookingDurationMin', group: 'booking', isSystem: false, name: 'Thời lượng (phút)', order: 17, required: false, type: 'number' },
      { enabled: true, fieldKey: 'bookingSlotIntervalMin', group: 'booking', isSystem: false, name: 'Khoảng cách slot (phút)', order: 18, required: false, type: 'number' },
      { enabled: true, fieldKey: 'bookingCapacityPerSlot', group: 'booking', isSystem: false, name: 'Sức chứa / slot', order: 19, required: false, type: 'number' },
    ],
  },

  tabs: ['config'],
});
