# Documentation Structure Plan

## Overview

- **Framework**: Fumadocs (Next.js 16 + Tailwind v4)
- **Content dir**: `content/docs/`
- **Config**: `source.config.ts` — single `defineDocs({ dir: 'content/docs' })`
- **Dev**: `pnpm dev` (port 3001)

## Sidebar Tabs

Uses Fumadocs **root folders** — each folder with `"root": true` in `meta.json` becomes a tab in the sidebar dropdown switcher.

| Tab | Description | Maps to |
|-----|-------------|---------|
| **Guide** | Getting started with the kit | Setup, structure, env vars |
| **Web** | Next.js 16 + shadcn/ui | `apps/web/` |
| **Mobile** | Expo 54 + HeroUI Native | `apps/mobile/` |
| **Backend** | Convex backend | `packages/convex/convex/` |
| **Deployment** | Deploy your apps | Vercel, EAS, Convex |

## File Tree

```
content/docs/
├── meta.json
│
├── guide/
│   ├── meta.json
│   ├── index.mdx                    # Introduction — what is this kit, tech stack
│   ├── prerequisites.mdx            # Node 20, pnpm, Convex, Dodo, Resend accounts
│   ├── installation.mdx             # Clone → pnpm install → env setup → dev
│   ├── project-structure.mdx        # Monorepo layout, key paths
│   ├── environment-variables.mdx    # Every env var documented
│   └── shared-packages.mdx          # @repo/shared types, constants, utils
│
├── web/
│   ├── meta.json
│   ├── index.mdx                    # Overview — Next.js 16 + shadcn/ui + Tailwind v4
│   ├── authentication.mdx           # Google OAuth sign-in page
│   ├── landing-page.mdx             # Hero, feature cards, LogoLoop, CircularText
│   ├── theming.mdx                  # globals.css, --primary, light/dark
│   ├── components.mdx               # shadcn/ui patterns, providers
│   ├── dashboard.mdx                # Layout, sidebar, auth guard
│   ├── profile.mdx                  # Avatar, name, email, role
│   ├── team.mdx                     # Team mgmt, invites, roles, switcher
│   └── billing.mdx                  # Dodo portal, payment history, subs
│
├── mobile/
│   ├── meta.json
│   ├── index.mdx                    # Overview — Expo 54 + HeroUI Native + Uniwind
│   ├── authentication.mdx           # Google OAuth + deep link callbacks
│   ├── onboarding.mdx               # Onboarding flow
│   ├── theming.mdx                  # Uniwind + HeroUI theme, global.css
│   ├── home.mdx                     # Dashboard home with feature cards
│   ├── profile.mdx                  # User profile + sign out
│   ├── team.mdx                     # Team management
│   ├── billing.mdx                  # Plan status, external browser checkout
│   ├── push-notifications.mdx       # Registration, hooks, device linking
│   └── in-app-updates.mdx           # App Store / Play Store update check
│
├── backend/
│   ├── meta.json
│   ├── index.mdx                    # Overview — Convex, convex.config.ts, components
│   ├── schema.mdx                   # Full schema breakdown
│   ├── authentication.mdx           # @convex-dev/auth config, callbacks
│   ├── users.mdx                    # User functions + lib helpers
│   ├── teams.mdx                    # Team CRUD, invites, membership, roles
│   ├── billing.mdx                  # Dodo integration, webhooks, checkout, portal
│   ├── storage.mdx                  # R2 uploads, signed URLs
│   ├── email.mdx                    # Resend sendEmail
│   ├── ai-agent.mdx                 # createThread, continueThread
│   ├── rag.mdx                      # addDocument, search, askQuestion
│   ├── streaming.mdx                # createStream, getStreamBody
│   ├── push-notifications.mdx       # Device registration, broadcast
│   ├── http-routes.mdx              # Auth routes, Dodo webhook, /chat-stream
│   └── cron-jobs.mdx                # Expired invite cleanup
│
└── deployment/
    ├── meta.json
    ├── index.mdx                    # Overview
    ├── web.mdx                      # Vercel
    ├── mobile.mdx                   # EAS builds, TestFlight, Play Store
    └── convex.mdx                   # npx convex deploy
```

## meta.json Contents

### Root — `content/docs/meta.json`
```json
{
  "pages": ["guide", "web", "mobile", "backend", "deployment"]
}
```

### guide/meta.json
```json
{
  "title": "Guide",
  "description": "Getting started with the kit",
  "root": true,
  "pages": [
    "index",
    "prerequisites",
    "installation",
    "project-structure",
    "environment-variables",
    "shared-packages"
  ]
}
```

### web/meta.json
```json
{
  "title": "Web",
  "description": "Next.js 16 + shadcn/ui",
  "root": true,
  "pages": [
    "index",
    "---Setup---",
    "authentication",
    "theming",
    "components",
    "---Pages---",
    "landing-page",
    "dashboard",
    "profile",
    "team",
    "billing"
  ]
}
```

### mobile/meta.json
```json
{
  "title": "Mobile",
  "description": "Expo 54 + HeroUI Native",
  "root": true,
  "pages": [
    "index",
    "---Setup---",
    "authentication",
    "onboarding",
    "theming",
    "---Screens---",
    "home",
    "profile",
    "team",
    "billing",
    "---Platform Features---",
    "push-notifications",
    "in-app-updates"
  ]
}
```

### backend/meta.json
```json
{
  "title": "Backend",
  "description": "Convex backend",
  "root": true,
  "pages": [
    "index",
    "schema",
    "---Core---",
    "authentication",
    "users",
    "teams",
    "---Features---",
    "billing",
    "storage",
    "email",
    "---AI---",
    "ai-agent",
    "rag",
    "streaming",
    "---Infrastructure---",
    "push-notifications",
    "http-routes",
    "cron-jobs"
  ]
}
```

### deployment/meta.json
```json
{
  "title": "Deployment",
  "description": "Deploy your apps",
  "root": true,
  "pages": ["index", "web", "mobile", "convex"]
}
```

## Implementation Order

1. Scaffold all `meta.json` files + empty `.mdx` stubs
2. **Web** tab content first
3. **Mobile** tab content
4. **Backend** tab content
5. **Guide** tab content (intro, install, project structure)
6. **Deployment** tab content

## Fumadocs Reference

- Root folders with `"root": true` → sidebar tab switcher (auto-detected)
- `---Label---` in `pages` array → separator heading in sidebar
- `pages` array controls ordering; unlisted items are hidden
- Fetch Fumadocs docs: `https://fumadocs.dev/docs/<path>.mdx`
- Docs layout config: `app/docs/layout.tsx`
- Shared layout config: `lib/layout.shared.tsx`
