import type { DataModel, Id } from "../_generated/dataModel";
import type { GenericQueryCtx } from "convex/server";

// Helper để check document tồn tại
export const getOrThrow =  async <TableName extends keyof DataModel>(
  ctx: GenericQueryCtx<DataModel>,
  table: TableName,
  id: Id<TableName>
): Promise<DataModel[TableName]["document"]> => ctx.db.get(id).then((doc) => {
    if (!doc) {
      throw new Error(`${String(table)} not found: ${id}`);
    }
    return doc;
  });

// Helper pagination options
export const DEFAULT_PAGE_SIZE = 20;
