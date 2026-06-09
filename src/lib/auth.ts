import { env } from "cloudflare:workers";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "#/db/index.ts";
import * as schema from "#/db/schema.ts";

export const auth = betterAuth({
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL,
	database: drizzleAdapter(db, {
		provider: "sqlite",
		schema,
	}),
	emailAndPassword: {
		enabled: true,
	},
	// Must stay LAST — handles TanStack Start cookie setting.
	plugins: [tanstackStartCookies()],
});
