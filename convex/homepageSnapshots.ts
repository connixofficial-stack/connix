import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { slugify, getMimeFromExtension } from '../lib/image/uploadNaming';
import type { Doc } from './_generated/dataModel';
import {
  HOMEPAGE_SNAPSHOT_VERSION,
  HOMEPAGE_SNAPSHOT_VERSION_V2,
  type HomepageSnapshotImportReport,
  type HomepageSnapshotPayload,
  type SnapshotDependencyCapture,
  type SnapshotStaticCategory,
  type SnapshotStaticItem,
  type SnapshotSystemStylePayload,
} from '../lib/homepage-snapshot/types';
import type { ContactSettings, SEOSettings, SiteSettings, SocialSettings } from '../lib/get-settings';

const REPLACE_ALL_MODE = 'replace_all';

const loadSnapshotPayload = async (
  ctx: any,
  snapshotId: string,
): Promise<unknown> => {
  const payloadRow = await ctx.db
    .query('homeComponentSnapshotPayloads')
    .withIndex('by_snapshotId', (q: any) => q.eq('snapshotId', snapshotId))
    .unique();
  if (payloadRow) return payloadRow.payload;
  return null;
};

const SNAPSHOT_REQUIRED_SETTINGS_KEYS = {
  contact: [
    'contact_email',
    'contact_phone',
    'contact_address',
    'contact_zalo',
    'contact_map_provider',
    'contact_google_map_embed_iframe',
  ],
  site: [
    'site_name',
    'site_tagline',
    'site_url',
    'site_logo',
    'site_favicon',
    'site_brand_primary',
    'site_brand_secondary',
    'site_brand_mode',
    'site_timezone',
    'site_language',
  ],
  social: [
    'social_facebook',
    'social_instagram',
    'social_youtube',
    'social_tiktok',
    'social_twitter',
    'social_linkedin',
    'social_pinterest',
  ],
  seo: [
    'seo_title',
    'seo_description',
    'seo_keywords',
    'seo_og_image',
    'seo_google_verification',
    'seo_bing_verification',
  ],
} as const;

const getExtensionFromUrl = (value?: string) => {
  if (!value) {return 'bin';}
  const clean = value.split('?')[0]?.split('#')[0] ?? value;
  const last = clean.split('/').pop() ?? '';
  const ext = last.includes('.') ? last.split('.').pop() : undefined;
  return ext?.toLowerCase() ?? 'bin';
};

const collectUrls = (value: unknown, acc: Set<string>) => {
  if (typeof value === 'string' && /^https?:\/\//.test(value)) {
    acc.add(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectUrls(item, acc));
    return;
  }
  if (value && typeof value === 'object') {
    Object.values(value as Record<string, unknown>).forEach((item) => collectUrls(item, acc));
  }
};

const toStaticPost = (post: Doc<'posts'>): SnapshotStaticItem => ({
  sourceId: post._id as string,
  sourceType: 'post',
  title: `${post.title} [tĩnh]`,
  image: post.thumbnail,
  slug: post.slug,
  subtitle: post.excerpt,
});

const toStaticProduct = (product: Doc<'products'>): SnapshotStaticItem => ({
  sourceId: product._id as string,
  sourceType: 'product',
  title: `${product.name} [tĩnh]`,
  image: product.image || product.images?.[0],
  slug: product.slug,
  subtitle: product.description,
  price: product.effectivePrice ?? product.price,
});

const toStaticService = (service: Doc<'services'>): SnapshotStaticItem => ({
  sourceId: service._id as string,
  sourceType: 'service',
  title: `${service.title} [tĩnh]`,
  image: service.thumbnail,
  slug: service.slug,
  subtitle: service.excerpt,
  price: service.price,
});

const toStaticCategory = (category: Doc<'productCategories'>): SnapshotStaticCategory => ({
  sourceId: category._id as string,
  title: `${category.name} [tĩnh]`,
  image: category.image,
  slug: category.slug,
  description: category.description,
});

const buildDependencyCapture = async (ctx: any, components: Array<Doc<'homeComponents'>>): Promise<SnapshotDependencyCapture> => {
  const postIds = new Set<string>();
  const productIds = new Set<string>();
  const serviceIds = new Set<string>();
  const productCategoryIds = new Set<string>();

  components.forEach((component) => {
    const config = (component.config ?? {}) as Record<string, unknown>;
    const type = component.type;

    if (type === 'Blog') {
      ((config.selectedPostIds as string[] | undefined) ?? []).forEach((id) => postIds.add(id));
    }
    if (type === 'ProductGrid') {
      ((config.selectedProductIds as string[] | undefined) ?? []).forEach((id) => productIds.add(id));
    }
    if (type === 'ProductList') {
      ((config.selectedProductIds as string[] | undefined) ?? []).forEach((id) => productIds.add(id));
      ((config.selectedServiceIds as string[] | undefined) ?? []).forEach((id) => serviceIds.add(id));
      ((config.selectedPostIds as string[] | undefined) ?? []).forEach((id) => postIds.add(id));
    }
    if (type === 'ServiceList') {
      ((config.selectedServiceIds as string[] | undefined) ?? []).forEach((id) => serviceIds.add(id));
    }
    if (type === 'ProductCategories') {
      ((config.categories as Array<{ categoryId?: string }> | undefined) ?? []).forEach((item) => {
        if (item.categoryId) {productCategoryIds.add(item.categoryId);}
      });
    }
    if (type === 'CategoryProducts') {
      ((config.sections as Array<{ categoryId?: string }> | undefined) ?? []).forEach((item) => {
        if (item.categoryId) {productCategoryIds.add(item.categoryId);}
      });
    }
    if (type === 'HomepageCategoryHero') {
      ((config.categories as Array<{ categoryId?: string; groups?: Array<{ items?: Array<{ categoryId?: string; productId?: string }> }> }> | undefined) ?? []).forEach((item) => {
        if (item.categoryId) {productCategoryIds.add(item.categoryId);}
        (item.groups ?? []).forEach((group) => (group.items ?? []).forEach((link) => {
          if (link.categoryId) {productCategoryIds.add(link.categoryId);}
          if (link.productId) {productIds.add(link.productId);}
        }));
      });
    }
  });

  // Safe wrapper: returns null for any invalid/non-existent ID instead of throwing
  const safeGet = async (table: string, id: string) => {
    try {
      return await ctx.db.get(id as any);
    } catch {
      return null;
    }
  };

  const [posts, products, services, productCategories] = await Promise.all([
    Promise.all(Array.from(postIds).map((id) => safeGet('posts', id))),
    Promise.all(Array.from(productIds).map((id) => safeGet('products', id))),
    Promise.all(Array.from(serviceIds).map((id) => safeGet('services', id))),
    Promise.all(Array.from(productCategoryIds).map((id) => safeGet('productCategories', id))),
  ]);

  return {
    posts: posts.filter(Boolean).map((item) => toStaticPost(item as Doc<'posts'>)),
    products: products.filter(Boolean).map((item) => toStaticProduct(item as Doc<'products'>)),
    services: services.filter(Boolean).map((item) => toStaticService(item as Doc<'services'>)),
    productCategories: productCategories.filter(Boolean).map((item) => toStaticCategory(item as Doc<'productCategories'>)),
  };
};

