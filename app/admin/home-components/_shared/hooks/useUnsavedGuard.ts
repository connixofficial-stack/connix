'use client';

import { useEffect } from 'react';

/**
 * Hook chặn navigation khi có thay đổi chưa save.
 *
 * Xử lý 2 trường hợp:
 * 1. `window.beforeunload` — close tab / refresh trang
 * 2. Click link <a> trong trang (SPA navigation) — intercept bằng event delegation
 *
 * Usage (1 dòng trong bất kỳ editor nào):
 *   useUnsavedGuard(hasChanges);
 */
export function useUnsavedGuard(hasChanges: boolean): void {
  // Guard 1: Block close tab / refresh
  useEffect(() => {
    if (!hasChanges) { return; }

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Chrome yêu cầu returnValue để hiện dialog native
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasChanges]);

  // Guard 2: Block SPA link navigation (Next.js App Router)
  // Intercept click trên thẻ <a> có href khác origin hiện tại
  useEffect(() => {
    if (!hasChanges) { return; }

    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as Element).closest('a');
      if (!anchor) { return; }

      const href = anchor.getAttribute('href');
      if (!href) { return; }

      // Bỏ qua: anchor hash, target blank, download link
      if (
        href.startsWith('#') ||
        anchor.target === '_blank' ||
        anchor.hasAttribute('download')
      ) { return; }

      // Bỏ qua nếu là link submit/form internal không phải navigate ra ngoài editor
      // Nhận biết: href là route khác (không phải href có dạng JS: hoặc tel:)
      if (href.startsWith('javascript:') || href.startsWith('tel:') || href.startsWith('mailto:')) {
        return;
      }

      const confirmed = window.confirm(
        'Bạn có thay đổi chưa lưu. Bạn có chắc muốn rời khỏi trang này không?'
      );
      if (!confirmed) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener('click', handleClick, { capture: true });
    return () => document.removeEventListener('click', handleClick, { capture: true });
  }, [hasChanges]);
}
