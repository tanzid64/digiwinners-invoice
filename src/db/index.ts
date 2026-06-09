import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";

import * as schema from "./schema.ts";

// `env.DB` is the D1 binding declared in wrangler.jsonc. Only resolvable
// inside the Workers request context (server fns / route handlers).
export const db = drizzle(env.DB, { schema });
