import { CalendarDays } from 'lucide-react';
import { defineModuleWithRuntime } from '../define-module';

export const subscriptionsModule = defineModuleWithRuntime({
  key: 'subscriptions',
  name: 'Subscriptions',
  description: 'Quản lý gia hạn subscription khách hàng',
  icon: CalendarDays,
  color: 'blue',

  settings: [
    {
      key: 'subscriptionsPerPage',
      label: 'Số dòng mỗi trang',
      type: 'number',
      default: 20,
    },
    {
      key: 'defaultStatus',
      label: 'Trạng thái mặc định',
      type: 'select',
      default: 'Todo',
      options: [
        { value: 'Todo', label: 'Chưa nhắc' },
        { value: 'Contacted', label: 'Đã liên hệ' },
        { value: 'Churned', label: 'Không gia hạn' },
      ],
    },
    {
      key: 'warningDays',
      label: 'Cảnh báo sớm (ngày)',
      type: 'number',
      default: 7,
    },
  ],

  conventionNote: 'Tối ưu quy trình nhắc gia hạn khách hàng.',

  runtimeConfig: {
    fields: [
      { enabled: true, fieldKey: 'title', isSystem: true, name: 'Tiêu đề', order: 0, required: true, type: 'text' },
      { enabled: true, fieldKey: 'status', isSystem: true, name: 'Trạng thái', order: 1, required: true, type: 'select' },
      { enabled: true, fieldKey: 'dueDate', isSystem: false, name: 'Ngày nhắc', order: 2, required: true, type: 'date' },
      { enabled: true, fieldKey: 'customerId', isSystem: false, linkedFeature: 'enableCustomerLink', name: 'Khách hàng', order: 3, required: true, type: 'select' },
      { enabled: true, fieldKey: 'productId', isSystem: false, linkedFeature: 'enableProductLink', name: 'Sản phẩm', order: 4, required: true, type: 'select' },
    ],
  },

  tabs: ['config'],
});
