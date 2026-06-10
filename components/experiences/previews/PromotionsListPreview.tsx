import { getPromotionsListColors, type PromotionsListColorMode } from '@/components/site/promotions/colors';

type PreviewDevice = 'desktop' | 'tablet' | 'mobile';
type PromotionsLayoutStyle = 'grid' | 'list' | 'banner';

type PromotionsListPreviewProps = {
  layoutStyle: PromotionsLayoutStyle;
  showCountdown?: boolean;
  showProgress?: boolean;
  showConditions?: boolean;
  groupByType?: boolean;
  brandColor?: string;
  secondaryColor?: string;
  colorMode?: PromotionsListColorMode;
  device?: PreviewDevice;
};

const PROMOTIONS = [
  { id: 1, title: 'Giảm 20% đơn 500K', code: 'SALE20', type: 'Coupon', expiresIn: 'Còn 2 ngày', usage: '45/100' },
  { id: 2, title: 'Flash sale cuối tuần', code: 'FLASH', type: 'Flash sale', expiresIn: 'Còn 8 giờ', usage: '120/200' },
  { id: 3, title: 'Mua 2 tặng 1', code: 'B2G1', type: 'Combo', expiresIn: 'Còn 5 ngày', usage: '30/80' },
];

export function PromotionsListPreview({
  layoutStyle,
  showCountdown = true,
  showProgress = true,
  showConditions = true,
  groupByType = false,
  brandColor = '#f43f5e',
  secondaryColor,
  colorMode = 'single',
  device = 'desktop',
}: PromotionsListPreviewProps) {
  const isMobile = device === 'mobile';
  const gridClass = layoutStyle === 'list' ? 'grid-cols-1' : isMobile ? 'grid-cols-1' : 'grid-cols-3';
  const tokens = getPromotionsListColors(brandColor, secondaryColor, colorMode);

  return (
    <div className="py-6 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {layoutStyle === 'banner' && (
          <div className="rounded-2xl p-6" style={{ backgroundColor: tokens.bannerBackground }}>
            <p className="text-xs uppercase tracking-wide" style={{ color: tokens.bannerEyebrow }}>Khuyến mãi nổi bật</p>
            <h2 className="text-2xl font-bold mt-2" style={{ color: tokens.bannerHeading }}>Ưu đãi hôm nay</h2>
            <p className="text-sm mt-1" style={{ color: tokens.bannerDescription }}>Tổng hợp mã giảm giá và chương trình đang chạy.</p>
            <button
              className="mt-4 px-4 py-2 text-sm rounded-full"
              style={{ backgroundColor: tokens.bannerButtonBg, color: tokens.bannerButtonText }}
            >
              Xem chi tiết
            </button>
          </div>
        )}

        {groupByType && (
          <div className="flex flex-wrap gap-2">
            {['Coupon', 'Flash sale', 'Combo', 'Loyalty'].map((item) => (
              <span
                key={item}
                className="px-3 py-1 text-xs rounded-full border"
                style={{
                  backgroundColor: tokens.groupBadgeBg,
                  color: tokens.groupBadgeText,
                  borderColor: tokens.groupBadgeBorder,
                }}
              >
                {item}
              </span>
            ))}
          </div>
        )}

        <div className={`grid gap-4 ${gridClass}`}>
          {PROMOTIONS.map((promo) => (
            <div
              key={promo.id}
              className="border rounded-xl p-4"
              style={{ borderColor: tokens.cardBorder, backgroundColor: tokens.cardBackground }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide" style={{ color: tokens.promoTypeText }}>{promo.type}</span>
                <span
                  className="text-xs font-mono px-2 py-0.5 rounded border"
                  style={{
                    backgroundColor: tokens.codeBadgeBg,
                    color: tokens.codeBadgeText,
                    borderColor: tokens.codeBadgeBorder,
                  }}
                >
                  {promo.code}
                </span>
              </div>
              <h3 className="mt-2 font-semibold" style={{ color: tokens.promoTitleText }}>{promo.title}</h3>
              {showCountdown && <p className="text-xs mt-1" style={{ color: tokens.promoMetaText }}>{promo.expiresIn}</p>}
              {showConditions && <p className="text-xs mt-2" style={{ color: tokens.promoMetaText }}>Điều kiện: Đơn tối thiểu 500K</p>}
              {showProgress && (
                <div className="mt-3">
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: tokens.progressTrack }}>
                    <div className="h-full" style={{ width: '55%', backgroundColor: tokens.progressFill }} />
                  </div>
                  <p className="text-xs mt-1" style={{ color: tokens.progressText }}>Đã dùng {promo.usage}</p>
                </div>
              )}
              <button
                className="mt-3 w-full py-2 text-sm rounded-lg"
                style={{ backgroundColor: tokens.copyButtonBg, color: tokens.copyButtonText }}
              >
                Copy mã
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
