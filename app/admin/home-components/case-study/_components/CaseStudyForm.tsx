'use client';

import React from 'react';
import { BriefcaseBusiness, Plus, Trash2 } from 'lucide-react';
import { Button, Input, Label, cn } from '../../../components/ui';
import { SettingsImageUploader } from '../../../components/SettingsImageUploader';
import { AiDemoCaseStudyImport } from '../../product-list/_components/AiDemoProductsImport';
import { CollapsibleSubSection as SubSection } from '../../_shared/components/CollapsibleSubSection';
import { HomeComponentDisplaySettingsSection } from '../../_shared/components/HomeComponentDisplaySettingsSection';
import type { CaseStudyCornerRadius, CaseStudyDesktopColumns, CaseStudyProject, CaseStudySpacing } from '../_types';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { FormSectionsToggleAllButton } from '../../_shared/components/FormSectionsToggleAllButton';

export const CaseStudyForm = ({
  projects,
  onChange,
  cornerRadius,
  setCornerRadius,
  desktopColumns,
  setDesktopColumns,
  spacing,
  setSpacing,
  defaultExpanded = true,
}: {
  projects: CaseStudyProject[];
  onChange: (projects: CaseStudyProject[]) => void;
  cornerRadius: CaseStudyCornerRadius;
  setCornerRadius: (value: CaseStudyCornerRadius) => void;
  desktopColumns: CaseStudyDesktopColumns;
  setDesktopColumns: (value: CaseStudyDesktopColumns) => void;
  spacing: CaseStudySpacing;
  setSpacing: (value: CaseStudySpacing) => void;
  defaultExpanded?: boolean;
}) => {
  const activeSections = React.useMemo(() => ['settings', 'source'], []);
  const { openSections, toggleSection, hasClosedSection, handleToggleAll } = useFormSectionsState(activeSections, defaultExpanded);

  const demoImages = [
    '/demo/brand-banners/banner-1.webp',
    '/demo/brand-banners/banner-2.webp',
    '/demo/brand-banners/banner-3.webp',
    '/demo/brand-banners/banner-4.webp',
  ];

  const handleAddProject = () => {
    onChange([
      ...projects,
      { category: '', description: '', id: Date.now(), image: '', link: '', title: '' },
    ]);
  };

  const handleRemoveProject = (id: number | string) => {
    onChange(projects.filter((project) => project.id !== id));
  };

  const updateProject = (id: number | string, field: keyof CaseStudyProject, value: string) => {
    onChange(projects.map((project) => (project.id === id ? { ...project, [field]: value } : project)));
  };

  const handleUseDemoImages = () => {
    const sourceProjects = projects.length > 0
      ? projects
      : [
        { category: 'Website', description: 'Thiết kế website thương hiệu', id: 'demo-project-1', image: '', link: '', title: 'Website thương hiệu' },
        { category: 'Ecommerce', description: 'Giao diện bán hàng chuyển đổi cao', id: 'demo-project-2', image: '', link: '', title: 'Cửa hàng trực tuyến' },
        { category: 'Mobile App', description: 'Ứng dụng đặt lịch và chăm sóc khách hàng', id: 'demo-project-3', image: '', link: '', title: 'Ứng dụng dịch vụ' },
        { category: 'Landing Page', description: 'Trang chiến dịch ra mắt sản phẩm', id: 'demo-project-4', image: '', link: '', title: 'Chiến dịch marketing' },
      ];

    onChange(sourceProjects.map((project, index) => ({
      ...project,
      image: demoImages[index % demoImages.length],
    })));
  };

  return (
    <div className="mb-6 space-y-3">
      <FormSectionsToggleAllButton hasClosedSection={hasClosedSection} onToggleAll={handleToggleAll} />

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
              <div className="grid grid-cols-2 gap-2">
                {[3, 4].map((option) => {
                  const selected = desktopColumns === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setDesktopColumns(option as CaseStudyDesktopColumns)}
                      className={cn(
                        'h-10 rounded-md border text-xs transition-colors',
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
              <p className="text-xs text-slate-500">4 cột: tablet/mobile 2. 3 cột: tablet 3, mobile 1.</p>
            </div>
      </HomeComponentDisplaySettingsSection>

      <SubSection
        icon={BriefcaseBusiness}
        title={`Dự án tiêu biểu (${projects.length})`}
        open={openSections.source}
        onOpenChange={(open) => toggleSection('source', open)}
        actions={(
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleUseDemoImages}>
              Dùng ảnh demo
            </Button>
            <AiDemoCaseStudyImport onApply={(items) => onChange(items as CaseStudyProject[])} />
            <Button type="button" variant="outline" size="sm" onClick={handleAddProject} className="gap-2">
              <Plus size={14} /> Thêm dự án
            </Button>
          </div>
        )}
      >
        <div className="space-y-4">
        {projects.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            Chưa có dự án nào. Nhấn “Thêm dự án” để bắt đầu.
          </div>
        ) : (
          projects.map((project, idx) => (
            <div key={project.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <Label>Dự án {idx + 1}</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-red-500 h-8 w-8"
                  onClick={() =>{  handleRemoveProject(project.id); }}
                >
                  <Trash2 size={14} />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm mb-2 block">Hình ảnh dự án</Label>
                  <SettingsImageUploader
                    value={project.image}
                    onChange={(url) =>{  updateProject(project.id, 'image', url ?? ''); }}
                    folder="case-studies"
                    previewSize="lg"
                    cropAspectRatio="landscape43"
                  />
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-slate-500">Tên dự án</Label>
                      <Input
                        placeholder="VD: Website ABC Corp"
                        value={project.title}
                        onChange={(e) =>{  updateProject(project.id, 'title', e.target.value); }}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">Danh mục</Label>
                      <Input
                        placeholder="VD: Website, Mobile..."
                        value={project.category}
                        onChange={(e) =>{  updateProject(project.id, 'category', e.target.value); }}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Mô tả ngắn</Label>
                    <Input
                      placeholder="Mô tả ngắn về dự án"
                      value={project.description}
                      onChange={(e) =>{  updateProject(project.id, 'description', e.target.value); }}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Link chi tiết</Label>
                    <Input
                      placeholder="https://example.com/project"
                      value={project.link}
                      onChange={(e) =>{  updateProject(project.id, 'link', e.target.value); }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        </div>
      </SubSection>
    </div>
  );
};
