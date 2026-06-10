'use client';

import React from 'react';
import { Eye, Monitor, Smartphone, Tablet, Sun, Moon } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { COMPONENT_TYPES } from '@/app/admin/home-components/create/shared';
import { Card, CardContent, CardHeader, CardTitle, cn } from '../../../components/ui';
import type { PreviewDevice } from '../hooks/usePreviewDevice';

const devices = [
  { icon: Monitor, id: 'desktop' as const, label: 'Desktop (max-w-7xl)' },
  { icon: Tablet, id: 'tablet' as const, label: 'Tablet (768px)' },
  { icon: Smartphone, id: 'mobile' as const, label: 'Mobile (375px)' }
];

type PreviewDarkContextValue = { isDark: boolean };

let previewDarkSnapshot = false;
const previewDarkListeners = new Set<(isDark: boolean) => void>();

const setPreviewDarkSnapshot = (isDark: boolean) => {
  if (previewDarkSnapshot === isDark) {return;}
  previewDarkSnapshot = isDark;
  previewDarkListeners.forEach((listener) => listener(isDark));
};

const subscribePreviewDark = (listener: (isDark: boolean) => void) => {
  previewDarkListeners.add(listener);
  return () => {
    previewDarkListeners.delete(listener);
  };
};

export const PreviewDarkContext = React.createContext<PreviewDarkContextValue | null>(null);
export const usePreviewDark = () => {
  const context = React.useContext(PreviewDarkContext);
  const [isDark, setIsDark] = React.useState(previewDarkSnapshot);

  React.useEffect(() => subscribePreviewDark(setIsDark), []);

  return context ?? { isDark };
};

const injectPreviewDark = (children: React.ReactNode, isDark: boolean): React.ReactNode => (
  React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) {
      return child;
    }

    if (typeof child.type !== 'string') {
      return React.cloneElement(child, { isDark } as any);
    }

    const childProps = child.props as { children?: React.ReactNode };
    if (!childProps.children) {
      return child;
    }

    return React.cloneElement(child, {
      children: injectPreviewDark(childProps.children, isDark),
    } as any);
  })
);

export const PreviewWrapper = ({ 
  title, 
  children, 
  device, 
  setDevice, 
  previewStyle, 
  setPreviewStyle, 
  styles,
  info,
  deviceWidthClass,
  fontStyle,
  fontClassName,
}: { 
  title: string;
  children: React.ReactNode;
  device: PreviewDevice;
  setDevice: (d: PreviewDevice) => void;
  previewStyle: string;
  setPreviewStyle: (s: string) => void;
  styles: { id: string; label: string }[];
  info?: string;
  deviceWidthClass: string;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
}) => {
  const pathname = usePathname();
  const config = useQuery(api.homeComponentSystemConfig.getConfig);
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    
    // Initial sync
    setIsDark(document.documentElement.classList.contains('dark'));

    // Observe changes to html class list
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    setPreviewDarkSnapshot(isDark);
  }, [isDark]);

  const detectedType = React.useMemo(() => {
    if (!pathname) return null;
    const typeInfo = COMPONENT_TYPES.find(t => 
      pathname.includes(`/create/${t.route}`) || 
      pathname.includes(`/home-components/${t.route}/`)
    );
    return typeInfo ? typeInfo.value : null;
  }, [pathname]);

  const visibleStyles = React.useMemo(() => {
    if (!detectedType || !config?.hiddenLayouts) return styles;
    const hiddenSet = new Set(config.hiddenLayouts);
    return styles.filter(s => !hiddenSet.has(`${detectedType}:${s.id}`));
  }, [styles, detectedType, config?.hiddenLayouts]);

  return (
    <PreviewDarkContext.Provider value={{ isDark }}>
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye size={18} /> {title}
            </CardTitle>
            <div className="flex items-center gap-4 flex-wrap flex-1 min-w-0">
              <div className="flex flex-wrap bg-slate-100 dark:bg-slate-800 rounded-lg p-1 gap-0.5">
                {visibleStyles.map((s) => (
                  <button key={s.id} type="button" onClick={() =>{  setPreviewStyle(s.id); }}
                    className={cn("px-3 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap",
                      previewStyle === s.id 
                        ? "bg-white text-slate-900 dark:bg-slate-700 dark:text-slate-100 shadow-sm" 
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100")}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 shrink-0 gap-1">
              <div className="flex">
                {devices.map((d) => (
                  <button key={d.id} type="button" onClick={() =>{  setDevice(d.id); }} title={d.label}
                    className={cn("p-1.5 rounded-md transition-all",
                      device === d.id 
                        ? "bg-white text-slate-800 dark:bg-slate-700 dark:text-slate-100 shadow-sm" 
                        : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-100")}>
                    <d.icon size={16} />
                  </button>
                ))}
              </div>
              <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-700 self-center mx-1" />
              <button
                type="button"
                onClick={() => setIsDark(!isDark)}
                title={isDark ? "Chuyển sang chế độ Sáng" : "Chuyển sang chế độ Tối"}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  isDark 
                    ? "bg-slate-700 text-amber-400 dark:bg-slate-700 dark:text-amber-300" 
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                )}
              >
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Preview width only shrinks this frame; Tailwind sm/md/lg still reads the admin viewport, so preview layout classes must branch from device. */}
          <div
            className={cn("@container mx-auto transition-all duration-300", deviceWidthClass, fontClassName, isDark ? "dark bg-slate-950" : "")}
            style={fontStyle}
          >
            {injectPreviewDark(children, isDark)}
          </div>
          {info && (
            <div className="mt-3 text-xs text-slate-500">
              Style: <strong className="text-slate-700 dark:text-slate-300">{styles.find(s => s.id === previewStyle)?.label}</strong>
              {' • '}{device === 'desktop' && 'max-w-7xl (1280px)'}{device === 'tablet' && '768px'}{device === 'mobile' && '375px'}
              {info && ` • ${info}`}
            </div>
          )}
        </CardContent>
      </Card>
    </PreviewDarkContext.Provider>
  );
};

