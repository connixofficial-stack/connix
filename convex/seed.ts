import type { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";
import { action, mutation } from "./_generated/server";
import { v } from "convex/values";
import { seedPresetProductOptions } from "./seeders/productOptions.seeder";
import { DEFAULT_ORDER_STATUS_PRESET, ORDER_STATUS_PRESETS } from "../lib/orders/statuses";
import { hashPassword } from "./lib/password";
import { syncModuleRuntimeConfig } from "./lib/moduleConfigSync";

const DEFAULT_USER_PASSWORD = process.env.SEED_USER_PASSWORD ?? "Admin@123";

export const seedModules = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db.query("adminModules").first();
    if (existing) {
      return null;
    }

    const modules = [
      { category: "content" as const, description: "Quản lý bài viết, tin tức, blog và danh mục bài viết", enabled: true, icon: "FileText", isCore: false, key: "posts", name: "Bài viết & Danh mục", order: 1 },
      { category: "content" as const, dependencies: ["posts", "products"], dependencyType: "any" as const, description: "Bình luận và đánh giá cho bài viết, sản phẩm", enabled: true, icon: "MessageSquare", isCore: false, key: "comments", name: "Bình luận và đánh giá", order: 2 },
      { category: "content" as const, description: "Quản lý hình ảnh, video, tài liệu", enabled: true, icon: "Image", isCore: false, key: "media", name: "Thư viện Media", order: 3 },
      
      { category: "commerce" as const, description: "Quản lý sản phẩm, danh mục sản phẩm, kho hàng", enabled: true, icon: "Package", isCore: false, key: "products", name: "Sản phẩm & Danh mục", order: 4 },
      { category: "commerce" as const, dependencies: ["products", "customers"], dependencyType: "all" as const, description: "Quản lý đơn hàng, vận chuyển", enabled: true, icon: "ShoppingBag", isCore: false, key: "orders", name: "Đơn hàng", order: 5 },
      { category: "commerce" as const, dependencies: ["products"], dependencyType: "all" as const, description: "Chức năng giỏ hàng cho khách đã đăng nhập", enabled: true, icon: "ShoppingCart", isCore: false, key: "cart", name: "Giỏ hàng", order: 6 },
      { category: "commerce" as const, dependencies: ["products", "customers"], dependencyType: "all" as const, description: "Danh sách sản phẩm yêu thích của khách", enabled: false, icon: "Heart", isCore: false, key: "wishlist", name: "Sản phẩm yêu thích", order: 7 },
      
      { category: "user" as const, description: "Quản lý thông tin khách hàng", enabled: true, icon: "Users", isCore: false, key: "customers", name: "Khách hàng", order: 8 },
      { category: "user" as const, description: "Quản lý tài khoản admin", enabled: true, icon: "UserCog", isCore: true, key: "users", name: "Người dùng Admin", order: 9 },
      { category: "user" as const, description: "Phân quyền và quản lý vai trò", enabled: true, icon: "Shield", isCore: true, key: "roles", name: "Vai trò & Quyền", order: 10 },
      
      { category: "system" as const, description: "Cấu hình website và hệ thống", enabled: true, icon: "Settings", isCore: true, key: "settings", name: "Cài đặt hệ thống", order: 11 },
      { category: "system" as const, description: "Quản lý menu header, footer", enabled: true, icon: "Menu", isCore: false, key: "menus", name: "Menu điều hướng", order: 12 },
      { category: "system" as const, description: "Cấu hình components trang chủ", enabled: true, icon: "LayoutGrid", isCore: false, key: "homepage", name: "Trang chủ", order: 13 },
      { category: "system" as const, dependencies: ["settings"], dependencyType: "all" as const, description: "Lưu trữ và quản lý tin nhắn liên hệ", enabled: true, icon: "Inbox", isCore: false, key: "contactInbox", name: "Tin nhắn liên hệ", order: 14 },
      
      { category: "marketing" as const, description: "Gửi thông báo cho người dùng", enabled: true, icon: "Bell", isCore: false, key: "notifications", name: "Thông báo", order: 15 },
      { category: "marketing" as const, dependencies: ["products", "orders"], dependencyType: "all" as const, description: "Quản lý mã giảm giá, voucher", enabled: false, icon: "Megaphone", isCore: false, key: "promotions", name: "Khuyến mãi", order: 16 },
      { category: "marketing" as const, description: "Báo cáo và phân tích dữ liệu", enabled: true, icon: "BarChart3", isCore: false, key: "analytics", name: "Thống kê", order: 17 },
      { category: "content" as const, description: "Quản lý dịch vụ và danh mục dịch vụ", enabled: true, icon: "Briefcase", isCore: false, key: "services", name: "Dịch vụ", order: 18 },
      { category: "content" as const, description: "Quản lý tài nguyên, link tải và quyền truy cập", enabled: true, icon: "FileText", isCore: false, key: "resources", name: "Tài nguyên", order: 19 },
      { category: "system" as const, description: "Bảng Kanban quản lý công việc nội bộ", enabled: true, icon: "LayoutGrid", isCore: false, key: "kanban", name: "Kanban Board", order: 20 },
      { category: "commerce" as const, dependencies: ["services"], dependencyType: "all" as const, description: "Quản lý lịch hẹn và đặt lịch", enabled: true, icon: "CalendarDays", isCore: false, key: "bookings", name: "Đặt lịch", order: 21 },
    ];

    for (const mod of modules) {
      await ctx.db.insert("adminModules", mod);
    }

    return null;
  },
  returns: v.null(),
});

export const seedPresets = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db.query("systemPresets").first();
    if (existing) {
      return null;
    }

    const presets = [
      {
        description: "Blog với bài viết và bình luận",
        enabledModules: ["posts", "comments", "media", "customers", "users", "roles", "settings", "menus", "homepage", "contactInbox", "analytics"],
        isDefault: false,
        key: "blog",
        name: "Blog / News",
      },
      {
        description: "Trang giới thiệu đơn giản",
        enabledModules: ["posts", "media", "users", "roles", "settings", "menus", "homepage", "contactInbox"],
        isDefault: false,
        key: "landing",
        name: "Landing Page",
      },
      {
        description: "Trưng bày sản phẩm không giỏ hàng",
        enabledModules: ["products", "media", "customers", "users", "roles", "settings", "menus", "homepage", "contactInbox", "notifications", "analytics"],
        isDefault: false,
        key: "catalog",
        name: "Catalog",
      },
      {
        description: "Shop đơn giản với giỏ hàng",
        enabledModules: ["products", "orders", "cart", "media", "customers", "users", "roles", "settings", "menus", "homepage", "contactInbox", "notifications", "analytics"],
        isDefault: false,
        key: "ecommerce-basic",
        name: "eCommerce Basic",
      },
      {
        description: "Shop đầy đủ: giỏ hàng, wishlist, khuyến mãi",
        enabledModules: ["posts", "comments", "media", "products", "orders", "cart", "wishlist", "resources", "customers", "users", "roles", "settings", "menus", "homepage", "contactInbox", "notifications", "promotions", "analytics"],
        isDefault: true,
        key: "ecommerce-full",
        name: "eCommerce Full",
      },
    ];

    for (const preset of presets) {
      await ctx.db.insert("systemPresets", preset);
    }

    return null;
  },
  returns: v.null(),
});

// ============ ANALYTICS MODULE ============
export const seedAnalyticsModule = mutation({
  args: { configOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    void args;
    await syncModuleRuntimeConfig(ctx, "analytics");
    return null;
  },
  returns: v.null(),
});

// Alias for backward compatibility
export const seedAnalyticsFeatures = seedAnalyticsModule;

// Clear analytics module CONFIG
export const clearAnalyticsConfig = mutation({
  args: {},
  handler: async (ctx) => {
    const features = await ctx.db.query("moduleFeatures").withIndex("by_module", q => q.eq("moduleKey", "analytics")).collect();
    for (const f of features) {
      await ctx.db.delete(f._id);
    }
    const fields = await ctx.db.query("moduleFields").withIndex("by_module", q => q.eq("moduleKey", "analytics")).collect();
    for (const f of fields) {
      await ctx.db.delete(f._id);
    }
    const settings = await ctx.db.query("moduleSettings").withIndex("by_module", q => q.eq("moduleKey", "analytics")).collect();
    for (const s of settings) {
      await ctx.db.delete(s._id);
    }
    return null;
  },
  returns: v.null(),
});

// Seed Posts module: categories, posts, features, fields, settings
export const seedPostsModule = mutation({
  args: { configOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const configOnly = args.configOnly ?? false;

    if (!configOnly) {
      // 1. Seed roles if not exist
      let adminRoleId = (await ctx.db.query("roles").withIndex("by_name", q => q.eq("name", "Admin")).first())?._id;
      adminRoleId ??= await ctx.db.insert("roles", {
          color: "#3b82f6",
          description: "Quản trị viên hệ thống",
          isSuperAdmin: true,
          isSystem: true,
          name: "Admin",
          permissions: { "*": ["*"] },
        });

      // 2. Seed users if not exist
      const adminUser = await ctx.db.query("users").withIndex("by_email", q => q.eq("email", "admin@example.com")).first();
      if (!adminUser) {
        const passwordHash = await hashPassword(DEFAULT_USER_PASSWORD);
        await ctx.db.insert("users", {
          email: "admin@example.com",
          name: "Admin User",
          passwordHash,
          roleId: adminRoleId,
          status: "Active",
        });
      }

      // 3. Seed post categories
      const existingCategories = await ctx.db.query("postCategories").first();
      if (!existingCategories) {
        const categories = [
          { active: true, description: "Tin tức mới nhất", name: "Tin tức", order: 0, slug: "tin-tuc" },
          { active: true, description: "Các bài hướng dẫn chi tiết", name: "Hướng dẫn", order: 1, slug: "huong-dan" },
          { active: true, description: "Thông tin khuyến mãi", name: "Khuyến mãi", order: 2, slug: "khuyen-mai" },
          { active: true, description: "Các sự kiện sắp diễn ra", name: "Sự kiện", order: 3, slug: "su-kien" },
          { active: false, description: "Tin công nghệ", name: "Công nghệ", order: 4, slug: "cong-nghe" },
        ];
        for (const cat of categories) {
          await ctx.db.insert("postCategories", cat);
        }
      }

      // 4. Seed posts
      const existingPosts = await ctx.db.query("posts").first();
      if (!existingPosts) {
        const tinTucCat = await ctx.db.query("postCategories").withIndex("by_slug", q => q.eq("slug", "tin-tuc")).first();
        const huongDanCat = await ctx.db.query("postCategories").withIndex("by_slug", q => q.eq("slug", "huong-dan")).first();
        const khuyenMaiCat = await ctx.db.query("postCategories").withIndex("by_slug", q => q.eq("slug", "khuyen-mai")).first();
        
        if (tinTucCat && huongDanCat && khuyenMaiCat) {
          const posts = [
            { authorName: "Admin", categoryId: tinTucCat._id, content: "<p>Chúng tôi vui mừng giới thiệu dòng sản phẩm mới nhất với nhiều tính năng đột phá...</p>", excerpt: "Khám phá dòng sản phẩm mới với công nghệ tiên tiến", order: 0, publishedAt: Date.now() - 86_400_000, slug: "ra-mat-san-pham-moi-thang-1-2025", status: "Published" as const, thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400", title: "Ra mắt sản phẩm mới tháng 1/2025", views: 1250 },
            { authorName: "Admin", categoryId: huongDanCat._id, content: "<p>Bài viết này sẽ hướng dẫn bạn từng bước cách sử dụng ứng dụng di động của chúng tôi...</p>", excerpt: "Hướng dẫn chi tiết từ A-Z", order: 1, publishedAt: Date.now() - 172_800_000, slug: "huong-dan-su-dung-ung-dung-di-dong", status: "Published" as const, thumbnail: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400", title: "Hướng dẫn sử dụng ứng dụng di động", views: 890 },
            { authorName: "Admin", categoryId: khuyenMaiCat._id, content: "<p>Chương trình khuyến mãi đặc biệt giảm giá lên đến 50% cho tất cả sản phẩm...</p>", excerpt: "Ưu đãi khủng mừng năm mới 2025", order: 2, publishedAt: Date.now() - 259_200_000, slug: "giam-gia-50-nhan-dip-nam-moi", status: "Published" as const, thumbnail: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400", title: "Giảm giá 50% nhân dịp năm mới", views: 2100 },
            { authorName: "Admin", categoryId: tinTucCat._id, content: "<p>Chính sách bảo hành mới sẽ có hiệu lực từ ngày 01/02/2025 với nhiều cải tiến...</p>", excerpt: "Thông tin chính sách bảo hành", order: 3, slug: "cap-nhat-chinh-sach-bao-hanh-moi", status: "Draft" as const, thumbnail: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400", title: "Cập nhật chính sách bảo hành mới", views: 0 },
            { authorName: "Admin", categoryId: huongDanCat._id, content: "<p>Các phương thức thanh toán online được hỗ trợ và hướng dẫn chi tiết...</p>", excerpt: "Thanh toán nhanh chóng, an toàn", order: 4, publishedAt: Date.now() - 345_600_000, slug: "huong-dan-thanh-toan-online", status: "Published" as const, thumbnail: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400", title: "Hướng dẫn thanh toán online", views: 650 },
            { authorName: "Admin", categoryId: tinTucCat._id, content: "<p>Điểm lại những sản phẩm được yêu thích nhất trong năm qua...</p>", excerpt: "Những sản phẩm hot nhất năm", order: 5, publishedAt: Date.now() - 604_800_000, slug: "top-10-san-pham-ban-chay-nhat-2024", status: "Archived" as const, thumbnail: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400", title: "Top 10 sản phẩm bán chạy nhất 2024", views: 3200 },
          ].map((post) => ({ ...post, renderType: "content" as const }));
          for (const post of posts) {
            await ctx.db.insert("posts", post);
          }
        }
      }
    }

    await syncModuleRuntimeConfig(ctx, "posts");
    await syncModuleRuntimeConfig(ctx, "postCategories");

    return null;
  },
  returns: v.null(),
});

// Seed Comments (for both posts and products)
export const seedComments = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("comments").first();
    if (existing) {return null;}

    // Get posts and products to link comments
    const posts = await ctx.db.query("posts").collect();
    const products = await ctx.db.query("products").collect();

    // Post comments
    if (posts.length > 0) {
      const postComments = [
        { authorEmail: "nguyenvana@gmail.com", authorIp: "192.168.1.100", authorName: "Nguyễn Văn A", content: "Bài viết rất hay và hữu ích! Cảm ơn admin.", status: "Approved" as const, targetId: posts[0]?._id, targetType: "post" as const },
        { authorEmail: "tranthib@gmail.com", authorIp: "192.168.1.101", authorName: "Trần Thị B", content: "Mình đã áp dụng và thấy hiệu quả ngay. Tuyệt vời!", status: "Approved" as const, targetId: posts[0]?._id, targetType: "post" as const },
        { authorEmail: "levanc@gmail.com", authorIp: "192.168.1.102", authorName: "Lê Văn C", content: "Có thể viết thêm về chủ đề này được không ạ?", status: "Pending" as const, targetId: posts[1]?._id, targetType: "post" as const },
        { authorEmail: "phamthid@gmail.com", authorIp: "192.168.1.103", authorName: "Phạm Thị D", content: "Hướng dẫn chi tiết quá, thank admin!", status: "Approved" as const, targetId: posts[1]?._id, targetType: "post" as const },
        { authorEmail: "hoangvane@gmail.com", authorIp: "192.168.1.104", authorName: "Hoàng Văn E", content: "Khuyến mãi này còn hiệu lực không ạ?", status: "Pending" as const, targetId: posts[2]?._id, targetType: "post" as const },
        { authorEmail: "spam@spam.com", authorIp: "10.0.0.1", authorName: "Spammer", content: "Spam link quảng cáo", status: "Spam" as const, targetId: posts[0]?._id, targetType: "post" as const },
      ];
      for (const comment of postComments) {
        if (comment.targetId) {
          await ctx.db.insert("comments", comment);
        }
      }
    }

    // Product reviews
    if (products.length > 0) {
      const productReviews = [
        { authorEmail: "tuantran@gmail.com", authorIp: "192.168.1.110", authorName: "Trần Minh Tuấn", content: "Sản phẩm chất lượng, đóng gói cẩn thận. Giao hàng nhanh!", rating: 5, status: "Approved" as const, targetId: products[0]?._id, targetType: "product" as const },
        { authorEmail: "hoanguyen@gmail.com", authorIp: "192.168.1.111", authorName: "Nguyễn Thị Hoa", content: "Máy đẹp, pin trâu, camera chụp rõ nét. 5 sao!", rating: 5, status: "Approved" as const, targetId: products[0]?._id, targetType: "product" as const },
        { authorEmail: "hungle@gmail.com", authorIp: "192.168.1.112", authorName: "Lê Văn Hùng", content: "Đã dùng được 2 tuần, rất hài lòng với sản phẩm.", rating: 4, status: "Approved" as const, targetId: products[1]?._id, targetType: "product" as const },
        { authorEmail: "maipham@gmail.com", authorIp: "192.168.1.113", authorName: "Phạm Thanh Mai", content: "Sản phẩm như mô tả, shop tư vấn nhiệt tình.", rating: 4, status: "Approved" as const, targetId: products[2]?._id, targetType: "product" as const },
        { authorEmail: "dunghoang@gmail.com", authorIp: "192.168.1.114", authorName: "Hoàng Anh Dũng", content: "Vải đẹp, form chuẩn, mặc thoải mái. Sẽ mua thêm màu khác.", rating: 5, status: "Approved" as const, targetId: products[3]?._id, targetType: "product" as const },
        { authorEmail: "lanvu@gmail.com", authorIp: "192.168.1.115", authorName: "Vũ Thị Lan", content: "Giao hàng hơi chậm nhưng sản phẩm ok.", rating: 3, status: "Pending" as const, targetId: products[4]?._id, targetType: "product" as const },
        { authorEmail: "binhdo@gmail.com", authorIp: "192.168.1.116", authorName: "Đỗ Văn Bình", content: "Nồi chiên rất tốt, tiết kiệm dầu. Recommend!", rating: 5, status: "Approved" as const, targetId: products[5]?._id, targetType: "product" as const },
        { authorEmail: "hanhngo@gmail.com", authorIp: "192.168.1.117", authorName: "Ngô Thị Hạnh", content: "Robot hút sạch, app điều khiển dễ dùng.", rating: 4, status: "Pending" as const, targetId: products[6]?._id, targetType: "product" as const },
        { authorEmail: "fake@spam.com", authorIp: "10.0.0.2", authorName: "Fake Reviewer", content: "Quảng cáo spam - không liên quan sản phẩm", rating: 1, status: "Spam" as const, targetId: products[0]?._id, targetType: "product" as const },
      ];
      for (const review of productReviews) {
        if (review.targetId) {
          await ctx.db.insert("comments", review);
        }
      }
    }

    return null;
  },
  returns: v.null(),
});

// Clear Comments
export const clearComments = mutation({
  args: {},
  handler: async (ctx) => {
    const comments = await ctx.db.query("comments").collect();
    for (const c of comments) {
      await ctx.db.delete(c._id);
    }
    return null;
  },
  returns: v.null(),
});

// Clear posts DATA only (posts, categories) - keeps config (features, fields, settings)
export const clearPostsData = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete images in posts and posts-content folders
    const postImages = await ctx.db.query("images").withIndex("by_folder", q => q.eq("folder", "posts")).collect();
    for (const img of postImages) {
      await ctx.storage.delete(img.storageId);
      await ctx.db.delete(img._id);
    }
    const contentImages = await ctx.db.query("images").withIndex("by_folder", q => q.eq("folder", "posts-content")).collect();
    for (const img of contentImages) {
      await ctx.storage.delete(img.storageId);
      await ctx.db.delete(img._id);
    }
    
    // Delete posts
    const posts = await ctx.db.query("posts").collect();
    for (const post of posts) {
      await ctx.db.delete(post._id);
    }

    // Delete post categories
    const categories = await ctx.db.query("postCategories").collect();
    for (const cat of categories) {
      await ctx.db.delete(cat._id);
    }

    return null;
  },
  returns: v.null(),
});

