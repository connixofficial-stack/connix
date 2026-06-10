export type VariantPresetValue = {
  value: string;
  label?: string;
  colorCode?: string;
  numericValue?: number;
};

export type VariantPresetOption = {
  displayType: "dropdown" | "buttons" | "radio" | "color_swatch" | "number_input";
  inputType?: "text" | "number" | "color";
  name: string;
  slug: string;
  unit?: string;
  values: VariantPresetValue[];
};

export type VariantPreset = {
  description: string;
  iconKey: string;
  key: string;
  name: string;
  options: VariantPresetOption[];
};

export const DEFAULT_VARIANT_PRESET_KEY = "size_color";

export const VARIANT_PRESETS: Record<string, VariantPreset> = {
  size_color: {
    description: "Thời trang, giày dép",
    iconKey: "Ruler",
    key: "size_color",
    name: "Size + Màu",
    options: [
      {
        displayType: "buttons",
        name: "Kích thước",
        slug: "size",
        values: [
          { value: "XS" },
          { value: "S" },
          { value: "M" },
          { value: "L" },
          { value: "XL" },
          { value: "XXL" },
        ],
      },
      {
        displayType: "color_swatch",
        name: "Màu sắc",
        slug: "color",
        values: [
          { colorCode: "#111827", value: "Đen" },
          { colorCode: "#f8fafc", value: "Trắng" },
          { colorCode: "#ef4444", value: "Đỏ" },
          { colorCode: "#1e3a8a", value: "Xanh navy" },
          { colorCode: "#f5f5dc", value: "Be" },
          { colorCode: "#ec4899", value: "Hồng" },
          { colorCode: "#9ca3af", value: "Xám" },
        ],
      },
    ],
  },
  color_only: {
    description: "Phụ kiện, gia dụng",
    iconKey: "Palette",
    key: "color_only",
    name: "Chỉ Màu",
    options: [
      {
        displayType: "color_swatch",
        name: "Màu sắc",
        slug: "color",
        values: [
          { colorCode: "#111827", value: "Đen" },
          { colorCode: "#f8fafc", value: "Trắng" },
          { colorCode: "#ef4444", value: "Đỏ" },
          { colorCode: "#22c55e", value: "Xanh lá" },
          { colorCode: "#3b82f6", value: "Xanh dương" },
          { colorCode: "#ec4899", value: "Hồng" },
        ],
      },
    ],
  },
  size_only: {
    description: "Găng tay, mũ, nhẫn",
    iconKey: "Ruler",
    key: "size_only",
    name: "Chỉ Size",
    options: [
      {
        displayType: "buttons",
        name: "Kích thước",
        slug: "size",
        values: [
          { value: "S" },
          { value: "M" },
          { value: "L" },
          { value: "XL" },
        ],
      },
    ],
  },
  storage_color: {
    description: "Điện thoại, laptop",
    iconKey: "Package",
    key: "storage_color",
    name: "Dung lượng + Màu",
    options: [
      {
        displayType: "dropdown",
        name: "Dung lượng",
        slug: "storage",
        values: [
          { value: "64GB" },
          { value: "128GB" },
          { value: "256GB" },
          { value: "512GB" },
          { value: "1TB" },
        ],
      },
      {
        displayType: "color_swatch",
        name: "Màu sắc",
        slug: "color",
        values: [
          { colorCode: "#111827", value: "Đen" },
          { colorCode: "#f8fafc", value: "Trắng" },
          { colorCode: "#e5e7eb", value: "Bạc" },
          { colorCode: "#f59e0b", value: "Vàng" },
        ],
      },
    ],
  },
  dimension_material: {
    description: "Nội thất, túi xách",
    iconKey: "Box",
    key: "dimension_material",
    name: "Kích thước + Chất liệu",
    options: [
      {
        displayType: "dropdown",
        name: "Kích thước",
        slug: "dimension",
        values: [
          { value: "60x40cm" },
          { value: "80x60cm" },
          { value: "100x80cm" },
        ],
      },
      {
        displayType: "dropdown",
        name: "Chất liệu",
        slug: "material",
        values: [
          { value: "Gỗ" },
          { value: "Kim loại" },
          { value: "Da" },
          { value: "Vải" },
          { value: "Nhựa" },
        ],
      },
    ],
  },
  volume_shade: {
    description: "Mỹ phẩm, skincare",
    iconKey: "Image",
    key: "volume_shade",
    name: "Dung tích + Tone",
    options: [
      {
        displayType: "number_input",
        inputType: "number",
        name: "Dung tích",
        slug: "volume",
        unit: "ml",
        values: [
          { label: "30ml", numericValue: 30, value: "30" },
          { label: "50ml", numericValue: 50, value: "50" },
          { label: "100ml", numericValue: 100, value: "100" },
          { label: "200ml", numericValue: 200, value: "200" },
        ],
      },
      {
        displayType: "buttons",
        name: "Tone",
        slug: "shade",
        values: [
          { value: "Tone sáng" },
          { value: "Tone trung" },
          { value: "Tone tối" },
          { value: "Hồng đào" },
          { value: "Đỏ cherry" },
        ],
      },
    ],
  },
  weight_flavor: {
    description: "Thực phẩm, cà phê",
    iconKey: "ShoppingBag",
    key: "weight_flavor",
    name: "Khối lượng + Hương vị",
    options: [
      {
        displayType: "number_input",
        inputType: "number",
        name: "Khối lượng",
        slug: "weight",
        unit: "g",
        values: [
          { label: "100g", numericValue: 100, value: "100" },
          { label: "250g", numericValue: 250, value: "250" },
          { label: "500g", numericValue: 500, value: "500" },
          { label: "1000g", numericValue: 1000, value: "1000" },
        ],
      },
      {
        displayType: "dropdown",
        name: "Hương vị",
        slug: "flavor",
        values: [
          { value: "Nguyên bản" },
          { value: "Vanilla" },
          { value: "Caramel" },
          { value: "Mocha" },
          { value: "Trái cây" },
        ],
      },
    ],
  },
  dosage_quantity: {
    description: "Thuốc, vitamin",
    iconKey: "Ticket",
    key: "dosage_quantity",
    name: "Liều lượng + Số lượng",
    options: [
      {
        displayType: "number_input",
        inputType: "number",
        name: "Liều lượng",
        slug: "dosage",
        unit: "mg",
        values: [
          { label: "250mg", numericValue: 250, value: "250" },
          { label: "500mg", numericValue: 500, value: "500" },
          { label: "1000mg", numericValue: 1000, value: "1000" },
        ],
      },
      {
        displayType: "buttons",
        name: "Số lượng",
        slug: "quantity",
        values: [
          { value: "30 viên" },
          { value: "60 viên" },
          { value: "90 viên" },
          { value: "120 viên" },
        ],
      },
    ],
  },
  size_age: {
    description: "Mẹ & Bé",
    iconKey: "Users",
    key: "size_age",
    name: "Size + Độ tuổi",
    options: [
      {
        displayType: "buttons",
        name: "Kích thước",
        slug: "size",
        values: [
          { value: "XS" },
          { value: "S" },
          { value: "M" },
          { value: "L" },
        ],
      },
      {
        displayType: "buttons",
        name: "Độ tuổi",
        slug: "age_group",
        values: [
          { value: "0-6M" },
          { value: "6-12M" },
          { value: "1-2Y" },
          { value: "2-4Y" },
          { value: "4-6Y" },
        ],
      },
    ],
  },
  material_color: {
    description: "Trang sức, đồ da",
    iconKey: "Tag",
    key: "material_color",
    name: "Chất liệu + Màu",
    options: [
      {
        displayType: "dropdown",
        name: "Chất liệu",
        slug: "material",
        values: [
          { value: "Vàng" },
          { value: "Bạc" },
          { value: "Titan" },
          { value: "Da" },
          { value: "Thép" },
        ],
      },
      {
        displayType: "color_swatch",
        name: "Màu sắc",
        slug: "color",
        values: [
          { colorCode: "#f59e0b", value: "Vàng" },
          { colorCode: "#e5e7eb", value: "Bạc" },
          { colorCode: "#9ca3af", value: "Xám" },
          { colorCode: "#111827", value: "Đen" },
        ],
      },
    ],
  },
  duration_package: {
    description: "Subscription, dịch vụ",
    iconKey: "CalendarClock",
    key: "duration_package",
    name: "Thời hạn + Gói",
    options: [
      {
        displayType: "radio",
        name: "Thời hạn",
        slug: "duration",
        values: [
          { value: "1 tháng" },
          { value: "3 tháng" },
          { value: "6 tháng" },
          { value: "1 năm" },
        ],
      },
      {
        displayType: "buttons",
        name: "Gói",
        slug: "package",
        values: [
          { value: "Basic" },
          { value: "Standard" },
          { value: "Premium" },
          { value: "VIP" },
        ],
      },
    ],
  },
  bundle_only: {
    description: "Combo, set quà tặng",
    iconKey: "ShoppingCart",
    key: "bundle_only",
    name: "Combo/Bundle",
    options: [
      {
        displayType: "buttons",
        name: "Gói",
        slug: "bundle_size",
        values: [
          { value: "Set 2" },
          { value: "Set 3" },
          { value: "Set 5" },
          { value: "Family pack" },
        ],
      },
    ],
  },
};

