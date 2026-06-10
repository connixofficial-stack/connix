import { Shield, FileText, Palette, GitBranch } from 'lucide-react';
import { defineModuleWithRuntime } from '../define-module';
 
export const rolesModule = defineModuleWithRuntime({
   key: 'roles',
   name: 'Vai trò',
   description: 'Quản lý vai trò và phân quyền',
   icon: Shield,
   color: 'amber',
   
  features: [
    { key: 'enableDescription', label: 'Mô tả vai trò', icon: FileText, linkedField: 'description' },
    { key: 'enableColor', label: 'Màu sắc', icon: Palette, linkedField: 'color' },
    { key: 'enableHierarchy', label: 'Phân cấp', icon: GitBranch, enabled: false },
  ],
   
  settings: [
    { key: 'maxRolesPerUser', label: 'Max roles / user', type: 'number', default: 1 },
    { key: 'defaultRole', label: 'Vai trò mặc định', type: 'text', default: 'Viewer' },
    { key: 'rolesPerPage', label: 'Số roles / trang', type: 'number', default: 10 },
  ],
   
  conventionNote: 'Role key là unique và lowercase. permissions là array string. isSystem = true không thể xóa.',
  
  runtimeConfig: {
    fields: [
      { enabled: true, fieldKey: 'name', isSystem: true, name: 'Tên vai trò', order: 0, required: true, type: 'text' },
      { enabled: true, fieldKey: 'permissions', isSystem: true, name: 'Quyền hạn', order: 1, required: true, type: 'text' },
      { enabled: true, fieldKey: 'isSystem', isSystem: true, name: 'Vai trò hệ thống', order: 2, required: true, type: 'boolean' },
      { enabled: true, fieldKey: 'description', isSystem: false, linkedFeature: 'enableDescription', name: 'Mô tả', order: 3, required: false, type: 'textarea' },
      { enabled: true, fieldKey: 'color', isSystem: false, linkedFeature: 'enableColor', name: 'Màu sắc', order: 4, required: false, type: 'text' },
      { enabled: true, fieldKey: 'isSuperAdmin', isSystem: false, name: 'Super Admin', order: 5, required: false, type: 'boolean' },
    ],
  },

  tabs: ['config'],
 });
