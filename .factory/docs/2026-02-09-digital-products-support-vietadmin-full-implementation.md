## Spec: Hỗ trợ Sản phẩm Digital cho VietAdmin - FULL IMPLEMENTATION

### Tổng quan
Mở rộng hệ thống để hỗ trợ bán sản phẩm digital (tài khoản, license key, file download, custom) với workflow bán tự động giao hàng khi admin xác nhận thanh toán.

---

## PHASE 1: SCHEMA & BACKEND

### Task 1.1: Cập nhật Schema - Products
**File:** `convex/schema.ts`

```typescript
// Thêm vào products table (sau field metaDescription)
productType: v.optional(v.union(v.literal("physical"), v.literal("digital"))),
digitalDeliveryType: v.optional(v.union(
  v.literal("account"),
  v.literal("license"),
  v.literal("download"),
  v.literal("custom")
)),
// Template credentials cho digital products (admin nhập sẵn khi tạo SP)
digitalCredentialsTemplate: v.optional(v.object({
  username: v.optional(v.string()),
  password: v.optional(v.string()),
  licenseKey: v.optional(v.string()),
  downloadUrl: v.optional(v.string()),
  customContent: v.optional(v.string()),
  expiresAt: v.optional(v.number()),
})),
```

**Checklist:**
- [ ] Thêm 3 fields vào products table
- [ ] Chạy `npx convex dev` để sync schema

---

### Task 1.2: Cập nhật Schema - Orders
**File:** `convex/schema.ts`

```typescript
// Cập nhật orders.items array - thêm digitalCredentials
items: v.array(v.object({
  price: v.number(),
  productId: v.id("products"),
  productImage: v.optional(v.string()),
  productName: v.string(),
  quantity: v.number(),
  variantId: v.optional(v.id("productVariants")),
  variantTitle: v.optional(v.string()),
  // NEW: Digital credentials
  isDigital: v.optional(v.boolean()),
  digitalDeliveryType: v.optional(v.string()),
  digitalCredentials: v.optional(v.object({
    username: v.optional(v.string()),
    password: v.optional(v.string()),
    licenseKey: v.optional(v.string()),
    downloadUrl: v.optional(v.string()),
    customContent: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    deliveredAt: v.optional(v.number()),
  })),
})),
// NEW: Flag đánh dấu đơn hàng có digital
isDigitalOrder: v.optional(v.boolean()),
```

**Checklist:**
- [ ] Thêm fields vào orders.items
- [ ] Thêm isDigitalOrder field
- [ ] Chạy `npx convex dev` để sync schema

---

### Task 1.3: Cập nhật Products Mutations
**File:** `convex/products.ts`

**1. Update `create` mutation args:**
```typescript
args: {
  // ... existing args
  productType: v.optional(v.union(v.literal("physical"), v.literal("digital"))),
  digitalDeliveryType: v.optional(v.union(
    v.literal("account"),
    v.literal("license"),
    v.literal("download"),
    v.literal("custom")
  )),
  digitalCredentialsTemplate: v.optional(v.object({
    username: v.optional(v.string()),
    password: v.optional(v.string()),
    licenseKey: v.optional(v.string()),
    downloadUrl: v.optional(v.string()),
    customContent: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  })),
}
```

**2. Update `create` handler:**
```typescript
// Trong handler, thêm vào insert:
productType: args.productType ?? "physical",
digitalDeliveryType: args.productType === "digital" ? args.digitalDeliveryType : undefined,
digitalCredentialsTemplate: args.productType === "digital" ? args.digitalCredentialsTemplate : undefined,
```

**3. Update `update` mutation tương tự**

**Checklist:**
- [ ] Thêm args vào create mutation
- [ ] Cập nhật handler create
- [ ] Thêm args vào update mutation
- [ ] Cập nhật handler update
- [ ] Cập nhật productDoc validator (nếu có)

---

### Task 1.4: Cập nhật Orders Mutations
**File:** `convex/orders.ts`

