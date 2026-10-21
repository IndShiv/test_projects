import { random } from "remotion";

// All data is deterministic so every render looks identical.

export type Point = { x: number; y: number };

// The "true" pattern hidden in the data.
export const trueFn = (x: number) => Math.sin(2 * Math.PI * x) * 0.9;

const noise = (seed: string) => (random(seed) - 0.5) * 0.12;

// Training noise alternates up/down so the overfit curve visibly zig-zags.
const trainNoise = [0.14, -0.2, 0.18, -0.17, 0.2, -0.18, 0.17, -0.2, 0.16, -0.12];

export const trainPoints: Point[] = trainNoise.map((n, i) => {
  const x = 0.05 + (0.9 * i) / 9;
  return { x, y: trueFn(x) + n };
});

// New data sits between the training points, where the overfit curve swings most.
export const testPoints: Point[] = trainPoints.slice(0, -1).map((p, i) => {
  const x = (p.x + trainPoints[i + 1].x) / 2;
  return { x, y: trueFn(x) + noise(`test-${i}`) };
});

// Least-squares polynomial fit (x mapped to [-1, 1] for stability).
const polyFit = (points: Point[], degree: number) => {
  const n = degree + 1;
  const t = (x: number) => x * 2 - 1;
  const A: number[][] = Array.from({ length: n }, () => new Array(n + 1).fill(0));
  for (const p of points) {
    const powers = Array.from({ length: n }, (_, k) => t(p.x) ** k);
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) A[r][c] += powers[r] * powers[c];
      A[r][n] += powers[r] * p.y;
    }
  }
  // Gaussian elimination
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(A[r][col]) > Math.abs(A[pivot][col])) pivot = r;
    }
    [A[col], A[pivot]] = [A[pivot], A[col]];
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = A[r][col] / A[col][col];
      for (let c = col; c <= n; c++) A[r][c] -= f * A[col][c];
    }
  }
  const coeffs = A.map((row, i) => row[n] / row[i]);
  return (x: number) => coeffs.reduce((sum, c, k) => sum + c * t(x) ** k, 0);
};

// Interpolates every training point exactly: the textbook overfit.
const lagrange = (points: Point[]) => (x: number) =>
  points.reduce((sum, pi, i) => {
    let term = pi.y;
    points.forEach((pj, j) => {
      if (i !== j) term *= (x - pj.x) / (pi.x - pj.x);
    });
    return sum + term;
  }, 0);

export const models = {
  underfit: polyFit(trainPoints, 1),
  goodFit: polyFit(trainPoints, 3),
  overfit: lagrange(trainPoints),
};

export const mse = (fn: (x: number) => number, points: Point[]) =>
  points.reduce((s, p) => s + (fn(p.x) - p.y) ** 2, 0) / points.length;

// Classic error-vs-complexity curves for the final scene (complexity c in [0, 1]).
export const trainErrorCurve = (c: number) => 0.85 * Math.exp(-3.2 * c) + 0.04;
export const testErrorCurve = (c: number) =>
  trainErrorCurve(c) + 0.06 + 0.9 * Math.max(0, c - 0.2) ** 2.4;

export const sweetSpot = (() => {
  let best = 0;
  for (let c = 0; c <= 1; c += 0.001) {
    if (testErrorCurve(c) < testErrorCurve(best)) best = c;
  }
  return best;
})();
