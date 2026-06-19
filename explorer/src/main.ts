import "./style.css";
import { SIX_MENS } from "./board";
import {
  selectGame,
  startPos,
  legalMoves,
  positionValue,
  terminalValue,
  WHITE,
  type Pos,
  type Val,
  type Move,
} from "./engine";

const SVGNS = "http://www.w3.org/2000/svg";
const layout = SIX_MENS;
const POINT_LABELS = "abcdefghijklmnop".split("");
const SIZES = [4, 5, 6];
const SIZE_NAMES: Record<number, string> = { 4: "Four", 5: "Five", 6: "Six" };

// --- DOM ---
const svg = document.getElementById("board") as unknown as SVGSVGElement;
const verdictEl = document.getElementById("verdict")!;
const countsEl = document.getElementById("counts")!;
const lineEl = document.getElementById("line")!;
const movesEl = document.getElementById("moves")!;
const undoBtn = document.getElementById("undo") as HTMLButtonElement;
const resetBtn = document.getElementById("reset") as HTMLButtonElement;
const titleEl = document.getElementById("title")!;
const sizesEl = document.getElementById("sizes")!;

// --- state ---
let men = 6;
let path: Pos[] = [];
let sans: string[] = [];
let ptr = 0;
let selectedSource: number | null = null;
let pendingCapture: Move[] | null = null;
let hotMove: Move | null = null; // move hovered in the list (highlighted on the board)
let view: { term: Val; moves: Move[] } = { term: 3, moves: [] };

const current = () => path[ptr];
const sideName = (turn: number) => (turn === WHITE ? "White" : "Black");
const moverHand = (p: Pos) => (p.turn === WHITE ? p.wHand : p.bHand);
const valClass = (v: Val) => ["win", "loss", "draw", "unknown"][v];
const valRank = (v: Val) => [2, 0, 1, -1][v]; // win > draw > loss
const popcount = (x: number) => { let n = 0; while (x) { x &= x - 1; n++; } return n; };

function notate(m: Move): string {
  const to = POINT_LABELS[m.to];
  let s = m.from === null ? to : `${POINT_LABELS[m.from]}–${to}`;
  if (m.captured !== null) s += `×${POINT_LABELS[m.captured]}`;
  return s;
}

function el(tag: string, attrs: Record<string, string | number>): SVGElement {
  const e = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
}

function occupant(p: Pos, point: number): 0 | 1 | 2 {
  if ((p.white >>> point) & 1) return WHITE;
  if ((p.black >>> point) & 1) return 2;
  return 0;
}

function pushTo<K>(map: Map<K, Move[]>, key: K, m: Move) {
  const arr = map.get(key);
  if (arr) arr.push(m);
  else map.set(key, [m]);
}

function bestValueTo(moves: Move[]): Val {
  return moves.reduce<Val>((b, m) => (valRank(m.value) > valRank(b) ? m.value : b), 1 as Val);
}

interface Affordance { role: string; value: Val }

function affordances(moves: Move[]): Map<number, Affordance> {
  const a = new Map<number, Affordance>();
  if (pendingCapture) {
    for (const m of pendingCapture) if (m.captured != null) a.set(m.captured, { role: "capture", value: m.value });
    return a;
  }
  if (moverHand(current()) > 0) {
    const byTarget = new Map<number, Move[]>();
    for (const m of moves) if (m.from === null) pushTo(byTarget, m.to, m);
    for (const [to, ms] of byTarget) a.set(to, { role: "place", value: bestValueTo(ms) });
    return a;
  }
  if (selectedSource === null) {
    const bySource = new Map<number, Move[]>();
    for (const m of moves) if (m.from !== null) pushTo(bySource, m.from, m);
    for (const [from, ms] of bySource) a.set(from, { role: "source", value: bestValueTo(ms) });
  } else {
    a.set(selectedSource, { role: "selected", value: 3 });
    const byDest = new Map<number, Move[]>();
    for (const m of moves) if (m.from === selectedSource) pushTo(byDest, m.to, m);
    for (const [to, ms] of byDest) a.set(to, { role: "dest", value: bestValueTo(ms) });
    for (const m of moves) if (m.from !== null && m.from !== selectedSource && !a.has(m.from)) a.set(m.from, { role: "source", value: 3 });
  }
  return a;
}

