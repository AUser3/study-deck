# Versioning

Studydeck uses semantic versioning in the root `VERSION` file:

`MAJOR.MINOR.PATCH`

The initial version is `0.1.0`. Pull requests targeting `main` must carry exactly one version label:

- `patch`: bug fixes, documentation, refactors, configuration, and other compatible changes.
- `minor`: new backwards-compatible functionality.
- `major`: breaking or incompatible changes.

A post-merge workflow reads the label, updates `VERSION`, commits the bump, and creates an annotated `vX.Y.Z` tag. It is idempotent if a workflow is retried.

The workflow authenticates through a narrowly scoped GitHub App using the repository secrets `VERSION_BOT_APP_ID` and `VERSION_BOT_APP_PRIVATE_KEY`. The App needs Contents read/write and Pull requests read-only access, and must be added to the main-branch ruleset bypass list if that ruleset requires pull requests for every change.

The version-label check and version bump scripts are release tooling only; they do not add a Python runtime dependency to Studydeck.