**1. Thêm mutation `deliverDigitalItem`:**
```typescript
export const deliverDigitalItem = mutation({
  args: {
    orderId: v.id("orders"),
    itemIndex: v.number(),
    credentials: v.object({
      username: v.optional(v.string()),
      password: v.optional(v.string()),
      licenseKey: v.optional(v.string()),
      downloadUrl: v.optional(v.string()),
      customContent: v.optional(v.string()),
      expiresAt: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");
    if (args.itemIndex < 0 || args.itemIndex >= order.items.length) {
      throw new Error("Invalid item index");
    }
    
    const updatedItems = [...order.items];
    updatedItems[args.itemIndex] = {
      ...updatedItems[args.itemIndex],
      digitalCredentials: {
        ...args.credentials,
        deliveredAt: Date.now(),
      },
    };
    
    await ctx.db.patch(args.orderId, { items: updatedItems });
    return null;
  },
  returns: v.null(),
});
```

**2. Cập nhật `create` mutation:**
- Khi tạo order, copy `isDigital`, `digitalDeliveryType`, `digitalCredentialsTemplate` từ product vào order item
- Set `isDigitalOrder: true` nếu có ít nhất 1 item digital

**3. Cập nhật `updatePaymentStatus` (hoặc tạo hook):**
- Khi status chuyển sang `Paid`:
  - Lấy setting `digitalDeliveryMode` từ moduleSettings
  - Nếu mode = `semi-auto` hoặc `auto`:
    - Với mỗi item digital có `digitalCredentialsTemplate`:
    - Set `deliveredAt = Date.now()`

**Checklist:**
- [ ] Tạo mutation `deliverDigitalItem`
- [ ] Cập nhật `create` mutation để copy digital info từ product
- [ ] Thêm logic auto-deliver trong `updatePaymentStatus`

---

### Task 1.5: Cập nhật Orders Model
**File:** `convex/model/orders.ts`

- Cập nhật `create` function để handle digital items
- Cập nhật `updatePaymentStatus` để trigger auto-deliver

**Checklist:**
- [ ] Cập nhật create function
- [ ] Cập nhật updatePaymentStatus function

---

## PHASE 2: MODULE SETTINGS

### Task 2.1: Products Module Config
**File:** `lib/modules/configs/products.config.ts`

```typescript
// Thêm vào settingGroups:
{ key: 'digital', label: 'Sản phẩm Digital', icon: Download }, // import Download from lucide-react

// Thêm vào settings:
{
  key: 'enableDigitalProducts',
  label: 'Bật sản phẩm Digital',
  type: 'toggle',
  default: false,
  group: 'digital',
},
{
  key: 'defaultDigitalDeliveryType',
  label: 'Loại giao hàng mặc định',
  type: 'select',
  default: 'account',
  options: [
    { value: 'account', label: 'Tài khoản (username/password)' },
    { value: 'license', label: 'License Key' },
    { value: 'download', label: 'File Download' },
    { value: 'custom', label: 'Tùy chỉnh' },
  ],
  group: 'digital',
  dependsOn: 'enableDigitalProducts',
},
```

**Checklist:**
- [ ] Import icon Download
- [ ] Thêm settingGroup 'digital'
- [ ] Thêm 2 settings

---

### Task 2.2: Orders Module Config
**File:** `lib/modules/configs/orders.config.ts`

```typescript
// Thêm vào settingGroups:
{ key: 'digital', label: 'Giao hàng Digital' },

// Thêm vào settings:
{
  key: 'digitalDeliveryMode',
  label: 'Chế độ giao hàng Digital',
  type: 'select',
  default: 'semi-auto',
  options: [
    { value: 'auto', label: 'Tự động (Paid → hiển thị ngay)' },
    { value: 'semi-auto', label: 'Bán tự động (Admin confirm → tự gửi)' },
    { value: 'manual', label: 'Thủ công (Admin nhập credentials)' },
  ],
  group: 'digital',
},
```

**Checklist:**
- [ ] Thêm settingGroup 'digital'
- [ ] Thêm setting digitalDeliveryMode

---

## PHASE 3: ADMIN UI

