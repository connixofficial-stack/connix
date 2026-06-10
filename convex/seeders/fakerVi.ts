/**
 * Vietnamese Faker Configuration
 * 
 * Extends Faker.js with Vietnamese-specific data
 */

import { faker } from '@faker-js/faker';

// ============================================================
// VIETNAMESE DATA
// ============================================================

export const VIETNAMESE_NAMES = {
  firstNames: {
    female: [
      'An', 'Ánh', 'Bích', 'Chi', 'Dung', 'Hà', 'Hạnh', 'Hoa', 'Hồng', 'Hương',
      'Lan', 'Linh', 'Mai', 'Nga', 'Ngọc', 'Nhung', 'Phương', 'Quỳnh', 'Tâm', 'Thu',
      'Thúy', 'Trang', 'Tuyết', 'Vy', 'Yến',
    ],
    male: [
      'An', 'Anh', 'Bình', 'Cường', 'Dũng', 'Đức', 'Giang', 'Hải', 'Hòa', 'Hùng',
      'Khoa', 'Kiên', 'Long', 'Minh', 'Nam', 'Phong', 'Quân', 'Sơn', 'Thành', 'Tú',
      'Tuấn', 'Việt', 'Vũ',
    ],
  },
  lastNames: [
    'Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng',
    'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý', 'Đinh', 'Trương', 'Đào',
  ],
  middleNames: [
    'Văn', 'Thị', 'Hữu', 'Đức', 'Thanh', 'Thu', 'Minh', 'Hoàng', 'Kim', 'Quang',
  ],
};

export const VIETNAMESE_CITIES = [
  'Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Biên Hòa',
  'Nha Trang', 'Vũng Tàu', 'Huế', 'Thủ Dầu Một', 'Long Xuyên', 'Rạch Giá',
  'Bắc Giang', 'Bắc Ninh', 'Buôn Ma Thuột', 'Cà Mau', 'Cao Lãnh', 'Châu Đốc',
  'Đà Lạt', 'Hạ Long', 'Phan Thiết', 'Pleiku', 'Quy Nhơn', 'Sóc Trăng',
  'Tây Ninh', 'Thái Nguyên', 'Vinh', 'Vĩnh Long',
];

export const VIETNAMESE_STREETS = [
  'Nguyễn Huệ', 'Lê Lợi', 'Trần Hưng Đạo', 'Hai Bà Trưng', 'Phan Đình Phùng',
  'Lý Thường Kiệt', 'Nguyễn Trãi', 'Bà Triệu', 'Quang Trung', 'Lê Thánh Tông',
  'Trần Phú', 'Điện Biên Phủ', 'Cách Mạng Tháng Tám', 'Võ Văn Tần', 'Nam Kỳ Khởi Nghĩa',
];

export const VIETNAMESE_DISTRICTS = [
  'Q.1', 'Q.2', 'Q.3', 'Q.4', 'Q.5', 'Q.7', 'Q.10', 'Quận 1', 'Quận 3', 'Quận 5',
  'Ba Đình', 'Hoàn Kiếm', 'Cầu Giấy', 'Đống Đa', 'Hai Bà Trưng', 'Thanh Xuân',
];

export const VIETNAMESE_PRODUCT_PREFIXES = [
  'Điện thoại', 'Laptop', 'Máy tính bảng', 'Tai nghe', 'Loa', 'Chuột', 'Bàn phím',
  'Màn hình', 'Camera', 'Máy ảnh', 'Đồng hồ', 'Túi xách', 'Giày dép', 'Quần áo',
  'Nồi chiên', 'Máy hút bụi', 'Tủ lạnh', 'Máy giặt', 'Quạt điện', 'Bàn ghế',
];

export const VIETNAMESE_PRODUCT_BRANDS = [
  'Samsung', 'Apple', 'Xiaomi', 'Oppo', 'Vivo', 'Realme', 'Nokia', 'Asus', 'Dell',
  'HP', 'Lenovo', 'Acer', 'MSI', 'LG', 'Sony', 'Canon', 'Nikon', 'Casio', 'Seiko',
];

export const VIETNAMESE_POST_TITLES = [
  'Khám phá', 'Hướng dẫn', 'Top 10', 'Bí quyết', 'Kinh nghiệm', 'Review',
  'So sánh', 'Đánh giá', 'Cập nhật', 'Ra mắt', 'Giới thiệu', 'Tìm hiểu',
];

export const VIETNAMESE_SERVICE_PREFIXES = [
  'Dịch vụ', 'Tư vấn', 'Thiết kế', 'Lắp đặt', 'Bảo trì', 'Sửa chữa', 'Vệ sinh',
  'Chăm sóc', 'Hỗ trợ', 'Đào tạo', 'Thi công', 'Cung cấp',
];

// ============================================================
// FAKER EXTENSIONS
// ============================================================

export class VietnameseFaker {
  private faker: typeof faker;
  
  constructor(fakerInstance: typeof faker) {
    this.faker = fakerInstance;
  }
  
