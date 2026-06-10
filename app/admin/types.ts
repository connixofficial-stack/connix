export interface Post {
  id: string;
  title: string;
  category: string;
  author: string;
  status: 'Published' | 'Draft' | 'Archived';
  views: number;
  created: string;
  thumbnail: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  salePrice?: number;
  stock: number;
  status: 'Active' | 'Draft' | 'Archived';
  image: string;
  sales: number;
  description?: string;
}

export interface Order {
  id: string;
  customer: string;
  customerId: string;
  total: number;
  status: 'Pending' | 'Processing' | 'Completed' | 'Cancelled';
  date: string;
  itemsCount: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  ordersCount: number;
  totalSpent: number;
  status: 'Active' | 'Inactive';
  avatar: string;
  joined: string;
  address?: string;
  city?: string;
  notes?: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  usersCount: number;
  isSystem?: boolean;
  permissions: Record<string, string[]>;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  roleId: string;
  status: 'Active' | 'Inactive' | 'Banned';
  lastLogin: string;
  avatar: string;
  created: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  count: number;
  parent?: string;
  description?: string;
}

export interface Comment {
  id: string;
  content: string;
  author: string;
  target: string;
  status: 'Pending' | 'Approved' | 'Spam';
  created: string;
}

export interface ImageFile {
  id: string;
  url: string;
  filename: string;
  size: string;
  dimensions: string;
  uploaded: string;
}

export interface Menu {
  id: string;
  name: string;
  location: string;
  itemsCount: number;
}

export interface MenuItem {
  id: string;
  menuId: string;
  label: string;
  url: string;
  order: number;
  depth: number;
}

export interface HomeComponent {
  id: string;
  type: string;
  title: string;
  active: boolean;
  order: number;
  preview?: string;
}