const rewriteConfigWithFallback = (
  type: string,
  config: Record<string, unknown>,
  dependencies: SnapshotDependencyCapture,
) => {
  const next = { ...config } as Record<string, unknown>;

  if (type === 'Blog') {
    next.fallbackPosts = dependencies.posts;
  }
  if (type === 'ProductGrid') {
    next.fallbackProducts = dependencies.products;
  }
  if (type === 'ProductList') {
    next.fallbackProducts = dependencies.products;
    next.fallbackServices = dependencies.services;
    next.fallbackPosts = dependencies.posts;
  }
  if (type === 'ServiceList') {
    next.fallbackServices = dependencies.services;
  }
  if (type === 'ProductCategories') {
    next.fallbackCategories = dependencies.productCategories;
  }
  if (type === 'CategoryProducts') {
    next.fallbackCategories = dependencies.productCategories;
    next.fallbackProducts = dependencies.products;
  }
  if (type === 'HomepageCategoryHero') {
    next.fallbackCategories = dependencies.productCategories;
    next.fallbackProducts = dependencies.products;
  }

  return next;
};

const buildSystemStyle = async (ctx: any): Promise<SnapshotSystemStylePayload> => {
  // Chỉ lấy đúng 4 keys cần thiết qua index, tránh take(1000) scan toàn bảng
  const styleKeys = [
    'create_hidden_types',
    'type_color_overrides',
    'type_font_overrides',
    'global_font_override',
  ] as const;
  const rows = await Promise.all(
    styleKeys.map((key) =>
      ctx.db.query('settings').withIndex('by_key', (q: any) => q.eq('key', key)).unique()
    )
  );
  const settingByKey = new Map<string, unknown>(
    rows.filter(Boolean).map((r: any) => [r.key, r.value])
  );
  const hiddenTypesValue = settingByKey.get('create_hidden_types');
  return {
    hiddenTypes: Array.isArray(hiddenTypesValue) ? hiddenTypesValue.filter((item): item is string => typeof item === 'string') : [],
    typeColorOverrides: (settingByKey.get('type_color_overrides') as Record<string, unknown>) ?? {},
    typeFontOverrides: (settingByKey.get('type_font_overrides') as Record<string, unknown>) ?? {},
    globalFontOverride: (settingByKey.get('global_font_override') as { enabled: boolean; fontKey: string }) ?? {
      enabled: false,
      fontKey: 'system-default',
    },
  };
};

const toSettingsMap = async (ctx: any, keys: readonly string[]) => {
  const rows = await Promise.all(keys.map((key) => ctx.db.query('settings').withIndex('by_key', (q: any) => q.eq('key', key)).unique()));
  return rows.reduce<Record<string, unknown>>((acc, row, index) => {
    acc[keys[index]!] = row?.value ?? '';
    return acc;
  }, {});
};

const buildSnapshotSettingsBundle = async (ctx: any) => {
  const [headerStyleRow, headerConfigRow] = await Promise.all([
    ctx.db.query('settings').withIndex('by_key', (q: any) => q.eq('key', 'header_style')).unique(),
    ctx.db.query('settings').withIndex('by_key', (q: any) => q.eq('key', 'header_config')).unique(),
  ]);
  return {
    contact: await toSettingsMap(ctx, SNAPSHOT_REQUIRED_SETTINGS_KEYS.contact) as unknown as ContactSettings,
    header: {
      header_style: (headerStyleRow?.value as string) ?? 'classic',
      header_config: (headerConfigRow?.value as Record<string, unknown>) ?? {},
    },
    routing: {
      ia_route_mode: (await ctx.db.query('settings').withIndex('by_key', (q: any) => q.eq('key', 'ia_route_mode')).unique())?.value ?? 'unified',
    },
    site: await toSettingsMap(ctx, SNAPSHOT_REQUIRED_SETTINGS_KEYS.site) as unknown as SiteSettings,
    social: await toSettingsMap(ctx, SNAPSHOT_REQUIRED_SETTINGS_KEYS.social) as unknown as SocialSettings,
    seo: await toSettingsMap(ctx, SNAPSHOT_REQUIRED_SETTINGS_KEYS.seo) as unknown as SEOSettings,
  };
};

const buildSnapshotModuleBundle = async (ctx: any) => {
  const moduleKeys = ['cart', 'wishlist', 'products', 'posts', 'services', 'customers', 'orders'] as const;
  const [moduleRows, customerLoginFeature] = await Promise.all([
    Promise.all(moduleKeys.map((key) => ctx.db.query('adminModules').withIndex('by_key', (q: any) => q.eq('key', key)).unique())),
    ctx.db.query('moduleFeatures').withIndex('by_module_feature', (q: any) => q.eq('moduleKey', 'customers').eq('featureKey', 'enableLogin')).unique(),
  ]);
  const enabledByKey = moduleKeys.reduce<Record<string, boolean>>((acc, key, index) => {
    acc[key] = Boolean(moduleRows[index]?.enabled);
    return acc;
  }, {});

  return {
    cart: enabledByKey.cart ?? false,
    wishlist: enabledByKey.wishlist ?? false,
    products: enabledByKey.products ?? false,
    posts: enabledByKey.posts ?? false,
    services: enabledByKey.services ?? false,
    customers: enabledByKey.customers ?? false,
    orders: enabledByKey.orders ?? false,
    customerLogin: Boolean(customerLoginFeature?.enabled),
  };
};

const serializeMenuPayload = async (ctx: any, location: 'header' | 'footer') => {
  const menu = await ctx.db.query('menus').withIndex('by_location', (q: any) => q.eq('location', location)).unique();
  if (!menu) {return null;}
  const items = await ctx.db.query('menuItems').withIndex('by_menu_active', (q: any) => q.eq('menuId', menu._id).eq('active', true)).collect();
  return {
    items: items.map((item: any) => ({
      _id: item._id as string,
      active: item.active,
      depth: item.depth,
      icon: item.icon,
      label: item.label,
      menuId: item.menuId as string,
      openInNewTab: item.openInNewTab,
      order: item.order,
      parentId: item.parentId as string | undefined,
      url: item.url,
    })),
    menu: {
      _id: menu._id as string,
      location: menu.location,
      name: menu.name,
    },
  };
};

