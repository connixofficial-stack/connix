import { defineApp } from "convex/server";
import aggregate from "@convex-dev/aggregate/convex.config.js";
import rateLimiter from "@convex-dev/rate-limiter/convex.config.js";
import convexFilesControl from "@gilhrpenner/convex-files-control/convex.config";
import resend from "@convex-dev/resend/convex.config";

const app = defineApp();

app.use(rateLimiter);
app.use(convexFilesControl);
app.use(resend);
app.use(aggregate, { name: "pageViewsByTime" });
app.use(aggregate, { name: "pageViewsByPath" });
app.use(aggregate, { name: "pageViewsBySource" });
app.use(aggregate, { name: "pageViewsByDevice" });
app.use(aggregate, { name: "pageViewsByBrowser" });
app.use(aggregate, { name: "pageViewsByOs" });
app.use(aggregate, { name: "postsPublishedByTime" });
app.use(aggregate, { name: "postsPublishedByCategory" });
app.use(aggregate, { name: "servicesPublishedByTime" });
app.use(aggregate, { name: "servicesPublishedByCategory" });

export default app;
