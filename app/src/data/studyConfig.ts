/**
 * Which notices are used and how. Ids refer to translation-experiment-data/notices.json.
 * (Kept free of Vite-only code so `npm run check-data` can import it.)
 */
import type { TranslationVersion } from '../types';

/** Shown to every participant, rotated by condition. Use an even number per stakes level so each
 *  participant gets the same number of flawed and correct translations within each stakes level. */
export const MAIN_SET = ['p2_med', 'p4_med', 'p3_hotel', 'p6_hotel'];

/** There is no separate practice notice: the first notice of each session shows "how to read this" hints
 *  instead. Since the order rotates by condition, each notice is the hinted one in exactly one condition. */

/**
 * Which translation each participant sees, balanced across the 4 conditions.
 * Notices are grouped by stakes (in MAIN_SET order). Within each group, flawed/correct alternate, and the
 * starting point flips per condition, so that:
 *   - every participant sees one flawed + one correct notice per stakes level (with 2 per level),
 *   - every notice is flawed for exactly half the conditions.
 *            high stakes   low stakes
 *   cond 0:  F C           F C
 *   cond 1:  C F           C F
 *   cond 2:  F C           C F
 *   cond 3:  C F           F C
 */
const FLIPS = [
  [0, 0],
  [1, 1],
  [0, 1],
  [1, 0],
];

export function assignVersions(
  docs: { id: string; stakes: string }[],
  condition: number,
): Record<string, TranslationVersion> {
  const groups: string[][] = [];
  const groupOf = new Map<string, number>();
  for (const { id, stakes } of docs) {
    if (!groupOf.has(stakes)) {
      groupOf.set(stakes, groups.length);
      groups.push([]);
    }
    groups[groupOf.get(stakes)!].push(id);
  }
  const out: Record<string, TranslationVersion> = {};
  groups.forEach((g, gi) => {
    const flip = FLIPS[condition % FLIPS.length][gi % 2];
    g.forEach((id, i) => (out[id] = (i + flip) % 2 === 0 ? 'flawed' : 'correct'));
  });
  return out;
}
