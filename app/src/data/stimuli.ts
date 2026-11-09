/**
 * MOCK stimuli for design review only. Replace with Eric's curated documents and
 * Kuan's precomputed explanations (same Stimulus shape, ideally loaded from JSON).
 *
 * Authoring helper: alignment / QE spans are written as phrases and converted to
 * token ranges here, so mock data is easy to edit. Real pipeline output should
 * provide token ranges directly.
 */
import type { OriginalDocument, Stimulus, TokenRange } from '../types';

const toks = (s: string) => s.split(/\s+/).filter(Boolean);

function range(tokens: string[], phrase: string): TokenRange {
  const p = toks(phrase);
  for (let i = 0; i + p.length <= tokens.length; i++) {
    if (p.every((t, j) => tokens[i + j] === t)) return [i, i + p.length];
  }
  throw new Error(`Mock data: phrase not found: "${phrase}"`);
}

interface RawStimulus {
  id: string;
  title: string;
  source: string;
  target: string;
  original?: OriginalDocument;
  isFlawed: boolean;
  flawNote?: string;
  backtranslation: string;
  rationale: string;
  qeScore: number;
  qeSpans: { phrase: string; score: number; note?: string }[];
  /** [source phrase, target phrase] pairs. Target words not covered are shown as unaligned. */
  align: [string, string][];
}

function build(r: RawStimulus): Stimulus {
  const sourceTokens = toks(r.source);
  const targetTokens = toks(r.target);
  return {
    id: r.id,
    stakes: 'low',
    sourceLang: 'Korean',
    title: r.title,
    sourceTokens,
    targetTokens,
    original: r.original,
    isFlawed: r.isFlawed,
    flawNote: r.flawNote,
    explanations: {
      backtranslation: r.backtranslation,
      rationale: r.rationale,
      qe: {
        score: r.qeScore,
        spans: r.qeSpans.map((s) => ({ tgt: range(targetTokens, s.phrase), score: s.score, note: s.note })),
      },
      alignment: r.align.map(([s, t]) => ({ src: range(sourceTokens, s), tgt: range(targetTokens, t) })),
    },
  };
}

export const practiceStimulus: Stimulus = build({
  id: 'practice-wifi',
  title: 'Hotel amenities (practice)',
  original: { kind: 'html', src: 'documents/practice-wifi.html' },
  source: '와이파이는 모든 객실과 로비에서 무료로 이용하실 수 있습니다. 비밀번호는 프런트 데스크에 문의해 주세요.',
  target: 'Wi-Fi is available free of charge in all rooms and the lobby. Please ask the front desk for the password.',
  isFlawed: false,
  backtranslation: 'Wi-Fi can be used for free in all rooms and the lobby. Please ask the front desk for the password.',
  rationale:
    'The translation conveys both sentences accurately. "무료로" means "free of charge" and "모든 객실과 로비" means "all rooms and the lobby". The second sentence is a polite request to ask the front desk for the password, which is preserved.',
  qeScore: 94,
  qeSpans: [
    { phrase: 'Wi-Fi is available', score: 0.95 },
    { phrase: 'free of charge', score: 0.92 },
    { phrase: 'in all rooms and the lobby.', score: 0.9 },
    { phrase: 'Please ask the front desk for the password.', score: 0.93 },
  ],
  align: [
    ['와이파이는', 'Wi-Fi'],
    ['모든 객실과 로비에서', 'in all rooms and the lobby.'],
    ['무료로', 'free of charge'],
    ['이용하실 수 있습니다.', 'is available'],
    ['비밀번호는', 'for the password.'],
    ['프런트 데스크에', 'the front desk'],
    ['문의해 주세요.', 'Please ask'],
  ],
});

