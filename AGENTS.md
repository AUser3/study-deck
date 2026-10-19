# AGENTS.md

Studydeck is a local-first TanStack Start application. Read [README.md](README.md) for setup and
architecture, and [CONTRIBUTING.md](CONTRIBUTING.md) for engineering and testing conventions. These
are the repository-specific rules agents must not break:

- Use npm and `package-lock.json`; do not add Bun, pnpm, or Yarn configuration.
- Keep coupling low and cohesion high. Follow `routes -> pages -> features/components -> lib`, and
  do not add speculative abstractions or dependencies.
- UI data access goes only through `src/lib/data/store.ts`. Routes, pages, features, and components
  never import data client internals, server modules, or `app-data.functions.ts` directly.
- Filesystem access stays in `src/lib/data/*.server.ts`; the browser/server boundary stays in
  `src/lib/data/app-data.functions.ts`. Preserve serialized, atomic writes. Managed old-exam PDFs
  stay under AppData and must be validated for safe paths, PDF content, and the 20 MiB limit.
- Progress calculations live only in `src/lib/data/progress.ts`; persisted domain types live in
  `src/lib/data/types.ts`; JSON validation and serialization stay in the data layer.
- Keep route files thin, complete screens in `src/pages/`, reusable domain UI in `src/features/`,
  and generic UI in `src/components/`.
- Questions allow zero choices for typed answers or at most 16 choices with one or more correct
  indices. Preserve course relationships for topics, questions, notes, and old exams; deletion
  cascades must also remove dependent attempts and managed documents.
- Persisted schema changes require backward-compatible migrations and regression tests. Portable
  backups must contain every referenced managed document and restore through the same validation
  boundary as normal writes.
- Test fixtures and mocks are allowed under `tests/`. Manual development data belongs in the
  external application-data directory. Never commit runtime demo, seed, or personal study data.
- Keep all tests under root `tests/`. Before completion run `npm test`, `npm run lint`, and
  `npx tsc --noEmit`; also run `npm run build` after route, server, persistence, dependency, or build
  changes.
- Never hand-edit `src/routeTree.gen.ts` or commit `.output/`. Remove `.output/` after local build
  verification when it is no longer needed.
- Preserve unrelated work and existing behavior during refactors. Do not weaken tests to make a
  change pass or claim browser/visual verification that was not performed.
- Normal files use mode `644`; reserve `755` for scripts intended to be executed directly.
- Do not start servers, open GUI applications, push commits, or make external changes unless the
  user requests it.
