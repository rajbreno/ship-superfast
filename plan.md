# CXOemail → Ship Superfast: Improvement Backport Plan

## Overview

CXOemail was built from the Ship Superfast kit and accumulated significant improvements in security, billing, team management, email, layout, and infrastructure. This plan identifies and backports **generic, reusable improvements** while excluding domain-specific features (email finder, chrome extension, search providers, executive role types).

**Status: COMPLETE** — All modules implemented and verified.

---

## Module 1: Schema Improvements ✓

**Files:** `packages/convex/convex/schema.ts`

| Change | Detail | Status |
|--------|--------|--------|
| Add `teamCredits` table | `teamId`, `balance`, `totalPurchased`, `totalUsed` with `by_teamId` index | Done |
| Add `creditsProvisioned` field | On `subscriptions` table — prevents double-crediting on webhook retries | Done |
| Add `by_plan` index | On `teams` table — enables querying teams by plan tier | Done |
| Add `by_status_and_createdAt` index | On `teamInvites` table — enables efficient invite cleanup queries | Done |

---

## Module 2: Credits System (NEW) ✓

**Files:** `packages/convex/convex/credits.ts` (new), `packages/convex/convex/lib/plans.ts` (update)

| Change | Detail | Status |
|--------|--------|--------|
| Create `credits.ts` | Full credit management module | Done |
| `getTeamCredits` query | Returns balance, totalPurchased, totalUsed (auth + team membership check) | Done |
| `getTeamCreditsInternal` query | Same but internal (no auth check) | Done |
| `reserveCredit` mutation | Atomically deduct 1 credit, increment totalUsed | Done |
| `refundCredit` mutation | Add 1 credit back, decrement totalUsed (floored at 0) | Done |
| `addCredits` mutation | Bulk credit addition, creates record if missing | Done |
| `provisionCreditsOnce` mutation | Idempotent — checks `creditsProvisioned` flag in same transaction | Done |
| `resetCredits` mutation | Plan-based reset, only increments totalPurchased if balance changes | Done |
| `revokeCredits` mutation | Zero out balance on refund | Done |
| `initializeCredits` mutation | Bootstrap new teams (no-op if exists) | Done |
| `resetFreePlanCredits` mutation | Monthly cron target — resets all free/unset teams to 10 | Done |
| Add `PLAN_CREDITS` to plans.ts | `{ free: 10, pro: 100, max: 300 }` | Done |
| Add env var support for product IDs | `DODO_PRO_PRODUCT_ID`, `DODO_MAX_PRODUCT_ID` with fallbacks | Done |

**Excluded:** `cleanupStaleSearches` — references `emailSearches` table (domain-specific).

---

## Module 3: Webhook Hardening ✓

**Files:** `packages/convex/convex/webhooks.ts`, `packages/convex/convex/lib/dodoWebhooks.ts`

| Change | Detail | Status |
|--------|--------|--------|
| Add `getSubscriptionById` query | Check if subscription exists by ID | Done |
| Add `wasSubscriptionProvisioned` query | Check `creditsProvisioned` flag on subscription | Done |
| Add `markSubscriptionProvisioned` mutation | Mark subscription as provisioned | Done |
| Credit provisioning on activation | `onSubscriptionActive` calls `provisionCreditsOnce` atomically | Done |
| Smart renewal logic | `onSubscriptionRenewed` skips credit reset for initial subscription | Done |
| Upgrade/downgrade detection | `onSubscriptionPlanChanged` queries current plan, defers change | Done |
| Credit revocation on refund | `handlePaymentStatusEvent` zeros balance on `downgradePlan` | Done |
| Add `getTeamPlan` internal query | In `teams.ts` — used by plan change detection | Done |
| Warning logs | Malformed teamId metadata, unresolvable product IDs | Done |
| Product name truncation | `.slice(0, 500)` in `extractNameFromPayload` | Done |
| Import `PLAN_CREDITS` | In `dodoWebhooks.ts` for credit allocation lookup | Done |

---

## Module 4: Payments Security ✓

**Files:** `packages/convex/convex/payments.ts`

