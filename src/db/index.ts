import { env } from "cloudflare:workers";
import { type DrizzleD1Database, drizzle } from "drizzle-orm/d1";
import * as schema from "./schema.ts";

// `env.DB` is the D1 binding (wrangler.jsonc), resolvable only in the Workers
// request context. The client must never execute this — so the drizzle client
// is built lazily on first use via a Proxy. With no module-load side effect,
// the bundler can fully tree-shake db (and `cloudflare:workers`) out of the
// browser bundle; without it, the import leaks into the client graph.
type DB = DrizzleD1Database<typeof schema>;

let instance: DB | undefined;
function getDb(): DB {
	instance ??= drizzle(env.DB, { schema });
	return instance;
}

export const db = new Proxy({} as DB, {
	get(_target, prop, receiver) {
		return Reflect.get(getDb(), prop, receiver);
	},
}) as DB;
