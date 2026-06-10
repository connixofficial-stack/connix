'use client';

import { HomeComponentRenderer } from '@/components/site/home/HomeComponentRenderer';
import { HomePageLoading } from '@/components/site/loading/HomePageLoading';
import { useBrandColors } from '@/components/site/hooks';
import { useSiteSettings } from '@/components/site/hooks';
import { api } from '@/convex/_generated/api';
import type { Doc } from '@/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import Link from 'next/link';
import React, { useEffect, useMemo, useRef, useState } from 'react';

const EMPTY_COMPONENTS_COUNT = 0;
const LOADING_DELAY_MS = 120;
const LOADING_MIN_DISPLAY_MS = 320;
const MAX_CRITICAL_COMPONENTS = 3;

export default function HomePageClient({
  initialComponents,
}: {
  initialComponents?: Doc<'homeComponents'>[];
}): React.ReactElement {
  const [showDeferred, setShowDeferred] = useState(false);
  const [idleReady, setIdleReady] = useState(false);
  const [interactionReady, setInteractionReady] = useState(false);
  const [intersectionReady, setIntersectionReady] = useState(false);
  const components = useQuery(api.homeComponents.listActive);
  const resolvedComponents = components ?? initialComponents;
  const [showLoading, setShowLoading] = useState(false);
  const loadingStartRef = useRef<number | null>(null);
  const delayTimerRef = useRef<number | null>(null);
  const deferredTriggerRef = useRef<HTMLDivElement | null>(null);
  const [criticalCount, setCriticalCount] = useState(MAX_CRITICAL_COMPONENTS);

  const isDataReady = typeof resolvedComponents !== 'undefined';

  const systemConfig = useQuery(api.homeComponentSystemConfig.getConfig);
  const systemColors = useBrandColors();
  const { isDark } = useSiteSettings();

  const bgStyle = useMemo(() => {
    if (!systemConfig?.homePageBackground) {return {};}
    const { enabled, type, customColor } = systemConfig.homePageBackground;
    if (!enabled || isDark) {return {};}
    let color = '';
    switch (type) {
      case 'white':
        color = '#ffffff';
        break;
      case 'black':
        color = '#000000';
        break;
      case 'primary':
        color = systemColors.primary;
        break;
      case 'secondary':
        color = systemColors.secondary || systemColors.primary;
        break;
      case 'custom':
        color = customColor || '#ffffff';
        break;
      default:
        color = '#ffffff';
    }
    return { backgroundColor: color };
  }, [systemConfig?.homePageBackground, systemColors, isDark]);

  useEffect(() => {
    const canIdle = typeof window.requestIdleCallback === 'function';
    const handle = canIdle
      ? window.requestIdleCallback(() => setIdleReady(true), { timeout: 900 })
      : window.setTimeout(() => setIdleReady(true), 900);
    return () => {
      if (canIdle) {
        window.cancelIdleCallback(handle as number);
      } else {
        window.clearTimeout(handle as number);
      }
    };
  }, []);

  useEffect(() => {
    if (idleReady && (intersectionReady || interactionReady)) {
      setShowDeferred(true);
    }
  }, [idleReady, intersectionReady, interactionReady]);

  useEffect(() => {
    if (showDeferred) {
      return;
    }
    const node = deferredTriggerRef.current;
    if (!node) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIntersectionReady(true);
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [showDeferred]);

  useEffect(() => {
    if (interactionReady || showDeferred) {
      return;
    }
    const handleInteract = () => {
      setInteractionReady(true);
    };
    window.addEventListener('scroll', handleInteract, { once: true, passive: true });
    window.addEventListener('pointerdown', handleInteract, { once: true });
    window.addEventListener('keydown', handleInteract, { once: true });
    return () => {
      window.removeEventListener('scroll', handleInteract);
      window.removeEventListener('pointerdown', handleInteract);
      window.removeEventListener('keydown', handleInteract);
    };
  }, [interactionReady, showDeferred]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const nextCount = window.innerWidth < 768 ? 1 : MAX_CRITICAL_COMPONENTS;
    setCriticalCount(nextCount);
  }, []);

  useEffect(() => {
    if (!isDataReady) {
      if (!loadingStartRef.current) {
        loadingStartRef.current = Date.now();
      }
      if (showLoading) {
        return;
      }
      if (LOADING_DELAY_MS <= 0) {
        setShowLoading(true);
        return;
      }
      if (delayTimerRef.current === null) {
        delayTimerRef.current = window.setTimeout(() => {
          setShowLoading(true);
          delayTimerRef.current = null;
        }, LOADING_DELAY_MS);
      }
      return;
    }

    if (delayTimerRef.current) {
      window.clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
    }

    if (!showLoading) {
      setShowLoading(false);
      loadingStartRef.current = null;
      return;
    }

    const startedAt = loadingStartRef.current ?? Date.now();
    const elapsed = Date.now() - startedAt;
    const remaining = Math.max(0, LOADING_MIN_DISPLAY_MS - elapsed);
    if (remaining <= 0) {
      setShowLoading(false);
      loadingStartRef.current = null;
      return;
    }

    const timer = window.setTimeout(() => {
      setShowLoading(false);
      loadingStartRef.current = null;
    }, remaining);

    return () => window.clearTimeout(timer);
  }, [isDataReady, showLoading]);

  if (!isDataReady && !showLoading) {
    return <div className="min-h-screen" aria-hidden />;
  }

  if (showLoading && !isDataReady) {
    return (
      <HomePageLoading />
    );
  }

  if (!resolvedComponents) {
    return <div className="min-h-screen" aria-hidden />;
  }

  if (resolvedComponents.length === EMPTY_COMPONENTS_COUNT) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Chào mừng!</h1>
          <p className="text-slate-500">
            Chưa có nội dung trang chủ. Vui lòng thêm components trong{' '}
            <Link href="/admin/home-components" className="text-blue-600 hover:underline">
              Admin Panel
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const sortedComponents = [...resolvedComponents]
    .filter((componentItem) => {
      if (componentItem.type === 'Footer') {return false;}
      if (componentItem.type === 'Popup') {return false;}
      if (componentItem.type !== 'SpeedDial') {return true;}

      const config = componentItem.config as Record<string, unknown>;
      return config.showOnAllPages !== true;
    })
    .sort((firstComponent, secondComponent) => firstComponent.order - secondComponent.order);
  const criticalComponents = sortedComponents.slice(0, criticalCount);
  const deferredComponents = showDeferred ? sortedComponents.slice(criticalCount) : [];
  const popupComponents = resolvedComponents.filter((componentItem) => componentItem.type === 'Popup');

  return (
    <div style={bgStyle} className="min-h-screen transition-colors duration-300">
      {criticalComponents.map((component) => (
        <HomeComponentRenderer
          key={component._id}
          component={{
            _id: component._id,
            active: component.active,
            config: component.config as Record<string, unknown>,
            order: component.order,
            title: component.title,
            type: component.type,
          }}
        />
      ))}
      {!showDeferred && <div ref={deferredTriggerRef} className="h-px w-px" aria-hidden={true} />}
      {deferredComponents.map((component) => (
        <div key={component._id} style={{ contentVisibility: 'auto', containIntrinsicSize: '0 500px' } as React.CSSProperties}>
          <HomeComponentRenderer
            component={{
              _id: component._id,
              active: component.active,
              config: component.config as Record<string, unknown>,
              order: component.order,
              title: component.title,
              type: component.type,
            }}
          />
        </div>
      ))}
      {popupComponents.map((component) => (
        <HomeComponentRenderer
          key={component._id}
          component={{
            _id: component._id,
            active: component.active,
            config: component.config as Record<string, unknown>,
            order: component.order,
            title: component.title,
            type: component.type,
          }}
        />
      ))}
    </div>
  );
}
