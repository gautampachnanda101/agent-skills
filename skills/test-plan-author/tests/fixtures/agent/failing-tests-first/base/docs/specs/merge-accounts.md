# Merge duplicate customer accounts

## Problem

Support agents cannot merge duplicate accounts, so customers see orders split
across two logins.

## Scope

Merge one newer account into one older account.

## Non-goals

- Bulk merges.

## Requirements

- R-1: Only users with the support-lead role can merge.
- R-2: A merge moves orders, addresses, and notes to the older account, and
  closes the newer account with a pointer to the older one.
- R-3: Accounts with an open dispute cannot be merged.
- R-4: A merge can be undone within 30 days.

## Acceptance criteria

- AC-1 (R-1): Given a support agent without the support-lead role, when they
  merge two accounts, then the merge is refused with 403.
- AC-2 (R-2): Given two accounts with orders, when a support lead merges
  them, then every order belongs to the older account and the newer one is
  closed with a pointer to it.
- AC-3 (R-3): Given an account with an open dispute, when a support lead
  merges it, then the merge is refused and nothing moves.
- AC-4 (R-4): Given a merge made 30 days ago, when it is undone, then both
  accounts are restored; given one made 31 days ago, then the undo is
  refused.
