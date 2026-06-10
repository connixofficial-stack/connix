import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { BUNDLE_VERSION, MIGRATION_MODULES, type BundleImportReport, type BundleManifest, type BundleMediaEntry, type BundleRecordIndexEntry, type MigrationBundlePayload, type MigrationModule } from "../lib/migration-bundle/types";
import { getExtensionFromMime, getMimeFromExtension, slugify } from "../lib/image/uploadNaming";

type MenuItemExport = {
  active: boolean;
  depth: number;
  icon?: string;
  label: string;
  menuLocation: string;
  openInNewTab?: boolean;
  order: number;
  parentPathKey?: string;
  pathKey: string;
  url: string;
};

type HomeComponentExport = {
  active: boolean;
  componentKey: string;
  config: unknown;
  mediaRefs: string[];
  order: number;
  title: string;
  type: string;
};

const DEFAULT_MODULES: MigrationModule[] = [...MIGRATION_MODULES];

const DEPENDENCIES: Record<MigrationModule, MigrationModule[]> = {
  settings: [],
  products: ["settings"],
  services: [],
  posts: [],
  menus: [],
  "home-components": ["products", "services", "posts"],
};

const normalizeModules = (modules?: string[]): MigrationModule[] => {
  if (!modules || modules.length === 0) {
    return [...DEFAULT_MODULES];
  }
  const picked = modules.filter((module): module is MigrationModule => (MIGRATION_MODULES as readonly string[]).includes(module));
  return Array.from(new Set(picked));
};

const ensureModuleSelection = (modules: MigrationModule[]) => {
  if (modules.length === 0) {
    throw new ConvexError({ code: "INVALID_MODULE_SELECTION", message: "Cần chọn ít nhất 1 module" });
  }
};

const toIso = (timestamp: number) => new Date(timestamp).toISOString();

const parseLogicalPathParts = (logicalPath: string) => {
  const clean = logicalPath.replaceAll("\\", "/").replace(/^\/+/, "");
  const parts = clean.split("/").filter(Boolean);
  return { clean, parts };
};

const extractExtensionFromPath = (value: string) => {
  const clean = value.split("?")[0]?.split("#")[0] ?? value;
  const lastPart = clean.split("/").pop() ?? "";
  if (!lastPart.includes(".")) {
    return undefined;
  }
  const ext = lastPart.split(".").pop();
  return ext ? ext.toLowerCase() : undefined;
};

const detectMimeFromUrl = (sourceUrl: string) => {
  const ext = extractExtensionFromPath(sourceUrl);
  return ext ? getMimeFromExtension(ext) : undefined;
};

const buildRecordIndexMap = () => {
  const map: Record<string, BundleRecordIndexEntry[]> = {};
  for (const moduleKey of MIGRATION_MODULES) {
    map[moduleKey] = [];
  }
  return map;
};

const addRecordIndex = (
  recordIndexMap: Record<string, BundleRecordIndexEntry[]>,
  moduleKey: MigrationModule,
  item: BundleRecordIndexEntry
) => {
  recordIndexMap[moduleKey].push(item);
};

const pushMediaEntry = (
  mediaEntries: BundleMediaEntry[],
  entry: BundleMediaEntry
) => {
  const exists = mediaEntries.find((item) => item.logicalPath === entry.logicalPath);
  if (exists) {
    const used = new Set([...exists.usedByRecordKeys, ...entry.usedByRecordKeys]);
    exists.usedByRecordKeys = Array.from(used);
    return;
  }
  mediaEntries.push(entry);
};

const extractUrls = (value: unknown, acc: Set<string>) => {
  if (typeof value === "string") {
    if (value.startsWith("http://") || value.startsWith("https://")) {
      acc.add(value);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => extractUrls(item, acc));
    return;
  }
  if (value && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach((item) => extractUrls(item, acc));
  }
};

const buildMediaLogicalPath = (
  module: MigrationModule,
  bucket: string,
  filenameBase: string,
  index: number,
  sourceUrl: string,
  mimeType?: string,
) => {
  const parsed = parseLogicalPathParts(sourceUrl);
  const lastPart = parsed.parts[parsed.parts.length - 1] || "file";
  const extFromUrl = extractExtensionFromPath(lastPart);
  const extFromMime = mimeType ? getExtensionFromMime(mimeType) : undefined;
  const ext = extFromUrl ?? extFromMime ?? "bin";
  return `media/${module}/${bucket}/${slugify(filenameBase || "item")}-${index + 1}.${ext}`;
};

const buildManifest = (modules: MigrationModule[], counts: Record<string, number>): BundleManifest => ({
  bundleVersion: BUNDLE_VERSION,
  exportedAt: toIso(Date.now()),
  sourceCoreVersion: "system-vietadmin-nextjs",
  selectedModules: modules,
  counts,
  capabilities: {
    supportsPartialImport: true,
    supportsMediaEmbed: true,
    supportsAutoDependencies: true,
    supportsStrictValidation: true,
    supportsChunkIndexes: true,
  },
});

const buildReadmeAgent = () => ({
  startHere: [
    "manifest.json",
    "README.agent.json",
    "index/modules.json",
    "reports/import-errors.json",
  ],
  stableKeys: {
    settings: ["settings:{group}:{key}", "moduleSettings:{moduleKey}:{settingKey}"],
    products: ["product:{sku}", "productCategory:{slug}", "productOption:{slug}", "productVariant:{sku}:{index}"],
    services: ["service:{slug}", "serviceCategory:{slug}"],
    posts: ["post:{slug}", "postCategory:{slug}"],
    menus: ["menu:{location}", "menuItem:{menuLocation}:{pathKey}"],
    "home-components": ["homeComponent:{type}:{titleSlug}:{orderHint}"],
  },
  importOrder: ["settings", "products", "services", "posts", "menus", "home-components"],
  repairHints: {
    MENU_PARENT_NOT_FOUND: "Kiểm tra parentPathKey trong modules/menus/menu-items.chunk-001.json",
    CATEGORY_NOT_FOUND: "Kiểm tra file categories của module tương ứng",
    MEDIA_FILE_MISSING: "Kiểm tra media.index.json và thư mục media/*",
    HOME_COMPONENT_REFERENCE_MISSING: "Kiểm tra config reference và module phụ thuộc đã import chưa",
  },
});