/**
 * Lightweight demo bundle builder.
 * Instead of querying 200+ records per table, resolves only the N items
 * each component actually displays and embeds them as demo data in config.
 * Blog/ProductList/ServiceList with auto/manual → override to selectionMode='demo'.
 * Contact/Footer/Category types → embed settings/resolved data into config.
 */
const buildSnapshotDemoConfigs = async (
  ctx: any,
  components: Array<Doc<'homeComponents'>>,
): Promise<{
  configOverrides: Map<string, Record<string, unknown>>;
  settings: Awaited<ReturnType<typeof buildSnapshotSettingsBundle>>;
  modules: Awaited<ReturnType<typeof buildSnapshotModuleBundle>>;
  menus: { footer: any; header: any };
}> => {
  const [settingsBundle, moduleBundle] = await Promise.all([
    buildSnapshotSettingsBundle(ctx),
    buildSnapshotModuleBundle(ctx),
  ]);
  const [footerMenu, headerMenu] = await Promise.all([
    serializeMenuPayload(ctx, 'footer'),
    serializeMenuPayload(ctx, 'header'),
  ]);

  const configOverrides = new Map<string, Record<string, unknown>>();
  // Lazy-loaded data caches (only fetched if needed)
  let _activeProducts: any[] | null = null;
  let _publishedPosts: any[] | null = null;
  let _publishedServices: any[] | null = null;
  let _productCategories: any[] | null = null;
  let _serviceCategories: any[] | null = null;
  let _postCategories: any[] | null = null;

  const getActiveProducts = async () => {
    if (!_activeProducts) _activeProducts = await ctx.db.query('products').withIndex('by_status_order', (q: any) => q.eq('status', 'Active')).take(50);
    return _activeProducts!;
  };
  const getPublishedPosts = async () => {
    if (!_publishedPosts) _publishedPosts = await ctx.db.query('posts').withIndex('by_status_publishedAt', (q: any) => q.eq('status', 'Published')).order('desc').take(50);
    return _publishedPosts!;
  };
  const getPublishedServices = async () => {
    if (!_publishedServices) _publishedServices = await ctx.db.query('services').withIndex('by_status_publishedAt', (q: any) => q.eq('status', 'Published')).take(50);
    return _publishedServices!;
  };
  const _getProductCategories = async () => {
    if (!_productCategories) _productCategories = await ctx.db.query('productCategories').withIndex('by_active', (q: any) => q.eq('active', true)).take(200);
    return _productCategories!;
  };
  const _getServiceCategories = async () => {
    if (!_serviceCategories) _serviceCategories = await ctx.db.query('serviceCategories').withIndex('by_active', (q: any) => q.eq('active', true)).take(200);
    return _serviceCategories!;
  };
  const getPostCategories = async () => {
    if (!_postCategories) _postCategories = await ctx.db.query('postCategories').withIndex('by_active', (q: any) => q.eq('active', true)).take(200);
    return _postCategories!;
  };

  for (const component of components) {
    const key = component._id as string;
    const config = (component.config ?? {}) as Record<string, unknown>;
    const type = component.type;

    // ProductList / ProductGrid → embed demoProducts in config
    if (type === 'ProductList' || type === 'ProductGrid') {
      if (config.selectionMode === 'demo') continue; // already has demo data
      const itemCount = Math.min(Math.max(Number(config.itemCount) || 8, 1), 20);
      const selectedIds = Array.isArray(config.selectedProductIds) ? config.selectedProductIds as string[] : [];
      const allProducts = await getActiveProducts();
      const products = config.selectionMode === 'manual' && selectedIds.length > 0
        ? selectedIds.map((id) => allProducts.find((p: any) => p._id === id)).filter(Boolean)
        : allProducts.slice(0, itemCount);
      configOverrides.set(key, {
        ...config,
        selectionMode: 'demo',
        _originalSelectionMode: config.selectionMode ?? 'auto',
        demoProducts: products.slice(0, itemCount).map((p: any) => ({
          id: p._id, name: p.name, image: p.image || p.images?.[0],
          price: p.salePrice != null ? String(p.salePrice) : String(p.price ?? ''),
          originalPrice: p.salePrice != null ? String(p.price) : undefined,
          description: p.description, category: '',
        })),
      });
    }

    // Blog → embed demoPosts in config
    if (type === 'Blog') {
      if (config.selectionMode === 'demo') continue;
      const itemCount = Math.min(Math.max(Number(config.itemCount) || 6, 1), 10);
      const selectedIds = Array.isArray(config.selectedPostIds) ? config.selectedPostIds as string[] : [];
      const allPosts = await getPublishedPosts();
      const postCategories = await getPostCategories();
      const catMap = new Map(postCategories.map((c: any) => [c._id as string, c]));
      const posts = config.selectionMode === 'manual' && selectedIds.length > 0
        ? selectedIds.map((id) => allPosts.find((p: any) => p._id === id)).filter(Boolean)
        : allPosts.slice(0, itemCount);
      configOverrides.set(key, {
        ...config,
        selectionMode: 'demo',
        _originalSelectionMode: config.selectionMode ?? 'auto',
        demoPosts: posts.slice(0, itemCount).map((p: any) => ({
          id: p._id, title: p.title, image: p.thumbnail,
          excerpt: p.excerpt, slug: p.slug, publishedAt: p.publishedAt,
          categoryName: catMap.get(p.categoryId)?.name,
          categorySlug: catMap.get(p.categoryId)?.slug,
        })),
      });
    }

    // ServiceList → embed demoServices in config
    if (type === 'ServiceList') {
      if (config.selectionMode === 'demo') continue;
      const itemCount = Math.min(Math.max(Number(config.itemCount) || 8, 1), 20);
      const selectedIds = Array.isArray(config.selectedServiceIds) ? config.selectedServiceIds as string[] : [];
      const allServices = await getPublishedServices();
      const services = config.selectionMode === 'manual' && selectedIds.length > 0
        ? selectedIds.map((id) => allServices.find((s: any) => s._id === id)).filter(Boolean)
        : allServices.slice(0, itemCount);
      configOverrides.set(key, {
        ...config,
        selectionMode: 'demo',
        _originalSelectionMode: config.selectionMode ?? 'auto',
        demoServices: services.slice(0, itemCount).map((s: any) => ({
          id: s._id, name: s.title, image: s.thumbnail,
          price: s.price != null ? String(s.price) : '', description: s.excerpt,
        })),
      });
    }

    // Contact → embed settings into config
    if (type === 'Contact') {
      configOverrides.set(key, {
        ...config,
        _snapshotContact: settingsBundle.contact,
        _snapshotSocial: settingsBundle.social,
      });
    }

    // Footer → embed settings + menu into config
    if (type === 'Footer') {
      configOverrides.set(key, {
        ...config,
        _snapshotContact: settingsBundle.contact,
        _snapshotSite: settingsBundle.site,
        _snapshotSocial: settingsBundle.social,
        _snapshotFooterMenu: footerMenu,
      });
    }

    // ProductCategories / CategoryProducts / HomepageCategoryHero → keep buildDependencyCapture fallback
    // These types already have fallback logic via rewriteConfigWithFallback, no override needed
  }

  return { configOverrides, settings: settingsBundle, modules: moduleBundle, menus: { footer: footerMenu, header: headerMenu } };
};