// Clear posts module CONFIG (features, fields, settings) - for full reset
export const clearPostsConfig = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete posts module features
    const features = await ctx.db.query("moduleFeatures").withIndex("by_module", q => q.eq("moduleKey", "posts")).collect();
    for (const f of features) {
      await ctx.db.delete(f._id);
    }

    // Delete posts module fields
    const fields = await ctx.db.query("moduleFields").withIndex("by_module", q => q.eq("moduleKey", "posts")).collect();
    for (const f of fields) {
      await ctx.db.delete(f._id);
    }
    const catFields = await ctx.db.query("moduleFields").withIndex("by_module", q => q.eq("moduleKey", "postCategories")).collect();
    for (const f of catFields) {
      await ctx.db.delete(f._id);
    }

    // Delete posts module settings
    const settings = await ctx.db.query("moduleSettings").withIndex("by_module", q => q.eq("moduleKey", "posts")).collect();
    for (const s of settings) {
      await ctx.db.delete(s._id);
    }

    return null;
  },
  returns: v.null(),
});

// Clear ALL posts module (data + config) - legacy, use clearPostsData + clearPostsConfig instead
export const clearPostsModule = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete posts
    const posts = await ctx.db.query("posts").collect();
    for (const post of posts) {
      await ctx.db.delete(post._id);
    }

    // Delete post categories
    const categories = await ctx.db.query("postCategories").collect();
    for (const cat of categories) {
      await ctx.db.delete(cat._id);
    }

    // Delete posts module features
    const features = await ctx.db.query("moduleFeatures").withIndex("by_module", q => q.eq("moduleKey", "posts")).collect();
    for (const f of features) {
      await ctx.db.delete(f._id);
    }

    // Delete posts module fields
    const fields = await ctx.db.query("moduleFields").withIndex("by_module", q => q.eq("moduleKey", "posts")).collect();
    for (const f of fields) {
      await ctx.db.delete(f._id);
    }
    const catFields = await ctx.db.query("moduleFields").withIndex("by_module", q => q.eq("moduleKey", "postCategories")).collect();
    for (const f of catFields) {
      await ctx.db.delete(f._id);
    }

    // Delete posts module settings
    const settings = await ctx.db.query("moduleSettings").withIndex("by_module", q => q.eq("moduleKey", "posts")).collect();
    for (const s of settings) {
      await ctx.db.delete(s._id);
    }

    return null;
  },
  returns: v.null(),
});

export const seedAll = mutation({
  args: {},
  handler: async (ctx) => {
    // Seed modules
    const existingModules = await ctx.db.query("adminModules").first();
    if (!existingModules) {
      const modules = [
        { category: "content" as const, description: "Quản lý bài viết, tin tức, blog và danh mục bài viết", enabled: true, icon: "FileText", isCore: false, key: "posts", name: "Bài viết & Danh mục", order: 1 },
        { category: "content" as const, dependencies: ["posts", "products"], dependencyType: "any" as const, description: "Bình luận và đánh giá cho bài viết, sản phẩm", enabled: true, icon: "MessageSquare", isCore: false, key: "comments", name: "Bình luận và đánh giá", order: 2 },
        { category: "content" as const, description: "Quản lý hình ảnh, video, tài liệu", enabled: true, icon: "Image", isCore: false, key: "media", name: "Thư viện Media", order: 3 },
        { category: "commerce" as const, description: "Quản lý sản phẩm, danh mục sản phẩm, kho hàng", enabled: true, icon: "Package", isCore: false, key: "products", name: "Sản phẩm & Danh mục", order: 4 },
        { category: "commerce" as const, dependencies: ["products", "customers"], dependencyType: "all" as const, description: "Quản lý đơn hàng, vận chuyển", enabled: true, icon: "ShoppingBag", isCore: false, key: "orders", name: "Đơn hàng", order: 5 },
        { category: "commerce" as const, dependencies: ["products"], dependencyType: "all" as const, description: "Chức năng giỏ hàng cho khách", enabled: true, icon: "ShoppingCart", isCore: false, key: "cart", name: "Giỏ hàng", order: 6 },
        { category: "commerce" as const, dependencies: ["products"], dependencyType: "all" as const, description: "Danh sách sản phẩm yêu thích của khách", enabled: false, icon: "Heart", isCore: false, key: "wishlist", name: "Sản phẩm yêu thích", order: 7 },
        { category: "user" as const, description: "Quản lý thông tin khách hàng", enabled: true, icon: "Users", isCore: false, key: "customers", name: "Khách hàng", order: 8 },
        { category: "user" as const, description: "Quản lý tài khoản admin", enabled: true, icon: "UserCog", isCore: true, key: "users", name: "Người dùng Admin", order: 9 },
        { category: "user" as const, description: "Phân quyền và quản lý vai trò", enabled: true, icon: "Shield", isCore: true, key: "roles", name: "Vai trò & Quyền", order: 10 },
        { category: "system" as const, description: "Cấu hình website và hệ thống", enabled: true, icon: "Settings", isCore: true, key: "settings", name: "Cài đặt hệ thống", order: 11 },
        { category: "system" as const, description: "Quản lý menu header, footer", enabled: true, icon: "Menu", isCore: false, key: "menus", name: "Menu điều hướng", order: 12 },
        { category: "system" as const, description: "Cấu hình components trang chủ", enabled: true, icon: "LayoutGrid", isCore: false, key: "homepage", name: "Trang chủ", order: 13 },
        { category: "marketing" as const, description: "Gửi thông báo cho người dùng", enabled: true, icon: "Bell", isCore: false, key: "notifications", name: "Thông báo", order: 14 },
        { category: "marketing" as const, dependencies: ["products", "orders"], dependencyType: "all" as const, description: "Quản lý mã giảm giá, voucher", enabled: false, icon: "Megaphone", isCore: false, key: "promotions", name: "Khuyến mãi", order: 15 },
        { category: "marketing" as const, description: "Báo cáo và phân tích dữ liệu", enabled: true, icon: "BarChart3", isCore: false, key: "analytics", name: "Thống kê", order: 16 },
        { category: "content" as const, description: "Quản lý dịch vụ và danh mục dịch vụ", enabled: true, icon: "Briefcase", isCore: false, key: "services", name: "Dịch vụ", order: 17 },
        { category: "commerce" as const, dependencies: ["services"], dependencyType: "all" as const, description: "Quản lý lịch hẹn và đặt lịch", enabled: true, icon: "CalendarDays", isCore: false, key: "bookings", name: "Đặt lịch", order: 18 },
      ];
      for (const mod of modules) {
        await ctx.db.insert("adminModules", mod);
      }
    }

    // Seed presets
    const existingPresets = await ctx.db.query("systemPresets").first();
    if (!existingPresets) {
      const presets = [
        { description: "Blog với bài viết và bình luận", enabledModules: ["posts", "comments", "media", "customers", "users", "roles", "settings", "menus", "homepage", "analytics"], isDefault: false, key: "blog", name: "Blog / News" },
        { description: "Trang giới thiệu đơn giản", enabledModules: ["posts", "media", "users", "roles", "settings", "menus", "homepage"], isDefault: false, key: "landing", name: "Landing Page" },
        { description: "Trưng bày sản phẩm không giỏ hàng", enabledModules: ["products", "media", "customers", "users", "roles", "settings", "menus", "homepage", "notifications", "analytics"], isDefault: false, key: "catalog", name: "Catalog" },
        { description: "Shop đơn giản với giỏ hàng", enabledModules: ["products", "orders", "cart", "media", "customers", "users", "roles", "settings", "menus", "homepage", "notifications", "analytics"], isDefault: false, key: "ecommerce-basic", name: "eCommerce Basic" },
        { description: "Shop đầy đủ: giỏ hàng, wishlist, khuyến mãi", enabledModules: ["posts", "comments", "media", "products", "orders", "cart", "wishlist", "customers", "users", "roles", "settings", "menus", "homepage", "notifications", "promotions", "analytics"], isDefault: true, key: "ecommerce-full", name: "eCommerce Full" },
      ];
      for (const preset of presets) {
        await ctx.db.insert("systemPresets", preset);
      }
    }

    return null;
  },
  returns: v.null(),
});

// ============ PRODUCTS MODULE ============

