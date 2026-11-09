/**
 * Append-only upload of study events to Supabase (table `study_events`, see supabase/schema.sql).
 *
 * - Every event gets a client-generated `event_id` (primary key), so re-sending is harmless:
 *   a duplicate comes back as 409 Conflict and is treated as already saved.
 * - Unsent events are kept in localStorage and retried with backoff, including after a reload,
 *   so a dropped connection or closed tab does not lose data.
 * - The anon key can only INSERT (row-level security); it cannot read or modify anything.
 */
import { useSyncExternalStore } from 'react';

export type EventKind = 'session_start' | 'pre_survey' | 'trial' | 'post_survey' | 'session_complete';

interface StudyEvent {
  event_id: string;
  session_id: string;
  pid: string;
  condition: number;
  kind: EventKind;
  payload: unknown;
  client_ts: string;
}

export interface SyncStatus {
  configured: boolean;
  pending: number;
  sending: boolean;
  lastError: string | null;
}

const URL_ = import.meta.env.VITE_SUPABASE_URL as string | undefined;
// New-style "publishable" key (sb_publishable_...), or a legacy "anon" JWT key. Both map to the anon role.
const KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as
  | string
  | undefined;
// Only legacy keys are JWTs and may go in the Authorization header; publishable keys go in `apikey` only.
const IS_LEGACY_JWT = Boolean(KEY?.startsWith('eyJ'));
const CONFIGURED = Boolean(URL_ && KEY);
const QUEUE_KEY = 'mt-study-upload-queue';
const MAX_BACKOFF_MS = 60_000;

export const uuid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });

function loadQueue(): StudyEvent[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

let queue: StudyEvent[] = CONFIGURED ? loadQueue() : [];
let status: SyncStatus = { configured: CONFIGURED, pending: queue.length, sending: false, lastError: null };
let backoff = 2_000;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function setStatus(patch: Partial<SyncStatus>) {
  status = { ...status, ...patch, pending: queue.length };
  listeners.forEach((l) => l());
}

function persist() {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    /* storage unavailable: queue still lives in memory for this page */
  }
}

async function send(ev: StudyEvent): Promise<void> {
  const res = await fetch(`${URL_}/rest/v1/study_events`, {
    method: 'POST',
    headers: {
      apikey: KEY!,
      ...(IS_LEGACY_JWT ? { Authorization: `Bearer ${KEY}` } : {}),
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(ev),
    keepalive: true, // lets the request finish if the tab is closing
  });
  // 409 = this event_id is already stored (an earlier attempt succeeded but its response was lost).
  if (!res.ok && res.status !== 409) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

export async function flush(): Promise<void> {
  if (!CONFIGURED || status.sending || queue.length === 0) return;
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = null;
  setStatus({ sending: true });
  try {
    while (queue.length) {
      await send(queue[0]);
      queue = queue.slice(1);
      persist();
      setStatus({ lastError: null });
    }
    backoff = 2_000;
    setStatus({ sending: false });
  } catch (e) {
    setStatus({ sending: false, lastError: e instanceof Error ? e.message : String(e) });
    retryTimer = setTimeout(flush, backoff);
    backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
  }
}

export function recordEvent(
  session: { sessionId: string; pid: string; condition: number },
  kind: EventKind,
  payload: unknown,
) {
  if (!CONFIGURED) return;
  queue = [
    ...queue,
    {
      event_id: uuid(),
      session_id: session.sessionId,
      pid: session.pid,
      condition: session.condition,
      kind,
      payload,
      client_ts: new Date().toISOString(),
    },
  ];
  persist();
  setStatus({});
  void flush();
}

export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => status,
  );
}

if (CONFIGURED) {
  window.addEventListener('online', () => void flush());
  // Send anything left over from an earlier page load.
  if (queue.length) void flush();
}
