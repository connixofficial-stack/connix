import { Home, ImageIcon, FileText, LayoutGrid, Users, Phone } from 'lucide-react';
import { defineModuleWithRuntime } from '../define-module';
 
export const homepageModule = defineModuleWithRuntime({
   key: 'homepage',
   name: 'Trang chủ',
   description: 'Cấu hình các section trang chủ',
   icon: Home,
   color: 'orange',
   
  features: [
    { key: 'enableHero', label: 'Hero Banner', icon: ImageIcon },
    { key: 'enableAbout', label: 'Giới thiệu', icon: FileText },
    { key: 'enableProducts', label: 'Sản phẩm nổi bật', icon: LayoutGrid },
    { key: 'enablePosts', label: 'Bài viết mới', icon: FileText },
    { key: 'enablePartners', label: 'Đối tác', icon: Users, enabled: false },
    { key: 'enableContact', label: 'Liên hệ', icon: Phone },
  ],
   
   settings: [
     { key: 'maxSections', label: 'Số section tối đa', type: 'number', default: 10 },
    { key: 'enableSmartWizard', label: 'Hiện nút Tạo nhanh ở Admin', type: 'toggle', default: true },
    {
      key: 'enableLegacySnapshotQuickCreate',
      label: 'Cho phép tạo nhanh từ snapshot cũ',
      type: 'toggle',
      default: false,
      dependsOn: 'enableSmartWizard',
    },
     { 
       key: 'defaultSectionType', 
       label: 'Loại section mặc định', 
       type: 'select',
       default: 'hero',
       options: [
         { value: 'hero', label: 'Hero Banner' },
         { value: 'about', label: 'Giới thiệu' },
         { value: 'products', label: 'Sản phẩm nổi bật' },
         { value: 'posts', label: 'Bài viết mới' },
         { value: 'partners', label: 'Đối tác' },
         { value: 'contact', label: 'Liên hệ' },
       ],
     },
   ],
   
   conventionNote: 'type: hero, about, products, posts, partners, contact. config lưu JSON tùy chỉnh cho từng section.',
   
  runtimeConfig: {
    fields: [
      { enabled: true, fieldKey: 'title', isSystem: true, name: 'Tên section', order: 0, required: true, type: 'text' },
      { enabled: true, fieldKey: 'type', isSystem: true, name: 'Loại section', order: 1, required: true, type: 'select' },
      { enabled: true, fieldKey: 'order', isSystem: true, name: 'Thứ tự', order: 2, required: true, type: 'number' },
      { enabled: true, fieldKey: 'active', isSystem: true, name: 'Trạng thái', order: 3, required: true, type: 'boolean' },
      { enabled: true, fieldKey: 'config', isSystem: false, name: 'Cấu hình JSON', order: 4, required: false, type: 'textarea' },
      { enabled: true, fieldKey: 'background', isSystem: false, name: 'Ảnh nền', order: 5, required: false, type: 'image' },
    ],
  },

  tabs: ['config'],
 });
