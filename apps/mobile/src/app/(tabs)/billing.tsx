import { useState } from "react";
import { View, Text, ScrollView, Alert, Linking } from "react-native";
import {
  Button,
  Card,
  Chip,
  Separator,
  Spinner,
  useThemeColor,
} from "heroui-native";
import { useQuery, useAction } from "convex/react";
import { api } from "../../../../../packages/convex/convex/_generated/api";
import type { Id } from "../../../../../packages/convex/convex/_generated/dataModel";
import type { PlanTier } from "@repo/shared";
import { useSession } from "../../providers/SessionProvider";
import { useActiveTeam } from "../../hooks/useActiveTeam";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  CheckmarkCircle02Icon,
  InformationCircleIcon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

// ── Plan UI config ───────────────────────────────────────────────────

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

const PLAN_ORDER: Record<string, number> = { free: 0, pro: 1, max: 2 };

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    color: "success" | "default" | "danger" | "warning";
    variant: "soft" | "primary" | "tertiary";
  }
> = {
  active: { label: "Active", color: "success", variant: "tertiary" },
  renewed: { label: "Renewed", color: "success", variant: "tertiary" },
  succeeded: { label: "Succeeded", color: "success", variant: "tertiary" },
  on_hold: { label: "On Hold", color: "warning", variant: "tertiary" },
  processing: { label: "Processing", color: "warning", variant: "tertiary" },
  refunded: { label: "Refunded", color: "default", variant: "tertiary" },
  cancelled: { label: "Cancelled", color: "danger", variant: "tertiary" },
  expired: { label: "Expired", color: "danger", variant: "tertiary" },
  failed: { label: "Failed", color: "danger", variant: "tertiary" },
};

// ── Main Screen ──────────────────────────────────────────────────────

export default function BillingScreen() {
  const { isSignedIn, isLoading } = useSession();
  const mutedColor = useThemeColor("muted");
  const { activeTeam } = useActiveTeam();

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

  if (isLoading || !isSignedIn) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Spinner size="lg" />
      </View>
    );
  }

  if (!activeTeam) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-8">
        <Text className="mb-2 text-xl font-semibold text-foreground">
          No Team
        </Text>
        <Text className="text-center text-sm text-default-500">
          Create or join a team to manage billing.
        </Text>
      </View>
    );
  }

  const currentPlan = billingSummary?.plan ?? activeTeam.plan ?? "free";

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="pb-8"
      showsVerticalScrollIndicator={false}
    >
      <Animated.View
        entering={FadeInDown.duration(500).delay(100)}
        className="gap-5 px-6 pt-6"
      >
        {/* Billing summary */}
        <BillingSummary
          teamName={activeTeam.name}
          plan={currentPlan}
          totalMembers={billingSummary?.totalMembers}
          isOwnerOrAdmin={isOwnerOrAdmin}
          hasBillingHistory={!!hasBillingHistory}
          teamId={activeTeam._id}
        />

        {/* Non-owner notice */}
        {!isOwnerOrAdmin && (
          <Card>
            <Card.Body>
              <View className="flex-row items-start gap-3">
                <HugeiconsIcon
                  icon={InformationCircleIcon}
                  size={22}
                  color={mutedColor}
                />
                <View className="flex-1 gap-1">
                  <Text className="text-sm font-medium text-foreground">
                    Team plan:{" "}
                    <Text className="capitalize">{currentPlan}</Text>
                  </Text>
                  <Text className="text-sm text-default-500">
                    Plan upgrades are managed by your team owner or admin.
                  </Text>
                </View>
              </View>
            </Card.Body>
          </Card>
        )}

        {/* Plan cards */}
        {isOwnerOrAdmin && plans.length > 0 && (
          <PlansSection
            plans={plans}
            currentPlan={currentPlan}
            teamId={activeTeam._id}
          />
        )}

        {/* Billing history */}
        {hasBillingHistory && (
          <Animated.View entering={FadeInUp.duration(400).delay(200)}>
            <BillingHistory payments={paymentHistory ?? []} />
          </Animated.View>
        )}
      </Animated.View>
    </ScrollView>
  );
}

// ── Billing Summary ──────────────────────────────────────────────────

function BillingSummary({
  teamName,
  plan,
  totalMembers,
  isOwnerOrAdmin,
  hasBillingHistory,
  teamId,
}: {
  teamName: string;
  plan: string;
  totalMembers?: number;
  isOwnerOrAdmin: boolean;
  hasBillingHistory: boolean;
  teamId: Id<"teams">;
}) {
  return (
    <Card>
      <Card.Body>
        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 gap-1">
              <Text className="text-xs text-default-500">Team</Text>
              <Text className="text-lg font-medium text-foreground">
                {teamName}
              </Text>
            </View>
            <PlanChip plan={plan} />
          </View>
          {totalMembers !== undefined && (
            <Text className="text-sm text-default-500">
              {totalMembers} member{totalMembers !== 1 ? "s" : ""}
            </Text>
          )}
          {isOwnerOrAdmin && hasBillingHistory && (
            <View className="pt-1">
              <ManageBillingButton teamId={teamId} />
            </View>
          )}
        </View>
      </Card.Body>
    </Card>
  );
}

// ── Manage Billing Button ────────────────────────────────────────────