export const seedProductsModule = mutation({
  args: { configOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const configOnly = args.configOnly ?? false;

    if (!configOnly) {
      // 1. Seed product categories
      const existingCategories = await ctx.db.query("productCategories").first();
      if (!existingCategories) {
        const categories = [
          { active: true, description: "Thiết bị điện tử, công nghệ", name: "Điện tử", order: 0, slug: "dien-tu" },
          { active: true, description: "Quần áo, phụ kiện thời trang", name: "Thời trang", order: 1, slug: "thoi-trang" },
          { active: true, description: "Đồ dùng gia đình", name: "Gia dụng", order: 2, slug: "gia-dung" },
          { active: true, description: "Sách, vở, dụng cụ văn phòng", name: "Sách & Văn phòng phẩm", order: 3, slug: "sach-van-phong-pham" },
          { active: false, description: "Dụng cụ, trang phục thể thao", name: "Thể thao", order: 4, slug: "the-thao" },
        ];
        for (const cat of categories) {
          await ctx.db.insert("productCategories", cat);
        }
      }

      // 2. Seed products
      const existingProducts = await ctx.db.query("products").first();
      if (!existingProducts) {
        const dienTuCat = await ctx.db.query("productCategories").withIndex("by_slug", q => q.eq("slug", "dien-tu")).first();
        const thoiTrangCat = await ctx.db.query("productCategories").withIndex("by_slug", q => q.eq("slug", "thoi-trang")).first();
        const giaDungCat = await ctx.db.query("productCategories").withIndex("by_slug", q => q.eq("slug", "gia-dung")).first();
        
        if (dienTuCat && thoiTrangCat && giaDungCat) {
          const products = [
            { categoryId: dienTuCat._id, description: "iPhone 15 Pro Max 256GB chính hãng Apple", image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400", name: "iPhone 15 Pro Max", order: 0, price: 34_990_000, salePrice: 32_990_000, sales: 125, sku: "IP15PM-256", slug: "iphone-15-pro-max", status: "Active" as const, stock: 50 },
            { categoryId: dienTuCat._id, description: "Samsung Galaxy S24 Ultra 512GB", image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400", name: "Samsung Galaxy S24 Ultra", order: 1, price: 33_990_000, sales: 89, sku: "SS-S24U-512", slug: "samsung-galaxy-s24-ultra", status: "Active" as const, stock: 35 },
            { categoryId: dienTuCat._id, description: "MacBook Pro 14 inch chip M3", image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400", name: "MacBook Pro M3", order: 2, price: 49_990_000, sales: 45, sku: "MBP-M3-14", slug: "macbook-pro-m3", status: "Active" as const, stock: 20 },
            { categoryId: thoiTrangCat._id, description: "Áo polo nam cao cấp, chất liệu cotton", image: "https://images.unsplash.com/photo-1625910513413-5fc5f8b9920b?w=400", name: "Áo Polo Nam Premium", order: 3, price: 450_000, salePrice: 350_000, sales: 320, sku: "POLO-NAM-001", slug: "ao-polo-nam-premium", status: "Active" as const, stock: 200 },
            { categoryId: thoiTrangCat._id, description: "Quần jean nam form slim fit", image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400", name: "Quần Jean Nam Slim Fit", order: 4, price: 650_000, sales: 180, sku: "JEAN-NAM-001", slug: "quan-jean-nam-slim-fit", status: "Active" as const, stock: 150 },
            { categoryId: giaDungCat._id, description: "Nồi chiên không dầu Philips 4.1L", image: "https://images.unsplash.com/photo-1585515320310-259814833e62?w=400", name: "Nồi chiên không dầu Philips", order: 5, price: 3_500_000, salePrice: 2_990_000, sales: 95, sku: "AF-PHILIPS-01", slug: "noi-chien-khong-dau-philips", status: "Active" as const, stock: 80 },
            { categoryId: giaDungCat._id, description: "Robot hút bụi lau nhà Xiaomi", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400", name: "Robot hút bụi Xiaomi", order: 6, price: 8_500_000, sales: 42, sku: "ROBOT-XIAOMI-01", slug: "robot-hut-bui-xiaomi", status: "Active" as const, stock: 5 },
            { categoryId: dienTuCat._id, description: "Tai nghe AirPods Pro thế hệ 2", image: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400", name: "Tai nghe AirPods Pro 2", order: 7, price: 6_990_000, sales: 0, sku: "APP2-2024", slug: "tai-nghe-airpods-pro-2", status: "Draft" as const, stock: 0 },
            { categoryId: thoiTrangCat._id, description: "Váy đầm nữ sang trọng dự tiệc", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400", name: "Váy đầm nữ dự tiệc", order: 8, price: 890_000, sales: 75, sku: "DRESS-NU-001", slug: "vay-dam-nu-du-tiec", status: "Archived" as const, stock: 60 },
          ].map((product) => ({ ...product, renderType: "content" as const }));
          for (const product of products) {
            await ctx.db.insert("products", product);
          }
        }
      }
    }

    await syncModuleRuntimeConfig(ctx, "products");
    await syncModuleRuntimeConfig(ctx, "productCategories");

    // 6. Seed preset options (variants)
    await seedPresetProductOptions(ctx);

    // 6a. Seed option values + sample variants
    const existingVariants = await ctx.db.query("productVariants").first();
    if (!existingVariants) {
      const [colorOption, sizeOption] = await Promise.all([
        ctx.db.query("productOptions").withIndex("by_slug", q => q.eq("slug", "color")).unique(),
        ctx.db.query("productOptions").withIndex("by_slug", q => q.eq("slug", "size")).unique(),
      ]);

      if (colorOption && sizeOption) {
        const existingColorValues = await ctx.db
          .query("productOptionValues")
          .withIndex("by_option_order", q => q.eq("optionId", colorOption._id))
          .take(10);
        const existingSizeValues = await ctx.db
          .query("productOptionValues")
          .withIndex("by_option_order", q => q.eq("optionId", sizeOption._id))
          .take(10);

        const colorValues = existingColorValues.length > 0
          ? existingColorValues
          : await (async () => {
              const colorIds = await Promise.all([
                ctx.db.insert("productOptionValues", { active: true, colorCode: "#ef4444", optionId: colorOption._id, order: 0, value: "Đỏ" }),
                ctx.db.insert("productOptionValues", { active: true, colorCode: "#3b82f6", optionId: colorOption._id, order: 1, value: "Xanh" }),
              ]);
              const values = await Promise.all(colorIds.map((id) => ctx.db.get(id)));
              return values.filter((value): value is NonNullable<typeof value> => Boolean(value));
            })();

        const sizeValues = existingSizeValues.length > 0
          ? existingSizeValues
          : await (async () => {
              const sizeIds = await Promise.all([
                ctx.db.insert("productOptionValues", { active: true, optionId: sizeOption._id, order: 0, value: "S" }),
                ctx.db.insert("productOptionValues", { active: true, optionId: sizeOption._id, order: 1, value: "M" }),
              ]);
              const values = await Promise.all(sizeIds.map((id) => ctx.db.get(id)));
              return values.filter((value): value is NonNullable<typeof value> => Boolean(value));
            })();

        const products = await ctx.db.query("products").order("asc").take(2);
        for (const product of products) {
          await ctx.db.patch(product._id, { hasVariants: true, optionIds: [colorOption._id, sizeOption._id] });

          let order = 0;
          for (const colorValue of colorValues) {
            if (!colorValue) {continue;}
            for (const sizeValue of sizeValues) {
              if (!sizeValue) {continue;}
              await ctx.db.insert("productVariants", {
                optionValues: [
                  { optionId: colorOption._id, valueId: colorValue._id },
                  { optionId: sizeOption._id, valueId: sizeValue._id },
                ],
                order,
                price: product.price,
                productId: product._id,
                salePrice: product.salePrice,
                sku: `${product.sku}-${order + 1}`,
                status: "Active",
                stock: Math.max(0, Math.floor(product.stock / 2)),
              });
              order += 1;
            }
          }
        }
      }
    }

    // 7. Initialize product stats (counter table)
    const existingStats = await ctx.db.query("productStats").first();
    if (!existingStats) {
      const products = await ctx.db.query("products").collect();
      const counts = { Active: 0, Archived: 0, Draft: 0, total: 0 };
      let maxOrder = 0;
      for (const p of products) {
        counts.total++;
        counts[p.status as keyof typeof counts]++;
        if (p.order > maxOrder) {maxOrder = p.order;}
      }
      await Promise.all([
        ctx.db.insert("productStats", { count: counts.total, key: "total", lastOrder: maxOrder }),
        ctx.db.insert("productStats", { count: counts.Active, key: "Active", lastOrder: 0 }),
        ctx.db.insert("productStats", { count: counts.Draft, key: "Draft", lastOrder: 0 }),
        ctx.db.insert("productStats", { count: counts.Archived, key: "Archived", lastOrder: 0 }),
      ]);
    }

    return null;
  },
  returns: v.null(),
});

// Clear products DATA only (products, categories, stats) - keeps config
export const clearProductsData = mutation({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    await Promise.all(products.map( async (p) => ctx.db.delete(p._id)));
    
    const categories = await ctx.db.query("productCategories").collect();
    await Promise.all(categories.map( async (cat) => ctx.db.delete(cat._id)));
    
    // Also clear product stats
    const stats = await ctx.db.query("productStats").collect();
    await Promise.all(stats.map( async (s) => ctx.db.delete(s._id)));
    
    return null;
  },
  returns: v.null(),
});

// Clear products module CONFIG (features, fields, settings)
export const clearProductsConfig = mutation({
  args: {},
  handler: async (ctx) => {
    const features = await ctx.db.query("moduleFeatures").withIndex("by_module", q => q.eq("moduleKey", "products")).collect();
    for (const f of features) {
      await ctx.db.delete(f._id);
    }
    const fields = await ctx.db.query("moduleFields").withIndex("by_module", q => q.eq("moduleKey", "products")).collect();
    for (const f of fields) {
      await ctx.db.delete(f._id);
    }
    const catFields = await ctx.db.query("moduleFields").withIndex("by_module", q => q.eq("moduleKey", "productCategories")).collect();
    for (const f of catFields) {
      await ctx.db.delete(f._id);
    }
    const settings = await ctx.db.query("moduleSettings").withIndex("by_module", q => q.eq("moduleKey", "products")).collect();
    for (const s of settings) {
      await ctx.db.delete(s._id);
    }
    return null;
  },
  returns: v.null(),
});

// ============ COMMENTS MODULE ============

export const seedCommentsModule = mutation({
  args: { configOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    void args;
    await syncModuleRuntimeConfig(ctx, "comments");

    return null;
  },
  returns: v.null(),
});

// Clear comments module CONFIG (features, fields, settings)
export const clearCommentsConfig = mutation({
  args: {},
  handler: async (ctx) => {
    const features = await ctx.db.query("moduleFeatures").withIndex("by_module", q => q.eq("moduleKey", "comments")).collect();
    for (const f of features) {
      await ctx.db.delete(f._id);
    }
    const fields = await ctx.db.query("moduleFields").withIndex("by_module", q => q.eq("moduleKey", "comments")).collect();
    for (const f of fields) {
      await ctx.db.delete(f._id);
    }
    const settings = await ctx.db.query("moduleSettings").withIndex("by_module", q => q.eq("moduleKey", "comments")).collect();
    for (const s of settings) {
      await ctx.db.delete(s._id);
    }
    return null;
  },
  returns: v.null(),
});

// ============ ORDERS MODULE ============

export const seedOrdersModule = mutation({
  args: { configOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const configOnly = args.configOnly ?? false;

    if (!configOnly) {
      // 1. Ensure customers exist
      let customers = await ctx.db.query("customers").collect();
      if (customers.length === 0) {
        const customerData = [
          { address: "123 Nguyễn Huệ, Q.1", city: "Hồ Chí Minh", email: "nguyenvanan@gmail.com", name: "Nguyễn Văn An", ordersCount: 0, phone: "0901234567", status: "Active" as const, totalSpent: 0 },
          { address: "456 Lê Lợi, Q.3", city: "Hồ Chí Minh", email: "tranthibinh@gmail.com", name: "Trần Thị Bình", ordersCount: 0, phone: "0912345678", status: "Active" as const, totalSpent: 0 },
          { address: "789 Trần Hưng Đạo, Q.5", city: "Hà Nội", email: "levancuong@gmail.com", name: "Lê Văn Cường", ordersCount: 0, phone: "0923456789", status: "Active" as const, totalSpent: 0 },
        ];
        for (const c of customerData) {
          await ctx.db.insert("customers", c);
        }
        customers = await ctx.db.query("customers").collect();
      }

      // 2. Ensure products exist
      const products = await ctx.db.query("products").collect();
      if (products.length === 0) {
        console.log("No products found. Please seed products first.");
        return null;
      }

      // 3. Seed orders
      const existingOrders = await ctx.db.query("orders").first();
      if (!existingOrders) {
        const ordersData = [
        {
          customerId: customers[0]._id,
          items: [
            { price: products[0].price, productId: products[0]._id, productName: products[0].name, quantity: 1 },
            { price: products[1] ? products[1].price : products[0].price, productId: products[1] ? products[1]._id : products[0]._id, productName: products[1] ? products[1].name : products[0].name, quantity: 2 },
          ],
          orderNumber: "ORD-20250101-1001",
          paymentMethod: "COD" as const,
          paymentStatus: "Paid" as const,
          shippingAddress: "123 Nguyễn Huệ, Q.1, TP.HCM",
          shippingFee: 30_000,
          status: "Delivered" as const,
          subtotal: products[0].price + (products[1] ? products[1].price * 2 : products[0].price * 2),
          totalAmount: products[0].price + (products[1] ? products[1].price * 2 : products[0].price * 2) + 30_000,
          trackingNumber: "VN123456789",
        },
        {
          customerId: customers[1]._id,
          items: [
            { price: products[2] ? products[2].price : products[0].price, productId: products[2] ? products[2]._id : products[0]._id, productName: products[2] ? products[2].name : products[0].name, quantity: 1 },
          ],
          orderNumber: "ORD-20250102-1002",
          paymentMethod: "BankTransfer" as const,
          paymentStatus: "Paid" as const,
          shippingAddress: "456 Lê Lợi, Q.3, TP.HCM",
          shippingFee: 25_000,
          status: "Shipped" as const,
          subtotal: products[2] ? products[2].price : products[0].price,
          totalAmount: (products[2] ? products[2].price : products[0].price) + 25_000,
          trackingNumber: "VN987654321",
        },
        {
          customerId: customers[2]._id,
          items: [
            { price: products[0].price, productId: products[0]._id, productName: products[0].name, quantity: 1 },
          ],
          orderNumber: "ORD-20250103-1003",
          paymentMethod: "CreditCard" as const,
          paymentStatus: "Paid" as const,
          shippingAddress: "789 Trần Hưng Đạo, Q.5, Hà Nội",
          shippingFee: 35_000,
          status: "Processing" as const,
          subtotal: products[0].price,
          totalAmount: products[0].price + 35_000,
        },
        {
          customerId: customers[0]._id,
          items: [
            { price: products[3] ? products[3].price : products[0].price, productId: products[3] ? products[3]._id : products[0]._id, productName: products[3] ? products[3].name : products[0].name, quantity: 3 },
          ],
          note: "Giao giờ hành chính",
          orderNumber: "ORD-20250104-1004",
          paymentMethod: "EWallet" as const,
          paymentStatus: "Pending" as const,
          shippingAddress: "123 Nguyễn Huệ, Q.1, TP.HCM",
          shippingFee: 0,
          status: "Pending" as const,
          subtotal: (products[3] ? products[3].price : products[0].price) * 3,
          totalAmount: (products[3] ? products[3].price : products[0].price) * 3,
        },
        {
          customerId: customers[1]._id,
          items: [
            { price: products[4] ? products[4].price : products[0].price, productId: products[4] ? products[4]._id : products[0]._id, productName: products[4] ? products[4].name : products[0].name, quantity: 1 },
          ],
          note: "Khách hủy đơn",
          orderNumber: "ORD-20250105-1005",
          paymentMethod: "COD" as const,
          paymentStatus: "Refunded" as const,
          shippingAddress: "456 Lê Lợi, Q.3, TP.HCM",
          shippingFee: 20_000,
          status: "Cancelled" as const,
          subtotal: products[4] ? products[4].price : products[0].price,
          totalAmount: (products[4] ? products[4].price : products[0].price) + 20_000,
        },
      ];
        for (const order of ordersData) {
          await ctx.db.insert("orders", order);
        }
      }
    }

    // 4. Seed module features
    const existingFeatures = await ctx.db.query("moduleFeatures").withIndex("by_module", q => q.eq("moduleKey", "orders")).first();
    if (!existingFeatures) {
      const features = [
        { description: "Phương thức & trạng thái thanh toán", enabled: true, featureKey: "enablePayment", linkedFieldKey: "paymentMethod", moduleKey: "orders", name: "Thanh toán" },
        { description: "Phí ship, địa chỉ giao hàng", enabled: true, featureKey: "enableShipping", linkedFieldKey: "shippingAddress", moduleKey: "orders", name: "Vận chuyển" },
        { description: "Mã vận đơn, tracking", enabled: true, featureKey: "enableTracking", linkedFieldKey: "trackingNumber", moduleKey: "orders", name: "Theo dõi vận đơn" },
      ];
      for (const feature of features) {
        await ctx.db.insert("moduleFeatures", feature);
      }
    }

    // 5. Seed module fields
    const existingFields = await ctx.db.query("moduleFields").withIndex("by_module", q => q.eq("moduleKey", "orders")).first();
    if (!existingFields) {
      const fields = [
        { enabled: true, fieldKey: "orderNumber", isSystem: true, moduleKey: "orders", name: "Mã đơn hàng", order: 0, required: true, type: "text" as const },
        { enabled: true, fieldKey: "customerId", isSystem: true, moduleKey: "orders", name: "Khách hàng", order: 1, required: true, type: "select" as const },
        { enabled: true, fieldKey: "status", isSystem: true, moduleKey: "orders", name: "Trạng thái đơn", order: 2, required: true, type: "select" as const },
        { enabled: true, fieldKey: "totalAmount", isSystem: true, moduleKey: "orders", name: "Tổng tiền", order: 3, required: true, type: "price" as const },
        { enabled: true, fieldKey: "note", isSystem: false, moduleKey: "orders", name: "Ghi chú", order: 4, required: false, type: "textarea" as const },
        { enabled: true, fieldKey: "paymentMethod", isSystem: false, linkedFeature: "enablePayment", moduleKey: "orders", name: "Phương thức TT", order: 5, required: false, type: "select" as const },
        { enabled: true, fieldKey: "paymentStatus", isSystem: false, linkedFeature: "enablePayment", moduleKey: "orders", name: "Trạng thái TT", order: 6, required: false, type: "select" as const },
        { enabled: true, fieldKey: "subtotal", isSystem: false, linkedFeature: "enableShipping", moduleKey: "orders", name: "Tạm tính", order: 7, required: false, type: "price" as const },
        { enabled: true, fieldKey: "shippingFee", isSystem: false, linkedFeature: "enableShipping", moduleKey: "orders", name: "Phí vận chuyển", order: 8, required: false, type: "price" as const },
        { enabled: true, fieldKey: "shippingAddress", isSystem: false, linkedFeature: "enableShipping", moduleKey: "orders", name: "Địa chỉ giao", order: 9, required: false, type: "textarea" as const },
        { enabled: true, fieldKey: "trackingNumber", isSystem: false, linkedFeature: "enableTracking", moduleKey: "orders", name: "Mã vận đơn", order: 10, required: false, type: "text" as const },
      ];
      for (const field of fields) {
        await ctx.db.insert("moduleFields", field);
      }
    }

    // 6. Seed module settings
    const existingSettings = await ctx.db.query("moduleSettings").withIndex("by_module", q => q.eq("moduleKey", "orders")).first();
    if (!existingSettings) {
      await ctx.db.insert("moduleSettings", { moduleKey: "orders", settingKey: "ordersPerPage", value: 20 });
      await ctx.db.insert("moduleSettings", { moduleKey: "orders", settingKey: "orderStatusPreset", value: DEFAULT_ORDER_STATUS_PRESET });
      await ctx.db.insert("moduleSettings", {
        moduleKey: "orders",
        settingKey: "orderStatuses",
        value: JSON.stringify(ORDER_STATUS_PRESETS[DEFAULT_ORDER_STATUS_PRESET], null, 2),
      });
    }

    return null;
  },
  returns: v.null(),
});

// Clear orders DATA only
export const clearOrdersData = mutation({
  args: {},
  handler: async (ctx) => {
    const orders = await ctx.db.query("orders").collect();
    for (const order of orders) {
      await ctx.db.delete(order._id);
    }
    return null;
  },
  returns: v.null(),
});

// Clear orders module CONFIG
export const clearOrdersConfig = mutation({
  args: {},
  handler: async (ctx) => {
    const features = await ctx.db.query("moduleFeatures").withIndex("by_module", q => q.eq("moduleKey", "orders")).collect();
    for (const f of features) {
      await ctx.db.delete(f._id);
    }
    const fields = await ctx.db.query("moduleFields").withIndex("by_module", q => q.eq("moduleKey", "orders")).collect();
    for (const f of fields) {
      await ctx.db.delete(f._id);
    }
    const settings = await ctx.db.query("moduleSettings").withIndex("by_module", q => q.eq("moduleKey", "orders")).collect();
    for (const s of settings) {
      await ctx.db.delete(s._id);
    }
    return null;
  },
  returns: v.null(),
});

// ============ MEDIA MODULE ============

export const seedMediaModule = mutation({
  args: { configOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    void args;
    // 1. Seed module features
    const existingFeatures = await ctx.db.query("moduleFeatures").withIndex("by_module", q => q.eq("moduleKey", "media")).first();
    if (!existingFeatures) {
      const features = [
        { description: "Tổ chức media theo thư mục", enabled: true, featureKey: "enableFolders", linkedFieldKey: "folder", moduleKey: "media", name: "Thư mục" },
        { description: "Mô tả thay thế cho hình ảnh (SEO)", enabled: true, featureKey: "enableAltText", linkedFieldKey: "alt", moduleKey: "media", name: "Alt Text" },
        { description: "Lưu width/height của ảnh", enabled: true, featureKey: "enableDimensions", linkedFieldKey: "dimensions", moduleKey: "media", name: "Kích thước ảnh" },
      ];
      for (const feature of features) {
        await ctx.db.insert("moduleFeatures", feature);
      }
    }

    // 2. Seed module fields
    const existingFields = await ctx.db.query("moduleFields").withIndex("by_module", q => q.eq("moduleKey", "media")).first();
    if (!existingFields) {
      const fields = [
        { enabled: true, fieldKey: "filename", isSystem: true, moduleKey: "media", name: "Tên file", order: 0, required: true, type: "text" as const },
        { enabled: true, fieldKey: "mimeType", isSystem: true, moduleKey: "media", name: "Loại file", order: 1, required: true, type: "text" as const },
        { enabled: true, fieldKey: "size", isSystem: true, moduleKey: "media", name: "Kích thước", order: 2, required: true, type: "number" as const },
        { enabled: true, fieldKey: "storageId", isSystem: true, moduleKey: "media", name: "Storage ID", order: 3, required: true, type: "text" as const },
        { enabled: true, fieldKey: "folder", isSystem: false, linkedFeature: "enableFolders", moduleKey: "media", name: "Thư mục", order: 4, required: false, type: "select" as const },
        { enabled: true, fieldKey: "alt", isSystem: false, linkedFeature: "enableAltText", moduleKey: "media", name: "Alt Text", order: 5, required: false, type: "text" as const },
        { enabled: true, fieldKey: "width", isSystem: false, linkedFeature: "enableDimensions", moduleKey: "media", name: "Chiều rộng", order: 6, required: false, type: "number" as const },
        { enabled: true, fieldKey: "height", isSystem: false, linkedFeature: "enableDimensions", moduleKey: "media", name: "Chiều cao", order: 7, required: false, type: "number" as const },
        { enabled: false, fieldKey: "uploadedBy", isSystem: false, moduleKey: "media", name: "Người upload", order: 8, required: false, type: "select" as const },
      ];
      for (const field of fields) {
        await ctx.db.insert("moduleFields", field);
      }
    }

    // 3. Seed module settings
    const existingSettings = await ctx.db.query("moduleSettings").withIndex("by_module", q => q.eq("moduleKey", "media")).first();
    if (!existingSettings) {
      await ctx.db.insert("moduleSettings", { moduleKey: "media", settingKey: "itemsPerPage", value: 24 });
      await ctx.db.insert("moduleSettings", { moduleKey: "media", settingKey: "maxFileSize", value: 5 });
      await ctx.db.insert("moduleSettings", { moduleKey: "media", settingKey: "allowedTypes", value: "image/*,video/*,application/pdf" });
    }

    return null;
  },
  returns: v.null(),
});

// Clear media DATA only (images table)
export const clearMediaData = mutation({
  args: {},
  handler: async (ctx) => {
    const images = await ctx.db.query("images").collect();
    for (const img of images) {
      try {
        await ctx.storage.delete(img.storageId);
      } catch {
        // Storage file might already be deleted
      }
      await ctx.db.delete(img._id);
    }
    // Clear counter tables
    const stats = await ctx.db.query("mediaStats").collect();
    for (const s of stats) {await ctx.db.delete(s._id);}
    const folders = await ctx.db.query("mediaFolders").collect();
    for (const f of folders) {await ctx.db.delete(f._id);}
    return null;
  },
  returns: v.null(),
});

// Sync media counters from existing data (run once after migration)
export const syncMediaCounters = mutation({
  args: {},
  handler: async (ctx) => {
    // Clear existing counters
    const existingStats = await ctx.db.query("mediaStats").collect();
    for (const s of existingStats) {await ctx.db.delete(s._id);}
    const existingFolders = await ctx.db.query("mediaFolders").collect();
    for (const f of existingFolders) {await ctx.db.delete(f._id);}

    // Scan all images and aggregate
    const images = await ctx.db.query("images").collect();
    
    const stats: Record<string, { count: number; totalSize: number }> = {
      document: { count: 0, totalSize: 0 },
      image: { count: 0, totalSize: 0 },
      other: { count: 0, totalSize: 0 },
      total: { count: 0, totalSize: 0 },
      video: { count: 0, totalSize: 0 },
    };
    const folders: Record<string, number> = {};

    for (const img of images) {
      stats.total.count++;
      stats.total.totalSize += img.size;

      // Determine type
      let typeKey: "image" | "video" | "document" | "other" = "other";
      if (img.mimeType.startsWith("image/")) {typeKey = "image";}
      else if (img.mimeType.startsWith("video/")) {typeKey = "video";}
      else if (img.mimeType === "application/pdf" || img.mimeType.includes("document") || img.mimeType.includes("spreadsheet")) {
        typeKey = "document";
      }
      stats[typeKey].count++;
      stats[typeKey].totalSize += img.size;

      // Count folder
      if (img.folder) {
        folders[img.folder] = (folders[img.folder] || 0) + 1;
      }
    }

    // Insert stats
    for (const [key, { count, totalSize }] of Object.entries(stats)) {
      if (count > 0) {
        await ctx.db.insert("mediaStats", { count, key, totalSize });
      }
    }

    // Insert folders
    for (const [name, count] of Object.entries(folders)) {
      await ctx.db.insert("mediaFolders", { count, name });
    }

    return { folders, stats };
  },
  returns: v.object({ folders: v.any(), stats: v.any() }),
});

// Clear media module CONFIG (features, fields, settings)
export const clearMediaConfig = mutation({
  args: {},
  handler: async (ctx) => {
    const features = await ctx.db.query("moduleFeatures").withIndex("by_module", q => q.eq("moduleKey", "media")).collect();
    for (const f of features) {
      await ctx.db.delete(f._id);
    }
    const fields = await ctx.db.query("moduleFields").withIndex("by_module", q => q.eq("moduleKey", "media")).collect();
    for (const f of fields) {
      await ctx.db.delete(f._id);
    }
    const settings = await ctx.db.query("moduleSettings").withIndex("by_module", q => q.eq("moduleKey", "media")).collect();
    for (const s of settings) {
      await ctx.db.delete(s._id);
    }
    return null;
  },
  returns: v.null(),
});

// ============ CUSTOMERS MODULE ============

export const seedCustomersModule = mutation({
  args: { configOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const configOnly = args.configOnly ?? false;

    if (!configOnly) {
      // 1. Seed customers data if not exists
      const existingCustomers = await ctx.db.query("customers").first();
      if (!existingCustomers) {
        const customers = [
          { address: "123 Nguyễn Huệ, Q.1", city: "Hồ Chí Minh", email: "nguyenvanan@gmail.com", name: "Nguyễn Văn An", ordersCount: 5, phone: "0901234567", status: "Active" as const, totalSpent: 15_000_000 },
          { address: "456 Lê Lợi, Q.3", city: "Hồ Chí Minh", email: "tranthibinh@gmail.com", name: "Trần Thị Bình", ordersCount: 3, phone: "0912345678", status: "Active" as const, totalSpent: 8_500_000 },
          { address: "789 Trần Hưng Đạo", city: "Hà Nội", email: "levancuong@gmail.com", name: "Lê Văn Cường", ordersCount: 8, phone: "0923456789", status: "Active" as const, totalSpent: 25_000_000 },
          { address: "321 Hai Bà Trưng", city: "Đà Nẵng", email: "phamthidung@gmail.com", name: "Phạm Thị Dung", ordersCount: 2, phone: "0934567890", status: "Active" as const, totalSpent: 4_200_000 },
          { address: "654 Phan Đình Phùng", city: "Cần Thơ", email: "hoangvanem@gmail.com", name: "Hoàng Văn Em", ordersCount: 1, phone: "0945678901", status: "Inactive" as const, totalSpent: 1_500_000 },
          { address: "987 Nguyễn Trãi, Q.5", city: "Hồ Chí Minh", email: "vuthiphuong@gmail.com", name: "Vũ Thị Phương", notes: "VIP Customer", ordersCount: 12, phone: "0956789012", status: "Active" as const, totalSpent: 45_000_000 },
          { address: "147 Lý Thường Kiệt", city: "Hà Nội", email: "dovangiang@gmail.com", name: "Đỗ Văn Giang", ordersCount: 0, phone: "0967890123", status: "Active" as const, totalSpent: 0 },
          { address: "258 Trần Phú", city: "Nha Trang", email: "ngothihanh@gmail.com", name: "Ngô Thị Hạnh", ordersCount: 4, phone: "0978901234", status: "Inactive" as const, totalSpent: 12_000_000 },
        ];
        for (const c of customers) {
          await ctx.db.insert("customers", c);
        }
      }
    }

    // 2. Seed module features
    const existingFeatures = await ctx.db.query("moduleFeatures").withIndex("by_module", q => q.eq("moduleKey", "customers")).first();
    if (!existingFeatures) {
      const features = [
        { description: "Cho phép khách hàng tạo tài khoản và đăng nhập", enabled: false, featureKey: "enableLogin", linkedFieldKey: "password", moduleKey: "customers", name: "Đăng nhập KH" },
        { description: "Lưu nhiều địa chỉ giao hàng cho khách", enabled: true, featureKey: "enableAddresses", linkedFieldKey: "addresses", moduleKey: "customers", name: "Sổ địa chỉ" },
        { description: "Cho phép khách hàng có ảnh đại diện", enabled: false, featureKey: "enableAvatar", linkedFieldKey: "avatar", moduleKey: "customers", name: "Ảnh đại diện" },
        { description: "Thêm ghi chú nội bộ cho khách hàng", enabled: true, featureKey: "enableNotes", linkedFieldKey: "notes", moduleKey: "customers", name: "Ghi chú" },
      ];
      for (const feature of features) {
        await ctx.db.insert("moduleFeatures", feature);
      }
    }

    // 3. Seed module fields
    const existingFields = await ctx.db.query("moduleFields").withIndex("by_module", q => q.eq("moduleKey", "customers")).first();
    if (!existingFields) {
      const fields = [
        { enabled: true, fieldKey: "name", isSystem: true, moduleKey: "customers", name: "Họ và tên", order: 0, required: true, type: "text" as const },
        { enabled: true, fieldKey: "email", isSystem: true, moduleKey: "customers", name: "Email", order: 1, required: true, type: "email" as const },
        { enabled: true, fieldKey: "phone", isSystem: true, moduleKey: "customers", name: "Số điện thoại", order: 2, required: true, type: "phone" as const },
        { enabled: true, fieldKey: "status", isSystem: true, moduleKey: "customers", name: "Trạng thái", order: 3, required: true, type: "select" as const },
        { enabled: true, fieldKey: "address", isSystem: false, moduleKey: "customers", name: "Địa chỉ", order: 4, required: false, type: "textarea" as const },
        { enabled: true, fieldKey: "city", isSystem: false, moduleKey: "customers", name: "Thành phố", order: 5, required: false, type: "text" as const },
        { enabled: false, fieldKey: "avatar", isSystem: false, linkedFeature: "enableAvatar", moduleKey: "customers", name: "Ảnh đại diện", order: 6, required: false, type: "image" as const },
        { enabled: false, fieldKey: "password", isSystem: false, linkedFeature: "enableLogin", moduleKey: "customers", name: "Mật khẩu", order: 7, required: false, type: "password" as const },
        { enabled: true, fieldKey: "notes", isSystem: false, linkedFeature: "enableNotes", moduleKey: "customers", name: "Ghi chú", order: 8, required: false, type: "textarea" as const },
      ];
      for (const field of fields) {
        await ctx.db.insert("moduleFields", field);
      }
    }

    // 4. Seed module settings
    const existingSettings = await ctx.db.query("moduleSettings").withIndex("by_module", q => q.eq("moduleKey", "customers")).first();
    if (!existingSettings) {
      await ctx.db.insert("moduleSettings", { moduleKey: "customers", settingKey: "customersPerPage", value: 20 });
      await ctx.db.insert("moduleSettings", { moduleKey: "customers", settingKey: "defaultStatus", value: "Active" });
    }

    return null;
  },
  returns: v.null(),
});

// CUST-002 FIX: Clear customers DATA only - using Promise.all
export const clearCustomersData = mutation({
  args: {},
  handler: async (ctx) => {
    const customers = await ctx.db.query("customers").collect();
    await Promise.all(customers.map( async c => ctx.db.delete(c._id)));
    return null;
  },
  returns: v.null(),
});

// CUST-002 FIX: Clear customers module CONFIG - using Promise.all
export const clearCustomersConfig = mutation({
  args: {},
  handler: async (ctx) => {
    const [features, fields, settings] = await Promise.all([
      ctx.db.query("moduleFeatures").withIndex("by_module", q => q.eq("moduleKey", "customers")).collect(),
      ctx.db.query("moduleFields").withIndex("by_module", q => q.eq("moduleKey", "customers")).collect(),
      ctx.db.query("moduleSettings").withIndex("by_module", q => q.eq("moduleKey", "customers")).collect(),
    ]);
    await Promise.all([
      ...features.map( async f => ctx.db.delete(f._id)),
      ...fields.map( async f => ctx.db.delete(f._id)),
      ...settings.map( async s => ctx.db.delete(s._id)),
    ]);
    return null;
  },
  returns: v.null(),
});

// ============ WISHLIST MODULE ============

export const seedWishlistModule = mutation({
  args: { configOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const configOnly = args.configOnly ?? false;

    if (!configOnly) {
      // 1. Ensure customers exist
      const customers = await ctx.db.query("customers").collect();
      if (customers.length === 0) {
        console.log("No customers found. Please seed customers first.");
        return null;
      }

      // 2. Ensure products exist
      const products = await ctx.db.query("products").collect();
      if (products.length === 0) {
        console.log("No products found. Please seed products first.");
        return null;
      }

      // 3. Seed wishlist items
      const existingWishlist = await ctx.db.query("wishlist").first();
      if (!existingWishlist) {
        const wishlistData = [];
        
        // Customer 1: 3 products
        if (customers[0] && products[0]) {
          wishlistData.push({ customerId: customers[0]._id, productId: products[0]._id });
        }
        if (customers[0] && products[2]) {
          wishlistData.push({ customerId: customers[0]._id, productId: products[2]._id });
        }
        if (customers[0] && products[4]) {
          wishlistData.push({ customerId: customers[0]._id, note: "Chờ giảm giá", productId: products[4]._id });
        }
        
        // Customer 2: 2 products
        if (customers[1] && products[1]) {
          wishlistData.push({ customerId: customers[1]._id, productId: products[1]._id });
        }
        if (customers[1] && products[3]) {
          wishlistData.push({ customerId: customers[1]._id, note: "Mua làm quà", productId: products[3]._id });
        }
        
        // Customer 3: 1 product
        if (customers[2] && products[5]) {
          wishlistData.push({ customerId: customers[2]._id, productId: products[5]._id });
        }

        for (const item of wishlistData) {
          await ctx.db.insert("wishlist", item);
        }
      }
    }

    // 4. Seed module features
    const existingFeatures = await ctx.db.query("moduleFeatures").withIndex("by_module", q => q.eq("moduleKey", "wishlist")).first();
    if (!existingFeatures) {
      const features = [
        { description: "Cho phép khách thêm ghi chú cho SP yêu thích", enabled: true, featureKey: "enableNote", linkedFieldKey: "note", moduleKey: "wishlist", name: "Ghi chú" },
        { description: "Thông báo khi SP giảm giá/có hàng", enabled: false, featureKey: "enableNotification", moduleKey: "wishlist", name: "Thông báo" },
      ];
      for (const feature of features) {
        await ctx.db.insert("moduleFeatures", feature);
      }
    }

    // 5. Seed module fields
    const existingFields = await ctx.db.query("moduleFields").withIndex("by_module", q => q.eq("moduleKey", "wishlist")).first();
    if (!existingFields) {
      const fields = [
        { enabled: true, fieldKey: "customerId", isSystem: true, moduleKey: "wishlist", name: "Khách hàng", order: 0, required: true, type: "select" as const },
        { enabled: true, fieldKey: "productId", isSystem: true, moduleKey: "wishlist", name: "Sản phẩm", order: 1, required: true, type: "select" as const },
        { enabled: true, fieldKey: "variantId", isSystem: false, moduleKey: "wishlist", name: "Phiên bản", order: 2, required: false, type: "select" as const },
        { enabled: true, fieldKey: "note", isSystem: false, linkedFeature: "enableNote", moduleKey: "wishlist", name: "Ghi chú", order: 3, required: false, type: "textarea" as const },
        { enabled: true, fieldKey: "createdAt", isSystem: true, moduleKey: "wishlist", name: "Ngày thêm", order: 4, required: false, type: "date" as const },
      ];
      for (const field of fields) {
        await ctx.db.insert("moduleFields", field);
      }
    }

    // 6. Seed module settings
    const existingSettings = await ctx.db.query("moduleSettings").withIndex("by_module", q => q.eq("moduleKey", "wishlist")).first();
    if (!existingSettings) {
      await ctx.db.insert("moduleSettings", { moduleKey: "wishlist", settingKey: "maxItemsPerCustomer", value: 50 });
      await ctx.db.insert("moduleSettings", { moduleKey: "wishlist", settingKey: "itemsPerPage", value: 20 });
    }

    return null;
  },
  returns: v.null(),
});

// WL-009 FIX: Clear wishlist DATA only - sử dụng Promise.all
export const clearWishlistData = mutation({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("wishlist").collect();
    await Promise.all(items.map( async item => ctx.db.delete(item._id)));
    return null;
  },
  returns: v.null(),
});

// WL-009 FIX: Clear wishlist module CONFIG - sử dụng Promise.all
export const clearWishlistConfig = mutation({
  args: {},
  handler: async (ctx) => {
    const [features, fields, settings] = await Promise.all([
      ctx.db.query("moduleFeatures").withIndex("by_module", q => q.eq("moduleKey", "wishlist")).collect(),
      ctx.db.query("moduleFields").withIndex("by_module", q => q.eq("moduleKey", "wishlist")).collect(),
      ctx.db.query("moduleSettings").withIndex("by_module", q => q.eq("moduleKey", "wishlist")).collect(),
    ]);
    await Promise.all([
      ...features.map( async f => ctx.db.delete(f._id)),
      ...fields.map( async f => ctx.db.delete(f._id)),
      ...settings.map( async s => ctx.db.delete(s._id)),
    ]);
    return null;
  },
  returns: v.null(),
});

// ============ CART MODULE ============

export const seedCartModule = mutation({
  args: { configOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const configOnly = args.configOnly ?? false;

    if (!configOnly) {
      // 1. Ensure products exist
      const products = await ctx.db.query("products").collect();
      if (products.length === 0) {
        console.log("No products found. Please seed products first.");
        return null;
      }

      // 2. Ensure customers exist
      let customers = await ctx.db.query("customers").collect();
      if (customers.length === 0) {
        const customerData = [
          { address: "123 Nguyễn Huệ, Q.1", city: "Hồ Chí Minh", email: "nguyenvanan@gmail.com", name: "Nguyễn Văn An", ordersCount: 0, phone: "0901234567", status: "Active" as const, totalSpent: 0 },
          { address: "456 Lê Lợi, Q.3", city: "Hồ Chí Minh", email: "tranthibinh@gmail.com", name: "Trần Thị Bình", ordersCount: 0, phone: "0912345678", status: "Active" as const, totalSpent: 0 },
        ];
        for (const c of customerData) {
          await ctx.db.insert("customers", c);
        }
        customers = await ctx.db.query("customers").collect();
      }

      // 3. Seed carts and cart items
      const existingCarts = await ctx.db.query("carts").first();
      if (!existingCarts) {
        // Active cart with items
        const cart1Id = await ctx.db.insert("carts", {
          customerId: customers[0]._id,
          expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
          itemsCount: 3,
          status: "Active",
          totalAmount: products[0].price + (products[1] ? products[1].price * 2 : products[0].price * 2),
        });
        await ctx.db.insert("cartItems", {
          cartId: cart1Id,
          price: products[0].price,
          productId: products[0]._id,
          productImage: products[0].image,
          productName: products[0].name,
          quantity: 1,
          subtotal: products[0].price,
        });
        if (products[1]) {
          await ctx.db.insert("cartItems", {
            cartId: cart1Id,
            price: products[1].price,
            productId: products[1]._id,
            productImage: products[1].image,
            productName: products[1].name,
            quantity: 2,
            subtotal: products[1].price * 2,
          });
        }

        // Guest cart (session-based)
        const cart2Id = await ctx.db.insert("carts", {
          expiresAt: Date.now() + 3 * 24 * 60 * 60 * 1000,
          itemsCount: 1,
          sessionId: "session_abc123xyz",
          status: "Active",
          totalAmount: products[2] ? products[2].price : products[0].price,
        });
        await ctx.db.insert("cartItems", {
          cartId: cart2Id,
          price: products[2] ? products[2].price : products[0].price,
          productId: products[2] ? products[2]._id : products[0]._id,
          productImage: products[2] ? products[2].image : products[0].image,
          productName: products[2] ? products[2].name : products[0].name,
          quantity: 1,
          subtotal: products[2] ? products[2].price : products[0].price,
        });

        // Abandoned cart
        await ctx.db.insert("carts", {
          customerId: customers[1] ? customers[1]._id : customers[0]._id,
          expiresAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
          itemsCount: 2,
          status: "Abandoned",
          totalAmount: (products[3] ? products[3].price : products[0].price) * 2,
        });

        // Converted cart
        await ctx.db.insert("carts", {
          customerId: customers[0]._id,
          itemsCount: 1,
          status: "Converted",
          totalAmount: products[4] ? products[4].price : products[0].price,
        });
      }
    }

    // 4. Seed module features
    const existingFeatures = await ctx.db.query("moduleFeatures").withIndex("by_module", q => q.eq("moduleKey", "cart")).first();
    if (!existingFeatures) {
      const features = [
        { description: "Tự động đánh dấu abandoned sau N ngày", enabled: true, featureKey: "enableExpiry", linkedFieldKey: "expiresAt", moduleKey: "cart", name: "Hết hạn giỏ hàng" },
        { description: "Cho phép thêm ghi chú vào giỏ hàng", enabled: false, featureKey: "enableNote", linkedFieldKey: "note", moduleKey: "cart", name: "Ghi chú" },
      ];
      for (const feature of features) {
        await ctx.db.insert("moduleFeatures", feature);
      }
    }

    // 5. Seed module fields
    const existingFields = await ctx.db.query("moduleFields").withIndex("by_module", q => q.eq("moduleKey", "cart")).first();
    if (!existingFields) {
      const cartFields = [
        { enabled: true, fieldKey: "customerId", isSystem: true, moduleKey: "cart", name: "Khách hàng", order: 0, required: false, type: "select" as const },
        { enabled: true, fieldKey: "status", isSystem: true, moduleKey: "cart", name: "Trạng thái", order: 1, required: true, type: "select" as const },
        { enabled: true, fieldKey: "itemsCount", isSystem: true, moduleKey: "cart", name: "Số lượng SP", order: 2, required: true, type: "number" as const },
        { enabled: true, fieldKey: "totalAmount", isSystem: true, moduleKey: "cart", name: "Tổng tiền", order: 3, required: true, type: "price" as const },
        { enabled: true, fieldKey: "expiresAt", isSystem: false, linkedFeature: "enableExpiry", moduleKey: "cart", name: "Thời gian hết hạn", order: 4, required: false, type: "date" as const },
        { enabled: false, fieldKey: "note", isSystem: false, linkedFeature: "enableNote", moduleKey: "cart", name: "Ghi chú", order: 5, required: false, type: "textarea" as const },
      ];
      for (const field of cartFields) {
        await ctx.db.insert("moduleFields", field);
      }

      const cartItemFields = [
        { enabled: true, fieldKey: "productId", isSystem: true, moduleKey: "cartItems", name: "Sản phẩm", order: 0, required: true, type: "select" as const },
        { enabled: true, fieldKey: "variantId", isSystem: false, moduleKey: "cartItems", name: "Phiên bản", order: 1, required: false, type: "select" as const },
        { enabled: true, fieldKey: "productName", isSystem: true, moduleKey: "cartItems", name: "Tên sản phẩm", order: 2, required: true, type: "text" as const },
        { enabled: true, fieldKey: "quantity", isSystem: true, moduleKey: "cartItems", name: "Số lượng", order: 3, required: true, type: "number" as const },
        { enabled: true, fieldKey: "price", isSystem: true, moduleKey: "cartItems", name: "Đơn giá", order: 4, required: true, type: "price" as const },
        { enabled: true, fieldKey: "subtotal", isSystem: true, moduleKey: "cartItems", name: "Thành tiền", order: 5, required: true, type: "price" as const },
        { enabled: true, fieldKey: "productImage", isSystem: false, moduleKey: "cartItems", name: "Ảnh sản phẩm", order: 6, required: false, type: "image" as const },
      ];
      for (const field of cartItemFields) {
        await ctx.db.insert("moduleFields", field);
      }
    }

    // 6. Seed module settings
    const existingSettings = await ctx.db.query("moduleSettings").withIndex("by_module", q => q.eq("moduleKey", "cart")).first();
    if (!existingSettings) {
      await ctx.db.insert("moduleSettings", { moduleKey: "cart", settingKey: "cartsPerPage", value: 20 });
      await ctx.db.insert("moduleSettings", { moduleKey: "cart", settingKey: "expiryDays", value: 7 });
      await ctx.db.insert("moduleSettings", { moduleKey: "cart", settingKey: "maxItemsPerCart", value: 50 });
      await ctx.db.insert("moduleSettings", { moduleKey: "cart", settingKey: "autoCleanupAbandoned", value: true });
    }

    return null;
  },
  returns: v.null(),
});

// Clear cart DATA only
export const clearCartData = mutation({
  args: {},
  handler: async (ctx) => {
    const cartItems = await ctx.db.query("cartItems").collect();
    for (const item of cartItems) {
      await ctx.db.delete(item._id);
    }
    const carts = await ctx.db.query("carts").collect();
    for (const cart of carts) {
      await ctx.db.delete(cart._id);
    }
    return null;
  },
  returns: v.null(),
});

// Clear cart module CONFIG
export const clearCartConfig = mutation({
  args: {},
  handler: async (ctx) => {
    const features = await ctx.db.query("moduleFeatures").withIndex("by_module", q => q.eq("moduleKey", "cart")).collect();
    for (const f of features) {
      await ctx.db.delete(f._id);
    }
    const cartFields = await ctx.db.query("moduleFields").withIndex("by_module", q => q.eq("moduleKey", "cart")).collect();
    for (const f of cartFields) {
      await ctx.db.delete(f._id);
    }
    const cartItemFields = await ctx.db.query("moduleFields").withIndex("by_module", q => q.eq("moduleKey", "cartItems")).collect();
    for (const f of cartItemFields) {
      await ctx.db.delete(f._id);
    }
    const settings = await ctx.db.query("moduleSettings").withIndex("by_module", q => q.eq("moduleKey", "cart")).collect();
    for (const s of settings) {
      await ctx.db.delete(s._id);
    }
    return null;
  },
  returns: v.null(),
});

// ============ USERS MODULE ============

export const seedUsersModule = mutation({
  args: { configOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const configOnly = args.configOnly ?? false;

    if (!configOnly) {
      // 1. Seed roles if not exist
      const existingRoles = await ctx.db.query("roles").first();
      if (!existingRoles) {
        const roles: { name: string; description: string; color: string; isSystem: boolean; isSuperAdmin?: boolean; permissions: Record<string, string[]> }[] = [
          { color: "#ef4444", description: "Toàn quyền truy cập hệ thống", isSuperAdmin: true, isSystem: true, name: "Super Admin", permissions: { "*": ["*"] } },
          { color: "#3b82f6", description: "Quản trị viên hệ thống", isSystem: true, name: "Admin", permissions: { customers: ["read", "update"], kanban: ["read", "create", "update", "delete"], orders: ["read", "update"], posts: ["read", "create", "update", "delete"], products: ["read", "create", "update", "delete"], settings: ["read"], users: ["read"] } },
          { color: "#22c55e", description: "Biên tập viên nội dung", isSystem: false, name: "Editor", permissions: { media: ["read", "create"], posts: ["read", "create", "update"], products: ["read"] } },
          { color: "#f59e0b", description: "Kiểm duyệt viên", isSystem: false, name: "Moderator", permissions: { comments: ["read", "update", "delete"], customers: ["read"], posts: ["read"], products: ["read"] } },
        ];
        for (const role of roles) {
          await ctx.db.insert("roles", role);
        }
      }

      // 2. Get roles for users
      const superAdminRole = await ctx.db.query("roles").withIndex("by_name", q => q.eq("name", "Super Admin")).first();
      const adminRole = await ctx.db.query("roles").withIndex("by_name", q => q.eq("name", "Admin")).first();
      const editorRole = await ctx.db.query("roles").withIndex("by_name", q => q.eq("name", "Editor")).first();
      const moderatorRole = await ctx.db.query("roles").withIndex("by_name", q => q.eq("name", "Moderator")).first();

      // 3. Seed users if not exist
      const existingUsers = await ctx.db.query("users").first();
      if (!existingUsers && superAdminRole && adminRole && editorRole && moderatorRole) {
        const defaultPasswordHash = await hashPassword(DEFAULT_USER_PASSWORD);
        const users = [
          { avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=admin", email: "admin@example.com", lastLogin: Date.now() - 7_200_000, name: "Admin User", passwordHash: defaultPasswordHash, phone: "0912345678", roleId: adminRole._id, status: "Active" as const },
          { avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=editor", email: "editor@example.com", lastLogin: Date.now() - 86_400_000, name: "Nguyễn Văn Editor", passwordHash: defaultPasswordHash, phone: "0923456789", roleId: editorRole._id, status: "Active" as const },
          { avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=mod", email: "mod@example.com", name: "Trần Thị Moderator", passwordHash: defaultPasswordHash, phone: "0934567890", roleId: moderatorRole._id, status: "Active" as const },
          { email: "test@example.com", name: "Lê Văn Test", passwordHash: defaultPasswordHash, phone: "0945678901", roleId: editorRole._id, status: "Inactive" as const },
          { email: "banned@example.com", name: "Banned User", passwordHash: defaultPasswordHash, roleId: moderatorRole._id, status: "Banned" as const },
        ];
        for (const user of users) {
          await ctx.db.insert("users", user);
        }
      }
    }

    // 4. Seed module features
    const existingFeatures = await ctx.db.query("moduleFeatures").withIndex("by_module", q => q.eq("moduleKey", "users")).first();
    if (!existingFeatures) {
      const features = [
        { description: "Cho phép user có ảnh đại diện", enabled: true, featureKey: "enableAvatar", linkedFieldKey: "avatar", moduleKey: "users", name: "Ảnh đại diện" },
        { description: "Lưu số điện thoại của user", enabled: true, featureKey: "enablePhone", linkedFieldKey: "phone", moduleKey: "users", name: "Số điện thoại" },
        { description: "Theo dõi lần đăng nhập cuối", enabled: true, featureKey: "enableLastLogin", linkedFieldKey: "lastLogin", moduleKey: "users", name: "Đăng nhập cuối" },
      ];
      for (const feature of features) {
        await ctx.db.insert("moduleFeatures", feature);
      }
    }

    // 5. Seed module fields
    const existingFields = await ctx.db.query("moduleFields").withIndex("by_module", q => q.eq("moduleKey", "users")).first();
    if (!existingFields) {
      const fields = [
        { enabled: true, fieldKey: "name", isSystem: true, moduleKey: "users", name: "Họ và tên", order: 0, required: true, type: "text" as const },
        { enabled: true, fieldKey: "email", isSystem: true, moduleKey: "users", name: "Email", order: 1, required: true, type: "email" as const },
        { enabled: true, fieldKey: "roleId", isSystem: true, moduleKey: "users", name: "Vai trò", order: 2, required: true, type: "select" as const },
        { enabled: true, fieldKey: "status", isSystem: true, moduleKey: "users", name: "Trạng thái", order: 3, required: true, type: "select" as const },
        { enabled: true, fieldKey: "phone", isSystem: false, linkedFeature: "enablePhone", moduleKey: "users", name: "Số điện thoại", order: 4, required: false, type: "phone" as const },
        { enabled: true, fieldKey: "avatar", isSystem: false, linkedFeature: "enableAvatar", moduleKey: "users", name: "Ảnh đại diện", order: 5, required: false, type: "image" as const },
        { enabled: true, fieldKey: "lastLogin", isSystem: false, linkedFeature: "enableLastLogin", moduleKey: "users", name: "Đăng nhập cuối", order: 6, required: false, type: "date" as const },
      ];
      for (const field of fields) {
        await ctx.db.insert("moduleFields", field);
      }
    }

    // 6. Seed module settings
    const existingSettings = await ctx.db.query("moduleSettings").withIndex("by_module", q => q.eq("moduleKey", "users")).first();
    if (!existingSettings) {
      await ctx.db.insert("moduleSettings", { moduleKey: "users", settingKey: "usersPerPage", value: 20 });
      await ctx.db.insert("moduleSettings", { moduleKey: "users", settingKey: "sessionTimeout", value: 30 });
      await ctx.db.insert("moduleSettings", { moduleKey: "users", settingKey: "maxLoginAttempts", value: 5 });
    }

    // 7. Initialize counter tables (userStats, roleStats)
    const existingUserStats = await ctx.db.query("userStats").first();
    if (!existingUserStats) {
      const users = await ctx.db.query("users").collect();
      const roles = await ctx.db.query("roles").collect();
      
      // Count users by status
      const statusCounts: Record<string, number> = { Active: 0, Banned: 0, Inactive: 0 };
      users.forEach(u => { statusCounts[u.status] = (statusCounts[u.status] || 0) + 1; });
      
      // Count roles
      let systemCount = 0, superAdminCount = 0;
      roles.forEach(r => {
        if (r.isSystem) {systemCount++;}
        if (r.isSuperAdmin) {superAdminCount++;}
      });
      
      await Promise.all([
        ctx.db.insert("userStats", { count: users.length, key: "total" }),
        ctx.db.insert("userStats", { count: statusCounts.Active, key: "Active" }),
        ctx.db.insert("userStats", { count: statusCounts.Inactive, key: "Inactive" }),
        ctx.db.insert("userStats", { count: statusCounts.Banned, key: "Banned" }),
        ctx.db.insert("roleStats", { count: roles.length, key: "total" }),
        ctx.db.insert("roleStats", { count: systemCount, key: "system" }),
        ctx.db.insert("roleStats", { count: superAdminCount, key: "superAdmin" }),
      ]);
    }

    return null;
  },
  returns: v.null(),
});

// USR-008 FIX: Clear users DATA with parallel deletion + reset counters
export const clearUsersData = mutation({
  args: {},
  handler: async (ctx) => {
    const [users, roles, userStats, roleStats] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("roles").collect(),
      ctx.db.query("userStats").collect(),
      ctx.db.query("roleStats").collect(),
    ]);
    
    // Delete all in parallel
    await Promise.all([
      ...users.map( async (u) => ctx.db.delete(u._id)),
      ...roles.map( async (r) => ctx.db.delete(r._id)),
      ...userStats.map( async (s) => ctx.db.delete(s._id)),
      ...roleStats.map( async (s) => ctx.db.delete(s._id)),
    ]);
    
    return null;
  },
  returns: v.null(),
});

// Clear users module CONFIG (features, fields, settings)
export const clearUsersConfig = mutation({
  args: {},
  handler: async (ctx) => {
    const features = await ctx.db.query("moduleFeatures").withIndex("by_module", q => q.eq("moduleKey", "users")).collect();
    for (const f of features) {
      await ctx.db.delete(f._id);
    }
    const fields = await ctx.db.query("moduleFields").withIndex("by_module", q => q.eq("moduleKey", "users")).collect();
    for (const f of fields) {
      await ctx.db.delete(f._id);
    }
    const settings = await ctx.db.query("moduleSettings").withIndex("by_module", q => q.eq("moduleKey", "users")).collect();
    for (const s of settings) {
      await ctx.db.delete(s._id);
    }
    return null;
  },
  returns: v.null(),
});

// ============ ROLES MODULE ============

export const seedRolesModule = mutation({
  args: { configOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const configOnly = args.configOnly ?? false;

    if (!configOnly) {
      // 1. Seed roles data if not exists
      const existingRoles = await ctx.db.query("roles").first();
      if (!existingRoles) {
        const roles: {
          name: string;
          description: string;
          color: string;
          isSystem: boolean;
          isSuperAdmin: boolean;
          permissions: Record<string, string[]>;
        }[] = [
        { 
          color: "#ef4444", 
          description: "Toàn quyền hệ thống", 
          isSuperAdmin: true, 
          isSystem: true, 
          name: "Super Admin", 
          permissions: { "*": ["*"] } 
        },
        { 
          color: "#3b82f6", 
          description: "Quản trị viên hệ thống", 
          isSuperAdmin: false, 
          isSystem: true, 
          name: "Admin", 
          permissions: { 
            customers: ["view", "create", "edit"],
            kanban: ["view", "create", "edit", "delete"],
            media: ["view", "create", "delete"],
            orders: ["view", "create", "edit"],
            posts: ["view", "create", "edit", "delete"],
            products: ["view", "create", "edit", "delete"],
            roles: ["view"],
            settings: ["view", "edit"],
            users: ["view"],
          } 
        },
        { 
          color: "#10b981", 
          description: "Biên tập viên nội dung", 
          isSuperAdmin: false, 
          isSystem: false, 
          name: "Editor", 
          permissions: { 
            comments: ["view", "edit"],
            media: ["view", "create"],
            posts: ["view", "create", "edit"],
            products: ["view", "edit"],
          } 
        },
        { 
          color: "#f59e0b", 
          description: "Nhân viên bán hàng", 
          isSuperAdmin: false, 
          isSystem: false, 
          name: "Sales", 
          permissions: { 
            customers: ["view", "create", "edit"],
            orders: ["view", "create", "edit"],
            products: ["view"],
          } 
        },
        { 
          color: "#6b7280", 
          description: "Chỉ xem dữ liệu", 
          isSuperAdmin: false, 
          isSystem: false, 
          name: "Viewer", 
          permissions: { 
            customers: ["view"],
            orders: ["view"],
            posts: ["view"],
            products: ["view"],
          } 
        },
        ];
        for (const r of roles) {
          await ctx.db.insert("roles", r);
        }
      }
    }

    // 2. Seed module features
    const existingFeatures = await ctx.db.query("moduleFeatures").withIndex("by_module", q => q.eq("moduleKey", "roles")).first();
    if (!existingFeatures) {
      const features = [
        { description: "Thêm mô tả chi tiết cho vai trò", enabled: true, featureKey: "enableDescription", linkedFieldKey: "description", moduleKey: "roles", name: "Mô tả vai trò" },
        { description: "Gán màu để phân biệt vai trò", enabled: true, featureKey: "enableColor", linkedFieldKey: "color", moduleKey: "roles", name: "Màu sắc" },
        { description: "Cho phép vai trò có cấp bậc", enabled: false, featureKey: "enableHierarchy", moduleKey: "roles", name: "Phân cấp" },
      ];
      for (const feature of features) {
        await ctx.db.insert("moduleFeatures", feature);
      }
    }

    // 3. Seed module fields
    const existingFields = await ctx.db.query("moduleFields").withIndex("by_module", q => q.eq("moduleKey", "roles")).first();
    if (!existingFields) {
      const fields = [
        { enabled: true, fieldKey: "name", isSystem: true, moduleKey: "roles", name: "Tên vai trò", order: 0, required: true, type: "text" as const },
        { enabled: true, fieldKey: "permissions", isSystem: true, moduleKey: "roles", name: "Quyền hạn", order: 1, required: true, type: "text" as const },
        { enabled: true, fieldKey: "isSystem", isSystem: true, moduleKey: "roles", name: "Vai trò hệ thống", order: 2, required: true, type: "boolean" as const },
        { enabled: true, fieldKey: "description", isSystem: false, linkedFeature: "enableDescription", moduleKey: "roles", name: "Mô tả", order: 3, required: false, type: "textarea" as const },
        { enabled: true, fieldKey: "color", isSystem: false, linkedFeature: "enableColor", moduleKey: "roles", name: "Màu sắc", order: 4, required: false, type: "text" as const },
        { enabled: true, fieldKey: "isSuperAdmin", isSystem: false, moduleKey: "roles", name: "Super Admin", order: 5, required: false, type: "boolean" as const },
      ];
      for (const field of fields) {
        await ctx.db.insert("moduleFields", field);
      }
    }

    // 4. Seed module settings
    const existingSettings = await ctx.db.query("moduleSettings").withIndex("by_module", q => q.eq("moduleKey", "roles")).first();
    if (!existingSettings) {
      await ctx.db.insert("moduleSettings", { moduleKey: "roles", settingKey: "maxRolesPerUser", value: 1 });
      await ctx.db.insert("moduleSettings", { moduleKey: "roles", settingKey: "defaultRole", value: "Viewer" });
      await ctx.db.insert("moduleSettings", { moduleKey: "roles", settingKey: "rolesPerPage", value: 10 });
    }

    return null;
  },
  returns: v.null(),
});

// Clear roles DATA only
export const clearRolesData = mutation({
  args: {},
  handler: async (ctx) => {
    const roles = await ctx.db.query("roles").collect();
    for (const r of roles) {
      if (!r.isSystem) {
        await ctx.db.delete(r._id);
      }
    }
    return null;
  },
  returns: v.null(),
});

// Clear roles module CONFIG
export const clearRolesConfig = mutation({
  args: {},
  handler: async (ctx) => {
    const features = await ctx.db.query("moduleFeatures").withIndex("by_module", q => q.eq("moduleKey", "roles")).collect();
    for (const f of features) {
      await ctx.db.delete(f._id);
    }
    const fields = await ctx.db.query("moduleFields").withIndex("by_module", q => q.eq("moduleKey", "roles")).collect();
    for (const f of fields) {
      await ctx.db.delete(f._id);
    }
    const settings = await ctx.db.query("moduleSettings").withIndex("by_module", q => q.eq("moduleKey", "roles")).collect();
    for (const s of settings) {
      await ctx.db.delete(s._id);
    }
    return null;
  },
  returns: v.null(),
});

// ============ SETTINGS MODULE ============

export const seedSettingsModule = mutation({
  args: { configOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const configOnly = args.configOnly ?? false;

    if (!configOnly) {
      // 1. Seed settings DATA (key-value pairs grouped by category)
      const existingSettings = await ctx.db.query("settings").first();
      if (!existingSettings) {
        const settingsData = [
        // Site settings
        { group: "site", key: "site_name", value: "Website" },
        { group: "site", key: "site_tagline", value: "" },
        { group: "site", key: "site_url", value: "" },
        { group: "site", key: "site_logo", value: "" },
        { group: "site", key: "site_favicon", value: "" },
        { group: "site", key: "site_timezone", value: "Asia/Ho_Chi_Minh" },
        { group: "site", key: "site_language", value: "vi" },
        { group: "site", key: "site_brand_mode", value: "dual" },
        { group: "site", key: "site_brand_primary", value: "#3b82f6" },
        { group: "site", key: "site_brand_secondary", value: "" },
        
        // Contact settings
        { group: "contact", key: "contact_email", value: "" },
        { group: "contact", key: "contact_phone", value: "" },
        { group: "contact", key: "contact_address", value: "" },
        { group: "contact", key: "contact_map_provider", value: "openstreetmap" },
        { group: "contact", key: "contact_google_map_embed_iframe", value: "" },
        { group: "contact", key: "contact_zalo", value: "" },
        { group: "contact", key: "contact_messenger", value: "" },
        
        // SEO settings
        { group: "seo", key: "seo_title", value: "" },
        { group: "seo", key: "seo_description", value: "" },
        { group: "seo", key: "seo_keywords", value: "" },
        { group: "seo", key: "seo_og_image", value: "" },
        { group: "seo", key: "seo_google_verification", value: "" },
        { group: "seo", key: "seo_bing_verification", value: "" },
        { group: "advanced", key: "product_image_placeholder", value: "" },
        
        // Social settings
        { group: "social", key: "social_facebook", value: "" },
        { group: "social", key: "social_instagram", value: "" },
        { group: "social", key: "social_youtube", value: "" },
        { group: "social", key: "social_tiktok", value: "" },
        { group: "social", key: "social_pinterest", value: "" },
        { group: "social", key: "social_twitter", value: "" },
        
        // Mail settings
        { group: "mail", key: "mail_from_name", value: "Website" },
        { group: "mail", key: "mail_from_email", value: "" },
        { group: "mail", key: "mail_driver", value: "smtp" },
        { group: "mail", key: "mail_host", value: "" },
        { group: "mail", key: "mail_username", value: "" },
        { group: "mail", key: "mail_password", value: "" },
        { group: "mail", key: "mail_port", value: 587 },
        { group: "mail", key: "mail_encryption", value: "tls" },

        // Experience settings
        {
          group: "experience",
          key: "product_detail_ui",
          value: {
            layoutStyle: "classic",
            showAddToCart: true,
            showClassicHighlights: true,
            showRating: true,
            showWishlist: true,
            showBuyNow: true,
            enableImageLightbox: false,
          },
        },
        {
          group: "experience",
          key: "wishlist_ui",
          value: {
            layoutStyle: "grid",
            showNote: true,
            showNotification: true,
            showWishlistButton: true,
          },
        },
        {
          group: "experience",
          key: "cart_ui",
          value: {
            layoutStyle: "drawer",
            showExpiry: false,
            showNote: false,
          },
        },
        {
          group: "experience",
          key: "checkout_ui",
          value: {
            flowStyle: "multi-step",
            showBuyNow: true,
            layouts: {
              "single-page": {
                orderSummaryPosition: "right",
                showPaymentMethods: true,
                showShippingOptions: true,
              },
              "multi-step": {
                orderSummaryPosition: "right",
                showPaymentMethods: true,
                showShippingOptions: true,
              },
            },
          },
        },
        {
          group: "experience",
          key: "comments_rating_ui",
          value: {
            commentsSortOrder: "newest",
            ratingDisplayStyle: "both",
            showLikes: true,
            showModeration: true,
            showReplies: true,
          },
        },
      ];
        for (const s of settingsData) {
          await ctx.db.insert("settings", s);
        }
      }
    }

    // 2. Seed module features
    const existingFeatures = await ctx.db.query("moduleFeatures").withIndex("by_module", q => q.eq("moduleKey", "settings")).first();
    if (!existingFeatures) {
      const features = [
        { description: "Quản lý email, phone, địa chỉ", enabled: true, featureKey: "enableContact", moduleKey: "settings", name: "Thông tin liên hệ" },
        { description: "Meta title, description, keywords", enabled: true, featureKey: "enableSEO", moduleKey: "settings", name: "SEO cơ bản" },
        { description: "Links Facebook, Instagram, Youtube...", enabled: true, featureKey: "enableSocial", moduleKey: "settings", name: "Mạng xã hội" },
        { description: "Bật/tắt nhóm Trang tin cậy", enabled: true, featureKey: "enableTrustPages", moduleKey: "settings", name: "Trang tin cậy" },
        { description: "Sinh tự động Trust Pages từ dữ liệu thực", enabled: false, featureKey: "enableTrustPagesAutoGenerate", moduleKey: "settings", name: "Tự sinh Trust Pages" },
      ];
      for (const feature of features) {
        await ctx.db.insert("moduleFeatures", feature);
      }
    }

    // 3. Seed module fields
    const existingFields = await ctx.db.query("moduleFields").withIndex("by_module", q => q.eq("moduleKey", "settings")).first();
    if (!existingFields) {
      const fields = [
        // Site fields
        { enabled: true, fieldKey: "site_name", group: "site", isSystem: true, moduleKey: "settings", name: "Tên website", order: 0, required: true, type: "text" as const },
        { enabled: true, fieldKey: "site_tagline", group: "site", isSystem: false, moduleKey: "settings", name: "Slogan", order: 1, required: false, type: "text" as const },
        { enabled: true, fieldKey: "site_url", group: "site", isSystem: true, moduleKey: "settings", name: "URL Website", order: 2, required: false, type: "text" as const },
        { enabled: true, fieldKey: "site_logo", group: "site", isSystem: true, moduleKey: "settings", name: "Logo", order: 3, required: false, type: "image" as const },
        { enabled: true, fieldKey: "site_favicon", group: "site", isSystem: true, moduleKey: "settings", name: "Favicon", order: 4, required: false, type: "image" as const },
        { enabled: true, fieldKey: "site_timezone", group: "site", isSystem: false, moduleKey: "settings", name: "Múi giờ", order: 5, required: false, type: "select" as const },
        { enabled: true, fieldKey: "site_language", group: "site", isSystem: false, moduleKey: "settings", name: "Ngôn ngữ", order: 6, required: false, type: "select" as const },
        { enabled: true, fieldKey: "site_brand_primary", group: "site", isSystem: false, moduleKey: "settings", name: "Màu thương hiệu (chính)", order: 7, required: false, type: "color" as const },
        { enabled: true, fieldKey: "site_brand_secondary", group: "site", isSystem: false, moduleKey: "settings", name: "Màu thương hiệu (phụ)", order: 8, required: false, type: "color" as const },
        // Contact fields
        { enabled: true, fieldKey: "contact_email", group: "contact", isSystem: false, linkedFeature: "enableContact", moduleKey: "settings", name: "Email", order: 6, required: false, type: "email" as const },
        { enabled: true, fieldKey: "contact_phone", group: "contact", isSystem: false, linkedFeature: "enableContact", moduleKey: "settings", name: "Số điện thoại", order: 7, required: false, type: "phone" as const },
        { enabled: true, fieldKey: "contact_address", group: "contact", isSystem: false, linkedFeature: "enableContact", moduleKey: "settings", name: "Địa chỉ", order: 8, required: false, type: "textarea" as const },
        { enabled: true, fieldKey: "contact_zalo", group: "contact", isSystem: false, linkedFeature: "enableContact", moduleKey: "settings", name: "Zalo", order: 10, required: false, type: "text" as const },
        { enabled: true, fieldKey: "contact_messenger", group: "contact", isSystem: false, linkedFeature: "enableContact", moduleKey: "settings", name: "Facebook Messenger", order: 11, required: false, type: "text" as const },
        // SEO fields
        { enabled: true, fieldKey: "seo_title", group: "seo", isSystem: false, linkedFeature: "enableSEO", moduleKey: "settings", name: "Meta Title", order: 10, required: false, type: "text" as const },
        { enabled: true, fieldKey: "seo_description", group: "seo", isSystem: false, linkedFeature: "enableSEO", moduleKey: "settings", name: "Meta Description", order: 11, required: false, type: "textarea" as const },
        { enabled: true, fieldKey: "seo_keywords", group: "seo", isSystem: false, linkedFeature: "enableSEO", moduleKey: "settings", name: "Keywords", order: 12, required: false, type: "tags" as const },
        { enabled: true, fieldKey: "seo_og_image", group: "seo", isSystem: false, linkedFeature: "enableSEO", moduleKey: "settings", name: "OG Image", order: 13, required: false, type: "image" as const },
        { enabled: true, fieldKey: "seo_google_verification", group: "seo", isSystem: false, linkedFeature: "enableSEO", moduleKey: "settings", name: "Google Verification", order: 14, required: false, type: "text" as const },
        { enabled: true, fieldKey: "seo_bing_verification", group: "seo", isSystem: false, linkedFeature: "enableSEO", moduleKey: "settings", name: "Bing Verification", order: 15, required: false, type: "text" as const },
        { enabled: true, fieldKey: "product_image_placeholder", group: "advanced", isSystem: false, moduleKey: "settings", name: "Ảnh placeholder sản phẩm", order: 20, required: false, type: "image" as const },
        // Social fields
        { enabled: true, fieldKey: "social_facebook", group: "social", isSystem: false, linkedFeature: "enableSocial", moduleKey: "settings", name: "Facebook", order: 16, required: false, type: "text" as const },
        { enabled: true, fieldKey: "social_instagram", group: "social", isSystem: false, linkedFeature: "enableSocial", moduleKey: "settings", name: "Instagram", order: 17, required: false, type: "text" as const },
        { enabled: true, fieldKey: "social_youtube", group: "social", isSystem: false, linkedFeature: "enableSocial", moduleKey: "settings", name: "Youtube", order: 18, required: false, type: "text" as const },
        { enabled: false, fieldKey: "social_tiktok", group: "social", isSystem: false, linkedFeature: "enableSocial", moduleKey: "settings", name: "TikTok", order: 19, required: false, type: "text" as const },
        { enabled: true, fieldKey: "social_pinterest", group: "social", isSystem: false, linkedFeature: "enableSocial", moduleKey: "settings", name: "Pinterest", order: 20, required: false, type: "text" as const },
        { enabled: true, fieldKey: "social_twitter", group: "social", isSystem: false, linkedFeature: "enableSocial", moduleKey: "settings", name: "X (Twitter)", order: 21, required: false, type: "text" as const },
        // Mail fields
      ];
      for (const field of fields) {
        await ctx.db.insert("moduleFields", field);
      }
    }

    // 4. Seed module settings
    const existingModuleSettings = await ctx.db.query("moduleSettings").withIndex("by_module", q => q.eq("moduleKey", "settings")).first();
    if (!existingModuleSettings) {
      await ctx.db.insert("moduleSettings", { moduleKey: "settings", settingKey: "cacheEnabled", value: true });
      await ctx.db.insert("moduleSettings", { moduleKey: "settings", settingKey: "cacheDuration", value: 3600 });
    }

    return null;
  },
  returns: v.null(),
});

// Clear settings DATA only
export const clearSettingsData = mutation({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("settings").collect();
    for (const s of settings) {
      await ctx.db.delete(s._id);
    }
    return null;
  },
  returns: v.null(),
});

// Clear settings module CONFIG
export const clearSettingsConfig = mutation({
  args: {},
  handler: async (ctx) => {
    const features = await ctx.db.query("moduleFeatures").withIndex("by_module", q => q.eq("moduleKey", "settings")).collect();
    for (const f of features) {
      await ctx.db.delete(f._id);
    }
    const fields = await ctx.db.query("moduleFields").withIndex("by_module", q => q.eq("moduleKey", "settings")).collect();
    for (const f of fields) {
      await ctx.db.delete(f._id);
    }
    const moduleSettings = await ctx.db.query("moduleSettings").withIndex("by_module", q => q.eq("moduleKey", "settings")).collect();
    for (const s of moduleSettings) {
      await ctx.db.delete(s._id);
    }
    return null;
  },
  returns: v.null(),
});

// ============ MENUS MODULE ============

export const seedMenusModule = mutation({
  args: { configOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const configOnly = args.configOnly ?? false;

    if (!configOnly) {
      // 1. Seed menus
      const existingMenus = await ctx.db.query("menus").first();
      if (!existingMenus) {
        const menusData = [
          { location: "header", name: "Header Menu" },
          { location: "footer", name: "Footer Menu" },
          { location: "sidebar", name: "Sidebar Menu" },
        ];
        
        const menuIds: Record<string, Id<"menus">> = {};
        for (const menu of menusData) {
          const id = await ctx.db.insert("menus", menu);
          menuIds[menu.location] = id;
        }

        // 2. Seed menu items for Header
        const headerItems = [
          { active: true, depth: 0, label: "Trang chủ", menuId: menuIds.header, order: 0, url: "/" },
          { active: true, depth: 0, label: "Sản phẩm", menuId: menuIds.header, order: 1, url: "/products" },
          { active: true, depth: 1, label: "Điện tử", menuId: menuIds.header, order: 2, url: "/products?category=dien-tu" },
          { active: true, depth: 1, label: "Thời trang", menuId: menuIds.header, order: 3, url: "/products?category=thoi-trang" },
          { active: true, depth: 1, label: "Gia dụng", menuId: menuIds.header, order: 4, url: "/products?category=gia-dung" },
          { active: true, depth: 0, label: "Bài viết", menuId: menuIds.header, order: 5, url: "/posts" },
          { active: true, depth: 1, label: "Tin tức", menuId: menuIds.header, order: 6, url: "/posts?category=tin-tuc" },
          { active: true, depth: 1, label: "Hướng dẫn", menuId: menuIds.header, order: 7, url: "/posts?category=huong-dan" },
          { active: true, depth: 0, label: "Giới thiệu", menuId: menuIds.header, order: 8, url: "/about" },
          { active: true, depth: 0, label: "Liên hệ", menuId: menuIds.header, order: 9, url: "/contact" },
        ];
        for (const item of headerItems) {
          await ctx.db.insert("menuItems", item);
        }

        // 3. Seed menu items for Footer
        const footerItems = [
          { active: true, depth: 0, label: "Về chúng tôi", menuId: menuIds.footer, order: 0, url: "/about" },
          { active: true, depth: 0, label: "Điều khoản sử dụng", menuId: menuIds.footer, order: 1, url: "/terms" },
          { active: true, depth: 0, label: "Chính sách bảo mật", menuId: menuIds.footer, order: 2, url: "/privacy" },
          { active: true, depth: 0, label: "Chính sách đổi trả", menuId: menuIds.footer, order: 3, url: "/return-policy" },
          { active: true, depth: 0, label: "Hướng dẫn mua hàng", menuId: menuIds.footer, order: 4, url: "/guide" },
          { active: true, depth: 0, label: "Liên hệ", menuId: menuIds.footer, order: 5, url: "/contact" },
        ];
        for (const item of footerItems) {
          await ctx.db.insert("menuItems", item);
        }

        // 4. Seed menu items for Sidebar
        const sidebarItems = [
          { active: true, depth: 0, icon: "LayoutDashboard", label: "Dashboard", menuId: menuIds.sidebar, order: 0, url: "/admin/dashboard" },
          { active: true, depth: 0, icon: "Package", label: "Sản phẩm", menuId: menuIds.sidebar, order: 1, url: "/admin/products" },
          { active: true, depth: 0, icon: "ShoppingBag", label: "Đơn hàng", menuId: menuIds.sidebar, order: 2, url: "/admin/orders" },
          { active: true, depth: 0, icon: "Users", label: "Khách hàng", menuId: menuIds.sidebar, order: 3, url: "/admin/customers" },
        ];
        for (const item of sidebarItems) {
          await ctx.db.insert("menuItems", item);
        }
      }
    }

    // 5. Seed module features
    const existingFeatures = await ctx.db.query("moduleFeatures").withIndex("by_module", q => q.eq("moduleKey", "menus")).first();
    if (!existingFeatures) {
      const features = [
        { description: "Cho phép tạo menu con nhiều cấp", enabled: true, featureKey: "enableNested", linkedFieldKey: "parentId", moduleKey: "menus", name: "Menu lồng nhau" },
        { description: "Cho phép mở link trong tab mới", enabled: true, featureKey: "enableNewTab", linkedFieldKey: "openInNewTab", moduleKey: "menus", name: "Mở tab mới" },
        { description: "Cho phép gán icon cho menu item", enabled: true, featureKey: "enableIcon", linkedFieldKey: "icon", moduleKey: "menus", name: "Icon menu" },
      ];
      for (const feature of features) {
        await ctx.db.insert("moduleFeatures", feature);
      }
    }

    // 6. Seed module fields
    const existingFields = await ctx.db.query("moduleFields").withIndex("by_module", q => q.eq("moduleKey", "menus")).collect();
    if (existingFields.length === 0) {
      const fields = [
        { enabled: true, fieldKey: "label", isSystem: true, moduleKey: "menus", name: "Tiêu đề", order: 0, required: true, type: "text" as const },
        { enabled: true, fieldKey: "url", isSystem: true, moduleKey: "menus", name: "URL", order: 1, required: true, type: "text" as const },
        { enabled: true, fieldKey: "location", isSystem: true, moduleKey: "menus", name: "Vị trí menu", order: 2, required: true, type: "select" as const },
        { enabled: true, fieldKey: "order", isSystem: true, moduleKey: "menus", name: "Thứ tự", order: 3, required: true, type: "number" as const },
        { enabled: true, fieldKey: "active", isSystem: true, moduleKey: "menus", name: "Trạng thái", order: 4, required: true, type: "boolean" as const },
        { enabled: true, fieldKey: "parentId", isSystem: false, linkedFeature: "enableNested", moduleKey: "menus", name: "Menu cha", order: 5, required: false, type: "select" as const },
        { enabled: true, fieldKey: "openInNewTab", isSystem: false, linkedFeature: "enableNewTab", moduleKey: "menus", name: "Mở tab mới", order: 6, required: false, type: "boolean" as const },
        { enabled: true, fieldKey: "icon", isSystem: false, linkedFeature: "enableIcon", moduleKey: "menus", name: "Icon", order: 7, required: false, type: "text" as const },
      ];
      for (const field of fields) {
        await ctx.db.insert("moduleFields", field);
      }
    }

    if (existingFields.length > 0) {
      const existingKeys = new Set(existingFields.map((field) => field.fieldKey));
      const shouldRemove = [
        "seo_robots",
        "seo_business_type",
        "seo_opening_hours",
        "seo_price_range",
        "seo_geo_lat",
        "seo_geo_lng",
        "seo_hreflang",
      ];
      for (const key of shouldRemove) {
        if (!existingKeys.has(key)) {continue;}
        const field = existingFields.find((item) => item.fieldKey === key);
        if (field) {
          await ctx.db.delete(field._id);
        }
      }
    }

    // 7. Seed module settings
    const existingSettings = await ctx.db.query("moduleSettings").withIndex("by_module", q => q.eq("moduleKey", "menus")).collect();
    if (existingSettings.length === 0) {
      await ctx.db.insert("moduleSettings", { moduleKey: "menus", settingKey: "maxDepth", value: 3 });
      await ctx.db.insert("moduleSettings", { moduleKey: "menus", settingKey: "defaultLocation", value: "header" });
    } else {
      const hasMaxDepth = existingSettings.some((setting) => setting.settingKey === "maxDepth");
      const hasDefaultLocation = existingSettings.some((setting) => setting.settingKey === "defaultLocation");
      if (!hasMaxDepth) {
        await ctx.db.insert("moduleSettings", { moduleKey: "menus", settingKey: "maxDepth", value: 3 });
      }
      if (!hasDefaultLocation) {
        await ctx.db.insert("moduleSettings", { moduleKey: "menus", settingKey: "defaultLocation", value: "header" });
      }
      const legacyMenusPerPage = existingSettings.find((setting) => setting.settingKey === "menusPerPage");
      if (legacyMenusPerPage) {
        await ctx.db.delete(legacyMenusPerPage._id);
      }
    }

    return null;
  },
  returns: v.null(),
});

// Clear menus DATA only
export const clearMenusData = mutation({
  args: {},
  handler: async (ctx) => {
    const menuItems = await ctx.db.query("menuItems").collect();
    for (const item of menuItems) {
      await ctx.db.delete(item._id);
    }
    const menus = await ctx.db.query("menus").collect();
    for (const menu of menus) {
      await ctx.db.delete(menu._id);
    }
    return null;
  },
  returns: v.null(),
});

// Clear menus module CONFIG
export const clearMenusConfig = mutation({
  args: {},
  handler: async (ctx) => {
    const features = await ctx.db.query("moduleFeatures").withIndex("by_module", q => q.eq("moduleKey", "menus")).collect();
    for (const f of features) {
      await ctx.db.delete(f._id);
    }
    const fields = await ctx.db.query("moduleFields").withIndex("by_module", q => q.eq("moduleKey", "menus")).collect();
    for (const f of fields) {
      await ctx.db.delete(f._id);
    }
    const settings = await ctx.db.query("moduleSettings").withIndex("by_module", q => q.eq("moduleKey", "menus")).collect();
    for (const s of settings) {
      await ctx.db.delete(s._id);
    }
    return null;
  },
  returns: v.null(),
});

// ============ HOMEPAGE MODULE ============

export const seedHomepageModule = mutation({
  args: { configOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const configOnly = args.configOnly ?? false;

    if (!configOnly) {
      // 1. Seed home components if not exist
      const existingComponents = await ctx.db.query("homeComponents").first();
      if (!existingComponents) {
        const components = [
        {
          active: true,
          config: {
            backgroundImage: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920",
            buttonLink: "/products",
            buttonText: "Khám phá ngay",
            heading: "Chào mừng đến VietAdmin",
            subheading: "Hệ thống quản trị website chuyên nghiệp",
          },
          order: 0,
          title: "Hero Banner",
          type: "hero",
        },
        {
          active: true,
          config: {
            content: "VietAdmin là giải pháp quản trị website toàn diện, được thiết kế riêng cho doanh nghiệp Việt Nam.",
            heading: "Về chúng tôi",
            image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800",
          },
          order: 1,
          title: "Giới thiệu",
          type: "about",
        },
        {
          active: true,
          config: {
            heading: "Sản phẩm nổi bật",
            limit: 8,
            showButton: true,
            showPrice: true,
            subheading: "Những sản phẩm được yêu thích nhất",
          },
          order: 2,
          title: "Sản phẩm nổi bật",
          type: "products",
        },
        {
          active: true,
          config: {
            heading: "Tin tức & Bài viết",
            limit: 6,
            showDate: true,
            showExcerpt: true,
            subheading: "Cập nhật những thông tin mới nhất",
          },
          order: 3,
          title: "Bài viết mới",
          type: "posts",
        },
        {
          active: false,
          config: {
            heading: "Đối tác của chúng tôi",
            logos: [],
          },
          order: 4,
          title: "Đối tác",
          type: "partners",
        },
        {
          active: true,
          config: {
            heading: "Liên hệ với chúng tôi",
            showForm: true,
            showMap: false,
            subheading: "Chúng tôi luôn sẵn sàng hỗ trợ bạn",
          },
          order: 5,
          title: "Liên hệ",
          type: "contact",
        },
      ];
        for (const c of components) {
          await ctx.db.insert("homeComponents", c);
        }
      }
    }

    // 2. Seed module features
    const existingFeatures = await ctx.db.query("moduleFeatures").withIndex("by_module", q => q.eq("moduleKey", "homepage")).first();
    if (!existingFeatures) {
      const features = [
        { description: "Banner chính đầu trang", enabled: true, featureKey: "enableHero", moduleKey: "homepage", name: "Hero Banner" },
        { description: "Section giới thiệu công ty", enabled: true, featureKey: "enableAbout", moduleKey: "homepage", name: "Giới thiệu" },
        { description: "Hiển thị sản phẩm featured", enabled: true, featureKey: "enableProducts", moduleKey: "homepage", name: "Sản phẩm nổi bật" },
        { description: "Hiển thị bài viết gần đây", enabled: true, featureKey: "enablePosts", moduleKey: "homepage", name: "Bài viết mới" },
        { description: "Logo đối tác/khách hàng", enabled: false, featureKey: "enablePartners", moduleKey: "homepage", name: "Đối tác" },
        { description: "Form liên hệ nhanh", enabled: true, featureKey: "enableContact", moduleKey: "homepage", name: "Liên hệ" },
      ];
      for (const feature of features) {
        await ctx.db.insert("moduleFeatures", feature);
      }
    }

    // 3. Seed module fields
    const existingFields = await ctx.db.query("moduleFields").withIndex("by_module", q => q.eq("moduleKey", "homepage")).first();
    if (!existingFields) {
      const fields = [
        { enabled: true, fieldKey: "title", isSystem: true, moduleKey: "homepage", name: "Tên section", order: 0, required: true, type: "text" as const },
        { enabled: true, fieldKey: "type", isSystem: true, moduleKey: "homepage", name: "Loại section", order: 1, required: true, type: "select" as const },
        { enabled: true, fieldKey: "order", isSystem: true, moduleKey: "homepage", name: "Thứ tự", order: 2, required: true, type: "number" as const },
        { enabled: true, fieldKey: "active", isSystem: true, moduleKey: "homepage", name: "Trạng thái", order: 3, required: true, type: "boolean" as const },
        { enabled: true, fieldKey: "config", isSystem: false, moduleKey: "homepage", name: "Cấu hình JSON", order: 4, required: false, type: "textarea" as const },
        { enabled: true, fieldKey: "background", isSystem: false, moduleKey: "homepage", name: "Ảnh nền", order: 5, required: false, type: "image" as const },
      ];
      for (const field of fields) {
        await ctx.db.insert("moduleFields", field);
      }
    }

    // 4. Seed module settings
    const existingSettings = await ctx.db.query("moduleSettings").withIndex("by_module", q => q.eq("moduleKey", "homepage")).first();
    if (!existingSettings) {
      await ctx.db.insert("moduleSettings", { moduleKey: "homepage", settingKey: "maxSections", value: 10 });
      await ctx.db.insert("moduleSettings", { moduleKey: "homepage", settingKey: "defaultSectionType", value: "hero" });
    }

    // 5. Initialize homeComponentStats counter table
    const existingStats = await ctx.db.query("homeComponentStats").first();
    if (!existingStats) {
      const components = await ctx.db.query("homeComponents").collect();
      const counts: Record<string, number> = { active: 0, inactive: 0, total: 0 };
      for (const c of components) {
        counts.total++;
        if (c.active) {counts.active++;} else {counts.inactive++;}
        counts[c.type] = (counts[c.type] || 0) + 1;
      }
      for (const [key, count] of Object.entries(counts)) {
        await ctx.db.insert("homeComponentStats", { count, key });
      }
    }

    return null;
  },
  returns: v.null(),
});

// Clear homepage DATA only
export const clearHomepageData = mutation({
  args: {},
  handler: async (ctx) => {
    const components = await ctx.db.query("homeComponents").collect();
    for (const c of components) {
      await ctx.db.delete(c._id);
    }
    // Also clear stats
    const stats = await ctx.db.query("homeComponentStats").collect();
    for (const s of stats) {
      await ctx.db.delete(s._id);
    }
    return null;
  },
  returns: v.null(),
});

// Clear homepage module CONFIG
export const clearHomepageConfig = mutation({
  args: {},
  handler: async (ctx) => {
    const features = await ctx.db.query("moduleFeatures").withIndex("by_module", q => q.eq("moduleKey", "homepage")).collect();
    for (const f of features) {
      await ctx.db.delete(f._id);
    }
    const fields = await ctx.db.query("moduleFields").withIndex("by_module", q => q.eq("moduleKey", "homepage")).collect();
    for (const f of fields) {
      await ctx.db.delete(f._id);
    }
    const settings = await ctx.db.query("moduleSettings").withIndex("by_module", q => q.eq("moduleKey", "homepage")).collect();
    for (const s of settings) {
      await ctx.db.delete(s._id);
    }
    return null;
  },
  returns: v.null(),
});

// ============ NOTIFICATIONS MODULE ============

export const seedNotificationsModule = mutation({
  args: { configOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const configOnly = args.configOnly ?? false;

    if (!configOnly) {
      // 1. Seed notifications data
      const existingNotifications = await ctx.db.query("notifications").first();
      if (!existingNotifications) {
        const notifications = [
          { content: "Cảm ơn bạn đã sử dụng hệ thống quản trị VietAdmin. Chúc bạn có trải nghiệm tuyệt vời!", order: 0, readCount: 125, sendEmail: false, sentAt: Date.now() - 86_400_000 * 7, status: "Sent" as const, targetType: "all" as const, title: "Chào mừng đến với VietAdmin", type: "success" as const },
          { content: "Hệ thống đã được cập nhật lên phiên bản 2.0 với nhiều tính năng mới. Xem chi tiết tại trang cập nhật.", order: 1, readCount: 42, sendEmail: true, sentAt: Date.now() - 86_400_000 * 3, status: "Sent" as const, targetType: "users" as const, title: "Cập nhật hệ thống v2.0", type: "info" as const },
          { content: "Hệ thống sẽ bảo trì vào 2:00 AM - 4:00 AM ngày mai. Vui lòng lưu công việc trước thời gian này.", order: 2, readCount: 0, scheduledAt: Date.now() + 86_400_000, sendEmail: true, status: "Scheduled" as const, targetType: "all" as const, title: "Bảo trì hệ thống", type: "warning" as const },
          { content: "Giảm giá 30% toàn bộ sản phẩm từ ngày 01/01 đến 15/01. Đừng bỏ lỡ cơ hội này!", order: 3, readCount: 856, sendEmail: true, sentAt: Date.now() - 86_400_000 * 2, status: "Sent" as const, targetType: "customers" as const, title: "Khuyến mãi đặc biệt tháng 1", type: "info" as const },
          { content: "Đã phát hiện lỗi trong quá trình thanh toán. Đội ngũ kỹ thuật đang khắc phục.", order: 4, readCount: 18, sendEmail: false, sentAt: Date.now() - 86_400_000, status: "Sent" as const, targetType: "users" as const, title: "Lỗi thanh toán", type: "error" as const },
          { content: "Đây là thông báo đang soạn, chưa gửi.", order: 5, readCount: 0, status: "Draft" as const, targetType: "all" as const, title: "Thông báo nháp", type: "info" as const },
        ];
        for (const notif of notifications) {
          await ctx.db.insert("notifications", notif);
        }
      }
    }

    // 2. Seed module features
    const existingFeatures = await ctx.db.query("moduleFeatures").withIndex("by_module", q => q.eq("moduleKey", "notifications")).first();
    if (!existingFeatures) {
      const features = [
        { description: "Gửi thông báo qua email", enabled: true, featureKey: "enableEmail", linkedFieldKey: "sendEmail", moduleKey: "notifications", name: "Gửi Email" },
        { description: "Lên lịch gửi thông báo", enabled: true, featureKey: "enableScheduling", linkedFieldKey: "scheduledAt", moduleKey: "notifications", name: "Hẹn giờ gửi" },
        { description: "Gửi thông báo cho nhóm cụ thể", enabled: true, featureKey: "enableTargeting", linkedFieldKey: "targetType", moduleKey: "notifications", name: "Nhắm đối tượng" },
      ];
      for (const feature of features) {
        await ctx.db.insert("moduleFeatures", feature);
      }
    }

    // 3. Seed module fields
    const existingFields = await ctx.db.query("moduleFields").withIndex("by_module", q => q.eq("moduleKey", "notifications")).first();
    if (!existingFields) {
      const fields = [
        { enabled: true, fieldKey: "title", isSystem: true, moduleKey: "notifications", name: "Tiêu đề", order: 0, required: true, type: "text" as const },
        { enabled: true, fieldKey: "content", isSystem: true, moduleKey: "notifications", name: "Nội dung", order: 1, required: true, type: "textarea" as const },
        { enabled: true, fieldKey: "type", isSystem: true, moduleKey: "notifications", name: "Loại", order: 2, required: true, type: "select" as const },
        { enabled: true, fieldKey: "status", isSystem: true, moduleKey: "notifications", name: "Trạng thái", order: 3, required: true, type: "select" as const },
        { enabled: true, fieldKey: "targetType", isSystem: false, linkedFeature: "enableTargeting", moduleKey: "notifications", name: "Đối tượng", order: 4, required: true, type: "select" as const },
        { enabled: true, fieldKey: "sendEmail", isSystem: false, linkedFeature: "enableEmail", moduleKey: "notifications", name: "Gửi Email", order: 5, required: false, type: "boolean" as const },
        { enabled: true, fieldKey: "scheduledAt", isSystem: false, linkedFeature: "enableScheduling", moduleKey: "notifications", name: "Thời gian hẹn", order: 6, required: false, type: "date" as const },
      ];
      for (const field of fields) {
        await ctx.db.insert("moduleFields", field);
      }
    }

    // 4. Seed module settings
    const existingSettings = await ctx.db.query("moduleSettings").withIndex("by_module", q => q.eq("moduleKey", "notifications")).first();
    if (!existingSettings) {
      await ctx.db.insert("moduleSettings", { moduleKey: "notifications", settingKey: "itemsPerPage", value: 20 });
      await ctx.db.insert("moduleSettings", { moduleKey: "notifications", settingKey: "defaultType", value: "info" });
      await ctx.db.insert("moduleSettings", { moduleKey: "notifications", settingKey: "autoSendEmail", value: false });
    }

    // 5. Initialize notificationStats counter table
    const existingStats = await ctx.db.query("notificationStats").first();
    if (!existingStats) {
      const notifications = await ctx.db.query("notifications").collect();
      const counts: Record<string, number> = { Cancelled: 0, Draft: 0, Scheduled: 0, Sent: 0, total: 0 };
      for (const n of notifications) {
        counts.total++;
        counts[n.status] = (counts[n.status] || 0) + 1;
        counts[n.type] = (counts[n.type] || 0) + 1;
      }
      for (const [key, count] of Object.entries(counts)) {
        await ctx.db.insert("notificationStats", { count, key });
      }
    }

    return null;
  },
  returns: v.null(),
});

// ============ CONTACT INBOX MODULE ============
export const seedContactInboxModule = mutation({
  args: { configOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    void args;
    const existingFeatures = await ctx.db
      .query("moduleFeatures")
      .withIndex("by_module", q => q.eq("moduleKey", "contactInbox"))
      .first();
    if (!existingFeatures) {
      const features = [
        { description: "Cho phép gửi form liên hệ", enabled: true, featureKey: "enableContactFormSubmission", moduleKey: "contactInbox", name: "Cho phép gửi form" },
        { description: "Hiển thị trang quản trị inbox", enabled: true, featureKey: "enableContactInboxAdmin", moduleKey: "contactInbox", name: "Quản trị inbox" },
        { description: "Hiển thị widget dashboard inbox", enabled: true, featureKey: "enableContactDashboardWidget", moduleKey: "contactInbox", name: "Widget dashboard" },
      ];
      await Promise.all(features.map(feature => ctx.db.insert("moduleFeatures", feature)));
    }

    const existingSettings = await ctx.db
      .query("moduleSettings")
      .withIndex("by_module", q => q.eq("moduleKey", "contactInbox"))
      .first();
    if (!existingSettings) {
      await Promise.all([
        ctx.db.insert("moduleSettings", { moduleKey: "contactInbox", settingKey: "requireEmail", value: false }),
        ctx.db.insert("moduleSettings", { moduleKey: "contactInbox", settingKey: "requirePhone", value: false }),
        ctx.db.insert("moduleSettings", { moduleKey: "contactInbox", settingKey: "inboxRetentionDays", value: 0 }),
      ]);
    }

    return null;
  },
  returns: v.null(),
});

// Clear notifications DATA only
export const clearNotificationsData = mutation({
  args: {},
  handler: async (ctx) => {
    const notifications = await ctx.db.query("notifications").collect();
    for (const n of notifications) {
      await ctx.db.delete(n._id);
    }
    // Also clear stats
    const stats = await ctx.db.query("notificationStats").collect();
    for (const s of stats) {
      await ctx.db.delete(s._id);
    }
    return null;
  },
  returns: v.null(),
});

// Clear notifications module CONFIG
export const clearNotificationsConfig = mutation({
  args: {},
  handler: async (ctx) => {
    const features = await ctx.db.query("moduleFeatures").withIndex("by_module", q => q.eq("moduleKey", "notifications")).collect();
    for (const f of features) {
      await ctx.db.delete(f._id);
    }
    const fields = await ctx.db.query("moduleFields").withIndex("by_module", q => q.eq("moduleKey", "notifications")).collect();
    for (const f of fields) {
      await ctx.db.delete(f._id);
    }
    const settings = await ctx.db.query("moduleSettings").withIndex("by_module", q => q.eq("moduleKey", "notifications")).collect();
    for (const s of settings) {
      await ctx.db.delete(s._id);
    }
    return null;
  },
  returns: v.null(),
});

// ============ PROMOTIONS MODULE ============

export const seedPromotionsModule = mutation({
  args: { configOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const configOnly = args.configOnly ?? false;

    if (!configOnly) {
      // 1. Seed promotions data
      const existingPromotions = await ctx.db.query("promotions").first();
      if (!existingPromotions) {
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        const promotions = [
        {
          applicableTo: "all" as const,
          code: "SALE10",
          description: "Giảm 10% cho tất cả đơn hàng",
          displayOnPage: true,
          discountType: "percent" as const,
          discountValue: 10,
          endDate: now + 30 * oneDay,
          maxDiscountAmount: 500_000,
          name: "Giảm 10% đơn hàng",
          order: 0,
          promotionType: "coupon" as const,
          startDate: now - 30 * oneDay,
          status: "Active" as const,
          usageLimit: 100,
          usedCount: 45,
        },
        {
          applicableTo: "all" as const,
          code: "GIAM50K",
          description: "Giảm 50.000đ cho đơn từ 500.000đ",
          displayOnPage: true,
          discountType: "fixed" as const,
          discountValue: 50_000,
          endDate: now + 45 * oneDay,
          minOrderAmount: 500_000,
          name: "Giảm 50K đơn từ 500K",
          order: 1,
          promotionType: "coupon" as const,
          startDate: now - 15 * oneDay,
          status: "Active" as const,
          usageLimit: 200,
          usedCount: 89,
        },
        {
          applicableTo: "all" as const,
          code: "BLACKFRIDAY",
          description: "Giảm 20% nhân dịp Black Friday",
          displayOnPage: true,
          discountType: "percent" as const,
          discountValue: 20,
          endDate: now + 63 * oneDay,
          maxDiscountAmount: 1_000_000,
          name: "Black Friday 20%",
          order: 2,
          promotionType: "coupon" as const,
          startDate: now + 60 * oneDay,
          status: "Scheduled" as const,
          usageLimit: 500,
          usedCount: 0,
        },
        {
          applicableTo: "all" as const,
          code: "OLDCODE",
          description: "Voucher đã hết hạn",
          displayOnPage: false,
          discountType: "percent" as const,
          discountValue: 15,
          endDate: now - 30 * oneDay,
          name: "Voucher hết hạn",
          order: 3,
          promotionType: "coupon" as const,
          startDate: now - 60 * oneDay,
          status: "Expired" as const,
          usageLimit: 50,
          usedCount: 50,
        },
        {
          applicableTo: "all" as const,
          code: "FREESHIP",
          description: "Miễn phí vận chuyển cho đơn từ 300K",
          displayOnPage: true,
          discountType: "fixed" as const,
          discountValue: 30_000,
          minOrderAmount: 300_000,
          name: "Freeship đơn 300K",
          order: 4,
          promotionType: "coupon" as const,
          startDate: now - 10 * oneDay,
          status: "Active" as const,
          usedCount: 120,
        },
        {
          applicableTo: "all" as const,
          code: "VIP25",
          description: "Dành cho khách VIP",
          displayOnPage: true,
          discountType: "percent" as const,
          discountValue: 25,
          maxDiscountAmount: 2_000_000,
          name: "VIP 25% off",
          order: 5,
          promotionType: "coupon" as const,
          status: "Active" as const,
          usageLimit: 20,
          usedCount: 5,
        },
      ];
        for (const p of promotions) {
          await ctx.db.insert("promotions", p);
        }
      }
    }

    // 2. Seed module features
    const existingFeatures = await ctx.db.query("moduleFeatures").withIndex("by_module", q => q.eq("moduleKey", "promotions")).first();
    if (!existingFeatures) {
      const features = [
        { description: "Giới hạn số lần sử dụng voucher", enabled: true, featureKey: "enableUsageLimit", linkedFieldKey: "usageLimit", moduleKey: "promotions", name: "Giới hạn lượt dùng" },
        { description: "Yêu cầu giá trị đơn hàng tối thiểu", enabled: true, featureKey: "enableMinOrder", linkedFieldKey: "minOrderAmount", moduleKey: "promotions", name: "Đơn tối thiểu" },
        { description: "Giới hạn số tiền giảm tối đa", enabled: true, featureKey: "enableMaxDiscount", linkedFieldKey: "maxDiscountAmount", moduleKey: "promotions", name: "Giảm tối đa" },
        { description: "Đặt thời gian bắt đầu/kết thúc", enabled: true, featureKey: "enableSchedule", moduleKey: "promotions", name: "Hẹn giờ" },
        { description: "Chỉ áp dụng cho SP/danh mục cụ thể", enabled: false, featureKey: "enableApplicable", moduleKey: "promotions", name: "Áp dụng có chọn lọc" },
        { description: "Loại giảm giá nâng cao (mua tặng, combo)", enabled: true, featureKey: "enableAdvancedDiscount", moduleKey: "promotions", name: "Giảm nâng cao" },
        { description: "Điều kiện khách hàng nâng cao", enabled: true, featureKey: "enableCustomerConditions", moduleKey: "promotions", name: "Điều kiện khách hàng" },
        { description: "Ngân sách tối đa cho khuyến mãi", enabled: false, featureKey: "enableBudgetLimit", moduleKey: "promotions", name: "Ngân sách" },
        { description: "Cho phép cộng dồn và ưu tiên", enabled: true, featureKey: "enableStacking", moduleKey: "promotions", name: "Cộng dồn" },
        { description: "Hiển thị khuyến mãi ngoài site", enabled: true, featureKey: "enableDisplay", moduleKey: "promotions", name: "Hiển thị ngoài site" },
      ];
      for (const feature of features) {
        await ctx.db.insert("moduleFeatures", feature);
      }
    }

    // 3. Seed module fields
    const existingFields = await ctx.db.query("moduleFields").withIndex("by_module", q => q.eq("moduleKey", "promotions")).first();
    if (!existingFields) {
      const fields = [
        { enabled: true, fieldKey: "name", isSystem: true, moduleKey: "promotions", name: "Tên khuyến mãi", order: 0, required: true, type: "text" as const },
        { enabled: true, fieldKey: "code", isSystem: true, moduleKey: "promotions", name: "Mã voucher", order: 1, required: true, type: "text" as const },
        { enabled: true, fieldKey: "discountType", isSystem: true, moduleKey: "promotions", name: "Loại giảm", order: 2, required: true, type: "select" as const },
        { enabled: true, fieldKey: "discountValue", isSystem: true, moduleKey: "promotions", name: "Giá trị giảm", order: 3, required: true, type: "number" as const },
        { enabled: true, fieldKey: "status", isSystem: true, moduleKey: "promotions", name: "Trạng thái", order: 4, required: true, type: "select" as const },
        { enabled: true, fieldKey: "description", isSystem: false, moduleKey: "promotions", name: "Mô tả", order: 5, required: false, type: "textarea" as const },
        { enabled: true, fieldKey: "usageLimit", isSystem: false, linkedFeature: "enableUsageLimit", moduleKey: "promotions", name: "Giới hạn sử dụng", order: 6, required: false, type: "number" as const },
        { enabled: true, fieldKey: "minOrderAmount", isSystem: false, linkedFeature: "enableMinOrder", moduleKey: "promotions", name: "Đơn tối thiểu", order: 7, required: false, type: "price" as const },
        { enabled: true, fieldKey: "maxDiscountAmount", isSystem: false, linkedFeature: "enableMaxDiscount", moduleKey: "promotions", name: "Giảm tối đa", order: 8, required: false, type: "price" as const },
        { enabled: true, fieldKey: "startDate", isSystem: false, moduleKey: "promotions", name: "Ngày bắt đầu", order: 9, required: false, type: "date" as const },
        { enabled: true, fieldKey: "endDate", isSystem: false, moduleKey: "promotions", name: "Ngày kết thúc", order: 10, required: false, type: "date" as const },
      ];
      for (const field of fields) {
        await ctx.db.insert("moduleFields", field);
      }
    }

    // 4. Seed module settings
    const existingSettings = await ctx.db.query("moduleSettings").withIndex("by_module", q => q.eq("moduleKey", "promotions")).first();
    if (!existingSettings) {
      await ctx.db.insert("moduleSettings", { moduleKey: "promotions", settingKey: "promotionsPerPage", value: 20 });
      await ctx.db.insert("moduleSettings", { moduleKey: "promotions", settingKey: "defaultDiscountType", value: "percent" });
      await ctx.db.insert("moduleSettings", { moduleKey: "promotions", settingKey: "codeLength", value: 8 });
    }

    // 5. Initialize promotionStats counter table
    const existingStats = await ctx.db.query("promotionStats").first();
    if (!existingStats) {
      const promotions = await ctx.db.query("promotions").collect();
      const counts: Record<string, number> = {
        Active: 0,
        Disabled: 0,
        Expired: 0,
        Scheduled: 0,
        total: 0,
        totalUsed: 0,
        percent: 0,
        fixed: 0,
        buy_x_get_y: 0,
        buy_a_get_b: 0,
        tiered: 0,
        free_shipping: 0,
        gift: 0,
        coupon: 0,
        campaign: 0,
        flash_sale: 0,
        bundle: 0,
        loyalty: 0,
      };
      for (const p of promotions) {
        counts.total++;
        counts[p.status] = (counts[p.status] || 0) + 1;
        counts[p.discountType] = (counts[p.discountType] || 0) + 1;
        const promotionType = p.promotionType ?? (p.code ? "coupon" : "campaign");
        counts[promotionType] = (counts[promotionType] || 0) + 1;
        counts.totalUsed += p.usedCount ?? 0;
      }
      for (const [key, count] of Object.entries(counts)) {
        await ctx.db.insert("promotionStats", { count, key });
      }
    }

    return null;
  },
  returns: v.null(),
});

// SYS-006 FIX: Clear promotions DATA only - với Promise.all
export const clearPromotionsData = mutation({
  args: {},
  handler: async (ctx) => {
    const [promotions, stats] = await Promise.all([
      ctx.db.query("promotions").collect(),
      ctx.db.query("promotionStats").collect(),
    ]);
    await Promise.all([
      ...promotions.map( async p => ctx.db.delete(p._id)),
      ...stats.map( async s => ctx.db.delete(s._id)),
    ]);
    return null;
  },
  returns: v.null(),
});

// SYS-006 FIX: Clear promotions module CONFIG - với Promise.all
export const clearPromotionsConfig = mutation({
  args: {},
  handler: async (ctx) => {
    const [features, fields, settings] = await Promise.all([
      ctx.db.query("moduleFeatures").withIndex("by_module", q => q.eq("moduleKey", "promotions")).collect(),
      ctx.db.query("moduleFields").withIndex("by_module", q => q.eq("moduleKey", "promotions")).collect(),
      ctx.db.query("moduleSettings").withIndex("by_module", q => q.eq("moduleKey", "promotions")).collect(),
    ]);
    await Promise.all([
      ...features.map( async f => ctx.db.delete(f._id)),
      ...fields.map( async f => ctx.db.delete(f._id)),
      ...settings.map( async s => ctx.db.delete(s._id)),
    ]);
    return null;
  },
  returns: v.null(),
});

// ============ SERVICES MODULE ============

// Thêm module services vào danh sách adminModules (chỉ chạy 1 lần)
export const addServicesModuleToList = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("adminModules").withIndex("by_key", q => q.eq("key", "services")).first();
    if (existing) {
      return null;
    }
    await ctx.db.insert("adminModules", {
      category: "content" as const,
      description: "Quản lý dịch vụ và danh mục dịch vụ",
      enabled: true,
      icon: "Briefcase",
      isCore: false,
      key: "services",
      name: "Dịch vụ",
      order: 17,
    });
    return null;
  },
  returns: v.null(),
});

// Thêm module bookings vào danh sách adminModules (chỉ chạy 1 lần)
export const addBookingsModuleToList = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("adminModules").withIndex("by_key", q => q.eq("key", "bookings")).first();
    if (existing) {
      return null;
    }
    await ctx.db.insert("adminModules", {
      category: "commerce" as const,
      dependencies: ["services"],
      dependencyType: "all" as const,
      description: "Quản lý lịch hẹn và đặt lịch",
      enabled: true,
      icon: "CalendarDays",
      isCore: false,
      key: "bookings",
      name: "Đặt lịch",
      order: 20,
    });
    return null;
  },
  returns: v.null(),
});

