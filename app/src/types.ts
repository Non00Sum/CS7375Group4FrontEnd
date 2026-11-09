export type ExplanationType = 'backtranslation' | 'rationale' | 'qe' | 'alignment';

/** Half-open token range [start, end). */
export type TokenRange = [number, number];

export interface QESpan {
  tgt: TokenRange;
  /** 0 = very likely an error, 1 = very likely fine. */
  score: number;
  note?: string;
}

export interface AlignLink {
  src: TokenRange;
  tgt: TokenRange;
}

/** The original document as participants would encounter it.
 *  `src` is a URL: an imported asset URL, a path under public/, or an absolute URL. */
export interface OriginalDocument {
  kind: 'pdf' | 'html' | 'image';
  src: string;
}

/** Each notice has a correct and a deliberately flawed English translation. */
export type TranslationVersion = 'correct' | 'flawed';

/** `null` = not produced yet (shown as "pending"). */
export interface StimulusExplanations {
  backtranslation: string | null;
  rationale: string | null;
  qe: { score: number; spans: QESpan[] } | null;
  alignment: AlignLink[] | null;
}

export interface KeyQuestion {
  question: string;
  /** Options; `key` says which reading each reflects. Never shown to participants. */
  choices: { label: string; key: TranslationVersion }[];
}

/** One notice in one translation version, ready to render. */
export interface Stimulus {
  /** Notice id from notices.json (e.g. "p2_med"). */
  id: string;
  version: TranslationVersion;
  stakes: 'low' | 'high';
  setting: string;
  sourceLang: string;
  title: string;
  /** The situation the participant imagines being in. */
  scenario: string;
  sourceTokens: string[];
  /** Token indices that start a new paragraph. */
  sourceBreaks: number[];
  targetTokens: string[];
  targetBreaks: number[];
  /** Optional full original for context; the tokens above remain the source of truth for the text. */
  original?: OriginalDocument;
  /** Ground truth for analysis only; never shown to participants. */
  isFlawed: boolean;
  flawNote?: string;
  keyQuestion: KeyQuestion;
  explanations: StimulusExplanations;
  /** True if the explanations are placeholder mock content. */
  explanationsMock: boolean;
}

export type Decision = 'accept' | 'reject';

export interface DecisionRecord {
  decision: Decision;
  confidence: number; // 1-7
  at: number;
}

export interface RankingRecord {
  /** Labels (A, B, ...) best → worst. */
  order: string[];
  /** Same order, as explanation types. */
  types: ExplanationType[];
  /** Randomized order the list started in (labels). */
  initialOrder: string[];
  /** False if the participant submitted the starting order unchanged. */
  changed: boolean;
  justification: string;
}

export type TrialStep = 'baseline' | 'reveal' | 'question' | 'rank';

export interface OriginalViewRecord {
  step: TrialStep;
  ms: number;
  maxZoom: number;
}

export interface ComprehensionRecord {
  question: string;
  /** Label chosen, or "unsure". */
  choice: string;
  /** Which reading the chosen option reflects: the true meaning, the flawed translation's, or unsure. */
  answerKey: TranslationVersion | 'unsure';
  /** answerKey === 'correct'. */
  isRight: boolean;
  /** Labels in the (shuffled) order shown. */
  optionOrder: string[];
  at: number;
}

export interface TrialResult {
  stimulusId: string;
  version: TranslationVersion;
  stakes: 'low' | 'high';
  isFlawed: boolean;
  tutorial: boolean;
  explanationOrder: ExplanationType[];
  baseline: DecisionRecord;
  revised: DecisionRecord;
  comprehension: ComprehensionRecord;
  rankings: Record<string, RankingRecord>;
  tabViewMs: Record<ExplanationType, number>;
  alignmentHovers: number;
  /** Each time the participant opened the original-document viewer. */
  originalViews: OriginalViewRecord[];
  startedAt: number;
  completedAt: number;
}

export type SurveyAnswers = Record<string, string | number | string[]>;

/** How the session was run: researcher present in person, over video call, or self-serve link. */
export type SessionMode = 'moderated' | 'remote' | 'online';

export interface SessionRecord {
  sessionId: string;
  pid: string;
  condition: number;
  mode: SessionMode;
  startedAt: number;
  userAgent: string;
  consent?: number;
  pre?: SurveyAnswers;
  trials: TrialResult[];
  post?: SurveyAnswers;
  completedAt?: number;
}
