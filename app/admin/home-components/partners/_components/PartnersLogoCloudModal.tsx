'use client';

import React from 'react';
import { Image as ImageIcon, X } from 'lucide-react';
import { Button, Dialog, DialogContent, DialogTitle, ScrollArea, cn } from '../../../components/ui';
import { getPartnersColors, type PartnersBrandMode } from '../_lib/colors';

export type PartnersLogoItem = {
  id?: string | number;
  url?: string;
  link?: string;
  name?: string;
};

export const PartnersLogoCloudModal = ({
  open,
  onOpenChange,
  items,
  title,
  brandColor,
  secondary,
  mode = 'dual',
  renderImage,
  openInNewTab = false,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: PartnersLogoItem[];
  title?: string;
  brandColor: string;
  secondary: string;
  mode?: PartnersBrandMode;
  renderImage: (item: PartnersLogoItem, className: string) => React.ReactNode;
  openInNewTab?: boolean;
  className?: string;
}) => {
  const colors = React.useMemo(() => getPartnersColors(brandColor, secondary, mode), [brandColor, secondary, mode]);
  const linkProps = openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {};
  const modalTitle = title ? `Tất cả ${title}` : 'Tất cả đối tác';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('max-w-5xl w-[95vw] max-h-[85vh] p-0 overflow-hidden', className)}>
        <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-200 dark:border-slate-800">
          <DialogTitle className="text-left">{modalTitle}</DialogTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            aria-label="Đóng"
          >
            <X size={16} />
          </Button>
        </div>
        <ScrollArea className="max-h-[70vh] p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {items.map((item, idx) => {
              const key = item.id ?? `${item.url ?? ''}-${idx}`;
              const Wrapper: React.ElementType = item.link ? 'a' : 'div';
              return (
                <Wrapper
                  key={key}
                  {...(item.link ? { href: item.link, ...linkProps } : {})}
                  className="group rounded-xl border p-3 bg-white dark:bg-slate-900 flex flex-col items-center justify-center text-center gap-2 transition-colors"
                  style={{ borderColor: colors.itemBorder, backgroundColor: colors.itemBg }}
                >
                  {item.url
                    ? renderImage(item, 'h-10 w-auto object-contain')
                    : <ImageIcon size={28} className="text-slate-400" />}
                  <span className="text-xs font-medium" style={{ color: colors.badgeText }}>
                    {item.name ?? `Đối tác ${idx + 1}`}
                  </span>
                </Wrapper>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