export const captureHomepageSnapshot = query({
  args: {
    label: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<HomepageSnapshotPayload> => {
    const components = [...await ctx.db.query('homeComponents').take(5000)].sort((a, b) => a.order - b.order || a._creationTime - b._creationTime);
    const dependencies = await buildDependencyCapture(ctx, components);
    const systemStyle = await buildSystemStyle(ctx);
    const demoResult = await buildSnapshotDemoConfigs(ctx, components);
    const mediaIndexMap = new Map<string, { logicalPath: string; originalUrl: string; mimeType: string; sourceType: string; usedBy: string[] }>();

    const componentPayloads = components.map((component) => {
      const componentKey = `homeComponent:${component.type}:${slugify(component.title)}:${component.order}`;
      // Use overridden config (with embedded demo data) if available, otherwise original
      const baseConfig = demoResult.configOverrides.get(component._id as string)
        ?? (component.config ?? {}) as Record<string, unknown>;
      const finalConfig = rewriteConfigWithFallback(component.type, baseConfig, dependencies);

      const urls = new Set<string>();
      collectUrls(finalConfig, urls);
      const mediaRefs = Array.from(urls).map((url, index) => {
        const ext = getExtensionFromUrl(url);
        const logicalPath = `snapshot-bundles/homepage/${slugify(component.type)}-${slugify(component.title)}-${component.order}-${index + 1}.${ext}`;
        const existing = mediaIndexMap.get(logicalPath);
        if (existing) {
          existing.usedBy.push(componentKey);
        } else {
          mediaIndexMap.set(logicalPath, {
            logicalPath,
            originalUrl: url,
            mimeType: getMimeFromExtension(ext) ?? 'application/octet-stream',
            sourceType: component.type,
            usedBy: [componentKey],
          });
        }
        return logicalPath;
      });

      return {
        componentKey,
        type: component.type,
        title: component.title,
        order: component.order,
        active: component.active,
        config: finalConfig,
        mediaRefs,
        fallbackUsed: ['Blog', 'ProductList', 'ProductGrid', 'ServiceList', 'ProductCategories', 'CategoryProducts', 'HomepageCategoryHero'].includes(component.type),
      };
    });

    return {
      manifest: {
        snapshotVersion: HOMEPAGE_SNAPSHOT_VERSION,
        exportedAt: new Date().toISOString(),
        sourceCoreVersion: 'system-vietadmin-nextjs',
        snapshotLabel: args.label?.trim() || `Homepage Snapshot ${new Date().toISOString().slice(0, 10)}`,
        componentCount: componentPayloads.length,
        capabilities: {
          supportsZip: true,
          supportsStaticFallback: true,
          supportsAppendImport: true,
        },
      },
      homepage: {
        components: componentPayloads,
        componentOrder: componentPayloads.map((item) => item.componentKey),
        dependencies,
        demoBundle: {
          componentData: {},
          integrity: { level: 'config-embedded', requiredMissing: [], warnings: [] },
          menus: demoResult.menus,
          modules: demoResult.modules,
          settings: demoResult.settings,
        },
        systemStyle,
      },
      index: {
        mediaIndex: Array.from(mediaIndexMap.values()),
      },
    };
  },
  returns: v.any(),
});

export const saveHomepageSnapshot = mutation({
  args: {
    category: v.optional(v.string()),
    label: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    // Generate unique slug from label
    let baseSlug = slugify(args.label);
    if (!baseSlug) baseSlug = `snapshot-${Date.now()}`;
    let slug = baseSlug;
    let suffix = 1;
    while (await ctx.db.query('homeComponentSnapshots').withIndex('by_slug', (q) => q.eq('slug', slug)).unique()) {
      slug = `${baseSlug}-${suffix++}`;
    }
    // Insert metadata-only vào homeComponentSnapshots (không có payload)
    const snapshotId = await ctx.db.insert('homeComponentSnapshots', {
      category: args.category || 'other',
      createdAt: Date.now(),
      label: args.label,
      publicEnabled: false,
      slug,
      ...buildSnapshotSummary(args.payload as HomepageSnapshotPayload),
      version: HOMEPAGE_SNAPSHOT_VERSION,
    });
    // Lưu payload vào bảng riêng — tránh đọc toàn document khi list metadata
    await ctx.db.insert('homeComponentSnapshotPayloads', {
      snapshotId,
      payload: args.payload,
    });
    return snapshotId;
  },
  returns: v.id('homeComponentSnapshots'),
});

export const listHomepageSnapshots = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query('homeComponentSnapshots').withIndex('by_createdAt').order('desc').take(100);
    return rows.map((row) => ({
      _id: row._id,
      category: row.category || 'other',
      createdAt: row.createdAt,
      label: row.label,
      version: row.version,
      componentCount: row.componentCount ?? 0,
      slug: row.slug ?? '',
      publicEnabled: row.publicEnabled ?? false,
    }));
  },
  returns: v.array(v.object({
    _id: v.id('homeComponentSnapshots'),
    category: v.string(),
    createdAt: v.number(),
    label: v.string(),
    version: v.string(),
    componentCount: v.number(),
    slug: v.string(),
    publicEnabled: v.boolean(),
  })),
});

export const listHomepageSnapshotsWithPayload = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query('homeComponentSnapshots').withIndex('by_createdAt').order('desc').take(100);
    return await Promise.all(rows.map(async (row) => {
      const payload = await loadSnapshotPayload(ctx, row._id as string);
      return {
        _id: row._id,
        createdAt: row.createdAt,
        label: row.label,
        version: row.version,
        slug: row.slug ?? '',
        publicEnabled: row.publicEnabled ?? false,
        payload,
      };
    }));
  },
  returns: v.array(v.object({
    _id: v.id('homeComponentSnapshots'),
    createdAt: v.number(),
    label: v.string(),
    version: v.string(),
    slug: v.string(),
    publicEnabled: v.boolean(),
    payload: v.any(),
  })),
});

