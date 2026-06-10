'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import {
  ArrowRight,
  Heart,
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  ShoppingBag,
  ShoppingCart,
  User,
} from 'lucide-react';
import { api } from '@/convex/_generated/api';
import { useCustomerAuth } from '@/app/(site)/auth/context';
import { useBrandColors, useSiteSettings } from '@/components/site/hooks';
import { useAccountProfileConfig } from '@/lib/experiences';
import { getAccountProfileColors } from '@/components/site/account/profile/colors';

export default function AccountProfilePage() {
  const brandColors = useBrandColors();
  const { isDark } = useSiteSettings();
  const tokens = useMemo(
    () => getAccountProfileColors(brandColors.primary, brandColors.secondary, brandColors.mode, isDark),
    [brandColors.primary, brandColors.secondary, brandColors.mode, isDark]
  );
  const config = useAccountProfileConfig();
  const { customer, isAuthenticated, openLoginModal } = useCustomerAuth();
  const customersModule = useQuery(api.admin.modules.getModuleByKey, { key: 'customers' });
  const loginFeature = useQuery(api.admin.modules.getModuleFeature, { moduleKey: 'customers', featureKey: 'enableLogin' });
  const wishlistModule = useQuery(api.admin.modules.getModuleByKey, { key: 'wishlist' });
  const customerDetail = useQuery(api.customers.getById, customer?.id ? { id: customer.id as any } : 'skip');

  if (customersModule && !customersModule.enabled) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div
          className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: tokens.surfaceSoft, color: tokens.mutedText }}
        >
          <User size={32} />
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: tokens.titleColor }}>Tài khoản đang tắt</h1>
        <p style={{ color: tokens.metaText }}>Hãy bật module Khách hàng để sử dụng tính năng này.</p>
      </div>
    );
  }

  if (loginFeature && !loginFeature.enabled) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div
          className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: tokens.surfaceSoft, color: tokens.mutedText }}
        >
          <User size={32} />
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: tokens.titleColor }}>Đăng nhập đang tắt</h1>
        <p style={{ color: tokens.metaText }}>Hãy bật tính năng đăng nhập trong module Khách hàng.</p>
      </div>
    );
  }

  if (!isAuthenticated || !customer) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div
          className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: tokens.surfaceSoft, color: tokens.mutedText }}
        >
          <User size={32} />
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: tokens.titleColor }}>Đăng nhập để xem tài khoản</h1>
        <p className="mb-6" style={{ color: tokens.metaText }}>Bạn cần đăng nhập để quản lý thông tin cá nhân.</p>
        <button
          onClick={openLoginModal}
          className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-medium"
          style={{ backgroundColor: tokens.primarySolidBg, color: tokens.primarySolidText }}
        >
          Đăng nhập ngay
        </button>
      </div>
    );
  }

  const displayName = customer.name || 'Khách hàng';
  const joinedDate = 'Đang cập nhật';
  const address = customerDetail?.address || 'Chưa cập nhật';

  const actions = [
    {
      id: 'orders',
      label: 'Đơn hàng của tôi',
      description: 'Xem lịch sử và trạng thái',
      icon: PackageCheck,
      href: '/account/orders',
    },
    {
      id: 'shop',
      label: 'Tiếp tục mua sắm',
      description: 'Khám phá sản phẩm mới',
      icon: ShoppingBag,
      href: '/products',
    },
    {
      id: 'wishlist',
      label: 'Danh sách yêu thích',
      description: 'Sản phẩm đã lưu',
      icon: Heart,
      href: '/wishlist',
    },
    {
      id: 'payment',
      label: 'Giỏ hàng của tôi',
      description: 'Quản lý giỏ hàng của bạn',
      icon: ShoppingCart,
      href: '/cart',
    },
  ];

  const selectedActionIds = config.actionItems.length > 0
    ? config.actionItems
    : actions.map((action) => action.id);
  const visibleActions = config.showQuickActions
    ? actions.filter((action) => {
        if (action.id === 'wishlist' && wishlistModule && !wishlistModule.enabled) {
          return false;
        }
        return selectedActionIds.includes(action.id);
      })
    : [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: tokens.headingColor }}>Tài khoản của tôi</h1>
        <p className="mt-2" style={{ color: tokens.metaText }}>Quản lý thông tin cá nhân và đơn hàng.</p>
      </div>

      {config.layoutStyle === 'card' && (
        <div className="space-y-6">
          <div
            className="rounded-2xl border p-6"
            style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: tokens.primarySolidBg, color: tokens.primarySolidText }}
                >
                  <User size={22} />
                </div>
                <span
                  className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                  style={{ backgroundColor: tokens.statusDotBg, borderColor: tokens.statusDotBorder }}
                />
              </div>
              <div className="text-lg font-semibold" style={{ color: tokens.titleColor }}>{displayName}</div>
            </div>

            {(config.showContactInfo || config.showAddress) && (
              <div className="mt-5 grid gap-3 text-sm" style={{ color: tokens.bodyText }}>
                {config.showContactInfo && (
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Mail size={16} style={{ color: tokens.mutedText }} />
                      <span>{customer.email}</span>
                    </div>
                    <div className="h-1 w-1 rounded-full" style={{ backgroundColor: tokens.separatorDot }} />
                    <div className="flex items-center gap-2">
                      <Phone size={16} style={{ color: tokens.mutedText }} />
                      <span>{customer.phone || 'Chưa cập nhật'}</span>
                    </div>
                  </div>
                )}
                {config.showAddress && (
                  <div className="flex items-center gap-2">
                    <MapPin size={16} style={{ color: tokens.mutedText }} />
                    <span>{address}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {visibleActions.length > 0 && (
            <div
              className="rounded-2xl border p-6"
              style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
            >
              <div className="text-sm font-semibold mb-4" style={{ color: tokens.sectionLabel }}>Tác vụ nhanh</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {visibleActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.id}
                      href={action.href}
                      className="flex items-center gap-4 rounded-xl border px-4 py-4"
                      style={{ backgroundColor: tokens.actionCardBg, borderColor: tokens.actionCardBorder }}
                    >
                      <div
                        className="w-11 h-11 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: tokens.actionIconBg, color: tokens.actionIconColor }}
                      >
                        <Icon size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold" style={{ color: tokens.actionTitle }}>{action.label}</p>
                        <p className="text-xs mt-0.5" style={{ color: tokens.actionDescription }}>{action.description}</p>
                      </div>
                      <ArrowRight size={18} style={{ color: tokens.actionArrow }} />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {config.layoutStyle === 'sidebar' && (
        <div
          className="rounded-2xl border overflow-hidden flex flex-col lg:flex-row"
          style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
        >
          <div className="p-6 lg:w-1/3" style={{ backgroundColor: tokens.primarySolidBg, color: tokens.primarySolidText }}>
            <div className="flex flex-col items-center text-center">
              <div
                className="w-20 h-20 rounded-full border-2 flex items-center justify-center"
                style={{ backgroundColor: tokens.avatarBg, borderColor: tokens.avatarBorder }}
              >
                <User size={28} style={{ color: tokens.avatarIcon }} />
              </div>
              <h2 className="text-lg font-semibold uppercase tracking-tight mt-4">{displayName}</h2>
            </div>

            {(config.showContactInfo || config.showAddress) && (
              <div className="mt-6 space-y-3 text-sm" style={{ color: tokens.primarySolidMutedText }}>
                {config.showContactInfo && (
                  <div className="flex items-center gap-2">
                    <Mail size={14} style={{ color: tokens.primarySolidMutedText }} />
                    <span className="truncate">{customer.email}</span>
                  </div>
                )}
                {config.showContactInfo && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} style={{ color: tokens.primarySolidMutedText }} />
                    <span className="truncate">{customer.phone || 'Chưa cập nhật'}</span>
                  </div>
                )}
                {config.showAddress && (
                  <div className="flex items-center gap-2">
                    <MapPin size={14} style={{ color: tokens.primarySolidMutedText }} />
                    <span className="truncate">{address}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-6 lg:w-2/3" style={{ backgroundColor: tokens.surface }}>
            <div className="mb-5">
              <h3 className="text-lg font-medium" style={{ color: tokens.titleColor }}>Chào mừng trở lại.</h3>
              {config.showJoinDate && (
                <div className="text-xs mt-1" style={{ color: tokens.metaText }}>Tham gia {joinedDate}</div>
              )}
            </div>
            <div className="grid grid-cols-1 gap-3">
              {visibleActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.id}
                    href={action.href}
                    className="flex items-center gap-4 p-4 border rounded-xl"
                    style={{ backgroundColor: tokens.actionCardBg, borderColor: tokens.actionCardBorder }}
                  >
                    <div
                      className="w-11 h-11 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: tokens.actionIconBg, color: tokens.actionIconColor }}
                    >
                      <Icon size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: tokens.actionTitle }}>{action.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: tokens.actionDescription }}>{action.description}</p>
                    </div>
                    <ArrowRight size={18} style={{ color: tokens.actionArrow }} />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {config.layoutStyle === 'compact' && (
        <div
          className="rounded-2xl border overflow-hidden flex flex-col lg:flex-row"
          style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
        >
          <div className="p-5 lg:w-1/3" style={{ backgroundColor: tokens.primarySolidBg, color: tokens.primarySolidText }}>
            <div className="flex items-center gap-3">
              <div
                className="w-14 h-14 rounded-full border flex items-center justify-center"
                style={{ backgroundColor: tokens.avatarBg, borderColor: tokens.avatarBorder }}
              >
                <User size={20} style={{ color: tokens.avatarIcon }} />
              </div>
              <div>
                <h3 className="text-base font-semibold">{displayName}</h3>
              </div>
            </div>
            {config.showContactInfo && (
              <div className="mt-4 space-y-2 text-xs" style={{ color: tokens.primarySolidMutedText }}>
                <div className="flex items-center gap-2">
                  <Mail size={12} style={{ color: tokens.primarySolidMutedText }} />
                  <span className="truncate">{customer.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={12} style={{ color: tokens.primarySolidMutedText }} />
                  <span>{customer.phone || 'Chưa cập nhật'}</span>
                </div>
              </div>
            )}
          </div>

          <div
            className="p-5 lg:w-2/3 border-t lg:border-t-0 lg:border-l"
            style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
          >
            <h4
              className="text-sm font-semibold mb-4 border-l-4 pl-2"
              style={{ color: tokens.titleColor, borderColor: tokens.sectionAccentBorder }}
            >
              Truy cập nhanh
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
              {visibleActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.id}
                    href={action.href}
                    className="flex items-center gap-3 rounded-xl border p-4"
                    style={{ backgroundColor: tokens.actionCardBg, borderColor: tokens.actionCardBorder }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: tokens.actionIconBg, color: tokens.actionIconColor }}
                    >
                      <Icon size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: tokens.actionTitle }}>{action.label}</p>
                      <p className="text-xs mt-1" style={{ color: tokens.actionDescription }}>{action.description}</p>
                    </div>
                    <ArrowRight size={18} style={{ color: tokens.actionArrow }} />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
