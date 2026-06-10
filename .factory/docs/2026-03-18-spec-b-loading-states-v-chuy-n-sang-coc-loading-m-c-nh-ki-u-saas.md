## Audit Summary
- Observation: `/system/experiences/loading-states` đang thêm một tầng cấu hình cho hành vi loading, nhưng chính anh đã thấy nó không tạo giá trị tương xứng và làm lệch CoC.
- Observation: Từ audit trước, phần đúng nhất theo SaaS/enterprise là: **header thật preload sớm**, còn loading visual tập trung ở **hero/content area**, không phải cho menu/navigation.
- Observation: Code hiện đã có nền tốt để đi theo hướng này: `app/(site)/layout.tsx` đã preload được header data server-side; `Header.tsx` đã nhận `initialData`.
- Observation: Web evidence 2024–2026 vẫn nhất quán: skeleton phù hợp cho content block; navigation/header nên ổn định hoặc hiện nội dung thật càng sớm càng tốt. Spinner/logo loader toàn trang không phải pattern chính cho homepage SaaS.
- Observation: Nếu giữ `Loading States`, team sẽ phải duy trì thêm schema/config/UI/runtime mapping nhưng lợi ích thấp, nhất là khi best practice thực tế chỉ có 1 hướng hợp lý.

## Root Cause Confidence
**High** — Với mục tiêu CoC, root cause hiện tại là đang “configurable hóa” một thứ lẽ ra nên có default cố định. Loading homepage theo best practice SaaS không cần hẳn một experience riêng nếu hệ thống chỉ có một hướng đúng: header thật preload + hero skeleton tinh gọn + reveal tự nhiên.

## Đề xuất
### Option A - CoC tối giản theo SaaS (Recommend)
Confidence 93%.

Bỏ hoàn toàn `/system/experiences/loading-states` và chuyển sang default cứng như sau:
1. **Header luôn preload thật từ server**
   - Không có skeleton menu.
   - Header render ngay bằng dữ liệu thật từ `layout`.
2. **Homepage chỉ dùng hero/content skeleton khi thật sự cần**
   - Nếu homepage data chưa sẵn: hiện hero skeleton đẹp, bám layout thật.
   - Không render skeleton toàn page kiểu generic.
3. **Reveal mặc định kiểu SaaS**
   - Header hiện ngay.
   - Hero hiện skeleton ngắn nếu cần, rồi thay bằng content thật.
   - Section dưới fold không bị block bởi contract phức tạp.
4. **Xóa toàn bộ Loading States experience**
   - bỏ route `app/system/experiences/loading-states/page.tsx`
   - bỏ card ở `app/system/experiences/_constants.ts`
   - bỏ key/type/export `loading_states_ui` trong `lib/experiences/*`
   - bỏ schema/config runtime thừa
5. **Giữ logic runtime đơn giản**
   - `HomePageClient` không đọc settings loading nữa
   - dùng default local constant trong code, không lưu DB settings

### Vì sao recommend
- Đúng CoC: chỉ còn một hành vi mặc định tốt nhất.
- Đúng SaaS practice phổ biến: real header + focused hero skeleton.
- Giảm maintenance: bớt route, bớt config schema, bớt settings DB, bớt user confusion.
- Tránh over-engineer cho một UX pattern gần như không cần user tự cấu hình.

### Option B - CoC cực gọn chỉ preload header
Confidence 68%.

Bỏ `Loading States`, preload header thật, nhưng cũng bỏ luôn hero skeleton custom; chỉ để homepage render tự nhiên theo data availability.

Phù hợp nếu muốn giảm code tối đa, nhưng UX sẽ kém polished hơn Option A khi homepage data chậm.

## Counter-hypothesis
- Giả thuyết: vẫn nên giữ `Loading States` cho tương lai tái dùng nhiều page.
- Kết luận: **Low confidence** trong bối cảnh hiện tại. Nếu chỉ có một hướng best practice rõ ràng, giữ UI config sẽ trái CoC và tăng cognitive load.

## Problem Graph
1. [Loading homepage đang over-configured] <- depends on 1.1, 1.2
   1.1 [UI config không cần thiết] <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] Loading States page đang encode nhiều lựa chọn cho một problem có default rõ
   1.2 [Runtime mapping phức tạp] <- depends on 1.2.1
      1.2.1 [ROOT CAUSE] Homepage loading phụ thuộc settings/schema thay vì convention mặc định

