## Rules
- All data reads/writes go through `src/lib/data/store.ts` (localStorage for now) — so a backend can replace it without touching UI.
- Progress math lives only in `src/lib/data/progress.ts` — keeps the replaceable progress model in one place.
- Demo content is flagged `demo: true` and built in `src/lib/data/demo.ts`; app logic must never depend on it — so it can be removed safely.
