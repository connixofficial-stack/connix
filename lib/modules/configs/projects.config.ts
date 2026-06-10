import { Briefcase, Code, FileText, Image as ImageIcon, PlayCircle, Star } from 'lucide-react';
import { defineModuleWithRuntime } from '../define-module';

export const projectsModule = defineModuleWithRuntime({
  key: 'projects',
  name: 'Dự án',
  description: 'Cấu hình dự án, danh mục, video giới thiệu và thư viện ảnh',
  icon: Briefcase,
  color: 'cyan',
  categoryModuleKey: 'projectCategories',

  features: [
    { key: 'enableFeatured', label: 'Nổi bật', icon: Star, linkedField: 'featured', enabled: false },
    { key: 'enableIntroVideo', label: 'Video giới thiệu', icon: PlayCircle, linkedField: 'introVideoUrl' },
    { key: 'enableGallery', label: 'Thư viện ảnh', icon: ImageIcon, linkedField: 'images' },
    { key: 'enableMarkdownRender', label: 'Markdown render', icon: FileText, linkedField: 'markdownRender', enabled: false },
    { key: 'enableHtmlRender', label: 'HTML render', icon: Code, linkedField: 'htmlRender', enabled: false },
  ],

  settings: [
    { key: 'projectsPerPage', label: 'Số dự án / trang', type: 'number', default: 12 },
    {
      key: 'enableMultipleCategories',
      label: 'Cho phép nhiều danh mục',
      type: 'toggle',
      default: false,
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

  conventionNote: 'Slug tự động từ tiêu đề. Danh mục chính là canonical; danh mục phụ chỉ bật khi enableMultipleCategories.',

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
      { enabled: false, fieldKey: 'featured', isSystem: false, linkedFeature: 'enableFeatured', name: 'Dự án nổi bật', order: 8, required: false, type: 'boolean' },
      { enabled: true, fieldKey: 'introVideoType', isSystem: false, linkedFeature: 'enableIntroVideo', name: 'Loại video', order: 9, required: false, type: 'select' },
      { enabled: true, fieldKey: 'introVideoUrl', isSystem: false, linkedFeature: 'enableIntroVideo', name: 'URL video', order: 10, required: false, type: 'text' },
      { enabled: true, fieldKey: 'images', isSystem: false, linkedFeature: 'enableGallery', name: 'Thư viện ảnh', order: 11, required: false, type: 'image' },
      { enabled: false, fieldKey: 'clientName', isSystem: false, name: 'Khách hàng', order: 12, required: false, type: 'text' },
      { enabled: false, fieldKey: 'projectUrl', isSystem: false, name: 'URL dự án', order: 13, required: false, type: 'text' },
      { enabled: true, fieldKey: 'metaTitle', group: 'seo', isSystem: false, name: 'Meta Title', order: 14, required: false, type: 'text' },
      { enabled: true, fieldKey: 'metaDescription', group: 'seo', isSystem: false, name: 'Meta Description', order: 15, required: false, type: 'textarea' },
      { enabled: true, fieldKey: 'renderType', isSystem: false, name: 'Kiểu render', order: 16, required: false, type: 'select' },
      { enabled: false, fieldKey: 'markdownRender', isSystem: false, linkedFeature: 'enableMarkdownRender', name: 'Markdown render', order: 17, required: false, type: 'textarea' },
      { enabled: false, fieldKey: 'htmlRender', isSystem: false, linkedFeature: 'enableHtmlRender', name: 'HTML render', order: 18, required: false, type: 'textarea' },
    ],
  },

  tabs: ['config'],
});
