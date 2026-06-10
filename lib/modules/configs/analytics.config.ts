import { BarChart3, TrendingUp, Users, Package, FileDown } from 'lucide-react';
import { defineModuleWithRuntime } from '../define-module';
 
export const analyticsModule = defineModuleWithRuntime({
   key: 'analytics',
   name: 'Báo cáo & Thống kê',
   description: 'Dashboard phân tích dữ liệu kinh doanh',
   icon: BarChart3,
   color: 'rose',
 
  features: [
    { key: 'enableSales', label: 'Báo cáo doanh thu', icon: TrendingUp, linkedField: 'revenue' },
    { key: 'enableCustomers', label: 'Báo cáo khách hàng', icon: Users, linkedField: 'newCustomers' },
    { key: 'enableProducts', label: 'Báo cáo sản phẩm', icon: Package, linkedField: 'topProducts' },
    { key: 'enableTraffic', label: 'Báo cáo lượt truy cập', icon: BarChart3, linkedField: 'pageviews', enabled: false },
    { key: 'enableExport', label: 'Xuất báo cáo', icon: FileDown, linkedField: 'exportFormat' },
  ],
 
  settings: [
     {
       key: 'defaultPeriod',
       label: 'Khoảng thời gian mặc định',
       type: 'select',
       default: '30d',
       options: [
         { value: '7d', label: '7 ngày' },
         { value: '30d', label: '30 ngày' },
         { value: '90d', label: '90 ngày' },
         { value: '1y', label: '1 năm' },
       ],
     },
    { key: 'autoRefresh', label: 'Tự động refresh', type: 'toggle', default: true },
    { key: 'refreshInterval', label: 'Refresh interval (giây)', type: 'number', default: 300 },
   ],
 
   conventionNote: 'Dữ liệu thống kê được cache và refresh định kỳ theo refreshInterval. Hỗ trợ export CSV/Excel/PDF.',
 
  runtimeConfig: {
    fields: [
      { enabled: true, fieldKey: 'dateRange', isSystem: true, name: 'Khoảng thời gian', order: 0, required: true, type: 'daterange' },
      { enabled: true, fieldKey: 'revenue', isSystem: true, linkedFeature: 'enableSales', name: 'Doanh thu', order: 1, required: false, type: 'number' },
      { enabled: true, fieldKey: 'orders', isSystem: true, linkedFeature: 'enableSales', name: 'Số đơn hàng', order: 2, required: false, type: 'number' },
      { enabled: true, fieldKey: 'avgOrderValue', isSystem: false, linkedFeature: 'enableSales', name: 'Giá trị đơn TB', order: 3, required: false, type: 'number' },
      { enabled: true, fieldKey: 'newCustomers', isSystem: true, linkedFeature: 'enableCustomers', name: 'Khách mới', order: 4, required: false, type: 'number' },
      { enabled: true, fieldKey: 'returningCustomers', isSystem: false, linkedFeature: 'enableCustomers', name: 'Khách quay lại', order: 5, required: false, type: 'number' },
      { enabled: true, fieldKey: 'topProducts', isSystem: true, linkedFeature: 'enableProducts', name: 'SP bán chạy', order: 6, required: false, type: 'json' },
      { enabled: true, fieldKey: 'lowStock', isSystem: false, linkedFeature: 'enableProducts', name: 'SP sắp hết', order: 7, required: false, type: 'json' },
      { enabled: false, fieldKey: 'pageviews', isSystem: false, linkedFeature: 'enableTraffic', name: 'Lượt xem trang', order: 8, required: false, type: 'number' },
      { enabled: false, fieldKey: 'sessions', isSystem: false, linkedFeature: 'enableTraffic', name: 'Phiên truy cập', order: 9, required: false, type: 'number' },
      { enabled: true, fieldKey: 'exportFormat', isSystem: false, linkedFeature: 'enableExport', name: 'Định dạng xuất', order: 10, required: false, type: 'select' },
    ],
  },

  tabs: ['config'],
 });
