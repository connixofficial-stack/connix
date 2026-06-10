import * as ExcelJS from "exceljs";
import { ExcelImportAdapter, CompatibilityIssue } from "./excel-adapter.interface";
import type { ProductModuleConfig, ExcelOptionDef } from "@/lib/excel/product-schema-builder";
import type { ParsedProductRecord } from "@/app/admin/products/actions/excel-actions";

function getCellText(cell: ExcelJS.Cell): string {
  const val = cell.value;
  if (val === null || val === undefined) return "";
  if (typeof val === "object") {
    if (val instanceof Date) {
      return val.toISOString();
    }
    if ("richText" in val && Array.isArray(val.richText)) {
      return val.richText.map((t: any) => t.text || "").join("").trim();
    }
    if ("text" in val) {
      return String(val.text).trim();
    }
    if ("hyperlink" in val) {
      return String(val.hyperlink).trim();
    }
    return "";
  }
  return String(val).trim();
}

export const SapoThanShoesAdapter: ExcelImportAdapter = {
  id: "sapo_thanshoes",
  name: "ThanShoes Sapo Excel",
  description: "Bộ chuyển đổi dữ liệu sản phẩm xuất từ hệ thống Sapo của ThanShoes.",

  detect(workbook: ExcelJS.Workbook): boolean {
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) return false;
    
    const row1 = worksheet.getRow(1);
    let hasSku = false;
    let hasProductName = false;
    
    row1.eachCell({ includeEmpty: true }, (cell) => {
      const val = getCellText(cell).toLowerCase().replace(/[*]/g, "").trim();
      if (val === "mã sku" || val === "sku") hasSku = true;
      if (val === "tên sản phẩm") hasProductName = true;
    });

    // Đối chiếu thêm: Sheet đầu tiên thường không có tên là "SanPham" (chỉ có trong template hệ thống mới)
    return hasSku && hasProductName && worksheet.name !== "SanPham";
  },

  checkCompatibility(config: ProductModuleConfig): CompatibilityIssue[] {
    const issues: CompatibilityIssue[] = [];

    if (!config.hasVariants) {
      issues.push({
        key: "variantEnabled",
        label: "Phiên bản (variantEnabled = true)",
        expected: true,
        actual: false,
        description: "Yêu cầu bật tính năng Phiên bản để import các thuộc tính như kích cỡ (size)."
      });
    }

    if (config.priceStrategy !== "VARIANT_LEVEL") {
      issues.push({
        key: "variantPricing",
        label: "Giá bán cấp Phiên bản (variantPricing = variant)",
        expected: "VARIANT_LEVEL",
        actual: config.priceStrategy,
        description: "Yêu cầu quản lý giá ở cấp Phiên bản để import giá riêng biệt cho từng size."
      });
    }

    if (config.inventoryStrategy !== "VARIANT_LEVEL") {
      issues.push({
        key: "variantStock",
        label: "Tồn kho cấp Phiên bản (variantStock = variant)",
        expected: "VARIANT_LEVEL",
        actual: config.inventoryStrategy,
        description: "Yêu cầu quản lý tồn kho ở cấp Phiên bản để import số lượng tồn từng size."
      });
    }

    return issues;
  },

  async parse(
    workbook: ExcelJS.Workbook,
    config: ProductModuleConfig,
    options?: ExcelOptionDef[],
    categories?: { id: string; name: string }[]
  ): Promise<ParsedProductRecord[]> {
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) throw new Error("Không tìm thấy worksheet hợp lệ");

    const recordsMap = new Map<string, ParsedProductRecord>();
    const rowCount = worksheet.rowCount;

    // Map cột động dựa trên tên header ở dòng 1 (loại bỏ dấu * ở cuối)
    const headerRow = worksheet.getRow(1);
    const colMap: Record<string, number> = {};
    
    headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const val = getCellText(cell).toLowerCase().replace(/[*]/g, "").trim();
      if (val) colMap[val] = colNumber;
    });

    const getColIndex = (names: string[], defaultCol: number): number => {
      for (const name of names) {
        const lowerName = name.toLowerCase().replace(/[*]/g, "").trim();
        if (colMap[lowerName]) return colMap[lowerName];
      }
      return defaultCol;
    };

    // Xác định cột động (nếu không map được, dùng fallback mặc định dựa trên cấu trúc Sapo ThanShoes cũ)
    const skuCol = getColIndex(["mã sku", "sku"], 14);      // N
    const nameCol = getColIndex(["tên sản phẩm"], 1);       // A
    const typeCol = getColIndex(["loại sản phẩm", "loại"], 3); // C
    const opt1NameCol = getColIndex(["thuộc tính 1"], 7); // G
    const opt1ValueCol = getColIndex(["giá trị thuộc tính 1", "thuộc tính 1", "size", "kích cỡ"], 8); // H
    const opt2NameCol = getColIndex(["thuộc tính 2"], 9); // I
    const opt2ValueCol = getColIndex(["giá trị thuộc tính 2", "thuộc tính 2"], 10); // J
    const priceCol = getColIndex(["giá bán lẻ", "giá bán", "pl_giá bán lẻ"], 32); // AF
    const stockCol = getColIndex(["tồn kho", "tồn kho thực tế", "lc_cn1_tồn kho ban đầu"], 27); // AA
    const imageCol = getColIndex(["ảnh đại diện", "đường dẫn ảnh", "ảnh biến thể"], 18); // R

    let currentProductName = "";
    let currentType = "";
    let currentOpt1Name = "";
    let currentOpt2Name = "";

    const detectedOptions = new Set<string>();

    for (let r = 2; r <= rowCount; r++) {
      const row = worksheet.getRow(r);
      
      const skuVal = getCellText(row.getCell(skuCol));
      if (!skuVal) continue; // Bỏ qua dòng trống hoặc không có SKU

      // Đọc các thông tin chung của sản phẩm cha nếu có
      const nameVal = getCellText(row.getCell(nameCol));
      if (nameVal) {
        currentProductName = nameVal;
        currentType = getCellText(row.getCell(typeCol));
      }

      // Cập nhật tên thuộc tính động khi có giá trị mới xuất hiện ở dòng cha/con
      const opt1NameVal = getCellText(row.getCell(opt1NameCol));
      if (opt1NameVal) currentOpt1Name = opt1NameVal;

      const opt2NameVal = getCellText(row.getCell(opt2NameCol));
      if (opt2NameVal) currentOpt2Name = opt2NameVal;

      if (currentOpt1Name) detectedOptions.add(currentOpt1Name);
      if (currentOpt2Name) detectedOptions.add(currentOpt2Name);

      // Sapo gom SKU biến thể là "SKUCHA-SIZE". Ta lấy SKUCHA làm SKU sản phẩm
      const skuParts = skuVal.split("-");
      const parentSku = skuParts[0];

      // Tìm categoryId tương ứng từ tên loại sản phẩm
      let categoryId: string | undefined = undefined;
      if (categories && categories.length > 0 && currentType) {
        const cleanType = currentType.toLowerCase().trim();
        const matched = categories.find(c => {
          const catName = c.name.toLowerCase().trim();
          return catName === cleanType || catName.includes(cleanType) || cleanType.includes(catName);
        });
        if (matched) {
          categoryId = matched.id;
        } else {
          categoryId = categories[0].id; // Fallback gán danh mục đầu tiên nếu không khớp
        }
      }

      let parentRecord = recordsMap.get(parentSku);
      if (!parentRecord) {
        parentRecord = {
          sku: parentSku,
          name: currentProductName || parentSku,
          categoryId: categoryId,
          categoryName: currentType || undefined,
          productType: "physical",
          imageUrl: getCellText(row.getCell(imageCol)) || undefined,
          images: [],
          variants: []
        };
        recordsMap.set(parentSku, parentRecord);
      }

      // Xử lý giá trị số (Giá & Tồn)
      const parseNumber = (cellVal: any): number => {
        if (cellVal === null || cellVal === undefined) return 0;
        const clean = cellVal.toString().replace(/[,.]/g, "");
        const num = Number(clean);
        return isNaN(num) ? 0 : num;
      };

      const priceVal = parseNumber(row.getCell(priceCol).value);
      const stockVal = parseNumber(row.getCell(stockCol).value);
      const imgVal = getCellText(row.getCell(imageCol));

      // Đồng bộ ảnh biến thể vào danh sách ảnh sản phẩm cha nếu chưa có
      if (imgVal && parentRecord.images && !parentRecord.images.includes(imgVal)) {
        parentRecord.images.push(imgVal);
      }

      // Thêm biến thể
      parentRecord.variants.push({
        sku: skuVal,
        variantOption1: getCellText(row.getCell(opt1ValueCol)) || undefined,
        variantOption1Name: currentOpt1Name || undefined,
        variantOption2: getCellText(row.getCell(opt2ValueCol)) || undefined,
        variantOption2Name: currentOpt2Name || undefined,
        price: priceVal,
        salePrice: undefined,
        stock: stockVal,
        imageUrl: imgVal || undefined,
      });
    }

    const resultRecords = Array.from(recordsMap.values());
    if (resultRecords.length > 0) {
      resultRecords[0].detectedOptionNames = Array.from(detectedOptions).filter(Boolean).slice(0, 2);
    }

    return resultRecords;
  }
};
