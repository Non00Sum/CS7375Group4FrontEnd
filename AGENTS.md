# Notes for coding agents

Study web app for a CS 7375 HCXAI project. See [README.md](README.md) for the study design.

## Layout
- `app/`: the React + TypeScript + Vite app. Run all commands from here.
- `app/translation-experiment-data/`: **all study content** (notices, explanations, images). Format spec:
  [`app/translation-experiment-data/README.md`](app/translation-experiment-data/README.md).
- `app/src/data/studyConfig.ts`: which notices are used, and version counterbalancing.
- `app/supabase/schema.sql`: database table, access rules, analysis views.

## Commands (in `app/`)
```bash
npm run check-data   # validate study data; prints explanation coverage + condition table. Exit 1 on errors.
npm run build        # type-check + production build. Must pass before pushing (pushes deploy to production).
npm run dev          # local server at http://localhost:5173 (?debug=1 shows condition, versions, upload queue)
```

## Rules
- **Pushing to the deployed branch publishes to the live study site** (Netlify). Don't push during data collection
  without the team's OK.
- Changing study content means editing JSON in `translation-experiment-data/`, then running `npm run check-data`.
  Copy phrases exactly from the source texts; don't paraphrase them.
- Never commit `.env.local`, Supabase secret / service_role keys, or participant data files (`session-*.json`).
- `schema.sql` must stay re-runnable. When changing an analysis view, add new columns **at the end**
  (`create or replace view` can't reorder or rename columns).
- Entries marked `"_mock": true` in explanations.json are placeholders, not model output. Don't present them as results.
