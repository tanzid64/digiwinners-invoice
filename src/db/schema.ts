import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Better Auth tables — re-exported so drizzle-kit + the drizzle adapter pick
// them up from this single schema entrypoint.
export * from "./auth-schema.ts";

// Order/Invoice/Payment management domain tables.
export * from "./app-schema.ts";

export const todos = sqliteTable("todos", {
	id: integer({ mode: "number" }).primaryKey({
		autoIncrement: true,
	}),
	title: text().notNull(),
	createdAt: integer("created_at", { mode: "timestamp" }).default(
		sql`(unixepoch())`,
	),
});