| Change | Detail | Status |
|--------|--------|--------|
| Product ID validation | Reject unknown product IDs via `PRODUCT_PLAN_MAP` check | Done |
| Quantity validation | Reject `quantity !== 1` | Done |
| Return URL validation | Only allow `SITE_URL` prefix or relative paths | Done |
| Sanitize subscription responses | Strip `webhookPayload`, `businessId`, `customerEmail` | Done |
| Sanitize payment responses | Only expose `_id`, `_creationTime`, `displayName`, `plan`, `amount`, `currency`, `status`, `createdAt` | Done |
| Add `creditsProvisioned` to subscription validator | Expose provisioning state to client | Done |

---

## Module 5: Auth & User Security ✓

**Files:** `packages/convex/convex/users.ts`, `packages/convex/convex/teams.ts`

| Change | Detail | Status |
|--------|--------|--------|
| HTML sanitization in `updateProfile` | Strip HTML tags with `/<[^>]*>/g` regex | Done |
| Name length validation | Reject empty names and names > 100 characters | Done |
| Stricter email regex | RFC 5321 compliant pattern for invite validation | Done |
| Team existence check | Verify team exists in `acceptInvite` before creating membership | Done |

---

## Module 6: Team Credit Integration ✓

**Files:** `packages/convex/convex/teams.ts`

| Change | Detail | Status |
|--------|--------|--------|
| Initialize credits on team creation | Insert `teamCredits` record with 10 balance in `ensureTeam` | Done |

---

## Module 7: Cron Jobs ✓

**Files:** `packages/convex/convex/crons.ts`

| Change | Detail | Status |
|--------|--------|--------|
| Add `reset-free-plan-credits` | Monthly cron `"0 0 1 * *"` calls `internal.credits.resetFreePlanCredits` | Done |

**Excluded:** `cleanup-stale-searches` — references `emailSearches` table (domain-specific).

---

## Module 8: Email Template Improvements ✓

**Files:** `packages/convex/convex/email.ts`, `packages/convex/convex/auth.ts`, `packages/convex/convex/lib/constants.ts`

| Change | Detail | Status |
|--------|--------|--------|
| Dynamic logo URL | `process.env.SITE_URL + "/icon.png"` instead of hardcoded URL | Done |
| Add `escapeHtml` to email.ts | Exported utility for HTML entity encoding | Done |
| Escape `productName` in payment template | Prevents HTML injection from Dodo product names | Done |
| Add heading styles | `font-size:16px;font-weight:600` on payment/refund headings | Done |
| Branded `DEFAULT_FROM_EMAIL` | `APP_NAME <email>` format in constants.ts | Done |
| Fix auth email subject | Use `APP_NAME` variable instead of hardcoded "Convex Kit" | Done |
| Fix auth email plain text | Use `APP_NAME` variable | Done |
| Fix auth from address | Include display name in fallback (`APP_NAME <noreply@...>`) | Done |

---

## Module 9: Customer Resolution Enhancement ✓

**Files:** `packages/convex/convex/customers.ts`

| Change | Detail | Status |
|--------|--------|--------|
| Check ALL team memberships | `.collect()` + loop instead of `.first()` | Done |
| Add subscription fallback | Check `subscriptions.by_teamId` in addition to `payments.by_teamId` | Done |

---

## Module 10: Web App Security & Layout ✓

**Files:** `apps/web/next.config.mjs`, `apps/web/app/dashboard/layout.tsx`

| Change | Detail | Status |
|--------|--------|--------|
| Remove `unsafe-eval` from CSP | Security hardening | Done |
| Add Google OAuth CSP domains | `accounts.google.com`, `oauth2.googleapis.com`, `*.googleusercontent.com` | Done |
| Add test-checkout to frame-src | `test-checkout.dodopayments.com` for Dodo test mode | Done |
| Defensive rendering with `useRef` | Prevent duplicate `ensureTeam` calls | Done |
| Overflow handling | `overflow-x-hidden` on SidebarInset, `min-w-0` on main | Done |

---

## Module 11: Web Dashboard & Billing Improvements ✓

