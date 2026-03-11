# Ship Superfast

A ready-to-go monorepo starter for building cross-platform apps with **Convex + Next.js + Expo**.

## Features

- **Auth** — Google OAuth + Magic Link email (Convex Auth)
- **Teams** — Multi-user team management with roles and billing per team
- **Payments** — Checkout, subscriptions, customer portal (Dodo Payments)
- **Storage** — File uploads via Cloudflare R2
- **Email** — Transactional emails (Resend)
- **AI** — Agents, threads, tools, RAG, text streaming (OpenAI)
- **Push Notifications** — Expo push for mobile
- **Docs** — Full documentation site (Fumadocs)

## Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- [Convex account](https://dashboard.convex.dev)

---

## Setup

### 1. Clone and Install

```bash
git clone <repo-url> my-app
cd my-app
pnpm install
```

### 2. Create Convex Project

```bash
cd packages/convex
npx convex dev
# Follow prompts to create a new project
# Note your deployment URL (e.g. https://your-deployment.convex.cloud)
```

### 3. Create Local Env Files

```bash
echo "CONVEX_DEPLOYMENT=dev:your-deployment-slug" > packages/convex/.env.local
echo "NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud" > apps/web/.env.local
echo "EXPO_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud" > apps/mobile/.env.local
```

### 4. Google OAuth (Required)

