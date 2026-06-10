import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/app/admin/components/ui';
import { AdminImage as Image } from '@/app/admin/components/AdminImage';
import { cn } from '@/app/admin/components/ui';

interface DemoItemRowShellProps {
  /** Vị trí trong danh sách (hiển thị badge số, 1-indexed) */
  index: number;
  /** URL ảnh thumbnail — hiện preview nếu có, không thì hiện placeholder */
  image?: string;
  /** Placeholder icon khi chưa có ảnh (mặc định: ký tự đầu của tên) */
  placeholderIcon?: React.ReactNode;
  /** Callback khi nhấn nút Xóa */
  onRemove: () => void;
  /** Nội dung chính (fields: tên, link, v.v.) */
  children: React.ReactNode;
  /** Nội dung phụ bên dưới đường kẻ (ảnh uploader, fields phụ…) */
  footer?: React.ReactNode;
  className?: string;
}

/**
 * Shell layout chuẩn cho 1 demo item row.
 * Render: [badge số] [thumbnail] [children] [nút xóa]
 * Nếu có `footer`: hiển thị phần footer phân cách bằng border.
 *
 * Consumer tự quyết định fields bên trong children và footer.
 */
export function DemoItemRowShell({
  index,
  image,
  placeholderIcon,
  onRemove,
  children,
  footer,
  className,
}: DemoItemRowShellProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden',
        className,
      )}
    >
      {/* ── Row chính ── */}
      <div className="flex items-center gap-2 px-3 py-2">
        {/* Badge số */}
        <span className="w-5 h-5 flex items-center justify-center bg-amber-500 text-white text-[10px] rounded-full font-medium shrink-0">
          {index + 1}
        </span>

        {/* Thumbnail */}
        {image ? (
          <Image
            src={image}
            alt=""
            width={36}
            height={36}
            className="w-9 h-9 object-cover rounded shrink-0"
          />
        ) : (
          <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center shrink-0 text-slate-400">
            {placeholderIcon}
          </div>
        )}

        {/* Fields chính */}
        <div className="flex-1 flex flex-col gap-1.5 min-w-0">{children}</div>

        {/* Nút Xóa */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-slate-400 hover:text-red-500"
          onClick={onRemove}
        >
          <Trash2 size={13} />
        </Button>
      </div>

      {/* ── Footer (phụ) ── */}
      {footer && (
        <div className="border-t border-slate-100 dark:border-slate-800 px-3 py-1.5">
          {footer}
        </div>
      )}
    </div>
  );
}
