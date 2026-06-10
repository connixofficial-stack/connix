'use client';

import React from 'react';
import { Button } from '@/app/admin/components/ui';
import { ChevronDown } from 'lucide-react';
import { HomeComponentFooterActionPortal } from './HomeComponentFooterActions';
import { useGlobalFormSectionsToggle } from '../hooks/useFormSectionsState';

interface FormSectionsToggleAllButtonProps {
  hasClosedSection: boolean;
  onToggleAll: () => void;
}

/**
 * Shared Component hiển thị nút Toggle All (mũi tên lên/xuống) ở Sticky Footer.
 * Tự động đẩy nút này vào Sticky Footer thông qua portal đặc biệt.
 */
export function FormSectionsToggleAllButton({
  hasClosedSection,
  onToggleAll,
}: FormSectionsToggleAllButtonProps) {
  const globalToggle = useGlobalFormSectionsToggle();
  const resolvedHasClosedSection = globalToggle.hasControllers ? globalToggle.hasClosedSection : hasClosedSection;
  const resolvedToggleAll = globalToggle.hasControllers ? globalToggle.handleToggleAll : onToggleAll;

  return (
    <HomeComponentFooterActionPortal actionKey="toggle-all" deps={[resolvedHasClosedSection]}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={resolvedToggleAll}
        title={resolvedHasClosedSection ? 'Mở rộng tất cả' : 'Thu gọn tất cả'}
        className="h-9 w-9 shrink-0 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      >
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${!resolvedHasClosedSection ? 'rotate-180' : 'rotate-0'}`}
        />
      </Button>
    </HomeComponentFooterActionPortal>
  );
}