function ManageBillingButton({ teamId }: { teamId: Id<"teams"> }) {
  const getPortal = useAction(api.payments.getCustomerPortal);
  const mutedColor = useThemeColor("muted");
  const [loading, setLoading] = useState(false);

  async function handleManageBilling() {
    setLoading(true);
    try {
      const result = await getPortal({ send_email: false, teamId });
      if (result?.portal_url) {
        await Linking.openURL(result.portal_url);
      } else {
        Alert.alert("Error", "Unable to open billing portal.");
      }
    } catch {
      Alert.alert(
        "Error",
        "Unable to open billing portal. Complete a purchase first.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onPress={handleManageBilling}
      isDisabled={loading}
    >
      <HugeiconsIcon icon={Settings01Icon} size={16} color={mutedColor} />
      <Button.Label>{loading ? "Opening..." : "Manage Billing"}</Button.Label>
    </Button>
  );
}

// ── Plan Chip ────────────────────────────────────────────────────────

function PlanChip({ plan }: { plan: string }) {
  const color = plan === "free" ? "default" : "accent";
  return (
    <Chip size="sm" variant={plan === "free" ? "soft" : "primary"} color={color}>
      <Chip.Label>{plan.charAt(0).toUpperCase() + plan.slice(1)}</Chip.Label>
    </Chip>
  );
}

// ── Status Chip ──────────────────────────────────────────────────────

function StatusChip({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? { label: status, color: "default" as const, variant: "tertiary" as const };
  return (
    <Chip size="sm" variant={config.variant} color={config.color}>
      <Chip.Label>{config.label}</Chip.Label>
    </Chip>
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
  const accentColor = useThemeColor("accent");
  const [loading, setLoading] = useState<string | null>(null);

  const isFreePlan = currentPlan === "free";
  const currentOrder = PLAN_ORDER[currentPlan] ?? 0;

  async function handleSubscribe(targetPlan: PlanTier) {
    const plan = plans.find((p) => p.tier === targetPlan);
    if (!plan) return;

    setLoading(targetPlan);
    try {
      const result = await createCheckout({
        product_cart: [{ product_id: plan.productId, quantity: 1 }],
        teamId,
      });
      if (result?.checkout_url) {
        await Linking.openURL(result.checkout_url);
      } else {
        Alert.alert("Error", "Checkout failed. Please try again.");
      }
    } catch {
      Alert.alert("Error", "Checkout failed. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  async function handleChangePlan() {
    setLoading("portal");
    try {
      const result = await getPortal({ send_email: false, teamId });
      if (result?.portal_url) {
        await Linking.openURL(result.portal_url);
      } else {
        Alert.alert("Error", "Unable to open billing portal.");
      }
    } catch {
      Alert.alert("Error", "Unable to open billing portal.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <View className="gap-5">
      {plans.map((plan) => {
        const planOrder = PLAN_ORDER[plan.tier] ?? 0;
        const isCurrentPlan = plan.tier === currentPlan;
        const isUpgrade = planOrder > currentOrder;
        const isDowngrade = planOrder < currentOrder;

        return (
          <Card key={plan.tier}>
            <Card.Body>
              <View className="gap-4">
                {/* Header */}
                <View className="flex-row items-center justify-between">
                  <View className="gap-1">
                    <Text className="text-xl font-semibold text-foreground">
                      {plan.name}
                    </Text>
                    <Text className="text-sm text-default-500">
                      {plan.description}
                    </Text>
                  </View>
                  {isCurrentPlan && (
                    <Chip size="sm" variant="primary" color="accent">
                      <Chip.Label>Current</Chip.Label>
                    </Chip>
                  )}
                </View>

                {/* Price */}
                <View className="flex-row items-baseline">
                  <Text className="text-3xl font-semibold text-foreground">
                    {plan.priceDisplay}
                  </Text>
                  {plan.period ? (
                    <Text className="text-sm text-default-500">
                      {plan.period}
                    </Text>
                  ) : null}
                </View>

                <Separator />

                {/* Features */}
                <View className="gap-3">
                  {plan.features.map((feature) => (
                    <View
                      key={feature}
                      className="flex-row items-center gap-3"
                    >
                      <HugeiconsIcon
                        icon={CheckmarkCircle02Icon}
                        size={18}
                        color={accentColor}
                      />
                      <Text className="flex-1 text-sm text-foreground">
                        {feature}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Action button */}
                <View className="pt-2">
                  {isUpgrade && isFreePlan && (
                    <Button
                      onPress={() =>
                        handleSubscribe(plan.tier as PlanTier)
                      }
                      isDisabled={loading !== null}
                    >
                      {loading === plan.tier
                        ? "Redirecting..."
                        : `Upgrade to ${plan.name}`}
                    </Button>
                  )}
                  {isUpgrade && !isFreePlan && (
                    <Button
                      onPress={handleChangePlan}
                      isDisabled={loading !== null}
                    >
                      {loading === "portal"
                        ? "Opening..."
                        : `Upgrade to ${plan.name}`}
                    </Button>
                  )}
                  {isCurrentPlan && (
                    <Button isDisabled>Current Plan</Button>
                  )}
                  {isDowngrade && (
                    <Button
                      variant="secondary"
                      onPress={handleChangePlan}
                      isDisabled={loading !== null}
                    >
                      {loading === "portal"
                        ? "Opening..."
                        : `Switch to ${plan.name}`}
                    </Button>
                  )}
                </View>
              </View>
            </Card.Body>
          </Card>
        );
      })}
    </View>
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
    <View className="gap-3">
      <Text className="text-lg font-medium text-foreground">
        Billing History
      </Text>

      {payments.map((payment) => (
        <Card key={payment._id}>
          <Card.Body>
            <View className="flex-row items-center justify-between">
              <View className="gap-2">
                <View className="flex-row items-center gap-2">
                  <PlanChip plan={payment.plan} />
                  <StatusChip status={payment.status} />
                </View>
                <Text className="text-lg font-semibold text-foreground">
                  {payment.currency.toUpperCase()}{" "}
                  {(payment.amount / 100).toFixed(2)}
                </Text>
              </View>
              <Text className="text-xs text-default-500">
                {new Date(payment.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </Card.Body>
        </Card>
      ))}
    </View>
  );
}
