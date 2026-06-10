import React from 'react';
import { Image as ImageIcon, Plus } from 'lucide-react';
import { cn } from '../../../components/ui';
import { getPartnersColors, type PartnersBrandMode } from '../_lib/colors';
import { PartnersLogoCloudModal } from './PartnersLogoCloudModal';

type FeaturedItem = {
  id?: string | number;
  url?: string;
  link?: string;
  name?: string;
};

const DEFAULT_MAX_OTHERS = 6;

export const PartnersFeaturedShared = ({
  items,
  title,
  brandColor,
  secondary,
  mode = 'dual',
  maxOthers: _maxOthers = DEFAULT_MAX_OTHERS,
  openInNewTab = false,
  renderImage,
  className,
}: {
  items: FeaturedItem[];
  title: string;
  brandColor: string;
  secondary: string;
  mode?: PartnersBrandMode;
  maxOthers?: number;
  openInNewTab?: boolean;
  renderImage: (item: FeaturedItem, className: string) => React.ReactNode;
  className?: string;
}) => {
  const featured = items[0];
  const smallVisible = items.slice(1, 6);
  const remainingCount = Math.max(0, items.length - 6);
  const smallSlots = Array.from({ length: 5 }, (_, index) => smallVisible[index]);
  const linkProps = openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {};
  const colors = React.useMemo(() => getPartnersColors(brandColor, secondary, mode), [brandColor, secondary, mode]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  if (items.length <= 2) {
    return (
      <section className={cn('w-full py-7 bg-white border-b border-slate-200', className)}>
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6 space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight text-center" style={{ color: colors.headingText }}>{title}</h2>
          <div className={cn('mx-auto flex flex-wrap items-center justify-center gap-3', items.length === 1 ? 'max-w-xs' : 'max-w-md')}>
            {items.map((item, idx) => (
              <a
                key={item.id ?? idx}
                href={item.link || '#'}
                {...linkProps}
                className="flex items-center justify-center rounded-2xl border bg-white px-4 py-3"
                style={{ borderColor: colors.itemBorder, backgroundColor: colors.itemBg }}
              >
                {item.url ? renderImage(item, 'h-16 w-auto object-contain') : <ImageIcon size={48} className="text-slate-300" />}
              </a>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={cn('w-full py-7 bg-white border-b border-slate-200', className)}>
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold tracking-tight relative pl-4" style={{ color: colors.headingText }}>
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full" style={{ backgroundColor: colors.headingAccent }}></span>
            {title}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {featured && (
            <a
              href={featured.link || '#'}
              {...linkProps}
              className="relative md:row-span-2 rounded-2xl border overflow-hidden flex items-center justify-center p-5 aspect-[4/3] md:aspect-auto"
              style={{ borderColor: colors.featuredCardBorder, backgroundColor: colors.featuredCardBg }}
            >
              <div className="absolute top-3 left-3">
                <span
                  className="px-2 py-1 text-[10px] font-semibold rounded"
                  style={{ backgroundColor: colors.featuredBadgeBg, color: colors.featuredBadgeText }}
                >
                  NỔI BẬT
                </span>
              </div>
              {featured.url ? renderImage(featured, 'max-h-32 w-auto object-contain') : (
                <ImageIcon size={64} className="text-slate-300" />
              )}
            </a>
          )}
          <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-2">
            {smallSlots.map((item, idx) => (
              <div
                key={item?.id ?? `empty-${idx}`}
                className={cn('flex items-center justify-center p-2.5 rounded-xl border bg-white aspect-[3/2]', !item && 'border-transparent')}
                style={item ? { borderColor: colors.itemBorder, backgroundColor: colors.itemBg } : undefined}
              >
                {item ? (
                  item.url ? renderImage(item, 'h-12 w-auto object-contain') : <ImageIcon size={34} className="text-slate-300" />
                ) : null}
              </div>
            ))}
            {remainingCount > 0 ? (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="flex flex-col items-center justify-center rounded-xl border aspect-[3/2] transition-colors"
                style={{ backgroundColor: colors.remainingBg, borderColor: colors.remainingBorder }}
                aria-label={`Xem tất cả ${remainingCount} đối tác`}
              >
                <Plus size={20} style={{ color: colors.remainingText }} />
                <span className="text-sm font-semibold" style={{ color: colors.remainingText }}>+{remainingCount}</span>
                <span className="text-xs mt-1" style={{ color: colors.remainingText }}>Xem tất cả</span>
              </button>
            ) : (
              <div className="rounded-xl border border-transparent aspect-[3/2]" />
            )}
          </div>
        </div>
      </div>
      <PartnersLogoCloudModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        items={items}
        title={title ?? 'Đối tác'}
        brandColor={brandColor}
        secondary={secondary}
        mode={mode}
        openInNewTab={openInNewTab}
        renderImage={renderImage}
      />
    </section>
  );
};
