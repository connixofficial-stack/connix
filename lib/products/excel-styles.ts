import type { Workbook, Worksheet } from 'exceljs';
import type { ProductExcelColumn, ProductExcelColumnKey, ProductExcelStatus } from './excel-contract';
import { PRODUCT_STATUS_LABELS } from './excel-contract';

export type ProductExcelRow = Partial<Record<ProductExcelColumnKey, string | number | null>>;

const HEADER_FILL = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF97316' },
} as const;

const HEADER_FONT = {
  color: { argb: 'FFFFFFFF' },
  bold: true,
} as const;

const HEADER_BORDER = {
  bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
} as const;

const HEADER_ALIGNMENT = { vertical: 'middle', horizontal: 'center', wrapText: true } as const;

export function buildProductTemplateSheet(workbook: Workbook, columns: ProductExcelColumn[]) {
  const sheet = workbook.addWorksheet('Products', { views: [{ state: 'frozen', ySplit: 1 }] });
  sheet.columns = columns.map((column) => ({
    header: column.label,
    key: column.key,
    width: column.width ?? 20,
  }));

  styleHeaderRow(sheet, columns.length);
  sheet.autoFilter = { from: { column: 1, row: 1 }, to: { column: columns.length, row: 1 } };
  applyNumberFormats(sheet, columns);
  addExampleRows(sheet, columns);
  ensureExampleRows(sheet, columns);
  addStatusValidation(sheet, columns);

  return sheet;
}

export function buildProductExportSheet(workbook: Workbook, columns: ProductExcelColumn[]) {
  const sheet = workbook.addWorksheet('Products', { views: [{ state: 'frozen', ySplit: 1 }] });
  sheet.columns = columns.map((column) => ({
    header: column.label,
    key: column.key,
    width: column.width ?? 20,
  }));

  styleHeaderRow(sheet, columns.length);
  sheet.autoFilter = { from: { column: 1, row: 1 }, to: { column: columns.length, row: 1 } };
  applyNumberFormats(sheet, columns);
  return sheet;
}

export function fillProductExportRows(sheet: Worksheet, columns: ProductExcelColumn[], rows: ProductExcelRow[]) {
  rows.forEach((row) => {
    sheet.addRow(columns.map((column) => row[column.key] ?? ''));
  });
  applyNumberFormats(sheet, columns);
}

export function buildGuideSheet(workbook: Workbook, columns: ProductExcelColumn[]) {
  const sheet = workbook.addWorksheet('HDSD');
  sheet.columns = [{ width: 90 }];

  sheet.addRow(['HƯỚNG DẪN IMPORT SẢN PHẨM']);
  sheet.addRow(['']);
  sheet.addRow([`1) Các cột bắt buộc: ${columns.filter((c) => c.required).map((c) => c.label).join(', ')}.`]);
  sheet.addRow(['2) Trạng thái hợp lệ: ' + Object.values(PRODUCT_STATUS_LABELS).join(', ') + '.']);
  sheet.addRow(['3) Slug danh mục phải là slug hiện có trong hệ thống (không dùng tên danh mục).']);
  sheet.addRow(['4) SKU/Slug bị trùng sẽ được bỏ qua khi import.']);
  sheet.addRow(['5) Giá bán/Tồn kho phải là số, không nhập ký tự đặc biệt.']);
  sheet.addRow(['6) Cột Ảnh đại diện (URL) có thể nhập nhiều URL, ngăn cách bằng dấu ; (ảnh đầu là ảnh đại diện).']);
  sheet.addRow(['7) Products có 6 case mẫu: chuẩn, khuyến mãi, Draft, Archived, không có ảnh, mô tả dài.']);
  sheet.addRow(['8) Sheet LOI_MAU chỉ để tham khảo lỗi, tuyệt đối không dùng để import.']);
  sheet.addRow(['9) Checklist: SKU/Slug phải unique, categorySlug phải tồn tại, status phải đúng danh sách.']);

  sheet.getRow(1).font = { bold: true, size: 14 };
  sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'left' };
  return sheet;
}