const ensureArray = <T>(value: unknown): T[] => (Array.isArray(value) ? value as T[] : []);

const buildMimeTypeByStorageId = (images: Array<Doc<"images">>) => {
  const map = new Map<string, string>();
  images.forEach((img) => map.set(img.storageId as string, img.mimeType));
  return map;
};

const buildMimeTypeByUrl = async (
  ctx: Parameters<typeof query>[0] extends never ? never : any,
  images: Array<Doc<"images">>,
) => {
  const entries = await Promise.all(images.map(async (img) => ({
    url: await ctx.storage.getUrl(img.storageId),
    mimeType: img.mimeType,
  })));
  const map = new Map<string, string>();
  entries.forEach((entry) => {
    if (entry.url) {
      map.set(entry.url, entry.mimeType);
    }
  });
  return map;
};

const collectProductMedia = (
  product: Doc<"products">,
  mediaEntries: BundleMediaEntry[],
  recordKey: string,
  mimeTypeByUrl?: Map<string, string>,
) => {
  const refs: string[] = [];
  const urls = [product.image, ...(product.images ?? [])].filter((item): item is string => Boolean(item));
  urls.forEach((url, index) => {
    const mimeType = mimeTypeByUrl?.get(url) ?? detectMimeFromUrl(url) ?? "application/octet-stream";
    const logicalPath = buildMediaLogicalPath("products", product.sku || product.slug, product.name, index, url, mimeType);
    refs.push(logicalPath);
    pushMediaEntry(mediaEntries, {
      logicalPath,
      originalUrl: url,
      mimeType,
      sourceModule: "products",
      usedByRecordKeys: [recordKey],
    });
  });
  return refs;
};

const collectSimpleMedia = (
  module: MigrationModule,
  sourceKey: string,
  value: unknown,
  mediaEntries: BundleMediaEntry[],
  recordKey: string,
  mimeTypeByUrl?: Map<string, string>,
) => {
  const refs: string[] = [];
  const urls = new Set<string>();
  extractUrls(value, urls);
  Array.from(urls).forEach((url, index) => {
    const mimeType = mimeTypeByUrl?.get(url) ?? detectMimeFromUrl(url) ?? "application/octet-stream";
    const logicalPath = buildMediaLogicalPath(module, sourceKey, sourceKey, index, url, mimeType);
    refs.push(logicalPath);
    pushMediaEntry(mediaEntries, {
      logicalPath,
      originalUrl: url,
      mimeType,
      sourceModule: module,
      usedByRecordKeys: [recordKey],
    });
  });
  return refs;
};

const toMenuPathKey = (label: string, parentPathKey?: string) => {
  const segment = slugify(label);
  return parentPathKey ? `${parentPathKey}/${segment}` : segment;
};

const buildMenuItemsExport = (menuLocation: string, items: Doc<"menuItems">[]) => {
  const sorted = [...items].sort((a, b) => a.order - b.order || a._creationTime - b._creationTime);
  const byId = new Map(sorted.map((item) => [item._id, item]));
  const byPath = new Map<Id<"menuItems">, string>();
  const output: MenuItemExport[] = [];

  sorted.forEach((item) => {
    const parent = item.parentId ? byId.get(item.parentId) : undefined;
    const parentPathKey = parent ? byPath.get(parent._id) : undefined;
    const pathKey = toMenuPathKey(item.label, parentPathKey);
    byPath.set(item._id, pathKey);
    output.push({
      active: item.active,
      depth: item.depth,
      icon: item.icon,
      label: item.label,
      menuLocation,
      openInNewTab: item.openInNewTab,
      order: item.order,
      parentPathKey,
      pathKey,
      url: item.url,
    });
  });

  return output;
};

const rewriteByUrlMap = (value: unknown, map: Record<string, { url: string; storageId?: string | null }>): unknown => {
  if (typeof value === "string") {
    const mapped = map[value];
    return mapped?.url ?? value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => rewriteByUrlMap(item, map));
  }
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
      result[key] = rewriteByUrlMap(item, map);
    });
    return result;
  }
  return value;
};

const resolveTargetModules = (
  mode: "full" | "partial",
  selected: MigrationModule[] | undefined,
  available: MigrationModule[],
) => {
  if (mode === "full") {
    return [...available];
  }
  const base = selected && selected.length > 0 ? selected : available;
  const withDeps = new Set<MigrationModule>();
  const visit = (module: MigrationModule) => {
    withDeps.add(module);
    (DEPENDENCIES[module] ?? []).forEach((dep) => visit(dep));
  };
  base.forEach((module) => visit(module));
  return Array.from(withDeps).filter((module) => available.includes(module));
};

const createIssue = (
  module: string,
  message: string,
  code: string,
  file?: string,
  recordKey?: string,
  jsonPath?: string,
) => ({
  code,
  severity: "blocking" as const,
  module,
  message,
  file,
  recordKey,
  jsonPath,
  suggestion: "Kiểm tra lại bundle hoặc chỉnh dữ liệu theo report",
});

const createWarning = (
  module: string,
  message: string,
  code: string,
  file?: string,
  recordKey?: string,
  jsonPath?: string,
) => ({
  code,
  severity: "warning" as const,
  module,
  message,
  file,
  recordKey,
  jsonPath,
});

