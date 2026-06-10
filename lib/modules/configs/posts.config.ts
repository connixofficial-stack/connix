import { FileText, Tag, Star, Clock, Code } from 'lucide-react';
import { defineModuleWithRuntime } from '../define-module';
 
export const postsModule = defineModuleWithRuntime({
   key: 'posts',
  name: 'Bài viết',
   description: 'Cấu hình bài viết blog',
   icon: FileText,
   color: 'cyan',
   categoryModuleKey: 'postCategories',
   
   features: [
     { key: 'enableTags', label: 'Tags', icon: Tag, linkedField: 'tags', enabled: false },
     { key: 'enableFeatured', label: 'Nổi bật', icon: Star, linkedField: 'featured', enabled: false },
     { key: 'enableScheduling', label: 'Hẹn giờ', icon: Clock, linkedField: 'publish_date', enabled: false },
     { key: 'enableMarkdownRender', label: 'Markdown render', icon: FileText, linkedField: 'markdownRender', enabled: false },
     { key: 'enableHtmlRender', label: 'HTML render', icon: Code, linkedField: 'htmlRender', enabled: false },
   ],
   
   settings: [
     { key: 'postsPerPage', label: 'Số bài / trang', type: 'number', default: 10 },
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
     {
       key: 'enableAutoPostGenerator',
       label: 'Bật sinh bài tự động',
       type: 'toggle',
       default: false,
       group: 'generator',
     },
   ],

   settingGroups: [
     { key: 'general', label: 'Cài đặt chung' },
     { key: 'generator', label: 'Auto Generator' },
   ],
   
   conventionNote: 'Slug tự động từ tiêu đề. Trường order và active bắt buộc.',

  runtimeConfig: {
    fields: [
      { enabled: true, fieldKey: 'title', isSystem: true, name: 'Tiêu đề', order: 0, required: true, type: 'text' },
      { enabled: true, fieldKey: 'content', isSystem: true, name: 'Nội dung', order: 1, required: true, type: 'richtext' },
      { enabled: true, fieldKey: 'order', isSystem: true, name: 'Thứ tự', order: 2, required: true, type: 'number' },
      { enabled: true, fieldKey: 'active', isSystem: true, name: 'Trạng thái', order: 3, required: true, type: 'boolean' },
      { enabled: false, fieldKey: 'excerpt', isSystem: false, name: 'Mô tả ngắn', order: 4, required: false, type: 'textarea' },
      { enabled: true, fieldKey: 'thumbnail', isSystem: false, name: 'Ảnh đại diện', order: 5, required: false, type: 'image' },
      { enabled: true, fieldKey: 'category_id', isSystem: false, name: 'Danh mục', order: 6, required: false, type: 'select' },
      { enabled: false, fieldKey: 'author_name', isSystem: false, name: 'Tác giả', order: 7, required: false, type: 'text' },
      { enabled: false, fieldKey: 'tags', isSystem: false, linkedFeature: 'enableTags', name: 'Tags', order: 8, required: false, type: 'tags' },
      { enabled: false, fieldKey: 'featured', isSystem: false, linkedFeature: 'enableFeatured', name: 'Nổi bật', order: 9, required: false, type: 'boolean' },
      { enabled: false, fieldKey: 'publish_date', isSystem: false, linkedFeature: 'enableScheduling', name: 'Ngày xuất bản', order: 10, required: false, type: 'date' },
      { enabled: true, fieldKey: 'metaTitle', group: 'seo', isSystem: false, name: 'Meta Title', order: 11, required: false, type: 'text' },
      { enabled: true, fieldKey: 'metaDescription', group: 'seo', isSystem: false, name: 'Meta Description', order: 12, required: false, type: 'textarea' },
      { enabled: true, fieldKey: 'renderType', isSystem: false, name: 'Kiểu render', order: 13, required: false, type: 'select' },
      { enabled: false, fieldKey: 'markdownRender', isSystem: false, linkedFeature: 'enableMarkdownRender', name: 'Markdown render', order: 14, required: false, type: 'textarea' },
      { enabled: false, fieldKey: 'htmlRender', isSystem: false, linkedFeature: 'enableHtmlRender', name: 'HTML render', order: 15, required: false, type: 'textarea' },
    ],
  },
   
  tabs: ['config'],
 });
