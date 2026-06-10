"use server";

import * as ExcelJS from "exceljs";
import { buildExcelColumns, ProductModuleConfig, ExcelOptionDef } from "@/lib/excel/product-schema-builder";
import { findAdapter } from "@/lib/excel/adapters/registry";
import type { CompatibilityIssue } from "@/lib/excel/adapters/excel-adapter.interface";

// ==========================================
// Color palette — Professional navy/teal theme
// ==========================================
const COLORS = {
  // Row 1 — Group header
  groupBg: "FF1B3A5C",       // Navy đậm
  groupFont: "FFFFFFFF",
  // Row 2 — Column header (required)
  headerReqBg: "FF2E7D9B",   // Teal trung
  headerReqFont: "FFFFFFFF",
  // Row 2 — Column header (optional)
  headerOptBg: "FFDCE6F1",   // Steel blue nhạt dịu
  headerOptFont: "FF1B3A5C", // Navy đậm
  // Row 3 — Microcopy
  microcopyBg: "FFF0F4F8",   // Off-white xanh
  microcopyFont: "FF64748B",  // Slate
  // Data cells
  dataRequired: "FFFFFBEB",   // Vàng kem nhạt — nhắc user cần điền
  dataReadOnly: "FFF1F5F9",   // Xám nhạt — locked
  dataDefault: "FFFFFFFF",    // Trắng
  // Border
  border: "FFCBD5E1",        // Slate-300
  headerBorder: "FF94A3B8",  // Slate-400
} as const;

const THIN_BORDER = {
  top: { style: "thin" as const, color: { argb: COLORS.border } },
  left: { style: "thin" as const, color: { argb: COLORS.border } },
  bottom: { style: "thin" as const, color: { argb: COLORS.border } },
  right: { style: "thin" as const, color: { argb: COLORS.border } },
};

const HEADER_BORDER = {
  top: { style: "thin" as const, color: { argb: COLORS.headerBorder } },
  left: { style: "thin" as const, color: { argb: COLORS.headerBorder } },
  bottom: { style: "thin" as const, color: { argb: COLORS.headerBorder } },
  right: { style: "thin" as const, color: { argb: COLORS.headerBorder } },
};

