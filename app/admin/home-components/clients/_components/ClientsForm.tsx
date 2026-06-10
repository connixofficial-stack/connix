'use client';
 
import React from 'react';
import { ImageIcon } from 'lucide-react';
import { MultiImageUploader } from '@/app/admin/components/MultiImageUploader';
import { CollapsibleSubSection as SubSection } from '../../_shared/components/CollapsibleSubSection';
import { HomeComponentDisplaySettingsSection } from '../../_shared/components/HomeComponentDisplaySettingsSection';
import type { SectionSpacing } from '../../_shared/types/sectionSpacing';
import {
  CLIENTS_CROP_ASPECT_RATIO_BY_STYLE,
} from '../_lib/constants';
import type { ClientEditorItem, ClientsCornerRadius, ClientsStyle } from '../_types';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { FormSectionsToggleAllButton } from '../../_shared/components/FormSectionsToggleAllButton';
 
interface ClientsFormProps {
  action?: React.ReactNode;
  cornerRadius?: ClientsCornerRadius;
  items: ClientEditorItem[];
  setCornerRadius?: (value: ClientsCornerRadius) => void;
  setSpacing?: (value: SectionSpacing) => void;
  selectedStyle?: ClientsStyle;
  spacing?: SectionSpacing;
  setItems: (items: ClientEditorItem[]) => void;
  maxItems?: number;
  defaultExpanded?: boolean;
}
 
export const ClientsForm = ({
  action,
  cornerRadius = 'lg',
  items,
  setCornerRadius,
  setSpacing,
  selectedStyle = 'layout02',
  spacing = 'normal',
  setItems,
  maxItems = 4,
  defaultExpanded = true,
}: ClientsFormProps) => {
  const cropAspectRatio = CLIENTS_CROP_ASPECT_RATIO_BY_STYLE[selectedStyle];
 
  const { openSections, toggleSection, hasClosedSection, handleToggleAll } = useFormSectionsState(
    ['settings', 'banners'],
    defaultExpanded
  );
 
  return (
    <>
      <FormSectionsToggleAllButton
        hasClosedSection={hasClosedSection}
        onToggleAll={handleToggleAll}
      />
 
      {setSpacing && setCornerRadius ? (
        <div className="mb-6">
          <HomeComponentDisplaySettingsSection
            open={openSections.settings}
            onOpenChange={(open) => toggleSection('settings', open)}
            cornerRadius={cornerRadius}
            onCornerRadiusChange={setCornerRadius}
            spacing={spacing}
            onSpacingChange={setSpacing}
          />
        </div>
      ) : null}
 
      <SubSection
        icon={ImageIcon}
        title={`Ảnh banner (${items.length}/${maxItems})`}
        open={openSections.banners}
        onOpenChange={(open) => toggleSection('banners', open)}
        className="mb-6"
      >
        <MultiImageUploader<ClientEditorItem>
          items={items}
          onChange={setItems}
          folder="brand-banners"
          imageKey="url"
          extraFields={[
            { key: 'link', placeholder: 'Link khi click ảnh (tùy chọn)', type: 'url' },
          ]}
          minItems={1}
          maxItems={maxItems}
          aspectRatio="banner"
          imageAspectRatio={cropAspectRatio}
          columns={2}
          showReorder={true}
          addButtonText="Thêm ảnh banner"
          emptyText="Chưa có ảnh banner nào"
          layout="vertical"
          enableCrop
          cropOnUpload={false}
          cropAspectRatio={cropAspectRatio}
          deleteMode="defer"
        />
        {action ? (
          <div className="mt-4 flex justify-start">
            {action}
          </div>
        ) : null}
      </SubSection>
    </>
  );
};