const runPreflight = (
  payload: MigrationBundlePayload,
  mode: "full" | "partial",
  requestedModules?: MigrationModule[],
): { report: BundleImportReport; targetModules: MigrationModule[] } => {
  const errors: BundleImportReport["errors"] = [];
  const warnings: BundleImportReport["warnings"] = [];

  if (!payload.manifest || payload.manifest.bundleVersion !== BUNDLE_VERSION) {
    errors.push(createIssue("bundle", "Bundle version không tương thích", "UNSUPPORTED_BUNDLE_VERSION", "manifest.json"));
  }

  const availableModules = payload.manifest?.selectedModules ?? [];
  const targetModules = resolveTargetModules(mode, requestedModules, availableModules);

  if (targetModules.length === 0) {
    errors.push(createIssue("bundle", "Không có module hợp lệ để import", "NO_VALID_MODULES", "manifest.json"));
  }

  targetModules.forEach((module) => {
    if (!payload.modules?.[module]) {
      errors.push(createIssue(module, `Thiếu dữ liệu module ${module}`, "MODULE_DATA_MISSING", `modules/${module}`));
    }
  });

  const menuModule = payload.modules?.["menus"] as { menuItems?: MenuItemExport[] } | undefined;
  if (menuModule?.menuItems) {
    const pathSet = new Set(menuModule.menuItems.map((item) => item.pathKey));
    menuModule.menuItems.forEach((item, index) => {
      if (item.parentPathKey && !pathSet.has(item.parentPathKey)) {
        errors.push(createIssue(
          "menus",
          "Không tìm thấy parentPathKey để dựng tree menu",
          "MENU_PARENT_NOT_FOUND",
          "modules/menus/menu-items.chunk-001.json",
          `menuItem:${item.menuLocation}:${item.pathKey}`,
          `records[${index}].parentPathKey`,
        ));
      }
    });
  }

  const mediaIndex = ensureArray<BundleMediaEntry>(payload.index?.mediaIndex);
  const mediaPathSet = new Set(mediaIndex.map((entry) => entry.logicalPath));
  mediaIndex.forEach((entry) => {
    if (!entry.originalUrl || !entry.logicalPath) {
      errors.push(createIssue(entry.sourceModule, "Media index thiếu logicalPath hoặc originalUrl", "MEDIA_INDEX_INVALID", "index/media.index.json"));
    }
    if (entry.mimeType === "application/octet-stream") {
      warnings.push(createWarning(
        entry.sourceModule,
        "Media entry thiếu MIME cụ thể, sẽ dễ sinh .bin khi import",
        "MEDIA_MIME_GENERIC",
        "index/media.index.json",
        entry.logicalPath,
      ));
    }
    const ext = extractExtensionFromPath(entry.logicalPath);
    const mimeFromExt = ext ? getMimeFromExtension(ext) : undefined;
    if (mimeFromExt && entry.mimeType && mimeFromExt !== entry.mimeType) {
      warnings.push(createWarning(
        entry.sourceModule,
        `Extension không khớp MIME: ${ext} vs ${entry.mimeType}`,
        "MEDIA_MIME_EXTENSION_MISMATCH",
        "index/media.index.json",
        entry.logicalPath,
      ));
    }
  });

  const homeComponents = (payload.modules?.["home-components"] as { components?: HomeComponentExport[] } | undefined)?.components ?? [];
  homeComponents.forEach((component, index) => {
    component.mediaRefs.forEach((ref) => {
      if (!mediaPathSet.has(ref)) {
        warnings.push(createWarning(
          "home-components",
          `Media ref không có trong media.index: ${ref}`,
          "HOME_COMPONENT_MEDIA_REF_MISSING",
          "modules/home-components/components.chunk-001.json",
          component.componentKey,
          `records[${index}].mediaRefs`,
        ));
      }
    });
  });

  const report: BundleImportReport = {
    summary: {
      blocking: errors.length,
      warnings: warnings.length,
      modulesAffected: Array.from(new Set([...errors.map((item) => item.module), ...warnings.map((item) => item.module)])),
    },
    errors,
    warnings,
  };

  return { report, targetModules };
};

const stringifyCompositeKeyPart = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value === null || value === undefined) {
    return "";
  }
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
};

const upsertSettings = async (
  ctx: Parameters<typeof mutation>[0] extends never ? never : any,
  modulePayload: any,
) => {
  let created = 0;
  let updated = 0;

  const settings = ensureArray<{ group: string; key: string; value: unknown }>(modulePayload.settings);
  for (const item of settings) {
    const existing = await ctx.db.query("settings").withIndex("by_key", (q: any) => q.eq("key", item.key)).unique();
    if (existing) {
      await ctx.db.patch(existing._id, { group: item.group, value: item.value });
      updated += 1;
    } else {
      await ctx.db.insert("settings", { group: item.group, key: item.key, value: item.value });
      created += 1;
    }
  }

  const upsertByComposite = async (
    table: "moduleSettings" | "moduleFeatures" | "moduleFields",
    rows: Record<string, unknown>[],
    keyOf: (row: Record<string, unknown>) => string,
  ) => {
    for (const row of rows) {
      const key = keyOf(row);
      const existingRows = await ctx.db.query(table).take(10000);
      const existing = existingRows.find((item: Record<string, unknown>) => keyOf(item) === key);
      if (existing) {
        await ctx.db.patch(existing._id, row);
        updated += 1;
      } else {
        await ctx.db.insert(table, row);
        created += 1;
      }
    }
  };

  await upsertByComposite(
    "moduleSettings",
    ensureArray(modulePayload.moduleSettings),
    (row) => `${stringifyCompositeKeyPart(row.moduleKey)}:${stringifyCompositeKeyPart(row.settingKey)}`,
  );
  await upsertByComposite(
    "moduleFeatures",
    ensureArray(modulePayload.moduleFeatures),
    (row) => `${stringifyCompositeKeyPart(row.moduleKey)}:${stringifyCompositeKeyPart(row.featureKey)}`,
  );
  await upsertByComposite(
    "moduleFields",
    ensureArray(modulePayload.moduleFields),
    (row) => `${stringifyCompositeKeyPart(row.moduleKey)}:${stringifyCompositeKeyPart(row.fieldKey)}`,
  );

  return { created, updated };
};

