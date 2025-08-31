import type { AppType } from "@ironmount/server";
import { hc } from "hono/client";

export const client = hc<AppType>("/api");