**Files:** `apps/web/app/dashboard/page.tsx`, `apps/web/app/dashboard/billing/page.tsx`

| Change | Detail | Status |
|--------|--------|--------|
| Credits display on dashboard | Balance + used stats replace generic auth card | Done |
| Comprehensive billing URL whitelist | Explicit Dodo host list instead of loose regex | Done |
| Better manage billing condition | Show button when `hasBillingHistory OR active subscription` | Done |
| Cancelled subscription re-subscribe | Route to fresh checkout instead of portal when cancelled | Done |

---

## Module 12: Layout Specs ✓

**Files:** Multiple web app files

| Change | Detail | Status |
|--------|--------|--------|
| Landing/Navbar/Footer: `max-w-6xl` → `max-w-7xl` | Wider public pages | Done |
| Dashboard pages: `max-w-4xl` → `max-w-6xl` | Wider dashboard content | Done |
| Create `Footer` component | Responsive `flex-col sm:flex-row` with privacy/terms links | Done |
| Landing footer responsive | `flex-col items-center sm:flex-row sm:justify-between` | Done |
| Terms/Privacy: responsive H1 | `text-2xl font-medium sm:text-4xl` (was fixed `text-4xl`) | Done |
| Terms/Privacy: semantic HTML | `<main>` tag instead of `<div>` | Done |
| Terms/Privacy: add Footer | `<Footer />` component added | Done |

---

## Module 13: Agent Utilities ✓

**Files:** `packages/convex/convex/lib/retry.ts` (new), `packages/convex/convex/lib/agentUtils.ts` (new), `packages/convex/convex/streaming.ts`

| Change | Detail | Status |
|--------|--------|--------|
| `withRetry()` utility | Generic exponential backoff wrapper for external API calls | Done |
| `sanitizeString()` utility | Strip HTML tags + truncate LLM output | Done |
| `parseJsonArrayFromText()` utility | Extract JSON array from freeform LLM text with optional type guard | Done |
| Team-scoping security note | Document that streams aren't team-scoped in streaming.ts | Done |

---

## All Changed Files (24 modified + 5 new)

### Backend (`packages/convex/convex/`)
| File | Type |
|------|------|
| `schema.ts` | Modified |
| `credits.ts` | **New** |
| `webhooks.ts` | Modified |
| `lib/dodoWebhooks.ts` | Modified |
| `payments.ts` | Modified |
| `users.ts` | Modified |
| `teams.ts` | Modified |
| `customers.ts` | Modified |
| `crons.ts` | Modified |
| `email.ts` | Modified |
| `auth.ts` | Modified |
| `streaming.ts` | Modified |
| `lib/plans.ts` | Modified |
| `lib/constants.ts` | Modified |
| `lib/retry.ts` | **New** |
| `lib/agentUtils.ts` | **New** |

### Frontend (`apps/web/`)
| File | Type |
|------|------|
| `next.config.mjs` | Modified |
| `app/page.tsx` | Modified |
| `app/dashboard/layout.tsx` | Modified |
| `app/dashboard/page.tsx` | Modified |
| `app/dashboard/billing/page.tsx` | Modified |
| `app/dashboard/team/page.tsx` | Modified |
| `app/dashboard/profile/page.tsx` | Modified |
| `app/terms/page.tsx` | Modified |
| `app/privacy/page.tsx` | Modified |
| `components/navigation/navbar.tsx` | Modified |
| `components/navigation/footer.tsx` | **New** |

### Mobile (`apps/mobile/`)
No changes needed — already identical between both projects.

---

## Excluded (Domain-Specific to CXOemail)

- `emailSearches` table and `emailFinder.ts`
- `cleanupStaleSearches` function and cron
- Chrome extension (`apps/chrome-extension/`)
- Search providers (Parallel, Exa)
- Agent tools (`lib/tools/`)
- `emailFinderAgent` (keep only generic `supportAgent`)
- `ExecutiveRole` type and `ROLE_TITLE_MAP`
- OpenRouter provider (kit uses OpenAI directly)
- CXOemail branding, pricing, and product-specific content