  // Person
  fullName(gender?: 'male' | 'female'): string {
    const lastName = this.arrayElement(VIETNAMESE_NAMES.lastNames);
    const middleName = this.arrayElement(VIETNAMESE_NAMES.middleNames);
    
    let firstName: string;
    if (gender) {
      firstName = this.arrayElement(VIETNAMESE_NAMES.firstNames[gender]);
    } else {
      const allFirstNames = [
        ...VIETNAMESE_NAMES.firstNames.male,
        ...VIETNAMESE_NAMES.firstNames.female,
      ];
      firstName = this.arrayElement(allFirstNames);
    }
    
    return `${lastName} ${middleName} ${firstName}`;
  }
  
  firstName(gender?: 'male' | 'female'): string {
    if (gender) {
      return this.arrayElement(VIETNAMESE_NAMES.firstNames[gender]);
    }
    const allFirstNames = [
      ...VIETNAMESE_NAMES.firstNames.male,
      ...VIETNAMESE_NAMES.firstNames.female,
    ];
    return this.arrayElement(allFirstNames);
  }
  
  lastName(): string {
    return this.arrayElement(VIETNAMESE_NAMES.lastNames);
  }
  
  // Address
  city(): string {
    return this.arrayElement(VIETNAMESE_CITIES);
  }
  
  street(): string {
    const street = this.arrayElement(VIETNAMESE_STREETS);
    const number = this.faker.number.int({ max: 999, min: 1 });
    return `${number} ${street}`;
  }
  
  district(): string {
    return this.arrayElement(VIETNAMESE_DISTRICTS);
  }
  
  fullAddress(): string {
    return `${this.street()}, ${this.district()}, ${this.city()}`;
  }
  
  // Phone
  phoneNumber(): string {
    const prefixes = ['090', '091', '092', '093', '094', '096', '097', '098', '099'];
    const prefix = this.arrayElement(prefixes);
    const rest = this.faker.string.numeric(7);
    return `${prefix}${rest}`;
  }
  
  // Products
  productName(): string {
    const prefix = this.arrayElement(VIETNAMESE_PRODUCT_PREFIXES);
    const brand = this.arrayElement(VIETNAMESE_PRODUCT_BRANDS);
    const model = this.faker.string.alphanumeric({ casing: 'upper', length: 3 });
    return `${prefix} ${brand} ${model}`;
  }
  
  productDescription(): string {
    const templates = [
      'Sản phẩm chính hãng, chất lượng cao, bảo hành 12 tháng.',
      'Thiết kế hiện đại, tính năng ưu việt, phù hợp cho mọi lứa tuổi.',
      'Được nhập khẩu trực tiếp, đảm bảo nguồn gốc xuất xứ rõ ràng.',
      'Sản phẩm bán chạy nhất, được nhiều khách hàng tin dùng.',
      'Công nghệ tiên tiến, tiết kiệm năng lượng, thân thiện môi trường.',
    ];
    return this.arrayElement(templates);
  }
  
  // Posts
  postTitle(): string {
    const prefix = this.arrayElement(VIETNAMESE_POST_TITLES);
    const topic = this.faker.lorem.words(3);
    return `${prefix} ${topic}`;
  }
  
  postExcerpt(): string {
    return this.faker.lorem.sentences(2);
  }
  
  // Services
  serviceName(): string {
    const prefix = this.arrayElement(VIETNAMESE_SERVICE_PREFIXES);
    const type = this.faker.commerce.department();
    return `${prefix} ${type}`;
  }
  
  // Comments
  commentContent(positive = true): string {
    if (positive) {
      const templates = [
        'Sản phẩm tuyệt vời, rất hài lòng!',
        'Chất lượng tốt, đúng như mô tả. Sẽ mua lại!',
        'Giao hàng nhanh, đóng gói cẩn thận. 5 sao!',
        'Dùng rất tốt, đáng tiền. Recommend!',
        'Shop tư vấn nhiệt tình, sản phẩm ok. Thanks!',
      ];
      return this.arrayElement(templates);
    } else {
      const templates = [
        'Sản phẩm khác với hình ảnh quảng cáo.',
        'Giao hàng hơi chậm, nhưng sản phẩm ổn.',
        'Chất lượng tạm được, giá hơi cao.',
        'Cần cải thiện dịch vụ chăm sóc khách hàng.',
      ];
      return this.arrayElement(templates);
    }
  }
  
  // Orders
  orderNote(): string {
    const notes = [
      'Giao giờ hành chính',
      'Gọi trước khi giao',
      'Để ở bảo vệ',
      'Giao tận tay',
      'Kiểm tra hàng trước khi thanh toán',
      '',
    ];
    return this.arrayElement(notes);
  }
  
  // Utility
  private arrayElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }
}

// ============================================================
// EXPORT
// ============================================================

export function createVietnameseFaker(fakerInstance: typeof faker): VietnameseFaker {
  return new VietnameseFaker(fakerInstance);
}
