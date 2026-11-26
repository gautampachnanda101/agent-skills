# Sync your data

Run one command to copy new and changed files from a source directory to a
target directory. Use it after you change files in the source directory.

## Before you start

You need:

- the `syncctl` command installed; `syncctl --version` prints its version
- a `sync.yaml` file in the working directory, with the settings in
  [Sync settings](sync-settings.md)

## Run the sync

1. Start the sync with your settings file:

   ```sh
   syncctl --config sync.yaml
   ```

   The command prints `sync complete` and exits 0.

2. Check the result. If the command printed `sync failed: cannot read <path>`
   and exited 1, correct the `source` or `target` path in `sync.yaml`, then
   run the command again.

You can run the command again safely. It copies only files that are new or
changed since the last run.