/**
 * Extract the first usable image URL from snapshot components.
 * Priority: Hero background → Hero image → first product image → first post image → logo.
 */
const extractSnapshotThumbnails = (components: Array<{ type: string; config: unknown; active: boolean }>, logo: string): string[] => {
  const images: string[] = [];
  const VIDEO_EXT = /\.(mp4|webm|mov|avi|mkv|flv|wmv|m4v|ogg)([?#]|$)/i;
  const IMAGE_FIELD_KEYS = new Set([
    'avatar',
    'avatarUrl',
    'backgroundImage',
    'cover',
    'coverImage',
    'image',
    'logo',
    'src',
    'thumbnail',
    'url',
  ]);
  const isImageUrl = (v: unknown): v is string => typeof v === 'string'
    && (/^https?:\/\//.test(v) || v.startsWith('/'))
    && !VIDEO_EXT.test(v);
  const addImage = (value: unknown) => {
    if (isImageUrl(value) && !images.includes(value)) {
      images.push(value);
    }
  };
  const collectKnownImages = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(collectKnownImages);
      return;
    }
    if (!value || typeof value !== 'object') {return;}

    Object.entries(value as Record<string, unknown>).forEach(([key, child]) => {
      if (IMAGE_FIELD_KEYS.has(key)) {
        addImage(child);
      }
      if (Array.isArray(child) || (child && typeof child === 'object')) {
        collectKnownImages(child);
      }
    });
  };

  for (const comp of components) {
    if (!comp.active) continue;
    const cfg = (comp.config ?? {}) as Record<string, unknown>;

    // Hero images
    if (comp.type === 'Hero') {
      addImage(cfg.backgroundImage);
      addImage(cfg.image);
      addImage(cfg.url);
      const slides = cfg.slides as Array<Record<string, unknown>> | undefined;
      if (Array.isArray(slides)) {
        for (const slide of slides.slice(0, 6)) {
          addImage(slide.backgroundImage);
          addImage(slide.image);
          addImage(slide.url);
        }
      }
    }

    collectKnownImages(cfg);

    // Product images (from embedded demo data)
    if ((comp.type === 'ProductList' || comp.type === 'ProductGrid') && Array.isArray(cfg.demoProducts)) {
      for (const p of (cfg.demoProducts as Array<Record<string, unknown>>).slice(0, 4)) {
        addImage(p.image);
        addImage(p.url);
        addImage(p.thumbnail);
      }
    }

    // Blog images
    if (comp.type === 'Blog' && Array.isArray(cfg.demoPosts)) {
      for (const p of (cfg.demoPosts as Array<Record<string, unknown>>).slice(0, 3)) {
        addImage(p.image);
        addImage(p.url);
        addImage(p.thumbnail);
      }
    }

    // Service images
    if (comp.type === 'ServiceList' && Array.isArray(cfg.demoServices)) {
      for (const s of (cfg.demoServices as Array<Record<string, unknown>>).slice(0, 3)) {
        addImage(s.image);
        addImage(s.url);
        addImage(s.thumbnail);
      }
    }

    if (images.length >= 6) break; // enough for a rich thumbnail
  }

  if (images.length === 0) {addImage(logo);}
  return images.slice(0, 6);
};

function buildSnapshotSummary(payload: HomepageSnapshotPayload) {
  const demoBundle = payload.homepage.demoBundle as Record<string, unknown> | undefined;
  const settings = demoBundle?.settings as Record<string, unknown> | undefined;
  const site = (settings?.site ?? {}) as Record<string, string>;
  const contact = (settings?.contact ?? {}) as Record<string, string>;
  const components = payload.homepage.components ?? [];
  const logo = site.site_logo || '';
  const activeSections = components.filter((component) => component.active);
  return {
    address: contact.contact_address || '',
    brandMode: site.site_brand_mode || 'dual',
    brandName: site.site_name || '',
    brandPrimary: site.site_brand_primary || '#3b82f6',
    brandSecondary: site.site_brand_secondary || '',
    componentCount: activeSections.length,
    componentTypes: [...new Set(activeSections.map((component) => component.type))],
    logo,
    phone: contact.contact_phone || '',
    sectionTitles: activeSections.map((component) => component.title).filter(Boolean).slice(0, 6),
    tagline: site.site_tagline || '',
    thumbnails: extractSnapshotThumbnails(components, logo),
  };
}

export const listPublicSnapshots = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query('homeComponentSnapshots')
      .withIndex('by_publicEnabled_and_createdAt', (q) => q.eq('publicEnabled', true))
      .order('desc')
      .take(100);
    return rows.map((row) => ({
      _id: row._id,
      category: row.category || 'other',
      createdAt: row.createdAt,
      label: row.label,
      slug: row.slug ?? '',
      brandName: row.brandName ?? '',
      tagline: row.tagline ?? '',
      logo: row.logo ?? '',
      brandPrimary: row.brandPrimary ?? '#3b82f6',
      brandSecondary: row.brandSecondary ?? '',
      brandMode: row.brandMode ?? 'dual',
      phone: row.phone ?? '',
      address: row.address ?? '',
      componentCount: row.componentCount ?? 0,
      componentTypes: row.componentTypes ?? [],
      sectionTitles: row.sectionTitles ?? [],
      thumbnails: row.thumbnails ?? [],
    }));
  },
  returns: v.array(v.object({
    _id: v.id('homeComponentSnapshots'),
    category: v.string(),
    createdAt: v.number(),
    label: v.string(),
    slug: v.string(),
    brandName: v.string(),
    tagline: v.string(),
    logo: v.string(),
    brandPrimary: v.string(),
    brandSecondary: v.string(),
    brandMode: v.string(),
    phone: v.string(),
    address: v.string(),
    componentCount: v.number(),
    componentTypes: v.array(v.string()),
    sectionTitles: v.array(v.string()),
    thumbnails: v.array(v.string()),
  })),
});

