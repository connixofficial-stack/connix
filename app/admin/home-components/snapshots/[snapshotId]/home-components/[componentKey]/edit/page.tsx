'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { ArrowLeft, Eye, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import type { HomepageSnapshotPayload, SnapshotComponentPayload } from '@/lib/homepage-snapshot/types';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '../../../../../../components/ui';
import { CopyableInput } from '../../../../../../components/CopyTextButton';
import { ModuleGuard } from '../../../../../../components/ModuleGuard';
import { COMPONENT_TYPES } from '../../../../../create/shared';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import { useTypeColorOverrideState } from '@/app/admin/home-components/_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '@/app/admin/home-components/_shared/hooks/useTypeFontOverride';
import { FooterForm } from '@/app/admin/home-components/footer/_components/FooterForm';
import { FooterPreview } from '@/app/admin/home-components/footer/_components/FooterPreview';
import { normalizeFooterConfig } from '@/app/admin/home-components/footer/_lib/constants';
import type { FooterConfig, FooterStyle } from '@/app/admin/home-components/footer/_types';
import { SpeedDialForm } from '@/app/admin/home-components/speed-dial/_components/SpeedDialForm';
import { SpeedDialPreview } from '@/app/admin/home-components/speed-dial/_components/SpeedDialPreview';
import { DEFAULT_SPEED_DIAL_CONFIG, normalizeSpeedDialStyle } from '@/app/admin/home-components/speed-dial/_lib/constants';
import type { SpeedDialAction, SpeedDialConfig, SpeedDialPosition, SpeedDialStyle } from '@/app/admin/home-components/speed-dial/_types';
import { GalleryForm } from '@/app/admin/home-components/gallery/_components/GalleryForm';
import { GalleryPreview } from '@/app/admin/home-components/gallery/_components/GalleryPreview';
import { DEFAULT_GALLERY_ITEMS } from '@/app/admin/home-components/gallery/_lib/constants';
import type { GalleryItem, GalleryStyle } from '@/app/admin/home-components/gallery/_types';
import { ProductListForm } from '@/app/admin/home-components/product-list/_components/ProductListForm';
import { ProductListPreview } from '@/app/admin/home-components/product-list/_components/ProductListPreview';
import { DEFAULT_PRODUCT_LIST_CONFIG } from '@/app/admin/home-components/product-list/_lib/constants';
import type { DemoProductItem, ProductListConfig, ProductListStyle, ProductSelectionMode } from '@/app/admin/home-components/product-list/_types';
import { HeroEditor } from '@/app/admin/home-components/hero/_components/HeroEditor';
import FooterEditPage from '@/app/admin/home-components/footer/[id]/edit/page';
import GalleryEditPage from '@/app/admin/home-components/gallery/[id]/edit/page';
import ProductListEditPage from '@/app/admin/home-components/product-list/[id]/edit/page';
import SpeedDialEditPage from '@/app/admin/home-components/speed-dial/[id]/edit/page';
import FaqEditPage from '@/app/admin/home-components/faq/[id]/edit/page';
import TeamEditPage from '@/app/admin/home-components/team/[id]/edit/page';
import TestimonialsEditPage from '@/app/admin/home-components/testimonials/[id]/edit/page';
import VideoEditPage from '@/app/admin/home-components/video/[id]/edit/page';
import AboutEditPage from '@/app/admin/home-components/about/[id]/edit/page';
import CtaEditPage from '@/app/admin/home-components/cta/[id]/edit/page';
import FeaturesEditPage from '@/app/admin/home-components/features/[id]/edit/page';
import CareerEditPage from '@/app/admin/home-components/career/[id]/edit/page';
import BenefitsEditPage from '@/app/admin/home-components/benefits/[id]/edit/page';
import ClientsEditPage from '@/app/admin/home-components/clients/[id]/edit/page';
import ServicesEditPage from '@/app/admin/home-components/services/[id]/edit/page';
import CountdownEditPage from '@/app/admin/home-components/countdown/[id]/edit/page';
import VoucherPromotionsEditPage from '@/app/admin/home-components/voucher-promotions/[id]/edit/page';
import ProcessEditPage from '@/app/admin/home-components/process/[id]/edit/page';
import StatsEditPage from '@/app/admin/home-components/stats/[id]/edit/page';
import ProductCategoriesEditPage from '@/app/admin/home-components/product-categories/[id]/edit/page';
import BlogEditPage from '@/app/admin/home-components/blog/[id]/edit/page';
import ProductGridEditPage from '@/app/admin/home-components/product-grid/[id]/edit/page';
import PartnersEditPage from '@/app/admin/home-components/partners/[id]/edit/page';
import HomepageCategoryHeroEditPage from '@/app/admin/home-components/homepage-category-hero/[id]/edit/page';
import MarqueeEditPage from '@/app/admin/home-components/marquee/[id]/edit/page';
import TrustBadgesEditPage from '@/app/admin/home-components/trust-badges/[id]/edit/page';
import CategoryProductsEditPage from '@/app/admin/home-components/category-products/[id]/edit/page';
import ServiceListEditPage from '@/app/admin/home-components/service-list/[id]/edit/page';
import CaseStudyEditPage from '@/app/admin/home-components/case-study/[id]/edit/page';
import PricingEditPage from '@/app/admin/home-components/pricing/[id]/edit/page';
import PopupEditPage from '@/app/admin/home-components/popup/[id]/edit/page';
import ContactEditPage from '@/app/admin/home-components/contact/[id]/edit/page';
import { saveSnapshotComponent } from '@/app/admin/home-components/snapshots/_lib/snapshotComponentSave';
import { collectSnapshotMediaRefs } from '@/app/admin/home-components/snapshots/_lib/collectSnapshotMediaRefs';
import { SnapshotRouterMain } from '../../../../_components/SnapshotRouterMain';



