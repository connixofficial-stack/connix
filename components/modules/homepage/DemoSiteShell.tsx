'use client';

import React from 'react';
import { Header, type HeaderInitialData } from '@/components/site/Header';
import { CustomerAuthProvider } from '@/app/(site)/auth/context';
import { CartProvider } from '@/lib/cart';
import { useSnapshotDemoContext } from './SnapshotDemoProvider';
import type { SnapshotMenuItem } from './snapshot-demo-types';
import type { Id } from '@/convex/_generated/dataModel';

/**
 * Lightweight shell for /demo/[slug] route.
 * Renders Header from snapshot bundle data only — no DB queries.
 */
export function DemoSiteShell({ children }: { children: React.ReactNode }) {
  const ctx = useSnapshotDemoContext();

  const initialHeaderData = React.useMemo<HeaderInitialData | undefined>(() => {
    if (!ctx) return undefined;

    const headerMenu = ctx.getMenu('header');
    const site = ctx.getSiteSettings();
    const contact = ctx.getContactSettings();
    const headerSettings = ctx.getHeaderSettings();
    const modules = ctx.getModuleSettings();

    const menuItems = headerMenu?.items.map((item: SnapshotMenuItem) => ({
      _id: item._id as Id<'menuItems'>,
      label: item.label,
      url: item.url,
      order: item.order,
      depth: item.depth,
      active: item.active,
      icon: item.icon,
      openInNewTab: item.openInNewTab,
    })) ?? [];

    return {
      menuData: headerMenu ? {
        menu: {
          _creationTime: 0,
          _id: headerMenu.menu._id as Id<'menus'>,
          location: headerMenu.menu.location,
          name: headerMenu.menu.name,
        },
        items: menuItems,
      } : null,
      headerStyle: headerSettings.header_style ?? 'classic',
      headerConfig: (headerSettings.header_config ?? {}) as HeaderInitialData['headerConfig'],
      contact: {
        contact_phone: contact.contact_phone,
        contact_email: contact.contact_email,
      },
      site: {
        site_logo: site.site_logo,
        site_name: site.site_name,
        site_tagline: site.site_tagline,
      },
      modules: modules ?? undefined,
    };
  }, [ctx]);

  return (
    <CustomerAuthProvider>
      <CartProvider>
        <div data-theme="light" style={{ colorScheme: 'light' }}>
          <div className="min-h-screen flex flex-col">
            <Header initialData={initialHeaderData} staticMode />
            <main className="flex-1 overflow-x-hidden">
              {children}
            </main>
          </div>
        </div>
      </CartProvider>
    </CustomerAuthProvider>
  );
}

