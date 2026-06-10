import React from 'react';
import { Check, CreditCard, MapPin, Package, Truck, Wallet } from 'lucide-react';
import { DEFAULT_CHECKOUT_COLOR, getCheckoutColors, type CheckoutColorMode, type CheckoutColors } from '@/components/site/checkout/colors';

type CheckoutPreviewProps = {
  flowStyle: 'single-page' | 'multi-step' | 'wizard-accordion';
  orderSummaryPosition: 'right' | 'bottom';
  showPaymentMethods: boolean;
  showShippingOptions: boolean;
  device?: 'desktop' | 'tablet' | 'mobile';
  brandColor?: string;
  secondaryColor?: string;
  colorMode?: CheckoutColorMode;
  isDark?: boolean;
};

const mockCartItems = [
  { id: 1, name: 'iPhone 15 Pro Max', price: 34990000, quantity: 1, variant: 'Màu: Titan tự nhiên' },
  { id: 2, name: 'AirPods Pro 2', price: 6490000, quantity: 2, variant: 'Bản USB-C' },
];

const formatVND = (price: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
const subtotal = mockCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
const shipping = 30000;
const total = subtotal + shipping;

function OrderSummary({ tokens }: { tokens: CheckoutColors }) {
  return (
    <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: tokens.surfaceMuted }}>
      <div className="flex items-center gap-2 font-semibold" style={{ color: tokens.bodyText }}>
        <Package size={16} style={{ color: tokens.iconMuted }} />
        <span>Đơn hàng ({mockCartItems.length} sản phẩm)</span>
      </div>
      <div className="space-y-3">
        {mockCartItems.map(item => (
          <div key={item.id} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: tokens.surfaceSoft }}>
              <Package size={16} style={{ color: tokens.iconMuted }} />
            </div>
            <div className="flex-1 text-xs">
              <div className="font-medium" style={{ color: tokens.bodyText }}>{item.name}</div>
              {item.variant && <div style={{ color: tokens.metaText }}>{item.variant}</div>}
              <div style={{ color: tokens.metaText }}>x{item.quantity}</div>
            </div>
            <span className="font-medium text-sm" style={{ color: tokens.summaryValue }}>{formatVND(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>
      <div className="border-t pt-3 space-y-2" style={{ borderColor: tokens.border }}>
        <div className="flex justify-between text-sm">
          <span style={{ color: tokens.summaryText }}>Tạm tính</span>
          <span style={{ color: tokens.summaryValue }}>{formatVND(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: tokens.summaryText }}>Phí vận chuyển</span>
          <span style={{ color: tokens.summaryValue }}>{formatVND(shipping)}</span>
        </div>
        <div className="flex justify-between font-semibold text-base pt-2 border-t" style={{ borderColor: tokens.border }}>
          <span style={{ color: tokens.summaryTotalLabel }}>Tổng cộng</span>
          <span style={{ color: tokens.summaryTotalValue }}>{formatVND(total)}</span>
        </div>
      </div>
      <button
        className="w-full py-3 rounded-xl font-semibold text-sm"
        style={{ backgroundColor: tokens.primaryButtonBg, color: tokens.primaryButtonText }}
      >
        Đặt hàng
      </button>
    </div>
  );
}

function ShippingInfoCard({ tokens }: { tokens: CheckoutColors }) {
  return (
    <div className="rounded-xl border p-4" style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}>
      <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: tokens.heading }}>
        <MapPin size={16} style={{ color: tokens.primary }} />
        Thông tin giao hàng
      </h3>
      <div className="grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Họ tên"
            className="w-full px-3 py-2.5 border rounded-lg text-sm"
            style={{ backgroundColor: tokens.inputBg, borderColor: tokens.inputBorder, color: tokens.inputText }}
            disabled
          />
          <input
            type="text"
            placeholder="Số điện thoại"
            className="w-full px-3 py-2.5 border rounded-lg text-sm"
            style={{ backgroundColor: tokens.inputBg, borderColor: tokens.inputBorder, color: tokens.inputText }}
            disabled
          />
        </div>
        <input
          type="email"
          placeholder="Email"
          className="w-full px-3 py-2.5 border rounded-lg text-sm"
          style={{ backgroundColor: tokens.inputBg, borderColor: tokens.inputBorder, color: tokens.inputText }}
          disabled
        />
        <input
          type="text"
          placeholder="Địa chỉ giao hàng"
          className="w-full px-3 py-2.5 border rounded-lg text-sm"
          style={{ backgroundColor: tokens.inputBg, borderColor: tokens.inputBorder, color: tokens.inputText }}
          disabled
        />
      </div>
    </div>
  );
}

