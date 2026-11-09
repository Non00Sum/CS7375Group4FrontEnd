# Translation Explanation Study

Web app for our CS 7375 (Human-Centered Explainable & Responsible AI, Fall 2026) semester project.
It compares **explanation methods for machine translation** from the point of view of people who can't read
the source language.

**Live site:** https://translationstudy.netlify.app

**Team:** Eric Buz Kuan

> ⚠️ **Status: prototype with mock content.** The hotel documents, explanations, survey items and consent text
> are placeholders for design review. See [Before running real participants](#before-running-real-participants).

---

## Contents
- [The study](#the-study)
- [Conditions and counterbalancing](#conditions-and-counterbalancing)
- [Running sessions](#running-sessions)
- [Data](#data)
- [Adding real documents and explanations](#adding-real-documents-and-explanations)
- [Development and deployment](#development-and-deployment)
- [Repository layout](#repository-layout)
- [Open questions](#open-questions)

---

## The study

Participants read a short **Korean** document (currently hotel information, i.e. low stakes) with an
**English machine translation**. Some translations contain plausible errors. Participants decide whether they'd
accept the translation, look at several explanations of it, and rank those explanations. Most participants are
US grad students who don't read Korean; the pre-survey asks about Korean proficiency so readers can be excluded.

### Session flow

```
Consent → Pre-survey → Practice document (with hints) → Documents ×N → Post-survey → Done
```

| Step | What happens |
|---|---|
| **Consent** | Study info and an agreement checkbox (placeholder text). |
| **Pre-survey** | First language, Korean proficiency, machine-translation use and trust (adapted from Ki et al.). |
| **Practice** | One easy document; each explanation shows a hint on how to read it. |
| **Documents** | Each goes through the three steps below. |
| **Post-survey** | Mental demand, helpfulness, future trust (Hoffman et al., 2019), plus open-ended questions. |
| **Done** | Upload status, with a JSON download as a fallback. |

### Each document: decide → reveal → rank

1. **First impression.** Korean original + English translation only → *Accept / Reject* + confidence (1–7).
   This is the **no-explanation baseline**.
2. **Explanations.** Four explanations appear as neutrally labeled tabs (*Explanation A–D*). All four must be
   opened, then the participant decides again (*Accept / Reject* + confidence).
3. **Rank.** The participant ranks the explanations on two dimensions, each with a required written reason
   (at least 15 characters), adapted from Ehsan et al.'s comparative rankings:
   - how **easy to understand** each explanation was
   - how much each **helped them decide** whether to trust the translation

   Each list starts in a random order so the A–D order doesn't anchor rankings.

At any step, **View full document** opens the original as a PDF or web page with scroll and zoom, for context.

Because each document has a known answer (correct or flawed), the before/after decisions measure
**appropriate reliance**: did explanations help people reject bad translations and accept good ones? The
rankings and justifications measure **stated preference** and supply the qualitative data.

### Explanation types

| Type | What the participant sees |
|---|---|
| **Round-trip translation** | The translation translated into Korean and back into English; wording that differs from the translation is highlighted. |
| **Written explanation** | An LLM-generated paragraph on how well the translation matches the original. |
| **Quality estimate** | An overall score (0–100) and the translation colored by how likely each part is to be wrong (likely error / uncertain / likely fine). |
| **Word matching** | Hover a word in either document to highlight the corresponding words; translated words with no match get a dashed underline. |

All explanations are **precomputed** and stored with the documents, so every participant sees identical
stimuli and nothing calls a model at study time.

---

## Conditions and counterbalancing

A condition (`cond` = 0–3) only sets **order**. Every participant sees all four explanation types on every
document, so explanation type is compared within each participant.

**Explanation order (tabs A → D).** Balanced Latin square: across conditions each type appears in each position
once and follows every other type once. A participant keeps the same order throughout their session.

| `cond` | A | B | C | D |
|---|---|---|---|---|
| **0** | Round-trip translation | Written explanation | Word matching | Quality estimate |
| **1** | Written explanation | Quality estimate | Round-trip translation | Word matching |
| **2** | Quality estimate | Word matching | Written explanation | Round-trip translation |
| **3** | Word matching | Round-trip translation | Quality estimate | Written explanation |

**Document order.** The practice document always comes first; the rest rotate by condition. With the 3 mock
documents:

| `cond` | 1st | 2nd | 3rd |
|---|---|---|---|
| **0** | Check-in (correct) | Parking (flawed) | Room rates (flawed) |
| **1** | Parking (flawed) | Room rates (flawed) | Check-in (correct) |
| **2** | Room rates (flawed) | Check-in (correct) | Parking (flawed) |
| **3** | Check-in (correct) | Parking (flawed) | Room rates (flawed) |

With 3 documents and 4 conditions, conditions 0 and 3 share a document order. A multiple of 4 documents would
balance it fully.

If `cond` is omitted, it's derived from the participant ID. For a real study, **assign it explicitly** and cycle
0 → 1 → 2 → 3 across participants.

---

## Running sessions

Each participant gets a personal link:

```
https://translationstudy.netlify.app/?pid=P03&cond=2&mode=moderated
```

| Parameter | Values | Purpose |
|---|---|---|
| `pid` | e.g. `P03` | Participant ID (random if omitted). |
| `cond` | `0`–`3` | Counterbalancing condition (see above). |
| `mode` | `moderated` · `remote` · `online` (default) | How the session is run; saved with the data. |
| `debug` | `1` | **Researchers only.** Header shows pid, condition, order, mode and upload queue. |
| `stage` | `welcome` `pre` `tutorial` `trials` `post` `done` | **Researchers only.** Jump to a step for design review. |

Keep a session sheet (pid, cond, mode, date, moderator, notes).

### In person (`mode=moderated`)
- Open each participant's link in a **fresh private window** on the study laptop. Never use `debug=1` with participants.
- Record think-aloud audio separately (phone, QuickTime, Zoom) and say the pid aloud at the start.
- Do the post-session interview after the **Done** screen so it doesn't inflate the timing data.
- **Unreliable Wi-Fi is fine.** Responses queue in the browser and upload once it's back online.
  Fully offline: `cd app && npm run build && npm run preview` and use the localhost URL.

### Remote over Zoom (`mode=remote`)
- Send the link in chat and have the participant open it **in their own browser** and share their screen.
  Hover and drag lag badly under remote control.
- Laptop or desktop only. Word matching relies on hover.
- Record the call, with consent.

### Self-serve (`mode=online` or omitted)
- Send the link. The practice round and hints are built to work without a researcher.

If a session breaks, restart with a suffixed ID (e.g. `P03b`). Every run has its own `session_id`, so partial
runs stay separable.

---

## Data

Responses go to **Supabase** (Postgres) as an **append-only event log**, uploaded as soon as each step is
finished, so dropouts keep what they completed:

| Event | When | Payload |
|---|---|---|
| `session_start` | after consent | mode, explanation order, document order, user agent |
| `pre_survey` | after pre-survey | answers |
| `trial` | after each document (incl. practice) | both decisions + confidence, rankings + justifications, tab view times, word-matching hovers, original-document views |
| `post_survey` | after post-survey | answers |
| `session_complete` | at the end | the full session record |

**Reliability.** Unsent events wait in the browser's local storage and retry automatically (also after a reload
or when the connection comes back). Each event has a client-generated ID, so retries never create duplicates.
The Done screen shows *All responses saved* or offers *Retry now*, and **Download data (JSON)** is always
available.

**Security.** The browser holds Supabase's *publishable* key, which is public by design. The table is
**insert-only** for that key: participants can't read, edit or delete anything. Researchers read data in the
Supabase dashboard.

**Analysis.** In the Supabase **SQL Editor**:

```sql
select * from analysis.sessions;   -- one row per session: pid, condition, mode, trials done, completed?
select * from analysis.trials;     -- one row per document: decisions, correct?, rankings, justifications, mode

-- e.g. did explanations improve decisions on flawed translations?
select avg(baseline_correct::int) as before, avg(revised_correct::int) as after
from analysis.trials where not tutorial and is_flawed;
```

`*_correct` means the participant rejected a flawed translation or accepted a correct one. Exclude test runs
(e.g. `where pid not like 'TEST%'`) and participants who report reading Korean. The `analysis` schema isn't
reachable through the public API.

Setup details (creating the table, keys, environment variables) are in [`app/README.md`](app/README.md#saving-data-supabase).
The schema is in [`app/supabase/schema.sql`](app/supabase/schema.sql); it's safe to re-run after updates.

---

## Adding real documents and explanations

Documents live in [`app/src/data/stimuli.ts`](app/src/data/stimuli.ts); the format is `Stimulus` in
[`app/src/types.ts`](app/src/types.ts). Each document needs:

| Field | Source | Notes |
|---|---|---|
| `sourceTokens` / `targetTokens` | Eric | Korean and English text split into display tokens. Word matching and quality highlights point at token positions, so Korean needs sensible word or phrase units, not single characters. |
| `isFlawed`, `flawNote` | Eric | Ground truth, never shown to participants. |
| `explanations.backtranslation` | Kuan | Plain text. |
| `explanations.rationale` | Kuan | Plain text. |
| `explanations.qe` | Kuan | `score` (0–100) and `spans: [{ tgt: [start, end), score: 0–1, note? }]`. |
| `explanations.alignment` | Kuan | `[{ src: [start, end), tgt: [start, end) }]` token ranges. |
| `original` (optional) | Eric | `{ kind: 'pdf' \| 'html', src: 'documents/<file>' }`, with the file in `app/public/documents/`. |

The mock data is written as phrases (e.g. `['조식은', 'Breakfast']`) and converted to token ranges by a helper
in `stimuli.ts`, which is convenient for hand-authoring. Pipeline output can supply token ranges directly.
Survey items are in [`app/src/data/surveys.ts`](app/src/data/surveys.ts).

---

## Development and deployment

```bash
cd app
npm install
npm run dev          # http://localhost:5173  (add ?debug=1)
npm run build        # type-check + production build into app/dist
```

Stack: React 19 + TypeScript + Vite, `@dnd-kit` for drag-to-rank, `pdfjs-dist` for PDFs, Supabase REST for
storage (no SDK). Requires Node 20.19+ / 22.12+.

**Deployment.** Netlify builds from this repo on every push to the deployed branch. Settings: **Base
directory** = `app`; build command and publish directory come from [`app/netlify.toml`](app/netlify.toml).
Environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are set in Netlify. Vite builds
them into the site, so **redeploy after changing them**. Locally they go in `app/.env.local` (gitignored; see
`app/.env.example`).

Since pushes go live immediately, check changes locally first and avoid deploying during a data-collection
session.

---

## Repository layout

```
├── README.md                    ← this file
├── project_meterial/            course project description and our planning doc
└── app/
    ├── README.md                developer notes (setup, Supabase, document viewer)
    ├── netlify.toml             build settings
    ├── supabase/schema.sql      table, access rules, analysis views
    ├── public/documents/        original documents (PDF / HTML) for "View full document"
    └── src/
        ├── App.tsx              session flow and event recording
        ├── types.ts             data formats (Stimulus, TrialResult, SessionRecord)
        ├── data/                stimuli.ts (MOCK) · surveys.ts (DRAFT)
        ├── lib/                 session.ts (conditions, IDs) · sync.ts (upload queue) · diff.ts
        └── components/          Trial, DocumentPane, ExplanationPanel, RankList,
                                 DecisionForm, Survey, OriginalViewer
```

---

## Before running real participants

- [ ] Replace the consent placeholder (`app/src/App.tsx`, Welcome screen)
- [ ] Replace mock documents and explanations (`app/src/data/stimuli.ts`, `app/public/documents/`)
- [ ] Finalize survey items (`app/src/data/surveys.ts`)
- [ ] Re-run `app/supabase/schema.sql` if it changed
- [ ] Pilot with 1–2 people on the live site; check the session length (target 30–45 min)
- [ ] Delete pilot and test rows: `delete from public.study_events where pid like 'TEST%';`
- [ ] Prepare participant links and a session sheet with conditions assigned

---

## Open questions

- **Round-trip translation.** The translation is already in English, so English → Korean → English never checks
  the Korean source and can repeat errors (the mock parking document shows this). Keep it, replace it with an
  independent second translation, or drop it?
- **Stakes.** All current documents are low stakes. Adding the medical (high-stakes) documents means choosing
  between stakes as a between-participants condition or a mix within each session.
- **Typed reasons in moderated sessions.** Think-aloud participants say their reasons, so the 15-character
  typed minimum duplicates effort. Relaxing it for `mode=moderated` would make moderated and online data less
  comparable.
- **Resuming.** Refreshing mid-study restarts the session (earlier steps stay on the server).
- **Ranking load.** Ranking two dimensions after every document adds time; ranking once per document type or
  once at the end is an alternative.