export const exportBundle = query({
  args: {
    modules: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const modules = normalizeModules(args.modules);
    ensureModuleSelection(modules);

    const counts: Record<string, number> = {};
    const mediaEntries: BundleMediaEntry[] = [];
    const recordIndexMap = buildRecordIndexMap();
    const moduleData: Record<string, unknown> = {};
    const needsImageMime = modules.some((module) => ["products", "services", "posts"].includes(module));
    const images = needsImageMime ? await ctx.db.query("images").take(10000) : [];
    const mimeTypeByStorageId = needsImageMime ? buildMimeTypeByStorageId(images) : new Map<string, string>();
    const mimeTypeByUrlGlobal = needsImageMime ? await buildMimeTypeByUrl(ctx, images) : new Map<string, string>();

    if (modules.includes("settings")) {
      const [settings, moduleSettings, moduleFeatures, moduleFields] = await Promise.all([
        ctx.db.query("settings").take(5000),
        ctx.db.query("moduleSettings").take(5000),
        ctx.db.query("moduleFeatures").take(5000),
        ctx.db.query("moduleFields").take(5000),
      ]);
      moduleData.settings = {
        settings: settings.map((item) => ({ group: item.group, key: item.key, value: item.value })),
        moduleSettings: moduleSettings.map((item) => ({ moduleKey: item.moduleKey, settingKey: item.settingKey, value: item.value })),
        moduleFeatures: moduleFeatures.map((item) => ({ ...item })),
        moduleFields: moduleFields.map((item) => ({ ...item })),
      };
      counts.settings = settings.length + moduleSettings.length + moduleFeatures.length + moduleFields.length;

      settings.forEach((item, index) => {
        const recordKey = `settings:${item.group}:${item.key}`;
        const mediaRefs = collectSimpleMedia("settings", `${item.group}-${item.key}`, item.value, mediaEntries, recordKey);
        addRecordIndex(recordIndexMap, "settings", {
          recordKey,
          chunkFile: "modules/settings/settings.json",
          position: index,
          mediaRefs,
        });
      });
    }

    if (modules.includes("products")) {
      const [
        categories,
        products,
        options,
        optionValues,
        variants,
        supplementalContents,
      ] = await Promise.all([
        ctx.db.query("productCategories").take(5000),
        ctx.db.query("products").take(5000),
        ctx.db.query("productOptions").take(5000),
        ctx.db.query("productOptionValues").take(10000),
        ctx.db.query("productVariants").take(10000),
        ctx.db.query("productSupplementalContents").take(2000),
      ]);

      const categoryById = new Map(categories.map((item) => [item._id, item] as const));
      const optionById = new Map(options.map((item) => [item._id, item] as const));
      const optionValueById = new Map(optionValues.map((item) => [item._id, item] as const));

      const productsOut = products.map((item, index) => {
        const category = categoryById.get(item.categoryId);
        const recordKey = `product:${item.sku || item.slug}`;
        const mimeTypeByUrl = new Map<string, string>();
        if (item.image) {
          const mimeType = item.imageStorageId
            ? mimeTypeByStorageId.get(item.imageStorageId as string)
            : mimeTypeByUrlGlobal.get(item.image);
          if (mimeType) {
            mimeTypeByUrl.set(item.image, mimeType);
          }
        }
        const imagesList = item.images ?? [];
        const imageStorageIds = item.imageStorageIds ?? [];
        if (imagesList.length > 0 && imagesList.length === imageStorageIds.length) {
          imagesList.forEach((url, idx) => {
            const storageId = imageStorageIds[idx];
            if (!url || !storageId) {
              return;
            }
            const mimeType = mimeTypeByStorageId.get(storageId as string) ?? mimeTypeByUrlGlobal.get(url);
            if (mimeType) {
              mimeTypeByUrl.set(url, mimeType);
            }
          });
        } else if (imagesList.length > 0) {
          imagesList.forEach((url) => {
            const mimeType = mimeTypeByUrlGlobal.get(url);
            if (mimeType) {
              mimeTypeByUrl.set(url, mimeType);
            }
          });
        }
        const mediaRefs = collectProductMedia(item, mediaEntries, recordKey, mimeTypeByUrl);
        addRecordIndex(recordIndexMap, "products", {
          recordKey,
          chunkFile: "modules/products/products.chunk-001.json",
          position: index,
          dependencies: category ? [`productCategory:${category.slug}`] : [],
          mediaRefs,
        });
        return {
          affiliateLink: item.affiliateLink,
          categorySlug: category?.slug,
          description: item.description,
          digitalCredentialsTemplate: item.digitalCredentialsTemplate,
          digitalDeliveryType: item.digitalDeliveryType,
          hasVariants: item.hasVariants ?? false,
          image: item.image,
          images: item.images ?? [],
          imageStorageId: item.imageStorageId ?? null,
          imageStorageIds: item.imageStorageIds ?? [],
          markdownRender: item.markdownRender,
          htmlRender: item.htmlRender,
          metaDescription: item.metaDescription,
          metaTitle: item.metaTitle,
          name: item.name,
          optionSlugs: (item.optionIds ?? []).map((id) => optionById.get(id)?.slug).filter(Boolean),
          order: item.order,
          price: item.price,
          productType: item.productType,
          renderType: item.renderType,
          salePrice: item.salePrice,
          sku: item.sku,
          slug: item.slug,
          status: item.status,
          stock: item.stock,
          mediaRefs,
        };
      });

      const categoryOut = categories.map((item) => ({
        active: item.active,
        description: item.description,
        image: item.image,
        name: item.name,
        order: item.order,
        parentSlug: item.parentId ? categoryById.get(item.parentId)?.slug : undefined,
        slug: item.slug,
      }));

      const optionsOut = options.map((item) => ({
        active: item.active,
        compareUnit: item.compareUnit,
        displayType: item.displayType,
        inputType: item.inputType,
        isPreset: item.isPreset,
        name: item.name,
        order: item.order,
        showPriceCompare: item.showPriceCompare,
        slug: item.slug,
        unit: item.unit,
      }));

      const optionValuesOut = optionValues.map((item) => ({
        active: item.active,
        badge: item.badge,
        colorCode: item.colorCode,
        image: item.image,
        isLifetime: item.isLifetime,
        label: item.label,
        numericValue: item.numericValue,
        optionSlug: optionById.get(item.optionId)?.slug,
        order: item.order,
        value: item.value,
      }));

      const productById = new Map(products.map((item) => [item._id, item] as const));
      const variantsOut = variants.map((item) => ({
        allowBackorder: item.allowBackorder,
        barcode: item.barcode,
        image: item.image,
        images: item.images,
        optionValues: item.optionValues.map((entry) => ({
          customValue: entry.customValue,
          optionSlug: optionById.get(entry.optionId)?.slug,
          value: optionValueById.get(entry.valueId)?.value,
        })),
        order: item.order,
        price: item.price,
        productSku: productById.get(item.productId)?.sku,
        salePrice: item.salePrice,
        sku: item.sku,
        status: item.status,
        stock: item.stock,
      }));

      const supplementalOut = supplementalContents.map((item) => ({
        postContent: item.postContent,
        preContent: item.preContent,
      }));

      moduleData.products = {
        categories: categoryOut,
        products: productsOut,
        options: optionsOut,
        optionValues: optionValuesOut,
        variants: variantsOut,
        supplementalContents: supplementalOut,
      };

      counts.products = categoryOut.length + productsOut.length + optionsOut.length + optionValuesOut.length + variantsOut.length + supplementalOut.length;
    }

    if (modules.includes("services")) {
      const [categories, services] = await Promise.all([
        ctx.db.query("serviceCategories").take(5000),
        ctx.db.query("services").take(5000),
      ]);
      const categoryById = new Map(categories.map((item) => [item._id, item] as const));
      const categoryOut = categories.map((item) => ({
        active: item.active,
        description: item.description,
        name: item.name,
        order: item.order,
        parentSlug: item.parentId ? categoryById.get(item.parentId)?.slug : undefined,
        slug: item.slug,
        thumbnail: item.thumbnail,
      }));
      const servicesOut = services.map((item, index) => {
        const category = categoryById.get(item.categoryId);
        const recordKey = `service:${item.slug}`;
        const mimeTypeByUrl = new Map<string, string>();
        if (item.thumbnail) {
          const mimeType = item.thumbnailStorageId
            ? mimeTypeByStorageId.get(item.thumbnailStorageId as string)
            : mimeTypeByUrlGlobal.get(item.thumbnail);
          if (mimeType) {
            mimeTypeByUrl.set(item.thumbnail, mimeType);
          }
        }
        const mediaRefs = collectSimpleMedia("services", item.slug, item, mediaEntries, recordKey, mimeTypeByUrl);
        addRecordIndex(recordIndexMap, "services", {
          recordKey,
          chunkFile: "modules/services/services.chunk-001.json",
          position: index,
          dependencies: category ? [`serviceCategory:${category.slug}`] : [],
          mediaRefs,
        });
        return {
          categorySlug: category?.slug,
          content: item.content,
          duration: item.duration,
          excerpt: item.excerpt,
          featured: item.featured,
          markdownRender: item.markdownRender,
          htmlRender: item.htmlRender,
          metaDescription: item.metaDescription,
          metaTitle: item.metaTitle,
          order: item.order,
          price: item.price,
          publishedAt: item.publishedAt,
          renderType: item.renderType,
          slug: item.slug,
          status: item.status,
          thumbnail: item.thumbnail,
          thumbnailStorageId: item.thumbnailStorageId ?? null,
          title: item.title,
          views: item.views,
          mediaRefs,
        };
      });

      moduleData.services = { categories: categoryOut, services: servicesOut };
      counts.services = categoryOut.length + servicesOut.length;
    }

    if (modules.includes("posts")) {
      const [categories, posts] = await Promise.all([
        ctx.db.query("postCategories").take(5000),
        ctx.db.query("posts").take(5000),
      ]);
      const categoryById = new Map(categories.map((item) => [item._id, item] as const));
      const categoryOut = categories.map((item) => ({
        active: item.active,
        description: item.description,
        name: item.name,
        order: item.order,
        parentSlug: item.parentId ? categoryById.get(item.parentId)?.slug : undefined,
        slug: item.slug,
        thumbnail: item.thumbnail,
      }));
      const postsOut = posts.map((item, index) => {
        const category = categoryById.get(item.categoryId);
        const recordKey = `post:${item.slug}`;
        const mimeTypeByUrl = new Map<string, string>();
        if (item.thumbnail) {
          const mimeType = item.thumbnailStorageId
            ? mimeTypeByStorageId.get(item.thumbnailStorageId as string)
            : mimeTypeByUrlGlobal.get(item.thumbnail);
          if (mimeType) {
            mimeTypeByUrl.set(item.thumbnail, mimeType);
          }
        }
        const mediaRefs = collectSimpleMedia("posts", item.slug, item, mediaEntries, recordKey, mimeTypeByUrl);
        addRecordIndex(recordIndexMap, "posts", {
          recordKey,
          chunkFile: "modules/posts/posts.chunk-001.json",
          position: index,
          dependencies: category ? [`postCategory:${category.slug}`] : [],
          mediaRefs,
        });
        return {
          authorName: item.authorName,
          categorySlug: category?.slug,
          content: item.content,
          excerpt: item.excerpt,
          markdownRender: item.markdownRender,
          htmlRender: item.htmlRender,
          metaDescription: item.metaDescription,
          metaTitle: item.metaTitle,
          order: item.order,
          publishedAt: item.publishedAt,
          renderType: item.renderType,
          slug: item.slug,
          status: item.status,
          thumbnail: item.thumbnail,
          thumbnailStorageId: item.thumbnailStorageId ?? null,
          title: item.title,
          views: item.views,
          mediaRefs,
        };
      });

      moduleData.posts = { categories: categoryOut, posts: postsOut };
      counts.posts = categoryOut.length + postsOut.length;
    }

    if (modules.includes("menus")) {
      const menus = await ctx.db.query("menus").take(200);
      const menuItems = await ctx.db.query("menuItems").take(5000);
      const itemsByMenu = new Map<Id<"menus">, Doc<"menuItems">[]>();
      menuItems.forEach((item) => {
        const list = itemsByMenu.get(item.menuId) ?? [];
        list.push(item);
        itemsByMenu.set(item.menuId, list);
      });

      const menusOut = menus.map((menu) => ({ location: menu.location, name: menu.name }));
      const itemsOut: MenuItemExport[] = [];

      menus.forEach((menu) => {
        const entries = buildMenuItemsExport(menu.location, itemsByMenu.get(menu._id) ?? []);
        entries.forEach((entry, index) => {
          const recordKey = `menuItem:${entry.menuLocation}:${entry.pathKey}`;
          addRecordIndex(recordIndexMap, "menus", {
            recordKey,
            chunkFile: "modules/menus/menu-items.chunk-001.json",
            position: itemsOut.length + index,
            dependencies: entry.parentPathKey ? [`menuItem:${entry.menuLocation}:${entry.parentPathKey}`] : [],
          });
        });
        itemsOut.push(...entries);
      });

      moduleData.menus = {
        menus: menusOut,
        menuItems: itemsOut,
      };

      counts.menus = menusOut.length + itemsOut.length;
    }

    if (modules.includes("home-components")) {
      const components = await ctx.db.query("homeComponents").take(5000);
      const ordered = [...components].sort((a, b) => a.order - b.order || a._creationTime - b._creationTime);
      const componentsOut: HomeComponentExport[] = ordered.map((item, index) => {
        const titleSlug = slugify(item.title);
        const componentKey = `homeComponent:${item.type}:${titleSlug}:${item.order}`;
        const mediaRefs = collectSimpleMedia("home-components", `${item.type}-${item.title}`, item.config, mediaEntries, componentKey);
        addRecordIndex(recordIndexMap, "home-components", {
          recordKey: componentKey,
          chunkFile: "modules/home-components/components.chunk-001.json",
          position: index,
          mediaRefs,
          configPointers: ["config.image", "config.backgroundImage", "config.logo", "config.slides[*].image"],
        });
        return {
          active: item.active,
          componentKey,
          config: item.config,
          mediaRefs,
          order: item.order,
          title: item.title,
          type: item.type,
        };
      });

      moduleData["home-components"] = {
        components: componentsOut,
        componentOrder: componentsOut.map((item) => item.componentKey),
      };

      counts["home-components"] = componentsOut.length;
    }

    const payload: MigrationBundlePayload = {
      manifest: buildManifest(modules, counts),
      readmeAgent: buildReadmeAgent(),
      index: {
        modules,
        dependencies: DEPENDENCIES,
        mediaIndex: mediaEntries,
        records: recordIndexMap,
      },
      modules: moduleData,
    };

    return payload;
  },
  returns: v.any(),
});

