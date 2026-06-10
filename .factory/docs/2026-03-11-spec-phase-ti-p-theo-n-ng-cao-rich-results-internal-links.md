## Audit Summary
- Đợt trước đã hoàn tất nền SEO kỹ thuật chính (metadata/sitemap/robots/OG/feed + hub ItemList).
- Khoảng trống còn lại để tăng đồng thời **index + CTR + conversion** là:
  1) tăng chiều sâu structured data theo intent trang,
  2) tăng internal linking theo cụm topic và funnel,
  3) gắn đo lường tối thiểu để không tối ưu mù.
- Bạn đã chốt hướng đi: **Phase nâng cao rich results + internal links**, mức **full implement tiếp**, mục tiêu **cân bằng cả 3**.

## Root Cause Confidence
- **High** — vì hệ thống hiện đã có baseline schema/linking nhưng chưa có lớp “conversion-oriented linking” và “rich-result depth” đồng đều trên toàn bộ cụm trang quan trọng.

## Proposal (phase tiếp theo)
1. **Rich results nâng cao theo loại trang**
   - Detail pages: bổ sung/chuẩn hóa `Article/Product/Service + Breadcrumb + FAQ (khi có dữ liệu thật)`.
   - Hub/list pages: thêm `ItemList` nhất quán kèm metadata mô tả intent rõ hơn để tăng CTR.
   - Chuẩn hóa fallback để không phát schema rỗng/sai ngữ nghĩa.
2. **Internal links theo cụm topic + funnel**
   - Thiết kế link graph theo 3 tầng: Hub → Detail liên quan → CTA/commercial pages.
   - Bổ sung khối “Liên quan” có chủ đích chuyển đổi cho posts/guides/features/use-cases.
   - Giới hạn số link để tránh loãng signal và giữ UX sạch.
3. **SEO conversion hooks nhẹ**
   - Tối ưu anchor text theo intent (informational/commercial/transactional).
   - Chuẩn hóa vị trí CTA nội dung ở detail pages để tăng conversion từ organic.
4. **Verification tĩnh + checklist nghiệm thu**
   - Soát coverage schema/linking theo route matrix.
   - Soát không phát sinh noindex ngoài ý muốn.
   - Soát canonical + structured data không conflict.

## File-level implementation map (dự kiến)
- `lib/seo/schema-policy.ts`: bổ sung helper schema nâng cao và guard dữ liệu.
- `components/seo/InternalLinkCluster*` + `lib/seo/internal-links*`: mở rộng graph theo funnel.
- `app/(site)/**/layout.tsx`, `app/(site)/**/page.tsx`: áp dụng schema/linking mới theo từng cụm route.
- (Nếu cần) `lib/seo/metadata.ts`: tinh chỉnh snippet title/description theo intent.

## Verification Plan
- Không chạy lint/test/build theo guideline repo.
- Review tĩnh theo checklist:
  - Coverage schema đúng loại trang.
  - Internal link graph không tạo vòng lặp xấu, không nhồi link.
  - Metadata/canonical/robots nhất quán với policy hiện tại.
- Pass khi: rich-result depth + internal links được nâng cấp đồng đều trên các cụm public quan trọng, không phá vỡ contract SEO đã có.