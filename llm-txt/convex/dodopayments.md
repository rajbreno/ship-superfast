# @dodopayments/convex

Dodo Payments is your complete solution for billing and payments, purpose-built for AI and SaaS applications.

## Install

```bash
npm install @dodopayments/convex
```

## Links

- [npm package](https://www.npmjs.com/package/%40dodopayments%2Fconvex)
- [GitHub repository](https://github.com/dodopayments/dodo-adapters/blob/main/packages/convex/README.md)
- [Convex Components Directory](https://www.convex.dev/components/dodopayments)

**Author:** dodopayments

**Category:** Payments

**Version:** 0.2.8  
**Weekly downloads:** 355

---

> Integrate billing and payment processing directly into Convex applications with purpose-built functions for AI and SaaS monetization.

## Benefits

- Implement subscription billing and usage-based pricing with native Convex functions
- Process payments without leaving your Convex backend architecture
- Handle complex AI application billing scenarios like token consumption tracking
- Reduce payment integration complexity with pre-built Convex mutations and queries

## Use cases

### how to add subscription billing to Convex app

Dodo Payments provides Convex-native functions for creating and managing subscriptions. You can call subscription creation mutations directly from your Convex backend and handle billing events through dedicated webhook handlers.

### track usage-based pricing in Convex database

The component includes mutations for recording usage events and calculating billing amounts based on consumption. It integrates with Convex's real-time database to track AI API calls, token usage, or other metered resources automatically.

### process payments in Convex backend

Dodo Payments exposes payment processing through Convex actions that handle card charges, payment methods, and transaction status updates. All payment data syncs directly to your Convex database without external API calls from your frontend.

### handle webhook events for payments in Convex

The package includes pre-built HTTP actions for processing payment webhooks like subscription renewals and failed charges. These actions automatically update your Convex database and trigger any necessary business logic through mutations.

## FAQ

**Q: Does Dodo Payments work with Convex's real-time features?**

Yes, Dodo Payments integrates fully with Convex's reactive queries and subscriptions. Payment status changes, subscription updates, and billing events automatically trigger real-time updates to your application UI through Convex's built-in reactivity.

**Q: Can I customize the billing logic for AI applications?**

Dodo Payments provides flexible usage tracking functions that you can customize for AI-specific billing patterns. You can track token consumption, API calls, model usage, or any custom metrics through configurable Convex mutations and automatic aggregation.

**Q: How does this handle PCI compliance for payment processing?**

Dodo Payments handles PCI compliance by processing sensitive payment data on secure servers while exposing only safe operations through Convex actions. Your Convex database stores transaction metadata and billing information without touching raw payment card data.

**Q: What payment methods does the Convex integration support?**

The Dodo Payments Convex package supports credit cards, ACH transfers, and digital wallet payments. All payment method management happens through Convex actions that return payment status and customer information to your database.

---

This component is the official way to integrate the Dodo Payments in your Convex project.

Features:

Checkout Session: Integrate Dodo Payments Checkout with a couple of lines code.

Customer Portal: Allow customers to manage subscriptions and details

Webhooks: Handle webhooks efficiently. Just write your business logic and handle the events you want. Webhook verification is taken care by us

Detailed documentation can be found at [Dodo Payments Convex Component](https://docs.dodopayments.com/developer-resources/convex-component)

## Resources

- [npm package](https://www.npmjs.com/package/%40dodopayments%2Fconvex)
- [GitHub repository](https://github.com/dodopayments/dodo-adapters/blob/main/packages/convex/README.md)
- [Convex Components Directory](https://www.convex.dev/components/dodopayments)
- [Convex documentation](https://docs.convex.dev)
- [npm Package](https://www.npmjs.com/package/@dodopayments/convex)


---

[![Convex Component](https://www.convex.dev/components/badge/dodopayments)](https://www.convex.dev/components/dodopayments)