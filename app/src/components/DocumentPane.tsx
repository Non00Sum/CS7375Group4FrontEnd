import { Fragment, useMemo, useState } from 'react';
import type { AlignLink, ExplanationType, Stimulus } from '../types';

interface Props {
  stimulus: Stimulus;
  /** Which explanation (if any) is currently overlaid on the document. */
  overlay: ExplanationType | null;
  onAlignmentHover?: () => void;
  onViewOriginal?: () => void;
}

const inRange = (i: number, [s, e]: [number, number]) => i >= s && i < e;

export function qeLevel(score: number): 'bad' | 'warn' | 'ok' {
  if (score < 0.4) return 'bad';
  if (score < 0.7) return 'warn';
  return 'ok';
}

export function DocumentPane({ stimulus, overlay, onAlignmentHover, onViewOriginal }: Props) {
  const [hovered, setHovered] = useState<AlignLink[]>([]);
  const { alignment, qe } = stimulus.explanations;
  const links = useMemo(() => alignment ?? [], [alignment]);
  // Overlays only apply once that explanation exists (null = still pending).
  const showAlign = overlay === 'alignment' && alignment !== null;
  const showQE = overlay === 'qe' && qe !== null;
  const srcBreaks = useMemo(() => new Set(stimulus.sourceBreaks), [stimulus.sourceBreaks]);
  const tgtBreaks = useMemo(() => new Set(stimulus.targetBreaks), [stimulus.targetBreaks]);

  const aligned = useMemo(() => {
    const s = new Set<number>();
    links.forEach((l) => {
      for (let i = l.tgt[0]; i < l.tgt[1]; i++) s.add(i);
    });
    return s;
  }, [links]);

  const hover = (side: 'src' | 'tgt', i: number) => {
    if (!showAlign) return;
    const hit = links.filter((l) => inRange(i, l[side]));
    const changed = hit.length !== hovered.length || hit.some((l, k) => l !== hovered[k]);
    if (hit.length && changed) onAlignmentHover?.();
    setHovered(hit);
  };
  const isHot = (side: 'src' | 'tgt', i: number) => hovered.some((l) => inRange(i, l[side]));

  return (
    <div className="doc-pane">
      <section className="doc-col">
        <div className="doc-col-head">
          <h3>
            Original document <span className="muted">({stimulus.sourceLang})</span>
          </h3>
          {stimulus.original && onViewOriginal && (
            <button className="small" onClick={onViewOriginal} title="See the full original document with its layout and surrounding context">
              ⤢ View original{stimulus.original.kind === 'pdf' ? ' (PDF)' : ''}
            </button>
          )}
        </div>
        <p className="doc-text source" lang="ko" onMouseLeave={() => setHovered([])}>
          {stimulus.sourceTokens.map((t, i) => (
            <Fragment key={i}>
              {srcBreaks.has(i) && <span className="para-break" />}
              <span
                className={`tok ${showAlign ? 'hoverable' : ''} ${showAlign && isHot('src', i) ? 'hot' : ''}`}
                onMouseEnter={() => hover('src', i)}
              >
                {t}
              </span>{' '}
            </Fragment>
          ))}
        </p>
      </section>
      <section className="doc-col">
        <h3>
          Machine translation <span className="muted">(English)</span>
        </h3>
        <p className="doc-text" onMouseLeave={() => setHovered([])}>
          {stimulus.targetTokens.map((t, i) => {
            const span = showQE ? qe!.spans.find((s) => inRange(i, s.tgt)) : undefined;
            const cls = ['tok'];
            if (span) cls.push(`qe-${qeLevel(span.score)}`);
            if (showAlign) {
              cls.push('hoverable');
              if (isHot('tgt', i)) cls.push('hot');
              if (!aligned.has(i)) cls.push('unaligned');
            }
            const title = span
              ? `Estimated quality: ${Math.round(span.score * 100)}/100${span.note ? ` — ${span.note}` : ''}`
              : showAlign && !aligned.has(i)
                ? 'No matching words found in the original'
                : undefined;
            return (
              <Fragment key={i}>
                {tgtBreaks.has(i) && <span className="para-break" />}
                <span className={cls.join(' ')} title={title} onMouseEnter={() => hover('tgt', i)}>
                  {t}
                </span>{' '}
              </Fragment>
            );
          })}
        </p>
      </section>
    </div>
  );
}
