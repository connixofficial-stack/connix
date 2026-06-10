'use client';

import React from 'react';
import { cn } from '@/app/admin/components/ui';

type LoadingAnimation = 'shimmer' | 'pulse' | 'none';

const DEFAULT_ANIMATION: LoadingAnimation = 'shimmer';

const getAnimationClass = (animation: LoadingAnimation) => {
  if (animation === 'none') {
    return '';
  }
  return 'animate-pulse';
};

const SkeletonBlock = ({ className, animation }: { className?: string; animation: LoadingAnimation }) => (
  <div
    className={cn(
      'rounded-md bg-slate-200/90 dark:bg-slate-700/70',
      getAnimationClass(animation),
      className
    )}
  />
);

const HeroSkeleton = ({ animation }: { animation: LoadingAnimation }) => (
  <section className="rounded-3xl border border-slate-200/70 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/40 overflow-hidden">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 md:p-10">
      <div className="space-y-4">
        <SkeletonBlock animation={animation} className="h-5 w-24" />
        <SkeletonBlock animation={animation} className="h-10 w-5/6" />
        <SkeletonBlock animation={animation} className="h-10 w-4/6" />
        <SkeletonBlock animation={animation} className="h-4 w-full" />
        <SkeletonBlock animation={animation} className="h-4 w-5/6" />
        <div className="flex flex-wrap gap-3 pt-2">
          <SkeletonBlock animation={animation} className="h-10 w-28" />
          <SkeletonBlock animation={animation} className="h-10 w-24" />
        </div>
      </div>
      <SkeletonBlock animation={animation} className="h-56 md:h-64 rounded-2xl" />
    </div>
  </section>
);

export function HomePageLoading() {
  return (
    <div className="min-h-screen">
      <div className="space-y-10">
        <HeroSkeleton animation={DEFAULT_ANIMATION} />
      </div>
    </div>
  );
}