### Task 3.1: Component - DigitalCredentialsForm
**File:** `components/orders/DigitalCredentialsForm.tsx` (TẠO MỚI)

```tsx
'use client';

import React from 'react';
import { Eye, EyeOff, Key, Link as LinkIcon, User, FileText } from 'lucide-react';
import { Input, Label, Button } from '@/app/admin/components/ui';

type DigitalDeliveryType = 'account' | 'license' | 'download' | 'custom';

type Credentials = {
  username?: string;
  password?: string;
  licenseKey?: string;
  downloadUrl?: string;
  customContent?: string;
  expiresAt?: number;
};

type Props = {
  type: DigitalDeliveryType;
  value: Credentials;
  onChange: (credentials: Credentials) => void;
  disabled?: boolean;
};

export function DigitalCredentialsForm({ type, value, onChange, disabled }: Props) {
  const [showPassword, setShowPassword] = React.useState(false);

  const handleChange = (key: keyof Credentials, val: string | number | undefined) => {
    onChange({ ...value, [key]: val });
  };

  return (
    <div className="space-y-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
      {type === 'account' && (
        <>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><User size={14}/> Username</Label>
            <Input
              value={value.username ?? ''}
              onChange={(e) => handleChange('username', e.target.value)}
              placeholder="Nhập username..."
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Key size={14}/> Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={value.password ?? ''}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Nhập password..."
                disabled={disabled}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>
        </>
      )}

      {type === 'license' && (
        <div className="space-y-2">
          <Label className="flex items-center gap-2"><Key size={14}/> License Key</Label>
          <Input
            value={value.licenseKey ?? ''}
            onChange={(e) => handleChange('licenseKey', e.target.value)}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            className="font-mono"
            disabled={disabled}
          />
        </div>
      )}

      {type === 'download' && (
        <div className="space-y-2">
          <Label className="flex items-center gap-2"><LinkIcon size={14}/> Download URL</Label>
          <Input
            type="url"
            value={value.downloadUrl ?? ''}
            onChange={(e) => handleChange('downloadUrl', e.target.value)}
            placeholder="https://..."
            disabled={disabled}
          />
        </div>
      )}

      {type === 'custom' && (
        <div className="space-y-2">
          <Label className="flex items-center gap-2"><FileText size={14}/> Nội dung</Label>
          <textarea
            className="w-full min-h-[100px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
            value={value.customContent ?? ''}
            onChange={(e) => handleChange('customContent', e.target.value)}
            placeholder="Nhập nội dung giao cho khách..."
            disabled={disabled}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>Ngày hết hạn (tùy chọn)</Label>
        <Input
          type="date"
          value={value.expiresAt ? new Date(value.expiresAt).toISOString().split('T')[0] : ''}
          onChange={(e) => handleChange('expiresAt', e.target.value ? new Date(e.target.value).getTime() : undefined)}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
```

**Checklist:**
- [ ] Tạo file component
- [ ] Export từ `components/orders/index.ts` (nếu có)

---

### Task 3.2: Component - DigitalCredentialsDisplay
**File:** `components/orders/DigitalCredentialsDisplay.tsx` (TẠO MỚI)

