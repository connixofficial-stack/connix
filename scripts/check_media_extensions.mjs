import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const convexUrl = process.env.CONVEX_URL;
if (!convexUrl) {
  throw new Error("Missing CONVEX_URL env");
}

const client = new ConvexHttpClient(convexUrl);

const run = async () => {
  let cursor = null;
  let missing = 0;
  let total = 0;

  do {
    const result = await client.query(api.media.listForBackfill, {
      paginationOpts: { cursor, numItems: 100 },
    });

    for (const img of result.page) {
      total += 1;
      if (!img.extension) {
        missing += 1;
      }
    }

    cursor = result.isDone ? null : result.continueCursor;
  } while (cursor);

  console.log(JSON.stringify({ total, missing }));
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