export const getHomepageSnapshotById = query({
  args: { snapshotId: v.id('homeComponentSnapshots') },
  handler: async (ctx, args) => {
    const snapshot = await ctx.db.get(args.snapshotId);
    if (!snapshot) return null;
    const payload = await loadSnapshotPayload(ctx, args.snapshotId as string);
    return { ...snapshot, payload };
  },
  returns: v.union(v.object({
    _id: v.id('homeComponentSnapshots'),
    _creationTime: v.number(),
    category: v.optional(v.string()),
    createdAt: v.number(),
    label: v.string(),
    address: v.optional(v.string()),
    brandMode: v.optional(v.string()),
    brandName: v.optional(v.string()),
    brandPrimary: v.optional(v.string()),
    brandSecondary: v.optional(v.string()),
    componentCount: v.optional(v.number()),
    componentTypes: v.optional(v.array(v.string())),
    logo: v.optional(v.string()),
    payload: v.any(),
    phone: v.optional(v.string()),
    publicEnabled: v.optional(v.boolean()),
    sectionTitles: v.optional(v.array(v.string())),
    slug: v.optional(v.string()),
    tagline: v.optional(v.string()),
    thumbnails: v.optional(v.array(v.string())),
    version: v.string(),
  }), v.null()),
});

export const getHomepageSnapshotDemoById = query({
  args: { snapshotId: v.id('homeComponentSnapshots') },
  handler: async (ctx, args) => {
    const snapshot = await ctx.db.get(args.snapshotId);
    if (!snapshot) {return null;}
    const payload = await loadSnapshotPayload(ctx, args.snapshotId as string) as HomepageSnapshotPayload | null;
    if (!payload) {return null;}
    const bundle = (payload.homepage.demoBundle ?? null) as Record<string, unknown> | null;
    return {
      bundle,
      components: payload.homepage.components.map((component, index) => ({
        _id: component.componentKey,
        active: component.active,
        config: component.config as Record<string, unknown>,
        order: index,
        title: component.title,
        type: component.type,
      })),
      label: snapshot.label,
      systemStyle: payload.homepage.systemStyle ?? null,
    };
  },
  returns: v.union(v.object({
    bundle: v.union(v.any(), v.null()),
    components: v.array(v.object({
      _id: v.string(),
      active: v.boolean(),
      config: v.any(),
      order: v.number(),
      title: v.string(),
      type: v.string(),
    })),
    label: v.string(),
    systemStyle: v.union(v.any(), v.null()),
  }), v.null()),
});

export const removeHomepageSnapshot = mutation({
  args: { snapshotId: v.id('homeComponentSnapshots') },
  handler: async (ctx, args) => {
    // Xóa payload row trước để không còn orphan
    const payloadRow = await ctx.db
      .query('homeComponentSnapshotPayloads')
      .withIndex('by_snapshotId', (q) => q.eq('snapshotId', args.snapshotId))
      .unique();
    if (payloadRow) await ctx.db.delete(payloadRow._id);
    await ctx.db.delete(args.snapshotId);
    return null;
  },
  returns: v.null(),
});

export const toggleSnapshotPublic = mutation({
  args: {
    snapshotId: v.id('homeComponentSnapshots'),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.snapshotId, { publicEnabled: args.enabled });
    return { ok: true };
  },
  returns: v.object({ ok: v.boolean() }),
});

export const updateSnapshotCategory = mutation({
  args: {
    snapshotId: v.id('homeComponentSnapshots'),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.snapshotId, { category: args.category });
    return { ok: true };
  },
  returns: v.object({ ok: v.boolean() }),
});

export const updateHomepageSnapshot = mutation({
  args: {
    snapshotId: v.id('homeComponentSnapshots'),
    label: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    const snapshot = await ctx.db.get(args.snapshotId);
    if (!snapshot) {
      throw new Error('Không tìm thấy snapshot');
    }

    const nextPayload = args.payload as HomepageSnapshotPayload;
    const report = buildReport(nextPayload);
    if (report.summary.blocking > 0) {
      throw new Error(report.errors[0]?.message ?? 'Snapshot không hợp lệ');
    }

    // Cập nhật metadata (không có payload)
    await ctx.db.patch(args.snapshotId, {
      label: args.label.trim() || snapshot.label,
      ...buildSnapshotSummary(nextPayload),
    });

    // Upsert payload trong bảng riêng
    const existingPayloadRow = await ctx.db
      .query('homeComponentSnapshotPayloads')
      .withIndex('by_snapshotId', (q) => q.eq('snapshotId', args.snapshotId))
      .unique();
    if (existingPayloadRow) {
      await ctx.db.patch(existingPayloadRow._id, { payload: nextPayload });
    } else {
      await ctx.db.insert('homeComponentSnapshotPayloads', { snapshotId: args.snapshotId, payload: nextPayload });
    }

    return { ok: true };
  },
  returns: v.object({ ok: v.boolean() }),
});

export const backfillHomepageSnapshotSummaries = mutation({
  args: { batchSize: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query('homeComponentSnapshots')
      .withIndex('by_createdAt')
      .order('desc')
      .take(Math.min(args.batchSize ?? 50, 100));
    let updated = 0;
    for (const row of rows) {
      const payload = await loadSnapshotPayload(ctx, row._id as string) as HomepageSnapshotPayload | null;
      if (!payload) continue;
      await ctx.db.patch(row._id, buildSnapshotSummary(payload));
      updated += 1;
    }
    return { updated };
  },
  returns: v.object({ updated: v.number() }),
});

export const getHomepageSnapshotBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const snapshot = await ctx.db.query('homeComponentSnapshots').withIndex('by_slug', (q) => q.eq('slug', args.slug)).unique();
    if (!snapshot || !snapshot.publicEnabled) return null;
    const payload = await loadSnapshotPayload(ctx, snapshot._id as string) as HomepageSnapshotPayload | null;
    if (!payload) return null;
    const bundle = (payload.homepage.demoBundle ?? null) as Record<string, unknown> | null;
    return {
      bundle,
      components: payload.homepage.components.map((component, index) => ({
        _id: component.componentKey,
        active: component.active,
        config: component.config as Record<string, unknown>,
        order: index,
        title: component.title,
        type: component.type,
      })),
      category: snapshot.category || 'other',
      label: snapshot.label,
      systemStyle: payload.homepage.systemStyle,
    };
  },
  returns: v.union(v.any(), v.null()),
});