function renderBoard() {
  const aff = affordances(view.moves);
  const hot = new Set<number>();
  if (hotMove) {
    if (hotMove.from !== null) hot.add(hotMove.from);
    hot.add(hotMove.to);
    if (hotMove.captured !== null) hot.add(hotMove.captured);
  }
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  for (const [a1, b1] of layout.edges) {
    const [x1, y1] = layout.points[a1];
    const [x2, y2] = layout.points[b1];
    svg.appendChild(el("line", { x1, y1, x2, y2, class: "edge" }));
  }
  for (let p = 0; p < layout.points.length; p++) {
    const [x, y] = layout.points[p];
    const g = el("g", { class: "pt", "data-p": p });
    const occ = occupant(current(), p);
    // a light node disc masks the crossing lines and carries the point letter
    g.appendChild(el("circle", { cx: x, cy: y, r: 0.19, class: "node" }));
    if (!occ) {
      const t = el("text", { x, y, class: "lbl", "text-anchor": "middle", "dominant-baseline": "central" });
      t.textContent = POINT_LABELS[p];
      g.appendChild(t);
    }
    const af = aff.get(p);
    if (af) {
      const cls = `aff ${af.role} ${valClass(af.value)}${hot.has(p) ? " hot" : ""}`;
      g.appendChild(el("circle", { cx: x, cy: y, r: 0.4, class: cls }));
    } else if (hot.has(p)) {
      g.appendChild(el("circle", { cx: x, cy: y, r: 0.4, class: `aff ${hotMove!.captured === p ? "capture" : "neutral"} hot` }));
    }
    if (occ) g.appendChild(el("circle", { cx: x, cy: y, r: 0.33, class: occ === WHITE ? "stone white" : "stone black" }));
    if (af) {
      g.addEventListener("click", () => onClickPoint(p));
      g.classList.add("clickable");
    }
    svg.appendChild(g);
  }
}

function renderPanel() {
  const cur = current();
  const term = view.term;
  // verdict
  let text: string;
  let cls: string;
  if (term !== 3) {
    cls = valClass(term);
    text = `Game over — ${sideName(cur.turn)} ${term === 1 ? "is lost" : term === 2 ? "is drawn" : "has won"}.`;
  } else {
    const v = positionValue(cur);
    cls = valClass(v);
    text = `${sideName(cur.turn)} to move ${["is winning", "is losing", "draws", "—"][v]}.`;
  }
  verdictEl.className = `verdict ${cls}`;
  verdictEl.textContent = text;
  countsEl.innerHTML = `W ${popcount(cur.white)}+${cur.wHand}<br>B ${popcount(cur.black)}+${cur.bHand}`;
  undoBtn.disabled = ptr === 0;

  // scoresheet
  if (sans.length === 0) {
    lineEl.innerHTML = `<span class="lempty">No moves yet.</span>`;
  } else {
    lineEl.innerHTML = "";
    for (let i = 0; i < sans.length; i += 2) {
      const row = document.createElement("div");
      row.className = "lrow";
      row.innerHTML = `<span class="lnum">${i / 2 + 1}.</span>`;
      for (const j of [i, i + 1]) {
        if (j < sans.length) {
          const ply = document.createElement("span");
          ply.className = `ply${j === ptr - 1 ? " cur" : ""}`;
          ply.textContent = sans[j];
          ply.addEventListener("click", () => jumpTo(j + 1));
          row.appendChild(ply);
        } else {
          row.appendChild(document.createElement("span"));
        }
      }
      lineEl.appendChild(row);
    }
  }

  // ranked moves
  movesEl.innerHTML = "";
  if (term !== 3) {
    movesEl.innerHTML = `<div class="grouphdr">game over</div>`;
    hotMove = null;
    return;
  }
  const groups: [string, Val, string][] = [
    ["winning", 0, "win"],
    ["drawing", 2, "draw"],
    ["losing", 1, "loss"],
  ];
  for (const [label, val, cl] of groups) {
    const ms = view.moves.filter((m) => m.value === val).sort((a, b) => a.to - b.to || (a.from ?? -1) - (b.from ?? -1));
    if (ms.length === 0) continue;
    const h = document.createElement("div");
    h.className = `grouphdr ${cl}`;
    h.textContent = `${label} — ${ms.length}`;
    movesEl.appendChild(h);
    for (const m of ms) {
      const row = document.createElement("div");
      row.className = "move";
      row.innerHTML = `<span class="mv">${notate(m)}</span><span class="badge ${cl}">${["W", "L", "D"][val]}</span>`;
      row.addEventListener("click", () => playMove(m));
      row.addEventListener("mouseenter", () => { hotMove = m; renderBoard(); });
      row.addEventListener("mouseleave", () => { hotMove = null; renderBoard(); });
      movesEl.appendChild(row);
    }
  }
}

