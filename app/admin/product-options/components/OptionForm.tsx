'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, CardContent, Input, Label } from '../../components/ui';
import { CopyableInput } from '../../components/CopyTextButton';

export type ProductOptionFormValues = {
  active: boolean;
  compareUnit: string;
  displayType: string;
  inputType: string;
  name: string;
  showPriceCompare: boolean;
  slug: string;
  unit: string;
};

interface OptionFormProps {
  initialValues?: ProductOptionFormValues;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (values: ProductOptionFormValues) => Promise<void>;
  submitLabel: string;
  title: string;
  autoSlug?: boolean;
}

const DISPLAY_TYPE_OPTIONS = [
  { label: 'Dropdown', value: 'dropdown' },
  { label: 'Buttons/Pills', value: 'buttons' },
  { label: 'Radio', value: 'radio' },
  { label: 'Color Swatch', value: 'color_swatch' },
  { label: 'Image Swatch', value: 'image_swatch' },
  { label: 'Color Picker', value: 'color_picker' },
  { label: 'Number Input', value: 'number_input' },
  { label: 'Text Input', value: 'text_input' },
];

const INPUT_TYPE_OPTIONS = [
  { label: 'Text', value: 'text' },
  { label: 'Number', value: 'number' },
  { label: 'Color', value: 'color' },
];

const slugify = (value: string) => value
  .toLowerCase()
  .normalize("NFD").replaceAll(/[\u0300-\u036F]/g, '')
  .replaceAll(/[đĐ]/g, 'd')
  .replaceAll(/[^a-z0-9\s]/g, '')
  .replaceAll(/\s+/g, '-')
  .trim();

const buildDefaults = (): ProductOptionFormValues => ({
  active: true,
  compareUnit: '',
  displayType: 'dropdown',
  inputType: '',
  name: '',
  showPriceCompare: false,
  slug: '',
  unit: '',
});

export function OptionForm({
  initialValues,
  isSubmitting,
  onCancel,
  onSubmit,
  submitLabel,
  title,
  autoSlug = false,
}: OptionFormProps) {
  const [form, setForm] = useState<ProductOptionFormValues>(buildDefaults());
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (initialValues) {
      setForm({ ...buildDefaults(), ...initialValues });
    }
  }, [initialValues]);

  const inputTypeOptions = useMemo(() => {
    if (form.displayType === 'color_picker') {
      return INPUT_TYPE_OPTIONS.filter(option => option.value === 'color');
    }
    return INPUT_TYPE_OPTIONS.filter(option => option.value !== 'color');
  }, [form.displayType]);

  const requiresInputType = ['number_input', 'text_input', 'color_picker'].includes(form.displayType);
  const showUnit = form.displayType === 'number_input';
  const showPriceCompare = form.displayType === 'radio';

  const handleNameChange = (value: string) => {
    setForm(prev => ({ ...prev, name: value }));
    if (autoSlug && !slugTouched) {
      setForm(prev => ({ ...prev, slug: slugify(value) }));
    }
  };

  const handleDisplayTypeChange = (value: string) => {
    setForm(prev => {
      let nextInputType = prev.inputType;
      if (value === 'number_input') {nextInputType = 'number';}
      if (value === 'text_input') {nextInputType = 'text';}
      if (value === 'color_picker') {nextInputType = 'color';}
      if (!['number_input', 'text_input', 'color_picker'].includes(value)) {nextInputType = '';}

      return {
        ...prev,
        compareUnit: value === 'radio' ? prev.compareUnit : '',
        inputType: nextInputType,
        showPriceCompare: value === 'radio' ? prev.showPriceCompare : false,
        unit: value === 'number_input' ? prev.unit : '',
        displayType: value,
      };
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) {return;}
    await onSubmit({
      ...form,
      name: form.name.trim(),
      slug: form.slug.trim(),
      compareUnit: form.compareUnit.trim(),
      unit: form.unit.trim(),
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h1>
      </div>

      <Card className="max-w-xl mx-auto md:mx-0">
        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label>Tên option <span className="text-red-500">*</span></Label>
              <CopyableInput
                value={form.name}
                onChange={(e) =>{  handleNameChange(e.target.value); }}
                copyLabel="tên option"
                required
                placeholder="VD: Màu sắc, Kích thước..."
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) =>{
                  setSlugTouched(true);
                  setForm(prev => ({ ...prev, slug: e.target.value }));
                }}
                placeholder="tu-dong-tao-tu-ten"
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label>Kiểu hiển thị</Label>
              <select
                value={form.displayType}
                onChange={(e) =>{  handleDisplayTypeChange(e.target.value); }}
                className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              >
                {DISPLAY_TYPE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {requiresInputType && (
              <div className="space-y-2">
                <Label>Kiểu dữ liệu</Label>
                <select
                  value={form.inputType || inputTypeOptions[0]?.value}
                  onChange={(e) =>{  setForm(prev => ({ ...prev, inputType: e.target.value })); }}
                  className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                >
                  {inputTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            )}

            {showUnit && (
              <div className="space-y-2">
                <Label>Đơn vị</Label>
                <Input
                  value={form.unit}
                  onChange={(e) =>{  setForm(prev => ({ ...prev, unit: e.target.value })); }}
                  placeholder="VD: kg, ml"
                />
              </div>
            )}

            {showPriceCompare && (
              <div className="space-y-2">
                <Label>So sánh giá theo</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.showPriceCompare}
                    onChange={(e) =>{  setForm(prev => ({ ...prev, showPriceCompare: e.target.checked })); }}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-300">Hiển thị giá quy đổi</span>
                </div>
                {form.showPriceCompare && (
                  <Input
                    value={form.compareUnit}
                    onChange={(e) =>{  setForm(prev => ({ ...prev, compareUnit: e.target.value })); }}
                    placeholder='VD: tháng'
                  />
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <select
                value={form.active ? 'active' : 'inactive'}
                onChange={(e) =>{  setForm(prev => ({ ...prev, active: e.target.value === 'active' })); }}
                className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              >
                <option value="active">Hoạt động</option>
                <option value="inactive">Ẩn</option>
              </select>
            </div>
          </CardContent>

          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 rounded-b-lg flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onCancel}>Hủy bỏ</Button>
            <Button type="submit" variant="accent" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : submitLabel}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
