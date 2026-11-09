import { useState } from 'react';
import type { ComprehensionRecord, KeyQuestion } from '../types';
import { shuffle } from '../lib/session';

const UNSURE = "I'm not sure";

/** The scenario's key question. Options are shuffled; "I'm not sure" is always last. */
export function ComprehensionQuestion({
  question,
  onSubmit,
}: {
  question: KeyQuestion;
  onSubmit: (r: ComprehensionRecord) => void;
}) {
  const [options] = useState(() => shuffle(question.choices));
  const [choice, setChoice] = useState<string | null>(null);

  const submit = () => {
    const picked = options.find((o) => o.label === choice);
    const answerKey = picked ? picked.key : 'unsure';
    onSubmit({
      question: question.question,
      choice: choice!,
      answerKey,
      isRight: answerKey === 'correct',
      optionOrder: options.map((o) => o.label),
      at: Date.now(),
    });
  };

  return (
    <div className="card decision">
      <p className="q">{question.question}</p>
      <div className="options mc-options">
        {[...options.map((o) => o.label), UNSURE].map((label) => (
          <label key={label} className={`mc-option ${choice === label ? 'selected' : ''}`}>
            <input type="radio" name="comprehension" checked={choice === label} onChange={() => setChoice(label)} />
            {label}
          </label>
        ))}
      </div>
      <button className="primary" disabled={!choice} onClick={submit}>
        Continue
      </button>
    </div>
  );
}
