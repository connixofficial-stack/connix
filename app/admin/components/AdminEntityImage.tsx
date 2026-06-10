'use client';

import React, { useMemo, useState } from 'react';
import { AdminImage as Image } from '@/app/admin/components/AdminImage';
import { Briefcase, FileText, FolderOpen, GraduationCap, Package } from 'lucide-react';
import { cn } from './ui';
import { isValidImageSrc } from '@/lib/utils/image';

type AdminEntityImageVariant = 'post' | 'service' | 'product' | 'course' | 'project' | 'resource';

type AdminEntityImageProps = {
  alt: string;
  className?: string;
  height: number;
  src?: string | null;
  variant: AdminEntityImageVariant;
  width: number;
};

const FALLBACKS: Record<AdminEntityImageVariant, { icon: typeof FileText; label: string }> = {
  post: { icon: FileText, label: 'Bài viết' },
  product: { icon: Package, label: 'Sản phẩm' },
  project: { icon: Briefcase, label: 'Dự án' },
  resource: { icon: FolderOpen, label: 'Tài nguyên' },
  course: { icon: GraduationCap, label: 'Khóa học' },
  service: { icon: Briefcase, label: 'Dịch vụ' },
};

export function AdminEntityImage({ alt, className, height, src, variant, width }: AdminEntityImageProps) {
  const [hasError, setHasError] = useState(false);
  const isValid = isValidImageSrc(src);
  const fallback = FALLBACKS[variant];
  const Icon = useMemo(() => fallback.icon, [fallback.icon]);

  return (
    <div className={cn('relative overflow-hidden rounded', className)}>
      {isValid && !hasError ? (
        <Image
          src={src as string}
          width={width}
          height={height}
          className="h-full w-full object-cover"
          alt={alt}
          onError={() => setHasError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center gap-1 rounded bg-slate-200 text-[10px] text-slate-500 dark:bg-slate-700 dark:text-slate-400">
          <Icon size={12} />
          <span>{fallback.label}</span>
        </div>
      )}
    </div>
  );
}