export function buildErrorSampleSheet(workbook: Workbook, columns: ProductExcelColumn[]) {
  const sheet = workbook.addWorksheet('LOI_MAU', { views: [{ state: 'frozen', ySplit: 2 }] });
  sheet.columns = columns.map((column) => ({
    header: column.label,
    key: column.key,
    width: column.width ?? 20,
  }));

  sheet.addRow(['Sheet này chỉ để tham khảo lỗi, không dùng để import.']);
  sheet.mergeCells(1, 1, 1, columns.length);
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFB91C1C' } };
  sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'left' };

  styleHeaderRow(sheet, columns.length);
  sheet.autoFilter = { from: { column: 1, row: 2 }, to: { column: columns.length, row: 2 } };
  applyNumberFormats(sheet, columns);

  const errorRows: Record<ProductExcelColumnKey, string | number>[] = [
    {
      name: 'Thiếu SKU',
      slug: 'thieu-sku',
      sku: '',
      categorySlug: 'khong-ton-tai',
      price: 150000,
      salePrice: 0,
      stock: 20,
      status: 'SaiStatus',
      image: '',
      description: 'Thiếu SKU + categorySlug sai + status sai.',
    },
    {
      name: 'Giá sai định dạng',
      slug: 'gia-sai-dinh-dang',
      sku: 'ERR-PRICE',
      categorySlug: 'thoi-trang',
      price: 'abc',
      salePrice: 0,
      stock: 10,
      status: PRODUCT_STATUS_LABELS.Active,
      image: 'https://example.com/images/error.jpg',
      description: 'Giá bán không phải số.',
    },
    {
      name: 'Thiếu slug',
      slug: '',
      sku: 'ERR-SLUG',
      categorySlug: 'thoi-trang',
      price: 120000,
      salePrice: 0,
      stock: 5,
      status: PRODUCT_STATUS_LABELS.Draft,
      image: '',
      description: 'Thiếu slug bắt buộc.',
    },
    {
      name: 'Slug sai format',
      slug: 'Slug Có Dấu',
      sku: 'ERR-FORMAT',
      categorySlug: 'thoi-trang',
      price: 89000,
      salePrice: 0,
      stock: 5,
      status: PRODUCT_STATUS_LABELS.Active,
      image: '',
      description: 'Slug phải viết thường, không có dấu và khoảng trắng.',
    },
    {
      name: 'Trùng SKU',
      slug: 'trung-sku',
      sku: 'TSHIRT-001',
      categorySlug: 'thoi-trang',
      price: 99000,
      salePrice: 0,
      stock: 12,
      status: PRODUCT_STATUS_LABELS.Active,
      image: '',
      description: 'SKU trùng sẽ bị bỏ qua khi import.',
    },
  ];

  errorRows.forEach((row) => {
    const added = sheet.addRow(columns.map((column) => row[column.key] ?? ''));
    added.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFEE2E2' },
      };
    });
  });

  return sheet;
}

function styleHeaderRow(sheet: Worksheet, columnCount: number) {
  const headerRow = sheet.getRow(1);
  headerRow.height = 28;
  for (let i = 1; i <= columnCount; i += 1) {
    const cell = headerRow.getCell(i);
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.border = HEADER_BORDER;
    cell.alignment = HEADER_ALIGNMENT;
  }
}

function applyNumberFormats(sheet: Worksheet, columns: ProductExcelColumn[]) {
  columns.forEach((column, index) => {
    if (!column.numberFormat) {
      return;
    }
    sheet.getColumn(index + 1).numFmt = column.numberFormat;
  });
}

function addStatusValidation(sheet: Worksheet, columns: ProductExcelColumn[]) {
  const statusIndex = columns.findIndex((column) => column.key === 'status');
  if (statusIndex === -1) {
    return;
  }
  const statusValues = Object.values(PRODUCT_STATUS_LABELS).join(',');
  for (let rowIndex = 2; rowIndex <= 5001; rowIndex += 1) {
    sheet.getCell(rowIndex, statusIndex + 1).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`"${statusValues}"`],
      showErrorMessage: true,
      errorTitle: 'Trạng thái không hợp lệ',
      error: 'Vui lòng chọn đúng trạng thái trong danh sách.',
    };
  }
}

