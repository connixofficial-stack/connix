'use client';

import React from 'react';
import { useQuery } from 'convex/react';
import { Loader2 } from 'lucide-react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import {
  getServiceListColorTokens,
} from '@/app/admin/home-components/service-list/_lib/colors';
import { extractSectionHeaderConfig } from '@/app/admin/home-components/_shared/hooks/useSectionHeaderState';
import { ServiceListSectionShared } from '@/app/admin/home-components/service-list/_components/ServiceListSectionShared';
import type {
  ServiceListBrandMode,
  ServiceListConfig,
  ServiceListPreviewItem,
  ServiceListStyle,
} from '@/app/admin/home-components/service-list/_types';
import {
  normalizeServiceListCardRadius,
  normalizeServiceListDesktopColumns,
} from '@/app/admin/home-components/service-list/_types';
import { buildDetailPath, normalizeRouteMode } from '@/lib/ia/route-mode';
import { useSnapshotDemoContext } from '@/components/modules/homepage/SnapshotDemoProvider';
import { adaptTokensForDarkMode } from '@/components/site/home/utils/darkModeColorAdapter';

interface ServiceListSectionProps {
  config: Record<string, unknown>;
  brandColor: string;
  secondary: string;
  mode: ServiceListBrandMode;
  title: string;
  snapshotComponentKey?: string;
  isDark?: boolean;
}

type ServiceRecord = {
  _id: Id<'services'>;
  title: string;
  slug?: string;
  excerpt?: string;
  thumbnail?: string;
  status?: string;
  price?: number;
  views: number;
  categoryId: Id<'serviceCategories'>;
};

const mapServiceToPreview = (
  service: ServiceRecord,
  index: number,
  params: {
    routeMode: 'unified' | 'namespace';
    categorySlugMap: Map<string, string>;
  },
): ServiceListPreviewItem & { href: string } => ({
  id: service._id,
  name: service.title,
  image: service.thumbnail,
  description: service.excerpt,
  price: service.price,
  tag: (service as any).tag, // Fallback if tag is passed through somehow, otherwise undefined
  href: service.slug ? buildDetailPath({
    categorySlug: params.categorySlugMap.get(service.categoryId),
    mode: params.routeMode,
    moduleKey: 'services',
    recordSlug: service.slug,
  }) : '/services',
});

