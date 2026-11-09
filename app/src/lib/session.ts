import type { ExplanationType, SessionMode, SessionRecord } from '../types';
import { uuid } from './sync';

export const EXPLANATION_TYPES: ExplanationType[] = ['backtranslation', 'rationale', 'qe', 'alignment'];

/** Balanced (Williams) Latin square for 4 conditions: each type appears in each position once
 *  and each type follows every other type once. */
const LATIN_SQUARE = [
  [0, 1, 3, 2],
  [1, 2, 0, 3],
  [2, 3, 1, 0],
  [3, 0, 2, 1],
];
export const NUM_CONDITIONS = LATIN_SQUARE.length;

export const LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function explanationOrder(condition: number): ExplanationType[] {
  return LATIN_SQUARE[condition % NUM_CONDITIONS].map((i) => EXPLANATION_TYPES[i]);
}

/** Rotate trial order by condition so each document appears in each position across participants. */
export function rotate<T>(items: T[], by: number): T[] {
  const k = ((by % items.length) + items.length) % items.length;
  return [...items.slice(k), ...items.slice(0, k)];
}

/** Fisher–Yates shuffle (returns a new array). */
export function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function hash(s: string): number {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

export const params = new URLSearchParams(window.location.search);

const MODES: SessionMode[] = ['moderated', 'remote', 'online'];

/** `?mode=moderated|remote|online`; anything else (or missing) counts as a self-serve online session. */
export function parseMode(value: string | null): SessionMode {
  const m = value?.toLowerCase() as SessionMode | undefined;
  return m && MODES.includes(m) ? m : 'online';
}

export function initSession(): SessionRecord {
  const pid = params.get('pid') || `P-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const condParam = params.get('cond');
  const condition = condParam !== null ? Number(condParam) % NUM_CONDITIONS : hash(pid) % NUM_CONDITIONS;
  return { sessionId: uuid(), pid, condition, mode: parseMode(params.get('mode')), startedAt: Date.now(), userAgent: navigator.userAgent, trials: [] };
}

const STORAGE_KEY = 'mt-study-session';

export function saveLocal(session: SessionRecord) {
  try {
    localStorage.setItem(`${STORAGE_KEY}:${session.sessionId}`, JSON.stringify(session));
  } catch {
    /* storage unavailable: data still lives in memory and can be downloaded */
  }
}

export function downloadJSON(session: SessionRecord) {
  const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `session-${session.pid}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
