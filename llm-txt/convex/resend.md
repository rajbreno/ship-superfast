# @convex-dev/resend

This component is the official way to integrate the Resend email service with your Convex project.

## Install

```bash
npm install @convex-dev/resend
```

## Links

- [npm package](https://www.npmjs.com/package/%40convex-dev%2Fresend)
- [GitHub repository](https://github.com/get-convex/resend)
- [Convex Components Directory](https://www.convex.dev/components/resend)
- [Live demo](https://github.com/get-convex/resend-demo?utm_source=yt-convex&utm_medium=video&dub_id=poiVYSbvnlsKYHLg)

**Author:** get-convex

**Category:** Integrations

**Version:** 0.2.3  
**Weekly downloads:** 33,353

**Tags:** email, resend, inbox

---

> Official Convex integration for Resend email service with queuing, batching, rate limiting, and guaranteed delivery via durable execution.

## Benefits

- Send unlimited emails without blocking your application using automatic queuing and batching
- Guarantee exactly-once delivery with built-in idempotency key management and retry logic
- Eliminate email failures from rate limits and network issues with durable Convex workpools
- Scale email sending automatically with Resend's batch API integration for high-volume use cases

## Use cases

### how to send transactional emails from Convex functions

The @convex-dev/resend component integrates directly with your Convex mutations and actions to send transactional emails like order confirmations or password resets. It handles queuing and delivery guarantees so your application logic stays fast and reliable.

### bulk email sending with rate limiting in Convex

This component automatically batches large email volumes and respects Resend's API rate limits. You can trigger thousands of emails from a single Convex function without worrying about API throttling or failed deliveries.

### reliable email delivery with retry logic Convex

Using Convex workpools for durable execution, the component automatically retries failed email sends due to network issues or temporary API outages. Idempotency keys prevent duplicate emails during retries, ensuring exactly-once delivery.

## FAQ

**Q: How does the Convex Resend component handle API rate limits?**

The @convex-dev/resend component automatically respects Resend's API rate limits by queuing emails and controlling send rates. It uses Convex's durable execution to retry sends that are throttled, ensuring all emails are eventually delivered without hitting rate limit errors.

**Q: Can I send batch emails without blocking my Convex functions?**

Yes, the Convex Resend component queues all email sends asynchronously using Convex workpools. Your mutations and actions return immediately while emails are processed in the background. Large batches are automatically sent to Resend's batch endpoint for efficiency.

**Q: What happens if Resend is temporarily down when I send emails?**

The @convex-dev/resend component uses Convex's durable execution to automatically retry failed sends due to network outages or API downtime. Emails remain queued and will be delivered once the service recovers, with idempotency keys preventing duplicates.

**Q: How do I prevent duplicate emails when using retries?**

The Convex Resend component automatically manages Resend idempotency keys for every email send. This guarantees exactly-once delivery even when retries occur due to network failures or temporary API issues, preventing accidental spam to your users.

---


This component is the official way to integrate the Resend email service with your Convex project.

Features:

Queueing: Send as many emails as you want, as fast as you want—they'll all be delivered (eventually).
Batching: Automatically batches large groups of emails and sends them to Resend's /emails/batch endpoint efficiently.
Durable execution: Uses Convex workpools to ensure emails are eventually delivered, even in the face of temporary failures or network outages.
Idempotency: Manages Resend idempotency keys to guarantee emails are delivered exactly once, preventing accidental spamming from retries.
Rate limiting: Honors API rate limits established by Resend.

## Resources

- [npm package](https://www.npmjs.com/package/%40convex-dev%2Fresend)
- [GitHub repository](https://github.com/get-convex/resend)
- [Live demo](https://github.com/get-convex/resend-demo?utm_source=yt-convex&utm_medium=video&dub_id=poiVYSbvnlsKYHLg)
- [Convex Components Directory](https://www.convex.dev/components/resend)
- [Convex documentation](https://docs.convex.dev)


---

[![Convex Component](https://www.convex.dev/components/badge/resend)](https://www.convex.dev/components/resend)