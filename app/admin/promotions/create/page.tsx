'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAdminMutationErrorMessage } from '@/app/admin/lib/mutation-error';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '../../components/ui';
import { CopyableInput } from '../../components/CopyTextButton';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';

const MODULE_KEY = 'promotions';

export default function PromotionCreatePage() {
  const router = useRouter();
  const createPromotion = useMutation(api.promotions.create);
  const featuresData = useQuery(api.admin.modules.listModuleFeatures, { moduleKey: MODULE_KEY });
  const settingsData = useQuery(api.admin.modules.listModuleSettings, { moduleKey: MODULE_KEY });

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [promotionType, setPromotionType] = useState<'coupon' | 'campaign' | 'flash_sale' | 'bundle' | 'loyalty'>('coupon');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed' | 'buy_x_get_y' | 'buy_a_get_b' | 'tiered' | 'free_shipping' | 'gift'>('percent');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [discountConfigText, setDiscountConfigText] = useState('');
  const [applicableTo, setApplicableTo] = useState<'all' | 'products' | 'categories' | 'brands' | 'tags'>('all');
  const [applicableIdsText, setApplicableIdsText] = useState('');
  const [excludeIdsText, setExcludeIdsText] = useState('');
  const [minQuantity, setMinQuantity] = useState<number | undefined>();
  const [customerType, setCustomerType] = useState<'all' | 'new' | 'returning' | 'vip'>('all');
  const [customerTierIdsText, setCustomerTierIdsText] = useState('');
  const [customerGroupIdsText, setCustomerGroupIdsText] = useState('');
  const [minOrderHistory, setMinOrderHistory] = useState<number | undefined>();
  const [minTotalSpent, setMinTotalSpent] = useState<number | undefined>();
  const [minOrderAmount, setMinOrderAmount] = useState<number | undefined>();
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number | undefined>();
  const [usageLimit, setUsageLimit] = useState<number | undefined>();
  const [usagePerCustomer, setUsagePerCustomer] = useState<number | undefined>();
  const [budget, setBudget] = useState<number | undefined>();
  const [scheduleType, setScheduleType] = useState<'always' | 'dateRange' | 'recurring'>('always');
  const [recurringDaysText, setRecurringDaysText] = useState('');
  const [recurringFromTime, setRecurringFromTime] = useState('');
  const [recurringToTime, setRecurringToTime] = useState('');
  const [stackable, setStackable] = useState(true);
  const [priority, setPriority] = useState<number | undefined>();
  const [displayOnPage, setDisplayOnPage] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [thumbnail, setThumbnail] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive' | 'Scheduled'>('Active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get enabled features from system config
  const enabledFeatures = useMemo(() => {
    const features: Record<string, boolean> = {};
    featuresData?.forEach(f => { features[f.featureKey] = f.enabled; });
    return features;
  }, [featuresData]);

  const isFeatureEnabled = (key: string, fallback = true) => enabledFeatures[key] ?? fallback;

  // Sync default discount type from settings
  useEffect(() => {
    if (settingsData) {
      const defaultType = settingsData.find(s => s.settingKey === 'defaultDiscountType')?.value as string;
      if (defaultType === 'fixed' || defaultType === 'percent') {
        setDiscountType(defaultType);
      }
    }
  }, [settingsData]);

  const parseList = (value: string) => value.split(',').map(item => item.trim()).filter(Boolean);

  const parseRecurringDays = (value: string) => {
    const parsed = value
      .split(',')
      .map(item => Number(item.trim()))
      .filter((item) => Number.isInteger(item));
    return parsed.length > 0 ? parsed : undefined;
  };

  const parseTimeToMinutes = (value: string) => {
    if (!value) {return undefined;}
    const [hours, minutes] = value.split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {return undefined;}
    return hours * 60 + minutes;
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const codeLength = (settingsData?.find(s => s.settingKey === 'codeLength')?.value as number) || 8;
    let result = '';
    for (let i = 0; i < codeLength; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCode(result);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCode(e.target.value.toUpperCase());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || (promotionType === 'coupon' && !code.trim())) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    let discountConfig: Record<string, unknown> | undefined;
    if (discountConfigText.trim()) {
      try {
        discountConfig = JSON.parse(discountConfigText);
      } catch {
        toast.error('Cấu hình giảm giá không đúng định dạng JSON');
        return;
      }
    }

    const recurringDays = scheduleType === 'recurring' ? parseRecurringDays(recurringDaysText) : undefined;
    const recurringFrom = scheduleType === 'recurring' ? parseTimeToMinutes(recurringFromTime) : undefined;
    const recurringTo = scheduleType === 'recurring' ? parseTimeToMinutes(recurringToTime) : undefined;
    const recurringHours = scheduleType === 'recurring' && recurringFrom !== undefined && recurringTo !== undefined
      ? { from: recurringFrom, to: recurringTo }
      : undefined;

    setIsSubmitting(true);
    try {
      await createPromotion({
        applicableIds: isFeatureEnabled('enableApplicable') ? parseList(applicableIdsText) : undefined,
        applicableTo: isFeatureEnabled('enableApplicable') ? applicableTo : undefined,
        budget: isFeatureEnabled('enableBudgetLimit') ? budget : undefined,
        code: promotionType === 'coupon' ? code.trim().toUpperCase() : code.trim() || undefined,
        customerGroupIds: isFeatureEnabled('enableCustomerConditions') ? parseList(customerGroupIdsText) : undefined,
        customerTierIds: isFeatureEnabled('enableCustomerConditions') ? parseList(customerTierIdsText) : undefined,
        customerType: isFeatureEnabled('enableCustomerConditions') ? customerType : undefined,
        description: description.trim() || undefined,
        discountConfig: isFeatureEnabled('enableAdvancedDiscount') ? discountConfig : undefined,
        discountType,
        discountValue: discountType === 'percent' || discountType === 'fixed' ? discountValue : undefined,
        displayOnPage: isFeatureEnabled('enableDisplay') ? displayOnPage : undefined,
        endDate: isFeatureEnabled('enableSchedule') && endDate ? new Date(endDate).getTime() : undefined,
        excludeIds: isFeatureEnabled('enableApplicable') ? parseList(excludeIdsText) : undefined,
        featured: isFeatureEnabled('enableDisplay') ? featured : undefined,
        maxDiscountAmount: isFeatureEnabled('enableMaxDiscount') && discountType === 'percent' ? maxDiscountAmount : undefined,
        minOrderAmount: isFeatureEnabled('enableMinOrder') ? minOrderAmount : undefined,
        minOrderHistory: isFeatureEnabled('enableCustomerConditions') ? minOrderHistory : undefined,
        minQuantity: isFeatureEnabled('enableApplicable') ? minQuantity : undefined,
        minTotalSpent: isFeatureEnabled('enableCustomerConditions') ? minTotalSpent : undefined,
        name: name.trim(),
        priority: isFeatureEnabled('enableStacking') ? priority : undefined,
        promotionType,
        recurringDays,
        recurringHours,
        scheduleType: isFeatureEnabled('enableSchedule') ? scheduleType : undefined,
        stackable: isFeatureEnabled('enableStacking') ? stackable : undefined,
        startDate: isFeatureEnabled('enableSchedule') && startDate ? new Date(startDate).getTime() : undefined,
        status,
        thumbnail: isFeatureEnabled('enableDisplay') && thumbnail.trim() ? thumbnail.trim() : undefined,
        usageLimit: isFeatureEnabled('enableUsageLimit') ? usageLimit : undefined,
        usagePerCustomer: isFeatureEnabled('enableUsageLimit') ? usagePerCustomer : undefined,
      });
      toast.success('Tạo khuyến mãi thành công');
      router.push('/admin/promotions');
    } catch (error) {
      toast.error(getAdminMutationErrorMessage(error, 'Không thể tạo khuyến mãi'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Thêm khuyến mãi mới</h1>
          <p className="text-sm text-slate-500 mt-1">Tạo voucher hoặc mã giảm giá mới</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Thông tin cơ bản</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Loại khuyến mãi <span className="text-red-500">*</span></Label>
                <select
                  value={promotionType}
                  onChange={(e) =>{  setPromotionType(e.target.value as typeof promotionType); }}
                  className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                >
                  <option value="coupon">Coupon nhập mã</option>
                  <option value="campaign">Chương trình tự động</option>
                  <option value="flash_sale">Flash sale</option>
                  <option value="bundle">Combo sản phẩm</option>
                  <option value="loyalty">Loyalty</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Tên khuyến mãi <span className="text-red-500">*</span></Label>
                <CopyableInput
                  value={name} 
                  onChange={(e) =>{  setName(e.target.value); }} 
                  copyLabel="tên khuyến mãi"
                  required 
                  placeholder="VD: Giảm 10% đơn hàng" 
                />
              </div>
              
              {promotionType === 'coupon' ? (
                <div className="space-y-2">
                  <Label>Mã voucher <span className="text-red-500">*</span></Label>
                  <div className="flex gap-2">
                    <Input 
                      value={code} 
                      onChange={handleCodeChange} 
                      required 
                      placeholder="VD: SALE10" 
                      className="font-mono uppercase flex-1"
                    />
                    <Button type="button" variant="outline" onClick={generateCode}>
                      Tạo mã
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">Mã sẽ tự động chuyển thành chữ in hoa</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Mã khuyến mãi (tuỳ chọn)</Label>
                  <Input 
                    value={code} 
                    onChange={handleCodeChange} 
                    placeholder="VD: EVENT2026" 
                    className="font-mono uppercase"
                  />
                  <p className="text-xs text-slate-500">Để trống nếu tự động áp dụng</p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Mô tả</Label>
                <textarea 
                  value={description}
                  onChange={(e) =>{  setDescription(e.target.value); }}
                  className="w-full min-h-[80px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  placeholder="Mô tả chi tiết về khuyến mãi..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Giá trị giảm giá</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Loại giảm giá <span className="text-red-500">*</span></Label>
                <select 
                  value={discountType}
                  onChange={(e) =>{  setDiscountType(e.target.value as typeof discountType); }}
                  className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                >
                  <option value="percent">Giảm theo phần trăm (%)</option>
                  <option value="fixed">Giảm số tiền cố định (VND)</option>
                  <option value="buy_x_get_y">Mua X tặng Y</option>
                  <option value="buy_a_get_b">Mua A tặng B</option>
                  <option value="tiered">Giảm theo bậc</option>
                  <option value="free_shipping">Miễn phí ship</option>
                  <option value="gift">Tặng quà</option>
                </select>
              </div>

              {(discountType === 'percent' || discountType === 'fixed') && (
                <div className="space-y-2">
                  <Label>
                    Giá trị giảm <span className="text-red-500">*</span>
                    {discountType === 'percent' && <span className="text-slate-500 ml-1">(%)</span>}
                    {discountType === 'fixed' && <span className="text-slate-500 ml-1">(VND)</span>}
                  </Label>
                  <Input 
                    type="number"
                    value={discountValue} 
                    onChange={(e) =>{  setDiscountValue(Number(e.target.value)); }}
                    required
                    min={1}
                    max={discountType === 'percent' ? 100 : undefined}
                    placeholder={discountType === 'percent' ? 'VD: 10' : 'VD: 50000'}
                  />
                </div>
              )}

              {discountType !== 'percent' && discountType !== 'fixed' && isFeatureEnabled('enableAdvancedDiscount') && (
                <div className="space-y-2">
                  <Label>Cấu hình chi tiết (JSON)</Label>
                  <textarea 
                    value={discountConfigText}
                    onChange={(e) =>{  setDiscountConfigText(e.target.value); }}
                    className="w-full min-h-[120px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-mono"
                    placeholder='VD: {"buyQuantity":2,"getQuantity":1}'
                  />
                  <p className="text-xs text-slate-500">Dùng JSON để mô tả chi tiết mua X tặng Y, combo, quà tặng.</p>
                </div>
              )}

              {isFeatureEnabled('enableMinOrder') && (
                <div className="space-y-2">
                  <Label>Đơn hàng tối thiểu (VND)</Label>
                  <Input 
                    type="number"
                    value={minOrderAmount ?? ''} 
                    onChange={(e) =>{  setMinOrderAmount(e.target.value ? Number(e.target.value) : undefined); }}
                    min={0}
                    placeholder="VD: 500000"
                  />
                  <p className="text-xs text-slate-500">Để trống nếu không yêu cầu</p>
                </div>
              )}

              {isFeatureEnabled('enableMaxDiscount') && discountType === 'percent' && (
                <div className="space-y-2">
                  <Label>Giảm tối đa (VND)</Label>
                  <Input 
                    type="number"
                    value={maxDiscountAmount ?? ''} 
                    onChange={(e) =>{  setMaxDiscountAmount(e.target.value ? Number(e.target.value) : undefined); }}
                    min={0}
                    placeholder="VD: 500000"
                  />
                  <p className="text-xs text-slate-500">Giới hạn số tiền giảm tối đa cho giảm theo %</p>
                </div>
              )}
            </CardContent>
          </Card>

          {isFeatureEnabled('enableApplicable') && (
            <Card>
              <CardHeader><CardTitle className="text-base">Điều kiện áp dụng</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Phạm vi áp dụng</Label>
                  <select
                    value={applicableTo}
                    onChange={(e) =>{  setApplicableTo(e.target.value as typeof applicableTo); }}
                    className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  >
                    <option value="all">Tất cả</option>
                    <option value="products">Sản phẩm</option>
                    <option value="categories">Danh mục</option>
                    <option value="brands">Thương hiệu</option>
                    <option value="tags">Tag</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>ID áp dụng (phân cách bằng dấu phẩy)</Label>
                  <Input
                    value={applicableIdsText}
                    onChange={(e) =>{  setApplicableIdsText(e.target.value); }}
                    placeholder="VD: prod_1,prod_2"
                  />
                </div>
                <div className="space-y-2">
                  <Label>ID loại trừ (phân cách bằng dấu phẩy)</Label>
                  <Input
                    value={excludeIdsText}
                    onChange={(e) =>{  setExcludeIdsText(e.target.value); }}
                    placeholder="VD: prod_3"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Số lượng tối thiểu</Label>
                  <Input
                    type="number"
                    value={minQuantity ?? ''}
                    onChange={(e) =>{  setMinQuantity(e.target.value ? Number(e.target.value) : undefined); }}
                    min={1}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {isFeatureEnabled('enableCustomerConditions') && (
            <Card>
              <CardHeader><CardTitle className="text-base">Điều kiện khách hàng</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Loại khách hàng</Label>
                  <select
                    value={customerType}
                    onChange={(e) =>{  setCustomerType(e.target.value as typeof customerType); }}
                    className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  >
                    <option value="all">Tất cả</option>
                    <option value="new">Khách mới</option>
                    <option value="returning">Khách quay lại</option>
                    <option value="vip">Khách VIP</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>ID hạng thành viên (phân cách bằng dấu phẩy)</Label>
                  <Input
                    value={customerTierIdsText}
                    onChange={(e) =>{  setCustomerTierIdsText(e.target.value); }}
                    placeholder="VD: tier_gold,tier_vip"
                  />
                </div>
                <div className="space-y-2">
                  <Label>ID nhóm khách hàng (phân cách bằng dấu phẩy)</Label>
                  <Input
                    value={customerGroupIdsText}
                    onChange={(e) =>{  setCustomerGroupIdsText(e.target.value); }}
                    placeholder="VD: group_wholesale"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Số đơn tối thiểu</Label>
                    <Input
                      type="number"
                      value={minOrderHistory ?? ''}
                      onChange={(e) =>{  setMinOrderHistory(e.target.value ? Number(e.target.value) : undefined); }}
                      min={0}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tổng chi tối thiểu (VND)</Label>
                    <Input
                      type="number"
                      value={minTotalSpent ?? ''}
                      onChange={(e) =>{  setMinTotalSpent(e.target.value ? Number(e.target.value) : undefined); }}
                      min={0}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {isFeatureEnabled('enableSchedule') && (
            <Card>
              <CardHeader><CardTitle className="text-base">Thời gian áp dụng</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Chế độ lịch</Label>
                  <select
                    value={scheduleType}
                    onChange={(e) =>{  setScheduleType(e.target.value as typeof scheduleType); }}
                    className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  >
                    <option value="always">Luôn hoạt động</option>
                    <option value="dateRange">Theo khoảng ngày</option>
                    <option value="recurring">Lặp theo lịch</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ngày bắt đầu</Label>
                    <Input 
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) =>{  setStartDate(e.target.value); }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ngày kết thúc</Label>
                    <Input 
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) =>{  setEndDate(e.target.value); }}
                    />
                  </div>
                </div>
                {scheduleType === 'recurring' && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Ngày lặp (0-6, phân cách bằng dấu phẩy)</Label>
                      <Input
                        value={recurringDaysText}
                        onChange={(e) =>{  setRecurringDaysText(e.target.value); }}
                        placeholder="VD: 1,2,3,4,5"
                      />
                      <p className="text-xs text-slate-500">0: Chủ nhật, 1-6: Thứ 2-7</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Giờ bắt đầu</Label>
                        <Input
                          type="time"
                          value={recurringFromTime}
                          onChange={(e) =>{  setRecurringFromTime(e.target.value); }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Giờ kết thúc</Label>
                        <Input
                          type="time"
                          value={recurringToTime}
                          onChange={(e) =>{  setRecurringToTime(e.target.value); }}
                        />
                      </div>
                    </div>
                  </div>
                )}
                <p className="text-xs text-slate-500">Để trống nếu không giới hạn thời gian</p>
              </CardContent>
            </Card>
          )}
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Xuất bản</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <select 
                  value={status}
                  onChange={(e) =>{  setStatus(e.target.value as 'Active' | 'Inactive' | 'Scheduled'); }}
                  className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                >
                  <option value="Active">Hoạt động</option>
                  <option value="Inactive">Tạm dừng</option>
                  <option value="Scheduled">Chờ kích hoạt</option>
                </select>
              </div>
              {isFeatureEnabled('enableDisplay') && (
                <>
                  <div className="space-y-2">
                    <Label>Hiển thị ngoài site</Label>
                    <select
                      value={displayOnPage ? 'true' : 'false'}
                      onChange={(e) =>{  setDisplayOnPage(e.target.value === 'true'); }}
                      className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                    >
                      <option value="true">Có hiển thị</option>
                      <option value="false">Không hiển thị</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Nổi bật</Label>
                    <select
                      value={featured ? 'true' : 'false'}
                      onChange={(e) =>{  setFeatured(e.target.value === 'true'); }}
                      className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                    >
                      <option value="false">Bình thường</option>
                      <option value="true">Nổi bật</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Thumbnail</Label>
                    <Input
                      value={thumbnail}
                      onChange={(e) =>{  setThumbnail(e.target.value); }}
                      placeholder="URL ảnh thumbnail"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {isFeatureEnabled('enableUsageLimit') && (
            <Card>
              <CardHeader><CardTitle className="text-base">Giới hạn sử dụng</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Số lượt sử dụng tối đa</Label>
                  <Input 
                    type="number"
                    value={usageLimit ?? ''} 
                    onChange={(e) =>{  setUsageLimit(e.target.value ? Number(e.target.value) : undefined); }}
                    min={1}
                    placeholder="VD: 100"
                  />
                  <p className="text-xs text-slate-500">Để trống nếu không giới hạn</p>
                </div>
                <div className="space-y-2">
                  <Label>Lượt/khách hàng</Label>
                  <Input 
                    type="number"
                    value={usagePerCustomer ?? ''} 
                    onChange={(e) =>{  setUsagePerCustomer(e.target.value ? Number(e.target.value) : undefined); }}
                    min={1}
                    placeholder="VD: 1"
                  />
                </div>
                {isFeatureEnabled('enableBudgetLimit') && (
                  <div className="space-y-2">
                    <Label>Ngân sách tối đa (VND)</Label>
                    <Input 
                      type="number"
                      value={budget ?? ''} 
                      onChange={(e) =>{  setBudget(e.target.value ? Number(e.target.value) : undefined); }}
                      min={0}
                      placeholder="VD: 5000000"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {isFeatureEnabled('enableStacking') && (
            <Card>
              <CardHeader><CardTitle className="text-base">Cộng dồn & ưu tiên</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Cho phép cộng dồn</Label>
                  <select
                    value={stackable ? 'true' : 'false'}
                    onChange={(e) =>{  setStackable(e.target.value === 'true'); }}
                    className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  >
                    <option value="true">Cho phép</option>
                    <option value="false">Không cho phép</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Độ ưu tiên</Label>
                  <Input
                    type="number"
                    value={priority ?? ''}
                    onChange={(e) =>{  setPriority(e.target.value ? Number(e.target.value) : undefined); }}
                    min={0}
                    placeholder="VD: 10"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <HomeComponentStickyFooter
        isSubmitting={isSubmitting}
        submitLabel="Tạo khuyến mãi"
        onCancel={() =>{  router.push('/admin/promotions'); }}
        disableSave={isSubmitting}
      >
        <>
          <Button type="button" variant="ghost" onClick={() =>{  router.push('/admin/promotions'); }}>Hủy bỏ</Button>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() =>{  setStatus('Inactive'); }}>Lưu nháp</Button>
            <Button type="submit" className="bg-pink-600 hover:bg-pink-500" disabled={isSubmitting}>
              {isSubmitting && <Loader2 size={16} className="animate-spin mr-2" />}
              Tạo khuyến mãi
            </Button>
          </div>
        </>
      </HomeComponentStickyFooter>
    </form>
  );
}
