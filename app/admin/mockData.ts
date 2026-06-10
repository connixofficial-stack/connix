import type { Category, Comment, Customer, HomeComponent, ImageFile, Menu, MenuItem, Order, Post, Product, Role, User } from './types';

const randomDate = (start: Date, end: Date) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const mockPosts: Post[] = Array.from({ length: 10 }, (_, i) => ({
  author: ["Nguyễn Văn A", "Trần Thị B", "Lê Văn C"][randomInt(0, 2)],
  category: ["Ẩm thực", "Công nghệ", "Du lịch", "Ẩm thực", "Công nghệ", "Thời trang", "Tài chính", "Giáo dục", "Sức khỏe", "Công nghệ"][i],
  created: randomDate(new Date(2023, 0, 1), new Date()),
  id: `POST-${1000 + i}`,
  status: ["Published", "Published", "Draft", "Published", "Archived", "Published", "Published", "Draft", "Published", "Published"][i] as Post['status'],
  thumbnail: `https://picsum.photos/300/200?random=${i}`,
  title: [
    "Cách làm cà phê muối ngon chuẩn vị Huế",
    "Review chi tiết iPhone 15 Pro Max sau 3 tháng",
    "Kinh nghiệm du lịch Đà Lạt tự túc 3 ngày 2 đêm",
    "Top 10 quán ăn ngon rẻ tại Sài Gòn",
    "Hướng dẫn học ReactJS cơ bản cho người mới",
    "Xu hướng thời trang mùa hè 2024",
    "Làm sao để tiết kiệm tiền hiệu quả?",
    "Những cuốn sách hay nên đọc một lần trong đời",
    "Bí quyết chăm sóc da mụn tại nhà",
    "So sánh MacBook Air M2 và M3"
  ][i],
  views: randomInt(100, 5000),
}));

export const mockProducts: Product[] = Array.from({ length: 15 }, (_, i) => {
  const price = randomInt(100, 5000) * 1000;
  return {
    category: ["Thời trang", "Giày dép", "Mỹ phẩm", "Công nghệ", "Công nghệ", "Công nghệ", "Phụ kiện", "Công nghệ", "Phụ kiện", "Phụ kiện", "Thời trang", "Thời trang", "Thời trang", "Mỹ phẩm", "Mỹ phẩm"][i],
    description: "Mô tả chi tiết sản phẩm đang được cập nhật...",
    id: `PROD-${2000 + i}`,
    image: `https://picsum.photos/200/200?random=${i + 20}`,
    name: [
      "Áo thun Local Brand X",
      "Giày Sneaker Basic White",
      "Kem dưỡng ẩm Vitamin C",
      "Bàn phím cơ Keychron K2",
      "Chuột Logitech MX Master 3",
      "Tai nghe Sony WH-1000XM5",
      "Balo chống nước cao cấp",
      "Đồng hồ thông minh Watch S1",
      "Sạc dự phòng 20000mAh",
      "Cáp sạc nhanh Type-C",
      "Quần Jean Slim Fit",
      "Áo khoác Bomber Nam",
      "Váy hoa nhí Vintage",
      "Son môi Matte Lipstick",
      "Nước hoa nam Bleu"
    ][i],
    price: price,
    salePrice: randomInt(0, 1) ? price * 0.9 : undefined,
    sales: randomInt(0, 500),
    sku: `SKU-${randomInt(10_000, 99_999)}`,
    status: randomInt(0, 10) > 2 ? "Active" : (randomInt(0, 1) ? "Draft" : "Archived"),
    stock: randomInt(0, 100),
  }
});

export const mockCustomers: Customer[] = Array.from({ length: 10 }, (_, i) => ({
  address: `${randomInt(1, 999)} Nguyễn Trãi`,
  avatar: `https://picsum.photos/100/100?random=${i + 50}`,
  city: ["Hà Nội", "Hồ Chí Minh", "Đà Nẵng"][randomInt(0, 2)],
  email: `customer${i}@example.com`,
  id: `CUS-${3000 + i}`,
  joined: randomDate(new Date(2023, 0, 1), new Date()),
  name: ["Phạm Minh Tuấn", "Ngô Lan Hương", "Đặng Văn Hùng", "Vũ Thị Mai", "Hoàng Quốc Bảo", "Đỗ Thu Hà", "Lý Gia Hân", "Bùi Tiến Dũng", "Trương Mỹ Lan", "Dương Quá"][i],
  notes: "Khách hàng VIP, thường mua số lượng lớn.",
  ordersCount: randomInt(1, 20),
  phone: `09${randomInt(10_000_000, 99_999_999)}`,
  status: randomInt(0, 10) > 1 ? "Active" : "Inactive",
  totalSpent: randomInt(500, 50_000) * 1000
}));

