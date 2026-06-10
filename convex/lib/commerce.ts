import type { MutationCtx, QueryCtx } from "../_generated/server";

export type CommerceProviderKey = "products" | "services" | "courses" | "resources";
export type CommerceMode = "off" | "cart" | "contact" | "affiliate";

export type CommerceProviderCapability = {
  provider: CommerceProviderKey;
  moduleEnabled: boolean;
  commerceMode: CommerceMode;
  cartCapable: boolean;
  contactCapable: boolean;
  affiliateCapable: boolean;
};

export type CommerceCapabilities = {
  providers: CommerceProviderCapability[];
  cartEnabled: boolean;
  ordersEnabled: boolean;
  hasCartProvider: boolean;
  cartAvailable: boolean;
};

type CommerceCtx = QueryCtx | MutationCtx;

const PROVIDERS: CommerceProviderKey[] = ["products", "services", "courses", "resources"];

const normalizeCommerceMode = (value: unknown, fallback: CommerceMode): CommerceMode => {
  if (value === "cart" || value === "contact" || value === "affiliate" || value === "off") {
    return value;
  }
  return fallback;
};

async function getModuleEnabled(ctx: CommerceCtx, key: string) {
  const moduleItem = await ctx.db
    .query("adminModules")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique();
  return moduleItem?.enabled ?? false;
}

async function getModuleSetting(ctx: CommerceCtx, moduleKey: string, settingKey: string) {
  return ctx.db
    .query("moduleSettings")
    .withIndex("by_module_setting", (q) => q.eq("moduleKey", moduleKey).eq("settingKey", settingKey))
    .unique();
}

async function getProviderMode(ctx: CommerceCtx, provider: CommerceProviderKey): Promise<CommerceMode> {
  if (provider === "products") {
    const setting = await getModuleSetting(ctx, "products", "saleMode");
    return normalizeCommerceMode(setting?.value, "cart");
  }

  const setting = await getModuleSetting(ctx, provider, "commerceMode");
  return normalizeCommerceMode(setting?.value, "contact");
}

export async function getCommerceCapabilities(ctx: CommerceCtx): Promise<CommerceCapabilities> {
  const [cartEnabled, ordersEnabled, providerRows] = await Promise.all([
    getModuleEnabled(ctx, "cart"),
    getModuleEnabled(ctx, "orders"),
    Promise.all(PROVIDERS.map(async (provider) => {
      const [moduleEnabled, commerceMode] = await Promise.all([
        getModuleEnabled(ctx, provider),
        getProviderMode(ctx, provider),
      ]);

      return {
        provider,
        moduleEnabled,
        commerceMode: moduleEnabled ? commerceMode : "off",
        cartCapable: moduleEnabled && commerceMode === "cart",
        contactCapable: moduleEnabled && commerceMode === "contact",
        affiliateCapable: moduleEnabled && commerceMode === "affiliate",
      } satisfies CommerceProviderCapability;
    })),
  ]);

  const hasCartProvider = providerRows.some((provider) => provider.cartCapable);

  return {
    providers: providerRows,
    cartEnabled,
    ordersEnabled,
    hasCartProvider,
    cartAvailable: cartEnabled && ordersEnabled && hasCartProvider,
  };
}

export async function isProviderCartCapable(ctx: CommerceCtx, provider: CommerceProviderKey) {
  const capabilities = await getCommerceCapabilities(ctx);
  return capabilities.providers.some((item) => item.provider === provider && item.cartCapable)
    && capabilities.cartAvailable;
}
