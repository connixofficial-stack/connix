'use client';

import React from 'react';

const injectFrameDark = (children: React.ReactNode, isDark?: boolean): React.ReactNode => (
  React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) {
      return child;
    }

    if (child.type === React.Fragment) {
      const childProps = child.props as { children?: React.ReactNode };
      return React.cloneElement(child, {
        children: injectFrameDark(childProps?.children, isDark),
      } as any);
    }

    if (typeof child.type !== 'string') {
      return React.cloneElement(child, { isDark } as any);
    }

    const childProps = child.props as { children?: React.ReactNode };
    if (!childProps.children) {
      return child;
    }

    return React.cloneElement(child, {
      children: injectFrameDark(childProps.children, isDark),
    } as any);
  })
);

export const BrowserFrame = ({ children, url = 'yoursite.com', isDark }: { children: React.ReactNode; url?: string; isDark?: boolean }) => (
  <div className="@container/preview border rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-lg">
    <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 flex items-center gap-2 border-b">
      <div className="flex gap-1.5">
        <div className="w-3 h-3 rounded-full bg-red-400"></div>
        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
        <div className="w-3 h-3 rounded-full bg-green-400"></div>
      </div>
      <div className="flex-1 ml-4">
        <div className="bg-white dark:bg-slate-700 rounded-md px-3 py-1 text-xs text-slate-400 max-w-xs">{url}</div>
      </div>
    </div>
    {injectFrameDark(children, isDark)}
  </div>
);
