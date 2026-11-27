# 0002. Poll the payment provider for status

- **Status:** Accepted
- **Date:** 2026-04-11

## Context

The payment provider offered no webhooks in April 2026.

## Options considered

- Poll every 30 seconds.
- Ask customers to refresh.

## Decision

Poll the provider's status endpoint every 30 seconds for open orders.

## Consequences

Easier: no public endpoint. Harder: up to 30 seconds of delay, and 2,880 calls a day per open order. Revisit when the provider offers webhooks.
