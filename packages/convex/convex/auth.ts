import Google from "@auth/core/providers/google";
import Resend from "@auth/core/providers/resend";
import { convexAuth } from "@convex-dev/auth/server";
import { emailLayout } from "./email";

// Base URL for resolving relative redirects — update for production
const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

// Allowed redirect origins — add your production domain here
const ALLOWED_REDIRECT_PREFIXES = [
  "exp://",           // Expo dev client
  "myapp://",         // Update to match your app scheme in app.json
  "http://localhost",  // Local development
  "https://ship.rajbreno.com", // Production custom domain
];

function magicLinkEmail(url: string) {
  return emailLayout(
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3f3f46;">
      Click the button below to sign in. This link expires in 24 hours.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr>
        <td style="background:#18181b;border-radius:8px;">
          <a href="${url}" target="_blank" style="display:inline-block;padding:12px 32px;font-size:14px;font-weight:500;color:#fff;text-decoration:none;">Sign in</a>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:12px;color:#a1a1aa;">If you didn't request this, ignore this email.</p>`,
  );
}

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Google,
    Resend({
      from: process.env.AUTH_RESEND_FROM ?? "onboarding@resend.dev",
      async sendVerificationRequest({ identifier: email, url, provider }) {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.AUTH_RESEND_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: provider.from,
            to: email,
            subject: "Sign in to Convex Kit",
            html: magicLinkEmail(url),
            text: `Sign in to Convex Kit: ${url}`,
          }),
        });
        if (!res.ok) {
          throw new Error(`Resend error: ${await res.text()}`);
        }
      },
    }),
  ],
  callbacks: {
    async redirect({ redirectTo }) {
      // Resolve relative paths to absolute URLs (the library needs a full URL)
      if (redirectTo && redirectTo.startsWith("/")) {
        return `${SITE_URL}${redirectTo}`;
      }
      if (
        redirectTo &&
        ALLOWED_REDIRECT_PREFIXES.some((prefix) =>
          redirectTo.startsWith(prefix),
        )
      ) {
        return redirectTo;
      }
      throw new Error(`Invalid redirectTo URI: ${redirectTo}`);
    },
  },
});
