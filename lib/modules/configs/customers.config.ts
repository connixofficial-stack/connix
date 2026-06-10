import { Users, KeyRound, MapPin, ImageIcon, StickyNote } from 'lucide-react';
import { defineModuleWithRuntime } from '../define-module';
 
export const customersModule = defineModuleWithRuntime({
   key: 'customers',
   name: 'Khách hàng',
   description: 'Quản lý thông tin khách hàng',
   icon: Users,
   color: 'violet',
   
   features: [
     { key: 'enableLogin', label: 'Đăng nhập KH', icon: KeyRound, linkedField: 'password' },
     { key: 'enableAddresses', label: 'Sổ địa chỉ', icon: MapPin, linkedField: 'addresses' },
     { key: 'enableAvatar', label: 'Ảnh đại diện', icon: ImageIcon, linkedField: 'avatar' },
     { key: 'enableNotes', label: 'Ghi chú', icon: StickyNote, linkedField: 'notes' },
   ],
   
   settings: [
     { key: 'customersPerPage', label: 'Số KH / trang', type: 'number', default: 20 },
   ],
   
   conventionNote: 'Email unique và lowercase. Mật khẩu hash bằng bcrypt. ordersCount và totalSpent tự động cập nhật.',

  runtimeConfig: {
    fields: [],
  },
   
  tabs: ['config'],
 });
