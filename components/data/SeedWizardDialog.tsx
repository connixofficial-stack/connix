'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAction, useConvex, useMutation, useQuery } from 'convex/react';
import { Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/convex/_generated/api';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/admin/components/ui';
import { DEFAULT_VARIANT_PRESET_KEY } from '@/lib/modules/variant-presets';
import { WizardProgress } from './seed-wizard/WizardProgress';
import { WebsiteTypeStep } from './seed-wizard/steps/WebsiteTypeStep';
import { IndustrySelectionStep } from './seed-wizard/steps/IndustrySelectionStep';
import { LogoSelectionStep } from './seed-wizard/steps/LogoSelectionStep';
import { ExtraFeaturesStep } from './seed-wizard/steps/ExtraFeaturesStep';
import { SaleModeStep } from './seed-wizard/steps/SaleModeStep';
import { ProductTypeStep } from './seed-wizard/steps/ProductTypeStep';
import { ProductVariantsStep } from './seed-wizard/steps/ProductVariantsStep';
import { ProductEnhancementsStep } from './seed-wizard/steps/ProductEnhancementsStep';
import { BusinessInfoStep } from './seed-wizard/steps/BusinessInfoStep';
import { AdminConfigStep } from './seed-wizard/steps/AdminConfigStep';
import { AdminPermissionModeStep } from './seed-wizard/steps/AdminPermissionModeStep';
import { ExperiencePresetStep } from './seed-wizard/steps/ExperiencePresetStep';
import { QuickConfigStep } from './seed-wizard/steps/QuickConfigStep';
import { DataScaleStep } from './seed-wizard/steps/DataScaleStep';
import { ReviewStep } from './seed-wizard/steps/ReviewStep';
import {
  buildModuleSelection,
  buildSeedConfigs,
  getBaseModules,
  getScaleSummary,
} from './seed-wizard/wizard-presets';
import { getIndustryTemplate } from '@/lib/seed-templates';
import {
  getDefaultExperiencePresetKey,
  getExperiencePreset,
  getExperiencePresets,
} from './seed-wizard/experience-presets';
import { DEFAULT_ORDER_STATUS_PRESET, ORDER_STATUS_PRESETS } from '@/lib/orders/statuses';
import { getIndustryBestPracticePalette } from '@/lib/seed-color-fallback';
import type {
  AdminConfig,
  AdminPermissionMode,
  BusinessInfo,
  DigitalDeliveryType,
  ExperiencePresetKey,
  ProductType,
  QuickConfig,
  SaleMode,
  WizardState,
} from './seed-wizard/types';

type SeedWizardDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
};

const DEFAULT_BUSINESS_INFO: BusinessInfo = {
  address: '',
  brandColor: '#3b82f6',
  brandMode: 'dual',
  brandSecondary: '',
  businessType: 'LocalBusiness',
  email: 'contact@example.com',
  faviconUrl: '',
  ogImageUrl: '',
  openingHours: 'Mo-Su 08:00-22:00',
  phone: '',
  siteName: 'Website',
  socialFacebook: '',
  tagline: '',
  useLogoAsOgImage: true,
};

const DEFAULT_QUICK_CONFIG: QuickConfig = {
  commentsDefaultStatus: 'Pending',
  lowStockThreshold: 10,
  orderStatusPreset: 'standard',
  ordersPerPage: 20,
  postsDefaultStatus: 'draft',
  postsPerPage: 10,
  productsDefaultStatus: 'Draft',
  productsPerPage: 12,
};

const DEFAULT_ADMIN_CONFIG: AdminConfig = {
  email: '',
  password: '',
};

const DEFAULT_STATE: WizardState = {
  adminConfig: DEFAULT_ADMIN_CONFIG,
  adminPermissionMode: 'simple_full_admin',
  businessInfo: DEFAULT_BUSINESS_INFO,
  customerLoginEnabled: true,
  customerLoginManuallySet: false,
  clearBeforeSeed: true,
  dataScale: 'medium',
  digitalDeliveryType: 'account',
  experiencePresetKey: getDefaultExperiencePresetKey('landing') as ExperiencePresetKey,
  extraFeatures: new Set(),
  industryKey: null,
  logoCustomized: false,
  productType: 'physical',
  quickConfig: DEFAULT_QUICK_CONFIG,
  quickConfigSkipped: false,
  saleMode: 'cart',
  selectedLogo: null,
  useSeedMauImages: true,
  variantEnabled: false,
  variantImages: 'inherit',
  variantPresetKey: DEFAULT_VARIANT_PRESET_KEY,
  variantPricing: 'variant',
  variantStock: 'variant',
  productFramesEnabled: false,
  productSupplementalContentEnabled: false,
  websiteType: 'landing',
};

const DIGITAL_TEMPLATE_MAP: Record<DigitalDeliveryType, Record<string, string>> = {
  account: { password: 'password123', username: 'user@example.com' },
  custom: { customContent: 'Thông tin giao hàng số sẽ được gửi sau khi thanh toán.' },
  download: { downloadUrl: 'https://example.com/download/sample.zip' },
  license: { licenseKey: 'XXXX-YYYY-ZZZZ-1234' },
};