1. Go to [Google Cloud Console > Credentials](https://console.cloud.google.com/apis/credentials)
2. Create **OAuth 2.0 Client ID** (Web application)
3. Add redirect URI: `https://your-deployment.convex.site/api/auth/callback/google`
4. Set credentials:
   ```bash
   cd packages/convex
   npx convex env set AUTH_GOOGLE_ID "your-google-client-id"
   npx convex env set AUTH_GOOGLE_SECRET "your-google-client-secret"
   ```

### 5. JWT Keys (Required)

```bash
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out /tmp/jwt_private.pem
openssl pkey -in /tmp/jwt_private.pem -pubout -out /tmp/jwt_public.pem

cd packages/convex
npx convex env set JWT_PRIVATE_KEY -- "$(cat /tmp/jwt_private.pem)"

node -e "
const crypto = require('crypto');
const publicKey = crypto.createPublicKey(require('fs').readFileSync('/tmp/jwt_public.pem'));
const jwk = publicKey.export({ format: 'jwk' });
jwk.use = 'sig'; jwk.alg = 'RS256'; jwk.kid = 'convex-auth-key';
console.log(JSON.stringify({ keys: [jwk] }));
" > /tmp/jwks.json

npx convex env set JWKS -- "$(cat /tmp/jwks.json)"
rm /tmp/jwt_private.pem /tmp/jwt_public.pem /tmp/jwks.json
```

### 6. SITE_URL (Required)

```bash
npx convex env set SITE_URL "http://localhost:3000"
# Production: npx convex env set SITE_URL "https://yourapp.com"
```

### 7. Magic Link Auth (Optional)

1. Get API key from [resend.com](https://resend.com)
2. Set credential:
   ```bash
   npx convex env set AUTH_RESEND_KEY "re_your_resend_api_key"
   ```

> Without a verified domain, Resend only delivers to your signup email.

### 8. Cloudflare R2 (Optional — File Storage)

1. Create R2 bucket in [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Create R2 API token with read/write permissions
3. Set credentials:
   ```bash
   npx convex env set R2_ACCESS_KEY_ID "your-access-key-id"
   npx convex env set R2_SECRET_ACCESS_KEY "your-secret-access-key"
   npx convex env set R2_ENDPOINT "https://your-account-id.r2.cloudflarestorage.com"
   npx convex env set R2_BUCKET "your-bucket-name"
   npx convex env set R2_TOKEN "your-r2-token"
   ```

### 9. Firebase (Optional — Android Push Notifications)

1. Create project in [Firebase Console](https://console.firebase.google.com)
2. Add **Android app** with your package name
3. Download `google-services.json` → place at `apps/mobile/google-services.json`
4. Update `apps/mobile/app.json`:
   ```json
   {
     "expo": {
       "android": {
         "package": "com.yourcompany.app",
         "googleServicesFile": "./google-services.json"
       }
     }
   }
   ```

> iOS push works via APNs automatically with EAS Build — no Firebase needed.

### 10. EAS Project (Optional — Mobile Builds)

```bash
cd apps/mobile
npx eas init
# Adds projectId to app.json — required for Expo push tokens
```

### 11. Other Optional Services

```bash
# OpenAI (AI Agent + RAG)
npx convex env set OPENAI_API_KEY "sk-..."

# Dodo Payments
npx convex env set DODO_PAYMENTS_API_KEY "your-api-key"
npx convex env set DODO_PAYMENTS_ENVIRONMENT "test_mode"
npx convex env set DODO_PAYMENTS_WEBHOOK_SECRET "your-webhook-secret"

# Resend Email
npx convex env set RESEND_API_KEY "re_..."
```

---

## Running

```bash
pnpm dev                              # All apps + backend

# Individual
cd apps/web && pnpm dev               # Web (http://localhost:3000)
cd apps/mobile && pnpm dev            # Mobile (Expo dev server)
cd apps/docs-site && pnpm dev         # Docs (http://localhost:3001)
cd packages/convex && pnpm dev        # Backend

pnpm build                            # Build all
pnpm check-types                      # Type check all
```

### Mobile

```bash
cd apps/mobile
npx expo run:ios                      # iOS simulator
npx expo run:android                  # Android emulator
npx expo start --clear                # Clear cache and restart
```

---

## Environment Variables

### Convex Dashboard — Required

| Variable | Purpose |
|----------|---------|
| `AUTH_GOOGLE_ID` | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
| `JWT_PRIVATE_KEY` | RSA private key (PEM) |
| `JWKS` | RSA public key (JWK JSON) |
| `SITE_URL` | Web app URL |

### Convex Dashboard — Optional

| Variable | Feature |
|----------|---------|
| `AUTH_RESEND_KEY` | Magic link auth |
| `R2_TOKEN`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`, `R2_BUCKET` | File storage |
| `OPENAI_API_KEY` | AI agent + RAG |
| `DODO_PAYMENTS_API_KEY`, `DODO_PAYMENTS_ENVIRONMENT`, `DODO_PAYMENTS_WEBHOOK_SECRET` | Payments |
| `RESEND_API_KEY` | Email |

### Local `.env.local` Files

| File | Variable |
|------|----------|
| `packages/convex/.env.local` | `CONVEX_DEPLOYMENT=dev:your-slug` |
| `apps/web/.env.local` | `NEXT_PUBLIC_CONVEX_URL=https://...convex.cloud` |
| `apps/mobile/.env.local` | `EXPO_PUBLIC_CONVEX_URL=https://...convex.cloud` |

---

## Project Structure

```
apps/
  web/               → Next.js 16 + shadcn/ui
  mobile/            → Expo 54 + HeroUI Native + Uniwind
  docs-site/         → Fumadocs documentation

packages/
  convex/            → Backend (auth, storage, payments, email, AI)
  shared/            → Shared types, constants, utils
  eslint-config/     → ESLint config
```

## Key Files

| File | Purpose |
|------|---------|
| `packages/convex/convex/schema.ts` | Database schema |
| `packages/convex/convex/auth.ts` | Auth config (Google OAuth + Magic Link) |
| `packages/convex/convex/teams.ts` | Team management |
| `packages/convex/convex/payments.ts` | Checkout + customer portal |
| `packages/convex/convex/webhooks.ts` | Dodo payment webhook handlers |
| `packages/convex/convex/customers.ts` | Dodo Payments customer management |
| `packages/convex/convex/plans.ts` | Subscription plan management |
| `packages/convex/convex/email.ts` | Send emails |
| `packages/convex/convex/storage.ts` | R2 file upload/download |
| `packages/convex/convex/agent.ts` | AI agent |
| `packages/convex/convex/rag.ts` | Vector search |
| `packages/convex/convex/streaming.ts` | AI text streaming |
| `packages/convex/convex/pushNotifications.ts` | Push notifications |
| `packages/convex/convex/http.ts` | HTTP routes (auth, webhooks, streaming) |
| `packages/convex/convex/crons.ts` | Scheduled tasks |

## Theming

- **Web** → `apps/web/app/globals.css` — edit `--primary` in `:root` and `.dark`
- **Mobile** → `apps/mobile/src/global.css` — edit `--accent` in `@variant light` and `@variant dark`
- Use [oklch.com](https://oklch.com) to pick colors

## Adding Components

```bash
# Web (shadcn/ui)
cd apps/web && npx shadcn@latest add dialog

# Mobile (HeroUI Native) — included with the package
```

---

## Deployment

### Backend (Convex) — deploy first
```bash
cd packages/convex && npx convex deploy
```

### Web (Vercel)
1. Connect repo to [Vercel](https://vercel.com)
2. Set root directory to `apps/web`
3. Add `NEXT_PUBLIC_CONVEX_URL` env var
4. Deploy

### Mobile (EAS Build)
```bash
cd apps/mobile
npx eas build --platform ios
npx eas build --platform android
npx eas submit --platform ios
npx eas submit --platform android
```

### Docs (Vercel)
1. Connect repo to [Vercel](https://vercel.com)
2. Set root directory to `apps/docs-site`
3. Deploy

---

## Documentation

Full docs at `apps/docs-site/` — run `cd apps/docs-site && pnpm dev` to view locally at http://localhost:3001.

Covers: Guide, Web, Mobile, Backend, Deployment, and Docs Site setup.
