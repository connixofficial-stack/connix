'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { CalendarDays, Eye, Loader2, Save } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/app/admin/components/ui';
import { useBrandColors } from '@/components/site/hooks';
import { ExperienceModuleLink, ExperienceHintCard, ExampleLinks } from '@/components/experiences';
import {
  BrowserFrame,
  ColorConfigCard,
  ControlCard,
  DeviceToggle,
  deviceWidths,
  ToggleRow,
  type DeviceType,
} from '@/components/experiences/editor';
import { useExperienceConfig, useExperienceSave, EXPERIENCE_NAMES, MESSAGES } from '@/lib/experiences';

type BookingExperienceConfig = {
  showLegend: boolean;
  showCapacityHint: boolean;
  showServiceSelect: boolean;
};

const EXPERIENCE_KEY = 'booking_ui';

const DEFAULT_CONFIG: BookingExperienceConfig = {
  showLegend: true,
  showCapacityHint: true,
  showServiceSelect: true,
};

const HINTS = [
  'Khách đặt lịch chỉ cần nhập tên, không cần login.',
  'Visibility mode được cấu hình tại System > Module Đặt lịch.',
  'Legend giúp khách hiểu slot còn chỗ/hết chỗ.',
];

export default function BookingExperiencePage() {
  const experienceSetting = useQuery(api.settings.getByKey, { key: EXPERIENCE_KEY });
  const bookingsModule = useQuery(api.admin.modules.getModuleByKey, { key: 'bookings' });
  const brandColors = useBrandColors();
  const [brandColor, setBrandColor] = useState(brandColors.primary);
  const [secondaryColor, setSecondaryColor] = useState(brandColors.secondary || '');
  const [colorMode, setColorMode] = useState<'single' | 'dual'>(brandColors.mode || 'single');
  const [previewDevice, setPreviewDevice] = useState<DeviceType>('desktop');

  const serverConfig = useMemo<BookingExperienceConfig>(() => {
    const raw = experienceSetting?.value as Partial<BookingExperienceConfig> | undefined;
    return {
      showLegend: raw?.showLegend ?? true,
      showCapacityHint: raw?.showCapacityHint ?? true,
      showServiceSelect: raw?.showServiceSelect ?? true,
    };
  }, [experienceSetting?.value]);

  const isLoading = experienceSetting === undefined || bookingsModule === undefined;
  const { config, setConfig, hasChanges } = useExperienceConfig(serverConfig, DEFAULT_CONFIG, isLoading);
  const { handleSave, isSaving } = useExperienceSave(
    EXPERIENCE_KEY,
    config,
    MESSAGES.saveSuccess(EXPERIENCE_NAMES[EXPERIENCE_KEY])
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">{MESSAGES.loading}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-indigo-600" />
            <h1 className="text-2xl font-bold">Đặt lịch</h1>
          </div>
          <Link href="/system/experiences" className="text-sm text-blue-600 hover:underline">
            Quay lại danh sách
          </Link>
        </div>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="bg-indigo-600 hover:bg-indigo-500 gap-1.5"
        >
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          <span>{hasChanges ? 'Lưu' : 'Đã lưu'}</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thiết lập hiển thị</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ControlCard title="Màu thương hiệu">
            <ColorConfigCard
              primary={brandColor}
              secondary={secondaryColor}
              mode={colorMode}
              onPrimaryChange={setBrandColor}
              onSecondaryChange={setSecondaryColor}
              onModeChange={setColorMode}
            />
          </ControlCard>
          <ControlCard title="Tuỳ chọn hiển thị">
            <ToggleRow
              label="Legend trạng thái"
              checked={config.showLegend}
              onChange={(v) => setConfig(prev => ({ ...prev, showLegend: v }))}
              accentColor={brandColor}
            />
            <ToggleRow
              label="Gợi ý sức chứa"
              checked={config.showCapacityHint}
              onChange={(v) => setConfig(prev => ({ ...prev, showCapacityHint: v }))}
              accentColor={brandColor}
            />
            <ToggleRow
              label="Chọn dịch vụ"
              checked={config.showServiceSelect}
              onChange={(v) => setConfig(prev => ({ ...prev, showServiceSelect: v }))}
              accentColor={brandColor}
            />
          </ControlCard>
          <ControlCard title="Module liên quan">
            <ExperienceModuleLink
              enabled={bookingsModule?.enabled ?? false}
              href="/system/modules/bookings"
              icon={Eye}
              title="Đặt lịch"
              colorScheme="blue"
            />
          </ControlCard>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Liên kết & ghi chú</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ControlCard title="Link xem thử">
            <ExampleLinks
              links={[{ label: 'Trang đặt lịch', url: '/book' }]}
              color={brandColor}
              compact
            />
          </ControlCard>
          <Card className="p-2">
            <ExperienceHintCard hints={HINTS} />
          </Card>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye size={18} /> Preview
            </CardTitle>
            <DeviceToggle value={previewDevice} onChange={setPreviewDevice} size="sm" />
          </div>
        </CardHeader>
        <CardContent>
          <div className={`mx-auto transition-all duration-300 ${deviceWidths[previewDevice]}`}>
            <BrowserFrame url="yoursite.com/book">
              <BookingPreview
                config={config}
                brandColor={brandColor}
                secondaryColor={secondaryColor}
                colorMode={colorMode}
                device={previewDevice}
              />
            </BrowserFrame>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BookingPreview({
  config,
  brandColor,
  secondaryColor,
  colorMode,
  device,
}: {
  config: BookingExperienceConfig;
  brandColor: string;
  secondaryColor: string;
  colorMode: 'single' | 'dual';
  device: DeviceType;
}) {
  const isMobile = device === 'mobile';
  const secondary = colorMode === 'dual' ? secondaryColor : brandColor;
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">Đặt lịch spa</div>
          <div className="text-xs text-slate-500">Chọn dịch vụ và khung giờ</div>
        </div>
        <div className="text-xs px-2 py-1 rounded-full" style={{ background: `${brandColor}1a`, color: brandColor }}>
          Available
        </div>
      </div>

      {config.showServiceSelect && (
        <div className="space-y-2">
          <div className="text-xs text-slate-500">Dịch vụ</div>
          <div className="flex flex-wrap gap-2">
            {['Massage body', 'Facial', 'Gội đầu'].map((item) => (
              <span
                key={item}
                className="text-xs px-3 py-1 rounded-full border"
                style={{ borderColor: brandColor, color: brandColor }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="text-xs text-slate-500">Khung giờ</div>
        <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-3'} gap-2`}>
          {['09:00', '10:00', '11:00', '13:00', '14:00', '15:00'].map((slot, index) => (
            <div
              key={slot}
              className="rounded-lg border px-3 py-2 text-xs text-center"
              style={{
                borderColor: index === 1 ? secondary : '#e2e8f0',
                background: index === 1 ? `${secondary}10` : 'white',
                color: index === 1 ? secondary : '#334155',
              }}
            >
              {slot}
            </div>
          ))}
        </div>
      </div>

      {config.showLegend && (
        <div className="flex flex-wrap gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Còn chỗ
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Sắp đầy
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> Đã đầy
          </span>
        </div>
      )}

      {config.showCapacityHint && (
        <div className="text-xs text-slate-500">
          Mỗi slot tối đa 3 khách. Vui lòng chọn khung giờ còn trống.
        </div>
      )}
    </div>
  );
}
