'use client';

import React from 'react';
import { MapPin, Phone, Store } from 'lucide-react';
import { useBrandColor, useContactSettings } from '@/components/site/hooks';

export default function StoresPage() {
  const brandColor = useBrandColor();
  const contact = useContactSettings();

  if (contact.isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />
        <div className="h-4 w-64 bg-slate-200 rounded-lg animate-pulse mt-3" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Hệ thống cửa hàng</h1>
        <p className="text-slate-500 mt-2">Tìm cửa hàng gần bạn hoặc liên hệ để được hỗ trợ.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${brandColor}15` }}>
              <Store size={20} style={{ color: brandColor }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Trụ sở chính</h2>
              <p className="text-sm text-slate-500">Thông tin cửa hàng chính thức</p>
            </div>
          </div>

          {contact.address ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-slate-500 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-slate-700">Địa chỉ</div>
                  <div className="text-sm text-slate-500">{contact.address}</div>
                </div>
              </div>
              {contact.phone && (
                <div className="flex items-start gap-3">
                  <Phone size={18} className="text-slate-500 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-slate-700">Liên hệ</div>
                    <div className="text-sm text-slate-500">{contact.phone}</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-slate-500">Chưa cập nhật thông tin cửa hàng.</div>
          )}

          {contact.phone && (
            <a
              href={`tel:${contact.phone}`}
              className="mt-6 inline-flex items-center justify-center h-11 px-5 rounded-xl text-white text-sm font-semibold"
              style={{ backgroundColor: brandColor }}
            >
              Gọi điện thoại
            </a>
          )}
        </div>

        <div className="bg-slate-100 rounded-2xl border border-slate-200 p-6 flex flex-col items-center justify-center text-center text-slate-500">
          <MapPin size={28} className="mb-3" />
          <p className="font-medium">Bản đồ cửa hàng</p>
          <p className="text-sm mt-1">Bản đồ đang được cập nhật.</p>
        </div>
      </div>
    </div>
  );
}
