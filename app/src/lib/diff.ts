export type DiffPart = { text: string; kind: 'same' | 'added' | 'removed' };

const norm = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}%]/gu, '');

/** Word-level LCS diff of `b` against `a`. */
export function wordDiff(a: string, b: string): DiffPart[] {
  const A = a.split(/\s+/).filter(Boolean);
  const B = b.split(/\s+/).filter(Boolean);
  const dp = Array.from({ length: A.length + 1 }, () => new Array<number>(B.length + 1).fill(0));
  for (let i = A.length - 1; i >= 0; i--)
    for (let j = B.length - 1; j >= 0; j--)
      dp[i][j] = norm(A[i]) === norm(B[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);

  const out: DiffPart[] = [];
  let i = 0;
  let j = 0;
  while (i < A.length || j < B.length) {
    if (i < A.length && j < B.length && norm(A[i]) === norm(B[j])) {
      out.push({ text: B[j], kind: 'same' });
      i++;
      j++;
    } else if (j < B.length && (i >= A.length || dp[i][j + 1] >= dp[i + 1][j])) {
      out.push({ text: B[j++], kind: 'added' });
    } else {
      out.push({ text: A[i++], kind: 'removed' });
    }
  }
  return out;
}