const buildReport = (payload: HomepageSnapshotPayload): HomepageSnapshotImportReport => {
  const errors: HomepageSnapshotImportReport['errors'] = [];
  const warnings: HomepageSnapshotImportReport['warnings'] = [];

  if (!payload?.manifest || payload.manifest.snapshotVersion !== HOMEPAGE_SNAPSHOT_VERSION) {
    const supported = new Set([HOMEPAGE_SNAPSHOT_VERSION, HOMEPAGE_SNAPSHOT_VERSION_V2]);
    if (!payload?.manifest || !supported.has(payload.manifest.snapshotVersion)) {
      errors.push({ code: 'SNAPSHOT_VERSION_UNSUPPORTED', severity: 'blocking', message: 'Snapshot version không tương thích', file: 'manifest.json' });
    }
  }

  payload.homepage.components.forEach((component) => {
    if (!component.type || !component.title) {
      errors.push({
        code: 'SNAPSHOT_COMPONENT_INVALID',
        severity: 'blocking',
        message: 'Component thiếu type hoặc title',
        componentKey: component.componentKey,
        file: 'homepage/components.json',
      });
    }
    if (component.fallbackUsed) {
      const hasFallback =
        Boolean((component.config as any)?.fallbackPosts?.length) ||
        Boolean((component.config as any)?.fallbackProducts?.length) ||
        Boolean((component.config as any)?.fallbackServices?.length) ||
        Boolean((component.config as any)?.fallbackCategories?.length);
      if (!hasFallback) {
        warnings.push({
          code: 'SNAPSHOT_FALLBACK_EMPTY',
          severity: 'warning',
          message: 'Component có dependency động nhưng snapshot fallback rỗng',
          componentKey: component.componentKey,
          file: 'homepage/components.json',
        });
      }
    }
  });

  const integrity = payload.homepage.demoBundle && typeof payload.homepage.demoBundle === 'object'
    ? (payload.homepage.demoBundle as { integrity?: { requiredMissing?: string[] } }).integrity
    : null;
  if (integrity?.requiredMissing && integrity.requiredMissing.length > 0) {
    errors.push({
      code: 'SNAPSHOT_DEMO_BUNDLE_INCOMPLETE',
      severity: 'blocking',
      message: `Thiếu dữ liệu demo bắt buộc: ${integrity.requiredMissing.join(', ')}`,
      file: 'homepage/demo-bundle.json',
    });
  }

  return {
    summary: {
      blocking: errors.length,
      warnings: warnings.length,
    },
    errors,
    warnings,
  };
};

export const preflightHomepageSnapshot = mutation({
  args: {
    payload: v.any(),
  },
  handler: async (_ctx, args) => {
    return buildReport(args.payload as HomepageSnapshotPayload);
  },
  returns: v.any(),
});

const replaceMediaUrls = (value: unknown, uploadedMediaMap: Record<string, { url: string }>): unknown => {
  if (typeof value === 'string') {
    return uploadedMediaMap[value]?.url ?? value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => replaceMediaUrls(item, uploadedMediaMap));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, replaceMediaUrls(item, uploadedMediaMap)]),
    );
  }
  return value;
};

const rebuildHomeComponentStats = async (ctx: any) => {
  const [stats, components] = await Promise.all([
    ctx.db.query('homeComponentStats').take(500),
    ctx.db.query('homeComponents').take(500),
  ]);

  await Promise.all(stats.map((item: any) => ctx.db.delete(item._id)));

  const counts: Record<string, number> = {
    active: 0,
    inactive: 0,
    total: components.length,
  };

  for (const component of components) {
    counts[component.active ? 'active' : 'inactive'] += 1;
    counts[component.type] = (counts[component.type] ?? 0) + 1;
  }

  await Promise.all(
    Object.entries(counts).map(([key, count]) => ctx.db.insert('homeComponentStats', { count, key })),
  );
};

export const importHomepageSnapshot = mutation({
  args: {
    payload: v.any(),
    mode: v.optional(v.union(v.literal('append'), v.literal('replace_all'))),
    uploadedMediaMap: v.optional(v.record(v.string(), v.object({
      url: v.string(),
      storageId: v.optional(v.union(v.string(), v.null())),
    }))),
  },
  handler: async (ctx, args) => {
    const payload = args.payload as HomepageSnapshotPayload;
    const report = buildReport(payload);
    if (report.summary.blocking > 0) {
      return { applied: false, created: 0, report };
    }

    const uploadedMediaMap = args.uploadedMediaMap ?? {};
    const existing = await ctx.db.query('homeComponents').take(5000);
    if (args.mode === REPLACE_ALL_MODE) {
      for (const item of existing) {
        await ctx.db.delete(item._id);
      }
    }
    const maxOrder = existing.reduce((acc, item) => Math.max(acc, item.order), -1);
    const baseOrder = args.mode === REPLACE_ALL_MODE ? -1 : maxOrder;

    let created = 0;
    for (const [index, component] of payload.homepage.components.entries()) {
      await ctx.db.insert('homeComponents', {
        active: component.active,
        config: replaceMediaUrls(component.config, uploadedMediaMap),
        order: baseOrder + index + 1,
        title: component.title,
        type: component.type,
      });
      created += 1;
    }

    await rebuildHomeComponentStats(ctx);

    const style = payload.homepage.systemStyle;
    const upsertSetting = async (key: string, value: unknown) => {
      const existingSetting = await ctx.db.query('settings').withIndex('by_key', (q) => q.eq('key', key)).unique();
      if (existingSetting) {
        await ctx.db.patch(existingSetting._id, { group: 'home_components', value });
        return;
      }
      await ctx.db.insert('settings', { group: 'home_components', key, value });
    };

    await Promise.all([
      upsertSetting('create_hidden_types', style.hiddenTypes),
      upsertSetting('type_color_overrides', style.typeColorOverrides),
      upsertSetting('type_font_overrides', style.typeFontOverrides),
      upsertSetting('global_font_override', style.globalFontOverride),
    ]);

    // Restore header settings (logo size, header style) from demoBundle
    const demoBundle = payload.homepage.demoBundle as Record<string, unknown> | undefined;
    const demoBundleSettings = demoBundle?.settings as Record<string, unknown> | undefined;
    const snapshotHeader = demoBundleSettings?.header as { header_style?: string; header_config?: Record<string, unknown> } | undefined;
    if (snapshotHeader) {
      const upsertSiteSetting = async (key: string, value: unknown) => {
        const existing = await ctx.db.query('settings').withIndex('by_key', (q) => q.eq('key', key)).unique();
        if (existing) {
          await ctx.db.patch(existing._id, { group: 'site', value });
          return;
        }
        await ctx.db.insert('settings', { group: 'site', key, value });
      };
      const headerOps: Promise<void>[] = [];
      if (snapshotHeader.header_style != null) headerOps.push(upsertSiteSetting('header_style', snapshotHeader.header_style));
      if (snapshotHeader.header_config != null) headerOps.push(upsertSiteSetting('header_config', snapshotHeader.header_config));
      if (headerOps.length > 0) await Promise.all(headerOps);
    }
    const snapshotSeo = demoBundleSettings?.seo as Record<string, unknown> | undefined;
    if (snapshotSeo) {
      const upsertSeoSetting = async (key: string, value: unknown) => {
        const existing = await ctx.db.query('settings').withIndex('by_key', (q) => q.eq('key', key)).unique();
        if (existing) {
          await ctx.db.patch(existing._id, { group: 'seo', value });
          return;
        }
        await ctx.db.insert('settings', { group: 'seo', key, value });
      };
      await Promise.all(SNAPSHOT_REQUIRED_SETTINGS_KEYS.seo.map((key) => upsertSeoSetting(key, snapshotSeo[key] ?? '')));
    }

    return {
      applied: true,
      created,
      report,
    };
  },
  returns: v.any(),
});

