'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, cn } from '@/app/admin/components/ui';
import { AlertCircle, Trash2, Undo2 } from 'lucide-react';

export type PaymentMethodType = 'COD' | 'BankTransfer' | 'VietQR' | 'CreditCard' | 'EWallet';

export interface PaymentMethodConfig {
  id: string;
  label: string;
  description?: string;
  type: PaymentMethodType;
}

interface PaymentMethodsEditorProps {
  methods: PaymentMethodConfig[];
  onChange: (methods: PaymentMethodConfig[]) => void;
}

const PAYMENT_TYPES: { value: PaymentMethodType; label: string }[] = [
  { value: 'COD', label: 'COD' },
  { value: 'BankTransfer', label: 'Chuyển khoản' },
  { value: 'VietQR', label: 'VietQR' },
  { value: 'CreditCard', label: 'Thẻ tín dụng' },
  { value: 'EWallet', label: 'Ví điện tử' },
];

export function PaymentMethodsEditor({ methods, onChange }: PaymentMethodsEditorProps) {
  // Quản lý trạng thái xác nhận xóa cho từng hàng (id -> true/false)
  const [deleteConfirms, setDeleteConfirms] = useState<Record<string, boolean>>({});
  // Hỗ trợ Undo cho phương thức vừa bị xóa gần nhất
  const [lastDeleted, setLastDeleted] = useState<{ method: PaymentMethodConfig; index: number } | null>(null);

  const handleAdd = () => {
    onChange([
      ...methods,
      { id: `payment-${Date.now()}`, label: '', description: '', type: 'COD' },
    ]);
  };

  const handleRemoveClick = (id: string, index: number) => {
    if (deleteConfirms[id]) {
      // Thực hiện xóa thực tế
      const methodToRemove = methods[index];
      setLastDeleted({ method: methodToRemove, index });
      onChange(methods.filter((_, idx) => idx !== index));
      setDeleteConfirms((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } else {
      // Bật xác nhận xóa
      setDeleteConfirms((prev) => ({ ...prev, [id]: true }));
    }
  };

  // Tự động tắt xác nhận xóa sau 3 giây
  useEffect(() => {
    const activeIds = Object.keys(deleteConfirms).filter((key) => deleteConfirms[key]);
    if (activeIds.length === 0) return;

    const timer = setTimeout(() => {
      setDeleteConfirms({});
    }, 4000);

    return () => clearTimeout(timer);
  }, [deleteConfirms]);

  const handleUndo = () => {
    if (!lastDeleted) return;
    const nextMethods = [...methods];
    nextMethods.splice(lastDeleted.index, 0, lastDeleted.method);
    onChange(nextMethods);
    setLastDeleted(null);
  };

  const handleUpdate = (index: number, patch: Partial<PaymentMethodConfig>) => {
    onChange(methods.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));
  };

  // Kiểm tra trùng ID
  const duplicateIds = useMemo(() => {
    const counts: Record<string, number> = {};
    methods.forEach((m) => {
      const id = m.id.trim();
      if (id) counts[id] = (counts[id] || 0) + 1;
    });
    return new Set(Object.keys(counts).filter((id) => counts[id] > 1));
  }, [methods]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Danh sách Cổng thanh toán</p>
          <p className="text-xs text-slate-500">Cấu hình các tùy chọn thanh toán khi khách mua hàng</p>
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
            + Thêm phương thức
          </Button>
        </div>
      </div>

      {methods.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500 dark:border-slate-800">
          Chưa có phương thức thanh toán. Vui lòng thêm tối thiểu một cổng thanh toán để khách có thể đặt hàng.
        </div>
      ) : (
        <>
          {/* BẢN DESKTOP: TABLE */}
          <div className="hidden sm:block overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                <TableRow>
                  <TableHead className="text-xs font-semibold w-1/5">Mã (ID)</TableHead>
                  <TableHead className="text-xs font-semibold w-1/4">Tên hiển thị</TableHead>
                  <TableHead className="text-xs font-semibold w-1/3">Mô tả</TableHead>
                  <TableHead className="text-xs font-semibold w-1/5">Loại thanh toán</TableHead>
                  <TableHead className="text-xs font-semibold text-right w-24">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {methods.map((method, index) => {
                  const isIdEmpty = !method.id.trim();
                  const isLabelEmpty = !method.label.trim();
                  const isDuplicate = duplicateIds.has(method.id.trim());
                  const hasError = isIdEmpty || isLabelEmpty || isDuplicate;

                  return (
                    <TableRow key={`${method.id}-${index}`} className={cn(hasError && "bg-rose-50/20 dark:bg-rose-950/5")}>
                      <TableCell className="p-3">
                        <div className="space-y-1">
                          <Input
                            placeholder="Mã (ví dụ: cod, mbbank...)"
                            value={method.id}
                            onChange={(event) => handleUpdate(index, { id: event.target.value.toLowerCase().replace(/\s+/g, '-') })}
                            className={cn((isIdEmpty || isDuplicate) && "border-rose-500 focus-visible:ring-rose-500")}
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
                      </TableCell>
                      <TableCell className="p-3">
                        <div className="space-y-1">
                          <Input
                            placeholder="Tên hiển thị khi checkout"
                            value={method.label}
                            onChange={(event) => handleUpdate(index, { label: event.target.value })}
                            className={cn(isLabelEmpty && "border-rose-500 focus-visible:ring-rose-500")}
                          />
                          {isLabelEmpty && (
                            <span className="text-[10px] text-rose-500 flex items-center gap-1">
                              <AlertCircle size={10} /> Tên không được rỗng
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="p-3">
                        <Input
                          placeholder="Mô tả phụ ngắn"
                          value={method.description ?? ''}
                          onChange={(event) => handleUpdate(index, { description: event.target.value })}
                        />
                      </TableCell>
                      <TableCell className="p-3">
                        <select
                          className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                          value={method.type}
                          onChange={(event) => handleUpdate(index, { type: event.target.value as PaymentMethodType })}
                        >
                          {PAYMENT_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell className="p-3 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveClick(method.id, index)}
                          className={cn(
                            "text-xs transition-colors h-9 px-3",
                            deleteConfirms[method.id]
                              ? "bg-rose-600 hover:bg-rose-500 text-white font-bold animate-pulse"
                              : "text-slate-500 hover:text-rose-600 hover:bg-rose-50/50"
                          )}
                        >
                          {deleteConfirms[method.id] ? 'Xác nhận?' : <Trash2 size={14} />}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* BẢN MOBILE: CARDS */}
          <div className="block sm:hidden space-y-4">
            {methods.map((method, index) => {
              const isIdEmpty = !method.id.trim();
              const isLabelEmpty = !method.label.trim();
              const isDuplicate = duplicateIds.has(method.id.trim());
              const hasError = isIdEmpty || isLabelEmpty || isDuplicate;

              return (
                <div
                  key={`${method.id}-${index}`}
                  className={cn(
                    "p-4 rounded-xl border space-y-3 bg-white dark:bg-slate-950 transition-colors",
                    hasError
                      ? "border-rose-300 bg-rose-50/5 dark:border-rose-900/50"
                      : "border-slate-200 dark:border-slate-800"
                  )}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-emerald-600">Phương thức #{index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveClick(method.id, index)}
                      className={cn(
                        "text-xs h-8 px-3 font-semibold",
                        deleteConfirms[method.id]
                          ? "bg-rose-600 text-white animate-pulse rounded-md"
                          : "text-rose-500 hover:bg-rose-50/50"
                      )}
                    >
                      {deleteConfirms[method.id] ? 'Xác nhận xóa?' : 'Xóa'}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-500 block">Mã phương thức (ID)</label>
                      <Input
                        placeholder="Mã (ví dụ: cod, mbbank...)"
                        value={method.id}
                        onChange={(event) => handleUpdate(index, { id: event.target.value.toLowerCase().replace(/\s+/g, '-') })}
                        className={cn((isIdEmpty || isDuplicate) && "border-rose-500 focus-visible:ring-rose-500")}
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

                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-500 block">Tên hiển thị</label>
                      <Input
                        placeholder="Tên hiển thị khi checkout"
                        value={method.label}
                        onChange={(event) => handleUpdate(index, { label: event.target.value })}
                        className={cn(isLabelEmpty && "border-rose-500 focus-visible:ring-rose-500")}
                      />
                      {isLabelEmpty && (
                        <span className="text-[10px] text-rose-500 flex items-center gap-1">
                          <AlertCircle size={10} /> Tên không được rỗng
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-500 block">Mô tả phụ</label>
                      <Input
                        placeholder="Mô tả phụ ngắn"
                        value={method.description ?? ''}
                        onChange={(event) => handleUpdate(index, { description: event.target.value })}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-500 block">Loại cổng</label>
                      <select
                        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                        value={method.type}
                        onChange={(event) => handleUpdate(index, { type: event.target.value as PaymentMethodType })}
                      >
                        {PAYMENT_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
