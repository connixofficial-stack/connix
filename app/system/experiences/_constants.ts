import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  BookOpen,
  Briefcase,
  CreditCard,
  FileText,
  Heart,
  CalendarDays,
  Mail,
  Menu,
  MessageSquare,
  Package,
  ShoppingCart,
  Ticket,
  User,
  Search,
} from 'lucide-react';

export type SystemExperience = {
  description: string;
  href: string;
  icon: LucideIcon;
  title: string;
};

export const systemExperiences: SystemExperience[] = [
  {
    description: 'Layout, filters, search cho danh sách bài viết.',
    href: '/system/experiences/posts-list',
    icon: FileText,
    title: 'Danh sách bài viết',
  },
  {
    description: 'Layout, author info, comments cho chi tiết bài viết.',
    href: '/system/experiences/posts-detail',
    icon: FileText,
    title: 'Chi tiết bài viết',
  },
  {
    description: 'Layout, filters, search cho danh sách dịch vụ.',
    href: '/system/experiences/services-list',
    icon: Briefcase,
    title: 'Danh sách dịch vụ',
  },
  {
    description: 'Form đặt lịch, lịch trống và hiển thị public.',
    href: '/system/experiences/booking',
    icon: CalendarDays,
    title: 'Đặt lịch',
  },
  {
    description: 'Layout, author info, comments cho chi tiết dịch vụ.',
    href: '/system/experiences/services-detail',
    icon: Briefcase,
    title: 'Chi tiết dịch vụ',
  },
  {
    description: 'Layout, filters, search cho danh sách khóa học.',
    href: '/system/experiences/courses-list',
    icon: BookOpen,
    title: 'Danh sách khóa học',
  },
  {
    description: 'Banner đầu trang, lộ trình học, giảng viên và nút đăng ký chi tiết khóa học.',
    href: '/system/experiences/courses-detail',
    icon: BookOpen,
    title: 'Chi tiết khóa học',
  },
  {
    description: 'Layout, filters, search cho danh sách tài nguyên.',
    href: '/system/experiences/resources-list',
    icon: FileText,
    title: 'Danh sách tài nguyên',
  },
  {
    description: 'Gallery, quyền tải, tài nguyên liên quan và CTA chi tiết tài nguyên.',
    href: '/system/experiences/resources-detail',
    icon: FileText,
    title: 'Chi tiết tài nguyên',
  },
  {
    description: 'Video bài học, sidebar nội dung, điều hướng bài trước/sau và trạng thái khóa bài học.',
    href: '/system/experiences/lesson-detail',
    icon: BookOpen,
    title: 'Chi tiết bài học',
  },
  {
    description: 'Layout, filters, search cho danh sách sản phẩm.',
    href: '/system/experiences/products-list',
    icon: Package,
    title: 'Danh sách sản phẩm',
  },
  {
    description: 'Layout, rating, wishlist, giỏ hàng cho chi tiết sản phẩm.',
    href: '/system/experiences/product-detail',
    icon: Package,
    title: 'Chi tiết sản phẩm',
  },
  {
    description: 'Style header, topbar, search, cart, wishlist, login.',
    href: '/system/experiences/menu',
    icon: Menu,
    title: 'Header Menu',
  },
  {
    description: 'Layout trang wishlist, nút wishlist, note và notification.',
    href: '/system/experiences/wishlist',
    icon: Heart,
    title: 'Sản phẩm yêu thích',
  },
  {
    description: 'Accordion đơn hàng, thống kê, tracking cho account.',
    href: '/system/experiences/account-orders',
    icon: Package,
    title: 'Đơn hàng (Account)',
  },
  {
    description: 'Profile, quick actions và thông tin liên hệ.',
    href: '/system/experiences/account-profile',
    icon: User,
    title: 'Tài khoản (Account)',
  },
  {
    description: 'Layout giỏ hàng (drawer/page), guest cart, expiry và note.',
    href: '/system/experiences/cart',
    icon: ShoppingCart,
    title: 'Giỏ hàng',
  },
  {
    description: 'Checkout flow, payment methods, shipping và order summary.',
    href: '/system/experiences/checkout',
    icon: CreditCard,
    title: 'Thanh toán & Đặt hàng',
  },
  {
    description: 'Rating display, sort order, likes, replies và moderation.',
    href: '/system/experiences/comments-rating',
    icon: MessageSquare,
    title: 'Bình luận & Đánh giá',
  },
  {
    description: 'Layout form liên hệ, map, contact info và social links.',
    href: '/system/experiences/contact',
    icon: Mail,
    title: 'Trang liên hệ',
  },
  {
    description: 'Trang lỗi tổng hợp 400-504, CTA và màu thương hiệu.',
    href: '/system/experiences/error-pages',
    icon: AlertTriangle,
    title: 'Trang lỗi hệ thống',
  },
  {
    description: 'Danh sách voucher, chương trình khuyến mãi và countdown.',
    href: '/system/experiences/promotions-list',
    icon: Ticket,
    title: 'Khuyến mãi',
  },
  {
    description: 'Cấu hình bố cục tìm kiếm, bộ lọc danh mục và hiển thị sản phẩm.',
    href: '/system/experiences/search-filter',
    icon: Search,
    title: 'Tìm kiếm & Bộ lọc',
  },
];