function render() {
  const cur = current();
  view.term = terminalValue(cur);
  view.moves = view.term === 3 ? legalMoves(cur) : [];
  renderPanel();
  renderBoard();
}

// --- interaction ---
function onClickPoint(point: number) {
  const moves = view.moves;
  if (pendingCapture) {
    const m = pendingCapture.find((x) => x.captured === point);
    if (m) playMove(m);
    return;
  }
  if (moverHand(current()) > 0) {
    resolve(moves.filter((m) => m.from === null && m.to === point));
    return;
  }
  const movable = moves.some((m) => m.from === point);
  if (selectedSource === null) {
    if (movable) { selectedSource = point; renderBoard(); }
    return;
  }
  if (point === selectedSource) { selectedSource = null; renderBoard(); return; }
  if (movable) { selectedSource = point; renderBoard(); return; }
  resolve(moves.filter((m) => m.from === selectedSource && m.to === point));
}

function resolve(candidates: Move[]) {
  if (candidates.length === 0) return;
  if (candidates.length === 1) playMove(candidates[0]);
  else { pendingCapture = candidates; renderBoard(); }
}

function playMove(m: Move) {
  path = path.slice(0, ptr + 1);
  sans = sans.slice(0, ptr);
  path.push(m.result);
  sans.push(notate(m));
  ptr++;
  selectedSource = null;
  pendingCapture = null;
  hotMove = null;
  render();
}

function jumpTo(i: number) {
  ptr = i;
  selectedSource = null;
  pendingCapture = null;
  hotMove = null;
  render();
}

undoBtn.addEventListener("click", () => { if (ptr > 0) jumpTo(ptr - 1); });
resetBtn.addEventListener("click", () => { path = [startPos()]; sans = []; jumpTo(0); });

// --- size toggle ---
function buildSizeButtons() {
  sizesEl.innerHTML = "";
  for (const m of SIZES) {
    const b = document.createElement("button");
    b.textContent = `${m}`;
    b.dataset.men = String(m);
    b.className = m === men ? "active" : "";
    b.addEventListener("click", () => setSize(m));
    sizesEl.appendChild(b);
  }
}

async function setSize(m: number) {
  men = m;
  for (const b of Array.from(sizesEl.children) as HTMLButtonElement[]) {
    b.className = Number(b.dataset.men) === m ? "active" : "";
  }
  titleEl.textContent = `${SIZE_NAMES[m]} Men's Morris`;
  verdictEl.className = "verdict draw";
  verdictEl.textContent = "Loading tablebase…";
  await selectGame(m, `${import.meta.env.BASE_URL}morris${m}.tb`);
  path = [startPos()];
  sans = [];
  ptr = 0;
  selectedSource = null;
  pendingCapture = null;
  hotMove = null;
  render();
}

async function main() {
  buildSizeButtons();
  try {
    await setSize(6);
  } catch (e) {
    console.error("[explorer] load failed", e);
    verdictEl.textContent = `Failed to load the solver: ${(e as Error).message}`;
  }
}

main();
