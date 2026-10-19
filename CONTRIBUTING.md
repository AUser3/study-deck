# Contributing to Studydeck

Thank you for helping improve Studydeck. Keep changes focused, explain the behavior they change, and
leave the repository easier to understand than you found it.

## Development setup

Studydeck requires Node.js 22.12 or newer and npm.

```sh
npm install
npm run dev
```

After the command starts, use the URL printed by Vite. Port `5173` is configured, but the reachable
hostname depends on whether Vite is running natively, in WSL, or in another container. The
development configuration listens on all interfaces so a host browser can reach a WSL or container
process.

## Design principles

- Prefer low coupling and high cohesion. Each module should own one closely related responsibility
  and expose a small, explicit API.
- Apply SOLID pragmatically: keep responsibilities focused, preserve public contracts, prefer small
  consumer-specific interfaces, and depend on stable boundaries instead of implementation details.
- Apply YAGNI. Do not add abstractions, dependencies, configuration, or UI primitives for
  hypothetical future requirements.
- Extract shared code when it represents the same concept in multiple places. Similar-looking code
  is not automatically the same responsibility.
- Prefer composition and plain functions over inheritance. Keep side effects explicit and isolate
  them at application boundaries.
- Split code because it has independent reasons to change, not because it crossed an arbitrary line
  count. Avoid both god modules and meaningless one-use wrappers.

## Architecture boundaries

Dependencies flow in one direction:

```text
routes -> pages -> features/components -> lib
```

- `src/routes/` contains TanStack route definitions, parameter and search parsing, metadata, and
  page rendering.
- `src/pages/` contains complete screens.
- `src/features/` contains reusable domain UI and feature rules.
- `src/components/` contains shared application components and generic UI primitives.
- `src/lib/data/store.ts` is the only application-data API imported by UI code.
- `src/lib/data/client/` owns focused browser-side state and mutation operations behind the store.
- `src/lib/data/app-data.functions.ts` is the browser/server boundary.
- `src/lib/data/*.server.ts` owns filesystem and operating-system integration.
- `src/lib/data/progress.ts` owns progress calculations.

Do not import upward across these layers or bypass a public boundary for convenience. Validate JSON
at the data boundary, preserve atomic writes, and keep stored data backward-compatible unless the
change includes a deliberate migration.

## Study-data rules

- A question has either no choices for typed-answer study or no more than 16 non-empty choices.
- Choice questions can have multiple correct answers and require at least one correct index.
- Topics belong to courses, questions belong to a course and one of its topics, and attempts refer
  to existing questions.
- Deleting a parent removes its dependent questions and attempts.
- IDs and creation timestamps are stable persisted values and must not be regenerated during reads
  or ordinary edits.
- Text paste, JSON import, and manual entry all normalize into the same persisted question model.

## Mock and test data

Mocks and fixtures are encouraged when they make automated tests clear and deterministic. Keep them
under `tests/` and commit them with the behavior they verify.

For manual development, create any courses and questions you need through the app. They are stored
in the operating system's application-data directory outside the repository and must not be copied
into a pull request. Runtime code must not automatically seed demo content or depend on test
fixtures. An opt-in sample-data feature would require an explicit product decision.

Never commit personal study data.

## Tests and verification

Tests live under the root `tests/` directory and should verify observable behavior rather than
private implementation details. Bug fixes and changes to validation, persistence, imports,
progress, or routing should include a regression test when practical.

Run before submitting a change:

```sh
npm test
npm run lint
npx tsc --noEmit
```

Also run the production build after changing routes, server functions, persistence boundaries,
dependencies, or build configuration:

```sh
npm run build
```

The build regenerates `src/routeTree.gen.ts` and creates the ignored `.output/` directory. Do not
edit the route tree by hand or commit `.output/`.

For UI changes, manually test the affected flow at the relevant viewport and report what was
actually checked. Do not describe visual testing as completed when it was not performed.

## Pull-request checklist

- Keep the change focused and preserve unrelated work.
- Explain what changed, why it changed, and any compatibility impact.
- Add or update tests for changed behavior.
- Confirm tests, lint, and TypeScript pass; include the production build when required.
- Keep runtime demo data, personal data, generated `.output/`, and unrelated formatting out of the
  change.
- Update documentation when setup, architecture, storage, commands, or contributor workflow
  changes.
