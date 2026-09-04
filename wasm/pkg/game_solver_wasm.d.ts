/* tslint:disable */
/* eslint-disable */

/**
 * One morris board + its loaded WLD tablebase.
 */
export class Explorer {
    free(): void;
    [Symbol.dispose](): void;
    board_points(): number;
    has_tablebase(): boolean;
    /**
     * Legal moves as flat `u32` groups of 6: `[white, black, w_hand, b_hand,
     * turn, value]`, where `value` is the move's worth *to the mover*
     * (0 win, 1 loss, 2 draw, 3 unknown).
     */
    legal_moves(white: number, black: number, w_hand: number, b_hand: number, turn: number): Uint32Array;
    /**
     * `rings` = 2 (six men's, 16 points) or 3 (nine men's, 24 points); `men` per side.
     */
    constructor(rings: number, men: number);
    /**
     * Number of dense-index slots (the tablebase addresses these). f64 because it
     * can exceed u32.
     */
    num_states(): number;
    /**
     * Load the packed 2-bit WLD tablebase (gzip-decompressed bytes).
     */
    set_tablebase(bytes: Uint8Array): void;
    /**
     * The starting position `[white, black, w_hand, b_hand, turn]`.
     */
    start(): Uint32Array;
    /**
     * `Some` terminal value (0/1/2) for the side to move, or 3 if not terminal.
     */
    terminal(white: number, black: number, w_hand: number, b_hand: number, turn: number): number;
    /**
     * Perfect-play value for the side to move: 0 win, 1 loss, 2 draw, 3 unknown.
     */
    value(white: number, black: number, w_hand: number, b_hand: number, turn: number): number;
}

/**
 * One Y board (the Schensted-Titus connection game) plus its solved value table.
 *
 * Y at side <= 5 is small enough (side-5 = 3.49M dense-index positions) to solve
 * in the browser, so — unlike the morris explorer, which ships a precomputed tablebase —
 * the table is computed live by [`solve_y`] (in a worker) and wrapped here. The
 * wire format is `[p1, p2]` for a position (two stone bitmasks; the side to move
 * is derived from the counts) and groups of 3 (`p1, p2, value`) for moves, value
 * `0=win 1=loss 2=draw 3=unknown` for the mover.
 */
export class YExplorer {
    free(): void;
    [Symbol.dispose](): void;
    cells(): number;
    /**
     * Wrap a precomputed value table (from [`solve_y`], typically solved off the
     * main thread) into a probe-able explorer. `values` must have one byte per
     * dense index of the side-`n` board, exactly as `solve_y` returns.
     */
    static from_solution(side: number, values: Uint8Array): YExplorer;
    /**
     * Legal moves as flat `u32` groups of 3: `[p1, p2, value]`, where `value` is
     * the move's worth *to the mover* (0 win, 1 loss, 2 draw, 3 unknown).
     */
    legal_moves(p1: number, p2: number): Uint32Array;
    /**
     * Build the side-`n` board and strongly solve it inline (dense solver). This
     * blocks the caller; prefer the worker path ([`solve_y`] +
     * [`YExplorer::from_solution`]) for interactive use. Kept as a fallback.
     */
    constructor(side: number);
    side(): number;
    /**
     * The starting position `[p1, p2]` (empty board).
     */
    start(): Uint32Array;
    /**
     * `Some` terminal value (0/1/2) for the side to move, or 3 if not terminal.
     */
    terminal(p1: number, p2: number): number;
    /**
     * Perfect-play value for the side to move: 0 win, 1 loss, 2 draw, 3 unknown.
     */
    value(p1: number, p2: number): number;
}

/**
 * Strongly solve the side-`n` Y board and return the raw per-index value bytes
 * (`1=win 2=loss 3=draw`, one byte each). This is the heavy call; the explorer
 * runs it inside a Web Worker so the page never blocks, then hands the bytes to
 * [`YExplorer::from_solution`] on the main thread for synchronous probing.
 */
export function solve_y(side: number): Uint8Array;

/**
 * Number of dense-index slots for the side-`n` Y board, i.e. how many positions
 * `solve_y` will resolve. Cheap (a few binomials) — the UI shows it before the
 * solve starts. `f64` to stay safe past `u32`, though interactive sides fit easily.
 */
export function y_num_states(side: number): number;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_explorer_free: (a: number, b: number) => void;
    readonly __wbg_yexplorer_free: (a: number, b: number) => void;
    readonly explorer_board_points: (a: number) => number;
    readonly explorer_has_tablebase: (a: number) => number;
    readonly explorer_legal_moves: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number];
    readonly explorer_new: (a: number, b: number) => number;
    readonly explorer_num_states: (a: number) => number;
    readonly explorer_set_tablebase: (a: number, b: number, c: number) => void;
    readonly explorer_start: (a: number) => [number, number];
    readonly explorer_terminal: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
    readonly explorer_value: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
    readonly solve_y: (a: number) => [number, number];
    readonly y_num_states: (a: number) => number;
    readonly yexplorer_cells: (a: number) => number;
    readonly yexplorer_from_solution: (a: number, b: number, c: number) => number;
    readonly yexplorer_legal_moves: (a: number, b: number, c: number) => [number, number];
    readonly yexplorer_new: (a: number) => number;
    readonly yexplorer_side: (a: number) => number;
    readonly yexplorer_start: (a: number) => [number, number];
    readonly yexplorer_terminal: (a: number, b: number, c: number) => number;
    readonly yexplorer_value: (a: number, b: number, c: number) => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
