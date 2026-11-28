"""Restores the Material palette that mkdocs-techdocs-core resets.

mkdocs-techdocs-core sets ``config["theme"]["palette"] = {}`` unconditionally
(see ``techdocs_core/core.py``), dropping any palette declared in mkdocs.yml.
This plugin must be listed after ``techdocs-core`` so its ``on_config`` runs
after the reset. The palette is defined here rather than in mkdocs.yml so both
sources stay in one place and cannot drift.
"""

from mkdocs.plugins import BasePlugin

PALETTE = [
    # The same palette as https://gautampachnanda101.github.io/homebrew-tap/;
    # docs/stylesheets/extra.css sets the colours for both schemes.
    {
        "media": "(prefers-color-scheme: light)",
        "scheme": "default",
        "toggle": {"icon": "fontawesome/solid/sun", "name": "Switch to dark mode"},
    },
    {
        "media": "(prefers-color-scheme: dark)",
        "scheme": "slate",
        "toggle": {"icon": "fontawesome/solid/moon", "name": "Switch to light mode"},
    },
]

# Same feature set as https://gautampachnanda101.github.io/homebrew-tap/:
# mkdocs-techdocs-core unconditionally appends navigation.footer and
# content.action.edit after reading mkdocs.yml, so they are removed here
# rather than in mkdocs.yml.
FEATURES = [
    "navigation.tabs",
    "navigation.sections",
    "navigation.top",
    "search.suggest",
    "search.highlight",
    "content.code.copy",
]


class PaletteRestorePlugin(BasePlugin):
    def on_config(self, config):
        theme = config["theme"]
        if theme["name"] == "material":
            theme["palette"] = PALETTE
            theme["features"] = FEATURES
        return config