export const mockRoles: Role[] = [
  { 
    description: 'Quyền cao nhất, có thể truy cập mọi tính năng', 
    id: 'ROLE-ADMIN', 
    isSystem: true, 
    name: 'Administrator', 
    permissions: {
      'orders': ['view', 'create', 'edit', 'delete'],
      'posts': ['view', 'create', 'edit', 'delete'],
      'products': ['view', 'create', 'edit', 'delete'],
      'settings': ['view', 'edit'],
      'users': ['view', 'create', 'edit', 'delete']
    },
    usersCount: 1
  },
  { 
    description: 'Quản lý nội dung và sản phẩm, không thể truy cập cấu hình hệ thống', 
    id: 'ROLE-EDITOR', 
    isSystem: false, 
    name: 'Editor', 
    permissions: {
      'orders': ['view', 'edit'],
      'posts': ['view', 'create', 'edit', 'delete'],
      'products': ['view', 'create', 'edit'],
      'settings': [],
      'users': ['view']
    },
    usersCount: 2
  },
  { 
    description: 'Chỉ có thể viết bài và xem sản phẩm', 
    id: 'ROLE-AUTHOR', 
    isSystem: false, 
    name: 'Author', 
    permissions: {
      'orders': [],
      'posts': ['view', 'create', 'edit'],
      'products': ['view'],
      'settings': [],
      'users': []
    },
    usersCount: 2
  },
  { 
    description: 'Hỗ trợ khách hàng, xem đơn hàng và phản hồi', 
    id: 'ROLE-SUPPORT', 
    isSystem: false, 
    name: 'Customer Support', 
    permissions: {
      'orders': ['view', 'edit'],
      'posts': ['view'],
      'products': ['view'],
      'settings': [],
      'users': ['view']
    },
    usersCount: 0
  }
];

export const mockUsers: User[] = [
  { avatar: 'https://picsum.photos/100/100?random=90', created: '2023-01-01T00:00:00Z', email: 'admin@vietadmin.com', id: 'U1', lastLogin: '2 phút trước', name: 'Admin User', phone: '0901234567', role: 'Administrator', roleId: 'ROLE-ADMIN', status: 'Active' },
  { avatar: 'https://picsum.photos/100/100?random=91', created: '2023-02-15T00:00:00Z', email: 'chi@vietadmin.com', id: 'U2', lastLogin: '1 giờ trước', name: 'Nguyễn Thị Chi', phone: '0909876543', role: 'Editor', roleId: 'ROLE-EDITOR', status: 'Active' },
  { avatar: 'https://picsum.photos/100/100?random=92', created: '2023-03-20T00:00:00Z', email: 'nam@vietadmin.com', id: 'U3', lastLogin: '2 ngày trước', name: 'Trần Văn Nam', phone: '0912345678', role: 'Author', roleId: 'ROLE-AUTHOR', status: 'Active' },
  { avatar: 'https://picsum.photos/100/100?random=93', created: '2023-04-10T00:00:00Z', email: 'mai@vietadmin.com', id: 'U4', lastLogin: '1 tháng trước', name: 'Lê Tuyết Mai', phone: '0987654321', role: 'Author', roleId: 'ROLE-AUTHOR', status: 'Inactive' },
  { avatar: 'https://picsum.photos/100/100?random=94', created: '2023-05-05T00:00:00Z', email: 'hung@vietadmin.com', id: 'U5', lastLogin: '5 giờ trước', name: 'Phạm Hùng', phone: '0956789012', role: 'Editor', roleId: 'ROLE-EDITOR', status: 'Active' },
];

export const mockOrders: Order[] = Array.from({ length: 20 }, (_, i) => {
  const cus = mockCustomers[randomInt(0, 9)];
  return {
    customer: cus.name,
    customerId: cus.id,
    date: randomDate(new Date(2024, 0, 1), new Date()),
    id: `ORD-${5000 + i}`,
    itemsCount: randomInt(1, 5),
    status: ["Pending", "Processing", "Completed", "Cancelled", "Completed"][randomInt(0, 4)] as Order['status'],
    total: randomInt(100, 2000) * 1000,
  }
});

export const mockComments: Comment[] = Array.from({ length: 20 }, (_, i) => ({
  author: mockCustomers[randomInt(0, 9)].name,
  content: ["Bài viết rất hay!", "Sản phẩm tốt, giao hàng nhanh.", "Cần tư vấn thêm.", "Giá hơi cao so với mặt bằng chung.", "Tuyệt vời!", "Chất lượng không như quảng cáo.", "Admin rep inbox nhé.", "Hữu ích.", "Thanks for sharing.", "Đã đặt hàng."][randomInt(0, 9)],
  created: randomDate(new Date(2024, 2, 1), new Date()),
  id: `CMT-${6000 + i}`,
  status: ["Pending", "Approved", "Approved", "Spam"][randomInt(0, 3)] as Comment['status'],
  target: randomInt(0, 1) ? mockPosts[randomInt(0, 9)].title : mockProducts[randomInt(0, 14)].name,
}));

