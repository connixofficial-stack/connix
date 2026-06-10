import { Heart, Bell } from 'lucide-react';
import { defineModuleWithRuntime } from '../define-module';
 
export const wishlistModule = defineModuleWithRuntime({
   key: 'wishlist',
   name: 'Sản phẩm yêu thích',
   description: 'Cấu hình danh sách SP yêu thích của khách hàng',
   icon: Heart,
   color: 'rose',
   
   features: [
     { key: 'enableNote', label: 'Ghi chú', icon: Heart, linkedField: 'note', description: 'Cho phép khách thêm ghi chú cho SP yêu thích' },
     { key: 'enableNotification', label: 'Thông báo', icon: Bell, description: 'Thông báo khi SP giảm giá/có hàng' },
   ],
   
   settings: [
     { key: 'maxItemsPerCustomer', label: 'Max SP / khách', type: 'number', default: 50 },
     { key: 'itemsPerPage', label: 'Số mục / trang', type: 'number', default: 20 },
   ],
   
   conventionNote: 'Wishlist phụ thuộc module Sản phẩm. Mỗi cặp customerId + productId là unique.',

  runtimeConfig: {
    fields: [],
  },
   
  tabs: ['config'],
 });
