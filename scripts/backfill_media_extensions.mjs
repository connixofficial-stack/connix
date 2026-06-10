import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const resolveExtensionFromFilename = (filename) => {
  const match = filename?.toLowerCase?.().match(/\.([a-z0-9]+)$/);
  return match?.[1];
};

const resolveExtensionFromMime = (mimeType) => {
  if (!mimeType) return "bin";
  const map = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
    "application/pdf": "pdf",
    "video/mp4": "mp4",
  };
  if (map[mimeType]) return map[mimeType];
  const subtype = mimeType.split("/")[1];
  if (!subtype) return "bin";
  return subtype.replace("+xml", "").replace("jpeg", "jpg");
};

const resolveExtension = (filename, mimeType) => {
  return resolveExtensionFromFilename(filename) ?? resolveExtensionFromMime(mimeType);
};

const convexUrl = process.env.CONVEX_URL;
if (!convexUrl) {
  throw new Error("Missing CONVEX_URL env");
}

const client = new ConvexHttpClient(convexUrl);

const run = async () => {
  let cursor = null;
  let patched = 0;

  do {
    const result = await client.query(api.media.listForBackfill, {
      paginationOpts: { cursor, numItems: 100 },
    });

    for (const img of result.page) {
      if (img.extension) continue;
      const extension = resolveExtension(img.filename, img.mimeType);
      await client.mutation(api.media.patchExtension, { id: img._id, extension });
      patched += 1;
    }

    cursor = result.isDone ? null : result.continueCursor;
  } while (cursor);

  console.log(`Patched ${patched} records`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