export const mockImages: ImageFile[] = Array.from({ length: 30 }, (_, i) => ({
  dimensions: "1920x1080",
  filename: `image_upload_${i}.jpg`,
  id: `IMG-${7000 + i}`,
  size: `${randomInt(100, 5000)} KB`,
  uploaded: randomDate(new Date(2024, 0, 1), new Date()),
  url: `https://picsum.photos/300/300?random=${i + 100}`,
}));

export const mockCategories: Category[] = [
  { count: 120, id: 'CAT-1', name: 'Điện thoại', slug: 'dien-thoai' },
  { count: 85, id: 'CAT-2', name: 'Laptop', slug: 'laptop' },
  { count: 230, id: 'CAT-3', name: 'Phụ kiện', slug: 'phu-kien' },
  { count: 45, id: 'CAT-4', name: 'Thời trang nam', slug: 'thoi-trang-nam' },
  { count: 67, id: 'CAT-5', name: 'Thời trang nữ', slug: 'thoi-trang-nu' },
  { count: 12, id: 'CAT-6', name: 'Đồng hồ', slug: 'dong-ho' },
];

export const mockPostCategories: Category[] = [
  { count: 45, id: 'PCAT-1', name: 'Công nghệ', slug: 'cong-nghe' },
  { count: 32, id: 'PCAT-2', name: 'Ẩm thực', slug: 'am-thuc' },
  { count: 28, id: 'PCAT-3', name: 'Du lịch', slug: 'du-lich' },
  { count: 15, id: 'PCAT-4', name: 'Giáo dục', slug: 'giao-duc' },
  { count: 19, id: 'PCAT-5', name: 'Sức khỏe', slug: 'suc-khoe' },
  { count: 10, id: 'PCAT-6', name: 'Tài chính', slug: 'tai-chinh' },
];

export const mockMenus: Menu[] = [
  { id: 'M1', itemsCount: 6, location: 'Header', name: 'Header Menu' },
  { id: 'M2', itemsCount: 4, location: 'Footer Col 1', name: 'Footer About' },
  { id: 'M3', itemsCount: 3, location: 'Footer Col 2', name: 'Footer Policy' },
];

export const mockMenuItems: MenuItem[] = [
  { depth: 0, id: 'MI1', label: 'Trang chủ', menuId: 'M1', order: 1, url: '/' },
  { depth: 0, id: 'MI2', label: 'Sản phẩm', menuId: 'M1', order: 2, url: '/products' },
  { depth: 1, id: 'MI3', label: 'Điện thoại', menuId: 'M1', order: 3, url: '/products/dien-thoai' },
  { depth: 1, id: 'MI4', label: 'Laptop', menuId: 'M1', order: 4, url: '/products/laptop' },
  { depth: 0, id: 'MI5', label: 'Bài viết', menuId: 'M1', order: 5, url: '/blog' },
  { depth: 0, id: 'MI6', label: 'Liên hệ', menuId: 'M1', order: 6, url: '/contact' },
  { depth: 0, id: 'MI7', label: 'Về chúng tôi', menuId: 'M2', order: 1, url: '/about' },
  { depth: 0, id: 'MI8', label: 'Tuyển dụng', menuId: 'M2', order: 2, url: '/careers' },
  { depth: 0, id: 'MI9', label: 'Hệ thống cửa hàng', menuId: 'M2', order: 3, url: '/stores' },
  { depth: 0, id: 'MI10', label: 'Liên hệ', menuId: 'M2', order: 4, url: '/contact' },
  { depth: 0, id: 'MI11', label: 'Chính sách bảo hành', menuId: 'M3', order: 1, url: '/policy/warranty' },
  { depth: 0, id: 'MI12', label: 'Chính sách đổi trả', menuId: 'M3', order: 2, url: '/policy/return' },
  { depth: 0, id: 'MI13', label: 'Vận chuyển', menuId: 'M3', order: 3, url: '/policy/shipping' },
];

export const mockHomeComponents: HomeComponent[] = [
  { active: true, id: 'HC1', order: 1, preview: 'Slider ảnh khổ lớn đầu trang', title: 'Hero Banner Mùa Hè', type: 'Banner' },
  { active: true, id: 'HC2', order: 2, preview: '4 box số liệu: Khách hàng, Sản phẩm...', title: 'Thống kê nổi bật', type: 'Stats' },
  { active: true, id: 'HC3', order: 3, preview: 'Grid 4x2 sản phẩm có tag Hot', title: 'Sản phẩm bán chạy', type: 'ProductGrid' },
  { active: true, id: 'HC4', order: 4, preview: 'Danh sách 3 bài viết mới nhất', title: 'Tin tức mới nhất', type: 'News' },
  { active: true, id: 'HC5', order: 5, preview: 'Carousel logo đối tác', title: 'Đối tác tiêu biểu', type: 'Partners' },
  { active: false, id: 'HC6', order: 6, preview: 'Form đăng ký email Newsletter', title: 'Đăng ký nhận tin', type: 'CTA' },
];
