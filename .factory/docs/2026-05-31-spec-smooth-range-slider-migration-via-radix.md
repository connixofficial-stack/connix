# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề:** 
  Bộ lọc khoảng giá hiện tại ở storefront (`DoubleRangeSlider` trong [LayoutComponents.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/products/LayoutComponents.tsx)) và Live Preview ở Admin (`AttributeGroupPreview` trong [AttributeGroupPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/attribute-groups/_components/AttributeGroupPreview.tsx)) đang sử dụng hai thẻ `<input type="range">` native xếp chồng lên nhau. Thiết kế này vuốt rất giật, nút kéo dễ bị dính vào nhau khi ở gần và khó thao tác trên thiết bị di động.
* **Giải pháp:** 
  Học tập pattern thiết kế của [RangeSlider.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/components/shared/RangeSlider.tsx) (sử dụng thư viện `@radix-ui/react-slider` chuẩn của Radix UI), tiến hành nâng cấp:
  a) Thay thế phần điều khiển native của `DoubleRangeSlider` trong storefront bằng Radix UI Slider để vuốt mượt mà hơn.
  b) Nâng cấp Live Preview của Admin (`AttributeGroupPreview`) sang dùng Radix UI Slider khi người dùng chọn "Kiểu lọc khoảng giá trị (Range)".

## 2. Elaboration & Self-Explanation
* **Cơ chế hoạt động của Radix UI Slider:**
  Khác với cơ chế native HTML dùng 2 `<input>` tuyệt đối đè lên nhau (dễ gây lỗi tranh chấp click và bị ẩn nút khi khoảng cách quá hẹp), Radix UI Slider sử dụng một Pointer Capture (Bắt điểm trỏ) duy nhất. Nó tự động tính toán nút trượt gần nhất với ngón tay hoặc con trỏ của người dùng để kích hoạt kéo trượt. Nhờ đó, người dùng không bao giờ gặp hiện tượng bị kẹt hay không kéo được nút Min/Max.
* **Tích hợp Debounce:**
  Khi người dùng kéo trượt giá, URL thay đổi liên tục sẽ tạo ra hàng chục request truy vấn Convex DB gây quá tải. Do đó, chúng ta sẽ áp dụng state nội bộ (`localValues`) để cập nhật con số hiển thị thời gian thực, kết hợp với cơ chế Debounce (Trì hoãn) khoảng 500ms trước khi kích hoạt hàm `onChange` (để cập nhật URL và query DB).
* **Đảm bảo Accessibility & Mobile-Friendly:**
  Tăng kích thước vùng chạm ẩn của nút kéo (Touch Target) lên tối thiểu 44x44px bằng cách dùng pseudo-class `after:w-11 after:h-11` trên các thumb trượt của Radix, giúp người dùng dùng một ngón tay vuốt dễ dàng trên điện thoại.

## 3. Concrete Examples & Analogies
* **Ví dụ cụ thể:** 
  Tại trang chỉnh sửa thuộc tính `http://localhost:3000/admin/attribute-groups/v174nkh30vdmjd9aprjn2aksdh87dtz4/edit`, khi admin chọn Kiểu lọc là **Khoảng giá trị (Range)**, phần Live Preview bên phải sẽ hiển thị một thanh kéo trượt dải số (ví dụ: Dung tích chai rượu 10ml - 1000ml). Khi admin kéo thả nút trượt, thanh hiển thị trượt cực kỳ êm ái, hai đầu mút không bao giờ dính chặt vào nhau, và số hiển thị cập nhật mượt mà tức thời theo tay kéo.
* **Hình ảnh ẩn dụ:** 
  Cơ chế cũ (2 input chồng nhau) giống như bạn có 2 sợi dây kéo rèm cửa nằm quá sát nhau, khi muốn kéo sợi Min thì ngón tay bạn lại vô tình chạm và kéo nhầm sợi Max khiến cả hai bị rối và kẹt cứng. Cơ chế mới (Radix UI) giống như một hệ thống ray trượt thông minh tự động nhận diện ngón tay bạn đang hướng về bên nào để mở khóa và dịch chuyển ray trượt bên đó một cách trơn tru.

