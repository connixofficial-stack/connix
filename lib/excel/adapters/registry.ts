import { ExcelImportAdapter } from "./excel-adapter.interface";
import { SapoThanShoesAdapter } from "./sapo-thanshoes.adapter";

const ADAPTERS: ExcelImportAdapter[] = [
  SapoThanShoesAdapter
  // Có thể thêm KiotVietAdapter, ShopifyAdapter... vào đây trong tương lai
];

export function findAdapter(workbook: any): ExcelImportAdapter | null {
  for (const adapter of ADAPTERS) {
    if (adapter.detect(workbook)) {
      return adapter;
    }
  }
  return null;
}