```tsx
'use client';

import React, { useState } from 'react';
import { Check, Copy, Download, Eye, EyeOff, Key, User, FileText, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

type Credentials = {
  username?: string;
  password?: string;
  licenseKey?: string;
  downloadUrl?: string;
  customContent?: string;
  expiresAt?: number;
  deliveredAt?: number;
};

type Props = {
  type: string;
  credentials: Credentials;
  brandColor?: string;
};

const getTint = (hex: string, opacity: number) => {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export function DigitalCredentialsDisplay({ type, credentials, brandColor = '#22c55e' }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Đã copy!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const isExpired = credentials.expiresAt && credentials.expiresAt < Date.now();

  return (
    <div
      className="rounded-xl border p-4 space-y-3"
      style={{ backgroundColor: getTint(brandColor, 0.04), borderColor: getTint(brandColor, 0.2) }}
    >
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-slate-500 uppercase">Thông tin sản phẩm Digital</div>
        {isExpired && (
          <div className="flex items-center gap-1 text-xs text-amber-600">
            <AlertTriangle size={12}/> Đã hết hạn
          </div>
        )}
      </div>

      {type === 'account' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <User size={14} className="text-slate-400"/>
              <span className="text-sm font-mono">{credentials.username}</span>
            </div>
            <button
              type="button"
              onClick={() => credentials.username && copyToClipboard(credentials.username, 'username')}
              className="text-slate-400 hover:text-slate-600"
            >
              {copiedField === 'username' ? <Check size={14} className="text-green-500"/> : <Copy size={14}/>}
            </button>
          </div>
          <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Key size={14} className="text-slate-400"/>
              <span className="text-sm font-mono">
                {showPassword ? credentials.password : '••••••••••••'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={14}/> : <Eye size={14}/>}
              </button>
              <button
                type="button"
                onClick={() => credentials.password && copyToClipboard(credentials.password, 'password')}
                className="text-slate-400 hover:text-slate-600"
              >
                {copiedField === 'password' ? <Check size={14} className="text-green-500"/> : <Copy size={14}/>}
              </button>
            </div>
          </div>
        </div>
      )}

      {type === 'license' && (
        <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Key size={14} className="text-slate-400"/>
            <span className="text-sm font-mono">{credentials.licenseKey}</span>
          </div>
          <button
            type="button"
            onClick={() => credentials.licenseKey && copyToClipboard(credentials.licenseKey, 'license')}
            className="text-slate-400 hover:text-slate-600"
          >
            {copiedField === 'license' ? <Check size={14} className="text-green-500"/> : <Copy size={14}/>}
          </button>
        </div>
      )}

      {type === 'download' && credentials.downloadUrl && (
        <a
          href={credentials.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold text-white"
          style={{ backgroundColor: brandColor }}
        >
          <Download size={16}/> Tải xuống
        </a>
      )}

      {type === 'custom' && (
        <div className="bg-white dark:bg-slate-800 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700">
          <div className="flex items-start gap-2">
            <FileText size={14} className="text-slate-400 mt-0.5"/>
            <p className="text-sm whitespace-pre-wrap">{credentials.customContent}</p>
          </div>
        </div>
      )}

      {credentials.expiresAt && (
        <div className="text-xs text-slate-500">
          Hết hạn: {new Date(credentials.expiresAt).toLocaleDateString('vi-VN')}
        </div>
      )}
    </div>
  );
}
```

**Checklist:**
- [ ] Tạo file component
- [ ] Export từ `components/orders/index.ts` (nếu có)

---

### Task 3.3: Cập nhật Product Create/Edit Form
**File:** `app/admin/products/create/page.tsx`

**Thêm states:**
```typescript
const [productType, setProductType] = useState<'physical' | 'digital'>('physical');
const [digitalDeliveryType, setDigitalDeliveryType] = useState<'account' | 'license' | 'download' | 'custom'>('account');
const [digitalCredentialsTemplate, setDigitalCredentialsTemplate] = useState<{
  username?: string;
  password?: string;
  licenseKey?: string;
  downloadUrl?: string;
  customContent?: string;
  expiresAt?: number;
}>({});
```

**Thêm query settings:**
```typescript
const digitalEnabled = useMemo(() => {
  const setting = settingsData?.find(s => s.settingKey === 'enableDigitalProducts');
  return Boolean(setting?.value);
}, [settingsData]);
```

