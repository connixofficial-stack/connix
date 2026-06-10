## Phân tích vấn đề hiện tại

**Cấu trúc config đang lưu riêng cho từng layout:**
```typescript
// Hiện tại - mỗi layout lưu riêng displayBlocks
layouts: {
  'form-only': { showMap, showContactInfo, showSocialLinks },
  'with-map': { showMap, showContactInfo, showSocialLinks },
  'with-info': { showMap, showContactInfo, showSocialLinks },
}
```

**Vấn đề:** Khi bật "Social media" ở layout A, chuyển sang layout B phải bật lại => phiền

---

## Giải pháp đề xuất

### 1. Refactor Config: Tách displayBlocks ra shared
```typescript
// MỚI - shared config
type ContactExperienceConfig = {
  layoutStyle: ContactLayoutStyle;
  // Shared display blocks
  showMap: boolean;
  showContactInfo: boolean;
  showSocialLinks: boolean;
};
```

### 2. Cập nhật 3 layouts để "doanh nghiệp" hơn
Học từ posts-list experience, tất cả layouts đều có thể dùng TOÀN BỘ khối hiển thị:

| Layout | Mô tả | Sử dụng tất cả blocks |
|--------|-------|----------------------|
| **form-only** | Form centered, contact info + map hiện phía dưới (stacked) | Yes |
| **with-map** | Map hero phía trên, form + sidebar dưới | Yes |
| **with-info** | 3/5 form + 2/5 sidebar (info + map + social) | Yes |

### 3. Icon mạng xã hội chuẩn
Lấy từ `DynamicFooter.tsx` (đã có custom icons chuẩn):
- Facebook, Instagram, YouTube (Lucide)
- **TikTok, Zalo** (Custom SVG icons - chuẩn Simple Icons)
- LinkedIn, Twitter, Github (Lucide)

### 4. Files cần sửa

| File | Thay đổi |
|------|----------|
| `lib/experiences/contact/config.ts` | Đổi sang shared config |
| `app/system/experiences/contact/page.tsx` | Cập nhật UI editor, bỏ config per-layout |
| `components/experiences/previews/ContactPreview.tsx` | Cập nhật 3 layouts hiển thị tất cả blocks, thêm icons chuẩn |
| `app/(site)/contact/page.tsx` | Sync với config mới và icons chuẩn |

### 5. Preview Layout chi tiết

**form-only (refactored):**
```
[      Header: Liên hệ với chúng tôi      ]
[            Form centered               ]
[  Contact Info (nếu bật) | Map (nếu bật)]
[         Social Icons (nếu bật)         ]
```

**with-map (refactored):**
```
[         Hero Map (full width)          ]
[   Form 50%   |   Contact Info 50%      ]
[         Social Icons (nếu bật)         ]
```

**with-info (giữ nguyên, đã ok):**
```
[  Form 60%   |   Info + Map + Social 40%]
```

---

## Checklist thực hiện

1. [ ] Refactor `config.ts` - shared displayBlocks
2. [ ] Update `page.tsx` (system) - UI editor đơn giản hơn
3. [ ] Update `ContactPreview.tsx` - 3 layouts đều render đủ blocks
4. [ ] Update `contact/page.tsx` (site) - frontend tương ứng
5. [ ] Thêm icons TikTok, Zalo chuẩn (copy từ DynamicFooter)
6. [ ] Test preview và frontend khớp nhau