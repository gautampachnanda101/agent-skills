# Syncing data

Back in the early days of the project, the sync subsystem went through
several iterations before arriving at today's architecture, which the
platform team designed after a long series of incidents.

## Overview

The sync interval controls how often local and remote data are compared.

Data syncing compares local state with remote state and reconciles the
differences, which is conceptually similar to how optimistic replication
works in distributed systems. Replicas diverge, exchange version vectors,
and converge once every conflict has a deterministic winner.

## Syncing your data

Simply click the red button on the right to start.

Read more [here](reference.md).
