import { Clock, ShoppingCart, StickyNote } from 'lucide-react';
import { defineModuleWithRuntime } from '../define-module';

export const cartModule = defineModuleWithRuntime({
  key: 'cart',
  name: 'Giỏ hàng',
  description: 'Cấu hình chức năng giỏ hàng cho khách hàng vãng lai và thành viên',
  icon: ShoppingCart,
  color: 'emerald',

  features: [
    { key: 'enableExpiry', label: 'Hết hạn giỏ hàng', icon: Clock, linkedField: 'expiresAt' },
    { key: 'enableNote', label: 'Ghi chú', icon: StickyNote, linkedField: 'note' },
  ],

  settings: [
    { key: 'cartsPerPage', label: 'Số giỏ hàng / trang', type: 'number', default: 20 },
    { key: 'expiryDays', label: 'Hết hạn sau (ngày)', type: 'number', default: 7 },
    { key: 'maxItemsPerCart', label: 'Tối đa SP / giỏ', type: 'number', default: 50 },
  ],

  conventionNote: 'Giỏ hàng phụ thuộc module Sản phẩm. Hỗ trợ khách vãng lai và thành viên (tự động gộp giỏ hàng sau khi đăng nhập). Giá lưu tại thời điểm thêm vào giỏ. Trạng thái: Active, Converted, Abandoned.',

  runtimeConfig: {
    fields: [],
  },

  tabs: ['config'],
});
