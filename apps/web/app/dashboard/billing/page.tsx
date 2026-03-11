"use client";

import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "../../../../../packages/convex/convex/_generated/api";
import type { Id } from "../../../../../packages/convex/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  Settings01Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { useTeam } from "@/components/providers/team-provider";
import type { PlanTier } from "@repo/shared";

// ── Plans UI config ──
// Descriptions and feature lists for each plan tier.

const PLAN_UI: Record<string, { description: string; features: string[] }> = {
  pro: {
    description: "Priority support and continuous updates",
    features: [
      "Full source code access",
      "Convex backend with auth and storage",
      "Next.js 16 + Expo 54 monorepo",
      "AI agents with RAG and streaming",
      "Push notifications (iOS + Android)",
      "Transactional emails via Resend",
      "Priority support",
      "Monthly updates and patches",
    ],
  },
  max: {
    description: "Everything in Pro plus premium features",
    features: [
      "Everything in Pro",
      "Early access to new features",
      "Private Discord channel",
      "1-on-1 onboarding call",
      "Custom integrations support",
      "Priority bug fixes",
      "Dedicated account manager",
    ],
  },
};

const PLAN_BADGE: Record<
  string,
  { label: string; variant: "secondary" | "outline" }
> = {
  free: { label: "Free", variant: "outline" },
  pro: { label: "Pro", variant: "secondary" },
  max: { label: "Max", variant: "secondary" },
};

const PLAN_ORDER: Record<string, number> = { free: 0, pro: 1, max: 2 };

const STATUS_STYLES: Record<
  string,
  {
    label: string;
    variant: "secondary" | "destructive" | "outline";
  }
