## Problem Graph
1. [Main] Header experience chưa có control ẩn/hiện tên thương hiệu nên khó tối ưu không gian menu
   1.1 [Sub] Config hiện tại không có cờ `showBrandName`
      1.1.1 [ROOT CAUSE] `HeaderMenuConfig` thiếu field điều khiển text brand ở cả editor, preview, site runtime
   1.2 [Sub] Khi tắt CTA hoặc ẩn Brand Name, menu chưa tận dụng hết không gian trống
      1.2.1 [ROOT CAUSE] Logic overflow (More) chưa ưu tiên “dùng hết chỗ trống thực tế trước khi gom item”

## Execution (with reflection)
1. Bổ sung config mới cho toggle tên thương hiệu (áp dụng cả Classic + Topbar + Allbirds)
   - Thought: Bạn chọn phạm vi toàn bộ layout, nên cần thống nhất 1 field dùng chung.
   - Action:
     - File `components/experiences/previews/HeaderMenuPreview.tsx`
       - Mở rộng type `HeaderMenuConfig` thêm `showBrandName: boolean`.
     - File `app/system/experiences/menu/page.tsx`
       - Thêm `showBrandName: true` vào `DEFAULT_CONFIG`.
       - Khi merge server config, giữ backward compatibility (`raw?.showBrandName ?? true`).
       - Thêm `ToggleRow` mới trong block “Hiển thị”: **Tên thương hiệu**.
       - Đảm bảo `normalizedConfig` giữ field này để save về `header_config`.
     - File `components/site/Header.tsx`
       - Mở rộng `HeaderConfig` thêm `showBrandName?: boolean`.
       - Thêm `showBrandName: true` vào `DEFAULT_CONFIG` và merge với saved config.
   - Reflection: ✓ 1 field xuyên suốt editor/preview/site, không cần tách logic riêng từng layout.

2. Áp dụng toggle vào render UI cả 3 layout
   - Thought: Bạn muốn “logo đủ rồi, khỏi text thêm”, và giữ nguyên kích thước logo block.
   - Action:
     - `HeaderMenuPreview.tsx`:
       - Classic/Topbar/Allbirds: chỉ render text brand khi `config.showBrandName === true`.
       - Khi `false`: giữ logo/badge như hiện tại, không đổi size; chỉ bỏ `<span>{brandLabel}</span>`.
     - `Header.tsx`:
       - Áp dụng cùng điều kiện cho 3 layout để parity 100% preview = site thật.
   - Reflection: ✓ Không phá nhận diện logo, chỉ loại bỏ text dư theo nhu cầu.

3. Tận dụng không gian menu tốt hơn trước khi fallback More (ưu tiên theo không gian thực tế)
   - Thought: Bạn xác nhận “nếu ẩn CTA + tắt BrandName thì ưu tiên nới ra; chỉ khi thực sự chật mới ...”.
   - Action:
     - Dùng lại cơ chế đo chiều rộng thực tế hiện có ở classic (`ResizeObserver` + đo item widths).
     - Điều chỉnh tính toán `visibleRootCount` theo nguyên tắc:
       1) Luôn đo theo chiều rộng nav còn lại thực tế (đã phản ánh việc CTA/brand text có hiển thị hay không).
       2) Chỉ đưa vào More khi tổng width vượt container thật.
     - Đảm bảo observer re-calc khi các yếu tố ảnh hưởng không gian đổi trạng thái (ít nhất: số item root thay đổi; đồng thời trigger bởi resize/layout reflow khi toggle CTA/BrandName).
     - Không auto-hide CTA mới; CTA vẫn theo toggle hiện có của user.
   - Reflection: ✓ Đúng yêu cầu: ưu tiên giãn menu tối đa, More chỉ là fallback khi hết chỗ thật.

4. Đồng bộ UX ở /system/experiences/menu
   - Thought: Cần UX rõ ràng để user hiểu tác động đến không gian menu.
   - Action (file `app/system/experiences/menu/page.tsx`):
     - Đặt toggle “Tên thương hiệu” gần CTA trong nhóm “Hiển thị”.
     - Thêm hint ngắn trong `HINTS` (ví dụ: “Tắt Tên thương hiệu + CTA để tăng không gian menu trước khi More”).
   - Reflection: ✓ User thấy ngay mối liên hệ giữa toggle và không gian menu.

5. Validation trước khi hoàn tất
   - Action:
     - Chạy `bunx tsc --noEmit`.
     - Test thủ công nhanh trên `/system/experiences/menu`:
       - Toggle Brand Name on/off ở 3 layout.
       - Classic: bật/tắt CTA + Brand Name, kiểm tra số item hiển thị tăng/giảm hợp lý và chỉ vào More khi thiếu chỗ.
       - Xác nhận preview và site runtime cùng hành vi.
     - Commit local và add `.factory/docs` theo rule repo.

## Checklist
- [ ] Có toggle `showBrandName` trong Header Menu Experience
- [ ] Toggle áp dụng cho Classic + Topbar + Allbirds
- [ ] Ẩn brand name vẫn giữ nguyên logo size
- [ ] Classic tận dụng không gian thực tế trước, More chỉ xuất hiện khi thật sự chật
- [ ] `bunx tsc --noEmit` pass
- [ ] Commit đầy đủ (kèm `.factory/docs`)