export async function generateProductTemplateBase64(
  config: ProductModuleConfig,
  categories: { id: string; name: string }[],
  options?: ExcelOptionDef[]
): Promise<string> {
  const columnsDef = buildExcelColumns(config, options);
  const wb = new ExcelJS.Workbook();
  wb.creator = "SystemAdmin";
  wb.created = new Date();

  // --- Reference sheet (visible) for categories and product options dropdowns ---
  const refSheet = wb.addWorksheet("_Data_TuDien", { state: "visible" });
  
  const opt1 = options?.[0];
  const opt2 = options?.[1];

  const refHeaders = ["Danh Mục Sản Phẩm"];
  if (config.hasVariants) {
    if (opt1) refHeaders.push(opt1.name);
    if (opt2) refHeaders.push(opt2.name);
  }

  refSheet.getRow(1).values = refHeaders;
  refSheet.getRow(1).height = 28;
  refSheet.getRow(1).eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.groupBg } };
    cell.font = { color: { argb: COLORS.groupFont }, bold: true, size: 10, name: "Segoe UI" };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = HEADER_BORDER;
  });

  const maxRows = Math.max(
    categories.length,
    opt1?.values.length || 0,
    opt2?.values.length || 0
  );

  for (let r = 0; r < maxRows; r++) {
    const rowNum = r + 2;
    const catVal = categories[r] ? `${categories[r].id} | ${categories[r].name}` : "";
    const opt1Val = opt1?.values[r] || "";
    const opt2Val = opt2?.values[r] || "";

    const rowValues = [catVal];
    if (config.hasVariants) {
      if (opt1) rowValues.push(opt1Val);
      if (opt2) rowValues.push(opt2Val);
    }

    refSheet.getRow(rowNum).values = rowValues;
    refSheet.getRow(rowNum).height = 20;
    refSheet.getRow(rowNum).eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { size: 10, name: "Segoe UI" };
      cell.border = THIN_BORDER;
      cell.alignment = { vertical: "middle" };
    });
  }

  // Auto column width for refSheet
  let maxCatLen = 25;
  categories.forEach((c) => {
    const len = `${c.id} | ${c.name}`.length;
    if (len > maxCatLen) maxCatLen = len;
  });
  refSheet.getColumn(1).width = maxCatLen + 5;

  if (config.hasVariants) {
    if (opt1) {
      let maxValLen = opt1.name.length;
      opt1.values.forEach((v) => {
        if (v.length > maxValLen) maxValLen = v.length;
      });
      refSheet.getColumn(2).width = Math.max(20, maxValLen + 5);
    }
    if (opt2) {
      let maxValLen = opt2.name.length;
      opt2.values.forEach((v) => {
        if (v.length > maxValLen) maxValLen = v.length;
      });
      refSheet.getColumn(3).width = Math.max(20, maxValLen + 5);
    }
  }

  // --- Main sheet 'SanPham' ---
  const mainSheet = wb.addWorksheet("SanPham", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 3 }],
  });

  const row1 = mainSheet.getRow(1);
  const row2 = mainSheet.getRow(2);
  const row3 = mainSheet.getRow(3);

  // Lock header rows
  for (let r = 1; r <= 3; r++) {
    mainSheet.getRow(r).eachCell({ includeEmpty: true }, (cell) => {
      cell.protection = { locked: true };
    });
  }

  let currentGroup = "";
  let groupStartCol = 1;

  columnsDef.forEach((col, index) => {
    const colNum = index + 1;
    row2.getCell(colNum).value = col.header;
    row3.getCell(colNum).value = col.microcopy || "";
    row1.getCell(colNum).value = col.group;

    if (col.group !== currentGroup) {
      if (currentGroup !== "" && groupStartCol < colNum) {
        try { mainSheet.mergeCells(1, groupStartCol, 1, colNum - 1); } catch { /* merge overlap */ }
      }
      currentGroup = col.group;
      groupStartCol = colNum;
    }

    mainSheet.getColumn(colNum).width = col.width;

    // Pre-fill data area
    const bgColor = col.readOnly
      ? COLORS.dataReadOnly
      : col.required
        ? COLORS.dataRequired
        : COLORS.dataDefault;

    for (let r = 4; r <= 1004; r++) {
      const cell = mainSheet.getCell(r, colNum);
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
      cell.border = THIN_BORDER;
      cell.alignment = { vertical: "middle", wrapText: true };
      cell.protection = { locked: !!col.readOnly };
    }

    // Data validation dropdown
    if (col.type === "dropdown") {
      let formula = "";
      if (col.key === "category") {
        formula = `_Data_TuDien!$A$2:$A$${categories.length + 1}`;
      } else if (col.key === "variantOption1" && opt1 && opt1.values.length > 0) {
        formula = `_Data_TuDien!$B$2:$B$${opt1.values.length + 1}`;
      } else if (col.key === "variantOption2" && opt2 && opt2.values.length > 0) {
        formula = `_Data_TuDien!$C$2:$C$${opt2.values.length + 1}`;
      } else if (col.dropdownValues) {
        formula = `"${col.dropdownValues.join(",")}"`;
      }
      
      if (formula) {
        for (let r = 4; r <= 1004; r++) {
          mainSheet.getCell(r, colNum).dataValidation = {
            type: "list",
            allowBlank: !col.required,
            formulae: [formula],
            showErrorMessage: true,
            showInputMessage: true,
            promptTitle: col.header,
            prompt: "Chọn giá trị từ danh sách.",
            errorTitle: "Giá trị không hợp lệ",
            error: `Vui lòng chọn đúng giá trị trong danh sách cho cột "${col.header}".`,
          };
        }
      }
    }
  });

  // Merge last group
  try { mainSheet.mergeCells(1, groupStartCol, 1, columnsDef.length); } catch { /* merge overlap */ }

  // Style Row 1
  row1.height = 35;
  row1.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.groupBg } };
    cell.font = { color: { argb: COLORS.groupFont }, bold: true, size: 11, name: "Segoe UI" };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = HEADER_BORDER;
  });

  // Style Row 2
  row2.height = 30;
  row2.eachCell((cell, colNumber) => {
    const colDef = columnsDef[colNumber - 1];
    if (colDef.readOnly) {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
      cell.font = { italic: true, color: { argb: "FF475569" }, size: 10, name: "Segoe UI" };
    } else if (colDef.required) {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.headerReqBg } };
      cell.font = { bold: true, color: { argb: COLORS.headerReqFont }, size: 10, name: "Segoe UI" };
    } else {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.headerOptBg } };
      cell.font = { bold: true, color: { argb: COLORS.headerOptFont }, size: 10, name: "Segoe UI" };
    }
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = HEADER_BORDER;
  });

  // Style Row 3
  row3.height = 24;
  row3.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.microcopyBg } };
    cell.font = { italic: true, color: { argb: COLORS.microcopyFont }, size: 9, name: "Segoe UI" };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = HEADER_BORDER;
  });

  // Sheet protection
  await mainSheet.protect("admin_secret_123", {
    selectLockedCells: true,
    selectUnlockedCells: true,
    formatCells: true,
    formatColumns: false,
    formatRows: true,
    insertColumns: false,
    insertRows: true,
    insertHyperlinks: true,
    deleteColumns: false,
    deleteRows: true,
    sort: true,
    autoFilter: true,
  });

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer).toString("base64");
}

