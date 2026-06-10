'use client';

import React, { useMemo } from 'react';
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
import { getAccountProfileColors, type AccountProfileColorMode } from '@/components/site/account/profile/colors';

type AccountProfilePreviewProps = {
  layoutStyle: 'card' | 'sidebar' | 'compact';
  device: 'desktop' | 'tablet' | 'mobile';
  showQuickActions: boolean;
  showContactInfo: boolean;
  showAddress: boolean;
  actionItems: string[];
  brandColor: string;
  secondaryColor?: string;
  colorMode?: AccountProfileColorMode;
};

const ACTIONS = [
  {
    id: 'orders',
    label: 'Đơn hàng của tôi',
    description: 'Xem lịch sử và trạng thái',
    icon: PackageCheck,
  },
  {
    id: 'shop',
    label: 'Tiếp tục mua sắm',
    description: 'Khám phá sản phẩm mới',
    icon: ShoppingBag,
  },
  {
    id: 'wishlist',
    label: 'Danh sách yêu thích',
    description: 'Sản phẩm đã lưu',
    icon: Heart,
  },
  {
    id: 'payment',
    label: 'Giỏ hàng của tôi',
    description: 'Quản lý giỏ hàng của bạn',
    icon: ShoppingCart,
  },
];

const DEFAULT_ACTION_IDS = ACTIONS.map((action) => action.id);

