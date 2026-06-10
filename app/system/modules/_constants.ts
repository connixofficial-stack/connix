import type React from 'react';
import {
  BarChart3,
  Bell,
  Briefcase,
  CalendarDays,
  FileText,
  Heart,
  Image,
  Inbox,
  LayoutGrid,
  Megaphone,
  Menu,
  MessageSquare,
  Package,
  Settings,
  Shield,
  ShoppingBag,
  ShoppingCart,
  UserCog,
  Users,
} from 'lucide-react';

export const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  BarChart3,
  Bell,
  Briefcase,
  CalendarDays,
  FileText,
  Heart,
  Image,
  Inbox,
  LayoutGrid,
  Megaphone,
  Menu,
  MessageSquare,
  Package,
  Settings,
  Shield,
  ShoppingBag,
  ShoppingCart,
  UserCog,
  Users,
};

export const categoryColors: Record<string, string> = {
  commerce: 'text-emerald-400',
  content: 'text-blue-400',
  marketing: 'text-pink-400',
  system: 'text-orange-400',
  user: 'text-purple-400',
};

export const getModuleConfigRoute = (moduleKey: string) => `/system/modules/${moduleKey}`;