export function SeedWizardDialog({ open, onOpenChange, onComplete }: SeedWizardDialogProps) {
  const [state, setState] = useState<WizardState>(DEFAULT_STATE);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSeeding, setIsSeeding] = useState(false);
  const industryTemplate = useMemo(() => getIndustryTemplate(state.industryKey), [state.industryKey]);
  const industryPalette = useMemo(
    () => getIndustryBestPracticePalette(industryTemplate),
    [industryTemplate]
  );

  const convex = useConvex();
  const productsList = useQuery(api.products.listAll, { limit: 200 });
  const productsRef = useRef(productsList ?? []);

  const seedBulk = useMutation(api.seedManager.seedBulk);
  const clearAll = useMutation(api.seedManager.clearAll);
  const clearModule = useMutation(api.seedManager.clearModule);
  const clearProductVariantData = useMutation(api.seedManager.clearProductVariantData);
  const seedAllModulesConfig = useAction(api.seed.seedAllModulesConfig);
  const setModuleSetting = useMutation(api.admin.modules.setModuleSetting);
  const createModuleFeature = useMutation(api.admin.modules.createModuleFeature);
  const toggleModuleFeature = useMutation(api.admin.modules.toggleModuleFeature);
  const setSettings = useMutation(api.settings.setMultiple);
  const toggleModuleWithCascade = useMutation(api.admin.modules.toggleModuleWithCascade);
  const updateProduct = useMutation(api.products.update);
  const ensureSuperAdmin = useMutation(api.auth.ensureSuperAdminCredentials);

  const settingsFeatureDefaults: Record<string, { description: string; name: string; enabled: boolean }> = {
    enableContact: {
      description: 'Quản lý email, phone, địa chỉ',
      enabled: true,
      name: 'Thông tin liên hệ',
    },
    enableSEO: {
      description: 'Meta title, description, keywords',
      enabled: true,
      name: 'SEO cơ bản',
    },
    enableSocial: {
      description: 'Links Facebook, Instagram, Youtube...',
      enabled: true,
      name: 'Mạng xã hội',
    },
  };

  const customerFeatureDefaults: Record<string, { description: string; name: string; enabled: boolean; linkedFieldKey?: string }> = {
    enableLogin: {
      description: 'Cho phép khách hàng tạo tài khoản và đăng nhập',
      enabled: false,
      linkedFieldKey: 'password',
      name: 'Đăng nhập KH',
    },
  };

  const ensureModuleFeature = async (
    moduleKey: string,
    featureKey: string,
    payload: { description: string; name: string; enabled: boolean; linkedFieldKey?: string }
  ) => {
    const existing = await convex.query(api.admin.modules.getModuleFeature, { featureKey, moduleKey });
    if (existing) {
      return true;
    }

    try {
      await createModuleFeature({
        description: payload.description,
        enabled: payload.enabled,
        featureKey,
        linkedFieldKey: payload.linkedFieldKey,
        moduleKey,
        name: payload.name,
      });
      return true;
    } catch (error) {
      console.error(`[SeedWizard] Không thể tạo feature ${featureKey} cho ${moduleKey}:`, error);
      toast.error(`Không thể tạo feature ${featureKey} cho ${moduleKey}.`);
      return false;
    }
  };

  useEffect(() => {
    if (productsList) {
      productsRef.current = productsList;
    }
  }, [productsList]);

  const selectedModules = useMemo(() => buildModuleSelection(state), [state]);
  const modulesForEnable = useMemo(() => {
    if (state.adminPermissionMode !== 'simple_full_admin') {
      return selectedModules;
    }
    return selectedModules.filter((moduleKey) => moduleKey !== 'roles');
  }, [selectedModules, state.adminPermissionMode]);
  const baseModules = useMemo(() => getBaseModules(state.websiteType), [state.websiteType]);
  const hasProducts = selectedModules.includes('products');
  const hasPosts = selectedModules.includes('posts');
  const hasServices = selectedModules.includes('services');
  const hasOrders = selectedModules.includes('orders');
  const hasComments = selectedModules.includes('comments');
  const hasMenus = selectedModules.includes('menus');
  const customerLoginRequired = selectedModules.includes('customers') || hasMenus;

  const steps = useMemo(() => {
    const list = ['website', 'industry'];
    if (state.industryKey && state.useSeedMauImages) {
      list.push('logo');
    }
    list.push('extras');
    if (hasProducts) {
      list.push('saleMode', 'productType', 'variants', 'productEnhancements');
    }
    list.push('business', 'adminConfig', 'permissionMode', 'experience');
    if (hasProducts || hasOrders || hasPosts || hasComments) {
      list.push('quickConfig');
    }
    list.push('dataScale', 'review');
    return list;
  }, [hasComments, hasOrders, hasPosts, hasProducts, state.industryKey, state.useSeedMauImages]);

  useEffect(() => {
    const presetKey = industryTemplate?.experiencePresetKey
      ?? (getDefaultExperiencePresetKey(state.websiteType) as ExperiencePresetKey);
    setState((prev) => (prev.experiencePresetKey === presetKey
      ? prev
      : { ...prev, experiencePresetKey: presetKey }));
  }, [industryTemplate?.experiencePresetKey, state.websiteType]);

  const prevStepsRef = useRef<string[]>([]);

  useEffect(() => {
    const prevSteps = prevStepsRef.current;
    if (prevSteps.length > 0 && steps.join('|') !== prevSteps.join('|')) {
      const previousStepKey = prevSteps[currentStep];
      const nextIndex = previousStepKey ? steps.indexOf(previousStepKey) : -1;
      setCurrentStep(nextIndex >= 0 ? nextIndex : 0);
    }
    prevStepsRef.current = steps;
  }, [currentStep, steps]);

  useEffect(() => {
    setState((prev) => {
      const next = new Set(prev.extraFeatures);
      if (!hasProducts) {
        next.delete('wishlist');
        next.delete('promotions');
      }
      if (!hasProducts && !hasPosts) {
        next.delete('comments');
      }
      return { ...prev, extraFeatures: next };
    });
  }, [hasProducts, hasPosts, hasServices]);

  useEffect(() => {
    if (!customerLoginRequired || state.customerLoginManuallySet) {
      return;
    }
    if (!state.customerLoginEnabled) {
      setState((prev) => ({
        ...prev,
        customerLoginEnabled: true,
      }));
    }
  }, [customerLoginRequired, state.customerLoginEnabled, state.customerLoginManuallySet]);

  useEffect(() => {
    if (state.businessInfo.brandMode !== 'dual') {
      return;
    }
    if (state.businessInfo.brandSecondary) {
      return;
    }
    if (!industryPalette.secondary) {
      return;
    }
    setState((prev) => ({
      ...prev,
      businessInfo: {
        ...prev.businessInfo,
        brandSecondary: industryPalette.secondary,
      },
    }));
  }, [industryPalette.secondary, state.businessInfo.brandMode, state.businessInfo.brandSecondary]);

  const handleToggleFeature = (featureKey: string, enabled: boolean) => {
    setState((prev) => {
      const next = new Set(prev.extraFeatures);
      if (enabled) {
        next.add(featureKey);
      } else {
        next.delete(featureKey);
      }
      return { ...prev, extraFeatures: next };
    });
  };


  const handleIndustryChange = (industryKey: string) => {
    const template = getIndustryTemplate(industryKey);
    if (!template) {
      setState((prev) => ({ ...prev, industryKey, selectedLogo: null, logoCustomized: false }));
      return;
    }

    const palette = getIndustryBestPracticePalette(template);

    const randomLogo = state.useSeedMauImages && template.assets.logos.length > 0
      ? template.assets.logos[Math.floor(Math.random() * template.assets.logos.length)]
      : null;

    setState((prev) => {
      const isUsingLogoAsFavicon = prev.businessInfo.faviconUrl === prev.selectedLogo || !prev.businessInfo.faviconUrl;
      const nextFavicon = isUsingLogoAsFavicon ? (randomLogo ?? '') : prev.businessInfo.faviconUrl;
      return {
        ...prev,
        businessInfo: {
          ...prev.businessInfo,
          brandColor: palette.primary,
          brandSecondary: prev.businessInfo.brandMode === 'dual' ? palette.secondary : '',
          businessType: template.businessType,
          faviconUrl: nextFavicon,
          siteName: template.name,
          tagline: template.description,
        },
        experiencePresetKey: template.experiencePresetKey,
        industryKey,
        logoCustomized: false,
        productType: template.productType,
        saleMode: template.saleMode,
        selectedLogo: randomLogo,
      };
    });
  };

  const handleToggleSeedMau = (value: boolean) => {
    setState((prev) => {
      const nextLogo = value
        ? (prev.selectedLogo ?? (() => {
          const template = getIndustryTemplate(prev.industryKey);
          if (template && template.assets.logos.length > 0) {
            return template.assets.logos[Math.floor(Math.random() * template.assets.logos.length)];
          }
          return null;
        })())
        : null;
      const isUsingLogoAsFavicon = prev.businessInfo.faviconUrl === prev.selectedLogo;
      const nextFavicon = isUsingLogoAsFavicon ? (nextLogo ?? '') : prev.businessInfo.faviconUrl;
      return {
        ...prev,
        useSeedMauImages: value,
        selectedLogo: nextLogo,
        logoCustomized: value ? prev.logoCustomized : false,
        businessInfo: {
          ...prev.businessInfo,
          faviconUrl: nextFavicon,
        },
      };
    });
  };

  const handleSaleModeChange = (saleMode: SaleMode) => {
    setState((prev) => ({ ...prev, saleMode }));
  };

  const handleProductTypeChange = (productType: ProductType) => {
    setState((prev) => ({ ...prev, productType }));
  };

  const handleDigitalDeliveryChange = (deliveryType: DigitalDeliveryType) => {
    setState((prev) => ({ ...prev, digitalDeliveryType: deliveryType }));
  };

  const handleVariantToggle = (enabled: boolean) => {
    setState((prev) => ({
      ...prev,
      variantEnabled: enabled,
      variantPresetKey: enabled ? prev.variantPresetKey : DEFAULT_VARIANT_PRESET_KEY,
    }));
  };

  const handleCustomerLoginChange = (enabled: boolean) => {
    setState((prev) => ({
      ...prev,
      customerLoginEnabled: enabled,
      customerLoginManuallySet: true,
    }));
  };

  const stepKey = steps[currentStep];
  const totalSteps = steps.length;

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
      return;
    }
    void handleSeed();
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const buildSummary = () => {
    const saleModeLabel = state.saleMode === 'cart'
      ? 'Giỏ hàng & thanh toán'
      : state.saleMode === 'contact'
        ? 'Nút liên hệ'
        : 'Affiliate (Mua ngay)';
    const productTypeLabel = state.productType === 'both'
      ? 'Vật lý + Số'
      : state.productType === 'digital'
        ? 'Chỉ hàng số'
        : 'Chỉ hàng vật lý';
    const variantLabel = state.variantEnabled ? state.variantPresetKey : 'Không có phiên bản';
    const brandModeLabel = state.businessInfo.brandMode === 'dual' ? '2 màu (Dual)' : '1 màu (Single)';
    const permissionModeLabel = state.adminPermissionMode === 'simple_full_admin'
      ? 'Full quyền (Sticky)'
      : 'RBAC chuẩn';

    const websiteLabel = state.websiteType === 'landing'
      ? 'Chỉ giới thiệu'
      : state.websiteType === 'blog'
        ? 'Viết blog/tin tức'
        : state.websiteType === 'catalog'
          ? 'Trưng bày sản phẩm'
          : state.websiteType === 'ecommerce'
            ? 'Bán hàng online'
            : 'Cung cấp dịch vụ';
    const dataScaleLabel = state.dataScale === 'low'
      ? 'Ít (test nhanh)'
      : state.dataScale === 'medium'
        ? 'Vừa (dev)'
        : state.dataScale === 'high'
          ? 'Nhiều (demo)'
          : 'Không tạo dữ liệu';

    const items: Array<{ label: string; value: string }> = [];
    if (industryTemplate) {
      items.push({ label: 'Ngành hàng', value: industryTemplate.name });
    }
    items.push({ label: 'Website', value: websiteLabel });
    items.push({ label: 'Phân quyền admin', value: permissionModeLabel });
    items.push({ label: 'Ảnh mẫu', value: state.useSeedMauImages ? 'Bật' : 'Tắt' });
    items.push({ label: 'Màu thương hiệu', value: brandModeLabel });

    if (hasProducts) {
      items.push(
        { label: 'Chế độ bán', value: saleModeLabel },
        { label: 'Loại sản phẩm', value: productTypeLabel },
        { label: 'Phiên bản SP', value: variantLabel },
        { label: 'Khung viền SP', value: state.productFramesEnabled ? 'Bật' : 'Tắt' },
        { label: 'Nội dung bổ sung SP', value: state.productSupplementalContentEnabled ? 'Bật' : 'Tắt' }
      );
    }

    items.push(
      { label: 'Tên website', value: state.businessInfo.siteName || 'Website' },
      { label: 'Quy mô dữ liệu', value: dataScaleLabel }
    );

    return items;
  };

  const experienceOptions = useMemo(() => getExperiencePresets(state.websiteType), [state.websiteType]);
  const experiencePreset = useMemo(
    () => getExperiencePreset(state.websiteType, state.experiencePresetKey),
    [state.experiencePresetKey, state.websiteType]
  );

  const syncModules = async (desiredModules: string[]) => {
    const latestModules = await convex.query(api.admin.modules.listModules);
    if (!latestModules) {
      return;
    }

    const moduleMap = new Map(latestModules.map((moduleItem) => [moduleItem.key, moduleItem]));
    const desiredSet = new Set(desiredModules);

    const toEnable = Array.from(moduleMap.values())
      .filter((moduleItem) => desiredSet.has(moduleItem.key) && !moduleItem.enabled)
      .map((moduleItem) => moduleItem.key);

    const orderedEnable = orderModulesByDependencies(toEnable, moduleMap);

    const getCascadeKeys = (moduleKey: string) => {
      const cascade = new Set<string>();
      const visit = (key: string) => {
        for (const moduleItem of moduleMap.values()) {
          if (moduleItem.dependencies?.includes(key)) {
            if (!cascade.has(moduleItem.key)) {
              cascade.add(moduleItem.key);
              visit(moduleItem.key);
            }
          }
        }
      };
      visit(moduleKey);
      return Array.from(cascade).filter((key) => {
        const moduleItem = moduleMap.get(key);
        if (!moduleItem) {return false;}
        return !moduleItem.isCore || moduleItem.key === 'roles';
      });
    };

    for (const moduleKey of orderedEnable) {
      const result = await toggleModuleWithCascade({ enabled: true, key: moduleKey });
      if (!result.success) {
        continue;
      }
      const current = moduleMap.get(moduleKey);
      if (current) {
        moduleMap.set(moduleKey, { ...current, enabled: true });
      }
      if (result.autoEnabledModules.length > 0) {
        for (const autoKey of result.autoEnabledModules) {
          desiredSet.add(autoKey);
          const autoModule = moduleMap.get(autoKey);
          if (autoModule) {
            moduleMap.set(autoKey, { ...autoModule, enabled: true });
          }
        }
      }
    }

    const toDisable = Array.from(moduleMap.values())
      .filter((moduleItem) => !desiredSet.has(moduleItem.key)
        && moduleItem.enabled
        && (!moduleItem.isCore || moduleItem.key === 'roles'))
      .map((moduleItem) => moduleItem.key);

    for (const moduleKey of toDisable) {
      const cascadeKeys = getCascadeKeys(moduleKey).filter((key) => !desiredSet.has(key));
      const result = await toggleModuleWithCascade({ enabled: false, key: moduleKey, cascadeKeys });
      if (!result.success) {
        continue;
      }
      const current = moduleMap.get(moduleKey);
      if (current) {
        moduleMap.set(moduleKey, { ...current, enabled: false });
      }
      if (result.disabledModules.length > 0) {
        for (const disabledKey of result.disabledModules) {
          const disabledModule = moduleMap.get(disabledKey);
          if (disabledModule) {
            moduleMap.set(disabledKey, { ...disabledModule, enabled: false });
          }
        }
      }
    }
  };

  const applyProductOverrides = async () => {
    if (!hasProducts) {
      return;
    }
    if (state.saleMode !== 'affiliate' && state.productType === 'physical') {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 400));
    const products = productsRef.current ?? [];
    if (products.length === 0) {
      return;
    }

    const shouldDigital = state.productType !== 'physical';
    const digitalTemplate = DIGITAL_TEMPLATE_MAP[state.digitalDeliveryType];

    const updates = products.map((product, index) => {
      const isDigital = shouldDigital && (state.productType === 'digital' || index % 2 === 0);
      return updateProduct({
        affiliateLink: state.saleMode === 'affiliate'
          ? `https://example.com/buy/${product.slug}`
          : undefined,
        digitalCredentialsTemplate: isDigital ? digitalTemplate : undefined,
        digitalDeliveryType: isDigital ? state.digitalDeliveryType : undefined,
        id: product._id,
        productType: isDigital ? 'digital' : 'physical',
      });
    });

    await Promise.all(updates);
  };

  const handleSeed = async () => {
    if (isSeeding) {
      return;
    }

    if (state.clearBeforeSeed) {
      if (!confirm('Clear dữ liệu + xóa toàn bộ storage trước khi seed?')) {
        return;
      }
      const confirmText = prompt('Nhập CHAC CHAN để xóa cả storage');
      if ((confirmText ?? '').trim().toLowerCase() !== 'chac chan') {
        return;
      }
    }

    setIsSeeding(true);
    const toastId = toast.loading('Đang seed theo wizard...');

    try {
      if (state.clearBeforeSeed) {
        await clearAll({ excludeSystem: false, forceStorageCleanup: true });
        await seedAllModulesConfig({});
      }

      if (state.clearBeforeSeed && hasProducts) {
        await clearProductVariantData({});
      }

      if (!state.clearBeforeSeed) {
        const modulesToCheck = selectedModules.length > 0 ? selectedModules : ['products'];
        const missingConfigs = await Promise.all(
          modulesToCheck.map(async (moduleKey) => {
            const fields = await convex.query(api.admin.modules.listModuleFields, { moduleKey });
            return !fields || fields.length === 0 ? moduleKey : null;
          })
        );
        if (missingConfigs.some(Boolean)) {
          await seedAllModulesConfig({});
        }
      }

      await syncModules(modulesForEnable);

      if (!hasServices) {
        await clearModule({ module: 'services' });
        await clearModule({ module: 'serviceCategories' });
      }

      const resolvedCustomerLoginEnabled = customerLoginRequired ? true : state.customerLoginEnabled;
      if (customerLoginRequired && !state.customerLoginEnabled) {
        toast.info('Đăng nhập KH sẽ được bật lại do phụ thuộc module.');
      }

      if (hasProducts) {
        await setModuleSetting({ moduleKey: 'products', settingKey: 'saleMode', value: state.saleMode });
        await setModuleSetting({ moduleKey: 'products', settingKey: 'variantEnabled', value: state.variantEnabled });
        await setModuleSetting({ moduleKey: 'products', settingKey: 'variantPricing', value: state.variantPricing });
        await setModuleSetting({ moduleKey: 'products', settingKey: 'variantStock', value: state.variantStock });
        await setModuleSetting({ moduleKey: 'products', settingKey: 'variantImages', value: state.variantImages });
        await setModuleSetting({ moduleKey: 'products', settingKey: 'outOfStockDisplay', value: 'blur' });
        await setModuleSetting({ moduleKey: 'products', settingKey: 'imageChangeAnimation', value: 'fade' });
        await setModuleSetting({ moduleKey: 'products', settingKey: 'enableProductFrames', value: state.productFramesEnabled });
        await setModuleSetting({ moduleKey: 'products', settingKey: 'enableProductSupplementalContent', value: state.productSupplementalContentEnabled });
        await setModuleSetting({
          moduleKey: 'products',
          settingKey: 'productTypeMode',
          value: state.productType,
        });
        await setModuleSetting({
          moduleKey: 'products',
          settingKey: 'defaultDigitalDeliveryType',
          value: state.digitalDeliveryType,
        });
        await setModuleSetting({
          moduleKey: 'products',
          settingKey: 'productsPerPage',
          value: state.quickConfig.productsPerPage,
        });
        await setModuleSetting({
          moduleKey: 'products',
          settingKey: 'lowStockThreshold',
          value: state.quickConfig.lowStockThreshold,
        });
        await setModuleSetting({
          moduleKey: 'products',
          settingKey: 'defaultStatus',
          value: state.quickConfig.productsDefaultStatus,
        });
      }

      const seedConfigs = buildSeedConfigs(
        selectedModules,
        state.dataScale,
        state.industryKey,
        state.selectedLogo,
        state.useSeedMauImages
      ).map((config) => ({
        ...config,
        force: false,
        strictVariantPresetScope: config.module === 'products' && state.variantEnabled && state.clearBeforeSeed
          ? true
          : undefined,
        variantPresetKey: config.module === 'products' && state.variantEnabled
          ? state.variantPresetKey
          : undefined,
      }));

      const shouldSeedContent = state.dataScale !== 'none';

      if (shouldSeedContent) {
        const missingSeedModules = selectedModules.filter(
          (moduleKey) => !seedConfigs.some((config) => config.module === moduleKey)
        );

        if (missingSeedModules.length > 0) {
          toast.error(`Thiếu cấu hình seed cho: ${missingSeedModules.join(', ')}`, { id: toastId });
          return;
        }
      }

      if (state.businessInfo.brandMode === 'dual' && !state.businessInfo.brandSecondary) {
        toast.info('Chưa nhập màu phụ, wizard sẽ dùng màu best-practice theo ngành.');
      }

      const seedResults = shouldSeedContent
        ? await seedBulk({ configs: seedConfigs })
        : [];

      if (selectedModules.includes('customers') || customerLoginRequired) {
        const customerFeatureReady = await ensureModuleFeature(
          'customers',
          'enableLogin',
          customerFeatureDefaults.enableLogin
        );
        if (customerFeatureReady) {
          await toggleModuleFeature({
            enabled: resolvedCustomerLoginEnabled,
            featureKey: 'enableLogin',
            moduleKey: 'customers',
          });
        }
      }

      const settingsFeaturesToEnable = ['enableContact', 'enableSEO', 'enableSocial'];
      for (const featureKey of settingsFeaturesToEnable) {
        const payload = settingsFeatureDefaults[featureKey];
        const settingsFeatureReady = payload
          ? await ensureModuleFeature('settings', featureKey, payload)
          : false;
        if (settingsFeatureReady) {
          await toggleModuleFeature({ enabled: true, featureKey, moduleKey: 'settings' });
        }
      }

      if (hasOrders) {
        const preset = state.quickConfig.orderStatusPreset || DEFAULT_ORDER_STATUS_PRESET;
        await setModuleSetting({ moduleKey: 'orders', settingKey: 'orderStatusPreset', value: preset });
        await setModuleSetting({
          moduleKey: 'orders',
          settingKey: 'orderStatuses',
          value: JSON.stringify(ORDER_STATUS_PRESETS[preset], null, 2),
        });
        await setModuleSetting({
          moduleKey: 'orders',
          settingKey: 'ordersPerPage',
          value: state.quickConfig.ordersPerPage,
        });
        await setModuleSetting({
          moduleKey: 'orders',
          settingKey: 'shippingMethods',
          value: JSON.stringify([
            { id: 'standard', label: 'Giao hàng tiêu chuẩn', description: '2-4 ngày', fee: 30000, estimate: '2-4 ngày' },
            { id: 'express', label: 'Giao hàng nhanh', description: 'Trong 24h', fee: 50000, estimate: 'Trong 24h' },
          ], null, 2),
        });
        await setModuleSetting({
          moduleKey: 'orders',
          settingKey: 'paymentMethods',
          value: JSON.stringify([
            { id: 'cod', label: 'COD', description: 'Thanh toán khi nhận hàng', type: 'COD' },
            { id: 'bank', label: 'Chuyển khoản ngân hàng', description: 'Chuyển khoản trước khi giao', type: 'BankTransfer' },
            { id: 'vietqr', label: 'VietQR', description: 'Quét mã QR để thanh toán', type: 'VietQR' },
          ], null, 2),
        });
      }

      if (hasPosts) {
        await setModuleSetting({
          moduleKey: 'posts',
          settingKey: 'postsPerPage',
          value: state.quickConfig.postsPerPage,
        });
        await setModuleSetting({
          moduleKey: 'posts',
          settingKey: 'defaultStatus',
          value: state.quickConfig.postsDefaultStatus,
        });
      }

      if (hasComments) {
        await setModuleSetting({
          moduleKey: 'comments',
          settingKey: 'defaultStatus',
          value: state.quickConfig.commentsDefaultStatus,
        });
      }

      const brandPrimary = state.businessInfo.brandColor || industryPalette.primary || '#3b82f6';
      const brandSecondary = state.businessInfo.brandMode === 'dual'
        ? (state.businessInfo.brandSecondary || industryPalette.secondary || brandPrimary)
        : '';
      const resolvedFavicon = state.selectedLogo || state.businessInfo.faviconUrl || '';
      const seoKeywordPool = [
        ...(industryTemplate?.tags ?? []),
        industryTemplate?.name,
        state.businessInfo.siteName,
      ]
        .filter(Boolean)
        .map((item) => (item || '').trim())
        .filter(Boolean);
      const seoKeywords = Array.from(new Set(seoKeywordPool)).join(', ');
      const resolvedOgImage = state.businessInfo.useLogoAsOgImage
        ? (state.selectedLogo || state.businessInfo.ogImageUrl || '')
        : (state.businessInfo.ogImageUrl || '');

      await setSettings({
        settings: [
          { group: 'site', key: 'site_name', value: state.businessInfo.siteName || 'Website' },
          { group: 'site', key: 'site_tagline', value: state.businessInfo.tagline || '' },
          { group: 'site', key: 'site_favicon', value: resolvedFavicon },
          { group: 'site', key: 'site_brand_mode', value: state.businessInfo.brandMode },
          { group: 'site', key: 'site_brand_primary', value: brandPrimary },
          { group: 'site', key: 'site_brand_secondary', value: brandSecondary },
          { group: 'home_components', key: 'create_hidden_types', value: [] },
          { group: 'home_components', key: 'type_color_overrides', value: {} },
          { group: 'contact', key: 'contact_email', value: state.businessInfo.email || 'contact@example.com' },
          { group: 'contact', key: 'contact_phone', value: state.businessInfo.phone || '' },
          { group: 'contact', key: 'contact_address', value: state.businessInfo.address || '' },
          { group: 'social', key: 'social_facebook', value: state.businessInfo.socialFacebook || '' },
          {
            group: 'seo',
            key: 'seo_title',
            value: state.businessInfo.tagline
              ? `${state.businessInfo.siteName} - ${state.businessInfo.tagline}`
              : state.businessInfo.siteName,
          },
          { group: 'seo', key: 'seo_description', value: state.businessInfo.tagline || '' },
          { group: 'seo', key: 'seo_keywords', value: seoKeywords },
          { group: 'seo', key: 'seo_og_image', value: resolvedOgImage },
          { group: 'admin', key: 'admin_permission_mode', value: state.adminPermissionMode },
        ],
      });

      const experienceSettings = Object.entries(experiencePreset.settings)
        .filter(([key]) => {
          if (key === 'product_detail_ui' || key === 'products_list_ui') {
            return hasProducts;
          }
          if (key === 'cart_ui') {
            return selectedModules.includes('cart');
          }
          if (key === 'checkout_ui') {
            return hasOrders;
          }
          if (key === 'wishlist_ui') {
            return selectedModules.includes('wishlist');
          }
          if (key === 'posts_list_ui' || key === 'posts_detail_ui') {
            return hasPosts;
          }
          if (key === 'services_list_ui' || key === 'services_detail_ui') {
            return hasServices;
          }
          return true;
        })
        .map(([key, value]) => ({
          group: 'experience',
          key,
          value,
        }));

      if (experienceSettings.length > 0) {
        await setSettings({ settings: experienceSettings });
      }

      const resolvedAdminEmail = state.adminConfig.email.trim() || 'tranmanhhieu10@gmail.com';
      const resolvedAdminPassword = state.adminConfig.password || '123456';
      const result = await ensureSuperAdmin({
        email: resolvedAdminEmail,
        password: resolvedAdminPassword,
      });
      if (!result.success) {
        toast.info(result.message);
      }

      await applyProductOverrides();

      if (shouldSeedContent) {
        const zeroSeedModules = seedConfigs
          .filter((config) => config.quantity > 0)
          .map((config) => {
            const result = seedResults.find((item) => item.module === config.module);
            return result && result.created === 0 ? config.module : null;
          })
          .filter(Boolean) as string[];

        if (zeroSeedModules.length > 0) {
          toast.warning(`Seed xong nhưng dữ liệu trống: ${zeroSeedModules.join(', ')}`);
        }
      }

      toast.success('Seed wizard hoàn tất!', { id: toastId });
      onComplete?.();
      onOpenChange(false);
      setState(DEFAULT_STATE);
      setCurrentStep(0);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Seed thất bại', { id: toastId });
    } finally {
      setIsSeeding(false);
    }
  };

  const summary = buildSummary();
  const dataScaleLabel = summary.find((item) => item.label === 'Quy mô dữ liệu')?.value ?? '';
  const scaleSummary = getScaleSummary(selectedModules, state.dataScale);
  const brandPrimary = state.businessInfo.brandColor || '#3b82f6';
  const brandSecondary = state.businessInfo.brandMode === 'dual'
    ? (state.businessInfo.brandSecondary || brandPrimary)
    : '';
  const moduleConfigs = [
    state.quickConfigSkipped
      ? { label: 'Cấu hình nhanh', value: 'Dùng mặc định' }
      : null,
    hasProducts
      ? { label: 'SP / trang', value: `${state.quickConfig.productsPerPage}` }
      : null,
    hasProducts
      ? { label: 'Ngưỡng tồn kho', value: `${state.quickConfig.lowStockThreshold}` }
      : null,
    hasProducts
      ? { label: 'Trạng thái SP', value: state.quickConfig.productsDefaultStatus }
      : null,
    hasOrders
      ? { label: 'Preset đơn hàng', value: state.quickConfig.orderStatusPreset }
      : null,
    hasOrders
      ? { label: 'Đơn / trang', value: `${state.quickConfig.ordersPerPage}` }
      : null,
    hasPosts
      ? { label: 'Bài viết / trang', value: `${state.quickConfig.postsPerPage}` }
      : null,
    hasPosts
      ? { label: 'Trạng thái bài viết', value: state.quickConfig.postsDefaultStatus }
      : null,
    hasComments
      ? { label: 'Trạng thái bình luận', value: state.quickConfig.commentsDefaultStatus }
      : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-cyan-500" /> Seed Wizard
          </DialogTitle>
          <DialogDescription>
            Seed dữ liệu theo wizard hỏi thẳng từng quyết định quan trọng.
          </DialogDescription>
        </DialogHeader>

        <WizardProgress currentStep={currentStep + 1} totalSteps={totalSteps} />

        <div className="flex-1 overflow-y-auto pr-2 mt-2 space-y-6">
          {stepKey === 'website' && (
            <WebsiteTypeStep
              value={state.websiteType}
              onChange={(websiteType) => setState((prev) => ({ ...prev, websiteType }))}
              useSeedMauImages={state.useSeedMauImages}
              onToggleSeedMau={handleToggleSeedMau}
            />
          )}

          {stepKey === 'industry' && (
            <IndustrySelectionStep
              value={state.industryKey}
              onChange={handleIndustryChange}
            />
          )}

          {stepKey === 'logo' && (
            <LogoSelectionStep
              industryKey={state.industryKey}
              useSeedMauImages={state.useSeedMauImages}
              selectedLogo={state.selectedLogo}
              logoCustomized={state.logoCustomized}
              onChange={(logo, customized) =>
                setState((prev) => {
                  const isUsingLogoAsFavicon = prev.businessInfo.faviconUrl === prev.selectedLogo;
                  const nextFavicon = isUsingLogoAsFavicon ? (logo ?? '') : prev.businessInfo.faviconUrl;
                  return {
                    ...prev,
                    businessInfo: {
                      ...prev.businessInfo,
                      faviconUrl: nextFavicon,
                    },
                    selectedLogo: logo,
                    logoCustomized: customized,
                  };
                })
              }
            />
          )}

          {stepKey === 'extras' && (
            <ExtraFeaturesStep
              enabledFeatures={state.extraFeatures}
              baseHasPosts={baseModules.includes('posts')}
              baseHasProducts={baseModules.includes('products')}
              baseHasServices={baseModules.includes('services')}
              onToggle={handleToggleFeature}
            />
          )}

          {stepKey === 'saleMode' && (
            <SaleModeStep value={state.saleMode} onChange={handleSaleModeChange} />
          )}

          {stepKey === 'productType' && (
            <ProductTypeStep
              deliveryType={state.digitalDeliveryType}
              productType={state.productType}
              onDeliveryChange={handleDigitalDeliveryChange}
              onProductTypeChange={handleProductTypeChange}
            />
          )}

          {stepKey === 'variants' && (
            <ProductVariantsStep
              variantEnabled={state.variantEnabled}
              variantImages={state.variantImages}
              variantPresetKey={state.variantPresetKey}
              variantPricing={state.variantPricing}
              variantStock={state.variantStock}
              onToggleEnabled={handleVariantToggle}
              onPresetChange={(presetKey) => setState((prev) => ({ ...prev, variantPresetKey: presetKey }))}
              onPricingChange={(value) => setState((prev) => ({ ...prev, variantPricing: value }))}
              onStockChange={(value) => setState((prev) => ({ ...prev, variantStock: value }))}
              onImagesChange={(value) => setState((prev) => ({ ...prev, variantImages: value }))}
            />
          )}

          {stepKey === 'productEnhancements' && (
            <ProductEnhancementsStep
              productFramesEnabled={state.productFramesEnabled}
              productSupplementalContentEnabled={state.productSupplementalContentEnabled}
              onChangeFrames={(productFramesEnabled) => setState((prev) => ({ ...prev, productFramesEnabled }))}
              onChangeSupplementalContent={(productSupplementalContentEnabled) =>
                setState((prev) => ({ ...prev, productSupplementalContentEnabled }))}
            />
          )}

          {stepKey === 'business' && (
            <BusinessInfoStep
              suggestedLogoUrl={state.selectedLogo ?? undefined}
              onUseLogoAsFavicon={(logoUrl) =>
                setState((prev) => ({
                  ...prev,
                  businessInfo: {
                    ...prev.businessInfo,
                    faviconUrl: logoUrl,
                  },
                }))
              }
              value={state.businessInfo}
              onChange={(businessInfo) => setState((prev) => ({ ...prev, businessInfo }))}
            />
          )}

          {stepKey === 'adminConfig' && (
            <AdminConfigStep
              value={state.adminConfig}
              onChange={(adminConfig) => setState((prev) => ({ ...prev, adminConfig }))}
            />
          )}

          {stepKey === 'permissionMode' && (
            <AdminPermissionModeStep
              value={state.adminPermissionMode}
              onChange={(adminPermissionMode: AdminPermissionMode) =>
                setState((prev) => ({ ...prev, adminPermissionMode }))}
            />
          )}

          {stepKey === 'experience' && (
            <ExperiencePresetStep
              options={experienceOptions}
              value={state.experiencePresetKey}
              onChange={(experiencePresetKey) => setState((prev) => ({ ...prev, experiencePresetKey }))}
            />
          )}

          {stepKey === 'quickConfig' && (
            <QuickConfigStep
              value={state.quickConfig}
              showComments={hasComments}
              showOrders={hasOrders}
              showPosts={hasPosts}
              showProducts={hasProducts}
              onChange={(quickConfig) => setState((prev) => ({ ...prev, quickConfig, quickConfigSkipped: false }))}
              onSkip={() => {
                setState((prev) => ({ ...prev, quickConfigSkipped: true }));
                nextStep();
              }}
            />
          )}

          {stepKey === 'dataScale' && (
            <DataScaleStep
              value={state.dataScale}
              summary={scaleSummary}
              onChange={(dataScale) => setState((prev) => ({ ...prev, dataScale }))}
            />
          )}

          {stepKey === 'review' && (
            <ReviewStep
              adminPermissionMode={state.adminPermissionMode}
              brandMode={state.businessInfo.brandMode}
              brandPrimary={brandPrimary}
              brandSecondary={brandSecondary}
              customerLoginEnabled={state.customerLoginEnabled}
              customerLoginRequired={customerLoginRequired}
              clearBeforeSeed={state.clearBeforeSeed}
              dataScaleLabel={dataScaleLabel}
              experienceSummary={experiencePreset.summary}
              industryKey={state.industryKey}
              logoCustomized={state.logoCustomized}
              moduleConfigs={moduleConfigs}
              modules={selectedModules}
              selectedLogo={state.selectedLogo}
              summary={summary}
              useSeedMauImages={state.useSeedMauImages}
              onCustomerLoginChange={handleCustomerLoginChange}
              onClearChange={(value) => setState((prev) => ({ ...prev, clearBeforeSeed: value }))}
            />
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <div className="flex w-full items-center justify-between">
            <Button variant="outline" onClick={prevStep} disabled={currentStep === 0 || isSeeding}>
              Quay lại
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSeeding}>
                Hủy
              </Button>
              <Button onClick={nextStep} disabled={isSeeding}>
                {currentStep === totalSteps - 1 ? 'Bắt đầu Seed' : 'Tiếp tục'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function orderModulesByDependencies(
  modules: string[],
  moduleMap: Map<string, { dependencyType?: string; dependencies?: string[]; enabled: boolean }>
) {
  const ordered: string[] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (moduleKey: string) => {
    if (visited.has(moduleKey)) {
      return;
    }
    if (visiting.has(moduleKey)) {
      return;
    }
    visiting.add(moduleKey);
    const moduleInfo = moduleMap.get(moduleKey);
    const dependencies = moduleInfo?.dependencies ?? [];
    if ((moduleInfo?.dependencyType ?? 'all') === 'all') {
      for (const dependency of dependencies) {
        if (modules.includes(dependency) || moduleMap.get(dependency)?.enabled) {
          visit(dependency);
        }
      }
    }
    visiting.delete(moduleKey);
    visited.add(moduleKey);
    if (modules.includes(moduleKey)) {
      ordered.push(moduleKey);
    }
  };

  modules.forEach(visit);
  return ordered;
}