function ShippingOptionsCard({ tokens }: { tokens: CheckoutColors }) {
  return (
    <div className="rounded-xl border p-4" style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}>
      <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: tokens.heading }}>
        <Truck size={16} style={{ color: tokens.primary }} />
        Phương thức vận chuyển
      </h3>
      <div className="space-y-2">
        <label
          className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer"
          style={{ borderColor: tokens.selectionBorder, backgroundColor: tokens.selectionBg }}
        >
          <input
            type="radio"
            name="shipping"
            checked
            readOnly
            className="w-4 h-4"
            style={{ accentColor: tokens.radioAccent }}
          />
          <div className="flex-1">
            <div className="font-medium text-sm" style={{ color: tokens.bodyText }}>Giao hàng nhanh</div>
            <div className="text-xs" style={{ color: tokens.metaText }}>Nhận hàng trong 1-2 ngày</div>
          </div>
          <span className="font-semibold text-sm" style={{ color: tokens.priceText }}>{formatVND(30000)}</span>
        </label>
        <label
          className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer"
          style={{ borderColor: tokens.border, backgroundColor: tokens.surface }}
        >
          <input type="radio" name="shipping" readOnly className="w-4 h-4" />
          <div className="flex-1">
            <div className="font-medium text-sm" style={{ color: tokens.bodyText }}>Giao hàng tiết kiệm</div>
            <div className="text-xs" style={{ color: tokens.metaText }}>Nhận hàng trong 3-5 ngày</div>
          </div>
          <span className="font-semibold text-sm" style={{ color: tokens.summaryValue }}>{formatVND(15000)}</span>
        </label>
      </div>
    </div>
  );
}

function PaymentMethodsCard({ tokens }: { tokens: CheckoutColors }) {
  return (
    <div className="rounded-xl border p-4" style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}>
      <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: tokens.heading }}>
        <CreditCard size={16} style={{ color: tokens.primary }} />
        Phương thức thanh toán
      </h3>
      <div className="space-y-2">
        <label
          className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer"
          style={{ borderColor: tokens.selectionBorder, backgroundColor: tokens.selectionBg }}
        >
          <input
            type="radio"
            name="payment"
            checked
            readOnly
            className="w-4 h-4"
            style={{ accentColor: tokens.radioAccent }}
          />
          <Package size={18} style={{ color: tokens.iconMuted }} />
          <div className="flex-1">
            <div className="font-medium text-sm" style={{ color: tokens.bodyText }}>Thanh toán khi nhận hàng (COD)</div>
          </div>
        </label>
        <label
          className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer"
          style={{ borderColor: tokens.border, backgroundColor: tokens.surface }}
        >
          <input type="radio" name="payment" readOnly className="w-4 h-4" />
          <CreditCard size={18} style={{ color: tokens.iconMuted }} />
          <div className="flex-1">
            <div className="font-medium text-sm" style={{ color: tokens.bodyText }}>Thẻ ATM / Visa / Mastercard</div>
          </div>
        </label>
        <label
          className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer"
          style={{ borderColor: tokens.border, backgroundColor: tokens.surface }}
        >
          <input type="radio" name="payment" readOnly className="w-4 h-4" />
          <Wallet size={18} style={{ color: tokens.iconMuted }} />
          <div className="flex-1">
            <div className="font-medium text-sm" style={{ color: tokens.bodyText }}>Ví điện tử (MoMo, ZaloPay, VNPay)</div>
          </div>
        </label>
      </div>
    </div>
  );
}

