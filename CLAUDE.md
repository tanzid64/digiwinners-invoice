# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Vite dev server on port 3000
npm run build            # Production build
npm run preview          # Preview production build
npm run test             # Vitest (run mode, jsdom). Single test: npx vitest run <path> -t "<name>"
npm run check            # Biome lint + format check (use this before committing)
npm run lint             # Biome lint only
npm run format           # Biome format only

npm run generate-routes  # Regenerate src/routeTree.gen.ts from src/routes (also runs automatically via vite plugin)

npm run db:generate      # Drizzle: generate migration from schema.ts
npm run db:migrate       # Apply migrations
npm run db:push          # Push schema directly (dev)
npm run db:studio        # Drizzle Studio

npm run deploy           # build + wrangler deploy to Cloudflare Workers
```

Shadcn components install with `pnpm dlx shadcn@latest add <name>` (per `.cursorrules`) — lands in `src/components/ui/`.

## Architecture

TanStack Start (React 19 SSR framework) scaffolded via create-tanstack-app, deployed to Cloudflare Workers. Much of this is still starter scaffold — files prefixed `demo` are deletable; the `todos` examples are placeholder.

- **Routing is file-based.** Routes live in `src/routes/`; `src/routeTree.gen.ts` is generated — never edit it by hand. `__root.tsx` is the SSR shell (`shellComponent`). `src/router.tsx` wires the route tree with `defaultPreload: 'intent'`.
- **Server code in routes.** API/server handlers attach via the `server.handlers` property on a file route (see `src/routes/mcp.ts`). Server functions use `createServerFn` from `@tanstack/react-start`.
- **MCP server** is exposed at the `/mcp` route (POST). `src/utils/mcp-handler.ts` bridges a single HTTP request to an `McpServer` over `InMemoryTransport` — it sends one JSON-RPC message and waits a fixed 10ms for the response, so it is request/response only (no streaming/notifications). Tools register in `src/routes/mcp.ts`.

### Two divergent data stores (important)

There are two unrelated "todos" stores; don't conflate them:
1. **Drizzle + better-sqlite3** — `src/db/schema.ts` (`todos` table), client in `src/db/index.ts` reading `DATABASE_URL`. This is the real DB path but currently unused by app code.
2. **`src/mcp-todos.ts`** — a flat-file (`mcp-todos.json`) in-memory store with a subscriber pattern; this is what the MCP `addTodo` tool actually writes to.

Note the runtime mismatch: `src/db/index.ts` uses `better-sqlite3` (Node-only) while the deploy target is Cloudflare Workers. Real DB work on Workers will need a Workers-compatible driver/binding (D1), configured in `wrangler.jsonc`.

## Conventions

- **Imports:** use the `#/*` alias (or `@/*`, both map to `src/*`) for non-relative imports. `verbatimModuleSyntax` is on — use `import type` for type-only imports. `.ts`/`.tsx` extensions are allowed in import paths.
- **Biome** is the formatter/linter: tabs, double quotes, organize-imports on. `routeTree.gen.ts` and `styles.css` are excluded.
- **React Compiler** is enabled (babel preset in `vite.config.ts`) — avoid manual memoization that fights it.
- **Validation:** Zod v4. **Forms:** `@tanstack/react-form`. **Tables:** `@tanstack/react-table`. **Styling:** Tailwind v4 (config-less, via `@tailwindcss/vite`).
- `better-auth` is a dependency but not yet wired up.

## Cloudflare deploy

Configured via `@cloudflare/vite-plugin` + `wrangler.jsonc` (`nodejs_compat` flag on). Secrets: `wrangler secret put <VAR>`. Non-secret vars and KV/D1/R2/DO bindings go in `wrangler.jsonc`.