export const VARIANT_PRESET_LIST = Object.values(VARIANT_PRESETS);

const PRESET_SUGGESTION_RULES: Array<{ keywords: string[]; presetKey: string }> = [
  { keywords: ["thời trang", "giày", "dép", "quần", "áo"], presetKey: "size_color" },
  { keywords: ["mỹ phẩm", "skincare", "làm đẹp", "son", "kem"], presetKey: "volume_shade" },
  { keywords: ["điện tử", "công nghệ", "laptop", "điện thoại"], presetKey: "storage_color" },
  { keywords: ["nội thất", "gia dụng"], presetKey: "dimension_material" },
  { keywords: ["trang sức", "quà tặng"], presetKey: "material_color" },
  { keywords: ["mẹ", "bé"], presetKey: "size_age" },
  { keywords: ["cà phê", "trà", "ẩm thực", "ăn uống"], presetKey: "weight_flavor" },
  { keywords: ["sức khỏe", "nhà thuốc", "vitamin"], presetKey: "dosage_quantity" },
  { keywords: ["gym", "fitness", "spa", "massage"], presetKey: "duration_package" },
];

export const getSuggestedVariantPresetKey = (categoryNames: string[] = []): string => {
  const normalized = categoryNames.map((name) => name.toLowerCase());
  for (const rule of PRESET_SUGGESTION_RULES) {
    if (normalized.some((name) => rule.keywords.some((keyword) => name.includes(keyword)))) {
      return rule.presetKey;
    }
  }
  return DEFAULT_VARIANT_PRESET_KEY;
};
