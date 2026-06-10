/**
 * Base Seeder Class - Foundation for all module seeders
 * 
 * Best Practices:
 * - Type-safe with generics
 * - Batch processing to avoid timeouts
 * - Progress tracking support
 * - Error handling with detailed messages
 * - Dependency awareness
 */

import { faker } from '@faker-js/faker';
import type { GenericMutationCtx } from 'convex/server';
import type { DataModel } from '../_generated/dataModel';

// ============================================================
// TYPES & INTERFACES
// ============================================================

export interface SeedConfig {
  quantity: number;          // Number of records to seed
  force?: boolean;           // Clear existing data before seeding
  batchSize?: number;        // Insert batch size (default: 50)
  locale?: string;           // Faker locale (vi, en, etc.)
  dependencies?: boolean;    // Auto-seed dependencies (default: true)
  onProgress?: (current: number, total: number) => void; // Progress callback
  industryKey?: string;       // Industry template key
  selectedLogo?: string | null;
  strictVariantPresetScope?: boolean;
  useSeedMauImages?: boolean;
  variantPresetKey?: string; // Optional preset key for product variants
}

export interface SeedResult {
  module: string;            // Module name
  created: number;           // Number of records created
  skipped: number;           // Number of records skipped
  duration: number;          // Duration in milliseconds
  dependencies: string[];    // Dependencies that were seeded
  errors?: string[];         // Error messages if any
}

export interface SeedDependency {
  module: string;            // Dependency module name
  required: boolean;         // Is this dependency required?
  minRecords?: number;       // Minimum records needed
}

// ============================================================
// BASE SEEDER CLASS
// ============================================================

type TableName = keyof DataModel;

export abstract class BaseSeeder<T = unknown> {
  protected ctx: GenericMutationCtx<DataModel>;
  protected faker: typeof faker;
  protected config: SeedConfig = { quantity: 10 };
  
  constructor(ctx: GenericMutationCtx<DataModel>) {
    this.ctx = ctx;
    this.faker = faker;
  }
  
  // Abstract properties that must be implemented
  abstract moduleName: string;
  abstract tableName: string;
  abstract dependencies: SeedDependency[];
  
  // Abstract methods that must be implemented
  abstract generateFake(): T | Promise<T>;
  abstract validateRecord(record: T): boolean;
  
  // ============================================================
  // MAIN SEED FUNCTION
  // ============================================================
  
  async seed(config: SeedConfig): Promise<SeedResult> {
    const startTime = Date.now();
    this.config = { batchSize: 50, dependencies: true, force: false, ...config };
    
    const result: SeedResult = {
      created: 0,
      dependencies: [],
      duration: 0,
      module: this.moduleName,
      skipped: 0,
    };
    
    try {
      // 1. Configure Faker
      this.configureFaker(config.locale || 'vi');
      
      // 2. Check existing data - Only check if force=false
      // If force=true, we'll clear and re-seed anyway
      if (!config.force) {
        const existing = await this.checkExisting();
        if (existing > 0) {
          console.log(`[${this.moduleName}] Data already exists (${existing} records). Use force=true to re-seed.`);
          // Continue to add more data, don't skip
          // result.skipped = existing;
          // result.duration = Date.now() - startTime;
          // return result;
        }
      }
      
      // 3. Check dependencies
      if (config.dependencies !== false) {
        const missingDeps = await this.checkDependencies();
        if (missingDeps.length > 0) {
          throw new Error(
            `Missing dependencies: ${missingDeps.join(', ')}. ` +
            `Please seed these modules first or enable auto-dependencies.`
          );
        }
      }
      
      // 4. Clear if force (delete existing data first)
      if (config.force) {
        const existing = await this.checkExisting();
        if (existing > 0) {
          console.log(`[${this.moduleName}] Clearing ${existing} existing records...`);
          await this.clear();
        }
      }
      
      // 5. Generate and insert data in batches
      const batchSize = config.batchSize || 50;
      let created = 0;
      
      while (created < config.quantity) {
        const remaining = config.quantity - created;
        const currentBatch = Math.min(batchSize, remaining);
        
        // Generate fake records
        const records: T[] = [];
        for (let i = 0; i < currentBatch; i++) {
          const record = await this.generateFake();
          
          // Validate before inserting
          if (this.validateRecord(record)) {
            records.push(record);
          } else {
            console.warn(`[${this.moduleName}] Invalid record generated, skipping...`);
            result.skipped++;
          }
        }
        
        // Insert batch
        if (records.length > 0) {
          await this.insertRecords(records);
          created += records.length;
          
          // Progress callback
          if (config.onProgress) {
            config.onProgress(created, config.quantity);
          }
          
          console.log(`[${this.moduleName}] Seeded ${created}/${config.quantity} records`);
        }
      }
      
      // 6. Post-seed hooks
      await this.afterSeed(created);
      
      result.created = created;
      result.duration = Date.now() - startTime;
      
      console.log(
        `[${this.moduleName}] ✅ Seed completed: ${created} records in ${result.duration}ms`
      );
      
      return result;
      
    } catch (error) {
      result.errors = [error instanceof Error ? error.message : String(error)];
      result.duration = Date.now() - startTime;
      
      console.error(`[${this.moduleName}] ❌ Seed failed:`, error);
      
      return result;
    }
  }

