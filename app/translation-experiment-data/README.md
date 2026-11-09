# Study data

Everything participants see comes from this folder. The app reads these files directly at build time,
so editing them (and pushing) is all it takes to change the study.

```
translation-experiment-data/
├── notices.json        Korean notices, correct + flawed English, scenario, comprehension question  (Eric)
├── explanations.json   precomputed explanations per notice and translation version                 (Kuan)
└── images/             the notices as participants would see them ("View original")
```

**After any edit, run `npm run check-data` from `app/`.** It reports missing or mistyped phrases,
unknown ids, missing images, and prints which explanations exist and what each condition shows.
The site still loads with bad data (bad items are skipped), so this check is the safety net.

Which notices are used (main set, practice) is set in [`../src/data/studyConfig.ts`](../src/data/studyConfig.ts).

---

## notices.json

```jsonc
{
  "about": "…",
  "documents": [
    {
      "id": "p2_med",                       // unique; referenced by explanations.json and studyConfig.ts
      "set": "main",                        // "main" | "backup" (informational; studyConfig decides use)
      "stakes": "high",                     // "high" | "low"; versions are balanced within each level
      "setting": "pharmacy",
      "title_ko": "해솔약국 · 복약 안내",
      "title_en": "Haesol Pharmacy · Medication Guide",   // shown as the page heading
      "image": "images/p2_med.png",         // relative to this folder; optional
      "korean": "…\n\n…",                   // paragraphs separated by a blank line
      "english": {
        "correct": "…",                     // faithful translation
        "flawed": "…"                       // same text with one plausible, consequential error
      },
      "error": {                            // documents the flaw; checked to exist in the texts
        "type": "lexical ambiguity (Hangul number)",
        "korean_span": "이 주 동안",         // must appear in "korean"
        "correct_span": "…",                // must appear in english.correct
        "flawed_span": "…"                  // must appear in english.flawed
      },
      "scenario": "…",                      // shown to the participant as "Your situation"
      "key_question": {
        "question": "…",                    // asked after the explanations
        "answer": "…",                      // researcher notes (not shown)
        "answer_if_trusting_flawed": "…",   // researcher notes (not shown)
        "choices": [                        // shown shuffled, plus an "I'm not sure" option
          { "label": "Yes, I should keep taking it", "key": "correct" },
          { "label": "No, the course is finished",   "key": "flawed" }
        ]
      }
    }
  ]
}
```

`choices` needs exactly the readings the question is designed to separate: one option with
`"key": "correct"` (the true meaning of the Korean) and one with `"key": "flawed"` (what the flawed translation
implies). Keep labels short and neutral, without explanations like "the translation says…", since participants see them.

---

## explanations.json

One set of explanations per notice **and translation version**, because the explanations describe the
translation the participant actually sees.

```jsonc
{
  "about": "…",
  "explanations": {
    "p2_med": {
      "flawed": {
        "_mock": true,                      // optional; marks hand-written placeholder content
        "backtranslation": "…",             // plain text (blank lines = paragraphs)
        "rationale": "…",                   // plain text
        "qe": {
          "score": 80,                      // overall estimated quality, 0–100
          "spans": [                        // parts of the English to highlight
            { "text": "for one week.", "score": 0.55, "note": "Duration may not match the source" }
            // score 0–1: < 0.4 shown as "likely error", < 0.7 "uncertain", else "likely fine"
          ]
        },
        "alignment": [                      // Korean phrase ↔ English phrase it corresponds to
          { "ko": "이 주 동안", "en": "for one week" }
        ]
      },
      "correct": { … }
    }
  }
}
```

**Phrases, not offsets.** `qe.spans[].text`, `alignment[].ko` and `alignment[].en` are exact substrings
copied from `korean` / `english.<version>` in notices.json. The app highlights every word the phrase
touches. If a phrase occurs more than once, add a 1-based occurrence number: `"occurrence"` for qe spans,
`"ko_occurrence"` / `"en_occurrence"` for alignment. An alignment link's English side must be one
contiguous phrase; split non-contiguous correspondences into several links with the same `ko`.

**Coverage.** Any missing notice, version or field shows to participants as "This explanation hasn't been
generated for this document yet." English words not covered by any alignment link get a dashed underline
("no match found in the original"), so aim to cover every content word.

If a pipeline produces token or character offsets, converting them to phrases is a one-liner:
`text[start:end]`.