> = {
  active: { label: "Active", variant: "secondary" },
  renewed: { label: "Renewed", variant: "secondary" },
  on_hold: { label: "On Hold", variant: "outline" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  expired: { label: "Expired", variant: "destructive" },
  failed: { label: "Failed", variant: "destructive" },
  succeeded: { label: "Succeeded", variant: "secondary" },
  refunded: { label: "Refunded", variant: "outline" },
  processing: { label: "Processing", variant: "outline" },
};

function PlanBadge({ plan }: { plan: string }) {
  const config = PLAN_BADGE[plan] ?? PLAN_BADGE.free;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_STYLES[status] ?? {
    label: status,
    variant: "outline" as const,
  };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export default function BillingPage() {
  const { activeTeam } = useTeam();
  const isOwnerOrAdmin =
    activeTeam?.role === "owner" || activeTeam?.role === "admin";

  const plansData = useQuery(api.plans.getPlans);
  const plans = (plansData?.plans ?? []).map((p) => ({
    ...p,
    ...(PLAN_UI[p.tier] ?? { description: "", features: [] }),
  }));

  const billingSummary = useQuery(
    api.payments.getTeamBillingSummary,
    activeTeam ? { teamId: activeTeam._id } : "skip",
  );
  const paymentHistory = useQuery(
    api.payments.getPaymentHistory,
    activeTeam ? { teamId: activeTeam._id } : "skip",
  );
  const hasBillingHistory = paymentHistory && paymentHistory.length > 0;

  if (!activeTeam) {
    return (
      <div className="mx-auto max-w-4xl">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <HugeiconsIcon
              icon={InformationCircleIcon}
              strokeWidth={1.5}
              className="h-10 w-10 text-muted-foreground"
            />
            <p className="text-sm text-muted-foreground">
              No team selected. Create or join a team first.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentPlan = billingSummary?.plan ?? activeTeam.plan ?? "free";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Team billing summary */}
      <Card>
        <CardHeader>
          <CardTitle>{activeTeam.name}</CardTitle>
          <CardDescription>
            {billingSummary ? (
              <>
                <PlanBadge plan={currentPlan} /> plan
                {" \u00b7 "}
                {billingSummary.totalMembers} member{billingSummary.totalMembers !== 1 ? "s" : ""}
              </>
            ) : (
              "Loading billing info..."
            )}
          </CardDescription>
          {/* Manage Billing button — invoices, receipts, and subscription management */}
          {isOwnerOrAdmin && hasBillingHistory && (
            <CardAction>
              <ManageBillingButton teamId={activeTeam._id} />
            </CardAction>
          )}
        </CardHeader>
      </Card>

      {/* Non-owner notice */}
      {!isOwnerOrAdmin && (
        <Card>
          <CardContent className="py-6">
            <div className="flex items-start gap-3">
              <HugeiconsIcon
                icon={InformationCircleIcon}
                strokeWidth={1.5}
                className="mt-0.5 h-6 w-6 shrink-0 text-muted-foreground"
              />
              <div>
                <p className="text-sm font-medium">
                  Team plan: <PlanBadge plan={currentPlan} />
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Plan upgrades are managed by your team owner or admin.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan cards with upgrade buttons */}
      {isOwnerOrAdmin && (
        <PlansSection
          plans={plans}
          currentPlan={currentPlan}
          teamId={activeTeam._id}
        />
      )}

      {/* Billing history */}
      {hasBillingHistory && (
        <BillingHistory payments={paymentHistory ?? []} />
      )}
    </div>
  );
}

// ── Manage Billing Button ────────────────────────────────────────────

function ManageBillingButton({ teamId }: { teamId: Id<"teams"> }) {
  const getPortal = useAction(api.payments.getCustomerPortal);
  const [loading, setLoading] = useState(false);

  async function handleManageBilling() {
    setLoading(true);
    try {
      const result = await getPortal({ send_email: false, teamId });
      if (result?.portal_url) {
        window.open(result.portal_url, "_blank");
      } else {
        toast.error("Unable to open billing portal.");
      }
    } catch {
      toast.error("Unable to open billing portal. Complete a purchase first.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleManageBilling}
      disabled={loading}
    >
      <HugeiconsIcon icon={Settings01Icon} className="mr-2 h-5 w-5" />
      {loading ? "Opening..." : "Manage Billing"}
    </Button>
  );
}

// ── Plans Section ────────────────────────────────────────────────────

type PlanWithUI = {
  tier: string;
  productId: string;
  name: string;
  priceDisplay: string;
  period: string;
  description: string;
  features: string[];
};

function PlansSection({
  plans,
  currentPlan,
  teamId,
}: {
  plans: PlanWithUI[];
  currentPlan: string;
  teamId: Id<"teams">;
}) {
  const createCheckout = useAction(api.payments.createCheckout);
  const getPortal = useAction(api.payments.getCustomerPortal);
  const [loading, setLoading] = useState<string | null>(null);

  const isFreePlan = currentPlan === "free";

  async function handleSubscribe(targetPlan: PlanTier) {
    const plan = plans.find((p) => p.tier === targetPlan);
    if (!plan) return;

    setLoading(targetPlan);
    try {
      const result = await createCheckout({
        product_cart: [{ product_id: plan.productId, quantity: 1 }],
        returnUrl: window.location.origin + "/dashboard/billing",
        teamId,
      });
      if (result?.checkout_url) {
        window.location.href = result.checkout_url;
      } else {
        toast.error("Checkout failed. Please try again.");
      }
    } catch {
      toast.error("Checkout failed. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  async function handleChangePlan() {
    setLoading("portal");
    try {
      // Customer Portal handles plan upgrades/downgrades with proration.
      // Requires: products in a Product Collection + "Allow Subscription Updates" enabled in Dodo dashboard.
      const result = await getPortal({ send_email: false, teamId });
      if (result?.portal_url) {
        window.open(result.portal_url, "_blank");
      } else {
        toast.error("Unable to open billing portal.");
      }
    } catch {
      toast.error("Unable to open billing portal.");
    } finally {
      setLoading(null);
    }
  }

  const currentOrder = PLAN_ORDER[currentPlan] ?? 0;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {plans.map((plan) => {
        const planOrder = PLAN_ORDER[plan.tier] ?? 0;
        const isCurrentPlan = plan.tier === currentPlan;
        const isUpgrade = planOrder > currentOrder;
        const isDowngrade = planOrder < currentOrder;

        return (
          <Card
            key={plan.tier}
            className={`flex flex-col${isCurrentPlan ? " border-primary" : ""}`}
          >
            <CardHeader>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              {isCurrentPlan && (
                <CardAction>
                  <Badge variant="secondary">Current</Badge>
                </CardAction>
              )}
            </CardHeader>
            <CardContent className="flex-1">
              <div className="mb-6">
                <span className="text-3xl font-semibold">
                  {plan.priceDisplay}
                </span>
                {plan.period && (
                  <span className="text-muted-foreground">{plan.period}</span>
                )}
              </div>
              <Separator className="mb-6" />
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-3 text-sm"
                  >
                    <HugeiconsIcon
                      icon={CheckmarkCircle02Icon}
                      className="h-5 w-5 shrink-0 text-primary"
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {isUpgrade && isFreePlan && (
                <Button
                  className="w-full"
                  onClick={() => handleSubscribe(plan.tier as PlanTier)}
                  disabled={loading !== null}
                >
                  {loading === plan.tier
                    ? "Redirecting..."
                    : `Upgrade to ${plan.name}`}
                </Button>
              )}
              {isUpgrade && !isFreePlan && (
                <Button
                  className="w-full"
                  onClick={handleChangePlan}
                  disabled={loading !== null}
                >
                  {loading === "portal"
                    ? "Opening..."
                    : `Upgrade to ${plan.name}`}
                </Button>
              )}
              {isCurrentPlan && (
                <Button className="w-full" disabled>
                  Current Plan
                </Button>
              )}
              {isDowngrade && (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={handleChangePlan}
                  disabled={loading !== null}
                >
                  {loading === "portal"
                    ? "Opening..."
                    : `Switch to ${plan.name}`}
                </Button>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}

// ── Billing History ──────────────────────────────────────────────────

function BillingHistory({
  payments,
}: {
  payments: Array<{
    _id: string;
    displayName: string;
    plan: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: number;
  }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing History</CardTitle>
        <CardDescription>
          {payments.length} transaction{payments.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment._id}>
                <TableCell>
                  <PlanBadge plan={payment.plan} />
                </TableCell>
                <TableCell>
                  {payment.currency.toUpperCase()}{" "}
                  {(payment.amount / 100).toFixed(2)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(payment.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <StatusBadge status={payment.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
