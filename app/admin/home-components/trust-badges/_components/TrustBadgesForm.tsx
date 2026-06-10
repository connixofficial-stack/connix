import React from 'react';
import { Shield } from 'lucide-react';
import { Label, cn } from '../../../components/ui';
import { MultiImageUploader } from '../../../components/MultiImageUploader';
import { CollapsibleSubSection as SubSection } from '../../_shared/components/CollapsibleSubSection';
import { HomeComponentDisplaySettingsSection } from '../../_shared/components/HomeComponentDisplaySettingsSection';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { FormSectionsToggleAllButton } from '../../_shared/components/FormSectionsToggleAllButton';
import type { GalleryItem, TrustBadgesCornerRadius, TrustBadgesStyle } from '../../gallery/_types';
import { AiTrustBadgesImport } from '../../gallery/_components/AiTrustBadgesImport';
import { DEFAULT_STACK_DESCRIPTION, DEFAULT_STACK_HEADING, DEFAULT_TRUST_CUE_TEXT, TRUST_BADGES_A4_ASPECT_RATIO } from '../../gallery/_components/TrustBadgesSectionShared';
import type { SectionSpacing } from '../../_shared/types/sectionSpacing';

export function TrustBadgesForm({
  items,
  setItems,
  cornerRadius,
  setCornerRadius,
  desktopColumns,
  setDesktopColumns,
  selectedStyle,
  trustCueText,
  setTrustCueText,
  stackHeading,
  setStackHeading,
  stackDescription,
  setStackDescription,
  spacing,
  setSpacing,
  onAiImport,
  defaultExpanded = true,
  actions,
}: {
  items: GalleryItem[];
  setItems: (items: GalleryItem[]) => void;
  cornerRadius: TrustBadgesCornerRadius;
  setCornerRadius: (value: TrustBadgesCornerRadius) => void;
  desktopColumns: 3 | 4;
  setDesktopColumns: (value: 3 | 4) => void;
  selectedStyle?: TrustBadgesStyle;
  trustCueText: string;
  setTrustCueText: (value: string) => void;
  stackHeading: string;
  setStackHeading: (value: string) => void;
  stackDescription: string;
  setStackDescription: (value: string) => void;
  spacing: SectionSpacing;
  setSpacing: (value: SectionSpacing) => void;
  onAiImport?: (items: GalleryItem[]) => void;
  defaultExpanded?: boolean;
  actions?: React.ReactNode;
}) {
  const { openSections, toggleSection, hasClosedSection, handleToggleAll } = useFormSectionsState(
    ['settings', 'stackContent', 'badges'],
    defaultExpanded
  );

  return (
    <div className="mb-6 space-y-3">
      <FormSectionsToggleAllButton
        hasClosedSection={hasClosedSection}
        onToggleAll={handleToggleAll}
      />
      <HomeComponentDisplaySettingsSection
        open={openSections.settings}
        onOpenChange={(open) => toggleSection('settings', open)}
        cornerRadius={cornerRadius}
        onCornerRadiusChange={setCornerRadius}
        spacing={spacing}
        onSpacingChange={setSpacing}
      >
        <div className="space-y-2">
          <Label>Số cột desktop</Label>
          <div className="grid grid-cols-2 gap-2 md:max-w-xs">
            {[3, 4].map((option) => {
              const selected = desktopColumns === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setDesktopColumns(option as 3 | 4)}
                  className={cn(
                    'h-9 rounded-md border text-xs transition-colors',
                    selected
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300'
                      : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
                  )}
                >
                  {option} cột
                </button>
              );
            })}
          </div>
        </div>
      </HomeComponentDisplaySettingsSection>

      {selectedStyle === 'stack' && (
        <SubSection
          icon={Shield}
          title="Nội dung layout Danh sách"
          open={openSections.stackContent}
          onOpenChange={(open) => toggleSection('stackContent', open)}
        >
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nhãn tin cậy</Label>
              <input
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                value={trustCueText}
                onChange={(event) => { setTrustCueText(event.target.value); }}
                placeholder={DEFAULT_TRUST_CUE_TEXT}
              />
            </div>

            <div className="space-y-2">
              <Label>Tiêu đề khối</Label>
              <input
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                value={stackHeading}
                onChange={(event) => { setStackHeading(event.target.value); }}
                placeholder={DEFAULT_STACK_HEADING}
              />
            </div>
          </div>

          <div className="mt-3 space-y-2">
            <Label>Mô tả khối</Label>
            <textarea
              className="flex min-h-20 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              value={stackDescription}
              onChange={(event) => { setStackDescription(event.target.value); }}
              placeholder={DEFAULT_STACK_DESCRIPTION}
            />
          </div>
        </SubSection>
      )}

      <SubSection
          icon={Shield}
          title={`Chứng nhận (${items.length})`}
          open={openSections.badges}
          onOpenChange={(open) => toggleSection('badges', open)}
          actions={(
          <>
            {actions}
            {onAiImport ? <AiTrustBadgesImport onApply={onAiImport} /> : null}
          </>
        )}
      >
        <MultiImageUploader<GalleryItem>
          items={items}
          onChange={setItems}
          folder="trust-badges"
          imageKey="url"
          extraFields={[{ key: 'name', placeholder: 'Tên chứng nhận (VD: ISO 9001)', type: 'text' }]}
          minItems={1}
          maxItems={20}
          aspectRatio="auto"
          imageAspectRatio={TRUST_BADGES_A4_ASPECT_RATIO}
          columns={3}
          showReorder={true}
          addButtonText="Thêm chứng nhận"
          emptyText="Chưa có chứng nhận nào"
          layout="vertical"
          enableCrop
          cropOnUpload={false}
          cropAspectRatio={TRUST_BADGES_A4_ASPECT_RATIO}
          deleteMode="defer"
          imageFit="contain"
        />
      </SubSection>
    </div>
  );
}
