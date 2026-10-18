# Studydeck

A local-first flashcard app for organizing courses and topics, importing question banks, and studying with several practice modes.

## Development

You need Node.js 22.12 or newer and npm.

```sh
git clone <this-repository-url>
cd <repository-name>
npm install
npm run dev
```

The development server is available at `http://localhost:8080` by default.

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

App data is stored in the browser's local storage.

## Source structure

- `src/routes` contains route definitions and page-level composition.
- `src/features` owns feature-specific UI and rules for courses, topics, questions, and study sessions.
- `src/components` contains reusable app components; `components/ui` contains only primitives the app uses.
- `src/lib/data/store.ts` is the single data gateway. UI code must not read or write local storage directly.
- `src/lib/data/progress.ts` owns all progress calculations.
- `src/lib/data/demo.ts` is the only place that creates removable demo content.

Dependencies flow from routes to features/components and then to `lib`; the data layer never imports UI. Add abstractions or UI primitives only when an existing use case needs them.
