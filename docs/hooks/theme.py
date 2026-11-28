"""Restores the site theme that mkdocs-techdocs-core resets.

mkdocs-techdocs-core sets the theme palette to {} and appends its own
features after reading mkdocs.yml. MkDocs runs hooks after plugins, so this
hook puts the palette and features back. A hook is a plain file in the
repository, so it needs no install: mkdocs serve, the GitHub Pages build, and
Backstage TechDocs all run it. The colours come from
docs/stylesheets/extra.css, kept identical to the Homebrew Tap site.
"""

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



def on_config(config):
    theme = config["theme"]
    if theme["name"] == "material":
        theme["palette"] = PALETTE
        theme["features"] = FEATURES
    return config
