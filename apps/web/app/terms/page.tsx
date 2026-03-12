import type { Metadata } from "next";
import { Navbar } from "@/components/navigation/navbar";

const APP_NAME = "Ship Superfast";
const CONTACT_EMAIL = "rajbreno1@gmail.com";
const LAST_UPDATED = "March 12, 2026";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />

      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-4xl font-semibold tracking-tight">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: {LAST_UPDATED}
        </p>

        <div className="mt-10 space-y-8 text-base leading-relaxed text-foreground/80">
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              1. Acceptance of Terms
            </h2>
            <p className="mt-2">
              By accessing or using {APP_NAME} (&quot;the Service&quot;), you
              agree to be bound by these Terms of Service. If you do not agree to
              these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              2. Description of Service
            </h2>
            <p className="mt-2">
              {APP_NAME} is a monorepo starter kit providing web and mobile
              application boilerplate with pre-configured integrations including
              authentication, payments, storage, email, and AI capabilities.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              3. User Accounts
            </h2>
            <p className="mt-2">
              To access certain features, you must create an account. You are
              responsible for maintaining the confidentiality of your account
              credentials and for all activities that occur under your account. You
              agree to notify us immediately of any unauthorized use.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              4. Acceptable Use
            </h2>
            <p className="mt-2">You agree not to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Use the Service for any unlawful purpose</li>
              <li>
                Attempt to gain unauthorized access to any part of the Service
              </li>
              <li>
                Interfere with or disrupt the integrity or performance of the
                Service
              </li>
              <li>Upload malicious code or content</li>
              <li>Resell or redistribute the Service without authorization</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              5. Intellectual Property
            </h2>
            <p className="mt-2">
              {APP_NAME} is released under the MIT License. You may use, copy,
              modify, merge, publish, distribute, sublicense, and/or sell copies of
              the software, subject to the conditions of the MIT License included
              in the repository.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              6. Payments & Subscriptions
            </h2>
            <p className="mt-2">
              Certain features may require a paid subscription. All payments are
              processed through our third-party payment provider. Subscription
              terms, pricing, and refund policies are displayed at the time of
              purchase. You agree to provide accurate billing information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              7. Limitation of Liability
            </h2>
            <p className="mt-2">
              The Service is provided &quot;as is&quot; without warranties of any
              kind, express or implied. In no event shall {APP_NAME} or its
              contributors be liable for any indirect, incidental, special, or
              consequential damages arising out of your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              8. Termination
            </h2>
            <p className="mt-2">
              We reserve the right to suspend or terminate your access to the
              Service at any time, with or without cause, and with or without
              notice. Upon termination, your right to use the Service will
              immediately cease.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              9. Changes to Terms
            </h2>
            <p className="mt-2">
              We may update these Terms of Service from time to time. Continued
              use of the Service after changes constitutes acceptance of the
              revised terms. We encourage you to review this page periodically.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              10. Contact
            </h2>
            <p className="mt-2">
              If you have any questions about these Terms, please contact us at{" "}
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