## Proposal chi tiết (Option A)
### 1) Xóa experience Loading States
- Remove `app/system/experiences/loading-states/page.tsx`
- Remove card entry trong `app/system/experiences/_constants.ts`
- Remove `loading_states_ui` khỏi `lib/experiences/constants.ts`
- Remove exports/types ở `lib/experiences/index.ts`
- Remove `lib/experiences/loading-states/config.ts`

### 2) Chuyển homepage loading sang convention nội bộ
Tạo/giữ một local convention kiểu:
- `HEADER_LOADING_MODE = 'real-preloaded'`
- `HOMEPAGE_HERO_LOADING_MODE = 'skeleton'`
- `HOMEPAGE_DELAY_MS = 120`
- `HOMEPAGE_MIN_DISPLAY_MS = 320`

Nhưng các giá trị này ở code nội bộ, không lộ UI config.

### 3) Đơn giản hóa `HomePageClient`
- bỏ `api.settings.getByKey({ key: LOADING_EXPERIENCE_KEY })`
- bỏ parse/resolve config loading
- dùng default convention trực tiếp
- logic chỉ còn:
  - nếu data chưa sẵn => hero skeleton
  - nếu data sẵn => render content thật

### 4) Giữ và polish header preload
- giữ `initialHeaderData` ở `app/(site)/layout.tsx`
- giữ `Header initialData` fallback ở `components/site/Header.tsx`
- đảm bảo không còn loading UI riêng cho menu

### 5) Giữ hero skeleton, bỏ generic page-loading abstraction
- `components/site/loading/HomePageLoading.tsx` có thể rename hoặc thu gọn thành homepage-specific hero loader
- bỏ tư duy “universal loading system”
- chỉ giữ đúng pattern homepage cần dùng

## File-level plan
- `app/system/experiences/_constants.ts`
  - xóa Loading States card
- `app/system/experiences/loading-states/page.tsx`
  - xóa file
- `lib/experiences/constants.ts`
  - xóa `loading_states_ui`
- `lib/experiences/index.ts`
  - xóa export loading-states
- `lib/experiences/loading-states/config.ts`
  - xóa file
- `app/(site)/_components/HomePageClient.tsx`
  - bỏ settings-driven loading, thay bằng convention cứng
- `components/site/loading/HomePageLoading.tsx`
  - thu gọn còn hero-focused loader
- `app/(site)/layout.tsx`, `components/site/Header.tsx`, `components/site/SiteShell.tsx`
  - giữ pattern preload header thật, chỉ cleanup nếu còn dấu vết config cũ

## Execution (with reflection)
1. Solving 1.1.1...
   - Thought: Nếu chỉ có một hướng hợp lý, UI config là thừa.
   - Action: xóa Loading States experience và key liên quan.
   - Reflection: hệ thống sẽ đúng CoC hơn.
2. Solving 1.2.1...
   - Thought: loading homepage nên là convention nội bộ.
   - Action: hardcode default SaaS pattern trong homepage runtime.
   - Reflection: ít điểm gãy hơn, dễ maintain hơn.
3. Polishing UX...
   - Thought: UX tốt nhất đến từ header thật + hero skeleton, không phải dashboard config.
   - Action: giữ preload header và tinh hero loader.
   - Reflection: đúng kỳ vọng “best practice SaaS dùng nhiều nhất”.

## Verification Plan
- Repro sau khi làm:
  1. `/system/experiences` không còn Loading States.
  2. Homepage vẫn có header thật hiện sớm từ server.
  3. Khi homepage data chậm, chỉ hero/content đầu trang có skeleton hợp lý; không có menu skeleton giả.
  4. Không còn phụ thuộc DB setting `loading_states_ui` để homepage chạy đúng.
- Static verification:
  - review import/export không còn dangling references sau khi xóa
  - đảm bảo `Header` preload flow vẫn hoạt động
  - nếu có thay đổi TS code thì chạy `bunx tsc --noEmit`

Em recommend **Option A**: bỏ hẳn Loading States theo CoC, giữ duy nhất convention SaaS phổ biến nhất là **header preload thật + hero skeleton tối giản khi cần**.