import { useEffect, useMemo, useState } from 'react';
import type { SessionRecord, TrialResult } from './types';
import { practiceStimulus, stimuliForCondition } from './data/study';
import { preSurvey, postSurvey } from './data/surveys';
import { downloadJSON, explanationOrder, initSession, params, saveLocal } from './lib/session';
import { flush, recordEvent, useSyncStatus, type EventKind } from './lib/sync';
import { Trial } from './components/Trial';
import { Survey } from './components/Survey';

type Stage = 'welcome' | 'pre' | 'tutorial' | 'trials' | 'post' | 'done';
const STAGES: Stage[] = ['welcome', 'pre', 'tutorial', 'trials', 'post', 'done'];

export default function App() {
  const [session, setSession] = useState<SessionRecord>(initSession);
  const initial = params.get('stage') as Stage | null;
  const [stage, setStage] = useState<Stage>(initial && STAGES.includes(initial) ? initial : 'welcome');
  const [trialIdx, setTrialIdx] = useState(0);
  const [consent, setConsent] = useState(false);
  const sync = useSyncStatus();

  const order = useMemo(() => explanationOrder(session.condition), [session.condition]);
  const trials = useMemo(() => stimuliForCondition(session.condition), [session.condition]);

  useEffect(() => saveLocal(session), [session]);
  useEffect(() => window.scrollTo({ top: 0 }), [stage, trialIdx]);
  // Each step is uploaded as soon as it's finished, so partial sessions (dropouts) are kept.
  const record = (kind: EventKind, payload: unknown) => recordEvent(session, kind, payload);

  const addTrial = (r: TrialResult) => {
    record('trial', r);
    setSession((s) => ({ ...s, trials: [...s.trials, r] }));
  };

  return (
    <main>
      <header className="app-header">
        <span>Translation Explanation Study</span>
        {params.has('debug') && (
          <span className="muted small">
            pid {session.pid} · condition {session.condition} · mode {session.mode} · docs{' '}
            {trials.map((t) => `${t.id}${t.version === 'flawed' ? '✗' : '✓'}`).join(' ')} · order {order.join(' → ')} · upload{' '}
            {sync.configured ? `${sync.pending} pending${sync.lastError ? ' (error)' : ''}` : 'off'}
          </span>
        )}
      </header>

      {stage === 'welcome' && (
        <div className="card">
          <h1>Welcome</h1>
          <p>
            In this study you will imagine you're traveling in Korea. You'll see short notices from hotels and
            pharmacies written in <strong>Korean</strong>, each with an English translation produced by a machine
            translation system. Some translations may contain errors.
          </p>
          <p>
            For each notice you'll decide whether you would accept the translation, look at several different
            explanations of it, answer a question about your situation, and rank the explanations. The study takes
            about 30 minutes.
          </p>
          <p className="muted small">
            [Placeholder consent text: purpose, voluntary participation, data handling, contact information.]
          </p>
          <label className="consent">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /> I have read the
            information above and agree to take part.
          </label>
          <button
            className="primary"
            disabled={!consent}
            onClick={() => {
              const consentAt = Date.now();
              record('session_start', {
                mode: session.mode,
                startedAt: session.startedAt,
                consent: consentAt,
                userAgent: session.userAgent,
                explanationOrder: order,
                trialOrder: trials.map((t) => `${t.id}:${t.version}`),
              });
              setSession((s) => ({ ...s, consent: consentAt }));
              setStage('pre');
            }}
          >
            Start
          </button>
        </div>
      )}

      {stage === 'pre' && (
        <Survey
          title="About you"
          questions={preSurvey}
          onSubmit={(pre) => {
            record('pre_survey', pre);
            setSession((s) => ({ ...s, pre }));
            setStage('tutorial');
          }}
        />
      )}

      {stage === 'tutorial' && (
        <Trial
          key="tutorial"
          stimulus={practiceStimulus}
          order={order}
          tutorial
          progress="Practice"
          onComplete={(r) => {
            addTrial(r);
            setStage('trials');
          }}
        />
      )}

      {stage === 'trials' && (
        <Trial
          key={trials[trialIdx].id}
          stimulus={trials[trialIdx]}
          order={order}
          progress={`Document ${trialIdx + 1} of ${trials.length}`}
          onComplete={(r) => {
            addTrial(r);
            if (trialIdx + 1 < trials.length) setTrialIdx(trialIdx + 1);
            else setStage('post');
          }}
        />
      )}

      {stage === 'post' && (
        <Survey
          title="Final questions"
          questions={postSurvey}
          submitLabel="Submit"
          onSubmit={(post) => {
            const final = { ...session, post, completedAt: Date.now() };
            record('post_survey', post);
            record('session_complete', final);
            setSession(final);
            setStage('done');
          }}
        />
      )}

      {stage === 'done' && (
        <div className="card">
          <h1>Thank you!</h1>
          <p>Your responses have been recorded. Participant ID: {session.pid}</p>
          {!sync.configured ? (
            <p className="muted small">No server configured. Please download the data file below.</p>
          ) : sync.pending === 0 ? (
            <p className="small sync-ok">✓ All responses saved. You can close this tab.</p>
          ) : (
            <>
              <p className="small">
                Saving your responses… ({sync.pending} remaining). Please keep this tab open.
                {sync.lastError && (
                  <span className="muted"> Retrying automatically; if this persists, download the file below.</span>
                )}
              </p>
              <button onClick={() => void flush()} disabled={sync.sending}>
                {sync.sending ? 'Saving…' : 'Retry now'}
              </button>{' '}
            </>
          )}
          <button onClick={() => downloadJSON(session)}>Download data (JSON)</button>
        </div>
      )}
    </main>
  );
}
