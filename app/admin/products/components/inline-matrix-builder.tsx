"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Plus, Trash2, Wand2 } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui";

export type OptionCatalogItem = {
  id: Id<"productOptions">;
  name: string;
  order: number;
  values: Array<{
    id: Id<"productOptionValues">;
    label: string;
    order: number;
  }>;
};

export type VariantOptionSelection = {
  optionId: Id<"productOptions">;
  valueIds: Id<"productOptionValues">[];
};

export type VariantRow = {
  id?: Id<"productVariants">;
  sku: string;
  price: number;
  salePrice?: number;
  stock: number;
  optionValues: Array<{
    optionId: Id<"productOptions">;
    valueId: Id<"productOptionValues">;
  }>;
};

interface InlineMatrixBuilderProps {
  baseSku: string;
  basePrice: number;
  optionCatalog: OptionCatalogItem[];
  initialSelections?: VariantOptionSelection[];
  initialVariants?: VariantRow[];
  onChange: (selections: VariantOptionSelection[], variants: VariantRow[]) => void;
}

const buildVariantKey = (optionValues: VariantRow["optionValues"]) =>
  optionValues
    .slice()
    .sort((a, b) => a.optionId.localeCompare(b.optionId))
    .map((item) => `${item.optionId}:${item.valueId}`)
    .join("|");

const SKU_PART_OVERRIDES: Record<string, string> = {
  den: "BLK",
  black: "BLK",
  trang: "WHT",
  white: "WHT",
  do: "RED",
  red: "RED",
  xanh: "BLU",
  xanhduong: "BLU",
  blue: "BLU",
  green: "GRN",
  xanhla: "GRN",
  vang: "YLW",
  yellow: "YLW",
  xam: "GRY",
  gray: "GRY",
  grey: "GRY",
  nau: "BRN",
  brown: "BRN",
  be: "BEI",
  beige: "BEI",
  hong: "PNK",
  pink: "PNK",
  tim: "PUR",
  purple: "PUR",
  cam: "ORG",
  orange: "ORG",
};

const normalizeSkuKey = (value: string) => value
  .normalize("NFD").replaceAll(/[\u0300-\u036F]/g, "")
  .replaceAll(/[đĐ]/g, "d")
  .replaceAll(/[^A-Za-z0-9]/g, "")
  .toLowerCase();

const normalizeSkuPart = (value: string) => value
  ? SKU_PART_OVERRIDES[normalizeSkuKey(value)] ?? value
    .normalize("NFD").replaceAll(/[\u0300-\u036F]/g, "")
    .replaceAll(/[đĐ]/g, "D")
    .replaceAll(/[^A-Za-z0-9]/g, "")
    .toUpperCase()
    .slice(0, 3)
  : "";