export function AccountProfilePreview({
  layoutStyle,
  device,
  showQuickActions,
  showContactInfo,
  showAddress,
  actionItems,
  brandColor,
  secondaryColor,
  colorMode = 'single',
}: AccountProfilePreviewProps) {
  const selectedActionIds = actionItems.length > 0 ? actionItems : DEFAULT_ACTION_IDS;
  const visibleActions = showQuickActions
    ? ACTIONS.filter((action) => selectedActionIds.includes(action.id))
    : [];
  const isMobile = device === 'mobile';
  const tokens = useMemo(
    () => getAccountProfileColors(brandColor, secondaryColor, colorMode),
    [brandColor, secondaryColor, colorMode]
  );

  const user = {
    name: 'Nguyễn Văn A',
    role: 'Quản lý dự án',
    email: 'nguyen.van.a@doanhnghiep.com',
    phone: '0909 000 000',
    address: 'Tầng 12, Bitexco, Q.1, TP.HCM',
    joinDate: '2023-01-15',
    memberId: 'CUS-1024',
  };

  if (layoutStyle === 'sidebar') {
    return (
      <div className="rounded-2xl p-4" style={{ backgroundColor: tokens.pageBackground }}>
        <div
          className={`rounded-2xl border overflow-hidden ${isMobile ? 'flex flex-col' : 'flex'}`}
          style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
        >
          <div
            className={`${isMobile ? 'w-full' : 'w-1/3'} p-6 flex flex-col justify-center`}
            style={{ backgroundColor: tokens.primarySolidBg, color: tokens.primarySolidText }}
          >
            <div className={`flex ${isMobile ? 'flex-row items-center gap-4' : 'flex-col items-center'} text-center`}>
              <div className="relative mb-4">
                <div
                  className="w-20 h-20 rounded-full border-2 overflow-hidden flex items-center justify-center"
                  style={{ backgroundColor: tokens.avatarBg, borderColor: tokens.avatarBorder }}
                >
                  <User size={28} style={{ color: tokens.avatarIcon }} />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold uppercase tracking-tight">{user.name}</h3>
              </div>
            </div>

            {showContactInfo && (
              <div className="mt-6 space-y-3 text-left" style={{ color: tokens.primarySolidMutedText }}>
                <div className="flex items-center gap-2 text-xs">
                  <Mail size={14} style={{ color: tokens.primarySolidMutedText }} />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Phone size={14} style={{ color: tokens.primarySolidMutedText }} />
                  <span className="truncate">{user.phone}</span>
                </div>
              </div>
            )}
          </div>

          <div className={`${isMobile ? 'w-full' : 'w-2/3'} p-6`} style={{ backgroundColor: tokens.surface }}>
            <div className="mb-5">
              <h4 className="text-lg font-medium" style={{ color: tokens.titleColor }}>Chào mừng trở lại.</h4>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {visibleActions.map((action) => {
                const Icon = action.icon;
                return (
                  <div
                    key={action.id}
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
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (layoutStyle === 'compact') {
    return (
      <div className="rounded-2xl p-3" style={{ backgroundColor: tokens.pageBackground }}>
        <div
          className={`rounded-2xl border overflow-hidden ${isMobile ? 'flex flex-col' : 'flex'}`}
          style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
        >
          <div
            className={`${isMobile ? 'w-full' : 'w-1/3'} p-5 flex flex-col justify-center`}
            style={{ backgroundColor: tokens.primarySolidBg, color: tokens.primarySolidText }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-14 h-14 rounded-full border flex items-center justify-center"
                style={{ backgroundColor: tokens.avatarBg, borderColor: tokens.avatarBorder }}
              >
                <User size={20} style={{ color: tokens.avatarIcon }} />
              </div>
              <div>
                <h3 className="text-base font-semibold">{user.name}</h3>
              </div>
            </div>
            {showContactInfo && (
              <div className="mt-4 space-y-2 text-xs" style={{ color: tokens.primarySolidMutedText }}>
                <div className="flex items-center gap-2">
                  <Mail size={12} style={{ color: tokens.primarySolidMutedText }} />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={12} style={{ color: tokens.primarySolidMutedText }} />
                  <span>{user.phone}</span>
                </div>
              </div>
            )}
          </div>

          <div
            className={`${isMobile ? 'w-full' : 'w-2/3'} p-5 ${isMobile ? 'border-t' : 'border-l'}`}
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
                  <div
                    key={action.id}
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
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const quickActionGridClass = isMobile ? 'grid grid-cols-1 gap-3 text-xs' : 'grid grid-cols-3 gap-4 text-xs';

  return (
    <div className="rounded-2xl p-4 space-y-4" style={{ backgroundColor: tokens.pageBackground }}>
      <div>
        <h3 className="text-lg font-semibold" style={{ color: tokens.headingColor }}>Tài khoản của tôi</h3>
        <p className="text-xs" style={{ color: tokens.metaText }}>Preview account profile</p>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border p-5" style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ backgroundColor: tokens.primarySolidBg, color: tokens.primarySolidText }}
              >
                <User size={20} />
              </div>
              <span
                className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                style={{ backgroundColor: tokens.statusDotBg, borderColor: tokens.statusDotBorder }}
              />
            </div>
            <div className="text-base font-semibold" style={{ color: tokens.titleColor }}>{user.name}</div>
          </div>

          {(showContactInfo || showAddress) && (
            <div className="mt-5 grid gap-3 text-xs" style={{ color: tokens.bodyText }}>
              {showContactInfo && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Mail size={14} style={{ color: tokens.mutedText }} />
                    <span>{user.email}</span>
                  </div>
                  <div className="h-1 w-1 rounded-full" style={{ backgroundColor: tokens.separatorDot }} />
                  <div className="flex items-center gap-2">
                    <Phone size={14} style={{ color: tokens.mutedText }} />
                    <span>{user.phone}</span>
                  </div>
                </div>
              )}
              {showAddress && (
                <div className="flex items-center gap-2">
                  <MapPin size={14} style={{ color: tokens.mutedText }} />
                  <span>{user.address}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {visibleActions.length > 0 && (
          <div className="rounded-2xl border p-5 space-y-3" style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}>
            <div className="text-xs font-semibold" style={{ color: tokens.sectionLabel }}>Tác vụ nhanh</div>
            <div className={quickActionGridClass}>
              {visibleActions.map((action) => {
                const Icon = action.icon;
                return (
                  <div
                    key={action.id}
                    className="flex items-center gap-3 rounded-xl border px-4 py-3"
                    style={{ backgroundColor: tokens.actionCardBg, borderColor: tokens.actionCardBorder }}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: tokens.actionIconBg, color: tokens.actionIconColor }}
                    >
                      <Icon size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: tokens.actionTitle }}>{action.label}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: tokens.actionDescription }}>{action.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
