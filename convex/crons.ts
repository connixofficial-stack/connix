import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.hourly(
  "cleanup-expired-draft-file-uploads",
  { minuteUTC: 17 },
  internal.fileLifecycle.cleanupExpiredDraftUploads,
  {}
);

export default crons;
