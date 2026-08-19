# temp-screenshots

Review-only images, referenced from PR bodies by commit-SHA-pinned URLs.

Deliberately top-level and outside every path the app ships: `kirocrew app install`
copies `ui/`, `backend/` and `app.json`, so nothing here can ride into an installed
app. Safe to prune once a PR is merged — the SHA-pinned URLs in the PR body keep
resolving against the historical commit after the files are gone from `main`.

One subdirectory per feature, e.g. `store-art/`.
