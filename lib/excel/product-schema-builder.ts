// ==========================================
// 1. Types & Interfaces
// ==========================================

export interface ProductModuleConfig {
  hasVariants: boolean;
  isPhysicalEnabled: boolean;
  isDigitalEnabled: boolean;
  priceStrategy: "PRODUCT_LEVEL" | "VARIANT_LEVEL";
  inventoryStrategy: "PRODUCT_LEVEL" | "VARIANT_LEVEL";
  imageStrategy: "INHERIT" | "OVERRIDE" | "MIXED";
}

export interface ExcelOptionDef {
  name: string;
  slug: string;
  values: string[];
}

export interface ExcelColumnDef {
  key: string;
  group: string; // Tên nhóm (Row 1)
  header: string; // Tên hiển thị (Row 2)
  width: number;
  required?: boolean;
  readOnly?: boolean; // Nếu true, khóa ô lại
  microcopy?: string; // Hướng dẫn ở dòng 3
  type?: "string" | "number" | "boolean" | "dropdown";
  dropdownValues?: string[]; // Dùng cho data validation
  validationRule?: string; // Tùy chỉnh rule
  appliesTo: "BOTH" | "PARENT_ONLY" | "VARIANT_ONLY";
}

// ==========================================
// 2. Builder Engine
// ==========================================

