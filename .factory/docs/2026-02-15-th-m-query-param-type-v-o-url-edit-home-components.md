# Spec: Thêm query param `?type=X` vào URL edit home-components

## 📋 Bối cảnh hiện tại

**URL hiện tại:**
- **Create**: `/admin/home-components/create/hero` → Rõ ràng đang tạo component nào
- **Edit**: `/admin/home-components/js713t277p9n2bf1fg19sv71k9814dmx/edit` → Chỉ thấy ID, không biết đang edit component gì

**Vấn đề:** Khi chia sẻ URL edit cho dev, không thể biết đang edit component nào (Hero, CTA, Stats...) mà chỉ thấy ID khó hiểu.

**Giải pháp:** Thêm query param `?type=hero` vào URL edit để rõ ràng hơn: `/admin/home-components/[id]/edit?type=hero`

---

## 🎯 Mục tiêu

Khi click "Edit" từ danh sách hoặc từ bất kỳ đâu dẫn đến trang edit, URL sẽ tự động có `?type=X` (với X là slug lowercase của component type: `hero`, `stats`, `cta`, v.v.).

**Ví dụ:**
```
/admin/home-components/js713t277p9n2bf1fg19sv71k9814dmx/edit?type=hero
/admin/home-components/abc123/edit?type=stats
/admin/home-components/xyz789/edit?type=cta
```

---

## 🔧 Chi tiết implementation

### 1. Cập nhật navigation trong list page (app/admin/home-components/page.tsx)

**File:** `app/admin/home-components/page.tsx`  
**Vị trí:** Line 109  
**Hiện tại:**
```tsx
<Link href={`/admin/home-components/${comp._id}/edit`}>
```

**Thay đổi thành:**
```tsx
<Link href={`/admin/home-components/${comp._id}/edit?type=${comp.type.toLowerCase()}`}>
```

**Logic:**
- Lấy `comp.type` (ví dụ: `"Hero"`, `"Stats"`, `"CTA"`)
- Chuyển thành lowercase (`"hero"`, `"stats"`, `"cta"`)
- Append vào URL dưới dạng query param

---

### 2. (Tùy chọn) Kiểm tra nếu có nơi khác navigation đến edit page

**Action:**
- Tìm kiếm toàn bộ codebase với pattern: `router.push.*home-components.*edit` hoặc `href.*home-components.*edit`
- Nếu có nơi khác navigation đến edit page (ví dụ: từ buttons, redirects), cũng thêm `?type=${type.toLowerCase()}`

**Ví dụ code cần check:**
```tsx
// Nếu có code như này:
router.push(`/admin/home-components/${id}/edit`);

// Thay thành:
router.push(`/admin/home-components/${id}/edit?type=${type.toLowerCase()}`);
```

---

### 3. (Không cần sửa) Edit page đã sẵn sàng

**File:** `app/admin/home-components/[id]/edit/page.tsx`  
**Trạng thái:** Không cần sửa gì, vì:
- Edit page chỉ cần `params.id` để query component từ DB
- Query param `?type=X` chỉ để hiển thị trên URL cho dev dễ nhìn, không ảnh hưởng logic

**Lưu ý:** Nếu muốn validate hoặc hiển thị `type` từ query param, có thể dùng:
```tsx
import { useSearchParams } from 'next/navigation';

const searchParams = useSearchParams();
const typeFromUrl = searchParams.get('type'); // "hero", "stats", etc.
```
Nhưng **KHÔNG cần thiết** cho requirement này.

---

## ✅ Acceptance Criteria

1. ✅ Click "Edit" từ list page → URL có `?type=hero` (hoặc component type tương ứng)
2. ✅ URL có thể share cho dev và nhìn biết ngay đang edit component gì
3. ✅ Trang edit vẫn hoạt động bình thường (không bị lỗi do thêm query param)

---

## 📦 Files cần sửa

1. **app/admin/home-components/page.tsx** (line 109)
   - Thêm `?type=${comp.type.toLowerCase()}` vào href Link

2. **(Optional)** Các file khác có navigation đến edit page (cần search để xác nhận)

---

## 🧪 Test scenarios

1. **Happy path:** Click Edit từ list page → URL có query param
2. **Type mapping:** Hero → `?type=hero`, Stats → `?type=stats`, CTA → `?type=cta`
3. **Backward compatibility:** Nếu ai đó truy cập URL cũ (không có query param), vẫn hoạt động bình thường

---

## 📝 Notes

- Query param là **read-only reference**, không dùng để logic nghiệp vụ (vì component type thật nằm trong DB khi query bằng `id`)
- Giúp developer dễ dàng share URL và biết ngay context khi debug/review
- Không ảnh hưởng đến routing của Next.js (vì routing vẫn là `/admin/home-components/[id]/edit`, query param chỉ là metadata)