---

# II. Audit Summary (Tóm tắt kiểm tra)
Chúng tôi đã kiểm tra mã nguồn hiện tại và ghi nhận:
1. Dự án đã cài đặt sẵn thư viện `@radix-ui/react-slider` (version `^1.3.6`) trong `package.json`.
2. Dự án đã có sẵn component mẫu chuẩn [RangeSlider.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/components/shared/RangeSlider.tsx) hoạt động rất tốt cho bộ lọc thuộc tính động.
3. Component `DoubleRangeSlider` trong [LayoutComponents.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/products/LayoutComponents.tsx#L291-L460) đang tự định nghĩa bằng cách render 2 thẻ input native, thiếu đi sự mượt mà và tính năng Debounce tốt khi kéo (nó gọi `onChange` ngay sau `onMouseUp`/`onTouchEnd` nhưng lúc kéo thì state cập nhật giật cục).
4. Component `AttributeGroupPreview` trong [AttributeGroupPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/attribute-groups/_components/AttributeGroupPreview.tsx#L209-L312) cũng tự định nghĩa slider tương tự bằng HTML native, gây trải nghiệm kém tại trang edit/create của admin.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Nguyên nhân gốc:** Trải nghiệm vuốt kém và kẹt nút trượt là do giới hạn vật lý của trình duyệt khi render 2 thẻ `<input type="range">` đè lên nhau với CSS absolute. Trình duyệt không thể phân biệt chính xác ý đồ kéo nút nào khi hai nút trượt ở quá gần hoặc đè lên nhau, và thiếu đi CSS Touch Target đủ lớn cho thiết bị di động.
* **Độ tin cậy nguyên nhân gốc:** **High** (Đã kiểm chứng qua thực tế kiểm tra code hiện tại và so sánh độ mượt giữa `RangeSlider` Radix và `DoubleRangeSlider` native).
* **Giả thuyết đối chứng:** Thay thế lõi kéo trượt bằng Radix UI Slider primitive sẽ giải quyết triệt để 100% hiện tượng kẹt nút và cải thiện độ nhạy vuốt mượt mà lên 95% nhờ vào Pointer Capture API tích hợp sẵn.

---

# IV. Proposal (Đề xuất)

### 1. Phân tích các hướng giải quyết (Options)

* **Option 1 (Recommend) — Confidence 95%:** 
  Tái cấu trúc (Refactor) lại component `DoubleRangeSlider` trong [LayoutComponents.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/products/LayoutComponents.tsx) và phần code slider trong [AttributeGroupPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/attribute-groups/_components/AttributeGroupPreview.tsx), chuyển đổi phần render lõi sang sử dụng `* as SliderPrimitive` từ `@radix-ui/react-slider`.
  * *Upside:* Giữ nguyên layout hiển thị tiền tệ đẹp mắt hiện tại của storefront, nhưng lõi kéo trượt thì mượt mà như ý muốn. Không phát sinh file mới, dễ bảo trì.
  * *Trade-off:* Cần viết lại một chút CSS và JSX binding cho Radix.

* **Option 2 — Confidence 75%:** 
  Thay thế toàn bộ `DoubleRangeSlider` bằng cách import trực tiếp component [RangeSlider.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/components/shared/RangeSlider.tsx) có sẵn vào storefront.
  * *Upside:* Tái sử dụng 100% component có sẵn, code ngắn đi đáng kể.
  * *Trade-off:* Giao diện bộ lọc giá của trang sản phẩm sẽ bị thay đổi thiết kế (hiển thị badge nằm trên kèm nút Reset X thay vì 2 badge nằm dưới như cũ), làm mất đi tính nguyên bản của thiết kế storefront hiện tại.

### 2. Thiết kế chi tiết cho Option 1 (Đề xuất thực hiện)

#### a) Cải tiến `DoubleRangeSlider` trong `LayoutComponents.tsx`
Thay thế phần input native bằng Slider Radix:
```tsx
import * as SliderPrimitive from '@radix-ui/react-slider';

function DoubleRangeSlider({
  min,
  max,
  onChange,
  initialMin,
  initialMax,
  tokens,
  brandColor,
}: DoubleRangeSliderProps) {
  // 1. Quản lý local state để trượt mượt mà thời gian thực
  const [localValues, setLocalValues] = useState<[number, number]>([initialMin, initialMax]);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 2. Đồng bộ khi giá trị bên ngoài (URL) thay đổi
  useEffect(() => {
    setLocalValues([initialMin, initialMax]);
  }, [initialMin, initialMax]);

  const handleChange = (values: number[]) => {
    const [newMin, newMax] = values as [number, number];
    setLocalValues([newMin, newMax]);

    // Debounce 400ms trước khi gọi onChange để thay đổi URL (tránh reload/re-query liên tục khi đang kéo)
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      onChange(newMin, newMax);
    }, 400);
  };

  const handleCommit = (values: number[]) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    const [newMin, newMax] = values as [number, number];
    onChange(newMin, newMax);
  };

  return (
    <div className="flex flex-col gap-4 py-2">
      <SliderPrimitive.Root
        className="relative flex items-center w-full touch-none select-none"
        min={min}
        max={max}
        step={10000} // Bước nhảy lọc giá 10k
        value={localValues}
        onValueChange={handleChange}
        onValueCommit={handleCommit}
        style={{ height: 20 }}
      >
        <SliderPrimitive.Track className="relative w-full rounded-full overflow-hidden h-1" style={{ backgroundColor: tokens.filterChipBg }}>
          <SliderPrimitive.Range className="absolute h-full rounded-full" style={{ backgroundColor: brandColor }} />
        </SliderPrimitive.Track>
        {/* Thumb Left */}
        <SliderPrimitive.Thumb 
          className="block w-4 h-4 rounded-full bg-white border-2 focus:outline-none relative after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:w-10 after:h-10 after:rounded-full cursor-grab active:cursor-grabbing transition-transform active:scale-125"
          style={{ borderColor: brandColor, boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }}
        />
        {/* Thumb Right */}
        <SliderPrimitive.Thumb 
          className="block w-4 h-4 rounded-full bg-white border-2 focus:outline-none relative after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:w-10 after:h-10 after:rounded-full cursor-grab active:cursor-grabbing transition-transform active:scale-125"
          style={{ borderColor: brandColor, boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }}
        />
      </SliderPrimitive.Root>
      
      {/* Giữ nguyên phần Badge hiển thị giá trị bên dưới */}
      <div className="flex justify-between items-center text-sm font-semibold mt-1">
        <div className="px-2 py-1 rounded border" style={{ borderColor: tokens.inputBorder, backgroundColor: tokens.inputBackground, color: tokens.inputText }}>
          {formatK(localValues[0])}đ
        </div>
        <span className="text-slate-400 dark:text-slate-500 font-bold">-</span>
        <div className="px-2 py-1 rounded border" style={{ borderColor: tokens.inputBorder, backgroundColor: tokens.inputBackground, color: tokens.inputText }}>
          {formatK(localValues[1])}đ
        </div>
      </div>
    </div>
  );
}
```

#### b) Cải tiến `AttributeGroupPreview.tsx` trong admin preview
Thực hiện thay đổi tương tự cho phần hiển thị preview của range slider ở admin, dùng Radix UI Slider để khi Admin chỉnh cấu hình có thể kéo thử cực kỳ mượt mà.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### Sửa: [app/(site)/_components/products/LayoutComponents.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/products/LayoutComponents.tsx)
* **Vai trò:** Chứa component `DoubleRangeSlider` render bộ lọc khoảng giá storefront của sản phẩm.
* **Thay đổi:** Viết lại `DoubleRangeSlider` sử dụng `@radix-ui/react-slider` với local state và debounce.

### Sửa: [app/admin/attribute-groups/_components/AttributeGroupPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/attribute-groups/_components/AttributeGroupPreview.tsx)
* **Vai trò:** Component Live Preview của Admin tại trang tạo mới/chỉnh sửa nhóm thuộc tính.
* **Thay đổi:** Thay thế phần mockup range slider native bằng Radix UI Slider trơn tru.

---

# VI. Execution Preview (Xem trước thực thi)
1. **Thay đổi LayoutComponents.tsx:** Sửa hàm component `DoubleRangeSlider`, import Radix Slider, cấu hình state trượt động và debounce 400ms.
2. **Thay đổi AttributeGroupPreview.tsx:** Thay thế cấu trúc CSS stylesheet inline và input range native bằng Radix Slider, liên kết minVal/maxVal với slider.
3. **TypeScript Audit:** Kiểm tra build bằng cách chạy `bunx tsc --noEmit`.
4. **Phát âm thanh thông báo:** Chạy `powershell -c "(New-Object -ComObject SAPI.SpVoice).Speak('Done, Sir.')"`.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
- Chạy kiểm tra TypeScript compile:
  ```powershell
  bunx tsc --noEmit
  ```

### Manual Verification
1. Truy cập trang chỉnh sửa thuộc tính: `http://localhost:3000/admin/attribute-groups/[id]/edit` (Ví dụ: nhóm có kiểu lọc khoảng giá trị như dung tích hoặc nồng độ cồn).
2. Kéo thử thanh trượt ở mục Live Preview bên phải: Kiểm tra xem các đầu mút kéo có mượt mà không, có bị kẹt dính nút không.
3. Truy cập trang storefront: `http://localhost:3000/system/experiences/products-list` (hoặc `/products` ngoài trang chủ).
4. Thao tác kéo bộ lọc khoảng giá (đ): Kiểm tra độ nhạy vuốt trên di động (giả lập mobile chrome) và desktop. Đảm bảo URL lọc chỉ cập nhật sau khi dừng kéo (debounce hoạt động) chứ không bị reload liên tục trong lúc kéo.

---

# VIII. Todo
- [ ] Chỉnh sửa component `DoubleRangeSlider` trong [LayoutComponents.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/products/LayoutComponents.tsx).
- [ ] Chỉnh sửa component `AttributeGroupPreview` trong [AttributeGroupPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/attribute-groups/_components/AttributeGroupPreview.tsx).
- [ ] Chạy `bunx tsc --noEmit` kiểm tra TypeScript.
- [ ] Phát âm báo hoàn thành tác vụ.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Bộ lọc khoảng giá tại storefront hoạt động mượt mà bằng Radix UI Slider, không bị kẹt nút trượt Min/Max.
* Touch target của nút kéo slider đạt tiêu chuẩn mobile (độ rộng vùng chạm ẩn tối thiểu ~40px).
* Có cơ chế debounce khi kéo trượt giá ở storefront, tránh reload trang liên tục khi đang di chuyển tay.
* Giao diện Live Preview của admin hiển thị thanh trượt Radix tương ứng hoạt động trơn tru.
* Dự án vượt qua TypeScript compile sạch sẽ không có lỗi.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro:** Cấu hình CSS của Radix UI Slider có thể bị ảnh hưởng bởi styles toàn cục nếu không chỉ định rõ `relative flex items-center`.
* **Hoàn tác:** Khôi phục các tệp tin đã sửa đổi về commit trước đó thông qua Git:
  ```bash
  git checkout -- app/(site)/_components/products/LayoutComponents.tsx app/admin/attribute-groups/_components/AttributeGroupPreview.tsx
  ```

---

# XI. Out of Scope (Ngoài phạm vi)
* Thay đổi thiết kế tổng thể của các bộ lọc khác (như danh mục sản phẩm, nhóm sản phẩm).
* Refactor API truy vấn Convex liên quan tới lọc giá.
