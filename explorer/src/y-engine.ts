//! Thin typed wrapper over the Y WASM engine. The browser does no Y rules of its
//! own: legal moves and perfect-play values come from the validated Rust engine,
//! which solves the chosen side in WASM on construction (side <= 5 is small enough
//! to solve on load, so no tablebase file is shipped).

import init, { YExplorer } from "game-solver-wasm";
import wasmUrl from "game-solver-wasm/game_solver_wasm_bg.wasm?url";

/** 0 win, 1 loss, 2 draw, 3 unknown (from the relevant side's perspective). */
export type Val = 0 | 1 | 2 | 3;

/** A Y position: two stone bitmasks. Side to move is derived from the counts. */
export interface YPos {
  p1: number;
  p2: number;
}

export interface YMove {
  to: number; // the cell the stone is placed on
  value: Val; // worth to the mover
  result: YPos;
}

let explorer: YExplorer | null = null;
let initialized = false;

/** Build (and strongly solve, in WASM) the side-`n` board. */
export async function selectSide(n: number): Promise<void> {
  if (!initialized) {
    await init({ module_or_path: wasmUrl });
    initialized = true;
  }
  if (explorer) {
    explorer.free();
    explorer = null;
  }
  explorer = new YExplorer(n);
}

export function side(): number {
  return explorer!.side();
}

export function startPos(): YPos {
  const a = explorer!.start();
  return { p1: a[0], p2: a[1] };
}

export function positionValue(p: YPos): Val {
  return explorer!.value(p.p1, p.p2) as Val;
}

/** Terminal value for the side to move (0/1/2), or 3 if not terminal. */
export function terminalValue(p: YPos): Val {
  return explorer!.terminal(p.p1, p.p2) as Val;
}

export function legalMoves(p: YPos): YMove[] {
  const flat = explorer!.legal_moves(p.p1, p.p2);
  const before = (p.p1 | p.p2) >>> 0;
  const out: YMove[] = [];
  for (let i = 0; i < flat.length; i += 3) {
    const result: YPos = { p1: flat[i], p2: flat[i + 1] };
    const placed = ((result.p1 | result.p2) >>> 0) & ~before;
    out.push({ to: bitIndex(placed), value: flat[i + 2] as Val, result });
  }
  return out;
}

function bitIndex(mask: number): number {
  let i = 0;
  while (i < 32 && ((mask >>> i) & 1) === 0) i++;
  return i;
}
