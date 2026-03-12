import type { Metadata } from "next";
import { Navbar } from "@/components/navigation/navbar";

const APP_NAME = "Ship Superfast";
const CONTACT_EMAIL = "rajbreno1@gmail.com";
const LAST_UPDATED = "March 12, 2026";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />

      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-4xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: {LAST_UPDATED}
        </p>

        <div className="mt-10 space-y-8 text-base leading-relaxed text-foreground/80">
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              1. Information We Collect
            </h2>
            <p className="mt-2">
              When you use {APP_NAME}, we may collect the following information:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>
                <span className="font-medium text-foreground">
                  Account information:
                </span>{" "}
                Name, email address, and profile picture provided through Google
                OAuth or magic link sign-in
              </li>
              <li>
                <span className="font-medium text-foreground">Usage data:</span>{" "}
                Pages visited, features used, and interactions with the Service
              </li>
              <li>
                <span className="font-medium text-foreground">Device data:</span>{" "}
                Device type, operating system, browser type, and push notification
                tokens
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Payment information:
                </span>{" "}
                Billing details processed securely through our third-party payment
                provider (we do not store card details)
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              2. How We Use Your Information
            </h2>
            <p className="mt-2">We use collected information to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Provide, maintain, and improve the Service</li>
              <li>Authenticate your identity and manage your account</li>
              <li>Process payments and manage subscriptions</li>
              <li>
                Send transactional emails (e.g., team invites, billing
                notifications)
              </li>
              <li>Deliver push notifications you have opted into</li>
              <li>Respond to support requests</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              3. Data Storage & Security
            </h2>
            <p className="mt-2">
              Your data is stored securely using Convex as our backend provider.
              Files are stored on Cloudflare R2 with signed URL access. We
              implement appropriate technical and organizational measures to
              protect your personal data against unauthorized access, alteration,
              or destruction.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              4. Third-Party Services
            </h2>
            <p className="mt-2">
              We use the following third-party services that may process your data:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>
                <span className="font-medium text-foreground">Convex</span> —
                Backend and database
              </li>
              <li>
                <span className="font-medium text-foreground">Cloudflare R2</span>{" "}
                — File storage
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Dodo Payments
                </span>{" "}
                — Payment processing
              </li>
              <li>
                <span className="font-medium text-foreground">Resend</span> —
                Email delivery
              </li>
              <li>
                <span className="font-medium text-foreground">Google</span> —
                OAuth authentication
              </li>
              <li>
                <span className="font-medium text-foreground">Expo</span> — Push
                notifications
              </li>
            </ul>
            <p className="mt-2">
              Each third-party service has its own privacy policy governing the use
              of your data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              5. Cookies & Local Storage
            </h2>
            <p className="mt-2">
              We use cookies and local storage for authentication tokens, theme
              preferences, and session management. These are essential for the
              Service to function and cannot be opted out of while using the
              Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              6. Data Sharing
            </h2>
            <p className="mt-2">
              We do not sell your personal information. We may share data only in
              the following circumstances:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>With your consent</li>
              <li>
                With team members within your organization as part of the
                Service&apos;s team features
              </li>
              <li>
                With third-party service providers necessary to operate the Service
              </li>
              <li>When required by law or to protect our legal rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              7. Your Rights
            </h2>
            <p className="mt-2">You have the right to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and associated data</li>
              <li>Withdraw consent for optional data processing</li>
              <li>Export your data in a portable format</li>
            </ul>
            <p className="mt-2">
              To exercise these rights, contact us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              8. Data Retention
            </h2>
            <p className="mt-2">
              We retain your data for as long as your account is active or as
              needed to provide the Service. If you delete your account, we will
              delete your personal data within 30 days, except where retention is
              required by law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              9. Children&apos;s Privacy
            </h2>
            <p className="mt-2">
              The Service is not intended for children under 13 years of age. We
              do not knowingly collect personal information from children under 13.
              If you become aware that a child has provided us with personal data,
              please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              10. Changes to This Policy
            </h2>
            <p className="mt-2">
              We may update this Privacy Policy from time to time. We will notify
              you of significant changes by posting the updated policy on this
              page. Continued use of the Service after changes constitutes
              acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              11. Contact
            </h2>
            <p className="mt-2">
              If you have any questions about this Privacy Policy, please contact
              us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
