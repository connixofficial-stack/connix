import { Workbook } from 'exceljs';
import { describe, expect, it } from 'vitest';
import { getProductExcelColumns } from '../excel-contract';
import { buildProductTemplateSheet } from '../excel-styles';

const getNameColumnIndex = (columns: ReturnType<typeof getProductExcelColumns>) =>
  columns.findIndex((column) => column.key === 'name');

const hasTextValue = (value: unknown) => typeof value === 'string' && value.trim().length > 0;

describe('buildProductTemplateSheet', () => {
  it('luôn có dòng ví dụ với full cột', () => {
    const workbook = new Workbook();
    const columns = getProductExcelColumns(new Set(['salePrice', 'stock', 'image', 'description']));
    const sheet = buildProductTemplateSheet(workbook, columns);

    expect(sheet.rowCount).toBeGreaterThan(1);
    const nameIndex = getNameColumnIndex(columns);
    expect(nameIndex).toBeGreaterThanOrEqual(0);
    const sampleName = sheet.getRow(2).getCell(nameIndex + 1).value;
    const lastExampleName = sheet.getRow(7).getCell(nameIndex + 1).value;
    expect(hasTextValue(sampleName)).toBe(true);
    expect(hasTextValue(lastExampleName)).toBe(true);
  });

  it('luôn có dòng ví dụ khi chỉ bật một phần cột', () => {
    const workbook = new Workbook();
    const columns = getProductExcelColumns(new Set(['salePrice']));
    const sheet = buildProductTemplateSheet(workbook, columns);

    expect(sheet.rowCount).toBeGreaterThan(1);
    const nameIndex = getNameColumnIndex(columns);
    expect(nameIndex).toBeGreaterThanOrEqual(0);
    const sampleName = sheet.getRow(2).getCell(nameIndex + 1).value;
    const lastExampleName = sheet.getRow(7).getCell(nameIndex + 1).value;
    expect(hasTextValue(sampleName)).toBe(true);
    expect(hasTextValue(lastExampleName)).toBe(true);
  });
});
