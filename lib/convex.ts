import { ConvexHttpClient } from "convex/browser";

export const getConvexClient = () => new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
