export type HomeComponentBaseType = {
  description: string;
  label: string;
  position: number;
  route: string;
  value: string;
  recommended?: boolean;
  singleton?: boolean;
};

export const HOME_COMPONENT_BASE_TYPES: HomeComponentBaseType[] = [
  { description: 'Banner chính đầu trang', label: 'Hero Banner', route: 'hero', value: 'Hero', singleton: true, recommended: true, position: 1 },
  { description: 'Hero danh mục kèm sidebar', label: 'Hero khám phá danh mục', route: 'homepage-category-hero', value: 'HomepageCategoryHero', singleton: true, recommended: true, position: 2 },
  { description: 'Số liệu nổi bật', label: 'Thống kê', route: 'stats', value: 'Stats', recommended: true, position: 2 },
  { description: 'Logo đối tác, khách hàng', label: 'Đối tác / Logos', route: 'partners', value: 'Partners', recommended: true, position: 3 },
  { description: 'Dòng chữ chạy liên tục (ticker/marquee)', label: 'Chạy chữ / Marquee', route: 'marquee', value: 'Marquee', position: 4 },
  { description: 'Giải thưởng, chứng chỉ', label: 'Chứng nhận', route: 'trust-badges', value: 'TrustBadges', position: 5 },
  { description: 'Hiển thị danh mục SP', label: 'Danh mục sản phẩm', route: 'product-categories', value: 'ProductCategories', recommended: true, position: 5 },
  { description: 'Sản phẩm theo danh mục', label: 'Danh sách Sản phẩm', route: 'product-list', value: 'ProductList', recommended: true, position: 6 },
  { description: 'Hiển thị sản phẩm trong các tab danh mục', label: 'Sản phẩm theo tab', route: 'product-grid', value: 'ProductGrid', position: 7 },
  { description: 'SP trong từng danh mục', label: 'Sản phẩm theo danh mục', route: 'category-products', value: 'CategoryProducts', position: 7 },
  { description: 'Các dịch vụ cung cấp', label: 'Danh sách Dịch vụ', route: 'service-list', value: 'ServiceList', position: 8 },
  { description: 'Bài viết mới nhất', label: 'Tin tức / Blog', route: 'blog', value: 'Blog', recommended: true, position: 9 },
  { description: 'Tại sao chọn chúng tôi', label: 'Lợi ích', route: 'benefits', value: 'Benefits', position: 10 },
  { description: 'Tính năng nổi bật với icon grid', label: 'Tính năng', route: 'features', value: 'Features', position: 11 },
  { description: 'Mô tả dịch vụ', label: 'Dịch vụ chi tiết', route: 'services', value: 'Services', position: 12 },
  { description: 'Các bước quy trình/timeline cho dịch vụ', label: 'Quy trình', route: 'process', value: 'Process', position: 13 },
  { description: 'Ý kiến khách hàng', label: 'Đánh giá / Review', route: 'testimonials', value: 'Testimonials', recommended: true, position: 14 },
  { description: 'Case study tiêu biểu', label: 'Dự án thực tế', route: 'case-study', value: 'CaseStudy', position: 15 },
  { description: 'Hình ảnh hoạt động', label: 'Thư viện ảnh', route: 'gallery', value: 'Gallery', position: 16 },
  { description: 'Hiển thị 1–4 ảnh banner có thể gắn link khi click', label: 'Banner ảnh thương hiệu', route: 'clients', value: 'Clients', position: 17 },
  { description: 'Nút đăng ký, mua ngay', label: 'Kêu gọi hành động (CTA)', route: 'cta', value: 'CTA', recommended: true, position: 18 },
  { description: 'Các gói dịch vụ', label: 'Bảng giá', route: 'pricing', value: 'Pricing', position: 19 },
  { description: 'Voucher khuyến mãi với CTA dẫn tới ưu đãi', label: 'Voucher khuyến mãi', route: 'voucher-promotions', value: 'VoucherPromotions', position: 20 },
  { description: 'Banner khuyến mãi với đếm ngược thời gian', label: 'Khuyến mãi / Countdown', route: 'countdown', value: 'Countdown', position: 21 },
  { description: 'Popup linh hoạt cho thông báo, khuyến mãi, xác nhận hoặc thu lead', label: 'Popup', route: 'popup', value: 'Popup', singleton: true, recommended: true, position: 22 },
  { description: 'Hỏi đáp', label: 'Câu hỏi thường gặp', route: 'faq', value: 'FAQ', recommended: true, position: 23 },
  { description: 'Giới thiệu ngắn gọn', label: 'Về chúng tôi', route: 'about', value: 'About', recommended: true, position: 24 },
  { description: 'Giới thiệu đội ngũ với ảnh, chức vụ, social links', label: 'Đội ngũ', route: 'team', value: 'Team', position: 25 },
  { description: 'Video giới thiệu hoặc demo sản phẩm', label: 'Video / Media', route: 'video', value: 'Video', position: 26 },
  { description: 'Form liên hệ, bản đồ', label: 'Liên hệ', route: 'contact', value: 'Contact', recommended: true, position: 27 },
  { description: 'Vị trí đang tuyển', label: 'Tuyển dụng', route: 'career', value: 'Career', position: 28 },
  { description: 'Chân trang', label: 'Footer', route: 'footer', value: 'Footer', singleton: true, recommended: true, position: 29 },
  { description: 'Nút liên hệ nhanh (FAB)', label: 'Speed Dial', route: 'speed-dial', value: 'SpeedDial', singleton: true, recommended: true, position: 30 },
];

export const HOME_COMPONENT_TYPE_VALUES = HOME_COMPONENT_BASE_TYPES.map((type) => type.value);