export interface ParsedProductRecord {
  id?: string;
  sku: string;
  name?: string;
  categoryId?: string;
  categoryName?: string;
  productType?: "physical" | "digital";
  price?: number;
  salePrice?: number;
  stock?: number;
  digitalDeliveryType?: string;
  digitalData?: string;
  imageUrl?: string;
  images?: string[];
  detectedOptionNames?: string[];
  variants: {
    sku?: string;
    variantOption1?: string;
    variantOption1Name?: string;
    variantOption2?: string;
    variantOption2Name?: string;
    price?: number;
    salePrice?: number;
    stock?: number;
    imageUrl?: string;
  }[];
}

export async function parseProductExcelBase64(
  base64String: string,
  config: ProductModuleConfig,
  options?: ExcelOptionDef[],
  categories?: { id: string; name: string }[]
): Promise<{ success: boolean; data?: ParsedProductRecord[]; optionNames?: string[]; error?: string }> {
  try {
    const buffer = Buffer.from(base64String, "base64");
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as any);

    // 1. Kiểm tra xem có Adapter tùy chỉnh nào đăng ký xử lý file này không
    const customAdapter = findAdapter(wb);
    if (customAdapter) {
      // Kiểm tra tính tương thích cấu hình hệ thống
      const issues = customAdapter.checkCompatibility(config);
      if (issues.length > 0) {
        const issuesText = issues.map(i => i.label).join(", ");
        return { 
          success: false, 
          error: `Cấu hình hệ thống chưa tương thích với file Excel ${customAdapter.name} (Lỗi: ${issuesText}). Vui lòng báo Dev hỗ trợ.` 
        };
      }
      console.log(`[Excel Import] Sử dụng bộ chuyển đổi: ${customAdapter.name}`);
      const data = await customAdapter.parse(wb, config, options, categories);
      return { success: true, data, optionNames: data[0]?.detectedOptionNames };
    }

    const mainSheet = wb.getWorksheet("SanPham");
    if (!mainSheet) {
      return { success: false, error: "Không tìm thấy Sheet 'SanPham' trong file." };
    }

    const columnsDef = buildExcelColumns(config, options);
    const row2 = mainSheet.getRow(2);

    // STRICT MODE CHECK
    for (let i = 0; i < columnsDef.length; i++) {
      const expectedHeader = columnsDef[i].header;
      const cellValue = row2.getCell(i + 1).value;
      const actualHeader = typeof cellValue === "string" || typeof cellValue === "number" || typeof cellValue === "boolean"
        ? String(cellValue)
        : "";
      if (expectedHeader !== actualHeader) {
        return { 
          success: false, 
          error: `Cấu hình hệ thống đã thay đổi (Strict Mode). Cột mong đợi: '${expectedHeader}', Cột trong file: '${actualHeader}'. Vui lòng xuất lại Template mới.` 
        };
      }
    }

    const recordsMap = new Map<string, ParsedProductRecord>();
    const rowCount = mainSheet.rowCount;

    for (let r = 4; r <= rowCount; r++) {
      const row = mainSheet.getRow(r);
      const rowData: Record<string, any> = {};
      
      let isEmpty = true;
      columnsDef.forEach((col, index) => {
        const val = row.getCell(index + 1).value;
        if (val !== null && val !== undefined && val !== "") isEmpty = false;
        
        if (typeof val === "object" && val && "richText" in val) {
          rowData[col.key] = (val as any).richText.map((t: any) => t.text).join("");
        } else {
          rowData[col.key] = val;
        }
      });

      if (isEmpty) continue;

      const id = rowData["id"]?.toString();
      const sku = rowData["sku"]?.toString();
      if (!sku) {
        return { success: false, error: `Dòng ${r} thiếu mã SKU bắt buộc.` };
      }

      const name = rowData["name"]?.toString();
      const categoryStr = rowData["category"]?.toString();
      const categoryId = categoryStr ? categoryStr.split(" | ")[0] : undefined;

      let parentRecord = recordsMap.get(sku);
      if (!parentRecord) {
        // Create new Parent
        parentRecord = {
          id: id,
          sku: sku,
          name: name,
          categoryId: categoryId,
          productType: rowData["productType"],
          price: config.priceStrategy === "PRODUCT_LEVEL" ? Number(rowData["price"]) : undefined,
          salePrice: config.priceStrategy === "PRODUCT_LEVEL" ? Number(rowData["salePrice"]) : undefined,
          stock: config.inventoryStrategy === "PRODUCT_LEVEL" ? Number(rowData["stock"]) : undefined,
          digitalDeliveryType: rowData["digitalDeliveryType"],
          digitalData: rowData["digitalData"],
          imageUrl: rowData["imageUrl"],
          images: rowData["imagesUrl"]
            ? rowData["imagesUrl"]
                .toString()
                .split(/[;,\n]+/)
                .map((url: string) => url.trim())
                .filter(Boolean)
            : undefined,
          variants: []
        };
        recordsMap.set(sku, parentRecord);
      }

      // Handle Variant Data if Variants are enabled
      if (config.hasVariants && (rowData["variantOption1"] || rowData["variantOption2"])) {
        parentRecord.variants.push({
          variantOption1: rowData["variantOption1"]?.toString(),
          variantOption2: rowData["variantOption2"]?.toString(),
          price: config.priceStrategy === "VARIANT_LEVEL" ? Number(rowData["price"]) : undefined,
          salePrice: config.priceStrategy === "VARIANT_LEVEL" ? Number(rowData["salePrice"]) : undefined,
          stock: config.inventoryStrategy === "VARIANT_LEVEL" ? Number(rowData["stock"]) : undefined,
          imageUrl: (config.imageStrategy === "OVERRIDE" || config.imageStrategy === "MIXED") ? rowData["variantImageUrl"]?.toString() : undefined,
        });
      }
    }

    return { success: true, data: Array.from(recordsMap.values()) };

  } catch (error: any) {
    return { success: false, error: `Lỗi parse Excel: ${error.message}` };
  }
}

export async function checkFileAdapterAndCompatibility(
  base64String: string,
  config: ProductModuleConfig
): Promise<{ adapterId: string | null; adapterName: string | null; issues: CompatibilityIssue[] }> {
  try {
    const buffer = Buffer.from(base64String, "base64");
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as any);

    const adapter = findAdapter(wb);
    if (adapter) {
      const issues = adapter.checkCompatibility(config);
      return {
        adapterId: adapter.id,
        adapterName: adapter.name,
        issues
      };
    }
    return { adapterId: null, adapterName: null, issues: [] };
  } catch (error) {
    console.error("[Excel Detect] Lỗi kiểm tra file:", error);
    return { adapterId: null, adapterName: null, issues: [] };
  }
}

