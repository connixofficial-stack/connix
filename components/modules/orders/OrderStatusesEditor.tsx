'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button, Input, cn } from '@/app/admin/components/ui';
import type { OrderStatusConfig } from '@/lib/orders/statuses';
import { AlertCircle, ArrowRight, Ban, CheckCircle2, Trash2, Undo2, XCircle } from 'lucide-react';

interface OrderStatusesEditorProps {
  statuses: OrderStatusConfig[];
  onChange: (statuses: OrderStatusConfig[]) => void;
}

const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

// Làm nhạt màu hex để dùng cho background badge
function hexToRgba(hex: string, alpha: number) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(100,116,139,${alpha})`;
  return `rgba(${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)},${alpha})`;
}

export function OrderStatusesEditor({ statuses, onChange }: OrderStatusesEditorProps) {
  const [deleteConfirms, setDeleteConfirms] = useState<Record<string, boolean>>({});
  const [lastDeleted, setLastDeleted] = useState<{ status: OrderStatusConfig; index: number } | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleAdd = () => {
    const newIndex = statuses.length;
    onChange([
      ...statuses,
      { key: `status-${Date.now()}`, label: '', color: '#64748b', step: 1, isFinal: false, allowCancel: false },
    ]);
    setExpandedIndex(newIndex);
  };

  const handleRemoveClick = (key: string, index: number) => {
    if (deleteConfirms[key]) {
      const statusToRemove = statuses[index];
      setLastDeleted({ status: statusToRemove, index });
      onChange(statuses.filter((_, idx) => idx !== index));
      setDeleteConfirms((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      if (expandedIndex === index) setExpandedIndex(null);
    } else {
      setDeleteConfirms((prev) => ({ ...prev, [key]: true }));
    }
  };

  useEffect(() => {
    const activeKeys = Object.keys(deleteConfirms).filter((k) => deleteConfirms[k]);
    if (activeKeys.length === 0) return;
    const timer = setTimeout(() => setDeleteConfirms({}), 4000);
    return () => clearTimeout(timer);
  }, [deleteConfirms]);

  const handleUndo = () => {
    if (!lastDeleted) return;
    const nextStatuses = [...statuses];
    nextStatuses.splice(lastDeleted.index, 0, lastDeleted.status);
    onChange(nextStatuses);
    setLastDeleted(null);
  };

  const handleUpdate = (index: number, patch: Partial<OrderStatusConfig>) => {
    onChange(statuses.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));
  };

  const duplicateKeys = useMemo(() => {
    const counts: Record<string, number> = {};
    statuses.forEach((s) => {
      const key = s.key.trim();
      if (key) counts[key] = (counts[key] || 0) + 1;
    });
    return new Set(Object.keys(counts).filter((key) => counts[key] > 1));
  }, [statuses]);

  const hasNonFinal = useMemo(() => statuses.some((s) => !s.isFinal), [statuses]);

  // Nhóm theo step để render pipeline
  const sortedStatuses = useMemo(() => {
    return [...statuses].map((s, originalIndex) => ({ ...s, originalIndex }))
      .sort((a, b) => a.step - b.step || a.originalIndex - b.originalIndex);
  }, [statuses]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Vòng đời Đơn hàng</p>
          <p className="text-xs text-slate-500">Kéo để sắp xếp thứ tự, click vào card để chỉnh sửa</p>
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
              Hoàn tác
            </Button>
          )}
          <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
            + Thêm trạng thái
          </Button>
        </div>
      </div>

      {/* Cảnh báo */}
      {statuses.length > 0 && !hasNonFinal && (
        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-800 dark:text-rose-400 flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" />
          <span>Cần tối thiểu một trạng thái chưa hoàn thành để làm điểm khởi tạo đơn hàng.</span>
        </div>
      )}

      {/* Empty state */}
      {statuses.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-200 p-10 text-center text-xs text-slate-500 dark:border-slate-800">
          Chưa có trạng thái nào. Nhấn <strong>+ Thêm trạng thái</strong> để bắt đầu.
        </div>
      )}

      {/* Pipeline Preview — chỉ hiện khi có đủ key + label */}
      {statuses.length > 0 && (
        <div className="overflow-x-auto pb-1">
          <div className="flex items-center gap-1 min-w-max">
            {sortedStatuses.map((status, pipeIdx) => {
              const isValid = HEX_COLOR_REGEX.test(status.color);
              const color = isValid ? status.color : '#64748b';
              const bgColor = hexToRgba(color, 0.12);
              const hasLabel = status.label.trim();
              return (
                <React.Fragment key={`${status.key}-${status.originalIndex}`}>
                  <button
                    type="button"
                    onClick={() => setExpandedIndex(
                      expandedIndex === status.originalIndex ? null : status.originalIndex
                    )}
                    className={cn(
                      'group relative flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl border-2 transition-all duration-150 min-w-[90px] max-w-[110px]',
                      expandedIndex === status.originalIndex
                        ? 'border-slate-400 dark:border-slate-500 shadow-md scale-[1.03]'
                        : 'border-transparent hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm'
                    )}
                    style={{ backgroundColor: bgColor }}
                  >
                    {/* Dot màu */}
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                    {/* Label */}
                    <span
                      className="text-[11px] font-semibold text-center leading-tight truncate max-w-full"
                      style={{ color }}
                    >
                      {hasLabel ? status.label : <span className="text-slate-400 italic">Chưa đặt tên</span>}
                    </span>
                    {/* Badges */}
                    <div className="flex items-center gap-1 flex-wrap justify-center">
                      {status.isFinal && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/60 dark:bg-black/20"
                          style={{ color }}>
                          Kết thúc
                        </span>
                      )}
                      {status.allowCancel && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/60 dark:bg-black/20 text-orange-600 dark:text-orange-400">
                          Hủy được
                        </span>
                      )}
                    </div>
                  </button>
                  {pipeIdx < sortedStatuses.length - 1 && (
                    <ArrowRight size={14} className="text-slate-300 dark:text-slate-700 shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Cards chỉnh sửa */}
      {statuses.length > 0 && (
        <div className="space-y-2">
          {statuses.map((status, index) => {
            const isKeyEmpty = !status.key.trim();
            const isLabelEmpty = !status.label.trim();
            const isDuplicate = duplicateKeys.has(status.key.trim());
            const isColorInvalid = !HEX_COLOR_REGEX.test(status.color.trim());
            const isStepInvalid = !Number.isInteger(status.step) || status.step < 1 || status.step > 4;
            const hasError = isKeyEmpty || isLabelEmpty || isDuplicate || isColorInvalid || isStepInvalid;
            const isOpen = expandedIndex === index;
            const color = HEX_COLOR_REGEX.test(status.color) ? status.color : '#64748b';
            const bgColor = hexToRgba(color, 0.08);

            return (
              <div
                key={`${status.key || 'status'}-${index}`}
                className={cn(
                  'rounded-xl border-2 transition-all duration-200 overflow-hidden',
                  hasError
                    ? 'border-rose-300 dark:border-rose-900/60'
                    : isOpen
                    ? 'border-slate-300 dark:border-slate-600 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                )}
              >
                {/* Card Header — luôn hiển thị */}
                <button
                  type="button"
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                  onClick={() => setExpandedIndex(isOpen ? null : index)}
                  style={{ backgroundColor: isOpen ? bgColor : undefined }}
                >
                  {/* Color dot */}
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/50 shadow-sm"
                    style={{ backgroundColor: color }}
                  />

                  {/* Label + key */}
                  <div className="flex-1 min-w-0">
                    <span className={cn(
                      'text-sm font-semibold',
                      isLabelEmpty ? 'text-slate-400 italic' : 'text-slate-900 dark:text-slate-100'
                    )}>
                      {isLabelEmpty ? 'Chưa đặt tên' : status.label}
                    </span>
                    {status.key.trim() && (
                      <span className="ml-2 text-[10px] text-slate-400 font-mono">
                        #{status.key}
                      </span>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={cn(
                      'text-[10px] px-2 py-0.5 rounded-full font-semibold',
                      status.step === 1 ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' :
                      status.step === 2 ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400' :
                      status.step === 3 ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400' :
                                          'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                    )}>
                      Bước {status.step}
                    </span>
                    {status.isFinal ? (
                      <CheckCircle2 size={14} className="text-emerald-500" />
                    ) : (
                      <span className="w-3.5 h-3.5" />
                    )}
                    {status.allowCancel && (
                      <XCircle size={14} className="text-orange-400" />
                    )}
                    {hasError && (
                      <AlertCircle size={14} className="text-rose-500" />
                    )}
                  </div>

                  {/* Expand indicator */}
                  <span className={cn(
                    'text-slate-400 transition-transform duration-200 text-xs',
                    isOpen ? 'rotate-180' : ''
                  )}>▾</span>
                </button>

                {/* Expanded form */}
                {isOpen && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3 bg-white dark:bg-slate-950">

                    {/* Row 1: Key + Label */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-500 block uppercase tracking-wide">
                          Mã trạng thái (Key)
                        </label>
                        <Input
                          placeholder="Pending, Shipped, Delivered..."
                          value={status.key}
                          onChange={(e) => handleUpdate(index, { key: e.target.value.replace(/\s+/g, '') })}
                          className={cn(
                            'font-mono text-sm',
                            (isKeyEmpty || isDuplicate) && 'border-rose-500 focus-visible:ring-rose-500'
                          )}
                        />
                        {isKeyEmpty && (
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

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-500 block uppercase tracking-wide">
                          Tên hiển thị
                        </label>
                        <Input
                          placeholder="Chờ xử lý, Đang giao, Hoàn thành..."
                          value={status.label}
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

                    {/* Row 2: Màu + Bước */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-500 block uppercase tracking-wide">
                          Màu badge
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={HEX_COLOR_REGEX.test(status.color) ? status.color : '#64748b'}
                            onChange={(e) => handleUpdate(index, { color: e.target.value })}
                            className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-slate-200 dark:border-slate-700 p-0.5"
                          />
                          <Input
                            value={status.color}
                            onChange={(e) => handleUpdate(index, { color: e.target.value })}
                            className={cn(
                              'font-mono text-sm',
                              isColorInvalid && 'border-rose-500 focus-visible:ring-rose-500'
                            )}
                            placeholder="#64748b"
                          />
                        </div>
                        {isColorInvalid && (
                          <span className="text-[10px] text-rose-500 flex items-center gap-1">
                            <AlertCircle size={10} /> Sai định dạng hex (ví dụ: #64748b)
                          </span>
                        )}
                        {/* Preview badge */}
                        {!isColorInvalid && status.label && (
                          <span
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full mt-1"
                            style={{ backgroundColor: hexToRgba(status.color, 0.15), color: status.color }}
                          >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
                            {status.label}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-500 block uppercase tracking-wide">
                          Bước thứ tự (1–4)
                        </label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((step) => (
                            <button
                              key={step}
                              type="button"
                              onClick={() => handleUpdate(index, { step })}
                              className={cn(
                                'flex-1 h-10 rounded-lg text-sm font-bold border-2 transition-all',
                                status.step === step
                                  ? 'border-slate-600 bg-slate-700 text-white dark:border-slate-400 dark:bg-slate-600'
                                  : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
                              )}
                            >
                              {step}
                            </button>
                          ))}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Dùng để sắp xếp thứ tự trong pipeline hiển thị
                        </p>
                      </div>
                    </div>

                    {/* Row 3: Toggles + Delete */}
                    <div className="flex items-center gap-3 flex-wrap pt-1">
                      {/* isFinal toggle */}
                      <button
                        type="button"
                        onClick={() => handleUpdate(index, { isFinal: !status.isFinal })}
                        className={cn(
                          'flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-full border-2 transition-all',
                          status.isFinal
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-600 dark:text-emerald-400'
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400'
                        )}
                      >
                        <CheckCircle2 size={14} />
                        Trạng thái kết thúc
                      </button>

                      {/* allowCancel toggle */}
                      <button
                        type="button"
                        onClick={() => handleUpdate(index, { allowCancel: !status.allowCancel })}
                        className={cn(
                          'flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-full border-2 transition-all',
                          status.allowCancel
                            ? 'bg-orange-50 border-orange-400 text-orange-700 dark:bg-orange-950/30 dark:border-orange-600 dark:text-orange-400'
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400'
                        )}
                      >
                        <Ban size={14} />
                        Cho khách hủy đơn
                      </button>

                      <div className="ml-auto">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveClick(status.key, index)}
                          className={cn(
                            'text-xs h-9 px-3 transition-all',
                            deleteConfirms[status.key]
                              ? 'bg-rose-600 hover:bg-rose-500 text-white font-bold animate-pulse rounded-lg'
                              : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50/50 dark:hover:bg-rose-950/20'
                          )}
                        >
                          {deleteConfirms[status.key] ? (
                            'Xác nhận xóa?'
                          ) : (
                            <span className="flex items-center gap-1">
                              <Trash2 size={13} />
                              Xóa
                            </span>
                          )}
                        </Button>
                      </div>
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
