import React from 'react';
import Link from 'next/link';
import { cn } from '@/app/admin/components/ui';

type ColorScheme = 'pink' | 'orange' | 'green' | 'purple' | 'cyan' | 'blue';

interface ExperienceModuleLinkProps {
  enabled: boolean;
  href: string;
  icon: React.ElementType;
  title: string;
  colorScheme: ColorScheme;
}

const COLOR_CLASSES: Record<ColorScheme, { border: string; bg: string; text: string }> = {
  pink: {
    bg: 'bg-pink-500/10',
    border: 'hover:border-pink-500/60 dark:hover:border-pink-500/60',
    text: 'text-pink-600 dark:text-pink-400',
  },
  orange: {
    bg: 'bg-orange-500/10',
    border: 'hover:border-orange-500/60 dark:hover:border-orange-500/60',
    text: 'text-orange-600 dark:text-orange-400',
  },
  green: {
    bg: 'bg-green-500/10',
    border: 'hover:border-green-500/60 dark:hover:border-green-500/60',
    text: 'text-green-600 dark:text-green-400',
  },
  purple: {
    bg: 'bg-purple-500/10',
    border: 'hover:border-purple-500/60 dark:hover:border-purple-500/60',
    text: 'text-purple-600 dark:text-purple-400',
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    border: 'hover:border-cyan-500/60 dark:hover:border-cyan-500/60',
    text: 'text-cyan-600 dark:text-cyan-400',
  },
  blue: {
    bg: 'bg-blue-500/10',
    border: 'hover:border-blue-500/60 dark:hover:border-blue-500/60',
    text: 'text-blue-600 dark:text-blue-400',
  },
};

export function ExperienceModuleLink({ enabled, href, icon: Icon, title, colorScheme }: ExperienceModuleLinkProps) {
  const colors = COLOR_CLASSES[colorScheme];

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border transition-colors',
        enabled
          ? `border-slate-200 dark:border-slate-700 ${colors.border}`
          : 'border-slate-100 dark:border-slate-800 opacity-50'
      )}
    >
      <div className={cn(
        'w-8 h-8 rounded-lg flex items-center justify-center',
        enabled ? `${colors.bg} ${colors.text}` : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
      )}>
        <Icon size={16} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{title}</p>
        <p className="text-xs text-slate-500">{enabled ? 'Đã bật' : 'Chưa bật'}</p>
      </div>
    </Link>
  );
}