export const trialStimuli: Stimulus[] = [
  build({
    id: 'hotel-checkin-correct',
    title: 'Check-in and breakfast policy',
    original: { kind: 'pdf', src: 'documents/hotel-checkin.pdf' },
    source:
      '체크인은 오후 3시부터, 체크아웃은 오전 11시까지입니다. 조식은 객실 요금에 포함되어 있지 않으며, 1인당 15,000원입니다. 체크인 3일 전까지 취소하시면 전액 환불됩니다.',
    target:
      'Check-in is from 3 PM, and check-out is until 11 AM. Breakfast is not included in the room rate and costs 15,000 won per person. Cancellations made up to 3 days before check-in receive a full refund.',
    isFlawed: false,
    backtranslation:
      'Check-in starts at 3 PM and check-out is by 11 AM. Breakfast is not included in the room price and is 15,000 won per person. If you cancel up to 3 days before check-in, you will be fully refunded.',
    rationale:
      'The translation is faithful. Times (3 PM / 11 AM), the breakfast price (15,000 won per person) and the cancellation window (3 days before check-in) all match the source. The negation "포함되어 있지 않으며" (is not included) is correctly preserved.',
    qeScore: 91,
    qeSpans: [
      { phrase: 'Check-in is from 3 PM,', score: 0.94 },
      { phrase: 'and check-out is until 11 AM.', score: 0.88 },
      { phrase: 'Breakfast is not included in the room rate', score: 0.9 },
      { phrase: 'and costs 15,000 won per person.', score: 0.93 },
      { phrase: 'Cancellations made up to 3 days before check-in', score: 0.82, note: 'Slight rephrasing of the source' },
      { phrase: 'receive a full refund.', score: 0.91 },
    ],
    align: [
      ['체크인은 오후 3시부터,', 'Check-in is from 3 PM,'],
      ['체크아웃은 오전 11시까지입니다.', 'and check-out is until 11 AM.'],
      ['조식은', 'Breakfast'],
      ['객실 요금에', 'in the room rate'],
      ['포함되어 있지 않으며,', 'is not included'],
      ['1인당 15,000원입니다.', 'and costs 15,000 won per person.'],
      ['체크인 3일 전까지', 'up to 3 days before check-in'],
      ['취소하시면', 'Cancellations made'],
      ['전액 환불됩니다.', 'receive a full refund.'],
    ],
  }),
  build({
    id: 'hotel-parking-flawed',
    title: 'Parking and pool information',
    original: { kind: 'html', src: 'documents/hotel-parking.html' },
    source:
      '주차는 투숙객에게 무료로 제공됩니다. 단, 외부 방문객은 시간당 3,000원의 요금이 부과됩니다. 수영장은 오전 7시부터 오후 10시까지 운영되며, 13세 미만 어린이는 보호자와 동반해야 합니다.',
    target:
      'Parking is provided free of charge to guests and visitors. However, outside visitors are charged 3,000 won per day. The pool is open from 7 AM to 10 PM, and children under 13 must be accompanied by a guardian.',
    isFlawed: true,
    flawNote: 'Adds "and visitors" (contradiction) and mistranslates 시간당 (per hour) as "per day".',
    backtranslation:
      'Parking is free for guests and visitors. However, outside visitors pay 3,000 won per day. The pool operates from 7 AM to 10 PM, and children under 13 must be with a guardian.',
    rationale:
      'The translation is mostly accurate. The pool hours and the rule about children under 13 match the source. The parking sentence is fluent, and the fee for outside visitors is translated as 3,000 won per day.',
    qeScore: 63,
    qeSpans: [
      { phrase: 'Parking is provided free of charge', score: 0.9 },
      { phrase: 'to guests', score: 0.85 },
      { phrase: 'and visitors.', score: 0.18, note: 'Possible addition: no clear counterpart in the source' },
      { phrase: 'However, outside visitors are charged', score: 0.8 },
      { phrase: '3,000 won', score: 0.9 },
      { phrase: 'per day.', score: 0.22, note: 'Possible mistranslation of a time unit' },
      { phrase: 'The pool is open from 7 AM to 10 PM,', score: 0.92 },
      { phrase: 'and children under 13 must be accompanied by a guardian.', score: 0.89 },
    ],
    align: [
      ['주차는', 'Parking'],
      ['투숙객에게', 'to guests'],
      ['무료로 제공됩니다.', 'is provided free of charge'],
      ['단,', 'However,'],
      ['외부 방문객은', 'outside visitors'],
      ['시간당', 'per day.'],
      ['3,000원의', '3,000 won'],
      ['요금이 부과됩니다.', 'are charged'],
      ['수영장은', 'The pool'],
      ['오전 7시부터 오후 10시까지 운영되며,', 'is open from 7 AM to 10 PM,'],
      ['13세 미만 어린이는', 'and children under 13'],
      ['보호자와 동반해야 합니다.', 'must be accompanied by a guardian.'],
    ],
  }),
  build({
    id: 'hotel-breakfast-flawed',
    title: 'Room rate details',
    original: { kind: 'html', src: 'documents/hotel-rates.html' },
    source:
      '모든 객실 요금에는 부가세 10%가 포함되어 있습니다. 조식 뷔페는 오전 6시 30분부터 9시 30분까지 2층 레스토랑에서 제공됩니다. 반려동물은 동반하실 수 없습니다.',
    target:
      'A 10% VAT is not included in all room rates. The breakfast buffet is served from 6:30 to 9:30 AM at the restaurant on the 2nd floor. Pets are not allowed.',
    isFlawed: true,
    flawNote: 'Negation flip: VAT IS included in the source.',
    backtranslation:
      'All room rates do not include 10% VAT. The breakfast buffet is served from 6:30 to 9:30 AM in the 2nd-floor restaurant. Pets are not permitted.',
    rationale:
      'The first sentence states that room rates do not include a 10% VAT, which would mean guests pay extra. The breakfast times and location match the source, and the pet policy is translated correctly.',
    qeScore: 71,
    qeSpans: [
      { phrase: 'A 10% VAT', score: 0.86 },
      { phrase: 'is not included', score: 0.31, note: 'Polarity may differ from the source' },
      { phrase: 'in all room rates.', score: 0.84 },
      { phrase: 'The breakfast buffet is served from 6:30 to 9:30 AM', score: 0.9 },
      { phrase: 'at the restaurant on the 2nd floor.', score: 0.88 },
      { phrase: 'Pets are not allowed.', score: 0.95 },
    ],
    align: [
      ['모든 객실 요금에는', 'in all room rates.'],
      ['부가세 10%가', 'A 10% VAT'],
      ['포함되어 있습니다.', 'is not included'],
      ['조식 뷔페는', 'The breakfast buffet'],
      ['오전 6시 30분부터 9시 30분까지', 'from 6:30 to 9:30 AM'],
      ['2층 레스토랑에서', 'at the restaurant on the 2nd floor.'],
      ['제공됩니다.', 'is served'],
      ['반려동물은', 'Pets'],
      ['동반하실 수 없습니다.', 'are not allowed.'],
    ],
  }),
];
