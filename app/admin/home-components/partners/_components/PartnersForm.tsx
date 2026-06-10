import React from 'react';
import { Handshake, Settings2 } from 'lucide-react';
import { Label, cn } from '../../../components/ui';
import { MultiImageUploader } from '../../../components/MultiImageUploader';
import {
  DEFAULT_PARTNERS_LOGO_COLOR_INTENSITY,
  getPartnersLogoColorModeFromIntensity,
  normalizePartnersLogoColorIntensity,
  type PartnerItem,
  type PartnersCornerRadius,
  type PartnersLogoColorIntensity,
  type PartnersLogoColorMode,
  type PartnersLogoSize,
  type PartnersSpacing,
  type PartnersStyle,
} from '../_types';
import { CollapsibleSubSection as SubSection } from '../../_shared/components/CollapsibleSubSection';
import { SectionSpacingControl } from '../../_shared/components/SectionSpacingControl';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { FormSectionsToggleAllButton } from '../../_shared/components/FormSectionsToggleAllButton';
import { PARTNERS_CROP_ASPECT_RATIO_BY_STYLE } from '../_lib/constants';

const activeSections = ['settings', 'partners', 'glassSettings'];

export const PartnersForm = ({
  items,
  setItems,
  cornerRadius,
  setCornerRadius,
  logoSize,
  setLogoSize,
  showBorder: _showBorder,
  setShowBorder: _setShowBorder,
  spacing,
  setSpacing,
  selectedStyle,
  defaultExpanded = true,
  showBorderControl: _showBorderControl = true,
  logoColorMode = 'grayscale',
  setLogoColorMode,
  logoColorIntensity = DEFAULT_PARTNERS_LOGO_COLOR_INTENSITY,
  setLogoColorIntensity,
  className,
  actions,
}: {
  items: PartnerItem[];
  setItems: (items: PartnerItem[]) => void;
  cornerRadius: PartnersCornerRadius;
  setCornerRadius: (value: PartnersCornerRadius) => void;
  logoSize: PartnersLogoSize;
  setLogoSize: (value: PartnersLogoSize) => void;
  showBorder: boolean;
  setShowBorder: (value: boolean) => void;
  spacing: PartnersSpacing;
  setSpacing: (value: PartnersSpacing) => void;
  selectedStyle?: PartnersStyle;
  defaultExpanded?: boolean;
  showBorderControl?: boolean;
  logoColorMode?: PartnersLogoColorMode;
  setLogoColorMode?: (value: PartnersLogoColorMode) => void;
  logoColorIntensity?: PartnersLogoColorIntensity;
  setLogoColorIntensity?: (value: PartnersLogoColorIntensity) => void;
  className?: string;
  actions?: React.ReactNode;
}) => {
  const { openSections, toggleSection, hasClosedSection, handleToggleAll } = useFormSectionsState(activeSections, defaultExpanded);
  const cropAspectRatio = selectedStyle ? PARTNERS_CROP_ASPECT_RATIO_BY_STYLE[selectedStyle] : 'wide169';

  const selectedLogoColorIntensity = normalizePartnersLogoColorIntensity(logoColorIntensity, logoColorMode);

  const updateLogoColorIntensity = (value: PartnersLogoColorIntensity) => {
    const nextValue = normalizePartnersLogoColorIntensity(value, logoColorMode);
    setLogoColorIntensity?.(nextValue);
    setLogoColorMode?.(getPartnersLogoColorModeFromIntensity(nextValue));
  };

  const getModeLabel = (value: PartnersLogoColorIntensity) => {
    if (value <= 0) {
      return 'Màu gốc (Original Color)';
    }

    if (value === 50) {
      return 'Thang màu xám (Grayscale)';
    }

    if (value >= 100) {
      return 'Trắng tinh khiết (White scale)';
    }

    if (value < 50) {
      return `Pha màu → thang xám (${value}%)`;
    }

    return `Thang xám → trắng (${value}%)`;
  };

  return (
    <div className={cn('mb-6', className)}>
      <FormSectionsToggleAllButton hasClosedSection={hasClosedSection} onToggleAll={handleToggleAll} />
      <div className="space-y-3">
        <SubSection
          icon={Settings2}
          title="Cài đặt hiển thị"
          open={openSections.settings}
          onOpenChange={(open) => toggleSection('settings', open)}
        >
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Bo góc card</Label>
              <select
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                value={cornerRadius}
                onChange={(event) => { setCornerRadius(event.target.value as PartnersCornerRadius); }}
              >
                <option value="none">Không bo góc</option>
                <option value="sm">Bo góc ít</option>
                <option value="lg">Bo góc nhiều</option>
              </select>
            </div>
            <SectionSpacingControl value={spacing} onChange={setSpacing} />
            <div className="space-y-2">
              <Label>Kích thước logo</Label>
              <select
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                value={logoSize}
                onChange={(event) => { setLogoSize(event.target.value as PartnersLogoSize); }}
              >
                <option value="small">Nhỏ</option>
                <option value="normal">Bình thường</option>
                <option value="large">Lớn</option>
                <option value="veryLarge">Rất lớn</option>
                <option value="largest">Lớn nhất</option>
              </select>
            </div>

          </div>
        </SubSection>

        {selectedStyle === 'glassLogoCloud' && (
          <SubSection
            icon={Settings2}
            title="Cài đặt Glass Logo Cloud"
            open={openSections.glassSettings}
            onOpenChange={(open) => toggleSection('glassSettings', open)}
          >
            <div className="space-y-4 p-4 rounded-md border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
              <div className="space-y-1">
                <Label className="text-sm font-medium text-slate-900 dark:text-slate-100">Chế độ màu sắc logo</Label>
                <p className="text-xs text-slate-500">Kéo thanh trượt để thay đổi cách hiển thị màu sắc logo của các đối tác trên nền tối.</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-semibold px-1">
                  <span className="text-slate-500">Chế độ hiện tại:</span>
                  <span className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                    {getModeLabel(selectedLogoColorIntensity)}
                  </span>
                </div>
                
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={selectedLogoColorIntensity}
                  onChange={(e) => {
                    updateLogoColorIntensity(Number(e.currentTarget.value));
                  }}
                  className="w-full h-1.5 accent-blue-600 cursor-pointer"
                />
                
                <div className="flex justify-between text-[11px] text-slate-400 dark:text-slate-500 px-0.5">
                  <span className={cn("cursor-pointer hover:text-slate-600 dark:hover:text-slate-300", selectedLogoColorIntensity === 0 && "text-blue-600 dark:text-blue-400 font-medium")} onClick={() => { updateLogoColorIntensity(0); }}>Màu gốc</span>
                  <span className={cn("cursor-pointer hover:text-slate-600 dark:hover:text-slate-300", selectedLogoColorIntensity === 50 && "text-blue-600 dark:text-blue-400 font-medium")} onClick={() => { updateLogoColorIntensity(50); }}>Thang xám</span>
                  <span className={cn("cursor-pointer hover:text-slate-600 dark:hover:text-slate-300", selectedLogoColorIntensity === 100 && "text-blue-600 dark:text-blue-400 font-medium")} onClick={() => { updateLogoColorIntensity(100); }}>Trắng</span>
                </div>
              </div>
            </div>
          </SubSection>
        )}

        <SubSection
          icon={Handshake}
          title={`Logo đối tác (${items.length})`}
          open={openSections.partners}
          onOpenChange={(open) => toggleSection('partners', open)}
          actions={actions}
        >
          <div className="space-y-2">
            <MultiImageUploader<PartnerItem>
              items={items}
              onChange={setItems}
              folder="partners"
              imageKey="url"
              extraFields={[
                { key: 'name', placeholder: 'Tên đối tác / thương hiệu', type: 'text' },
                { key: 'link', placeholder: 'Link website đối tác', type: 'url' }
              ]}
              minItems={1}
              maxItems={60}
              aspectRatio="video"
              columns={4}
              showReorder={true}
              addButtonText="Thêm logo"
              layout="vertical"
              enableCrop
              cropOnUpload={false}
              cropAspectRatio={cropAspectRatio}
              deleteMode="defer"
              imageFit="contain"
            />
          </div>
        </SubSection>
      </div>
    </div>
  );
};
