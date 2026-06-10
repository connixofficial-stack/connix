import * as ExcelJS from "exceljs";
import type { ProductModuleConfig, ExcelOptionDef } from "@/lib/excel/product-schema-builder";
import type { ParsedProductRecord } from "@/app/admin/products/actions/excel-actions";

export interface CompatibilityIssue {
  key: string;
  label: string;
  expected: any;
  actual: any;
  description: string;
}

export interface ExcelImportAdapter {
  id: string;
  name: string;
  description: string;
  
  // Nhận diện file Excel này có dành cho Adapter này không
  detect(workbook: ExcelJS.Workbook): boolean;
  
  // Kiểm tra tính tương thích của cấu hình hệ thống
  checkCompatibility(config: ProductModuleConfig): CompatibilityIssue[];
  
  // Thực hiện parse file Excel thành mảng dữ liệu chuẩn ParsedProductRecord[]
  parse(
    workbook: ExcelJS.Workbook,
    config: ProductModuleConfig,
    options?: ExcelOptionDef[],
    categories?: { id: string; name: string }[]
  ): Promise<ParsedProductRecord[]>;
}