type EditableComponent = {
  active: boolean;
  componentKey: string;
  config: unknown;
  configText: string;
  fallbackUsed: boolean;
  mediaRefs: string[];
  order: string;
  title: string;
  type: string;
};

const toEditableComponent = (component: SnapshotComponentPayload): EditableComponent => ({
  active: component.active,
  componentKey: component.componentKey,
  config: component.config ?? {},
  configText: JSON.stringify(component.config ?? {}, null, 2),
  fallbackUsed: component.fallbackUsed,
  mediaRefs: component.mediaRefs ?? [],
  order: String(component.order),
  title: component.title,
  type: component.type,
});

function SnapshotComponentEditPage({ snapshotId, componentKey }: { snapshotId: string; componentKey: string }) {
  const router = useRouter();
  const snapshot = useQuery(api.homepageSnapshots.getHomepageSnapshotById, { snapshotId: snapshotId as Id<'homeComponentSnapshots'> });
  const updateSnapshot = useMutation(api.homepageSnapshots.updateHomepageSnapshot);
  const commitDraftUploads = useMutation(api.fileLifecycle.commitDraftUploadsByStorageIds);
  const { effectiveColors: footerColors } = useTypeColorOverrideState('Footer');
  const { effectiveColors: speedDialColors } = useTypeColorOverrideState('SpeedDial');
  const { effectiveColors: galleryColors } = useTypeColorOverrideState('Gallery');
  const { effectiveColors: productListColors } = useTypeColorOverrideState('ProductList');
  const { effectiveColors: statsColors } = useTypeColorOverrideState('Stats');
  const { effectiveColors: productCategoriesColors } = useTypeColorOverrideState('ProductCategories');
  const { effectiveColors: blogColors } = useTypeColorOverrideState('Blog');
  const { effectiveColors: productGridColors } = useTypeColorOverrideState('ProductGrid');
  const { effectiveColors: partnersColors } = useTypeColorOverrideState('Partners');
  const { effectiveFont: footerFont } = useTypeFontOverrideState('Footer');
  const { effectiveFont: statsFont } = useTypeFontOverrideState('Stats');
  const { effectiveFont: productCategoriesFont } = useTypeFontOverrideState('ProductCategories');
  const { effectiveFont: blogFont } = useTypeFontOverrideState('Blog');
  const { effectiveFont: productGridFont } = useTypeFontOverrideState('ProductGrid');
  const { effectiveFont: partnersFont } = useTypeFontOverrideState('Partners');
  const [component, setComponent] = useState<EditableComponent | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const decodedKey = decodeURIComponent(componentKey);
  const payload = snapshot?.payload as HomepageSnapshotPayload | undefined;
  const typeInfo = component ? COMPONENT_TYPES.find((type) => type.value === component.type) : null;
  const TypeIcon = typeInfo?.icon;
  const isFooter = component?.type === 'Footer';
  const isSpeedDial = component?.type === 'SpeedDial';
  const isGallery = component?.type === 'Gallery';
  const isHero = component?.type === 'Hero';
  const isFAQ = component?.type === 'FAQ';
  const isProductList = component?.type === 'ProductList';
  const isTeam = component?.type === 'Team';
  const isTestimonials = component?.type === 'Testimonials';
  const isVideo = component?.type === 'Video';
  const isAbout = component?.type === 'About';
  const isCTA = component?.type === 'CTA';
  const isFeatures = component?.type === 'Features';
  const isCareer = component?.type === 'Career';
  const isBenefits = component?.type === 'Benefits';
  const isClients = component?.type === 'Clients';
  const isServices = component?.type === 'Services';
  const isCountdown = component?.type === 'Countdown';
  const isVoucherPromotions = component?.type === 'VoucherPromotions';
  const isProcess = component?.type === 'Process';
  const isStats = component?.type === 'Stats';
  const isProductCategories = component?.type === 'ProductCategories';
  const isBlog = component?.type === 'Blog';
  const isProductGrid = component?.type === 'ProductGrid';
  const isPartners = component?.type === 'Partners';
  const isHomepageCategoryHero = component?.type === 'HomepageCategoryHero';
  const isMarquee = component?.type === 'Marquee';
  const isTrustBadges = component?.type === 'TrustBadges';
  const isCategoryProducts = component?.type === 'CategoryProducts';
  const isServiceList = component?.type === 'ServiceList';
  const isCaseStudy = component?.type === 'CaseStudy';
  const isPricing = component?.type === 'Pricing';
  const isPopup = component?.type === 'Popup';
  const isContact = component?.type === 'Contact';
  const isDedicatedFormType = isFooter || isSpeedDial || isGallery || isProductList;
  const effectiveColors = isPartners ? partnersColors : isProductGrid ? productGridColors : isBlog ? blogColors : isProductCategories ? productCategoriesColors : isStats ? statsColors : isProductList ? productListColors : isGallery ? galleryColors : isSpeedDial ? speedDialColors : footerColors;
  const effectiveFont = isPartners ? partnersFont : isProductGrid ? productGridFont : isBlog ? blogFont : isProductCategories ? productCategoriesFont : isStats ? statsFont : footerFont;
  const brandMode: 'single' | 'dual' = effectiveColors.mode === 'single' ? 'single' : 'dual';
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;
  const demoUrl = snapshot?.publicEnabled && snapshot.slug
    ? `/demo/${snapshot.slug}`
    : `/admin/home-components/snapshots/${snapshotId}/demo`;

  useEffect(() => {
    if (!payload || loadedKey === decodedKey) {return;}
    const found = payload.homepage.components.find((item) => item.componentKey === decodedKey);
    setComponent(found ? toEditableComponent(found) : null);
    setLoadedKey(decodedKey);
  }, [decodedKey, loadedKey, payload]);

  const handleSaveSnapshotComponent = async ({
    active,
    config,
    title,
    order,
    manualMediaRefs,
  }: {
    active: boolean;
    config: unknown;
    title: string;
    order?: number | string;
    manualMediaRefs?: string[];
  }) => {
    if (!payload || !snapshot || !component) {
      toast.error('Component chưa sẵn sàng');
      return;
    }

    const autoRefs = collectSnapshotMediaRefs(config);
    const combinedRefs = Array.from(new Set([
      ...autoRefs,
      ...(manualMediaRefs ?? []),
    ])).filter(Boolean);

    setIsSaving(true);
    try {
      await saveSnapshotComponent({
        active,
        component,
        config,
        decodedKey,
        label: snapshot.label,
        mediaRefs: combinedRefs,
        order,
        payload,
        snapshotId,
        title,
        updateSnapshot,
      });

      if (combinedRefs.length > 0) {
        await commitDraftUploads({ storageIds: combinedRefs });
      }

      toast.success('Đã lưu component');
      router.push(`/admin/home-components/snapshots/${snapshotId}/home-components`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể lưu component');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!payload || !snapshot || !component) {
      toast.error('Component chưa sẵn sàng');
      return;
    }

    const order = Number(component.order);
    if (!Number.isFinite(order)) {
      toast.error('Thứ tự không hợp lệ');
      return;
    }

    let parsedConfig: unknown;
    if (component.type === 'Footer') {
      parsedConfig = normalizeFooterConfig(component.config as Partial<FooterConfig> | null | undefined);
    } else if (component.type === 'SpeedDial') {
      parsedConfig = component.config;
    } else if (component.type === 'Gallery') {
      parsedConfig = component.config;
    } else if (component.type === 'ProductList') {
      parsedConfig = component.config;
    } else {
      try {
        parsedConfig = JSON.parse(component.configText) as unknown;
      } catch {
        toast.error('JSON config không hợp lệ');
        return;
      }
    }

    await handleSaveSnapshotComponent({
      active: component.active,
      config: parsedConfig,
      title: component.title,
      order,
    });
  };

  if (snapshot === undefined || (payload && loadedKey !== decodedKey)) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (snapshot === null || !payload || !component) {
    return <div className="text-center py-8 text-slate-500">Không tìm thấy component snapshot</div>;
  }

  if (isHero) {
    return (
      <HeroEditor
        backHref={`/admin/home-components/snapshots/${snapshotId}/home-components`}
        draftOwnerKey={`home-component:snapshot:${snapshotId}:hero:${decodedKey}`}
        enableTypeOverrides={false}
        heading="Chỉnh sửa Hero Banner"
        initial={{
          active: component.active,
          config: (component.config ?? {}) as Record<string, any>,
          title: component.title,
        }}
        showSnapshotLabel={snapshot.label}
        onAfterSave={() => router.push(`/admin/home-components/snapshots/${snapshotId}/home-components`)}
        onSave={async ({ active, config, storageIds, title }) => {
          await handleSaveSnapshotComponent({
            active,
            config,
            title,
            manualMediaRefs: storageIds.map(String),
          });
        }}
      />
    );
  }

  if (isFooter || isSpeedDial || isGallery || isProductList) {
    const SharedEditPage = isFooter
      ? FooterEditPage
      : isSpeedDial
        ? SpeedDialEditPage
        : isGallery
          ? GalleryEditPage
          : ProductListEditPage;

    return (
      <SharedEditPage
        backHref={`/admin/home-components/snapshots/${snapshotId}/home-components`}
        enableTypeOverrides={false}
        snapshotLabel={snapshot.label}
        snapshotComponent={{
          _id: component.componentKey,
          active: component.active,
          config: component.config as Record<string, any>,
          title: component.title,
          type: component.type,
        }}
        onSnapshotSave={async (next) => {
          await handleSaveSnapshotComponent({
            active: next.active,
            config: next.config,
            title: next.title,
          });
        }}
      />
    );
  }

  if (isFAQ || isVideo || isTeam || isTestimonials) {
    const SharedEditPage = isFAQ
      ? FaqEditPage
      : isVideo
        ? VideoEditPage
        : isTeam
          ? TeamEditPage
          : TestimonialsEditPage;

    return (
      <SharedEditPage
        backHref={`/admin/home-components/snapshots/${snapshotId}/home-components`}
        enableTypeOverrides={false}
        snapshotLabel={snapshot.label}
        snapshotComponent={{
          _id: component.componentKey,
          active: component.active,
          config: component.config as Record<string, any>,
          title: component.title,
          type: component.type,
        }}
        onSnapshotSave={async (next) => {
          await handleSaveSnapshotComponent({
            active: next.active,
            config: next.config,
            title: next.title,
          });
        }}
      />
    );
  }

  if (isAbout || isCTA || isFeatures || isCareer || isBenefits || isClients) {
    const SharedEditPage = isAbout
      ? AboutEditPage
      : isCTA
        ? CtaEditPage
        : isFeatures
          ? FeaturesEditPage
          : isCareer
            ? CareerEditPage
            : isBenefits
              ? BenefitsEditPage
              : ClientsEditPage;

    return (
      <SharedEditPage
        backHref={`/admin/home-components/snapshots/${snapshotId}/home-components`}
        enableTypeOverrides={false}
        snapshotLabel={snapshot.label}
        snapshotComponent={{
          _id: component.componentKey,
          active: component.active,
          config: component.config as Record<string, any>,
          title: component.title,
          type: component.type,
        }}
        onSnapshotSave={async (next) => {
          await handleSaveSnapshotComponent({
            active: next.active,
            config: next.config,
            title: next.title,
          });
        }}
      />
    );
  }

  if (isServices || isCountdown || isVoucherPromotions || isProcess) {
    const SharedEditPage = isServices
      ? ServicesEditPage
      : isCountdown
        ? CountdownEditPage
        : isVoucherPromotions
          ? VoucherPromotionsEditPage
          : ProcessEditPage;

    return (
      <SharedEditPage
        backHref={`/admin/home-components/snapshots/${snapshotId}/home-components`}
        enableTypeOverrides={false}
        snapshotLabel={snapshot.label}
        snapshotComponent={{
          _id: component.componentKey,
          active: component.active,
          config: component.config as Record<string, any>,
          title: component.title,
          type: component.type,
        }}
        onSnapshotSave={async (next) => {
          await handleSaveSnapshotComponent({
            active: next.active,
            config: next.config,
            title: next.title,
          });
        }}
      />
    );
  }

  if (isStats || isProductCategories || isBlog || isProductGrid || isPartners) {
    const SharedEditPage = isStats
      ? StatsEditPage
      : isProductCategories
        ? ProductCategoriesEditPage
        : isBlog
          ? BlogEditPage
          : isProductGrid
            ? ProductGridEditPage
            : PartnersEditPage;

    return (
      <SharedEditPage
        backHref={`/admin/home-components/snapshots/${snapshotId}/home-components`}
        enableTypeOverrides={false}
        snapshotLabel={snapshot.label}
        snapshotComponent={{
          _id: component.componentKey,
          active: component.active,
          config: component.config as Record<string, any>,
          title: component.title,
          type: component.type,
        }}
        onSnapshotSave={async (next) => {
          await handleSaveSnapshotComponent({
            active: next.active,
            config: next.config,
            title: next.title,
          });
        }}
      />
    );
  }


  if (isHomepageCategoryHero || isMarquee || isTrustBadges || isCategoryProducts || isServiceList || isCaseStudy || isPricing || isPopup || isContact) {
    const SharedEditPage = isHomepageCategoryHero
      ? HomepageCategoryHeroEditPage
      : isMarquee
        ? MarqueeEditPage
        : isTrustBadges
          ? TrustBadgesEditPage
          : isCategoryProducts
            ? CategoryProductsEditPage
            : isServiceList
              ? ServiceListEditPage
              : isCaseStudy
                ? CaseStudyEditPage
                : isPricing
                  ? PricingEditPage
                  : isPopup
                    ? PopupEditPage
                    : ContactEditPage;

    return (
      <SharedEditPage
        backHref={`/admin/home-components/snapshots/${snapshotId}/home-components`}
        enableTypeOverrides={false}
        snapshotComponent={{
          _id: `snapshot:${snapshotId}:${decodedKey}`,
          active: component.active,
          config: (component.config ?? {}) as Record<string, any>,
          title: component.title,
          type: component.type,
        }}
        snapshotLabel={snapshot.label}
        onSnapshotSave={async ({ active, config, title }) => {
          await handleSaveSnapshotComponent({
            active,
            config,
            title,
          });
        }}
      />
    );
  }

  if (!isDedicatedFormType) {
    return (
      <SnapshotRouterMain
        component={component}
        snapshotId={snapshotId}
        payload={payload}
        snapshotLabel={snapshot.label}
        decodedKey={decodedKey}
        updateSnapshot={updateSnapshot}
        effectiveColors={effectiveColors}
        fontStyle={fontStyle}
        onCancel={() => router.push(`/admin/home-components/snapshots/${snapshotId}/home-components`)}
      />
    );
  }

  if (isFooter) {
    const footerConfig = normalizeFooterConfig(component.config as Partial<FooterConfig> | null | undefined);

    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-20">
        <div>
          <Link href={`/admin/home-components/snapshots/${snapshotId}/home-components`} className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mb-2">
            <ArrowLeft className="h-3.5 w-3.5" />
            Quay lại danh sách
          </Link>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                {TypeIcon ? <TypeIcon size={22} className="text-slate-500" /> : null}
                Chỉnh sửa Footer
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Snapshot: {snapshot.label}</p>
            </div>
            <Link href={demoUrl} target="_blank">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Eye className="h-3.5 w-3.5" />
                Xem thử
              </Button>
            </Link>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Footer
              <Badge variant="secondary">Footer</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-[1fr_160px]">
              <div className="space-y-2">
                <Label>Tiêu đề hiển thị <span className="text-red-500">*</span></Label>
                <CopyableInput
                  value={component.title}
                  onChange={(event) => setComponent({ ...component, title: event.target.value })}
                  copyLabel="tiêu đề hiển thị"
                  required
                  placeholder="Nhập tiêu đề component..."
                />
              </div>
              <div className="space-y-2">
                <Label>Thứ tự</Label>
                <Input
                  value={component.order}
                  inputMode="numeric"
                  onChange={(event) => setComponent({ ...component, order: event.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <FooterForm
          value={footerConfig}
          onChange={(next) => setComponent({ ...component, config: next })}
          primary={effectiveColors.primary}
          secondary={effectiveColors.secondary}
          mode={brandMode}
          defaultExpanded={false}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
          <div></div>
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            <FooterPreview
              config={footerConfig as any}
              brandColor={effectiveColors.primary}
              secondary={effectiveColors.secondary}
              mode={brandMode}
              selectedStyle={footerConfig.style as any}
              onStyleChange={(style: FooterStyle) => { setComponent({ ...component, config: { ...footerConfig, style } }); }}
              fontStyle={fontStyle}
              fontClassName="font-active"
            />
          </div>
        </div>

        <HomeComponentStickyFooter
          isSubmitting={isSaving}
          onCancel={() => { router.push(`/admin/home-components/snapshots/${snapshotId}/home-components`); }}
          onClickSave={() => { void handleSave(); }}
          submitLabel="Lưu thay đổi"
          submitType="button"
          active={component.active}
          onActiveChange={(active) => setComponent({ ...component, active })}
        />
      </div>
    );
  }

  if (isSpeedDial) {
    const rawConfig = component.config as Record<string, unknown>;
    const normalizePosition = (value: unknown): SpeedDialPosition => (
      value === 'bottom-left' ? 'bottom-left' : 'bottom-right'
    );
    const normalizeString = (value: unknown, fallback = '') => (
      typeof value === 'string' ? value : fallback
    );
    const normalizeBoolean = (value: unknown, fallback: boolean) => (
      typeof value === 'boolean' ? value : fallback
    );
    const normalizeActions = (value: unknown): SpeedDialAction[] => {
      if (!Array.isArray(value) || value.length === 0) {
        return DEFAULT_SPEED_DIAL_CONFIG.actions;
      }
      return value.map((raw, idx) => {
        const action = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
        return {
          id: typeof action.id === 'string' || typeof action.id === 'number' ? action.id : `action-${idx}`,
          icon: normalizeString(action.icon, 'phone'),
          label: normalizeString(action.label),
          url: normalizeString(action.url),
          bgColor: normalizeString(action.bgColor, '#3b82f6'),
        };
      });
    };

    const speedDialConfig: SpeedDialConfig = {
      actions: normalizeActions(rawConfig.actions),
      style: normalizeSpeedDialStyle(rawConfig.style as string | undefined),
      position: normalizePosition(rawConfig.position),
      defaultOpen: normalizeBoolean(rawConfig.defaultOpen, DEFAULT_SPEED_DIAL_CONFIG.defaultOpen),
      showOnAllPages: normalizeBoolean(rawConfig.showOnAllPages, DEFAULT_SPEED_DIAL_CONFIG.showOnAllPages),
      enableShadow: normalizeBoolean(rawConfig.enableShadow, DEFAULT_SPEED_DIAL_CONFIG.enableShadow),
    };

    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-20">
        <div>
          <Link href={`/admin/home-components/snapshots/${snapshotId}/home-components`} className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mb-2">
            <ArrowLeft className="h-3.5 w-3.5" />
            Quay lại danh sách
          </Link>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                {TypeIcon ? <TypeIcon size={22} className="text-slate-500" /> : null}
                Chỉnh sửa Speed Dial
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Snapshot: {snapshot.label}</p>
            </div>
            <Link href={demoUrl} target="_blank">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Eye className="h-3.5 w-3.5" />
                Xem thử
              </Button>
            </Link>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Speed Dial
              <Badge variant="secondary">SpeedDial</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-[1fr_160px]">
              <div className="space-y-2">
                <Label>Tiêu đề hiển thị <span className="text-red-500">*</span></Label>
                <CopyableInput
                  value={component.title}
                  onChange={(event) => setComponent({ ...component, title: event.target.value })}
                  copyLabel="tiêu đề hiển thị"
                  required
                  placeholder="Nhập tiêu đề component..."
                />
              </div>
              <div className="space-y-2">
                <Label>Thứ tự</Label>
                <Input
                  value={component.order}
                  inputMode="numeric"
                  onChange={(event) => setComponent({ ...component, order: event.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <SpeedDialForm
          actions={speedDialConfig.actions}
          onActionsChange={(actions) => setComponent({ ...component, config: { ...speedDialConfig, actions } })}
          position={speedDialConfig.position}
          onPositionChange={(position) => setComponent({ ...component, config: { ...speedDialConfig, position } })}
          defaultOpen={speedDialConfig.defaultOpen}
          onDefaultOpenChange={(defaultOpen) => setComponent({ ...component, config: { ...speedDialConfig, defaultOpen } })}
          showOnAllPages={speedDialConfig.showOnAllPages}
          onShowOnAllPagesChange={(showOnAllPages) => setComponent({ ...component, config: { ...speedDialConfig, showOnAllPages } })}
          enableShadow={speedDialConfig.enableShadow}
          onEnableShadowChange={(enableShadow) => setComponent({ ...component, config: { ...speedDialConfig, enableShadow } })}
          defaultActionColor={speedDialColors.secondary}
          defaultExpanded={false}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
          <div></div>
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            <SpeedDialPreview
              actions={speedDialConfig.actions}
              position={speedDialConfig.position}
              style={speedDialConfig.style}
              brandColor={speedDialColors.primary}
              secondary={speedDialColors.secondary}
              mode={speedDialColors.mode}
              title={component.title}
              selectedStyle={speedDialConfig.style}
              onStyleChange={(style: SpeedDialStyle) => { setComponent({ ...component, config: { ...speedDialConfig, style } }); }}
              defaultOpen={speedDialConfig.defaultOpen}
              enableShadow={speedDialConfig.enableShadow}
            />
          </div>
        </div>

        <HomeComponentStickyFooter
          isSubmitting={isSaving}
          onCancel={() => { router.push(`/admin/home-components/snapshots/${snapshotId}/home-components`); }}
          onClickSave={() => { void handleSave(); }}
          submitLabel="Lưu thay đổi"
          submitType="button"
          active={component.active}
          onActiveChange={(active) => setComponent({ ...component, active })}
        />
      </div>
    );
  }

  if (isGallery) {
    const rawConfig = component.config as Record<string, unknown>;
    const normalizeGalleryItems = (value: unknown): GalleryItem[] => {
      if (!Array.isArray(value) || value.length === 0) {
        return DEFAULT_GALLERY_ITEMS;
      }
      return value.map((raw, idx) => {
        const item = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
        return {
          id: typeof item.id === 'string' || typeof item.id === 'number' ? String(item.id) : `item-${idx + 1}`,
          url: typeof item.url === 'string' ? item.url : '',
          link: typeof item.link === 'string' ? item.link : '',
          name: typeof item.name === 'string' ? item.name : '',
        };
      });
    };
    const normalizeGalleryStyle = (value: unknown): GalleryStyle => {
      if (value === 'spotlight' || value === 'explore' || value === 'stories' || value === 'grid' || value === 'marquee' || value === 'masonry') {
        return value;
      }
      return 'grid';
    };

    const galleryItems = normalizeGalleryItems(rawConfig.items);
    const galleryStyle = normalizeGalleryStyle(rawConfig.style);

    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-20">
        <div>
          <Link href={`/admin/home-components/snapshots/${snapshotId}/home-components`} className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mb-2">
            <ArrowLeft className="h-3.5 w-3.5" />
            Quay lại danh sách
          </Link>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                {TypeIcon ? <TypeIcon size={22} className="text-slate-500" /> : null}
                Chỉnh sửa Gallery
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Snapshot: {snapshot.label}</p>
            </div>
            <Link href={demoUrl} target="_blank">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Eye className="h-3.5 w-3.5" />
                Xem thử
              </Button>
            </Link>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Gallery
              <Badge variant="secondary">Gallery</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-[1fr_160px]">
              <div className="space-y-2">
                <Label>Tiêu đề hiển thị <span className="text-red-500">*</span></Label>
                <CopyableInput
                  value={component.title}
                  onChange={(event) => setComponent({ ...component, title: event.target.value })}
                  copyLabel="tiêu đề hiển thị"
                  required
                  placeholder="Nhập tiêu đề component..."
                />
              </div>
              <div className="space-y-2">
                <Label>Thứ tự</Label>
                <Input
                  value={component.order}
                  inputMode="numeric"
                  onChange={(event) => setComponent({ ...component, order: event.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <GalleryForm
          galleryItems={galleryItems}
          setGalleryItems={(items: GalleryItem[]) => setComponent({ ...component, config: { ...rawConfig, items } })}
          componentType="Gallery"
          headerPrimary={effectiveColors.primary}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
          <div></div>
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            <GalleryPreview
              items={galleryItems}
              brandColor={effectiveColors.primary}
              secondary={effectiveColors.secondary}
              mode={effectiveColors.mode}
              title={component.title}
              selectedStyle={galleryStyle}
              onStyleChange={(style: GalleryStyle) => { setComponent({ ...component, config: { ...rawConfig, style } }); }}
            />
          </div>
        </div>

        <HomeComponentStickyFooter
          isSubmitting={isSaving}
          onCancel={() => { router.push(`/admin/home-components/snapshots/${snapshotId}/home-components`); }}
          onClickSave={() => { void handleSave(); }}
          submitLabel="Lưu thay đổi"
          submitType="button"
          active={component.active}
          onActiveChange={(active) => setComponent({ ...component, active })}
        />
      </div>
    );
  }

  if (isProductList) {
    return (
      <SnapshotProductListEditor
        component={component}
        setComponent={setComponent}
        snapshot={snapshot}
        snapshotId={snapshotId}
        isSaving={isSaving}
        handleSave={handleSave}
        effectiveColors={productListColors}
        TypeIcon={TypeIcon}
        demoUrl={demoUrl}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div>
        <Link href={`/admin/home-components/snapshots/${snapshotId}/home-components`} className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mb-2">
          <ArrowLeft className="h-3.5 w-3.5" />
          Quay lại danh sách
        </Link>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              {TypeIcon ? <TypeIcon size={22} className="text-slate-500" /> : null}
              Chỉnh sửa {typeInfo?.label ?? component.type}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Snapshot: {snapshot.label}</p>
          </div>
          <Link href={demoUrl} target="_blank">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              Xem thử
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Thông tin component
            <Badge variant="secondary">{component.type}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-[1fr_160px_auto] md:items-end">
            <div className="space-y-2">
              <Label>Tiêu đề</Label>
              <Input value={component.title} onChange={(event) => setComponent({ ...component, title: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Thứ tự</Label>
              <Input value={component.order} inputMode="numeric" onChange={(event) => setComponent({ ...component, order: event.target.value })} />
            </div>
            <label className="inline-flex h-10 items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={component.active}
                onChange={(event) => setComponent({ ...component, active: event.target.checked })}
                className="h-4 w-4 rounded border-slate-300"
              />
              Hiển thị
            </label>
          </div>

          <div className="space-y-2">
            <Label>Config nội dung (JSON)</Label>
            <textarea
              value={component.configText}
              onChange={(event) => setComponent({ ...component, configText: event.target.value })}
              spellCheck={false}
              className="w-full min-h-[360px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-mono leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <p className="text-xs text-slate-500">Sửa nội dung trong snapshot. Trang chủ thật chỉ đổi khi bạn quay lại danh sách snapshot và bấm áp dụng.</p>
          </div>
        </CardContent>
      </Card>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex max-w-5xl justify-end gap-2">
          <Link href={`/admin/home-components/snapshots/${snapshotId}/home-components`}>
            <Button variant="outline">Hủy</Button>
          </Link>
          <Button variant="accent" className="gap-2" onClick={() => { void handleSave(); }} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Lưu thay đổi
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Snapshot ProductList Editor ── */
function SnapshotProductListEditor({
  component,
  setComponent,
  snapshot,
  snapshotId,
  isSaving,
  handleSave,
  effectiveColors,
  TypeIcon,
  demoUrl,
}: {
  component: EditableComponent;
  setComponent: React.Dispatch<React.SetStateAction<EditableComponent | null>>;
  snapshot: { label: string };
  snapshotId: string;
  isSaving: boolean;
  handleSave: () => Promise<void>;
  effectiveColors: { primary: string; secondary: string; mode: string };
  TypeIcon: React.ElementType | undefined;
  demoUrl: string;
}) {
  const router = useRouter();
  const rawConfig = (component.config ?? {}) as Record<string, unknown>;

  // Derive state from config (single source of truth = component.config)
  const productSelectionMode: ProductSelectionMode =
    (rawConfig.selectionMode as ProductSelectionMode) || 'demo';
  const productListConfig: ProductListConfig = {
    itemCount: (rawConfig.itemCount as number) ?? DEFAULT_PRODUCT_LIST_CONFIG.itemCount,
    sortBy: (rawConfig.sortBy as string) ?? DEFAULT_PRODUCT_LIST_CONFIG.sortBy,
  };
  const productListStyle: ProductListStyle =
    (rawConfig.style as ProductListStyle) || 'commerce';
  const demoProducts: DemoProductItem[] =
    (rawConfig.demoProducts as DemoProductItem[]) ?? [];
  const selectedProductIds: string[] =
    (rawConfig.selectedProductIds as string[]) ?? [];

  // Local UI-only state
  const [productSearchTerm, setProductSearchTerm] = useState('');

  // Helpers to update config
  const updateConfig = (patch: Record<string, unknown>) => {
    setComponent((prev) => {
      if (!prev) return prev;
      return { ...prev, config: { ...((prev.config ?? {}) as Record<string, unknown>), ...patch } };
    });
  };



  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div>
        <Link href={`/admin/home-components/snapshots/${snapshotId}/home-components`} className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mb-2">
          <ArrowLeft className="h-3.5 w-3.5" />
          Quay lại danh sách
        </Link>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              {TypeIcon ? <TypeIcon size={22} className="text-slate-500" /> : null}
              Chỉnh sửa Danh sách Sản phẩm
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Snapshot: {snapshot.label}</p>
          </div>
          <Link href={demoUrl} target="_blank">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              Xem thử
            </Button>
          </Link>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Danh sách Sản phẩm
            <Badge variant="secondary">ProductList</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[1fr_160px]">
            <div className="space-y-2">
              <Label>Tiêu đề hiển thị <span className="text-red-500">*</span></Label>
              <CopyableInput
                value={component.title}
                onChange={(event) => setComponent((prev) => prev ? { ...prev, title: event.target.value } : prev)}
                copyLabel="tiêu đề hiển thị"
                required
                placeholder="Nhập tiêu đề component..."
              />
            </div>
            <div className="space-y-2">
              <Label>Thứ tự</Label>
              <Input
                value={component.order}
                inputMode="numeric"
                onChange={(event) => setComponent((prev) => prev ? { ...prev, order: event.target.value } : prev)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <ProductListForm
        productSelectionMode={productSelectionMode}
        setProductSelectionMode={(mode) => updateConfig({ selectionMode: mode })}
        productListConfig={productListConfig}
        setProductListConfig={(config) => updateConfig({ itemCount: config.itemCount, sortBy: config.sortBy })}
        filteredProducts={[]}
        selectedProducts={[]}
        selectedProductIds={selectedProductIds}
        setSelectedProductIds={(updater) => {
          const next = typeof updater === 'function' ? updater(selectedProductIds) : updater;
          updateConfig({ selectedProductIds: next });
        }}
        productSearchTerm={productSearchTerm}
        setProductSearchTerm={setProductSearchTerm}
        demoProducts={demoProducts}
        setDemoProducts={(updater) => {
          const next = typeof updater === 'function' ? updater(demoProducts) : updater;
          updateConfig({ demoProducts: next });
        }}
        isLoading={false}
        defaultExpanded={false}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
        <div></div>
        <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
          <ProductListPreview
            brandColor={effectiveColors.primary}
            secondary={effectiveColors.secondary}
            itemCount={productSelectionMode === 'demo' ? demoProducts.length : (productSelectionMode === 'manual' ? selectedProductIds.length : productListConfig.itemCount)}
            componentType="ProductList"
            selectedStyle={productListStyle}
            onStyleChange={(style) => updateConfig({ style })}
            items={productSelectionMode === 'demo' && demoProducts.length > 0
              ? demoProducts.map((item) => ({
                id: item.id,
                name: item.name,
                image: item.image,
                price: item.price,
                originalPrice: item.originalPrice,
                category: item.category,
                tag: (item.tag || undefined) as 'new' | 'hot' | 'sale' | undefined,
              }))
              : undefined
            }
            sectionTitle={component.title}
          />
        </div>
      </div>

      <HomeComponentStickyFooter
        isSubmitting={isSaving}
        onCancel={() => { router.push(`/admin/home-components/snapshots/${snapshotId}/home-components`); }}
        onClickSave={() => { void handleSave(); }}
        submitLabel="Lưu thay đổi"
        submitType="button"
        active={component.active}
        onActiveChange={(active) => setComponent((prev) => prev ? { ...prev, active } : prev)}
      />
    </div>
  );
}

export default function SnapshotComponentEditPageWrapper({ params }: { params: Promise<{ snapshotId: string; componentKey: string }> }) {
  const { snapshotId, componentKey } = use(params);

  return (
    <ModuleGuard moduleKey="homepage">
      <SnapshotComponentEditPage snapshotId={snapshotId} componentKey={componentKey} />
    </ModuleGuard>
  );
}
