"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";

const EXPECTED_CONVEX_ERROR_CODES = new Set([
  "DUPLICATE_SLUG",
  "DUPLICATE_SKU",
  "DUPLICATE_VOUCHER",
]);

const extractConvexErrorData = (message: string) => {
  const marker = "ConvexError ";
  const index = message.indexOf(marker);
  if (index === -1) {
    return null;
  }
  const jsonPayload = message.slice(index + marker.length).trim();
  if (!jsonPayload) {
    return null;
  }
  try {
    return JSON.parse(jsonPayload) as unknown;
  } catch {
    return null;
  }
};

const shouldSuppressConvexErrorLog = (args: unknown[]) => {
  const message = args.find((arg) => typeof arg === "string") as string | undefined;
  if (!message || !message.startsWith("[CONVEX ") || !message.includes("ConvexError")) {
    return false;
  }
  const data = extractConvexErrorData(message);
  if (!data || typeof data !== "object") {
    return false;
  }
  const code = (data as { code?: unknown }).code;
  return typeof code === "string" && EXPECTED_CONVEX_ERROR_CODES.has(code);
};

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!, {
  logger: {
    logVerbose: (...args) => {
      console.debug(...args);
    },
    log: (...args) => {
      console.log(...args);
    },
    warn: (...args) => {
      console.warn(...args);
    },
    error: (...args) => {
      if (shouldSuppressConvexErrorLog(args)) {
        return;
      }
      console.error(...args);
    },
  },
});

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
