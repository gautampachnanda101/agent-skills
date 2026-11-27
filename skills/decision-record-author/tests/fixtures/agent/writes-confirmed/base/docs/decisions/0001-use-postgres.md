# 0001. Store orders in PostgreSQL

- **Status:** Accepted
- **Date:** 2026-03-02

## Context

Orders need transactions across the order and payment tables.

## Options considered

- PostgreSQL: transactions, the team knows it.
- DynamoDB: no cross-table transactions.

## Decision

Store orders in PostgreSQL 16.

## Consequences

Easier: transactional updates. Harder: we run a database. Revisit if write volume passes 5,000 orders a second.
