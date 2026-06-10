/**
 * Dependency Graph & Resolution
 * 
 * Best Practices:
 * - Topological sort for correct seed order
 * - Circular dependency detection
 * - Flexible dependency types (all, any, optional)
 * - Module grouping by category
 */

import type { GenericMutationCtx } from 'convex/server';
import type { DataModel } from '../_generated/dataModel';
import { SEED_MODULE_METADATA } from '../../lib/modules/seed-registry';

// ============================================================
// TYPES
// ============================================================

export type DependencyType = 'all' | 'any' | 'optional';

export interface ModuleDependency {
  deps: string[];           // List of dependency modules
  minRecords?: number;      // Minimum records required from each dep
  type: DependencyType;     // all = need all, any = need at least 1, optional = nice to have
}

export type ModuleMetadata = (typeof SEED_MODULE_METADATA)[keyof typeof SEED_MODULE_METADATA];

// ============================================================
// DEPENDENCY GRAPH
// ============================================================

/**
 * Complete dependency map for all modules
 * 
 * Rules:
 * - 'all': All dependencies must be satisfied
 * - 'any': At least one dependency must be satisfied
 * - 'optional': Nice to have but not required
 */
export const SEED_DEPENDENCIES: Record<string, ModuleDependency> = {
  // Level 0: No dependencies (seed first)
  roles: {
    deps: [],
    type: 'all',
  },
  postCategories: {
    deps: [],
    type: 'all',
  },
  productCategories: {
    deps: [],
    type: 'all',
  },
  serviceCategories: {
    deps: [],
    type: 'all',
  },
  courseCategories: {
    deps: [],
    type: 'all',
  },
  projectCategories: {
    deps: [],
    type: 'all',
  },
  resourceCategories: {
    deps: [],
    type: 'all',
  },
  
  // Level 1: Basic entities
  users: {
    deps: ['roles'],
    minRecords: 1,
    type: 'all',
  },
  customers: {
    deps: [],
    type: 'all',
  },
  
  // Level 2: Content entities
  posts: {
    deps: ['postCategories', 'users'],
    minRecords: 1,
    type: 'all',
  },
  products: {
    deps: ['productCategories'],
    minRecords: 1,
    type: 'all',
  },
  services: {
    deps: ['serviceCategories'],
    minRecords: 1,
    type: 'all',
  },
  courses: {
    deps: ['courseCategories'],
    minRecords: 1,
    type: 'all',
  },
  projects: {
    deps: ['projectCategories'],
    minRecords: 1,
    type: 'all',
  },
  resources: {
    deps: ['resourceCategories'],
    minRecords: 1,
    type: 'all',
  },
  
  // Level 3: Interactions (depend on content)
  comments: {
    deps: ['posts', 'products'],
    type: 'any', // Can comment on posts OR products
  },
  wishlist: {
    deps: ['products', 'customers'],
    minRecords: 1,
    type: 'all',
  },
  
  // Level 4: Transactions (depend on multiple entities)
  orders: {
    deps: ['products', 'customers'],
    minRecords: 1,
    type: 'all',
  },
  cart: {
    deps: ['products', 'customers'],
    minRecords: 1,
    type: 'all',
  },
  
  // Level 5: System/UI (optional dependencies for dynamic content)
  menus: {
    deps: [],
    type: 'all',
  },
  homepage: {
    deps: ['posts', 'products'],
    type: 'optional', // Can work without content
  },
  kanban: {
    deps: ['users'],
    minRecords: 1,
    type: 'all',
  },
  subscriptions: {
    deps: ['users'],
    minRecords: 1,
    type: 'all',
  },
  
  // Special modules
  analytics: {
    deps: ['orders', 'customers', 'products'],
    type: 'optional',
  },
  notifications: {
    deps: ['users', 'customers'],
    type: 'any',
  },
  promotions: {
    deps: ['products', 'productCategories'],
    type: 'any',
  },
  settings: {
    deps: [],
    type: 'all',
  },
  contactInbox: {
    deps: ['settings'],
    type: 'all',
  },
  media: {
    deps: [],
    type: 'all',
  },
};

/**
 * Module metadata for UI display
 */
export const MODULE_METADATA: Record<string, ModuleMetadata> = SEED_MODULE_METADATA;

// ============================================================
// DEPENDENCY RESOLUTION
// ============================================================

/**
 * Resolve dependencies using topological sort
 * Returns modules in correct seed order
 */
export function resolveDependencies(modules: string[]): string[] {
  const resolved: string[] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();
  
  function visit(moduleKey: string) {
    // Already processed
    if (visited.has(moduleKey)) {
      return;
    }
    
    // Circular dependency detected
    if (visiting.has(moduleKey)) {
      throw new Error(
        `Circular dependency detected: ${moduleKey} is already being visited. ` +
        `Check SEED_DEPENDENCIES configuration.`
      );
    }
    
    visiting.add(moduleKey);
    
    // Get dependencies
    const depConfig = SEED_DEPENDENCIES[moduleKey];
    if (depConfig && depConfig.type !== 'optional') {
      for (const dep of depConfig.deps) {
        visit(dep);
      }
    }
    
    visiting.delete(moduleKey);
    visited.add(moduleKey);
    resolved.push(moduleKey);
  }
  
  // Visit all requested modules
  for (const moduleKey of modules) {
    try {
      visit(moduleKey);
    } catch (error) {
      console.error(`Error resolving dependencies for ${moduleKey}:`, error);
      throw error;
    }
  }
  
  return resolved;
}

/**
 * Check if dependencies are satisfied
 */
