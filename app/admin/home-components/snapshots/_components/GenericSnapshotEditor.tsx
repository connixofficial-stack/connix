'use client';

import React, { useState, useMemo } from 'react';

import { toast } from 'sonner';
import { extractSectionHeaderConfig } from '../../_shared/hooks/useSectionHeaderState';
import { HeaderConfigSection } from '../../_shared/components/HeaderConfigSection';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import { saveSnapshotComponent } from '../_lib/snapshotComponentSave';

export interface BaseHeaderConfig {
  hideHeader: boolean;
  showTitle: boolean;
  subtitle: string;
  showSubtitle: boolean;
  headerAlign: 'left' | 'center' | 'right';
  titleColorPrimary: boolean;
  subtitleAboveTitle: boolean;
  uppercaseText: boolean;
  showBadge: boolean;
  badgeText: string;
}

export interface SnapshotAdapter<TState> {
  normalizeState: (rawConfig: Record<string, any>) => TState;
  toConfig: (state: TState, headerConfig: BaseHeaderConfig) => Record<string, any>;
  renderForm: (
    state: TState,
    setState: React.Dispatch<React.SetStateAction<TState>>,
    colors: { primary: string; secondary: string; mode: 'single' | 'dual' },
  ) => React.ReactNode;
  renderPreview: (
    state: TState,
    setState: React.Dispatch<React.SetStateAction<TState>>,
    title: string,
    headerConfig: BaseHeaderConfig,
    colors: { primary: string; secondary: string; mode: 'single' | 'dual' },
    fontStyle: React.CSSProperties,
    fontClassName: string
  ) => React.ReactNode;
}

interface GenericSnapshotEditorProps<TState> {
  component: any;
  snapshotId: string;
  payload: any;
  snapshotLabel: string;
  decodedKey: string;
  updateSnapshot: any;
  effectiveColors: { primary: string; secondary: string; mode: 'single' | 'dual' };
  fontStyle: React.CSSProperties;
  onCancel: () => void;
  adapter: SnapshotAdapter<TState>;
}

export function GenericSnapshotEditor<TState>({
  component,
  snapshotId,
  payload,
  snapshotLabel,
  decodedKey,
  updateSnapshot,
  effectiveColors,
  fontStyle,
  onCancel,
  adapter,
}: GenericSnapshotEditorProps<TState>) {
  const rawConfig = useMemo(() => (component.config || {}) as Record<string, any>, [component.config]);
  
  const [title, setTitle] = useState(component.title || '');
  const [active, setActive] = useState(component.active ?? true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Header Config State
  const initialHeader = useMemo(() => {
    const extracted = extractSectionHeaderConfig(rawConfig);
    return {
      hideHeader: extracted.hideHeader ?? false,
      showTitle: extracted.showTitle ?? true,
      subtitle: extracted.subtitle ?? '',
      showSubtitle: extracted.showSubtitle ?? true,
      headerAlign: (extracted.headerAlign === 'center' || extracted.headerAlign === 'right') ? extracted.headerAlign as 'center' | 'left' | 'right' : 'left',
      titleColorPrimary: extracted.titleColorPrimary ?? false,
      subtitleAboveTitle: extracted.subtitleAboveTitle ?? false,
      uppercaseText: extracted.uppercaseText ?? false,
      showBadge: extracted.showBadge ?? true,
      badgeText: extracted.badgeText ?? '',
    };
  }, [rawConfig]);

  const [headerConfig, setHeaderConfig] = useState<BaseHeaderConfig>(initialHeader);
  const { openSections: headerOpenSections, toggleSection: toggleHeaderSection } = useFormSectionsState(['header'], false);

  // Component Specific State
  const [state, setState] = useState<TState>(() => adapter.normalizeState(rawConfig));

  // Determine if there are changes
  const initialConfigSnapshot = useMemo(() => JSON.stringify(adapter.toConfig(adapter.normalizeState(rawConfig), initialHeader)), [adapter, rawConfig, initialHeader]);
  const currentConfigSnapshot = useMemo(() => JSON.stringify(adapter.toConfig(state, headerConfig)), [adapter, state, headerConfig]);
  
  const hasChanges = 
    title !== component.title || 
    active !== component.active || 
    initialConfigSnapshot !== currentConfigSnapshot;

  const handleSave = async (e?: React.FormEvent) => {
    if (e) {e.preventDefault();}
    if (isSaving || !hasChanges) {return;}

    setIsSaving(true);
    try {
      const nextConfig = adapter.toConfig(state, headerConfig);

      await saveSnapshotComponent({
        active,
        config: nextConfig,
        component,
        decodedKey,
        label: snapshotLabel,
        payload,
        snapshotId,
        title,
        updateSnapshot,
      });
      
      toast.success('Đã lưu component');
      onCancel(); // Return to list
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể lưu component');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <form onSubmit={handleSave}>
        <HeaderConfigSection
          hideHeader={headerConfig.hideHeader}
          title={title}
          showTitle={headerConfig.showTitle}
          subtitle={headerConfig.subtitle}
          showSubtitle={headerConfig.showSubtitle}
          headerAlign={headerConfig.headerAlign}
          titleColorPrimary={headerConfig.titleColorPrimary}
          subtitleAboveTitle={headerConfig.subtitleAboveTitle}
          uppercaseText={headerConfig.uppercaseText}
          showBadge={headerConfig.showBadge}
          badgeText={headerConfig.badgeText}
          
          onHideHeaderChange={(val) => setHeaderConfig(p => ({ ...p, hideHeader: val }))}
          onTitleChange={setTitle}
          onShowTitleChange={(val) => setHeaderConfig(p => ({ ...p, showTitle: val }))}
          onSubtitleChange={(val) => setHeaderConfig(p => ({ ...p, subtitle: val }))}
          onShowSubtitleChange={(val) => setHeaderConfig(p => ({ ...p, showSubtitle: val }))}
          onHeaderAlignChange={(val) => setHeaderConfig(p => ({ ...p, headerAlign: val }))}
          onTitleColorPrimaryChange={(val) => setHeaderConfig(p => ({ ...p, titleColorPrimary: val }))}
          onSubtitleAboveTitleChange={(val) => setHeaderConfig(p => ({ ...p, subtitleAboveTitle: val }))}
          onUppercaseTextChange={(val) => setHeaderConfig(p => ({ ...p, uppercaseText: val }))}
          onShowBadgeChange={(val) => setHeaderConfig(p => ({ ...p, showBadge: val }))}
          onBadgeTextChange={(val) => setHeaderConfig(p => ({ ...p, badgeText: val }))}
          
          expanded={headerOpenSections.header}
          onExpandedChange={(open) => toggleHeaderSection('header', open)}
          titleRequired={true}
          titleLabel="Tiêu đề hiển thị"
          titlePlaceholder="Nhập tiêu đề component..."
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6 mt-6">
          <div>
            {adapter.renderForm(state, setState, effectiveColors)}
          </div>
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            {adapter.renderPreview(state, setState, title, headerConfig, effectiveColors, fontStyle, "font-active")}
          </div>
        </div>

        <HomeComponentStickyFooter
          isSubmitting={isSaving}
          hasChanges={hasChanges}
          onCancel={onCancel}
          submitLabel="Lưu thay đổi"
          active={active}
          onActiveChange={setActive}
        />
      </form>
    </div>
  );
}