**Thêm UI section (sau Card Giá & Kho hàng):**
```tsx
{digitalEnabled && (
  <Card>
    <CardHeader><CardTitle className="text-base">Loại sản phẩm</CardTitle></CardHeader>
    <CardContent className="space-y-4">
      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="productType"
            checked={productType === 'physical'}
            onChange={() => setProductType('physical')}
            className="w-4 h-4"
          />
          <span className="text-sm">Vật lý (cần giao hàng)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="productType"
            checked={productType === 'digital'}
            onChange={() => setProductType('digital')}
            className="w-4 h-4"
          />
          <span className="text-sm">Digital (giao qua mạng)</span>
        </label>
      </div>

      {productType === 'digital' && (
        <>
          <div className="space-y-2">
            <Label>Loại giao hàng Digital</Label>
            <select
              value={digitalDeliveryType}
              onChange={(e) => setDigitalDeliveryType(e.target.value as any)}
              className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
            >
              <option value="account">Tài khoản (username/password)</option>
              <option value="license">License Key</option>
              <option value="download">File Download</option>
              <option value="custom">Tùy chỉnh</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Template Credentials (tùy chọn)</Label>
            <p className="text-xs text-slate-500">Nhập sẵn thông tin sẽ tự động giao khi xác nhận thanh toán</p>
            <DigitalCredentialsForm
              type={digitalDeliveryType}
              value={digitalCredentialsTemplate}
              onChange={setDigitalCredentialsTemplate}
            />
          </div>
        </>
      )}
    </CardContent>
  </Card>
)}
```

**Cập nhật handleSubmit:**
```typescript
await createProduct({
  // ... existing fields
  productType: digitalEnabled ? productType : undefined,
  digitalDeliveryType: digitalEnabled && productType === 'digital' ? digitalDeliveryType : undefined,
  digitalCredentialsTemplate: digitalEnabled && productType === 'digital' && Object.keys(digitalCredentialsTemplate).length > 0
    ? digitalCredentialsTemplate
    : undefined,
});
```

**Checklist:**
- [ ] Import DigitalCredentialsForm
- [ ] Thêm states
- [ ] Thêm digitalEnabled check
- [ ] Thêm UI Card
- [ ] Cập nhật handleSubmit
- [ ] Làm tương tự cho `app/admin/products/[id]/edit/page.tsx`

---

### Task 3.4: Cập nhật Order Edit Page
**File:** `app/admin/orders/[id]/edit/page.tsx`

**Thêm imports:**
```typescript
import { DigitalCredentialsForm } from '@/components/orders/DigitalCredentialsForm';
import { Download, CheckCircle } from 'lucide-react';
```

**Thêm state và mutation:**
```typescript
const deliverDigitalItem = useMutation(api.orders.deliverDigitalItem);
const [digitalCredentials, setDigitalCredentials] = useState<Record<number, any>>({});
```

**Thêm useEffect để sync từ server:**
```typescript
useEffect(() => {
  if (orderData) {
    const creds: Record<number, any> = {};
    orderData.items.forEach((item, index) => {
      if (item.digitalCredentials) {
        creds[index] = item.digitalCredentials;
      }
    });
    setDigitalCredentials(creds);
  }
}, [orderData]);
```

**Thêm handler:**
```typescript
const handleDeliverDigital = async (itemIndex: number) => {
  if (!digitalCredentials[itemIndex]) {
    toast.error('Vui lòng nhập thông tin giao hàng');
    return;
  }
  try {
    await deliverDigitalItem({
      orderId,
      itemIndex,
      credentials: digitalCredentials[itemIndex],
    });
    toast.success('Đã giao sản phẩm digital');
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
  }
};
```

**Thêm UI trong Order Items Card (sau mỗi item):**
```tsx
{/* Trong map orderData.items */}
{item.isDigital && (
  <div className="mt-3 border-t border-slate-100 pt-3">
    <div className="flex items-center gap-2 mb-2">
      <Download size={14} className="text-emerald-500"/>
      <span className="text-xs font-semibold text-slate-600">
        Giao hàng Digital ({item.digitalDeliveryType})
      </span>
      {item.digitalCredentials?.deliveredAt && (
        <span className="flex items-center gap-1 text-xs text-emerald-600">
          <CheckCircle size={12}/> Đã giao
        </span>
      )}
    </div>
    
    <DigitalCredentialsForm
      type={item.digitalDeliveryType as any}
      value={digitalCredentials[index] ?? {}}
      onChange={(creds) => setDigitalCredentials(prev => ({ ...prev, [index]: creds }))}
      disabled={Boolean(item.digitalCredentials?.deliveredAt)}
    />
    
    {!item.digitalCredentials?.deliveredAt && (
      <Button
        type="button"
        size="sm"
        className="mt-2 bg-emerald-600 hover:bg-emerald-500"
        onClick={() => handleDeliverDigital(index)}
      >
        Xác nhận đã giao
      </Button>
    )}
  </div>
)}
```