function addExampleRows(sheet: Worksheet, columns: ProductExcelColumn[]) {
  const examples: Record<ProductExcelColumnKey, string | number>[] = [
    {
      name: 'Áo thun basic',
      slug: 'ao-thun-basic',
      sku: 'TSHIRT-001',
      categorySlug: 'thoi-trang',
      price: 199000,
      salePrice: 0,
      stock: 50,
      status: PRODUCT_STATUS_LABELS.Active,
      image: 'https://example.com/images/ao-thun.jpg',
      description: 'Áo thun cotton mềm mại, dễ phối đồ.',
    },
    {
      name: 'Áo sơ mi khuyến mãi',
      slug: 'ao-so-mi-khuyen-mai',
      sku: 'SHIRT-002',
      categorySlug: 'thoi-trang',
      price: 299000,
      salePrice: 249000,
      stock: 40,
      status: PRODUCT_STATUS_LABELS.Active,
      image: 'https://example.com/images/ao-so-mi.jpg',
      description: 'Sơ mi form rộng, giảm giá mùa lễ hội.',
    },
    {
      name: 'Giày sneaker bản nháp',
      slug: 'giay-sneaker-ban-nhap',
      sku: 'SNEAK-003',
      categorySlug: 'giay-dep',
      price: 459000,
      salePrice: 0,
      stock: 0,
      status: PRODUCT_STATUS_LABELS.Draft,
      image: 'https://example.com/images/giay-sneaker.jpg',
      description: 'Bản nháp để chuẩn bị mở bán.',
    },
    {
      name: 'Balo lưu trữ',
      slug: 'balo-luu-tru',
      sku: 'BAG-004',
      categorySlug: 'phu-kien',
      price: 389000,
      salePrice: 0,
      stock: 15,
      status: PRODUCT_STATUS_LABELS.Archived,
      image: 'https://example.com/images/balo.jpg',
      description: 'Sản phẩm ngừng kinh doanh.',
    },
    {
      name: 'Mũ lưỡi trai không ảnh',
      slug: 'mu-luoi-trai-khong-anh',
      sku: 'CAP-005',
      categorySlug: 'phu-kien',
      price: 99000,
      salePrice: 0,
      stock: 80,
      status: PRODUCT_STATUS_LABELS.Active,
      image: '',
      description: 'Ví dụ không có ảnh đại diện.',
    },
    {
      name: 'Áo khoác mô tả dài',
      slug: 'ao-khoac-mo-ta-dai',
      sku: 'JACKET-006',
      categorySlug: 'thoi-trang',
      price: 599000,
      salePrice: 0,
      stock: 25,
      status: PRODUCT_STATUS_LABELS.Active,
      image: 'https://example.com/images/ao-khoac.jpg',
      description: 'Mô tả dài: Áo khoác chống gió, chất liệu bền đẹp, phù hợp đi mưa nhẹ. Có nhiều màu sắc để lựa chọn, dễ phối đồ cho cả nam và nữ.',
    },
  ];

  const rows = examples.map((example) => columns.map((column) => example[column.key] ?? ''));
  sheet.insertRows(2, rows);
}

function ensureExampleRows(sheet: Worksheet, columns: ProductExcelColumn[]) {
  if (sheet.rowCount > 1) {
    return;
  }

  const fallback: Record<ProductExcelColumnKey, string | number> = {
    name: 'Sản phẩm mẫu',
    slug: 'san-pham-mau',
    sku: 'SKU-MAU-001',
    categorySlug: 'danh-muc-mau',
    price: 99000,
    salePrice: 0,
    stock: 10,
    status: PRODUCT_STATUS_LABELS.Active,
    image: '',
    description: 'Dòng mẫu dự phòng khi sheet trống dữ liệu.',
  };

  sheet.insertRows(2, [columns.map((column) => fallback[column.key] ?? '')]);
}

export function getStatusLabel(status: ProductExcelStatus): string {
  return PRODUCT_STATUS_LABELS[status];
}
