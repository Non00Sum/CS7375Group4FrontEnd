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

/** The original document as participants would encounter it (PDF or saved web page).
 *  `src` is relative to the site root (files live in public/documents/) or an absolute URL. */
export interface OriginalDocument {
  kind: 'pdf' | 'html';
  src: string;
}

export interface Stimulus {
  id: string;
  stakes: 'low' | 'high';
  sourceLang: string;
  title: string;
  /** Source text split into display tokens (Korean: eojeol / morpheme spans from the pipeline). */
  sourceTokens: string[];
  targetTokens: string[];
  /** Optional full original for context; the tokens above remain the source of truth for the text. */
  original?: OriginalDocument;
  /** Ground truth for analysis only; never shown to participants. */
  isFlawed: boolean;
  flawNote?: string;
  explanations: {
    backtranslation: string;
    rationale: string;
    qe: { score: number; spans: QESpan[] };
    alignment: AlignLink[];
  };
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

export interface OriginalViewRecord {
  step: 'baseline' | 'reveal' | 'rank';
  ms: number;
  maxZoom: number;
}

export interface TrialResult {
  stimulusId: string;
  isFlawed: boolean;
  tutorial: boolean;
  explanationOrder: ExplanationType[];
  baseline: DecisionRecord;
  revised: DecisionRecord;
  rankings: Record<string, RankingRecord>;
  tabViewMs: Record<ExplanationType, number>;
  alignmentHovers: number;
  /** Each time the participant opened the original-document viewer. */
  originalViews: OriginalViewRecord[];
  startedAt: number;
  completedAt: number;
}

export type SurveyAnswers = Record<string, string | number | string[]>;

export interface SessionRecord {
  sessionId: string;
  pid: string;
  condition: number;
  startedAt: number;
  userAgent: string;
  consent?: number;
  pre?: SurveyAnswers;
  trials: TrialResult[];
  post?: SurveyAnswers;
  completedAt?: number;
}