export function buildExcelColumns(
  config: ProductModuleConfig,
  options?: ExcelOptionDef[]
): ExcelColumnDef[] {
  const columns: ExcelColumnDef[] = [];

  // --- THÔNG TIN CƠ BẢN ---
  columns.push({
    key: "id",
    group: "THÔNG TIN HỆ THỐNG",
    header: "ID Hệ Thống",
    width: 28,
    readOnly: true,
    microcopy: "Trống = Mới. Cấm sửa.",
    appliesTo: "BOTH",
  });

  columns.push({
    key: "sku",
    group: "THÔNG TIN CƠ BẢN",
    header: "Mã SKU *",
    width: 22,
    required: true,
    microcopy: config.hasVariants ? "Bắt buộc. Dùng làm ID nhóm Cha/Con." : "Bắt buộc. Mã duy nhất.",
    appliesTo: "BOTH",
  });

  columns.push({
    key: "name",
    group: "THÔNG TIN CƠ BẢN",
    header: "Tên Sản Phẩm *",
    width: 40,
    required: true,
    microcopy: config.hasVariants ? "Chỉ điền ở dòng SP Cha" : "Ví dụ: Giày Nike Air",
    appliesTo: "PARENT_ONLY",
  });

  columns.push({
    key: "category",
    group: "THÔNG TIN CƠ BẢN",
    header: "Danh Mục *",
    width: 32,
    required: true,
    type: "dropdown",
    microcopy: "Chọn từ danh sách",
    appliesTo: "PARENT_ONLY",
  });

  // --- LOẠI SẢN PHẨM (NẾU CÓ CẢ 2) ---
  if (config.isPhysicalEnabled && config.isDigitalEnabled) {
    columns.push({
      key: "productType",
      group: "THÔNG TIN CƠ BẢN",
      header: "Loại SP (Physical/Digital)",
      width: 28,
      type: "dropdown",
      dropdownValues: ["physical", "digital"],
      microcopy: "physical hoặc digital",
      appliesTo: "PARENT_ONLY",
    });
  }

  // --- PHÂN LOẠI / BIẾN THỂ ---
  if (config.hasVariants) {
    const opt1 = options?.[0];
    const opt2 = options?.[1];

    columns.push({
      key: "variantOption1",
      group: "PHÂN LOẠI (BIẾN THỂ)",
      header: opt1 ? opt1.name : "Phân loại 1 (VD: Màu sắc)",
      width: 28,
      type: opt1 && opt1.values.length > 0 ? "dropdown" : "string",
      dropdownValues: opt1 ? opt1.values : undefined,
      microcopy: "Chỉ điền ở dòng Phiên bản",
      appliesTo: "VARIANT_ONLY",
    });
    columns.push({
      key: "variantOption2",
      group: "PHÂN LOẠI (BIẾN THỂ)",
      header: opt2 ? opt2.name : "Phân loại 2 (VD: Kích cỡ)",
      width: 28,
      type: opt2 && opt2.values.length > 0 ? "dropdown" : "string",
      dropdownValues: opt2 ? opt2.values : undefined,
      microcopy: "Chỉ điền ở dòng Phiên bản",
      appliesTo: "VARIANT_ONLY",
    });
  }

  // --- GIÁ BÁN ---
  const priceAppliesTo = !config.hasVariants ? "PARENT_ONLY" : (config.priceStrategy === "VARIANT_LEVEL" ? "VARIANT_ONLY" : "PARENT_ONLY");
  
  columns.push({
    key: "price",
    group: "GIÁ BÁN",
    header: "Giá Bán *",
    width: 18,
    required: true,
    type: "number",
    microcopy: priceAppliesTo === "PARENT_ONLY" ? "Điền ở dòng SP Cha" : "Điền cho từng Phiên bản",
    appliesTo: priceAppliesTo,
  });

  columns.push({
    key: "salePrice",
    group: "GIÁ BÁN",
    header: "Giá Khuyến Mãi",
    width: 20,
    type: "number",
    microcopy: "Để trống nếu không sale",
    appliesTo: priceAppliesTo,
  });

  // --- TỒN KHO ---
  const stockAppliesTo = !config.hasVariants ? "PARENT_ONLY" : (config.inventoryStrategy === "VARIANT_LEVEL" ? "VARIANT_ONLY" : "PARENT_ONLY");
  
  columns.push({
    key: "stock",
    group: "KHO BÃI",
    header: "Tồn Kho *",
    width: 16,
    required: true,
    type: "number",
    microcopy: stockAppliesTo === "PARENT_ONLY" ? "Điền ở dòng SP Cha" : "Điền cho từng Phiên bản",
    appliesTo: stockAppliesTo,
  });

  // --- DIGITAL ONLY ---
  if (config.isDigitalEnabled) {
    columns.push({
      key: "digitalDeliveryType",
      group: "DIGITAL INFO",
      header: "Cách Giao Hàng",
      width: 24,
      type: "dropdown",
      dropdownValues: ["account", "license", "download", "custom"],
      microcopy: "Chỉ dùng cho SP Digital",
      appliesTo: "PARENT_ONLY",
    });
    columns.push({
      key: "digitalData",
      group: "DIGITAL INFO",
      header: "Dữ Liệu (Link/Key)",
      width: 30,
      microcopy: "Link tải hoặc Key",
      appliesTo: "PARENT_ONLY",
    });
  }

  // --- HÌNH ẢNH ---
  columns.push({
    key: "imageUrl",
    group: "MEDIA",
    header: "URL Hình Ảnh Chính",
    width: 40,
    microcopy: "Chỉ điền ở dòng SP Cha. Link ảnh đại diện.",
    appliesTo: "PARENT_ONLY",
  });

  columns.push({
    key: "imagesUrl",
    group: "MEDIA",
    header: "Thư Viện Ảnh (Cách nhau bởi dấu ;)",
    width: 45,
    microcopy: "Chỉ điền ở dòng SP Cha. Ví dụ: url1; url2; url3",
    appliesTo: "PARENT_ONLY",
  });

  if (config.hasVariants && (config.imageStrategy === "OVERRIDE" || config.imageStrategy === "MIXED")) {
    columns.push({
      key: "variantImageUrl",
      group: "MEDIA",
      header: "URL Ảnh Phiên Bản",
      width: 40,
      microcopy: "Chỉ điền ở dòng Phiên bản. Trống = dùng ảnh Cha.",
      appliesTo: "VARIANT_ONLY",
    });
  }

  return columns;
}
