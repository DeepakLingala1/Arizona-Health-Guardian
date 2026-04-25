// Tiny k-means for symptom-vector clustering. Pure TS, no deps.

export interface KmeansResult {
  centroids: number[][];
  assignments: number[];
}

function dist(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return Math.sqrt(s);
}

export function kmeans(points: number[][], k: number, maxIter = 25): KmeansResult {
  if (points.length === 0) return { centroids: [], assignments: [] };
  const dim = points[0].length;
  k = Math.min(k, points.length);

  // Init: pick k spread-out points (k-means++ lite)
  const centroids: number[][] = [points[Math.floor(Math.random() * points.length)].slice()];
  while (centroids.length < k) {
    const dists = points.map((p) => Math.min(...centroids.map((c) => dist(p, c))));
    const total = dists.reduce((a, b) => a + b, 0) || 1;
    let r = Math.random() * total;
    let pick = 0;
    for (let i = 0; i < dists.length; i++) {
      r -= dists[i];
      if (r <= 0) { pick = i; break; }
    }
    centroids.push(points[pick].slice());
  }

  let assignments = new Array(points.length).fill(0);
  for (let iter = 0; iter < maxIter; iter++) {
    let changed = false;
    for (let i = 0; i < points.length; i++) {
      let best = 0, bestD = Infinity;
      for (let c = 0; c < centroids.length; c++) {
        const d = dist(points[i], centroids[c]);
        if (d < bestD) { bestD = d; best = c; }
      }
      if (assignments[i] !== best) { assignments[i] = best; changed = true; }
    }
    // Recompute centroids
    const sums = Array.from({ length: k }, () => new Array(dim).fill(0));
    const counts = new Array(k).fill(0);
    for (let i = 0; i < points.length; i++) {
      const a = assignments[i];
      counts[a]++;
      for (let d = 0; d < dim; d++) sums[a][d] += points[i][d];
    }
    for (let c = 0; c < k; c++) {
      if (counts[c] > 0) {
        for (let d = 0; d < dim; d++) centroids[c][d] = sums[c][d] / counts[c];
      }
    }
    if (!changed) break;
  }

  return { centroids, assignments };
}