**Checklist:**
- [ ] Import components và icons
- [ ] Thêm mutation và state
- [ ] Thêm useEffect sync
- [ ] Thêm handler deliverDigital
- [ ] Thêm UI section cho digital items

---

## PHASE 4: CHECKOUT FLOW

### Task 4.1: Cập nhật Checkout Page
**File:** `app/(site)/checkout/page.tsx`

**Thêm logic detect digital order:**
```typescript
const isAllDigital = useMemo(() => {
  if (fromCart) {
    // TODO: Cần query products để check productType
    return false; // Tạm thời
  }
  return product?.productType === 'digital';
}, [fromCart, product]);

// Cập nhật isShippingEnabled:
const isShippingEnabled = !isAllDigital && checkoutConfig.showShippingOptions && (shippingFeature?.enabled ?? true);

// Shipping fee = 0 nếu all digital:
const shippingFee = isShippingEnabled ? (selectedShipping?.fee ?? 0) : 0;
```

**Cập nhật orderItems để include digital info:**
```typescript
const orderItems = useMemo(() => {
  // ... existing logic
  if (!fromCart && product) {
    return [{
      productId: product._id,
      productName: product.name,
      price: unitPrice,
      quantity,
      variantId: variantId ?? undefined,
      variantTitle: variantTitle ?? undefined,
      // NEW
      isDigital: product.productType === 'digital',
      digitalDeliveryType: product.digitalDeliveryType,
    }];
  }
  // ... cart logic cần query products để lấy productType
}, [/* deps */]);
```

**Ẩn shipping form khi all digital:**
```tsx
{!isAllDigital && shippingInfoCard}
{!isAllDigital && shippingOptionsCard}
```

**Checklist:**
- [ ] Thêm isAllDigital check
- [ ] Cập nhật isShippingEnabled
- [ ] Cập nhật shippingFee
- [ ] Cập nhật orderItems với digital fields
- [ ] Conditional render shipping sections

---

## PHASE 5: CUSTOMER VIEW

### Task 5.1: Cập nhật Account Orders Page
**File:** `app/(site)/account/orders/page.tsx`

**Thêm import:**
```typescript
import { DigitalCredentialsDisplay } from '@/components/orders/DigitalCredentialsDisplay';
```

**Trong phần render order items (cả 3 layout styles), thêm sau mỗi item:**
```tsx
{/* Sau item info, check và hiển thị credentials */}
{item.isDigital && 
 item.digitalCredentials?.deliveredAt && 
 order.paymentStatus === 'Paid' && (
  <div className="mt-2">
    <DigitalCredentialsDisplay
      type={item.digitalDeliveryType ?? 'custom'}
      credentials={item.digitalCredentials}
      brandColor={brandColor}
    />
  </div>
)}

{/* Hiển thị badge "Chờ giao" nếu chưa deliver */}
{item.isDigital && !item.digitalCredentials?.deliveredAt && (
  <div className="mt-2 flex items-center gap-2 text-xs text-amber-600">
    <Clock size={12}/>
    <span>Đang chờ giao sản phẩm digital</span>
  </div>
)}
```

**Cập nhật OrderDetailDrawer props để pass digital info:**
- Cần update `OrderDetailDrawer` component để nhận và hiển thị digital credentials

**Checklist:**
- [ ] Import DigitalCredentialsDisplay
- [ ] Thêm render logic trong cards layout
- [ ] Thêm render logic trong compact layout
- [ ] Thêm render logic trong timeline layout
- [ ] Cập nhật OrderDetailDrawer nếu cần

---

### Task 5.2: Cập nhật OrderDetailDrawer
**File:** `components/orders/OrderDetailDrawer.tsx`