export const preflightBundle = mutation({
  args: {
    mode: v.union(v.literal("full"), v.literal("partial")),
    payload: v.any(),
    selectedModules: v.optional(v.array(v.string())),
  },
  handler: async (_ctx, args) => {
    const payload = args.payload as MigrationBundlePayload;
    const selected = normalizeModules(args.selectedModules);
    const { report, targetModules } = runPreflight(payload, args.mode, selected);

    return {
      report,
      targetModules,
    };
  },
  returns: v.object({
    report: v.any(),
    targetModules: v.array(v.string()),
  }),
});

export const importBundle = mutation({
  args: {
    mode: v.union(v.literal("full"), v.literal("partial")),
    payload: v.any(),
    selectedModules: v.optional(v.array(v.string())),
    uploadedMediaMap: v.optional(v.record(v.string(), v.object({
      url: v.string(),
      storageId: v.optional(v.union(v.string(), v.null())),
    }))),
  },
  handler: async (ctx, args) => {
    const payload = args.payload as MigrationBundlePayload;
    const selected = normalizeModules(args.selectedModules);
    const { report, targetModules } = runPreflight(payload, args.mode, selected);

    if (report.summary.blocking > 0) {
      return {
        applied: false,
        report,
        result: { created: 0, updated: 0 },
      };
    }

    const mediaMap = args.uploadedMediaMap ?? {};
    let created = 0;
    let updated = 0;

    if (targetModules.includes("settings")) {
      const modulePayload = payload.modules.settings as any;
      if (modulePayload) {
        const rewritten = {
          ...modulePayload,
          settings: ensureArray(modulePayload.settings).map((item: any) => ({
            ...item,
            value: rewriteByUrlMap(item.value, mediaMap),
          })),
        };
        const result = await upsertSettings(ctx as any, rewritten);
        created += result.created;
        updated += result.updated;
      }
    }

    const importCategoryTree = async (
      table: "productCategories" | "serviceCategories" | "postCategories",
      categories: Array<{ slug: string; parentSlug?: string; [k: string]: unknown }>,
    ) => {
      const idBySlug = new Map<string, Id<any>>();
      for (const category of categories) {
        const existing = await ctx.db.query(table as any).withIndex("by_slug", (q: any) => q.eq("slug", category.slug)).unique();
        const payloadRow = {
          ...category,
          parentId: undefined,
        } as Record<string, unknown>;
        delete payloadRow.parentSlug;
        if (existing) {
          await ctx.db.patch(existing._id, payloadRow);
          updated += 1;
          idBySlug.set(category.slug, existing._id);
        } else {
          const inserted = await ctx.db.insert(table as any, payloadRow);
          created += 1;
          idBySlug.set(category.slug, inserted);
        }
      }
      for (const category of categories) {
        if (!category.parentSlug) {continue;}
        const id = idBySlug.get(category.slug);
        const parentId = idBySlug.get(category.parentSlug);
        if (id && parentId) {
          await ctx.db.patch(id as any, { parentId });
        }
      }
      return idBySlug;
    };

    if (targetModules.includes("products")) {
      const modulePayload = payload.modules.products as any;
      if (modulePayload) {
        const categoryIdBySlug = await importCategoryTree("productCategories", ensureArray(modulePayload.categories));

        const options = ensureArray<any>(modulePayload.options);
        const optionValues = ensureArray<any>(modulePayload.optionValues);
        const variants = ensureArray<any>(modulePayload.variants);

        const optionIdBySlug = new Map<string, Id<"productOptions">>();
        for (const option of options) {
          const existing = await ctx.db.query("productOptions").withIndex("by_slug", (q) => q.eq("slug", option.slug)).unique();
          if (existing) {
            await ctx.db.patch(existing._id, option);
            updated += 1;
            optionIdBySlug.set(option.slug, existing._id);
          } else {
            const inserted = await ctx.db.insert("productOptions", option);
            created += 1;
            optionIdBySlug.set(option.slug, inserted);
          }
        }

        const optionValueIdByKey = new Map<string, Id<"productOptionValues">>();
        for (const value of optionValues) {
          const optionId = optionIdBySlug.get(value.optionSlug);
          if (!optionId) {continue;}
          const existingCandidates = await ctx.db.query("productOptionValues").withIndex("by_option", (q) => q.eq("optionId", optionId)).collect();
          const existing = existingCandidates.find((item) => item.value === value.value);
          const payloadRow = {
            ...value,
            optionId,
          } as any;
          delete payloadRow.optionSlug;
          payloadRow.image = rewriteByUrlMap(payloadRow.image, mediaMap);

          if (existing) {
            await ctx.db.patch(existing._id, payloadRow);
            updated += 1;
            optionValueIdByKey.set(`${value.optionSlug}:${value.value}`, existing._id);
          } else {
            const inserted = await ctx.db.insert("productOptionValues", payloadRow);
            created += 1;
            optionValueIdByKey.set(`${value.optionSlug}:${value.value}`, inserted);
          }
        }

        const productIdBySku = new Map<string, Id<"products">>();
        for (const product of ensureArray<any>(modulePayload.products)) {
          const categoryId = categoryIdBySlug.get(product.categorySlug);
          if (!categoryId) {continue;}
          const existingBySku = await ctx.db.query("products").withIndex("by_sku", (q) => q.eq("sku", product.sku)).unique();
          const existingBySlug = await ctx.db.query("products").withIndex("by_slug", (q) => q.eq("slug", product.slug)).unique();
          const existing = existingBySku ?? existingBySlug;

          const payloadRow: Record<string, unknown> = {
            affiliateLink: product.affiliateLink,
            categoryId,
            description: product.description,
            digitalCredentialsTemplate: rewriteByUrlMap(product.digitalCredentialsTemplate, mediaMap),
            digitalDeliveryType: product.digitalDeliveryType,
            hasVariants: product.hasVariants,
            image: rewriteByUrlMap(product.image, mediaMap),
            images: rewriteByUrlMap(product.images ?? [], mediaMap),
            imageStorageId: null,
            imageStorageIds: [],
            markdownRender: product.markdownRender,
            htmlRender: product.htmlRender,
            metaDescription: product.metaDescription,
            metaTitle: product.metaTitle,
            name: product.name,
            optionIds: ensureArray<string>(product.optionSlugs).map((slug) => optionIdBySlug.get(slug)).filter(Boolean),
            order: product.order,
            price: product.price,
            productType: product.productType,
            renderType: product.renderType,
            salePrice: product.salePrice,
            sku: product.sku,
            slug: product.slug,
            status: product.status,
            stock: product.stock,
            sales: product.sales ?? 0,
          };

          if (existing) {
            await ctx.db.patch(existing._id, payloadRow);
            updated += 1;
            productIdBySku.set(product.sku, existing._id);
          } else {
            const inserted = await ctx.db.insert("products", payloadRow as any);
            created += 1;
            productIdBySku.set(product.sku, inserted);
          }
        }

        for (const variant of variants) {
          const productId = productIdBySku.get(variant.productSku);
          if (!productId) {continue;}
          const existing = await ctx.db.query("productVariants").withIndex("by_sku", (q) => q.eq("sku", variant.sku)).unique();
          const payloadRow = {
            allowBackorder: variant.allowBackorder,
            barcode: variant.barcode,
            image: rewriteByUrlMap(variant.image, mediaMap),
            images: rewriteByUrlMap(variant.images ?? [], mediaMap),
            optionValues: ensureArray<any>(variant.optionValues).map((item) => ({
              customValue: item.customValue,
              optionId: optionIdBySlug.get(item.optionSlug)!,
              valueId: optionValueIdByKey.get(`${item.optionSlug}:${item.value}`)!,
            })).filter((item) => item.optionId && item.valueId),
            order: variant.order,
            price: variant.price,
            productId,
            salePrice: variant.salePrice,
            sku: variant.sku,
            status: variant.status,
            stock: variant.stock,
          };
          if (existing) {
            await ctx.db.patch(existing._id, payloadRow as any);
            updated += 1;
          } else {
            await ctx.db.insert("productVariants", payloadRow as any);
            created += 1;
          }
        }



        const supplementalArray = ensureArray<any>(modulePayload.supplementalContents);
        if (supplementalArray.length > 0) {
          const content = supplementalArray[0];
          const existingCandidates = await ctx.db.query("productSupplementalContents").collect();
          const payloadRow = {
            postContent: rewriteByUrlMap(content.postContent, mediaMap) as string | undefined,
            preContent: rewriteByUrlMap(content.preContent, mediaMap) as string | undefined,
          };
          if (existingCandidates.length > 0) {
            const first = existingCandidates[0];
            await ctx.db.patch(first._id, payloadRow);
            updated += 1;
            for (let i = 1; i < existingCandidates.length; i++) {
              await ctx.db.delete(existingCandidates[i]._id);
            }
          } else {
            await ctx.db.insert("productSupplementalContents", payloadRow);
            created += 1;
          }
        }
      }
    }

    const importServicesOrPosts = async (
      module: "services" | "posts",
      categoryTable: "serviceCategories" | "postCategories",
      contentTable: "services" | "posts",
      categoryRows: Array<any>,
      contentRows: Array<any>,
      contentKey: "title" | "slug",
    ) => {
      const categoryIdBySlug = await importCategoryTree(categoryTable, categoryRows);
      for (const row of contentRows) {
        const categoryId = categoryIdBySlug.get(row.categorySlug);
        if (!categoryId) {continue;}
        const existing = await ctx.db.query(contentTable as any).withIndex("by_slug", (q: any) => q.eq("slug", row.slug)).unique();
        const payloadRow: Record<string, unknown> = {
          ...row,
          categoryId,
        };
        delete payloadRow.categorySlug;
        payloadRow.thumbnail = rewriteByUrlMap(row.thumbnail, mediaMap);
        payloadRow.thumbnailStorageId = null;
        payloadRow.content = rewriteByUrlMap(row.content, mediaMap);
        payloadRow.excerpt = rewriteByUrlMap(row.excerpt, mediaMap);
        if (!Object.prototype.hasOwnProperty.call(payloadRow, "views")) {
          payloadRow.views = 0;
        }
        if (existing) {
          await ctx.db.patch(existing._id, payloadRow as any);
          updated += 1;
        } else {
          await ctx.db.insert(contentTable as any, payloadRow as any);
          created += 1;
        }
        void contentKey;
      }
    };

    if (targetModules.includes("services")) {
      const modulePayload = payload.modules.services as any;
      if (modulePayload) {
        await importServicesOrPosts(
          "services",
          "serviceCategories",
          "services",
          ensureArray(modulePayload.categories),
          ensureArray(modulePayload.services),
          "slug",
        );
      }
    }

    if (targetModules.includes("posts")) {
      const modulePayload = payload.modules.posts as any;
      if (modulePayload) {
        await importServicesOrPosts(
          "posts",
          "postCategories",
          "posts",
          ensureArray(modulePayload.categories),
          ensureArray(modulePayload.posts),
          "slug",
        );
      }
    }

    if (targetModules.includes("menus")) {
      const modulePayload = payload.modules.menus as any;
      if (modulePayload) {
        const menus = ensureArray<{ location: string; name: string }>(modulePayload.menus);
        const menuItems = ensureArray<MenuItemExport>(modulePayload.menuItems);

        for (const menu of menus) {
          let menuDoc = await ctx.db.query("menus").withIndex("by_location", (q) => q.eq("location", menu.location)).unique();
          if (menuDoc) {
            await ctx.db.patch(menuDoc._id, { name: menu.name, location: menu.location });
            updated += 1;
          } else {
            const inserted = await ctx.db.insert("menus", menu);
            created += 1;
            menuDoc = await ctx.db.get(inserted);
          }
          if (!menuDoc) {continue;}

          const existingItems = await ctx.db.query("menuItems").withIndex("by_menu_order", (q) => q.eq("menuId", menuDoc._id)).collect();
          for (const item of existingItems) {
            await ctx.db.delete(item._id);
          }

          const rows = menuItems.filter((item) => item.menuLocation === menu.location).sort((a, b) => a.order - b.order);
          const idByPath = new Map<string, Id<"menuItems">>();
          for (const row of rows) {
            const parentId = row.parentPathKey ? idByPath.get(row.parentPathKey) : undefined;
            const insertedId = await ctx.db.insert("menuItems", {
              active: row.active,
              depth: row.depth,
              icon: row.icon,
              label: row.label,
              menuId: menuDoc._id,
              openInNewTab: row.openInNewTab,
              order: row.order,
              parentId,
              url: row.url,
            });
            created += 1;
            idByPath.set(row.pathKey, insertedId);
          }
        }
      }
    }

    if (targetModules.includes("home-components")) {
      const modulePayload = payload.modules["home-components"] as any;
      if (modulePayload) {
        const components = ensureArray<HomeComponentExport>(modulePayload.components).map((item) => ({
          ...item,
          config: rewriteByUrlMap(item.config, mediaMap),
        }));

        for (const component of components) {
          const titleSlug = slugify(component.title);
          const existingCandidates = await ctx.db.query("homeComponents").withIndex("by_type", (q) => q.eq("type", component.type)).collect();
          const existing = existingCandidates.find((item) => slugify(item.title) === titleSlug && item.order === component.order);
          const payloadRow = {
            active: component.active,
            config: component.config,
            order: component.order,
            title: component.title,
            type: component.type,
          };
          if (existing) {
            await ctx.db.patch(existing._id, payloadRow);
            updated += 1;
          } else {
            await ctx.db.insert("homeComponents", payloadRow);
            created += 1;
          }
        }

        const orderKeys = ensureArray<string>(modulePayload.componentOrder);
        if (orderKeys.length > 0) {
          const all = await ctx.db.query("homeComponents").take(5000);
          const keyToId = new Map<string, Id<"homeComponents">>();
          all.forEach((item) => {
            const key = `homeComponent:${item.type}:${slugify(item.title)}:${item.order}`;
            keyToId.set(key, item._id);
          });
          let order = 0;
          for (const key of orderKeys) {
            const id = keyToId.get(key);
            if (!id) {continue;}
            await ctx.db.patch(id, { order });
            order += 1;
          }
        }
      }
    }

    return {
      applied: true,
      report,
      result: { created, updated },
    };
  },
  returns: v.object({
    applied: v.boolean(),
    report: v.any(),
    result: v.object({
      created: v.number(),
      updated: v.number(),
    }),
  }),
});
