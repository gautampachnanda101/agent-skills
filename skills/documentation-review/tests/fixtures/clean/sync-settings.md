# Sync settings

Look up the settings that `sync.yaml` accepts. To run a sync, see
[Sync your data](sync-data.md).

| Setting | Type | Default | Required | What it sets |
| --- | --- | --- | --- | --- |
| `source` | Path, relative to `sync.yaml` | None | Yes | Directory to copy files from |
| `target` | Path, relative to `sync.yaml` | None | Yes | Directory to copy files to |
| `log_level` | `error`, `info`, or `debug` | `info` | No | How much the command prints |

This example sets every setting:

```yaml
source: ./data
target: ./backup
log_level: debug
```
