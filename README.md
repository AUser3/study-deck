# Studydeck

A local-first flashcard app for organizing courses and topics, importing question banks, and studying with several practice modes. Studydeck is pre-release software targeting version `0.1.0`; expect breaking changes and limited support while the project is prepared for its first public release.

See [CONTRIBUTING.md](CONTRIBUTING.md) for architecture boundaries, development conventions, and the
pull-request checklist.

## Development

You need Node.js 22.12 or newer and npm.

```sh
git clone <this-repository-url>
cd <repository-name>
npm install
npm run dev
```

After `npm run dev` starts, open the URL printed by Vite. The configured port is `5173`; native
development normally uses `http://localhost:5173`. When Vite runs inside WSL, the Windows browser
may use that localhost URL when WSL forwarding is available, otherwise use one of Vite's printed
network URLs.

To create and preview a production build:

```sh
npm run build
npm run preview
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

Studydeck stores courses, topics, questions, notes, old-exam metadata, and progress as private JSON
outside the repository. Old-exam PDFs are managed beside that JSON. The local application server
creates the directory and base files automatically on first use, and the browser UI reads and writes
them through same-origin server functions. There is no database, folder picker, or browser
permission popup.

The default data directory depends on the operating system running `npm run dev`:

- Linux and WSL: `~/.local/share/studydeck`
- Windows: `%LOCALAPPDATA%\Studydeck`
- macOS: `~/Library/Application Support/Studydeck`

Set `STUDYDECK_DATA_DIR` before starting the app to use a different absolute directory. Existing
files are read and validated at startup but are not rewritten until an action in the app changes
their data. Writes use a temporary file and rename so an interrupted write is less likely to damage
the saved JSON.

## Source structure

- `src/routes` contains small file-based route adapters; nested course routes use directories that
  mirror their URLs.
- `src/pages` contains complete screens composed by the route adapters.
- `src/features` owns reusable feature UI and rules for courses, topics, questions, and study
  sessions.
- `src/components` contains reusable app components; `components/ui` contains only primitives the app uses.
- `src/lib/data/store.ts` is the single data gateway used by UI code; its focused client modules own
  course, topic, question, attempt, and state operations.
- `src/lib/data/app-data.functions.ts` is the browser-to-local-server boundary.
- `src/lib/data/app-data.server.ts` owns private application-data filesystem access, while location
  resolution, managed documents, backups, and state validation live in focused sibling modules.
- `src/lib/data/catalog.ts` validates and serializes repository JSON.
- `src/lib/data/progress.ts` owns all progress calculations.
- `tests` contains the test suite and its shared browser setup.

Dependencies flow from routes to pages, then to features/components, and finally to `lib`; the data
layer never imports UI. Add abstractions or UI primitives only when an existing use case needs them.

## Data layout

The application-data directory contains:

```text
manifest.json
progress.json
courses/
  <course-name-and-id>.json
documents/
  <generated-id>.pdf
```

`manifest.json` indexes course files, each course file contains that course's topics, questions,
notes, and old-exam metadata, `documents/` contains managed PDF copies, and `progress.json` contains
study attempts. Use **Data → Open data folder** in the app header to reveal the directory. Use
**Data → Download backup** to create one portable JSON file containing both structured data and the
managed PDFs; restoring a backup replaces the current data after confirmation.

## Generated build output

Running `npm run build` creates `.output/`, including the browser assets under `public/`, the local
Node server bundle under `server/`, and Nitro's build metadata. It is required only to run that
particular production build. The directory is ignored by Git and can be deleted at any time;
`npm run build` recreates it.

## Community and support

- Read [CONTRIBUTING.md](CONTRIBUTING.md) before proposing a change.
- Use [SUPPORT.md](SUPPORT.md) for questions, bug reports, and feature requests.
- Report vulnerabilities privately by following [SECURITY.md](SECURITY.md).

Studydeck is not public yet. Until the first release, support is best-effort and contributions are
accepted only through the maintainer-approved workflow described in [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Studydeck is available under the [MIT License](LICENSE). You may use, copy, modify, and redistribute
the project under the terms of that license.
