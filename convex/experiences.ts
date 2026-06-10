import { query } from "./_generated/server";
import { v } from "convex/values";

export type ExperienceGroup = "content" | "commerce" | "user" | "ui";

export type SystemExperience = {
  description: string;
  group: ExperienceGroup;
  href: string;
  icon: string;
  title: string;
};

export const systemExperiences: SystemExperience[] = [
  // ── Nội dung ──────────────────────────────────────────────────────
  {
    description: "Layout, filters, search cho danh sách bài viết.",
    group: "content",
    href: "/system/experiences/posts-list",
    icon: "FileText",
    title: "Danh sách bài viết",
  },
  {
    description: "Layout, author info, comments cho chi tiết bài viết.",
    group: "content",
    href: "/system/experiences/posts-detail",
    icon: "FileText",
    title: "Chi tiết bài viết",
  },
  {
    description: "Layout, filters, search cho danh sách dịch vụ.",
    group: "content",
    href: "/system/experiences/services-list",
    icon: "Briefcase",
    title: "Danh sách dịch vụ",
  },
  {
    description: "Layout, author info, comments cho chi tiết dịch vụ.",
    group: "content",
    href: "/system/experiences/services-detail",
    icon: "Briefcase",
    title: "Chi tiết dịch vụ",
  },
  {
    description: "Layout, filter, khách hàng và video cho danh sách dự án.",
    group: "content",
    href: "/system/experiences/projects-list",
    icon: "Briefcase",
    title: "Danh sách dự án",
  },
  {
    description: "Hero, video giới thiệu, gallery và dự án liên quan.",
    group: "content",
    href: "/system/experiences/projects-detail",
    icon: "Briefcase",
    title: "Chi tiết dự án",
  },
  {
    description: "Layout, filters, search cho danh sách khóa học.",
    group: "content",
    href: "/system/experiences/courses-list",
    icon: "BookOpen",
    title: "Danh sách khóa học",
  },
  {
    description: "Banner đầu trang, lộ trình học, giảng viên và nút đăng ký chi tiết khóa học.",
    group: "content",
    href: "/system/experiences/courses-detail",
    icon: "BookOpen",
    title: "Chi tiết khóa học",
  },
  {
    description: "Layout, filters, search cho danh sách tài nguyên.",
    group: "content",
    href: "/system/experiences/resources-list",
    icon: "FileText",
    title: "Danh sách tài nguyên",
  },
  {
    description: "Gallery, quyền tải, tài nguyên liên quan và CTA chi tiết tài nguyên.",
    group: "content",
    href: "/system/experiences/resources-detail",
    icon: "FileText",
    title: "Chi tiết tài nguyên",
  },
  {
    description: "Video bài học, sidebar nội dung, điều hướng bài trước/sau và trạng thái khóa bài học.",
    group: "content",
    href: "/system/experiences/lesson-detail",
    icon: "BookOpen",
    title: "Chi tiết bài học",
  },
  // ── Thương mại ────────────────────────────────────────────────────
  {
    description: "Layout, filters, search cho danh sách sản phẩm.",
    group: "commerce",
    href: "/system/experiences/products-list",
    icon: "Package",
    title: "Danh sách sản phẩm",
  },
  {
    description: "Layout, rating, wishlist, giỏ hàng cho chi tiết sản phẩm.",
    group: "commerce",
    href: "/system/experiences/product-detail",
    icon: "Package",
    title: "Chi tiết sản phẩm",
  },
  {
    description: "Layout giỏ hàng (drawer/page), guest cart, expiry và note.",
    group: "commerce",
    href: "/system/experiences/cart",
    icon: "ShoppingCart",
    title: "Giỏ hàng",
  },
  {
    description: "Checkout flow, payment methods, shipping và order summary.",
    group: "commerce",
    href: "/system/experiences/checkout",
    icon: "CreditCard",
    title: "Thanh toán & Đặt hàng",
  },
  {
    description: "Layout trang wishlist, nút wishlist, note và notification.",
    group: "commerce",
    href: "/system/experiences/wishlist",
    icon: "Heart",
    title: "Sản phẩm yêu thích",
  },
  {
    description: "Danh sách voucher, chương trình khuyến mãi và countdown.",
    group: "commerce",
    href: "/system/experiences/promotions-list",
    icon: "Ticket",
    title: "Khuyến mãi",
  },
  // ── Người dùng ────────────────────────────────────────────────────
  {
    description: "Accordion đơn hàng, thống kê, tracking cho account.",
    group: "user",
    href: "/system/experiences/account-orders",
    icon: "Package",
    title: "Đơn hàng (Account)",
  },
  {
    description: "Profile, quick actions và thông tin liên hệ.",
    group: "user",
    href: "/system/experiences/account-profile",
    icon: "User",
    title: "Tài khoản (Account)",
  },
  {
    description: "Rating display, sort order, likes, replies và moderation.",
    group: "user",
    href: "/system/experiences/comments-rating",
    icon: "MessageSquare",
    title: "Bình luận & Đánh giá",
  },
  // ── Giao diện ─────────────────────────────────────────────────────
  {
    description: "Style header, topbar, search, cart, wishlist, login.",
    group: "ui",
    href: "/system/experiences/menu",
    icon: "Menu",
    title: "Header Menu",
  },
  {
    description: "Layout form liên hệ, map, contact info và social links.",
    group: "ui",
    href: "/system/experiences/contact",
    icon: "Mail",
    title: "Trang liên hệ",
  },
  {
    description: "Trang lỗi tổng hợp 400-504, CTA và màu thương hiệu.",
    group: "ui",
    href: "/system/experiences/error-pages",
    icon: "AlertTriangle",
    title: "Trang lỗi hệ thống",
  },
  {
    description: "Cấu hình bố cục tìm kiếm, bộ lọc danh mục và hiển thị sản phẩm.",
    group: "ui",
    href: "/system/experiences/search-filter",
    icon: "Search",
    title: "Tìm kiếm & Bộ lọc",
  },
  {
    description: "Form đặt lịch, lịch trống và hiển thị public.",
    group: "ui",
    href: "/system/experiences/booking",
    icon: "CalendarDays",
    title: "Đặt lịch",
  },
];

const groupValidator = v.union(
  v.literal("content"),
  v.literal("commerce"),
  v.literal("user"),
  v.literal("ui"),
);

const experienceValidator = v.object({
  description: v.string(),
  group: groupValidator,
  href: v.string(),
  icon: v.string(),
  title: v.string(),
});

export const search = query({
  args: {
    group: v.optional(groupValidator),
    query: v.string(),
  },
  handler: async (ctx, args) => {
    void ctx;
    const rawQuery = args.query.trim().toLowerCase();
    let results = systemExperiences;

    if (args.group) {
      results = results.filter((exp) => exp.group === args.group);
    }

    if (rawQuery) {
      results = results.filter(
        (exp) =>
          exp.title.toLowerCase().includes(rawQuery) ||
          exp.description.toLowerCase().includes(rawQuery)
      );
    }

    return results;
  },
  returns: v.array(experienceValidator),
});
