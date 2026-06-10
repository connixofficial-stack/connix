'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import type { Id } from "@/convex/_generated/dataModel";
import { api } from '@/convex/_generated/api';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAdminMutationErrorMessage } from '@/app/admin/lib/mutation-error';
import { Button, Card, CardContent, Input, Label } from '../../components/ui';
import { CopyableInput } from '../../components/CopyTextButton';
import { getAttributeIconComponent } from '../../attribute-groups/_lib/iconRegistry';

const MODULE_KEY = 'productTypes';

interface PriceRange {
  label: string;
  slug: string;
  minPrice?: number;
  maxPrice?: number;
}

export default function ProductTypeCreatePage() {
  const router = useRouter();
  const createType = useMutation(api.productTypes.create);
  const fieldsData = useQuery(api.admin.modules.listEnabledModuleFields, { moduleKey: MODULE_KEY });
  const masterPriceRangesData = useQuery(api.settings.getValue, { key: 'global_price_ranges', defaultValue: [] });
  const updateSettings = useMutation(api.settings.set);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);
  const [attributeGroupIds, setAttributeGroupIds] = useState<Id<"attributeGroups">[]>([]);
  const [categoryIds, setCategoryIds] = useState<Id<"productCategories">[]>([]);
  const [priceRanges, setPriceRanges] = useState<PriceRange[]>([]);
  
  // Price range temporary states
  const [newRangeLabel, setNewRangeLabel] = useState('');
  const [newRangeSlug, setNewRangeSlug] = useState('');
  const [newRangeMin, setNewRangeMin] = useState('');
  const [newRangeMax, setNewRangeMax] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const attributeGroups = useQuery(api.attributeGroups.listAll, {});
  const productCategories = useQuery(api.productCategories.listAll, {});

  const masterPriceRanges = useMemo(() => {
    return (masterPriceRangesData as PriceRange[]) || [];
  }, [masterPriceRangesData]);

  const mergedPriceRanges = useMemo(() => {
    const masterMap = new Map(masterPriceRanges.map(r => [r.slug, r]));
    const result = [...masterPriceRanges];
    priceRanges.forEach(r => {
      if (!masterMap.has(r.slug)) {
        result.push(r);
      }
    });
    return result;
  }, [masterPriceRanges, priceRanges]);

  const enabledFields = useMemo(() => {
    const fields = new Set<string>();
    fieldsData?.forEach(f => fields.add(f.fieldKey));
    return fields;
  }, [fieldsData]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    const generatedSlug = val.toLowerCase()
      .normalize("NFD").replaceAll(/[\u0300-\u036F]/g, "")
      .replaceAll(/[đĐ]/g, "d")
      .replaceAll(/[^a-z0-9\s]/g, '')
      .replaceAll(/\s+/g, '-');
    setSlug(generatedSlug);
  };

  const handleRangeLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewRangeLabel(val);
    const generatedSlug = val.toLowerCase()
      .normalize("NFD").replaceAll(/[\u0300-\u036F]/g, "")
      .replaceAll(/[đĐ]/g, "d")
      .replaceAll(/[^a-z0-9\s]/g, '')
      .replaceAll(/\s+/g, '-');
    setNewRangeSlug(generatedSlug);
  };

  const handleTogglePriceRange = (range: PriceRange, checked: boolean) => {
    if (checked) {
      setPriceRanges(prev => {
        if (prev.some(r => r.slug === range.slug)) return prev;
        return [...prev, range];
      });
    } else {
      setPriceRanges(prev => prev.filter(r => r.slug !== range.slug));
    }
  };

  const handleAddPriceRange = async () => {
    if (!newRangeLabel.trim() || !newRangeSlug.trim()) {
      toast.error('Vui lòng nhập tên và slug nấc giá');
      return;
    }
    
    if (masterPriceRanges.some(r => r.slug === newRangeSlug)) {
      toast.error('Slug nấc giá đã tồn tại trong danh sách dùng chung');
      return;
    }

    const min = newRangeMin ? parseFloat(newRangeMin) : undefined;
    const max = newRangeMax ? parseFloat(newRangeMax) : undefined;

    if (min !== undefined && max !== undefined && min >= max) {
      toast.error('Giá tối thiểu phải nhỏ hơn giá tối đa');
      return;
    }

    const newRange: PriceRange = {
      label: newRangeLabel.trim(),
      slug: newRangeSlug.trim(),
      minPrice: min,
      maxPrice: max
    };

    try {
      const updatedMaster = [...masterPriceRanges, newRange];
      await updateSettings({
        group: 'productTypes',
        key: 'global_price_ranges',
        value: updatedMaster
      });

      // Tự động tích chọn cho Product Type hiện tại
      setPriceRanges(prev => [...prev, newRange]);
      toast.success('Đã thêm nấc giá mới dùng chung');

      setNewRangeLabel('');
      setNewRangeSlug('');
      setNewRangeMin('');
      setNewRangeMax('');
    } catch (err) {
      console.error(err);
      toast.error('Không thể cập nhật danh sách nấc giá dùng chung');
    }
  };

  const handleRemoveFromMaster = async (slug: string) => {
    try {
      const updatedMaster = masterPriceRanges.filter(r => r.slug !== slug);
      await updateSettings({
        group: 'productTypes',
        key: 'global_price_ranges',
        value: updatedMaster
      });

      // Đồng thời bỏ tích chọn local
      setPriceRanges(prev => prev.filter(r => r.slug !== slug));
      toast.success('Đã xóa nấc giá khỏi danh sách dùng chung');
    } catch (err) {
      console.error(err);
      toast.error('Không thể xóa nấc giá');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {return;}

    setIsSubmitting(true);
    try {
      await createType({
        active,
        description: description.trim() || undefined,
        name: name.trim(),
        slug: slug.trim(),
        attributeGroupIds,
        categoryIds,
        priceRanges,
      });
      toast.success('Tạo kiểu thành công');
      router.push('/admin/product-types');
    } catch (error) {
      toast.error(getAdminMutationErrorMessage(error, 'Không thể tạo kiểu'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Thêm kiểu sản phẩm</h1>
          <Link href="/admin/product-types" className="text-sm text-orange-600 hover:underline">
            Quay lại danh sách
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <Card>
          <form onSubmit={handleSubmit}>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Tên kiểu <span className="text-red-500">*</span></Label>
                <CopyableInput
                  value={name} 
                  onChange={handleNameChange} 
                  copyLabel="tên kiểu"
                  required 
                  placeholder="Nhập tên kiểu..." 
                  autoFocus 
                />
              </div>

              <div className="space-y-2">
                <Label>Slug</Label>
                <Input 
                  value={slug} 
                  onChange={(e) =>{  setSlug(e.target.value); }} 
                  placeholder="tu-dong-tao-tu-ten" 
                  className="font-mono text-sm" 
                />
              </div>

              {enabledFields.has('description') && (
                <div className="space-y-2">
                  <Label>Mô tả</Label>
                  <textarea
                    value={description}
                    onChange={(e) =>{  setDescription(e.target.value); }}
                    placeholder="Mô tả ngắn về kiểu sản phẩm..."
                    className="w-full min-h-[80px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <select 
                  value={active ? 'active' : 'inactive'}
                  onChange={(e) =>{  setActive(e.target.value === 'active'); }}
                  className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                >
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Ẩn</option>
                </select>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Label>Các nhóm thuộc tính (Được gán vào kiểu này)</Label>
                <div className="border border-slate-200 dark:border-slate-700 rounded-md p-3 max-h-60 overflow-y-auto space-y-2 bg-slate-50 dark:bg-slate-900/30">
                  {attributeGroups === undefined ? (
                    <p className="text-sm text-slate-500 italic">Đang tải...</p>
                  ) : attributeGroups.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">Chưa có nhóm thuộc tính nào.</p>
                  ) : (
                    attributeGroups.map(group => (
                      <label key={group._id} className="flex items-center gap-2 cursor-pointer py-0.5 hover:text-orange-600">
                        <input
                          type="checkbox"
                          checked={attributeGroupIds.includes(group._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAttributeGroupIds(prev => [...prev, group._id]);
                            } else {
                              setAttributeGroupIds(prev => prev.filter(id => id !== group._id));
                            }
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                        />
                        {(() => {
                          const IconComponent = getAttributeIconComponent(group.iconPath);
                          const iconColor = group.displayConfig?.iconColor || group.displayConfig?.color || '#ea580c';
                          return <IconComponent size={15} style={{ color: iconColor }} />;
                        })()}
                        <span className="text-sm">{group.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
            
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 rounded-b-lg flex justify-end gap-3">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() =>{  router.push('/admin/product-types'); }}
              >
                Hủy bỏ
              </Button>
              <Button type="submit" variant="accent" disabled={isSubmitting}>
                {isSubmitting && <Loader2 size={16} className="animate-spin mr-2" />}
                Tạo kiểu
              </Button>
            </div>
          </form>
        </Card>

        <div className="space-y-6">
          {/* Gán danh mục sản phẩm */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-base font-semibold">Danh mục sản phẩm gán vào kiểu này</Label>
                <p className="text-xs text-slate-500">Các danh mục được gán sẽ hoạt động theo liên kết Phân loại & Thuộc tính sản phẩm.</p>
                <p className="text-[11px] text-orange-600 dark:text-orange-400 mt-1 italic font-medium">Lưu ý: Mỗi danh mục chỉ thuộc tối đa một kiểu sản phẩm. Nếu bạn gán một danh mục đã thuộc kiểu sản phẩm khác vào kiểu này, liên kết cũ của danh mục đó sẽ được tự động thay thế bằng kiểu này.</p>
                <div className="border border-slate-200 dark:border-slate-700 rounded-md p-3 max-h-60 overflow-y-auto space-y-2 bg-slate-50 dark:bg-slate-900/30">
                  {productCategories === undefined ? (
                    <p className="text-sm text-slate-500 italic">Đang tải...</p>
                  ) : productCategories.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">Chưa có danh mục sản phẩm nào.</p>
                  ) : (
                    productCategories.map(cat => (
                      <label key={cat._id} className="flex items-center gap-2 cursor-pointer py-0.5 hover:text-orange-600">
                        <input
                          type="checkbox"
                          checked={categoryIds.includes(cat._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCategoryIds(prev => [...prev, cat._id]);
                            } else {
                              setCategoryIds(prev => prev.filter(id => id !== cat._id));
                            }
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                        />
                        <span className="text-sm font-medium">{cat.name}</span>
                        <span className="text-xs text-slate-400 font-mono">({cat.slug})</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CRUD Price Ranges */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-base font-semibold">Các nấc giá bán dùng chung</Label>
                <p className="text-xs text-slate-500">Tích chọn các mức khoảng giá dùng chung để áp dụng cho kiểu sản phẩm này.</p>
                
                {/* List Price Ranges with Checkbox */}
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1 border border-slate-100 dark:border-slate-800 rounded-md p-2 bg-slate-50/50 dark:bg-slate-900/10">
                  {mergedPriceRanges.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2 text-center">Chưa có nấc giá dùng chung nào. Hãy thêm ở dưới.</p>
                  ) : (
                    mergedPriceRanges.map((range) => {
                      const isChecked = priceRanges.some(r => r.slug === range.slug);
                      const isGlobal = masterPriceRanges.some(r => r.slug === range.slug);
                      return (
                        <div 
                          key={range.slug} 
                          className="flex justify-between items-center p-2 border border-slate-100 dark:border-slate-800 rounded-md bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors"
                        >
                          <label className="flex items-start gap-2.5 cursor-pointer flex-1 py-1">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => handleTogglePriceRange(range, e.target.checked)}
                              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                            />
                            <div className="space-y-0.5">
                              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{range.label}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{range.slug}</div>
                              <div className="text-[10px] text-slate-500">
                                {range.minPrice !== undefined && `Từ: ${range.minPrice.toLocaleString()}đ`} 
                                {range.maxPrice !== undefined && ` - Đến: ${range.maxPrice.toLocaleString()}đ`}
                                {range.minPrice === undefined && range.maxPrice === undefined && 'Không giới hạn giá'}
                              </div>
                            </div>
                          </label>
                          {isGlobal && (
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleRemoveFromMaster(range.slug)}
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                              title="Xóa khỏi danh sách dùng chung"
                            >
                              <Trash2 size={12} />
                            </Button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tạo nấc giá mới dùng chung</Label>
                  <p className="text-[10px] text-slate-400 mb-2">Thêm nấc giá mới vào thư viện dùng chung cho tất cả các kiểu sản phẩm.</p>
                  
                  {/* Form thêm Price Range */}
                  <div className="p-3 border border-slate-100 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-900/50 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px]">Tên nấc giá</Label>
                        <Input 
                          value={newRangeLabel} 
                          onChange={handleRangeLabelChange} 
                          placeholder="VD: Dưới 500k..." 
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Slug</Label>
                        <Input 
                          value={newRangeSlug} 
                          onChange={(e) => setNewRangeSlug(e.target.value)} 
                          placeholder="duoi-500k" 
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px]">Giá tối thiểu (Đồng)</Label>
                        <Input 
                          type="number"
                          value={newRangeMin} 
                          onChange={(e) => setNewRangeMin(e.target.value)} 
                          placeholder="Trống = Không giới hạn" 
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Giá tối đa (Đồng)</Label>
                        <Input 
                          type="number"
                          value={newRangeMax} 
                          onChange={(e) => setNewRangeMax(e.target.value)} 
                          placeholder="Trống = Không giới hạn" 
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                    <Button 
                      type="button" 
                      size="sm" 
                      onClick={handleAddPriceRange} 
                      className="w-full h-8 text-xs gap-1"
                    >
                      <Plus size={12} /> Thêm vào danh sách dùng chung
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