export const seedServicesModule = mutation({
  args: { configOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const configOnly = args.configOnly ?? false;

    if (!configOnly) {
      // 1. Seed service categories
      const existingCategories = await ctx.db.query("serviceCategories").first();
      if (!existingCategories) {
        const categories = [
        { active: true, description: "Dịch vụ tư vấn chuyên nghiệp", name: "Tư vấn", order: 0, slug: "tu-van" },
        { active: true, description: "Dịch vụ thiết kế sáng tạo", name: "Thiết kế", order: 1, slug: "thiet-ke" },
        { active: true, description: "Dịch vụ phát triển phần mềm", name: "Phát triển", order: 2, slug: "phat-trien" },
        { active: true, description: "Dịch vụ marketing số", name: "Marketing", order: 3, slug: "marketing" },
        { active: false, description: "Dịch vụ hỗ trợ kỹ thuật", name: "Hỗ trợ", order: 4, slug: "ho-tro" },
      ];
        for (const cat of categories) {
          await ctx.db.insert("serviceCategories", cat);
        }
      }

      // 2. Seed services
      const existingServices = await ctx.db.query("services").first();
      if (!existingServices) {
        const tuVanCat = await ctx.db.query("serviceCategories").withIndex("by_slug", q => q.eq("slug", "tu-van")).first();
        const thietKeCat = await ctx.db.query("serviceCategories").withIndex("by_slug", q => q.eq("slug", "thiet-ke")).first();
        const phatTrienCat = await ctx.db.query("serviceCategories").withIndex("by_slug", q => q.eq("slug", "phat-trien")).first();
        const marketingCat = await ctx.db.query("serviceCategories").withIndex("by_slug", q => q.eq("slug", "marketing")).first();
        
        if (tuVanCat && thietKeCat && phatTrienCat && marketingCat) {
          const services = [
          { categoryId: tuVanCat._id, content: "<p>Dịch vụ tư vấn chiến lược kinh doanh toàn diện, giúp doanh nghiệp xây dựng lộ trình phát triển bền vững...</p>", duration: "3-5 ngày", excerpt: "Xây dựng chiến lược kinh doanh hiệu quả", featured: true, order: 0, price: 15_000_000, publishedAt: Date.now() - 86_400_000, slug: "tu-van-chien-luoc-kinh-doanh", status: "Published" as const, thumbnail: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400", title: "Tư vấn chiến lược kinh doanh", views: 850 },
          { categoryId: thietKeCat._id, content: "<p>Thiết kế website hiện đại, responsive, tối ưu SEO và trải nghiệm người dùng...</p>", duration: "2-4 tuần", excerpt: "Website đẹp, chuẩn SEO, tốc độ nhanh", featured: true, order: 1, price: 25_000_000, publishedAt: Date.now() - 172_800_000, slug: "thiet-ke-website-chuyen-nghiep", status: "Published" as const, thumbnail: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=400", title: "Thiết kế website chuyên nghiệp", views: 1200 },
          { categoryId: phatTrienCat._id, content: "<p>Phát triển ứng dụng di động iOS và Android với công nghệ React Native, Flutter...</p>", duration: "2-3 tháng", excerpt: "App native chất lượng cao", featured: true, order: 2, price: 50_000_000, publishedAt: Date.now() - 259_200_000, slug: "phat-trien-ung-dung-mobile", status: "Published" as const, thumbnail: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400", title: "Phát triển ứng dụng mobile", views: 680 },
          { categoryId: marketingCat._id, content: "<p>Quản lý và tối ưu chiến dịch quảng cáo Google Ads, đạt hiệu quả tối đa với chi phí tối thiểu...</p>", duration: "Hàng tháng", excerpt: "Tiếp cận khách hàng mục tiêu hiệu quả", featured: false, order: 3, price: 5_000_000, publishedAt: Date.now() - 345_600_000, slug: "quang-cao-google-ads", status: "Published" as const, thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400", title: "Quảng cáo Google Ads", views: 920 },
          { categoryId: thietKeCat._id, content: "<p>Xây dựng bộ nhận diện thương hiệu độc đáo, chuyên nghiệp, ghi dấu ấn trong tâm trí khách hàng...</p>", duration: "1-2 tuần", excerpt: "Bộ nhận diện thương hiệu trọn gói", featured: false, order: 4, price: 8_000_000, publishedAt: Date.now() - 432_000_000, slug: "thiet-ke-logo-nhan-dien-thuong-hieu", status: "Published" as const, thumbnail: "https://images.unsplash.com/photo-1626785774625-0b1c2c4eab67?w=400", title: "Thiết kế logo & nhận diện thương hiệu", views: 450 },
          { categoryId: marketingCat._id, content: "<p>Dịch vụ SEO toàn diện giúp website lên top Google, tăng traffic organic bền vững...</p>", duration: "3-6 tháng", excerpt: "Tăng thứ hạng tìm kiếm tự nhiên", featured: false, order: 5, price: 10_000_000, slug: "seo-tong-the-website", status: "Draft" as const, thumbnail: "https://images.unsplash.com/photo-1432888622747-4eb9a8f5c5a8?w=400", title: "SEO tổng thể website", views: 0 },
        ];
          for (const service of services) {
            await ctx.db.insert("services", service);
          }
        }
      }
    }

    // 3. Seed module features
    const existingFeatures = await ctx.db.query("moduleFeatures").withIndex("by_module", q => q.eq("moduleKey", "services")).first();
    if (!existingFeatures) {
      const features = [
        { description: "Hiển thị giá dịch vụ", enabled: true, featureKey: "enablePrice", linkedFieldKey: "price", moduleKey: "services", name: "Hiển thị giá" },
        { description: "Hiển thị thời gian hoàn thành dịch vụ", enabled: true, featureKey: "enableDuration", linkedFieldKey: "duration", moduleKey: "services", name: "Thời gian thực hiện" },
        { description: "Đánh dấu dịch vụ nổi bật", enabled: true, featureKey: "enableFeatured", linkedFieldKey: "featured", moduleKey: "services", name: "Nổi bật" },
        { description: "Bật nội dung Markdown tùy chọn", enabled: false, featureKey: "enableMarkdownRender", linkedFieldKey: "markdownRender", moduleKey: "services", name: "Markdown render" },
        { description: "Bật nội dung HTML tùy chọn", enabled: false, featureKey: "enableHtmlRender", linkedFieldKey: "htmlRender", moduleKey: "services", name: "HTML render" },
      ];
      for (const feature of features) {
        await ctx.db.insert("moduleFeatures", feature);
      }
    }

    // 4. Seed module fields
    const existingFields = await ctx.db.query("moduleFields").withIndex("by_module", q => q.eq("moduleKey", "services")).first();
    if (!existingFields) {
      const serviceFields = [
        { enabled: true, fieldKey: "title", isSystem: true, moduleKey: "services", name: "Tiêu đề", order: 0, required: true, type: "text" as const },
        { enabled: true, fieldKey: "slug", isSystem: true, moduleKey: "services", name: "Slug", order: 1, required: true, type: "text" as const },
        { enabled: true, fieldKey: "content", isSystem: true, moduleKey: "services", name: "Nội dung", order: 2, required: true, type: "richtext" as const },
        { enabled: true, fieldKey: "order", isSystem: true, moduleKey: "services", name: "Thứ tự", order: 3, required: true, type: "number" as const },
        { enabled: true, fieldKey: "status", isSystem: true, moduleKey: "services", name: "Trạng thái", order: 4, required: true, type: "select" as const },
        { enabled: true, fieldKey: "excerpt", isSystem: false, moduleKey: "services", name: "Mô tả ngắn", order: 5, required: false, type: "textarea" as const },
        { enabled: true, fieldKey: "thumbnail", isSystem: false, moduleKey: "services", name: "Ảnh đại diện", order: 6, required: false, type: "image" as const },
        { enabled: true, fieldKey: "categoryId", isSystem: true, moduleKey: "services", name: "Danh mục", order: 7, required: true, type: "select" as const },
        { enabled: true, fieldKey: "price", isSystem: false, linkedFeature: "enablePrice", moduleKey: "services", name: "Giá dịch vụ", order: 8, required: false, type: "price" as const },
        { enabled: true, fieldKey: "duration", isSystem: false, linkedFeature: "enableDuration", moduleKey: "services", name: "Thời gian", order: 9, required: false, type: "text" as const },
        { enabled: true, fieldKey: "featured", isSystem: false, linkedFeature: "enableFeatured", moduleKey: "services", name: "Nổi bật", order: 10, required: false, type: "boolean" as const },
        { enabled: true, fieldKey: "metaTitle", group: "seo", isSystem: false, moduleKey: "services", name: "Meta Title", order: 11, required: false, type: "text" as const },
        { enabled: true, fieldKey: "metaDescription", group: "seo", isSystem: false, moduleKey: "services", name: "Meta Description", order: 12, required: false, type: "textarea" as const },
        { enabled: true, fieldKey: "renderType", isSystem: false, moduleKey: "services", name: "Kiểu render", order: 13, required: false, type: "select" as const },
        { enabled: false, fieldKey: "markdownRender", isSystem: false, linkedFeature: "enableMarkdownRender", moduleKey: "services", name: "Markdown render", order: 14, required: false, type: "textarea" as const },
        { enabled: false, fieldKey: "htmlRender", isSystem: false, linkedFeature: "enableHtmlRender", moduleKey: "services", name: "HTML render", order: 15, required: false, type: "textarea" as const },
        { enabled: true, fieldKey: "bookingEnabled", group: "booking", isSystem: false, moduleKey: "services", name: "Cho phép đặt lịch", order: 16, required: false, type: "boolean" as const },
        { enabled: true, fieldKey: "bookingDurationMin", group: "booking", isSystem: false, moduleKey: "services", name: "Thời lượng (phút)", order: 17, required: false, type: "number" as const },
        { enabled: true, fieldKey: "bookingSlotIntervalMin", group: "booking", isSystem: false, moduleKey: "services", name: "Khoảng cách slot (phút)", order: 18, required: false, type: "number" as const },
        { enabled: true, fieldKey: "bookingCapacityPerSlot", group: "booking", isSystem: false, moduleKey: "services", name: "Sức chứa / slot", order: 19, required: false, type: "number" as const },
      ];
      for (const field of serviceFields) {
        await ctx.db.insert("moduleFields", field);
      }

      // Category fields
      const categoryFields = [
        { enabled: true, fieldKey: "name", isSystem: true, moduleKey: "serviceCategories", name: "Tên", order: 0, required: true, type: "text" as const },
        { enabled: true, fieldKey: "slug", isSystem: true, moduleKey: "serviceCategories", name: "Slug", order: 1, required: true, type: "text" as const },
        { enabled: true, fieldKey: "order", isSystem: true, moduleKey: "serviceCategories", name: "Thứ tự", order: 2, required: true, type: "number" as const },
        { enabled: true, fieldKey: "active", isSystem: true, moduleKey: "serviceCategories", name: "Trạng thái", order: 3, required: true, type: "boolean" as const },
        { enabled: true, fieldKey: "description", isSystem: false, moduleKey: "serviceCategories", name: "Mô tả", order: 4, required: false, type: "textarea" as const },
        { enabled: false, fieldKey: "thumbnail", isSystem: false, moduleKey: "serviceCategories", name: "Ảnh đại diện", order: 5, required: false, type: "image" as const },
      ];
      for (const field of categoryFields) {
        await ctx.db.insert("moduleFields", field);
      }
    }

    if (existingFields) {
      const allFields = await ctx.db.query("moduleFields").withIndex("by_module", q => q.eq("moduleKey", "services")).collect();
      const existingKeys = new Set(allFields.map((field) => field.fieldKey));
      let nextOrder = Math.max(...allFields.map((field) => field.order)) + 1;
      const upgradeFields = [
        { fieldKey: "metaTitle", name: "Meta Title", type: "text" as const, group: "seo" },
        { fieldKey: "metaDescription", name: "Meta Description", type: "textarea" as const, group: "seo" },
        { fieldKey: "bookingEnabled", name: "Cho phép đặt lịch", type: "boolean" as const, group: "booking" },
        { fieldKey: "bookingDurationMin", name: "Thời lượng (phút)", type: "number" as const, group: "booking" },
        { fieldKey: "bookingSlotIntervalMin", name: "Khoảng cách slot (phút)", type: "number" as const, group: "booking" },
        { fieldKey: "bookingCapacityPerSlot", name: "Sức chứa / slot", type: "number" as const, group: "booking" },
      ];
      for (const field of upgradeFields) {
        if (existingKeys.has(field.fieldKey)) {continue;}
        await ctx.db.insert("moduleFields", {
          enabled: true,
          fieldKey: field.fieldKey,
          group: field.group,
          isSystem: false,
          moduleKey: "services",
          name: field.name,
          order: nextOrder,
          required: false,
          type: field.type,
        });
        nextOrder += 1;
      }
    }

    // 5. Seed module settings
    const existingSettings = await ctx.db.query("moduleSettings").withIndex("by_module", q => q.eq("moduleKey", "services")).first();
    if (!existingSettings) {
      await ctx.db.insert("moduleSettings", { moduleKey: "services", settingKey: "servicesPerPage", value: 10 });
      await ctx.db.insert("moduleSettings", { moduleKey: "services", settingKey: "defaultStatus", value: "draft" });
    }
    
    // 6. Seed appearance settings (site-wide, not module-specific)
    const listStyleSetting = await ctx.db.query("settings").withIndex("by_key", q => q.eq("key", "services_list_style")).first();
    if (!listStyleSetting) {
      await ctx.db.insert("settings", { group: "services", key: "services_list_style", value: "fullwidth" });
    }
    const detailStyleSetting = await ctx.db.query("settings").withIndex("by_key", q => q.eq("key", "services_detail_style")).first();
    if (!detailStyleSetting) {
      await ctx.db.insert("settings", { group: "services", key: "services_detail_style", value: "classic" });
    }

    return null;
  },
  returns: v.null(),
});

// ============ BOOKINGS MODULE ============
export const seedBookingsModule = mutation({
  args: { configOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    void args;
    await syncModuleRuntimeConfig(ctx, "bookings");
    return null;
  },
  returns: v.null(),
});

// Clear services DATA only (services, categories) - keeps config
export const clearServicesData = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete images in services folder
    const serviceImages = await ctx.db.query("images").withIndex("by_folder", q => q.eq("folder", "services")).collect();
    for (const img of serviceImages) {
      try { await ctx.storage.delete(img.storageId); } catch {}
      await ctx.db.delete(img._id);
    }
    
    // Delete services
    const services = await ctx.db.query("services").collect();
    await Promise.all(services.map( async s => ctx.db.delete(s._id)));

    // Delete service categories
    const categories = await ctx.db.query("serviceCategories").collect();
    await Promise.all(categories.map( async cat => ctx.db.delete(cat._id)));

    return null;
  },
  returns: v.null(),
});

// Clear services module CONFIG (features, fields, settings)
export const clearServicesConfig = mutation({
  args: {},
  handler: async (ctx) => {
    const [features, fields, catFields, settings] = await Promise.all([
      ctx.db.query("moduleFeatures").withIndex("by_module", q => q.eq("moduleKey", "services")).collect(),
      ctx.db.query("moduleFields").withIndex("by_module", q => q.eq("moduleKey", "services")).collect(),
      ctx.db.query("moduleFields").withIndex("by_module", q => q.eq("moduleKey", "serviceCategories")).collect(),
      ctx.db.query("moduleSettings").withIndex("by_module", q => q.eq("moduleKey", "services")).collect(),
    ]);
    await Promise.all([
      ...features.map( async f => ctx.db.delete(f._id)),
      ...fields.map( async f => ctx.db.delete(f._id)),
      ...catFields.map( async f => ctx.db.delete(f._id)),
      ...settings.map( async s => ctx.db.delete(s._id)),
    ]);
    return null;
  },
  returns: v.null(),
});

// ============ SUBSCRIPTIONS MODULE ============

export const seedSubscriptionsModule = mutation({
  args: { configOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const configOnly = args.configOnly ?? false;
    if (!configOnly) {
      return null;
    }

    const existingFields = await ctx.db
      .query("moduleFields")
      .withIndex("by_module", q => q.eq("moduleKey", "subscriptions"))
      .first();
    if (!existingFields) {
      const fields = [
        { enabled: true, fieldKey: "title", isSystem: true, moduleKey: "subscriptions", name: "Tiêu đề", order: 0, required: true, type: "text" as const },
        { enabled: true, fieldKey: "status", isSystem: true, moduleKey: "subscriptions", name: "Trạng thái", order: 1, required: true, type: "select" as const },
        { enabled: true, fieldKey: "dueDate", isSystem: false, moduleKey: "subscriptions", name: "Ngày nhắc", order: 2, required: true, type: "date" as const },
        { enabled: true, fieldKey: "customerId", isSystem: false, linkedFeature: "enableCustomerLink", moduleKey: "subscriptions", name: "Khách hàng", order: 3, required: true, type: "select" as const },
        { enabled: true, fieldKey: "productId", isSystem: false, linkedFeature: "enableProductLink", moduleKey: "subscriptions", name: "Sản phẩm", order: 4, required: true, type: "select" as const },
      ];
      for (const field of fields) {
        await ctx.db.insert("moduleFields", field);
      }
    }

    const existingSettings = await ctx.db
      .query("moduleSettings")
      .withIndex("by_module", q => q.eq("moduleKey", "subscriptions"))
      .first();
    if (!existingSettings) {
      await ctx.db.insert("moduleSettings", { moduleKey: "subscriptions", settingKey: "subscriptionsPerPage", value: 20 });
      await ctx.db.insert("moduleSettings", { moduleKey: "subscriptions", settingKey: "defaultStatus", value: "Todo" });
      await ctx.db.insert("moduleSettings", { moduleKey: "subscriptions", settingKey: "warningDays", value: 7 });
    }

    return null;
  },
  returns: v.null(),
});

export const seedAllModulesConfig = action({
  args: {},
  handler: async (ctx) => {
    const configArgs = { configOnly: true };
    await ctx.runMutation(api.seed.seedModules, {});
    await ctx.runMutation(api.seed.seedPresets, {});
    await ctx.runMutation(api.seed.seedAnalyticsModule, configArgs);
    await ctx.runMutation(api.seed.seedPostsModule, configArgs);
    await ctx.runMutation(api.seed.seedProductsModule, configArgs);
    await ctx.runMutation(api.seed.seedCommentsModule, configArgs);
    await ctx.runMutation(api.seed.seedOrdersModule, configArgs);
    await ctx.runMutation(api.seed.seedMediaModule, configArgs);
    await ctx.runMutation(api.seed.seedCustomersModule, configArgs);
    await ctx.runMutation(api.seed.seedWishlistModule, configArgs);
    await ctx.runMutation(api.seed.seedCartModule, configArgs);
    await ctx.runMutation(api.seed.seedUsersModule, configArgs);
    await ctx.runMutation(api.seed.seedRolesModule, configArgs);
    await ctx.runMutation(api.seed.seedSettingsModule, configArgs);
    await ctx.runMutation(api.seed.seedMenusModule, configArgs);
    await ctx.runMutation(api.seed.seedHomepageModule, configArgs);
    await ctx.runMutation(api.seed.seedContactInboxModule, configArgs);
    await ctx.runMutation(api.seed.seedNotificationsModule, configArgs);
    await ctx.runMutation(api.seed.seedPromotionsModule, configArgs);
    await ctx.runMutation(api.seed.seedServicesModule, configArgs);
    await ctx.runMutation(api.seed.seedBookingsModule, configArgs);
    await ctx.runMutation(api.seed.seedSubscriptionsModule, configArgs);
    return null;
  },
});