export function InlineMatrixBuilder({
  baseSku,
  basePrice,
  optionCatalog,
  initialSelections = [],
  initialVariants = [],
  onChange,
}: InlineMatrixBuilderProps) {
  const [selections, setSelections] = useState<VariantOptionSelection[]>(initialSelections);
  const [variants, setVariants] = useState<VariantRow[]>(initialVariants);
  const [variantToDelete, setVariantToDelete] = useState<VariantRow | null>(null);
  const previousBaseSkuRef = useRef(baseSku.trim());

  const removeVariantAPI = useMutation(api.productsSmart.removeVariantWithCascade);

  const catalogById = useMemo(() => {
    const map = new Map<Id<"productOptions">, OptionCatalogItem>();
    optionCatalog.forEach((option) => map.set(option.id, option));
    return map;
  }, [optionCatalog]);

  const valueLabelById = useMemo(() => {
    const map = new Map<Id<"productOptionValues">, string>();
    optionCatalog.forEach((option) => {
      option.values.forEach((value) => map.set(value.id, value.label));
    });
    return map;
  }, [optionCatalog]);

  const buildSkuForOptionValues = (optionValues: VariantRow["optionValues"]) => {
    const safeBaseSku = baseSku.trim() || "SP";
    const suffix = optionValues
      .map((item) => normalizeSkuPart(valueLabelById.get(item.valueId) ?? ""))
      .filter(Boolean)
      .join("-");
    return suffix ? `${safeBaseSku}-${suffix}` : safeBaseSku;
  };

  useEffect(() => {
    setSelections(initialSelections);
  }, [initialSelections]);

  useEffect(() => {
    setVariants(initialVariants);
  }, [initialVariants]);

  useEffect(() => {
    const previousBaseSku = previousBaseSkuRef.current;
    const nextBaseSku = baseSku.trim();
    if (!nextBaseSku || previousBaseSku === nextBaseSku) {
      return;
    }
    if (!previousBaseSku) {
      previousBaseSkuRef.current = nextBaseSku;
      return;
    }
    setVariants((currentVariants) => {
      const nextVariants = currentVariants.map((variant) => {
        if (!variant.sku.startsWith(`${previousBaseSku}-`)) {
          return variant;
        }
        return { ...variant, sku: `${nextBaseSku}-${variant.sku.slice(previousBaseSku.length + 1)}` };
      });
      if (JSON.stringify(nextVariants) !== JSON.stringify(currentVariants)) {
        onChange(selections, nextVariants);
      }
      return nextVariants;
    });
    previousBaseSkuRef.current = nextBaseSku;
  }, [baseSku]);

  const emitSelections = (nextSelections: VariantOptionSelection[], nextVariants = variants) => {
    setSelections(nextSelections);
    onChange(nextSelections, nextVariants);
  };

  useEffect(() => {
    if (selections.length === 0 || selections.some((selection) => selection.valueIds.length === 0)) {
      if (variants.length > 0) {
        setVariants([]);
        onChange(selections, []);
      }
      return;
    }

    const combos: VariantRow["optionValues"][] = [[]];
    for (const selection of selections) {
      const next: VariantRow["optionValues"][] = [];
      combos.forEach((combo) => {
        selection.valueIds.forEach((valueId) => {
          next.push([...combo, { optionId: selection.optionId, valueId }]);
        });
      });
      combos.splice(0, combos.length, ...next);
    }

    const nextVariants = combos.map((combo) => {
      const key = buildVariantKey(combo);
      const existing = variants.find((variant) => buildVariantKey(variant.optionValues) === key);
      if (existing) {
        return existing.sku ? existing : { ...existing, sku: buildSkuForOptionValues(combo) };
      }
      return {
        sku: buildSkuForOptionValues(combo),
        price: basePrice,
        stock: 0,
        optionValues: combo,
      } satisfies VariantRow;
    });

    if (JSON.stringify(nextVariants) !== JSON.stringify(variants)) {
      setVariants(nextVariants);
      onChange(selections, nextVariants);
    }
  }, [selections, basePrice, optionCatalog, baseSku, valueLabelById]);

  const availableOptions = (currentOptionId?: Id<"productOptions">) => {
    const used = new Set(selections.map((selection) => selection.optionId));
    return optionCatalog.filter((option) => option.id === currentOptionId || !used.has(option.id));
  };

  const addOption = () => {
    const option = availableOptions()[0];
    if (!option) {
      toast.error("Không còn thuộc tính nào để chọn");
      return;
    }
    emitSelections([...selections, { optionId: option.id, valueIds: [] }]);
  };

  const updateOption = (index: number, optionId: Id<"productOptions">) => {
    const nextSelections = [...selections];
    nextSelections[index] = { optionId, valueIds: [] };
    emitSelections(nextSelections);
  };

  const removeOption = (index: number) => {
    emitSelections(selections.filter((_, itemIndex) => itemIndex !== index));
  };

  const toggleValue = (optionIndex: number, valueId: Id<"productOptionValues">) => {
    const nextSelections = [...selections];
    const selection = nextSelections[optionIndex];
    const nextValueIds = selection.valueIds.includes(valueId)
      ? selection.valueIds.filter((id) => id !== valueId)
      : [...selection.valueIds, valueId];
    nextSelections[optionIndex] = { ...selection, valueIds: nextValueIds };
    emitSelections(nextSelections);
  };

  const selectAllValues = (optionIndex: number) => {
    const selection = selections[optionIndex];
    const option = catalogById.get(selection.optionId);
    if (!option) {return;}
    const nextSelections = [...selections];
    nextSelections[optionIndex] = { ...selection, valueIds: option.values.map((value) => value.id) };
    emitSelections(nextSelections);
  };

  const clearValues = (optionIndex: number) => {
    const nextSelections = [...selections];
    nextSelections[optionIndex] = { ...nextSelections[optionIndex], valueIds: [] };
    emitSelections(nextSelections);
  };

  const handleMagicWand = () => {
    const nextVariants = variants.map((variant) => ({ ...variant, sku: buildSkuForOptionValues(variant.optionValues) }));
    setVariants(nextVariants);
    onChange(selections, nextVariants);
    toast.success("Đã tự động sinh SKU cho toàn bộ biến thể");
  };

  const updateVariantField = (index: number, field: keyof Pick<VariantRow, "sku" | "price" | "salePrice" | "stock">, value: string | number | undefined) => {
    const nextVariants = [...variants];
    nextVariants[index] = { ...nextVariants[index], [field]: value };
    setVariants(nextVariants);
    onChange(selections, nextVariants);
  };

  const handleDeleteVariantClick = (variant: VariantRow) => {
    if (!variant.id) {
      const nextVariants = variants.filter((item) => item !== variant);
      setVariants(nextVariants);
      onChange(selections, nextVariants);
      return;
    }
    setVariantToDelete(variant);
  };

  const confirmDeleteVariant = async () => {
    if (!variantToDelete?.id) {return;}
    try {
      await removeVariantAPI({ variantId: variantToDelete.id });
      const nextVariants = variants.filter((variant) => variant.id !== variantToDelete.id);
      setVariants(nextVariants);
      onChange(selections, nextVariants);
      toast.success("Đã xóa biến thể và dọn dẹp dữ liệu liên quan");
    } catch {
      toast.error("Lỗi khi xóa biến thể");
    } finally {
      setVariantToDelete(null);
    }
  };

  const variantLabel = (variant: VariantRow) => variant.optionValues
    .map((item) => {
      const optionName = catalogById.get(item.optionId)?.name;
      const valueLabel = valueLabelById.get(item.valueId) ?? "N/A";
      return optionName ? `${optionName}: ${valueLabel}` : valueLabel;
    })
    .join(" / ");

  return (
    <div className="space-y-6 rounded-lg border bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-900/40">
      <div>
        <h3 className="text-lg font-medium">Tạo nhanh phiên bản từ thuộc tính có sẵn</h3>
        <p className="text-sm text-slate-500">Chọn thuộc tính và giá trị đã cấu hình ở trang Loại tùy chọn, hệ thống sẽ tự tạo bảng phiên bản tổ hợp.</p>
      </div>

      <div className="space-y-4">
        {selections.map((selection, optionIndex) => {
          const option = catalogById.get(selection.optionId);
          const optionValues = option?.values ?? [];
          return (
            <div key={`${selection.optionId}-${optionIndex}`} className="rounded-md border bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex flex-col gap-3 md:flex-row md:items-start">
                <div className="w-full md:w-64">
                  <Label>Thuộc tính</Label>
                  <select
                    value={selection.optionId}
                    onChange={(event) => updateOption(optionIndex, event.target.value as Id<"productOptions">)}
                    className="mt-2 h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  >
                    {availableOptions(selection.optionId).map((catalogOption) => (
                      <option key={catalogOption.id} value={catalogOption.id}>{catalogOption.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label>Giá trị có sẵn</Label>
                    {optionValues.length > 0 && (
                      <div className="flex gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={() => selectAllValues(optionIndex)}>Chọn tất cả</Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => clearValues(optionIndex)}>Bỏ chọn</Button>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {optionValues.map((value) => {
                      const checked = selection.valueIds.includes(value.id);
                      return (
                        <button
                          key={value.id}
                          type="button"
                          onClick={() => toggleValue(optionIndex, value.id)}
                          className={`rounded-full border px-3 py-1 text-sm transition-colors ${checked
                            ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-200'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
                        >
                          {value.label}
                        </button>
                      );
                    })}
                    {optionValues.length === 0 && (
                      <p className="text-sm text-slate-500">Thuộc tính này chưa có giá trị. Hãy thêm giá trị ở trang Loại tùy chọn.</p>
                    )}
                  </div>
                </div>
                <Button type="button" variant="ghost" size="icon" className="text-red-500" onClick={() => removeOption(optionIndex)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}

        <Button type="button" variant="outline" onClick={addOption} className="gap-2" disabled={availableOptions().length === 0}>
          <Plus className="h-4 w-4" /> Thêm thuộc tính có sẵn
        </Button>
        {optionCatalog.length === 0 && (
          <p className="text-sm text-slate-500">Chưa có thuộc tính nào. Hãy tạo ở trang Loại tùy chọn trước.</p>
        )}
      </div>

      {variants.length > 0 && (
        <div className="mt-8">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="font-medium text-slate-700 dark:text-slate-200">Bảng phiên bản ({variants.length})</h4>
          </div>
          <div className="overflow-hidden rounded-md border bg-white dark:border-slate-700 dark:bg-slate-900">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800">
                <TableRow>
                  <TableHead className="w-[220px]">Phân loại</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      SKU
                      <Button type="button" size="sm" variant="secondary" onClick={handleMagicWand} className="h-7 px-2 text-xs font-semibold text-purple-600">
                        <Wand2 className="mr-1 h-3 w-3" /> Tự sinh SKU
                      </Button>
                    </div>
                  </TableHead>
                  <TableHead className="w-[150px]">Giá bán</TableHead>
                  <TableHead className="w-[150px]">Giá trước giảm</TableHead>
                  <TableHead className="w-[120px]">Tồn kho</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {variants.map((variant, index) => (
                  <TableRow key={variant.id ?? buildVariantKey(variant.optionValues)}>
                    <TableCell className="font-medium">{variantLabel(variant)}</TableCell>
                    <TableCell>
                      <Input value={variant.sku} onChange={(event) => updateVariantField(index, "sku", event.target.value)} placeholder="VD: SP-DEN-39" className="h-8" />
                    </TableCell>
                    <TableCell>
                      <Input type="number" value={variant.price || ""} onChange={(event) => updateVariantField(index, "price", Number.parseFloat(event.target.value) || 0)} className="h-8" />
                    </TableCell>
                    <TableCell>
                      <Input type="number" value={variant.salePrice || ""} onChange={(event) => updateVariantField(index, "salePrice", event.target.value.trim() ? Number.parseFloat(event.target.value) || undefined : undefined)} className="h-8" />
                    </TableCell>
                    <TableCell>
                      <Input type="number" value={variant.stock || ""} onChange={(event) => updateVariantField(index, "stock", Number.parseInt(event.target.value) || 0)} className="h-8" />
                    </TableCell>
                    <TableCell>
                      <Button type="button" variant="ghost" size="icon" onClick={() => handleDeleteVariantClick(variant)}>
                        <Trash2 className="h-4 w-4 text-red-400 hover:text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <Dialog open={Boolean(variantToDelete)} onOpenChange={() => setVariantToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" /> Cảnh báo quan trọng
            </DialogTitle>
            <DialogDescription className="text-slate-700">
              Bạn đang yêu cầu <b>xóa vĩnh viễn</b> biến thể <b>{variantToDelete ? variantLabel(variantToDelete) : ''}</b>.
              <br /><br />
              Hệ thống sẽ tự động dọn dẹp giỏ hàng và wishlist liên quan. Lịch sử đơn hàng vẫn được giữ lại.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setVariantToDelete(null)}>Hủy</Button>
            <Button type="button" onClick={confirmDeleteVariant} className="bg-red-600 text-white hover:bg-red-700">Vẫn xóa vĩnh viễn</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
