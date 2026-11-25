"""Restores the Material palette that mkdocs-techdocs-core resets.

mkdocs-techdocs-core sets ``config["theme"]["palette"] = {}`` unconditionally
(see ``techdocs_core/core.py``), dropping any palette declared in mkdocs.yml.
This plugin must be listed after ``techdocs-core`` so its ``on_config`` runs
after the reset. The palette is defined here rather than in mkdocs.yml so both
sources stay in one place and cannot drift.
"""

from mkdocs.plugins import BasePlugin

PALETTE = [
    {
        "media": "(prefers-color-scheme: light)",
        "scheme": "default",
        "primary": "indigo",
        "accent": "indigo",
        "toggle": {
            "icon": "material/brightness-7",
            "name": "Switch to dark mode",
        },
    },
    {
        "media": "(prefers-color-scheme: dark)",
        "scheme": "slate",
        "primary": "indigo",
        "accent": "indigo",
        "toggle": {
            "icon": "material/brightness-4",
            "name": "Switch to light mode",
        },
    },
]


class PaletteRestorePlugin(BasePlugin[object]):
    def on_config(self, config):
        theme = config["theme"]
        if theme["name"] == "material":
            theme["palette"] = PALETTE
        return config
