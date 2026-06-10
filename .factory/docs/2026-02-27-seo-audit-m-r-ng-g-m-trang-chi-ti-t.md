Đã rà soát thêm 3 nhóm trang chi tiết: `/products/[slug]`, `/services/[slug]`, `/posts/[slug]`.

### Điểm SEO cập nhật (toàn bộ trang public chính + trang chi tiết)
- **On-page SEO: 37/40**  
  Có `generateMetadata` riêng cho từng slug, canonical đầy đủ, OG/Twitter theo nội dung thực thể.
- **Technical SEO: 26/30**  
  Có `sitemap.ts`, `robots.ts`, hreflang, cấu trúc App Router hợp lý cho SEO.
- **Indexability & Structured Data: 19/20**  
  Trang detail đã có JSON-LD tốt: `Product`, `Service`, `Article`, `Breadcrumb`.
- **UX/Content signals: 8/10**  
  Điều hướng nội bộ ổn, có heading/intro ở list pages; detail phụ thuộc dữ liệu runtime.

## Tổng điểm mới: **90/100** (Tốt)

### Điểm mạnh nổi bật ở trang chi tiết
1. Metadata theo slug (title/description/image/canonical) đã đúng hướng.
2. Schema đúng loại nội dung (Product/Service/Article) + Breadcrumb.
3. OG/Twitter card đầy đủ cho chia sẻ mạng xã hội.

### 3 ưu tiên cải thiện để lên mức rất tốt (95+)
1. **Chuẩn hóa metadata theo thực thể thay vì dùng `seo_keywords` global** (keyword/topic-specific cho từng bài/sản phẩm/dịch vụ).
2. **Tăng độ ổn định crawl content phía server** cho các trang client-heavy (đảm bảo phần nội dung cốt lõi luôn có trong HTML ban đầu).
3. **Rà soát robots rules chi tiết** (tránh chặn quá rộng nếu có endpoint/tài nguyên cần crawl gián tiếp).