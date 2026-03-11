# CLAUDE.md

Guidance for Claude Code when working in this repository.

**Goal:** Ship Superfast — reusable starter kit (Convex + Next.js + Expo) with all wiring done (auth, storage, payments, email, AI, push notifications).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Monorepo** | Turborepo + pnpm |
| **Mobile** | Expo 54 + Expo Router + Uniwind + HeroUI Native |
| **Web** | Next.js 16 + shadcn/ui + Tailwind v4 |
| **Docs** | Fumadocs + Next.js 16 |
| **Backend** | Convex |
| **Auth** | @convex-dev/auth (Google OAuth + Magic Link) |
| **Storage** | Cloudflare R2 via @convex-dev/r2 |
| **Push** | @convex-dev/expo-push-notifications |
| **Payments** | @dodopayments/convex |
| **Email** | @convex-dev/resend |
| **AI Agent** | @convex-dev/agent + ai (Vercel AI SDK) |
| **RAG** | @convex-dev/rag |
| **Streaming** | @convex-dev/persistent-text-streaming |

---

## Core Principles

**CRITICAL: Always consult `llm-txt/` folder FIRST before implementation**

1. **Search codebase first** — understand existing context before implementing
2. **Reference llm-txt/** — all tech stack rules, patterns, and best practices live there
3. **Platform-specific UI**:
   - Mobile: HeroUI Native + Uniwind + Expo Router
   - Web: shadcn/ui + Tailwind v4
4. **Use UI components as-is** — only adjust appearance through built-in props (variant, color, size, etc.). Do not override styles, wrap components with custom styling, or apply custom className/style overrides to library components.
5. **Pure TypeScript** with strict type checking
6. **Doc fetch extensions**: `.md` for most | `.mdx` for HeroUI Native and Expo (GitHub raw URLs)

---

## MCP Servers & Skills

- **shadcn MCP** → web components (`apps/web/`)
- **HeroUI Native** → mobile components (`apps/mobile/`). **Use the `/heroui-native` skill first.** Only fall back to the HeroUI Native MCP server if the skill doesn't provide what you need.
- **llm-txt/** → architecture and framework-level decisions

---

## Documentation Reference (`llm-txt/`)

### Convex Backend

| File | When to Use |
|------|-------------|
| `convex/convex.txt` | Master index — start here |
| `convex/convex_rules.txt` | Before writing queries, mutations, actions |
| `convex/convex-best-practices.md` | Queries, indexes, access control, helpers |
| `convex/convex-best-practices-typescript.md` | TypeScript patterns |
| `convex/convex-auth-doc-tree.txt` | Authentication features |
| `convex/convex-r2-component.md` | File storage |
| `convex/convex-push-notification-component.md` | Push notifications |
| `convex/convex-cron.md` | Scheduled tasks |
| `convex/convex-test.md` | Testing |
| `convex/dodopayments.md` | Payments, subscriptions, checkout |
| `convex/resend.md` | Transactional emails |
| `convex/ai-agent.txt` | AI agents, threads, workflows |
| `convex/rag.txt` | Vector search, document embeddings |
| `convex/persistent-text-streaming.md` | AI text streaming |
| `convex/convex-doc-tree.txt` | Search for specific Convex features |

### Frontend

| File | When to Use |
|------|-------------|
| `expo/expo-doc-tree.txt` | Expo features (fetch `.mdx` from GitHub) |
| `heroui-native/llm.txt` | HeroUI Native components (fetch `.mdx`) |
| `uniwind/llm.txt` | Uniwind / Tailwind v4 for React Native (fetch `.md`) |

### Docs Site

| File | When to Use |
|------|-------------|
| `fumadocs/llms.txt` | Fumadocs doc tree — setup, UI, layouts, MDX, integrations. Fetch pages with `.mdx` from `https://fumadocs.dev` (e.g. `https://fumadocs.dev/docs/ui.mdx`) |

---

## Convex Rules

- New function syntax: `args: {}` and `returns: v.type()`
- No `.filter()` — use indexes or filter in TypeScript
- Use helper functions in `convex/lib/` instead of `ctx.runQuery`/`ctx.runMutation`
- Internal functions for scheduled/cron jobs
- Always validate arguments and check auth with `getAuthUserId(ctx)`
- **Stick to Convex component APIs** — use only methods exposed by `@convex-dev/*` or `@dodopayments/convex`. Never import the raw underlying SDK directly.

---

## Key Paths

| Path | Purpose |
|------|---------|
| `apps/web/` | Next.js app (`app/` at root, no `src/`) |
| `apps/mobile/src/` | Expo app (uses `src/` directory) |
| `apps/docs-site/` | Fumadocs documentation site |
| `packages/convex/convex/` | Backend functions, schema, HTTP routes |
| `packages/convex/convex/lib/` | Shared helpers (users, teams, billing, storage, plans) |
| `packages/shared/` | Shared types, constants, utils |
| `llm-txt/` | AI-friendly documentation |
| `apps/web/app/globals.css` | Web theme (`--primary` in `:root` / `.dark`) |
| `apps/mobile/src/global.css` | Mobile theme (`--accent` in `@variant light` / `@variant dark`) |