export async function checkDependencies(
  ctx: GenericMutationCtx<DataModel>,
  moduleKey: string
): Promise<{ satisfied: boolean; missing: string[] }> {
  const depConfig = SEED_DEPENDENCIES[moduleKey];
  
  if (!depConfig || depConfig.deps.length === 0) {
    return { missing: [], satisfied: true };
  }
  
  const missing: string[] = [];
  let satisfiedCount = 0;
  
  for (const dep of depConfig.deps) {
    const tableName = getTableName(dep) as keyof DataModel;
    try {
      const exists = await ctx.db.query(tableName).first();
      if (exists) {
        satisfiedCount++;
      } else {
        missing.push(dep);
      }
    } catch {
      missing.push(dep);
    }
  }
  
  // Determine if satisfied based on dependency type
  let satisfied = false;
  switch (depConfig.type) {
    case 'all':
      satisfied = missing.length === 0;
      break;
    case 'any':
      satisfied = satisfiedCount > 0;
      break;
    case 'optional':
      satisfied = true; // Always satisfied for optional
      break;
  }
  
  return { missing, satisfied };
}

/**
 * Get dependency tree for a module
 */
export function getDependencyTree(module: string): string[] {
  const tree: string[] = [];
  const visited = new Set<string>();
  
  function traverse(mod: string) {
    if (visited.has(mod)) {return;}
    visited.add(mod);
    
    const deps = SEED_DEPENDENCIES[mod]?.deps || [];
    for (const dep of deps) {
      traverse(dep);
      if (!tree.includes(dep)) {
        tree.push(dep);
      }
    }
  }
  
  traverse(module);
  return tree;
}

/**
 * Group modules by category
 */
export function groupModulesByCategory(): Record<string, string[]> {
  const groups: Record<string, string[]> = {
    commerce: [],
    content: [],
    marketing: [],
    system: [],
    user: [],
  };
  
  for (const [module, metadata] of Object.entries(MODULE_METADATA)) {
    groups[metadata.category].push(module);
  }
  
  return groups;
}

/**
 * Get seeding order for all modules
 */
export function getOptimalSeedOrder(): string[] {
  const allModules = Object.keys(SEED_DEPENDENCIES);
  return resolveDependencies(allModules);
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Map module name to table name
 */
export function getTableName(module: string): string {
  // Direct mapping for most modules
  const specialMappings: Record<string, string> = {
    // Most modules use same name, but some are different
  };
  
  return specialMappings[module] || module;
}

/**
 * Get default seed quantity for a module
 */
export function getDefaultQuantity(module: string): number {
  return MODULE_METADATA[module]?.defaultQuantity || 10;
}

/**
 * Validate module name
 */
export function isValidModule(module: string): boolean {
  return module in SEED_DEPENDENCIES;
}

/**
 * Get module info
 */
export function getModuleInfo(module: string): ModuleMetadata | null {
  return MODULE_METADATA[module] || null;
}

// ============================================================
// PRESET CONFIGURATIONS
// ============================================================

export type PresetType = 'minimal' | 'standard' | 'large' | 'demo';

export interface PresetConfig {
  name: string;
  description: string;
  modules: Record<string, number>;
}

export const SEED_PRESETS: Record<PresetType, PresetConfig> = {
  minimal: {
    description: 'Dữ liệu tối thiểu để test (5-10 records mỗi module)',
    modules: {
      cart: 5,
      comments: 10,
      customers: 5,
      homepage: 6,
      menus: 2,
      orders: 5,
      postCategories: 3,
      posts: 5,
      productCategories: 3,
      products: 10,
      projectCategories: 3,
      projects: 5,
      resourceCategories: 3,
      resources: 5,
      promotions: 5,
      roles: 4,
      serviceCategories: 3,
      courseCategories: 3,
      services: 5,
      courses: 5,
      settings: 15,
      users: 5,
      wishlist: 5,
    },
    name: 'Minimal',
  },
  
  standard: {
    description: 'Dữ liệu chuẩn cho development (20-30 records)',
    modules: {
      cart: 15,
      comments: 50,
      customers: 20,
      homepage: 6,
      menus: 3,
      orders: 30,
      postCategories: 5,
      posts: 20,
      productCategories: 5,
      products: 50,
      projectCategories: 5,
      projects: 15,
      resourceCategories: 5,
      resources: 15,
      promotions: 10,
      roles: 4,
      serviceCategories: 5,
      courseCategories: 5,
      services: 15,
      courses: 15,
      settings: 15,
      users: 10,
      wishlist: 20,
    },
    name: 'Standard',
  },
  
  large: {
    description: 'Dữ liệu lớn để test performance (100+ records)',
    modules: {
      cart: 50,
      comments: 200,
      customers: 100,
      homepage: 6,
      menus: 4,
      orders: 150,
      postCategories: 8,
      posts: 100,
      productCategories: 10,
      products: 200,
      projectCategories: 8,
      projects: 50,
      resourceCategories: 8,
      resources: 50,
      promotions: 30,
      roles: 4,
      serviceCategories: 8,
      courseCategories: 8,
      services: 50,
      courses: 50,
      settings: 15,
      users: 20,
      wishlist: 100,
    },
    name: 'Large',
  },
  
  demo: {
    description: 'Dữ liệu demo realistic cho presentation',
    modules: {
      cart: 10,
      comments: 80,
      customers: 50,
      homepage: 6,
      menus: 3,
      orders: 60,
      postCategories: 5,
      posts: 30,
      productCategories: 6,
      products: 80,
      projectCategories: 6,
      projects: 25,
      resourceCategories: 6,
      resources: 25,
      promotions: 15,
      roles: 4,
      serviceCategories: 6,
      courseCategories: 6,
      services: 25,
      courses: 25,
      settings: 15,
      users: 12,
      wishlist: 30,
    },
    name: 'Demo',
  },
};
