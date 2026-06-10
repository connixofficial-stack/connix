import { CalendarDays, Clock } from 'lucide-react';
import { defineModuleWithRuntime } from '../define-module';

export const bookingsModule = defineModuleWithRuntime({
  key: 'bookings',
  name: 'Đặt lịch',
  description: 'Cấu hình lịch hẹn cho admin và khách hàng',
  icon: CalendarDays,
  color: 'indigo',
  categoryModuleKey: undefined,

  features: [],

  settings: [
    {
      key: 'timezoneDefault',
      label: 'Timezone mặc định',
      type: 'select',
      default: 'Asia/Ho_Chi_Minh',
      group: 'general',
      options: [
        { value: 'Asia/Ho_Chi_Minh', label: 'Asia/Ho_Chi_Minh (GMT+7)' },
        { value: 'Asia/Bangkok', label: 'Asia/Bangkok (GMT+7)' },
        { value: 'Asia/Singapore', label: 'Asia/Singapore (GMT+8)' },
        { value: 'Asia/Tokyo', label: 'Asia/Tokyo (GMT+9)' },
        { value: 'UTC', label: 'UTC (GMT+0)' },
      ],
    },
    { key: 'bookingsPerPage', label: 'Số lịch hẹn / trang', type: 'number', default: 20, group: 'general' },
  ],

  settingGroups: [
    { key: 'general', label: 'Cài đặt chung', icon: Clock },
  ],

  runtimeConfig: {
    fields: [
      { enabled: true, fieldKey: 'serviceId', isSystem: true, name: 'Dịch vụ', order: 0, required: true, type: 'select' },
      { enabled: true, fieldKey: 'customerName', isSystem: true, name: 'Tên khách', order: 1, required: true, type: 'text' },
      { enabled: true, fieldKey: 'bookingDate', isSystem: true, name: 'Ngày đặt', order: 2, required: true, type: 'date' },
      { enabled: true, fieldKey: 'slotTime', isSystem: true, name: 'Khung giờ', order: 3, required: true, type: 'text' },
      { enabled: true, fieldKey: 'status', isSystem: true, name: 'Trạng thái', order: 4, required: true, type: 'select' },
      { enabled: true, fieldKey: 'note', isSystem: false, name: 'Ghi chú', order: 5, required: false, type: 'textarea' },
    ],
  },

  tabs: ['config'],
});
