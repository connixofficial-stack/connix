'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button, Input, cn } from '@/app/admin/components/ui';
import { AlertCircle, ChevronDown, Info, Truck, Trash2, Undo2 } from 'lucide-react';

export interface ShippingMethodConfig {
  id: string;
  label: string;
  description?: string;
  fee: number;
  estimate?: string;
  /** Ngưỡng đặt hàng tối thiểu (đ) để được miễn phí ship. 0 = không áp dụng */
  freeShipThreshold?: number;
}

interface ShippingMethodsEditorProps {
  methods: ShippingMethodConfig[];
  onChange: (methods: ShippingMethodConfig[]) => void;
}

export function ShippingMethodsEditor({ methods, onChange }: ShippingMethodsEditorProps) {
  const [deleteConfirms, setDeleteConfirms] = useState<Record<string, boolean>>({});
  const [lastDeleted, setLastDeleted] = useState<{ method: ShippingMethodConfig; index: number } | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleAdd = () => {
    const newIndex = methods.length;
    onChange([
      ...methods,
      { id: `shipping-${Date.now()}`, label: '', description: '', fee: 0, estimate: '', freeShipThreshold: 0 },
    ]);
    setExpandedIndex(newIndex);
  };

  const handleRemoveClick = (id: string, index: number) => {
    if (deleteConfirms[id]) {
      const methodToRemove = methods[index];
      setLastDeleted({ method: methodToRemove, index });
      onChange(methods.filter((_, idx) => idx !== index));
      setDeleteConfirms((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      if (expandedIndex === index) setExpandedIndex(null);
    } else {
      setDeleteConfirms((prev) => ({ ...prev, [id]: true }));
    }
  };

  useEffect(() => {
    const activeIds = Object.keys(deleteConfirms).filter((k) => deleteConfirms[k]);
    if (activeIds.length === 0) return;
    const timer = setTimeout(() => setDeleteConfirms({}), 4000);
    return () => clearTimeout(timer);
  }, [deleteConfirms]);

  const handleUndo = () => {
    if (!lastDeleted) return;
    const nextMethods = [...methods];
    nextMethods.splice(lastDeleted.index, 0, lastDeleted.method);
    onChange(nextMethods);
    setLastDeleted(null);
  };

  const handleUpdate = (index: number, patch: Partial<ShippingMethodConfig>) => {
    onChange(methods.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));
  };

  const duplicateIds = useMemo(() => {
    const counts: Record<string, number> = {};
    methods.forEach((m) => {
      const id = m.id.trim();
      if (id) counts[id] = (counts[id] || 0) + 1;
    });
    return new Set(Object.keys(counts).filter((id) => counts[id] > 1));
  }, [methods]);

  // Tóm tắt ưu đãi tốt nhất theo ngưỡng để admin dễ hiểu
  const bestDealSummary = useMemo(() => {
    const thresholds = methods
      .filter((m) => (m.freeShipThreshold ?? 0) > 0 && m.fee > 0)
      .sort((a, b) => (a.freeShipThreshold ?? 0) - (b.freeShipThreshold ?? 0));
    if (thresholds.length === 0) return null;
    return thresholds.map((m) => ({
      label: m.label || m.id,
      threshold: m.freeShipThreshold ?? 0,
      fee: m.fee,
    }));
  }, [methods]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Danh sách Hình thức Giao hàng</p>
          <p className="text-xs text-slate-500">Click vào hình thức để chỉnh sửa chi tiết</p>
        </div>
        <div className="flex items-center gap-2">
          {lastDeleted && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUndo}
              className="text-xs flex items-center gap-1 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50"
            >
              <Undo2 size={12} />
              Hoàn tác xóa
            </Button>
          )}
          <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
            + Thêm hình thức
          </Button>
        </div>
      </div>

      {/* Info box ưu đãi tốt nhất */}
      {bestDealSummary && bestDealSummary.length > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-800 dark:text-emerald-400">
          <Info size={14} className="shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold">Ưu đãi tốt nhất sẽ tự động áp dụng khi khách checkout:</p>
            {bestDealSummary.map((item) => (
              <p key={item.label}>
                • Đặt hàng ≥ <strong>{item.threshold.toLocaleString('vi-VN')}đ</strong>: <strong>{item.label}</strong> miễn phí ship (thường {item.fee.toLocaleString('vi-VN')}đ)
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {methods.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-200 p-10 text-center text-xs text-slate-500 dark:border-slate-800">
          Chưa có hình thức vận chuyển nào. Nhấn <strong>+ Thêm hình thức</strong> để tạo mới.
          <br />
          <span className="text-slate-400">Khi không có hình thức nào, khách mặc định được miễn phí ship.</span>
        </div>
      )}

      {/* Accordion cards */}
      {methods.length > 0 && (
        <div className="space-y-2">
          {methods.map((method, index) => {
            const isIdEmpty = !method.id.trim();
            const isLabelEmpty = !method.label.trim();
            const isDuplicate = duplicateIds.has(method.id.trim());
            const isFeeInvalid = !Number.isFinite(method.fee) || method.fee < 0;
            const hasError = isIdEmpty || isLabelEmpty || isDuplicate || isFeeInvalid;
            const isOpen = expandedIndex === index;
            const threshold = method.freeShipThreshold ?? 0;

            return (
              <div
                key={`${method.id}-${index}`}
                className={cn(
                  'rounded-xl border-2 transition-all duration-200 overflow-hidden',
                  hasError
                    ? 'border-rose-300 dark:border-rose-900/60'
                    : isOpen
                    ? 'border-slate-300 dark:border-slate-600 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                )}
              >
                {/* Card header — luôn hiển thị */}
                <button
                  type="button"
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  onClick={() => setExpandedIndex(isOpen ? null : index)}
                >
                  <Truck size={15} className={cn('shrink-0', hasError ? 'text-rose-400' : 'text-slate-400')} />

                  <div className="flex-1 min-w-0">
                    <span className={cn(
                      'text-sm font-semibold',
                      isLabelEmpty ? 'text-slate-400 italic' : 'text-slate-900 dark:text-slate-100'
                    )}>
                      {isLabelEmpty ? 'Chưa đặt tên' : method.label}
                    </span>
                    {method.id.trim() && (
                      <span className="ml-2 text-[10px] text-slate-400 font-mono">#{method.id}</span>
                    )}
                  </div>

                  {/* Thông tin tóm tắt */}
                  <div className="flex items-center gap-2 shrink-0 text-xs">
                    {threshold > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 font-semibold text-[10px]">
                        Free ship ≥ {threshold.toLocaleString('vi-VN')}đ
                      </span>
                    ) : (
                      <span className="text-slate-500 font-semibold">
                        {method.fee > 0 ? `${method.fee.toLocaleString('vi-VN')}đ` : 'Miễn phí'}
                      </span>
                    )}
                    {method.estimate && (
                      <span className="text-slate-400 text-[10px]">{method.estimate}</span>
                    )}
                    {hasError && <AlertCircle size={14} className="text-rose-500" />}
                  </div>

                  <ChevronDown
                    size={16}
                    className={cn(
                      'text-slate-400 transition-transform duration-200 shrink-0',
                      isOpen && 'rotate-180'
                    )}
                  />
                </button>

                {/* Expanded form */}
                {isOpen && (
                  <div className="px-5 pb-5 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-4 bg-white dark:bg-slate-950">

                    {/* Row 1: Mã + Tên */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide block">
                          Mã hình thức (ID)
                        </label>
                        <Input
                          placeholder="standard, express, free..."
                          value={method.id}
                          onChange={(e) => handleUpdate(index, { id: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                          className={cn(
                            'font-mono',
                            (isIdEmpty || isDuplicate) && 'border-rose-500 focus-visible:ring-rose-500'
                          )}
                        />
                        {isIdEmpty && (
                          <span className="text-[10px] text-rose-500 flex items-center gap-1">
                            <AlertCircle size={10} /> Mã không được rỗng
                          </span>
                        )}
                        {isDuplicate && (
                          <span className="text-[10px] text-rose-500 flex items-center gap-1">
                            <AlertCircle size={10} /> Mã bị trùng lặp
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide block">
                          Tên hiển thị khi checkout
                        </label>
                        <Input
                          placeholder="Giao hàng tiêu chuẩn, Giao hàng nhanh..."
                          value={method.label}
                          onChange={(e) => handleUpdate(index, { label: e.target.value })}
                          className={cn(isLabelEmpty && 'border-rose-500 focus-visible:ring-rose-500')}
                        />
                        {isLabelEmpty && (
                          <span className="text-[10px] text-rose-500 flex items-center gap-1">
                            <AlertCircle size={10} /> Tên không được rỗng
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Row 2: Mô tả + Thời gian ước tính */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide block">
                          Mô tả ngắn (tuỳ chọn)
                        </label>
                        <Input
                          placeholder="Giao tận nhà, bảo hiểm hàng hoá..."
                          value={method.description ?? ''}
                          onChange={(e) => handleUpdate(index, { description: e.target.value })}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide block">
                          Thời gian ước tính
                        </label>
                        <Input
                          placeholder="2-4 ngày, Trong 24h..."
                          value={method.estimate ?? ''}
                          onChange={(e) => handleUpdate(index, { estimate: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Row 3: Phí ship + Điều kiện free ship */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide block">
                          Phí ship (đồng)
                        </label>
                        <Input
                          type="number"
                          placeholder="0"
                          min={0}
                          value={Number.isFinite(method.fee) ? method.fee : 0}
                          onChange={(e) => handleUpdate(index, { fee: Number(e.target.value || 0) })}
                          className={cn(isFeeInvalid && 'border-rose-500 focus-visible:ring-rose-500')}
                        />
                        {isFeeInvalid && (
                          <span className="text-[10px] text-rose-500 flex items-center gap-1">
                            <AlertCircle size={10} /> Phí ship phải ≥ 0
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide block">
                          Miễn phí ship khi tổng đơn ≥ (đồng)
                        </label>
                        <Input
                          type="number"
                          placeholder="0 = không áp dụng"
                          min={0}
                          value={threshold}
                          onChange={(e) => handleUpdate(index, { freeShipThreshold: Number(e.target.value || 0) })}
                        />
                        {threshold > 0 ? (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                            ✓ Đơn ≥ {threshold.toLocaleString('vi-VN')}đ → tự động miễn phí ship
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">
                            Nhập giá trị &gt; 0 để bật điều kiện free ship
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Row 4: Delete */}
                    <div className="flex justify-end pt-1 border-t border-slate-100 dark:border-slate-800">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveClick(method.id, index)}
                        className={cn(
                          'text-xs h-9 px-4 transition-all',
                          deleteConfirms[method.id]
                            ? 'bg-rose-600 hover:bg-rose-500 text-white font-bold animate-pulse rounded-lg'
                            : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50/50 dark:hover:bg-rose-950/20'
                        )}
                      >
                        {deleteConfirms[method.id] ? (
                          'Xác nhận xóa hình thức này?'
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <Trash2 size={13} />
                            Xóa hình thức này
                          </span>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
