'use client';

import React, { useEffect } from 'react';
import { Toaster, toast, useSonner, type ToasterProps } from 'sonner';

function ClickDismissHandler({ defaultPosition = 'top-right' }: { defaultPosition?: string }) {
  const { toasts } = useSonner();

  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Tìm xem click có nằm trong một toast không
      const toastElement = target.closest('[data-sonner-toast]');
      if (!toastElement) return;

      // Tránh dismiss khi click vào các element có tính tương tác cao (button, link, a, role="button")
      if (
        target.tagName === 'BUTTON' ||
        target.closest('button') ||
        target.tagName === 'A' ||
        target.closest('a') ||
        target.getAttribute('role') === 'button' ||
        target.closest('[role="button"]')
      ) {
        return;
      }

      // Lấy position và index từ thuộc tính DOM do Sonner gán
      const y = toastElement.getAttribute('data-y-position');
      const x = toastElement.getAttribute('data-x-position');
      const indexAttr = toastElement.getAttribute('data-index');

      if (y && x && indexAttr !== null) {
        const index = parseInt(indexAttr, 10);
        const position = `${y}-${x}`;

        // Lọc danh sách toasts theo đúng vị trí của toast bị click
        const activeToasts = toasts.filter((t) => {
          const toastPosition = t.position || defaultPosition;
          return toastPosition === position;
        });

        // Lấy toast tương ứng và gọi dismiss
        const targetToast = activeToasts[index];
        if (targetToast) {
          toast.dismiss(targetToast.id);
        }
      }
    };

    document.addEventListener('click', handleGlobalClick);
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [toasts, defaultPosition]);

  return null;
}

export function CustomToaster({ position = 'top-right', ...props }: ToasterProps) {
  return (
    <>
      <Toaster position={position} {...props} />
      <ClickDismissHandler defaultPosition={position} />
      <style dangerouslySetInnerHTML={{ __html: `
        [data-sonner-toast] {
          cursor: pointer !important;
        }
        [data-sonner-toast] button,
        [data-sonner-toast] a,
        [data-sonner-toast] [role="button"] {
          cursor: auto !important;
        }
      `}} />
    </>
  );
}
