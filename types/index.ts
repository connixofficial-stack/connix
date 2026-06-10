export interface SystemMetric {
  id: string;
  label: string;
  value: string;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  change: number;
  trend: 'up' | 'down' | 'neutral';
}

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  type: 'boolean' | 'percentage' | 'segment';
  enabled: boolean;
  rolloutPercentage?: number;
  affectedAreas: string[];
  lastToggledBy: string;
  updatedAt: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  source: string;
  message: string;
  latency?: string;
  status?: number;
}

export interface Deployment {
  id: string;
  version: string;
  status: 'current' | 'previous' | 'failed';
  deployedAt: string;
  author: string;
  commitHash: string;
}

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'export' | 'import';

export interface ModulePermission {
  moduleId: string;
  actions: PermissionAction[];
}

export interface AdminModule {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  category: 'content' | 'commerce' | 'user' | 'system' | 'marketing';
  enabled: boolean;
  isCore: boolean;
  dependencies?: string[];
  dependencyType?: 'all' | 'any';
  permissions: PermissionAction[];
  order: number;
  updatedAt: string;
  updatedBy: string;
}

export interface AdminRole {
  id: string;
  name: string;
  description: string;
  color: string;
  isSystem: boolean;
  isSuperAdmin: boolean;
  usersCount: number;
  modulePermissions: ModulePermission[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  roleId: string;
  roleName: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: string;
  createdAt: string;
}
