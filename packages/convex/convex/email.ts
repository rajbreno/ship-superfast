import { Resend } from "@convex-dev/resend";
import { components } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { APP_NAME } from "./lib/constants";

export const resend = new Resend(components.resend, { testMode: false });

// ── Email templates ──────────────────────────────────────────────────

function getLogoUrl(): string {
  return "https://ship.rajbreno.com/logos/brand-logo.png";
}

function formatAmount(amount: number, currency: string): string {
  const dollars = (amount / 100).toFixed(2);
  return `${dollars} ${currency.toUpperCase()}`;
}

/** Plain email wrapper — hosted logo + message + footer. Minimal HTML to avoid spam filters. */
export function emailLayout(body: string): string {
  const logoUrl = getLogoUrl();
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
  <tr><td align="center">
    <table width="480" cellpadding="0" cellspacing="0">
      <tr><td style="padding-bottom:24px;">
        <img src="${logoUrl}" alt="${APP_NAME}" width="32" height="32" style="display:block;" />
      </td></tr>
      <tr><td style="font-size:15px;line-height:1.6;color:#18181b;">${body}</td></tr>
      <tr><td style="padding-top:32px;font-size:12px;color:#a1a1aa;">
        ${APP_NAME}
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

export function paymentSuccessEmailTemplate(
  productName: string,
  amount: number,
  currency: string,
): string {
  return emailLayout(
    `<p style="margin:0 0 8px;">Payment confirmed</p>
<p style="margin:0;color:#3f3f46;">Your payment of <strong>${formatAmount(amount, currency)}</strong> for <strong>${productName}</strong> was successful.</p>`,
  );
}

export function refundSuccessEmailTemplate(
  amount: number,
  currency: string,
): string {
  return emailLayout(
    `<p style="margin:0 0 8px;">Refund processed</p>
<p style="margin:0;color:#3f3f46;">Your refund of <strong>${formatAmount(amount, currency)}</strong> has been processed. It may take a few business days to appear on your statement.</p>`,
  );
}

// ── Send email mutation ─────────────────────────────────────────────

export const sendEmail = internalMutation({
  args: {
    from: v.string(),
    to: v.string(),
    subject: v.string(),
    html: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await resend.sendEmail(ctx, {
      from: args.from,
      to: args.to,
      subject: args.subject,
      html: args.html,
    });
    return null;
  },
});
