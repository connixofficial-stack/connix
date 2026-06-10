## Problem Graph
1. [Main] Module Kanban khong hien thi tren /system/modules
   1.1 [ROOT CAUSE] DB da seed truoc khi co kanban -> record `kanban` khong ton tai trong `adminModules` table

## Giai phap

Co 2 cach:

### Option A: Re-seed data (nhanh, don gian)
- Vao trang `/system/modules`, mo browser console hoac them nut "Re-seed" de goi `seedModule({ module: 'adminModules', quantity: 0 })` voi `force: true`
- **Nhuoc diem**: Reset toan bo modules ve trang thai mac dinh (mat cac thay doi toggle on/off da lam truoc do)

### Option B: Them logic upsert kanban vao seeder (tot hon)
- Sua `adminModules.seeder.ts`: Sau khi check `existing`, them logic kiem tra va insert cac module con thieu (so sanh danh sach modules voi DB)
- Hoac don gian hon: Sua `useEffect` trong `page.tsx` de check va insert module kanban neu chua co
- **Uu diem**: Khong mat data cu, tu dong them module moi khi deploy

### Cach lam cu the (Option B):
1. **File**: `convex/seeders/adminModules.seeder.ts`
   - Sau khi check `if (existing)`, them logic: query tat ca modules hien co, so sanh voi danh sach `modules[]`, insert cac module chua co (dua tren `key`)
   - Return ket qua voi so luong created = so module moi them

2. **Test**: Vao lai `/system/modules`, page se tu dong goi seed va them kanban module con thieu