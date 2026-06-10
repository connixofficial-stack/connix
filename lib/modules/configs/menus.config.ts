import { Menu, FolderTree, ExternalLink } from 'lucide-react';
import { defineModuleWithRuntime } from '../define-module';
 
export const menusModule = defineModuleWithRuntime({
   key: 'menus',
   name: 'Menu',
   description: 'Quản lý menu điều hướng',
   icon: Menu,
   color: 'cyan',
   
   features: [
     { key: 'enableNested', label: 'Menu lồng nhau', icon: FolderTree, linkedField: 'parentId', description: 'Cho phép tạo menu con nhiều cấp' },
     { key: 'enableNewTab', label: 'Mở tab mới', icon: ExternalLink, linkedField: 'openInNewTab', description: 'Cho phép mở link trong tab mới' },
     { key: 'enableIcon', label: 'Icon menu', icon: Menu, linkedField: 'icon', description: 'Cho phép gán icon cho menu item' },
   ],
   
   settings: [
     {
       key: 'maxDepth',
       label: 'Độ sâu tối đa',
       type: 'select',
       default: '3',
       options: [
         { value: '1', label: '1 tầng' },
         { value: '2', label: '2 tầng' },
         { value: '3', label: '3 tầng' },
         { value: '4', label: '4 tầng' },
         { value: '5', label: '5 tầng' },
       ],
     },
     { 
       key: 'defaultLocation', 
       label: 'Vị trí mặc định', 
       type: 'select',
       default: 'header',
       options: [
         { value: 'header', label: 'Header' },
         { value: 'footer', label: 'Footer' },
         { value: 'sidebar', label: 'Sidebar' },
       ],
     },
   ],
   
   conventionNote: 'location: header, footer, sidebar. order tự động increment. parentId null = root item.',
   
  runtimeConfig: {
    fields: [
      { enabled: true, fieldKey: 'label', isSystem: true, name: 'Tiêu đề', order: 0, required: true, type: 'text' },
      { enabled: true, fieldKey: 'url', isSystem: true, name: 'URL', order: 1, required: true, type: 'text' },
      { enabled: true, fieldKey: 'location', isSystem: true, name: 'Vị trí menu', order: 2, required: true, type: 'select' },
      { enabled: true, fieldKey: 'order', isSystem: true, name: 'Thứ tự', order: 3, required: true, type: 'number' },
      { enabled: true, fieldKey: 'active', isSystem: true, name: 'Trạng thái', order: 4, required: true, type: 'boolean' },
      { enabled: true, fieldKey: 'parentId', isSystem: false, linkedFeature: 'enableNested', name: 'Menu cha', order: 5, required: false, type: 'select' },
      { enabled: true, fieldKey: 'openInNewTab', isSystem: false, linkedFeature: 'enableNewTab', name: 'Mở tab mới', order: 6, required: false, type: 'boolean' },
      { enabled: true, fieldKey: 'icon', isSystem: false, linkedFeature: 'enableIcon', name: 'Icon', order: 7, required: false, type: 'text' },
    ],
  },

  tabs: ['config'],
 });
