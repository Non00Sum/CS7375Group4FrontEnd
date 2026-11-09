# Translation Explanation Study — Front End

Prototype UI for the CS 7375 HCXAI project. Participants read a Korean hotel document with an English
machine translation, make an accept/reject decision, then view and rank explanation methods.

## Run
```bash
npm install
npm run dev        # http://localhost:5173
```

URL parameters:
- `?pid=P01`: participant ID (random if omitted)
- `?cond=0..3`: counterbalancing condition (Latin-square explanation order + trial rotation; hashed from pid if omitted)
- `?mode=moderated|remote|online`: how the session is run (in person / video call / self-serve). Saved with the
  session and shown as a `mode` column in the analysis views. Defaults to `online`.
- `?stage=welcome|pre|tutorial|trials|post|done`: jump to a stage (for design review)
- `?debug=1`: show pid, condition, and explanation order in the header

## Flow
Consent → pre-survey → practice trial (with hints) → trials → post-survey → done (upload + JSON download).
Each trial: **baseline decision** (translation only) → **reveal** explanations as neutral tabs A–D (all must be opened)
→ **revised decision** → **rank** on two dimensions with required justifications.

## Where things live
- `src/data/stimuli.ts`: **mock** stimuli (replace with curated data + precomputed explanations)
- `src/data/surveys.ts`: draft survey items
- `src/types.ts`: data contract (`Stimulus`, `TrialResult`, `SessionRecord`)
- `src/components/DocumentPane.tsx`: source/translation, QE highlights, and alignment hover overlays
- `src/components/ExplanationPanel.tsx`: per-explanation renderers
- `src/lib/session.ts`: counterbalancing, local save, Supabase upload, JSON download

## Saving data (Supabase)
Every step is uploaded as soon as it's finished (`session_start`, `pre_survey`, each `trial` including practice,
`post_survey`, `session_complete`), so partial sessions from dropouts are kept. Unsent events wait in a
localStorage queue and retry with backoff, also after a reload or when the connection comes back. The final
screen shows "All responses saved" or offers **Retry now**, and **Download data (JSON)** is always available
as a fallback. Without configuration, uploading is off and only the download works.

Setup (once):
1. Create a Supabase project. In **SQL Editor**, run `supabase/schema.sql`. It's safe to re-run.
2. Copy `.env.example` to `.env.local` and fill in the **Project URL** and the **publishable** key
   (`sb_publishable_…`, Project Settings → API Keys). Supabase's snippets call it
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; for Vite the name must be `VITE_SUPABASE_PUBLISHABLE_KEY`.
   Never use the secret (`sb_secret_…`) or `service_role` key in the front end.
3. Set the same two variables on your host (Vercel/Netlify), because Vite bakes them in at build time.
4. Restart `npm run dev`. With `?debug=1` the header shows the upload queue.

Security model: the anon key is public, so the table is **insert-only** for it (row-level security plus
grants). Participants can't read, edit or delete any rows. Researchers read data in the dashboard or via the
analysis views, which are in a private `analysis` schema that the REST API doesn't expose:
```sql
select * from analysis.sessions;  -- one row per session: progress, completed?
select * from analysis.trials;    -- one row per trial: decisions, correctness, rankings, justifications
```

## Original documents (PDF / web page)
Each stimulus can include `original: { kind: 'pdf' | 'html', src: 'documents/<file>' }`. Put files in
`public/documents/`. Participants open them with **View full document**, a modal viewer that scrolls and zooms
(+/− buttons, Ctrl/Cmd +/−, or Ctrl + scroll / pinch). PDFs are drawn with pdf.js, so they look the same in every
browser. HTML pages load in a same-origin iframe, so save pages locally rather than linking to live sites.
The viewer is display-only: `sourceTokens` stays the source of truth for the text, so no OCR is needed.
Each open is logged per trial as `originalViews: [{ step, ms, maxZoom }]`.

The mock PDF was made from its HTML page with:
`"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --no-pdf-header-footer --print-to-pdf=public/documents/hotel-checkin.pdf public/documents/hotel-checkin.html`
