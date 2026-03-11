# Project Tree

```
ship-superfast/
├── apps/
│   ├── mobile/                                # Expo 54 + HeroUI Native + Uniwind
│   │   ├── app.json                           # Expo config (scheme, plugins)
│   │   ├── metro.config.js                    # Monorepo + withUniwindConfig
│   │   ├── tsconfig.json
│   │   ├── package.json
│   │   └── src/
│   │       ├── global.css                     # Tailwind + Uniwind + HeroUI styles
│   │       ├── uniwind-types.d.ts             # Uniwind type declarations
│   │       ├── expo-in-app-updates.d.ts       # In-app updates type declarations
│   │       ├── app/
│   │       │   ├── _layout.tsx                # Root: SafeArea → HeroUI → ErrorBoundary → Convex → Auth → Session
│   │       │   ├── (auth)/
│   │       │   │   ├── _layout.tsx            # Auth stack layout
│   │       │   │   └── sign-in.tsx            # Google OAuth sign-in
│   │       │   ├── (onboarding)/
│   │       │   │   ├── _layout.tsx            # Onboarding stack layout
│   │       │   │   └── index.tsx              # 3-slide onboarding with animated dots
│   │       │   └── (tabs)/
│   │       │       ├── _layout.tsx            # Tab bar (Home, Team, Billing, Profile)
│   │       │       ├── index.tsx              # Home — welcome, stats, pending invites
│   │       │       ├── team.tsx               # Team — members, invites, roles
│   │       │       ├── billing.tsx            # Billing — plan, history, upgrade via browser
│   │       │       └── profile.tsx            # Profile — avatar, name edit, sign out
│   │       ├── components/
│   │       │   ├── ErrorBoundary.tsx           # JS error catch + retry (HeroUI Button)
│   │       │   └── SplashScreenController.tsx  # Fast splash hide on layout ready
│   │       ├── providers/
│   │       │   ├── SessionProvider.tsx         # useSession() — user, auth state, signOut
│   │       │   └── ForegroundRecoveryProvider.tsx # Refetch data after background resume
│   │       ├── hooks/
│   │       │   ├── useActiveTeam.ts            # Active team context with AsyncStorage persistence
│   │       │   ├── usePushNotifications.ts     # Expo push notification registration
│   │       │   ├── useStablePaginatedQuery.ts  # Scroll-stable Convex pagination
│   │       │   └── useInAppUpdates.ts          # App Store / Play Store update check
│   │       └── assets/
│   │           ├── appicon.png                 # App icon
│   │           ├── brand-logo.png              # Brand logo
│   │           └── stack-logos/                # Tech stack logos for onboarding
│   │
│   ├── web/                                   # Next.js 16 + shadcn/ui + Tailwind v4
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── next.config.mjs
│   │   ├── postcss.config.mjs
│   │   ├── eslint.config.mjs
│   │   ├── components.json                    # shadcn/ui config
│   │   ├── lib/
│   │   │   ├── utils.ts                       # cn() utility
│   │   │   └── config.ts                      # APP_NAME, NAV_ITEMS, PAGE_TITLES
│   │   ├── app/
│   │   │   ├── globals.css                    # Theme colors (--primary, --accent, light/dark)
│   │   │   ├── layout.tsx                     # Root: ConvexClient → Session → Theme
│   │   │   ├── page.tsx                       # Landing page (hero + feature cards)
│   │   │   ├── not-found.tsx                  # Custom 404 page
│   │   │   ├── sign-in/page.tsx               # Google OAuth sign-in
│   │   │   └── dashboard/
│   │   │       ├── layout.tsx                 # Auth guard + sidebar layout
│   │   │       ├── page.tsx                   # Dashboard overview cards
│   │   │       ├── profile/page.tsx           # User profile (avatar, name, email, role)
│   │   │       ├── billing/page.tsx           # Billing portal, payment history, subscriptions
│   │   │       └── team/page.tsx              # Team management, invites, member roles
│   │   ├── hooks/
│   │   │   └── use-mobile.ts                  # Mobile viewport detection hook
│   │   └── components/
│   │       ├── providers/
│   │       │   ├── convex-client-provider.tsx  # ConvexProvider + ConvexAuthProvider
│   │       │   ├── session-provider.tsx        # useSession() — user, auth state, signOut
│   │       │   ├── team-provider.tsx           # Team context provider
│   │       │   └── theme-provider.tsx          # next-themes dark mode
│   │       ├── navigation/
│   │       │   ├── app-sidebar.tsx             # Dashboard sidebar navigation
│   │       │   ├── mode-toggle.tsx             # Light/dark theme toggle
│   │       │   └── team-switcher.tsx           # Team selection dropdown
│   │       ├── team/
│   │       │   └── incoming-invites.tsx        # Team invite notifications
│   │       ├── landing/
│   │       │   ├── CircularText.tsx            # Animated circular text component
│   │       │   └── LogoLoop.tsx               # Animated logo marquee component
│   │       └── ui/                            # shadcn/ui components (55 installed)
│   │
│   └── docs-site/                             # Fumadocs documentation site
│       ├── package.json
│       ├── tsconfig.json
│       ├── next.config.mjs
│       ├── postcss.config.mjs
│       ├── source.config.ts                   # Fumadocs content directory config
│       ├── components/
│       │   └── mdx.tsx                        # MDX component overrides
│       ├── lib/
│       │   ├── source.ts                      # Page tree loader + icon handler
│       │   └── layout.shared.tsx              # Shared layout options (site title, logo)
│       ├── app/                               # Fumadocs page routes
│       ├── public/
│       │   └── logo.png                       # Brand logo for nav
│       └── content/docs/                      # MDX documentation (6 sidebar tabs)
│           ├── meta.json                      # Root tab ordering
│           ├── guide/                         # Guide tab (8 pages)
│           ├── web/                           # Web tab (9 pages)
│           ├── mobile/                        # Mobile tab (10 pages)
│           ├── backend/                       # Backend tab (14 pages)
│           ├── deployment/                    # Deployment tab (4 pages)
│           └── docs-site/                     # Docs Site tab (1 page)
│
├── packages/
│   ├── convex/                                # @repo/convex — backend
│   │   ├── package.json
│   │   └── convex/
│   │       ├── schema.ts                      # users, registeredDevices, customers, payments, subscriptions, teams, teamMembers, teamInvites
│   │       ├── convex.config.ts               # r2 + push + dodopayments + resend + agent + rag + streaming
│   │       ├── auth.config.ts                 # JWKS domain config
│   │       ├── auth.ts                        # Google OAuth + mobile deep link callbacks
│   │       ├── http.ts                        # Auth routes + Dodo webhook + /chat-stream
│   │       ├── users.ts                       # current, currentInternal, isAdmin, getCurrentWithRole
│   │       ├── customers.ts                   # Customer lookup by email/authId, identify helpers
│   │       ├── storage.ts                     # R2 generateUploadUrl, getFileUrl
│   │       ├── payments.ts                    # Dodo createCheckout, getCustomerPortal
│   │       ├── plans.ts                       # Plan queries (listPlans, etc.)
│   │       ├── webhooks.ts                    # Dodo payment/subscription webhook handlers
│   │       ├── dodo.ts                        # DodoPayments client initialization
│   │       ├── email.ts                       # Resend sendEmail (internal mutation)
│   │       ├── agent.ts                       # AI agent — createThread, continueThread
│   │       ├── rag.ts                         # RAG — addDocument, search, askQuestion
│   │       ├── streaming.ts                   # Persistent text streaming — createStream, getStreamBody
│   │       ├── pushNotifications.ts           # Record/link/unlink devices, broadcast, sendToUser
│   │       ├── teams.ts                       # Team CRUD, invites, membership management
│   │       ├── crons.ts                       # Daily expired invite cleanup
│   │       ├── inviteCleanup.ts               # Internal mutation — remove stale invites
│   │       └── lib/
│   │           ├── constants.ts               # APP_NAME, DEFAULT_FROM_EMAIL
│   │           ├── billing.ts                 # Customer upsert, team plan management, subscription helpers
│   │           ├── dodoWebhooks.ts            # Dodo webhook handler config (subscription/payment/dispute)
│   │           ├── plans.ts                   # Plan definitions, product IDs, pricing
│   │           ├── teams.ts                   # Team membership lookups, role checks
│   │           ├── users.ts                   # getCurrentUser, getUserById, isAdmin
│   │           ├── storage.ts                 # uploadFile, getSignedUrl, deleteFile (R2)
│   │           └── pushNotifications.ts       # recordToken, linkDevice, sendToDevice, broadcastToAll
│   │
│   ├── shared/                                # @repo/shared
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── types.ts                       # UserRole, TeamRole, PlanTier, User types
│   │       ├── constants.ts                   # APP_NAME
│   │       ├── utils.ts                       # getInitials()
│   │       └── index.ts                       # Re-exports
│   │
│   └── eslint-config/                         # @repo/eslint-config
│       ├── package.json
│       ├── base.js
│       ├── next.js
│       └── react-internal.js
│
├── llm-txt/                                   # AI-friendly documentation
│   ├── convex/                                # Convex rules, best practices, component docs
│   ├── expo/                                  # Expo doc tree
│   ├── fumadocs/                              # Fumadocs doc tree
│   ├── heroui-native/                         # HeroUI Native component docs
│   └── uniwind/                               # Uniwind (Tailwind v4 for RN) docs
│
├── .mcp.json                                  # MCP servers (shadcn, heroui-native)
├── .mcp.example.json                          # MCP server template
├── .npmrc                                     # node-linker=hoisted, shamefully-hoist=true
├── .nvmrc                                     # Node 20
├── .prettierrc                                # Prettier config
├── CLAUDE.md                                  # AI coding guidelines
├── README.md                                  # Quick start + commands
├── package.json                               # Root workspace scripts
├── pnpm-workspace.yaml                        # apps/* + packages/*
└── turbo.json                                 # build, dev, lint, check-types, codegen
```