export const applyHomepageSnapshot = mutation({
  args: {
    snapshotId: v.id('homeComponentSnapshots'),
    mode: v.optional(v.union(v.literal('replace_all'))),
  },
  handler: async (ctx, args) => {
    const snapshot = await ctx.db.get(args.snapshotId);
    if (!snapshot) {
      throw new Error('Snapshot không tồn tại');
    }
    const payload = await loadSnapshotPayload(ctx, args.snapshotId as string) as HomepageSnapshotPayload | null;
    if (!payload) {
      throw new Error('Payload snapshot không tìm thấy trong homeComponentSnapshotPayloads');
    }
    const report = buildReport(payload);
    if (report.summary.blocking > 0) {
      return { applied: false, created: 0, report };
    }

    const existing = await ctx.db.query('homeComponents').take(5000);
    for (const item of existing) {
      await ctx.db.delete(item._id);
    }

    let created = 0;
    for (const [index, component] of payload.homepage.components.entries()) {
      await ctx.db.insert('homeComponents', {
        active: component.active,
        config: component.config,
        order: index,
        title: component.title,
        type: component.type,
      });
      created += 1;
    }

    await rebuildHomeComponentStats(ctx);

    // Restore systemStyle (fonts, colors, hidden types)
    const style = payload.homepage.systemStyle;
    if (style) {
      const upsertSetting = async (key: string, value: unknown) => {
        const existingSetting = await ctx.db.query('settings').withIndex('by_key', (q) => q.eq('key', key)).unique();
        if (existingSetting) {
          await ctx.db.patch(existingSetting._id, { group: 'home_components', value });
          return;
        }
        await ctx.db.insert('settings', { group: 'home_components', key, value });
      };
      await Promise.all([
        upsertSetting('create_hidden_types', style.hiddenTypes),
        upsertSetting('type_color_overrides', style.typeColorOverrides),
        upsertSetting('type_font_overrides', style.typeFontOverrides),
        upsertSetting('global_font_override', style.globalFontOverride),
      ]);
    }

    // Restore header settings (logo size, header style) from demoBundle
    const demoBundle = payload.homepage.demoBundle as Record<string, unknown> | undefined;
    const demoBundleSettings = demoBundle?.settings as Record<string, unknown> | undefined;
    const snapshotHeader = demoBundleSettings?.header as { header_style?: string; header_config?: Record<string, unknown> } | undefined;
    if (snapshotHeader) {
      const upsertSiteSetting = async (key: string, value: unknown) => {
        const existing = await ctx.db.query('settings').withIndex('by_key', (q) => q.eq('key', key)).unique();
        if (existing) {
          await ctx.db.patch(existing._id, { group: 'site', value });
          return;
        }
        await ctx.db.insert('settings', { group: 'site', key, value });
      };
      const headerOps: Promise<void>[] = [];
      if (snapshotHeader.header_style != null) headerOps.push(upsertSiteSetting('header_style', snapshotHeader.header_style));
      if (snapshotHeader.header_config != null) headerOps.push(upsertSiteSetting('header_config', snapshotHeader.header_config));
      if (headerOps.length > 0) await Promise.all(headerOps);
    }
    const snapshotSeo = demoBundleSettings?.seo as Record<string, unknown> | undefined;
    if (snapshotSeo) {
      const upsertSeoSetting = async (key: string, value: unknown) => {
        const existing = await ctx.db.query('settings').withIndex('by_key', (q) => q.eq('key', key)).unique();
        if (existing) {
          await ctx.db.patch(existing._id, { group: 'seo', value });
          return;
        }
        await ctx.db.insert('settings', { group: 'seo', key, value });
      };
      await Promise.all(SNAPSHOT_REQUIRED_SETTINGS_KEYS.seo.map((key) => upsertSeoSetting(key, snapshotSeo[key] ?? '')));
    }

    return { applied: true, created, report };
  },
  returns: v.any(),
});

/**
 * MIGRATION: Tách `payload` từ homeComponentSnapshots (legacy) sang homeComponentSnapshotPayloads.
 * Chỉ chạy 1 lần trong quá trình nâng core — sau đó xóa `payload` optional khỏi schema (Contract phase).
 * Quy trình: Expand → [Migrate này] → Contract (xóa payload optional trong schema.ts).
 */
export const migrateSnapshotPayloadsToSeparateTable = mutation({
  args: {},
  handler: async (ctx): Promise<{ migrated: number; skipped: number; errors: string[] }> => {
    const snapshots = await ctx.db
      .query('homeComponentSnapshots')
      .withIndex('by_createdAt')
      .collect();

    let migrated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const snapshot of snapshots) {
      // Kiểm tra nếu đã có payload row trong bảng riêng
      const existingPayloadRow = await ctx.db
        .query('homeComponentSnapshotPayloads')
        .withIndex('by_snapshotId', (q) => q.eq('snapshotId', snapshot._id))
        .unique();

      const legacyPayload = (snapshot as Record<string, unknown>).payload;

      if (!legacyPayload) {
        // Không có payload cũ → bỏ qua
        skipped++;
        continue;
      }

      if (existingPayloadRow) {
        // Đã migrate rồi → chỉ xóa payload cũ khỏi snapshot doc (as any vì field không còn trong schema)
        await ctx.db.patch(snapshot._id, { payload: undefined } as any);
        skipped++;
        continue;
      }

      try {
        // Insert payload vào bảng riêng
        await ctx.db.insert('homeComponentSnapshotPayloads', {
          snapshotId: snapshot._id,
          payload: legacyPayload,
        });
        // Xóa field payload khỏi snapshot doc (as any vì field không còn trong schema)
        await ctx.db.patch(snapshot._id, { payload: undefined } as any);
        migrated++;
      } catch (err) {
        errors.push(`snapshot ${snapshot._id as string}: ${String(err)}`);
      }
    }

    return { migrated, skipped, errors };
  },
  returns: v.object({
    migrated: v.number(),
    skipped: v.number(),
    errors: v.array(v.string()),
  }),
});

