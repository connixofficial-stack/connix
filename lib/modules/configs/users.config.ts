import { UserCog, ImageIcon, Phone, Clock } from 'lucide-react';
import { defineModuleWithRuntime } from '../define-module';
 
export const usersModule = defineModuleWithRuntime({
   key: 'users',
   name: 'Người dùng',
   description: 'Quản lý người dùng hệ thống',
   icon: UserCog,
   color: 'indigo',
   
   features: [
     { key: 'enableAvatar', label: 'Ảnh đại diện', icon: ImageIcon, linkedField: 'avatar' },
     { key: 'enablePhone', label: 'Số điện thoại', icon: Phone, linkedField: 'phone' },
     { key: 'enableLastLogin', label: 'Đăng nhập cuối', icon: Clock, linkedField: 'lastLogin' },
   ],
   
   settings: [
     { key: 'usersPerPage', label: 'Số user / trang', type: 'number', default: 20 },
     { key: 'sessionTimeout', label: 'Timeout (phút)', type: 'number', default: 30 },
     { key: 'maxLoginAttempts', label: 'Max login attempts', type: 'number', default: 5 },
   ],
   
   conventionNote: 'Email unique. Mỗi user gán 1 role. Password hash bcrypt. lastLogin tự động update.',

  runtimeConfig: {
    fields: [
      { enabled: true, fieldKey: 'name', isSystem: true, name: 'Họ và tên', order: 0, required: true, type: 'text' },
      { enabled: true, fieldKey: 'email', isSystem: true, name: 'Email', order: 1, required: true, type: 'email' },
      { enabled: true, fieldKey: 'roleId', isSystem: true, name: 'Vai trò', order: 2, required: true, type: 'select' },
      { enabled: true, fieldKey: 'status', isSystem: true, name: 'Trạng thái', order: 3, required: true, type: 'select' },
      { enabled: true, fieldKey: 'phone', isSystem: false, linkedFeature: 'enablePhone', name: 'Số điện thoại', order: 4, required: false, type: 'phone' },
      { enabled: true, fieldKey: 'avatar', isSystem: false, linkedFeature: 'enableAvatar', name: 'Ảnh đại diện', order: 5, required: false, type: 'image' },
      { enabled: true, fieldKey: 'lastLogin', isSystem: false, linkedFeature: 'enableLastLogin', name: 'Đăng nhập cuối', order: 6, required: false, type: 'date' },
    ],
  },

  tabs: ['config'],
 });