  async clearData(): Promise<void> {
    try {
      console.log(`[${this.moduleName}] Starting clearData...`);
      await this.clear();
      console.log(`[${this.moduleName}] ✅ clearData completed`);
    } catch (error) {
      console.error(`[${this.moduleName}] ❌ clearData failed:`, error);
      throw error;
    }
  }
  
  // ============================================================
  // CONFIGURATION
  // ============================================================
  
  protected configureFaker(locale: string): void {
    // Set locale (faker v9+ uses setLocale)
    if (locale === 'vi') {
      // Vietnamese locale configuration
      this.faker.setDefaultRefDate(new Date());
    }
    // Note: Faker v9 doesn't support direct locale setting
    // Use locale-specific imports instead if needed
    
    // Seed for reproducibility (can be overridden)
    this.faker.seed(Date.now());
  }
  
  // ============================================================
  // DEPENDENCY MANAGEMENT
  // ============================================================
  
  protected async checkDependencies(): Promise<string[]> {
    const missing: string[] = [];
    
    for (const dep of this.dependencies) {
      const count = await this.countRecords(dep.module);
      
      if (dep.required && count === 0) {
        missing.push(dep.module);
      } else if (dep.minRecords && count < dep.minRecords) {
        missing.push(`${dep.module} (need ${dep.minRecords}, found ${count})`);
      }
    }
    
    return missing;
  }
  
  protected async countRecords(moduleName: string): Promise<number> {
    try {
      const records = await this.ctx.db.query(moduleName as TableName).collect();
      return records.length;
    } catch {
      return 0;
    }
  }
  
  // ============================================================
  // DATA OPERATIONS (Override these in subclasses)
  // ============================================================
  
  protected async checkExisting(): Promise<number> {
    try {
      // Count all records in table
      const records = await this.ctx.db.query(this.tableName as TableName).collect();
      return records.length;
    } catch {
      return 0;
    }
  }
  
  protected async clear(): Promise<void> {
    // Default implementation: delete all records
    const records = await this.ctx.db.query(this.tableName as TableName).collect();
    await Promise.all(records.map(r => this.ctx.db.delete(r._id)));
  }
  
  protected async insertRecords(records: T[]): Promise<void> {
    // Batch insert với Promise.all() for performance
    await Promise.all(
      records.map(record => this.ctx.db.insert(this.tableName as TableName, record as DataModel[TableName]['document']))
    );
  }
  
  protected async afterSeed(count: number): Promise<void> {
    void count;
    // Hook for post-seed operations (update counters, etc.)
    // Override in subclass if needed
  }
  
  // ============================================================
  // UTILITY METHODS
  // ============================================================
  
  protected randomElement<T>(array: T[]): T {
    return this.faker.helpers.arrayElement(array);
  }
  
  protected randomElements<T>(array: T[], count: number): T[] {
    return this.faker.helpers.arrayElements(array, count);
  }
  
  protected randomInt(min: number, max: number): number {
    return this.faker.number.int({ max, min });
  }
  
  protected randomBoolean(probability = 0.5): boolean {
    return this.faker.datatype.boolean({ probability });
  }
  
  protected slugify(text: string): string {
    return this.faker.helpers.slugify(text.toLowerCase());
  }
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Create a seeder instance
 */
export function createSeeder<T extends BaseSeeder>(
  SeederClass: new (ctx: GenericMutationCtx<DataModel>) => T,
  ctx: GenericMutationCtx<DataModel>
): T {
  return new SeederClass(ctx);
}

/**
 * Batch processing helper
 */
export async function processBatch<T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<R[]>
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await processor(batch);
    results.push(...batchResults);
  }
  
  return results;
}