function CheckoutForm({ 
  flowStyle,
  showPaymentMethods,
  showShippingOptions,
  tokens,
}: {
  flowStyle: 'single-page' | 'multi-step';
  showPaymentMethods: boolean;
  showShippingOptions: boolean;
  tokens: CheckoutColors;
}) {
  const steps = [
    { label: 'Thông tin', icon: MapPin, done: true },
    { label: 'Vận chuyển', icon: Truck, done: flowStyle === 'single-page' },
    { label: 'Thanh toán', icon: CreditCard, done: false },
  ];

  return (
    <div className="space-y-4">
      {flowStyle === 'multi-step' && (
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, i) => (
            <React.Fragment key={step.label}>
              <div className="flex flex-col items-center">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={step.done
                    ? { backgroundColor: tokens.stepActiveBg, color: tokens.stepActiveText }
                    : { backgroundColor: tokens.stepInactiveBg, color: tokens.stepInactiveText }
                  }
                >
                  {step.done ? <Check size={18} /> : <step.icon size={18} />}
                </div>
                <span
                  className="text-xs mt-1"
                  style={step.done ? { color: tokens.primary, fontWeight: 600 } : { color: tokens.mutedText }}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className="flex-1 h-0.5 mx-2"
                  style={{ backgroundColor: step.done ? tokens.stepLineActive : tokens.stepLineInactive }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      )}
      
      <ShippingInfoCard tokens={tokens} />

      {showShippingOptions && (
        <ShippingOptionsCard tokens={tokens} />
      )}

      {showPaymentMethods && (
        <PaymentMethodsCard tokens={tokens} />
      )}
    </div>
  );
}

type WizardStep = {
  key: 'info' | 'shipping' | 'payment';
  label: string;
  content: React.ReactNode;
};

function WizardAccordion({
  showPaymentMethods,
  showShippingOptions,
  tokens,
}: {
  showPaymentMethods: boolean;
  showShippingOptions: boolean;
  tokens: CheckoutColors;
}) {
  const steps: WizardStep[] = [
    {
      key: 'info',
      label: 'Thông tin khách hàng',
      content: <ShippingInfoCard tokens={tokens} />,
    },
    ...(showShippingOptions
      ? [
          {
            key: 'shipping' as const,
            label: 'Vận chuyển',
            content: <ShippingOptionsCard tokens={tokens} />,
          },
        ]
      : []),
    ...(showPaymentMethods
      ? [
          {
            key: 'payment' as const,
            label: 'Thanh toán',
            content: <PaymentMethodsCard tokens={tokens} />,
          },
        ]
      : []),
  ];

  const activeIndex = Math.min(1, steps.length - 1);

  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const isActive = index === activeIndex;
        const isDone = index < activeIndex;
        const stateLabel = isActive ? 'Đang thực hiện' : isDone ? 'Đã hoàn tất' : 'Chưa thực hiện';

        return (
          <div key={step.key} className="rounded-xl border" style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}>
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold"
                  style={isDone || isActive
                    ? { backgroundColor: tokens.stepActiveBg, color: tokens.stepActiveText }
                    : { backgroundColor: tokens.stepInactiveBg, color: tokens.stepInactiveText }
                  }
                >
                  {isDone ? <Check size={16} /> : index + 1}
                </div>
                <div>
                  <div className="font-semibold text-sm" style={{ color: tokens.bodyText }}>{step.label}</div>
                  <div className="text-xs" style={{ color: tokens.metaText }}>{stateLabel}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: tokens.mutedText }}>
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: isDone ? tokens.stepLineActive : tokens.stepLineInactive }}
                />
                {isActive ? 'Mở rộng' : 'Thu gọn'}
              </div>
            </div>
            {isActive && <div className="px-4 pb-4">{step.content}</div>}
          </div>
        );
      })}
    </div>
  );
}

export function CheckoutPreview({
  flowStyle,
  orderSummaryPosition,
  showPaymentMethods,
  showShippingOptions,
  device = 'desktop',
  brandColor = DEFAULT_CHECKOUT_COLOR,
  secondaryColor = '',
  colorMode = 'single',
  isDark,
}: CheckoutPreviewProps) {
  const tokens = React.useMemo(
    () => getCheckoutColors(brandColor, secondaryColor, colorMode, isDark),
    [brandColor, secondaryColor, colorMode, isDark]
  );
  const isMobile = device === 'mobile';
  const isRightSidebar = orderSummaryPosition === 'right' && !isMobile;
  const isWizard = flowStyle === 'wizard-accordion';

  return (
    <div className="py-6 px-4 min-h-[300px]" style={{ backgroundColor: tokens.pageBg }}>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-xl md:text-2xl font-bold mb-6" style={{ color: tokens.heading }}>Thanh toán</h1>
        
        <div className={isRightSidebar ? 'grid grid-cols-3 gap-6' : 'space-y-4'}>
          <div className={isRightSidebar ? 'col-span-2' : ''}>
            {isWizard ? (
              <WizardAccordion
                showPaymentMethods={showPaymentMethods}
                showShippingOptions={showShippingOptions}
                tokens={tokens}
              />
            ) : (
              <CheckoutForm 
                flowStyle={flowStyle} 
                showPaymentMethods={showPaymentMethods} 
                showShippingOptions={showShippingOptions}
                tokens={tokens}
              />
            )}
          </div>
          <div>
            <OrderSummary tokens={tokens} />
          </div>
        </div>
      </div>
    </div>
  );
}