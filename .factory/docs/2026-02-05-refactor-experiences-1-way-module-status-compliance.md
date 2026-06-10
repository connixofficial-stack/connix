## Đánh giá tuân thủ skill `experience-module-status`

### Checklist từ skill:
| Tiêu chí | Mô tả |
|----------|-------|
| **A. Data+Query** | Dùng `getModuleFeature/getModuleSetting`, fallback an toàn |
| **B. UI** | Status row read-only, có Link, **không** dùng `toggleModule/toggleFeature` trong handleSave |
| **C. Preview** | Gating `experienceToggle && moduleEnabled` |
| **D. UX** | Không đặt trong block "Sync module" |

---

## Kết quả kiểm tra 13 experience pages

| Experience | Pattern hiện tại | Vấn đề |
|------------|------------------|--------|
| **posts-detail** | ✅ 1-way | Đã refactor, tuân thủ đầy đủ |
| **product-detail** | ⚠️ Partial | `VariantFeatureStatus` OK nhưng thiếu `moduleName`; các toggle khác dùng `disabled` thay vì status row |
| **services-detail** | ❌ 2-way | Có `isPriceSyncPending` + `updateField` trong handleSave |
| **cart** | ⚠️ Partial | Chỉ dùng `ExperienceModuleLink`, không có feature status cho expiry/note |
| **wishlist** | ⚠️ Partial | Có warning "module chưa bật" nhưng không có feature status cho note/notification |
| **checkout** | ⚠️ Partial | Chỉ dùng `ExperienceModuleLink`, không có feature status |
| **products-list** | ⚠️ Partial | Có warning message, dùng `disabled` toggle, không có feature status |
| **posts-list** | ✅ OK | Đơn giản, không có feature phụ thuộc |
| **services-list** | ✅ OK | Đơn giản, không có feature phụ thuộc |
| **comments-rating** | ⚠️ Partial | Toggle likes/replies/moderation nhưng không có read-only status từ module |

---

## Kế hoạch Refactor

### Phase 1: Fix 2-way → 1-way (HIGH)
1. **services-detail**: Bỏ `isPriceSyncPending` + `updateField`, thêm `ModuleFeatureStatus` cho price field

### Phase 2: Thêm ModuleFeatureStatus (MEDIUM)
2. **product-detail**: Thêm `moduleName` vào `VariantFeatureStatus`
3. **cart**: Thêm status cho `enableExpiry`, `enableNote`
4. **wishlist**: Thêm status cho `enableNote`, `enableNotification`
5. **checkout**: Thêm status cho payment/shipping features (nếu có)
6. **comments-rating**: Thêm status cho `enableLikes`, `enableReplies`, `enableModeration`
7. **products-list**: Thêm status cho variants/promotions

### Phase 3: UX Cleanup (LOW)
8. Bỏ các warning message "Một số module chưa bật" → thay bằng status rows cụ thể

---

## Ước tính
- **~8 files thay đổi**
- **~150-200 dòng code**
- Không breaking changes
- Chỉ UI/UX, không ảnh hưởng data