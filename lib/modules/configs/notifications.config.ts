import { Bell, Mail, Clock, Users } from 'lucide-react';
import { defineModuleWithRuntime } from '../define-module';
 
export const notificationsModule = defineModuleWithRuntime({
   key: 'notifications',
   name: 'Thông báo',
   description: 'Quản lý thông báo hệ thống',
   icon: Bell,
   color: 'rose',
 
   features: [
     { key: 'enableEmail', label: 'Gửi Email', icon: Mail, linkedField: 'sendEmail' },
     { key: 'enableScheduling', label: 'Hẹn giờ gửi', icon: Clock, linkedField: 'scheduledAt' },
     { key: 'enableTargeting', label: 'Nhắm đối tượng', icon: Users, linkedField: 'targetType' },
   ],
 
  settings: [
    { key: 'itemsPerPage', label: 'Số thông báo / trang', type: 'number', default: 20 },
    { key: 'defaultType', label: 'Loại mặc định', type: 'select', default: 'info', options: [
      { value: 'info', label: 'Info' },
      { value: 'success', label: 'Success' },
      { value: 'warning', label: 'Warning' },
      { value: 'error', label: 'Error' },
    ] },
    { key: 'autoSendEmail', label: 'Tự gửi email', type: 'toggle', default: false },
  ],
 
   conventionNote: 'type: info, success, warning, error. targetType: all, customers, users, specific. status: Draft, Scheduled, Sent, Cancelled.',
 
  runtimeConfig: {
    fields: [
      { enabled: true, fieldKey: 'title', isSystem: true, name: 'Tiêu đề', order: 0, required: true, type: 'text' },
      { enabled: true, fieldKey: 'content', isSystem: true, name: 'Nội dung', order: 1, required: true, type: 'textarea' },
      { enabled: true, fieldKey: 'type', isSystem: true, name: 'Loại', order: 2, required: true, type: 'select' },
      { enabled: true, fieldKey: 'status', isSystem: true, name: 'Trạng thái', order: 3, required: true, type: 'select' },
      { enabled: true, fieldKey: 'targetType', isSystem: false, linkedFeature: 'enableTargeting', name: 'Đối tượng', order: 4, required: true, type: 'select' },
      { enabled: true, fieldKey: 'sendEmail', isSystem: false, linkedFeature: 'enableEmail', name: 'Gửi Email', order: 5, required: false, type: 'boolean' },
      { enabled: true, fieldKey: 'scheduledAt', isSystem: false, linkedFeature: 'enableScheduling', name: 'Thời gian hẹn', order: 6, required: false, type: 'date' },
    ],
  },

  tabs: ['config'],
 });
