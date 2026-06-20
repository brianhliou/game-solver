//! Geometry for the triangular Y board of side `n`: `n` rows, row `r` holding
//! `r+1` cells, indexed `idx(r,c) = r*(r+1)/2 + c`. Cells sit on a triangular grid
//! (apex at top), with the six-neighbour hex adjacency under which Hex reduces to
//! Y. The three sides of the triangle are the goals a player must all connect.

export interface YLayout {
  side: number;
  cells: number;
  points: [number, number][]; // SVG coords per cell
  edges: [number, number][]; // adjacency pairs (a < b) for the grid lines
  sideA: number[]; // bottom row (r == n-1)
  sideB: number[]; // left edge (c == 0)
  sideC: number[]; // right edge (c == r)
}

const H = Math.sqrt(3) / 2;

export function yLayout(n: number): YLayout {
  const idx = (r: number, c: number) => (r * (r + 1)) / 2 + c;
  const cells = (n * (n + 1)) / 2;
  const points: [number, number][] = new Array(cells);
  for (let r = 0; r < n; r++) {
    for (let c = 0; c <= r; c++) points[idx(r, c)] = [c - r / 2, r * H];
  }

  const seen = new Set<string>();
  const edges: [number, number][] = [];
  const nb: [number, number][] = [[0, -1], [0, 1], [-1, -1], [-1, 0], [1, 0], [1, 1]];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c <= r; c++) {
      const i = idx(r, c);
      for (const [dr, dc] of nb) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < n && nc >= 0 && nc <= nr) {
          const j = idx(nr, nc);
          const a = Math.min(i, j);
          const b = Math.max(i, j);
          const key = `${a},${b}`;
          if (!seen.has(key)) {
            seen.add(key);
            edges.push([a, b]);
          }
        }
      }
    }
  }

  const sideA: number[] = [];
  const sideB: number[] = [];
  const sideC: number[] = [];
  for (let r = 0; r < n; r++) {
    sideB.push(idx(r, 0));
    sideC.push(idx(r, r));
  }
  for (let c = 0; c < n; c++) sideA.push(idx(n - 1, c));

  return { side: n, cells, points, edges, sideA, sideB, sideC };
}

export function viewBox(l: YLayout): string {
  let xmin = Infinity, xmax = -Infinity, ymin = Infinity, ymax = -Infinity;
  for (const [x, y] of l.points) {
    xmin = Math.min(xmin, x);
    xmax = Math.max(xmax, x);
    ymin = Math.min(ymin, y);
    ymax = Math.max(ymax, y);
  }
  const pad = 0.8;
  return `${xmin - pad} ${ymin - pad} ${xmax - xmin + 2 * pad} ${ymax - ymin + 2 * pad}`;
}
