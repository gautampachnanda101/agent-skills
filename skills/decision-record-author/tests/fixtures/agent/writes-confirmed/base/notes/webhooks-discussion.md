# Payment webhooks: discussion, 2026-11-18

Present: Ana (payments), Ben (platform), Chloe (support).

- The provider launched signed webhooks on 2026-11-01. Each event carries an
  HMAC-SHA256 signature over the body, and events can arrive more than once.
- Polling costs us 1.9 million provider calls a month, and the provider will
  start charging for status calls over 1 million a month from 2027-01-01.
- Support says customers see paid orders as pending for up to 30 seconds.
- Options discussed: keep polling; switch to webhooks; webhooks plus a slow
  hourly poll to catch missed events.
- Agreed: webhooks plus an hourly reconciliation poll. We need a public HTTPS
  endpoint, signature checks, and idempotent handling because events repeat.
- Ben noted the endpoint becomes a new thing to monitor and secure.
