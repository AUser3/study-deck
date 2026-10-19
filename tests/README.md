# Tests

All automated tests live in this directory so production code under `src/` stays focused on the
application. The folders under `tests/` generally mirror the related source paths.

## Running tests

Run the complete suite once:

```sh
npm test
```

Run tests continuously while developing:

```sh
npm run test:watch
```

Type checking and linting are separate checks:

```sh
npx tsc --noEmit
npm run lint
```

## Organization

- `app-routing.test.tsx` checks application-level route behavior.
- `features/` tests feature rules such as question validation and study eligibility.
- `lib/data/` tests importing, matching, progress, JSON validation, and app-data persistence.
- `setup.ts` configures the shared jsdom test environment.

## Conventions

- Name test files `*.test.ts` or `*.test.tsx`.
- Mirror the source path where practical. For example, tests for `src/lib/data/catalog.ts` belong in
  `tests/lib/data/catalog.test.ts`.
- Import application modules through the `@/` alias instead of long relative paths.
- Keep progress calculations covered through `src/lib/data/progress.ts` and data access covered
  through the public data-layer boundaries.
- Add focused unit tests for rules and validation. Add broader tests only when behavior crosses
  multiple modules.

Tests run with Vitest in jsdom by default. Filesystem persistence tests opt into Vitest's Node
environment and use isolated temporary directories.
