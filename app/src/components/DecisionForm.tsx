import { useState } from 'react';
import type { Decision, DecisionRecord } from '../types';

interface Props {
  prompt: string;
  disabled?: boolean;
  disabledReason?: string;
  onSubmit: (r: DecisionRecord) => void;
}

const CONF_LABELS = ['1 Not at all', '2', '3', '4', '5', '6', '7 Completely'];

export function DecisionForm({ prompt, disabled, disabledReason, onSubmit }: Props) {
  const [decision, setDecision] = useState<Decision | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);

  return (
    <div className="card decision">
      <p className="q">{prompt}</p>
      <div className="choice-row">
        {(['accept', 'reject'] as Decision[]).map((d) => (
          <button
            key={d}
            className={`choice ${decision === d ? 'selected' : ''}`}
            onClick={() => setDecision(d)}
            disabled={disabled}
          >
            {d === 'accept' ? '✓ Accept translation' : '✗ Reject translation'}
          </button>
        ))}
      </div>
      <p className="q small">How confident are you in this decision?</p>
      <div className="likert">
        {CONF_LABELS.map((label, i) => (
          <label key={i} className={confidence === i + 1 ? 'selected' : ''}>
            <input
              type="radio"
              name="confidence"
              checked={confidence === i + 1}
              onChange={() => setConfidence(i + 1)}
              disabled={disabled}
            />
            {label}
          </label>
        ))}
      </div>
      {disabled && disabledReason && <p className="muted small">{disabledReason}</p>}
      <button
        className="primary"
        disabled={disabled || !decision || !confidence}
        onClick={() => onSubmit({ decision: decision!, confidence: confidence!, at: Date.now() })}
      >
        Continue
      </button>
    </div>
  );
}