**Cập nhật type:**
```typescript
type OrderDetailItem = {
  name: string;
  quantity: number;
  priceLabel: string;
  image?: string;
  variantTitle?: string;
  // NEW
  isDigital?: boolean;
  digitalDeliveryType?: string;
  digitalCredentials?: {
    username?: string;
    password?: string;
    licenseKey?: string;
    downloadUrl?: string;
    customContent?: string;
    expiresAt?: number;
    deliveredAt?: number;
  };
};

type OrderDetailDrawerProps = {
  // ... existing
  paymentStatus?: string; // NEW - để check trước khi hiển thị credentials
};
```

**Thêm render digital credentials sau mỗi item:**
```tsx
{item.isDigital && 
 item.digitalCredentials?.deliveredAt && 
 paymentStatus === 'Paid' && (
  <DigitalCredentialsDisplay
    type={item.digitalDeliveryType ?? 'custom'}
    credentials={item.digitalCredentials}
    brandColor={brandColor}
  />
)}
```

**Checklist:**
- [ ] Import DigitalCredentialsDisplay
- [ ] Cập nhật types
- [ ] Thêm render logic

---

## PHASE 6: TESTING & CLEANUP

### Task 6.1: Kiểm tra TypeScript
```bash
bunx oxlint --type-aware --type-check
```

**Checklist:**
- [ ] Fix tất cả TypeScript errors
- [ ] Fix tất cả lint warnings

---

### Task 6.2: Test Manual Flow

**Test 1: Tạo sản phẩm Digital**
- [ ] Vào `/system/modules/products` → bật "Sản phẩm Digital"
- [ ] Vào `/admin/products/create` → chọn loại Digital
- [ ] Chọn delivery type (account/license/download/custom)
- [ ] Nhập template credentials
- [ ] Lưu và verify data

**Test 2: Checkout sản phẩm Digital**
- [ ] Vào trang sản phẩm digital → Mua ngay
- [ ] Verify: Không hiển thị shipping form
- [ ] Verify: Shipping fee = 0
- [ ] Đặt hàng thành công

**Test 3: Admin xác nhận thanh toán**
- [ ] Vào `/admin/orders/[id]/edit`
- [ ] Thấy section "Giao hàng Digital" cho item digital
- [ ] Nhập credentials
- [ ] Đổi Payment Status → Paid
- [ ] Click "Xác nhận đã giao"
- [ ] Verify: deliveredAt được set

**Test 4: Customer xem credentials**
- [ ] Đăng nhập tài khoản customer
- [ ] Vào `/account/orders`
- [ ] Mở đơn hàng đã thanh toán
- [ ] Verify: Thấy credentials display
- [ ] Test copy, show/hide password

---

### Task 6.3: Commit
```bash
git add -A
git commit -m "feat: support digital products with credentials delivery"
```

**Checklist:**
- [ ] Review diff
- [ ] Commit thành công

---

## SUMMARY FILES

| File | Action | Lines Est. |
|------|--------|------------|
| `convex/schema.ts` | Edit | +20 |
| `convex/products.ts` | Edit | +30 |
| `convex/orders.ts` | Edit | +80 |
| `convex/model/orders.ts` | Edit | +40 |
| `lib/modules/configs/products.config.ts` | Edit | +20 |
| `lib/modules/configs/orders.config.ts` | Edit | +15 |
| `components/orders/DigitalCredentialsForm.tsx` | Create | ~120 |
| `components/orders/DigitalCredentialsDisplay.tsx` | Create | ~150 |
| `app/admin/products/create/page.tsx` | Edit | +60 |
| `app/admin/products/[id]/edit/page.tsx` | Edit | +60 |
| `app/admin/orders/[id]/edit/page.tsx` | Edit | +80 |
| `app/(site)/checkout/page.tsx` | Edit | +30 |
| `app/(site)/account/orders/page.tsx` | Edit | +40 |
| `components/orders/OrderDetailDrawer.tsx` | Edit | +30 |

**Total: ~14 files, ~775 lines**
**Estimated time: 4-5 hours**