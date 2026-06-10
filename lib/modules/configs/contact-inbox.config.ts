import { Inbox, Send, LayoutDashboard } from 'lucide-react';
import { defineModuleWithRuntime } from '../define-module';

export const contactInboxModule = defineModuleWithRuntime({
  key: 'contactInbox',
  name: 'Tin nhắn liên hệ',
  description: 'Lưu trữ và quản lý tin nhắn khách gửi từ form liên hệ',
  icon: Inbox,
  color: 'cyan',

  features: [
    { key: 'enableContactFormSubmission', label: 'Cho phép gửi form liên hệ', icon: Send },
    { key: 'enableContactInboxAdmin', label: 'Quản trị tin nhắn liên hệ', icon: Inbox },
    { key: 'enableContactDashboardWidget', label: 'Widget dashboard', icon: LayoutDashboard },
  ],

  settings: [
    { key: 'requireEmail', label: 'Bắt buộc Email', type: 'toggle', default: false },
    { key: 'requirePhone', label: 'Bắt buộc Số điện thoại', type: 'toggle', default: false },
    { key: 'inboxRetentionDays', label: 'Số ngày lưu trữ (0 = không giới hạn)', type: 'number', default: 0 },
  ],

  conventionNote: 'Lưu tin nhắn khách gửi từ form liên hệ. Bật/tắt form và widget qua feature flags.',

  runtimeConfig: {
    fields: [],
  },

  tabs: ['config'],
});
