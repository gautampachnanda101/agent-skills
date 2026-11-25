# Sync your data

The sync command brings your local data up to date in one step.
Run it after changing any file that feeds the sync engine.

## Sync your data

Run the sync command with your config file:

```sh
sync --config sync.yaml
```

You need a valid `sync.yaml` in the working directory. The command prints
`sync complete` and exits 0 when it succeeds. If a file cannot be read, the
command prints `sync failed: <reason>` and exits 1; check the path in
`sync.yaml` first.

Sync only changes files newer than the last run, so repeated runs are safe.

For the full setting list, see [the fixture README](README.md). For the
design background of the compare-and-merge approach, read the separate
design note instead — this page keeps it out on purpose.