export function ServiceListSection({
  config,
  brandColor,
  secondary,
  mode,
  title,
  snapshotComponentKey,
  isDark,
}: ServiceListSectionProps) {
  const snapshotDemo = useSnapshotDemoContext();
  const safeConfig = config as Partial<ServiceListConfig>;

  const style = (safeConfig.style as ServiceListStyle) ?? 'grid';
  const cardRadius = normalizeServiceListCardRadius(safeConfig.cardRadius);
  const desktopColumns = normalizeServiceListDesktopColumns(safeConfig.desktopColumns);
  const itemCount = Math.min(Math.max(Number(safeConfig.itemCount) || 8, 1), 20);
  const selectionMode = safeConfig.selectionMode ?? 'auto';
  const headerConfig = extractSectionHeaderConfig(config);

  const selectedServiceIds = React.useMemo(() => (
    Array.isArray(safeConfig.selectedServiceIds)
      ? safeConfig.selectedServiceIds
      : []
  ), [safeConfig.selectedServiceIds]);

  const demoServices = React.useMemo(() => (config.demoServices as Array<{ id: string; name: string; image?: string; price?: string; description?: string; tag?: string; link?: string }>) || [], [config.demoServices]);

  const servicesData = useQuery(
    api.services.listAll,
    selectionMode === 'demo' ? 'skip' : (selectionMode === 'auto' ? { limit: Math.min(itemCount, 20) } : { limit: 100 }),
  );
  const categories = useQuery(api.serviceCategories.listActive, selectionMode === 'demo' ? 'skip' : { limit: 100 });
  const routeModeSetting = useQuery(api.settings.getValue, { key: 'ia_route_mode', defaultValue: 'unified' });
  const snapshotData = React.useMemo(() => {
    if (!snapshotDemo || !snapshotComponentKey) {return null;}
    const data = snapshotDemo.getComponentData(snapshotComponentKey);
    return data?.kind === 'service-list' ? data : null;
  }, [snapshotDemo, snapshotComponentKey]);
  const routeMode = React.useMemo(
    () => normalizeRouteMode(snapshotData?.settings?.iaRouteMode ?? routeModeSetting),
    [routeModeSetting, snapshotData?.settings]
  );
  const categorySlugMap = React.useMemo(() => {
    if (snapshotData) {
      return new Map(snapshotData.categories.map((category) => [category.id, category.slug ?? '']));
    }
    if (!categories) {return new Map<string, string>();}
    return new Map(categories.map((category) => [category._id, category.slug]));
  }, [categories, snapshotData]);

  const sortBy = safeConfig.sortBy ?? 'newest';

  const services = React.useMemo(() => {
    // Demo mode: use inline demo data directly, no DB query needed
    if (selectionMode === 'demo' && demoServices.length > 0) {
      return demoServices.map((item) => ({
        _id: item.id as Id<'services'>,
        categoryId: '' as Id<'serviceCategories'>,
        excerpt: item.description,
        price: item.price ? Number(item.price.replace(/[^\d]/g, '')) || 0 : undefined,
        slug: undefined,
        status: 'Published',
        thumbnail: item.image,
        title: item.name,
        views: 0,
        tag: item.tag,
        link: item.link,
      }));
    }

    if (snapshotData) {
      return snapshotData.items.slice(0, itemCount).map((item) => ({
        _id: item.id as Id<'services'>,
        categoryId: (item.categoryId ?? '') as Id<'serviceCategories'>,
        excerpt: item.excerpt,
        price: item.price,
        slug: item.slug,
        status: 'Published',
        thumbnail: item.image,
        title: item.title,
        views: item.views ?? 0,
      }));
    }
    if (!servicesData) {return [];}

    const published = servicesData
      .filter((service) => service.status === 'Published') as ServiceRecord[];

    const sorted = (() => {
      if (sortBy === 'popular') {
        return [...published].sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
      }
      if (sortBy === 'random') {
        return [...published].sort(() => Math.random() - 0.5);
      }
      return published;
    })();

    if (selectionMode === 'manual' && selectedServiceIds.length > 0) {
      const serviceMap = new Map(sorted.map((service) => [service._id, service]));
      return selectedServiceIds
        .map((id) => serviceMap.get(id as Id<'services'>))
        .filter((service): service is ServiceRecord => service !== undefined)
        .slice(0, itemCount);
    }

    return sorted.slice(0, itemCount);
  }, [servicesData, selectionMode, selectedServiceIds, itemCount, sortBy, snapshotData, demoServices]);

  if (selectionMode !== 'demo' && !snapshotData && servicesData === undefined) {
    return (
      <section className="py-12 md:py-16 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[200px]">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      </section>
    );
  }

  const tokens = React.useMemo(() => {
    const rawTokens = getServiceListColorTokens({
      primary: brandColor,
      secondary,
      mode,
    });
    return adaptTokensForDarkMode(rawTokens, isDark ?? false);
  }, [brandColor, secondary, mode, isDark]);

  const items = services.map((service, index) => {
    const preview = mapServiceToPreview(service, index, { categorySlugMap, routeMode });
    // Demo mode: dùng link do người dùng nhập, fallback về href đã build
    const demoLink = (service as { link?: string }).link;
    if (demoLink) {
      return { ...preview, href: demoLink };
    }
    return preview;
  });

  return (
    <ServiceListSectionShared
      context="site"
      mode={mode}
      hideHeader={headerConfig.hideHeader}
      showTitle={headerConfig.showTitle}
      showSubtitle={headerConfig.showSubtitle}
      subtitle={headerConfig.subtitle}
      headerAlign={headerConfig.headerAlign}
      titleColorPrimary={headerConfig.titleColorPrimary}
      subtitleAboveTitle={headerConfig.subtitleAboveTitle}
      uppercaseText={headerConfig.uppercaseText}
      showBadge={headerConfig.showBadge}
      badgeText={headerConfig.badgeText}
      spacing={headerConfig.spacing}
      cardRadius={cardRadius}
      desktopColumns={desktopColumns}
      style={style}
      sectionTitle={title}
      items={items}
      tokens={tokens}
      showViewAll={services.length >= 3}
      viewAllHref="/services"
      imagePriorityCount={2}
    />
  );
}
